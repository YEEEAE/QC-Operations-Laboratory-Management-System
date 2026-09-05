import { AppError } from '../../../../shared/errors/app-error.js';

export const EQUIPMENT_STATES = ['DRAFT', 'ACTIVE', 'OUT_OF_SERVICE', 'UNDER_MAINTENANCE', 'DECOMMISSIONED'] as const;
export type EquipmentState = (typeof EQUIPMENT_STATES)[number];
export type EquipmentAction = 'ACTIVATE' | 'OUT_OF_SERVICE' | 'START_MAINTENANCE' | 'RETURN_TO_SERVICE' | 'DECOMMISSION';

export interface Equipment {
  id: string; equipmentNo: string; name: string; manufacturer?: string; model?: string; serialNo?: string;
  location?: string; state: EquipmentState; currentCalibrationId?: string; commissionedAt?: Date; decommissionedAt?: Date;
  createdBy: string; createdAt: Date; updatedBy?: string; updatedAt: Date; version: bigint;
}

export interface NewEquipmentInput {
  id: string; equipmentNo: string; name: string; manufacturer?: string; model?: string; serialNo?: string;
  location?: string; createdBy: string; now: Date;
}

const required = (value: string, field: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new AppError('VALIDATION_FAILED', { userSafe: true, fieldErrors: { [field]: ['required'] } });
  return normalized;
};
const optional = (value?: string): string | undefined => value?.trim() || undefined;

export function createDraftEquipment(input: NewEquipmentInput): Equipment {
  return {
    id: input.id, equipmentNo: required(input.equipmentNo, 'equipmentNo'), name: required(input.name, 'name'),
    manufacturer: optional(input.manufacturer), model: optional(input.model), serialNo: optional(input.serialNo),
    location: optional(input.location), state: 'DRAFT', createdBy: input.createdBy, createdAt: input.now,
    updatedAt: input.now, version: 1n,
  };
}

export function updateDraftEquipment(equipment: Equipment, input: Pick<NewEquipmentInput, 'equipmentNo' | 'name' | 'manufacturer' | 'model' | 'serialNo' | 'location'>, now: Date): Equipment {
  if (equipment.state !== 'DRAFT') throw new AppError('AUTHZ_DENIED', { userSafe: true });
  return { ...equipment, equipmentNo: required(input.equipmentNo, 'equipmentNo'), name: required(input.name, 'name'), manufacturer: optional(input.manufacturer), model: optional(input.model), serialNo: optional(input.serialNo), location: optional(input.location), updatedAt: now, version: equipment.version + 1n };
}

const transitions: Record<EquipmentAction, readonly [EquipmentState, EquipmentState][]> = {
  ACTIVATE: [['DRAFT', 'ACTIVE']], OUT_OF_SERVICE: [['ACTIVE', 'OUT_OF_SERVICE']],
  START_MAINTENANCE: [['ACTIVE', 'UNDER_MAINTENANCE'], ['OUT_OF_SERVICE', 'UNDER_MAINTENANCE']],
  RETURN_TO_SERVICE: [['UNDER_MAINTENANCE', 'ACTIVE'], ['OUT_OF_SERVICE', 'ACTIVE']],
  DECOMMISSION: [['ACTIVE', 'DECOMMISSIONED'], ['OUT_OF_SERVICE', 'DECOMMISSIONED'], ['UNDER_MAINTENANCE', 'DECOMMISSIONED']],
};

export function transitionEquipment(equipment: Equipment, action: EquipmentAction, now: Date, reason?: string, activationPolicySatisfied = false): Equipment {
  const match = transitions[action].find(([from]) => from === equipment.state);
  if (!match) throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
  if (['OUT_OF_SERVICE', 'DECOMMISSION'].includes(action) && !reason?.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
  if (action === 'ACTIVATE' && !activationPolicySatisfied) throw new AppError('AUTHZ_DENIED', { userSafe: true, messageKey: 'assets.equipment.activationPolicyUnresolved' });
  const next = match[1];
  return { ...equipment, state: next, commissionedAt: action === 'ACTIVATE' ? now : equipment.commissionedAt, decommissionedAt: action === 'DECOMMISSION' ? now : equipment.decommissionedAt, updatedAt: now, version: equipment.version + 1n };
}
