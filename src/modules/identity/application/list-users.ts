import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { UserRepository } from '../ports/user-repository.js';
import { toSafeUserView, type SafeUserView } from './safe-user-view.js';

export class ListUsersUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(input: { actor: ActorContext }): Promise<readonly SafeUserView[]> {
    // The administration register is a safe, read-only projection. Mutation
    // authority is intentionally not inferred from its visibility.
    if (input.actor.accountState !== 'ACTIVE')
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    return (await this.users.listUsers()).map(toSafeUserView);
  }
}
