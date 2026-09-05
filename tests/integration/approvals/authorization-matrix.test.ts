import { describe, expect, it } from 'vitest';
import { authorizeApprovalDecision } from '../../../src/modules/approvals/application/authorization.js';
import type { ApprovalRecord } from '../../../src/modules/approvals/ports/repository.js';
import type { ActorContext, PermissionGrant } from '../../../src/shared/authorization/types.js';
import { AppError } from '../../../src/shared/errors/app-error.js';

const ids = {
  requester: '01900000-0000-7000-8000-000000000101',
  reviewer: '01900000-0000-7000-8000-000000000102',
  approver: '01900000-0000-7000-8000-000000000103',
  case: '01900000-0000-7000-8000-000000000104',
  changeRequest: '01900000-0000-7000-8000-000000000105',
  workItem: '01900000-0000-7000-8000-000000000106',
};

const grant = (code: PermissionGrant['code'], ...scopes: PermissionGrant['scopes']): PermissionGrant => ({ code, scopes });
const actor = (id: string, permissions: PermissionGrant[], roles: string[] = []): ActorContext => ({ id, accountState: 'ACTIVE', roles, permissions });
const record: ApprovalRecord = {
  approvalCase: { id: ids.case, subjectType: 'CHANGE_REQUEST', subjectId: ids.changeRequest, subjectVersion: 7n, workflowType: 'CHANGE_REQUEST_APPROVAL', state: 'IN_PROGRESS', requestedBy: ids.requester, requestedAt: new Date(), createdAt: new Date(), version: 2n },
  workItem: { id: ids.workItem, approvalCaseId: ids.case, stepNo: 1, workType: 'APPROVAL', assignedUserId: ids.approver, state: 'IN_PROGRESS', version: 1n },
  subject: { subjectType: 'CHANGE_REQUEST', subjectId: ids.changeRequest, state: 'UNDER_REVIEW', version: 7n, authorId: ids.requester, domain: 'CHANGE_REQUESTS', reviewContext: {} },
};

const assertCode = (work: () => void, code: string) => {
  try { work(); throw new Error('expected authorization denial'); } catch (error) { expect(error).toBeInstanceOf(AppError); expect((error as AppError).code).toBe(code); }
};

describe('Change Request approval authorization matrix', () => {
  it('requires both generic approval and PERM-CHG-APPROVE', () => {
    const genericOnly = actor(ids.approver, [grant('PERM-APR-VIEW-ASSIGNED', 'GLOBAL'), grant('PERM-APR-APPROVE', 'GLOBAL')]);
    assertCode(() => authorizeApprovalDecision(record, genericOnly, 'APPROVE', 7n), 'AUTHZ_PERMISSION_MISSING');

    const domainOnly = actor(ids.approver, [grant('PERM-APR-VIEW-ASSIGNED', 'GLOBAL'), grant('PERM-CHG-APPROVE', 'GLOBAL')]);
    assertCode(() => authorizeApprovalDecision(record, domainOnly, 'APPROVE', 7n), 'AUTHZ_PERMISSION_MISSING');

    const correct = actor(ids.approver, [grant('PERM-APR-VIEW-ASSIGNED', 'GLOBAL'), grant('PERM-APR-APPROVE', 'GLOBAL'), grant('PERM-CHG-APPROVE', 'GLOBAL')]);
    expect(() => authorizeApprovalDecision(record, correct, 'APPROVE', 7n)).not.toThrow();
  });

  it('denies self-approval, stale subject versions, and an Admin role without grants', () => {
    const self = actor(ids.requester, [grant('PERM-APR-VIEW-ASSIGNED', 'GLOBAL'), grant('PERM-APR-APPROVE', 'GLOBAL'), grant('PERM-CHG-APPROVE', 'GLOBAL')]);
    const selfRecord = { ...record, workItem: { ...record.workItem, assignedUserId: ids.requester } };
    assertCode(() => authorizeApprovalDecision(selfRecord, self, 'APPROVE', 7n), 'AUTHZ_SOD_VIOLATION');

    const correct = actor(ids.approver, [grant('PERM-APR-VIEW-ASSIGNED', 'GLOBAL'), grant('PERM-APR-APPROVE', 'GLOBAL'), grant('PERM-CHG-APPROVE', 'GLOBAL')]);
    assertCode(() => authorizeApprovalDecision(record, correct, 'APPROVE', 6n), 'CONFLICT_STALE_VERSION');

    const admin = actor(ids.approver, [grant('PERM-ADM-PERMISSION-ASSIGN', 'GLOBAL')], ['Admin']);
    assertCode(() => authorizeApprovalDecision(record, admin, 'APPROVE', 7n), 'AUTHZ_PERMISSION_MISSING');
  });

  it('requires an explicit generic/domain pair for return and rejection too', () => {
    const actorWithReturn = actor(ids.approver, [grant('PERM-APR-VIEW-ASSIGNED', 'GLOBAL'), grant('PERM-APR-RETURN', 'GLOBAL'), grant('PERM-CHG-RETURN', 'GLOBAL')]);
    expect(() => authorizeApprovalDecision(record, actorWithReturn, 'RETURN', 7n)).not.toThrow();
    const missingDomain = actor(ids.approver, [grant('PERM-APR-VIEW-ASSIGNED', 'GLOBAL'), grant('PERM-APR-REJECT', 'GLOBAL')]);
    assertCode(() => authorizeApprovalDecision(record, missingDomain, 'REJECT', 7n), 'AUTHZ_PERMISSION_MISSING');
  });
});
