# PERMISSION-MATRIX.md

# QC Operations & Laboratory Management System

## Authorization & Permission Matrix — v1.0

---

# 1. Purpose

هذه الوثيقة هي المرجع الرسمي للصلاحيات داخل:

> **QC Operations & Laboratory Management System**

وتحدد:

```text
Who may perform
Which action
On which entity
In which state
Within which scope
Under which conditions
```

هذه الوثيقة تحول:

```text
ROLE-MATRIX.md
+
BUSINESS-RULES.md
```

إلى قرارات Authorization قابلة للتنفيذ والاختبار.

---

# 2. Core Authorization Formula

أي قرار صلاحية يجب ألا يعتمد على Role فقط.

النموذج الرسمي:

```text
Authorization Decision
=
Authenticated Actor
+
Account State
+
Role
+
Explicit Permission
+
Entity
+
Entity State
+
Scope
+
Ownership / Assignment
+
Separation of Duties
+
Record Version
+
E-Signature Requirement
+
Business Rules
```

ثم النتيجة:

```text
ALLOW
```

أو:

```text
DENY
```

---

## Astro Delivery Layer — Middleware vs. Endpoint Authorization

إطار العمل الرسمي هو **Astro (server-rendered / on-demand)**. ويُثبَّت ما يلي:

- Astro middleware **يجوز له فقط** إثبات (establish) الـsession/user context داخل `locals` — مثل identity وaccount state — كتسهيل للطبقة العليا.
- **middleware لا يُعتبر authorization نهائيًا.**
- كل Astro Action وAPI endpoint **يعيد authorization بنفسه** داخل الـhandler عبر الـUse Case / Authorization layer.
- السبب: Astro Actions متاحة كـ**public endpoints** بطبيعتها، ويجب أن يكون الـauthorization داخل الـhandler نفسه، وليس الاعتماد على middleware أو إخفاء UI.
- هذا يتوافق مع Default Deny في القسم 3: أي endpoint جديد يبدأ DENY حتى يُربط بـpermission رسمية تُفحص داخل الـhandler.

---

# 3. Default Deny

القاعدة العليا:

> **Everything is denied until explicitly permitted.**

أي:

```text
New route
New action
New API
New report
New export
New admin function
New workflow transition
```

يبدأ كالتالي:

```text
DENY
```

حتى يتم ربطه بـPermission رسمية.

---

# 4. Permission Decision States

تستخدم هذه الوثيقة:

### `ALLOW`

مسموح ضمن الشروط المحددة.

### `DENY`

ممنوع.

### `CONDITIONAL`

مسموح فقط عند تحقق شروط إضافية.

### `POLICY-DEPENDENT`

لم يتم اعتماد policy النهائية بعد.

ويعامل Runtime افتراضيًا كالتالي:

```text
POLICY-DEPENDENT
=
DENY
```

حتى الاعتماد.

---

# 5. Role Definitions

الأدوار الأساسية:

```text
Employee
Supervisor
Manager
Admin
```

مع القاعدة:

> Role represents responsibility, not unlimited authority.

---

# 6. Permission Naming Convention

الصيغة:

```text
PERM-{DOMAIN}-{ACTION}
```

أمثلة:

```text
PERM-TASK-CREATE
PERM-TASK-ASSIGN

PERM-QUAR-CREATE
PERM-QUAR-RELEASE

PERM-INSP-SUBMIT
PERM-INSP-REVIEW
PERM-INSP-APPROVE

PERM-LAB-CREATE
PERM-LAB-RETEST
PERM-LAB-APPROVE

PERM-DOC-APPROVE

PERM-CHG-APPROVE

PERM-RPT-EXPORT

PERM-ADM-USERS

PERM-BKP-RESTORE
```

---

# 7. Scope Model

Permission وحدها لا تكفي.

كل permission قد تكون مرتبطة بـScope.

الـScopes الأولية:

```text
OWN
ASSIGNED
TEAM
DEPARTMENT
SITE
DOMAIN
GLOBAL
```

---

# 8. OWN Scope

يسمح للمستخدم بالتعامل فقط مع records التي:

```text
Created by actor
or
Owned by actor
```

حسب تعريف الـDomain.

---

# 9. ASSIGNED Scope

يسمح للمستخدم بالسجلات المسندة له رسميًا.

مثل:

```text
Assigned Task
Assigned Inspection
Assigned Lab Test
Assigned Review
```

---

# 10. TEAM Scope

يسمح بالسجلات الواقعة ضمن team مرتبط بالمستخدم.

التعريف الدقيق للفريق يأتي من Data Model.

---

# 11. DEPARTMENT Scope

يسمح بالسجلات التابعة لقسم المستخدم.

---

# 12. SITE Scope

للمواقع التشغيلية المختلفة مستقبلًا.

لا يعني وجود multi-tenancy.

---

# 13. DOMAIN Scope

Visibility واسعة داخل Domain معين فقط.

مثال:

```text
Laboratory Manager
→ Laboratory DOMAIN scope
```

ولا يعني access إلى Quarantine.

---

# 14. GLOBAL Scope

أوسع نطاق.

ولا يمنح إلا عند Requirement حقيقية.

---

# 15. Scope Does Not Override Permission

وجود:

```text
GLOBAL
```

لا يعني:

```text
ALLOW everything
```

بل:

```text
Permission + Global Scope
```

فقط.

---

# 16. Scope Does Not Override State

حتى المستخدم بـGlobal Scope لا يستطيع Edit سجل APPROVED إذا Business Rules تمنعه.

---

# 17. Scope Does Not Override SoD

Global Manager لا يستطيع اعتماد own record إذا policy تمنع self-approval.

---

# 18. Standard Action Vocabulary

نستخدم الأفعال التالية بشكل موحد:

```text
VIEW
LIST
CREATE
EDIT
DELETE_DRAFT
ASSIGN
REASSIGN
SUBMIT
WITHDRAW
REVIEW
RETURN
APPROVE
REJECT
RELEASE
HOLD
VOID
CLOSE
REOPEN
CORRECT
REVISE
SUPERSEDE
EXPORT
PRINT
UPLOAD
REMOVE_EVIDENCE
ADMINISTER
ARCHIVE
RESTORE
```

---

# 19. Generic Controlled Record Matrix

القاعدة التأسيسية العامة:

| Action                    |    Employee |  Supervisor |     Manager |       Admin |
| ------------------------- | ----------: | ----------: | ----------: | ----------: |
| View authorized record    |       ALLOW |       ALLOW |       ALLOW | CONDITIONAL |
| Create Draft              | CONDITIONAL | CONDITIONAL | CONDITIONAL | CONDITIONAL |
| Edit own Draft            | CONDITIONAL | CONDITIONAL | CONDITIONAL | CONDITIONAL |
| Submit own Draft          | CONDITIONAL | CONDITIONAL | CONDITIONAL | CONDITIONAL |
| Review submitted record   |        DENY | CONDITIONAL | CONDITIONAL |      POLICY |
| Return for correction     |        DENY | CONDITIONAL | CONDITIONAL |      POLICY |
| Approve controlled record |        DENY |      POLICY | CONDITIONAL |      POLICY |
| Reject controlled record  |        DENY |      POLICY | CONDITIONAL |      POLICY |
| Void controlled record    |        DENY |      POLICY |      POLICY |      POLICY |
| Directly edit Approved    |        DENY |        DENY |        DENY |        DENY |
| Rewrite Audit             |        DENY |        DENY |        DENY |        DENY |

هذا Matrix عام فقط.

الـDomain-specific rules أدناه هي المرجع الأدق.

---

# 20. State Awareness

الصلاحية يجب أن تأخذ Current State في الاعتبار.

الحالات العامة المتوقعة:

```text
DRAFT
SUBMITTED
UNDER_REVIEW
RETURNED
APPROVED
REJECTED
CLOSED
VOID
SUPERSEDED
ARCHIVED
```

ليس كل Domain يستخدم كل الحالات.

---

# 21. DRAFT Authorization

DRAFT عادة:

```text
Editable
Deletable if domain permits
Submittable
```

لكن فقط ضمن permission + scope.

---

# 22. SUBMITTED Authorization

SUBMITTED:

```text
Normal editing denied
Review workflow active
```

---

# 23. RETURNED Authorization

RETURNED:

قد يعود للمؤلف أو executor للتصحيح.

لكن تاريخ submission السابق يبقى محفوظًا.

---

# 24. APPROVED Authorization

APPROVED:

```text
Direct editing denied
Direct deletion denied
Correction/version/void only
```

---

# 25. CLOSED Authorization

CLOSED:

لا يعاد فتحه إلا عبر explicit permission + policy.

---

# 26. VOID Authorization

VOID:

Historical read only.

لا يعود Draft.

---

# 27. SUPERSEDED Authorization

SUPERSEDED:

Historical read only.

---

# 28. Identity Permissions

## Permissions

```text
PERM-IDN-VIEW-SELF
PERM-IDN-CHANGE-OWN-PASSWORD
PERM-IDN-MANAGE-USERS
PERM-IDN-ACTIVATE
PERM-IDN-DEACTIVATE
PERM-IDN-RESET-PASSWORD
PERM-IDN-REVOKE-SESSIONS
```

### Matrix

| Permission           | Employee | Supervisor | Manager | Admin |
| -------------------- | -------: | ---------: | ------: | ----: |
| View own account     |    ALLOW |      ALLOW |   ALLOW | ALLOW |
| Change own password  |    ALLOW |      ALLOW |   ALLOW | ALLOW |
| Manage users         |     DENY |       DENY |    DENY | ALLOW |
| Activate user        |     DENY |       DENY |    DENY | ALLOW |
| Deactivate user      |     DENY |       DENY |    DENY | ALLOW |
| Reset user password  |     DENY |       DENY |    DENY | ALLOW |
| Revoke user sessions |     DENY |       DENY |    DENY | ALLOW |

---

# 29. Role / Permission Administration

Permissions:

```text
PERM-ADM-ROLE-VIEW
PERM-ADM-ROLE-ASSIGN
PERM-ADM-PERMISSION-VIEW
PERM-ADM-PERMISSION-ASSIGN
PERM-ADM-SCOPE-ASSIGN
```

Matrix:

| Action                  | Employee | Supervisor | Manager | Admin |
| ----------------------- | -------: | ---------: | ------: | ----: |
| View role configuration |     DENY |       DENY |    DENY | ALLOW |
| Assign role             |     DENY |       DENY |    DENY | ALLOW |
| Assign permission       |     DENY |       DENY |    DENY | ALLOW |
| Assign scope            |     DENY |       DENY |    DENY | ALLOW |

كل هذه actions:

```text
Audit required
```

---

# 30. Tasks Permissions

```text
PERM-TASK-VIEW
PERM-TASK-CREATE
PERM-TASK-EDIT
PERM-TASK-ASSIGN
PERM-TASK-REASSIGN
PERM-TASK-COMMENT
PERM-TASK-UPLOAD-EVIDENCE
PERM-TASK-BLOCK
PERM-TASK-COMPLETE
PERM-TASK-REOPEN
PERM-TASK-DELETE-DRAFT
```

---

# 31. Tasks Matrix

| Action                       |    Employee |  Supervisor |     Manager |  Admin |
| ---------------------------- | ----------: | ----------: | ----------: | -----: |
| View task                    | CONDITIONAL | CONDITIONAL | CONDITIONAL | POLICY |
| Create task                  | CONDITIONAL |       ALLOW | CONDITIONAL | POLICY |
| Edit own/assigned Draft task |       ALLOW |       ALLOW | CONDITIONAL | POLICY |
| Assign task                  |        DENY |       ALLOW | CONDITIONAL | POLICY |
| Reassign task                |        DENY |       ALLOW | CONDITIONAL | POLICY |
| Comment                      |       ALLOW |       ALLOW |       ALLOW | POLICY |
| Upload evidence              |       ALLOW |       ALLOW | CONDITIONAL | POLICY |
| Block / Hold                 | CONDITIONAL |       ALLOW | CONDITIONAL | POLICY |
| Complete own assigned task   | CONDITIONAL |       ALLOW | CONDITIONAL | POLICY |
| Reopen completed task        |        DENY | CONDITIONAL | CONDITIONAL | POLICY |
| Delete eligible Draft        | CONDITIONAL | CONDITIONAL | CONDITIONAL | POLICY |

---

# 32. Task Scope Rules

Employee:

```text
OWN + ASSIGNED
```

Supervisor:

```text
OWN + ASSIGNED + TEAM
```

Manager:

```text
TEAM / DEPARTMENT / DOMAIN
```

حسب configuration.

Admin لا يحصل business task scope تلقائيًا.

---

# 33. Quality — Finding Permissions

```text
PERM-FIND-VIEW
PERM-FIND-CREATE
PERM-FIND-EDIT
PERM-FIND-SUBMIT
PERM-FIND-REVIEW
PERM-FIND-CLOSE
PERM-FIND-VOID
```

---

# 34. Finding Matrix

| Action     |    Employee |  Supervisor |     Manager |  Admin |
| ---------- | ----------: | ----------: | ----------: | -----: |
| View       | CONDITIONAL |       ALLOW |       ALLOW | POLICY |
| Create     |      POLICY |       ALLOW |       ALLOW |   DENY |
| Edit Draft | CONDITIONAL |       ALLOW |       ALLOW |   DENY |
| Submit     | CONDITIONAL |       ALLOW |       ALLOW |   DENY |
| Review     |        DENY | CONDITIONAL | CONDITIONAL |   DENY |
| Close      |        DENY |      POLICY |      POLICY |   DENY |
| Void       |        DENY |      POLICY |      POLICY | POLICY |

---

# 35. NCR Permissions

```text
PERM-NCR-VIEW
PERM-NCR-CREATE
PERM-NCR-EDIT
PERM-NCR-SUBMIT
PERM-NCR-REVIEW
PERM-NCR-APPROVE
PERM-NCR-CLOSE
PERM-NCR-VOID
```

---

# 36. NCR Matrix

| Action     |    Employee |  Supervisor |     Manager |  Admin |
| ---------- | ----------: | ----------: | ----------: | -----: |
| View       | CONDITIONAL |       ALLOW |       ALLOW | POLICY |
| Create     |      POLICY |       ALLOW |       ALLOW |   DENY |
| Edit Draft | CONDITIONAL |       ALLOW |       ALLOW |   DENY |
| Submit     | CONDITIONAL |       ALLOW |       ALLOW |   DENY |
| Review     |        DENY | CONDITIONAL | CONDITIONAL |   DENY |
| Approve    |        DENY |      POLICY |      POLICY |   DENY |
| Close      |        DENY |      POLICY |      POLICY |   DENY |
| Void       |        DENY |      POLICY |      POLICY | POLICY |

---

# 37. RCA Permissions

```text
PERM-RCA-VIEW
PERM-RCA-CREATE
PERM-RCA-EDIT
PERM-RCA-SUBMIT
PERM-RCA-REVIEW
PERM-RCA-APPROVE
```

Matrix follows NCR scope and SoD.

---

# 38. CAPA Permissions

```text
PERM-CAPA-VIEW
PERM-CAPA-CREATE
PERM-CAPA-EDIT
PERM-CAPA-ASSIGN-ACTION
PERM-CAPA-COMPLETE-ACTION
PERM-CAPA-VERIFY
PERM-CAPA-APPROVE
PERM-CAPA-CLOSE
PERM-CAPA-VOID
```

---

# 39. CAPA Matrix

| Action                        |    Employee | Supervisor |     Manager |  Admin |
| ----------------------------- | ----------: | ---------: | ----------: | -----: |
| View                          | CONDITIONAL |      ALLOW |       ALLOW | POLICY |
| Create Draft                  |      POLICY |      ALLOW |       ALLOW |   DENY |
| Edit Draft                    | CONDITIONAL |      ALLOW |       ALLOW |   DENY |
| Complete assigned CAPA action |       ALLOW |      ALLOW | CONDITIONAL |   DENY |
| Verify action/effectiveness   |        DENY |     POLICY |      POLICY |   DENY |
| Approve CAPA                  |        DENY |     POLICY |      POLICY |   DENY |
| Close CAPA                    |        DENY |     POLICY |      POLICY |   DENY |
| Void                          |        DENY |     POLICY |      POLICY | POLICY |

---

# 40. Quarantine / Receiving Permissions

```text
PERM-QUAR-VIEW
PERM-QUAR-CREATE
PERM-QUAR-EDIT
PERM-QUAR-IMPORT
PERM-QUAR-START-INSPECTION
PERM-QUAR-HOLD
PERM-QUAR-RELEASE
PERM-QUAR-CORRECT
PERM-QUAR-ARCHIVE
```

---

# 41. Receiving Matrix

| Action                  |    Employee | Supervisor |     Manager |  Admin |
| ----------------------- | ----------: | ---------: | ----------: | -----: |
| View register           | CONDITIONAL |      ALLOW |       ALLOW | POLICY |
| Create Receiving Item   |      POLICY |      ALLOW | CONDITIONAL | POLICY |
| Edit eligible Draft     | CONDITIONAL |      ALLOW | CONDITIONAL | POLICY |
| Import Receiving Data   |        DENY |     POLICY |      POLICY | POLICY |
| Start Inspection        | CONDITIONAL |      ALLOW | CONDITIONAL |   DENY |
| Place on HOLD           |      POLICY |     POLICY |      POLICY |   DENY |
| Release System          |        DENY |     POLICY |      POLICY | POLICY |
| Controlled Correction   |        DENY |     POLICY |      POLICY | POLICY |
| Archive eligible record |        DENY |     POLICY |      POLICY | POLICY |

---

# 42. Receiving Release Rule

`PERM-QUAR-RELEASE`

يبقى:

```text
DENY UNTIL BD-001 IS APPROVED
```

لكل Role.

حتى يتم تحديد:

```text
Who can release?
At which state?
Does release require E-Signature?
Can Admin ever release?
```

---

# 43. Inspection Permissions

```text
PERM-INSP-VIEW
PERM-INSP-CREATE
PERM-INSP-EDIT-DRAFT
PERM-INSP-ENTER-RESULT
PERM-INSP-UPLOAD-EVIDENCE
PERM-INSP-SUBMIT
PERM-INSP-WITHDRAW
PERM-INSP-REVIEW
PERM-INSP-RETURN
PERM-INSP-APPROVE
PERM-INSP-REJECT
PERM-INSP-VOID
PERM-INSP-CORRECT
PERM-INSP-PRINT
PERM-INSP-EXPORT
```

---

# 44. Inspection Matrix

| Action                   |    Employee |  Supervisor |     Manager |  Admin |
| ------------------------ | ----------: | ----------: | ----------: | -----: |
| View authorized report   |       ALLOW |       ALLOW |       ALLOW | POLICY |
| Create report            | CONDITIONAL |       ALLOW | CONDITIONAL |   DENY |
| Edit Draft               |       ALLOW |       ALLOW | CONDITIONAL |   DENY |
| Enter inspection results |       ALLOW |       ALLOW | CONDITIONAL |   DENY |
| Upload evidence          |       ALLOW |       ALLOW | CONDITIONAL |   DENY |
| Submit own work          |       ALLOW |       ALLOW | CONDITIONAL |   DENY |
| Withdraw submitted       |      POLICY |      POLICY |      POLICY |   DENY |
| Review                   |        DENY | CONDITIONAL | CONDITIONAL |   DENY |
| Return                   |        DENY | CONDITIONAL | CONDITIONAL |   DENY |
| Approve                  |        DENY |      POLICY |      POLICY |   DENY |
| Reject                   |        DENY |      POLICY |      POLICY |   DENY |
| Void                     |        DENY |      POLICY |      POLICY | POLICY |
| Controlled Correction    |        DENY |      POLICY |      POLICY | POLICY |
| Print                    | CONDITIONAL |       ALLOW |       ALLOW | POLICY |
| Export                   | CONDITIONAL |       ALLOW |       ALLOW | POLICY |

---

# 45. Inspection Self-Review Rule

إذا:

```text
actor_id == report.author_id
```

فـ:

```text
PERM-INSP-REVIEW
=
DENY
```

كـFoundation default.

إذا قررت الشركة غير ذلك لاحقًا، يحتاج تعديل Policy رسمي.

---

# 46. Inspection Self-Approval Rule

إذا actor شارك كـ:

```text
Author
or
Executor
```

فالـApproval:

```text
DENY
```

كـFoundation default إلى أن يعتمد SoD matrix النهائي.

---

# 47. Laboratory Permissions

```text
PERM-LAB-VIEW
PERM-LAB-CREATE
PERM-LAB-EDIT-DRAFT
PERM-LAB-ENTER-SAMPLE
PERM-LAB-ENTER-MEASUREMENT
PERM-LAB-BULK-ENTRY
PERM-LAB-UPLOAD-EVIDENCE
PERM-LAB-SUBMIT
PERM-LAB-REVIEW
PERM-LAB-RETURN
PERM-LAB-APPROVE
PERM-LAB-REJECT
PERM-LAB-RETEST
PERM-LAB-AUTHORIZE-RETEST
PERM-LAB-VOID
PERM-LAB-CORRECT
PERM-LAB-PRINT
PERM-LAB-EXPORT
```

---

# 48. Laboratory Matrix

| Action                   |    Employee |  Supervisor |     Manager |  Admin |
| ------------------------ | ----------: | ----------: | ----------: | -----: |
| View authorized Lab Test |       ALLOW |       ALLOW |       ALLOW | POLICY |
| Create Lab Test          | CONDITIONAL |       ALLOW | CONDITIONAL |   DENY |
| Edit Draft               |       ALLOW |       ALLOW | CONDITIONAL |   DENY |
| Enter samples            |       ALLOW |       ALLOW | CONDITIONAL |   DENY |
| Enter measurements       |       ALLOW |       ALLOW | CONDITIONAL |   DENY |
| Bulk entry               | CONDITIONAL | CONDITIONAL |      POLICY |   DENY |
| Upload evidence          |       ALLOW |       ALLOW | CONDITIONAL |   DENY |
| Submit                   |       ALLOW |       ALLOW | CONDITIONAL |   DENY |
| Review                   |        DENY | CONDITIONAL | CONDITIONAL |   DENY |
| Return                   |        DENY | CONDITIONAL | CONDITIONAL |   DENY |
| Approve                  |        DENY |      POLICY |      POLICY |   DENY |
| Reject                   |        DENY |      POLICY |      POLICY |   DENY |
| Perform Retest           |      POLICY |      POLICY |      POLICY |   DENY |
| Authorize Retest         |        DENY |      POLICY |      POLICY |   DENY |
| Void                     |        DENY |      POLICY |      POLICY | POLICY |
| Controlled Correction    |        DENY |      POLICY |      POLICY | POLICY |
| Print                    | CONDITIONAL |       ALLOW |       ALLOW | POLICY |
| Export                   | CONDITIONAL |       ALLOW |       ALLOW | POLICY |

---

# 49. Lab Retest Gate

حتى اعتماد:

```text
BD-006
BD-007
BD-008
```

يكون:

```text
PERM-LAB-RETEST
PERM-LAB-AUTHORIZE-RETEST
```

`POLICY-DEPENDENT`.

Runtime default:

```text
DENY
```

---

# 50. Laboratory Scientific Decision Rule

امتلاك:

```text
PERM-LAB-EDIT-DRAFT
```

لا يعني القدرة على تغيير Acceptance Criteria.

Acceptance Criteria source-controlled.

---

# 51. Equipment Permissions

```text
PERM-EQP-VIEW
PERM-EQP-CREATE
PERM-EQP-EDIT
PERM-EQP-CHANGE-STATUS
PERM-EQP-DECOMMISSION
PERM-EQP-UPLOAD-EVIDENCE
PERM-EQP-CORRECT
PERM-EQP-EXPORT
```

---

# 52. Equipment Matrix

| Action                    |    Employee | Supervisor |     Manager |  Admin |
| ------------------------- | ----------: | ---------: | ----------: | -----: |
| View equipment            |       ALLOW |      ALLOW |       ALLOW | POLICY |
| Create equipment          |      POLICY |     POLICY |      POLICY | POLICY |
| Edit Draft/master data    |      POLICY |     POLICY |      POLICY | POLICY |
| Change operational status |        DENY |     POLICY |      POLICY | POLICY |
| Decommission              |        DENY |     POLICY |      POLICY | POLICY |
| Upload evidence           | CONDITIONAL |      ALLOW | CONDITIONAL | POLICY |
| Controlled correction     |        DENY |     POLICY |      POLICY | POLICY |
| Export                    | CONDITIONAL |      ALLOW |       ALLOW | POLICY |

الـownership التشغيلي النهائي يحدد لاحقًا.

---

# 53. Calibration Permissions

```text
PERM-CAL-VIEW
PERM-CAL-CREATE
PERM-CAL-EDIT-DRAFT
PERM-CAL-SUBMIT
PERM-CAL-REVIEW
PERM-CAL-APPROVE
PERM-CAL-VOID
PERM-CAL-UPLOAD-CERTIFICATE
```

---

# 54. Calibration Matrix

| Action                    |    Employee | Supervisor |     Manager |  Admin |
| ------------------------- | ----------: | ---------: | ----------: | -----: |
| View                      | CONDITIONAL |      ALLOW |       ALLOW | POLICY |
| Create calibration record |      POLICY |     POLICY |      POLICY | POLICY |
| Edit Draft                |      POLICY |     POLICY |      POLICY | POLICY |
| Upload certificate        |      POLICY |      ALLOW | CONDITIONAL | POLICY |
| Submit                    |      POLICY |     POLICY |      POLICY | POLICY |
| Review                    |        DENY |     POLICY |      POLICY |   DENY |
| Approve                   |        DENY |     POLICY |      POLICY |   DENY |
| Void                      |        DENY |     POLICY |      POLICY | POLICY |

---

# 55. Maintenance Permissions

```text
PERM-MNT-VIEW
PERM-MNT-CREATE
PERM-MNT-EDIT
PERM-MNT-COMPLETE
PERM-MNT-UPLOAD-EVIDENCE
```

تحدد الصلاحيات النهائية حسب operational ownership.

---

# 56. Controlled Documents Permissions

```text
PERM-DOC-VIEW
PERM-DOC-CREATE
PERM-DOC-EDIT-DRAFT
PERM-DOC-SUBMIT
PERM-DOC-REVIEW
PERM-DOC-RETURN
PERM-DOC-APPROVE
PERM-DOC-REJECT
PERM-DOC-REVISE
PERM-DOC-SUPERSEDE
PERM-DOC-ARCHIVE
PERM-DOC-VOID
PERM-DOC-DOWNLOAD
```

---

# 57. Controlled Documents Matrix

| Action                         | Employee |  Supervisor |     Manager |  Admin |
| ------------------------------ | -------: | ----------: | ----------: | -----: |
| View effective authorized docs |    ALLOW |       ALLOW |       ALLOW |  ALLOW |
| Create Draft                   |   POLICY | CONDITIONAL | CONDITIONAL | POLICY |
| Edit Draft                     |   POLICY | CONDITIONAL | CONDITIONAL | POLICY |
| Submit                         |   POLICY | CONDITIONAL | CONDITIONAL | POLICY |
| Review                         |     DENY |      POLICY |      POLICY | POLICY |
| Return                         |     DENY |      POLICY |      POLICY | POLICY |
| Approve                        |     DENY |      POLICY |      POLICY | POLICY |
| Reject                         |     DENY |      POLICY |      POLICY | POLICY |
| Create Revision                |     DENY |      POLICY |      POLICY | POLICY |
| Supersede                      |     DENY |      POLICY |      POLICY | POLICY |
| Archive                        |     DENY |      POLICY |      POLICY | POLICY |
| Void                           |     DENY |      POLICY |      POLICY | POLICY |
| Download                       |    ALLOW |       ALLOW |       ALLOW |  ALLOW |

---

# 58. Document Approval Rule

حتى تحديد:

```text
RD-019
```

`PERM-DOC-APPROVE`

يكون:

```text
DENY UNTIL EXPLICITLY APPROVED
```

---

# 59. Reviews / Approvals Permissions

```text
PERM-APR-VIEW-ASSIGNED
PERM-APR-REVIEW
PERM-APR-RETURN
PERM-APR-APPROVE
PERM-APR-REJECT
PERM-APR-VIEW-HISTORY
```

هذه permissions لا تكفي وحدها.

Owning Domain permission يجب أن يسمح أيضًا.

مثال:

```text
PERM-APR-APPROVE
+
PERM-LAB-APPROVE
```

لـLab Test Approval.

---

# 60. Approval Dual-Permission Principle

أي controlled approval يحتاج:

```text
Generic Approval Permission
+
Domain Approval Permission
```

مثال:

```text
PERM-APR-APPROVE
AND
PERM-INSP-APPROVE
```

هذا يمنع مستخدم لديه Approval capability في Domain واحد من اعتماد Domain آخر.

---

# 61. E-Signature Permissions

```text
PERM-ESIG-SIGN
PERM-ESIG-VIEW-OWN
PERM-ESIG-VIEW-AUDIT
```

لكن:

```text
PERM-ESIG-SIGN
```

لا يعطي Approve permission.

هو فقط يسمح بتنفيذ signature flow عندما action نفسها مصرح بها.

---

# 62. Change Request Permissions

```text
PERM-CHG-VIEW
PERM-CHG-CREATE
PERM-CHG-EDIT-DRAFT
PERM-CHG-SUBMIT
PERM-CHG-REVIEW
PERM-CHG-RETURN
PERM-CHG-APPROVE
PERM-CHG-REJECT
PERM-CHG-APPLY
PERM-CHG-CANCEL
```

---

# 63. Change Request Matrix

| Action                |    Employee | Supervisor | Manager |  Admin |
| --------------------- | ----------: | ---------: | ------: | -----: |
| View relevant request | CONDITIONAL |      ALLOW |   ALLOW |  ALLOW |
| Create request        |       ALLOW |      ALLOW |   ALLOW |  ALLOW |
| Edit own Draft        |       ALLOW |      ALLOW |   ALLOW |  ALLOW |
| Submit                |       ALLOW |      ALLOW |   ALLOW |  ALLOW |
| Review                |        DENY |     POLICY |  POLICY | POLICY |
| Return                |        DENY |     POLICY |  POLICY | POLICY |
| Approve               |        DENY |     POLICY |  POLICY | POLICY |
| Reject                |        DENY |     POLICY |  POLICY | POLICY |
| Apply                 |        DENY |       DENY |    DENY |   DENY |

مهم:

`Apply` لا ينفذ يدويًا كصلاحية مستخدم عادية.

---

# 64. Change Application Rule

بعد Approval:

```text
Owning Domain Application Service
```

هو الذي يطبق التغيير.

ليس User role مباشرة.

لذلك:

```text
PERM-CHG-APPLY
```

محجوز لـSystem/Internal Service Principal إذا احتجنا representation داخلي.

---

# 65. Reports Permissions

```text
PERM-RPT-VIEW
PERM-RPT-RUN
PERM-RPT-EXPORT-CSV
PERM-RPT-EXPORT-XLSX
PERM-RPT-EXPORT-PDF
PERM-RPT-PRINT
PERM-RPT-AUDIT
PERM-RPT-MANAGEMENT
PERM-RPT-ADMIN
```

---

# 66. Reports Matrix

| Action                      |    Employee |  Supervisor | Manager |  Admin |
| --------------------------- | ----------: | ----------: | ------: | -----: |
| Run own operational reports | CONDITIONAL |       ALLOW |   ALLOW | POLICY |
| Team reports                |        DENY | CONDITIONAL |   ALLOW | POLICY |
| Management reports          |        DENY |      POLICY |   ALLOW | POLICY |
| CSV export                  | CONDITIONAL | CONDITIONAL |   ALLOW | POLICY |
| XLSX export                 | CONDITIONAL | CONDITIONAL |   ALLOW | POLICY |
| PDF export                  | CONDITIONAL | CONDITIONAL |   ALLOW | POLICY |
| Audit reports               |        DENY |      POLICY |  POLICY | POLICY |
| System/Admin reports        |        DENY |        DENY |  POLICY |  ALLOW |

---

# 67. Report Row-Level Authorization

`PERM-RPT-RUN` لا يعطي unrestricted dataset.

كل Report query يطبق:

```text
Actor
Permission
Scope
Filters
Domain policy
```

على مستوى Server.

---

# 68. File / Evidence Permissions

```text
PERM-FILE-UPLOAD
PERM-FILE-VIEW
PERM-FILE-DOWNLOAD
PERM-FILE-REMOVE-DRAFT
PERM-FILE-REMOVE-CONTROLLED
```

---

# 69. Evidence Matrix

| Action                               |    Employee |  Supervisor |     Manager |  Admin |
| ------------------------------------ | ----------: | ----------: | ----------: | -----: |
| Upload to editable authorized record |       ALLOW |       ALLOW | CONDITIONAL | POLICY |
| View authorized evidence             |       ALLOW |       ALLOW |       ALLOW | POLICY |
| Download authorized evidence         |       ALLOW |       ALLOW |       ALLOW | POLICY |
| Remove Draft evidence                | CONDITIONAL | CONDITIONAL |      POLICY | POLICY |
| Remove controlled evidence           |        DENY |        DENY |        DENY | POLICY |

حتى Admin removal من controlled record يحتاج controlled correction path.

---

# 70. Notifications Permissions

```text
PERM-NOT-VIEW-OWN
PERM-NOT-MARK-READ
PERM-NOT-ADMIN
```

| Action                            | Employee | Supervisor | Manager | Admin |
| --------------------------------- | -------: | ---------: | ------: | ----: |
| View own notifications            |    ALLOW |      ALLOW |   ALLOW | ALLOW |
| Mark own as read                  |    ALLOW |      ALLOW |   ALLOW | ALLOW |
| Manage notification configuration |     DENY |       DENY |    DENY | ALLOW |

---

# 71. Search Permissions

```text
PERM-SRCH-USE
```

كل role authenticated يمكن أن يملك Search.

لكن Search returns only authorized data.

Search لا يحتاج separate permission لكل result إذا source policy يعاد تطبيقها.

---

# 72. Dashboard Permissions

```text
PERM-DASH-VIEW
PERM-DASH-MANAGEMENT
PERM-DASH-ADMIN
```

Employee:

```text
Operational dashboard
```

Supervisor:

```text
Operational + Team dashboard
```

Manager:

```text
Management dashboard
```

Admin:

```text
Administrative/System dashboard
```

---

# 73. Administration Permissions

```text
PERM-ADM-USERS
PERM-ADM-ROLES
PERM-ADM-PERMISSIONS
PERM-ADM-SCOPES
PERM-ADM-REFERENCE-DATA
PERM-ADM-SYSTEM-CONFIG
PERM-ADM-SECURITY-CONFIG
PERM-ADM-TEMPLATES
PERM-ADM-AUDIT-VIEW
```

---

# 74. Administration Matrix

| Permission              | Employee | Supervisor | Manager |  Admin |
| ----------------------- | -------: | ---------: | ------: | -----: |
| Users                   |     DENY |       DENY |    DENY |  ALLOW |
| Roles                   |     DENY |       DENY |    DENY |  ALLOW |
| Permissions             |     DENY |       DENY |    DENY |  ALLOW |
| Scopes                  |     DENY |       DENY |    DENY |  ALLOW |
| Reference Data          |     DENY |     POLICY |  POLICY |  ALLOW |
| System Config           |     DENY |       DENY |    DENY |  ALLOW |
| Security Config         |     DENY |       DENY |    DENY |  ALLOW |
| Template Administration |     DENY |     POLICY |  POLICY | POLICY |
| View Admin Audit        |     DENY |       DENY |  POLICY |  ALLOW |

---

# 75. System Health Permissions

```text
PERM-HLTH-VIEW
PERM-HLTH-READINESS
PERM-HLTH-DATABASE
PERM-HLTH-MIGRATIONS
PERM-HLTH-STORAGE
PERM-HLTH-AUDIT
PERM-HLTH-AI
```

Matrix:

| Action                   | Employee | Supervisor | Manager | Admin |
| ------------------------ | -------: | ---------: | ------: | ----: |
| Basic application status |     DENY |     POLICY |  POLICY | ALLOW |
| Detailed readiness       |     DENY |       DENY |  POLICY | ALLOW |
| DB health                |     DENY |       DENY |    DENY | ALLOW |
| Migration state          |     DENY |       DENY |    DENY | ALLOW |
| Storage health           |     DENY |       DENY |    DENY | ALLOW |
| Audit integrity health   |     DENY |       DENY |  POLICY | ALLOW |
| AI provider health       |     DENY |       DENY |  POLICY | ALLOW |

---

# 76. Backup Permissions

```text
PERM-BKP-VIEW
PERM-BKP-CREATE
PERM-BKP-VERIFY
PERM-BKP-DOWNLOAD
PERM-BKP-DELETE
PERM-BKP-RESTORE-DRILL
PERM-BKP-RESTORE-PRODUCTION
```

---

# 77. Backup Matrix

| Action             | Employee | Supervisor | Manager |  Admin |
| ------------------ | -------: | ---------: | ------: | -----: |
| View backup status |     DENY |       DENY |  POLICY |  ALLOW |
| Create backup      |     DENY |       DENY |    DENY |  ALLOW |
| Verify backup      |     DENY |       DENY |    DENY |  ALLOW |
| Download backup    |     DENY |       DENY |    DENY | POLICY |
| Delete backup      |     DENY |       DENY |    DENY | POLICY |
| Restore drill      |     DENY |       DENY |    DENY |  ALLOW |
| Production restore |     DENY |       DENY |  POLICY | POLICY |

---

# 78. Production Restore Gate

`PERM-BKP-RESTORE-PRODUCTION`

لا يعتمد نهائيًا حتى قرار:

```text
RD-020
```

الحالة الحالية:

```text
DENY UNTIL APPROVED
```

---

# 79. AI Permissions

```text
PERM-AI-USE
PERM-AI-SUMMARIZE
PERM-AI-SUGGEST
PERM-AI-DRAFT
PERM-AI-ADMIN
```

---

# 80. AI Matrix

| Action                           |    Employee |  Supervisor |     Manager |       Admin |
| -------------------------------- | ----------: | ----------: | ----------: | ----------: |
| Use approved AI advisory feature | CONDITIONAL | CONDITIONAL | CONDITIONAL | CONDITIONAL |
| Summarize authorized record      | CONDITIONAL | CONDITIONAL | CONDITIONAL | CONDITIONAL |
| Suggest RCA questions            |      POLICY | CONDITIONAL | CONDITIONAL |      POLICY |
| Draft text                       | CONDITIONAL | CONDITIONAL | CONDITIONAL | CONDITIONAL |
| Configure AI provider            |        DENY |        DENY |        DENY |       ALLOW |

---

# 81. AI Absolute Denials

لا يوجد Permission لـ:

```text
AI_APPROVE
AI_REJECT
AI_RELEASE
AI_SIGN
AI_SET_PASS
AI_SET_FAIL
AI_VOID
AI_CHANGE_CONTROLLED_DATA
```

هذه capabilities:

```text
DO NOT EXIST
```

وليست فقط DENY.

---

# 82. Separation of Duties Model

الأدوار الوظيفية في controlled workflow:

```text
AUTHOR
EXECUTOR
REVIEWER
APPROVER
```

وقد يكون نفس المستخدم يحمل System Role مناسب، لكن SoD يقرر إن كان الجمع مسموحًا.

---

# 83. Foundation SoD Default

إلى أن تعتمد policy نهائية:

```text
AUTHOR ≠ REVIEWER
AUTHOR ≠ APPROVER
```

للـControlled Records.

هذا يعني:

```text
self-review → DENY
self-approval → DENY
```

افتراضيًا.

---

# 84. Reviewer → Approver Combination

الحالة:

```text
POLICY-DEPENDENT
```

حتى اعتماد:

```text
RD-008
```

Runtime default:

```text
DENY
```

إذا نفس الشخص كان Reviewer لنفس Record ثم حاول Final Approval.

---

# 85. SoD Cannot Be Solved by Changing Role

إذا:

```text
User created record as Employee
```

ثم أصبح لاحقًا Manager قبل approval:

هذا لا يجعل self-approval مسموحًا.

نقارن Actor identity/history وليس Current Role فقط.

---

# 86. Approval Preconditions

أي Approval يحتاج:

```text
Authenticated session
Active user
PERM-APR-APPROVE
Domain approval permission
Authorized scope
Correct record state
Current version
SoD pass
Required evidence complete
Required reviews complete
E-Signature if policy requires
```

---

# 87. Review Preconditions

أي Review يحتاج:

```text
PERM-APR-REVIEW
Domain review permission
Authorized scope
Correct state
Not prohibited by SoD
Current record version
```

---

# 88. Release Preconditions

أي Release يحتاج مستقبلًا:

```text
PERM-QUAR-RELEASE
Correct receiving state
Approved inspection state
Inspection result compatible with release
No blocking HOLD
No unresolved release blocker
Current version
Required signature if applicable
```

لكن exact rule يبقى Policy-dependent.

---

# 89. Void Preconditions

كل Domain له:

```text
PERM-{DOMAIN}-VOID
```

لكن Void لا يكون generic universal permission.

مثال:

```text
PERM-LAB-VOID
≠
PERM-INSP-VOID
```

---

# 90. High-Risk Permission Classification

تعتبر High-Risk:

```text
APPROVE
RELEASE
VOID
CLOSE CONTROLLED RECORD
CONTROLLED CORRECTION
CHANGE PERMISSIONS
PRODUCTION RESTORE
SECURITY CONFIGURATION
```

هذه تحتاج:

```text
Explicit permission
Explicit audit
Current authorization check
Version/state validation
```

وقد تحتاج E-Signature.

---

# 91. High-Risk Permission Matrix

| Permission                | Employee | Supervisor | Manager |  Admin |
| ------------------------- | -------: | ---------: | ------: | -----: |
| Final Approval            |     DENY |     POLICY |  POLICY | POLICY |
| Material Release          |     DENY |     POLICY |  POLICY | POLICY |
| Void Lab/Inspection       |     DENY |     POLICY |  POLICY | POLICY |
| Controlled Correction     |     DENY |     POLICY |  POLICY | POLICY |
| Permission Administration |     DENY |       DENY |    DENY |  ALLOW |
| Security Configuration    |     DENY |       DENY |    DENY |  ALLOW |
| Production Restore        |     DENY |       DENY |  POLICY | POLICY |

---

# 92. Admin Non-Escalation Principle

Admin permission لا يعني:

```text
Business Permission Inheritance
```

مثال:

```text
PERM-ADM-USERS
```

لا يمنح:

```text
PERM-LAB-APPROVE
```

---

# 93. Manager Non-Escalation Principle

Manager Role لا يملك تلقائيًا:

```text
All Supervisor Permissions
+
All Employee Permissions
```

يمكن منحه permissions التشغيلية المطلوبة، لكن لا نفترض inheritance.

---

# 94. Permission Bundles

يمكن لاحقًا إنشاء Permission Bundles لأغراض الإدارة.

مثال:

```text
QC_EMPLOYEE_STANDARD
LAB_SUPERVISOR_STANDARD
QC_MANAGER_STANDARD
SYSTEM_ADMIN_STANDARD
```

لكن الـbundle:

> convenience only

ولا يصبح مصدر Business Rules.

---

# 95. Effective Permissions

Effective permission تحسب من:

```text
Direct permissions
+
Role-derived permissions
+
Scope assignments
-
Explicit policy denials
-
SoD denials
-
State restrictions
```

وأي Deny قانوني أعلى من Allow.

---

# 96. Deny Precedence

إذا:

```text
Permission = ALLOW
```

لكن:

```text
SoD = DENY
```

فالنتيجة:

```text
DENY
```

---

# 97. State Deny Precedence

إذا:

```text
PERM-INSP-EDIT-DRAFT = ALLOW
```

لكن:

```text
Report state = APPROVED
```

فالنتيجة:

```text
DENY
```

---

# 98. Scope Deny Precedence

إذا user لديه:

```text
PERM-LAB-VIEW
```

لكن record خارج scope:

```text
DENY
```

---

# 99. Account State Deny Precedence

إذا account:

```text
INACTIVE
LOCKED
DISABLED
```

فالعمليات الجديدة:

```text
DENY
```

حتى لو permissions موجودة.

---

# 100. Record Version Requirement

Actions الحساسة:

```text
SUBMIT
REVIEW
RETURN
APPROVE
REJECT
RELEASE
VOID
CLOSE
CORRECT
```

يجب أن تتحقق من expected record version.

---

# 101. Permission Evaluation Location

Authorization يجب أن ينفذ Server-side داخل:

```text
Application Use Case
or
Central Authorization Service/Policy
```

ولا يعتمد على:

```text
UI Component
Browser state
Route visibility
```

---

# 102. UI Permission Use

UI يستطيع استخدام permission information لـ:

```text
Hide irrelevant action
Disable unavailable action
Explain missing requirement
Show correct workflow
```

لكن لا يعتبر Security Boundary.

---

# 103. API Permission Use

كل mutation endpoint يعيد authorization check.

حتى إذا الزر غير ظاهر.

---

# 104. Report Permission Use

كل report generation يعيد authorization + scope.

---

# 105. Export Permission Use

Export permission مستقلة إذا data sensitivity تستدعي ذلك.

رؤية data داخل UI لا تعني دائمًا أنه يمكن Export bulk dataset.

---

# 106. Search Permission Use

Search must not leak:

```text
Record existence
Title
ID
Count
Snippet
```

إذا record unauthorized.

---

# 107. Audit Permission Use

وجود business permission لا يمنح Audit view تلقائيًا.

Audit access permission منفصلة.

---

# 108. Permission Audit Events

يجب تسجيل:

```text
Role assignment
Role removal
Permission assignment
Permission removal
Scope assignment
Scope removal
Temporary elevation
Account activation/deactivation
```

---

# 109. Authorization Denial Logging

الـSystem logs قد يسجل security-relevant denials مثل:

```text
Repeated unauthorized approval attempts
Cross-scope access attempts
Admin security actions
```

لكن لا نحول كل button denial إلى Audit business event بلا حاجة.

---

# 110. IDOR Rule

عند محاولة الوصول لسجل خارج Scope:

النظام لا يكشف بياناته.

Response semantics يتم تحديدها في `SECURITY.md`.

لكن:

```text
No data leakage
```

قاعدة ثابتة.

---

# 111. Bulk Operations

أي Bulk Action يحتاج Permission مستقلة إذا introduced.

مثل:

```text
PERM-QUAR-BULK-IMPORT
PERM-TASK-BULK-ASSIGN
PERM-RPT-BULK-EXPORT
```

ولا نفترض أن single-record permission يسمح بالـbulk.

---

# 112. Bulk Authorization

كل row في bulk operation يجب أن يمر عبر appropriate scope/business validation.

لا يكفي Authorization أول request فقط.

---

# 113. Controlled Import

Import permission لا يعني قبول البيانات.

كل record يخضع لـ:

```text
Validation
Business Rules
Uniqueness
Scope
Audit
```

---

# 114. Temporary Permission

إذا دعمناها مستقبلًا:

```text
Valid From
Valid Until
Granted By
Reason
Scope
Permissions
Audit
```

مطلوبة.

---

# 115. Delegation

Delegation ليست Permission inheritance تلقائية.

إذا اعتمدت مستقبلًا تحتاج model منفصل.

حاليًا:

```text
NOT IMPLEMENTED
```

---

# 116. Service/System Actors

قد يحتاج النظام internal actors مثل:

```text
Scheduler
Backup Worker
Notification Worker
Change Application Worker
```

هذه لا تستخدم Human Roles.

يجب تصميم:

```text
Service Identity
+
Narrow Machine Permissions
```

مستقبلًا في Security Architecture.

---

# 117. System Actor Cannot Approve Business Records

حتى internal system actor لا يمتلك:

```text
Approve
Release
Sign
Scientific PASS/FAIL
```

إلا actions النظامية deterministic غير البشرية التي تعتمدها policy صراحة.

---

# 118. Permission Registry

يجب لاحقًا وجود مصدر كود Canonical واحد مثل:

```text
authorization/
  permissions.ts
  policies.ts
  scopes.ts
```

أو equivalent.

ممنوع وجود duplicate permission lists.

---

# 119. Permission Manifest

CI يجب أن يستطيع استخراج Permission Manifest ويقارن:

```text
Declared permissions
Used permissions
Tested permissions
Documented permissions
```

---

# 120. Orphan Permission Rule

Permission معرفة لكن:

```text
never used
```

يجب أن تظهر في verification.

---

# 121. Undefined Permission Rule

إذا code يستخدم Permission غير موجودة في canonical registry:

```text
CI FAIL
```

---

# 122. Permission Test Requirement

كل permission حساسة تحتاج:

```text
Positive test
Negative role test
Wrong scope test
Wrong state test
SoD test where applicable
Stale-version test where applicable
```

---

# 123. Required Authorization Test Matrix

مثال:

```text
Correct Permission + Correct Scope → ALLOW

Correct Permission + Wrong Scope → DENY

Missing Permission + Correct Scope → DENY

Correct Permission + Wrong State → DENY

Correct Permission + SoD Conflict → DENY

Correct Permission + Stale Version → DENY

Disabled User → DENY
```

---

# 124. Inspection Approval Test Contract

يجب لاحقًا تغطية:

```text
Employee approval denied

Supervisor approval denied/allowed according to final policy

Manager approval denied/allowed according to final policy

Admin without business permission denied

Self approval denied

Wrong state denied

Stale version denied

Missing required signature denied

Duplicate approval idempotent
```

---

# 125. Lab Approval Test Contract

نفس نموذج Inspection مع Lab-specific requirements.

---

# 126. Release Test Contract

يجب تغطية:

```text
Unauthorized actor
Wrong receiving state
Inspection not approved
Inspection FAIL
HOLD blocker
Release already completed
Stale version
Missing signature where required
Retry does not duplicate release
```

عند اعتماد Release Policy.

---

# 127. Permission Decision Response

Server authorization failures يجب أن تستخدم stable error codes.

مثل:

```text
AUTH_PERMISSION_DENIED
AUTH_SCOPE_DENIED
AUTH_STATE_DENIED
AUTH_SOD_DENIED
AUTH_STALE_RECORD
AUTH_SIGNATURE_REQUIRED
```

التفصيل في `ERROR-ARCHITECTURE.md`.

---

# 128. User-Safe Authorization Messages

المستخدم يرى message مفيدة بدون كشف بيانات حساسة.

مثال:

```text
You don't have permission to approve this record.
```

أو:

```text
This record changed after you opened it. Reload before continuing.
```

---

# 129. Business Decisions Blocking Permissions

القرارات التالية تمنع Finalization لبعض permissions:

| Decision                        | Permission Impact           |
| ------------------------------- | --------------------------- |
| BD-001 Release authority        | PERM-QUAR-RELEASE           |
| BD-002 Release E-Signature      | Release signature policy    |
| BD-003 Automatic NCR            | Inspection failure workflow |
| BD-006 Retest count             | PERM-LAB-RETEST             |
| BD-007 Retest authorization     | PERM-LAB-AUTHORIZE-RETEST   |
| BD-010 E-Signature actions      | Multiple high-risk actions  |
| BD-011 SoD matrix               | Review / Approve            |
| BD-012 Reviewer + Approver      | Approval                    |
| BD-016 Draft deletion           | DELETE_DRAFT permissions    |
| RD-003 Inspection approval role | PERM-INSP-APPROVE           |
| RD-004 Lab approval role        | PERM-LAB-APPROVE            |
| RD-006 Release role             | PERM-QUAR-RELEASE           |
| RD-015 Retest authorization     | PERM-LAB-AUTHORIZE-RETEST   |
| RD-016 Void authority           | Domain VOID permissions     |
| RD-017 NCR closure              | PERM-NCR-CLOSE              |
| RD-018 CAPA closure             | PERM-CAPA-CLOSE             |
| RD-019 Document approval        | PERM-DOC-APPROVE            |
| RD-020 Production restore       | PERM-BKP-RESTORE-PRODUCTION |

---

# 130. Deny Until Approved Register

الـPermissions التالية يجب أن تكون Runtime DENY حتى policy approval:

```text
PERM-QUAR-RELEASE

PERM-INSP-APPROVE
where role policy unresolved

PERM-LAB-APPROVE
where role policy unresolved

PERM-LAB-RETEST
PERM-LAB-AUTHORIZE-RETEST

PERM-NCR-CLOSE
PERM-CAPA-CLOSE

PERM-DOC-APPROVE

All domain VOID permissions

PERM-BKP-RESTORE-PRODUCTION
```

---

# 131. No Hardcoded Role Rules

ممنوع:

```ts
if (user.role === "manager") {
  approve();
}
```

النموذج الصحيح conceptually:

```text
authorize(
  actor,
  PERM_INSP_APPROVE,
  report,
  context
)
```

---

# 132. Authorization Context

Authorization context قد يحتوي:

```text
actor_id
role_ids
permissions
scope
entity_type
entity_id
entity_state
entity_version
creator_id
assignee_id
reviewer_id
approver_id
department_id
team_id
site_id
```

حسب الحاجة.

---

# 133. Permission Inheritance

لا نعتمد role inheritance في Foundation.

أي inheritance مستقبلية يجب أن تكون explicit وقابلة للاختبار.

---

# 134. Least Privilege

المبدأ:

> Grant the minimum permissions necessary to perform the assigned responsibility.

لا نعالج missing permission بترقية user إلى Admin.

---

# 135. No "Admin Override"

لا يوجد permission عامة اسمها:

```text
PERM-ADMIN-BYPASS-ALL
```

ولا يجب إنشاؤها.

---

# 136. Emergency Access

Break-glass / emergency access:

```text
NOT IMPLEMENTED
```

إذا احتجناه مستقبلًا:

يحتاج security design مستقل يشمل:

```text
Reason
Time limit
Strong reauthentication
Alerting
Audit
Restricted scope
Post-event review
```

---

# 137. Permission Matrix Is Not Workflow Definition

هذه الوثيقة تقول:

```text
Who may attempt an action?
```

لكن:

`STATE-MACHINES.md`

تحدد:

```text
From which state
To which state
Under what transition
```

---

# 138. Permission Matrix Is Not Business Rule Source

إذا Permission Matrix قالت user يستطيع `Submit`:

فهذا لا يلغي validation الموجودة في:

```text
BUSINESS-RULES.md
```

---

# 139. Permission Matrix Is Not UI Specification

الـUI يعرض الصلاحيات بطريقة مناسبة.

لكن هذه الوثيقة لا تحدد شكل buttons أو screens.

---

# 140. Source of Truth Relationship

```text
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
```

---

# 141. Permission Evaluation Example — Inspection

Actor:

```text
Role:
Supervisor

Permission:
PERM-INSP-REVIEW

Scope:
TEAM
```

Report:

```text
State:
SUBMITTED

Author:
Employee A

Team:
Incoming Inspection
```

Actor:

```text
Supervisor B
Team:
Incoming Inspection
```

إذا:

```text
Scope matches
+
Not author
+
Version current
+
No SoD conflict
```

النتيجة:

```text
ALLOW
```

---

# 142. Permission Evaluation Example — Self Review

نفس المثال لكن:

```text
Author = Supervisor B
```

النتيجة:

```text
DENY
Reason:
AUTH_SOD_DENIED
```

---

# 143. Permission Evaluation Example — Manager Approval

Actor:

```text
Manager
```

لكن لا يملك:

```text
PERM-INSP-APPROVE
```

النتيجة:

```text
DENY
```

حتى لو Role = Manager.

---

# 144. Permission Evaluation Example — Admin

Actor:

```text
Admin
PERM-ADM-USERS
```

يحاول:

```text
Approve Lab Test
```

ولا يملك:

```text
PERM-LAB-APPROVE
```

النتيجة:

```text
DENY
```

---

# 145. Permission Evaluation Example — Wrong State

Actor لديه:

```text
PERM-INSP-APPROVE
```

لكن report:

```text
DRAFT
```

النتيجة:

```text
DENY
```

لأن State Machine لا تسمح.

---

# 146. Permission Evaluation Example — Stale Record

Actor لديه كل permissions.

UI فتح:

```text
version = 7
```

DB الآن:

```text
version = 8
```

النتيجة:

```text
DENY ACTION
AUTH_STALE_RECORD
```

حتى refresh/review.

---

# 147. Authorization Data Integrity

Permission checks لا يجب أن تعتمد على client-supplied:

```text
role
scope
actor_id
record_state
permission list
```

هذه القيم تأتي من trusted server/database context.

---

# 148. Caching Permissions

إذا تم caching:

يجب ألا يسمح Revoked Permission بالبقاء فعالة مدة غير مقبولة.

سيتم تحديد strategy في `SECURITY.md`.

---

# 149. Permission Changes and Sessions

عند high-risk permission revocation:

قد نحتاج session invalidation أو cache invalidation.

القرار في Security Architecture.

---

# 150. Final Permission Philosophy

لا نسأل:

```text
Is the user a Manager?
```

فقط.

بل:

```text
Is the actor authenticated?

Is the account active?

Does the actor have the exact permission?

Does the permission apply to this domain?

Does the record fall within the actor's scope?

Is the record in an allowed state?

Does separation of duties permit the action?

Is the record version current?

Are required business preconditions satisfied?

Is E-Signature required?

Is the operation still valid at execution time?
```

إذا فشل أي شرط:

```text
DENY
```

---

# 151. Foundation Status

```text
Document:
PERMISSION-MATRIX.md

Version:
1.0

Product:
QC Operations & Laboratory Management System

Authorization:
Centralized Server-Side

Default:
DENY

Roles:
Employee
Supervisor
Manager
Admin

Scopes:
OWN
ASSIGNED
TEAM
DEPARTMENT
SITE
DOMAIN
GLOBAL

High-Risk Actions:
Explicit Permission Required

Admin Model:
No Universal Business Override

SoD Default:
Self Review = DENY
Self Approval = DENY

Unconfirmed Sensitive Permissions:
DENY UNTIL APPROVED

Status:
FOUNDATION — APPROVED AUTHORIZATION MODEL

Next Foundation Document:
STATE-MACHINES.md
```
