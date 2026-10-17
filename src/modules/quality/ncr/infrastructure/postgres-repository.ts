import { sql, type Kysely } from 'kysely';
import type { DatabaseRow, DatabaseSchema } from '../../../../shared/database/db-types.js';
import type { NcrRepository } from '../ports/repository.js';
import type { Ncr, NcrAction } from '../domain/ncr.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { authorize } from '../../../../shared/authorization/authorize.js';
import { fingerprint } from '../../../../shared/idempotency/idempotency-service.js';
import { PostgresIdempotencyRepository } from '../../../../shared/idempotency/postgres-idempotency-repository.js';
import { PostgresAuditRepository } from '../../../../shared/audit/postgres-audit-repository.js';
import { isUuid } from '../../../../shared/id/uuid.js';
import { createNcrInput } from '../domain/create-input.js';

function duplicateNumber(error: unknown): boolean {
  for (let current: unknown = error, depth = 0; current && depth < 3; depth++) {
    const candidate = current as {
      code?: unknown;
      constraint?: unknown;
      cause?: unknown;
    };
    if (candidate.code === '23505' && candidate.constraint === 'uq_ncrs__ncr_no') return true;
    current = candidate.cause;
  }
  return false;
}

export class PostgresNcrRepository implements NcrRepository {
  constructor(
    private db: Kysely<DatabaseSchema>,
    private readonly lockForShare = false,
  ) {}
  private map(r: DatabaseRow<'ncrs'>): Ncr {
    return {
      id: r.id,
      ncrNo: r.ncr_no,
      title: r.title,
      description: r.description,
      state: r.state as Ncr['state'],
      findingId: r.finding_id ?? undefined,
      affectedItemCode: r.affected_item_code ?? undefined,
      affectedLot: r.affected_lot ?? undefined,
      ownerId: r.owner_id ?? undefined,
      openedAt: r.opened_at ?? undefined,
      closedAt: r.closed_at ?? undefined,
      createdBy: r.created_by,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      version: BigInt(r.version),
    };
  }
  async create(i: Parameters<NcrRepository['create']>[0]): Promise<Ncr> {
    if (i.ncr.ownerId !== undefined) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    const parsed = createNcrInput.safeParse({
      intentId: i.intentId,
      findingId: i.ncr.findingId,
      ncrNo: i.ncr.ncrNo,
      title: i.ncr.title,
      description: i.ncr.description,
      affectedItemCode: i.ncr.affectedItemCode,
      affectedLot: i.ncr.affectedLot,
    });
    if (!parsed.success) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    const command = {
      findingId: parsed.data.findingId,
      ncrNo: parsed.data.ncrNo,
      title: parsed.data.title,
      description: parsed.data.description,
      affectedItemCode: parsed.data.affectedItemCode ?? null,
      affectedLot: parsed.data.affectedLot ?? null,
    };
    // The intent key is scoped to the account. requestId is a trace identifier
    // and deliberately not part of command identity.
    const key = `ncr-create:${i.actor.id}:${parsed.data.intentId}`;
    const digest = fingerprint(command);
    try {
      return await this.db.transaction().execute(async (tx) => {
        // Serialize the same intent before reading a receipt, so concurrent
        // submissions of one form cannot both observe "no receipt".
        await sql`select pg_advisory_xact_lock(hashtextextended(${key}, 0))`.execute(tx);
        const receipts = new PostgresIdempotencyRepository(tx);
        const prior = await receipts.find(key);
        if (prior) {
          if (prior.fingerprint !== digest || prior.status !== 'COMPLETED')
            throw new AppError('CONFLICT_DUPLICATE_COMMAND', { userSafe: true });
          const response = prior.response as { id?: unknown } | null;
          if (!response || !isUuid(response.id))
            throw new AppError('SYSTEM_INTERNAL', { userSafe: false });
          const row = await tx
            .selectFrom('ncrs')
            .selectAll()
            .where('id', '=', response.id)
            .where('created_by', '=', i.actor.id)
            .executeTakeFirst();
          if (!row) throw new AppError('SYSTEM_INTERNAL', { userSafe: false });
          return this.map(row);
        }

        // A new intent re-reads the selected Finding under a row lock. Existence,
        // the same owner/creator scope used by authorized Finding reads, and
        // permission are all checked again before anything is written. Every
        // Finding state is eligible by the scoped owner decision; multiple NCRs
        // per Finding are allowed.
        const source = await tx
          .selectFrom('findings')
          .selectAll()
          .where('id', '=', parsed.data.findingId)
          .forUpdate()
          .executeTakeFirst();
        if (!source || (source.owner_id !== i.actor.id && source.created_by !== i.actor.id))
          throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
        authorize(
          {
            actor: i.actor,
            permission: 'PERM-NCR-CREATE',
            action: 'CREATE',
            entity: { type: 'NCR', id: 'new', state: 'DRAFT', ownerId: i.actor.id },
            scope: { ownerId: i.actor.id },
            currentVersion: 1n,
            expectedVersion: 1n,
            businessCondition: true,
          },
          { throwOnDeny: true },
        );

        const reserved = await receipts.reserve({
          key,
          fingerprint: digest,
          status: 'IN_PROGRESS',
          response: null,
        });
        if (!reserved) throw new AppError('CONFLICT_DUPLICATE_COMMAND', { userSafe: true });

        const row = await tx
          .insertInto('ncrs')
          .values({
            ncr_no: parsed.data.ncrNo,
            title: parsed.data.title,
            description: parsed.data.description,
            finding_id: source.id,
            state: 'DRAFT',
            owner_id: null,
            affected_item_code: parsed.data.affectedItemCode ?? null,
            affected_lot: parsed.data.affectedLot ?? null,
            opened_at: null,
            closed_at: null,
            created_by: i.actor.id,
            created_at: i.ncr.createdAt,
            updated_at: i.ncr.updatedAt,
            version: 1n,
          })
          .returningAll()
          .executeTakeFirstOrThrow();

        // NCR row, Finding relation and CREATE audit are one transaction. Any
        // audit failure rolls back the row, the receipt and this transaction.
        await new PostgresAuditRepository(tx).append({
          actorType: 'USER',
          actorId: i.actor.id,
          subjectType: 'NCR',
          subjectId: row.id,
          action: 'CREATE',
          newState: 'DRAFT',
          requestId: i.requestId,
          payload: {
            findingId: source.id,
            sourceState: source.state,
            sourceVersion: String(source.version),
            intentId: parsed.data.intentId,
          },
        });
        await receipts.complete(key, { id: row.id });
        return this.map(row);
      });
    } catch (error) {
      if (duplicateNumber(error))
        throw new AppError('VALIDATION_FAILED', {
          userSafe: true,
          fieldErrors: { ncrNo: ['This NCR number is already in use.'] },
          cause: error,
        });
      throw error;
    }
  }
  async get(id: string, a: ActorContext) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return;
    let query = this.db
      .selectFrom('ncrs')
      .selectAll()
      .where('id', '=', id)
      .where((eb) => eb.or([eb('owner_id', '=', a.id), eb('created_by', '=', a.id)]));
    if (this.lockForShare) query = query.forShare();
    const r = await query.executeTakeFirst();
    return r && this.map(r);
  }
  async listPage(i: Parameters<NonNullable<NcrRepository['listPage']>>[0]) {
    let query = this.db
      .selectFrom('ncrs')
      .selectAll()
      .where((eb) => eb.or([eb('owner_id', '=', i.actor.id), eb('created_by', '=', i.actor.id)]));
    if (i.state) query = query.where('state', '=', i.state);
    const counted = await query
      .clearSelect()
      .select(({ fn }) => fn.countAll().as('count'))
      .executeTakeFirst();
    const total = Number(counted?.count ?? 0);
    const page = Math.min(i.page.page, Math.max(1, Math.ceil(total / i.page.pageSize)));
    const rows = await query
      .orderBy('updated_at', 'desc')
      .orderBy('id', 'desc')
      .limit(i.page.pageSize)
      .offset((page - 1) * i.page.pageSize)
      .execute();
    const items = rows.map((row) => this.map(row));
    return { items, total, page, pageSize: i.page.pageSize };
  }
  async list(i: Parameters<NcrRepository['list']>[0]) {
    let q = this.db
      .selectFrom('ncrs')
      .selectAll()
      .where((eb) => eb.or([eb('owner_id', '=', i.actor.id), eb('created_by', '=', i.actor.id)]));
    if (i.state) q = q.where('state', '=', i.state);
    return (await q.execute()).map((r) => this.map(r));
  }
  async transition(i: Parameters<NcrRepository['transition']>[0]) {
    if ('conditions' in i) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    // This repository has no persisted prerequisite-verification contract.
    // Do not let a direct caller bypass the application evidence boundary.
    if (['MOVE_TO_CAPA', 'READY_FOR_CLOSURE', 'CLOSE'].includes(i.action))
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    const next: Record<NcrAction, string> = {
      OPEN: 'OPEN',
      START_INVESTIGATION: 'UNDER_INVESTIGATION',
      START_RCA: 'RCA_IN_PROGRESS',
      MOVE_TO_CAPA: 'CAPA_IN_PROGRESS',
      READY_FOR_CLOSURE: 'READY_FOR_CLOSURE',
      CLOSE: 'CLOSED',
      VOID: 'VOID',
    };
    const r = await this.db
      .updateTable('ncrs')
      .set({
        state: next[i.action],
        updated_at: new Date(),
        closed_at: i.action === 'CLOSE' ? new Date() : null,
        version: i.expectedVersion + 1n,
      })
      .where('id', '=', i.id)
      .where('version', '=', i.expectedVersion)
      .returningAll()
      .executeTakeFirst();
    if (!r) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
    return this.map(r);
  }
}
