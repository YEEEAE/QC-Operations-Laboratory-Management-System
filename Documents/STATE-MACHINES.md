# STATE-MACHINES.md

# QC Operations & Laboratory Management System

## State Machines & Controlled Lifecycle Specification — v1.0

---

# 1. Purpose

هذه الوثيقة هي المرجع الرسمي لدورات الحياة والـState Transitions داخل:

> **QC Operations & Laboratory Management System**

وهي تحدد:

```text
What states exist?
Which transitions are allowed?
Who may request them?
What must be true before transition?
What gets frozen?
What gets audited?
What side effects occur?
What happens on retry?
What happens on failure?
```

أي Transition غير موجود أو غير معتمد في هذه الوثيقة:

> **DENIED BY DEFAULT**

---

# 2. State Machine Authority

ترتيب المرجعية:

```text
SYSTEM-INVARIANTS.md
        ↓
BUSINESS-RULES.md
        ↓
ROLE-MATRIX.md
        ↓
PERMISSION-MATRIX.md
        ↓
STATE-MACHINES.md
        ↓
DATA-MODEL.md
        ↓
Implementation
```

إذا اختلف UI أو API مع State Machine المعتمدة:

> State Machine هي المرجع.

---

# 3. Core Transition Formula

أي Transition رسمي يجب أن يمر عبر:

```text
Authenticated Actor
+
Active Account
+
Required Permission
+
Authorized Scope
+
Current Entity State
+
Current Record Version
+
Business Preconditions
+
Separation of Duties
+
E-Signature where required
+
Transactional Execution
```

ثم:

```text
ALLOW TRANSITION
```

أو:

```text
DENY TRANSITION
```

---

# 4. Transition Identifier Convention

```text
TR-TASK-xxx
TR-FIND-xxx
TR-NCR-xxx
TR-RCA-xxx
TR-CAPA-xxx

TR-RCV-xxx
TR-INSP-xxx

TR-LAB-xxx
TR-RETEST-xxx

TR-EQP-xxx
TR-CAL-xxx
TR-MNT-xxx

TR-DOC-xxx

TR-CHG-xxx

TR-APR-xxx

TR-BKP-xxx
TR-RST-xxx
```

---

# 5. Transition Contract

كل Transition يجب أن يحدد عند التنفيذ:

```text
Transition ID
Entity
From State
Action
To State
Permission
Scope Requirement
Preconditions
Validation
Record Version Requirement
Separation of Duties
E-Signature Requirement
Transaction Requirement
Snapshot Requirement
Audit Requirement
Notification Requirement
Cross-Domain Effects
Idempotency Requirement
Failure Behavior
```

---

# 6. Global State Machine Rules

## SM-GEN-001 — Explicit Transitions Only

أي state change يجب أن يمر عبر transition معرفة رسميًا.

ممنوع:

```text
UPDATE status = 'APPROVED'
```

من Route أو UI أو SQL عشوائي.

---

## SM-GEN-002 — State Changes Through Application Use Cases

المسار:

```text
UI / API
   ↓
Application Use Case
   ↓
Authorization
   ↓
State Machine
   ↓
Domain Rules
   ↓
Transaction
   ↓
Persistence
```

---

## SM-GEN-003 — Client Cannot Declare Final State

Client لا يرسل:

```text
status = APPROVED
```

كمصدر للحقيقة.

يرسل intent:

```text
ApproveInspectionReport
```

والسيرفر يحدد النتيجة.

---

## SM-GEN-004 — Current State Is Revalidated at Execution Time

الحالة الموجودة في Browser ليست authoritative.

---

## SM-GEN-005 — Record Version Is Revalidated

Transitions الحساسة تستخدم optimistic concurrency.

---

## SM-GEN-006 — Invalid Transition Is Denied

مثال:

```text
DRAFT → APPROVED
```

إذا لم توجد transition معتمدة:

```text
DENY
```

---

## SM-GEN-007 — Terminal/Controlled States Are Protected

الحالات مثل:

```text
APPROVED
CLOSED
VOID
SUPERSEDED
```

لا ترجع مباشرة إلى:

```text
DRAFT
```

---

## SM-GEN-008 — RETURNED Preserves History

`RETURNED` لا يلغي:

```text
Previous submission
Review history
Comments
Audit
```

---

## SM-GEN-009 — VOID Is Historical

VOID لا يعني delete.

---

## SM-GEN-010 — SUPERSEDED Is Historical

الإصدار السابق يبقى محفوظًا.

---

## SM-GEN-011 — Critical Transitions Are Idempotent

خصوصًا:

```text
SUBMIT
APPROVE
RELEASE
VOID
CLOSE
COMPLETE
RETEST
```

---

## SM-GEN-012 — Critical Transitions Are Transactional

إذا transition ينتج أكثر من business effect مترابط:

```text
ALL COMMIT
or
ALL ROLLBACK
```

---

# 7. Common State Semantics

## DRAFT

```text
Editable
Incomplete allowed
Autosave permitted
Not controlled
```

## SUBMITTED

```text
Submission validation complete
Normal editing restricted
Workflow active
Historical submission event preserved
```

## UNDER_REVIEW

```text
Reviewer actively responsible
Author editing restricted
Review comments/actions allowed
```

## RETURNED

```text
Returned to author/executor
Correction permitted according to rules
Prior submission history preserved
```

## APPROVED

```text
Controlled
Immutable through ordinary editing
Requires correction/version/void path
```

## REJECTED

```text
Workflow decision rejected
Reason normally required
Original data retained
```

## CLOSED

```text
Business process formally completed
Ordinary modification denied
```

## VOID

```text
Invalidated but historically retained
```

## SUPERSEDED

```text
Replaced by newer controlled version
Read-only historical state
```

## ARCHIVED

```text
Inactive operationally
Still retained when required
```

---

# 8. Task State Machine

## States

Foundation states:

```text
DRAFT
OPEN
IN_PROGRESS
ON_HOLD
COMPLETED
CANCELLED
```

`REOPENED` لا يحتاج state مستقلة؛ يمكن أن يرجع `COMPLETED → IN_PROGRESS` عبر controlled transition إذا سمحت policy.

---

# 9. Task Lifecycle

```text
DRAFT
  ↓
OPEN
  ↓
IN_PROGRESS
 ├────────→ ON_HOLD
 │             ↓
 │        IN_PROGRESS
 │
 ├────────→ COMPLETED
 │
 └────────→ CANCELLED
```

---

# 10. Task Transitions

## TR-TASK-001 — Activate Draft Task

```text
From:
DRAFT

Action:
ACTIVATE

To:
OPEN
```

Permission:

```text
PERM-TASK-CREATE
```

Preconditions:

```text
Required task fields valid
Assignee valid if assignment required
Due date valid where required
```

Audit:

```text
REQUIRED
```

---

## TR-TASK-002 — Start Task

```text
OPEN
→
IN_PROGRESS
```

Permission:

```text
PERM-TASK-EDIT
```

Scope:

```text
ASSIGNED or authorized broader scope
```

---

## TR-TASK-003 — Put Task On Hold

```text
OPEN / IN_PROGRESS
→
ON_HOLD
```

Permission:

```text
PERM-TASK-BLOCK
```

Precondition:

```text
Blocker reason required
```

Audit:

```text
REQUIRED
```

---

## TR-TASK-004 — Resume Task

```text
ON_HOLD
→
IN_PROGRESS
```

Permission:

```text
PERM-TASK-EDIT
```

---

## TR-TASK-005 — Complete Task

```text
IN_PROGRESS
→
COMPLETED
```

Permission:

```text
PERM-TASK-COMPLETE
```

Preconditions:

```text
Mandatory checklist complete
Required evidence present
No unresolved mandatory blocker
```

Transaction:

```text
REQUIRED where related completion effects exist
```

Idempotent:

```text
YES
```

---

## TR-TASK-006 — Cancel Task

```text
DRAFT / OPEN / IN_PROGRESS / ON_HOLD
→
CANCELLED
```

Permission:

```text
POLICY-DEPENDENT
```

Reason:

```text
REQUIRED
```

Runtime default:

```text
DENY UNTIL POLICY APPROVED
```

---

## TR-TASK-007 — Reopen Completed Task

```text
COMPLETED
→
IN_PROGRESS
```

Permission:

```text
PERM-TASK-REOPEN
```

Reason:

```text
REQUIRED
```

Audit:

```text
REQUIRED
```

---

# 11. Finding State Machine

## States

```text
DRAFT
OPEN
UNDER_REVIEW
CLOSED
VOID
```

---

# 12. Finding Lifecycle

```text
DRAFT
 ↓
OPEN
 ↓
UNDER_REVIEW
 ├────→ CLOSED
 └────→ OPEN

DRAFT / OPEN / UNDER_REVIEW
        ↓
       VOID
```

---

# 13. Finding Transitions

## TR-FIND-001 — Open Finding

```text
DRAFT
→
OPEN
```

Preconditions:

```text
Description exists
Source/context defined where applicable
```

---

## TR-FIND-002 — Submit Finding for Review

```text
OPEN
→
UNDER_REVIEW
```

Permission:

```text
PERM-FIND-REVIEW or domain-specific submission policy
```

---

## TR-FIND-003 — Return Finding

```text
UNDER_REVIEW
→
OPEN
```

Reason:

```text
REQUIRED
```

---

## TR-FIND-004 — Close Finding

```text
UNDER_REVIEW
→
CLOSED
```

Permission:

```text
PERM-FIND-CLOSE
```

Status:

```text
POLICY-DEPENDENT
```

---

## TR-FIND-005 — Void Finding

```text
DRAFT / OPEN / UNDER_REVIEW
→
VOID
```

Permission:

```text
PERM-FIND-VOID
```

Reason:

```text
REQUIRED
```

---

# 14. NCR State Machine

## Foundation States

```text
DRAFT
OPEN
UNDER_INVESTIGATION
RCA_IN_PROGRESS
CAPA_IN_PROGRESS
READY_FOR_CLOSURE
CLOSED
VOID
```

---

# 15. NCR Lifecycle

```text
DRAFT
 ↓
OPEN
 ↓
UNDER_INVESTIGATION
 ↓
RCA_IN_PROGRESS
 ↓
CAPA_IN_PROGRESS
 ↓
READY_FOR_CLOSURE
 ↓
CLOSED
```

Alternative paths depend on QC policy.

`VOID` may be available before CLOSED.

---

# 16. NCR Transitions

## TR-NCR-001 — Open NCR

```text
DRAFT
→
OPEN
```

Preconditions:

```text
Nonconformance description
Affected source/item/lot/process where applicable
Required references
```

---

## TR-NCR-002 — Start Investigation

```text
OPEN
→
UNDER_INVESTIGATION
```

Permission:

```text
PERM-NCR-EDIT
```

---

## TR-NCR-003 — Start RCA

```text
UNDER_INVESTIGATION
→
RCA_IN_PROGRESS
```

Preconditions:

```text
Investigation context sufficient
```

---

## TR-NCR-004 — Move to CAPA

```text
RCA_IN_PROGRESS
→
CAPA_IN_PROGRESS
```

Preconditions:

```text
Required RCA complete
Root cause documented where required
```

---

## TR-NCR-005 — Ready for Closure

```text
CAPA_IN_PROGRESS
→
READY_FOR_CLOSURE
```

Preconditions:

```text
Required CAPA actions completed
Required verification completed according to policy
```

---

## TR-NCR-006 — Close NCR

```text
READY_FOR_CLOSURE
→
CLOSED
```

Permission:

```text
PERM-NCR-CLOSE
```

Status:

```text
POLICY-DEPENDENT
RUNTIME DEFAULT = DENY
```

Audit:

```text
REQUIRED
```

E-Signature:

```text
POLICY-DEPENDENT
```

---

## TR-NCR-007 — Void NCR

```text
DRAFT / OPEN / UNDER_INVESTIGATION
→
VOID
```

High-risk.

Reason required.

Permission:

```text
PERM-NCR-VOID
```

Runtime:

```text
DENY UNTIL VOID POLICY APPROVED
```

---

# 17. RCA State Machine

RCA يمكن أن يكون record مستقل مرتبط بـNCR.

## States

```text
DRAFT
IN_PROGRESS
SUBMITTED
APPROVED
RETURNED
VOID
```

---

# 18. RCA Lifecycle

```text
DRAFT
 ↓
IN_PROGRESS
 ↓
SUBMITTED
 ↓
APPROVED

SUBMITTED
 ↓
RETURNED
 ↓
IN_PROGRESS
```

---

# 19. RCA Transitions

## TR-RCA-001

```text
DRAFT
→
IN_PROGRESS
```

## TR-RCA-002

```text
IN_PROGRESS
→
SUBMITTED
```

Preconditions:

```text
Required analysis complete
Required root-cause information present
```

## TR-RCA-003

```text
SUBMITTED
→
RETURNED
```

Reason required.

## TR-RCA-004

```text
RETURNED
→
IN_PROGRESS
```

## TR-RCA-005

```text
SUBMITTED
→
APPROVED
```

Permission:

```text
PERM-RCA-APPROVE
```

Policy:

```text
POLICY-DEPENDENT
```

## TR-RCA-006

```text
DRAFT / IN_PROGRESS / SUBMITTED
→
VOID
```

Controlled.

---

# 20. CAPA State Machine

## States

```text
DRAFT
OPEN
IN_PROGRESS
AWAITING_VERIFICATION
EFFECTIVENESS_REVIEW
READY_FOR_CLOSURE
CLOSED
VOID
```

`EFFECTIVENESS_REVIEW` depends on final CAPA policy.

---

# 21. CAPA Lifecycle

```text
DRAFT
 ↓
OPEN
 ↓
IN_PROGRESS
 ↓
AWAITING_VERIFICATION
 ↓
EFFECTIVENESS_REVIEW
 ↓
READY_FOR_CLOSURE
 ↓
CLOSED
```

If effectiveness check is not required by approved policy:

```text
AWAITING_VERIFICATION
→
READY_FOR_CLOSURE
```

---

# 22. CAPA Transitions

## TR-CAPA-001 — Open CAPA

```text
DRAFT
→
OPEN
```

---

## TR-CAPA-002 — Start CAPA

```text
OPEN
→
IN_PROGRESS
```

---

## TR-CAPA-003 — Actions Complete

```text
IN_PROGRESS
→
AWAITING_VERIFICATION
```

Preconditions:

```text
All mandatory CAPA actions complete
Required evidence attached
```

---

## TR-CAPA-004 — Start Effectiveness Review

```text
AWAITING_VERIFICATION
→
EFFECTIVENESS_REVIEW
```

Status:

```text
POLICY-DEPENDENT
```

---

## TR-CAPA-005 — Ready for Closure

```text
EFFECTIVENESS_REVIEW
→
READY_FOR_CLOSURE
```

Precondition:

```text
Effectiveness accepted
```

---

## TR-CAPA-006 — Close CAPA

```text
READY_FOR_CLOSURE
→
CLOSED
```

Permission:

```text
PERM-CAPA-CLOSE
```

Policy:

```text
DENY UNTIL APPROVED
```

---

## TR-CAPA-007 — Void CAPA

Controlled high-risk transition.

Reason required.

---

# 23. Receiving Item State Model

Receiving يحتاج فصل ثلاث حقائق مختلفة.

## A. Receiving Workflow State

```text
PENDING
READY_FOR_INSPECTION
UNDER_INSPECTION
INSPECTION_COMPLETE
RELEASE_PENDING
RELEASED
HOLD
EXPIRED
CANCELLED
```

## B. Inspection Result

```text
NOT_STARTED
IN_PROGRESS
PASS
FAIL
HOLD
```

## C. Release System State

```text
NO
YES
```

هذه الثلاثة لا تدمج في field واحد.

---

# 24. Receiving Lifecycle

```text
PENDING
 ↓
READY_FOR_INSPECTION
 ↓
UNDER_INSPECTION
 ↓
INSPECTION_COMPLETE
 ↓
RELEASE_PENDING
 ↓
RELEASED
```

Alternative:

```text
UNDER_INSPECTION
→
HOLD
```

أو:

```text
INSPECTION_COMPLETE + FAIL/HOLD
→
HOLD
```

Expiry may result in:

```text
PENDING / READY_FOR_INSPECTION / HOLD
→
EXPIRED
```

حسب business policy.

---

# 25. Receiving Transitions

## TR-RCV-001 — Register Receiving Item

```text
New Record
→
PENDING
```

Preconditions:

```text
Required receiving identity valid
Qty valid
No business-invalid duplicate
```

Duplicate rule:

```text
UNCONFIRMED
```

---

## TR-RCV-002 — Mark Ready for Inspection

```text
PENDING
→
READY_FOR_INSPECTION
```

Preconditions:

```text
Required receiving data complete
Not expired
Not cancelled
```

---

## TR-RCV-003 — Start Inspection

```text
READY_FOR_INSPECTION
→
UNDER_INSPECTION
```

Permission:

```text
PERM-QUAR-START-INSPECTION
```

Cross-domain effect:

```text
Create/link Inspection Report
```

Transaction:

```text
REQUIRED
```

---

## TR-RCV-004 — Inspection Completed

```text
UNDER_INSPECTION
→
INSPECTION_COMPLETE
```

System-driven from approved Inspection outcome.

Not a manually set receiving status.

---

## TR-RCV-005 — Move to Release Pending

```text
INSPECTION_COMPLETE
→
RELEASE_PENDING
```

Preconditions:

```text
Inspection approved
Inspection result compatible with release
No blocking HOLD
```

Exact release compatibility:

```text
POLICY-DEPENDENT
```

---

## TR-RCV-006 — Release Receiving Item

```text
RELEASE_PENDING
→
RELEASED
```

Permission:

```text
PERM-QUAR-RELEASE
```

State of permission:

```text
DENY UNTIL BD-001/RD-006 APPROVED
```

Additional result:

```text
Release System = YES
```

Transaction:

```text
REQUIRED
```

Audit:

```text
REQUIRED
```

Idempotent:

```text
YES
```

E-Signature:

```text
POLICY-DEPENDENT
```

---

## TR-RCV-007 — Place on Hold

Possible:

```text
PENDING
READY_FOR_INSPECTION
UNDER_INSPECTION
INSPECTION_COMPLETE
RELEASE_PENDING
→
HOLD
```

Reason:

```text
REQUIRED
```

Permission:

```text
PERM-QUAR-HOLD
```

Policy:

```text
POLICY-DEPENDENT
```

---

## TR-RCV-008 — Remove Hold

```text
HOLD
→
previous valid operational state
```

هذا transition يحتاج تعريف دقيق لكيفية حفظ previous state.

القرار الحالي:

```text
POLICY-DEPENDENT
```

الأفضل معماريًا حفظ:

```text
hold_origin_state
```

أو transition target صريح حسب الحالة.

---

## TR-RCV-009 — Mark Expired

```text
Eligible non-terminal state
→
EXPIRED
```

قد يكون System-driven بواسطة trusted date logic.

لا يغير historical inspection outcome.

---

## TR-RCV-010 — Cancel Receiving Record

فقط قبل controlled downstream activity حسب policy.

```text
PENDING
→
CANCELLED
```

Status:

```text
POLICY-DEPENDENT
```

---

# 26. Inspection Report State Machine

## States

```text
DRAFT
SUBMITTED
UNDER_REVIEW
RETURNED
APPROVED
REJECTED
VOID
```

---

# 27. Inspection Lifecycle

```text
DRAFT
 ↓
SUBMITTED
 ↓
UNDER_REVIEW
 ├────────→ RETURNED
 │             ↓
 │           DRAFT
 │
 ├────────→ APPROVED
 │
 └────────→ REJECTED

APPROVED / REJECTED
        ↓
       VOID
```

`RETURNED → DRAFT` يعني editable working state مع history محفوظ، وليس إنشاء record جديد.

---

# 28. Inspection Transitions

## TR-INSP-001 — Create Report

```text
New
→
DRAFT
```

Preconditions:

```text
Valid Receiving Item
Approved Inspection Template Version
Authorized actor
```

Snapshot:

```text
Receiving identity context captured
Template version reference captured
```

---

## TR-INSP-002 — Submit Inspection

```text
DRAFT
→
SUBMITTED
```

Permission:

```text
PERM-INSP-SUBMIT
```

Preconditions:

```text
Mandatory fields complete
Mandatory inspection points complete
Required evidence present
Acceptance criteria sources valid
No unresolved validation errors
```

Snapshot:

```text
REQUIRED
```

At minimum freeze controlled context required for historical integrity.

Transaction:

```text
REQUIRED
```

Idempotent:

```text
YES
```

---

## TR-INSP-003 — Begin Review

```text
SUBMITTED
→
UNDER_REVIEW
```

Permission:

```text
PERM-INSP-REVIEW
+
PERM-APR-REVIEW
```

SoD:

```text
Author != Reviewer
```

Foundation default.

---

## TR-INSP-004 — Return for Correction

```text
SUBMITTED / UNDER_REVIEW
→
RETURNED
```

Permission:

```text
PERM-INSP-RETURN
+
PERM-APR-RETURN
```

Reason:

```text
REQUIRED
```

History:

```text
PRESERVED
```

---

## TR-INSP-005 — Resume Returned Inspection

```text
RETURNED
→
DRAFT
```

Permission:

```text
PERM-INSP-EDIT-DRAFT
```

This does not erase prior submission.

---

## TR-INSP-006 — Approve Inspection

```text
UNDER_REVIEW
→
APPROVED
```

Permission:

```text
PERM-INSP-APPROVE
+
PERM-APR-APPROVE
```

Current role policy:

```text
POLICY-DEPENDENT
RUNTIME DEFAULT = DENY
```

Preconditions:

```text
Required review complete
Current record version
No SoD conflict
Required evidence still valid
Controlled source references valid
Final result determinable
```

SoD default:

```text
Author != Approver
Executor != Approver
Reviewer != Approver
```

Reviewer/Approver combination remains policy-dependent.

Snapshot:

```text
FINAL CONTROLLED SNAPSHOT REQUIRED
```

Audit:

```text
REQUIRED
```

Transaction:

```text
REQUIRED
```

Cross-domain effects may include:

```text
Update Receiving inspection result
Update Receiving workflow
Generate Finding/NCR trigger if applicable
Create notification
```

All required synchronous business consequences must be transactionally consistent.

---

## TR-INSP-007 — Reject Inspection

```text
UNDER_REVIEW
→
REJECTED
```

Permission:

```text
PERM-INSP-REJECT
+
PERM-APR-REJECT
```

Reason:

```text
REQUIRED
```

Important:

`REJECTED` هنا workflow decision، وليس بالضرورة نفس معنى scientific `FAIL`.

---

## TR-INSP-008 — Void Inspection

```text
APPROVED / REJECTED
→
VOID
```

High-risk.

Permission:

```text
PERM-INSP-VOID
```

Reason required.

E-Signature:

```text
POLICY-DEPENDENT
```

Original record remains.

Receiving consequence must be explicitly defined before implementation.

---

# 29. Inspection Result State

داخل التقرير نفسه يمكن Final Result أن يكون:

```text
PASS
FAIL
HOLD
```

ولا يعتبر State Machine lifecycle.

مثال:

```text
Lifecycle State:
APPROVED

Inspection Result:
FAIL
```

هذه حالة صحيحة.

---

# 30. Laboratory Test State Machine

## States

```text
DRAFT
SUBMITTED
UNDER_REVIEW
RETURNED
APPROVED
REJECTED
VOID
```

---

# 31. Laboratory Lifecycle

```text
DRAFT
 ↓
SUBMITTED
 ↓
UNDER_REVIEW
 ├────→ RETURNED → DRAFT
 ├────→ APPROVED
 └────→ REJECTED

APPROVED / REJECTED
        ↓
       VOID
```

---

# 32. Lab Test Transitions

## TR-LAB-001 — Create Lab Test

```text
New
→
DRAFT
```

Preconditions:

```text
Authorized actor
Valid Test Definition/Template
Required source entity valid
```

---

## TR-LAB-002 — Submit Lab Test

```text
DRAFT
→
SUBMITTED
```

Permission:

```text
PERM-LAB-SUBMIT
```

Preconditions:

```text
Required samples complete
Required measurements complete
Required units present
Required equipment identified
Required environmental data present
Required evidence present
Controlled criteria source valid
```

Snapshot:

```text
REQUIRED
```

Includes where applicable:

```text
Test Template version
Product/source context
WI/SOP version
Equipment snapshot
Calibration snapshot
Sample snapshot
Acceptance criteria
```

---

## TR-LAB-003 — Start Lab Review

```text
SUBMITTED
→
UNDER_REVIEW
```

Permission:

```text
PERM-LAB-REVIEW
+
PERM-APR-REVIEW
```

SoD:

```text
Executor/Author != Reviewer
```

Foundation default.

---

## TR-LAB-004 — Return Lab Test

```text
SUBMITTED / UNDER_REVIEW
→
RETURNED
```

Reason:

```text
REQUIRED
```

---

## TR-LAB-005 — Resume Returned Lab Test

```text
RETURNED
→
DRAFT
```

Preserve review/submission history.

---

## TR-LAB-006 — Approve Lab Test

```text
UNDER_REVIEW
→
APPROVED
```

Permission:

```text
PERM-LAB-APPROVE
+
PERM-APR-APPROVE
```

Role assignment:

```text
POLICY-DEPENDENT
RUNTIME DEFAULT = DENY
```

Preconditions:

```text
Current version
No SoD conflict
Required review complete
Scientific rules traceable
Required equipment/calibration context valid
Required evidence complete
```

Snapshot:

```text
FINAL SNAPSHOT REQUIRED
```

Transaction:

```text
REQUIRED
```

Audit:

```text
REQUIRED
```

E-Signature:

```text
POLICY-DEPENDENT
```

---

## TR-LAB-007 — Reject Lab Test

```text
UNDER_REVIEW
→
REJECTED
```

Reason required.

Does not destroy original measurements.

---

## TR-LAB-008 — Void Lab Test

```text
APPROVED / REJECTED
→
VOID
```

Permission:

```text
PERM-LAB-VOID
```

Runtime:

```text
DENY UNTIL VOID POLICY APPROVED
```

Reason:

```text
REQUIRED
```

---

# 33. Lab Scientific Result

Scientific result is separate from workflow state.

Possible:

```text
PASS
FAIL
HOLD
INCONCLUSIVE
```

`INCONCLUSIVE` is:

```text
UNCONFIRMED
```

until laboratory policy confirms it.

Example:

```text
Workflow:
APPROVED

Scientific Result:
FAIL
```

valid.

---

# 34. Retest State Model

Retest should not overwrite original Lab Test.

Recommended model:

> Retest is another Lab Test record with a formal relationship to the original.

Therefore Retest uses the same lifecycle as Lab Test.

---

# 35. Retest Request/Authorization State

If formal retest authorization is needed, use separate Retest Request:

```text
REQUESTED
UNDER_REVIEW
APPROVED
REJECTED
CANCELLED
```

This component is:

```text
POLICY-DEPENDENT
```

until retest policy is approved.

---

# 36. Retest Transitions

## TR-RETEST-001 — Request Retest

```text
No request
→
REQUESTED
```

Reason required.

---

## TR-RETEST-002 — Approve Retest Request

```text
REQUESTED / UNDER_REVIEW
→
APPROVED
```

Permission:

```text
PERM-LAB-AUTHORIZE-RETEST
```

Runtime:

```text
DENY UNTIL RETEST POLICY APPROVED
```

---

## TR-RETEST-003 — Create Retest Execution

Approved retest authorization:

```text
→ Create new Lab Test DRAFT
```

with:

```text
original_test_id
retest_reason
retest_sequence
```

Original record remains untouched.

---

# 37. Equipment State Machine

## States

Foundation:

```text
DRAFT
ACTIVE
OUT_OF_SERVICE
UNDER_MAINTENANCE
DECOMMISSIONED
```

Potential:

```text
QUARANTINED
```

is `UNCONFIRMED`.

---

# 38. Equipment Lifecycle

```text
DRAFT
 ↓
ACTIVE
 ├────→ OUT_OF_SERVICE
 ├────→ UNDER_MAINTENANCE
 │           ↓
 │         ACTIVE
 │
 └────→ DECOMMISSIONED
```

---

# 39. Equipment Transitions

## TR-EQP-001 — Activate Equipment

```text
DRAFT
→
ACTIVE
```

Preconditions:

```text
Required equipment identity complete
Required commissioning/calibration requirements satisfied according to policy
```

---

## TR-EQP-002 — Mark Out of Service

```text
ACTIVE
→
OUT_OF_SERVICE
```

Reason required.

---

## TR-EQP-003 — Start Maintenance

```text
ACTIVE / OUT_OF_SERVICE
→
UNDER_MAINTENANCE
```

---

## TR-EQP-004 — Return to Service

```text
UNDER_MAINTENANCE / OUT_OF_SERVICE
→
ACTIVE
```

Preconditions depend on maintenance/calibration policy.

---

## TR-EQP-005 — Decommission

```text
ACTIVE / OUT_OF_SERVICE / UNDER_MAINTENANCE
→
DECOMMISSIONED
```

High-risk.

Historical references remain valid.

Cannot be ordinary delete.

---

# 40. Calibration State Machine

## States

```text
DRAFT
SUBMITTED
APPROVED
CURRENT
DUE
OVERDUE
SUPERSEDED
VOID
```

Important:

`APPROVED` and `CURRENT` may be combined depending on final data model.

Recommended distinction:

```text
APPROVED
→ validated calibration event

CURRENT
→ active calibration governing equipment
```

---

# 41. Calibration Lifecycle

```text
DRAFT
 ↓
SUBMITTED
 ↓
APPROVED
 ↓
CURRENT
 ↓
DUE
 ↓
OVERDUE
```

When a newer calibration becomes current:

```text
Previous CURRENT/DUE/OVERDUE
→
SUPERSEDED
```

Historical record remains.

---

# 42. Calibration Transitions

## TR-CAL-001 — Submit Calibration

```text
DRAFT
→
SUBMITTED
```

---

## TR-CAL-002 — Approve Calibration

```text
SUBMITTED
→
APPROVED
```

Permission:

```text
PERM-CAL-APPROVE
```

Policy:

```text
POLICY-DEPENDENT
```

---

## TR-CAL-003 — Make Calibration Current

```text
APPROVED
→
CURRENT
```

Could occur atomically with approval if policy decides so.

Currently:

```text
POLICY-DEPENDENT
```

---

## TR-CAL-004 — Calibration Becomes Due

```text
CURRENT
→
DUE
```

System-driven using trusted time and approved interval.

---

## TR-CAL-005 — Calibration Becomes Overdue

```text
DUE / CURRENT
→
OVERDUE
```

System-driven.

---

## TR-CAL-006 — Supersede Previous Calibration

```text
CURRENT / DUE / OVERDUE
→
SUPERSEDED
```

Triggered transactionally when new calibration becomes current.

---

## TR-CAL-007 — Void Calibration

Eligible controlled calibration:

```text
→ VOID
```

High-risk.

Reason required.

---

# 43. Calibration vs Equipment Availability

Calibration `OVERDUE` does not automatically define Equipment transition until business policy decides.

Possible consequences:

```text
Warn only
Automatically OUT_OF_SERVICE
Require exception
Prevent Lab use
```

Current:

```text
UNCONFIRMED
```

No implementation should invent it.

---

# 44. Maintenance State Machine

## States

```text
DRAFT
PLANNED
IN_PROGRESS
COMPLETED
CANCELLED
VOID
```

---

# 45. Maintenance Lifecycle

```text
DRAFT
 ↓
PLANNED
 ↓
IN_PROGRESS
 ↓
COMPLETED
```

Alternative:

```text
DRAFT / PLANNED
→
CANCELLED
```

---

# 46. Maintenance Transitions

## TR-MNT-001

```text
DRAFT → PLANNED
```

## TR-MNT-002

```text
PLANNED → IN_PROGRESS
```

May update equipment:

```text
ACTIVE → UNDER_MAINTENANCE
```

transactionally where appropriate.

## TR-MNT-003

```text
IN_PROGRESS → COMPLETED
```

Does not automatically imply calibration validity.

## TR-MNT-004

```text
DRAFT / PLANNED → CANCELLED
```

Reason required.

---

# 47. Controlled Document State Machine

## States

```text
CATALOG_ONLY
DRAFT
IN_REVIEW
RETURNED
APPROVED
EFFECTIVE
SUPERSEDED
ARCHIVED
VOID
```

`APPROVED` vs `EFFECTIVE` remains important because effective-date policy is currently unconfirmed.

---

# 48. Document Lifecycle

For controlled content:

```text
DRAFT
 ↓
IN_REVIEW
 ├────→ RETURNED → DRAFT
 ↓
APPROVED
 ↓
EFFECTIVE
 ↓
SUPERSEDED
 ↓
ARCHIVED
```

Alternative:

```text
Approved / Effective
→
VOID
```

under exceptional controlled process.

---

# 49. Document Transitions

## TR-DOC-001 — Create Catalog Entry

```text
New
→
CATALOG_ONLY
```

Used when document identity exists but controlled content is not managed yet.

---

## TR-DOC-002 — Start Controlled Draft

```text
CATALOG_ONLY / New
→
DRAFT
```

---

## TR-DOC-003 — Submit Document for Review

```text
DRAFT
→
IN_REVIEW
```

Permission:

```text
PERM-DOC-SUBMIT
```

---

## TR-DOC-004 — Return Document

```text
IN_REVIEW
→
RETURNED
```

Reason required.

---

## TR-DOC-005 — Resume Document Draft

```text
RETURNED
→
DRAFT
```

---

## TR-DOC-006 — Approve Document

```text
IN_REVIEW
→
APPROVED
```

Permission:

```text
PERM-DOC-APPROVE
+
PERM-APR-APPROVE
```

Runtime:

```text
DENY UNTIL RD-019 APPROVED
```

Snapshot/hash:

```text
REQUIRED
```

E-Signature:

```text
POLICY-DEPENDENT
```

---

## TR-DOC-007 — Make Document Effective

```text
APPROVED
→
EFFECTIVE
```

Policy:

```text
UNCONFIRMED
```

Questions:

```text
Immediate on approval?
Future effective date?
Manual activation?
Scheduled activation?
```

---

## TR-DOC-008 — Create New Revision

Does not transition current document identity directly to DRAFT.

Instead:

```text
EFFECTIVE version N
+
Create version N+1 as DRAFT
```

Version N remains effective until new revision becomes effective.

---

## TR-DOC-009 — Supersede Previous Version

When new version becomes effective:

```text
Old EFFECTIVE
→
SUPERSEDED

New APPROVED
→
EFFECTIVE
```

These should occur transactionally.

---

## TR-DOC-010 — Archive

```text
SUPERSEDED
→
ARCHIVED
```

depending on retention policy.

---

## TR-DOC-011 — Void Document Version

High-risk controlled transition.

Reason required.

---

# 50. Change Request State Machine

## States

```text
DRAFT
SUBMITTED
UNDER_REVIEW
RETURNED
APPROVED
REJECTED
APPLYING
APPLIED
APPLICATION_FAILED
CANCELLED
```

---

# 51. Change Request Lifecycle

```text
DRAFT
 ↓
SUBMITTED
 ↓
UNDER_REVIEW
 ├────→ RETURNED → DRAFT
 ├────→ REJECTED
 └────→ APPROVED
           ↓
        APPLYING
        ├────→ APPLIED
        └────→ APPLICATION_FAILED
```

---

# 52. Change Request Transitions

## TR-CHG-001 — Submit Change Request

```text
DRAFT
→
SUBMITTED
```

Preconditions:

```text
Target identified
Current value snapshot
Proposed value
Reason
```

---

## TR-CHG-002 — Start Review

```text
SUBMITTED
→
UNDER_REVIEW
```

---

## TR-CHG-003 — Return Change Request

```text
UNDER_REVIEW
→
RETURNED
```

Reason required.

---

## TR-CHG-004 — Resume Returned Request

```text
RETURNED
→
DRAFT
```

---

## TR-CHG-005 — Approve Change Request

```text
UNDER_REVIEW
→
APPROVED
```

Permission:

```text
PERM-CHG-APPROVE
+
PERM-APR-APPROVE
```

Precondition:

```text
Target has not changed incompatibly
```

Approval does not directly mutate target.

---

## TR-CHG-006 — Reject Change Request

```text
UNDER_REVIEW
→
REJECTED
```

Reason required.

---

## TR-CHG-007 — Start Apply

```text
APPROVED
→
APPLYING
```

System/internal action.

Must revalidate:

```text
Current target version
Current target state
Business rules
Approved proposed value
```

---

## TR-CHG-008 — Apply Successfully

```text
APPLYING
→
APPLIED
```

Target update occurs through owning Domain.

Transaction:

```text
REQUIRED
```

---

## TR-CHG-009 — Application Failed

```text
APPLYING
→
APPLICATION_FAILED
```

Target must not be left partially modified.

Failure reason audited.

---

## TR-CHG-010 — Cancel Draft Request

```text
DRAFT / RETURNED
→
CANCELLED
```

Requester may be allowed based on permission policy.

---

# 53. Approval Assignment State Machine

Review/Approval infrastructure itself may use:

```text
PENDING
IN_PROGRESS
COMPLETED
RETURNED
CANCELLED
EXPIRED
```

لكن هذه states لا تستبدل state الخاصة بالـDomain record.

---

# 54. Approval Decision States

Approval decision:

```text
PENDING
APPROVED
REJECTED
RETURNED
CANCELLED
```

A decision record is append/history-oriented.

يجب عدم تعديل:

```text
APPROVED → REJECTED
```

لنفس decision row.

يُنشأ decision/event جديد إذا workflow يسمح بإجراء لاحق.

---

# 55. Approval Transition Rule

Approval Infrastructure لا تقوم:

```text
UPDATE lab_test.status = APPROVED
```

مباشرة.

بل:

```text
Approval verified
       ↓
Owning Domain Transition
       ↓
Domain becomes APPROVED
       ↓
Approval evidence linked
```

---

# 56. E-Signature Lifecycle

E-Signature ليست business state طويلة العمر.

هي evidence event مرتبطة بـAction.

Flow:

```text
Action requested
 ↓
Signature meaning shown
 ↓
Reauthentication
 ↓
Reauthorization
 ↓
Version check
 ↓
State check
 ↓
Signature evidence generated
 ↓
Controlled transition committed
```

إذا transition يفشل:

> لا يعتبر E-Signature دليلًا على Action ناجح.

---

# 57. Backup State Machine

## States

```text
REQUESTED
RUNNING
CREATED
VERIFYING
VERIFIED
FAILED
EXPIRED
DELETED
```

---

# 58. Backup Lifecycle

```text
REQUESTED
 ↓
RUNNING
 ├────→ FAILED
 ↓
CREATED
 ↓
VERIFYING
 ├────→ FAILED
 ↓
VERIFIED
```

---

# 59. Backup Transitions

## TR-BKP-001

```text
REQUESTED → RUNNING
```

## TR-BKP-002

```text
RUNNING → CREATED
```

Preconditions:

```text
Backup artifact created
Metadata recorded
```

## TR-BKP-003

```text
CREATED → VERIFYING
```

## TR-BKP-004

```text
VERIFYING → VERIFIED
```

Preconditions:

```text
Integrity verification successful
Expected metadata/checks valid
```

Important:

```text
VERIFIED != RESTORE_PROVEN
```

---

# 60. Restore Drill State Machine

## States

```text
REQUESTED
PRECHECK
RESTORING
VERIFYING
PROVEN
FAILED
CANCELLED
```

---

# 61. Restore Drill Lifecycle

```text
REQUESTED
 ↓
PRECHECK
 ↓
RESTORING
 ↓
VERIFYING
 ├────→ FAILED
 ↓
PROVEN
```

Only:

```text
PROVEN
```

means restore was demonstrated successfully.

---

# 62. Production Restore

Production restore uses similar states:

```text
REQUESTED
AUTHORIZED
PRECHECK
RESTORING
VERIFYING
COMPLETED
FAILED
```

لكن:

```text
PERM-BKP-RESTORE-PRODUCTION
```

currently:

```text
DENY UNTIL POLICY APPROVED
```

---

# 63. Cross-Domain Transition Rule

Cross-domain consequences must respect ownership.

Example:

```text
Inspection APPROVED
        ↓
Quarantine Application Contract
        ↓
Receiving transition
```

Inspection module must not:

```text
UPDATE receiving_items ...
```

directly through another Domain repository.

---

# 64. Cross-Domain Transaction Rule

إذا Business Invariant يتطلب atomicity across modules inside the modular monolith:

يجوز orchestrating transaction واحدة عبر Application Service.

مثال:

```text
Approve Inspection
+
Freeze inspection
+
Write approval
+
Update receiving outcome
+
Write audit
```

إذا كلها required synchronous effects:

```text
ONE TRANSACTION
```

---

# 65. Eventual Side Effects

بعض side effects يمكن أن تكون after-commit:

```text
Email
Non-critical notification delivery
Search indexing
Analytics
AI advisory refresh
```

لكن event creation/outbox evidence may need transaction linkage.

---

# 66. Notification Failure Rule

إذا Business transition committed لكن notification delivery failed:

لا يعاد تنفيذ business transition.

يتم retry notification فقط.

---

# 67. Search Index Rule

Search indexing failure لا يغير business state.

---

# 68. Reporting Rule

Reports لا تغير state.

---

# 69. Dashboard Rule

Dashboard لا تغير state مباشرة.

أي Action من Dashboard يجب أن يستدعي نفس Domain Use Case الرسمي.

---

# 70. AI State Rule

AI لا يملك أي transition مثل:

```text
AI_APPROVE
AI_REJECT
AI_RELEASE
AI_PASS
AI_FAIL
AI_VOID
```

هذه transitions:

```text
DO NOT EXIST
```

---

# 71. Controlled Correction Pattern

Approved controlled record لا يعود Draft.

التصحيح يستخدم أحد الأنماط:

```text
CORRECTION RECORD
NEW VERSION
VOID + REPLACEMENT
RETEST
SUPERSEDE
```

حسب Domain.

---

# 72. Correction State Recommendation

إذا نحتاج correction entity مستقلة لاحقًا:

```text
DRAFT
SUBMITTED
APPROVED
APPLIED
REJECTED
```

لكن لا تُنشأ الآن إلا عند Requirement فعلية.

---

# 73. Delete vs State Transition

Hard delete ليس lifecycle transition للسجلات controlled.

لا نضيف:

```text
APPROVED → DELETED
```

---

# 74. Draft Deletion

بعض DRAFT records قد تكون eligible للحذف.

هذا:

```text
POLICY-DEPENDENT
```

ويجب أن يحدد Domain-by-Domain.

---

# 75. State Mutation Audit

كل controlled transition يسجل على الأقل:

```text
Entity ID
Transition ID
From State
To State
Actor
Trusted Timestamp
Record Version Before
Record Version After
Reason where required
Request ID
Approval/Signature reference where applicable
```

---

# 76. Transition Reason Rules

Reason إلزامي افتراضيًا لـ:

```text
RETURN
REJECT
VOID
CANCEL
REOPEN
CONTROLLED CORRECTION
HOLD
```

إلا إذا policy تعرّف حالة مختلفة.

---

# 77. Transition Comment vs Reason

`Reason` controlled metadata.

`Comment` discussion metadata.

لا نعتبر comment عشوائي بديلًا عن required reason.

---

# 78. State Change Timestamps

لا نحتاج field مستقل لكل state بالضرورة.

لكن business-critical timestamps قد تشمل:

```text
submitted_at
review_started_at
approved_at
closed_at
voided_at
released_at
```

ويجب أن تحدد في Data Model بناءً على الحاجة.

---

# 79. State History

الحالة الحالية وحدها لا تكفي.

يجب أن نملك تاريخ transitions يمكن تتبعه.

مثال:

```text
DRAFT
→ SUBMITTED
→ RETURNED
→ DRAFT
→ SUBMITTED
→ UNDER_REVIEW
→ APPROVED
```

يجب إثبات المسار كاملًا.

---

# 80. Transition Retry Behavior

إذا client أعاد نفس request بسبب network timeout:

مثال:

```text
Approve record
```

والـapproval تم بالفعل بنفس idempotency key:

> لا ننشئ approval ثاني.

الاستجابة يجب أن تعكس النتيجة الحالية بشكل آمن.

---

# 81. Idempotency Key Candidates

للعمليات الحساسة يمكن استخدام:

```text
request_id
idempotency_key
action key scoped to actor/entity/version
```

القرار التقني في Architecture/Data Model.

---

# 82. Version Increment Rule

كل successful mutation مهمة يجب أن تحدث record version.

خصوصًا:

```text
Edit
Submit
Return
Approve
Void
Controlled correction
```

حسب entity design.

---

# 83. Stale Transition

إذا expected:

```text
version = 4
```

والحالي:

```text
version = 5
```

transition:

```text
DENY
```

بـstable error مثل:

```text
STALE_RECORD
```

---

# 84. State Machine and DB Constraints

حيث ممكن، DB تساعد في حماية state values.

مثال:

```text
CHECK state IN (...)
```

لكن transition legality لا تعتمد فقط على CHECK constraint.

---

# 85. No Multiple Canonical State Definitions

لكل entity يوجد state definition واحد canonical في code.

ممنوع:

```text
UI states.ts
API states.ts
DB states.ts
report states.ts
```

بتعريفات مختلفة.

---

# 86. State Machine Registry

لاحقًا يجب أن يحتوي codebase على registry/definitions قابلة للاختبار.

مثل:

```text
modules/
  inspection/
    domain/
      inspection-state-machine.ts
```

وليس state logic موزع في الصفحات.

---

# 87. Architecture Guard

CI يجب أن يمنع direct state mutations خارج approved domain/application layers قدر الإمكان.

---

# 88. State Manifest

يجب أن يكون ممكنًا استخراج:

```text
Entity
States
Transitions
Permissions
```

بشكل machine-verifiable مستقبلًا.

---

# 89. State Machine Test Contract

لكل transition:

```text
Allowed path test
Unauthorized actor test
Wrong state test
Wrong scope test
Stale version test
SoD conflict test
Missing precondition test
Retry/idempotency test
Transaction rollback test
Audit test
```

بحسب أهمية transition.

---

# 90. Inspection Approval Tests

يجب تغطية:

```text
DRAFT → APPROVED denied

SUBMITTED → APPROVED denied if UNDER_REVIEW required

Self approval denied

Wrong role/permission denied

Wrong scope denied

Stale version denied

Missing evidence denied

Missing required review denied

Successful approval atomic

Duplicate approval idempotent

Audit created

Receiving consequence consistent
```

---

# 91. Lab Approval Tests

تغطي نفس المبادئ +:

```text
Equipment context
Calibration context
Controlled test criteria
Required samples
Required measurements
```

---

# 92. Release Tests

عند اعتماد Release policy:

```text
PENDING → RELEASED denied

UNDER_INSPECTION → RELEASED denied

FAIL → release denied unless explicit exception policy exists

HOLD → release denied

Approved PASS + correct state + permission → allowed

Duplicate release → no duplicate effect

Stale version → denied

Missing signature if required → denied
```

---

# 93. Document Tests

```text
DRAFT cannot become EFFECTIVE directly

Old effective version remains until new effective version succeeds

Supersede + new effective is transactional

Approved content cannot edit directly

Historical Lab record remains linked to old revision
```

---

# 94. Change Request Tests

```text
Approved request cannot direct-edit target from UI

Stale target blocks application

Failed application leaves target unchanged

Applied request cannot apply twice

Rejected request cannot apply

History preserved
```

---

# 95. Backup Tests

```text
CREATED != VERIFIED

VERIFIED != RESTORE_PROVEN

Failed verification never marks VERIFIED

Failed restore never marks PROVEN
```

---

# 96. State Machine Decision Register

القرارات التالية ما زالت تحتاج اعتماد:

| Decision ID | Question                                                       |
| ----------- | -------------------------------------------------------------- |
| SD-001      | حالات Task النهائية الدقيقة وهل نحتاج CANCELLED؟               |
| SD-002      | من يستطيع Cancel/Reopen Task؟                                  |
| SD-003      | هل Finding يحتاج formal review دائمًا؟                         |
| SD-004      | هل NCR lifecycle الحالي يناسب QC policy الفعلية؟               |
| SD-005      | هل RCA record مستقل دائمًا أم جزء من NCR؟                      |
| SD-006      | هل كل CAPA يحتاج Effectiveness Review؟                         |
| SD-007      | هل HOLD في Receiving state مؤقت مع return-to-previous-state؟   |
| SD-008      | متى Receiving يصبح EXPIRED رسميًا؟                             |
| SD-009      | من يستطيع Release؟                                             |
| SD-010      | هل Release يحتاج E-Signature؟                                  |
| SD-011      | هل Inspection يحتاج separate `UNDER_REVIEW` أو يكفي SUBMITTED؟ |
| SD-012      | من يعتمد Inspection؟                                           |
| SD-013      | هل Inspection REJECTED تختلف عن FAIL بالشكل المقترح؟           |
| SD-014      | من يعتمد Lab Test؟                                             |
| SD-015      | هل `INCONCLUSIVE` Lab result مطلوبة؟                           |
| SD-016      | كم Retest مسموح؟                                               |
| SD-017      | هل Retest يحتاج Retest Request entity؟                         |
| SD-018      | من يأذن Retest؟                                                |
| SD-019      | ما تأثير Calibration overdue على Equipment state؟              |
| SD-020      | هل Calibration APPROVED وCURRENT حالتان منفصلتان؟              |
| SD-021      | هل maintenance completion يتطلب calibration قبل ACTIVE؟        |
| SD-022      | هل Document APPROVED وEFFECTIVE منفصلان؟                       |
| SD-023      | ما document effective-date policy؟                             |
| SD-024      | من يستطيع Void لكل entity؟                                     |
| SD-025      | Reviewer وApprover هل يمكن أن يكونا نفس الشخص؟                 |
| SD-026      | Draft deletion rules لكل Domain؟                               |
| SD-027      | من يستطيع Production Restore؟                                  |
| SD-028      | هل بعض controlled records تحتاج explicit ARCHIVED state؟       |

---

# 97. Runtime Default for Unconfirmed Transitions

أي Transition تعتمد على قرار غير محسوم:

```text
POLICY-DEPENDENT
```

وتعامل في Runtime:

```text
DENY
```

حتى اعتمادها.

---

# 98. Forbidden Transition Examples

ممنوع:

```text
Inspection DRAFT
→ APPROVED
```

ممنوع:

```text
Lab APPROVED
→ DRAFT
```

ممنوع:

```text
Document EFFECTIVE
→ DRAFT
```

ممنوع:

```text
Receiving PENDING
→ RELEASED
```

ممنوع:

```text
Change Request REJECTED
→ APPLIED
```

ممنوع:

```text
VOID
→ ACTIVE
```

ممنوع:

```text
SUPERSEDED
→ EFFECTIVE
```

إلا إذا future approved exceptional process عرّف transition صريحة.

---

# 99. No State Forging Through Import

CSV/Excel import لا يسمح بإنشاء record مباشرة في:

```text
APPROVED
CLOSED
RELEASED
SIGNED
```

إلا migration/import process controlled مستقل ومعتمد.

Default:

```text
Imported operational records start in safe pre-controlled state
```

حسب Domain.

---

# 100. No State Forging Through Admin

Admin UI لا يسمح:

```text
Select status = APPROVED
```

من dropdown عام.

Admin يستخدم نفس controlled transitions.

---

# 101. No State Forging Through Database Tools

أي operational correction خارج التطبيق لا يعتبر normal workflow.

يجب أن يخضع لـcontrolled operational procedure مع evidence إذا حدث لسبب طارئ.

---

# 102. Historical State Preservation

إذا تغير اسم state مستقبلاً:

يجب مراعاة historical interpretation/migration.

لا نعيد تفسير history القديم بصمت.

---

# 103. State Reason Codes

يمكن لاحقًا استخدام reason codes controlled بالإضافة للنص.

مثال:

```text
RETURN_MISSING_EVIDENCE
RETURN_DATA_ERROR
VOID_DUPLICATE
VOID_WRONG_LOT
HOLD_AWAITING_DOCUMENT
```

لكن لا نخترع القائمة قبل فهم workflows الفعلية.

---

# 104. Workflow Timer Rules

SLA/overdue timers لا تغير business state تلقائيًا إلا إذا policy تنص على ذلك.

مثال:

```text
UNDER_REVIEW
```

قد يصبح `overdue = true`

بدل state جديدة:

```text
OVERDUE_REVIEW
```

يفضل فصل lifecycle عن SLA flags.

---

# 105. Lifecycle vs Flags

لا نخلط كل شيء في state.

مثال Receiving:

```text
workflow_state = RELEASE_PENDING
inspection_result = PASS
release_system = NO
is_overdue = true
has_blocker = false
```

أفضل من state:

```text
PASS_RELEASE_PENDING_OVERDUE
```

---

# 106. Status Explosion Prevention

كل Domain يجب أن يفصل:

```text
Lifecycle state
Outcome/result
Operational flags
SLA state
Approval state where separate
```

حسب الحاجة.

---

# 107. Quality Outcome vs Lifecycle

مثال NCR:

```text
Lifecycle:
CLOSED

Outcome:
Resolved
```

إذا احتجنا outcome منفصل.

لا يتم إدخال outcome concepts في state بلا حاجة.

---

# 108. Equipment State vs Calibration State

مثال:

```text
Equipment:
ACTIVE

Calibration:
DUE
```

قد يكون valid حسب policy.

لذلك لا ندمج الاثنين في enum واحد.

---

# 109. Document State vs Acknowledgement

Document lifecycle مستقل عن:

```text
Employee has acknowledged document
```

Acknowledgement capability/state منفصلة إذا تم تنفيذها.

---

# 110. Approval State vs Entity State

Approval request:

```text
APPROVED
```

لا يعني entity became approved إذا Domain transition failed.

يجب تصميم العملية لمنع inconsistency، غالبًا بتنفيذ القرار + domain transition atomically عندما يكون القرار final.

---

# 111. Transaction Boundary Principle

في controlled final approval يفضل:

```text
Verify approval
Verify domain
Write approval evidence
Transition domain
Write audit
Create durable notification/outbox
```

داخل transaction واحدة عندما تكون كلها جزءًا من business fact.

---

# 112. State Machine Observability

كل failure مهم يمكن أن ينتج structured event:

```text
request_id
entity_type
entity_id
transition_id
from_state
requested_action
actor_id
result
error_code
```

بدون sensitive data غير ضرورية.

---

# 113. State Error Codes

مبدئيًا:

```text
STATE_INVALID_TRANSITION
STATE_WRONG_CURRENT_STATE
STATE_STALE_VERSION
STATE_PRECONDITION_FAILED
STATE_SOD_DENIED
STATE_SIGNATURE_REQUIRED
STATE_ALREADY_APPLIED
STATE_TERMINAL_RECORD
```

التسمية النهائية في `ERROR-ARCHITECTURE.md`.

---

# 114. User Error Example

بدل:

```text
Error 500
```

يظهر:

```text
This inspection cannot be approved because it is no longer under review.

Reload the record and review its current status.

Reference: REQ-XXXX
```

---

# 115. Foundation Machine Summary

```text
Tasks
DRAFT → OPEN → IN_PROGRESS → COMPLETED

Finding
DRAFT → OPEN → UNDER_REVIEW → CLOSED

NCR
DRAFT → OPEN → INVESTIGATION → RCA → CAPA → READY_FOR_CLOSURE → CLOSED

CAPA
DRAFT → OPEN → IN_PROGRESS → VERIFICATION → CLOSURE

Receiving
PENDING → READY_FOR_INSPECTION → UNDER_INSPECTION
→ INSPECTION_COMPLETE → RELEASE_PENDING → RELEASED

Inspection
DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED

Lab Test
DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED

Equipment
DRAFT → ACTIVE → OUT_OF_SERVICE / UNDER_MAINTENANCE → DECOMMISSIONED

Calibration
DRAFT → SUBMITTED → APPROVED → CURRENT → DUE → OVERDUE/SUPERSEDED

Document
DRAFT → IN_REVIEW → APPROVED → EFFECTIVE → SUPERSEDED → ARCHIVED

Change Request
DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED
→ APPLYING → APPLIED

Backup
REQUESTED → RUNNING → CREATED → VERIFYING → VERIFIED

Restore
REQUESTED → PRECHECK → RESTORING → VERIFYING → PROVEN
```

---

# 116. Foundation Relationship

```text
README.md
        ↓
QC-SYSTEM-DESIGN-CONSTITUTION.md
        ↓
SYSTEM-INVARIANTS.md
        ↓
DOMAIN-MAP.md
        ↓
BUSINESS-RULES.md
        ↓
ROLE-MATRIX.md
        ↓
PERMISSION-MATRIX.md
        ↓
STATE-MACHINES.md
        ↓
DATA-MODEL.md
        ↓
DATA-DICTIONARY.md
        ↓
REQUIREMENTS-TRACEABILITY.md
```

---

# 117. Final State Machine Principle

قبل أي Business Action نسأل:

```text
What entity is this?

What is its current state?

What transition is being requested?

Is that transition explicitly defined?

Does the actor have permission?

Is the record inside scope?

Is the record version current?

Does SoD allow it?

Are all required business preconditions met?

Is E-Signature required?

What snapshot must be frozen?

What must be audited?

What related state must change atomically?

What happens if the request is retried?

What happens if one side effect fails?
```

إذا لم توجد إجابة واضحة:

> **The transition is not ready for implementation.**

---

# 118. Document Status

```text
Document:
STATE-MACHINES.md

Version:
1.0

Product:
QC Operations & Laboratory Management System

Architecture:
Modular Monolith

Database:
PostgreSQL

State Policy:
Explicit transitions only

Unknown Transition:
DENY

Controlled Records:
No direct return to DRAFT after approval

Concurrency:
Version-aware

Critical Transitions:
Transactional + Idempotent

SoD:
Applied at transition execution

Unconfirmed Workflow Policies:
DENY UNTIL APPROVED

Status:
FOUNDATION — APPROVED STATE MACHINE FRAMEWORK

Next Foundation Document:
DATA-MODEL.md
```
