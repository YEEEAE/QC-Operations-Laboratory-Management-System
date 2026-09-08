import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { Pool } from 'pg';

import { getDatabaseConnectionConfig } from '../../src/shared/database/pool.js';
import { loadLocalEnv } from '../db/load-local-env.js';

export const SYSTEM_OWNER_ROLE_CODE = 'SYSTEM_OWNER';

export interface SystemOwnerGrantConfig {
  databaseUrl: string;
  loginIdentity: string;
}

export function parseSystemOwnerGrantConfig(
  environment: NodeJS.ProcessEnv = process.env,
): SystemOwnerGrantConfig {
  loadLocalEnv(environment);
  const databaseUrl = environment.DATABASE_URL?.trim();
  const loginIdentity = environment.SYSTEM_OWNER_LOGIN_IDENTITY?.trim();
  if (!databaseUrl) throw new Error('DATABASE_URL is required.');
  if (!loginIdentity) throw new Error('SYSTEM_OWNER_LOGIN_IDENTITY is required.');
  return { databaseUrl, loginIdentity };
}

export interface SystemOwnerGrantResult {
  loginIdentity: string;
  permissionsGranted: number;
  roleAssigned: boolean;
  globalScopeAssigned: boolean;
  totalActivePermissions: number;
}

export async function grantSystemOwnerAccess(
  environment: NodeJS.ProcessEnv = process.env,
): Promise<SystemOwnerGrantResult> {
  const config = parseSystemOwnerGrantConfig(environment);
  const pool = new Pool({
    ...getDatabaseConnectionConfig(config.databaseUrl),
    application_name: 'qc-system-owner-grant',
    options: '-c timezone=UTC -c search_path=qc,pg_catalog',
  });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userResult = await client.query<{ id: string; account_state: string }>(
      `SELECT id, account_state
       FROM qc.users
       WHERE login_identity = $1
       FOR UPDATE`,
      [config.loginIdentity],
    );
    const user = userResult.rows[0];
    if (!user) throw new Error(`User ${config.loginIdentity} does not exist.`);
    if (user.account_state !== 'ACTIVE') {
      throw new Error(`User ${config.loginIdentity} is not ACTIVE.`);
    }

    const otherOwner = await client.query<{ login_identity: string }>(
      `SELECT owner.login_identity
       FROM qc.user_roles assignment
       JOIN qc.roles role ON role.id = assignment.role_id
       JOIN qc.users owner ON owner.id = assignment.user_id
       WHERE role.code = $1
         AND assignment.revoked_at IS NULL
         AND assignment.user_id <> $2
       LIMIT 1`,
      [SYSTEM_OWNER_ROLE_CODE, user.id],
    );
    if (otherOwner.rows[0]) {
      throw new Error(
        'SYSTEM_OWNER is already assigned to another account. Revoke it explicitly first.',
      );
    }

    await client.query(
      `INSERT INTO qc.roles (code, name, description, is_system_role, active)
       VALUES ($1, 'System Owner', 'Explicit single-account full permission bundle', FALSE, TRUE)
       ON CONFLICT (code) DO UPDATE
       SET name = EXCLUDED.name,
           description = EXCLUDED.description,
           active = TRUE,
           updated_at = CURRENT_TIMESTAMP,
           version = qc.roles.version + 1
       WHERE qc.roles.name IS DISTINCT FROM EXCLUDED.name
          OR qc.roles.description IS DISTINCT FROM EXCLUDED.description
          OR qc.roles.active IS DISTINCT FROM TRUE`,
      [SYSTEM_OWNER_ROLE_CODE],
    );

    const permissionGrant = await client.query(
      `INSERT INTO qc.role_permissions (role_id, permission_id, granted_by)
       SELECT role.id, permission.id, $2
       FROM qc.roles role
       CROSS JOIN qc.permissions permission
       WHERE role.code = $1 AND permission.active = TRUE
       ON CONFLICT (role_id, permission_id) DO NOTHING`,
      [SYSTEM_OWNER_ROLE_CODE, user.id],
    );
    const roleAssignment = await client.query(
      `INSERT INTO qc.user_roles (user_id, role_id, assigned_by, reason)
       SELECT $2, role.id, $2, 'User-approved exclusive system-owner access'
       FROM qc.roles role
       WHERE role.code = $1
         AND NOT EXISTS (
           SELECT 1
           FROM qc.user_roles current_assignment
           WHERE current_assignment.user_id = $2
             AND current_assignment.role_id = role.id
             AND current_assignment.revoked_at IS NULL
         )`,
      [SYSTEM_OWNER_ROLE_CODE, user.id],
    );
    const globalScope = await client.query(
      `INSERT INTO qc.user_scopes (user_id, scope_kind, scope_value, assigned_by, reason)
       SELECT $1, 'GLOBAL', NULL, $1, 'System-owner global scope'
       WHERE NOT EXISTS (
         SELECT 1
         FROM qc.user_scopes current_scope
         WHERE current_scope.user_id = $1
           AND current_scope.scope_kind = 'GLOBAL'
           AND current_scope.scope_value IS NULL
           AND current_scope.revoked_at IS NULL
       )`,
      [user.id],
    );

    const totalPermissions = await client.query<{ count: number }>(
      'SELECT count(*)::int AS count FROM qc.permissions WHERE active = TRUE',
    );
    const changed =
      (permissionGrant.rowCount ?? 0) +
      (roleAssignment.rowCount ?? 0) +
      (globalScope.rowCount ?? 0);
    if (changed > 0) {
      await client.query(
        `INSERT INTO qc.audit_events
          (actor_type, actor_id, subject_type, subject_id, action, reason, request_id, payload)
         VALUES ('USER', $1, 'USER', $1, 'GRANT_SYSTEM_OWNER_ACCESS',
                 'User-approved exclusive full-system access', $2, $3::jsonb)`,
        [
          user.id,
          `system-owner-grant:${randomUUID()}`,
          JSON.stringify({
            roleCode: SYSTEM_OWNER_ROLE_CODE,
            permissionsGranted: permissionGrant.rowCount ?? 0,
            roleAssigned: (roleAssignment.rowCount ?? 0) > 0,
            globalScopeAssigned: (globalScope.rowCount ?? 0) > 0,
          }),
        ],
      );
    }

    await client.query('COMMIT');
    return {
      loginIdentity: config.loginIdentity,
      permissionsGranted: permissionGrant.rowCount ?? 0,
      roleAssigned: (roleAssignment.rowCount ?? 0) > 0,
      globalScopeAssigned: (globalScope.rowCount ?? 0) > 0,
      totalActivePermissions: totalPermissions.rows[0]?.count ?? 0,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  grantSystemOwnerAccess()
    .then((result) => {
      console.log(
        `System-owner access is active for ${result.loginIdentity}: ${result.totalActivePermissions} permissions available.`,
      );
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : 'System-owner grant failed.');
      process.exitCode = 1;
    });
}
