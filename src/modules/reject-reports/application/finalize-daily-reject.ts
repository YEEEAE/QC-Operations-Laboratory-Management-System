import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { assertFinalizable } from '../domain/daily-reject.js';
import { assertDraftEditable } from '../domain/issue-slip.js';
import type { RejectReportRepository } from '../ports/repository.js';

export class FinalizeDailyRejectUseCase {
  constructor(private readonly repository: RejectReportRepository) {}
  async execute(input: {
    actor: ActorContext;
    reportId: string;
    expectedVersion: bigint;
    requestId: string;
  }) {
    const record = await this.repository.getDailyReject(input.reportId);
    if (!record) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    assertDraftEditable(record.status);
    assertFinalizable(record.entries);
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-RREJ-FINALIZE',
        action: 'FINALIZE',
        entity: {
          type: 'REJECT_REPORT',
          id: record.id,
          state: record.status,
          ownerId: record.createdBy,
        },
        scope: { ownerId: record.createdBy },
        currentVersion: record.version,
        expectedVersion: input.expectedVersion,
        businessCondition: record.createdBy === input.actor.id,
      },
      { throwOnDeny: true },
    );
    return this.repository.finalizeDailyReject({
      id: record.id,
      expectedVersion: input.expectedVersion,
      actor: input.actor,
      requestId: input.requestId,
    });
  }
}
