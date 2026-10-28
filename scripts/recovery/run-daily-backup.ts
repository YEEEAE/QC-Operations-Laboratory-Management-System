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
  const profile = process.env.APP_ENVIRONMENT_PROFILE;
  if (!profile) throw new Error('An explicit backup environment profile is required.');
  const environment = profile === 'development'
    ? 'local'
    : profile as 'test' | 'staging' | 'production';
  const productionBackupApproved = profile === 'production' &&
    Boolean(process.env.MIGRATION_PRODUCTION_RELEASE_ID?.trim()) &&
    Boolean(process.env.MIGRATION_PRODUCTION_APPROVAL_REFERENCE?.trim());
  const databaseUrl = process.env.DATABASE_URL_UNPOOLED?.trim();
  if (!databaseUrl) throw new Error('A direct operator database connection is required.');
  assertSafeLocalDatabaseCommand(process.env, databaseUrl, {
    productionApproved: productionBackupApproved,
  });
  parseServerEnv({ ...process.env, DATABASE_URL_UNPOOLED: undefined });
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
    environment,
  });
  const recoverySetComplete = Boolean(
    result.status === 'ARTIFACT_VERIFIED' &&
      result.manifest &&
      (result.manifest.knownGaps?.length ?? 0) === 0,
  );
  process.stdout.write(
    JSON.stringify({
      status: result.status,
      recoverySetComplete,
      failureCode: result.failureCode,
      catalogId: result.manifest?.catalogId ?? null,
      manifestReference: result.manifestReference ?? null,
      knownGaps: result.manifest?.knownGaps ?? [],
    }) + '\n',
  );
  if (!recoverySetComplete) process.exitCode = 1;
} catch {
  process.stderr.write('BACKUP_JOB_BLOCKED\n');
  process.exitCode = 1;
}
