function parts(value: string): { coefficient: bigint; scale: number } | null {
  if (!/^\d+(?:\.\d+)?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  return { coefficient: BigInt(`${whole}${fraction}`), scale: fraction.length };
}

function normalized(coefficient: bigint, scale: number): string {
  if (coefficient === 0n) return '0';
  const padded = coefficient.toString().padStart(scale + 1, '0');
  const whole = scale ? padded.slice(0, -scale) : padded;
  const fraction = scale ? padded.slice(-scale).replace(/0+$/, '') : '';
  return fraction ? `${whole}.${fraction}` : whole;
}

/** Exact addition for non-negative decimal strings. */
export function addDecimalStrings(values: readonly string[]): string {
  const parsed = values.map(parts);
  if (parsed.some((value) => value === null)) throw new TypeError('Invalid decimal string');
  const decimals = parsed as { coefficient: bigint; scale: number }[];
  const scale = Math.max(0, ...decimals.map((value) => value.scale));
  const coefficient = decimals.reduce(
    (sum, value) => sum + value.coefficient * 10n ** BigInt(scale - value.scale),
    0n,
  );
  return normalized(coefficient, scale);
}

/** Exact comparison for validated non-negative decimal strings. */
export function compareDecimalStrings(left: string, right: string): number {
  const a = parts(left);
  const b = parts(right);
  if (!a || !b) throw new TypeError('Invalid decimal string');
  const scale = Math.max(a.scale, b.scale);
  const leftValue = a.coefficient * 10n ** BigInt(scale - a.scale);
  const rightValue = b.coefficient * 10n ** BigInt(scale - b.scale);
  return leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0;
}

/**
 * Digital rule (paper-form convention): rejectQty / goodQty * 100, rounded
 * half-up to the approved four decimal places. Inputs stay decimal strings so
 * PostgreSQL NUMERIC values never pass through IEEE-754. A zero good quantity
 * remains undefined (NULL), never infinity or a divide-by-zero error.
 */
export function computeRejectPercent(rejectQty: string, goodQty: string): string | null {
  const reject = parts(rejectQty);
  const good = parts(goodQty);
  if (!reject || !good) return null;
  if (good.coefficient === 0n) return null;
  const scale = Math.max(reject.scale, good.scale);
  const rejectValue = reject.coefficient * 10n ** BigInt(scale - reject.scale);
  const goodValue = good.coefficient * 10n ** BigInt(scale - good.scale);
  const scaledNumerator = rejectValue * 1_000_000n;
  const quotient = scaledNumerator / goodValue;
  const remainder = scaledNumerator % goodValue;
  const rounded = quotient + (remainder * 2n >= goodValue ? 1n : 0n);
  return normalized(rounded, 4);
}
