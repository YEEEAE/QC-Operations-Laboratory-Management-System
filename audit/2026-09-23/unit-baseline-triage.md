# Unit baseline triage — 2026-09-23

## Baseline identity

- SHA: `d0dc705f278a574b3f8f5e822c216fb01b61a9bd`
- Working-tree/source fingerprint: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (clean diff)
- Toolchain: Node `v24.20.0`, pnpm `11.25.0`
- Verification run: `a52837a1-f764-493b-9daa-d38234fccb2c`
- Baseline unit: 977 total, 953 passed, 24 failed, 0 skipped; 131 files, 16 failed files.

## Item-by-item classification

| # | Failing test | Classification | Root cause and resolution |
|---:|---|---|---|
| 1 | `scientific result boundary on approval … stage-1 approval stores only the server-side evaluated result` | Stale test fixture | Fixture used Manager, now final-stage only; stage-1 test actor now Supervisor. |
| 2 | `controlled policy fail-closed defaults … lab approval proceeds only with an explicitly supplied approval policy` | Stale test fixture | Same superseded Manager stage-1 fixture; the denial case remains Manager and unchanged. |
| 3 | `quantity and unit contract … separates a legacy "250 PCS" value into a number and a unit` | Stale assertion | `PCS` is already canonical, so the parser correctly returns `VALID`; alias cases still assert `NORMALIZABLE`. |
| 4 | `register filter parser … reports unsupported parameters and values instead of ignoring them` | Implementation defect | Unknown parameters were appended before invalid values regardless of query order; rejection details now preserve URL parameter order. |
| 5 | `environment parity guard … keeps schema identity aligned with the documented migration head` | Stale documentation | `EXTENDING-THE-SYSTEM.md` ended at migration 0037 while source is 0038; the documented head is corrected. |
| 6 | `authorization visibility presentation contract … makes laboratory next-workspace and retest policy states truthful` | Stale assertion | Expected an earlier phrase; assertion now checks the current explicit submission-permission notice. |
| 7 | `dashboard decision surface … links personal counters to the ownership filter their registers implement` | Stale source contract | Receiving now delegates query parsing to `parseReceivingFilters`; inspections retain inline parsing. Assertions now verify both current server-side paths. |
| 8 | `dashboard decision surface … keeps the disclosure glyph decorative so the visible label matches its name` | Stale source contract | Search was removed in the navigation rebuild; the current named navigation toggle is checked. |
| 9 | `dashboard decision surface … keeps the icon-only shell controls at the 44px target size` | Stale source contract | Former search/notification links no longer exist; the current 44×44 navigation toggle is checked. |
| 10 | `design tokens — typography floor … renders no shared-component type below the 12px floor` | Implementation defect | Sidebar current-page marker was 10px and utility heading 0.7rem; both now meet the 12px floor. |
| 11 | `design tokens — typography floor … keeps the remaining page-level type-floor debt inside the recorded ceiling` | Implementation defect | Six declarations on the affected laboratory/inspection/receiving pages were below 12px; they now meet the existing ceiling without changing it. |
| 12 | `design token contract … never renders a false zero badge for unavailable counts` | Stale source contract | The rebuilt topbar no longer renders either count; the test now verifies neither can appear in rendered markup. |
| 13 | `regulated form UX contracts … links inspection notes and return reasons to their labels` | Stale assertion | Execution action is now `Save results`, and the submit marker is on the button with reordered attributes; the label/submit contract remains asserted. |
| 14 | `BI-01 mobile drawer background isolation … moves focus to the first drawer destination on open` | Stale source contract | Focus selection moved into `firstDrawerLink()`/`drawerFocusables()`; assertion follows the current `element.matches('a[href]')` path. |
| 15 | `BI-01 mobile drawer background isolation … exposes a visible mobile dismiss action that returns focus to the opener` | Stale source contract | CSS is now in the mobile media block and spaced; assertion scopes the 44px close control to that breakpoint. |
| 16 | `privacy notice copy contracts … explains actual AI processing, disabled state, and the limit of pasted-source checks` | Stale assertion | Copy now says it cannot verify the supplied source; the test checks the current equivalent disclosure. |
| 17 | `quarantine decision surface … keeps a time-window filter comparable between the counter and the register` | Stale source contract | Register delegates parsing and applies `...filters`; assertions now check parser delegation and shared UTC date resolution. |
| 18 | `record journey linkage contract … renders the NCR detail page with real reads and related finding/CAPA linkages` | Stale architecture contract | Direct Postgres imports were removed from the page; the test now verifies both application dependency factories and no infrastructure import. |
| 19 | `record journey linkage contract … keeps the CAPA page read-only toward NCR state and links the source NCR` | Stale architecture contract | The owning CAPA dependency resolves related NCRs; the test now verifies that boundary and its read-only statement. |
| 20 | `F-03 reflow guards … mirrors the sidebar active indicator for RTL and collapses the drawer grid` | Stale source contract | Navigation selector changed from `.nav-group a.active` to `.nav-link.active`; the wrapping assertion follows the current fluid link style. |
| 21 | `register surfaces … gives every table a programmatic caption` | Implementation defect | Laboratory execute and review tables lacked captions; captions now identify each table and test record. |
| 22 | `register surfaces … keeps a stable row identity on every record register` | Implementation defect | Laboratory review rows lacked a row header; sample identifiers now use `<th scope="row">`. |
| 23 | `WCAG 2.2 AA accessibility contracts … requires accessible names and state for icon-only controls` | Stale source contract | Old search-label assertions targeted a removed control; current navigation toggle name/state are checked. |
| 24 | `WCAG 2.2 AA accessibility contracts … keeps status meaning in text rather than color alone` | Stale selector | Sidebar state now uses `.nav-link.active` and spaced CSS declarations; the current underline/state contract is checked. |

No test or assertion was deleted or weakened. PostgreSQL-backed integration and E2E were not run: Docker is unavailable (`~/.docker/run/docker.sock` is absent); those checks are `BLOCKED` pending an appropriate disposable PostgreSQL/browser environment.

## Final verification

Final same-state verification is recorded below after the documented files were included in the candidate fingerprint.

- Candidate SHA: `d0dc705f278a574b3f8f5e822c216fb01b61a9bd`
- Candidate source fingerprint is recorded in the final `.ci-results/run-context.json` for verification run `9d8cb827-63f1-4fc9-8087-2844e63aecf4`.
- Runtime: Node `v24.20.0`, pnpm `11.25.0`
- Typecheck: PASS — 956 files, 0 errors, 0 warnings, 88 hints.
- Lint: PASS — exit 0.
- Architecture: PASS — delivery/database/business-rule boundary and route registry checks.
- Unit: PASS — 977 total, 977 passed, 0 failed, 0 skipped across 131 files.
- Requirements reconciliation: PASS — 80 mapped domains (100 requirements, 34 risks, 20 gaps, 33 decisions, 5 assumptions).
- Release parity: PASS — 7 checks, 0 failed.
- Build: PASS. This is build evidence only and does not establish release readiness.
- PostgreSQL integration / E2E: BLOCKED — Docker daemon socket unavailable; no external database was used.
