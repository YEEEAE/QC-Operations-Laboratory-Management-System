import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { EquipmentContext } from '../application/inspection-equipment.js';

/**
 * QC-DATA-002 §10 — persistence port for inspection→equipment→calibration
 * usage rows. Snapshots travel with the usage row so the historical fact
 * survives later calibration churn.
 */
export interface InspectionEquipmentRepository {
  link(i: {
    id: string;
    inspectionReportId: string;
    usage: EquipmentContext;
    actor: ActorContext;
    requestId: string;
  }): Promise<void>;
  listForReport(inspectionReportId: string): Promise<EquipmentContext[]>;
}
