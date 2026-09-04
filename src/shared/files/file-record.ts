export type FileState = 'ACTIVE' | 'VOID' | 'SUPERSEDED';

export interface FileRecord {
  id: string;
  originalFilename: string;
  storageKey: string;
  storageProvider: string;
  mimeType: string;
  extension?: string;
  sizeBytes: number;
  sha256: string;
  uploadedBy: string;
  uploadedAt: Date;
  state: FileState;
}

export interface EvidenceLink {
  id: string;
  fileId: string;
  subjectType: string;
  subjectId: string;
  evidenceType?: string;
  description?: string;
  linkedBy: string;
  linkedAt: Date;
  removedAt?: Date;
  removalReason?: string;
}

export interface FileUploadInput {
  originalFilename: string;
  mimeType: string;
  extension?: string;
  bytes: Uint8Array;
  uploadedBy: string;
  subjectType: string;
  subjectId: string;
  evidenceType?: string;
  description?: string;
}
