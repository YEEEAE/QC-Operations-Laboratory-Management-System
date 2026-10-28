import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { IssueSlipApprovalRole } from '../domain/issue-slip.js';
import { assertApprovalRoleIsNext, assertConfirmable } from '../domain/issue-slip.js';
import type { RejectReportRepository } from '../ports/repository.js';

/**
 * Records an external approval as a reported fact. It is not an internal
 * approval decision or an electronic signature. The original submitter or a
 * scoped QC Compliance data-entry actor may enter the fact; the approver is
 * recorded separately and is never inferred from the recorder.
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
    approverIdentity?: string;
    outcome: 'APPROVED' | 'REJECTED' | 'UNKNOWN';
    evidenceConfidence: 'UNASSESSED' | 'LOW' | 'MEDIUM' | 'HIGH';
    note?: string;
    evidenceFileId?: string;
    requestId: string;
  }) {
    const slip = await this.repository.getIssueSlip(input.reportId);
    if (!slip) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    assertConfirmable(slip);
    assertApprovalRoleIsNext(slip.approvals, input.role);
    const isSubmitter = slip.createdBy === input.actor.id;
    const isQcComplianceRecorder = input.actor.roles.includes('QC_COMPLIANCE');
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
        businessCondition: isSubmitter || isQcComplianceRecorder,
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
      approverIdentity: input.approverIdentity,
      outcome: input.outcome,
      evidenceConfidence: input.evidenceConfidence,
      note: input.note,
      evidenceFileId: input.evidenceFileId,
    });
  }
}
