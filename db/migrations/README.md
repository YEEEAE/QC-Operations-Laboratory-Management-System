# Database migrations

This directory contains the authoritative PostgreSQL migrations for the QC system.

- Files are forward-only SQL and are immutable after application to a shared environment.
- `scripts/db/migrate.ts` applies them in lexical order and records SHA-256 checksums in `qc.schema_migrations`.
- Migration execution is explicit; the application never runs migrations during startup.
- A checksum mismatch is a hard failure. Repair is represented by a new migration, never by editing history.
- Fresh Render deployments use MODE A: the Render-managed `DATABASE_URL` credential is both migration principal and runtime principal. The credential must be able to create schemas/objects in its database, but it does not need `CREATEROLE`, `qc_migrator`, or `qc_app_runtime`.
- Migrations intentionally leave the `qc` schema and its objects owned by the current database principal. This is required because the current modular monolith has one database identity and does not select a separate runtime role.
- The runner accepts the exact legacy checksums from the former role/ownership model so an existing ledger is not silently rewritten. If such a database has pending migrations, the runner fails closed until a provider administrator remediates ownership; it never transfers ownership or creates roles from the application credential.

The first migration creates only shared database primitives and identity/platform infrastructure. Domain tables are introduced by later, separately reviewed migrations.
