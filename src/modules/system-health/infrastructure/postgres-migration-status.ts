import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import {
  reconcileMigrationParity,
  type MigrationIdentity,
} from '../../../shared/database/migration-parity.js';
import type { HealthStatus } from '../ports/health-probes.js';

const MIGRATION_FILE = /^(\d{4})_([a-z0-9_]+)\.sql$/;

interface AppliedMigration extends Omit<MigrationIdentity, 'name'> {
  name: string | null;
}

export type ReconciledMigrationStatus = ReturnType<typeof reconcileMigrationParity> & {
  /** Alias retained for callers that use build terminology. */
  buildHead: string;
};

/**
 * Compares the complete applied ledger to the migrations shipped with this
 * build. The runner's exact known legacy checksums are accepted as auditable
 * compatibility entries, while unknown hashes and names fail closed.
 */
export function reconcileMigrationStatus(
  applied: readonly AppliedMigration[],
  shipped: readonly MigrationIdentity[] | undefined,
): ReconciledMigrationStatus {
  const parity = reconcileMigrationParity(applied, shipped);
  return {
    ...parity,
    buildHead: parity.sourceHead,
  };
}

/**
 * The server source and bundled server have different depths. Probe both
 * known layouts, but report unavailable instead of treating missing source as
 * an empty migration set.
 */
const MIGRATION_DIRECTORY_CANDIDATES = [
  '../../../../db/migrations/',
  '../../../db/migrations/',
] as const;

async function readShippedMigrations(): Promise<readonly MigrationIdentity[] | undefined> {
  for (const candidate of MIGRATION_DIRECTORY_CANDIDATES) {
    try {
      const directory = new URL(candidate, import.meta.url);
      const files = (await readdir(directory)).filter((file) => MIGRATION_FILE.test(file)).sort();
      if (files.length === 0) continue;
      return await Promise.all(
        files.map(async (file) => {
          const match = MIGRATION_FILE.exec(file);
          if (!match) throw new Error('Invalid migration filename.');
          const sql = await readFile(new URL(`${candidate}${file}`, import.meta.url), 'utf8');
          return {
            version: match[1],
            name: `${match[1]}_${match[2]}`,
            checksum: createHash('sha256').update(sql, 'utf8').digest('hex'),
          };
        }),
      );
    } catch {
      // This candidate does not describe the loaded source/bundle layout.
    }
  }
  return undefined;
}

let shippedMigrationCache: Promise<readonly MigrationIdentity[] | undefined> | undefined;

/**
 * Reads applied migration versions, names and checksums from the qc ledger and
 * reconciles all applied rows against source bytes. It never changes the
 * ledger, runs SQL from migrations, or returns SQL/raw database errors.
 */
export function createPostgresMigrationStatus(database: Kysely<DatabaseSchema>) {
  return async (): Promise<ReconciledMigrationStatus> => {
    const [rows, shipped] = await Promise.all([
      database
        .selectFrom('schema_migrations')
        .select(['version', 'name', 'checksum'])
        .orderBy('version', 'asc')
        .execute(),
      (shippedMigrationCache ??= readShippedMigrations()),
    ]);
    return reconcileMigrationStatus(rows, shipped);
  };
}

/** Audit subsystem readiness: verifies the append-only audit ledger is readable. */
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
