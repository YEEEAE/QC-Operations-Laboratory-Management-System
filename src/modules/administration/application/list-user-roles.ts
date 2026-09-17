import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { AuthorizationRepository } from '../ports/authorization-repository.js';

/**
 * Reads the role membership of one member under the explicit role-view grant.
 *
 * The registered authorization policy for `PERM-ADM-ROLE-VIEW` is declared on
 * the ROLE entity (`action: VIEW`), so the authorization input must use that
 * entity type. Authorizing with an undeclared entity type makes the registry
 * deny the request unconditionally, which previously made role membership
 * unreadable through this use case.
 */
export class ListUserRolesUseCase {
  constructor(private readonly repository: AuthorizationRepository) {}
  async execute(input: { actor: ActorContext; userId: string }) {
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-ADM-ROLE-VIEW',
        action: 'VIEW',
        entity: { type: 'ROLE', id: input.userId, state: 'ACTIVE' },
        scope: {},
        currentVersion: 1,
        expectedVersion: 1,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    return this.repository.listUserRoles(input.userId);
  }
}
