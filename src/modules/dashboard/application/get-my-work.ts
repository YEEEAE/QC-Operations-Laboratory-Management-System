import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { MyWorkQuery, MyWorkReadModel } from '../ports/my-work.js';

export type { MyWorkReadModel } from '../ports/my-work.js';

/**
 * Reads the caller's own work queue.
 *
 * This use case deliberately requires no dashboard permission: the queue is
 * the caller's own work, and each group is authorized by the register that owns
 * it. An account may therefore open the workspace and still be told, per group,
 * that it may not read that register — which is a different fact from "no work"
 * and is reported as such rather than as a zero.
 */
export class GetMyWorkUseCase {
  constructor(private readonly query: MyWorkQuery) {}

  async execute(actor: ActorContext): Promise<MyWorkReadModel> {
    if (actor.accountState !== 'ACTIVE') throw new AppError('AUTHZ_DENIED');
    return this.query.get(actor);
  }
}
