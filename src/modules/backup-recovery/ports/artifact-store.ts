export interface ArtifactMetadata {
  readonly sizeBytes: bigint;
  readonly checksum: string;
  readonly version?: string;
}

export interface StoredArtifact extends ArtifactMetadata {
  readonly reference: string;
}

export interface BackupArtifactStore {
  put(input: {
    reference: string;
    bytes: Uint8Array;
    contentType: string;
    metadata: ArtifactMetadata;
  }): Promise<StoredArtifact>;
  get(reference: string): Promise<Uint8Array>;
  head(reference: string): Promise<ArtifactMetadata>;
  delete(reference: string): Promise<void>;
  list(): Promise<readonly { reference: string; createdAt: Date; metadata: ArtifactMetadata }[]>;
}
