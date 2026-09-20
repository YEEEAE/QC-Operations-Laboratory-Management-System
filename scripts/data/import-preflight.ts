/**
 * QC-100-FINAL-019 — Reusable local import preflight + reconciliation engine.
 *
 * Scope discipline:
 *  - This is a *local preparation* engine for a task-owned database. It is not a
 *    production seeding path and it never decides import policy.
 *  - `BR-GEN-064` (failure strategy) and `BD-019` (import transaction strategy)
 *    are UNCONFIRMED/open. The engine therefore *always* runs an explicit
 *    read-only preflight first, and its write path is a single atomic
 *    transaction (all-or-nothing) that is DEFAULTED, LOUDLY LABELLED, and gated
 *    behind explicit flags — it is not a claimed approved policy.
 *  - `BR-GEN-063` (APPROVED) requires import to use the same rules as manual
 *    input; validation rules come from the governed table's source constraints,
 *    never from invented limits.
 *
 * The core (`preflightImport`) is pure and injected with lookups so it can be
 * unit-tested without a database. The Postgres adapter (`applyImport`, readers)
 * lives in the same module but is only reached when a caller opts in.
 */

import type { Pool, PoolClient } from 'pg';

export type IssueCode =
  | 'MISSING_REQUIRED_FIELD'
  | 'EMPTY_REQUIRED_FIELD'
  | 'INVALID_VALUE'
  | 'DUPLICATE_IN_BATCH'
  | 'DUPLICATE_EXISTING'
  | 'UNRESOLVED_REFERENCE';

export interface FieldRule {
  column: string;
  required: boolean;
  /** Allowed values sourced from a DB CHECK / approved document. */
  allowedValues?: readonly string[];
}

export interface ReferenceRule {
  column: string;
  parentTable: string;
  parentColumn: string;
  required: boolean;
}

export interface ImportDatasetSpec {
  entityKey: string;
  /** Bare table name inside the `qc` schema. */
  targetTable: string;
  /** Conflict target; must match a UNIQUE constraint declared in source. */
  conflictTarget: readonly string[];
  fields: readonly FieldRule[];
  references?: readonly ReferenceRule[];
  /** Column that always receives the importing actor (e.g. `created_by`). */
  actorColumn?: string;
}

export type ImportRow = Record<string, unknown>;

export interface RowIssue {
  rowNumber: number;
  code: IssueCode;
  field?: string;
  detail: string;
}

export interface PreflightCounts {
  total: number;
  ready: number;
  alreadyPresent: number;
  missingRequiredField: number;
  emptyRequiredField: number;
  invalidValue: number;
  duplicateInBatch: number;
  unresolvedReference: number;
}

export interface PreflightReport {
  entityKey: string;
  targetTable: string;
  counts: PreflightCounts;
  readyRows: ImportRow[];
  alreadyPresentRows: ImportRow[];
  rejectedRows: ImportRow[];
  issues: RowIssue[];
}

export interface PreflightContext {
  /** Business-key tuples already present in the target table. */
  existingKeys: ReadonlySet<string>;
  referenceExists: (reference: ReferenceRule, value: unknown) => Promise<boolean>;
}

const TUPLE_SEPARATOR = '\u001f';

export function businessKeyTuple(spec: ImportDatasetSpec, row: ImportRow): string | null {
  const parts: string[] = [];
  for (const column of spec.conflictTarget) {
    const value = row[column];
    if (value === undefined || value === null || String(value).trim() === '') return null;
    parts.push(String(value));
  }
  return parts.join(TUPLE_SEPARATOR);
}

function isBlank(value: unknown): boolean {
  return (
    value === undefined || value === null || (typeof value === 'string' && value.trim() === '')
  );
}

/** Pure, synchronous-issue + injected-async-reference preflight. No writes. */
export async function preflightImport(
  spec: ImportDatasetSpec,
  rows: readonly ImportRow[],
  context: PreflightContext,
): Promise<PreflightReport> {
  const issues: RowIssue[] = [];
  const readyRows: ImportRow[] = [];
  const alreadyPresentRows: ImportRow[] = [];
  const rejectedRows: ImportRow[] = [];
  const seenKeys = new Set<string>();
  const counts: PreflightCounts = {
    total: rows.length,
    ready: 0,
    alreadyPresent: 0,
    missingRequiredField: 0,
    emptyRequiredField: 0,
    invalidValue: 0,
    duplicateInBatch: 0,
    unresolvedReference: 0,
  };

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const rowNumber = index + 1;
    let hardRejected = false;
    let alreadyPresent = false;

    for (const field of spec.fields) {
      const value = row[field.column];
      if (isBlank(value)) {
        if (field.required) {
          if (value === undefined || value === null) {
            issues.push({
              rowNumber,
              code: 'MISSING_REQUIRED_FIELD',
              field: field.column,
              detail: `required field '${field.column}' is missing`,
            });
            counts.missingRequiredField += 1;
          } else {
            issues.push({
              rowNumber,
              code: 'EMPTY_REQUIRED_FIELD',
              field: field.column,
              detail: `required field '${field.column}' is empty after trimming`,
            });
            counts.emptyRequiredField += 1;
          }
          hardRejected = true;
        }
        continue;
      }
      const allowed = field.allowedValues;
      if (allowed && !allowed.includes(String(value))) {
        issues.push({
          rowNumber,
          code: 'INVALID_VALUE',
          field: field.column,
          detail: `'${String(value)}' is not an allowed value for '${field.column}'`,
        });
        counts.invalidValue += 1;
        hardRejected = true;
      }
    }

    for (const reference of spec.references ?? []) {
      const value = row[reference.column];
      if (isBlank(value)) {
        if (reference.required) {
          issues.push({
            rowNumber,
            code: 'MISSING_REQUIRED_FIELD',
            field: reference.column,
            detail: `required reference '${reference.column}' is missing`,
          });
          counts.missingRequiredField += 1;
          hardRejected = true;
        }
        continue;
      }
      const exists = await context.referenceExists(reference, value);
      if (!exists) {
        issues.push({
          rowNumber,
          code: 'UNRESOLVED_REFERENCE',
          field: reference.column,
          detail: `'${String(value)}' does not resolve in qc.${reference.parentTable}.${reference.parentColumn}`,
        });
        counts.unresolvedReference += 1;
        hardRejected = true;
      }
    }

    const tuple = businessKeyTuple(spec, row);
    if (tuple === null) {
      issues.push({
        rowNumber,
        code: 'MISSING_REQUIRED_FIELD',
        field: spec.conflictTarget.join(','),
        detail: `business key (${spec.conflictTarget.join(', ')}) is incomplete`,
      });
      counts.missingRequiredField += 1;
      hardRejected = true;
    } else if (seenKeys.has(tuple)) {
      issues.push({
        rowNumber,
        code: 'DUPLICATE_IN_BATCH',
        field: spec.conflictTarget.join(','),
        detail: `business key '${tuple.split(TUPLE_SEPARATOR).join('/')}' appears earlier in this batch`,
      });
      counts.duplicateInBatch += 1;
      hardRejected = true;
    } else {
      seenKeys.add(tuple);
      if (context.existingKeys.has(tuple)) {
        alreadyPresent = true;
      }
    }

    if (hardRejected) {
      rejectedRows.push(row);
    } else if (alreadyPresent) {
      alreadyPresentRows.push(row);
      counts.alreadyPresent += 1;
    } else {
      readyRows.push(row);
      counts.ready += 1;
    }
  }

  return {
    entityKey: spec.entityKey,
    targetTable: spec.targetTable,
    counts,
    readyRows,
    alreadyPresentRows,
    rejectedRows,
    issues,
  };
}

function quoteIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function keyPredicate(
  spec: ImportDatasetSpec,
  keys: readonly string[],
  startParam: number,
): { sql: string; params: unknown[] } {
  const ors: string[] = [];
  const params: unknown[] = [];
  let param = startParam;
  for (const tuple of keys) {
    const parts = tuple.split(TUPLE_SEPARATOR);
    const ands = spec.conflictTarget.map((column, i) => {
      params.push(parts[i]);
      const clause = `${quoteIdentifier(column)} = $${param}`;
      param += 1;
      return clause;
    });
    ors.push(`(${ands.join(' AND ')})`);
  }
  return { sql: ors.join(' OR '), params };
}

/** Load the business-key tuples already present in the governed target table. */
export async function loadExistingKeys(pool: Pool, spec: ImportDatasetSpec): Promise<Set<string>> {
  const result = await pool.query<Record<string, unknown>>(
    `SELECT ${spec.conflictTarget.map(quoteIdentifier).join(', ')} FROM qc.${quoteIdentifier(spec.targetTable)}`,
  );
  const keys = new Set<string>();
  for (const row of result.rows) {
    const tuple = spec.conflictTarget.map((column) => String(row[column])).join(TUPLE_SEPARATOR);
    keys.add(tuple);
  }
  return keys;
}

/** Build a reference-existence checker bound to a connection. */
export function createReferenceChecker(
  query: (sql: string, params: unknown[]) => Promise<{ rows: unknown[] }>,
): (reference: ReferenceRule, value: unknown) => Promise<boolean> {
  const cache = new Map<string, boolean>();
  return async (reference, value) => {
    const cacheKey = `${reference.parentTable}.${reference.parentColumn}:${String(value)}`;
    const cached = cache.get(cacheKey);
    if (cached !== undefined) return cached;
    const result = await query(
      `SELECT 1 FROM qc.${quoteIdentifier(reference.parentTable)} WHERE ${quoteIdentifier(reference.parentColumn)} = $1 LIMIT 1`,
      [value],
    );
    const exists = result.rows.length > 0;
    cache.set(cacheKey, exists);
    return exists;
  };
}

export interface ApplyResult {
  entityKey: string;
  inserted: number;
  skippedExisting: number;
  expected: number;
  observed: number;
  reconciled: boolean;
}

export interface ApplyImportOptions {
  client: Pick<PoolClient, 'query'>;
  spec: ImportDatasetSpec;
  rows: readonly ImportRow[];
  actorId: string;
  /** Progress hook; used by the CLI. Tests use it to inject an interruption. */
  onAfterRow?: (rowNumber: number) => void | Promise<void>;
}

/**
 * Apply the ready rows inside a single transaction (atomic, all-or-nothing).
 *
 * Atomicity is the engine's safe local default, not an approved policy: the
 * transaction strategy is `BD-019` (open) and the failure strategy is
 * `BR-GEN-064` (UNCONFIRMED). A failure at any row rolls the whole batch back,
 * which is the reason an interrupted load can be proven to leave zero partial
 * rows. Inserts use the source UNIQUE constraint as the idempotency key, so a
 * rerun of the same dataset inserts nothing new.
 */
export async function applyImport(options: ApplyImportOptions): Promise<ApplyResult> {
  const { client, spec, rows, actorId, onAfterRow } = options;
  const columns = [
    ...new Set([
      ...spec.fields.map((field) => field.column),
      ...(spec.references ?? []).map((reference) => reference.column),
      ...(spec.actorColumn ? [spec.actorColumn] : []),
    ]),
  ];
  const insertSql = `INSERT INTO qc.${quoteIdentifier(spec.targetTable)} (${columns
    .map(quoteIdentifier)
    .join(
      ', ',
    )}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')}) ON CONFLICT (${spec.conflictTarget
    .map(quoteIdentifier)
    .join(', ')}) DO NOTHING`;

  await client.query('BEGIN');
  try {
    let inserted = 0;
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const params = columns.map((column) => {
        if (spec.actorColumn && column === spec.actorColumn) return actorId;
        const value = row[column];
        return value === undefined ? null : value;
      });
      const result = (await client.query(insertSql, params)) as unknown as {
        rowCount: number | null;
      };
      inserted += result.rowCount ?? 0;
      if (onAfterRow) await onAfterRow(index + 1);
    }

    const keys = rows
      .map((row) => businessKeyTuple(spec, row))
      .filter((tuple): tuple is string => tuple !== null);
    let observed = 0;
    if (keys.length > 0) {
      const predicate = keyPredicate(spec, keys, 1);
      const verify = (await client.query(
        `SELECT count(*)::int AS count FROM qc.${quoteIdentifier(spec.targetTable)} WHERE ${predicate.sql}`,
        predicate.params,
      )) as unknown as { rows: { count: number }[] };
      observed = verify.rows[0]?.count ?? 0;
    }

    await client.query('COMMIT');
    return {
      entityKey: spec.entityKey,
      inserted,
      skippedExisting: rows.length - inserted,
      expected: keys.length,
      observed,
      reconciled: observed === keys.length,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
