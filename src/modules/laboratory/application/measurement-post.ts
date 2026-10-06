import { AppError } from '../../../shared/errors/app-error.js';
import type { LabTest } from '../domain/lab-test.js';
import type { MeasurementInput } from '../domain/measurement.js';
import { measurementInputValue } from './measurement-input.js';

/** Native transport uses frozen server point identities, types and units. */
export function decodeMeasurementPost(
  test: Pick<LabTest, 'samples' | 'context'>,
  data: FormData,
): MeasurementInput[] {
  const allowed = new Set(['expectedVersion', 'intent']);
  const measurements: MeasurementInput[] = [];
  for (const sample of test.samples) {
    for (const parameter of test.context.parameters) {
      const point = `${sample.id}:${parameter.id}`;
      const valueKey = `value-${point}`;
      const remarksKey = `remarks-${point}`;
      allowed.add(valueKey);
      allowed.add(remarksKey);
      const value = data.get(valueKey);
      const remarks = data.get(remarksKey);
      if (typeof value !== 'string' || typeof remarks !== 'string') {
        throw new AppError('VALIDATION_FAILED', { userSafe: true });
      }
      if (value === '') {
        if (remarks.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
        continue;
      }
      measurements.push({
        sampleId: sample.id,
        parameterId: parameter.id,
        raw: measurementInputValue(parameter.dataType, value),
        unit: parameter.unit,
        ...(remarks ? { remarks } : {}),
      });
    }
  }
  for (const key of data.keys()) {
    if (!allowed.has(key) || data.getAll(key).length !== 1) {
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    }
  }
  return measurements;
}
