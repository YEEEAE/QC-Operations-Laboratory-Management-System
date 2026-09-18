import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { RejectReportRepository } from '../ports/repository.js';

export class GetRejectDashboardUseCase {
  constructor(
    private readonly repository: RejectReportRepository,
    private readonly now = () => new Date(),
  ) {}
  async execute(input: { actor: ActorContext; from?: Date; to?: Date }) {
    if (input.actor.accountState !== 'ACTIVE') throw new AppError('AUTHZ_DENIED');
    const [summary, analytics, recent] = await Promise.all([
      this.repository.summary(this.now()),
      this.repository.analytics({ from: input.from, to: input.to }),
      this.repository.recent(10),
    ]);
    return { summary, analytics, recent };
  }
}
