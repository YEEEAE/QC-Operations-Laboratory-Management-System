import { AppError } from '../../../shared/errors/app-error.js';
import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { AuthorizationRepository } from '../ports/authorization-repository.js';

/**
 * Reads the canonical permission grants of one role for the role workspace
 * (/admin/roles/[roleId]). Grant changes go through UpdateRolePermissionsUseCase
 * with version, audit, and explicit assign authority.
 */
export class ListRolePermissionsUseCase {
  constructor(private readonly repository: AuthorizationRepository) {}

  async execute(input: { actor: ActorContext; roleId: string }) {
    const role = await this.repository.getRole(input.roleId);
    if (!role) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-ADM-PERMISSION-VIEW',
        action: 'VIEW',
        entity: { type: 'PERMISSION', id: 'permissions', state: 'ACTIVE' },
        scope: {},
        currentVersion: 1,
        expectedVersion: 1,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    return this.repository.listRolePermissions(input.roleId);
  }
}
