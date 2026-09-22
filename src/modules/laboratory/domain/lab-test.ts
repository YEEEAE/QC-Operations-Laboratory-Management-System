import { AppError } from '../../../shared/errors/app-error.js';
import type { LabState } from './lab-state.js';
import { assertBatchSamples, assertBatches, type LabBatch } from './lab-batch.js';
import type { Measurement, Parameter } from './measurement.js';
import type { Reading } from './reading.js';
import type { LabSampleResultRecord, SampleResult } from './sample-result.js';
/**
 * QC-DATA-003 derived overall result evidence.
 *
 * This is the aggregate of the run-level sample results the reviewer sees. It
 * is evidence only: the official `scientificResult` still comes from the
 * approved evaluation source at stage-1 approval.
 */
export interface DerivedResult {
  result: SampleResult;
  source: string;
  /** Stable hash of the exact sample results the aggregate came from. */
  inputsHash: string;
  computedAt: string;
}
export interface EquipmentContext {
  equipmentId: string;
  calibrationRecordId: string;
  usedAt: string;
  /**
   * QC-DATA-003: how the equipment was used on the run (e.g. MEASUREMENT).
   * Kept in step with the inspection-side shape so the shared Assets
   * eligibility policy can verify both without divergence.
   */
  usageRole?: string;
  equipmentSnapshot: Readonly<Record<string, unknown>>;
  calibrationSnapshot: Readonly<Record<string, unknown>>;
}
export interface DocumentContext {
  documentVersionId: string;
  usageType: string;
  snapshot: Readonly<Record<string, unknown>>;
}
/** Resolved by trusted capabilities, never accepted from Delivery. */
export interface ControlledContext {
  templateVersionId: string;
  versionNo: string;
  methodReference: string;
  sourceReference: string;
  contentHash: string;
  parameters: readonly Parameter[];
  documents: readonly DocumentContext[];
  equipment: readonly EquipmentContext[];
  source: Readonly<Record<string, unknown>>;
  requirementsReference: string;
}
export interface LabSample {
  id: string;
  identifier: string;
  /** QC-DATA-003 run this sample belongs to; absent/null for legacy test-level samples. */
  batchId?: string | null;
}
export interface LabTest {
  id: string;
  labTestNo: string;
  state: LabState;
  scientificResult: 'PASS' | 'FAIL' | 'HOLD' | null;
  authorId: string;
  createdBy: string;
  version: bigint;
  context: ControlledContext;
  samples: readonly LabSample[];
  measurements: readonly Measurement[];
  /** QC-DATA-003 runs, replicates and derived sample results; empty for a legacy record. */
  batches?: readonly LabBatch[];
  readings?: readonly Reading[];
  sampleResults?: readonly LabSampleResultRecord[];
  derivedResult?: DerivedResult | null;
  originalTestId: string | null;
  retestSequence: number;
  retestReason: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  reviewStartedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
}
export function assertContext(context: ControlledContext) {
  if (
    !context.templateVersionId ||
    !context.versionNo ||
    !context.methodReference ||
    !context.sourceReference ||
    !context.contentHash ||
    !context.requirementsReference ||
    !context.parameters.length
  )
    throw new AppError('AUTHZ_DENIED');
  if (
    new Set(context.parameters.map((p) => p.id)).size !== context.parameters.length ||
    context.parameters.some((p) => !p.sourceReference || !p.criteria)
  )
    throw new AppError('VALIDATION_FAILED');
  for (const equipment of context.equipment)
    if (
      !equipment.equipmentId ||
      !equipment.calibrationRecordId ||
      !equipment.usedAt ||
      !equipment.equipmentSnapshot ||
      !equipment.calibrationSnapshot
    )
      throw new AppError('AUTHZ_DENIED');
  for (const document of context.documents)
    if (!document.documentVersionId || !document.usageType || !document.snapshot)
      throw new AppError('AUTHZ_DENIED');
}
export function assertComplete(test: LabTest) {
  assertContext(test.context);
  if (!test.samples.length || test.samples.some((s) => !s.identifier.trim()))
    throw new AppError('VALIDATION_FAILED');
  const batches = test.batches ?? [];
  assertBatches(batches);
  assertBatchSamples(test.samples, batches);
  const readings = test.readings ?? [];
  for (const sample of test.samples)
    for (const parameter of test.context.parameters.filter((p) => p.required)) {
      if (
        !test.measurements.some((m) => m.sampleId === sample.id && m.parameterId === parameter.id)
      )
        throw new AppError('VALIDATION_FAILED');
      // QC-DATA-003: inside a run, a required parameter must carry at least one
      // captured replicate for the sample. The reviewer is never asked to
      // approve a run whose required evidence was not recorded.
      if (
        sample.batchId &&
        !readings.some((r) => r.sampleId === sample.id && r.parameterId === parameter.id)
      )
        throw new AppError('VALIDATION_FAILED');
    }
}
