/**
 * QC-100-FINAL-019 — Guarded local master-data import/preflight CLI.
 *
 * Usage:
 *   tsx scripts/data/run-master-data-import.ts --entity equipment --dataset <file.json>
 *   tsx scripts/data/run-master-data-import.ts --entity equipment --dataset <file.json> --apply
 *
 * Default mode is a READ-ONLY dry run (preflight + reconciliation preview).
 * `--apply` writes inside one atomic transaction and is gated by:
 *   NODE_ENV in {development,test}
 *   QC_SEED_ALLOW_NON_PRODUCTION=true
 *   QC_MASTER_DATA_IMPORT_ALLOW=true
 *   DATABASE_URL not looking like production
 *
 * This never seeds production, never decides BR-GEN-064/BD-019, and never
 * invents values. Dry-run and apply both require a task-owned database.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { createPool, getDatabaseConnectionConfig } from '../../src/shared/database/pool.js';
import { loadLocalEnv } from '../db/load-local-env.js';
import { getMasterDataEntity } from './master-data-catalog.js';
import type { ImportRow } from './import-preflight.js';
import {
  applyImport,
  createReferenceChecker,
  loadExistingKeys,
  preflightImport,
} from './import-preflight.js';
import { getRegisteredDataset } from './registered-datasets.js';

function fail(message: string): never {
  throw new Error(message);
}

interface DatasetFile {
  entityKey?: string;
  records: ImportRow[];
}

export function parseDatasetFile(raw: string): ImportRow[] {
  const parsed = JSON.parse(raw) as DatasetFile | ImportRow[];
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.records)) return parsed.records;
  fail('Dataset file must be a JSON array of records or { records: [...] }.');
}

export interface ImportCliOptions {
  entityKey: string;
  datasetPath: string;
  apply: boolean;
}

export function parseArgs(argv: readonly string[]): ImportCliOptions {
  let entityKey: string | undefined;
  let datasetPath: string | undefined;
  let apply = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--entity') entityKey = argv[++i];
    else if (arg === '--dataset') datasetPath = argv[++i];
    else if (arg === '--apply') apply = true;
    else fail(`Unknown argument: ${arg}`);
  }
  if (!entityKey) fail('--entity is required.');
  if (!datasetPath) fail('--dataset is required.');
  return { entityKey, datasetPath, apply };
}

function assertReadGuard(env: NodeJS.ProcessEnv): void {
  const nodeEnv = env.NODE_ENV;
  if (nodeEnv !== 'development' && nodeEnv !== 'test') {
    fail('Refusing master-data preflight: NODE_ENV must be development or test.');
  }
  const databaseUrl = env.DATABASE_URL ?? '';
  if (!databaseUrl) fail('Refusing master-data preflight: DATABASE_URL is required.');
  const lowered = databaseUrl.toLowerCase();
  const looksProduction =
    lowered.includes('qclevel.top') ||
    lowered.includes('render.com') ||
    (lowered.includes('prod') &&
      !lowered.includes('test') &&
      !lowered.includes('dev') &&
      !lowered.includes('localhost') &&
      !lowered.includes('127.0.0.1'));
  if (looksProduction) fail('Refusing master-data preflight: DATABASE_URL looks like production.');
}

function assertApplyGuard(env: NodeJS.ProcessEnv): void {
  assertReadGuard(env);
  if (env.QC_SEED_ALLOW_NON_PRODUCTION !== 'true') {
    fail('Refusing master-data apply: QC_SEED_ALLOW_NON_PRODUCTION=true is required.');
  }
  if (env.QC_MASTER_DATA_IMPORT_ALLOW !== 'true') {
    fail('Refusing master-data apply: QC_MASTER_DATA_IMPORT_ALLOW=true is required.');
  }
}

export async function runImportCli(
  options: ImportCliOptions,
  env: NodeJS.ProcessEnv = process.env,
): Promise<Record<string, unknown>> {
  loadLocalEnv(env);
  if (options.apply) assertApplyGuard(env);
  else assertReadGuard(env);

  const spec = getRegisteredDataset(options.entityKey);
  const entity = getMasterDataEntity(options.entityKey);
  const rows = parseDatasetFile(readFileSync(options.datasetPath, 'utf8'));

  const pool = createPool({
    ...getDatabaseConnectionConfig(env.DATABASE_URL),
    application_name: 'qc-master-data-import',
  });
  try {
    const existingKeys = await loadExistingKeys(pool, spec);
    const referenceExists = createReferenceChecker((sql, params) => pool.query(sql, params));
    const report = await preflightImport(spec, rows, { existingKeys, referenceExists });
    const rejectionExamples = report.issues.slice(0, 5);
    if (!options.apply) {
      return {
        mode: 'DRY_RUN',
        entity: entity.key,
        classification: entity.classification,
        governance: entity.governance,
        counts: report.counts,
        rejectionExamples,
        reconciliation: {
          existingMatches: report.counts.alreadyPresent,
          newInserts: report.counts.ready,
        },
      };
    }

    const client = await pool.connect();
    try {
      const result = await applyImport({
        client,
        spec,
        rows: report.readyRows,
        actorId: '',
      });
      return {
        mode: 'APPLY',
        entity: entity.key,
        counts: report.counts,
        rejectionExamples,
        apply: result,
      };
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runImportCli(parseArgs(process.argv.slice(2)))
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : 'Master-data import failed.');
      process.exitCode = 1;
    });
}
