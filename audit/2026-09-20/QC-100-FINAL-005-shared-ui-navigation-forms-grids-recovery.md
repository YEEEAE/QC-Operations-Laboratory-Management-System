# QC-100-FINAL-005 — Shared UI, navigation, forms, grids and recovery states

**Phase:** QC-100-FINAL-005 (`Finish shared UI, navigation, forms, grids and recovery states`)
**Primary domain ownership:** 6, 20, 65, 66, 67, 68, 69, 70
**Finding references:** QC-FINAL012-F-010 (dashboard shared UI/semantics family), QC-FINAL012-F-016 (reference/import/bulk/localization evidence; domain 70 retention)
**Executed:** 2026-09-19 (host local time 2026-09-20 +03) — local only, no commit / push / deploy / production migration.

---

## 1. Identity of the verified state

| Field | Value |
| --- | --- |
| Base HEAD (frozen candidate) | `ca71a76b76ff680639c59ccb1ccee295ebe29a32` (`main`, clean at start) |
| Working tree after work | dirty — 17 modified source files + 3 new test files + 2 Mind files |
| Content-based dirty fingerprint (final tree, including this record and the Mind files) | `290c516ea69ca2a6fcd6707e4edf9eba33efb5e28fa624366fe13a7310e3cbc2` (SHA-256 over `git status --porcelain` + `git hash-object` of every changed/added file) |
| Code-only fingerprint at the moment the verification commands below ran | `d9168d26027df8d6fd002417b1cb7633aa86a8f2345f982c3984d7f4716fb757` (17 modified source files + 3 new test files; no test or source file changed after that) |
| Release identity (rebuilt) | `rel-74de185e8422a902`, buildId `local-ca71a76b76ff`, applicationVersion `0.1.0`, `release:verify` → `verified: true` |
| Migration head | `0031_qc_creation_parity_two_stage_approval` (checksum `44b160a6b8c0…`) — unchanged by this phase |
| Runtime | Node `v22.22.3` (outside the declared `>=24.20.0 <25` contract), pnpm `11.25.0` |
| Database for integration evidence | disposable PostgreSQL 18.6 cluster (`scripts/db/disposable-postgres.sh`, `127.0.0.1:55432`, TLS verify-full) |

Evidence timestamps: implementation + first verification pass `2026-09-19T22:35Z`–`2026-09-19T22:52Z`; identity block captured `2026-09-19T22:51Z`.

---

## 2. Item-by-item record

### Item 1 — Inventory all routes against shell / navigation / forms / tables / dialogs; close gaps
**State: DONE (candidate-side). Evidence: PASS.**

- New executable inventory contract: `tests/unit/ui/register-surface-contract.test.ts` (9 tests). It walks every page file (`src/pages/**/*.astro`) and asserts:
  - every operational page renders through `AppLayout`/`AuthLayout`; the four exceptions are explicit and justified (`index` and `laboratory/index` are server redirects, `404`/`500` are public error surfaces);
  - no native `confirm()`/`alert()`/`prompt()` on any page or shared UI file;
  - every table page carries a programmatic `<caption>`, and every record register carries a stable row identity (`scope="row"`), with three justified exemptions recorded per row;
  - the filter-chip surface list, the bounded-register list and the unbounded-register list are exact, so any drift fails.
- Measured inventory on this candidate: 85 page files (81 in the shared shell), 30 pages rendering tables (30/30 with captions), 18 register surfaces, 3 bounded registers.
- Real gap closed as part of the inventory: `/audit` rendered a dependency failure as `0 events` (see item 3); the shared `FilterBar` was dead code (0 consumers) and is now used by the register family.

### Item 2 — Verify POST baseline, validation, retained values, redirects, duplicate submission, permission change, stale version, dependency outage, safe unknown
**State: PARTIAL. Evidence: PASS for the verified invariants; FAIL recorded for one verified gap (JS-only control surfaces).**

Verified and now regression-protected (`tests/unit/ui/mutation-safety-contract.test.ts`, 10 tests):

| Behaviour | Evidence |
| --- | --- |
| Six failure classes stay distinguishable | `classifyActionResult` assertions: `AUTHZ_* → AUTHORIZATION_CHANGED`, `CONFLICT_STALE_VERSION → CONFLICT_STALE`, `CONFLICT_DUPLICATE_COMMAND → DUPLICATE_COMMAND`, `SYSTEM_DATABASE_UNAVAILABLE`/`RESOURCE_NOT_FOUND → DEPENDENCY_UNAVAILABLE`, `VALIDATION_FAILED → VALIDATION_ERROR`, unknown → `UNKNOWN_SAFE_ERROR`; the five distinct classes are asserted to be five distinct values, never collapsed |
| No auto-retry of a stale mutation | shared contract has no timers and exactly one `invoke(` call site; no page schedules a mutation from `setInterval`; the stale dialog refreshes through `window.location.reload()` only; the stale copy states “Nothing was resubmitted” |
| Duplicate submission blocked | `mutationEnhanced` re-entry guard + `aria-busy` guard + submit disabled while in flight (existing contract, now asserted) |
| No-JS POST baseline | every page calling `Astro.callAction` contains `method="post"` and an `Astro.request.method` gate (10/10); retained values, `FormErrorSummary` linkage and 303 redirects covered by the existing `mutation-post` suite |
| Safe unknown errors | no page/UI file leaks stack/SQL/DSN; `UNKNOWN_SAFE_ERROR` copy is the fallback |

**Verified gap (FAIL, recorded as a ratchet — not hidden):** nine control surfaces render mutation controls that exist only through JavaScript: no form POST baseline and no Astro action form. They are listed exactly in `NO_JS_BASELINE_OPEN` and asserted by test, so the list can only shrink:

`quarantine/receiving/[receivingId]` (no `<form>` at all around the controlled transition buttons), `quality/capa/[capaId]`, `laboratory/tests/[labTestId]/{execute,review}`, `change-requests/[changeRequestId]/review`, `documents/[documentId]/versions/new`, `documents/[documentId]/versions/[versionId]/index`, `admin/roles/[roleId]`, `reject-reports/daily/[reportId]`.

Owner: phase 005-B, verified through 003/006. Each needs a real POST baseline, retained values and a no-JS safe summary — the same dual-path pattern already used by the nine Tier-2 create forms.

Also verified and fixed: `change-requests/[changeRequestId]/review.astro` looked up `[data-result]` while rendering no such element, so every progress and failure message was silently dropped for a controlled decision; each decision form now owns a `role="status"` region.

### Item 3 — Consistent bounded tables, filter chips, stable identity, accessible confirmations, state separation
**State: PARTIAL. Evidence: PASS where implemented; the remaining work is enumerated with owners.**

Implemented:

- **Shared register surface adopted (one family + two registers):** `assets/equipment`, `assets/calibrations`, `assets/maintenance`, plus `tasks` and `change-requests` now use `FilterBar` (GET baseline, `role="search"`, clear link, 12px labels, 44px targets), `AppliedFilters` filter chips, `EmptyTableState`, and `Pagination` (`/tasks`). Each register now separates *truly empty* from *filtered empty* with distinct copy and a clear-filters action.
- **UNAVAILABLE vs EMPTY vs AUTHZ:** `/audit` no longer converts any read failure into `0 events`; it distinguishes an authorization denial (exists-leakage protection: the neutral “no events” state is preserved) from a dependency outage (`ProviderUnavailableState`, no count). `/tasks` and `/change-requests` previously collapsed failures to an empty list (`.catch(() => [])` / unguarded `await`) and now render UNAVAILABLE with no count.
- **Accessible confirmations:** the shared `ConfirmDialog` + `client/dialog.ts` contract (focus trap, focus return, Escape blocked mid-submission, pending state, inline error, explicit stale refresh) is asserted intact. `reject-reports/daily/[reportId]` still uses bare submit for `Finalize`/`Void` → recorded below.

Open, with owner and exact next action:

| Gap | Evidence | Owner / next action |
| --- | --- | --- |
| 15 registers unbounded (read returns every authorized row; 3 are bounded: `/tasks`, `/audit`, `/reject-reports`) | `register-surface-contract` asserts the exact bounded/unbounded sets | 005-B: push the actor scope predicate into SQL per register (they currently authorize per row after fetch), then add `page`/`offset` + count; prove equivalence with 010/006 |
| Confirm ceremony for destructive/controlled actions on `reject-reports/daily` (`Finalize`, `Void`) and `reject-reports` issue-slip VOID | source: bare `data-submit`/`data-void-form` without `ConfirmDialog` | 005-B: adopt `ConfirmDialog` + `bindDialogMutation` with consequence-specific copy |
| Server-side sorting/`SortHeader` | no register accepts a sort parameter; `SortHeader` has 0 consumers | 005-B with each domain owner (allowlisted sort columns only) |
| `reject-reports/daily` add-entry has no in-flight duplicate guard | `PENDING_GUARD_OPEN` ratchet | 005-B with 010 |

### Item 4 — Visual-token regressions, type/hierarchy/target sizes, shell/sidebar, print, small-screen reflow
**State: DONE (candidate-side, static + render build). Evidence: PASS.**

- Fixed shared-layer regressions against the approved tokens: `FilterBar` label 11px → `--font-size-xs` (12px floor) with 44px controls; `EmptyTableState` 12px floor + 44px action; `ErrorState` `small` 11px → token and 44px recovery link; `ESignatureDialog` note 11px → token; `Chart` accessible data table 11px → token; `HandoffTimeline`/`JourneyContextPanel` eyebrow/label 11.2px → token; `#fff` on register buttons → `--color-text-inverse`.
- New enforcement: `tests/unit/ui/design-governance-contract.test.ts` (11 tests) fails any shared-UI type below the 12px floor, any physical direction property (`margin/padding/border-left|right`, `text-align:left|right`, bare `left:`/`right:`) in pages or shared UI, any raw hex in UI chrome, and any growth of the page-level type-floor debt (measured ceiling: 71 occurrences / 51 files — recorded as debt, not as completion). The eight pages this phase touched must be at zero and are asserted so.
- Reflow/small-screen: the register family keeps the existing responsive contract (`overflow-x: auto` table wrappers, `@media(max-width:…)` grid collapse); `pnpm build` and the static accessibility/reflow contracts pass. **NOT RUN:** authenticated desktop/mobile rendering and print verification in a browser (no container runtime / authenticated runner).
- No CSP widening and no Lottie reintroduction: this phase touched CSS/class-level markup only; the Lottie drop decision and the CSP contract tests are unchanged and still pass.

### Item 5 — Domain 70 in the register: Arabic / RTL / localized dates only if approved
**State: PARTIAL — applicability decision consumed (not manufactured); approved-scope foundations implemented. Evidence: PASS for foundations; Arabic content NOT IMPLEMENTED (external).**

- **Authoritative applicability decision (existing, from 013):** `audit/100-percent/POLICY-CLOSURE-MATRIX.md` line 184 — domain 70 of the 100-domain register is **Security UX**, its applicability stands (runtime denial/enumeration evidence pending) and it is **not** a localization domain; Arabic/RTL is a *separate approved capability requirement* (`UI-UX-SPECIFICATION §42`, `DESIGN-SYSTEM §16`, `PRODUCTION-READINESS-CHECKLIST §31`, `UAT-ACCEPTANCE-PLAN §57`) and is **not implemented** (English-only, `lang="en"`, LTR). The ID is retained; no `N/A` and no manufactured credit.
- Consumed, not re-decided. This phase implemented only what that decision leaves in scope:
  - direction-safe layout: logical properties enforced estate-wide; the single violation found (`reject-reports/index.astro` `.rank{padding-left}`) fixed;
  - direction-aware typography: `--font-arabic` + `[dir='rtl'] → --font-sans` mapping asserted, and the tooltip anchor mirroring asserted;
  - localized display: one approved formatter (`src/shared/copy/format.ts`, `en-GB` + `Asia/Riyadh`, unambiguous `18 Sep 2026, 18:43`) is now used by the registers this phase touched, with the 20 remaining ad-hoc `toLocale*` pages recorded as a shrinking ratchet.
- Handoff: Arabic content/translation to **018**; mirrored keyboard/reflow verification to **006**. Human UAT and security-UX runtime denial evidence remain external.

### Item 6 — Behaviour regressions + authenticated cross-route desktop/mobile checks with populated records, failure states, multiple roles
**State: PARTIAL. Evidence: PASS for the automated regression layer; NOT RUN / BLOCKED for authenticated browser.**

- Added 30 behaviour regressions across three suites (inventory, design governance, mutation safety); the existing tier-2 POST-baseline, form-UX, shell, WCAG-22, reflow-320 and visual-contrast contracts still pass unchanged.
- **BLOCKED/NOT RUN:** authenticated cross-route desktop/mobile runs with populated records, injected failure states and multiple roles require the container-backed runner or an approved staging environment (`scripts/verification/run-authenticated-e2e.ts`), which this host cannot start (no container runtime; no approved staging). Consumer: 003/004.

---

## 3. Command evidence (all on the frozen candidate + working tree above)

| Command | Result |
| --- | --- |
| `pnpm typecheck` (`astro check`) | **PASS** — 851 files, 0 errors, 0 warnings, 74 hints |
| `pnpm test:unit` | **PASS** — 96 files / 707 tests (was 96 files / 677; +30 new) |
| `pnpm test:unit tests/unit/ui` (re-run on the final tree) | **PASS** — 26 files / 255 tests |
| `pnpm test:integration` (disposable PG 18.6, TLS verify-full) | **PASS** — 98 files / 442 tests, 0 skips |
| `pnpm test:architecture` | **PASS** — boundary + canonical route-file/registry integrity |
| `pnpm build` | **PASS** (existing large-chunk warning only) |
| `pnpm release:identity` + `pnpm release:verify` | **PASS** — `rel-74de185e8422a902`, `verified: true` |
| `npx eslint .` | **PASS** — 0 errors |
| `npx prettier --check .` | **PASS** — all matched files |
| New suites in isolation | **PASS** — 30/30 (`register-surface` 9, `design-governance` 11, `mutation-safety` 10) |
| Authenticated browser E2E / UAT / CI / production | **NOT RUN / BLOCKED** (no container runtime or approved staging; CI billing lock) |

---

## 4. Changed paths

| Path | Item | Change |
| --- | --- | --- |
| `src/ui/components/data/FilterBar.astro` | 4 | 12px labels, 44px targets, `role="search"`, clear-filters link, GET baseline preserved |
| `src/ui/components/data/EmptyTableState.astro` | 3, 4 | status region, 12px floor, 44px action, explicit filtered-empty contract |
| `src/ui/components/data/Pagination.astro` | 3 | counted total, 44px targets, tokenized type, `aria-live` preserved |
| `src/ui/components/feedback/ErrorState.astro` | 4 | 11px recovery text → token, 44px recovery link |
| `src/ui/charts/Chart.astro` | 4 | accessible data table 11px → token |
| `src/ui/components/governance/ESignatureDialog.astro` | 4 | note 11px → token |
| `src/ui/components/workflow/HandoffTimeline.astro` | 4 | eyebrow 11.2px → token |
| `src/ui/components/workflow/JourneyContextPanel.astro` | 4 | eyebrow/label 11.2px → token |
| `src/pages/audit.astro` | 2, 3, 4 | UNAVAILABLE ≠ EMPTY ≠ AUTHZ-denial; no false zero; tokenized type and 44px targets |
| `src/pages/tasks/index.astro` | 2, 3 | guarded read + UNAVAILABLE, shared `Pagination`, `formatDate`, tokens |
| `src/pages/change-requests/index.astro` | 2, 3, 4 | guarded read + UNAVAILABLE, empty vs filtered-empty, `formatDate`, tokens |
| `src/pages/change-requests/[changeRequestId]/review.astro` | 2, 4 | per-form `role="status"` region (was silently dropped), token/logical fixes |
| `src/pages/assets/equipment/index.astro` | 1, 3, 4 | shared register surface, empty vs filtered-empty, tokens |
| `src/pages/assets/calibrations/index.astro` | 1, 3, 4 | shared register surface, `formatDate`, chips, tokens |
| `src/pages/assets/maintenance/index.astro` | 1, 3, 4 | shared register surface, `formatDate`, chips, tokens |
| `src/pages/reject-reports/index.astro` | 4 | logical property fix (`padding-left` → `padding-inline-start`) |
| `src/pages/admin/index.astro` | 4 | eyebrow 11.2px → token |
| `tests/unit/ui/register-surface-contract.test.ts` | 1, 3 | new route/register inventory with ratchets |
| `tests/unit/ui/design-governance-contract.test.ts` | 4, 5 | new token/RTL/date governance contract with ratchets |
| `tests/unit/ui/mutation-safety-contract.test.ts` | 2 | new no-auto-retry / duplicate / no-JS baseline registry |

No server authorization, policy, contract, migration or schema change. No secrets in any artifact (no credential values were read into this record).

---

## 5. Open dependencies and handoffs

| Consumer | What to take from this record |
| --- | --- |
| final audit 012 (+012-B/-C) | items 1/4/5 evidenced; items 2/3 partial with exact ratchet lists; domain 70 applicability decision consumed, no credit claimed; authenticated browser/UAT/CI still external |
| 017 / 018 | register-surface and copy contracts; the 20-page ad-hoc date list and the localization handoff |
| 006 | mirrored keyboard/reflow verification for RTL foundations; authenticated accessibility matrix |
| 003 / 004 | authenticated cross-route desktop/mobile runs with populated records and multiple roles |
| 010 | scope-predicate-in-SQL review before any register is bounded; duplicate-guard gap on `reject-reports/daily` |

**Next phase:** 005-B — implement the recorded gaps in this order: (1) POST baseline for the nine JS-only control surfaces, (2) `ConfirmDialog` ceremony for `Finalize`/`Void`, (3) scope-predicate-in-SQL + bounding for the 15 unbounded registers, (4) server-side sorting, (5) migrate the remaining ad-hoc date pages and the sub-floor page type debt. Required inputs: 010 review for the authorization change, 003/006 for verification, 018 for copy-sensitive surfaces.

`PASS ≠ RELEASED`. Production gates remain 0/19; no deployment, no production migration, no CI, no human UAT.
