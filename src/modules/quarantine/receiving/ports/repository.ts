import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { ReceivingAction } from '../domain/receiving-state.js';
import type { ReceivingItem } from '../domain/receiving-item.js';
import type {
  ReceivingInspectionStatus,
  ReceivingQuarantineStatus,
  ReceivingReleaseStatus,
} from '../domain/receiving-status.js';

/**
 * The canonical register query. Every field is applied in SQL; a field that is
 * absent is simply not filtered. `state`, `inspectionResult` and `releaseState`
 * keep their exact historical meaning, while `inspectionStatus` and `quarantine`
 * are projections of the same approved facts (`receiving-status.ts`).
 */
export interface ReceivingListQuery {
  actor: ActorContext;
  state?: ReceivingItem['workflowState'];
  /** Canonical inspection-result filter (NOT_STARTED | PASS | FAIL | HOLD). */
  inspectionResult?: ReceivingItem['inspectionResult'];
  /** Derived inspection reporting status (NOT_STARTED | IN_PROGRESS | COMPLETED | RETURNED). */
  inspectionStatus?: ReceivingInspectionStatus;
  /** Derived quarantine decision status (PENDING_INSPECTION … REJECTED). */
  quarantine?: ReceivingQuarantineStatus;
  /** Derived release status. */
  releaseState?: ReceivingReleaseStatus;
  /** Ownership filter: 'mine' restricts to records the actor created. */
  ownership?: 'mine';
  /**
   * Exact receiving-date filter as `YYYY-MM-DD`. The comparison happens in
   * PostgreSQL against the `date` column, so the register can never disagree
   * with a same-predicate counter over a client time-zone boundary.
   */
  receivingDate?: string;
  /** Inclusive receiving-date window. */
  receivedFrom?: string;
  receivedTo?: string;
  /** Inclusive expiry window. */
  expiryFrom?: string;
  expiryTo?: string;
  /** Free-text search across receiving number, document, item, lot, supplier, PO. */
  search?: string;
  itemCode?: string;
  lot?: string;
  supplier?: string;
  purchaseOrderNo?: string;
}

export interface ReceivingRepository {
  create(i: {
    item: ReceivingItem;
    actor: ActorContext;
    requestId: string;
  }): Promise<ReceivingItem>;
  get(id: string, actor: ActorContext): Promise<ReceivingItem | undefined>;
  list(i: ReceivingListQuery): Promise<readonly ReceivingItem[]>;
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
    quantityUnit: string;
    purchaseOrderNo?: string;
    receivingDate: Date;
    expiryDate?: Date;
    requestId: string;
  }): Promise<ReceivingItem>;
  /**
   * Controlled correction of an already recorded receiving fact: same
   * validation as creation, plus a mandatory reason and an audit record that
   * carries the previous values.
   */
  correct(i: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    reason: string;
    supplier: string;
    docNo: string;
    itemCode: string;
    description: string;
    lot: string;
    qty: string;
    quantityUnit: string;
    purchaseOrderNo?: string;
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
