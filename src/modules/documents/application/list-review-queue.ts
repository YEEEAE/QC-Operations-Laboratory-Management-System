import { AppError } from '../../../shared/errors/app-error.js';
import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { DocumentReviewQueueQuery } from '../ports/repository.js';

const REVIEW_PERMISSIONS = ['PERM-DOC-REVIEW', 'PERM-APR-REVIEW'] as const;

/** Reader for review work that the current actor can actually decide. */
export class ListDocumentReviewQueueUseCase {
  constructor(private readonly query: DocumentReviewQueueQuery) {}

  execute(input: { actor: ActorContext; limit: number }) {
    if (input.actor.accountState !== 'ACTIVE') throw new AppError('AUTHZ_DENIED');
    const grants = REVIEW_PERMISSIONS.map((code) =>
      input.actor.permissions.find((grant) => grant.code === code && grant.active !== false),
    );
    for (const permission of REVIEW_PERMISSIONS) {
      authorize(
        {
          actor: input.actor,
          permission,
          action: 'REVIEW',
          entity: {
            type: 'DOCUMENT_VERSION',
            id: 'review-queue',
            state: 'IN_REVIEW',
            ownerId: input.actor.id,
          },
          scope: { ownerId: input.actor.id },
          currentVersion: 1n,
          expectedVersion: 1n,
          businessCondition: true,
        },
        { throwOnDeny: true },
      );
    }

    // Document entities have owner/author attributes only. Named scopes cannot
    // be resolved against fields absent from this schema and therefore fail closed.
    const scopeModes = grants.map((grant) => ({
      global: grant!.scopes.includes('GLOBAL'),
      own: grant!.scopes.includes('OWN'),
    }));
    if (scopeModes.some((scope) => !scope.global && !scope.own))
      throw new AppError('AUTHZ_SCOPE_DENIED');

    return this.query.listForReviewer({
      actorId: input.actor.id,
      limit: Math.max(1, Math.min(Number.isFinite(input.limit) ? Math.trunc(input.limit) : 25, 100)),
      global: scopeModes.every((scope) => scope.global),
      own: scopeModes.every((scope) => scope.global || scope.own),
    });
  }
}
