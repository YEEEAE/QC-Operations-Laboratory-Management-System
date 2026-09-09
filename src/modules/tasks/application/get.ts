import type { ActorContext } from '../../../shared/authorization/types.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { TaskRepository } from '../ports/repository.js';
export class GetTaskUseCase {
  constructor(private readonly repository: TaskRepository) {}
  async execute(input: { actor: ActorContext; taskId: string }) {
    if (input.actor.accountState !== 'ACTIVE') throw new AppError('AUTHZ_DENIED');
    const task = await this.repository.get(input.taskId, input.actor);
    if (!task) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    return task;
  }
}
