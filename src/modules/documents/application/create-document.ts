import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import { createDocumentIdentity } from '../domain/document.js';
import type { DocumentRepository } from '../ports/repository.js';

export class CreateDocumentUseCase {
  constructor(private readonly repository: DocumentRepository, private readonly now = () => new Date()) {}

  execute(input: { actor: ActorContext; documentNo: string; documentType: string; title: string; ownerId?: string; requestId: string }) {
    authorize({ actor: input.actor, permission: 'PERM-DOC-CREATE', action: 'CREATE', entity: { type: 'DOCUMENT_IDENTITY', id: 'new', state: 'CATALOG_ONLY', ownerId: input.ownerId ?? input.actor.id }, scope: { ownerId: input.ownerId ?? input.actor.id }, currentVersion: 1n, expectedVersion: 1n, businessCondition: true }, { throwOnDeny: true });
    const document = createDocumentIdentity({ ...input, id: uuidv7(), createdBy: input.actor.id, now: this.now() });
    return this.repository.createDocument({ document, actor: input.actor, requestId: input.requestId });
  }
}
