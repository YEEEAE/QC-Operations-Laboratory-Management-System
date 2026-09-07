import { fileURLToPath } from 'node:url';

import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

import {
  checkBootstrapAdmin,
  formatBootstrapAdminCheck,
  redactBootstrapErrorMessage,
} from '../../src/modules/identity/application/bootstrap-admin-check.js';
import type { DatabaseSchema } from '../../src/shared/database/db-types.js';
import { getDatabaseConnectionConfig } from '../../src/shared/database/pool.js';
import { loadLocalEnv } from '../db/load-local-env.js';

export async function runBootstrapAdminCheck(environment = process.env): Promise<void> {
  loadLocalEnv(environment);
  const identity = environment.BOOTSTRAP_ADMIN_IDENTITY?.trim();
  if (!identity) throw new Error('BOOTSTRAP_ADMIN_IDENTITY is required.');
  const pool = new Pool({
    ...getDatabaseConnectionConfig(environment.DATABASE_URL),
    application_name: 'qc-initial-admin-check',
    options: '-c timezone=UTC -c search_path=qc,pg_catalog',
  });
  const database = new Kysely<DatabaseSchema>({ dialect: new PostgresDialect({ pool }) });
  try {
    console.log(formatBootstrapAdminCheck(await checkBootstrapAdmin(database, identity)));
  } finally {
    await database.destroy();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runBootstrapAdminCheck().catch((error: unknown) => {
    console.error(redactBootstrapErrorMessage(error, process.env));
    process.exitCode = 1;
  });
}
