import { describe, expect, it, vi } from 'vitest';
import { useDeterministicRuntime } from '../../helpers/deterministic-runtime.js';
import { createFixtureScope } from '../../helpers/fixture-scope.js';

const wallClockRandom = Math.random;

describe('deterministic test runtime controls', () => {
  it('pins the clock and repeats the declared random sequence', () => {
    const runtime = useDeterministicRuntime('2026-09-20T12:34:56.000Z', [0.125, 0.875]);

    expect(runtime.now().toISOString()).toBe('2026-09-20T12:34:56.000Z');
    expect([Math.random(), Math.random(), Math.random()]).toEqual([0.125, 0.875, 0.125]);
  });

  it('restores global clock and randomness before the next test', () => {
    expect(vi.isFakeTimers()).toBe(false);
    expect(Math.random).toBe(wallClockRandom);
    expect(() => useDeterministicRuntime('not-a-date')).toThrow(/must be valid/);
  });

  it('gives repeatable identities within a test and distinct identities across tests', () => {
    const firstRun = createFixtureScope('tasks', 'create-denied');
    const repeatedRun = createFixtureScope('tasks', 'create-denied');
    const neighboringTest = createFixtureScope('tasks', 'create-allowed');

    expect(firstRun.id('actor')).toBe(repeatedRun.id('actor'));
    expect(firstRun.id('actor')).not.toBe(neighboringTest.id('actor'));
    expect(firstRun.key('command')).not.toBe(neighboringTest.key('command'));
    expect(createFixtureScope('tasks:review', 'denied').id('actor')).not.toBe(
      createFixtureScope('tasks', 'review:denied').id('actor'),
    );
    expect(() => createFixtureScope('', '')).toThrow(/required/);
    expect(() => createFixtureScope('tasks', '  ')).toThrow(/required/);
  });

  it('rejects invalid random streams before changing global runtime state', () => {
    expect(() => useDeterministicRuntime('2026-09-20T00:00:00.000Z', [])).toThrow(/non-empty/);
    expect(() => useDeterministicRuntime('2026-09-20T00:00:00.000Z', [1])).toThrow(/\[0, 1\)/);
    expect(() => useDeterministicRuntime('2026-09-20T00:00:00.000Z', [Number.NaN])).toThrow(
      /\[0, 1\)/,
    );
    expect(vi.isFakeTimers()).toBe(false);
    expect(Math.random).toBe(wallClockRandom);
  });
});
