# REQUIREMENTS-TRACEABILITY.md

# QC Operations & Laboratory Management System

## Requirements Traceability Matrix — v1.0

**Document Path:** `Documents/REQUIREMENTS-TRACEABILITY.md`
**Status:** FOUNDATION
**Architecture:** Modular Monolith
**Web Framework:** Astro
**Rendering Model:** Server-rendered / On-demand
**Database:** PostgreSQL
**Authorization:** Centralized Server-Side
**Traceability Model:** Requirement → Rule → Permission → State → Data → Test → Evidence

---

# 1. Purpose

هذه الوثيقة هي المرجع المركزي لربط متطلبات:

> **QC Operations & Laboratory Management System**

بالتنفيذ الفعلي والتحقق منه.

الهدف النهائي:

```text
Requirement
    ↓
Business Rule
    ↓
Permission
    ↓
State Transition
    ↓
Data Model
    ↓
Implementation
    ↓
Automated Test
    ↓
E2E
    ↓
Evidence
    ↓
PASS / FAIL
```

وجود Feature في الواجهة لا يعني أن Requirement مكتملة.

وجود Code لا يعني أنها Verified.

وجود Test file لا يعني أن Test تم تشغيله.

وجود تقرير يقول "PASS" لا يعني شيئًا بدون Evidence.

---

# 2. Primary Rule

> **No requirement may be marked PASS without current evidence.**

أي Claim مثل:

```text
DONE
COMPLETE
IMPLEMENTED
VERIFIED
PASS
100%
PRODUCTION READY
```

يجب أن يكون قابلًا للإثبات من Current Repository + Current Database + Current Runtime + Current Tests.

---

# 3. Source Documents

المصادر الرسمية:

```text
Documents/
├── QC-SYSTEM-DESIGN-CONSTITUTION.md
├── SYSTEM-INVARIANTS.md
├── DOMAIN-MAP.md
├── BUSINESS-RULES.md
├── ROLE-MATRIX.md
├── PERMISSION-MATRIX.md
├── STATE-MACHINES.md
├── DATA-MODEL.md
├── DATA-DICTIONARY.md
└── REQUIREMENTS-TRACEABILITY.md
```

---

# 4. Source Authority

عند التعارض:

```text
Approved Company / QC Controlled Source
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
Implementation
```

الكود لا يصبح Requirement لمجرد أنه موجود.

---

# 5. Framework Decision

الـWeb Framework الرسمي:

```text
Astro
```

النظام ليس Static Marketing Website.

النظام عبارة عن:

```text
Authenticated
Server-backed
Database-driven
Authorization-sensitive
Transaction-heavy
Operational Web Application
```

لذلك Architecture المطلوبة:

```text
Astro
+
Server Rendering / On-demand Rendering
+
Server-side Application Use Cases
+
PostgreSQL
```

---

# 6. Astro Delivery Architecture

الهيكل المقترح:

```text
src/

  pages/
    # Astro routes / delivery layer

  actions/
    # Astro server actions / delivery layer

  middleware.ts
    # Authentication/session/request context

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

# 7. Astro Boundary Rule

`src/pages/` لا يملك Business Rules.

`src/actions/` لا يملك Business Rules.

`src/middleware.ts` لا يملك Business Rules.

الـBusiness Logic يوجد في:

```text
src/modules/{domain}/domain
src/modules/{domain}/application
```

---

# 8. Required Astro Request Path

الـMutation الصحيحة:

```text
Astro Page / Client Island
        ↓
Astro Action or API Endpoint
        ↓
Authenticated Request Context
        ↓
Application Use Case
        ↓
Authorization Policy
        ↓
Domain Rules
        ↓
Transaction
        ↓
Repository
        ↓
PostgreSQL
        ↓
Audit / Outbox
```

---

# 9. Forbidden Astro Paths

ممنوع:

```text
.astro Component
        ↓
Direct PostgreSQL Query
```

ممنوع:

```text
Client Island
        ↓
Database
```

ممنوع:

```text
Astro Action
        ↓
SQL
```

إذا كان ذلك bypass للـApplication/Domain layer.

ممنوع:

```text
Middleware says user is Manager
        ↓
Allow every action
```

---

# 10. Middleware Responsibility

Astro Middleware يمكن أن يكون مسؤولًا عن:

```text
Session resolution
Authentication context
Request ID
Security headers
Basic protected-route handling
Actor context
```

لكن:

> Middleware authentication is not domain authorization.

كل Action حساسة تعيد Authorization داخل الـApplication Use Case.

---

# 11. Client Islands

Client-side islands تستخدم عند الحاجة الفعلية للتفاعل مثل:

```text
Advanced Data Grid
Complex Forms
Interactive Measurement Entry
Charts
Bulk Entry
Rich Filters
Autosave Draft UX
```

لكن Business Rules تبقى Server-side.

---

# 12. Requirement Identifier Convention

```text
REQ-ARCH-xxx   Architecture
REQ-IDN-xxx    Identity
REQ-AUTH-xxx   Authorization
REQ-TASK-xxx   Tasks
REQ-QUAL-xxx   Quality
REQ-QUAR-xxx   Quarantine
REQ-INSP-xxx   Inspection
REQ-LAB-xxx    Laboratory
REQ-EQP-xxx    Equipment
REQ-CAL-xxx    Calibration
REQ-MNT-xxx    Maintenance
REQ-DOC-xxx    Documents
REQ-APR-xxx    Reviews / Approval
REQ-ESIG-xxx   E-Signatures
REQ-CHG-xxx    Change Requests
REQ-RPT-xxx    Reporting
REQ-AUD-xxx    Audit
REQ-FILE-xxx   Files / Evidence
REQ-NOT-xxx    Notifications
REQ-SRCH-xxx   Search
REQ-DASH-xxx   Dashboard
REQ-ADM-xxx    Administration
REQ-HLTH-xxx   Health
REQ-BKP-xxx    Backup / Recovery
REQ-AI-xxx     AI
REQ-DATA-xxx   Database / Data Integrity
REQ-SEC-xxx    Security
REQ-UX-xxx     UX / Accessibility
REQ-TST-xxx    Testing / Verification
```

---

# 13. Requirement Status

### APPROVED

Requirement معتمدة ويمكن التنفيذ عليها.

### POLICY-DEPENDENT

تحتاج قرار Policy.

Runtime behavior الحساس:

```text
DENY
```

حتى الاعتماد.

### SOURCE-DEPENDENT

تحتاج Controlled Scientific/Quality Source.

### DEFERRED

مقصودة لمرحلة لاحقة.

### REMOVED

Requirement ألغيت رسميًا مع الحفاظ على traceability.

---

# 14. Implementation Status

لا تستخدم حالة واحدة `DONE`.

نستخدم:

```text
NOT_STARTED
IN_PROGRESS
IMPLEMENTED_UNVERIFIED
VERIFIED
BLOCKED
NOT_APPLICABLE
```

---

# 15. Verification Status

```text
NO_EVIDENCE
PARTIAL_EVIDENCE
VERIFIED
FAILED
STALE_EVIDENCE
```

---

# 16. Evidence Contract

أي Evidence يجب أن تعرف:

```text
Commit SHA
Branch
Date/Time
Environment
Command
Exit Code
Test Result
Affected Requirement IDs
Relevant files
Known limitations
```

---

# 17. Stale Evidence

إذا تغير implementation المرتبط بـRequirement بعد Evidence:

Evidence يمكن أن تصبح:

```text
STALE_EVIDENCE
```

ويجب إعادة verification.

---

# 18. Test Identifier Convention

```text
TEST-{DOMAIN}-{NUMBER}
```

مثال:

```text
TEST-INSP-001
TEST-INSP-002
TEST-LAB-001
TEST-AUTH-001
```

---

# 19. Evidence Identifier Convention

```text
EVID-{DOMAIN}-{NUMBER}
```

مثال:

```text
EVID-INSP-001
```

لا يتم إنشاء Evidence ID كـPASS فارغ.

---

# 20. Traceability Record Contract

كل Requirement يجب أن تستطيع تحديد:

```text
Requirement ID
Statement
Status
Source
Business Rules
Permissions
State Transitions
Data Entities
Verification Type
Test IDs
Evidence IDs
Implementation Status
Known Gaps
```

---

# 21. Architecture Requirements

| ID           | Requirement                                               | Governing Source             | Verification              | Status   |
| ------------ | --------------------------------------------------------- | ---------------------------- | ------------------------- | -------- |
| REQ-ARCH-001 | النظام يستخدم Astro كـWeb Framework الرسمي                | Constitution / this document | Architecture inspection   | APPROVED |
| REQ-ARCH-002 | التطبيق يستخدم server/on-demand rendering للوظائف المحمية | Architecture                 | Build/runtime test        | APPROVED |
| REQ-ARCH-003 | Server deployment يستخدم Astro-compatible server adapter  | Architecture                 | Build/deploy verification | APPROVED |
| REQ-ARCH-004 | النظام Modular Monolith                                   | DOMAIN-MAP                   | Architecture guard        | APPROVED |
| REQ-ARCH-005 | يستخدم PostgreSQL من البداية                              | DATA-MODEL                   | Integration test          | APPROVED |
| REQ-ARCH-006 | كل Domain له حدود داخلية واضحة                            | DOMAIN-MAP                   | Architecture test         | APPROVED |
| REQ-ARCH-007 | Astro pages/actions تبقى Delivery Layer                   | DOMAIN-MAP                   | Import boundary test      | APPROVED |
| REQ-ARCH-008 | لا يوجد direct UI → Database                              | Constitution                 | Architecture guard        | APPROVED |
| REQ-ARCH-009 | لا يوجد Astro Action → raw cross-domain DB mutation       | DOMAIN-MAP                   | Architecture guard        | APPROVED |
| REQ-ARCH-010 | Middleware لا يستبدل domain authorization                 | PERMISSION-MATRIX            | Security integration test | APPROVED |
| REQ-ARCH-011 | كل routes قابلة للتحقق machine-verifiably                 | SYSTEM-INVARIANTS            | Route manifest test       | APPROVED |
| REQ-ARCH-012 | كل tests المسجلة قابلة للاكتشاف والتشغيل                  | Constitution                 | Test manifest             | APPROVED |

---

# 22. Architecture Trace Example

```text
REQ-ARCH-008
No direct UI → Database
        ↓
SYSTEM-INVARIANT-19
Architecture boundaries
        ↓
src/pages / src/ui
cannot import
shared/database
        ↓
Architecture Guard Test
        ↓
Current CI Evidence
```

---

# 23. Identity Requirements

| ID          | Requirement                                          | Rules      | Data              | Verification      | Status   |
| ----------- | ---------------------------------------------------- | ---------- | ----------------- | ----------------- | -------- |
| REQ-IDN-001 | Controlled human actions require authenticated user  | BR-IDN-001 | users, sessions   | Integration + E2E | APPROVED |
| REQ-IDN-002 | Shared accounts cannot perform controlled actions    | BR-IDN-002 | users             | Negative E2E      | APPROVED |
| REQ-IDN-003 | Disabled users cannot create sessions                | BR-IDN-003 | users, sessions   | Integration       | APPROVED |
| REQ-IDN-004 | Password reset invalidates existing sessions         | BR-IDN-004 | users, sessions   | Integration       | APPROVED |
| REQ-IDN-005 | Actor identity comes from trusted server session     | BR-IDN-005 | sessions          | Security test     | APPROVED |
| REQ-IDN-006 | Historical user actions survive account deactivation | DATA-MODEL | users + audit FKs | DB integration    | APPROVED |

---

# 24. Authorization Requirements

| ID           | Requirement                                   | Rules / Permissions     | Verification             | Status   |
| ------------ | --------------------------------------------- | ----------------------- | ------------------------ | -------- |
| REQ-AUTH-001 | Authorization enforced server-side            | BR-GEN-001, BR-AUTH-001 | Security test            | APPROVED |
| REQ-AUTH-002 | Default Deny                                  | BR-GEN-002              | Negative permission test | APPROVED |
| REQ-AUTH-003 | Role alone never grants authorization         | ROLE-MATRIX             | Permission tests         | APPROVED |
| REQ-AUTH-004 | Scope applies to authorization                | BR-AUTH-002             | Wrong-scope tests        | APPROVED |
| REQ-AUTH-005 | Entity state participates in authorization    | BR-AUTH-002             | Wrong-state tests        | APPROVED |
| REQ-AUTH-006 | SoD can override Allow                        | PERMISSION-MATRIX       | SoD tests                | APPROVED |
| REQ-AUTH-007 | Record version validated on sensitive action  | BR-GEN-011              | Stale-version tests      | APPROVED |
| REQ-AUTH-008 | Reports obey same authorization scope         | BR-AUTH-003             | Report IDOR tests        | APPROVED |
| REQ-AUTH-009 | Search does not reveal unauthorized records   | BR-SRCH-003             | Negative search tests    | APPROVED |
| REQ-AUTH-010 | Admin has no universal business override      | BR-AUTH-004             | Negative admin tests     | APPROVED |
| REQ-AUTH-011 | Astro Actions reauthorize actions server-side | Astro Architecture      | Action integration tests | APPROVED |

---

# 25. Tasks Requirements

| ID           | Requirement                                        | Rules           | Permissions        | State       | Data                 | Status          |
| ------------ | -------------------------------------------------- | --------------- | ------------------ | ----------- | -------------------- | --------------- |
| REQ-TASK-001 | إنشاء وإدارة general operational tasks             | BR-TASK-001     | PERM-TASK-CREATE   | TR-TASK-001 | tasks                | APPROVED        |
| REQ-TASK-002 | Task يمكن ربطه بسجل متخصص بدون امتلاكه             | BR-TASK-002     | PERM-TASK-VIEW     | —           | tasks                | APPROVED        |
| REQ-TASK-003 | Assignment قابل للتتبع                             | BR-TASK-003/004 | PERM-TASK-ASSIGN   | —           | task_assignments     | APPROVED        |
| REQ-TASK-004 | Mandatory checklist يمنع completion عند النقص      | BR-TASK-005     | PERM-TASK-COMPLETE | TR-TASK-005 | task_checklist_items | APPROVED        |
| REQ-TASK-005 | Hold يحتاج سبب                                     | BR-TASK-006     | PERM-TASK-BLOCK    | TR-TASK-003 | tasks/audit          | APPROVED        |
| REQ-TASK-006 | Complete action explicit وليس progress side effect | BR-TASK-007     | PERM-TASK-COMPLETE | TR-TASK-005 | tasks                | APPROVED        |
| REQ-TASK-007 | Reopen يحتاج controlled action                     | BR-TASK-008     | PERM-TASK-REOPEN   | TR-TASK-007 | tasks/audit          | APPROVED        |
| REQ-TASK-008 | Recurring task generation idempotent               | BR-TASK-009     | System             | —           | recurrence           | DEFERRED/POLICY |

---

# 26. Quality Requirements

| ID           | Requirement                                   | Rules       | Entity             | Verification      | Status           |
| ------------ | --------------------------------------------- | ----------- | ------------------ | ----------------- | ---------------- |
| REQ-QUAL-001 | Finding يمثل quality observation قابلة للتتبع | BR-QUAL-001 | findings           | Integration       | APPROVED         |
| REQ-QUAL-002 | Source record يبقى owned by source domain     | BR-QUAL-002 | finding links      | Architecture + DB | APPROVED         |
| REQ-QUAL-003 | Finding يحافظ على source reference            | BR-QUAL-003 | findings/links     | Integration       | APPROVED         |
| REQ-QUAL-004 | NCR يسجل nonconformance context               | BR-QUAL-011 | ncrs               | Validation test   | APPROVED         |
| REQ-QUAL-005 | RCA منفصل عن مجرد وصف NCR                     | BR-QUAL-020 | rcas               | Domain test       | APPROVED         |
| REQ-QUAL-006 | CAPA Actions قابلة للتتبع                     | BR-QUAL-030 | capas/capa_actions | Integration       | APPROVED         |
| REQ-QUAL-007 | Completion of actions ≠ Effectiveness         | BR-QUAL-031 | capas              | Domain test       | APPROVED         |
| REQ-QUAL-008 | CAPA لا تغلق مع mandatory actions ناقصة       | BR-QUAL-032 | capas              | Negative test     | APPROVED         |
| REQ-QUAL-009 | Automatic NCR policy لا تخترع                 | BR-QUAL-010 | —                  | Policy evidence   | POLICY-DEPENDENT |
| REQ-QUAL-010 | Effectiveness policy لا تخترع                 | BR-QUAL-033 | —                  | Policy evidence   | POLICY-DEPENDENT |

---

# 27. Quarantine / Receiving Requirements

| ID           | Requirement                                          | Rules       | Permission                 | Transition | Data                   | Status           |
| ------------ | ---------------------------------------------------- | ----------- | -------------------------- | ---------- | ---------------------- | ---------------- |
| REQ-QUAR-001 | Receiving Item سجل رسمي دائم                         | BR-QUAR-001 | PERM-QUAR-CREATE           | TR-RCV-001 | receiving_items        | APPROVED         |
| REQ-QUAR-002 | Receiving يحتوي الحقول الأساسية المعتمدة             | BR-QUAR-002 | —                          | —          | receiving_items        | APPROVED         |
| REQ-QUAR-003 | Receiving business ID يولده النظام                   | BR-QUAR-003 | —                          | —          | receiving_no           | APPROVED         |
| REQ-QUAR-004 | Quantity validated                                   | BR-QUAR-004 | —                          | TR-RCV-001 | qty                    | APPROVED         |
| REQ-QUAR-005 | Workflow State منفصل عن Inspection Result            | BR-QUAR-005 | —                          | all        | receiving_items        | APPROVED         |
| REQ-QUAR-006 | Inspection Result منفصل عن Release System            | BR-QUAR-006 | —                          | all        | receiving_items        | APPROVED         |
| REQ-QUAR-007 | PASS لا يعني Release تلقائيًا                        | BR-QUAR-007 | PERM-QUAR-RELEASE          | TR-RCV-006 | release_system         | APPROVED         |
| REQ-QUAR-008 | Release action explicit                              | BR-QUAR-008 | PERM-QUAR-RELEASE          | TR-RCV-006 | receiving_items        | POLICY-DEPENDENT |
| REQ-QUAR-009 | Inspection creation auto-populates Receiving context | BR-QUAR-010 | PERM-QUAR-START-INSPECTION | TR-RCV-003 | receiving + inspection | APPROVED         |
| REQ-QUAR-010 | Duplicate definition لا تخترع                        | BR-QUAR-011 | —                          | TR-RCV-001 | receiving              | POLICY-DEPENDENT |
| REQ-QUAR-011 | Controlled downstream data cannot be silently edited | BR-QUAR-012 | PERM-QUAR-CORRECT          | —          | receiving/audit        | APPROVED         |

---

# 28. Inspection Requirements

| ID           | Requirement                                          | Rule              | Permission             | Transition     | Data                         | Status           |
| ------------ | ---------------------------------------------------- | ----------------- | ---------------------- | -------------- | ---------------------------- | ---------------- |
| REQ-INSP-001 | Controlled Inspection uses approved Template Version | BR-INSP-001       | PERM-INSP-CREATE       | TR-INSP-001    | inspection_template_versions | APPROVED         |
| REQ-INSP-002 | Draft template cannot issue controlled report        | BR-INSP-002       | —                      | TR-INSP-001    | templates                    | APPROVED         |
| REQ-INSP-003 | Exact Template Version retained                      | BR-INSP-003       | —                      | all            | template_version_id/snapshot | APPROVED         |
| REQ-INSP-004 | Acceptance criteria from approved controlled source  | BR-INSP-004       | —                      | submit/approve | criteria snapshot            | SOURCE-DEPENDENT |
| REQ-INSP-005 | Observed result comes from user/instrument           | BR-INSP-005       | PERM-INSP-ENTER-RESULT | —              | inspection_report_results    | APPROVED         |
| REQ-INSP-006 | Automated PASS/FAIL uses deterministic approved rule | BR-INSP-006       | —                      | —              | results/criteria             | SOURCE-DEPENDENT |
| REQ-INSP-007 | Mandatory points complete before Submit              | BR-INSP-008       | PERM-INSP-SUBMIT       | TR-INSP-002    | report_results               | APPROVED         |
| REQ-INSP-008 | Required evidence exists before Submit               | BR-INSP-009       | PERM-INSP-SUBMIT       | TR-INSP-002    | evidence_links               | SOURCE-DEPENDENT |
| REQ-INSP-009 | Submit freezes controlled context                    | BR-INSP-010       | PERM-INSP-SUBMIT       | TR-INSP-002    | inspection_report_snapshots  | APPROVED         |
| REQ-INSP-010 | Submitted report not freely editable                 | BR-INSP-011       | —                      | —              | reports                      | APPROVED         |
| REQ-INSP-011 | Reviewer cannot silently rewrite author results      | BR-INSP-012       | PERM-INSP-RETURN       | TR-INSP-004    | results/audit                | APPROVED         |
| REQ-INSP-012 | Approval verifies current version                    | BR-INSP-013       | PERM-INSP-APPROVE      | TR-INSP-006    | version                      | APPROVED         |
| REQ-INSP-013 | Approval + required consequences are atomic          | BR-INSP-014       | PERM-INSP-APPROVE      | TR-INSP-006    | reports/receiving/audit      | APPROVED         |
| REQ-INSP-014 | Scientific result separated from workflow state      | STATE-MACHINES    | —                      | —              | state/final_result           | APPROVED         |
| REQ-INSP-015 | Final approver role must be explicitly approved      | Permission Matrix | PERM-INSP-APPROVE      | TR-INSP-006    | —                            | POLICY-DEPENDENT |
| REQ-INSP-016 | AI cannot create official result                     | BR-AI-007         | —                      | —              | —                            | APPROVED         |

---

# 29. Laboratory Requirements

| ID          | Requirement                                          | Rule           | Permission                 | Transition    | Data                       | Status           |
| ----------- | ---------------------------------------------------- | -------------- | -------------------------- | ------------- | -------------------------- | ---------------- |
| REQ-LAB-001 | Lab Test هو controlled scientific record             | BR-LAB-001     | PERM-LAB-CREATE            | TR-LAB-001    | lab_tests                  | APPROVED         |
| REQ-LAB-002 | Approved test definition required                    | BR-LAB-002     | —                          | TR-LAB-001    | template_version           | SOURCE-DEPENDENT |
| REQ-LAB-003 | Scientific limits cannot be defaults                 | BR-LAB-003     | —                          | —             | criteria                   | APPROVED         |
| REQ-LAB-004 | Sample identity traceable                            | BR-LAB-004     | PERM-LAB-ENTER-SAMPLE      | —             | lab_samples                | APPROVED         |
| REQ-LAB-005 | Raw measurements preserved                           | BR-LAB-005     | PERM-LAB-ENTER-MEASUREMENT | —             | lab_measurements           | APPROVED         |
| REQ-LAB-006 | Scientific units explicit                            | BR-LAB-006     | —                          | —             | lab_measurements           | APPROVED         |
| REQ-LAB-007 | Unit conversion traceable                            | BR-LAB-007     | —                          | —             | measurements               | APPROVED         |
| REQ-LAB-008 | Environmental requirements come from source          | BR-LAB-008     | —                          | —             | test definition            | SOURCE-DEPENDENT |
| REQ-LAB-009 | Required data complete before Submit                 | BR-LAB-009     | PERM-LAB-SUBMIT            | TR-LAB-002    | tests/samples/measurements | APPROVED         |
| REQ-LAB-010 | Submit freezes scientific context                    | BR-LAB-010     | PERM-LAB-SUBMIT            | TR-LAB-002    | lab_test_snapshots         | APPROVED         |
| REQ-LAB-011 | Required equipment is identified                     | BR-LAB-011     | —                          | TR-LAB-002    | lab_equipment_usage        | SOURCE-DEPENDENT |
| REQ-LAB-012 | Calibration context preserved                        | BR-LAB-012     | —                          | submit        | lab_equipment_usage        | APPROVED         |
| REQ-LAB-013 | Current calibration changes do not rewrite old tests | BR-LAB-013     | —                          | —             | snapshots                  | APPROVED         |
| REQ-LAB-014 | Retest is a new execution                            | BR-LAB-014     | PERM-LAB-RETEST            | TR-RETEST-003 | lab_tests                  | APPROVED         |
| REQ-LAB-015 | Retest references original                           | BR-LAB-015     | —                          | —             | original_test_id           | APPROVED         |
| REQ-LAB-016 | Retest reason required                               | BR-LAB-016     | PERM-LAB-RETEST            | —             | retest_reason              | APPROVED         |
| REQ-LAB-017 | Retest never hides original failure                  | BR-LAB-017     | —                          | —             | lab_tests                  | APPROVED         |
| REQ-LAB-018 | Retest authorization/count policy explicit           | BR-LAB-018     | PERM-LAB-AUTHORIZE-RETEST  | TR-RETEST-*   | —                          | POLICY-DEPENDENT |
| REQ-LAB-019 | Approved test immutable                              | BR-LAB-020     | —                          | TR-LAB-008    | lab_tests                  | APPROVED         |
| REQ-LAB-020 | PASS/FAIL from controlled criteria                   | BR-LAB-021     | —                          | approval      | criteria snapshot          | SOURCE-DEPENDENT |
| REQ-LAB-021 | Excel/Bulk entry uses same validation                | BR-LAB-023/024 | PERM-LAB-BULK-ENTRY        | —             | measurements               | APPROVED         |

---

# 30. Equipment Requirements

| ID          | Requirement                                         | Rule       | Data                      | Status           |
| ----------- | --------------------------------------------------- | ---------- | ------------------------- | ---------------- |
| REQ-EQP-001 | Equipment stable identity                           | BR-EQP-001 | equipment                 | APPROVED         |
| REQ-EQP-002 | Equipment current state explicit                    | BR-EQP-002 | equipment.state           | APPROVED         |
| REQ-EQP-003 | Historical usage not rewritten by master changes    | BR-EQP-003 | snapshots                 | APPROVED         |
| REQ-EQP-004 | Decommission preserves history                      | BR-EQP-004 | equipment                 | APPROVED         |
| REQ-EQP-005 | Controlled equipment fields may need Change Request | BR-EQP-005 | equipment/change_requests | POLICY-DEPENDENT |

---

# 31. Calibration Requirements

| ID          | Requirement                                            | Rule       | Transition | Data                  | Status           |
| ----------- | ------------------------------------------------------ | ---------- | ---------- | --------------------- | ---------------- |
| REQ-CAL-001 | Calibration records historical                         | BR-CAL-001 | all        | calibration_records   | APPROVED         |
| REQ-CAL-002 | Due Date originates from approved policy/source        | BR-CAL-002 | —          | due_date              | SOURCE-DEPENDENT |
| REQ-CAL-003 | Overdue derived deterministically using trusted time   | BR-CAL-003 | TR-CAL-005 | calibration_records   | APPROVED         |
| REQ-CAL-004 | Equipment blocking on overdue not invented             | BR-CAL-004 | —          | —                     | POLICY-DEPENDENT |
| REQ-CAL-005 | Calibration certificate traceable                      | BR-CAL-005 | —          | files/evidence        | APPROVED         |
| REQ-CAL-006 | New current calibration supersedes previous atomically | DATA-MODEL | TR-CAL-006 | equipment/calibration | APPROVED         |

---

# 32. Maintenance Requirements

| ID          | Requirement                                | Rule       | Data                    | Status   |
| ----------- | ------------------------------------------ | ---------- | ----------------------- | -------- |
| REQ-MNT-001 | Maintenance history preserved              | BR-MNT-001 | maintenance_records     | APPROVED |
| REQ-MNT-002 | Maintenance can affect availability        | BR-MNT-002 | equipment + maintenance | APPROVED |
| REQ-MNT-003 | Maintenance completion ≠ valid calibration | BR-MNT-003 | equipment/calibration   | APPROVED |

---

# 33. Controlled Documents Requirements

| ID          | Requirement                                                  | Rule              | Permission         | Transition | Data                                  | Status           |
| ----------- | ------------------------------------------------------------ | ----------------- | ------------------ | ---------- | ------------------------------------- | ---------------- |
| REQ-DOC-001 | Identity/version separated                                   | BR-DOC-001        | —                  | —          | document_identities/document_versions | APPROVED         |
| REQ-DOC-002 | Approved version immutable                                   | BR-DOC-002        | —                  | —          | document_versions                     | APPROVED         |
| REQ-DOC-003 | Revision creates new version                                 | BR-DOC-003        | PERM-DOC-REVISE    | TR-DOC-008 | document_versions                     | APPROVED         |
| REQ-DOC-004 | Superseded history preserved                                 | BR-DOC-004        | PERM-DOC-SUPERSEDE | TR-DOC-009 | versions                              | APPROVED         |
| REQ-DOC-005 | Historical record references exact version used              | BR-DOC-005        | —                  | —          | document_version_id                   | APPROVED         |
| REQ-DOC-006 | Catalog entry ≠ approved controlled content                  | BR-DOC-006        | —                  | TR-DOC-001 | document identity/version             | APPROVED         |
| REQ-DOC-007 | Approval authority explicit                                  | Permission Matrix | PERM-DOC-APPROVE   | TR-DOC-006 | —                                     | POLICY-DEPENDENT |
| REQ-DOC-008 | Effective-date policy explicit                               | BR-DOC-009        | —                  | TR-DOC-007 | effective_at                          | POLICY-DEPENDENT |
| REQ-DOC-009 | Supersession transaction preserves one valid current version | DATA-MODEL        | —                  | TR-DOC-009 | document_versions                     | APPROVED         |

---

# 34. Reviews / Approvals Requirements

| ID          | Requirement                                              | Rules      | Permission      | Verification      | Status           |
| ----------- | -------------------------------------------------------- | ---------- | --------------- | ----------------- | ---------------- |
| REQ-APR-001 | Review and Approval separate actions                     | BR-APR-001 | PERM-APR-*      | Domain tests      | APPROVED         |
| REQ-APR-002 | Shared Approval infrastructure                           | BR-APR-002 | —               | Architecture test | APPROVED         |
| REQ-APR-003 | Permission revalidated at action time                    | BR-APR-003 | PERM-APR-*      | Integration       | APPROVED         |
| REQ-APR-004 | State revalidated                                        | BR-APR-004 | PERM-APR-*      | Wrong-state test  | APPROVED         |
| REQ-APR-005 | Version revalidated                                      | BR-APR-005 | PERM-APR-*      | Stale test        | APPROVED         |
| REQ-APR-006 | SoD server-enforced                                      | BR-APR-006 | —               | Negative SoD test | APPROVED         |
| REQ-APR-007 | Return preserves review history                          | BR-APR-009 | PERM-APR-RETURN | Integration       | APPROVED         |
| REQ-APR-008 | Decision auditable                                       | BR-APR-010 | —               | Audit integration | APPROVED         |
| REQ-APR-009 | Exact reviewer/approver combinations approved explicitly | BR-APR-007 | —               | Policy evidence   | POLICY-DEPENDENT |

---

# 35. E-Signature Requirements

| ID           | Requirement                                   | Rule        | Data                  | Verification    | Status           |
| ------------ | --------------------------------------------- | ----------- | --------------------- | --------------- | ---------------- |
| REQ-ESIG-001 | Approve button alone is not E-Signature       | BR-ESIG-001 | electronic_signatures | E2E             | APPROVED         |
| REQ-ESIG-002 | Signature action reauthenticates actor        | BR-ESIG-002 | —                     | Security test   | APPROVED         |
| REQ-ESIG-003 | Reauthorization occurs after reauth           | BR-ESIG-003 | —                     | Security test   | APPROVED         |
| REQ-ESIG-004 | Signature meaning shown before sign           | BR-ESIG-004 | meaning               | E2E             | APPROVED         |
| REQ-ESIG-005 | Password never stored as evidence             | BR-ESIG-005 | signature data        | Security test   | APPROVED         |
| REQ-ESIG-006 | Signature binds exact record version          | BR-ESIG-006 | subject_version       | Integration     | APPROVED         |
| REQ-ESIG-007 | Signature binds snapshot integrity            | BR-ESIG-007 | snapshot_hash         | Integration     | APPROVED         |
| REQ-ESIG-008 | Required signature actions decided explicitly | BR-ESIG-008 | —                     | Policy evidence | POLICY-DEPENDENT |

---

# 36. Change Request Requirements

| ID          | Requirement                                     | Rule       | Transition     | Data                   | Status   |
| ----------- | ----------------------------------------------- | ---------- | -------------- | ---------------------- | -------- |
| REQ-CHG-001 | Controlled changes use controlled workflow      | BR-CHG-001 | TR-CHG-*       | change_requests        | APPROVED |
| REQ-CHG-002 | Current and proposed values visible             | BR-CHG-002 | —              | change_request_changes | APPROVED |
| REQ-CHG-003 | Reason mandatory                                | BR-CHG-003 | TR-CHG-001     | reason                 | APPROVED |
| REQ-CHG-004 | Stale target detected                           | BR-CHG-004 | TR-CHG-007     | target_version         | APPROVED |
| REQ-CHG-005 | Owning Domain applies approved change           | BR-CHG-005 | TR-CHG-007/008 | target domain          | APPROVED |
| REQ-CHG-006 | Approval does not guarantee application success | BR-CHG-006 | TR-CHG-009     | attempts               | APPROVED |
| REQ-CHG-007 | Change application transactional                | BR-CHG-007 | TR-CHG-008     | target/change/audit    | APPROVED |
| REQ-CHG-008 | Request history preserved                       | BR-CHG-008 | all            | change_requests        | APPROVED |

---

# 37. Reporting Requirements

| ID          | Requirement                              | Rule            | Permission         | Data              | Status   |
| ----------- | ---------------------------------------- | --------------- | ------------------ | ----------------- | -------- |
| REQ-RPT-001 | Canonical dataset per report             | BR-RPT-001      | PERM-RPT-RUN       | domain read model | APPROVED |
| REQ-RPT-002 | CSV/XLSX/PDF use same dataset            | BR-RPT-002      | export permissions | report engine     | APPROVED |
| REQ-RPT-003 | Report follows app authorization         | BR-RPT-003      | PERM-RPT-*         | —                 | APPROVED |
| REQ-RPT-004 | Controlled filtering server-side         | BR-RPT-004      | —                  | —                 | APPROVED |
| REQ-RPT-005 | Generation metadata stored               | BR-RPT-005      | —                  | report_runs       | APPROVED |
| REQ-RPT-006 | Export not permission bypass             | BR-RPT-006      | export permissions | —                 | APPROVED |
| REQ-RPT-007 | Formula-injection protection on CSV/XLSX | DATA-DICTIONARY | —                  | export layer      | APPROVED |

---

# 38. Audit Requirements

| ID          | Requirement                                                 | Rule       | Data         | Verification          | Status           |
| ----------- | ----------------------------------------------------------- | ---------- | ------------ | --------------------- | ---------------- |
| REQ-AUD-001 | Audit separate from application logs                        | BR-AUD-001 | audit_events | Architecture          | APPROVED         |
| REQ-AUD-002 | Audit append-only through normal app path                   | BR-AUD-002 | audit_events | DB/security test      | APPROVED         |
| REQ-AUD-003 | Deletion cannot destroy audit history                       | BR-AUD-003 | audit FKs    | DB test               | APPROVED         |
| REQ-AUD-004 | Actor trusted                                               | BR-AUD-004 | actor_id     | Integration           | APPROVED         |
| REQ-AUD-005 | Timestamp trusted                                           | BR-AUD-005 | occurred_at  | Integration           | APPROVED         |
| REQ-AUD-006 | Audit survives Void/Supersede                               | BR-AUD-006 | audit_events | DB integration        | APPROVED         |
| REQ-AUD-007 | Audit cryptographic integrity mechanism not falsely claimed | BR-AUD-007 | hash fields  | Architecture evidence | POLICY-DEPENDENT |

---

# 39. Files / Evidence Requirements

| ID           | Requirement                                    | Rule            | Data                 | Status           |
| ------------ | ---------------------------------------------- | --------------- | -------------------- | ---------------- |
| REQ-FILE-001 | File metadata separate from business meaning   | BR-FILE-001     | files/evidence_links | APPROVED         |
| REQ-FILE-002 | Server validates file upload                   | BR-FILE-002     | files                | APPROVED         |
| REQ-FILE-003 | SHA-256 stored                                 | BR-FILE-003     | files.sha256         | APPROVED         |
| REQ-FILE-004 | Original filename preserved as metadata        | BR-FILE-004     | files                | APPROVED         |
| REQ-FILE-005 | Controlled evidence cannot be silently removed | BR-FILE-005     | evidence_links       | APPROVED         |
| REQ-FILE-006 | Binary stored outside PostgreSQL by default    | BR-FILE-006     | Object Store         | APPROVED         |
| REQ-FILE-007 | Evidence inherits parent authorization         | BR-FILE-007     | —                    | APPROVED         |
| REQ-FILE-008 | MIME/size/scanning policy explicitly defined   | DATA-DICTIONARY | —                    | POLICY-DEPENDENT |

---

# 40. Notification Requirements

| ID          | Requirement                                          | Rule       | Data            | Status   |
| ----------- | ---------------------------------------------------- | ---------- | --------------- | -------- |
| REQ-NOT-001 | Notification is not authorization                    | BR-NOT-001 | notifications   | APPROVED |
| REQ-NOT-002 | Notifications deduplicated                           | BR-NOT-002 | dedupe_key      | APPROVED |
| REQ-NOT-003 | Notification content minimizes sensitive data        | BR-NOT-003 | notifications   | APPROVED |
| REQ-NOT-004 | Failed delivery does not repeat business mutation    | BR-NOT-005 | outbox/delivery | APPROVED |
| REQ-NOT-005 | Non-critical async delivery uses durable retry model | DATA-MODEL | outbox_events   | APPROVED |

---

# 41. Search Requirements

| ID           | Requirement                       | Rule        | Verification      | Status   |
| ------------ | --------------------------------- | ----------- | ----------------- | -------- |
| REQ-SRCH-001 | Search authorization-aware        | BR-SRCH-001 | IDOR tests        | APPROVED |
| REQ-SRCH-002 | Search read-only                  | BR-SRCH-002 | Architecture test | APPROVED |
| REQ-SRCH-003 | Unauthorized existence not leaked | BR-SRCH-003 | Negative tests    | APPROVED |
| REQ-SRCH-004 | Core IDs/lot/item/doc searchable  | BR-SRCH-004 | E2E               | APPROVED |

---

# 42. Dashboard Requirements

| ID           | Requirement                              | Rule        | Verification       | Status   |
| ------------ | ---------------------------------------- | ----------- | ------------------ | -------- |
| REQ-DASH-001 | Dashboard owns no business record        | BR-DASH-001 | Architecture       | APPROVED |
| REQ-DASH-002 | Dashboard role/scope-aware               | BR-DASH-002 | Permission E2E     | APPROVED |
| REQ-DASH-003 | KPI drills into same dataset             | BR-DASH-003 | Integration/E2E    | APPROVED |
| REQ-DASH-004 | KPI/register counts reconcile            | BR-DASH-004 | Contract test      | APPROVED |
| REQ-DASH-005 | Dashboard actions reuse Domain use cases | BR-DASH-005 | Architecture guard | APPROVED |

---

# 43. Administration Requirements

| ID          | Requirement                            | Rule        | Permission              | Status           |
| ----------- | -------------------------------------- | ----------- | ----------------------- | ---------------- |
| REQ-ADM-001 | Admin features privileged              | BR-ADM-001  | PERM-ADM-*              | APPROVED         |
| REQ-ADM-002 | Admin mutations audited                | BR-ADM-002  | PERM-ADM-*              | APPROVED         |
| REQ-ADM-003 | Admin correction controlled            | BR-ADM-003  | —                       | APPROVED         |
| REQ-ADM-004 | Admin cannot rewrite history           | BR-AUTH-004 | —                       | APPROVED         |
| REQ-ADM-005 | Reference-data control policy explicit | BR-ADM-004  | PERM-ADM-REFERENCE-DATA | POLICY-DEPENDENT |

---

# 44. System Health Requirements

| ID           | Requirement                                             | Requirement       | Status   |
| ------------ | ------------------------------------------------------- | ----------------- | -------- |
| REQ-HLTH-001 | `/health` indicates process/service health              | Technical         | APPROVED |
| REQ-HLTH-002 | `/readiness` represents dependency readiness separately | Constitution      | APPROVED |
| REQ-HLTH-003 | Health ≠ release readiness                              | Invariants        | APPROVED |
| REQ-HLTH-004 | Detailed health protected by admin permissions          | PERMISSION-MATRIX | APPROVED |
| REQ-HLTH-005 | PostgreSQL dependency included in readiness             | Architecture      | APPROVED |

---

# 45. Backup & Recovery Requirements

| ID          | Requirement                                      | Rule              | Permission                  | Data           | Status           |
| ----------- | ------------------------------------------------ | ----------------- | --------------------------- | -------------- | ---------------- |
| REQ-BKP-001 | Backup Created ≠ Verified                        | BR-BKP-001        | —                           | backup_runs    | APPROVED         |
| REQ-BKP-002 | Verified ≠ Restore Proven                        | BR-BKP-002        | —                           | backup/restore | APPROVED         |
| REQ-BKP-003 | Verification generates integrity evidence        | BR-BKP-003        | PERM-BKP-VERIFY             | backup_runs    | APPROVED         |
| REQ-BKP-004 | Restore must actually be tested                  | BR-BKP-004        | PERM-BKP-RESTORE-DRILL      | restore_runs   | APPROVED         |
| REQ-BKP-005 | Backup protected                                 | BR-BKP-005        | —                           | storage        | APPROVED         |
| REQ-BKP-006 | RPO explicitly approved                          | BR-BKP-006        | —                           | —              | POLICY-DEPENDENT |
| REQ-BKP-007 | RTO explicitly approved                          | BR-BKP-007        | —                           | —              | POLICY-DEPENDENT |
| REQ-BKP-008 | Production restore authority explicitly approved | PERMISSION-MATRIX | PERM-BKP-RESTORE-PRODUCTION | restore_runs   | POLICY-DEPENDENT |

---

# 46. AI Advisory Requirements

| ID         | Requirement                                   | Rule            | Verification          | Status           |
| ---------- | --------------------------------------------- | --------------- | --------------------- | ---------------- |
| REQ-AI-001 | Core QC system works without AI               | BR-AI-001       | Failure-mode E2E      | APPROVED         |
| REQ-AI-002 | AI advisory only                              | BR-AI-002       | Architecture          | APPROVED         |
| REQ-AI-003 | AI cannot approve/reject/release/sign         | BR-AI-003..006  | Negative tests        | APPROVED         |
| REQ-AI-004 | AI cannot set official PASS/FAIL              | BR-AI-007       | Negative test         | APPROVED         |
| REQ-AI-005 | AI cannot mutate controlled data autonomously | BR-AI-008       | Architecture/negative | APPROVED         |
| REQ-AI-006 | AI receives only authorized context           | BR-AI-009       | Security tests        | APPROVED         |
| REQ-AI-007 | Structured AI output schema validated         | BR-AI-010       | Contract test         | APPROVED         |
| REQ-AI-008 | AI output visibly advisory                    | BR-AI-011       | UX test               | APPROVED         |
| REQ-AI-009 | Relevant AI invocation metadata auditable     | BR-AI-012       | Integration           | APPROVED         |
| REQ-AI-010 | Prompt/output retention policy explicit       | DATA-DICTIONARY | —                     | POLICY-DEPENDENT |

---

# 47. PostgreSQL / Data Integrity Requirements

| ID           | Requirement                                                    | Source            | Verification              | Status           |
| ------------ | -------------------------------------------------------------- | ----------------- | ------------------------- | ---------------- |
| REQ-DATA-001 | Technical primary IDs use UUID                                 | DATA-MODEL        | Schema test               | APPROVED         |
| REQ-DATA-002 | Human Business IDs separate from PK                            | DATA-MODEL        | Schema test               | APPROVED         |
| REQ-DATA-003 | Event timestamps use TIMESTAMPTZ                               | DATA-DICTIONARY   | Schema test               | APPROVED         |
| REQ-DATA-004 | Pure dates use DATE where appropriate                          | DATA-DICTIONARY   | Schema test               | APPROVED         |
| REQ-DATA-005 | Controlled mutable records have version                        | DATA-MODEL        | Schema + concurrency test | APPROVED         |
| REQ-DATA-006 | Core FK relationships enforced                                 | DATA-MODEL        | Schema test               | APPROVED         |
| REQ-DATA-007 | Controlled history avoids destructive cascade                  | DATA-MODEL        | DB negative test          | APPROVED         |
| REQ-DATA-008 | Current business truth normalized                              | DATA-MODEL        | Architecture review       | APPROVED         |
| REQ-DATA-009 | Historical controlled context snapshotted                      | DATA-MODEL        | Integration               | APPROVED         |
| REQ-DATA-010 | JSONB not used as generic replacement for relational model     | DATA-MODEL        | Architecture review       | APPROVED         |
| REQ-DATA-011 | Scientific NUMERIC precision comes from controlled requirement | DATA-DICTIONARY   | Source verification       | SOURCE-DEPENDENT |
| REQ-DATA-012 | Historical migrations immutable                                | SYSTEM-INVARIANTS | CI checksum test          | APPROVED         |

---

# 48. Transaction Requirements

| ID           | Requirement                               | Governing Rule | Verification                 |
| ------------ | ----------------------------------------- | -------------- | ---------------------------- |
| REQ-DATA-020 | Critical operations transactional         | BR-GEN-009     | Integration rollback tests   |
| REQ-DATA-021 | Critical commands idempotent              | BR-GEN-010     | Retry tests                  |
| REQ-DATA-022 | Concurrent edits never silently overwrite | BR-GEN-011     | Concurrency tests            |
| REQ-DATA-023 | Inspection approval consequences atomic   | BR-INSP-014    | Integration transaction test |
| REQ-DATA-024 | Change application atomic                 | BR-CHG-007     | Rollback test                |
| REQ-DATA-025 | Document supersession atomic              | DATA-MODEL     | Integration                  |
| REQ-DATA-026 | Calibration supersession atomic           | DATA-MODEL     | Integration                  |

All:

```text
Status = APPROVED
```

---

# 49. Security Requirements

| ID          | Requirement                                        | Verification         | Status   |
| ----------- | -------------------------------------------------- | -------------------- | -------- |
| REQ-SEC-001 | No client-authoritative actor ID                   | Security test        | APPROVED |
| REQ-SEC-002 | No client-authoritative permission/scope           | Security test        | APPROVED |
| REQ-SEC-003 | No client-authoritative final state                | Mutation tests       | APPROVED |
| REQ-SEC-004 | Session secrets not stored plaintext               | Security inspection  | APPROVED |
| REQ-SEC-005 | Passwords stored as approved hashes only           | Security test        | APPROVED |
| REQ-SEC-006 | Secrets not committed to Git                       | Secret scanning      | APPROVED |
| REQ-SEC-007 | IDOR behavior does not leak unauthorized records   | Negative integration | APPROVED |
| REQ-SEC-008 | Evidence file URLs do not bypass authorization     | Security E2E         | APPROVED |
| REQ-SEC-009 | Report exports do not bypass scope                 | Security E2E         | APPROVED |
| REQ-SEC-010 | Astro server actions use server-side authorization | Action integration   | APPROVED |

---

# 50. UX Requirements

| ID         | Requirement                                   | Source        | Verification    | Status   |
| ---------- | --------------------------------------------- | ------------- | --------------- | -------- |
| REQ-UX-001 | Dashboard asks "What needs my attention?"     | Constitution  | UX review       | APPROVED |
| REQ-UX-002 | Role-based operational UX                     | ROLE-MATRIX   | E2E/UX          | APPROVED |
| REQ-UX-003 | Data-heavy registers use tables/data grids    | Constitution  | UX review       | APPROVED |
| REQ-UX-004 | Forms follow logical tab order                | Constitution  | A11y test       | APPROVED |
| REQ-UX-005 | Inline validation + error summary             | Constitution  | Form tests      | APPROVED |
| REQ-UX-006 | First invalid field receives useful focus     | Constitution  | A11y E2E        | APPROVED |
| REQ-UX-007 | Unsaved changes protected                     | Constitution  | E2E             | APPROVED |
| REQ-UX-008 | Double-submit prevented                       | Constitution  | E2E             | APPROVED |
| REQ-UX-009 | Units displayed clearly for scientific fields | Business/Data | UX tests        | APPROVED |
| REQ-UX-010 | Desktop operational workflows prioritized     | Constitution  | Responsive test | APPROVED |
| REQ-UX-011 | Tablet/mobile remain usable adaptively        | Constitution  | Responsive test | APPROVED |

---

# 51. Accessibility Requirements

كل production-facing UI يدعم على الأقل:

```text
Keyboard operation
Visible focus
Semantic structure
Programmatic labels
Screen reader compatibility
200% zoom
Contrast
Error identification
No color-only communication
Accessible target sizes
Responsive layouts
```

Requirement namespace:

```text
REQ-A11Y-001 .. REQ-A11Y-010
```

هذه تعتبر:

```text
APPROVED
```

ويجب ربطها لاحقًا بالـA11y automated/manual test suite.

---

# 52. Astro Accessibility Principle

Astro rendering لا يعفي Client Islands من Accessibility.

أي interactive component يتم تنفيذه بإطار Client UI مثل React/Svelte/Vue أو Vanilla JS:

> يخضع لنفس A11y requirements.

---

# 53. Route Requirements

كل navigation item يجب أن يملك:

```text
Canonical Route ID
Actual Astro route
Required permission
Expected navigation role
Automated route verification
```

---

# 54. Route Manifest

يجب إنشاء machine-readable Route Manifest لاحقًا.

مثال conceptually:

```text
ROUTE-DASHBOARD
→ /dashboard

ROUTE-TASKS
→ /tasks

ROUTE-QUALITY-NCR
→ /quality/ncr

ROUTE-QUARANTINE-RECEIVING
→ /quarantine/receiving

ROUTE-LAB
→ /laboratory

ROUTE-EQUIPMENT
→ /equipment

ROUTE-DOCUMENTS
→ /documents
```

لا تعتمد هذه الأمثلة كـfinal URL contract قبل Route Architecture phase.

---

# 55. Broken Navigation Requirement

```text
Visible Navigation Target
+
No Matching Astro Route
=
CI FAILURE
```

بعد اعتماد Route Manifest.

---

# 56. Testing Requirements

| ID          | Requirement                                  | Verification        |
| ----------- | -------------------------------------------- | ------------------- |
| REQ-TST-001 | Domain rules have unit tests                 | Test manifest       |
| REQ-TST-002 | PostgreSQL behavior has integration tests    | DB suite            |
| REQ-TST-003 | Permissions include positive tests           | Authorization suite |
| REQ-TST-004 | Permissions include negative tests           | Authorization suite |
| REQ-TST-005 | Critical transitions test wrong-state cases  | State tests         |
| REQ-TST-006 | Critical transitions test stale version      | Concurrency suite   |
| REQ-TST-007 | Critical transitions test idempotency        | Retry suite         |
| REQ-TST-008 | Critical transactions test rollback          | Integration suite   |
| REQ-TST-009 | Important user workflows have E2E            | Browser suite       |
| REQ-TST-010 | Accessibility has automated/manual evidence  | A11y suite          |
| REQ-TST-011 | Every registered test is actually executed   | Test manifest       |
| REQ-TST-012 | Every registered route is actually present   | Route manifest      |
| REQ-TST-013 | Fresh PostgreSQL migration tested            | Migration CI        |
| REQ-TST-014 | Upgrade migration tested                     | Migration CI        |
| REQ-TST-015 | Architecture boundaries automatically tested | Architecture guard  |

All are:

```text
APPROVED
```

---

# 57. Astro Testing Requirements

Astro-specific verification must include:

```text
Protected server-rendered route behavior
Middleware session resolution
Astro Action authorization
Astro Action input validation
Action error mapping
Unauthorized direct action invocation
CSRF/security behavior according to chosen architecture
Client island hydration behavior
Server-only module leakage prevention
Production build
Production server start
```

---

# 58. CI Gate

Production-oriented CI eventually requires:

```text
Lint
Type Check
Unit Tests
Integration Tests
Database Tests
Permission Tests
Negative Tests
Migration Verification
Architecture Guards
Route Manifest
Test Manifest
Security Checks
Secret Scan
Dependency Checks
Production Astro Build
E2E
```

---

# 59. CI Evidence Rule

CI badge alone is not enough.

Release evidence records:

```text
Commit SHA
Workflow Run
Jobs
Commands
Results
Failures/Skipped Tests
Environment
```

---

# 60. Test Skipping Rule

A required test that is:

```text
.skip
todo
disabled
quarantined
not discovered
```

does not count as PASS.

---

# 61. Negative Testing Priority

High-risk requirements require explicit negative verification.

Examples:

```text
Approval without permission
Approval wrong scope
Self approval
Stale version
Wrong state
Release during HOLD
Release after FAIL
Void without permission
Production restore without permission
Direct URL access
Direct Astro Action invocation
Unauthorized export
Unauthorized file download
```

---

# 62. Requirement Verification Levels

Use:

```text
L0 — Documented only
L1 — Implemented
L2 — Unit verified
L3 — Integration verified
L4 — Negative/security verified
L5 — E2E verified
L6 — Current environment evidence
```

Not every Requirement needs L5.

لكن High-Risk requirement غالبًا تحتاج عدة مستويات.

---

# 63. PASS Rule

Requirement يمكن أن تحصل:

```text
PASS
```

فقط عندما:

```text
Requirement defined
+
Implementation exists
+
Required tests exist
+
Required tests executed
+
Tests pass
+
Negative cases pass where applicable
+
Current evidence exists
+
No unresolved blocking policy/source decision
```

---

# 64. PARTIAL Rule

```text
PARTIAL
```

تستخدم إذا:

* implementation جزئي.
* بعض tests مفقودة.
* بعض scenarios غير verified.
* evidence ناقصة.
* downstream requirement غير مكتملة.

ويجب ذكر gap صراحة.

---

# 65. FAIL Rule

```text
FAIL
```

إذا implementation الحالية تخالف Requirement.

---

# 66. BLOCKED Rule

```text
BLOCKED
```

إذا التنفيذ الصحيح لا يمكن إكماله بسبب:

```text
Missing company decision
Missing scientific source
Missing role policy
Missing release policy
Missing Retest policy
Missing RPO/RTO
Missing controlled document decision
```

BLOCKED ليست FAIL إذا السبب requirement غير محسومة.

---

# 67. UNVERIFIED Rule

وجود code بدون proof:

```text
UNVERIFIED
```

وليس PASS.

---

# 68. High-Risk Requirements

High Risk تشمل:

```text
Authorization
Approval
E-Signature
Release
PASS/FAIL
Void
Controlled Correction
NCR/CAPA Closure
Retest
Document Approval
Permission Administration
Audit Integrity
Backup
Production Restore
Scientific Calculations
Controlled Files
```

---

# 69. High-Risk Verification

كل High-Risk Requirement يجب على الأقل أن تملك:

```text
Positive scenario
Unauthorized scenario
Wrong-state scenario
Wrong-scope scenario where relevant
Concurrency scenario
Idempotency scenario where relevant
Audit verification
```

---

# 70. Current Policy-Blocking Requirements

أهم requirements التي لا يجوز لـCodex حسمها:

```text
Release authority
Release E-Signature
Inspection final approver
Lab final approver
Retest count
Retest authority
Calibration overdue equipment behavior
NCR closure authority
CAPA closure authority
Document final approver
Document effective-date policy
Void authority by Domain
Production restore authority
RPO
RTO
Scientific acceptance criteria
Sampling rules
Scientific precision / rounding
```

---

# 71. Policy-Dependent Runtime Rule

حتى اعتمادها:

```text
Sensitive Undefined Permission
=
DENY
```

وليس:

```text
Manager probably can
Admin probably can
Supervisor probably can
```

---

# 72. Source-Dependent Requirement Rule

إذا Requirement تعتمد على WI/SOP/Specification:

لا يجوز تنفيذ Scientific default.

مثال:

```text
REQ-LAB-020
PASS/FAIL uses controlled criteria
```

إذا لا يوجد criterion approved:

```text
BLOCKED — SOURCE REQUIRED
```

---

# 73. Requirement-to-Code Contract

يفضل إضافة Requirement IDs بالقرب من Use Cases/tests المهمة.

مثال:

```text
ApproveInspectionReport

Requirements:
REQ-INSP-012
REQ-INSP-013
REQ-AUTH-006
REQ-AUTH-007
REQ-DATA-020
REQ-DATA-021
```

بدون تحويل الكود إلى documentation noise.

---

# 74. Requirement-to-Test Contract

مثال:

```text
REQ-INSP-012
        ↓
TEST-INSP-APPROVE-VALID-001
TEST-INSP-APPROVE-STALE-002
TEST-INSP-APPROVE-SOD-003
TEST-INSP-APPROVE-SCOPE-004
```

---

# 75. Requirement-to-Evidence Contract

مثال:

```text
REQ-INSP-012
        ↓
Tests
        ↓
CI Run
        ↓
Commit SHA
        ↓
EVID-INSP-012
```

---

# 76. Requirement Coverage Metrics

عندما يبدأ implementation يمكن حساب:

### Requirement Mapping Coverage

```text
Mapped Approved Requirements
÷
Total Approved Requirements
× 100
```

### Verification Coverage

```text
Verified Applicable Requirements
÷
Implemented Applicable Requirements
× 100
```

### Evidence Coverage

```text
Requirements with Current Evidence
÷
Requirements claimed Verified
× 100
```

### High-Risk Negative Coverage

```text
High-Risk Requirements with Required Negative Tests
÷
Total Implemented High-Risk Requirements
× 100
```

---

# 77. Percentage Integrity Rule

لا يتم عرض:

```text
92%
98%
100%
```

بناءً على impression.

أي percentage يجب أن يحتوي:

```text
Numerator
Denominator
Scope
Date
Commit SHA
Evidence source
```

---

# 78. No Artificial 100%

حتى إذا كل tests الموجودة Pass:

هذا لا يساوي:

```text
100% requirements coverage
```

إذا بعض requirements لم يكن لها tests أصلًا.

---

# 79. Traceability Gap Types

Canonical gaps:

```text
GAP-NO-RULE
GAP-NO-PERMISSION
GAP-NO-STATE
GAP-NO-DATA
GAP-NO-IMPLEMENTATION
GAP-NO-TEST
GAP-NO-NEGATIVE-TEST
GAP-NO-E2E
GAP-NO-EVIDENCE
GAP-POLICY-UNCONFIRMED
GAP-SOURCE-MISSING
GAP-EVIDENCE-STALE
```

---

# 80. Claims vs Reality

كل Audit لاحق يجب أن يستطيع مقارنة:

```text
Claim
vs
Current Reality
```

مثال:

```text
Claim:
"Inspection approval is complete."

Check:
Route exists?
Action exists?
Permission enforced?
State enforced?
SoD enforced?
Version enforced?
Transaction atomic?
Audit written?
Snapshot frozen?
Tests executed?
Negative tests?
E2E?
Current evidence?
```

---

# 81. Definition of Done Traceability

Feature لا تعتبر Done إلا إذا غطت:

```text
Requirement
Business Rules
Authorization
State Machine
Validation
Database
Transactions
Concurrency
Idempotency
Audit
Notifications where needed
Errors
UI
Accessibility
Responsive behavior
Unit Tests
Integration Tests
Negative Tests
E2E where needed
Documentation
Current Evidence
```

---

# 82. Foundation Build Phases

Traceability should follow build phases:

```text
00 Foundation Requirements
01 Architecture / Astro / PostgreSQL
02 Authentication
03 Authorization
04 Audit / Integrity
05 Design System
06 Tasks
07 Quality
08 Quarantine
09 Laboratory
10 Equipment
11 Documents
12 Approvals / E-Signatures
13 Change Requests
14 Notifications / Search
15 Reports
16 Administration
17 System Health
18 Backup / Recovery
19 Performance / Security / Accessibility
20 AI Advisory
21 AI Evaluations
22 Pilot / UAT
23 Production Readiness
```

---

# 83. Foundation Documents Are Not Runtime Evidence

وجود:

```text
BUSINESS-RULES.md
PERMISSION-MATRIX.md
STATE-MACHINES.md
DATA-MODEL.md
```

يثبت أن Requirement موثقة.

لا يثبت أنها implemented.

---

# 84. UAT Requirements

قبل Pilot يجب إنشاء requirements مثل:

```text
REQ-UAT-001 Receiving workflow accepted by actual users
REQ-UAT-002 Inspection workflow accepted
REQ-UAT-003 Laboratory workflow accepted
REQ-UAT-004 Review/Approval workflow accepted
REQ-UAT-005 Reports reconcile with expected operational records
```

Evidence يجب أن يكون منفصلًا عن automated tests.

---

# 85. Production Readiness Requirements

Production Readiness لا تعني فقط:

```text
npm/pnpm build passes
```

بل تشمل:

```text
Applicable requirements verified
No unresolved critical FAIL
No unresolved high-risk authorization gap
Migration verification
Backup verified
Restore proven
Security controls verified
Observability available
Critical E2E pass
Pilot/UAT disposition known
Known limitations documented
Rollback/recovery process documented
```

---

# 86. Astro Production Readiness

Astro-specific production evidence يجب أن يثبت:

```text
Production build succeeds
Server bundle starts
Protected routes work server-side
Sessions work in deployed architecture
Middleware works in production runtime
Astro Actions execute server-side
Unauthorized Action invocation denied
PostgreSQL connectivity works
Health/readiness behavior works
No server-only secrets included in client bundles
Client islands hydrate correctly
```

---

# 87. Technology Change Control

إذا تغير Framework مستقبلًا من Astro:

هذا يعتبر:

```text
ARCHITECTURE CHANGE
```

ويحتاج impact review على:

```text
REQ-ARCH-*
Authentication
Sessions
Authorization delivery
Middleware
Actions/API
Deployment
Build
E2E
Security
Observability
```

لكن Business Rules وDomain ownership لا يجب أن تعتمد على Framework.

---

# 88. Framework Independence Requirement

رغم أن Astro هو Framework الرسمي:

```text
Domain
Application
Business Rules
Authorization Policies
Data Model
```

يجب ألا تعتمد على Astro APIs مباشرة إلا عبر Delivery/Infrastructure boundary المناسب.

الهدف:

```text
Astro owns delivery.
Domain owns business truth.
```

---

# 89. PostgreSQL Independence Requirement

Astro Components لا تعرف تفاصيل PostgreSQL.

Repositories/Infrastructure تتعامل مع DB.

Use Cases تتعامل مع abstractions/domain contracts.

---

# 90. Final Traceability Principle

لكل Feature نسأل:

```text
What requirement authorizes its existence?

Which Business Rule controls it?

Which Permission controls the actor?

Which State Transition controls lifecycle?

Which Domain owns the data?

Which fields store the truth?

Which transaction protects it?

Which audit event proves it?

Which tests prove positive behavior?

Which tests prove forbidden behavior?

Which E2E proves the workflow?

Which current evidence proves PASS?
```

إذا أي رابط مفقود:

```text
TRACEABILITY GAP
```

---

# 91. Requirement Readiness Rule

Requirement جاهزة للتنفيذ فقط إذا:

```text
Statement is clear
Owner Domain known
Business Rules known
Permission model known
State model known
Data model known
Unconfirmed policy identified
Scientific source identified where needed
Expected verification known
```

---

# 92. Implementation Readiness Rule

Implementation جاهزة للتحقق فقط إذا:

```text
Code exists
Migrations exist where needed
Authorization exists
Validation exists
Tests exist
Negative tests exist where needed
Build succeeds
```

---

# 93. Verification Readiness Rule

Verification جاهزة لـPASS فقط إذا:

```text
Required tests executed
Current commit identified
No required test skipped
Results captured
Evidence current
Known limitations documented
```

---

# 94. Current Foundation Status

هذه الوثيقة تحدد:

```text
WHAT must be implemented
HOW it maps to governance
HOW it will be verified
```

لكنها لا تدعي أن Runtime implementation موجودة أو مكتملة.

أي Implementation Status يجب تقييمها لاحقًا من Current Repository Reality.

---

# 95. Mandatory Requirement Registry

عند بدء التنفيذ، يجب إنشاء machine-readable registry أو equivalent يمكن منه استخراج:

```text
Requirement ID
Status
Domain
Tests
Evidence
Implementation reference
```

حتى لا تصبح هذه الوثيقة Markdown منفصلة عن الواقع.

---

# 96. CI Traceability Guard

مستقبلاً يجب أن يستطيع CI اكتشاف:

```text
Unknown Requirement ID
Duplicate Requirement ID
Test references nonexistent Requirement
Controlled Requirement with no verification mapping
Permission not registered
State transition not registered
Route missing
Test missing from manifest
```

---

# 97. Requirement Deprecation

Requirement لا يحذف بصمت إذا بدأ استخدامها.

استخدم:

```text
Status:
REMOVED

Reason:
...

Replacement:
REQ-XXX-YYY

Decision Date:
...
```

للحفاظ على history.

---

# 98. Requirement Versioning

Requirement ID لا يعاد استخدامه لمعنى مختلف.

إذا تغير المعنى جذريًا:

```text
Deprecate old requirement
Create new requirement ID
```

---

# 99. Unconfirmed Decision Integration

كل Decision IDs الموجودة في الوثائق السابقة:

```text
BD-*
RD-*
SD-*
DM-*
DD-*
```

يجب ربطها بالـRequirements المتأثرة.

إذا Decision غير محسومة:

```text
Requirement Status:
POLICY-DEPENDENT
or
SOURCE-DEPENDENT
```

---

# 100. Final Evidence Rule

> **Evidence before assertion.**

ولا يقبل:

```text
Codex says it fixed it.
Developer says it works.
Previous report says PASS.
UI looks correct.
The file exists.
Tests exist.
Build succeeded once.
```

كبديل عن Current Requirement-specific evidence.

---

# 101. Foundation Relationship

```text
Documents/QC-SYSTEM-DESIGN-CONSTITUTION.md
        ↓
Documents/SYSTEM-INVARIANTS.md
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
Architecture / Security / Testing Specifications
        ↓
Implementation
        ↓
Verification Evidence
```

---

# 102. Document Status

```text
Document:
Documents/REQUIREMENTS-TRACEABILITY.md

Version:
1.0

Product:
QC Operations & Laboratory Management System

Web Framework:
Astro

Rendering:
Server / On-demand

Architecture:
Modular Monolith

Database:
PostgreSQL

Authorization:
Centralized Server-Side

Traceability:
Requirement
→ Business Rule
→ Permission
→ State
→ Data
→ Implementation
→ Test
→ Evidence

Unknown Policy:
BLOCKED / DENY where safety requires

Scientific Unknown:
SOURCE REQUIRED — DO NOT INVENT

PASS:
Current Evidence Required

Percentages:
Evidence-Based Only

Status:
FOUNDATION — APPROVED REQUIREMENTS TRACEABILITY MODEL
```
