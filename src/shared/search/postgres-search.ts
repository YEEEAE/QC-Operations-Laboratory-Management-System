import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { DatabaseSchema } from '../database/db-types';
import type { SearchQuery, SearchResult } from './search-result';
import type { SearchRepository } from './search-service';

export class PostgresSearch implements SearchRepository {
  constructor(private readonly database: Kysely<DatabaseSchema>) {}
  async search(query: SearchQuery): Promise<SearchResult[]> {
    const pattern = `%${query.q.replaceAll('%', '\\%').replaceAll('_', '\\_')}%`;
    const limit = Math.min(100, Math.max(1, query.limit ?? 25));
    const rows = await sql<SearchResult>`
      SELECT * FROM (
        SELECT 'TASK'::text AS "entityType", t.id AS "entityId", t.task_no AS "businessId", COALESCE(t.description, t.task_no) AS descriptor, t.state, NULL::text AS context
        FROM qc.tasks t WHERE (t.task_no ILIKE ${pattern} ESCAPE '\\' OR COALESCE(t.description, '') ILIKE ${pattern} ESCAPE '\\')
          AND (t.created_by = ${query.actorId} OR t.current_assignee_id = ${query.actorId})
        UNION ALL
        SELECT 'RECEIVING_ITEM', r.id, r.receiving_no, r.description, r.workflow_state, r.item_code FROM qc.receiving_items r
          WHERE (r.receiving_no ILIKE ${pattern} ESCAPE '\\' OR r.doc_no ILIKE ${pattern} ESCAPE '\\' OR r.item_code ILIKE ${pattern} ESCAPE '\\' OR r.description ILIKE ${pattern} ESCAPE '\\') AND r.created_by = ${query.actorId}
        UNION ALL
        SELECT 'INSPECTION_REPORT', i.id, i.inspection_no, i.inspection_no, i.workflow_state, NULL FROM qc.inspection_reports i WHERE i.inspection_no ILIKE ${pattern} ESCAPE '\\' AND i.created_by = ${query.actorId}
        UNION ALL
        SELECT 'LAB_TEST', l.id, l.lab_test_no, l.lab_test_no, l.workflow_state, NULL FROM qc.lab_tests l WHERE l.lab_test_no ILIKE ${pattern} ESCAPE '\\' AND l.created_by = ${query.actorId}
        UNION ALL
        SELECT 'FINDING', f.id, f.finding_no, f.description, f.state, NULL FROM qc.findings f WHERE (f.finding_no ILIKE ${pattern} ESCAPE '\\' OR f.description ILIKE ${pattern} ESCAPE '\\') AND (f.created_by = ${query.actorId} OR f.owner_id = ${query.actorId})
        UNION ALL
        SELECT 'NCR', n.id, n.ncr_no, n.description, n.state, n.affected_item_code FROM qc.ncrs n WHERE (n.ncr_no ILIKE ${pattern} ESCAPE '\\' OR n.description ILIKE ${pattern} ESCAPE '\\' OR COALESCE(n.affected_item_code, '') ILIKE ${pattern} ESCAPE '\\') AND (n.created_by = ${query.actorId} OR n.owner_id = ${query.actorId})
        UNION ALL
        SELECT 'CAPA', c.id, c.capa_no, c.description, c.state, NULL FROM qc.capas c WHERE (c.capa_no ILIKE ${pattern} ESCAPE '\\' OR c.description ILIKE ${pattern} ESCAPE '\\') AND (c.created_by = ${query.actorId} OR c.owner_id = ${query.actorId})
        UNION ALL
        SELECT 'EQUIPMENT', e.id, e.equipment_no, e.equipment_no, e.state, e.serial_no FROM qc.equipment e WHERE e.equipment_no ILIKE ${pattern} ESCAPE '\\' AND e.created_by = ${query.actorId}
        UNION ALL
        SELECT 'DOCUMENT', d.id, d.document_no, COALESCE(d.title, d.document_no), d.state, NULL FROM qc.document_identities d WHERE (d.document_no ILIKE ${pattern} ESCAPE '\\' OR COALESCE(d.title, '') ILIKE ${pattern} ESCAPE '\\') AND (d.created_by = ${query.actorId} OR d.owner_id = ${query.actorId})
        UNION ALL
        SELECT 'CHANGE_REQUEST', c.id, c.change_no, c.change_no, c.state, NULL FROM qc.change_requests c WHERE c.change_no ILIKE ${pattern} ESCAPE '\\' AND c.requested_by = ${query.actorId}
      ) authorized_results ORDER BY "businessId" LIMIT ${limit}
    `.execute(this.database);
    return rows.rows;
  }
}
