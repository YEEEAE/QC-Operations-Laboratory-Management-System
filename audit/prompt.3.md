
## MASTER HEADER — ضعه في بداية كل Prompt

```text
REPOSITORY:
YEEEAE/QC-Operations-Laboratory-Management-System

TARGET:
main

MISSION:
Move the current repository toward evidence-backed closure across the complete 100-domain audit model.

CRITICAL RULE:
"100%" is a target, never an assumption.
Do NOT report 100%, READY, COMPLETE, PRODUCTION READY, PASS, FIXED, or CLOSED unless current repository/runtime evidence proves every applicable requirement.

BEFORE ANY CHANGE:

1. Read completely:
   - AGENTS.md
   - .agents/mind/01-mind-latest.md if present
   - Documents/SYSTEM-INVARIANTS.md
   - Documents/QC-SYSTEM-DESIGN-CONSTITUTION.md
   - Documents/BUSINESS-RULES.md
   - Documents/ROLE-MATRIX.md
   - Documents/PERMISSION-MATRIX.md
   - Documents/STATE-MACHINES.md
   - Documents/DATA-MODEL.md
   - Documents/DATA-DICTIONARY.md
   - Documents/REQUIREMENTS-TRACEABILITY.md
   - Documents/ARCHITECTURE-SPECIFICATION.md
   - Documents/SECURITY-ARCHITECTURE.md
   - Documents/DATABASE-ARCHITECTURE.md
   - Documents/ERROR-ARCHITECTURE.md
   - Documents/TESTING-STRATEGY.md
   - Documents/RISK-REGISTER.md
   - Documents/DESIGN-SYSTEM.md
   - Documents/UI-UX-SPECIFICATION.md
   - Documents/ROUTE-MANIFEST-SPECIFICATION.md
   - Documents/OBSERVABILITY-ARCHITECTURE.md
   - Documents/BACKUP-RECOVERY-PLAN.md
   - Documents/DEPLOYMENT-ARCHITECTURE.md
   - Documents/UAT-ACCEPTANCE-PLAN.md
   - Documents/PRODUCTION-READINESS-CHECKLIST.md

2. Inspect actual current repository reality.
3. Do not trust previous audit percentages.
4. Do not trust previous PASS/FIXED claims.
5. Freeze current reality:
   - date/time
   - branch
   - HEAD SHA
   - git status
   - git diff
   - Node version
   - pnpm version
   - migration head
   - current CI status
6. Inspect relevant tests before modifying implementation.
7. Use TDD for behavior changes.
8. Use systematic debugging for failures.
9. Use verification-before-completion.
10. Never weaken security merely to make a test/build/UI feature pass.

ARCHITECTURE INVARIANT:

Astro Page / Client
→ Action / API
→ Authenticated Context
→ Application Use Case
→ Authorization
→ Domain / State Rules
→ Transaction
→ Repository
→ PostgreSQL
→ Audit / Outbox / Notification

MANDATORY RULES:

- Default DENY.
- UI visibility is never authorization.
- Role is not permission.
- Admin is not automatically business authority.
- PASS must never automatically equal RELEASED.
- No silent overwrite.
- Preserve controlled record history.
- No destructive state transitions outside authoritative state machines.
- AI is advisory only.
- No AI approval/rejection/release/signature/official PASS/FAIL.
- No secrets committed.
- No raw SQL inside pages/actions.
- No fake scientific limits.
- No invented policy.
- No invented retention/RPO/RTO/approval authority.
- No broad try/catch that hides controlled failures.
- No direct DB modifications outside controlled migration/use-case paths.
- No security bypass for testing.
- No fake backup/restore success.
- Do not push, deploy, merge, or modify production unless explicitly authorized.

FOR EACH CHANGE:

1. Add or update tests first where behavior changes.
2. Implement the smallest authoritative fix.
3. Verify focused tests.
4. Run wider regression.
5. Inspect git diff.
6. Run git diff --check.
7. Search for:
   - secrets
   - TODO/FIXME
   - unauthorized Admin bypass
   - raw SQL in Delivery
   - arbitrary state assignment
   - unsafe file handling
   - silent errors
   - unverified production claims
8. Update documentation/traceability only to match reality.

FINAL RESPONSE FOR EACH PROMPT:

Return:
- Findings
- Root causes
- Files changed
- Tests added/changed
- Commands actually executed
- Exact PASS/FAIL results
- Remaining blockers
- Residual risks
- Domains improved
- Evidence references
- Suggested commit message

STOP after completing this prompt.
Do not automatically continue to the next prompt.
```

---

# PROMPT-01 — Reality Freeze + 100-Domain Master Audit

```text
PROMPT ID: QC-100-01
TITLE: Independent 100-Domain Reality Audit and Evidence Baseline

Use the MASTER HEADER.

MISSION:

Perform a completely fresh audit of the current repository against the following 100 domains.

Audit every domain independently:

1. Quality Engineering & Verification / Validation
2. QC Compliance Engineering / QMS Integration
3. Security Engineering / AppSec
4. Data Integrity & Records Integrity
5. Auditability & Traceability Engineering
6. Authentication / IAM / RBAC / Authorization Engineering
7. Database Engineering & Reliability
8. Workflow & Business Rules Engineering
9. Backup / Restore / Disaster Recovery
10. Requirements Engineering & Business Analysis
11. Software Architecture / System Architecture
12. Functional Workflow Correctness
13. Testing Architecture — Unit / Integration / Contract / E2E
14. Risk Management / Operational Risk
15. Electronic Records / Approval / E-Signature Integrity
16. Document Control Engineering — WI / SOP / Versions
17. Data Architecture & Data Governance
18. State Machine / Lifecycle Design
19. Error Architecture & Recovery Engineering
20. Reliability / Resilience Engineering
21. Privacy Engineering
22. Operational UX
23. QC Workflow UX
24. Role-Based UX & Permission UX
25. Advanced Form Design & Data Entry UX
26. Accessibility Design — A11y
27. Information Architecture & Permissions
28. Human Factors / Ergonomics
29. Performance Engineering
30. Observability / Monitoring / Alerting
31. Deployment / Release Engineering
32. Change Management / Configuration Management
33. Maintainability / Code Quality Engineering
34. API Design & Governance
35. Concurrency / Transaction Design
36. File / Attachment Security & Lifecycle
37. Product Design / Product Strategy
38. UX Design
39. Information Architecture
40. Interaction Design
41. Design System
42. Enterprise UX
43. Laboratory UX
44. Compliance UX
45. Dashboard Design
46. Data Visualization Design
47. Data-Driven Design
48. Advanced Table / Data Density Design
49. Search / Filter / Sorting UX
50. Navigation / Wayfinding / Breadcrumb Design
51. UI Design
52. Visual Design
53. Visual Hierarchy / Content Hierarchy
54. Responsive / Adaptive Design
55. Keyboard UX / Focus Management
56. Screen Reader / Semantic UX
57. Service Design
58. Handoff / Escalation / Queue UX
59. Notification Architecture & Notification UX
60. Audit Trail / Timeline UX
61. UX Writing / Microcopy
62. Error Message / Recovery UX
63. Loading / Latency / Perceived Performance UX
64. Unsaved Changes / Draft / Autosave UX
65. Destructive Action / Confirmation UX
66. UX Research / Usability Testing
67. Task Success / Time-on-Task Measurement
68. Design QA / UX QA
69. Design System Governance
70. Security UX
71. Privacy UX
72. Authentication / Session Expiry UX
73. Print / PDF / Export UX
74. Reporting Architecture & Reporting UX
75. Master Data Management — MDM
76. Data Quality Engineering
77. Data Lineage
78. CI/CD Engineering
79. Secure SDLC / Supply Chain Security
80. Environment Management — Dev/Test/Staging/Prod
81. Secrets Management
82. Incident / Problem Management
83. Business Continuity
84. Capacity Planning / Load Engineering
85. Developer Experience — DevEx
86. Technical Debt Management
87. Dependency Management
88. Content Design / Terminology Governance
89. Component Architecture
90. Component States Design
91. Design Tokens
92. Typography / Spacing / Layout Systems
93. Color / Semantic Color System
94. Iconography System
95. Microinteractions
96. Motion Design
97. Motion & Digital Art
98. AI Governance / AI Safety
99. AI Evals / Model Risk Management
100. Human-in-the-Loop AI UX

CREATE:

audit/100-percent/
  00-REALITY-FREEZE.md
  01-100-DOMAIN-SCORECARD.md
  02-GAP-REGISTER.md
  03-REQUIREMENT-TO-EVIDENCE-MATRIX.md
  04-CRITICAL-BLOCKERS.md

For each domain provide:

- Current score 0–100
- PASS / PARTIAL / FAIL / UNVERIFIED
- implementation evidence
- test evidence
- runtime evidence
- documentation evidence
- security evidence
- missing evidence
- critical gaps
- remediation IDs

Scoring must be reproducible.

A score of 100 requires:
- applicable requirements defined
- implementation exists
- automated verification exists where applicable
- negative-path verification exists
- current evidence exists
- runtime/UAT evidence where required
- no contradictory critical defect
- no unresolved critical risk

Do not fix broad issues in this prompt.
Create the authoritative baseline and remediation backlog first.
```

---

# PROMPT-02 — CI / Testing / Validation Closure

```text
PROMPT ID: QC-100-02
TITLE: Verification Architecture and Green CI Closure

Use the MASTER HEADER.

MISSION:

Make testing and CI evidence trustworthy enough to support every future closure claim.

Inspect:
- .github/workflows/**
- package.json
- vitest.config.ts
- playwright.config.ts
- tests/**
- scripts/**
- architecture checks
- release verification tooling

FIRST:
Investigate the most recent failing GitHub Actions state.
Do not assume the application caused the failure.
Determine exact root cause from workflow/job/runtime evidence.

REQUIRED COVERAGE:

Unit
Integration
PostgreSQL 18
Migration
Concurrency
Authorization negative tests
Security
Contract/API
Critical workflow
Accessibility
E2E
Error recovery
File/report/export
AI advisory safety
Backup/recovery validator
Release identity

REQUIREMENTS:

1. Eliminate tests that PASS trivially without asserting meaningful behavior.
2. No critical suite may silently use --passWithNoTests unless explicitly justified.
3. Every critical module must have:
   happy path
   validation failure
   authorization denial
   wrong-state denial
   concurrency/stale-state case when applicable
   audit evidence verification when applicable.
4. Add API/Action contract validation.
5. Add deterministic fixtures.
6. Detect test pollution.
7. Detect flaky tests.
8. Produce machine-readable results.
9. Ensure CI binds evidence to exact Git SHA.
10. Require all mandatory gates before release verification.

Run at minimum:

pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:architecture
pnpm test:unit
pnpm test:integration
pnpm test:migrations
pnpm test:concurrency
pnpm test:security
pnpm build
pnpm test:e2e

Do not call CI complete until a fresh run for the exact HEAD is green.

TARGET DOMAINS:
1, 12, 13, 19, 20, 29, 33, 68, 78, 79, 85, 87.
```

---

# PROMPT-03 — Security / IAM / RBAC / Privacy Zero-Gap Closure

```text
PROMPT ID: QC-100-03
TITLE: AppSec, IAM, Authorization and Privacy Closure

Use the MASTER HEADER.

MISSION:

Perform offensive and defensive review of authentication, sessions, permissions,
scope enforcement, IDOR resistance, CSRF, XSS, injection, file access,
rate limiting, secrets and privacy.

INSPECT:

src/middleware.ts
src/shared/security/**
src/modules/identity/**
src/modules/administration/**
permission repositories
authorization services
protected actions/APIs/pages
session storage
cookies
security headers
rate limiter
audit events
file routes
reports/exports
search
notifications

VERIFY:

- Default Deny
- server-side permission enforcement
- scope enforcement
- no role-only authorization
- no Admin blanket bypass
- IDOR substitution denial
- direct URL bypass denial
- direct Action/API bypass denial
- wrong-state denial
- revoked permission behavior
- revoked role behavior
- disabled account behavior
- session expiry
- logout invalidation
- stale/revoked session
- account enumeration protection
- secure cookies
- SameSite
- HttpOnly
- Secure
- CSP
- HSTS
- clickjacking prevention
- MIME sniffing protection
- CSRF protection
- SQL injection resistance
- XSS output handling
- open redirect resistance
- rate limiting
- fail-closed production security configuration
- secrets redaction
- sensitive logging
- least-privilege DB runtime role
- protected health/admin interfaces
- private evidence files
- privacy minimization.

CREATE/UPDATE SECURITY TESTS FOR EVERY HIGH-RISK PATH.

Also create:

audit/100-percent/SECURITY-ATTACK-MATRIX.md

Columns:
attack vector
target
precondition
expected denial
test
result
evidence

TARGET DOMAINS:
3, 5, 6, 21, 24, 27, 36, 70, 71, 72, 79, 81.
```

---

# PROMPT-04 — Database / Integrity / Concurrency / Governance Closure

```text
PROMPT ID: QC-100-04
TITLE: PostgreSQL, Data Integrity, Concurrency and Governance Closure

Use the MASTER HEADER.

MISSION:

Make PostgreSQL the authoritative and reliable controlled data layer.

INSPECT:

db/migrations/**
db/seeds/**
scripts/db/**
src/shared/database/**
all module repositories
DATA-MODEL
DATA-DICTIONARY
DATABASE-ARCHITECTURE
STATE-MACHINES

VERIFY ALL MIGRATIONS on fresh PostgreSQL 18.

REQUIREMENTS:

1. Fresh install 0001 → current head works.
2. Upgrade path works.
3. Migration checksums immutable.
4. Schema migrations are transactionally safe where possible.
5. Runtime role is least privilege.
6. FK coverage.
7. unique constraints.
8. check constraints.
9. indexes for critical filters/joins.
10. TIMESTAMPTZ correctness.
11. immutable controlled-history expectations.
12. optimistic concurrency.
13. version checks.
14. business-number uniqueness under concurrency.
15. idempotency records.
16. retry safety.
17. deadlock handling.
18. ambiguous commit handling.
19. audit/outbox atomicity.
20. transaction boundaries at use-case level.
21. no silent lost update.
22. no unsafe DELETE of controlled records.
23. data lineage fields.
24. controlled master data ownership.
25. seed reproducibility.
26. production foundation seed verification.
27. orphan detection.
28. data quality constraints.
29. schema-to-dictionary drift detection.

ADD:

- database integrity test suite
- concurrency stress cases
- migration drift check
- orphan-record checks
- lineage verification.

TARGET DOMAINS:
4, 7, 17, 18, 35, 75, 76, 77.
```

---

# PROMPT-05 — QC/QMS/Laboratory/Controlled Workflow Closure

```text
PROMPT ID: QC-100-05
TITLE: QC Compliance, Laboratory and Business Workflow Correctness Closure

Use the MASTER HEADER.

MISSION:

Audit and close every controlled workflow end-to-end.

MODULES:

Tasks
Findings
NCR
RCA
CAPA
Quarantine
Receiving Items
Inspection Reports
Laboratory
Equipment
Calibration
Maintenance
Documents
WI
SOP
Approvals
E-Signatures
Change Requests

FOR EVERY WORKFLOW:

Map:

Requirement
→ Permission
→ Scope
→ State
→ Use Case
→ Transaction
→ Repository
→ Audit
→ Notification
→ UI
→ Tests

VERIFY:

- allowed transitions
- forbidden transitions
- unauthorized transitions
- stale version handling
- exact approval subject/version
- audit reason
- durable history
- controlled revision behavior
- superseding
- voiding
- no destructive edit to approved history.

CRITICAL QC RULE:

Receiving Workflow State
Inspection Result
Release System State

must remain separate.

Prove with tests:

PASS != RELEASED
HOLD != RELEASED
REJECT != RELEASED
inspection completion does not implicitly release
release requires explicit approved authority.

LABORATORY:

- raw observation preserved
- derived value distinguishable
- unit explicit
- method/version explicit
- controlled source explicit
- precision/rounding controlled
- no scientific acceptance limit invented
- official result server-authoritative
- historical equipment/calibration context retained
- retest policy remains blocked where unresolved.

DOCUMENT CONTROL:

- document identity != version
- approval binds exact version
- effective/superseded history protected
- WI/SOP historical context retained.

TARGET DOMAINS:
2, 8, 12, 14, 15, 16, 18, 22, 23, 43, 44, 57, 58.
```

---

# PROMPT-06 — Audit Trail / Files / Reports / Notifications Closure

```text
PROMPT ID: QC-100-06
TITLE: Evidence, Auditability, Files, Reporting and Notification Integrity

Use the MASTER HEADER.

MISSION:

Ensure every controlled system action is traceable and every evidence/output path
uses the same authorized canonical truth.

AUDIT TRAIL:

Verify critical mutations capture:
- actor
- permission context
- scope
- entity
- action
- previous state
- resulting state
- version
- timestamp
- reason where required
- request/correlation ID.

Protect audit records against normal mutation/deletion.

FILES:

Verify:
- authorized upload
- file size limit
- type validation
- filename handling
- content sniffing where applicable
- SHA-256
- metadata
- private storage
- download authorization
- record linkage
- orphan cleanup policy
- retention behavior
- no path traversal
- no executable exposure.

REPORTS/EXPORTS:

All:
dashboard
table
search
CSV
XLSX
PDF
print

must derive from authorized scoped canonical datasets.

Test:
- scope leakage
- CSV/XLSX formula injection
- Unicode/RTL
- large exports
- date/time formatting
- controlled state terminology
- PASS vs RELEASED.

NOTIFICATIONS:

- permission/scope-safe content
- canonical links
- no hidden sensitive data
- delivery failure cannot alter business truth
- retry/idempotency behavior.

TARGET DOMAINS:
5, 36, 46, 47, 59, 60, 73, 74, 77.
```

---

# PROMPT-07 — UX / UI / Design System Complete Redesign Closure

```text
PROMPT ID: QC-100-07
TITLE: Enterprise QC UX, UI and Design System Closure

Use the MASTER HEADER.

MISSION:

Bring every implemented page to a unified world-class enterprise
QC/Laboratory operational experience while preserving business rules.

DO NOT turn the application into:
- marketing website
- gaming dashboard
- generic admin template
- excessive glassmorphism
- visual concept that hides operational truth.

TARGET EXPERIENCE:

Enterprise QC Operations Control Room
+
Laboratory execution workspace
+
Compliance system
+
high-density operational application.

AUDIT EVERY PAGE.

FOR EVERY PAGE VERIFY:

Where am I?
What state is this record in?
What requires attention?
What can I do?
Why can/cannot I do it?
What happened before?
What happens next?

IMPLEMENT/IMPROVE:

- global shell
- responsive sidebar
- top context bar
- breadcrumbs
- global search
- notification center
- approval shortcut
- record headers
- state chips
- KPI cards
- attention queues
- dashboard charts
- detail workspaces
- timelines
- audit history
- controlled action zones
- loading states
- empty states
- errors
- stale states
- offline/degraded states where relevant
- skeletons
- responsive tables
- column visibility
- sorting
- filters
- saved filter UX where justified
- pagination
- dense mode
- keyboard navigation
- role-aware controls
- permission explanations
- destructive confirmations
- unsaved changes protection
- draft/autosave where approved
- print/PDF UX.

ADVANCED FORMS:

- logical sections
- explicit units
- required/optional indicators
- inline validation
- error summary
- server validation
- no data loss
- safe double-submit handling
- accessible help
- keyboard order
- confirmation for controlled transitions.

TARGET DOMAINS:
22–28
37–65
68–74
88–95.
```

---

# PROMPT-08 — Accessibility / RTL / Human Factors Closure

```text
PROMPT ID: QC-100-08
TITLE: WCAG 2.2 AA, RTL, Keyboard and Human Factors Closure

Use the MASTER HEADER.

MISSION:

Achieve evidence-backed accessibility across representative critical workflows.

TARGET:
WCAG 2.2 AA

TEST BOTH:
Arabic RTL
English LTR

MANDATORY:

- semantic HTML
- landmarks
- heading hierarchy
- accessible names
- labels
- descriptions
- error relationships
- status announcements
- keyboard-only operation
- visible focus
- focus return
- modal focus trapping
- escape behavior
- combobox keyboard model
- menus
- tabs
- tables/grid behavior
- skip link
- screen-reader labels
- no color-only status
- sufficient contrast
- 200% zoom
- 400% reflow where applicable
- touch target sizing
- reduced motion
- no keyboard trap
- responsive mobile/tablet
- Arabic typography
- logical CSS properties
- correct directional icons
- readable business IDs under RTL.

Use:
@axe-core/playwright
Playwright keyboard tests
manual verification checklist.

CRITICAL WORKFLOWS:

Login
Dashboard
Receiving
Inspection
Laboratory entry
NCR/CAPA
Approval
Document review
Equipment/Calibration
Reports.

CREATE:
audit/100-percent/ACCESSIBILITY-EVIDENCE.md

TARGET DOMAINS:
25, 26, 28, 40, 43, 54, 55, 56, 61, 62, 65, 68.
```

---

# PROMPT-09 — `background.lottie` + Motion & Digital Art Closure

```text
PROMPT ID: QC-100-09
TITLE: Secure Fixed background.lottie and Enterprise Motion System

Use the MASTER HEADER.

MISSION:

Make the repository root asset:

background.lottie

the permanent fixed visual background of the complete system,
while preserving security, accessibility, readability and performance.

FIRST:

Inspect the actual .lottie asset.
Inspect package.json, CSP, Astro layouts, global styles, motion system,
AppLayout, AuthLayout and BaseLayout.

DO NOT use:
- external CDN
- remote Lottie player
- third-party runtime URL
- CSP weakening
- unsafe-inline added only for Lottie
- autoplay when prefers-reduced-motion is active.

IMPLEMENT:

1. Place runtime-served asset under a controlled public asset location, e.g.
   public/assets/background.lottie
   while removing redundant copies only if safe and intentional.

2. Use a locally pinned dotLottie renderer.
   Prefer local/self-hosted runtime assets/WASM.
   Do not depend on external runtime fetches.

3. Create reusable component:

src/ui/components/SystemBackground.astro
or equivalent approved architecture location.

4. Background behavior:

position: fixed
inset: 0
width: 100vw
height: 100vh
pointer-events: none
aria-hidden: true
overflow: hidden
z-index below application content

5. Rendering:

cover viewport without distortion where possible.
Keep animation calm and non-distracting.
Do not restart during normal navigation unnecessarily.

6. Add a controlled readability layer between animation and content.

7. Application content must remain visually dominant.

8. Update application surfaces where required:

Sidebar
Topbar
Panels
Cards
Tables
Dialogs

using carefully controlled opaque/translucent surfaces.

Do not make critical tables excessively transparent.

9. Preserve readable WCAG contrast for:

body text
muted text
table text
status chips
links
focus
errors
warnings
success
HOLD
REJECT
PASS
RELEASED.

10. Ensure PASS and RELEASED remain visually/textually distinct.

11. prefers-reduced-motion:

When reduce:
- do not autoplay animation
- preferably show deterministic static first frame/fallback
- do not leave CPU-intensive renderer active.

12. Pause rendering when document is hidden if supported safely.

13. Print:

hide animated background.
use clean print surface.

14. Performance:

- lazy/start after critical content where reasonable
- avoid blocking LCP
- prevent layout shift
- verify memory/CPU impact
- verify mobile behavior
- measure before/after.

15. CSP:

All required JS/WASM/assets must remain self-hosted and compatible
with existing production CSP.
Do not weaken security headers.

ADD TESTS:

- background exists
- application content remains above it
- pointer events disabled
- aria-hidden
- reduced-motion behavior
- no external asset requests
- CSP remains valid
- login works
- dashboard works
- critical pages remain readable
- print excludes animation.

VISUAL QA:

Desktop:
1440x900
1920x1080

Tablet:
768px

Mobile:
390px

Arabic RTL and English LTR.

TARGET DOMAINS:
41, 51, 52, 53, 54, 91, 92, 93, 94, 95, 96, 97.
```

---

# PROMPT-10 — Performance / Reliability / Observability / Capacity

```text
PROMPT ID: QC-100-10
TITLE: Performance, Reliability, Observability and Capacity Closure

Use the MASTER HEADER.

MISSION:

Move from "instrumented" to operationally measurable.

PERFORMANCE:

Measure:
- server response time
- DB query latency
- slow query patterns
- dashboard load
- table load
- search
- reports
- file operations
- login
- critical writes
- background.lottie client impact.

Establish evidence-based budgets.

Add load profiles for:

- concurrent logins
- dashboard reads
- filtered lists
- search
- Receiving Item creation
- laboratory writes
- approvals
- report generation.

Do NOT invent business capacity.
Record measured system behavior instead.

RELIABILITY:

Verify:
- DB outage
- timeout
- stale connection
- duplicate request
- client retry
- ambiguous outcome
- downstream notification failure
- object storage failure
- AI outage
- observability exporter failure.

OBSERVABILITY:

Ensure:
- requestId
- traceId/span where used
- structured logging
- environment
- release/service.version
- latency
- status classes
- auth denials
- rate-limit denials
- controlled failures
- DB readiness
- dependency health.

Ensure no secrets/PII leakage.

ALERTING:

Define actionable alert conditions but do not invent organizational escalation owners.

Create:
audit/100-percent/PERFORMANCE-BASELINE.md
audit/100-percent/RESILIENCE-MATRIX.md
audit/100-percent/OBSERVABILITY-EVIDENCE.md

TARGET DOMAINS:
19, 20, 29, 30, 63, 82, 84.
```

---

# PROMPT-11 — Backup / Restore / DR / Business Continuity

```text
PROMPT ID: QC-100-11
TITLE: Backup, Recovery, Restore Verification and Business Continuity Closure

Use the MASTER HEADER.

MISSION:

Close the difference between:

BACKUP CREATED

and

RESTORE VERIFIED.

INSPECT:

Documents/BACKUP-RECOVERY-PLAN.md
docs/operations/RESTORE-DRILL-RUNBOOK.md
docs/operations/RENDER-POSTGRES-RECOVERY-AUDIT.md
scripts/recovery/**
src/modules/backup-recovery/**
Render-related runbooks.

VERIFY:

- migration ledger
- database version context
- schema
- core relations
- history relations
- audit data
- file metadata
- actual object presence
- SHA-256
- application compatibility
- permission enforcement after restore
- session behavior after major recovery
- no secret exposure.

Create an executable provider-aware-but-safe recovery checklist
for the actual approved hosting architecture.

IMPORTANT:

Do not fake:
- physical backup
- WAL
- PITR
- snapshot
- cross-region copy
- real restore
- RPO
- RTO.

If actual provider capability cannot be executed in this environment:
mark BLOCKED/UNVERIFIED and generate the exact operator procedure.

Create:
audit/100-percent/DR-EVIDENCE-MATRIX.md
audit/100-percent/RESTORE-DRILL-EVIDENCE-TEMPLATE.md

A real 100 score for DR requires actual successful isolated restore evidence,
not only scripts.

TARGET DOMAINS:
9, 14, 20, 82, 83.
```

---

# PROMPT-12 — Deployment / Release / Secure SDLC / DevEx Closure

```text
PROMPT ID: QC-100-12
TITLE: Production Delivery, Release Governance and Secure SDLC Closure

Use the MASTER HEADER.

MISSION:

Create a deterministic, auditable and secure release path.

INSPECT:

render.yaml
.github/workflows/**
package.json
pnpm-lock.yaml
Node/pnpm pinning
release scripts
migration scripts
seed scripts
bootstrap scripts
deployment docs
environment config.

VERIFY:

DEV
TEST
STAGING/UAT
PRODUCTION

are explicitly distinguishable.

REQUIREMENTS:

- exact Node version
- exact pnpm version
- frozen lockfile
- dependency review
- dependency vulnerability policy
- SBOM if practical
- provenance/release identity
- exact Git SHA
- build artifact identity/hash
- migration head
- release candidate verification
- protected config
- no secrets in source
- deployment preflight
- DB preflight
- migration preflight
- production seed verification
- admin bootstrap verification
- readiness probe
- liveness probe
- post-deploy smoke test
- rollback/forward-fix decision procedure
- release evidence record
- change record
- no untracked production mutation.

Improve commit/release traceability.
Avoid generic release evidence such as only "update site".

Add technical debt register automation where useful.

CREATE:

audit/100-percent/RELEASE-GATE.md
audit/100-percent/ENVIRONMENT-MATRIX.md
audit/100-percent/TECH-DEBT-REGISTER.md

TARGET DOMAINS:
31, 32, 33, 78, 79, 80, 81, 85, 86, 87.
```

---

# PROMPT-13 — AI Governance + UX Research + FINAL 100/100 Closure

هذا الأخير مهم جدًا؛ لا تشغله إلا بعد البقية.

```text
PROMPT ID: QC-100-13
TITLE: Final Evidence Closure — AI, UX Research, UAT and 100-Domain Re-Audit

Use the MASTER HEADER.

MISSION:

Perform final independent closure after QC-100-01 through QC-100-12.

PART A — AI GOVERNANCE

Audit src/modules/ai-advisory/**.

Prove AI cannot:

- approve
- reject officially
- release
- assign official PASS/FAIL
- sign
- bypass permissions
- change controlled state
- mutate official records without authoritative human workflow.

Add AI eval suites covering:

- hallucinated QC limits
- invented policy
- invented WI/SOP
- unsafe recommendation
- unauthorized record request
- prompt injection
- cross-scope information leakage
- confidential input handling
- malformed output
- model outage
- timeout
- refusal/fallback behavior
- user override
- human confirmation.

Build a deterministic eval dataset without confidential production data.

PART B — UX RESEARCH / USABILITY

Create executable usability study for representative roles:

Employee
QC Inspector
Laboratory user
Supervisor
Manager
Administrator
Auditor

Critical tasks:

Login
Find assigned work
Create/complete Receiving inspection
Record laboratory observations
Handle HOLD
Create/review NCR/CAPA
Approve controlled record
Review WI/SOP version
Find equipment/calibration status
Export report
Trace audit history.

Measure:

- task success
- time on task
- error count
- backtracking
- failed navigation
- form correction rate
- assistance needed
- subjective confidence.

Do not fabricate user-study results.

If real participants have not executed the study:
mark the evidence UNVERIFIED and provide the exact study package.

PART C — FINAL AUDIT

Re-run all 100 domains independently.

For each domain:

- previous score
- current score
- PASS/PARTIAL/FAIL/UNVERIFIED
- evidence
- automated test
- runtime evidence
- open blockers.

CREATE:

audit/100-percent/FINAL-100-DOMAIN-AUDIT.md
audit/100-percent/FINAL-EVIDENCE-INDEX.md
audit/100-percent/FINAL-OPEN-RISKS.md
audit/100-percent/FINAL-PRODUCTION-DECISION.md

A DOMAIN MAY RECEIVE 100 ONLY IF:

1. applicable requirements are defined
2. implementation exists
3. relevant tests pass
4. negative-path tests pass
5. current evidence exists
6. runtime/UAT evidence exists where required
7. security/integrity controls pass
8. no contradictory defect
9. no unresolved mandatory policy decision
10. no unresolved critical/high blocking risk.

FINAL SYSTEM SCORE MAY BE 100 ONLY IF:

- all applicable domains = 100
- all Tier-1 production requirements = PASS
- fresh CI for exact HEAD = GREEN
- exact release identity exists
- migrations are verified
- security verification passes
- critical E2E passes
- accessibility evidence passes
- UAT is ACCEPTED
- no unresolved CRITICAL/VERY HIGH blocker
- recovery requirements have real evidence where applicable.

Otherwise output the mathematically accurate score and blockers.

Do not round 99.x to 100.

FINAL SECTION MUST SAY ONE OF:

EVIDENCE-BACKED 100/100 CLOSURE

or

NOT YET 100/100

with exact reasons.

TARGET DOMAINS:
All 100 domains.
```

## ترتيب التنفيذ

```text
QC-100-01  Reality Audit
     ↓
QC-100-02  CI + Tests
     ↓
QC-100-03  Security / IAM
     ↓
QC-100-04  Database / Integrity
     ↓
QC-100-05  QC / QMS / Laboratory
     ↓
QC-100-06  Audit / Files / Reports
     ↓
QC-100-07  Full UI / UX
     ↓
QC-100-08  Accessibility / RTL
     ↓
QC-100-09  background.lottie + Motion
     ↓
QC-100-10  Performance / Observability
     ↓
QC-100-11  Backup / DR
     ↓
QC-100-12  Deployment / Secure SDLC
     ↓
QC-100-13  AI + UX Research + FINAL 100/100 AUDIT
```
