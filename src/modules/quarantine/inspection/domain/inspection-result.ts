import { AppError } from '../../../../shared/errors/app-error.js';
export const FINAL_RESULTS = ['PASS', 'FAIL', 'HOLD'] as const;
export type FinalResult = (typeof FINAL_RESULTS)[number];
export interface InspectionResultEntry {
  id: string;
  pointId: string;
  /** Raw UI observation. Decimal measurements are always transported as text. */
  value: string | boolean;
  /** Set only by the server after resolving the frozen point data type. */
  numericValue?: string;
  unit?: string;
  result?: string;
  remarks?: string;
  version: bigint;
}
/**
 * QC-DATA-002 — point-result vocabulary (§6). The paper forms' human wording
 * (Acceptable / Not Acceptable / Read Remarks / Not Applicable) normalizes to
 * these canonical values; presentation renders the human wording.
 */
export const POINT_RESULTS = ['PASS', 'FAIL', 'REMARK', 'NA'] as const;
export type PointResult = (typeof POINT_RESULTS)[number];

/**
 * The only official point results a client may submit are REMARK and NA.
 * PASS and FAIL are facts of the approved rule (or the reviewer) — never a
 * browser claim.
 */
export function isClientAllowedPointResult(result: string): boolean {
  return result === 'REMARK' || result === 'NA';
}

export function assertResultSeparation(result: FinalResult | undefined) {
  if (result && !FINAL_RESULTS.includes(result))
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
}
