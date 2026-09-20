import { afterEach, vi } from 'vitest';

process.env.NODE_ENV = 'test';

afterEach(() => {
  // Fake timers are process-global in Vitest. Restore the wall clock before
  // clearing spies so one test cannot silently change another test's time.
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
