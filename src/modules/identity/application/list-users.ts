import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { UserListFilter, UserListPage, UserRepository } from '../ports/user-repository.js';
import { toSafeUserView, type SafeUserView } from './safe-user-view.js';

export class ListUsersUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(input: { actor: ActorContext }): Promise<readonly SafeUserView[]> {
    // The administration register is a safe, read-only projection. Mutation
    // authority is intentionally not inferred from its visibility.
    if (input.actor.accountState !== 'ACTIVE')
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    return (await this.users.listUsers()).map(toSafeUserView);
  }

  async executePage(input: { actor: ActorContext; filter: UserListFilter }): Promise<UserListPage> {
    if (input.actor.accountState !== 'ACTIVE')
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    if (!this.users.listUsersPage)
      throw new AppError('SYSTEM_DATABASE_UNAVAILABLE', {
        userSafe: true,
        retryability: 'INTERNAL_RETRY_ONLY',
      });
    return this.users.listUsersPage(input.filter);
  }

  async resolveDisplayNames(input: {
    actor: ActorContext;
    userIds: readonly string[];
  }): Promise<ReadonlyMap<string, string>> {
    if (input.actor.accountState !== 'ACTIVE')
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    if (!this.users.listUserDisplayNames)
      throw new AppError('SYSTEM_DATABASE_UNAVAILABLE', {
        userSafe: true,
        retryability: 'INTERNAL_RETRY_ONLY',
      });
    const ids = [...new Set(input.userIds)].filter((id) => id.length > 0).slice(0, 100);
    const rows = await this.users.listUserDisplayNames(ids);
    return new Map(rows.map((row) => [row.id, row.displayName]));
  }
}
