import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { RejectReportRepository } from '../ports/repository.js';

export class GetDailyRejectUseCase {
  constructor(private readonly repository: RejectReportRepository) {}
  async execute(input: { actor: ActorContext; reportId: string }) {
    if (input.actor.accountState !== 'ACTIVE') throw new AppError('AUTHZ_DENIED');
    const record = await this.repository.getDailyReject(input.reportId);
    if (!record) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    return record;
  }
}
