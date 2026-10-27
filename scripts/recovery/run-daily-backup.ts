import { randomUUID } from 'node:crypto';
import {
  CloudflareR2ArtifactStore,
  parseR2Config,
} from '../../src/modules/backup-recovery/infrastructure/cloudflare-r2-artifact-store.js';
import { PostgresLogicalBackupExecutor } from '../../src/modules/backup-recovery/infrastructure/postgres-logical-backup-executor.js';
import { runLogicalBackupJob } from '../../src/modules/backup-recovery/application/run-backup-job.js';
import { loadLocalEnv } from '../db/load-local-env.js';
import { assertSafeLocalDatabaseCommand } from '../db/local-target-guard.js';
import { parseServerEnv } from '../../src/config/env.js';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required backup runtime value: ${name}`);
  return value;
}

try {
  loadLocalEnv();
  assertSafeLocalDatabaseCommand();
  const databaseUrl = parseServerEnv(process.env).DATABASE_URL;
  if (!databaseUrl) throw new Error('No profile-bound runtime database is configured.');
  const release = {
    gitSha: required('BACKUP_GIT_SHA'),
    buildId: required('BACKUP_BUILD_ID'),
    releaseId: required('BACKUP_RELEASE_ID'),
    migrationHead: required('BACKUP_MIGRATION_HEAD'),
    postgresVersion: required('BACKUP_POSTGRES_VERSION'),
  };
  const store = new CloudflareR2ArtifactStore(parseR2Config(process.env));
  const result = await runLogicalBackupJob({
    executor: new PostgresLogicalBackupExecutor(),
    store,
    databaseUrl,
    release,
    catalogId: randomUUID(),
    requestId: randomUUID(),
  });
  process.stdout.write(
    JSON.stringify({
      status: result.status,
      failureCode: result.failureCode,
      catalogId: result.manifest?.catalogId ?? null,
    }) + '\n',
  );
  if (result.status !== 'VERIFIED') process.exitCode = 1;
} catch {
  process.stderr.write('BACKUP_JOB_BLOCKED\n');
  process.exitCode = 1;
}
