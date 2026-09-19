import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { ReportDefinition, ReportFilters } from '../domain/report-definition.js';
import type { ReportDataset, ReportQuery } from '../ports/report-query.js';

/**
 * Substring filters stay substring filters (approved report contract), but a
 * user-supplied `%`/`_`/`\` is literal business data, never a pattern
 * metacharacter — the same rule the global search applies (BR-SRCH-001/003).
 */
function literalLikeContains(value: string): string {
  return `%${value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')}%`;
}

export class PostgresReportQuery implements ReportQuery {
  constructor(private readonly database: Kysely<DatabaseSchema>) {}
  async run(
    definition: ReportDefinition,
    actor: ActorContext,
    filters: ReportFilters,
  ): Promise<ReportDataset> {
    if (definition.code !== 'quarantine-aging') throw new Error('Unsupported report definition');
    const rows = await sql<{
      receiving_no: string;
      doc_no: string;
      item_code: string;
      description: string;
      lot: string;
      qty: string;
      receiving_date: string;
      expiry_date: string | null;
      workflow_state: string;
      inspection_result: string;
      release_system: boolean;
    }>`
      SELECT receiving_no, doc_no, item_code, description, lot, qty::text, receiving_date::text, expiry_date::text, workflow_state, inspection_result, release_system
       FROM qc.receiving_items
       WHERE created_by = ${actor.id}
         AND (${filters.from ?? null}::date IS NULL OR receiving_date >= ${filters.from ?? null}::date)
         AND (${filters.to ?? null}::date IS NULL OR receiving_date <= ${filters.to ?? null}::date)
         AND (${filters.lot ?? null}::text IS NULL OR lot ILIKE ${filters.lot ? literalLikeContains(filters.lot) : null} ESCAPE '\\')
         AND (${filters.itemCode ?? null}::text IS NULL OR item_code ILIKE ${filters.itemCode ? literalLikeContains(filters.itemCode) : null} ESCAPE '\\')
         AND (${filters.workflowState ?? null}::text IS NULL OR workflow_state = ${filters.workflowState ?? null})
         AND (${filters.inspectionResult ?? null}::text IS NULL OR inspection_result = ${filters.inspectionResult ?? null})
         AND (${filters.releaseSystem ?? null}::boolean IS NULL OR release_system = ${filters.releaseSystem ?? null})
       ORDER BY receiving_date DESC, id DESC`.execute(this.database);
    return {
      definition,
      columns: definition.columns,
      rows: rows.rows.map((row) => ({
        receivingNo: row.receiving_no,
        docNo: row.doc_no,
        itemCode: row.item_code,
        description: row.description,
        lot: row.lot,
        qty: row.qty,
        receivingDate: row.receiving_date,
        expiryDate: row.expiry_date,
        workflowState: row.workflow_state,
        inspectionResult: row.inspection_result,
        releaseSystem: row.release_system,
      })),
    };
  }
}
