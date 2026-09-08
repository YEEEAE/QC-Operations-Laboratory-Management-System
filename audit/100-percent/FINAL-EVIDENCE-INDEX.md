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
