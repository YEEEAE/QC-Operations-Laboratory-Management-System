# QC-100-FINAL-002 — Repair every local verification failure and prove exact-candidate CI

Date: 2026-09-19
State: **PARTIAL** — local verification estate is green on the frozen candidate; exact-candidate CI is **BLOCKED** by an external account condition.
Evidence states are separate from completion states: local technical gates are `PASS`, CI is `BLOCKED / NOT VERIFIED`, human UAT is out of scope and unfulfilled.

## 1) Candidate and environment identity

| Item | Value |
| --- | --- |
| Git SHA (frozen) | `84bdf249dc74062a62cd69a132a326ea2b3f2d82` (`main`), identical to `origin/main` |
| Working tree | `dirty` — 50 modified tracked files, 0 untracked (this task's fixes; nothing committed) |
| Content fingerprint | `git status --porcelain=v1 \| sha256sum` recorded in §6 |
| Node | `v22.22.3` — **outside** the declared `>=24.20.0 <25` contract (pre-existing, unchanged) |
| pnpm | `11.25.0` (matches `packageManager`) |
| Migration source head | `0031_qc_creation_parity_two_stage_approval` (checksum `44b160a6…`) |
| Applied migration head (disposable) | `0031`, pending `[]` |
| Release identity (local build) | `rel-2fcb26ac5e08b697`, build `qc-final002-84bdf249dc74`, environment `ci`, verified `true` |
| Database target | task-owned disposable PostgreSQL 18.6 cluster via `scripts/db/disposable-postgres.sh` on `127.0.0.1:55432` (`.tmp/pg18`, gitignored), databases `qc_disposable`, `qc_test`, `qc_iso` |
| Evidence timestamps | 2026-09-19 ~18:22–18:40 local |

Audit comparison baseline (not proof for this candidate): candidate `653b58d2…`, maturity 45.8%, mandatory production gates 0/19, PARTIAL / NO-GO. No score or release-gate value was edited.

## 2) Reproduced baseline at HEAD (before fixes)

| Gate | Result at HEAD (baseline) |
| --- | --- |
| `pnpm format:check` | FAIL — 39 files |
| `pnpm lint` | FAIL — 55 errors |
| `pnpm test:unit` | 672 / 677 (5 failed) |
| `pnpm test:integration` (disposable PG) | 411 passed / 6 failed / 2 skipped (419) |
| `pnpm test:migrations` / `test:concurrency` / `test:security` | not run at baseline |

The audit reported 7 integration failures; this host reproduced **6 failures + 2 skips** on the same suites. The delta is state-dependent (the shared `qc_test` database left behind by earlier suites), not a different defect set.

## 3) Root causes and classification

Every fix is either (a) a genuine source defect (lint/format/implementation) or (b) a **stale or state-dependent test contract** whose assertions no longer describe the approved behaviour. No test was deleted, skipped, or blanket-disabled; no migration checksum was rewritten.

### 3.1 Format (39 files) and lint (55 errors) — source defects
- Prettier: reflowed the 39 files the gate reported. Three of them are `audit/**` evidence JSON artifacts; they were verified **semantically identical** to their HEAD content (`JSON.parse` deep compare = `true` for all three), so no evidence value changed.
- Lint, by file:
  - `scripts/performance/*.mjs` (4 files): no Node globals declared. Fixed with the repo's existing convention — a `/* global … */` comment per file. `login-and-capture.mjs` additionally declared `PerformanceObserver` while the only reference sits inside a stringified browser script, so that entry was removed.
  - `scripts/performance/seed-synthetic-dataset.ts` (16 errors): state vocabularies were `as const` arrays used **only** to derive types. Converted to type aliases; two genuinely dead vocabularies (`TASK_PRIORITIES`, `REJECT_TYPES`) were deleted.
  - `scripts/uat/ingest-uat-evidence.ts`: `loadLocalEnv` imported but never called. Every other CLI calls it at its boundary, so the CLI now calls it (the import was not deleted).
  - `scripts/uat/run-uat-scenarios.ts`: `let migrationHead = 'unknown'` was overwritten before any read → declared without the dead initializer.
  - `src/modules/laboratory/application/dependencies.ts`, `src/modules/quarantine/inspection/application/final-approve-inspection.ts`: unused imports removed (residue of the Render duplicate-import build fix).

### 3.2 The five unit failures — 4 test-contract defects, 1 implementation defect

| # | Suite / test | Root cause | Classification | Fix |
| --- | --- | --- | --- | --- |
| 1 | `tests/unit/access/grant-system-owner.test.ts` — "requires a database URL and an explicit login identity" | `parseSystemOwnerGrantConfig()` called `loadLocalEnv(environment)`, silently merging the developer's `.env` into the caller's object. With `{}` supplied, `DATABASE_URL` leaked in from `.env` and only the identity check failed — the parser was not isolated, violating the documented boundary rule ("load `.env` at the CLI boundary only") | **Implementation defect** | Removed the merge from the reusable parser; `loadLocalEnv()` now runs in the CLI entry block |
| 2 | `tests/unit/laboratory/scientific-governance.test.ts` — "the lab review workspace discloses the reject contract without faking client authority" | Asserted `not.toContain('astro:actions')` / `not.toContain('<form')` — the QC-CLOSURE-007 assumption that the page has **no** actionable control. QC-100-FINAL-004 (owner-approved) added the two-stage approval/return rail to that page, whose authority is enforced server-side by `src/actions/laboratory.ts` | **Stale test contract** | Assertion now pins the real invariant: no reject control and no client-supplied `scientificResult` on the page, with the server-side actions module asserted by the sibling test |
| 3 | `tests/unit/ui/dashboard-decision-surface.test.ts` — "feeds each counter and its queue items from one read with a declared severity" | Asserted the literal source text `metric: { ...metric, value: rows.length }`. The approved QC-100-FINAL-017 contract is *dashboard total vs bounded queue*: one read returns the register's own full `total` (bounded reads) or its row count, and the queue is a bounded severity-ordered slice | **Stale test contract** | Assertion now pins the one-read contract (`read.total` / `read.length`, `metric: { ...metric, value }`) |
| 4 | `tests/unit/ui/icon-and-copy-contract.test.ts` — "keeps backend read-model terminology and placeholder glyphs out of presentation sources" | `src/pages/reject-reports/issue-slips/[reportId].astro` contained U+2192 arrows inside a code comment (`SUPERVISOR → QC_MANAGER → …`), matching the presentation-glyph guard | **Source defect** | Comment rewritten with ASCII `->` |
| 5 | `tests/unit/ui/visual-token-contract.test.ts` — "defines every var(--*) consumed by src/pages and src/ui" | `src/pages/laboratory/tests/[labTestId]/review.astro` consumed `--color-accent-secondary`, which is **not** a defined token (it carried only a hard-coded fallback). Every other page styles secondary buttons with the defined `--surface-raised` / `--border-default` / `--text-primary` set | **Source defect** | Secondary button styling switched to the defined tokens used across the app |

Related discovery (recorded as an open defect, **not** fixed): six `.astro` pages are stored as collapsed one-line sources — `src/pages/assets/equipment/[equipmentId].astro` (7,325 B / 9 lines), `src/pages/laboratory/tests/[labTestId]/review.astro` (6,829 / 17), `src/pages/assets/calibrations/[calibrationId].astro` (6,788 / 9), `src/pages/assets/maintenance/[maintenanceId].astro` (4,617 / 7), `src/pages/laboratory/tests/[labTestId]/index.astro` (3,857 / 7), `src/pages/laboratory/tests/[labTestId]/execute.astro` (3,109 / 5). Prettier does not format `.astro`, so no gate catches this. De-minifying them is a separate, output-preserving refactor.

### 3.3 The six integration failures + two skips

| # | Suite / test | Root cause | Classification | Fix |
| --- | --- | --- | --- | --- |
| 1 | `tests/integration/identity/system-owner-upgrade-parity.test.ts` (suite failure → 2 skipped tests) | The suite applies a deliberately *pre-`0030`* migration set, so it requires an empty schema. On a reused `QC_TEST_DATABASE_URL` cluster another suite had already written a `0030` ledger row, so `verifyMigrationIntegrity` rejected the applied-but-absent-from-the-legacy-set version | **Test isolation defect** | Per-suite schema isolation (`DROP SCHEMA IF EXISTS qc CASCADE` before the legacy migrate), the pattern already used by the control-center and controlled-mutation suites. The two skips disappear with the suite failure |
| 2 | `tests/integration/system/control-center.test.ts` — "…with the real migration head" | `createPostgresMigrationStatus` resolved `db/migrations` with a single relative URL three levels up. That depth is correct for the bundled server (`dist/server/chunks`) but not for the source tree (`src/modules/system-health/infrastructure`), so under Vitest the lookup threw, `buildHead` became `NONE`, `expectedHead` became `UNKNOWN` and `drift` was reported against an in-sync database | **Implementation defect** | The directory is probed over both supported depths; only a successful lookup may produce a shipped head. Verified in the built output: the bundle reference lives in `dist/server/chunks/dependencies_*.mjs`, where the three-level candidate still resolves |
| 3 | `tests/integration/shared/search-scope.test.ts` — "treats LIKE wildcards as literal business data…" | The assertions (`q='%'` → 4 rows, `q='SRCH%A-00%'` → 6 rows) encoded pass-through wildcards, while the implementation deliberately escapes `%`/`_` and relies on a separate authorization predicate for scope. The test contradicted its own title and comments | **Stale test contract** | Assertions now pin literal semantics: `%` → 0, `SRCH_A` → 0 for both actors, `SRCH-B` → that actor's own 4 rows, `SRCH%A-00%` → 0. Scope-isolation assertions are unchanged |
| 4 | `tests/integration/reporting/report-export-parity.test.ts` — "denies exports without the format-specific export permission" | `toMatchObject({ rows: new Array(3) })` compares against a **sparse** array of 3 holes; the real rows are objects, so the matcher failed while the diff showed "no visual difference" | **Test defect** | Replaced with an explicit `expect(screen.rows).toHaveLength(3)`; the export-denial assertion is unchanged |
| 5 | `tests/integration/concurrency/controlled-mutations.test.ts` — inspection approval | Expected `APPROVED` after a single approval. QC-100-FINAL-004 makes the stage-1 approval move `UNDER_REVIEW → PENDING_QCM_APPROVAL`; only `FINAL_APPROVE` reaches `APPROVED`, stamps `approved_at` and completes the receiving consequence | **Stale test contract** | Stage-1 expectations updated (`PENDING_QCM_APPROVAL`, v4, receiving stays `UNDER_INSPECTION`/`IN_PROGRESS`, audit/outbox 1) |
| 6 | same suite — "does not overwrite a receiving item placed on HOLD…" | The HOLD guard moved with the consequence: `FINAL_APPROVE` is now the action that would overwrite the receiving item | **Stale test contract** | The test now runs stage-1, then a **final** approval with an injected signature stub and asserts `CONFLICT_STALE_VERSION` + full rollback (receiving still `HOLD`/v4, report still `PENDING_QCM_APPROVAL`/v4, `FINAL_APPROVE` audit 0, `v5` outbox 0) |
| 7 | same suite — laboratory approval | Same two-stage change (`approved_at` is only stamped by the final approval) | **Stale test contract** | Expectations updated (`PENDING_QCM_APPROVAL`, `scientific_result='PASS'`, `approved_at` null, v3) |
| 8 | `tests/integration/shared/notification-outbox-delivery.test.ts` + `tests/integration/quarantine/overview-parity.test.ts` | Both suites assumed a pristine database. `outbox.claim(10)` is consumed by another suite's older unclaimed events, and the quarantine trend/register parity broke when the register contained other suites' rows (10 vs 274) | **Test isolation defect** | Per-suite schema isolation added to both suites (proven on a fresh database: `overview-parity` 6/6, notification suite 3/4 with one remaining ordering assertion) |
| 9 | `notification-outbox-delivery` — "keeps recipient listing and mark-read replays stable and idempotent" | Asserted that the later-created row lists first when both rows share one timestamp. The listing's declared tie-break is `id DESC`, but PostgreSQL 18's `uuidv7()` is time-ordered and **not monotonic within a millisecond**, so creation order is not recoverable from the id | **Stale test contract** | The assertion now pins the implemented rule (`created_at DESC, id DESC`) plus the stability guarantee; entries are still asserted to contain both rows |

**Verification of "pre-existing":** each of the five unit failures and the integration set was reproduced at HEAD before any edit (the renderer/source contract for the dashboard assertion was confirmed absent from `git show HEAD:<file>`), and the failure list matched the audit baseline. The remaining integration failures were reproduced twice (full run and isolated run) before their fixes.

## 4) Gates after the fixes (all on the frozen candidate)

| Command | Result | Exit |
| --- | --- | --- |
| `pnpm format:check` | All matched files use Prettier code style (0 violations, was 39) | 0 |
| `pnpm lint` | 0 errors (was 55) | 0 |
| `pnpm typecheck` | 846 files, 0 errors, 0 warnings, 74 hints | 0 |
| `pnpm test:architecture` | boundary check + canonical route registry PASS | 0 |
| `pnpm test:unit` | **677 passed / 677** (93 files, 0 failures, was 672/677) | 0 |
| `pnpm test:integration` | **419 passed / 419** (96 files, 0 failures, 0 skips) — reproduced twice consecutively | 0 |
| `pnpm test:migrations` | 29 passed (8 files) | 0 |
| `pnpm test:concurrency` | 12 passed (2 files); suite repeated 5× → exit 0 every run, 0 intermittent failures | 0 |
| `pnpm test:security` | 52 passed (7 files), 0 skips | 0 |
| `pnpm db:migrate` (clean path) | applied `0001`–`0031`, pending `[]` | 0 |
| `pnpm db:migrate` (re-run) | `{"applied":[],"pending":[]}` — idempotent zero-op | 0 |
| `pnpm db:migrate:check` | `{"status":"ok","migrations":31}` | 0 |
| `pnpm db:schema:check` | `{"status":"ok","migrationCount":31,"tableCount":77,"orphanCount":0}` | 0 |
| `pnpm build` | server built, complete | 0 |
| `pnpm release:identity` | `releaseId rel-2fcb26ac5e08b697`, head `0031_qc_creation_parity_two_stage_approval`, environment `ci` | 0 |
| `pnpm release:verify` | `{"verified":true}` for `84bdf249dc74…` | 0 |
| `pnpm release:tech-debt:check` | 6 registered items | 0 |
| `git diff --check HEAD` | no whitespace errors | 0 |
| `pnpm test:e2e` / `pnpm verify:e2e:authenticated` | **NOT RUN / BLOCKED** — `docker info` fails on this host (no container runtime), the same blocker recorded by QC-100-FINAL-003/010 | — |

The container-backed path (`postgres:18-alpine` Testcontainers) that CI uses was **not** executed; all database evidence above comes from the repo's approved equivalent disposable PostgreSQL 18.6 cluster.

## 5) Exact-candidate CI (read-only inspection)

- Workflow `Verification CI` (`.github/workflows/ci.yml`) requires, in order: frozen install, format, `git diff --check`, lint, typecheck, architecture, tech-debt register, unit, integration, migrations, concurrency, security, build, release-identity + release-verify against the exact SHA, authenticated closure E2E with candidate-bound fixtures, built-server E2E, and a release-evidence artifact upload.
- Run for this exact candidate: `35451577856` (push, `84bdf249dc74062a62cd69a132a326ea2b3f2d82`), job `Verify` `105919547357` → **failure with `steps: []`** (started 15:21:49Z, completed 15:21:52Z).
- Authoritative annotation: `"The job was not started because your account is locked due to a billing issue."`
- Therefore **exact-candidate CI is `BLOCKED`, not `FAIL`**: no step, test, or workflow defect is implicated. Operator dependency: resolve the GitHub account billing lock; the required jobs then need a CI run (or an explicitly authorized publication path) to produce immutable candidate evidence.
- Observation, out of scope: the `pages build and deployment` workflow also fails for this repository. GitHub Pages/Jekyll is not the deployment target for this application (Render is).

## 6) Changed paths

Source (7): `scripts/access/grant-system-owner.ts`, `scripts/performance/{concurrency-probe,explain-critical-reads,login-and-capture,rate-limit-probe}.mjs`, `scripts/performance/seed-synthetic-dataset.ts`, `scripts/uat/{ingest-uat-evidence,run-uat-scenarios}.ts`, `src/modules/laboratory/application/dependencies.ts`, `src/modules/quarantine/inspection/application/final-approve-inspection.ts`, `src/modules/system-health/infrastructure/postgres-migration-status.ts`, `src/pages/laboratory/tests/[labTestId]/review.astro`, `src/pages/reject-reports/issue-slips/[reportId].astro`.

Tests (8): `tests/unit/{access/grant-system-owner, laboratory/scientific-governance, ui/dashboard-decision-surface, ui/icon-and-copy-contract, ui/visual-token-contract}` (the last two changed only through the production sources above), `tests/integration/identity/system-owner-upgrade-parity.test.ts`, `tests/integration/system/control-center.test.ts`, `tests/integration/shared/search-scope.test.ts`, `tests/integration/shared/notification-outbox-delivery.test.ts`, `tests/integration/reporting/report-export-parity.test.ts`, `tests/integration/quarantine/overview-parity.test.ts`, `tests/integration/concurrency/controlled-mutations.test.ts`.

Formatting-only: 39 files from the Prettier gate (including 3 `audit/**` evidence JSONs, verified semantically identical).

Working-tree fingerprint: `git status --porcelain=v1 | shasum -a 256` was captured before and after the change set (`50` modified files, `0` untracked).

## 7) Open items and downstream owners

| Item | Owner |
| --- | --- |
| GitHub account billing lock → run `Verification CI` for an authorized candidate | operator (external) |
| Docker/container runtime → Testcontainers path + authenticated E2E suites | operator (external) |
| Node 24.20.0 local runtime (contract `>=24.20.0 <25`; this host is `22.22.3`) | operator |
| Six collapsed `.astro` sources (§3.2) — output-preserving de-minification | new task |
| `.tmp-check/check-bundles.ts` is a tracked local scratch script (formatted here so the gate passes); it belongs in the gitignored `.tmp/` area or should be deleted | owner decision |
| `audit/**` evidence JSON files are inside the repo-wide Prettier scope — formatting them reflows evidence artifacts | owner decision (policy) |
| `.env` sets `NODE_ENV=production`, so `pnpm db:migrate` / `db:schema:check` refuse to run locally until `SERVICE_VERSION` + both `RATE_LIMIT_LOGIN_*` values exist or `NODE_ENV` is overridden for the run | owner decision (local `.env`) |
| Human UAT / sign-off | out of scope for this task set; remains `UNVERIFIED` |

`PASS ≠ RELEASED`. Nothing was committed, pushed, merged, deployed, rotated, or migrated on production; no paid service was touched; no human UAT was executed or fabricated.
