import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { ReportDefinition, ReportFilters } from '../domain/report-definition.js';
import type { ReportDataset, ReportQuery } from '../ports/report-query.js';

export class PostgresReportQuery implements ReportQuery {
  constructor(private readonly database: Kysely<DatabaseSchema>) {}
  async run(definition: ReportDefinition, actor: ActorContext, filters: ReportFilters): Promise<ReportDataset> {
    if (definition.code !== 'quarantine-aging') throw new Error('Unsupported report definition');
    const rows = await sql<{ receiving_no: string; doc_no: string; item_code: string; description: string; lot: string; qty: string; receiving_date: string; expiry_date: string | null; workflow_state: string; inspection_result: string; release_system: boolean }>`
      SELECT receiving_no, doc_no, item_code, description, lot, qty::text, receiving_date::text, expiry_date::text, workflow_state, inspection_result, release_system
       FROM qc.receiving_items
       WHERE created_by = ${actor.id}
         AND (${filters.from ?? null}::date IS NULL OR receiving_date >= ${filters.from ?? null}::date)
         AND (${filters.to ?? null}::date IS NULL OR receiving_date <= ${filters.to ?? null}::date)
       ORDER BY receiving_date DESC, id DESC`.execute(this.database);
    return { definition, columns: definition.columns, rows: rows.rows.map((row) => ({ receivingNo: row.receiving_no, docNo: row.doc_no, itemCode: row.item_code, description: row.description, lot: row.lot, qty: row.qty, receivingDate: row.receiving_date, expiryDate: row.expiry_date, workflowState: row.workflow_state, inspectionResult: row.inspection_result, releaseSystem: row.release_system })) };
  }
}
