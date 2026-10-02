import type { Kysely } from 'kysely';
import type { DatabaseRow, DatabaseSchema } from '../../../../shared/database/db-types.js';
import type { FindingRepository } from '../ports/repository.js';
import type { Finding, FindingAction } from '../domain/finding.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import { AppError } from '../../../../shared/errors/app-error.js';
export class PostgresFindingRepository implements FindingRepository {
  constructor(private db: Kysely<DatabaseSchema>) {}
  private map(r: DatabaseRow<'findings'>): Finding {
    return {
      id: r.id,
      findingNo: r.finding_no,
      title: r.title,
      description: r.description,
      state: r.state as Finding['state'],
      severity: r.severity ?? undefined,
      sourceContext: (r.source_context ?? undefined) as Finding['sourceContext'],
      ownerId: r.owner_id ?? undefined,
      openedAt: r.opened_at ?? undefined,
      closedAt: r.closed_at ?? undefined,
      createdBy: r.created_by,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      version: BigInt(r.version),
    };
  }
  async create(i: Parameters<FindingRepository['create']>[0]) {
    const r = await this.db
      .insertInto('findings')
      .values({
        id: i.finding.id,
        finding_no: i.finding.findingNo,
        title: i.finding.title,
        description: i.finding.description,
        state: 'DRAFT',
        severity: i.finding.severity ?? null,
        source_context: i.finding.sourceContext ?? null,
        owner_id: i.finding.ownerId ?? null,
        opened_at: null,
        closed_at: null,
        created_by: i.actor.id,
        updated_at: i.finding.updatedAt,
        version: 1n,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return this.map(r);
  }
  async get(id: string, actor: ActorContext) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;
    const r = await this.db
      .selectFrom('findings')
      .selectAll()
      .where('id', '=', id)
      .where((eb) => eb.or([eb('owner_id', '=', actor.id), eb('created_by', '=', actor.id)]))
      .executeTakeFirst();
    return r ? this.map(r) : undefined;
  }
  async list(i: Parameters<FindingRepository['list']>[0]) {
    const q = this.listQuery(i.actor, i.state);
    return (await q.orderBy('updated_at', 'desc').orderBy('id', 'desc').execute()).map((r) =>
      this.map(r),
    );
  }
  async listPage(i: Parameters<FindingRepository['listPage']>[0]) {
    const countRow = await this.listQuery(i.actor, i.state)
      .clearSelect()
      .select(({ fn }) => fn.countAll().as('count'))
      .executeTakeFirst();
    const total = Number(countRow?.count ?? 0);
    const page = Math.min(i.page.page, Math.max(1, Math.ceil(total / i.page.pageSize)));
    const rows = await this.listQuery(i.actor, i.state)
      .orderBy('updated_at', 'desc')
      .orderBy('id', 'desc')
      .limit(i.page.pageSize)
      .offset((page - 1) * i.page.pageSize)
      .execute();
    return {
      items: rows.map((row) => this.map(row)),
      total,
      page,
      pageSize: i.page.pageSize,
    };
  }
  private listQuery(actor: ActorContext, state?: Finding['state']) {
    let q = this.db
      .selectFrom('findings')
      .selectAll()
      .where((eb) => eb.or([eb('owner_id', '=', actor.id), eb('created_by', '=', actor.id)]));
    if (state) q = q.where('state', '=', state);
    return q;
  }
  async transition(i: Parameters<FindingRepository['transition']>[0]) {
    const next: Record<FindingAction, string> = {
      OPEN: 'OPEN',
      SUBMIT_REVIEW: 'UNDER_REVIEW',
      RETURN: 'OPEN',
      CLOSE: 'CLOSED',
      VOID: 'VOID',
    };
    const r = await this.db
      .updateTable('findings')
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
