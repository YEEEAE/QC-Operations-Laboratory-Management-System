# SOP-FRS-013 / SOP-FRS-014 — Implementation Register (local)

Tracking matrix for the 29 proposals `IMP-013-01..15` (SOP-FRS-013) and
`UX-014-01..14` (SOP-FRS-014). This register connects each item to the change
that implements it and to the verification that was actually run. Overlapping
items were delivered in one implementation.

## Status and boundary

- SOP-FRS-013 and SOP-FRS-014 were approved by the named owner (yazeed) on 2026-10-09 and moved
  to `SOPs/approved/` (see `SOPs/approved/APPROVAL-REGISTER.md`). The effective date remains
  **NOT ASSIGNED** and no in-application signature or registration is asserted.
- The application work described here is **implemented locally in the working tree only**.
  This register records implementation of the *proposals*; it does **not** make them controlled,
  effective or verified, and it makes no compliance, UAT or release claim.
- No permission, migration, policy or controlled document was changed. No commit, push or
  deploy was performed by this task.
- Source screenshots and the SOP drafts remain preserved under
  `SOP-FRS-013-attachments/` and `SOP-FRS-014-attachments/`; the approved SOP files are in
  `SOPs/approved/`.

## Baseline

- Branch `main`, working tree carried pre-existing uncommitted work with a large
  scope of UI/register changes; implementation baseline HEAD `2e8ca5e0`.
- Node `24.20.0` / pnpm `11.25.0` (project contract `>=24.20.0 <25`).
- Baseline unit suite at HEAD (clean checkout): **25 failed / 1376 total**; the
  failures are pre-existing and outside this task (restructured `Documents/`
  markdown, requirements reconciliation matrix, UAT validator, route-acceptance
  inventory, environment-parity guard, two UI copy contracts).

## Evidence legend

| Mark | Meaning |
| --- | --- |
| PASS | focused test or check executed on the final working tree and green |
| BLOCKED | a required dependency (Docker/PostgreSQL 18, authenticated browser, AT) was unavailable |
| NOT VERIFIED | static/unit guard exists, but the live behaviour was not executed |

## Part A — SOP-FRS-013 `IMP-013-01..15`

| ID | Item | Status | Change (key files) | Verification |
| --- | --- | --- | --- | --- |
| IMP-013-01 | Dashboard density | IMPLEMENTED | `src/ui/components/dashboard/DashboardCounts.astro` groups the eleven counts by domain; coverage moved into `<details class="panel coverage">`; page uses `PageHeader` | `dashboard-decision-surface.test.ts` PASS; `universal-shell.test.ts` PASS |
| IMP-013-02 | Empty-state economy | IMPLEMENTED | `DashboardCounts.astro` renders a compact zero strip (`confirmedEmpty`) and expands to full cards only when a source is non-zero/unavailable | `dashboard-decision-surface.test.ts` PASS |
| IMP-013-03 | Filter progressive disclosure | IMPLEMENTED | `src/ui/client/register-preferences.ts` moves filters past the third behind `More filters`, adds applied-filter chips, `Clear all filters`, and account-local presets; `global.css` styles | `register-preferences.test.ts` PASS |
| IMP-013-04 | Register pagination | IMPLEMENTED | `executePage()` + `listPage()` added across registers (equipment, calibration, maintenance, change-requests, documents, NCR, RCA, CAPA, findings, receiving, inspections, templates, users, backups); `src/shared/pagination/page.ts` bounds page/size (default 25, max 100) | `bounded-register-use-cases.test.ts` PASS; `register-surface-contract.test.ts` PASS; integration `bounded-registers.test.ts` **BLOCKED** (no Docker) |
| IMP-013-05 | Policy-blocker component | IMPLEMENTED | `src/ui/components/feedback/PolicyBlocker.astro`; used in `quality/findings`, `quality/ncr`, `quality/rca`, `quality/capa` with decision ID/owner/consequence | UI contract suites PASS |
| IMP-013-06 | Reject reports zero state | IMPLEMENTED | `reject-reports/index.astro` collapses analytics into `<details>` with a `No matching data` summary when empty | `register-surface-contract.test.ts` PASS |
| IMP-013-07 | Approval clarity | IMPLEMENTED | `approvals/index.astro` computes a per-item `decisionStatus` badge + reason (available / policy-blocked / version changed / review-only) | `approval-decision-capability-contract.test.ts` PASS |
| IMP-013-08 | Help wayfinding | IMPLEMENTED | `src/shared/copy/help-sections.ts` + `help/index.astro` add section index and GET search over displayed copy | `help-search.test.ts` PASS |
| IMP-013-09 | Command palette | IMPLEMENTED | `src/ui/shell/CommandPalette.astro` + `AppLayout.astro`; Ctrl/Cmd+K palette lists authorized pages, authorized create actions, recent records, and links to search | `universal-shell.test.ts` PASS (trigger); e2e `navigation-help.spec.ts` NOT VERIFIED (no authenticated browser) |
| IMP-013-10 | Navigation memory | IMPLEMENTED | `src/ui/client/navigation-preferences.ts` persists collapsed state + expanded sections per account; in-navigation filter in `Sidebar.astro` | `navigation-preferences.test.ts` PASS |
| IMP-013-11 | Design-token adoption | PARTIAL | `tokens.css` rounded-radius/type scale aligned; `CommandPalette` uses a new `--surface-overlay` token; raw-colour floor retained | `visual-token-contract.test.ts` token check PASS; design-governance ratchet PASS (floor unchanged) |
| IMP-013-12 | Restrained motion | IMPLEMENTED | `src/ui/styles/motion.css` dialog/feedback enter transitions using transform+opacity, inside `prefers-reduced-motion: no-preference` | `universal-shell.test.ts` reduced-motion assertions PASS |
| IMP-013-13 | Responsive tables | IMPLEMENTED | `register-preferences.ts` annotates register tables; `global.css` `@media(max-width:760px)` card-collapse keeps caption/row labels | static/unit PASS; live responsive matrix NOT VERIFIED |
| IMP-013-14 | Visual direction | PARTIAL | Applied shared tokens/components (calmer headers, radius, spacing); every Stitch-invented label/content discarded | browser visual acceptance NOT VERIFIED |
| IMP-013-15 | Accessibility closure | BLOCKED | Static/unit guards for landmarks/focus/reduced-motion/forced-colors present | authenticated keyboard/AT/responsive matrix NOT VERIFIED |

## Part B — SOP-FRS-014 `UX-014-01..14`

| ID | Item | Status | Change (key files) | Verification |
| --- | --- | --- | --- | --- |
| UX-014-01 | Page-anatomy consistency | IMPLEMENTED | `src/ui/components/PageHeader.astro` adopted in 63 pages (kicker from approved navigation vocabulary, single H1, optional purpose, primary action slot) | `register-surface-contract.test.ts` PASS; `universal-shell.test.ts` PASS |
| UX-014-02 | Loading-state continuity | IMPLEMENTED | Registers are server-rendered settled state; `register-preferences.ts` adds `aria-busy` + one status message on submit only (not per filter) | `register-preferences.test.ts` PASS; layout-shift NOT VERIFIED |
| UX-014-03 | Empty vs filtered-empty vocabulary | IMPLEMENTED | `EmptyTableState.astro` defaults to `noRecords` vs `noFilterMatches` with the matching action | UI contract PASS |
| UX-014-04 | Filter-bar progressive disclosure | IMPLEMENTED | Same change as IMP-013-03 | `register-preferences.test.ts` PASS |
| UX-014-05 | Bounded registers + true totals | IMPLEMENTED | Same change as IMP-013-04; `DataTable.astro` publishes an explicit declared total (`total`/`Total unavailable`) | unit PASS; integration **BLOCKED** (no Docker) |
| UX-014-06 | Unified policy-blocker card | IMPLEMENTED | Same component as IMP-013-05 | UI contract PASS |
| UX-014-07 | Primary-action label consistency | IMPLEMENTED | Canonical labels unified: receiving `Create receiving item`, equipment `Add equipment`, documents `Create document`, laboratory `Create laboratory test` (header, empty state and dashboard start action) | `dashboard-start-action.test.ts` PASS |
| UX-014-08 | Sticky record header + index | IMPLEMENTED | `RecordHeader.astro` rendered through `JourneyContextPanel.astro`; builds a section index when ≥3 H2s; sticky styling in `global.css` | journey wiring PASS (two pre-existing copy assertions remain out of scope) |
| UX-014-09 | Classified feedback & refusal region | IMPLEMENTED | `enhance-with-classification.ts` preserves values, links field errors, distinguishes validation/stale/duplicate/authorization/dependency, offers Refresh record | `mutation-safety-contract.test.ts` classification PASS |
| UX-014-10 | Caption & row-identity coverage | IMPLEMENTED | `DataTable.astro` region/caption + row identity; `register-surface-contract.test.ts` enforces coverage as a ratchet | `register-surface-contract.test.ts` PASS |
| UX-014-11 | Responsive register collapse | IMPLEMENTED | Same change as IMP-013-13 | static/unit PASS; live matrix NOT VERIFIED |
| UX-014-12 | First-run guidance for empty system | IMPLEMENTED | `src/ui/components/dashboard/start-action.ts` offers an authorized first action only for a confirmed empty snapshot and canonical `PERM-QUAR-CREATE` | `dashboard-start-action.test.ts` PASS |
| UX-014-13 | Navigation memory + in-nav filter | IMPLEMENTED | Same change as IMP-013-10 | `navigation-preferences.test.ts` PASS |
| UX-014-14 | Authenticated accessibility closure | BLOCKED | Static/unit guards exist | authenticated keyboard/screen-reader/responsive matrix NOT VERIFIED |

## Verification summary (final working tree)

- `pnpm typecheck` (`astro check`): **0 errors, 0 warnings** (115 hints).
- `pnpm test:architecture`: **PASS** (delivery boundary + canonical route registry).
- Full unit suite: **1385 passed / 25 failed (1410)**. All 29-item tests are green; the
  25 failures are the pre-existing, out-of-scope set captured at baseline (this task
  additionally fixed one pre-existing failure, the release verification-evidence gate).
- Focused task suites green: `tests/unit/ui/*`, `tests/unit/registers/*`,
  `tests/unit/dashboard/*`.
- Integration `tests/integration/registers/bounded-registers.test.ts`: **BLOCKED**
  (Testcontainers could not start; Docker unavailable) — 0 executed, 16 skipped.
- Browser/E2E (`tests/e2e/navigation-help.spec.ts`), 320/375/414/768/1024/1440,
  200% zoom, text-spacing, keyboard/AT and reduced-motion live matrices: **NOT VERIFIED**
  (no authenticated disposable fixture / browser session available this run).

## Notes

- Nothing here records effectivity or in-application registration, and no compliance or
  release claim is made.
- Decision owner and policy links shown by the policy-blocker come from domain-owner
  data already in the product; where a source does not supply an owner/link the UI says
  so instead of inventing authority.
- The two remaining `record-journey-contract` failures and the
  `visual-token-contract` DESIGN-SYSTEM.md failure are pre-existing and predate this
  task (their referenced documents were removed in an earlier `Documents/` restructure).
