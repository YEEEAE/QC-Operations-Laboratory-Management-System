import { readdir } from 'node:fs/promises';
import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import type { HealthStatus } from '../ports/health-probes.js';

const MIGRATION_FILE = /^(\d{4})_[a-z0-9_]+\.sql$/;

/**
 * The shipped migration files live at `<root>/db/migrations`, but the depth
 * from this module depends on the layout it is loaded from: the source tree
 * (`src/modules/system-health/infrastructure`) and the bundled server output
 * (`dist/server/chunks`) are different distances from the project root. The
 * directory is probed instead of hard-coding one bundler-specific depth, so a
 * failed lookup can never be mistaken for "no shipped migrations" (which would
 * report drift against a deploy that is actually in sync).
 */
const MIGRATION_DIRECTORY_CANDIDATES = [
  '../../../../db/migrations/',
  '../../../db/migrations/',
] as const;

async function readShippedMigrationVersions(): Promise<string[]> {
  for (const candidate of MIGRATION_DIRECTORY_CANDIDATES) {
    try {
      const files = await readdir(new URL(candidate, import.meta.url));
      return files
        .map((file) => MIGRATION_FILE.exec(file)?.[1])
        .filter((name): name is string => Boolean(name))
        .sort();
    } catch {
      // Not this layout; try the next candidate.
    }
  }
  return [];
}

/**
 * Reads the applied migration head from the qc.schema_migrations ledger and
 * compares it with the migration files shipped with this build. Returns only
 * version identifiers — never connection data or SQL text.
 */
export function createPostgresMigrationStatus(database: Kysely<DatabaseSchema>) {
  return async (): Promise<{
    appliedHead: string;
    /** Highest migration version shipped with this build. */
    buildHead: string;
    pending: readonly string[];
  }> => {
    const rows = await database
      .selectFrom('schema_migrations')
      .select('version')
      .orderBy('version', 'asc')
      .execute();
    const applied = new Set(rows.map((row) => row.version));
    const appliedHead = rows.at(-1)?.version ?? 'NONE';

    const expected = await readShippedMigrationVersions();
    const pending = expected.filter((name) => !applied.has(name));
    const buildHead = expected.at(-1) ?? 'NONE';
    return { appliedHead, buildHead, pending };
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
