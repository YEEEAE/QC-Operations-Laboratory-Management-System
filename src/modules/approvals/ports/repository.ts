import type { ActorContext } from '../../../shared/authorization/types.js';
import type {
  ApprovalCase,
  ApprovalDecision,
  ApprovalSubjectType,
  ApprovalWorkItem,
  ApprovalDecisionKind,
} from '../domain/approval.js';
import type { SignatureEvidence } from '../../e-signatures/domain/signature-evidence.js';

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
}

export interface ApprovalRepository {
  listActionable(input: { actor: ActorContext }): Promise<readonly ApprovalRecord[]>;
  get(input: { approvalId: string; actor: ActorContext }): Promise<ApprovalRecord | undefined>;
  findDecisionByRequestId(input: {
    approvalCaseId: string;
    workItemId: string;
    requestId: string;
  }): Promise<ApprovalDecision | undefined>;
  recordDecision(
    input: RecordApprovalDecisionInput,
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
