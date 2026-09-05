import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { authorizeDocument } from './authorization.js';
import type { DocumentRepository } from '../ports/repository.js';

export class GetDocumentUseCase {
  constructor(private readonly repository: DocumentRepository) {}

  async execute(input: { actor: ActorContext; documentId: string }) {
    const document = await this.repository.getDocument(input.documentId);
    if (!document) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    authorizeDocument({ actor: input.actor, permission: 'PERM-DOC-VIEW', action: 'VIEW', document, state: 'CATALOG_ONLY' });
    const versions = await this.repository.listVersions(document.id);
    return { ...document, versions };
  }
}
