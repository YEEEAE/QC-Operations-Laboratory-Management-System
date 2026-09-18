import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { DailyRejectEntryInput } from '../domain/daily-reject.js';
import { validateDailyRejectEntry } from '../domain/daily-reject.js';
import type { RejectReportRepository } from '../ports/repository.js';

export class CreateDailyRejectUseCase {
  constructor(private readonly repository: RejectReportRepository) {}
  execute(input: {
    actor: ActorContext;
    reportDate: Date;
    department: string;
    shift?: string;
    entries: readonly DailyRejectEntryInput[];
    requestId: string;
  }) {
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-RREJ-CREATE',
        action: 'CREATE',
        entity: {
          type: 'REJECT_REPORT',
          id: 'new',
          state: 'DRAFT',
          ownerId: input.actor.id,
        },
        scope: { ownerId: input.actor.id },
        currentVersion: 1n,
        expectedVersion: 1n,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    return this.repository.createDailyReject({
      actor: input.actor,
      requestId: input.requestId,
      reportDate: input.reportDate,
      department: input.department,
      shift: input.shift,
      entries: input.entries.map(validateDailyRejectEntry),
    });
  }
}
