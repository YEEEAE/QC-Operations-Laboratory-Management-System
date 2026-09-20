# Role operating & support guides

**Task:** QC-100-FINAL-020 — role-specific daily operation and support guides
**Status:** CURRENT for the candidate working tree. Derived operational layer only.

> This document maps each operational role's day to **real routes** and
> **approved permissions**. It is a derived layer, not a policy source: it does
> not redefine roles, permissions, states, or authority. The canonical sources
> remain `Documents/ROLE-MATRIX.md`, `Documents/PERMISSION-MATRIX.md`,
> `Documents/STATE-MACHINES.md`, `Documents/BUSINESS-RULES.md`, and the running
> code (`src/shared/authorization/*`, `db/seeds/common.ts`). On any conflict,
> the canonical source wins.

## How to read this guide

- **Routes** are canonical registry entries (`src/shared/routing/routes.ts`);
  the route-checked help page (`/help`) and unit contract
  (`tests/unit/ui/help-content-contract.test.ts`) keep every link below bound to
  the live registry.
- **Permissions** are the approved codes granted to each foundation role in
  `db/seeds/common.ts` (`FOUNDATION_ROLE_PERMISSIONS`). A permission code listed
  here is a *citation*, not a new grant.
- **Page visibility ≠ mutation authority.** Every active authenticated member
  can open the ordinary operational pages and read their records. Create, edit,
  review, approve, release, void, restore, and sign actions stay governed
  server-side by permission + scope + state + version + SoD + signature +
  business rules. Denied and read-only states render the page but hide the
  action and explain the refusal.
- **Two-stage controlled approval** (`Documents/STATE-MACHINES.md`,
  `ROLE-MATRIX.md` §55A): stage-1 is Supervisor only, final is QCM (role
  `MANAGER`) or the named system owner. Admin is denied in both stages.
- **`PASS ≠ RELEASED`.** The inspection/lab scientific result and the release
  system state are separate facts. A passing test never releases material by
  itself.

---

## 1. Employee — primary operational executor

**Purpose:** execute assigned work, enter operational data, create drafts,
attach evidence, submit for review, respond to returned work.

### Start of day

1. Open `/dashboard` — review the action counts and the attention queue. `null`
   means "not available for this account", not zero.
2. Open `/notifications?unread=1` — clear your own notifications.
3. Open `/tasks?assignee=mine&due=overdue` then `/tasks?assignee=mine&due=today`.
4. Open `/quarantine/inspections?state=RETURNED&ownership=mine` — returned work
   comes first in the day.

### Primary tasks and routes

| Work | Route | Approved permission(s) |
| --- | --- | --- |
| Create and progress own tasks | `/tasks`, `/tasks/new`, `/tasks/[taskId]` | `PERM-TASK-VIEW`, `PERM-TASK-CREATE`, `PERM-TASK-EDIT`, `PERM-TASK-UPLOAD-EVIDENCE`, `PERM-TASK-COMMENT`, `PERM-TASK-BLOCK`, `PERM-TASK-COMPLETE` (task/bulk operations resolve per stage) |
| Record a receiving item | `/quarantine/receiving`, `/quarantine/receiving/new` | `PERM-QUAR-VIEW`, `PERM-QUAR-CREATE`, `PERM-QUAR-EDIT` |
| Draft an inspection report | `/quarantine/inspections`, `/quarantine/inspections/[inspectionId]/execute` | `PERM-INSP-VIEW`, `PERM-INSP-CREATE`, `PERM-INSP-EDIT-DRAFT`, `PERM-INSP-ENTER-RESULT`, `PERM-INSP-UPLOAD-EVIDENCE`, `PERM-INSP-SUBMIT`, `PERM-INSP-PRINT`, `PERM-INSP-EXPORT` |
| Draft a laboratory test (samples, measurements) | `/laboratory/tests`, `/laboratory/tests/new`, `/laboratory/tests/[labTestId]/execute` | `PERM-LAB-VIEW`, `PERM-LAB-CREATE`, `PERM-LAB-EDIT-DRAFT`, `PERM-LAB-ENTER-SAMPLE`, `PERM-LAB-ENTER-MEASUREMENT`, `PERM-LAB-UPLOAD-EVIDENCE`, `PERM-LAB-SUBMIT`, `PERM-LAB-PRINT`, `PERM-LAB-EXPORT` |
| Raise a Finding / NCR | `/quality/findings`, `/quality/ncr` | `PERM-FIND-VIEW/CREATE/EDIT/SUBMIT`, `PERM-NCR-VIEW/CREATE/EDIT/SUBMIT` |
| Create reject reports | `/reject-reports`, `/reject-reports/new` | `PERM-RREJ-VIEW/CREATE/EDIT/CONFIRM-APPROVAL/FINALIZE/VOID` |
| Read controlled documents, equipment, calibrations | `/documents`, `/assets/equipment`, `/assets/calibrations` | `PERM-DOC-VIEW`, `PERM-DOC-DOWNLOAD`, `PERM-EQP-VIEW`, `PERM-CAL-VIEW` |
| Run/export own reports | `/reports` | `PERM-RPT-VIEW`, `PERM-RPT-RUN`, `PERM-RPT-EXPORT-CSV` |

**Employee does not hold** `PERM-INSP-APPROVE`, `PERM-LAB-APPROVE`,
`PERM-APR-APPROVE`, `PERM-ESIG-SIGN`, `PERM-QUAR-RELEASE`, or any
user/permission administration grant. Approval surfaces render read-only for an
Employee.

### Handoff — who acts next

- Employee submits a draft → the record moves to review. **The next actor is a
  Supervisor** (stage-1 review) — never the Employee, and never the Employee's
  own record.
- Employee blocked work → set the task to blocked (`PERM-TASK-BLOCK`) and
  comment; the **Supervisor** owns the follow-up.
- Employee cannot complete an inspection (missing work instruction, equipment
  ineligible, template invalid) → do not invent a result. Record the blocker and
  escalate to the **Supervisor** (see §7 exception recovery).

### Exception recovery

| Symptom | Meaning | Next action |
| --- | --- | --- |
| "Refresh record" / stale version | Your form was based on an older record version | Reload the record and re-apply the change. Never retry the stale intent. |
| Form hidden after opening a page | The action is not available for your role/state | Read the record; ask the Supervisor or QCM to act. Do not request a temporary Admin grant. |
| Returned work | Reviewer returned it for correction | Fix the draft, resubmit; the same reviewer path resumes. |
| "Not available" on a dashboard card | Your scope has no read for that register, or the provider is unavailable | Do not treat it as zero. Check `/notifications` and report to the Supervisor. |

---

## 2. Supervisor — operational oversight and stage-1 review

**Purpose:** supervise execution, review submitted work, coordinate workload,
identify and escalate exceptions.

### Start of day

1. `/dashboard` — "Needs review" counts and the attention queue.
2. `/approvals` — items waiting at your stage.
3. `/quarantine/inspections?state=SUBMITTED` and
   `/laboratory/tests?state=SUBMITTED` — first-stage queues.
4. `/tasks?assignee=mine&due=overdue` — team/own overdue work.
5. `/quarantine/receiving?inspectionResult=HOLD` — HOLD items needing attention.

### Primary tasks and routes

| Work | Route | Approved permission(s) |
| --- | --- | --- |
| Review, return, or reject submitted work | `/approvals/[approvalId]`, `/quarantine/inspections/[inspectionId]/review`, `/laboratory/tests/[labTestId]/review` | `PERM-INSP-REVIEW/RETURN/REJECT`, `PERM-LAB-REVIEW/RETURN/REJECT`, `PERM-APR-REVIEW/RETURN/REJECT` |
| Stage-1 approval (UNDER_REVIEW → PENDING_QCM_APPROVAL) | same review route | `PERM-INSP-APPROVE`, `PERM-LAB-APPROVE` |
| Release a receiving item | `/quarantine/receiving/[receivingId]` | `PERM-QUAR-RELEASE` (+ state/scope/version/SoD/ceremony) |
| Void a controlled inspection/lab record where policy allows | record detail route | `PERM-INSP-VOID`, `PERM-LAB-VOID` |
| Authorize / perform a retest | `/laboratory/tests/[labTestId]/retests/new` | `PERM-LAB-RETEST`, `PERM-LAB-AUTHORIZE-RETEST` |
| Approve a controlled document | `/documents/[documentId]/versions/[versionId]/review` | `PERM-DOC-APPROVE`, `PERM-ESIG-SIGN` |

**Supervisor holds stage-1 only.** The final approval grant
`PERM-APR-APPROVE` is deliberately absent from the Supervisor bundle, so the
final approval of an inspection/lab record is refused for Supervisor by policy.

### Handoff — who acts next

- Stage-1 approved → **the QCM (role `MANAGER`) or the named system owner**
  performs final approval with a binding e-signature.
- Cannot act because of SoD (you authored/executed the record) → **another
  Supervisor or the QCM** acts; never override SoD.
- Exception beyond your scope (critical FAIL, recurring failure, unresolved
  HOLD, major NCR) → escalate to the **QCM/Manager**.
- Technical failure (provider outage, migration/runtime error) → escalate to
  **Admin** for the technical fault; Admin does not take a scientific decision.

### Exception recovery

| Symptom | Meaning | Next action |
| --- | --- | --- |
| Refusal with "separation of duties" | You are author/executor/prior approver of that record | Hand the review to another authority; do not seek a waiver. |
| Stale version on review | The record changed since you loaded it | Reload and re-review from the fresh version. |
| Receiving item on `HOLD` | Release is refused by business rule | Correct/re-inspect; the record cannot be released from HOLD. |
| Rejected final approval then reversed | A final-approval checkpoint can be reversed and must be re-confirmed in order | Re-approve from the fresh version; the ordered confirmation path is enforced. |

---

## 3. Manager (QCM) — controlled decisions and final approval

**Purpose:** higher-level controlled decisions, final approval, quality
oversight, escalation, management visibility.

### Start of day

1. `/dashboard` — pending approvals, quarantine exceptions, calibration risk.
2. `/approvals` — records waiting for the final stage.
3. `/quarantine/inspections?workflowState=PENDING_QCM_APPROVAL` and
   `/laboratory/tests?state=PENDING_QCM_APPROVAL`.
4. `/quality/capa`, `/quality/ncr` — open quality risk.
5. `/change-requests` — pending controlled changes.

### Primary tasks and routes

| Work | Route | Approved permission(s) |
| --- | --- | --- |
| Final approval (PENDING_QCM_APPROVAL → APPROVED, locked) | `/approvals/[approvalId]`, review routes | `PERM-APR-APPROVE` + `PERM-ESIG-SIGN` + reauthentication |
| Return/reject at the QCM stage | review routes | `PERM-INSP-RETURN/REJECT`, `PERM-LAB-RETURN/REJECT`, `PERM-APR-RETURN/REJECT` |
| Release a receiving item | `/quarantine/receiving/[receivingId]` | `PERM-QUAR-RELEASE` |
| Approve controlled documents / change requests | `/documents/.../review`, `/change-requests/[changeRequestId]/review` | `PERM-DOC-APPROVE`, `PERM-CHG-*` (approval policy) |
| Void a controlled record where policy allows | record detail | `PERM-INSP-VOID`, `PERM-LAB-VOID`, `PERM-DOC-VOID` |
| Management reporting | `/reports` | `PERM-RPT-RUN`, `PERM-RPT-EXPORT-CSV/XLSX/PDF` |

**Manager does not hold** user/permission administration grants
(`PERM-IDN-MANAGE-USERS`, `PERM-ADM-USERS`, `PERM-ADM-ROLES`,
`PERM-ADM-PERMISSIONS`, `PERM-ADM-SCOPES`) and not `PERM-BKP-*`. Member
administration and owner system surfaces are not a Manager responsibility.

### Handoff — who acts next

- Final approval completes with a binding signature → the record is locked.
- A decision that needs a REOPEN (must be justified and is recorded) → **the
  final-approval authority** owns the REOPEN, then the two-stage order is
  re-enforced.
- Unresolved cross-domain / compliance / release-risk decision →
  **the named system owner** (business escalation), never the QCM acting alone
  beyond the approved policy.
- Platform/technical fault → **Admin**.

### Exception recovery

| Symptom | Meaning | Next action |
| --- | --- | --- |
| Refusal "POLICY_SOURCE_REQUIRED" on lab reject | The reject decision authority source is not yet approved (PD-38 open) | Do not invent a limit/criterion. Record the blocker and escalate to the owner via 013/026. |
| Refusal on final approval | Missing signature, stale version, or wrong state | Re-authenticate, sign, and reload the fresh version. |
| Inspection chain cannot be completed | No official inspection result source exists (F-013-1) | Fail-closed; record the dependency; do not fabricate a result. |
| Release refused after a passing test | `PASS ≠ RELEASED`; release has its own authority and SoD | Follow the release route; do not treat the pass as a release. |

---

## 4. Admin — system administration and protection

**Purpose:** non-exclusive system configuration, member administration, backup
administration, technical governance. **Admin is not a universal business
approver.**

### Start of day

1. `/dashboard` — administrative action count (`PERM-DASH-ADMIN`).
2. `/admin/users` — pending activations/deactivations and access requests.
3. `/audit` — recent administrative security events (role/scope grants).
4. `/system/backups` — backup posture (`PERM-BKP-VIEW`).

### Primary tasks and routes

| Work | Route | Approved permission(s) |
| --- | --- | --- |
| Provision / activate / deactivate a member | `/admin/users`, `/admin/users/new`, `/admin/users/[userId]` | `PERM-ADM-USERS`, `PERM-IDN-MANAGE-USERS`, `PERM-IDN-ACTIVATE/DEACTIVATE` |
| Reset password / revoke sessions | member detail | `PERM-IDN-RESET-PASSWORD`, `PERM-IDN-REVOKE-SESSIONS` |
| Assign roles / permissions / scopes | member/role/scope surfaces | `PERM-ADM-ROLE-ASSIGN`, `PERM-ADM-PERMISSION-ASSIGN`, `PERM-ADM-SCOPE-ASSIGN`, `PERM-ADM-ROLE-VIEW`, `PERM-ADM-PERMISSION-VIEW` |
| Read technical health and audit | `/audit`, admin projections | `PERM-ADM-AUDIT-VIEW`, `PERM-HLTH-*` reads |
| Operate backups and verify | `/system/backups`, `/system/backups/[backupId]`, `/system/backups/[backupId]/restore` | `PERM-BKP-CREATE`, `PERM-BKP-VERIFY`, `PERM-BKP-RESTORE-DRILL` (production restore is a separate authority) |
| System configuration / reference data | admin surfaces | `PERM-ADM-SYSTEM-CONFIG`, `PERM-ADM-SECURITY-CONFIG`, `PERM-ADM-REFERENCE-DATA`, `PERM-ADM-TEMPLATES` |

**Admin is denied** `PERM-INSP-APPROVE`, `PERM-LAB-APPROVE`, `PERM-APR-APPROVE`,
`PERM-ESIG-SIGN`, `PERM-QUAR-RELEASE`, and does **not** own `/system/health` or
`/system/control-center` (named-owner only). Admin cannot edit approved records
or rewrite audit history.

### Handoff — who acts next

- A business approval request from an Admin account → **Supervisor (stage-1) or
  QCM (final)** acts; Admin grants the permission explicitly rather than acting
  itself, and never uses "make them Admin" as a workaround.
- Security/authentication/database/migration/backup incident → **Admin** owns
  it and escalates to **the named system owner** for platform decisions; Admin
  takes no scientific QC decision out of a technical fault.
- Production restore → needs explicit authorization (owner) beyond the drill
  permission.

### Exception recovery

| Symptom | Meaning | Next action |
| --- | --- | --- |
| Cannot remove the owner's protected role/scope | Owner-grant protection is server-side | Expected; do not attempt to bypass it. |
| `/system/health` returns not-found for Admin | Named-owner-only surface | Expected; report the incident to the owner. |
| Provider unavailable ≠ empty | A read failed | Record the technical fault; do not delete or retry blindly. |

---

## 5. Named system owner (`yazeed` / `SYSTEM_OWNER`) — platform and final authority

**Purpose:** exclusive system health, control center, owner-grant protection,
final business escalation.

### Start of day

1. `/system/health` — readiness, database, migrations, storage, AI provider.
2. `/system/control-center` — accounts, owner overview, audit.
3. `/dashboard` — full owner view.
4. `/system/backups` — recovery posture.

### Routes and authority

| Work | Route | Note |
| --- | --- | --- |
| System health (sanitized) | `/system/health` | `YAZEED_ONLY`; requires role `SYSTEM_OWNER` **and** `loginIdentity === 'yazeed'` |
| Owner control center | `/system/control-center` | `YAZEED_ONLY`; uses the same use cases, no parallel policy |
| Owner grants / scope | `/admin/users/[userId]`, `/admin/scopes` | Protected owner grant is mandatory and cannot be removed |
| Final controlled approval | review routes | `PERM-APR-APPROVE` + `PERM-ESIG-SIGN` |
| Production recovery authorization | `/system/backups/[backupId]/restore` | separate authorization from drill |

The named owner surfaces show **sanitized** status only: no secrets, hashes,
sessions, or raw diagnostics.

---

## 6. Cross-role daily rhythm (summary)

| Stage | Owner | Route | Next owner |
| --- | --- | --- | --- |
| Work assigned | Employee | `/tasks` | Employee |
| Data entered / draft | Employee | receiving/inspection/lab routes | Employee |
| Submitted | Employee | review queue | Supervisor |
| Stage-1 decision | Supervisor | `/approvals` | QCM (Manager) or named owner |
| Final decision + signature | QCM / named owner | `/approvals` | locked record |
| Release | Supervisor or Manager with `PERM-QUAR-RELEASE` | `/quarantine/receiving/[receivingId]` | released record |
| Administrative/access change | Admin | `/admin/users` | audited |
| Platform/security/incident | Admin → named owner | `/system/health`, `/system/control-center` | owner decision |

Every transition above is enforced by `Documents/STATE-MACHINES.md` and
`PERMISSION-MATRIX.md`; this table only describes the human handoff.

---

## 7. Exception recovery and escalation ownership

Escalation is by **function**, not by naming a person. Where the organization
has not yet named an accountable person, the entry is `UNRESOLVED` in
`Documents/SUPPORT-OWNERSHIP-REGISTER.md` rather than invented here.

| Situation | First responder | Escalate to | Constraint |
| --- | --- | --- | --- |
| Blocked task / missing instruction | Employee | Supervisor | Do not invent a work instruction or result |
| Inspection cannot be completed (no result source) | Employee | Supervisor → QCM | Fail-closed; F-013-1 dependency |
| Equipment ineligible / calibration overdue | Employee | Supervisor | Equipment eligibility is verified fail-closed at submit |
| Critical FAIL / recurring failure | Supervisor | QCM | Manager business escalation |
| Unresolved HOLD | Supervisor | QCM | Release is refused from HOLD |
| CAPA close | Supervisor (with `PERM-CAPA-CLOSE`) | QCM | reason + reauthentication + e-signature required |
| Provider/unavailability or migration failure | Admin | Named system owner | Technical fault, not a QC decision |
| Security or authentication incident | Admin | Named system owner | Identity data is protected |

## 8. Service interruption instructions

When the application or its database is interrupted:

1. **Do not re-enter controlled data into a second channel.** There is no
   offline path that produces valid controlled records.
2. **Do not treat a failed read as an empty table.** The UI separates
   `UNAVAILABLE` from `EMPTY`; a missing number is never zero.
3. **Do not attempt a release, approval, or signature** while a dependency
   outage is shown. Retry only after `/api/health/ready` is healthy, and only by
   a technical owner.
4. Authentication is the technical owner's task; a scientific or release
   decision is never taken to work around an outage.
5. Record the incident window and the affected records; escalation ownership is
   in the support register.

## 9. References

- `Documents/ROLE-MATRIX.md`, `Documents/PERMISSION-MATRIX.md`
- `Documents/STATE-MACHINES.md`, `Documents/BUSINESS-RULES.md`,
  `Documents/SYSTEM-INVARIANTS.md`
- `Documents/INCIDENT-QUICK-REFERENCE.md`, `Documents/UAT-ACCEPTANCE-PLAN.md`
- `Documents/AUTHORIZATION-VISIBILITY-DECISION.md`, `Documents/UX-WRITING-GUIDE.md`
- `src/shared/routing/routes.ts`, `src/shared/authorization/*`, `db/seeds/common.ts`
- In-app help: `/help` (`src/pages/help/index.astro`)

> Verification status at authoring: links are route-registry checked
> (`tests/unit/ui/help-content-contract.test.ts`). Authenticated browser and
> assistive-technology review remain external dependencies (owners 003/006/040);
> they are recorded as `NOT RUN`, not as passing.
