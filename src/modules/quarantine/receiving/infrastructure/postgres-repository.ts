import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema, DatabaseRow } from '../../../../shared/database/db-types.js';
import { translateDatabaseError } from '../../../../shared/database/database.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import { actorHasScope } from '../../../../shared/authorization/scope-evaluator.js';
import type { ReceivingRepository } from '../ports/repository.js';
import type { ReceivingItem } from '../domain/receiving-item.js';
import type { ReceivingAction } from '../domain/receiving-state.js';
import { applyReceivingAction } from '../domain/receiving-item.js';
import type { AuditRepository } from '../../../../shared/audit/audit-repository.js';
import { PostgresAuditRepository } from '../../../../shared/audit/postgres-audit-repository.js';
import type { OutboxRepository } from '../../../../shared/outbox/outbox-repository.js';
import { PostgresOutboxRepository } from '../../../../shared/outbox/postgres-outbox-repository.js';

const map = (r: DatabaseRow<'receiving_items'>): ReceivingItem => ({
  id: r.id, receivingNo: r.receiving_no, docNo: r.doc_no, itemCode: r.item_code,
  description: r.description, lot: r.lot, qty: String(r.qty), receivingDate: new Date(r.receiving_date),
  expiryDate: r.expiry_date ? new Date(r.expiry_date) : undefined,
  workflowState: r.workflow_state as ReceivingItem['workflowState'],
  inspectionResult: r.inspection_result as ReceivingItem['inspectionResult'],
  releaseSystem: r.release_system, createdBy: r.created_by, createdAt: r.created_at,
  updatedBy: r.updated_by ?? undefined, updatedAt: r.updated_at, version: BigInt(r.version),
});

export class PostgresReceivingRepository implements ReceivingRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>, private readonly audit?: AuditRepository, private readonly outbox?: OutboxRepository) {}

  async create(i: { item: ReceivingItem; actor: ActorContext; requestId: string }) {
    try { return await this.db.transaction().execute(async (tx) => {
      const r = await tx.insertInto('receiving_items').values({
        id: i.item.id, receiving_no: i.item.receivingNo, doc_no: i.item.docNo, item_code: i.item.itemCode,
        description: i.item.description, lot: i.item.lot, qty: i.item.qty,
        receiving_date: i.item.receivingDate.toISOString().slice(0, 10),
        expiry_date: i.item.expiryDate?.toISOString().slice(0, 10) ?? null,
        workflow_state: 'PENDING', inspection_result: 'NOT_STARTED', release_system: false,
        released_at: null, released_by: null, created_by: i.actor.id, updated_by: i.actor.id,
        updated_at: i.item.updatedAt, version: 1n,
      }).returningAll().executeTakeFirstOrThrow();
      await this.auditFor(tx)?.append({ actorType: 'USER', actorId: i.actor.id, subjectType: 'RECEIVING_ITEM', subjectId: i.item.id, action: 'CREATE_RECEIVING', newState: 'PENDING', requestId: i.requestId });
      await this.outboxFor(tx)?.enqueue({ eventType: 'RECEIVING_CREATED', aggregateType: 'RECEIVING_ITEM', aggregateId: i.item.id, payload: { receivingNo: i.item.receivingNo, state: 'PENDING' }, dedupeKey: `receiving-created:${i.item.id}` });
      return map(r);
    });
    } catch (e) { throw translateDatabaseError(e); }
  }

  async get(id: string, actor: ActorContext) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;
    const r = await this.db.selectFrom('receiving_items').selectAll().where('id', '=', id).executeTakeFirst();
    if (!r) return undefined;
    const x = map(r);
    const grant = actor.permissions.find((p) => p.code === 'PERM-QUAR-VIEW');
    return actorHasScope(actor, { type: 'RECEIVING_ITEM', id: x.id, state: x.workflowState, ownerId: x.createdBy }, { ownerId: x.createdBy }, grant) ? x : undefined;
  }

  async list(i: { actor: ActorContext; state?: ReceivingItem['workflowState'] }) {
    let query = this.db.selectFrom('receiving_items').selectAll().orderBy('updated_at', 'desc');
    if (i.state) query = query.where('workflow_state', '=', i.state) as typeof query;
    const rows = await query.execute();
    const grant = i.actor.permissions.find((p) => p.code === 'PERM-QUAR-VIEW');
    return rows.map(map).filter((x) => actorHasScope(i.actor, { type: 'RECEIVING_ITEM', id: x.id, state: x.workflowState, ownerId: x.createdBy }, { ownerId: x.createdBy }, grant));
  }

  async updateDraft(i: { id: string; expectedVersion: bigint; actor: ActorContext; docNo: string; itemCode: string; description: string; lot: string; qty: string; receivingDate: Date; expiryDate?: Date; requestId: string }) {
    try {
      const r = await this.db.updateTable('receiving_items').set({ doc_no: i.docNo, item_code: i.itemCode, description: i.description, lot: i.lot, qty: i.qty, receiving_date: i.receivingDate.toISOString().slice(0, 10), expiry_date: i.expiryDate?.toISOString().slice(0, 10) ?? null, updated_by: i.actor.id, updated_at: new Date(), version: i.expectedVersion + 1n }).where('id', '=', i.id).where('version', '=', i.expectedVersion).where('workflow_state', '=', 'PENDING').returningAll().executeTakeFirst();
      if (!r) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
      return map(r);
    } catch (e) { if (e instanceof AppError) throw e; throw translateDatabaseError(e); }
  }

  async transition(i: { id: string; expectedVersion: bigint; actor: ActorContext; action: ReceivingAction; reason?: string; requestId: string }) {
    const old = await this.get(i.id, i.actor);
    if (!old) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    const changed = applyReceivingAction(old, i.action, i.reason);
    try {
      const result = await this.db.transaction().execute(async (tx) => {
        const releasing = i.action === 'RELEASE';
        const row = await tx.updateTable('receiving_items').set({
          workflow_state: changed.workflowState, inspection_result: old.inspectionResult,
          ...(releasing ? { release_system: true, released_at: new Date(), released_by: i.actor.id } : {}),
          updated_by: i.actor.id, updated_at: new Date(), version: i.expectedVersion + 1n,
        }).where('id', '=', i.id).where('version', '=', i.expectedVersion).where('workflow_state', '=', old.workflowState).returningAll().executeTakeFirst();
        if (!row) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        await this.auditFor(tx)?.append({ actorType: 'USER', actorId: i.actor.id, subjectType: 'RECEIVING_ITEM', subjectId: i.id, action: i.action, oldState: old.workflowState, newState: changed.workflowState, reason: i.reason, requestId: i.requestId });
        await this.outboxFor(tx)?.enqueue({ eventType: 'RECEIVING_CHANGED', aggregateType: 'RECEIVING_ITEM', aggregateId: i.id, payload: { action: i.action, state: changed.workflowState, releaseSystem: releasing || old.releaseSystem }, dedupeKey: `receiving:${i.id}:v${i.expectedVersion + 1n}` });
        return row;
      });
      return map(result);
    } catch (e) { if (e instanceof AppError) throw e; throw translateDatabaseError(e); }
  }

  private auditFor(tx: Transaction<DatabaseSchema>): AuditRepository | undefined {
    return this.audit instanceof PostgresAuditRepository ? new PostgresAuditRepository(tx) : this.audit;
  }

  private outboxFor(tx: Transaction<DatabaseSchema>): OutboxRepository | undefined {
    return this.outbox instanceof PostgresOutboxRepository ? new PostgresOutboxRepository(tx) : this.outbox;
  }
}
