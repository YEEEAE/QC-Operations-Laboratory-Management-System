import { AppError } from '../../../shared/errors/app-error.js';

/**
 * Governed recovery policy vocabulary (OPS-01).
 *
 * A recovery policy version records RPO, RTO, retention, immutable copy count,
 * responsible person, the exact approved source it was transcribed from, its
 * effective window, status and the owner's internal approval reference.
 *
 * The platform never supplies a value for any objective. A new version starts
 * as PENDING_APPROVAL with no approval fields, and approval requires a complete
 * transcription from a named source plus the named owner's decision reference.
 * That decision is an internal approval: electronic signatures remain deferred
 * (OWNER-DECISION-2026-10-16-OWNER-CONTROLLED-APPROVAL) and this module never
 * writes or implies a signature record.
 */
export const RECOVERY_POLICY_STATUSES = [
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'SUPERSEDED',
  'EXPIRED',
] as const;
export type RecoveryPolicyStatus = (typeof RECOVERY_POLICY_STATUSES)[number];

export const RECOVERY_POLICY_SOURCE_KINDS = [
  'CONTROLLED_DOCUMENT',
  'QMS_DECISION',
  'OWNER_DECISION',
] as const;
export type RecoveryPolicySourceKind = (typeof RECOVERY_POLICY_SOURCE_KINDS)[number];

export const RECOVERY_POLICY_KEY = 'BACKUP_RECOVERY' as const;

export interface RecoveryPolicyVersion {
  id: string;
  policyKey: string;
  revision: number;
  status: RecoveryPolicyStatus;
  rpoSeconds?: number;
  rtoSeconds?: number;
  retentionDays?: number;
  immutableBackupCopies?: number;
  responsiblePerson?: string;
  sourceKind?: RecoveryPolicySourceKind;
  policyReference?: string;
  policyRevision?: string;
  policySourceSha256?: string;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  approvalReference?: string;
  approvedBy?: string;
  approvedAt?: Date;
  supersedesId?: string;
  createdBy: string;
  createdAt: Date;
  version: bigint;
}

export interface RecoveryPolicyDraftInput {
  rpoSeconds?: number | null;
  rtoSeconds?: number | null;
  retentionDays?: number | null;
  immutableBackupCopies?: number | null;
  responsiblePerson?: string | null;
  sourceKind?: string | null;
  policyReference?: string | null;
  policyRevision?: string | null;
  policySourceSha256?: string | null;
  effectiveFrom?: Date | null;
  effectiveTo?: Date | null;
}

export interface NormalizedRecoveryPolicyDraft {
  rpoSeconds: number | null;
  rtoSeconds: number | null;
  retentionDays: number | null;
  immutableBackupCopies: number | null;
  responsiblePerson: string | null;
  sourceKind: RecoveryPolicySourceKind | null;
  policyReference: string | null;
  policyRevision: string | null;
  policySourceSha256: string | null;
  effectiveFrom: Date | null;
  effectiveTo: Date | null;
}

const sha256Pattern = /^[0-9a-f]{64}$/i;

function positiveInteger(
  value: number | null | undefined,
  field: string,
  errors: Record<string, readonly string[]>,
): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isSafeInteger(value) || value <= 0) {
    errors[field] = ['invalid'];
    return null;
  }
  return value;
}

function boundedText(
  value: string | null | undefined,
  field: string,
  errors: Record<string, readonly string[]>,
  maxLength: number,
): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > maxLength) {
    errors[field] = ['too_long'];
    return null;
  }
  return trimmed;
}

function optionalTimestamp(
  value: Date | null | undefined,
  field: string,
  errors: Record<string, readonly string[]>,
): Date | null {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value.getTime())) {
    errors[field] = ['invalid'];
    return null;
  }
  return value;
}

/**
 * Validates an operator transcription of an approved policy source. Values are
 * optional in a draft so a documented gap can be represented honestly; approval
 * later requires every field. Nothing is defaulted.
 */
export function normalizeRecoveryPolicyDraft(
  input: RecoveryPolicyDraftInput,
): NormalizedRecoveryPolicyDraft {
  const errors: Record<string, readonly string[]> = {};
  const normalized: NormalizedRecoveryPolicyDraft = {
    rpoSeconds: positiveInteger(input.rpoSeconds, 'rpoSeconds', errors),
    rtoSeconds: positiveInteger(input.rtoSeconds, 'rtoSeconds', errors),
    retentionDays: positiveInteger(input.retentionDays, 'retentionDays', errors),
    immutableBackupCopies: positiveInteger(
      input.immutableBackupCopies,
      'immutableBackupCopies',
      errors,
    ),
    responsiblePerson: boundedText(input.responsiblePerson, 'responsiblePerson', errors, 200),
    sourceKind:
      input.sourceKind && (RECOVERY_POLICY_SOURCE_KINDS as readonly string[]).includes(input.sourceKind)
        ? (input.sourceKind as RecoveryPolicySourceKind)
        : null,
    policyReference: boundedText(input.policyReference, 'policyReference', errors, 200),
    policyRevision: boundedText(input.policyRevision, 'policyRevision', errors, 100),
    policySourceSha256: boundedText(input.policySourceSha256, 'policySourceSha256', errors, 64),
    effectiveFrom: optionalTimestamp(input.effectiveFrom, 'effectiveFrom', errors),
    effectiveTo: optionalTimestamp(input.effectiveTo, 'effectiveTo', errors),
  };
  if (input.sourceKind && !normalized.sourceKind) errors.sourceKind = ['invalid'];
  if (normalized.policySourceSha256 && !sha256Pattern.test(normalized.policySourceSha256))
    errors.policySourceSha256 = ['invalid'];
  if (
    normalized.effectiveFrom &&
    normalized.effectiveTo &&
    normalized.effectiveTo.getTime() <= normalized.effectiveFrom.getTime()
  )
    errors.effectiveTo = ['invalid'];
  if (Object.keys(errors).length)
    throw new AppError('VALIDATION_FAILED', { userSafe: true, fieldErrors: errors });
  return normalized;
}

export interface ApprovablePolicySource {
  rpoSeconds?: number;
  rtoSeconds?: number;
  retentionDays?: number;
  immutableBackupCopies?: number;
  responsiblePerson?: string;
  sourceKind?: RecoveryPolicySourceKind;
  policyReference?: string;
  policyRevision?: string;
  policySourceSha256?: string;
  effectiveFrom?: Date;
}

/**
 * Approval is refused until every objective and the exact approved source are
 * present. This is the guard that prevents an incomplete or invented policy
 * from becoming the effective recovery objective set.
 */
export function assertPolicyApprovable(
  policy: ApprovablePolicySource,
  input: { approvalReference: string; approvedBy: string; createdBy: string; now: Date },
): void {
  const missing: string[] = [];
  if (!policy.rpoSeconds) missing.push('rpoSeconds');
  if (!policy.rtoSeconds) missing.push('rtoSeconds');
  if (!policy.retentionDays) missing.push('retentionDays');
  if (!policy.immutableBackupCopies) missing.push('immutableBackupCopies');
  if (!policy.responsiblePerson?.trim()) missing.push('responsiblePerson');
  if (!policy.sourceKind) missing.push('policySourceKind');
  if (!policy.policyReference?.trim()) missing.push('policyReference');
  if (!policy.policyRevision?.trim()) missing.push('policyRevision');
  if (!policy.policySourceSha256?.trim()) missing.push('policySourceSha256');
  if (!policy.effectiveFrom) missing.push('effectiveFrom');
  if (missing.length)
    throw new AppError('POLICY_SOURCE_REQUIRED', {
      userSafe: true,
      safeMetadata: { missing: missing.join(',') },
    });
  if (!sha256Pattern.test(policy.policySourceSha256!))
    throw new AppError('VALIDATION_FAILED', {
      userSafe: true,
      fieldErrors: { policySourceSha256: ['invalid'] },
    });
  if (!input.approvalReference.trim())
    throw new AppError('VALIDATION_FAILED', {
      userSafe: true,
      fieldErrors: { approvalReference: ['required'] },
    });
  if (!input.approvedBy.trim()) throw new AppError('AUTHZ_DENIED', { userSafe: true });
  // Approval is an internal owner decision, not a signature ceremony.
  if (input.approvedBy === input.createdBy)
    throw new AppError('AUTHZ_DENIED', {
      userSafe: true,
      safeMetadata: { reason: 'RECOVERY_POLICY_SELF_APPROVAL_DENIED' },
    });
  if (input.now.getTime() < 0) throw new AppError('VALIDATION_FAILED', { userSafe: true });
}

export type RecoveryPolicyEffect =
  | { state: 'NOT_CONFIGURED' }
  | { state: 'PENDING_APPROVAL'; revision: number }
  | { state: 'SCHEDULED'; revision: number; effectiveFrom: Date }
  | { state: 'APPROVED'; revision: number; effectiveFrom?: Date; effectiveTo?: Date }
  | { state: 'EXPIRED'; revision: number; effectiveTo: Date }
  | { state: 'REJECTED'; revision: number };

/**
 * Effective state of the newest policy version at a point in time. An approved
 * version past its effective end is EXPIRED; it is never silently treated as
 * the current objective set.
 */
export function recoveryPolicyEffect(
  latest: RecoveryPolicyVersion | undefined,
  now: Date,
): RecoveryPolicyEffect {
  if (!latest) return { state: 'NOT_CONFIGURED' };
  if (latest.status === 'PENDING_APPROVAL')
    return { state: 'PENDING_APPROVAL', revision: latest.revision };
  if (latest.status === 'REJECTED') return { state: 'REJECTED', revision: latest.revision };
  if (latest.status === 'EXPIRED' || latest.status === 'SUPERSEDED') {
    return latest.effectiveTo
      ? { state: 'EXPIRED', revision: latest.revision, effectiveTo: latest.effectiveTo }
      : { state: 'EXPIRED', revision: latest.revision, effectiveTo: now };
  }
  if (latest.effectiveFrom && latest.effectiveFrom.getTime() > now.getTime())
    return { state: 'SCHEDULED', revision: latest.revision, effectiveFrom: latest.effectiveFrom };
  if (latest.effectiveTo && latest.effectiveTo.getTime() <= now.getTime())
    return {
      state: 'EXPIRED',
      revision: latest.revision,
      effectiveTo: latest.effectiveTo,
    };
  return {
    state: 'APPROVED',
    revision: latest.revision,
    ...(latest.effectiveFrom ? { effectiveFrom: latest.effectiveFrom } : {}),
    ...(latest.effectiveTo ? { effectiveTo: latest.effectiveTo } : {}),
  };
}
