# QC-100-13 — Final Evidence Index

## MASTER HEADER

- Repository: `YEEEAE/QC-Operations-Laboratory-Management-System`
- Target: `main`
- HEAD: `ca8d1bdc49d84cb447c88ed12d380a38ff3940e9`
- Freeze: `2026-09-08 07:16:20 +03`
- Working tree before this prompt: clean
- Evidence policy: current command output outranks historical audit claims

| Ref | Evidence | Scope | Result |
|---|---|---|---|
| E-01 | `git status --short --branch`, `git rev-parse HEAD`, `git diff` | identity and local changes | `main`, exact HEAD above, clean before this prompt |
| E-02 | `node --version`, `pnpm --version`, `package.json`, `.node-version` | runtime contract | Node `v22.22.3` is outside declared `>=24.20.0 <25`; pnpm `11.25.0` matches |
| E-03 | `ls db/migrations/*.sql` | repository migration head | `0018_rate_limit_windows.sql`; applied database state unverified |
| E-04 | `pnpm test:architecture` | delivery boundary guard | exit 0; static guard does not disprove direct imports found by scan |
| E-05 | focused AI Vitest run | existing AI tests | `23/23` passed |
| E-06 | `pnpm exec vitest run tests/integration/ai-advisory/evals.test.ts tests/unit/ai-advisory/advisory.test.ts tests/integration/ai-advisory/security.test.ts` | new deterministic AI eval suite plus existing AI boundaries | `3 files / 38 tests passed` |
| E-07 | `.github/workflows/ci.yml` | remote CI definition | workflow exists; current GitHub check-run unavailable from this host |
| E-08 | `gh run list --commit ca8d1bd...` | remote CI status | failed to connect to `api.github.com`; status `UNVERIFIED` |
| E-09 | `audit/100-percent/USABILITY-STUDY-PACKAGE.md` | executable research protocol | package exists; participant evidence `UNVERIFIED` |
| E-10 | `audit/100-percent/01-100-DOMAIN-SCORECARD.md` | prior row-level baseline | 100 rows; prior average `49.35/100`; not accepted as fresh runtime evidence |
| E-11 | `audit/100-percent/FINAL-100-DOMAIN-AUDIT.md` | current independent re-audit | current row ledger and blockers |
| E-12 | `audit/100-percent/FINAL-OPEN-RISKS.md` | residual risk | unresolved runtime, UAT, recovery, policy, and delivery-boundary blockers |

## Source and artifact index

- AI implementation: `src/modules/ai-advisory/**`
- AI tests: `tests/unit/ai-advisory/**`, `tests/integration/ai-advisory/**`
- Deterministic dataset: `audit/100-percent/ai-evals/deterministic-eval-dataset.json`
- Previous evidence and blocker baseline: `audit/100-percent/00-REALITY-FREEZE.md`, `04-CRITICAL-BLOCKERS.md`
- Required controlled sources: `Documents/SYSTEM-INVARIANTS.md`, `Documents/QC-SYSTEM-DESIGN-CONSTITUTION.md`, `Documents/BUSINESS-RULES.md`, `Documents/ROLE-MATRIX.md`, `Documents/PERMISSION-MATRIX.md`, `Documents/STATE-MACHINES.md`, `Documents/DATA-MODEL.md`, `Documents/DATA-DICTIONARY.md`, `Documents/REQUIREMENTS-TRACEABILITY.md`, and the architecture/security/testing/UAT documents named by the prompt.

No evidence in this index is a substitute for live PostgreSQL, browser, CI, UAT, backup/restore, or deployed-provider evidence.

## QC-100-CLOSURE-01 — Fresh evidence for HEAD `f9c8eb9dbaec87e0a52e74c7a9916aedd98574ed` (2026-09-08)

- C-01: `gh api .../actions/runs/34187138555/jobs` → Verify job `101937645254`, `completed/failure`, `runner_id 0`, `runner_name ""`, `steps []`, 3s wall time. Check-run annotation: "The job was not started because your account is locked due to a billing issue." Same annotation on runs `34186113001` (`ca8d1bd`), `34185846194`, `34185116264`. Workflow YAML valid; actions pinned at `checkout@v4`, `pnpm/action-setup@v4`, `setup-node@v4`, `upload-artifact@v4`; workflow pins Node `24.20.0` + pnpm `11.25.0`, matching `package.json` engines and `.node-version`.
- C-02: Toolchain defect fixed — `pnpm-workspace.yaml` had placeholder `sharp: set this to true or false`, which made every `pnpm install`/script fail with `ERR_PNPM_IGNORED_BUILDS` (sharp@0.33.5 is an optional transitive dep via astro). Set to explicit `sharp: false` (deny postinstall, no weakening). `pnpm install --frozen-lockfile` now exit 0 on Node `v24.20.0` + pnpm `11.25.0`.
- C-03: Lint defect fixed — `scripts/release/check-tech-debt.mjs:48` used `console` with no ESLint global; added file-scoped `/* global console: readonly */`. No global rule weakened.
- C-04: Local mirror on Node `v24.20.0` + pnpm `11.25.0`, exact HEAD `f9c8eb9`: `format:check` exit 0; `lint` exit 0; `typecheck` 0 errors / 0 warnings / 25 pre-existing hints; `test:architecture` exit 0; `release:tech-debt:check` exit 0 (6 items); `test:unit` 103/103 passed; `build` complete; `release:identity` + `release:verify` exit 0 (`rel-5c9dd66993610423`, gitSha `f9c8eb9...`).
- C-05: DB-backed suites on Node 24: `test:integration` 57 files passed / 192 tests passed / 42 skipped, 12 files failed at setup with `Could not find a working container runtime strategy` (zero assertion failures); `test:migrations` and `test:concurrency` fail the same way; `test:security` 5 files / 41 tests passed, 1 file container-blocked. No Playwright browsers installed locally (`~/.cache/ms-playwright` absent), so E2E was not executed here.
- C-06: `git diff --check` exit 0. Working-tree diff is 2 lines: `pnpm-workspace.yaml` + `scripts/release/check-tech-debt.mjs`. Untracked pre-existing `audit/prompt4.md` untouched.

## QC-100-CLOSURE-02 — Fresh evidence for HEAD `1927aebeb55b12144a05c52d8a4d02395df8149a` (2026-09-08)

- C-07: Root cause — the old guard pattern `(?:\/database\/|\/db\/|kysely|pg)['"]` required a closing quote immediately after the keyword, so `../../shared/database/database.js` (followed by `database.js'`) never matched, and no pattern covered `getDatabase`, `/infrastructure/`, `Postgres*`, `Kysely`/`DatabaseSchema`, or repository construction. Independent `rg` scan found 12 delivery files with direct `getDatabase()` + `Postgres*` composition (4 actions, 7 pages, `src/middleware.ts`) plus 2 infrastructure-direct files (`api/health/ready.ts` → `PostgresReadinessProbe`, `actions/ai-advisory.ts` → `DisabledAiProvider`).
- C-08: Remediation — 11 narrow per-capability composition factories (no god-service): `tasksActionDependencies` (extended), `administrationDependencies`, `findingsRead/ActionDependencies`, `reportingDependencies`, `dashboardDependencies`, `aiAdvisoryDependencies`, plus shared `notificationDependencies`, `searchDependencies`, `auditQueryDependencies`, `rateLimitDependencies` (singleton preserved), `readinessDependencies`. All 14 delivery files now consume only `*/application/dependencies.js` / `shared/*/*-dependencies.js` + application use-case/service types. Post-change scan: `rg "getDatabase|Postgres|/infrastructure/|Kysely" src/pages src/actions src/ui src/middleware.ts` → zero matches (`RG_EXIT:1`); raw-SQL/pg-transaction scan → zero matches.
- C-09: Guard fix — `scripts/architecture/check-boundaries.mjs` now detects `getDatabase` usage, any-suffix database imports, kysely/pg imports and `Kysely`/`DatabaseSchema`/`new Pool|Client` usage, `/infrastructure` imports, `Postgres*` identifiers, `new *Repository` construction, transaction objects, plus the original domain/business-rule/raw-SQL rules; supports absolute `QC_ARCH_DELIVERY_ROOTS` for tests; narrow `allowlist` is empty and documented (no hidden exceptions).
- C-10: Regression — new `tests/unit/architecture/boundary-guard.test.ts`, 5/5 passed: guard FAILS on page→`getDatabase`, action→pg/Kysely, UI→repository, delivery→infrastructure fixtures, and PASSES on approved composition.
- C-11: Gates on Node `v22.22.3` + pnpm `11.25.0` (outside the `>=24.20.0 <25` contract — R-009 stays OPEN, results are local-only, not CI parity): `format:check` exit 0; `lint` exit 0; `typecheck` 0 errors / 0 warnings / 25 pre-existing hints; `test:architecture` exit 0; `test:unit` 28 files / 108 tests passed (103 prior + 5 new); `astro build` complete; `git diff --check` exit 0. Focused `server-contract` integration: 4 passed / 1 skipped, file-level setup failure is container-only (`Could not find a working container runtime strategy`), zero assertion failures. Scan and guard agree: ZERO unapproved direct Delivery → DB/infrastructure imports.
- C-12: Scope notes — behavior preserved (same repositories, same audit/outbox wiring, same actor/requestId plumbing, same singleton rate limiter); no authorization/CSP/RBAC/scope/state-machine weakening; `audit/prompt4.md` showed an unrelated 244-line working-tree deletion during this task and was restored via `git checkout` (final `git status` shows only this task's files); no commit, push, deploy, or production mutation.

## QC-100-CLOSURE-03 — Fresh evidence for HEAD `3f925696098adb86ffcf550188c9a8d9981917bb` (2026-09-08 08:44 +03)

- C-13: Runtime — Node `v24.20.0` + pnpm `11.25.0` (inside the `>=24.20.0 <25` contract) on `main`. Docker Desktop daemon started locally; Testcontainers provisioned `postgres:18-alpine` per suite (canonical mode). A disposable local PostgreSQL `18.6 (Homebrew, aarch64)` cluster on `localhost:55433` (database `qc_disposable`, owner `qc_owner`, throwaway self-signed TLS, destroyed after the task) served the `db:*` script sequence. No production database was touched; no credential value is recorded here.
- C-14: Phase A on the fresh disposable cluster — `db:preflight` PASS (`migrationCountApplied 0`, `migrationCountPending 18`); `db:migrate` applied `0001`–`0018`, `pending []`; `db:migrate:status` zero pending; `db:migrate:check` `{"status":"ok","migrations":18}`; `db:schema:check` `{"status":"ok","migrationCount":18,"tableCount":60,"orphanCount":0}`; `db:seed:foundation` + check `Roles: 4, Permissions: 198, Role permissions: 164`; seed re-run idempotent (same counts); repeat `db:migrate` no-op (`applied []`, `pending []`). Migration head (repository + applied): `0018_rate_limit_windows`.
- C-15: Phase B on Testcontainers PostgreSQL 18 — `test:migrations` 6 files / 22 tests passed; `test:concurrency` 2 files / 12 tests passed; `test:security` 6 files / 42 tests passed (run twice consecutively, 0 failures); `test:integration` 69 files / 234 tests passed, 0 failed, 1 skipped. Zero suites skipped for missing runtime. Machine-readable reports in `.ci-results/` (gitignored, local only).
- C-16: Defects fixed in this task (tooling/tests only, no migration or policy change) — (1) `db:preflight` errored `3F000 schema "qc" does not exist` on an empty database because `has_schema_privilege(current_user,'qc','USAGE')` was unguarded; now `CASE`-guarded to `NULL` (capability field already `boolean|null`). (2) `db:schema:check` lineage contract demanded `created_by` on `change_requests`, but the canonical `Documents/DATA-DICTIONARY.md` §53 and `Documents/DATA-MODEL.md` §109 define `requested_by`; the check now uses a per-table actor-column map. (3) Same canonical correction in `integrity-governance.test.ts`. (4) `rate-limit.test.ts` teardown double-ended the pool (`database.destroy()` then `pool.end()`); now uses the established `.catch(() => undefined)` pattern. (5) `rate-limit.test.ts` postgres test used a fixed bucket identity, so it observed leftover counts on a reused cluster (first evidencing run 42/42, second run 1 failure `expected 6 to be 1`); now uses a unique identity per run and passes consecutively.
- C-17: Gates on the same HEAD — `format:check` exit 0; `lint` 0 errors / 0 warnings / 25 pre-existing hints; `test:unit` 28 files / 108 tests passed; `test:architecture` passed; `astro build` complete; `git diff --check` exit 0. Final diff is 4 files (`scripts/db/preflight.ts`, `scripts/db/check-schema-integrity.ts`, `tests/integration/database/integrity-governance.test.ts`, `tests/integration/security/rate-limit.test.ts`); no commit, push, deploy, or production mutation. Historical SHAs cited in older audit sections were not reused; every number above was computed fresh for `3f92569`.

## QC-100-CLOSURE-04 — Fresh browser evidence for HEAD `746c1504737edf28857328a6ad5dde149de2cac3` (2026-09-08)

- C-18: Exact-HEAD built release (`pnpm build` exit 0 on Node `v24.20.0` + pnpm `11.25.0`) served via `HOST=127.0.0.1 PORT=4321 node dist/server/entry.mjs`. Full Playwright suite on this HEAD: `52 passed / 13 skipped / 0 failed` (13 skips are authenticated-fixture gates requiring `QC_E2E_LOGIN_IDENTITY`/`QC_E2E_PASSWORD`, which were not provided and not invented). Focused: `system-background` 6/6, `accessibility` + `responsive` 12 passed / 2 skipped (axe WCAG 2.2 AA on English LTR + Arabic RTL login, safe 404, 200%/400% reflow, portrait/landscape, touch target >= 48px on small viewports).
- C-19: Lottie runtime on the same HEAD/build — `/assets/background.lottie` (200, ~1.2MB) and `/assets/dotlottie-player.wasm` (200, `application/wasm`, ~1.2MB) served same-origin; `content-security-policy: default-src 'self'` with no CDN request (0 external requests on 5 sampled surfaces); `[data-system-background]` is `aria-hidden="true"`, `position: fixed`, `pointer-events: none`, `z-index: 0` below `.system-content`; reduced-motion yields `data-motion="reduced"` with canvas hidden; print hides the background; screenshots captured for `1440x900` / `1920x1080` / `768x1024` / `390x844` in LTR + RTL (`/tmp/*.png`, local only). No opacity change was made: the login panel stays opaque (`rgb(27, 31, 27)`) and screenshots confirm readability, so readability was not sacrificed to expose animation.

## QC-100-CLOSURE-05 — Render runtime evidence for base HEAD `4384c76b47e79f523103e81f0686edc952b9006a` (2026-09-08)

- C-20: Production read-only probes (`curl` HTTPS GETs, no secrets): `/api/health/live`, `/api/health/ready`, `/`, `/login` all `500` generic HTML via `cloudflare` + `x-render-origin-server: Render`; NO `content-security-policy`/`strict-transport-security`/`x-content-type-options`/`x-request-id` on those responses; `http://` correctly `301` to `https://`. Error redaction OBSERVED (no stack/secret). Liveness/readiness/headers/requestId on the deployed service: FAIL. Full record: `audit/100-percent/QC-100-CLOSURE-05-RENDER-RUNTIME-EVIDENCE.md`.
- C-21: Root cause (code, locally reproduced): `src/middleware.ts` called `getServerEnv()` before the health bypass; `parseServerEnv({NODE_ENV:'production'})` throws `InvalidEnvironmentError (DATABASE_URL, SESSION_SECRET, SERVICE_VERSION, RATE_LIMIT_LOGIN_MAX + RATE_LIMIT_LOGIN_WINDOW_SECONDS)`. Fix (no weakening): new pure `src/shared/http/health-gates.ts` + reordered middleware — `/live` bypasses env validation (`200 JSON` + headers + `x-request-id` + metrics/logs), `/ready` degrades to `503 JSON` (never 500 HTML), non-health invalid-env returns `503 problem+json` fail-closed with headers. TDD `tests/unit/http/middleware-health.test.ts` RED→GREEN (`3/3`).
- C-22: Static provider contract (current tree): `render.yaml` `startCommand node dist/server/entry.mjs`, `buildCommand` has NO `db:migrate|db:seed|bootstrap:admin`; `healthCheckPath /api/health/ready`; `qclevel.top` canonical + `renderSubdomainPolicy: enabled`; `NODE_VERSION 24.20.0`; secrets `sync:false` (existence only, values never read); NO `BOOTSTRAP_ADMIN_*`, NO `INTERNAL_DATABASE_URL`. Startup does NOT auto migrate/seed/bootstrap (DEP-004). Release identity (local, dirty tree): `rel-1d57db1d4f50807d`, `0.1.0`, migration `0018_rate_limit_windows`. Deployed SHA/version/build/Node/logs: BLOCKED (no Render API access; old SHAs not reused).
- C-23: Gates on this working tree (Node `v22.22.3` local-only, NOT CI parity): `format:check` ✅, `lint` ✅ exit 0, `typecheck` ✅ 0 errors / 25 pre-existing hints, `test:unit` ✅ `29 files / 111 tests` (108 prior + 3 new), `test:architecture` ✅, focused provider slices ✅ `6 files / 46 tests`, `build` ✅, `git diff --check` ✅. No commit, push, deploy, or production mutation.

## QC-100-CLOSURE-06 — UAT kit evidence for HEAD `1d0ef756e4e3ab76af5a1af8e5aadaedc3ccc7c5` (2026-09-08)

- C-24: Executable UAT kit created (preparation only, NOT participant evidence): `audit/100-percent/QC-100-CLOSURE-06-UAT-KIT.md` — 7 personas (P-EMP/P-INSP/P-LAB/P-SUP/P-MGR/P-ADM/P-AUD, credentials left for the operator, superuser explicitly forbidden), 14 functional scripts (T-UAT-01–14 covering login, assigned work, receiving inspection, HOLD, PASS-but-NOT-RELEASED, lab entry, finding, NCR, CAPA, approval+SoD, WI/SOP versions, calibration, report/export, audit trace) with participant wording plus facilitator-only steps bound to real routes verified in `src/pages/**`, 6 Tier-1 negative scripts (N-UAT-01–06: unauthorized action, wrong scope, wrong state, direct URL, unauthorized release, stale version), 4 accessibility scripts (A-UAT-01–04: keyboard, RTL, 200%/400% zoom, reduced motion), per-task capture contract (role, start/end, success, time-on-task, errors, backtracking, help, wrong attempts, observations, severity, comments, accept/reject), and an operator runbook. Normative bases: `Documents/UAT-ACCEPTANCE-PLAN.md` + `USABILITY-STUDY-PACKAGE.md` (U-01–U-11).
- C-25: Evidence-processing tooling, TDD RED→GREEN: `audit/100-percent/uat/validate-uat-records.mjs` (dependency-free; header contract, enum checks, timestamp order, `--release` SHA pin; header-only file reports `UAT EXECUTION REQUIRED` with `sessions=0`, exit 0; content errors exit 1) with `tests/unit/uat/uat-record-validator.test.ts` (`6/6` GREEN). Live run against the template: `UAT EXECUTION REQUIRED … sessions=0`, exit 0 — zero sessions executed, nothing fabricated. Companion templates `UAT-SESSION-RECORD.csv` (header only), `UAT-DEFECT-BACKLOG.csv` (header only), `UAT-COVERAGE-MATRIX.csv` (24 scenarios, all `NOT EXECUTED`).
- C-26: Gates on this working tree (Node `v24.20.0` + pnpm `11.25.0`, inside contract): `format:check` ✅, `lint` ✅ exit 0 (file-scoped `console/process` globals on the validator, same pattern as C-03, no rule weakened), `typecheck` ✅ 0 errors / 25 pre-existing hints, `test:unit` ✅ `30 files / 117 tests` (111 prior + 6 new), `test:architecture` ✅, `git diff --check` ✅. R-005 stays OPEN: kit + tooling close nothing without real participant sessions and an ACCEPTED outcome on the exact release candidate. No commit, push, deploy, or production mutation.

## QC-100-CLOSURE-07 — Isolated logical restore drill for HEAD `06b14cfa571275e76a3839e671fc635559408960` (2026-09-08)

- C-27: Real isolated recovery executed (NO production contact): two disposable `postgres:18-alpine` containers (source `:55434`, target `:55435`, self-signed throwaway TLS, both destroyed after). Source migrated `0001`–`0018` with zero pending, foundation seeded, `db:schema:check` `18/60/0`, plus a transactional representative dataset (2 users, 2 role grants, 2 scopes, 1 task, 1 `HOLD/HOLD/unreleased` receiving item, approval case→work item→e-signature→`APPROVE`, 2 audit events, 1 session, 2 file objects + 1 evidence link). Real `pg_dump -Fc` backup (`202909` bytes, SHA-256 `e629076f…0502363`, `1s`, `06:59:49–06:59:50Z`) and real `pg_restore --clean` into the isolated target (`2s`, `07:00:05–07:00:07Z`, PG `18.6` = `18.6`). Post-restore: manifest schema `PASS`, restored-database `PASS` (18/18 ledger, 11 core + 4 history relations, appContext `rel-2c958fe7b53b3047`), restored-files `PASS` (2/2 size+SHA-256), extended 11/11 `PASS` (15-table count parity, identity/roles/scopes, quarantine separation, approval chain, audit request IDs, linkage+hash, 122 FKs/0 orphans, critical join, session invalidation `1→0`, posture, secret review 0 hits), fail-safe negatives `FAIL`-correct (missing object, tampered hash), exact release booted against the target (`/live 200`, `/ready 200 healthy`), `db:schema:check` on target `18/60/0`. Provider/PITR/WAL/cross-region NOT evidenced (`render.yaml` has no database/backup stanza; no Render API) → `BLOCKED`, not claimed; RPO/RTO POLICY-DEPENDENT → measured only, no comparison. Full record: `audit/100-percent/RESTORE-DRILL-RESULT.md` (`PARTIAL`: logical scope `VERIFIED`, full DR readiness `REJECTED`-pending-provider).
- C-28: Tooling defect fixed by the drill (RED→GREEN on the real target, no security weakening): `scripts/recovery/validate-restored-database.ts` now mirrors the runtime pool (`SET search_path TO qc, pg_catalog`) and checks relation existence (`to_regclass($1) IS NOT NULL`) instead of search-path-sensitive display text. Live sequence: `FAIL [current_schema]` → `FAIL [15× missing relation]` → `PASS`. Gates in §Verification below.

## QC-100-CLOSURE-08 — Controlled policy decision register for HEAD `06b14cf` (2026-09-08)

- C-29: Register `audit/100-percent/CONTROLLED-POLICY-DECISION-REGISTER.md` inventories PD-01–PD-37 covering
  scientific limits/criteria/methods, precision/rounding, retest, release/approval/SoD authority, effective-date,
  retention/archival, RPO/RTO, escalation, master data, AI usage, e-signature scope, audit integrity, deletion,
  import strategy, and report/export grants. Every item records domain, decision, why required, current behavior
  with file:line proof, rule source, risk, fail-closed default, required approver, implementation impact, tests
  required, and OPEN status. No value invented; operator checklist lists 27 approval-only items.
- C-30: TDD fail-closed suite `tests/unit/policy/controlled-policy-fail-closed.test.ts` — first run RED
  (`1 failed / 9 passed`: test-double echoed the original instead of the created retest, implementation was
  already deny-by-default), fixed double, now `10/10` GREEN proving default-deny for lab approval, retest,
  release-on-PASS, inspection approval, document supersede (+mandatory effective date), scientific evaluation,
  and exact-text raw preservation. Gates on this tree (Node `v22.22.3` local-only, NOT CI parity):
  `format:check` ✅, `lint` ✅ exit 0, `typecheck` ✅ 0 errors / 25 pre-existing hints, `test:unit` ✅
  `31 files / 127 tests` (117 prior + 10 new), `test:architecture` ✅, `git diff --check` ✅. No commit, push,
  deploy, or production mutation.

## QC-100-CLOSURE-09 — AI runtime verification for HEAD `a5ca2b0` (2026-09-08)

- C-31: Fresh focused AI run on the exact HEAD (`a5ca2b0`, clean tree):
  `pnpm exec vitest run tests/unit/ai-advisory/advisory.test.ts
  tests/integration/ai-advisory/evals.test.ts
  tests/integration/ai-advisory/security.test.ts` → `3 files / 39 tests passed`
  (38 prior + 1 new `rate-limited` case). New case added via TDD alongside its
  `rate-limited` fake-provider branch in `evals.test.ts`: provider reports
  available then the completion fails 429-style → use case returns fixed
  `UNAVAILABLE` (GREEN on first run — the catch-all degrade path pre-existed;
  the test locks the 429 path). Dataset grows `14 → 15` cases; the kinds-set
  assertion is unchanged (`provider-unavailable` already covered).
- C-32: Scope + invariant record
  `audit/100-percent/QC-100-CLOSURE-09-AI-RUNTIME-STATEMENT.md`: live provider
  NOT APPLICABLE to this release (no contract, no SDK, no credentials, no
  `process.env` in the AI module/action — scan zero matches; secret scan zero
  hits); `DisabledAiProvider` preserved; 7 critical invariants mapped to
  file:line; all 14 required threat dimensions mapped to exact tests; HITL
  labeling and copy/draft-only reviewer path verified; observability posture
  (no prompt logging per §22, §46 counters intentionally unwired while
  disabled, retention POLICY-DEPENDENT per §163). R-008 NARROWED, stays OPEN
  for the provider half pending a business-approved contract + reviewer UAT
  per PD-31. No commit, push, deploy, or production mutation. Local Node
  `v22.22.3` is outside the `>=24.20.0 <25` contract — results are local-only.
