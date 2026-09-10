import { createHash } from 'node:crypto';
import type {
  ArtifactMetadata,
  BackupArtifactStore,
  StoredArtifact,
} from '../ports/artifact-store.js';

type Entry = { bytes: Uint8Array; metadata: ArtifactMetadata; createdAt: Date };

export class LocalArtifactStore implements BackupArtifactStore {
  private readonly entries = new Map<string, Entry>();

  async put(input: {
    reference: string;
    bytes: Uint8Array;
    contentType: string;
    metadata: ArtifactMetadata;
  }): Promise<StoredArtifact> {
    void input.contentType;
    if (this.entries.has(input.reference)) throw new Error('ARTIFACT_ALREADY_EXISTS');
    const bytes = new Uint8Array(input.bytes);
    const checksum = createHash('sha256').update(bytes).digest('hex');
    if (BigInt(bytes.byteLength) !== input.metadata.sizeBytes || checksum !== input.metadata.checksum)
      throw new Error('ARTIFACT_METADATA_MISMATCH');
    const metadata = { ...input.metadata };
    this.entries.set(input.reference, { bytes, metadata, createdAt: new Date() });
    return { reference: input.reference, ...metadata };
  }

  async get(reference: string): Promise<Uint8Array> {
    const entry = this.entries.get(reference);
    if (!entry) throw new Error('ARTIFACT_NOT_FOUND');
    return new Uint8Array(entry.bytes);
  }

  async head(reference: string): Promise<ArtifactMetadata> {
    const entry = this.entries.get(reference);
    if (!entry) throw new Error('ARTIFACT_NOT_FOUND');
    return { ...entry.metadata };
  }

  async delete(reference: string): Promise<void> {
    this.entries.delete(reference);
  }

  async list(): Promise<readonly { reference: string; createdAt: Date; metadata: ArtifactMetadata }[]> {
    return [...this.entries.entries()].map(([reference, entry]) => ({
      reference,
      createdAt: entry.createdAt,
      metadata: { ...entry.metadata },
    }));
  }
}
