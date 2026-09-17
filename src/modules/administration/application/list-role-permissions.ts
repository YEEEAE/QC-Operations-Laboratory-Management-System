import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { AuthorizationRepository } from '../ports/authorization-repository.js';

/**
 * Reads the canonical permission grants of one role for the visible role
 * workspace. Grant changes remain separately server-authorized.
 */
export class ListRolePermissionsUseCase {
  constructor(private readonly repository: AuthorizationRepository) {}

  async execute(input: { actor: ActorContext; roleId: string }) {
    const role = await this.repository.getRole(input.roleId);
    if (!role) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (input.actor.accountState !== 'ACTIVE')
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    return this.repository.listRolePermissions(input.roleId);
  }
}
