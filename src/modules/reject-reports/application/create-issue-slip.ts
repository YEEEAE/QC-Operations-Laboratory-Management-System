import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { IssueSlipFields } from '../domain/issue-slip.js';
import { validateIssueSlipFields } from '../domain/issue-slip.js';
import type { RejectReportRepository } from '../ports/repository.js';

export class CreateIssueSlipUseCase {
  constructor(private readonly repository: RejectReportRepository) {}
  execute(input: {
    actor: ActorContext;
    reportDate: Date;
    department: string;
    shift?: string;
    fields: IssueSlipFields;
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
    return this.repository.createIssueSlip({
      actor: input.actor,
      requestId: input.requestId,
      reportDate: input.reportDate,
      department: input.department,
      shift: input.shift,
      fields: validateIssueSlipFields(input.fields),
    });
  }
}
