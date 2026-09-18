import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { assertNotVoided } from '../domain/issue-slip.js';
import { assertReason } from '../domain/reject-report.js';
import type { RejectReportRepository } from '../ports/repository.js';

/**
 * Non-destructive void: a COMPLETED Issue Slip is controlled and can never be
 * voided; all other non-VOID states may be voided by the creator with a
 * mandatory reason, keeping full history.
 */
export class VoidRejectReportUseCase {
  constructor(private readonly repository: RejectReportRepository) {}
  async execute(input: {
    actor: ActorContext;
    reportId: string;
    expectedVersion: bigint;
    reason: string;
    requestId: string;
  }) {
    const slip = await this.repository.getIssueSlip(input.reportId);
    const daily = slip ? undefined : await this.repository.getDailyReject(input.reportId);
    const report = slip ?? daily;
    if (!report) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    assertNotVoided(report.status);
    assertReason(input.reason);
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-RREJ-VOID',
        action: 'VOID',
        entity: {
          type: 'REJECT_REPORT',
          id: report.id,
          state: report.status,
          ownerId: report.createdBy,
        },
        scope: { ownerId: report.createdBy },
        currentVersion: report.version,
        expectedVersion: input.expectedVersion,
        businessCondition: report.createdBy === input.actor.id && report.status !== 'COMPLETED',
      },
      { throwOnDeny: true },
    );
    return this.repository.voidReport({
      id: report.id,
      expectedVersion: input.expectedVersion,
      actor: input.actor,
      requestId: input.requestId,
      reason: input.reason.trim(),
    });
  }
}
