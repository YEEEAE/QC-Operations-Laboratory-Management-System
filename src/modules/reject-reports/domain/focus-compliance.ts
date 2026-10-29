/**
 * Manual QC Compliance tracking for Focus. This is an internal record only;
 * it deliberately defines no Focus API, upload contract, or automatic sync.
 */
export type FocusComplianceStatus =
  | 'PENDING_ENTRY'
  | 'ENTERED_UNVERIFIED'
  | 'VERIFIED'
  | 'FAILED_OR_REQUIRES_REVIEW'
  | 'CORRECTED';

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
  reportRevision?: bigint;
  focusEntryDate?: Date;
  focusEntryAt?: Date;
  externalReference?: string;
  reconciliationState: 'NOT_RECONCILED' | 'MATCHED' | 'MISMATCH_REQUIRES_REVIEW' | 'CORRECTED';
  reportedQty?: string;
  reportedLot?: string;
  reportedReportNumber?: string;
  reconciliationEvents?: FocusReconciliationEvent[];
}

export interface FocusReconciliationEvent {
  id: string;
  reportRevision: bigint;
  action: 'MISMATCH_RECORDED' | 'MATCH_CONFIRMED' | 'CORRECTION_RECORDED';
  expectedQty?: string;
  reportedQty: string;
  expectedLot?: string;
  reportedLot?: string;
  expectedReportNumber: string;
  reportedReportNumber: string;
  evidenceNote: string;
  evidenceFileId?: string;
  actorId: string;
  occurredAt: Date;
}

export type FocusComplianceTransition =
  | {
      kind: 'ENTERED_IN_FOCUS';
      actorId: string;
      evidenceNote?: string;
      evidenceFileId?: string;
      focusEntryAt: Date;
      externalReference?: string;
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
    if (current.status !== 'PENDING_ENTRY')
      throw new AppError('VALIDATION_FAILED');
    if (!transition.focusEntryAt || !Number.isFinite(transition.focusEntryAt.getTime()))
      throw new AppError('VALIDATION_FAILED');
    return {
      ...current,
      status: 'ENTERED_UNVERIFIED',
      entryEvidenceNote: transition.evidenceNote?.trim() || undefined,
      entryEvidenceFileId: transition.evidenceFileId,
      enteredBy: transition.actorId,
      enteredAt: transition.occurredAt,
      focusEntryAt: transition.focusEntryAt,
      focusEntryDate: (() => {
        const factoryTime = new Date(transition.focusEntryAt.getTime() + 3 * 60 * 60 * 1000);
        return new Date(Date.UTC(factoryTime.getUTCFullYear(), factoryTime.getUTCMonth(), factoryTime.getUTCDate()));
      })(),
      externalReference: transition.externalReference?.trim() || undefined,
      reportRevision: current.reportRevision,
      version: current.version + 1n,
    };
  }

  if (current.status !== 'ENTERED_UNVERIFIED' && current.status !== 'CORRECTED')
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

