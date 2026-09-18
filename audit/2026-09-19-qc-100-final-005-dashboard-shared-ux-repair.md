# QC-100-FINAL-005 — Dashboard & shared user experience repair

- **Result:** **DONE** (candidate-side source repair, verified locally) — **PARTIAL** for any live/deployed claim.
- **Evidence:** **PASS** for the local gates listed in §4; **NOT VERIFIED / BLOCKED** for deployment, authenticated container E2E, AT/human UAT and multi-role behaviour.
- **Scope:** dashboard decision surface + the two registers it drills into + the shared KPI/shell controls.

## 1. Candidate & environment

| Item | Value |
|---|---|
| Frozen candidate | `0316f4058584719d76194d65ff096fae8ee3b4dc` (`main`) **plus the uncommitted working-tree repair in §3** |
| Previous HEAD context | Not re-derived from the older audits; the audit observations were re-reproduced against the current source, not assumed |
| Node / pnpm | `v24.20.0` (inside the declared `>=24.20.0 <25` contract) / `11.25.0` |
| Database | disposable local PostgreSQL 18.6 (`scripts/db/disposable-postgres.sh`, TLS, throwaway CA) — **never production** |
| Deployment | **Not touched.** No commit, push, deploy, migration on Render, credential change or paid-service change was performed |

## 2. Baseline findings this task owns — status at the frozen candidate

| Baseline observation (2026-09-18 audit) | Status after this repair | Evidence |
|---|---|---|
| Serif/`Times` fallback on every surface | **CLOSED** (already fixed at HEAD; re-verified, not assumed) | browser: `body` computed `font-family` = `Inter, ui-sans-serif, …` at 1440 and 375 |
| KPI drill-downs ignore `inspectionResult` / `workflowState` | **CLOSED at the owning boundary** and now **exact** | the registers accept `inspectionResult`/`releaseState`/`workflowState`; personal KPIs add the `ownership=mine` filter their count uses |
| Personal KPI values labelled as an authorized scope | **CLOSED** | every KPI now declares its own `numerator`, `state`, `actorScope`, time window; `actorScope` is rendered on the card and in the definition |
| Decision queue ≠ "Pending review" count; severity hard-coded `WARNING` | **CLOSED** | the queue is fed by the same rollup as the counter (canonical approvals reader + own HOLD); severity is derived (`CRITICAL` for HOLD, `WARNING` for approvals) |
| Topbar identity = internal UUID | **CLOSED** | rendered shell shows `dashcheck` / `Administrator`, avatar `D` |
| Metadata below the readable floor (34 sub-12px nodes on `/dashboard`) | **CLOSED** | browser leaf nodes `< 12px` on the populated `/dashboard` = **0** (was 34) |
| Targets below 24px | **CLOSED for the flagged controls** | only the breadcrumb inline link (`33×15`) remains; it is the WCAG 2.5.8 inline-text exception. Icon-only topbar controls are now `min-inline-size:44px` |
| Heading order (H2 nav labels before the page H1) | **CLOSED** | first heading on `/dashboard` = `H1`; navigation group labels are `<p>`, not headings |
| Decorative WASM/Lottie layer + CSP errors | **CLOSED** | 0 `.wasm`/lottie requests and 0 console errors across 6 authenticated pages |
| Duplicate empty trend/coverage panels | **CLOSED** | one coverage panel; the trend statement is explicit that an unavailable provider is never an empty chart or a zero |
| Provider error swallows the authorization error | **CLOSED** | an `AUTHORIZATION`-category failure renders a distinct "cannot open the dashboard" state; a read failure renders the withheld-data state; nothing is coerced to `0` |

## 3. Changes made (all candidate-side, uncommitted)

1. **KPI contract, not a label.** `DashboardMetric` now carries `numerator`, `state`, `actorScope` (with the existing `unit` / `timeRange`) so a number can always be reconciled with the register it links to. `KpiCard.astro` renders the scope visibly and the full contract in the disclosure.
2. **One decision rollup.** `dashboardDependencies()` injects the canonical approvals reader (`ListMyApprovalsUseCase`) into `PostgresDashboardQuery`. The "Pending review" counter, the `/approvals` register and the decision queue now read the same set; an unavailable approvals provider rejects the whole read model (fail closed) instead of rendering `0`.
3. **Exact personal drill-downs.** The receiving and inspections registers gained a server-side `ownership=mine` filter (ports, repositories, use cases, page select + applied-filter chip). Every personal KPI links with the filter its count actually applies: `inspectionResult=HOLD&ownership=mine`, `releaseState=RELEASED&ownership=mine`, `finalResult=PASS&ownership=mine`, and the approvals queue.
4. **Real severity + honest queue copy.** HOLD receiving items are `CRITICAL`, assigned approvals are `WARNING`; the panel states exactly what it lists and offers both onward registers.
5. **Readability, targets, names.** Metadata raised to the 12px floor; the definition disclosure is a 44×44 target with a decorative (`aria-hidden`) glyph so the visible text matches the accessible name; icon-only shell controls (search / notifications / approvals) hold a 44px target when their text is hidden on mobile; the brand mark left the sub-12px set.
6. **Pre-existing architecture regression fixed.** The 016 remediation left `src/pages/quarantine/inspections/index.astro` importing the inspection **domain** directly, which fails the `delivery-domain-import` boundary gate at HEAD. The value now comes from a new application-layer projection (`inspection-result-options.ts`), so the gate passes and the vocabulary keeps one source.

## 4. Verification (final candidate)

| Check | Command | Result |
|---|---|---|
| Typecheck | `pnpm typecheck` | **PASS** — 809 files, 0 errors, 0 warnings, 67 hints |
| Unit | `pnpm test:unit` | **PASS** — 84 files / **571** tests (with the shell's `QC_VERIFY_*_PASSWORD` secrets unset; that suite requires them absent and fails only when they are exported — environmental) |
| Architecture boundary | `pnpm test:architecture` | **PASS** (was **FAIL** at HEAD on the pre-existing domain import) |
| Migration integrity | `pnpm db:migrate:check` | **PASS** — 30 migrations |
| Build | `pnpm build` | **PASS** |
| Release identity / verify | `pnpm release:identity` + `release:verify` | **PASS** (`rel-f074cbc4a461182d`, `gitSha 0316f40…`, dirty tree expected — uncommitted) |
| Tech-debt register | `pnpm release:tech-debt:check` | **PASS** — 6 items |
| Focused integration (disposable PG 18.6) | `vitest run tests/integration/dashboard tests/integration/quarantine tests/integration/shared/audit-dashboard-parity.test.ts` | **PASS** — 14 files / 49 tests |
| New populated-DB rollup suite | `tests/integration/dashboard/dashboard-rollup.test.ts` | **PASS** — 6 tests (see §5) |
| Lint / format (changed files) | `eslint` / `prettier --check` | **PASS** — 0 eslint errors; formatting clean. Repo-wide `format:check` still reports the same **5 pre-existing** unformatted files, none of them touched here |
| Whitespace | `git diff --check` | **PASS** |
| Browser (authenticated, populated) | Chromium against the built server + disposable PG | **PASS** — see §5 |

## 5. Populated evidence (what the acceptance clause actually asks for)

**Integration (`dashboard-rollup.test.ts`, real rows in PostgreSQL 18.6):** two actors get *identical* HOLD / PASS / released rows. The suite asserts that (a) every KPI declares numerator/state/actorScope/window; (b) the "Pending review" counter equals the approvals queue length and the queue items appear in the decision list with `WARNING`; (c) `HOLD items = 2` and `Released items = 1` for the owner, with the other actor's identical rows excluded; (d) executing each KPI's own `href` query string against the same register returns exactly the displayed number; (e) the PASS counter equals the inspections register filtered by its own link; (f) the queue orders `CRITICAL` first with no cross-actor leakage; (g) a failing approvals provider rejects the read instead of returning `0`.

**Authenticated server render (built app, disposable DB, disposable identity `dashcheck`, session forged in the local disposable cluster only):**

| Page | Status | Cross-actor/populated result |
|---|---|---|
| `/dashboard` | 200 | KPIs render `HOLD items = 2`, `Released items = 1`, `Pending review = 0`, `Inspection PASS = 0`; decision queue lists the 2 HOLD items |
| `/quarantine/receiving?inspectionResult=HOLD&ownership=mine` | 200 | exactly **2** data rows (KPI value 2) + applied filter chips |
| `/quarantine/receiving?releaseState=RELEASED&ownership=mine` | 200 | exactly **1** data row (KPI value 1) + chips |
| `/quarantine/inspections?finalResult=PASS&ownership=mine` | 200 | honest empty state (KPI value 0) |

**Authenticated browser (1440 and 375 CSS px):** `Inter` body font; first heading `H1`; **0** sub-12px leaf nodes; only the inline breadcrumb link under 24px; **0** page-level horizontal overflow; **0** `.wasm`/lottie requests; **0** console errors. `/approvals`, `/account` and `/ai-advisory` also return 200, stay inside the app shell and have no overflow at 375px.

**Evidence handling:** the raw HTML/screenshots and the temporary session token stay outside the tracked tree under `.tmp/` (gitignored); the token file and the disposable session row were deleted after the run. No password, cookie value, provider key or credential-bearing URL is written into this report or any deliverable.

## 6. Unresolved / not verified

- **Deployment is not updated**, so none of this is live behaviour: no commit, push, deploy or Render migration was performed. Live `/reject-reports`, live parity and live re-audit of this scope stay open (owned by 001/002).
- **Authenticated container E2E (Docker/Testcontainers), exact-HEAD CI (billing-locked), AT/screen-reader and human UAT** remain **NOT VERIFIED / BLOCKED**; they are 004/006 scope, not this task's acceptance.
- **Single disposable identity, bootstrap-scale data.** The multi-role and cross-scope-supervisor behaviour of the new `ownership` filter is proven only at the integration/browser level above.
- **Quarantine overview KPIs** (`/quarantine`) also count `created_by = actor` and link to authorized-scope registers. The `ownership=mine` mechanism now exists, but that page was left untouched; its "Awaiting inspection" counter additionally spans two workflow states while its link carries one. Recorded as a residual, owned by the Quarantine domain (audit §8 row 1), not silently fixed.
- **`@lottiefiles/dotlottie-web`** is still declared in `package.json` with no source reference. Removing it needs a package-manager operation and is deliberately left as separate cleanup.

## 7. Downstream impact

- **017 (dashboard intelligence/real-data visualisation):** the read model now carries the explicit KPI contract and a single rollup to extend; no chart is drawn until an approved server series exists, and the empty/unavailable/not-supplied states are distinguished.
- **018 (humanised copy):** the queue and coverage wording changed here; 018 still owns the remaining eyebrow/copy vocabulary (e.g. uppercase nav group labels).
- **006 (cross-app accessibility):** the dashboard/registers are now at 0 sub-12px nodes and the flagged targets are ≥44px; the full axe/AT matrix is still 006's.
- **007 (performance):** removing the Lottie layer removed ~2.4 MB of discarded transfer per authenticated page (measured in the 016 audit); no new performance claim is made here.
