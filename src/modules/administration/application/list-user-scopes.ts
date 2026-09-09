import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { AuthorizationRepository } from '../ports/authorization-repository.js';

/**
 * Workspace read for the scope-assignment workflow (/admin/scopes and the
 * scopes section of /admin/users/[userId]). Reading current scopes requires
 * the same explicit assignment authority; the mutation use case re-authorizes
 * and additionally blocks self-grants.
 */
export class ListUserScopesUseCase {
  constructor(private readonly repository: AuthorizationRepository) {}

  async execute(input: { actor: ActorContext; userId: string }) {
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-ADM-SCOPE-ASSIGN',
        action: 'ASSIGN',
        entity: { type: 'USER', id: input.userId, state: 'ACTIVE' },
        scope: {},
        currentVersion: 1,
        expectedVersion: 1,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    return this.repository.listUserScopes(input.userId);
  }
}
