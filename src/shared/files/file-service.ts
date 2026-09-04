import { AppError } from '../errors/app-error';
import { uuidv7 } from '../id/uuid';
import type { EvidenceLink, FileRecord, FileUploadInput } from './file-record';
import type { FileRepository } from './file-repository';
import type { ObjectStore } from './object-store';
import { sha256 } from './sha256';

export type FileAccessAuthorizer = (input: {
  action: 'UPLOAD' | 'VIEW' | 'DOWNLOAD';
  actorId: string;
  subjectType: string;
  subjectId: string;
}) => Promise<void>;

export class FileService {
  constructor(
    private readonly repository: FileRepository,
    private readonly store: ObjectStore,
    private readonly authorizeAccess: FileAccessAuthorizer,
  ) {}

  async upload(input: FileUploadInput): Promise<{ file: FileRecord; evidence: EvidenceLink }> {
    await this.authorizeAccess({
      action: 'UPLOAD',
      actorId: input.uploadedBy,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
    });
    if (!input.originalFilename.trim() || input.bytes.byteLength < 0)
      throw new AppError('VALIDATION_FAILED');
    const digest = sha256(input.bytes);
    const fileId = uuidv7();
    const storageKey = `files/${fileId}`;
    await this.store.put(storageKey, { bytes: input.bytes, contentType: input.mimeType });
    const file = await this.repository.create({
      id: fileId,
      originalFilename: input.originalFilename,
      storageKey,
      storageProvider: 'OBJECT_STORE',
      mimeType: input.mimeType,
      ...(input.extension ? { extension: input.extension } : {}),
      sizeBytes: input.bytes.byteLength,
      sha256: digest,
      uploadedBy: input.uploadedBy,
      uploadedAt: new Date(),
      state: 'ACTIVE',
    });
    const evidence = await this.repository.linkEvidence({
      id: uuidv7(),
      fileId,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      ...(input.evidenceType ? { evidenceType: input.evidenceType } : {}),
      ...(input.description ? { description: input.description } : {}),
      linkedBy: input.uploadedBy,
      linkedAt: new Date(),
    });
    return { file, evidence };
  }

  async download(
    actorId: string,
    link: EvidenceLink,
  ): Promise<{ file: FileRecord; object: { bytes: Uint8Array; contentType: string } }> {
    await this.authorizeAccess({
      action: 'DOWNLOAD',
      actorId,
      subjectType: link.subjectType,
      subjectId: link.subjectId,
    });
    const file = await this.repository.findById(link.fileId);
    if (!file) throw new AppError('RESOURCE_NOT_FOUND');
    const object = await this.store.get(file.storageKey);
    if (!object) throw new AppError('RESOURCE_NOT_FOUND');
    if (sha256(object.bytes) !== file.sha256) throw new AppError('VALIDATION_FAILED');
    return { file, object };
  }
}
