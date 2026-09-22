import { compareDecimals, isNumericLiteral } from './exact-decimal.js';

/**
 * QC-DATA-003 — apply an approved acceptance rule to one observed value.
 *
 * The rule vocabulary is the one already stored on
 * `lab_test_template_parameters.acceptance_rule_type` / `_payload`, and the rule
 * is only honoured when the approved template actually carries it. Requirement
 * prose is never parsed and no threshold is invented: a parameter without a
 * formal rule returns `null`, which means the human reviewer owns the outcome.
 *
 * Numeric comparison is exact decimal (see `exact-decimal.ts`), so a captured
 * `5.4` is compared to the approved `5.0`/`6.0` bounds as written.
 */

export const PARAMETER_ACCEPTANCE_RULE_TYPES = [
  'RANGE_INCLUSIVE',
  'RANGE_EXCLUSIVE',
  'MAX_LIMIT',
  'MIN_LIMIT',
  'ENUM_ALLOWED',
  'EQUALS',
] as const;
export type ParameterAcceptanceRuleType = (typeof PARAMETER_ACCEPTANCE_RULE_TYPES)[number];

export function isParameterAcceptanceRuleType(
  value: unknown,
): value is ParameterAcceptanceRuleType {
  return (
    typeof value === 'string' &&
    (PARAMETER_ACCEPTANCE_RULE_TYPES as readonly string[]).includes(value)
  );
}

export interface ParameterAcceptanceInput {
  /** The observed value, as captured (exact decimal text for numeric parameters). */
  value: string | boolean | null;
  dataType: string;
  ruleType: string | null;
  rulePayload: unknown;
}

function numericBound(payload: Record<string, unknown>, key: string): string | undefined {
  const raw = payload[key];
  if (typeof raw === 'number') return String(raw);
  if (typeof raw === 'string' && isNumericLiteral(raw)) return raw.trim();
  return undefined;
}

function allowedValues(payload: Record<string, unknown>): string[] | undefined {
  const allowed = payload.allowed;
  if (!Array.isArray(allowed)) return undefined;
  const values = allowed.filter((value): value is string => typeof value === 'string');
  return values.length ? values : undefined;
}

/**
 * Evaluate one observed value. Returns `null` when no formal rule applies, when
 * the rule is malformed, or when the observation is not the shape the rule
 * needs — never a guessed `PASS`/`FAIL`.
 */
export function evaluateParameterAcceptance(
  input: ParameterAcceptanceInput,
): 'PASS' | 'FAIL' | null {
  const { value, dataType, ruleType, rulePayload } = input;
  if (!isParameterAcceptanceRuleType(ruleType)) return null;
  if (typeof rulePayload !== 'object' || rulePayload === null) return null;
  const payload = rulePayload as Record<string, unknown>;

  if (dataType === 'BOOLEAN') {
    if (typeof value !== 'boolean') return null;
    if (ruleType !== 'EQUALS') return null;
    const expected = payload.expected;
    if (typeof expected !== 'boolean') return null;
    return expected === value ? 'PASS' : 'FAIL';
  }

  if (typeof value !== 'string' || !value.trim()) return null;
  const observed = value.trim();

  if (ruleType === 'ENUM_ALLOWED') {
    const allowed = allowedValues(payload);
    if (!allowed) return null;
    return allowed.includes(observed) ? 'PASS' : 'FAIL';
  }

  if (!isNumericLiteral(observed)) return null;

  if (ruleType === 'RANGE_INCLUSIVE' || ruleType === 'RANGE_EXCLUSIVE') {
    const lower = numericBound(payload, 'lower');
    const upper = numericBound(payload, 'upper');
    if (lower === undefined || upper === undefined) return null;
    if (ruleType === 'RANGE_INCLUSIVE')
      return compareDecimals(observed, lower) >= 0 && compareDecimals(observed, upper) <= 0
        ? 'PASS'
        : 'FAIL';
    return compareDecimals(observed, lower) > 0 && compareDecimals(observed, upper) < 0
      ? 'PASS'
      : 'FAIL';
  }
  if (ruleType === 'MAX_LIMIT') {
    const max = numericBound(payload, 'max');
    if (max === undefined) return null;
    return compareDecimals(observed, max) <= 0 ? 'PASS' : 'FAIL';
  }
  if (ruleType === 'MIN_LIMIT') {
    const min = numericBound(payload, 'min');
    if (min === undefined) return null;
    return compareDecimals(observed, min) >= 0 ? 'PASS' : 'FAIL';
  }
  const expected = numericBound(payload, 'expected');
  if (expected === undefined) return null;
  return compareDecimals(observed, expected) === 0 ? 'PASS' : 'FAIL';
}
