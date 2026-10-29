import { AppError } from '../../../shared/errors/app-error.js';
import type {
  ControlledRecoveryRunner,
  RecoveryExecutionIntent,
  RecoveryExecutionOutcome,
} from '../ports/controlled-recovery-runner.js';
import type {
  RecoveryGovernanceRepository,
  RecoveryProcedureAuthorizationRecord,
} from '../ports/recovery-governance.js';

export const RECOVERY_PROCEDURE_AUTHORITY = 'SYSTEM_OWNER_INTERNAL_APPROVAL' as const;

/**
 * Production restore execution is prohibited until a separate, approved
 * recovery procedure exists. This is not a permission check: holding
 * `PERM-BKP-RESTORE-PRODUCTION` or being the named owner never authorizes
 * execution by itself.
 */
export function isProductionRestoreExecutionApproved(): false {
  return false;
}

/**
 * Resolves the environment-scoped recovery procedure authorization. An empty
 * table, an expired window, a revoked row or a missing environment all yield
 * `POLICY_SOURCE_REQUIRED`; there is no fallback and no inferred procedure.
 */
export async function requireRecoveryProcedureAuthorization(input: {
  repository: Pick<RecoveryGovernanceRepository, 'getApprovedProcedureAuthorization'>;
  environment: string;
  now: Date;
}): Promise<RecoveryProcedureAuthorizationRecord> {
  const authorization = await input.repository.getApprovedProcedureAuthorization(
    input.environment,
    input.now,
  );
  if (!authorization)
    throw new AppError('POLICY_SOURCE_REQUIRED', {
      userSafe: true,
      safeMetadata: { environment: input.environment, reason: 'RECOVERY_PROCEDURE_NOT_APPROVED' },
    });
  if (authorization.status !== 'APPROVED')
    throw new AppError('POLICY_SOURCE_REQUIRED', {
      userSafe: true,
      safeMetadata: { environment: input.environment, reason: 'RECOVERY_PROCEDURE_NOT_APPROVED' },
    });
  return authorization;
}

/**
 * Fail-closed controlled runner.
 *
 * `prepare` verifies that the separate procedure authorization exists, then
 * always reports that execution is not implemented. It never contacts a
 * provider, never restores data and never returns a receipt. Production is
 * blocked twice: by the missing authorization and by the explicit prohibition.
 */
export class FailClosedControlledRecoveryRunner implements ControlledRecoveryRunner {
  constructor(
    private readonly repository: Pick<RecoveryGovernanceRepository, 'getApprovedProcedureAuthorization'>,
    private readonly now = () => new Date(),
  ) {}

  async prepare(intent: RecoveryExecutionIntent): Promise<RecoveryExecutionOutcome> {
    if (intent.environment === 'production')
      return { status: 'BLOCKED', reason: 'PRODUCTION_RESTORE_PROHIBITED' };
    try {
      await requireRecoveryProcedureAuthorization({
        repository: this.repository,
        environment: intent.environment,
        now: this.now(),
      });
    } catch (error) {
      if (error instanceof AppError && error.code === 'POLICY_SOURCE_REQUIRED')
        return { status: 'BLOCKED', reason: 'RECOVERY_PROCEDURE_NOT_APPROVED' };
      throw error;
    }
    return { status: 'BLOCKED', reason: 'RECOVERY_EXECUTION_NOT_IMPLEMENTED' };
  }
}
