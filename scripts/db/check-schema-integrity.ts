import { fileURLToPath } from 'node:url';

import { getPool } from '../../src/shared/database/pool.js';
import { loadMigrations, verifyMigrationIntegrity } from './migrate.js';

import './load-local-env.js';

const lineageTables = [
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

export async function checkSchemaIntegrity(): Promise<{
  migrationCount: number;
  tableCount: number;
  orphanCount: number;
}> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    const migrations = await loadMigrations();
    await verifyMigrationIntegrity(client, migrations);

    const expectedTables = migrations.flatMap((migration) =>
      [...migration.sql.matchAll(/CREATE TABLE(?: IF NOT EXISTS)? qc\.([a-z_]+)/gi)].map(
        (match) => match[1],
      ),
    );
    const actualTables = (
      await client.query<{ table_name: string }>(
        `SELECT table_name
         FROM information_schema.tables
         WHERE table_schema = 'qc' AND table_type = 'BASE TABLE'`,
      )
    ).rows.map(({ table_name }) => table_name);
    const expectedSet = new Set(expectedTables);
    const actualSet = new Set(actualTables);
    if (
      expectedSet.size !== actualSet.size ||
      [...expectedSet].some((table) => !actualSet.has(table))
    ) {
      throw new Error('Schema drift detected: migration table contract differs from PostgreSQL.');
    }

    const unsafeTimestamps = await client.query(
      `SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_schema = 'qc'
         AND (column_name LIKE '%_at' OR column_name IN ('created_at', 'updated_at'))
         AND data_type <> 'timestamp with time zone'`,
    );
    if (unsafeTimestamps.rowCount !== 0) {
      throw new Error(`Timestamp contract failed for ${unsafeTimestamps.rowCount} columns.`);
    }

    const missingLineage = await client.query(
      `SELECT table_name
       FROM information_schema.tables t
       WHERE t.table_schema = 'qc'
         AND t.table_name = ANY($1::text[])
         AND (
           NOT EXISTS (
             SELECT 1 FROM information_schema.columns c
             WHERE c.table_schema = t.table_schema AND c.table_name = t.table_name AND c.column_name = 'created_at'
           )
           OR NOT EXISTS (
             SELECT 1 FROM information_schema.columns c
             WHERE c.table_schema = t.table_schema AND c.table_name = t.table_name AND c.column_name = 'created_by'
           )
         )`,
      [lineageTables],
    );
    if (missingLineage.rowCount !== 0) {
      throw new Error(`Lineage contract failed for ${missingLineage.rowCount} tables.`);
    }

    const destructiveForeignKeys = await client.query<{ count: number }>(
      `SELECT count(*)::int AS count
       FROM pg_constraint c
       JOIN pg_namespace n ON n.oid = c.connamespace
       WHERE n.nspname = 'qc' AND c.contype = 'f' AND c.confdeltype = 'c'`,
    );
    if (destructiveForeignKeys.rows[0].count !== 0) {
      throw new Error('Schema integrity failed: destructive foreign-key cascade detected.');
    }

    let orphanCount = 0;
    const foreignKeys = await client.query<{
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
      const result = await client.query<{ count: number }>(
        `SELECT count(*)::int AS count
         FROM qc."${foreignKey.child_table}" child
         LEFT JOIN qc."${foreignKey.parent_table}" parent
           ON child."${foreignKey.child_column}" = parent."${foreignKey.parent_column}"
         WHERE child."${foreignKey.child_column}" IS NOT NULL
           AND parent."${foreignKey.parent_column}" IS NULL`,
      );
      orphanCount += result.rows[0].count;
    }
    if (orphanCount !== 0) throw new Error(`Orphan-record check failed: ${orphanCount} rows.`);

    return { migrationCount: migrations.length, tableCount: actualTables.length, orphanCount };
  } finally {
    client.release();
    await pool.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  checkSchemaIntegrity()
    .then((result) => console.log(JSON.stringify({ status: 'ok', ...result })))
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : 'Schema integrity check failed.');
      process.exitCode = 1;
    });
}
