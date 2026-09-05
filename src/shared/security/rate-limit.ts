import { AppError } from '../errors/app-error';
import type { RateLimitStore } from './rate-limit-store';

/**
 * Fixed-window rate limiting capability (SECURITY-ARCHITECTURE §33/§141/§142).
 * Thresholds are always injected from configuration — no business constants.
 * Rate limiting is abuse protection, never authorization (§9: Authorization
 * is always server-side and re-checked inside use cases).
 */

export interface RateLimitPolicy {
  name: string;
  maxRequests: number;
  windowSeconds: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

export class InMemoryRateLimitStore implements RateLimitStore {
  private readonly windows = new Map<string, RateLimitEntry>();

  async increment(
    policyName: string,
    bucketKey: string,
    windowStartMs: number,
    windowEndMs: number,
  ): Promise<{ count: number; windowStartMs: number; windowEndMs: number }> {
    const key = `${policyName}\u0000${bucketKey}\u0000${windowStartMs}`;
    const existing = this.windows.get(key);
    if (existing) {
      existing.count += 1;
      return { count: existing.count, windowStartMs, windowEndMs };
    }
    this.windows.set(key, { count: 1, windowEndMs });
    this.evictExpired(windowStartMs);
    return { count: 1, windowStartMs, windowEndMs };
  }

  private evictExpired(nowMs: number): void {
    for (const [key, entry] of this.windows) {
      if (entry.windowEndMs <= nowMs) this.windows.delete(key);
    }
  }
}

interface RateLimitEntry {
  count: number;
  windowEndMs: number;
}

export class RateLimiter {
  constructor(
    private readonly store: RateLimitStore,
    private readonly clock: () => number = Date.now,
  ) {}

  /**
   * Fails closed on store failure: sensitive undefined behavior defaults to
   * DENY — an outage of the counter store must not reopen unlimited abuse.
   */
  async check(policy: RateLimitPolicy, bucketKey: string): Promise<RateLimitDecision> {
    const now = this.clock();
    const windowMs = policy.windowSeconds * 1000;
    const windowStartMs = Math.floor(now / windowMs) * windowMs;
    const windowEndMs = windowStartMs + windowMs;
    let count: number;
    try {
      const window = await this.store.increment(policy.name, bucketKey, windowStartMs, windowEndMs);
      count = window.count;
    } catch {
      return {
        allowed: false,
        limit: policy.maxRequests,
        remaining: 0,
        retryAfterSeconds: policy.windowSeconds,
      };
    }
    const allowed = count <= policy.maxRequests;
    return {
      allowed,
      limit: policy.maxRequests,
      remaining: Math.max(0, policy.maxRequests - count),
      retryAfterSeconds: allowed ? 0 : Math.ceil((windowEndMs - now) / 1000),
    };
  }
}

export function parseRateLimitPolicy(
  env: Record<string, string | undefined>,
  name: string,
  maxKey: string,
  windowKey: string,
): RateLimitPolicy | undefined {
  const max = env[maxKey];
  const window = env[windowKey];
  if (max === undefined && window === undefined) return undefined;
  if (max === undefined || window === undefined) {
    throw new AppError('SYSTEM_CONFIGURATION_INVALID', { userSafe: true });
  }
  const maxRequests = Number(max);
  const windowSeconds = Number(window);
  if (
    !Number.isInteger(maxRequests) ||
    maxRequests < 1 ||
    !Number.isInteger(windowSeconds) ||
    windowSeconds < 1
  ) {
    throw new AppError('SYSTEM_CONFIGURATION_INVALID', { userSafe: true });
  }
  return { name, maxRequests, windowSeconds };
}

export const HIGH_RISK_POST_ROUTES: readonly {
  routePrefix: string;
  policyName: string;
  maxKey: string;
  windowKey: string;
}[] = [
  {
    routePrefix: '/login',
    policyName: 'LOGIN',
    maxKey: 'RATE_LIMIT_LOGIN_MAX',
    windowKey: 'RATE_LIMIT_LOGIN_WINDOW_SECONDS',
  },
];

export type HighRiskResolution = RateLimitPolicy | 'FAIL_CLOSED' | undefined;

/**
 * Resolves the rate-limit policy for a high-risk POST route.
 * Unconfigured outside production → no limit (development convenience, logged
 * as an open policy item). Unconfigured inside production → FAIL_CLOSED:
 * SECURITY-ARCHITECTURE §142 forbids unlimited-abuse exposure on high-risk
 * endpoints, and startup env validation requires the login thresholds there.
 */
export function resolveHighRiskRateLimitPolicy(
  pathname: string,
  method: string,
  env: Record<string, string | undefined>,
  environment: 'development' | 'test' | 'production',
): HighRiskResolution {
  if (method !== 'POST') return undefined;
  const route = HIGH_RISK_POST_ROUTES.find(
    (candidate) =>
      pathname === candidate.routePrefix ||
      pathname.startsWith(`${candidate.routePrefix}/`) ||
      pathname.startsWith(`${candidate.routePrefix}?`),
  );
  if (!route) return undefined;
  return (
    parseRateLimitPolicy(env, route.policyName, route.maxKey, route.windowKey) ??
    (environment === 'production' ? 'FAIL_CLOSED' : undefined)
  );
}
