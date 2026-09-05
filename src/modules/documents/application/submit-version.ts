import { AppError } from '../../../shared/errors/app-error.js';
import { authorizeDocument } from './authorization.js';
import { transitionDocumentVersion } from '../domain/document-state.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { DocumentRepository } from '../ports/repository.js';

export class SubmitVersionUseCase {
  constructor(private readonly repository: DocumentRepository, private readonly now = () => new Date()) {}

  async execute(input: { actor: ActorContext; versionId: string; expectedVersion: bigint; requestId: string }) {
    const version = await this.repository.getVersion(input.versionId);
    if (!version) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    const document = await this.repository.getDocument(version.documentId);
    if (!document) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    authorizeDocument({ actor: input.actor, permission: 'PERM-DOC-SUBMIT', action: 'SUBMIT', document, state: version.state, version, expectedVersion: input.expectedVersion });
    const next = transitionDocumentVersion(version, 'SUBMIT', this.now());
    return this.repository.transition({ ...input, id: version.id, action: 'SUBMIT', toState: next.state, now: next.updatedAt ?? this.now() });
  }
}
