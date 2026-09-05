import { sql, type Kysely } from 'kysely';
import type { DatabaseSchema } from '../database/db-types';
import type { RateLimitStore } from './rate-limit-store';

/**
 * PostgreSQL-backed fixed-window counter store. Atomic increment via a single
 * upsert so multiple instances share one budget (SECURITY-ARCHITECTURE §33:
 * distributed attack considerations).
 */
export class PostgresRateLimitStore implements RateLimitStore {
  constructor(private readonly database: Kysely<DatabaseSchema>) {}

  async increment(
    policyName: string,
    bucketKey: string,
    windowStartMs: number,
    windowEndMs: number,
  ): Promise<{ count: number; windowStartMs: number; windowEndMs: number }> {
    const rows = await this.database
      .insertInto('rate_limit_windows')
      .values({
        policy_name: policyName,
        bucket_key: bucketKey,
        window_started_at: new Date(windowStartMs),
        window_ended_at: new Date(windowEndMs),
        request_count: 1,
        updated_at: new Date(),
      })
      .onConflict((oc) =>
        oc.columns(['policy_name', 'bucket_key', 'window_started_at']).doUpdateSet({
          // unqualified column resolves to the existing row inside DO UPDATE
          request_count: sql`request_count + 1`,
          updated_at: new Date(),
        }),
      )
      .returning(['request_count', 'window_started_at', 'window_ended_at'])
      .execute();

    const row = rows[0];
    if (!row) throw new Error('rate limit increment returned no row');
    return {
      count: row.request_count,
      windowStartMs: row.window_started_at.getTime(),
      windowEndMs: row.window_ended_at.getTime(),
    };
  }
}
