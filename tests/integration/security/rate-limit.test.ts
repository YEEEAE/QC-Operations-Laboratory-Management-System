import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  InMemoryRateLimitStore,
  parseRateLimitPolicy,
  RateLimiter,
  resolveHighRiskRateLimitPolicy,
  type RateLimitPolicy,
} from '../../../src/shared/security/rate-limit';
import type { RateLimitStore } from '../../../src/shared/security/rate-limit-store';
import { PostgresRateLimitStore } from '../../../src/shared/security/postgres-rate-limit-store';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container';
import { getTestDatabaseUrl } from '../../helpers/test-env';
import { createPool } from '../../../src/shared/database/pool';

/** Test thresholds only — production thresholds are policy/config-dependent. */
const TEST_POLICY: RateLimitPolicy = { name: 'LOGIN', maxRequests: 3, windowSeconds: 60 };

function fixedClock(startMs: number) {
  let now = startMs;
  return { now: () => now, advance: (ms: number) => (now += ms) };
}

describe('rate limiter (test thresholds)', () => {
  it('allows requests up to the configured maximum inside one window', async () => {
    const limiter = new RateLimiter(new InMemoryRateLimitStore());
    const first = await limiter.check(TEST_POLICY, 'ip-1');
    const second = await limiter.check(TEST_POLICY, 'ip-1');
    const third = await limiter.check(TEST_POLICY, 'ip-1');
    expect([first.allowed, second.allowed, third.allowed]).toEqual([true, true, true]);
    expect(third.remaining).toBe(0);
  });

  it('denies requests beyond the maximum with a bounded retry-after', async () => {
    const limiter = new RateLimiter(new InMemoryRateLimitStore());
    for (let i = 0; i < TEST_POLICY.maxRequests; i += 1) await limiter.check(TEST_POLICY, 'ip-1');
    const denied = await limiter.check(TEST_POLICY, 'ip-1');
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterSeconds).toBeGreaterThan(0);
    expect(denied.retryAfterSeconds).toBeLessThanOrEqual(TEST_POLICY.windowSeconds);
  });

  it('resets the budget when the fixed window expires', async () => {
    const clock = fixedClock(1_700_000_000_000);
    const limiter = new RateLimiter(new InMemoryRateLimitStore(), clock.now);
    for (let i = 0; i < TEST_POLICY.maxRequests; i += 1) await limiter.check(TEST_POLICY, 'ip-1');
    expect((await limiter.check(TEST_POLICY, 'ip-1')).allowed).toBe(false);
    clock.advance(TEST_POLICY.windowSeconds * 1000 + 1);
    expect((await limiter.check(TEST_POLICY, 'ip-1')).allowed).toBe(true);
  });

  it('isolates buckets per identity', async () => {
    const limiter = new RateLimiter(new InMemoryRateLimitStore());
    for (let i = 0; i < TEST_POLICY.maxRequests; i += 1) await limiter.check(TEST_POLICY, 'ip-1');
    expect((await limiter.check(TEST_POLICY, 'ip-1')).allowed).toBe(false);
    expect((await limiter.check(TEST_POLICY, 'ip-2')).allowed).toBe(true);
  });

  it('handles concurrent requests without overshooting the test threshold', async () => {
    const limiter = new RateLimiter(new InMemoryRateLimitStore());
    const results = await Promise.all(
      Array.from({ length: 10 }, () => limiter.check(TEST_POLICY, 'ip-1')),
    );
    expect(results.filter((r) => r.allowed)).toHaveLength(TEST_POLICY.maxRequests);
    expect(results.filter((r) => !r.allowed)).toHaveLength(10 - TEST_POLICY.maxRequests);
  });

  it('fails closed when the rate-limit store is unavailable', async () => {
    const failingStore: RateLimitStore = {
      async increment() {
        throw new Error('store down');
      },
    };
    const limiter = new RateLimiter(failingStore);
    const decision = await limiter.check(TEST_POLICY, 'ip-1');
    expect(decision.allowed).toBe(false);
    expect(decision.retryAfterSeconds).toBe(TEST_POLICY.windowSeconds);
  });
});

describe('rate limit policy configuration', () => {
  it('parses config-driven thresholds and rejects invalid ones', () => {
    expect(
      parseRateLimitPolicy(
        { RATE_LIMIT_LOGIN_MAX: '5', RATE_LIMIT_LOGIN_WINDOW_SECONDS: '60' },
        'LOGIN',
        'RATE_LIMIT_LOGIN_MAX',
        'RATE_LIMIT_LOGIN_WINDOW_SECONDS',
      ),
    ).toEqual({ name: 'LOGIN', maxRequests: 5, windowSeconds: 60 });
    expect(
      parseRateLimitPolicy({}, 'LOGIN', 'RATE_LIMIT_LOGIN_MAX', 'RATE_LIMIT_LOGIN_WINDOW_SECONDS'),
    ).toBeUndefined();
    expect(() =>
      parseRateLimitPolicy(
        { RATE_LIMIT_LOGIN_MAX: '0', RATE_LIMIT_LOGIN_WINDOW_SECONDS: '60' },
        'LOGIN',
        'RATE_LIMIT_LOGIN_MAX',
        'RATE_LIMIT_LOGIN_WINDOW_SECONDS',
      ),
    ).toThrow();
    expect(() =>
      parseRateLimitPolicy(
        { RATE_LIMIT_LOGIN_MAX: '5' },
        'LOGIN',
        'RATE_LIMIT_LOGIN_MAX',
        'RATE_LIMIT_LOGIN_WINDOW_SECONDS',
      ),
    ).toThrow();
    expect(() =>
      parseRateLimitPolicy(
        { RATE_LIMIT_LOGIN_MAX: '5', RATE_LIMIT_LOGIN_WINDOW_SECONDS: 'abc' },
        'LOGIN',
        'RATE_LIMIT_LOGIN_MAX',
        'RATE_LIMIT_LOGIN_WINDOW_SECONDS',
      ),
    ).toThrow();
  });

  it('maps high-risk POST routes to their config-driven policy', () => {
    const env = { RATE_LIMIT_LOGIN_MAX: '5', RATE_LIMIT_LOGIN_WINDOW_SECONDS: '60' };
    expect(resolveHighRiskRateLimitPolicy('/login', 'POST', env, 'development')).toEqual({
      name: 'LOGIN',
      maxRequests: 5,
      windowSeconds: 60,
    });
    expect(resolveHighRiskRateLimitPolicy('/login', 'GET', env, 'development')).toBeUndefined();
    expect(
      resolveHighRiskRateLimitPolicy('/dashboard', 'POST', env, 'development'),
    ).toBeUndefined();
    // Unconfigured high-risk route: disabled outside production, fail-closed inside production.
    expect(resolveHighRiskRateLimitPolicy('/login', 'POST', {}, 'development')).toBeUndefined();
    expect(resolveHighRiskRateLimitPolicy('/login', 'POST', {}, 'production')).toBe('FAIL_CLOSED');
  });

  it('treats action callback subpaths as the same high-risk route', () => {
    const env = { RATE_LIMIT_LOGIN_MAX: '5', RATE_LIMIT_LOGIN_WINDOW_SECONDS: '60' };
    expect(
      resolveHighRiskRateLimitPolicy('/login?astro-action=auth.login', 'POST', env, 'development'),
    ).toEqual({
      name: 'LOGIN',
      maxRequests: 5,
      windowSeconds: 60,
    });
  });
});

describe('postgres rate limit store', () => {
  let pool: ReturnType<typeof createPool>;
  let databaseUrl: string;

  beforeAll(async () => {
    databaseUrl = getTestDatabaseUrl(await startPostgresContainer());
    pool = createPool({ connectionString: databaseUrl, max: 4 });
  });

  afterAll(async () => {
    await pool.end();
    await stopPostgresContainer();
  });

  it('increments atomically inside a fixed window and starts a new window after expiry', async () => {
    const { createDatabase } = await import('../../../src/shared/database/database');
    const store = new PostgresRateLimitStore(createDatabase());
    const windowStart = 1_700_000_000_000;
    const first = await store.increment('LOGIN', 'ip-1', windowStart, windowStart + 60_000);
    expect(first.count).toBe(1);
    const second = await store.increment('LOGIN', 'ip-1', windowStart, windowStart + 60_000);
    expect(second.count).toBe(2);
    const concurrent = await Promise.all([
      store.increment('LOGIN', 'ip-1', windowStart, windowStart + 60_000),
      store.increment('LOGIN', 'ip-1', windowStart, windowStart + 60_000),
      store.increment('LOGIN', 'ip-2', windowStart, windowStart + 60_000),
    ]);
    expect(concurrent.map((r) => r.count).sort()).toEqual([1, 3, 4]);
  });
});
