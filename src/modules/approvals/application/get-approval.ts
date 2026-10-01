import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { authorizeApprovalView } from './authorization.js';
import type { ApprovalRecord, ApprovalRepository } from '../ports/repository.js';
import {
  approvalWithCapabilities,
  type ApprovalCapabilityResolver,
  type ApprovalDecisionCapability,
} from './decision-capabilities.js';

export type ApprovalRecordWithCapabilities = ApprovalRecord & {
  decisionCapabilities: readonly ApprovalDecisionCapability[];
};

export class GetApprovalUseCase {
  constructor(
    private readonly repository: ApprovalRepository,
    private readonly capabilities?: ApprovalCapabilityResolver,
  ) {}

  async execute(input: {
    actor: ActorContext;
    approvalId: string;
  }): Promise<ApprovalRecordWithCapabilities> {
    const record = await this.repository.get({ approvalId: input.approvalId, actor: input.actor });
    if (!record) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    try {
      authorizeApprovalView(record, input.actor);
    } catch {
      throw new AppError('AUTHZ_SCOPE_DENIED', { userSafe: true });
    }
    const capabilityResolver = this.capabilities ?? {
      execute: () => [],
    };
    return approvalWithCapabilities(record, capabilityResolver, input.actor);
  }
}
