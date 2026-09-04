import type { ActorContext } from '../../../shared/authorization/types.js';
import type { TaskRepository, TaskListFilter } from '../ports/repository.js';
export class ListTasksUseCase {
  constructor(private readonly repository: TaskRepository) {}
  execute(input: { actor: ActorContext; filter?: TaskListFilter }) { return this.repository.list(input); }
}
