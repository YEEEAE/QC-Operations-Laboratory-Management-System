import { fileURLToPath } from 'node:url';

import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

import {
  BootstrapConfigurationError,
  BootstrapInitialAdminUseCase,
  parseBootstrapAdminConfig,
} from '../../src/modules/identity/application/bootstrap-initial-admin.js';
import type { DatabaseSchema } from '../../src/shared/database/db-types.js';
import { Argon2idPasswordHasher } from '../../src/modules/identity/security/argon2-password-hasher.js';
import { loadMigrations, verifyMigrationIntegrity } from '../db/migrate.js';

async function assertMigrationsApplied(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    const migrations = await loadMigrations();
    await verifyMigrationIntegrity(client, migrations);
    const applied = await client.query<{ version: string }>(
      'SELECT version FROM qc.schema_migrations',
    );
    const appliedVersions = new Set(applied.rows.map((row) => row.version));
    const missing = migrations.filter((migration) => !appliedVersions.has(migration.version));
    if (missing.length > 0) {
      throw new BootstrapConfigurationError(
        'BOOTSTRAP BLOCKED: required database migrations are pending.',
      );
    }
  } finally {
    client.release();
  }
}

export async function runBootstrap(environment = process.env): Promise<void> {
  const config = parseBootstrapAdminConfig(environment);
  const pool = new Pool({
    connectionString: config.databaseUrl,
    application_name: 'qc-initial-admin-bootstrap',
    options: '-c timezone=UTC -c search_path=qc,pg_catalog',
  });
  const database = new Kysely<DatabaseSchema>({ dialect: new PostgresDialect({ pool }) });
  try {
    await assertMigrationsApplied(pool);
    const result = await new BootstrapInitialAdminUseCase(
      database,
      new Argon2idPasswordHasher(),
    ).execute(config);
    if (result.status === 'ALREADY_EXISTS') {
      console.log('Bootstrap admin already exists. No changes were made.');
      return;
    }
    console.log('Initial administrator created successfully.');
    if (!result.authorizationGrantsConfigured) {
      console.log('Authorization grants still require approved configuration.');
    }
  } finally {
    await database.destroy();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runBootstrap().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Bootstrap failed.';
    console.error(message);
    process.exitCode = 1;
  });
}
