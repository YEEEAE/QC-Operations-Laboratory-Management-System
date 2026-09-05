import { AppError } from '../../../shared/errors/app-error.js';

export const CHANGE_REQUEST_STATES = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'RETURNED',
  'APPROVED',
  'REJECTED',
  'APPLYING',
  'APPLIED',
  'APPLICATION_FAILED',
  'CANCELLED',
] as const;
export type ChangeRequestState = (typeof CHANGE_REQUEST_STATES)[number];

export const CHANGE_REQUEST_ACTIONS = [
  'SUBMIT',
  'START_REVIEW',
  'RETURN',
  'RESUME',
  'APPROVE',
  'REJECT',
  'CANCEL',
  'START_APPLY',
  'APPLY_SUCCESS',
  'APPLICATION_FAILED',
] as const;
export type ChangeRequestAction = (typeof CHANGE_REQUEST_ACTIONS)[number];
export type UserChangeRequestAction = Exclude<ChangeRequestAction, 'START_APPLY' | 'APPLY_SUCCESS' | 'APPLICATION_FAILED'>;

export interface ChangeRequestChange {
  id: string;
  fieldPath: string;
  currentValue: unknown;
  proposedValue: unknown;
  dataType: string;
  position: number;
}

export interface ChangeRequestApplicationAttempt {
  id: string;
  changeRequestId: string;
  attemptNo: number;
  startedAt: Date;
  finishedAt?: Date;
  result: 'SUCCESS' | 'FAILED';
  targetVersionBefore?: bigint;
  targetVersionAfter?: bigint;
  errorCode?: string;
  requestId: string;
}

export interface ChangeRequest {
  id: string;
  changeNo: string;
  targetType: string;
  targetId: string;
  targetVersion: bigint;
  state: ChangeRequestState;
  reason: string;
  targetSnapshot: Readonly<Record<string, unknown>>;
  targetSnapshotHash?: string;
  requestedBy: string;
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  appliedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  version: bigint;
}

export interface ChangeRequestTransitionInput {
  action: ChangeRequestAction;
  now: Date;
  reason?: string;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const reasonRequired = new Set<ChangeRequestAction>(['RETURN', 'REJECT', 'CANCEL', 'APPLICATION_FAILED']);

function assertNonEmpty(value: string, field: string): void {
  if (!value.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true, fieldErrors: { [field]: ['required'] } });
}

export function createChangeRequest(
  input: Omit<ChangeRequest, 'state' | 'version' | 'createdAt' | 'updatedAt'> & { now: Date },
): ChangeRequest {
  assertNonEmpty(input.changeNo, 'changeNo');
  assertNonEmpty(input.targetType, 'targetType');
  assertNonEmpty(input.reason, 'reason');
  if (!uuidPattern.test(input.id) || !uuidPattern.test(input.targetId) || input.targetVersion <= 0n)
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  if (!input.targetSnapshot || typeof input.targetSnapshot !== 'object' || Array.isArray(input.targetSnapshot))
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  return {
    ...input,
    changeNo: input.changeNo.trim(),
    targetType: input.targetType.trim(),
    reason: input.reason.trim(),
    state: 'DRAFT',
    createdAt: input.now,
    updatedAt: input.now,
    version: 1n,
  };
}

const transitions: Readonly<Record<ChangeRequestState, Partial<Record<ChangeRequestAction, ChangeRequestState>>>> = {
  DRAFT: { SUBMIT: 'SUBMITTED', CANCEL: 'CANCELLED' },
  SUBMITTED: { START_REVIEW: 'UNDER_REVIEW' },
  UNDER_REVIEW: { RETURN: 'RETURNED', APPROVE: 'APPROVED', REJECT: 'REJECTED' },
  RETURNED: { RESUME: 'DRAFT', CANCEL: 'CANCELLED' },
  APPROVED: { START_APPLY: 'APPLYING' },
  REJECTED: {},
  APPLYING: { APPLY_SUCCESS: 'APPLIED', APPLICATION_FAILED: 'APPLICATION_FAILED' },
  APPLIED: {},
  APPLICATION_FAILED: {},
  CANCELLED: {},
};

export function transitionChangeRequest(
  request: ChangeRequest,
  input: ChangeRequestTransitionInput,
): ChangeRequest {
  const nextState = transitions[request.state][input.action];
  if (!nextState) throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
  if (reasonRequired.has(input.action)) assertNonEmpty(input.reason ?? '', 'reason');
  const next: ChangeRequest = {
    ...request,
    state: nextState,
    updatedAt: input.now,
    version: request.version + 1n,
  };
  if (input.action === 'SUBMIT') next.submittedAt = input.now;
  if (input.action === 'APPROVE') next.approvedAt = input.now;
  if (input.action === 'REJECT') next.rejectedAt = input.now;
  if (input.action === 'APPLY_SUCCESS') next.appliedAt = input.now;
  return next;
}

export function assertUserChangeRequestAction(action: string): asserts action is UserChangeRequestAction {
  if (!(CHANGE_REQUEST_ACTIONS as readonly string[]).includes(action) || ['START_APPLY', 'APPLY_SUCCESS', 'APPLICATION_FAILED'].includes(action))
    throw new AppError('AUTHZ_PERMISSION_MISSING', { userSafe: true });
}

export function isControlledChangeRequestState(state: ChangeRequestState): boolean {
  return ['APPROVED', 'APPLYING', 'APPLIED', 'APPLICATION_FAILED', 'REJECTED', 'CANCELLED'].includes(state);
}
