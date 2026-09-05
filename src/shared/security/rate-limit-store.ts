export interface RateLimitWindowResult {
  count: number;
  windowStartMs: number;
  windowEndMs: number;
}

/**
 * Durable/atomic counter storage for fixed-window rate limiting.
 * Implementations must increment atomically per (policyName, bucketKey, window).
 */
export interface RateLimitStore {
  increment(
    policyName: string,
    bucketKey: string,
    windowStartMs: number,
    windowEndMs: number,
  ): Promise<RateLimitWindowResult>;
}
