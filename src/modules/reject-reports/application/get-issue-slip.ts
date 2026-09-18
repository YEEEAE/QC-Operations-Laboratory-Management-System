import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { RejectReportRepository } from '../ports/repository.js';

export class GetIssueSlipUseCase {
  constructor(private readonly repository: RejectReportRepository) {}
  async execute(input: { actor: ActorContext; reportId: string }) {
    if (input.actor.accountState !== 'ACTIVE') throw new AppError('AUTHZ_DENIED');
    const slip = await this.repository.getIssueSlip(input.reportId);
    if (!slip) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    return slip;
  }
}
