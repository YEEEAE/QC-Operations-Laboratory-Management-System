import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { UserRepository } from '../ports/user-repository.js';
import { toSafeUserView, type SafeUserView } from './safe-user-view.js';

export class ListUsersUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(input: { actor: ActorContext }): Promise<readonly SafeUserView[]> {
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-IDN-MANAGE-USERS',
        action: 'MANAGE',
        entity: { type: 'USER', id: 'users', state: 'ACTIVE' },
        scope: {},
        currentVersion: 1,
        expectedVersion: 1,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    return (await this.users.listUsers()).map(toSafeUserView);
  }
}
