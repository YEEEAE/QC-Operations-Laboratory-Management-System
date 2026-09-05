import { AppError } from '../../../shared/errors/app-error.js';
import { authorizeDocument } from './authorization.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { DocumentRepository } from '../ports/repository.js';

export class ReviewVersionUseCase {
  constructor(private readonly repository: DocumentRepository) {}

  async execute(input: { actor: ActorContext; versionId: string; expectedVersion: bigint; requestId: string }) {
    const version = await this.repository.getVersion(input.versionId);
    if (!version) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    const document = await this.repository.getDocument(version.documentId);
    if (!document) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    authorizeDocument({ actor: input.actor, permission: 'PERM-DOC-REVIEW', action: 'REVIEW', document, state: version.state, version, expectedVersion: input.expectedVersion });
    authorizeDocument({ actor: input.actor, permission: 'PERM-APR-REVIEW', action: 'REVIEW', document, state: version.state, version, expectedVersion: input.expectedVersion });
    return this.repository.recordReview({ id: version.id, expectedVersion: input.expectedVersion, actor: input.actor, now: new Date(), requestId: input.requestId });
  }
}
