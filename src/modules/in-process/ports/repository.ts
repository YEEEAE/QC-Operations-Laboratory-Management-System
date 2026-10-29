import type { ActorContext } from '../../../shared/authorization/types.js';
import type {
  InProcessCheckpoint,
  InProcessDeviation,
  InProcessDeviationCategory,
  InProcessDeviationSeverity,
  InProcessDisposition,
  InProcessHandover,
  InProcessHoldRequest,
  InProcessReading,
  InProcessRun,
  InProcessRunSummary,
  InProcessSourceCatalogue,
  InProcessWorkspace,
} from '../domain/read-model.js';

/** Every run-scoped write locks the run row and rechecks this version. */
export interface RunVersionedCommand {
  runId: string;
  expectedVersion: bigint;
  actor: ActorContext;
  requestId: string;
}

export interface StartInProcessRunInput {
  itemCode: string;
  itemName: string;
  lotNo: string;
  workOrderNo?: string;
  batchNo?: string;
  productionLine: string;
  station?: string;
  machine?: string;
  shiftCode: string;
  /** Pinned controlled document version; validated as EFFECTIVE inside the write. */
  wiDocumentVersionId: string;
  formDocumentVersionId?: string;
  actor: ActorContext;
  requestId: string;
}

export interface TranscribeCheckpointInput extends RunVersionedCommand {
  stepReference: string;
  parameterName: string;
  unit?: string;
  frequencyText: string;
  samplingText?: string;
  acceptanceCriteriaText: string;
  lowerLimitText?: string;
  upperLimitText?: string;
}

export interface VerifyCheckpointInput extends RunVersionedCommand {
  checkpointId: string;
  checkpointVersion: bigint;
}

export interface RecordReadingInput extends RunVersionedCommand {
  checkpointId: string;
  entryState: 'DRAFT' | 'RECORDED';
  valueText: string;
  unit?: string;
  observedAt: Date;
  sampleReference?: string;
}

export interface FlagDeviationInput extends RunVersionedCommand {
  category: InProcessDeviationCategory;
  description: string;
  containmentState: 'DEFINED' | 'NOT_YET_DEFINED';
  immediateContainment?: string;
  checkpointId?: string;
  readingId?: string;
}

export interface DisposeDeviationInput extends RunVersionedCommand {
  deviationId: string;
  deviationVersion?: bigint;
  severity: Exclude<InProcessDeviationSeverity, 'PENDING_QC_CLASSIFICATION'>;
  status: 'ACCEPTED_FOR_CONTINUATION' | 'ESCALATED' | 'CLOSED';
  dispositionNote: string;
}

export interface RequestHoldInput extends RunVersionedCommand {
  reason: string;
  deviationId?: string;
}

export interface DecideHoldInput extends RunVersionedCommand {
  holdRequestId: string;
  decision: 'ACKNOWLEDGED' | 'DECLINED';
  decisionNote: string;
}

export interface RecordHandoverInput extends RunVersionedCommand {
  toShiftCode: string;
  handoverNote: string;
}

export interface AcceptHandoverInput extends RunVersionedCommand {
  handoverId: string;
}

export interface SubmitInProcessRunInput extends RunVersionedCommand {
  /** Server-derived blockers; a non-empty list rejects the submission. */
  blockers: readonly string[];
}

export interface ReviewInProcessRunInput extends RunVersionedCommand {
  action: 'RETURN' | 'QC_REVIEW';
  reason: string;
}

export interface CloseInProcessRunInput extends RunVersionedCommand {
  disposition: InProcessDisposition;
  dispositionNote: string;
}

export interface InProcessRepository {
  listRuns(): Promise<readonly InProcessRunSummary[]>;
  getRun(runId: string): Promise<InProcessWorkspace | undefined>;
  listSourceCatalogue(): Promise<InProcessSourceCatalogue>;
  startRun(input: StartInProcessRunInput): Promise<InProcessRun>;
  transcribeCheckpoint(input: TranscribeCheckpointInput): Promise<InProcessCheckpoint>;
  verifyCheckpoint(input: VerifyCheckpointInput): Promise<InProcessCheckpoint>;
  recordReading(input: RecordReadingInput): Promise<InProcessReading>;
  flagDeviation(input: FlagDeviationInput): Promise<InProcessDeviation>;
  disposeDeviation(input: DisposeDeviationInput): Promise<InProcessDeviation>;
  requestHold(input: RequestHoldInput): Promise<InProcessHoldRequest>;
  decideHold(input: DecideHoldInput): Promise<InProcessHoldRequest>;
  recordHandover(input: RecordHandoverInput): Promise<InProcessHandover>;
  acceptHandover(input: AcceptHandoverInput): Promise<InProcessHandover>;
  submitRun(input: SubmitInProcessRunInput): Promise<InProcessRun>;
  reviewRun(input: ReviewInProcessRunInput): Promise<InProcessRun>;
  closeRun(input: CloseInProcessRunInput): Promise<InProcessRun>;
}
