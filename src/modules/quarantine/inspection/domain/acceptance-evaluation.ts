/**
 * QC-DATA-002 / BR-INSP-006 — deterministic server-side numeric evaluation.
 *
 * PASS/FAIL is only ever calculated when the approved template point carries a
 * machine-readable acceptance rule (`acceptance_rule_type` +
 * `acceptance_rule_payload` with numeric `lower`/`upper` bounds or allowed
 * enum values). Requirement prose is never parsed and thresholds are never
 * invented; a point without a formal rule returns `undefined`, which means the
 * human result entry is authoritative.
 *
 * Precision: the numeric value arrives as the exact string captured from the
 * operator/instrument (`numeric_value` is NUMERIC in PostgreSQL). Evaluation
 * uses that exact decimal string; no floating-point conversion happens before
 * the comparison.
 */

export type AcceptanceRuleType =
  | 'RANGE_INCLUSIVE'
  | 'RANGE_EXCLUSIVE'
  | 'MAX_LIMIT'
  | 'MIN_LIMIT'
  | 'ENUM_ALLOWED'
  | 'EQUALS';

const NUMERIC_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;

const RULE_TYPES: readonly AcceptanceRuleType[] = [
  'RANGE_INCLUSIVE',
  'RANGE_EXCLUSIVE',
  'MAX_LIMIT',
  'MIN_LIMIT',
  'ENUM_ALLOWED',
  'EQUALS',
];

export function isAcceptanceRuleType(value: unknown): value is AcceptanceRuleType {
  return typeof value === 'string' && RULE_TYPES.includes(value as AcceptanceRuleType);
}

/**
 * Compare two exact decimal strings without binary floating point. Returns
 * -1 / 0 / 1. Non-numeric input throws — callers validate first.
 */
export function compareDecimal(a: string, b: string): -1 | 0 | 1 {
  if (!NUMERIC_PATTERN.test(a) || !NUMERIC_PATTERN.test(b))
    throw new Error('exact-decimal comparison requires numeric strings');
  const pa = a.split('.');
  const pb = b.split('.');
  const scale = Math.max((pa[1] ?? '').length, (pb[1] ?? '').length);
  // Scale both to a common fractional width, then compare scaled integers —
  // one exact BigInt subtraction, no floating point anywhere.
  const scaleTo = (parts: string[]): bigint => {
    const negative = parts[0]!.trim().startsWith('-');
    const digits =
      (parts[0]!.replace(/^[+-]/, '') || '0') + (parts[1] ?? '').padEnd(scale, '0');
    const value = BigInt(digits === '' ? '0' : digits);
    return negative ? -value : value;
  };
  const ia = scaleTo(pa);
  const ib = scaleTo(pb);
  return ia === ib ? 0 : ia < ib ? -1 : 1;
}

export interface AcceptanceEvaluationInput {
  /** Exact numeric string as captured (NUMERIC storage). */
  numericValue: string;
  ruleType: string;
  rulePayload: unknown;
}

export interface AcceptanceEvaluation {
  ruleType: AcceptanceRuleType;
  result: 'PASS' | 'FAIL';
}

function numericBound(payload: Record<string, unknown>, key: string): string | undefined {
  const raw = payload[key];
  if (typeof raw === 'number') return String(raw);
  if (typeof raw === 'string' && NUMERIC_PATTERN.test(raw.trim())) return raw.trim();
  return undefined;
}

/**
 * Evaluate an observed numeric value against a machine-readable rule.
 * Returns `undefined` when no formal rule applies — the caller then requires
 * the human result instead of guessing one.
 */
export function evaluateNumericAcceptance(
  input: AcceptanceEvaluationInput,
): AcceptanceEvaluation | undefined {
  const { numericValue, ruleType, rulePayload } = input;
  if (!NUMERIC_PATTERN.test(numericValue.trim())) return undefined;
  if (!isAcceptanceRuleType(ruleType)) return undefined;
  if (ruleType === 'ENUM_ALLOWED') return undefined; // enum rules evaluate on selected_value, not numbers
  if (typeof rulePayload !== 'object' || rulePayload === null) return undefined;
  const payload = rulePayload as Record<string, unknown>;

  const compare = (bound: string): -1 | 0 | 1 => compareDecimal(numericValue.trim(), bound);

  if (ruleType === 'RANGE_INCLUSIVE' || ruleType === 'RANGE_EXCLUSIVE') {
    const lower = numericBound(payload, 'lower');
    const upper = numericBound(payload, 'upper');
    if (lower === undefined || upper === undefined) return undefined;
    if (ruleType === 'RANGE_INCLUSIVE')
      return { ruleType, result: compare(lower) >= 0 && compare(upper) <= 0 ? 'PASS' : 'FAIL' };
    return { ruleType, result: compare(lower) > 0 && compare(upper) < 0 ? 'PASS' : 'FAIL' };
  }
  if (ruleType === 'MAX_LIMIT') {
    const max = numericBound(payload, 'max');
    if (max === undefined) return undefined;
    return { ruleType, result: compare(max) <= 0 ? 'PASS' : 'FAIL' };
  }
  if (ruleType === 'MIN_LIMIT') {
    const min = numericBound(payload, 'min');
    if (min === undefined) return undefined;
    return { ruleType, result: compare(min) >= 0 ? 'PASS' : 'FAIL' };
  }
  // EQUALS on numeric values.
  const expected = numericBound(payload, 'expected');
  if (expected === undefined) return undefined;
  return { ruleType, result: compare(expected) === 0 ? 'PASS' : 'FAIL' };
}

/**
 * Evaluate an observed enum/text selection against an approved allowed list.
 * Returns `undefined` when the rule is absent or malformed.
 */
export function evaluateEnumAcceptance(
  selectedValue: string,
  ruleType: string,
  rulePayload: unknown,
): AcceptanceEvaluation | undefined {
  if (ruleType !== 'ENUM_ALLOWED') return undefined;
  if (typeof rulePayload !== 'object' || rulePayload === null) return undefined;
  const allowed = (rulePayload as Record<string, unknown>).allowed;
  if (!Array.isArray(allowed)) return undefined;
  const values = allowed.filter((v): v is string => typeof v === 'string');
  if (!values.length) return undefined;
  const trimmed = selectedValue.trim();
  if (!trimmed) return undefined;
  return {
    ruleType,
    result: values.includes(trimmed) ? 'PASS' : 'FAIL',
  };
}

/**
 * Equipment measurement verification row: Standard Reading vs Equipment
 * Reading against an approved tolerance. The difference and result are
 * computed server-side; the operator never declares the outcome.
 */
export interface EquipmentVerificationInput {
  standardReading: string;
  equipmentReading: string;
  /** Approved absolute tolerance (exact decimal string). */
  tolerance: string;
}

export interface EquipmentVerification {
  difference: string;
  result: 'PASS' | 'FAIL';
}

function decimalDigits(value: string): bigint {
  const [int = '0', frac = ''] = value.trim().replace(/^[+-]/, '').split('.');
  return BigInt((int || '0') + frac);
}

function decimalScale(value: string): number {
  return (value.trim().replace(/^[+-]/, '').split('.')[1] ?? '').length;
}

function isNegative(value: string): boolean {
  return value.trim().startsWith('-') && decimalDigits(value) !== 0n;
}

export function evaluateEquipmentVerification(
  input: EquipmentVerificationInput,
): EquipmentVerification | undefined {
  const { standardReading, equipmentReading, tolerance } = input;
  for (const value of [standardReading, equipmentReading, tolerance])
    if (!NUMERIC_PATTERN.test(value.trim())) return undefined;
  const scale = Math.max(
    decimalScale(standardReading),
    decimalScale(equipmentReading),
    decimalScale(tolerance),
  );
  const diffDigits =
    decimalDigits(equipmentReading) * 10n ** BigInt(scale - decimalScale(equipmentReading)) -
    decimalDigits(standardReading) * 10n ** BigInt(scale - decimalScale(standardReading));
  const sign = diffDigits < 0n ? '-' : '';
  const magnitude = (diffDigits < 0n ? -diffDigits : diffDigits).toString().padStart(scale + 1, '0');
  const intPart = magnitude.slice(0, magnitude.length - scale) || '0';
  const fracPart = scale > 0 ? `.${magnitude.slice(magnitude.length - scale)}` : '';
  const difference = `${sign}${intPart}${fracPart}`;
  const within =
    decimalDigits(difference) * 10n ** BigInt(scale - decimalScale(difference)) <=
    decimalDigits(tolerance) * 10n ** BigInt(scale - decimalScale(tolerance));
  return { difference, result: within ? 'PASS' : 'FAIL' };
}
