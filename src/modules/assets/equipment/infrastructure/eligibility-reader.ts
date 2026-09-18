import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../../shared/database/db-types.js';
import type { CalibrationRecord } from '../../calibration/domain/calibration.js';
import type { Equipment } from '../domain/equipment.js';
import type { EquipmentEligibilityReader } from '../application/get-equipment-eligibility.js';
const dateOnly = (value: string | Date): Date => {
  if (value instanceof Date)
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  return new Date(`${value}T00:00:00.000Z`);
};
export class PostgresEquipmentEligibilityReader implements EquipmentEligibilityReader {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}
  async getEquipment(id: string): Promise<Equipment | undefined> {
    const row = await this.db
      .selectFrom('equipment')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row
      ? {
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
        }
      : undefined;
  }
  async getCalibration(id: string): Promise<CalibrationRecord | undefined> {
    const row = await this.db
      .selectFrom('calibration_records')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row
      ? {
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
        }
      : undefined;
  }
}
