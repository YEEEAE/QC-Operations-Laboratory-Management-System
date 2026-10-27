import { fileURLToPath } from 'node:url';

import { createOperatorMigrationPool, formatMigrationError, migrate } from './migrate.js';

import { loadLocalEnv, loadLocalMigrationEnv, loadLocalOperatorEnv } from './load-local-env.js';

export async function migrationStatus(args: readonly string[] = process.argv): Promise<void> {
  const pool = createOperatorMigrationPool(args, process.env);
  try {
    const result = await migrate({ check: true, pool });
    console.log(JSON.stringify({ mode: 'check', ...result }));
  } finally {
    await pool.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // Runtime settings remain allowlisted separately from explicit operator
  // settings; the migration credential is never merged into app config.
  loadLocalEnv();
  loadLocalOperatorEnv();
  loadLocalMigrationEnv();
  migrationStatus().catch((error: unknown) => {
    console.error(formatMigrationError(error));
    process.exitCode = 1;
  });
}
