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
    rejectPct: row.reject_pct === null ? null : Number(row.reject_pct),
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
  const rejectPct = computeRejectPercent(Number(entry.rejectQty), Number(entry.goodQty));
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
   * Read-only capability probe for the four tables migration `0026` adds.
   * `to_regclass` is a catalog lookup: it never touches the tables themselves
   * and never writes. A missing table is reported as `SCHEMA_NOT_READY` so the
   * page can fail closed with an honest availability state instead of a raw
   * database error (QC-100-FINAL-016 P1-4).
   */
  async availability(): Promise<RejectReportAvailability> {
    try {
      const result = await sql<{ ready: boolean }>`
        SELECT (
          to_regclass('qc.reject_reports') IS NOT NULL
          AND to_regclass('qc.reject_issue_slips') IS NOT NULL
          AND to_regclass('qc.issue_slip_approval_confirmations') IS NOT NULL
          AND to_regclass('qc.daily_reject_entries') IS NOT NULL
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
    const base = () =>
      this.database
        .selectFrom('reject_reports as r')
        .innerJoin('reject_issue_slips as s', 's.report_id', 'r.id');
    const applyFilter = (query: ReturnType<typeof base>, f: RejectReportListFilter) => {
      let q = query.where('r.report_type', '=', 'ISSUE_SLIP');
      if (f.status) q = q.where('r.status', '=', f.status);
      if (f.from) q = q.where('r.report_date', '>=', f.from);
      if (f.to) q = q.where('r.report_date', '<=', f.to);
      if (f.department) q = q.where('r.department', '=', f.department);
      if (f.createdBy && isUuid(f.createdBy)) q = q.where('r.created_by', '=', f.createdBy);
      if (f.itemCode) q = q.where('s.item_code', 'ilike', `%${f.itemCode}%`);
      if (f.itemName) q = q.where('s.item_name', 'ilike', `%${f.itemName}%`);
      if (f.lot) q = q.where('s.lot_no', 'ilike', `%${f.lot}%`);
      if (f.approvalState === 'AWAITING')
        q = q.where('r.status', 'in', ['ISSUED', 'APPROVAL_TRACKING']);
      if (f.approvalState === 'COMPLETED') q = q.where('r.status', '=', 'COMPLETED');
      if (f.search)
        q = q.where((eb) =>
          eb.or([
            eb('r.report_no', 'ilike', `%${f.search}%`),
            eb('s.item_code', 'ilike', `%${f.search}%`),
            eb('s.item_name', 'ilike', `%${f.search}%`),
            eb('s.lot_no', 'ilike', `%${f.search}%`),
            eb('s.reject_reason', 'ilike', `%${f.search}%`),
          ]),
        );
      return q;
    };
    const countRow = await applyFilter(base(), input.filter)
      .select(({ fn }) => fn.countAll().as('count'))
      .executeTakeFirst();
    const rows = await applyFilter(base(), input.filter)
      .select(['r.id'])
      .orderBy('r.report_date', 'desc')
      .orderBy('r.report_no', 'desc')
      .limit(input.page.pageSize)
      .offset(input.page.offset)
      .execute();
    const items = await Promise.all(
      rows.map((row: { id: string }) => this.loadSlip(this.database, row.id)),
    );
    return {
      items: items.filter((item): item is IssueSlip => Boolean(item)),
      total: Number((countRow as { count?: unknown } | undefined)?.count ?? 0),
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
    const base = () => this.database.selectFrom('reject_reports as r');
    const applyFilter = (query: ReturnType<typeof base>, f: RejectReportListFilter) => {
      let q = query.where('r.report_type', '=', 'DAILY_REJECT');
      if (f.status) q = q.where('r.status', '=', f.status);
      if (f.from) q = q.where('r.report_date', '>=', f.from);
      if (f.to) q = q.where('r.report_date', '<=', f.to);
      if (f.department) q = q.where('r.department', '=', f.department);
      if (f.createdBy && isUuid(f.createdBy)) q = q.where('r.created_by', '=', f.createdBy);
      if (f.itemCode || f.itemName || f.lot || f.search) {
        // Detail filters live on the entry rows, so they become a correlated
        // EXISTS on the parent report — a report matches when one of its
        // entries matches the supplied detail filters.
        q = q.where((eb) =>
          eb.exists(
            eb
              .selectFrom('daily_reject_entries as e')
              .select(sql`1`.as('one'))
              .whereRef('e.report_id', '=', 'r.id')
              .where((inner) =>
                inner.or([
                  ...(f.itemCode ? [inner('e.item_code', 'ilike', `%${f.itemCode}%`)] : []),
                  ...(f.itemName ? [inner('e.item_description', 'ilike', `%${f.itemName}%`)] : []),
                  ...(f.lot ? [inner('e.lot_no', 'ilike', `%${f.lot}%`)] : []),
                  ...(f.search
                    ? [
                        inner('e.item_code', 'ilike', `%${f.search}%`),
                        inner('e.item_description', 'ilike', `%${f.search}%`),
                        inner('e.lot_no', 'ilike', `%${f.search}%`),
                        inner('e.reject_reason', 'ilike', `%${f.search}%`),
                      ]
                    : []),
                ]),
              ),
          ),
        );
        if (f.search)
          q = q.where((eb) =>
            eb.or([
              eb('r.report_no', 'ilike', `%${f.search}%`),
              eb.exists(
                eb
                  .selectFrom('daily_reject_entries as e')
                  .select(sql`1`.as('one'))
                  .whereRef('e.report_id', '=', 'r.id'),
              ),
            ]),
          );
      }
      return q;
    };
    const countRow = await applyFilter(base(), input.filter)
      .select(({ fn }) => fn.countAll().as('count'))
      .executeTakeFirst();
    const rows = await applyFilter(base(), input.filter)
      .select(['r.id'])
      .orderBy('r.report_date', 'desc')
      .orderBy('r.report_no', 'desc')
      .limit(input.page.pageSize)
      .offset(input.page.offset)
      .execute();
    const items = await Promise.all(
      rows.map((row: { id: string }) => this.loadDaily(this.database, row.id)),
    );
    return {
      items: items.filter((item): item is DailyReject => Boolean(item)),
      total: Number((countRow as { count?: unknown } | undefined)?.count ?? 0),
    };
  }

  /** Draft entries are replaced as a set: delete + re-insert with fresh positions. */
  async updateDailyRejectDraft(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    requestId: string;
    reportDate: Date;
    department: string;
    shift?: string;
    entries: readonly DailyRejectEntryInput[];
  }): Promise<DailyReject> {
    try {
      return await this.database.transaction().execute(async (tx) => {
        await this.bumpReport(tx, input.id, input.expectedVersion, input.actor, {
          report_date: input.reportDate,
          department: input.department,
          shift: input.shift ?? null,
        });
        await tx.deleteFrom('daily_reject_entries').where('report_id', '=', input.id).execute();
        if (input.entries.length)
          await tx
            .insertInto('daily_reject_entries')
            .values(input.entries.map((entry, index) => entryValues(input.id, entry, index + 1)))
            .execute();
        await this.auditFor(tx)?.append({
          actorType: 'USER',
          actorId: input.actor.id,
          subjectType: 'REJECT_REPORT',
          subjectId: input.id,
          action: 'REJECT_REPORT_UPDATED',
          requestId: input.requestId,
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

  async summary(now: Date): Promise<RejectReportSummary> {
    const day = reportNoDateKey(now);
    const today = `${day.slice(0, 4)}-${day.slice(4, 6)}-${day.slice(6, 8)}`;
    const monthStart = `${day.slice(0, 4)}-${day.slice(4, 6)}-01`;
    const counts = await sql<{
      reports_today: string;
      reports_this_month: string;
      total_issue_slips: string;
      total_daily_rejects: string;
      awaiting_approvals: string;
      completed_issue_slips: string;
      finalized_daily_rejects: string;
    }>`
      SELECT
        COUNT(*) FILTER (WHERE report_date = ${today}::date) AS reports_today,
        COUNT(*) FILTER (WHERE report_date >= ${monthStart}::date) AS reports_this_month,
        COUNT(*) FILTER (WHERE report_type = 'ISSUE_SLIP') AS total_issue_slips,
        COUNT(*) FILTER (WHERE report_type = 'DAILY_REJECT') AS total_daily_rejects,
        COUNT(*) FILTER (WHERE report_type = 'ISSUE_SLIP' AND status IN ('ISSUED', 'APPROVAL_TRACKING')) AS awaiting_approvals,
        COUNT(*) FILTER (WHERE report_type = 'ISSUE_SLIP' AND status = 'COMPLETED') AS completed_issue_slips,
        COUNT(*) FILTER (WHERE report_type = 'DAILY_REJECT' AND status = 'FINALIZED') AS finalized_daily_rejects
      FROM qc.reject_reports
      WHERE status <> 'VOID'
    `.execute(this.database);
    const qty = await sql<{ total: string | null }>`
      SELECT (
        SELECT COALESCE(SUM(s.rejected_qty), 0)
        FROM qc.reject_issue_slips s
        JOIN qc.reject_reports r ON r.id = s.report_id AND r.status <> 'VOID'
      ) + (
        SELECT COALESCE(SUM(e.reject_qty), 0)
        FROM qc.daily_reject_entries e
        JOIN qc.reject_reports r ON r.id = e.report_id AND r.status <> 'VOID'
      ) AS total
    `.execute(this.database);
    const row = counts.rows[0];
    return {
      reportsToday: Number(row?.reports_today ?? 0),
      reportsThisMonth: Number(row?.reports_this_month ?? 0),
      totalRejectedQuantity: Number(qty.rows[0]?.total ?? 0),
      totalIssueSlips: Number(row?.total_issue_slips ?? 0),
      totalDailyRejects: Number(row?.total_daily_rejects ?? 0),
      awaitingApprovals: Number(row?.awaiting_approvals ?? 0),
      completedIssueSlips: Number(row?.completed_issue_slips ?? 0),
      finalizedDailyRejects: Number(row?.finalized_daily_rejects ?? 0),
    };
  }

  async analytics(input: { from?: Date; to?: Date }): Promise<RejectReportAnalytics> {
    const bounds = (alias: string) => {
      const fromClause = input.from
        ? sql`AND ${sql.ref(alias)}.report_date >= ${input.from}`
        : sql``;
      const toClause = input.to ? sql`AND ${sql.ref(alias)}.report_date <= ${input.to}` : sql``;
      return sql`${fromClause} ${toClause}`;
    };
    const b = bounds('r');
    const [trend, byItem, byDepartment, byReason, topItems, approvalStatus, pctTrend] =
      await Promise.all([
        sql<{ date: string; rejected_qty: string; report_count: string }>`
          SELECT r.report_date::text AS date,
            (
              SELECT COALESCE(SUM(s.rejected_qty), 0)
              FROM qc.reject_issue_slips s WHERE s.report_id = r.id
            ) + (
              SELECT COALESCE(SUM(e.reject_qty), 0)
              FROM qc.daily_reject_entries e WHERE e.report_id = r.id
            ) AS rejected_qty,
            COUNT(*) OVER () AS report_count
          FROM qc.reject_reports r
          WHERE r.status <> 'VOID' ${b}
          ORDER BY r.report_date
        `.execute(this.database),
        sql<{ item_code: string; item_name: string; rejected_qty: string }>`
          SELECT s.item_code, s.item_name, SUM(s.rejected_qty) AS rejected_qty
          FROM qc.reject_issue_slips s
          JOIN qc.reject_reports r ON r.id = s.report_id AND r.status <> 'VOID' ${b}
          GROUP BY s.item_code, s.item_name
          ORDER BY rejected_qty DESC
          LIMIT 25
        `.execute(this.database),
        sql<{ department: string; rejected_qty: string; report_count: string }>`
          SELECT r.department,
            (
              SELECT COALESCE(SUM(s.rejected_qty), 0) FROM qc.reject_issue_slips s WHERE s.report_id = r.id
            ) + (
              SELECT COALESCE(SUM(e.reject_qty), 0) FROM qc.daily_reject_entries e WHERE e.report_id = r.id
            ) AS rejected_qty,
            COUNT(*) OVER () AS report_count
          FROM qc.reject_reports r
          WHERE r.status <> 'VOID' ${b}
          ORDER BY r.department
        `.execute(this.database),
        sql<{ reason: string; count: string }>`
          SELECT reason, COUNT(*) AS count FROM (
            SELECT s.reject_reason AS reason FROM qc.reject_issue_slips s
            JOIN qc.reject_reports r ON r.id = s.report_id AND r.status <> 'VOID' ${b}
            UNION ALL
            SELECT e.reject_reason FROM qc.daily_reject_entries e
            JOIN qc.reject_reports r ON r.id = e.report_id AND r.status <> 'VOID' ${b}
          ) reasons GROUP BY reason ORDER BY count DESC LIMIT 25
        `.execute(this.database),
        sql<{ item_code: string; item_name: string; rejected_qty: string }>`
          SELECT item_code, item_name, rejected_qty FROM (
            SELECT s.item_code, s.item_name, s.rejected_qty
            FROM qc.reject_issue_slips s
            JOIN qc.reject_reports r ON r.id = s.report_id AND r.status <> 'VOID' ${b}
            UNION ALL
            SELECT COALESCE(e.item_code, '—'), e.item_description, e.reject_qty
            FROM qc.daily_reject_entries e
            JOIN qc.reject_reports r ON r.id = e.report_id AND r.status <> 'VOID' ${b}
          ) items ORDER BY rejected_qty DESC LIMIT 10
        `.execute(this.database),
        sql<{ pending: string; completed: string }>`
          SELECT
            COUNT(*) FILTER (WHERE a.status IN ('PENDING', 'REVERSED')) AS pending,
            COUNT(*) FILTER (WHERE a.status = 'CONFIRMED') AS completed
          FROM qc.issue_slip_approval_confirmations a
          JOIN qc.reject_reports r ON r.id = a.report_id AND r.status <> 'VOID' ${b}
        `.execute(this.database),
        sql<{ date: string; reject_pct: string | null }>`
          SELECT r.report_date::text AS date,
            CASE WHEN SUM(e.good_qty) > 0
              THEN ROUND(SUM(e.reject_qty) / SUM(e.good_qty) * 100, 4)
              ELSE NULL END AS reject_pct
          FROM qc.reject_reports r
          JOIN qc.daily_reject_entries e ON e.report_id = r.id
          WHERE r.status <> 'VOID' ${b}
          GROUP BY r.report_date
          ORDER BY r.report_date
        `.execute(this.database),
      ]);
    const trendMap = new Map<string, { rejectedQty: number; reportCount: number }>();
    for (const row of trend.rows) {
      const current = trendMap.get(row.date) ?? { rejectedQty: 0, reportCount: 0 };
      current.rejectedQty += Number(row.rejected_qty);
      current.reportCount += 1;
      trendMap.set(row.date, current);
    }
    const departmentMap = new Map<string, { rejectedQty: number; reportCount: number }>();
    for (const row of byDepartment.rows) {
      const current = departmentMap.get(row.department) ?? { rejectedQty: 0, reportCount: 0 };
      current.rejectedQty += Number(row.rejected_qty);
      current.reportCount += 1;
      departmentMap.set(row.department, current);
    }
    return {
      trendByDate: [...trendMap.entries()].map(([date, value]) => ({
        date,
        rejectedQty: value.rejectedQty,
        reportCount: value.reportCount,
      })),
      byItem: byItem.rows.map((row) => ({
        itemCode: row.item_code,
        itemName: row.item_name,
        rejectedQty: Number(row.rejected_qty),
      })),
      byDepartment: [...departmentMap.entries()].map(([department, value]) => ({
        department,
        rejectedQty: value.rejectedQty,
        reportCount: value.reportCount,
      })),
      byReason: byReason.rows.map((row) => ({ reason: row.reason, count: Number(row.count) })),
      topRejectItems: topItems.rows.map((row) => ({
        itemCode: row.item_code,
        itemName: row.item_name,
        rejectedQty: Number(row.rejected_qty),
      })),
      approvalStatus: approvalStatus.rows.map((row) => ({
        pending: Number(row.pending),
        completed: Number(row.completed),
      })),
      rejectPctTrend: pctTrend.rows.map((row) => ({
        date: row.date,
        rejectPct: row.reject_pct === null ? null : Number(row.reject_pct),
      })),
    };
  }

  async recent(limit: number): Promise<readonly (IssueSlip | DailyReject)[]> {
    const rows = await this.database
      .selectFrom('reject_reports')
      .select(['id', 'report_type'])
      .orderBy('created_at', 'desc')
      .limit(Math.min(50, Math.max(1, limit)))
      .execute();
    const items = await Promise.all(
      rows.map((row) =>
        row.report_type === 'ISSUE_SLIP'
          ? this.loadSlip(this.database, row.id)
          : this.loadDaily(this.database, row.id),
      ),
    );
    return items.filter((item): item is IssueSlip | DailyReject => Boolean(item));
  }
}
