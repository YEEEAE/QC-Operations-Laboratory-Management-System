import type { Kysely, Transaction } from 'kysely';
import { sql } from 'kysely';
import type { DatabaseSchema, DatabaseRow } from '../../../shared/database/db-types.js';
import { translateDatabaseError } from '../../../shared/database/database.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import type { AuditRepository } from '../../../shared/audit/audit-repository.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import type { OutboxRepository } from '../../../shared/outbox/outbox-repository.js';
import { PostgresOutboxRepository } from '../../../shared/outbox/postgres-outbox-repository.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { Page } from '../../../shared/pagination/page.js';
import { formatReportNo, reportNoDateKey, reportNoPrefix } from '../domain/report-number.js';
import { computeRejectPercent } from '../domain/reject-percentage.js';
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
  if (filter.itemCode || filter.itemName || filter.lot || filter.search) {
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
      return hasExact
        ? sql`(${exists(sql`TRUE ${exact}`)} AND (${filter.search ? sql`r.report_no ILIKE ${`%${filter.search}%`} OR ${exists(sql`${search}`)}` : sql`TRUE`}))`
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
  return where;
}

function mapApproval(row: ApprovalRow): ApprovalConfirmation {
  return {
    id: row.id,
    reportId: row.report_id,
    role: row.approval_role as ApprovalConfirmation['role'],
    status: row.status as ApprovalConfirmation['status'],
    approverName: row.approver_name ?? undefined,
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

function mapSlip(report: ReportRow, slip: SlipRow, approvals: readonly ApprovalRow[]): IssueSlip {
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
    rejectLimit: row.reject_limit === null ? undefined : String(row.reject_limit),
    productionFormula: row.production_formula ?? undefined,
    rejectReason: row.reject_reason,
    analysis: row.analysis ?? undefined,
    version: BigInt(row.version),
  };
}

function mapDaily(report: ReportRow, entries: readonly EntryRow[]): DailyReject {
  return {
    id: report.id,
    reportNo: report.report_no,
    reportDate: report.report_date,
    department: report.department,
    shift: report.shift ?? undefined,
    status: report.status as DailyReject['status'],
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
            ('daily_reject_entries', 'reject_limit'), ('daily_reject_entries', 'production_formula'),
            ('daily_reject_entries', 'reject_reason'), ('daily_reject_entries', 'analysis'),
            ('daily_reject_entries', 'version')
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
            ('issue_slip_approval_confirmations', 'fk_issue_slip_approvals__reversed_by'),
            ('issue_slip_approval_confirmations', 'fk_issue_slip_approvals__evidence_file'),
            ('daily_reject_entries', 'uq_daily_reject_entries__report_position'),
            ('daily_reject_entries', 'fk_daily_reject_entries__report_id')
        ), expected_tables (table_name) AS (
          VALUES
            ('reject_reports'), ('reject_issue_slips'),
            ('issue_slip_approval_confirmations'), ('daily_reject_entries')
        )
        SELECT (
          EXISTS (
            SELECT 1 FROM qc.schema_migrations
            WHERE version = '0026' AND name = '0026_reject_reports'
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
    const [slip, approvals] = await Promise.all([
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
    ]);
    return mapSlip(report, slip, approvals);
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
    return mapDaily(report, entries);
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
        const updated = await this.loadSlip(tx, input.id);
        if (!updated) throw new AppError('SYSTEM_INTERNAL');
        return updated;
      });
    } catch (error) {
      throw translateDatabaseError(error);
    }
  }

  /**
   * Records one creator confirmation. If it is the last pending checkpoint,
   * the report completes in the same transaction (ISSUE_SLIP_COMPLETED).
   * Duplicate confirmations hit the row status guard (PENDING only).
   */
  async confirmApproval(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    requestId: string;
    role: IssueSlipApprovalRole;
    approverName?: string;
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

        const report = await this.bumpReport(tx, input.id, input.expectedVersion, input.actor, {});
        await this.auditFor(tx)?.append({
          actorType: 'USER',
          actorId: input.actor.id,
          subjectType: 'REJECT_REPORT',
          subjectId: input.id,
          action: 'ISSUE_SLIP_APPROVAL_CONFIRMED',
          requestId: input.requestId,
          payload: {
            approvalRole: input.role,
            approverName: input.approverName ?? null,
            semantics: 'CREATOR_RECORDED_CONFIRMATION',
          },
        });

        const pending = await tx
          .selectFrom('issue_slip_approval_confirmations')
          .select(({ fn }) => fn.countAll().as('count'))
          .where('report_id', '=', input.id)
          .where('status', '=', 'PENDING')
          .executeTakeFirstOrThrow();
        if (Number(pending.count) === 0) {
          await tx
            .updateTable('reject_reports')
            .set({
              status: 'COMPLETED',
              completed_at: now,
              updated_by: input.actor.id,
              updated_at: now,
              version: sql`version + 1`,
            } as never)
            .where('id', '=', input.id)
            .execute();
          await this.auditFor(tx)?.append({
            actorType: 'USER',
            actorId: input.actor.id,
            subjectType: 'REJECT_REPORT',
            subjectId: input.id,
            action: 'ISSUE_SLIP_COMPLETED',
            oldState: 'APPROVAL_TRACKING',
            newState: 'COMPLETED',
            requestId: input.requestId,
          });
          await this.outboxFor(tx)?.enqueue({
            eventType: 'ISSUE_SLIP_COMPLETED',
            aggregateType: 'REJECT_REPORT',
            aggregateId: input.id,
            payload: { reportNo: report.report_no },
            dedupeKey: `issue-slip-completed:${input.id}`,
          });
        }
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

  async finalizeDailyReject(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    requestId: string;
  }): Promise<DailyReject> {
    try {
      return await this.database.transaction().execute(async (tx) => {
        const now = new Date();
        const row = await this.bumpReport(tx, input.id, input.expectedVersion, input.actor, {
          status: 'FINALIZED',
          finalized_at: now,
        });
        await this.auditFor(tx)?.append({
          actorType: 'USER',
          actorId: input.actor.id,
          subjectType: 'REJECT_REPORT',
          subjectId: input.id,
          action: 'DAILY_REJECT_FINALIZED',
          oldState: 'DRAFT',
          newState: 'FINALIZED',
          requestId: input.requestId,
        });
        await this.outboxFor(tx)?.enqueue({
          eventType: 'DAILY_REJECT_FINALIZED',
          aggregateType: 'REJECT_REPORT',
          aggregateId: input.id,
          payload: { reportNo: row.report_no },
          dedupeKey: `daily-reject-finalized:${input.id}`,
        });
        const updated = await this.loadDaily(tx, input.id);
        if (!updated) throw new AppError('SYSTEM_INTERNAL');
        return updated;
      });
    } catch (error) {
      throw translateDatabaseError(error);
    }
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
    )`;
    const counts = await sql<{
      reports_today: string;
      reports_this_month: string;
      total_issue_slips: string;
      total_daily_rejects: string;
      awaiting_approvals: string;
      completed_issue_slips: string;
      finalized_daily_rejects: string;
    }>`
      ${filtered}
      SELECT
        COUNT(*) FILTER (WHERE report_date = ${today}::date) AS reports_today,
        COUNT(*) FILTER (WHERE report_date >= ${monthStart}::date) AS reports_this_month,
        COUNT(*) FILTER (WHERE report_type = 'ISSUE_SLIP') AS total_issue_slips,
        COUNT(*) FILTER (WHERE report_type = 'DAILY_REJECT') AS total_daily_rejects,
        COUNT(*) FILTER (WHERE report_type = 'ISSUE_SLIP' AND status IN ('ISSUED', 'APPROVAL_TRACKING')) AS awaiting_approvals,
        COUNT(*) FILTER (WHERE report_type = 'ISSUE_SLIP' AND status = 'COMPLETED') AS completed_issue_slips,
        COUNT(*) FILTER (WHERE report_type = 'DAILY_REJECT' AND status = 'FINALIZED') AS finalized_daily_rejects
      FROM filtered_reports r
    `.execute(this.database);
    const quantities = await sql<{
      report_type: 'ISSUE_SLIP' | 'DAILY_REJECT';
      unit: string;
      rejected_qty: string;
      report_count: string;
    }>`
      ${filtered}
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
      ORDER BY report_type, unit
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
      finalizedDailyRejects: Number(row?.finalized_daily_rejects ?? 0),
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
        ORDER BY date, report_type, unit
      `.execute(this.database),
      sql<{
        report_type: 'ISSUE_SLIP' | 'DAILY_REJECT';
        unit: string;
        item_code: string;
        item_name: string;
        rejected_qty: string;
      }>`
        ${filtered}
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
        ORDER BY rejected_qty::numeric DESC, report_type, unit, item_code, item_name
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
        ORDER BY report_type, unit, department
      `.execute(this.database),
      sql<{ report_type: 'ISSUE_SLIP' | 'DAILY_REJECT'; reason: string; count: string }>`
        ${filtered}
        SELECT 'ISSUE_SLIP'::text AS report_type, s.reject_reason AS reason, COUNT(*)::text AS count
        FROM filtered_reports r JOIN qc.reject_issue_slips s ON s.report_id = r.id AND ${detailRowFilterSql(filter, 'ISSUE_SLIP')}
        GROUP BY s.reject_reason
        UNION ALL
        SELECT 'DAILY_REJECT'::text AS report_type, e.reject_reason AS reason, COUNT(*)::text AS count
        FROM filtered_reports r JOIN qc.daily_reject_entries e ON e.report_id = r.id AND ${detailRowFilterSql(filter, 'DAILY_REJECT')}
        GROUP BY e.reject_reason
        ORDER BY count::numeric DESC, report_type, reason
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
      sql<{ date: string; unit: string; reject_pct: string | null }>`
        ${filtered}
        SELECT r.report_date::text AS date,
          COALESCE(NULLIF(BTRIM(e.rm_unit), ''), 'Unit not recorded') AS unit,
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
