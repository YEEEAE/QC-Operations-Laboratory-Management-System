import { Client } from 'pg';
import { fileURLToPath } from 'node:url';

import { loadMigrations } from './migrate.js';
import { reconcileMigrationParity } from '../../src/shared/database/migration-parity.js';
import {
  DatabaseConfigurationError,
  getDatabaseConnectionConfig,
} from '../../src/shared/database/pool.js';

import { loadLocalEnv } from './load-local-env.js';
import { assertSafeLocalDatabaseCommand } from './local-target-guard.js';
import { getRuntimeDatabaseUrl } from '../../src/config/runtime.js';

export interface DatabasePreflightReport {
  connectivity: 'PASS' | 'FAIL';
  postgresqlVersion: string | null;
  postgresVersionSupported: boolean | null;
  currentDatabase: string | null;
  currentUser: string | null;
  runtimePrincipal: 'DATABASE_URL';
  migrationUrlConfigured: boolean;
  schemaQcExists: boolean;
  qcUsersExists: boolean;
  schemaMigrationsExists: boolean;
  migrationCountApplied: number;
  migrationCountPending: number;
  migrationSourceHead: string;
  migrationAppliedHead: string;
  migrationPendingVersions: readonly string[];
  migrationChecksumMismatches: readonly string[];
  migrationKnownLegacyChecksums: readonly string[];
  branchIdentity: {
    profile: string;
    configuredBranchLabel: string;
    providerAttestation: 'NOT_AVAILABLE';
  };
  migrationLedgerState: 'UNINITIALIZED' | 'CURRENT' | 'PENDING' | 'DRIFT';
  migrationLedgerIssues: Array<
    | 'MIGRATION_LEDGER_MISSING'
    | 'DUPLICATE_APPLIED_VERSION'
    | 'DUPLICATE_SOURCE_VERSION'
    | 'SOURCE_SEQUENCE_GAP'
    | 'OUT_OF_ORDER_OR_GAP'
    | 'MIGRATION_NAME_MISMATCH'
    | 'UNKNOWN_CHECKSUM'
  >;
  capabilities: {
    transactionReadOnly: boolean;
    schemaUsage: boolean | null;
    databaseCreate: boolean;
    schemaCreate: boolean | null;
    usersSelect: boolean | null;
    migrationsSelect: boolean | null;
    migrationsWrite: boolean | null;
  };
  errorCategory?: 'CONFIGURATION' | 'DATABASE_NETWORK';
}

export function classifyPreflightError(error: unknown): 'CONFIGURATION' | 'DATABASE_NETWORK' {
  return error instanceof DatabaseConfigurationError ? 'CONFIGURATION' : 'DATABASE_NETWORK';
}

export async function runDatabasePreflight(
  databaseUrl = getRuntimeDatabaseUrl(),
): Promise<DatabasePreflightReport> {
  const client = new Client(getDatabaseConnectionConfig(databaseUrl));
  const migrations = await loadMigrations();

  try {
    await client.connect();
    await client.query('BEGIN');
    await client.query('SET TRANSACTION READ ONLY');
    const settings = await client.query<{
      version: string;
      version_num: number;
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
      database_create: boolean;
      schema_create: boolean | null;
      migrations_write: boolean;
    }>(`SELECT
        version() AS version,
        current_setting('server_version_num')::integer AS version_num,
        current_database() AS database,
        current_user AS user,
        current_schema() AS schema,
        current_setting('transaction_read_only') AS read_only,
        to_regnamespace('qc') IS NOT NULL AS qc_exists,
        to_regclass('qc.users') IS NOT NULL AS users_exists,
        to_regclass('qc.schema_migrations') IS NOT NULL AS migrations_exists,
        CASE WHEN to_regnamespace('qc') IS NOT NULL
          THEN has_schema_privilege(current_user, 'qc', 'USAGE')
          ELSE NULL END AS schema_usage,
        has_database_privilege(current_user, current_database(), 'CREATE') AS database_create,
        CASE WHEN to_regnamespace('qc') IS NOT NULL
          THEN has_schema_privilege(current_user, 'qc', 'CREATE')
          ELSE NULL END AS schema_create,
        CASE WHEN to_regclass('qc.users') IS NOT NULL
          THEN has_table_privilege(current_user, 'qc.users', 'SELECT')
          ELSE false END AS users_select,
        CASE WHEN to_regclass('qc.schema_migrations') IS NOT NULL
          THEN has_table_privilege(current_user, 'qc.schema_migrations', 'SELECT')
          ELSE false END AS migrations_select,
        CASE WHEN to_regclass('qc.schema_migrations') IS NOT NULL
          THEN has_table_privilege(current_user, 'qc.schema_migrations', 'INSERT')
            OR has_table_privilege(current_user, 'qc.schema_migrations', 'UPDATE')
            OR has_table_privilege(current_user, 'qc.schema_migrations', 'DELETE')
            OR has_table_privilege(current_user, 'qc.schema_migrations', 'TRUNCATE')
          ELSE false END AS migrations_write`);
    const row = settings.rows[0];
    let appliedRows: { version: string; name: string; checksum: string }[] = [];
    if (row.migrations_exists) {
      const result = await client.query<{ version: string; name: string; checksum: string }>(
        'SELECT version, name, checksum FROM qc.schema_migrations ORDER BY version',
      );
      appliedRows = result.rows;
    }
    const parity = reconcileMigrationParity(appliedRows, migrations);
    const migrationLedgerIssues = new Set<DatabasePreflightReport['migrationLedgerIssues'][number]>();
    if (!row.migrations_exists) migrationLedgerIssues.add('MIGRATION_LEDGER_MISSING');
    for (const issue of parity.issues) {
      switch (issue) {
        case 'SOURCE_DUPLICATE_VERSION':
          migrationLedgerIssues.add('DUPLICATE_SOURCE_VERSION');
          break;
        case 'SOURCE_SEQUENCE_GAP':
          migrationLedgerIssues.add('SOURCE_SEQUENCE_GAP');
          break;
        case 'APPLIED_DUPLICATE_VERSION':
          migrationLedgerIssues.add('DUPLICATE_APPLIED_VERSION');
          break;
        case 'APPLIED_SEQUENCE_MISMATCH':
        case 'APPLIED_VERSION_UNKNOWN':
          migrationLedgerIssues.add('OUT_OF_ORDER_OR_GAP');
          break;
        case 'MIGRATION_NAME_MISMATCH':
          migrationLedgerIssues.add('MIGRATION_NAME_MISMATCH');
          break;
        case 'CHECKSUM_MISMATCH':
          migrationLedgerIssues.add('UNKNOWN_CHECKSUM');
          break;
      }
    }
    const hasLedgerDrift = [...migrationLedgerIssues].some((issue) =>
      issue !== 'MIGRATION_LEDGER_MISSING',
    );
    const migrationLedgerState = !row.migrations_exists
      ? 'UNINITIALIZED'
      : hasLedgerDrift
        ? 'DRIFT'
        : parity.pending.length === 0 && parity.issues.length === 0
          ? 'CURRENT'
          : 'PENDING';
    await client.query('ROLLBACK');
    return {
      connectivity: 'PASS',
      postgresqlVersion: row.version,
      postgresVersionSupported: row.version_num >= 180000 && row.version_num < 190000,
      currentDatabase: row.database,
      currentUser: row.user,
      runtimePrincipal: 'DATABASE_URL',
      migrationUrlConfigured: Boolean(process.env.DATABASE_URL_UNPOOLED?.trim() || process.env.MIGRATION_DATABASE_URL?.trim()),
      schemaQcExists: row.qc_exists,
      qcUsersExists: row.users_exists,
      schemaMigrationsExists: row.migrations_exists,
      migrationCountApplied: appliedRows.length,
      migrationCountPending: parity.pending.length,
      migrationSourceHead: parity.sourceHead,
      migrationAppliedHead: parity.appliedHead,
      migrationPendingVersions: parity.pending,
      migrationChecksumMismatches: parity.checksumMismatches,
      migrationKnownLegacyChecksums: parity.knownLegacyChecksums,
      branchIdentity: {
        profile: process.env.APP_ENVIRONMENT_PROFILE ?? 'NOT CONFIGURED',
        configuredBranchLabel: process.env.NEON_BRANCH?.trim() || 'NOT CONFIGURED',
        providerAttestation: 'NOT_AVAILABLE',
      },
      migrationLedgerState,
      migrationLedgerIssues: [...migrationLedgerIssues],
      capabilities: {
        transactionReadOnly: row.read_only === 'on',
        schemaUsage: row.schema_usage,
        databaseCreate: row.database_create,
        schemaCreate: row.schema_create,
        usersSelect: row.users_select,
        migrationsSelect: row.migrations_select,
        migrationsWrite: row.migrations_write,
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
  // The documented operator workflow is: an ignored local `.env` file is loaded
  // through the allowlisted, non-shell parser; explicit environment variables win.
  // This happens only at the CLI boundary so importing `runDatabasePreflight`
  // from a test can never mutate the test process environment.
  loadLocalEnv();
  assertSafeLocalDatabaseCommand();
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
