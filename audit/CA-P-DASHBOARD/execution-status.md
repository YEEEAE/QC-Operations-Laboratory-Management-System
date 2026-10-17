# CA-P-DASHBOARD — local graphite overview

**State: PARTIAL.** Local presentation implemented; not full route/workflow,
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
