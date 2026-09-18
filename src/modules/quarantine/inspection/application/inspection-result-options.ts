/**
 * Delivery-safe projection of the canonical inspection final-result vocabulary.
 *
 * Pages must not import the inspection domain directly (architecture
 * `delivery-domain-import` gate), and copying the list into each register would
 * let the filter drift from the state machine. This re-export keeps exactly one
 * source of truth for the values `PASS | FAIL | HOLD`.
 */
export { FINAL_RESULTS } from '../domain/inspection-result.js';
export type { FinalResult } from '../domain/inspection-result.js';
