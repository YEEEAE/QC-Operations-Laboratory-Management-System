# AGENTS.md — QC Operations & Laboratory Management System

> **Version:** 1.0
> **Updated:** 2026-09-04
> **Status:** ACTIVE — applies to every task in this repository
> **Repository:** `YEEEAE/QC-Operations-Laboratory-Management-System`
> **Product:** QC Operations & Laboratory Management System
> **Framework:** Astro (server-rendered / on-demand)
> **Database:** PostgreSQL
> **Architecture:** Modular Monolith

---

## 0. Source of Truth

Before every task:

1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read this `AGENTS.md`.
3. Read the relevant approved documents under `Documents/`.
4. Inspect current repository reality before trusting any historical claim.
5. Inspect `.agents/skills/` and use the relevant skill when one exists.

The previous BRIGHTAI / `apps/qc-task-manager` history is **not** authoritative for this repository.

Current authority order:

```text
Current repository / database / runtime reality
        ↓
Approved controlled company/QC sources
        ↓
Documents/SYSTEM-INVARIANTS.md
        ↓
Documents/QC-SYSTEM-DESIGN-CONSTITUTION.md
        ↓
Documents/DOMAIN-MAP.md
        ↓
Documents/BUSINESS-RULES.md
        ↓
Documents/ROLE-MATRIX.md
        ↓
Documents/PERMISSION-MATRIX.md
        ↓
Documents/STATE-MACHINES.md
        ↓
Documents/DATA-MODEL.md
        ↓
Documents/DATA-DICTIONARY.md
        ↓
Documents/REQUIREMENTS-TRACEABILITY.md
        ↓
Implementation
```

If sources conflict, do not silently choose one. Identify the conflict and resolve/update the relevant source explicitly.

---

## 1. Project Identity

This is an internal quality operations platform covering:

- Dashboard
- Tasks
- Quality: Findings / NCR / RCA / CAPA
- Quarantine: Receiving / Inspection / Release workflow
- Laboratory Testing
- Equipment / Calibration / Maintenance
- WI / SOP / Controlled Documents
- Reviews / Approvals / E-Signatures
- Change Requests
- Reports
- Administration
- System Health / Backup / Recovery
- AI Advisory

Shared capabilities include Authorization, Audit, Notifications, Files/Evidence, Search, Validation, Transactions, Errors, Observability, and Time.

---

## 2. Technology Baseline

### Astro

Astro is the official web framework.

This is not a static marketing site. Protected operational functionality uses server/on-demand rendering.

Delivery layer examples:

```text
src/pages/
src/actions/
src/middleware.ts
Astro API endpoints
Client islands
```

These must not own Business Rules.

### PostgreSQL

PostgreSQL is the official database from day one.

Principles:

- UUID technical IDs.
- Separate human-readable business IDs.
- `TIMESTAMPTZ` for event timestamps.
- UTC internally; display `Asia/Riyadh`.
- PK/FK/UNIQUE/CHECK/NOT NULL where appropriate.
- Transactions for critical operations.
- Optimistic concurrency via record versions.
- Historical migrations are immutable.

### Architecture

Use a Modular Monolith.

Canonical operation path:

```text
Astro Page / Client Island
        ↓
Astro Action / API Endpoint
        ↓
Authenticated Request Context
        ↓
Application Use Case
        ↓
Authorization
        ↓
Domain Rules / State Machine
        ↓
Transaction
        ↓
Repository
        ↓
PostgreSQL
        ↓
Audit / Outbox / Notifications
```

Forbidden:

```text
UI → Database
Astro Component → SQL
Client Island → Database
Route → cross-domain table mutation
```

---

## 3. Domain Boundaries

Business ownership follows `Documents/DOMAIN-MAP.md`.

Rules:

- One business fact has one owner.
- A Domain may reference another Domain but does not take ownership of its data.
- Cross-domain writes go through the owning Domain's application contract.
- Shared modules must not become a dumping ground for business rules.
- Reporting/Search/Dashboard are read-side consumers, not owners of source records.

Suggested source structure:

```text
src/
  modules/
    identity/
    tasks/
    quality/
    quarantine/
    laboratory/
    equipment/
    documents/
    approvals/
    change-requests/
    reporting/
    administration/
    ai/

  shared/
    authorization/
    database/
    transactions/
    audit/
    validation/
    security/
    errors/
    files/
    notifications/
    observability/
    search/
    time/

  ui/
    design-system/
    components/
    forms/
    tables/
    navigation/
    feedback/
```

---

## 4. Authorization

Core principle:

> **Role ≠ Permission**

Foundation roles:

- Employee
- Supervisor
- Manager
- Admin

Authorization must consider:

```text
Authenticated actor
+ Active account
+ Explicit permission
+ Scope
+ Entity
+ Current state
+ Separation of Duties
+ Record version
+ Business rules
+ E-Signature where required
```

Default is DENY.

Never use role-only authorization such as:

```ts
if (user.role === 'admin') allowEverything();
```

Admin is not a universal business approver.

Astro middleware may establish session/request context, but every sensitive Action/API operation must reauthorize server-side.

---

## 5. Controlled Records

Approved / Signed / Closed / Void / Superseded records are not ordinary editable drafts.

Changes happen through the appropriate controlled mechanism:

- Correction
- Return for correction
- New version
- Retest
- Void + replacement
- Supersede
- Change Request

Never silently rewrite controlled historical facts.

VOID and SUPERSEDED preserve history.

---

## 6. Quarantine Integrity

These are separate facts and must never be collapsed:

```text
Receiving Workflow State
Inspection Result
Release System State
```

`PASS` does not automatically equal `RELEASED`.

Release is an explicit controlled action and remains DENY until authority/policy is approved where unresolved.

---

## 7. Laboratory / Scientific Rules

Never invent:

- Acceptance limits
- Sampling plans
- Units
- Precision
- Rounding
- Test formulas
- Calibration intervals
- Retest limits

Scientific values must come from an approved controlled source.

Historical tests preserve:

- Raw measurements
- Exact test/template version
- WI/SOP/method version
- Equipment context
- Calibration context
- Acceptance criteria used

Master-data changes must not rewrite old test meaning.

---

## 8. State Machines

Only transitions defined by `Documents/STATE-MACHINES.md` are allowed.

Unknown transition = DENY.

Client sends intent, not authoritative final state.

Critical transitions revalidate at execution time:

- permission
- scope
- current state
- record version
- SoD
- required evidence
- business preconditions

---

## 9. Data Model

Follow `Documents/DATA-MODEL.md` and `Documents/DATA-DICTIONARY.md`.

Principle:

> Normalize current business truth. Snapshot historical controlled truth.

Avoid:

- giant generic QC tables
- giant uncontrolled JSONB records
- destructive cascades through controlled history
- arbitrary polymorphic references for core business relationships

JSONB is acceptable for controlled historical snapshots and structured platform payloads where justified.

---

## 10. Audit

Audit is not application logging.

Important mutations require appropriate evidence such as:

- Actor
- Trusted timestamp
- Entity
- Action/transition
- Before/after where appropriate
- Reason where required
- Request ID
- Signature reference where applicable

Audit history must not disappear because a user is deactivated or a business record becomes VOID/ARCHIVED.

Do not claim cryptographic audit immutability unless an implemented mechanism is verified.

---

## 11. E-Signatures

E-Signature is evidence for an already authorized action, not a permission grant.

Flow should include where required:

```text
Show signature meaning
→ Reauthenticate
→ Reauthorize
→ Check version/state/SoD
→ Create signature evidence
→ Commit controlled transition
```

Never store passwords as signature evidence.

---

## 12. AI

AI is advisory only.

The following AI capabilities must not exist as controlled authority:

```text
AI_APPROVE
AI_REJECT
AI_RELEASE
AI_SIGN
AI_PASS
AI_FAIL
AI_VOID
```

AI may summarize, explain, compare, suggest, and draft within authorized context.

Core QC workflows must continue to work if the AI provider is unavailable.

---

## 13. Files / Evidence

- PostgreSQL stores file metadata.
- Binary content goes through object storage abstraction.
- Store SHA-256 integrity hash.
- Validate MIME/type/size server-side according to approved policy.
- Controlled evidence must not be silently removed.
- File download authorization inherits the parent business record's access rules.

---

## 14. Reporting / Search / Dashboard

These are not authorization bypasses.

- Reports reuse canonical authorized datasets.
- CSV/XLSX/PDF must represent the same canonical report data.
- Search never reveals unauthorized record existence.
- Dashboard reads from owned Domains and does not create parallel business truth.
- Dashboard actions invoke the same official Domain use cases.

---

## 15. Testing Rules

Every important feature should be verified at the appropriate layers:

- Domain/unit
- Integration
- PostgreSQL/database
- Permission
- Negative/security
- Contract
- E2E
- Accessibility where relevant

High-risk actions must include negative cases such as:

- missing permission
- wrong scope
- wrong state
- SoD conflict
- stale version
- duplicate/replay request
- missing signature/evidence where required

Do not disable a failing required test simply to get green CI.

---

## 16. Verification Before Claims

Never claim:

```text
PASS
fixed
complete
100%
production ready
pilot ready
```

without fresh evidence.

Evidence should identify as relevant:

- branch/commit
- command
- exit code
- test counts
- files affected
- limitations
- environment

A file existing is not proof that its behavior works.
A test existing is not proof that it ran.
A build passing is not proof of complete requirements coverage.

---

## 17. Requirements Traceability

Features should ultimately map:

```text
Requirement
→ Business Rule
→ Permission
→ State Transition
→ Data Entity / Field
→ Implementation
→ Test
→ Evidence
```

Any missing link is a traceability gap.

No percentage may be reported without numerator, denominator, scope, date/current commit, and evidence source.

---

## 18. Accessibility / UX

Operational UI should prioritize desktop/laptop workflows while remaining usable on tablet/mobile.

Required principles include:

- semantic HTML
- keyboard operation
- visible focus
- programmatic labels
- no color-only status meaning
- clear error summaries
- focus first invalid field
- unsaved-change protection
- double-submit prevention
- clear scientific units
- 200% zoom usability
- appropriate contrast

Client islands are not exempt from A11y requirements.

---

## 19. Security

- No secrets in Git.
- No API keys in client bundles.
- Never trust client actor/role/permission/scope/state.
- Protect against IDOR.
- Validate all user input server-side.
- Evidence/report URLs must not become bearer authorization by accident.
- Sensitive server-only modules must not leak into Astro client bundles.
- Security-sensitive failures should use safe user messages and structured server logging.

---

## 20. Git / Repository Safety

Default rules:

- Do not `git push` unless the user explicitly requests it.
- Do not `git commit` unless explicitly requested.
- Do not create/push branches without explicit need/request.
- Do not `reset --hard` user work.
- Do not delete files without user approval.
- Do not modify `.env*` or secrets without explicit authorization.
- Do not modify CI/CD workflows casually; changes require a task-specific reason and verification.

If modifying through a connected GitHub tool, state clearly that the write creates commits on the target branch.

---

## 21. Skills

Project skills live under:

```text
.agents/skills/
```

Before specialized work:

1. inspect available relevant skills
2. read the applicable `SKILL.md`
3. follow it
4. do not use a legacy skill that conflicts with current Foundation documents without resolving the conflict

---

## 22. Mind Maintenance

The only current live mind is:

```text
.agents/mind/01-mind-latest.md
```

Do not recreate `.agents/brain.md` as a source of truth.

Do not create `02-mind-mid.md` / `03-mind-earliest.md` until archive rotation is genuinely needed.

After a real task, update the top of `01-mind-latest.md` with:

- date + task title
- what actually changed
- affected files
- verification performed
- actual result
- remaining gaps/limitations

Never record plans as completed work.

---

## 23. Final Checklist Before Completion Claims

- [ ] Read current project mind.
- [ ] Read relevant `Documents/` sources.
- [ ] Used applicable project skills.
- [ ] Implementation follows Domain boundaries.
- [ ] Authorization is server-side.
- [ ] State transitions follow the canonical machine.
- [ ] No scientific/policy values were invented.
- [ ] Controlled history remains preserved.
- [ ] Tests/verification were actually executed where applicable.
- [ ] Failures/skips/limitations are reported accurately.
- [ ] No secrets were introduced.
- [ ] Mind updated with actual results.
- [ ] No unsupported readiness/100% claim was made.

---

> **Final principle:** Business Rules First. Evidence Before Assertion. Code Serves the Controlled Process.
