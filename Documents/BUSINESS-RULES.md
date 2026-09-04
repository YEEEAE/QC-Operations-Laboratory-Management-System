# BUSINESS-RULES.md

# QC Operations & Laboratory Management System

## Business Rules Specification — v1.0

---

# 1. Purpose

هذه الوثيقة هي المرجع الرسمي لقواعد العمل الخاصة بنظام:

> **QC Operations & Laboratory Management System**

وهي تحول الرؤية والـDomain boundaries إلى قواعد قابلة للتنفيذ والاختبار.

الهدف:

```text
Business Rules First
Code Second
UI Third
```

أي Implementation أو API أو Database Constraint أو UI Workflow يجب أن يطابق هذه القواعد.

إذا تعارض الكود مع هذه الوثيقة:

> Business Rule المعتمد هو المرجع حتى تتم مراجعته وتعديله رسميًا.

---

# 2. Rule Status Model

كل Business Rule في هذه الوثيقة له حالة.

```text
APPROVED
```

قاعدة معتمدة ويمكن التنفيذ عليها.

```text
POLICY-DEPENDENT
```

المبدأ معتمد لكن التنفيذ يعتمد على `ROLE-MATRIX.md` أو `PERMISSION-MATRIX.md`.

```text
SOURCE-DEPENDENT
```

القاعدة تعتمد على مصدر Controlled معتمد مثل WI/SOP/Specification/Test Method.

```text
UNCONFIRMED
```

قرار تجاري/تشغيلي لم يتم اعتماده بعد.

أي Rule بحالة `UNCONFIRMED`:

> ممنوع على المطور أو Agent أو AI افتراض قيمته.

---

# 3. Rule Identifier Convention

```text
BR-GEN-xxx   Global
BR-IDN-xxx   Identity
BR-AUTH-xxx  Authorization
BR-TASK-xxx  Tasks
BR-QUAL-xxx  Quality
BR-QUAR-xxx  Quarantine / Receiving
BR-INSP-xxx  Inspection
BR-LAB-xxx   Laboratory
BR-EQP-xxx   Equipment
BR-CAL-xxx   Calibration
BR-MNT-xxx   Maintenance
BR-DOC-xxx   Controlled Documents
BR-APR-xxx   Reviews / Approvals
BR-ESIG-xxx  E-Signatures
BR-CHG-xxx   Change Requests
BR-RPT-xxx   Reports
BR-AUD-xxx   Audit
BR-FILE-xxx  Files / Evidence
BR-NOT-xxx   Notifications
BR-SRCH-xxx  Search
BR-DASH-xxx  Dashboard
BR-ADM-xxx   Administration
BR-BKP-xxx   Backup / Recovery
BR-AI-xxx    AI Advisory
BR-XDOM-xxx  Cross-Domain
```

---

# 4. Global Business Rules

## BR-GEN-001 — Server Is Authoritative

**Status:** APPROVED

UI visibility لا تعتبر Authorization.

كل عملية حساسة يجب إعادة التحقق منها Server-side.

ممنوع الاعتماد على:

```text
Hidden button
Disabled field
Client-side validation
Client-side role
```

كوسيلة حماية وحيدة.

---

## BR-GEN-002 — Default Deny

**Status:** APPROVED

أي Action أو Route أو Report جديد:

```text
DENIED
```

حتى يتم السماح له صراحة في Authorization Policy.

---

## BR-GEN-003 — Controlled History Cannot Be Silently Rewritten

**Status:** APPROVED

السجل الذي أصبح:

```text
APPROVED
SIGNED
CLOSED
VOID
SUPERSEDED
```

لا يعامل كـDraft.

أي تصحيح يتم عن طريق:

```text
Correction
Revision
New Version
Void
Supersede
```

بحسب نوع السجل.

---

## BR-GEN-004 — VOID Preserves History

**Status:** APPROVED

`VOID` لا يعني Delete.

يجب الاحتفاظ بـ:

```text
Original record
Previous state
Void reason
Actor
Timestamp
Approval/signature evidence where required
Audit history
```

---

## BR-GEN-005 — SUPERSEDED Preserves History

**Status:** APPROVED

استبدال Version قديم لا يحذفه.

السجل السابق يبقى قابلًا للتتبع كـ:

```text
SUPERSEDED
```

---

## BR-GEN-006 — Important Mutations Require Audit

**Status:** APPROVED

كل Mutation مهم يجب تسجيل:

```text
Actor
Trusted timestamp
Entity type
Entity ID
Action
Previous state/value where relevant
New state/value where relevant
Reason where required
Request ID
Signature reference where relevant
```

---

## BR-GEN-007 — Trusted Time

**Status:** APPROVED

الوقت الرسمي للأحداث يعتمد على Server/Database time.

Browser timestamp لا يعتبر مصدرًا موثوقًا للأحداث الرسمية.

---

## BR-GEN-008 — UTC Storage

**Status:** APPROVED

الأوقات الرسمية تخزن باستخدام:

```text
TIMESTAMPTZ
```

ويتم التعامل معها داخليًا بصورة UTC.

العرض للمستخدم يكون حسب timezone النظام المعتمد.

Default operational timezone المقترح:

```text
Asia/Riyadh
```

---

## BR-GEN-009 — Critical Operations Are Transactional

**Status:** APPROVED

أي Action يغير أكثر من جزء مترابط من Business State يجب أن ينفذ Transactionally.

مثل:

```text
Approve
Release
Close
Void
Submit where snapshot/workflow created
Controlled correction
```

إما:

```text
COMMIT ALL
```

أو:

```text
ROLLBACK ALL
```

---

## BR-GEN-010 — Critical Actions Are Idempotent

**Status:** APPROVED

Retry أو Double-click لا ينتج Duplicate Business Action.

ينطبق خصوصًا على:

```text
Submit
Approve
Release
Void
Close
Complete
Retest
Controlled change application
```

---

## BR-GEN-011 — No Silent Concurrent Overwrite

**Status:** APPROVED

السجلات المهمة تستخدم optimistic concurrency أو حماية مكافئة.

إذا فتح المستخدم:

```text
version = 7
```

وأصبح السجل:

```text
version = 8
```

قبل Save:

> الحفظ يفشل بدل overwrite الصامت.

---

## BR-GEN-012 — Human-Friendly ID Does Not Replace Technical ID

**Status:** APPROVED

السجلات المهمة تستخدم Technical Identifier مستقل مثل UUID.

ويمكن إضافة Business ID مثل:

```text
RCV-2026-000124
LAB-2026-001294
NCR-2026-0031
```

ولا يستخدم Business ID كبديل لسلامة PK التقنية.

---

## BR-GEN-013 — Business Numbers Must Be Unique Within Their Defined Scope

**Status:** APPROVED

أي Identifier رسمي مثل:

```text
Receiving ID
Lab Test No
NCR No
Inspection Report No
```

يجب أن يملك uniqueness rule واضحًا في Data Model.

---

## BR-GEN-014 — Scientific Values Must Come From Controlled Sources

**Status:** APPROVED

ممنوع اختراع:

```text
Temperature limits
Humidity limits
Pressure limits
Torque limits
Sampling quantities
Acceptance criteria
Test tolerances
Pass/Fail formulas
```

من UI أو Developer أو AI.

المصدر يجب أن يكون Controlled Source معتمد.

---

## BR-GEN-015 — Historical Records Use Historical Context

**Status:** APPROVED

إذا تغير Master Data مستقبلًا، لا يتم إعادة كتابة السجلات القديمة.

السجل التاريخي يجب أن يحتفظ بما كان مستخدمًا وقت الإجراء.

---

## BR-GEN-016 — Draft, Submitted, Approved Have Different Integrity Levels

**Status:** APPROVED

### Draft

```text
Editable
Incomplete allowed where permitted
Autosave possible
```

### Submitted

```text
Required validation passed
Workflow started
Editing restricted
Snapshot may be frozen
```

### Approved

```text
Controlled
Immutable through normal edit
Correction/revision path required
```

---

## BR-GEN-017 — Autosave Is Draft-Only

**Status:** APPROVED

Autosave يمكن استخدامه في DRAFT.

ممنوع أن ينفذ تلقائيًا:

```text
Submit
Approve
Release
Void
Close
Sign
```

---

## BR-GEN-018 — Intentional Actions Require Explicit User Intent

**Status:** APPROVED

العمليات الحساسة تحتاج Action واضح من المستخدم.

مثل:

```text
Submit
Approve
Reject
Return
Release
Void
Close
Sign
```

ولا تنفذ بسبب Autosave أو navigation أو background refresh.

---

## BR-GEN-019 — Errors Must Not Hide Business Outcome

**Status:** APPROVED

إذا حدث error بعد Business Action، النظام يجب أن يعرف هل العملية:

```text
Committed
Rolled back
Unknown
```

ولا يعرض للمستخدم رسالة توحي بالفشل إذا كان الـcommit تم فعلًا بدون آلية تحقق.

---

## BR-GEN-020 — No Release Readiness Claim Without Evidence

**Status:** APPROVED

كلمات مثل:

```text
DONE
PASS
100%
PRODUCTION READY
VERIFIED
```

لا تعتبر دليلًا.

كل Claim يجب أن يرتبط بإثبات مناسب.

---

# 5. Identity Rules

## BR-IDN-001 — Every Human Action Has an Authenticated Actor

**Status:** APPROVED

العمليات البشرية المهمة يجب أن ترتبط بمستخدم معروف.

---

## BR-IDN-002 — Shared Accounts Are Not Accepted for Controlled Actions

**Status:** APPROVED

الموافقة أو التوقيع أو التغيير Controlled يجب أن ينسب لشخص واحد.

لا يعتمد على generic shared account.

---

## BR-IDN-003 — Disabled Users Cannot Start New Sessions

**Status:** APPROVED

الحساب غير النشط لا يسمح له بتسجيل الدخول أو إنشاء session جديدة.

---

## BR-IDN-004 — Password Reset Invalidates Existing Sessions

**Status:** APPROVED

عند Administrative Password Reset:

```text
Invalidate existing sessions
Require new user-owned password
Audit reset
```

---

## BR-IDN-005 — Session Identity Cannot Be Client-Declared

**Status:** APPROVED

المستخدم لا يرسل `actor_id` من Browser ليحدد هويته.

Actor يستخرج من authenticated server-side session.

---

# 6. Authorization Rules

## BR-AUTH-001 — Authorization Is Centralized

**Status:** APPROVED

لا تكرر role checks في الصفحات.

Authorization Policies تكون مصدرًا مركزيًا.

---

## BR-AUTH-002 — Authorization Evaluates Action + Entity + State + Scope

**Status:** APPROVED

السؤال ليس فقط:

```text
Is user a Manager?
```

بل:

```text
Can this user
perform this action
on this record
in this state
within this scope?
```

---

## BR-AUTH-003 — Reports Follow Application Scope

**Status:** APPROVED

إذا المستخدم لا يستطيع رؤية record داخل التطبيق، لا يجوز له رؤيته عبر:

```text
Report
Export
Search
Dashboard
API
```

---

## BR-AUTH-004 — Admin Is Not Unlimited Historical Authority

**Status:** APPROVED

Admin يستطيع إدارة النظام.

لكن لا يستطيع bypass قواعد:

```text
Approved record integrity
Audit
Correction
Versioning
Separation of duties where applicable
```

---

## BR-AUTH-005 — Exact Role Permissions Are Deferred

**Status:** POLICY-DEPENDENT

التفاصيل الدقيقة لـ:

```text
Employee
Supervisor
Manager
Admin
```

تعتمد رسميًا على:

```text
ROLE-MATRIX.md
PERMISSION-MATRIX.md
```

ولا يتم اختراعها هنا.

---

# 7. Tasks Business Rules

## BR-TASK-001 — Tasks Are General Work, Not Specialized Records

**Status:** APPROVED

Task لا يستبدل:

```text
Inspection Report
Lab Test
NCR
CAPA
Calibration
Controlled Document
```

---

## BR-TASK-002 — Task Can Reference a Specialized Record

**Status:** APPROVED

يمكن Task أن يرتبط بـ:

```text
Receiving Item
Lab Test
NCR
CAPA
Equipment
Document
```

لكن لا يصبح Owner لذلك السجل.

---

## BR-TASK-003 — Task Assignment Must Identify Responsible User

**Status:** APPROVED

المهمة assigned يجب أن يكون لها assignee صالح حسب policy.

---

## BR-TASK-004 — Task Reassignment Is Audited

**Status:** APPROVED

كل Reassignment يسجل:

```text
Previous assignee
New assignee
Actor
Timestamp
Reason where policy requires
```

---

## BR-TASK-005 — Completion Requires Required Checklist Items

**Status:** APPROVED

إذا Task يحتوي mandatory checklist:

> لا يمكن Complete قبل اكتمال mandatory items.

---

## BR-TASK-006 — Blocked Task Requires Blocker Context

**Status:** APPROVED

أي انتقال إلى Blocked/On Hold يجب أن يحتوي سببًا واضحًا.

---

## BR-TASK-007 — Task Completion Is Explicit

**Status:** APPROVED

الوصول إلى 100% progress لا يعني تلقائيًا Complete إلا إذا policy عرّفت ذلك صراحة.

---

## BR-TASK-008 — Completed Tasks Cannot Be Silently Reopened

**Status:** APPROVED

Reopen يحتاج Action رسمي ومبرر إذا كان مسموحًا.

---

## BR-TASK-009 — Recurring Task Creation Must Be Idempotent

**Status:** APPROVED

Scheduler retry لا يولد نفس instance أكثر من مرة.

---

## BR-TASK-010 — Task State Machine Deferred to STATE-MACHINES

**Status:** POLICY-DEPENDENT

الحالات الدقيقة ستعتمد في:

```text
STATE-MACHINES.md
```

---

# 8. Quality Domain Rules

# Findings

## BR-QUAL-001 — Finding Represents an Observed Quality Issue

**Status:** APPROVED

Finding يمكن أن ينشأ من:

```text
Inspection
Laboratory
Task
Equipment
Document
Operational observation
```

---

## BR-QUAL-002 — Source Record Remains Owned by Its Domain

**Status:** APPROVED

إنشاء Finding لا ينقل ownership للسجل الأصلي.

---

## BR-QUAL-003 — Finding Must Preserve Source Reference

**Status:** APPROVED

إذا كان Finding مرتبطًا بمصدر، يحتفظ بـ:

```text
Source entity type
Source entity ID
Relevant context/snapshot where required
```

---

# NCR

## BR-QUAL-010 — NCR Is Not Automatically Created for Every Finding

**Status:** UNCONFIRMED

هل كل Finding معين يتطلب NCR أو توجد threshold/policy محددة؟

يحتاج قرار QC رسمي.

---

## BR-QUAL-011 — NCR Must Have Defined Nonconformance Context

**Status:** APPROVED

NCR يجب أن يوضح على الأقل:

```text
What was nonconforming
Related source
Description
Affected item/lot/process where applicable
```

---

## BR-QUAL-012 — NCR Closure Requires Authorized Closure Action

**Status:** POLICY-DEPENDENT

لا يغلق NCR بمجرد كتابة RCA أو CAPA.

Closure workflow يعتمد على State Machine + Permission Matrix.

---

# RCA

## BR-QUAL-020 — RCA Is Separate From NCR Description

**Status:** APPROVED

Root cause analysis لا يعتبر مجرد إعادة وصف للمشكلة.

---

## BR-QUAL-021 — RCA May Use Structured Methods

**Status:** APPROVED

يمكن دعم:

```text
5 Whys
Fishbone
Structured questions
Free structured analysis
```

لكن النظام لا يفرض method غير معتمد.

---

# CAPA

## BR-QUAL-030 — CAPA Actions Must Be Traceable

**Status:** APPROVED

كل CAPA action يمكن أن يحتوي:

```text
Owner
Due date
Action
Evidence
Completion state
Verification state
```

---

## BR-QUAL-031 — Action Completion ≠ CAPA Effectiveness

**Status:** APPROVED

إنهاء action لا يعني تلقائيًا أن CAPA أثبت فعاليته.

---

## BR-QUAL-032 — CAPA Closure Requires Required Actions Complete

**Status:** APPROVED

لا يتم إغلاق CAPA إذا mandatory actions غير مكتملة.

---

## BR-QUAL-033 — Effectiveness Check Requirement

**Status:** UNCONFIRMED

هل كل CAPA يحتاج effectiveness verification منفصل؟

يحتاج قرار Quality Policy رسمي.

---

# 9. Quarantine / Receiving Rules

## BR-QUAR-001 — Receiving Item Is a Formal Record

**Status:** APPROVED

Receiving Item ليس temporary UI row.

كل record له identity وaudit metadata.

---

## BR-QUAR-002 — Base Receiving Fields

**Status:** APPROVED

الحقول التأسيسية:

```text
Doc No
Item Code
Description
Lot
Qty
Receiving Date
Expiry Date where applicable
Inspection Status
Release System
```

مع system metadata.

---

## BR-QUAR-003 — Receiving ID Is System-Generated

**Status:** APPROVED

يولد النظام Receiving ID رسمي ولا يترك المستخدم يكرر الرقم يدويًا.

---

## BR-QUAR-004 — Quantity Must Be Valid

**Status:** APPROVED

`Qty`:

```text
Required where applicable
Numeric
Greater than zero
```

إلا إذا تم اعتماد business case مختلف صراحة.

---

## BR-QUAR-005 — Receiving Workflow Status Is Separate From Inspection Result

**Status:** APPROVED

ممنوع دمج الاثنين في field واحد.

---

## BR-QUAR-006 — Inspection Result Is Separate From System Release

**Status:** APPROVED

مثال صحيح:

```text
Inspection Result = PASS
Release System = NO
```

---

## BR-QUAR-007 — Release System Is Not Inferred From Inspection PASS

**Status:** APPROVED

PASS لا يغير `Release System` تلقائيًا إلى YES بدون Release Action المعتمد.

---

## BR-QUAR-008 — Release Action Must Be Explicit

**Status:** POLICY-DEPENDENT

Release يحتاج action رسمي وصلاحية معتمدة.

من يملك هذه الصلاحية يحدد في `PERMISSION-MATRIX.md`.

---

## BR-QUAR-009 — Expiry Must Not Be Silently Overridden

**Status:** APPROVED

إذا Expiry Date تجعل المادة expired حسب policy، لا يتم تجاوز الحالة بدون controlled exception/correction path.

---

## BR-QUAR-010 — Receiving Identity Data Must Feed Inspection Automatically

**Status:** APPROVED

عند إنشاء Inspection Report من Receiving Item، يتم تعبئة:

```text
Doc No
Item Code
Description
Lot
Qty
Receiving Date
Expiry Date
Receiving ID
```

من المصدر.

لا يعيد المستخدم إدخالها يدويًا دون سبب controlled.

---

## BR-QUAR-011 — Duplicate Receiving Detection Must Be Defined

**Status:** UNCONFIRMED

نحتاج تحديد متى يعتبر Receiving مكررًا.

مرشحات محتملة:

```text
Doc No
Item Code
Lot
Receiving Date
```

لكن لا تعتمد حتى يتم تأكيد business definition.

---

## BR-QUAR-012 — Editing Receiving Data After Inspection Begins Is Restricted

**Status:** APPROVED

بعد إنشاء Controlled Inspection Context، أي تغيير في بيانات تؤثر على الفحص لا يكون free edit.

يحتاج:

```text
Correction
Change Request
Or controlled workflow
```

بحسب state.

---

# 10. Inspection Report Rules

## BR-INSP-001 — Inspection Report Must Originate From Approved Template

**Status:** APPROVED

أي Controlled Inspection Report يستخدم Approved Inspection Template Version.

---

## BR-INSP-002 — Draft Template Cannot Produce Controlled Approved Report

**Status:** APPROVED

Template غير approved لا يستخدم لإصدار Controlled Inspection رسمي.

---

## BR-INSP-003 — Template Version Is Frozen Per Report

**Status:** APPROVED

التقرير يحتفظ بـ:

```text
template_id
template_version
template_snapshot
```

أو equivalent controlled representation.

---

## BR-INSP-004 — Scientific Acceptance Criteria Require Controlled Source

**Status:** SOURCE-DEPENDENT

كل Requirement/Limit يجب أن يأتي من:

```text
Approved WI
Approved SOP
Approved Specification
Approved Test Method
Approved Template
Other approved controlled source
```

---

## BR-INSP-005 — Observed Result Is User/Instrument Data

**Status:** APPROVED

المستخدم يدخل observed result أو النظام يستقبله من مصدر تقني معتمد.

لا يتم استبداله تلقائيًا بنتيجة AI.

---

## BR-INSP-006 — PASS/FAIL Must Be Deterministic From Approved Rule Where Automatable

**Status:** SOURCE-DEPENDENT

إذا rule قابل للحساب:

```text
Observed value
+
Approved criterion
=
Result
```

ويجب حفظ مصدر criterion.

---

## BR-INSP-007 — Manual PASS/FAIL Requires Defined Policy

**Status:** UNCONFIRMED

إذا بعض Inspection Points تحتاج judgment بشري، يجب توثيق متى وكيف يتم ذلك.

---

## BR-INSP-008 — Required Inspection Points Must Be Complete Before Submit

**Status:** APPROVED

Submit ممنوع إذا mandatory inspection points ناقصة.

---

## BR-INSP-009 — Required Evidence Must Be Present Before Submit

**Status:** SOURCE-DEPENDENT

إذا Template أو WI يطلب evidence إلزامي، Submit يمنع عند غيابه.

---

## BR-INSP-010 — Submission Freezes Controlled Context

**Status:** APPROVED

عند Submit، يتم تثبيت context المطلوب مثل:

```text
Receiving snapshot
Template version
Acceptance criteria source
Relevant document versions
```

حسب Data Model.

---

## BR-INSP-011 — Submitted Report Is Not Freely Editable

**Status:** APPROVED

بعد Submit:

```text
Free edit denied
```

ويستخدم Return/Correction path.

---

## BR-INSP-012 — Review Cannot Rewrite Author Data Without Trace

**Status:** APPROVED

Reviewer لا يعدل نتائج author silently.

إما:

```text
Return for correction
Reviewer comment
Controlled review annotation
```

---

## BR-INSP-013 — Approval Requires Current Version Check

**Status:** APPROVED

قبل Approval يجب التحقق من record version الحالية.

---

## BR-INSP-014 — Approval Is Atomic With Required Business Consequences

**Status:** APPROVED

إذا Approval يغير Receiving state أو نتيجة أخرى مرتبطة، يجب أن تكون العملية transactionally consistent.

---

## BR-INSP-015 — Inspection Failure Can Create Quality Workflow

**Status:** APPROVED

FAIL/HOLD يمكن أن يؤدي إلى Finding/NCR حسب Quality Policy.

---

## BR-INSP-016 — Automatic NCR Creation Policy

**Status:** UNCONFIRMED

هل FAIL ينشئ NCR تلقائيًا أم يعرض Action للمستخدم؟

يحتاج قرار رسمي.

---

# 11. Laboratory Rules

## BR-LAB-001 — Lab Test Is a Controlled Scientific Record

**Status:** APPROVED

Lab Test ليس Task أو generic form.

---

## BR-LAB-002 — Lab Test Must Use Approved Test Definition

**Status:** SOURCE-DEPENDENT

أي Test رسمي يعتمد على:

```text
Approved test method
Approved template
Approved WI/SOP/specification
```

حسب نوع الاختبار.

---

## BR-LAB-003 — Scientific Limits Cannot Be Developer Defaults

**Status:** APPROVED

لا يوجد hardcoded acceptance limit إلا إذا كان مستمدًا ومتعقبًا لمصدر approved.

---

## BR-LAB-004 — Sample Identity Must Be Traceable

**Status:** APPROVED

كل sample يجب أن يمكن ربطه بالـLab Test وسياقه.

---

## BR-LAB-005 — Measurement Must Preserve Raw Observation

**Status:** APPROVED

إذا النتيجة مشتقة من measurement:

> يحتفظ النظام بالـraw value المطلوبة ولا يحفظ النتيجة النهائية فقط.

---

## BR-LAB-006 — Units Are Explicit

**Status:** APPROVED

أي قياس علمي يحتاج unit واضحة حيث applicable.

---

## BR-LAB-007 — Unit Conversion Must Be Controlled

**Status:** APPROVED

إذا النظام يعمل conversion:

```text
Original value
Original unit
Converted value
Target unit
Conversion logic/version where needed
```

يجب أن يبقى قابلًا للتفسير.

---

## BR-LAB-008 — Required Environmental Conditions Are Source-Dependent

**Status:** SOURCE-DEPENDENT

Temperature/Humidity وغيرها لا تحدد من المطور.

---

## BR-LAB-009 — Lab Submission Requires Mandatory Data Complete

**Status:** APPROVED

لا Submit مع mandatory samples/measurements/results ناقصة.

---

## BR-LAB-010 — Lab Submission Freezes Test Context

**Status:** APPROVED

عند Submit/controlled transition حسب state machine، يتم حفظ snapshot لما يؤثر تاريخيًا.

---

## BR-LAB-011 — Equipment Used Must Be Identified Where Required

**Status:** SOURCE-DEPENDENT

إذا Test Method يتطلب equipment، يجب تسجيل المعدة المستخدمة.

---

## BR-LAB-012 — Calibration Context Must Be Preserved

**Status:** APPROVED

إذا equipment مستخدمة، يحتفظ Test بما يثبت calibration context وقت التنفيذ.

---

## BR-LAB-013 — Current Calibration Change Must Not Rewrite Old Test

**Status:** APPROVED

تغيير calibration record لاحقًا لا يغير التاريخ السابق.

---

## BR-LAB-014 — Retest Is a New Controlled Execution

**Status:** APPROVED

Retest لا overwrites original test.

---

## BR-LAB-015 — Retest Must Reference Original Test

**Status:** APPROVED

يجب أن يكون هناك traceability بين:

```text
Original Test
Retest
Reason
Actor
Timestamp
```

---

## BR-LAB-016 — Retest Reason Is Required

**Status:** APPROVED

لا Retest بدون سبب.

---

## BR-LAB-017 — Retest Policy Must Not Hide Original Failure

**Status:** APPROVED

حتى إذا Retest أصبح PASS، النتيجة الأصلية تبقى محفوظة.

---

## BR-LAB-018 — Retest Acceptance Policy

**Status:** UNCONFIRMED

هل Retest واحد مسموح؟
هل أكثر من Retest؟
من يأذن؟
كيف تؤثر النتيجة النهائية؟

يحتاج policy مختبر معتمد.

---

## BR-LAB-019 — Reviewer Cannot Silently Change Measurement

**Status:** APPROVED

أي تعديل measurement بعد submit يحتاج controlled correction path.

---

## BR-LAB-020 — Approved Lab Test Is Immutable

**Status:** APPROVED

التصحيح بعد approval يتم عبر:

```text
Correction
Void
New test/retest
Other approved controlled process
```

ولا direct edit.

---

## BR-LAB-021 — PASS/FAIL Decision Uses Controlled Criteria

**Status:** SOURCE-DEPENDENT

القرار العلمي يجب أن يكون قابلًا للتتبع للمصدر المعتمد.

---

## BR-LAB-022 — AI Cannot Produce Official PASS/FAIL

**Status:** APPROVED

AI يمكنه explain أو summarize.

لا يسجل official result.

---

## BR-LAB-023 — Excel Paste Must Pass Full Validation

**Status:** APPROVED

Paste from Excel لا bypass:

```text
Type validation
Required fields
Ranges
Units
Permissions
State rules
```

---

## BR-LAB-024 — Bulk Fill Must Be Reviewable Before Commit

**Status:** APPROVED

Fill Down/Duplicate Previous لا يؤدي إلى uncontrolled hidden data change.

---

# 12. Equipment Rules

## BR-EQP-001 — Equipment Has Stable Identity

**Status:** APPROVED

Equipment record له Technical ID وBusiness identifier مناسب.

---

## BR-EQP-002 — Equipment Status Is Explicit

**Status:** APPROVED

Status لا يستنتج من UI فقط.

---

## BR-EQP-003 — Equipment Historical Use Is Preserved

**Status:** APPROVED

تعديل الاسم أو model أو metadata لا يعيد كتابة Test history.

---

## BR-EQP-004 — Decommissioned Equipment Is Not Deleted

**Status:** APPROVED

تغير status بدل حذف history.

---

## BR-EQP-005 — Equipment Change May Require Controlled Change Request

**Status:** POLICY-DEPENDENT

الحقول Controlled تحدد لاحقًا.

---

# 13. Calibration Rules

## BR-CAL-001 — Calibration Records Are Historical Records

**Status:** APPROVED

Calibration قديمة لا تعدل لتصبح calibration جديدة.

---

## BR-CAL-002 — Calibration Due Date Must Be Derived From Approved Policy/Data

**Status:** SOURCE-DEPENDENT

Interval لا يخترعه المطور.

---

## BR-CAL-003 — Overdue State Must Be System-Deterministic

**Status:** APPROVED

عند وجود valid due date:

```text
Current trusted time > due date
```

يولد overdue حسب policy.

---

## BR-CAL-004 — Equipment Use While Overdue

**Status:** UNCONFIRMED

هل overdue يمنع استخدام المعدة نهائيًا، يحذر فقط، أو يحتاج exception approval؟

يحتاج policy معتمد.

---

## BR-CAL-005 — Calibration Certificate Evidence Is Traceable

**Status:** APPROVED

عند required certificate يجب ربط evidence بالمعدة/calibration record.

---

# 14. Maintenance Rules

## BR-MNT-001 — Maintenance History Is Preserved

**Status:** APPROVED

Maintenance action لا overwrites previous maintenance.

---

## BR-MNT-002 — Maintenance Can Affect Equipment Availability

**Status:** APPROVED

إذا equipment تحت maintenance، status التشغيلي يجب أن يعكس ذلك.

---

## BR-MNT-003 — Maintenance Completion Does Not Automatically Prove Calibration

**Status:** APPROVED

Maintenance ≠ Calibration.

---

# 15. Controlled Documents Rules

## BR-DOC-001 — Document Identity and Version Are Separate

**Status:** APPROVED

مثال:

```text
WI-001
```

هو identity.

```text
Rev 4
```

هو version.

---

## BR-DOC-002 — Approved Version Is Immutable

**Status:** APPROVED

Approved document version لا يتم تحرير محتواه مباشرة.

---

## BR-DOC-003 — Revision Creates a New Version

**Status:** APPROVED

تعديل controlled approved document يولد new revision/version.

---

## BR-DOC-004 — Superseded Version Remains Available for Historical Traceability

**Status:** APPROVED

لا يحذف الإصدار السابق.

---

## BR-DOC-005 — Historical Records Reference the Version Actually Used

**Status:** APPROVED

Lab/Inspection القديم لا يتحول تلقائيًا إلى أحدث WI.

---

## BR-DOC-006 — Catalog Entry Does Not Automatically Mean Controlled Content

**Status:** APPROVED

وجود Document No في النظام لا يعني أن المحتوى نفسه Approved/controlled unless lifecycle says so.

---

## BR-DOC-007 — Document Lifecycle Uses Explicit States

**Status:** APPROVED

الحالات النهائية تعتمد في `STATE-MACHINES.md`.

---

## BR-DOC-008 — Revision Number Rules

**Status:** UNCONFIRMED

نحتاج تحديد:

```text
Numeric revision?
Alphanumeric?
Major/minor?
Who assigns it?
Auto-generated or manual?
```

---

## BR-DOC-009 — Effective Date Rules

**Status:** UNCONFIRMED

هل approval يعني effective immediately أو يوجد Effective Date منفصل؟

---

# 16. Reviews & Approvals Rules

## BR-APR-001 — Review and Approval Are Distinct Actions

**Status:** APPROVED

Review لا يعني Approval.

---

## BR-APR-002 — Approval Infrastructure Is Shared

**Status:** APPROVED

لا يبنى Approval Engine مستقل لكل module بدون سبب قوي.

---

## BR-APR-003 — Approval Must Revalidate Permission

**Status:** APPROVED

Permission تفحص وقت approval، وليس فقط وقت فتح الصفحة.

---

## BR-APR-004 — Approval Must Revalidate Record State

**Status:** APPROVED

إذا record تغير state قبل الضغط:

> Approval fails safely.

---

## BR-APR-005 — Approval Must Revalidate Record Version

**Status:** APPROVED

Stale approval يمنع.

---

## BR-APR-006 — Separation of Duties Is Enforced Server-Side

**Status:** APPROVED

إذا Policy تمنع self-review/self-approval:

> السيرفر يمنعها.

---

## BR-APR-007 — Exact Separation-of-Duties Matrix

**Status:** POLICY-DEPENDENT

العلاقات الدقيقة بين:

```text
Author
Reviewer
Approver
```

تحدد في `PERMISSION-MATRIX.md`.

---

## BR-APR-008 — Reviewer Does Not Become Record Author

**Status:** APPROVED

Review comments تبقى منسوبة للReviewer.

---

## BR-APR-009 — Returned Record Must Preserve Review History

**Status:** APPROVED

Return for correction لا يحذف submission/review history.

---

## BR-APR-010 — Approval Decision Is Audited

**Status:** APPROVED

يشمل:

```text
Actor
Decision
Timestamp
Entity version
Reason/comments where required
Signature reference where required
```

---

## BR-APR-011 — Rejection Reason

**Status:** POLICY-DEPENDENT

يجب تحديد أي workflows تجعل reason mandatory عند Reject/Return.

القاعدة الافتراضية الموصى بها:

```text
Reject → reason required
Return → reason required
```

---

# 17. E-Signature Rules

## BR-ESIG-001 — Approve Button Alone Is Not an E-Signature

**Status:** APPROVED

---

## BR-ESIG-002 — E-Signature Requires Reauthentication

**Status:** APPROVED

للعمليات المحددة كـsignature-required:

```text
Current password or approved reauthentication
```

يجب التحقق منه.

---

## BR-ESIG-003 — E-Signature Requires Reauthorization

**Status:** APPROVED

نجاح password لا يكفي.

يجب أيضًا التحقق من permission الحالية.

---

## BR-ESIG-004 — Signature Meaning Is Presented Before Signing

**Status:** APPROVED

المستخدم يعرف ماذا يعني التوقيع.

---

## BR-ESIG-005 — Password Is Never Stored as Signature Evidence

**Status:** APPROVED

يحفظ proof metadata فقط.

---

## BR-ESIG-006 — Signature Is Bound to Record Version

**Status:** APPROVED

التوقيع على version 4 لا يمتد تلقائيًا إلى version 5.

---

## BR-ESIG-007 — Signature Evidence Contains Snapshot Integrity Reference

**Status:** APPROVED

يجب ربط signature بـ:

```text
entity
entity version
action
meaning
timestamp
record snapshot hash or equivalent integrity evidence
```

---

## BR-ESIG-008 — Which Actions Require E-Signature

**Status:** UNCONFIRMED

يحتاج policy رسمي لتحديد actions مثل:

```text
Approve Inspection
Approve Lab Test
Release
Approve Document
Void
CAPA closure
Change Request approval
```

---

# 18. Change Request Rules

## BR-CHG-001 — Controlled Changes Use Change Workflow Where Direct Edit Is Prohibited

**Status:** APPROVED

---

## BR-CHG-002 — Change Request Shows Current and Proposed Values

**Status:** APPROVED

---

## BR-CHG-003 — Change Reason Is Mandatory

**Status:** APPROVED

---

## BR-CHG-004 — Change Request Must Detect Stale Target

**Status:** APPROVED

إذا target تغير بعد إنشاء request:

> لا يطبق التغيير بصمت.

---

## BR-CHG-005 — Approved Change Is Applied by Owning Domain

**Status:** APPROVED

Change Requests module لا يقوم direct update لجداول Domain آخر.

---

## BR-CHG-006 — Approval Does Not Guarantee Application Success

**Status:** APPROVED

إذا تغير target أو violated rule وقت التطبيق:

```text
Approval exists
Application fails safely
```

ويتم تسجيل النتيجة.

---

## BR-CHG-007 — Change Application Is Transactional

**Status:** APPROVED

---

## BR-CHG-008 — Change Request History Is Preserved

**Status:** APPROVED

Rejected/Approved/Applied/Failed requests لا تحذف من التاريخ.

---

# 19. Reporting Rules

## BR-RPT-001 — Canonical Dataset Per Report

**Status:** APPROVED

كل report له canonical query/dataset.

---

## BR-RPT-002 — CSV/XLSX/PDF Use Same Canonical Data

**Status:** APPROVED

format لا يغير business result.

---

## BR-RPT-003 — Report Authorization Equals Application Authorization

**Status:** APPROVED

---

## BR-RPT-004 — Filters Are Applied Server-Side for Controlled Reports

**Status:** APPROVED

لا يعتمد على browser filtering للنتيجة الرسمية.

---

## BR-RPT-005 — Report Metadata Includes Generation Context

**Status:** APPROVED

حيث applicable:

```text
Generated By
Generated At
Applied Filters
Scope
Result count
Report ID/type
```

---

## BR-RPT-006 — Export Is Not a Permission Bypass

**Status:** APPROVED

---

## BR-RPT-007 — Report Definitions Are Versionable When Needed

**Status:** APPROVED

إذا report logic تغير بطريقة تؤثر على interpretation، يجب أن يكون قابلًا للتتبع.

---

## BR-RPT-008 — Audit Reports Require Specific Authorization

**Status:** POLICY-DEPENDENT

وجود Audit Data لا يعني أن كل المستخدمين يستطيعون تصديره.

---

# 20. Audit Rules

## BR-AUD-001 — Audit Is Separate From Application Logging

**Status:** APPROVED

---

## BR-AUD-002 — Audit Records Are Append-Only

**Status:** APPROVED

قدر الإمكان، audit events تضاف ولا يعاد تحريرها.

---

## BR-AUD-003 — Business Deletion Must Not Destroy Audit History

**Status:** APPROVED

لا يسمح FK cascade أن يمحو evidence المطلوب للأحداث المهمة.

---

## BR-AUD-004 — Audit Actor Comes From Trusted Identity

**Status:** APPROVED

---

## BR-AUD-005 — Audit Timestamp Comes From Trusted Time

**Status:** APPROVED

---

## BR-AUD-006 — Audit Must Survive Record Void/Supersede

**Status:** APPROVED

---

## BR-AUD-007 — Audit Integrity Mechanism

**Status:** UNCONFIRMED

هل نستخدم:

```text
Append-only DB protections
Hash chain
Signed event digests
Restricted mutation role
Combination
```

قرار معماري لاحق.

لكن شرط عدم التعديل غير الموثق معتمد.

---

# 21. Files & Evidence Rules

## BR-FILE-001 — File Metadata Is Stored Separately From Business Meaning

**Status:** APPROVED

---

## BR-FILE-002 — File Upload Is Server-Validated

**Status:** APPROVED

يتحقق من:

```text
Size
MIME
Extension
Signature/magic bytes where appropriate
Authorization
Entity state
```

---

## BR-FILE-003 — SHA-256 Is Stored for Evidence Files

**Status:** APPROVED

أو hash equivalent معتمد إن تغير القرار المعماري لاحقًا.

---

## BR-FILE-004 — Original Filename Is Preserved as Metadata

**Status:** APPROVED

لكن لا يستخدم مباشرة كـstorage path موثوق.

---

## BR-FILE-005 — File Removal From Controlled Record Is Restricted

**Status:** APPROVED

بعد controlled state، لا يحذف evidence بصمت.

---

## BR-FILE-006 — Large Files Are Not Stored in PostgreSQL by Default

**Status:** APPROVED

PostgreSQL:

```text
metadata
```

Object storage:

```text
file binary
```

---

## BR-FILE-007 — Evidence Access Follows Parent Record Authorization

**Status:** APPROVED

مع أي additional evidence-specific policy.

---

# 22. Notification Rules

## BR-NOT-001 — Notification Does Not Authorize Action

**Status:** APPROVED

الإشعار ليس Permission.

---

## BR-NOT-002 — Notification Must Be Idempotent/Deduplicated

**Status:** APPROVED

Retry لا يرسل نفس business event عدة مرات بلا داعٍ.

---

## BR-NOT-003 — Notification Contains Safe Context

**Status:** APPROVED

لا ترسل sensitive information أكثر من الحاجة.

---

## BR-NOT-004 — Business Action Must Define Notification Criticality

**Status:** APPROVED

بعض notifications informational.

بعضها required downstream event.

يجب تحديد ذلك لكل workflow.

---

## BR-NOT-005 — Notification Failure Must Not Create Duplicate Business Mutation

**Status:** APPROVED

---

# 23. Search Rules

## BR-SRCH-001 — Search Is Authorization-Aware

**Status:** APPROVED

---

## BR-SRCH-002 — Search Is Read-Only

**Status:** APPROVED

---

## BR-SRCH-003 — Search Result Must Not Reveal Unauthorized Existence

**Status:** APPROVED

حتى title/count/snippet يجب ألا يكشف records خارج scope.

---

## BR-SRCH-004 — Supported Search Keys

**Status:** APPROVED

الحد الأدنى المتوقع:

```text
Doc No
Item Code
Description
Lot
Receiving ID
Inspection Report
Lab Test
NCR
Document No
Equipment
```

مع قابلية التوسع.

---

# 24. Dashboard Rules

## BR-DASH-001 — Dashboard Owns No Core Business Record

**Status:** APPROVED

---

## BR-DASH-002 — Dashboard Is Role/Permission Aware

**Status:** APPROVED

---

## BR-DASH-003 — Dashboard KPI Must Drill Into Same Scope

**Status:** APPROVED

إذا:

```text
Pending Inspections = 17
```

فتح KPI يجب أن يفتح نفس الـ17 ضمن authorization scope.

---

## BR-DASH-004 — Dashboard Count and Register Count Must Reconcile

**Status:** APPROVED

عند نفس filters/time/scope يجب ألا يعطي Dashboard رقمًا مختلفًا عن المصدر الرسمي.

---

## BR-DASH-005 — Dashboard Does Not Perform Controlled Mutations Directly

**Status:** APPROVED

يمكن Action shortcuts فقط إذا توجه لنفس authorized use case.

---

# 25. Administration Rules

## BR-ADM-001 — Administration Is Privileged

**Status:** POLICY-DEPENDENT

الـAdmin-only surfaces تعتمد على permission policy.

---

## BR-ADM-002 — Admin Changes Are Audited

**Status:** APPROVED

مثل:

```text
Activate user
Deactivate user
Reset password
Change permission
Change system config
Modify reference data
```

---

## BR-ADM-003 — Administrative Correction Is Controlled

**Status:** APPROVED

Admin لا يفتح SQL-style free editing للسجلات التاريخية.

---

## BR-ADM-004 — Reference Data Can Be Controlled

**Status:** POLICY-DEPENDENT

يتم تحديد أي Reference Data يحتاج:

```text
Approval
Change Request
Versioning
```

في وثائق لاحقة.

---

# 26. Backup & Recovery Rules

## BR-BKP-001 — Backup Created ≠ Backup Verified

**Status:** APPROVED

---

## BR-BKP-002 — Backup Verified ≠ Restore Proven

**Status:** APPROVED

---

## BR-BKP-003 — Backup Success Requires Integrity Evidence

**Status:** APPROVED

---

## BR-BKP-004 — Restore Proof Must Be Tested

**Status:** APPROVED

لا نعتبر restore proven من النظر للملف فقط.

---

## BR-BKP-005 — Backup Files Must Be Protected

**Status:** APPROVED

تشمل access control/encryption حسب architecture policy.

---

## BR-BKP-006 — RPO Is Not Invented

**Status:** UNCONFIRMED

---

## BR-BKP-007 — RTO Is Not Invented

**Status:** UNCONFIRMED

RPO/RTO يحتاجان قرارًا تشغيليًا.

---

# 27. AI Advisory Rules

## BR-AI-001 — Core System Works Without AI

**Status:** APPROVED

AI outage لا يمنع core QC workflows.

---

## BR-AI-002 — AI Is Advisory Only

**Status:** APPROVED

---

## BR-AI-003 — AI Cannot Approve

**Status:** APPROVED

---

## BR-AI-004 — AI Cannot Reject

**Status:** APPROVED

---

## BR-AI-005 — AI Cannot Release

**Status:** APPROVED

---

## BR-AI-006 — AI Cannot Sign

**Status:** APPROVED

---

## BR-AI-007 — AI Cannot Set Official PASS/FAIL

**Status:** APPROVED

---

## BR-AI-008 — AI Cannot Mutate Controlled Data Autonomously

**Status:** APPROVED

---

## BR-AI-009 — AI Context Follows User Authorization

**Status:** APPROVED

AI لا يحصل على records لا يستطيع المستخدم رؤيتها.

---

## BR-AI-010 — Structured Outputs Use Schema Validation

**Status:** APPROVED

عند استخدام structured AI output.

---

## BR-AI-011 — AI Output Must Be Identifiable as Advisory

**Status:** APPROVED

يجب أن يعرف المستخدم أن المحتوى AI-generated/advisory.

---

## BR-AI-012 — AI Metadata Is Auditable Where Relevant

**Status:** APPROVED

مثل:

```text
Actor
Feature
Model
Timestamp
Success/Failure
Relevant reference
```

بدون تخزين sensitive data بلا حاجة.

---

# 28. Cross-Domain Rules

## BR-XDOM-001 — One Business Concept Has One Owner

**Status:** APPROVED

---

## BR-XDOM-002 — Domain Cannot Write Directly Into Another Domain's Tables

**Status:** APPROVED

---

## BR-XDOM-003 — Cross-Domain Mutation Goes Through Owning Domain Use Case

**Status:** APPROVED

---

## BR-XDOM-004 — Cross-Domain Reads Use Approved Contracts

**Status:** APPROVED

مثل:

```text
Public query
Read model
Snapshot
Reporting view
Projection
```

---

## BR-XDOM-005 — Reference and Snapshot Are Different

**Status:** APPROVED

Reference = current data.

Snapshot = historical context.

---

## BR-XDOM-006 — Events Do Not Bypass Business Rules

**Status:** APPROVED

Event consumer لا يحق له تنفيذ invalid state transition.

---

## BR-XDOM-007 — Dashboard, Search, Reports Are Read-Side Consumers

**Status:** APPROVED

لا تملك source business records.

---

## BR-XDOM-008 — Approvals Does Not Own Domain State Machine

**Status:** APPROVED

Approval infrastructure تسجل القرار.

Owning Domain ينفذ transition.

---

## BR-XDOM-009 — Change Requests Does Not Own Target Data

**Status:** APPROVED

---

## BR-XDOM-010 — AI Does Not Own Business Decisions

**Status:** APPROVED

---

# 29. Controlled State Transition Rules

هذه القواعد عامة لكل State Machine.

## BR-GEN-030 — State Transitions Are Explicit

**Status:** APPROVED

لا يتم تغيير state بأماكن عشوائية.

---

## BR-GEN-031 — State Transition Checks Current State

**Status:** APPROVED

مثال:

```text
APPROVED → APPROVED
```

لا ينفذ مرة أخرى إذا لم يكن idempotent semantics مقصودًا.

---

## BR-GEN-032 — Invalid Transition Fails Safely

**Status:** APPROVED

---

## BR-GEN-033 — Transition Authorization Is Checked at Execution Time

**Status:** APPROVED

---

## BR-GEN-034 — Transition Validation Happens Before Commit

**Status:** APPROVED

---

## BR-GEN-035 — Transition Side Effects Are Defined

**Status:** APPROVED

كل transition مهم يحدد:

```text
State change
Audit
Snapshot
Approval/signature
Notification
Related domain consequence
```

---

# 30. Data Correction Rules

## BR-GEN-040 — Draft Correction Is Normal Editing

**Status:** APPROVED

طالما record state تسمح.

---

## BR-GEN-041 — Submitted Correction Requires Controlled Return/Edit Path

**Status:** APPROVED

---

## BR-GEN-042 — Approved Correction Does Not Replace Original Fact

**Status:** APPROVED

---

## BR-GEN-043 — Correction Reason Is Required for Controlled Records

**Status:** APPROVED

---

## BR-GEN-044 — Correction Preserves Before and After

**Status:** APPROVED

---

# 31. Deletion Rules

## BR-GEN-050 — Controlled Records Are Not Hard-Deleted by Normal Users

**Status:** APPROVED

---

## BR-GEN-051 — Referenced Historical Records Are Preserved

**Status:** APPROVED

---

## BR-GEN-052 — Delete Must Not Break Audit Integrity

**Status:** APPROVED

---

## BR-GEN-053 — Draft Deletion Policy

**Status:** UNCONFIRMED

نحتاج تحديد أي Draft records يمكن حذفها نهائيًا ومتى.

القاعدة المبدئية:

```text
Only unsubmitted/non-controlled records may be eligible
```

لكن تحتاج اعتماد لكل Domain.

---

# 32. Validation Rules

## BR-GEN-060 — Client Validation Is UX Only

**Status:** APPROVED

Server validation إلزامي.

---

## BR-GEN-061 — Database Constraints Protect Invariants Where Appropriate

**Status:** APPROVED

مثل:

```text
NOT NULL
CHECK
FK
UNIQUE
```

---

## BR-GEN-062 — Validation Errors Are Field-Addressable

**Status:** APPROVED

المستخدم يعرف field والسبب.

---

## BR-GEN-063 — Bulk Import Uses Same Rules as Manual Input

**Status:** APPROVED

CSV/Excel import لا bypass validation.

---

## BR-GEN-064 — Import Failure Strategy Must Be Explicit

**Status:** UNCONFIRMED

هل import:

```text
All-or-nothing
Partial success
Row-level staging
```

يحدد لاحقًا لكل use case.

---

# 33. Business Decisions Not Yet Confirmed

هذه ليست Bugs.

هذه قرارات يجب أن يحددها أصحاب العمل قبل التنفيذ النهائي.

| Decision ID | Question                                                | Related Domain       |
| ----------- | ------------------------------------------------------- | -------------------- |
| BD-001      | من يستطيع Release Receiving Item في النظام؟             | Quarantine           |
| BD-002      | هل Release يحتاج E-Signature؟                           | Quarantine           |
| BD-003      | هل كل Inspection FAIL ينشئ NCR تلقائيًا؟                | Inspection / Quality |
| BD-004      | متى Finding يصبح NCR؟                                   | Quality              |
| BD-005      | هل كل CAPA يحتاج Effectiveness Check؟                   | Quality              |
| BD-006      | كم Retest مسموح؟                                        | Laboratory           |
| BD-007      | من يأذن Retest؟                                         | Laboratory           |
| BD-008      | كيف تؤثر Retest نتيجة PASS على Original FAIL؟           | Laboratory           |
| BD-009      | ما policy استخدام Equipment إذا Calibration Overdue؟    | Equipment            |
| BD-010      | ما actions التي تتطلب E-Signature تحديدًا؟              | Approvals            |
| BD-011      | ما Separation-of-Duties matrix الفعلية؟                 | Approvals            |
| BD-012      | هل Reviewer يستطيع أيضًا Approve في حالات معينة؟        | Approvals            |
| BD-013      | ما سياسة Revision numbering للـWI/SOP؟                  | Documents            |
| BD-014      | هل Approved Document يصبح Effective فورًا؟              | Documents            |
| BD-015      | ما definition الفعلي للـDuplicate Receiving؟            | Quarantine           |
| BD-016      | ما Draft records التي يجوز hard delete لها؟             | All Domains          |
| BD-017      | ما RPO؟                                                 | Backup               |
| BD-018      | ما RTO؟                                                 | Backup               |
| BD-019      | ما Import transaction strategy؟                         | Administration       |
| BD-020      | ما controlled reference data الذي يحتاج Change Request؟ | Administration       |
| BD-021      | هل manual inspection judgments موجودة؟ وما ضوابطها؟     | Inspection           |
| BD-022      | ما الحالات الدقيقة لكل State Machine؟                   | All                  |
| BD-023      | من يستطيع Close NCR/CAPA؟                               | Quality              |
| BD-024      | من يستطيع Void controlled records؟                      | All                  |
| BD-025      | ما workflows التي تتطلب mandatory rejection reason؟     | Approvals            |

---

# 34. Rules That Must Never Be Invented by Codex/Developer

ممنوع افتراض:

```text
Scientific limits
Sampling rules
Acceptance criteria
Calibration interval
Retest allowance
Release authority
Approval hierarchy
Mandatory signature actions
CAPA effectiveness policy
NCR creation threshold
Document effective-date policy
Data retention period
RPO
RTO
```

إذا المعلومة غير موجودة:

```text
UNCONFIRMED
```

وليس:

```text
reasonable default
```

---

# 35. Implementation Contract

كل Feature لاحقًا يجب أن تحدد Business Rules المرتبطة بها.

مثال:

```text
Feature:
Approve Inspection Report

Rules:
BR-INSP-013
BR-INSP-014
BR-APR-003
BR-APR-004
BR-APR-005
BR-GEN-009
BR-GEN-010
BR-GEN-011
BR-AUD-001
```

---

# 36. Test Contract

كل Rule قابل للاختبار يجب أن يرتبط لاحقًا بـTest.

مثال:

```text
BR-APR-005
↓
TEST-APR-STALE-VERSION-001
```

والـRequirement Traceability تصبح:

```text
Requirement
↓
Business Rule
↓
Implementation
↓
Automated Test
↓
E2E
↓
Evidence
```

---

# 37. Negative Testing Contract

القواعد الحرجة تحتاج اختبارات رفض.

مثال Approval:

```text
Unauthorized actor → DENY
Wrong state → DENY
Stale version → DENY
Self approval where prohibited → DENY
Missing E-Signature where required → DENY
Duplicate approval → NO DUPLICATE EFFECT
Invalid record → DENY
```

---

# 38. Database Enforcement Contract

إذا Business Rule يمكن حمايته في PostgreSQL بدون كسر architecture، يجب دراسة DB enforcement.

مثل:

```text
NOT NULL
CHECK constraints
UNIQUE
Foreign Keys
Version columns
Transactions
Indexes
```

لكن DB constraint لا يستبدل Domain Rule إذا القاعدة تحتاج context معقد.

---

# 39. API Contract

الـAPI لا يقبل Business Outcome من Client إذا يستطيع النظام تحديده بنفسه.

مثال سيئ:

```json
{
  "approved": true,
  "actor_id": "manager-123"
}
```

الصحيح conceptually:

```text
Authenticated actor
+
Approve command
+
Server authorization
+
Server state validation
+
Server transition
```

---

# 40. UI Contract

UI يعكس Business Rules لكنه لا يملكها.

يمكن UI:

```text
Hide
Disable
Explain
Warn
Validate early
Guide user
```

لكن Server يعيد تطبيق القواعد كلها.

---

# 41. Reporting Contract

أي Field مشتق في Report يجب أن يكون له مصدر واضح.

ممنوع وجود:

```text
Dashboard formula
Report formula
Excel formula
PDF formula
```

كل واحدة تعطي نتيجة مختلفة.

---

# 42. Current Foundation Relationship

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

# 43. Authority Order

عند التعارض المستقبلي:

```text
Approved company/QC controlled source
        ↓
System Invariants
        ↓
Approved Business Rules
        ↓
Approved State Machine / Permission Matrix
        ↓
Data Model
        ↓
Implementation
        ↓
UI
```

ولا يسمح للكود القائم بأن يصبح Rule فقط لأنه موجود.

---

# 44. Final Business Rule Principle

إذا لم نستطع الإجابة على:

```text
Who may do it?
Under what state?
Using what source?
What must be validated?
What changes?
What is frozen?
What is audited?
What happens on retry?
What happens on concurrent edit?
What history must remain?
```

فالـFeature ليست جاهزة للتنفيذ بعد.

---

# 45. Document Status

```text
Document:
BUSINESS-RULES.md

Version:
1.0

Product:
QC Operations & Laboratory Management System

Architecture:
Modular Monolith

Database:
PostgreSQL

Status:
FOUNDATION — APPROVED BUSINESS RULE FRAMEWORK

Scientific Rules:
SOURCE-DEPENDENT — DO NOT INVENT

Unconfirmed Operational Policies:
Tracked explicitly in Section 33

Next Foundation Document:
ROLE-MATRIX.md
```
