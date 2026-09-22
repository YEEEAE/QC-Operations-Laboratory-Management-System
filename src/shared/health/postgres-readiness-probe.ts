import type { ReadinessProbe } from './readiness.js';
import {
  checkCanonicalDatabaseReadiness,
  resolveCanonicalDatabaseUrl,
  type CanonicalDatabaseReadinessCheck,
} from './canonical-database-readiness.js';

/**
 * Database dependency probe. `/api/health/ready` composes this canonical
 * connectivity/TLS check with the capability probes required by QC workflows.
 * Output stays a bare boolean; HTTP mapping and sanitization live in
 * `createReadinessResponse`.
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
