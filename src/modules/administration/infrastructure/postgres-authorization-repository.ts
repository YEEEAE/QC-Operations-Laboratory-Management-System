import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema, DatabaseRow } from '../../../shared/database/db-types.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import type { AuditRepository } from '../../../shared/audit/audit-repository.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import type {
  AuthorizationRepository,
  PermissionRecord,
  RoleRecord,
  UserScopeRecord,
} from '../ports/authorization-repository.js';
import type { PermissionCode } from '../../../shared/authorization/permissions.js';
import {
  isCanonicalSystemOwnerId,
  isProtectedOwnerRoleGrant,
  isProtectedOwnerScope,
} from '../../../shared/authorization/p05-authority.js';
import {
  isScopeKind,
  normalizeScopeValue,
  scopeKindNeedsApprovedDirectory,
  type ScopeKind,
} from '../../../shared/authorization/types.js';

const role = (r: DatabaseRow<'roles'>): RoleRecord => ({
  id: r.id,
  code: r.code,
  name: r.name,
  description: r.description,
  isSystemRole: r.is_system_role,
  active: r.active,
  version: BigInt(r.version),
});
const permission = (r: DatabaseRow<'permissions'>): PermissionRecord => ({
  id: r.id,
  code: r.code as PermissionCode,
  domain: r.domain,
  action: r.action,
  description: r.description,
  riskLevel: r.risk_level,
  active: r.active,
});
const scope = (r: DatabaseRow<'user_scopes'>): UserScopeRecord => ({
  id: r.id as string,
  userId: r.user_id,
  kind: r.scope_kind as ScopeKind,
  value: r.scope_value,
  assignedBy: r.assigned_by,
  assignedAt: r.assigned_at,
  revokedAt: r.revoked_at,
});

export class PostgresAuthorizationRepository implements AuthorizationRepository {
  constructor(
    private readonly db: Kysely<DatabaseSchema>,
    private readonly audit?: AuditRepository,
  ) {}
  async listRoles() {
    return (await this.db.selectFrom('roles').selectAll().orderBy('code').execute()).map(role);
  }
  async getRole(roleId: string) {
    const r = await this.db
      .selectFrom('roles')
      .selectAll()
      .where('id', '=', roleId)
      .executeTakeFirst();
    return r ? role(r) : undefined;
  }
  async listPermissions() {
    return (
      await this.db
        .selectFrom('permissions')
        .selectAll()
        .where('active', '=', true)
        .orderBy('code')
        .execute()
    ).map(permission);
  }
  async listRolePermissions(roleId: string) {
    const rows = await this.db
      .selectFrom('role_permissions')
      .innerJoin('permissions', 'permissions.id', 'role_permissions.permission_id')
      .select(['permissions.code as code'])
      .where('role_permissions.role_id', '=', roleId)
      .where('permissions.active', '=', true)
      .orderBy('permissions.code')
      .execute();
    return rows.map((row) => row.code as PermissionCode);
  }
  async listUserScopes(userId: string) {
    return (
      await this.db
        .selectFrom('user_scopes')
        .selectAll()
        .where('user_id', '=', userId)
        .where('revoked_at', 'is', null)
        .orderBy('scope_kind')
        .execute()
    ).map(scope);
  }
  async listUserRoles(userId: string) {
    const rows = await this.db
      .selectFrom('user_roles')
      .innerJoin('roles', 'roles.id', 'user_roles.role_id')
      .select([
        'roles.id',
        'roles.code',
        'roles.name',
        'roles.description',
        'roles.is_system_role',
        'roles.active',
        'roles.version',
      ])
      .where('user_roles.user_id', '=', userId)
      .where('user_roles.revoked_at', 'is', null)
      .orderBy('roles.code')
      .execute();
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description,
      isSystemRole: r.is_system_role,
      active: r.active,
      version: BigInt(r.version),
    }));
  }
  async listUserRolesForUsers(userIds: readonly string[]) {
    if (!userIds.length) return [];
    const rows = await this.db
      .selectFrom('user_roles')
      .innerJoin('roles', 'roles.id', 'user_roles.role_id')
      .select(['user_roles.user_id as userId', 'roles.code'])
      .where('user_roles.user_id', 'in', userIds as string[])
      .where('user_roles.revoked_at', 'is', null)
      .orderBy('user_roles.user_id')
      .orderBy('roles.code')
      .execute();
    const grouped = new Map<string, string[]>();
    for (const row of rows) grouped.set(row.userId, [...(grouped.get(row.userId) ?? []), row.code]);
    return [...grouped.entries()].map(([userId, codes]) => ({ userId, codes }));
  }
  async listUserScopesForUsers(userIds: readonly string[]) {
    if (!userIds.length) return [];
    const rows = await this.db
      .selectFrom('user_scopes')
      .selectAll()
      .where('user_id', 'in', userIds as string[])
      .where('revoked_at', 'is', null)
      .orderBy('user_id')
      .orderBy('scope_kind')
      .execute();
    const grouped = new Map<string, UserScopeRecord[]>();
    for (const row of rows) {
      const value = scope(row);
      grouped.set(row.user_id, [...(grouped.get(row.user_id) ?? []), value]);
    }
    return [...grouped.entries()].map(([userId, scopes]) => ({ userId, scopes }));
  }
  async assignUserRole(input: {
    userId: string;
    roleId: string;
    actorId: string;
    requestId: string;
    reason?: string;
  }) {
    await this.db.transaction().execute(async (tx) => {
      const [target, assignedRole] = await Promise.all([
        tx
          .selectFrom('users')
          .select(['id', 'account_state'])
          .where('id', '=', input.userId)
          .executeTakeFirst(),
        tx
          .selectFrom('roles')
          .select(['id', 'code', 'active'])
          .where('id', '=', input.roleId)
          .executeTakeFirst(),
      ]);
      if (!target || !assignedRole || !assignedRole.active)
        throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      if (
        assignedRole.code === 'SYSTEM_OWNER' &&
        (!isCanonicalSystemOwnerId(target.id) || target.account_state !== 'ACTIVE')
      )
        throw new AppError('AUTHZ_DENIED', { userSafe: true });
      const result = await tx
        .insertInto('user_roles')
        .values({
          user_id: input.userId,
          role_id: input.roleId,
          assigned_by: input.actorId,
          reason: input.reason ?? null,
        })
        .onConflict((oc) =>
          oc.columns(['user_id', 'role_id']).where('revoked_at', 'is', null).doNothing(),
        )
        .executeTakeFirst();
      if ((result.numInsertedOrUpdatedRows ?? 0n) > 0n && this.audit)
        await this.auditFor(tx).append({
          actorType: 'USER',
          actorId: input.actorId,
          subjectType: 'USER',
          subjectId: input.userId,
          action: 'ASSIGN_USER_ROLE',
          requestId: input.requestId,
          reason: input.reason,
          payload: { roleId: input.roleId },
        });
    });
  }
  async removeUserRole(input: {
    userId: string;
    roleId: string;
    actorId: string;
    requestId: string;
    reason?: string;
  }) {
    await this.db.transaction().execute(async (tx) => {
      const protectedOwner = await tx
        .selectFrom('user_roles')
        .innerJoin('users', 'users.id', 'user_roles.user_id')
        .innerJoin('roles', 'roles.id', 'user_roles.role_id')
        .select(['users.id', 'users.account_state'])
        .where('user_roles.user_id', '=', input.userId)
        .where('user_roles.role_id', '=', input.roleId)
        .where('roles.code', '=', 'SYSTEM_OWNER')
        .where('roles.active', '=', true)
        .where('user_roles.revoked_at', 'is', null)
        .executeTakeFirst();
      if (protectedOwner && isProtectedOwnerRoleGrant(protectedOwner.id, protectedOwner.account_state, 'SYSTEM_OWNER'))
        throw new AppError('AUTHZ_DENIED', { userSafe: true });
      const result = await tx
        .updateTable('user_roles')
        .set({ revoked_at: new Date(), revoked_by: input.actorId })
        .where('user_id', '=', input.userId)
        .where('role_id', '=', input.roleId)
        .where('revoked_at', 'is', null)
        .executeTakeFirst();
      if ((result.numUpdatedRows ?? 0n) > 0n && this.audit)
        await this.auditFor(tx).append({
          actorType: 'USER',
          actorId: input.actorId,
          subjectType: 'USER',
          subjectId: input.userId,
          action: 'REMOVE_USER_ROLE',
          requestId: input.requestId,
          reason: input.reason,
          payload: { roleId: input.roleId },
        });
    });
  }
  async replaceRolePermissions(
    input: Parameters<AuthorizationRepository['replaceRolePermissions']>[0],
  ) {
    return this.db.transaction().execute(async (tx) => {
      const r = await tx
        .updateTable('roles')
        .set({ version: input.expectedVersion + 1n, updated_at: new Date() })
        .where('id', '=', input.roleId)
        .where('version', '=', input.expectedVersion)
        .returningAll()
        .executeTakeFirst();
      if (!r) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
      const ids = input.permissionCodes.length
        ? await tx
            .selectFrom('permissions')
            .select(['id', 'code'])
            .where('code', 'in', input.permissionCodes as string[])
            .where('active', '=', true)
            .execute()
        : [];
      if (ids.length !== input.permissionCodes.length)
        throw new AppError('VALIDATION_FAILED', { userSafe: true });
      await tx.deleteFrom('role_permissions').where('role_id', '=', input.roleId).execute();
      if (ids.length)
        await tx
          .insertInto('role_permissions')
          .values(
            ids.map((p) => ({
              role_id: input.roleId,
              permission_id: p.id,
              granted_by: input.actorId,
            })),
          )
          .execute();
      if (this.audit)
        await this.auditFor(tx).append({
          actorType: 'USER',
          actorId: input.actorId,
          subjectType: 'ROLE',
          subjectId: input.roleId,
          action: 'UPDATE_ROLE_PERMISSIONS',
          oldState: String(input.expectedVersion),
          newState: String(input.expectedVersion + 1n),
          requestId: input.requestId,
          payload: { permissionCodes: input.permissionCodes },
        });
      return role(r);
    });
  }
  async createRoleMatrixChangeRequest(
    input: Parameters<AuthorizationRepository['createRoleMatrixChangeRequest']>[0],
  ) {
    if (!this.audit) throw new AppError('DEPENDENCY_UNAVAILABLE', { userSafe: true });
    return this.db.transaction().execute(async (tx) => {
      const roleRow = await tx
        .selectFrom('roles')
        .select(['id', 'active', 'version'])
        .where('id', '=', input.roleId)
        .forUpdate()
        .executeTakeFirst();
      if (!roleRow || !roleRow.active)
        throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      if (BigInt(roleRow.version) !== input.expectedVersion)
        throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });

      const permissions = [...new Set(input.permissionCodes)].sort();
      const known = permissions.length
        ? await tx.selectFrom('permissions').select('code')
            .where('code', 'in', permissions as string[]).where('active', '=', true).execute()
        : [];
      if (known.length !== permissions.length)
        throw new AppError('VALIDATION_FAILED', { userSafe: true });
      const scopeAssignments = [...input.scopeAssignments]
        .sort((left, right) => `${left.kind}:${left.value ?? ''}`.localeCompare(`${right.kind}:${right.value ?? ''}`));
      const proposedPermissionCodes = permissions;
      const proposedScopeAssignments = scopeAssignments;

      const inserted = await tx
        .insertInto('authorization_matrix_change_requests')
        .values({
          id: uuidv7(),
          role_id: input.roleId,
          requested_by: input.actorId,
          request_id: input.requestId,
          idempotency_key: input.idempotencyKey,
          expected_role_version: input.expectedVersion,
          reason: input.reason,
          proposed_permission_codes: proposedPermissionCodes,
          proposed_scope_assignments: proposedScopeAssignments,
          status: 'PENDING_POLICY',
        })
        .onConflict((oc) => oc.doNothing())
        .returning(['id', 'status'])
        .executeTakeFirst();

      if (!inserted) {
        const previous = await tx
          .selectFrom('authorization_matrix_change_requests')
          .selectAll()
          .where('requested_by', '=', input.actorId)
          .where('idempotency_key', '=', input.idempotencyKey)
          .executeTakeFirst();
        if (
          previous && previous.requested_by === input.actorId && previous.role_id === input.roleId &&
          BigInt(previous.expected_role_version) === input.expectedVersion && previous.reason === input.reason &&
          JSON.stringify(previous.proposed_permission_codes) === JSON.stringify(proposedPermissionCodes) &&
          JSON.stringify(previous.proposed_scope_assignments) === JSON.stringify(proposedScopeAssignments)
        ) return { id: previous.id, status: 'PENDING_POLICY' as const };
        throw new AppError('DUPLICATE_COMMAND', { userSafe: true });
      }

      await this.auditFor(tx).append({
          actorType: 'USER',
          actorId: input.actorId,
          subjectType: 'ROLE',
          subjectId: input.roleId,
          action: 'REQUEST_ROLE_MATRIX_CHANGE',
          requestId: input.requestId,
          reason: input.reason,
          payload: {
            roleId: input.roleId,
            requestRecordId: inserted.id,
            expectedRoleVersion: input.expectedVersion.toString(),
            permissionCodes: proposedPermissionCodes,
            scopeAssignments: proposedScopeAssignments,
            status: 'PENDING_POLICY',
          },
      });
      return { id: inserted.id, status: 'PENDING_POLICY' as const };
    });
  }
  async createUserScopeChangeRequest(
    input: Parameters<AuthorizationRepository['createUserScopeChangeRequest']>[0],
  ) {
    if (!this.audit) throw new AppError('DEPENDENCY_UNAVAILABLE', { userSafe: true });
    return this.db.transaction().execute(async (tx) => {
      const target = await tx.selectFrom('users').select('id')
        .where('id', '=', input.userId).executeTakeFirst();
      if (!target) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      const scopeAssignments = [...input.scopeAssignments]
        .sort((left, right) => `${left.kind}:${left.value ?? ''}`.localeCompare(`${right.kind}:${right.value ?? ''}`));
      const inserted = await tx.insertInto('authorization_scope_change_requests').values({
        id: uuidv7(),
        user_id: input.userId,
        requested_by: input.actorId,
        request_id: input.requestId,
        reason: input.reason,
        proposed_scope_assignments: scopeAssignments,
        status: 'PENDING_POLICY',
      }).onConflict((oc) => oc.column('request_id').doNothing())
        .returning(['id', 'status']).executeTakeFirst();
      if (!inserted) {
        const previous = await tx.selectFrom('authorization_scope_change_requests').selectAll()
          .where('request_id', '=', input.requestId).executeTakeFirst();
        if (previous && previous.requested_by === input.actorId && previous.user_id === input.userId &&
          previous.reason === input.reason &&
          JSON.stringify(previous.proposed_scope_assignments) === JSON.stringify(scopeAssignments))
          return { id: previous.id, status: 'PENDING_POLICY' as const };
        throw new AppError('DUPLICATE_COMMAND', { userSafe: true });
      }
      await this.auditFor(tx).append({
          actorType: 'USER', actorId: input.actorId,
          subjectType: 'USER', subjectId: input.userId,
          action: 'REQUEST_USER_SCOPE_CHANGE', requestId: input.requestId,
          reason: input.reason,
          payload: { userId: input.userId, requestRecordId: inserted.id, scopeAssignments, status: 'PENDING_POLICY' },
        });
      return { id: inserted.id, status: 'PENDING_POLICY' as const };
    });
  }
  async replaceUserScopes(input: Parameters<AuthorizationRepository['replaceUserScopes']>[0]) {
    return this.db.transaction().execute(async (tx) => {
      const scopes = input.scopes.map((scope) => {
        if (!isScopeKind(scope.kind)) throw new AppError('VALIDATION_FAILED', { userSafe: true });
        if (scopeKindNeedsApprovedDirectory(scope.kind))
          throw new AppError('POLICY_SOURCE_REQUIRED', { userSafe: true });
        const normalized = normalizeScopeValue(scope.kind, scope.value);
        if (!normalized.ok) throw new AppError('VALIDATION_FAILED', { userSafe: true });
        return { kind: scope.kind, ...(normalized.value ? { value: normalized.value } : {}) };
      });
      if (
        new Set(scopes.map((scope) => `${scope.kind}:${scope.value ?? ''}`)).size !== scopes.length
      )
        throw new AppError('VALIDATION_FAILED', { userSafe: true });
      const target = await tx
        .selectFrom('users')
        .select(['id', 'account_state'])
        .where('id', '=', input.userId)
        .executeTakeFirst();
      if (!target) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      const activeOwnerRole = await tx
        .selectFrom('user_roles')
        .innerJoin('roles', 'roles.id', 'user_roles.role_id')
        .select('user_roles.id')
        .where('user_roles.user_id', '=', target.id)
        .where('user_roles.revoked_at', 'is', null)
        .where('roles.code', '=', 'SYSTEM_OWNER')
        .where('roles.active', '=', true)
        .executeTakeFirst();
      if (activeOwnerRole && isProtectedOwnerRoleGrant(target.id, target.account_state, 'SYSTEM_OWNER') && !scopes.some((scope) => scope.kind === 'GLOBAL'))
        throw new AppError('AUTHZ_DENIED', { userSafe: true });
      await tx
        .updateTable('user_scopes')
        .set({ revoked_at: new Date(), revoked_by: input.actorId })
        .where('user_id', '=', input.userId)
        .where('revoked_at', 'is', null)
        .execute();
      if (scopes.length)
        await tx
          .insertInto('user_scopes')
          .values(
            scopes.map((s) => ({
              id: uuidv7(),
              user_id: input.userId,
              scope_kind: s.kind,
              scope_value: s.value ?? null,
              assigned_by: input.actorId,
              reason: input.reason ?? null,
            })),
          )
          .execute();
      if (this.audit)
        await this.auditFor(tx).append({
          actorType: 'USER',
          actorId: input.actorId,
          subjectType: 'USER',
          subjectId: input.userId,
          action: 'UPDATE_USER_SCOPES',
          requestId: input.requestId,
          payload: { scopes },
        });
      return (
        await tx
          .selectFrom('user_scopes')
          .selectAll()
          .where('user_id', '=', input.userId)
          .where('revoked_at', 'is', null)
          .execute()
      ).map(scope);
    });
  }
  async assignUserScope(input: Parameters<AuthorizationRepository['assignUserScope']>[0]) {
    if (scopeKindNeedsApprovedDirectory(input.kind))
      throw new AppError('POLICY_SOURCE_REQUIRED', { userSafe: true });
    const normalized = normalizeScopeValue(input.kind, input.value);
    if (!normalized.ok) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    return this.db.transaction().execute(async (tx) => {
      const target = await tx
        .selectFrom('users')
        .select(['id', 'account_state'])
        .where('id', '=', input.userId)
        .executeTakeFirst();
      if (!target) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      // Granting is idempotent: assigning a grant the member already holds
      // converges on the same end state and never duplicates the row or the
      // audit event.
      const inserted = await tx
        .insertInto('user_scopes')
        .values({
          id: uuidv7(),
          user_id: input.userId,
          scope_kind: input.kind,
          scope_value: normalized.value ?? null,
          assigned_by: input.actorId,
          reason: input.reason ?? null,
        })
        .onConflict((oc) => oc.doNothing())
        .executeTakeFirst();
      if ((inserted.numInsertedOrUpdatedRows ?? 0n) > 0n && this.audit)
        await this.auditFor(tx).append({
          actorType: 'USER',
          actorId: input.actorId,
          subjectType: 'USER',
          subjectId: input.userId,
          action: 'ASSIGN_USER_SCOPE',
          requestId: input.requestId,
          reason: input.reason,
          payload: { kind: input.kind, value: normalized.value ?? null },
        });
      return this.activeScopes(tx, input.userId);
    });
  }
  async removeUserScope(input: Parameters<AuthorizationRepository['removeUserScope']>[0]) {
    const normalized = normalizeScopeValue(input.kind, input.value);
    if (!normalized.ok) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    return this.db.transaction().execute(async (tx) => {
      const target = await tx
        .selectFrom('users')
        .select(['id', 'account_state'])
        .where('id', '=', input.userId)
        .executeTakeFirst();
      if (!target) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      const activeOwnerRole = await tx
        .selectFrom('user_roles')
        .innerJoin('roles', 'roles.id', 'user_roles.role_id')
        .select('user_roles.id')
        .where('user_roles.user_id', '=', target.id)
        .where('user_roles.revoked_at', 'is', null)
        .where('roles.code', '=', 'SYSTEM_OWNER')
        .where('roles.active', '=', true)
        .executeTakeFirst();
      if (activeOwnerRole && isProtectedOwnerScope(target.id, target.account_state, input.kind))
        throw new AppError('AUTHZ_DENIED', { userSafe: true });
      const removed = await tx
        .updateTable('user_scopes')
        .set({ revoked_at: new Date(), revoked_by: input.actorId })
        .where('user_id', '=', input.userId)
        .where('scope_kind', '=', input.kind)
        .where('revoked_at', 'is', null)
        .$if(normalized.value === undefined, (qb) => qb.where('scope_value', 'is', null))
        .$if(normalized.value !== undefined, (qb) =>
          qb.where('scope_value', '=', normalized.value as string),
        )
        .executeTakeFirst();
      // Removing an absent grant is a deterministic no-op: the end state the
      // operator asked for already holds, so nothing is audited.
      if ((removed.numUpdatedRows ?? 0n) > 0n && this.audit)
        await this.auditFor(tx).append({
          actorType: 'USER',
          actorId: input.actorId,
          subjectType: 'USER',
          subjectId: input.userId,
          action: 'REMOVE_USER_SCOPE',
          requestId: input.requestId,
          reason: input.reason,
          payload: { kind: input.kind, value: normalized.value ?? null },
        });
      return this.activeScopes(tx, input.userId);
    });
  }
  private async activeScopes(tx: Transaction<DatabaseSchema>, userId: string) {
    return (
      await tx
        .selectFrom('user_scopes')
        .selectAll()
        .where('user_id', '=', userId)
        .where('revoked_at', 'is', null)
        .orderBy('scope_kind')
        .execute()
    ).map(scope);
  }
  private auditFor(tx: Transaction<DatabaseSchema>): AuditRepository {
    return this.audit instanceof PostgresAuditRepository
      ? new PostgresAuditRepository(tx)
      : this.audit!;
  }
}
