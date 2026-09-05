import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { authorizeChangeRequestView } from './authorization.js';
import type { ChangeRequestRepository } from '../ports/repository.js';

export class GetChangeRequestUseCase {
  constructor(private readonly repository: ChangeRequestRepository) {}

  async execute(input: { actor: ActorContext; id: string }) {
    const aggregate = await this.repository.get(input);
    if (!aggregate) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    authorizeChangeRequestView(aggregate.changeRequest, input.actor);
    return aggregate;
  }
}
