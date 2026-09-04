import { AppError } from '../../../shared/errors/app-error.js';
import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { UserRepository } from '../ports/user-repository.js';

export interface AccountView { id: string; loginIdentity: string; email?: string; displayName: string; accountState: string; mustChangePassword: boolean; lastLoginAt?: Date; version: bigint }
export class GetAccountUseCase {
  constructor(private readonly users: UserRepository) {}
  async execute(actor: ActorContext): Promise<AccountView> {
    const user = await this.users.findById(actor.id);
    if (!user) throw new AppError('AUTH_REQUIRED', { userSafe: true });
    authorize({ actor, permission: 'PERM-IDN-VIEW-SELF', action: 'VIEW', entity: { type: 'ACCOUNT', id: user.id, state: 'ACTIVE', ownerId: actor.id }, scope: { ownerId: actor.id }, currentVersion: user.version, expectedVersion: user.version, businessCondition: user.id === actor.id }, { throwOnDeny: true });
    return { id: user.id, loginIdentity: user.loginIdentity, ...(user.email ? { email: user.email } : {}), displayName: user.displayName, accountState: user.accountState, mustChangePassword: user.mustChangePassword, ...(user.lastLoginAt ? { lastLoginAt: user.lastLoginAt } : {}), version: user.version };
  }
}
