import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../database/db-types.js';
import type { ActorContext } from '../authorization/types.js';
import {
  mapAuditRowToView,
  normalizeAuditQueryFilter,
  type AuditQuery,
  type AuditQueryFilter,
  type AuditQueryResult,
} from './audit-query.js';

export class PostgresAuditQuery implements AuditQuery {
  constructor(private readonly database: Kysely<DatabaseSchema>) {}
  async list(_actor: ActorContext, filter: AuditQueryFilter): Promise<AuditQueryResult> {
    const normalized = normalizeAuditQueryFilter(filter);
    // Same predicate for COUNT and page: the only divergence allowed between
    // the two queries is limit/offset/order. Never select payload here.
    let countQuery = this.database
      .selectFrom('audit_events')
      .select((builder) => builder.fn.countAll().as('count'));
    let pageQuery = this.database
      .selectFrom('audit_events')
      .select([
        'audit_events.id',
        'audit_events.event_no',
        'audit_events.occurred_at',
        'audit_events.actor_type',
        'audit_events.actor_id',
        'audit_events.subject_type',
        'audit_events.subject_id',
        'audit_events.action',
        'audit_events.old_state',
        'audit_events.new_state',
        'audit_events.reason',
        'audit_events.request_id',
        'audit_events.signature_id',
      ]);
    const narrow = (
      column: 'subject_type' | 'subject_id' | 'actor_id' | 'action',
      value: string | undefined,
    ): void => {
      if (value === undefined) return;
      countQuery = countQuery.where(column, '=', value);
      pageQuery = pageQuery.where(column, '=', value);
    };
    narrow('subject_type', normalized.subjectType);
    narrow('subject_id', normalized.subjectId);
    narrow('actor_id', normalized.actorId);
    narrow('action', normalized.action);
    if (normalized.from !== undefined) {
      countQuery = countQuery.where('occurred_at', '>=', normalized.from);
      pageQuery = pageQuery.where('occurred_at', '>=', normalized.from);
    }
    if (normalized.to !== undefined) {
      countQuery = countQuery.where('occurred_at', '<', normalized.to);
      pageQuery = pageQuery.where('occurred_at', '<', normalized.to);
    }
    const [countRow, pageRows] = await Promise.all([
      countQuery.executeTakeFirst(),
      pageQuery
        .orderBy('occurred_at', 'desc')
        .orderBy('event_no', 'desc')
        .limit(normalized.limit)
        .offset(normalized.offset)
        .execute(),
    ]);
    const total = Number(countRow?.count ?? 0);
    return {
      events: pageRows.map((row) =>
        mapAuditRowToView({
          ...row,
          actor_id: row.actor_id,
        }),
      ),
      total: Number.isFinite(total) ? total : 0,
      limit: normalized.limit,
      offset: normalized.offset,
    };
  }
}
