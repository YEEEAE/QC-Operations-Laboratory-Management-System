import { authorize } from '../../../../shared/authorization/authorize.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { InspectionRepository } from '../ports/repository.js';

export class ResumeInspectionUseCase {
  constructor(private readonly repository: InspectionRepository) {}

  async execute(input: { actor: ActorContext; id: string; expectedVersion: bigint; requestId: string }) {
    const inspection = await this.repository.get(input.id, input.actor);
    if (!inspection) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    authorize({
      actor: input.actor,
      permission: 'PERM-INSP-EDIT-DRAFT',
      action: 'RESUME',
      entity: { type: 'INSPECTION_REPORT', id: inspection.id, state: inspection.state, authorId: inspection.authorId, executorId: inspection.authorId },
      scope: { ownerId: inspection.authorId, assigneeId: inspection.authorId },
      currentVersion: inspection.version,
      expectedVersion: input.expectedVersion,
      businessCondition: inspection.state === 'RETURNED',
    }, { throwOnDeny: true });
    return this.repository.transition({ id: input.id, expectedVersion: input.expectedVersion, actor: input.actor, action: 'RESUME', requestId: input.requestId });
  }
}
