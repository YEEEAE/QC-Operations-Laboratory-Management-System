import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { assertDraftEditable } from '../domain/model.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { TaskRepository } from '../ports/repository.js';
export class UpdateDraftTaskUseCase {
  constructor(private readonly repository: TaskRepository) {}
  async execute(input: { actor: ActorContext; taskId: string; expectedVersion: bigint; title: string; description?: string; priority: string; dueAt?: Date; currentAssigneeId?: string; requestId: string }) {
    const task = await this.repository.get(input.taskId, input.actor);
    if (!task) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    assertDraftEditable(task);
    authorize({ actor: input.actor, permission: 'PERM-TASK-EDIT', action: 'UPDATE_DRAFT', entity: { type: 'TASK', id: task.id, state: task.state, ownerId: task.createdBy, assigneeId: task.currentAssigneeId }, scope: { ownerId: task.createdBy, assigneeId: task.currentAssigneeId }, currentVersion: task.version, expectedVersion: input.expectedVersion, businessCondition: true }, { throwOnDeny: true });
    return this.repository.updateDraft({ ...input, id: input.taskId });
  }
}
