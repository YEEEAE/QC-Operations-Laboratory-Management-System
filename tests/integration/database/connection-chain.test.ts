import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadMigrations, migrate } from '../../../scripts/db/migrate.js';
import { createPool } from '../../../src/shared/database/pool.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

/**
 * Proves the runtime connection chain that the Render deployment depends on:
 *
 *   pool config → session `search_path` → `qc` schema boundary
 *              → migration ledger → pending-migration detection
 *              → application read/write
 *
 * The `qc` boundary is not decoration: `validate-restored-database.ts` fails
 * closed when `current_schema()` is not `qc`, and every operator script that
 * passes a URL through `getDatabaseConnectionConfig` relies on the same
 * contract. A connection that omits the canonical session options lands in
 * `public`, which is exactly the condition those gates must detect.
 *
 * Runs against the approved disposable PostgreSQL 18 environment
 * (`QC_TEST_DATABASE_URL`) or the Testcontainers image.
 */
describe('runtime connection chain: schema boundary and migration readiness', () => {
  let databaseUrl: string;
  let pool: ReturnType<typeof createPool> | undefined;

  beforeAll(async () => {
    databaseUrl = getTestDatabaseUrl(await startPostgresContainer());
    pool = createPool({ connectionString: databaseUrl, max: 4 });
    await pool.query('DROP SCHEMA IF EXISTS qc CASCADE');
  });

  afterAll(async () => {
    await pool?.end();
    await stopPostgresContainer();
  });

  it('applies the canonical search_path and UTC session to the runtime pool', async () => {
    await migrate({ pool: pool! });

    const session = await pool!.query<{
      search_path: string;
      timezone: string;
      schema: string | null;
    }>(
      `SELECT current_setting('search_path') AS search_path,
              current_setting('TimeZone') AS timezone,
              current_schema() AS schema`,
    );

    expect(session.rows[0].search_path).toBe('qc,pg_catalog');
    expect(session.rows[0].timezone).toBe('UTC');
    expect(session.rows[0].schema).toBe('qc');
  });

  it('exposes a wrong schema when the canonical session options are absent', async () => {
    // Negative control for the boundary assertion above: without the pool's
    // `search_path=qc,pg_catalog` option the same database reports `public`,
    // which is the exact reading that operator schema gates reject.
    const bare = new Client({ connectionString: databaseUrl });
    await bare.connect();
    try {
      const result = await bare.query<{ schema: string | null; search_path: string }>(
        `SELECT current_schema() AS schema, current_setting('search_path') AS search_path`,
      );
      const session = result.rows[0];

      expect(session.schema).toBe('public');
      expect(
        session.search_path
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean),
      ).not.toContain('qc');
      expect(session.schema).not.toBe('qc');
    } finally {
      await bare.end();
    }
  });

  it('reads and writes application tables through the canonical pool', async () => {
    const id = '01900000-0000-7000-8000-00000000e001';
    const client = await pool!.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO qc.users (id, login_identity, display_name, password_hash)
         VALUES ($1, 'connection-chain-actor', 'Connection chain actor', 'test-only-placeholder-not-a-secret')`,
        [id],
      );
      const read = await client.query<{ login_identity: string }>(
        'SELECT login_identity FROM qc.users WHERE id = $1',
        [id],
      );
      expect(read.rows[0].login_identity).toBe('connection-chain-actor');
      await client.query('ROLLBACK');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }

    const afterRollback = await pool!.query<{ count: number }>(
      'SELECT count(*)::int AS count FROM qc.users WHERE id = $1',
      [id],
    );
    expect(afterRollback.rows[0].count).toBe(0);
  });

  it('detects pending migrations when the database is behind the source head', async () => {
    const migrations = await loadMigrations();
    expect(migrations.length).toBeGreaterThan(2);
    const applied = migrations.slice(0, migrations.length - 2);
    const expectedPending = migrations.slice(-2).map((migration) => migration.version);

    await pool!.query('DROP SCHEMA IF EXISTS qc CASCADE');
    const partial = await migrate({ pool: pool!, migrations: applied });
    expect(partial.applied).toEqual(applied.map((migration) => migration.version));

    const behind = await migrate({ pool: pool!, check: true });
    expect(behind.pending).toEqual(expectedPending);

    // A check must never apply anything.
    expect((await migrate({ pool: pool!, check: true })).pending).toEqual(expectedPending);

    // Restore head so the shared disposable database is left consistent.
    await migrate({ pool: pool! });
    expect((await migrate({ pool: pool!, check: true })).pending).toEqual([]);
  });
});
