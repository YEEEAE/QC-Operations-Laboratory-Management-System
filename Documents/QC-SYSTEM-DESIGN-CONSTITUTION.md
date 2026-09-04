# QC SYSTEM DESIGN CONSTITUTION

## PostgreSQL-First Architecture Blueprint — v1.0


---

# 1. تعريف المنتج


التعريف الرسمي :

> **QC Operations & Laboratory Management System**

وهو نظام داخلي لإدارة عمليات الجودة، الاستلام والفحص، المختبر، المعدات والمعايرة، المستندات المضبوطة، المراجعات والاعتمادات، التقارير، المهام، التتبع، والاستمرارية التشغيلية.

الـTasks جزء من المنتج وليست المنتج كله.

---

# 2. المجالات الرئيسية النهائية

```text
Dashboard

Tasks

Quality
├── Findings
├── NCR
├── RCA
└── CAPA

Quarantine
├── Quarantine Dashboard
├── Receiving Items
├── Inspection Reports
└── Quarantine Administration — Admin Only

Laboratory Testing

Equipment / Calibration

WI / SOP / Controlled Documents

Reviews / Approvals / E-Signatures

Change Requests

Reports

Administration — Admin Only

System Health / Backup / Recovery — Admin Only

AI Advisory
```

أما الخدمات المشتركة مثل:

```text
Notifications
My Approvals
Search
Audit Timeline
Account
Attachments
```

فهي capabilities مشتركة وليست Domains رئيسية مستقلة.

---

# 3. الـNavigation النهائي

للمستخدم التشغيلي:

```text
Dashboard
Tasks
Quality
Quarantine
Laboratory
Equipment
Documents
Reports
```

حسب صلاحياته.

ويكون:

```text
My Approvals
Notifications
Account
Sign Out
```

في User Menu أو Action Center.

للـAdmin فقط:

```text
Administration
System Health
```

ولا تظهر أصلًا لغير Admin.

لكن إخفاء الصفحة من الواجهة **ليس حماية**؛ السيرفر يمنع الوصول أيضًا.

---

# 4. الفلسفة الأساسية للنظام

القاعدة الرئيسية:

> Business Rules First. Code Second. UI Third.

قبل إنشاء الصفحات نثبت:

```text
SYSTEM-INVARIANTS.md
BUSINESS-RULES.md
DOMAIN-MAP.md
ROLE-MATRIX.md
PERMISSION-MATRIX.md
STATE-MACHINES.md
DATA-DICTIONARY.md
REQUIREMENTS-TRACEABILITY.md
RISK-REGISTER.md
```

الكود يخدم قواعد الجودة.

قواعد الجودة لا تتشكل حول الكود.

---

# 5. System Invariants

هذه تصبح قوانين عليا للمشروع.

```text
01. UI visibility is never authorization.

02. Authorization is always enforced server-side.

03. No user may review/approve a controlled record when prohibited
    by the approved separation-of-duties policy.

04. Approved controlled records cannot be silently edited.

05. VOID does not destroy history.

06. SUPERSEDED does not destroy history.

07. Every important mutation must have:
    Actor
    Timestamp
    Entity
    Action
    Reason where required
    Audit reference

08. Scientific acceptance limits must originate from approved
    controlled sources.

09. AI cannot approve, reject, release, PASS or FAIL records.

10. Historical database migrations are immutable.

11. Reports obey the same authorization scope as the application.

12. Backups are not considered proven until restore is verified.

13. Master-data changes cannot retroactively rewrite historical records.

14. Draft, Submitted and Approved records have different integrity rules.

15. Admin privileges do not grant the right to rewrite historical facts.

16. Critical operations must be transactional.

17. Critical actions must be idempotent where applicable.

18. Concurrent edits must never silently overwrite one another.

19. All routes, tests and controlled workflows must be machine-verifiable.

20. No release-readiness claim is valid without evidence.
```

---

# 6. المعمارية العليا

أعتمد:

# Modular Monolith

وليس Microservices.

يعني:

```text
One application
One PostgreSQL database
Clear internal domain boundaries
Shared security and infrastructure
Independent domain modules
```

هذا يعطينا قوة Enterprise بدون تعقيد Microservices.

---

# 7. PostgreSQL من البداية

قاعدة البيانات الرسمية:

> **PostgreSQL**

وليس SQLite.

الأسباب:

* Concurrent users أفضل.
* Transactions قوية.
* Row locking.
* Referential integrity.
* Indexing أفضل للتوسع.
* Reporting أقوى.
* JSONB عند الحاجة.
* Full-text/search options.
* Connection pooling.
* أفضل مستقبلًا للتكامل.
* أسهل للتوسع لأكثر من قسم أو موقع.
* مناسب أكثر لنظام طويل العمر داخل الشركة.

---

# 8. Database Principles

قاعدة البيانات نفسها تشارك في حماية النظام.

نستخدم:

```text
Primary Keys
Foreign Keys
NOT NULL
CHECK constraints
UNIQUE constraints
Indexes
Transactions
Version columns
Created/Updated metadata
Explicit timestamps
```

ولا نعتمد على الـUI لمنع البيانات الخاطئة.

---

# 9. PostgreSQL IDs

أفضل من البداية استخدام:

```text
UUID
```

أو:

```text
UUID/ULID-style identifiers
```

للسجلات المهمة بدل IDs المتسلسلة المكشوفة.

يمكن الاحتفاظ برقم Business-friendly منفصل مثل:

```text
Receiving:
RCV-2026-000124

Inspection:
IR-2026-000088

Lab Test:
LAB-2026-001294

NCR:
NCR-2026-0031
```

الـUUID للهوية التقنية.

الرقم المقروء للإنسان.

---

# 10. Timestamps

قاعدة مهمة جدًا:

في PostgreSQL نخزن الأوقات:

```text
TIMESTAMPTZ
```

ونتعامل داخليًا مع UTC.

لكن العرض للمستخدم حسب منطقة الشركة، مثل السعودية:

```text
Asia/Riyadh
```

ولا نخزن تاريخ كنصوص عشوائية.

---

# 11. Audit timestamps

Audit trail يستخدم توقيت Server/Database trusted time.

وليس قيمة Timestamp يرسلها Browser.

---

# 12. الهيكل البرمجي

المشروع لا يُقسم حسب الصفحات فقط.

مثال:

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

# 13. داخل كل Domain

مثل Quarantine:

```text
quarantine/

  domain/
  application/
  infrastructure/
  ui/
  tests/
```

### Domain

يعرف القواعد.

### Application

يعرف Use Cases.

### Infrastructure

يعرف PostgreSQL/storage وغيرها.

### UI

يعرض ويتفاعل.

### Tests

يثبت السلوك.

---

# 14. المسار الصحيح لأي عملية

## التثبيت التقني

> **Astro هو الـWeb Framework الرسمي للنظام.**

- البناء الافتراضي للتطبيق هو **server output** مع **server rendering / on-demand rendering** باستخدام **Node adapter**.
- Static-only Astro لا يناسب هذا النظام لأنه يعتمد على Authentication وserver-side authorization وPostgreSQL وcontrolled mutations.
- Node adapter يدعم on-demand rendering وAstro Actions وSessions.

## المسار

```text
Astro Page / UI Component / Client Island
 ↓
Astro Action / API Endpoint
 ↓
Application Use Case
 ↓
Authorization
 ↓
Domain Rules
 ↓
Transaction
 ↓
Repository
 ↓
PostgreSQL
 ↓
Audit / Notifications
```

ممنوع:

```text
Astro Component / UI Component / Client Island → Database
```

وممنوع:

```text
Page → SQL
```

وممنوع وضع قواعد العمل داخل زر.

---

# 15. Dashboard الرئيسي

ليس Dashboard رسوميًا فقط.

السؤال الأول:

> What needs my attention right now?

يعرض حسب دور المستخدم.

### Employee

```text
My Tasks
Pending Inspections
Returned Reports
Draft Lab Tests
Documents requiring action
Upcoming work
```

### Supervisor

```text
Needs Review
Pending Inspection Reports
Team Exceptions
HOLD / FAIL items
Returned Work
Document Reviews
```

### Manager

```text
Pending Approvals
Critical Findings
Quarantine Exceptions
CAPA status
Calibration Risk
Change Requests
Management Reports
```

### Admin

```text
Users
System Alerts
Database Health
Backups
Security
Configuration
Failed system operations
```

كل Role له تجربة مختلفة.

---

# 16. Tasks

الاسم الرسمي:

> **Tasks**

وتدعم:

```text
Create
Assign
Reassign
Priority
Due Date
Status
Checklist
Comments
Evidence
Dependencies
Blockers
Recurrence when required
Completion
Reopen according to policy
Audit Timeline
```

ولا تصبح Tasks بديلًا عن Workflows المتخصصة.

مثلًا Inspection Report ليس Task.

لكن يمكن أن ينشأ Task متعلق به.

---

# 17. Quality Domain

يحتوي:

```text
Findings
NCR
RCA
CAPA
```

العلاقات الممكنة:

```text
Receiving Item
     ↓
Inspection Report
     ↓
Failure / Rejection
     ↓
Finding
     ↓
NCR
     ↓
RCA
     ↓
CAPA
```

وكذلك Lab Test يستطيع إنشاء Finding/NCR عند الحاجة.

---

# 18. Quarantine Domain

هذا Domain رئيسي مستقل.

يتكون من:

```text
Quarantine Dashboard
Receiving Items
Inspection Reports
Quarantine Administration
```

---

# 19. Quarantine Dashboard

يعرض مثلًا:

```text
Received Today
Pending
Under Inspection
Released
Expired
Awaiting Inspection
Awaiting Report
Awaiting Review
Awaiting Approval
System Release Pending
Rejected/Hold items
```

وأي KPI قابل للضغط.

مثال:

```text
Pending Inspection: 17
```

الضغط عليه يفتح Receiving Items مع نفس الفلتر.

---

# 20. Receiving Items

هو سجل رسمي وليس مجرد Cards.

الـDashboard قد يستخدم Cards.

لكن الصفحة الأساسية تكون:

> Receiving Register

وتستخدم Table/Data Grid.

---

# 21. Receiving Item fields

المعلومات التي حددتها تصبح الأساس:

```text
Doc No
Item Code
Description
Lot
Qty
Date
Exp Date
Status Inspection
Release System (Yes / No)
```

ويضيف النظام Metadata تلقائيًا:

```text
Receiving ID
Created By
Created At
Updated By
Updated At
Record Version
Linked Inspection Report
Audit Timeline
Attachments
```

---

# 22. نفصل Status عن Release System

مهم جدًا.

لا نخزن كل شيء في Status واحد.

مثال:

```text
Inspection Status:
PASSED

Release System:
NO
```

هذه حالة صحيحة.

لأن الفحص اكتمل ولكن الـRelease على النظام لم يتم بعد.

---

# 23. Receiving Lifecycle

الحالة التشغيلية العامة يمكن أن تعكس:

```text
PENDING
INSPECTION
RELEASED
EXPIRED
```

وهي الحالات الأساسية التي طلبتها.

أما نتيجة الفحص نفسها فمستقلة ويمكن أن تكون:

```text
NOT_STARTED
IN_PROGRESS
PASS
FAIL
HOLD
```

وبكذا ما نخلط:

* أين وصل Workflow؟
* ما نتيجة Inspection؟
* هل تم Release بالنظام؟

---

# 24. Receiving Item Details

عند فتح سجل:

```text
Identity
↓
Receiving Information
↓
Inspection Information
↓
System Release
↓
Inspection Reports
↓
Attachments
↓
Related Findings/NCR
↓
Audit Timeline
```

والActions تتغير حسب الحالة والصلاحية.

---

# 25. Inspection Reports

الإنشاء يكون من:

> Approved Inspection Templates

وليس Form ثابتًا مكتوبًا يدويًا لكل منتج.

---

# 26. Inspection Template

يمكن أن يحتوي:

```text
General Information

Inspection Sections

Inspection Points

Requirement

Observed Result

Result

Remarks

Evidence

Final Decision

Signatures
```

لكن أي قيمة فنية يجب أن تأتي من مصدر معتمد.

لا يخترع المطور:

```text
Temperature limit
Pressure limit
Torque
Acceptance criteria
Sampling rules
```

---

# 27. Receiving → Inspection

عند الضغط:

> Create Inspection Report

النظام يملأ تلقائيًا:

```text
Doc No
Item Code
Description
Lot
Qty
Receiving Date
Exp Date
```

من Receiving Item.

لا يعيد المستخدم كتابتها.

---

# 28. Template Versioning

مثل:

```text
Incoming Inspection Template

Version 1
Version 2
Version 3
```

إذا Report قديم استخدم Version 1:

لا يتغير عندما تصبح Version 3 هي الحالية.

التقرير يحتفظ بـ:

```text
template_id
template_version
snapshot
```

---

# 29. Quarantine Administration

Admin only.

تشمل:

```text
Inspection Template Management
Reference Lists
Quarantine Configuration
Controlled status configuration
Bulk imports
Administrative corrections
Archive management
System mappings
Audit administration
```

لكن:

> Admin ≠ Rewrite History.

---

# 30. Laboratory Testing

يتعامل مع:

```text
Tests
Samples
Test Templates
Measurements
Results
Retests
Review
Approval
Evidence
Equipment references
Document references
Historical snapshots
```

---

# 31. Laboratory forms

تصمم للسرعة التشغيلية أولًا:

```text
Keyboard navigation
Tab flow
Fast sample entry
Paste from Excel where safe
Fill down
Duplicate previous
Inline validation
Sticky headers
Bulk entry
Error summary
```

الجمال مهم، لكن سرعة ودقة الموظف أهم.

---

# 32. Lab Template Builder

لا نبنيه أول يوم.

أولًا:

> Build real approved test workflows.

بعد فهم Patterns الفعلية نبني Template Builder.

هذا يمنع Overengineering.

---

# 33. Equipment / Calibration

يحتوي:

```text
Equipment Register
Equipment Details
Calibration Records
Calibration Due
Calibration Overdue
Maintenance History
Equipment Status
Attachments
Audit
```

وأي Test تاريخي يحتفظ بمعلومات المعدات المستخدمة وقت التنفيذ.

---

# 34. Controlled Documents

نفصل بين:

```text
Document Identity

و

Document Version
```

مثل:

```text
WI-8-2-2-M01
```

Document Identity.

و:

```text
Revision 2
```

Version.

---

# 35. Document Lifecycle

يمكن أن يكون:

```text
CATALOG_ONLY
DRAFT
IN_REVIEW
APPROVED
SUPERSEDED
ARCHIVED
```

ولا نفترض أن مجرد وجود WI في القائمة يعني أن محتواها Controlled داخل النظام.

---

# 36. Approved ≠ Editable

أي سجل وصل إلى:

```text
APPROVED
SIGNED
CLOSED
VOID
SUPERSEDED
```

لا يتم تحريره كـDraft.

إذا يوجد خطأ:

```text
Correction
Void
New Version
Supersede
```

حسب نوع السجل.

---

# 37. Immutable Snapshots

من أهم قواعد النظام.

مثلاً Inspection Report استخدم:

```text
Product X
Template V4
WI Rev 7
Equipment E-12
```

بعد سنتين تغير كل شيء.

التقرير القديم يجب أن يعكس:

> ماذا كان موجودًا وقت تنفيذ التقرير.

وليس Current Master Data.

---

# 38. Reviews / Approvals

لا نبني Review System مختلف لكل Module.

يكون لدينا Approval Infrastructure مشتركة.

مثل:

```text
My Reviews
My Approvals
Returned Items
Completed Reviews
Approval History
```

وتشمل:

```text
Inspection Reports
Lab Tests
Documents
Templates
Change Requests
CAPA
Other controlled records
```

---

# 39. E-Signature

Approve button وحده ليس E-Signature.

العمليات الحساسة:

```text
User selects action
↓
System shows signature meaning
↓
Current password required
↓
Re-authenticate
↓
Re-authorize
↓
Verify record version
↓
Verify workflow state
↓
Apply action
↓
Store signature evidence
↓
Audit
```

ولا تخزن كلمة المرور.

---

# 40. E-Signature evidence

نحفظ:

```text
actor_id
entity_type
entity_id
entity_version
action
meaning
signed_at
record_snapshot_hash
reason when required
```

---

# 41. Separation of Duties

السياسة لا تكتب عشوائيًا داخل الصفحات.

نحددها في Domain Policy + Permission Matrix.

مثلاً:

```text
Author
Reviewer
Approver
```

وقد تمنع السياسات الجمع بين بعضها على نفس Record.

---

# 42. Change Requests

أي تعديل Controlled لا يملكه المستخدم مباشرة يتم عبر:

```text
Change Request
```

ويعرض:

```text
Current Value
Proposed Value
Reason
Requester
Reviewer
Decision
Approval
Applied At
```

بعد الاعتماد:

النظام نفسه ينفذ التغيير.

---

# 43. Optimistic Concurrency

كل Record مهم:

```text
version
```

مثال:

المستخدم فتح:

```text
version = 7
```

وأثناء عمله أصبح في DB:

```text
version = 8
```

محاولة الحفظ تفشل برسالة واضحة.

لا يحدث Silent Overwrite.

---

# 44. PostgreSQL transactions

العمليات الحرجة تتم في Transaction واحدة.

مثال:

```text
Approve Inspection Report

BEGIN

verify actor
verify permission
verify version
verify state
write approval
update report
apply receiving consequence
write audit
create notification

COMMIT
```

إذا فشل شيء:

```text
ROLLBACK
```

---

# 45. Idempotency

خصوصًا:

```text
Submit
Approve
Release
Void
Close
Complete
Retest
Backup
```

إذا ضغط المستخدم مرتين أو Retry من الشبكة:

لا ينتج Duplicate Action.

---

# 46. Audit Trail

يفصل تمامًا عن Application Logs.

Audit:

```text
Who
What
When
Entity
Old State
New State
Reason
Request
Signature
```

Application Log:

```text
Database error
HTTP error
Timeout
Performance
Runtime error
```

---

# 47. Audit append-only

قدر الإمكان:

```text
INSERT
```

وليس:

```text
UPDATE old audit record
```

التاريخ لا يعاد كتابته.

---

# 48. Database change history

الـMigrations:

```text
001_...
002_...
003_...
```

وبمجرد تطبيق Migration:

> Immutable history.

إذا احتجنا تعديلًا:

```text
041_fix_xxx.sql
```

ولا نغير:

```text
023_old_migration.sql
```

---

# 49. Migration verification

CI يتحقق من:

```text
Fresh database migration
Upgrade migration
Migration checksums
Foreign keys
Constraints
Indexes
Expected schema version
```

---

# 50. Reports

Reporting Domain رئيسي.

يشمل:

```text
Tasks Reports
Quality Reports
Quarantine Reports
Receiving Reports
Inspection Reports
Laboratory Reports
Equipment Reports
Calibration Reports
Document Reports
Management Reports
Audit Reports where authorized
```

---

# 51. Reporting Engine واحد

النموذج:

```text
Report Definition
       ↓
Authorization Scope
       ↓
Canonical Query
       ↓
Canonical Dataset
     ↙    ↓    ↘
   CSV  XLSX   PDF
```

ولا يكون CSV يحسب رقمًا وPDF يحسب رقمًا مختلفًا.

---

# 52. Report Contract

كل Report يحدد:

```text
Report ID
Data Source
Role
Scope
Filters
Columns
Sort
Generated By
Generated At
Output Format
Audit behavior
```

---

# 53. Administration

Admin only.

تشمل:

```text
Users
Roles
Permissions
Account activation
Password reset
Reference data
System configuration
Templates
Feature configuration
Audit administration
Security configuration
```

---

# 54. Admin security principle

الـAdmin لديه أعلى Administrative Authority.

لكن ليس:

> Unlimited ability to rewrite controlled history.

أي تصحيح حساس يحتاج:

```text
Reason
Audit
Correction path
Potential E-Signature
```

---

# 55. System Health

Admin only.

يعرض:

```text
Application
PostgreSQL
Database connectivity
Schema version
Pending migrations
Foreign-key integrity
Database checks
Audit integrity
Backup
Restore readiness
Disk / Storage
AI Provider
Deployment
Critical system errors
```

---

# 56. Health vs Readiness

نفصل:

```text
/health
```

هل التطبيق يعمل؟

و:

```text
/readiness
```

هل التطبيق جاهز للخدمة؟

مثلاً قد يكون السيرفر يعمل لكن PostgreSQL غير متصل.

Health ≠ Readiness.

---

# 57. Backup Architecture

لـPostgreSQL نخطط من البداية لـ:

```text
Logical backups
Encrypted backup storage
Retention
Backup verification
Restore drills
Recovery documentation
```

ونفرق بين:

```text
Backup Created

Backup Verified

Restore Proven
```

النجاح الحقيقي هو الثالث.

---

# 58. Recovery targets

يتم تحديد:

```text
RPO
RTO
```

مع الشركة لاحقًا.

ولا نخترع أرقامًا بدون قرار تشغيلي.

---

# 59. Error Architecture

كل Error مهم يحتوي:

```text
User-safe message
Stable error code
Request ID
Recovery action
Structured server event
```

مثل:

```text
We couldn't save this report.

The record may have changed since you opened it.
Reload it before continuing.

Reference: REQ-83B7F1
```

---

# 60. Request ID

كل Request مهم له:

```text
request_id
```

ويظهر للمستخدم عند الأخطاء.

هذا يسهل الدعم كثيرًا.

---

# 61. Structured Logging

مثال:

```json
{
  "request_id": "REQ-83B7F1",
  "route": "/quarantine/reports/128",
  "actor_id": "...",
  "status": 409,
  "duration_ms": 84,
  "error_code": "STALE_RECORD"
}
```

بدون تسريب بيانات حساسة.

---

# 62. Authentication

لنظام Modular Monolith:

أفضل:

> Server-side sessions.

لا نستخدم JWT فقط لأنه مشهور.

JWT يدخل إذا ظهر احتياج فعلي له.

---

# 63. Password Reset

لو Admin عمل Reset:

```text
Invalidate current sessions
Force password change
Audit reset
Require user-owned password
```

---

# 64. Future SSO

نصمم Identity Layer بحيث يمكن مستقبلًا دعم:

```text
Microsoft Entra ID
Google Workspace
Corporate SSO
```

بدون تغيير كل النظام.

---

# 65. Authorization

مصدر واحد فقط.

مثلاً:

```text
authorization/
permissions.ts
policies.ts
scopes.ts
```

لا نكرر:

```ts
if (role === "manager")
```

في عشرات الصفحات.

---

# 66. Permission functions

نستخدم مفاهيم مثل:

```text
canCreateReceivingItem()

canEditReceivingItem()

canStartInspection()

canReviewInspectionReport()

canApproveInspectionReport()

canReleaseReceivingItem()

canCreateLabTest()

canApproveLabTest()

canManageDocuments()

canViewSystemHealth()
```

وتستخدم نفس السياسات في:

```text
Server
Routes
Use cases
UI visibility
Tests
```

---

# 67. Default Deny

أي Route/Action جديدة:

> Denied until explicitly permitted.

وليس:

> Allowed until someone remembers to secure it.

---

# 68. File / Evidence System

لا نربط Business Logic مباشرة بتخزين الملفات.

نستخدم:

```text
EvidenceStore
```

حتى لو بدأنا بـObject Storage من البداية.

---

# 69. File metadata

نحفظ:

```text
Original filename
Stored reference
MIME
Extension
Size
SHA-256
Uploader
Uploaded At
Entity
```

والتحقق يكون Server-side.

---

# 70. لا نضع الملفات الكبيرة داخل PostgreSQL افتراضيًا

PostgreSQL يخزن Metadata.

والملفات نفسها يفضل تخزينها في:

> S3-compatible/Object Storage

خصوصًا إذا توسع النظام.

---

# 71. Data Dictionary

كل Field مهم يوثق:

```text
Name
Meaning
Type
Source
Required
Validation
Editable by
Lifecycle
Audit significance
```

---

# 72. Requirements Traceability

كل Requirement:

```text
REQ-QUAR-001
REQ-LAB-014
REQ-DOC-021
```

ويرتبط بـ:

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

# 73. ADRs

القرارات المعمارية المهمة توثق.

مثلاً:

```text
ADR-001 Modular Monolith
ADR-002 PostgreSQL
ADR-003 Server-side Sessions
ADR-004 Immutable Approval Records
ADR-005 Object Storage
ADR-006 AI Advisory Only
ADR-007 Canonical Reporting Engine
```

---

# 74. Design System من البداية

قبل بناء عشرات الصفحات نعتمد:

```text
Typography
Spacing
Grid
Colors
Semantic colors
Inputs
Buttons
Tables
Cards
Badges
Dialogs
Drawers
Alerts
Empty states
Loading states
Errors
Form patterns
Navigation
Accessibility states
```

---

# 75. Cards vs Tables

Cards للملخصات.

مثل:

```text
Pending: 14
Inspection: 7
Released: 32
Expired: 2
```

لكن Receiving Register:

> Table/Data Grid.

لأن المستخدم يحتاج مقارنة بيانات كثيرة.

---

# 76. Form UX

الـForms التشغيلية تدعم:

```text
Logical tab order
Keyboard navigation
Inline validation
Error summary
Focus invalid field
Unsaved changes protection
Draft
Save indicator
Double-submit prevention
Clear units
Clear field grouping
Accessible labels
```

---

# 77. Draft vs Submitted vs Approved

هذه ثلاث مراحل مختلفة.

### DRAFT

```text
Editable
Incomplete allowed
Autosave possible
```

### SUBMITTED

```text
Validation complete
Workflow active
Record snapshot created
```

### APPROVED

```text
Controlled
Immutable
Correction/revision required
```

---

# 78. Autosave

Autosave يستخدم للـDraft فقط.

لا يستخدم تلقائيًا لـ:

```text
Submit
Approve
Release
Void
Close
```

هذه Intentional Actions.

---

# 79. Notifications

خدمة مشتركة.

ترسل عند أحداث مهمة مثل:

```text
Task assigned
Inspection ready for review
Report returned
Approval required
Item released
Calibration due
Change request decision
CAPA overdue
```

---

# 80. Notification deduplication

لا نرسل نفس الإشعار خمس مرات بسبب Retry.

نستخدم event/dedupe identifiers.

---

# 81. Search

البحث من البداية يعامل كCapability أساسية.

يمكنه البحث حسب:

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

PostgreSQL يساعدنا كثيرًا هنا.

---

# 82. Performance

نقيس ولا نخمن.

نستخدم:

```text
PostgreSQL indexes
EXPLAIN ANALYZE
Slow-query logging
Pagination
Server filtering
Limited payloads
Connection pooling
```

ولا نحمل آلاف Records للBrowser ثم نفلترها محليًا.

---

# 83. Pagination

كل Large Register يستخدم:

> Server-side pagination/filtering/sorting.

خصوصًا:

```text
Receiving
Audit
Tasks
Lab Tests
Reports
Notifications
```

---

# 84. Connection Pooling

في Production:

```text
PostgreSQL connection pool
```

بحجم محسوب حسب البيئة.

ولا نفتحه عشوائيًا.

---

# 85. Testing Architecture

أي Feature مهمة تحتاج:

```text
Domain tests
Unit tests
Integration tests
Database tests
Permission tests
Negative tests
Contract tests
E2E tests
```

---

# 86. Negative Tests

مهمة جدًا.

ليس فقط:

> Manager can approve.

بل:

```text
Employee cannot approve
Self-approval denied
Wrong state denied
Stale version denied
Missing signature denied
Duplicate approval denied
Unauthorized record denied
```

---

# 87. Architecture Guards

ننشئ Tests تمنع:

```text
UI importing DB layer
UI defining authorization
Duplicate permission maps
Duplicate state-machine definitions
AI invoking controlled mutations
Historical migration modification
Missing route implementation
Orphan tests
```

---

# 88. Route Manifest

أي Link موجود يجب أن يطابق Route حقيقي.

والـCI يفشل إذا:

```text
UI links to nonexistent route
```

---

# 89. Test Manifest

أي Test موجود:

> يجب أن يتم تشغيله.

لا نريد Test files موجودة لكنها خارج الـCI.

---

# 90. Definition of Done

أي Feature لا تعتبر Done إلا إذا تحقق:

```text
Requirement              ✓
Business Rule            ✓
State Machine            ✓
Authorization            ✓
Validation               ✓
Database constraints     ✓
Transaction              ✓
Concurrency              ✓
Idempotency              ✓
Audit                    ✓
Notification             ✓
Error handling           ✓
UI                       ✓
Accessibility            ✓
Responsive behavior      ✓
Unit tests               ✓
Integration tests        ✓
Negative tests           ✓
E2E                      ✓
Documentation            ✓
```

---

# 91. Accessibility

النظام التشغيلي يجب يدعم:

```text
Keyboard
Focus visibility
Semantic HTML
Labels
Screen readers
200% zoom
Contrast
Error identification
No color-only meaning
Touch targets
Responsive layout
```

---

# 92. Human Factors

ما نقيس الجمال فقط.

نقيس:

```text
Time to complete inspection
Number of entry errors
Number of corrections
Review turnaround
Clicks
Search success
Keyboard efficiency
User confusion
```

---

# 93. Responsive Design

الأولوية:

```text
Desktop operational use
Laptop
Tablet where needed
Mobile for supporting workflows
```

ولا نحاول جعل Data-heavy Lab Grid مطابقًا لتجربة Desktop على هاتف صغير.

نصمم Adaptive UX.

---

# 94. Reports Export UX

المستخدم يرى:

```text
Current filters
Applied scope
Generated time
Generated by
Rows/results count
```

قبل/أثناء التصدير عند الحاجة.

---

# 95. AI Advisory

الـAI لا يكون أساس النظام.

Core workflows تعمل بدونه.

الـAI يستطيع:

```text
Summarize
Highlight
Compare
Suggest
Draft
Explain
Identify possible patterns
```

---

# 96. AI ممنوع من

```text
Approving
Rejecting
Releasing
Signing
PASS/FAIL decisions
Changing controlled data autonomously
```

---

# 97. Contextual AI

أفضل من AI page واحدة ضخمة.

مثلًا داخل Inspection:

```text
Summarize this inspection
```

داخل CAPA:

```text
Suggest questions for RCA
```

داخل Dashboard:

```text
Summarize current exceptions
```

---

# 98. Structured AI Output

لا نعتمد على Free-form Text فقط.

مثلاً:

```json
{
  "summary": "",
  "risks": [],
  "questions": [],
  "suggested_actions": []
}
```

مع Schema Validation.

---

# 99. AI Evals

قبل اعتماد AI:

```text
Synthetic evaluation set
Schema compliance
Hallucination testing
Unsupported claims
Prompt injection
Failure handling
Unsafe recommendations
False confidence
```

ونخزن:

```text
Prompt Version
Model Version
Evaluation Version
```

---

# 100. AI Audit

نسجل Metadata الضروري:

```text
Actor
Feature
Model
Timestamp
Success/Failure
Reference IDs
```

مع تجنب تخزين معلومات حساسة بلا ضرورة.

---

# 101. Environment Model

نفصل:

```text
Development
Test
Staging / Pilot
Production
```

ولا يسمح Test-only behavior بالدخول إلى Production.

---

# 102. Secrets

لا تدخل Git.

مثل:

```text
DATABASE_URL
Passwords
API Keys
Tokens
Private keys
```

---

# 103. `.env.example`

يوثق جميع المتغيرات لكن بدون قيم حساسة.

ويصنف:

```text
Required
Optional
Development only
Test only
Production
Reserved
```

---

# 104. CI Gate

قبل الدمج/الإطلاق:

```text
Lint
Typecheck
Unit tests
Integration tests
Security tests
Migration tests
Architecture guards
Route manifest
Test manifest
Build
E2E
Secret scan
Dependency checks
```

---

# 105. Pilot Strategy

قبل التعميم:

مجموعة صغيرة من مستخدمي QC الفعليين.

يجربون:

```text
Tasks
Receiving Item
Inspection Report
Review
Approval
Lab Test
Document
Report
```

---

# 106. Human UAT

Automated tests ≠ Human UAT.

نفصل النتائج إلى:

```text
Implementation verification
Automated verification
Operational validation
Human UAT
Production readiness
```

---

# 107. Success Metrics

لا أقيس النظام بعدد الصفحات.

أقيس:

```text
Task completion time
Inspection entry time
Lab entry time
Error rate
Returned submissions
Approval turnaround
Overdue work
Search success
System errors
Backup recovery time
User task success
```

---

# 108. Documentation

README يصف الواقع الحالي.

ولا يتحول إلى سجل لكل Prompt تم تنفيذه.

نقسم الوثائق:

```text
README.md
CURRENT-STATE.md
SYSTEM-INVARIANTS.md
BUSINESS-RULES.md
ARCHITECTURE.md
DATA-DICTIONARY.md
ROLE-MATRIX.md
STATE-MACHINES.md
SECURITY.md
DEPLOYMENT.md
BACKUP-RECOVERY.md
CHANGELOG.md
ADR/
```

---

# 109. استخدام Agents / Codex

لا أعطي Agent:

> Make everything 100%.

بل:

```text
Scope
Current state
Invariants
Requirements
Allowed files
Forbidden actions
Implementation
Tests
Verification
Evidence
```

---

# 110. Agent Verification Rule

كل Prompt ختامي يبدأ بمبدأ:

> Do not trust previous PASS claims. Verify current reality.

ولا يعتبر:

```text
implemented
fixed
complete
100%
production ready
```

دليلًا بحد ذاته.

---

# 111. Evidence before PASS

أي PASS يجب أن يكون معه:

```text
Command
Result
Exit Code
Affected files
Test evidence
Known limitations
```

---

# 112. ترتيب البناء النهائي

أنا أبني النظام بهذا التسلسل:

```text
PHASE 0
Discovery + Requirements

PHASE 1
Architecture + PostgreSQL Foundation

PHASE 2
Authentication + Identity

PHASE 3
Authorization + Permission Matrix

PHASE 4
Audit + Records Integrity

PHASE 5
Design System + Shared UI

PHASE 6
Tasks

PHASE 7
Quality
Findings / NCR / RCA / CAPA

PHASE 8
Quarantine
Receiving + Inspection

PHASE 9
Laboratory

PHASE 10
Equipment / Calibration

PHASE 11
Controlled Documents

PHASE 12
Reviews / Approvals / E-Signatures

PHASE 13
Change Requests

PHASE 14
Notifications + Search

PHASE 15
Reports

PHASE 16
Administration

PHASE 17
System Health

PHASE 18
Backup / Recovery

PHASE 19
Performance / Security / A11y Closure

PHASE 20
AI Advisory

PHASE 21
AI Evals

PHASE 22
Pilot / UAT

PHASE 23
Production Readiness Gate
```

---

# 113. ما لا أبنيه مبكرًا

لا أبدأ بـ:

```text
Microservices
Mobile app
Complex real-time architecture
Large AI agents
Heavy animations
Advanced template builder
Ten dashboards
Excessive customization
Multi-tenant architecture
```

إلا إذا ظهرت Requirement حقيقية.

---

# 114. V1 المقترح

أول إصدار قوي يكون:

```text
Authentication
Authorization
Dashboard
Tasks
Quality basics
Quarantine
Inspection Reports
Laboratory core
Equipment
Documents
Approvals
Notifications
Reports
Administration
Audit
Backup
```

وبجودة عالية.

---

# 115. فلسفة الإصدار

أفضل:

> 10 workflows صحيحة 100%

من:

> 100 Feature نصف مكتملة.

---

# 116. مستويات الـ100%

لا نقول فقط:

> النظام 100%.

بل نفصل:

```text
Implementation completeness
Automated verification
Security verification
Data-integrity verification
Human UAT
Operational validation
Production readiness
```

---

# 117. معيار النجاح النهائي

النظام الناجح عندي هو النظام الذي يجعل المستخدم:

> يدخل ويعرف مباشرة ما المطلوب منه.

ثم يستطيع تنفيذ العمل:

* بسرعة.
* بأقل إدخال متكرر.
* بأقل أخطاء.
* بصلاحية صحيحة.
* بمراجعة صحيحة.
* بتتبع كامل.
* بدون العبث بالتاريخ.
* ومع إمكانية إثبات كل خطوة بعد سنة أو أكثر.

والإدارة تستطيع معرفة:

> ماذا حدث؟
> من قام به؟
> متى؟
> على أي Lot؟
> على أي إصدار WI/SOP؟
> باستخدام أي Template؟
> من راجعه؟
> من اعتمده؟
> وما الذي تغير بعد ذلك؟

---

# القرار المعماري النهائي

إذًا النسخة الجديدة تعتمد رسميًا:

```text
Product:
QC Operations & Laboratory Management System

Architecture:
Modular Monolith

Database:
PostgreSQL from Day One

Authorization:
Centralized Server-Side RBAC/Policies

Records:
Versioned + Auditable + Immutable when controlled

UI:
Role-based Operational UX

Quarantine:
First-Class Domain

Reports:
Canonical Reporting Engine

Files:
Metadata in PostgreSQL + Object Storage abstraction

AI:
Advisory Only

Testing:
Evidence-driven, multi-layer verification

Deployment:
Environment-separated production architecture

Readiness:
No PASS without current evidence
```

