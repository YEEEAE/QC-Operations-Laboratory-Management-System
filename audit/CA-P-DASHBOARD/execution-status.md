# CA-P-DASHBOARD — local graphite overview

**State: PARTIAL (latest follow-up 2026-10-22).** Local presentation implemented; not full route/workflow,
WCAG, UAT or release acceptance. Candidate HEAD at comparison:
`710453e55d00f0f931d3238bb93b167dfef27cf8` plus this working tree.
No commit, push, deployment, production connection, migration, API, schema,
authorization or business-rule changes.

## Scope and visual decision

Only `src/pages/dashboard/index.astro` product source changed, in CSS. The
frontmatter and rendered markup are character-identical to HEAD after removing
style blocks (`compare.mjs`). `Sidebar.astro` is byte-identical, SHA-256
`973afdc935c684880b4a6f07a0f341270347fc3a1e43ecd20389e9dad6aeb818`.
Existing data values, dynamic navigation, href/query filters, attention, coverage,
flow and chart/table contracts are retained. No invented count, record, SLA,
trend, approval or release claim was inserted.

Visually inspected `audit/CA-00/reference/capa-a.png` before editing, plus CA-01
reference extraction. Adopted its graphite panels, restrained borders, 12px card
geometry and blue focus/actions through existing tokens. This reference is a
CAPA decision card, **not** an approved dashboard layout. Responsive dashboard
composition is derived: shrink-safe grids, consistent panel gaps, 44px links and
summaries, and flow/chart visual order matching DOM. The reference's empty rail,
copy, external font/CDN and unsupported workflow claims were not copied.

## Source and guards reviewed

- Dashboard page; `AppLayout`, `PageHeader`, `DashboardCounts`, `start-action`,
  `KpiCard`, `StatusBadge`, `ProviderUnavailableState`, `Chart`.
- Dashboard `dependencies`, `get-dashboard`, `dashboard-empty`,
  `dashboard-presentation`, `dashboard-sources`, `dashboard-attention`,
  `dashboard-series`, `postgres-dashboard-query`; `AppError`, format, navigation.
- Nested shell: `BaseLayout`, Topbar, UserMenu, CommandPalette; navigation
  preferences, dialog and scroll-region clients; register preferences enhancer.
  Dashboard has no filter form and is not in the register table enhancer allowlist.
- Middleware session/visibility, identity `resolveActor`, universal operational
  read grants, page access, `authorize`; action aggregation and auth logout.
  GetDashboard retains its DASH guard, but authenticated ACTIVE actors receive
  universal `PERM-DASH-VIEW`. Thus **least is not a denied-dashboard persona**.
  Document review is independently denied without both review grants.
- CA-03/CA-04 are partial evidence, not automatic blocks for this independent
  CSS change. `ENGINEERING.md` and `VERIFICATION.md` root routers are absent.
- Mind read through EOF (403 lines initially). Project skills discovered (775
  paths across `.agents/skills` and `.opencode/skills`, including mirrored copies).
  Read relevant graphify, brainstorming, frontend-design and verification skills;
  **full reading of every discovered skill NOT RUN**. This procedural requirement
  remains incomplete; no claim that all skill files were read.
- Graphify query was run before code search/read with
  `~/.venvs/graphifyy/bin/graphify`; actual browser MCP was discovered and used for
  initial anonymous redirect. Authenticated evidence uses local Playwright.

## State / transition / guard matrix

| Concern | Transition / guard and source | Evidence / limit |
|---|---|---|
| Authentication | no actor → `/login?returnTo=%2Fdashboard`; middleware resolves session and ACTIVE visibility | Anonymous browser redirect observed; employee/least authenticated locally PASS |
| SSR snapshot | emptyDashboard held until `dashboardDependencies().get.execute(actor)` resolves; no client loading animation | Source reviewed; successful confirmed snapshot PASS; transient client loading N/A |
| Read failure | AUTHORIZATION → accessDenied; other exception → providerUnavailable; numeric counts withheld | Guards unchanged; full denied-dashboard/provider-outage browser branches NOT RUN |
| Per-source denial | `readMetricSource`: AUTHORIZATION → value null, no href, NOT_AUTHORIZED; other errors propagate | Real document-review denial displayed with no number/drilldown PASS; null never zero |
| Empty / populated data | confirmed all-zero metrics only → zero strip; mixed zero/null → metric cards; attention uses real rows | Mixed zero/null, empty attention, zero flow and actual activity PASS; all-confirmed-zero strip and populated attention NOT RUN |
| Series | AVAILABLE → Chart+table; EMPTY / UNAVAILABLE / NOT_SUPPLIED → explicit state, no points | Actual EMPTY PASS; populated AVAILABLE chart and remaining series states browser NOT RUN; original chart unit/source guards PASS |
| Refresh | native `/dashboard` GET → fresh server snapshot, no optimistic data | Native link and visible snapshot PASS; in-flight/retry fault transition NOT RUN |
| Filters/navigation | Existing register query hrefs remain identical; no dashboard filter state machine | All main links before/after identical; no invented dashboard filter controls |
| Disclosures | native summary toggles sources/definitions/coverage; optional enhancements unchanged | Sources keyboard Enter and following Tab focus ring PASS; full drawer/palette focus cycle NOT RUN |
| Mutation / conflict / reconciliation | No domain mutation on dashboard; record links hand off to owning routes | N/A for local overview; no cross-route mutation acceptance claimed |
| Shell logout | UserMenu native POST → actions.logout → LogoutUseCase → session cookie expiration | Source reviewed, unchanged; runtime success/failure/logout recovery NOT RUN |
| Export / print | No dashboard export action; browser print only | Local print stacking CSS; actual print output NOT RUN |
| Restricted route | least opens existing real task then `/system/health` → owner-only 404 in middleware | PASS; this is an actual visibility denial with positive readable record, **not** a denied mutation or denied dashboard |

## Local runtime and evidence

Reused the already-running Node **v24.20.0** Astro dev process at
`127.0.0.1:4331`, launched through CA-04's explicit environment allowlist.
Only disposable PostgreSQL18 `localhost:55432/qc_disposable` was configured;
no `.env` was sourced or read by these runners. Existing verification personas
and existing persisted records were used. No business fixture rows were inserted
or altered by this task. Login necessarily creates disposable sessions.

Before/after: same employee, database, Node24 runtime, locale en-GB, timezone
Asia/Riyadh, height1000 and widths **320/390/768/1024/1440**. `before/*.png` and
`after/*.png` are actual authenticated screenshots. Desktop before/after and
mobile after were visually reviewed. Five source-link/count/attention/Sidebar
comparisons are exact matches (`comparison.json`), not matching freshness text:
snapshots naturally have different server timestamps.

The **before runner overall is FAIL**: all five baseline measurements/screenshots
succeeded, then its original wrong assumption that least should show `.denied`
timed out. The assertion was corrected to a real owner-only route. Do not treat
that timeout as a product failure or as a complete passing baseline suite.
Final after runner PASS, zero page errors.

| Check | Result |
|---|---|
| Five viewport horizontal overflow | 0 at each, before and after |
| Visible main-content targets <44×44 | Before 6/6/7/6/6; after **0/0/0/0/0** |
| Visible main-content text <12px | 0 at each measured viewport (AVAILABLE SVG not exercised) |
| axe WCAG2A/AA + 2.1AA main-content | 0 violations at all five viewports |
| Sources keyboard / next Tab / refresh | PASS, actual 2px focus outline with 2px offset |
| Forced colors / reduced motion at320 | overflow0; not complete AT or visual-state certification |
| no-JS authenticated dashboard at390 | title Dashboard, overflow0; native DOM stays available |
| Real record | least opened `VERIFY-AUTHZ-READONLY`, task `b82044e4-68d2-49d3-81fb-19cb03d73b54` |
| Actual denial | least `/system/health`404 with empty response; no invented message |
| Computed contrast on panel `rgb(37,43,52)` | heading **12.12:1**, empty/eyebrow **5.60:1**, accent link **8.09:1** |
| Focused unit | **31/31 PASS**, 5 files; includes new 4 presentation guards |
| Astro typecheck | **0 errors, 0 warnings**, 128 hints /1121 files |
| `git diff --check` | PASS |
| Workspace map | regenerated; VERIFICATION inventory updated |
| Graphify AST update | PASS,67509 nodes/128340 edges; existing extractor limits:9 partial syntax files,373 files without symbols; no LLM labels run |

## Commands

```sh
export PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH"
node audit/CA-04/local-run.mjs "$HOME/.nvm/versions/node/v24.20.0/bin/node" audit/CA-P-DASHBOARD/browser.mjs before
node audit/CA-04/local-run.mjs "$HOME/.nvm/versions/node/v24.20.0/bin/node" audit/CA-P-DASHBOARD/browser.mjs after
node audit/CA-P-DASHBOARD/compare.mjs
node node_modules/vitest/vitest.mjs run tests/unit/ui/capa-dashboard-overview.test.ts tests/unit/ui/dashboard-decision-surface.test.ts tests/unit/ui/dashboard-departments.test.ts tests/unit/ui/dashboard-start-action.test.ts tests/unit/dashboard/dashboard-presentation.test.ts
node node_modules/astro/astro.js check
python3 scripts/diagnostics/generate-workspace-map.py
~/.venvs/graphifyy/bin/graphify update .
git diff --check
```

## Remaining acceptance / prior debt

- **NOT RUN:** native browser zoom200%/400%, actual screen reader/VoiceOver,
  full keyboard traversal, populated chart/table/attention with long data,
  provider outage/recovery, all-confirmed-zero strip, all source-denial states,
  print output, complete transitions for seven CA-03 concerns. Viewport reflow
  and media emulation are not claimed as native zoom or AT evidence.
- **NOT RUN:** full build, full unit/integration/E2E, performance baseline;
  CSS-local scope verified with focused checks, not app-wide acceptance.
- Existing debt preserved: Sidebar wraps the Dashboard label at its current
  width; topbar account/breadcrumb targets remain owned by shell and weren't
  included in the main-content44px claim. Operational directory is intentionally
  complete and long; no links were hidden or regrouped to shorten screenshots.
- Source coverage advertises dataset capability, not per-actor permission. Its
  document review AVAILABLE description can coexist with a denied personal count;
  no policy/read-model change was made to conceal this pre-existing distinction.
- The task-created browser-MCP text snapshot was removed; no unrelated
  browser-MCP artifact remains in final `git status`.

Local CSS improvement is verified within the listed checks; acceptance stays
**PARTIAL** until the unrun matrix and procedural skill-reading requirement are
completed. PASS is not RELEASED.

## CA-P-DASHBOARD prompt follow-up — 2026-10-22

**Prompt state: PARTIAL.** No product source was changed: the current candidate
already contains the scoped CAPA A overview layout and its markup/data contracts.
Changing it again without a confirmed visual or functional gap would add churn.
The design direction was approved in-session; this section records the current
candidate check, not a new implementation claim.

### Current source and guard matrix

| Concern | Current transition / authority | Status |
|---|---|---|
| AUTH | Missing `Astro.locals.actor` → native redirect to login. Authenticated page visibility is server-derived. | VERIFIED in source; browser used existing disposable employee/least identities. |
| READ / dashboard guard | `emptyDashboard(actor)` is only the unconfirmed fallback; `GetDashboardUseCase` requires an active allowed dashboard permission before query. `AUTHORIZATION` → denied view; other errors → provider-unavailable view. | Source and use-case denial test PASS. Dashboard-level denied account is **N/A under current authority model**: active operational actors receive universal `PERM-DASH-VIEW` (`visibility.ts`); `verify-least` also has that read permission. `/system/health` 404 is a separate owner-only route and is not counted as dashboard denial. |
| Metric source denial | A source-level `AUTHORIZATION` result renders `value: null`, “Not available”, and no drilldown; it is not zero. | Browser PASS for the employee's document-review source; null count had zero links. |
| EMPTY / populated overview | Confirmed zeros render as zeros; queue and activity render actual returned rows. Current local disposable DB had 5 task rows (all DRAFT), 0 receiving items, 0 inspection reports, and 8 audit events. The visible attention queue was empty; this run did **not** establish a populated attention item. | True-zero and empty-attention branch PASS; populated attention, receiving chart and failure snapshots NOT VERIFIED. No records/KPIs were seeded to manufacture a positive screenshot. |
| Series | `AVAILABLE` uses the existing `Chart` with summary, source/scope/period/freshness and accessible data table; unavailable/not-supplied states have no fabricated points. | Browser observed the available 14-day series with real zeros and explicit summary/source/period; populated series NOT VERIFIED. |
| FILTER | No dashboard filter form or editable filter state exists. Existing metric/flow hrefs continue to carry their source register filters and scope. | N/A as an interactive machine; link list was identical before/after at all five measured widths. |
| EXPORT | No page-level export action/endpoint is imported or rendered. | N/A; no export UI added. Browser print is not a dashboard export workflow. |
| MUTATION / AUTHZ action | The dashboard is read-only. Existing “Create receiving item” is a navigation link only, rendered only for its existing zero condition and current server-side authorization projection; the receiving use case remains the final authority. No NCR/CAPA/Retest action was added. | No dashboard mutation to exercise. N/A. |
| PENDING / refresh | SSR waits for the authorized read to finish; there is no synthetic loading state. Refresh is native `GET /dashboard`. | Native refresh PASS; artificial pending state N/A. |
| Error/status | Authorization denial, provider unavailability, source-level non-authorization and empty results remain distinct. | Source-level denial and true empty observed. General provider outage/recovery NOT RUN. |
| Keyboard / preference modes | Native links/disclosures; scoped focus ring; reduced motion and forced-colors rules in page CSS. | Sources disclosure Enter + next Tab measured a 2px focus ring; 320px forced-colors/reduced-motion overflow 0; complete traversal, screen reader and native zoom NOT VERIFIED. |

### Fresh candidate evidence

- Same `HEAD` `3b63508319abdd83ebe6ed5b91799846c896f0d7`, same local PostgreSQL 18.6 database, Node 24.20.0, employee and least identities, locale `en-GB`, timezone `Asia/Riyadh`, height 1000. Before/after runs changed no page, component, data, count, filter, sidebar link or sidebar styling. This is a same-candidate presentation check, not proof of a visual delta.
- Browser captures: `before/{320,390,768,1024,1440}.png` and `after/{320,390,768,1024,1440}.png`; plus `after/denied.png` (owner-only health route, **not** dashboard denial). Actual dynamic `VERIFY-AUTHZ-READONLY` record rendered on its task detail; no 404 sentinel used for that record. The dashboard itself showed a real empty attention queue, not a fabricated populated row.
- Five viewport widths: horizontal overflow 0, visible dashboard targets under 44px 0, text under 12px 0, axe WCAG 2.0 A/AA + 2.1 AA main-content violations 0. Sidebar source was identical to candidate HEAD (SHA-256 `973afdc935c684880b4a6f07a0f341270347fc3a1e43ecd20389e9dad6aeb818`); `comparison.json` records unchanged hrefs, counts, attention and sidebar links.
- Four measured contrast pairs on rendered graphite panel: heading 12.12:1, muted/empty 5.60:1, eyebrow 5.60:1, accent link 8.09:1. These checks cover only the listed selectors, not every visual state.
- Focused UI tests: 31/31 PASS. Read guard tests: 11/11 PASS. `astro build`: PASS (existing bundle warnings). `git diff --check`: PASS before this report update.
- `astro check`: FAIL with two TS2307 errors in existing audit capture files `audit/CA-P-500/{committed-500,workingtree-500}.astro`, each importing `../ui/layouts/BaseLayout.astro`; the dashboard itself produced only the existing unused `GetDashboardUseCase` hint. No unrelated audit artifact was edited.

### Remaining / NOT VERIFIED

- Native browser zoom at 200% and 400%, complete keyboard traversal, actual screen reader, forced-colors visual/name check, full long-text stress, populated attention and populated chart/table, and provider failure/recovery were not verified by this run.
- A real active account denied dashboard access is not constructible from current approved authorization sources: both named disposable accounts are active and carry `PERM-DASH-VIEW`, as does the universal operational read grant. Do not substitute the unrelated `/system/health` 404 or an invented role. Use-case-level permission denial is covered by tests; account-level denied-dashboard acceptance stays N/A/BLOCKED until a source-authorized persona exists.
- Skill discovery found 775 paths across `.agents/skills` and `.opencode/skills`; relevant UI/accessibility/verification skills were read, but complete reading of every discovered skill file was not completed.
- Independent prior functional debts remain out of scope: populated attention/provider acceptance, full dashboard auth-denial persona, and the unused `GetDashboardUseCase` import. No CSS, business rule, API/schema, Sidebar, permission, or component behavior was changed in this follow-up.

The required acceptance is **PARTIAL**, not DONE: current presentation, responsive measurements and scoped source denial are verified; populated operational data, account-level denied-dashboard, native zoom and full AT acceptance remain open. `PASS ≠ RELEASED`.
