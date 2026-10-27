import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Pool, PoolClient } from 'pg';

import { InvalidEnvironmentError, parseServerEnv } from '../../src/config/env.js';
import {
  assertDirectDatabaseEndpoint,
  createMaintenancePool,
  DatabaseConfigurationError,
  getDatabaseConnectionConfig,
} from '../../src/shared/database/pool.js';
import { isSupportedMigrationChecksum } from '../../src/shared/database/migration-checksum-policy.js';

import { loadLocalEnv, loadLocalMigrationEnv, loadLocalOperatorEnv } from './load-local-env.js';

export interface MigrationFile {
  version: string;
  name: string;
  path: string;
  sql: string;
  checksum: string;
}

export class MigrationIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MigrationIntegrityError';
  }
}

const migrationsDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../../db/migrations');
const lockKey = 'qc-operations-schema-migrations-v1';

// These are the checksums of migrations from the pre-Render-compatible role
// model. They are accepted only so an existing ledger remains auditable; fresh
// databases always record the checksum of the current migration file.

function assertContiguousMigrationSequence(migrations: MigrationFile[]): void {
  const seen = new Set<string>();
  for (const [index, migration] of migrations.entries()) {
    const expectedVersion = String(index + 1).padStart(4, '0');
    if (seen.has(migration.version))
      throw new MigrationIntegrityError('Duplicate migration version detected.');
    seen.add(migration.version);
    if (migration.version !== expectedVersion) {
      throw new MigrationIntegrityError(
        `Migration source sequence gap: expected ${expectedVersion}, found ${migration.version}.`,
      );
    }
  }
}

export async function loadMigrations(directory = migrationsDirectory): Promise<MigrationFile[]> {
  const names = (await readdir(directory))
    .filter((name) => /^\d{4}_[a-z0-9_]+\.sql$/.test(name))
    .sort();
  const migrations = await Promise.all(
    names.map(async (name) => {
      const sql = await readFile(resolve(directory, name), 'utf8');
      const match = /^(\d{4})_(.+)\.sql$/.exec(name);
      if (!match) throw new Error(`Invalid migration filename: ${name}`);
      return {
        version: match[1],
        name: basename(name, '.sql'),
        path: resolve(directory, name),
        sql,
        checksum: createHash('sha256').update(sql, 'utf8').digest('hex'),
      };
    }),
  );
  if (new Set(migrations.map((migration) => migration.version)).size !== migrations.length) {
    throw new MigrationIntegrityError('Duplicate migration version detected.');
  }
  assertContiguousMigrationSequence(migrations);
  return migrations;
}

async function acquireLock(client: PoolClient): Promise<void> {
  await client.query('SELECT pg_advisory_lock(hashtextextended($1, 0))', [lockKey]);
}

async function releaseLock(client: PoolClient): Promise<void> {
  await client.query('SELECT pg_advisory_unlock(hashtextextended($1, 0))', [lockKey]);
}

async function withMigrationLock<T>(
  pool: Pool,
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await acquireLock(client);
    return await work(client);
  } finally {
    try {
      await releaseLock(client);
    } finally {
      client.release();
    }
  }
}

async function readApplied(
  client: PoolClient,
): Promise<{ version: string; name: string; checksum: string }[]> {
  try {
    const result = await client.query<{ version: string; name: string; checksum: string }>(
      'SELECT version, name, checksum FROM qc.schema_migrations ORDER BY version',
    );
    return result.rows;
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error.code === '42P01' || error.code === '3F000')
    )
      return [];
    throw error;
  }
}

export async function verifyMigrationIntegrity(
  client: PoolClient,
  migrations?: MigrationFile[],
): Promise<void> {
  const migrationFiles = migrations ?? (await loadMigrations());
  assertContiguousMigrationSequence(migrationFiles);
  const result = await readApplied(client);
  const files = new Map(migrationFiles.map((migration) => [migration.version, migration]));
  for (const [index, applied] of result.entries()) {
    const expected = migrationFiles[index];
    const migration = files.get(applied.version);
    if (
      !expected ||
      applied.version !== expected.version ||
      !migration ||
      migration.name !== applied.name ||
      !isSupportedMigrationChecksum(applied.version, migration.checksum, applied.checksum)
    ) {
      throw new MigrationIntegrityError(
        `Applied migration ledger does not match the ordered source at version ${applied.version}.`,
      );
    }
  }
}

async function assertMigrationPrivileges(client: PoolClient): Promise<void> {
  const result = await client.query<{
    current_user: string;
    can_create_database_schema: boolean;
    can_create_qc_objects: boolean;
  }>(`SELECT
      current_user,
      has_database_privilege(current_user, current_database(), 'CREATE') AS can_create_database_schema,
      CASE WHEN to_regnamespace('qc') IS NULL THEN true
        ELSE has_schema_privilege(current_user, 'qc', 'CREATE') END AS can_create_qc_objects`);
  const row = result.rows[0];
  if (!row?.can_create_database_schema || !row.can_create_qc_objects) {
    throw new Error(
      `Migration principal ${row?.current_user ?? 'current_user'} lacks CREATE on the database/schema. ` +
        'Configure the approved migration principal; CREATEROLE is not required.',
    );
  }
}

async function assertCurrentOwnership(client: PoolClient): Promise<void> {
  const result = await client.query<{ object_name: string; owner: string }>(`SELECT
      n.nspname || '.' || c.relname AS object_name,
      pg_get_userbyid(c.relowner) AS owner
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'qc'
      AND c.relkind IN ('r', 'p', 'S', 'v', 'm', 'f')
      AND pg_get_userbyid(c.relowner) <> current_user
    LIMIT 1`);
  if (result.rows[0]) {
    throw new Error(
      `Legacy database ownership detected at ${result.rows[0].object_name} (${result.rows[0].owner}). ` +
        'A provider-admin remediation is required before pending migrations; the application credential will not transfer ownership.',
    );
  }
}

export async function migrate(
  options: { check?: boolean; pool?: Pool; migrations?: MigrationFile[] } = {},
): Promise<{ applied: string[]; pending: string[] }> {
  if (!options.pool) {
    throw new DatabaseConfigurationError(
      'Migration execution requires an explicitly selected operator maintenance pool.',
    );
  }
  const pool = options.pool;
  const migrations = options.migrations ?? (await loadMigrations());
  return withMigrationLock(pool, async (client) => {
    await verifyMigrationIntegrity(client, migrations);
    const applied = new Set((await readApplied(client)).map((row) => row.version));
    const pending = migrations.filter((migration) => !applied.has(migration.version));
    if (pending.length > 0 && !options.check) {
      await assertMigrationPrivileges(client);
      await assertCurrentOwnership(client);
    }
    if (options.check)
      return { applied: [...applied], pending: pending.map((migration) => migration.version) };

    const appliedNow: string[] = [];
    for (const migration of pending) {
      const started = performance.now();
      await client.query('BEGIN');
      try {
        await client.query(migration.sql);
        await client.query(
          `INSERT INTO qc.schema_migrations (version, name, checksum, execution_ms, runner_version)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            migration.version,
            migration.name,
            migration.checksum,
            Math.max(0, Math.round(performance.now() - started)),
            '0.1.0',
          ],
        );
        await client.query('COMMIT');
        appliedNow.push(migration.version);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
    return { applied: appliedNow, pending: [] };
  });
}

export function formatMigrationError(error: unknown): string {
  if (error instanceof MigrationIntegrityError) {
    return `MIGRATION SOURCE/LEDGER DRIFT: ${error.message}`;
  }
  if (error instanceof DatabaseConfigurationError || error instanceof InvalidEnvironmentError) {
    return `MIGRATION CONFIGURATION ERROR: ${error.message}`;
  }
  return 'MIGRATION DATABASE/NETWORK ERROR: PostgreSQL could not be reached or the migration failed. Credentials and connection details were not printed.';
}

export function createOperatorMigrationPool(
  args: readonly string[] = process.argv,
  environment: NodeJS.ProcessEnv = process.env,
): Pool {
  if (!args.includes('--direct')) {
    throw new DatabaseConfigurationError(
      'Select the direct operator database path explicitly with --direct.',
    );
  }
  const unpooledUrl = environment.DATABASE_URL_UNPOOLED?.trim();
  const legacyMigrationUrl = environment.MIGRATION_DATABASE_URL?.trim();
  if (unpooledUrl && legacyMigrationUrl && unpooledUrl !== legacyMigrationUrl) {
    throw new DatabaseConfigurationError(
      'DATABASE_URL_UNPOOLED and MIGRATION_DATABASE_URL disagree; configure one direct migration credential.',
    );
  }
  const migrationUrl = unpooledUrl || legacyMigrationUrl;
  if (!migrationUrl) {
    throw new DatabaseConfigurationError(
      'DATABASE_URL_UNPOOLED is required for the explicitly selected direct migration path.',
    );
  }

  const directUrl = assertDirectDatabaseEndpoint(migrationUrl);
  const connectionConfig = getDatabaseConnectionConfig(directUrl);
  // Keep operator credentials outside the typed application runtime parse.
  const runtimeEnv = {
    ...environment,
    DATABASE_URL_UNPOOLED: undefined,
    MIGRATION_DATABASE_URL: undefined,
  };
  const runtimeUrl = parseServerEnv(runtimeEnv).DATABASE_URL;
  if (!runtimeUrl) {
    throw new DatabaseConfigurationError(
      'DATABASE_URL must identify the active application database before a dedicated migration principal is used.',
    );
  }
  const runtimeTarget = new URL(runtimeUrl);
  const migrationTarget = new URL(connectionConfig.connectionString!);
  if (decodeURIComponent(runtimeTarget.username) === decodeURIComponent(migrationTarget.username)) {
    throw new DatabaseConfigurationError(
      'The migration URL must use a migration principal distinct from the runtime database principal.',
    );
  }
  const targetKey = (url: URL) => {
    const labels = url.hostname.toLowerCase().split('.');
    if (labels[0]?.endsWith('-pooler')) labels[0] = labels[0].slice(0, -'-pooler'.length);
    return `${labels.join('.')}:${url.port || '5432'}${decodeURIComponent(url.pathname)}`;
  };
  if (targetKey(runtimeTarget) !== targetKey(migrationTarget)) {
    throw new DatabaseConfigurationError(
      'The migration URL must target the same host, port, and database as the active runtime profile.',
    );
  }
  return createMaintenancePool(connectionConfig);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // Load the ignored local `.env` through the allowlisted parser before the
  // canonical pool resolves `DATABASE_URL`. Only the CLI entrypoint does this:
  // `migrate()` is imported directly by the PostgreSQL integration suites and
  // must never mutate their process environment.
  loadLocalEnv();
  loadLocalOperatorEnv();
  loadLocalMigrationEnv();
  const check = process.argv.includes('--check');
  const runCli = async () => {
    const cliPool = createOperatorMigrationPool(process.argv, process.env);
    try {
      return await migrate({ check, pool: cliPool });
    } finally {
      await cliPool.end();
    }
  };

  runCli()
    .then((result) => {
      console.log(JSON.stringify({ mode: check ? 'check' : 'migrate', ...result }));
    })
    .catch((error: unknown) => {
      console.error(formatMigrationError(error));
      process.exitCode = 1;
    });
}
