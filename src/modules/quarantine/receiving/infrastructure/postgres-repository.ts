import type { Kysely, Transaction } from 'kysely';
import { sql } from 'kysely';
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
import type {
  ReceivingListQuery,
} from '../ports/repository.js';
import type {
  ReceivingInspectionStatus,
  ReceivingQuarantineStatus,
} from '../domain/receiving-status.js';

/**
 * Bounded link read: a receiving record shows its newest inspection reports;
 * older history stays available through the audit log instead of an unbounded
 * relation load.
 */
const LINKED_INSPECTION_LIMIT = 20;

/**
 * SQL projections of the derived inspection status. Every branch names existing
 * approved columns; the RETURNED branch reads the latest linked report, exactly
 * like `deriveInspectionStatus` does for a materialized row.
 */
const INSPECTION_STATUS_PREDICATES: Record<ReceivingInspectionStatus, RawSql> = {
  NOT_STARTED: sql`workflow_state in ('PENDING', 'READY_FOR_INSPECTION', 'EXPIRED')`,
  IN_PROGRESS: sql`(workflow_state = 'UNDER_INSPECTION' or inspection_result = 'IN_PROGRESS')`,
  COMPLETED: sql`(
    workflow_state in ('INSPECTION_COMPLETE', 'RELEASE_PENDING', 'RELEASED')
    or inspection_result in ('PASS', 'FAIL', 'HOLD')
  )`,
  RETURNED: sql`exists (
    select 1
    from qc.inspection_reports report
    where report.receiving_item_id = receiving_items.id
      and report.state = 'RETURNED'
  )`,
};

/** SQL projections of the derived quarantine/decision status. */
const QUARANTINE_STATUS_PREDICATES: Record<ReceivingQuarantineStatus, RawSql> = {
  PENDING_INSPECTION: sql`workflow_state in ('PENDING', 'READY_FOR_INSPECTION')`,
  UNDER_INSPECTION: sql`(
    workflow_state = 'UNDER_INSPECTION'
    and inspection_result not in ('PASS', 'FAIL', 'HOLD')
  )`,
  HOLD: sql`(workflow_state = 'HOLD' or inspection_result = 'HOLD')`,
  PASS: sql`inspection_result = 'PASS'`,
  REJECTED: sql`inspection_result = 'FAIL'`,
  CANCELLED: sql`workflow_state = 'CANCELLED'`,
  EXPIRED: sql`workflow_state = 'EXPIRED'`,
};


const map = (r: DatabaseRow<'receiving_items'>): ReceivingItem => ({
  id: r.id,
  receivingNo: r.receiving_no,
  supplier: r.supplier_name ?? '',
  docNo: r.doc_no,
  itemCode: r.item_code,
  description: r.description,
  lot: r.lot,
  qty: String(r.qty),
  // A legacy row may predate the unit contract (migration 0035) and is
  // reported as missing rather than assumed to be PCS.
  ...(r.quantity_unit ? { quantityUnit: r.quantity_unit as ReceivingItem['quantityUnit'] } : {}),
  ...(r.purchase_order_no ? { purchaseOrderNo: r.purchase_order_no } : {}),
  ...(r.source_system ? { sourceSystem: r.source_system } : {}),
  ...(r.source_reference ? { sourceReference: r.source_reference } : {}),
  ...(r.imported_at ? { importedAt: r.imported_at } : {}),
  receivingDate: new Date(r.receiving_date),
  expiryDate: r.expiry_date ? new Date(r.expiry_date) : undefined,
  workflowState: r.workflow_state as ReceivingItem['workflowState'],
  inspectionResult: r.inspection_result as ReceivingItem['inspectionResult'],
  releaseSystem: r.release_system,
  ...(r.released_at ? { releasedAt: r.released_at } : {}),
  ...(r.released_by ? { releasedBy: r.released_by } : {}),
  createdBy: r.created_by,
  createdAt: r.created_at,
  updatedBy: r.updated_by ?? undefined,
  updatedAt: r.updated_at,
  version: BigInt(r.version),
});

/** A Kysely raw SQL fragment (kysely does not export `SQL` directly). */
type RawSql = ReturnType<typeof sql>;

/** Escapes LIKE wildcards so a register search always means a literal search. */
const likePattern = (value: string): string => `%${value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')}%`;

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
            quantity_unit: i.item.quantityUnit ?? null,
            purchase_order_no: i.item.purchaseOrderNo ?? null,
            source_system: i.item.sourceSystem ?? null,
            source_reference: i.item.sourceReference ?? null,
            imported_at: i.item.importedAt ?? null,
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
    const [inspection, linked, history, evidence] = await Promise.all([
      this.db
        .selectFrom('inspection_reports')
        .select('author_id')
        .where('receiving_item_id', '=', id)
        .where('state', '=', 'APPROVED')
        .orderBy('updated_at', 'desc')
        .executeTakeFirst(),
      // Bounded, newest-first link read: the record workspace shows the linked
      // inspection reports without loading an unbounded relation.
      this.db
        .selectFrom('inspection_reports')
        .select([
          'id',
          'inspection_no',
          'state',
          'final_result',
          'assigned_user_id',
          'updated_at',
        ])
        .where('receiving_item_id', '=', id)
        .orderBy('updated_at', 'desc')
        .orderBy('id', 'desc')
        .limit(LINKED_INSPECTION_LIMIT)
        .execute(),
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
          latestInspectionReportState: linked[0]?.state ?? null,
          linkedInspections: linked.map((report) => ({
            id: report.id,
            inspectionNo: report.inspection_no,
            state: report.state,
            finalResult: report.final_result ?? undefined,
            assignedTo: report.assigned_user_id ?? undefined,
            updatedAt: report.updated_at,
          })),
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

  async list(i: ReceivingListQuery) {
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
    if (i.releaseState === 'RELEASE_PENDING')
      // A release request that has not been answered: not released yet, but the
      // record has entered the approved release workflow.
      query = query
        .where('release_system', '=', false)
        .where('workflow_state', '=', 'RELEASE_PENDING') as typeof query;
    else if (i.releaseState)
      query = query.where('release_system', '=', i.releaseState === 'RELEASED') as typeof query;
    // Ownership is a display/verification filter on the same owner dimension the
    // dashboard KPIs use, so a personal KPI can link to exactly its own set.
    if (i.ownership === 'mine') query = query.where('created_by', '=', i.actor.id) as typeof query;
    // Exact-day filter compared in PostgreSQL against the `date` column, so the
    // register's set matches a same-predicate counter regardless of the host
    // time zone (no client-side date arithmetic).
    if (i.receivingDate)
      query = query.where('receiving_date', '=', i.receivingDate) as typeof query;
    if (i.receivedFrom) query = query.where('receiving_date', '>=', i.receivedFrom) as typeof query;
    if (i.receivedTo) query = query.where('receiving_date', '<=', i.receivedTo) as typeof query;
    if (i.expiryFrom) query = query.where('expiry_date', '>=', i.expiryFrom) as typeof query;
    if (i.expiryTo) query = query.where('expiry_date', '<=', i.expiryTo) as typeof query;
    // Business-field lookups. `search` is a literal substring search across the
    // human identifiers of a receiving record (never a regex, never an id).
    if (i.itemCode) query = query.where('item_code', '=', i.itemCode) as typeof query;
    if (i.lot) query = query.where('lot', '=', i.lot) as typeof query;
    if (i.supplier) query = query.where('supplier_name', '=', i.supplier) as typeof query;
    if (i.purchaseOrderNo)
      query = query.where('purchase_order_no', '=', i.purchaseOrderNo) as typeof query;
    if (i.search) {
      const pattern = likePattern(i.search);
      query = query.where((eb) =>
        eb.or([
          eb('receiving_no', 'ilike', pattern),
          eb('doc_no', 'ilike', pattern),
          eb('item_code', 'ilike', pattern),
          eb('description', 'ilike', pattern),
          eb('lot', 'ilike', pattern),
          eb('supplier_name', 'ilike', pattern),
          eb('purchase_order_no', 'ilike', pattern),
        ]),
      ) as typeof query;
    }
    if (i.inspectionStatus || i.quarantine) {
      // Derived projections of the approved facts, applied as one SQL group per
      // dimension and combined with AND so both filters always narrow the set.
      // No second state machine: every branch names existing columns, and the
      // RETURNED branch reads the latest linked inspection report.
      const groups: RawSql[] = [];
      if (i.inspectionStatus) groups.push(INSPECTION_STATUS_PREDICATES[i.inspectionStatus]);
      if (i.quarantine) groups.push(QUARANTINE_STATUS_PREDICATES[i.quarantine]);
      query = query.where(
        sql<boolean>`${sql.join(
          groups.map((group) => sql`(${group})`),
          sql` and `,
        )}`,
      ) as typeof query;
    }
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
    quantityUnit: string;
    purchaseOrderNo?: string;
    receivingDate: Date;
    expiryDate?: Date;
    requestId: string;
  }) {
    try {
      const r = await this.db.transaction().execute(async (tx) => {
        const row = await tx
          .updateTable('receiving_items')
          .set({
            supplier_name: i.supplier,
            doc_no: i.docNo,
            item_code: i.itemCode,
            description: i.description,
            lot: i.lot,
            qty: i.qty,
            quantity_unit: i.quantityUnit,
            purchase_order_no: i.purchaseOrderNo ?? null,
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
        if (!row) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        // The draft edit is a real mutation, so it is audited with the change
        // that was made — never as an unlabelled version bump.
        await this.auditFor(tx)?.append({
          actorType: 'USER',
          actorId: i.actor.id,
          subjectType: 'RECEIVING_ITEM',
          subjectId: i.id,
          action: 'RECEIVING_UPDATED',
          newState: row.workflow_state,
          requestId: i.requestId,
        });
        return row;
      });
      return map(r);
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw translateDatabaseError(e);
    }
  }

  async correct(i: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    reason: string;
    supplier: string;
    docNo: string;
    itemCode: string;
    description: string;
    lot: string;
    qty: string;
    quantityUnit: string;
    purchaseOrderNo?: string;
    receivingDate: Date;
    expiryDate?: Date;
    requestId: string;
  }) {
    try {
      const r = await this.db.transaction().execute(async (tx) => {
        const previous = await tx
          .selectFrom('receiving_items')
          .selectAll()
          .where('id', '=', i.id)
          .forUpdate()
          .executeTakeFirst();
        if (!previous) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
        if (previous.version !== i.expectedVersion)
          throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        if (previous.workflow_state !== 'PENDING')
          throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        const row = await tx
          .updateTable('receiving_items')
          .set({
            supplier_name: i.supplier,
            doc_no: i.docNo,
            item_code: i.itemCode,
            description: i.description,
            lot: i.lot,
            qty: i.qty,
            quantity_unit: i.quantityUnit,
            purchase_order_no: i.purchaseOrderNo ?? null,
            receiving_date: i.receivingDate.toISOString().slice(0, 10),
            expiry_date: i.expiryDate?.toISOString().slice(0, 10) ?? null,
            updated_by: i.actor.id,
            updated_at: new Date(),
            version: i.expectedVersion + 1n,
          })
          .where('id', '=', i.id)
          .where('version', '=', i.expectedVersion)
          .returningAll()
          .executeTakeFirstOrThrow();
        // The correction carries the reason and the previous business values, so
        // the audit history stays a complete record of what was corrected.
        await this.auditFor(tx)?.append({
          actorType: 'USER',
          actorId: i.actor.id,
          subjectType: 'RECEIVING_ITEM',
          subjectId: i.id,
          action: 'RECEIVING_CORRECTED',
          oldState: previous.workflow_state,
          newState: row.workflow_state,
          reason: i.reason,
          requestId: i.requestId,
          payload: {
            before: {
              supplier: previous.supplier_name,
              docNo: previous.doc_no,
              itemCode: previous.item_code,
              description: previous.description,
              lot: previous.lot,
              qty: String(previous.qty),
              quantityUnit: previous.quantity_unit,
              purchaseOrderNo: previous.purchase_order_no,
              receivingDate: previous.receiving_date,
              expiryDate: previous.expiry_date,
            },
          },
        });
        await this.outboxFor(tx)?.enqueue({
          eventType: 'RECEIVING_CORRECTED',
          aggregateType: 'RECEIVING_ITEM',
          aggregateId: i.id,
          payload: { state: row.workflow_state, correctedBy: i.actor.id },
          dedupeKey: `receiving-corrected:${i.id}:v${i.expectedVersion + 1n}`,
        });
        return row;
      });
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
