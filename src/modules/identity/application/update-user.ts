import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { AuditService } from '../../../shared/audit/audit-service.js';
import type { UserRepository } from '../ports/user-repository.js';
export class UpdateUserUseCase {
  constructor(private readonly users: UserRepository, private readonly audit?: AuditService) {}
  async execute(input: { actor: ActorContext; userId: string; displayName: string; email?: string; expectedVersion: bigint; requestId: string }) {
    const target = await this.users.findById(input.userId); if (!target) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    authorize({ actor: input.actor, permission: 'PERM-IDN-MANAGE-USERS', action: 'MANAGE', entity: { type: 'USER', id: target.id, state: target.accountState }, scope: {}, currentVersion: target.version, expectedVersion: input.expectedVersion, businessCondition: true }, { throwOnDeny: true });
    const updated = await this.users.updateProfile(target.id, { displayName: input.displayName, email: input.email, expectedVersion: input.expectedVersion, actorId: input.actor.id, at: new Date() });
    if (this.audit) await this.audit.record({ actorType: 'USER', actorId: input.actor.id, subjectType: 'USER', subjectId: target.id, action: 'UPDATE_USER', requestId: input.requestId });
    return updated;
  }
}
