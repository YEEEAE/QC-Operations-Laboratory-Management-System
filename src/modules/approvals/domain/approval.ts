import { AppError } from '../../../shared/errors/app-error.js';

export const APPROVAL_CASE_STATES = [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'RETURNED',
  'CANCELLED',
  'EXPIRED',
] as const;
export type ApprovalCaseState = (typeof APPROVAL_CASE_STATES)[number];
export const APPROVAL_WORK_TYPES = ['REVIEW', 'APPROVAL'] as const;
export type ApprovalWorkType = (typeof APPROVAL_WORK_TYPES)[number];
export const APPROVAL_WORK_STATES = [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'RETURNED',
  'CANCELLED',
  'EXPIRED',
] as const;
export type ApprovalWorkState = (typeof APPROVAL_WORK_STATES)[number];
export const APPROVAL_DECISIONS = ['APPROVE', 'REJECT', 'RETURN'] as const;
export type ApprovalDecisionKind = (typeof APPROVAL_DECISIONS)[number];

export const APPROVAL_SUBJECT_TYPES = [
  'INSPECTION_REPORT',
  'LAB_TEST',
  'DOCUMENT_VERSION',
  'CALIBRATION_RECORD',
  'CAPA',
  'CHANGE_REQUEST',
  'RCA',
  'NCR',
  'FINDING',
] as const;
export type ApprovalSubjectType = (typeof APPROVAL_SUBJECT_TYPES)[number];

export interface ApprovalCase {
  id: string;
  subjectType: ApprovalSubjectType;
  subjectId: string;
  subjectVersion: bigint;
  workflowType: string;
  state: ApprovalCaseState;
  requestedBy: string;
  requestedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  version: bigint;
}

export interface ApprovalWorkItem {
  id: string;
  approvalCaseId: string;
  stepNo: number;
  workType: ApprovalWorkType;
  assignedUserId?: string;
  assignedRoleRequirement?: string;
  state: ApprovalWorkState;
  assignedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  version: bigint;
}

export interface ApprovalDecision {
  id: string;
  approvalCaseId: string;
  workItemId?: string;
  actorId: string;
  decision: ApprovalDecisionKind;
  subjectVersion: bigint;
  reason?: string;
  comments?: string;
  signatureId?: string;
  decidedAt: Date;
  requestId: string;
}

export function assertApprovalSubjectType(value: string): asserts value is ApprovalSubjectType {
  if (!(APPROVAL_SUBJECT_TYPES as readonly string[]).includes(value))
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
}

export function createApprovalCase(
  input: Omit<ApprovalCase, 'state' | 'version' | 'createdAt'> & { now: Date },
): ApprovalCase {
  if (input.subjectVersion <= 0n || !input.workflowType.trim())
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  assertApprovalSubjectType(input.subjectType);
  return { ...input, state: 'PENDING', createdAt: input.now, version: 1n };
}

export function createApprovalWorkItem(
  input: Omit<ApprovalWorkItem, 'state' | 'version'> & { now: Date },
): ApprovalWorkItem {
  if (
    input.stepNo < 1 ||
    !input.approvalCaseId ||
    (!input.assignedUserId && !input.assignedRoleRequirement)
  )
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  return { ...input, state: 'PENDING', assignedAt: input.assignedAt ?? input.now, version: 1n };
}

export function isApprovalWorkItemActionable(workItem: ApprovalWorkItem): boolean {
  return workItem.state === 'PENDING' || workItem.state === 'IN_PROGRESS';
}

export function transitionApprovalWorkItem(
  workItem: ApprovalWorkItem,
  decision: ApprovalDecisionKind,
  now: Date,
): ApprovalWorkItem {
  if (!isApprovalWorkItemActionable(workItem))
    throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
  return {
    ...workItem,
    state: decision === 'RETURN' ? 'RETURNED' : 'COMPLETED',
    completedAt: now,
    version: workItem.version + 1n,
  };
}

export function decisionAction(workItem: ApprovalWorkItem, decision: ApprovalDecisionKind): string {
  if (workItem.workType === 'REVIEW') return decision === 'RETURN' ? 'RETURN' : 'REVIEW';
  return decision;
}
