# Database migrations

This directory contains the authoritative PostgreSQL migrations for the QC system.

Current workspace source head after DATA-02 is `0053_validate_receiving_normalization_constraints` (53 migration files); immediately before this task it was `0052_master_data_intake_approval`. The source sequence is numbered without gaps. Migration 0049 introduces Owner-Controlled Internal Approval: it adds
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
- `scripts/db/migrate.ts` requires a contiguous four-digit source sequence, verifies the applied ledger is an exact source prefix (including names and supported SHA-256 checksums), takes a PostgreSQL advisory lock, and applies each migration plus its ledger row in one transaction. Unknown, reordered, skipped, or changed applied history is refused.
- `scripts/db/migrate.ts --check` verifies drift without creating the schema or requiring DDL privileges; the advisory lock is still taken for a consistent ledger read.
- Migration execution is explicit; the application never runs migrations during startup.
- A checksum mismatch is a hard failure. Repair is represented by a new migration, never by editing history.
- `DATABASE_URL` is the application runtime principal. The migration CLI accepts a separate direct (non-pooled) `MIGRATION_DATABASE_URL`; when absent it retains the existing shared-principal MODE A behavior for compatibility. The CLI rejects a `-pooler` endpoint for the dedicated migration URL.
- In dedicated-principal deployments, the runtime principal should not have database/schema `CREATE` or write access to `qc.schema_migrations`; the migration principal needs separately approved DDL and ledger rights. `db:preflight` reports runtime capability only and never opens `MIGRATION_DATABASE_URL`. Use the permission template in `db/README.md` separately for each principal; source support does not establish provider grants or role separation.
- Migration ownership checks remain fail-closed. No automatic ownership transfer or role creation is performed by the application credential.
- The runner accepts the exact legacy checksums from the former role/ownership model so an existing ledger is not silently rewritten. If such a database has pending migrations, the runner fails closed until a provider administrator remediates ownership; it never transfers ownership or creates roles from the application credential.

The first migration creates only shared database primitives and identity/platform infrastructure. Domain tables are introduced by later, separately reviewed migrations.

Migration 0050 adds nullable Receiving scope attributes and an append-only pilot shadow-decision ledger. In pilot profile, release never updates the Receiving row or sends an outbox command; exact scope matches produce a `SIMULATED` record, and unbound records produce a `PENDING_SCOPE_BINDING` request. Migration 0051 adds an append-only release-intent ledger that does not change product disposition or execute warehouse/ERP actions. Migration 0052 adds staged master-data revisions and scoped owner-decision evidence; the owner event is an internal approval record with deferred signature, not a formal signature. Migration 0053 validates the four receiving-normalization checks introduced as `NOT VALID` in 0035. It performs no historical backfill: a historical violation aborts the migration and requires a separately authorized disposition. None of these source migrations is asserted to be applied to any database.

The outstanding `NOT VALID` source constraints before applying 0053 are `qc.receiving_items.receiving_items__quantity_unit_vocabulary`, `receiving_items__expiry_not_before_receiving`, `receiving_items__purchase_order_no_not_blank`, and `receiving_items__source_reference_not_blank`. Migration 0053 is the controlled, forward-only validation step; no legacy value is rewritten. Actual database validation state remains unknown until an authorized operator inspects it.
