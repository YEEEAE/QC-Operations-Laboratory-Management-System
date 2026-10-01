import { dailyRejectTotals as calculateDailyRejectTotals } from '../domain/daily-reject.js';
import { compareDecimalStrings as compareDecimals } from '../domain/reject-percentage.js';
import { DAILY_REJECT_STATUSES, ISSUE_SLIP_STATUSES } from '../domain/reject-report.js';
import {
  ISSUE_SLIP_APPROVAL_ROLES as approvalRoles,
  nextPendingApprovalRole as nextApprovalRole,
} from '../domain/issue-slip.js';
import type { ApprovalConfirmation, IssueSlipApprovalRole } from '../domain/issue-slip.js';
import type { DailyRejectEntry } from '../domain/daily-reject.js';

export const ISSUE_SLIP_APPROVAL_ROLES = approvalRoles;
export const REJECT_REPORT_STATUSES = [
  ...new Set([...ISSUE_SLIP_STATUSES, ...DAILY_REJECT_STATUSES]),
];

export function compareRejectDecimalStrings(left: string, right: string): number {
  return compareDecimals(left, right);
}

/**
 * Delivery-safe projection of the checkpoint ordering rule: pages must not
 * import domain modules directly, so the next confirmable checkpoint is
 * exposed here for server-computed capability rendering.
 */
export function nextPendingApprovalRole(
  approvals: readonly ApprovalConfirmation[],
): IssueSlipApprovalRole | undefined {
  return nextApprovalRole(approvals);
}

export function dailyRejectTotals(entries: readonly DailyRejectEntry[]) {
  return calculateDailyRejectTotals(entries);
}
