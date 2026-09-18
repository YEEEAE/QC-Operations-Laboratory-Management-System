import { AppError } from '../../../shared/errors/app-error.js';
import { isNamedSystemOwner } from '../../../shared/authorization/p05-authority.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { IssueSlipApprovalRole } from '../domain/issue-slip.js';
import { assertReason } from '../domain/reject-report.js';
import type { RejectReportRepository } from '../ports/repository.js';

/**
 * Controlled correction path for a wrongly recorded confirmation. The
 * confirmation row is never silently unchecked: it moves to REVERSED with
 * actor, timestamp, and mandatory reason, and the report returns to
 * APPROVAL_TRACKING (re-confirmation starts a fresh cycle from PENDING).
 *
 * Normal path: the report creator with PERM-RREJ-CONFIRM-APPROVAL.
 * Recovery path: the named system owner (yazeed) with PERM-RREJ-ADMIN-CORRECT.
 * The recovery action records who reversed; it never forges approval identity.
 */
export class ReverseIssueSlipApprovalUseCase {
  constructor(private readonly repository: RejectReportRepository) {}
  async execute(input: {
    actor: ActorContext;
    reportId: string;
    expectedVersion: bigint;
    role: IssueSlipApprovalRole;
    reason: string;
    requestId: string;
  }) {
    const slip = await this.repository.getIssueSlip(input.reportId);
    if (!slip) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    assertReason(input.reason);
    const confirmation = slip.approvals.find((a) => a.role === input.role);
    if (!confirmation || confirmation.status !== 'CONFIRMED')
      throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
    if (slip.status !== 'APPROVAL_TRACKING' && slip.status !== 'COMPLETED')
      throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });

    const isCreatorRecovery = slip.createdBy === input.actor.id;
    if (!isCreatorRecovery && !isNamedSystemOwner(input.actor))
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    const required = isCreatorRecovery ? 'PERM-RREJ-CONFIRM-APPROVAL' : 'PERM-RREJ-ADMIN-CORRECT';
    const grant = input.actor.permissions.find((p) => p.code === required && p.active !== false);
    if (!grant) throw new AppError('AUTHZ_PERMISSION_MISSING', { userSafe: true });
    if (input.expectedVersion !== slip.version)
      throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });

    return this.repository.reverseApproval({
      id: slip.id,
      expectedVersion: input.expectedVersion,
      actor: input.actor,
      requestId: input.requestId,
      role: input.role,
      reason: input.reason.trim(),
    });
  }
}
