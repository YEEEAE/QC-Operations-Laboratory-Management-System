import { AppError } from '../../../shared/errors/app-error.js';
import {
  CANONICAL_ENVIRONMENTS,
  RESTORE_RUN_TYPES,
  isRestorableBackup,
  type BackupRun,
  type RestoreRunType,
} from '../domain/backup-record.js';

export interface RestoreRequestValidationInput {
  backupRun: BackupRun;
  restoreType: string;
  targetEnvironment: string;
  reason: string;
  confirmation: boolean;
}

export interface ValidatedRestoreRequest {
  restoreType: RestoreRunType;
  targetEnvironment: string;
  reason: string;
}

/**
 * Production restore authority, approval ceremony, and e-signature
 * requirements are unresolved (BACKUP-RECOVERY-PLAN.md deferred decisions
 * BKP-DD-014/015/016 and PERMISSION-MATRIX.md RD-020). Until an approved
 * policy exists, production restore is DENY regardless of permissions.
 */
export function isProductionRestorePolicyApproved(): boolean {
  return false;
}

/**
 * Pure validation of a restore request before authorization. Never executes
 * anything and never trusts client-side state.
 */
export function validateRestoreRequest(
  input: RestoreRequestValidationInput,
): ValidatedRestoreRequest {
  const fieldErrors: Record<string, readonly string[]> = {};
  if (!(RESTORE_RUN_TYPES as readonly string[]).includes(input.restoreType))
    fieldErrors.restoreType = ['invalid'];
  if (!(CANONICAL_ENVIRONMENTS as readonly string[]).includes(input.targetEnvironment))
    fieldErrors.targetEnvironment = ['invalid'];
  if (!input.reason.trim()) fieldErrors.reason = ['required'];
  if (!input.confirmation) fieldErrors.confirmation = ['required'];
  if (Object.keys(fieldErrors).length)
    throw new AppError('VALIDATION_FAILED', { userSafe: true, fieldErrors });

  if (!isRestorableBackup(input.backupRun))
    throw new AppError('DOMAIN_INVALID_TRANSITION', {
      userSafe: true,
      safeMetadata: { reason: 'BACKUP_NOT_RESTORABLE' },
    });

  if (input.restoreType === 'DRILL' && input.targetEnvironment === 'production')
    throw new AppError('VALIDATION_FAILED', {
      userSafe: true,
      safeMetadata: { reason: 'DRILL_TARGET_MUST_BE_ISOLATED' },
    });
  if (input.restoreType === 'PRODUCTION' && input.targetEnvironment !== 'production')
    throw new AppError('VALIDATION_FAILED', {
      userSafe: true,
      safeMetadata: { reason: 'PRODUCTION_RESTORE_TARGET_MISMATCH' },
    });

  return {
    restoreType: input.restoreType as RestoreRunType,
    targetEnvironment: input.targetEnvironment,
    reason: input.reason.trim(),
  };
}
