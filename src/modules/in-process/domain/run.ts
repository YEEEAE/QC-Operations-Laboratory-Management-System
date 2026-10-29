import { AppError } from '../../../shared/errors/app-error.js';
import type {
  InProcessCheckpoint,
  InProcessComparisonState,
  InProcessDisposition,
  InProcessRunState,
} from './read-model.js';

export const IN_PROCESS_RUN_STATES = [
  'IN_PROGRESS',
  'AWAITING_QC_REVIEW',
  'RETURNED',
  'QC_REVIEWED',
  'CLOSED',
] as const satisfies readonly InProcessRunState[];

export const IN_PROCESS_DISPOSITIONS = [
  'ACCEPTED_FOR_CONTINUATION',
  'QC_HOLD_REQUESTED',
  'ESCALATED',
] as const satisfies readonly InProcessDisposition[];

/**
 * Fail-closed source state shown when no product-specific effective work
 * instruction can be resolved. It is a real state, not an empty list: starting
 * or recording an in-process check without a controlling WI is impossible.
 */
export const WI_SOURCE_REQUIRED = 'WI_SOURCE_REQUIRED';

/** A transcribed numeric value or bound. Never coerced through floating point. */
const NON_NEGATIVE_DECIMAL = /^\d+(?:\.\d+)?$/;

export const RUN_STATE_LABELS: Readonly<Record<InProcessRunState, string>> = Object.freeze({
  IN_PROGRESS: 'In progress',
  AWAITING_QC_REVIEW: 'Awaiting QC review',
  RETURNED: 'Returned for correction',
  QC_REVIEWED: 'QC reviewed',
  CLOSED: 'Closed',
});

export const DISPOSITION_LABELS: Readonly<Record<InProcessDisposition, string>> = Object.freeze({
  ACCEPTED_FOR_CONTINUATION: 'Accepted as recorded for process continuation',
  QC_HOLD_REQUESTED: 'QC hold requested',
  ESCALATED: 'Escalated for quality decision',
});

const ALLOWED_TRANSITIONS: Readonly<Record<InProcessRunState, readonly InProcessRunState[]>> =
  Object.freeze({
    IN_PROGRESS: ['AWAITING_QC_REVIEW'],
    AWAITING_QC_REVIEW: ['RETURNED', 'QC_REVIEWED'],
    RETURNED: ['AWAITING_QC_REVIEW'],
    QC_REVIEWED: ['CLOSED'],
    CLOSED: [],
  });

export function assertRunTransition(from: InProcessRunState, to: InProcessRunState): void {
  if (!ALLOWED_TRANSITIONS[from].includes(to))
    throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
}

export function assertRequiredText(value: string | undefined, field: string, maxLength = 2000): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed || trimmed.length > maxLength)
    throw new AppError('VALIDATION_FAILED', { userSafe: true, fieldErrors: { [field]: ['Required.'] } });
  return trimmed;
}

export function optionalText(value: string | undefined, maxLength = 2000): string | null {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return null;
  if (trimmed.length > maxLength) throw new AppError('VALIDATION_FAILED', { userSafe: true });
  return trimmed;
}

export function assertDecimalText(value: string | undefined, field: string): string {
  const trimmed = value?.trim() ?? '';
  if (!NON_NEGATIVE_DECIMAL.test(trimmed))
    throw new AppError('VALIDATION_FAILED', {
      userSafe: true,
      fieldErrors: { [field]: ['Enter a non-negative decimal using digits and an optional decimal point.'] },
    });
  return trimmed;
}

/** Compares two non-negative decimal strings exactly, without floating point. */
export function compareNonNegativeDecimals(left: string, right: string): -1 | 0 | 1 {
  const [leftWhole, leftFraction = ''] = left.split('.');
  const [rightWhole, rightFraction = ''] = right.split('.');
  const scale = Math.max(leftFraction.length, rightFraction.length);
  const toScaled = (whole: string, fraction: string) =>
    BigInt(`${whole}${fraction.padEnd(scale, '0')}`);
  const scaledLeft = toScaled(leftWhole, leftFraction);
  const scaledRight = toScaled(rightWhole, rightFraction);
  return scaledLeft < scaledRight ? -1 : scaledLeft > scaledRight ? 1 : 0;
}

export interface ReadingComparison {
  comparisonState: InProcessComparisonState;
  comparisonNote: string;
}

/**
 * Compares a recorded value with the two bounds TRANSCRIBED from the pinned WI
 * revision. It deliberately produces a comparison statement, never a
 * scientific PASS/FAIL result, and it compares nothing until a QC observer has
 * verified the transcribed criteria against that revision.
 */
export function compareReading(
  input: {
    valueText: string;
    lowerLimitText: string | null;
    upperLimitText: string | null;
  },
  checkpoint: Pick<
    InProcessCheckpoint,
    'verificationState' | 'wiRevision' | 'acceptanceCriteriaText'
  >,
): ReadingComparison {
  if (checkpoint.verificationState !== 'QC_VERIFIED')
    return {
      comparisonState: 'NOT_COMPARABLE',
      comparisonNote:
        'The transcribed criteria for this checkpoint are not QC verified against the pinned work instruction, so no comparison is made.',
    };
  if (input.lowerLimitText === null || input.upperLimitText === null)
    return {
      comparisonState: 'QUALITATIVE_RECORDED',
      comparisonNote:
        `Recorded against the qualitative criterion transcribed from WI revision ${checkpoint.wiRevision}. ` +
        'No numeric comparison applies; the acceptance decision is a human QC judgement.',
    };
  if (!NON_NEGATIVE_DECIMAL.test(input.valueText))
    return {
      comparisonState: 'NOT_COMPARABLE',
      comparisonNote:
        `The recorded value is not a numeric reading, so it cannot be compared with the numeric bounds transcribed from WI revision ${checkpoint.wiRevision}.`,
    };
  if (compareNonNegativeDecimals(input.valueText, input.lowerLimitText) < 0)
    return {
      comparisonState: 'OUTSIDE_TRANSCRIBED_LIMITS',
      comparisonNote:
        `Below the lower bound transcribed from WI revision ${checkpoint.wiRevision}. This is a comparison with transcribed source text, not a scientific result or a release decision.`,
    };
  if (compareNonNegativeDecimals(input.valueText, input.upperLimitText) > 0)
    return {
      comparisonState: 'OUTSIDE_TRANSCRIBED_LIMITS',
      comparisonNote:
        `Above the upper bound transcribed from WI revision ${checkpoint.wiRevision}. This is a comparison with transcribed source text, not a scientific result or a release decision.`,
    };
  return {
    comparisonState: 'WITHIN_TRANSCRIBED_LIMITS',
    comparisonNote:
      `Within the bounds transcribed from WI revision ${checkpoint.wiRevision}. This is a comparison with transcribed source text, not a scientific result or a release decision.`,
  };
}

/**
 * Requirements that make a submitted run reviewable. Any unmet requirement
 * keeps the run open; nothing is inferred or waived.
 */
export function submissionBlockers(input: {
  hasVerifiedCheckpoint: boolean;
  hasRecordedReading: boolean;
  hasUnverifiedCheckpoint: boolean;
  hasDraftReading: boolean;
  unmanagedOutsideLimitReadingCount: number;
}): readonly string[] {
  const blockers: string[] = [];
  if (!input.hasVerifiedCheckpoint)
    blockers.push('No checkpoint has QC-verified criteria transcribed from the pinned work instruction.');
  if (input.hasUnverifiedCheckpoint)
    blockers.push('Every checkpoint must be QC verified before the run can be submitted.');
  if (!input.hasRecordedReading) blockers.push('At least one reading must be recorded.');
  if (input.hasDraftReading) blockers.push('Draft entries remain; record or replace them before submission.');
  if (input.unmanagedOutsideLimitReadingCount > 0)
    blockers.push(
      'Every reading outside the transcribed limits needs a flagged deviation before submission.',
    );
  return blockers;
}
