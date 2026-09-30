import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { UserRepository } from '../ports/user-repository.js';
import type { PasswordHasher } from '../security/password-hasher.js';
import type { CredentialMutationCommit } from '../ports/credential-mutation.js';
export class AdminResetPasswordUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly passwords: PasswordHasher,
    private readonly commit: CredentialMutationCommit,
  ) {}
  async execute(input: {
    actor: ActorContext;
    userId: string;
    temporaryPassword: string;
    expectedVersion: bigint;
    requestId: string;
  }) {
    const target = await this.users.findById(input.userId);
    if (!target) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-IDN-RESET-PASSWORD',
        action: 'RESET_PASSWORD',
        entity: { type: 'USER', id: target.id, state: target.accountState },
        scope: {},
        currentVersion: target.version,
        expectedVersion: input.expectedVersion,
        businessCondition: target.id !== input.actor.id,
      },
      { throwOnDeny: true },
    );
    await this.commit.execute({
      userId: target.id,
      passwordHash: await this.passwords.hash(input.temporaryPassword),
      expectedVersion: input.expectedVersion,
      actorId: input.actor.id,
      at: new Date(),
      mustChangePassword: true,
      reason: 'PASSWORD_RESET',
      action: 'ADMIN_RESET_PASSWORD',
      requestId: input.requestId,
    });
  }
}
