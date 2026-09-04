import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema, DatabaseRow } from '../../../shared/database/db-types.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import type { AuditRepository } from '../../../shared/audit/audit-repository.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import type { AuthorizationRepository, PermissionRecord, RoleRecord, UserScopeRecord } from '../ports/authorization-repository.js';
import type { PermissionCode } from '../../../shared/authorization/permissions.js';
import type { ScopeKind } from '../../../shared/authorization/types.js';

const role = (r: DatabaseRow<'roles'>): RoleRecord => ({ id: r.id, code: r.code, name: r.name, description: r.description, isSystemRole: r.is_system_role, active: r.active, version: BigInt(r.version) });
const permission = (r: DatabaseRow<'permissions'>): PermissionRecord => ({ id: r.id, code: r.code as PermissionCode, domain: r.domain, action: r.action, description: r.description, riskLevel: r.risk_level, active: r.active });
const scope = (r: DatabaseRow<'user_scopes'>): UserScopeRecord => ({ id: r.id as string, userId: r.user_id, kind: r.scope_kind as ScopeKind, value: r.scope_value, assignedBy: r.assigned_by, assignedAt: r.assigned_at, revokedAt: r.revoked_at });

export class PostgresAuthorizationRepository implements AuthorizationRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>, private readonly audit?: AuditRepository) {}
  async listRoles() { return (await this.db.selectFrom('roles').selectAll().orderBy('code').execute()).map(role); }
  async getRole(roleId: string) { const r = await this.db.selectFrom('roles').selectAll().where('id', '=', roleId).executeTakeFirst(); return r ? role(r) : undefined; }
  async listPermissions() { return (await this.db.selectFrom('permissions').selectAll().where('active', '=', true).orderBy('code').execute()).map(permission); }
  async listUserScopes(userId: string) { return (await this.db.selectFrom('user_scopes').selectAll().where('user_id', '=', userId).where('revoked_at', 'is', null).orderBy('scope_kind').execute()).map(scope); }
  async replaceRolePermissions(input: Parameters<AuthorizationRepository['replaceRolePermissions']>[0]) {
    return this.db.transaction().execute(async (tx) => {
      const r = await tx.updateTable('roles').set({ version: input.expectedVersion + 1n, updated_at: new Date() }).where('id', '=', input.roleId).where('version', '=', input.expectedVersion).returningAll().executeTakeFirst();
      if (!r) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
      const ids = input.permissionCodes.length ? await tx.selectFrom('permissions').select(['id', 'code']).where('code', 'in', input.permissionCodes as string[]).where('active', '=', true).execute() : [];
      if (ids.length !== input.permissionCodes.length) throw new AppError('VALIDATION_FAILED', { userSafe: true });
      await tx.deleteFrom('role_permissions').where('role_id', '=', input.roleId).execute();
      if (ids.length) await tx.insertInto('role_permissions').values(ids.map((p) => ({ role_id: input.roleId, permission_id: p.id, granted_by: input.actorId }))).execute();
      if (this.audit) await this.auditFor(tx).append({ actorType: 'USER', actorId: input.actorId, subjectType: 'ROLE', subjectId: input.roleId, action: 'UPDATE_ROLE_PERMISSIONS', oldState: String(input.expectedVersion), newState: String(input.expectedVersion + 1n), requestId: input.requestId, payload: { permissionCodes: input.permissionCodes } });
      return role(r);
    });
  }
  async replaceUserScopes(input: Parameters<AuthorizationRepository['replaceUserScopes']>[0]) {
    return this.db.transaction().execute(async (tx) => {
      await tx.updateTable('user_scopes').set({ revoked_at: new Date(), revoked_by: input.actorId }).where('user_id', '=', input.userId).where('revoked_at', 'is', null).execute();
      if (input.scopes.length) await tx.insertInto('user_scopes').values(input.scopes.map((s) => ({ id: uuidv7(), user_id: input.userId, scope_kind: s.kind, scope_value: s.value ?? null, assigned_by: input.actorId, reason: input.reason ?? null }))).execute();
      if (this.audit) await this.auditFor(tx).append({ actorType: 'USER', actorId: input.actorId, subjectType: 'USER', subjectId: input.userId, action: 'UPDATE_USER_SCOPES', requestId: input.requestId, payload: { scopes: input.scopes } });
      return (await tx.selectFrom('user_scopes').selectAll().where('user_id', '=', input.userId).where('revoked_at', 'is', null).execute()).map(scope);
    });
  }
  private auditFor(tx: Transaction<DatabaseSchema>): AuditRepository { return this.audit instanceof PostgresAuditRepository ? new PostgresAuditRepository(tx) : this.audit!; }
}
