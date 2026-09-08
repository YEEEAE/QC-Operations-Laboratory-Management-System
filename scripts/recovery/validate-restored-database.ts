import { Client } from 'pg';
import { fileURLToPath } from 'node:url';
import { getDatabaseConnectionConfig } from '../../src/shared/database/pool.js';
import { readRecoveryManifest, type RecoveryManifest } from './verify-recovery-manifest.js';
import '../db/load-local-env.js';

export interface RestoredDatabaseReport {
  status: 'PASS' | 'FAIL';
  migrationLedger: string;
  coreRelations: string[];
  historyRelations: string[];
  appContext: string;
  failures: string[];
}

type LedgerRow = { version: string; name: string; checksum: string };

export async function validateRestoredDatabase(
  manifest: RecoveryManifest,
  databaseUrl: string,
): Promise<RestoredDatabaseReport> {
  const client = new Client(getDatabaseConnectionConfig(databaseUrl));
  const failures: string[] = [];
  const coreRelations: string[] = [];
  const historyRelations: string[] = [];
  try {
    await client.connect();
    // Mirror the application runtime pool (pool.ts createPool options):
    // search_path=qc,pg_catalog. Without this, current_schema() reports
    // `public` on a correctly restored database and the schema gate fails
    // even though every qualified qc.* relation is present.
    await client.query('SET search_path TO qc, pg_catalog');
    await client.query('BEGIN');
    await client.query('SET TRANSACTION READ ONLY');
    const version = await client.query<{ version: string }>('SELECT version() AS version');
    if (!version.rows[0]?.version.includes(`PostgreSQL ${manifest.database.postgresqlVersion}.`))
      failures.push('PostgreSQL version context mismatch');
    const schema = await client.query<{ schema: string | null }>(
      `SELECT current_schema() AS schema`,
    );
    if (schema.rows[0]?.schema !== 'qc') failures.push('current_schema is not qc');
    const ledger = await client.query<LedgerRow>(
      'SELECT version, name, checksum FROM qc.schema_migrations ORDER BY version',
    );
    const expected = manifest.database.migrationLedger;
    if (
      ledger.rows.length !== expected.length ||
      ledger.rows.some(
        (row, index) =>
          row.version !== expected[index]?.version ||
          row.name !== expected[index]?.name ||
          row.checksum.toLowerCase() !== expected[index]?.checksum.toLowerCase(),
      )
    )
      failures.push('migration ledger mismatch');
    for (const relation of manifest.database.coreRelations) {
      // Existence (not display form) is the contract: to_regclass renders
      // search_path-relative names (e.g. `users` when qc is in the path),
      // so comparing display text to the qualified name is path-sensitive.
      const result = await client.query<{ exists: boolean }>(
        'SELECT to_regclass($1) IS NOT NULL AS exists',
        [relation],
      );
      if (result.rows[0]?.exists !== true) failures.push(`missing core relation: ${relation}`);
      else coreRelations.push(relation);
    }
    for (const relation of manifest.database.historyRelations) {
      const result = await client.query<{ exists: boolean }>(
        'SELECT to_regclass($1) IS NOT NULL AS exists',
        [relation],
      );
      if (result.rows[0]?.exists !== true) failures.push(`missing history relation: ${relation}`);
      else historyRelations.push(relation);
    }
    if (ledger.rows.at(-1)?.version !== manifest.appContext.migrationHead)
      failures.push('application migration head mismatch');
    await client.query('ROLLBACK');
    return {
      status: failures.length === 0 ? 'PASS' : 'FAIL',
      migrationLedger: failures.some((failure) => failure.includes('ledger')) ? 'FAIL' : 'PASS',
      coreRelations,
      historyRelations,
      appContext: failures.some(
        (failure) => failure.includes('context') || failure.includes('head'),
      )
        ? 'FAIL'
        : 'PASS',
      failures,
    };
  } catch {
    await client.query('ROLLBACK').catch(() => undefined);
    return {
      status: 'FAIL',
      migrationLedger: 'FAIL',
      coreRelations,
      historyRelations,
      appContext: 'FAIL',
      failures: [...failures, 'database connection or read-only validation failed'],
    };
  } finally {
    await client.end().catch(() => undefined);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const manifestPath = process.argv[process.argv.indexOf('--manifest') + 1];
  const databaseUrl =
    process.argv[process.argv.indexOf('--database-url') + 1] ?? process.env.DATABASE_URL;
  if (!manifestPath || !databaseUrl) {
    console.error('Usage: validate-restored-database.ts --manifest <path> [--database-url <url>]');
    process.exitCode = 2;
  } else
    readRecoveryManifest(manifestPath)
      .then((manifest) => validateRestoredDatabase(manifest, databaseUrl))
      .then((report) => {
        console.log(JSON.stringify(report));
        if (report.status !== 'PASS') process.exitCode = 1;
      })
      .catch((error: unknown) => {
        console.error(
          error instanceof Error ? error.message : 'Restored database validation failed.',
        );
        process.exitCode = 1;
      });
}
