import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { DatabaseTransaction } from '../../../shared/database/transaction.js';
import type { DocumentRepository } from '../ports/repository.js';
import { authorizeDocument } from './authorization.js';
import { isOwnerApprovalPath, decideApprovalPath } from '../../approvals/application/owner-approval-policy.js';
import { transitionDocumentVersion } from '../domain/document-state.js';

export class ApproveVersionUseCase {
  constructor(private readonly repository: DocumentRepository) {}

  async execute(input: { actor: ActorContext; versionId: string; expectedVersion: bigint; requestId: string; reason?: string; transaction?: DatabaseTransaction }) {
    const version = await this.repository.getVersion(input.versionId);
    if (!version) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (version.state !== 'IN_REVIEW') throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
    if (!version.reviewedAt || !version.reviewedBy || version.reviewedBy === version.createdBy) throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true, messageKey: 'documents.independentReviewRequired' });
    const document = await this.repository.getDocument(version.documentId);
    if (!document) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (!isOwnerApprovalPath(input.actor)) {
      // The owner decision covers only the named owner's internal path. The
      // approved non-owner document action/signature map is still absent.
      throw new AppError('POLICY_SOURCE_REQUIRED', {
        userSafe: true,
        safeMetadata: { requestId: input.requestId },
      });
    }
    authorizeDocument({ actor: input.actor, permission: 'PERM-DOC-APPROVE', action: 'APPROVE', document, state: version.state, version, expectedVersion: input.expectedVersion });
    authorizeDocument({ actor: input.actor, permission: 'PERM-APR-APPROVE', action: 'APPROVE', document, state: version.state, version, expectedVersion: input.expectedVersion });
    const now = new Date();
    const next = transitionDocumentVersion(version, 'APPROVE', now, input.reason);
    const decisionEvent = decideApprovalPath({
      actor: input.actor,
      subjectType: 'DOCUMENT_VERSION',
      subjectId: version.id,
      subjectVersion: version.version,
      decision: 'APPROVE',
      reason: input.reason,
    });
    return this.repository.transition({
      id: version.id,
      expectedVersion: input.expectedVersion,
      actor: input.actor,
      action: 'APPROVE',
      toState: next.state,
      reason: input.reason,
      now,
      requestId: input.requestId,
      approvalDecisionEvent: decisionEvent,
    }, input.transaction);
  }
}
