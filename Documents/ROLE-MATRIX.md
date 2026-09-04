# ROLE-MATRIX.md

# QC Operations & Laboratory Management System

## Role Model & Responsibility Matrix — v1.0

---

# 1. Purpose

هذه الوثيقة تحدد المعنى الرسمي للأدوار الأساسية داخل:

> **QC Operations & Laboratory Management System**

وهي تجيب على:

```text
What is this role responsible for?
What kind of work does this role perform?
What operational scope does this role normally have?
Where does this role stop?
How does this role participate in review and approval?
What must never be assumed from the role name alone?
```

هذه الوثيقة لا تحدد كل Action تفصيليًا.

التفصيل النهائي يكون في:

```text
PERMISSION-MATRIX.md
```

---

# 2. Core Principle

القاعدة الأساسية:

> **Role ≠ Permission**

الدور يمثل:

```text
Organizational responsibility
Operational context
Typical authority level
Expected workflow participation
```

لكن صلاحية Action محددة لا تعتمد على اسم الدور فقط.

مثال:

وجود المستخدم كـ:

```text
Manager
```

لا يعني تلقائيًا:

```text
Can approve every Lab Test
Can release every material
Can void every record
Can view every record
```

هذه القرارات تعتمد على:

```text
Permission
Scope
Entity
State
Separation of Duties
Business Rule
```

---

# 3. Foundation Roles

الأدوار الأساسية المعتمدة حاليًا:

```text
Employee
Supervisor
Manager
Admin
```

هذه هي Foundation Roles.

لا يتم إنشاء أدوار إضافية إلا عند وجود Requirement حقيقية لا يمكن حلها بـ:

```text
Permissions
Scopes
Assignments
Teams
Functional responsibilities
```

---

# 4. Role Hierarchy Warning

الأدوار ليست Hierarchy بسيطة من نوع:

```text
Employee < Supervisor < Manager < Admin
```

هذا تصور غير صحيح.

الصحيح:

```text
Employee
→ Operational execution

Supervisor
→ Operational supervision / review

Manager
→ Management / controlled approval authority where granted

Admin
→ System administration / technical governance
```

`Admin` ليس أعلى Quality Approver تلقائيًا.

---

# 5. Shared Role Rules

## RM-GEN-001 — All Roles Are Subject to Authorization

كل Role يخضع لنفس centralized server-side authorization.

---

## RM-GEN-002 — No Role Bypasses Record Integrity

لا يستطيع أي Role تجاوز:

```text
Approved record immutability
Audit requirements
Version checks
State machines
Concurrency protection
Controlled correction
```

---

## RM-GEN-003 — No Role Has Unlimited Historical Rewrite Authority

حتى Admin لا يستطيع تعديل الحقيقة التاريخية مباشرة.

---

## RM-GEN-004 — Scope Applies to All Roles

يمكن أن تكون صلاحية المستخدم محددة حسب:

```text
Department
Team
Site
Business unit
Assigned records
Created records
Managed users
Operational area
```

التفصيل يعتمد لاحقًا على Permission/Scope Model.

---

## RM-GEN-005 — Role Does Not Override Separation of Duties

إذا المستخدم غير مسموح له مراجعة أو اعتماد Record معين بسبب SoD:

> تغيير UI أو اسم Role لا يغير هذا القرار.

---

## RM-GEN-006 — User May Require Multiple Capabilities

قد يحتاج المستخدم Permissions من أكثر من Domain بدون إنشاء Role جديد.

---

# 6. Employee

# Official Definition

> **Employee is the primary operational executor of assigned QC and laboratory work.**

---

# 7. Employee Purpose

الغرض الأساسي:

```text
Execute assigned work
Enter operational data
Create drafts
Perform inspections/tests where authorized
Attach evidence
Submit work for review
Respond to returned work
Complete assigned tasks
```

Employee هو أقرب Role للعمل اليومي الفعلي.

---

# 8. Employee Typical Responsibilities

قد تشمل:

```text
Tasks
Receiving data entry
Inspection execution
Lab test execution
Sample entry
Measurements
Evidence uploads
Comments
Checklist completion
Draft preparation
Document acknowledgement
Equipment usage recording
Operational observations
```

حسب Permissions المعتمدة.

---

# 9. Employee Default Scope Principle

Employee عادة يرى ويعمل على:

```text
Own work
Assigned work
Records explicitly available to their operational scope
Shared operational registers where permitted
```

ولا نفترض تلقائيًا:

```text
Full department visibility
Full system visibility
Management visibility
```

---

# 10. Employee Draft Authority

Employee يمكن أن ينشئ أو يعدل Drafts عندما تسمح Business Rules.

مثل:

```text
Task updates
Inspection draft
Lab Test draft
Receiving record draft
Evidence
Comments
```

لكن الوصول إلى:

```text
SUBMITTED
APPROVED
CLOSED
```

يغير قواعد التعديل.

---

# 11. Employee Submission

Employee قد يستطيع:

```text
Submit own work
```

إذا:

```text
Required fields complete
Validation passes
Required evidence exists
State allows submission
Permission allows action
```

---

# 12. Employee Review Position

Employee ليس Reviewer افتراضيًا.

قد تمنح له review capability مستقبلاً إذا توجد business requirement.

لكن لا يتم افتراض ذلك.

---

# 13. Employee Approval Position

القاعدة التأسيسية:

```text
Employee does not have controlled approval authority by default.
```

أي exception تحتاج Permission صريحة وسياسة معتمدة.

---

# 14. Employee Release Position

Employee لا يملك Release authority افتراضيًا.

`Release System` decision يبقى:

```text
POLICY-DEPENDENT
```

---

# 15. Employee Controlled Record Restriction

بعد Submit:

Employee لا يعدل record بحرية.

إذا Returned:

قد يعاد فتح editable state حسب State Machine.

---

# 16. Employee Prohibited Behaviors

Employee لا يستطيع افتراضيًا:

```text
Approve controlled records
Rewrite approved records
Change audit history
Modify permissions
Manage users
Alter system configuration
Override controlled limits
Bypass inspection/lab validation
Change another user's signed record
Perform unrestricted administrative correction
```

---

# 17. Employee Dashboard

Dashboard يجب أن يركز على:

```text
My Tasks
Assigned Work
Pending Inspections
Draft Inspections
Draft Lab Tests
Returned Work
Required Corrections
Documents Requiring Action
Upcoming Due Work
Notifications
```

الهدف:

> What do I need to do now?

---

# 18. Supervisor

# Official Definition

> **Supervisor is responsible for operational oversight, team coordination, and review activities within an authorized scope.**

---

# 19. Supervisor Purpose

الغرض الأساسي:

```text
Supervise operational execution
Review submitted work
Coordinate team workload
Identify exceptions
Return incomplete/incorrect work
Monitor overdue work
Escalate quality issues
```

---

# 20. Supervisor Typical Responsibilities

قد تشمل:

```text
Review Inspection Reports
Review Lab Tests
Review operational records
Team task oversight
Work reassignment
Returned-work review
Exception monitoring
HOLD/FAIL monitoring
Document review
Operational escalation
```

حسب Permissions.

---

# 21. Supervisor Scope

عادة يعمل ضمن:

```text
Assigned team
Department
Operational area
Records under supervision
```

ولا يعني Role وحده الوصول لكل الشركة.

---

# 22. Supervisor Creation Authority

Supervisor قد ينشئ operational records عندما يكون ذلك جزءًا من العمل.

مثل:

```text
Tasks
Findings
NCR drafts
Receiving items
Inspection work
Lab test work
```

لكن Permission Matrix هي المرجع النهائي.

---

# 23. Supervisor Review Authority

Supervisor هو أول Role مرشح بشكل طبيعي لـReview.

لكن:

```text
Role = Supervisor
```

لا يكفي وحده.

يجب التحقق من:

```text
Permission
Scope
Entity state
Separation of duties
Record assignment
```

---

# 24. Supervisor Must Not Silently Fix Submitted Work

إذا Supervisor وجد خطأ في بيانات Employee بعد Submit:

ممنوع:

```text
Open field
Edit employee value
Save silently
```

المسارات الصحيحة:

```text
Return for correction
Review comment
Controlled correction
Authorized reviewer annotation
```

حسب نوع السجل.

---

# 25. Supervisor Approval Position

Supervisor لا يعتبر Approver لكل Controlled Records تلقائيًا.

بعض workflows قد تسمح Supervisor approval.

وبعضها قد تتطلب Manager.

هذا:

```text
POLICY-DEPENDENT
```

---

# 26. Supervisor Release Position

Release authority ليست implicit في Role.

تحدد لاحقًا.

---

# 27. Supervisor Team Responsibilities

قد يكون مسؤولًا عن:

```text
Unassigned work
Overdue tasks
Pending reviews
Team workload
Returned submissions
Operational blockers
Inspection backlog
Lab backlog
Exceptions
```

---

# 28. Supervisor Separation of Duties

لا يسمح Supervisor بمراجعة أو اعتماد Record إذا policy تمنعه لأنه:

```text
Author
Executor
Previous approver
Conflicting participant
```

---

# 29. Supervisor Prohibited Behaviors

لا يستطيع افتراضيًا:

```text
Bypass approval workflow
Rewrite approved history
Change system permissions
Modify audit records
Perform unrestricted admin corrections
Invent scientific limits
Override controlled source
Approve own record where SoD prohibits it
```

---

# 30. Supervisor Dashboard

يركز على:

```text
Needs Review
Pending Inspection Reports
Pending Lab Reviews
Returned Work
Team Tasks
Overdue Work
HOLD / FAIL
Team Exceptions
Open Findings
Document Reviews
Upcoming Calibration Issues
```

الهدف:

> What requires my review or intervention?

---

# 31. Manager

# Official Definition

> **Manager is responsible for higher-level controlled decisions, approvals, quality oversight, escalation, and management visibility within an authorized scope.**

---

# 32. Manager Purpose

الغرض:

```text
Approve controlled work where authorized
Make higher-level operational decisions
Oversee quality risk
Review escalations
Monitor performance
Manage unresolved exceptions
Make policy-governed decisions
```

---

# 33. Manager Typical Responsibilities

قد تشمل:

```text
Controlled approvals
Quality escalation
NCR/CAPA oversight
Critical finding review
Quarantine exceptions
Release decisions where permitted
Change Request approvals
Management reporting
Calibration risk oversight
Document approval
Resource/workload visibility
```

---

# 34. Manager Visibility

Manager غالبًا يحتاج broader visibility من Supervisor.

لكن لا يعني:

```text
Global unrestricted visibility
```

إلا إذا scope policy سمحت.

---

# 35. Manager Approval Authority

Manager هو Role مرشح للاعتماد Controlled.

لكن أي approval يحتاج:

```text
Explicit permission
Correct state
Correct scope
Version check
Separation-of-duties check
E-Signature where required
```

---

# 36. Manager Does Not Automatically Own Every Approval

مثال:

Manager قد يسمح له:

```text
Approve Inspection Report
```

لكن لا يعني تلقائيًا:

```text
Approve SOP
Approve CAPA
Release receiving
Void Lab Test
Approve equipment change
```

كل Action منفصلة.

---

# 37. Manager Release Position

Manager قد يكون المرشح الطبيعي لـRelease.

لكن القرار النهائي لا يعتمد هنا.

الحالة:

```text
POLICY-DEPENDENT
```

وسيتم تثبيتها في:

```text
PERMISSION-MATRIX.md
```

---

# 38. Manager Quality Responsibility

Manager قد يراقب:

```text
Critical Findings
NCR
RCA
CAPA
Repeated Failures
Quarantine Exceptions
System Release Pending
Calibration Risk
Overdue Controlled Work
```

---

# 39. Manager Correction Restriction

Manager لا يعدل Approved Record مباشرة.

إذا اكتشف خطأ:

```text
Correction
Void
Revision
New Version
Change Request
```

بحسب Domain.

---

# 40. Manager Separation of Duties

Manager لا يستطيع اعتماد own work إذا Policy تمنع ذلك.

"Manager" لا يتجاوز SoD.

---

# 41. Manager Prohibited Behaviors

ممنوع افتراضيًا:

```text
Rewrite audit
Edit approved values directly
Override database integrity
Invent scientific requirements
Bypass signature requirements
Use admin functionality without permission
Approve own record where prohibited
```

---

# 42. Manager Dashboard

يركز على:

```text
Pending Approvals
Critical Findings
NCR Status
CAPA Status
Quarantine Exceptions
Release Pending
Repeated FAIL/HOLD
Calibration Risk
Change Requests
Overdue Controlled Work
Management KPIs
```

الهدف:

> What needs a decision, approval, or escalation?

---

# 43. Admin

# Official Definition

> **Admin is responsible for system administration, identity administration, configuration, security, technical health, and controlled administrative operations.**

---

# 44. Admin Purpose

الغرض:

```text
Manage users
Manage account states
Manage roles/permissions
Manage system configuration
Manage technical settings
Monitor health
Manage deployment-related configuration
Support backups/restores
Manage reference/configuration data where authorized
```

---

# 45. Admin Is Not a Universal Business Approver

هذه قاعدة أساسية:

> **Admin ≠ Super Approver**

وجود Admin role لا يعطي تلقائيًا:

```text
Inspection approval
Lab approval
Document approval
CAPA approval
Material release
NCR closure
```

إذا Admin يحتاج Business Permission:

> تمنح له صراحة مثل أي مستخدم آخر حسب السياسة.

---

# 46. Admin Technical Responsibilities

قد تشمل:

```text
User activation/deactivation
Password reset
Session revocation
Role assignment
Permission administration
System configuration
Security settings
Environment visibility
System health
Migration visibility
Backup administration
Restore administration
Storage visibility
AI provider configuration
Reference-data administration
```

---

# 47. Admin User Management

Admin قد يستطيع:

```text
Create user
Activate user
Deactivate user
Reset password
Assign roles
Assign permissions/scopes
Revoke sessions
```

وكل ذلك audited.

---

# 48. Admin Password Reset

Admin لا يعرف أو يحدد password permanent نيابة عن المستخدم إلا إذا architecture/policy صممت temporary password mechanism آمن.

المبدأ:

```text
Reset
Invalidate sessions
Require user-owned password
Audit
```

---

# 49. Admin Controlled Data Restriction

حتى Admin لا يستطيع:

```text
Direct edit approved inspection
Direct edit approved lab result
Rewrite signed document
Delete historical evidence
Alter audit history
Rewrite previous calibration fact
```

---

# 50. Administrative Correction

إذا يوجد خطأ إداري:

```text
Reason
Before value
After value
Actor
Timestamp
Controlled path
Audit
E-Signature if required
```

---

# 51. Admin Database Access

Application Admin role لا يعني Database Superuser.

يجب فصل:

```text
Application Administration
Database Administration
Infrastructure Administration
```

حسب deployment model.

---

# 52. Admin Audit Access

Admin قد يرى technical/admin audit حسب Permission.

لكن رؤية Audit لا تعني تعديله.

---

# 53. Admin Backup / Recovery Position

Admin هو المرشح الطبيعي لإدارة:

```text
Backup
Verification
Restore Drill
Recovery Operations
```

لكن Production restore قد يحتاج authorization إضافية وسياسة تشغيلية.

---

# 54. Admin System Health Dashboard

يركز على:

```text
Application Health
Readiness
PostgreSQL
Schema Version
Migration State
Security Alerts
Backup State
Restore State
Storage
Critical Errors
AI Provider
Failed Operations
```

---

# 55. Admin Prohibited Behaviors

ممنوع:

```text
Rewrite controlled history
Alter audit evidence
Use admin role as automatic QC approval
Bypass SoD
Invent QC rules
Bypass E-Signature
Directly modify historical records through admin UI
```

---

# 56. Role Comparison Summary

| Area                       | Employee            | Supervisor         | Manager                       | Admin                                 |
| -------------------------- | ------------------- | ------------------ | ----------------------------- | ------------------------------------- |
| Operational execution      | Primary             | Yes where needed   | Possible                      | Not primary                           |
| Create drafts              | Yes                 | Yes                | Possible                      | Only where business permission exists |
| Submit own work            | Yes where permitted | Yes                | Yes where permitted           | Not automatic                         |
| Review others              | Not default         | Primary candidate  | Yes where permitted           | Not automatic                         |
| Approve controlled records | Not default         | Policy-dependent   | Primary candidate             | Not automatic                         |
| Material Release           | Not default         | Policy-dependent   | Policy-dependent              | Not automatic                         |
| Team oversight             | No                  | Primary            | Broader oversight             | No                                    |
| Management oversight       | No                  | Limited            | Primary                       | Technical only                        |
| Manage users               | No                  | No                 | No by default                 | Yes                                   |
| Manage permissions         | No                  | No                 | No                            | Yes                                   |
| System configuration       | No                  | No                 | Limited if separately granted | Primary                               |
| System health              | No                  | Limited if granted | Management view possible      | Primary                               |
| Backup administration      | No                  | No                 | Visibility possible           | Primary                               |
| Rewrite approved history   | No                  | No                 | No                            | No                                    |
| Modify audit history       | No                  | No                 | No                            | No                                    |

---

# 57. High-Level Role Boundary Matrix

Legend:

```text
YES
→ normal responsibility candidate

NO
→ not part of default role

POLICY
→ requires explicit business decision / permission
```

| Capability                           | Employee | Supervisor | Manager |  Admin |
| ------------------------------------ | -------: | ---------: | ------: | -----: |
| Perform assigned operational work    |      YES |        YES |  POLICY |     NO |
| Create operational Drafts            |      YES |        YES |  POLICY | POLICY |
| Edit own Draft                       |      YES |        YES |  POLICY | POLICY |
| Submit own work                      |      YES |        YES |  POLICY | POLICY |
| Review another user's submitted work |       NO |        YES |  POLICY | POLICY |
| Return work for correction           |       NO |        YES |  POLICY | POLICY |
| Approve controlled record            |       NO |     POLICY |  POLICY | POLICY |
| Release receiving/material           |       NO |     POLICY |  POLICY | POLICY |
| Void controlled record               |       NO |     POLICY |  POLICY | POLICY |
| Close NCR/CAPA                       |       NO |     POLICY |  POLICY | POLICY |
| Perform Retest                       |   POLICY |     POLICY |  POLICY |     NO |
| Authorize Retest                     |       NO |     POLICY |  POLICY |     NO |
| Create Finding                       |   POLICY |        YES |     YES |     NO |
| Create NCR                           |   POLICY |        YES |     YES |     NO |
| Manage Equipment records             |   POLICY |     POLICY |  POLICY | POLICY |
| Manage Document Drafts               |   POLICY |     POLICY |  POLICY | POLICY |
| Approve Document                     |       NO |     POLICY |  POLICY | POLICY |
| Approve Change Request               |       NO |     POLICY |  POLICY | POLICY |
| View management reports              |       NO |     POLICY |     YES | POLICY |
| Export controlled reports            |   POLICY |     POLICY |     YES | POLICY |
| Manage users                         |       NO |         NO |      NO |    YES |
| Assign roles                         |       NO |         NO |      NO |    YES |
| Manage permissions                   |       NO |         NO |      NO |    YES |
| Configure system                     |       NO |         NO |      NO |    YES |
| View System Health                   |       NO |     POLICY |  POLICY |    YES |
| Perform backup operations            |       NO |         NO |      NO |    YES |
| Perform production restore           |       NO |         NO |  POLICY | POLICY |
| Rewrite approved record directly     |       NO |         NO |      NO |     NO |
| Alter audit history                  |       NO |         NO |      NO |     NO |

---

# 58. Separation of Duties Model

الـRole Matrix لا يحدد SoD الكامل.

لكن نثبت المفهوم التالي:

```text
Author
Reviewer
Approver
```

هي responsibilities منفصلة منطقيًا.

النظام يجب أن يعرف:

```text
Who created/executed the record?
Who reviewed it?
Who approved it?
```

---

# 59. Self-Review

الحالة الافتراضية المقترحة:

```text
Author cannot review own controlled record
```

لكن التنفيذ النهائي:

```text
POLICY-DEPENDENT
```

حتى يتم تثبيته في `PERMISSION-MATRIX.md`.

---

# 60. Self-Approval

القاعدة التأسيسية:

> Controlled records يجب أن تدعم منع self-approval.

السياسة الدقيقة لكل Domain تحدد لاحقًا.

---

# 61. Reviewer + Approver Same Person

هل Reviewer يستطيع أن يكون Approver لنفس record؟

```text
UNCONFIRMED
```

قد تختلف حسب workflow.

---

# 62. Role Scope Model

كل User Role يجب أن يمكن ربطه بـScope.

أمثلة:

```text
Global
Department
Team
Site
Lab
QC Area
Assigned Records
Created Records
Managed Group
```

ولا يتم hardcode أن Role يرى كل شيء.

---

# 63. Scope Examples

مثال Supervisor:

```text
Role:
Supervisor

Scope:
Incoming Inspection Team
```

قد يرى:

```text
All incoming inspection records in assigned team
```

لكن لا يرى:

```text
Unrelated lab records
```

إلا إذا لديه Permission أخرى.

---

# 64. Multiple Roles

قد يدعم النظام مستقبلًا:

```text
User → Multiple Roles
```

لكن يجب تجنب privilege ambiguity.

المبدأ:

> Effective permissions are calculated centrally.

ولا تنفذ عبر scattered role checks.

---

# 65. Role Assignment Changes

تغيير Role أو Scope يعتبر Administrative Security Event.

يجب تسجيل:

```text
Changed user
Previous role/scope
New role/scope
Actor
Timestamp
Reason where required
```

---

# 66. Role Removal

إزالة Role لا تمحو الأعمال القديمة المنفذة بذلك المستخدم.

Historical audit يبقى كما هو.

---

# 67. User Deactivation

تعطيل User لا يحذف:

```text
Authorship
Reviews
Approvals
Signatures
Audit history
Tasks
Evidence references
```

---

# 68. Acting User Principle

النظام يعتمد على:

```text
Current authenticated actor
```

ولا يسمح للمستخدم باختيار:

```text
Act as another user
```

للعمليات Controlled.

أي Delegation مستقبلية تحتاج model رسمي مستقل.

---

# 69. Delegation

مثل:

```text
Manager on leave
Supervisor acting manager
```

غير معتمد حاليًا.

الحالة:

```text
UNCONFIRMED
```

إذا احتجناه مستقبلًا يجب تحديد:

```text
Start date
End date
Delegated permissions
Scope
Reason
Approver
Audit
```

ولا يتم عبر مشاركة password.

---

# 70. Temporary Elevated Permission

أي temporary permission مستقبلية يجب أن تكون:

```text
Explicit
Time-bound
Audited
Scoped
Revocable
```

ولا نعتمد عليها في Foundation إلا عند Requirement.

---

# 71. Employee Escalation Responsibility

Employee يجب أن يستطيع رفع المشكلة بدل تجاوزها.

مثل:

```text
Unable to complete inspection
Unexpected result
Equipment unavailable
Missing WI
Invalid template
Material discrepancy
```

المسار:

```text
Record issue
Block/Hold where allowed
Notify/Escalate
```

وليس اختراع solution.

---

# 72. Supervisor Escalation Responsibility

Supervisor مسؤول عن تصعيد الحالات التي تتجاوز scope أو authority.

مثل:

```text
Critical FAIL
Recurring failure
Unresolved HOLD
Major NCR
Overdue CAPA
Controlled exception
```

---

# 73. Manager Escalation Responsibility

Manager مسؤول عن business escalation الأعلى مثل:

```text
Major quality risk
Unresolved cross-domain issue
Repeated nonconformance
Operational release risk
Compliance concern
Production-impacting QC issue
```

---

# 74. Admin Escalation Responsibility

Admin يصعد:

```text
Security incident
Database issue
Backup failure
Restore failure
Migration failure
Storage issue
Authentication incident
System outage
Critical runtime error
```

ولا يتخذ scientific QC decision بسبب مشكلة تقنية.

---

# 75. Scientific Responsibility Boundary

Role alone لا يمنح scientific authority.

مثال:

```text
Admin
```

لا يصبح مؤهلًا علميًا لاتخاذ PASS/FAIL.

وكذلك:

```text
Manager
```

لا يعني تلقائيًا أنه authorized لكل scientific decision.

---

# 76. E-Signature and Roles

وجود Role مناسب لا يلغي E-Signature.

مثال:

```text
Manager
+
Approve Permission
+
Correct Scope
+
Valid State
```

قد يظل يحتاج:

```text
E-Signature
```

إذا policy تطلبها.

---

# 77. Audit Principle by Role

كل Role accountable عن أفعاله.

Audit لا يسجل:

```text
Role only
```

بل يسجل:

```text
User ID
Role/permission context where relevant
Action
Timestamp
Entity
```

---

# 78. Reports by Role

Employee:

```text
Operational / own-scope reports
```

Supervisor:

```text
Team / review / operational exception reports
```

Manager:

```text
Management / approval / quality overview reports
```

Admin:

```text
Technical / security / administration / health reports
```

لكن exact permissions لاحقًا.

---

# 79. Search by Role

Search لا يعتمد على Role وحده.

نتيجة البحث تمر عبر:

```text
Search
↓
Authorization
↓
Scope
↓
Allowed result
```

---

# 80. Dashboard by Role

Dashboard ليس مجرد إخفاء Cards.

كل Role يجب أن يحصل على prioritized operational view.

```text
Employee
→ Execute

Supervisor
→ Review / Coordinate

Manager
→ Decide / Approve / Escalate

Admin
→ Administer / Protect / Recover
```

---

# 81. Role Anti-Patterns

ممنوع تصميم system logic مثل:

```text
if user.role === "admin"
    allow everything
```

ممنوع:

```text
Manager = access all records
```

ممنوع:

```text
Supervisor = can approve everything below manager
```

ممنوع:

```text
Employee = can only see own records
```

كافتراض مطلق بدون Scope Policy.

---

# 82. No Role Explosion

ممنوع إنشاء أدوار مثل:

```text
LabApprover
InspectionApprover
NCRManager
CAPAReviewer
DocumentSigner
ReceivingReleaser
```

فقط لحل permissions.

الأفضل:

```text
Role
+
Permissions
+
Scopes
+
Policies
```

---

# 83. When a New Role Is Justified

Role جديد ينشأ فقط إذا توجد مسؤولية تنظيمية مستقلة مستمرة.

السؤال:

> هل الشركة فعليًا تعتبر هذا نوع مستخدم مختلف وظيفيًا؟

إذا الجواب لا:

> استخدم Permission أو Scope.

---

# 84. Role Matrix vs Permission Matrix

`ROLE-MATRIX.md` يجيب:

```text
What is this person's organizational/system responsibility?
```

أما:

`PERMISSION-MATRIX.md`

فيجيب:

```text
Can this actor perform ACTION X
on ENTITY Y
in STATE Z
within SCOPE S?
```

---

# 85. Role Matrix vs State Machine

Role لا يحدد lifecycle.

مثال:

```text
Manager
```

لا يستطيع نقل record من أي state إلى أي state.

`STATE-MACHINES.md` تحدد transition.

و`PERMISSION-MATRIX.md` تحدد من يستطيع تنفيذها.

---

# 86. Role Matrix vs Business Rules

`BUSINESS-RULES.md` يحدد:

```text
What must happen?
What is forbidden?
```

`ROLE-MATRIX.md` يحدد:

```text
Who generally participates and why?
```

---

# 87. Role-Related Business Decisions Pending

| Decision ID | Question                                                 |
| ----------- | -------------------------------------------------------- |
| RD-001      | هل Employee يستطيع إنشاء Receiving Item؟                 |
| RD-002      | هل Employee يستطيع إنشاء Finding/NCR؟                    |
| RD-003      | هل Supervisor يستطيع Approve Inspection Report؟          |
| RD-004      | هل Supervisor يستطيع Approve Lab Test؟                   |
| RD-005      | هل Manager هو Role الافتراضي للـFinal Approval؟          |
| RD-006      | من يستطيع Release Receiving Item؟                        |
| RD-007      | هل Admin يمكن منحه Business Approval permissions؟        |
| RD-008      | هل Reviewer وApprover يمكن أن يكونا نفس الشخص؟           |
| RD-009      | ما exact self-review policy؟                             |
| RD-010      | ما exact self-approval policy؟                           |
| RD-011      | هل المستخدم يمكن أن يملك أكثر من Role؟                   |
| RD-012      | هل نحتاج Delegation/Acting Role؟                         |
| RD-013      | هل Supervisor visibility team-based أو department-based؟ |
| RD-014      | هل Manager visibility global أو scoped؟                  |
| RD-015      | من يملك Retest authorization؟                            |
| RD-016      | من يستطيع Void records لكل Domain؟                       |
| RD-017      | من يستطيع Close NCR؟                                     |
| RD-018      | من يستطيع Close CAPA؟                                    |
| RD-019      | من يستطيع Approve WI/SOP؟                                |
| RD-020      | من يستطيع Production Restore؟                            |

---

# 88. Defaults Until Permission Matrix Is Approved

قبل اكتمال `PERMISSION-MATRIX.md`:

```text
No sensitive action is implicitly allowed.
```

خصوصًا:

```text
Approve
Release
Void
Close controlled record
Manage permissions
Restore production
Controlled correction
```

الحالة:

```text
DENY UNTIL EXPLICITLY DEFINED
```

---

# 89. Permission Implementation Principle

الكود لاحقًا يجب أن يستخدم concepts مثل:

```text
canCreateReceivingItem(actor, scope)

canSubmitInspection(actor, report)

canReviewInspection(actor, report)

canApproveInspection(actor, report)

canReleaseReceivingItem(actor, item)

canExecuteLabTest(actor, test)

canApproveLabTest(actor, test)

canManageDocument(actor, document)

canApproveDocument(actor, document)

canViewSystemHealth(actor)

canManageUsers(actor)

canRestoreBackup(actor)
```

وليس role-only conditions.

---

# 90. Role Testing Contract

كل Role يحتاج Positive + Negative Tests.

مثال:

```text
Employee can edit authorized draft
Employee cannot approve controlled report

Supervisor can review authorized submitted report
Supervisor cannot review own report where SoD denies

Manager can approve authorized record
Manager cannot approve stale version

Admin can manage user
Admin cannot rewrite approved Lab Test
```

---

# 91. Role/Scope Test Matrix Requirement

الاختبارات لاحقًا يجب أن تغطي combinations مثل:

```text
Correct Role + Correct Scope
Correct Role + Wrong Scope
Wrong Role + Correct Scope
Inactive User
Self-action conflict
Wrong record state
Expired session
Revoked permission
```

---

# 92. UI Role Rule

UI يستخدم Role/Permissions لتحسين UX فقط.

مثل:

Employee لا يحتاج مشاهدة:

```text
System Backup
Permission Editor
Security Configuration
```

لكن Server authorization يبقى المرجع.

---

# 93. Role Change Consistency

إذا تغير Role أو Permission أثناء وجود session فعالة:

يجب أن تتأكد architecture أن elevated access القديم لا يستمر دون حدود غير مقصودة.

التفصيل في `SECURITY.md`.

---

# 94. Controlled Record Attribution

Historical record يحتفظ بالـActor identity كما كانت.

حتى إذا تغير user لاحقًا من:

```text
Supervisor
→ Manager
```

لا نعيد كتابة التاريخ ونقول إنه كان Manager وقت الإجراء.

---

# 95. Organizational Title vs System Role

Job Title لا يجب أن يساوي System Role تلقائيًا.

مثال:

```text
Job Title:
QC Specialist

System Role:
Employee
```

أو:

```text
Job Title:
QC Compliance Officer

System Role:
Supervisor
```

بحسب responsibility.

---

# 96. Roles Are System Constructs

الأدوار:

```text
Employee
Supervisor
Manager
Admin
```

هي System Roles.

ولا يجب افتراض أنها تمثل مسمى الموارد البشرية حرفيًا.

---

# 97. Role Assignment Principle

اختيار Role يعتمد على:

```text
Actual responsibility
Expected workflow participation
Required oversight level
Administrative responsibility
```

وليس فقط seniority.

---

# 98. Least Privilege

كل مستخدم يحصل على أقل Permission يحتاجها لتنفيذ عمله.

لا نعطي Role أعلى فقط لأن Permission ناقصة.

---

# 99. Temporary Workaround Prohibition

ممنوع حل مشاكل Permission بـ:

```text
Make user Admin temporarily
```

كحل تشغيلي طبيعي.

إذا احتاج Permission:

> تمنح بشكل Controlled ومحدود.

---

# 100. Final Role Definitions

```text
EMPLOYEE
Primary operational executor.

SUPERVISOR
Operational supervisor and review-focused role.

MANAGER
Higher-level controlled decision, approval and management oversight role.

ADMIN
System administration, security, configuration and operational health role.
```

---

# 101. Final Role Principle

كل قرار صلاحية لاحق يجب ألا يسأل فقط:

```text
What role is the user?
```

بل:

```text
Who is the actor?

What action is requested?

What entity is affected?

What state is the entity in?

What scope applies?

What permission is granted?

Does separation of duties allow it?

Does the action require E-Signature?

Does the record version still match?
```

ثم فقط:

```text
ALLOW
```

أو:

```text
DENY
```

---

# 102. Foundation Relationship

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

# 103. Document Status

```text
Document:
ROLE-MATRIX.md

Version:
1.0

Product:
QC Operations & Laboratory Management System

Roles:
Employee
Supervisor
Manager
Admin

Role Model:
Responsibility-Based

Authorization Model:
Role + Permission + Scope + Policy + State

Admin Model:
Administrative Authority ≠ Universal Business Approval

Status:
FOUNDATION — APPROVED ROLE MODEL

Pending Role Decisions:
Tracked in Section 87

Next Foundation Document:
PERMISSION-MATRIX.md
```
