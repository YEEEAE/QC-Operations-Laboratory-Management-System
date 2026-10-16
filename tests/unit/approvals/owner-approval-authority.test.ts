import { describe, expect, it, vi } from 'vitest';
import { DecideApprovalUseCase } from '../../../src/modules/approvals/application/decide-approval.js';
import { createApprovedSignaturePolicy } from '../../../src/modules/approvals/application/signature-policy-registry.js';
import {
  OWNER_APPROVAL_DEFERRAL,
  ownerApprovalPathFor,
  ownerAuthorizationContext,
  ownerDecisionMetadata,
} from '../../../src/modules/approvals/application/owner-approval-policy.js';
import type {
  ApprovalRecord,
  ApprovalRepository,
  RecordApprovalDecisionInput,
} from '../../../src/modules/approvals/ports/repository.js';
import type { ActorContext, PermissionGrant } from '../../../src/shared/authorization/types.js';
import type { PermissionCode } from '../../../src/shared/authorization/permissions.js';
import { assertSafeAuditPayload } from '../../../src/shared/audit/audit-event.js';
import type { SignatureEvidence } from '../../../src/modules/e-signatures/domain/signature-evidence.js';

const GLOBAL = ['GLOBAL'] as const;

const ownerActor: ActorContext = {
  id: 'user-owner',
  loginIdentity: 'yazeed',
  accountState: 'ACTIVE',
  roles: ['SYSTEM_OWNER'],
  permissions: [
    { code: 'PERM-APR-VIEW-ASSIGNED' as PermissionCode, scopes: [...GLOBAL] },
    { code: 'PERM-APR-APPROVE' as PermissionCode, scopes: [...GLOBAL] },
    { code: 'PERM-CHG-APPROVE' as PermissionCode, scopes: [...GLOBAL] },
  ],
};

const standardActor: ActorContext = {
  id: 'user-2',
  loginIdentity: 'qcm.one',
  accountState: 'ACTIVE',
  roles: ['MANAGER'],
  permissions: [
    { code: 'PERM-APR-VIEW-ASSIGNED' as PermissionCode, scopes: [...GLOBAL] },
    { code: 'PERM-APR-APPROVE' as PermissionCode, scopes: [...GLOBAL] },
    { code: 'PERM-CHG-APPROVE' as PermissionCode, scopes: [...GLOBAL] },
    { code: 'PERM-ESIG-SIGN' as PermissionCode, scopes: [...GLOBAL] },
  ],
};

function accessDecision(actor: ActorContext, subjectType: 'CHANGE_REQUEST' | 'DOCUMENT_VERSION'): ApprovalRecord {
  return {
    approvalCase: {
      id: '0192aaaa-0000-7000-8000-000000000001',
      subjectType,
      subjectId: '0192bbbb-0000-7000-8000-000000000002',
      subjectVersion: 2n,
      workflowType: subjectType === 'CHANGE_REQUEST' ? 'CHANGE_REQUEST' : 'DOCUMENT_VERSION',
      state: 'IN_PROGRESS',
      requestedBy: 'user-1',
      requestedAt: new Date('2026-01-01T00:00:00Z'),
      createdAt: new Date('2026-01-01T00:00:00Z'),
      version: 1n,
    },
    workItem: {
      id: '0192cccc-0000-7000-8000-000000000003',
      approvalCaseId: '0192aaaa-0000-7000-8000-000000000001',
      stepNo: 1,
      workType: 'APPROVAL',
      // Deliberately assigned to another account: the owner must still be able
      // to decide, and a non-assigned non-owner must still be refused.
      assignedUserId: 'user-2',
      state: 'PENDING',
      version: 1n,
    },
    subject: {
      subjectType,
      subjectId: '0192bbbb-0000-7000-8000-000000000002',
      state: subjectType === 'CHANGE_REQUEST' ? 'UNDER_REVIEW' : 'IN_REVIEW',
      version: 2n,
      authorId: 'user-1',
      snapshotHash: 'snapshot-hash',
      reviewContext: {},
    },
  };
}

function repositoryFor(record: ApprovalRecord) {
  const recorded: RecordApprovalDecisionInput[] = [];
  const repository: ApprovalRepository = {
    runDecisionTransaction: (work) => work(undefined as never),
    listActionable: async () => [],
    get: async () => record,
    findDecisionByRequestId: async () => undefined,
    recordDecision: async (input) => {
      recorded.push(input);
      return {
        decision: {
          id: 'decision-1',
          approvalCaseId: input.approvalCaseId,
          workItemId: input.workItemId,
          actorId: input.actor.id,
          decision: input.decision,
          subjectVersion: input.subjectVersion,
          decidedAt: input.now,
          requestId: input.requestId,
        },
      };
    },
  };
  return { repository, recorded };
}

const approveTransition = {
  decisions: ['APPROVE'] as const,
  execute: async () => ({
    subjectId: '0192bbbb-0000-7000-8000-000000000002',
    version: 3n,
    state: 'APPROVED',
  }),
};

describe('owner internal approval authority', () => {
  it('recognises only the canonical named owner on an ACTIVE account', () => {
    expect(ownerApprovalPathFor(ownerActor)).toBe('OWNER_PATH');
    expect(ownerApprovalPathFor(standardActor)).toBe('STANDARD_PATH');
    expect(
      ownerApprovalPathFor({ ...ownerActor, accountState: 'DISABLED' }),
    ).toBe('STANDARD_PATH');
    expect(
      ownerApprovalPathFor({ ...ownerActor, loginIdentity: 'other' }),
    ).toBe('STANDARD_PATH');
    expect(
      ownerApprovalPathFor({ ...ownerActor, roles: ['ADMIN'] }),
    ).toBe('STANDARD_PATH');
  });

  it('records the owner authority and the deferred-signature marker on an approval', () => {
    expect(ownerDecisionMetadata(ownerActor, 'APPROVE')).toEqual({
      decisionType: 'OWNER_INTERNAL_APPROVAL',
      ownerAuthority: 'SYSTEM_OWNER',
      ownerLoginIdentity: 'yazeed',
      signatureDeferred: true,
    });
    // A refusal is a workflow refusal, never a signature-deferred approval.
    expect(ownerDecisionMetadata(ownerActor, 'RETURN').signatureDeferred).toBe(false);
    expect(ownerDecisionMetadata(ownerActor, 'REJECT').signatureDeferred).toBe(false);
    // A non-owner decision never claims owner authority.
    expect(ownerDecisionMetadata(standardActor, 'APPROVE')).toEqual({
      decisionType: 'STANDARD_WORKFLOW',
      signatureDeferred: false,
    });
  });

  it('produces an audit-safe authorization context without credential-shaped keys', () => {
    const context = ownerAuthorizationContext(ownerActor);
    expect(() => assertSafeAuditPayload(context)).not.toThrow();
    expect(context['decisionRef']).toBe(OWNER_APPROVAL_DEFERRAL.decisionId);
    expect(context['roles']).toEqual(['SYSTEM_OWNER']);
  });

  it('declares the deferred capabilities explicitly', () => {
    expect(OWNER_APPROVAL_DEFERRAL.active).toBe(true);
    expect(OWNER_APPROVAL_DEFERRAL.deferredCapabilities).toContain(
      'ELECTRONIC_SIGNATURE_CEREMONY',
    );
    expect(OWNER_APPROVAL_DEFERRAL.deferredCapabilities).toContain(
      'MANDATORY_INTERNAL_MULTI_PERSON_APPROVAL',
    );
  });

  it('approves an eligible record directly for the owner with no signature row and no signer call', async () => {
    const record = accessDecision(ownerActor, 'CHANGE_REQUEST');
    const { repository, recorded } = repositoryFor(record);
    const signer = { execute: vi.fn(async () => { throw new Error('signer must not run'); }) };
    const useCase = new DecideApprovalUseCase(repository, {
      subjectTransitions: { CHANGE_REQUEST: approveTransition },
      signaturePolicy: createApprovedSignaturePolicy(),
      signer,
      now: () => new Date('2026-10-16T10:00:00Z'),
    });

    await useCase.execute({
      actor: ownerActor,
      approvalId: record.approvalCase.id,
      workItemId: record.workItem.id,
      decision: 'APPROVE',
      subjectVersion: 2n,
      requestId: 'req-owner-1',
    });

    expect(signer.execute).not.toHaveBeenCalled();
    expect(recorded).toHaveLength(1);
    const decision = recorded[0]!;
    expect(decision.signature).toBeUndefined();
    expect(decision.ownerMetadata).toEqual({
      decisionType: 'OWNER_INTERNAL_APPROVAL',
      ownerAuthority: 'SYSTEM_OWNER',
      ownerLoginIdentity: 'yazeed',
      signatureDeferred: true,
    });
    expect(decision.previousState).toBe('UNDER_REVIEW');
    expect(decision.resultingState).toBe('APPROVED');
    expect(decision.authorizationContext?.['authority']).toBe('SYSTEM_OWNER');
  });

  it('still requires the signature ceremony for a non-owner actor', async () => {
    const record = accessDecision(standardActor, 'CHANGE_REQUEST');
    const { repository, recorded } = repositoryFor(record);
    const signer = {
      execute: vi.fn(async (): Promise<SignatureEvidence> => ({
        id: 'sig-1',
        actorId: standardActor.id,
        subjectType: 'CHANGE_REQUEST',
        subjectId: record.subject.subjectId,
        subjectVersion: 2n,
        action: 'APPROVE',
        meaning: 'Authorize change request',
        signedAt: new Date('2026-10-16T10:00:00Z'),
        snapshotHash: 'snapshot-hash',
        reauthMethod: 'PASSWORD',
        requestId: 'req-standard-1',
      })),
    };
    const useCase = new DecideApprovalUseCase(repository, {
      subjectTransitions: { CHANGE_REQUEST: approveTransition },
      signaturePolicy: createApprovedSignaturePolicy(),
      signer,
      now: () => new Date('2026-10-16T10:00:00Z'),
    });

    await useCase.execute({
      actor: standardActor,
      approvalId: record.approvalCase.id,
      workItemId: record.workItem.id,
      decision: 'APPROVE',
      subjectVersion: 2n,
      reason: 'approved',
      reauthenticationSecret: 'secret',
      requestId: 'req-standard-1',
    });

    expect(signer.execute).toHaveBeenCalledTimes(1);
    expect(recorded[0]!.signature?.id).toBe('sig-1');
    expect(recorded[0]!.ownerMetadata).toEqual({
      decisionType: 'STANDARD_WORKFLOW',
      signatureDeferred: false,
    });
  });
});
