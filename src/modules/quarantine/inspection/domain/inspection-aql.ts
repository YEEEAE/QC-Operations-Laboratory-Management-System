import { AppError } from '../../../../shared/errors/app-error.js';

/**
 * QC-DATA-002 — Structured AQL / sampling report facts.
 *
 * The paper QC forms carry AQL, Code Letter, Sample Level, Sample Size,
 * Accept / Reject numbers and the observed defects. These are stored as
 * structured report columns — never as free-text remarks — and are always
 * operator-supplied from the approved AQL source: no AQL rule/table is
 * automated anywhere in this project, so no code here computes one.
 */

export const AQL_SAMPLING_RESULTS = ['ACCEPT', 'REJECT', 'NOT_APPLICABLE'] as const;
export type AqlSamplingResult = (typeof AQL_SAMPLING_RESULTS)[number];

export interface AqlSampling {
  aql: string;
  codeLetter?: string;
  inspectionLevel?: string;
  sampleSize: string;
  acceptNumber: string;
  rejectNumber: string;
  observedDefects?: string;
  samplingResult: AqlSamplingResult;
  /** Approved source/reference the numbers were taken from (mandatory). */
  sourceReference: string;
}

const NUMERIC_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;

function requiredText(value: string | undefined, field: string): string {
  const trimmed = value?.trim();
  if (!trimmed) throw new AppError('VALIDATION_FAILED', { userSafe: true, messageKey: field });
  return trimmed;
}

function requiredNumeric(value: string | undefined, field: string): string {
  const trimmed = value?.trim();
  if (!trimmed || !NUMERIC_PATTERN.test(trimmed))
    throw new AppError('VALIDATION_FAILED', { userSafe: true, messageKey: field });
  return trimmed;
}

/**
 * Validate operator-supplied AQL data. Fails closed on any missing field:
 * a partial AQL block is never stored, because a half-recorded sampling
 * decision is worse than none.
 */
export function validateAqlSampling(input: AqlSampling): AqlSampling {
  return {
    aql: requiredText(input.aql, 'aql'),
    codeLetter: input.codeLetter?.trim() || undefined,
    inspectionLevel: input.inspectionLevel?.trim() || undefined,
    sampleSize: requiredNumeric(input.sampleSize, 'sampleSize'),
    acceptNumber: requiredNumeric(input.acceptNumber, 'acceptNumber'),
    rejectNumber: requiredNumeric(input.rejectNumber, 'rejectNumber'),
    observedDefects: input.observedDefects?.trim() || undefined,
    samplingResult: input.samplingResult,
    // The approved AQL reference is mandatory: numbers without their source
    // cannot be traced or reviewed.
    sourceReference: requiredText(input.sourceReference, 'sourceReference'),
  };
}

export function isAqlSamplingResult(value: unknown): value is AqlSamplingResult {
  return typeof value === 'string' && (AQL_SAMPLING_RESULTS as readonly string[]).includes(value);
}
