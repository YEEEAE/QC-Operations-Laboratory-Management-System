import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Pool, PoolClient } from 'pg';

import { InvalidEnvironmentError } from '../../src/config/env.js';
import { getPool } from '../../src/shared/database/pool.js';
import { DatabaseConfigurationError } from '../../src/shared/database/pool.js';

import './load-local-env.js';

export interface MigrationFile {
  version: string;
  name: string;
  path: string;
  sql: string;
  checksum: string;
}

const migrationsDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../../db/migrations');
const lockKey = 'qc-operations-schema-migrations-v1';

// These are the checksums of migrations from the pre-Render-compatible role
// model. They are accepted only so an existing ledger remains auditable; fresh
// databases always record the checksum of the current migration file.
const LEGACY_CHECKSUMS = new Map<string, string>([
  ['0001', '02379677863e1d178ee12f28c936e68949f2a1a12bb25e50e4fd41cda455d7e5'],
  ['0002', '1f86bb2536e9b50bf3c2a23d434f9c07e3a92826f5e270b083d36cfe0d029206'],
  ['0003', 'f94f611575128759ae2600b41aeac3fadc1ee12da99218bec4eccf3c50db625'],
  ['0005', 'a47f14661f758c999452df8c6ca9c7874715820e51243276940a6651e5518958'],
  ['0006', 'a7f1c54a5114172de6f4a16eb79caea9d4f222bea704050c83955e5818357396'],
  ['0007', '676afda757b4f86f41a3c3b8ee7dd3b777e3c6996743fc15f4130ca573e1e1f3'],
  ['0008', 'e41b27575143038973ea22a281bf330d3a7f85ebee458a4be1f3aa0ff26838bc'],
  ['0009', '04e2ad58242315ef172d41d1e5acd6e423df6ea6708da97c12a843d862b3fa69'],
  ['0010', 'b789ef65841dba08720a2a98b99679d316a6afff632b4447562f2594d6fc69af'],
  ['0011', '5537d41c177174af7494ee8943e5f08087b7c84dcb0b3938676b1d7687ed1d54'],
  ['0012', '077aff381fb1389d3eb7aac59e73c1592bbd97465d6619225142e53c8d3d0310'],
  ['0013', 'ff55c49a5c5a412edf740da37b8144476e7aa97b571499df0829720cd1364b4c'],
  ['0014', '1807b31c5202a2f7bdbc22bfa85041e241346f62d0c3f82a3147732608eebdd2'],
  ['0015', '4b31acb29be4329c18786d081dba431da908f0cc287daba1f3d31ae5dd3aec36'],
  ['0016', '51cc181e6efe5bd265e547d9c8cfdde4d7f903d0977eb006200200c440077baf'],
  ['0018', '1d0ff581e19ff36e19df931c2601d17fb2a14bb7449805bdd049dfb7426bc334'],
]);

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
    throw new Error('Duplicate migration version detected.');
  }
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

async function ensureLedger(client: PoolClient): Promise<void> {
  await client.query('CREATE SCHEMA IF NOT EXISTS qc');
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
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '42P01')
      return [];
    throw error;
  }
}

export async function verifyMigrationIntegrity(
  client: PoolClient,
  migrations?: MigrationFile[],
): Promise<void> {
  const migrationFiles = migrations ?? (await loadMigrations());
  await ensureLedger(client);
  const result = await readApplied(client);
  const files = new Map(migrationFiles.map((migration) => [migration.version, migration]));
  for (const applied of result) {
    const migration = files.get(applied.version);
    const legacyChecksum = LEGACY_CHECKSUMS.get(applied.version);
    const checksumIsCurrent = migration?.checksum === applied.checksum;
    const checksumIsKnownLegacy = legacyChecksum === applied.checksum;
    if (
      !migration ||
      migration.name !== applied.name ||
      (!checksumIsCurrent && !checksumIsKnownLegacy)
    ) {
      throw new Error(`Migration checksum mismatch for version ${applied.version}.`);
    }
  }
}

async function assertMigrationPrivileges(client: PoolClient): Promise<void> {
  const result = await client.query<{
    current_user: string;
    is_superuser: boolean;
    can_create_database_schema: boolean;
    can_create_qc_objects: boolean;
  }>(`SELECT
      current_user,
      rolsuper AS is_superuser,
      has_database_privilege(current_user, current_database(), 'CREATE') AS can_create_database_schema,
      has_schema_privilege(current_user, 'qc', 'CREATE') AS can_create_qc_objects
    FROM pg_roles
    WHERE rolname = current_user`);
  const row = result.rows[0];
  if (!row?.can_create_database_schema || !row.can_create_qc_objects) {
    throw new Error(
      `Migration principal ${row?.current_user ?? 'current_user'} lacks CREATE on the database/schema. ` +
        'Use the Render-managed database owner credential for MODE A; CREATEROLE is not required.',
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
  const pool = options.pool ?? getPool();
  const migrations = options.migrations ?? (await loadMigrations());
  return withMigrationLock(pool, async (client) => {
    await verifyMigrationIntegrity(client, migrations);
    const applied = new Set((await readApplied(client)).map((row) => row.version));
    const pending = migrations.filter((migration) => !applied.has(migration.version));
    if (pending.length > 0) {
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
  if (error instanceof DatabaseConfigurationError || error instanceof InvalidEnvironmentError) {
    return `MIGRATION CONFIGURATION ERROR: ${error.message}`;
  }
  return 'MIGRATION DATABASE/NETWORK ERROR: PostgreSQL could not be reached or the migration failed. Credentials and connection details were not printed.';
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  migrate({ check })
    .then((result) => {
      console.log(JSON.stringify({ mode: check ? 'check' : 'migrate', ...result }));
    })
    .catch((error: unknown) => {
      console.error(formatMigrationError(error));
      process.exitCode = 1;
    });
}
