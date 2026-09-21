import { AppError } from '../../../../shared/errors/app-error.js';
export const RECEIVING_WORKFLOW_STATES = [
  'PENDING',
  'READY_FOR_INSPECTION',
  'UNDER_INSPECTION',
  'INSPECTION_COMPLETE',
  'RELEASE_PENDING',
  'RELEASED',
  'HOLD',
  'EXPIRED',
  'CANCELLED',
] as const;
export type ReceivingWorkflowState = (typeof RECEIVING_WORKFLOW_STATES)[number];
export const INSPECTION_RESULTS = ['NOT_STARTED', 'IN_PROGRESS', 'PASS', 'FAIL', 'HOLD'] as const;
export type InspectionResult = (typeof INSPECTION_RESULTS)[number];
export type ReceivingAction =
  | 'MARK_READY'
  | 'START_INSPECTION'
  | 'COMPLETE_INSPECTION'
  | 'MOVE_TO_RELEASE_PENDING'
  | 'RELEASE'
  | 'HOLD'
  | 'REMOVE_HOLD'
  | 'MARK_EXPIRED'
  | 'CANCEL';
const transitions: Record<
  ReceivingWorkflowState,
  Partial<Record<ReceivingAction, ReceivingWorkflowState>>
> = {
  PENDING: {
    MARK_READY: 'READY_FOR_INSPECTION',
    HOLD: 'HOLD',
    MARK_EXPIRED: 'EXPIRED',
    CANCEL: 'CANCELLED',
  },
  READY_FOR_INSPECTION: {
    START_INSPECTION: 'UNDER_INSPECTION',
    HOLD: 'HOLD',
    MARK_EXPIRED: 'EXPIRED',
  },
  UNDER_INSPECTION: { COMPLETE_INSPECTION: 'INSPECTION_COMPLETE', HOLD: 'HOLD' },
  INSPECTION_COMPLETE: { MOVE_TO_RELEASE_PENDING: 'RELEASE_PENDING', HOLD: 'HOLD' },
  RELEASE_PENDING: { RELEASE: 'RELEASED', HOLD: 'HOLD' },
  RELEASED: {},
  HOLD: {},
  EXPIRED: {},
  CANCELLED: {},
};
export function transitionReceiving(
  state: ReceivingWorkflowState,
  action: ReceivingAction,
): ReceivingWorkflowState {
  const next = transitions[state][action];
  if (!next) throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
  return next;
}
export function assertReason(reason: string | undefined) {
  if (!reason?.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
}

/**
 * QC-DATA-001 — where a recorded receiving fact may still be corrected.
 *
 * A received record is evidence: from `UNDER_INSPECTION` onward the inspection
 * snapshot references it, so the fields that snapshot captured are frozen and a
 * correction must go through the inspection/HOLD disposition path instead of
 * silently rewriting history. Terminal states are history and never corrected.
 */
export const RECEIVING_CORRECTABLE_STATES: readonly ReceivingWorkflowState[] = [
  'PENDING',
  'READY_FOR_INSPECTION',
  'HOLD',
  'EXPIRED',
];

export function isReceivingCorrectable(state: ReceivingWorkflowState): boolean {
  return RECEIVING_CORRECTABLE_STATES.includes(state);
}

export function assertReceivingCorrectable(state: ReceivingWorkflowState): void {
  if (!isReceivingCorrectable(state)) {
    throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
  }
}
