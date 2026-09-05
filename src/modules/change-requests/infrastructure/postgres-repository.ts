import { createHash } from 'node:crypto';
import type { Kysely, Transaction } from 'kysely';
import type { DatabaseRow, DatabaseSchema } from '../../../shared/database/db-types.js';
import { translateDatabaseError } from '../../../shared/database/database.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { AuditRepository } from '../../../shared/audit/audit-repository.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import type { AuditEventView } from '../../../shared/audit/audit-query.js';
import type { OutboxRepository } from '../../../shared/outbox/outbox-repository.js';
import { PostgresOutboxRepository } from '../../../shared/outbox/postgres-outbox-repository.js';
import { isUuid } from '../../../shared/id/uuid.js';
import {
  transitionChangeRequest,
  type ChangeRequest,
  type ChangeRequestAction,
  type ChangeRequestApplicationAttempt,
  type ChangeRequestChange,
} from '../domain/change-request.js';
import type { ChangeRequestRepository, ChangeRequestListFilter, ChangeRequestAggregate } from '../ports/repository.js';

const requestMap = (row: DatabaseRow<'change_requests'>): ChangeRequest => ({
  id: row.id,
  changeNo: row.change_no,
  targetType: row.target_type,
  targetId: row.target_id,
  targetVersion: BigInt(row.target_version),
  state: row.state as ChangeRequest['state'],
  reason: row.reason,
  targetSnapshot: (row.target_snapshot ?? {}) as Readonly<Record<string, unknown>>,
  ...(row.target_snapshot_hash ? { targetSnapshotHash: row.target_snapshot_hash } : {}),
  requestedBy: row.requested_by,
  ...(row.submitted_at ? { submittedAt: row.submitted_at } : {}),
  ...(row.approved_at ? { approvedAt: row.approved_at } : {}),
  ...(row.rejected_at ? { rejectedAt: row.rejected_at } : {}),
  ...(row.applied_at ? { appliedAt: row.applied_at } : {}),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  version: BigInt(row.version),
});

const changeMap = (row: DatabaseRow<'change_request_changes'>): ChangeRequestChange => ({
  id: row.id,
  fieldPath: row.field_path,
  currentValue: row.current_value,
  proposedValue: row.proposed_value,
  dataType: row.data_type,
  position: row.position,
});

const attemptMap = (row: DatabaseRow<'change_application_attempts'>): ChangeRequestApplicationAttempt => ({
  id: row.id,
  changeRequestId: row.change_request_id,
  attemptNo: row.attempt_no,
  startedAt: row.started_at,
  ...(row.finished_at ? { finishedAt: row.finished_at } : {}),
  result: row.result as ChangeRequestApplicationAttempt['result'],
  ...(row.target_version_before !== null ? { targetVersionBefore: BigInt(row.target_version_before) } : {}),
  ...(row.target_version_after !== null ? { targetVersionAfter: BigInt(row.target_version_after) } : {}),
  ...(row.error_code ? { errorCode: row.error_code } : {}),
  requestId: row.request_id,
});

function historyMap(row: Record<string, unknown>): AuditEventView {
  return {
    id: row.id as string,
    eventNo: BigInt(row.event_no as bigint | number | string),
    occurredAt: row.occurred_at as Date,
    actorType: row.actor_type as AuditEventView['actorType'],
    ...(row.actor_id ? { actorId: row.actor_id as string } : {}),
    subjectType: row.subject_type as string,
    subjectId: row.subject_id as string,
    action: row.action as string,
    ...(row.old_state ? { oldState: row.old_state as string } : {}),
    ...(row.new_state ? { newState: row.new_state as string } : {}),
    ...(row.reason ? { reason: row.reason as string } : {}),
    requestId: row.request_id as string,
    ...(row.signature_id ? { signatureId: row.signature_id as string } : {}),
  };
}

export class PostgresChangeRequestRepository implements ChangeRequestRepository {
  constructor(
    private readonly database: Kysely<DatabaseSchema>,
    private readonly audit?: AuditRepository,
    private readonly outbox?: OutboxRepository,
  ) {}

  async create(input: { aggregate: ChangeRequestAggregate; actor: ActorContext; requestId: string }): Promise<ChangeRequestAggregate> {
    try {
      return await this.database.transaction().execute(async (tx) => {
        const request = input.aggregate.changeRequest;
        const row = await tx.insertInto('change_requests').values({
          id: request.id,
          change_no: request.changeNo,
          target_type: request.targetType,
          target_id: request.targetId,
          target_version: request.targetVersion,
          state: request.state,
          reason: request.reason,
          target_snapshot: JSON.stringify(request.targetSnapshot),
          target_snapshot_hash: request.targetSnapshotHash ?? null,
          requested_by: request.requestedBy,
          submitted_at: null,
          approved_at: null,
          rejected_at: null,
          applied_at: null,
          created_at: request.createdAt,
          updated_at: request.updatedAt,
          version: request.version,
        }).returningAll().executeTakeFirstOrThrow();
        if (input.aggregate.changes.length)
          await tx.insertInto('change_request_changes').values(input.aggregate.changes.map((change) => ({
            id: change.id,
            change_request_id: request.id,
            field_path: change.fieldPath,
            current_value: change.currentValue === undefined ? null : JSON.stringify(change.currentValue),
            proposed_value: change.proposedValue === undefined ? null : JSON.stringify(change.proposedValue),
            data_type: change.dataType,
            position: change.position,
          }))).execute();
        await this.auditFor(tx)?.append({ actorType: 'USER', actorId: input.actor.id, subjectType: 'CHANGE_REQUEST', subjectId: request.id, action: 'CREATE_CHANGE_REQUEST', newState: 'DRAFT', requestId: input.requestId });
        await this.outboxFor(tx)?.enqueue({ eventType: 'CHANGE_REQUEST_CREATED', aggregateType: 'CHANGE_REQUEST', aggregateId: request.id, payload: { changeNo: request.changeNo }, dedupeKey: `change-request-created:${request.id}` });
        return this.loadAggregate(tx, requestMap(row));
      });
    } catch (error) { throw error instanceof AppError ? error : translateDatabaseError(error); }
  }

  async get(input: { id: string; actor: ActorContext }): Promise<ChangeRequestAggregate | undefined> {
    if (!isUuid(input.id)) return undefined;
    try {
      const row = await this.scopedQuery(input.actor).where('id', '=', input.id).executeTakeFirst();
      return row ? this.loadAggregate(this.database, requestMap(row)) : undefined;
    } catch (error) { throw translateDatabaseError(error); }
  }

  async list(input: { actor: ActorContext; filter?: ChangeRequestListFilter }): Promise<readonly ChangeRequestAggregate[]> {
    try {
      let query = this.scopedQuery(input.actor).selectAll().orderBy('updated_at', 'desc');
      if (input.filter?.state) query = query.where('state', '=', input.filter.state) as typeof query;
      if (input.filter?.targetType) query = query.where('target_type', '=', input.filter.targetType) as typeof query;
      if (input.filter?.requestedBy) query = query.where('requested_by', '=', input.filter.requestedBy) as typeof query;
      const rows = await query.execute();
      return Promise.all(rows.map((row) => this.loadAggregate(this.database, requestMap(row))));
    } catch (error) { throw translateDatabaseError(error); }
  }

  async findTransitionByRequestId(input: { id: string; requestId: string }): Promise<{ action: ChangeRequestAction; expectedVersion: bigint } | undefined> {
    const row = await this.database.selectFrom('audit_events').select(['action', 'payload']).where('subject_type', '=', 'CHANGE_REQUEST').where('subject_id', '=', input.id).where('request_id', '=', input.requestId).where('action', 'like', 'CHANGE_REQUEST_%').executeTakeFirst();
    if (!row || row.action === 'CHANGE_REQUEST_CREATED') return undefined;
    const action = row.action.replace('CHANGE_REQUEST_', '') as ChangeRequestAction;
    const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) as Record<string, unknown> : row.payload as Record<string, unknown> | null;
    const expectedVersion = payload?.expectedVersion;
    if (typeof expectedVersion !== 'string' && typeof expectedVersion !== 'number') return undefined;
    return { action, expectedVersion: BigInt(expectedVersion) };
  }

  async updateDraft(input: { id: string; expectedVersion: bigint; actor: ActorContext; reason: string; requestId: string; now: Date }): Promise<ChangeRequestAggregate> {
    try {
      return await this.database.transaction().execute(async (tx) => {
        const row = await tx.updateTable('change_requests').set({ reason: input.reason.trim(), updated_at: input.now, version: input.expectedVersion + 1n }).where('id', '=', input.id).where('requested_by', '=', input.actor.id).where('state', '=', 'DRAFT').where('version', '=', input.expectedVersion).returningAll().executeTakeFirst();
        if (!row) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        await this.auditFor(tx)?.append({ actorType: 'USER', actorId: input.actor.id, subjectType: 'CHANGE_REQUEST', subjectId: input.id, action: 'UPDATE_DRAFT', oldState: 'DRAFT', newState: 'DRAFT', requestId: input.requestId, payload: { expectedVersion: input.expectedVersion.toString(), nextVersion: (input.expectedVersion + 1n).toString() } });
        return this.loadAggregate(tx, requestMap(row));
      });
    } catch (error) { throw error instanceof AppError ? error : translateDatabaseError(error); }
  }

  async transition(input: { id: string; expectedVersion: bigint; action: ChangeRequestAction; reason?: string; actor: ActorContext; requestId: string; now: Date }): Promise<ChangeRequestAggregate> {
    try {
      return await this.database.transaction().execute(async (tx) => {
        const oldRow = await tx.selectFrom('change_requests').selectAll().where('id', '=', input.id).where('version', '=', input.expectedVersion).forUpdate().executeTakeFirst();
        if (!oldRow) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        const next = transitionChangeRequest(requestMap(oldRow), { action: input.action, reason: input.reason, now: input.now });
        const values = {
          state: next.state,
          submitted_at: next.submittedAt ?? null,
          approved_at: next.approvedAt ?? null,
          rejected_at: next.rejectedAt ?? null,
          applied_at: next.appliedAt ?? null,
          updated_at: next.updatedAt,
          version: next.version,
        };
        const row = await tx.updateTable('change_requests').set(values).where('id', '=', input.id).where('version', '=', input.expectedVersion).returningAll().executeTakeFirst();
        if (!row) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        await this.auditFor(tx)?.append({ actorType: 'USER', actorId: input.actor.id, subjectType: 'CHANGE_REQUEST', subjectId: input.id, action: `CHANGE_REQUEST_${input.action}`, transitionId: `TR-CHG-${input.action}`, oldState: oldRow.state, newState: next.state, reason: input.reason, requestId: input.requestId, payload: { expectedVersion: input.expectedVersion.toString(), nextVersion: next.version.toString() } });
        await this.outboxFor(tx)?.enqueue({ eventType: 'CHANGE_REQUEST_TRANSITIONED', aggregateType: 'CHANGE_REQUEST', aggregateId: input.id, payload: { action: input.action, state: next.state, version: next.version.toString() }, dedupeKey: `change-request-transition:${input.id}:${input.requestId}` });
        return this.loadAggregate(tx, requestMap(row));
      });
    } catch (error) { throw error instanceof AppError ? error : translateDatabaseError(error); }
  }

  async recordApplicationAttempt(input: { attempt: ChangeRequestApplicationAttempt; actorId: string; requestId: string }): Promise<ChangeRequestAggregate> {
    try {
      return await this.database.transaction().execute(async (tx) => {
        const attempt = input.attempt;
        await tx.insertInto('change_application_attempts').values({ id: attempt.id, change_request_id: attempt.changeRequestId, attempt_no: attempt.attemptNo, started_at: attempt.startedAt, finished_at: attempt.finishedAt ?? null, result: attempt.result, target_version_before: attempt.targetVersionBefore ?? null, target_version_after: attempt.targetVersionAfter ?? null, error_code: attempt.errorCode ?? null, request_id: attempt.requestId }).execute();
        await this.auditFor(tx)?.append({ actorType: 'SYSTEM', actorId: input.actorId, subjectType: 'CHANGE_REQUEST', subjectId: attempt.changeRequestId, action: `CHANGE_REQUEST_APPLICATION_${attempt.result}`, newState: attempt.result === 'SUCCESS' ? 'APPLIED' : 'APPLICATION_FAILED', reason: attempt.errorCode, requestId: input.requestId, payload: { attemptNo: attempt.attemptNo } });
        return this.getWithin(tx, attempt.changeRequestId);
      });
    } catch (error) { throw error instanceof AppError ? error : translateDatabaseError(error); }
  }

  private scopedQuery(actor: ActorContext) {
    const workflow = actor.permissions.some((permission) => permission.active !== false && [...['PERM-CHG-REVIEW', 'PERM-CHG-RETURN', 'PERM-CHG-APPROVE', 'PERM-CHG-REJECT'], 'PERM-CHG-VIEW'].includes(permission.code) && permission.scopes.some((scope) => scope === 'GLOBAL' || scope === 'DOMAIN'));
    return this.database.selectFrom('change_requests').selectAll().where((eb) => workflow ? eb.or([eb('requested_by', '=', actor.id), eb('target_type', 'is not', null)]) : eb('requested_by', '=', actor.id));
  }

  private async getWithin(database: Kysely<DatabaseSchema> | Transaction<DatabaseSchema>, id: string): Promise<ChangeRequestAggregate> {
    const row = await database.selectFrom('change_requests').selectAll().where('id', '=', id).executeTakeFirst();
    if (!row) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    return this.loadAggregate(database, requestMap(row));
  }

  private async loadAggregate(database: Kysely<DatabaseSchema> | Transaction<DatabaseSchema>, request: ChangeRequest): Promise<ChangeRequestAggregate> {
    const [changes, attempts, historyRows] = await Promise.all([
      database.selectFrom('change_request_changes').selectAll().where('change_request_id', '=', request.id).orderBy('position').execute(),
      database.selectFrom('change_application_attempts').selectAll().where('change_request_id', '=', request.id).orderBy('attempt_no').execute(),
      database.selectFrom('audit_events').selectAll().where('subject_type', '=', 'CHANGE_REQUEST').where('subject_id', '=', request.id).orderBy('occurred_at', 'asc').orderBy('event_no', 'asc').execute(),
    ]);
    return { changeRequest: request, changes: changes.map(changeMap), history: historyRows.map((row) => historyMap(row)), applicationAttempts: attempts.map(attemptMap) };
  }

  private auditFor(database: Kysely<DatabaseSchema> | Transaction<DatabaseSchema>): AuditRepository | undefined {
    return this.audit instanceof PostgresAuditRepository ? new PostgresAuditRepository(database) : this.audit;
  }

  private outboxFor(database: Kysely<DatabaseSchema> | Transaction<DatabaseSchema>): OutboxRepository | undefined {
    return this.outbox instanceof PostgresOutboxRepository ? new PostgresOutboxRepository(database) : this.outbox;
  }
}

export function changeRequestCommandFingerprint(input: { action: ChangeRequestAction; expectedVersion: bigint; reason?: string }): string {
  return createHash('sha256').update(JSON.stringify({ action: input.action, expectedVersion: input.expectedVersion.toString(), reason: input.reason ?? null })).digest('hex');
}
