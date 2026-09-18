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
  totalRejectedQuantity: number;
  totalIssueSlips: number;
  totalDailyRejects: number;
  awaitingApprovals: number;
  completedIssueSlips: number;
  finalizedDailyRejects: number;
}

export interface RejectReportAnalytics {
  trendByDate: readonly { date: string; rejectedQty: number; reportCount: number }[];
  byItem: readonly { itemCode: string; itemName: string; rejectedQty: number }[];
  byDepartment: readonly { department: string; rejectedQty: number; reportCount: number }[];
  byReason: readonly { reason: string; count: number }[];
  topRejectItems: readonly { itemCode: string; itemName: string; rejectedQty: number }[];
  approvalStatus: readonly { pending: number; completed: number }[];
  rejectPctTrend: readonly { date: string; rejectPct: number | null }[];
}

/**
 * Environment-level availability signal for the Reject Reports module.
 *
 * The module owns four tables added by migration `0026`. When a deployment's
 * database is behind the deployed build the register fails closed instead of
 * surfacing a database error, and the UI can say so honestly. No internal
 * schema detail is exposed beyond a stable reason code.
 */
export interface RejectReportAvailability {
  available: boolean;
  reason?: 'SCHEMA_NOT_READY';
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

  updateDailyRejectDraft(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    requestId: string;
    reportDate: Date;
    department: string;
    shift?: string;
    entries: readonly DailyRejectEntryInput[];
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

  summary(now: Date): Promise<RejectReportSummary>;
  analytics(input: { from?: Date; to?: Date }): Promise<RejectReportAnalytics>;
  recent(limit: number): Promise<readonly (IssueSlip | DailyReject)[]>;
}
