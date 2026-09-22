import { authorize } from '../../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { ReceivingRepository } from '../ports/repository.js';
import type { ReceivingListFilters } from './receiving-filters.js';

/** The single definition of "today" for the receiving register. */
export function utcDateOnly(moment: Date): string {
  return moment.toISOString().slice(0, 10);
}

/**
 * The receiving register read.
 *
 * The use case authorizes once and forwards the canonical filter set to the
 * owning repository; it never filters in memory, so a counter, a drill-down and
 * this register always share one predicate. `receivedOn=today` is resolved here,
 * once, from the UTC server date.
 */
export class ListReceivingUseCase {
  constructor(
    private readonly repo: ReceivingRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}
  execute(i: ReceivingListFilters & { actor: ActorContext }) {
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
      inspectionStatus: i.inspectionStatus,
      quarantine: i.quarantine,
      releaseState: i.releaseState,
      ownership: i.ownership,
      receivingDate: i.receivedOn === 'today' ? utcDateOnly(this.now()) : undefined,
      receivedFrom: i.receivedFrom,
      receivedTo: i.receivedTo,
      expiryFrom: i.expiryFrom,
      expiryTo: i.expiryTo,
      search: i.q,
      itemCode: i.itemCode,
      lot: i.lot,
      supplier: i.supplier,
      purchaseOrderNo: i.purchaseOrderNo,
    });
  }
}
