import type { EvidenceLink, FileRecord } from './file-record';

export interface FileRepository {
  /** Persists file metadata and its evidence link atomically. */
  createWithEvidence(record: FileRecord, link: EvidenceLink): Promise<void>;
  findById(id: string): Promise<FileRecord | undefined>;
  findEvidence(id: string): Promise<EvidenceLink | undefined>;
}
