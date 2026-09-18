import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { ReceivingAction } from '../domain/receiving-state.js';
import type { ReceivingItem } from '../domain/receiving-item.js';
export interface ReceivingRepository {
  create(i: {
    item: ReceivingItem;
    actor: ActorContext;
    requestId: string;
  }): Promise<ReceivingItem>;
  get(id: string, actor: ActorContext): Promise<ReceivingItem | undefined>;
  list(i: {
    actor: ActorContext;
    state?: ReceivingItem['workflowState'];
    /** Canonical inspection-result filter (NOT_STARTED | PASS | FAIL | HOLD). */
    inspectionResult?: ReceivingItem['inspectionResult'];
    /** Canonical release-system filter: RELEASED or NOT_RELEASED. */
    releaseState?: 'RELEASED' | 'NOT_RELEASED';
    /** Ownership filter: 'mine' restricts to records the actor created. */
    ownership?: 'mine';
    /**
     * Exact receiving-date filter as `YYYY-MM-DD`. The comparison happens in
     * PostgreSQL against the `date` column, so the register can never disagree
     * with a same-predicate counter over a client time-zone boundary.
     */
    receivingDate?: string;
  }): Promise<readonly ReceivingItem[]>;
  updateDraft(i: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    supplier: string;
    docNo: string;
    itemCode: string;
    description: string;
    lot: string;
    qty: string;
    receivingDate: Date;
    expiryDate?: Date;
    requestId: string;
  }): Promise<ReceivingItem>;
  /** Returns a committed release replay before state validation. */
  resolveReplay?(i: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    requestId: string;
  }): Promise<ReceivingItem | undefined>;
  transition(i: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    action: ReceivingAction;
    reason?: string;
    requestId: string;
  }): Promise<ReceivingItem>;
}
