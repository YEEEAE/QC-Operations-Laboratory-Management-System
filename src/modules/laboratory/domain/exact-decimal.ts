/**
 * QC-DATA-003 — exact decimal primitives for the laboratory domain.
 *
 * Captured values and approved limits are compared and computed as exact
 * decimals, never as binary floating point: a reading stored as `0.1` is not
 * silently turned into `0.1000000000000000055511151231257827`. Every helper here
 * works on the decimal string as written, scaled with BigInt.
 */

export const NUMERIC_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;

export function isNumericLiteral(value: string): boolean {
  return NUMERIC_PATTERN.test(value.trim());
}

export function decimalScale(value: string): number {
  return (value.trim().replace(/^[+-]/, '').split('.')[1] ?? '').length;
}

interface DecimalParts {
  negative: boolean;
  digits: string;
  scale: number;
}

function partsOf(value: string): DecimalParts {
  const trimmed = value.trim();
  const negative = trimmed.startsWith('-');
  const unsigned = trimmed.replace(/^[+-]/, '');
  const [integer = '0', fraction = ''] = unsigned.split('.');
  return { negative, digits: (integer || '0') + fraction, scale: fraction.length };
}

/** The value scaled to `scale` fractional digits, as a signed BigInt. */
export function toScaled(value: string, scale: number): bigint {
  const { negative, digits, scale: own } = partsOf(value);
  const scaled = BigInt(digits || '0') * 10n ** BigInt(scale - own);
  return negative ? -scaled : scaled;
}

/** Render a scaled BigInt back to a plain decimal string. */
export function fromScaled(value: bigint, scale: number): string {
  const negative = value < 0n;
  const magnitude = (negative ? -value : value).toString().padStart(scale + 1, '0');
  const integer = magnitude.slice(0, magnitude.length - scale) || '0';
  const fraction = scale > 0 ? `.${magnitude.slice(magnitude.length - scale)}` : '';
  return `${negative ? '-' : ''}${integer}${fraction}`;
}

/** Half-up rounding of `numerator / denominator`, away from zero. */
export function divideHalfUp(numerator: bigint, denominator: bigint): bigint {
  const negative = numerator < 0n;
  const magnitude = negative ? -numerator : numerator;
  const quotient = (2n * magnitude + denominator) / (2n * denominator);
  return negative ? -quotient : quotient;
}

/** Exact comparison of two numeric literals: -1, 0 or 1. */
export function compareDecimals(left: string, right: string): -1 | 0 | 1 {
  const scale = Math.max(decimalScale(left), decimalScale(right));
  const a = toScaled(left, scale);
  const b = toScaled(right, scale);
  return a === b ? 0 : a < b ? -1 : 1;
}

/** Exact sum of numeric literals. Assumes every input is a numeric literal. */
export function sumDecimals(values: readonly string[]): string {
  const scale = Math.max(...values.map((value) => decimalScale(value)));
  const total = values.reduce((sum, value) => sum + toScaled(value, scale), 0n);
  return fromScaled(total, scale);
}
