import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { startPostgresContainer, stopPostgresContainer } from '../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../helpers/test-env.js';

describe('PostgreSQL 18 Testcontainers smoke', () => {
  let databaseUrl: string;

  beforeAll(async () => {
    databaseUrl = getTestDatabaseUrl(await startPostgresContainer());
  });

  afterAll(async () => {
    await stopPostgresContainer();
  });

  it('runs SELECT version() against a disposable PostgreSQL 18 database', async () => {
    const client = new Client({ connectionString: databaseUrl });

    await client.connect();
    try {
      const result = await client.query<{ version: string }>('SELECT version()');

      expect(result.rows[0]?.version).toContain('PostgreSQL 18');
    } finally {
      await client.end();
    }
  });
});
