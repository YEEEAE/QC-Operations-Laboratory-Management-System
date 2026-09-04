# ARCHITECTURE-SPECIFICATION.md

# QC Operations & Laboratory Management System

## Technical Architecture Specification — v1.0

**Document Path:** `Documents/ARCHITECTURE-SPECIFICATION.md`
**Status:** FOUNDATION — APPROVED ARCHITECTURE BASELINE
**Product:** QC Operations & Laboratory Management System
**Architecture:** Modular Monolith
**Web Framework:** Astro
**Rendering Model:** Server-rendered / On-demand
**Runtime Target:** Node.js
**Database:** PostgreSQL
**Authorization:** Centralized Server-Side
**Operational Timezone:** `Asia/Riyadh`

---

# 1. Purpose

هذه الوثيقة تحدد **كيف يتم بناء النظام تقنيًا**.

الوثائق السابقة تحدد:

```text
What the system must do
```

أما هذه الوثيقة تحدد:

```text
How the system must be structured
```

بحيث يتحول:

```text
Business Requirement
        ↓
Permission
        ↓
State Machine
        ↓
Data Model
```

إلى تطبيق Astro + PostgreSQL بدون كسر:

* Domain boundaries.
* Authorization.
* Auditability.
* Data integrity.
* Historical integrity.
* Separation of Duties.
* Transactions.
* Concurrency.
* Controlled workflows.

---

# 2. Architecture Authority

هذه الوثيقة تعمل تحت المرجعية التالية:

```text
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
Documents/ARCHITECTURE-SPECIFICATION.md
```

هذه الوثيقة لا يحق لها اختراع Business Rule تخالف المصادر الأعلى.

---

# 3. Core Architecture Decision

الـArchitecture الرسمية:

> **Domain-First Astro Modular Monolith**

وليست:

```text
Microservices
API-first distributed platform
Client-heavy SPA
Serverless functions scattered by feature
Pages directly connected to PostgreSQL
```

النظام عبارة عن:

```text
One deployable application
One PostgreSQL database
Clear domain boundaries
Central security
Central audit capability
Shared infrastructure
Independent domain modules
```

---

# 4. Core Principle

> **Astro owns delivery. Domain owns business truth.**

Astro مسؤول عن:

* Routes.
* Server rendering.
* Request handling.
* Actions.
* API endpoints.
* Middleware.
* UI composition.
* Client Islands.

Astro ليس مسؤولًا عن تعريف:

* Business Rules.
* Permissions.
* State Machines.
* Scientific acceptance logic.
* Approval policy.
* Release policy.
* Historical integrity rules.

---

# 5. Technology Baseline

## Approved

```text
Web Framework:
Astro

Rendering:
Server / On-demand

Runtime:
Node.js

Database:
PostgreSQL

Architecture:
Modular Monolith

Primary Technical IDs:
UUID

Event Time:
TIMESTAMPTZ

Internal Time:
UTC

Display Timezone:
Asia/Riyadh

Authentication Model:
Server-side session

Authorization:
Server-side centralized policy

Historical Controlled Context:
Immutable snapshots

Concurrency:
Optimistic versioning

Files:
PostgreSQL metadata + Object Storage binary
```

---

# 6. Technology Decisions Not Yet Locked

هذه التفاصيل لا تُخترع داخل feature implementation:

```text
Exact Astro version
Exact Node.js version
Package manager
PostgreSQL driver
ORM/query builder
Migration framework
Object storage provider
Email provider
Background-job runtime
Charting library
Client UI framework
Monitoring provider
Deployment provider
```

يتم حسم كل قرار منها صراحة عند الحاجة.

---

# 7. Astro Rendering Model

التطبيق ليس Static Site.

النمط الافتراضي:

```text
Astro
+
On-demand/server rendering
+
Node adapter
```

الصفحات المحمية والوظائف التشغيلية تُنفذ عند الطلب.

Static prerendering يمكن استخدامه فقط إذا ظهر مستقبلًا content عام لا يحتاج:

```text
Authentication
Authorization
User-specific data
Database query
Controlled mutation
```

---

# 8. Runtime Model

النظام يحتاج Runtime Server دائم قادر على:

```text
Authenticate sessions
Connect to PostgreSQL
Run transactions
Execute Astro Actions
Serve API endpoints
Generate reports
Access Object Storage
Write Audit events
Create Outbox events
Run health/readiness checks
```

لذلك Runtime المستهدف:

```text
Node.js
```

---

# 9. Node Adapter

الـAstro deployment يجب أن يستخدم adapter متوافق مع server/on-demand rendering.

Foundation decision:

```text
@astrojs/node
```

Exact deployment mode:

```text
standalone
or
middleware
```

يُحسم في Deployment Specification.

الـArchitecture الأساسية لا تعتمد على Provider معين.

---

# 10. Top-Level Source Structure

الهيكل المستهدف:

```text
src/
├── pages/
├── actions/
├── middleware.ts
│
├── modules/
│   ├── identity/
│   ├── tasks/
│   ├── quality/
│   ├── quarantine/
│   ├── laboratory/
│   ├── equipment/
│   ├── documents/
│   ├── approvals/
│   ├── change-requests/
│   ├── reporting/
│   ├── administration/
│   └── ai/
│
├── shared/
│   ├── authorization/
│   ├── database/
│   ├── transactions/
│   ├── audit/
│   ├── validation/
│   ├── security/
│   ├── errors/
│   ├── files/
│   ├── notifications/
│   ├── observability/
│   ├── search/
│   └── time/
│
├── platform/
│   ├── health/
│   ├── backup/
│   └── recovery/
│
└── ui/
    ├── design-system/
    ├── components/
    ├── forms/
    ├── tables/
    ├── navigation/
    └── feedback/
```

---

# 11. Delivery Layer

هذه تعتبر Delivery Layer:

```text
src/pages/
src/actions/
src/middleware.ts
Astro API endpoints
Client Islands
```

وظيفتها:

```text
HTTP
Rendering
Input transport
Session context
Response mapping
UI interaction
```

ولا تملك Business Truth.

---

# 12. Domain Module Structure

كل Domain يستخدم بنية واضحة:

```text
src/modules/{domain}/

├── domain/
│   ├── entities/
│   ├── value-objects/
│   ├── rules/
│   ├── state-machines/
│   └── ports/
│
├── application/
│   ├── commands/
│   ├── queries/
│   └── use-cases/
│
├── infrastructure/
│   ├── repositories/
│   └── persistence/
│
└── tests/
```

ليس إلزاميًا إنشاء كل folder إذا لم يحتجها Domain.

YAGNI applies.

---

# 13. Domain Layer

الـDomain Layer يحتوي:

```text
Entities
Business Rules
State validation
Domain invariants
Value objects
Domain-specific decisions
```

ويجب أن يكون قدر الإمكان مستقلًا عن:

```text
Astro
HTTP
Cookies
HTML
PostgreSQL driver
UI library
Object storage SDK
```

---

# 14. Application Layer

Application Layer مسؤول عن Use Cases.

مثال:

```text
ApproveInspectionReport
SubmitLabTest
ReleaseReceivingItem
CloseNcr
ApplyChangeRequest
SupersedeDocumentVersion
```

ويقوم بالـorchestration بين:

```text
Actor
Authorization
Domain
Repositories
Transaction
Audit
Outbox
```

---

# 15. Infrastructure Layer

Infrastructure مسؤول عن implementations التقنية مثل:

```text
PostgreSQL repositories
Object storage adapter
Email adapter
External system adapter
Report rendering adapter
```

ولا يحدد Business Rule.

---

# 16. Canonical Mutation Flow

أي controlled mutation تمشي عبر:

```text
Browser
        ↓
Astro Page / Client Island
        ↓
Astro Action / API Endpoint
        ↓
Input Validation
        ↓
Authenticated Request Context
        ↓
Application Use Case
        ↓
Authorization
        ↓
Domain Rules
        ↓
State Machine
        ↓
Transaction
        ↓
Repositories
        ↓
PostgreSQL
        ↓
Audit
        ↓
Outbox
        ↓
Response
```

---

# 17. Canonical Read Flow

القراءة:

```text
Astro Page
        ↓
Query Application Service
        ↓
Authorization / Scope
        ↓
Read Repository / Read Model
        ↓
PostgreSQL
        ↓
View Model
        ↓
Astro Render
```

---

# 18. Forbidden Direct Path

ممنوع:

```text
Astro Page
    ↓
PostgreSQL
```

ممنوع:

```text
Client Island
    ↓
Database
```

ممنوع:

```text
UI Component
    ↓
Repository
```

ممنوع:

```text
Astro Action
    ↓
Raw SQL
```

إذا كان يتجاوز Application/Domain boundary.

---

# 19. Astro Pages

`src/pages/` مسؤول عن:

* Route composition.
* Page-level loading.
* Calling authorized query services.
* Rendering.
* Layout.
* Redirect mapping.

ممنوع داخل `.astro`:

```text
Business state transition
Permission definition
Direct SQL
Scientific PASS/FAIL calculation
Approval policy
Release logic
```

---

# 20. Astro Actions

Astro Actions هي الطريقة الافتراضية للـinternal application mutations عندما لا نحتاج HTTP API عام مستقل.

أمثلة:

```text
createTask
assignTask

createReceivingItem
startInspection
submitInspection
approveInspection

createLabTest
submitLabTest
approveLabTest
requestRetest

createNcr
submitRca
closeCapa

submitDocument
approveDocument

submitChangeRequest
approveChangeRequest
```

---

# 21. Action Rule

كل Astro Action تعتبر Server Entry Point.

لذلك كل Action حساسة يجب أن تنفذ:

```text
Validate input
Resolve authenticated actor
Call Application Use Case
Reauthorize action
Validate scope
Validate record state
Validate record version
Map controlled errors
```

إخفاء زر من UI لا يحمي Action.

---

# 22. Thin Action Principle

Action يجب أن تكون Thin Adapter.

مثال conceptual:

```text
Action
  ↓
Validate transport input
  ↓
Resolve actor
  ↓
ApproveInspectionReportUseCase.execute(...)
  ↓
Map result/error
```

ولا تتحول إلى ملف 500 سطر يحتوي كل الـBusiness Logic.

---

# 23. API Endpoints

API endpoints تستخدم عندما نحتاج Contract HTTP مستقل.

Examples:

```text
/health
/readiness

/report downloads
/file downloads
/external integrations
/webhooks
/machine-to-machine APIs
```

وليست default لكل internal mutation.

---

# 24. API Ownership

API endpoint يتبع نفس القواعد:

```text
API Endpoint
    ↓
Application Use Case
```

وليس:

```text
API Endpoint
    ↓
Database
```

---

# 25. Middleware Responsibility

`src/middleware.ts` يمكن أن يقوم بـ:

```text
Request ID
Session cookie parsing
Session resolution
Actor resolution
Basic protected-route gate
Security headers
Request context
Observability context
```

---

# 26. Middleware Limitation

Middleware ليس Domain Authorization Engine.

مثال:

```text
Middleware:
Actor authenticated ✅

Use Case:
Can actor approve THIS inspection? ← still required
```

لا يكفي:

```text
if role === "MANAGER"
  allow everything
```

---

# 27. Request Context

كل request محمية يجب أن تحمل Context موحدًا.

Conceptually:

```text
RequestContext {
  requestId
  actor
  sessionId
  requestTime
  locale
  timezone
}
```

لا يتم قبول `actorId` من browser كحقيقة موثوقة.

---

# 28. Authentication Architecture

النظام يعتمد:

> **Server-side opaque sessions**

المسار:

```text
Browser
   ↓
Secure HttpOnly Cookie
   ↓
Opaque Session Identifier
   ↓
PostgreSQL sessions
   ↓
Middleware
   ↓
Authenticated Actor Context
```

---

# 29. Session Security

Cookie يجب أن يكون مناسبًا للبيئة التشغيلية ويشمل على الأقل:

```text
HttpOnly
Secure in production
SameSite policy
Controlled expiration
```

Exact cookie policy تثبت في Security Architecture.

---

# 30. Session Source of Truth

الـIdentity Domain وPostgreSQL هما المصدر الرسمي لحالة session/authentication.

Astro Session APIs يمكن استخدامها كقدرة Framework عندما تكون مناسبة، لكن لا تصبح بديلًا ضمنيًا عن:

```text
users
sessions
account state
revocation
password-reset invalidation
audit requirements
```

---

# 31. Authentication vs Authorization

```text
Authentication:
Who are you?

Authorization:
Are you allowed to perform this action
on this entity
in this state
inside this scope
under current SoD policy?
```

لا يتم دمج المفهومين.

---

# 32. Authorization Architecture

المصدر المركزي:

```text
src/shared/authorization/
├── permissions.ts
├── policies.ts
├── scopes.ts
├── authorize.ts
└── types.ts
```

Exact file names قابلة للتعديل إذا لم يتغير المبدأ.

---

# 33. Authorization Formula

كل controlled action يجب أن تعتمد:

```text
Authenticated Actor
+
Account State
+
Explicit Permission
+
Scope
+
Entity
+
Entity State
+
Ownership / Assignment
+
Separation of Duties
+
Expected Version
+
Required E-Signature
+
Business Rules
=
Decision
```

---

# 34. Default Deny

القاعدة:

```text
No explicit Allow
=
DENY
```

Policy غير محسومة:

```text
DENY
```

صلاحية غير معروفة:

```text
DENY
```

---

# 35. Role Is Not Permission

ممنوع pattern عام مثل:

```text
if actor.role === "ADMIN"
  return true
```

أو:

```text
if actor.role === "MANAGER"
  approve()
```

الأدوار مدخل للسياسة، وليست bypass.

---

# 36. Scope Architecture

Authorization يجب أن تكون قابلة لدعم scopes مثل:

```text
OWN
ASSIGNED
TEAM
DEPARTMENT
SITE
DOMAIN
GLOBAL
```

لكن organizational model غير المؤكد لا يتم اختراعه في schema قبل اعتماده.

---

# 37. Separation of Duties

SoD تطبق داخل Server-side authorization/use case.

مثال:

```text
Author
≠
Reviewer
```

أو أي policy تعتمد لاحقًا.

UI يمكن أن يخفي Action مسبقًا لتحسين UX، لكن server يعيد الفحص.

---

# 38. PostgreSQL Ownership

PostgreSQL هو:

> **Authoritative operational persistence layer**

ويملك:

```text
Normalized current business facts
Controlled workflow records
Audit records
Session state
Historical references
Snapshot metadata/content
File metadata
Outbox events
Backup/restore metadata
```

---

# 39. Database Access Boundary

المسموح بالوصول المباشر لقاعدة البيانات:

```text
Infrastructure repositories
Shared database infrastructure
Migration tooling
Purpose-built read-model/query infrastructure
```

غير المسموح:

```text
UI
Astro pages
Client Islands
Design-system components
Random utility files
```

---

# 40. Repository Principle

Application layer يتعامل مع contracts.

مثال:

```text
InspectionRepository
LabTestRepository
ReceivingRepository
```

ولا يعتمد مباشرة على SQL driver APIs.

---

# 41. ORM / Query Builder Decision

Exact persistence library:

```text
UNCONFIRMED
```

المتطلبات قبل الاختيار:

```text
Strong PostgreSQL support
Transactions
Row locks
Raw SQL escape hatch
Migration discipline
Type safety
Predictable SQL
Testing support
Connection pooling support
```

لا يتم اختيار ORM بناءً على الشعبية فقط.

---

# 42. Repository Ownership Rule

كل Domain يكتب إلى الجداول التي يملكها فقط.

مثال:

```text
LaboratoryRepository
```

لا يقوم بـ:

```text
UPDATE receiving_items
```

مباشرة.

---

# 43. Cross-Domain Write Rule

إذا Laboratory يحتاج تغيير Quarantine state:

```text
Laboratory Application
        ↓
Quarantine Application Contract
```

أو orchestration رسمي يملك العملية العابرة للDomains.

ممنوع:

```text
Domain A
→ Domain B repository implementation
```

---

# 44. Cross-Domain Reads

Cross-domain reads يمكن أن تستخدم:

```text
Queries
Public contracts
Read models
Stable IDs
Snapshots
```

بحسب الحاجة.

FK لا يعني write ownership.

---

# 45. Public Domain Contracts

أي capability يستخدمها Domain آخر يجب أن تكون عبر contract واضح.

مثال conceptual:

```text
QuarantineQueries.getReceivingContext(...)
DocumentsQueries.getEffectiveVersion(...)
EquipmentQueries.getCalibrationContext(...)
```

---

# 46. Transaction Architecture

أي critical mutation يجب أن تعرف Transaction Boundary صراحة.

أمثلة:

```text
Approval
Release
Void
Close
Supersede
Change Request Apply
Calibration Current Transition
Retest Authorization
```

---

# 47. Inspection Approval Transaction

Conceptual flow:

```text
BEGIN

Load report
Check expected version
Authorize actor
Check scope
Check SoD
Check state
Validate required evidence
Validate controlled snapshot
Create approval decision
Create E-Signature if required
Transition report
Apply required receiving consequence
Write audit
Write outbox

COMMIT
```

أي failure:

```text
ROLLBACK
```

---

# 48. Transaction Failure Principle

ممنوع الوصول لحالة:

```text
Business State = changed
Audit = missing
Approval Decision = missing
Required consequence = missing
```

للعمليات التي يجب أن تكون atomic.

---

# 49. Concurrency Architecture

السجلات الحساسة تستخدم optimistic concurrency.

Client يحصل:

```text
version = N
```

Mutation ترسل:

```text
expectedVersion = N
```

Server ينفذ فقط إذا:

```text
currentVersion === expectedVersion
```

ثم:

```text
version = N + 1
```

---

# 50. Stale Mutation

عند تغير version:

```text
STALE_VERSION
```

ولا يتم overwrite بصمت.

المستخدم يحصل على recovery path واضح.

---

# 51. Row Locking

PostgreSQL row locks يمكن استخدامها عندما تكون optimistic version وحدها غير كافية، خصوصًا في:

```text
Business-number allocation
Release
Approval
Current calibration transition
Document supersession
Change Request application
```

Exact locking strategy يتم تحديدها داخل use case.

---

# 52. Idempotency

Critical commands يجب أن تتحمل retries حيث applicable.

Examples:

```text
Submit
Approve
Release
Void
Close
Complete
Retest authorization
Backup request
```

إعادة نفس الطلب لا يجوز أن تنشئ:

```text
Duplicate approval
Duplicate release
Duplicate audit consequence
Duplicate CAPA close
```

---

# 53. Idempotency Storage

Physical implementation:

```text
UNCONFIRMED
```

خيارات لاحقة:

```text
Request key in domain record
Dedicated idempotency table
Unique business constraint
Command-specific dedupe rule
```

المهم هو السلوك، لا التقنية بعينها.

---

# 54. Business ID Generation

Business IDs مثل:

```text
RCV-...
IR-...
LAB-...
NCR-...
```

يجب توليدها بطريقة race-safe.

ممنوع:

```text
SELECT MAX(number) + 1
```

كحل غير محمي.

---

# 55. State Machines

State definitions الرسمية تأتي من:

```text
Documents/STATE-MACHINES.md
```

ولا يتم إنشاء State Machine ثانية داخل UI أو Action.

---

# 56. Client State Is Not Authority

Browser يمكن أن يعرض:

```text
currentState
```

لكن لا يحدد state النهائي.

ممنوع client يقول:

```text
state = APPROVED
```

كـgeneric update.

Client يرسل intent:

```text
approve
```

والServer يقرر transition.

---

# 57. Controlled Mutations

بدل:

```text
PATCH /inspection
{
  state: "APPROVED"
}
```

نستخدم operation intention:

```text
approveInspection(...)
```

حتى يمر عبر القواعد الصحيحة.

---

# 58. Audit Architecture

Audit capability مستقلة عن application logging.

Application logs:

```text
diagnostics
errors
performance
runtime behavior
```

Audit:

```text
business/security history
actor
entity
action
state
reason
timestamp
requestId
```

---

# 59. Audit Write Rule

Important mutation تكتب audit event في نفس transaction عندما integrity تتطلب ذلك.

Audit event لا يتم إنشاؤها من browser.

---

# 60. Audit Immutability

Normal application path:

```text
INSERT allowed
UPDATE denied
DELETE denied
```

للـaudit history.

Cryptographic chaining:

```text
UNCONFIRMED
```

ولا يتم ادعاء tamper-proof cryptography بدون implementation/evidence.

---

# 61. E-Signature Architecture

E-Signature عملية مستقلة عن الضغط على Approve.

Flow:

```text
Action intent
        ↓
Show meaning
        ↓
Reauthenticate
        ↓
Reauthorize
        ↓
Validate version/state/SoD
        ↓
Bind exact subject snapshot/version
        ↓
Create signature evidence
        ↓
Perform controlled transition
        ↓
Audit
```

---

# 62. Password Handling

E-Signature لا تخزن:

```text
plaintext password
password copy
reauthentication secret
```

Password تستخدم فقط للتحقق عند الطلب ثم تُتلف.

---

# 63. Historical Snapshots

Snapshot تستخدم عندما نحتاج الحفاظ على truth وقت التنفيذ.

Examples:

```text
Receiving context at inspection
Inspection template version
Lab template version
Scientific acceptance criteria
Equipment state at test
Calibration used
Document version used
```

---

# 64. Snapshot Rule

Master data الجديدة لا تعيد كتابة snapshot قديمة.

مثال:

```text
Equipment name changed today
```

لا يغير:

```text
Equipment snapshot inside approved Lab Test from last year
```

---

# 65. Snapshot Integrity

Controlled snapshot يجب أن:

```text
Have schema version
Have stable canonical serialization
Have integrity hash where required
Be immutable after finalization
```

Exact canonicalization algorithm يتم حسمه قبل implementation.

---

# 66. Files Architecture

Binary file:

```text
Object Storage
```

Metadata:

```text
PostgreSQL
```

---

# 67. File Flow

```text
Upload request
   ↓
Server validation
   ↓
File security checks
   ↓
Hash
   ↓
Object storage
   ↓
PostgreSQL metadata
   ↓
Evidence link
   ↓
Audit where required
```

---

# 68. File Authorization

وجود URL لا يعني صلاحية.

Download flow:

```text
Request
  ↓
Authenticate
  ↓
Authorize parent entity/evidence
  ↓
Resolve file
  ↓
Stream or signed short-lived delivery
```

Exact delivery technique provider-dependent.

---

# 69. File Replacement

Controlled file لا يتم overwrite خلف نفس identity.

Replacement:

```text
New binary
New file record
New hash
Controlled relationship/version
```

---

# 70. Outbox Pattern

الأعمال الثانوية غير الحرجة لا تربط نجاح business transaction بها.

Pattern:

```text
BEGIN

Business mutation
Audit
Outbox event

COMMIT
```

ثم:

```text
Outbox processor
    ↓
Notification
Email
Search indexing
External integration
```

---

# 71. Why Outbox

حتى لا يحدث:

```text
Inspection APPROVED
↓
Email provider failed
↓
Transaction rolled back incorrectly
```

أو العكس.

Business truth لا يعتمد على توفر email provider.

---

# 72. Background Work

في Foundation:

```text
No complex distributed job platform by default
```

Background processing يبقى بسيطًا ومتماشيًا مع Modular Monolith.

يتم إدخال Queue/Broker فقط عند وجود requirement حقيقية.

---

# 73. Notifications

Notification system لا يملك Business Truth.

مثلًا:

```text
"You have an approval"
```

هي notification.

لكن authoritative pending approval:

```text
approval_work_items
```

---

# 74. Search Architecture

Search capability:

```text
Read-only
Authorization-aware
Derived
```

Search index لا يصبح authoritative datastore.

---

# 75. Search Authorization

نتيجة البحث لا يجوز أن تكشف:

```text
record existence
title
lot
item
status
document metadata
```

إذا المستخدم غير مصرح له برؤية السجل.

---

# 76. Reporting Architecture

كل Report يملك:

```text
Canonical report definition
Canonical dataset/query
Authorization rule
Scope resolution
Filter contract
Export contract
```

---

# 77. One Dataset Principle

UI report و:

```text
CSV
XLSX
PDF
```

يستخدمون نفس canonical dataset.

ممنوع 4 implementations مختلفة لنفس التقرير.

---

# 78. Report Flow

```text
Report Request
      ↓
Authenticate
      ↓
Authorize report
      ↓
Resolve scope
      ↓
Validate filters
      ↓
Canonical query service
      ↓
Canonical dataset
      ↓
Screen / CSV / XLSX / PDF
```

---

# 79. Dashboard Architecture

Dashboard عبارة عن:

> **Operational Composition / Read Model**

ولا يملك authoritative business data.

---

# 80. Dashboard Primary Question

الهدف:

> **What needs my attention right now?**

وليس مجرد عرض charts.

---

# 81. Dashboard Read Models

Dashboard لا يسحب كل records للـUI ثم يحسبها.

المسار:

```text
Dashboard Page
      ↓
Dashboard Query Service
      ↓
Actor + Scope
      ↓
Optimized PostgreSQL Aggregates
      ↓
Dashboard Read Model
      ↓
Astro Render
```

---

# 82. Dashboard Read Model Example

Conceptual only:

```text
DashboardReadModel {
  pendingTasks
  pendingInspections
  holdReceivingItems
  failedInspections
  pendingApprovals
  openNcr
  capaDue
  overdueCalibration
  labTestsUnderReview
  recentActivity
}
```

Exact fields تعتمد على Role/requirements.

---

# 83. Server-Side KPI Rule

KPI calculations المهمة تتم Server-side.

ممنوع:

```text
Fetch 20,000 records
→ browser
→ calculate KPI
```

---

# 84. Dashboard Scope

Dashboard Query نفسها authorization-aware.

مثال:

Employee لا يحصل على organization-wide count ثم نخفي card.

Query نفسها ترجع scope الصحيح.

---

# 85. Dashboard Visual Direction

الـArchitecture تسمح بتصميم Dashboard حديث شبيه من حيث الاتجاه العام بـ:

```text
Enterprise Operations SaaS Dashboard
Modular KPI Cards
Operational Status Indicators
Charts
Dense but readable information hierarchy
```

لكن `ARCHITECTURE-SPECIFICATION.md` لا تحدد:

```text
colors
typography
card radius
spacing
sidebar visual style
animation
exact chart appearance
```

هذه تذهب إلى:

```text
DESIGN-SYSTEM.md
UI-UX-SPECIFICATION.md
```

---

# 86. Realtime Principle

النظام لا يعتمد Realtime Architecture شامل من البداية.

Default:

```text
Server-rendered data
+
Explicit refresh
+
Targeted polling where useful
```

---

# 87. Realtime Escalation

WebSockets / Server-Sent Events / realtime infrastructure تستخدم فقط إذا Requirement تثبت الحاجة.

Examples where later useful:

```text
Notifications
live operational alerts
long-running task progress
```

لكن لا يتم إدخالها system-wide مسبقًا.

---

# 88. Client Islands

Astro Client Islands تستخدم فقط للأجزاء التي تحتاج interactivity فعلية.

Examples:

```text
Charts
Advanced Data Grid
Lab Measurement Grid
Inspection Result Grid
Bulk Paste
Advanced Filters
Autosave Draft UX
Complex Modal Workflows
```

---

# 89. Hydration Rule

لا تستخدم hydration لمكون لا يحتاج browser runtime.

Default:

```text
Server HTML
```

Client runtime:

```text
Only when justified
```

---

# 90. Client Framework

إذا احتجنا React/Svelte/Vue لمكونات islands:

```text
UNCONFIRMED
```

يتم اختيار واحد بناءً على:

```text
Grid/form ecosystem
Bundle impact
Team maintainability
Testing
Astro integration
```

ولا يتم خلط عدة frameworks بدون مبرر قوي.

---

# 91. Validation Architecture

Validation أربع طبقات:

```text
UI
↓
Transport/Schema
↓
Application/Domain
↓
PostgreSQL constraints
```

---

# 92. UI Validation

وظيفتها:

```text
Fast user feedback
Formatting
Required hints
Accessible errors
```

ولا تعتبر Security boundary.

---

# 93. Transport Validation

Astro Action/API input تخضع لSchema validation.

تمنع:

```text
Unexpected fields
Wrong types
Malformed IDs
Invalid basic format
```

---

# 94. Domain Validation

تطبق:

```text
Business rules
State rules
Controlled limits
Permissions-dependent preconditions
```

---

# 95. Database Validation

PostgreSQL يحمي structural invariants عبر:

```text
PK
FK
NOT NULL
CHECK
UNIQUE
Indexes
Transactions
```

---

# 96. Error Architecture

Error يجب أن يكون:

```text
Stable
Safe
Machine-readable
User-recoverable where possible
Traceable by requestId
```

---

# 97. Error Classes

Conceptually:

```text
AUTHENTICATION_REQUIRED
AUTHORIZATION_DENIED
SCOPE_DENIED
VALIDATION_FAILED
INVALID_STATE_TRANSITION
STALE_VERSION
SOD_VIOLATION
SIGNATURE_REQUIRED
RESOURCE_NOT_FOUND
CONFLICT
RATE_LIMITED
INTERNAL_ERROR
```

Exact registry لاحقًا في Error Architecture.

---

# 98. Error Leakage Rule

ممنوع عرض:

```text
SQL
table names
stack traces
filesystem paths
secrets
internal policy details
```

للمستخدم النهائي.

---

# 99. IDOR-Safe Behavior

Unauthorized user لا يجب يحصل على useful existence leak.

Response behavior يحدد في Security Architecture.

---

# 100. Observability

Observability تشمل:

```text
Structured application logs
Request IDs
Error tracking
Performance metrics
DB pool health
Background processing health
Health/readiness
```

---

# 101. Logging vs Audit

```text
Log:
system behavior

Audit:
business/security history
```

لا تستخدم أحدهما بديلًا للآخر.

---

# 102. Request ID

كل inbound request مهم يحصل على:

```text
requestId
```

ويمر عبر:

```text
request
use case
logs
audit where relevant
error response
background event metadata
```

---

# 103. Health Endpoint

```text
/health
```

يعني:

> هل process/application تعمل؟

يجب أن يكون lightweight.

---

# 104. Readiness Endpoint

```text
/readiness
```

يعني:

> هل التطبيق قادر حاليًا على خدمة العمليات المطلوبة؟

يمكن أن يشمل:

```text
PostgreSQL connectivity
critical dependencies
```

---

# 105. Health Is Not Release Readiness

```text
HTTP 200 /health
```

لا يعني:

```text
Production Ready
```

---

# 106. Backup Architecture Boundary

Backup/Recovery Platform capability منفصلة عن ordinary business modules.

Data model:

```text
backup_runs
restore_runs
```

لكن تنفيذ الـbackup provider/environment-specific.

---

# 107. Backup Semantics

تظل منفصلة:

```text
CREATED
VERIFIED
RESTORE PROVEN
```

لا يتم اختصارها إلى:

```text
backupSuccess = true
```

---

# 108. AI Architecture

AI موجود داخل:

```text
src/modules/ai/
```

لكن AI Advisory فقط.

---

# 109. AI Boundary

AI لا يملك:

```text
Approve
Reject
Release
Sign
PASS
FAIL
Void
Close
```

---

# 110. AI Mutation Rule

AI يمكن أن يقترح:

```text
Summary
Draft
Classification suggestion
Trend insight
Risk indicator
Explanation
```

لكن controlled mutation تتطلب human-authorized normal use case.

---

# 111. AI Data Access

AI يحصل فقط على authorized minimum context.

لا يتم إرسال entire database context لمجرد أنه مفيد للنموذج.

---

# 112. AI Provider Independence

Application should hide provider-specific calls behind AI adapter/service contract.

حتى لا يصبح Domain مرتبطًا بمزود واحد.

---

# 113. Environment Separation

يجب دعم:

```text
Development
Test
Staging
Production
```

---

# 114. Environment Rule

ممنوع استخدام Production DB تلقائيًا من:

```text
local dev
unit tests
integration tests
CI
```

---

# 115. Configuration

Configuration تستخدم environment/schema-validated configuration.

Secrets:

```text
outside repository
```

`.env.example` يحتوي أسماء المتغيرات فقط، بلا secrets.

---

# 116. Server-Only Secrets

أي:

```text
DB password
session secret
storage secret
email secret
AI API key
```

يبقى server-only.

لا يصل إلى client bundle.

---

# 117. Migration Architecture

Migrations:

```text
Sequential
Immutable after application
Reviewed
Machine-verifiable
```

---

# 118. Migration Rule

بعد تطبيق Migration:

```text
DO NOT EDIT HISTORY
```

إصلاح:

```text
New migration
```

---

# 119. Migration Verification

CI لاحقًا يجب أن يثبت:

```text
Fresh database migration
Upgrade from supported previous schema
Foreign keys
Constraints
Indexes
Migration ordering
Migration checksum/history
```

---

# 120. Migration Organization

يمكن تنظيمها مثل:

```text
migrations/
  001_...
  002_...
  003_...
```

لكن exact tool والنaming strategy يحسمان بعد اختيار DB tooling.

---

# 121. Database Connection Management

التطبيق يستخدم shared connection/pool infrastructure.

ممنوع إنشاء connection عشوائي داخل كل Action.

---

# 122. Database Pool

Pool configuration يكون environment-aware.

ويجب مراقبة:

```text
connections
timeouts
errors
pool exhaustion
```

---

# 123. Query Architecture

نفرق بين:

```text
Domain persistence repositories
```

و:

```text
Read-optimized queries
```

لا نضطر تمرير dashboard/reporting aggregate عبر entity repository معقد إذا read model أو query service أوضح.

---

# 124. CQRS Position

لا نعتمد full CQRS architecture.

لكن نسمح بفصل منطقي:

```text
Commands
Queries
```

داخل Modular Monolith.

---

# 125. Caching

Caching ليس default source of truth.

إذا أضيف:

```text
Cache
≠
Authorization bypass
```

ولا يجب أن يعيد data scoped لمستخدم إلى مستخدم آخر.

---

# 126. Server Pagination

Data-heavy tables تعتمد server-side:

```text
pagination
filtering
sorting
```

عند الحجم المناسب.

---

# 127. Bulk Operations

أي bulk action:

```text
Authorize every affected entity
Validate state for every entity
Use safe transaction strategy
Return per-row failure where appropriate
Audit controlled changes
```

ممنوع اعتبار permission على أول row كفاية للجميع.

---

# 128. Import Architecture

Imports لا تتجاوز validation/business rules.

Flow:

```text
Upload
↓
Parse
↓
Validate
↓
Preview
↓
Authorize
↓
Apply controlled import
↓
Audit
```

Exact import capabilities Policy-dependent.

---

# 129. Autosave

Autosave:

```text
DRAFT ONLY
```

ولا يستخدم تلقائيًا مع:

```text
Submitted
Approved
Closed
Void
Superseded
```

---

# 130. Form Architecture

Form لا يقوم generic save لأي state.

Draft mutation وcontrolled transition منفصلان.

---

# 131. UI Architecture Principle

واجهة النظام:

```text
Server-first
Progressively interactive
Role-focused
Data-dense where operationally necessary
Accessible
Keyboard-friendly
```

---

# 132. Design System Boundary

Design System لا يحتوي Business Logic.

يتعامل مع:

```text
Button
Input
Select
Table
Card
Dialog
Badge
Tabs
Toast
Form field
Layout primitives
```

لكن لا يعرف:

```text
Manager approval rule
Retest authority
PASS calculation
```

---

# 133. Status Components

Status Badge يمكن أن يعرف presentation mapping:

```text
PASS → success visual
FAIL → danger visual
HOLD → warning visual
```

لكن لا يحسب ما إذا كانت النتيجة PASS أو FAIL.

---

# 134. Accessibility Architecture

Accessibility requirement تبدأ من component primitives.

يجب دعم:

```text
Keyboard
Focus
Labels
ARIA when required
Semantic HTML
Error summary
Screen readers
Zoom
Contrast
Reduced motion
```

---

# 135. Responsive Architecture

Desktop operational workflows أولية للdata density.

لكن التطبيق يبقى usable على:

```text
Tablet
Mobile
```

ولا يتم بناء نسخة business logic مختلفة للجوال.

---

# 136. Routes

Routes هي Delivery contract.

كل route مهمة تُسجل لاحقًا في Route Manifest.

---

# 137. Route Manifest

Machine-readable manifest يجب أن يتضمن:

```text
Route ID
Path
Type
Owning domain
Authentication requirement
Required permissions
Implementation file
```

---

# 138. Route Verification

CI يتحقق:

```text
Manifest route exists
Required route not missing
No accidental duplicate
Protected route classification correct
```

---

# 139. Test Manifest

Test Manifest يجب أن يربط:

```text
Test ID
File
Requirement IDs
Domain
Test type
Execution command
```

---

# 140. Requirement Traceability

Critical implementation يجب أن يكون قابلًا للتتبع:

```text
REQ
↓
Use Case
↓
Permission
↓
State Transition
↓
Data
↓
Tests
↓
Evidence
```

---

# 141. Testing Architecture

الهرم:

```text
Domain Unit Tests
        ↓
Application Use Case Tests
        ↓
PostgreSQL Integration Tests
        ↓
Authorization Negative Tests
        ↓
Astro Action/API Tests
        ↓
E2E
```

---

# 142. Domain Tests

تثبت:

```text
Business rules
State rules
Scientific deterministic behavior
Value objects
```

بدون الحاجة لـbrowser.

---

# 143. Application Tests

تثبت:

```text
Use case orchestration
Authorization calls
Transaction behavior
Audit behavior
Outbox behavior
```

---

# 144. PostgreSQL Integration Tests

تثبت فعليًا:

```text
Constraints
FKs
Transactions
Locks
Indexes where contract matters
Migration behavior
Concurrency
```

---

# 145. Authorization Tests

لكل High-Risk permission:

```text
Allowed actor
Unauthorized actor
Wrong permission
Wrong scope
Wrong state
SoD violation
Stale version
```

حسب applicability.

---

# 146. Astro Action Tests

يجب اختبار Action كـEntry Point.

خصوصًا:

```text
Unauthenticated invocation
Direct invocation
Malformed input
Unauthorized invocation
Valid invocation
Controlled error mapping
```

---

# 147. E2E

E2E تركز على Critical User Journeys.

لا تستخدم E2E لاختبار كل branch منطقي يمكن اختباره أسرع بوحدة/تكامل.

---

# 148. Architecture Tests

نحتاج automated guards تمنع:

```text
UI → database import
Page → repository import
Domain → Astro import
Cross-domain infrastructure import
Duplicate permission definitions
Duplicate state definitions
Unregistered routes
Unregistered tests
```

---

# 149. Import Boundary Matrix

Conceptual:

| Layer             | May Import                                   |
| ----------------- | -------------------------------------------- |
| `pages`           | application queries/actions adapters, ui     |
| `actions`         | application, validation, request context     |
| `ui`              | ui/shared presentation only                  |
| `domain`          | domain-local + safe shared primitives        |
| `application`     | domain + contracts/shared policies           |
| `infrastructure`  | domain/application ports + database adapters |
| `shared/database` | DB tooling only                              |

---

# 150. Cross-Domain Import Rule

Allowed:

```text
Domain A application
→ Domain B public contract
```

Forbidden:

```text
Domain A
→ Domain B infrastructure/internal repository
```

---

# 151. Circular Dependency Rule

Circular domain dependencies تعتبر architecture smell وفشل محتمل.

يتم حلها عبر:

```text
Shared contract
Higher-level orchestration
Event/outbox
Boundary redesign
```

---

# 152. Shared Folder Rule

`shared/` ليس dumping ground.

لكي يدخل شيء إلى shared:

```text
Used across multiple domains
Stable responsibility
No domain-specific business ownership
```

---

# 153. Generic Engine Rule

لا نبني Generic Workflow Engine أو Generic Form Builder مبكرًا.

الـFoundation تفضل:

```text
Real workflows first
Abstraction later when repetition proven
```

---

# 154. No Premature Microservices

ممنوع تقسيم:

```text
Lab service
Quarantine service
Approval service
```

إلى network services بدون scalability/organizational requirement حقيقية.

---

# 155. External Integration Boundary

أي system خارجي مثل Focus مستقبلًا يكون Adapter.

مثال:

```text
Quarantine Application
      ↓
ReleaseIntegrationPort
      ↓
FocusAdapter
```

لا يتم نشر Focus SDK داخل Business Rules.

---

# 156. External Failure

External system failure لا يغيّر local business truth بشكل غامض.

يجب فصل:

```text
Local decision
External request
External acknowledgement
External failure
```

---

# 157. Security Architecture Boundary

التفاصيل الكاملة ستكون في:

```text
Documents/SECURITY-ARCHITECTURE.md
```

لكن هذه الوثيقة تثبت:

```text
Server-side auth
Default deny
Secure session
No client authority
No secret leakage
Protected files
Safe errors
Input validation
```

---

# 158. Database Architecture Boundary

Physical SQL specifics تذهب لاحقًا إلى:

```text
Documents/DATABASE-ARCHITECTURE.md
```

مثل:

```text
Exact migration tool
Exact DB driver
Exact indexes
Exact isolation choices
Exact schemas
```

---

# 159. Error Architecture Boundary

Error registry التفصيلي:

```text
Documents/ERROR-ARCHITECTURE.md
```

---

# 160. Testing Strategy Boundary

تفاصيل environments/data fixtures/commands:

```text
Documents/TESTING-STRATEGY.md
```

---

# 161. UI/UX Boundary

التصميم البصري الكامل:

```text
Documents/DESIGN-SYSTEM.md
Documents/UI-UX-SPECIFICATION.md
```

هذه الوثيقة لا تقفل الواجهة بصريًا.

---

# 162. Deployment Boundary

Deployment provider-specific design:

```text
Documents/DEPLOYMENT-ARCHITECTURE.md
```

لاحقًا.

---

# 163. Performance Architecture

Baseline:

```text
Server-side pagination
Avoid unnecessary hydration
Optimized DB queries
Indexes driven by access patterns
No massive client payloads
Streaming where appropriate
```

لكن performance claims تحتاج measurement.

---

# 164. N+1 Query Rule

Repositories/read models يجب أن تتجنب uncontrolled N+1 queries.

خصوصًا:

```text
Dashboard
Tables
Reports
Approvals
Audit timelines
```

---

# 165. Query Evidence

لا تضف index عشوائي أو caching layer قبل معرفة:

```text
Query
Cardinality
Execution pattern
Observed need
```

باستثناء obvious PK/FK/unique access needs.

---

# 166. Scientific Calculations

Scientific calculation architecture يجب أن تكون:

```text
Versioned
Deterministic
Source-controlled
Unit-aware
Precision-aware
Reproducible
Tested at boundaries
```

---

# 167. Scientific Rule Ownership

AI أو UI لا تحدد scientific criterion.

المصدر:

```text
Approved controlled source
→ Template/version
→ Snapshot
→ Deterministic calculation
```

---

# 168. Time Architecture

Server/DB trusted time تستخدم لـ:

```text
Audit
Approval
Release
Signature
State transitions
Backup
Security events
```

Browser clock ليس authoritative.

---

# 169. Date Display

Stored:

```text
UTC / TIMESTAMPTZ
```

Displayed:

```text
Asia/Riyadh
```

Pure dates تبقى `DATE`.

---

# 170. No Hidden Global State

Business behavior لا يعتمد على mutable process-global variables.

خصوصًا:

```text
Current user
Current role
Current transaction
Current company setting
```

يتم تمرير context/contracts صراحة.

---

# 171. Service Locator Rule

تجنب global service locator يخفي dependencies.

Prefer explicit dependency construction.

---

# 172. Dependency Direction

القاعدة:

```text
Delivery
   ↓
Application
   ↓
Domain
```

Infrastructure implements ports باتجاه الداخل.

Domain لا يعتمد على الخارج.

---

# 173. Composition Root

يجب وجود مكان واضح لتركيب:

```text
Repositories
Services
Authorization
Audit
Storage
External adapters
```

Exact implementation location يتحدد مع scaffold.

---

# 174. Testing Substitutability

بسبب contracts الواضحة، tests تستطيع استبدال infrastructure عند اختبار Domain/Application.

لكن PostgreSQL behavior نفسه يجب اختباره أيضًا Integration tests حقيقية.

---

# 175. Feature Completion

Feature ليست مكتملة فقط لأن route ظهرت.

Architecture completion تشمل:

```text
Use Case
Authorization
Domain Rule
Persistence
Validation
Concurrency
Audit
Error handling
Tests
Traceability
```

---

# 176. No False PASS

الـArchitecture تمنع claims مثل:

```text
"Done"
```

بدون:

```text
Current repository evidence
Current test evidence
Current environment evidence
```

حسب `REQUIREMENTS-TRACEABILITY.md`.

---

# 177. Architecture Decision Register

## ARCH-001

```text
Decision:
Modular Monolith

Status:
APPROVED
```

---

## ARCH-002

```text
Decision:
Astro is official Web Framework.

Status:
APPROVED
```

---

## ARCH-003

```text
Decision:
Server/on-demand rendering is default operational mode.

Status:
APPROVED
```

---

## ARCH-004

```text
Decision:
Node.js is runtime target.

Status:
APPROVED
```

---

## ARCH-005

```text
Decision:
PostgreSQL is authoritative relational database.

Status:
APPROVED
```

---

## ARCH-006

```text
Decision:
Astro pages/actions are Delivery Layer only.

Status:
APPROVED
```

---

## ARCH-007

```text
Decision:
Internal mutations default to Astro Actions.

Status:
APPROVED
```

---

## ARCH-008

```text
Decision:
Independent API endpoints used only when HTTP contract is justified.

Status:
APPROVED
```

---

## ARCH-009

```text
Decision:
Authentication uses server-side opaque sessions backed by canonical application identity/session state.

Status:
APPROVED
```

---

## ARCH-010

```text
Decision:
Authorization always rechecked server-side inside controlled use case/action path.

Status:
APPROVED
```

---

## ARCH-011

```text
Decision:
Dashboard is read-model driven.

Status:
APPROVED
```

---

## ARCH-012

```text
Decision:
KPI calculation occurs server-side.

Status:
APPROVED
```

---

## ARCH-013

```text
Decision:
Realtime is opt-in per feature, not system-wide.

Status:
APPROVED
```

---

## ARCH-014

```text
Decision:
Client Islands only where browser interactivity is justified.

Status:
APPROVED
```

---

## ARCH-015

```text
Decision:
Domain modules cannot directly write one another's tables.

Status:
APPROVED
```

---

## ARCH-016

```text
Decision:
Critical operations use explicit transaction boundaries.

Status:
APPROVED
```

---

## ARCH-017

```text
Decision:
Important cross-transaction side effects use durable outbox pattern.

Status:
APPROVED
```

---

## ARCH-018

```text
Decision:
File metadata in PostgreSQL; binary content in Object Storage.

Status:
APPROVED
```

---

## ARCH-019

```text
Decision:
Audit is independent from application logs.

Status:
APPROVED
```

---

## ARCH-020

```text
Decision:
Historical controlled context preserved through immutable snapshots/references.

Status:
APPROVED
```

---

# 178. Deferred Architecture Decisions

| ID          | Decision                                |
| ----------- | --------------------------------------- |
| AD-ARCH-001 | Exact Astro version                     |
| AD-ARCH-002 | Exact Node.js version                   |
| AD-ARCH-003 | Package manager                         |
| AD-ARCH-004 | PostgreSQL driver/query builder/ORM     |
| AD-ARCH-005 | Migration framework                     |
| AD-ARCH-006 | Client Island framework                 |
| AD-ARCH-007 | Charting library                        |
| AD-ARCH-008 | Object storage provider                 |
| AD-ARCH-009 | Deployment provider                     |
| AD-ARCH-010 | Email provider                          |
| AD-ARCH-011 | Background processor runtime            |
| AD-ARCH-012 | Realtime technology if later required   |
| AD-ARCH-013 | Monitoring/error tracking provider      |
| AD-ARCH-014 | Audit cryptographic chaining            |
| AD-ARCH-015 | Idempotency persistence strategy        |
| AD-ARCH-016 | Session auxiliary framework integration |
| AD-ARCH-017 | Cache technology if required            |
| AD-ARCH-018 | External Focus integration architecture |
| AD-ARCH-019 | Database physical schema namespaces     |
| AD-ARCH-020 | Report rendering libraries              |

---

# 179. Forbidden Architecture Patterns

ممنوع:

```text
Page → SQL
Component → SQL
Client → PostgreSQL
Action → unmanaged raw domain mutation

UI-only authorization

Role === Admin → allow all

Generic state PATCH

Silent edit of approved data

Domain A → Domain B repository internals

Audit only through console.log

Client-provided actor identity

Client-provided approval timestamp

Client-calculated official PASS/FAIL

AI-controlled approval/release

Destructive cascade through historical records

Editing historical migration

Duplicating permission registry

Duplicating State Machine

Browser-side KPI truth

System-wide WebSocket complexity without requirement
```

---

# 180. Architecture Review Checklist

قبل تنفيذ أي Feature:

```text
[ ] Owning Domain known
[ ] Requirement IDs known
[ ] Business Rules known
[ ] Permission known
[ ] State Machine known
[ ] Data entities known
[ ] Astro entry point known
[ ] Application Use Case exists/planned
[ ] DB ownership respected
[ ] Transaction boundary known
[ ] Concurrency behavior known
[ ] Audit behavior known
[ ] Error behavior known
[ ] Tests known
[ ] No unresolved policy silently assumed
```

---

# 181. Astro Feature Checklist

لكل Astro Action/API:

```text
[ ] Input validated
[ ] Actor server-resolved
[ ] Authorization rechecked
[ ] Scope enforced
[ ] Entity loaded safely
[ ] State checked
[ ] Expected version checked where required
[ ] SoD checked where required
[ ] Use Case called
[ ] Errors mapped safely
[ ] No raw SQL in Delivery Layer
[ ] Negative tests included
```

---

# 182. Database Feature Checklist

```text
[ ] PK defined
[ ] FK defined
[ ] Nullability justified
[ ] Unique constraints justified
[ ] CHECK constraints considered
[ ] Delete behavior explicit
[ ] Index needs considered
[ ] Version field where needed
[ ] Trusted timestamps
[ ] Historical behavior known
[ ] Transaction tested
[ ] Concurrency tested
```

---

# 183. Controlled Workflow Checklist

```text
[ ] Transition declared
[ ] Permission declared
[ ] Wrong-state denied
[ ] Wrong-scope denied
[ ] SoD applied
[ ] Version checked
[ ] Reason captured where required
[ ] Signature captured where required
[ ] Audit written
[ ] Historical context frozen
[ ] Consequences atomic
[ ] Retry behavior safe
```

---

# 184. Architecture Evolution

أي تغيير كبير مثل:

```text
Astro → another framework
PostgreSQL → another datastore
Modular Monolith → Microservices
Server sessions → token architecture
```

يحتاج:

```text
Architecture Decision
Impact analysis
Security analysis
Migration analysis
Requirement traceability update
Test impact
Documentation update
```

ولا يتم كجزء جانبي من Feature.

---

# 185. Design Independence

UI يمكن أن يتغير من:

```text
Ops-style Enterprise Dashboard
```

إلى تصميم آخر مستقبلًا بدون إعادة بناء:

```text
Domain
Application
Authorization
State Machines
Database
Audit
Transactions
```

إذا تم احترام boundaries.

---

# 186. Final Architecture Model

```text
┌────────────────────────────────────────────┐
│                Browser                     │
│ Astro HTML + Minimal Client Islands        │
└─────────────────────┬──────────────────────┘
                      │
┌─────────────────────▼──────────────────────┐
│             Delivery Layer                 │
│ Pages / Actions / APIs / Middleware        │
└─────────────────────┬──────────────────────┘
                      │
┌─────────────────────▼──────────────────────┐
│            Application Layer               │
│ Commands / Queries / Use Cases             │
└───────────────┬───────────────┬────────────┘
                │               │
       ┌────────▼──────┐ ┌──────▼───────────┐
       │ Authorization│ │ Domain Rules      │
       │ Scope / SoD  │ │ State Machines   │
       └────────┬──────┘ └──────┬───────────┘
                │               │
                └───────┬───────┘
                        │
┌───────────────────────▼────────────────────┐
│        Transaction / Infrastructure        │
│ Repositories / Audit / Outbox / Files     │
└───────────────────────┬────────────────────┘
                        │
┌───────────────────────▼────────────────────┐
│                PostgreSQL                  │
│ Current Truth + History + Metadata         │
└────────────────────────────────────────────┘
```

---

# 187. Architectural Definition of Done

Architecture Foundation تعتبر جاهزة لبدء scaffolding عندما:

```text
Astro baseline approved
PostgreSQL baseline approved
Module boundaries approved
Delivery boundaries approved
Authentication pattern approved
Authorization pattern approved
Transaction model approved
Cross-domain communication approved
Audit model approved
Outbox model approved
File model approved
Dashboard read model approved
Testing boundaries approved
Architecture guards identified
Deferred decisions explicitly listed
```

ولا يعني هذا أن التطبيق نفسه مكتمل.

---

# 188. Next Architecture Documents

الترتيب المقترح:

```text
Documents/ARCHITECTURE-SPECIFICATION.md
        ↓
Documents/SECURITY-ARCHITECTURE.md
        ↓
Documents/DATABASE-ARCHITECTURE.md
        ↓
Documents/ERROR-ARCHITECTURE.md
        ↓
Documents/TESTING-STRATEGY.md
        ↓
Documents/DESIGN-SYSTEM.md
        ↓
Documents/UI-UX-SPECIFICATION.md
        ↓
Astro Scaffolding / Implementation
```

---

# 189. Final Principle

> **The framework delivers the application.
> The application executes the use case.
> Authorization decides whether the actor may act.
> The Domain decides whether the action is valid.
> PostgreSQL protects the persisted truth.
> Audit preserves the evidence.**

---

# 190. Document Status

```text
Document:
Documents/ARCHITECTURE-SPECIFICATION.md

Version:
1.0

Product:
QC Operations & Laboratory Management System

Architecture:
Domain-First Modular Monolith

Framework:
Astro

Rendering:
Server / On-demand

Runtime:
Node.js

Database:
PostgreSQL

Internal Mutations:
Astro Actions by default

Independent HTTP Contracts:
Astro API Endpoints when justified

Authentication:
Server-side opaque sessions

Authorization:
Centralized Server-side
Default Deny

Business Logic:
Domain/Application layers

Database Access:
Infrastructure / authorized read models only

Concurrency:
Optimistic versioning + locks where justified

Critical Mutations:
Transactional

Cross-Domain Writes:
Application contracts only

Audit:
Independent controlled history

Background Side Effects:
Durable Outbox

Files:
PostgreSQL metadata + Object Storage

Dashboard:
Authorization-aware server-side Read Models

Realtime:
Opt-in only

Client JavaScript:
Astro Islands only where needed

Visual Design:
Deferred to DESIGN-SYSTEM.md / UI-UX-SPECIFICATION.md

Scientific Unknowns:
SOURCE-DEPENDENT — DO NOT INVENT

Policy Unknowns:
DENY / BLOCK UNTIL APPROVED

Status:
FOUNDATION — APPROVED ARCHITECTURE BASELINE
```
