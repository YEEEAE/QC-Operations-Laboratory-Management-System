import type { Kysely, Transaction } from 'kysely';
import type { DatabaseRow, DatabaseSchema } from '../../../shared/database/db-types.js';
import { translateDatabaseError } from '../../../shared/database/database.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { AuditRepository } from '../../../shared/audit/audit-repository.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import type { OutboxRepository } from '../../../shared/outbox/outbox-repository.js';
import { PostgresOutboxRepository } from '../../../shared/outbox/postgres-outbox-repository.js';
import {
  assertApprovalSubjectType,
  type ApprovalCase,
  type ApprovalDecision,
  type ApprovalWorkItem,
} from '../domain/approval.js';
import type {
  ApprovalRecord,
  ApprovalRepository,
  ApprovalSubjectContext,
  RecordApprovalDecisionInput,
} from '../ports/repository.js';
import type { SignatureEvidence } from '../../e-signatures/domain/signature-evidence.js';

const caseMap = (row: DatabaseRow<'approval_cases'>): ApprovalCase => {
  assertApprovalSubjectType(row.subject_type);
  return {
    id: row.id,
    subjectType: row.subject_type,
    subjectId: row.subject_id,
    subjectVersion: BigInt(row.subject_version),
    workflowType: row.workflow_type,
    state: row.state as ApprovalCase['state'],
    requestedBy: row.requested_by,
    requestedAt: row.requested_at,
    ...(row.completed_at ? { completedAt: row.completed_at } : {}),
    createdAt: row.created_at,
    version: BigInt(row.version),
  };
};
const workMap = (row: DatabaseRow<'approval_work_items'>): ApprovalWorkItem => ({
  id: row.id,
  approvalCaseId: row.approval_case_id,
  stepNo: row.step_no,
  workType: row.work_type as ApprovalWorkItem['workType'],
  ...(row.assigned_user_id ? { assignedUserId: row.assigned_user_id } : {}),
  ...(row.assigned_role_requirement
    ? { assignedRoleRequirement: row.assigned_role_requirement }
    : {}),
  state: row.state as ApprovalWorkItem['state'],
  ...(row.assigned_at ? { assignedAt: row.assigned_at } : {}),
  ...(row.started_at ? { startedAt: row.started_at } : {}),
  ...(row.completed_at ? { completedAt: row.completed_at } : {}),
  version: BigInt(row.version),
});
const decisionMap = (row: DatabaseRow<'approval_decisions'>): ApprovalDecision => ({
  id: row.id,
  approvalCaseId: row.approval_case_id,
  ...(row.work_item_id ? { workItemId: row.work_item_id } : {}),
  actorId: row.actor_id,
  decision: row.decision as ApprovalDecision['decision'],
  subjectVersion: BigInt(row.subject_version),
  ...(row.reason ? { reason: row.reason } : {}),
  ...(row.comments ? { comments: row.comments } : {}),
  ...(row.signature_id ? { signatureId: row.signature_id } : {}),
  decidedAt: row.decided_at,
  requestId: row.request_id,
});

export class PostgresApprovalRepository implements ApprovalRepository {
  constructor(
    private readonly database: Kysely<DatabaseSchema>,
    private readonly audit?: AuditRepository,
    private readonly outbox?: OutboxRepository,
  ) {}

  async listActionable(input: { actor: ActorContext }): Promise<readonly ApprovalRecord[]> {
    try {
      let query = this.database
        .selectFrom('approval_work_items')
        .innerJoin('approval_cases', 'approval_cases.id', 'approval_work_items.approval_case_id')
        .select([
          'approval_work_items.id as work_id',
          'approval_work_items.approval_case_id',
          'approval_work_items.step_no',
          'approval_work_items.work_type',
          'approval_work_items.assigned_user_id',
          'approval_work_items.assigned_role_requirement',
          'approval_work_items.state as work_state',
          'approval_work_items.assigned_at',
          'approval_work_items.started_at',
          'approval_work_items.completed_at as work_completed_at',
          'approval_work_items.version as work_version',
          'approval_cases.id as case_id',
          'approval_cases.subject_type',
          'approval_cases.subject_id',
          'approval_cases.subject_version',
          'approval_cases.workflow_type',
          'approval_cases.state as case_state',
          'approval_cases.requested_by',
          'approval_cases.requested_at',
          'approval_cases.completed_at as case_completed_at',
          'approval_cases.created_at as case_created_at',
          'approval_cases.version as case_version',
        ])
        .where('approval_work_items.state', 'in', ['PENDING', 'IN_PROGRESS']);
      query = query.where((eb) =>
        eb.or([
          eb('approval_work_items.assigned_user_id', '=', input.actor.id),
          ...(input.actor.roles.length
            ? [eb('approval_work_items.assigned_role_requirement', 'in', input.actor.roles)]
            : []),
        ]),
      );
      const rows = await query.orderBy('approval_cases.requested_at', 'asc').execute();
      const records: ApprovalRecord[] = [];
      for (const row of rows) {
        const record = await this.buildRecord(row);
        if (record) records.push(record);
      }
      return records;
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async get(input: {
    approvalId: string;
    actor: ActorContext;
  }): Promise<ApprovalRecord | undefined> {
    if (!/^[0-9a-f-]{36}$/i.test(input.approvalId))
      throw new AppError('VALIDATION_INVALID_UUID', { userSafe: true });
    try {
      const row = await this.database
        .selectFrom('approval_work_items')
        .innerJoin('approval_cases', 'approval_cases.id', 'approval_work_items.approval_case_id')
        .select([
          'approval_work_items.id as work_id',
          'approval_work_items.approval_case_id',
          'approval_work_items.step_no',
          'approval_work_items.work_type',
          'approval_work_items.assigned_user_id',
          'approval_work_items.assigned_role_requirement',
          'approval_work_items.state as work_state',
          'approval_work_items.assigned_at',
          'approval_work_items.started_at',
          'approval_work_items.completed_at as work_completed_at',
          'approval_work_items.version as work_version',
          'approval_cases.id as case_id',
          'approval_cases.subject_type',
          'approval_cases.subject_id',
          'approval_cases.subject_version',
          'approval_cases.workflow_type',
          'approval_cases.state as case_state',
          'approval_cases.requested_by',
          'approval_cases.requested_at',
          'approval_cases.completed_at as case_completed_at',
          'approval_cases.created_at as case_created_at',
          'approval_cases.version as case_version',
        ])
        .where('approval_cases.id', '=', input.approvalId)
        .orderBy('approval_work_items.step_no', 'asc')
        .executeTakeFirst();
      return row ? this.buildRecord(row) : undefined;
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async findDecisionByRequestId(input: {
    approvalCaseId: string;
    workItemId: string;
    requestId: string;
  }): Promise<ApprovalDecision | undefined> {
    const row = await this.database
      .selectFrom('approval_decisions')
      .selectAll()
      .where('approval_case_id', '=', input.approvalCaseId)
      .where('work_item_id', '=', input.workItemId)
      .where('request_id', '=', input.requestId)
      .executeTakeFirst();
    return row ? decisionMap(row) : undefined;
  }

  async recordDecision(
    input: RecordApprovalDecisionInput,
  ): Promise<{ decision: ApprovalDecision; signature?: SignatureEvidence }> {
    try {
      return await this.database.transaction().execute(async (tx) => {
        const replay = await tx
          .selectFrom('approval_decisions')
          .selectAll()
          .where('approval_case_id', '=', input.approvalCaseId)
          .where('work_item_id', '=', input.workItemId)
          .where('request_id', '=', input.requestId)
          .forUpdate()
          .executeTakeFirst();
        if (replay)
          return {
            decision: decisionMap(replay),
            ...(input.signature ? { signature: input.signature } : {}),
          };
        const work = await tx
          .selectFrom('approval_work_items')
          .selectAll()
          .where('id', '=', input.workItemId)
          .where('approval_case_id', '=', input.approvalCaseId)
          .forUpdate()
          .executeTakeFirst();
        if (!work || !['PENDING', 'IN_PROGRESS'].includes(work.state))
          throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        let signatureId: string | undefined;
        if (input.signature) {
          signatureId = input.signature.id;
          await tx
            .insertInto('electronic_signatures')
            .values({
              id: input.signature.id,
              actor_id: input.signature.actorId,
              subject_type: input.signature.subjectType,
              subject_id: input.signature.subjectId,
              subject_version: input.signature.subjectVersion,
              action: input.signature.action,
              meaning: input.signature.meaning,
              signed_at: input.signature.signedAt,
              snapshot_hash: input.signature.snapshotHash,
              reason: input.signature.reason ?? null,
              reauth_method: input.signature.reauthMethod,
              request_id: input.signature.requestId,
            })
            .execute();
        }
        const row = await tx
          .insertInto('approval_decisions')
          .values({
            id: uuidv7(),
            approval_case_id: input.approvalCaseId,
            work_item_id: input.workItemId,
            actor_id: input.actor.id,
            decision: input.decision,
            subject_version: input.subjectVersion,
            reason: input.reason?.trim() || null,
            comments: input.comments?.trim() || null,
            signature_id: signatureId ?? null,
            decided_at: input.now,
            request_id: input.requestId,
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        const nextWorkState = input.decision === 'RETURN' ? 'RETURNED' : 'COMPLETED';
        await tx
          .updateTable('approval_work_items')
          .set({
            state: nextWorkState,
            completed_at: input.now,
            version: BigInt(work.version) + 1n,
          })
          .where('id', '=', input.workItemId)
          .where('version', '=', work.version)
          .executeTakeFirstOrThrow();
        const pending = await tx
          .selectFrom('approval_work_items')
          .select('id')
          .where('approval_case_id', '=', input.approvalCaseId)
          .where('state', 'in', ['PENDING', 'IN_PROGRESS'])
          .execute();
        const caseState =
          input.decision === 'RETURN'
            ? 'RETURNED'
            : pending.length === 0
              ? 'COMPLETED'
              : 'IN_PROGRESS';
        await tx
          .updateTable('approval_cases')
          .set({
            state: caseState,
            ...(caseState === 'COMPLETED' || caseState === 'RETURNED'
              ? { completed_at: input.now }
              : {}),
            version: await this.nextCaseVersion(tx, input.approvalCaseId),
          })
          .where('id', '=', input.approvalCaseId)
          .execute();
        await this.auditFor(tx)?.append({
          actorType: 'USER',
          actorId: input.actor.id,
          subjectType: 'APPROVAL_CASE',
          subjectId: input.approvalCaseId,
          action: `APPROVAL_${input.decision}`,
          newState: caseState,
          reason: input.reason,
          requestId: input.requestId,
          signatureId,
        });
        await this.outboxFor(tx)?.enqueue({
          eventType: 'APPROVAL_DECIDED',
          aggregateType: 'APPROVAL_CASE',
          aggregateId: input.approvalCaseId,
          payload: {
            decision: input.decision,
            workItemId: input.workItemId,
            subjectVersion: input.subjectVersion.toString(),
          },
          dedupeKey: `approval-decision:${input.approvalCaseId}:${input.workItemId}:${input.requestId}`,
        });
        return {
          decision: decisionMap(row),
          ...(input.signature ? { signature: input.signature } : {}),
        };
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw translateDatabaseError(error);
    }
  }

  private async nextCaseVersion(tx: Transaction<DatabaseSchema>, id: string): Promise<bigint> {
    const row = await tx
      .selectFrom('approval_cases')
      .select('version')
      .where('id', '=', id)
      .forUpdate()
      .executeTakeFirstOrThrow();
    return BigInt(row.version) + 1n;
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

  private async buildRecord(row: Record<string, unknown>): Promise<ApprovalRecord | undefined> {
    const approvalCase = caseMap({
      id: row.case_id as string,
      subject_type: row.subject_type as string,
      subject_id: row.subject_id as string,
      subject_version: row.subject_version as bigint,
      workflow_type: row.workflow_type as string,
      state: row.case_state as string,
      requested_by: row.requested_by as string,
      requested_at: row.requested_at as Date,
      completed_at: row.case_completed_at as Date | null,
      created_at: row.case_created_at as Date,
      version: row.case_version as bigint,
    });
    const workItem = workMap({
      id: row.work_id as string,
      approval_case_id: row.approval_case_id as string,
      step_no: row.step_no as number,
      work_type: row.work_type as string,
      assigned_user_id: row.assigned_user_id as string | null,
      assigned_role_requirement: row.assigned_role_requirement as string | null,
      state: row.work_state as string,
      assigned_at: row.assigned_at as Date | null,
      started_at: row.started_at as Date | null,
      completed_at: row.work_completed_at as Date | null,
      version: row.work_version as bigint,
    });
    const subject = await this.subjectContext(approvalCase.subjectType, approvalCase.subjectId);
    if (!subject) return undefined;
    return { approvalCase, workItem, subject };
  }

  private async subjectContext(
    subjectType: ApprovalCase['subjectType'],
    subjectId: string,
  ): Promise<ApprovalSubjectContext | undefined> {
    switch (subjectType) {
      case 'DOCUMENT_VERSION': {
        const row = await this.database
          .selectFrom('document_versions')
          .selectAll()
          .where('id', '=', subjectId)
          .executeTakeFirst();
        return row
          ? {
              subjectType,
              subjectId,
              state: row.state,
              version: BigInt(row.version),
              authorId: row.created_by,
              snapshotHash: row.content_hash ?? undefined,
              domain: 'DOCUMENTS',
              reviewContext: {
                revision: row.revision,
                changeSummary: row.change_summary,
                contentHash: row.content_hash,
              },
            }
          : undefined;
      }
      case 'LAB_TEST': {
        const row = await this.database
          .selectFrom('lab_tests')
          .selectAll()
          .where('id', '=', subjectId)
          .executeTakeFirst();
        return row
          ? {
              subjectType,
              subjectId,
              state: row.state,
              version: BigInt(row.version),
              authorId: row.author_id,
              snapshotHash: row.snapshot_id ?? undefined,
              domain: 'LABORATORY',
              reviewContext: {
                labTestNo: row.lab_test_no,
                scientificResult: row.scientific_result,
                snapshotId: row.snapshot_id,
              },
            }
          : undefined;
      }
      case 'INSPECTION_REPORT': {
        const row = await this.database
          .selectFrom('inspection_reports')
          .selectAll()
          .where('id', '=', subjectId)
          .executeTakeFirst();
        return row
          ? {
              subjectType,
              subjectId,
              state: row.state,
              version: BigInt(row.version),
              authorId: row.author_id,
              snapshotHash: row.snapshot_id ?? undefined,
              domain: 'QUARANTINE',
              reviewContext: {
                inspectionNo: row.inspection_no,
                finalResult: row.final_result,
                snapshotId: row.snapshot_id,
              },
            }
          : undefined;
      }
      case 'CALIBRATION_RECORD': {
        const row = await this.database
          .selectFrom('calibration_records')
          .selectAll()
          .where('id', '=', subjectId)
          .executeTakeFirst();
        return row
          ? {
              subjectType,
              subjectId,
              state: row.state,
              version: BigInt(row.version),
              authorId: row.created_by,
              snapshotHash: row.certificate_no ?? undefined,
              domain: 'ASSETS',
              reviewContext: {
                calibrationNo: row.calibration_no,
                result: row.result,
                equipmentId: row.equipment_id,
              },
            }
          : undefined;
      }
      case 'CHANGE_REQUEST': {
        const row = await this.database
          .selectFrom('change_requests')
          .selectAll()
          .where('id', '=', subjectId)
          .executeTakeFirst();
        return row
          ? {
              subjectType,
              subjectId,
              state: row.state,
              version: BigInt(row.version),
              authorId: row.requested_by,
              snapshotHash: row.target_snapshot_hash ?? undefined,
              domain: 'CHANGE_REQUESTS',
              reviewContext: {
                changeNo: row.change_no,
                targetType: row.target_type,
                targetId: row.target_id,
                targetVersion: BigInt(row.target_version).toString(),
                reason: row.reason,
                targetSnapshot: row.target_snapshot,
              },
            }
          : undefined;
      }
      default:
        return undefined;
    }
  }
}
