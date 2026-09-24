import { AppError } from '../../../../shared/errors/app-error.js';
import { isUuid } from '../../../../shared/id/uuid.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { ControlledContext, EquipmentContext } from '../../../laboratory/domain/lab-test.js';
import type { CalibrationRecord } from '../../calibration/domain/calibration.js';
import type { Equipment } from '../domain/equipment.js';
import type { MaintenanceRecord } from '../../maintenance/domain/maintenance.js';
import { isCalibrationOverdue } from '../../calibration/domain/calibration.js';
import type { EquipmentEligibility } from '../ports/equipment-eligibility.js';
import { authorize } from '../../../../shared/authorization/authorize.js';
export interface EquipmentEligibilityReader {
  getEquipment(id: string): Promise<Equipment | undefined>;
  getCalibration(id: string): Promise<CalibrationRecord | undefined>;
  getCurrentMaintenance?(equipmentId: string): Promise<MaintenanceRecord | undefined>;
}
export interface EquipmentUsageRequest {
  equipmentId: string;
  calibrationRecordId: string;
  usageRole?: string;
}
export interface EquipmentEligibilityAssessment {
  eligible: boolean;
  reason?:
    | 'UNDER_MAINTENANCE'
    | 'OUT_OF_SERVICE'
    | 'NOT_ACTIVE'
    | 'NO_CURRENT_CALIBRATION'
    | 'CALIBRATION_NOT_CURRENT'
    | 'CALIBRATION_EXPIRED';
  equipmentState?: Equipment['state'];
  calibrationNo?: string;
  calibrationState?: CalibrationRecord['state'];
  calibrationDate?: Date;
  dueDate?: Date;
  maintenanceNo?: string;
  maintenanceState?: MaintenanceRecord['state'];
  maintenanceStartedAt?: Date;
  maintenancePlannedAt?: Date;
}
export class GetEquipmentEligibilityUseCase implements EquipmentEligibility {
  constructor(
    private readonly reader: EquipmentEligibilityReader,
    private readonly now = () => new Date(),
  ) {}
  async assess(actor: ActorContext, equipmentId: string): Promise<EquipmentEligibilityAssessment> {
    if (!isUuid(equipmentId)) return { eligible: false, reason: 'NOT_ACTIVE' };
    const equipment = await this.reader.getEquipment(equipmentId);
    if (!equipment) return { eligible: false, reason: 'NOT_ACTIVE' };
    const calibration = equipment.currentCalibrationId
      ? await this.reader.getCalibration(equipment.currentCalibrationId)
      : undefined;
    const maintenance = await this.reader.getCurrentMaintenance?.(equipment.id);
    this.authorizeSourceReads(actor, equipment, calibration, maintenance);
    const base = {
      equipmentState: equipment.state,
      ...(calibration
        ? {
            calibrationNo: calibration.calibrationNo,
            calibrationState: calibration.state,
            calibrationDate: calibration.calibrationDate,
            dueDate: calibration.dueDate,
          }
        : {}),
      ...(maintenance
        ? {
            maintenanceNo: maintenance.maintenanceNo,
            maintenanceState: maintenance.state,
            maintenanceStartedAt: maintenance.startedAt,
            maintenancePlannedAt: maintenance.plannedAt,
          }
        : {}),
    };
    if (equipment.state !== 'ACTIVE')
      return {
        ...base,
        eligible: false,
        reason:
          equipment.state === 'UNDER_MAINTENANCE'
            ? 'UNDER_MAINTENANCE'
            : equipment.state === 'OUT_OF_SERVICE'
              ? 'OUT_OF_SERVICE'
              : 'NOT_ACTIVE',
      };
    if (!equipment.currentCalibrationId || !calibration)
      return { ...base, eligible: false, reason: 'NO_CURRENT_CALIBRATION' };
    if (calibration.equipmentId !== equipment.id || calibration.state !== 'CURRENT')
      return { ...base, eligible: false, reason: 'CALIBRATION_NOT_CURRENT' };
    if (isCalibrationOverdue(calibration, this.now()))
      return { ...base, eligible: false, reason: 'CALIBRATION_EXPIRED' };
    return { ...base, eligible: true };
  }
  async verify(input: {
    actor: ActorContext;
    equipment: readonly EquipmentContext[];
    context: ControlledContext;
  }): Promise<void> {
    for (const usage of input.equipment) {
      if (
        !isUuid(usage.equipmentId) ||
        !isUuid(usage.calibrationRecordId) ||
        Number.isNaN(new Date(usage.usedAt).getTime())
      )
        throw new AppError('AUTHZ_DENIED', {
          userSafe: true,
          messageKey: 'assets.eligibility.invalidContext',
        });
      const equipment = await this.reader.getEquipment(usage.equipmentId);
      const calibration = await this.reader.getCalibration(usage.calibrationRecordId);
      const maintenance = equipment
        ? await this.reader.getCurrentMaintenance?.(equipment.id)
        : undefined;
      if (equipment && calibration)
        this.authorizeSourceReads(input.actor, equipment, calibration, maintenance);
      if (
        !equipment ||
        !calibration ||
        calibration.equipmentId !== equipment.id ||
        equipment.state !== 'ACTIVE' ||
        equipment.currentCalibrationId !== calibration.id ||
        calibration.state !== 'CURRENT'
      )
        throw new AppError('AUTHZ_DENIED', {
          userSafe: true,
          messageKey: 'assets.eligibility.invalidContext',
        });
      if (isCalibrationOverdue(calibration, this.now()))
        throw new AppError('AUTHZ_DENIED', {
          userSafe: true,
          messageKey: 'assets.eligibility.calibrationExpired',
        });
      if (
        !Object.keys(usage.equipmentSnapshot).length ||
        usage.equipmentSnapshot.equipmentId !== equipment.id ||
        !Object.keys(usage.calibrationSnapshot).length ||
        usage.calibrationSnapshot.calibrationRecordId !== calibration.id
      )
        throw new AppError('AUTHZ_DENIED', {
          userSafe: true,
          messageKey: 'assets.eligibility.snapshotMismatch',
        });
    }
  }

  /** Resolve and freeze the source records on the server at the point of use. */
  async capture(input: {
    actor: ActorContext;
    usage: EquipmentUsageRequest;
    context: ControlledContext;
  }): Promise<EquipmentContext> {
    const { usage } = input;
    if (!isUuid(usage.equipmentId) || !isUuid(usage.calibrationRecordId))
      throw new AppError('AUTHZ_DENIED', {
        userSafe: true,
        messageKey: 'assets.eligibility.invalidContext',
      });
    const equipment = await this.reader.getEquipment(usage.equipmentId);
    const calibration = await this.reader.getCalibration(usage.calibrationRecordId);
    const maintenance = equipment
      ? await this.reader.getCurrentMaintenance?.(equipment.id)
      : undefined;
    if (equipment && calibration)
      this.authorizeSourceReads(input.actor, equipment, calibration, maintenance);
    if (
      !equipment ||
      !calibration ||
      calibration.equipmentId !== equipment.id ||
      equipment.state !== 'ACTIVE' ||
      equipment.currentCalibrationId !== calibration.id ||
      calibration.state !== 'CURRENT'
    )
      throw new AppError('AUTHZ_DENIED', {
        userSafe: true,
        messageKey: 'assets.eligibility.invalidContext',
      });
    if (isCalibrationOverdue(calibration, this.now()))
      throw new AppError('AUTHZ_DENIED', {
        userSafe: true,
        messageKey: 'assets.eligibility.calibrationExpired',
      });
    const capturedAt = this.now().toISOString();
    return {
      equipmentId: equipment.id,
      calibrationRecordId: calibration.id,
      usedAt: capturedAt,
      ...(usage.usageRole ? { usageRole: usage.usageRole } : {}),
      equipmentSnapshot: Object.freeze({
        equipmentId: equipment.id,
        equipmentNo: equipment.equipmentNo,
        name: equipment.name,
        manufacturer: equipment.manufacturer ?? null,
        model: equipment.model ?? null,
        serialNo: equipment.serialNo ?? null,
        state: equipment.state,
        currentCalibrationId: equipment.currentCalibrationId ?? null,
        calibrationRequired: equipment.calibrationRequired ?? null,
        maintenanceRequired: equipment.maintenanceRequired ?? null,
        version: equipment.version.toString(),
        capturedAt,
      }),
      calibrationSnapshot: Object.freeze({
        calibrationRecordId: calibration.id,
        calibrationNo: calibration.calibrationNo,
        equipmentId: calibration.equipmentId,
        state: calibration.state,
        calibrationDate: calibration.calibrationDate.toISOString(),
        dueDate: calibration.dueDate?.toISOString() ?? null,
        provider: calibration.provider ?? null,
        certificateNo: calibration.certificateNo ?? null,
        result: calibration.result ?? null,
        version: calibration.version.toString(),
        capturedAt,
      }),
    };
  }

  private authorizeSourceReads(
    actor: ActorContext,
    equipment: Equipment,
    calibration?: CalibrationRecord,
    maintenance?: MaintenanceRecord,
  ) {
    authorize(
      {
        actor,
        permission: 'PERM-EQP-VIEW',
        action: 'VIEW',
        entity: {
          type: 'EQUIPMENT',
          id: equipment.id,
          state: equipment.state,
          ownerId: equipment.createdBy,
        },
        scope: { ownerId: equipment.createdBy },
        currentVersion: equipment.version,
        expectedVersion: equipment.version,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    if (calibration)
      authorize(
        {
          actor,
          permission: 'PERM-CAL-VIEW',
          action: 'VIEW',
          entity: {
            type: 'CALIBRATION_RECORD',
            id: calibration.id,
            state: calibration.state,
            ownerId: calibration.createdBy,
          },
          scope: { ownerId: calibration.createdBy },
          currentVersion: calibration.version,
          expectedVersion: calibration.version,
          businessCondition: true,
        },
        { throwOnDeny: true },
      );
    if (maintenance)
      authorize(
        {
          actor,
          permission: 'PERM-MNT-VIEW',
          action: 'VIEW',
          entity: {
            type: 'MAINTENANCE_RECORD',
            id: maintenance.id,
            state: maintenance.state,
            ownerId: maintenance.createdBy,
          },
          scope: { ownerId: maintenance.createdBy },
          currentVersion: maintenance.version,
          expectedVersion: maintenance.version,
          businessCondition: true,
        },
        { throwOnDeny: true },
      );
  }
}
