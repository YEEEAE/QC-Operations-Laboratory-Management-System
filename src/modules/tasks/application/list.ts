import type { ActorContext } from '../../../shared/authorization/types.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { Page } from '../../../shared/pagination/page.js';
import type { TaskRepository, TaskListFilter } from '../ports/repository.js';
export class ListTasksUseCase {
  constructor(private readonly repository: TaskRepository) {}
  execute(input: { actor: ActorContext; filter?: TaskListFilter; page: Page }) {
    if (input.actor.accountState !== 'ACTIVE') {
      throw new AppError('AUTHZ_DENIED');
    }
    const grant = input.actor.permissions.find(
      (item) => item.code === 'PERM-TASK-VIEW' && item.active !== false,
    );
    if (!grant) throw new AppError('AUTHZ_PERMISSION_MISSING', { userSafe: true });
    if (!grant.scopes.some((scope) => ['OWN', 'ASSIGNED', 'GLOBAL'].includes(scope)))
      throw new AppError('AUTHZ_SCOPE_DENIED', { userSafe: true });
    return this.repository.list(input);
  }
}
