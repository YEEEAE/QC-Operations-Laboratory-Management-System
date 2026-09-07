import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

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

export function isFoundationSeedEntrypoint(
  argvPath: string | undefined,
  moduleUrl: string,
): boolean {
  return argvPath !== undefined && resolve(argvPath) === fileURLToPath(moduleUrl);
}

if (isFoundationSeedEntrypoint(process.argv[1], import.meta.url)) {
  runFoundationSeed().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Foundation seed failed.');
    process.exitCode = 1;
  });
}
