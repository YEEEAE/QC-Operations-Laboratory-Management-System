import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createPool } from '../../../src/shared/database/pool.js';
import { migrate } from '../../../scripts/db/migrate.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

describe('supported migration upgrade path', () => {
  let pool: ReturnType<typeof createPool> | undefined;

  beforeAll(async () => {
    pool = createPool({
      connectionString: getTestDatabaseUrl(await startPostgresContainer()),
      max: 2,
    });
    await pool!.query('DROP SCHEMA IF EXISTS qc CASCADE');
    await migrate({ pool: pool! });
  });

  afterAll(async () => {
    await pool?.end();
    await stopPostgresContainer();
  });

  it('replays the supported prior state to the same latest schema without duplicates', async () => {
    const before = await pool!.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'qc' ORDER BY table_name`,
    );
    const result = await migrate({ pool });
    const after = await pool!.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'qc' ORDER BY table_name`,
    );
    expect(result.applied).toEqual([]);
    expect(after.rows).toEqual(before.rows);
    expect(
      (await pool!.query('SELECT count(*)::int AS count FROM qc.schema_migrations')).rows[0].count,
    ).toBe(9);
  });
});
