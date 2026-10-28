import { requireAdminWorkspaceRead } from '../../../shared/authorization/admin-workspace.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { AuthorizationRepository } from '../ports/authorization-repository.js';

/**
 * Safe read projection for the visible administration register. Scope
 * assignment remains separately authorized and blocks self-grants.
 */
export class ListUserScopesUseCase {
  constructor(private readonly repository: AuthorizationRepository) {}

  async execute(input: { actor: ActorContext; userId: string }) {
    requireAdminWorkspaceRead(input.actor);
    return this.repository.listUserScopes(input.userId);
  }
  async executeForUsers(input: { actor: ActorContext; userIds: readonly string[] }) {
    requireAdminWorkspaceRead(input.actor);
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
