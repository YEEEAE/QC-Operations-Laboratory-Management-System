/**
 * QC-DATA-002 — Domain vocabulary for inspection point results.
 *
 * The paper QC forms speak of Acceptable / Not Acceptable / Read Remarks /
 * Not Applicable. Internally those normalize to the canonical PASS | FAIL |
 * REMARK | NA values below; presentation maps them back to the human wording.
 * Regulated terms (PASS, FAIL) keep their exact spelling per the copy
 * glossary.
 */
export const POINT_RESULT_VALUES = ['PASS', 'FAIL', 'REMARK', 'NA'] as const;
export type PointResult = (typeof POINT_RESULT_VALUES)[number];

/**
 * Point data types extend the storage-level values in `data_type` with the
 * dynamic-result shapes the execution UI renders. `MULTI_MEASUREMENT` stores
 * repeated measurements in the results table (one row per reading);
 * `REMARK_ONLY` records a note without a pass/fail claim.
 */
export const POINT_DATA_TYPES = [
  'BOOLEAN_ACCEPTABILITY',
  'ENUM',
  'NUMERIC_MEASUREMENT',
  'TEXT',
  'MULTI_MEASUREMENT',
  'REMARK_ONLY',
  'NOT_APPLICABLE',
] as const;
export type PointDataType = (typeof POINT_DATA_TYPES)[number];

/**
 * Machine-readable acceptance rule types. A rule is only honored when it is
 * stored in the approved template point (`acceptance_rule_type` +
 * `acceptance_rule_payload`); anything else requires a human result and is
 * never invented from requirement text.
 */
export const ACCEPTANCE_RULE_TYPES = [
  'RANGE_INCLUSIVE',
  'RANGE_EXCLUSIVE',
  'MAX_LIMIT',
  'MIN_LIMIT',
  'ENUM_ALLOWED',
  'EQUALS',
] as const;
export type AcceptanceRuleType = (typeof ACCEPTANCE_RULE_TYPES)[number];

export function isAcceptanceRuleType(value: unknown): value is AcceptanceRuleType {
  return typeof value === 'string' && (ACCEPTANCE_RULE_TYPES as readonly string[]).includes(value);
}
