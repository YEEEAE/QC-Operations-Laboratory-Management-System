import type { ActorContext } from '../../../shared/authorization/types.js';
import type { Page } from '../../../shared/pagination/page.js';
import type { RejectReportStatus, RejectReportType } from '../domain/reject-report.js';
import type { IssueSlip, IssueSlipApprovalRole, IssueSlipFields } from '../domain/issue-slip.js';
import type { DailyReject, DailyRejectEntryInput } from '../domain/daily-reject.js';

export interface RejectReportListFilter {
  type?: RejectReportType;
  status?: RejectReportStatus;
  from?: Date;
  to?: Date;
  itemCode?: string;
  itemName?: string;
  lot?: string;
  department?: string;
  unit?: string;
  unitMissing?: boolean;
  createdBy?: string;
  approvalState?: 'AWAITING' | 'COMPLETED';
  search?: string;
}

export interface PagedResult<T> {
  items: readonly T[];
  total: number;
}

export interface RejectReportSummary {
  reportsToday: number;
  reportsThisMonth: number;
  rejectedByUnit: readonly {
    reportType: RejectReportType;
    unit: string;
    rejectedQty: string;
    reportCount: number;
  }[];
  totalIssueSlips: number;
  totalDailyRejects: number;
  awaitingApprovals: number;
  completedIssueSlips: number;
  finalizedDailyRejects: number;
}

export interface RejectReportAnalytics {
  trendByDate: readonly {
    date: string;
    reportType: RejectReportType;
    unit: string;
    rejectedQty: string;
    reportCount: number;
  }[];
  byItem: readonly {
    reportType: RejectReportType;
    unit: string;
    itemCode: string;
    itemName: string;
    rejectedQty: string;
  }[];
  byDepartment: readonly {
    reportType: RejectReportType;
    unit: string;
    department: string;
    rejectedQty: string;
    reportCount: number;
  }[];
  byReason: readonly { reportType: RejectReportType; reason: string; count: number }[];
  topRejectItems: readonly {
    reportType: RejectReportType;
    unit: string;
    itemCode: string;
    itemName: string;
    rejectedQty: string;
  }[];
  approvalStatus: readonly { pending: number; completed: number }[];
  rejectPctTrend: readonly { date: string; unit: string; rejectPct: string | null }[];
}

/**
 * Environment-level availability signal for the Reject Reports module.
 *
 * The module owns four tables added by migration `0026`. When a deployment's
 * database is behind the deployed build the register fails closed instead of
 * surfacing a database error, and the UI can say so honestly. A failed probe
 * is kept distinct from confirmed missing tables. No internal schema detail
 * is exposed beyond a stable reason code.
 */
export interface RejectReportAvailability {
  available: boolean;
  reason?: 'SCHEMA_NOT_READY' | 'CHECK_FAILED';
}

export interface RejectReportRepository {
  /** Read-only probe; never mutates state. */
  availability(): Promise<RejectReportAvailability>;

  createIssueSlip(input: {
    actor: ActorContext;
    requestId: string;
    reportDate: Date;
    department: string;
    shift?: string;
    fields: IssueSlipFields;
  }): Promise<IssueSlip>;

  getIssueSlip(id: string): Promise<IssueSlip | undefined>;

  listIssueSlips(input: {
    filter: RejectReportListFilter;
    page: Page;
  }): Promise<PagedResult<IssueSlip>>;

  updateIssueSlipDraft(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    requestId: string;
    reportDate: Date;
    department: string;
    shift?: string;
    fields: IssueSlipFields;
  }): Promise<IssueSlip>;

  issueIssueSlip(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    requestId: string;
  }): Promise<IssueSlip>;

  confirmApproval(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    requestId: string;
    role: IssueSlipApprovalRole;
    approverName?: string;
    note?: string;
    evidenceFileId?: string;
  }): Promise<IssueSlip>;

  reverseApproval(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    requestId: string;
    role: IssueSlipApprovalRole;
    reason: string;
  }): Promise<IssueSlip>;

  createDailyReject(input: {
    actor: ActorContext;
    requestId: string;
    reportDate: Date;
    department: string;
    shift?: string;
    entries: readonly DailyRejectEntryInput[];
  }): Promise<DailyReject>;

  getDailyReject(id: string): Promise<DailyReject | undefined>;

  listDailyRejects(input: {
    filter: RejectReportListFilter;
    page: Page;
  }): Promise<PagedResult<DailyReject>>;

  appendDailyRejectEntry(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    requestId: string;
    entry: DailyRejectEntryInput;
  }): Promise<DailyReject>;

  finalizeDailyReject(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    requestId: string;
  }): Promise<DailyReject>;

  voidReport(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    requestId: string;
    reason: string;
  }): Promise<IssueSlip | DailyReject>;

  summary(now: Date, filter?: RejectReportListFilter): Promise<RejectReportSummary>;
  analytics(input: {
    filter?: RejectReportListFilter;
    /** Legacy call compatibility; new consumers should pass a shared filter. */
    from?: Date;
    to?: Date;
  }): Promise<RejectReportAnalytics>;
  recent(
    limit: number,
    filter?: RejectReportListFilter,
  ): Promise<readonly (IssueSlip | DailyReject)[]>;
}
