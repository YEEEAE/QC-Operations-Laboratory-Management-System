import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { AuthorizationRepository } from '../ports/authorization-repository.js';
export class ListPermissionsUseCase {
  constructor(private readonly repository: AuthorizationRepository) {}
  async execute(input: { actor: ActorContext }) {
    if (input.actor.accountState !== 'ACTIVE')
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    return this.repository.listPermissions();
  }
}
