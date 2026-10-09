import type { ActorContext } from '../../../shared/authorization/types.js';
import { parsePageInput } from '../../../shared/pagination/page.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { authorizeChangeRequestView } from './authorization.js';
import type { ChangeRequestListFilter, ChangeRequestRepository } from '../ports/repository.js';

export class ListChangeRequestsUseCase {
  constructor(private readonly repository: ChangeRequestRepository) {}
  executePage(input: { actor: ActorContext; filter?: ChangeRequestListFilter; page?: import('../../../shared/pagination/page.js').PageInput }) {
    if (!this.repository.listPage) throw new AppError('SYSTEM_DATABASE_UNAVAILABLE', { userSafe: true });
    return this.repository.listPage({ ...input, page: parsePageInput(input.page) });
  }

  async execute(input: { actor: ActorContext; filter?: ChangeRequestListFilter }) {
    const aggregates = await this.repository.list(input);
    return aggregates.filter((aggregate) => {
      try {
        authorizeChangeRequestView(aggregate.changeRequest, input.actor);
        return true;
      } catch {
        return false;
      }
    });
  }
}
