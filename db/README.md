# Database

This folder contains PostgreSQL migrations and database-owned operational artifacts. Migrations are forward-only and immutable after application. They must not be imported by the Delivery layer.

The Astro SSR application uses the provider-issued pooled runtime URL in `DATABASE_URL` (or the established profile-specific staging/pilot runtime variable). It never selects the direct maintenance URL. Migration apply and status CLIs require the operator to select the direct path explicitly and configure `DATABASE_URL_UNPOOLED`; the retained `MIGRATION_DATABASE_URL` name is a compatibility alias only when it matches. There is no fallback from these CLIs to the runtime pool. Use `pnpm exec tsx scripts/db/migrate.ts --direct` to apply pending migrations or add `--check` for a ledger check; use `pnpm exec tsx scripts/db/migration-status.ts --direct` for status. Production commands additionally require `--production-approved`, `MIGRATION_PRODUCTION_RELEASE_ID`, and `MIGRATION_PRODUCTION_APPROVAL_REFERENCE`; these operator-supplied values must point to a separately approved release/change record. The direct endpoint must be provider-issued and distinct by principal while identifying the same database as the runtime URL; pooled and direct Neon host labels are compared after removing only the endpoint's `-pooler` label.

`db:preflight` remains a read-only runtime-principal check: it reads only `DATABASE_URL`, reports PostgreSQL 18.x compatibility, capability, and pending/drift/duplicate/unknown-checksum ledger issues. It does not connect to `DATABASE_URL_UNPOOLED`, take a migration advisory lock, or prove that migration grants are correct. Runtime pool settings are bounded (five connections per process, bounded connect/query/statement waits, short idle lifetime); migration sessions use a separate one-client pool without the runtime statement timeout so controlled DDL can run to completion. Both paths preserve TLS and supported node-postgres channel-binding behavior and keep the `qc` schema and UTC defaults on each connection. `channel_binding=require` is rejected because the pinned node-postgres client can prefer channel binding but cannot enforce strict require semantics.

The SSR host's shutdown hook must call `destroyDatabase()` after it stops accepting and drains requests; that closes Kysely and its shared pg pool. The source exposes this lifecycle function, but source inspection alone does not establish that the deployment host invokes it.

Provider backup topology and retention remain deferred where approved Foundation sources say so. The SQL below is operator-facing source text for read-only inspection; it is not run by application code.

## Read-only operator SQL templates

Run each template separately with a read-only database principal. Results describe the database reached by that connection only. Do not treat source migration files or these queries as evidence that a provider has the expected schema.

### Schema version and ordered migration ledger

```sql
SELECT to_regclass('qc.schema_migrations') IS NOT NULL AS ledger_exists;

-- Run the following only when ledger_exists is true.
SELECT count(*) AS applied_count,
       (SELECT version FROM qc.schema_migrations ORDER BY version DESC LIMIT 1) AS applied_head
FROM qc.schema_migrations;

-- Ordered ledger details; run only when the ledger exists.
SELECT version, name, checksum, applied_at
FROM qc.schema_migrations
ORDER BY version;
```

If the ledger does not exist, run only the first `SELECT` and do not run the second query.

### Invalid or not-yet-validated constraints

```sql
SELECT n.nspname AS schema_name, c.relname AS table_name,
       con.conname AS constraint_name, con.contype AS constraint_type,
       pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'qc' AND NOT con.convalidated
ORDER BY c.relname, con.conname;
```

### Foreign keys without a matching leading-column index

This is a candidate list. Partial, expression, or differently ordered indexes may need manual review before any index change.

```sql
SELECT con.conrelid::regclass AS referencing_table,
       con.conname AS foreign_key,
       pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
WHERE con.contype = 'f'
  AND con.connamespace = to_regnamespace('qc')
  AND NOT EXISTS (
    SELECT 1
    FROM pg_index ix
    WHERE ix.indrelid = con.conrelid
      AND ix.indisvalid AND ix.indisready
      AND ix.indpred IS NULL
      AND ix.indnkeyatts >= cardinality(con.conkey)
      AND ARRAY(
        SELECT key_column.attnum
        FROM unnest(ix.indkey::smallint[]) WITH ORDINALITY AS key_column(attnum, position)
        WHERE key_column.position <= cardinality(con.conkey)
        ORDER BY key_column.position
      ) = con.conkey::smallint[]
  )
ORDER BY con.conrelid::regclass::text, con.conname;
```

### Table-size and dead-row estimates

PostgreSQL statistics are estimates and may be stale. This does not calculate exact bloat or authorize `VACUUM FULL`, `REINDEX`, or index removal.

```sql
SELECT schemaname, relname,
       pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
       n_live_tup AS estimated_live_rows,
       n_dead_tup AS estimated_dead_rows,
       last_vacuum, last_autovacuum, last_analyze, last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'qc'
ORDER BY pg_total_relation_size(relid) DESC, relname;
```

For a tuple-level bloat estimate, use the optional `pgstattuple` extension only when it is already installed and the operator principal already has execute permission. Do not install an extension as part of this inspection.

```sql
SELECT s.schemaname, s.relname, b.table_len,
       b.tuple_percent, b.dead_tuple_percent, b.free_percent
FROM pg_stat_user_tables s
CROSS JOIN LATERAL pgstattuple_approx(s.relid) AS b
WHERE s.schemaname = 'qc'
ORDER BY b.dead_tuple_percent DESC, s.relname;
```

### Current principal permission boundary

Run once through the runtime `DATABASE_URL` and, if configured, separately through `MIGRATION_DATABASE_URL`. The two result sets are not combined and the migration credential must never be placed in runtime configuration.

```sql
SELECT current_user AS connected_principal,
       has_database_privilege(current_user, current_database(), 'CREATE') AS can_create_schema,
       CASE WHEN to_regnamespace('qc') IS NULL THEN NULL
            ELSE has_schema_privilege(current_user, 'qc', 'CREATE') END AS can_create_qc_objects,
       CASE WHEN to_regclass('qc.schema_migrations') IS NULL THEN NULL
            ELSE has_table_privilege(current_user, 'qc.schema_migrations', 'SELECT') END AS can_read_migration_ledger,
       CASE WHEN to_regclass('qc.schema_migrations') IS NULL THEN NULL
            ELSE has_table_privilege(current_user, 'qc.schema_migrations', 'INSERT')
              OR has_table_privilege(current_user, 'qc.schema_migrations', 'UPDATE')
              OR has_table_privilege(current_user, 'qc.schema_migrations', 'DELETE')
              OR has_table_privilege(current_user, 'qc.schema_migrations', 'TRUNCATE') END AS can_write_migration_ledger;
```

For a dedicated runtime principal, schema creation and migration-ledger writes should be false; migration execution needs its own approved DDL/ledger privileges. The application still needs the table-level operations required by its use cases. This query is a narrow boundary indicator, not a complete ACL review.
