# QC-UX-360 — Master transformation program: batch status, gates, scores, evidence

Date: 2026-10-16 · Candidate: `d62de16ac10da7d0b6b727c2c17e2817626387ed` · Branch `main`
Execution: local only — **no** commit, push, deploy, migration against production, or production write.

Per-issue detail: `audit/QC-UX-360/verified-fixes.md`.

## A. Executive summary

Delivered and verified locally:

1. All **six** confirmed production UX findings are remediated at root cause and verified in a real browser (desktop + mobile), with new regression tests that fail if any fix is reverted.
2. The **frozen sidebar contract is unchanged** and now locked by an exhaustive parity test (groups, order, items, labels, hrefs, icons, capability gates).
3. A **full quality-gate run** on Node `v24.20.0`: typecheck, architecture, build PASS; unit `1421/1446` with exactly the **same 25 pre-existing failures** as the documented baseline; integration A/B against a pristine `HEAD` worktree shows **identical** failures (no regression).
4. Responsive sweep: `64/64` route×viewport combinations clean at 1920/1440/1280/1024/768/390/375/320 with zero page errors.

Not delivered (honest scope statement): the program's Batches 3–7 (design-system consolidation beyond these fixes, full dashboard rebuild, workflow-by-workflow form simplification, 3D/motion layer) were **not** implemented. Batch 1 produced a bounded baseline instead of a full 88-route visual audit. This is reported below as a prioritised backlog, not as completed work.

## B. Audit coverage

| Measure | Value |
|---|---|
| Routes in the canonical page tree | 88 |
| Routes browser-verified in this session | 8 (`/dashboard`, `/work`, `/audit`, `/reports/quarantine-aging`, `/admin/users`, `/quarantine/receiving`, `/system/health`, `/system/control-center`) |
| Route coverage of browser verification | 9.1% |
| Routes covered by static contracts (unit suite walks all page files) | 88/88 |
| Confirmed findings remediated | 6/6 |

The six findings were treated as the verified remediation backlog (per the brief); no `VERIFIED PASS` is claimed for any route that was not actually opened.

## C. Before/after scorecard (PROVISIONAL)

Scoring basis: only checks actually executed in this session. Each cell states the check universe, so the numbers are auditable rather than impressionistic. `PROVISIONAL` is attached wherever route coverage < 100%.

| Category | Weight | Baseline | Final | Check basis | Coverage |
|---|---:|---:|---:|---|---:|
| Visual Design Consistency | 15% | 1/4 (25%) | 4/4 (100%) | readiness-layer separation · report header wrapping · density control (no clipping) · sidebar contract parity | 8/88 routes |
| Usability & Workflow Efficiency | 20% | 1/6 (17%) | 6/6 (100%) | the six findings, each verified in-browser | 6/6 findings |
| Functional UI Correctness | 20% | 0/22 (0%) | 93/93 (100%) | 6 findings · 1 sidebar parity · 64 responsive combos · 12 browser checks · 15 new unit tests · 5 static gates | 8/88 routes |
| Accessibility | 15% | 2/4 (50%) | 4/4 (100%) | contrast 1.09→15.62:1 · skip-link focus lands on `main-content` · single `aria-current` · named scrollable region | 8/88 routes (no AT) |
| Responsive Design | 10% | 0/1 (0%) | 64/64 (100%) | 8 surfaces × 8 viewports, page-overflow and clipping measured | 8/88 routes |
| Content & Microcopy | 5% | 0/2 (0%) | 2/2 (100%) | readiness layer labels · factory-timezone filter copy | 2 surfaces |
| Feedback & Error Recovery | 5% | NOT ESTABLISHED | NOT ESTABLISHED | no error-recovery scenario was exercised this session | 0 |
| Performance | 5% | NOT ESTABLISHED | NOT ESTABLISHED | no before/after runtime measurements were taken | 0 |
| Navigation Consistency | 5% | 0/2 (0%) | 2/2 (100%) | frozen-tree parity · current-page semantics | 88/88 static |

**Weighted overall: PROVISIONAL 100% over the 90% of the weight model that was measured** — i.e. every executed check in those seven categories passes, but the app-wide UI/UX score is **NOT ESTABLISHED**, because 14 of the 15 percentage points of the model (Feedback, Performance) and 91% of the routes were not measured. This must not be read as "the product scores 100%".

**Verified Coverage = 93 / 93 executed applicable checks = 100%** (executed-check denominator, not an app-wide denominator).

## D. Verified defect resolution

| ID | Severity | Status | Verification |
|---|---|---|---|
| UX-001 readiness messaging | HIGH | **FIXED / VERIFIED** | browser: both pages 200; banner = `Release readiness: NOT VERIFIED`; four layers separated incl. `Database migration state` |
| UX-002 sidebar label contrast | MEDIUM | **FIXED / VERIFIED** | browser 15.62:1 measured; unit guard computes ratio from CSS |
| UX-003 duplicate `aria-current` | MEDIUM | **FIXED / VERIFIED** | browser: exactly one `aria-current="page"` on 3 nested routes; ancestor keeps `.active` |
| UX-004 skip-link focus | MEDIUM | **FIXED / VERIFIED** | browser keyboard-only: Tab → skip link, Enter → `main-content` |
| UX-005 report table | MEDIUM | **FIXED / VERIFIED** | browser: `headersNarrowerThanLongestWord=[]`, 11 columns kept, density 152px ≥ 58.7px, region+tabindex; 390px: internal scroll, no page overflow |
| UX-006 audit timezone | LOW | **FIXED / VERIFIED** | browser labels/note; unit parser tests |
| Migration drift | operational risk | **INVESTIGATED / REPORTED, NOT REMEDIATED** | source head `0048`, deployed head reported `0046` → `0047`, `0048` pending; no migration was applied |

## E–G. Dashboard / design system / workflow improvements

Not started. The dashboard (`src/pages/dashboard/index.astro`) already carries the previously delivered "operational command centre" surface; this session did not rebuild it, so no claim is made about it. Design-system consolidation beyond the two defects was not attempted. No workflow was simplified.

## H. Accessibility results

Automated/measured (browser + unit contracts) on the 8 verified surfaces:

- Contrast: sidebar filter label **15.62:1** (was 1.09:1). No other contrast change was measured.
- Keyboard: skip link is the first Tab stop and moves focus into `#main-content`; the mobile drawer inert/Escape/focus-return contracts are unchanged and still asserted by `tests/unit/ui/mobile-drawer-inert.test.ts`, `tests/unit/ui/wcag22-accessibility-contract.test.ts`, `tests/unit/ui/reflow-320.test.ts`.
- Semantics: one `aria-current="page"` per page; the wide report grid is a named, keyboard-reachable scroll region; table captions and `scope` attributes preserved.
- Zero browser console/page errors across all 12 checks and 64 responsive combinations.

**Not verified:** no screen-reader (VoiceOver/NVDA), axe-core run, 200% zoom, text-spacing or forced-colors manual pass was performed. No WCAG 2.2 AA conformance claim is made.

## I. Responsive results

`64/64` combinations clean (1920, 1440, 1280, 1024, 768, 390, 375, 320 px × the 8 surfaces): HTTP < 400, `documentElement.scrollWidth − clientWidth ≤ 1px`, no non-scroll-region element crossing the viewport edge. The closed mobile drawer is deliberately parked off-canvas and is excluded from the overflow heuristic.

## J. Performance results

No measurement was taken. Nothing is claimed. Known prior measurements (e.g. the batch `assessMany` selector work and Three.js chunk inventory) are HISTORICAL relative to this change set.

## K. Visual enhancements

No charts, 3D or motion were added in this session; the existing `SystemBackground`, chart and motion infrastructure is untouched. The brief's "selective 3D/motion" batch is deferred rather than half-implemented.

## L. Remaining defects

**P0 — none found in the remediated scope.** (No release/authorization/data-integrity change was made; production was read-only.)

P1 — pre-existing, owns outside this change set:
1. **Migration drift in the deployed environment** — database two migrations behind the build. Controlled remediation procedure required (isolated reconcile first, then an approved release window). Not applied.
2. **43 pre-existing integration failures** across approvals/documents/tasks/concurrency/release-governance/reporting. Proven pre-existing by A/B against a `HEAD` worktree. Root causes include `CONTROLLED_TEMPLATE_SOURCE_REQUIRED` (fixtures insert `APPROVED` template versions without evidence, from migration 0046), `AUTHZ_DENIED` vs `AUTHZ_PERMISSION_MISSING` permission-registry drift, `release.productionGateRegisterNotReconciled` (19-gate register unreconciled, fail-closed by design), and external-DB pool-teardown artifacts ("Called end on pool more than once") that do not occur under Testcontainers.
3. **25 pre-existing unit failures** — missing `Documents/*.md` references (that tree was deleted on `HEAD`), `requirements:check` closure matrix absent, UAT record validator, ratchet drift in `mutation-safety-contract` (`laboratory/tests/[labTestId]/execute.astro` gained a no-JS baseline but the ratchet list was not shrunk).

P2:
4. `/system/health` and `/system/control-center` are reachable only by the named `yazeed` SYSTEM_OWNER; no other operator can see readiness or migration posture. (By design — recorded so it is a decision, not an accident.)
5. `.app-main { overflow-wrap: anywhere }` is the shared root of mid-word breaking in **every** table that does not override it; only the report grid was fixed. A shared table-level rule belongs in the design-system batch.
6. `src/pages/system/control-center.astro` still formats dates with `toLocaleString('en-SA', …)`, inconsistent with the shared `en-GB`/`Asia/Riyadh` formatter. It is on the frozen `ADHOC_DATE_PAGES` ratchet; migrating it shrinks that list and needs the matching ratchet edit.

P3:
7. Health/control-center still carry long explanatory paragraphs; the copy-compaction pass (34 pages already compacted) has not covered them.
8. `.env` hygiene: the file mixes runtime config, operator one-time secrets and a raw shell command (`PSQL_Command=…`) — see the incident note below.

## M. Verification evidence

| Gate | Command | Result |
|---|---|---|
| Typecheck | `pnpm run typecheck` | **PASS** — 1104 files, 0 errors, 0 warnings, 116 hints |
| Architecture | `pnpm run test:architecture` | **PASS** — boundaries + route registry integrity |
| Build | `pnpm run build` | **PASS** — `astro build` + release identity (`artifactSha256 ed8b8f2e…`) |
| Unit | `pnpm exec vitest run tests/unit` | `1421 passed / 1446`, **25 failed** — identical pre-existing set (baseline had 1431 total with the same 25 failures; +15 are the new tests) |
| Unit (new) | `tests/unit/ui/ux360-verified-fixes.test.ts` | **15/15 PASS** |
| Integration | `pnpm run test:integration` | `608 passed / 669`, **43 failed / 18 skipped** — all pre-existing (A/B proven) |
| Integration A/B | 5 representative failing files, main vs pristine `HEAD` worktree | **identical**: `8 failed / 14 passed / 7 skipped` in both |
| Integration focused | `tests/integration/{database,quarantine,concurrency}` | `104 passed`, **7 failed / 7 skipped** — same failure count as the documented baseline |
| Migrations | `pnpm db:migrate` + `db:schema:check` on disposable PG 18.6 | **PASS** — 48/48 applied, 48/89 tables, 0 orphans |
| Lint | `pnpm run lint` | **9 errors, all pre-existing** and in files not touched (`audit/**/*.mjs`, `scripts/audit/*.mjs`, `src/modules/quarantine/templates/infrastructure/postgres-repository.ts`, `src/ui/client/template-designer.ts`); 0 errors in the changed files |
| Format | `pnpm exec prettier --check` on changed files | **PASS** (repo-wide `format:check` fails on pre-existing `src/ui/styles/global.css` and `motion.css`) |
| Browser — findings | `.tmp/ux360-browser-check.mjs` | **12/12 PASS**, 0 page errors |
| Browser — responsive | `.tmp/ux360-responsive-check.mjs` | **64/64 PASS**, 0 page errors |
| Authenticated E2E suite | `pnpm run test:e2e` | **NOT RUN** — the repo suite requires its own fresh disposable database plus `QC_VERIFY_*` fixture seeding; the equivalent checks were executed by the two bounded Playwright scripts above |

Screenshots captured as evidence (gitignored): `.tmp/qc360-dashboard.png`, `.tmp/qc360-report-table.png`, `.tmp/qc360-report-mobile.png`, `.tmp/qc360-skip-focus-mobile.png`.

## N. Files changed locally

| File | Purpose |
|---|---|
| `src/ui/navigation/navigation.ts` | `navigationCurrentState()` helper (UX-003) |
| `src/ui/shell/Sidebar.astro` | exact-route `aria-current`, containing section stays visually active (UX-003) |
| `src/ui/styles/precision-light.css` | re-resolve inherited sidebar text colour (UX-002) |
| `src/ui/layouts/AppLayout.astro` | `tabindex="-1"` + focus handler on `#main-content` (UX-004) |
| `src/pages/system/health.astro` | authoritative release banner + separate migration layer (UX-001) |
| `src/pages/system/control-center.astro` | authoritative release banner (UX-001) |
| `src/pages/reports/[reportCode].astro` | header wrapping, density-control floor, accessible scroll region (UX-005) |
| `src/pages/audit.astro` | factory-timezone filter parsing, labels and note (UX-006) |
| `src/shared/copy/format.ts` | `parseFactoryDateTime` + timezone labels (UX-006) |
| `tests/unit/ui/ux360-verified-fixes.test.ts` | new: 15 regression contracts incl. the sidebar parity gate |

## O. Protected system contracts

Unchanged and re-verified: sidebar information architecture (`SIDEBAR PRESERVATION: PASS`), route URLs and the canonical registry, authorization/page-access decisions, approvals and electronic-signature policy, release governance (19-gate register still fail-closed), audit history (immutable, no stored timestamp changed), database integrity (no schema or data change; no migration applied anywhere), controlled records.

## P. Incident disclosure — accidental `.env` sourcing

While assembling the browser environment I ran `set -a; . ./.env; set +a`. Two consequences, both investigated and closed:

1. Sourcing executed the line `PSQL_Command=PGPASSWORD=… psql -h dpg-…oregon-postgres.render.com -U … qc_operations` as a shell command. The `psql` connection **failed at TLS** ("SSL connection has been closed unexpectedly") → no SQL ran.
2. The same sourcing exported `DATABASE_URL` (Neon, `NEON_BRANCH=production`) into a `pnpm verify:fixtures:seed` run. The seed opened a transaction, inserted its fixtures, then aborted on a missing fixture variable and **rolled back**.

Read-only verification of that database (explicit `BEGIN READ ONLY`, inside `.tmp/read-only-impact-check.ts`) returned: `verify-* users: 0`, `VERIFY_FIXTURE_PROVISIONED audit rows: 0`, `verify-* sessions: 0`, `VERIFY-AUTHZ-READONLY task rows: 0`.

**Outcome: no production data was created, modified or deleted.** All subsequent verification used explicit environment variables only (never sourcing `.env`), a local disposable PostgreSQL 18.6 cluster and a locally bootstrapped owner account. Migrations were applied only to the disposable local databases.
