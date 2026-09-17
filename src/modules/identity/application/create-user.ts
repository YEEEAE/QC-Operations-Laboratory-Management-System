import { AppError } from '../../../shared/errors/app-error.js';
import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { AuditService } from '../../../shared/audit/audit-service.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import type { User } from '../domain/user.js';
import type { UserRepository } from '../ports/user-repository.js';
import type { PasswordHasher } from '../security/password-hasher.js';

export class CreateUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly passwords: PasswordHasher,
    private readonly audit?: AuditService,
  ) {}
  async execute(input: {
    actor: ActorContext;
    loginIdentity: string;
    email?: string;
    displayName: string;
    temporaryPassword: string;
    requestId: string;
    roleCodes?: readonly string[];
    scopes?: readonly { kind: string; value?: string }[];
  }): Promise<Omit<User, 'passwordHash'>> {
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-IDN-MANAGE-USERS',
        action: 'MANAGE',
        entity: { type: 'USER', id: input.actor.id, state: 'ACTIVE' },
        scope: {},
        currentVersion: 1,
        expectedVersion: 1,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    if (!input.loginIdentity.trim() || !input.displayName.trim() || !input.temporaryPassword)
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    const at = new Date();
    const roleCodes = input.roleCodes ?? [];
    const scopes = input.scopes ?? [];
    const provisioned = Boolean(input.roleCodes || input.scopes);
    const hashedPassword = await this.passwords.hash(input.temporaryPassword);
    const user =
      input.roleCodes || input.scopes
        ? this.users.createProvisioned
          ? await this.users.createProvisioned({
              id: uuidv7(),
              loginIdentity: input.loginIdentity,
              email: input.email,
              displayName: input.displayName,
              passwordHash: hashedPassword,
              actorId: input.actor.id,
              at,
              roleCodes,
              scopes,
              requestId: input.requestId,
            })
          : (() => {
              throw new AppError('SYSTEM_DATABASE_UNAVAILABLE', { userSafe: true });
            })()
        : await this.users.create({
            id: uuidv7(),
            loginIdentity: input.loginIdentity,
            email: input.email,
            displayName: input.displayName,
            passwordHash: hashedPassword,
            accountState: 'ACTIVE',
            mustChangePassword: true,
            actorId: input.actor.id,
            at,
          });
    if (this.audit && !provisioned)
      await this.audit.record({
        actorType: 'USER',
        actorId: input.actor.id,
        subjectType: 'USER',
        subjectId: user.id,
        action: 'CREATE_USER',
        requestId: input.requestId,
      });
    // passwordHash is deliberately excluded from the returned account contract.
    const { passwordHash: _excludedPasswordHash, ...safeUser } = user;
    void _excludedPasswordHash;
    return safeUser;
  }
}
