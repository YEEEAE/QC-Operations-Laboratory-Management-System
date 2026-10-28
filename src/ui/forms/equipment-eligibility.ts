import type { EquipmentEligibilityAssessment } from '../../modules/assets/equipment/application/get-equipment-eligibility.js';

const reasonText: Record<NonNullable<EquipmentEligibilityAssessment['reason']>, string> = {
  UNDER_MAINTENANCE: 'under maintenance',
  OUT_OF_SERVICE: 'out of service',
  NOT_ACTIVE: 'not active',
  NO_CURRENT_CALIBRATION: 'no current calibration is recorded',
  CALIBRATION_NOT_CURRENT: 'the linked calibration is not current',
  CALIBRATION_EXPIRED: 'calibration due date has passed',
};

const date = (value?: Date) =>
  value ? value.toLocaleDateString('en-SA', { timeZone: 'Asia/Riyadh' }) : 'not supplied';

export function equipmentEligibilityOptionLabel(
  identity: string,
  assessment: EquipmentEligibilityAssessment,
  options: { includeSourceStates?: boolean } = {},
) {
  const eligibility = assessment.eligible
    ? assessment.status
    : `${assessment.status}: ${reasonText[assessment.reason ?? 'NOT_ACTIVE']}`;
  const calibration = assessment.calibrationNo
    ? `Calibration ${assessment.calibrationNo}, calibrated ${date(assessment.calibrationDate)}, due ${date(assessment.dueDate)}`
    : 'No current calibration record';
  const maintenance = assessment.maintenanceNo
    ? `Maintenance ${assessment.maintenanceNo}, ${assessment.maintenanceStartedAt ? `in progress since ${date(assessment.maintenanceStartedAt)}` : `scheduled ${date(assessment.maintenancePlannedAt)}`}`
    : assessment.reason === 'UNDER_MAINTENANCE'
      ? 'Maintenance start date not supplied'
      : '';
  const sourceStates = options.includeSourceStates
    ? [
        `Equipment state ${assessment.equipmentState ?? 'not supplied'}`,
        `Calibration state ${assessment.calibrationState ?? 'not supplied'}`,
        `Maintenance state ${assessment.maintenanceState ?? 'not supplied'}`,
      ]
    : [];
  return [identity, ...sourceStates, eligibility, calibration, maintenance].filter(Boolean).join(' · ');
}
