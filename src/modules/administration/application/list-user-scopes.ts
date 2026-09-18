import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { AuthorizationRepository } from '../ports/authorization-repository.js';

/**
 * Safe read projection for the visible administration register. Scope
 * assignment remains separately authorized and blocks self-grants.
 */
export class ListUserScopesUseCase {
  constructor(private readonly repository: AuthorizationRepository) {}

  async execute(input: { actor: ActorContext; userId: string }) {
    if (input.actor.accountState !== 'ACTIVE')
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    return this.repository.listUserScopes(input.userId);
  }
  async executeForUsers(input: { actor: ActorContext; userIds: readonly string[] }) {
    if (input.actor.accountState !== 'ACTIVE')
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    if (this.repository.listUserScopesForUsers)
      return this.repository.listUserScopesForUsers(input.userIds);
    return Promise.all(
      input.userIds.map(async (userId) => ({
        userId,
        scopes: await this.repository.listUserScopes(userId),
      })),
    );
  }
}
