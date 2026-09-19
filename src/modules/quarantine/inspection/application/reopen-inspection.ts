import { authorize } from '../../../../shared/authorization/authorize.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import { isFinalApprovalAuthority } from '../../../../shared/authorization/p05-authority.js';
import type { InspectionRepository } from '../ports/repository.js';

/**
 * QC-100-FINAL-004 — controlled REOPEN of a locked (APPROVED) inspection.
 *
 * Item 10: an approved record is immutable through ordinary editing; the only
 * way back into the workflow is an explicit, reason-bearing, audited reopen
 * reserved to the final-approval authority (QCM / named owner).
 */
export class ReopenInspectionUseCase {
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
    if (!isFinalApprovalAuthority(input.actor))
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-APR-APPROVE',
        action: 'REOPEN',
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
        businessCondition: inspection.state === 'APPROVED',
      },
      { throwOnDeny: true },
    );
    return this.repository.transition({
      id: input.id,
      expectedVersion: input.expectedVersion,
      actor: input.actor,
      action: 'REOPEN',
      reason: input.reason.trim(),
      requestId: input.requestId,
    });
  }
}