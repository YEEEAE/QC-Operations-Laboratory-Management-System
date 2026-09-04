import type { Kysely, Transaction } from 'kysely';
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
import { applyInspectionAction } from '../domain/inspection.js';
import { transitionInspection } from '../domain/inspection-state.js';
import type { AuditRepository } from '../../../../shared/audit/audit-repository.js';
import { PostgresAuditRepository } from '../../../../shared/audit/postgres-audit-repository.js';
import type { OutboxRepository } from '../../../../shared/outbox/outbox-repository.js';
import { PostgresOutboxRepository } from '../../../../shared/outbox/postgres-outbox-repository.js';

const map = (r: DatabaseRow<'inspection_reports'>, rec: DatabaseRow<'receiving_items'>, tv: DatabaseRow<'inspection_template_versions'>, resultRows: DatabaseRow<'inspection_report_results'>[] = []): Inspection => ({
  id: r.id, inspectionNo: r.inspection_no,
  receiving: { receivingId: rec.id, receivingNo: rec.receiving_no, docNo: rec.doc_no, itemCode: rec.item_code, description: rec.description, lot: rec.lot, qty: String(rec.qty), receivingDate: new Date(rec.receiving_date), expiryDate: rec.expiry_date ? new Date(rec.expiry_date) : undefined },
  template: { templateId: tv.template_id, templateVersionId: tv.id, versionNo: tv.version_no, templateSnapshot: { templateVersionId: tv.id, versionNo: tv.version_no }, approved: tv.state === 'APPROVED' },
  state: r.state as Inspection['state'], finalResult: r.final_result as Inspection['finalResult'], authorId: r.author_id,
  results: resultRows.map((result) => ({ id: result.id, pointId: result.template_point_id, value: result.numeric_value ?? result.text_value ?? result.boolean_value ?? result.selected_value ?? '', unit: result.unit ?? undefined, result: result.result ?? undefined, remarks: result.remarks ?? undefined, version: BigInt(result.version) })), submittedAt: r.submitted_at ?? undefined, version: BigInt(r.version), createdAt: r.created_at, updatedAt: r.updated_at,
});

export class PostgresInspectionRepository implements InspectionRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>, private readonly audit?: AuditRepository, private readonly outbox?: OutboxRepository) {}
  private async load(id: string) {
    const report = await this.db.selectFrom('inspection_reports').selectAll().where('id', '=', id).executeTakeFirst();
    if (!report) return undefined;
    const [receiving, template, results] = await Promise.all([
      this.db.selectFrom('receiving_items').selectAll().where('id', '=', report.receiving_item_id).executeTakeFirstOrThrow(),
      this.db.selectFrom('inspection_template_versions').selectAll().where('id', '=', report.template_version_id).executeTakeFirstOrThrow(),
      this.db.selectFrom('inspection_report_results').selectAll().where('inspection_report_id', '=', id).orderBy('entered_at').execute(),
    ]);
    return map(report, receiving, template, results);
  }
  async get(id: string, actor: ActorContext) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;
    const item = await this.load(id);
    const grant = actor.permissions.find((p) => p.code === 'PERM-INSP-VIEW');
    return item && actorHasScope(actor, { type: 'INSPECTION_REPORT', id: item.id, state: item.state, authorId: item.authorId, executorId: item.authorId }, { ownerId: item.authorId, assigneeId: item.authorId }, grant) ? item : undefined;
  }
  async list(i: { actor: ActorContext; assignedTo?: string; state?: Inspection['state'] }) {
    const rows = await this.db.selectFrom('inspection_reports').select('id').orderBy('updated_at', 'desc').execute();
    const result: Inspection[] = [];
    for (const row of rows) { const item = await this.get(row.id, i.actor); if (item && (!i.state || item.state === i.state) && (!i.assignedTo || item.authorId === i.assignedTo)) result.push(item); }
    return result;
  }
  async create(i: { inspection: Inspection; actor: ActorContext; requestId: string }) {
    try { const x = i.inspection; await this.db.insertInto('inspection_reports').values({ id: x.id, inspection_no: x.inspectionNo, receiving_item_id: x.receiving.receivingId, template_version_id: x.template.templateVersionId, state: 'DRAFT', final_result: null, author_id: x.authorId, submitted_at: null, review_started_at: null, approved_at: null, rejected_at: null, voided_at: null, void_reason: null, snapshot_id: null, created_by: x.authorId, updated_by: x.authorId, updated_at: x.updatedAt, version: 1n }).execute(); return x; } catch (e) { throw translateDatabaseError(e); }
  }
  async saveDraft(i: { id: string; expectedVersion: bigint; actor: ActorContext; results: readonly InspectionResultEntry[]; finalResult?: FinalResult; requestId: string }) {
    const r = await this.db.transaction().execute(async (tx) => {
      const updated = await tx.updateTable('inspection_reports').set({ updated_by: i.actor.id, updated_at: new Date(), version: i.expectedVersion + 1n }).where('id', '=', i.id).where('version', '=', i.expectedVersion).where('state', '=', 'DRAFT').returningAll().executeTakeFirst();
      if (!updated) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
      await tx.deleteFrom('inspection_report_results').where('inspection_report_id', '=', i.id).execute();
      for (const result of i.results) await tx.insertInto('inspection_report_results').values({ id: result.id, inspection_report_id: i.id, template_point_id: result.pointId, numeric_value: typeof result.value === 'number' ? String(result.value) : null, text_value: typeof result.value === 'string' ? result.value : null, boolean_value: typeof result.value === 'boolean' ? result.value : null, selected_value: null, unit: result.unit ?? null, result: null, remarks: result.remarks ?? null, entered_by: i.actor.id, entered_at: new Date(), updated_at: new Date(), version: 1n }).execute();
      return updated;
    });
    const item = await this.load(i.id); if (!item) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true }); return { ...item, version: BigInt(r.version) };
  }
  async transition(i: { id: string; expectedVersion: bigint; actor: ActorContext; action: InspectionAction; reason?: string; requestId: string }) {
    const old = await this.get(i.id, i.actor); if (!old) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    const next = transitionInspection(old.state, i.action);
    applyInspectionAction(old, i.action, i.reason);
    try {
      const result = await this.db.transaction().execute(async (tx) => {
        const now = new Date();
        const changes = {
          state: next,
          ...(i.action === 'BEGIN_REVIEW' ? { review_started_at: now } : {}),
          ...(i.action === 'APPROVE' ? { approved_at: now } : {}),
          ...(i.action === 'REJECT' ? { rejected_at: now } : {}),
          ...(i.action === 'VOID' ? { voided_at: now } : {}),
          ...(i.action === 'RETURN' || i.action === 'REJECT' || i.action === 'VOID' ? { void_reason: i.reason ?? null } : {}),
          updated_by: i.actor.id,
          updated_at: now,
          version: i.expectedVersion + 1n,
        };
        const r = await tx.updateTable('inspection_reports').set(changes).where('id', '=', i.id).where('version', '=', i.expectedVersion).where('state', '=', old.state).returningAll().executeTakeFirst();
        if (!r) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        if (i.action === 'SUBMIT') {
          const snapshot = await tx.insertInto('inspection_report_snapshots').values({ id: uuidv7(), inspection_report_id: i.id, snapshot_version: Number(i.expectedVersion), snapshot_stage: 'SUBMISSION', receiving_snapshot: old.receiving, template_snapshot: old.template.templateSnapshot, controlled_source_snapshot: null, criteria_snapshot: null, created_at: now, snapshot_hash: `inspection:${i.id}:v${i.expectedVersion}` }).returningAll().executeTakeFirstOrThrow();
          await tx.updateTable('inspection_reports').set({ snapshot_id: snapshot.id }).where('id', '=', i.id).execute();
        }
        if (i.action === 'APPROVE' && old.finalResult) await tx.updateTable('receiving_items').set({ workflow_state: 'INSPECTION_COMPLETE', inspection_result: old.finalResult, updated_by: i.actor.id, updated_at: now }).where('id', '=', old.receiving.receivingId).execute();
        await this.auditFor(tx)?.append({ actorType: 'USER', actorId: i.actor.id, subjectType: 'INSPECTION_REPORT', subjectId: i.id, action: i.action, oldState: old.state, newState: next, reason: i.reason, requestId: i.requestId, payload: i.action === 'APPROVE' ? { finalResult: old.finalResult ?? 'UNDETERMINED' } : undefined });
        await this.outboxFor(tx)?.enqueue({ eventType: 'INSPECTION_CHANGED', aggregateType: 'INSPECTION_REPORT', aggregateId: i.id, payload: { action: i.action, state: next, finalResult: old.finalResult ?? null }, dedupeKey: `inspection:${i.id}:v${i.expectedVersion + 1n}` });
        return r;
      });
      const item = await this.load(i.id); if (!item) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true }); return { ...item, version: BigInt(result.version) };
    } catch (e) { if (e instanceof AppError) throw e; throw translateDatabaseError(e); }
  }

  private auditFor(tx: Transaction<DatabaseSchema>): AuditRepository | undefined {
    return this.audit instanceof PostgresAuditRepository ? new PostgresAuditRepository(tx) : this.audit;
  }

  private outboxFor(tx: Transaction<DatabaseSchema>): OutboxRepository | undefined {
    return this.outbox instanceof PostgresOutboxRepository ? new PostgresOutboxRepository(tx) : this.outbox;
  }
}
