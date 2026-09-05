import { AppError } from '../../../shared/errors/app-error.js';
import type { LabState } from './lab-state.js';
import type { Measurement, Parameter } from './measurement.js';
export interface EquipmentContext { equipmentId:string; calibrationRecordId:string; usedAt:string; equipmentSnapshot:Readonly<Record<string,unknown>>; calibrationSnapshot:Readonly<Record<string,unknown>> }
export interface DocumentContext { documentVersionId:string; usageType:string; snapshot:Readonly<Record<string,unknown>> }
/** Resolved by trusted capabilities, never accepted from Delivery. */
export interface ControlledContext {
  templateVersionId:string; versionNo:string; methodReference:string; sourceReference:string; contentHash:string;
  parameters:readonly Parameter[]; documents:readonly DocumentContext[]; equipment:readonly EquipmentContext[];
  source:Readonly<Record<string,unknown>>; requirementsReference:string;
}
export interface LabSample { id:string; identifier:string }
export interface LabTest {
  id:string; labTestNo:string; state:LabState; scientificResult:'PASS'|'FAIL'|'HOLD'|null;
  authorId:string; createdBy:string; version:bigint; context:ControlledContext;
  samples:readonly LabSample[]; measurements:readonly Measurement[];
  originalTestId:string|null; retestSequence:number; retestReason:string|null;
  createdAt:string; updatedAt:string; submittedAt:string|null; reviewStartedAt:string|null; approvedAt:string|null;
}
export function assertContext(context:ControlledContext) {
  if (!context.templateVersionId || !context.versionNo || !context.methodReference || !context.sourceReference || !context.contentHash || !context.requirementsReference || !context.parameters.length) throw new AppError('AUTHZ_DENIED');
  if (new Set(context.parameters.map(p=>p.id)).size !== context.parameters.length || context.parameters.some(p=>!p.sourceReference || !p.criteria)) throw new AppError('VALIDATION_FAILED');
  for (const equipment of context.equipment) if (!equipment.equipmentId || !equipment.calibrationRecordId || !equipment.usedAt || !equipment.equipmentSnapshot || !equipment.calibrationSnapshot) throw new AppError('AUTHZ_DENIED');
  for (const document of context.documents) if (!document.documentVersionId || !document.usageType || !document.snapshot) throw new AppError('AUTHZ_DENIED');
}
export function assertComplete(test:LabTest) {
  assertContext(test.context);
  if (!test.samples.length || test.samples.some(s=>!s.identifier.trim())) throw new AppError('VALIDATION_FAILED');
  for (const sample of test.samples) for (const parameter of test.context.parameters.filter(p=>p.required)) {
    if (!test.measurements.some(m=>m.sampleId===sample.id && m.parameterId===parameter.id)) throw new AppError('VALIDATION_FAILED');
  }
}
