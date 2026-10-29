import type { BackupRun, RestoreRun } from './backup-record.js';
import {
  recoveryPolicyEffect,
  type RecoveryPolicyVersion,
  type RecoveryPolicyEffect,
} from './recovery-policy.js';

/**
 * Service-level recovery evidence (OPS-01).
 *
 * These facts are derived; none of them is an approved objective. The only
 * numeric thresholds used to judge a fact come from the currently APPROVED
 * policy version. When no approved objective exists the platform reports
 * NOT_CONFIGURED or POLICY_EXPIRED and never substitutes a default duration.
 *
 * Backup verification, restore verification and observed recovery time stay
 * separate: a verified artifact never becomes restore evidence.
 */
export const RECOVERY_READINESS_STATUSES = [
  'NOT_CONFIGURED',
  'POLICY_EXPIRED',
  'BACKUP_MISSING',
  'BACKUP_NOT_VERIFIED',
  'BACKUP_OUTSIDE_RPO',
  'BACKUP_VERIFIED',
  'RESTORE_NOT_VERIFIED',
  'RESTORE_OUTSIDE_RTO',
  'WITHIN_OBJECTIVE',
  'UNKNOWN',
] as const;
export type RecoveryReadinessStatus = (typeof RECOVERY_READINESS_STATUSES)[number];

export interface RecoveryDrillEvidence {
  restoreRunId: string;
  outcome: 'VERIFIED' | 'VERIFICATION_FAILED' | 'BLOCKED';
  completedAt?: Date;
  startedAt?: Date;
  observedRestoreSeconds?: number;
  targetEnvironment?: string;
  knownGaps: readonly string[];
}

export interface RecoveryException {
  id: string;
  reference: string;
  kind: string;
  environment: string;
  detectedAt: Date;
  summary: string;
}

export interface RecoveryReadinessView {
  status: RecoveryReadinessStatus;
  reason: string;
  policy: {
    effect: RecoveryPolicyEffect;
    revision?: number;
    status?: string;
    rpoSeconds?: number;
    rtoSeconds?: number;
    retentionDays?: number;
    immutableBackupCopies?: number;
    responsiblePerson?: string;
    policyReference?: string;
    policyRevision?: string;
    policySourceSha256?: string;
    effectiveFrom?: Date;
    effectiveTo?: Date;
    approvalReference?: string;
    approvedAt?: Date;
  };
  latestBackup?: {
    id: string;
    state: string;
    requestedAt: Date;
    artifactVerified: boolean;
    checksumRecorded: boolean;
    backupAgeSeconds: number;
  };
  drill?: RecoveryDrillEvidence;
  /** Newest recorded drill evidence of any outcome; may be a failure or block. */
  lastDrill?: RecoveryDrillEvidence;
  observedRestoreSeconds?: number;
  backupAgeSeconds?: number;
  unresolvedExceptions: readonly RecoveryException[];
  unresolvedExceptionCount: number;
}

export function evaluateRecoveryReadiness(input: {
  policy?: RecoveryPolicyVersion;
  latestBackup?: BackupRun;
  restoreRuns: readonly RestoreRun[];
  drillEvidence: readonly RecoveryDrillEvidence[];
  unresolvedExceptions: readonly RecoveryException[];
  now: Date;
}): RecoveryReadinessView {
  const policy = input.policy;
  const effect = recoveryPolicyEffect(policy, input.now);
  const unresolvedExceptionCount = input.unresolvedExceptions.length;
  const policyFacts: RecoveryReadinessView['policy'] = {
    effect,
    ...(policy
      ? {
          revision: policy.revision,
          status: policy.status,
          ...(policy.rpoSeconds !== undefined ? { rpoSeconds: policy.rpoSeconds } : {}),
          ...(policy.rtoSeconds !== undefined ? { rtoSeconds: policy.rtoSeconds } : {}),
          ...(policy.retentionDays !== undefined ? { retentionDays: policy.retentionDays } : {}),
          ...(policy.immutableBackupCopies !== undefined
            ? { immutableBackupCopies: policy.immutableBackupCopies }
            : {}),
          ...(policy.responsiblePerson ? { responsiblePerson: policy.responsiblePerson } : {}),
          ...(policy.policyReference ? { policyReference: policy.policyReference } : {}),
          ...(policy.policyRevision ? { policyRevision: policy.policyRevision } : {}),
          ...(policy.policySourceSha256 ? { policySourceSha256: policy.policySourceSha256 } : {}),
          ...(policy.effectiveFrom ? { effectiveFrom: policy.effectiveFrom } : {}),
          ...(policy.effectiveTo ? { effectiveTo: policy.effectiveTo } : {}),
          ...(policy.approvalReference ? { approvalReference: policy.approvalReference } : {}),
          ...(policy.approvedAt ? { approvedAt: policy.approvedAt } : {}),
        }
      : {}),
  };

  const latestBackup = input.latestBackup;
  const artifactVerified = latestBackup ? latestBackup.state === 'VERIFIED' : false;
  const checksumRecorded = latestBackup ? latestBackup.hasChecksum : false;
  const backupAgeSeconds = latestBackup
    ? Math.max(
        0,
        Math.floor(
          (input.now.getTime() -
            (latestBackup.verifiedAt ??
              latestBackup.artifactCreatedAt ??
              latestBackup.completedAt ??
              latestBackup.requestedAt
            ).getTime()) /
            1000,
        ),
      )
    : undefined;
  const backupFacts: RecoveryReadinessView['latestBackup'] | undefined = latestBackup
    ? {
        id: latestBackup.id,
        state: latestBackup.state,
        requestedAt: latestBackup.requestedAt,
        artifactVerified,
        checksumRecorded,
        backupAgeSeconds: backupAgeSeconds ?? 0,
      }
    : undefined;

  const latestDrill = latestVerifiedDrill(input.restoreRuns, input.drillEvidence);
  const lastDrill = [...input.drillEvidence]
    .sort((left, right) => {
      const leftTime = left.completedAt?.getTime() ?? left.startedAt?.getTime() ?? 0;
      const rightTime = right.completedAt?.getTime() ?? right.startedAt?.getTime() ?? 0;
      return rightTime - leftTime;
    })
    .find((entry) => input.restoreRuns.some((run) => run.id === entry.restoreRunId));
  const restoreRunForDrill = latestDrill
    ? input.restoreRuns.find((run) => run.id === latestDrill.restoreRunId)
    : undefined;
  const observedRestoreSeconds =
    latestDrill?.observedRestoreSeconds ??
    (restoreRunForDrill?.startedAt && restoreRunForDrill.completedAt
      ? Math.max(
          0,
          Math.floor(
            (restoreRunForDrill.completedAt.getTime() - restoreRunForDrill.startedAt.getTime()) /
              1000,
          ),
        )
      : undefined);

  const base: RecoveryReadinessView = {
    status: 'NOT_CONFIGURED',
    reason: 'No approved recovery policy exists. RPO, RTO and retention remain unconfigured.',
    policy: policyFacts,
    ...(backupFacts ? { latestBackup: backupFacts } : {}),
    ...(latestDrill ? { drill: latestDrill } : {}),
    ...(lastDrill ? { lastDrill } : {}),
    ...(observedRestoreSeconds !== undefined ? { observedRestoreSeconds } : {}),
    ...(backupAgeSeconds !== undefined ? { backupAgeSeconds } : {}),
    unresolvedExceptions: input.unresolvedExceptions,
    unresolvedExceptionCount,
  };

  if (
    effect.state === 'NOT_CONFIGURED' ||
    effect.state === 'PENDING_APPROVAL' ||
    effect.state === 'REJECTED' ||
    effect.state === 'SCHEDULED'
  )
    return {
      ...base,
      status: 'NOT_CONFIGURED',
      reason:
        effect.state === 'PENDING_APPROVAL'
          ? `Recovery policy revision ${effect.revision} is pending approval. No objective is in force.`
          : effect.state === 'REJECTED'
            ? `Recovery policy revision ${effect.revision} was rejected. No objective is in force.`
            : effect.state === 'SCHEDULED'
              ? `Recovery policy revision ${effect.revision} is approved but not yet effective (starts ${effect.effectiveFrom.toISOString()}). No objective is in force.`
              : base.reason,
    };
  if (effect.state === 'EXPIRED')
    return {
      ...base,
      status: 'POLICY_EXPIRED',
      reason: `The approved recovery policy expired on ${effect.effectiveTo.toISOString()}. No objective is currently in force.`,
    };

  if (!latestBackup)
    return {
      ...base,
      status: 'BACKUP_MISSING',
      reason: 'The policy is approved, but no backup set is recorded in the application catalog.',
    };
  if (!artifactVerified || !checksumRecorded)
    return {
      ...base,
      status: 'BACKUP_NOT_VERIFIED',
      reason: !checksumRecorded
        ? 'The latest backup set has no recorded integrity checksum and is not verified.'
        : 'The latest backup artifact is not verified. A created archive is not an integrity-verified backup.',
    };
  if (policy?.rpoSeconds !== undefined && (backupAgeSeconds ?? 0) > policy.rpoSeconds)
    return {
      ...base,
      status: 'BACKUP_OUTSIDE_RPO',
      reason: `The latest verified backup is ${backupAgeSeconds ?? 0} seconds old, beyond the approved RPO of ${policy.rpoSeconds} seconds.`,
    };
  if (!latestDrill)
    return {
      ...base,
      status: 'RESTORE_NOT_VERIFIED',
      reason:
        'The backup artifact is verified, but no verified restore drill exists for this recovery set.',
    };
  if (observedRestoreSeconds === undefined)
    return {
      ...base,
      status: 'BACKUP_VERIFIED',
      reason:
        'The backup artifact and a drill are verified, but the observed restore time is not recorded, so the approved RTO cannot be evaluated.',
    };
  if (policy?.rtoSeconds !== undefined && observedRestoreSeconds > policy.rtoSeconds)
    return {
      ...base,
      status: 'RESTORE_OUTSIDE_RTO',
      reason: `The last verified drill took ${observedRestoreSeconds} seconds, beyond the approved RTO of ${policy.rtoSeconds} seconds.`,
    };
  return {
    ...base,
    status: 'WITHIN_OBJECTIVE',
    reason:
      'The latest backup artifact is verified and the last recorded drill completed within the approved objectives. This is evidence, not a production recovery guarantee.',
  };
}

/**
 * Only a restore run that genuinely succeeded with a VERIFIED outcome counts.
 * A planned request, a failed drill or a blocked verification stays a gap.
 */
export function latestVerifiedDrill(
  restoreRuns: readonly RestoreRun[],
  evidence: readonly RecoveryDrillEvidence[],
): RecoveryDrillEvidence | undefined {
  const verifiedEvidence = evidence
    .filter((entry) => entry.outcome === 'VERIFIED')
    .sort((left, right) => {
      const leftTime = left.completedAt?.getTime() ?? 0;
      const rightTime = right.completedAt?.getTime() ?? 0;
      return rightTime - leftTime;
    });
  for (const entry of verifiedEvidence) {
    const run = restoreRuns.find((candidate) => candidate.id === entry.restoreRunId);
    if (run?.state === 'SUCCEEDED' && run.verificationOutcome === 'VERIFIED') return entry;
  }
  return undefined;
}
