import { AppError } from '../../../shared/errors/app-error.js';
import {
  decimalScale,
  divideHalfUp,
  fromScaled,
  isNumericLiteral,
  toScaled,
} from './exact-decimal.js';

/**
 * QC-DATA-003 — deterministic arithmetic over captured readings.
 *
 * Only the arithmetic primitive lives here. Which readings feed it, the
 * precision of the result, and the source reference/version all come from the
 * approved template parameter (`calculation_rule_type` +
 * `calculation_rule_payload` + `controlled_source_reference`), never from the
 * browser and never from this module. A rule whose parameters are missing or
 * malformed returns `undefined`, which leaves the value to the human reviewer
 * instead of guessing a precision, a scope or a formula.
 *
 * Arithmetic is exact decimal (BigInt-scaled); no binary floating point is used
 * at any point, so a captured value is never silently re-rounded before it is
 * compared or stored. `MEAN` is the only rule that can produce a non-terminating
 * quotient, so it requires the approved source to declare `decimals`; the
 * quotient is then rounded half-up at that declared precision.
 */

export const CALCULATION_RULE_TYPES = ['MEAN', 'SUM', 'MIN', 'MAX', 'RANGE'] as const;
export type CalculationRuleType = (typeof CALCULATION_RULE_TYPES)[number];

/**
 * Storage-safety bound for a malformed approved payload, not a scientific rule:
 * no result is computed from a rule that asks for more than 18 fractional
 * digits, and such a rule yields no value at all.
 */
const MAX_DECIMALS = 18;

export function isCalculationRuleType(value: unknown): value is CalculationRuleType {
  return (
    typeof value === 'string' && (CALCULATION_RULE_TYPES as readonly string[]).includes(value)
  );
}

/** The approved, source-controlled rule as stored on the template parameter. */
export interface CalculationRuleSource {
  ruleType: string;
  rulePayload: unknown;
}

/** The validated rule, ready to compute with. */
export interface CalculationRule {
  ruleType: CalculationRuleType;
  /** Approved controlled source the rule was read from; required for traceability. */
  sourceReference: string;
  /** Approved rule version/revision, when the source declares one. */
  version: string | null;
  /** Declared result precision; required by `MEAN`, `null` for exact rules. */
  decimals: number | null;
}

function payloadOf(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

function textField(payload: Record<string, unknown>, key: string): string | null {
  const raw = payload[key];
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed ? trimmed : null;
}

/**
 * Validate an approved calculation rule. Returns `undefined` when the rule is
 * absent or incomplete, so the caller stores readings and no calculated value.
 */
export function parseCalculationRule(
  source: CalculationRuleSource | null | undefined,
  fallbackSourceReference: string,
): CalculationRule | undefined {
  if (!source || !isCalculationRuleType(source.ruleType)) return undefined;
  const payload = payloadOf(source.rulePayload);
  if (!payload) return undefined;
  const sourceReference = textField(payload, 'sourceReference') ?? fallbackSourceReference.trim();
  if (!sourceReference) return undefined;
  const version = textField(payload, 'version');
  if (source.ruleType === 'MEAN') {
    const decimals = payload.decimals;
    if (
      typeof decimals !== 'number' ||
      !Number.isInteger(decimals) ||
      decimals < 0 ||
      decimals > MAX_DECIMALS
    )
      return undefined;
    return { ruleType: source.ruleType, sourceReference, version, decimals };
  }
  return { ruleType: source.ruleType, sourceReference, version, decimals: null };
}

export interface CalculationResult {
  ruleType: CalculationRuleType;
  /** The result, as an exact decimal string at the declared precision. */
  value: string;
  /** The exact captured readings the result was computed from, in entry order. */
  inputs: readonly string[];
}

/**
 * Compute the rule's result over the captured readings.
 *
 * Returns `undefined` — never a partial or guessed value — when the readings
 * are empty, when any captured value is not an exact decimal, or when `MEAN`
 * carries no declared precision.
 */
export function computeCalculation(
  rule: CalculationRule,
  values: readonly string[],
): CalculationResult | undefined {
  if (!values.length) return undefined;
  const inputs = values.map((value) => value.trim());
  if (inputs.some((value) => !isNumericLiteral(value))) return undefined;
  const scale = Math.max(...inputs.map((value) => decimalScale(value)));

  if (rule.ruleType === 'MEAN') {
    if (rule.decimals === null) return undefined;
    const total = inputs.reduce((sum, value) => sum + toScaled(value, scale), 0n);
    const shift = rule.decimals - scale;
    const numerator = shift >= 0 ? total * 10n ** BigInt(shift) : total;
    const denominator = BigInt(inputs.length) * (shift >= 0 ? 1n : 10n ** BigInt(-shift));
    return {
      ruleType: rule.ruleType,
      value: fromScaled(divideHalfUp(numerator, denominator), rule.decimals),
      inputs,
    };
  }

  const scaled = inputs.map((value) => toScaled(value, scale));
  if (rule.ruleType === 'SUM')
    return {
      ruleType: rule.ruleType,
      value: fromScaled(
        scaled.reduce((a, b) => a + b, 0n),
        scale,
      ),
      inputs,
    };
  const min = scaled.reduce((a, b) => (b < a ? b : a));
  const max = scaled.reduce((a, b) => (b > a ? b : a));
  if (rule.ruleType === 'MIN')
    return { ruleType: rule.ruleType, value: fromScaled(min, scale), inputs };
  if (rule.ruleType === 'MAX')
    return { ruleType: rule.ruleType, value: fromScaled(max, scale), inputs };
  return { ruleType: rule.ruleType, value: fromScaled(max - min, scale), inputs };
}

/**
 * The value one reported observation carries for acceptance evaluation: the
 * approved calculation result when a rule ran, otherwise the single captured
 * reading. More than one reading without a rule has no defined single value and
 * returns `undefined`, so the reviewer owns the outcome.
 */
export function observationValue(
  calculated: string | undefined,
  readings: readonly string[],
): string | undefined {
  if (calculated !== undefined) return calculated;
  return readings.length === 1 ? readings[0]!.trim() : undefined;
}

/**
 * Numeric observations are the only ones a calculation can run over. A rule on
 * a non-numeric parameter is a controlled-source defect, not a silent skip.
 */
export function assertCalculationApplicable(parameter: {
  dataType: string;
  code: string;
}): void {
  if (parameter.dataType !== 'NUMERIC')
    throw new AppError('VALIDATION_FAILED', {
      userSafe: true,
      messageKey: 'errors.calculation_requires_numeric_parameter',
    });
}
