import { fileURLToPath } from 'node:url';

import { formatMigrationError, migrate } from './migrate.js';

export async function migrationStatus(): Promise<void> {
  const result = await migrate({ check: true });
  console.log(JSON.stringify({ mode: 'check', ...result }));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrationStatus().catch((error: unknown) => {
    console.error(formatMigrationError(error));
    process.exitCode = 1;
  });
}
