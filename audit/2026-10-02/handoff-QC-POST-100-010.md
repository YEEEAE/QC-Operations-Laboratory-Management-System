# QC-POST-100-010 — production schema and release identity reconciliation

**Date:** 2026-10-02 (Asia/Riyadh)  
**State:** **PARTIAL / BLOCKED** — source inventory and operator plan are prepared; current provider ledger, exact runtime identity, production readiness, and migration acceptance are NOT VERIFIED.  
**Finding trace:** QC-PAGE-F-002, QC-ENV-F-001  
**Affected surface:** `/system/health`, production database

## Candidate and historical evidence boundary

- Requested historical audit SHA: `6059e177438d8ae110c99084d32758b048f22cd2`. It is not the current checkout and its evidence is not carried forward.
- Current checkout at task start: clean `main`, HEAD `c083a5b998cc8d51d23f7df0cc578c8a43ab767f`. This handoff and the source manifest are task outputs; the final local source fingerprint is recorded in `.ci-results/QC-POST-100-010.json` after the final freeze.
- Rechecked report sections 4/5/41/50 and `audit/2026-10-02/post-implementation/verification-data.json`: these remain historical and bind the audit candidate, including the recorded 25 pending of 43, local empty-schema 43/85/0, and the explicit absence of applied-ledger/current-runtime/upgrade-restore proof. None establishes present production state.
- The prior read-only provider snapshot `audit/2026-10-01/env-parity/database-readonly.json` is also historical: PostgreSQL 18.6, TLS/read-only, 18 applied of 42, 24 pending; it contains no individual applied checksum rows and predates migration 0043. Do not combine it with the later 25/43 health projection as if they were one observation.

## Rechecked source facts

- Current source contains **43** ordered migrations through `0043_controlled_document_source_binding`.
- All **42/42** names and SHA-256 checksums in the prior source manifest remain byte-identical. `0043` is the sole addition; its SQL SHA-256 is `bba7c163956c82fe0fa829828bfc0bab9e7b47c1895d197a04e5d82d802ef35c`.
- Full source inventory: `audit/2026-10-02/post-implementation/QC-POST-100-010-source-migration-manifest.tsv`.
- This is source-to-historical-source parity only. Applied production names/checksums, missing tables, exact candidate artifact/runtime/config match, and live `/system/health` readiness are **NOT VERIFIED**. No current PostgreSQL or Render connection is available to this task.
- The credential gate in `Documents/RENDER-DATABASE-CONNECTION.md` remains a prerequisite. Its completion is not production migration authorization.

## Operator sequence after the credential gate

### 1. Re-freeze and bind the candidate

1. Finish source changes and run `pnpm verification:begin` immediately before evidence collection. Record exact Git SHA, source fingerprint, migration head and manifest digest. A dirty fingerprint may bind local analysis, but it cannot satisfy a clean production release identity.
2. Build the candidate under the declared Node contract (`>=24.20.0 <25`), then capture the generated artifact identity and digest. Read the completed provider deployment/runtime identity independently; require its SHA, build/artifact identity, entry digest, version and migration head to match the frozen candidate. An in-progress deployment or `SERVICE_VERSION` by itself is insufficient.
3. Read back only sanitized configuration names/presence and the canonical connection validation result. Do not store or print URL, host, username, credential, or raw exception values.

### 2. Read-only source/applied ledger reconciliation

1. After the credential owner confirms the rotation gate, obtain an authorized TLS PostgreSQL 18.x read-only session. Start a transaction, set it read-only, and select only `version`, `name`, and `checksum` from `qc.schema_migrations`, ordered by version. Do not query business rows or export credentials.
2. Compare the complete applied set against the frozen 43-row source manifest. Require exact version/name/checksum equality for every applied row, no duplicate or unknown rows, no missing source migration, and report the pending set explicitly. Stop on any mismatch or unknown historical checksum; do not edit a migration or ledger row to make it match.
3. Confirm schema/catalog availability against the tables expected by migrations 0001–0043 with the read-only schema-integrity check. Record each absent expected table and fail acceptance if any are missing. Counts alone and `/api/health/ready` are not ledger or artifact proof.
4. Capture sanitized PostgreSQL version, TLS/read-only assertions, source and applied head/count, per-row comparison result, missing-table list, timestamp, candidate SHA/fingerprint, artifact digest and runtime readback identity. Do not retain raw provider exports or secrets.

### 3. Isolated rehearsal before any production change

1. On a new disposable PostgreSQL 18.x database, replay the exact frozen migration bundle with the official runner from the verified starting state. Preserve the runner's advisory lock, lexical order, and one transaction per migration. Exercise failure rollback/retry, already-applied no-op, checksum mismatch denial, and restore to a second empty disposable database.
2. Require 43/43 exact source/applied names and checksums, zero pending/mismatches, all expected tables present, and passing schema-integrity checks. Record isolated rehearsal evidence separately; it does not prove production state.
3. Never manually mark a migration applied or alter a historical checksum. A semantic correction is a new forward migration after review.

### 4. Production decision gate and controlled execution

Production migration is **not authorized by this handoff, a credential rotation, a successful preflight, or a ready health endpoint**. Before execution, the named release/database owner must separately authorize the exact candidate, provider target, migration action and window, and confirm an approved backup with a successful isolated restore and applicable recovery parameters. The authorization record must bind those approvals to the same candidate and target.

Only after that decision may the operator run the official migration command against the explicitly confirmed target. Capture runner output without credentials and stop on the first error, unexpected pending set, checksum/name mismatch, ownership/privilege gate, or health/runtime identity mismatch. Do not retry an ambiguous operation until the ledger and schema are read back and reconciled.

## Rollback and recovery posture

- These migrations are forward-only. There is no reverse SQL rollback plan and no manual ledger repair.
- A failure inside a migration transaction must leave that migration and its ledger row unapplied; verify with a fresh read-only ledger/catalog read before any retry. Previously committed migrations remain applied.
- If an earlier migration committed and the candidate application fails, stop promotion. Roll back application bytes only if the prior application is confirmed compatible with the resulting schema. Otherwise preserve the database and use a separately reviewed forward fix.
- Restoring a pre-migration backup is a separate destructive production operation. It requires explicit recovery authorization, an approved target/impact assessment, a validated backup and isolated restore, and a record of post-restore ledger/schema checks. Do not restore over production as an automatic response.
- Any unknown write/connection outcome requires read-back reconciliation of ledger and schema before retry; do not claim rollback without evidence.

## Acceptance ledger

| Criterion | Current result |
|---|---|
| Current source manifest | **PASS** — 43 entries; previous 42 unchanged; 0043 added |
| Applied ledger names/checksums on production | **NOT VERIFIED** — no current read-only provider session; old snapshots are historical |
| No missing expected tables on production | **NOT VERIFIED** — only historical empty-schema 85-table evidence exists |
| Artifact/runtime/config match on the exact candidate | **NOT VERIFIED** — no completed current provider runtime readback |
| Live `/system/health` ready on the exact candidate | **NOT VERIFIED** — no current authenticated owner route/session |
| Isolated PostgreSQL 18 upgrade/rollback/recovery rehearsal | **BLOCKED** — no available supported database/container runtime evidence in this task |
| Production migration authorization/action | **NOT RUN** — requires separate explicit authorization |
| Human UAT | **NOT RUN** — no human evidence manufactured |

QC-PAGE-F-002 and QC-ENV-F-001 remain **PARTIAL / NOT CLOSED**. No production connection, migration, write, deploy, commit, push, merge, credential rotation, or human UAT was performed.
