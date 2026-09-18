import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { IssueSlipApprovalRole } from '../domain/issue-slip.js';
import { assertConfirmable, pendingApprovalRoles } from '../domain/issue-slip.js';
import type { RejectReportRepository } from '../ports/repository.js';

/**
 * Records that the report creator obtained a real-world approval. This is a
 * creator attestation, never an electronic signature by the approver role.
 * Only the report creator may record it (businessCondition owner check).
 */
export class ConfirmIssueSlipApprovalUseCase {
  constructor(private readonly repository: RejectReportRepository) {}
  async execute(input: {
    actor: ActorContext;
    reportId: string;
    expectedVersion: bigint;
    role: IssueSlipApprovalRole;
    approverName?: string;
    note?: string;
    evidenceFileId?: string;
    requestId: string;
  }) {
    const slip = await this.repository.getIssueSlip(input.reportId);
    if (!slip) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    assertConfirmable(slip);
    if (!pendingApprovalRoles(slip.approvals).includes(input.role))
      throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-RREJ-CONFIRM-APPROVAL',
        action: 'CONFIRM',
        entity: {
          type: 'ISSUE_SLIP_APPROVAL',
          id: `${slip.id}:${input.role}`,
          state: 'PENDING',
          ownerId: slip.createdBy,
        },
        scope: { ownerId: slip.createdBy },
        currentVersion: slip.version,
        expectedVersion: input.expectedVersion,
        businessCondition: slip.createdBy === input.actor.id,
      },
      { throwOnDeny: true },
    );
    return this.repository.confirmApproval({
      id: slip.id,
      expectedVersion: input.expectedVersion,
      actor: input.actor,
      requestId: input.requestId,
      role: input.role,
      approverName: input.approverName,
      note: input.note,
      evidenceFileId: input.evidenceFileId,
    });
  }
}
