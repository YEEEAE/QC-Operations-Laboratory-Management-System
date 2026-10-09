import type { ActorContext } from '../../../shared/authorization/types.js';
import type {
  ChangeRequest,
  ChangeRequestAction,
  ChangeRequestApplicationAttempt,
  ChangeRequestChange,
} from '../domain/change-request.js';
import type { AuditEventView } from '../../../shared/audit/audit-query.js';
import type { DatabaseTransaction } from '../../../shared/database/transaction.js';

export interface ChangeRequestAggregate {
  changeRequest: ChangeRequest;
  changes: readonly ChangeRequestChange[];
  history: readonly AuditEventView[];
  applicationAttempts: readonly ChangeRequestApplicationAttempt[];
}

export interface ChangeRequestListFilter {
  state?: ChangeRequest['state'];
  targetType?: string;
  requestedBy?: string;
}

export interface ChangeRequestRepository {
  listPage?(input: { actor: ActorContext; filter?: ChangeRequestListFilter; page: import('../../../shared/pagination/page.js').Page }): Promise<import('../../../shared/pagination/page.js').PageResult<ChangeRequestAggregate>>;
  applyApproved?(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    requestId: string;
    now: Date;
    apply: (aggregate: ChangeRequestAggregate, transaction: DatabaseTransaction) => Promise<bigint>;
  }): Promise<ChangeRequestAggregate>;
  create(input: {
    aggregate: ChangeRequestAggregate;
    actor: ActorContext;
    requestId: string;
  }): Promise<ChangeRequestAggregate>;
  createForDocumentVersion(input: {
    aggregate: ChangeRequestAggregate;
    actor: ActorContext;
    requestId: string;
    documentVersionId: string;
    expectedDocumentVersion: bigint;
  }): Promise<ChangeRequestAggregate>;
  get(input: { id: string; actor: ActorContext }): Promise<ChangeRequestAggregate | undefined>;
  list(input: {
    actor: ActorContext;
    filter?: ChangeRequestListFilter;
  }): Promise<readonly ChangeRequestAggregate[]>;
  findTransitionByRequestId(input: {
    id: string;
    requestId: string;
  }): Promise<{ action: ChangeRequestAction; expectedVersion: bigint } | undefined>;
  updateDraft(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    reason: string;
    requestId: string;
    now: Date;
  }): Promise<ChangeRequestAggregate>;
  transition(input: {
    id: string;
    expectedVersion: bigint;
    action: ChangeRequestAction;
    reason?: string;
    actor: ActorContext;
    requestId: string;
    now: Date;
    transaction?: DatabaseTransaction;
  }): Promise<ChangeRequestAggregate>;
  recordApplicationAttempt(input: {
    actor?: ActorContext;
    expectedVersion?: bigint;
    attempt: ChangeRequestApplicationAttempt;
    actorId: string;
    requestId: string;
  }): Promise<ChangeRequestAggregate>;
}
