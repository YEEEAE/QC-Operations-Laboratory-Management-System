import { AppError } from '../../../shared/errors/app-error.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { DatabaseTransaction } from '../../../shared/database/transaction.js';
import type { DocumentRepository } from '../../documents/ports/repository.js';
import { UpdateVersionDraftUseCase } from '../../documents/application/update-version-draft.js';
import type { ChangeRequestRepository } from '../ports/repository.js';
import { authorizeChangeRequestApply } from './authorization.js';
import { assertDocumentVersionChangeField } from './document-version-change-fields.js';

/** Approval authorizes an attempt; Documents alone owns the target mutation. */
export class ApplyApprovedChangeRequestUseCase {
  constructor(
    private readonly repository: ChangeRequestRepository,
    private readonly documents: (transaction: DatabaseTransaction) => DocumentRepository,
    private readonly now = () => new Date(),
  ) {}
  async execute(input: {
    actor: ActorContext;
    id: string;
    expectedVersion: bigint;
    requestId: string;
  }) {
    const aggregate = await this.repository.get(input);
    if (!aggregate) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    authorizeChangeRequestApply(
      aggregate.changeRequest,
      input.actor,
      input.expectedVersion,
      aggregate.applicationAttempts.some(
        (attempt) => attempt.requestId === input.requestId && attempt.result === 'SUCCESS',
      ),
    );
    if (!this.repository.applyApproved) throw new AppError('AUTHZ_DENIED', { userSafe: true });
    try {
      return await this.repository.applyApproved({
        ...input,
        now: this.now(),
        apply: async (locked, transaction) => {
          authorizeChangeRequestApply(locked.changeRequest, input.actor, input.expectedVersion);
          const request = locked.changeRequest;
          if (request.targetType !== 'DOCUMENT_VERSION' || locked.changes.length !== 1)
            throw new AppError('AUTHZ_DENIED', { userSafe: true });
          const change = locked.changes[0]!;
          assertDocumentVersionChangeField(change.fieldPath);
          if (
            change.dataType !== 'text' ||
            typeof change.proposedValue !== 'string' ||
            !change.proposedValue.trim()
          )
            throw new AppError('VALIDATION_FAILED', { userSafe: true });
          const repository = this.documents(transaction);
          const target = await repository.getVersion(request.targetId);
          if (
            !target ||
            !target.contentHash ||
            target.version !== request.targetVersion ||
            target.contentHash !== request.targetSnapshot.contentHash ||
            target.documentId !== request.targetSnapshot.documentId ||
            target.state !== request.targetSnapshot.state
          )
            throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
          const current =
            change.fieldPath === 'revision' ? target.revision : (target.changeSummary ?? '');
          if (current !== change.currentValue)
            throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
          const result = await new UpdateVersionDraftUseCase(repository, this.now).execute({
            actor: input.actor,
            versionId: target.id,
            expectedVersion: target.version,
            expectedContentHash: target.contentHash,
            revision: change.fieldPath === 'revision' ? change.proposedValue : target.revision,
            changeSummary:
              change.fieldPath === 'changeSummary' ? change.proposedValue : target.changeSummary,
            requestId: input.requestId,
            transaction,
          });
          return result.version;
        },
      });
    } catch (error) {
      if (
        aggregate.changeRequest.state === 'APPROVED' &&
        aggregate.changeRequest.version === input.expectedVersion &&
        error instanceof AppError &&
        ['CONFLICT_STALE_VERSION', 'DOMAIN_INVALID_TRANSITION'].includes(error.code)
      ) {
        const now = this.now();
        await this.repository.recordApplicationAttempt({
          actor: input.actor,
          expectedVersion: input.expectedVersion,
          actorId: input.actor.id,
          requestId: input.requestId,
          attempt: {
            id: uuidv7(),
            changeRequestId: input.id,
            attemptNo: aggregate.applicationAttempts.length + 1,
            startedAt: now,
            finishedAt: now,
            result: 'FAILED',
            targetVersionBefore: aggregate.changeRequest.targetVersion,
            errorCode: error.code,
            requestId: input.requestId,
          },
        });
      }
      throw error;
    }
  }
}
