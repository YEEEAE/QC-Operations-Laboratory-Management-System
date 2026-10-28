# QC-DOC-NEON-360 — Production Apply and Import Runbook

**Status: `PRODUCTION_IMPORT_BLOCKED` — read-only preflight completed 2026-10-28.**
This document is a gated operator runbook. It is not production authorization.

## Verified target and source preflight

- Neon project: `wispy-hat-00021838`
- Branch: `production` (`br-bitter-river-b59dpz92`), currently `protected=false`
- Database: `neondb` (ID `944840`); PostgreSQL `18.6`; inspected DB role: `neondb_owner`
- Applied migration ledger at inspection: contiguous through `0045`; no live migration was run.
- Neon provider snapshot listing returned no snapshots for this project. No recoverable point was verified.
- Current source sequence is reconciled through `0066`; `0060` is authorization scopes, `0061` effectivity decisions, and new BYTEA library schema is `0066`. The source reconciliation does not prove migrations `0046`–`0066` are safe to apply as one release.
- Source manifest: 207 canonical rows; 179 original files physically present and matching manifest byte count and SHA-256 (29,798,087 bytes); 28 missing; 0 digest/size mismatches; 0 unsafe paths; 19 exact alias rows. The 28 unavailable entries comprise 25 standards PDFs and 3 evidence archives. All 25 standards are license-review gated.
- Manifest-declared canonical bytes total 121,143,588 bytes. This is not a verified Neon storage forecast. Database size at inspection was 14,491,648 bytes; the project is on a Free plan with a reported 1 GiB logical storage limit. Quota/cost approval and headroom forecast remain unverified.
- `qc.library_*` tables do not exist in the inspected production schema. Raw source bytes stored and verified in Neon: **0**.

## Blocking gates

Do not apply or import until all gates are evidenced for this exact target:

1. Enable production branch protection and obtain a provider-verified recoverable snapshot/PITR reference for `br-bitter-river-b59dpz92`.
2. Obtain the approved QMS change/release ID and separate production schema approval reference. Configure the repository migration release context only from those approved records.
3. Reconcile every pending migration from the live `0045` ledger through `0066`, including source checksum/history and migration `0053`/`0055` data-conflict checks. Stop on any integrity or historical-data conflict; do not hand-edit `qc.schema_migrations`.
4. Confirm the exact target project/branch/database against a direct connection. Use a dedicated migration principal distinct from the runtime principal.
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

**Import is not implemented or authorized by this runbook.** The current `qc:library:prepare` command generates a local classification/content-addressing plan only. It does not store database rows or bytes. A separately approved importer must be completed and reviewed before an import command is offered. Do not substitute a manual SQL write or claim that the source plan is an import.

## Required closeout evidence

Record schema deployment separately from import. After a separately authorized importer exists, perform read-only reconciliation of manifest rows, aliases, `qc.files`, source occurrences, BYTEA objects, exact byte counts, and read-back SHA-256. Report `STORED_AND_VERIFIED` only for bytes actually present and re-read from this same database. Keep document identity, template digitization, approval, and effectivity counts separate.

No commit, push, deploy, schema apply, account permission change, source-byte import, or QMS approval was performed during this preflight.
