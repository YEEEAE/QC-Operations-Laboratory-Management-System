import { AppError } from '../../../shared/errors/app-error.js';
import { authorizeDocument } from './authorization.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import { createDraftDocumentVersion } from '../domain/document-version.js';
import type { DocumentRepository } from '../ports/repository.js';

export class CreateVersionUseCase {
  constructor(private readonly repository: DocumentRepository, private readonly now = () => new Date()) {}

  async execute(input: { actor: ActorContext; documentId: string; revision: string; changeSummary?: string; fileIds: readonly string[]; requestId: string }) {
    const document = await this.repository.getDocument(input.documentId);
    if (!document) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    const versions = await this.repository.listVersions(document.id);
    const current = versions.find((version) => version.state === 'EFFECTIVE') ?? versions.at(-1);
    if (current) {
      if (!['APPROVED', 'EFFECTIVE'].includes(current.state)) throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
      authorizeDocument({ actor: input.actor, permission: 'PERM-DOC-REVISE', action: 'REVISE', document, state: current.state });
    } else authorizeDocument({ actor: input.actor, permission: 'PERM-DOC-CREATE', action: 'CREATE', document, state: 'CATALOG_ONLY' });
    const now = this.now();
    if (!input.fileIds.length) {
      throw new AppError('VALIDATION_FAILED', { userSafe: true, fieldErrors: { files: ['required'] } });
    }
    const base = createDraftDocumentVersion({ ...input, id: uuidv7(), createdBy: input.actor.id, now });
    const sourceFiles = input.fileIds.map((fileId) => ({ fileId, fileRole: 'SOURCE' }));
    return this.repository.createVersion({ version: { ...base, files: [] }, sourceFiles, actor: input.actor, requestId: input.requestId });
  }
}
