# الحزمة النهائية — UI / UX Pro Max Prompts
## QC Operations & Laboratory Management System

هذه البرومبتات مصممة لـOpenCode/Codex Agent داخل المستودع نفسه.

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

Then execute Prompts 1–9 below in order without duplicating already-closed work.
```

---

# PROMPT 1 — Design Tokens, Semantic Color & Visual Contract

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

# PROMPT 9 — Final Independent Closure & Production Evidence

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
