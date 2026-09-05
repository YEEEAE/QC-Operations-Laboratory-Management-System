import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { assertUserChangeRequestAction, type UserChangeRequestAction } from '../domain/change-request.js';
import { authorizeChangeRequestAction, authorizeChangeRequestView } from './authorization.js';
import type { ChangeRequestRepository } from '../ports/repository.js';

export class TransitionChangeRequestUseCase {
  constructor(private readonly repository: ChangeRequestRepository, private readonly options: { now?: () => Date } = {}) {}

  async execute(input: { actor: ActorContext; id: string; action: UserChangeRequestAction | string; expectedVersion: bigint; reason?: string; requestId: string }) {
    assertUserChangeRequestAction(input.action);
    const aggregate = await this.repository.get({ id: input.id, actor: input.actor });
    if (!aggregate) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    const replay = await this.repository.findTransitionByRequestId({ id: input.id, requestId: input.requestId });
    if (replay) {
      if (replay.action !== input.action || replay.expectedVersion !== input.expectedVersion)
        throw new AppError('CONFLICT_DUPLICATE_COMMAND', { userSafe: true });
      authorizeChangeRequestView(aggregate.changeRequest, input.actor);
      return aggregate;
    }
    authorizeChangeRequestAction(aggregate.changeRequest, input.actor, input.action, input.expectedVersion);
    return this.repository.transition({ ...input, action: input.action, now: this.options.now?.() ?? new Date() });
  }
}
