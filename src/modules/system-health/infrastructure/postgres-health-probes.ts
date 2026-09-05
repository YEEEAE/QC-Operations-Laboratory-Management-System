import { Client } from 'pg';
import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import type { DependencyHealth, SystemHealthProbes } from '../ports/health-probes.js';

/**
 * Server-side dependency probes for the authenticated system health view.
 *
 * Every probe is failure-isolated and sanitized: a thrown dependency error is
 * converted into a fixed UNAVAILABLE status without any exception text, so no
 * credentials, hostnames, or stack traces can reach the UI
 * (OBSERVABILITY-ARCHITECTURE.md sections 53-54, 101).
 */
export class PostgresSystemHealthProbes implements SystemHealthProbes {
  /** @param outboxDatabase database handle used only for the outbox backlog probe */
  constructor(private readonly outboxDatabase?: Kysely<DatabaseSchema>) {}

  application(): DependencyHealth {
    return { dependency: 'application', status: 'HEALTHY', checkedAt: new Date() };
  }

  async database(): Promise<DependencyHealth> {
    const checkedAt = new Date();
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) return { dependency: 'database', status: 'UNAVAILABLE', checkedAt };
    const client = new Client({ connectionString });
    try {
      await client.connect();
      await client.query('SELECT 1');
      return { dependency: 'database', status: 'HEALTHY', checkedAt };
    } catch {
      return { dependency: 'database', status: 'UNAVAILABLE', checkedAt };
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  async storage(): Promise<DependencyHealth> {
    // Object-storage provider topology is a deferred deployment decision; the
    // capability is reported as UNKNOWN instead of a false green state.
    return {
      dependency: 'storage',
      status: 'UNKNOWN',
      checkedAt: new Date(),
      detail: 'Not configured in this baseline.',
    };
  }

  async outbox(): Promise<DependencyHealth> {
    const checkedAt = new Date();
    if (!this.outboxDatabase) return { dependency: 'outbox', status: 'UNKNOWN', checkedAt };
    try {
      const row = await this.outboxDatabase
        .selectFrom('outbox_events')
        .select((expression) => [
          expression.fn.countAll<number>().as('pending'),
          expression.fn.min('available_at').as('oldestAvailableAt'),
        ])
        .where('processed_at', 'is', null)
        .executeTakeFirst();
      const pending = Number(row?.pending ?? 0);
      const oldest = row?.oldestAvailableAt ? new Date(row.oldestAvailableAt) : undefined;
      return {
        dependency: 'outbox',
        status: 'HEALTHY',
        checkedAt,
        ...(Number.isFinite(pending)
          ? {
              detail: `Pending messages: ${pending}${oldest ? ` · oldest available ${oldest.toISOString()}` : ''}`,
            }
          : {}),
      };
    } catch {
      return { dependency: 'outbox', status: 'UNAVAILABLE', checkedAt };
    }
  }

  async aiProvider(): Promise<DependencyHealth> {
    // AI advisory is optional and not yet integrated; it must never fail core
    // readiness (OBSERVABILITY-ARCHITECTURE.md OBS-015).
    return {
      dependency: 'ai-provider',
      status: 'UNKNOWN',
      checkedAt: new Date(),
      detail: 'AI advisory is not configured in this baseline.',
    };
  }
}
