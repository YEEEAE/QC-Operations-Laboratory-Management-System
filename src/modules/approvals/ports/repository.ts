import type { ActorContext } from '../../../shared/authorization/types.js';
import type {
  ApprovalCase,
  ApprovalDecision,
  ApprovalSubjectType,
  ApprovalWorkItem,
  ApprovalDecisionKind,
} from '../domain/approval.js';
import type { SignatureEvidence } from '../../e-signatures/domain/signature-evidence.js';
import type { DatabaseTransaction } from '../../../shared/database/transaction.js';
import type { OwnerDecisionMetadata } from '../application/owner-approval-policy.js';

export interface ApprovalSubjectContext {
  subjectType: ApprovalSubjectType;
  subjectId: string;
  state: string;
  version: bigint;
  ownerId?: string;
  authorId?: string;
  executorId?: string;
  assigneeId?: string;
  domain?: string;
  snapshotHash?: string;
  reviewContext: Readonly<Record<string, unknown>>;
}

export interface ApprovalRecord {
  approvalCase: ApprovalCase;
  workItem: ApprovalWorkItem;
  subject: ApprovalSubjectContext;
}

export interface RecordApprovalDecisionInput {
  approvalCaseId: string;
  workItemId: string;
  actor: ActorContext;
  decision: ApprovalDecisionKind;
  subjectVersion: bigint;
  reason?: string;
  comments?: string;
  signature?: SignatureEvidence;
  requestId: string;
  now: Date;
  /**
   * Owner-Controlled Internal Approval metadata. Present on both paths: the
   * owner path records the real `SYSTEM_OWNER` authority and the deferred
   * signature marker; the standard path records `STANDARD_WORKFLOW` and never
   * fabricates an authority.
   */
  ownerMetadata?: OwnerDecisionMetadata;
  previousState?: string;
  resultingState?: string;
  /** Audit-safe authorization context (owner path only). */
  authorizationContext?: Record<string, unknown>;
  /** Evidence references the decision relied on (snapshot/digest identifiers). */
  evidenceReferences?: Record<string, unknown>;
}

export interface ApprovalRepository {
  runDecisionTransaction<T>(work: (transaction: DatabaseTransaction) => Promise<T>): Promise<T>;
  createRejectThresholdRequest(input: { subjectId: string; subjectVersion: bigint; requestedBy: string;
    assignedUserId: string; reportId: string; reportNo: string; itemCode?: string; itemDescription: string;
    lot?: string; rate: string; threshold: string; snapshotHash: string }, transaction: DatabaseTransaction): Promise<string>;
  cancelPending(input: { approvalCaseId: string; reportId: string; actor: ActorContext; requestId: string; reason: string },
    transaction: DatabaseTransaction): Promise<void>;
  listActionable(input: {
    actor: ActorContext;
    /**
     * Owner-Controlled Internal Approval: the named owner reviews all actionable
     * records, not only those assigned to them.
     */
    includeAllActionable?: boolean;
  }): Promise<readonly ApprovalRecord[]>;
  get(input: { approvalId: string; actor: ActorContext }): Promise<ApprovalRecord | undefined>;
  findDecisionByRequestId(input: {
    approvalCaseId: string;
    workItemId: string;
    requestId: string;
  }): Promise<ApprovalDecision | undefined>;
  recordDecision(
    input: RecordApprovalDecisionInput,
    transaction?: DatabaseTransaction,
  ): Promise<{ decision: ApprovalDecision; signature?: SignatureEvidence }>;
}

/** Shared port contract used by queue/detail use cases to keep persistence replaceable. */
export const ApprovalRepositoryContract = {
  async listActionable(
    repository: ApprovalRepository,
    input: { actor: ActorContext },
  ): Promise<readonly ApprovalRecord[]> {
    return repository.listActionable(input);
  },
};
