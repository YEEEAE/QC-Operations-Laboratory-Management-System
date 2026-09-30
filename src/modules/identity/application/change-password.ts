import { AppError } from '../../../shared/errors/app-error.js';
import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { UserRepository } from '../ports/user-repository.js';
import type { PasswordHasher } from '../security/password-hasher.js';
import type { CredentialMutationCommit } from '../ports/credential-mutation.js';

export class ChangePasswordUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly passwords: PasswordHasher,
    private readonly commit: CredentialMutationCommit,
  ) {}
  async execute(input: {
    actor: ActorContext;
    currentPassword: string;
    newPassword: string;
    requestId: string;
  }): Promise<void> {
    if (!input.currentPassword || !input.newPassword)
      throw new AppError('VALIDATION_FAILED', {
        userSafe: true,
        fieldErrors: { currentPassword: ['errors.required'], newPassword: ['errors.required'] },
      });
    const user = await this.users.findById(input.actor.id);
    if (!user) throw new AppError('AUTH_REQUIRED', { userSafe: true });
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-IDN-CHANGE-OWN-PASSWORD',
        action: 'CHANGE_PASSWORD',
        entity: { type: 'ACCOUNT', id: user.id, state: user.accountState, ownerId: user.id },
        scope: { ownerId: user.id },
        currentVersion: user.version,
        expectedVersion: user.version,
        businessCondition: user.id === input.actor.id,
      },
      { throwOnDeny: true },
    );
    if (!(await this.passwords.verify(input.currentPassword, user.passwordHash)))
      throw new AppError('AUTH_REAUTH_REQUIRED', { userSafe: true });
    const hash = await this.passwords.hash(input.newPassword);
    const at = new Date();
    await this.commit.execute({
      userId: user.id,
      passwordHash: hash,
      expectedVersion: user.version,
      actorId: input.actor.id,
      at,
      mustChangePassword: false,
      reason: 'PASSWORD_CHANGE',
      action: 'CHANGE_PASSWORD',
      requestId: input.requestId,
    });
  }
}
