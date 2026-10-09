import { AppError } from '../../../shared/errors/app-error.js';
import { authorize } from '../../../shared/authorization/authorize.js';
import { parsePageInput } from '../../../shared/pagination/page.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { ownerOf } from './authorization.js';
import type { DocumentRepository, DocumentListFilter } from '../ports/repository.js';

export class ListDocumentsUseCase {
  constructor(private readonly repository: DocumentRepository) {}

  executePage(input: { actor: ActorContext; filter?: DocumentListFilter; page?: import('../../../shared/pagination/page.js').PageInput }) {
    authorize({ actor: input.actor, permission: 'PERM-DOC-VIEW', action: 'VIEW', entity: { type: 'DOCUMENT_IDENTITY', id: 'list', state: 'CATALOG_ONLY', ownerId: input.actor.id }, scope: { ownerId: input.actor.id }, currentVersion: 1n, expectedVersion: 1n, businessCondition: true }, { throwOnDeny: true });
    if (!this.repository.listDocumentsPage) throw new AppError('SYSTEM_DATABASE_UNAVAILABLE', { userSafe: true });
    return this.repository.listDocumentsPage({ ...input, page: parsePageInput(input.page) });
  }

  async execute(input: { actor: ActorContext; filter?: DocumentListFilter }) {
    authorize({ actor: input.actor, permission: 'PERM-DOC-VIEW', action: 'VIEW', entity: { type: 'DOCUMENT_IDENTITY', id: 'list', state: 'CATALOG_ONLY', ownerId: input.actor.id }, scope: { ownerId: input.actor.id }, currentVersion: 1n, expectedVersion: 1n, businessCondition: true }, { throwOnDeny: true });
    const documents = await this.repository.listDocuments(input);
    return documents.filter((document) => {
      try {
        authorize({ actor: input.actor, permission: 'PERM-DOC-VIEW', action: 'VIEW', entity: { type: 'DOCUMENT_IDENTITY', id: document.id, state: 'CATALOG_ONLY', ownerId: ownerOf(document) }, scope: { ownerId: ownerOf(document) }, currentVersion: document.version, expectedVersion: document.version, businessCondition: document.active }, { throwOnDeny: true });
        return true;
      } catch { return false; }
    });
  }
}
