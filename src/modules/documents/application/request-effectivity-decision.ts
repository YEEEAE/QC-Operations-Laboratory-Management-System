import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { assertApprovalEvidence } from '../domain/document-version.js';
import { authorizeDocument } from './authorization.js';
import type { DocumentRepository } from '../ports/repository.js';

export type EffectivityRequestAction = 'ACTIVATE_NOW' | 'SCHEDULE_ACTIVATION' | 'SUPERSEDE' | 'ARCHIVE';

/** Records a request for controlled review; it never changes document state. */
export class RequestEffectivityDecisionUseCase {
  constructor(private readonly repository: DocumentRepository, private readonly now = () => new Date()) {}

  async execute(input: {
    actor: ActorContext;
    documentId: string;
    versionId: string;
    expectedVersion: bigint;
    expectedContentHash: string;
    action: EffectivityRequestAction;
    effectiveAt?: Date;
    replacementVersionId?: string;
    expectedReplacementVersion?: bigint;
    replacementContentHash?: string;
    reason: string;
    requestId: string;
  }) {
    const reason = input.reason.trim();
    if (!reason) throw new AppError('VALIDATION_FAILED', { userSafe: true, fieldErrors: { reason: ['required'] } });
    if (input.action === 'SCHEDULE_ACTIVATION') {
      if (!input.effectiveAt || input.effectiveAt <= this.now()) {
        throw new AppError('VALIDATION_FAILED', { userSafe: true, fieldErrors: { effectiveAt: ['choose a future date and time'] } });
      }
    } else if (input.effectiveAt) {
      throw new AppError('VALIDATION_FAILED', { userSafe: true, fieldErrors: { effectiveAt: ['not used for this decision'] } });
    }
    const version = await this.repository.getVersion(input.versionId);
    if (!version || version.documentId !== input.documentId) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    const document = await this.repository.getDocument(input.documentId);
    if (!document) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (version.version !== input.expectedVersion || version.contentHash !== input.expectedContentHash) {
      throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
    }
    if (!['APPROVED', 'EFFECTIVE', 'SUPERSEDED'].includes(version.state)) throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
    if ((input.action === 'ACTIVATE_NOW' || input.action === 'SCHEDULE_ACTIVATION') && version.state !== 'APPROVED') throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
    if (input.action === 'SUPERSEDE' && version.state !== 'EFFECTIVE') throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
    if (input.action === 'ARCHIVE' && version.state !== 'SUPERSEDED') throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
    assertApprovalEvidence(version);
    authorizeDocument({
      actor: input.actor,
      permission: 'PERM-DOC-SUPERSEDE',
      action: 'SUPERSEDE',
      document,
      state: version.state,
      version,
      expectedVersion: input.expectedVersion,
    });
    if (input.action === 'SUPERSEDE') {
      if (!input.replacementVersionId || input.expectedReplacementVersion === undefined || !input.replacementContentHash) {
        throw new AppError('VALIDATION_FAILED', { userSafe: true, fieldErrors: { replacementVersionId: ['select an approved replacement revision'] } });
      }
      const replacement = await this.repository.getVersion(input.replacementVersionId);
      if (!replacement || replacement.documentId !== document.id || replacement.state !== 'APPROVED' || replacement.version !== input.expectedReplacementVersion || replacement.contentHash !== input.replacementContentHash) {
        throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
      }
      assertApprovalEvidence(replacement);
      authorizeDocument({ actor: input.actor, permission: 'PERM-DOC-SUPERSEDE', action: 'SUPERSEDE', document, state: replacement.state, version: replacement, expectedVersion: input.expectedReplacementVersion });
    } else if (input.replacementVersionId || input.expectedReplacementVersion !== undefined || input.replacementContentHash) {
      throw new AppError('VALIDATION_FAILED', { userSafe: true, fieldErrors: { replacementVersionId: ['not used for this decision'] } });
    }
    return this.repository.requestEffectivity({
      documentId: document.id,
      versionId: version.id,
      expectedVersion: input.expectedVersion,
      expectedContentHash: input.expectedContentHash,
      action: input.action,
      effectiveAt: input.effectiveAt,
      replacementVersionId: input.replacementVersionId,
      expectedReplacementVersion: input.expectedReplacementVersion,
      replacementContentHash: input.replacementContentHash,
      reason,
      actor: input.actor,
      requestId: input.requestId,
      requestedAt: this.now(),
    });
  }
}
