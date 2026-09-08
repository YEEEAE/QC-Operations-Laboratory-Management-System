import type { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { seedFoundationData } from '../../../db/seeds/common';
import {
  grantSystemOwnerAccess,
  SYSTEM_OWNER_ROLE_CODE,
} from '../../../scripts/access/grant-system-owner';
import { migrate } from '../../../scripts/db/migrate';
import { createPool } from '../../../src/shared/database/pool';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container';
import { getTestDatabaseUrl } from '../../helpers/test-env';

describe('exclusive system-owner access', () => {
  let databaseUrl = '';
  let pool: Pool | undefined;

  beforeAll(async () => {
    databaseUrl = getTestDatabaseUrl(await startPostgresContainer());
    pool = createPool({ connectionString: databaseUrl, max: 5 });
    await migrate({ pool });
    await seedFoundationData(pool);
    await pool.query(
      `INSERT INTO qc.users (login_identity, display_name, password_hash)
       VALUES
         ('yazeed', 'Yazeed', 'test-only-placeholder'),
         ('other-owner', 'Other owner', 'test-only-placeholder')`,
    );
  });

  afterAll(async () => {
    await pool?.end();
    await stopPostgresContainer();
  });

  it('grants every active permission and GLOBAL scope only to the selected account', async () => {
    const environment = {
      DATABASE_URL: databaseUrl,
      SYSTEM_OWNER_LOGIN_IDENTITY: 'yazeed',
    };
    const first = await grantSystemOwnerAccess(environment);
    expect(first.loginIdentity).toBe('yazeed');
    expect(first.permissionsGranted).toBe(first.totalActivePermissions);
    expect(first.roleAssigned).toBe(true);
    expect(first.globalScopeAssigned).toBe(true);

    const effective = await pool!.query<{ permission_count: number; global_scope: boolean }>(
      `SELECT
         count(DISTINCT permission.id)::int AS permission_count,
         bool_or(scope.scope_kind = 'GLOBAL' AND scope.revoked_at IS NULL) AS global_scope
       FROM qc.users account
       JOIN qc.user_roles assignment
         ON assignment.user_id = account.id AND assignment.revoked_at IS NULL
       JOIN qc.roles role ON role.id = assignment.role_id
       JOIN qc.role_permissions grant_row ON grant_row.role_id = role.id
       JOIN qc.permissions permission ON permission.id = grant_row.permission_id
       LEFT JOIN qc.user_scopes scope ON scope.user_id = account.id
       WHERE account.login_identity = 'yazeed' AND role.code = $1`,
      [SYSTEM_OWNER_ROLE_CODE],
    );
    expect(effective.rows[0]).toEqual({
      permission_count: first.totalActivePermissions,
      global_scope: true,
    });

    const second = await grantSystemOwnerAccess(environment);
    expect(second).toMatchObject({
      permissionsGranted: 0,
      roleAssigned: false,
      globalScopeAssigned: false,
    });
    const audits = await pool!.query<{ count: number }>(
      `SELECT count(*)::int AS count
       FROM qc.audit_events
       WHERE action = 'GRANT_SYSTEM_OWNER_ACCESS'`,
    );
    expect(audits.rows[0]?.count).toBe(1);
  });

  it('refuses to assign the exclusive role to a second account', async () => {
    await expect(
      grantSystemOwnerAccess({
        DATABASE_URL: databaseUrl,
        SYSTEM_OWNER_LOGIN_IDENTITY: 'other-owner',
      }),
    ).rejects.toThrow('SYSTEM_OWNER is already assigned to another account');
  });
});
