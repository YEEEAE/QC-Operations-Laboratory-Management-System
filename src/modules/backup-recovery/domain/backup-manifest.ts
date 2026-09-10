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
  createdAt: Date;
  startedAt: Date;
  completedAt: Date;
  byteSize: bigint;
  checksum: string;
  retentionExpiresAt: Date;
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
  retentionExpiresAt: Date;
  artifactVerified: boolean;
  knownGaps: readonly string[];
}

export function createBackupManifest(input: BackupManifestInput): BackupManifest {
  if (!input.catalogId.trim() || !input.postgresVersion.trim() || !input.buildId.trim())
    throw new Error('Backup manifest identity is incomplete.');
  if (!GIT_SHA.test(input.gitSha)) throw new Error('Backup manifest Git SHA is invalid.');
  if (!SHA256.test(input.checksum)) throw new Error('Backup manifest checksum is invalid.');
  if (input.byteSize < 0n) throw new Error('Backup manifest size is invalid.');
  if (input.retentionExpiresAt < input.completedAt)
    throw new Error('Backup manifest retention is invalid.');

  const canonical = JSON.stringify({
    ...input,
    byteSize: input.byteSize.toString(),
    createdAt: input.createdAt.toISOString(),
    startedAt: input.startedAt.toISOString(),
    completedAt: input.completedAt.toISOString(),
    retentionExpiresAt: input.retentionExpiresAt.toISOString(),
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
    retentionExpiresAt: manifest.retentionExpiresAt,
    artifactVerified,
    knownGaps,
  };
}
