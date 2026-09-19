import { authorize } from '../../../../shared/authorization/authorize.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import { isP05Authority } from '../../../../shared/authorization/p05-authority.js';
import type { InspectionRepository } from '../ports/repository.js';

/** Reject is a controlled workflow decision; it is not a scientific FAIL result. */
export class RejectInspectionUseCase {
  constructor(private readonly repository: InspectionRepository) {}

  async execute(input: {
    actor: ActorContext;
    id: string;
    expectedVersion: bigint;
    reason: string;
    requestId: string;
  }) {
    if (!input.reason.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    const inspection = await this.repository.get(input.id, input.actor);
    if (!inspection) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (!isP05Authority(input.actor)) throw new AppError('AUTHZ_DENIED', { userSafe: true });

    const common = {
      actor: input.actor,
      entity: {
        type: 'INSPECTION_REPORT',
        id: inspection.id,
        state: inspection.state,
        authorId: inspection.authorId,
        executorId: inspection.authorId,
      },
      scope: {
        ownerId: inspection.authorId,
        assigneeId: inspection.assignedTo ?? inspection.authorId,
      },
      currentVersion: inspection.version,
      expectedVersion: input.expectedVersion,
      sod: {
        actorId: input.actor.id,
        authorId: inspection.authorId,
        executorId: inspection.authorId,
      },
      businessCondition:
        inspection.state === 'UNDER_REVIEW' || inspection.state === 'PENDING_QCM_APPROVAL',
    };
    authorize(
      { ...common, permission: 'PERM-INSP-REJECT', action: 'REJECT' },
      { throwOnDeny: true },
    );
    authorize(
      { ...common, permission: 'PERM-APR-REJECT', action: 'REJECT' },
      { throwOnDeny: true },
    );
    return this.repository.transition({
      id: input.id,
      expectedVersion: input.expectedVersion,
      actor: input.actor,
      action: 'REJECT',
      reason: input.reason.trim(),
      requestId: input.requestId,
    });
  }
}
