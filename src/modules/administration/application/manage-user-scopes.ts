import { AppError } from '../../../shared/errors/app-error.js';
import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext, ScopeKind } from '../../../shared/authorization/types.js';
import type { AuthorizationRepository } from '../ports/authorization-repository.js';
import { scopeKindNeedsApprovedDirectory } from '../../../shared/authorization/types.js';
export class ManageUserScopesUseCase {
  constructor(private readonly repository: AuthorizationRepository) {}
  async execute(input: {
    actor: ActorContext;
    userId: string;
    scopes: readonly { kind: ScopeKind; value?: string }[];
    requestId: string;
    reason?: string;
  }) {
    if (input.userId === input.actor.id)
      throw new AppError('AUTHZ_SOD_VIOLATION', { userSafe: true });
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-ADM-SCOPE-ASSIGN',
        action: 'ASSIGN',
        entity: { type: 'USER', id: input.userId, state: 'ACTIVE' },
        scope: {},
        currentVersion: 1,
        expectedVersion: 1,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    if (input.scopes.some((scope) => scopeKindNeedsApprovedDirectory(scope.kind))) {
      const reason = input.reason?.trim() ?? '';
      if (reason.length < 8 || reason.length > 500)
        throw new AppError('VALIDATION_FAILED', { userSafe: true });
      return this.repository.createUserScopeChangeRequest({
        userId: input.userId,
        scopeAssignments: input.scopes,
        actorId: input.actor.id,
        requestId: input.requestId,
        reason,
      });
    }
    return this.repository.replaceUserScopes({ ...input, actorId: input.actor.id });
  }
}
