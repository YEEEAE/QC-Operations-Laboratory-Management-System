import { fileURLToPath } from 'node:url';

import { formatMigrationError, migrate } from './migrate.js';

import { loadLocalEnv } from './load-local-env.js';

export async function migrationStatus(): Promise<void> {
  const result = await migrate({ check: true });
  console.log(JSON.stringify({ mode: 'check', ...result }));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // Load the ignored local `.env` through the allowlisted parser before the
  // canonical pool resolves `DATABASE_URL`.
  loadLocalEnv();
  migrationStatus().catch((error: unknown) => {
    console.error(formatMigrationError(error));
    process.exitCode = 1;
  });
}
