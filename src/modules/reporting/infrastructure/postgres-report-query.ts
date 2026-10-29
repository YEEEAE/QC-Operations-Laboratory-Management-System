import type { Kysely, RawBuilder } from 'kysely';
import { sql } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { ReportDefinition, ReportFilters } from '../domain/report-definition.js';
import type { ReportDataset, ReportQuery, ReportRow } from '../ports/report-query.js';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;
const MAX_PAGE = 1_000;

/** Substring filters treat %, _ and backslash as literal business data. */
function literalLikeContains(value: string): string {
  return `%${value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')}%`;
}

interface QueryRow extends Record<string, string | number | boolean | null> {
  sourceRecordId: string;
  relatedRecordId: string | null;
}

function safePage(filters: ReportFilters): { page: number; pageSize: number; offset: number } {
  const page = Math.min(Math.max(filters.page ?? 1, 1), MAX_PAGE);
  const pageSize = Math.min(Math.max(filters.pageSize ?? DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
  return { page, pageSize, offset: (page - 1) * pageSize };
}

export class PostgresReportQuery implements ReportQuery {
  constructor(private readonly database: Kysely<DatabaseSchema>) {}

  async run(
    definition: ReportDefinition,
    actor: ActorContext,
    filters: ReportFilters,
  ): Promise<ReportDataset> {
    const { page, pageSize, offset } = safePage(filters);
    const limit = pageSize + 1;
    const pattern = (value: string | undefined) => value ? literalLikeContains(value) : null;
    const from = filters.from ?? null;
    const to = filters.to ?? null;
    const lot = pattern(filters.lot);
    const itemCode = pattern(filters.itemCode);
    const line = pattern(filters.line);
    const shift = pattern(filters.shift);
    const status = filters.status ?? null;
    let query: RawBuilder<QueryRow>;

    switch (definition.code) {
      case 'receiving-inspection':
        query = sql<QueryRow>`
          SELECT r.id::text AS "sourceRecordId", i.id::text AS "relatedRecordId",
            r.receiving_no AS "receivingNo", i.inspection_no AS "inspectionNo", r.doc_no AS "docNo",
            r.item_code AS "itemCode", r.description, r.lot, r.receiving_date::text AS "receivingDate",
            r.workflow_state AS "workflowState", i.state AS "inspectionState",
            i.final_result AS "inspectionResult", tv.version_no AS "methodRevision"
          FROM qc.receiving_items r
          LEFT JOIN qc.inspection_reports i ON i.receiving_item_id = r.id
          LEFT JOIN qc.inspection_template_versions tv ON tv.id = i.template_version_id
          WHERE r.created_by = ${actor.id}
            AND (${from}::date IS NULL OR r.receiving_date >= ${from}::date)
            AND (${to}::date IS NULL OR r.receiving_date <= ${to}::date)
            AND (${lot}::text IS NULL OR r.lot ILIKE ${lot} ESCAPE '\\')
            AND (${itemCode}::text IS NULL OR r.item_code ILIKE ${itemCode} ESCAPE '\\')
            AND (${filters.workflowState ?? null}::text IS NULL OR r.workflow_state = ${filters.workflowState ?? null})
            AND (${filters.inspectionResult ?? null}::text IS NULL OR i.final_result = ${filters.inspectionResult ?? null})
            AND (${status}::text IS NULL OR i.state = ${status})
          ORDER BY r.receiving_date DESC, i.id ASC NULLS LAST, r.id ASC
          LIMIT ${limit} OFFSET ${offset}`;
        break;

      case 'in-process':
        query = sql<QueryRow>`
          SELECT r.id::text AS "sourceRecordId", h.id::text AS "relatedRecordId",
            r.run_no AS "runNo", r.item_code AS "itemCode", r.lot_no AS lot,
            r.production_line AS "productionLine", r.shift_code AS shift, r.state,
            r.wi_document_no AS "wiDocumentNo", r.wi_revision AS "wiRevision",
            r.started_at::text AS "startedAt", h.status AS "handoverState",
            r.product_release_state AS "productReleaseState"
          FROM qc.in_process_runs r
          LEFT JOIN LATERAL (
            SELECT ih.id, ih.status FROM qc.in_process_handovers ih
            WHERE ih.run_id = r.id ORDER BY ih.handed_over_at DESC, ih.id ASC LIMIT 1
          ) h ON TRUE
          WHERE r.operator_id = ${actor.id}
            AND (${from}::date IS NULL OR r.started_at >= (${from}::date::timestamp AT TIME ZONE 'UTC'))
            AND (${to}::date IS NULL OR r.started_at < ((${to}::date + INTERVAL '1 day') AT TIME ZONE 'UTC'))
            AND (${lot}::text IS NULL OR r.lot_no ILIKE ${lot} ESCAPE '\\')
            AND (${itemCode}::text IS NULL OR r.item_code ILIKE ${itemCode} ESCAPE '\\')
            AND (${line}::text IS NULL OR r.production_line ILIKE ${line} ESCAPE '\\')
            AND (${shift}::text IS NULL OR r.shift_code ILIKE ${shift} ESCAPE '\\')
            AND (${status}::text IS NULL OR r.state = ${status})
          ORDER BY r.started_at DESC, r.id ASC LIMIT ${limit} OFFSET ${offset}`;
        break;

      case 'laboratory':
        query = sql<QueryRow>`
          SELECT t.id::text AS "sourceRecordId", t.source_receiving_item_id::text AS "relatedRecordId",
            t.lab_test_no AS "labTestNo", t.state, t.scientific_result AS "scientificResult",
            COALESCE(r.item_code, '') AS "itemCode", COALESCE(r.lot, '') AS lot,
            tv.version_no AS "methodRevision", t.created_at::text AS "createdAt"
          FROM qc.lab_tests t
          JOIN qc.lab_test_template_versions tv ON tv.id = t.template_version_id
          LEFT JOIN qc.receiving_items r ON r.id = t.source_receiving_item_id
          WHERE (t.created_by = ${actor.id} OR t.author_id = ${actor.id})
            AND (${from}::date IS NULL OR t.created_at >= (${from}::date::timestamp AT TIME ZONE 'UTC'))
            AND (${to}::date IS NULL OR t.created_at < ((${to}::date + INTERVAL '1 day') AT TIME ZONE 'UTC'))
            AND (${lot}::text IS NULL OR r.lot ILIKE ${lot} ESCAPE '\\')
            AND (${itemCode}::text IS NULL OR r.item_code ILIKE ${itemCode} ESCAPE '\\')
            AND (${status}::text IS NULL OR t.state = ${status})
          ORDER BY t.created_at DESC, t.id ASC LIMIT ${limit} OFFSET ${offset}`;
        break;

      case 'daily-reject-issue-slip':
        query = sql<QueryRow>`
          SELECT rr.id::text AS "sourceRecordId", de.id::text AS "relatedRecordId",
            rr.report_no AS "reportNo", rr.report_type AS "reportType", rr.report_date::text AS "reportDate",
            rr.shift, rr.status, COALESCE(de.item_code, iss.item_code, '') AS "itemCode",
            COALESCE(de.lot_no, iss.lot_no, '') AS lot,
            COALESCE(de.reject_qty::text, iss.rejected_qty::text, '') AS "rejectQty",
            COALESCE(to_jsonb(de)->>'quantity_unit', de.rm_unit, iss.unit, '') AS "quantityUnit",
            CASE WHEN COALESCE(to_jsonb(de)->>'paper_formula_id', de.production_formula) IS NULL THEN NULL
              ELSE COALESCE(to_jsonb(de)->>'paper_formula_id', de.production_formula)
                || CASE WHEN to_jsonb(de)->>'paper_formula_version' IS NULL THEN ''
                  ELSE ' v' || (to_jsonb(de)->>'paper_formula_version') END END AS "paperFormula",
            (SELECT string_agg(a.approval_role || ': ' || a.status, '; ' ORDER BY a.approval_role)
              FROM qc.issue_slip_approval_confirmations a WHERE a.report_id = rr.id) AS "issueSlipApprovalStates"
          FROM qc.reject_reports rr
          LEFT JOIN qc.daily_reject_entries de ON de.report_id = rr.id AND rr.report_type = 'DAILY_REJECT'
          LEFT JOIN qc.reject_issue_slips iss ON iss.report_id = rr.id AND rr.report_type = 'ISSUE_SLIP'
          WHERE rr.created_by = ${actor.id}
            AND (${from}::date IS NULL OR rr.report_date >= ${from}::date)
            AND (${to}::date IS NULL OR rr.report_date <= ${to}::date)
            AND (${lot}::text IS NULL OR COALESCE(de.lot_no, iss.lot_no, '') ILIKE ${lot} ESCAPE '\\')
            AND (${itemCode}::text IS NULL OR COALESCE(de.item_code, iss.item_code, '') ILIKE ${itemCode} ESCAPE '\\')
            AND (${shift}::text IS NULL OR COALESCE(rr.shift, '') ILIKE ${shift} ESCAPE '\\')
            AND (${status}::text IS NULL OR rr.status = ${status})
          ORDER BY rr.report_date DESC, rr.id ASC, de.position ASC NULLS LAST
          LIMIT ${limit} OFFSET ${offset}`;
        break;

      case 'threshold-approvals':
        query = sql<QueryRow>`
          SELECT d.id::text AS "sourceRecordId", d.profile_id::text AS "relatedRecordId",
            rr.report_no AS "reportNo", de.item_code AS "itemCode", de.lot_no AS lot,
            d.decision_state AS "decisionState", d.approval_state AS "approvalState",
            CASE WHEN p.formula_id IS NULL THEN NULL ELSE p.formula_id || ' v' || p.formula_version::text END AS "formulaRevision",
            d.source_file_digest AS "sourceDigest", d.created_at::text AS "createdAt"
          FROM qc.daily_reject_threshold_decisions d
          JOIN qc.reject_reports rr ON rr.id = d.report_id
          JOIN qc.daily_reject_entries de ON de.id = d.entry_id
          LEFT JOIN qc.reject_limit_profiles p ON p.id = d.profile_id
          WHERE rr.created_by = ${actor.id}
            AND (${from}::date IS NULL OR d.created_at >= (${from}::date::timestamp AT TIME ZONE 'UTC'))
            AND (${to}::date IS NULL OR d.created_at < ((${to}::date + INTERVAL '1 day') AT TIME ZONE 'UTC'))
            AND (${lot}::text IS NULL OR COALESCE(de.lot_no, '') ILIKE ${lot} ESCAPE '\\')
            AND (${itemCode}::text IS NULL OR COALESCE(de.item_code, '') ILIKE ${itemCode} ESCAPE '\\')
            AND (${shift}::text IS NULL OR COALESCE(rr.shift, '') ILIKE ${shift} ESCAPE '\\')
            AND (${status}::text IS NULL OR d.approval_state = ${status})
          ORDER BY d.created_at DESC, d.id ASC LIMIT ${limit} OFFSET ${offset}`;
        break;

      case 'focus-queue':
        query = sql<QueryRow>`
          SELECT f.id::text AS "sourceRecordId", rr.id::text AS "relatedRecordId",
            rr.report_no AS "reportNo", rr.report_date::text AS "reportDate",
            COALESCE(de.item_code, iss.item_code, '') AS "itemCode",
            COALESCE(de.lot_no, iss.lot_no, '') AS lot, f.status,
            f.entered_at::text AS "enteredAt", f.verified_at::text AS "verifiedAt"
          FROM qc.focus_compliance_entries f
          JOIN qc.reject_reports rr ON rr.id = f.report_id
          LEFT JOIN LATERAL (
            SELECT entry.item_code, entry.lot_no FROM qc.daily_reject_entries entry
            WHERE entry.report_id = rr.id AND rr.report_type = 'DAILY_REJECT' ORDER BY entry.position ASC LIMIT 1
          ) de ON TRUE
          LEFT JOIN qc.reject_issue_slips iss ON iss.report_id = rr.id AND rr.report_type = 'ISSUE_SLIP'
          WHERE rr.created_by = ${actor.id}
            AND (${from}::date IS NULL OR rr.report_date >= ${from}::date)
            AND (${to}::date IS NULL OR rr.report_date <= ${to}::date)
            AND (${lot}::text IS NULL OR EXISTS (
              SELECT 1 FROM qc.daily_reject_entries entry WHERE entry.report_id = rr.id AND rr.report_type = 'DAILY_REJECT' AND COALESCE(entry.lot_no, '') ILIKE ${lot} ESCAPE '\\'
            ) OR COALESCE(iss.lot_no, '') ILIKE ${lot} ESCAPE '\\')
            AND (${itemCode}::text IS NULL OR EXISTS (
              SELECT 1 FROM qc.daily_reject_entries entry WHERE entry.report_id = rr.id AND rr.report_type = 'DAILY_REJECT' AND COALESCE(entry.item_code, '') ILIKE ${itemCode} ESCAPE '\\'
            ) OR COALESCE(iss.item_code, '') ILIKE ${itemCode} ESCAPE '\\')
            AND (${shift}::text IS NULL OR COALESCE(rr.shift, '') ILIKE ${shift} ESCAPE '\\')
            AND (${status}::text IS NULL OR f.status = ${status})
          ORDER BY rr.report_date DESC, f.id ASC LIMIT ${limit} OFFSET ${offset}`;
        break;

      case 'ncr':
        query = sql<QueryRow>`
          SELECT n.id::text AS "sourceRecordId", n.finding_id::text AS "relatedRecordId",
            n.ncr_no AS "ncrNo", n.title, n.state, n.affected_item_code AS "itemCode",
            n.affected_lot AS lot, f.finding_no AS "findingNo", n.created_at::text AS "createdAt"
          FROM qc.ncrs n LEFT JOIN qc.findings f ON f.id = n.finding_id
          WHERE n.created_by = ${actor.id}
            AND (${from}::date IS NULL OR n.created_at >= (${from}::date::timestamp AT TIME ZONE 'UTC'))
            AND (${to}::date IS NULL OR n.created_at < ((${to}::date + INTERVAL '1 day') AT TIME ZONE 'UTC'))
            AND (${lot}::text IS NULL OR COALESCE(n.affected_lot, '') ILIKE ${lot} ESCAPE '\\')
            AND (${itemCode}::text IS NULL OR COALESCE(n.affected_item_code, '') ILIKE ${itemCode} ESCAPE '\\')
            AND (${status}::text IS NULL OR n.state = ${status})
          ORDER BY n.created_at DESC, n.id ASC LIMIT ${limit} OFFSET ${offset}`;
        break;

      case 'capa-effectiveness':
        query = sql<QueryRow>`
          SELECT c.id::text AS "sourceRecordId", a.id::text AS "relatedRecordId",
            c.capa_no AS "capaNo", c.state, c.effectiveness_required AS "effectivenessRequired",
            a.sequence_no::text AS "actionSequence", a.state AS "actionState",
            a.verification_state AS "verificationState", c.target_date::text AS "targetDate",
            c.created_at::text AS "createdAt"
          FROM qc.capas c LEFT JOIN qc.capa_actions a ON a.capa_id = c.id
          WHERE c.created_by = ${actor.id}
            AND (${from}::date IS NULL OR c.created_at >= (${from}::date::timestamp AT TIME ZONE 'UTC'))
            AND (${to}::date IS NULL OR c.created_at < ((${to}::date + INTERVAL '1 day') AT TIME ZONE 'UTC'))
            AND (${status}::text IS NULL OR c.state = ${status})
          ORDER BY c.created_at DESC, c.id ASC, a.sequence_no ASC NULLS LAST
          LIMIT ${limit} OFFSET ${offset}`;
        break;

      case 'calibration':
        query = sql<QueryRow>`
          SELECT c.id::text AS "sourceRecordId", e.id::text AS "relatedRecordId",
            c.calibration_no AS "calibrationNo", e.equipment_no AS "equipmentNo", e.name AS "equipmentName",
            c.state, c.calibration_date::text AS "calibrationDate", c.due_date::text AS "dueDate",
            c.result, c.created_at::text AS "createdAt"
          FROM qc.calibration_records c JOIN qc.equipment e ON e.id = c.equipment_id
          WHERE c.created_by = ${actor.id}
            AND (${from}::date IS NULL OR c.calibration_date >= ${from}::date)
            AND (${to}::date IS NULL OR c.calibration_date <= ${to}::date)
            AND (${itemCode}::text IS NULL OR e.equipment_no ILIKE ${itemCode} ESCAPE '\\')
            AND (${status}::text IS NULL OR c.state = ${status})
          ORDER BY c.calibration_date DESC, c.id ASC LIMIT ${limit} OFFSET ${offset}`;
        break;

      case 'tasks-shift-handover':
        query = sql<QueryRow>`
          SELECT q."sourceRecordId", q."relatedRecordId", q."recordType", q."recordNo", q.title,
            q.state, q.line, q.shift, q."dueAt", q."occurredAt"
          FROM (
            SELECT t.id::text AS "sourceRecordId", NULL::text AS "relatedRecordId",
              'TASK'::text AS "recordType", t.task_no AS "recordNo", t.title, t.state,
              ''::text AS line, ''::text AS shift, t.due_at::text AS "dueAt", t.created_at::text AS "occurredAt",
              t.due_at AS order_date, t.id AS order_id
            FROM qc.tasks t
            WHERE (t.created_by = ${actor.id} OR t.current_assignee_id = ${actor.id})
              AND (${from}::date IS NULL OR t.created_at >= (${from}::date::timestamp AT TIME ZONE 'UTC'))
              AND (${to}::date IS NULL OR t.created_at < ((${to}::date + INTERVAL '1 day') AT TIME ZONE 'UTC'))
              AND (${status}::text IS NULL OR t.state = ${status})
              AND (${line}::text IS NULL AND ${shift}::text IS NULL)
            UNION ALL
            SELECT h.id::text, r.id::text, 'SHIFT_HANDOVER'::text, r.run_no,
              h.handover_note, h.status, r.production_line, h.from_shift_code || ' → ' || h.to_shift_code,
              NULL::text, h.handed_over_at::text, h.handed_over_at, h.id
            FROM qc.in_process_handovers h JOIN qc.in_process_runs r ON r.id = h.run_id
            WHERE (h.handed_over_by = ${actor.id} OR h.to_operator_id = ${actor.id} OR h.accepted_by = ${actor.id})
              AND (${from}::date IS NULL OR h.handed_over_at >= (${from}::date::timestamp AT TIME ZONE 'UTC'))
              AND (${to}::date IS NULL OR h.handed_over_at < ((${to}::date + INTERVAL '1 day') AT TIME ZONE 'UTC'))
              AND (${status}::text IS NULL OR h.status = ${status})
              AND (${line}::text IS NULL OR r.production_line ILIKE ${line} ESCAPE '\\')
              AND (${shift}::text IS NULL OR (h.from_shift_code || ' ' || h.to_shift_code) ILIKE ${shift} ESCAPE '\\')
          ) q
          ORDER BY q.order_date ASC NULLS LAST, q.order_id ASC LIMIT ${limit} OFFSET ${offset}`;
        break;

      case 'quarantine-aging':
        query = sql<QueryRow>`
          SELECT r.id::text AS "sourceRecordId", NULL::text AS "relatedRecordId",
            r.receiving_no AS "receivingNo", r.doc_no AS "docNo", r.item_code AS "itemCode",
            r.description, r.lot, r.qty::text AS qty, r.receiving_date::text AS "receivingDate",
            r.expiry_date::text AS "expiryDate", r.workflow_state AS "workflowState",
            r.inspection_result AS "inspectionResult", r.release_system AS "releaseSystem"
          FROM qc.receiving_items r
          WHERE r.created_by = ${actor.id}
            AND (${from}::date IS NULL OR r.receiving_date >= ${from}::date)
            AND (${to}::date IS NULL OR r.receiving_date <= ${to}::date)
            AND (${lot}::text IS NULL OR r.lot ILIKE ${lot} ESCAPE '\\')
            AND (${itemCode}::text IS NULL OR r.item_code ILIKE ${itemCode} ESCAPE '\\')
            AND (${filters.workflowState ?? null}::text IS NULL OR r.workflow_state = ${filters.workflowState ?? null})
            AND (${filters.inspectionResult ?? null}::text IS NULL OR r.inspection_result = ${filters.inspectionResult ?? null})
            AND (${filters.releaseSystem ?? null}::boolean IS NULL OR r.release_system = ${filters.releaseSystem ?? null})
          ORDER BY r.receiving_date DESC, r.id ASC LIMIT ${limit} OFFSET ${offset}`;
        break;
    }

    const asOf = new Date().toISOString();
    const result = await query.execute(this.database);
    const hasMore = result.rows.length > pageSize;
    const pageRows = result.rows.slice(0, pageSize);
    const rows: ReportRow[] = pageRows.map(({ relatedRecordId: _relatedRecordId, ...row }) => row);
    const sourceRowIds = pageRows.flatMap((row) =>
      [row.sourceRecordId, row.relatedRecordId].filter((id): id is string => typeof id === 'string'),
    );

    return {
      definition,
      columns: definition.columns,
      rows,
      sourceRowIds,
      asOf,
      page,
      pageSize,
      hasMore,
    };
  }
}
