import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import type {
  BackupExecutionResult,
  PostgresBackupExecutor,
  RestoreExecutionResult,
} from '../ports/backup-executor.js';

function run(command: string, args: readonly string[], environment: NodeJS.ProcessEnv): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, [...args], { env: environment, stdio: ['ignore', 'ignore', 'pipe'] });
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
  async createLogicalBackup(input: { databaseUrl: string; requestId: string }): Promise<BackupExecutionResult> {
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
      return { bytes, postgresVersion: process.env.PG_VERSION_CONTEXT ?? 'unknown', startedAt, completedAt: new Date(), command: 'pg_dump' };
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }

  async restoreLogicalBackup(input: { bytes: Uint8Array; targetDatabaseUrl: string; requestId: string }): Promise<RestoreExecutionResult> {
    void input.requestId;
    const directory = await mkdtemp(join(tmpdir(), 'qc-restore-'));
    const artifact = join(directory, 'database.dump');
    const startedAt = new Date();
    try {
      await writeFile(artifact, input.bytes);
      await run('pg_restore', ['--exit-on-error', '--clean', '--if-exists', '--dbname', input.targetDatabaseUrl, artifact], {
        ...process.env,
      });
      return { startedAt, completedAt: new Date(), command: 'pg_restore' };
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }
}

export function checksum(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}
