import { dailyRejectTotals as calculateDailyRejectTotals } from '../domain/daily-reject.js';
import { ISSUE_SLIP_APPROVAL_ROLES as approvalRoles } from '../domain/issue-slip.js';
import type { DailyRejectEntry } from '../domain/daily-reject.js';

export const ISSUE_SLIP_APPROVAL_ROLES = approvalRoles;

export function dailyRejectTotals(entries: readonly DailyRejectEntry[]) {
  return calculateDailyRejectTotals(entries);
}
