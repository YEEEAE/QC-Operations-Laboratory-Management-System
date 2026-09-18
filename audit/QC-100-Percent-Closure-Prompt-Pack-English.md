# QC Operations & Laboratory Management System
## Complete 100% Closure — Implementation Prompt Pack

**Repository:** `YEEEAE/QC-Operations-Laboratory-Management-System`

**Purpose:** Execute the following prompts in order. Each prompt is independent and copy-paste ready, but later prompts depend on evidence produced by earlier prompts.

---

# Global Rules — Apply to Every Prompt

Before executing **every task**:

1. Read `AGENTS.md` completely.
2. Read `.agents/mind/01-mind-latest.md` completely.
3. Freeze the current repository state:
   ```bash
   git rev-parse HEAD
   git branch --show-current
   git status --short
   git diff --stat
   ```
4. Never trust an old SHA, test count, migration head, route count, or readiness claim without verifying the current repository.
5. Inspect `.agents/skills/` and read every relevant `SKILL.md` before using that skill.
6. Inspect the current implementation before modifying anything.
7. Fix root causes, not symptoms.
8. Add regression tests for every defect or new contract.
9. Keep business rules out of Astro pages when they belong in Domain/Application/Policy layers.
10. Never use UI hiding as security. Authorization must be enforced server-side.
11. Any database schema change must use a new forward migration. Never rewrite historical migrations just to make tests pass.
12. Never weaken RBAC, SoD, validation, audit, or security controls to produce green tests.
13. Never invent scientific/QMS policy if no approved source exists.
14. Use explicit evidence states:
    - `PASS`
    - `FAIL`
    - `BLOCKED`
    - `NOT VERIFIED`
15. Never claim `100%`, `GO`, or `Production Ready` without complete evidence.
16. Update `.agents/mind/01-mind-latest.md` only with durable current-state facts that materially changed.
17. Never modify archived Project Mind files outside the formal rollover process.
18. Do not run:
    - `git commit`
    - `git push`
    - merge
    - deploy
    - force-push
    - remote repository writes
    unless the user explicitly requests that exact action.



---

# Prompt 06 — QC-CLOSURE-006
## Quality, Receiving, Quarantine, Inspection & Release Workflow

You are executing task:

`QC-CLOSURE-006 — Quality, Receiving, Quarantine, Inspection & Release Workflow`

### Objective

Close the full QC operational chain.

Reference journey:

```text
Receiving
-> Quarantine
-> Inspection
-> Review
-> Decision
-> HOLD / Reject
-> Release Governance
```

### Mandatory Invariant

```text
PASS != RELEASED
```

An inspection result of PASS must never automatically release the product.

### Receiving

Verify:

- item
- batch/lot
- quantity
- supplier
- receiving record
- timestamps
- evidence
- quarantine status

### Inspection

Verify:

- assignment
- execution
- result
- attachment/evidence
- WI/SOP/template linkage
- submit
- review
- return
- approve
- stale update handling
- concurrent update handling

### Quarantine

Verify:

- HOLD
- Reject
- released indicator
- quarantine history
- controlled correction
- no uncontrolled destructive delete

### Release

Release authority must be independent.

Test:

- PASS but unreleased
- HOLD
- Reject
- unauthorized release
- SoD
- duplicate release
- stale release
- audit
- evidence

### E2E

Build or complete a Playwright journey from Receiving to Release.

---

# Prompt 07 — QC-CLOSURE-007
## Laboratory & Scientific Governance Closure

You are executing task:

`QC-CLOSURE-007 — Laboratory & Scientific Governance Closure`

### Objective

Close the laboratory as a real governed scientific workflow, not only CRUD.

### Verify

- lab test definition
- test method
- sample
- measurement
- units
- specification limits
- result calculation
- PASS
- FAIL
- HOLD
- retest
- submit
- review
- approve
- evidence
- audit

### Scientific Policy Rule

Never invent:

- acceptance limit
- unit
- formula
- tolerance
- test method

If an approved source does not exist, mark:

```text
POLICY / SCIENTIFIC SOURCE REQUIRED
```

### Retest Governance

A retest must:

- preserve original test history
- require a reason
- require proper authority
- link to the original test
- create audit evidence
- preserve result history

### Equipment Integration

Where a test requires equipment, verify:

- equipment active state
- calibration state
- maintenance state
- availability

### Acceptance Criteria

Every lab state transition has:

- application use case
- authorization
- validation
- persistence
- audit
- unit test
- integration test
- critical E2E coverage

---

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
