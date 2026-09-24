import { describe, expect, it } from 'vitest';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { GetEquipmentEligibilityUseCase } from '../../../src/modules/assets/equipment/application/get-equipment-eligibility.js';
import type { Equipment } from '../../../src/modules/assets/equipment/domain/equipment.js';
import type { CalibrationRecord } from '../../../src/modules/assets/calibration/domain/calibration.js';
import type { MaintenanceRecord } from '../../../src/modules/assets/maintenance/domain/maintenance.js';
import { equipmentEligibilityOptionLabel } from '../../../src/ui/forms/equipment-eligibility.js';

const equipmentId = '00000000-0000-7000-8000-000000000002';
const calibrationId = '00000000-0000-7000-8000-000000000003';
const equipment: Equipment = {
  id: equipmentId,
  equipmentNo: 'EQ-1',
  name: 'Balance',
  manufacturer: 'Maker',
  model: 'M-1',
  serialNo: 'S-1',
  state: 'ACTIVE',
  currentCalibrationId: calibrationId,
  calibrationRequired: true,
  createdBy: '00000000-0000-7000-8000-000000000001',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  version: 7n,
};
const calibration: CalibrationRecord = {
  id: calibrationId,
  calibrationNo: 'CAL-1',
  equipmentId,
  state: 'CURRENT',
  calibrationDate: new Date('2026-01-01T00:00:00.000Z'),
  dueDate: new Date('2027-01-01T00:00:00.000Z'),
  certificateNo: 'CERT-1',
  provider: 'Lab A',
  createdBy: equipment.createdBy,
  createdAt: equipment.createdAt,
  updatedAt: equipment.updatedAt,
  version: 4n,
};
const maintenance: MaintenanceRecord = {
  id: '00000000-0000-7000-8000-000000000004',
  maintenanceNo: 'MNT-1',
  equipmentId,
  state: 'IN_PROGRESS',
  description: 'Repair',
  startedAt: new Date('2026-05-20T09:00:00.000Z'),
  createdBy: equipment.createdBy,
  createdAt: equipment.createdAt,
  updatedAt: equipment.updatedAt,
  version: 2n,
};
const actor: ActorContext = {
  id: equipment.createdBy,
  accountState: 'ACTIVE' as const,
  roles: [],
  permissions: [
    { code: 'PERM-EQP-VIEW', scopes: ['GLOBAL'] as const },
    { code: 'PERM-CAL-VIEW', scopes: ['GLOBAL'] as const },
    { code: 'PERM-MNT-VIEW', scopes: ['GLOBAL'] as const },
  ],
};
const context = {
  templateVersionId: 'template-v1',
  versionNo: '1',
  methodReference: 'METHOD-1',
  sourceReference: 'SOURCE-1',
  contentHash: 'hash',
  parameters: [],
  documents: [],
  equipment: [],
  source: {},
  requirementsReference: 'METHOD-1',
};

describe('equipment eligibility capture', () => {
  it('assesses eligible equipment with its current calibration dates', async () => {
    const useCase = new GetEquipmentEligibilityUseCase(
      { getEquipment: async () => equipment, getCalibration: async () => calibration },
      () => new Date('2026-06-01T00:00:00.000Z'),
    );
    await expect(useCase.assess(actor, equipmentId)).resolves.toMatchObject({
      eligible: true,
      calibrationNo: 'CAL-1',
      calibrationDate: calibration.calibrationDate,
      dueDate: calibration.dueDate,
    });
  });

  it.each([
    [
      'expired calibration',
      { ...calibration, dueDate: new Date('2026-01-01T00:00:00.000Z') },
      'CALIBRATION_EXPIRED',
    ],
    ['equipment under maintenance', calibration, 'UNDER_MAINTENANCE'],
  ] as const)(
    'returns the source reason for %s',
    async (_name, currentCalibration, expectedReason) => {
      const useCase = new GetEquipmentEligibilityUseCase(
        {
          getEquipment: async () =>
            expectedReason === 'UNDER_MAINTENANCE'
              ? { ...equipment, state: 'UNDER_MAINTENANCE' }
              : equipment,
          getCalibration: async () => currentCalibration,
          getCurrentMaintenance: async () =>
            expectedReason === 'UNDER_MAINTENANCE' ? maintenance : undefined,
        },
        () => new Date('2026-06-01T00:00:00.000Z'),
      );
      await expect(useCase.assess(actor, equipmentId)).resolves.toMatchObject({
        eligible: false,
        reason: expectedReason,
        ...(expectedReason === 'UNDER_MAINTENANCE'
          ? { maintenanceNo: 'MNT-1', maintenanceStartedAt: maintenance.startedAt }
          : {}),
      });
    },
  );

  it('builds immutable usage snapshots from trusted source records and server time', async () => {
    const now = new Date('2026-06-01T12:30:00.000Z');
    const useCase = new GetEquipmentEligibilityUseCase(
      { getEquipment: async () => equipment, getCalibration: async () => calibration },
      () => now,
    );
    const captured = await useCase.capture({
      actor,
      usage: { equipmentId, calibrationRecordId: calibrationId, usageRole: 'MEASUREMENT' },
      context,
    });
    expect(captured.usedAt).toBe(now.toISOString());
    expect(captured.equipmentSnapshot).toMatchObject({
      equipmentNo: 'EQ-1',
      state: 'ACTIVE',
      version: '7',
    });
    expect(captured.calibrationSnapshot).toMatchObject({
      calibrationNo: 'CAL-1',
      dueDate: calibration.dueDate!.toISOString(),
      certificateNo: 'CERT-1',
      version: '4',
    });
    expect(Object.isFrozen(captured.equipmentSnapshot)).toBe(true);
    expect(Object.isFrozen(captured.calibrationSnapshot)).toBe(true);
  });

  it.each([
    ['expired calibration', equipment, { ...calibration, dueDate: new Date('2026-01-01T00:00:00.000Z') }],
    ['equipment under maintenance', { ...equipment, state: 'UNDER_MAINTENANCE' as const }, calibration],
  ])('rejects server-side capture for %s', async (_name, sourceEquipment, sourceCalibration) => {
    const useCase = new GetEquipmentEligibilityUseCase(
      {
        getEquipment: async () => sourceEquipment,
        getCalibration: async () => sourceCalibration,
        getCurrentMaintenance: async () =>
          sourceEquipment.state === 'UNDER_MAINTENANCE' ? maintenance : undefined,
      },
      () => new Date('2026-06-01T00:00:00.000Z'),
    );
    await expect(
      useCase.capture({
        actor,
        usage: { equipmentId, calibrationRecordId: calibrationId, usageRole: 'MEASUREMENT' },
        context,
      }),
    ).rejects.toThrow();
  });

  it('exposes the eligibility reason and calibration dates in a selectable equipment label', () => {
    const label = equipmentEligibilityOptionLabel('EQ-1 · Balance', {
      eligible: false,
      reason: 'UNDER_MAINTENANCE',
      equipmentState: 'ACTIVE',
      calibrationNo: 'CAL-1',
      calibrationDate: calibration.calibrationDate,
      dueDate: new Date('2026-01-01T00:00:00.000Z'),
      maintenanceNo: 'MNT-1',
      maintenanceState: 'IN_PROGRESS',
      maintenanceStartedAt: maintenance.startedAt,
    });
    expect(label).toContain('Not eligible: under maintenance');
    expect(label).toContain('Calibration CAL-1');
    expect(label).toContain('calibrated');
    expect(label).toContain('due');
    expect(label).toContain('Maintenance MNT-1, in progress since');
  });
});
