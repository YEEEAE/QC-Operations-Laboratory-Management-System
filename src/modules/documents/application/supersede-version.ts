import { AppError } from '../../../shared/errors/app-error.js';
import { authorizeDocument } from './authorization.js';
import { nextDocumentVersionState } from '../domain/document-state.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { DocumentRepository } from '../ports/repository.js';

export interface EffectiveDatePolicy { isApproved(): boolean; }

export class SupersedeVersionUseCase {
  constructor(private readonly repository: DocumentRepository, private readonly policy: EffectiveDatePolicy = { isApproved: () => false }, private readonly now = () => new Date()) {}

  async execute(input: { actor: ActorContext; currentVersionId: string; currentExpectedVersion: bigint; replacementVersionId: string; replacementExpectedVersion: bigint; effectiveAt?: Date; requestId: string }) {
    if (!this.policy.isApproved()) throw new AppError('AUTHZ_DENIED', { userSafe: true, messageKey: 'documents.effectiveDatePolicyUnapproved' });
    if (!input.effectiveAt) throw new AppError('VALIDATION_FAILED', { userSafe: true, fieldErrors: { effectiveAt: ['required by approved policy'] } });
    const current = await this.repository.getVersion(input.currentVersionId);
    const replacement = await this.repository.getVersion(input.replacementVersionId);
    if (!current || !replacement || current.documentId !== replacement.documentId) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    const document = await this.repository.getDocument(current.documentId);
    if (!document) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    authorizeDocument({ actor: input.actor, permission: 'PERM-DOC-SUPERSEDE', action: 'SUPERSEDE', document, state: current.state, version: current, expectedVersion: input.currentExpectedVersion });
    authorizeDocument({ actor: input.actor, permission: 'PERM-DOC-SUPERSEDE', action: 'SUPERSEDE', document, state: replacement.state, version: replacement, expectedVersion: input.replacementExpectedVersion });
    if (nextDocumentVersionState(current.state, 'SUPERSEDE') !== 'SUPERSEDED' || replacement.state !== 'APPROVED') throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
    return this.repository.supersede({ currentId: input.currentVersionId, currentExpectedVersion: input.currentExpectedVersion, replacementId: input.replacementVersionId, replacementExpectedVersion: input.replacementExpectedVersion, actor: input.actor, effectiveAt: input.effectiveAt ?? this.now(), requestId: input.requestId });
  }
}
