import type { ReadinessProbe } from './readiness.js';
import {
  checkCanonicalDatabaseReadiness,
  resolveCanonicalDatabaseUrl,
  type CanonicalDatabaseReadinessCheck,
} from './canonical-database-readiness.js';

/**
 * Machine readiness probe. Delegates to the canonical database readiness
 * check so `/api/health/ready` observes the same database reachability and
 * TLS configuration as the authenticated System Health view. Output stays a
 * bare boolean; HTTP mapping and sanitization live in `createReadinessResponse`.
 */
export class PostgresReadinessProbe implements ReadinessProbe {
  constructor(
    private readonly check: CanonicalDatabaseReadinessCheck = checkCanonicalDatabaseReadiness,
  ) {}

  async isReady(): Promise<boolean> {
    try {
      return await this.check(resolveCanonicalDatabaseUrl());
    } catch {
      return false;
    }
  }
}
