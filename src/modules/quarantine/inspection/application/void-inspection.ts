import { authorize } from '../../../../shared/authorization/authorize.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import { isP05Authority } from '../../../../shared/authorization/p05-authority.js';
import type { InspectionRepository } from '../ports/repository.js';

export class VoidInspectionUseCase {
  constructor(private readonly repository: InspectionRepository) {}
  async execute(input: {
    actor: ActorContext;
    id: string;
    expectedVersion: bigint;
    reason: string;
    requestId: string;
  }) {
    const inspection = await this.repository.get(input.id, input.actor);
    if (!inspection) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (!input.reason?.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
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
      scope: { ownerId: inspection.authorId, assigneeId: inspection.authorId },
      currentVersion: inspection.version,
      expectedVersion: input.expectedVersion,
      sod: {
        actorId: input.actor.id,
        authorId: inspection.authorId,
        executorId: inspection.authorId,
      },
      businessCondition:
        (inspection.state === 'APPROVED' || inspection.state === 'REJECTED') &&
        Boolean(input.requestId?.trim()),
    };
    authorize({ ...common, permission: 'PERM-INSP-VOID', action: 'VOID' }, { throwOnDeny: true });
    return this.repository.transition({
      id: input.id,
      expectedVersion: input.expectedVersion,
      actor: input.actor,
      action: 'VOID',
      reason: input.reason.trim(),
      requestId: input.requestId,
    });
  }
}
