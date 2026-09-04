import type { EvidenceLink, FileRecord } from './file-record';

export interface FileRepository {
  create(record: FileRecord): Promise<FileRecord>;
  linkEvidence(link: EvidenceLink): Promise<EvidenceLink>;
  findById(id: string): Promise<FileRecord | undefined>;
  findEvidence(id: string): Promise<EvidenceLink | undefined>;
}
