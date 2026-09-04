# Database migrations

This directory contains the authoritative PostgreSQL migrations for the QC system.

- Files are forward-only SQL and are immutable after application to a shared environment.
- `scripts/db/migrate.ts` applies them in lexical order and records SHA-256 checksums in `qc.schema_migrations`.
- Migration execution is explicit; the application never runs migrations during startup.
- A checksum mismatch is a hard failure. Repair is represented by a new migration, never by editing history.

The first migration creates only shared database primitives and identity/platform infrastructure. Domain tables are introduced by later, separately reviewed migrations.
