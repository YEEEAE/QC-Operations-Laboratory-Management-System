/**
 * Presentation copy for the in-process workspace. Labels describe stored
 * state; they never turn a comparison, review, or closure into a scientific
 * result, an approval, or a product release.
 */
export const RUN_STATE_LABELS: Readonly<Record<string, string>> = Object.freeze({
  IN_PROGRESS: 'In progress',
  AWAITING_QC_REVIEW: 'Awaiting QC review',
  RETURNED: 'Returned for correction',
  QC_REVIEWED: 'QC reviewed',
  CLOSED: 'Closed',
});

export const HOLD_STATE_LABELS: Readonly<Record<string, string>> = Object.freeze({
  NONE: 'No QC hold request',
  REQUESTED: 'QC hold requested',
  ACKNOWLEDGED: 'QC hold acknowledged',
  DECLINED: 'QC hold request declined',
});

export const COMPARISON_LABELS: Readonly<Record<string, string>> = Object.freeze({
  NOT_COMPARABLE: 'Not compared',
  WITHIN_TRANSCRIBED_LIMITS: 'Within transcribed bounds',
  OUTSIDE_TRANSCRIBED_LIMITS: 'Outside transcribed bounds',
  QUALITATIVE_RECORDED: 'Qualitative criterion recorded',
});

export const ENTRY_STATE_LABELS: Readonly<Record<string, string>> = Object.freeze({
  DRAFT: 'Draft entry',
  RECORDED: 'Recorded entry',
  SUPERSEDED: 'Superseded entry',
});

export const DEVIATION_STATUS_LABELS: Readonly<Record<string, string>> = Object.freeze({
  OPEN: 'Open',
  UNDER_QC_REVIEW: 'Under QC review',
  ACCEPTED_FOR_CONTINUATION: 'Accepted for continuation',
  ESCALATED: 'Escalated',
  CLOSED: 'Closed',
});

export const SEVERITY_LABELS: Readonly<Record<string, string>> = Object.freeze({
  PENDING_QC_CLASSIFICATION: 'Pending QC classification',
  MINOR: 'Minor',
  MAJOR: 'Major',
  CRITICAL: 'Critical',
});

export const CATEGORY_LABELS: Readonly<Record<string, string>> = Object.freeze({
  PROCESS_PARAMETER: 'Process parameter',
  MATERIAL: 'Material',
  EQUIPMENT: 'Equipment',
  DOCUMENT: 'Document',
  OTHER: 'Other',
});

export const DISPOSITION_LABELS: Readonly<Record<string, string>> = Object.freeze({
  ACCEPTED_FOR_CONTINUATION: 'Accepted as recorded for process continuation',
  QC_HOLD_REQUESTED: 'QC hold requested',
  ESCALATED: 'Escalated for quality decision',
});

export const HANDOVER_STATUS_LABELS: Readonly<Record<string, string>> = Object.freeze({
  PENDING_ACCEPTANCE: 'Awaiting incoming operator acceptance',
  ACCEPTED: 'Accepted',
  CANCELLED: 'Cancelled',
});

const MESSAGE_KEYS: Readonly<Record<string, string>> = Object.freeze({
  'in-process.wi-source-required':
    'No product-specific effective work instruction is available. Recording an in-process check without one is blocked.',
  'in-process.checkpoint-source-verification-required':
    'This checkpoint has not been QC verified against the pinned work instruction, so a reading cannot be recorded against it.',
});

export function describeInProcessError(messageKey: unknown, fallback: string): string {
  if (typeof messageKey === 'string' && MESSAGE_KEYS[messageKey]) return MESSAGE_KEYS[messageKey];
  return fallback;
}
