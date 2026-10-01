import type { Kysely } from 'kysely';
import { sql, type RawBuilder } from 'kysely';
import type { DatabaseSchema } from '../database/db-types';
import type { SearchPage, SearchQuery, SearchResult } from './search-result';
import type { SearchRepository } from './search-service';

const READ_PERMISSION: Record<SearchResult['entityType'], string> = {
  TASK: 'PERM-TASK-VIEW',
  RECEIVING_ITEM: 'PERM-QUAR-VIEW',
  INSPECTION_REPORT: 'PERM-INSP-VIEW',
  LAB_TEST: 'PERM-LAB-VIEW',
  FINDING: 'PERM-FIND-VIEW',
  NCR: 'PERM-NCR-VIEW',
  CAPA: 'PERM-CAPA-VIEW',
  EQUIPMENT: 'PERM-EQP-VIEW',
  DOCUMENT: 'PERM-DOC-VIEW',
  CHANGE_REQUEST: 'PERM-CHG-VIEW',
  REJECT_REPORT: 'PERM-RREJ-VIEW',
};

function readable(
  query: SearchQuery,
  type: SearchResult['entityType'],
  ownerColumn: string | readonly string[],
  assigneeColumn?: string,
): RawBuilder<boolean> {
  const grant = query.permissions?.find(
    (permission) => permission.code === READ_PERMISSION[type] && permission.active !== false,
  );
  if (!grant) return sql<boolean>`FALSE`;
  const scopes: RawBuilder<boolean>[] = [];
  if (grant.scopes.includes('GLOBAL')) scopes.push(sql<boolean>`TRUE`);
  if (grant.scopes.includes('OWN'))
    for (const owner of Array.isArray(ownerColumn) ? ownerColumn : [ownerColumn])
      scopes.push(sql<boolean>`${sql.ref(owner)} = ${query.actorId}`);
  if (grant.scopes.includes('ASSIGNED') && assigneeColumn)
    scopes.push(sql<boolean>`${sql.ref(assigneeColumn)} = ${query.actorId}`);
  if (!scopes.length) return sql<boolean>`FALSE`;
  return sql<boolean>`(${sql.join(scopes, sql` OR `)})`;
}

export class PostgresSearch implements SearchRepository {
  constructor(private readonly database: Kysely<DatabaseSchema>) {}

  private authorizedResults(query: SearchQuery, pattern: string) {
    return sql<SearchResult>`
      SELECT 'TASK'::text AS "entityType", t.id AS "entityId", t.task_no AS "businessId", COALESCE(t.title, t.task_no) AS descriptor, t.state, NULL::text AS context
      FROM qc.tasks t WHERE (t.task_no ILIKE ${pattern} ESCAPE '\\' OR COALESCE(t.title, '') ILIKE ${pattern} ESCAPE '\\' OR COALESCE(t.description, '') ILIKE ${pattern} ESCAPE '\\')
        AND ${readable(query, 'TASK', 't.created_by', 't.current_assignee_id')}
      UNION ALL
      SELECT 'RECEIVING_ITEM', r.id, r.receiving_no, r.description, r.workflow_state, r.item_code FROM qc.receiving_items r
        WHERE (r.receiving_no ILIKE ${pattern} ESCAPE '\\' OR r.doc_no ILIKE ${pattern} ESCAPE '\\' OR r.item_code ILIKE ${pattern} ESCAPE '\\' OR r.description ILIKE ${pattern} ESCAPE '\\' OR r.lot ILIKE ${pattern} ESCAPE '\\')
          AND ${readable(query, 'RECEIVING_ITEM', 'r.created_by')}
      UNION ALL
      SELECT 'INSPECTION_REPORT', i.id, i.inspection_no, i.inspection_no, i.state, NULL FROM qc.inspection_reports i WHERE i.inspection_no ILIKE ${pattern} ESCAPE '\\' AND ${readable(query, 'INSPECTION_REPORT', 'i.created_by')}
      UNION ALL
      SELECT 'LAB_TEST', l.id, l.lab_test_no, l.lab_test_no, l.state, NULL FROM qc.lab_tests l WHERE l.lab_test_no ILIKE ${pattern} ESCAPE '\\' AND ${readable(query, 'LAB_TEST', 'l.created_by')}
      UNION ALL
      SELECT 'FINDING', f.id, f.finding_no, COALESCE(f.title, f.description), f.state, NULL FROM qc.findings f WHERE (f.finding_no ILIKE ${pattern} ESCAPE '\\' OR COALESCE(f.title, '') ILIKE ${pattern} ESCAPE '\\' OR f.description ILIKE ${pattern} ESCAPE '\\') AND ${readable(query, 'FINDING', ['f.created_by', 'f.owner_id'])}
      UNION ALL
      SELECT 'NCR', n.id, n.ncr_no, n.description, n.state, n.affected_item_code FROM qc.ncrs n WHERE (n.ncr_no ILIKE ${pattern} ESCAPE '\\' OR n.description ILIKE ${pattern} ESCAPE '\\' OR COALESCE(n.affected_item_code, '') ILIKE ${pattern} ESCAPE '\\') AND ${readable(query, 'NCR', ['n.created_by', 'n.owner_id'])}
      UNION ALL
      SELECT 'CAPA', c.id, c.capa_no, c.description, c.state, NULL FROM qc.capas c WHERE (c.capa_no ILIKE ${pattern} ESCAPE '\\' OR c.description ILIKE ${pattern} ESCAPE '\\') AND ${readable(query, 'CAPA', ['c.created_by', 'c.owner_id'])}
      UNION ALL
      SELECT 'EQUIPMENT', e.id, e.equipment_no, e.equipment_no, e.state, e.serial_no FROM qc.equipment e WHERE e.equipment_no ILIKE ${pattern} ESCAPE '\\' AND ${readable(query, 'EQUIPMENT', 'e.created_by')}
      UNION ALL
      SELECT 'DOCUMENT', d.id, d.document_no, COALESCE(d.title, d.document_no), CASE WHEN d.active THEN 'ACTIVE' ELSE 'INACTIVE' END, NULL FROM qc.document_identities d WHERE (d.document_no ILIKE ${pattern} ESCAPE '\\' OR COALESCE(d.title, '') ILIKE ${pattern} ESCAPE '\\') AND ${readable(query, 'DOCUMENT', ['d.created_by', 'd.owner_id'])}
      UNION ALL
      SELECT 'CHANGE_REQUEST', c.id, c.change_no, c.change_no, c.state, NULL FROM qc.change_requests c WHERE c.change_no ILIKE ${pattern} ESCAPE '\\' AND ${readable(query, 'CHANGE_REQUEST', 'c.requested_by')}
      UNION ALL
      SELECT 'REJECT_REPORT', r.id, r.report_no, COALESCE(s.item_name, r.report_no), r.status, s.item_code FROM qc.reject_reports r JOIN qc.reject_issue_slips s ON s.report_id = r.id
        WHERE (r.report_no ILIKE ${pattern} ESCAPE '\\' OR s.item_code ILIKE ${pattern} ESCAPE '\\' OR s.item_name ILIKE ${pattern} ESCAPE '\\' OR COALESCE(s.lot_no, '') ILIKE ${pattern} ESCAPE '\\' OR s.reject_reason ILIKE ${pattern} ESCAPE '\\') AND ${readable(query, 'REJECT_REPORT', 'r.created_by')}
      UNION ALL
      SELECT 'REJECT_REPORT', r.id, r.report_no, r.department, r.status, NULL FROM qc.reject_reports r
        WHERE r.report_type = 'DAILY_REJECT' AND (r.report_no ILIKE ${pattern} ESCAPE '\\' OR r.department ILIKE ${pattern} ESCAPE '\\' OR EXISTS (
          SELECT 1 FROM qc.daily_reject_entries e WHERE e.report_id = r.id AND (COALESCE(e.item_code, '') ILIKE ${pattern} ESCAPE '\\' OR e.item_description ILIKE ${pattern} ESCAPE '\\' OR COALESCE(e.lot_no, '') ILIKE ${pattern} ESCAPE '\\' OR e.reject_reason ILIKE ${pattern} ESCAPE '\\')
        )) AND ${readable(query, 'REJECT_REPORT', 'r.created_by')}
    `;
  }

  async search(query: SearchQuery): Promise<SearchPage> {
    const pattern = `%${query.q.replaceAll('%', '\\%').replaceAll('_', '\\_')}%`;
    const limit = Math.min(25, Math.max(1, query.limit ?? 25));
    const authorized = this.authorizedResults(query, pattern);
    const cursor = query.cursor
      ? (JSON.parse(Buffer.from(query.cursor, 'base64url').toString('utf8')) as {
          businessId: string;
          entityType: string;
          entityId: string;
        })
      : undefined;
    const { total, rows } = await this.database
      .transaction()
      .setAccessMode('read only')
      .setIsolationLevel('repeatable read')
      .execute(async (transaction) => {
        const count = await sql<{
          total: string;
        }>`SELECT COUNT(*)::text AS total FROM (${authorized}) authorized_results`.execute(
          transaction,
        );
        const rows = await sql<SearchResult>`
          SELECT * FROM (${authorized}) authorized_results
          WHERE ${cursor ? sql`("businessId", "entityType", "entityId") > (${cursor.businessId}, ${cursor.entityType}, ${cursor.entityId})` : sql`TRUE`}
          ORDER BY "businessId", "entityType", "entityId"
          LIMIT ${limit + 1}
        `.execute(transaction);
        return { total: Number(count.rows[0]?.total ?? 0), rows: rows.rows };
      });
    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit);
    const last = items.at(-1);
    const nextCursor =
      hasMore && last
        ? Buffer.from(
            JSON.stringify({
              q: query.q,
              businessId: last.businessId,
              entityType: last.entityType,
              entityId: last.entityId,
            }),
          ).toString('base64url')
        : undefined;
    return { items, total, nextCursor };
  }
}
