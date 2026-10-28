import { AppError } from '../../../shared/errors/app-error.js';
import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { PermissionCode } from '../../../shared/authorization/permissions.js';
import { isScopeKind, normalizeScopeValue, type ScopeKind } from '../../../shared/authorization/types.js';
import type { AuthorizationRepository } from '../ports/authorization-repository.js';
export class UpdateRolePermissionsUseCase {
  constructor(private readonly repository: AuthorizationRepository) {}
  async execute(input: {
    actor: ActorContext;
    roleId: string;
    permissionCodes: readonly PermissionCode[];
    scopeAssignments: readonly { kind: ScopeKind; value?: string }[];
    expectedVersion: bigint;
    requestId: string;
    idempotencyKey: string;
    reason: string;
  }): Promise<{ id: string; status: 'PENDING_POLICY' }> {
    // Check the catalog-level authority before looking up a caller-controlled
    // role ID, then recheck the exact row/version below.
    authorize({ actor: input.actor, permission: 'PERM-ADM-PERMISSION-ASSIGN', action: 'ASSIGN', entity: { type: 'ROLE', id: 'catalog', state: 'ACTIVE' }, scope: {}, currentVersion: 1, expectedVersion: 1, businessCondition: true }, { throwOnDeny: true });
    const role = await this.repository.getRole(input.roleId);
    if (!role) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    authorize({ actor: input.actor, permission: 'PERM-ADM-PERMISSION-ASSIGN', action: 'ASSIGN', entity: { type: 'ROLE', id: role.id, state: role.active ? 'ACTIVE' : 'INACTIVE' }, scope: {}, currentVersion: role.version, expectedVersion: input.expectedVersion, businessCondition: role.active }, { throwOnDeny: true });
    authorize({ actor: input.actor, permission: 'PERM-ADM-SCOPE-ASSIGN', action: 'ASSIGN', entity: { type: 'USER', id: 'authorization-matrix-request', state: 'ACTIVE' }, scope: {}, currentVersion: role.version, expectedVersion: input.expectedVersion, businessCondition: role.active }, { throwOnDeny: true });
    const reason = input.reason.trim();
    if (reason.length < 8 || reason.length > 500)
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    const normalizedScopes = input.scopeAssignments.map((assignment) => {
      if (!isScopeKind(assignment.kind)) throw new AppError('VALIDATION_FAILED', { userSafe: true });
      const normalized = normalizeScopeValue(assignment.kind, assignment.value);
      if (!normalized.ok) throw new AppError('VALIDATION_FAILED', { userSafe: true });
      return { kind: assignment.kind, ...(normalized.value ? { value: normalized.value } : {}) };
    });
    if (new Set(normalizedScopes.map((scope) => `${scope.kind}:${scope.value ?? ''}`)).size !== normalizedScopes.length)
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    return this.repository.createRoleMatrixChangeRequest({
      roleId: role.id,
      permissionCodes: input.permissionCodes,
      scopeAssignments: normalizedScopes,
      expectedVersion: input.expectedVersion,
      actorId: input.actor.id,
      requestId: input.requestId,
      idempotencyKey: input.idempotencyKey,
      reason,
    });
  }
}
