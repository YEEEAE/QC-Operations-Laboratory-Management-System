import type { Kysely } from 'kysely';
import type { DatabaseRow, DatabaseSchema } from '../../../../shared/database/db-types.js';
import type { CalibrationRecord } from '../../calibration/domain/calibration.js';
import type { Equipment } from '../domain/equipment.js';
import type { MaintenanceRecord } from '../../maintenance/domain/maintenance.js';
import type { EquipmentEligibilityReader } from '../application/get-equipment-eligibility.js';
const dateOnly = (value: string | Date): Date => {
  if (value instanceof Date)
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  return new Date(`${value}T00:00:00.000Z`);
};
const mapEquipment = (row: DatabaseRow<'equipment'>): Equipment => ({
  id: row.id,
  equipmentNo: row.equipment_no,
  name: row.name,
  manufacturer: row.manufacturer ?? undefined,
  model: row.model ?? undefined,
  serialNo: row.serial_no ?? undefined,
  location: row.location ?? undefined,
  state: row.state as Equipment['state'],
  currentCalibrationId: row.current_calibration_id ?? undefined,
  commissionedAt: row.commissioned_at ?? undefined,
  decommissionedAt: row.decommissioned_at ?? undefined,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedBy: row.updated_by ?? undefined,
  updatedAt: row.updated_at,
  version: BigInt(row.version),
  calibrationRequired: row.calibration_required ?? undefined,
  maintenanceRequired: row.maintenance_required ?? undefined,
});
const mapCalibration = (row: DatabaseRow<'calibration_records'>): CalibrationRecord => ({
  id: row.id,
  calibrationNo: row.calibration_no,
  equipmentId: row.equipment_id,
  state: row.state as CalibrationRecord['state'],
  calibrationDate: dateOnly(row.calibration_date),
  dueDate: row.due_date ? dateOnly(row.due_date) : undefined,
  provider: row.provider ?? undefined,
  certificateNo: row.certificate_no ?? undefined,
  result: row.result ?? undefined,
  approvedAt: row.approved_at ?? undefined,
  approvedBy: row.approved_by ?? undefined,
  becameCurrentAt: row.became_current_at ?? undefined,
  supersededAt: row.superseded_at ?? undefined,
  voidedAt: row.voided_at ?? undefined,
  voidReason: row.void_reason ?? undefined,
  createdAt: row.created_at,
  createdBy: row.created_by,
  updatedAt: row.updated_at,
  version: BigInt(row.version),
});
const mapMaintenance = (row: DatabaseRow<'maintenance_records'>): MaintenanceRecord => ({
  id: row.id,
  maintenanceNo: row.maintenance_no,
  equipmentId: row.equipment_id,
  state: row.state as MaintenanceRecord['state'],
  maintenanceType: row.maintenance_type ?? undefined,
  description: row.description,
  plannedAt: row.planned_at ?? undefined,
  startedAt: row.started_at ?? undefined,
  completedAt: row.completed_at ?? undefined,
  performedBy: row.performed_by ?? undefined,
  provider: row.provider ?? undefined,
  result: row.result ?? undefined,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  version: BigInt(row.version),
  downtimeStartedAt: row.downtime_started_at ?? undefined,
  downtimeEndedAt: row.downtime_ended_at ?? undefined,
  downtimeMinutes: row.downtime_minutes ?? undefined,
});
export class PostgresEquipmentEligibilityReader implements EquipmentEligibilityReader {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}
  async getEquipment(id: string): Promise<Equipment | undefined> {
    const row = await this.db
      .selectFrom('equipment')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row ? mapEquipment(row) : undefined;
  }
  async getCalibration(id: string): Promise<CalibrationRecord | undefined> {
    const row = await this.db
      .selectFrom('calibration_records')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row ? mapCalibration(row) : undefined;
  }
  async getCurrentMaintenance(equipmentId: string): Promise<MaintenanceRecord | undefined> {
    const row = await this.db
      .selectFrom('maintenance_records')
      .selectAll()
      .where('equipment_id', '=', equipmentId)
      .where('state', '=', 'IN_PROGRESS')
      .orderBy('started_at', 'desc')
      .orderBy('id', 'desc')
      .executeTakeFirst();
    return row ? mapMaintenance(row) : undefined;
  }
  async getAssessmentRecords(equipmentIds: readonly string[]) {
    if (equipmentIds.length === 0) return new Map();
    const equipmentRows = await this.db
      .selectFrom('equipment')
      .selectAll()
      .where('id', 'in', [...equipmentIds])
      .execute();
    const equipment = equipmentRows.map(mapEquipment);
    const calibrationIds = equipment
      .map((item) => item.currentCalibrationId)
      .filter((id): id is string => Boolean(id));
    const calibrationRows = calibrationIds.length
      ? await this.db
          .selectFrom('calibration_records')
          .selectAll()
          .where('id', 'in', calibrationIds)
          .execute()
      : [];
    const maintenanceRows = await this.db
      .selectFrom('maintenance_records')
      .selectAll()
      .where('equipment_id', 'in', [...equipmentIds])
      .where('state', '=', 'IN_PROGRESS')
      .orderBy('equipment_id')
      .orderBy('started_at', 'desc')
      .orderBy('id', 'desc')
      .execute();
    const calibrations = new Map(calibrationRows.map((row) => [row.id, mapCalibration(row)]));
    const maintenances = new Map<string, MaintenanceRecord>();
    for (const row of maintenanceRows) {
      if (!maintenances.has(row.equipment_id))
        maintenances.set(row.equipment_id, mapMaintenance(row));
    }
    return new Map(
      equipment.map((item) => [
        item.id,
        {
          equipment: item,
          calibration: item.currentCalibrationId
            ? calibrations.get(item.currentCalibrationId)
            : undefined,
          maintenance: maintenances.get(item.id),
        },
      ]),
    );
  }
}
