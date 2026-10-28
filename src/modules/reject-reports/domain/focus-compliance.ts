/**
 * Manual QC Compliance tracking for Focus. This is an internal record only;
 * it deliberately defines no Focus API, upload contract, or automatic sync.
 */
export type FocusComplianceStatus =
  | 'PENDING_FOCUS_ENTRY'
  | 'ENTERED_IN_FOCUS'
  | 'VERIFIED';

export interface EventDeliveryStatus {
  sourceEventId: string;
  deliveryTarget: string;
  status: 'PENDING' | 'SENT' | 'CONFIRMED' | 'FAILED';
  sourceEventReference: string;
  evidenceNote?: string;
  evidenceFileId?: string;
  recordedAt: Date;
}

export interface FocusComplianceEntry {
  id: string;
  sourceEventId: string;
  reportId: string;
  status: FocusComplianceStatus;
  entryEvidenceNote?: string;
  entryEvidenceFileId?: string;
  enteredBy?: string;
  enteredAt?: Date;
  verificationEvidenceNote?: string;
  verificationEvidenceFileId?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  version: bigint;
}

export type FocusComplianceTransition =
  | {
      kind: 'ENTERED_IN_FOCUS';
      actorId: string;
      evidenceNote?: string;
      evidenceFileId?: string;
      occurredAt: Date;
    }
  | {
      kind: 'VERIFIED';
      actorId: string;
      evidenceNote?: string;
      evidenceFileId?: string;
      occurredAt: Date;
    };

export function applyFocusComplianceTransition(
  current: FocusComplianceEntry,
  transition: FocusComplianceTransition,
): FocusComplianceEntry {
  const hasEvidence = Boolean(
    transition.evidenceFileId || transition.evidenceNote?.trim(),
  );
  if (!hasEvidence || !transition.actorId)
    throw new AppError('VALIDATION_FAILED');

  if (transition.kind === 'ENTERED_IN_FOCUS') {
    if (current.status !== 'PENDING_FOCUS_ENTRY')
      throw new AppError('VALIDATION_FAILED');
    return {
      ...current,
      status: 'ENTERED_IN_FOCUS',
      entryEvidenceNote: transition.evidenceNote?.trim() || undefined,
      entryEvidenceFileId: transition.evidenceFileId,
      enteredBy: transition.actorId,
      enteredAt: transition.occurredAt,
      version: current.version + 1n,
    };
  }

  if (current.status !== 'ENTERED_IN_FOCUS')
    throw new AppError('VALIDATION_FAILED');
  if (current.enteredBy === transition.actorId)
    throw new AppError('VALIDATION_FAILED');
  return {
    ...current,
    status: 'VERIFIED',
    verificationEvidenceNote: transition.evidenceNote?.trim() || undefined,
    verificationEvidenceFileId: transition.evidenceFileId,
    verifiedBy: transition.actorId,
    verifiedAt: transition.occurredAt,
    version: current.version + 1n,
  };
}
import { AppError } from '../../../shared/errors/app-error.js';

