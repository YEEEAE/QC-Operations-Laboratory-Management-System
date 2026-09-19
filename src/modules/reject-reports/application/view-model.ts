import { dailyRejectTotals as calculateDailyRejectTotals } from '../domain/daily-reject.js';
import {
  ISSUE_SLIP_APPROVAL_ROLES as approvalRoles,
  nextPendingApprovalRole as nextApprovalRole,
} from '../domain/issue-slip.js';
import type { ApprovalConfirmation, IssueSlipApprovalRole } from '../domain/issue-slip.js';
import type { DailyRejectEntry } from '../domain/daily-reject.js';

export const ISSUE_SLIP_APPROVAL_ROLES = approvalRoles;

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
