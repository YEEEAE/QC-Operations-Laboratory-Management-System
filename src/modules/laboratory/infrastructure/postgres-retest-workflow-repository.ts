import { sql, type Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { LabTest } from '../domain/lab-test.js';
import type { RetestRequest, RetestWorkflowRepository } from '../ports/retest-workflow-repository.js';

type Row = DatabaseSchema['lab_retest_requests'];
const mapRequest = (r: Row): RetestRequest => ({
  id: r.id,
  originalTestId: r.original_test_id,
  originalTestVersion: BigInt(r.original_test_version),
  originalScientificResult: r.original_scientific_result as LabTest['scientificResult'],
  requesterId: r.requester_id,
  reason: r.reason,
  investigation: r.investigation,
  status: r.status as RetestRequest['status'],
  decisionActorId: r.decision_actor_id,
  decisionAt: r.decision_at,
  decisionReason: r.decision_reason,
  sourceMethodReference: r.source_method_reference,
  sourceTemplateVersionId: r.source_template_version_id,
  sourceContentHash: r.source_content_hash,
  version: BigInt(r.version),
});

export class PostgresRetestWorkflowRepository implements RetestWorkflowRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  async createRequest(i: Parameters<RetestWorkflowRepository['createRequest']>[0]) {
    return this.db.transaction().execute(async (tx) => {
      await sql`select pg_advisory_xact_lock(hashtextextended(${`${i.actor.id}:${i.requestKey}`}, 0))`.execute(tx);
      const replay = await tx.selectFrom('lab_retest_requests').selectAll()
        .where('requester_id', '=', i.actor.id).where('request_key', '=', i.requestKey).executeTakeFirst();
      if (replay) {
        if (replay.original_test_id !== i.original.id || replay.reason !== i.reason || replay.investigation !== i.investigation)
          throw new AppError('DUPLICATE_COMMAND', { userSafe: true });
        return mapRequest(replay);
      }
      const original = await tx.selectFrom('lab_tests').selectAll().where('id', '=', i.original.id)
        .forUpdate().executeTakeFirst();
      if (!original || BigInt(original.version) !== i.original.version || original.original_test_id !== null ||
        original.scientific_result !== i.original.scientificResult ||
        original.template_version_id !== i.original.context.templateVersionId)
        throw new AppError('STALE_VERSION', { userSafe: true });
      const request = await tx.insertInto('lab_retest_requests').values({
        id: i.id,
        original_test_id: original.id,
        original_test_version: original.version,
        original_scientific_result: original.scientific_result,
        requester_id: i.actor.id,
        reason: i.reason,
        investigation: i.investigation,
        status: 'REQUESTED',
        decision_actor_id: null,
        decision_at: null,
        decision_reason: null,
        source_method_reference: i.original.context.methodReference,
        source_template_version_id: i.original.context.templateVersionId,
        source_content_hash: i.original.context.contentHash,
        request_key: i.requestKey,
        created_at: i.at,
        updated_at: i.at,
        version: 1n,
      }).returningAll().executeTakeFirstOrThrow();
      await tx.insertInto('lab_retest_request_events').values({
        request_id: request.id, event_type: 'REQUESTED', actor_id: i.actor.id,
        request_key: i.requestKey, event_payload: { reason: i.reason, investigation: i.investigation }, created_at: i.at,
      }).execute();
      await new PostgresAuditRepository(tx).append({ actorType: 'USER', actorId: i.actor.id, subjectType: 'LAB_RETEST_REQUEST',
        subjectId: request.id, action: 'LAB_RETEST_REQUESTED', requestId: i.requestKey,
        payload: { originalTestId: original.id, originalVersion: String(original.version), originalResult: original.scientific_result,
          methodReference: i.original.context.methodReference, contentHash: i.original.context.contentHash } });
      return mapRequest(request);
    });
  }

  async getRequest(id: string) {
    const row = await this.db.selectFrom('lab_retest_requests').selectAll().where('id', '=', id).executeTakeFirst();
    return row ? mapRequest(row) : undefined;
  }

  async recordInvestigation(i: Parameters<RetestWorkflowRepository['recordInvestigation']>[0]) {
    return this.db.transaction().execute(async (tx) => {
      const current = await tx.selectFrom('lab_retest_requests').selectAll().where('id', '=', i.request.id)
        .forUpdate().executeTakeFirst();
      if (!current) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      const replay = await tx.selectFrom('lab_retest_request_events').selectAll().where('request_id', '=', i.request.id)
        .where('actor_id', '=', i.actor.id).where('request_key', '=', i.requestKey).executeTakeFirst();
      if (replay) {
        const payload = replay.event_payload as { investigation?: unknown };
        if (replay.event_type !== 'INVESTIGATION_RECORDED' || payload.investigation !== i.investigation)
          throw new AppError('DUPLICATE_COMMAND', { userSafe: true });
        return mapRequest(current);
      }
      if (BigInt(current.version) !== i.expectedVersion) throw new AppError('STALE_VERSION', { userSafe: true });
      if (!['REQUESTED', 'INVESTIGATING'].includes(current.status)) throw new AppError('CONFLICT_STATE', { userSafe: true });
      const next = await tx.updateTable('lab_retest_requests').set({ investigation: i.investigation,
        status: 'INVESTIGATING', version: sql`version + 1`, updated_at: i.at })
        .where('id', '=', current.id).where('version', '=', current.version).returningAll().executeTakeFirst();
      if (!next) throw new AppError('STALE_VERSION', { userSafe: true });
      await tx.insertInto('lab_retest_request_events').values({ request_id: next.id, event_type: 'INVESTIGATION_RECORDED',
        actor_id: i.actor.id, request_key: i.requestKey, event_payload: { investigation: i.investigation }, created_at: i.at }).execute();
      await new PostgresAuditRepository(tx).append({ actorType: 'USER', actorId: i.actor.id, subjectType: 'LAB_RETEST_REQUEST', subjectId: next.id,
        action: 'LAB_RETEST_INVESTIGATION_RECORDED', requestId: i.requestKey, payload: { version: String(next.version) } });
      return mapRequest(next);
    });
  }

  async decide(i: Parameters<RetestWorkflowRepository['decide']>[0]) {
    return this.db.transaction().execute(async (tx) => {
      const current = await tx.selectFrom('lab_retest_requests').selectAll().where('id', '=', i.request.id)
        .forUpdate().executeTakeFirst();
      if (!current) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      const replay = await tx.selectFrom('lab_retest_request_events').selectAll().where('request_id', '=', i.request.id)
        .where('actor_id', '=', i.actor.id).where('request_key', '=', i.requestKey).executeTakeFirst();
      if (replay) {
        const payload = replay.event_payload as { reason?: unknown };
        if (replay.event_type !== i.decision || payload.reason !== i.reason)
          throw new AppError('DUPLICATE_COMMAND', { userSafe: true });
        return mapRequest(current);
      }
      const original = await tx.selectFrom('lab_tests').select(['id', 'version'])
        .where('id', '=', current.original_test_id).forUpdate().executeTakeFirst();
      if (!original || BigInt(original.version) !== BigInt(current.original_test_version))
        throw new AppError('STALE_VERSION', { userSafe: true });
      if (BigInt(current.version) !== i.expectedVersion) throw new AppError('STALE_VERSION', { userSafe: true });
      if (i.decision === 'APPROVED') {
        const existingRetest = await tx.selectFrom('lab_tests').select('id')
          .where('original_test_id', '=', current.original_test_id).where('retest_sequence', '=', 1)
          .executeTakeFirst();
        if (existingRetest) throw new AppError('CONFLICT_STATE', { userSafe: true });
      }
      if (!['REQUESTED', 'INVESTIGATING'].includes(current.status)) throw new AppError('CONFLICT_STATE', { userSafe: true });
      const next = await tx.updateTable('lab_retest_requests').set({ status: i.decision, decision_actor_id: i.actor.id,
        decision_at: i.at, decision_reason: i.reason, version: sql`version + 1`, updated_at: i.at })
        .where('id', '=', current.id).where('version', '=', current.version).returningAll().executeTakeFirst();
      if (!next) throw new AppError('STALE_VERSION', { userSafe: true });
      await tx.insertInto('lab_retest_request_events').values({ request_id: next.id, event_type: i.decision,
        actor_id: i.actor.id, request_key: i.requestKey, event_payload: { reason: i.reason }, created_at: i.at }).execute();
      await new PostgresAuditRepository(tx).append({ actorType: 'USER', actorId: i.actor.id, subjectType: 'LAB_RETEST_REQUEST', subjectId: next.id,
        action: `LAB_RETEST_${i.decision}`, requestId: i.requestKey, payload: { version: String(next.version), reason: i.reason } });
      return mapRequest(next);
    });
  }
}
