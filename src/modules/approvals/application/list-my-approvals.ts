import type { ActorContext } from '../../../shared/authorization/types.js';
import { authorizeApprovalView } from './authorization.js';
import { isOwnerApprovalPath } from './owner-approval-policy.js';
import type { ApprovalRecord, ApprovalRepository } from '../ports/repository.js';
import {
  approvalWithCapabilities,
  type ApprovalCapabilityResolver,
  type ApprovalDecisionCapability,
} from './decision-capabilities.js';

export type ApprovalQueueRecord = ApprovalRecord & {
  decisionCapabilities: readonly ApprovalDecisionCapability[];
};

export class ListMyApprovalsUseCase {
  constructor(
    private readonly repository: ApprovalRepository,
    private readonly capabilities?: ApprovalCapabilityResolver,
  ) {}

  async execute(input: { actor: ActorContext }): Promise<readonly ApprovalQueueRecord[]> {
    // Owner-Controlled Internal Approval: the named owner reviews every
    // actionable record and is not restricted to records assigned to them.
    const records = await this.repository.listActionable({
      actor: input.actor,
      includeAllActionable: isOwnerApprovalPath(input.actor),
    });
    const visible: ApprovalQueueRecord[] = [];
    const capabilityResolver = this.capabilities ?? { execute: () => [] };
    for (const record of records) {
      try {
        authorizeApprovalView(record, input.actor);
        visible.push(approvalWithCapabilities(record, capabilityResolver, input.actor));
      } catch {
        /* inaccessible items remain excluded from the assigned approval queue */
      }
    }
    return visible;
  }
}
