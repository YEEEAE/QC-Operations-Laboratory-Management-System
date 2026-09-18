/**
 * Digital rule (paper-form convention, no conflicting approved rule exists):
 *   reject % = rejectQty / goodQty * 100
 * Computed server-side from numeric inputs only — a client-supplied percentage
 * is never trusted. goodQty = 0 yields null (undefined percentage), never
 * Infinity or a divide-by-zero error. Result is rounded to 4 decimals.
 */
export function computeRejectPercent(rejectQty: number, goodQty: number): number | null {
  if (!Number.isFinite(rejectQty) || !Number.isFinite(goodQty)) return null;
  if (rejectQty < 0 || goodQty < 0) return null;
  if (goodQty === 0) return null;
  return Math.round((rejectQty / goodQty) * 100 * 10_000) / 10_000;
}
