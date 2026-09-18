# QC Operations & Laboratory Management System
## Remaining-to-100% Execution Prompt Pack

This pack is intended for the final gap-closure phase after the previous closure prompts have already been implemented.

**Important:** These prompts are not permission to manufacture a 100% score. Their goal is to produce the missing implementation and evidence so that a later independent audit can legitimately reach 100%.

## Global execution rules

Before every task:

1. Read `AGENTS.md` completely.
2. Read `.agents/mind/01-mind-latest.md` completely.
3. Freeze the real current state:
   ```bash
   git rev-parse HEAD
   git branch --show-current
   git status --short
   git diff --stat
   git diff --name-status
   node --version
   pnpm --version
   ```
4. Treat the current local working tree as authoritative and never discard existing work.
5. Read all relevant `.agents/skills/**/SKILL.md` files.
6. Re-verify all previously recorded SHA values, migration heads, test counts, provider state, and production state.
7. Fix root causes, not symptoms.
8. Do not weaken security, RBAC, SoD, validation, audit, state machines, or scientific/QMS controls to make tests pass.
9. Never rewrite historical migrations. Use forward-only migrations.
10. Never expose credentials, API keys, database URLs, session tokens, or passwords.
11. Use only evidence states: `PASS`, `FAIL`, `BLOCKED`, `NOT VERIFIED`.
12. Do not claim `100%`, `GO`, or `Production Ready` unless the required evidence is actually complete.
13. Do not run `git commit`, `git push`, merge, deploy, force-push, or remote mutations unless the user explicitly asks for that exact action.
14. Update `.agents/mind/01-mind-latest.md` only with durable verified current-state facts after the task is complete.

---

# Prompt 01 — QC-100-FINAL-001
## Production PostgreSQL & Render Parity Closure

You are executing:

`QC-100-FINAL-001 — Production PostgreSQL & Render Parity Closure`

### Objective

Close the highest-priority production gap: make the live Render application, live PostgreSQL database, source migration head, runtime configuration, and release identity agree exactly.

The last known evidence showed the source ahead of the Render database. Re-verify current reality before doing anything.

### Phase 1 — Freeze database truth

Determine:

```text
source migration head
applied Render migration head
source table count
Render qc table count
pending migrations
PostgreSQL server version
search_path used by the application
database name
database principal
TLS status
```

Run safe checks first:

```bash
pnpm db:preflight
pnpm db:migrate:check
pnpm db:migrate:status
pnpm db:schema:check
```

If the live database has pending migrations, inspect every pending migration before applying anything.

### Phase 2 — Pre-migration safety gate

Before any production migration:

- create and verify a current logical backup
- record checksum
- record current migration head
- verify restore command
- confirm database connectivity
- confirm there is no credential-rotation blocker
- confirm target database identity
- confirm the migration sequence is forward-only
- confirm no destructive migration exists without an approved recovery path

If any safety gate is unresolved:

```text
PRODUCTION MIGRATION = BLOCKED
```

Do not continue.

### Phase 3 — Apply migration parity

When all safety gates are satisfied, apply only the canonical repository migrations in order.

Never manually create missing tables as a shortcut.

Afterward prove:

```text
applied migration head == source migration head
pending migrations == 0
schema integrity == PASS
orphan count == 0
```

Verify new domains such as Reject Reports exist in PostgreSQL.

### Phase 4 — Render service configuration parity

Compare the actual Render service configuration against `render.yaml`.

Verify:

- runtime is Node
- Node version matches the repository engine contract
- build command
- start command
- health check path
- auto-deploy policy
- custom domain
- environment variable names
- `DATABASE_URL`
- release identity variables
- AI provider variables
- no authorization mutation is performed during server startup

Any provider-side drift must be documented and corrected through the approved Render configuration path.

### Phase 5 — Release identity

Prove the live service exposes or internally records:

```text
deployed Git SHA
build ID
release ID
migration head
environment
build timestamp
```

The deployed SHA must match the intended release commit exactly.

### Phase 6 — Live functional smoke

Verify on `qclevel.top`:

```text
/api/health/live
/api/health/ready
/login
/dashboard
/reject-reports
/system/health as yazeed
/system/control-center as yazeed
```

`/reject-reports` must not return 500.

### Acceptance criteria

- source and production migration heads match
- zero pending migrations
- live schema integrity passes
- Render service configuration matches the repository contract
- release identity binds the exact deployed SHA
- health/live and readiness are healthy
- Reject Reports works on the live database
- no startup-time privilege mutation
- backup exists before migration and is restorable
- all evidence is sanitized

---

# Prompt 02 — QC-100-FINAL-002
## Zero-Defect Toolchain, Lint, Format & Exact-HEAD CI

You are executing:

`QC-100-FINAL-002 — Zero-Defect Toolchain, Lint, Format & Exact-HEAD CI`

### Objective

Close all deterministic engineering gates and produce a green exact-HEAD GitHub CI result.

### Local runtime parity

Use the repository-declared Node and pnpm versions.

Run:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:architecture
pnpm test:unit
pnpm build
pnpm release:identity
pnpm release:verify
pnpm release:tech-debt:check
git diff --check
```

Fix every warning/error that is part of the release contract.

No ignored lint debt. No formatter exceptions merely to get green output.

### CI

Audit `.github/workflows/ci.yml`.

The exact-head workflow must actually start and execute.

If GitHub account/billing state prevents the workflow from starting:

```text
CI = BLOCKED BY EXTERNAL ACCOUNT CONDITION
```

Resolve the account/workflow execution blocker first; do not label it PASS.

### Required CI jobs

The canonical workflow must cover, as appropriate:

```text
install
format
lint
typecheck
architecture
unit
PostgreSQL integration
migrations
concurrency
security
build
authenticated E2E
release verification
```

Do not silently skip required jobs.

### Acceptance criteria

- format: PASS
- lint: PASS
- typecheck: PASS
- architecture: PASS
- unit: PASS
- build: PASS
- release verification: PASS
- exact current HEAD GitHub CI: PASS
- zero release-gate failures
- zero unexplained/skipped mandatory jobs

---

# Prompt 03 — QC-100-FINAL-003
## Authenticated E2E & Complete Role Matrix Closure

You are executing:

`QC-100-FINAL-003 — Authenticated E2E & Complete Role Matrix Closure`

### Objective

Prove the full application in a real browser against PostgreSQL with zero unexpected failures and zero unjustified skips.

### Required personas

```text
Employee
Inspector
Supervisor
Manager
Administrator
canonical yazeed / SYSTEM_OWNER
```

Use deterministic non-production fixtures. Never use production credentials in test code.

### Required page-access contract

Prove:

```text
ACTIVE authenticated user -> can open every normal AUTHENTICATED page
non-yazeed -> cannot open YAZEED_ONLY pages
yazeed -> can open YAZEED_ONLY pages
page visibility != mutation authority
```

### Critical workflows

Cover end-to-end:

- login/logout
- session expiry/recovery
- dashboard
- tasks
- receiving
- quarantine
- inspection execution/review
- PASS but not released
- release
- findings/NCR/RCA/CAPA
- laboratory test creation/execution/review/retest
- equipment/calibration/maintenance
- controlled documents/version/review
- approvals
- change requests
- reports/export
- Reject Reports Issue Slip
- Reject Reports Daily Reject
- Issue Slip approval-confirmation tracking
- account administration
- Yazeed Control Center
- AI Advisory normal/fallback state
- search
- notifications
- audit
- backup/restore UI read paths

### Negative flows

Prove:

- unauthorized mutation denied
- direct URL owner-page denial
- stale version conflict
- duplicate command
- invalid state transition
- expired session
- disabled user
- unsafe returnTo blocked
- rate-limit behavior
- provider unavailable
- database temporary failure

### Browser stability

Fix:

- ambiguous locators
- race conditions
- parallel rate-limit interference
- timeout flakiness
- test-order dependence
- shared mutable fixture contamination

### Acceptance criteria

```text
unexpected FAIL = 0
unexpected SKIP = 0
flaky retry-only pass = 0
```

All role/visibility/mutation assertions must be server-proven, not only UI-hidden.

---

# Prompt 04 — QC-100-FINAL-004
## Real UAT, Usability & Human Sign-Off

You are executing:

`QC-100-FINAL-004 — Real UAT, Usability & Human Sign-Off`

### Objective

Replace template-only UAT with real, signed, representative human validation.

Automated tests do not satisfy this task.

### Required participants

Run real sessions with at least:

```text
Employee
Inspector
Supervisor
Manager
Administrator
yazeed / SYSTEM_OWNER
```

### Required scenarios

Each relevant participant must execute realistic tasks such as:

- sign in
- find work from dashboard/navigation
- receive material
- inspect material
- record HOLD/Reject
- lab execution/review
- manage calibration/maintenance
- controlled-document workflow
- approval workflow
- Reject Report Issue Slip
- Daily Reject
- report/export
- error recovery
- stale/conflict recovery
- mobile/responsive use
- owner controls where applicable

### Measure

Record:

```text
task success
time on task
errors
misclicks/confusion
severity
participant feedback
accessibility issues
expected vs actual
evidence
sign-off
```

### Acceptance criteria

- no unresolved P0/P1 usability or workflow defect
- every critical workflow has human evidence
- all required participants/signers are present

If real participants are unavailable:

```text
UAT = BLOCKED
```

Do not substitute browser automation.

---

# Prompt 05 — QC-100-FINAL-005
## Dashboard UX, Live Data & Decision-Support Closure

You are executing:

`QC-100-FINAL-005 — Dashboard UX, Live Data & Decision-Support Closure`

### Objective

Close every finding from the live dashboard review and turn `/dashboard` into a precise, fast, role-aware operational command center backed only by real server data.

### Mandatory defects to close

#### 1. Global font defect

The authenticated application must not fall back to Times/serif because of the `font: inherit` reset.

Fix the root CSS order/selector issue and verify computed styles in the built/live application.

#### 2. Broken KPI drill-down filters

Every KPI link must point to a destination that actually supports and visibly applies its filter.

Do not send unsupported query parameters.

#### 3. KPI scope semantics

The number calculated must match the copy shown to the user.

If KPIs are actor-personal, label them clearly as personal.

If the design says authorized operational scope, query the authorized operational scope.

#### 4. Decision queue consistency

The `Pending review` count and `Items needing a decision` list must derive from compatible business definitions.

Build one coherent decision queue using real approval work items and relevant HOLD/attention items.

Remove fake/unreachable priority states.

#### 5. User identity in topbar

Never show internal UUID as the human identity.

Show safe user-facing identity:

```text
display name or login identity
actual role/scope summary
```

#### 6. Accessibility label-in-name

Fix the Search/Ctrl-K accessible-name mismatch.

#### 7. Lottie/CSP

Choose one secure solution:

- make the animation compatible with production CSP after security review, or
- remove the broken Lottie runtime and use the lightweight fallback

Do not keep downloading unusable WASM.

#### 8. Typography readability

Raise 10px operational metadata text to a usable size, generally 11–12px minimum under the design system.

#### 9. Heading hierarchy

Navigation group labels must not create a page heading hierarchy where H2 elements appear before the page H1.

#### 10. Touch targets

Meet the project's documented 44px interactive target where applicable.

#### 11. Remove empty duplicate trend panels

Do not reserve large empty dashboard space for unavailable data.

#### 12. Error classification

Differentiate:

```text
AUTHORIZATION DENIED
DEPENDENCY/PROVIDER UNAVAILABLE
EMPTY DATA
```

Never tell a user there is a provider outage when the real issue is missing permission.

#### 13. Performance

Measure and improve:

```text
TTFB
FCP
LCP
JS/WASM transfer
server query time
```

Remove known unnecessary network cost.

#### 14. Copy/date/refresh

Clean duplicate text such as `Updated current snapshot`.

Use intentional Saudi/local date formatting.

Add a clear refresh action if the dashboard is snapshot-based.

### Dashboard additions using real data

Add or improve these only when backed by an approved read model:

#### Operational actions

Top action row:

```text
approvals waiting for me
unread notifications
tasks due soon
```

#### Quarantine flow

Show real stages:

```text
received today
awaiting inspection
under inspection
HOLD
PASS but not released
released
```

Use the existing quarantine overview/distribution data.

#### Decision attention

Use the richer server `attention` model where available and show a human-readable reason for each item.

#### Real charts

Use only real backend time series/distributions:

- receiving-state distribution
- Reject Reports daily trend
- rejects by item
- rejects by department
- rejects by reason
- total rejected quantity

Do not draw a Findings/NCR/CAPA trend unless a real approved time-series read model exists.

#### Quality/Lab/Assets

Provide concise live summaries with useful drill-down links, for example:

```text
open Findings/NCR/RCA/CAPA
laboratory work requiring action
overdue calibration
maintenance attention
```

#### System status

Only canonical yazeed may see owner system-health/control-center status cards.

### Responsive verification

Prove no horizontal overflow and usable hierarchy at:

```text
320
360
500
768
1024
1200
1440
```

### Acceptance criteria

- every live-review finding is resolved or explicitly retired with evidence
- all KPI numbers and labels mean the same thing
- every drill-down works
- no broken CSP animation
- no internal UUID identity in normal UI
- dashboard uses only real server data
- accessibility issues from the review are closed
- measured performance is recorded before/after

---

# Prompt 06 — QC-100-FINAL-006
## WCAG 2.2 AA & Cross-Application Accessibility Closure

You are executing:

`QC-100-FINAL-006 — WCAG 2.2 AA & Cross-Application Accessibility Closure`

### Objective

Move accessibility from source-level confidence to browser-verified WCAG 2.2 AA coverage across the application.

### Scope

Test every major page family:

```text
login/auth
dashboard
tables/lists
forms
dialogs
detail pages
admin
quality
quarantine
laboratory
assets
documents
approvals
reports
Reject Reports
Yazeed Control Center
AI Advisory
```

### Automated browser checks

Use axe/Lighthouse or equivalent against authenticated pages.

Zero serious/critical automated accessibility violations.

### Manual keyboard checks

Verify:

- full keyboard navigation
- visible focus
- logical focus order
- dialog focus trap
- focus return
- escape behavior
- skip links
- no keyboard traps

### Screen-reader checks

Use VoiceOver on macOS or another real screen reader.

Verify:

- landmarks
- headings
- labels
- names/roles/values
- status announcements
- table semantics
- validation errors
- dialog announcements

### Additional WCAG checks

- 200%/400% zoom
- reflow
- 320px layout
- contrast
- non-text contrast
- target size
- label in name
- error identification
- instructions
- status messages
- reduced motion

### Acceptance criteria

- automated serious/critical violations = 0
- keyboard blockers = 0
- screen-reader blockers = 0
- all critical workflows usable without mouse
- documented human accessibility evidence exists

---

# Prompt 07 — QC-100-FINAL-007
## Performance, Capacity, Reliability & Observability Closure

You are executing:

`QC-100-FINAL-007 — Performance, Capacity, Reliability & Observability Closure`

### Objective

Replace performance assumptions with measured evidence.

### Database performance

Create representative synthetic datasets for:

```text
users
tasks
receiving
inspections
lab tests
reject reports
audit events
documents
notifications
```

Run `EXPLAIN (ANALYZE, BUFFERS)` on critical queries.

Eliminate:

- N+1
- full scans where inappropriate
- unbounded list queries
- missing indexes
- expensive duplicate dashboard queries

### Browser performance

Measure production-like authenticated pages:

```text
TTFB
FCP
LCP
INP
CLS
total transferred bytes
JS/WASM
server render duration
```

Test dashboard, large tables, reports, Reject Reports, and owner control center.

### Load/capacity

Define reasonable concurrency scenarios and verify:

- connection pool
- rate limits
- transaction contention
- queue/outbox behavior
- report queries
- dashboard reads

### Observability

Prove:

- structured logs
- request IDs
- user-safe error IDs
- database dependency state
- AI dependency state
- metrics export
- alerting path
- health/readiness
- no secrets in telemetry

### Acceptance criteria

Set explicit budgets from measured baselines.

No critical query or page may remain `NOT VERIFIED`.

Document production-like capacity limits and failure behavior.

---

# Prompt 08 — QC-100-FINAL-008
## Backup, Restore, DR, RPO/RTO & Provider Evidence Closure

You are executing:

`QC-100-FINAL-008 — Backup, Restore, DR, RPO/RTO & Provider Evidence Closure`

### Objective

Turn the existing local restore proof into full recovery evidence with populated controlled records and provider capability evidence.

### Build a populated recovery fixture

The backup source must include non-zero representative records for:

- audit events
- e-signatures
- evidence links/files
- sessions
- release candidates/approvals
- QC records
- lab records
- Reject Reports
- documents
- role/scope grants

### Backup

Capture:

```text
backup ID
timestamp
PostgreSQL version
migration head
size
checksum
source release identity
```

### Isolated restore

Restore to a separate target.

Verify:

- table counts
- row counts
- FK integrity
- migration ledger
- controlled-history immutability
- audit continuity
- e-signature relationships
- file/evidence checksums
- release governance
- user/role/scope integrity
- Reject Reports data

### Provider evidence

Obtain authoritative Render/provider evidence for:

```text
managed backup availability
schedule
retention
PITR
WAL behavior
RPO
RTO
restore process
```

If the provider plan lacks a required capability, document the gap and implement an approved alternative strategy.

### Disaster recovery drill

Measure actual:

```text
RPO achieved
RTO achieved
time to restore
time to validate
```

### Acceptance criteria

- populated restore parity = PASS
- checksum integrity = PASS
- controlled evidence survives restore = PASS
- provider backup posture = VERIFIED
- RPO/RTO = measured, not guessed
- documented recovery runbook works end to end

---

# Prompt 09 — QC-100-FINAL-009
## Groq + Gemini Live Production Verification & AI Safety Closure

You are executing:

`QC-100-FINAL-009 — Groq + Gemini Live Production Verification & AI Safety Closure`

### Objective

Move AI from implemented source code to verified live provider behavior while preserving the advisory-only boundary.

### Secret safety

Rotate any AI credentials that have previously appeared in shared files/screenshots.

Use new secrets only through the approved secret manager/Render environment.

Never print them.

### Live tests

Verify independently:

```text
Groq success
Gemini success
Groq unavailable -> Gemini fallback
Groq rate-limited -> Gemini fallback
both unavailable -> safe degraded AI
```

Core readiness must stay healthy when AI is unavailable.

### Safety

Prove the AI cannot:

- approve
- release
- sign
- change controlled limits
- mutate regulated records
- change RBAC/scopes
- expose secrets

Run prompt-injection and malicious-context tests.

### Privacy

Verify exactly what context leaves the application.

No hidden/global database context. No credentials/tokens.

### Observability

Record sanitized:

```text
provider
model
latency
fallback used
outcome
request ID
```

### Acceptance criteria

- both live providers verified
- fallback verified
- degraded mode verified
- advisory-only enforcement verified
- prompt injection cannot trigger privileged action
- secret leakage tests pass

---

# Prompt 10 — QC-100-FINAL-010
## Security, Privacy, Secure SDLC & Compliance Evidence Closure

You are executing:

`QC-100-FINAL-010 — Security, Privacy, Secure SDLC & Compliance Evidence Closure`

### Objective

Close all remaining security/privacy/compliance evidence gaps.

### Runtime security testing

Verify against the candidate environment:

- authentication/session handling
- CSRF
- XSS
- IDOR
- privilege escalation
- mass assignment
- SQL injection
- file upload abuse
- path traversal
- rate limiting
- brute force
- open redirects / unsafe returnTo
- header policy
- CSP
- secure cookies
- error redaction

### RBAC/SoD

Execute the complete role/scope negative matrix on PostgreSQL/browser.

### Privacy

Define and verify:

- data classification
- retention
- deletion/correction semantics
- log retention
- export privacy
- audit privacy
- AI transmission privacy

### Secure SDLC

Add/verify:

- dependency audit
- SBOM
- lockfile integrity
- secret scanning
- vulnerable dependency policy
- CI supply-chain controls

### QMS/compliance

For every regulated workflow, ensure:

```text
approved business rule
implemented state machine
authorization
audit
evidence
test
UAT
```

Do not claim a regulatory certification that has not been externally assessed.

### Acceptance criteria

- no unresolved critical/high security finding
- runtime negative tests pass
- privacy/retention decisions are documented and approved
- secure-SDLC evidence is current
- QMS workflow traceability is complete

---

# Prompt 11 — QC-100-FINAL-011
## Data Governance, MDM, Reporting, Export & Lineage Closure

You are executing:

`QC-100-FINAL-011 — Data Governance, MDM, Reporting, Export & Lineage Closure`

### Objective

Close the remaining data-governance, reporting, export, MDM, and lineage domains.

### Master data

Define governed ownership and lifecycle for:

- items/products
- suppliers if modeled
- departments/sites
- units
- reject reasons
- equipment types
- test methods/templates
- roles/scopes
- reference states

Prevent uncontrolled free-text proliferation where controlled reference data is required.

### Data quality

Add runtime checks for:

- duplicate business identifiers
- invalid references
- missing mandatory controlled values
- impossible quantities
- invalid dates
- stale records
- orphaned relationships

### Lineage

For critical records, prove traceability from:

```text
source/input
-> workflow
-> approval
-> audit/evidence
-> report/export
```

### Reporting

Verify every report:

- server-side authorization
- filter correctness
- same data set for screen/export
- pagination
- CSV/XLSX correctness
- date/time correctness
- no hidden sensitive columns
- deterministic totals

### Print/PDF

Verify controlled forms and Reject Reports in print layout.

### Acceptance criteria

- governed reference data ownership exists
- critical lineage paths are queryable
- report/export correctness is PostgreSQL-backed
- CSV/XLSX/print evidence is browser verified
- no unexplained data-quality exceptions remain

---

# Prompt 12 — QC-100-FINAL-012
## Final 80-Domain 100% Evidence Audit & Documentation Truth Sync

You are executing the final task:

`QC-100-FINAL-012 — Final 80-Domain 100% Evidence Audit & Documentation Truth Sync`

### Objective

Independently re-audit the final repository and live candidate from scratch.

Do not inherit old percentages.

Do not assume prior prompt completion means PASS.

### Evidence ladder

For every relevant requirement/domain, use:

```text
Implemented
Unit verified
Integration verified
PostgreSQL verified
Browser/E2E verified
Accessibility/UX verified
UAT verified
Production/provider verified
```

A required missing layer prevents 100%.

### Re-run all gates

At minimum:

```bash
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
pnpm test:e2e:closure
pnpm system-owner:check
pnpm release:verify
pnpm release:tech-debt:check
git diff --check
```

Verify exact-head CI separately.

### Production verification

Prove:

```text
deployed SHA
migration head
readiness
database parity
Render config parity
AI providers
backup/restore
observability
```

### Human evidence

Require:

- signed UAT
- usability evidence
- accessibility evidence

### Re-score all 80 domains

Create a complete table:

```text
Domain
Previous score
Final score
Evidence
Open gap
```

### Hard 100% rule

Only output:

```text
Overall maturity = 100%
Production readiness = 100%
GO
```

when:

```text
80/80 domains = 100
FAIL = 0
BLOCKED = 0
NOT VERIFIED = 0
P0 = 0
P1 = 0
mandatory skipped tests = 0
```

Otherwise report the truthful percentage.

### Documentation synchronization

After the final audit only:

- read the whole repository again
- update current authoritative documents
- preserve historical audits unchanged
- update route matrix
- update migration head
- update test counts
- update production evidence
- update `.agents/mind/01-mind-latest.md` last
- make the Mind exact HEAD current

Do not rewrite history to make previous audits appear current.
