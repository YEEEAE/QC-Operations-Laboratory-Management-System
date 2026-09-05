import { authorize } from '../../../shared/authorization/authorize.js';
import type { PermissionCode } from '../../../shared/authorization/permissions.js';
import type { ActorContext, EntityContext } from '../../../shared/authorization/types.js';
import { decisionAction, type ApprovalDecisionKind } from '../domain/approval.js';
import type { ApprovalRecord } from '../ports/repository.js';

const domainPrefix: Record<ApprovalRecord['approvalCase']['subjectType'], string> = {
  INSPECTION_REPORT: 'INSP',
  LAB_TEST: 'LAB',
  DOCUMENT_VERSION: 'DOC',
  CALIBRATION_RECORD: 'CAL',
  CAPA: 'CAPA',
  CHANGE_REQUEST: 'CHG',
  RCA: 'RCA',
  NCR: 'NCR',
  FINDING: 'FIND',
};

export function isAssignedToActor(record: ApprovalRecord, actor: ActorContext): boolean {
  return (
    record.workItem.assignedUserId === actor.id ||
    Boolean(
      record.workItem.assignedRoleRequirement &&
      actor.roles.includes(record.workItem.assignedRoleRequirement),
    )
  );
}

export function genericPermissionFor(
  record: ApprovalRecord,
  decision: ApprovalDecisionKind | 'VIEW',
): PermissionCode {
  if (decision === 'VIEW') return 'PERM-APR-VIEW-ASSIGNED';
  if (record.workItem.workType === 'REVIEW' && decision === 'APPROVE') return 'PERM-APR-REVIEW';
  return `PERM-APR-${decision}` as PermissionCode;
}

export function domainPermissionFor(
  record: ApprovalRecord,
  decision: ApprovalDecisionKind,
): PermissionCode {
  const prefix = domainPrefix[record.approvalCase.subjectType];
  const action =
    record.workItem.workType === 'REVIEW' && decision === 'APPROVE' ? 'REVIEW' : decision;
  return `PERM-${prefix}-${action}` as PermissionCode;
}

function approvalEntity(record: ApprovalRecord, actor: ActorContext): EntityContext {
  return {
    type: 'APPROVAL_WORK_ITEM',
    id: record.workItem.id,
    state: record.workItem.state,
    assigneeId: actor.id,
    domain: record.approvalCase.subjectType,
  };
}

function subjectEntity(record: ApprovalRecord, actor: ActorContext): EntityContext {
  return {
    type: record.subject.subjectType,
    id: record.subject.subjectId,
    state: record.subject.state,
    ownerId: record.subject.ownerId,
    authorId: record.subject.authorId,
    executorId: record.subject.executorId,
    assigneeId: record.subject.assigneeId ?? actor.id,
    domain: record.subject.domain,
  };
}

export function authorizeApprovalView(record: ApprovalRecord, actor: ActorContext): void {
  if (!isAssignedToActor(record, actor)) throw new Error('not assigned');
  authorize(
    {
      actor,
      permission: genericPermissionFor(record, 'VIEW'),
      action: 'VIEW',
      entity: approvalEntity(record, actor),
      scope: { assigneeId: actor.id },
      currentVersion: record.workItem.version,
      expectedVersion: record.workItem.version,
      businessCondition: true,
    },
    { throwOnDeny: true },
  );
}

export function authorizeApprovalHistory(record: ApprovalRecord, actor: ActorContext): void {
  if (!isAssignedToActor(record, actor)) throw new Error('not assigned');
  authorize(
    {
      actor,
      permission: 'PERM-APR-VIEW-HISTORY',
      action: 'VIEW_HISTORY',
      entity: {
        type: 'APPROVAL_CASE',
        id: record.approvalCase.id,
        state: record.approvalCase.state,
        assigneeId: actor.id,
      },
      scope: { assigneeId: actor.id },
      currentVersion: record.approvalCase.version,
      expectedVersion: record.approvalCase.version,
      businessCondition: true,
    },
    { throwOnDeny: true },
  );
}

export function authorizeApprovalDecision(
  record: ApprovalRecord,
  actor: ActorContext,
  decision: ApprovalDecisionKind,
  expectedSubjectVersion: bigint,
): void {
  authorizeApprovalView(record, actor);
  const action = decisionAction(record.workItem, decision);
  const entity = subjectEntity(record, actor);
  const common = {
    actor,
    action,
    entity,
    scope: { ownerId: entity.ownerId, assigneeId: entity.assigneeId, domain: entity.domain },
    currentVersion: record.subject.version,
    expectedVersion: expectedSubjectVersion,
    sod: {
      actorId: actor.id,
      authorId: record.subject.authorId,
      executorId: record.subject.executorId,
    },
    businessCondition: record.approvalCase.subjectVersion === record.subject.version,
  };
  authorize(
    { ...common, permission: genericPermissionFor(record, decision) },
    { throwOnDeny: true },
  );
  authorize(
    { ...common, permission: domainPermissionFor(record, decision) },
    { throwOnDeny: true },
  );
}
