import { AppError } from '../../../shared/errors/app-error.js';
import { authorizeDocument } from './authorization.js';
import { assertDocumentVersionDraftEditable } from '../domain/document-version.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { DocumentRepository } from '../ports/repository.js';

export class UpdateVersionDraftUseCase {
  constructor(private readonly repository: DocumentRepository, private readonly now = () => new Date()) {}

  async execute(input: { actor: ActorContext; versionId: string; expectedVersion: bigint; revision: string; changeSummary?: string; contentHash?: string; requestId: string }) {
    const version = await this.repository.getVersion(input.versionId);
    if (!version) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    const document = await this.repository.getDocument(version.documentId);
    if (!document) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    assertDocumentVersionDraftEditable(version);
    authorizeDocument({ actor: input.actor, permission: 'PERM-DOC-EDIT-DRAFT', action: 'EDIT', document, state: version.state, version, expectedVersion: input.expectedVersion });
    return this.repository.updateDraft({ ...input, id: input.versionId, now: this.now() });
  }
}
