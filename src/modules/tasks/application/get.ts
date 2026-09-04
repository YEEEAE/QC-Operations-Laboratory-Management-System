import type { ActorContext } from '../../../shared/authorization/types.js';
import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { TaskRepository } from '../ports/repository.js';
export class GetTaskUseCase {
  constructor(private readonly repository: TaskRepository) {}
  async execute(input: { actor: ActorContext; taskId: string }) {
    const task = await this.repository.get(input.taskId, input.actor);
    if (!task) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    authorize({ actor: input.actor, permission: 'PERM-TASK-VIEW', action: 'VIEW', entity: { type: 'TASK', id: task.id, state: task.state, ownerId: task.createdBy, assigneeId: task.currentAssigneeId }, scope: { ownerId: task.createdBy, assigneeId: task.currentAssigneeId }, currentVersion: task.version, expectedVersion: task.version, businessCondition: true }, { throwOnDeny: true });
    return task;
  }
}
