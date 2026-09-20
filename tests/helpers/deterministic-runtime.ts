import { vi } from 'vitest';

/**
 * Freeze wall-clock reads and provide a repeatable Math.random stream for a
 * test. `tests/setup/unit.ts` restores both after each test, including failure.
 */
export function useDeterministicRuntime(
  instant: string,
  randomValues: readonly number[] = [0.5],
): { now: () => Date } {
  const epoch = new Date(instant).getTime();
  if (!Number.isFinite(epoch)) throw new RangeError('Deterministic clock instant must be valid.');
  if (
    randomValues.length === 0 ||
    randomValues.some((value) => !Number.isFinite(value) || value < 0 || value >= 1)
  ) {
    throw new RangeError('Deterministic random values must be a non-empty list in [0, 1).');
  }

  vi.useFakeTimers();
  vi.setSystemTime(epoch);

  let cursor = 0;
  vi.spyOn(Math, 'random').mockImplementation(() => {
    const value = randomValues[cursor % randomValues.length]!;
    cursor += 1;
    return value;
  });

  return { now: () => new Date(Date.now()) };
}
