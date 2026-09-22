/**
 * QC-DATA-003 — derived sample result and derived overall test result.
 *
 * Both derivations operate only on outcomes that already came from the approved
 * per-parameter acceptance rules (or from an approved calculation that those
 * rules were then applied to). No limit, tolerance, unit or threshold is
 * introduced here: this module only aggregates decisions the approved source
 * already made.
 *
 * `PASS` is never claimed on incomplete evidence. A required parameter with no
 * formal rule outcome cannot be evaluated, so the derivation returns `HOLD` —
 * the reviewer owns it — rather than inferring acceptability.
 *
 * `NOT_APPLICABLE` exists in the stored vocabulary for a human-recorded result;
 * the derivation itself emits only `PASS`, `FAIL` or `HOLD`.
 */

export const SAMPLE_RESULT_VALUES = ['PASS', 'FAIL', 'HOLD', 'NOT_APPLICABLE'] as const;
export type SampleResult = (typeof SAMPLE_RESULT_VALUES)[number];

export function isSampleResult(value: unknown): value is SampleResult {
  return typeof value === 'string' && (SAMPLE_RESULT_VALUES as readonly string[]).includes(value);
}

export interface ParameterOutcome {
  parameterId: string;
  required: boolean;
  /** `null` when no approved rule produced an outcome for this parameter. */
  result: 'PASS' | 'FAIL' | null;
}

/** The stored result of one run sample, with the inputs it was derived from. */
export interface LabSampleResultRecord {
  id: string;
  batchId: string;
  sampleId: string;
  result: SampleResult;
  /** `SYSTEM_EVALUATION` when the server derived it; `HUMAN` when recorded. */
  source: 'SYSTEM_EVALUATION' | 'HUMAN';
  sourceReference: string | null;
  contentHash: string | null;
  derivedFrom: Readonly<Record<string, unknown>> | null;
  evaluatedAt: string;
  evaluatedBy: string;
}

/**
 * Aggregate one sample's per-parameter outcomes into a sample result.
 *
 *  - any `FAIL` (required or optional) → `FAIL`: an observed failing value is
 *    never ignored because the parameter was optional;
 *  - every required outcome `PASS` → `PASS`;
 *  - otherwise → `HOLD` (required evidence is incomplete or indeterminate);
 *  - no outcomes at all → `undefined`: there is nothing to aggregate, so the
 *    sample carries no derived result.
 */
export function deriveSampleResult(
  outcomes: readonly ParameterOutcome[],
): SampleResult | undefined {
  if (!outcomes.length) return undefined;
  if (outcomes.some((outcome) => outcome.result === 'FAIL')) return 'FAIL';
  const required = outcomes.filter((outcome) => outcome.required);
  if (required.length && required.every((outcome) => outcome.result === 'PASS')) return 'PASS';
  return 'HOLD';
}

/**
 * Aggregate the run-level sample results into the test's derived result.
 *
 *  - any `FAIL` → `FAIL`;
 *  - every sample `PASS` → `PASS`;
 *  - otherwise (`HOLD` / `NOT_APPLICABLE`) → `HOLD`;
 *  - no sample results → `undefined`.
 *
 * The derived result is review evidence. It never becomes the official
 * `scientific_result`, which still comes from the approved evaluation source at
 * stage-1 approval.
 */
export function deriveTestResult(results: readonly SampleResult[]): SampleResult | undefined {
  if (!results.length) return undefined;
  if (results.some((result) => result === 'FAIL')) return 'FAIL';
  if (results.every((result) => result === 'PASS')) return 'PASS';
  return 'HOLD';
}
