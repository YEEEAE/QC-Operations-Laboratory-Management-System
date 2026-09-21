/**
 * QC-DATA-001 — Source-data classification vocabulary.
 *
 * Every source row is classified before it can reach PostgreSQL. A row is only
 * imported as-is when it is VALID, only rewritten when it is NORMALIZABLE, and
 * never guessed: ambiguous or contradictory rows are reported for review or
 * rejected. The original imported value is preserved alongside the classification
 * so traceability to the source is never lost.
 */
export const RECEIVING_SOURCE_CLASSIFICATIONS = [
  'VALID',
  'NORMALIZABLE',
  'REQUIRES_REVIEW',
  'INVALID',
] as const;

export type ReceivingSourceClassification = (typeof RECEIVING_SOURCE_CLASSIFICATIONS)[number];

/** Machine-readable reason codes; each carries the offending source field. */
export const RECEIVING_REVIEW_REASONS = [
  'MISSING_REQUIRED_FIELD',
  'QUANTITY_MISSING',
  'QUANTITY_NOT_NUMERIC',
  'QUANTITY_NOT_POSITIVE',
  'QUANTITY_HAS_SURROUNDING_TEXT',
  'QUANTITY_MULTIPLE_VALUES',
  'QUANTITY_UNIT_MISSING',
  'QUANTITY_UNIT_UNKNOWN',
  'DATE_MISSING',
  'DATE_UNPARSEABLE',
  'DATE_ORDER_AMBIGUOUS',
  'EXPIRY_BEFORE_RECEIVING',
] as const;

export type ReceivingReviewReason = (typeof RECEIVING_REVIEW_REASONS)[number];

export interface ReceivingClassificationIssue {
  field: string;
  reason: ReceivingReviewReason;
  /** The exact source value that was not accepted, or null when absent. */
  sourceValue: string | null;
  detail: string;
}
