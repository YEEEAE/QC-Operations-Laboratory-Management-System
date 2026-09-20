import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  applyImport,
  createReferenceChecker,
  loadExistingKeys,
  preflightImport,
} from '../../../scripts/data/import-preflight.js';
import { EQUIPMENT_DATASET } from '../../../scripts/data/registered-datasets.js';
import { createPool } from '../../../src/shared/database/pool.js';
import { migrate } from '../../../scripts/db/migrate.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';
import {
  MASTER_DATA_TEST_ACTOR_ID,
  MIXED_EQUIPMENT_ROWS,
  VALID_EQUIPMENT_ROWS,
} from '../../fixtures/master-data/equipment.js';

describe('master-data import preflight on a task-owned database', () => {
  let databaseUrl: string;
  let pool: ReturnType<typeof createPool> | undefined;

  beforeAll(async () => {
    databaseUrl = getTestDatabaseUrl(await startPostgresContainer());
    pool = createPool({ connectionString: databaseUrl, max: 4 });
    await migrate({ pool });
    await pool.query('DELETE FROM qc.equipment WHERE equipment_no LIKE $1', ['FIX-EQP-%']);
    await pool.query('DELETE FROM qc.users WHERE login_identity = $1', [
      'master-data-fixture-actor',
    ]);
    await pool.query(
      `INSERT INTO qc.users (id, login_identity, display_name, password_hash)
       VALUES ($1, 'master-data-fixture-actor', 'Master data fixture actor', 'not-a-real-hash')`,
      [MASTER_DATA_TEST_ACTOR_ID],
    );
  });

  afterAll(async () => {
    await pool?.end();
    await stopPostgresContainer();
  });

  beforeEach(async () => {
    await pool!.query('DELETE FROM qc.equipment WHERE equipment_no LIKE $1', ['FIX-EQP-%']);
  });

  async function preflight(rows: readonly Record<string, unknown>[]) {
    const existingKeys = await loadExistingKeys(pool!, EQUIPMENT_DATASET);
    const referenceExists = createReferenceChecker((sql, params) => pool!.query(sql, params));
    return preflightImport(EQUIPMENT_DATASET, rows, { existingKeys, referenceExists });
  }

  async function applyRows(
    rows: readonly Record<string, unknown>[],
    onAfterRow?: (n: number) => void,
  ) {
    const client = await pool!.connect();
    try {
      return await applyImport({ client, spec: EQUIPMENT_DATASET, rows, actorId: '', onAfterRow });
    } finally {
      client.release();
    }
  }

  async function countFixtureRows(): Promise<number> {
    const result = await pool!.query<{ count: number }>(
      `SELECT count(*)::int AS count FROM qc.equipment WHERE equipment_no LIKE 'FIX-EQP-%'`,
    );
    return result.rows[0].count;
  }

  it('loads a valid dataset and reconciles it', async () => {
    const report = await preflight(VALID_EQUIPMENT_ROWS);
    expect(report.counts).toMatchObject({ total: 3, ready: 3, alreadyPresent: 0 });
    expect(report.issues).toHaveLength(0);

    const applied = await applyRows(report.readyRows);
    expect(applied.inserted).toBe(3);
    expect(applied.reconciled).toBe(true);
    expect(await countFixtureRows()).toBe(3);
  });

  it('reruns idempotently: the same dataset inserts nothing new', async () => {
    await applyRows((await preflight(VALID_EQUIPMENT_ROWS)).readyRows);
    const rerun = await preflight(VALID_EQUIPMENT_ROWS);
    expect(rerun.counts.ready).toBe(0);
    expect(rerun.counts.alreadyPresent).toBe(3);

    const applied = await applyRows(rerun.readyRows);
    expect(applied.inserted).toBe(0);
    expect(await countFixtureRows()).toBe(3);
  });

  it('rejects invalid, duplicate and unresolved rows while loading only the valid ones', async () => {
    const report = await preflight(MIXED_EQUIPMENT_ROWS);
    expect(report.counts).toMatchObject({
      total: 5,
      ready: 1,
      emptyRequiredField: 1,
      invalidValue: 1,
      duplicateInBatch: 1,
      unresolvedReference: 1,
    });
    const codes = report.issues.map((issue) => issue.code);
    expect(new Set(codes)).toEqual(
      new Set([
        'DUPLICATE_IN_BATCH',
        'EMPTY_REQUIRED_FIELD',
        'INVALID_VALUE',
        'UNRESOLVED_REFERENCE',
      ]),
    );

    const applied = await applyRows(report.readyRows);
    expect(applied.inserted).toBe(1);
    expect(await countFixtureRows()).toBe(1);
  });

  it('rolls back an interrupted load and leaves zero partial rows, then succeeds on rerun', async () => {
    const report = await preflight(VALID_EQUIPMENT_ROWS);
    await expect(
      applyRows(report.readyRows, (rowNumber) => {
        if (rowNumber === 2) throw new Error('simulated interruption');
      }),
    ).rejects.toThrow(/simulated interruption/);

    // Atomicity is the engine's safe default (BD-019/BR-GEN-064 remain open):
    // the failed transaction must have written nothing.
    expect(await countFixtureRows()).toBe(0);

    const applied = await applyRows(report.readyRows);
    expect(applied.inserted).toBe(3);
    expect(await countFixtureRows()).toBe(3);

    // And the controlled retry is idempotent.
    const retry = await applyRows((await preflight(VALID_EQUIPMENT_ROWS)).readyRows);
    expect(retry.inserted).toBe(0);
    expect(await countFixtureRows()).toBe(3);
  });
});
