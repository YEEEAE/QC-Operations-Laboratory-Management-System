import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { AuthorizationRepository } from '../ports/authorization-repository.js';
export class GetRoleUseCase {
  constructor(private readonly repository: AuthorizationRepository) {}
  async execute(input: { actor: ActorContext; roleId: string }) {
    const role = await this.repository.getRole(input.roleId);
    if (!role) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (input.actor.accountState !== 'ACTIVE')
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    return role;
  }
}
