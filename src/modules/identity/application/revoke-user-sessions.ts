import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { AuditService } from '../../../shared/audit/audit-service.js';
import type { UserRepository } from '../ports/user-repository.js';
import type { SessionService } from './session-service.js';

export class RevokeUserSessionsUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionService,
    private readonly audit?: AuditService,
  ) {}
  async execute(input: {
    actor: ActorContext;
    userId: string;
    requestId: string;
    reason?: string;
  }) {
    const target = await this.users.findById(input.userId);
    if (!target) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-IDN-REVOKE-SESSIONS',
        action: 'REVOKE_SESSIONS',
        entity: { type: 'USER', id: target.id, state: target.accountState },
        scope: {},
        currentVersion: target.version,
        expectedVersion: target.version,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    await this.sessions.revokeAllForUser(target.id, 'ADMIN_REVOKE_SESSIONS');
    await this.audit?.record({
      actorType: 'USER',
      actorId: input.actor.id,
      subjectType: 'USER',
      subjectId: target.id,
      action: 'REVOKE_USER_SESSIONS',
      requestId: input.requestId,
      reason: input.reason,
    });
  }
}
