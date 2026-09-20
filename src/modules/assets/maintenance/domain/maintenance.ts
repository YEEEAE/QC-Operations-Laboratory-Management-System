import { AppError } from '../../../../shared/errors/app-error.js';
export const MAINTENANCE_STATES = [
  'DRAFT',
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'VOID',
] as const;
export type MaintenanceState = (typeof MAINTENANCE_STATES)[number];
export const MAINTENANCE_TYPES = ['PREVENTIVE', 'CORRECTIVE'] as const;
export type MaintenanceType = (typeof MAINTENANCE_TYPES)[number];
export type MaintenanceAction = 'PLAN' | 'START' | 'COMPLETE' | 'CANCEL' | 'VOID';
export interface MaintenanceRecord {
  id: string;
  maintenanceNo: string;
  equipmentId: string;
  state: MaintenanceState;
  maintenanceType?: string;
  description: string;
  plannedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  performedBy?: string;
  provider?: string;
  result?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  version: bigint;
  downtimeStartedAt?: Date;
  downtimeEndedAt?: Date;
  downtimeMinutes?: number;
}
export interface NewMaintenanceInput {
  id: string;
  maintenanceNo: string;
  equipmentId: string;
  maintenanceType?: string;
  description: string;
  plannedAt?: Date;
  performedBy?: string;
  provider?: string;
  createdBy: string;
  now: Date;
  downtimeStartedAt?: Date;
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
export function createDraftMaintenance(input: NewMaintenanceInput): MaintenanceRecord {
  return {
    id: input.id,
    maintenanceNo: required(input.maintenanceNo, 'maintenanceNo'),
    equipmentId: required(input.equipmentId, 'equipmentId'),
    state: 'DRAFT',
    maintenanceType: optional(input.maintenanceType),
    description: required(input.description, 'description'),
    plannedAt: input.plannedAt,
    performedBy: optional(input.performedBy),
    provider: optional(input.provider),
    createdBy: input.createdBy,
    createdAt: input.now,
    updatedAt: input.now,
    version: 1n,
    downtimeStartedAt: input.downtimeStartedAt,
  };
}
const transitions: Record<MaintenanceAction, readonly [MaintenanceState, MaintenanceState][]> = {
  PLAN: [['DRAFT', 'PLANNED']],
  START: [['PLANNED', 'IN_PROGRESS']],
  COMPLETE: [['IN_PROGRESS', 'COMPLETED']],
  CANCEL: [
    ['DRAFT', 'CANCELLED'],
    ['PLANNED', 'CANCELLED'],
  ],
  VOID: [
    // VOID has no approved TR-MNT edge. The use case and domain both fail closed.
  ],
};
export function transitionMaintenance(
  record: MaintenanceRecord,
  action: MaintenanceAction,
  now: Date,
  reason?: string,
): MaintenanceRecord {
  const match = transitions[action].find(([from]) => from === record.state);
  if (!match) throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
  if (['CANCEL', 'VOID'].includes(action) && !reason?.trim())
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  return {
    ...record,
    state: match[1],
    startedAt: action === 'START' ? now : record.startedAt,
    completedAt: action === 'COMPLETE' ? now : record.completedAt,
    downtimeStartedAt: action === 'START' ? now : record.downtimeStartedAt,
    downtimeEndedAt: action === 'COMPLETE' ? now : record.downtimeEndedAt,
    downtimeMinutes:
      action === 'COMPLETE' && record.downtimeStartedAt
        ? Math.max(0, Math.round((now.getTime() - record.downtimeStartedAt.getTime()) / 60000))
        : record.downtimeMinutes,
    updatedAt: now,
    version: record.version + 1n,
  };
}
