# QC-CLOSURE-015 — Backup, Restore, Deployment & Production Evidence

**Date:** 2026-09-18  
**Current source HEAD:** `8f54442965cd809a8df9f2afb22d0b600a3262ee`  
**Source migration head:** `0029_performance_query_indexes`  
**Overall state:** `PARTIAL / NO-GO`

## Scope and evidence boundary

The backup and restore evidence below was executed locally against an approved disposable PostgreSQL 18.6 cluster. It is non-production evidence. No Render database, Render backup service, R2 bucket, provider API, migration, deployment, commit, or push was performed.

## Real logical backup

| Field | Evidence |
|---|---|
| Backup ID | `qc-closure-015-20260918-003` |
| Started | `2026-09-18T07:25:28.694Z` |
| Completed | `2026-09-18T07:25:28.966Z` |
| Duration | `191 ms` |
| Size | `282,954 bytes` |
| SHA-256 | `0fc315d5038ee550ac4cbb3335323d0d6c1677bb8905bbbc5cdebd1365c89def` |
| PostgreSQL | `18.6` |
| Migration head | `0029` / `0029_performance_query_indexes` |
| Artifact | local disposable custom-format `pg_dump` artifact; temporary and not a provider backup |
| Artifact status | `VERIFIED` locally by successful dump, checksum capture, and restore from the same artifact |

The artifact was created with PostgreSQL 18 `pg_dump` and restored with PostgreSQL 18 `pg_restore`. The application release metadata used for this local test was test/local evidence only (`gitSha=8f54442965cd809a8df9f2afb22d0b600a3262ee`, `buildId=local-8f54442965cd`, `releaseId=rel-82fe52596ef4f54e`). The working tree was dirty, so this is not production-release identity evidence.

## Isolated restore

The artifact was restored into a separate `qc_restore` database on the same disposable PostgreSQL 18.6 instance. This proves an isolated database target, not a separate host or provider target.

- All `77` source base tables had matching row counts in the restored database: `PASS`.
- Restored migration ledger: `29` rows, head `0029`: `PASS`.
- Unvalidated foreign keys: `0`: `PASS`.
- File hash parity: `PASS`, but `files` contained `0` rows.
- Audit history parity: `PASS` for an empty table (`0` vs `0`); populated audit-history preservation: `NOT VERIFIED`.
- E-signature parity: `PASS` for an empty table (`0` vs `0`); populated e-signature preservation: `NOT VERIFIED`.
- Evidence-link parity: `PASS` for an empty table (`0` vs `0`); populated evidence-link preservation: `NOT VERIFIED`.
- Sessions parity: `PASS` for an empty table (`0` vs `0`); populated session preservation/invalidation: `NOT VERIFIED`.
- Release governance parity: `PASS` for empty release/evidence tables; populated release-candidate, approval, signature, gate, and risk evidence preservation: `NOT VERIFIED`.

## Negative recovery tests

All cases below produced the expected fail-closed result:

| Case | Result |
|---|---|
| Missing artifact | `pg_restore --list` exit `1` |
| Tampered artifact | SHA changed from `0fc315…89def` to `a5820d…1ba447`; `pg_restore --list` exit `1` |
| Migration checksum mismatch | `db:migrate:check` rejected version `0029`, exit `1` |
| Incomplete restore | one-table restore produced `0` of expected `77` tables; parity would fail |
| Stale release identity | server-side `assertSameDeployedIdentity` returned `EXPECTED_FAIL` |

## Render / production endpoint verification

Fresh read-only checks against `https://qclevel.top`:

- Domain: `qclevel.top` resolved and served the application: `VERIFIED`.
- TLS: certificate subject `CN=qclevel.top`, issuer Google Trust Services `WE1`, valid `2026-09-05` through `2026-12-04`: `VERIFIED` at check time.
- `/api/health/live` GET: HTTP `200`, `{"status":"healthy"}`: `VERIFIED`.
- `/api/health/ready` GET: HTTP `200`, `{"status":"healthy"}`: `VERIFIED`.
- `/api/system/release-identity` without authentication: HTTP `401 AUTH_REQUIRED`; deployed Git SHA, build ID, release ID, migration head, and runtime environment are therefore `NOT VERIFIED` from the permitted endpoint.
- Render logs: `NOT VERIFIED`; no authorized Render service/log API was available in this task.
- Runtime environment: `NOT VERIFIED`; the public health responses do not expose it.
- The earlier repository evidence that Render database state is at applied head `0018` and source is ahead remains unresolved; no migration was applied during this task.

## Provider capability evidence

No authoritative provider evidence was available for the actual deployed service/database for:

- managed backups and backup schedule;
- retention period;
- PITR;
- WAL archiving;
- provider RPO;
- provider RTO.

**Provider capability status: `BLOCKED / POLICY DECISION REQUIRED`.** The local logical dump proves neither Render-managed backups nor PITR/WAL capability. Project RPO/RTO values remain targets (`24h` / `4h`), not measured production evidence.

## Verification commands/results

- Focused recovery/catalog/health tests: `8 files / 35 tests PASS`.
- Architecture boundary and route checks: `PASS`.
- `git diff --check`: `PASS`.
- Node warning: local runtime `v22.22.3` is outside the project contract `>=24.20.0 <25`.

## Decision

Local logical backup, isolated database restore, parity, FK validation, and negative recovery behavior are evidenced. Production/provider backup capability, populated controlled-record recovery, exact deployed identity, runtime environment, and logs remain unverified. QC-CLOSURE-015 therefore remains `PARTIAL / NO-GO`.
