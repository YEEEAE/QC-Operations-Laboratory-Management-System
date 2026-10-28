import { requireAdminWorkspaceRead } from '../../../shared/authorization/admin-workspace.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { AuthorizationRepository } from '../ports/authorization-repository.js';

/**
 * Safe read projection for the visible administration register. Assignment and
 * removal remain separately authorized mutation operations.
 */
export class ListUserRolesUseCase {
  constructor(private readonly repository: AuthorizationRepository) {}
  async execute(input: { actor: ActorContext; userId: string }) {
    requireAdminWorkspaceRead(input.actor);
    return this.repository.listUserRoles(input.userId);
  }
  async executeForUsers(input: { actor: ActorContext; userIds: readonly string[] }) {
    requireAdminWorkspaceRead(input.actor);
    if (this.repository.listUserRolesForUsers)
      return this.repository.listUserRolesForUsers(input.userIds);
    const rows = await Promise.all(
      input.userIds.map(async (userId) => ({
        userId,
        roles: await this.repository.listUserRoles(userId),
      })),
    );
    return rows.map(({ userId, roles }) => ({ userId, codes: roles.map((role) => role.code) }));
  }
}
