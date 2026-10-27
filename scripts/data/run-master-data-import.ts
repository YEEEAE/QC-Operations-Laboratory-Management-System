/**
 * QC-100-FINAL-019 — Guarded local master-data import/preflight CLI.
 *
 * Usage:
 *   tsx scripts/data/run-master-data-import.ts --entity equipment --dataset <source.csv> --mapping '{"Equipment No":"equipment_no"}'
 *   tsx scripts/data/run-master-data-import.ts --entity equipment --dataset <approved-source.csv> --mapping '<reviewed-json>' --apply --approval-revision <uuid> --actor-id <uuid> --request-id <uuid>
 *
 * Default mode is a READ-ONLY local preflight (validation + duplicate/conflict preview).
 * `--apply` writes inside one atomic transaction and is gated by:
 *   NODE_ENV in {development,test}
 *   QC_SEED_ALLOW_NON_PRODUCTION=true
 *   QC_MASTER_DATA_IMPORT_ALLOW=true
 *   DATABASE_URL not looking like production
 *
 * This never seeds production, never decides BR-GEN-064/BD-019, and never
 * invents values. Dry-run and apply both require a task-owned database.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { createPool, getDatabaseConnectionConfig } from '../../src/shared/database/pool.js';
import { loadLocalEnv, loadLocalOperatorEnv } from '../db/load-local-env.js';
import { getMasterDataEntity } from './master-data-catalog.js';
import type { ImportRow } from './import-preflight.js';
import {
  applyImport,
  createReferenceChecker,
  mapImportHeaders,
  loadExistingKeys,
  parseCsvRecords,
  preflightImport,
  type HeaderMapping,
} from './import-preflight.js';
import { getRegisteredDataset } from './registered-datasets.js';

function fail(message: string): never {
  throw new Error(message);
}

interface DatasetFile {
  entityKey?: string;
  records: ImportRow[];
}

export function parseDatasetFile(raw: string, expectedEntityKey?: string): ImportRow[] {
  const parsed = JSON.parse(raw) as DatasetFile | ImportRow[];
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.records)) {
    if (parsed.entityKey && parsed.entityKey !== expectedEntityKey) {
      fail(
        `Dataset entity '${parsed.entityKey}' does not match requested entity '${expectedEntityKey}'.`,
      );
    }
    return parsed.records;
  }
  fail('Dataset file must be a JSON array of records or { records: [...] }.');
}

export interface ImportCliOptions {
  entityKey: string;
  datasetPath: string;
  reportPath?: string;
  apply: boolean;
  approvalRevisionId?: string;
  actorId?: string;
  mapping?: HeaderMapping;
  requestId?: string;
}

export function parseArgs(argv: readonly string[]): ImportCliOptions {
  let entityKey: string | undefined;
  let datasetPath: string | undefined;
  let reportPath: string | undefined;
  let apply = false;
  let approvalRevisionId: string | undefined;
  let actorId: string | undefined;
  let mapping: HeaderMapping | undefined;
  let requestId: string | undefined;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--entity') entityKey = argv[++i];
    else if (arg === '--dataset') datasetPath = argv[++i];
    else if (arg === '--report') reportPath = argv[++i];
    else if (arg === '--apply') apply = true;
    else if (arg === '--approval-revision') approvalRevisionId = argv[++i];
    else if (arg === '--actor-id') actorId = argv[++i];
    else if (arg === '--mapping') {
      try { mapping = JSON.parse(argv[++i] ?? '') as HeaderMapping; }
      catch { fail('--mapping must be a JSON object mapping CSV headers to governed fields.'); }
    }
    else if (arg === '--request-id') requestId = argv[++i];
    else fail(`Unknown argument: ${arg}`);
  }
  if (!entityKey) fail('--entity is required.');
  if (!datasetPath) fail('--dataset is required.');
  if (apply && (!approvalRevisionId || !actorId || !requestId)) fail('--apply requires --approval-revision, --actor-id, and --request-id.');
  return { entityKey, datasetPath, reportPath, apply, approvalRevisionId, actorId, mapping, requestId };
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
  loadLocalOperatorEnv(env);
  if (options.apply) assertApplyGuard(env);
  else assertReadGuard(env);

  const spec = getRegisteredDataset(options.entityKey);
  const entity = getMasterDataEntity(options.entityKey);
  if (options.reportPath && existsSync(options.reportPath)) {
    fail(`Refusing to overwrite existing report: ${options.reportPath}`);
  }
  const rawDataset = readFileSync(options.datasetPath, 'utf8');
  let rows: ImportRow[];
  if (/^\s*[\[{]/.test(rawDataset)) rows = parseDatasetFile(rawDataset, options.entityKey);
  else {
    const csv = parseCsvRecords(rawDataset);
    if (!options.mapping) fail('CSV imports require a reviewed --mapping JSON object.');
    rows = mapImportHeaders(csv.headers, csv.records, options.mapping);
  }

  const pool = createPool({
    ...getDatabaseConnectionConfig(env.DATABASE_URL),
    application_name: 'qc-master-data-import',
  });
  try {
    if (options.apply) {
      const priorReceipt = await pool.query<{ import_state: string }>(
        `SELECT import_state FROM qc.master_data_import_revisions WHERE id = $1 AND dataset_key = $2`,
        [options.approvalRevisionId, options.entityKey],
      );
      if (priorReceipt.rows[0]?.import_state === 'IMPORTED') {
        const client = await pool.connect();
        try {
          const applied = await applyImport({
            client, spec, rows, actorId: options.actorId!, approvalRevisionId: options.approvalRevisionId!,
            sourceBytes: rawDataset, mapping: options.mapping ?? {}, requestId: options.requestId!,
          });
          return { mode: 'APPLY', entity: entity.key, approvalRevisionId: options.approvalRevisionId,
            counts: { total: rows.length }, apply: applied, replayed: true };
        } finally { client.release(); }
      }
    }
    const existingKeys = await loadExistingKeys(pool, spec);
    const referenceExists = createReferenceChecker((sql, params) => pool.query(sql, params));
    const report = await preflightImport(spec, rows, { existingKeys, referenceExists });
    if (options.apply && (report.issues.length > 0 || report.counts.alreadyPresent > 0)) {
      fail('Import is blocked: resolve every line-level validation issue and existing-record conflict before applying.');
    }
    const rejectionExamples = report.issues.slice(0, 5);
    if (!options.apply) {
      const result = {
        mode: 'DRY_RUN',
        entity: entity.key,
        classification: entity.classification,
        governance: entity.governance,
        lineage: {
          source: entity.sourceReference,
          sourceVersion: entity.sourceVersion,
          owner: entity.steward,
          approval: entity.approval,
          datasetSha256: createHash('sha256').update(rawDataset).digest('hex'),
        },
        counts: report.counts,
        issues: report.issues,
        rejectionExamples,
        reconciliation: {
          existingMatches: report.counts.alreadyPresent,
          newInserts: report.counts.ready,
        },
      };
      if (options.reportPath) {
        writeFileSync(options.reportPath, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
      }
      return result;
    }

    const client = await pool.connect();
    try {
      const applied = await applyImport({
        client,
        spec,
        rows: report.readyRows,
        actorId: options.actorId!,
        approvalRevisionId: options.approvalRevisionId!,
        sourceBytes: rawDataset,
        mapping: options.mapping ?? {},
        requestId: options.requestId!,
      });
      const result = {
        mode: 'APPLY',
        entity: entity.key,
        lineage: {
          source: entity.sourceReference,
          sourceVersion: entity.sourceVersion,
          owner: entity.steward,
          approval: entity.approval,
          datasetSha256: createHash('sha256').update(rawDataset).digest('hex'),
        },
        counts: report.counts,
        issues: report.issues,
        rejectionExamples,
        apply: applied,
      };
      if (options.reportPath) {
        writeFileSync(options.reportPath, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
      }
      return result;
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
