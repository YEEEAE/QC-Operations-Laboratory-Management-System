import { describe, expect, it } from 'vitest';
import {
  approvalSignaturePolicyStatus,
  createApprovedSignaturePolicy,
} from '../../../src/modules/approvals/application/signature-policy-registry.js';
import type { ApprovalRecord } from '../../../src/modules/approvals/ports/repository.js';
import type {
  ApprovalDecisionKind,
  ApprovalSubjectType,
} from '../../../src/modules/approvals/domain/approval.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const standardActor: ActorContext = {
  id: 'user-2',
  loginIdentity: 'qcm.one',
  accountState: 'ACTIVE',
  roles: ['MANAGER'],
  permissions: [],
};

const namedOwner: ActorContext = {
  id: 'user-owner',
  loginIdentity: 'yazeed',
  accountState: 'ACTIVE',
  roles: ['SYSTEM_OWNER'],
  permissions: [],
};

/** SYSTEM_OWNER role on a different login is never the canonical named owner. */
const roleOnlyOwner: ActorContext = {
  id: 'user-3',
  loginIdentity: 'someone-else',
  accountState: 'ACTIVE',
  roles: ['SYSTEM_OWNER'],
  permissions: [],
};

/** Admin alone never carries owner authority. */
const adminOnly: ActorContext = {
  id: 'user-4',
  loginIdentity: 'admin.one',
  accountState: 'ACTIVE',
  roles: ['ADMIN'],
  permissions: [],
};

function record(subjectType: ApprovalSubjectType, subjectId = 'cr-1'): ApprovalRecord {
  return {
    approvalCase: {
      id: 'case-1',
      subjectType,
      subjectId,
      subjectVersion: 2n,
      workflowType: 'CHANGE_REQUEST',
      state: 'IN_PROGRESS',
      requestedBy: 'user-1',
      requestedAt: new Date('2026-01-01T00:00:00Z'),
      createdAt: new Date('2026-01-01T00:00:00Z'),
      version: 1n,
    },
    workItem: {
      id: 'wi-1',
      approvalCaseId: 'case-1',
      stepNo: 1,
      workType: 'APPROVAL',
      assignedUserId: 'user-2',
      state: 'PENDING',
      version: 1n,
    },
    subject: {
      subjectType,
      subjectId,
      state: 'UNDER_REVIEW',
      version: 2n,
      snapshotHash: 'hash',
      reviewContext: {},
    },
  };
}

const policy = createApprovedSignaturePolicy();

describe('approved generic-approval signature registry', () => {
  it('requires an account-bound signature with the approved meaning for change-request approval', () => {
    expect(
      policy.requirement({
        record: record('CHANGE_REQUEST', 'cr-9'),
        decision: 'APPROVE',
        actor: standardActor,
      }),
    ).toEqual({
      status: 'REQUIRED',
      meaning: 'Authorize change request cr-9',
    });
  });

  it('keeps change-request return/reject as unsigned workflow refusals', () => {
    for (const decision of ['RETURN', 'REJECT'] as const) {
      expect(
        policy.requirement({ record: record('CHANGE_REQUEST'), decision, actor: standardActor }),
      ).toEqual({
        status: 'NOT_REQUIRED',
      });
    }
  });

  it('keeps every unlisted subject or decision fail-closed (UNRESOLVED) for non-owner actors', () => {
    const subjects: ApprovalSubjectType[] = [
      'DOCUMENT_VERSION',
      'INSPECTION_REPORT',
      'LAB_TEST',
      'NCR',
      'CAPA',
    ];
    const decisions: ApprovalDecisionKind[] = ['APPROVE', 'RETURN', 'REJECT'];
    for (const subjectType of subjects) {
      for (const decision of decisions) {
        expect(
          policy.requirement({ record: record(subjectType), decision, actor: standardActor }),
        ).toEqual({
          status: 'UNRESOLVED',
        });
      }
    }
  });

  it('reports a partial policy status while a wired subject map is still missing', () => {
    expect(approvalSignaturePolicyStatus()).toBe('PARTIAL');
  });

  // Owner-Controlled Internal Approval (2026-10-16): the named owner's direct
  // internal decision has the signature ceremony deferred. The policy declares
  // the deferral; it never claims an electronic signature was produced.
  it('defers the signature ceremony for the canonical named owner on every wired subject', () => {
    for (const subjectType of ['CHANGE_REQUEST', 'DOCUMENT_VERSION'] as const) {
      expect(
        policy.requirement({ record: record(subjectType), decision: 'APPROVE', actor: namedOwner }),
      ).toEqual({
        status: 'NOT_REQUIRED',
        deferred: true,
        authority: 'SYSTEM_OWNER',
      });
    }
  });

  it('does not extend the owner deferral to a SYSTEM_OWNER role on another login', () => {
    expect(
      policy.requirement({
        record: record('CHANGE_REQUEST'),
        decision: 'APPROVE',
        actor: roleOnlyOwner,
      }),
    ).toEqual({ status: 'REQUIRED', meaning: 'Authorize change request cr-1' });
  });

  it('does not extend the owner deferral to an Admin-only account', () => {
    expect(
      policy.requirement({
        record: record('DOCUMENT_VERSION'),
        decision: 'APPROVE',
        actor: adminOnly,
      }),
    ).toEqual({ status: 'UNRESOLVED' });
  });
});
