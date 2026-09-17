import { fileURLToPath } from 'node:url';
import { PERMISSION_CODES } from '../../src/shared/authorization/permissions.js';
import { SYSTEM_OWNER_LOGIN_IDENTITY } from '../../src/shared/authorization/p05-authority.js';
import { createPool, getDatabaseConnectionConfig } from '../../src/shared/database/pool.js';
import { loadLocalEnv } from '../db/load-local-env.js';

export async function checkSystemOwner(environment: NodeJS.ProcessEnv = process.env) {
  loadLocalEnv(environment);
  const databaseUrl = environment.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error('DATABASE_URL is required.');
  const pool = createPool({
    ...getDatabaseConnectionConfig(databaseUrl),
    application_name: 'qc-system-owner-check',
  });
  try {
    const owner = await pool.query<{ id: string; account_state: string }>(
      'SELECT id, account_state FROM qc.users WHERE login_identity = $1',
      [SYSTEM_OWNER_LOGIN_IDENTITY],
    );
    if (owner.rowCount !== 1)
      throw new Error(`Expected exactly one ${SYSTEM_OWNER_LOGIN_IDENTITY} account.`);
    if (owner.rows[0].account_state !== 'ACTIVE') throw new Error('Canonical owner is not ACTIVE.');
    const role = await pool.query<{ id: string }>(
      'SELECT id FROM qc.roles WHERE code = $1 AND active = TRUE',
      ['SYSTEM_OWNER'],
    );
    if (role.rowCount !== 1) throw new Error('Active SYSTEM_OWNER role is missing or duplicated.');
    const assignment = await pool.query(
      `SELECT 1 FROM qc.user_roles WHERE user_id = $1 AND role_id = $2 AND revoked_at IS NULL`,
      [owner.rows[0].id, role.rows[0].id],
    );
    if (assignment.rowCount !== 1) throw new Error('Canonical owner does not hold SYSTEM_OWNER.');
    const scope = await pool.query(
      `SELECT 1 FROM qc.user_scopes WHERE user_id = $1 AND scope_kind = 'GLOBAL' AND scope_value IS NULL AND revoked_at IS NULL`,
      [owner.rows[0].id],
    );
    if (scope.rowCount !== 1) throw new Error('Canonical owner does not hold GLOBAL scope.');
    const grants = await pool.query<{ code: string; duplicate_count: number }>(
      `SELECT p.code, count(*)::int AS duplicate_count
       FROM qc.role_permissions rp JOIN qc.permissions p ON p.id = rp.permission_id
       WHERE rp.role_id = $1 AND p.active = TRUE GROUP BY p.code`,
      [role.rows[0].id],
    );
    const granted = new Set(grants.rows.map((row) => row.code));
    const missing = PERMISSION_CODES.filter((code) => !granted.has(code));
    const unexpected = grants.rows
      .filter((row) => !PERMISSION_CODES.includes(row.code as never))
      .map((row) => row.code);
    const duplicates = grants.rows.filter((row) => row.duplicate_count > 1).map((row) => row.code);
    if (missing.length || unexpected.length || duplicates.length)
      throw new Error(
        `SYSTEM_OWNER permission invariant failed: missing=${missing.join(',') || 'none'} unexpected=${unexpected.join(',') || 'none'} duplicates=${duplicates.join(',') || 'none'}`,
      );
    console.log(
      `SYSTEM_OWNER check passed: ${PERMISSION_CODES.length} canonical permissions, GLOBAL scope, and active yazeed account.`,
    );
    return { permissionCount: PERMISSION_CODES.length, missing, unexpected, duplicates };
  } finally {
    await pool.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  checkSystemOwner().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'SYSTEM_OWNER check failed.');
    process.exitCode = 1;
  });
}
