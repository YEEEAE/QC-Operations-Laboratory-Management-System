import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { TaskRepository } from '../ports/repository.js';
export class DeleteDraftTaskUseCase {
  constructor(private readonly repository: TaskRepository) {}
  async execute(input: {
    actor: ActorContext;
    taskId: string;
    expectedVersion: bigint;
    requestId: string;
    reason: string;
  }) {
    const task = await this.repository.get(input.taskId, input.actor);
    if (!task) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (!input.reason?.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-TASK-DELETE-DRAFT',
        action: 'DELETE_DRAFT',
        entity: { type: 'TASK', id: task.id, state: task.state },
        scope: {},
        currentVersion: task.version,
        expectedVersion: input.expectedVersion,
        businessCondition: task.state === 'DRAFT',
      },
      { throwOnDeny: true },
    );
    if (!this.repository.deleteDraft) {
      throw new AppError('SYSTEM_INTERNAL', { userSafe: false });
    }
    await this.repository.deleteDraft({ ...input, id: input.taskId });
  }
}
