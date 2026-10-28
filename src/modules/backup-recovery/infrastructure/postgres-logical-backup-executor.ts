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

function operatorConnectionEnvironment(databaseUrl: string): NodeJS.ProcessEnv {
  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error('POSTGRES_OPERATOR_CONNECTION_INVALID');
  }
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !url.hostname ||
    !url.username ||
    !url.pathname.slice(1) ||
    url.hostname.toLowerCase().split('.')[0]?.endsWith('-pooler')
  )
    throw new Error('POSTGRES_DIRECT_OPERATOR_CONNECTION_REQUIRED');
  for (const key of url.searchParams.keys())
    if (!['sslmode', 'sslrootcert'].includes(key))
      throw new Error('POSTGRES_OPERATOR_CONNECTION_OPTION_UNSUPPORTED');
  const sslMode = url.searchParams.get('sslmode') ?? 'prefer';
  if (!['disable', 'allow', 'prefer', 'require', 'verify-ca', 'verify-full'].includes(sslMode))
    throw new Error('POSTGRES_OPERATOR_CONNECTION_INVALID');
  const local = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname.toLowerCase());
  if (!local && !['require', 'verify-ca', 'verify-full'].includes(sslMode))
    throw new Error('POSTGRES_OPERATOR_TLS_REQUIRED');
  return {
    ...(process.env.PATH ? { PATH: process.env.PATH } : {}),
    ...(process.env.LANG ? { LANG: process.env.LANG } : {}),
    PGHOST: url.hostname.replace(/^\[|\]$/g, ''),
    PGPORT: url.port || '5432',
    PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGSSLMODE: sslMode,
    ...(url.searchParams.get('sslrootcert')
      ? { PGSSLROOTCERT: url.searchParams.get('sslrootcert')! }
      : {}),
    PGPASSFILE: '/dev/null',
  };
}

export class PostgresLogicalBackupExecutor implements PostgresBackupExecutor {
  async createLogicalBackup(input: {
    databaseUrl: string;
    requestId: string;
  }): Promise<BackupExecutionResult> {
    void input.requestId;
    const directory = await mkdtemp(join(tmpdir(), 'qc-backup-'));
    const output = join(directory, 'database.dump');
    const schemaOutput = join(directory, 'schema.sql');
    const startedAt = new Date();
    const environment = operatorConnectionEnvironment(input.databaseUrl);
    try {
      await run('pg_dump', ['--no-password', '--format=custom', '--file', output], environment);
      await run(
        'pg_dump',
        ['--no-password', '--schema-only', '--no-owner', '--no-privileges', '--file', schemaOutput],
        environment,
      );
      const bytes = await readFile(output);
      const schemaBytes = await readFile(schemaOutput);
      const client = new Client(getDatabaseConnectionConfig(input.databaseUrl));
      let migrationLedger: { version: string; name: string; checksum: string }[];
      let fileObjects: BackupExecutionResult['fileObjects'];
      let controlledDocumentVersions: BackupExecutionResult['controlledDocumentVersions'];
      let postgresVersion: string;
      try {
        await client.connect();
        await client.query('BEGIN READ ONLY');
        const version = await client.query<{ version: string }>(
          'SELECT current_setting(\'server_version\') AS version',
        );
        postgresVersion = version.rows[0]?.version ?? 'unknown';
        const ledger = await client.query<{ version: string; name: string; checksum: string }>(
          'SELECT version, name, checksum FROM qc.schema_migrations ORDER BY version',
        );
        migrationLedger = ledger.rows;
        const files = await client.query<{
          fileId: string;
          storageProvider: string;
          storageKey: string;
          sizeBytes: string;
          sha256: string;
        }>(
          `SELECT id::text AS "fileId", storage_provider AS "storageProvider",
                  storage_key AS "storageKey", size_bytes::text AS "sizeBytes", sha256
           FROM qc.files WHERE state = 'ACTIVE' ORDER BY id`,
        );
        fileObjects = files.rows.map((file) => {
          const sizeBytes = Number(file.sizeBytes);
          if (!Number.isSafeInteger(sizeBytes) || sizeBytes < 0 || !/^[0-9a-f]{64}$/i.test(file.sha256))
            throw new Error('BACKUP_FILE_METADATA_INVALID');
          return { ...file, sizeBytes };
        });
        const versions = await client.query<{
          documentId: string;
          documentNo: string;
          documentType: string;
          versionId: string;
          revision: string;
          state: string;
          contentHash: string;
          fileIds: string[];
        }>(
          `SELECT identity.id::text AS "documentId", identity.document_no AS "documentNo",
                  identity.document_type AS "documentType", version.id::text AS "versionId",
                  version.revision, version.state, version.content_hash AS "contentHash",
                  COALESCE((SELECT array_agg(link.file_id::text ORDER BY link.file_id)
                            FROM qc.document_version_files AS link
                            WHERE link.document_version_id = version.id), ARRAY[]::text[]) AS "fileIds"
           FROM qc.document_versions AS version
           JOIN qc.document_identities AS identity ON identity.id = version.document_id
           WHERE version.content_hash IS NOT NULL
           ORDER BY identity.document_no, version.revision, version.id`,
        );
        controlledDocumentVersions = versions.rows.filter((version) => /^[0-9a-f]{64}$/i.test(version.contentHash));
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK').catch(() => undefined);
        throw error;
      } finally {
        await client.end().catch(() => undefined);
      }
      return {
        bytes,
        postgresVersion,
        schemaChecksum: checksum(schemaBytes),
        migrationLedger,
        fileObjects,
        controlledDocumentVersions,
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
