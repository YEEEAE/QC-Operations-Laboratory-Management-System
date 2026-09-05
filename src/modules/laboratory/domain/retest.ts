import { AppError } from '../../../shared/errors/app-error.js';
import type { LabTest } from './lab-test.js';
export function assertRetestLink(original:LabTest, next:LabTest) {
  if (original.originalTestId || next.id===original.id || next.originalTestId!==original.id || !next.retestReason?.trim() || !Number.isSafeInteger(next.retestSequence) || next.retestSequence<=0) throw new AppError('VALIDATION_FAILED');
}
