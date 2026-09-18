import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { Page } from '../../../shared/pagination/page.js';
import type { RejectReportListFilter, RejectReportRepository } from '../ports/repository.js';

export class ListDailyRejectsUseCase {
  constructor(private readonly repository: RejectReportRepository) {}
  execute(input: { actor: ActorContext; filter?: RejectReportListFilter; page: Page }) {
    if (input.actor.accountState !== 'ACTIVE') throw new AppError('AUTHZ_DENIED');
    return this.repository.listDailyRejects({ filter: input.filter ?? {}, page: input.page });
  }
}
