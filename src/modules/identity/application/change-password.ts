import { AppError } from '../../../shared/errors/app-error.js';
import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { AuditService } from '../../../shared/audit/audit-service.js';
import type { UserRepository } from '../ports/user-repository.js';
import type { PasswordHasher } from '../security/password-hasher.js';
import type { SessionService } from './session-service.js';

export class ChangePasswordUseCase {
  constructor(private readonly users: UserRepository, private readonly passwords: PasswordHasher, private readonly sessions: SessionService, private readonly audit?: AuditService) {}
  async execute(input: { actor: ActorContext; currentPassword: string; newPassword: string; requestId: string }): Promise<void> {
    if (!input.currentPassword || !input.newPassword) throw new AppError('VALIDATION_FAILED', { userSafe: true, fieldErrors: { currentPassword: ['errors.required'], newPassword: ['errors.required'] } });
    const user = await this.users.findById(input.actor.id);
    if (!user) throw new AppError('AUTH_REQUIRED', { userSafe: true });
    authorize({ actor: input.actor, permission: 'PERM-IDN-CHANGE-OWN-PASSWORD', action: 'CHANGE_PASSWORD', entity: { type: 'ACCOUNT', id: user.id, state: 'ACTIVE', ownerId: user.id }, scope: { ownerId: user.id }, currentVersion: user.version, expectedVersion: user.version, businessCondition: user.id === input.actor.id }, { throwOnDeny: true });
    if (!(await this.passwords.verify(input.currentPassword, user.passwordHash))) throw new AppError('AUTH_REAUTH_REQUIRED', { userSafe: true });
    const hash = await this.passwords.hash(input.newPassword);
    const at = new Date();
    await this.users.changePassword(user.id, hash, user.version, input.actor.id, at);
    await this.sessions.revokeAllForUser(user.id, 'PASSWORD_CHANGE');
    if (this.audit) await this.audit.record({ actorType: 'USER', actorId: input.actor.id, subjectType: 'USER', subjectId: user.id, action: 'CHANGE_PASSWORD', requestId: input.requestId });
  }
}
