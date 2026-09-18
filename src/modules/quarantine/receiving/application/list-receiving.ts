import { authorize } from '../../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { ReceivingRepository } from '../ports/repository.js';
import type { ReceivingItem } from '../domain/receiving-item.js';

/** The single definition of "today" for the receiving register. */
export function utcDateOnly(moment: Date): string {
  return moment.toISOString().slice(0, 10);
}

export class ListReceivingUseCase {
  constructor(
    private readonly repo: ReceivingRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}
  execute(i: {
    actor: ActorContext;
    state?: ReceivingItem['workflowState'];
    inspectionResult?: ReceivingItem['inspectionResult'];
    releaseState?: 'RELEASED' | 'NOT_RELEASED';
    ownership?: 'mine';
    /**
     * Time-window filter. `today` is resolved here, once, against the current
     * UTC server date, and turns into an exact `receiving_date` comparison in
     * the register query — the same predicate a counter linking to this
     * register must use.
     */
    receivedOn?: 'today';
  }) {
    authorize(
      {
        actor: i.actor,
        permission: 'PERM-QUAR-VIEW',
        action: 'VIEW',
        entity: {
          type: 'RECEIVING_ITEM',
          id: 'list',
          state: i.state ?? 'PENDING',
          ownerId: i.actor.id,
        },
        scope: { ownerId: i.actor.id },
        currentVersion: 1,
        expectedVersion: 1,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    return this.repo.list({
      actor: i.actor,
      state: i.state,
      inspectionResult: i.inspectionResult,
      releaseState: i.releaseState,
      ownership: i.ownership,
      receivingDate: i.receivedOn === 'today' ? utcDateOnly(this.now()) : undefined,
    });
  }
}
