# DOMAIN-MAP.md

# QC Operations & Laboratory Management System

## Domain Map — v1.0

---

# 1. Purpose

هذه الوثيقة تحدد الحدود الرسمية للـDomains داخل:

> **QC Operations & Laboratory Management System**

وهي المرجع الأساسي لتحديد:

* من يملك كل Business Concept.
* من يملك كل Record.
* أين تعيش Business Rules.
* كيف تتواصل الـDomains مع بعضها.
* ما الذي يُسمح بمشاركته.
* ما الذي يمنع تكراره.
* أين تنتهي مسؤولية Domain وتبدأ مسؤولية Domain آخر.

الهدف الرئيسي:

> **كل Business Concept له Owner واحد واضح فقط.**

ولا يسمح بوجود نفس المنطق أو نفس الحقيقة موزعة بين أكثر من Domain.

---

# 2. Architectural Context

المعمارية الرسمية للنظام:

```text
Modular Monolith
+
PostgreSQL
+
Clear Domain Boundaries
+
Shared Platform Capabilities
```

يعني:

```text
One Application
One PostgreSQL Database
Multiple Internal Domains
Strict Ownership Boundaries
Shared Security / Audit / Files / Notifications Infrastructure
```

وجود قاعدة بيانات واحدة لا يعني أن أي Module يستطيع الكتابة في جداول Module آخر.

## Delivery Layer

إطار العمل الرسمي هو **Astro (server-rendered / on-demand)**. ويُثبَّت ما يلي:

```text
src/pages/        → Delivery Layer فقط
src/actions/      → Delivery Layer فقط
src/middleware.ts → Delivery Layer فقط
src/modules/      → مالك الـBusiness Logic (Domain / Application layers)
```

- `src/pages/` و`src/actions/` و`src/middleware.ts` هي **Delivery Layer فقط**؛ لا تحتوي Business Rules.
- `src/modules/` يبقى مالك الـBusiness Logic وأي قاعدة عمل تنتهي فيه بغض النظر عن نقطة الدخول.
- Astro Actions/API endpoints تصل عبر الـUse Cases المملوكة للـModules، ولا تتخطاها للوصول إلى قاعدة البيانات أو جداول Domain آخر.

---

# 3. Core Principle

القاعدة العليا:

> **Data ownership follows business ownership.**

مثال:

```text
Receiving Item
```

ملكه:

```text
Quarantine Domain
```

وليس:

```text
Laboratory
Quality
Reporting
Dashboard
Approvals
```

هذه الـDomains يمكنها الإشارة إليه أو قراءة View مسموح أو أخذ Snapshot منه، لكنها لا تصبح مالكة له.

---

# 4. Domain Categories

نقسم النظام إلى خمس طبقات مفاهيمية.

```text
1. Core Business Domains
2. Governance & Workflow Domains
3. Identity & Administration
4. Shared Platform Capabilities
5. Composition / Advisory / Operational Capabilities
```

---

# 5. High-Level Domain Map

```text
QC Operations & Laboratory Management System
│
├── Core Business Domains
│   ├── Tasks
│   ├── Quality
│   ├── Quarantine
│   ├── Laboratory
│   ├── Equipment & Calibration
│   └── Controlled Documents
│
├── Governance & Workflow Domains
│   ├── Reviews & Approvals
│   ├── E-Signatures
│   ├── Change Requests
│   └── Reporting
│
├── Identity & Administration
│   ├── Identity & Access
│   └── Administration
│
├── Shared Platform Capabilities
│   ├── Authorization
│   ├── Audit
│   ├── Notifications
│   ├── Files & Evidence
│   ├── Search
│   ├── Validation
│   ├── Transactions
│   ├── Time
│   ├── Errors
│   └── Observability
│
└── Composition / Operational / Advisory
    ├── Dashboard
    ├── System Health
    ├── Backup & Recovery
    └── AI Advisory
```

---

# 6. Ownership Matrix

| Domain                  | Primary Ownership                                        |
| ----------------------- | -------------------------------------------------------- |
| Tasks                   | General operational tasks                                |
| Quality                 | Findings, NCR, RCA, CAPA                                 |
| Quarantine              | Receiving Items, Inspection Reports, Quarantine workflow |
| Laboratory              | Lab Tests, Samples, Measurements, Results, Retests       |
| Equipment & Calibration | Equipment, Calibration, Maintenance                      |
| Controlled Documents    | WI, SOP, controlled document identities and versions     |
| Reviews & Approvals     | Review/approval workflow infrastructure                  |
| E-Signatures            | Signature evidence and re-authentication evidence        |
| Change Requests         | Controlled change request lifecycle                      |
| Reporting               | Report definitions and canonical reporting datasets      |
| Identity & Access       | Users, credentials, sessions, authentication identities  |
| Administration          | Administrative configuration and governance operations   |
| Audit                   | Immutable audit events                                   |
| Files & Evidence        | File metadata and storage abstraction                    |
| Notifications           | Notification delivery records                            |
| Search                  | Cross-domain search index/read capability                |
| Dashboard               | Aggregated role-based read models only                   |
| System Health           | Runtime/readiness/operational health                     |
| Backup & Recovery       | Backup/restore orchestration and evidence                |
| AI Advisory             | Advisory AI interactions only                            |

---

# 7. Tasks Domain

## Responsibility

يمثل الأعمال التشغيلية العامة التي لا تملك Workflow متخصصًا مستقلًا.

يشمل:

```text
Task
Assignment
Reassignment
Priority
Due Date
Checklist
Comments
Evidence
Dependencies
Blockers
Recurrence
Completion
Reopen
```

## Owns

```text
Task
Task Assignment
Task Checklist
Task Dependency
Task Comment
Task Blocker
Task Recurrence
Task Completion Metadata
```

## Does Not Own

```text
Inspection Report
Lab Test
NCR
CAPA
Document Approval
Calibration
Receiving Item
```

يمكن إنشاء Task مرتبط بهذه السجلات، لكن الـTask لا يصبح بديلًا عنها.

مثال:

```text
Lab Test LAB-2026-0044
        ↓
Task: Repeat sample preparation
```

الـLab Test يبقى ملك Laboratory.

---

# 8. Quality Domain

## Responsibility

إدارة دورة المشاكل والانحرافات والإجراءات التصحيحية.

يشمل:

```text
Findings
NCR
RCA
CAPA
```

## Owns

```text
Finding
Non-Conformance Record
Root Cause Analysis
Corrective / Preventive Action
Quality Follow-up
Quality Closure State
```

## Typical Flow

```text
Issue detected
      ↓
Finding
      ↓
NCR
      ↓
RCA
      ↓
CAPA
      ↓
Verification / Closure
```

## Can Receive Sources From

```text
Quarantine
Laboratory
Tasks
Equipment
Documents
Internal operational findings
```

## Does Not Own

مصدر المشكلة نفسه.

مثال:

```text
Inspection Report
```

يبقى ملك Quarantine حتى لو أدى إلى NCR.

---

# 9. Quarantine Domain

## Responsibility

إدارة المواد المستلمة من لحظة تسجيلها وحتى انتهاء عملية الفحص وحالة الـRelease.

هذا Domain رئيسي ومستقل.

## Subdomains / Areas

```text
Quarantine Dashboard
Receiving Register
Inspection Reports
Inspection Templates
Quarantine Administration
```

## Owns

```text
Receiving Item
Receiving Identity
Receiving Metadata
Inspection Workflow
Inspection Report
Inspection Result
Inspection Template
Inspection Template Version
System Release State
Quarantine Status
Receiving Attachments Links
```

## Core Separation

يجب فصل:

```text
Receiving Workflow Status
Inspection Result
System Release Status
```

مثال صحيح:

```text
Workflow:
COMPLETED

Inspection:
PASS

Release System:
NO
```

ولا يتم دمجها في Status واحد.

## Relationships

```text
Receiving Item
      ↓
Inspection Report
      ↓
PASS / FAIL / HOLD
      ↓
Potential Finding / NCR
```

## Does Not Own

```text
Finding
NCR
Equipment master record
WI/SOP master record
Lab Test
User
Approval identity
```

عند الحاجة يتم استخدام References أو Snapshots.

---

# 10. Laboratory Domain

## Responsibility

إدارة الاختبارات المختبرية وتنفيذ القياسات والنتائج والمراجعة العلمية.

## Owns

```text
Lab Test
Lab Sample
Lab Test Template
Template Version
Measurement
Observation
Calculated Result
Test Result
Retest
Lab Conditions
Lab Test Snapshot
```

## Typical Flow

```text
DRAFT
  ↓
SUBMITTED
  ↓
UNDER_REVIEW
  ↓
APPROVED
```

مع حالات إضافية حسب Business Rules مثل:

```text
RETURNED
REJECTED
VOID
```

إذا اعتمدت لاحقًا في STATE-MACHINES.

## May Reference

```text
Product
Equipment
Calibration
WI
SOP
Receiving Item
Inspection Report
User
Evidence
```

## Historical Integrity

عند الوصول إلى Controlled State، يجب الاحتفاظ بما استخدم فعليًا وقت الاختبار.

مثل:

```text
Equipment snapshot
Calibration snapshot
WI/SOP version
Template version
Product data snapshot
Acceptance criteria source
```

## Does Not Own

Equipment master data أو document master data.

---

# 11. Equipment & Calibration Domain

## Responsibility

إدارة أصول المختبر والجودة المستخدمة في تنفيذ الأعمال.

## Owns

```text
Equipment
Equipment Identity
Equipment Status
Calibration Record
Calibration Schedule
Calibration Due State
Maintenance Record
Maintenance History
Equipment Attachments
```

## Core Rules

المعدة الحالية قد تتغير.

لكن أي Test قديم يجب أن يحتفظ بالمعلومات المستخدمة وقت الاختبار.

لذلك:

```text
Current Equipment Record
         ≠
Historical Equipment Snapshot
```

## Used By

```text
Laboratory
Quarantine / Inspection
Quality
Reporting
Dashboard
```

## Does Not Own

Lab Test أو Inspection Report.

---

# 12. Controlled Documents Domain

## Responsibility

إدارة المستندات المضبوطة وإصداراتها وتاريخها.

## Owns

```text
Document Identity
Document Version
Revision
Document Lifecycle
Review Status
Approval Status
Superseded State
Archive State
Document Metadata
```

## Document Types

تشمل مثلًا:

```text
WI
SOP
Controlled Procedures
Controlled Forms
Approved Instructions
```

## Important Separation

نفصل بين:

```text
Document Identity
```

مثل:

```text
WI-8-2-2-M01
```

وبين:

```text
Document Version
```

مثل:

```text
Revision 4
```

## Historical Rule

السجلات القديمة تشير للإصدار الذي كان فعالًا وقت تنفيذ العمل.

لا يتم تحديث التاريخ تلقائيًا إلى آخر Revision.

---

# 13. Reviews & Approvals Domain

## Responsibility

توفير Infrastructure موحدة للمراجعات والاعتمادات.

ولا نكرر Approval Engine مختلف في كل Domain.

## Owns

```text
Review Assignment
Approval Request
Approval Decision
Review History
Approval History
Returned-for-correction action
Approval Workflow Metadata
```

## Used By

```text
Inspection Reports
Lab Tests
Controlled Documents
Templates
CAPA
Change Requests
Other controlled records
```

## Critical Boundary

Reviews & Approvals لا تقرر Business State من تلقاء نفسها.

مثال:

Approval Domain يسجل:

```text
Manager approved Lab Test LAB-001
```

لكن:

```text
Laboratory Domain
```

هو المسؤول عن تنفيذ transition:

```text
UNDER_REVIEW → APPROVED
```

بعد إعادة التحقق من:

```text
Permission
Current state
Record version
Domain rules
Separation of duties
```

---

# 14. E-Signature Capability

## Responsibility

إثبات أن إجراء حساس تم بواسطة مستخدم موثق وبمعنى توقيع واضح.

## Owns

```text
Signature Evidence
Signature Meaning
Signed Timestamp
Actor Reference
Entity Reference
Record Version
Snapshot Hash
Reason where required
Re-authentication evidence
```

## Does Not Own

قرار الاعتماد نفسه أو Business Workflow.

هو دليل داعم للقرار.

---

# 15. Change Requests Domain

## Responsibility

إدارة التغييرات التي لا يسمح للمستخدم بتنفيذها مباشرة على Controlled Data.

## Owns

```text
Change Request
Current Value Snapshot
Proposed Value
Reason
Requester
Review State
Approval State
Decision
Applied At
Application Result
```

## Important Boundary

Change Request لا يقوم بكتابة بيانات Domain آخر مباشرة.

بعد الموافقة:

```text
Change Requests
      ↓
Approved Change Command
      ↓
Owning Domain Application Service
      ↓
Domain Rules
      ↓
Transaction
      ↓
Update
```

مثال:

```text
Approved equipment change
```

يُطبق عبر:

```text
Equipment Domain
```

وليس:

```text
Change Request → direct UPDATE equipment table
```

---

# 16. Reporting Domain

## Responsibility

تقديم تقارير موحدة وموثوقة عبر Domains.

## Owns

```text
Report Definition
Report Contract
Report Filters
Report Columns
Canonical Dataset Definition
Export Definition
Report Generation Audit Metadata
```

## Outputs

```text
CSV
XLSX
PDF
```

## Principle

```text
Canonical Dataset
     ↓
CSV / XLSX / PDF
```

ولا يتم إنشاء حسابات مستقلة لكل Format.

## Reporting Does Not Own Source Data

مثال:

Receiving Report يقرأ من Quarantine.

لكنه لا يملك Receiving Item.

## Cross-Domain Reporting

يسمح باستخدام:

```text
Read Models
Reporting Views
Read-only Queries
Approved Reporting Contracts
```

ولا يسمح باستخدام Reporting Engine لتنفيذ mutations.

---

# 17. Identity & Access Domain

## Responsibility

إدارة هوية المستخدم والمصادقة والجلسات.

## Owns

```text
User Identity
Credential
Password Hash
Session
Account State
Authentication Events
Password Reset State
Session Revocation
```

## Roles

قد تتضمن:

```text
Employee
Supervisor
Manager
Admin
```

لكن المعنى التفصيلي للصلاحيات يعرف لاحقًا في:

```text
ROLE-MATRIX.md
PERMISSION-MATRIX.md
```

## Does Not Own

Business permissions logic كاملة.

Authorization Capability هي التي تنفذ السياسات.

---

# 18. Administration Domain

## Responsibility

توفير العمليات الإدارية المسموحة لإدارة النظام.

يشمل مثلًا:

```text
Users
Roles
Permissions
Account Activation
Password Reset
Reference Data
System Configuration
Templates Administration
Security Configuration
```

## Critical Principle

```text
Admin ≠ Rewrite History
```

Admin يملك administrative authority.

لكنه لا يملك حق تعديل Controlled Historical Facts مباشرة.

---

# 19. Authorization Capability

## Responsibility

مصدر مركزي لتحديد:

```text
Who can perform what action
On which entity
In which state
Within which scope
```

## Must Be Used By

```text
Routes
Application Use Cases
Domain transitions
UI visibility
Reports
Exports
Approvals
Search
```

## Default

```text
DENY
```

حتى يتم السماح صراحة.

## Forbidden

تكرار logic مثل:

```text
if role == manager
```

في كل صفحة أو Module.

---

# 20. Audit Capability

## Responsibility

إنشاء سجل تاريخي مستقل عن Application Logs.

## Owns

```text
Audit Event
Actor
Timestamp
Entity
Action
Old State
New State
Reason
Request ID
Signature Reference
```

## Principle

```text
Append-only
```

قدر الإمكان.

## Important Boundary

Audit لا يقرر Business Action.

هو يسجل ما حدث بعد/ضمن العملية المعتمدة Transactionally حسب الحاجة.

---

# 21. Files & Evidence Capability

## Responsibility

إدارة Metadata وتخزين الملفات والأدلة.

## Owns

```text
File Metadata
Stored Object Reference
MIME
Extension
Size
SHA-256
Uploader
Uploaded At
Evidence Link
```

## Storage

```text
PostgreSQL:
Metadata

Object Storage:
Actual File
```

من خلال abstraction مثل:

```text
EvidenceStore
```

## Does Not Own

المعنى التجاري للملف.

مثال:

ملف Calibration Certificate مرتبط بـEquipment Domain، لكن تخزينه وHash الخاص به تتولاه Files Capability.

---

# 22. Notifications Capability

## Responsibility

إنشاء وإدارة إشعارات أحداث النظام.

## Owns

```text
Notification
Recipient
Notification Type
Event Reference
Read State
Delivery State
Deduplication Key
Created At
```

## Examples

```text
Task assigned
Inspection ready for review
Report returned
Approval required
Calibration due
CAPA overdue
Change request decision
```

## Important Rule

Notification failure لا يجب أن يؤدي إلى Duplicate Business Action عند retry.

---

# 23. Search Capability

## Responsibility

توفير بحث موحد عبر النظام.

## Searchable Concepts

مثل:

```text
Receiving ID
Doc No
Item Code
Description
Lot
Inspection Report
Lab Test
NCR
CAPA
Document No
Equipment
```

## Important Boundary

Search:

```text
Read only
```

ولا يملك records التي يعرضها.

نتائج البحث تخضع لنفس Authorization Scope للمستخدم.

---

# 24. Dashboard Composition

Dashboard ليس Domain يملك Business Data.

هو:

> **Role-Based Composition Read Model**

## Responsibility

جمع المعلومات التي تحتاج انتباه المستخدم.

مثال Employee:

```text
My Tasks
Pending Inspections
Returned Reports
Draft Lab Tests
Documents requiring action
```

Supervisor:

```text
Needs Review
Pending Inspection Reports
Team Exceptions
Hold / Fail
Returned Work
```

Manager:

```text
Pending Approvals
Critical Findings
Quarantine Exceptions
CAPA Status
Calibration Risk
Change Requests
```

## Rule

Dashboard:

```text
Reads
Aggregates
Navigates
```

ولا:

```text
Owns
Approves
Mutates directly
Defines business rules
```

---

# 25. System Health Capability

## Responsibility

عرض الحالة التقنية والتشغيلية للنظام.

يشمل:

```text
Application Health
PostgreSQL Connectivity
Schema Version
Pending Migrations
Storage
Audit Health
Backup State
Critical Errors
AI Provider State
Deployment State
```

## Separation

```text
Health
≠
Readiness
```

---

# 26. Backup & Recovery Capability

## Responsibility

حماية واستعادة البيانات.

## Owns

```text
Backup Job
Backup Metadata
Verification Result
Restore Drill
Restore Evidence
Retention Metadata
```

## States

نفصل بين:

```text
Backup Created
Backup Verified
Restore Proven
```

ولا يعتبر Backup مثبتًا فعليًا إلا مع Restore Verification.

---

# 27. AI Advisory Capability

## Responsibility

توفير مساعدات تحليلية فقط.

## Allowed

```text
Summarize
Highlight
Compare
Suggest
Draft
Explain
Identify patterns
Generate questions
```

## Forbidden

```text
Approve
Reject
Release
Sign
PASS
FAIL
Modify controlled data autonomously
```

## Interaction Model

AI يقرأ فقط من Context مصرح به.

مثال:

```text
Laboratory
   ↓
Authorized Context
   ↓
AI Advisory
   ↓
Suggestion
   ↓
Human
```

ولا:

```text
AI
 ↓
Business Mutation
```

---

# 28. Cross-Domain Integration Rules

التواصل بين Domains يكون من خلال:

```text
Application Contracts
Domain/Public Interfaces
Commands
Queries
Events
Snapshots
Identifiers
Read Models
```

وليس من خلال:

```text
Direct repository access
Direct table writes
Importing another domain's internal services
Duplicating state logic
Duplicating permission rules
```

---

# 29. Cross-Domain Write Rule

Domain A ممنوع يكتب مباشرة في جداول Domain B.

مثال ممنوع:

```text
Laboratory
  ↓
UPDATE equipment
```

الصحيح:

```text
Laboratory
  ↓
Equipment Application Contract
  ↓
Equipment Domain Rules
  ↓
Equipment Repository
```

---

# 30. Cross-Domain Read Rule

للقراءة نسمح بأحد الأنماط:

```text
Public Query Contract
Read Model
Snapshot
Reporting View
Domain Event projection
```

حسب الحاجة.

لا نسمح للـUI بعمل joins عشوائية بين جداول Domains.

---

# 31. Snapshot Rule

Reference وSnapshot ليسا نفس الشيء.

## Reference

يعني:

```text
Give me current Equipment E-12
```

## Snapshot

يعني:

```text
What was Equipment E-12
when LAB-2026-0031 was approved?
```

كل Controlled Historical Record يحتاج Snapshot عندما تكون Current Master Data قابلة للتغير.

---

# 32. Domain Event Examples

أمثلة لأحداث يمكن نشرها داخليًا:

```text
ReceivingItemCreated
InspectionStarted
InspectionSubmitted
InspectionApproved
InspectionFailed
ReceivingReleased

LabTestCreated
LabTestSubmitted
LabTestApproved
LabTestVoided

FindingCreated
NCRCreated
CAPAClosed

CalibrationDue
CalibrationOverdue

DocumentApproved
DocumentSuperseded

ChangeRequestSubmitted
ChangeRequestApproved

TaskAssigned
TaskCompleted
```

الـEvent لا يسمح بتجاوز Business Rules.

---

# 33. Canonical Ownership Examples

## Example 1

```text
Item Code
```

إذا كان جزءًا من Receiving Record:

النسخة التاريخية داخل Receiving ملك Quarantine.

أما Product Master مستقبلاً، إذا تم إنشاء Product Catalog Domain مستقل، سيكون له Owner منفصل.

---

## Example 2

```text
WI Revision
```

Current revision:

```text
Controlled Documents
```

Revision used in Lab Test:

```text
Laboratory Snapshot
```

---

## Example 3

```text
Equipment calibration status
```

Current status:

```text
Equipment Domain
```

Status used at time of Test:

```text
Laboratory Historical Snapshot
```

---

# 34. Domain Isolation Rules

كل Domain يجب أن يستطيع الإجابة بوضوح عن:

```text
What do I own?
What can I change?
What can I only reference?
What events do I publish?
What events do I consume?
What rules belong here?
```

إذا لم نستطع الإجابة، فالحدود غير واضحة.

---

# 35. Forbidden Architecture Patterns

ممنوع:

```text
God Service
```

مثل:

```text
qcService.ts
```

يحتوي كل النظام.

ممنوع:

```text
shared/business-rules/
```

كمكان لرمي Business Rules غير المعروفة الملكية.

ممنوع:

```text
UI → PostgreSQL
```

ممنوع:

```text
Route → raw SQL
```

إذا كان يتجاوز Application/Domain Layer.

ممنوع:

```text
Domain A → Domain B tables
```

للتعديل المباشر.

ممنوع:

```text
Duplicate State Machines
```

ممنوع:

```text
Duplicate Permission Maps
```

ممنوع:

```text
Reporting → Business Mutation
```

ممنوع:

```text
AI → Controlled Mutation
```

---

# 36. Dependency Direction

الاتجاه القياسي داخل Domain:

```text
UI
 ↓
Application
 ↓
Domain
 ↓
Ports
 ↑
Infrastructure
```

والـInfrastructure يعتمد على Domain Contracts.

وليس العكس.

---

# 37. Suggested Source Structure

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
    audit/
    database/
    transactions/
    files/
    notifications/
    validation/
    security/
    errors/
    observability/
    search/
    time/

  platform/

    health/
    backup/
    recovery/

  ui/

    dashboard/
    design-system/
    components/
    forms/
    tables/
    navigation/
    feedback/
```

هذه Structure مبدئية ويجب أن تحافظ دائمًا على Domain Boundaries حتى لو تغيرت أسماء المجلدات لاحقًا.

---

# 38. Domain Boundary Enforcement

يجب لاحقًا إنشاء Architecture Tests تمنع:

```text
UI importing database adapters
UI importing repositories
Domain importing UI
Domain importing infrastructure
Direct cross-domain repository access
Duplicate permission definitions
Duplicate state definitions
AI importing controlled mutation handlers
Reporting invoking mutation handlers
```

---

# 39. Domain-to-Document Mapping

بعد هذه الوثيقة، يتم توسيع التفاصيل في:

```text
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

# 40. What This Document Does Not Decide

هذه الوثيقة تحدد:

```text
Ownership
Boundaries
Responsibilities
Interactions
Dependency Rules
```

ولا تحدد بالتفصيل:

```text
Who can approve what
Exact workflow transitions
Scientific limits
Sampling rules
Exact database columns
Exact validation rules
Exact role permissions
```

هذه القرارات تكون في الوثائق التالية.

وبالتالي لا يجوز استخدام DOMAIN-MAP كمبرر لاختراع Business Rule غير معتمد.

---

# 41. Final Domain Ownership Summary

```text
Tasks
→ General operational work

Quality
→ Findings / NCR / RCA / CAPA

Quarantine
→ Receiving / Inspection / Release workflow

Laboratory
→ Tests / Samples / Measurements / Results / Retests

Equipment
→ Equipment / Calibration / Maintenance

Controlled Documents
→ WI / SOP / Versions / Revisions

Approvals
→ Shared review & approval infrastructure

E-Signatures
→ Signature evidence

Change Requests
→ Controlled change workflow

Reporting
→ Canonical reporting contracts and datasets

Identity
→ Users / credentials / sessions

Administration
→ Administrative governance

Authorization
→ Central policy enforcement

Audit
→ Immutable business audit history

Files & Evidence
→ File metadata and object storage abstraction

Notifications
→ Event-driven user notifications

Search
→ Authorized cross-domain discovery

Dashboard
→ Role-based read composition

System Health
→ Runtime and readiness visibility

Backup & Recovery
→ Backup / restore evidence

AI Advisory
→ Human-supporting advisory capability only
```

---

# 42. Final Rule

إذا اختلفنا لاحقًا على مكان Feature أو Table أو Business Rule، نسأل أولًا:

> **من هو المالك الحقيقي لهذه الحقيقة من منظور العمل؟**

ثم يوضع المنطق والبيانات داخل ذلك الـDomain.

ولا نسمح بسهولة التنفيذ أو شكل الصفحة أو مكان الزر بتحديد Architecture النظام.

---

# Status

```text
Document:
DOMAIN-MAP.md

Version:
1.0

Architecture:
Modular Monolith

Database:
PostgreSQL

Status:
FOUNDATION — APPROVED DOMAIN BOUNDARIES

Next Foundation Document:
BUSINESS-RULES.md
```
