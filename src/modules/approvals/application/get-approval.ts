import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { authorizeApprovalView } from './authorization.js';
import type { ApprovalRepository } from '../ports/repository.js';

export class GetApprovalUseCase {
  constructor(private readonly repository: ApprovalRepository) {}

  async execute(input: { actor: ActorContext; approvalId: string }) {
    const record = await this.repository.get({ approvalId: input.approvalId, actor: input.actor });
    if (!record) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    try {
      authorizeApprovalView(record, input.actor);
    } catch {
      throw new AppError('AUTHZ_SCOPE_DENIED', { userSafe: true });
    }
    return record;
  }
}
