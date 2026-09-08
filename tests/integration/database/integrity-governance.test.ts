import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadMigrations, migrate, verifyMigrationIntegrity } from '../../../scripts/db/migrate.js';
import { createPool } from '../../../src/shared/database/pool.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

const ACTOR_ID = '01900000-0000-7000-8000-00000000d001';

const LINEAGE_TABLES = [
  'users',
  'tasks',
  'findings',
  'ncrs',
  'rcas',
  'capas',
  'receiving_items',
  'inspection_templates',
  'inspection_template_versions',
  'inspection_reports',
  'lab_tests',
  'equipment',
  'calibration_records',
  'maintenance_records',
  'document_identities',
  'document_versions',
  'change_requests',
] as const;

// Canonical actor-lineage column per table. DATA-DICTIONARY/DATA-MODEL define
// `requested_by` (not `created_by`) as the actor lineage for change_requests.
const LINEAGE_ACTOR_COLUMNS: Record<string, string> = {
  change_requests: 'requested_by',
};

const BUSINESS_NUMBER_COLUMNS = [
  ['tasks', 'task_no'],
  ['findings', 'finding_no'],
  ['ncrs', 'ncr_no'],
  ['rcas', 'rca_no'],
  ['capas', 'capa_no'],
  ['receiving_items', 'receiving_no'],
  ['inspection_templates', 'template_code'],
  ['lab_test_templates', 'test_code'],
  ['equipment', 'equipment_no'],
  ['calibration_records', 'calibration_no'],
  ['maintenance_records', 'maintenance_no'],
  ['document_identities', 'document_no'],
  ['change_requests', 'change_no'],
] as const;

const CRITICAL_INDEXES = [
  ['tasks', 'state'],
  ['tasks', 'current_assignee_id'],
  ['receiving_items', 'workflow_state'],
  ['receiving_items', 'inspection_result'],
  ['inspection_reports', 'state'],
  ['lab_tests', 'state'],
  ['equipment', 'state'],
  ['calibration_records', 'state'],
  ['document_versions', 'state'],
  ['approval_cases', 'state'],
  ['change_requests', 'state'],
  ['outbox_events', 'available_at'],
] as const;

describe('PostgreSQL integrity, governance, and drift contracts', () => {
  let pool: ReturnType<typeof createPool> | undefined;

  beforeAll(async () => {
    pool = createPool({
      connectionString: getTestDatabaseUrl(await startPostgresContainer()),
      max: 10,
    });
    await pool.query('DROP SCHEMA IF EXISTS qc CASCADE');
    await migrate({ pool });
    await pool.query(
      `INSERT INTO qc.users (id, login_identity, display_name, password_hash)
       VALUES ($1, 'integrity-governance-actor', 'Integrity governance actor', 'test-only-placeholder-not-a-secret')`,
      [ACTOR_ID],
    );
  });

  afterAll(async () => {
    await pool?.end();
    await stopPostgresContainer();
  });

  it('applies every migration on a fresh database and leaves an immutable current ledger', async () => {
    const migrations = await loadMigrations();
    const ledger = await pool!.query<{ version: string; name: string; checksum: string }>(
      'SELECT version, name, checksum FROM qc.schema_migrations ORDER BY version',
    );

    expect(ledger.rows.map(({ version }) => version)).toEqual(
      migrations.map(({ version }) => version),
    );
    expect(ledger.rows).toHaveLength(migrations.length);
    const client = await pool!.connect();
    try {
      await expect(verifyMigrationIntegrity(client, migrations)).resolves.toBeUndefined();
    } finally {
      client.release();
    }

    const secondRun = await migrate({ pool });
    expect(secondRun.applied).toEqual([]);
    expect(secondRun.pending).toEqual([]);
  });

  it('detects schema-to-migration drift and missing migration objects', async () => {
    const migrations = await loadMigrations();
    const expectedTables = migrations.flatMap((migration) =>
      [...migration.sql.matchAll(/CREATE TABLE(?: IF NOT EXISTS)? qc\.([a-z_]+)/gi)].map(
        (match) => match[1],
      ),
    );
    const actualTables = (
      await pool!.query<{ table_name: string }>(
        `SELECT table_name
         FROM information_schema.tables
         WHERE table_schema = 'qc' AND table_type = 'BASE TABLE'
         ORDER BY table_name`,
      )
    ).rows.map(({ table_name }) => table_name);

    expect(actualTables).toEqual(expect.arrayContaining(expectedTables));
    expect(expectedTables).toEqual(expect.arrayContaining(actualTables));
  });

  it('uses TIMESTAMPTZ for event timestamps and preserves lineage/version fields', async () => {
    const unsafeTimestamps = await pool!.query(
      `SELECT table_name, column_name, data_type
       FROM information_schema.columns
       WHERE table_schema = 'qc'
         AND (column_name LIKE '%_at' OR column_name IN ('created_at', 'updated_at'))
         AND data_type <> 'timestamp with time zone'`,
    );
    expect(unsafeTimestamps.rows).toEqual([]);

    for (const table of LINEAGE_TABLES) {
      const columns = (
        await pool!.query<{ column_name: string }>(
          `SELECT column_name
           FROM information_schema.columns
           WHERE table_schema = 'qc' AND table_name = $1`,
          [table],
        )
      ).rows.map(({ column_name }) => column_name);
      expect(columns, `${table} lineage columns`).toEqual(
        expect.arrayContaining(['created_at', LINEAGE_ACTOR_COLUMNS[table] ?? 'created_by']),
      );
      expect(columns, `${table} optimistic version`).toContain('version');
    }
  });

  it('has no destructive cascade through controlled history and indexes critical filters', async () => {
    const destructiveForeignKeys = await pool!.query(
      `WITH fk AS (
         SELECT c.confdeltype
         FROM pg_constraint c
         JOIN pg_namespace n ON n.oid = c.connamespace
         WHERE n.nspname = 'qc' AND c.contype = 'f'
       )
       SELECT count(*)::int AS count FROM fk WHERE confdeltype = 'c'`,
    );
    expect(destructiveForeignKeys.rows[0].count).toBe(0);

    for (const [table, column] of CRITICAL_INDEXES) {
      const result = await pool!.query<{ count: number }>(
        `SELECT count(*)::int AS count
         FROM pg_class r
         JOIN pg_index i ON i.indrelid = r.oid
         JOIN pg_attribute a ON a.attrelid = r.oid AND a.attnum = i.indkey[0]
         WHERE r.relnamespace = 'qc'::regnamespace
           AND r.relname = $1
           AND i.indisvalid
           AND a.attname = $2`,
        [table, column],
      );
      expect(result.rows[0].count, `${table}.${column} index`).toBeGreaterThan(0);
    }
  });

  it('keeps business identifiers unique under concurrent allocation attempts', async () => {
    const insertTask = (id: string) =>
      pool!.query(
        `INSERT INTO qc.tasks (id, task_no, title, priority, state, created_by)
         VALUES ($1, 'TASK-CONCURRENCY-001', 'Concurrent task', 'NORMAL', 'DRAFT', $2)`,
        [id, ACTOR_ID],
      );

    const outcomes = await Promise.allSettled([
      insertTask('01900000-0000-7000-8000-00000000d011'),
      insertTask('01900000-0000-7000-8000-00000000d012'),
    ]);
    expect(outcomes.filter((outcome) => outcome.status === 'fulfilled')).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome.status === 'rejected')).toHaveLength(1);

    const stored = await pool!.query(
      `SELECT count(*)::int AS count FROM qc.tasks WHERE task_no = 'TASK-CONCURRENCY-001'`,
    );
    expect(stored.rows[0].count).toBe(1);
  });

  it('keeps each canonical business-number column protected by a unique constraint', async () => {
    for (const [table, column] of BUSINESS_NUMBER_COLUMNS) {
      const result = await pool!.query<{ count: number }>(
        `SELECT count(*)::int AS count
         FROM pg_constraint c
         JOIN pg_class r ON r.oid = c.conrelid
         JOIN pg_attribute a ON a.attrelid = r.oid AND a.attnum = ANY(c.conkey)
         WHERE r.relnamespace = 'qc'::regnamespace
           AND r.relname = $1
           AND c.contype = 'u'
           AND a.attname = $2`,
        [table, column],
      );
      const indexed = await pool!.query<{ count: number }>(
        `SELECT count(*)::int AS count
         FROM pg_class r
         JOIN pg_index i ON i.indrelid = r.oid
         JOIN pg_attribute a ON a.attrelid = r.oid AND a.attnum = i.indkey[0]
         WHERE r.relnamespace = 'qc'::regnamespace
           AND r.relname = $1
           AND i.indisunique
           AND a.attname = $2`,
        [table, column],
      );
      expect(
        result.rows[0].count + indexed.rows[0].count,
        `${table}.${column} uniqueness`,
      ).toBeGreaterThan(0);
    }
  });

  it('reports zero orphan rows across every declared foreign key', async () => {
    const foreignKeys = await pool!.query<{
      child_table: string;
      child_column: string;
      parent_table: string;
      parent_column: string;
    }>(
      `SELECT child.relname AS child_table,
              child_col.attname AS child_column,
              parent.relname AS parent_table,
              parent_col.attname AS parent_column
       FROM pg_constraint c
       JOIN pg_class child ON child.oid = c.conrelid
       JOIN pg_class parent ON parent.oid = c.confrelid
       JOIN pg_attribute child_col ON child_col.attrelid = child.oid AND child_col.attnum = c.conkey[1]
       JOIN pg_attribute parent_col ON parent_col.attrelid = parent.oid AND parent_col.attnum = c.confkey[1]
       JOIN pg_namespace n ON n.oid = child.relnamespace
       WHERE n.nspname = 'qc' AND c.contype = 'f' AND cardinality(c.conkey) = 1`,
    );

    for (const foreignKey of foreignKeys.rows) {
      const orphanCount = await pool!.query(
        `SELECT count(*)::int AS count
         FROM qc."${foreignKey.child_table}" child
         LEFT JOIN qc."${foreignKey.parent_table}" parent
           ON child."${foreignKey.child_column}" = parent."${foreignKey.parent_column}"
         WHERE child."${foreignKey.child_column}" IS NOT NULL
           AND parent."${foreignKey.parent_column}" IS NULL`,
      );
      expect(
        orphanCount.rows[0].count,
        `${foreignKey.child_table}.${foreignKey.child_column} orphan rows`,
      ).toBe(0);
    }
  });
});
