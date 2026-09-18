import { readdir } from 'node:fs/promises';
import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import type { HealthStatus } from '../ports/health-probes.js';

const MIGRATION_FILE = /^(\d{4})_[a-z0-9_]+\.sql$/;

/**
 * Reads the applied migration head from the qc.schema_migrations ledger and
 * compares it with the migration files shipped with this build. Returns only
 * version identifiers — never connection data or SQL text.
 */
export function createPostgresMigrationStatus(database: Kysely<DatabaseSchema>) {
  return async (): Promise<{ appliedHead: string; pending: readonly string[] }> => {
    const rows = await database
      .selectFrom('schema_migrations')
      .select('version')
      .orderBy('version', 'asc')
      .execute();
    const applied = new Set(rows.map((row) => row.version));
    const appliedHead = rows.at(-1)?.version ?? 'NONE';

    let expected: string[];
    try {
      const files = await readdir(new URL('../../../db/migrations/', import.meta.url));
      expected = files
        .map((file) => MIGRATION_FILE.exec(file)?.[1])
        .filter((name): name is string => Boolean(name))
        .sort();
    } catch {
      expected = [];
    }
    const pending = expected.filter((name) => !applied.has(name));
    return { appliedHead, pending };
  };
}

/**
 * Audit subsystem readiness: verifies the append-only audit ledger is
 * readable. Result is a bare status — failures never leak driver errors.
 */
export function createPostgresAuditReadiness(database: Kysely<DatabaseSchema>) {
  return async (): Promise<{ status: HealthStatus }> => {
    try {
      await database.selectFrom('audit_events').select('id').limit(1).execute();
      return { status: 'HEALTHY' };
    } catch {
      return { status: 'UNAVAILABLE' };
    }
  };
}
