/**
 * QC-DATA-002 §10 — equipment usage context for inspection reports, mirroring
 * the laboratory EquipmentContext shape so the shared assets eligibility
 * policy can verify both without divergence.
 */
export interface EquipmentContext {
  equipmentId: string;
  calibrationRecordId: string;
  usedAt: string;
  equipmentSnapshot: Readonly<Record<string, unknown>>;
  calibrationSnapshot: Readonly<Record<string, unknown>>;
  usageRole?: string;
  /** Server-evaluated verification rows (§11), when the form uses them. */
  verifications?: readonly {
    standardReading: string;
    equipmentReading: string;
    tolerance: string;
    difference: string;
    result: 'PASS' | 'FAIL';
  }[];
}
