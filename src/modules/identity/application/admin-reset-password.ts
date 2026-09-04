import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { AuditService } from '../../../shared/audit/audit-service.js';
import type { UserRepository } from '../ports/user-repository.js';
import type { PasswordHasher } from '../security/password-hasher.js';
import type { SessionService } from './session-service.js';
export class AdminResetPasswordUseCase {
  constructor(private readonly users: UserRepository, private readonly passwords: PasswordHasher, private readonly sessions: SessionService, private readonly audit?: AuditService) {}
  async execute(input: { actor: ActorContext; userId: string; temporaryPassword: string; expectedVersion: bigint; requestId: string }) {
    const target = await this.users.findById(input.userId); if (!target) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    authorize({ actor: input.actor, permission: 'PERM-IDN-RESET-PASSWORD', action: 'RESET_PASSWORD', entity: { type: 'USER', id: target.id, state: target.accountState }, scope: {}, currentVersion: target.version, expectedVersion: input.expectedVersion, businessCondition: target.id !== input.actor.id }, { throwOnDeny: true });
    await this.users.changePassword(target.id, await this.passwords.hash(input.temporaryPassword), input.expectedVersion, input.actor.id, new Date());
    await this.sessions.revokeAllForUser(target.id, 'PASSWORD_RESET');
    if (this.audit) await this.audit.record({ actorType: 'USER', actorId: input.actor.id, subjectType: 'USER', subjectId: target.id, action: 'ADMIN_RESET_PASSWORD', requestId: input.requestId });
  }
}
