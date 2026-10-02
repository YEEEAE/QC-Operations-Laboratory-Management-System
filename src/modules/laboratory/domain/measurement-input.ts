import type { Parameter } from './measurement.js';

/** Convert browser strings only when the frozen parameter declares BOOLEAN. */
export function measurementInputValue(
  dataType: Parameter['dataType'],
  value: string,
): string | boolean {
  if (dataType !== 'BOOLEAN') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}
