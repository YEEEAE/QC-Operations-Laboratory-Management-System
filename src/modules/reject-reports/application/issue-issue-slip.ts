import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { assertDraftEditable } from '../domain/issue-slip.js';
import type { RejectReportRepository } from '../ports/repository.js';

/** DRAFT → ISSUED → APPROVAL_TRACKING happens atomically in the repository. */
export class IssueIssueSlipUseCase {
  constructor(private readonly repository: RejectReportRepository) {}
  async execute(input: {
    actor: ActorContext;
    reportId: string;
    expectedVersion: bigint;
    requestId: string;
  }) {
    const slip = await this.repository.getIssueSlip(input.reportId);
    if (!slip) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    assertDraftEditable(slip.status);
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-RREJ-EDIT',
        action: 'ISSUE',
        entity: {
          type: 'REJECT_REPORT',
          id: slip.id,
          state: slip.status,
          ownerId: slip.createdBy,
        },
        scope: { ownerId: slip.createdBy },
        currentVersion: slip.version,
        expectedVersion: input.expectedVersion,
        businessCondition: slip.createdBy === input.actor.id,
      },
      { throwOnDeny: true },
    );
    return this.repository.issueIssueSlip({
      id: slip.id,
      expectedVersion: input.expectedVersion,
      actor: input.actor,
      requestId: input.requestId,
    });
  }
}
