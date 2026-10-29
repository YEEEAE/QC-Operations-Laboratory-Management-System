/**
 * In-process control read model.
 *
 * These shapes are shared by the owning repository port, the application use
 * cases, and the delivery pages. They describe stored evidence only: no field
 * here is an approved limit, an official result, or a product release state.
 */

export interface InProcessSourceFile {
  fileId: string;
  fileRole: string;
  filename: string;
  sha256: string;
}

/** An EFFECTIVE controlled document version pinned at run start. */
export interface InProcessSourceDocument {
  documentId: string;
  documentVersionId: string;
  documentNo: string;
  documentType: string;
  title: string;
  revision: string;
  contentHash: string;
  effectiveAt: Date;
  sourceFileDigest: string;
  sourceFiles: readonly InProcessSourceFile[];
}

export type InProcessRunState =
  | 'IN_PROGRESS'
  | 'AWAITING_QC_REVIEW'
  | 'RETURNED'
  | 'QC_REVIEWED'
  | 'CLOSED';

export type InProcessDisposition =
  | 'ACCEPTED_FOR_CONTINUATION'
  | 'QC_HOLD_REQUESTED'
  | 'ESCALATED';

export type InProcessFormAttachmentState = 'ATTACHED' | 'NOT_ATTACHED_SOURCE_REQUIRED';

export type InProcessQcHoldState = 'NONE' | 'REQUESTED' | 'ACKNOWLEDGED' | 'DECLINED';

export interface InProcessRun {
  id: string;
  runNo: string;
  itemCode: string;
  itemName: string;
  lotNo: string;
  workOrderNo: string | null;
  batchNo: string | null;
  productionLine: string;
  station: string | null;
  machine: string | null;
  shiftCode: string;
  state: InProcessRunState;
  wi: {
    documentId: string;
    documentVersionId: string;
    documentNo: string;
    revision: string;
    contentHash: string;
    effectiveAt: Date;
    sourceFileDigest: string;
    sourceFiles: readonly InProcessSourceFile[];
    applicabilityAssertedBy: string;
    applicabilityVerifiedBy: string | null;
    applicabilityVerifiedAt: Date | null;
  };
  form: {
    attachmentState: InProcessFormAttachmentState;
    documentId: string | null;
    documentVersionId: string | null;
    documentNo: string | null;
    revision: string | null;
    contentHash: string | null;
    sourceFiles: readonly InProcessSourceFile[] | null;
  };
  operatorId: string;
  operatorLoginIdentity: string;
  qcObserverId: string | null;
  qcObserverLoginIdentity: string | null;
  qcHoldState: InProcessQcHoldState;
  /** Structurally always NOT_RELEASED: an in-process run cannot release product. */
  productReleaseState: 'NOT_RELEASED';
  disposition: InProcessDisposition | null;
  dispositionNote: string | null;
  startedAt: Date;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  closedAt: Date | null;
  version: bigint;
  requestId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type InProcessCheckpointVerification = 'UNVERIFIED' | 'QC_VERIFIED';

export interface InProcessCheckpoint {
  id: string;
  runId: string;
  position: number;
  stepReference: string;
  parameterName: string;
  unit: string | null;
  frequencyText: string;
  samplingText: string | null;
  acceptanceCriteriaText: string;
  lowerLimitText: string | null;
  upperLimitText: string | null;
  requirementSource: 'WI_TRANSCRIPTION';
  wiRevision: string;
  verificationState: InProcessCheckpointVerification;
  transcribedBy: string;
  transcribedLoginIdentity: string;
  transcribedAt: Date;
  verifiedBy: string | null;
  verifiedAt: Date | null;
  verifiedAgainstRevision: string | null;
  version: bigint;
}

export type InProcessReadingEntryState = 'DRAFT' | 'RECORDED' | 'SUPERSEDED';

export type InProcessComparisonState =
  | 'NOT_COMPARABLE'
  | 'WITHIN_TRANSCRIBED_LIMITS'
  | 'OUTSIDE_TRANSCRIBED_LIMITS'
  | 'QUALITATIVE_RECORDED';

export interface InProcessReading {
  id: string;
  runId: string;
  checkpointId: string;
  sampleReference: string | null;
  entryState: InProcessReadingEntryState;
  valueText: string;
  unit: string | null;
  observedAt: Date;
  comparisonState: InProcessComparisonState;
  comparisonNote: string | null;
  recordedBy: string;
  recordedLoginIdentity: string;
  recordedAt: Date;
  supersededByReadingId: string | null;
  supersededAt: Date | null;
  supersededReason: string | null;
  requestId: string;
}

export type InProcessDeviationCategory =
  | 'PROCESS_PARAMETER'
  | 'MATERIAL'
  | 'EQUIPMENT'
  | 'DOCUMENT'
  | 'OTHER';

export type InProcessDeviationSeverity =
  | 'PENDING_QC_CLASSIFICATION'
  | 'MINOR'
  | 'MAJOR'
  | 'CRITICAL';

export type InProcessDeviationStatus =
  | 'OPEN'
  | 'UNDER_QC_REVIEW'
  | 'ACCEPTED_FOR_CONTINUATION'
  | 'ESCALATED'
  | 'CLOSED';

export interface InProcessDeviation {
  id: string;
  deviationNo: string;
  runId: string;
  runRevision: bigint;
  checkpointId: string | null;
  readingId: string | null;
  category: InProcessDeviationCategory;
  severity: InProcessDeviationSeverity;
  description: string;
  containmentState: 'DEFINED' | 'NOT_YET_DEFINED';
  immediateContainment: string | null;
  status: InProcessDeviationStatus;
  dispositionNote: string | null;
  classifiedBy: string | null;
  classifiedAt: Date | null;
  flaggedBy: string;
  flaggedLoginIdentity: string;
  flaggedAt: Date;
  snapshotSha256: string;
  requestId: string;
}

export type InProcessHoldStatus = 'REQUESTED' | 'ACKNOWLEDGED' | 'DECLINED';

export interface InProcessHoldRequest {
  id: string;
  runId: string;
  runRevision: bigint;
  deviationId: string | null;
  reason: string;
  status: InProcessHoldStatus;
  decisionNote: string | null;
  requestedBy: string;
  requestedLoginIdentity: string;
  requestedAt: Date;
  decidedBy: string | null;
  decidedAt: Date | null;
  requestId: string;
}

export type InProcessHandoverStatus = 'PENDING_ACCEPTANCE' | 'ACCEPTED' | 'CANCELLED';

/** Cross-shift continuation. A handover moves operational custody, not authority. */
export interface InProcessHandover {
  id: string;
  runId: string;
  runRevision: bigint;
  fromShiftCode: string;
  toShiftCode: string;
  fromOperatorId: string;
  toOperatorId: string | null;
  handoverNote: string;
  status: InProcessHandoverStatus;
  handedOverBy: string;
  handedOverLoginIdentity: string;
  handedOverAt: Date;
  acceptedBy: string | null;
  acceptedAt: Date | null;
  requestId: string;
}

export type InProcessRunEventType =
  | 'STARTED'
  | 'WI_APPLICABILITY_VERIFIED'
  | 'CHECKPOINT_TRANSCRIBED'
  | 'CHECKPOINT_VERIFIED'
  | 'READING_DRAFTED'
  | 'READING_RECORDED'
  | 'READING_SUPERSEDED'
  | 'DEVIATION_FLAGGED'
  | 'DEVIATION_CLASSIFIED'
  | 'DEVIATION_DISPOSITIONED'
  | 'HOLD_REQUESTED'
  | 'HOLD_DECIDED'
  | 'HANDOVER_RECORDED'
  | 'HANDOVER_ACCEPTED'
  | 'SUBMITTED'
  | 'RETURNED'
  | 'QC_REVIEWED'
  | 'CLOSED';

/** Immutable revision snapshot of the run at one event. */
export interface InProcessRunEvent {
  id: string;
  runId: string;
  revisionNumber: bigint;
  eventType: InProcessRunEventType;
  actorId: string;
  actorLoginIdentity: string;
  reason: string | null;
  snapshotSha256: string;
  occurredAt: Date;
  requestId: string;
}

export interface InProcessWorkspace {
  run: InProcessRun;
  checkpoints: readonly InProcessCheckpoint[];
  readings: readonly InProcessReading[];
  deviations: readonly InProcessDeviation[];
  holdRequests: readonly InProcessHoldRequest[];
  handovers: readonly InProcessHandover[];
  events: readonly InProcessRunEvent[];
}

export interface InProcessRunSummary {
  id: string;
  runNo: string;
  itemCode: string;
  itemName: string;
  lotNo: string;
  productionLine: string;
  shiftCode: string;
  state: InProcessRunState;
  qcHoldState: InProcessQcHoldState;
  wiDocumentNo: string;
  wiRevision: string;
  formAttachmentState: InProcessFormAttachmentState;
  operatorId: string;
  operatorLoginIdentity: string;
  startedAt: Date;
  version: bigint;
}

export interface InProcessSourceCatalogue {
  workInstructions: readonly InProcessSourceDocument[];
  controlledForms: readonly InProcessSourceDocument[];
  /** Explicit fail-closed state when no effective work instruction exists. */
  state: 'WI_SOURCE_REQUIRED' | 'WI_SOURCE_AVAILABLE';
}
