import { AppError } from '../../../shared/errors/app-error.js';
import { authorize } from '../../../shared/authorization/authorize.js';
import {
  isScopeKind,
  normalizeScopeValue,
  type ScopeKind,
} from '../../../shared/authorization/types.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { AuthorizationRepository } from '../ports/authorization-repository.js';

/**
 * Explicit, incremental scope grant.
 *
 * Unlike the bulk replacement path, this affects exactly one grant and leaves
 * every unrelated scope the member already holds untouched.
 */
export class AssignUserScopeUseCase {
  constructor(private readonly repository: AuthorizationRepository) {}

  async execute(input: {
    actor: ActorContext;
    userId: string;
    kind: ScopeKind;
    value?: string;
    requestId: string;
    reason?: string;
  }) {
    if (!isScopeKind(input.kind)) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    const normalized = normalizeScopeValue(input.kind, input.value);
    if (!normalized.ok) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    this.authorize(input);
    return this.repository.assignUserScope({
      userId: input.userId,
      kind: input.kind,
      ...(normalized.value !== undefined ? { value: normalized.value } : {}),
      actorId: input.actor.id,
      requestId: input.requestId,
      ...(input.reason !== undefined ? { reason: input.reason } : {}),
    });
  }

  private authorize(input: { actor: ActorContext; userId: string }) {
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-ADM-SCOPE-ASSIGN',
        action: 'ASSIGN',
        entity: { type: 'USER', id: input.userId, state: 'ACTIVE' },
        scope: {},
        currentVersion: 1,
        expectedVersion: 1,
        // Scope grants are self-service-blocked: no actor may widen their own
        // visibility, even with the explicit assignment permission.
        businessCondition: input.userId !== input.actor.id,
      },
      { throwOnDeny: true },
    );
  }
}
