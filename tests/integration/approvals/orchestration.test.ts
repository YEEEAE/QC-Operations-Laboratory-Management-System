import { describe, expect, it, vi } from 'vitest';
import { DecideApprovalUseCase } from '../../../src/modules/approvals/application/decide-approval.js';
import { ListMyApprovalsUseCase } from '../../../src/modules/approvals/application/list-my-approvals.js';
import type { ApprovalRepository } from '../../../src/modules/approvals/ports/repository.js';
import { AppError } from '../../../src/shared/errors/app-error.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import type { PermissionCode } from '../../../src/shared/authorization/permissions.js';
import type { ApprovalRecord } from '../../../src/modules/approvals/ports/repository.js';
import type { ApprovalDecision } from '../../../src/modules/approvals/domain/approval.js';
import type { SignatureEvidence } from '../../../src/modules/e-signatures/domain/signature-evidence.js';
import type { SignControlledActionUseCase } from '../../../src/modules/e-signatures/application/sign-controlled-action.js';

const authorId = '01900000-0000-7000-8000-000000000011';
const approverId = '01900000-0000-7000-8000-000000000012';
const otherId = '01900000-0000-7000-8000-000000000013';
const approvalId = '01900000-0000-7000-8000-000000000014';
const workItemId = '01900000-0000-7000-8000-000000000015';
const subjectId = '01900000-0000-7000-8000-000000000016';

const makeActor = (
  id: string,
  permissions: PermissionCode[] = [
    'PERM-APR-VIEW-ASSIGNED',
    'PERM-APR-VIEW-HISTORY',
    'PERM-APR-APPROVE',
    'PERM-DOC-APPROVE',
    'PERM-ESIG-SIGN',
  ],
): ActorContext => ({
  id,
  accountState: 'ACTIVE' as const,
  roles: ['MANAGER'],
  permissions: permissions.map((code) => ({ code, scopes: ['ASSIGNED', 'GLOBAL'] as const })),
});

function fixture(overrides: Partial<ApprovalRecord['subject']> = {}): ApprovalRecord {
  return {
    approvalCase: {
      id: approvalId,
      subjectType: 'DOCUMENT_VERSION' as const,
      subjectId,
      subjectVersion: 7n,
      workflowType: 'DOCUMENT_APPROVAL',
      state: 'IN_PROGRESS' as const,
      requestedBy: authorId,
      requestedAt: new Date(),
      createdAt: new Date(),
      version: 1n,
    },
    workItem: {
      id: workItemId,
      approvalCaseId: approvalId,
      stepNo: 1,
      workType: 'APPROVAL' as const,
      assignedUserId: approverId,
      assignedRoleRequirement: undefined,
      state: 'PENDING' as const,
      assignedAt: new Date(),
      version: 1n,
    },
    subject: {
      subjectType: 'DOCUMENT_VERSION' as const,
      subjectId,
      state: 'IN_REVIEW',
      version: 7n,
      authorId,
      snapshotHash: 'snapshot-7',
      reviewContext: { revision: '7', title: 'Controlled record' },
      ...overrides,
    },
  };
}

function repository(initial: ApprovalRecord = fixture()): ApprovalRepository {
  let current = initial;
  let storedDecision: ApprovalDecision | undefined;
  return {
    async listActionable() {
      return current.workItem.assignedUserId === approverId ? [current] : [];
    },
    async get() {
      return current;
    },
    async findDecisionByRequestId(input) {
      return storedDecision?.requestId === input.requestId ? storedDecision : undefined;
    },
    async recordDecision(input) {
      if (storedDecision?.requestId === input.requestId)
        return { decision: storedDecision, signature: input.signature };
      storedDecision = {
        id: '01900000-0000-7000-8000-000000000017',
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
      current = {
        ...current,
        workItem: {
          ...current.workItem,
          state: input.decision === 'RETURN' ? 'RETURNED' : 'COMPLETED',
        },
        approvalCase: {
          ...current.approvalCase,
          state: input.decision === 'RETURN' ? 'RETURNED' : 'COMPLETED',
        },
      };
      return { decision: storedDecision, signature: input.signature };
    },
  };
}

const notRequired = {
  requirement: () => ({
    status: 'NOT_REQUIRED' as const,
    meaning: 'Approve the controlled document version.',
  }),
};
const required = {
  requirement: () => ({
    status: 'REQUIRED' as const,
    meaning: 'Approve the controlled document version.',
  }),
};
const signer: Pick<SignControlledActionUseCase, 'execute'> = {
  execute: vi.fn(
    async () =>
      ({
        id: '01900000-0000-7000-8000-000000000018',
        actorId: approverId,
        subjectType: 'DOCUMENT_VERSION',
        subjectId,
        subjectVersion: 7n,
        action: 'APPROVE',
        meaning: 'Approve the controlled document version.',
        signedAt: new Date(),
        snapshotHash: 'snapshot-7',
        reauthMethod: 'PASSWORD',
        requestId: 'req-sign',
      }) satisfies SignatureEvidence,
  ),
};

describe('approval orchestration', () => {
  it('returns only actionable scoped work and composes subject context', async () => {
    const result = await new ListMyApprovalsUseCase(repository()).execute({
      actor: makeActor(approverId),
    });
    expect(result).toHaveLength(1);
    expect(result[0].subject.reviewContext.title).toBe('Controlled record');
    await expect(
      new ListMyApprovalsUseCase(repository()).execute({ actor: makeActor(otherId) }),
    ).resolves.toEqual([]);
  });

  it('denies self-approval and stale subject versions before delegation', async () => {
    const delegate = vi.fn();
    await expect(
      new DecideApprovalUseCase(repository(fixture({ authorId: approverId })), {
        subjectTransitions: { DOCUMENT_VERSION: delegate },
        signaturePolicy: notRequired,
      }).execute({
        actor: makeActor(approverId),
        approvalId,
        workItemId,
        decision: 'APPROVE',
        subjectVersion: 7n,
        requestId: 'req-self',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_SOD_VIOLATION' });
    await expect(
      new DecideApprovalUseCase(repository(), {
        subjectTransitions: { DOCUMENT_VERSION: delegate },
        signaturePolicy: notRequired,
      }).execute({
        actor: makeActor(approverId),
        approvalId,
        workItemId,
        decision: 'APPROVE',
        subjectVersion: 6n,
        requestId: 'req-stale',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT_STALE_VERSION' });
    expect(delegate).not.toHaveBeenCalled();
  });

  it('delegates final subject transition and is idempotent on replay', async () => {
    const delegate = vi.fn(async () => ({ subjectId, version: 8n, state: 'APPROVED' }));
    const useCase = new DecideApprovalUseCase(repository(), {
      subjectTransitions: { DOCUMENT_VERSION: delegate },
      signaturePolicy: notRequired,
    });
    const first = await useCase.execute({
      actor: makeActor(approverId),
      approvalId,
      workItemId,
      decision: 'APPROVE',
      subjectVersion: 7n,
      requestId: 'req-replay',
    });
    // The fake repository returns the terminal work item on replay; history permission covers that read.
    const second = await useCase.execute({
      actor: makeActor(approverId),
      approvalId,
      workItemId,
      decision: 'APPROVE',
      subjectVersion: 7n,
      requestId: 'req-replay',
    });
    expect(first.decision.id).toBe(second.decision.id);
    expect(delegate).toHaveBeenCalledTimes(1);
  });

  it('does not bypass an unresolved signature policy and binds required evidence without password', async () => {
    const delegate = vi.fn(async () => ({ subjectId, version: 8n, state: 'APPROVED' }));
    await expect(
      new DecideApprovalUseCase(repository(), {
        subjectTransitions: { DOCUMENT_VERSION: delegate },
      }).execute({
        actor: makeActor(approverId),
        approvalId,
        workItemId,
        decision: 'APPROVE',
        subjectVersion: 7n,
        requestId: 'req-unresolved',
      }),
    ).rejects.toMatchObject({ code: 'DOMAIN_SIGNATURE_REQUIRED' });
    const result = await new DecideApprovalUseCase(repository(), {
      subjectTransitions: { DOCUMENT_VERSION: delegate },
      signaturePolicy: required,
      signer,
    }).execute({
      actor: makeActor(approverId),
      approvalId,
      workItemId,
      decision: 'APPROVE',
      subjectVersion: 7n,
      reauthenticationSecret: 'never-store-me',
      requestId: 'req-sign',
    });
    expect(result.signature).toMatchObject({ subjectVersion: 7n, snapshotHash: 'snapshot-7' });
    expect(
      JSON.stringify(result.signature, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    ).not.toContain('never-store-me');
    expect(signer.execute).toHaveBeenCalledWith(
      expect.objectContaining({ persist: false, reauthenticationSecret: 'never-store-me' }),
    );
  });

  it('rejects a failed owning-domain transition without writing an approval decision', async () => {
    const repositoryInstance = repository();
    const delegate = vi.fn(async () => {
      throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
    });
    await expect(
      new DecideApprovalUseCase(repositoryInstance, {
        subjectTransitions: { DOCUMENT_VERSION: delegate },
        signaturePolicy: notRequired,
      }).execute({
        actor: makeActor(approverId),
        approvalId,
        workItemId,
        decision: 'APPROVE',
        subjectVersion: 7n,
        requestId: 'req-fail',
      }),
    ).rejects.toMatchObject({ code: 'DOMAIN_INVALID_TRANSITION' });
  });
});
