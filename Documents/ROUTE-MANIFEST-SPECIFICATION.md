# ROUTE-MANIFEST-SPECIFICATION.md

# QC Operations & Laboratory Management System

## Route Manifest & Navigation Contract — v1.0 Draft for Approval

**Document Path:** `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
**Status:** FOUNDATION — DRAFT FOR APPROVAL
**Product:** QC Operations & Laboratory Management System
**Framework:** Astro — Server-rendered / On-demand
**Routing Model:** Astro File-Based Routing
**Architecture:** Modular Monolith
**Authorization:** Centralized Server-Side / Default Deny
**Route Philosophy:** Domain-oriented, explicit, predictable, permission-aware
**Canonical Record URL Identifier:** Technical UUID
**Business ID:** Display/Search identifier — not route authority
**Mutation Model:** Astro Actions / explicit API endpoints → Application Use Cases
**Operational Timezone:** Asia/Riyadh

---

# 1. Purpose

هذه الوثيقة هي المرجع الرسمي المقترح لتحديد:

```text
Which browser routes exist?
Which Astro page file owns each route?
Which Domain owns the route?
Which UI Page ID maps to it?
Is it public or protected?
Which permission/scope is required?
Which dynamic identifiers are accepted?
Which query parameters are allowed?
Where do controlled actions execute?
How do redirects behave?
How do 404 / 500 / unauthorized cases behave?
How are deep links handled?
```

الهدف:

> **كل Route تكون معروفة، مملوكة، قابلة للاختبار، ومربوطة بالـAuthorization والـUI specification.**

---

# 2. Route Is Not Business Authority

وجود route:

```text
/quarantine/receiving/[receivingId]
```

لا يعني أن أي مستخدم يستطيع الوصول إلى Receiving Item.

المسار الحقيقي:

```text
Browser Request
      ↓
Astro Route
      ↓
Session Context
      ↓
Authorized Query / Use Case
      ↓
Permission + Scope + Entity
      ↓
Page Result
```

---

# 3. GET Must Not Perform Controlled Mutations

قاعدة أساسية:

```text
GET
=
Read / Render / Navigate
```

وليس:

```text
Approve
Release
Submit
Close
Void
Sign
Retest
Change Permission
Restore Backup
```

Controlled mutations تستخدم:

```text
Astro Action
or
Explicit API Endpoint where appropriate
```

ثم:

```text
Application Use Case
→ Authorization
→ State Machine
→ Transaction
→ Audit
```

---

# 4. Proposed Route Architecture Approaches

## Option A — `/app/*`

Example:

```text
/app/dashboard
/app/tasks
/app/quarantine/receiving
```

### Pros

* يفصل application عن public site.
* namespace واضح.

### Cons

* `/app/` لا يضيف business meaning.
* URLs أطول.
* المنتج كله تقريبًا application أصلًا.

---

## Option B — Flat Routes

Example:

```text
/dashboard
/tasks
/receiving
/inspections
/ncr
/laboratory
```

### Pros

* URLs قصيرة.

### Cons

* Domain ownership أقل وضوح.
* collisions أسهل مستقبلًا.
* Quarantine/Quality hierarchy تضيع.

---

## Option C — Domain-Oriented Routes

Example:

```text
/dashboard

/tasks

/quality/findings
/quality/ncr
/quality/capa

/quarantine/receiving
/quarantine/inspections

/laboratory/tests

/assets/equipment
/assets/calibrations

/documents
/approvals
```

### Recommendation

```text
OPTION C
```

لأنه يطابق Domain Map ويحافظ على URLs مفهومة بدون `/app` زائد.

---

# 5. Canonical Route Principle

Canonical route structure:

```text
/<domain-or-capability>/<resource>/<record-id>/<workspace?>
```

Examples:

```text
/quality/ncr/550e8400-e29b-41d4-a716-446655440000

/quarantine/inspections/550e8400-e29b-41d4-a716-446655440000/review

/laboratory/tests/550e8400-e29b-41d4-a716-446655440000/execute
```

---

# 6. URL Identifier Strategy

Canonical dynamic record identifier:

```text
UUID
```

Example:

```text
/tasks/[taskId]
```

`taskId` هو technical UUID.

UI يعرض:

```text
TSK-2026-0042
```

وليس UUID للمستخدم إلا عند الحاجة التقنية.

---

# 7. Why UUID in Canonical Route

UUID:

* ثابت.
* مستقل عن business-number format.
* لا يتغير إذا numbering policy تغيرت.
* لا يعتمد على display value.
* مناسب للـFK/entity identity.

لكن:

> **UUID ليس security control.**

كل request يعاد Authorization عليها.

---

# 8. Business IDs

Business IDs تستخدم في:

```text
Page headings
Tables
Search
Reports
Copy/reference
Audit
Human communication
```

Example:

```text
LAB-2026-0044
NCR-2026-0017
RCV-2026-0092
```

لكن route resolution canonical يعتمد UUID.

---

# 9. Reserved Route Names

ممنوع استخدام namespaces المحجوزة من Astro:

```text
/_astro
/_actions
/_server_islands
```

كما نتجنب أي future Astro-reserved namespace.

---

# 10. Root Route

```text
/
```

Astro:

```text
src/pages/index.astro
```

Behavior:

```text
Unauthenticated
→ /login

Authenticated
→ /dashboard
```

Root لا يحتوي Dashboard duplication.

---

# 11. Public Route Class

Public routes محدودة جدًا:

```text
/login
```

ومستقبلًا إذا Security Architecture اعتمدت:

```text
/auth/recovery
/auth/reset/...
```

لا يتم إنشاء public operational pages.

---

# 12. Protected Route Classes

Canonical classes:

```text
AUTHENTICATED
AUTHORIZED
CONTROLLED_WORKSPACE
ADMINISTRATIVE
SYSTEM_OPERATION
```

---

# 13. AUTHENTICATED

يحتاج:

```text
Valid session
Active account
```

لكن لا يحتاج Domain permission إضافية إذا الصفحة تخص الحساب نفسه.

Example:

```text
/account
```

---

# 14. AUTHORIZED

يحتاج:

```text
Authenticated
+
Permission
+
Scope
```

Example:

```text
/tasks
/laboratory/tests
```

---

# 15. CONTROLLED_WORKSPACE

بالإضافة لما سبق:

```text
Entity State
Record Version
Assignment/Ownership
SoD where relevant
```

Example:

```text
/laboratory/tests/[id]/review
```

---

# 16. ADMINISTRATIVE

لـ:

```text
/admin/*
```

ويحتاج explicit administration permissions.

`Admin` role وحده ليس proof.

---

# 17. SYSTEM_OPERATION

لـ:

```text
/system/backups/*
/system/restore/*
```

يحتاج explicit high-risk permission.

---

# 18. Authentication Redirect

إذا protected route فتحت بدون session:

```text
302/303
→ /login
```

مع optional safe return path:

```text
/login?returnTo=/laboratory/tests/...
```

---

# 19. `returnTo` Security

`returnTo`:

```text
must be local relative application path
```

Allowed:

```text
/dashboard
/tasks
/quarantine/receiving
```

Rejected:

```text
https://evil.example
//evil.example
javascript:...
```

لا Open Redirect.

---

# 20. Login When Already Authenticated

Request:

```text
GET /login
```

إذا session valid:

```text
→ /dashboard
```

إلا إذا use case لاحق يحتاج account switching.

---

# 21. Logout

لا نعتمد:

```text
GET /logout
```

كـstate-changing route.

Logout:

```text
Astro Action
→ revoke session
→ redirect /login
```

---

# 22. Unauthorized Route Behavior

إذا entity existence غير sensitive:

```text
403 / safe Access Denied
```

إذا كشف existence يسبب IDOR leakage:

```text
404-style safe response
```

طبقًا لـSecurity/Error Architecture.

---

# 23. Missing Record

```text
Valid route
+
record does not exist
→ 404
```

لا نعرض:

```text
Database row not found
```

---

# 24. Custom Error Routes

Astro pages:

```text
src/pages/404.astro
src/pages/500.astro
```

404:

```text
Record/page unavailable
```

500:

```text
Safe internal error
Request/reference ID when available
```

ممنوع عرض raw error/stack.

---

# 25. Route Manifest ID Convention

```text
RT-<DOMAIN>-<NNN>
```

Examples:

```text
RT-AUTH-001
RT-DASH-001
RT-TASK-003
RT-INSP-004
RT-LAB-005
```

---

# 26. Route Manifest Record Contract

كل route تملك:

```text
Route ID
UI Page ID
URL Pattern
Astro File
Domain Owner
Route Class
HTTP Method
Primary Purpose
Permission Binding
Scope Requirement
Dynamic Params
Allowed Query Params
Rendering Mode
Unauthorized Behavior
Related Actions
Test Requirement
Status
```

---

# 27. Rendering Mode

Protected operational pages:

```text
SERVER / ON-DEMAND
```

لا تعتمد SSG.

No `getStaticPaths()` للrecords التشغيلية dynamic.

---

# 28. Public Authentication Routes

| Route ID    | UI ID       | URL                       | Astro File                               | Class    |
| ----------- | ----------- | ------------------------- | ---------------------------------------- | -------- |
| RT-AUTH-001 | UI-AUTH-001 | `/login`                  | `src/pages/login.astro`                  | PUBLIC   |
| RT-AUTH-002 | UI-AUTH-002 | `/auth/recovery`          | `src/pages/auth/recovery.astro`          | DEFERRED |
| RT-AUTH-003 | UI-AUTH-002 | `/auth/reset/[requestId]` | `src/pages/auth/reset/[requestId].astro` | DEFERRED |

Password recovery/reset routes لا تتفعل إلا بعد اعتماد authentication recovery policy.

---

# 29. Dashboard Routes

| Route ID    | UI ID       | URL          | Astro File                        |
| ----------- | ----------- | ------------ | --------------------------------- |
| RT-DASH-001 | UI-DASH-001 | `/dashboard` | `src/pages/dashboard/index.astro` |

Class:

```text
AUTHORIZED
```

Page requires:

```text
Dashboard visibility/read permission
+
authorized read-model scope
```

Dashboard itself لا يمنح Domain permissions.

---

# 30. Tasks Routes

| Route ID    | UI ID       | URL               | File                             |
| ----------- | ----------- | ----------------- | -------------------------------- |
| RT-TASK-001 | UI-TASK-001 | `/tasks`          | `src/pages/tasks/index.astro`    |
| RT-TASK-002 | UI-TASK-002 | `/tasks/new`      | `src/pages/tasks/new.astro`      |
| RT-TASK-003 | UI-TASK-003 | `/tasks/[taskId]` | `src/pages/tasks/[taskId].astro` |

`/tasks/new` static route واضحة ومستقلة عن `[taskId]`.

Create route permission binding:

```text
PERM-TASK-CREATE
```

Detail/list view permissions تربط بالـcanonical permission matrix ولا يتم اختراع code جديد هنا.

---

# 31. Quality Overview Route

| Route ID    | UI ID       | URL        |
| ----------- | ----------- | ---------- |
| RT-QUAL-001 | UI-QUAL-001 | `/quality` |

File:

```text
src/pages/quality/index.astro
```

Purpose:

```text
Quality domain overview / authorized read model
```

---

# 32. Findings Routes

```text
/quality/findings
/quality/findings/new
/quality/findings/[findingId]
```

Mapping:

| Route                           | UI                         |
| ------------------------------- | -------------------------- |
| `/quality/findings`             | UI-FIND-001                |
| `/quality/findings/new`         | Finding creation workspace |
| `/quality/findings/[findingId]` | UI-FIND-002                |

Files:

```text
src/pages/quality/findings/index.astro
src/pages/quality/findings/new.astro
src/pages/quality/findings/[findingId].astro
```

---

# 33. NCR Routes

```text
/quality/ncr
/quality/ncr/new
/quality/ncr/[ncrId]
```

Mapping:

```text
UI-NCR-001 → /quality/ncr
UI-NCR-002 → /quality/ncr/[ncrId]
```

`/new` يظهر فقط إذا business flow يسمح direct NCR creation.

إذا NCR يجب أن تنشأ حصريًا من Finding:

```text
/quality/ncr/new
```

تبقى disabled/not created.

هذا القرار يأتي من Business Rules، وليس Route Manifest.

---

# 34. RCA Routes

Canonical:

```text
/quality/rca
/quality/rca/[rcaId]
```

UI mapping:

```text
UI-RCA-001
```

إذا RCA لا تحتاج independent list في UX النهائي:

```text
/quality/rca
```

يمكن أن تصبح optional/deferred ويُفتح RCA من NCR.

لكن canonical record detail يبقى:

```text
/quality/rca/[rcaId]
```

---

# 35. CAPA Routes

```text
/quality/capa
/quality/capa/new
/quality/capa/[capaId]
```

Mapping:

```text
UI-CAPA-001 → list
UI-CAPA-002 → detail
```

`new` فقط إذا creation flow تسمح.

---

# 36. Quarantine Root Route

```text
/quarantine
```

Mapping:

```text
UI-QUAR-001
```

File:

```text
src/pages/quarantine/index.astro
```

هذا هو Quarantine Dashboard.

---

# 37. Receiving Routes

Canonical:

```text
/quarantine/receiving
/quarantine/receiving/new
/quarantine/receiving/[receivingId]
```

Files:

```text
src/pages/quarantine/receiving/index.astro
src/pages/quarantine/receiving/new.astro
src/pages/quarantine/receiving/[receivingId].astro
```

UI:

```text
UI-RCV-001
UI-RCV-002
UI-RCV-003
```

Create permission:

```text
PERM-QUAR-CREATE
```

---

# 38. Inspection Routes

Canonical:

```text
/quarantine/inspections
/quarantine/inspections/[inspectionId]
/quarantine/inspections/[inspectionId]/execute
/quarantine/inspections/[inspectionId]/review
```

Files:

```text
src/pages/quarantine/inspections/index.astro

src/pages/quarantine/inspections/[inspectionId]/index.astro

src/pages/quarantine/inspections/[inspectionId]/execute.astro

src/pages/quarantine/inspections/[inspectionId]/review.astro
```

---

# 39. Inspection UI Mapping

```text
UI-INSP-001
→ /quarantine/inspections

UI-INSP-002
→ /quarantine/inspections/[inspectionId]/execute

UI-INSP-003
→ /quarantine/inspections/[inspectionId]/review
```

Base detail route:

```text
/quarantine/inspections/[inspectionId]
```

يعرض canonical read-only/context detail.

---

# 40. Inspection Execute Access

Execute workspace يحتاج:

```text
Authenticated
+
Inspection execution permission
+
Authorized scope
+
Assignment/ownership when required
+
Editable state
```

إذا State:

```text
APPROVED
CLOSED
VOID
```

لا يتم redirect تلقائيًا إلى edit.

بدل ذلك:

```text
safe read-only record
```

أو route denied حسب state.

---

# 41. Inspection Review Access

Review route يحتاج:

```text
PERM-INSP-REVIEW
or
appropriate approval permission
+
scope
+
state
+
SoD
```

Approval mutation:

```text
PERM-INSP-APPROVE
```

لكن فتح review workspace ≠ approval permission تلقائيًا.

---

# 42. Inspection Creation

الـInspection غالبًا مرتبطة Receiving Item.

Preferred creation intent:

```text
Receiving Detail
→ Create / Start Inspection Action
```

بدل public route:

```text
/quarantine/inspections/new
```

إلا إذا Business Rule تثبت independent creation.

---

# 43. Quarantine Administration Route

```text
/quarantine/admin
```

UI:

```text
UI-QUAR-ADM-001
```

File:

```text
src/pages/quarantine/admin/index.astro
```

Class:

```text
ADMINISTRATIVE
```

لكن Domain-specific administration.

لا تخلط مع:

```text
/admin
```

system administration.

---

# 44. Laboratory Root

Canonical redirect/landing:

```text
/laboratory
```

Recommendation:

```text
/laboratory
→ /laboratory/tests
```

إذا ما عندنا Laboratory Domain dashboard مستقل.

---

# 45. Laboratory Test Routes

```text
/laboratory/tests
/laboratory/tests/new
/laboratory/tests/[labTestId]
/laboratory/tests/[labTestId]/execute
/laboratory/tests/[labTestId]/review
```

Files:

```text
src/pages/laboratory/tests/index.astro
src/pages/laboratory/tests/new.astro
src/pages/laboratory/tests/[labTestId]/index.astro
src/pages/laboratory/tests/[labTestId]/execute.astro
src/pages/laboratory/tests/[labTestId]/review.astro
```

---

# 46. Laboratory UI Mapping

```text
UI-LAB-001 → /laboratory/tests
UI-LAB-002 → /laboratory/tests/new
UI-LAB-003 → /laboratory/tests/[labTestId]/execute
UI-LAB-004 → /laboratory/tests/[labTestId]/review
```

Base detail route:

```text
/laboratory/tests/[labTestId]
```

---

# 47. Laboratory Create Access

Binding:

```text
PERM-LAB-CREATE
```

plus scope and business preconditions.

---

# 48. Retest Route

Canonical:

```text
/laboratory/tests/[labTestId]/retests/new
```

UI:

```text
UI-LAB-005
```

File:

```text
src/pages/laboratory/tests/[labTestId]/retests/new.astro
```

Access binding:

```text
PERM-LAB-RETEST
```

لكن runtime:

```text
DENY
```

إذا retest policy ما زالت unresolved.

---

# 49. Retest Record Detail

إذا Retest entity لها UUID مستقل:

```text
/laboratory/retests/[retestId]
```

قرار entity representation النهائي يتبع Data Model.

لا نخترع route قبل التأكد من model.

---

# 50. Asset Root

Canonical namespace:

```text
/assets
```

Recommendation:

```text
/assets
→ /assets/equipment
```

---

# 51. Equipment Routes

```text
/assets/equipment
/assets/equipment/new
/assets/equipment/[equipmentId]
```

Mapping:

```text
UI-EQP-001
UI-EQP-002
```

Create route يضاف فقط إذا Equipment creation في v1 scope.

---

# 52. Calibration Routes

```text
/assets/calibrations
/assets/calibrations/new
/assets/calibrations/[calibrationId]
```

UI:

```text
UI-CAL-001
UI-CAL-002
```

Alternative contextual creation:

```text
/assets/equipment/[equipmentId]/calibrations/new
```

Recommendation:

Use contextual creation إذا calibration دائمًا مرتبطة Equipment.

Canonical record detail يبقى:

```text
/assets/calibrations/[calibrationId]
```

---

# 53. Maintenance Routes

```text
/assets/maintenance
/assets/maintenance/new
/assets/maintenance/[maintenanceId]
```

UI:

```text
UI-MNT-001
UI-MNT-002
```

Contextual creation may use:

```text
/assets/equipment/[equipmentId]/maintenance/new
```

إذا business flow تثبت ذلك.

---

# 54. Controlled Documents Root

Canonical:

```text
/documents
```

Mapping:

```text
UI-DOC-001
```

File:

```text
src/pages/documents/index.astro
```

---

# 55. Document Detail

```text
/documents/[documentId]
```

UI:

```text
UI-DOC-002
```

File:

```text
src/pages/documents/[documentId]/index.astro
```

---

# 56. New Controlled Document

If permitted:

```text
/documents/new
```

Create document identity.

Document identity creation ≠ version approval.

---

# 57. Document Version Route

Canonical version detail:

```text
/documents/[documentId]/versions/[versionId]
```

New version:

```text
/documents/[documentId]/versions/new
```

Editor UI:

```text
UI-DOC-003
```

---

# 58. Document Review Route

```text
/documents/[documentId]/versions/[versionId]/review
```

UI:

```text
UI-DOC-004
```

Approval binding:

```text
PERM-DOC-APPROVE
```

مع state/scope/SoD.

---

# 59. Effective Document Route

لا نحتاج route خاصة:

```text
/documents/[id]/effective
```

كـbusiness mutation.

Current effective version يظهر من Document Detail read model.

---

# 60. Approvals Root

```text
/approvals
```

UI:

```text
UI-APR-001
```

Purpose:

```text
My authorized approval work queue
```

وليس كل approvals في النظام.

---

# 61. Approval Detail Route

```text
/approvals/[approvalId]
```

UI:

```text
UI-APR-002
```

File:

```text
src/pages/approvals/[approvalId].astro
```

يمكن الصفحة تحويل/compose subject-specific review workspace.

---

# 62. Subject Review vs Approval Route

مثلاً inspection review:

```text
/quarantine/inspections/[id]/review
```

وapproval task:

```text
/approvals/[approvalId]
```

الاثنين ممكن يشيرون لنفس review context.

Recommendation:

```text
/approvals/[approvalId]
```

هو work-item entry point.

Subject review route:

```text
canonical subject workspace
```

Implementation تمنع duplication of business logic.

---

# 63. E-Signature Has No Independent Public Route

E-Signature ceremony:

```text
UI-ESIG-001
```

Recommendation:

```text
Modal / controlled overlay
```

inside review workspace.

لا route مثل:

```text
/sign?id=...
```

تقوم بتوقيع بمجرد الزيارة.

Mutation through Astro Action.

---

# 64. Change Request Routes

```text
/change-requests
/change-requests/new
/change-requests/[changeRequestId]
/change-requests/[changeRequestId]/review
```

UI:

```text
UI-CHG-001
UI-CHG-002
```

Approval mutation binding when applicable:

```text
PERM-CHG-APPROVE
```

---

# 65. Reports Routes

```text
/reports
/reports/[reportCode]
```

UI:

```text
UI-RPT-001
UI-RPT-002
```

`reportCode`:

```text
canonical allowlisted report definition code
```

وليس arbitrary SQL/report name.

---

# 66. Report Code Safety

Example:

```text
/reports/quarantine-aging
```

`reportCode` resolves through:

```text
Report Registry
```

ممنوع:

```text
/reports?sql=...
```

أو dynamic raw table names.

---

# 67. Report Export

Export mutation/operation:

```text
not a normal page route
```

Possible mechanisms:

```text
Astro Action
→ create export
→ return secure download

or

POST /api/reports/[reportCode]/export
```

حسب implementation.

Binding:

```text
PERM-RPT-EXPORT
```

---

# 68. Administration Root

```text
/admin
```

UI:

```text
UI-ADM-001
```

File:

```text
src/pages/admin/index.astro
```

---

# 69. User Administration Routes

```text
/admin/users
/admin/users/new
/admin/users/[userId]
```

UI:

```text
UI-ADM-USR-001
UI-ADM-USR-002
```

Binding example:

```text
PERM-ADM-USERS
```

---

# 70. Role Administration Routes

```text
/admin/roles
/admin/roles/[roleId]
```

UI:

```text
UI-ADM-ROLE-001
```

No route implies role hierarchy.

---

# 71. Permissions Route

```text
/admin/permissions
```

UI:

```text
UI-ADM-PERM-001
```

Permission changes:

```text
high-risk mutation
```

No GET mutation.

---

# 72. Scope Management Route

```text
/admin/scopes
```

UI:

```text
UI-ADM-SCOPE-001
```

Specific user scope management can deep-link:

```text
/admin/users/[userId]?section=scopes
```

or dedicated nested route later.

---

# 73. System Root

Namespace:

```text
/system
```

No general public landing required.

---

# 74. System Health Route

```text
/system/health
```

UI:

```text
UI-SYS-001
```

This is authenticated administrative UI.

It is not the machine health endpoint.

---

# 75. Machine Health Endpoints

Infrastructure endpoints separate from UI.

Possible:

```text
/api/health/live
/api/health/ready
```

Exact exposure/security behavior defined later in Observability Architecture.

They must not reveal secrets.

---

# 76. Backup Routes

```text
/system/backups
/system/backups/[backupId]
```

UI:

```text
UI-BKP-001
```

Backup detail can show:

```text
backup metadata
integrity
restore verification
```

---

# 77. Restore Route

Recommended:

```text
/system/backups/[backupId]/restore
```

UI:

```text
UI-RST-001
```

Binding:

```text
PERM-BKP-RESTORE
```

Visit GET page:

```text
does not restore anything
```

Actual restore:

```text
Controlled Action
```

---

# 78. AI Advisory Route

```text
/ai-advisory
```

UI:

```text
UI-AI-001
```

Alternative:

```text
/ai
```

Recommendation:

```text
/ai-advisory
```

because URL itself reinforces advisory authority.

---

# 79. Global Search Route

Dedicated search:

```text
/search
```

UI:

```text
UI-SHARED-001
```

Command palette and `/search` use same authorized search service.

---

# 80. Search Query

Recommended:

```text
/search?q=NCR-2026
```

`q`:

* length limited.
* validated.
* not raw SQL.
* server-side authorization-aware.

---

# 81. Notifications Route

```text
/notifications
```

UI:

```text
UI-SHARED-002
```

Top-bar drawer can use same read model.

---

# 82. Account Route

```text
/account
```

UI:

```text
UI-SHARED-003
```

Class:

```text
AUTHENTICATED
```

Account security subsections can use:

```text
/account?section=security
```

unless separate routes prove useful.

---

# 83. Audit Route

```text
/audit
```

UI:

```text
UI-SHARED-004
```

Only if explicit audit-view permission exists.

Record-level history remains inside each record route.

---

# 84. Final Proposed Browser Route Tree

```text
/
├── login
├── auth/
│   ├── recovery                      [DEFERRED]
│   └── reset/[requestId]             [DEFERRED]
│
├── dashboard
│
├── tasks/
│   ├── new
│   └── [taskId]
│
├── quality/
│   ├── findings/
│   │   ├── new
│   │   └── [findingId]
│   ├── ncr/
│   │   ├── new                       [conditional]
│   │   └── [ncrId]
│   ├── rca/
│   │   └── [rcaId]
│   └── capa/
│       ├── new                       [conditional]
│       └── [capaId]
│
├── quarantine/
│   ├── receiving/
│   │   ├── new
│   │   └── [receivingId]
│   ├── inspections/
│   │   └── [inspectionId]/
│   │       ├── execute
│   │       └── review
│   └── admin
│
├── laboratory/
│   └── tests/
│       ├── new
│       └── [labTestId]/
│           ├── execute
│           ├── review
│           └── retests/
│               └── new
│
├── assets/
│   ├── equipment/
│   │   ├── new                       [scope dependent]
│   │   └── [equipmentId]
│   ├── calibrations/
│   │   ├── new                       [conditional]
│   │   └── [calibrationId]
│   └── maintenance/
│       ├── new                       [conditional]
│       └── [maintenanceId]
│
├── documents/
│   ├── new
│   └── [documentId]/
│       └── versions/
│           ├── new
│           └── [versionId]/
│               └── review
│
├── approvals/
│   └── [approvalId]
│
├── change-requests/
│   ├── new
│   └── [changeRequestId]/
│       └── review
│
├── reports/
│   └── [reportCode]
│
├── admin/
│   ├── users/
│   │   ├── new
│   │   └── [userId]
│   ├── roles/
│   │   └── [roleId]
│   ├── permissions
│   └── scopes
│
├── system/
│   ├── health
│   └── backups/
│       └── [backupId]/
│           └── restore
│
├── ai-advisory
├── search
├── notifications
├── account
└── audit
```

---

# 85. Page File Tree

Proposed `src/pages/`:

```text
src/pages/
├── index.astro
├── login.astro
├── 404.astro
├── 500.astro
│
├── auth/
│   ├── recovery.astro
│   └── reset/
│       └── [requestId].astro
│
├── dashboard/
│   └── index.astro
│
├── tasks/
│   ├── index.astro
│   ├── new.astro
│   └── [taskId].astro
│
├── quality/
│   ├── index.astro
│   ├── findings/
│   │   ├── index.astro
│   │   ├── new.astro
│   │   └── [findingId].astro
│   ├── ncr/
│   │   ├── index.astro
│   │   ├── new.astro
│   │   └── [ncrId].astro
│   ├── rca/
│   │   ├── index.astro
│   │   └── [rcaId].astro
│   └── capa/
│       ├── index.astro
│       ├── new.astro
│       └── [capaId].astro
│
├── quarantine/
│   ├── index.astro
│   ├── receiving/
│   │   ├── index.astro
│   │   ├── new.astro
│   │   └── [receivingId].astro
│   ├── inspections/
│   │   ├── index.astro
│   │   └── [inspectionId]/
│   │       ├── index.astro
│   │       ├── execute.astro
│   │       └── review.astro
│   └── admin/
│       └── index.astro
│
├── laboratory/
│   ├── index.astro
│   └── tests/
│       ├── index.astro
│       ├── new.astro
│       └── [labTestId]/
│           ├── index.astro
│           ├── execute.astro
│           ├── review.astro
│           └── retests/
│               └── new.astro
│
├── assets/
│   ├── index.astro
│   ├── equipment/
│   │   ├── index.astro
│   │   ├── new.astro
│   │   └── [equipmentId].astro
│   ├── calibrations/
│   │   ├── index.astro
│   │   ├── new.astro
│   │   └── [calibrationId].astro
│   └── maintenance/
│       ├── index.astro
│       ├── new.astro
│       └── [maintenanceId].astro
│
├── documents/
│   ├── index.astro
│   ├── new.astro
│   └── [documentId]/
│       ├── index.astro
│       └── versions/
│           ├── new.astro
│           └── [versionId]/
│               ├── index.astro
│               └── review.astro
│
├── approvals/
│   ├── index.astro
│   └── [approvalId].astro
│
├── change-requests/
│   ├── index.astro
│   ├── new.astro
│   └── [changeRequestId]/
│       ├── index.astro
│       └── review.astro
│
├── reports/
│   ├── index.astro
│   └── [reportCode].astro
│
├── admin/
│   ├── index.astro
│   ├── users/
│   │   ├── index.astro
│   │   ├── new.astro
│   │   └── [userId].astro
│   ├── roles/
│   │   ├── index.astro
│   │   └── [roleId].astro
│   ├── permissions.astro
│   └── scopes.astro
│
├── system/
│   ├── health.astro
│   └── backups/
│       ├── index.astro
│       └── [backupId]/
│           ├── index.astro
│           └── restore.astro
│
├── ai-advisory.astro
├── search.astro
├── notifications.astro
├── account.astro
└── audit.astro
```

---

# 86. Delivery Layer Rule

كل ملفات:

```text
src/pages/**
```

Delivery فقط.

Allowed responsibilities:

```text
Read Astro.params
Read validated search params
Read authenticated context
Invoke query/use case
Choose layout
Map result to UI
Handle safe route result
```

Forbidden:

```text
Raw SQL
Direct repository manipulation
Business rules
State transitions
Permission definitions
Scientific calculations
```

---

# 87. Dynamic Param Validation

كل `[id]` route:

```text
validate UUID format
```

before repository lookup.

Invalid UUID:

```text
safe 404 / validation mapping
```

لا يرسل raw database error.

---

# 88. Route Params Are Not Authorization

Example:

```text
/quarantine/receiving/<UUID>
```

وجود UUID صحيح:

```text
does not imply ALLOW
```

Still:

```text
Actor
+
Permission
+
Scope
+
Entity
```

---

# 89. Query Parameter Philosophy

Query parameters تستخدم لـ:

```text
Search
Filters
Sorting
Date ranges
Pagination
View mode
Section/tab where useful
```

لا تستخدم لـ:

```text
Authoritative status
Approval decision
Permission
Release state
PASS/FAIL
Actor identity
```

---

# 90. Example List Query

```text
/quarantine/receiving
  ?q=glove
  &inspectionResult=HOLD
  &releaseState=NOT_RELEASED
  &from=2026-09-01
  &to=2026-09-30
```

كل parameter:

```text
schema validated server-side
```

---

# 91. Filter State in URL

Recommendation:

> **List filters should be reflected in the URL where practical.**

Benefit:

```text
Back navigation
Shareable internal view
Refresh persistence
Testing
```

---

# 92. Pagination

Exact mechanism:

```text
DEFERRED
```

Candidates:

```text
cursor
page
```

لكن يجب أن يكون:

```text
server-side
stable
validated
authorization-aware
```

---

# 93. Sorting

Allowed fields use allowlist.

Example:

```text
?sort=receivedAt&direction=desc
```

Never:

```text
?sort=<raw SQL>
```

---

# 94. Tabs / Sections

Record pages may use:

```text
?section=history
?section=evidence
```

إذا هذا يحسن deep linking.

لكن canonical record URL يبقى:

```text
/entity/[id]
```

---

# 95. Actions Must Not Be Encoded as GET Queries

Forbidden:

```text
/inspection/123?action=approve
```

Forbidden:

```text
/release?id=123
```

Controlled actions use POST/Action.

---

# 96. Action Naming Convention

Logical Astro Action names:

```text
<domain>.<verb><Entity>
```

Examples:

```text
tasks.createTask

quarantine.createReceivingItem
quarantine.releaseReceivingItem

inspections.submitInspection
inspections.approveInspection
inspections.returnInspection

laboratory.createLabTest
laboratory.submitLabTest
laboratory.approveLabTest
laboratory.createRetest

documents.submitDocumentVersion
documents.approveDocumentVersion

approvals.signApproval
```

Exact code organization finalized in implementation plan.

---

# 97. Action Route Security

Astro Actions may have internal/reserved transport routes.

Application code must not depend on:

```text
/_actions/...
```

as business URL.

Frontend invokes typed/logical actions.

---

# 98. API Namespace

If explicit HTTP endpoints are necessary:

```text
/api/*
```

Reserved application API namespace.

Examples:

```text
/api/files/[fileId]/download
/api/reports/[reportCode]/export
/api/health/live
/api/health/ready
```

---

# 99. API Versioning

Public/external API:

```text
not currently approved
```

إذا لاحقًا external integration API:

```text
/api/v1/*
```

يتم وضع API contract منفصل.

لا نفرض `/v1` على internal browser-only endpoints بدون حاجة.

---

# 100. File Download Endpoint

Recommended:

```text
GET /api/files/[fileId]/download
```

Flow:

```text
Validate fileId
↓
Load metadata
↓
Authorize linked business context
↓
Generate/stream safe private download
```

لا permanent public object URL.

---

# 101. File Preview

Potential:

```text
GET /api/files/[fileId]/preview
```

only if safe preview architecture implemented.

Otherwise use download.

---

# 102. Report Export Endpoint

Potential:

```text
POST /api/reports/[reportCode]/export
```

Why POST:

```text
Complex validated filters
No mutation of business truth
May create temporary export artifact
```

Alternative Astro Action is also valid.

Exact mechanism deferred.

---

# 103. Health API

Potential machine endpoints:

```text
GET /api/health/live
GET /api/health/ready
```

UI page:

```text
GET /system/health
```

هما مختلفين.

---

# 104. Route-Level Session Middleware

Middleware may:

```text
Parse session
Validate session
Resolve actor
Resolve account state
Populate Astro.locals
Attach requestId/context
Redirect unauthenticated browser request
```

---

# 105. Middleware Must Not Replace Authorization

Middleware cannot conclude:

```text
User role = Manager
→ allow all /quality/*
```

كل page query/action يعيد Domain authorization.

---

# 106. Route Metadata Registry

أوصي لاحقًا بmachine-readable registry:

```text
src/shared/routing/route-manifest.ts
```

or generated config.

Each item:

```text
routeId
pattern
domain
uiPageId
accessClass
navigationGroup
permissionBinding
riskTier
```

---

# 107. Why Machine-Readable Manifest

يستخدم لـ:

```text
Navigation
Breadcrumbs
Authorization visibility hints
Route testing
Coverage
Documentation checks
Sitemap exclusion
Audit/readiness checks
```

لكن server authorization لا تعتمد عليه وحده إذا صار UI-focused registry.

---

# 108. Navigation Registry

Sidebar should not hardcode routes in multiple components.

Preferred:

```text
one navigation definition
```

references canonical route IDs.

---

# 109. Breadcrumb Registry

Breadcrumbs derive from route/entity context.

Example:

```text
Quarantine
>
Inspections
>
INSP-2026-0042
>
Review
```

Business ID shown, UUID hidden.

---

# 110. Route Titles

Document title pattern:

```text
<Page or Business ID> · QC Operations
```

Examples:

```text
Dashboard · QC Operations

INSP-2026-0042 · QC Operations

Laboratory Tests · QC Operations
```

---

# 111. Create Route Return Behavior

After successful creation:

```text
/new
→ POST action
→ record created
→ redirect canonical detail URL
```

Example:

```text
/tasks/new
→ create
→ /tasks/[taskId]
```

---

# 112. Submit Mutation Behavior

Example:

```text
/laboratory/tests/[id]/execute
```

Submit Action succeeds:

```text
→ stay on record or redirect canonical detail
```

Recommendation:

```text
redirect /laboratory/tests/[id]
```

with state reflected server-side.

---

# 113. Review Mutation Behavior

After:

```text
Approve
Return
Reject
```

recommend:

```text
redirect canonical subject detail
```

or next approval queue item via explicit user action.

No automatic hidden mass processing.

---

# 114. Preserve List Return Context

When user opens from filtered list:

```text
/quarantine/receiving?inspectionResult=HOLD
```

then record detail.

Back should restore list filter state.

Implementation options:

```text
browser history
safe local state
return context
```

لا external return URLs.

---

# 115. Canonical Deep Links

Every important record detail should be deep-linkable:

```text
/tasks/[id]
/quality/ncr/[id]
/quarantine/receiving/[id]
/laboratory/tests/[id]
/assets/equipment/[id]
/documents/[id]
```

Review/execution workspaces أيضًا deep-linkable إذا authorized.

---

# 116. No Sensitive Secrets in URLs

Never place:

```text
Password
Session token
API secret
Private key
Raw provider credential
```

في route/query.

Password reset one-time reference design must follow Security Architecture.

---

# 117. Sensitive Filters

إذا query filters تشمل internal sensitive identifiers:

```text
safe internal IDs only
```

No secret values.

---

# 118. Route Naming Style

Use:

```text
lowercase
kebab-case
plural collection names where natural
```

Examples:

```text
/change-requests
/ai-advisory
```

Domain acronyms can remain conventional:

```text
/quality/ncr
/quality/rca
/quality/capa
```

---

# 119. Trailing Slash Policy

Canonical recommendation:

```text
no trailing slash in displayed/internal links
```

Examples:

```text
/tasks
/tasks/[id]
```

Exact Astro `trailingSlash` configuration should align consistently.

---

# 120. Route Renames

إذا route تغير بعد production:

```text
Old route
→ explicit redirect
→ new canonical route
```

No silent broken internal bookmarks without migration decision.

---

# 121. Permanent vs Temporary Redirect

Use semantics appropriately:

```text
301/308
→ permanent route change

302/303
→ temporary/session/post-action navigation
```

Exact response chosen per use case.

---

# 122. Unsupported Legacy Routes

Project is new.

لا نضيف redirects لlegacy BRIGHTAI QC Task Manager unless explicit migration requirement exists.

---

# 123. Route Access Evaluation

Page access conceptual formula:

```text
Authenticated Actor
+
Active Account
+
Page Permission
+
Scope
+
Record Authorization if dynamic
+
State if workspace-specific
+
Assignment / Ownership
+
SoD where relevant
```

---

# 124. List Route Authorization

List route never fetches all rows then filters client-side.

Correct:

```text
Authorized scoped query
→ rows
```

---

# 125. Detail Route Authorization

Correct:

```text
ID
+
Actor Context
→ authorized lookup
```

not:

```text
load record globally
→ render
→ hide fields
```

---

# 126. Review Route Authorization

Opening:

```text
/[id]/review
```

must verify review capability.

Submitting decision reauthorizes again.

---

# 127. Execute Route Authorization

Opening execution workspace verifies:

```text
permission
scope
assignment
state
```

Saving/submitting revalidates again.

---

# 128. Admin Route Authorization

`/admin/*` routes do not use:

```text
role === ADMIN
```

as single gate.

Use explicit permissions.

---

# 129. Route and SoD

Route visibility can hide review route from author.

لكن direct URL still server-denied.

---

# 130. Route and Record Version

Version is generally **not** URL path.

Canonical:

```text
/laboratory/tests/[id]/review
```

Page loads current reviewable version.

Exact version displayed in UI and sent to controlled action as:

```text
expectedVersion
```

---

# 131. Document Version Exception

Controlled Document Version is itself business entity.

لذلك URL may include:

```text
/documents/[documentId]/versions/[versionId]
```

because version record has own identity.

---

# 132. Route Caching

Protected operational pages:

```text
must not be treated as public shared-cache content
```

Cache policy follows Security/Architecture.

Sensitive per-user pages should avoid inappropriate shared caching.

---

# 133. Search Engine Indexing

Internal application routes:

```text
NOINDEX
```

They are not marketing/SEO pages.

Authentication/operational routes should not appear in public search engines.

---

# 134. Browser History

Navigation should preserve expected Back/Forward behavior.

Avoid excessive JS route interception that breaks native history.

---

# 135. Astro Link Behavior

Normal internal navigation should use standard links where appropriate:

```text
<a href="/tasks/...">
```

Enhanced navigation may be added only if it preserves accessibility and state correctness.

---

# 136. Unsaved Form Navigation Guard

Routes with unsaved non-autosaved drafts:

```text
warn before navigation
```

but controlled state page must not be kept stale indefinitely.

---

# 137. Dashboard Links

Dashboard KPI/card never mutates.

Example:

```text
HOLD Items
→ /quarantine/receiving?inspectionResult=HOLD
```

---

# 138. Approval Dashboard Link

```text
Pending Approvals
→ /approvals
```

specific item:

```text
/approvals/[approvalId]
```

No dashboard:

```text
?approve=true
```

---

# 139. Notifications Links

Notification stores logical entity reference.

Destination generated from Route Registry.

Example:

```text
LAB_TEST + UUID
→ /laboratory/tests/[id]
```

Do not store arbitrary external href as trusted destination.

---

# 140. Related Record Links

Cross-domain relationship uses canonical route resolver.

Example:

```text
NCR
→ Receiving Item source
→ /quarantine/receiving/[id]
```

No cross-domain editing embedded.

---

# 141. Page Route Test Requirements

Every manifest page requires tests for:

```text
Route resolves
Authenticated behavior
Unauthorized behavior
Invalid param
Missing record
Scoped record
Correct Page ID/layout
```

---

# 142. Dynamic Route Negative Tests

For every `[id]`:

```text
Invalid UUID
Random valid UUID
Unauthorized existing UUID
Authorized existing UUID
```

must be tested.

---

# 143. Review Route Tests

Each `/review` route:

```text
Author prohibited by SoD
Authorized reviewer
Wrong state
Stale version at action
Direct action invocation
```

---

# 144. Execute Route Tests

Each `/execute` route:

```text
Assigned actor
Unassigned actor
Wrong state
Controlled state
Invalid entity
```

---

# 145. New Route Tests

Every `/new` route:

```text
Authorized creator
Unauthorized actor
Validation error
Successful creation redirect
Duplicate/idempotency where applicable
```

---

# 146. Admin Route Tests

```text
Admin role without explicit permission
→ must not automatically pass

Explicit permission + valid scope
→ allowed
```

---

# 147. Route Coverage Gate

Production readiness should require:

```text
100% registered protected routes
→ auth/access test coverage
```

No orphan protected page.

---

# 148. Manifest vs Filesystem Guard

CI should eventually verify:

```text
Every operational src/pages route
↔
Manifest entry
```

except explicitly exempt framework files:

```text
404
500
```

and technical endpoints.

---

# 149. Orphan Route

Definition:

```text
Astro page exists
but no manifest ownership/access record
```

Result:

```text
FAIL
```

for protected application routes.

---

# 150. Orphan Manifest Entry

Definition:

```text
Manifest says route exists
but page absent
```

Status:

```text
UNIMPLEMENTED
```

not PASS.

---

# 151. Route Risk Tiers

Tier 1 routes include:

```text
/review
/restore
/admin/permissions
controlled execution routes
document approvals
```

Tier 2:

```text
create/edit operational records
reports/exports
```

Tier 3:

```text
dashboard/read-only lists
```

Actual risk mapping uses RISK-REGISTER.

---

# 152. Controlled Route Indicator

No need to expose `TIER 1` label to users.

UX uses:

```text
controlled action styling
warnings
signature/reason flows
```

---

# 153. Route Performance

List routes must not:

```text
load all records into Astro page
```

Use server-side pagination/filtering.

Detail pages load only required authorized context.

---

# 154. Route Data Loading

Recommended:

```text
Astro page
→ Query/Application service
→ authorized view model
```

No direct repository from UI component.

---

# 155. Route Error Mapping

Expected:

```text
NotFound
Unauthorized
Validation
Stale/Conflict
DependencyUnavailable
```

mapped to safe route experience.

Unexpected:

```text
500 safe page/result
+
requestId
```

---

# 156. 404 Page UX

Should contain:

```text
Page or record unavailable
Return to Dashboard
Return to previous area
```

No:

```text
Record exists but you don't have permission
```

if existence sensitive.

---

# 157. 500 Page UX

Dark Design System.

Displays:

```text
Unable to complete this page request
Reference ID
Retry
Dashboard
```

No diagnostic detail.

---

# 158. Route Decision Register

## ROUTE-DEC-001

```text
Decision:
Use domain-oriented browser routes without an /app prefix.

Status:
PROPOSED FOR APPROVAL
```

## ROUTE-DEC-002

```text
Decision:
Astro file-based routing is the delivery routing model.

Status:
PROPOSED FOR APPROVAL
```

## ROUTE-DEC-003

```text
Decision:
Protected operational pages use server/on-demand rendering.

Status:
PROPOSED FOR APPROVAL
```

## ROUTE-DEC-004

```text
Decision:
GET routes never perform controlled mutations.

Status:
PROPOSED FOR APPROVAL
```

## ROUTE-DEC-005

```text
Decision:
Controlled mutations use Astro Actions or explicit APIs that invoke Application Use Cases.

Status:
PROPOSED FOR APPROVAL
```

## ROUTE-DEC-006

```text
Decision:
Canonical record routes use technical UUID identifiers.

Status:
PROPOSED FOR APPROVAL
```

## ROUTE-DEC-007

```text
Decision:
Human-readable business IDs remain display/search/reference identifiers.

Status:
PROPOSED FOR APPROVAL
```

## ROUTE-DEC-008

```text
Decision:
Route params and URLs are never authorization evidence.

Status:
PROPOSED FOR APPROVAL
```

## ROUTE-DEC-009

```text
Decision:
Unauthenticated browser access redirects to /login with sanitized local returnTo where useful.

Status:
PROPOSED FOR APPROVAL
```

## ROUTE-DEC-010

```text
Decision:
IDOR-sensitive unauthorized record access may map to safe 404.

Status:
PROPOSED FOR APPROVAL
```

## ROUTE-DEC-011

```text
Decision:
Review and execution workspaces use explicit nested routes such as /review and /execute.

Status:
PROPOSED FOR APPROVAL
```

## ROUTE-DEC-012

```text
Decision:
E-Signature is a controlled ceremony, not a standalone GET mutation route.

Status:
PROPOSED FOR APPROVAL
```

## ROUTE-DEC-013

```text
Decision:
List filters should be represented in validated URL query parameters where practical.

Status:
PROPOSED FOR APPROVAL
```

## ROUTE-DEC-014

```text
Decision:
Dashboard cards and notifications navigate to records/filtered work queues and never execute controlled actions.

Status:
PROPOSED FOR APPROVAL
```

## ROUTE-DEC-015

```text
Decision:
Every protected operational Astro page must have a manifest entry and route-access tests.

Status:
PROPOSED FOR APPROVAL
```

## ROUTE-DEC-016

```text
Decision:
Machine health endpoints and System Health UI are separate routes/capabilities.

Status:
PROPOSED FOR APPROVAL
```

## ROUTE-DEC-017

```text
Decision:
Internal operational routes are not public SEO/indexable pages.

Status:
PROPOSED FOR APPROVAL
```

## ROUTE-DEC-018

```text
Decision:
Astro reserved namespaces _astro, _actions and _server_islands are never used for application route naming.

Status:
PROPOSED FOR APPROVAL
```

---

# 159. Deferred Route Decisions

```text
DR-001 Exact password recovery/reset URL contract
DR-002 Exact pagination transport: page vs cursor
DR-003 Whether Quality RCA needs independent list route
DR-004 Whether NCR may be created independently
DR-005 Whether CAPA may be created independently
DR-006 Equipment creation route availability
DR-007 Calibration contextual creation pattern
DR-008 Maintenance contextual creation pattern
DR-009 Explicit report export endpoint vs Astro Action
DR-010 File preview endpoint
DR-011 Exact health endpoint exposure rules
DR-012 Route cache headers
DR-013 Trailing slash Astro config
DR-014 Enhanced client-side navigation adoption
DR-015 External/API versioning if integrations are added
```

---

# 160. Forbidden Route Patterns

```text
GET /approve
GET /release
GET /void
GET /restore
GET /sign

?action=approve
?status=APPROVED
?role=ADMIN

/client-chosen-final-state

Raw table names in routes
Raw SQL in report query parameters
Secret/token in operational URLs
External returnTo URL
Unregistered protected page
Client-only route authorization
Loading global data then hiding unauthorized rows
Business logic inside Astro page
```

---

# 161. Route Implementation Checklist

```text
[ ] Route ID exists
[ ] UI Page ID mapped
[ ] Domain Owner mapped
[ ] Astro file path mapped
[ ] Route class defined
[ ] Authentication requirement defined
[ ] Permission binding defined
[ ] Scope behavior defined
[ ] Dynamic params validated
[ ] Query params validated
[ ] Unauthorized behavior defined
[ ] Missing record behavior defined
[ ] Related mutations use Action/API
[ ] No GET mutation
[ ] Navigation entry mapped
[ ] Breadcrumb mapped
[ ] Route tests added
[ ] IDOR tests added where dynamic
[ ] RTL/page shell uses Design System
```

---

# 162. Dynamic Record Route Checklist

```text
[ ] UUID syntax validated
[ ] Entity lookup scoped/authorized
[ ] Business ID displayed
[ ] State displayed
[ ] Version displayed where controlled
[ ] Missing entity safe 404
[ ] Unauthorized entity safe response
[ ] No existence leakage
[ ] Related routes use canonical resolver
```

---

# 163. Review Route Checklist

```text
[ ] Reviewer authenticated
[ ] Explicit review permission
[ ] Correct scope
[ ] Correct state
[ ] SoD checked
[ ] Exact version displayed
[ ] Decision mutation reauthorizes
[ ] Stale version blocks
[ ] E-Signature where required
[ ] Audit/history updated by use case
```

---

# 164. Production Route Gate

Before production:

```text
[ ] All browser routes registered
[ ] All protected routes access-tested
[ ] No orphan Astro pages
[ ] No orphan manifest entries marked complete
[ ] All dynamic IDs validated
[ ] IDOR negative tests pass
[ ] No GET controlled mutation
[ ] Login returnTo protected against open redirect
[ ] 404 safe
[ ] 500 safe
[ ] Actions reauthorize
[ ] Dashboard routes scoped
[ ] Reports scoped
[ ] File routes scoped
[ ] Admin routes permission-gated
[ ] System routes risk-gated
```

---

# 165. Final Navigation Model

```text
                           /
                           │
              ┌────────────┴─────────────┐
              │                          │
        Unauthenticated             Authenticated
              │                          │
              ▼                          ▼
           /login                   /dashboard
                                         │
        ┌──────────────┬───────────────┬─┴────────────┐
        ▼              ▼               ▼              ▼
      Work           Quality       Operations       System
        │              │               │              │
      Tasks         Findings       Quarantine       Admin
                   NCR / RCA       Laboratory       Health
                   CAPA            Assets           Backup
                                   Documents
                                   Approvals
                                   Change Requests
                                   Reports
```

---

# 166. Final Request Model

```text
Browser URL
   ↓
Astro File-Based Route
   ↓
Session / Request Context
   ↓
Page-level Authorized Query
   ↓
Domain/Application
   ↓
Authorized View Model
   ↓
Dark QC UI
```

Mutation:

```text
Button / Form Intent
   ↓
Astro Action / API
   ↓
Authentication
   ↓
Authorization
   ↓
State + Version + SoD
   ↓
Business Rules
   ↓
Transaction
   ↓
Database
   ↓
Audit / Outbox
   ↓
Redirect / Updated Page
```

---

# 167. Final Principle

> **URLs identify where the user is; they never decide what the user is allowed to do.**

> **GET renders truth. Actions request change. Domain rules decide whether the change can happen.**

> **Every controlled page has an owner. Every dynamic route is authorization-aware. Every important record has one canonical deep link.**

---

# 168. Document Status

```text
Document:
Documents/ROUTE-MANIFEST-SPECIFICATION.md

Version:
1.0 Draft

Routing:
Astro File-Based Routing

Rendering:
Server / On-demand

Browser Route Style:
Domain-oriented

/app Prefix:
No

Canonical Dynamic Record Identifier:
UUID

Business IDs:
Display / Search / Human Reference

GET Controlled Mutations:
Forbidden

Mutation Boundary:
Astro Actions / Explicit API
→ Application Use Cases

Dashboard:
Scope-aware navigation only

Review Workspaces:
Explicit /review routes

Execution Workspaces:
Explicit /execute routes

E-Signature:
Controlled ceremony
Not standalone GET mutation

Authentication:
Redirect to /login

Unauthorized Dynamic Entity:
Safe 403/404 according to leakage risk

Internal Operational SEO:
NOINDEX

Route Coverage:
Every protected route must be registered and tested

Approval Status:
DRAFT FOR USER REVIEW
```
