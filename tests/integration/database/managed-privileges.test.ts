import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPool } from '../../../src/shared/database/pool.js';
import { migrate } from '../../../scripts/db/migrate.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

describe('managed PostgreSQL migration principal', () => {
  let adminPool: ReturnType<typeof createPool> | undefined;
  let managedPool: ReturnType<typeof createPool> | undefined;
  let managedDatabaseUrl: string;
  let managedDatabaseName: string;

  beforeAll(async () => {
    if (process.env.QC_TEST_DATABASE_URL) return;

    const adminUrl = getTestDatabaseUrl(await startPostgresContainer());
    adminPool = createPool({ connectionString: adminUrl, max: 2 });
    const admin = await adminPool.connect();
    try {
      managedDatabaseName = `qc_managed_${Date.now()}`;
      await admin.query(
        `CREATE ROLE qc_managed_migrator LOGIN PASSWORD 'test-managed-password'
         NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT`,
      );
      await admin.query(
        `CREATE DATABASE "${managedDatabaseName}" OWNER qc_managed_migrator TEMPLATE template0`,
      );
      const url = new URL(adminUrl);
      url.pathname = `/${managedDatabaseName}`;
      url.username = 'qc_managed_migrator';
      url.password = 'test-managed-password';
      managedDatabaseUrl = url.toString();
      managedPool = createPool({ connectionString: managedDatabaseUrl, max: 2 });
    } finally {
      admin.release();
    }
  });

  afterAll(async () => {
    await managedPool?.end();
    if (adminPool && managedDatabaseName) {
      const admin = await adminPool.connect();
      try {
        await admin.query(`DROP DATABASE IF EXISTS "${managedDatabaseName}"`);
        await admin.query('DROP ROLE IF EXISTS qc_managed_migrator');
      } finally {
        admin.release();
      }
    }
    await adminPool?.end();
    await stopPostgresContainer();
  });

  it('migrates from empty using a non-superuser, non-CREATEROLE database owner', async () => {
    if (!managedPool) return;

    const result = await migrate({ pool: managedPool });
    expect(result.applied).toHaveLength(18);
    expect(
      (
        await managedPool.query(
          'SELECT current_user, rolsuper, rolcreaterole FROM pg_roles WHERE rolname = current_user',
        )
      ).rows[0],
    ).toMatchObject({ current_user: 'qc_managed_migrator', rolsuper: false, rolcreaterole: false });
    expect(
      (
        await managedPool.query(`
        SELECT count(*)::int AS count
        FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'qc' AND c.relkind IN ('r', 'p', 'S')
          AND pg_get_userbyid(c.relowner) <> current_user
      `)
      ).rows[0].count,
    ).toBe(0);
    expect(
      (await managedPool.query('SELECT count(*)::int AS count FROM qc.schema_migrations')).rows[0]
        .count,
    ).toBe(18);
    expect(
      (
        await managedPool.query(
          'INSERT INTO qc.users (login_identity, display_name, password_hash) VALUES ($1, $2, $3) RETURNING id',
          ['managed-user', 'Managed User', 'hash'],
        )
      ).rows[0].id,
    ).toBeTruthy();
    expect((await migrate({ pool: managedPool })).applied).toEqual([]);
  });
});
