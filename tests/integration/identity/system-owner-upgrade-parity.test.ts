import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadMigrations, migrate } from '../../../scripts/db/migrate.js';
import { seedFoundationData } from '../../../db/seeds/common.js';
import { createPool } from '../../../src/shared/database/pool.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

/**
 * QC-100-FINAL-016 P2-16 — upgrade path for an owner granted on an earlier
 * release.
 *
 * The named system owner's bundle is written by an on-demand script
 * (`scripts/access/grant-system-owner.ts`), so a deployment that only applies
 * migrations leaves that account without permissions added by later modules.
 * This suite reproduces that state (owner role present, Reject Report codes
 * absent) and proves the forward migration restores the bundle.
 */
describe('system-owner bundle upgrade path', () => {
  let pool: ReturnType<typeof createPool> | undefined;

  beforeAll(async () => {
    pool = createPool({
      connectionString: getTestDatabaseUrl(await startPostgresContainer()),
      max: 2,
    });
    // Per-suite schema isolation: this suite reproduces a *pre-0030* release, so
    // it must start from an empty schema. Required when QC_TEST_DATABASE_URL
    // points at a reused local cluster that another suite already migrated (the
    // same pattern used by the control-center and controlled-mutation suites).
    await pool.query('DROP SCHEMA IF EXISTS qc CASCADE');
    const migrations = await loadMigrations();
    const legacy = migrations.filter((migration) => migration.version !== '0030');
    await migrate({ pool, migrations: legacy });

    await seedFoundationData(pool);
    // Legacy state: the owner role exists with a bundle granted before the
    // Reject Reports module shipped, and it is assigned to the named owner.
    const role = await pool.query<{ id: string }>(
      `INSERT INTO qc.roles (code, name, description, is_system_role, active)
       VALUES ('SYSTEM_OWNER', 'System Owner', 'Explicit single-account full permission bundle', FALSE, TRUE)
       RETURNING id`,
    );
    const owner = await pool.query<{ id: string }>(
      `INSERT INTO qc.users (login_identity, display_name, password_hash)
       VALUES ('yazeed', 'Yazeed', 'test-only-placeholder')
       RETURNING id`,
    );
    await pool.query(
      `INSERT INTO qc.role_permissions (role_id, permission_id)
       SELECT $1, permission.id FROM qc.permissions permission
       WHERE permission.code IN ('PERM-TASK-VIEW', 'PERM-FIND-VIEW')`,
      [role.rows[0]!.id],
    );
    await pool.query(
      `INSERT INTO qc.user_roles (user_id, role_id, assigned_by, reason)
       VALUES ($1, $2, $1, 'upgrade-path fixture')`,
      [owner.rows[0]!.id, role.rows[0]!.id],
    );

    await migrate({ pool });
  });

  afterAll(async () => {
    await pool?.end();
    await stopPostgresContainer();
  });

  it('restores the Reject Report baseline on the pre-existing owner role', async () => {
    const grants = await pool!.query<{ code: string }>(
      `SELECT permission.code
       FROM qc.roles role
       JOIN qc.role_permissions grant_row ON grant_row.role_id = role.id
       JOIN qc.permissions permission ON permission.id = grant_row.permission_id
       WHERE role.code = 'SYSTEM_OWNER'
         AND permission.code LIKE 'PERM-RREJ-%'
       ORDER BY permission.code`,
    );
    expect(grants.rows.map((row) => row.code)).toEqual([
      'PERM-RREJ-ADMIN-CORRECT',
      'PERM-RREJ-CONFIRM-APPROVAL',
      'PERM-RREJ-CREATE',
      'PERM-RREJ-EDIT',
      'PERM-RREJ-FINALIZE',
      'PERM-RREJ-VIEW',
      'PERM-RREJ-VOID',
    ]);

    const effective = await pool!.query<{ permission_count: number; active_count: number }>(
      `SELECT
         count(DISTINCT permission.id)::int AS permission_count,
         (SELECT count(*)::int FROM qc.permissions WHERE active = TRUE) AS active_count
       FROM qc.users account
       JOIN qc.user_roles assignment
         ON assignment.user_id = account.id AND assignment.revoked_at IS NULL
       JOIN qc.roles role ON role.id = assignment.role_id
       JOIN qc.role_permissions grant_row ON grant_row.role_id = role.id
       JOIN qc.permissions permission ON permission.id = grant_row.permission_id
       WHERE account.login_identity = 'yazeed' AND role.code = 'SYSTEM_OWNER'`,
    );
    expect(effective.rows[0]).toEqual({
      permission_count: effective.rows[0]!.active_count,
      active_count: effective.rows[0]!.active_count,
    });
  });

  it('leaves the migration ledger and the owner assignment untouched', async () => {
    const assignments = await pool!.query<{ count: number }>(
      `SELECT count(*)::int AS count
       FROM qc.user_roles assignment
       JOIN qc.roles role ON role.id = assignment.role_id
       WHERE role.code = 'SYSTEM_OWNER' AND assignment.revoked_at IS NULL`,
    );
    expect(assignments.rows[0]?.count).toBe(1);
    const applied = await pool!.query<{ count: number }>(
      'SELECT count(*)::int AS count FROM qc.schema_migrations',
    );
    expect(applied.rows[0]?.count).toBe((await loadMigrations()).length);
  });
});
