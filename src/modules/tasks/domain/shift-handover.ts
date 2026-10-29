import { AppError } from '../../../shared/errors/app-error.js';

export const HANDOVER_STATES = [
  'DRAFT', 'PREPARED', 'IN_REVIEW', 'RETURNED', 'ACCEPTED', 'ACKNOWLEDGED',
] as const;
export type HandoverState = (typeof HANDOVER_STATES)[number];
export type HandoverItemType =
  | 'TASK' | 'RECEIVING_ITEM' | 'INSPECTION_REPORT' | 'LAB_TEST'
  | 'DEVIATION' | 'DAILY_REJECT' | 'REWORK' | 'EQUIPMENT';

export interface HandoverItemReference {
  type: HandoverItemType;
  id: string;
}

export interface ShiftHandover {
  id: string;
  fromShift: string;
  toShift: string;
  areaCode: string;
  lineCode: string;
  initiatedBy: string;
  acceptedBy?: string;
  initiatedAt: Date;
  acceptedAt?: Date;
  state: HandoverState;
  linkedItems: readonly HandoverItemReference[];
  snapshot: Readonly<Record<string, unknown>>;
  snapshotSha256: string;
  version: bigint;
}

export type HandoverAction = 'PREPARE' | 'REVIEW' | 'ACCEPT' | 'RETURN' | 'ACKNOWLEDGE';
const next: Record<HandoverAction, readonly [HandoverState, HandoverState][]> = {
  PREPARE: [['DRAFT', 'PREPARED'], ['RETURNED', 'PREPARED']],
  REVIEW: [['PREPARED', 'IN_REVIEW']],
  ACCEPT: [['IN_REVIEW', 'ACCEPTED']],
  RETURN: [['PREPARED', 'RETURNED'], ['IN_REVIEW', 'RETURNED']],
  ACKNOWLEDGE: [['ACCEPTED', 'ACKNOWLEDGED']],
};

export function transitionHandover(
  state: HandoverState,
  action: HandoverAction,
  reason?: string,
): HandoverState {
  const result = next[action].find(([from]) => from === state)?.[1];
  if (!result) throw new AppError('AUTHZ_DENIED', { userSafe: true });
  if (action === 'RETURN' && !reason?.trim())
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  return result;
}

export function assertDistinctShifts(fromShift: string, toShift: string): void {
  if (!fromShift.trim() || !toShift.trim() || fromShift.trim() === toShift.trim())
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
}
