import { createBackupManifest } from '../domain/backup-manifest.js';
import type { BackupArtifactStore } from '../ports/artifact-store.js';
import type { PostgresBackupExecutor } from '../ports/backup-executor.js';
import type { BackupReleaseIdentity } from '../ports/release-identity.js';
import { checksum } from '../infrastructure/postgres-logical-backup-executor.js';

export interface BackupJobResult {
  readonly status: 'CREATED' | 'ARTIFACT_VERIFIED' | 'FAILED';
  readonly manifest?: ReturnType<typeof createBackupManifest>;
  readonly manifestReference?: string;
  readonly failureCode?:
    'BACKUP_EXECUTION_FAILED' | 'BACKUP_ARTIFACT_INTEGRITY_FAILED' | 'BACKUP_STORAGE_UNAVAILABLE';
}

export async function runLogicalBackupJob(input: {
  executor: PostgresBackupExecutor;
  store: BackupArtifactStore;
  databaseUrl: string;
  release: BackupReleaseIdentity;
  catalogId: string;
  requestId: string;
  environment: 'local' | 'test' | 'staging' | 'production';
  schemaChecksum?: string;
  fileStoreIdentity?: string;
  fileObjects?: NonNullable<Parameters<typeof createBackupManifest>[0]['fileObjects']>;
  controlledDocumentVersions?: NonNullable<Parameters<typeof createBackupManifest>[0]['controlledDocumentVersions']>;
  now?: () => Date;
}): Promise<BackupJobResult> {
  const now = input.now ?? (() => new Date());
  let execution;
  try {
    execution = await input.executor.createLogicalBackup({
      databaseUrl: input.databaseUrl,
      requestId: input.requestId,
    });
  } catch {
    return { status: 'FAILED', failureCode: 'BACKUP_EXECUTION_FAILED' };
  }
  if (
    !execution.migrationLedger.length ||
    !execution.migrationLedger.some(
      (entry) => entry.version === input.release.migrationHead || entry.name === input.release.migrationHead,
    )
  )
    return { status: 'FAILED', failureCode: 'BACKUP_EXECUTION_FAILED' };
  const bytesChecksum = checksum(execution.bytes);
  let manifest;
  let manifestReference: string | undefined;
  let artifactCreated = false;
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
      schemaChecksum: input.schemaChecksum ?? execution.schemaChecksum,
      ...(input.fileStoreIdentity ? { fileStoreIdentity: input.fileStoreIdentity } : {}),
      migrationLedger: execution.migrationLedger,
      fileObjects: input.fileObjects ?? execution.fileObjects,
      controlledDocumentVersions: input.controlledDocumentVersions ?? execution.controlledDocumentVersions,
      knownGaps: [
        ...(!(input.schemaChecksum ?? execution.schemaChecksum) ? ['DATABASE_SCHEMA_CHECKSUM_NOT_CAPTURED'] : []),
        ...(!input.fileStoreIdentity ? ['FILE_STORE_IDENTITY_NOT_CAPTURED'] : []),
        ...(!(input.fileObjects ?? execution.fileObjects) ? ['DETACHED_QC_FILE_ARTIFACTS_NOT_CAPTURED'] : []),
        ...(!(input.controlledDocumentVersions ?? execution.controlledDocumentVersions)
          ? ['CONTROLLED_DOCUMENT_VERSION_SNAPSHOT_NOT_CAPTURED']
          : []),
        ...((input.fileObjects ?? execution.fileObjects).some((file) => !file.detachedArtifactReference)
          ? ['DETACHED_QC_FILE_ARTIFACT_REFERENCE_MISSING']
          : []),
        ...(!input.fileStoreIdentity ? ['FILE_STORE_IDENTITY_NOT_CAPTURED'] : []),
        'BACKUP_CATALOG_ROW_NOT_PERSISTED',
      ],
    });
    const reference = `backup/${manifest.releaseId}/${manifest.catalogId}.dump`;
    await input.store.put({
      reference,
      bytes: execution.bytes,
      contentType: 'application/octet-stream',
      metadata: { sizeBytes: manifest.byteSize, checksum: manifest.checksum },
    });
    artifactCreated = true;
    const stored = await input.store.head(reference);
    const retrievedBytes = await input.store.get(reference);
    if (
      stored.sizeBytes !== manifest.byteSize ||
      stored.checksum.toLowerCase() !== manifest.checksum.toLowerCase() ||
      BigInt(retrievedBytes.byteLength) !== manifest.byteSize ||
      checksum(retrievedBytes) !== manifest.checksum
    )
      return { status: 'CREATED', failureCode: 'BACKUP_ARTIFACT_INTEGRITY_FAILED', manifest };
    manifestReference = `${reference}.manifest.json`;
    const recoveryManifest = {
      manifestVersion: 2,
      backupSetId: manifest.catalogId,
      environment: input.environment,
      createdAt: manifest.createdAt.toISOString(),
      backupJobResult: 'ARTIFACT_VERIFIED',
      artifactIntegrityStatus: 'VERIFIED',
      restoreVerificationStatus: 'NOT_VERIFIED',
      database: {
        restoreReference: reference,
        postgresqlVersion: manifest.postgresVersion,
        schemaChecksum: manifest.schemaChecksum,
        migrationLedger: manifest.migrationLedger,
        coreRelations: [],
        historyRelations: [],
      },
      ...(manifest.fileStoreIdentity ? { fileStoreIdentity: manifest.fileStoreIdentity } : {}),
      fileObjects: manifest.fileObjects ?? [],
      controlledDocumentVersions: manifest.controlledDocumentVersions ?? [],
      appContext: {
        gitCommitSha: manifest.gitSha,
        releaseId: manifest.releaseId,
        buildId: manifest.buildId,
        migrationHead: manifest.migrationHead,
      },
      knownGaps: manifest.knownGaps ?? [],
    };
    const manifestSha256 = checksum(new TextEncoder().encode(JSON.stringify(recoveryManifest)));
    const manifestBytes = new TextEncoder().encode(JSON.stringify({ ...recoveryManifest, manifestSha256 }));
    const manifestChecksum = checksum(manifestBytes);
    await input.store.put({
      reference: manifestReference,
      bytes: manifestBytes,
      contentType: 'application/json',
      metadata: { sizeBytes: BigInt(manifestBytes.byteLength), checksum: manifestChecksum },
    });
    const storedManifest = await input.store.head(manifestReference);
    const retrievedManifest = await input.store.get(manifestReference);
    if (
      storedManifest.sizeBytes !== BigInt(manifestBytes.byteLength) ||
      storedManifest.checksum.toLowerCase() !== manifestChecksum ||
      BigInt(retrievedManifest.byteLength) !== BigInt(manifestBytes.byteLength) ||
      checksum(retrievedManifest) !== manifestChecksum
    )
      return { status: 'CREATED', failureCode: 'BACKUP_ARTIFACT_INTEGRITY_FAILED', manifest, manifestReference };
    return { status: 'ARTIFACT_VERIFIED', manifest, manifestReference };
  } catch {
    return artifactCreated
      ? { status: 'CREATED', failureCode: 'BACKUP_STORAGE_UNAVAILABLE', manifest, manifestReference }
      : { status: 'FAILED', failureCode: 'BACKUP_STORAGE_UNAVAILABLE', manifest, manifestReference };
  }
}
