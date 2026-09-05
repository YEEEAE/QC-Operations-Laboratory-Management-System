import type { ActorContext } from '../../../shared/authorization/types.js';
import { authorizeChangeRequestView } from './authorization.js';
import type { ChangeRequestListFilter, ChangeRequestRepository } from '../ports/repository.js';

export class ListChangeRequestsUseCase {
  constructor(private readonly repository: ChangeRequestRepository) {}

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
