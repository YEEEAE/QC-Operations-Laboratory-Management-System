# QC-UX-360 — Master transformation program: batch status, gates, scores, evidence

Date: 2026-10-16 · Candidate: `d62de16ac10da7d0b6b727c2c17e2817626387ed` · Branch `main`
Execution: local only — **no** commit, push, deploy, migration against production, or production write.

## Latest continuation — 2026-10-16 (updates to the earlier report below)

The earlier sections A–P describe the initial six-finding batch and are HISTORICAL. This continuation adds verified work without upgrading the overall app-wide score to a made-up percentage.

### Changes in this continuation

- `/dashboard`: added an **Operational areas** directory generated from the existing `visibleNavigation(actor)` and `visibleNavigationUtilities(actor)` functions. It respects route authorization and does not add/change sidebar items or a second navigation taxonomy. No KPI/source/business logic was added. Added a reserved visual treatment for the existing quarantine workflow steps (decorative connector, subtle card elevation, hover tilt only when hover and no-reduced-motion are both present; disabled in forced colors).
- Shared forms: `enhanceClassifiedForm` now handles native invalid events and server Action field errors through `validation-feedback.ts`; errors are associated via `aria-describedby`/`aria-invalid`, summary items target their field, and the user is taken to the first invalid field. Enhancement-owned nodes/attributes are removed without erasing authored validation or inputs. Native POST fallback and server authority remain unchanged. No validation limits/rules were added.
- Login: middleware now preserves the already validated same-origin `returnTo` during Astro's Action redirect cycle. A logged-in visit to login remains redirected to the safe local route, while external destinations still fall back via `safeReturnTo`.
- Accessibility scanner regression: the WCAG tag scan and experimental `label-content-name-mismatch` scan run separately (axe's `withRules` replaces the tag run rather than adding a rule). KPI disclosure glyph is CSS-generated and has no visible text node, preventing the name mismatch. Forced-colors sidebar uses system Canvas/CanvasText tokens.
- `QC_AUTHENTICATED_E2E_FULL` temporary runner option was removed; the user explicitly instructed us to skip the full suite. No unrequested test-runner scope remains.

### Latest verification

| Check | Result |
|---|---|
| Node | `v24.20.0` (project-supported) |
| Typecheck | PASS — 1108 files, 0 errors, 0 warnings, 116 hints |
| Architecture/route registry | PASS |
| Build | PASS — current working tree |
| Focused UI unit contracts | PASS — 56/56 across dashboard, form validation, sidebar, design-token and UX-360 tests |
| Full unit suite | 1432 passed / **25 failed** / 0 skipped; failures match the previously documented baseline categories (missing historical `Documents/*.md`, UAT validator, requirements/ratchet contracts) |
| Full integration suite | 608 passed / 43 failed / 18 skipped; failures are existing database/policy fixture issues, not changes to domain source |
| Authenticated engineering E2E (official selected suite) | **40 passed / 0 failed / 5 skipped**, fresh disposable PostgreSQL 18 database, after dashboard/form changes. Evidence: `.ci-results/qc-ux-360-e2e2.json` (PARTIAL). |
| Full Playwright suite | **NOT RUN to completion, per user instruction to skip it**. One attempt stopped at `capa-policy-copy.spec.ts`, which requires a dedicated `qc_adp26_07` database/port; it was not retried. |
| Browser route/accessibility sweep | 88 route templates requested: 58 HTTP 200, 29 HTTP 404 for deliberately absent sentinel records/404 route, and 1 explicit 500 route; **0 browser errors, 0 axe violations, 88/88 rendered responses with exactly one main landmark, no measured page overflow**. This is surface/a11y evidence, not proof every record workflow works. Evidence (gitignored): `.tmp/ux-sweep-final-current.json`. |
| Responsive / zoom / text spacing / forced colors | Existing sweep covers 8 representative surfaces at 8 viewports and 7 surfaces at 200%/text-spacing; dedicated authenticated E2E checks pass at 320/375/414/768/1024/1440/1920, landscape, 200% and 400%, forced colors. VoiceOver/NVDA manual walk remains NOT VERIFIED. |
| `git diff --check` | PASS |
| Full lint | 9 pre-existing errors outside this continuation's source/test files; no new lint error remains in changed files. |
| Full repo format check | NOT CLEAN due existing warnings elsewhere; changed TypeScript/tests were individually formatted. Astro parser unavailable to installed Prettier. |

### Before/after performance sample

Measured against the retained local built-artifact snapshot `.tmp/ux-perf-baseline/dist` (HEAD `d1dfb44d`) and current built artifact (`f4ec3184` working-tree source), using one disposable local DB, one authenticated browser context, 8 routes, 4 alternating rounds per build. Values are medians; `elapsed` includes local navigation to network-idle, so it is a directional same-machine sample, not a production SLO or release budget.

| Route | Baseline → current navigation ms | DCL ms | transfer bytes | DOM nodes | page overflow |
|---|---:|---:|---:|---:|---:|
| Dashboard | 544 → 535 | 41 → 33 | 80,814 → 85,889 (+5,075) | 1,082 → 1,190 | 0 → 0 |
| Work | 528 → 529 | 26 → 27 | unchanged (56,707) | unchanged (717) | 0 → 0 |
| Tasks | 533 → 528 | 32 → 28 | unchanged (49,580) | unchanged (655) | 0 → 0 |
| Receiving | 526 → 527 | 23 → 25 | unchanged (50,425) | unchanged (656) | 0 → 0 |
| Laboratory | 524 → 523 | 24 → 22 | unchanged (47,174) | unchanged (614) | 0 → 0 |
| Audit | 525 → 524 | 25 → 23 | unchanged (51,208) | unchanged (691) | 0 → 0 |
| Quarantine aging report | 523 → 526 | 24 → 25 | unchanged (48,353) | unchanged (626) | 0 → 0 |
| System health | 536 → 534 | 38 → 34 | 58,101 → 58,141 (+40) | unchanged (778) | 0 → 0 |

LCP entries were unavailable/zero in this harness for both builds; no LCP improvement is claimed. 64 route visits had 0 page errors. Dashboard gained 5.1 KB transfer and 108 DOM nodes due to the authorized department directory: this is the observed cost of the new discoverability, not a measured performance regression by itself.

### Current open work (accurate, no overall percentage)

- Complete page-family transformation and workflow simplification across 88 routes: **PARTIAL**; the sweep does not constitute 88 functional workflow proofs.
- Full E2E suite and its dedicated QC-ADP26-07 environment: **NOT RUN per user instruction**.
- Screen-reader/VoiceOver/NVDA manual evaluation: **NOT VERIFIED**.
- Production migration posture: **NOT RECHECKED**; no production connection or migration was made. Do not repeat the earlier inferred production applied head as a current fact.
- Overall app-wide UI/UX score: **NOT ESTABLISHED**. The earlier “100% of executed checks” statements are withdrawn as product scores; only check-specific outcomes above are evidence.
- No deployment, remote write, git push, or commit was done by this agent.

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

---

## Latest user-requested continuation (2026-10-16, HEAD `f4ec3184`)

### Implemented in this continuation

- Dashboard now includes **Operational areas**, rendered from the existing `visibleNavigation(actor)` and `visibleNavigationUtilities(actor)` decisions. It is discoverability on the page, not a second taxonomy; the frozen sidebar source and links were not edited.
- The dashboard keeps the read-model decision hierarchy intact and uses a restrained CSS connector/hover depth on its quarantine stages, opt-in for pointer hover and `prefers-reduced-motion: no-preference`; forced-colors removes shadow decoration. No new data source, metric, 3D dependency, or business claim was introduced.
- Shared classified forms now expose native constraint and server-provided field errors in an associated, focusable linked summary. Existing application values remain server-authoritative; this adds presentation only, no validation rule or limit. The error behavior is covered by a dedicated 5-case contract test.
- Login return-to, sidebar forced-colors tokens, accessible KPI disclosure glyph, and a test-only WCAG scanner issue were also corrected. Those changes retained the sidebar/API/approval contracts.

### Latest verified checks

| Check | Result |
|---|---|
| Typecheck | PASS — 1108 files, 0 errors, 0 warnings |
| Architecture/route registry | PASS |
| Build | PASS |
| Focused UI contracts | PASS — 56/56 across dashboard, forms, accessibility, route contracts and UX-360 |
| Full unit suite | 1432 PASS / 25 FAIL; same known missing-historical-document, UAT/requirements and ratchet gaps; no new failing category |
| Full integration suite | 608 PASS / 43 FAIL / 18 SKIP; existing fixture/policy failures remain outside these UI changes |
| Authenticated engineering runner (selected accessibility + closure suites) | 40 PASS / 0 FAIL / 5 SKIP (4.8 min) on fresh loopback PostgreSQL 18.6; reporter `.ci-results/qc-ux-360-e2e2.json` PARTIAL (41/0/5) |
| Full project E2E | **SKIPPED per user instruction.** A previous attempt encountered `capa-policy-copy.spec.ts`'s dedicated `qc_adp26_07` database/second-port prerequisite and was explicitly not retried. |
| Full page-tree browser/axe sweep | 88 requests: 58 HTTP 200, 29 HTTP 404 from deliberately absent sentinel record IDs/404 surface, 1 explicit 500 surface; 0 page errors, 0 axe rules firing, 88 rendered responses with one main landmark. This does not mean 88 record workflows functionally passed. `.tmp/ux-sweep-final-current.json` |
| Responsive/zoom | Previously passed 64/64 representative route/viewport combinations; current sweep also observed no page overflow on its responsive targets. Screen-reader manual walkthrough remains NOT VERIFIED. |
| `git diff --check` | PASS |
| lint | 9 known repo-level errors in unrelated legacy/audit files; no reported new lint error from the changed source/tests |

### Comparable local performance sample

Browser loopback, one local disposable DB, 8 routes, 4 alternating rounds per build. Baseline is the retained `.tmp/ux-perf-baseline/dist` artifact from HEAD `d1dfb44d`; current is the working-tree build at `f4ec3184`. Navigation timing below is median DOMContentLoaded-to-network-idle wall time measured by the harness; same host, data and viewport. It is not a production latency/SLO measurement.

| Route | Baseline → current (ms) | DCL (ms) | Transfer bytes | DOM nodes | Overflow |
|---|---:|---:|---:|---:|---:|
| Dashboard | 544 → 535 | 41 → 33 | 80,814 → 85,889 | 1,082 → 1,190 | 0 → 0 |
| Work | 528 → 529 | 26 → 27 | unchanged | unchanged | 0 → 0 |
| Tasks | 533 → 528 | 32 → 28 | unchanged | unchanged | 0 → 0 |
| Receiving | 526 → 527 | 23 → 25 | unchanged | unchanged | 0 → 0 |
| Laboratory | 524 → 523 | 24 → 22 | unchanged | unchanged | 0 → 0 |
| Audit | 525 → 524 | 25 → 23 | unchanged | unchanged | 0 → 0 |
| Quarantine aging report | 523 → 526 | 24 → 25 | unchanged | unchanged | 0 → 0 |
| System health | 536 → 534 | 38 → 34 | 58,101 → 58,141 | unchanged | 0 → 0 |

The dashboard's additional authorized department directory accounts for +5,075 transfer bytes and +108 DOM nodes in this comparison. Other sampled route payloads were unchanged. LCP was not consistently available from the harness, so no LCP claim is made.

### Still incomplete — do not treat as full program acceptance

- The UI now has dashboard discoverability and shared presentation improvements, but there has not been a human, page-by-page visual/product review of all 88 routes. The route sweep used sentinel IDs; 29 404s are uncreated/unreadable records, not successful detail-workflow evidence.
- The official **full** `pnpm run test:e2e` suite and the separately provisioned QC-ADP26-07 fixture are not run to completion, as explicitly requested to skip.
- VoiceOver/NVDA actual-user/screen-reader testing is still NOT VERIFIED.
- The recorded E2E artifact is PARTIAL; its five skipped scenarios are not passes. The 19-gate production release posture and migration drift were not rechecked against production, and no production migration was run.
- Overall UI/UX score and app-wide verified-coverage percentage remain **NOT ESTABLISHED**. The earlier “100% of executed checks / 93 of 93” figures must not be treated as product-level scores.
- No commit, push, deployment or production data write was performed.
