import { AppError } from '../../../shared/errors/app-error.js';
import type { LabSample } from './lab-test.js';

/**
 * QC-DATA-003 — a Test Batch / Run inside one laboratory test.
 *
 * One test contains one or more runs. Each run owns its samples, readings and
 * equipment evidence, so a repeat extraction for the same test is a new run
 * with its own numbers instead of an overwrite of the previous one. `sequence`
 * is the run order within the test and is unique per test, matching the
 * `(lab_test_id, sequence)` and `(lab_test_id, batch_no)` constraints.
 *
 * Nothing about how many runs a test may have is invented here: the record
 * carries every run the operator created, in sequence order.
 */
export interface LabBatch {
  id: string;
  batchNo: string;
  label?: string | null;
  sequence: number;
  startedAt: string;
  completedAt?: string | null;
}

export function assertBatches(batches: readonly LabBatch[]): void {
  const ids = new Set<string>();
  const numbers = new Set<string>();
  const sequences = new Set<number>();
  for (const batch of batches) {
    if (!batch.id || !batch.batchNo.trim())
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    if (!Number.isInteger(batch.sequence) || batch.sequence < 1)
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    if (ids.has(batch.id) || numbers.has(batch.batchNo) || sequences.has(batch.sequence))
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    if (batch.completedAt && new Date(batch.completedAt) < new Date(batch.startedAt))
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    ids.add(batch.id);
    numbers.add(batch.batchNo);
    sequences.add(batch.sequence);
  }
}

/**
 * A run's samples must belong to that run and be identifiable inside it. A
 * sample without a run is a legacy test-level sample and is left alone; a
 * sample that names a run the record does not carry is a defect, not an empty
 * run.
 */
export function assertBatchSamples(
  samples: readonly LabSample[],
  batches: readonly LabBatch[],
): void {
  const batchIds = new Set(batches.map((batch) => batch.id));
  const identifiers = new Set<string>();
  for (const sample of samples) {
    if (!sample.identifier.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    if (!sample.batchId) continue;
    if (!batchIds.has(sample.batchId)) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    const key = `${sample.batchId}:${sample.identifier}`;
    if (identifiers.has(key)) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    identifiers.add(key);
  }
}
