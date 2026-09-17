import { AppError } from '../../../shared/errors/app-error.js';
import { authorize } from '../../../shared/authorization/authorize.js';
import { isNamedSystemOwner } from '../../../shared/authorization/p05-authority.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { AuthorizationRepository } from '../ports/authorization-repository.js';

export class ManageUserRoleUseCase {
  constructor(private readonly repository: AuthorizationRepository) {}
  async assign(input: {
    actor: ActorContext;
    userId: string;
    roleId: string;
    requestId: string;
    reason?: string;
  }) {
    this.authorize(input);
    return this.repository.assignUserRole({ ...input, actorId: input.actor.id });
  }
  async remove(input: {
    actor: ActorContext;
    userId: string;
    roleId: string;
    requestId: string;
    reason?: string;
  }) {
    this.authorize(input);
    if (input.userId === input.actor.id && isNamedSystemOwner(input.actor))
      throw new AppError('AUTHZ_SOD_VIOLATION', { userSafe: true });
    return this.repository.removeUserRole({ ...input, actorId: input.actor.id });
  }
  private authorize(input: {
    actor: ActorContext;
    userId: string;
    roleId: string;
    requestId: string;
    reason?: string;
  }) {
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-ADM-ROLE-ASSIGN',
        action: 'ASSIGN',
        entity: { type: 'ROLE', id: input.roleId, state: 'ACTIVE' },
        scope: {},
        currentVersion: 1,
        expectedVersion: 1,
        businessCondition: input.userId !== input.actor.id,
      },
      { throwOnDeny: true },
    );
  }
}
