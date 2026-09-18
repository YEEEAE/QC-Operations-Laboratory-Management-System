import { AppError } from '../../../shared/errors/app-error.js';
import type { RejectReportType } from './reject-report.js';

/**
 * Human-readable report number, generated server-side.
 * Convention: RIS-YYYYMMDD-#### for Issue Slips, DRR-YYYYMMDD-#### for Daily
 * Reject records. The database assigns the sequence under a transaction-level
 * advisory lock on the (prefix, date) pair, so concurrent creators cannot
 * collide; the unique constraint on report_no is the final guard.
 */
export const REPORT_NO_PATTERN = /^(RIS|DRR)-\d{8}-\d{4}$/;

export function reportNoPrefix(type: RejectReportType): 'RIS' | 'DRR' {
  return type === 'ISSUE_SLIP' ? 'RIS' : 'DRR';
}

export function reportNoDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export function formatReportNo(type: RejectReportType, date: Date, sequence: number): string {
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 9999)
    throw new AppError('SYSTEM_INTERNAL');
  return `${reportNoPrefix(type)}-${reportNoDateKey(date)}-${String(sequence).padStart(4, '0')}`;
}

export function isReportNo(value: string): boolean {
  return REPORT_NO_PATTERN.test(value);
}
