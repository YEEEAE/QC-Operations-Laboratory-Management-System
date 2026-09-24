import type { ActorContext } from '../../../shared/authorization/types.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { authorize } from '../../../shared/authorization/authorize.js';
import type { TaskRepository } from '../ports/repository.js';
export class GetTaskUseCase {
  constructor(private readonly repository: TaskRepository) {}
  async execute(input: { actor: ActorContext; taskId: string }) {
    if (input.actor.accountState !== 'ACTIVE') throw new AppError('AUTHZ_DENIED');
    if (
      !input.actor.permissions.some(
        (grant) => grant.code === 'PERM-TASK-VIEW' && grant.active !== false,
      )
    )
      throw new AppError('AUTHZ_PERMISSION_MISSING', { userSafe: true });
    const task = await this.repository.get(input.taskId, input.actor);
    if (!task) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    const decision = authorize({
      actor: input.actor,
      permission: 'PERM-TASK-VIEW',
      action: 'VIEW',
      entity: {
        type: 'TASK',
        id: task.id,
        state: task.state,
        ownerId: task.createdBy,
        assigneeId: task.currentAssigneeId,
      },
      scope: { ownerId: task.createdBy, assigneeId: task.currentAssigneeId },
      currentVersion: task.version,
      expectedVersion: task.version,
      businessCondition: true,
    });
    if (!decision.allowed) {
      if (decision.code === 'AUTHZ_SCOPE_DENIED')
        throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      throw new AppError(decision.code ?? 'AUTHZ_DENIED', { userSafe: true });
    }
    const labels = await this.repository.getIdentityLabels(task);
    const history = await this.repository.listHistory(task.id, input.actor.id);
    return { task, ownerDisplayName: labels.owner, assigneeDisplayName: labels.assignee, history };
  }
}
