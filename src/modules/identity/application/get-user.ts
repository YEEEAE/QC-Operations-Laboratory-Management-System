import { AppError } from '../../../shared/errors/app-error.js';
import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { UserRepository } from '../ports/user-repository.js';
import { toSafeUserView, type SafeUserView } from './safe-user-view.js';

export class GetUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(input: { actor: ActorContext; userId: string }): Promise<SafeUserView> {
    const target = await this.users.findById(input.userId);
    if (!target) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-IDN-MANAGE-USERS',
        action: 'MANAGE',
        entity: { type: 'USER', id: target.id, state: target.accountState },
        scope: {},
        currentVersion: target.version,
        expectedVersion: target.version,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    return toSafeUserView(target);
  }
}
