import { createHash } from 'node:crypto';

const SHA256 = /^[0-9a-f]{64}$/i;
const GIT_SHA = /^[0-9a-f]{40}$/i;

export const BACKUP_ARTIFACT_TYPES = ['LOGICAL_EXPORT'] as const;
export type BackupArtifactType = (typeof BACKUP_ARTIFACT_TYPES)[number];

export interface BackupManifestInput {
  catalogId: string;
  artifactType: BackupArtifactType;
  postgresVersion: string;
  gitSha: string;
  buildId: string;
  releaseId: string;
  migrationHead: string;
  migrationLedger?: readonly { version: string; name: string; checksum: string }[];
  createdAt: Date;
  startedAt: Date;
  completedAt: Date;
  byteSize: bigint;
  checksum: string;
  schemaChecksum?: string;
  fileStoreIdentity?: string;
  fileObjects?: readonly {
    fileId: string;
    storageProvider: string;
    storageKey: string;
    sizeBytes: number;
    sha256: string;
    detachedArtifactReference?: string;
  }[];
  controlledDocumentVersions?: readonly {
    documentId: string;
    documentNo: string;
    documentType: string;
    versionId: string;
    revision: string;
    state: string;
    contentHash: string;
    fileIds: readonly string[];
  }[];
  knownGaps?: readonly string[];
  retentionExpiresAt?: Date;
}

export interface BackupManifest extends BackupManifestInput {
  readonly manifestSha256: string;
}

export interface PublicBackupManifest {
  catalogId: string;
  artifactType: BackupArtifactType;
  postgresVersion: string;
  gitSha: string;
  buildId: string;
  releaseId: string;
  migrationHead: string;
  createdAt: Date;
  completedAt: Date;
  byteSize: string;
  schemaChecksum?: string;
  fileStoreIdentity?: string;
  fileObjectCount: number;
  controlledDocumentVersionCount: number;
  retentionExpiresAt?: Date;
  artifactVerified: boolean;
  knownGaps: readonly string[];
}

export function createBackupManifest(input: BackupManifestInput): BackupManifest {
  if (!input.catalogId.trim() || !input.postgresVersion.trim() || !input.buildId.trim())
    throw new Error('Backup manifest identity is incomplete.');
  if (!GIT_SHA.test(input.gitSha)) throw new Error('Backup manifest Git SHA is invalid.');
  if (!SHA256.test(input.checksum)) throw new Error('Backup manifest checksum is invalid.');
  if (input.schemaChecksum && !SHA256.test(input.schemaChecksum))
    throw new Error('Backup manifest schema checksum is invalid.');
  if (
    input.fileObjects?.some(
      (file) =>
        !file.fileId.trim() ||
        !file.storageProvider.trim() ||
        !file.storageKey.trim() ||
        !Number.isSafeInteger(file.sizeBytes) ||
        file.sizeBytes < 0 ||
        !SHA256.test(file.sha256),
    )
  )
    throw new Error('Backup manifest file metadata is invalid.');
  if (
    input.controlledDocumentVersions?.some(
      (version) =>
        !version.documentId.trim() ||
        !version.documentNo.trim() ||
        !version.documentType.trim() ||
        !version.versionId.trim() ||
        !version.revision.trim() ||
        !version.state.trim() ||
        !SHA256.test(version.contentHash),
    )
  )
    throw new Error('Backup manifest controlled document metadata is invalid.');
  if (input.byteSize < 0n) throw new Error('Backup manifest size is invalid.');
  if (input.retentionExpiresAt && input.retentionExpiresAt < input.completedAt)
    throw new Error('Backup manifest retention is invalid.');
  if (
    input.migrationLedger?.some(
      (entry) => !entry.version.trim() || !entry.name.trim() || !SHA256.test(entry.checksum),
    )
  )
    throw new Error('Backup manifest migration ledger is invalid.');

  const canonical = JSON.stringify({
    manifestVersion: 2,
    ...input,
    byteSize: input.byteSize.toString(),
    createdAt: input.createdAt.toISOString(),
    startedAt: input.startedAt.toISOString(),
    completedAt: input.completedAt.toISOString(),
    retentionExpiresAt: input.retentionExpiresAt?.toISOString() ?? null,
  });
  return { ...input, manifestSha256: createHash('sha256').update(canonical).digest('hex') };
}

export function toPublicBackupManifest(
  manifest: BackupManifest,
  artifactVerified: boolean,
  knownGaps: readonly string[] = [],
): PublicBackupManifest {
  return {
    catalogId: manifest.catalogId,
    artifactType: manifest.artifactType,
    postgresVersion: manifest.postgresVersion,
    gitSha: manifest.gitSha,
    buildId: manifest.buildId,
    releaseId: manifest.releaseId,
    migrationHead: manifest.migrationHead,
    createdAt: manifest.createdAt,
    completedAt: manifest.completedAt,
    byteSize: manifest.byteSize.toString(),
    ...(manifest.schemaChecksum ? { schemaChecksum: manifest.schemaChecksum } : {}),
    ...(manifest.fileStoreIdentity ? { fileStoreIdentity: manifest.fileStoreIdentity } : {}),
    fileObjectCount: manifest.fileObjects?.length ?? 0,
    controlledDocumentVersionCount: manifest.controlledDocumentVersions?.length ?? 0,
    ...(manifest.retentionExpiresAt ? { retentionExpiresAt: manifest.retentionExpiresAt } : {}),
    artifactVerified,
    knownGaps: [...(manifest.knownGaps ?? []), ...knownGaps],
  };
}
