import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import { createChangeRequest, type ChangeRequestChange } from '../domain/change-request.js';
import type { ChangeRequestAggregate, ChangeRequestRepository } from '../ports/repository.js';

export class CreateChangeRequestUseCase {
  constructor(private readonly repository: ChangeRequestRepository, private readonly now = () => new Date()) {}

  execute(input: {
    actor: ActorContext;
    changeNo: string;
    targetType: string;
    targetId: string;
    targetVersion: bigint;
    reason: string;
    targetSnapshot: Readonly<Record<string, unknown>>;
    targetSnapshotHash?: string;
    changes: readonly Omit<ChangeRequestChange, 'id' | 'position'>[];
    requestId: string;
  }): Promise<ChangeRequestAggregate> {
    if (!input.changes.length) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-CHG-CREATE',
        action: 'CREATE',
        entity: { type: 'CHANGE_REQUEST', id: 'new', state: 'DRAFT', ownerId: input.actor.id, authorId: input.actor.id },
        scope: { ownerId: input.actor.id },
        currentVersion: 1n,
        expectedVersion: 1n,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    const timestamp = this.now();
    const request = createChangeRequest({
      id: uuidv7(),
      changeNo: input.changeNo,
      targetType: input.targetType,
      targetId: input.targetId,
      targetVersion: input.targetVersion,
      reason: input.reason,
      targetSnapshot: input.targetSnapshot,
      ...(input.targetSnapshotHash ? { targetSnapshotHash: input.targetSnapshotHash } : {}),
      requestedBy: input.actor.id,
      now: timestamp,
    });
    const aggregate: ChangeRequestAggregate = {
      changeRequest: request,
      changes: input.changes.map((change, index) => ({ ...change, id: uuidv7(), position: index + 1 })),
      history: [],
      applicationAttempts: [],
    };
    return this.repository.create({ aggregate, actor: input.actor, requestId: input.requestId });
  }
}
