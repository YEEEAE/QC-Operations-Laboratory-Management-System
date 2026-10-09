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
      policy.requirement({ record: record('CHANGE_REQUEST', 'cr-9'), decision: 'APPROVE' }),
    ).toEqual({
      status: 'REQUIRED',
      meaning: 'Authorize change request cr-9',
    });
  });

  it('keeps change-request return/reject as unsigned workflow refusals', () => {
    for (const decision of ['RETURN', 'REJECT'] as const) {
      expect(policy.requirement({ record: record('CHANGE_REQUEST'), decision })).toEqual({
        status: 'NOT_REQUIRED',
      });
    }
  });

  it('keeps every unlisted subject or decision fail-closed (UNRESOLVED)', () => {
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
        expect(policy.requirement({ record: record(subjectType), decision })).toEqual({
          status: 'UNRESOLVED',
        });
      }
    }
  });

  it('reports a partial policy status while a wired subject map is still missing', () => {
    expect(approvalSignaturePolicyStatus()).toBe('PARTIAL');
  });
});
