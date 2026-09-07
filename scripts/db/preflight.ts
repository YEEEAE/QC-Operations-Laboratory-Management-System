import { Client } from 'pg';
import { fileURLToPath } from 'node:url';

import { loadMigrations } from './migrate.js';
import { DatabaseConfigurationError, validateDatabaseUrl } from '../../src/shared/database/pool.js';

export interface DatabasePreflightReport {
  connectivity: 'PASS' | 'FAIL';
  postgresqlVersion: string | null;
  currentDatabase: string | null;
  currentUser: string | null;
  schemaQcExists: boolean;
  qcUsersExists: boolean;
  schemaMigrationsExists: boolean;
  migrationCountApplied: number;
  migrationCountPending: number;
  capabilities: {
    transactionReadOnly: boolean;
    schemaUsage: boolean | null;
    usersSelect: boolean | null;
    migrationsSelect: boolean | null;
  };
  errorCategory?: 'CONFIGURATION' | 'DATABASE_NETWORK';
}

export function classifyPreflightError(error: unknown): 'CONFIGURATION' | 'DATABASE_NETWORK' {
  return error instanceof DatabaseConfigurationError ? 'CONFIGURATION' : 'DATABASE_NETWORK';
}

export async function runDatabasePreflight(
  databaseUrl = process.env.DATABASE_URL,
): Promise<DatabasePreflightReport> {
  const connectionString = validateDatabaseUrl(databaseUrl);
  const client = new Client({ connectionString });
  const migrations = await loadMigrations();

  try {
    await client.connect();
    await client.query('BEGIN');
    await client.query('SET TRANSACTION READ ONLY');
    const settings = await client.query<{
      version: string;
      database: string;
      user: string;
      schema: string | null;
      read_only: string;
      qc_exists: boolean;
      users_exists: boolean;
      migrations_exists: boolean;
      schema_usage: boolean;
      users_select: boolean;
      migrations_select: boolean;
    }>(`SELECT
        version() AS version,
        current_database() AS database,
        current_user AS user,
        current_schema() AS schema,
        current_setting('transaction_read_only') AS read_only,
        to_regnamespace('qc') IS NOT NULL AS qc_exists,
        to_regclass('qc.users') IS NOT NULL AS users_exists,
        to_regclass('qc.schema_migrations') IS NOT NULL AS migrations_exists,
        has_schema_privilege(current_user, 'qc', 'USAGE') AS schema_usage,
        CASE WHEN to_regclass('qc.users') IS NOT NULL
          THEN has_table_privilege(current_user, 'qc.users', 'SELECT')
          ELSE false END AS users_select,
        CASE WHEN to_regclass('qc.schema_migrations') IS NOT NULL
          THEN has_table_privilege(current_user, 'qc.schema_migrations', 'SELECT')
          ELSE false END AS migrations_select`);
    const row = settings.rows[0];
    let applied = 0;
    if (row.migrations_exists) {
      const result = await client.query<{ count: string }>(
        'SELECT count(*)::text AS count FROM qc.schema_migrations',
      );
      applied = Number(result.rows[0]?.count ?? 0);
    }
    await client.query('ROLLBACK');
    return {
      connectivity: 'PASS',
      postgresqlVersion: row.version,
      currentDatabase: row.database,
      currentUser: row.user,
      schemaQcExists: row.qc_exists,
      qcUsersExists: row.users_exists,
      schemaMigrationsExists: row.migrations_exists,
      migrationCountApplied: applied,
      migrationCountPending: Math.max(0, migrations.length - applied),
      capabilities: {
        transactionReadOnly: row.read_only === 'on',
        schemaUsage: row.schema_usage,
        usersSelect: row.users_select,
        migrationsSelect: row.migrations_select,
      },
    };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await client.end().catch(() => undefined);
  }
}

export function formatPreflightError(error: unknown): string {
  const category = classifyPreflightError(error);
  return category === 'CONFIGURATION'
    ? `DATABASE PREFLIGHT CONFIGURATION ERROR: ${error instanceof Error ? error.message : 'DATABASE_URL is invalid.'}`
    : 'DATABASE PREFLIGHT DATABASE/NETWORK ERROR: PostgreSQL could not be reached or the read-only checks failed. Credentials and connection details were not printed.';
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runDatabasePreflight()
    .then((report) => {
      console.log(JSON.stringify(report));
      process.exitCode = report.connectivity === 'PASS' ? 0 : 1;
    })
    .catch((error: unknown) => {
      console.error(formatPreflightError(error));
      process.exitCode = 1;
    });
}
