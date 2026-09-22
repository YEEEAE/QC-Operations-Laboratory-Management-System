import { AppError } from '../../../shared/errors/app-error.js';
import { validateMeasurement, type MeasurementInput, type Parameter } from './measurement.js';

/**
 * QC-DATA-003 — one captured replicate.
 *
 * A reading is the operator's raw observation for one sample, one approved
 * parameter and one replicate number inside a run. `readingIndex` is the only
 * ordering the system assumes; it is required and 1-based so a run's replicates
 * are unambiguous and idempotent (re-submitting index 3 replaces reading 3, it
 * never appends a fourth).
 *
 * Values are validated exactly like a draft measurement — same data type, same
 * unit, same approved parameter — so a reading can never carry a value shape the
 * parameter does not allow.
 */
export interface ReadingInput extends MeasurementInput {
  readingIndex: number;
}

export interface Reading extends ReadingInput {
  id: string;
  batchId: string;
  enteredBy: string;
  enteredAt: string;
}

const NUMERIC_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;

export function validateReading(input: ReadingInput, parameter: Parameter): ReadingInput {
  if (!Number.isInteger(input.readingIndex) || input.readingIndex < 1)
    throw new AppError('VALIDATION_FAILED', {
      userSafe: true,
      messageKey: 'errors.reading_index_must_be_positive',
    });
  const value = validateMeasurement(
    {
      sampleId: input.sampleId,
      parameterId: input.parameterId,
      raw: input.raw,
      unit: input.unit,
      remarks: input.remarks,
    },
    parameter,
  );
  return { ...value, readingIndex: input.readingIndex };
}

/**
 * The exact decimal text of a captured reading, when the parameter is numeric
 * and the value is an exact decimal. Returns `undefined` for a text/boolean
 * reading or a malformed number; callers never coerce.
 */
export function numericReadingValue(raw: string | boolean | null): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return NUMERIC_PATTERN.test(trimmed) ? trimmed : undefined;
}

/**
 * Every replicate of one (sample, parameter) in a run, ordered by
 * `readingIndex` with no gaps assumed — the operator may number 1,2,5 and the
 * system still reports exactly what was captured.
 */
export function readingsFor(
  readings: readonly Reading[],
  batchId: string,
  sampleId: string,
  parameterId: string,
): Reading[] {
  return readings
    .filter(
      (reading) =>
        reading.batchId === batchId &&
        reading.sampleId === sampleId &&
        reading.parameterId === parameterId,
    )
    .sort((left, right) => left.readingIndex - right.readingIndex);
}

/**
 * Reject a run batch whose replicates collide: `(sample, parameter, index)` is
 * the stored identity of a reading, so a duplicate in one submission is an
 * operator error, not a silent overwrite race.
 */
export function assertUniqueReadings(readings: readonly ReadingInput[]): void {
  const seen = new Set<string>();
  for (const reading of readings) {
    const key = `${reading.sampleId}:${reading.parameterId}:${reading.readingIndex}`;
    if (seen.has(key))
      throw new AppError('VALIDATION_FAILED', {
        userSafe: true,
        messageKey: 'errors.duplicate_reading_index',
      });
    seen.add(key);
  }
}
