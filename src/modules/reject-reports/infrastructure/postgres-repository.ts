import type { Kysely, Transaction } from 'kysely';
import { sql } from 'kysely';
import { createHash } from 'node:crypto';
import { stableJson } from '../../../shared/json/stable-stringify.js';
import type { DatabaseSchema, DatabaseRow } from '../../../shared/database/db-types.js';
import { translateDatabaseError } from '../../../shared/database/database.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import type { AuditRepository } from '../../../shared/audit/audit-repository.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import type { OutboxRepository } from '../../../shared/outbox/outbox-repository.js';
import type { ApprovalRepository } from '../../approvals/ports/repository.js';
import { PostgresOutboxRepository } from '../../../shared/outbox/postgres-outbox-repository.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { Page } from '../../../shared/pagination/page.js';
import { formatReportNo, reportNoDateKey, reportNoPrefix } from '../domain/report-number.js';
import { transitionDailyRejectStatus } from '../domain/reject-report.js';
import {
  computeRejectPercent,
  compareDecimalStrings,
  PAPER_REJECT_PERCENTAGE_FORMULA,
  PRODUCED_REJECT_PERCENTAGE_FORMULA,
} from '../domain/reject-percentage.js';
import { entryOperationalRejectPct, entryOperationalRejectPctStatus } from '../domain/daily-reject.js';
import type {
  DailyReject,
  DailyRejectEntry,
  DailyRejectEntryInput,
} from '../domain/daily-reject.js';
import type {
  ApprovalConfirmation,
  IssueSlip,
  IssueSlipApprovalRole,
  IssueSlipFields,
} from '../domain/issue-slip.js';
import type { EventDeliveryStatus, FocusComplianceEntry, FocusReconciliationEvent } from '../domain/focus-compliance.js';
import type {
  PagedResult,
  RejectReportAnalytics,
  RejectReportAvailability,
  RejectReportListFilter,
  RejectReportRepository,
  RejectReportSummary,
} from '../ports/repository.js';

type Tx = Transaction<DatabaseSchema>;
type ReportRow = DatabaseRow<'reject_reports'>;
type SlipRow = DatabaseRow<'reject_issue_slips'>;
type ApprovalRow = DatabaseRow<'issue_slip_approval_confirmations'>;
type EntryRow = DatabaseRow<'daily_reject_entries'>;

const isUuid = (value: string) => /^[0-9a-f-]{36}$/i.test(value);

function reportFilterSql(filter: RejectReportListFilter = {}) {
  let where = sql`TRUE`;
  if (filter.type) where = sql`${where} AND r.report_type = ${filter.type}`;
  if (filter.status) where = sql`${where} AND r.status = ${filter.status}`;
  else where = sql`${where} AND r.status <> 'VOID'`;
  if (filter.from)
    where = sql`${where} AND r.report_date >= ${filter.from.toISOString().slice(0, 10)}::date`;
  if (filter.to)
    where = sql`${where} AND r.report_date <= ${filter.to.toISOString().slice(0, 10)}::date`;
  if (filter.department) where = sql`${where} AND r.department = ${filter.department}`;
  if (filter.shift) where = sql`${where} AND r.shift = ${filter.shift}`;
  if (filter.createdBy && isUuid(filter.createdBy))
    where = sql`${where} AND r.created_by = ${filter.createdBy}`;
  if (filter.approvalState === 'AWAITING')
    where = sql`${where} AND r.report_type = 'ISSUE_SLIP' AND r.status IN ('ISSUED', 'APPROVAL_TRACKING')`;
  if (filter.approvalState === 'COMPLETED')
    where = sql`${where} AND r.report_type = 'ISSUE_SLIP' AND r.status = 'COMPLETED'`;
  if (filter.unit) {
    where = sql`${where} AND (
      (r.report_type = 'ISSUE_SLIP' AND EXISTS (
        SELECT 1 FROM qc.reject_issue_slips s WHERE s.report_id = r.id AND btrim(s.unit) = ${filter.unit}
      )) OR (r.report_type = 'DAILY_REJECT' AND EXISTS (
        SELECT 1 FROM qc.daily_reject_entries e WHERE e.report_id = r.id AND btrim(e.rm_unit) = ${filter.unit}
      ))
    )`;
  }
  if (filter.unitMissing) {
    where = sql`${where} AND (
      (r.report_type = 'ISSUE_SLIP' AND EXISTS (
        SELECT 1 FROM qc.reject_issue_slips s WHERE s.report_id = r.id AND nullif(btrim(s.unit), '') IS NULL
      )) OR (r.report_type = 'DAILY_REJECT' AND EXISTS (
        SELECT 1 FROM qc.daily_reject_entries e WHERE e.report_id = r.id AND nullif(btrim(e.rm_unit), '') IS NULL
      ))
    )`;
  }
  if (filter.itemCode || filter.itemName || filter.lot || filter.search || filter.reason) {
    const predicates = (alias: 's' | 'e') => {
      const name = alias === 's' ? 'item_name' : 'item_description';
      const exact = sql`${filter.itemCode ? sql`AND ${sql.raw(alias)}.item_code ILIKE ${`%${filter.itemCode}%`}` : sql``}
        ${filter.itemName ? sql`AND ${sql.raw(alias)}.${sql.raw(name)} ILIKE ${`%${filter.itemName}%`}` : sql``}
        ${filter.lot ? sql`AND ${sql.raw(alias)}.lot_no ILIKE ${`%${filter.lot}%`}` : sql``}`;
      const search = filter.search
        ? sql`(${sql.raw(alias)}.item_code ILIKE ${`%${filter.search}%`} OR ${sql.raw(alias)}.${sql.raw(name)} ILIKE ${`%${filter.search}%`} OR ${sql.raw(alias)}.lot_no ILIKE ${`%${filter.search}%`} OR ${sql.raw(alias)}.reject_reason ILIKE ${`%${filter.search}%`})`
        : sql`TRUE`;
      const exists = (detail: unknown) =>
        alias === 's'
          ? sql`EXISTS (SELECT 1 FROM qc.reject_issue_slips s WHERE s.report_id = r.id AND ${detail})`
          : sql`EXISTS (SELECT 1 FROM qc.daily_reject_entries e WHERE e.report_id = r.id AND ${detail})`;
      const hasExact = Boolean(filter.itemCode || filter.itemName || filter.lot);
      const reason = filter.reason ? sql`AND ${sql.raw(alias)}.reject_reason = ${filter.reason}` : sql``;
      return hasExact || filter.reason
        ? sql`(${exists(sql`TRUE ${exact} ${reason}`)} AND (${filter.search ? sql`r.report_no ILIKE ${`%${filter.search}%`} OR ${exists(sql`${search}`)}` : sql`TRUE`}))`
        : sql`(${filter.search ? sql`r.report_no ILIKE ${`%${filter.search}%`} OR ${exists(sql`${search}`)}` : sql`FALSE`})`;
    };
    where = sql`${where} AND (
      (r.report_type = 'ISSUE_SLIP' AND ${predicates('s')}) OR
      (r.report_type = 'DAILY_REJECT' AND ${predicates('e')})
    )`;
  }
  return where;
}

function detailRowFilterSql(filter: RejectReportListFilter, type: 'ISSUE_SLIP' | 'DAILY_REJECT') {
  const alias = type === 'ISSUE_SLIP' ? 's' : 'e';
  const name = type === 'ISSUE_SLIP' ? 'item_name' : 'item_description';
  let where = sql`TRUE`;
  if (filter.unit)
    where = sql`${where} AND btrim(${sql.raw(alias)}.${sql.raw(type === 'ISSUE_SLIP' ? 'unit' : 'rm_unit')}) = ${filter.unit}`;
  if (filter.unitMissing)
    where = sql`${where} AND nullif(btrim(${sql.raw(alias)}.${sql.raw(type === 'ISSUE_SLIP' ? 'unit' : 'rm_unit')}), '') IS NULL`;
  if (filter.itemCode)
    where = sql`${where} AND ${sql.raw(alias)}.item_code ILIKE ${`%${filter.itemCode}%`}`;
  if (filter.itemName)
    where = sql`${where} AND ${sql.raw(alias)}.${sql.raw(name)} ILIKE ${`%${filter.itemName}%`}`;
  if (filter.lot) where = sql`${where} AND ${sql.raw(alias)}.lot_no ILIKE ${`%${filter.lot}%`}`;
  if (filter.search) {
    where = sql`${where} AND (r.report_no ILIKE ${`%${filter.search}%`} OR ${sql.raw(alias)}.item_code ILIKE ${`%${filter.search}%`} OR ${sql.raw(alias)}.${sql.raw(name)} ILIKE ${`%${filter.search}%`} OR ${sql.raw(alias)}.lot_no ILIKE ${`%${filter.search}%`} OR ${sql.raw(alias)}.reject_reason ILIKE ${`%${filter.search}%`})`;
  }
  if (filter.reason) where = sql`${where} AND ${sql.raw(alias)}.reject_reason = ${filter.reason}`;
  return where;
}

function mapApproval(row: ApprovalRow): ApprovalConfirmation {
  return {
    id: row.id,
    reportId: row.report_id,
    role: row.approval_role as ApprovalConfirmation['role'],
    status: row.status as ApprovalConfirmation['status'],
    approverName: row.approver_name ?? undefined,
    approverIdentity: row.approver_identity ?? undefined,
    actualApproverId: row.actual_decision_by ?? undefined,
    actualDecisionAt: row.actual_decision_at ?? undefined,
    outcome: (row.outcome ?? undefined) as ApprovalConfirmation['outcome'],
    evidenceConfidence: row.evidence_confidence as ApprovalConfirmation['evidenceConfidence'],
    confirmationBasis: row.confirmation_basis as ApprovalConfirmation['confirmationBasis'],
    reportedBy: row.confirmed_by ?? undefined,
    evidenceReporterRole: row.recorder_class as ApprovalConfirmation['evidenceReporterRole'],
    confirmedBy: row.confirmed_by ?? undefined,
    confirmedAt: row.confirmed_at ?? undefined,
    note: row.note ?? undefined,
    evidenceFileId: row.evidence_file_id ?? undefined,
    reversedBy: row.reversed_by ?? undefined,
    reversedAt: row.reversed_at ?? undefined,
    reversalReason: row.reversal_reason ?? undefined,
    version: BigInt(row.version),
  };
}

function mapSlip(
  report: ReportRow,
  slip: SlipRow,
  approvals: readonly ApprovalRow[],
  focusCompliance?: FocusComplianceEntry,
  eventDeliveryStatuses?: readonly EventDeliveryStatus[],
): IssueSlip {
  return {
    id: report.id,
    reportNo: report.report_no,
    reportDate: report.report_date,
    department: report.department,
    status: report.status as IssueSlip['status'],
    fields: {
      goodsDescription: slip.goods_description ?? undefined,
      itemCode: slip.item_code,
      itemName: slip.item_name,
      lotNo: slip.lot_no ?? undefined,
      unit: slip.unit,
      rejectedQty: String(slip.rejected_qty),
      unitCost: slip.unit_cost === null ? undefined : String(slip.unit_cost),
      totalValue: slip.total_value === null ? undefined : String(slip.total_value),
      rejectReason: slip.reject_reason,
      remarks: slip.remarks ?? undefined,
    },
    approvals: approvals.map(mapApproval),
    ...(focusCompliance ? { focusCompliance } : {}),
    ...(eventDeliveryStatuses ? { eventDeliveryStatuses } : {}),
    issuedAt: report.issued_at ?? undefined,
    completedAt: report.completed_at ?? undefined,
    voidedAt: report.voided_at ?? undefined,
    voidReason: report.void_reason ?? undefined,
    correctionOf: report.correction_of ?? undefined,
    createdBy: report.created_by,
    createdAt: report.created_at,
    updatedBy: report.updated_by ?? undefined,
    updatedAt: report.updated_at,
    version: BigInt(report.version),
  };
}

function mapEntry(row: EntryRow): DailyRejectEntry {
  return {
    id: row.id,
    reportId: row.report_id,
    position: row.position,
    machineName: row.machine_name ?? undefined,
    itemCode: row.item_code ?? undefined,
    itemDescription: row.item_description,
    lotNo: row.lot_no ?? undefined,
    buRmProductName: row.bu_rm_product_name ?? undefined,
    rmDescription: row.rm_description ?? undefined,
    rmUnit: row.rm_unit ?? undefined,
    rmLotNo: row.rm_lot_no ?? undefined,
    rmType: row.rm_type ?? undefined,
    pumpOutQty: row.pump_out_qty === null ? undefined : String(row.pump_out_qty),
    rejectQty: String(row.reject_qty),
    goodQty: String(row.good_qty),
    rejectPct: row.reject_pct === null ? null : String(row.reject_pct),
    totalProducedQty: row.total_produced_qty === null ? undefined : String(row.total_produced_qty),
    reworkQty: row.rework_qty === null ? undefined : String(row.rework_qty),
    holdQty: row.hold_qty === null ? undefined : String(row.hold_qty),
    quantityUnit: row.quantity_unit ?? undefined,
    quantitySourceReference: row.quantity_source_reference ?? undefined,
    operationalRejectPct: row.operational_reject_pct === null ? null : String(row.operational_reject_pct),
    operationalRejectPctStatus: row.operational_reject_pct_status as DailyRejectEntry['operationalRejectPctStatus'],
    paperFormulaId: row.paper_formula_id ?? undefined,
    paperFormulaVersion: row.paper_formula_version ?? undefined,
    operationalFormulaId: row.operational_formula_id ?? undefined,
    operationalFormulaVersion: row.operational_formula_version ?? undefined,
    quantityProvenance: row.quantity_provenance as DailyRejectEntry['quantityProvenance'],
    productionBalanceStatus: row.production_balance_status as DailyRejectEntry['productionBalanceStatus'],
    thresholdDecisionState: row.threshold_decision_state as DailyRejectEntry['thresholdDecisionState'],
    thresholdProfileId: row.threshold_profile_id ?? undefined,
    rejectLimit: row.reject_limit === null ? undefined : String(row.reject_limit),
    productionFormula: row.production_formula ?? undefined,
    rejectReason: row.reject_reason,
    analysis: row.analysis ?? undefined,
    version: BigInt(row.version),
  };
}

function mapDaily(report: ReportRow, entries: readonly EntryRow[], reviewEvents: DailyReject['reviewEvents'] = [], focusCompliance?: FocusComplianceEntry): DailyReject {
  return {
    id: report.id,
    reportNo: report.report_no,
    reportDate: report.report_date,
    department: report.department,
    shift: report.shift ?? undefined,
    status: report.status as DailyReject['status'],
    reviewEvents,
    ...(focusCompliance ? { focusCompliance } : {}),
    entries: entries.map(mapEntry),
    finalizedAt: report.finalized_at ?? undefined,
    voidedAt: report.voided_at ?? undefined,
    voidReason: report.void_reason ?? undefined,
    correctionOf: report.correction_of ?? undefined,
    createdBy: report.created_by,
    createdAt: report.created_at,
    updatedBy: report.updated_by ?? undefined,
    updatedAt: report.updated_at,
    version: BigInt(report.version),
  };
}

function entryValues(
  reportId: string,
  entry: DailyRejectEntryInput,
  position: number,
): Omit<DatabaseRow<'daily_reject_entries'>, 'id' | 'report_id' | 'position' | 'version'> & {
  id: string;
  report_id: string;
  position: number;
  version: bigint;
} {
  const rejectPct = computeRejectPercent(entry.rejectQty, entry.goodQty);
  const operationalRejectPct = entryOperationalRejectPct(entry);
  return {
    id: uuidv7(),
    report_id: reportId,
    position,
    machine_name: entry.machineName ?? null,
    item_code: entry.itemCode ?? null,
    item_description: entry.itemDescription,
    lot_no: entry.lotNo ?? null,
    bu_rm_product_name: entry.buRmProductName ?? null,
    rm_description: entry.rmDescription ?? null,
    rm_unit: entry.rmUnit ?? null,
    rm_lot_no: entry.rmLotNo ?? null,
    rm_type: entry.rmType ?? null,
    pump_out_qty: entry.pumpOutQty ?? null,
    reject_qty: entry.rejectQty,
    good_qty: entry.goodQty,
    reject_pct: rejectPct,
    total_produced_qty: entry.totalProducedQty ?? null,
    rework_qty: entry.reworkQty ?? null,
    hold_qty: entry.holdQty ?? null,
    quantity_unit: entry.quantityUnit ?? null,
    quantity_source_reference: entry.quantitySourceReference ?? null,
    operational_reject_pct: operationalRejectPct,
    operational_reject_pct_status: entryOperationalRejectPctStatus(entry),
    paper_formula_id: PAPER_REJECT_PERCENTAGE_FORMULA.id,
    paper_formula_version: PAPER_REJECT_PERCENTAGE_FORMULA.version,
    operational_formula_id: PRODUCED_REJECT_PERCENTAGE_FORMULA.id,
    operational_formula_version: PRODUCED_REJECT_PERCENTAGE_FORMULA.version,
    quantity_provenance: 'USER_RECORDED',
    production_balance_status: 'NOT_CONFIGURED',
    reject_limit: entry.rejectLimit ?? null,
    production_formula: entry.productionFormula ?? null,
    reject_reason: entry.rejectReason,
    analysis: entry.analysis ?? null,
    version: 1n,
  };
}

export class PostgresRejectReportRepository implements RejectReportRepository {
  constructor(
    private readonly database: Kysely<DatabaseSchema>,
    private readonly audit?: AuditRepository,
    private readonly outbox?: OutboxRepository,
    private readonly approvals?: ApprovalRepository,
  ) {}

  /**
   * Read-only capability probe for the schema contract introduced by
   * migration `0026`. Catalog lookups avoid touching report data. Checking
   * columns and integrity constraints as well as table names prevents a
   * partially applied or manually altered schema from being advertised as
   * ready and failing later inside a report query.
   */
  async availability(): Promise<RejectReportAvailability> {
    try {
      const result = await sql<{ ready: boolean }>`
        WITH expected_columns (table_name, column_name) AS (
          VALUES
            ('reject_reports', 'id'), ('reject_reports', 'report_no'),
            ('reject_reports', 'report_type'), ('reject_reports', 'report_date'),
            ('reject_reports', 'department'), ('reject_reports', 'shift'),
            ('reject_reports', 'status'), ('reject_reports', 'issued_at'),
            ('reject_reports', 'finalized_at'), ('reject_reports', 'completed_at'),
            ('reject_reports', 'voided_at'), ('reject_reports', 'voided_by'),
            ('reject_reports', 'void_reason'), ('reject_reports', 'correction_of'),
            ('reject_reports', 'created_by'), ('reject_reports', 'created_at'),
            ('reject_reports', 'updated_by'), ('reject_reports', 'updated_at'),
            ('reject_reports', 'version'),
            ('reject_issue_slips', 'report_id'), ('reject_issue_slips', 'goods_description'),
            ('reject_issue_slips', 'item_code'), ('reject_issue_slips', 'item_name'),
            ('reject_issue_slips', 'lot_no'), ('reject_issue_slips', 'unit'),
            ('reject_issue_slips', 'rejected_qty'), ('reject_issue_slips', 'unit_cost'),
            ('reject_issue_slips', 'total_value'), ('reject_issue_slips', 'reject_reason'),
            ('reject_issue_slips', 'remarks'),
            ('issue_slip_approval_confirmations', 'id'),
            ('issue_slip_approval_confirmations', 'report_id'),
            ('issue_slip_approval_confirmations', 'approval_role'),
            ('issue_slip_approval_confirmations', 'status'),
            ('issue_slip_approval_confirmations', 'approver_name'),
            ('issue_slip_approval_confirmations', 'approver_identity'),
            ('issue_slip_approval_confirmations', 'outcome'),
            ('issue_slip_approval_confirmations', 'evidence_confidence'),
            ('issue_slip_approval_confirmations', 'confirmation_basis'),
            ('issue_slip_approval_confirmations', 'recorder_class'),
            ('issue_slip_approval_confirmations', 'actual_decision_by'),
            ('issue_slip_approval_confirmations', 'actual_decision_at'),
            ('issue_slip_approval_confirmations', 'confirmed_by'),
            ('issue_slip_approval_confirmations', 'confirmed_at'),
            ('issue_slip_approval_confirmations', 'note'),
            ('issue_slip_approval_confirmations', 'evidence_file_id'),
            ('issue_slip_approval_confirmations', 'reversed_by'),
            ('issue_slip_approval_confirmations', 'reversed_at'),
            ('issue_slip_approval_confirmations', 'reversal_reason'),
            ('issue_slip_approval_confirmations', 'version'),
            ('daily_reject_entries', 'id'), ('daily_reject_entries', 'report_id'),
            ('daily_reject_entries', 'position'), ('daily_reject_entries', 'machine_name'),
            ('daily_reject_entries', 'item_code'), ('daily_reject_entries', 'item_description'),
            ('daily_reject_entries', 'lot_no'), ('daily_reject_entries', 'bu_rm_product_name'),
            ('daily_reject_entries', 'rm_description'), ('daily_reject_entries', 'rm_unit'),
            ('daily_reject_entries', 'rm_lot_no'), ('daily_reject_entries', 'rm_type'),
            ('daily_reject_entries', 'pump_out_qty'), ('daily_reject_entries', 'reject_qty'),
            ('daily_reject_entries', 'good_qty'), ('daily_reject_entries', 'reject_pct'),
            ('daily_reject_entries', 'total_produced_qty'), ('daily_reject_entries', 'rework_qty'),
            ('daily_reject_entries', 'hold_qty'), ('daily_reject_entries', 'quantity_unit'),
            ('daily_reject_entries', 'quantity_source_reference'),
            ('daily_reject_entries', 'operational_reject_pct'),
            ('daily_reject_entries', 'operational_reject_pct_status'),
            ('daily_reject_entries', 'paper_formula_id'), ('daily_reject_entries', 'paper_formula_version'),
            ('daily_reject_entries', 'operational_formula_id'), ('daily_reject_entries', 'operational_formula_version'),
            ('daily_reject_entries', 'quantity_provenance'), ('daily_reject_entries', 'production_balance_status'),
            ('daily_reject_entries', 'reject_limit'), ('daily_reject_entries', 'production_formula'),
            ('daily_reject_entries', 'reject_reason'), ('daily_reject_entries', 'analysis'),
            ('daily_reject_entries', 'version'),
            ('daily_reject_review_events', 'id'), ('daily_reject_review_events', 'report_id'),
            ('daily_reject_review_events', 'action'), ('daily_reject_review_events', 'actor_id'),
            ('daily_reject_review_events', 'permission_code'), ('daily_reject_review_events', 'report_version'),
            ('daily_reject_review_events', 'idempotency_key'), ('daily_reject_review_events', 'approved_snapshot'),
            ('daily_reject_review_events', 'snapshot_sha256'),
            ('focus_compliance_entries', 'report_revision'), ('focus_compliance_entries', 'focus_entry_date'),
            ('focus_compliance_entries', 'focus_entry_at'), ('focus_compliance_entries', 'external_reference'),
            ('focus_compliance_entries', 'reconciliation_state'), ('focus_compliance_entries', 'reported_qty'),
            ('focus_compliance_entries', 'reported_lot'), ('focus_compliance_entries', 'reported_report_number'),
            ('focus_compliance_entries', 'reconciliation_note'),
            ('focus_reconciliation_events', 'entry_id'), ('focus_reconciliation_events', 'report_revision'),
            ('focus_reconciliation_events', 'action'), ('focus_reconciliation_events', 'request_id')
        ), expected_constraints (table_name, constraint_name) AS (
          VALUES
            ('reject_reports', 'uq_reject_reports__report_no'),
            ('reject_reports', 'fk_reject_reports__created_by'),
            ('reject_reports', 'fk_reject_reports__updated_by'),
            ('reject_reports', 'fk_reject_reports__voided_by'),
            ('reject_reports', 'fk_reject_reports__correction_of'),
            ('reject_issue_slips', 'fk_reject_issue_slips__report_id'),
            ('issue_slip_approval_confirmations', 'uq_issue_slip_approvals__report_role'),
            ('issue_slip_approval_confirmations', 'fk_issue_slip_approvals__report_id'),
            ('issue_slip_approval_confirmations', 'fk_issue_slip_approvals__confirmed_by'),
            ('issue_slip_approval_confirmations', 'fk_issue_slip_approvals__actual_decision_by'),
            ('issue_slip_approval_confirmations', 'fk_issue_slip_approvals__reversed_by'),
            ('issue_slip_approval_confirmations', 'fk_issue_slip_approvals__evidence_file'),
            ('issue_slip_approval_confirmations', 'ck_issue_slip_approval_basis'),
            ('issue_slip_approval_confirmations', 'ck_issue_slip_approval_outcome'),
            ('issue_slip_approval_confirmations', 'ck_issue_slip_evidence_confidence'),
            ('issue_slip_approval_confirmations', 'ck_issue_slip_recorder_class'),
            ('issue_slip_approval_confirmations', 'ck_issue_slip_confirmed_provenance'),
            ('issue_slip_approval_confirmations', 'ck_issue_slip_approver_decision_provenance'),
            ('daily_reject_entries', 'uq_daily_reject_entries__report_position'),
            ('daily_reject_entries', 'fk_daily_reject_entries__report_id'),
            ('daily_reject_entries', 'daily_reject_entries__total_produced_nonnegative'),
            ('daily_reject_entries', 'daily_reject_entries__rework_nonnegative'),
            ('daily_reject_entries', 'daily_reject_entries__hold_nonnegative'),
            ('daily_reject_entries', 'daily_reject_entries__quantity_unit_required'),
            ('daily_reject_entries', 'daily_reject_entries__operational_pct_state'),
            ('daily_reject_entries', 'daily_reject_entries__formula_versions_positive'),
            ('daily_reject_entries', 'daily_reject_entries__formula_identity'),
            ('daily_reject_entries', 'daily_reject_entries__operational_formula_identity'),
            ('daily_reject_entries', 'daily_reject_entries__balance_status_vocabulary'),
            ('daily_reject_entries', 'daily_reject_entries__quantity_provenance_vocabulary')
        ), expected_tables (table_name) AS (
          VALUES
            ('reject_reports'), ('reject_issue_slips'),
            ('issue_slip_approval_confirmations'), ('daily_reject_entries'),
            ('event_delivery_statuses'), ('focus_compliance_entries'), ('focus_reconciliation_events')
        )
        SELECT (
          EXISTS (
            SELECT 1 FROM qc.schema_migrations
            WHERE version = '0026' AND name = '0026_reject_reports'
          )
          AND EXISTS (
            SELECT 1 FROM qc.schema_migrations
            WHERE version = '0058' AND name = '0058_outbox_delivery_and_focus_compliance'
          )
          AND EXISTS (
            SELECT 1 FROM qc.schema_migrations
            WHERE version = '0071' AND name = '0071_reject_percentage_denominators'
          )
          AND EXISTS (
            SELECT 1 FROM qc.schema_migrations
            WHERE version = '0074' AND name = '0074_daily_reject_three_stage_review'
          )
          AND EXISTS (
            SELECT 1 FROM qc.schema_migrations
            WHERE version = '0076' AND name = '0076_manual_focus_daily_reconciliation'
          )
          AND NOT EXISTS (
            SELECT 1 FROM expected_tables t
            WHERE to_regclass('qc.' || t.table_name) IS NULL
          )
          AND NOT EXISTS (
            SELECT 1 FROM expected_columns c
            WHERE NOT EXISTS (
              SELECT 1 FROM pg_catalog.pg_attribute a
              WHERE a.attrelid = to_regclass('qc.' || c.table_name)
                AND a.attname = c.column_name
                AND a.attnum > 0
                AND NOT a.attisdropped
            )
          )
          AND NOT EXISTS (
            SELECT 1 FROM expected_constraints c
            WHERE NOT EXISTS (
              SELECT 1 FROM pg_catalog.pg_constraint con
              WHERE con.conrelid = to_regclass('qc.' || c.table_name)
                AND con.conname = c.constraint_name
                AND con.convalidated
            )
          )
        ) AS ready
      `.execute(this.database);
      return result.rows[0]?.ready
        ? { available: true }
        : { available: false, reason: 'SCHEMA_NOT_READY' };
    } catch {
      // A failed query is not evidence that the schema is old. Keep it
      // fail-closed while reporting a distinct, sanitized check failure.
      return { available: false, reason: 'CHECK_FAILED' };
    }
  }

  /**
   * Writes audit/outbox rows on the same transaction executor, mirroring the
   * tasks-module wiring: the shared Postgres repositories are re-instantiated
   * over the caller's transaction so the events roll back with the write.
   */
  private auditFor(tx: Tx): AuditRepository | undefined {
    return this.audit instanceof PostgresAuditRepository
      ? new PostgresAuditRepository(tx)
      : this.audit;
  }

  private outboxFor(tx: Tx): OutboxRepository | undefined {
    return this.outbox instanceof PostgresOutboxRepository
      ? new PostgresOutboxRepository(tx)
      : this.outbox;
  }

  /**
   * Allocates the next human-readable report number inside the caller's
   * transaction. The advisory xact lock on (prefix, dateKey) serializes
   * concurrent creators; the unique constraint on report_no is the guard.
   */
  private async allocateReportNo(
    tx: Tx,
    type: 'ISSUE_SLIP' | 'DAILY_REJECT',
    reportDate: Date,
  ): Promise<string> {
    const prefix = reportNoPrefix(type);
    const dateKey = reportNoDateKey(reportDate);
    const likePattern = `${prefix}-${dateKey}-%`;
    await sql`SELECT pg_advisory_xact_lock(hashtextextended(${likePattern}, 0))`.execute(tx);
    const row = await tx
      .selectFrom('reject_reports')
      .select(({ fn }) => fn.max('report_no').as('maxNo'))
      .where('report_no', 'like', likePattern)
      .executeTakeFirst();
    const current = row?.maxNo ? Number(row.maxNo.slice(-4)) : 0;
    return formatReportNo(type, reportDate, current + 1);
  }

  private async loadSlip(
    executor: Kysely<DatabaseSchema> | Tx,
    id: string,
  ): Promise<IssueSlip | undefined> {
    if (!isUuid(id)) return undefined;
    const report = await executor
      .selectFrom('reject_reports')
      .selectAll()
      .where('id', '=', id)
      .where('report_type', '=', 'ISSUE_SLIP')
      .executeTakeFirst();
    if (!report) return undefined;
    const [slip, approvals, focusRow] = await Promise.all([
      executor
        .selectFrom('reject_issue_slips')
        .selectAll()
        .where('report_id', '=', id)
        .executeTakeFirstOrThrow(),
      executor
        .selectFrom('issue_slip_approval_confirmations')
        .selectAll()
        .where('report_id', '=', id)
        // Canonical checkpoint order (SUPERVISOR -> QC_MANAGER ->
        // FACTORY_DIRECTOR). Alphabetical SQL ordering puts FACTORY_DIRECTOR
        // first, which scrambled the domain queue and denied the correct
        // re-confirmation after a reversal (QC-100-FINAL-014).
        .orderBy(
          sql`array_position(array['SUPERVISOR','QC_MANAGER','FACTORY_DIRECTOR'], approval_role)`,
        )
        .execute(),
      executor
        .selectFrom('focus_compliance_entries')
        .selectAll()
        .where('report_id', '=', id)
        .orderBy('report_revision', 'desc')
        .executeTakeFirst(),
    ]);
    const focusCompliance: FocusComplianceEntry | undefined = focusRow
      ? {
          id: focusRow.id,
          sourceEventId: focusRow.source_event_id,
          reportId: focusRow.report_id,
          status: focusRow.status,
          entryEvidenceNote: focusRow.entry_evidence_note ?? undefined,
          entryEvidenceFileId: focusRow.entry_evidence_file_id ?? undefined,
          enteredBy: focusRow.entered_by ?? undefined,
          enteredAt: focusRow.entered_at ?? undefined,
          verificationEvidenceNote: focusRow.verification_evidence_note ?? undefined,
          verificationEvidenceFileId: focusRow.verification_evidence_file_id ?? undefined,
          verifiedBy: focusRow.verified_by ?? undefined,
          verifiedAt: focusRow.verified_at ?? undefined,
          version: BigInt(focusRow.version),
          reportRevision: focusRow.report_revision === null ? undefined : BigInt(focusRow.report_revision),
          focusEntryAt: focusRow.focus_entry_at ?? undefined,
          focusEntryDate: focusRow.focus_entry_date ?? undefined,
          externalReference: focusRow.external_reference ?? undefined,
          reconciliationState: focusRow.reconciliation_state,
          reportedQty: focusRow.reported_qty ?? undefined,
          reportedLot: focusRow.reported_lot ?? undefined,
          reportedReportNumber: focusRow.reported_report_number ?? undefined,
        }
      : undefined;
    if (focusCompliance && focusRow) {
      const events = await executor.selectFrom('focus_reconciliation_events').selectAll()
        .where('entry_id', '=', focusRow.id).orderBy('occurred_at').orderBy('id').execute();
      focusCompliance.reconciliationEvents = events.map((event): FocusReconciliationEvent => ({
        id: event.id, reportRevision: BigInt(event.report_revision), action: event.action,
        expectedQty: event.expected_qty ?? undefined, reportedQty: event.reported_qty ?? '',
        expectedLot: event.expected_lot ?? undefined, reportedLot: event.reported_lot ?? undefined,
        expectedReportNumber: event.expected_report_number, reportedReportNumber: event.reported_report_number ?? '',
        evidenceNote: event.evidence_note, evidenceFileId: event.evidence_file_id ?? undefined,
        actorId: event.actor_id, occurredAt: event.occurred_at,
      }));
    }
    const deliveryRows = focusRow
      ? await executor
          .selectFrom('event_delivery_statuses')
          .selectAll()
          .where('source_event_id', '=', focusRow.source_event_id)
          .orderBy('recorded_at')
          .orderBy('id')
          .execute()
      : undefined;
    const deliveryStatuses: EventDeliveryStatus[] | undefined = deliveryRows?.map((delivery) => ({
      sourceEventId: delivery.source_event_id,
      deliveryTarget: delivery.delivery_target,
      status: delivery.status as EventDeliveryStatus['status'],
      sourceEventReference: delivery.source_event_reference,
      evidenceNote: delivery.evidence_note ?? undefined,
      evidenceFileId: delivery.evidence_file_id ?? undefined,
      recordedAt: delivery.recorded_at,
    }));
    return mapSlip(report, slip, approvals, focusCompliance, deliveryStatuses);
  }

  private async loadDaily(
    executor: Kysely<DatabaseSchema> | Tx,
    id: string,
  ): Promise<DailyReject | undefined> {
    if (!isUuid(id)) return undefined;
    const report = await executor
      .selectFrom('reject_reports')
      .selectAll()
      .where('id', '=', id)
      .where('report_type', '=', 'DAILY_REJECT')
      .executeTakeFirst();
    if (!report) return undefined;
    const entries = await executor
      .selectFrom('daily_reject_entries')
      .selectAll()
      .where('report_id', '=', id)
      .orderBy('position')
      .execute();
    const reviewEvents = await executor.selectFrom('daily_reject_review_events').selectAll()
      .where('report_id', '=', id).orderBy('report_version').execute();
    const focusRow = await executor.selectFrom('focus_compliance_entries').selectAll()
      .where('report_id', '=', id).orderBy('report_revision', 'desc').executeTakeFirst();
    const focusCompliance: FocusComplianceEntry | undefined = focusRow ? {
      id: focusRow.id, sourceEventId: focusRow.source_event_id, reportId: focusRow.report_id,
      status: focusRow.status, entryEvidenceNote: focusRow.entry_evidence_note ?? undefined,
      entryEvidenceFileId: focusRow.entry_evidence_file_id ?? undefined, enteredBy: focusRow.entered_by ?? undefined,
      enteredAt: focusRow.entered_at ?? undefined, verificationEvidenceNote: focusRow.verification_evidence_note ?? undefined,
      verificationEvidenceFileId: focusRow.verification_evidence_file_id ?? undefined, verifiedBy: focusRow.verified_by ?? undefined,
      verifiedAt: focusRow.verified_at ?? undefined, version: BigInt(focusRow.version), reportRevision: focusRow.report_revision === null ? undefined : BigInt(focusRow.report_revision),
      focusEntryAt: focusRow.focus_entry_at ?? undefined, focusEntryDate: focusRow.focus_entry_date ?? undefined,
      externalReference: focusRow.external_reference ?? undefined, reconciliationState: focusRow.reconciliation_state,
      reportedQty: focusRow.reported_qty ?? undefined, reportedLot: focusRow.reported_lot ?? undefined,
      reportedReportNumber: focusRow.reported_report_number ?? undefined,
    } : undefined;
    if (focusCompliance && focusRow) {
      const events = await executor.selectFrom('focus_reconciliation_events').selectAll()
        .where('entry_id', '=', focusRow.id).orderBy('occurred_at').orderBy('id').execute();
      focusCompliance.reconciliationEvents = events.map((event): FocusReconciliationEvent => ({
        id: event.id, reportRevision: BigInt(event.report_revision), action: event.action,
        expectedQty: event.expected_qty ?? undefined, reportedQty: event.reported_qty ?? '',
        expectedLot: event.expected_lot ?? undefined, reportedLot: event.reported_lot ?? undefined,
        expectedReportNumber: event.expected_report_number, reportedReportNumber: event.reported_report_number ?? '',
        evidenceNote: event.evidence_note, evidenceFileId: event.evidence_file_id ?? undefined,
        actorId: event.actor_id, occurredAt: event.occurred_at,
      }));
    }
    return mapDaily(report, entries, reviewEvents.map((event) => ({
      id: event.id, reportId: event.report_id, action: event.action as NonNullable<DailyReject['reviewEvents']>[number]['action'],
      fromState: event.from_state as DailyReject['status'], toState: event.to_state as DailyReject['status'],
      actorId: event.actor_id, permissionCode: event.permission_code, reason: event.reason ?? undefined,
      occurredAt: event.occurred_at, reportVersion: BigInt(event.report_version),
      snapshot: event.approved_snapshot ?? undefined, snapshotHash: event.snapshot_sha256 ?? undefined,
    })), focusCompliance);
  }

  private async bumpReport(
    tx: Tx,
    id: string,
    expectedVersion: bigint,
    actor: ActorContext,
    patch: Record<string, unknown>,
  ): Promise<ReportRow> {
    const row = await tx
      .updateTable('reject_reports')
      .set({
        ...patch,
        updated_by: actor.id,
        updated_at: new Date(),
        version: sql`version + 1`,
      } as never)
      .where('id', '=', id)
      .where('version', '=', expectedVersion)
      .returningAll()
      .executeTakeFirst();
    if (!row) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
    return row;
  }

  async createIssueSlip(input: {
    actor: ActorContext;
    requestId: string;
    reportDate: Date;
    department: string;
    shift?: string;
    fields: IssueSlipFields;
  }): Promise<IssueSlip> {
    try {
      return await this.database.transaction().execute(async (tx) => {
        const id = uuidv7();
        const reportNo = await this.allocateReportNo(tx, 'ISSUE_SLIP', input.reportDate);
        await tx
          .insertInto('reject_reports')
          .values({
            id,
            report_no: reportNo,
            report_type: 'ISSUE_SLIP',
            report_date: input.reportDate,
            department: input.department,
            shift: input.shift ?? null,
            status: 'DRAFT',
            created_by: input.actor.id,
            updated_by: input.actor.id,
            version: 1n,
          })
          .execute();
        await tx
          .insertInto('reject_issue_slips')
          .values({
            report_id: id,
            goods_description: input.fields.goodsDescription ?? null,
            item_code: input.fields.itemCode,
            item_name: input.fields.itemName,
            lot_no: input.fields.lotNo ?? null,
            unit: input.fields.unit,
            rejected_qty: input.fields.rejectedQty,
            unit_cost: input.fields.unitCost ?? null,
            total_value: input.fields.totalValue ?? null,
            reject_reason: input.fields.rejectReason,
            remarks: input.fields.remarks ?? null,
          })
          .execute();
        await tx
          .insertInto('issue_slip_approval_confirmations')
          .values(
            (['SUPERVISOR', 'QC_MANAGER', 'FACTORY_DIRECTOR'] as const).map((role) => ({
              id: uuidv7(),
              report_id: id,
              approval_role: role,
              status: 'PENDING',
              version: 1n,
            })),
          )
          .execute();
        await this.auditFor(tx)?.append({
          actorType: 'USER',
          actorId: input.actor.id,
          subjectType: 'REJECT_REPORT',
          subjectId: id,
          action: 'REJECT_REPORT_CREATED',
          newState: 'DRAFT',
          requestId: input.requestId,
          payload: { reportNo, reportType: 'ISSUE_SLIP' },
        });
        await this.outboxFor(tx)?.enqueue({
          eventType: 'REJECT_REPORT_CREATED',
          aggregateType: 'REJECT_REPORT',
          aggregateId: id,
          payload: { reportNo, reportType: 'ISSUE_SLIP' },
          dedupeKey: `reject-report-created:${id}`,
        });
        const created = await this.loadSlip(tx, id);
        if (!created) throw new AppError('SYSTEM_INTERNAL');
        return created;
      });
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  getIssueSlip(id: string): Promise<IssueSlip | undefined> {
    return this.loadSlip(this.database, id);
  }

  async listIssueSlips(input: {
    filter: RejectReportListFilter;
    page: Page;
  }): Promise<PagedResult<IssueSlip>> {
    const predicate = reportFilterSql({ ...input.filter, type: 'ISSUE_SLIP' });
    const countRow = await sql<{ count: string }>`
      SELECT COUNT(*)::text AS count FROM qc.reject_reports r WHERE ${predicate}
    `.execute(this.database);
    const rows = await sql<{ id: string }>`
      SELECT r.id FROM qc.reject_reports r WHERE ${predicate}
      ORDER BY r.report_date DESC, r.report_no DESC
      LIMIT ${input.page.pageSize} OFFSET ${input.page.offset}
    `.execute(this.database);
    const items = await Promise.all(rows.rows.map((row) => this.loadSlip(this.database, row.id)));
    return {
      items: items.filter((item): item is IssueSlip => Boolean(item)),
      total: Number(countRow.rows[0]?.count ?? 0),
    };
  }

  async updateIssueSlipDraft(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    requestId: string;
    reportDate: Date;
    department: string;
    shift?: string;
    fields: IssueSlipFields;
  }): Promise<IssueSlip> {
    try {
      return await this.database.transaction().execute(async (tx) => {
        await this.bumpReport(tx, input.id, input.expectedVersion, input.actor, {
          report_date: input.reportDate,
          department: input.department,
          shift: input.shift ?? null,
        });
        await tx
          .updateTable('reject_issue_slips')
          .set({
            goods_description: input.fields.goodsDescription ?? null,
            item_code: input.fields.itemCode,
            item_name: input.fields.itemName,
            lot_no: input.fields.lotNo ?? null,
            unit: input.fields.unit,
            rejected_qty: input.fields.rejectedQty,
            unit_cost: input.fields.unitCost ?? null,
            total_value: input.fields.totalValue ?? null,
            reject_reason: input.fields.rejectReason,
            remarks: input.fields.remarks ?? null,
          })
          .where('report_id', '=', input.id)
          .execute();
        await this.auditFor(tx)?.append({
          actorType: 'USER',
          actorId: input.actor.id,
          subjectType: 'REJECT_REPORT',
          subjectId: input.id,
          action: 'REJECT_REPORT_UPDATED',
          requestId: input.requestId,
        });
        const updated = await this.loadSlip(tx, input.id);
        if (!updated) throw new AppError('SYSTEM_INTERNAL');
        return updated;
      });
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  /** DRAFT → ISSUED → APPROVAL_TRACKING atomically: header + audit + outbox. */
  async issueIssueSlip(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    requestId: string;
  }): Promise<IssueSlip> {
    try {
      return await this.database.transaction().execute(async (tx) => {
        const now = new Date();
        const row = await this.bumpReport(tx, input.id, input.expectedVersion, input.actor, {
          status: 'APPROVAL_TRACKING',
          issued_at: now,
        });
        if (row.status !== 'APPROVAL_TRACKING') throw new AppError('SYSTEM_INTERNAL');
        await this.auditFor(tx)?.append({
          actorType: 'USER',
          actorId: input.actor.id,
          subjectType: 'REJECT_REPORT',
          subjectId: input.id,
          action: 'ISSUE_SLIP_ISSUED',
          oldState: 'DRAFT',
          newState: 'APPROVAL_TRACKING',
          requestId: input.requestId,
        });
        await this.outboxFor(tx)?.enqueue({
          eventType: 'ISSUE_SLIP_ISSUED',
          aggregateType: 'REJECT_REPORT',
          aggregateId: input.id,
          payload: { reportNo: row.report_no },
          dedupeKey: `issue-slip-issued:${input.id}`,
        });
        const sourceEvent = await tx
          .selectFrom('outbox_events')
          .select('id')
          .where('dedupe_key', '=', `issue-slip-issued:${input.id}`)
          .executeTakeFirst();
        if (sourceEvent) {
          await tx
            .insertInto('event_delivery_statuses')
            .values({
              source_event_id: sourceEvent.id,
              delivery_target: 'FOCUS_MANUAL',
              status: 'PENDING',
              source_event_reference: sourceEvent.id,
              evidence_note: null,
              evidence_file_id: null,
              recorded_by: input.actor.id,
            })
            .onConflict((conflict) =>
              conflict.columns(['source_event_id', 'delivery_target', 'status']).doNothing(),
            )
            .execute();
          await tx
            .insertInto('focus_compliance_entries')
            .values({
              source_event_id: sourceEvent.id,
              report_id: input.id,
              status: 'PENDING_ENTRY',
              report_revision: input.expectedVersion + 1n,
              focus_entry_date: null,
              focus_entry_at: null,
              external_reference: null,
              reconciliation_state: 'NOT_RECONCILED',
              reported_qty: null,
              reported_lot: null,
              reported_report_number: null,
              reconciliation_note: null,
              entry_evidence_note: null,
              entry_evidence_file_id: null,
              entered_by: null,
              entered_at: null,
              verification_evidence_note: null,
              verification_evidence_file_id: null,
              verified_by: null,
              verified_at: null,
            })
            .onConflict((conflict) => conflict.column('source_event_id').doNothing())
            .execute();
        }
        const updated = await this.loadSlip(tx, input.id);
        if (!updated) throw new AppError('SYSTEM_INTERNAL');
        return updated;
      });
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  /** Records one reported external fact; this does not approve or complete the slip. */
  async confirmApproval(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    requestId: string;
    role: IssueSlipApprovalRole;
    reporterClass: 'ORIGINAL_SUBMITTER' | 'QC_COMPLIANCE_DATA_ENTRY';
    approverName?: string;
    outcome: NonNullable<ApprovalConfirmation['outcome']>;
    evidenceConfidence: ApprovalConfirmation['evidenceConfidence'];
    approverIdentity?: string;
    note?: string;
    evidenceFileId?: string;
  }): Promise<IssueSlip> {
    try {
      return await this.database.transaction().execute(async (tx) => {
        const now = new Date();
        const confirmation = await tx
          .updateTable('issue_slip_approval_confirmations')
          .set({
            status: 'CONFIRMED',
            approver_name: input.approverName ?? null,
            approver_identity: input.approverIdentity ?? input.approverName ?? null,
            outcome: input.outcome,
            evidence_confidence: input.evidenceConfidence,
            confirmation_basis: 'SELF_REPORTED',
            recorder_class: input.reporterClass,
            confirmed_by: input.actor.id,
            confirmed_at: now,
            note: input.note ?? null,
            evidence_file_id: input.evidenceFileId ?? null,
            version: sql`version + 1`,
          } as never)
          .where('report_id', '=', input.id)
          .where('approval_role', '=', input.role)
          // A REVERSED checkpoint is re-confirmed through this same guarded
          // write: the domain queue puts it at the front, so only the reversed
          // checkpoint can reach here, and the guard keeps the row
          // single-transition (PENDING or REVERSED -> CONFIRMED, never twice).
          .where('status', 'in', ['PENDING', 'REVERSED'])
          .returningAll()
          .executeTakeFirst();
        if (!confirmation) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });

        await this.bumpReport(tx, input.id, input.expectedVersion, input.actor, {});
        await this.auditFor(tx)?.append({
          actorType: 'USER',
          actorId: input.actor.id,
          subjectType: 'REJECT_REPORT',
          subjectId: input.id,
          action: 'ISSUE_SLIP_EXTERNAL_CONFIRMATION_RECORDED',
          requestId: input.requestId,
          payload: {
            approvalRole: input.role,
            outcome: input.outcome,
            confirmationBasis: 'SELF_REPORTED',
            evidenceConfidence: input.evidenceConfidence,
            recorderClass: input.reporterClass,
            semantics: 'REPORTED_EXTERNAL_FACT_NOT_INTERNAL_APPROVAL',
          },
        });

        const updated = await this.loadSlip(tx, input.id);
        if (!updated) throw new AppError('SYSTEM_INTERNAL');
        return updated;
      });
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  /**
   * Controlled correction: CONFIRMED → REVERSED with reason; the report
   * returns to APPROVAL_TRACKING (from COMPLETED when needed) so the
   * checkpoint can be re-confirmed through a fresh cycle.
   */
  async reverseApproval(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    requestId: string;
    role: IssueSlipApprovalRole;
    reason: string;
  }): Promise<IssueSlip> {
    try {
      return await this.database.transaction().execute(async (tx) => {
        const now = new Date();
        const reversed = await tx
          .updateTable('issue_slip_approval_confirmations')
          .set({
            status: 'REVERSED',
            reversed_by: input.actor.id,
            reversed_at: now,
            reversal_reason: input.reason,
            version: sql`version + 1`,
          } as never)
          .where('report_id', '=', input.id)
          .where('approval_role', '=', input.role)
          .where('status', '=', 'CONFIRMED')
          .returningAll()
          .executeTakeFirst();
        if (!reversed) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        const report = await this.bumpReport(tx, input.id, input.expectedVersion, input.actor, {
          status: 'APPROVAL_TRACKING',
          completed_at: null,
        });
        await this.auditFor(tx)?.append({
          actorType: 'USER',
          actorId: input.actor.id,
          subjectType: 'REJECT_REPORT',
          subjectId: input.id,
          action: 'REJECT_REPORT_CORRECTED',
          oldState: report.status === 'COMPLETED' ? 'COMPLETED' : 'APPROVAL_TRACKING',
          newState: 'APPROVAL_TRACKING',
          reason: input.reason,
          requestId: input.requestId,
          payload: { approvalRole: input.role, correction: 'APPROVAL_CONFIRMATION_REVERSED' },
        });
        const updated = await this.loadSlip(tx, input.id);
        if (!updated) throw new AppError('SYSTEM_INTERNAL');
        return updated;
      });
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async createDailyReject(input: {
    actor: ActorContext;
    requestId: string;
    reportDate: Date;
    department: string;
    shift?: string;
    entries: readonly DailyRejectEntryInput[];
  }): Promise<DailyReject> {
    try {
      return await this.database.transaction().execute(async (tx) => {
        const id = uuidv7();
        const reportNo = await this.allocateReportNo(tx, 'DAILY_REJECT', input.reportDate);
        await tx
          .insertInto('reject_reports')
          .values({
            id,
            report_no: reportNo,
            report_type: 'DAILY_REJECT',
            report_date: input.reportDate,
            department: input.department,
            shift: input.shift ?? null,
            status: 'DRAFT',
            created_by: input.actor.id,
            updated_by: input.actor.id,
            version: 1n,
          })
          .execute();
        if (input.entries.length)
          await tx
            .insertInto('daily_reject_entries')
            .values(input.entries.map((entry, index) => entryValues(id, entry, index + 1)))
            .execute();
        await this.auditFor(tx)?.append({
          actorType: 'USER',
          actorId: input.actor.id,
          subjectType: 'REJECT_REPORT',
          subjectId: id,
          action: 'REJECT_REPORT_CREATED',
          newState: 'DRAFT',
          requestId: input.requestId,
          payload: { reportNo, reportType: 'DAILY_REJECT', entryCount: input.entries.length },
        });
        await this.outboxFor(tx)?.enqueue({
          eventType: 'REJECT_REPORT_CREATED',
          aggregateType: 'REJECT_REPORT',
          aggregateId: id,
          payload: { reportNo, reportType: 'DAILY_REJECT' },
          dedupeKey: `reject-report-created:${id}`,
        });
        const created = await this.loadDaily(tx, id);
        if (!created) throw new AppError('SYSTEM_INTERNAL');
        return created;
      });
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  getDailyReject(id: string): Promise<DailyReject | undefined> {
    return this.loadDaily(this.database, id);
  }

  async listDailyRejects(input: {
    filter: RejectReportListFilter;
    page: Page;
  }): Promise<PagedResult<DailyReject>> {
    const predicate = reportFilterSql({ ...input.filter, type: 'DAILY_REJECT' });
    const countRow = await sql<{ count: string }>`
      SELECT COUNT(*)::text AS count FROM qc.reject_reports r WHERE ${predicate}
    `.execute(this.database);
    const rows = await sql<{ id: string }>`
      SELECT r.id FROM qc.reject_reports r WHERE ${predicate}
      ORDER BY r.report_date DESC, r.report_no DESC
      LIMIT ${input.page.pageSize} OFFSET ${input.page.offset}
    `.execute(this.database);
    const items = await Promise.all(rows.rows.map((row) => this.loadDaily(this.database, row.id)));
    return {
      items: items.filter((item): item is DailyReject => Boolean(item)),
      total: Number(countRow.rows[0]?.count ?? 0),
    };
  }

  /**
   * Appends one server-validated entry. The report version is compare-and-set
   * in the same transaction before selecting the next position, so concurrent
   * submits cannot replace/reorder prior rows or append twice at one version.
   */
  async appendDailyRejectEntry(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    requestId: string;
    entry: DailyRejectEntryInput;
  }): Promise<DailyReject> {
    try {
      return await this.database.transaction().execute(async (tx) => {
        await this.bumpReport(tx, input.id, input.expectedVersion, input.actor, {});
        const positionRow = await tx
          .selectFrom('daily_reject_entries')
          .select(({ fn }) => fn.max('position').as('position'))
          .where('report_id', '=', input.id)
          .executeTakeFirst();
        const position = Number(positionRow?.position ?? 0) + 1;
        if (!Number.isSafeInteger(position) || position > 2_147_483_647)
          throw new AppError('VALIDATION_FAILED', {
            userSafe: true,
            fieldErrors: { entries: ['no more entries can be added to this record'] },
          });
        await tx
          .insertInto('daily_reject_entries')
          .values(entryValues(input.id, input.entry, position))
          .execute();
        await this.auditFor(tx)?.append({
          actorType: 'USER',
          actorId: input.actor.id,
          subjectType: 'REJECT_REPORT',
          subjectId: input.id,
          action: 'REJECT_REPORT_UPDATED',
          requestId: input.requestId,
          payload: { change: 'DAILY_REJECT_ENTRY_APPENDED', position },
        });
        await this.outboxFor(tx)?.enqueue({
          eventType: 'REJECT_REPORT_UPDATED',
          aggregateType: 'REJECT_REPORT',
          aggregateId: input.id,
          payload: { change: 'DAILY_REJECT_ENTRY_APPENDED', position },
          dedupeKey: `daily-reject-entry-appended:${input.id}:${input.expectedVersion}`,
        });
        const updated = await this.loadDaily(tx, input.id);
        if (!updated) throw new AppError('SYSTEM_INTERNAL');
        return updated;
      });
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async transitionDailyRejectReview(input: Parameters<RejectReportRepository['transitionDailyRejectReview']>[0]): Promise<DailyReject> {
    const permission = {
      SUBMIT_FOR_QC: 'PERM-RREJ-SUBMIT-QC', QC_REVIEW: 'PERM-RREJ-QC-REVIEW',
      QC_RETURN: 'PERM-RREJ-QC-REVIEW', SUPERVISOR_APPROVE: 'PERM-RREJ-SUPERVISOR-APPROVE',
    }[input.action];
    const fingerprint = createHash('sha256').update(stableJson({
      id: input.id, actorId: input.actor.id, action: input.action,
      expectedVersion: input.expectedVersion, reason: input.reason ?? null,
    })).digest('hex');
    return this.database.transaction().execute(async (tx) => {
      await sql`select pg_advisory_xact_lock(hashtextextended(${input.idempotencyKey}, 0))`.execute(tx);
      const prior = await tx.selectFrom('daily_reject_review_events').selectAll()
        .where('idempotency_key', '=', input.idempotencyKey).executeTakeFirst();
      if (prior) {
        if (prior.command_fingerprint !== fingerprint) throw new AppError('CONFLICT_DUPLICATE_COMMAND', { userSafe: true });
        const replay = await this.loadDaily(tx, input.id);
        if (!replay) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
        return replay;
      }
      const current = await tx.selectFrom('reject_reports').selectAll().where('id', '=', input.id)
        .where('report_type', '=', 'DAILY_REJECT').forUpdate().executeTakeFirst();
      if (!current) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      if (BigInt(current.version) !== input.expectedVersion) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
      if (input.action === 'SUBMIT_FOR_QC' ? current.created_by !== input.actor.id : current.created_by === input.actor.id)
        throw new AppError('AUTHZ_DENIED', { userSafe: true });
      const fromState = current.status as DailyReject['status'];
      if (input.action === 'SUPERVISOR_APPROVE') {
        const qcDecision = await tx.selectFrom('daily_reject_review_events').select('actor_id')
          .where('report_id', '=', input.id).where('action', '=', 'QC_REVIEW')
          .orderBy('report_version', 'desc').executeTakeFirst();
        if (!qcDecision || qcDecision.actor_id === input.actor.id) throw new AppError('AUTHZ_DENIED', { userSafe: true });
      }
      authorize({ actor: input.actor, permission: permission as import('../../../shared/authorization/permissions.js').PermissionCode,
        action: input.action, entity: { type: 'REJECT_REPORT', id: input.id, state: current.status,
          ownerId: current.created_by, departmentId: current.department, shiftId: current.shift ?? undefined },
        scope: { ownerId: current.created_by, departmentId: current.department, shiftId: current.shift ?? undefined },
        currentVersion: BigInt(current.version), expectedVersion: input.expectedVersion, businessCondition: true },
      { throwOnDeny: true });
      const toState = transitionDailyRejectStatus(fromState, input.action);
      const now = new Date();
      let snapshot: unknown = null;
      let snapshotHash: string | null = null;
      if (input.action === 'SUPERVISOR_APPROVE') {
        const approved = await this.loadDaily(tx, input.id);
        if (!approved) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
        snapshot = JSON.parse(stableJson({ ...approved, status: toState, updatedBy: input.actor.id, updatedAt: now, version: input.expectedVersion + 1n }));
        snapshotHash = createHash('sha256').update(stableJson(snapshot)).digest('hex');
      }
      const updated = await tx.updateTable('reject_reports').set({ status: toState,
        updated_by: input.actor.id, updated_at: now, version: input.expectedVersion + 1n,
        ...(input.action === 'SUPERVISOR_APPROVE' ? { finalized_at: now } : {}),
      }).where('id', '=', input.id).where('version', '=', input.expectedVersion).returningAll().executeTakeFirst();
      if (!updated) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
      await tx.insertInto('daily_reject_review_events').values({
        report_id: input.id, action: input.action, from_state: fromState, to_state: toState,
        actor_id: input.actor.id, permission_code: permission, reason: input.reason ?? null,
        report_version: input.expectedVersion + 1n, idempotency_key: input.idempotencyKey,
        command_fingerprint: fingerprint, approved_snapshot: snapshot, snapshot_sha256: snapshotHash,
      }).execute();
      await this.auditFor(tx)?.append({ actorType: 'USER', actorId: input.actor.id,
        subjectType: 'REJECT_REPORT', subjectId: input.id, action: `DAILY_REJECT_${input.action}`,
        oldState: fromState, newState: toState, reason: input.reason, requestId: input.requestId,
        payload: { permission, reportVersion: String(input.expectedVersion + 1n), snapshotHash },
      });
      if (input.action === 'SUPERVISOR_APPROVE') await this.outboxFor(tx)?.enqueue({
        eventType: 'DAILY_REJECT_SUPERVISOR_APPROVED', aggregateType: 'REJECT_REPORT', aggregateId: input.id,
        payload: { reportNo: updated.report_no, snapshotHash, snapshot }, dedupeKey: `daily-reject-approved:${input.id}:${input.expectedVersion + 1n}`,
      });
      if (input.action === 'SUPERVISOR_APPROVE') {
        const sourceEvent = await tx.selectFrom('outbox_events').select('id')
          .where('dedupe_key', '=', `daily-reject-approved:${input.id}:${input.expectedVersion + 1n}`)
          .executeTakeFirst();
        if (sourceEvent) {
          await tx.insertInto('focus_compliance_entries').values({
            source_event_id: sourceEvent.id, report_id: input.id, status: 'PENDING_ENTRY',
            report_revision: input.expectedVersion + 1n, focus_entry_date: null,
            focus_entry_at: null, external_reference: null, reconciliation_state: 'NOT_RECONCILED',
            reported_qty: null, reported_lot: null, reported_report_number: null, reconciliation_note: null,
            entry_evidence_note: null, entry_evidence_file_id: null, entered_by: null, entered_at: null,
            verification_evidence_note: null, verification_evidence_file_id: null, verified_by: null, verified_at: null,
          }).onConflict((conflict) => conflict.column('source_event_id').doNothing()).execute();
          await tx.insertInto('event_delivery_statuses').values({
            source_event_id: sourceEvent.id, delivery_target: 'FOCUS_MANUAL', status: 'PENDING',
            source_event_reference: sourceEvent.id, evidence_note: null, evidence_file_id: null,
            recorded_by: input.actor.id,
          }).onConflict((conflict) => conflict.columns(['source_event_id', 'delivery_target', 'status']).doNothing()).execute();
        }
      }
      if (input.action === 'SUPERVISOR_APPROVE') {
        const configuredOwnerId = process.env.QC_SYSTEM_OWNER_USER_ID?.trim();
        const configuredOwner = configuredOwnerId ? await tx.selectFrom('users')
          .innerJoin('user_roles', 'user_roles.user_id', 'users.id')
          .innerJoin('roles', 'roles.id', 'user_roles.role_id')
          .select('users.id').where('users.id', '=', configuredOwnerId).where('users.account_state', '=', 'ACTIVE')
          .where('user_roles.revoked_at', 'is', null).where('roles.code', '=', 'SYSTEM_OWNER')
          .where('roles.active', '=', true).executeTakeFirst() : undefined;
        const ownerId = configuredOwner?.id;
        const effectiveAt = new Date(current.report_date);
        const entries = await tx.selectFrom('daily_reject_entries').selectAll()
          .where('report_id', '=', input.id).orderBy('position', 'asc').execute();
        for (const entry of entries) {
          const formulaOptions = [
            { id: PAPER_REJECT_PERCENTAGE_FORMULA.id, denominator: 'goodQty', unit: entry.rm_unit,
              rate: entry.reject_pct === null ? null : String(entry.reject_pct) },
            { id: PRODUCED_REJECT_PERCENTAGE_FORMULA.id, denominator: 'totalProducedQty', unit: entry.quantity_unit,
              rate: entry.operational_reject_pct === null ? null : String(entry.operational_reject_pct) },
          ];
          const matchableFormulaOptions = formulaOptions.filter((option) => option.rate !== null && option.unit);
          const profileRows = entry.item_code && matchableFormulaOptions.length
            ? await tx.selectFrom('reject_limit_profiles').selectAll()
                .where('item_code', '=', entry.item_code)
                .where('formula_id', 'in', formulaOptions.map((option) => option.id))
                .where('state', '=', 'ACTIVE')
                .where('effective_from', '<=', effectiveAt)
                .where((eb) => eb.or([eb('effective_to', 'is', null), eb('effective_to', '>', effectiveAt)]))
                // The report does not carry controlled line/site identities;
                // scoped profiles therefore cannot be selected from department text.
                .where('line', 'is', null).where('site', 'is', null)
                .where((eb) => eb.or([eb('shift', 'is', null), eb('shift', '=', current.shift)]))
                .where((eb) => eb.or(matchableFormulaOptions
                  .map((option) => eb.and([
                    eb('formula_id', '=', option.id), eb('denominator', '=', option.denominator), eb('unit', '=', option.unit!),
                  ]))))
                .execute()
            : [];
          const profile = profileRows.length === 1 ? profileRows[0] : undefined;
          const selectedFormula = profile ? formulaOptions.find((option) => option.id === profile.formula_id) : undefined;
          const availableFormulas = formulaOptions.filter((option) => option.rate !== null && option.unit);
          const fallbackFormula = !profile && profileRows.length === 0 && availableFormulas.length === 1
            ? availableFormulas[0] : undefined;
          const rate = selectedFormula?.rate ?? fallbackFormula?.rate ?? null;
          const formulaId = profile?.formula_id ?? fallbackFormula?.id ?? null;
          const decisionState = profile
            ? compareDecimalStrings(rate!, String(profile.limit_value)) > 0 ? 'ESCALATED' : 'BELOW_LIMIT'
            : profileRows.length > 1 ? 'CONFLICT' : 'REVIEW_REQUIRED';
          const persistedDecisionState = decisionState === 'ESCALATED' && (!ownerId || !this.approvals)
            ? 'REVIEW_REQUIRED' : decisionState;
          const snapshot = {
            reportId: input.id, reportNo: updated.report_no, reportVersion: String(input.expectedVersion + 1n),
            itemCode: entry.item_code, itemDescription: entry.item_description, lot: entry.lot_no,
            rate, formulaId, unit: selectedFormula?.unit ?? fallbackFormula?.unit ?? null,
            candidateRates: formulaOptions.map((option) => ({ formulaId: option.id, denominator: option.denominator,
              unit: option.unit, observedRate: option.rate })),
            profile: profile ? { id: profile.id, revision: profile.revision, limit: String(profile.limit_value),
              sourceFileName: profile.source_file_name, sourceFileDigest: profile.source_file_digest,
              baselinePeriodStart: profile.baseline_period_start, baselinePeriodEnd: profile.baseline_period_end } : null,
            resolution: persistedDecisionState,
          };
          const snapshotHash = createHash('sha256').update(stableJson(snapshot)).digest('hex');
          let approvalCaseId: string | null = null;
          if (decisionState === 'ESCALATED' && ownerId && this.approvals) {
            approvalCaseId = await this.approvals.createRejectThresholdRequest({ subjectId: entry.id,
              subjectVersion: BigInt(entry.version), requestedBy: input.actor.id, assignedUserId: ownerId,
              reportId: input.id, reportNo: updated.report_no, itemCode: entry.item_code ?? undefined,
              itemDescription: entry.item_description, lot: entry.lot_no ?? undefined, rate: rate!,
              threshold: String(profile!.limit_value), snapshotHash }, tx);
          }
          await tx.insertInto('daily_reject_threshold_decisions').values({
            report_id: input.id, report_version: input.expectedVersion + 1n, entry_id: entry.id,
            decision_state: persistedDecisionState,
            profile_id: profile?.id ?? null, observed_rate: rate, threshold_value: profile?.limit_value ?? null,
            formula_id: formulaId ?? null, source_file_digest: profile?.source_file_digest ?? null,
            approval_case_id: approvalCaseId, snapshot, snapshot_sha256: snapshotHash,
          }).execute();
          await tx.updateTable('daily_reject_entries').set({
            threshold_decision_state: persistedDecisionState,
            threshold_profile_id: profile?.id ?? null,
          }).where('id', '=', entry.id).execute();
        }
      }
      const result = await this.loadDaily(tx, input.id);
      if (!result) throw new AppError('SYSTEM_INTERNAL');
      return result;
    });
  }

  async resolveThresholdApproval(input: Parameters<RejectReportRepository['resolveThresholdApproval']>[0]) {
    const state = input.action === 'APPROVE' ? 'APPROVED' : input.action === 'REJECT' ? 'REJECTED' : 'RETURNED';
    const updated = await input.transaction.updateTable('daily_reject_threshold_decisions')
      .set({ approval_state: state, version: input.expectedVersion + 1n })
      .where('entry_id', '=', input.entryId).where('decision_state', '=', 'ESCALATED')
      .where('approval_state', '=', 'PENDING').where('version', '=', input.expectedVersion)
      .returning(['report_id', 'report_version', 'version']).executeTakeFirst();
    if (!updated) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
    await new PostgresAuditRepository(input.transaction).append({ actorType: 'USER', actorId: input.actor.id,
      subjectType: 'DAILY_REJECT_THRESHOLD', subjectId: input.entryId, action: `REJECT_THRESHOLD_${state}`,
      oldState: 'PENDING', newState: state, reason: input.reason, requestId: input.requestId,
      payload: { reportId: updated.report_id, reportVersion: String(updated.report_version) },
    });
    return { subjectId: input.entryId, version: BigInt(updated.version), state };
  }

  /** Non-destructive void; COMPLETED slips are rejected by the use case. */
  async voidReport(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    requestId: string;
    reason: string;
  }): Promise<IssueSlip | DailyReject> {
    try {
      return await this.database.transaction().execute(async (tx) => {
        const now = new Date();
        const current = await tx
          .selectFrom('reject_reports')
          .selectAll()
          .where('id', '=', input.id)
          .executeTakeFirst();
        if (!current) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
        const row = await this.bumpReport(tx, input.id, input.expectedVersion, input.actor, {
          status: 'VOID',
          voided_at: now,
          voided_by: input.actor.id,
          void_reason: input.reason,
        });
        await this.auditFor(tx)?.append({
          actorType: 'USER',
          actorId: input.actor.id,
          subjectType: 'REJECT_REPORT',
          subjectId: input.id,
          action: 'REJECT_REPORT_VOIDED',
          oldState: current.status,
          newState: 'VOID',
          reason: input.reason,
          requestId: input.requestId,
        });
        if (current.report_type === 'DAILY_REJECT') {
          const escalations = await tx.selectFrom('daily_reject_threshold_decisions')
            .select(['entry_id', 'approval_case_id', 'approval_state']).where('report_id', '=', input.id)
            .where('approval_case_id', 'is not', null).execute();
          for (const escalation of escalations) {
            if (!escalation.approval_case_id) continue;
            if (escalation.approval_state === 'PENDING') {
              if (!this.approvals) throw new AppError('SYSTEM_INTERNAL');
              await this.approvals.cancelPending({ approvalCaseId: escalation.approval_case_id,
                reportId: input.id, actor: input.actor, requestId: input.requestId, reason: input.reason }, tx);
              await tx.updateTable('daily_reject_threshold_decisions').set((eb) => ({ approval_state: 'CANCELLED',
                version: eb('version', '+', 1n) })).where('entry_id', '=', escalation.entry_id)
                .where('approval_state', '=', 'PENDING').execute();
            } else {
              // Preserve an already recorded approval decision. Link the later
              // report void as a separate audit event rather than rewriting it.
              await this.auditFor(tx as Transaction<DatabaseSchema>)?.append({ actorType: 'USER',
                actorId: input.actor.id, subjectType: 'DAILY_REJECT_THRESHOLD', subjectId: escalation.entry_id,
                action: 'REJECT_THRESHOLD_ESCALATION_INVALIDATED_BY_REPORT_VOID',
                oldState: escalation.approval_state, newState: escalation.approval_state,
                reason: input.reason, requestId: input.requestId,
                payload: { reportId: input.id, approvalCaseId: escalation.approval_case_id },
              });
            }
          }
        }
        await this.outboxFor(tx)?.enqueue({
          eventType: 'REJECT_REPORT_VOIDED',
          aggregateType: 'REJECT_REPORT',
          aggregateId: input.id,
          payload: { reportNo: row.report_no },
          dedupeKey: `reject-report-voided:${input.id}`,
        });
        const updated =
          current.report_type === 'ISSUE_SLIP'
            ? await this.loadSlip(tx, input.id)
            : await this.loadDaily(tx, input.id);
        if (!updated) throw new AppError('SYSTEM_INTERNAL');
        return updated;
      });
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  async summary(now: Date, filter: RejectReportListFilter = {}): Promise<RejectReportSummary> {
    const day = reportNoDateKey(now);
    const today = `${day.slice(0, 4)}-${day.slice(4, 6)}-${day.slice(6, 8)}`;
    const monthStart = `${day.slice(0, 4)}-${day.slice(4, 6)}-01`;
    const filtered = sql`WITH filtered_reports AS (
      SELECT r.* FROM qc.reject_reports r
      WHERE ${filter.status === 'VOID' ? sql`TRUE` : sql`r.status <> 'VOID'`}
        AND ${reportFilterSql(filter)}
        AND (r.report_type <> 'DAILY_REJECT' OR r.status = 'SUPERVISOR_APPROVED')
    )`;
    const counts = await sql<{
      reports_today: string;
      reports_this_month: string;
      total_issue_slips: string;
      total_daily_rejects: string;
      awaiting_approvals: string;
      completed_issue_slips: string;
      supervisor_approved_daily_rejects: string;
    }>`
      ${filtered}
      SELECT
        COUNT(*) FILTER (WHERE report_date = ${today}::date) AS reports_today,
        COUNT(*) FILTER (WHERE report_date >= ${monthStart}::date) AS reports_this_month,
        COUNT(*) FILTER (WHERE report_type = 'ISSUE_SLIP') AS total_issue_slips,
        COUNT(*) FILTER (WHERE report_type = 'DAILY_REJECT' AND status = 'SUPERVISOR_APPROVED') AS total_daily_rejects,
        COUNT(*) FILTER (WHERE report_type = 'ISSUE_SLIP' AND status IN ('ISSUED', 'APPROVAL_TRACKING')) AS awaiting_approvals,
        COUNT(*) FILTER (WHERE report_type = 'ISSUE_SLIP' AND status = 'COMPLETED') AS completed_issue_slips,
        COUNT(*) FILTER (WHERE report_type = 'DAILY_REJECT' AND status = 'SUPERVISOR_APPROVED') AS supervisor_approved_daily_rejects
      FROM filtered_reports r
    `.execute(this.database);
    const quantities = await sql<{
      report_type: 'ISSUE_SLIP' | 'DAILY_REJECT';
      unit: string;
      rejected_qty: string;
      report_count: string;
    }>`
      ${filtered}
      SELECT combined.report_type, combined.unit, combined.rejected_qty, combined.report_count
      FROM (
        SELECT 'ISSUE_SLIP'::text AS report_type,
          COALESCE(NULLIF(BTRIM(s.unit), ''), 'Unit not recorded') AS unit,
          SUM(s.rejected_qty)::text AS rejected_qty,
          COUNT(DISTINCT r.id)::text AS report_count
        FROM filtered_reports r
        JOIN qc.reject_issue_slips s ON s.report_id = r.id AND ${detailRowFilterSql(filter, 'ISSUE_SLIP')}
        GROUP BY COALESCE(NULLIF(BTRIM(s.unit), ''), 'Unit not recorded')
        UNION ALL
        SELECT 'DAILY_REJECT'::text AS report_type,
          COALESCE(NULLIF(BTRIM(e.rm_unit), ''), 'Unit not recorded') AS unit,
          SUM(e.reject_qty)::text AS rejected_qty,
          COUNT(DISTINCT r.id)::text AS report_count
        FROM filtered_reports r
        JOIN qc.daily_reject_entries e ON e.report_id = r.id AND ${detailRowFilterSql(filter, 'DAILY_REJECT')}
        GROUP BY COALESCE(NULLIF(BTRIM(e.rm_unit), ''), 'Unit not recorded')
      ) AS combined
      ORDER BY combined.report_type, combined.unit
    `.execute(this.database);
    const row = counts.rows[0];
    return {
      reportsToday: Number(row?.reports_today ?? 0),
      reportsThisMonth: Number(row?.reports_this_month ?? 0),
      rejectedByUnit: quantities.rows.map((quantity) => ({
        reportType: quantity.report_type,
        unit: quantity.unit,
        rejectedQty: quantity.rejected_qty,
        reportCount: Number(quantity.report_count),
      })),
      totalIssueSlips: Number(row?.total_issue_slips ?? 0),
      totalDailyRejects: Number(row?.total_daily_rejects ?? 0),
      awaitingApprovals: Number(row?.awaiting_approvals ?? 0),
      completedIssueSlips: Number(row?.completed_issue_slips ?? 0),
      supervisorApprovedDailyRejects: Number(row?.supervisor_approved_daily_rejects ?? 0),
    };
  }

  async analytics(input: {
    filter?: RejectReportListFilter;
    from?: Date;
    to?: Date;
  }): Promise<RejectReportAnalytics> {
    const filter = input.filter ?? { from: input.from, to: input.to };
    const filtered = sql`WITH filtered_reports AS (
      SELECT r.* FROM qc.reject_reports r
      WHERE ${filter.status === 'VOID' ? sql`TRUE` : sql`r.status <> 'VOID'`}
        AND (r.report_type <> 'DAILY_REJECT' OR r.status = 'SUPERVISOR_APPROVED')
        AND ${reportFilterSql(filter)}
    )`;
    const [trend, byItem, byDepartment, byReason, approvalStatus, pctTrend] = await Promise.all([
      sql<{
        date: string;
        report_type: 'ISSUE_SLIP' | 'DAILY_REJECT';
        unit: string;
        rejected_qty: string;
        report_count: string;
      }>`
        ${filtered}
        SELECT combined.date, combined.report_type, combined.unit,
          combined.rejected_qty, combined.report_count
        FROM (
          SELECT r.report_date::text AS date, 'ISSUE_SLIP'::text AS report_type,
            COALESCE(NULLIF(BTRIM(s.unit), ''), 'Unit not recorded') AS unit,
            SUM(s.rejected_qty)::text AS rejected_qty, COUNT(DISTINCT r.id)::text AS report_count
          FROM filtered_reports r
          JOIN qc.reject_issue_slips s ON s.report_id = r.id AND ${detailRowFilterSql(filter, 'ISSUE_SLIP')}
          GROUP BY r.report_date, COALESCE(NULLIF(BTRIM(s.unit), ''), 'Unit not recorded')
          UNION ALL
          SELECT r.report_date::text AS date, 'DAILY_REJECT'::text AS report_type,
            COALESCE(NULLIF(BTRIM(e.rm_unit), ''), 'Unit not recorded') AS unit,
            SUM(e.reject_qty)::text AS rejected_qty, COUNT(DISTINCT r.id)::text AS report_count
          FROM filtered_reports r
          JOIN qc.daily_reject_entries e ON e.report_id = r.id AND ${detailRowFilterSql(filter, 'DAILY_REJECT')}
          GROUP BY r.report_date, COALESCE(NULLIF(BTRIM(e.rm_unit), ''), 'Unit not recorded')
        ) AS combined
        ORDER BY combined.date, combined.report_type, combined.unit
      `.execute(this.database),
      sql<{
        report_type: 'ISSUE_SLIP' | 'DAILY_REJECT';
        unit: string;
        item_code: string;
        item_name: string;
        rejected_qty: string;
      }>`
        ${filtered}
        SELECT combined.* FROM (
          SELECT 'ISSUE_SLIP'::text AS report_type,
            COALESCE(NULLIF(BTRIM(s.unit), ''), 'Unit not recorded') AS unit,
            s.item_code, s.item_name, SUM(s.rejected_qty)::text AS rejected_qty
          FROM filtered_reports r JOIN qc.reject_issue_slips s ON s.report_id = r.id AND ${detailRowFilterSql(filter, 'ISSUE_SLIP')}
          GROUP BY COALESCE(NULLIF(BTRIM(s.unit), ''), 'Unit not recorded'), s.item_code, s.item_name
          UNION ALL
          SELECT 'DAILY_REJECT'::text AS report_type,
            COALESCE(NULLIF(BTRIM(e.rm_unit), ''), 'Unit not recorded') AS unit,
            COALESCE(e.item_code, '—') AS item_code, e.item_description AS item_name,
            SUM(e.reject_qty)::text AS rejected_qty
          FROM filtered_reports r JOIN qc.daily_reject_entries e ON e.report_id = r.id AND ${detailRowFilterSql(filter, 'DAILY_REJECT')}
          GROUP BY COALESCE(NULLIF(BTRIM(e.rm_unit), ''), 'Unit not recorded'), e.item_code, e.item_description
        ) AS combined
        ORDER BY combined.rejected_qty::numeric DESC, combined.report_type, combined.unit, combined.item_code, combined.item_name
        LIMIT 25
      `.execute(this.database),
      sql<{
        report_type: 'ISSUE_SLIP' | 'DAILY_REJECT';
        unit: string;
        department: string;
        rejected_qty: string;
        report_count: string;
      }>`
        ${filtered}
        SELECT combined.report_type, combined.unit, combined.department,
          combined.rejected_qty, combined.report_count
        FROM (
          SELECT 'ISSUE_SLIP'::text AS report_type,
            COALESCE(NULLIF(BTRIM(s.unit), ''), 'Unit not recorded') AS unit,
            r.department, SUM(s.rejected_qty)::text AS rejected_qty, COUNT(DISTINCT r.id)::text AS report_count
          FROM filtered_reports r JOIN qc.reject_issue_slips s ON s.report_id = r.id AND ${detailRowFilterSql(filter, 'ISSUE_SLIP')}
          GROUP BY COALESCE(NULLIF(BTRIM(s.unit), ''), 'Unit not recorded'), r.department
          UNION ALL
          SELECT 'DAILY_REJECT'::text AS report_type,
            COALESCE(NULLIF(BTRIM(e.rm_unit), ''), 'Unit not recorded') AS unit,
            r.department, SUM(e.reject_qty)::text AS rejected_qty, COUNT(DISTINCT r.id)::text AS report_count
          FROM filtered_reports r JOIN qc.daily_reject_entries e ON e.report_id = r.id AND ${detailRowFilterSql(filter, 'DAILY_REJECT')}
          GROUP BY COALESCE(NULLIF(BTRIM(e.rm_unit), ''), 'Unit not recorded'), r.department
        ) AS combined
        ORDER BY combined.report_type, combined.unit, combined.department
      `.execute(this.database),
      sql<{ report_type: 'ISSUE_SLIP' | 'DAILY_REJECT'; reason: string; count: string }>`
        ${filtered}
        SELECT combined.* FROM (
          SELECT 'ISSUE_SLIP'::text AS report_type, s.reject_reason AS reason, COUNT(*)::text AS count
          FROM filtered_reports r JOIN qc.reject_issue_slips s ON s.report_id = r.id AND ${detailRowFilterSql(filter, 'ISSUE_SLIP')}
          GROUP BY s.reject_reason
          UNION ALL
          SELECT 'DAILY_REJECT'::text AS report_type, e.reject_reason AS reason, COUNT(*)::text AS count
          FROM filtered_reports r JOIN qc.daily_reject_entries e ON e.report_id = r.id AND ${detailRowFilterSql(filter, 'DAILY_REJECT')}
          GROUP BY e.reject_reason
        ) AS combined
        ORDER BY combined.count::numeric DESC, combined.report_type, combined.reason
        LIMIT 25
      `.execute(this.database),
      sql<{ pending: string; completed: string }>`
        ${filtered}
        SELECT
          COUNT(*) FILTER (WHERE a.status IN ('PENDING', 'REVERSED'))::text AS pending,
          COUNT(*) FILTER (WHERE a.status = 'CONFIRMED')::text AS completed
        FROM filtered_reports r
        JOIN qc.issue_slip_approval_confirmations a ON a.report_id = r.id
      `.execute(this.database),
      sql<{ date: string; unit: string; reject_pct: string | null; numerator: string; denominator: string }>`
        ${filtered}
        SELECT r.report_date::text AS date,
          COALESCE(NULLIF(BTRIM(e.rm_unit), ''), 'Unit not recorded') AS unit,
          SUM(e.reject_qty)::text AS numerator,
          SUM(e.good_qty)::text AS denominator,
          CASE WHEN SUM(e.good_qty) > 0
            THEN ROUND(SUM(e.reject_qty) / SUM(e.good_qty) * 100, 4)::text
            ELSE NULL::text END AS reject_pct
        FROM filtered_reports r JOIN qc.daily_reject_entries e ON e.report_id = r.id AND ${detailRowFilterSql(filter, 'DAILY_REJECT')}
        GROUP BY r.report_date, COALESCE(NULLIF(BTRIM(e.rm_unit), ''), 'Unit not recorded')
        ORDER BY r.report_date, unit
      `.execute(this.database),
    ]);
    const items = byItem.rows.map((row) => ({
      reportType: row.report_type,
      unit: row.unit,
      itemCode: row.item_code,
      itemName: row.item_name,
      rejectedQty: row.rejected_qty,
    }));
    return {
      trendByDate: trend.rows.map((row) => ({
        date: row.date,
        reportType: row.report_type,
        unit: row.unit,
        rejectedQty: row.rejected_qty,
        reportCount: Number(row.report_count),
      })),
      byItem: items,
      byDepartment: byDepartment.rows.map((row) => ({
        reportType: row.report_type,
        unit: row.unit,
        department: row.department,
        rejectedQty: row.rejected_qty,
        reportCount: Number(row.report_count),
      })),
      byReason: byReason.rows.map((row) => ({
        reportType: row.report_type,
        reason: row.reason,
        count: Number(row.count),
      })),
      topRejectItems: items.slice(0, 10),
      approvalStatus: approvalStatus.rows.map((row) => ({
        pending: Number(row.pending),
        completed: Number(row.completed),
      })),
      rejectPctTrend: pctTrend.rows.map((row) => ({
        date: row.date,
        unit: row.unit,
        rejectPct: row.reject_pct,
        numerator: row.numerator,
        denominator: row.denominator,
      })),
    };
  }

  async recent(
    limit: number,
    filter: RejectReportListFilter = {},
  ): Promise<readonly (IssueSlip | DailyReject)[]> {
    const predicate = reportFilterSql(filter);
    const rows = await sql<{ id: string; report_type: 'ISSUE_SLIP' | 'DAILY_REJECT' }>`
      SELECT r.id, r.report_type FROM qc.reject_reports r
      WHERE ${predicate}
      ORDER BY r.created_at DESC
      LIMIT ${Math.min(50, Math.max(1, limit))}
    `.execute(this.database);
    const items = await Promise.all(
      rows.rows.map((row) =>
        row.report_type === 'ISSUE_SLIP'
          ? this.loadSlip(this.database, row.id)
          : this.loadDaily(this.database, row.id),
      ),
    );
    return items.filter((item): item is IssueSlip | DailyReject => Boolean(item));
  }
}
