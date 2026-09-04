import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { DatabaseSchema } from '../database/db-types.js';
import type { ActorContext } from '../authorization/types.js';
import type { AuditEventView, AuditQuery, AuditQueryFilter, AuditQueryResult } from './audit-query.js';

export class PostgresAuditQuery implements AuditQuery {
  constructor(private readonly database: Kysely<DatabaseSchema>) {}
  async list(_actor: ActorContext, filter: AuditQueryFilter): Promise<AuditQueryResult> {
    const limit = Math.min(100, Math.max(1, filter.limit ?? 50));
    const rows = await sql<AuditEventView>`
      SELECT id::text, event_no, occurred_at, actor_type, actor_id::text, subject_type, subject_id::text, action, old_state, new_state, reason, request_id, signature_id::text
      FROM qc.audit_events
      WHERE (${filter.subjectType ?? null} IS NULL OR subject_type = ${filter.subjectType ?? null})
        AND (${filter.subjectId ?? null} IS NULL OR subject_id::text = ${filter.subjectId ?? null})
        AND (${filter.actorId ?? null} IS NULL OR actor_id::text = ${filter.actorId ?? null})
        AND (${filter.action ?? null} IS NULL OR action = ${filter.action ?? null})
        AND (${filter.from ?? null} IS NULL OR occurred_at >= ${filter.from ?? null})
        AND (${filter.to ?? null} IS NULL OR occurred_at < ${filter.to ?? null})
      ORDER BY occurred_at DESC, event_no DESC LIMIT ${limit}
    `.execute(this.database);
    return { events: rows.rows, total: rows.rows.length };
  }
}
