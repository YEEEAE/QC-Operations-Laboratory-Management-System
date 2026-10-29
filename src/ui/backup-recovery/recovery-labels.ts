import type { RecoveryReadinessStatus } from '../../modules/backup-recovery/domain/recovery-sla.js';

/**
 * Presentation labels for recovery governance. Status identifiers stay in the
 * domain; the UI shows plain English and never a raw enum.
 */
const readinessLabels: Record<RecoveryReadinessStatus, string> = {
  NOT_CONFIGURED: 'Not configured',
  POLICY_EXPIRED: 'Policy expired',
  BACKUP_MISSING: 'No backup recorded',
  BACKUP_NOT_VERIFIED: 'Backup not verified',
  BACKUP_OUTSIDE_RPO: 'Backup outside RPO',
  BACKUP_VERIFIED: 'Backup verified',
  RESTORE_NOT_VERIFIED: 'Restore not verified',
  RESTORE_OUTSIDE_RTO: 'Restore outside RTO',
  WITHIN_OBJECTIVE: 'Within approved objectives',
  UNKNOWN: 'Not verified',
};

const readinessTones: Record<RecoveryReadinessStatus, 'ok' | 'warn' | 'bad' | 'unknown'> = {
  NOT_CONFIGURED: 'warn',
  POLICY_EXPIRED: 'bad',
  BACKUP_MISSING: 'bad',
  BACKUP_NOT_VERIFIED: 'warn',
  BACKUP_OUTSIDE_RPO: 'bad',
  BACKUP_VERIFIED: 'warn',
  RESTORE_NOT_VERIFIED: 'warn',
  RESTORE_OUTSIDE_RTO: 'bad',
  WITHIN_OBJECTIVE: 'ok',
  UNKNOWN: 'unknown',
};

export function recoveryReadinessLabel(status: RecoveryReadinessStatus): string {
  return readinessLabels[status];
}

export function recoveryReadinessTone(
  status: RecoveryReadinessStatus,
): 'ok' | 'warn' | 'bad' | 'unknown' {
  return readinessTones[status];
}

const policyStatusLabels: Record<string, string> = {
  PENDING_APPROVAL: 'Pending approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  SUPERSEDED: 'Superseded',
  EXPIRED: 'Expired',
};

export function recoveryPolicyStatusLabel(status: string): string {
  return policyStatusLabels[status] ?? 'Unknown status';
}

const sourceKindLabels: Record<string, string> = {
  CONTROLLED_DOCUMENT: 'Controlled document',
  QMS_DECISION: 'QMS decision',
  OWNER_DECISION: 'Owner decision',
};

export function recoveryPolicySourceLabel(kind: string | undefined): string {
  if (!kind) return 'Not recorded';
  return sourceKindLabels[kind] ?? 'Not recorded';
}

const incidentKindLabels: Record<string, string> = {
  BACKUP_FAILURE: 'Backup job failure',
  RESTORE_FAILURE: 'Restore failure',
  POLICY_GAP: 'Missing or expired recovery policy',
  PROVIDER_OUTAGE: 'Provider outage',
  DATA_LOSS: 'Data loss',
  OBJECT_STORE_GAP: 'Object-store coverage gap',
};

export function recoveryIncidentKindLabel(kind: string): string {
  return incidentKindLabels[kind] ?? 'Recovery incident';
}

const drillOutcomeLabels: Record<string, string> = {
  VERIFIED: 'Verified',
  VERIFICATION_FAILED: 'Verification failed',
  BLOCKED: 'Blocked',
};

export function recoveryDrillOutcomeLabel(outcome: string): string {
  return drillOutcomeLabels[outcome] ?? 'Not recorded';
}

export const RECOVERY_ENVIRONMENTS = ['local', 'test', 'staging', 'production'] as const;

export function recoveryEnvironmentLabel(environment: string): string {
  return environment.charAt(0).toUpperCase() + environment.slice(1);
}

export function formatRecoveryDuration(seconds: number | undefined): string {
  if (seconds === undefined) return 'Not recorded';
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ${seconds % 60} s`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ${minutes % 60} min`;
  const days = Math.floor(hours / 24);
  return `${days} d ${hours % 24} h`;
}

export function formatRecoveryObjective(seconds: number | undefined): string {
  return seconds === undefined ? 'Not approved' : formatRecoveryDuration(seconds);
}
