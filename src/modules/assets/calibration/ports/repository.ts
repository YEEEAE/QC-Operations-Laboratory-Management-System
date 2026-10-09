import type { ActorContext } from '../../../../shared/authorization/types.js';
import type {
  CalibrationAction,
  CalibrationRecord,
  CalibrationState,
} from '../domain/calibration.js';
export interface CalibrationHistory {
  id: string;
  calibrationId: string;
  state: CalibrationState;
  action: string;
  snapshot: Readonly<Record<string, unknown>>;
  changedBy: string;
  changedAt: Date;
  recordVersion: bigint;
  requestId: string;
}
export interface CalibrationListFilter {
  state?: CalibrationState;
  equipmentId?: string;
  search?: string;
}
export interface CalibrationRepository {
  listPage?(input: { actor: ActorContext; filter?: CalibrationListFilter; page: import('../../../../shared/pagination/page.js').Page }): Promise<import('../../../../shared/pagination/page.js').PageResult<CalibrationRecord>>;
  create(input: {
    calibration: CalibrationRecord;
    actor: ActorContext;
    requestId: string;
  }): Promise<CalibrationRecord>;
  get(id: string, actor: ActorContext): Promise<CalibrationRecord | undefined>;
  list(input: {
    actor: ActorContext;
    filter?: CalibrationListFilter;
  }): Promise<readonly CalibrationRecord[]>;
  transition(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    action: CalibrationAction;
    reason?: string;
    requestId: string;
  }): Promise<CalibrationRecord>;
  history?(id: string, actor: ActorContext): Promise<readonly CalibrationHistory[]>;
}
