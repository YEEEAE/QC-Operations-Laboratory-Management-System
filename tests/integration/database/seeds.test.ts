import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPool } from '../../../src/shared/database/pool.js';
import { migrate } from '../../../scripts/db/migrate.js';
import {
  assertNonProductionSeedEnvironment,
  getFoundationAuthorizationCounts,
  seedFoundationData,
} from '../../../db/seeds/common.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

describe('non-production foundation seeds', () => {
  let pool: ReturnType<typeof createPool> | undefined;

  beforeAll(async () => {
    pool = createPool({
      connectionString: getTestDatabaseUrl(await startPostgresContainer()),
      max: 2,
    });
    await migrate({ pool });
  });

  afterAll(async () => {
    await pool?.end();
    await stopPostgresContainer();
  });

  it('is idempotent when run twice and never accepts production guard', async () => {
    assertNonProductionSeedEnvironment('test', {
      NODE_ENV: 'test',
      QC_SEED_ALLOW_NON_PRODUCTION: 'true',
    });
    await seedFoundationData(pool!);
    const firstCounts = await readFoundationCounts();
    await seedFoundationData(pool!);
    const secondCounts = await readFoundationCounts();
    expect(secondCounts).toEqual(firstCounts);
    expect(firstCounts).toEqual({
      roleCount: getFoundationAuthorizationCounts().roleCount,
      permissionCount: getFoundationAuthorizationCounts().permissionCount,
      rolePermissionCount: getFoundationAuthorizationCounts().rolePermissionCount,
    });
    expect(() =>
      assertNonProductionSeedEnvironment('test', {
        NODE_ENV: 'production',
        QC_SEED_ALLOW_NON_PRODUCTION: 'true',
      }),
    ).toThrow();
  });

  async function readFoundationCounts() {
    const [roles, permissions, rolePermissions] = await Promise.all([
      pool!.query<{ count: number }>(
        'SELECT count(*)::int AS count FROM qc.roles WHERE is_system_role',
      ),
      pool!.query<{ count: number }>('SELECT count(*)::int AS count FROM qc.permissions'),
      pool!.query<{ count: number }>('SELECT count(*)::int AS count FROM qc.role_permissions'),
    ]);
    return {
      roleCount: roles.rows[0].count,
      permissionCount: permissions.rows[0].count,
      rolePermissionCount: rolePermissions.rows[0].count,
    };
  }
});
