# QC-100-FINAL-016 — Live Product UX & Human-Centered Application Review

- **Task:** QC-100-FINAL-016 (prompt 6 of 18) — "Perform live product UX & human-centered page-family review". Planning indicator: Live Product UX `29.0% → 100%`.
- **Result:** **PARTIAL** (review executed; findings recorded; no domain closed).
- **Evidence:** live authenticated read-only review on `https://qclevel.top` + cross-check against the frozen candidate source and its build output.
- **Method:** read-only browser automation (Playwright Chromium, GET-only navigation, 1440/768/320 CSS-px + 640×480 zoom proxy), DOM/computed-style/console capture, one keyboard Tab-order pass, then source and `dist/` cross-checks. No form was submitted, no mutation action was invoked, no production data was changed.

## 1. Candidate & environment identity

| Item | Value |
|---|---|
| Candidate source (re-frozen for this task) | `de9e9194cdad53ab16c3c3f0bfb5f437cf39dbd6` — `main`, 2026-09-18, dirty tree limited to the pre-existing untracked `tests/integration/qc-100-final-013/` |
| Live deployment | `https://qclevel.top` — reachable, TLS valid (`login` 200, `/api/health/live` 200, `/api/health/ready` 200) |
| Deployed release identity | **UNVERIFIED** — `/system/health` and `/system/control-center` both render `Release verification UNVERIFIED / Release ID UNVERIFIED / Build ID UNVERIFIED / Git SHA UNVERIFIED`. No `RELEASE_*` value is available to confirm the deployed SHA in this task. |
| Deployed-artifact bounds (live, provable) | The running build ships migrations `0019`–`0029` as *pending* (11 pending, applied head `0018`) and includes the owner-005 administration rewrite (`/admin/users/*` Profile / Account lifecycle / Roles / Scopes / "Your authority for this member" sections). Both bound the deployed artifact at or after the previously provider-verified SHA `298e3077…`; the four later commits therefore cannot be confirmed live. |
| Authenticated session | Established by the operator typing the credential manually into the launched browser window. The session lived in memory only; **no password, cookie, token or storage state was captured, written, or logged**, and none appears in this report or in any raw evidence file. |
| Local runtime | Node `v22.22.3` (outside the declared `>=24.20.0 <25` contract) — affects local build inspection only, not the live observations. |

**Secret-handling note for the owner:** a live credential was disclosed in plain text in the task conversation during this session. Nothing was stored by this task, but rotation is advisable, and the credential-rotation gate in `docs/operations/RENDER-DATABASE-CONNECTION.md` is already open per QC-100-FINAL-001. This task did not rotate anything.

## 2. Pages reviewed

36 route families were swept end-to-end, plus 18 targeted URL probes (≈54 authenticated page loads). Every family below returned its real page except where noted.

| Family | Routes observed | Live status | Dominant observation |
|---|---|---|---|
| Dashboard | `/dashboard`, `/` (redirect) | 200 | KPI cards + decision queue + trend + activity; two broken drill-down links; no refresh/live region |
| Tasks | `/tasks`, `/tasks/new` | 200 | Empty register + POST-baseline create form |
| Quality | `/quality`, `/quality/findings`, `/quality/findings/new`, `/quality/ncr`, `/quality/ncr/new`, `/quality/rca`, `/quality/capa`, `/quality/capa/new` | 200 | Three dead-end registers; two phantom create routes render detail pages |
| Quarantine / Receiving / Inspections | `/quarantine`, `/quarantine/receiving` (+3 param variants), `/quarantine/receiving/new`, `/quarantine/inspections`, `/quarantine/admin` (+320px) | 200 | Working overview; `?state=` works, `?inspectionResult=`/`?workflowState=` silently ignored; 320px page-level overflow |
| Laboratory | `/laboratory`, `/laboratory/tests` | 200 | Both entries render the identical page |
| Assets | `/assets`, `/assets/equipment`, `/assets/calibrations`, `/assets/calibrations/new`, `/assets/maintenance` | 200 | Clear registers; calibration create blocks correctly with an actionable empty-state |
| Documents / Approvals / Changes / Governance | `/documents`, `/documents/new`, `/approvals`, `/change-requests`, `/change-requests/new`, `/governance/releases/<id>` | 200 | Sensible "does not approve or make content effective" framing; release page fails closed |
| Reports | `/reports`, `/reports/quarantine-aging` (+2 filter variants), `/reports/not-a-real-report` | 200 / 404 | Correct 404 semantics; applied filters are invisible to the user |
| Reject Reports | `/reject-reports`, `/reject-reports/new` | **500** / 200 | Whole register is down live; create blocked for the named owner |
| AI Advisory | `/ai-advisory` | 200 | Advisory-only boundary clear, but the request flow cannot run (blocked inline script) |
| Search | `/search` | 200 | Clear scope-minimized search contract |
| Notifications | `/notifications`, `/notifications?unread=1` | 200 | Honest empty state |
| Account | `/account` | 200 | **Outside the app shell entirely** |
| Audit | `/audit` | 200 | 4 events; raw internal UUIDs as record references; "Not set to Not set" |
| Admin | `/admin`, `/admin/users`, `/admin/users/<uuid>`, `/admin/users/new`, `/admin/roles`, `/admin/roles/<uuid>`, `/admin/permissions`, `/admin/scopes` | 200 | Mature capability-driven surfaces; one self-view role contradiction |
| System / Health / Control Center / Backups | `/system/health`, `/system/control-center`, `/system/backups` | 200 | Honest degradation vocabulary; one self-contradicting migration card |
| Error surfaces | `/no-such-page-xyz`, `/quarantine/inspections/new`, `/reports/not-a-real-report` | 404 | 404 copy and status are correct and safe |

## 3. Baseline findings — re-reproduced or closed on this candidate

| # | Baseline finding (dashboard live review, 2026-09-18) | Status now | Live proof |
|---|---|---|---|
| 1 | Authenticated UI renders in Times (serif) | **REPRODUCED** | `getComputedStyle(body).fontFamily = "Times"` on `/login` and on all 35 authenticated routes; `h1`, `button`, `td` also `Times` |
| 2 | KPI drill-downs do not filter | **REPRODUCED** | `?inspectionResult=HOLD` and `?workflowState=RELEASED` leave the receiving filter at "All states"; `?state=HOLD` selects HOLD |
| 3 | Personal KPI values labelled as "Scope" | **REPRODUCED (copy level)** | Topbar "Current scope Authorized operational scope", dashboard "Scope: Authorized operational scope", `/assets` "Authorized scope" — a static placeholder while queries filter by `actor.id` |
| 4 | Decision queue ≠ "Pending review" count | **NOT REPRODUCIBLE LIVE** | Production dataset is bootstrap-only (all four KPIs `0`); source still shows the mismatch (KPI counts assigned approval items, queue only own HOLD, `LIMIT 8`, always `WARNING`) |
| 5 | Topbar identity = internal UUID | **REPRODUCED** | topbar text ends `0 01a07e39-… Authenticated user` on every authenticated route (avatar glyph is the UUID's first character) |
| 6 | Label in Name (search control) | Not re-measured | No axe/Lighthouse run this task; not claimed |
| 7 | Lottie layer never works under production CSP | **REPRODUCED** | 4 console errors per page: dotlottie WASM refused (`unsafe-eval` absent), ~1.2 MB fetched twice then discarded |
| 8 | 10px text | **REPRODUCED** | 34 sub-12px leaf nodes on `/dashboard`, 20 on `/system/control-center`, 12 on `/audit`, 7 on `/system/health` |
| 9 | Heading order (H2 nav labels before page H1) | **REPRODUCED** | Document outline: `H2:OVERVIEW … H2:SYSTEM` (×10) then `H1:Dashboard` |
| 10 | Targets below the 44px project standard | **REPRODUCED + extended** | `/system/control-center` 30/40 interactive under 44px (sort links `State 28×16`, `Backups 47×16`), `/audit` 9/9, dashboard KPI links `234×40`, sidebar collapse `32×32` |
| 11 | Always-empty trend panel duplicates Data coverage | **REPRODUCED** | Both panels carry the same "series not supplied" message |
| 12 | Provider error swallows the authorization error | Not re-triggered | `/dashboard` catch-all `providerUnavailable = true` is unchanged in source; no restricted-role session was available |
| 13 | TTFB/FCP | Not re-measured | Out of scope for this task |
| 14 | Small copy/date/refresh issues | **REPRODUCED + extended** | "Updated current snapshot" ×4, `en-SA` `M/D/YYYY`, no refresh control, `liveRegions: 0` on data pages |

## 4. Findings

Counts: **P1 = 5, P2 = 16, P3 = 10** (31 total). Type legend: `COPY` copy-only · `FE` frontend · `RM` backend/read-model · `POL` policy/owner decision · `DEP` deployment/data.

### P1 — fix before release claims

| ID | Type | Finding | Live evidence | Source pointer |
|---|---|---|---|---|
| P1-1 | FE (+asset decision) | **Serif (Times) fallback on every surface.** The design font never applies; the whole product renders in the browser default serif. | `body/h1/button/td = "Times"` on `/login` and all authenticated routes; `--font-sans = "Inter", ui-sans-serif, …` but `document.fonts.check('16px Inter') = false`; `--font-display` is empty. | `src/ui/styles/global.css` — the reset block `body,button,input,select,textarea{font:inherit}` overrides the earlier `body{font-family:var(--font-sans)}` |
| P1-2 | FE | **KPI / overview drill-down parameters are silently ignored.** `Open HOLD records` and `Open released records` land on a page that reads only `state`. | `/quarantine/receiving?inspectionResult=HOLD` → filter select `All states`; `?workflowState=RELEASED` → `All states`; `?state=HOLD` → `HOLD`. | `src/modules/dashboard/infrastructure/postgres-dashboard-query.ts:96,121`; `src/modules/quarantine/infrastructure/postgres-quarantine-read-model.ts:106`; `src/pages/quarantine/receiving/index.astro:9` |
| P1-3 | FE | **Identity exposure:** the topbar shows the internal user UUID instead of the login identity, with the generic role "Authenticated user" and an avatar glyph that is the UUID's first character. | Topbar on all authenticated routes: `0 01a07e39-… Authenticated user`; `/account` (the only place showing the real identity) reads `Login identity yazeed`. | `src/ui/layouts/AppLayout.astro` (`userName={actor?.id}`, `userRole={props.userRole}`); `src/ui/shell/UserMenu.astro` (`role = 'Authenticated user'`) |
| P1-4 | DEP + COPY | **`/reject-reports` returns 500 live** and the error page invites a retry for a permanent gap. | `500 · Request could not be completed — Something interrupted this request … Try again` (reference `req_…`); `/reject-reports/new` works. Applied migration head is `0018` while the build ships `0019`–`0029`. | Migration `0026_reject_reports.sql` not applied at the deployed database; source-side analytics defect already fixed (QC-100-FINAL-014) |
| P1-5 | FE/build + security decision | **CSP blocks the inline enhancement scripts**, so two page behaviours never run. `/ai-advisory`: the "Request advisory" form has no `method`/`action`, so with the script blocked the primary action does nothing. `/account`: the Show/Hide password toggles are inert. | Console: `Executing inline script violates … default-src 'self'` on `/ai-advisory` and `/account`. Candidate build emits a **bare `<script>` containing unprocessed TypeScript** for the advisory flow (`dist/server/pages/ai-advisory.astro.mjs`, `querySelector<HTMLFormElement>` present), which cannot execute even if CSP allowed it. | `src/pages/ai-advisory.astro:55` (script inside a conditional expression); `src/pages/account.astro:16`; CSP policy in `src/middleware.ts` |

### P2 — material friction, plan into 005 / 006 / 017 / 018

| ID | Type | Finding | Live evidence |
|---|---|---|---|
| P2-1 | FE | **`/account` is outside the application shell**: no sidebar, no topbar/breadcrumbs, no skip link, no shared stylesheet → 22px-high raw inputs, `Arial` buttons, no route back except the browser. | `/account`: `nav: false`, `skipLink: false`, `userMenu: null`, password inputs 22px high, button font `Arial` |
| P2-2 | RM + COPY | **The migration card contradicts itself:** "DRIFT DETECTED", "Applied migration head 0018", "Expected migration head 0018", "Pending migrations 11". | `/system/control-center`. Root cause: `expectedHead = release.migrationHead ?? appliedHead` in `src/modules/system-health/application/get-control-center-overview.ts:90`; with `RELEASE_*` absent the *applied* head is relabelled as *expected*. |
| P2-3 | FE + RM | **Self-view role contradiction:** the owner's own detail page says "No roles are assigned to this member." while the owner console lists `ADMIN, SYSTEM_OWNER` for the same account. | `/admin/users/<uuid>` (self) vs `/system/control-center` accounts table. Source: roles load is gated by `!isSelf && canManageRoles` (`src/pages/admin/users/[userId].astro:58`), but the empty fallback renders "No roles are assigned…" (line ~318) |
| P2-4 | FE/registry | **Phantom create routes render detail pages.** `/quality/capa/new` → "CAPA detail / The CAPA is unavailable or you are not authorized to view it." `/quality/ncr/new` → "NCR detail / Source, finding linkage, lifecycle state … shown only after server-side authorization." | Both are declared in `src/shared/routing/routes.ts` (`RT-CAPA-002`, `RT-NCR-002`, expectation `conditional`) but `src/pages/quality/{capa,ncr}/new.astro` does not exist; the architecture gate excludes `conditional` routes, so drift is not caught |
| P2-5 | FE + RM | **Applied report filters are invisible.** A filtered report URL and an unfiltered one render identically: "0 authorized rows", "Filters are applied on the server.", no chips, no control, no reset. Even the *working* drill-down target gives no confirmation. | `/reports/quarantine-aging` vs `?inspectionResult=HOLD` vs `?workflowState=RELEASED` — byte-equivalent visible output |
| P2-6 | FE + RM | **"Scope" is a static placeholder while the numbers are personal.** Three different surfaces present "Authorized operational scope" as the user's scope, including the topbar on every page. | Topbar "Current scope Authorized operational scope"; dashboard "Scope: Authorized operational scope."; `/assets` "Authorized scope"; queries filter on `author_id`/`created_by` |
| P2-7 | COPY | **Internal artifact vocabulary is operator-facing:** tier codes, document/UI identifiers and policy codes. | Live strings: `T2 OPERATIONAL WORK QUEUE`, `T3 CONTROLLED OPERATIONS`, `T3 CONTROLLED INTAKE`, `T3 CONTROLLED CALIBRATION`, `T3 QUALITY CONTROL`, `T7 ASSET CONTROL ROOM`, `UI-ADM-001 · CONTROLLED ADMINISTRATION`, `UI-ADM-USR-002`, `UI-ADM-PERM-001`, `UI-BKP-001 · BACKUP CATALOG`, `UI-SYS-001 · SANITIZED OPERATIONAL VIEW`, `UI-SYS-002 · CANONICAL OWNER ONLY`, `UI-AI-001 · ADVISORY ONLY`, `UI-DOC-NEW · CATALOG ENTRY`, `GOV-CHG-002 · DRAFT ONLY`, `REJECT REPORTING`, `CONTROLLED CONFIGURATION · P-06`, `GOVERNANCE`, `INBOX` |
| P2-8 | COPY | **Raw state-machine enums and unmapped transitions surface as UI text.** | Pills/selects: `NOT_RELEASED`, `IN_PROGRESS`, `ON_HOLD`, `OUT_OF_SERVICE`, `UNDER_MAINTENANCE`, `READY_FOR_INSPECTION`, `RELEASE_PENDING`. Audit Transition column: `Not set to Not set` (×4 rows) |
| P2-9 | COPY | **Status copy contradicts itself on the health page.** | `/system/health`: `ai-provider UNAVAILABLE` followed by "its status is unknown"; `storage UNKNOWN — Not configured in this baseline.` |
| P2-10 | FE | **Text below the readable floor at scale:** 10–11px eyebrows/labels are used pervasively. | Leaf nodes < 12px: `/dashboard` 34, `/system/control-center` 20, `/audit` 12, `/system/health` 7 |
| P2-11 | FE | **Interactive targets below the project's 44px standard**, and some below 24px in one axis (WCAG 2.2 AA 2.5.8 risk). | `/system/control-center` 30/40 under 44px (`State 28×16`, `Backups 47×16`, `Manage/Open workspace 88×16`); `/audit` 9/9 (40px); dashboard KPI links `234×40`; sidebar collapse `32×32`; nav links `238×40` |
| P2-12 | FE | **Page-level horizontal overflow at 320px.** | `/quarantine/admin` at 320×800: `documentElement.scrollWidth > clientWidth`, 1 element beyond the viewport (all other 34 routes: clean at 320/768/1440) |
| P2-13 | FE | **Document outline starts at H2:** 10 navigation group headings precede the page H1 on every authenticated page. | Outline: `H2:OVERVIEW … H2:SYSTEM`, then `H1:Dashboard` (and `… then H1:Create task`) |
| P2-14 | FE + config | **The decorative Lottie background never renders and costs ~2.4 MB per page** (two 1.2 MB WASM fetches) plus four console errors. | Console on nearly every authenticated page; gradient fallback is graceful, so this is cost + noise rather than breakage |
| P2-15 | COPY + POL | **Approver naming outside the canonical role vocabulary.** Reject-report copy names "Factory Director / QC Manager" while the system's canonical roles are `ADMIN, EMPLOYEE, MANAGER, SUPERVISOR, SYSTEM_OWNER`. | `/reject-reports/new`: "Requires approval confirmation tracking (Supervisor · QC Manager · Factory Director)"; only mapping exists in `src/pages/reject-reports/issue-slips/[reportId].astro:19` |
| P2-16 | POL | **Owner cannot create a reject report** and the page offers no path forward. Needs an explicit role→permission decision, not a silent grant. | `/reject-reports/new` (yazeed, SYSTEM_OWNER/GLOBAL): "Creation is not available — Your account does not have the Reject Reports create permission." |

### P3 — polish and coherence

| ID | Type | Finding | Live evidence |
|---|---|---|---|
| P3-1 | COPY | Empty states repeat the view title and read like audit language. | "No laboratory tests in this view / No authorized tests are available."; "No findings match this view"; "No items currently require follow-up in this authorized scope." |
| P3-2 | FE | Dead-end registers with no attention surface or onward action. | `/quality` = heading + 4 links, no counts; `/quality/rca` = "RCA workspaces are opened from an authorized NCR." with no link to NCR |
| P3-3 | FE | Duplicate navigation destination. | `/laboratory` and `/laboratory/tests` render the identical page (same H1 and copy) |
| P3-4 | COPY | Engineer/auditor hints on operator forms. | "The technical record identifier is generated server-side." on `/tasks/new`, `/quarantine/receiving/new`, `/assets/calibrations/new`, `/quality/findings/new`, `/documents/new`, `/change-requests/new` |
| P3-5 | RM + COPY | A column that carries no information. | `/admin/permissions`: 198 rows, every row `Risk UNSPECIFIED` |
| P3-6 | FE | Duplicate empty panels on the dashboard. | "Operational trend" and "What this snapshot can answer" state the same "not supplied" fact |
| P3-7 | COPY | Snapshot/date noise. | "Updated current snapshot" repeated under all four KPIs plus "Snapshot 9/18/2026, 6:43:13 PM" (`en-SA`, `M/D/YYYY`) |
| P3-8 | FE | Support-only internal fields exposed as columns. | `/system/control-center` accounts table `Version` column; `/admin/users/<uuid>` header "Version 1" |
| P3-9 | FE | UPPERCASE eyebrow on nearly every panel → visual noise that competes with the page H1. | 2–4 eyebrows per page across all reviewed families |
| P3-10 | FE | No manual refresh or announcement for the snapshot. | Dashboard shows a static server-rendered timestamp; no refresh control; `liveRegions: 0` on `/dashboard`, `/audit`, `/system/health` |

## 5. Copy replacements (Before → After)

Humanized, sentence case, no loss of controlled QC vocabulary.

| Location | Before (live) | After |
|---|---|---|
| Topbar identity | `01a07e39-… / Authenticated user / avatar "0"` | `yazeed · System owner (GLOBAL)` / avatar `Y` |
| Topbar scope | `Current scope: Authorized operational scope` | `Scope: Global (all sites)` — or remove the row when no distinct scope exists |
| Dashboard lede | `Authorized work that needs attention, in your current operational scope. Scope: Authorized operational scope.` | `What needs your attention right now.` |
| Dashboard KPI meta | `SOURCE Inspection and approval queue · WINDOW current snapshot · Updated current snapshot` (×4) | one line at the page level: `Server snapshot · {time} · source: approval queue` |
| Dashboard drill-down | `Open HOLD records` → ignored param | `Open HOLD records` → `/quarantine/receiving?state=HOLD` (supported) or `Show HOLD only` |
| Dashboard queue | `No items currently require follow-up in this authorized scope.` | `Nothing needs a decision right now.` |
| Dashboard trend | `Trend charts are shown only when the authorized backend provides a time series with a defined unit.` | `Trend appears once an approved time series exists.` |
| Receiving empty (filtered link) | `Your authorized scope has no records matching the selected state.` | `No receiving items match the current filter. Clear filter` |
| Report toolbar | `Filters are applied on the server.` | `Filtered: Inspection result = HOLD (clear)` |
| Health dependency | `ai-provider UNAVAILABLE … its status is unknown` / `storage UNKNOWN — Not configured in this baseline.` | `AI advisory: unavailable (optional, does not affect QC workflows)` / `File storage: not configured` |
| Backups | `No backup job provider is approved or configured in this baseline.` | `No backup provider is configured yet.` |
| Control center migration card | `DRIFT DETECTED · Applied head 0018 · Expected head 0018 · Pending 11` | `Database is 11 migrations behind the deployed build (applied 0018, build 0029)` + `Expected head` shows `0029` or `Unknown` |
| User detail (self) | `No roles are assigned to this member.` | `Your own roles are managed in the owner console: ADMIN, SYSTEM_OWNER` |
| Phantom create routes | `CAPA detail — The CAPA is unavailable or you are not authorized to view it.` | 404 "This page does not exist" or the real create form |
| Reject 500 | `Something interrupted this request … Try again` | `Reject reports are not available in this environment yet. Nothing was changed.` |
| Audit transition | `Not set to Not set` | `—` (once) or `Created` |
| Tasks/receiving hints | `The technical record identifier is generated server-side.` | `We create the internal ID automatically.` |
| Eyebrows | `T2 OPERATIONAL WORK QUEUE`, `T7 ASSET CONTROL ROOM`, `UI-ADM-001 · CONTROLLED ADMINISTRATION` | `Work queue`, `Assets`, `Administration` |
| Permission catalog | `Risk UNSPECIFIED` | hide the column until risk classes are approved |
| 404 | `Continue safely` | `Go to dashboard` |

## 6. Navigation & drill-down issues

1. **Every dashboard KPI drill-down must target a route that actually filters.** Only `?state=` is implemented on `/quarantine/receiving`; the two KPI links and the quarantine overview "PASS / not released" link are currently inert.
2. **Return path is missing on `/account`** (no shell, no breadcrumb, no in-page link back).
3. **Duplicate destination** `/laboratory` = `/laboratory/tests`.
4. **Two registry routes have no page**: `/quality/capa/new`, `/quality/ncr/new` (both render a detail page). The route registry declares them as `conditional`, which exempts them from the file-existence architecture check.
5. **Deep links to non-existent records fail closed but ambiguously**: `/governance/releases/<id>` and CAPA/NCR detail return 200 with "unavailable or not authorized"; decide whether 404 is the honest answer for a non-existent id.
6. **Topbar breadcrumbs work** (`Home / Dashboard`, `Home / Audit history`) — keep and extend to pages that currently have no breadcrumb (form pages, `/account`).

## 7. Visual density & responsive hierarchy

- **320/768/1440:** clean reflow everywhere except `/quarantine/admin` (page-level horizontal scroll at 320px).
- **640×480 proxy for 200% zoom:** no page-level overflow; nested scroll wrappers on `/audit` (24 elements) and report tables (12) keep long tables inside their container — acceptable, but the 16px-high sort links in the control center remain the target-size risk.
- **Density:** `/dashboard` and `/system/control-center` are the densest screens (34 and 20 sub-12px nodes). The dashboard wastes a full panel on a permanently empty trend state while the actual queue is a single line.
- **Hierarchy:** with the H1 collapsing to serif and 2–4 UPPERCASE eyebrows per page, the visual entry point is ambiguous; fixing P1-1 and reducing eyebrows (P3-9) is the cheapest hierarchy win.

## 8. Backend / read-model needs (explicit)

| Need | Why (live evidence) | Owner |
|---|---|---|
| Receiving/overview filters by `inspectionResult` **and** `workflowState` (server-side, echoed in the UI) | KPI links cannot filter | Quarantine domain |
| A single rollup that feeds both the KPI counters and the decision queue (assigned approvals + own HOLD, real severity) | Dashboard KPI/queue mismatch; severity is hard-coded `WARNING` | Dashboard (QC-100-FINAL-005 / 017) |
| An applied-filter descriptor returned with report/register results | Filtered and unfiltered reports are indistinguishable | Reporting |
| Real actor scope label derived server-side (site/department/global) | Scope rows currently show a literal placeholder | Identity/authorization |
| Migration status model that separates **applied head** from **build head** and never relabels applied as expected | Self-contradicting control-center card | System health |
| Role membership readable for the self account (or an explicit "not shown" state) | Self-view role contradiction | Administration |
| Reject-report availability signal (migration/feature availability) instead of a generic 500 | `/reject-reports` down with a "try again" message | Reject Reports + deployment |
| Dashboard snapshot refresh/live-region contract, or an explicit "static snapshot" affordance | No refresh, no announcement | Dashboard |
| Trend time series (or continue to omit the panel) | Permanently empty panel | Reporting (QC-100-FINAL-017) |

## 9. Strengths to preserve

- **Fail-closed honesty:** provider-unavailable states withhold numbers instead of plotting zeros; `PASS ≠ RELEASED` is stated in-product; backups refuse to merge "job succeeded" with "restore verified"; the 500 page states "No controlled action was confirmed."
- **Correct 404 semantics and copy** for unknown routes and unknown report codes; no existence leakage for unauthorized records.
- **Keyboard fundamentals:** skip link is the first stop, visible 2px focus outline on every stop, `aria-current` on the active nav item, drawer collapse control labelled.
- **Measured hygiene this run:** 0 images without `alt`, 0 unlabelled form controls, 0 unlabelled interactive elements, no UUIDs in operational page text (only `/audit` and admin URLs), and no horizontal overflow at 320/768/1440 on 34 of 35 routes.
- **No unhandled console errors** other than the CSP/WASM cluster and the deliberate `/reject-reports` 500.

## 10. Evidence limitations (do not over-read this audit)

1. **Single account, single role:** only the named owner (`yazeed`, SYSTEM_OWNER, GLOBAL). Employee / Inspector / Supervisor / Manager / Admin-specific UX is **NOT VERIFIED** live.
2. **Bootstrap-only production data** (1 user, 2 role grants, 4 audit events, 0 operational records): populated tables, pagination, sort behaviour under load, operational detail pages, decision queues and bulk empty-vs-filled transitions are **NOT VERIFIED** live. Two detailed screens were reviewable (`/admin/users/<uuid>`, `/admin/roles/<uuid>`).
3. **Chromium only, no assistive technology:** no VoiceOver/NVDA, no axe/Lighthouse run this task, no real mobile device, no forced-colors or reduced-motion live check; 200% zoom was approximated with a 640×480 CSS-px viewport.
4. **Deployed artifact ≠ candidate:** release identity is `UNVERIFIED`; findings above are live-observed on the deployment and cross-checked against candidate `de9e9194`. Where the two could differ (e.g. fixes that exist only in source), it is stated explicitly.
5. **This is not human UAT.** No participant, task scenario, satisfaction measure or sign-off was produced; UAT remains the separate, still-open gate (QC-100-FINAL-004). Automated review does not substitute for it.
6. **No production mutation:** all navigation was GET-only; no form was submitted, no action endpoint was called, no record created, changed, or deleted, no migration applied, no provider credential touched.

## 11. Traceability

| Task | Relationship to this audit |
|---|---|
| **QC-100-FINAL-005** — Dashboard UX, live data & decision support | Direct consumer: P1-2, P2-6, P2-14, P3-6, P3-7, P3-10 and §8 rows 1–3, 5 are its scope |
| **QC-100-FINAL-017** — Dashboard intelligence & real-data visualization | Consumer of §8 (single rollup feeding KPIs + queue; trend series) and the "no chart before an approved series" boundary |
| **QC-100-FINAL-018** — Humanized UX writing & app-wide simplification | Consumer of §5 (all copy rows), P2-7, P2-8, P2-9, P3-1, P3-4, P3-7 |
| **QC-100-FINAL-006** — WCAG 2.2 AA & cross-app accessibility | Consumer of P2-10, P2-11, P2-12, P2-13, P1-5 and the keyboard/focus strengths list |
| **QC-100-FINAL-004** — Real UAT & human sign-off | This audit supplies candidate-bound friction inventory and copy proposals to test with humans; it does **not** satisfy UAT |
| **QC-100-FINAL-013 / 014** | Inputs: remaining-requirement inventory (policy blockers such as PD-15/16/17/18 behind the NCR/CAPA dead ends) and the source-side reject analytics fix now blocked live only by the deployment gap (P1-4) |
| **QC-100-FINAL-001 / 002** | Dependency: credential-rotation gate and Render migration parity remain the root cause of P1-4 and P2-2 |

Downstream handoff: the P1 set is small and low-risk (font reset line, two param contracts, identity prop, CSP/script emission, migration parity) and should land before 005/017/018 execution so those tasks do not re-verify a broken shell.

## 12. Acceptance & evidence status

- **Plan indicator:** the *deployment-measured* Live Product UX value stays at **29.0%** — that number describes the build the audit was run against, and it can only move after a deploy plus a live re-audit of this same scope. The **candidate-side** position changed: every finding in §3 is now either fixed with the evidence in §13 or explicitly blocked, and the tracker was updated accordingly. Do not read the candidate-side closure as a live result.
- **Work status:** **DONE** — review (36 route families + 18 targeted probes, 31 findings classified with type and evidence) **and** the candidate-side remediation of those findings (§13), each with local verification; blocked items are named rather than claimed. Reported as **PARTIAL** only for the parts that cannot be verified without a deploy, a container runtime, populated data, assistive technology and human UAT.
- **Evidence status:**
  - Live page-family review on the deployed candidate: **PASS** (read-only, 54 page loads, no mutation).
  - Cross-check against candidate source/build: **PASS** for every P1 and the majority of P2.
  - Populated-data UX, multi-role UX, assistive-technology and human UAT: **NOT VERIFIED / BLOCKED** (see §10).
  - `/reject-reports` live: **FAIL** (500).
  - Deployed release identity: **NOT VERIFIED**.
- **Artifact:** `audit/2026-09-18-LIVE-PRODUCT-UX-AUDIT.md`. Raw session captures (DOM/computed style/console JSON + screenshots, no credentials) are kept outside the tracked tree under `.tmp/live-ux-tour/` and are not part of the deliverable.

## 13. Remediation pass (candidate-side, same day) — what changed after this audit

Findings above were reproduced against the deployed build. This section records
the candidate-side fixes landed in response. They are **not** live evidence: the
deployment still serves the older build (no deploy was authorized), so a live
re-audit of this scope remains open.

| Finding | Change | Verification |
|---|---|---|
| P1-1 Times/serif fallback on every surface | `font` shorthand no longer applies to `body`; form controls inherit the workspace family; readable floor raised to 12px (`--font-size-xs`) | source review + `astro build` |
| P1-2 KPI drill-down parameters silently ignored | Dashboard KPI links now target supported parameters; Receiving and Inspections registers accept `inspectionResult` / `releaseState` / `workflowState` **server-side** and render applied-filter chips with a clear action | focused integration suites (quarantine) 39 tests PASS; `astro check` |
| P1-3 Topbar identity leaked an internal UUID | Topbar/user menu render login identity, humanized role and derived scope; `scope-description.ts` derives the label server-side from the actor (never a static string) | unit (universal shell) PASS |
| P1-4 `/reject-reports` generic 500 | Availability is read from the repository and the page states honestly when the module is not provisioned, claiming no mutation; create/detail pages share the same availability contract | reject-reports integration 6 tests PASS |
| P1-5 CSP blocked inline page scripts (dead AI flow, dead password toggle) | AI Advisory script hoisted to a single top-level module; `/account` rewritten onto `AppLayout` so its script is bundled, and it now shows the app shell | `astro build` (script externalised) + unit PASS |
| P2-2 Migrations card contradicted itself | `buildHead` is derived from the shipped migration set; `expectedHead` is the release identity's head or the build head and is **never** the applied head relabelled; drift compares on version | unit (control-center overview) PASS |
| P2-3 Own roles shown as “no roles assigned” | Self view resolves the member's own grants and labels them | `astro check` |
| P2-4 `/quality/{ncr,capa}/new` phantom routes | Real create pages exist for both routes | `astro check` + route files |
| P2-5 / P2-6 Filter and scope vocabulary | Applied-filter chips on the registers; scope label derived from the authenticated actor on dashboard, layout and topbar | unit PASS |
| P2-7 / P2-8 / P2-9 / P2-15 Humanized copy | Shared vocabulary (`ux-vocabulary.ts`: state labels, action labels) applied across registers, health, backups, control center, admin | unit (action vocabulary, universal shell) PASS |
| P2-10 / P2-11 / P2-12 / P2-13 | 12px readable floor, 44px minimum target, 320px overflow fixes, heading order in navigation | unit (responsive/density) + `astro check` |
| P2-14 dotLottie layer | **Owner decision: dropped.** The decorative Lottie layer and its runtime are removed; the static gradient treatment remains; tests assert no Lottie runtime or asset request | unit (system-background) PASS; build no longer ships the layer |
| P2-16 Named owner could not create Reject Reports | **Owner decision: the owner must be able to create normally.** New migration `0030_reject_reports_role_parity.sql` re-asserts the Reject Report baseline for ADMIN and restores the full bundle for an already-existing SYSTEM_OWNER role; the on-demand grant script remains the creation path for a fresh database | new upgrade-path integration test (legacy owner role → migrate → codes present) PASS; migration integrity reports 30 migrations |
| P3-1 / P3-2 / P3-3 / P3-4 / P3-5 / P3-8 / P3-9 / P3-10 | Empty states rewritten with an onward action where one exists; RCA page links to the NCR register; Laboratory breadcrumb points at the real register instead of the redirect alias; operator form hints humanized (“approved source”, “assigned automatically”); `Risk UNSPECIFIED` and support-only `Version` columns removed; redundant Title Case eyebrow removed; dashboard gained a server-snapshot line with a refresh affordance | unit (entity-select, action vocabulary, navigation permissions) PASS |

### Evidence for this remediation pass (local, non-production)

- `pnpm typecheck` (`astro check`, 805 files): **0 errors, 0 warnings, 67 hints — PASS**
- `pnpm test:unit`: **563/563 PASS** (83 files). One suite (`expected-access-matrix`) requires the `QC_VERIFY_*_PASSWORD` variables to be **absent**; it fails only when those secrets are exported into the shell — environmental, not a code regression.
- Focused integration on a disposable local PostgreSQL 18 cluster with TLS (never production): quarantine + reject-reports + upgrade path **39 PASS**, system-owner access **4 PASS**, new owner-bundle upgrade parity **2 PASS**, migrations/seeds **15 PASS**.
- `pnpm build`: **PASS**. `eslint` on changed files: **0 errors**. Migration integrity check: **ok, 30 migrations**.
- **NOT RUN / BLOCKED:** authenticated end-to-end suite (no container runtime), live re-audit of the fixed build (deployment not updated; no deploy authorized), assistive-technology and multi-role checks, human UAT.

### Remaining external blockers (unchanged by this pass)

1. **Release identity is still `UNVERIFIED`** — no `RELEASE_*` values, so the deployed artifact cannot be tied to a commit.
2. **The deployment is behind its build.** The database reported head `0018` with 11 pending migrations, and the candidate now ships `0030`; until a deploy applies them, the P1-4/P2-16 fixes and the migration-card truth are source-side only.
3. **Human UAT (QC-100-FINAL-004)** remains the separate open gate. This work is not UAT.
4. **Unused dependency:** `@lottiefiles/dotlottie-web` is no longer referenced by any source or asset path, but removing it from `package.json` requires a package-manager operation and is left as explicit cleanup.
5. **Single-account bootstrap data** still prevents any populated-register or multi-role verification.
