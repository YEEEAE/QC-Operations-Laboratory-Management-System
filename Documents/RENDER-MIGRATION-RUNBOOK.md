# Controlled PostgreSQL migration change plan

This is a source-level operator plan. It is not evidence that any migration has run, that a backup exists, or that production is ready for a schema change.

## Source inventory and immutable history

The committed source on this checkout contains 53 contiguous migration files, `0001` through `0053`. The runner reads the directory and derives the current head and pending set each time; this count is an inventory snapshot, not a version constant. Do not edit or renumber an applied migration, update a stored checksum, or fill a ledger gap manually. Corrective work is a new, reviewed forward migration.

The operator CLI is separate from Astro process startup, readiness/liveness health checks, and runtime-principal preflight. It requires an explicit direct connection selection and `DATABASE_URL_UNPOOLED`; the runtime `DATABASE_URL` remains pooled and is never a migration fallback. Do not put direct credentials in application runtime settings, command output, tickets, or this document.

Production is denied by default. A future authorized production invocation must carry `--production-approved`, `MIGRATION_PRODUCTION_RELEASE_ID`, and `MIGRATION_PRODUCTION_APPROVAL_REFERENCE` at runtime, and those identifiers must trace to the independently approved release and change-control record. The source gate validates that context is present; it does not replace the release authority's approval decision. The configured runtime identity and direct URL must resolve to the same production database, with a distinct migration principal. The supplied branch label is metadata only and is not a connection target.

## Required change-control sequence

1. **Review the source change.** Confirm the exact migration files, dynamically derived source head, applied-ledger prefix, checksum dispositions, expected lock behavior, unique constraints/indexes, data volume, and any `NOT VALID`/validation steps. Obtain domain and QMS owner decisions where data or controlled evidence is affected. Do not infer scientific limits, approval, or release from schema state.
2. **Capture a pre-change snapshot.** An authorized operator records the provider branch/database identity, timestamp, migration source revision, and snapshot identifier. Confirm the snapshot is usable under the organization's recovery procedure. This plan does not create or verify a snapshot.
3. **Take and record a pre-release backup.** Follow the approved database backup procedure with an authorized operator and direct provider-issued connection. Record backup identity, completion evidence, retention, and restore path in the controlled change record. Do not place credentials or full connection strings in evidence.
4. **Approve the maintenance window.** Obtain release/change approval, named operators, impact and communication plan, expected lock/scan duration, stop conditions, and a window that allows observation after DDL. Confirm no incompatible application release is serving during a breaking transition.
5. **Inspect without mutation.** Use approved read-only procedures to inspect the ordered `qc.schema_migrations` ledger, source/schema drift, invalid constraints, duplicate/invalid historical data, and relevant lock/ownership conditions. Reconcile pending and unknown checksums before any apply. Do not treat `db:preflight` as proof of migration-principal privileges.
6. **Apply only through the operator migration entrypoint.** The runner takes its database advisory lock, checks PostgreSQL 18.x and exact ledger/source compatibility, then runs each migration and its ledger insert in one transaction. It stops at the first error. Do not run application startup as a migration mechanism.
7. **Handle failures conservatively.** A reported rollback means that migration transaction rolled back and later migrations were not attempted. If the connection is lost during commit or rollback, the outcome is unknown: stop, preserve evidence, and reconcile the read-only ledger and schema with the database owner before any retry. Never edit the old migration or ledger checksum to make a retry pass. Historical data violations require an explicit, approved disposition and a new forward migration; no arbitrary default or silent backfill is allowed.
8. **Validate the controlled result.** After an authorized operation, use separately approved read-only inspection to confirm the applied head, checksums, constraint validation state, schema/catalog expectations, and application compatibility. Record observed results and unresolved issues. A PASS state is not product RELEASE, scientific approval, or UAT acceptance.

## `NOT VALID` constraint promotion

Where a reviewed migration adds a constraint as `NOT VALID`, the constraint protects new or changed rows while existing rows remain unvalidated. Identify historical violations using an approved read-only inspection. Each invalid value needs a documented owner disposition before a later forward-only migration runs `VALIDATE CONSTRAINT`. Validation failure is a stop condition; it does not authorize editing the original migration, relaxing the constraint, or applying invented values. The existing source validation step is migration `0053`; actual provider validation status is unknown until inspected by an authorized operator.

## Rollback and recovery

Schema rollback is not performed by rewriting or deleting migrations, changing checksums, or running a down migration. Prefer a new, reviewed corrective migration that safely restores the intended compatible schema while preserving records and audit history. If forward correction is unsafe or data integrity is uncertain, stop and invoke the separately approved backup/recovery and incident procedure; a restore may discard writes made after the snapshot and needs its own explicit authorization and recovery decision.

No snapshot, backup, preflight, SQL, migration, restore, connection, or production operation is performed by this document.
