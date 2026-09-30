# QC-ADP26-02 — migration ledger and release identity handoff

**Date:** 2026-09-30 (Asia/Riyadh)  
**State:** `PARTIAL / NO-GO`  
**Finding:** `QC-PAGE-F-002` — migration schema and release identity  
**Scope:** `/system/health`, `/system/control-center`, migration integrity and isolated PostgreSQL recovery rehearsal.

## Candidate and source identity

| Field | Value | Status |
|---|---|---|
| Branch / base HEAD | `main` / `866575108e6129ea6964094488d5b336f8746ba8` | Candidate started on clean local worktree; task changes remain uncommitted |
| Candidate source fingerprint | `.ci-results/run-context.json` | Candidate-bound; see ignored local evidence, do not transplant |
| Runtime | Node `v24.20.0`; package contract `pnpm@11.25.0` | Node VERIFIED; pnpm executable version NOT VERIFIED (Corepack cache write was denied) |
| Source migration set | 42 migrations; head `0042_immutable_lab_equipment_usage` | VERIFIED from current source |
| Local build identity | `rel-831d314e8b96b749`; artifact `dist/server/entry.mjs`, SHA-256 `addbdba94965b4d4a824106e740b20210825c325b62a2f4cf9317436b4ee0655` | Local build/release verification PASS; does not identify or attest live Render |
| Production artifact / deployment identity | No trusted live identity retrieved | `NOT VERIFIED`; historical `LIVE-2026-09-30-health` does not prove current deployment |

The audit baseline `0b1bb21bb3b4eca77862dbba1da8623044e96355` differs from the current base and is historical. Its observations were not copied as current production state. No production URL or credentials were used.

## Changed

- The system-health migration read now compares every applied ledger row to the exact shipped migration filename/name and SHA-256 bytes. It accepts only the same explicit known-legacy checksums as the forward-only migration runner. Unknown versions, names, hashes, and unreadable/empty migration source fail closed.
- Migration readiness degrades on any pending migration or ledger identity mismatch; it reports `UNKNOWN` when the shipped source cannot be read. Connectivity readiness remains separate from QC release readiness.
- The control center marks checksum/name drift and unavailable migration source as blockers and tells the operator that connectivity is not release approval.
- The migration runner and health reader share the same checksum compatibility policy. No migration file or database schema was changed.
- Added regression coverage for exact-match, pending, name/checksum mismatch, known legacy hash, unknown version, unavailable migration source, checksum-only drift, and release readiness remaining blocked despite healthy connectivity.

## Evidence

All database work below used disposable PostgreSQL **18.6** on loopback with TLS in a temporary local cluster. `qc_adp26_02`, `qc_adp26_02_upgrade`, and `qc_adp26_02_restore` are not production databases.

| Requirement | Result | Evidence / limit |
|---|---|---|
| Read-only preflight before rehearsal | `PASS` | PostgreSQL 18.6, transaction read-only; initially no `qc` schema/ledger and 42 source migrations pending. Connectivity is not GO. |
| Exact source-to-applied ledger reconciliation | `PASS` locally | 42 source / 42 applied; 42 exact names and SHA-256 checksums; 0 legacy, 0 mismatch, 0 pending. Row-by-row sanitized manifest: [migration-ledger-QC-ADP26-02.tsv](migration-ledger-QC-ADP26-02.tsv). |
| Upgrade rehearsal | `PASS` locally | Fresh DB advanced from the first 18 current source migrations to 0042: 18 baseline applied, then 24 forward migrations, 0 pending. This is a source rehearsal; the actual historical/live 0018 ledger was not accessed. |
| Migration failure rollback | `PASS` locally | Existing PostgreSQL migration integration suite: 5/5 tests, including failed-migration rollback and no ledger row, checksum rejection, concurrency, and up-to-date no-op. |
| Backup and restore drill | `PASS` locally | PostgreSQL 18 custom dump restored into a separate empty database. Dump SHA-256: `544eb0c69c011379f002ade5d9439aaeb2b3e0d8ea078e528133636ec2cb29be`. This contained the schema/ledger rehearsal, not production data. |
| Restored schema contract | `PASS` locally | `check-schema-integrity.ts`: 42 migrations, 85 tables, 0 orphan rows; migration checksum verification passed. |
| Restored health reader | `PASS` locally | Actual `createPostgresMigrationStatus` returned applied/build head `0042`, 0 pending, 0 mismatches, shipped source available. |
| Unit/application regression | `PASS` | `tests/unit/system-health/migration-status.test.ts`, `tests/unit/system-health/control-center-overview.test.ts`, and `tests/integration/system/system-health.test.ts`: 23 tests passed on the focused run. |
| Typecheck / Astro diagnostics | `PARTIAL` | `tsc --noEmit`: 9 errors in untouched `.mjs` route-acceptance/release scripts (implicit `any` and missing declarations); whether they predate this candidate was not checked. `astro-check`: 0 errors, 0 warnings, 89 hints. The new nullable-ledger-name error was corrected. |
| Local build and release identity | `PASS` | Astro server/client build passed (existing chunk-size and dependency annotation warnings retained); local identity `rel-831d314e8b96b749` verified for exact Git HEAD and artifact SHA above. |
| Browser widths, keyboard, manual AT, route UAT | `NOT VERIFIED` | Safari Computer Use permission was unavailable. No browser/AT/UAT or human sign-off is claimed. |
| Production schema, role, release gates, live deployment | `NOT VERIFIED / NO-GO` | No authorized live database or trusted Render artifact identity was available. Approved release gates remain independently required; a connected database cannot grant GO. |

The local full-ledger exact match uses a database freshly migrated from the current source and then restored. It proves the reconciliation implementation against this local candidate. It does **not** prove the live database's reported 0018 ledger or the historical checksums of those rows. Production candidate reconciliation remains open until an authorized, read-only exact-candidate preflight supplies those rows and a trusted release identity.

## Forward recovery preparation

No schema change was needed. Production remains untouched. Before any separately authorized production action:

1. Bind the exact approved release artifact to its source SHA, dirty/source fingerprint (normally clean CI source), migration-set digest/head, and artifact SHA; verify the deployment reports that same identity.
2. Run the documented read-only preflight against the intended database and export the complete applied ledger (version, name, checksum). Reconcile every row to that exact artifact; stop on any unknown version/hash/name, missing source, privilege/ownership issue, or unexpected pending set.
3. Obtain the approved backup and recovery target/retention/RPO/RTO decision from their owners; capture and verify a backup and perform a restore validation before migration. Those operational values remain unapproved and are not invented here.
4. Review the complete forward-only migration set and expected constraints on an isolated PostgreSQL 18 rehearsal. Preserve the migration runner's advisory lock and per-migration transaction. Do not edit historical migrations or manually mark ledger rows applied.
5. During any authorized run, verify the release identity and ledger again immediately before migration. Afterward verify the full ledger/checksums, schema contract, application health, and approved business smoke checks. If interrupted, inspect the ledger and object state before retrying; do not blindly rerun or restore over the source database.
6. If the change is incompatible or the target is uncertain, stop writes and follow the separately approved restore/incident plan. Prefer a new forward fix when safe; a code rollback alone does not reverse database migrations.

No operator credential, restore target, backup retention, RPO/RTO, production role, or approval signature was supplied or inferred.

## Pages and findings

- `/system/health`: migration health now reflects full ledger name/checksum parity and unavailable source accurately. Current production display remains `NOT VERIFIED` pending a trusted live request bound to the exact release.
- `/system/control-center`: checksum-only drift and source-unavailable conditions now surface as migration blockers; this view does not approve release gates.
- The laboratory, reject-report, and backup routes listed in the task were not changed. No route/state/role, backup-restore UI, 320/375/768/1440 CSS px, 200% zoom, keyboard/AT, or populated-data acceptance is closed by this database rehearsal.
- `QC-PAGE-F-002`: **PARTIALLY CLOSED locally** for exact source/ledger reconciliation behavior and recovery rehearsal; **OPEN** for live database parity, trusted deployment identity, approved release gates, browser/AT, and human UAT.

## Remaining decisions and limitations

- A system owner must provide the authorized source for current production artifact identity and live migration ledger. No user permission has been given for a production migration/deploy.
- The release-gate register/approval, backup retention and RPO/RTO, production grants/ownership, and live release identity remain unresolved. Readiness stays NO-GO.
- Browser permission was unavailable; the real UI and assistive technology path were not exercised.
- `pnpm@11.25.0` is declared by the package, but Corepack could not write its cache outside the workspace, so the executable version is not verified.

## Commands and local evidence

The focused Vitest migration suite was run through `scripts/verification/run-vitest-evidence.mjs migrations -- vitest run tests/integration/database/migrations.test.ts`. Other direct checks were `scripts/db/preflight.ts`, `scripts/db/check-schema-integrity.ts`, `scripts/db/migration-status.ts`, `scripts/db/check-migration-integrity.ts`, focused Vitest health tests, TypeScript `tsc --noEmit`, Astro diagnostics, local Astro build, local release identity generation, and release identity verification. Candidate-bound output is under ignored `.ci-results/`; final run identity is `run-context.json`. Tool output did not contain database URLs or credentials.

No commit, push, merge, production migration, deploy, or external publication was performed.
