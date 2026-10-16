# Database migrations

This directory contains the authoritative PostgreSQL migrations for the QC system.

Current workspace source head is `0049_owner_approval_authority` (49 migration
files). Migration 0049 introduces Owner-Controlled Internal Approval: it adds
non-destructive owner-decision columns to `qc.approval_decisions` (decision type,
owner authority and login identity, previous/resulting state, authorization
context, evidence references, the deferred-signature marker and a real FK to the
linked audit event), a fail-closed unique idempotency index on
`(approval_case_id, work_item_id, request_id)`, and CHECK constraints that keep
the owner authority a closed vocabulary. It rewrites no historical decision and
creates no electronic signature; the electronic-signature ceremony is deferred for
the owner pathway by owner decision
(`README-system-detailed/OWNER-DECISION-OWNER-CONTROLLED-APPROVAL-2026-10-16.md`).
Migration 0048 adds an explicit template authoring origin — a verbatim
source transcription keeps the 0046 evidence chain unchanged, while an in-system
authored specification is approved against a bound EFFECTIVE controlled document
version — plus structured controlled-document bodies
(`qc.document_version_sections`, `qc.document_versions.body_hash`) that are
writable only while their revision is a draft. Migration 0047 adds scoped task references and an immutable, uniquely
keyed recurring occurrence contract. Migration 0046 adds the controlled inspection
report catalogue and source-bound selection guards. These are source changes;
provider application requires a separate authorized migration operation.

Migration 0045 adds a signed-provider nonce claim table and a
unique signer/key/nonce guard; it backfills from immutable `audit_info` and fails
closed for invalid or duplicate historical nonce values. Migration 0044 adds the unique key required by restore request
idempotency; it fails closed if duplicate pairs already exist. Migration 0043 adds server-bound document file/revision digests,
immutable usage snapshots, and file digest metadata guards. It is not verified as
applied to any provider database. Migration 0042 makes laboratory equipment usage snapshots append-only.
Migration 0041 adds partial indexes for the bounded,
actor-scoped document review queue. Migration 0040 adds signed provider-evidence identity and
append-only constraints; it has not been applied to a live database. Historical
documentation freezes may cite earlier source heads. A read-only Render
provider query on 2026-09-22 reported applied head `0018`; that is historical
evidence only and does not establish current production parity. Do not apply
pending provider migrations without the explicit authorization and credential
rotation gate documented in `Documents/RENDER-DATABASE-CONNECTION.md`.

- Files are forward-only SQL and are immutable after application to a shared environment.
- `scripts/db/migrate.ts` applies them in lexical order and records SHA-256 checksums in `qc.schema_migrations`.
- Migration execution is explicit; the application never runs migrations during startup.
- A checksum mismatch is a hard failure. Repair is represented by a new migration, never by editing history.
- Fresh Render deployments use MODE A: the Render-managed `DATABASE_URL` credential is both migration principal and runtime principal. The credential must be able to create schemas/objects in its database, but it does not need `CREATEROLE`, `qc_migrator`, or `qc_app_runtime`.
- Migrations intentionally leave the `qc` schema and its objects owned by the current database principal. This is required because the current modular monolith has one database identity and does not select a separate runtime role.
- The runner accepts the exact legacy checksums from the former role/ownership model so an existing ledger is not silently rewritten. If such a database has pending migrations, the runner fails closed until a provider administrator remediates ownership; it never transfers ownership or creates roles from the application credential.

The first migration creates only shared database primitives and identity/platform infrastructure. Domain tables are introduced by later, separately reviewed migrations.
