import type { Kysely } from 'kysely';
import type { DatabaseRow, DatabaseSchema } from '../database/db-types';
import { uuidv7 } from '../id/uuid';
import type { EvidenceLink, FileRecord } from './file-record';
import type { FileRepository } from './file-repository';

const toFile = (r: DatabaseRow<'files'>): FileRecord => ({
  id: r.id as string,
  originalFilename: r.original_filename,
  storageKey: r.storage_key,
  storageProvider: r.storage_provider,
  mimeType: r.mime_type,
  ...(r.extension ? { extension: r.extension } : {}),
  sizeBytes: Number(r.size_bytes),
  sha256: r.sha256,
  uploadedBy: r.uploaded_by,
  uploadedAt: r.uploaded_at as Date,
  state: r.state as FileRecord['state'],
});
const toLink = (r: DatabaseRow<'evidence_links'>): EvidenceLink => ({
  id: r.id as string,
  fileId: r.file_id,
  subjectType: r.subject_type,
  subjectId: r.subject_id,
  ...(r.evidence_type ? { evidenceType: r.evidence_type } : {}),
  ...(r.description ? { description: r.description } : {}),
  linkedBy: r.linked_by,
  linkedAt: r.linked_at as Date,
  ...(r.removed_at ? { removedAt: r.removed_at } : {}),
  ...(r.removal_reason ? { removalReason: r.removal_reason } : {}),
});

export class PostgresFileRepository implements FileRepository {
  constructor(private readonly database: Kysely<DatabaseSchema>) {}
  async create(record: FileRecord): Promise<FileRecord> {
    const row = await this.database
      .insertInto('files')
      .values({
        id: record.id,
        original_filename: record.originalFilename,
        storage_key: record.storageKey,
        storage_provider: record.storageProvider,
        mime_type: record.mimeType,
        extension: record.extension ?? null,
        size_bytes: record.sizeBytes,
        sha256: record.sha256,
        uploaded_by: record.uploadedBy,
        uploaded_at: record.uploadedAt,
        state: record.state,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return toFile(row);
  }
  async linkEvidence(link: EvidenceLink): Promise<EvidenceLink> {
    const row = await this.database
      .insertInto('evidence_links')
      .values({
        id: link.id ?? uuidv7(),
        file_id: link.fileId,
        subject_type: link.subjectType,
        subject_id: link.subjectId,
        evidence_type: link.evidenceType ?? null,
        description: link.description ?? null,
        linked_by: link.linkedBy,
        linked_at: link.linkedAt,
        removed_at: link.removedAt ?? null,
        removal_reason: link.removalReason ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return toLink(row);
  }
  async findById(id: string) {
    const row = await this.database
      .selectFrom('files')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row ? toFile(row) : undefined;
  }
  async findEvidence(id: string) {
    const row = await this.database
      .selectFrom('evidence_links')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row ? toLink(row) : undefined;
  }
}
