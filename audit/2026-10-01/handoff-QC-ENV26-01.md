# QC-ENV26-01 — server database parity handoff

**Date:** 2026-10-01 (Asia/Riyadh)  
**Finding:** QC-PAGE-F-002  
**State:** PARTIAL / BLOCKED — production remains NO-GO  
**Pages:** `/system/health`, `/reject-reports`, `/laboratory`

## Candidate identity and evidence freshness

| Item | Result |
|---|---|
| Initial branch / HEAD | `main` / `ffc218ca2dd4540ecb68d7c0414fbf829a899a13` |
| Initial source/dirty fingerprint | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (clean tree at freeze) |
| Final working-tree fingerprint | Candidate identity sidecar: `.ci-results/qc-env26-01-source-identity.json` (ignored evidence output; generated after tracked edits) |
| Source migration set | 42 files; `0042_immutable_lab_equipment_usage`; current SHA-256 values in `audit/2026-10-01/env-parity/source-migration-manifest.tsv` |
| Existing read-only provider snapshot | PostgreSQL 18.6, TLS, transaction read-only; 18 applied / 42 source / 24 pending; applied head `0018_rate_limit_windows`; 18 applied checksums reported matching source, zero differences |
| Render deployment snapshot | latest deploy `update_in_progress`, SHA `6f12fecdd58acb89d6c0fceb5a8c20b33101b628`; last listed live deploy SHA `831a0f4396e2ae6ea3766489be06012e2ff753ce`; neither is the frozen local HEAD |
| Evidence refresh | `database-readonly.json` and `render-env-comparison.json` hashes were checked at start; files remain the 2026-10-01 snapshots. No Render/database MCP was available for a new provider read. The in-progress deployment was not attributed to this candidate. |

The provider JSON contains no business rows. It records catalog names only. It does not include the individual provider-applied checksums, so its 18-row checksum statement cannot be independently re-audited row-by-row from that JSON alone. The prior QC-ADP26-02 isolated rehearsal proved 42/42 exact on its then-candidate; do not represent that historical run as a rehearsal on this HEAD.

The current 42 migration source files were also compared with the applied side of the prior isolated QC-ADP26-02 ledger export: all 42 names/checksums are byte-identical (`audit/2026-09-30/migration-ledger-QC-ADP26-02.tsv`). This carries forward only the migration-set identity. It does not carry forward the old database run, upgrade rehearsal, or restore result as fresh evidence on the current HEAD.

## Environment names and safe validation

Values, credentials, and URLs are intentionally omitted.

| Variable group | Names | Snapshot result |
|---|---|---|
| Core runtime | `NODE_ENV`, `DATABASE_URL`, `SESSION_SECRET`, `SERVICE_VERSION`, `RATE_LIMIT_LOGIN_MAX`, `RATE_LIMIT_LOGIN_WINDOW_SECONDS` | Present and safely validated in the sanitized snapshot; values are not disclosed. `DATABASE_URL` differs from local. |
| Release identity | `RELEASE_ID`, `RELEASE_BUILD_ID`, `RELEASE_BUILD_TIMESTAMP`, `RELEASE_ENVIRONMENT`, `RELEASE_GIT_SHA`, `RELEASE_MIGRATION_HEAD` | 0/6 explicitly configured on the server snapshot. |
| Explicit AI provider configuration | `AI_PRIMARY_PROVIDER`, `AI_FALLBACK_PROVIDER`, `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_BASE_URL`, `GEMINI_API_KEY`, `GEMINI_MODEL` | 0/7 present in the recorded server comparison. No external AI send is authorized by this finding. `AI_EXTERNAL_PROCESSING_APPROVED` and `AI_PROCESSING_POLICY_JSON` remain separately governed by the approved policy contract. |
| Optional storage / telemetry | `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_HEADERS` | Absence must be evaluated against the relevant feature contract; it is not folded into required migration readiness. |

Source: `audit/2026-10-01/env-parity/render-env-comparison.json` (presence and boolean validation fields only). Do not use local credential-shaped entries from that comparison as provider evidence.

## Changed

- No historical migration was edited and no new migration was invented. Current source already contains complete name/checksum reconciliation and a forward-only runner with per-migration transaction and advisory lock. `/system/health` now labels a missing or invalid database configuration as `DEGRADED` with a fixed safe reason, and a configured-but-unreachable PostgreSQL provider as `UNAVAILABLE`; the machine readiness endpoint retains its existing boolean HTTP contract.
- Added a source-only manifest for all 42 migrations, bound to the frozen candidate's source set.
- `/system/health` now separates database configuration failure from provider/network outage. `/api/health/ready` intentionally keeps its existing boolean response. AI policy-disabled versus provider outage remains an open UI distinction; Reject Reports already identifies schema readiness as `SCHEMA_NOT_READY`.

## Evidence

| Check | Result | Evidence / limitation |
|---|---|---|
| Candidate freeze | PASS | `git status --short` clean and HEAD recorded above; initial source fingerprint is the empty-diff SHA-256. |
| Source migration manifest | PASS | 42 ordered filenames and SHA-256 values generated from current `db/migrations/`; head 0042. This proves source identity only. |
| Provider read-only parity | PARTIAL | Snapshot reports 18/42 and 24 pending, with 18/18 matching and no checksum differences; individual applied checksum rows are absent. Snapshot deployment is in progress and not tied to local HEAD. |
| Isolated PostgreSQL 18.6 upgrade / rollback / restore | BLOCKED | Testcontainers has no working container runtime. A separate cluster under `/private/tmp` failed during `initdb` with `shmget: Operation not permitted`, including a retry specifying `dynamic_shared_memory_type=mmap`. Existing `.tmp/pg18` was left untouched because the project provisioning script would remove that directory. |
| Focused health/source tests | PASS | Fresh Node 24.20.0 unit run: 3 files / 19 tests passed, including missing, malformed, TLS-disabled, and provider connectivity failure classification. |
| PostgreSQL integration tests | BLOCKED | Fresh `tests/integration/system/reject-reports-readiness.test.ts`: container startup failed before test setup because Testcontainers reported no runtime; 3 cases skipped. |
| Astro diagnostics | FAIL | `astro check`: 1 existing TypeScript error in `src/pages/quality/findings/index.astro` (`Date.formatDate` missing); 113 hints. This file is outside the diff. |
| Production migration / writes | NOT RUN | No production write or migration was performed. Explicit production migration authority, approved backup/recovery target, and owner release decision are absent. |
| HTTP/browser/AT/UAT for the listed pages | NOT VERIFIED | No authenticated candidate-bound route session or browser/AT/UAT evidence was available in this run. |

## Forward-only plan and isolated rehearsal still required

Run only on a new disposable PostgreSQL 18.x database after a supported runtime is available. Never edit or manually mark historical rows applied.

1. Freeze exact source SHA, dirty fingerprint, artifact identity, migration-set digest/head, and runtime version. Confirm the target is disposable and that no user data will be overwritten.
2. Run a read-only preflight; export `(version, name, checksum)` for every applied row. Compare every row to the frozen source; stop on missing source, unknown version/name/hash, privilege/ownership mismatch, unexpected applied set, or unexpected pending set.
3. Create a baseline by applying source migrations `0001`–`0018`, then run a read-only ledger/checksum assertion. Apply `0019`–`0042` through the official runner, preserving advisory lock and one transaction per migration. Assert 42/42 exact source/applied names and checksums and zero pending/mismatches.
4. Exercise migration failure rollback and retry/no-op behavior in a disposable database. Include representative constraint failures and assert no failed migration ledger row or partial object state remains.
5. Dump the populated rehearsal database, restore to a separate empty disposable database, then run checksum and schema-integrity checks. Record dump hash, restore result, table/orphan/constraint totals, and candidate identity; the dump must contain only synthetic schema/fixture data.
6. Repeat from a clean database to detect order dependence. Capture safe outputs only. Stop and investigate any checksum drift; fix with a new forward migration only when semantically required.
7. A separate owner must approve production target, backup and restore validation, retention/RPO/RTO, maintenance window, exact candidate, authorization/credential gates, and migration action. This handoff is not that approval.

## Open acceptance and owner decision

- Required technical denominator: **42 source/applied migrations, exact names and checksums**. Current provider evidence is **18/42 (42.9%)**; this percentage is scoped only to the migration denominator and is not product quality.
- Open: isolated 0018→0042 rehearsal; exact 42/42 ledger; failure rollback/constraint cases; dump and restore; schema integrity; fresh provider-applied row checksums; exact live artifact identity; route HTTP/accessibility evidence for 3 pages.
- Open implementation gap: system-health AI currently needs a separately visible `POLICY_DISABLED` vs `PROVIDER_UNAVAILABLE` reason (without changing policy or leaking configuration). `SCHEMA_NOT_READY` remains independently classified by Reject Reports availability. Keep optional AI/storage out of required schema readiness.
- **Decision required from named owner:** identify the accountable database/release owner and supply the approved production migration authorization and recovery parameters, if production migration is later intended. Until then production closure is independently BLOCKED / NO-GO.

No secrets, passwords, API keys, credential-bearing URLs, production writes, migration, commit, push, merge, deploy, or external settings change were made.
