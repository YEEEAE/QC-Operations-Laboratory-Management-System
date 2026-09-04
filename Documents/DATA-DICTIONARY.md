# DATA-DICTIONARY.md

# QC Operations & Laboratory Management System

## Canonical Data Dictionary — v1.0

**Status:** FOUNDATION
**Database:** PostgreSQL
**Model:** Relational + Controlled Historical Snapshots
**Primary Key Strategy:** UUID
**Time Strategy:** UTC / `TIMESTAMPTZ`
**Concurrency:** Version-based optimistic concurrency

---

# 1. Purpose

هذه الوثيقة هي المرجع الرسمي لتعريف البيانات الخاصة بنظام:

> **QC Operations & Laboratory Management System**

وتحدد لكل حقل:

* الاسم الرسمي.
* المعنى.
* PostgreSQL type المقترح.
* Nullability.
* Default.
* Source.
* Validation.
* من يستطيع تغييره.
* Lifecycle behavior.
* Indexing / uniqueness.
* Audit significance.
* Historical significance.
* Sensitivity.

الهدف أن يصبح الانتقال من:

```text
DATA-MODEL.md
```

إلى:

```text
PostgreSQL migrations
Application schemas
Validation schemas
API contracts
Tests
```

قابلًا للتنفيذ بدون اختراع بيانات أو قواعد جديدة.

---

# 2. Authority Chain

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
        ↓
DATA-DICTIONARY.md
        ↓
PostgreSQL Migrations
```

أي conflict يتم حله بالرجوع للمصدر الأعلى.

---

# 3. Dictionary Status Vocabulary

## APPROVED

الحقل أو القاعدة معتمدة كأساس للتنفيذ.

## SOURCE-DEPENDENT

تعتمد على Controlled Source مثل:

```text
WI
SOP
Specification
Test Method
Approved Template
```

ولا يسمح للمطور بتحديدها.

## POLICY-DEPENDENT

البنية معروفة لكن authority أو lifecycle يعتمد على Policy لاحقة.

## UNCONFIRMED

لم يتم اعتماد المعنى أو القيمة بعد.

القاعدة:

```text
UNCONFIRMED
=
DO NOT INVENT
```

وإذا كان القرار يؤثر على schema بشكل جوهري:

```text
DO NOT MIGRATE UNTIL APPROVED
```

---

# 4. PostgreSQL Type Conventions

| Concept                | Preferred Type                  |
| ---------------------- | ------------------------------- |
| Technical ID           | `UUID`                          |
| Human-readable code    | `TEXT`                          |
| Short canonical code   | `TEXT` + constraint             |
| Free descriptive text  | `TEXT`                          |
| Boolean fact           | `BOOLEAN`                       |
| Integer sequence       | `INTEGER` / `BIGINT`            |
| Precise quantity       | `NUMERIC(p,s)`                  |
| Scientific measurement | `NUMERIC(p,s)`                  |
| Event timestamp        | `TIMESTAMPTZ`                   |
| Pure business date     | `DATE`                          |
| Structured snapshot    | `JSONB`                         |
| Hash                   | `TEXT` or binary representation |
| Record version         | `BIGINT`                        |

Exact `NUMERIC(p,s)` precision is field-specific.

Scientific precision:

> **SOURCE-DEPENDENT — DO NOT INVENT.**

---

# 5. Universal Field Rules

## UUID

Application-generated or database-generated UUID.

Must never be accepted from client as proof of authorization.

---

## `created_at`

```text
TIMESTAMPTZ
NOT NULL
server/database generated
immutable
```

---

## `created_by`

```text
UUID
FK → users.id
```

where a human actor exists.

System-created records may require explicit system/service actor strategy.

---

## `updated_at`

```text
TIMESTAMPTZ
NOT NULL
```

Updated only after successful mutation.

---

## `updated_by`

Actor responsible for latest mutable change.

---

## `version`

```text
BIGINT
NOT NULL
DEFAULT 1
CHECK version > 0
```

Used for optimistic concurrency where applicable.

---

# 6. Audit Significance Levels

### CRITICAL

Changes affect controlled or security facts.

Examples:

```text
state
approval
release
permissions
scientific result
controlled criteria
```

### HIGH

Important operational/history data.

### MEDIUM

Useful business traceability.

### LOW

Presentation/non-critical metadata.

---

# 7. Historical Classification

### CURRENT

Current normalized master/business data.

### HISTORICAL

Must preserve previous truth.

### SNAPSHOT

Frozen historical representation.

### DERIVED

Calculated from authoritative data.

---

# 8. Sensitivity Classification

### PUBLIC-INTERNAL

Normal internal operational data.

### INTERNAL

Company operational information.

### SENSITIVE

Security, identity, or controlled data.

### SECRET

Passwords/tokens/secrets.

Secret material should normally not exist as reversible data in business tables.

---

# 9. Identity — `users`

| Field                  | Type        | Null | Default                        | Meaning                    | Source            | Validation / Constraint    | Editable         | Audit    | Historical           | Sensitivity |
| ---------------------- | ----------- | ---: | ------------------------------ | -------------------------- | ----------------- | -------------------------- | ---------------- | -------- | -------------------- | ----------- |
| `id`                   | UUID        |   NO | UUID                           | Technical user identity    | System            | PK                         | Never            | HIGH     | HISTORICAL           | INTERNAL    |
| `login_identity`       | TEXT        |   NO | —                              | Canonical login identifier | Admin/System      | Unique, normalized         | Controlled Admin | CRITICAL | CURRENT              | SENSITIVE   |
| `email`                | TEXT        |  YES | —                              | User email if required     | Admin/User policy | Valid email format         | Controlled       | HIGH     | CURRENT              | SENSITIVE   |
| `display_name`         | TEXT        |   NO | —                              | Name shown in system       | Admin             | Non-empty                  | Controlled Admin | MEDIUM   | CURRENT              | INTERNAL    |
| `password_hash`        | TEXT        |   NO | —                              | One-way password hash      | Auth system       | Approved hashing only      | Auth system      | CRITICAL | CURRENT              | SECRET      |
| `account_state`        | TEXT        |   NO | `ACTIVE` or provisioning state | Account lifecycle          | Admin/System      | Canonical state constraint | Admin/System     | CRITICAL | HISTORICAL via audit | SENSITIVE   |
| `must_change_password` | BOOLEAN     |   NO | FALSE                          | Force password change      | Auth/Admin        | Boolean                    | Auth/Admin       | HIGH     | CURRENT              | SENSITIVE   |
| `last_login_at`        | TIMESTAMPTZ |  YES | —                              | Last successful login      | System            | Trusted time               | System           | MEDIUM   | CURRENT              | SENSITIVE   |
| `created_at`           | TIMESTAMPTZ |   NO | now                            | Creation timestamp         | System            | Trusted                    | Never            | HIGH     | HISTORICAL           | INTERNAL    |
| `created_by`           | UUID        |  YES | —                              | Provisioning actor         | System/Admin      | FK users.id when human     | Never            | HIGH     | HISTORICAL           | INTERNAL    |
| `updated_at`           | TIMESTAMPTZ |   NO | now                            | Last change                | System            | Trusted                    | System           | MEDIUM   | CURRENT              | INTERNAL    |
| `updated_by`           | UUID        |  YES | —                              | Latest actor               | System            | FK users.id                | System           | MEDIUM   | CURRENT              | INTERNAL    |
| `version`              | BIGINT      |   NO | 1                              | Concurrency version        | System            | `>0`                       | System           | HIGH     | CURRENT              | INTERNAL    |

### User Rules

* Users with historical activity are deactivated, not deleted.
* `password_hash` is never exposed to application responses.
* `login_identity` exact format is **UNCONFIRMED**.
* Whether email is mandatory is **UNCONFIRMED**.

---

# 10. Identity — `sessions`

| Field                | Type        | Null | Meaning                      | Rules                                        |
| -------------------- | ----------- | ---: | ---------------------------- | -------------------------------------------- |
| `id`                 | UUID        |   NO | Session record identity      | PK                                           |
| `user_id`            | UUID        |   NO | Session owner                | FK users.id                                  |
| `session_token_hash` | TEXT        |   NO | Hash of server session token | Never plaintext                              |
| `created_at`         | TIMESTAMPTZ |   NO | Session creation             | Trusted                                      |
| `last_seen_at`       | TIMESTAMPTZ |  YES | Latest activity              | System                                       |
| `expires_at`         | TIMESTAMPTZ |   NO | Expiration                   | Must be > created_at                         |
| `revoked_at`         | TIMESTAMPTZ |  YES | Revocation time              | System/Admin                                 |
| `revoked_reason`     | TEXT        |  YES | Why revoked                  | Required for some administrative revocations |
| `version`            | BIGINT      |   NO | Concurrency                  | Default 1                                    |

Sensitivity:

```text
SENSITIVE / SECRET-adjacent
```

---

# 11. Identity — `password_reset_requests`

| Field            | Type        | Null | Meaning                           |
| ---------------- | ----------- | ---: | --------------------------------- |
| `id`             | UUID        |   NO | Reset request                     |
| `user_id`        | UUID        |   NO | Target user                       |
| `requested_by`   | UUID        |  YES | Admin/user initiating             |
| `token_hash`     | TEXT        |  YES | Reset token hash where applicable |
| `created_at`     | TIMESTAMPTZ |   NO | Created                           |
| `expires_at`     | TIMESTAMPTZ |   NO | Expiry                            |
| `used_at`        | TIMESTAMPTZ |  YES | Successful use                    |
| `revoked_at`     | TIMESTAMPTZ |  YES | Revoked                           |
| `request_method` | TEXT        |   NO | Reset mechanism                   |

Never store plaintext reset tokens.

---

# 12. Authorization — `roles`

| Field            | Type        | Null | Meaning                   | Constraint    |
| ---------------- | ----------- | ---: | ------------------------- | ------------- |
| `id`             | UUID        |   NO | Role identity             | PK            |
| `code`           | TEXT        |   NO | Canonical role code       | UNIQUE        |
| `name`           | TEXT        |   NO | Display name              | Non-empty     |
| `description`    | TEXT        |  YES | Role purpose              | —             |
| `is_system_role` | BOOLEAN     |   NO | Foundation role indicator | Default false |
| `active`         | BOOLEAN     |   NO | Can be assigned           | Default true  |
| `created_at`     | TIMESTAMPTZ |   NO | Created                   | Trusted       |
| `updated_at`     | TIMESTAMPTZ |   NO | Updated                   | Trusted       |
| `version`        | BIGINT      |   NO | Concurrency               | >0            |

Foundation codes:

```text
EMPLOYEE
SUPERVISOR
MANAGER
ADMIN
```

---

# 13. Authorization — `permissions`

| Field         | Type        | Null | Meaning                   |
| ------------- | ----------- | ---: | ------------------------- |
| `id`          | UUID        |   NO | Permission identity       |
| `code`        | TEXT        |   NO | Canonical permission code |
| `domain`      | TEXT        |   NO | Owning logical domain     |
| `action`      | TEXT        |   NO | Canonical action          |
| `description` | TEXT        |  YES | Meaning                   |
| `risk_level`  | TEXT        |   NO | Permission risk class     |
| `active`      | BOOLEAN     |   NO | Availability              |
| `created_at`  | TIMESTAMPTZ |   NO | Creation                  |
| `updated_at`  | TIMESTAMPTZ |   NO | Update                    |

`code`:

```text
UNIQUE
```

Example:

```text
PERM-INSP-APPROVE
```

---

# 14. Authorization — `role_permissions`

| Field           | Type        | Null | Meaning    |
| --------------- | ----------- | ---: | ---------- |
| `role_id`       | UUID        |   NO | Role       |
| `permission_id` | UUID        |   NO | Permission |
| `granted_by`    | UUID        |  YES | Actor      |
| `granted_at`    | TIMESTAMPTZ |   NO | Grant time |

Constraints:

```text
PK/UNIQUE(role_id, permission_id)
FK role_id
FK permission_id
```

Changes are **CRITICAL audit events**.

---

# 15. Authorization — `user_roles`

| Field         | Type        | Null | Meaning             |
| ------------- | ----------- | ---: | ------------------- |
| `id`          | UUID        |   NO | Assignment identity |
| `user_id`     | UUID        |   NO | User                |
| `role_id`     | UUID        |   NO | Role                |
| `valid_from`  | TIMESTAMPTZ |  YES | Start               |
| `valid_until` | TIMESTAMPTZ |  YES | End                 |
| `assigned_by` | UUID        |   NO | Admin actor         |
| `assigned_at` | TIMESTAMPTZ |   NO | Assignment time     |
| `revoked_at`  | TIMESTAMPTZ |  YES | Revocation          |
| `revoked_by`  | UUID        |  YES | Revoking actor      |
| `reason`      | TEXT        |  YES | Reason              |

Historical assignments must not be overwritten.

---

# 16. Organizational Scope

The following model remains:

```text
UNCONFIRMED — DO NOT MIGRATE UNTIL ORGANIZATIONAL STRUCTURE IS APPROVED
```

Candidate:

```text
organizational_units
user_scope_assignments
```

Potential unit types:

```text
SITE
DEPARTMENT
TEAM
LAB
QC_AREA
```

Exact hierarchy must be confirmed before physical schema.

---

# 17. Tasks — `tasks`

| Field                 | Type        | Null | Meaning              | Rules                    |
| --------------------- | ----------- | ---: | -------------------- | ------------------------ |
| `id`                  | UUID        |   NO | Technical Task ID    | PK                       |
| `task_no`             | TEXT        |   NO | Human Task number    | UNIQUE                   |
| `title`               | TEXT        |   NO | Task title           | Non-empty                |
| `description`         | TEXT        |  YES | Task details         | —                        |
| `priority`            | TEXT        |   NO | Operational priority | Controlled values        |
| `state`               | TEXT        |   NO | Task lifecycle       | State machine constraint |
| `due_at`              | TIMESTAMPTZ |  YES | Due time             | —                        |
| `current_assignee_id` | UUID        |  YES | Current assignee     | FK users                 |
| `completed_at`        | TIMESTAMPTZ |  YES | Completion time      | System only              |
| `created_by`          | UUID        |   NO | Creator              | FK                       |
| `created_at`          | TIMESTAMPTZ |   NO | Created              | Trusted                  |
| `updated_by`          | UUID        |  YES | Latest editor        | FK                       |
| `updated_at`          | TIMESTAMPTZ |   NO | Latest mutation      | Trusted                  |
| `version`             | BIGINT      |   NO | Concurrency          | >0                       |

Task states:

```text
DRAFT
OPEN
IN_PROGRESS
ON_HOLD
COMPLETED
CANCELLED
```

`CANCELLED` remains policy-dependent.

---

# 18. Tasks — `task_assignments`

| Field           | Type        | Null | Meaning                |
| --------------- | ----------- | ---: | ---------------------- |
| `id`            | UUID        |   NO | Assignment history row |
| `task_id`       | UUID        |   NO | Task                   |
| `assignee_id`   | UUID        |   NO | Assigned user          |
| `assigned_by`   | UUID        |   NO | Assigning actor        |
| `assigned_at`   | TIMESTAMPTZ |   NO | Assignment time        |
| `unassigned_at` | TIMESTAMPTZ |  YES | Assignment ended       |
| `reason`        | TEXT        |  YES | Reassignment reason    |

Do not rewrite prior assignment row when reassigned.

---

# 19. Tasks — `task_checklist_items`

| Field          | Type        | Null | Meaning        |
| -------------- | ----------- | ---: | -------------- |
| `id`           | UUID        |   NO | Item           |
| `task_id`      | UUID        |   NO | Parent         |
| `label`        | TEXT        |   NO | Checklist text |
| `required`     | BOOLEAN     |   NO | Mandatory      |
| `position`     | INTEGER     |   NO | Display/order  |
| `completed`    | BOOLEAN     |   NO | Completion     |
| `completed_by` | UUID        |  YES | Actor          |
| `completed_at` | TIMESTAMPTZ |  YES | Time           |
| `version`      | BIGINT      |   NO | Concurrency    |

---

# 20. Tasks — `task_comments`

| Field        | Type        | Null | Meaning   |
| ------------ | ----------- | ---: | --------- |
| `id`         | UUID        |   NO | Comment   |
| `task_id`    | UUID        |   NO | Task      |
| `author_id`  | UUID        |   NO | Author    |
| `body`       | TEXT        |   NO | Comment   |
| `created_at` | TIMESTAMPTZ |   NO | Created   |
| `edited_at`  | TIMESTAMPTZ |  YES | Edit time |

Comment edit policy:

```text
POLICY-DEPENDENT
```

---

# 21. Quality — `findings`

| Field         | Type        | Null | Meaning                 | Status      |
| ------------- | ----------- | ---: | ----------------------- | ----------- |
| `id`          | UUID        |   NO | Finding ID              | APPROVED    |
| `finding_no`  | TEXT        |   NO | Business ID             | APPROVED    |
| `title`       | TEXT        |   NO | Finding title           | APPROVED    |
| `description` | TEXT        |   NO | Observation             | APPROVED    |
| `state`       | TEXT        |   NO | Lifecycle               | APPROVED    |
| `severity`    | TEXT        |  YES | Severity classification | UNCONFIRMED |
| `owner_id`    | UUID        |  YES | Responsible person      | POLICY      |
| `opened_at`   | TIMESTAMPTZ |  YES | Opened                  | System      |
| `closed_at`   | TIMESTAMPTZ |  YES | Closed                  | System      |
| `created_by`  | UUID        |   NO | Creator                 | APPROVED    |
| `created_at`  | TIMESTAMPTZ |   NO | Created                 | APPROVED    |
| `updated_at`  | TIMESTAMPTZ |   NO | Updated                 | APPROVED    |
| `version`     | BIGINT      |   NO | Concurrency             | APPROVED    |

---

# 22. Quality — `ncrs`

| Field                | Type        | Null | Meaning                 |
| -------------------- | ----------- | ---: | ----------------------- |
| `id`                 | UUID        |   NO | NCR technical ID        |
| `ncr_no`             | TEXT        |   NO | NCR business ID         |
| `title`              | TEXT        |   NO | Short title             |
| `description`        | TEXT        |   NO | Nonconformance          |
| `state`              | TEXT        |   NO | NCR lifecycle           |
| `finding_id`         | UUID        |  YES | Source Finding          |
| `affected_item_code` | TEXT        |  YES | Historical item context |
| `affected_lot`       | TEXT        |  YES | Lot context             |
| `owner_id`           | UUID        |  YES | Responsible user        |
| `opened_at`          | TIMESTAMPTZ |  YES | Open                    |
| `closed_at`          | TIMESTAMPTZ |  YES | Close                   |
| `created_by`         | UUID        |   NO | Creator                 |
| `created_at`         | TIMESTAMPTZ |   NO | Created                 |
| `updated_at`         | TIMESTAMPTZ |   NO | Updated                 |
| `version`            | BIGINT      |   NO | Version                 |

`ncr_no` is unique.

---

# 23. Quality — `rcas`

| Field          | Type        | Null | Meaning               |
| -------------- | ----------- | ---: | --------------------- |
| `id`           | UUID        |   NO | RCA ID                |
| `rca_no`       | TEXT        |  YES | Human ID if required  |
| `ncr_id`       | UUID        |   NO | Parent NCR            |
| `state`        | TEXT        |   NO | RCA state             |
| `method`       | TEXT        |  YES | RCA method            |
| `analysis`     | TEXT        |  YES | Investigation         |
| `root_cause`   | TEXT        |  YES | Root cause conclusion |
| `submitted_at` | TIMESTAMPTZ |  YES | Submitted             |
| `approved_at`  | TIMESTAMPTZ |  YES | Approved              |
| `created_by`   | UUID        |   NO | Author                |
| `created_at`   | TIMESTAMPTZ |   NO | Created               |
| `updated_at`   | TIMESTAMPTZ |   NO | Updated               |
| `version`      | BIGINT      |   NO | Version               |

Whether `rca_no` is required:

```text
UNCONFIRMED
```

---

# 24. Quality — `capas`

| Field                    | Type        | Null | Meaning                    |
| ------------------------ | ----------- | ---: | -------------------------- |
| `id`                     | UUID        |   NO | CAPA                       |
| `capa_no`                | TEXT        |   NO | Business ID                |
| `ncr_id`                 | UUID        |  YES | Related NCR                |
| `state`                  | TEXT        |   NO | Lifecycle                  |
| `title`                  | TEXT        |   NO | CAPA title                 |
| `description`            | TEXT        |   NO | CAPA scope                 |
| `owner_id`               | UUID        |  YES | CAPA owner                 |
| `target_date`            | DATE        |  YES | Planned completion         |
| `verification_required`  | BOOLEAN     |   NO | Verification needed        |
| `effectiveness_required` | BOOLEAN     |   NO | Effectiveness check needed |
| `closed_at`              | TIMESTAMPTZ |  YES | Closure                    |
| `created_by`             | UUID        |   NO | Creator                    |
| `created_at`             | TIMESTAMPTZ |   NO | Created                    |
| `updated_at`             | TIMESTAMPTZ |   NO | Updated                    |
| `version`                | BIGINT      |   NO | Version                    |

`effectiveness_required` default:

```text
DO NOT ASSUME
```

Must be driven by approved policy.

---

# 25. Quality — `capa_actions`

| Field                | Type        | Null | Meaning              |
| -------------------- | ----------- | ---: | -------------------- |
| `id`                 | UUID        |   NO | CAPA action          |
| `capa_id`            | UUID        |   NO | Parent CAPA          |
| `sequence_no`        | INTEGER     |   NO | Ordered action       |
| `description`        | TEXT        |   NO | Action               |
| `owner_id`           | UUID        |   NO | Assigned responsible |
| `due_at`             | TIMESTAMPTZ |  YES | Due                  |
| `state`              | TEXT        |   NO | Action state         |
| `completed_at`       | TIMESTAMPTZ |  YES | Completion           |
| `completed_by`       | UUID        |  YES | Completing actor     |
| `verification_state` | TEXT        |  YES | Verification         |
| `created_at`         | TIMESTAMPTZ |   NO | Created              |
| `updated_at`         | TIMESTAMPTZ |   NO | Updated              |
| `version`            | BIGINT      |   NO | Version              |

---

# 26. Quarantine — `receiving_items`

| Field               | Type         | Null | Source                    | Meaning                       | Validation / Lifecycle      | Audit    |
| ------------------- | ------------ | ---: | ------------------------- | ----------------------------- | --------------------------- | -------- |
| `id`                | UUID         |   NO | System                    | Technical identity            | PK                          | HIGH     |
| `receiving_no`      | TEXT         |   NO | System                    | Business ID                   | UNIQUE, immutable           | HIGH     |
| `doc_no`            | TEXT         |   NO | Receiving document        | Document number               | Non-empty                   | HIGH     |
| `item_code`         | TEXT         |   NO | Receiving document/master | Item identifier               | Non-empty                   | HIGH     |
| `description`       | TEXT         |   NO | Receiving source          | Item description at receiving | Historical receiving fact   | HIGH     |
| `lot`               | TEXT         |   NO | Receiving source          | Lot/batch                     | Non-empty                   | HIGH     |
| `qty`               | NUMERIC(p,s) |   NO | Receiving source          | Received quantity             | `>0`, precision UNCONFIRMED | HIGH     |
| `receiving_date`    | DATE         |   NO | Receiving source          | Receiving date                | Valid date                  | HIGH     |
| `expiry_date`       | DATE         |  YES | Receiving source          | Expiry                        | Business semantics apply    | HIGH     |
| `workflow_state`    | TEXT         |   NO | System                    | Operational state             | State machine controlled    | CRITICAL |
| `inspection_result` | TEXT         |   NO | Inspection domain/system  | Current inspection outcome    | Separate from workflow      | CRITICAL |
| `release_system`    | BOOLEAN      |   NO | Release workflow          | External/system release fact  | Default FALSE               | CRITICAL |
| `released_at`       | TIMESTAMPTZ  |  YES | System                    | Release time                  | Only via release transition | CRITICAL |
| `released_by`       | UUID         |  YES | System                    | Release actor                 | FK users                    | CRITICAL |
| `created_by`        | UUID         |   NO | Session actor             | Creator                       | Trusted                     | HIGH     |
| `created_at`        | TIMESTAMPTZ  |   NO | System                    | Created                       | Trusted                     | HIGH     |
| `updated_by`        | UUID         |  YES | Session actor             | Latest actor                  | —                           | MEDIUM   |
| `updated_at`        | TIMESTAMPTZ  |   NO | System                    | Updated                       | —                           | MEDIUM   |
| `version`           | BIGINT       |   NO | System                    | Concurrency                   | `>0`                        | CRITICAL |

### Receiving Defaults

```text
workflow_state = PENDING
inspection_result = NOT_STARTED
release_system = FALSE
```

### Receiving Critical Rule

```text
workflow_state
!=
inspection_result
!=
release_system
```

These facts are separate.

---

# 27. Inspection Templates — `inspection_templates`

| Field           | Type        | Null | Meaning               |
| --------------- | ----------- | ---: | --------------------- |
| `id`            | UUID        |   NO | Template identity     |
| `template_code` | TEXT        |   NO | Stable template code  |
| `name`          | TEXT        |   NO | Name                  |
| `description`   | TEXT        |  YES | Description           |
| `active`        | BOOLEAN     |   NO | Identity availability |
| `created_by`    | UUID        |   NO | Creator               |
| `created_at`    | TIMESTAMPTZ |   NO | Created               |
| `updated_at`    | TIMESTAMPTZ |   NO | Updated               |
| `version`       | BIGINT      |   NO | Entity version        |

`template_code` unique.

---

# 28. Inspection Templates — `inspection_template_versions`

| Field          | Type        | Null | Meaning                 | Rules                             |
| -------------- | ----------- | ---: | ----------------------- | --------------------------------- |
| `id`           | UUID        |   NO | Version identity        | PK                                |
| `template_id`  | UUID        |   NO | Template                | FK                                |
| `version_no`   | TEXT        |   NO | Business revision       | Exact datatype policy UNCONFIRMED |
| `state`        | TEXT        |   NO | Lifecycle               | Controlled                        |
| `effective_at` | TIMESTAMPTZ |  YES | Effective time          | Policy-dependent                  |
| `approved_at`  | TIMESTAMPTZ |  YES | Approval                | System                            |
| `approved_by`  | UUID        |  YES | Approver                | Shortcut only                     |
| `content_hash` | TEXT        |  YES | Controlled content hash | Finalized on controlled version   |
| `created_by`   | UUID        |   NO | Creator                 | —                                 |
| `created_at`   | TIMESTAMPTZ |   NO | Created                 | —                                 |
| `version`      | BIGINT      |   NO | Concurrency             | —                                 |

Unique:

```text
(template_id, version_no)
```

---

# 29. Inspection Templates — `inspection_template_sections`

| Field                 | Type    | Null | Meaning                 |
| --------------------- | ------- | ---: | ----------------------- |
| `id`                  | UUID    |   NO | Section                 |
| `template_version_id` | UUID    |   NO | Version                 |
| `section_code`        | TEXT    |  YES | Stable code             |
| `title`               | TEXT    |   NO | Section title           |
| `instructions`        | TEXT    |  YES | Controlled instructions |
| `position`            | INTEGER |   NO | Ordering                |

---

# 30. Inspection Templates — `inspection_template_points`

| Field                     | Type    | Null | Meaning                 | Classification   |
| ------------------------- | ------- | ---: | ----------------------- | ---------------- |
| `id`                      | UUID    |   NO | Inspection point        | APPROVED         |
| `section_id`              | UUID    |   NO | Parent section          | APPROVED         |
| `point_code`              | TEXT    |   NO | Stable point identifier | APPROVED         |
| `label`                   | TEXT    |   NO | User-facing requirement | APPROVED         |
| `requirement_text`        | TEXT    |  YES | Requirement wording     | SOURCE-DEPENDENT |
| `data_type`               | TEXT    |   NO | Expected result type    | APPROVED         |
| `unit`                    | TEXT    |  YES | Scientific unit         | SOURCE-DEPENDENT |
| `required`                | BOOLEAN |   NO | Mandatory point         | SOURCE/POLICY    |
| `acceptance_rule_type`    | TEXT    |  YES | Rule type               | SOURCE-DEPENDENT |
| `acceptance_rule_payload` | JSONB   |  YES | Controlled criteria     | SOURCE-DEPENDENT |
| `source_reference`        | TEXT    |  YES | WI/SOP/spec source      | SOURCE-DEPENDENT |
| `position`                | INTEGER |   NO | Ordering                | APPROVED         |

No developer may create scientific limits here without approved source.

---

# 31. Inspection — `inspection_reports`

| Field                 | Type        | Null | Meaning                           | Audit    |
| --------------------- | ----------- | ---: | --------------------------------- | -------- |
| `id`                  | UUID        |   NO | Report ID                         | HIGH     |
| `inspection_no`       | TEXT        |   NO | Business report number            | HIGH     |
| `receiving_item_id`   | UUID        |   NO | Source Receiving                  | HIGH     |
| `template_version_id` | UUID        |   NO | Exact template version            | CRITICAL |
| `state`               | TEXT        |   NO | Workflow lifecycle                | CRITICAL |
| `final_result`        | TEXT        |  YES | `PASS/FAIL/HOLD`                  | CRITICAL |
| `author_id`           | UUID        |   NO | Executor/author                   | HIGH     |
| `submitted_at`        | TIMESTAMPTZ |  YES | Submission                        | CRITICAL |
| `review_started_at`   | TIMESTAMPTZ |  YES | Review start                      | HIGH     |
| `approved_at`         | TIMESTAMPTZ |  YES | Approval                          | CRITICAL |
| `rejected_at`         | TIMESTAMPTZ |  YES | Workflow rejection                | CRITICAL |
| `voided_at`           | TIMESTAMPTZ |  YES | Void                              | CRITICAL |
| `void_reason`         | TEXT        |  YES | Void reason                       | CRITICAL |
| `snapshot_id`         | UUID        |  YES | Final/current controlled snapshot | CRITICAL |
| `created_by`          | UUID        |   NO | Creator                           | HIGH     |
| `created_at`          | TIMESTAMPTZ |   NO | Created                           | HIGH     |
| `updated_at`          | TIMESTAMPTZ |   NO | Updated                           | HIGH     |
| `updated_by`          | UUID        |  YES | Latest actor                      | HIGH     |
| `version`             | BIGINT      |   NO | Concurrency                       | CRITICAL |

`inspection_no` unique.

---

# 32. Inspection — `inspection_report_results`

Because result values may be different types, use typed storage.

| Field                  | Type         | Null | Meaning                |
| ---------------------- | ------------ | ---: | ---------------------- |
| `id`                   | UUID         |   NO | Result                 |
| `inspection_report_id` | UUID         |   NO | Report                 |
| `template_point_id`    | UUID         |   NO | Controlled requirement |
| `numeric_value`        | NUMERIC(p,s) |  YES | Numeric observation    |
| `text_value`           | TEXT         |  YES | Text observation       |
| `boolean_value`        | BOOLEAN      |  YES | Boolean observation    |
| `selected_value`       | TEXT         |  YES | Controlled option      |
| `unit`                 | TEXT         |  YES | Actual recorded unit   |
| `result`               | TEXT         |  YES | Point outcome          |
| `remarks`              | TEXT         |  YES | Notes                  |
| `entered_by`           | UUID         |   NO | Actor                  |
| `entered_at`           | TIMESTAMPTZ  |   NO | Initial entry          |
| `updated_at`           | TIMESTAMPTZ  |   NO | Latest draft update    |
| `version`              | BIGINT       |   NO | Concurrency            |

Constraint:

> Exactly one appropriate value representation should be used based on template `data_type`.

This should be enforced application-side and, where feasible, DB-side.

---

# 33. Inspection — `inspection_report_snapshots`

| Field                        | Type        | Null | Meaning                           |
| ---------------------------- | ----------- | ---: | --------------------------------- |
| `id`                         | UUID        |   NO | Snapshot                          |
| `inspection_report_id`       | UUID        |   NO | Report                            |
| `snapshot_version`           | INTEGER     |   NO | Snapshot sequence                 |
| `snapshot_stage`             | TEXT        |   NO | Submission/final                  |
| `receiving_snapshot`         | JSONB       |   NO | Frozen Receiving context          |
| `template_snapshot`          | JSONB       |   NO | Frozen template                   |
| `controlled_source_snapshot` | JSONB       |  YES | Source references/content context |
| `criteria_snapshot`          | JSONB       |  YES | Acceptance criteria used          |
| `created_at`                 | TIMESTAMPTZ |   NO | Snapshot time                     |
| `snapshot_hash`              | TEXT        |   NO | Integrity hash                    |

After finalization:

```text
IMMUTABLE
```

---

# 34. Laboratory Templates — `lab_test_templates`

| Field         | Type        | Null | Meaning             |
| ------------- | ----------- | ---: | ------------------- |
| `id`          | UUID        |   NO | Test identity       |
| `test_code`   | TEXT        |   NO | Canonical test code |
| `name`        | TEXT        |   NO | Test name           |
| `description` | TEXT        |  YES | Description         |
| `active`      | BOOLEAN     |   NO | Active identity     |
| `created_by`  | UUID        |   NO | Creator             |
| `created_at`  | TIMESTAMPTZ |   NO | Created             |
| `updated_at`  | TIMESTAMPTZ |   NO | Updated             |
| `version`     | BIGINT      |   NO | Concurrency         |

`test_code` unique.

---

# 35. Laboratory Templates — `lab_test_template_versions`

| Field              | Type        | Null | Meaning             |
| ------------------ | ----------- | ---: | ------------------- |
| `id`               | UUID        |   NO | Template version    |
| `template_id`      | UUID        |   NO | Test identity       |
| `version_no`       | TEXT        |   NO | Controlled revision |
| `state`            | TEXT        |   NO | Lifecycle           |
| `method_reference` | TEXT        |  YES | Controlled method   |
| `effective_at`     | TIMESTAMPTZ |  YES | Effective           |
| `approved_at`      | TIMESTAMPTZ |  YES | Approval            |
| `approved_by`      | UUID        |  YES | Approver shortcut   |
| `content_hash`     | TEXT        |  YES | Version hash        |
| `created_by`       | UUID        |   NO | Creator             |
| `created_at`       | TIMESTAMPTZ |   NO | Created             |
| `version`          | BIGINT      |   NO | Concurrency         |

---

# 36. Laboratory Templates — `lab_test_template_parameters`

| Field                         | Type    | Null | Meaning                   | Rule             |
| ----------------------------- | ------- | ---: | ------------------------- | ---------------- |
| `id`                          | UUID    |   NO | Parameter                 | APPROVED         |
| `template_version_id`         | UUID    |   NO | Version                   | APPROVED         |
| `parameter_code`              | TEXT    |   NO | Stable parameter code     | APPROVED         |
| `label`                       | TEXT    |   NO | Parameter name            | APPROVED         |
| `data_type`                   | TEXT    |   NO | Input type                | APPROVED         |
| `unit`                        | TEXT    |  YES | Unit                      | SOURCE-DEPENDENT |
| `required`                    | BOOLEAN |   NO | Required                  | SOURCE-DEPENDENT |
| `acceptance_rule_type`        | TEXT    |  YES | Comparison/formula type   | SOURCE-DEPENDENT |
| `acceptance_rule_payload`     | JSONB   |  YES | Scientific limits/formula | SOURCE-DEPENDENT |
| `controlled_source_reference` | TEXT    |  YES | WI/SOP/method             | SOURCE-DEPENDENT |
| `position`                    | INTEGER |   NO | Ordering                  | APPROVED         |

---

# 37. Laboratory — `lab_tests`

| Field                      | Type        | Null | Meaning               | Audit    |
| -------------------------- | ----------- | ---: | --------------------- | -------- |
| `id`                       | UUID        |   NO | Lab Test              | HIGH     |
| `lab_test_no`              | TEXT        |   NO | Business ID           | HIGH     |
| `template_version_id`      | UUID        |   NO | Exact method/template | CRITICAL |
| `state`                    | TEXT        |   NO | Workflow              | CRITICAL |
| `scientific_result`        | TEXT        |  YES | Scientific outcome    | CRITICAL |
| `source_receiving_item_id` | UUID        |  YES | Source Receiving      | HIGH     |
| `original_test_id`         | UUID        |  YES | Original if Retest    | HIGH     |
| `retest_sequence`          | INTEGER     |   NO | 0 original, >0 retest | HIGH     |
| `retest_reason`            | TEXT        |  YES | Retest reason         | HIGH     |
| `author_id`                | UUID        |   NO | Test executor         | HIGH     |
| `submitted_at`             | TIMESTAMPTZ |  YES | Submit                | CRITICAL |
| `review_started_at`        | TIMESTAMPTZ |  YES | Review                | HIGH     |
| `approved_at`              | TIMESTAMPTZ |  YES | Approval              | CRITICAL |
| `rejected_at`              | TIMESTAMPTZ |  YES | Reject                | CRITICAL |
| `voided_at`                | TIMESTAMPTZ |  YES | Void                  | CRITICAL |
| `void_reason`              | TEXT        |  YES | Void reason           | CRITICAL |
| `snapshot_id`              | UUID        |  YES | Final snapshot        | CRITICAL |
| `created_by`               | UUID        |   NO | Creator               | HIGH     |
| `created_at`               | TIMESTAMPTZ |   NO | Created               | HIGH     |
| `updated_by`               | UUID        |  YES | Latest actor          | HIGH     |
| `updated_at`               | TIMESTAMPTZ |   NO | Updated               | HIGH     |
| `version`                  | BIGINT      |   NO | Concurrency           | CRITICAL |

Constraint:

```text
retest_sequence >= 0
```

If `retest_sequence > 0`:

```text
original_test_id IS NOT NULL
retest_reason IS NOT NULL
```

---

# 38. Laboratory — `lab_samples`

| Field               | Type        | Null | Meaning                    |
| ------------------- | ----------- | ---: | -------------------------- |
| `id`                | UUID        |   NO | Sample                     |
| `lab_test_id`       | UUID        |   NO | Parent test                |
| `sample_no`         | TEXT        |  YES | Human sample number        |
| `sample_identifier` | TEXT        |   NO | Traceable identifier       |
| `position`          | INTEGER     |  YES | Order                      |
| `sample_source`     | TEXT        |  YES | Source/location            |
| `state`             | TEXT        |  YES | Sample lifecycle if needed |
| `created_by`        | UUID        |   NO | Creator                    |
| `created_at`        | TIMESTAMPTZ |   NO | Created                    |
| `version`           | BIGINT      |   NO | Version                    |

Exact sample lifecycle:

```text
UNCONFIRMED
```

---

# 39. Laboratory — `lab_measurements`

| Field                   | Type         | Null | Meaning           |
| ----------------------- | ------------ | ---: | ----------------- |
| `id`                    | UUID         |   NO | Measurement       |
| `lab_test_id`           | UUID         |   NO | Test              |
| `sample_id`             | UUID         |  YES | Sample            |
| `template_parameter_id` | UUID         |   NO | Parameter         |
| `raw_numeric_value`     | NUMERIC(p,s) |  YES | Raw numeric value |
| `raw_text_value`        | TEXT         |  YES | Text observation  |
| `raw_boolean_value`     | BOOLEAN      |  YES | Boolean result    |
| `unit`                  | TEXT         |  YES | Raw unit          |
| `calculated_value`      | NUMERIC(p,s) |  YES | Calculated output |
| `calculated_unit`       | TEXT         |  YES | Output unit       |
| `result`                | TEXT         |  YES | Parameter result  |
| `remarks`               | TEXT         |  YES | Notes             |
| `entered_by`            | UUID         |   NO | Actor             |
| `entered_at`            | TIMESTAMPTZ  |   NO | Entry             |
| `updated_at`            | TIMESTAMPTZ  |   NO | Draft update      |
| `version`               | BIGINT       |   NO | Version           |

Scientific precision:

```text
SOURCE-DEPENDENT
```

---

# 40. Laboratory — `lab_equipment_usage`

| Field                   | Type        | Null | Meaning                      |
| ----------------------- | ----------- | ---: | ---------------------------- |
| `id`                    | UUID        |   NO | Usage record                 |
| `lab_test_id`           | UUID        |   NO | Test                         |
| `equipment_id`          | UUID        |   NO | Equipment                    |
| `calibration_record_id` | UUID        |  YES | Calibration governing use    |
| `usage_role`            | TEXT        |  YES | Equipment purpose            |
| `used_at`               | TIMESTAMPTZ |  YES | Actual use time              |
| `equipment_snapshot`    | JSONB       |   NO | Historical equipment context |
| `calibration_snapshot`  | JSONB       |  YES | Calibration context          |
| `created_at`            | TIMESTAMPTZ |   NO | Recorded                     |

No later Equipment edit may rewrite snapshots.

---

# 41. Laboratory — `lab_document_usage`

| Field                 | Type        | Null | Meaning                 |
| --------------------- | ----------- | ---: | ----------------------- |
| `id`                  | UUID        |   NO | Reference               |
| `lab_test_id`         | UUID        |   NO | Test                    |
| `document_version_id` | UUID        |   NO | Exact document version  |
| `usage_type`          | TEXT        |   NO | WI/SOP/METHOD/etc       |
| `document_snapshot`   | JSONB       |  YES | Frozen critical context |
| `created_at`          | TIMESTAMPTZ |   NO | Link time               |

---

# 42. Laboratory — `lab_test_snapshots`

| Field                     | Type        | Null | Meaning                   |
| ------------------------- | ----------- | ---: | ------------------------- |
| `id`                      | UUID        |   NO | Snapshot                  |
| `lab_test_id`             | UUID        |   NO | Test                      |
| `snapshot_version`        | INTEGER     |   NO | Sequence                  |
| `snapshot_stage`          | TEXT        |   NO | Submission/final          |
| `template_snapshot`       | JSONB       |   NO | Test definition           |
| `source_snapshot`         | JSONB       |  YES | Receiving/product context |
| `equipment_snapshot`      | JSONB       |  YES | Equipment used            |
| `calibration_snapshot`    | JSONB       |  YES | Calibration state         |
| `document_snapshot`       | JSONB       |  YES | WI/SOP/method             |
| `criteria_snapshot`       | JSONB       |  YES | Acceptance criteria       |
| `sample_context_snapshot` | JSONB       |  YES | Sample context            |
| `created_at`              | TIMESTAMPTZ |   NO | Created                   |
| `snapshot_hash`           | TEXT        |   NO | Integrity                 |

Final snapshot:

```text
IMMUTABLE
```

---

# 43. Equipment — `equipment`

| Field                    | Type        | Null | Meaning                      | Status                   |
| ------------------------ | ----------- | ---: | ---------------------------- | ------------------------ |
| `id`                     | UUID        |   NO | Equipment ID                 | APPROVED                 |
| `equipment_no`           | TEXT        |   NO | Asset/business ID            | APPROVED                 |
| `name`                   | TEXT        |   NO | Equipment name               | APPROVED                 |
| `manufacturer`           | TEXT        |  YES | Manufacturer                 | UNCONFIRMED requiredness |
| `model`                  | TEXT        |  YES | Model                        | UNCONFIRMED requiredness |
| `serial_no`              | TEXT        |  YES | Serial                       | UNCONFIRMED requiredness |
| `location`               | TEXT        |  YES | Current location             | UNCONFIRMED model        |
| `state`                  | TEXT        |   NO | Equipment lifecycle          | APPROVED                 |
| `current_calibration_id` | UUID        |  YES | Current calibration shortcut | POLICY                   |
| `commissioned_at`        | TIMESTAMPTZ |  YES | Activation                   | POLICY                   |
| `decommissioned_at`      | TIMESTAMPTZ |  YES | Decommission                 | APPROVED                 |
| `created_by`             | UUID        |   NO | Creator                      | APPROVED                 |
| `created_at`             | TIMESTAMPTZ |   NO | Created                      | APPROVED                 |
| `updated_at`             | TIMESTAMPTZ |   NO | Updated                      | APPROVED                 |
| `version`                | BIGINT      |   NO | Version                      | APPROVED                 |

`equipment_no` unique.

---

# 44. Calibration — `calibration_records`

| Field               | Type        | Null | Meaning             | Rule             |
| ------------------- | ----------- | ---: | ------------------- | ---------------- |
| `id`                | UUID        |   NO | Calibration ID      | APPROVED         |
| `calibration_no`    | TEXT        |   NO | Business ID         | UNIQUE           |
| `equipment_id`      | UUID        |   NO | Equipment           | FK               |
| `state`             | TEXT        |   NO | Lifecycle           | State machine    |
| `calibration_date`  | DATE        |   NO | Calibration date    | SOURCE           |
| `due_date`          | DATE        |  YES | Next due            | SOURCE/POLICY    |
| `provider`          | TEXT        |  YES | Provider            | POLICY           |
| `certificate_no`    | TEXT        |  YES | Certificate         | POLICY           |
| `result`            | TEXT        |  YES | Calibration outcome | SOURCE           |
| `approved_at`       | TIMESTAMPTZ |  YES | Approval            | Controlled       |
| `approved_by`       | UUID        |  YES | Approver            | Shortcut         |
| `became_current_at` | TIMESTAMPTZ |  YES | Current activation  | System           |
| `superseded_at`     | TIMESTAMPTZ |  YES | Superseded          | System           |
| `voided_at`         | TIMESTAMPTZ |  YES | Void                | Controlled       |
| `void_reason`       | TEXT        |  YES | Reason              | Required on void |
| `created_by`        | UUID        |   NO | Creator             | —                |
| `created_at`        | TIMESTAMPTZ |   NO | Created             | —                |
| `updated_at`        | TIMESTAMPTZ |   NO | Updated             | —                |
| `version`           | BIGINT      |   NO | Version             | —                |

Do not invent calibration interval.

---

# 45. Maintenance — `maintenance_records`

| Field              | Type        | Null | Meaning                     |                         |
| ------------------ | ----------- | ---: | --------------------------- | ----------------------- |
| `id`               | UUID        |   NO | Maintenance                 |                         |
| `maintenance_no`   | TEXT        |   NO | Business ID                 |                         |
| `equipment_id`     | UUID        |   NO | Equipment                   |                         |
| `state`            | TEXT        |   NO | Lifecycle                   |                         |
| `maintenance_type` | TEXT        |  YES | Type                        |                         |
| `description`      | TEXT        |   NO | Work description            |                         |
| `planned_at`       | TIMESTAMPTZ |  YES | Planned                     |                         |
| `started_at`       | TIMESTAMPTZ |  YES | Started                     |                         |
| `completed_at`     | TIMESTAMPTZ |  YES | Completed                   |                         |
| `performed_by`     | TEXT / UUID |  YES | Internal/external performer | Exact model UNCONFIRMED |
| `provider`         | TEXT        |  YES | External provider           |                         |
| `result`           | TEXT        |  YES | Completion/result           |                         |
| `created_by`       | UUID        |   NO | Creator                     |                         |
| `created_at`       | TIMESTAMPTZ |   NO | Created                     |                         |
| `updated_at`       | TIMESTAMPTZ |   NO | Updated                     |                         |
| `version`          | BIGINT      |   NO | Version                     |                         |

`maintenance_no` unique.

---

# 46. Controlled Documents — `document_identities`

| Field           | Type        | Null | Meaning                    |
| --------------- | ----------- | ---: | -------------------------- |
| `id`            | UUID        |   NO | Document identity          |
| `document_no`   | TEXT        |   NO | Controlled document number |
| `document_type` | TEXT        |   NO | WI/SOP/etc                 |
| `title`         | TEXT        |   NO | Document title             |
| `owner_id`      | UUID        |  YES | Document owner             |
| `active`        | BOOLEAN     |   NO | Identity active            |
| `created_by`    | UUID        |   NO | Creator                    |
| `created_at`    | TIMESTAMPTZ |   NO | Created                    |
| `updated_at`    | TIMESTAMPTZ |   NO | Updated                    |
| `version`       | BIGINT      |   NO | Version                    |

`document_no` unique.

---

# 47. Controlled Documents — `document_versions`

| Field            | Type        | Null | Meaning                 | Audit    |
| ---------------- | ----------- | ---: | ----------------------- | -------- |
| `id`             | UUID        |   NO | Version                 | HIGH     |
| `document_id`    | UUID        |   NO | Identity                | HIGH     |
| `revision`       | TEXT        |   NO | Revision                | CRITICAL |
| `state`          | TEXT        |   NO | Lifecycle               | CRITICAL |
| `effective_at`   | TIMESTAMPTZ |  YES | Effective               | CRITICAL |
| `approved_at`    | TIMESTAMPTZ |  YES | Approval                | CRITICAL |
| `approved_by`    | UUID        |  YES | Approver                | CRITICAL |
| `superseded_at`  | TIMESTAMPTZ |  YES | Supersession            | CRITICAL |
| `archived_at`    | TIMESTAMPTZ |  YES | Archive                 | HIGH     |
| `voided_at`      | TIMESTAMPTZ |  YES | Void                    | CRITICAL |
| `void_reason`    | TEXT        |  YES | Void reason             | CRITICAL |
| `change_summary` | TEXT        |  YES | Revision summary        | HIGH     |
| `content_hash`   | TEXT        |  YES | Controlled content hash | CRITICAL |
| `created_by`     | UUID        |   NO | Author                  | HIGH     |
| `created_at`     | TIMESTAMPTZ |   NO | Created                 | HIGH     |
| `version`        | BIGINT      |   NO | Concurrency             | CRITICAL |

Unique:

```text
(document_id, revision)
```

Revision format:

```text
UNCONFIRMED
```

---

# 48. Controlled Documents — `document_version_files`

| Field                 | Type        | Null | Meaning              |
| --------------------- | ----------- | ---: | -------------------- |
| `id`                  | UUID        |   NO | Link                 |
| `document_version_id` | UUID        |   NO | Version              |
| `file_id`             | UUID        |   NO | File                 |
| `file_role`           | TEXT        |   NO | PRIMARY/APPENDIX/etc |
| `linked_at`           | TIMESTAMPTZ |   NO | Link time            |
| `linked_by`           | UUID        |   NO | Actor                |

---

# 49. Approval — `approval_cases`

| Field             | Type        | Null | Meaning               |
| ----------------- | ----------- | ---: | --------------------- |
| `id`              | UUID        |   NO | Workflow instance     |
| `subject_type`    | TEXT        |   NO | Canonical entity type |
| `subject_id`      | UUID        |   NO | Subject               |
| `subject_version` | BIGINT      |   NO | Version under review  |
| `workflow_type`   | TEXT        |   NO | Approval workflow     |
| `state`           | TEXT        |   NO | Case state            |
| `requested_by`    | UUID        |   NO | Requester             |
| `requested_at`    | TIMESTAMPTZ |   NO | Requested             |
| `completed_at`    | TIMESTAMPTZ |  YES | Completion            |
| `created_at`      | TIMESTAMPTZ |   NO | Created               |
| `version`         | BIGINT      |   NO | Version               |

`subject_type` must come from server-side canonical registry.

---

# 50. Approval — `approval_work_items`

| Field                       | Type        | Null | Meaning                  |
| --------------------------- | ----------- | ---: | ------------------------ |
| `id`                        | UUID        |   NO | Workflow step            |
| `approval_case_id`          | UUID        |   NO | Case                     |
| `step_no`                   | INTEGER     |   NO | Step                     |
| `work_type`                 | TEXT        |   NO | REVIEW/APPROVAL          |
| `assigned_user_id`          | UUID        |  YES | Specific assignee        |
| `assigned_role_requirement` | TEXT        |  YES | Required role/capability |
| `state`                     | TEXT        |   NO | Work item state          |
| `assigned_at`               | TIMESTAMPTZ |  YES | Assigned                 |
| `started_at`                | TIMESTAMPTZ |  YES | Started                  |
| `completed_at`              | TIMESTAMPTZ |  YES | Completed                |
| `version`                   | BIGINT      |   NO | Version                  |

Workflow step configuration remains partially policy-dependent.

---

# 51. Approval — `approval_decisions`

| Field              | Type        | Null | Meaning               | Rule                        |
| ------------------ | ----------- | ---: | --------------------- | --------------------------- |
| `id`               | UUID        |   NO | Decision event        | Immutable                   |
| `approval_case_id` | UUID        |   NO | Case                  | FK                          |
| `work_item_id`     | UUID        |  YES | Step                  | FK                          |
| `actor_id`         | UUID        |   NO | Human actor           | Trusted                     |
| `decision`         | TEXT        |   NO | APPROVE/REJECT/RETURN | Controlled                  |
| `subject_version`  | BIGINT      |   NO | Exact version         | Critical                    |
| `reason`           | TEXT        |  YES | Controlled reason     | Required depending decision |
| `comments`         | TEXT        |  YES | Additional comments   | —                           |
| `signature_id`     | UUID        |  YES | E-signature           | FK                          |
| `decided_at`       | TIMESTAMPTZ |   NO | Trusted time          | Immutable                   |
| `request_id`       | TEXT        |   NO | Request correlation   | Indexed                     |

Approval decisions are append-only.

---

# 52. E-Signatures — `electronic_signatures`

| Field             | Type        | Null | Meaning                 |
| ----------------- | ----------- | ---: | ----------------------- |
| `id`              | UUID        |   NO | Signature evidence      |
| `actor_id`        | UUID        |   NO | Signer                  |
| `subject_type`    | TEXT        |   NO | Entity type             |
| `subject_id`      | UUID        |   NO | Entity                  |
| `subject_version` | BIGINT      |   NO | Exact version           |
| `action`          | TEXT        |   NO | Signed action           |
| `meaning`         | TEXT        |   NO | Meaning shown to signer |
| `signed_at`       | TIMESTAMPTZ |   NO | Trusted time            |
| `snapshot_hash`   | TEXT        |   NO | Bound snapshot hash     |
| `reason`          | TEXT        |  YES | Reason if required      |
| `reauth_method`   | TEXT        |   NO | Reauthentication type   |
| `request_id`      | TEXT        |   NO | Correlation             |

Never store:

```text
password
password hash copy
reauth secret
```

---

# 53. Change Requests — `change_requests`

| Field                  | Type        | Null | Meaning                    |
| ---------------------- | ----------- | ---: | -------------------------- |
| `id`                   | UUID        |   NO | Request                    |
| `change_no`            | TEXT        |   NO | Business ID                |
| `target_type`          | TEXT        |   NO | Canonical entity           |
| `target_id`            | UUID        |   NO | Target                     |
| `target_version`       | BIGINT      |   NO | Target version at creation |
| `state`                | TEXT        |   NO | Lifecycle                  |
| `reason`               | TEXT        |   NO | Why change requested       |
| `target_snapshot`      | JSONB       |   NO | Original target context    |
| `target_snapshot_hash` | TEXT        |  YES | Snapshot integrity         |
| `requested_by`         | UUID        |   NO | Requester                  |
| `submitted_at`         | TIMESTAMPTZ |  YES | Submitted                  |
| `approved_at`          | TIMESTAMPTZ |  YES | Approved                   |
| `rejected_at`          | TIMESTAMPTZ |  YES | Rejected                   |
| `applied_at`           | TIMESTAMPTZ |  YES | Applied                    |
| `created_at`           | TIMESTAMPTZ |   NO | Created                    |
| `updated_at`           | TIMESTAMPTZ |   NO | Updated                    |
| `version`              | BIGINT      |   NO | Concurrency                |

`change_no` unique.

---

# 54. Change Requests — `change_request_changes`

| Field               | Type    | Null | Meaning                 |
| ------------------- | ------- | ---: | ----------------------- |
| `id`                | UUID    |   NO | Proposed field change   |
| `change_request_id` | UUID    |   NO | Parent                  |
| `field_path`        | TEXT    |   NO | Controlled target field |
| `current_value`     | JSONB   |  YES | Current value           |
| `proposed_value`    | JSONB   |  YES | Proposed                |
| `data_type`         | TEXT    |   NO | Expected type           |
| `position`          | INTEGER |   NO | Ordering                |

`field_path` must be server-validated against allowed change targets.

---

# 55. Change Requests — `change_application_attempts`

| Field                   | Type        | Null | Meaning        |
| ----------------------- | ----------- | ---: | -------------- |
| `id`                    | UUID        |   NO | Attempt        |
| `change_request_id`     | UUID        |   NO | Request        |
| `attempt_no`            | INTEGER     |   NO | Attempt number |
| `started_at`            | TIMESTAMPTZ |   NO | Start          |
| `finished_at`           | TIMESTAMPTZ |  YES | End            |
| `result`                | TEXT        |   NO | SUCCESS/FAILED |
| `target_version_before` | BIGINT      |  YES | Before         |
| `target_version_after`  | BIGINT      |  YES | After          |
| `error_code`            | TEXT        |  YES | Stable failure |
| `request_id`            | TEXT        |   NO | Correlation    |

Unique:

```text
(change_request_id, attempt_no)
```

---

# 56. Audit — `audit_events`

| Field           | Type                 | Null | Meaning                | Rule                    |
| --------------- | -------------------- | ---: | ---------------------- | ----------------------- |
| `id`            | UUID                 |   NO | Audit event            | Immutable               |
| `event_no`      | BIGINT / sortable ID |  YES | Ordered event number   | Architecture decision   |
| `occurred_at`   | TIMESTAMPTZ          |   NO | Trusted event time     | Immutable               |
| `actor_type`    | TEXT                 |   NO | USER/SYSTEM/SERVICE    | Controlled              |
| `actor_id`      | UUID                 |  YES | Actor where applicable | No destructive cascade  |
| `subject_type`  | TEXT                 |   NO | Entity type            | Canonical               |
| `subject_id`    | UUID                 |   NO | Entity                 | Historical reference    |
| `action`        | TEXT                 |   NO | Mutation/action        | Canonical               |
| `transition_id` | TEXT                 |  YES | State transition       | State machine link      |
| `old_state`     | TEXT                 |  YES | Previous state         | Historical              |
| `new_state`     | TEXT                 |  YES | New state              | Historical              |
| `reason`        | TEXT                 |  YES | Controlled reason      | —                       |
| `request_id`    | TEXT                 |   NO | Request correlation    | Indexed                 |
| `signature_id`  | UUID                 |  YES | Signature evidence     | —                       |
| `payload`       | JSONB                |  YES | Structured details     | Minimize sensitive data |
| `previous_hash` | TEXT                 |  YES | Previous event hash    | UNCONFIRMED             |
| `event_hash`    | TEXT                 |  YES | Integrity hash         | UNCONFIRMED             |

Core audit rows:

```text
NO NORMAL UPDATE
NO NORMAL DELETE
```

Cryptographic chaining remains unconfirmed.

---

# 57. Files — `files`

| Field               | Type        | Null | Meaning                    |
| ------------------- | ----------- | ---: | -------------------------- |
| `id`                | UUID        |   NO | File metadata              |
| `original_filename` | TEXT        |   NO | User-visible original name |
| `storage_key`       | TEXT        |   NO | Opaque storage reference   |
| `storage_provider`  | TEXT        |   NO | Storage backend            |
| `mime_type`         | TEXT        |   NO | Validated MIME             |
| `extension`         | TEXT        |  YES | Validated extension        |
| `size_bytes`        | BIGINT      |   NO | File size                  |
| `sha256`            | TEXT        |   NO | Binary hash                |
| `state`             | TEXT        |   NO | File lifecycle             |
| `uploaded_by`       | UUID        |   NO | Uploader                   |
| `uploaded_at`       | TIMESTAMPTZ |   NO | Upload time                |

Constraints:

```text
size_bytes >= 0
storage_key UNIQUE
```

Exact MIME and size limits:

```text
UNCONFIRMED
```

---

# 58. Files — `evidence_links`

| Field            | Type        | Null | Meaning                 |
| ---------------- | ----------- | ---: | ----------------------- |
| `id`             | UUID        |   NO | Evidence relationship   |
| `file_id`        | UUID        |   NO | File                    |
| `subject_type`   | TEXT        |   NO | Entity type             |
| `subject_id`     | UUID        |   NO | Business entity         |
| `evidence_type`  | TEXT        |  YES | Evidence classification |
| `description`    | TEXT        |  YES | Description             |
| `linked_by`      | UUID        |   NO | Actor                   |
| `linked_at`      | TIMESTAMPTZ |   NO | Link                    |
| `removed_at`     | TIMESTAMPTZ |  YES | Logical removal         |
| `removal_reason` | TEXT        |  YES | Why invalidated/removed |

Controlled evidence should not be silently deleted.

---

# 59. Notifications — `notifications`

| Field               | Type        | Null | Meaning        |
| ------------------- | ----------- | ---: | -------------- |
| `id`                | UUID        |   NO | Notification   |
| `recipient_user_id` | UUID        |   NO | Recipient      |
| `notification_type` | TEXT        |   NO | Type           |
| `severity`          | TEXT        |   NO | Severity       |
| `title`             | TEXT        |   NO | Title          |
| `message`           | TEXT        |   NO | Message        |
| `subject_type`      | TEXT        |  YES | Related entity |
| `subject_id`        | UUID        |  YES | Related record |
| `dedupe_key`        | TEXT        |  YES | Deduplication  |
| `created_at`        | TIMESTAMPTZ |   NO | Created        |
| `read_at`           | TIMESTAMPTZ |  YES | Read           |

Notification content must not become source of business truth.

---

# 60. Notifications — `notification_deliveries`

| Field             | Type        | Null | Meaning          |
| ----------------- | ----------- | ---: | ---------------- |
| `id`              | UUID        |   NO | Delivery         |
| `notification_id` | UUID        |   NO | Notification     |
| `channel`         | TEXT        |   NO | IN_APP/EMAIL/etc |
| `state`           | TEXT        |   NO | Delivery state   |
| `attempt_count`   | INTEGER     |   NO | Attempts         |
| `last_attempt_at` | TIMESTAMPTZ |  YES | Last try         |
| `delivered_at`    | TIMESTAMPTZ |  YES | Success          |
| `error_code`      | TEXT        |  YES | Failure          |

---

# 61. Platform — `outbox_events`

| Field            | Type        | Null | Meaning             |
| ---------------- | ----------- | ---: | ------------------- |
| `id`             | UUID        |   NO | Outbox event        |
| `event_type`     | TEXT        |   NO | Canonical event     |
| `aggregate_type` | TEXT        |   NO | Source entity type  |
| `aggregate_id`   | UUID        |   NO | Source entity       |
| `payload`        | JSONB       |   NO | Event data          |
| `created_at`     | TIMESTAMPTZ |   NO | Created             |
| `available_at`   | TIMESTAMPTZ |   NO | Earliest processing |
| `processed_at`   | TIMESTAMPTZ |  YES | Completed           |
| `attempt_count`  | INTEGER     |   NO | Attempts            |
| `last_error`     | TEXT        |  YES | Last failure        |
| `dedupe_key`     | TEXT        |  YES | Idempotency/dedup   |

Business transaction writes outbox event atomically where required.

---

# 62. Reporting — `report_runs`

| Field           | Type        | Null | Meaning                  |
| --------------- | ----------- | ---: | ------------------------ |
| `id`            | UUID        |   NO | Report execution         |
| `report_id`     | TEXT        |   NO | Canonical report code    |
| `generated_by`  | UUID        |   NO | User                     |
| `generated_at`  | TIMESTAMPTZ |   NO | Generation time          |
| `format`        | TEXT        |   NO | SCREEN/CSV/XLSX/PDF      |
| `scope_context` | JSONB       |  YES | Authorization scope used |
| `filters`       | JSONB       |  YES | Applied filters          |
| `row_count`     | BIGINT      |  YES | Result size              |
| `state`         | TEXT        |   NO | Execution state          |
| `request_id`    | TEXT        |   NO | Correlation              |

Report filters must not store secrets.

---

# 63. Reporting — `report_artifacts`

Only if export retention is required.

| Field           | Type        | Null | Meaning          |
| --------------- | ----------- | ---: | ---------------- |
| `id`            | UUID        |   NO | Artifact         |
| `report_run_id` | UUID        |   NO | Source run       |
| `file_id`       | UUID        |   NO | Generated file   |
| `created_at`    | TIMESTAMPTZ |   NO | Created          |
| `expires_at`    | TIMESTAMPTZ |  YES | Retention expiry |

Retention:

```text
UNCONFIRMED
```

---

# 64. Backup — `backup_runs`

| Field                     | Type        | Null | Meaning                      |
| ------------------------- | ----------- | ---: | ---------------------------- |
| `id`                      | UUID        |   NO | Backup execution             |
| `state`                   | TEXT        |   NO | Backup lifecycle             |
| `requested_by`            | UUID        |  YES | Human actor                  |
| `requested_at`            | TIMESTAMPTZ |   NO | Requested                    |
| `started_at`              | TIMESTAMPTZ |  YES | Started                      |
| `artifact_created_at`     | TIMESTAMPTZ |  YES | Backup created               |
| `verified_at`             | TIMESTAMPTZ |  YES | Integrity verified           |
| `completed_at`            | TIMESTAMPTZ |  YES | Process completed            |
| `storage_reference`       | TEXT        |  YES | Protected artifact reference |
| `size_bytes`              | BIGINT      |  YES | Backup size                  |
| `checksum`                | TEXT        |  YES | Artifact checksum            |
| `database_schema_version` | TEXT        |  YES | Schema at backup             |
| `error_code`              | TEXT        |  YES | Stable error                 |
| `request_id`              | TEXT        |   NO | Correlation                  |

Never derive:

```text
restore proven
```

from `verified_at`.

---

# 65. Recovery — `restore_runs`

| Field                | Type        | Null | Meaning               |
| -------------------- | ----------- | ---: | --------------------- |
| `id`                 | UUID        |   NO | Restore operation     |
| `backup_run_id`      | UUID        |   NO | Source backup         |
| `restore_type`       | TEXT        |   NO | DRILL/PRODUCTION      |
| `state`              | TEXT        |   NO | Restore lifecycle     |
| `requested_by`       | UUID        |  YES | Requester             |
| `authorized_by`      | UUID        |  YES | Authorizer            |
| `requested_at`       | TIMESTAMPTZ |   NO | Requested             |
| `started_at`         | TIMESTAMPTZ |  YES | Started               |
| `verified_at`        | TIMESTAMPTZ |  YES | Verification          |
| `completed_at`       | TIMESTAMPTZ |  YES | Completed             |
| `target_environment` | TEXT        |   NO | Restore target        |
| `error_code`         | TEXT        |  YES | Failure               |
| `evidence`           | JSONB       |  YES | Verification evidence |
| `request_id`         | TEXT        |   NO | Correlation           |

Production restore authority:

```text
POLICY-DEPENDENT
DENY UNTIL APPROVED
```

---

# 66. AI — `ai_interactions`

| Field            | Type        | Null | Meaning                    | Rule     |
| ---------------- | ----------- | ---: | -------------------------- | -------- |
| `id`             | UUID        |   NO | AI invocation              | APPROVED |
| `actor_id`       | UUID        |   NO | Requesting user            | APPROVED |
| `feature`        | TEXT        |   NO | AI capability              | APPROVED |
| `subject_type`   | TEXT        |  YES | Related entity             | APPROVED |
| `subject_id`     | UUID        |  YES | Related record             | APPROVED |
| `model_provider` | TEXT        |   NO | Provider                   | APPROVED |
| `model_name`     | TEXT        |   NO | Model                      | APPROVED |
| `model_version`  | TEXT        |  YES | Version                    | APPROVED |
| `prompt_version` | TEXT        |  YES | Application prompt version | APPROVED |
| `started_at`     | TIMESTAMPTZ |   NO | Start                      | APPROVED |
| `completed_at`   | TIMESTAMPTZ |  YES | Completion                 | APPROVED |
| `state`          | TEXT        |   NO | Success/failure            | APPROVED |
| `schema_valid`   | BOOLEAN     |  YES | Structured output validity | APPROVED |
| `request_id`     | TEXT        |   NO | Correlation                | APPROVED |

Full prompt and full model output persistence:

```text
UNCONFIRMED
```

Default:

> Do not persist sensitive prompt/output content unless required.

---

# 67. Snapshot Contract — Receiving Snapshot

A Receiving snapshot used inside Inspection should contain only historically necessary context.

Recommended contract:

```text
receiving_id
receiving_no
doc_no
item_code
description
lot
qty
receiving_date
expiry_date
source_version
captured_at
```

Do not snapshot unrelated fields.

---

# 68. Snapshot Contract — Inspection Template

Recommended:

```text
template_id
template_code
template_version_id
version_no
sections
points
requirements
units
acceptance rules
controlled source references
content_hash
captured_at
```

---

# 69. Snapshot Contract — Lab Test Template

Recommended:

```text
test_template_id
test_code
template_version_id
version_no
parameters
units
scientific rules
method reference
controlled source references
content_hash
captured_at
```

---

# 70. Snapshot Contract — Equipment

Recommended:

```text
equipment_id
equipment_no
name
manufacturer
model
serial_no
state_at_use
captured_at
```

Only include fields needed for historical traceability.

---

# 71. Snapshot Contract — Calibration

Recommended:

```text
calibration_record_id
calibration_no
equipment_id
calibration_date
due_date
state_at_use
result
certificate_no where relevant
captured_at
```

Do not calculate historical validity later using current calibration record.

---

# 72. Snapshot Contract — Controlled Document

Recommended:

```text
document_id
document_no
document_version_id
revision
title
state_at_use
effective_at
content_hash
captured_at
```

---

# 73. Snapshot Canonicalization

Before calculating:

```text
snapshot_hash
```

serialization must be deterministic.

Requirements:

```text
Stable field ordering
Stable number representation
Stable date/time representation
No transient fields
No random metadata
Explicit schema version
```

Exact canonicalization algorithm belongs in Architecture implementation.

---

# 74. Enumeration — Receiving Workflow

Approved foundation values:

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

`CANCELLED` and some transitions remain policy-dependent.

---

# 75. Enumeration — Inspection Result

```text
NOT_STARTED
IN_PROGRESS
PASS
FAIL
HOLD
```

---

# 76. Enumeration — Release System

Physical type preferred:

```text
BOOLEAN
```

Semantics:

```text
FALSE = not released in system
TRUE = released in system
```

Do not use it as inspection result.

---

# 77. Enumeration — Inspection Workflow

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

# 78. Enumeration — Laboratory Workflow

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

# 79. Enumeration — Laboratory Scientific Result

Confirmed:

```text
PASS
FAIL
HOLD
```

Potential:

```text
INCONCLUSIVE
```

is:

```text
UNCONFIRMED
```

---

# 80. Enumeration — Equipment State

```text
DRAFT
ACTIVE
OUT_OF_SERVICE
UNDER_MAINTENANCE
DECOMMISSIONED
```

Potential `QUARANTINED` remains unconfirmed.

---

# 81. Enumeration — Calibration State

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

Whether `APPROVED` and `CURRENT` remain separate:

```text
UNCONFIRMED
```

---

# 82. Enumeration — Document State

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

---

# 83. Enumeration — Change Request State

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

# 84. Enumeration — Approval Decision

```text
APPROVE
REJECT
RETURN
```

Additional workflow-specific decisions require explicit approval.

---

# 85. Enumeration — Account State

Foundation candidate:

```text
ACTIVE
INACTIVE
LOCKED
DISABLED
```

Exact distinction between `INACTIVE` and `DISABLED` should be clarified before migration if both are retained.

---

# 86. Field Editability Rules

### System-only Fields

Examples:

```text
id
created_at
updated_at
version
approved_at
released_at
snapshot_hash
```

Client cannot authoritatively set them.

### Draft-editable Fields

Business input fields while record is editable.

### Controlled Fields

Require transition, correction, or Change Request.

### Immutable Fields

Historical evidence after controlled transition.

---

# 87. Client-Authoritative Prohibition

Client must not be authoritative for:

```text
actor_id
created_at
approved_at
released_at
state
record version after mutation
authorization scope
approval identity
signature identity
snapshot hash
audit event
```

Client may send:

```text
expected_version
action intent
business input values
reason
```

---

# 88. Business ID Fields

The following are generated/controlled by system:

```text
task_no
finding_no
ncr_no
capa_no
receiving_no
inspection_no
lab_test_no
equipment_no where configured
calibration_no
maintenance_no
change_no
```

Exact formatting belongs in numbering policy.

---

# 89. Business ID Immutability

Once a controlled Business ID is assigned:

```text
NORMAL EDIT = DENY
```

Correction only if explicit numbering error policy exists.

---

# 90. Indexing Baseline

Always evaluate indexes on:

```text
FK columns
business IDs
state
assignee/owner
common date filters
item_code
lot
doc_no
request_id
subject_type + subject_id
```

Do not create every possible composite index before query evidence exists.

---

# 91. Unique Constraints Baseline

Expected unique values:

```text
roles.code
permissions.code
receiving_items.receiving_no
inspection_reports.inspection_no
lab_tests.lab_test_no
equipment.equipment_no
calibration_records.calibration_no
maintenance_records.maintenance_no
document_identities.document_no
change_requests.change_no
```

Template/document version combinations must also be unique.

---

# 92. Foreign-Key Delete Policy

Controlled core records:

```text
ON DELETE RESTRICT
```

preferred.

Avoid:

```text
ON DELETE CASCADE
```

for:

```text
Audit
Approval decisions
E-signatures
Controlled snapshots
Lab results
Inspection reports
Calibration history
Document versions
```

---

# 93. Validation Ownership

Validation should exist at multiple layers.

### UI

Early feedback.

### Application

Business validation.

### Domain

Invariant enforcement.

### Database

Structural constraints.

No layer replaces the others.

---

# 94. Scientific Field Rule

Any field containing:

```text
limit
tolerance
acceptance criterion
formula
temperature range
humidity range
sample count
measurement precision
calibration interval
```

must identify approved source.

No:

```text
reasonable default
industry standard assumed by developer
AI-generated value
```

---

# 95. Required Field Rule

A column should not become `NOT NULL` simply because the UI currently shows it.

`NOT NULL` means:

> This fact is structurally required for every persisted record in that lifecycle.

Draft records may intentionally allow incomplete business data.

This may require:

* nullable draft fields plus submit validation, or
* draft-specific child structure.

---

# 96. State-Dependent Required Fields

Examples:

An Inspection Draft may temporarily lack:

```text
final_result
approved_at
```

But `APPROVED` requires final controlled values.

Such rules belong in:

```text
Domain validation
State transitions
Database constraints where feasible
```

---

# 97. Sensitive Field Rule

Never expose through generic serializers:

```text
password_hash
session_token_hash
security metadata
internal error payload
sensitive audit fields
backup storage credentials
```

---

# 98. Report Data Rule

Report/export column definitions should use canonical Data Dictionary meanings.

Example:

```text
Receiving Date
```

must always represent:

```text
receiving_items.receiving_date
```

unless report explicitly documents another meaning.

---

# 99. Search Field Rule

Searchable fields should have canonical meaning and authorization scope.

Examples:

```text
doc_no
item_code
description
lot
receiving_no
inspection_no
lab_test_no
ncr_no
document_no
equipment_no
```

---

# 100. Data Dictionary vs Snapshot

Data Dictionary defines normalized fields.

Snapshot contracts define frozen historical representation.

A snapshot key does not automatically become a first-class current database column.

---

# 101. Data Dictionary vs API

API names should generally align with canonical field names unless API transformation is intentional and documented.

Avoid:

```text
DB: receiving_date
API: dateReceived
UI: inwardDate
Report: GRN Date
```

without explicit semantic mapping.

---

# 102. Data Dictionary vs UI Labels

UI can use friendlier labels.

Example:

```text
DB:
release_system

UI:
Release System
```

But semantic meaning remains canonical.

---

# 103. Data Dictionary vs External Focus System

`release_system` currently represents system release fact.

If Focus System becomes integrated externally, define separately:

```text
local release decision
external Focus sync status
Focus transaction result
Focus reference
```

Do not overload one boolean.

This is a future integration decision.

---

# 104. Potential Future Focus Integration Fields

Do not migrate yet.

Potential:

```text
external_release_state
external_release_reference
external_release_requested_at
external_release_confirmed_at
external_release_error
```

Status:

```text
UNCONFIRMED
```

---

# 105. Product Master Fields

Not yet approved.

Do not create `products` purely because `item_code` exists.

Potential future fields:

```text
product_id
item_code
official_description
specification_version
active
```

remain outside current Foundation schema.

---

# 106. Organizational Fields

Do not add everywhere yet:

```text
site_id
department_id
team_id
```

until organizational model is approved.

Schema should remain extendable.

---

# 107. Multi-Tenant Fields

Do not add:

```text
tenant_id
organization_id
```

to every table.

Current system is single-organization.

---

# 108. Data Retention Fields

Fields such as:

```text
expires_at
purge_at
retention_class
```

should only be added where approved retention architecture needs them.

Controlled business data currently defaults to preservation.

---

# 109. Draft Deletion Fields

If logical draft deletion becomes required, candidate fields:

```text
deleted_at
deleted_by
delete_reason
```

But:

```text
UNCONFIRMED
```

Do not scatter soft-delete fields across all tables automatically.

---

# 110. Idempotency Data

Potential table remains architecture-dependent:

```text
idempotent_commands
```

Candidate fields:

```text
id
idempotency_key
actor_id
action
subject_type
subject_id
subject_version
created_at
completed_at
result_reference
```

Do not migrate until API command strategy is chosen.

---

# 111. Data Quality: Empty Values

For canonical text:

```text
NULL
```

means missing/not applicable.

Avoid equivalent values:

```text
""
"-"
"N/A"
"none"
```

unless they are actual business values.

Trim user-entered identifiers.

---

# 112. Case Normalization

Identifiers like:

```text
item_code
document_no
equipment_no
permission code
role code
```

should have a defined case policy.

Recommended technical canonicalization:

```text
uppercase stable business/system codes
```

but item code formatting may come from external systems and therefore:

```text
BUSINESS-DEPENDENT
```

---

# 113. Lot / Batch Field

`lot` is `TEXT`, not numeric.

Reason:

Lot values may contain:

```text
letters
hyphens
leading zeros
mixed formats
```

Never convert to integer.

---

# 114. Document Number Field

`doc_no` is `TEXT`.

Never numeric.

Leading zeros and mixed formatting must be preserved.

---

# 115. Item Code Field

`item_code` is `TEXT`.

Never assume numeric.

---

# 116. Quantity Rule

Quantity uses exact numeric storage where needed.

Do not use binary floating point for controlled quantity calculations.

Exact precision:

```text
UNCONFIRMED
```

---

# 117. Dates Rule

`receiving_date`, `expiry_date`, `calibration_date`:

```text
DATE
```

when time-of-day has no business meaning.

Workflow events:

```text
TIMESTAMPTZ
```

---

# 118. Time Zone Rule

Database events are stored in UTC-compatible `TIMESTAMPTZ`.

Application display defaults to:

```text
Asia/Riyadh
```

unless configuration changes.

---

# 119. Historical Identity Rule

Historical business records reference:

```text
user_id
```

even after account is deactivated.

No cascade deletion.

---

# 120. Approval Shortcut Fields

Fields like:

```text
approved_by
approved_at
```

may exist for query convenience.

But authoritative historical sequence is:

```text
approval_decisions
audit_events
electronic_signatures where required
```

---

# 121. State History Rule

Do not add:

```text
previous_state
```

as the only history mechanism.

Current table stores current state.

Audit/event history stores transitions.

---

# 122. Audit Payload Contract

Audit `payload` should be structured.

Recommended shape:

```text
schema_version
changed_fields
before
after
context
```

Do not store whole arbitrary entity snapshots for every small mutation.

---

# 123. Audit Sensitivity

Audit must not accidentally persist:

```text
passwords
session tokens
secret keys
raw authentication credentials
```

Redaction is mandatory.

---

# 124. E-Signature Data Integrity

An E-signature row becomes immutable once created.

Any invalidation must be represented by a separate controlled event, never updating the historical signature to another meaning.

---

# 125. File Integrity

`sha256` is mandatory for evidence file identity/integrity.

Changing file binary requires new file record/hash.

---

# 126. File Security Decisions Pending

Need later approval for:

```text
Allowed MIME types
Maximum file size
Malware scanning
Archive formats
Image formats
Document formats
Retention
```

---

# 127. Report Artifact Security

Generated XLSX/PDF/CSV containing controlled data must inherit source authorization.

A file URL alone must not become authorization.

---

# 128. CSV/XLSX Safety

Export generation must protect against spreadsheet formula injection for user-controlled strings.

Technical sanitization belongs in Reporting implementation.

---

# 129. Backup Metadata Sensitivity

`storage_reference` must not contain credentials.

It may contain protected object identifier/location.

Backup download access is high risk.

---

# 130. AI Data Rule

AI interaction metadata should be sufficient to answer:

```text
Who invoked AI?
For which feature?
On what authorized subject?
Using which model/prompt version?
Did structured validation pass?
```

without necessarily storing full business content.

---

# 131. Data Dictionary Unconfirmed Register

| ID     | Decision                                                |
| ------ | ------------------------------------------------------- |
| DD-001 | Exact `login_identity` format                           |
| DD-002 | Whether email is mandatory                              |
| DD-003 | Organizational unit model                               |
| DD-004 | User multi-role policy                                  |
| DD-005 | Direct user permission override requirement             |
| DD-006 | Task priority canonical values                          |
| DD-007 | Finding severity classification                         |
| DD-008 | NCR/RCA numbering policy                                |
| DD-009 | CAPA effectiveness default/policy                       |
| DD-010 | Receiving quantity precision                            |
| DD-011 | Receiving duplicate definition                          |
| DD-012 | Receiving expiry exception semantics                    |
| DD-013 | Inspection template revision datatype                   |
| DD-014 | Inspection parameter physical typed-storage constraints |
| DD-015 | Scientific units and acceptance rules                   |
| DD-016 | Lab measurement precision                               |
| DD-017 | Lab `INCONCLUSIVE` result                               |
| DD-018 | Retest request entity                                   |
| DD-019 | Maximum Retest count                                    |
| DD-020 | Equipment mandatory master fields                       |
| DD-021 | Equipment location model                                |
| DD-022 | Calibration interval source                             |
| DD-023 | Calibration APPROVED vs CURRENT split                   |
| DD-024 | Calibration provider/certificate mandatory rules        |
| DD-025 | Maintenance performer model                             |
| DD-026 | Document revision datatype                              |
| DD-027 | Document Effective Date rules                           |
| DD-028 | Document acknowledgement requirement                    |
| DD-029 | Approval workflow configuration model                   |
| DD-030 | Reviewer + Approver combination                         |
| DD-031 | E-Signature mandatory actions                           |
| DD-032 | Audit cryptographic chaining                            |
| DD-033 | Evidence file size/MIME policy                          |
| DD-034 | Report retention                                        |
| DD-035 | Backup retention                                        |
| DD-036 | AI prompt/response retention                            |
| DD-037 | External Focus integration model                        |
| DD-038 | Product Master domain                                   |
| DD-039 | Draft hard-delete policy                                |
| DD-040 | Idempotency table implementation                        |

---

# 132. Do Not Migrate Register

The following should not become physical production schema until resolved:

```text
organizational_units
user_scope_assignments
products
product_specifications
retest_requests
document_acknowledgements
complex workflow designer tables
generic reference-data engine
AI evaluation tables
external Focus integration tables
idempotency table
```

unless the implementation phase has an approved requirement.

---

# 133. Minimum Migration-Safe Entities

The following are currently strong Foundation candidates:

```text
users
sessions

roles
permissions
role_permissions
user_roles

tasks
task_assignments
task_checklist_items
task_comments

findings
ncrs
rcas
capas
capa_actions

receiving_items

inspection_templates
inspection_template_versions
inspection_template_sections
inspection_template_points
inspection_reports
inspection_report_results
inspection_report_snapshots

lab_test_templates
lab_test_template_versions
lab_test_template_parameters
lab_tests
lab_samples
lab_measurements
lab_equipment_usage
lab_document_usage
lab_test_snapshots

equipment
calibration_records
maintenance_records

document_identities
document_versions
document_version_files

approval_cases
approval_work_items
approval_decisions
electronic_signatures

change_requests
change_request_changes
change_application_attempts

audit_events

files
evidence_links

notifications
notification_deliveries
outbox_events

report_runs

backup_runs
restore_runs

ai_interactions
```

Even these should be introduced according to build phase rather than all in migration `001`.

---

# 134. Migration Precondition

Before converting any Dictionary section into SQL:

verify:

```text
Field is required by an approved requirement
Meaning is unambiguous
Owner Domain is known
Lifecycle is known
State interactions are known
Scientific source is known where needed
Nullability is justified
Historical behavior is known
Delete behavior is known
Audit significance is known
```

---

# 135. Column Naming Convention

Recommended PostgreSQL naming:

```text
snake_case
```

Examples:

```text
receiving_item_id
submitted_at
created_by
release_system
scientific_result
```

No mixed:

```text
camelCase
PascalCase
spaces
```

inside database identifiers.

---

# 136. Table Naming Convention

Plural nouns:

```text
receiving_items
inspection_reports
lab_tests
audit_events
```

Join/history tables use explicit meaning.

---

# 137. FK Naming Convention

Use:

```text
{entity}_id
```

Examples:

```text
user_id
equipment_id
template_version_id
receiving_item_id
```

---

# 138. Timestamp Naming Convention

Events:

```text
submitted_at
approved_at
released_at
voided_at
```

Avoid:

```text
submit_date
approved_timestamp
date_approved
```

inconsistent styles.

---

# 139. Actor Naming Convention

Use:

```text
created_by
updated_by
approved_by
released_by
requested_by
assigned_by
```

when actor shortcut is required.

---

# 140. Boolean Naming Convention

Booleans describe a fact.

Examples:

```text
active
required
must_change_password
schema_valid
```

Avoid boolean lifecycle explosions like:

```text
is_draft
is_submitted
is_approved
is_closed
```

Use state instead.

---

# 141. Derived Data Rule

Derived facts should be computed unless persistence gives a justified benefit.

Examples:

```text
is_overdue
days_remaining
age_days
```

should normally be derived.

---

# 142. Current Status vs Derived Flag

Example Equipment:

```text
state = ACTIVE
```

and Calibration:

```text
state = OVERDUE
```

may coexist.

Do not generate:

```text
equipment.state = ACTIVE_BUT_CALIBRATION_OVERDUE
```

---

# 143. Controlled Result Rule

Inspection/Lab results must distinguish:

```text
raw observation
calculated value
scientific outcome
workflow state
```

These are not the same field.

---

# 144. Sample Data Rule

Sample identifiers must not be auto-renumbered after controlled execution.

If sample order changes during Draft, internal technical IDs still remain stable.

---

# 145. Historical Lot Rule

Lot recorded on Receiving remains historical even if Product Master later changes.

No retroactive rewrite.

---

# 146. Description Historical Rule

`receiving_items.description` represents description at receiving time.

A future Product Master change should not overwrite it.

---

# 147. Controlled Criteria Historical Rule

A test/report must retain the criteria actually used.

Do not recalculate historical PASS/FAIL automatically using a new specification revision.

---

# 148. Calculation Reproducibility

When automatic scientific calculations are introduced, the Data Dictionary must later expand each calculated field with:

```text
Formula ID
Formula Version
Input fields
Precision
Rounding rule
Unit conversion rule
Controlled source
```

No calculation should be considered production-ready before these exist.

---

# 149. Rounding

Scientific rounding is:

```text
SOURCE-DEPENDENT
```

Never use arbitrary:

```text
round(value, 2)
```

without approved requirement.

---

# 150. Numeric Comparison

Acceptance decisions must consider approved:

```text
precision
rounding
inclusive/exclusive boundaries
unit
```

before implementation.

---

# 151. Snapshot Schema Version

Every snapshot payload should include:

```text
snapshot_schema_version
```

or equivalent.

This allows later application versions to interpret historical JSON correctly.

---

# 152. Outbox Payload Version

Outbox payload should include event schema version.

Example:

```text
event_type
event_version
payload
```

to protect future consumers.

---

# 153. Canonical Entity Type Registry

Shared polymorphic capabilities must use canonical entity identifiers.

Example:

```text
TASK
FINDING
NCR
CAPA
RECEIVING_ITEM
INSPECTION_REPORT
LAB_TEST
EQUIPMENT
CALIBRATION_RECORD
DOCUMENT_VERSION
CHANGE_REQUEST
```

No arbitrary client-created `subject_type`.

---

# 154. Request Correlation

`request_id` should be stored for critical operations in:

```text
audit_events
approval_decisions
electronic_signatures
change_application_attempts
report_runs
backup_runs
restore_runs
ai_interactions
```

where applicable.

---

# 155. Record Version Exposure

API may return:

```text
version
```

to authorized client.

Client returns:

```text
expected_version
```

for mutation.

Server controls new version.

---

# 156. Audit on Version Conflict

A normal stale-version conflict does not necessarily require business audit event.

It should be logged/observed appropriately.

Repeated suspicious conflicts may be security-observable.

---

# 157. Current Reviewer / Approver Shortcut

Fields like:

```text
inspection_reports.reviewer_id
inspection_reports.approver_id
```

are optional convenience denormalization.

Because shared Approval tables already own history, these fields should only be added if query/performance/UX needs justify them.

Current decision:

```text
DO NOT REQUIRE IN FIRST MIGRATION
```

---

# 158. Document Current Version Shortcut

`document_identities.current_effective_version_id` could improve reads.

However, it creates bidirectional relationship complexity.

Recommendation:

```text
OPTIONAL — ADD ONLY IF QUERY MODEL NEEDS IT
```

If added, update transactionally during supersession.

---

# 159. Equipment Current Calibration Shortcut

`equipment.current_calibration_id` is recommended only if the concept of `CURRENT` calibration is approved.

Until DD-023 is resolved:

```text
POLICY-DEPENDENT
```

---

# 160. Receiving Current Inspection Shortcut

Do not add:

```text
current_inspection_report_id
```

until reinspection/replacement rules are approved.

Canonical relationship remains:

```text
receiving_item
1 → N inspection_reports
```

---

# 161. Unique Current Effective Document

If policy confirms one current effective revision:

PostgreSQL should enforce as closely as possible, potentially through:

```text
partial unique index
```

rather than relying solely on application code.

---

# 162. Unique Current Calibration

If policy confirms one `CURRENT` calibration per equipment:

use appropriate DB enforcement.

Do not leave it purely convention-based.

---

# 163. Retest Sequence Uniqueness

If Retest model is approved:

recommended:

```text
UNIQUE(original_test_id, retest_sequence)
```

for retests.

Original row handling must be carefully defined.

---

# 164. Template Parameter Codes

Within a template version:

```text
parameter_code
```

should be unique.

Likewise Inspection:

```text
point_code
```

should be unique within relevant template version.

---

# 165. Position Fields

`position` values control ordering only.

They are not identity.

Reordering Draft template points should not change their UUID.

---

# 166. Controlled Template Changes

Once Template Version is approved/effective:

child records:

```text
sections
points
parameters
criteria
```

must not be freely edited.

New revision required.

---

# 167. File Replacement

Replacing a controlled document file:

```text
new file row
new hash
new document version or controlled correction
```

not overwrite object behind same `storage_key`.

---

# 168. Audit No Cascade

Database design must explicitly verify:

```text
Deleting/deactivating user
Voiding business record
Archiving document
```

cannot cascade-delete audit events.

---

# 169. Approval No Cascade

Approval decisions and E-signatures must survive target record archival/void.

---

# 170. Evidence No Cascade

Controlled evidence metadata should survive subject state changes.

---

# 171. Security Event Fields

Future dedicated security-event store may include:

```text
event_type
actor_id
ip metadata
user agent
occurred_at
request_id
outcome
```

But application/security logging architecture is outside current Business Data Dictionary.

---

# 172. Health Data

System Health should preferably be live/observability data rather than persisted Business tables.

Do not create:

```text
system_health_status
```

as business truth unless operational requirement appears.

---

# 173. Search Data

Search indexes/projections are derived.

Do not treat search rows as source of truth.

---

# 174. Dashboard Data

Dashboard metrics are derived.

No core table:

```text
dashboard_numbers
```

without performance requirement and reconciliation mechanism.

---

# 175. Report Numbers

Report `row_count` is metadata of generated result.

It is not an operational KPI source.

---

# 176. Backup State Integrity

Fields must allow distinction:

```text
artifact created
checksum verified
restore tested
```

Never compress these to:

```text
success BOOLEAN
```

---

# 177. Change Request Values

`current_value` and `proposed_value` using JSONB are acceptable because:

* target types differ.
* values may be scalar/structured.
* history matters.

But `field_path` must be controlled, not arbitrary unrestricted DB path.

---

# 178. Polymorphic Relationship Safety

Shared tables may use:

```text
subject_type
subject_id
```

only if:

```text
subject_type canonical
authorization resolved through owning domain
client cannot spoof ownership
tests cover invalid references
```

---

# 179. Data Dictionary Test Contract

Each migrated table should eventually have tests for:

```text
Required columns
Nullability
Defaults
PK
FK
Unique constraints
Check constraints
Controlled state values
Version behavior
Deletion behavior
Historical preservation
```

---

# 180. Scientific Data Test Contract

For each scientific parameter:

```text
Type
Precision
Unit
Validation
Acceptance rule
Controlled source
Boundary behavior
Rounding
```

must have explicit tests.

Until then:

> Scientific workflow is not fully specified.

---

# 181. Data Dictionary Completion Rule

A Domain is ready for physical migration only when:

```text
Required fields identified
Types justified
Nullability justified
Enums/states confirmed
Relationships confirmed
Deletion policy confirmed
Audit significance confirmed
Controlled snapshots defined
Unconfirmed schema-blocking decisions resolved
```

---

# 182. Foundation Relationship

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

# 183. Final Data Dictionary Principle

Before adding any database column, answer:

```text
What business fact does this field represent?

Which Domain owns it?

Who provides its value?

Is it user-entered or system-generated?

What PostgreSQL type preserves its meaning correctly?

Can it be NULL?

Can it change?

Until which lifecycle state?

Does a historical record need its old value?

Does changing it require audit?

Does changing it require approval?

Is it scientific?

If scientific, what approved source defines it?

Does it belong in normalized current data or a historical snapshot?

Can PostgreSQL enforce any invariant safely?
```

إذا لم توجد إجابات واضحة:

> **The field is not ready for migration.**

---

# 184. Document Status

```text
Document:
DATA-DICTIONARY.md

Version:
1.0

Product:
QC Operations & Laboratory Management System

Database:
PostgreSQL

Primary Keys:
UUID

Time:
TIMESTAMPTZ / UTC

Business Dates:
DATE

Precise Numbers:
NUMERIC(p,s)

Concurrency:
BIGINT version

Current Business Data:
Normalized

Historical Controlled Context:
Immutable Snapshots

Scientific Fields:
SOURCE-DEPENDENT — DO NOT INVENT

Unknown Schema Decisions:
DO NOT MIGRATE UNTIL APPROVED

Controlled History:
No destructive cascade

Audit:
Independent historical capability

Files:
Metadata in PostgreSQL
Binary in Object Storage

Status:
FOUNDATION — APPROVED CANONICAL DATA DICTIONARY

Next Foundation Document:
REQUIREMENTS-TRACEABILITY.md
```
