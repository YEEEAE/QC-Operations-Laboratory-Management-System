# QC-DOC-NEON-360 — Production Apply and Import Runbook

**Status: `PRODUCTION_IMPORT_BLOCKED` / migration execution `PARTIAL` — evidence refreshed 2026-10-30; no Production migration applied.**
This document is a gated operator runbook. It is not production authorization.

## Verified target and source preflight

- Neon project: `wispy-hat-00021838`
- Branch: `production` (`br-bitter-river-b59dpz92`), currently `protected=false`
- Database: `neondb` (ID `944840`); PostgreSQL `18.6`; inspected DB role: `neondb_owner`
- Applied migration ledger at inspection: contiguous through `0045`; no live migration was run.
- Neon provider snapshot listing returned no snapshots for this project. No recoverable point was verified.
- Current source migration files are numbered contiguously through `0068`; `0060` is authorization scopes, `0061` effectivity decisions, `0066` BYTEA storage, and `0067` equipment source requests and `0068` extracted-text/alias metadata. The source reconciliation does not prove migrations `0046`–`0068` are safe to apply as one release.
- Source manifest: 207 canonical rows; 179 original files physically present and matching manifest byte count and SHA-256 (29,798,087 bytes); 28 missing; 0 digest/size mismatches; 0 unsafe paths; 19 exact alias rows. The 28 unavailable entries comprise 25 standards PDFs and 3 evidence archives. All 25 standards are license-review gated.
- Manifest-declared canonical bytes total 121,143,588 bytes. This is not a verified Neon storage forecast. Database size at inspection was 14,491,648 bytes; the project is on a Free plan with a reported 1 GiB logical storage limit. Quota/cost approval and headroom forecast remain unverified.
- `qc.library_*` tables do not exist in the inspected production schema. Raw source bytes stored and verified in Neon: **0**.

## Migration evidence refresh — 2026-10-30

- Current local source contains contiguous migrations `0001`–`0080`. The 2026-10-28 inventory through `0068` above is historical, not the current source head.
- A current read-only Production ledger query returned 45 rows through `0045`; `0046`–`0080` are pending. `neondb_owner` owns all 87 checked relations in schema `qc` and remains the migration principal.
- A current Neon provider read-back confirms the Production branch remains `protected=false`; the snapshot `snap-dry-sun-b5txrwyw` exists on that branch.
- The owner later accepted the limited-runtime-role and Render configuration change. The first Neon API-created `qc_production_runtime` had `neon_superuser`, `CREATEDB`, and `CREATEROLE`; it was deleted with explicit user approval. After separate ACL approval, a SQL-created `qc_production_runtime` has `NOINHERIT NOCREATEDB NOCREATEROLE`, `qc` schema USAGE, DML on all 85 current application tables, SELECT-only on the migration ledger, sequence USAGE/SELECT, and default DML/sequence privileges for objects created by `neondb_owner`. Catalog read-back confirmed no `neon_superuser` membership and no DB/schema CREATE.
- With separate explicit approval, Render's Production `DATABASE_URL` was saved using the pooled runtime role, `sslmode=verify-full`, and `channel_binding=prefer`; read-back confirmed the key values without exposing the credential. The API update does not deploy, and the latest deploy-list read contains no deployment after the setting change. The running service has not been restarted to use the new setting.
- The new Render configuration and role are preparation only: Production remains at migration `0045`, and the Render release ID and approval-reference variables are absent. Do not deploy the new runtime setting until the required schema migration and source-backed approvals are ready.
- Snapshot `snap-dry-sun-b5txrwyw` was subsequently created from the Production branch and restored to isolated preview branch `br-blue-frost-b5i0251z`. A database-only restore read-back and an isolated `migrate()` core rehearsal through `0080` were completed there. This does not verify detached object storage or a complete QMS recovery set and is not Production migration evidence.
- The isolated rehearsal matched all 80 local migration names/checksums, including `0074` (`b2390b46d275f61c4490e4f70753d51ffae97279fb74bd52841ec58739f01982`) and corrected `0076` (`7bbdaf1497c6736bc245bb2d21a37ad3c64ef8f1d31b7f99c45fa98f7e39b2f0`). Production remains at `0045`; the 0074 compatibility path and 0076 checksum have not been applied or verified there.
- No company-controlled Production change/release ID or separate approval reference has been established. The user's migration request and isolated-rehearsal approval do not supply these company records.

## Blocking gates

Do not apply or import until all gates are evidenced for this exact target:

1. Enable production branch protection. A provider-verified snapshot exists and its database was restored to an isolated preview, but detached object storage and a complete recovery set remain unverified.
2. Obtain the approved QMS change/release ID and separate production schema approval reference. These references are absent from Render/local configuration; set the migration release context only from actual approved records.
3. Reconcile every pending migration from the live `0045` ledger through `0080`, including source checksum/history and migration `0053`/`0055` data-conflict checks. Stop on any integrity or historical-data conflict; do not hand-edit `qc.schema_migrations`.
4. Confirm the exact target project/branch/database against a direct connection. Render now saves a runtime principal distinct from the `neondb_owner` migration principal; immediately before execution, re-confirm the direct endpoint identity and ownership under `neondb_owner`.
5. Approve the storage quota/headroom and malware/content scanning policy. Confirm company rights for every standards edition before storing any full ISO bytes. Keep unavailable files unavailable.
6. Approve database grants for the application runtime principal and owner-only source review/download route. The new migration defines schema but does not grant runtime privileges. Filename candidates are not content-confirmed document identities; imported records remain unapproved and non-effective.

## Operator sequence after gates are met

Run commands only from the approved release checkout and after recording the release SHA. Preserve all command output in the release evidence record; redact connection strings and credentials.

```sh
# 1. Read-only migration preflight against the exact approved direct target.
pnpm db:migrate:status -- --direct

# 2. Read-only source reconciliation; output is written under ignored .ci-results.
pnpm qc:library:scan

# 3. Production migration only after approvals, recovery proof, and release configuration.
# The migration CLI requires --direct, --production-approved,
# MIGRATION_PRODUCTION_RELEASE_ID, and MIGRATION_PRODUCTION_APPROVAL_REFERENCE.
# Set those only from approved records. Do not run this now.
pnpm db:migrate -- --direct --production-approved

# 4. Re-run read-only migration/schema and source reconciliation; independently inspect
#    qc.schema_migrations and the deployed qc.library_* schema before any import.
pnpm db:migrate:status -- --direct
pnpm qc:library:scan
```

The repository now contains a separately gated `qc:library:apply` importer. Its default invocation is a local dry run; apply requires an explicitly configured staging identity, active canonical named System Owner, concrete change/approval/recovery references, PostgreSQL 18, and the exact source migration prefix through `0068`. No importer has been applied to any database. This runbook does not authorize staging or production writes. Do not substitute a manual SQL write or claim source parsing as durable import.

## Required closeout evidence

Record schema deployment separately from import. After a separately authorized importer exists, perform read-only reconciliation of manifest rows, aliases, `qc.files`, source occurrences, BYTEA objects, exact byte counts, and read-back SHA-256. Report `STORED_AND_VERIFIED` only for bytes actually present and re-read from this same database. Keep document identity, template digitization, approval, and effectivity counts separate.

At the 2026-10-28 preflight, no commit, push, deploy, schema apply, account permission change, source-byte import, or QMS approval was performed. In the 2026-10-30 refresh, the first overprivileged API-created runtime role was deleted; an explicitly approved SQL-created limited runtime role and Render `DATABASE_URL` were saved. No Production migration, deploy, source-byte import, or company approval was performed.
