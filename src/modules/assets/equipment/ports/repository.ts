import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { Equipment, EquipmentAction, EquipmentState } from '../domain/equipment.js';
export interface EquipmentStatusHistory {
  id: string;
  equipmentId: string;
  fromState?: EquipmentState;
  toState: EquipmentState;
  action: string;
  reason?: string;
  changedBy: string;
  changedAt: Date;
  equipmentVersion: bigint;
  requestId: string;
}
export interface EquipmentListFilter {
  state?: EquipmentState;
  search?: string;
}
export interface EquipmentRepository {
  create(input: {
    equipment: Equipment;
    actor: ActorContext;
    requestId: string;
  }): Promise<Equipment>;
  get(id: string, actor: ActorContext): Promise<Equipment | undefined>;
  list(input: { actor: ActorContext; filter?: EquipmentListFilter }): Promise<readonly Equipment[]>;
  updateDraft(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    equipmentNo: string;
    name: string;
    manufacturer?: string;
    model?: string;
    serialNo?: string;
    location?: string;
    calibrationRequired?: boolean;
    maintenanceRequired?: boolean;
    requestId: string;
  }): Promise<Equipment>;
  transition(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    action: EquipmentAction;
    reason?: string;
    requestId: string;
  }): Promise<Equipment>;
  history?(id: string, actor: ActorContext): Promise<readonly EquipmentStatusHistory[]>;
}
