import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { Client } from 'pg';
import { getDatabaseConnectionConfig } from '../../../shared/database/pool.js';
import type {
  BackupExecutionResult,
  PostgresBackupExecutor,
  RestoreExecutionResult,
} from '../ports/backup-executor.js';

function run(
  command: string,
  args: readonly string[],
  environment: NodeJS.ProcessEnv,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, [...args], {
      env: environment,
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    let stderr = '';
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });
    child.once('error', () => reject(new Error('POSTGRES_BACKUP_COMMAND_UNAVAILABLE')));
    child.once('close', (code) => {
      if (code === 0) return resolve();
      void stderr;
      reject(new Error('POSTGRES_BACKUP_COMMAND_FAILED'));
    });
  });
}

export class PostgresLogicalBackupExecutor implements PostgresBackupExecutor {
  async createLogicalBackup(input: {
    databaseUrl: string;
    requestId: string;
  }): Promise<BackupExecutionResult> {
    void input.requestId;
    const directory = await mkdtemp(join(tmpdir(), 'qc-backup-'));
    const output = join(directory, 'database.dump');
    const startedAt = new Date();
    try {
      await run('pg_dump', ['--format=custom', '--file', output, input.databaseUrl], {
        ...process.env,
        PGPASSFILE: process.env.PGPASSFILE,
      });
      const bytes = await readFile(output);
      return {
        bytes,
        postgresVersion: process.env.PG_VERSION_CONTEXT ?? 'unknown',
        startedAt,
        completedAt: new Date(),
        command: 'pg_dump',
      };
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }

  async restoreLogicalBackup(input: {
    bytes: Uint8Array;
    targetDatabaseUrl: string;
    sourceDatabaseName: string;
    requestId: string;
  }): Promise<RestoreExecutionResult> {
    void input.requestId;
    const target = assertIsolatedRestoreTarget(input.targetDatabaseUrl, input.sourceDatabaseName);
    const directory = await mkdtemp(join(tmpdir(), 'qc-restore-'));
    const artifact = join(directory, 'database.dump');
    const startedAt = new Date();
    try {
      await writeFile(artifact, input.bytes);
      // Decode every archive section before opening the target connection so
      // truncated/corrupt artifacts fail before they can create partial state.
      await run(
        'pg_restore',
        ['--exit-on-error', '--no-owner', '--no-acl', '--file', '/dev/null', artifact],
        { ...process.env },
      );
      await assertEmptyRestoreDatabase(input.targetDatabaseUrl, target.databaseName);
      await run(
        'pg_restore',
        [
          '--exit-on-error',
          '--no-owner',
          '--no-acl',
          '--dbname',
          input.targetDatabaseUrl,
          artifact,
        ],
        {
          ...process.env,
        },
      );
      return { startedAt, completedAt: new Date(), command: 'pg_restore' };
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }
}

export function assertIsolatedRestoreTarget(
  targetDatabaseUrl: string,
  sourceDatabaseName: string,
): { databaseName: string } {
  let target: URL;
  let databaseName: string;
  try {
    target = new URL(targetDatabaseUrl);
    databaseName = decodeURIComponent(target.pathname.replace(/^\//, ''));
  } catch {
    throw new Error('RESTORE_TARGET_NOT_ISOLATED');
  }
  if (
    (target.protocol !== 'postgres:' && target.protocol !== 'postgresql:') ||
    typeof sourceDatabaseName !== 'string' ||
    !sourceDatabaseName.trim() ||
    target.password !== ''
  )
    throw new Error('RESTORE_TARGET_NOT_ISOLATED');
  const host = target.hostname.toLowerCase();
  if (
    !['localhost', '127.0.0.1', '::1'].includes(host) ||
    !/^qc_restore(?:_[a-z0-9][a-z0-9_-]*)?$/i.test(databaseName) ||
    databaseName.toLowerCase() === sourceDatabaseName.trim().toLowerCase()
  )
    throw new Error('RESTORE_TARGET_NOT_ISOLATED');
  return { databaseName };
}

async function assertEmptyRestoreDatabase(
  databaseUrl: string,
  expectedName: string,
): Promise<void> {
  const client = new Client(getDatabaseConnectionConfig(databaseUrl));
  try {
    await client.connect();
    const identity = await client.query<{
      databaseName: string;
      objectCount: string;
      schemaCount: string;
    }>(`
      SELECT current_database() AS "databaseName",
             ((SELECT count(*) FROM pg_class AS relation
               JOIN pg_namespace AS schema ON schema.oid = relation.relnamespace
               WHERE schema.nspname NOT IN ('pg_catalog', 'information_schema')
                 AND schema.nspname NOT LIKE 'pg_%'
                 AND relation.relkind IN ('r', 'p', 'v', 'm', 'S', 'f'))
              + (SELECT count(*) FROM pg_proc AS routine
                 JOIN pg_namespace AS schema ON schema.oid = routine.pronamespace
                 WHERE schema.nspname NOT IN ('pg_catalog', 'information_schema')
                   AND schema.nspname NOT LIKE 'pg_%')
              + (SELECT count(*) FROM pg_type AS type
                 JOIN pg_namespace AS schema ON schema.oid = type.typnamespace
                 WHERE schema.nspname NOT IN ('pg_catalog', 'information_schema')
                   AND schema.nspname NOT LIKE 'pg_%'
                   AND type.typtype IN ('d', 'e', 'r'))
             )::text AS "objectCount",
             (SELECT count(*)::text FROM pg_namespace
              WHERE nspname NOT IN ('pg_catalog', 'information_schema', 'public')
                AND nspname NOT LIKE 'pg_%') AS "schemaCount"
    `);
    if (
      identity.rows[0]?.databaseName !== expectedName ||
      identity.rows[0]?.objectCount !== '0' ||
      identity.rows[0]?.schemaCount !== '0'
    )
      throw new Error('RESTORE_TARGET_NOT_EMPTY');
  } catch (error) {
    if (error instanceof Error && error.message === 'RESTORE_TARGET_NOT_EMPTY') throw error;
    // eslint-disable-next-line preserve-caught-error -- Driver errors may contain connection details.
    throw new Error('RESTORE_TARGET_UNAVAILABLE');
  } finally {
    await client.end().catch(() => undefined);
  }
}

export function checksum(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}
