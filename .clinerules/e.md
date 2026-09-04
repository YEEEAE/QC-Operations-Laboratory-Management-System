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
2. Read root `AGENTS.md`.
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

---

## 1. Core Project Rules

- Astro is the official web framework.
- Protected operational features use server/on-demand rendering.
- PostgreSQL is the official database.
- Architecture is a Modular Monolith.
- Business Rules live in Domain/Application layers, not Astro pages/components/actions.
- Default authorization is DENY.
- Role is not Permission.
- Admin is not a universal business approver.
- Controlled records cannot be silently rewritten.
- VOID/SUPERSEDED preserve history.
- Scientific values must come from approved controlled sources.
- AI is advisory only and cannot approve/reject/release/sign or set official PASS/FAIL.
- Critical operations are transactional and idempotent where applicable.
- Concurrent edits must never silently overwrite.
- No PASS/100%/readiness claim without current evidence.

---

## 2. Canonical Request Flow

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

## 3. Foundation Roles

- Employee
- Supervisor
- Manager
- Admin

Authorization considers:

```text
Actor + Account State + Permission + Scope + Entity + State + SoD + Version + Business Rule
```

Sensitive undefined behavior defaults to DENY.

---

## 4. Domain Integrity

Follow `Documents/DOMAIN-MAP.md`.

- One business fact has one owner.
- Cross-domain writes go through the owning Domain.
- Reporting/Search/Dashboard do not own source business truth.
- Shared modules do not absorb Domain rules.

---

## 5. Controlled Data Integrity

Follow `Documents/STATE-MACHINES.md`, `DATA-MODEL.md`, and `DATA-DICTIONARY.md`.

- Unknown transition = DENY.
- Client sends action intent, not authoritative final state.
- Current business truth is normalized.
- Historical controlled truth is snapshotted/versioned.
- No destructive cascade through controlled history.
- Approved/Signed/Closed/Void/Superseded records are not ordinary editable drafts.

---

## 6. Quarantine / Laboratory Critical Rules

Quarantine keeps separate:

```text
Receiving Workflow State
Inspection Result
Release System State
```

`PASS` does not automatically mean release.

Laboratory must preserve raw measurements and exact controlled context used at execution/approval time.

Never invent scientific limits, formulas, precision, rounding, sampling, calibration intervals, or retest policy.

---

## 7. Audit / E-Signature

Audit is separate from application logs and must survive business record state changes.

E-Signature:

```text
Meaning → Reauthentication → Reauthorization → State/Version/SoD Check → Evidence → Controlled Transition
```

Never store passwords as signature evidence.

---

## 8. Verification

Before claiming success, run the verification appropriate to the task.

Possible evidence:

- repository diff/current files
- lint/typecheck
- unit tests
- integration tests
- PostgreSQL/migration tests
- permission/negative tests
- concurrency/idempotency tests
- Astro build
- E2E
- accessibility checks

A file existing does not prove behavior works.
A test existing does not prove it ran.
A build passing does not prove complete requirements coverage.

---

## 9. Git Safety

- No push unless explicitly requested.
- No commit unless explicitly requested.
- No destructive reset of user work.
- No deleting files without approval.
- No secrets in code/mind/docs.
- No casual CI/CD changes.

Note: GitHub connector write actions create commits directly on the target branch. Use them only when the user explicitly requested repository modification.

---

## 10. Skills

`.agents/skills/` هو سجل المهارات المحلي للمشروع، ومتاح للاستخدام في كل مهمة.

قبل تنفيذ أي مهمة:

1. افحص المهارات الموجودة تحت `.agents/skills/` وحدد المهارة أو المهارات المطابقة للمهمة.
2. إذا وُجدت مهارة مطابقة، اقرأ ملف `SKILL.md` الخاص بها كاملًا قبل اتخاذ أي إجراء.
3. طبّق تعليمات المهارة واتبع فقط المراجع/الملفات الإضافية التي تطلبها المهارة أو تحتاجها المهمة.
4. إذا انطبقت عدة مهارات، استخدم أقل مجموعة تغطي المهمة واذكر ترتيب استخدامها.
5. إذا لم توجد مهارة مناسبة، اذكر ذلك باختصار ولا تدّعِ استخدام مهارة لم تُقرأ.

تعليمات المهارة لا تتجاوز تعليمات المستخدم أو وثائق Foundation أو قواعد هذا الملف. لا تُطبّق مهارة قديمة إذا تعارضت مع هذه المصادر؛ وثّق التعارض وأوقف الجزء المتعارض إلى أن يُحسم.

Do not blindly apply a legacy skill that conflicts with the current Foundation documents.

---

## 11. Project Mind

Current live project mind:

```text
.agents/mind/01-mind-latest.md
```

Do not recreate `.agents/brain.md` as a source of truth.
Do not create `02/03` archives until rotation is actually needed.

After completed repository work, update the live mind with actual changes, files, verification, outcome, and remaining gaps.

---

## 12. Completion Checklist

- [ ] Current mind read.
- [ ] Relevant Foundation documents read.
- [ ] Current repo reality inspected.
- [ ] Applicable skill used.
- [ ] Domain boundaries preserved.
- [ ] Server-side authorization preserved.
- [ ] State machine respected.
- [ ] No scientific/policy values invented.
- [ ] Controlled history preserved.
- [ ] Fresh verification executed.
- [ ] Limitations reported accurately.
- [ ] Mind updated.
- [ ] No unsupported readiness/100% claim.

---

> **Business Rules First. Evidence Before Assertion. Code Serves the Controlled Process.**
