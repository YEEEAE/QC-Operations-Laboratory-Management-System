# QC-100-CLOSURE-07 — Isolated Restore Drill Result (RECOVERY DRILL, NO PRODUCTION DESTRUCTION)

**Task:** `QC-100-CLOSURE-07` — Real Restore, Disaster Recovery and Business Continuity Closure
**Record ID:** `RER-2026-09-08-001`
**Drill type:** `DRILL` (logical pg_dump/pg_restore; production restore is separately policy-gated)
**Status:** `PARTIAL` — logical isolated recovery `VERIFIED`; Render provider / PITR / WAL / RPO / RTO remain `BLOCKED`
**Rule applied:** no `ACCEPTED` while any required gate is `BLOCKED`/`UNVERIFIED`. This record is evidence, not a readiness claim.

## 1. Authority and target

| Field | Value |
|---|---|
| Repository | `YEEEAE/QC-Operations-Laboratory-Management-System` |
| Git HEAD (fresh, recomputed — old audit SHAs NOT reused) | `06b14cfa571275e76a3839e671fc635559408960` |
| Branch | `main` |
| Working tree at drill time | clean (`git status --short` empty) |
| Source environment | isolated disposable PostgreSQL (docker `postgres:18-alpine`, port `55434`) |
| Isolated target environment | isolated disposable PostgreSQL (docker `postgres:18-alpine`, port `55435`) |
| Target isolation confirmed | `YES` — both targets are throwaway containers; production was never connected, written, or restored over |
| Operator | local drill executor (this session) |
| Reviewer independent of operator | none in this session — recorded as gap |
| Cleanup reference | `docker rm -f qc-drill-source qc-drill-target` executed; containers removed, `docker ps` empty |

No passwords, tokens, `DATABASE_URL` values, private URLs, or provider credentials appear in this record.

## 2. Exact recovery set and application identity

| Field | Value / evidence reference |
|---|---|
| Backup set ID | `drill-2026-09-08-logical-001` |
| Backup mechanism (real, executed) | `pg_dump -Fc` (PostgreSQL 18.6 in-container binaries) from source to `/tmp/drill-2026-09-08-logical-001.dump` |
| Backup timestamp (UTC) | start `2026-09-08T06:59:49Z` / end `2026-09-08T06:59:50Z` |
| Actual backup duration | `1s` (measured, wall clock) |
| Backup artifact size | `202909` bytes |
| Backup artifact SHA-256 | `e629076f0dd7da1ef514a6616377d1535357b35ea7eb2e04b1937f52d0502363` |
| Restore mechanism (real, executed) | `pg_restore --clean --if-exists` into the isolated target (never over production) |
| Restore timestamp (UTC) | start `2026-09-08T07:00:05Z` / end `2026-09-08T07:00:07Z` |
| Actual restore duration | `2s` (measured, wall clock) |
| PostgreSQL source version | `PostgreSQL 18.6 on aarch64-unknown-linux-musl (Alpine)` |
| PostgreSQL restored version | `PostgreSQL 18.6 on aarch64-unknown-linux-musl (Alpine)` — match |
| Git commit SHA | `06b14cfa571275e76a3839e671fc635559408960` |
| Release/build ID | `rel-2c958fe7b53b3047` / app `0.1.0` |
| Migration head (repository + source + target) | `0018` (`0018_rate_limit_windows`), 18/18 applied, zero pending on both ends |
| Migration ledger/checksum evidence | 18 ledger entries byte-compared source→manifest→target — `PASS` |
| Object-store recovery reference | isolated copy `source object root → restored object root` (2 objects); provider object storage is deployment-dependent and NOT evidenced |
| Encryption/key availability evidence | throwaway self-signed TLS cert for drill transports only (`sslmode=require`); production KMS/secret recovery NOT evidenced — reference only, no secret |
| Known gaps | Render provider restore/PITR/WAL NOT evidenced; RPO/RTO POLICY-DEPENDENT (no comparison); no independent reviewer; authenticated HTTP reads not exercised (placeholder drill credentials) |

## 3. Provider capability determination (no invention)

Evidence from the current tree (`render.yaml`, `Documents/BACKUP-RECOVERY-PLAN.md` deferred decisions BKP-DD-001–024, `docs/operations/RESTORE-DRILL-RUNBOOK.md` §PITR/provider status, `audit/100-percent/DR-EVIDENCE-MATRIX.md`):

| Capability | Determination for this HEAD |
|---|---|
| Render physical base backup / snapshot schedule | NOT EVIDENCED — `render.yaml` defines no database service and no backup stanza; no Render API access from this host |
| Continuous WAL archiving / WAL chain | NOT CONFIGURED on drill containers; provider WAL NOT EVIDENCED → `BLOCKED` |
| Point-in-Time Recovery (PITR) | NOT SUPPORTED by any evidenced mechanism → recorded as `BLOCKED`, NOT claimed as `PASS` (manifest validator rejects `pitr` claims by construction) |
| Cross-region / protected immutable copy | NOT EVIDENCED → `BLOCKED` |
| Object-storage provider + replication | deployment-dependent, NOT EVIDENCED → local isolated copy used as drill stand-in only |
| RPO / RTO | `POLICY-DEPENDENT` per foundation plan — actual durations measured (`1s` backup, `2s` restore) with NO comparison against objectives |

## 4. Source baseline (pre-backup, real)

- `db:preflight` — connectivity `PASS`, `migrationCountPending 18` on the empty source
- `db:migrate` — applied `0001`–`0018`, `pending []`
- `db:seed:foundation` — roles/permissions seeded; foundation check passed
- `db:schema:check` — `migrationCount 18, tableCount 60, orphanCount 0`
- Representative controlled dataset inserted (transactional): 2 users (`drill-op-01`, `drill-rev-01`), 2 role grants (`EMPLOYEE`, `SUPERVISOR`), 2 scopes (`GLOBAL`, `ASSIGNED`), 1 task (`DRILL-TASK-01`), 1 receiving item (`DRILL-RCV-01`, `HOLD`/`HOLD`/`release_system=false`), 1 approval case + work item + e-signature + `APPROVE` decision, 2 audit events (`drill-req-01`, `drill-req-02`), 1 session, 2 file objects + 1 evidence link to the task

## 5. Execution commands and results (exact release checkout)

Manifest and validators are provider-neutral and read-only; connection values stayed in the shell environment.

| Check | Result | Evidence reference | Notes |
|---|---|---|---|
| Manifest schema | `PASS` | `verify-recovery-manifest.ts` → `SCHEMA_VALIDATED_ONLY`, `NOT_VERIFIED` | schema validation is not restore proof |
| Render physical restore | `BLOCKED` | checklist item `render-physical-restore` | provider evidence required; local logical restore substituted and labeled as such |
| PostgreSQL version/schema | `PASS` | `validate-restored-database.ts` → `status PASS`, 18.6 = 18.6 | read-only transaction; required a tooling fix (see §7) |
| Migration ledger/checksums/head | `PASS` | 18/18 entries match, head `0018` | no forward migration before baseline |
| Core relations (11) | `PASS` | users, roles, user_roles, user_scopes, tasks, receiving_items, approval_cases, approval_decisions, electronic_signatures, files, evidence_links | existence-gated |
| History/audit relations (4) + row presence | `PASS` | audit_events, schema_migrations, sessions, outbox_events; 2 audit rows with original request IDs | no controlled rewrite |
| File metadata and evidence links | `PASS` | 2 files, 1 link `TASK→DRILL-TASK-01` | DB-side linkage |
| Object presence/size/SHA-256 (2) | `PASS` | `validate-restored-files.ts` → `checked 2`, zero failures | isolated object root |
| Fail-safe: missing object | `FAIL` (correct) | removed `cert-02.txt` → `missing or unreadable object`, exit 1 | no false success |
| Fail-safe: tampered bytes | `FAIL` (correct) | tampered `report-01.txt` → `size mismatch` + `hash mismatch`, exit 1 | no false success |
| Extended parity (15 tables) | `PASS` | source counts = target counts exactly, `mismatched []` | §6 detail |
| Identity/roles/scopes | `PASS` | 2 users ACTIVE, 4 roles, 2 scopes | §6 detail |
| Quarantine separation | `PASS` | workflow `HOLD` / inspection `HOLD` / `release_system false` kept distinct | PASS ≠ release upheld |
| Approval + e-signature chain | `PASS` | case→work item→signature→`APPROVE` decision intact | history preserved |
| Critical controlled-history reads | `PASS` | task + receiving + approval join resolves one row | app-shaped query |
| Orphan integrity (122 FKs) | `PASS` | `orphans 0` | same contract as `db:schema:check` |
| Exact app compatibility (HTTP) | `PASS` (isolated) | release `rel-2c958fe7b53b3047` booted on port `4322` against the restored target: `/api/health/live 200`, `/api/health/ready 200 {"status":"healthy"}` | anonymous health only; authenticated reads evidenced at data layer |
| `db:schema:check` on restored target | `PASS` | `migrationCount 18, tableCount 60, orphanCount 0` | app data-layer compat |
| Authorization positive/negative (HTTP) | `BLOCKED` | drill identities carry placeholder hashes — no login attempted, nothing weakened | server-side auth covered by `test:security` suites, not by this drill |
| Session behavior | `PASS` (drill) | 1 active session survived restore → all sessions revoked post-recovery (`activeBefore 1`, `activeAfter 0`) per plan §40 | no token values recorded |
| Secret exposure review | `PASS` | manifest + app log scanned for password/token/key/URL patterns: 0 hits | values never printed |

## 6. Extended parity detail (source → target)

All 15 sampled tables match exactly: `users 2, roles 4, user_roles 2, user_scopes 2, tasks 1, receiving_items 1, approval_cases 1, approval_work_items 1, approval_decisions 1, electronic_signatures 1, audit_events 2, sessions 1, files 2, evidence_links 1, outbox_events 0` — `mismatched []`.

## 7. Tooling defect found and fixed by this drill (RED → GREEN)

`scripts/recovery/validate-restored-database.ts` failed against a correctly restored database twice, for two complementary root causes:

1. `current_schema is not qc` — the validator opened a bare `pg.Client` without the runtime pool's `search_path=qc,pg_catalog` (`src/shared/database/pool.ts` `createPool` options). Fix: `SET search_path TO qc, pg_catalog` after connect, mirroring runtime.
2. `missing core relation: qc.users` (×15) — after fix 1, `to_regclass($1)::text` renders search-path-relative names (`users`, not `qc.users`), so display-text comparison misreported every relation. Fix: existence check `to_regclass($1) IS NOT NULL` instead of display comparison.

No authorization, CSP, RBAC, scope, state-machine, or integrity rule was weakened; the change only aligns the validator with the runtime connection contract and makes the existence assertion search-path-independent. Live sequence on the restored target: `FAIL [current_schema]` → `FAIL [15× missing relation]` → `PASS` (ledger + 11 core + 4 history + appContext, zero failures).

## 8. Decision

| Decision | Select one | Evidence reference |
|---|---|---|
| Isolated logical restore actually executed | `YES` | pg_dump 1s + pg_restore 2s, §2 |
| All automated checks passed | `YES` (logical scope) | validators + extended 11/11 + fail-safe negatives, §5 |
| All manual security/application checks passed | `NO` — partial | app boot + session invalidation + secret review evidenced; Render provider + HTTP auth + independent review missing |
| Provider/PITR/WAL capability evidenced | `NO` — `BLOCKED` | §3, no invention |
| Overall drill | `PARTIAL` (`REJECTED` for full DR readiness, `VERIFIED` for the logical isolated-restore scope) | this record |

`ACCEPTED` is NOT permitted: provider restore, PITR/WAL, RPO/RTO policy, HTTP authorization, and independent review remain `BLOCKED`/`UNVERIFIED`. This template records evidence; it does not create physical backup, WAL, PITR, RPO, RTO, or provider capability.

## 9. Risk update

- `R-006` is NARROWED, not closed: the "no current drill result" half is now answered for the logical isolated path (real backup artifact + real restore + ledger/history/file/app/session evidence on HEAD `06b14cf`), but the provider/PITR half stays `OPEN`/`BLOCKED`.
- `CB-006` (backup/restore execution not evidenced) is partially answered for the same logical scope; Render/PITR/object-provider execution remains open.
- No domain score is raised by this record alone; `FINAL-100-DOMAIN-AUDIT.md` row statuses are unchanged.
