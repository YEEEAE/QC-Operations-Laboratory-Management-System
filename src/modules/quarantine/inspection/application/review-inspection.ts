import { authorize } from '../../../../shared/authorization/authorize.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { InspectionRepository } from '../ports/repository.js';

export class ReviewInspectionUseCase {
  constructor(private readonly repository: InspectionRepository) {}
  async execute(input: { actor: ActorContext; id: string; expectedVersion: bigint; requestId: string }) {
    const inspection = await this.repository.get(input.id, input.actor);
    if (!inspection) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    const common = { actor: input.actor, entity: { type: 'INSPECTION_REPORT', id: inspection.id, state: inspection.state, authorId: inspection.authorId, executorId: inspection.authorId }, scope: { ownerId: inspection.authorId, assigneeId: inspection.authorId }, currentVersion: inspection.version, expectedVersion: input.expectedVersion, sod: { actorId: input.actor.id, authorId: inspection.authorId, executorId: inspection.authorId }, businessCondition: inspection.state === 'SUBMITTED' };
    authorize({ ...common, permission: 'PERM-INSP-REVIEW', action: 'REVIEW' }, { throwOnDeny: true });
    authorize({ ...common, permission: 'PERM-APR-REVIEW', action: 'REVIEW' }, { throwOnDeny: true });
    return this.repository.transition({ id: input.id, expectedVersion: input.expectedVersion, actor: input.actor, action: 'BEGIN_REVIEW', requestId: input.requestId });
  }
}
