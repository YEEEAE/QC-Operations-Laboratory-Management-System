import { createBackupManifest } from '../domain/backup-manifest.js';
import type { BackupArtifactStore } from '../ports/artifact-store.js';
import type { PostgresBackupExecutor } from '../ports/backup-executor.js';
import type { BackupReleaseIdentity } from '../ports/release-identity.js';
import { checksum } from '../infrastructure/postgres-logical-backup-executor.js';

export interface BackupJobResult {
  readonly status: 'VERIFIED' | 'FAILED';
  readonly manifest?: ReturnType<typeof createBackupManifest>;
  readonly failureCode?: 'BACKUP_EXECUTION_FAILED' | 'BACKUP_ARTIFACT_INTEGRITY_FAILED' | 'BACKUP_STORAGE_UNAVAILABLE';
}

export async function runLogicalBackupJob(input: {
  executor: PostgresBackupExecutor;
  store: BackupArtifactStore;
  databaseUrl: string;
  release: BackupReleaseIdentity;
  catalogId: string;
  requestId: string;
  now?: () => Date;
}): Promise<BackupJobResult> {
  const now = input.now ?? (() => new Date());
  let execution;
  try {
    execution = await input.executor.createLogicalBackup({ databaseUrl: input.databaseUrl, requestId: input.requestId });
  } catch {
    return { status: 'FAILED', failureCode: 'BACKUP_EXECUTION_FAILED' };
  }
  const bytesChecksum = checksum(execution.bytes);
  let manifest;
  try {
    manifest = createBackupManifest({
      catalogId: input.catalogId,
      artifactType: 'LOGICAL_EXPORT',
      postgresVersion: execution.postgresVersion || input.release.postgresVersion,
      gitSha: input.release.gitSha,
      buildId: input.release.buildId,
      releaseId: input.release.releaseId,
      migrationHead: input.release.migrationHead,
      createdAt: now(),
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      byteSize: BigInt(execution.bytes.byteLength),
      checksum: bytesChecksum,
      retentionExpiresAt: new Date(execution.completedAt.getTime() + 30 * 24 * 60 * 60 * 1000),
    });
    const reference = `backup/${manifest.releaseId}/${manifest.catalogId}.dump`;
    await input.store.put({
      reference,
      bytes: execution.bytes,
      contentType: 'application/octet-stream',
      metadata: { sizeBytes: manifest.byteSize, checksum: manifest.checksum },
    });
    const stored = await input.store.head(reference);
    if (stored.sizeBytes !== manifest.byteSize || stored.checksum.toLowerCase() !== manifest.checksum.toLowerCase())
      return { status: 'FAILED', failureCode: 'BACKUP_ARTIFACT_INTEGRITY_FAILED' };
    return { status: 'VERIFIED', manifest };
  } catch {
    return { status: 'FAILED', failureCode: 'BACKUP_STORAGE_UNAVAILABLE' };
  }
}
