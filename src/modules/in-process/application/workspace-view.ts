import type { ActorContext } from '../../../shared/authorization/types.js';
import type { PermissionCode } from '../../../shared/authorization/permissions.js';
import type {
  InProcessCheckpoint,
  InProcessDeviation,
  InProcessHandover,
  InProcessHoldRequest,
  InProcessReading,
  InProcessRun,
  InProcessRunEvent,
} from '../domain/read-model.js';
import { submissionBlockers } from '../domain/run.js';

export type InProcessCapabilities = Readonly<Record<string, boolean>>;

const CAPABILITY_PERMISSIONS: Readonly<Record<string, PermissionCode>> = Object.freeze({
  startRun: 'PERM-INP-CREATE',
  transcribeCheckpoint: 'PERM-INP-RECORD',
  recordReading: 'PERM-INP-RECORD',
  verifyCheckpoint: 'PERM-INP-VERIFY',
  flagDeviation: 'PERM-INP-DEVIATION',
  disposeDeviation: 'PERM-INP-REVIEW',
  requestHold: 'PERM-INP-HOLD',
  decideHold: 'PERM-INP-REVIEW',
  recordHandover: 'PERM-INP-HANDOVER',
  acceptHandover: 'PERM-INP-HANDOVER',
  submitRun: 'PERM-INP-SUBMIT',
  reviewRun: 'PERM-INP-REVIEW',
  closeRun: 'PERM-INP-CLOSE',
});

/**
 * Presentation-only capability projection. Hiding a control is never
 * authorization: every use case re-checks its own permission server-side.
 */
export function inProcessCapabilities(actor: ActorContext | undefined): InProcessCapabilities {
  const capabilities: Record<string, boolean> = {};
  for (const [name, permission] of Object.entries(CAPABILITY_PERMISSIONS)) {
    capabilities[name] =
      actor !== undefined &&
      actor.permissions.some((grant) => grant.code === permission && grant.active !== false);
  }
  return capabilities;
}

/** Permissions the module still needs before its writes can be performed. */
export const IN_PROCESS_WRITE_PERMISSIONS = Object.freeze([
  'PERM-INP-CREATE',
  'PERM-INP-RECORD',
  'PERM-INP-VERIFY',
  'PERM-INP-DEVIATION',
  'PERM-INP-HOLD',
  'PERM-INP-HANDOVER',
  'PERM-INP-SUBMIT',
  'PERM-INP-REVIEW',
  'PERM-INP-CLOSE',
] as const satisfies readonly PermissionCode[]);

export function missingWritePermissions(actor: ActorContext): readonly PermissionCode[] {
  return IN_PROCESS_WRITE_PERMISSIONS.filter(
    (code) => !actor.permissions.some((grant) => grant.code === code && grant.active !== false),
  );
}

export interface CheckpointView {
  checkpoint: InProcessCheckpoint;
  readings: readonly InProcessReading[];
  recordedCount: number;
  draftCount: number;
  /** Readings whose comparison sits outside the transcribed bounds. */
  outsideLimitCount: number;
}

export interface InProcessWorkspaceView {
  run: InProcessRun;
  checkpoints: readonly CheckpointView[];
  deviations: readonly InProcessDeviation[];
  holdRequests: readonly InProcessHoldRequest[];
  handovers: readonly InProcessHandover[];
  events: readonly InProcessRunEvent[];
  capabilities: InProcessCapabilities;
  submissionBlockers: readonly string[];
  closeBlockers: readonly string[];
  /** Readings outside transcribed limits without any flagged deviation. */
  unmanagedOutsideLimitReadingIds: readonly string[];
  pendingHandover: InProcessHandover | undefined;
  productReleaseStatement: string;
}

export const PRODUCT_RELEASE_STATEMENT =
  'An in-process run records process evidence only. Closing it is not a product release, ' +
  'not a scientific PASS/FAIL result, and not an approval.';

export function buildWorkspaceView(input: {
  run: InProcessRun;
  checkpoints: readonly InProcessCheckpoint[];
  readings: readonly InProcessReading[];
  deviations: readonly InProcessDeviation[];
  holdRequests: readonly InProcessHoldRequest[];
  handovers: readonly InProcessHandover[];
  events: readonly InProcessRunEvent[];
  actor: ActorContext;
}): InProcessWorkspaceView {
  const { run, readings, deviations } = input;
  const checkpointViews: CheckpointView[] = input.checkpoints.map((checkpoint) => {
    const checkpointReadings = readings.filter((reading) => reading.checkpointId === checkpoint.id);
    return {
      checkpoint,
      readings: checkpointReadings,
      recordedCount: checkpointReadings.filter((reading) => reading.entryState === 'RECORDED').length,
      draftCount: checkpointReadings.filter((reading) => reading.entryState === 'DRAFT').length,
      outsideLimitCount: checkpointReadings.filter(
        (reading) =>
          reading.entryState !== 'SUPERSEDED' &&
          reading.comparisonState === 'OUTSIDE_TRANSCRIBED_LIMITS',
      ).length,
    };
  });

  const deviatedReadingIds = new Set(
    deviations.map((deviation) => deviation.readingId).filter((id): id is string => id !== null),
  );
  const unmanagedOutsideLimitReadingIds = readings
    .filter(
      (reading) =>
        reading.entryState === 'RECORDED' &&
        reading.comparisonState === 'OUTSIDE_TRANSCRIBED_LIMITS' &&
        !deviatedReadingIds.has(reading.id),
    )
    .map((reading) => reading.id);

  const blockers = submissionBlockers({
    hasVerifiedCheckpoint: checkpointViews.some(
      (view) => view.checkpoint.verificationState === 'QC_VERIFIED',
    ),
    hasRecordedReading: checkpointViews.some((view) => view.recordedCount > 0),
    hasUnverifiedCheckpoint: checkpointViews.some(
      (view) => view.checkpoint.verificationState !== 'QC_VERIFIED',
    ),
    hasDraftReading: checkpointViews.some((view) => view.draftCount > 0),
    unmanagedOutsideLimitReadingCount: unmanagedOutsideLimitReadingIds.length,
  });

  const closeBlockers: string[] = [];
  const unresolvedDeviations = deviations.filter((deviation) =>
    ['OPEN', 'UNDER_QC_REVIEW'].includes(deviation.status),
  );
  if (unresolvedDeviations.length)
    closeBlockers.push(
      `${unresolvedDeviations.length} deviation(s) still need a recorded human disposition.`,
    );
  if (input.holdRequests.some((hold) => hold.status === 'REQUESTED'))
    closeBlockers.push('An undecided QC hold request must be acknowledged or declined first.');
  if (run.state !== 'QC_REVIEWED')
    closeBlockers.push('The run must be QC reviewed before it can be closed.');

  return {
    run,
    checkpoints: checkpointViews,
    deviations,
    holdRequests: input.holdRequests,
    handovers: input.handovers,
    events: input.events,
    capabilities: inProcessCapabilities(input.actor),
    submissionBlockers: blockers,
    closeBlockers,
    unmanagedOutsideLimitReadingIds,
    pendingHandover: input.handovers.find((handover) => handover.status === 'PENDING_ACCEPTANCE'),
    productReleaseStatement: PRODUCT_RELEASE_STATEMENT,
  };
}
