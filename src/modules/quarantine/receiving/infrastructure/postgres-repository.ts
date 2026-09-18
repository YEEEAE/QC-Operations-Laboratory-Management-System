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
import { createHash } from 'node:crypto';
import { stableJson } from '../../../../shared/json/stable-stringify.js';

const map = (r: DatabaseRow<'receiving_items'>): ReceivingItem => ({
  id: r.id,
  receivingNo: r.receiving_no,
  supplier: r.supplier_name ?? '',
  docNo: r.doc_no,
  itemCode: r.item_code,
  description: r.description,
  lot: r.lot,
  qty: String(r.qty),
  receivingDate: new Date(r.receiving_date),
  expiryDate: r.expiry_date ? new Date(r.expiry_date) : undefined,
  workflowState: r.workflow_state as ReceivingItem['workflowState'],
  inspectionResult: r.inspection_result as ReceivingItem['inspectionResult'],
  releaseSystem: r.release_system,
  createdBy: r.created_by,
  createdAt: r.created_at,
  updatedBy: r.updated_by ?? undefined,
  updatedAt: r.updated_at,
  version: BigInt(r.version),
});

export class PostgresReceivingRepository implements ReceivingRepository {
  constructor(
    private readonly db: Kysely<DatabaseSchema>,
    private readonly audit?: AuditRepository,
    private readonly outbox?: OutboxRepository,
  ) {}

  async create(i: { item: ReceivingItem; actor: ActorContext; requestId: string }) {
    try {
      return await this.db.transaction().execute(async (tx) => {
        const r = await tx
          .insertInto('receiving_items')
          .values({
            id: i.item.id,
            receiving_no: i.item.receivingNo,
            supplier_name: i.item.supplier,
            doc_no: i.item.docNo,
            item_code: i.item.itemCode,
            description: i.item.description,
            lot: i.item.lot,
            qty: i.item.qty,
            receiving_date: i.item.receivingDate.toISOString().slice(0, 10),
            expiry_date: i.item.expiryDate?.toISOString().slice(0, 10) ?? null,
            workflow_state: 'PENDING',
            inspection_result: 'NOT_STARTED',
            release_system: false,
            released_at: null,
            released_by: null,
            created_by: i.actor.id,
            updated_by: i.actor.id,
            updated_at: i.item.updatedAt,
            version: 1n,
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        await this.auditFor(tx)?.append({
          actorType: 'USER',
          actorId: i.actor.id,
          subjectType: 'RECEIVING_ITEM',
          subjectId: i.item.id,
          action: 'CREATE_RECEIVING',
          newState: 'PENDING',
          requestId: i.requestId,
        });
        await this.outboxFor(tx)?.enqueue({
          eventType: 'RECEIVING_CREATED',
          aggregateType: 'RECEIVING_ITEM',
          aggregateId: i.item.id,
          payload: { receivingNo: i.item.receivingNo, state: 'PENDING' },
          dedupeKey: `receiving-created:${i.item.id}`,
        });
        return map(r);
      });
    } catch (e) {
      throw translateDatabaseError(e);
    }
  }

  async get(id: string, actor: ActorContext) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;
    const r = await this.db
      .selectFrom('receiving_items')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    if (!r) return undefined;
    const x = map(r);
    const [inspection, history, evidence] = await Promise.all([
      this.db
        .selectFrom('inspection_reports')
        .select('author_id')
        .where('receiving_item_id', '=', id)
        .where('state', '=', 'APPROVED')
        .orderBy('updated_at', 'desc')
        .executeTakeFirst(),
      this.db
        .selectFrom('audit_events')
        .select([
          'action',
          'old_state',
          'new_state',
          'reason',
          'actor_id',
          'occurred_at',
          'request_id',
        ])
        .where('subject_type', '=', 'RECEIVING_ITEM')
        .where('subject_id', '=', id)
        .orderBy('occurred_at', 'desc')
        .limit(100)
        .execute(),
      this.db
        .selectFrom('evidence_links')
        .select((eb) => eb.fn.count('id').as('count'))
        .where('subject_type', '=', 'RECEIVING_ITEM')
        .where('subject_id', '=', id)
        .where('removed_at', 'is', null)
        .executeTakeFirstOrThrow(),
    ]);
    const grant = actor.permissions.find((p) => p.code === 'PERM-QUAR-VIEW');
    return actorHasScope(
      actor,
      { type: 'RECEIVING_ITEM', id: x.id, state: x.workflowState, ownerId: x.createdBy },
      { ownerId: x.createdBy },
      grant,
    )
      ? {
          ...x,
          inspectionAuthorId: inspection?.author_id,
          evidenceCount: Number(evidence.count),
          history: history.map((event) => ({
            action: event.action,
            oldState: event.old_state ?? undefined,
            newState: event.new_state ?? undefined,
            reason: event.reason ?? undefined,
            actorId: event.actor_id ?? undefined,
            occurredAt: event.occurred_at,
            requestId: event.request_id,
          })),
        }
      : undefined;
  }

  async list(i: {
    actor: ActorContext;
    state?: ReceivingItem['workflowState'];
    inspectionResult?: ReceivingItem['inspectionResult'];
    releaseState?: 'RELEASED' | 'NOT_RELEASED';
    ownership?: 'mine';
  }) {
    let query = this.db
      .selectFrom('receiving_items')
      .selectAll()
      .orderBy('updated_at', 'desc')
      .orderBy('id', 'desc');
    if (i.state) query = query.where('workflow_state', '=', i.state) as typeof query;
    // Canonical server-side filters for the dashboard/quarantine drill-downs.
    // The workflow state, the scientific inspection result, and the release
    // system state remain three separate facts.
    if (i.inspectionResult)
      query = query.where('inspection_result', '=', i.inspectionResult) as typeof query;
    if (i.releaseState)
      query = query.where('release_system', '=', i.releaseState === 'RELEASED') as typeof query;
    // Ownership is a display/verification filter on the same owner dimension the
    // dashboard KPIs use, so a personal KPI can link to exactly its own set.
    if (i.ownership === 'mine') query = query.where('created_by', '=', i.actor.id) as typeof query;
    const rows = await query.execute();
    const grant = i.actor.permissions.find((p) => p.code === 'PERM-QUAR-VIEW');
    return rows
      .map(map)
      .filter((x) =>
        actorHasScope(
          i.actor,
          { type: 'RECEIVING_ITEM', id: x.id, state: x.workflowState, ownerId: x.createdBy },
          { ownerId: x.createdBy },
          grant,
        ),
      );
  }

  async updateDraft(i: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    supplier: string;
    docNo: string;
    itemCode: string;
    description: string;
    lot: string;
    qty: string;
    receivingDate: Date;
    expiryDate?: Date;
    requestId: string;
  }) {
    try {
      const r = await this.db
        .updateTable('receiving_items')
        .set({
          supplier_name: i.supplier,
          doc_no: i.docNo,
          item_code: i.itemCode,
          description: i.description,
          lot: i.lot,
          qty: i.qty,
          receiving_date: i.receivingDate.toISOString().slice(0, 10),
          expiry_date: i.expiryDate?.toISOString().slice(0, 10) ?? null,
          updated_by: i.actor.id,
          updated_at: new Date(),
          version: i.expectedVersion + 1n,
        })
        .where('id', '=', i.id)
        .where('version', '=', i.expectedVersion)
        .where('workflow_state', '=', 'PENDING')
        .returningAll()
        .executeTakeFirst();
      if (!r) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
      return map(r);
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw translateDatabaseError(e);
    }
  }

  async transition(i: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    action: ReceivingAction;
    reason?: string;
    requestId: string;
  }) {
    const old = await this.get(i.id, i.actor);
    if (!old) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    const changed = applyReceivingAction(old, i.action, i.reason);
    try {
      const result = await this.db.transaction().execute(async (tx) => {
        const idempotencyKey = `RECEIVING:${i.action}:${i.id}:${i.requestId}`;
        const commandFingerprint = createHash('sha256')
          .update(
            stableJson({
              id: i.id,
              expectedVersion: String(i.expectedVersion),
              actorId: i.actor.id,
              action: i.action,
              reason: i.reason ?? null,
            }),
          )
          .digest('hex');
        const existing = await tx
          .selectFrom('idempotency_records')
          .select(['request_fingerprint', 'status'])
          .where('key', '=', idempotencyKey)
          .forUpdate()
          .executeTakeFirst();
        if (existing) {
          if (
            existing.request_fingerprint !== commandFingerprint ||
            existing.status !== 'COMPLETED'
          )
            throw new AppError('CONFLICT_DUPLICATE_COMMAND', { userSafe: true });
          const replay = await tx
            .selectFrom('receiving_items')
            .selectAll()
            .where('id', '=', i.id)
            .executeTakeFirstOrThrow();
          return replay;
        }
        await tx
          .insertInto('idempotency_records')
          .values({
            key: idempotencyKey,
            request_fingerprint: commandFingerprint,
            status: 'IN_PROGRESS',
            response_payload: null,
          })
          .execute();
        const releasing = i.action === 'RELEASE';
        const row = await tx
          .updateTable('receiving_items')
          .set({
            workflow_state: changed.workflowState,
            inspection_result: old.inspectionResult,
            ...(releasing
              ? { release_system: true, released_at: new Date(), released_by: i.actor.id }
              : {}),
            updated_by: i.actor.id,
            updated_at: new Date(),
            version: i.expectedVersion + 1n,
          })
          .where('id', '=', i.id)
          .where('version', '=', i.expectedVersion)
          .where('workflow_state', '=', old.workflowState)
          .returningAll()
          .executeTakeFirst();
        if (!row) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        await this.auditFor(tx)?.append({
          actorType: 'USER',
          actorId: i.actor.id,
          subjectType: 'RECEIVING_ITEM',
          subjectId: i.id,
          action: i.action,
          oldState: old.workflowState,
          newState: changed.workflowState,
          reason: i.reason,
          requestId: i.requestId,
        });
        await this.outboxFor(tx)?.enqueue({
          eventType: 'RECEIVING_CHANGED',
          aggregateType: 'RECEIVING_ITEM',
          aggregateId: i.id,
          payload: {
            action: i.action,
            state: changed.workflowState,
            releaseSystem: releasing || old.releaseSystem,
          },
          dedupeKey: `receiving:${i.id}:v${i.expectedVersion + 1n}`,
        });
        await tx
          .updateTable('idempotency_records')
          .set({
            status: 'COMPLETED',
            response_payload: JSON.parse(stableJson(map(row))),
            completed_at: new Date(),
          })
          .where('key', '=', idempotencyKey)
          .execute();
        return row;
      });
      return map(result);
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw translateDatabaseError(e);
    }
  }

  async resolveReplay(i: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    requestId: string;
  }): Promise<ReceivingItem | undefined> {
    const key = `RECEIVING:RELEASE:${i.id}:${i.requestId}`;
    const fingerprint = createHash('sha256')
      .update(
        stableJson({
          id: i.id,
          expectedVersion: String(i.expectedVersion),
          actorId: i.actor.id,
          action: 'RELEASE',
          reason: null,
        }),
      )
      .digest('hex');
    const row = await this.db
      .selectFrom('idempotency_records')
      .select(['request_fingerprint', 'status'])
      .where('key', '=', key)
      .executeTakeFirst();
    if (!row) return undefined;
    if (row.request_fingerprint !== fingerprint || row.status !== 'COMPLETED')
      throw new AppError('CONFLICT_DUPLICATE_COMMAND', { userSafe: true });
    return this.get(i.id, i.actor);
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
