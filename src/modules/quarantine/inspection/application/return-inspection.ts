import { authorize } from '../../../../shared/authorization/authorize.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { InspectionRepository } from '../ports/repository.js';

export class ReturnInspectionUseCase {
  constructor(private readonly repository: InspectionRepository) {}
  async execute(input: { actor: ActorContext; id: string; expectedVersion: bigint; reason: string; requestId: string }) {
    if (!input.reason.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    const inspection = await this.repository.get(input.id, input.actor);
    if (!inspection) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    const common = { actor: input.actor, entity: { type: 'INSPECTION_REPORT', id: inspection.id, state: inspection.state, authorId: inspection.authorId, executorId: inspection.authorId }, scope: { ownerId: inspection.authorId, assigneeId: inspection.authorId }, currentVersion: inspection.version, expectedVersion: input.expectedVersion, sod: { actorId: input.actor.id, authorId: inspection.authorId, executorId: inspection.authorId }, businessCondition: inspection.state === 'SUBMITTED' || inspection.state === 'UNDER_REVIEW' };
    authorize({ ...common, permission: 'PERM-INSP-RETURN', action: 'RETURN' }, { throwOnDeny: true });
    authorize({ ...common, permission: 'PERM-APR-RETURN', action: 'RETURN' }, { throwOnDeny: true });
    return this.repository.transition({ id: input.id, expectedVersion: input.expectedVersion, actor: input.actor, action: 'RETURN', reason: input.reason, requestId: input.requestId });
  }
}
