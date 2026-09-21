import { sql, type Kysely, type Transaction } from 'kysely';
import type { DatabaseSchema, DatabaseRow } from '../../../../shared/database/db-types.js';
import { translateDatabaseError } from '../../../../shared/database/database.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { actorHasScope } from '../../../../shared/authorization/scope-evaluator.js';
import { uuidv7 } from '../../../../shared/id/uuid.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { InspectionRepository } from '../ports/repository.js';
import type { Inspection } from '../domain/inspection.js';
import type { InspectionAction } from '../domain/inspection-state.js';
import type { FinalResult, InspectionResultEntry } from '../domain/inspection-result.js';
import type { AqlSampling } from '../domain/inspection-aql.js';
import type { InspectionEquipmentRepository } from '../ports/inspection-equipment-repository.js';
import type { EquipmentContext } from '../application/inspection-equipment.js';
import { applyInspectionAction } from '../domain/inspection.js';
import { transitionInspection } from '../domain/inspection-state.js';
import type { AuditRepository } from '../../../../shared/audit/audit-repository.js';
import { PostgresAuditRepository } from '../../../../shared/audit/postgres-audit-repository.js';
import type { OutboxRepository } from '../../../../shared/outbox/outbox-repository.js';
import { PostgresOutboxRepository } from '../../../../shared/outbox/postgres-outbox-repository.js';
import { stableJson } from '../../../../shared/json/stable-stringify.js';
import { createHash } from 'node:crypto';
import { insertSignatureEvidence } from '../../../../shared/e-signatures/insert-signature-evidence.js';

const map = (
  r: DatabaseRow<'inspection_reports'>,
  rec: DatabaseRow<'receiving_items'>,
  tv: DatabaseRow<'inspection_template_versions'>,
  resultRows: DatabaseRow<'inspection_report_results'>[] = [],
  snapshot?: DatabaseRow<'inspection_report_snapshots'>,
  evidenceCount = 0,
): Inspection => ({
  id: r.id,
  inspectionNo: r.inspection_no,
  receiving: {
    receivingId: rec.id,
    receivingNo: rec.receiving_no,
    supplier: rec.supplier_name ?? undefined,
    docNo: rec.doc_no,
    itemCode: rec.item_code,
    description: rec.description,
    lot: rec.lot,
    qty: String(rec.qty),
    receivingDate: new Date(rec.receiving_date),
    expiryDate: rec.expiry_date ? new Date(rec.expiry_date) : undefined,
  },
  template: {
    templateId: tv.template_id,
    templateVersionId: tv.id,
    versionNo: tv.version_no,
    templateSnapshot: (snapshot?.template_snapshot as Readonly<Record<string, unknown>> | null) ?? {
      templateId: tv.template_id,
      templateVersionId: tv.id,
      versionNo: tv.version_no,
      sourceDocument: tv.source_document,
      contentHash: tv.content_hash,
    },
    // A stopped/superseded template can still be the approved source of an
    // existing execution. The immutable execution snapshot is authoritative
    // for that historical fact; only new executions consult current state.
    approved: Boolean(snapshot) || tv.state === 'APPROVED',
    sourceDocument: tv.source_document ?? undefined,
  },
  state: r.state as Inspection['state'],
  finalResult: r.final_result as Inspection['finalResult'],
  authorId: r.author_id,
  assignedTo: r.assigned_user_id ?? r.author_id,
  evidenceCount,
  results: resultRows.map((result) => ({
    id: result.id,
    pointId: result.template_point_id,
    value:
      result.numeric_value ??
      result.text_value ??
      result.boolean_value ??
      result.selected_value ??
      '',
    unit: result.unit ?? undefined,
    result: result.result ?? undefined,
    remarks: result.remarks ?? undefined,
    version: BigInt(result.version),
  })),
  submittedAt: r.submitted_at ?? undefined,
  version: BigInt(r.version),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export class PostgresInspectionRepository implements InspectionRepository {
  /** QC-DATA-002: the repository doubles as the equipment-usage port. */
  get equipmentUsage(): InspectionEquipmentRepository {
    return {
      link: (i) => this.linkEquipment(i),
      listForReport: (id) => this.listEquipment(id),
    };
  }
  constructor(
    private readonly db: Kysely<DatabaseSchema>,
    private readonly audit?: AuditRepository,
    private readonly outbox?: OutboxRepository,
  ) {}
  private async load(id: string) {
    const report = await this.db
      .selectFrom('inspection_reports')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    if (!report) return undefined;
    const [receiving, template, results, snapshot, evidence] = await Promise.all([
      this.db
        .selectFrom('receiving_items')
        .selectAll()
        .where('id', '=', report.receiving_item_id)
        .executeTakeFirstOrThrow(),
      this.db
        .selectFrom('inspection_template_versions')
        .selectAll()
        .where('id', '=', report.template_version_id)
        .executeTakeFirstOrThrow(),
      this.db
        .selectFrom('inspection_report_results')
        .selectAll()
        .where('inspection_report_id', '=', id)
        .orderBy('entered_at')
        .execute(),
      this.db
        .selectFrom('inspection_report_snapshots')
        .selectAll()
        .where('inspection_report_id', '=', id)
        .orderBy('snapshot_version', 'desc')
        .executeTakeFirst(),
      this.db
        .selectFrom('evidence_links')
        .select((eb) => eb.fn.count('id').as('count'))
        .where('subject_type', '=', 'INSPECTION_REPORT')
        .where('subject_id', '=', id)
        .where('removed_at', 'is', null)
        .executeTakeFirstOrThrow(),
    ]);
    return map(report, receiving, template, results, snapshot, Number(evidence.count));
  }
  /**
   * Loads a page of inspection reports with one query per relation.
   *
   * The register used to call `load()` once per row, which cost six queries per
   * report; this batches the same six relations for every requested id while
   * producing the identical projection.
   */
  private async loadMany(ids: readonly string[]): Promise<Map<string, Inspection>> {
    const byId = new Map<string, Inspection>();
    if (!ids.length) return byId;
    const [reports, resultRows, snapshotRows, evidenceRows] = await Promise.all([
      this.db.selectFrom('inspection_reports').selectAll().where('id', 'in', ids).execute(),
      this.db
        .selectFrom('inspection_report_results')
        .selectAll()
        .where('inspection_report_id', 'in', ids)
        .orderBy('entered_at')
        .execute(),
      this.db
        .selectFrom('inspection_report_snapshots')
        .selectAll()
        .where('inspection_report_id', 'in', ids)
        .orderBy('snapshot_version', 'desc')
        .execute(),
      this.db
        .selectFrom('evidence_links')
        .select('subject_id')
        .select((eb) => eb.fn.count('id').as('count'))
        .where('subject_type', '=', 'INSPECTION_REPORT')
        .where('subject_id', 'in', ids)
        .where('removed_at', 'is', null)
        .groupBy('subject_id')
        .execute(),
    ]);
    if (!reports.length) return byId;
    const receivingIds = [...new Set(reports.map((report) => report.receiving_item_id))];
    const templateIds = [...new Set(reports.map((report) => report.template_version_id))];
    const [receivingRows, templateRows] = await Promise.all([
      this.db.selectFrom('receiving_items').selectAll().where('id', 'in', receivingIds).execute(),
      this.db
        .selectFrom('inspection_template_versions')
        .selectAll()
        .where('id', 'in', templateIds)
        .execute(),
    ]);
    const receivingById = new Map(receivingRows.map((row) => [row.id, row]));
    const templateById = new Map(templateRows.map((row) => [row.id, row]));
    const resultsByReport = new Map<string, DatabaseRow<'inspection_report_results'>[]>();
    for (const row of resultRows) {
      const existing = resultsByReport.get(row.inspection_report_id);
      if (existing) existing.push(row);
      else resultsByReport.set(row.inspection_report_id, [row]);
    }
    // Rows arrive newest snapshot first, so the first one seen is the current one.
    const latestSnapshot = new Map<string, DatabaseRow<'inspection_report_snapshots'>>();
    for (const row of snapshotRows)
      if (!latestSnapshot.has(row.inspection_report_id))
        latestSnapshot.set(row.inspection_report_id, row);
    const evidenceByReport = new Map(
      evidenceRows.map((row) => [row.subject_id, Number(row.count)]),
    );
    for (const report of reports) {
      const receiving = receivingById.get(report.receiving_item_id);
      const template = templateById.get(report.template_version_id);
      // Foreign keys make this unreachable; failing loudly beats dropping a row.
      if (!receiving || !template)
        throw new AppError('SYSTEM_INTERNAL', { safeMetadata: { inspectionReport: report.id } });
      byId.set(
        report.id,
        map(
          report,
          receiving,
          template,
          resultsByReport.get(report.id) ?? [],
          latestSnapshot.get(report.id),
          evidenceByReport.get(report.id) ?? 0,
        ),
      );
    }
    return byId;
  }

  async get(id: string, actor: ActorContext) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;
    const item = await this.load(id);
    const grant = actor.permissions.find((p) => p.code === 'PERM-INSP-VIEW');
    return item &&
      actorHasScope(
        actor,
        {
          type: 'INSPECTION_REPORT',
          id: item.id,
          state: item.state,
          authorId: item.authorId,
          executorId: item.authorId,
        },
        { ownerId: item.authorId, assigneeId: item.assignedTo ?? item.authorId },
        grant,
      )
      ? item
      : undefined;
  }
  async list(i: {
    actor: ActorContext;
    assignedTo?: string;
    state?: Inspection['state'];
    finalResult?: Inspection['finalResult'];
    ownership?: 'mine';
  }) {
    // The register filters are applied in SQL so a page (and a same-predicate
    // dashboard counter) only loads the reports it actually shows, and the
    // related rows are batched instead of loaded per report.
    let query = this.db
      .selectFrom('inspection_reports')
      .select('id')
      .orderBy('updated_at', 'desc')
      .orderBy('id', 'desc');
    if (i.state) query = query.where('state', '=', i.state) as typeof query;
    if (i.finalResult) query = query.where('final_result', '=', i.finalResult) as typeof query;
    if (i.assignedTo) query = query.where('assigned_user_id', '=', i.assignedTo) as typeof query;
    if (i.ownership === 'mine') query = query.where('author_id', '=', i.actor.id) as typeof query;
    const rows = await query.execute();
    const loaded = await this.loadMany(rows.map((row) => row.id));
    const grant = i.actor.permissions.find((permission) => permission.code === 'PERM-INSP-VIEW');
    const result: Inspection[] = [];
    for (const row of rows) {
      const item = loaded.get(row.id);
      if (
        item &&
        actorHasScope(
          i.actor,
          {
            type: 'INSPECTION_REPORT',
            id: item.id,
            state: item.state,
            authorId: item.authorId,
            executorId: item.authorId,
          },
          { ownerId: item.authorId, assigneeId: item.assignedTo ?? item.authorId },
          grant,
        )
      )
        result.push(item);
    }
    return result;
  }
  async create(i: {
    inspection: Inspection;
    actor: ActorContext;
    requestId: string;
    /**
     * QC-DATA-001: when the report originates from a receiving record, the link
     * event is written inside the same transaction, so the receiving record's
     * audit history can never miss the inspection that was started from it.
     */
    originAudit?: { receivingItemId: string };
  }) {
    try {
      const x = i.inspection;
      await this.db.transaction().execute(async (tx) => {
        await tx
          .insertInto('inspection_reports')
          .values({
            id: x.id,
            inspection_no: x.inspectionNo,
            receiving_item_id: x.receiving.receivingId,
            template_version_id: x.template.templateVersionId,
            state: 'DRAFT',
            final_result: null,
            author_id: x.authorId,
            assigned_user_id: x.assignedTo ?? x.authorId,
            submitted_at: null,
            review_started_at: null,
            approved_at: null,
            rejected_at: null,
            voided_at: null,
            void_reason: null,
            snapshot_id: null,
            created_by: x.authorId,
            updated_by: x.authorId,
            updated_at: x.updatedAt,
            version: 1n,
          })
          .execute();
        const templateSnapshot: Record<string, unknown> = {
          ...x.template.templateSnapshot,
          templateId: x.template.templateId,
          templateVersionId: x.template.templateVersionId,
          versionNo: x.template.versionNo,
        };
        const controlledSources = await tx
          .selectFrom('inspection_template_document_sources as source')
          .innerJoin('document_versions as version', 'version.id', 'source.document_version_id')
          .innerJoin('document_identities as identity', 'identity.id', 'version.document_id')
          .select([
            'source.document_version_id as documentVersionId',
            'source.usage_type as usageType',
            'identity.document_no as documentNo',
            'identity.document_type as documentType',
            'identity.title as title',
            'version.revision as revision',
            'version.effective_at as effectiveAt',
            'version.content_hash as contentHash',
            'version.state as state',
          ])
          .where('source.template_version_id', '=', x.template.templateVersionId)
          .orderBy('identity.document_no')
          .orderBy('version.id')
          .execute();
        if (controlledSources.some((source) => source.state !== 'EFFECTIVE'))
          throw new AppError('AUTHZ_DENIED', { userSafe: true });
        const criteria = await tx
          .selectFrom('inspection_template_sections as section')
          .innerJoin('inspection_template_points as point', 'point.section_id', 'section.id')
          .select([
            'section.section_code as sectionCode',
            'section.title as sectionTitle',
            'point.id as pointId',
            'point.point_code as pointCode',
            'point.label as label',
            'point.requirement_text as requirementText',
            'point.data_type as dataType',
            'point.unit as unit',
            'point.required as required',
            'point.acceptance_rule_type as acceptanceRuleType',
            'point.acceptance_rule_payload as acceptanceRulePayload',
            'point.source_reference as sourceReference',
          ])
          .where('section.template_version_id', '=', x.template.templateVersionId)
          .orderBy('section.position')
          .orderBy('point.position')
          .execute();
        templateSnapshot.controlledDocumentVersions = controlledSources;
        const snapshot = await tx
          .insertInto('inspection_report_snapshots')
          .values({
            id: uuidv7(),
            inspection_report_id: x.id,
            snapshot_version: 1,
            snapshot_stage: 'CREATION',
            receiving_snapshot: stableJson(x.receiving),
            template_snapshot: stableJson(templateSnapshot),
            controlled_source_snapshot: stableJson(controlledSources),
            criteria_snapshot: stableJson(criteria),
            results_snapshot: stableJson([]),
            created_at: new Date(x.createdAt),
            snapshot_hash: createHash('sha256')
              .update(
                stableJson({
                  receiving: x.receiving,
                  template: templateSnapshot,
                  controlledSources,
                  criteria,
                  results: [],
                }),
              )
              .digest('hex'),
          })
          .returning('id')
          .executeTakeFirstOrThrow();
        await tx
          .updateTable('inspection_reports')
          .set({ snapshot_id: snapshot.id })
          .where('id', '=', x.id)
          .execute();
        if (i.originAudit) {
          await this.auditFor(tx)?.append({
            actorType: 'USER',
            actorId: i.actor.id,
            subjectType: 'RECEIVING_ITEM',
            subjectId: i.originAudit.receivingItemId,
            action: 'INSPECTION_CREATED_FROM_RECEIVING',
            newState: 'DRAFT',
            requestId: i.requestId,
            payload: { inspectionReportId: x.id, inspectionNo: x.inspectionNo },
          });
          await this.outboxFor(tx)?.enqueue({
            eventType: 'RECEIVING_INSPECTION_LINKED',
            aggregateType: 'RECEIVING_ITEM',
            aggregateId: i.originAudit.receivingItemId,
            payload: { inspectionReportId: x.id, state: 'DRAFT' },
            dedupeKey: `receiving-inspection-linked:${x.id}`,
          });
        }
      });
      return x;
    } catch (e) {
      throw translateDatabaseError(e);
    }
  }
  /**
   * QC-DATA-002: approved point criteria for the bound template version —
   * the server-side source for deterministic numeric/enum evaluation. Read
   * from the live template rows (which are immutable once approved), never
   * from client input.
   */
  async listPointCriteria(templateVersionId: string) {
    const rows = await this.db
      .selectFrom('inspection_template_sections as section')
      .innerJoin('inspection_template_points as point', 'point.section_id', 'section.id')
      .select([
        'point.id as pointId',
        'point.data_type as dataType',
        'point.acceptance_rule_type as acceptanceRuleType',
        'point.acceptance_rule_payload as acceptanceRulePayload',
      ])
      .where('section.template_version_id', '=', templateVersionId)
      .orderBy('section.position')
      .orderBy('point.position')
      .execute();
    return rows.map((row) => ({
      pointId: row.pointId,
      dataType: row.dataType,
      acceptanceRuleType: row.acceptanceRuleType,
      acceptanceRulePayload: row.acceptanceRulePayload,
    }));
  }
  /**
   * QC-DATA-002 §8: persist the operator-supplied structured AQL block.
   * Draft-only, optimistic-version guarded, audited like every mutation.
   */
  async linkEquipment(i: {
    id: string;
    inspectionReportId: string;
    usage: EquipmentContext;
    actor: ActorContext;
    requestId: string;
  }) {
    await this.db.transaction().execute(async (tx) => {
      await tx
        .insertInto('inspection_equipment_usage')
        .values({
          id: i.id,
          inspection_report_id: i.inspectionReportId,
          equipment_id: i.usage.equipmentId,
          calibration_record_id: i.usage.calibrationRecordId,
          usage_role: i.usage.usageRole ?? null,
          used_at: new Date(i.usage.usedAt),
          equipment_snapshot: i.usage.equipmentSnapshot,
          calibration_snapshot: i.usage.calibrationSnapshot,
          created_by: i.actor.id,
        })
        .execute();
      await this.auditFor(tx)?.append({
        actorType: 'USER',
        actorId: i.actor.id,
        subjectType: 'INSPECTION_REPORT',
        subjectId: i.inspectionReportId,
        action: 'EQUIPMENT_LINKED',
        requestId: i.requestId,
        payload: { equipmentId: i.usage.equipmentId, calibrationRecordId: i.usage.calibrationRecordId },
      });
    });
  }
  async listEquipment(inspectionReportId: string): Promise<EquipmentContext[]> {
    const rows = await this.db
      .selectFrom('inspection_equipment_usage')
      .selectAll()
      .where('inspection_report_id', '=', inspectionReportId)
      .orderBy('created_at')
      .execute();
    return rows.map((row) => ({
      equipmentId: row.equipment_id,
      calibrationRecordId: row.calibration_record_id ?? '',
      usedAt: (row.used_at ?? row.created_at).toISOString(),
      equipmentSnapshot: (row.equipment_snapshot ?? {}) as Record<string, unknown>,
      calibrationSnapshot: (row.calibration_snapshot ?? {}) as Record<string, unknown>,
      usageRole: row.usage_role ?? undefined,
    }));
  }
  async saveAql(i: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    aql: AqlSampling;
    requestId: string;
  }) {
    const r = await this.db.transaction().execute(async (tx) => {
      const updated = await tx
        .updateTable('inspection_reports')
        .set({
          aql: i.aql.aql,
          aql_code_letter: i.aql.codeLetter ?? null,
          aql_inspection_level: i.aql.inspectionLevel ?? null,
          aql_sample_size: i.aql.sampleSize,
          aql_accept_number: i.aql.acceptNumber,
          aql_reject_number: i.aql.rejectNumber,
          aql_observed_defects: i.aql.observedDefects ?? null,
          aql_sampling_result: i.aql.samplingResult,
          aql_source_reference: i.aql.sourceReference,
          aql_recorded_by: i.actor.id,
          aql_recorded_at: new Date(),
          updated_by: i.actor.id,
          updated_at: new Date(),
          version: i.expectedVersion + 1n,
        })
        .where('id', '=', i.id)
        .where('version', '=', i.expectedVersion)
        .where('state', '=', 'DRAFT')
        .returning('id')
        .executeTakeFirst();
      if (!updated) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
      await this.auditFor(tx)?.append({
        actorType: 'USER',
        actorId: i.actor.id,
        subjectType: 'INSPECTION_REPORT',
        subjectId: i.id,
        action: 'MEASUREMENT_RECORDED',
        requestId: i.requestId,
        payload: { kind: 'AQL_SAMPLING', samplingResult: i.aql.samplingResult },
      });
      return updated;
    });
  }
  async saveDraft(i: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    results: readonly InspectionResultEntry[];
    finalResult?: FinalResult;
    requestId: string;
  }) {
    const r = await this.db.transaction().execute(async (tx) => {
      const updated = await tx
        .updateTable('inspection_reports')
        .set({ updated_by: i.actor.id, updated_at: new Date(), version: i.expectedVersion + 1n })
        .where('id', '=', i.id)
        .where('version', '=', i.expectedVersion)
        .where('state', '=', 'DRAFT')
        .returningAll()
        .executeTakeFirst();
      if (!updated) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
      await tx
        .deleteFrom('inspection_report_results')
        .where('inspection_report_id', '=', i.id)
        .execute();
      for (const result of i.results)
        await tx
          .insertInto('inspection_report_results')
          .values({
            id: result.id,
            inspection_report_id: i.id,
            template_point_id: result.pointId,
            numeric_value: typeof result.value === 'number' ? String(result.value) : null,
            text_value: typeof result.value === 'string' ? result.value : null,
            boolean_value: typeof result.value === 'boolean' ? result.value : null,
            selected_value: null,
            unit: result.unit ?? null,
            // QC-DATA-002: the official result is the server-evaluated fact
            // (or the client-declared REMARK/NA); never a browser PASS/FAIL.
            result: result.result ?? null,
            remarks: result.remarks ?? null,
            entered_by: i.actor.id,
            entered_at: new Date(),
            updated_at: new Date(),
            version: 1n,
          })
          .execute();
      return updated;
    });
    const item = await this.load(i.id);
    if (!item) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    return { ...item, version: BigInt(r.version) };
  }
  async transition(i: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    action: InspectionAction;
    reason?: string;
    signatureEvidence?: import('../../../e-signatures/domain/signature-evidence.js').SignatureEvidence;
    requestId: string;
  }) {
    if (i.action === 'FINAL_APPROVE') {
      const evidence = i.signatureEvidence;
      if (
        !evidence ||
        evidence.subjectType !== 'INSPECTION_REPORT' ||
        evidence.subjectId !== i.id ||
        evidence.subjectVersion !== i.expectedVersion ||
        evidence.actorId !== i.actor.id ||
        evidence.action !== 'FINAL_APPROVE' ||
        evidence.meaning !== 'FINAL_APPROVE' ||
        evidence.requestId !== i.requestId
      )
        throw new AppError('VALIDATION_FAILED', { userSafe: true });
    } else if (i.signatureEvidence) {
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    }
    const old = await this.get(i.id, i.actor);
    if (!old) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    const next = transitionInspection(old.state, i.action);
    applyInspectionAction(old, i.action, i.reason);
    try {
      const result = await this.db.transaction().execute(async (tx) => {
        const now = new Date();
        const changes = {
          state: next,
          ...(i.action === 'BEGIN_REVIEW' ? { review_started_at: now } : {}),
          // QC-100-FINAL-004 two-stage chain: only the QCM final approval
          // stamps approved_at and completes the receiving consequence. The
          // Supervisor stage approval never reaches APPROVED.
          ...(i.action === 'FINAL_APPROVE' ? { approved_at: now } : {}),
          ...(i.action === 'REJECT' ? { rejected_at: now } : {}),
          ...(i.action === 'VOID' ? { voided_at: now } : {}),
          ...(['RETURN', 'REJECT', 'VOID', 'REOPEN'].includes(i.action)
            ? { void_reason: i.reason ?? null }
            : {}),
          updated_by: i.actor.id,
          updated_at: now,
          version: i.expectedVersion + 1n,
        };
        const r = await tx
          .updateTable('inspection_reports')
          .set(changes)
          .where('id', '=', i.id)
          .where('version', '=', i.expectedVersion)
          .where('state', '=', old.state)
          .returningAll()
          .executeTakeFirst();
        if (!r) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        if (i.action === 'FINAL_APPROVE') await insertSignatureEvidence(tx, i.signatureEvidence!);
        if (i.action === 'SUBMIT') {
          const creationSnapshot = await tx
            .selectFrom('inspection_report_snapshots')
            .select(['controlled_source_snapshot', 'criteria_snapshot'])
            .where('inspection_report_id', '=', i.id)
            .where('snapshot_stage', '=', 'CREATION')
            .orderBy('snapshot_version')
            .executeTakeFirst();
          const resultsSnapshot = old.results.map((entry) => ({
            id: entry.id,
            pointId: entry.pointId,
            value: entry.value,
            unit: entry.unit ?? null,
            result: entry.result ?? null,
            remarks: entry.remarks ?? null,
            version: String(entry.version),
          }));
          const controlledSources = creationSnapshot?.controlled_source_snapshot ?? [];
          const criteria = creationSnapshot?.criteria_snapshot ?? [];
          const submission = {
            receiving: old.receiving,
            template: old.template.templateSnapshot,
            controlledSources,
            criteria,
            results: resultsSnapshot,
          };
          const snapshot = await tx
            .insertInto('inspection_report_snapshots')
            .values({
              id: uuidv7(),
              inspection_report_id: i.id,
              snapshot_version: Number(i.expectedVersion + 1n),
              snapshot_stage: 'SUBMISSION',
              receiving_snapshot: old.receiving,
              template_snapshot: old.template.templateSnapshot,
              controlled_source_snapshot: stableJson(controlledSources),
              criteria_snapshot: stableJson(criteria),
              results_snapshot: stableJson(resultsSnapshot),
              created_at: now,
              snapshot_hash: createHash('sha256').update(stableJson(submission)).digest('hex'),
            })
            .returningAll()
            .executeTakeFirstOrThrow();
          await tx
            .updateTable('inspection_reports')
            .set({ snapshot_id: snapshot.id })
            .where('id', '=', i.id)
            .execute();
        }
        if (i.action === 'FINAL_APPROVE' && old.finalResult) {
          const receiving = await tx
            .updateTable('receiving_items')
            .set({
              workflow_state: 'INSPECTION_COMPLETE',
              inspection_result: old.finalResult,
              updated_by: i.actor.id,
              updated_at: now,
              version: sql<bigint>`version + 1`,
            })
            .where('id', '=', old.receiving.receivingId)
            // A receiving item can be put on HOLD independently while an
            // inspection is in review. Approval must never resurrect or
            // overwrite that controlled state.
            .where('workflow_state', '=', 'UNDER_INSPECTION')
            .returning('id')
            .executeTakeFirst();
          if (!receiving) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        }
        await this.auditFor(tx)?.append({
          actorType: 'USER',
          actorId: i.actor.id,
          subjectType: 'INSPECTION_REPORT',
          subjectId: i.id,
          action: i.action,
          oldState: old.state,
          newState: next,
          reason: i.reason,
          requestId: i.requestId,
          payload:
            i.action === 'FINAL_APPROVE'
              ? { finalResult: old.finalResult ?? 'UNDETERMINED' }
              : undefined,
        });
        await this.outboxFor(tx)?.enqueue({
          eventType: 'INSPECTION_CHANGED',
          aggregateType: 'INSPECTION_REPORT',
          aggregateId: i.id,
          payload: { action: i.action, state: next, finalResult: old.finalResult ?? null },
          dedupeKey: `inspection:${i.id}:v${i.expectedVersion + 1n}`,
        });
        return r;
      });
      const item = await this.load(i.id);
      if (!item) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      return { ...item, version: BigInt(result.version) };
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw translateDatabaseError(e);
    }
  }

  private auditFor(tx: Transaction<DatabaseSchema>): AuditRepository | undefined {
    return this.audit instanceof PostgresAuditRepository
      ? new PostgresAuditRepository(tx)
      : this.audit;
  }

  private outboxFor(tx: Transaction<DatabaseSchema>): OutboxRepository | undefined {
    return this.outbox instanceof PostgresOutboxRepository
      ? new PostgresOutboxRepository(tx)
      : this.outbox;
  }
}
