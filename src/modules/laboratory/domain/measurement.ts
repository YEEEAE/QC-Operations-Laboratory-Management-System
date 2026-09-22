import { AppError } from '../../../shared/errors/app-error.js';
import type { CalculationRuleSource } from './calculation.js';
export interface Parameter {
  id: string;
  code: string;
  label: string;
  dataType: 'NUMERIC' | 'TEXT' | 'BOOLEAN';
  unit: string | null;
  required: boolean;
  sourceReference: string;
  criteria: Readonly<Record<string, unknown>>;
  /**
   * Approved acceptance-rule operator for `criteria`. `null`/absent means the
   * template carries no formal rule, so no automated outcome exists for this
   * parameter and the reviewer owns it.
   */
  acceptanceRuleType?: string | null;
  /** QC-DATA-003 approved calculation rule; absent when the reviewer owns the value. */
  calculationRule?: CalculationRuleSource | null;
  precisionGuidance?: string;
  roundingReference?: string;
}
export interface MeasurementInput {
  sampleId: string;
  parameterId: string;
  raw: string | boolean;
  unit: string | null;
  remarks?: string;
}
/**
 * The persisted observation for one (sample, parameter) of a run.
 *
 * `raw` is `null` when the reported value was computed from readings rather
 * than captured: the raw evidence is never lost because every replicate stays
 * in the run's readings, and the aggregate stays in `calculatedValue` with the
 * rule it came from.
 */
export interface Measurement extends Omit<MeasurementInput, 'raw'> {
  id: string;
  raw: string | boolean | null;
  /** QC-DATA-003 run this observation belongs to; absent/null for legacy test-level rows. */
  batchId?: string | null;
  calculatedValue?: string | null;
  calculatedUnit?: string | null;
  calculationRuleReference?: string | null;
  calculationRuleVersion?: string | null;
  calculationInputs?: Readonly<Record<string, unknown>> | null;
  enteredBy: string;
  enteredAt: string;
}
export function validateMeasurement(
  input: MeasurementInput,
  parameter: Parameter,
): MeasurementInput {
  const allowed = ['sampleId', 'parameterId', 'raw', 'unit', 'remarks'];
  if (
    Object.keys(input).some((key) => !allowed.includes(key)) ||
    input.parameterId !== parameter.id ||
    input.unit !== parameter.unit ||
    !parameter.sourceReference.trim()
  )
    throw new AppError('VALIDATION_FAILED');
  if (
    parameter.dataType === 'NUMERIC' &&
    (typeof input.raw !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(input.raw))
  )
    throw new AppError('VALIDATION_FAILED');
  if (parameter.dataType === 'TEXT' && (typeof input.raw !== 'string' || !input.raw.trim()))
    throw new AppError('VALIDATION_FAILED');
  if (parameter.dataType === 'BOOLEAN' && typeof input.raw !== 'boolean')
    throw new AppError('VALIDATION_FAILED');
  if (!['NUMERIC', 'TEXT', 'BOOLEAN'].includes(parameter.dataType))
    throw new AppError('VALIDATION_FAILED');
  return { ...input };
}
