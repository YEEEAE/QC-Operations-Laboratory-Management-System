import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { isFinalApprovalAuthority } from '../../../shared/authorization/p05-authority.js';
import { transitionLab } from '../domain/lab-state.js';
import type { LabRepository } from '../ports/repository.js';
import { authorizeLab } from './lab-authorization.js';

/**
 * QC-100-FINAL-004 — controlled REOPEN of a locked (APPROVED) lab test.
 * Requires a reason, the final-approval authority, and the ceremony grant;
 * the transition is audited like every other state change.
 */
export class ReopenLabTestUseCase {
  constructor(
    private readonly repository: LabRepository,
    private readonly now = () => new Date(),
  ) {}

  async execute(input: {
    actor: ActorContext;
    id: string;
    expectedVersion: bigint;
    reason: string;
    requestId: string;
  }) {
    if (!input.reason.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    const test = await this.repository.get(input.id, input.actor);
    if (!test) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (!isFinalApprovalAuthority(input.actor))
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    if (test.state !== 'APPROVED')
      throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
    authorizeLab(input.actor, test, 'PERM-APR-APPROVE', 'REOPEN', input.expectedVersion);
    return this.repository.save(
      test,
      {
        ...test,
        state: transitionLab(test.state, 'REOPEN'),
        version: test.version + 1n,
        updatedAt: this.now().toISOString(),
      },
      {
        actor: input.actor,
        requestId: input.requestId,
        action: 'REOPEN',
        reason: input.reason.trim(),
      },
    );
  }
}
