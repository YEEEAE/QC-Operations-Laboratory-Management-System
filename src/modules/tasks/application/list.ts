import type { ActorContext } from '../../../shared/authorization/types.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { TaskRepository, TaskListFilter } from '../ports/repository.js';
export class ListTasksUseCase {
  constructor(private readonly repository: TaskRepository) {}
  execute(input: { actor: ActorContext; filter?: TaskListFilter }) {
    if (input.actor.accountState !== 'ACTIVE') {
      throw new AppError('AUTHZ_DENIED');
    }
    return this.repository.list(input);
  }
}
