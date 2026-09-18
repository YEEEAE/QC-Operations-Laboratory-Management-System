import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { isP05Authority } from '../../../shared/authorization/p05-authority.js';
import { transitionLab } from '../domain/lab-state.js';
import type { LabRejectPolicy } from '../ports/controlled-sources.js';
import type { LabRepository } from '../ports/repository.js';
import { authorizeLab } from './lab-authorization.js';

/**
 * Default reject decision authority is fail-closed: TR-LAB-007 defines the
 * transition (UNDER_REVIEW → REJECTED, reason required, measurements
 * preserved) but no approved source defines which actor may apply the final
 * reject decision. POLICY / SCIENTIFIC SOURCE REQUIRED — reject stays denied
 * until a controlled policy is supplied and approved.
 */
const deniedRejectPolicy: LabRejectPolicy = {
  authorize: async () => {
    throw new AppError('POLICY_SOURCE_REQUIRED', { userSafe: true });
  },
};

/** Reject is a controlled workflow decision; it is not a scientific FAIL result. */
export class RejectLabTestUseCase {
  constructor(
    private readonly repository: LabRepository,
    private readonly policy: LabRejectPolicy = deniedRejectPolicy,
    private readonly now = () => new Date(),
  ) {}
  async execute(input: {
    actor: ActorContext;
    id: string;
    expectedVersion: bigint;
    reason: string;
    requestId: string;
  }) {
    const test = await this.repository.get(input.id, input.actor);
    if (!test) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (!input.reason.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    authorizeLab(input.actor, test, 'PERM-LAB-REJECT', 'REJECT', input.expectedVersion, true);
    authorizeLab(input.actor, test, 'PERM-APR-REJECT', 'REJECT', input.expectedVersion, true);
    if (!isP05Authority(input.actor)) throw new AppError('AUTHZ_DENIED', { userSafe: true });
    await this.policy.authorize({
      test,
      actor: input.actor,
      reason: input.reason.trim(),
      expectedVersion: input.expectedVersion,
    });
    const at = this.now().toISOString();
    return this.repository.save(
      test,
      {
        ...test,
        state: transitionLab(test.state, 'REJECT'),
        version: test.version + 1n,
        updatedAt: at,
        rejectedAt: at,
      },
      {
        actor: input.actor,
        requestId: input.requestId,
        action: 'REJECT',
        reason: input.reason.trim(),
      },
    );
  }
}
