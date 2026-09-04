import { createHash } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPool } from '../../../src/shared/database/pool.js';
import { loadMigrations, migrate, verifyMigrationIntegrity } from '../../../scripts/db/migrate.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

describe('database migration engine', () => {
  let databaseUrl: string;
  let pool: ReturnType<typeof createPool> | undefined;

  beforeAll(async () => {
    databaseUrl = getTestDatabaseUrl(await startPostgresContainer());
    pool = createPool({ connectionString: databaseUrl, max: 4 });
  });

  afterAll(async () => {
    await pool?.end();
    await stopPostgresContainer();
  });

  it('bootstraps an empty database and records the migration ledger', async () => {
    const client = await pool!.connect();
    try {
      await client.query('DROP SCHEMA IF EXISTS qc CASCADE');
    } finally {
      client.release();
    }

    const result = await migrate({ pool: pool! });
    expect(result.applied).toEqual(['0001', '0002', '0003', '0004', '0005']);
    const ledger = await pool!.query('SELECT version, name, checksum FROM qc.schema_migrations');
    expect(ledger.rows).toHaveLength(5);
    expect(ledger.rows[0].checksum).toBe(
      createHash('sha256')
        .update((await loadMigrations())[0].sql)
        .digest('hex'),
    );
  });

  it('fails closed when an applied migration checksum differs', async () => {
    const client = await pool!.connect();
    try {
      const migrations = await loadMigrations();
      const changed = migrations.map((migration) => ({ ...migration, checksum: '0'.repeat(64) }));
      await expect(verifyMigrationIntegrity(client, changed)).rejects.toThrow(/checksum mismatch/);
    } finally {
      client.release();
    }
  });

  it('serializes concurrent migration runners with the advisory lock', async () => {
    const [first, second] = await Promise.all([migrate({ pool }), migrate({ pool })]);
    expect(first.pending).toEqual([]);
    expect(second.pending).toEqual([]);
    expect(
      (await pool!.query('SELECT count(*)::int AS count FROM qc.schema_migrations')).rows[0].count,
    ).toBe(5);
  });

  it('supports the current upgrade path as a no-op after the latest migration', async () => {
    const applied = await migrate({ pool });
    const check = await migrate({ pool, check: true });
    expect(applied.pending).toEqual([]);
    expect(check.pending).toEqual([]);
  });
});
