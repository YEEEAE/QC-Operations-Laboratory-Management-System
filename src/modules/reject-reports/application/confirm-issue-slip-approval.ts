import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { IssueSlipApprovalRole } from '../domain/issue-slip.js';
import { assertApprovalRoleIsNext, assertConfirmable } from '../domain/issue-slip.js';
import type { RejectReportRepository } from '../ports/repository.js';

/**
 * Records that the report creator obtained a real-world approval. This is a
 * creator attestation, never an electronic signature by the approver role.
 * Only the report creator may record it (businessCondition owner check).
 *
 * QC-100-FINAL-004 Task 3: checkpoints are sequential, so the creator may only
 * record the next pending checkpoint (`SUPERVISOR → QC_MANAGER →
 * FACTORY_DIRECTOR`). An out-of-order confirmation is denied regardless of the
 * actor's role, so an EMPLOYEE creator can never jump a checkpoint above the
 * one the slip is currently at.
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
    assertApprovalRoleIsNext(slip.approvals, input.role);
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
