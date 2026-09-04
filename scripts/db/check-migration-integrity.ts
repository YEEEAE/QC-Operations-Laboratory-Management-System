import { fileURLToPath } from 'node:url';

import { getPool } from '../../src/shared/database/pool.js';
import { loadMigrations, verifyMigrationIntegrity } from './migrate.js';

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
  checkMigrationIntegrity().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Migration integrity check failed.');
    process.exitCode = 1;
  });
}
