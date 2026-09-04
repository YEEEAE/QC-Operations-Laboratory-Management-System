import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Pool, PoolClient } from 'pg';

import { getPool } from '../../src/shared/database/pool.js';

export interface MigrationFile {
  version: string;
  name: string;
  path: string;
  sql: string;
  checksum: string;
}

const migrationsDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../../db/migrations');
const lockKey = 'qc-operations-schema-migrations-v1';

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
    if (!migration || migration.name !== applied.name || migration.checksum !== applied.checksum) {
      throw new Error(`Migration checksum mismatch for version ${applied.version}.`);
    }
  }
}

export async function migrate(
  options: { check?: boolean; pool?: Pool } = {},
): Promise<{ applied: string[]; pending: string[] }> {
  const pool = options.pool ?? getPool();
  const migrations = await loadMigrations();
  return withMigrationLock(pool, async (client) => {
    await verifyMigrationIntegrity(client, migrations);
    const applied = new Set((await readApplied(client)).map((row) => row.version));
    const pending = migrations.filter((migration) => !applied.has(migration.version));
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
    return { applied: [...applied, ...appliedNow], pending: [] };
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  migrate({ check })
    .then((result) => {
      console.log(JSON.stringify({ mode: check ? 'check' : 'migrate', ...result }));
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : 'Migration failed.');
      process.exitCode = 1;
    });
}
