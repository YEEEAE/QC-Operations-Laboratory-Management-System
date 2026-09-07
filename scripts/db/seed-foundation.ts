import { fileURLToPath } from 'node:url';

import { createPool, getDatabaseConnectionConfig } from '../../src/shared/database/pool.js';
import { seedFoundationData } from '../../db/seeds/common.js';
import { loadLocalEnv } from './load-local-env.js';

export async function runFoundationSeed(environment = process.env): Promise<void> {
  loadLocalEnv(environment);
  const pool = createPool({
    ...getDatabaseConnectionConfig(environment.DATABASE_URL),
    application_name: 'qc-foundation-seed',
  });
  try {
    await seedFoundationData(pool);
    console.log('Foundation authorization seeded successfully.');
  } finally {
    await pool.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runFoundationSeed().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Foundation seed failed.');
    process.exitCode = 1;
  });
}
