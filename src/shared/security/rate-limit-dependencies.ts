import { getDatabase } from '../database/database.js';
import { RateLimiter } from './rate-limit.js';
import { PostgresRateLimitStore } from './postgres-rate-limit-store.js';

let highRiskRateLimiter: RateLimiter | undefined;

export function rateLimitDependencies(): RateLimiter {
  return (highRiskRateLimiter ??= new RateLimiter(new PostgresRateLimitStore(getDatabase())));
}

export function resetRateLimitDependenciesForTests(): void {
  highRiskRateLimiter = undefined;
}
