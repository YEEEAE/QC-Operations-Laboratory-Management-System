import { createHash, randomBytes } from 'node:crypto';
import type { Kysely, Selectable, Transaction, UpdateObject } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { stableJson } from '../../../shared/json/stable-stringify.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { compareReading } from '../domain/run.js';
import type {
  InProcessCheckpoint,
  InProcessDeviation,
  InProcessHandover,
  InProcessHoldRequest,
  InProcessReading,
  InProcessRun,
  InProcessRunEvent,
  InProcessRunState,
  InProcessRunSummary,
  InProcessSourceCatalogue,
  InProcessSourceDocument,
  InProcessSourceFile,
  InProcessWorkspace,
} from '../domain/read-model.js';
import type {
  AcceptHandoverInput,
  CloseInProcessRunInput,
  DecideHoldInput,
  DisposeDeviationInput,
  FlagDeviationInput,
  InProcessRepository,
  RecordHandoverInput,
  RecordReadingInput,
  RequestHoldInput,
  ReviewInProcessRunInput,
  RunVersionedCommand,
  StartInProcessRunInput,
  SubmitInProcessRunInput,
  TranscribeCheckpointInput,
  VerifyCheckpointInput,
} from '../ports/repository.js';

type Tx = Transaction<DatabaseSchema>;
type RunRow = Awaited<ReturnType<typeof readRunRow>>;

const WORK_INSTRUCTION_TYPES = ['WI', 'INSTRUCTION'];
/** Controlled in-process form (F-823 family). Matched by document number only. */
const IN_PROCESS_FORM_NUMBER = /^F-?\s?823/i;

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

function runNumber(): string {
  const today = new Date();
  const stamp = today.toISOString().slice(0, 10).replaceAll('-', '');
  return `INP-${stamp}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

/** JSONB is returned parsed by the driver; tolerate a raw string defensively. */
function sourceFilesFrom(value: unknown): readonly InProcessSourceFile[] {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as InProcessSourceFile[];
    } catch {
      return [];
    }
  }
  return Array.isArray(value) ? (value as InProcessSourceFile[]) : [];
}

async function readRunRow(tx: Kysely<DatabaseSchema>, runId: string) {
  return tx.selectFrom('in_process_runs').selectAll().where('id', '=', runId).executeTakeFirst();
}

function mapRun(row: NonNullable<RunRow>): InProcessRun {
  return {
    id: row.id,
    runNo: row.run_no,
    itemCode: row.item_code,
    itemName: row.item_name,
    lotNo: row.lot_no,
    workOrderNo: row.work_order_no,
    batchNo: row.batch_no,
    productionLine: row.production_line,
    station: row.station,
    machine: row.machine,
    shiftCode: row.shift_code,
    state: row.state as InProcessRunState,
    wi: {
      documentId: row.wi_document_id,
      documentVersionId: row.wi_document_version_id,
      documentNo: row.wi_document_no,
      revision: row.wi_revision,
      contentHash: row.wi_content_hash,
      effectiveAt: row.wi_effective_at,
      sourceFileDigest: row.wi_source_file_digest,
      sourceFiles: sourceFilesFrom(row.wi_source_files_snapshot),
      applicabilityAssertedBy: row.wi_applicability_asserted_by,
      applicabilityVerifiedBy: row.wi_applicability_verified_by,
      applicabilityVerifiedAt: row.wi_applicability_verified_at,
    },
    form: {
      attachmentState: row.form_attachment_state as InProcessRun['form']['attachmentState'],
      documentId: row.form_document_id,
      documentVersionId: row.form_document_version_id,
      documentNo: row.form_document_no,
      revision: row.form_revision,
      contentHash: row.form_content_hash,
      sourceFiles:
        row.form_source_files_snapshot === null
          ? null
          : sourceFilesFrom(row.form_source_files_snapshot),
    },
    operatorId: row.operator_id,
    operatorLoginIdentity: row.operator_login_identity,
    qcObserverId: row.qc_observer_id,
    qcObserverLoginIdentity: row.qc_observer_login_identity,
    qcHoldState: row.qc_hold_state as InProcessRun['qcHoldState'],
    productReleaseState: 'NOT_RELEASED',
    disposition: row.disposition as InProcessRun['disposition'],
    dispositionNote: row.disposition_note,
    startedAt: row.started_at,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    closedAt: row.closed_at,
    version: BigInt(row.version),
    requestId: row.request_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PostgresInProcessRepository implements InProcessRepository {
  constructor(private readonly database: Kysely<DatabaseSchema>) {}

  private async appendEvent(
    tx: Tx,
    input: {
      runId: string;
      revisionNumber: bigint;
      eventType: InProcessRunEvent['eventType'];
      actor: ActorContext;
      reason?: string | null;
      snapshot: unknown;
      requestId: string;
    },
  ): Promise<void> {
    const serialized = stableJson(input.snapshot);
    await tx
      .insertInto('in_process_run_events')
      .values({
        run_id: input.runId,
        revision_number: input.revisionNumber,
        event_type: input.eventType,
        actor_id: input.actor.id,
        actor_login_identity: input.actor.loginIdentity ?? 'unknown',
        reason: input.reason ?? null,
        snapshot: serialized,
        snapshot_sha256: sha256(serialized),
        request_id: input.requestId,
      })
      .execute();
  }

  private async audit(input: {
    tx: Tx;
    actor: ActorContext;
    action: string;
    runId: string;
    oldState?: string;
    newState?: string;
    reason?: string;
    requestId: string;
    payload?: Record<string, unknown>;
  }): Promise<void> {
    await new PostgresAuditRepository(input.tx).append({
      actorType: 'USER',
      actorId: input.actor.id,
      subjectType: 'IN_PROCESS_RUN',
      subjectId: input.runId,
      action: input.action,
      oldState: input.oldState,
      newState: input.newState,
      reason: input.reason,
      requestId: input.requestId,
      payload: input.payload,
    });
  }

  /** Locks the run and rechecks the caller's expected version. */
  private async lockRun(tx: Tx, input: RunVersionedCommand) {
    const row = await tx
      .selectFrom('in_process_runs')
      .selectAll()
      .where('id', '=', input.runId)
      .forUpdate()
      .executeTakeFirst();
    if (!row) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (BigInt(row.version) !== input.expectedVersion)
      throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
    return row;
  }

  private async bumpRun(
    tx: Tx,
    runId: string,
    expectedVersion: bigint,
    change: UpdateObject<DatabaseSchema, 'in_process_runs'> = {},
  ) {
    const updated = await tx
      .updateTable('in_process_runs')
      .set({ ...change, version: expectedVersion + 1n, updated_at: new Date() })
      .where('id', '=', runId)
      .where('version', '=', expectedVersion)
      .returningAll()
      .executeTakeFirst();
    if (!updated) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
    return updated;
  }

  private assertRunEditable(state: string): void {
    if (!['IN_PROGRESS', 'RETURNED'].includes(state))
      throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
  }

  /**
   * Resolves one controlled document version as an approved, effective source.
   * Mirrors the documents module's fail-closed execution-context checks: the
   * version must be EFFECTIVE inside its effective window, reviewed, approved,
   * source-binding verified, and carry an ACTIVE file manifest with hashes.
   */
  private async resolveSourceDocument(
    tx: Tx,
    documentVersionId: string,
  ): Promise<InProcessSourceDocument> {
    const rows = await tx
      .selectFrom('document_versions as version')
      .innerJoin('document_identities as identity', 'identity.id', 'version.document_id')
      .innerJoin('document_version_files as link', 'link.document_version_id', 'version.id')
      .innerJoin('files as file', 'file.id', 'link.file_id')
      .select([
        'identity.id as documentId',
        'identity.document_no as documentNo',
        'identity.document_type as documentType',
        'identity.title as title',
        'identity.active as documentActive',
        'version.id as documentVersionId',
        'version.revision as revision',
        'version.state as state',
        'version.effective_at as effectiveAt',
        'version.effective_until as effectiveUntil',
        'version.approved_at as approvedAt',
        'version.reviewed_at as reviewedAt',
        'version.content_hash as contentHash',
        'version.source_binding_verified as sourceBindingVerified',
        'link.file_id as fileId',
        'link.file_role as fileRole',
        'file.original_filename as filename',
        'file.sha256 as sha256',
        'file.state as fileState',
      ])
      .where('version.id', '=', documentVersionId)
      .orderBy('link.file_id')
      .orderBy('link.file_role')
      .execute();

    if (!rows.length) throw new AppError('POLICY_SOURCE_REQUIRED', { userSafe: true });
    const head = rows[0];
    const now = new Date();
    if (
      !head.documentActive ||
      head.state !== 'EFFECTIVE' ||
      !head.approvedAt ||
      !head.reviewedAt ||
      !head.effectiveAt ||
      head.effectiveAt > now ||
      (head.effectiveUntil && head.effectiveUntil <= now) ||
      head.sourceBindingVerified !== true ||
      !head.contentHash ||
      !/^[0-9a-f]{64}$/.test(head.contentHash) ||
      rows.some(
        (row) => row.fileState !== 'ACTIVE' || !row.fileId || !/^[0-9a-f]{64}$/.test(row.sha256),
      )
    )
      throw new AppError('POLICY_SOURCE_REQUIRED', { userSafe: true });

    const manifest = rows.map((row) => ({
      fileId: row.fileId,
      fileRole: row.fileRole,
      sha256: row.sha256,
    }));
    return {
      documentId: head.documentId,
      documentVersionId: head.documentVersionId,
      documentNo: head.documentNo,
      documentType: head.documentType,
      title: head.title,
      revision: head.revision,
      contentHash: head.contentHash,
      effectiveAt: head.effectiveAt,
      sourceFileDigest: sha256(stableJson(manifest)),
      sourceFiles: rows.map((row) => ({
        fileId: row.fileId,
        fileRole: row.fileRole,
        filename: row.filename,
        sha256: row.sha256,
      })),
    };
  }

  async listSourceCatalogue(): Promise<InProcessSourceCatalogue> {
    const now = new Date();
    const rows = await this.database
      .selectFrom('document_versions as version')
      .innerJoin('document_identities as identity', 'identity.id', 'version.document_id')
      .innerJoin('document_version_files as link', 'link.document_version_id', 'version.id')
      .innerJoin('files as file', 'file.id', 'link.file_id')
      .select([
        'identity.id as documentId',
        'identity.document_no as documentNo',
        'identity.document_type as documentType',
        'identity.title as title',
        'identity.active as documentActive',
        'version.id as documentVersionId',
        'version.revision as revision',
        'version.effective_at as effectiveAt',
        'version.effective_until as effectiveUntil',
        'version.approved_at as approvedAt',
        'version.reviewed_at as reviewedAt',
        'version.content_hash as contentHash',
        'version.source_binding_verified as sourceBindingVerified',
        'link.file_id as fileId',
        'link.file_role as fileRole',
        'file.original_filename as filename',
        'file.sha256 as sha256',
        'file.state as fileState',
      ])
      .where('identity.active', '=', true)
      .where('version.state', '=', 'EFFECTIVE')
      .orderBy('identity.document_no')
      .orderBy('version.id')
      .orderBy('link.file_id')
      .execute();

    const grouped = new Map<string, InProcessSourceDocument>();
    const manifestByVersion = new Map<string, { fileId: string; fileRole: string; sha256: string }[]>();
    // One row is usable only when the version is inside its effective window,
    // reviewed, approved and source-binding verified, and every joined file is
    // ACTIVE with a hash. A partly usable version is excluded as a whole.
    const usable = (row: (typeof rows)[number]) =>
      Boolean(row.approvedAt) &&
      Boolean(row.reviewedAt) &&
      Boolean(row.effectiveAt) &&
      row.effectiveAt! <= now &&
      (!row.effectiveUntil || row.effectiveUntil > now) &&
      row.sourceBindingVerified === true &&
      Boolean(row.contentHash) &&
      /^[0-9a-f]{64}$/.test(row.contentHash ?? '') &&
      row.fileState === 'ACTIVE' &&
      /^[0-9a-f]{64}$/.test(row.sha256);
    for (const row of rows) {
      if (!usable(row)) continue;
      const manifest = manifestByVersion.get(row.documentVersionId) ?? [];
      manifest.push({ fileId: row.fileId, fileRole: row.fileRole, sha256: row.sha256 });
      manifestByVersion.set(row.documentVersionId, manifest);
      if (!grouped.has(row.documentVersionId)) {
        grouped.set(row.documentVersionId, {
          documentId: row.documentId,
          documentVersionId: row.documentVersionId,
          documentNo: row.documentNo,
          documentType: row.documentType,
          title: row.title,
          revision: row.revision,
          contentHash: row.contentHash,
          effectiveAt: row.effectiveAt,
          sourceFileDigest: '',
          sourceFiles: [],
        });
      }
    }

    const documents = [...grouped.values()].map((document) => {
      const manifest = manifestByVersion.get(document.documentVersionId) ?? [];
      return {
        ...document,
        sourceFileDigest: sha256(stableJson(manifest)),
        sourceFiles: rows
          .filter((row) => row.documentVersionId === document.documentVersionId && usable(row))
          .map((row) => ({
            fileId: row.fileId,
            fileRole: row.fileRole,
            filename: row.filename,
            sha256: row.sha256,
          })),
      };
    });

    const workInstructions = documents.filter((document) =>
      WORK_INSTRUCTION_TYPES.includes(document.documentType),
    );
    const controlledForms = documents.filter((document) =>
      IN_PROCESS_FORM_NUMBER.test(document.documentNo),
    );
    return {
      workInstructions,
      controlledForms,
      state: workInstructions.length ? 'WI_SOURCE_AVAILABLE' : 'WI_SOURCE_REQUIRED',
    };
  }

  async listRuns(): Promise<readonly InProcessRunSummary[]> {
    const rows = await this.database
      .selectFrom('in_process_runs')
      .select([
        'id',
        'run_no',
        'item_code',
        'item_name',
        'lot_no',
        'production_line',
        'shift_code',
        'state',
        'qc_hold_state',
        'wi_document_no',
        'wi_revision',
        'form_attachment_state',
        'operator_id',
        'operator_login_identity',
        'started_at',
        'version',
      ])
      .orderBy('started_at', 'desc')
      .limit(100)
      .execute();
    return rows.map((row) => ({
      id: row.id,
      runNo: row.run_no,
      itemCode: row.item_code,
      itemName: row.item_name,
      lotNo: row.lot_no,
      productionLine: row.production_line,
      shiftCode: row.shift_code,
      state: row.state as InProcessRunState,
      qcHoldState: row.qc_hold_state as InProcessRunSummary['qcHoldState'],
      wiDocumentNo: row.wi_document_no,
      wiRevision: row.wi_revision,
      formAttachmentState:
        row.form_attachment_state as InProcessRunSummary['formAttachmentState'],
      operatorId: row.operator_id,
      operatorLoginIdentity: row.operator_login_identity,
      startedAt: row.started_at,
      version: BigInt(row.version),
    }));
  }

  async getRun(runId: string): Promise<InProcessWorkspace | undefined> {
    const row = await readRunRow(this.database, runId);
    if (!row) return undefined;
    const [checkpoints, readings, deviations, holdRequests, handovers, events] = await Promise.all([
      this.database
        .selectFrom('in_process_checkpoints')
        .selectAll()
        .where('run_id', '=', runId)
        .orderBy('position')
        .execute(),
      this.database
        .selectFrom('in_process_readings')
        .selectAll()
        .where('run_id', '=', runId)
        .orderBy('recorded_at')
        .execute(),
      this.database
        .selectFrom('in_process_deviations')
        .selectAll()
        .where('run_id', '=', runId)
        .orderBy('flagged_at')
        .execute(),
      this.database
        .selectFrom('in_process_hold_requests')
        .selectAll()
        .where('run_id', '=', runId)
        .orderBy('requested_at')
        .execute(),
      this.database
        .selectFrom('in_process_handovers')
        .selectAll()
        .where('run_id', '=', runId)
        .orderBy('handed_over_at')
        .execute(),
      this.database
        .selectFrom('in_process_run_events')
        .selectAll()
        .where('run_id', '=', runId)
        .orderBy('revision_number')
        .execute(),
    ]);
    return {
      run: mapRun(row),
      checkpoints: checkpoints.map(mapCheckpoint),
      readings: readings.map(mapReading),
      deviations: deviations.map(mapDeviation),
      holdRequests: holdRequests.map(mapHoldRequest),
      handovers: handovers.map(mapHandover),
      events: events.map(mapEvent),
    };
  }

  async startRun(input: StartInProcessRunInput): Promise<InProcessRun> {
    return this.database.transaction().execute(async (tx) => {
      const wi = await this.resolveSourceDocument(tx, input.wiDocumentVersionId);
      if (!WORK_INSTRUCTION_TYPES.includes(wi.documentType))
        throw new AppError('POLICY_SOURCE_REQUIRED', { userSafe: true });
      const form = input.formDocumentVersionId
        ? await this.resolveSourceDocument(tx, input.formDocumentVersionId)
        : undefined;
      if (form && !IN_PROCESS_FORM_NUMBER.test(form.documentNo))
        throw new AppError('POLICY_SOURCE_REQUIRED', { userSafe: true });

      const id = uuidv7();
      const created = await tx
        .insertInto('in_process_runs')
        .values({
          id,
          run_no: runNumber(),
          item_code: input.itemCode,
          item_name: input.itemName,
          lot_no: input.lotNo,
          work_order_no: input.workOrderNo ?? null,
          batch_no: input.batchNo ?? null,
          production_line: input.productionLine,
          station: input.station ?? null,
          machine: input.machine ?? null,
          shift_code: input.shiftCode,
          state: 'IN_PROGRESS',
          wi_document_id: wi.documentId,
          wi_document_version_id: wi.documentVersionId,
          wi_document_no: wi.documentNo,
          wi_revision: wi.revision,
          wi_content_hash: wi.contentHash,
          wi_effective_at: wi.effectiveAt,
          wi_source_file_digest: wi.sourceFileDigest,
          wi_source_files_snapshot: stableJson(wi.sourceFiles),
          wi_applicability_asserted_by: input.actor.id,
          form_document_id: form?.documentId ?? null,
          form_document_version_id: form?.documentVersionId ?? null,
          form_document_no: form?.documentNo ?? null,
          form_revision: form?.revision ?? null,
          form_content_hash: form?.contentHash ?? null,
          form_source_files_snapshot: form ? stableJson(form.sourceFiles) : null,
          form_attachment_state: form ? 'ATTACHED' : 'NOT_ATTACHED_SOURCE_REQUIRED',
          operator_id: input.actor.id,
          operator_login_identity: input.actor.loginIdentity ?? 'unknown',
          request_id: input.requestId,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      await this.appendEvent(tx, {
        runId: id,
        revisionNumber: 1n,
        eventType: 'STARTED',
        actor: input.actor,
        snapshot: {
          runNo: created.run_no,
          state: created.state,
          itemCode: created.item_code,
          itemName: created.item_name,
          lotNo: created.lot_no,
          productionLine: created.production_line,
          shiftCode: created.shift_code,
          workInstructionNo: wi.documentNo,
          workInstructionRevision: wi.revision,
          workInstructionContentHash: wi.contentHash,
          workInstructionSourceFileDigest: wi.sourceFileDigest,
          formAttachmentState: created.form_attachment_state,
          formDocumentNo: form?.documentNo ?? null,
          formRevision: form?.revision ?? null,
        },
        requestId: input.requestId,
      });
      await this.audit({
        tx,
        actor: input.actor,
        action: 'IN_PROCESS_RUN_STARTED',
        runId: id,
        newState: 'IN_PROGRESS',
        requestId: input.requestId,
        payload: {
          runNo: created.run_no,
          wiDocumentNo: wi.documentNo,
          wiRevision: wi.revision,
          formAttachmentState: created.form_attachment_state,
        },
      });
      return mapRun(created);
    });
  }

  async transcribeCheckpoint(input: TranscribeCheckpointInput): Promise<InProcessCheckpoint> {
    return this.database.transaction().execute(async (tx) => {
      const run = await this.lockRun(tx, input);
      this.assertRunEditable(run.state);
      const existingPositions = await tx
        .selectFrom('in_process_checkpoints')
        .select('position')
        .where('run_id', '=', run.id)
        .execute();
      const position =
        existingPositions.reduce((highest, row) => Math.max(highest, Number(row.position)), 0) + 1;
      const created = await tx
        .insertInto('in_process_checkpoints')
        .values({
          run_id: run.id,
          position,
          step_reference: input.stepReference,
          parameter_name: input.parameterName,
          unit: input.unit ?? null,
          frequency_text: input.frequencyText,
          sampling_text: input.samplingText ?? null,
          acceptance_criteria_text: input.acceptanceCriteriaText,
          lower_limit_text: input.lowerLimitText ?? null,
          upper_limit_text: input.upperLimitText ?? null,
          wi_revision: run.wi_revision,
          transcribed_by: input.actor.id,
          transcribed_login_identity: input.actor.loginIdentity ?? 'unknown',
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      const revision = input.expectedVersion + 1n;
      await this.bumpRun(tx, run.id, input.expectedVersion);
      await this.appendEvent(tx, {
        runId: run.id,
        revisionNumber: revision,
        eventType: 'CHECKPOINT_TRANSCRIBED',
        actor: input.actor,
        snapshot: {
          checkpointId: created.id,
          position,
          stepReference: created.step_reference,
          parameterName: created.parameter_name,
          unit: created.unit,
          frequencyText: created.frequency_text,
          samplingText: created.sampling_text,
          acceptanceCriteriaText: created.acceptance_criteria_text,
          lowerLimitText: created.lower_limit_text,
          upperLimitText: created.upper_limit_text,
          wiRevision: created.wi_revision,
        },
        requestId: input.requestId,
      });
      await this.audit({
        tx,
        actor: input.actor,
        action: 'IN_PROCESS_CHECKPOINT_TRANSCRIBED',
        runId: run.id,
        requestId: input.requestId,
        payload: { checkpointId: created.id, position, wiRevision: created.wi_revision },
      });
      return mapCheckpoint(created);
    });
  }

  async verifyCheckpoint(input: VerifyCheckpointInput): Promise<InProcessCheckpoint> {
    return this.database.transaction().execute(async (tx) => {
      const run = await this.lockRun(tx, input);
      this.assertRunEditable(run.state);
      const checkpoint = await tx
        .selectFrom('in_process_checkpoints')
        .selectAll()
        .where('id', '=', input.checkpointId)
        .where('run_id', '=', run.id)
        .forUpdate()
        .executeTakeFirst();
      if (!checkpoint) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      if (checkpoint.verification_state === 'QC_VERIFIED')
        throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
      // Verification is a second-person control on the same run.
      if (input.actor.id === checkpoint.transcribed_by || input.actor.id === run.operator_id)
        throw new AppError('AUTHZ_SOD_VIOLATION', { userSafe: true });

      const now = new Date();
      const verified = await tx
        .updateTable('in_process_checkpoints')
        .set({
          verification_state: 'QC_VERIFIED',
          verified_by: input.actor.id,
          verified_at: now,
          verified_against_revision: run.wi_revision,
          version: BigInt(checkpoint.version) + 1n,
        })
        .where('id', '=', input.checkpointId)
        .where('version', '=', BigInt(input.checkpointVersion))
        .returningAll()
        .executeTakeFirst();
      if (!verified) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });

      // The QC observer and WI applicability are recorded from the person who
      // actually verified the criteria against the pinned revision.
      const runChange: UpdateObject<DatabaseSchema, 'in_process_runs'> = {
        qc_observer_id: run.qc_observer_id ?? input.actor.id,
        qc_observer_login_identity: run.qc_observer_login_identity ?? input.actor.loginIdentity ?? 'unknown',
      };
      if (!run.wi_applicability_verified_by) {
        runChange.wi_applicability_verified_by = input.actor.id;
        runChange.wi_applicability_verified_at = now;
      }
      const revision = input.expectedVersion + 1n;
      await this.bumpRun(tx, run.id, input.expectedVersion, runChange);
      await this.appendEvent(tx, {
        runId: run.id,
        revisionNumber: revision,
        eventType: 'CHECKPOINT_VERIFIED',
        actor: input.actor,
        snapshot: {
          checkpointId: verified.id,
          parameterName: verified.parameter_name,
          stepReference: verified.step_reference,
          verifiedAgainstRevision: verified.verified_against_revision,
          acceptanceCriteriaText: verified.acceptance_criteria_text,
          lowerLimitText: verified.lower_limit_text,
          upperLimitText: verified.upper_limit_text,
        },
        requestId: input.requestId,
      });
      await this.audit({
        tx,
        actor: input.actor,
        action: 'IN_PROCESS_CHECKPOINT_VERIFIED',
        runId: run.id,
        requestId: input.requestId,
        payload: {
          checkpointId: verified.id,
          wiRevision: run.wi_revision,
        },
      });
      return mapCheckpoint(verified);
    });
  }

  async recordReading(input: RecordReadingInput): Promise<InProcessReading> {
    return this.database.transaction().execute(async (tx) => {
      const run = await this.lockRun(tx, input);
      this.assertRunEditable(run.state);
      const checkpointRow = await tx
        .selectFrom('in_process_checkpoints')
        .selectAll()
        .where('id', '=', input.checkpointId)
        .where('run_id', '=', run.id)
        .executeTakeFirst();
      if (!checkpointRow) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      if (checkpointRow.verification_state !== 'QC_VERIFIED')
        throw new AppError('POLICY_SOURCE_REQUIRED', {
          userSafe: true,
          messageKey: 'in-process.checkpoint-source-verification-required',
        });
      const checkpoint = mapCheckpoint(checkpointRow);
      const comparison = compareReading(
        {
          valueText: input.valueText,
          lowerLimitText: checkpoint.lowerLimitText,
          upperLimitText: checkpoint.upperLimitText,
        },
        checkpoint,
      );
      const readingId = uuidv7();
      await tx
        .updateTable('in_process_readings')
        .set({
          entry_state: 'SUPERSEDED',
          superseded_by_reading_id: readingId,
          superseded_at: new Date(),
          superseded_reason: 'Replaced by a later entry for the same checkpoint.',
        })
        .where('run_id', '=', run.id)
        .where('checkpoint_id', '=', checkpoint.id)
        .where('entry_state', '=', 'DRAFT')
        .execute();
      const created = await tx
        .insertInto('in_process_readings')
        .values({
          id: readingId,
          run_id: run.id,
          checkpoint_id: checkpoint.id,
          sample_reference: input.sampleReference ?? null,
          entry_state: input.entryState,
          value_text: input.valueText,
          unit: input.unit ?? checkpoint.unit,
          observed_at: input.observedAt,
          comparison_state: comparison.comparisonState,
          comparison_note: comparison.comparisonNote,
          recorded_by: input.actor.id,
          recorded_login_identity: input.actor.loginIdentity ?? 'unknown',
          request_id: input.requestId,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      const revision = input.expectedVersion + 1n;
      await this.bumpRun(tx, run.id, input.expectedVersion);
      await this.appendEvent(tx, {
        runId: run.id,
        revisionNumber: revision,
        eventType: input.entryState === 'DRAFT' ? 'READING_DRAFTED' : 'READING_RECORDED',
        actor: input.actor,
        snapshot: {
          readingId: created.id,
          checkpointId: created.checkpoint_id,
          entryState: created.entry_state,
          valueText: created.value_text,
          unit: created.unit,
          observedAt: created.observed_at.toISOString(),
          comparisonState: created.comparison_state,
        },
        requestId: input.requestId,
      });
      await this.audit({
        tx,
        actor: input.actor,
        action: input.entryState === 'DRAFT' ? 'IN_PROCESS_READING_DRAFTED' : 'IN_PROCESS_READING_RECORDED',
        runId: run.id,
        requestId: input.requestId,
        payload: { readingId: created.id, comparisonState: created.comparison_state },
      });
      return mapReading(created);
    });
  }

  async flagDeviation(input: FlagDeviationInput): Promise<InProcessDeviation> {
    return this.database.transaction().execute(async (tx) => {
      const run = await this.lockRun(tx, input);
      if (!['IN_PROGRESS', 'RETURNED', 'AWAITING_QC_REVIEW'].includes(run.state))
        throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
      if (input.readingId) {
        const reading = await tx
          .selectFrom('in_process_readings')
          .select(['id', 'run_id'])
          .where('id', '=', input.readingId)
          .executeTakeFirst();
        if (!reading || reading.run_id !== run.id)
          throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      }
      const existing = await tx
        .selectFrom('in_process_deviations')
        .select(({ fn }) => fn.countAll<string>().as('total'))
        .where('run_id', '=', run.id)
        .executeTakeFirst();
      const sequence = Number(existing?.total ?? 0) + 1;
      const snapshot = stableJson({
        runNo: run.run_no,
        runRevision: input.expectedVersion,
        itemCode: run.item_code,
        lotNo: run.lot_no,
        workInstructionNo: run.wi_document_no,
        workInstructionRevision: run.wi_revision,
        checkpointId: input.checkpointId ?? null,
        readingId: input.readingId ?? null,
        category: input.category,
        description: input.description,
        containmentState: input.containmentState,
        immediateContainment: input.immediateContainment ?? null,
        capturedAt: new Date().toISOString(),
      });
      const created = await tx
        .insertInto('in_process_deviations')
        .values({
          deviation_no: `${run.run_no}-DEV-${String(sequence).padStart(2, '0')}`,
          run_id: run.id,
          run_revision: input.expectedVersion,
          checkpoint_id: input.checkpointId ?? null,
          reading_id: input.readingId ?? null,
          category: input.category,
          description: input.description,
          containment_state: input.containmentState,
          immediate_containment: input.immediateContainment ?? null,
          flagged_by: input.actor.id,
          flagged_login_identity: input.actor.loginIdentity ?? 'unknown',
          snapshot,
          snapshot_sha256: sha256(snapshot),
          request_id: input.requestId,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      const revision = input.expectedVersion + 1n;
      await this.bumpRun(tx, run.id, input.expectedVersion);
      await this.appendEvent(tx, {
        runId: run.id,
        revisionNumber: revision,
        eventType: 'DEVIATION_FLAGGED',
        actor: input.actor,
        snapshot: {
          deviationId: created.id,
          deviationNo: created.deviation_no,
          category: created.category,
          severity: created.severity,
          readingId: created.reading_id,
          runRevision: input.expectedVersion,
        },
        requestId: input.requestId,
      });
      await this.audit({
        tx,
        actor: input.actor,
        action: 'IN_PROCESS_DEVIATION_FLAGGED',
        runId: run.id,
        requestId: input.requestId,
        payload: {
          deviationId: created.id,
          deviationNo: created.deviation_no,
          category: created.category,
        },
      });
      return mapDeviation(created);
    });
  }

  async disposeDeviation(input: DisposeDeviationInput): Promise<InProcessDeviation> {
    return this.database.transaction().execute(async (tx) => {
      const run = await this.lockRun(tx, input);
      if (!['AWAITING_QC_REVIEW', 'QC_REVIEWED'].includes(run.state))
        throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
      const deviation = await tx
        .selectFrom('in_process_deviations')
        .selectAll()
        .where('id', '=', input.deviationId)
        .where('run_id', '=', run.id)
        .forUpdate()
        .executeTakeFirst();
      if (!deviation) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      const now = new Date();
      const updated = await tx
        .updateTable('in_process_deviations')
        .set({
          severity: input.severity,
          classified_by: deviation.classified_by ?? input.actor.id,
          classified_at: deviation.classified_at ?? now,
          status: input.status,
          disposition_note: input.dispositionNote,
        })
        .where('id', '=', deviation.id)
        .returningAll()
        .executeTakeFirstOrThrow();
      const revision = input.expectedVersion + 1n;
      await this.bumpRun(tx, run.id, input.expectedVersion);
      await this.appendEvent(tx, {
        runId: run.id,
        revisionNumber: revision,
        eventType: 'DEVIATION_DISPOSITIONED',
        actor: input.actor,
        reason: input.dispositionNote,
        snapshot: {
          deviationId: updated.id,
          deviationNo: updated.deviation_no,
          severity: updated.severity,
          status: updated.status,
          dispositionNote: updated.disposition_note,
        },
        requestId: input.requestId,
      });
      await this.audit({
        tx,
        actor: input.actor,
        action: 'IN_PROCESS_DEVIATION_DISPOSITIONED',
        runId: run.id,
        newState: updated.status,
        oldState: deviation.status,
        reason: input.dispositionNote,
        requestId: input.requestId,
        payload: { deviationId: updated.id, severity: updated.severity },
      });
      return mapDeviation(updated);
    });
  }

  async requestHold(input: RequestHoldInput): Promise<InProcessHoldRequest> {
    return this.database.transaction().execute(async (tx) => {
      const run = await this.lockRun(tx, input);
      if (!['IN_PROGRESS', 'RETURNED', 'AWAITING_QC_REVIEW'].includes(run.state))
        throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
      if (input.deviationId) {
        const deviation = await tx
          .selectFrom('in_process_deviations')
          .select(['id', 'run_id'])
          .where('id', '=', input.deviationId)
          .executeTakeFirst();
        if (!deviation || deviation.run_id !== run.id)
          throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      }
      const created = await tx
        .insertInto('in_process_hold_requests')
        .values({
          run_id: run.id,
          run_revision: input.expectedVersion,
          deviation_id: input.deviationId ?? null,
          reason: input.reason,
          requested_by: input.actor.id,
          requested_login_identity: input.actor.loginIdentity ?? 'unknown',
          request_id: input.requestId,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      const revision = input.expectedVersion + 1n;
      await this.bumpRun(tx, run.id, input.expectedVersion, { qc_hold_state: 'REQUESTED' });
      await this.appendEvent(tx, {
        runId: run.id,
        revisionNumber: revision,
        eventType: 'HOLD_REQUESTED',
        actor: input.actor,
        reason: input.reason,
        snapshot: {
          holdRequestId: created.id,
          runRevision: input.expectedVersion,
          deviationId: created.deviation_id,
          reason: created.reason,
        },
        requestId: input.requestId,
      });
      await this.audit({
        tx,
        actor: input.actor,
        action: 'IN_PROCESS_QC_HOLD_REQUESTED',
        runId: run.id,
        requestId: input.requestId,
        reason: input.reason,
        payload: { holdRequestId: created.id },
      });
      return mapHoldRequest(created);
    });
  }

  async decideHold(input: DecideHoldInput): Promise<InProcessHoldRequest> {
    return this.database.transaction().execute(async (tx) => {
      const run = await this.lockRun(tx, input);
      const hold = await tx
        .selectFrom('in_process_hold_requests')
        .selectAll()
        .where('id', '=', input.holdRequestId)
        .where('run_id', '=', run.id)
        .forUpdate()
        .executeTakeFirst();
      if (!hold) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      if (hold.status !== 'REQUESTED') throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
      if (input.actor.id === hold.requested_by)
        throw new AppError('AUTHZ_SOD_VIOLATION', { userSafe: true });
      const updated = await tx
        .updateTable('in_process_hold_requests')
        .set({
          status: input.decision,
          decision_note: input.decisionNote,
          decided_by: input.actor.id,
          decided_at: new Date(),
        })
        .where('id', '=', hold.id)
        .returningAll()
        .executeTakeFirstOrThrow();
      const revision = input.expectedVersion + 1n;
      await this.bumpRun(tx, run.id, input.expectedVersion, { qc_hold_state: input.decision });
      await this.appendEvent(tx, {
        runId: run.id,
        revisionNumber: revision,
        eventType: 'HOLD_DECIDED',
        actor: input.actor,
        reason: input.decisionNote,
        snapshot: {
          holdRequestId: updated.id,
          status: updated.status,
          decisionNote: updated.decision_note,
        },
        requestId: input.requestId,
      });
      await this.audit({
        tx,
        actor: input.actor,
        action: 'IN_PROCESS_QC_HOLD_DECIDED',
        runId: run.id,
        newState: updated.status,
        oldState: hold.status,
        reason: input.decisionNote,
        requestId: input.requestId,
        payload: { holdRequestId: updated.id },
      });
      return mapHoldRequest(updated);
    });
  }

  async recordHandover(input: RecordHandoverInput): Promise<InProcessHandover> {
    return this.database.transaction().execute(async (tx) => {
      const run = await this.lockRun(tx, input);
      this.assertRunEditable(run.state);
      if (input.toShiftCode === run.shift_code)
        throw new AppError('VALIDATION_FAILED', {
          userSafe: true,
          fieldErrors: { toShiftCode: ['Choose the incoming shift; it must differ from the current shift.'] },
        });
      const created = await tx
        .insertInto('in_process_handovers')
        .values({
          run_id: run.id,
          run_revision: input.expectedVersion,
          from_shift_code: run.shift_code,
          to_shift_code: input.toShiftCode,
          from_operator_id: run.operator_id,
          handover_note: input.handoverNote,
          handed_over_by: input.actor.id,
          handed_over_login_identity: input.actor.loginIdentity ?? 'unknown',
          request_id: input.requestId,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      const revision = input.expectedVersion + 1n;
      await this.bumpRun(tx, run.id, input.expectedVersion);
      await this.appendEvent(tx, {
        runId: run.id,
        revisionNumber: revision,
        eventType: 'HANDOVER_RECORDED',
        actor: input.actor,
        snapshot: {
          handoverId: created.id,
          runRevision: input.expectedVersion,
          fromShiftCode: created.from_shift_code,
          toShiftCode: created.to_shift_code,
          fromOperatorId: created.from_operator_id,
          handoverNote: created.handover_note,
        },
        requestId: input.requestId,
      });
      await this.audit({
        tx,
        actor: input.actor,
        action: 'IN_PROCESS_HANDOVER_RECORDED',
        runId: run.id,
        requestId: input.requestId,
        payload: {
          handoverId: created.id,
          fromShiftCode: created.from_shift_code,
          toShiftCode: created.to_shift_code,
        },
      });
      return mapHandover(created);
    });
  }

  async acceptHandover(input: AcceptHandoverInput): Promise<InProcessHandover> {
    return this.database.transaction().execute(async (tx) => {
      const run = await this.lockRun(tx, input);
      this.assertRunEditable(run.state);
      const handover = await tx
        .selectFrom('in_process_handovers')
        .selectAll()
        .where('id', '=', input.handoverId)
        .where('run_id', '=', run.id)
        .forUpdate()
        .executeTakeFirst();
      if (!handover) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      if (handover.status !== 'PENDING_ACCEPTANCE')
        throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
      if (input.actor.id === handover.handed_over_by)
        throw new AppError('AUTHZ_SOD_VIOLATION', { userSafe: true });
      const now = new Date();
      const updated = await tx
        .updateTable('in_process_handovers')
        .set({
          status: 'ACCEPTED',
          to_operator_id: input.actor.id,
          accepted_by: input.actor.id,
          accepted_at: now,
        })
        .where('id', '=', handover.id)
        .returningAll()
        .executeTakeFirstOrThrow();
      const revision = input.expectedVersion + 1n;
      await this.bumpRun(tx, run.id, input.expectedVersion, {
        operator_id: input.actor.id,
        operator_login_identity: input.actor.loginIdentity ?? 'unknown',
        shift_code: updated.to_shift_code,
      });
      await this.appendEvent(tx, {
        runId: run.id,
        revisionNumber: revision,
        eventType: 'HANDOVER_ACCEPTED',
        actor: input.actor,
        snapshot: {
          handoverId: updated.id,
          shiftCode: updated.to_shift_code,
          operatorId: input.actor.id,
          acceptedAt: updated.accepted_at?.toISOString() ?? null,
        },
        requestId: input.requestId,
      });
      await this.audit({
        tx,
        actor: input.actor,
        action: 'IN_PROCESS_HANDOVER_ACCEPTED',
        runId: run.id,
        requestId: input.requestId,
        payload: { handoverId: updated.id, shiftCode: updated.to_shift_code },
      });
      return mapHandover(updated);
    });
  }

  async submitRun(input: SubmitInProcessRunInput): Promise<InProcessRun> {
    if (input.blockers.length)
      throw new AppError('VALIDATION_FAILED', {
        userSafe: true,
        fieldErrors: { submission: [...input.blockers] },
      });
    return this.database.transaction().execute(async (tx) => {
      const run = await this.lockRun(tx, input);
      this.assertRunEditable(run.state);
      const revision = input.expectedVersion + 1n;
      const updated = await this.bumpRun(tx, run.id, input.expectedVersion, {
        state: 'AWAITING_QC_REVIEW',
        submitted_at: new Date(),
      });
      await this.appendEvent(tx, {
        runId: run.id,
        revisionNumber: revision,
        eventType: 'SUBMITTED',
        actor: input.actor,
        snapshot: {
          state: updated.state,
          submittedAt: updated.submitted_at?.toISOString() ?? null,
          workInstructionNo: updated.wi_document_no,
          workInstructionRevision: updated.wi_revision,
        },
        requestId: input.requestId,
      });
      await this.audit({
        tx,
        actor: input.actor,
        action: 'IN_PROCESS_RUN_SUBMITTED',
        runId: run.id,
        oldState: run.state,
        newState: updated.state,
        requestId: input.requestId,
      });
      return mapRun(updated);
    });
  }

  async reviewRun(input: ReviewInProcessRunInput): Promise<InProcessRun> {
    return this.database.transaction().execute(async (tx) => {
      const run = await this.lockRun(tx, input);
      if (run.state !== 'AWAITING_QC_REVIEW')
        throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
      if (input.actor.id === run.operator_id)
        throw new AppError('AUTHZ_SOD_VIOLATION', { userSafe: true });
      const now = new Date();
      const revision = input.expectedVersion + 1n;
      const updated = await this.bumpRun(tx, run.id, input.expectedVersion, {
        state: input.action === 'RETURN' ? 'RETURNED' : 'QC_REVIEWED',
        reviewed_at: input.action === 'QC_REVIEW' ? now : run.reviewed_at,
        qc_observer_id: run.qc_observer_id ?? input.actor.id,
        qc_observer_login_identity:
          run.qc_observer_login_identity ?? input.actor.loginIdentity ?? 'unknown',
      });
      await this.appendEvent(tx, {
        runId: run.id,
        revisionNumber: revision,
        eventType: input.action === 'RETURN' ? 'RETURNED' : 'QC_REVIEWED',
        actor: input.actor,
        reason: input.reason,
        snapshot: {
          state: updated.state,
          reviewedAt: updated.reviewed_at?.toISOString() ?? null,
          reason: input.reason,
          productReleaseState: updated.product_release_state,
        },
        requestId: input.requestId,
      });
      await this.audit({
        tx,
        actor: input.actor,
        action: input.action === 'RETURN' ? 'IN_PROCESS_RUN_RETURNED' : 'IN_PROCESS_RUN_QC_REVIEWED',
        runId: run.id,
        oldState: run.state,
        newState: updated.state,
        reason: input.reason,
        requestId: input.requestId,
      });
      return mapRun(updated);
    });
  }

  async closeRun(input: CloseInProcessRunInput): Promise<InProcessRun> {
    return this.database.transaction().execute(async (tx) => {
      const run = await this.lockRun(tx, input);
      if (run.state !== 'QC_REVIEWED')
        throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
      const unresolved = await tx
        .selectFrom('in_process_deviations')
        .select('id')
        .where('run_id', '=', run.id)
        .where('status', 'in', ['OPEN', 'UNDER_QC_REVIEW'])
        .execute();
      if (unresolved.length)
        throw new AppError('VALIDATION_FAILED', {
          userSafe: true,
          fieldErrors: {
            disposition: ['Every flagged deviation needs a recorded human disposition before closure.'],
          },
        });
      const undecidedHolds = await tx
        .selectFrom('in_process_hold_requests')
        .select('id')
        .where('run_id', '=', run.id)
        .where('status', '=', 'REQUESTED')
        .execute();
      if (undecidedHolds.length)
        throw new AppError('VALIDATION_FAILED', {
          userSafe: true,
          fieldErrors: {
            disposition: ['An undecided QC hold request must be acknowledged or declined before closure.'],
          },
        });
      if (input.disposition === 'QC_HOLD_REQUESTED') {
        const holds = await tx
          .selectFrom('in_process_hold_requests')
          .select('id')
          .where('run_id', '=', run.id)
          .where('status', 'in', ['REQUESTED', 'ACKNOWLEDGED'])
          .execute();
        if (!holds.length)
          throw new AppError('VALIDATION_FAILED', {
            userSafe: true,
            fieldErrors: {
              disposition: ['Record the QC hold request before closing with that disposition.'],
            },
          });
      }
      const now = new Date();
      const revision = input.expectedVersion + 1n;
      const updated = await this.bumpRun(tx, run.id, input.expectedVersion, {
        state: 'CLOSED',
        closed_at: now,
        disposition: input.disposition,
        disposition_note: input.dispositionNote,
      });
      await this.appendEvent(tx, {
        runId: run.id,
        revisionNumber: revision,
        eventType: 'CLOSED',
        actor: input.actor,
        reason: input.dispositionNote,
        snapshot: {
          state: updated.state,
          disposition: updated.disposition,
          dispositionNote: updated.disposition_note,
          closedAt: updated.closed_at?.toISOString() ?? null,
          productReleaseState: updated.product_release_state,
          workInstructionNo: updated.wi_document_no,
          workInstructionRevision: updated.wi_revision,
        },
        requestId: input.requestId,
      });
      await this.audit({
        tx,
        actor: input.actor,
        action: 'IN_PROCESS_RUN_CLOSED',
        runId: run.id,
        oldState: run.state,
        newState: updated.state,
        reason: input.dispositionNote,
        requestId: input.requestId,
        payload: {
          disposition: input.disposition,
          productReleaseState: updated.product_release_state,
        },
      });
      return mapRun(updated);
    });
  }
}

function mapCheckpoint(row: Selectable<DatabaseSchema['in_process_checkpoints']>): InProcessCheckpoint {
  return {
    id: row.id,
    runId: row.run_id,
    position: Number(row.position),
    stepReference: row.step_reference,
    parameterName: row.parameter_name,
    unit: row.unit,
    frequencyText: row.frequency_text,
    samplingText: row.sampling_text,
    acceptanceCriteriaText: row.acceptance_criteria_text,
    lowerLimitText: row.lower_limit_text,
    upperLimitText: row.upper_limit_text,
    requirementSource: 'WI_TRANSCRIPTION',
    wiRevision: row.wi_revision,
    verificationState: row.verification_state as InProcessCheckpoint['verificationState'],
    transcribedBy: row.transcribed_by,
    transcribedLoginIdentity: row.transcribed_login_identity,
    transcribedAt: row.transcribed_at,
    verifiedBy: row.verified_by,
    verifiedAt: row.verified_at,
    verifiedAgainstRevision: row.verified_against_revision,
    version: BigInt(row.version),
  };
}

function mapReading(row: Selectable<DatabaseSchema['in_process_readings']>): InProcessReading {
  return {
    id: row.id,
    runId: row.run_id,
    checkpointId: row.checkpoint_id,
    sampleReference: row.sample_reference,
    entryState: row.entry_state as InProcessReading['entryState'],
    valueText: row.value_text,
    unit: row.unit,
    observedAt: row.observed_at,
    comparisonState: row.comparison_state as InProcessReading['comparisonState'],
    comparisonNote: row.comparison_note,
    recordedBy: row.recorded_by,
    recordedLoginIdentity: row.recorded_login_identity,
    recordedAt: row.recorded_at,
    supersededByReadingId: row.superseded_by_reading_id,
    supersededAt: row.superseded_at,
    supersededReason: row.superseded_reason,
    requestId: row.request_id,
  };
}

function mapDeviation(row: Selectable<DatabaseSchema['in_process_deviations']>): InProcessDeviation {
  return {
    id: row.id,
    deviationNo: row.deviation_no,
    runId: row.run_id,
    runRevision: BigInt(row.run_revision),
    checkpointId: row.checkpoint_id,
    readingId: row.reading_id,
    category: row.category as InProcessDeviation['category'],
    severity: row.severity as InProcessDeviation['severity'],
    description: row.description,
    containmentState: row.containment_state as InProcessDeviation['containmentState'],
    immediateContainment: row.immediate_containment,
    status: row.status as InProcessDeviation['status'],
    dispositionNote: row.disposition_note,
    classifiedBy: row.classified_by,
    classifiedAt: row.classified_at,
    flaggedBy: row.flagged_by,
    flaggedLoginIdentity: row.flagged_login_identity,
    flaggedAt: row.flagged_at,
    snapshotSha256: row.snapshot_sha256,
    requestId: row.request_id,
  };
}

function mapHoldRequest(row: Selectable<DatabaseSchema['in_process_hold_requests']>): InProcessHoldRequest {
  return {
    id: row.id,
    runId: row.run_id,
    runRevision: BigInt(row.run_revision),
    deviationId: row.deviation_id,
    reason: row.reason,
    status: row.status as InProcessHoldRequest['status'],
    decisionNote: row.decision_note,
    requestedBy: row.requested_by,
    requestedLoginIdentity: row.requested_login_identity,
    requestedAt: row.requested_at,
    decidedBy: row.decided_by,
    decidedAt: row.decided_at,
    requestId: row.request_id,
  };
}

function mapHandover(row: Selectable<DatabaseSchema['in_process_handovers']>): InProcessHandover {
  return {
    id: row.id,
    runId: row.run_id,
    runRevision: BigInt(row.run_revision),
    fromShiftCode: row.from_shift_code,
    toShiftCode: row.to_shift_code,
    fromOperatorId: row.from_operator_id,
    toOperatorId: row.to_operator_id,
    handoverNote: row.handover_note,
    status: row.status as InProcessHandover['status'],
    handedOverBy: row.handed_over_by,
    handedOverLoginIdentity: row.handed_over_login_identity,
    handedOverAt: row.handed_over_at,
    acceptedBy: row.accepted_by,
    acceptedAt: row.accepted_at,
    requestId: row.request_id,
  };
}

function mapEvent(row: Selectable<DatabaseSchema['in_process_run_events']>): InProcessRunEvent {
  return {
    id: row.id,
    runId: row.run_id,
    revisionNumber: BigInt(row.revision_number),
    eventType: row.event_type as InProcessRunEvent['eventType'],
    actorId: row.actor_id,
    actorLoginIdentity: row.actor_login_identity,
    reason: row.reason,
    snapshotSha256: row.snapshot_sha256,
    occurredAt: row.occurred_at,
    requestId: row.request_id,
  };
}
