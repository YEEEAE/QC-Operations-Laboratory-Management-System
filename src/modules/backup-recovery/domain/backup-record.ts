import { AppError } from '../../../shared/errors/app-error.js';

/**
 * Controlled backup/recovery vocabulary.
 *
 * Backup run states follow migration `0014_backup_recovery_metadata.sql`.
 * Restore operation states follow BACKUP-RECOVERY-PLAN.md section 51.
 * Environments follow OBSERVABILITY-ARCHITECTURE.md section 14.
 *
 * A backup job result is never conflated with restore verification
 * (BACKUP-RECOVERY-PLAN.md sections 4 and 49-50).
 */
export const BACKUP_RUN_STATES = [
  'REQUESTED',
  'RUNNING',
  'CREATED',
  'VERIFYING',
  'VERIFIED',
  'FAILED',
  'EXPIRED',
  'DELETED',
] as const;
export type BackupRunState = (typeof BACKUP_RUN_STATES)[number];

export const RESTORE_RUN_TYPES = ['DRILL', 'PRODUCTION'] as const;
export type RestoreRunType = (typeof RESTORE_RUN_TYPES)[number];

export const RESTORE_RUN_STATES = [
  'PLANNED',
  'AUTHORIZED',
  'IN_PROGRESS',
  'VALIDATING',
  'SUCCEEDED',
  'FAILED',
  'ABORTED',
] as const;
export type RestoreRunState = (typeof RESTORE_RUN_STATES)[number];

export const CANONICAL_ENVIRONMENTS = ['local', 'test', 'staging', 'production'] as const;
export type CanonicalEnvironment = (typeof CANONICAL_ENVIRONMENTS)[number];

/** Only backups whose artifact was created can be selected as an approved recovery set candidate. */
export const RESTORABLE_BACKUP_STATES = [
  'CREATED',
  'VERIFIED',
] as const satisfies readonly BackupRunState[];

export interface BackupRun {
  id: string;
  state: BackupRunState;
  requestedBy?: string;
  requestedAt: Date;
  startedAt?: Date;
  artifactCreatedAt?: Date;
  verifiedAt?: Date;
  completedAt?: Date;
  sizeBytes?: bigint;
  checksum?: string;
  databaseSchemaVersion?: string;
  errorCode?: string;
  requestId: string;
}

export interface RestoreRun {
  id: string;
  backupRunId: string;
  restoreType: RestoreRunType;
  state: RestoreRunState;
  requestedBy?: string;
  authorizedBy?: string;
  requestedAt: Date;
  startedAt?: Date;
  verifiedAt?: Date;
  completedAt?: Date;
  targetEnvironment: string;
  errorCode?: string;
  requestId: string;
}

export type RestoreVerificationStatus =
  'NOT_VERIFIED' | 'VERIFYING' | 'VERIFIED' | 'VERIFICATION_FAILED' | 'UNKNOWN';

export interface BackupPostureView {
  backupJobState: BackupRunState;
  artifactVerified: boolean;
  restoreVerification: RestoreVerificationStatus;
  lastRestoreAt?: Date;
  databaseSchemaVersion?: string;
  hasChecksum: boolean;
  knownGaps: readonly string[];
}

export function isBackupArtifactVerified(backup: BackupRun): boolean {
  return backup.state === 'VERIFIED';
}

export function isRestorableBackup(backup: BackupRun): boolean {
  return (RESTORABLE_BACKUP_STATES as readonly string[]).includes(backup.state);
}

/**
 * Restore verification is derived only from actual restore runs of this backup set.
 * A backup job in CREATED/SUCCEEDED state never implies a verified restore.
 */
export function restoreVerificationStatus(
  restoreRuns: readonly RestoreRun[],
): RestoreVerificationStatus {
  if (restoreRuns.some((run) => run.state === 'SUCCEEDED')) return 'VERIFIED';
  if (restoreRuns.some((run) => run.state === 'VALIDATING' || run.state === 'IN_PROGRESS'))
    return 'VERIFYING';
  if (restoreRuns.some((run) => run.state === 'FAILED')) return 'VERIFICATION_FAILED';
  return 'NOT_VERIFIED';
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Derives the sanitized, UI-facing posture for one backup set. Raw storage
 * references and checksum values stay inside the repository layer and are
 * never exposed (BACKUP-RECOVERY-PLAN.md section 69).
 */
export function describeBackupPosture(
  backup: BackupRun,
  restoreRuns: readonly RestoreRun[],
): BackupPostureView {
  const gaps: string[] = [];
  if (!backup.checksum) gaps.push('INTEGRITY_CHECKSUM_UNAVAILABLE');
  if (!isBackupArtifactVerified(backup) && backup.state === 'CREATED')
    gaps.push('BACKUP_ARTIFACT_NOT_VERIFIED');
  const verification = restoreVerificationStatus(restoreRuns);
  if (verification !== 'VERIFIED') gaps.push(`RESTORE_${verification}`);
  if (!backup.databaseSchemaVersion) gaps.push('MIGRATION_CONTEXT_UNAVAILABLE');
  return {
    backupJobState: backup.state,
    artifactVerified: isBackupArtifactVerified(backup),
    restoreVerification: verification,
    ...(restoreRuns.length
      ? { lastRestoreAt: restoreRuns[restoreRuns.length - 1].requestedAt }
      : {}),
    ...(backup.databaseSchemaVersion
      ? { databaseSchemaVersion: backup.databaseSchemaVersion }
      : {}),
    hasChecksum: Boolean(backup.checksum),
    knownGaps: gaps,
  };
}

export interface RestoreRequestDomainInput {
  backupRun: BackupRun;
  restoreType: string;
  targetEnvironment: string;
  reason: string;
  confirmation: boolean;
  requestedBy: string;
  id: string;
  now: Date;
  requestId: string;
}

/**
 * Creates a restore request record. This records intent only: it never
 * executes a restore, never touches a provider, and never marks the
 * operation as SUCCEEDED or VERIFIED (BACKUP-RECOVERY-PLAN.md sections 38
 * and 49-51). Execution requires an approved recovery orchestrator, which
 * does not exist in this baseline.
 */
export function createRestoreRequest(input: RestoreRequestDomainInput): RestoreRun {
  if (!uuidPattern.test(input.id) || !uuidPattern.test(input.backupRun.id))
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  if (!input.confirmation)
    throw new AppError('VALIDATION_FAILED', {
      userSafe: true,
      fieldErrors: { confirmation: ['required'] },
    });
  if (!input.reason.trim())
    throw new AppError('VALIDATION_FAILED', {
      userSafe: true,
      fieldErrors: { reason: ['required'] },
    });
  if (!isRestorableBackup(input.backupRun))
    throw new AppError('DOMAIN_INVALID_TRANSITION', {
      userSafe: true,
      safeMetadata: { reason: 'BACKUP_NOT_RESTORABLE' },
    });
  return {
    id: input.id,
    backupRunId: input.backupRun.id,
    restoreType: input.restoreType as RestoreRunType,
    state: 'PLANNED',
    requestedBy: input.requestedBy,
    requestedAt: input.now,
    targetEnvironment: input.targetEnvironment,
    requestId: input.requestId,
  };
}
