# الحزمة النهائية — UI / UX Pro Max Prompts
## QC Operations & Laboratory Management System

هذه البرومبتات مصممة لـOpenCode/Codex Agent داخل المستودع نفسه.


## خريطة التنفيذ الموحّدة

```text
MASTER PROMPT
    ↓
PHASE 2 MASTER — Current UI/UX Improvement & Development
    ↓
PROMPTS 1–8  — Core remediation tracks
    ↓
PROMPTS 9–21 — Specialist deep dives
    ↓
PROMPT 22    — Final independent closure & production evidence
```

التغطية النهائية تشمل:

```text
Design
UI
UX
Design System
Information Architecture
Information Architecture & Permissions
Interaction Design
Advanced Form Design
UX Writing / Microcopy
Accessibility Design / A11y
Accessibility & Ergonomics
Responsive / Reflow / Zoom
Dashboard & Data Visualization
Data-Driven Design
Motion & Digital Art
Three.js / Lottie / Front-End Performance
Privacy & Security UX
Service Design
UX Research
Authorization-aware UX
Cross-system consistency
Production evidence
```
## 📊 جدول متابعة الحالة — حدّث عمود الحالة عند إكمال أي برومبت

```text
☐ = لم يُنجَز   ✅ = مكتمل
```

| # | البرومبت | الحالة |
|---|----------|--------|
| M | MASTER PROMPT — System Closure Orchestrator | ✅ |
| P2 | PHASE 2 MASTER — Improvement & Development | ✅ |
| 1 | Design Tokens, Semantic Color & Visual Contract | ✅ |
| 2 | Universal App Shell, Dashboard, Navigation & Topbar | ✅ |
| 3 | Accessibility, Reflow, Zoom & Focus Closure | ✅ |
| 4 | Forms, Validation, Error Recovery & Controlled Action UX | ✅ |
| 5 | Data-Dense UX: Tables, Charts, Search, Notifications & States | ✅ |
| 6 | Responsive Layout, Mobile Ergonomics & Information Density | ✅ |
| 7 | Motion, Lottie, Three.js & Front-End Performance | ✅ |
| 8 | Authorization-Aware UX, Roles & Controlled Workflow Clarity | ✅ |
| 9 | Design System Maturity Deep Dive | ☐ |
| 10 | Information Architecture & Permissions Deep Dive | ✅ |
| 11 | Interaction Design Deep Dive | ☐ |
| 12 | Advanced Form Design Deep Dive | ☐ |
| 13 | UX Writing & Microcopy Deep Dive | ☐ |
| 14 | Accessibility & Ergonomics Deep Dive | ☐ |
| 15 | Dashboard & Data Visualization Design Deep Dive | ☐ |
| 16 | Data-Driven Design & Product Analytics | ☐ |
| 17 | Motion & Digital Art Direction Deep Dive | ☐ |
| 18 | Privacy & Security UX | ☐ |
| 19 | Service Design & End-to-End QC Journeys | ☐ |
| 20 | UX Research & Heuristic Validation | ☐ |
| 21 | Cross-System Consistency & Final Polish | ☐ |
| 22 | Final Independent Closure & Production Evidence | ☐ |

## قواعد مشتركة لجميع البرومبتات

## قواعد مشتركة لجميع البرومبتات

قبل تنفيذ أي Prompt:

```text
1. Read .agents/mind/01-mind-latest.md.
2. Read repository instructions and governing documents.
3. Read .opencode/skills/ui-ux-pro-max/SKILL.md in full.
4. Use the repo-local ui-ux-pro-max data, not a guessed internet copy.
5. Freeze current branch, exact HEAD SHA, working-tree status, Node, pnpm, and timestamp.
6. Read Documents/DESIGN-SYSTEM.md and Documents/UI-UX-SPECIFICATION.md before changing presentation.
7. Business Rules, Authorization, State Machines, SoD, E-Signature, Audit and concurrency always outrank visual recommendations.
8. Current product UI decision is English-only. Do not introduce Arabic UI as a new requirement.
9. Dark-only v1 stays unless the owner explicitly changes the policy.
10. No commit, push, merge, deploy, publish, or production mutation.
11. Never claim PASS for a skipped or unrun check. Mark it NOT VERIFIED.
12. Preserve no-JavaScript POST fallbacks and server-side authorization.
13. Do not regenerate/overwrite an approved design system with --persist or --force without explicit owner approval.
14. After each task append a brief “what changed / evidence / remaining gaps” entry to the project mind only if repository rules require it.
```

Use focused skill searches instead of one giant vague query. Examples:

```bash
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "focus not obscured" --domain ux
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "error summary validation" --domain ux
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "target size minimum" --domain ux
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "navigation hierarchy back behavior" --domain ux
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "dark mode contrast" --domain ux
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "bundle size client javascript" --stack astro
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "renderer dispose pixel ratio performance" --stack threejs
```

Verify every returned result fits a desktop-first enterprise QC web app before applying it.

---

# MASTER PROMPT — UI/UX System Closure Orchestrator

> **الحالة:** ✅  مُنجز

```text
You are the independent senior UI/UX systems auditor and remediation agent for the repository:

YEEEAE/QC-Operations-Laboratory-Management-System

Mission:
Bring the complete UI/UX layer to a defensible enterprise QC standard using the repository-local skill:
.opencode/skills/ui-ux-pro-max/

Do not redesign the product from scratch. Improve the current approved system.

Authoritative product constraints:
- Operational clarity before decoration.
- Unified Dark Enterprise QC Control Room.
- Desktop-first operational application with responsive support.
- English-only current product UI.
- WCAG 2.2 AA target.
- PASS is not RELEASED.
- Backup success is not restore verification.
- Unknown/unverified state never becomes green.
- UI does not own business truth.
- Server-side authorization, state machines, scope, SoD, concurrency, e-signature and audit remain authoritative.
- No production mutation.
- No commit/push/merge/deploy/publish.

Start:
1. Read .agents/mind/01-mind-latest.md.
2. Freeze exact HEAD/branch/status/environment.
3. Read:
   - .opencode/skills/ui-ux-pro-max/SKILL.md
   - .opencode/skills/ui-ux-pro-max/data/ux-guidelines.csv
   - .opencode/skills/ui-ux-pro-max/data/stacks/astro.csv
   - .opencode/skills/ui-ux-pro-max/data/stacks/threejs.csv
   - Documents/DESIGN-SYSTEM.md
   - Documents/UI-UX-SPECIFICATION.md
   - Documents/AUTHORIZATION-VISIBILITY-DECISION.md
   - Documents/BUSINESS-RULES.md
   - Documents/PERMISSION-MATRIX.md
   - Documents/STATE-MACHINES.md
   - audit/2026-09-09-production-ui-audit.md
4. Inventory every user-facing route and shared UI component.
5. Build a UI/UX coverage matrix by route family, role, state, viewport and interaction.

Audit and remediate in this order:
A. Accessibility and semantic correctness.
B. App shell/navigation/global context.
C. Forms, validation, async feedback and controlled actions.
D. Semantic colors/statuses/typography.
E. Responsive/reflow/zoom.
F. Data tables/charts/search/empty/loading/error/stale states.
G. Motion and performance.
H. Authentication/login and Three.js decorative scene.
I. Authorization-aware visibility and role/persona UX.
J. Final evidence and live verification.

Known current issues to explicitly re-check, not blindly assume:
- Dashboard replaces the universal Topbar through its topbar slot.
- Semantic status color pairs include <4.5:1 text contrast combinations.
- --status-success / --status-error may be used without token definitions.
- Topbar approvalCount/notificationCount default to 0 and AppLayout does not supply real counts.
- FormErrorSummary lacks linked field-error entries.
- Quarantine template create lacks a consistent loading/double-submit/result contract.
- Collapsed sidebar relies primarily on title instead of a visible hover/focus tooltip.
- Global DotLottie background is continuous decorative motion and adds significant asset/runtime weight.
- Login has no password visibility control.
- Three.js package uses a range instead of an exact pin.
- Real 200% production zoom, current deployed SHA identity, multi-role live UX, live no-JS mutation recovery and Web Vitals remain NOT VERIFIED unless actually run.

Deliver:
1. Updated source-backed finding ledger with severity and exact evidence.
2. Route × state × viewport × role coverage matrix.
3. Before/after UI contract table.
4. Test commands and exact pass/fail/skip counts.
5. Separate SOURCE VERIFIED / AUTOMATION VERIFIED / LIVE VERIFIED / NOT VERIFIED labels.
6. No subjective overall percentage. Only reproducible fractions.
7. Final verdict:
   - APPROVE
   - NEEDS CHANGES
   - BLOCK
with evidence.

Then execute the Phase 2 Master Improvement Prompt, followed by Prompts 1–22 below in order. Deep-dive prompts extend the core tracks; they must not re-implement already-closed work.
```

---

# PHASE 2 MASTER PROMPT — Current UI/UX Improvement & Development

> **الحالة:** ✅  مُنجز

```text
You are now entering Phase 2: Improvement, Remediation, and Product-Level UI/UX Development for:

YEEEAE/QC-Operations-Laboratory-Management-System

The previous phase established the audit baseline.
This phase must actively improve the current implementation.

Do NOT redesign the application from scratch.
Do NOT replace the approved product identity.
Do NOT simplify or remove valid QC workflows merely to make the interface cleaner.

Goal:
Evolve the existing system into a highly polished, enterprise-grade, operational QC / Laboratory Management experience while preserving its business truth, authorization model, architecture, state machines, auditability and approved design direction.

REQUIRED FIRST STEPS

1. Read:
   .agents/mind/01-mind-latest.md

2. Freeze and record:
   - current branch
   - exact HEAD SHA
   - git status
   - git diff
   - Node version
   - pnpm version
   - current timestamp

3. Read completely:
   .opencode/skills/ui-ux-pro-max/SKILL.md

4. Use the repository-local datasets when relevant:
   .opencode/skills/ui-ux-pro-max/data/ux-guidelines.csv
   .opencode/skills/ui-ux-pro-max/data/stacks/astro.csv
   .opencode/skills/ui-ux-pro-max/data/stacks/threejs.csv
   .opencode/skills/ui-ux-pro-max/data/icons.csv
   .opencode/skills/ui-ux-pro-max/data/charts.csv
   .opencode/skills/ui-ux-pro-max/data/typography.csv
   .opencode/skills/ui-ux-pro-max/data/colors.csv

5. Read governing documents:
   Documents/DESIGN-SYSTEM.md
   Documents/UI-UX-SPECIFICATION.md
   Documents/AUTHORIZATION-VISIBILITY-DECISION.md
   Documents/BUSINESS-RULES.md
   Documents/PERMISSION-MATRIX.md
   Documents/ROLE-MATRIX.md
   Documents/STATE-MACHINES.md
   Documents/SYSTEM-INVARIANTS.md

6. Read the latest UI/UX audit, but verify every old finding against the current source before changing it.

CORE PRODUCT RULES

Approved visual direction:
Unified Dark Enterprise QC Control Room

The experience must feel:
- Enterprise
- Controlled
- Professional
- High-trust
- Operational
- Precise
- Fast
- Data-rich
- Calm
- Modern
- Medical / Quality focused

It must NOT drift toward:
- generic SaaS dashboard
- gaming UI
- crypto dashboard
- marketing website
- Dribbble concept UI
- over-glowing cyberpunk UI
- excessive glassmorphism
- decorative complexity without operational value

Never break:
PASS != RELEASED
Backup completed != Restore verified
AI recommendation != Business decision
Page visibility != Mutation authority
Frontend permission state != Server authorization
Unknown / Unverified != Healthy

PRIORITY

P0 — Global shell / navigation / accessibility / operational truth
P1 — Forms / controlled workflows / feedback / responsive behavior
P2 — Data presentation / typography / spacing / visual hierarchy
P3 — Motion / polish / micro-interactions
P4 — Performance refinement

GLOBAL SHELL

Improve the shared shell so every authenticated page behaves like one product.

Review:
- AppLayout
- Topbar
- Sidebar
- navigation model
- Dashboard shell integration

Preserve:
- navigation toggle
- breadcrumb/current location
- authorized scope context
- global search
- notifications
- approvals
- account/profile
- mobile navigation

Pages may extend the top context area but must not silently replace critical global controls.

SIDEBAR / MOBILE DRAWER

Desktop:
- strong domain grouping
- clear current location
- consistent SVG icon family
- consistent icon size/stroke
- robust collapsed mode
- visible tooltip/label on hover AND keyboard focus
- no hover-only required action

Mobile drawer:
- background workspace inert while open
- background scroll locked
- focus contained
- visible close affordance
- Escape closes
- focus returns to opener
- breakpoint transition removes stale inert/scroll lock

TOPBAR

Counts and statuses must reflect authorized server data.
Never present unavailable provider data as factual 0.
No cross-scope leakage.
Contextual badge updates must not steal focus.

DESIGN TOKENS

Audit:
- primitive colors
- semantic colors
- surfaces
- text
- borders
- focus
- statuses
- spacing
- radius
- typography
- motion
- density

Detect:
- undefined CSS variables
- conflicting semantic aliases
- duplicated hardcoded values
- page-specific visual drift

CONTRAST

Calculate real WCAG contrast for actual foreground/background combinations.
Normal text >= 4.5:1.
Meaningful non-text state/boundary contrast >= applicable 3:1.

Do not collapse semantic distinctions merely to pass contrast.

TYPOGRAPHY / SPACING

Refine:
- page titles
- section titles
- table headers
- body text
- metadata
- labels
- helper text
- statuses
- KPI values
- empty states
- errors

Use existing spacing and type scales.
Reduce arbitrary spacing and random one-off font sizes.
Optimize for long-duration operational scanning, not marketing drama.

FORMS

Treat data-entry quality as a primary system capability.

Review every create/edit/controlled form for:
- labels
- required communication
- grouping
- helper text
- validation
- linked error summaries
- retained values
- loading
- submit state
- cancel/back
- keyboard flow
- mobile behavior

Avoid exposing raw UUIDs, JSON, internal version IDs or implementation enums when an authorized contextual selector is possible.

ASYNC / MUTATION CONTRACT

Standardize:
IDLE
SUBMITTING
SUCCESS
VALIDATION_ERROR
CONFLICT_STALE
AUTHORIZATION_CHANGED
DEPENDENCY_UNAVAILABLE
UNKNOWN_SAFE_ERROR

During submission:
- disable initiating action
- aria-busy
- visible progress
- prevent duplicate submit
- do not freeze unrelated navigation

Preserve no-JavaScript POST behavior.

CONTROLLED ACTIONS

Review:
Approve
Reject
Release
Close
Void
Supersede
Restore
Role/permission changes
Electronic signature

Use specific action copy.
Introduce deliberate friction where irreversible/regulated.
Remove unnecessary friction from routine safe actions.

TABLES / FILTERS / STATES

Tables:
- predictable hierarchy
- alignment
- density
- sort/filter state
- pagination
- complete identifiers
- readable statuses
- contained mobile horizontal scrolling
- accessible captions/headers
- no hover-only row actions

Filters:
- active state clear
- easy clear/reset
- labels preserved
- no giant filter form unless justified

Empty/loading/error/stale states must preserve operational truth.
Never display 0 / Healthy / No records before the real query resolves.

DASHBOARD

Treat Dashboard as QC Operational Command Center.

It should quickly answer:
- what requires attention
- what changed
- what is overdue
- what is blocked
- what needs approval
- what quality risk exists
- what equipment/calibration risk exists
- what workload/trend matters

No fake metrics.
Every KPI/chart must map to real backend semantics.

SEARCH / NOTIFICATIONS / APPROVALS

Search:
- authorized results only
- useful record context
- keyboard navigation
- no-result recovery
- deep links

Notifications / approvals:
- real records
- real authorized counts
- truthful unread/actionable state
- no false zero
- no competing live regions

LOGIN / THREE.JS

Keep the premium QC medical 3D direction.

Verify:
- login usable without WebGL
- password manager support
- paste support
- Show/Hide password
- keyboard focus
- mobile
- reduced motion
- safe fallback

Three.js:
- one renderer
- DPR cap
- responsive camera
- pause hidden tab
- context-loss fallback
- cleanup resources
- measure CPU/GPU/JS/LCP/mobile stability
- exact version pin if consistent with repository policy

MOTION

Classify motion as:
- functional
- feedback
- orienting
- state-transition
- decorative
- brand expression

Do not animate operational surfaces merely for style.
Measure global Lottie/background cost before deciding Keep / Reduce / Scope / Replace.

RESPONSIVE / ZOOM

Test real pages at:
320, 375, 414, 768, 1024, 1440

Also:
- real browser 200% zoom
- browser text-spacing overrides
- representative long IDs/names
- tables
- forms
- admin
- reports
- controlled actions

No page-level horizontal overflow.
No clipped essential text.
No inaccessible controls.

ACCESSIBILITY / ERGONOMICS

Target WCAG 2.2 AA.

Verify:
- keyboard
- focus visibility
- focus not obscured
- skip link
- headings
- labels
- ARIA names/states
- status semantics
- error announcements
- target size
- reflow
- reduced motion
- forced colors
- accessible authentication

Balance accessibility with dense enterprise ergonomics.

PERFORMANCE

Measure before and after:
- LCP
- INP
- CLS
- JS
- long tasks
- Lottie/WASM
- GLB
- route payload
- font loading
- canvas/GPU behavior where possible

Astro should ship only necessary client JavaScript.

EXECUTION BATCHES

Batch 1 — Global shell + navigation + topbar
Batch 2 — Design tokens + contrast + typography
Batch 3 — Forms + validation + feedback
Batch 4 — Tables + filters + data states
Batch 5 — Dashboard + charts + information hierarchy
Batch 6 — Responsive + zoom + accessibility
Batch 7 — Login + motion + Three.js + performance
Batch 8 — Role/persona UX verification
Batch 9 — Final closure

After each batch:
- inspect diff
- run targeted tests
- check regressions
- record evidence
- continue

DO NOT USE SUBJECTIVE SCORES

Report measurable values:
- findings closed X/Y
- routes checked X/Y
- viewports checked X/Y
- roles checked X/Y
- forms checked X/Y
- accessibility violations
- contrast failures
- tests pass/fail/skip
- NOT VERIFIED scenarios

FINAL OUTPUT

A. What changed
B. Before → After
C. Remaining findings by severity
D. SOURCE / AUTOMATION / LIVE / NOT VERIFIED evidence
E. Reproducible metrics
F. Final verdict: APPROVE / NEEDS CHANGES / BLOCK

You may modify the local working tree as needed.
You may NOT commit, push, merge, deploy, publish, modify production data, or perform destructive production operations.

Do not stop at recommendations when a finding is safely fixable locally:
inspect → reproduce → implement → test → verify.
```

---

# PROMPT 1 — Design Tokens, Semantic Color & Visual Contract

> **الحالة:** ✅  مُنجز

```text
Audit and remediate the global visual-token contract using the repo-local ui-ux-pro-max skill.

Read first:
- Documents/DESIGN-SYSTEM.md
- src/ui/styles/tokens.css
- src/ui/styles/global.css
- src/ui/components/StatusBadge.astro
- every component/page using semantic status variables.

Do not replace the approved dark enterprise direction.

Tasks:
1. Enumerate every CSS custom property defined under src/ui/styles.
2. Enumerate every var(--*) consumed by src/pages and src/ui.
3. Fail the audit on any undefined consumed token.
4. Specifically verify --status-success and --status-error usage.
5. Calculate WCAG contrast for every actual foreground/background pair used for:
   - body text
   - secondary/muted text
   - field hints
   - field errors
   - links
   - status badges
   - health/backup pills
   - buttons
   - focus rings
   - disabled states
6. Normal text must meet >=4.5:1.
7. Meaningful non-text states/boundaries must meet applicable >=3:1 contrast.
8. Preserve semantic distinctions:
   PASS != RELEASED
   APPROVED != PASS
   HOLD != FAIL
   REVIEW != DRAFT
9. Never solve contrast by making all statuses the same color.
10. Add automated token/contrast tests so future palette edits cannot regress.
11. Search Pro Max locally for focused color/contrast guidance; do not fabricate search output.

Acceptance:
- zero undefined UI tokens.
- zero normal-text contrast failures in supported rendered combinations.
- status label always includes text, not color only.
- forced-colors remains understandable.
- design-system docs and runtime tokens agree.
- unit + accessibility tests pass.

Do not change business state names or status meaning.
```

---

# PROMPT 2 — Universal App Shell, Dashboard, Navigation & Topbar

> **الحالة:** ✅  مُنجز

```text
Repair the universal navigation/context architecture without changing authorization.

Primary files:
- src/ui/layouts/AppLayout.astro
- src/ui/shell/Topbar.astro
- src/ui/shell/Sidebar.astro
- src/ui/navigation/navigation.ts
- src/pages/dashboard/index.astro

Governing spec:
Documents/UI-UX-SPECIFICATION.md sections for Universal App Shell, Sidebar and Top Context Bar.

Critical requirement:
No page may replace the global shell controls merely to show page-specific context.

Fix Dashboard:
- Preserve universal navigation toggle.
- Preserve breadcrumbs/current location.
- Preserve global search.
- Preserve authorized scope context.
- Preserve notifications.
- Preserve My Approvals.
- Preserve user/profile menu.
- Put "QC Operational Command Center" and snapshot/scope page-specific content inside a safe extension area or page content, not as a replacement for the entire Topbar.

Mobile:
- Open-navigation control must be present on Dashboard at 320/375/414.
- Open drawer isolates workspace.
- Background scroll locked.
- Tab/Shift+Tab contained.
- Escape closes.
- Focus returns to opener.
- Breakpoint changes release inert/scroll locks.
- Provide a clear dismiss affordance inside the mobile drawer if the global opener becomes inert while open; do not rely only on selecting a route.
- Keep direct links and browser back behavior predictable.

Collapsed desktop sidebar:
- Keep accessible name.
- Add visible label/tooltip on both hover and keyboard focus.
- Do not rely only on title.
- Keep active state visible without color-only communication.

Topbar counts:
- notification/approval counts must come from authorized server data.
- Never convert unavailable count data into a false zero.
- Never leak cross-scope counts.
- Contextual live updates must not steal focus.

Verification:
- dashboard + representative page in every top-level nav group.
- desktop expanded/collapsed.
- 320, 375, 414, 768, 1024, 1440.
- keyboard only.
- forced colors.
- reduced motion.
- exact role visibility rules from AUTHORIZATION-VISIBILITY-DECISION.md.

Add/repair tests so they fail if Dashboard ever removes the global shell again.
```

---

# PROMPT 3 — Accessibility, Reflow, Zoom & Focus Closure

> **الحالة:** ✅  مُنجز

```text
Perform a WCAG 2.2 AA closure pass across the complete product using the local ui-ux-pro-max UX dataset.

Use focused searches for:
- focus not obscured
- target size minimum
- text reflow spacing
- keyboard navigation
- accessible authentication
- contextual live badge updates
- compact control semantics
- error summary validation

Required surfaces:
- login
- dashboard
- all list pages
- all create forms
- all detail pages
- review/approve/release/e-sign pages
- admin
- quarantine
- laboratory
- assets
- documents
- reports
- audit
- backups
- system health
- search
- notifications
- account
- 404/error surfaces

Verify:
1. One logical H1 per page and heading hierarchy.
2. Skip link works.
3. Every interactive control is keyboard reachable.
4. No positive tabindex ordering.
5. Focus is visible and not obscured by sticky/fixed UI.
6. No keyboard traps except intentional contained overlays with escape path.
7. Icon-only controls have accessible names and state.
8. Decorative SVG/canvas is hidden from accessibility tree.
9. Forms have labels, hints, required communication and announced errors.
10. Status is never color-only.
11. Tables have caption/header scopes.
12. Charts expose meaningful accessible summaries/data alternatives.
13. Reduced motion.
14. Forced colors.
15. 200% real browser zoom.
16. user text-spacing override.
17. 320px reflow.
18. long unbroken identifiers.
19. focus after async validation and stale/conflict responses.
20. authentication allows paste/password managers.

Do not use native-app 44pt/48dp as a fake web WCAG requirement.
For web conformance follow the Pro Max WCAG Target Size rule and then separately improve mobile ergonomics when justified.

Run axe WCAG 2.2 AA plus manual keyboard assertions.
Record every skipped authenticated test as NOT VERIFIED.
```

---

# PROMPT 4 — Forms, Validation, Error Recovery & Controlled Action UX

> **الحالة:** ✅  مُنجز

```text
Standardize the complete mutation UX without weakening server controls.

Inventory every:
- create
- edit
- submit
- review
- approve
- reject
- close
- release
- void
- supersede
- restore intent
- role/permission change
- e-signature/reauthentication form.

Preserve:
- server-side authorization.
- state machines.
- optimistic concurrency.
- audit/outbox.
- no-JS POST baseline.
- retained values.
- safe redirect/back context.
- no raw technical identifiers unless operationally required.

Upgrade FormErrorSummary:
- focusable summary after failed submit.
- list each invalid field.
- each item links to the exact invalid control.
- inline field errors remain.
- aria-describedby stays correct.
- recovery action is specific and truthful.

Create one shared async mutation interaction contract:
IDLE
SUBMITTING
SUCCESS
VALIDATION_ERROR
CONFLICT_STALE
AUTHORIZATION_CHANGED
DEPENDENCY_UNAVAILABLE
UNKNOWN_SAFE_ERROR

During SUBMITTING:
- disable triggering submit action.
- expose aria-busy.
- visible progress text.
- prevent duplicate submission.
- never disable unrelated navigation unnecessarily.

On failure:
- preserve user input.
- focus summary/status appropriately.
- no stack traces/raw SQL/provider secrets.
- provide next action.

Specifically fix quarantine template creation:
- real status output exists.
- submit feedback exists.
- no double-submit.
- fallback server POST remains valid.

Authentication:
- add Show/Hide Password with semantic button.
- preserve autocomplete/current-password.
- do not block paste.
- do not expose password value to logging/analytics.

Also audit required indicators and progressive disclosure to avoid overwhelming controlled forms.

Tests:
JS + no-JS + slow response + double click + validation + stale + authorization + dependency failure + success.
```

---

# PROMPT 5 — Data-Dense UX: Tables, Charts, Search, Notifications & Operational States

> **الحالة:** ✅  مُنجز


```text
Audit every data-heavy and decision-heavy surface as an enterprise QC workspace, not a generic admin template.

Scope:
- Dashboard KPIs/attention/activity.
- Findings/NCR/RCA/CAPA.
- Receiving/inspection/quarantine.
- Laboratory.
- Equipment/calibration/maintenance.
- Controlled documents.
- Change requests.
- Approvals.
- Reports.
- Audit.
- Backups.
- Search.
- Notifications.
- Admin registers.

For every list/table:
- clear page title/context.
- useful filters.
- deterministic sort state.
- pagination state.
- empty state.
- loading state.
- provider unavailable state.
- stale data state where relevant.
- contained horizontal scroll on narrow screens.
- complete essential identifiers.
- no accidental truncation of safety/action/state text.
- accessible caption and header scopes.
- row action discoverability without hover-only interaction.
- bulk action only where business rules permit.

Charts:
- choose chart only when it answers a real operational question.
- no decorative chart.
- legend/axis/units.
- accessible colors.
- textual/table alternative.
- tooltips not hover-only.
- no color-only state.
- empty/no-series state explains truthfully what is missing.

Search:
- authorized results only.
- no unauthorized-result-then-deny pattern.
- keyboard operation.
- no-result recovery suggestions.
- preserve deep links.

Notifications/Approvals:
- counts match authorized actionable records.
- links open real record context.
- unread/pending status is truthful.
- avoid competing live regions.
- no false zero from unavailable provider.

Do not invent dashboards or metrics that the backend cannot support.
```

---

# PROMPT 6 — Responsive Layout, Mobile Ergonomics & Information Density

> **الحالة:** ✅  مُنجز



```text
Run a full responsive and density audit using current content, not synthetic empty pages only.

Target widths:
320, 375, 414, 768, 1024, 1440.

Also test:
- phone portrait.
- phone landscape where meaningful.
- tablet.
- desktop.
- 200% browser zoom.
- browser text spacing overrides.

For each route family validate:
- no page-level horizontal scrolling.
- tables own their horizontal scroll region.
- fieldsets/grids shrink correctly.
- action bars wrap/reflow.
- no essential text is clipped.
- status badges remain readable.
- long names/IDs wrap safely.
- sticky/fixed regions do not cover focused controls.
- mobile drawer remains accessible.
- form submit/cancel remains reachable.
- dialogs/panels stay within viewport.
- hit targets are not tightly packed.
- desktop data density remains efficient.

Do not convert every desktop table into cards by default.
Preserve dense tables when horizontal scroll is the clearer enterprise pattern.

Review density tokens:
comfortable / standard / compact
and ensure compact mode never drops text/focus/touch usability below acceptable web behavior.

Add E2E assertions for bounding boxes and overflow.
```

---

# PROMPT 7 — Motion, Lottie, Three.js & Front-End Performance

> **الحالة:** ✅  مُنجز


```text
Audit motion as an operational UX dependency, not a visual decoration exercise.

Read:
- src/ui/components/SystemBackground.astro
- src/ui/components/QCLogin3DBackground.astro
- public/assets/*
- package.json
- Pro Max Astro stack data
- Pro Max Three.js stack data.

SystemBackground:
- quantify Lottie asset transfer.
- quantify WASM transfer.
- quantify runtime JS.
- measure CPU/main-thread impact while idle and while operating forms/tables.
- evaluate whether infinite decorative animation adds value on every authenticated page.
- preserve prefers-reduced-motion.
- preserve page-visibility pause and safe fallback.
- consider static/CSS background for operational workspaces if evidence shows no functional benefit.

Three.js login:
- keep it decorative and pointer-inert.
- login form must work before/without WebGL.
- verify one renderer only.
- cap DPR.
- pause hidden tab.
- respect reduced motion.
- dispose geometry/material/texture/renderer.
- handle context lost.
- keep responsive camera.
- measure GLB transfer and JS parse.
- verify mobile GPU stability.
- pin Three.js exact version if consistent with repository dependency policy; do not mix core/addon versions.

Measure:
- LCP
- INP
- CLS
- TTFB as context
- JS transferred/executed
- long tasks
- canvas/GPU memory behavior where tooling permits.

Do not declare performance improved because code “looks optimized”.
Capture before/after numbers.
Do not remove the 3D design unless measurements or usability evidence justify it.
```

---

# PROMPT 8 — Authorization-Aware UX, Roles & Controlled Workflow Clarity

> **الحالة:** ✅  مُنجز

```text
Validate that the interface reflects the approved authorization model without treating visibility as security.

Read:
- Documents/AUTHORIZATION-VISIBILITY-DECISION.md
- Documents/PERMISSION-MATRIX.md
- Documents/ROLE-MATRIX.md
- Documents/STATE-MACHINES.md
- Documents/BUSINESS-RULES.md.

Build disposable test personas:
- ordinary active member / data entry
- supervisor
- manager
- admin
- SYSTEM_OWNER yazeed
- unauthorized/inactive persona where supported.

Verify ordinary active members:
- ordinary operational navigation is discoverable as approved.
- ordinary operational routes/data read access follows AVD.
- sensitive owner/admin areas remain hidden/denied as specified.
- action controls are permission/state/scope aware.
- disabled/hidden actions never imply that page visibility grants authority.

For each controlled workflow verify UX:
- current state is obvious.
- available next actions are obvious.
- unavailable action has truthful reason where disclosure is safe.
- approval/rejection/release/void/restore wording is specific.
- reauthentication/e-signature appears only where policy requires it.
- stale/version conflict gives recovery.
- separation-of-duties behavior is visible but not over-exposed.
- direct route denial is safe.
- no existence leakage where the security model intentionally uses indistinguishable empty states.

Special semantic truths:
- PASS != RELEASED.
- inspection/lab result does not automatically release product.
- backup success != verified restore.
- AI suggestion != business decision.

Do not change any policy to make the UI easier.
Change presentation around the policy.
```

---

# PROMPT 9 — Design System Maturity Deep Dive

> **الحالة:** ✅  مُنجز


```text
Act as a Principal Design Systems Architect.

Mature the existing QC design system into a coherent, reusable enterprise-grade foundation without replacing the approved visual identity.

Audit and improve:
- primitive tokens
- semantic tokens
- component tokens
- spacing
- typography
- surfaces
- borders
- elevation
- radius
- status colors
- focus
- motion
- density
- icons
- forms
- tables
- navigation
- charts
- feedback

Detect:
- duplicated values
- hardcoded colors
- undefined CSS variables
- inconsistent spacing
- uncontrolled component variants
- missing interaction states
- one-off components
- conflicting visual patterns

Create explicit contracts for:
default
hover
focus
active
selected
disabled
loading
error
warning
success
stale
read-only

Preserve semantic distinctions:
PASS != RELEASED
APPROVED != PASS
HOLD != FAILURE
DRAFT != REVIEW

Build reusable primitives only where repeated evidence justifies them.
Do not abstract prematurely.

Use focused repo-local ui-ux-pro-max searches for:
- design system
- semantic colors
- typography
- icon semantics
- component states
- Astro token implementation

Deliver:
- token inventory
- component inventory
- duplicate patterns
- missing states
- implemented changes
- affected files
- tests
- remaining design-system debt
```

---

# PROMPT 10 — Information Architecture & Permissions Deep Dive

> **الحالة:** ☐ لم يُنجَز — بدّلها بـ ✅ عند الاكتمال


```text
Act as a Senior Information Architect specializing in regulated enterprise software.

Audit the complete information architecture of the QC system.

Map:
Domain
Page
Route
Navigation group
Record type
Primary user task
Secondary user task
Read visibility
Mutation permission
State restrictions
Scope restrictions
Next operational destination

Use these as authority:
- DOMAIN-MAP
- AUTHORIZATION-VISIBILITY-DECISION
- ROLE-MATRIX
- PERMISSION-MATRIX
- STATE-MACHINES
- BUSINESS-RULES

Evaluate whether a user can always answer:
- Where am I?
- What domain am I working in?
- What record am I viewing?
- What state is it in?
- What needs attention?
- What can I do next?
- Why can or cannot I perform an action?
- Where should I go afterward?

Audit:
- Sidebar
- Topbar
- Breadcrumbs
- Deep links
- Search
- Cross-domain links
- Related records
- Browser back
- Detail-to-list navigation
- Create-to-detail workflow
- Approval navigation
- Notifications
- Audit history
- Admin boundaries

Prevent:
- hidden operational capabilities
- dead-end screens
- duplicate destinations
- ambiguous labels
- permission-driven navigation confusion
- unnecessary hierarchy
- unauthorized existence leakage

Critical rule:
Page visibility != Mutation authority.

Do not hide ordinary operational pages merely because the current user cannot mutate them when the approved AVD grants read visibility.

Produce:
Route → Domain → Task → Read visibility → Permission → State → Next action

Implement justified IA improvements without changing security policy.
```

---

# PROMPT 11 — Interaction Design Deep Dive

> **الحالة:** ☐ لم يُنجَز — بدّلها بـ ✅ عند الاكتمال

```text
Act as a Principal Interaction Designer for mission-critical enterprise software.

Audit every meaningful interaction:
click
keyboard
hover
focus
selection
filtering
search
submit
approve
reject
release
void
restore
edit
cancel
drawer
modal
dropdown
table action
pagination
sorting
notifications

For every interaction define:
- trigger
- immediate feedback
- intermediate state
- completion
- failure
- cancellation
- recovery
- keyboard behavior
- focus behavior
- permission/state dependency

Eliminate:
- silent actions
- duplicate submission
- hover-only functionality
- unstable layout changes
- unexpected page jumps
- unclear disabled states
- ambiguous click targets
- unnecessary confirmations
- missing confirmations for genuinely destructive/irreversible actions

Use progressive disclosure for complex operations.

For high-risk controlled actions, introduce deliberate and understandable friction.
For routine safe work, reduce unnecessary friction.

Motion must communicate state or orientation, not exist only for visual novelty.

Implement shared interaction patterns instead of page-specific hacks.
```

---

# PROMPT 12 — Advanced Form Design Deep Dive

> **الحالة:** ☐ لم يُنجَز — بدّلها بـ ✅ عند الاكتمال

```text
Act as an expert in enterprise and regulated-data Form UX.

Audit every form across:
Tasks
Findings
NCR
RCA
CAPA
Receiving
Inspection
Laboratory
Equipment
Calibration
Maintenance
Documents
Change Requests
Administration
Controlled actions

For every field assess:
- necessity
- label
- data type
- default
- required status
- format
- allowed values
- dependencies
- validation timing
- help text
- error text
- permission
- state restriction

Remove unnecessary operator exposure to:
- UUID
- raw JSON
- database identifiers
- internal version IDs
- backend field names
- implementation enums

when a contextual authorized control can represent the same concept safely.

Group forms around the human task, not database schema.

Improve:
- field hierarchy
- section grouping
- defaults
- autocomplete
- input types/inputmode
- selectors
- date/time
- units
- required indicators
- inline validation
- linked error summary
- retained values
- submission feedback
- cancel/back
- keyboard flow
- mobile reflow

Do not force users to re-enter data the system already knows unless security or business rules require it.

Preserve no-JavaScript POST fallbacks and server truth.
```

---

# PROMPT 13 — UX Writing & Microcopy Deep Dive

> **الحالة:** ☐ لم يُنجَز — بدّلها بـ ✅ عند الاكتمال

```text
Act as a Senior UX Writer for regulated medical/QC enterprise software.

Audit every user-facing string:
- navigation
- page titles
- buttons
- labels
- helper text
- empty states
- loading
- errors
- warnings
- confirmations
- success messages
- dialogs
- tooltips
- notifications
- System Health
- Backup/Restore
- AI Advisory
- permissions
- audit history

Make copy:
Clear
Specific
Operational
Short
Human-readable
Consistent
Action-oriented
Truthful

Avoid backend/internal wording where it leaks implementation rather than helping the operator.

Prefer precise actions:
Create task
Submit for review
Approve document
Reject inspection
Release item
Save changes

over generic:
Submit
Continue
Process
Confirm

Do not make messages falsely reassuring.

Preserve semantic truths:
Backup created != Restore verified
Inspection passed != Item released
AI recommendation generated != Approved decision
Provider unavailable != Zero records

Create and apply a reusable UX vocabulary dictionary for canonical terms and action labels.

Do not rename regulated domain terms without evidence and document authority.
```

---

# PROMPT 14 — Accessibility & Ergonomics Deep Dive

> **الحالة:** ☐ لم يُنجَز — بدّلها بـ ✅ عند الاكتمال

```text
Act as a WCAG 2.2 AA Accessibility Engineer and enterprise ergonomics specialist.

Audit beyond automated axe output.

Test:
- keyboard only
- screen-reader semantics
- visible focus
- focus not obscured
- focus restoration
- heading hierarchy
- landmarks
- skip navigation
- form labels
- error announcements
- tables
- charts
- status semantics
- icon buttons
- dialogs
- drawers
- authentication
- reduced motion
- forced colors
- real 200% zoom
- text spacing
- 320px reflow

Evaluate ergonomics for long-duration QC work:
- information density
- eye travel
- repetitive actions
- control placement
- data-entry fatigue
- table scanning
- error prevention
- target spacing
- keyboard efficiency
- long-session usability

Do not blindly enlarge everything like a consumer mobile app.
This is a desktop-first enterprise operational product.

Balance:
Accessibility
Precision
Density
Speed
Comfort

Separate evidence into:
AUTOMATED VERIFIED
MANUAL VERIFIED
NOT VERIFIED

Add tests where feasible and do not claim manual verification that was not performed.
```

---

# PROMPT 15 — Dashboard & Data Visualization Design Deep Dive

> **الحالة:** ☐ لم يُنجَز — بدّلها بـ ✅ عند الاكتمال

```text
Act as a Principal Dashboard and Data Visualization Designer for Quality Control operations.

The Dashboard must be a decision surface, not decorative analytics.

Determine what the user needs to know:
Now
Today
This week
Overdue
Blocked
Pending review
Pending approval
Quality risk
Equipment risk
Calibration risk
Laboratory workload
Recent activity
Meaningful trends

For every KPI/chart verify:
- purpose
- source
- time range
- metric definition
- unit
- audience
- actionability
- permission/scope
- empty state
- unavailable state
- drill-down destination

Select visualization based on the question:
Trend → line
Category comparison → bar
Distribution → histogram only when justified
Part-to-whole → only when a meaningful total exists
Status composition → categorical/stacked representation
Timeline → timeline

Avoid pie charts when exact comparison matters or category count is large.

Never invent backend data.

Improve:
- hierarchy
- alert priority
- chart labels
- legends
- tooltips
- accessible alternatives
- color semantics
- empty/loading/unavailable states
- contextual drill-down

Dashboard interactions should take users to useful operational context, not decorative dead ends.
```

---

# PROMPT 16 — Data-Driven Design & Product Analytics

> **الحالة:** ☐ لم يُنجَز — بدّلها بـ ✅ عند الاكتمال

```text
Act as a Data-Driven Product Designer.

Do not redesign based only on taste.

Define privacy-conscious UX measurements for:
- navigation usage
- search success
- zero-result searches
- validation failures
- form completion
- abandonment
- repeated submissions
- workflow duration
- error recovery
- feature usage
- responsive issues
- performance

Never collect:
- passwords
- secrets
- provider credentials
- unnecessary raw QC content
- raw controlled-document contents for analytics
- private identifiers without a justified purpose

Build a measurement plan:
Question
Metric
Event
Required attributes
Privacy classification
Retention requirement
Decision enabled

Separate:
Business audit trail
Security logging
Operational observability
Product analytics

They are not interchangeable.

Do not optimize solely for speed or click-through when compliance requires deliberate review.

If analytics infrastructure does not exist, create the design/specification and clearly label implementation as pending rather than fabricating data.
```

---

# PROMPT 17 — Motion & Digital Art Direction Deep Dive

> **الحالة:** ☐ لم يُنجَز — بدّلها بـ ✅ عند الاكتمال

```text
Act as a Motion Designer and Digital Art Director specializing in premium scientific enterprise software.

Audit:
- system background
- login Three.js
- Lottie
- navigation transitions
- drawers
- buttons
- status transitions
- charts
- loading
- feedback
- page transitions

Classify each motion:
Functional
Feedback
Orienting
State-transition
Decorative
Brand expression

Every animation must justify its existence.

Reduce/remove motion that:
- distracts operators
- consumes resources without value
- competes with data
- creates visual fatigue
- breaks reduced-motion expectations
- produces layout instability

Use purpose-based motion tokens instead of one duration everywhere.
Prefer transform/opacity when appropriate.

For the login art direction, preserve:
Medical quality
Precision
Inspection
Measurement
Verification
Material realism
Controlled lighting
Negative space

Avoid:
Sci-fi HUD clutter
Gaming visuals
Cyberpunk neon
Random particles
Decorative holograms

Authenticated workspaces should remain calmer than the login art surface.

Measure CPU/GPU and usability before increasing visual fidelity.
```

---

# PROMPT 18 — Privacy & Security UX

> **الحالة:** ☐ لم يُنجَز — بدّلها بـ ✅ عند الاكتمال

```text
Act as a Privacy UX and Security UX specialist.

Do not alter security architecture merely for convenience.

Review:
- login
- session expiry
- authorization denial
- member/admin management
- role/permission/scope management
- e-signature
- reauthentication
- controlled actions
- audit
- backup/restore
- AI Advisory
- System Health

Security UX must be:
Understandable
Non-alarming when unnecessary
Specific when action is required
Non-leaky
Recoverable
Consistent

Never expose:
- password hashes
- tokens
- provider credentials
- secret evidence
- raw restricted infrastructure diagnostics
- restricted entity existence when policy hides it

Avoid vague messaging when safe actionable information is available, but never disclose sensitive details for the sake of better copy.

Review:
- hidden vs disabled actions
- denial explanations
- session expiry recovery
- preservation of unsaved user input where safe
- reauthentication context
- e-signature intent clarity
- destructive action confirmations
- privacy implications of analytics/telemetry

Presentation must reinforce, not weaken, the security model.
```

---

# PROMPT 19 — Service Design & End-to-End QC Journeys

> **الحالة:** ☐ لم يُنجَز — بدّلها بـ ✅ عند الاكتمال

```text
Act as a Service Designer for a medical-products Quality Control department.

Move beyond individual pages and map complete operational journeys.

At minimum analyze:

Receiving item
→ Quarantine
→ Inspection
→ Laboratory testing if required
→ Finding/NCR when applicable
→ Disposition
→ Approval
→ Release
→ Audit history

Equipment
→ Calibration due
→ Warning/assignment
→ Execution
→ Review
→ Status update

Controlled document
→ Draft
→ Review
→ Approval
→ Effective version
→ Change request
→ Supersession

For every journey map:
Actor
Trigger
System touchpoint
Action
System response
Handoff
Wait state
Failure mode
Decision
Evidence
Completion
Next owner

Find:
- broken handoffs
- repeated data entry
- missing notifications
- unclear ownership
- dead ends
- missing next actions
- unnecessary navigation
- hidden dependencies
- unclear waiting states

Improve links and handoffs between existing domains without merging domain responsibilities merely for visual convenience.

Preserve audit and authorization boundaries.
```

---

# PROMPT 20 — UX Research & Heuristic Validation

> **الحالة:** ☐ لم يُنجَز — بدّلها بـ ✅ عند الاكتمال

```text
Act as a Senior UX Researcher.

Do NOT fabricate interviews, observations, user sentiment or analytics.

Separate:
OBSERVED EVIDENCE
REPOSITORY EVIDENCE
AUTOMATION EVIDENCE
ANALYTICS EVIDENCE
RESEARCH HYPOTHESIS
UNVERIFIED ASSUMPTION

Create role/task scenarios for:
- QC operator / data-entry user
- supervisor
- manager
- admin
- SYSTEM_OWNER

High-value scenario example:
Locate inspection
→ understand state
→ identify failure reason
→ find/create correct follow-up
→ return to original record

Evaluate:
- task success
- wrong-turn risk
- error rate
- recovery
- navigation confidence
- terminology comprehension
- decision confidence
- number of unnecessary steps

Use heuristic analysis:
- system status visibility
- match with QC real-world concepts
- user control/freedom
- consistency
- error prevention
- recognition over recall
- efficiency
- minimal design
- error recovery
- contextual help

Produce usability-test scripts and research questions.

Any untested recommendation must be labeled RESEARCH HYPOTHESIS until validated.
```

---

# PROMPT 21 — Cross-System Consistency & Final Polish

> **الحالة:** ☐ لم يُنجَز — بدّلها بـ ✅ عند الاكتمال

```text
Act as a Principal Product Designer performing a cross-system consistency pass.

Run only after core and deep-dive remediation.

Compare route families side-by-side for:
- page headers
- breadcrumbs
- action placement
- primary/secondary buttons
- status badges
- tables
- forms
- empty states
- errors
- loading
- pagination
- filters
- cards
- section spacing
- typography
- icons
- tooltips
- dialogs
- drawers
- notifications

Ask:
If two UI elements mean the same thing, do they look and behave the same?
If two elements look the same, do they actually mean the same thing?

Eliminate accidental inconsistency.
Preserve intentional domain differences.

Do not perform aesthetic cleanup before functional, accessibility and semantic findings are resolved.

Goal:
The product should feel like one intentionally designed operational system rather than independently assembled pages.
```

---

# PROMPT 22 — Final Independent Closure & Production Evidence

> **الحالة:** ☐ لم يُنجَز — بدّلها بـ ✅ عند الاكتمال

```text
After all UI/UX remediation, perform an independent closure audit from scratch.

Do not trust previous “fixed” labels.

Freeze:
- branch
- exact Git SHA
- build ID/release ID
- environment
- migration head
- deployed timestamp
- working-tree diff.

Produce four evidence layers:
1. SOURCE VERIFIED
2. AUTOMATION VERIFIED
3. LIVE VERIFIED
4. NOT VERIFIED

Re-run legacy findings:
F-01, F-02, F-03, F-04, F-05, F-06, F-07, F-09, F-10, F-11, F-12,
BI-01, BI-02, BI-03, BI-04.

Add specialist closure domains as explicit evidence tracks:
- Design System maturity and component-state consistency.
- Information Architecture & Permissions.
- Interaction Design.
- Advanced Form Design.
- UX Writing / Microcopy.
- Accessibility & Ergonomics.
- Dashboard & Data Visualization.
- Data-Driven Design / Product Analytics.
- Motion & Digital Art.
- Privacy & Security UX.
- Service Design / end-to-end journeys.
- UX Research hypotheses vs verified evidence.
- Cross-system consistency.

Add Pro Max findings:
- universal Dashboard Topbar.
- semantic contrast/token integrity.
- real notification/approval counts.
- linked form error summaries.
- mutation feedback/double-submit.
- collapsed navigation tooltip/focus.
- motion/performance.
- auth password visibility.
- Three.js reproducibility/performance.
- viewport/zoom contract.

Live read-only walkthrough:
- Login.
- Dashboard.
- every top-level route.
- representative list/detail/create page.
- System Health.
- Audit.
- Search.
- Reports.
- mobile drawer.
- 320px.
- real 200% zoom.
- keyboard.
- reduced motion.
- forced colors.

Mutation flows:
Use disposable non-production fixtures only.
Never mutate production for audit proof.

Role verification:
Use isolated fixtures for all required personas.

Run:
- unit tests
- integration tests
- architecture tests
- security tests
- typecheck
- lint
- format check
- build
- relevant E2E
- axe WCAG 2.2 AA
- performance measurement.

For each command report:
- exact command
- exit code
- passed
- failed
- skipped
- reason for skip.

Metrics:
- Legacy closure = CLOSED / 15.
- Live coverage = (PASS + FAIL) / planned scenarios.
- Live executed success = PASS / (PASS + FAIL).
- Conservative live success = PASS / planned scenarios.
- Pro Max findings = closed/open by severity.

Never round a non-100 value to 100.
Never call the product production-ready while HIGH/MEDIUM findings or critical NOT VERIFIED evidence remain.

Final verdict must be one:
APPROVE
NEEDS CHANGES
BLOCK

with a one-page executive evidence summary.
```
