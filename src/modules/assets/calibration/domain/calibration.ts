import { AppError } from '../../../../shared/errors/app-error.js';

export const CALIBRATION_STATES = [
  'DRAFT',
  'SCHEDULED',
  'SUBMITTED',
  'APPROVED',
  'CURRENT',
  'DUE',
  'OVERDUE',
  'COMPLETED',
  'FAILED',
  'SUPERSEDED',
  'VOID',
] as const;
export type CalibrationState = (typeof CALIBRATION_STATES)[number];
export type CalibrationAction =
  | 'SCHEDULE'
  | 'SUBMIT'
  | 'APPROVE'
  | 'COMPLETE'
  | 'FAIL'
  | 'MAKE_CURRENT'
  | 'MARK_DUE'
  | 'MARK_OVERDUE'
  | 'SUPERSEDE'
  | 'VOID';
export interface CalibrationRecord {
  id: string;
  calibrationNo: string;
  equipmentId: string;
  state: CalibrationState;
  calibrationDate: Date;
  dueDate?: Date;
  provider?: string;
  certificateNo?: string;
  result?: string;
  approvedAt?: Date;
  approvedBy?: string;
  becameCurrentAt?: Date;
  supersededAt?: Date;
  voidedAt?: Date;
  voidReason?: string;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  version: bigint;
}
export interface NewCalibrationInput {
  id: string;
  calibrationNo: string;
  equipmentId: string;
  calibrationDate: Date;
  dueDate?: Date;
  provider?: string;
  certificateNo?: string;
  result?: string;
  createdBy: string;
  now: Date;
}
const required = (value: string, field: string) => {
  const normalized = value.trim();
  if (!normalized)
    throw new AppError('VALIDATION_FAILED', {
      userSafe: true,
      fieldErrors: { [field]: ['required'] },
    });
  return normalized;
};
const optional = (value?: string) => value?.trim() || undefined;
export function createDraftCalibration(input: NewCalibrationInput): CalibrationRecord {
  if (!input.equipmentId) throw new AppError('VALIDATION_FAILED', { userSafe: true });
  return {
    id: input.id,
    calibrationNo: required(input.calibrationNo, 'calibrationNo'),
    equipmentId: input.equipmentId,
    state: 'DRAFT',
    calibrationDate: input.calibrationDate,
    dueDate: input.dueDate,
    provider: optional(input.provider),
    certificateNo: optional(input.certificateNo),
    result: optional(input.result),
    createdAt: input.now,
    createdBy: input.createdBy,
    updatedAt: input.now,
    version: 1n,
  };
}
export function isCalibrationOverdue(
  record: Pick<CalibrationRecord, 'dueDate'>,
  now: Date,
): boolean {
  return Boolean(record.dueDate && now.getTime() > record.dueDate.getTime());
}
const transitions: Record<CalibrationAction, readonly [CalibrationState, CalibrationState][]> = {
  SCHEDULE: [['DRAFT', 'SCHEDULED']],
  SUBMIT: [
    ['DRAFT', 'SUBMITTED'],
    ['SCHEDULED', 'SUBMITTED'],
  ],
  APPROVE: [['SUBMITTED', 'APPROVED']],
  COMPLETE: [
    ['APPROVED', 'COMPLETED'],
    ['CURRENT', 'COMPLETED'],
  ],
  FAIL: [
    ['SUBMITTED', 'FAILED'],
    ['APPROVED', 'FAILED'],
    ['COMPLETED', 'FAILED'],
    ['CURRENT', 'FAILED'],
    ['DUE', 'FAILED'],
    ['OVERDUE', 'FAILED'],
  ],
  MAKE_CURRENT: [
    ['APPROVED', 'CURRENT'],
    ['COMPLETED', 'CURRENT'],
  ],
  MARK_DUE: [['CURRENT', 'DUE']],
  MARK_OVERDUE: [
    ['CURRENT', 'OVERDUE'],
    ['DUE', 'OVERDUE'],
  ],
  SUPERSEDE: [
    ['CURRENT', 'SUPERSEDED'],
    ['DUE', 'SUPERSEDED'],
    ['OVERDUE', 'SUPERSEDED'],
    ['FAILED', 'SUPERSEDED'],
  ],
  VOID: [
    ['DRAFT', 'VOID'],
    ['SCHEDULED', 'VOID'],
    ['SUBMITTED', 'VOID'],
    ['APPROVED', 'VOID'],
    ['CURRENT', 'VOID'],
    ['DUE', 'VOID'],
    ['OVERDUE', 'VOID'],
    ['COMPLETED', 'VOID'],
    ['FAILED', 'VOID'],
  ],
};
export function transitionCalibration(
  record: CalibrationRecord,
  action: CalibrationAction,
  now: Date,
  reason?: string,
): CalibrationRecord {
  const match = transitions[action].find(([from]) => from === record.state);
  if (!match) throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
  if (action === 'VOID' && !reason?.trim())
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  return {
    ...record,
    state: match[1],
    approvedAt: action === 'APPROVE' ? now : record.approvedAt,
    becameCurrentAt: action === 'MAKE_CURRENT' ? now : record.becameCurrentAt,
    supersededAt: action === 'SUPERSEDE' ? now : record.supersededAt,
    voidedAt: action === 'VOID' ? now : record.voidedAt,
    voidReason: action === 'VOID' ? reason?.trim() : record.voidReason,
    updatedAt: now,
    version: record.version + 1n,
  };
}
