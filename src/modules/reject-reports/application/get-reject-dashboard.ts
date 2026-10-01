import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { RejectReportListFilter, RejectReportRepository } from '../ports/repository.js';

export class GetRejectDashboardUseCase {
  constructor(
    private readonly repository: RejectReportRepository,
    private readonly now = () => new Date(),
  ) {}
  async execute(input: { actor: ActorContext; filter?: RejectReportListFilter }) {
    if (input.actor.accountState !== 'ACTIVE') throw new AppError('AUTHZ_DENIED');
    const [summary, analytics, recent] = await Promise.all([
      this.repository.summary(this.now(), input.filter),
      this.repository.analytics({ filter: input.filter }),
      this.repository.recent(10, input.filter),
    ]);
    return { summary, analytics, recent };
  }
}
