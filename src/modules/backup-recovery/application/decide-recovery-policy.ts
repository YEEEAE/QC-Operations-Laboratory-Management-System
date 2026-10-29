import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { isNamedSystemOwner } from '../../../shared/authorization/p05-authority.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { RecoveryPolicyVersion } from '../domain/recovery-policy.js';
import type { RecoveryGovernanceRepository } from '../ports/recovery-governance.js';

/**
 * Releases or rejects a pending recovery policy version.
 *
 * Approval requires the explicit approval permission AND the server-derived
 * named system owner identity. It records an INTERNAL owner approval reference;
 * no electronic signature row is created or implied, and the decision does not
 * execute, verify or schedule any backup or restore.
 */
export class DecideRecoveryPolicyUseCase {
  constructor(
    private readonly repository: RecoveryGovernanceRepository,
    private readonly now = () => new Date(),
  ) {}

  async execute(input: {
    actor: ActorContext;
    policyId: string;
    decision: 'APPROVE' | 'REJECT';
    reason: string;
    approvalReference?: string;
    expectedVersion: bigint;
    requestId: string;
  }): Promise<RecoveryPolicyVersion> {
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-BKP-POLICY-APPROVE',
        action: 'APPROVE',
        entity: {
          type: 'RECOVERY_POLICY',
          id: input.policyId,
          state: 'PENDING_APPROVAL',
          domain: 'BACKUP_RECOVERY',
        },
        scope: { domain: 'BACKUP_RECOVERY' },
        currentVersion: input.expectedVersion,
        expectedVersion: input.expectedVersion,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );

    if (input.decision === 'APPROVE' && !isNamedSystemOwner(input.actor))
      throw new AppError('AUTHZ_DENIED', {
        userSafe: true,
        safeMetadata: { reason: 'RECOVERY_POLICY_OWNER_APPROVAL_REQUIRED' },
      });
    const reason = input.reason.trim();
    if (!reason)
      throw new AppError('VALIDATION_FAILED', {
        userSafe: true,
        fieldErrors: { reason: ['required'] },
      });
    if (reason.length > 2000)
      throw new AppError('VALIDATION_FAILED', {
        userSafe: true,
        fieldErrors: { reason: ['too_long'] },
      });
    const approvalReference = input.approvalReference?.trim() ?? '';
    if (input.decision === 'APPROVE' && !approvalReference)
      throw new AppError('VALIDATION_FAILED', {
        userSafe: true,
        fieldErrors: { approvalReference: ['required'] },
      });
    if (input.expectedVersion <= 0n) throw new AppError('VALIDATION_FAILED', { userSafe: true });

    return this.repository.decidePolicy({
      policyId: input.policyId,
      decision: input.decision,
      reason,
      ...(approvalReference ? { approvalReference } : {}),
      actor: input.actor,
      requestId: input.requestId,
      expectedVersion: input.expectedVersion,
      now: this.now(),
    });
  }
}
