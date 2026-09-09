import { Client } from 'pg';

import { parseServerEnv } from '../../config/env.js';
import { getDatabaseConnectionConfig } from '../database/pool.js';

/**
 * Canonical database readiness check shared by every health surface.
 *
 * Both the machine `/api/health/ready` probe and the authenticated System
 * Health view delegate to this function, so they observe the same database
 * reachability through the same canonical TLS configuration
 * (`getDatabaseConnectionConfig`: TLS required, `sslmode=disable` rejected,
 * provider `sslmode` preserved, otherwise `rejectUnauthorized: true`).
 *
 * The check never throws infrastructure details and never returns connection
 * data: configuration errors, connection failures, and query failures all
 * collapse to `false`. Callers map the boolean to their own sanitized
 * vocabulary (`healthy`/`unhealthy`, `HEALTHY`/`UNAVAILABLE`).
 */
export type CanonicalDatabaseReadinessCheck = (databaseUrl: string | undefined) => Promise<boolean>;

/**
 * Resolve the database URL through the same server-env validation used by the
 * readiness path. Any invalid environment collapses to `undefined`, which the
 * canonical check treats as not ready without exposing values.
 */
export function resolveCanonicalDatabaseUrl(
  env: Record<string, string | undefined> = process.env,
): string | undefined {
  try {
    return parseServerEnv(env).DATABASE_URL;
  } catch {
    return undefined;
  }
}

export async function checkCanonicalDatabaseReadiness(
  databaseUrl: string | undefined,
): Promise<boolean> {
  let client: Client;
  try {
    client = new Client(getDatabaseConnectionConfig(databaseUrl));
  } catch {
    // Missing, malformed, or non-TLS (`sslmode=disable`) configuration.
    return false;
  }

  try {
    await client.connect();
    await client.query('SELECT 1');
    return true;
  } catch {
    return false;
  } finally {
    await client.end().catch(() => undefined);
  }
}
