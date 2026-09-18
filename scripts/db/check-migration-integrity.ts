import { fileURLToPath } from 'node:url';

import { getPool } from '../../src/shared/database/pool.js';
import { loadMigrations, verifyMigrationIntegrity } from './migrate.js';

import { loadLocalEnv } from './load-local-env.js';

export async function checkMigrationIntegrity(): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await verifyMigrationIntegrity(client, await loadMigrations());
    console.log(JSON.stringify({ status: 'ok', migrations: (await loadMigrations()).length }));
  } finally {
    client.release();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // Load the ignored local `.env` through the allowlisted parser before the
  // canonical pool resolves `DATABASE_URL`.
  loadLocalEnv();
  checkMigrationIntegrity().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Migration integrity check failed.');
    process.exitCode = 1;
  });
}
