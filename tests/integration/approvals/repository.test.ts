import { describe, expect, it } from 'vitest';
import {
  ApprovalRepositoryContract,
  type ApprovalRepository,
} from '../../../src/modules/approvals/ports/repository.js';
import type { ApprovalDecision } from '../../../src/modules/approvals/domain/approval.js';
import {
  createApprovalCase,
  createApprovalWorkItem,
} from '../../../src/modules/approvals/domain/approval.js';

const authorId = '01900000-0000-7000-8000-000000000001';
const approverId = '01900000-0000-7000-8000-000000000002';
const subjectId = '01900000-0000-7000-8000-000000000003';
const caseId = '01900000-0000-7000-8000-000000000004';
const workItemId = '01900000-0000-7000-8000-000000000005';

function actor(id = approverId) {
  return {
    id,
    accountState: 'ACTIVE' as const,
    roles: ['MANAGER'],
    permissions: [
      { code: 'PERM-APR-VIEW-ASSIGNED' as const, scopes: ['ASSIGNED' as const] },
      { code: 'PERM-APR-APPROVE' as const, scopes: ['ASSIGNED' as const] },
      { code: 'PERM-DOC-APPROVE' as const, scopes: ['GLOBAL' as const] },
    ],
  };
}

function repository(): ApprovalRepository {
  const approvalCase = createApprovalCase({
    id: caseId,
    subjectType: 'DOCUMENT_VERSION',
    subjectId,
    subjectVersion: 4n,
    workflowType: 'DOCUMENT_APPROVAL',
    requestedBy: authorId,
    requestedAt: new Date('2026-01-01T00:00:00Z'),
    now: new Date('2026-01-01T00:00:00Z'),
  });
  const workItem = createApprovalWorkItem({
    id: workItemId,
    approvalCaseId: caseId,
    stepNo: 1,
    workType: 'APPROVAL',
    assignedUserId: approverId,
    now: new Date('2026-01-01T00:00:00Z'),
  });
  let decision: ApprovalDecision | undefined;
  const subject = {
    subjectType: 'DOCUMENT_VERSION' as const,
    subjectId,
    state: 'IN_REVIEW',
    version: 4n,
    authorId,
    snapshotHash: 'snapshot-4',
    reviewContext: { revision: '4' },
  };
  return {
    async listActionable(input) {
      return input.actor.id === approverId ? [{ approvalCase, workItem, subject }] : [];
    },
    async get() {
      return { approvalCase, workItem, subject };
    },
    async findDecisionByRequestId() {
      return decision;
    },
    async recordDecision(input) {
      decision = {
        id: '01900000-0000-7000-8000-000000000006',
        approvalCaseId: input.approvalCaseId,
        workItemId: input.workItemId,
        actorId: input.actor.id,
        decision: input.decision,
        subjectVersion: input.subjectVersion,
        reason: input.reason,
        comments: input.comments,
        signatureId: input.signature?.id,
        decidedAt: input.now,
        requestId: input.requestId,
      };
      return { decision, signature: input.signature };
    },
  };
}

describe('approval repository contract', () => {
  it('exposes only assigned, version-bound subject context and preserves history on decision', async () => {
    const result = await ApprovalRepositoryContract.listActionable(repository(), {
      actor: actor(),
    });
    expect(result).toHaveLength(1);
    expect(result[0].subject.version).toBe(4n);
    expect(result[0].approvalCase.subjectVersion).toBe(4n);
  });

  it('does not expose a cross-scope work item', async () => {
    const result = await ApprovalRepositoryContract.listActionable(repository(), {
      actor: actor('01900000-0000-7000-8000-000000000099'),
    });
    expect(result).toEqual([]);
  });
});
