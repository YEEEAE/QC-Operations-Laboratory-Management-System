import type { ActorContext } from '../../../../shared/authorization/types.js';
import type {
  MaintenanceAction,
  MaintenanceRecord,
  MaintenanceState,
} from '../domain/maintenance.js';
export interface MaintenanceHistory {
  id: string;
  maintenanceId: string;
  state: MaintenanceState;
  action: string;
  snapshot: Readonly<Record<string, unknown>>;
  changedBy: string;
  changedAt: Date;
  recordVersion: bigint;
  requestId: string;
}
export interface MaintenanceListFilter {
  state?: MaintenanceState;
  equipmentId?: string;
  search?: string;
}
export interface MaintenanceRepository {
  create(input: {
    maintenance: MaintenanceRecord;
    actor: ActorContext;
    requestId: string;
  }): Promise<MaintenanceRecord>;
  get(id: string, actor: ActorContext): Promise<MaintenanceRecord | undefined>;
  list(input: {
    actor: ActorContext;
    filter?: MaintenanceListFilter;
  }): Promise<readonly MaintenanceRecord[]>;
  transition(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    action: MaintenanceAction;
    reason?: string;
    requestId: string;
  }): Promise<MaintenanceRecord>;
  history?(id: string, actor: ActorContext): Promise<readonly MaintenanceHistory[]>;
}
