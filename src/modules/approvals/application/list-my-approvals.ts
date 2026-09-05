import type { ActorContext } from '../../../shared/authorization/types.js';
import { authorizeApprovalDecision, authorizeApprovalView } from './authorization.js';
import type { ApprovalRecord, ApprovalRepository } from '../ports/repository.js';

export class ListMyApprovalsUseCase {
  constructor(private readonly repository: ApprovalRepository) {}

  async execute(input: { actor: ActorContext }): Promise<readonly ApprovalRecord[]> {
    const records = await this.repository.listActionable(input);
    const actionable: ApprovalRecord[] = [];
    for (const record of records) {
      try {
        authorizeApprovalView(record, input.actor);
        authorizeApprovalDecision(record, input.actor, 'APPROVE', record.subject.version);
        actionable.push(record);
      } catch {
        /* inaccessible, stale, wrong-state, or policy-dependent items stay out of My Approvals */
      }
    }
    return actionable;
  }
}
