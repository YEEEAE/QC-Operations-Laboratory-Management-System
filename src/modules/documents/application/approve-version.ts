import { AppError } from '../../../shared/errors/app-error.js';
import { authorizeDocument } from './authorization.js';
import { assertApprovalEvidence, type DocumentVersion } from '../domain/document-version.js';
import { transitionDocumentVersion } from '../domain/document-state.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { DocumentRepository } from '../ports/repository.js';

export class ApproveVersionUseCase {
  constructor(private readonly repository: DocumentRepository, private readonly now = () => new Date()) {}

  async execute(input: { actor: ActorContext; versionId: string; expectedVersion: bigint; requestId: string }) {
    const version = await this.repository.getVersion(input.versionId);
    if (!version) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    const document = await this.repository.getDocument(version.documentId);
    if (!document) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    authorizeDocument({ actor: input.actor, permission: 'PERM-DOC-APPROVE', action: 'APPROVE', document, state: version.state, version, expectedVersion: input.expectedVersion });
    authorizeDocument({ actor: input.actor, permission: 'PERM-APR-APPROVE', action: 'APPROVE', document, state: version.state, version, expectedVersion: input.expectedVersion });
    assertApprovalEvidence(version);
    const next = transitionDocumentVersion(version as DocumentVersion, 'APPROVE', this.now());
    return this.repository.transition({ ...input, id: version.id, action: 'APPROVE', toState: next.state, now: next.updatedAt ?? this.now() });
  }
}
