# QC Operations & Laboratory Management System
## Additional Implementation Prompts — Owner Control, Render PostgreSQL, Reject Reports

**Repository:** `YEEEAE/QC-Operations-Laboratory-Management-System`

**Recommended execution order:**

1. `QC-RENDER-POSTGRES-VERIFY-001`
2. `QC-YAZEED-CONTROL-CENTER-001`
3. `QC-REJECT-REPORTS-001`

These prompts are designed to continue from the repository state after the first seven closure prompts. Do not discard or reset any existing local work.

---

# Shared Rules for All Three Prompts

Before executing any prompt:

1. Read `AGENTS.md` completely.
2. Read `.agents/mind/01-mind-latest.md` completely.
3. Freeze the local repository state:
   ```bash
   git rev-parse HEAD
   git branch --show-current
   git status --short
   git diff --stat
   git diff --name-status
   ```
4. Treat the **local working tree** as authoritative for current implementation work. Do not assume the remote GitHub HEAD contains all work from Tasks 006–007.
5. Do **not** run `git reset`, destructive checkout, clean, stash-drop, or any command that could discard existing user/agent work.
6. Inspect `.agents/skills/` and read relevant `SKILL.md` files.
7. Reuse the existing architecture instead of creating parallel authorization, routing, database, audit, or UI systems.
8. Add forward-only migrations for database changes.
9. Add tests at unit, integration/PostgreSQL, and E2E levels where applicable.
10. Page visibility and mutation authority are separate concerns.
11. Never expose secrets in:
    - source code
    - logs
    - screenshots
    - test output
    - audit records
    - generated documentation
12. Never commit, push, merge, or deploy unless the user explicitly requests it.
13. Update `.agents/mind/01-mind-latest.md` only after the task is complete, and only with durable current-state facts.

---

# Prompt 1 — QC-RENDER-POSTGRES-VERIFY-001
## Verify and Close the Render PostgreSQL Connection

You are executing:

`QC-RENDER-POSTGRES-VERIFY-001 — Render PostgreSQL Connection, Migration, Runtime & Service Verification`

## Objective

Prove that the QC Operations & Laboratory Management System is connected correctly to the intended PostgreSQL database used with Render, identify and fix any configuration or runtime defects, and produce current evidence for connectivity, schema, migrations, readiness, and application compatibility.

This task is not only a connection-string check.

It must verify the full chain:

```text
Application
→ DATABASE_URL
→ PostgreSQL
→ qc schema
→ migrations
→ repositories/use cases
→ readiness
→ Render runtime configuration
```

## Important Existing Context

The user has supplied a `.env` file containing the Render PostgreSQL connection information.

Use the values from that file as secrets/source configuration.

Known non-secret metadata includes:

```text
Internal database host: dpg-dadqmsgn74is73b774j0-a
Port: 5432
Database: qc_operations
Username: qc_operations_user
```

The user referred to `dpg-dadqmsgn74is73b774j0-a` as a Render Service ID, but the supplied environment file labels it as the database hostname. Do not assume it is the web-service ID. Determine the actual Render service/database identity from available configuration or provider evidence if possible.

## Secret Handling

The supplied `.env` contains live credentials.

You MUST:

- read the credential locally
- use it only for the required connection checks
- never print the password
- never print the complete connection URL
- never commit `.env`
- never place credentials in documentation
- redact credentials from command output
- avoid shell history/log leakage where possible

If command output contains a secret, redact it before storing evidence.

## Phase 1 — Inspect Current Database Architecture

Read:

```text
src/shared/database/**
db/**
scripts/db/**
render.yaml
.env.example
package.json
tests/helpers/postgres-container.ts
tests/integration/database/**
tests/integration/**
```

Identify:

- expected `DATABASE_URL` contract
- TLS behavior
- search_path behavior
- PostgreSQL version assumptions
- schema name
- migration table
- migration source head
- connection pooling
- timeout behavior
- readiness checks

Do not change behavior until the existing contract is understood.

## Phase 2 — Validate the Supplied Environment

Read the supplied `.env`.

Check without exposing secrets:

- host is present
- port is valid
- database is correct
- username is present
- internal URL shape is valid
- external URL shape is valid
- no malformed whitespace or quotes
- runtime code reads the expected variable name
- `.env` is ignored by Git

Create sanitized evidence only, for example:

```text
DATABASE_URL: configured
host: dpg-...-a
database: qc_operations
username: qc_operations_user
password: [REDACTED]
```

## Phase 3 — Determine Correct Connection Path

Verify both intended contexts:

### Local workstation / external access

Use the externally reachable database endpoint from the supplied environment configuration.

### Render web service / internal access

Use the internal Render database hostname/URL when the application is running inside the same Render private network, if that is the intended architecture.

Do not blindly use the external endpoint in production if internal networking is available.

Document which URL belongs to which context.

## Phase 4 — Perform Safe Connectivity Checks

Use non-destructive SQL only at first.

Verify:

```sql
SELECT version();
SELECT current_database();
SELECT current_user;
SHOW search_path;
SELECT current_schema();
```

Then safely verify:

- PostgreSQL major version
- `qc` schema exists
- migration ledger exists
- application tables exist
- basic read query succeeds

Do not dump sensitive application rows into logs.

## Phase 5 — Migration Verification

Run the repository's canonical checks using the supplied database only after confirming that doing so is safe:

```bash
pnpm db:preflight
pnpm db:migrate:check
pnpm db:migrate:status
pnpm db:schema:check
```

Before running `pnpm db:migrate`, determine whether migrations are pending and whether this is the intended target database.

If migrations are pending:

- list their IDs without exposing secrets
- inspect them
- ensure they are forward-only and safe
- execute migration only if the task scope and repository contract permit it
- never rewrite historical migrations

After migration:

```bash
pnpm db:migrate:status
pnpm db:schema:check
```

must prove the expected head and integrity.

## Phase 6 — Application Compatibility

Verify the actual application can use this database.

Run safely:

```bash
pnpm typecheck
pnpm test:integration
pnpm test:migrations
pnpm test:concurrency
pnpm test:security
pnpm build
```

Where applicable, run the built application against the verified database in a controlled environment and check:

```text
/api/health/live
/api/health/ready
```

Readiness must fail closed if database connectivity/schema is invalid.

## Phase 7 — Render Configuration Verification

Inspect `render.yaml`.

Verify:

- Node version matches repository contract
- build command
- start command
- `DATABASE_URL` is expected as a secret environment variable
- health check path
- release identity variables
- no secret is hardcoded

If Render provider access/API/CLI is available, inspect the live service configuration and confirm:

```text
web service
database
environment variables
deployment revision
release SHA
health/readiness
```

Do not reveal secret values.

If provider access is unavailable, mark:

```text
PROVIDER CONFIGURATION: NOT VERIFIED
```

rather than guessing.

## Phase 8 — Fix Root Causes

If connection fails, diagnose the exact layer:

```text
DNS
network
TLS
credential
DATABASE_URL format
search_path
schema
migration
pool
timeout
Render environment
application configuration
```

Fix the root cause in the correct layer.

Do not weaken TLS/security or hardcode credentials to make the connection pass.

## Required Tests

Add/adjust tests proving:

- invalid/missing DATABASE_URL fails safely
- correct search_path is applied
- wrong schema is detected
- pending migrations are detected
- readiness fails when DB is unavailable
- readiness succeeds when DB is compatible
- secrets never appear in health/error output

## Deliverable

Create:

```text
audit/YYYY-MM-DD-RENDER-POSTGRES-CONNECTION-VERIFICATION.md
```

Include only sanitized evidence:

```text
Exact HEAD:
Database host class: internal/external
PostgreSQL version:
Database name:
Schema:
Migration source head:
Applied migration head:
Schema integrity:
Application connectivity:
Readiness:
Render provider verification:
Remaining blockers:
```

## Acceptance Criteria

The task is complete only when:

- database connectivity is actually proven
- correct database/schema is confirmed
- migration status is known
- schema integrity is verified
- application repositories can read/write in controlled tests
- readiness reflects database truth
- no secrets were leaked
- Render environment contract is either VERIFIED or explicitly NOT VERIFIED/BLOCKED

Do not claim full production connectivity if provider runtime evidence was not actually obtained.

---

# Prompt 2 — QC-YAZEED-CONTROL-CENTER-001
## Create a Yazeed-Only Full System Control Center

You are executing:

`QC-YAZEED-CONTROL-CENTER-001 — Canonical Owner System Control Center`

## Objective

Create a new enterprise-grade control page available **only** to the canonical account:

```text
loginIdentity === "yazeed"
```

This page is the owner's centralized system control center.

It must give `yazeed` a complete administrative view and the legitimate system-owner controls already supported by the platform, while preserving auditability, database integrity, business-rule boundaries, and security.

## Critical Security Rule

The page must use the existing centralized:

```text
YAZEED_ONLY
```

page-visibility architecture.

Do not create another owner guard.

Use the existing canonical owner logic such as:

```text
SYSTEM_OWNER_LOGIN_IDENTITY
isNamedSystemOwner(...)
pageAccessDecision(...)
```

or the current equivalent.

The route must be protected server-side.

A user who is:

- ADMIN
- MANAGER
- SYSTEM_OWNER role holder
- or has every normal permission

must still be denied unless their canonical login identity is `yazeed`.

## Route

Create a dedicated route such as:

```text
/system/control-center
```

or another clean owner-oriented path consistent with the current route architecture.

Classify it explicitly:

```text
YAZEED_ONLY
```

Add it to navigation so:

```text
yazeed → sees the navigation item
everyone else → does not see it
direct URL by others → server-side denied
```

Use the extensible route contract created in previous closure tasks.

## Page Structure

Build a polished system-owner dashboard with the following sections.

### 1. System Overview

Show sanitized, live/current data:

- application status
- readiness
- database connectivity
- current migration head
- expected migration head
- release ID
- build ID
- Git SHA where available
- application version
- PostgreSQL status
- audit subsystem status
- backup/restore posture
- current open system blockers if modeled
- current date/time using existing application time conventions

Never display:

- passwords
- database URLs
- session tokens
- raw secrets
- sensitive stack traces

### 2. Account Overview

Show all existing user accounts from PostgreSQL.

Provide:

- total accounts
- ACTIVE
- DISABLED
- LOCKED/other supported states
- search
- filter
- sort
- pagination

Each row should show relevant safe metadata:

- login identity
- display name
- email if supported
- account state
- roles
- scopes
- created date
- updated date
- last login if already modeled
- active session count if safely available

### 3. Create Account

Allow yazeed to create a new account using the existing identity/application architecture.

Support the project's real fields and rules.

Where supported:

- login identity
- display name
- email
- temporary password
- initial role grants
- initial scopes
- account state

Do not duplicate account-creation logic inside the page.

Use existing Application Use Cases / Astro Actions.

Creation must be transactional and audited.

### 4. Account Detail & Administration

From the control center, yazeed must be able to open an account management workspace and legitimately perform all supported owner-level account actions:

- update profile
- activate
- disable
- reset password
- revoke sessions
- inspect roles
- assign role
- remove role
- inspect scopes
- assign scope
- remove scope
- inspect effective permissions

Reuse existing admin use cases and repositories.

Do not use direct SQL from the page.

### 5. Roles & Permissions

Provide an owner-level read and administration view for:

- roles
- canonical permissions
- role → permission grants
- user → role grants
- user → scope grants

Allow only operations that are supported by canonical application rules.

Preserve:

- protected yazeed SYSTEM_OWNER grant
- protected yazeed GLOBAL scope
- last-owner protection
- no accidental owner lockout
- no destructive removal of protected grants

### 6. System Configuration

Provide a section for safe application-level configuration if the project already has or genuinely needs persisted system settings.

Examples may include:

- non-secret operational settings
- reference-data settings
- feature configuration
- application preferences

Do NOT build an editor for:

- DATABASE_URL
- SESSION_SECRET
- provider credentials
- encryption keys
- raw environment variables

Secrets remain provider/environment-managed.

If no persistent settings model exists, create a minimal typed settings model only when justified, with:

- forward migration
- typed repository
- validation
- audit
- optimistic concurrency

Do not invent unnecessary configuration.

### 7. Audit & Recent Administrative Activity

Show a sanitized owner view of recent administrative changes:

- account created
- account disabled/activated
- password reset event
- session revocation
- role assignment/removal
- scope assignment/removal
- system configuration changes

Use existing audit data.

Never expose secret payloads.

## PostgreSQL Integration

This page must be backed by the existing PostgreSQL architecture.

Requirements:

- no in-memory mock state in production
- no page-local persistence
- no raw SQL in Astro pages
- reuse existing repositories/use cases where possible
- create new read models/use cases only when needed
- use forward migrations for genuinely new tables/columns
- preserve transaction + audit invariants

## UI/UX

The page should feel like a premium enterprise system-owner console.

Use existing design system components.

Include:

- status summary cards
- account table
- quick actions
- clear dangerous-action confirmation dialogs
- loading/error/empty states
- stale-version handling
- responsive design
- keyboard accessibility
- WCAG-oriented semantics

Do not use native `alert()` or `confirm()`.

## Tests

Add comprehensive tests.

### Visibility

```text
anonymous → denied/auth redirected
employee → denied
supervisor → denied
manager → denied
admin → denied
non-canonical SYSTEM_OWNER → denied
yazeed → allowed
```

### Server Authorization

Prove all sensitive actions are denied when invoked by a non-canonical actor even if the UI is bypassed.

### PostgreSQL

Test:

- account list
- create user
- update
- activate/disable
- reset-password event
- revoke sessions
- role grants
- scope grants
- protected yazeed invariants
- audit persistence
- transaction rollback

### E2E

Create a dedicated Playwright flow for yazeed:

```text
login
→ open control center
→ inspect system status
→ inspect account list
→ create test account
→ assign role/scope
→ edit account
→ revoke sessions
→ verify audit
→ clean verification fixture safely
```

Also verify another account cannot open the page by URL.

## Acceptance Criteria

The task is complete only when:

- one canonical YAZEED_ONLY owner control center exists
- all other users are denied server-side
- yazeed can inspect all accounts
- yazeed can create/manage accounts through PostgreSQL-backed use cases
- role/scope/permission management is integrated
- system status is live and sanitized
- owner protections cannot be removed accidentally
- all mutations are audited
- all relevant tests pass

---

# Prompt 3 — QC-REJECT-REPORTS-001
## Build the Complete Reject Reports Module

You are executing:

`QC-REJECT-REPORTS-001 — Reject Reports, Issue Slip & Daily Reject Module`

## Objective

Create a complete new PostgreSQL-backed **Reject Reports** module for QC operations.

It must support two separate report types:

```text
1. Rejected Material/Product Issue Slip
2. Daily Production & Rejection Record
```

The module must preserve the intent and useful fields from the company's current paper forms while providing a cleaner digital workflow, dashboard, auditability, searchability, and reporting.

## Product Access Rule

The entire Reject Reports workspace is a normal operational module.

Therefore:

```text
Page visibility = AUTHENTICATED
```

Every ACTIVE authenticated user must be able to:

- see `Reject Reports` in the application navigation/sidebar
- open the Reject Reports dashboard
- view Reject Reports
- create a new Issue Slip
- create a new Daily Reject record

This is an explicit product rule.

Do not accidentally make the page ADMIN-only or yazeed-only.

If the authorization architecture requires a mutation capability for creation, implement a deliberate baseline authenticated creation capability according to the existing policy architecture.

Do not misuse universal read permissions to hide the requirement.

## Navigation

Add a clear navigation item:

```text
Reject Reports
```

Choose a logical group based on the current IA, preferably Quality or another clearly justified operational group.

Use the canonical route registry.

Do not create navigation-only routes outside the registry.

## Suggested Routes

Use the current route architecture and naming conventions.

A suitable structure is:

```text
/reject-reports
/reject-reports/new
/reject-reports/issue-slips/[reportId]
/reject-reports/daily/[reportId]
```

You may use a type-selection page or a single creation route with a report-type selector if cleaner.

All normal routes are:

```text
AUTHENTICATED
```

## Main Reject Reports Dashboard

Create a useful operational dashboard.

At minimum show:

### Summary

- reports today
- reports this month
- total rejected quantity
- total Issue Slips
- total Daily Reject records
- Issue Slips awaiting approval confirmation
- completed Issue Slips
- Daily Reject records finalized
- recent reports

### Analytics

Where data supports it:

- reject trend by date
- reject quantity by item/product
- reject quantity by department/section
- reject reasons
- highest reject items
- Issue Slip approval status
- reject percentage trend

Do not invent data.

All analytics must derive from PostgreSQL.

### Filters

Support practical filters:

- date range
- report type
- status
- item code
- item/product name
- lot/batch
- department/section
- creator
- approval state for Issue Slips

Use pagination for potentially large data.

---

# Part A — Rejected Material/Product Issue Slip

The attached paper form is titled:

```text
Rejected (Material/Product) issue slip
```

Use it as a domain/UX reference.

The current paper example contains concepts such as:

- slip/reference number
- date
- goods description
- item code
- item name/description
- lot number
- unit
- quantity
- unit cost
- total
- remarks/reason
- prepared/approval/receiving signatures on the legacy paper process

The digital design must preserve the useful business information but does not need to mimic the old paper layout exactly.

## Issue Slip Data

Support at minimum:

```text
report number
report date
department / section
item code
item name
goods description
lot / batch number
unit
rejected quantity
unit cost (optional)
total cost/value (optional)
reject reason
detailed remarks
attachments/evidence
created by
created at
updated at
version
status
```

Generate a unique human-readable report number using the project conventions.

Do not rely only on a database UUID as the visible report number.

## Issue Slip Lifecycle

Use an explicit lifecycle similar to:

```text
DRAFT
→ ISSUED
→ APPROVAL_TRACKING
→ COMPLETED
```

Adapt names if existing project state-machine conventions make another vocabulary cleaner.

Do not allow destructive deletion of a completed controlled report.

Use VOID/correction semantics where appropriate.

## Approval Tracking Requirement

The user's requested workflow is:

After the Issue Slip is created, the report creator reaches a final approval-tracking stage.

There are exactly three required approval confirmations:

```text
1. Supervisor
2. QC Manager
3. Factory Director
```

The **report creator** marks each approval as confirmed/completed after the real-world approval has been obtained.

### Important Semantic Rule

These creator-set checkboxes are **approval confirmations**, not electronic signatures by the Supervisor/QC Manager/Factory Director.

Do NOT falsely record:

```text
Supervisor electronically approved
```

when the creator only confirms that approval was obtained.

For each approval checkpoint, store auditable metadata such as:

```text
approval role
status: PENDING / CONFIRMED
actual approver name (optional but recommended)
confirmation recorded by
confirmation timestamp
note/reference
evidence attachment if available
```

Only the report creator may normally mark these three approval confirmations unless the approved business policy explicitly allows an administrative recovery action.

The report becomes:

```text
COMPLETED
```

only when all three approval confirmations are confirmed.

Display the three approvals clearly as a progress tracker:

```text
Supervisor       ✓ Confirmed
QC Manager       ○ Pending
Factory Director ○ Pending
```

Use an accessible checkbox/toggle or explicit `Mark confirmed` action.

Every change must be audited.

A confirmation must be reversible only through a controlled correction path with reason and audit history; do not silently uncheck historical approval confirmation.

## Issue Slip Detail Page

Show:

- full report
- current status
- creator
- item/lot information
- quantity/value
- reject reason
- remarks
- attachments
- approval progress
- complete audit/history timeline

Provide printable styling suitable for replacing the paper form.

If the existing reporting/export architecture supports PDF/print safely, integrate with it rather than building a parallel export engine.

---

# Part B — Daily Production & Rejection Record

The attached paper example is titled:

```text
Daily Production & Rejection Record
```

It is a daily operational rejection record and does **not** require the three approval confirmations.

The paper form includes concepts such as:

- date
- department/section
- machine name
- FG / Small FG item code
- material/product description
- lot number
- BU & RM product name
- raw material details
- raw-material unit
- raw-material lot number
- RM type
- pump out
- total reject quantity
- total good production quantity
- reject percentage
- reject limit
- production formula / BOM
- handwritten reject/defect reason or analysis

Use these as the starting digital fields.

## Daily Reject Header

Support:

```text
record number
record date
department / section
shift if useful and supported
created by
status
created at
updated at
version
```

## Daily Reject Line Items

A Daily Reject record should support one or more rows/entries.

Each row should support, where applicable:

```text
machine name
item code
item/product description
lot number
BU/RM product name
raw-material description
raw-material unit
raw-material lot number
RM type
pump-out quantity
reject quantity
good production quantity
reject percentage
reject limit
production formula/BOM reference
reject reason / defect description
analysis / notes
```

Do not require fields that are genuinely not applicable to a specific entry.

## Reject Percentage

The supplied paper example visually shows:

```text
Reject Qty = 42
Good Production Qty = 303
Reject % ≈ 13.87
```

which corresponds approximately to:

```text
Reject Qty / Good Production Qty * 100
```

Use this paper convention only if it does not conflict with an approved existing business definition in the repository.

Before hard-coding the formula:

1. search current business rules/documentation
2. search Project Mind
3. inspect existing production/rejection logic

If no conflicting approved rule exists, use the paper-form convention and document it as the digital rule.

Calculate percentage server-side from numeric inputs.

Do not trust a client-supplied percentage.

Handle divide-by-zero safely.

## Daily Reject Lifecycle

No approval workflow is required.

Use a simple controlled lifecycle:

```text
DRAFT
→ FINALIZED
```

Allow correction/void according to project audit rules rather than destructive history rewriting.

## Daily Reject Detail

Show:

- header details
- all rows
- totals
- aggregate reject quantity
- aggregate good quantity
- reject percentage
- reasons
- creator
- audit history

Provide print-friendly output.

---

# PostgreSQL Data Model

Design the model using the existing domain/application/infrastructure architecture.

A reasonable design may include:

```text
reject_reports
reject_issue_slips
reject_issue_slip_approval_confirmations
daily_reject_entries
```

You may choose a cleaner normalized design if it better matches the current repository.

## Required Core Record

The parent record should support concepts such as:

```text
id
report_no
report_type
report_date
department
status
created_by
created_at
updated_at
version
finalized_at
voided_at
void_reason
```

Report type should be explicit, for example:

```text
ISSUE_SLIP
DAILY_REJECT
```

## Approval Confirmation Table

For Issue Slip, model each required checkpoint explicitly and audibly.

Do not store a JSON blob if relational rows provide stronger auditability and constraints.

Possible role vocabulary:

```text
SUPERVISOR
QC_MANAGER
FACTORY_DIRECTOR
```

Enforce one active checkpoint per report/role.

## Database Rules

Use:

- PK/FK
- unique report number
- useful indexes
- constraints
- versioning/optimistic concurrency
- timestamps
- controlled status vocabulary
- audit linkage

Create a **new forward migration**.

Do not modify previous migration files.

---

# Domain & Application Architecture

Create a dedicated module, for example:

```text
src/modules/reject-reports/
```

Follow the existing architecture:

```text
domain
application
ports
infrastructure
```

Pages/actions must not contain SQL or duplicate domain rules.

Create clear use cases such as:

```text
CreateIssueSlip
UpdateIssueSlipDraft
IssueIssueSlip
ConfirmIssueSlipApproval
GetIssueSlip
ListIssueSlips

CreateDailyReject
UpdateDailyRejectDraft
FinalizeDailyReject
GetDailyReject
ListDailyRejects

GetRejectDashboard
```

Names may follow existing project conventions.

---

# Authorization Rules

Product rule:

```text
all ACTIVE authenticated users:
- can view Reject Reports
- can create Issue Slip
- can create Daily Reject
```

Editing should normally be restricted to the creator while the report is editable.

Issue Slip approval confirmation should normally be restricted to the report creator, according to the user's requested workflow.

Finalized/completed records must not be silently editable.

Any yazeed administrative recovery capability must remain explicitly audited and must not forge approval identity.

Encode these rules server-side.

---

# Audit Requirements

Audit events should cover at minimum:

```text
REJECT_REPORT_CREATED
REJECT_REPORT_UPDATED
ISSUE_SLIP_ISSUED
ISSUE_SLIP_APPROVAL_CONFIRMED
ISSUE_SLIP_COMPLETED
DAILY_REJECT_FINALIZED
REJECT_REPORT_CORRECTED
REJECT_REPORT_VOIDED
```

Use existing project audit vocabulary/conventions when possible.

Do not duplicate the audit subsystem.

---

# Files / Evidence

Allow attachments using the existing file/evidence system.

Examples:

- defect photos
- scanned paper form
- supporting specification
- inspection evidence
- approval evidence

Apply existing:

- MIME
- size
- hash
- authorization
- evidence-link
- file safety

contracts.

---

# Search & Reporting Integration

Integrate Reject Reports into the current cross-domain platform.

Where the existing architecture supports it, include:

- global search
- dashboard
- reporting
- export/print
- audit
- notifications if useful

Search should support:

```text
report number
item code
item name
lot/batch
reason
creator
```

---

# UI/UX Requirements

Build a polished enterprise QC experience.

Main screen:

```text
Reject Reports
[New Report]

Summary cards
Charts/trends
Filters
Tabs:
- All
- Issue Slips
- Daily Reject
- Awaiting Approvals
- Completed
Recent reports table
```

New Report should clearly ask:

```text
What do you want to create?

[Rejected Material/Product Issue Slip]
Requires approval confirmation tracking

[Daily Production & Rejection Record]
No approval confirmation required
```

Use existing:

- layout
- design tokens
- tables
- forms
- dialogs
- error components
- pagination
- icon system

Do not use native `alert()` / `confirm()`.

Support responsive layouts at:

```text
320
360
768
1024
1440
```

---

# Tests

## Unit

Test:

- state machines
- report-number rules
- percentage calculation
- approval completeness
- permission rules
- correction/void rules

## PostgreSQL Integration

Test:

- create Issue Slip
- create Daily Reject
- multiple Daily Reject lines
- approval confirmations
- all-three → completed
- duplicate confirmation handling
- optimistic concurrency
- audit atomicity
- report queries/dashboard
- rollback behavior

## Authorization

Verify:

```text
ACTIVE authenticated user → view/create
anonymous → denied
non-creator → cannot mutate creator-owned draft unless explicitly authorized
creator → can manage own draft
creator → can confirm approval tracking
completed report → controlled/immutable
```

## E2E

Build flows:

### Issue Slip

```text
login
→ Reject Reports
→ New Report
→ Issue Slip
→ enter item/lot/quantity/reason
→ create
→ inspect detail
→ mark Supervisor approval confirmed
→ mark QC Manager approval confirmed
→ mark Factory Director approval confirmed
→ status becomes COMPLETED
→ verify dashboard
→ verify print view
```

### Daily Reject

```text
login
→ Reject Reports
→ New Report
→ Daily Reject
→ enter daily production/reject row
→ verify calculated reject %
→ add another row
→ finalize
→ verify dashboard analytics
→ verify detail/print
```

### Access

Verify at least two ordinary authenticated roles can both:

- see the module in navigation
- open it
- create reports

---

# Verification Commands

Run all applicable checks:

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
git diff --check
```

If PostgreSQL or browser infrastructure is unavailable, report the affected layers as `BLOCKED` / `NOT VERIFIED`.

Do not fake success.

---

# Documentation

Update current authoritative docs for the new Reject Reports domain.

Document:

- routes
- visibility
- data model
- Issue Slip workflow
- Daily Reject workflow
- approval-confirmation semantics
- reject percentage formula
- audit events
- extension points

Update Project Mind with a compact durable entry only after implementation/verification.

---

# Acceptance Criteria

The module is complete only when:

- Reject Reports is visible to all ACTIVE authenticated users
- all ACTIVE authenticated users can create both report types
- Issue Slip and Daily Reject are clearly separated
- Issue Slip has three creator-recorded approval confirmations:
  - Supervisor
  - QC Manager
  - Factory Director
- Issue Slip cannot become COMPLETED until all three are confirmed
- confirmation is not falsely represented as the approver's electronic signature
- Daily Reject requires no approval stage
- dashboard reflects PostgreSQL truth
- reject percentage is computed server-side
- reports are auditable
- PostgreSQL persistence is real
- navigation/search/reporting integration is complete
- responsive/accessibility patterns match the system
- unit/integration/E2E evidence is present
- no historical controlled report is silently deleted or rewritten

---

# Remaining Closure Prompts — QC-CLOSURE-008 to QC-CLOSURE-018

# Prompt 08 — QC-CLOSURE-008
## Equipment, Calibration & Maintenance Closure

You are executing task:

`QC-CLOSURE-008 — Equipment, Calibration & Maintenance Closure`

### Objective

Close the full laboratory asset lifecycle.

### Equipment

Verify:

- create
- identify
- active/inactive
- status history
- location
- calibration requirement
- maintenance requirement
- controlled evidence

### Calibration

Verify:

- scheduled
- due
- overdue
- completed
- failed
- certificate
- next due date
- immutable history

### Maintenance

Verify:

- preventive maintenance
- corrective maintenance
- open
- completed
- evidence
- downtime

### Integration

If business policy forbids use of invalid equipment, laboratory operations must fail safely when equipment is:

- overdue
- failed
- under maintenance
- inactive

### Required Tests

Cover:

- overdue calibration
- failed calibration
- maintenance lock
- concurrent update
- evidence preservation
- history access

---

# Prompt 09 — QC-CLOSURE-009
## Controlled Documents, Templates, Change Control, Approvals & E-Signatures

You are executing task:

`QC-CLOSURE-009 — Controlled Documents, Templates, Change Control, Approvals & E-Signatures`

### Objective

Close controlled QMS records.

### Controlled Document Lifecycle

Use the approved project contract, typically equivalent to:

```text
DRAFT
-> UNDER_REVIEW
-> APPROVED / EFFECTIVE
-> REVISED
-> SUPERSEDED
-> ARCHIVED / VOID
```

Do not edit approved controlled content in place if project rules prohibit it.

### Templates

Verify:

- inspection templates
- laboratory templates
- versions
- review
- approval
- supersede
- evidence

### Change Requests

Verify:

- reason
- impact
- affected records
- review
- approval
- audit
- implementation reference

### E-Signature

A valid signature must bind:

- actor
- timestamp
- action
- record
- exact version
- meaning
- reauthentication evidence

Never store the password itself as evidence.

### Required Negative Tests

Add tamper and invalid-history tests for controlled records.

---

# Prompt 10 — QC-CLOSURE-010
## Cross-Domain Integration, Search, Audit, Files, Notifications & Reports

You are executing task:

`QC-CLOSURE-010 — Cross-Domain Integration, Search, Audit, Files, Notifications & Reports`

### Objective

Ensure modules behave as one integrated system rather than isolated feature islands.

### Cross-Domain Effects

Verify workflows such as:

```text
Inspection approved
-> Audit updated
-> Search updated
-> Dashboard updated
-> Related record status updated
-> Notification emitted
-> Report reflects current state
```

and:

```text
Lab result approved
-> Quality context
-> Evidence
-> Audit
-> Reporting
```

### Search

Verify:

- authorization-safe results
- item
- lot/batch
- tasks
- records
- documents
- common identifiers

### Files / Evidence

Verify:

- size validation
- MIME validation
- filename safety
- object hash
- ownership
- authorization
- evidence relationships
- immutable metadata where required
- missing object handling
- tampered object handling

### Notifications

Verify:

- correct recipients
- no uncontrolled duplicates
- retry/idempotency
- read/unread
- no sensitive leakage

### Reports

Verify:

- DB truth consistency
- filtering
- export
- current state
- sensitive-field authorization
- no hidden mutation authority

---

# Prompt 11 — QC-CLOSURE-011
## Enterprise UI/UX, Design System, Responsive & Accessibility

You are executing task:

`QC-CLOSURE-011 — Enterprise UI/UX, Design System, Responsive & Accessibility`

### Objective

Raise the entire system to a consistent enterprise QC application experience.

### Required Viewports

Test:

```text
320px
360px
768px
1024px
1440px
```

### Standardize

- app shell
- page headers
- sections
- cards
- tables
- forms
- buttons
- badges
- status patterns
- dialogs
- toasts
- pagination
- sorting
- filtering
- loading states
- empty states
- error states

### Forms

Every form must provide:

- real labels
- field-linked errors
- required indicators
- retained values on failure
- pending state
- double-submit prevention
- stale conflict recovery
- clear success feedback

### Dialogs

Do not use native:

```js
alert()
confirm()
```

for critical workflows.

### Accessibility

Target WCAG 2.2 AA.

Verify:

- keyboard
- focus
- focus return
- dialog focus trap
- skip links
- landmarks
- headings
- labels
- contrast
- touch targets
- screen-reader semantics

### RTL / Localization Readiness

Even if English remains the current primary UI, ensure the architecture supports:

```text
locale
direction
LTR
RTL
```

Avoid layout assumptions that block future Arabic/RTL support.

---

# Prompt 12 — QC-CLOSURE-012
## Security, Privacy & AI Safety Closure

You are executing task:

`QC-CLOSURE-012 — Security, Privacy & AI Safety Closure`

### Objective

Perform a full defensive application security closure.

### Authentication Security

Review and test:

- Argon2 parameters
- brute-force protection
- rate limiting
- session fixation
- session expiry
- secure cookies
- logout
- revocation

### Application Security

Test:

- CSRF
- XSS
- SQL injection
- IDOR
- privilege escalation
- mass assignment
- path traversal
- file upload abuse
- MIME confusion
- oversized files
- malicious filenames
- sensitive error leakage
- secret leakage

### Headers

Verify:

- CSP
- HSTS where applicable
- frame protections
- referrer policy
- content-type protections

### Privacy

Review:

- logs
- reports
- exports
- audit
- sessions
- personal information
- error messages

### AI Governance

AI Advisory must remain:

```text
advisory only
```

AI must never autonomously:

- APPROVE
- RELEASE
- SIGN
- DELETE controlled records
- change scientific acceptance criteria

Test:

- prompt injection
- unsafe instructions
- provider unavailability
- malformed AI output
- human override / human authority

---

# Prompt 13 — QC-CLOSURE-013
## Testing Architecture & Evidence Closure

You are executing task:

`QC-CLOSURE-013 — Testing Architecture & Evidence Closure`

### Objective

Create complete requirement-to-evidence traceability for every critical workflow.

### Traceability Model

For each critical requirement map:

```text
Requirement
-> Implementation
-> Unit
-> Integration
-> PostgreSQL
-> Security
-> E2E
-> UAT
```

### Audit the Test Estate

Find:

- source-text-only tests
- brittle tests
- orphan tests
- skipped tests
- tests outside CI
- duplicate tests
- fake/no-op tests
- tests that assert implementation instead of behavior

### Required Suites

All applicable commands must pass:

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
pnpm release:tech-debt:check
git diff --check
```

### Negative Paths

Explicitly test:

- unauthenticated
- unauthorized
- stale
- duplicate
- missing dependency
- DB unavailable
- missing file
- tampered file
- invalid state transition

---

# Prompt 14 — QC-CLOSURE-014
## Performance, Reliability & Observability

You are executing task:

`QC-CLOSURE-014 — Performance, Reliability & Observability`

### Objective

Close performance and operational reliability gaps.

### Performance Audit

Inspect:

- N+1 queries
- large tables
- pagination
- filters
- indexes
- expensive reports
- dashboard queries
- search
- payload size
- Astro output
- JavaScript bundle impact

### Data Volume Scenarios

Test realistic or synthetic volumes for:

- users
- tasks
- inspections
- laboratory tests
- audit events
- reports
- documents

### Observability

Establish and verify:

- structured logs
- request IDs
- user-safe error IDs
- metrics
- health
- readiness
- tracing
- dependency degradation reporting

### Sensitive Data Rule

Never log:

- credentials
- database URLs
- password hashes
- session tokens
- secrets

---

# Prompt 15 — QC-CLOSURE-015
## Backup, Restore, Deployment & Production Evidence

You are executing task:

`QC-CLOSURE-015 — Backup, Restore, Deployment & Production Evidence`

### Objective

Close the major production-readiness evidence gaps.

### Real Backup

Execute a real logical backup in a safe non-destructive environment.

Capture:

- backup ID
- timestamp
- duration
- size
- checksum
- migration head
- PostgreSQL version

### Isolated Restore

Execute a real restore into an isolated PostgreSQL 18 target.

Verify:

- migrations
- table/record parity
- FK integrity
- audit history
- e-signatures
- evidence links
- file hashes
- sessions
- release governance

### Negative Recovery Tests

Test:

- missing file
- tampered file
- migration checksum mismatch
- incomplete restore
- stale release identity

### Render Verification

Verify the actual deployed service:

- deployed Git SHA
- build ID
- release ID
- migration head
- domain
- TLS
- health
- readiness
- runtime environment
- logs

### Provider Capability

Determine with actual evidence:

- backups
- retention
- PITR
- WAL
- RPO
- RTO

If unavailable:

```text
BLOCKED / POLICY DECISION REQUIRED
```

Do not invent provider capabilities.

---

# Prompt 16 — QC-CLOSURE-016
## Real UAT, Usability & Human Validation

You are executing task:

`QC-CLOSURE-016 — Real UAT, Usability & Human Validation`

### Objective

Produce real human validation evidence.

### Required Personas

At minimum:

- Employee
- Inspector
- Supervisor
- Manager
- Administrator
- yazeed / SYSTEM_OWNER

### Required Scenarios

Test:

- login
- navigation
- normal page visibility
- yazeed-only page isolation
- receiving
- inspection
- laboratory
- HOLD
- release
- controlled documents
- approvals
- user administration
- reports
- error recovery
- stale data
- mobile use

### Record for Every Session

```text
Participant role
Scenario
Expected result
Actual result
PASS / FAIL
Time
Observed issue
Severity
Evidence
Sign-off
```

### Important

An empty UAT template is not UAT evidence.

Automated E2E is not a replacement for real UAT.

---

# Prompt 17 — QC-CLOSURE-017
## Independent Final 100% Closure Audit

You are executing task:

`QC-CLOSURE-017 — Independent Final 100% Closure Audit`

### Objective

After Tasks 001–016, independently re-audit the entire current system from fresh evidence.

Do not reuse old scores as conclusions.

### Freeze Current State

```bash
git rev-parse HEAD
git status --short
```

### Re-Evaluate All 80 Domains

Use the evidence ladder:

```text
Implementation
Unit
Integration
PostgreSQL
E2E
UX / UAT
Production
```

### Recheck

- exact-head verification
- all tests
- PostgreSQL
- migration parity
- page visibility
- yazeed-only isolation
- authorization
- security
- QC workflows
- laboratory
- equipment
- documents
- approvals
- reports
- recovery
- Render
- UAT

### Rule for 100%

Do not award 100% to any domain if any required evidence layer is missing.

Do not claim:

```text
Overall = 100%
Production Ready = 100%
GO
```

while any of these remain:

- FAIL
- BLOCKED
- NOT VERIFIED
- P0
- P1

### Required Output

Produce a final closure audit with:

```text
Domain
Previous score
Current score
Current evidence
Remaining gap
```

If the system is not actually 100%, report the truthful score.

---

# Prompt 18 — QC-CLOSURE-018
## Full Repository Read + Complete Documentation Synchronization

You are executing the final task:

`QC-CLOSURE-018 — Full Repository Read + Complete Documentation Synchronization`

Run this task only after all implementation and closure work is complete.

### Objective

Read the entire final repository and synchronize every living document with the actual final implementation.

This is not a README-only update.

This is repository-wide documentation truth synchronization.

---

## Step 1 — Freeze Final State

Capture:

```bash
git rev-parse HEAD
git branch --show-current
git status --short
git diff --stat
git diff --name-status
node --version
pnpm --version
```

Determine:

- final HEAD
- migration head
- page count
- route count
- module count
- test counts
- release identity
- deployment identity
- readiness state
- UAT status
- restore status

---

## Step 2 — Read the Entire Repository

Read and understand all meaningful files in:

```text
src/**
db/**
scripts/**
tests/**
docs/**
Documents/**
audit/**
.agents/**
.github/**
public/**
```

Also inspect:

```text
AGENTS.md
README*
package.json
pnpm-lock.yaml
render.yaml
astro.config.*
playwright.config.*
vitest.config.*
tsconfig.*
.env.example
all architecture files
all policy files
all operational runbooks
```

Do not limit yourself to files changed by prior tasks.

---

## Step 3 — Build Documentation Inventory

Enumerate every documentation file and classify it:

```text
CURRENT / AUTHORITATIVE
REFERENCE
HISTORICAL
AUDIT EVIDENCE
ARCHIVED
SUPERSEDED
GENERATED
```

Historical audits must not be treated as current-state documentation.

---

## Step 4 — Update All Living Documentation

Synchronize every CURRENT/AUTHORITATIVE document with final code.

Cover at least:

### General

- README
- setup
- development
- deployment
- environment
- architecture

### Architecture

- domain map
- module map
- dependency rules
- application boundaries
- persistence
- shared infrastructure

### Routes & Pages

Document:

```text
PUBLIC
AUTHENTICATED
YAZEED_ONLY
```

Create or update a route matrix containing:

```text
ID
Path
Page
Domain
Visibility
Navigation
Read behavior
Mutation authority
Yazeed-only
Tests
```

### Authorization

Document:

- roles
- permissions
- scopes
- SoD
- SYSTEM_OWNER
- yazeed
- universal page visibility
- mutation authority
- direct URL protection

State clearly:

> Page visibility does not grant mutation authority.

### Data Model

Update:

- schemas
- tables
- relationships
- migrations
- current migration head
- state columns
- history
- audit

### QC

Document:

```text
Receiving
Quarantine
Inspection
Review
HOLD
Reject
Release
```

Document the invariant:

```text
PASS != RELEASED
```

### Laboratory

Document:

- tests
- samples
- measurements
- limits
- retests
- scientific governance
- review
- approval

### Assets

Document:

- equipment
- calibration
- maintenance

### Controlled Records

Document:

- controlled documents
- templates
- change requests
- approvals
- e-signatures

### Cross-Cutting

Document:

- audit
- files
- evidence
- notifications
- search
- reports
- dashboard

### Operations

Document:

- CI
- testing
- E2E
- UAT
- security
- observability
- backup
- restore
- deployment
- Render
- health/readiness
- release identity

---

## Step 5 — Create/Update the Extensibility Guide

Create or update:

```text
docs/architecture/EXTENDING-THE-SYSTEM.md
```

Explain exactly how to add:

### A New Domain

```text
module
domain
application
ports
infrastructure
actions
pages
tests
docs
```

### A New Page

Explain:

1. where to create the page
2. how to register the route
3. how to add navigation
4. how to add breadcrumb metadata
5. how to classify visibility

Default:

```text
AUTHENTICATED
```

Use:

```text
YAZEED_ONLY
```

only when explicitly required.

### A New Permission

Explain:

- declaration
- policy
- role grant
- server-side authorization
- negative tests

### A New Migration

Explain:

- naming
- forward-only policy
- integrity
- tests
- migration head

### A New Workflow

Explain:

- state machine
- permissions
- persistence
- audit
- outbox
- UI
- E2E

### A New Report

Explain:

- read model/query
- authorization
- filters
- export
- tests

---

## Step 6 — Eliminate Documentation Drift

Search repository-wide for stale:

- SHA values
- migration heads
- test counts
- route counts
- page counts
- versions
- role behavior
- permission behavior
- page visibility model
- SYSTEM_OWNER behavior
- filenames
- dead routes
- invalid commands
- deployment instructions
- architecture statements

Correct every living/current document.

---

## Step 7 — Preserve Historical Truth

Do not rewrite historical audits to match the present.

If an old document is no longer authoritative:

- preserve its historical truth
- classify it as Historical/Superseded
- add a pointer to the current document when useful

---

## Step 8 — Update Project Mind Last

After all repository and documentation synchronization is complete:

Read `.agents/mind/01-mind-latest.md` completely again.

Update only durable current state:

- exact HEAD
- migration head
- authorization
- visibility
- SYSTEM_OWNER
- testing evidence
- production evidence
- open issues

Remove stale current-state facts and unnecessary duplication.

Add one concise ledger entry.

Do not modify:

```text
02-mind-*
03-mind-*
brain.md
```

outside the formal rollover rules.

---

## Step 9 — Verify Documentation

Check:

- broken links
- dead paths
- missing referenced files
- invalid commands
- wrong routes
- wrong package versions
- wrong migration head
- contradictory current documents

Compare documentation against actual code.

---

## Final Acceptance Criteria

The task is complete only when:

```text
entire repository read
+
current docs match final code
+
historical docs preserved
+
no contradictory current-state docs
+
route visibility docs match implementation
+
YAZEED_ONLY documented correctly
+
mutation authority documented separately from visibility
+
EXTENDING-THE-SYSTEM.md is complete
+
database docs current
+
testing docs current
+
deployment docs current
+
recovery docs current
+
Project Mind current and compact
```

### Absolute Final Rule

Do not run:

```text
git commit
git push
merge
deploy
```

unless the user explicitly requests it.

### Final Response

Return:

```text
Final HEAD:
Final migration head:
Final page count:
Final route count:
Final test status:
Final E2E status:
Final UAT status:
Final restore status:
Final production readiness:
Documents updated:
Documents marked historical:
Project Mind updated:
Remaining blockers:
```

If any blocker remains, do not claim:

```text
100% complete
```
