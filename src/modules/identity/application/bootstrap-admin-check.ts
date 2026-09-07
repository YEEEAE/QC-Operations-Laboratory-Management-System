import type { Kysely } from 'kysely';

import { resolveActor } from './identity-dependencies.js';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import { authorize } from '../../../shared/authorization/authorize.js';
import { FOUNDATION_ROLE_PERMISSIONS } from '../../../../db/seeds/common.js';

const BOOTSTRAP_AUDIT_ACTIONS = [
  'BOOTSTRAP_CREATE_INITIAL_ADMIN',
  'BOOTSTRAP_ASSIGN_ADMIN_ROLE',
  'BOOTSTRAP_ASSIGN_GLOBAL_SCOPE',
] as const;

export interface BootstrapAdminCheckReport {
  userExists: boolean;
  accountActive: boolean;
  adminRole: boolean;
  globalScope: boolean;
  effectiveAdminAuthorization: boolean;
  bootstrapAuditPresence: boolean;
}

export async function checkBootstrapAdmin(
  database: Kysely<DatabaseSchema>,
  identity: string,
): Promise<BootstrapAdminCheckReport> {
  const user = await database
    .selectFrom('users')
    .select(['id', 'account_state'])
    .where('login_identity', '=', identity)
    .executeTakeFirst();

  if (!user) {
    return {
      userExists: false,
      accountActive: false,
      adminRole: false,
      globalScope: false,
      effectiveAdminAuthorization: false,
      bootstrapAuditPresence: false,
    };
  }

  const [adminRole, adminGrants, globalScope, auditRows, actor] = await Promise.all([
    database
      .selectFrom('user_roles')
      .innerJoin('roles', 'roles.id', 'user_roles.role_id')
      .select('roles.id')
      .where('user_roles.user_id', '=', user.id)
      .where('user_roles.revoked_at', 'is', null)
      .where('roles.code', '=', 'ADMIN')
      .where('roles.is_system_role', '=', true)
      .where('roles.active', '=', true)
      .executeTakeFirst(),
    database
      .selectFrom('user_roles')
      .innerJoin('roles', 'roles.id', 'user_roles.role_id')
      .innerJoin('role_permissions', 'role_permissions.role_id', 'roles.id')
      .innerJoin('permissions', 'permissions.id', 'role_permissions.permission_id')
      .select('permissions.code')
      .where('user_roles.user_id', '=', user.id)
      .where('user_roles.revoked_at', 'is', null)
      .where('roles.code', '=', 'ADMIN')
      .where('roles.is_system_role', '=', true)
      .where('roles.active', '=', true)
      .where('permissions.active', '=', true)
      .execute(),
    database
      .selectFrom('user_scopes')
      .select('id')
      .where('user_id', '=', user.id)
      .where('scope_kind', '=', 'GLOBAL')
      .where('revoked_at', 'is', null)
      .executeTakeFirst(),
    database
      .selectFrom('audit_events')
      .select('action')
      .where('subject_id', '=', user.id)
      .where('action', 'in', [...BOOTSTRAP_AUDIT_ACTIONS])
      .execute(),
    resolveActor(database, user.id),
  ]);

  const actualAdminGrants = new Set(adminGrants.map((grant) => grant.code));
  const expectedAdminGrants = new Set(FOUNDATION_ROLE_PERMISSIONS.ADMIN);
  const canonicalAdminAuthorization =
    actualAdminGrants.size === expectedAdminGrants.size &&
    [...expectedAdminGrants].every((permission) => actualAdminGrants.has(permission));
  const effectiveAdminAuthorization = Boolean(
    canonicalAdminAuthorization &&
    actor &&
    authorize({
      actor,
      permission: 'PERM-IDN-MANAGE-USERS',
      action: 'MANAGE',
      entity: { type: 'USER', id: user.id, state: 'ACTIVE' },
      scope: {},
      currentVersion: 1n,
      expectedVersion: 1n,
      businessCondition: true,
    }).allowed,
  );

  return {
    userExists: true,
    accountActive: user.account_state === 'ACTIVE',
    adminRole: Boolean(adminRole),
    globalScope: Boolean(globalScope),
    effectiveAdminAuthorization,
    bootstrapAuditPresence: new Set(auditRows.map((row) => row.action)).size === 3,
  };
}

export function formatBootstrapAdminCheck(report: BootstrapAdminCheckReport): string {
  return [
    `User exists: ${report.userExists ? 'YES' : 'NO'}`,
    `Account active: ${report.accountActive ? 'YES' : 'NO'}`,
    `ADMIN role: ${report.adminRole ? 'YES' : 'NO'}`,
    `GLOBAL scope: ${report.globalScope ? 'YES' : 'NO'}`,
    `Effective ADMIN authorization: ${report.effectiveAdminAuthorization ? 'PASS' : 'FAIL'}`,
    `Bootstrap audit presence: ${report.bootstrapAuditPresence ? 'YES' : 'NO'}`,
  ].join('\n');
}

export function redactBootstrapErrorMessage(
  error: unknown,
  environment: Record<string, string | undefined>,
): string {
  let message = error instanceof Error ? error.message : 'Bootstrap operation failed.';
  for (const secret of [environment.BOOTSTRAP_ADMIN_PASSWORD, environment.DATABASE_URL]) {
    if (secret) message = message.split(secret).join('[REDACTED]');
  }
  return message;
}
