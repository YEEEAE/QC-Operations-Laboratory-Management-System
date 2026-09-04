# DATA-MODEL.md

# QC Operations & Laboratory Management System

## Logical PostgreSQL Data Model — v1.0

---

# 1. Purpose

هذه الوثيقة تحدد الـLogical Data Model الرسمي لنظام:

> **QC Operations & Laboratory Management System**

وهي تحدد:

* الـEntities الرئيسية.
* Domain ownership.
* Primary Keys / Foreign Keys المنطقية.
* العلاقات بين السجلات.
* Versioning.
* Historical snapshots.
* Controlled-record integrity.
* Audit relationships.
* Evidence relationships.
* Concurrency requirements.
* Uniqueness principles.
* Transaction boundaries.
* Retention assumptions.
* ما يجب أن يكون Normalized.
* وما يجب تجميده تاريخيًا.

هذه الوثيقة:

> **ليست PostgreSQL migration نهائية.**

ولا تحتوي SQL schema نهائيًا.

التفصيل النهائي للحقول والأنواع والـvalidation سيكون في:

```text
DATA-DICTIONARY.md
```

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

لا يتم إنشاء Table أو Relationship يناقض الوثائق الأعلى.

---

# 3. Database

قاعدة البيانات الرسمية:

> **PostgreSQL**

من أول يوم.

لا يوجد SQLite compatibility requirement.

---

# 4. Modeling Philosophy

القاعدة:

> **Normalize current business truth. Snapshot historical controlled truth.**

يعني:

### Current Master Data

تبقى Normalized.

مثل:

```text
Equipment
Current Calibration
Current Document Version
User
Template
```

### Historical Controlled Context

يتم تجميده عند الحاجة.

مثل:

```text
Inspection approved using Template V4
Lab Test executed using WI Rev 7
Equipment calibration status at execution time
Acceptance criteria used at approval time
```

---

# 5. Technical Identifier Strategy

كل Business Entity مهم يستخدم:

```text
UUID
```

كـPrimary Key تقني.

مثال:

```text
id UUID PRIMARY KEY
```

ولا نكشف اعتماد النظام على sequential integer IDs.

---

# 6. Human-Readable Business Identifiers

بعض السجلات تحتاج Business Number منفصل.

مثل:

```text
RCV-2026-000124
IR-2026-000088
LAB-2026-001294
NCR-2026-0031
CAPA-2026-0018
```

هذا الرقم:

```text
UNIQUE
```

ضمن Scope محدد.

لكنه ليس Technical PK.

---

# 7. Business Number Generation

Exact generation strategy تحدد لاحقًا في:

```text
DATABASE-ARCHITECTURE.md
```

لكن يجب أن تحقق:

```text
Concurrency-safe
Unique
Transactional
Non-duplicating
Human-readable
```

ولا تعتمد على:

```text
SELECT MAX(number) + 1
```

بدون concurrency protection.

---

# 8. Timestamp Strategy

كل timestamps الرسمية تستخدم:

```text
TIMESTAMPTZ
```

ويتم التعامل معها داخليًا كـUTC.

العرض:

```text
Asia/Riyadh
```

حسب operational timezone.

---

# 9. Standard Metadata

معظم Business Entities المهمة تحتاج:

```text
id
created_at
created_by
updated_at
updated_by
version
```

حيث يكون:

```text
version
```

لـOptimistic Concurrency.

---

# 10. Trusted Timestamps

القيم مثل:

```text
created_at
submitted_at
approved_at
released_at
closed_at
voided_at
```

يحددها Server/Database.

ولا يقبل Browser كـtrusted source لها.

---

# 11. Record Versioning

السجلات المهمة تستخدم:

```text
version BIGINT
```

أو equivalent.

تبدأ مثلًا:

```text
1
```

وتتغير عند mutations المهمة.

---

# 12. Concurrency Contract

Update حساس يعمل conceptually:

```text
UPDATE ...
WHERE id = :id
AND version = :expected_version
```

إذا:

```text
rows affected = 0
```

يتم التعامل معه كـ:

```text
STALE_RECORD
```

وليس overwrite.

---

# 13. Deletion Philosophy

لا يوجد:

```text
delete everything
```

كنمط طبيعي.

نفصل بين:

```text
Draft deletion
Archive
Void
Supersede
Deactivate
Decommission
```

---

# 14. Controlled Records

السجلات التالية لا تستخدم hard delete بعد دخول controlled lifecycle:

```text
Inspection Reports
Lab Tests
Approved Documents
NCR
CAPA
Calibration Records
Approval Decisions
E-Signatures
Audit Events
Controlled Change Requests
```

---

# 15. Draft Hard Delete

Hard delete لـDRAFT:

```text
POLICY-DEPENDENT
```

ولا تنشأ ON DELETE CASCADE واسعة قبل اعتماد السياسة.

---

# 16. Foreign-Key Delete Principle

الـdefault:

```text
ON DELETE RESTRICT
```

للسجلات التجارية Controlled.

استخدام:

```text
ON DELETE CASCADE
```

يقتصر مستقبلًا على child records التي:

* ليس لها معنى مستقل.
* ليست historical evidence.
* ولا يؤدي حذفها لفقدان Audit/Approval history.

---

# 17. User Records Are Deactivated

User لا يحذف إذا له history.

يستخدم:

```text
account_state
```

مثل:

```text
ACTIVE
INACTIVE
LOCKED
DISABLED
```

والـhistorical FKs تبقى.

---

# 18. Domain Ownership Overview

| Entity Area                        | Owner                          |
| ---------------------------------- | ------------------------------ |
| Users / Sessions                   | Identity                       |
| Roles / Permissions                | Authorization / Administration |
| Tasks                              | Tasks                          |
| Findings / NCR / RCA / CAPA        | Quality                        |
| Receiving Items                    | Quarantine                     |
| Inspection Templates/Reports       | Quarantine / Inspection        |
| Lab Tests / Samples / Measurements | Laboratory                     |
| Equipment                          | Equipment                      |
| Calibration                        | Equipment / Calibration        |
| Maintenance                        | Equipment                      |
| Documents / Versions               | Controlled Documents           |
| Reviews / Approvals                | Approval Infrastructure        |
| E-Signatures                       | E-Signature Infrastructure     |
| Change Requests                    | Change Requests                |
| Audit Events                       | Audit                          |
| Files                              | Files & Evidence               |
| Notifications                      | Notifications                  |
| Report Runs                        | Reporting                      |
| Backup / Restore Metadata          | Backup & Recovery              |
| AI Interaction Metadata            | AI Advisory                    |

---

# 19. Identity Data Model

Foundation entities:

```text
users
sessions
password_reset_requests
```

---

# 20. users

Represents:

> Human system identity.

Logical fields:

```text
id
username / login identity
email where required
display_name
password_hash
account_state
must_change_password
last_login_at
created_at
created_by
updated_at
updated_by
version
```

Exact username/email policy:

```text
UNCONFIRMED
```

---

# 21. sessions

Represents server-side authenticated sessions.

Logical fields:

```text
id
user_id
session_token_hash
created_at
last_seen_at
expires_at
revoked_at
revoked_reason
request/security metadata where appropriate
```

Do not store plaintext reusable session secrets.

---

# 22. password_reset_requests

Logical fields:

```text
id
user_id
created_by
created_at
expires_at
used_at
revoked_at
reset_method
```

Sensitive tokens stored hashed if token-based reset is used.

---

# 23. Role Data Model

Foundation entities:

```text
roles
permissions
role_permissions
user_roles
```

Potential:

```text
user_permission_overrides
```

only if actually required.

---

# 24. roles

Initial canonical roles:

```text
EMPLOYEE
SUPERVISOR
MANAGER
ADMIN
```

Logical fields:

```text
id
code
name
description
is_system_role
active
created_at
updated_at
```

---

# 25. permissions

Canonical Permission Registry persistence if DB-managed permissions are adopted.

Logical:

```text
id
code
domain
action
description
risk_level
active
```

Examples:

```text
PERM-INSP-APPROVE
PERM-LAB-REVIEW
PERM-QUAR-RELEASE
```

Code registry vs database registry must remain synchronized.

---

# 26. role_permissions

Bridge:

```text
role_id
permission_id
granted_at
granted_by
```

Unique:

```text
(role_id, permission_id)
```

---

# 27. user_roles

Allows explicit role assignment.

Logical:

```text
id
user_id
role_id
valid_from
valid_until
assigned_by
assigned_at
revoked_at
revoked_by
reason
```

Historical assignments should remain auditable.

---

# 28. Organizational Scope Model

Permission scopes may eventually require:

```text
Site
Department
Team
Lab
QC Area
```

Exact company hierarchy:

```text
UNCONFIRMED
```

Therefore no rigid multi-level organization hierarchy should be migrated until approved.

---

# 29. Proposed Scope Foundation

Preferred logical abstraction:

```text
organizational_units
user_scope_assignments
```

but:

> **DO NOT MIGRATE UNTIL ORGANIZATIONAL MODEL IS CONFIRMED.**

---

# 30. organizational_units

Potential:

```text
id
unit_type
code
name
parent_unit_id
active
```

Possible `unit_type`:

```text
SITE
DEPARTMENT
TEAM
LAB
QC_AREA
```

Final values unconfirmed.

---

# 31. user_scope_assignments

Potential logical fields:

```text
id
user_id
scope_type
organizational_unit_id
domain
valid_from
valid_until
assigned_by
```

Final physical design depends on Permission architecture.

---

# 32. Tasks Data Model

Foundation entities:

```text
tasks
task_assignments
task_checklist_items
task_comments
task_dependencies
task_recurrence_rules
```

Evidence handled through shared Evidence capability.

---

# 33. tasks

Owns current Task state.

Logical:

```text
id
task_no
title
description
priority
state
due_at
current_assignee_id
created_by
created_at
updated_by
updated_at
completed_at
version
```

Potential:

```text
related_domain
related_record_id
```

requires careful cross-domain reference design.

---

# 34. task_assignments

Historical assignment tracking.

```text
id
task_id
assignee_id
assigned_by
assigned_at
unassigned_at
reason
```

Current assignee may also be cached in `tasks.current_assignee_id`.

Assignment history remains authoritative for traceability.

---

# 35. task_checklist_items

```text
id
task_id
text
required
position
completed
completed_by
completed_at
created_at
version
```

---

# 36. task_comments

```text
id
task_id
author_id
body
created_at
edited_at
```

Editing policy should preserve history if comments become controlled evidence.

---

# 37. task_dependencies

```text
id
task_id
depends_on_task_id
dependency_type
created_at
created_by
```

Constraints:

```text
task_id != depends_on_task_id
```

Circular dependency detection belongs to Domain logic.

---

# 38. task_recurrence_rules

Only if recurring Tasks become required.

Logical:

```text
id
source_task_id / template reference
frequency
rule_config
timezone
next_run_at
active
created_at
version
```

Exact recurrence schema deferred.

---

# 39. Quality Domain Overview

Entities:

```text
findings
ncrs
rcas
capas
capa_actions
capa_effectiveness_reviews
```

The last entity is policy-dependent.

---

# 40. findings

Logical:

```text
id
finding_no
title
description
state
severity
source_context
owner_id
opened_at
closed_at
created_by
created_at
updated_at
version
```

Exact severity classification:

```text
UNCONFIRMED
```

---

# 41. Finding Source Relationships

A Finding may originate from:

```text
Inspection
Lab Test
Equipment
Task
Document
Other operational observation
```

Core business relationships should use explicit references where practical.

Preferred long-term pattern:

```text
finding_inspection_links
finding_lab_test_links
finding_equipment_links
```

for high-value typed relationships.

Avoid uncontrolled universal polymorphic relations for core business ownership.

---

# 42. ncrs

Logical:

```text
id
ncr_no
title
description
state
finding_id where applicable
affected_item_code where snapshot needed
affected_lot where applicable
owner_id
opened_at
closed_at
created_by
created_at
updated_at
version
```

---

# 43. rcas

Logical:

```text
id
rca_no
ncr_id
state
method
analysis
root_cause
submitted_at
approved_at
created_by
created_at
updated_at
version
```

Whether RCA must always be a separate entity:

```text
UNCONFIRMED
```

but the model supports it.

---

# 44. capas

Logical:

```text
id
capa_no
ncr_id
state
title
description
owner_id
target_date
verification_required
effectiveness_required
closed_at
created_by
created_at
updated_at
version
```

`effectiveness_required` depends on approved policy.

---

# 45. capa_actions

```text
id
capa_id
action_no / sequence
description
owner_id
due_at
state
completed_at
completed_by
verification_state
created_at
updated_at
version
```

---

# 46. capa_effectiveness_reviews

Only if effectiveness checking is approved.

Potential:

```text
id
capa_id
reviewer_id
reviewed_at
result
comments
evidence_reference
version
```

Do not migrate until CAPA policy confirms requirement.

---

# 47. Quarantine Domain Overview

Entities:

```text
receiving_items
inspection_templates
inspection_template_versions
inspection_template_sections
inspection_template_points
inspection_reports
inspection_report_results
inspection_report_snapshots
```

---

# 48. receiving_items

This is the official Receiving Register.

Logical:

```text
id
receiving_no
doc_no
item_code
description
lot
qty
receiving_date
expiry_date
workflow_state
inspection_result
release_system
released_at
released_by
created_by
created_at
updated_by
updated_at
version
```

---

# 49. Receiving State Separation

Store separately:

```text
workflow_state
inspection_result
release_system
```

Never one combined enum.

Example:

```text
workflow_state = RELEASE_PENDING
inspection_result = PASS
release_system = NO
```

---

# 50. Receiving Quantity

Recommended database representation:

```text
NUMERIC
```

rather than integer by assumption.

Exact precision/scale:

```text
DATA-DICTIONARY decision
```

because some materials may use non-whole quantities.

---

# 51. Receiving Duplicate Rule

No unique constraint should be invented on:

```text
doc_no
item_code
lot
```

until business duplicate definition is confirmed.

Instead:

```text
receiving_no
```

must remain unique.

---

# 52. Receiving → Inspection Relationship

Logical:

```text
Receiving Item
1
↓
N Inspection Reports
```

This supports:

* repeated/corrected reports.
* future replacement reports.
* historical reports.

A current active/approved report may be referenced separately if useful.

---

# 53. Inspection Templates

Separate:

```text
inspection_templates
inspection_template_versions
```

Identity and revision must not be merged.

---

# 54. inspection_templates

Represents template identity.

```text
id
template_code
name
description
active
created_at
created_by
```

---

# 55. inspection_template_versions

Represents controlled version.

Logical:

```text
id
template_id
version_no
state
effective_at
approved_at
approved_by
source_document references
created_at
created_by
content_hash
version
```

Unique:

```text
(template_id, version_no)
```

---

# 56. inspection_template_sections

```text
id
template_version_id
section_code
title
position
instructions
```

---

# 57. inspection_template_points

Logical:

```text
id
section_id
point_code
label
requirement_text
data_type
unit
required
acceptance_rule_type
acceptance_rule_payload
source_reference
position
```

Important:

`acceptance_rule_payload` cannot contain developer-invented values.

It must come from approved controlled source.

---

# 58. Inspection Report

`inspection_reports`

Logical:

```text
id
inspection_no
receiving_item_id
template_version_id
state
final_result
author_id
reviewer_id where convenient
approver_id where convenient
submitted_at
review_started_at
approved_at
rejected_at
voided_at
void_reason
snapshot_id
created_at
created_by
updated_at
updated_by
version
```

Do not rely solely on reviewer/approver shortcut columns for history.

Approval history lives in Approval infrastructure.

---

# 59. inspection_report_results

Stores actual execution data.

Logical:

```text
id
inspection_report_id
template_point_id
observed_value
observed_text
observed_boolean
selected_option
unit
result
remarks
entered_by
entered_at
updated_at
version
```

Physical representation may use typed columns or structured value model.

Avoid storing all measurements as free text.

---

# 60. Inspection Result Source

Each result should remain traceable to:

```text
template_point_id
```

and therefore:

```text
template_version
```

used during execution.

---

# 61. Inspection Historical Snapshot

Use domain-specific:

```text
inspection_report_snapshots
```

rather than one giant universal snapshot table.

Logical:

```text
id
inspection_report_id
snapshot_version
receiving_snapshot JSONB
template_snapshot JSONB
controlled_source_snapshot JSONB
criteria_snapshot JSONB
created_at
snapshot_hash
```

---

# 62. Inspection Snapshot Timing

At minimum:

```text
SUBMIT
```

freezes required controlled context.

Final approval may create/finalize immutable final snapshot/hash.

Exact strategy:

```text
SUBMISSION SNAPSHOT
+
FINAL APPROVAL HASH
```

is recommended.

---

# 63. Snapshot JSONB Rule

JSONB is acceptable for:

> frozen historical context.

It is not a replacement for normalized current business data.

---

# 64. Laboratory Domain Overview

Entities:

```text
lab_test_templates
lab_test_template_versions
lab_test_template_sections
lab_test_template_parameters

lab_tests
lab_samples
lab_measurements
lab_equipment_usage
lab_document_usage
lab_test_snapshots
```

Potential:

```text
retest_requests
```

if policy approves.

---

# 65. lab_test_templates

Represents Test identity.

```text
id
test_code
name
description
active
created_at
created_by
```

---

# 66. lab_test_template_versions

```text
id
template_id
version_no
state
method_reference
effective_at
approved_at
approved_by
content_hash
created_at
created_by
version
```

---

# 67. lab_test_template_sections

```text
id
template_version_id
section_code
title
position
instructions
```

---

# 68. lab_test_template_parameters

Defines measurements/data expected.

Logical:

```text
id
template_version_id / section_id
parameter_code
label
data_type
unit
required
acceptance_rule_type
acceptance_rule_payload
controlled_source_reference
position
```

Scientific values remain source-controlled.

---

# 69. lab_tests

Logical:

```text
id
lab_test_no
template_version_id
state
scientific_result
source_receiving_item_id where applicable
original_test_id where retest
retest_sequence
retest_reason
author_id
submitted_at
review_started_at
approved_at
rejected_at
voided_at
void_reason
snapshot_id
created_by
created_at
updated_by
updated_at
version
```

---

# 70. Retest Relationship

Recommended:

```text
lab_tests.original_test_id
```

nullable self-reference.

Original test:

```text
original_test_id = NULL
```

Retest:

```text
original_test_id = original Lab Test UUID
```

---

# 71. Retest Sequence

For traceability:

```text
retest_sequence
```

Example:

```text
Original = 0
Retest 1 = 1
Retest 2 = 2
```

Exact allowed max:

```text
UNCONFIRMED
```

---

# 72. lab_samples

Logical:

```text
id
lab_test_id
sample_no
sample_identifier
position
sample_source
status
created_at
created_by
version
```

Exact sample model depends on real lab workflows.

---

# 73. lab_measurements

Logical:

```text
id
lab_test_id
sample_id where applicable
template_parameter_id
raw_value
raw_text
unit
calculated_value
calculated_unit
result
remarks
entered_by
entered_at
updated_at
version
```

---

# 74. Raw Measurement Preservation

If result is calculated:

preserve:

```text
raw_value
raw_unit
```

Do not only persist:

```text
PASS
```

---

# 75. Calculation Traceability

If automated formulas exist, capture enough context to reproduce or explain them.

Potential:

```text
calculation_rule_version
calculation_inputs
calculated_value
```

Exact strategy to be defined after real test workflows are modeled.

---

# 76. lab_equipment_usage

Explicit N:N bridge.

```text
id
lab_test_id
equipment_id
calibration_record_id where applicable
usage_role
used_at
equipment_snapshot
calibration_snapshot
created_at
```

Relationship:

```text
Lab Test
N
↕
N
Equipment
```

---

# 77. Equipment Snapshot in Lab Usage

Current FK gives current equipment.

Historical snapshot gives:

> equipment state at execution time.

Both may coexist.

---

# 78. lab_document_usage

Explicit references to controlled documents used.

```text
id
lab_test_id
document_version_id
usage_type
document_snapshot
created_at
```

Possible `usage_type`:

```text
WI
SOP
METHOD
SPECIFICATION
```

Exact classification belongs in Data Dictionary.

---

# 79. lab_test_snapshots

Logical:

```text
id
lab_test_id
template_snapshot JSONB
source_snapshot JSONB
equipment_snapshot JSONB
calibration_snapshot JSONB
document_snapshot JSONB
criteria_snapshot JSONB
sample_context_snapshot JSONB
created_at
snapshot_hash
```

---

# 80. Laboratory Snapshot Rule

Snapshot is historical evidence.

It should not be automatically rebuilt from current tables.

---

# 81. Retest Request Entity

Potential:

```text
retest_requests
```

Logical:

```text
id
original_test_id
state
reason
requested_by
requested_at
reviewed_by
decision_at
decision_reason
version
```

But:

> **DO NOT MIGRATE until retest authorization policy is confirmed.**

---

# 82. Equipment Domain Overview

Entities:

```text
equipment
calibration_records
maintenance_records
```

Potential:

```text
equipment_status_history
```

although Audit may cover generic transition history.

---

# 83. equipment

Logical:

```text
id
equipment_no
name
manufacturer
model
serial_no
location
state
commissioned_at
decommissioned_at
created_at
created_by
updated_at
updated_by
version
```

Exact required fields depend on actual equipment register.

---

# 84. Equipment Business ID

```text
equipment_no
```

must be unique.

Examples could be:

```text
EQ-001
EQ-014
```

but numbering format remains business-configurable.

---

# 85. Equipment Decommission

No hard delete.

Store:

```text
state = DECOMMISSIONED
decommissioned_at
```

and audit reason/action.

---

# 86. calibration_records

Logical:

```text
id
calibration_no
equipment_id
state
calibration_date
due_date
provider
certificate_no
result
approved_at
approved_by
became_current_at
superseded_at
voided_at
created_at
created_by
updated_at
version
```

---

# 87. Calibration Interval

Do not store invented interval defaults.

If interval is needed, source may be:

```text
equipment master
controlled policy
calibration plan
approved external requirement
```

Model decision pending.

---

# 88. Calibration Current Record

Equipment may reference:

```text
current_calibration_id
```

as a convenience FK.

But database must ensure historical records are not overwritten.

---

# 89. Calibration Supersession

When new calibration becomes current:

```text
new calibration → CURRENT
old calibration → SUPERSEDED
equipment.current_calibration_id → new record
```

within one transaction.

---

# 90. maintenance_records

Logical:

```text
id
maintenance_no
equipment_id
state
maintenance_type
description
planned_at
started_at
completed_at
performed_by
provider
result
created_by
created_at
updated_at
version
```

---

# 91. Maintenance ≠ Calibration

No schema design should imply:

```text
maintenance completed
=
calibration valid
```

These remain separate entities.

---

# 92. Controlled Documents Overview

Entities:

```text
document_identities
document_versions
document_version_files
document_acknowledgements
```

Last entity only if acknowledgement workflow is required.

---

# 93. document_identities

Logical:

```text
id
document_no
document_type
title
owner
active
created_at
created_by
```

Example:

```text
WI-8-2-2-M01
```

---

# 94. document_versions

Logical:

```text
id
document_id
revision
state
effective_at
approved_at
approved_by
superseded_at
archived_at
voided_at
change_summary
content_hash
created_at
created_by
version
```

Unique:

```text
(document_id, revision)
```

---

# 95. Document Content

Actual document content/file may exist in Object Storage.

Database stores:

```text
file reference
metadata
hash
version
```

through Files/Evidence capability.

---

# 96. document_version_files

Optional explicit bridge:

```text
id
document_version_id
file_id
file_role
```

Examples:

```text
PRIMARY
APPENDIX
SUPPORTING
```

---

# 97. Effective Document Constraint

At most one effective version per Document Identity should exist at a time unless policy explicitly allows overlap.

This should be enforced using suitable PostgreSQL constraint/index strategy.

---

# 98. Document Revision Number

Exact type:

```text
integer?
text?
semantic revision?
```

is:

```text
UNCONFIRMED
```

Therefore physical column design waits for Data Dictionary decision.

---

# 99. Reviews & Approvals Overview

Shared infrastructure:

```text
approval_cases
approval_work_items
approval_decisions
```

Alternative naming is allowed, but semantics must remain.

---

# 100. approval_cases

Represents a review/approval workflow instance for a controlled record.

Logical:

```text
id
subject_type
subject_id
subject_version
workflow_type
state
requested_by
requested_at
completed_at
created_at
version
```

This is one of the controlled uses where typed polymorphic reference is acceptable.

---

# 101. Approval Subject Reference

Because Approval Infrastructure serves many Domains:

```text
subject_type
subject_id
```

may be used.

But authorization must verify the actual owning Domain.

Possible future stronger integrity options:

```text
record registry
domain-specific bridge tables
database triggers
application-enforced typed references
```

Physical strategy deferred to Architecture design.

---

# 102. approval_work_items

Logical:

```text
id
approval_case_id
step_no
work_type
assigned_user_id
assigned_role_requirement
state
assigned_at
started_at
completed_at
version
```

Possible `work_type`:

```text
REVIEW
APPROVAL
```

---

# 103. approval_decisions

Append/history-oriented.

```text
id
approval_case_id
work_item_id
actor_id
decision
subject_version
reason
comments
signature_id
decided_at
request_id
```

Do not update an old APPROVE row into REJECT.

New action = new decision/event.

---

# 104. Approval State Consistency

An approved `approval_decision` cannot be treated as sufficient if owning Domain transition failed.

Final approval operation should make:

```text
decision
+
domain state transition
+
audit
```

consistent transactionally where they form one business fact.

---

# 105. E-Signature Data Model

Entity:

```text
electronic_signatures
```

---

# 106. electronic_signatures

Logical:

```text
id
actor_id
subject_type
subject_id
subject_version
action
meaning
signed_at
snapshot_hash
reason
reauth_method
request_id
```

Never store password.

---

# 107. Signature Immutability

Electronic signature evidence:

```text
APPEND-ONLY
```

and should never be reassigned to another version.

---

# 108. Change Requests Overview

Entities:

```text
change_requests
change_request_changes
change_application_attempts
```

---

# 109. change_requests

Logical:

```text
id
change_no
target_type
target_id
target_version
state
reason
requested_by
submitted_at
approved_at
rejected_at
applied_at
created_at
updated_at
version
```

---

# 110. change_request_changes

Represents field-level proposed changes.

```text
id
change_request_id
field_name / controlled path
current_value
proposed_value
data_type
position
```

Values may use JSONB for controlled serialized before/after representation.

---

# 111. Change Request Target Snapshot

Change request must preserve the target state/version seen when request was created.

Potential:

```text
target_snapshot JSONB
target_snapshot_hash
```

---

# 112. change_application_attempts

Logical:

```text
id
change_request_id
attempt_no
started_at
finished_at
result
target_version_before
target_version_after
error_code
request_id
```

Useful to prove:

```text
Approved
but application failed safely
```

---

# 113. Audit Data Model

Core entity:

```text
audit_events
```

This table must survive source-record void/archive/deactivation.

---

# 114. audit_events

Logical:

```text
id
event_no / sortable identifier
occurred_at
actor_type
actor_id
subject_type
subject_id
action
transition_id
old_state
new_state
reason
request_id
signature_id
payload
previous_hash
event_hash
```

Hash fields are:

```text
ARCHITECTURE-DEPENDENT
```

until audit integrity design is finalized.

---

# 115. Audit Actor Types

Potential:

```text
USER
SYSTEM
SERVICE
```

A system-generated transition should still identify trusted actor type.

---

# 116. Audit Subject Reference

Audit is a justified typed-polymorphic use case:

```text
subject_type
subject_id
```

because it must outlive source records and span every Domain.

---

# 117. Audit FK Rule

Do not use destructive FK cascade from source business table to audit.

Audit must survive:

```text
Void
Archive
Deactivation
Potential draft cleanup where history is required
```

---

# 118. Audit Payload

`payload JSONB` may contain structured:

```text
before
after
changed_fields
context
```

but sensitive information should be minimized.

---

# 119. Audit Integrity Strategy

Exact choice remains:

```text
UNCONFIRMED
```

Options:

```text
Append-only DB permissions
Hash chaining
Partition-level digests
External archival
Combination
```

Do not claim cryptographic immutability until implemented and verified.

---

# 120. Files & Evidence Overview

Entities:

```text
files
evidence_links
```

Potential:

```text
file_scan_results
```

if malware scanning is adopted.

---

# 121. files

Stores metadata only.

Logical:

```text
id
original_filename
storage_key
storage_provider
mime_type
extension
size_bytes
sha256
uploaded_by
uploaded_at
state
```

Actual binary:

```text
Object Storage
```

---

# 122. File Storage Key

Never use raw user filename as trusted storage location.

Use generated opaque storage reference.

---

# 123. evidence_links

Generic shared attachment relation.

Logical:

```text
id
file_id
subject_type
subject_id
evidence_type
description
linked_by
linked_at
removed_at
removal_reason
```

This is another acceptable typed-polymorphic capability.

---

# 124. Controlled Evidence Removal

Do not physically erase evidence reference silently after controlled state.

Possible patterns:

```text
remove link with history
mark superseded
mark invalidated
retain file according to retention policy
```

---

# 125. File Deduplication

SHA-256 can detect duplicate binary content.

But physical deduplication:

```text
OPTIONAL
```

and must not merge business evidence identities incorrectly.

---

# 126. Notifications Data Model

Entities:

```text
notifications
notification_deliveries
```

Potential shared infrastructure:

```text
outbox_events
```

strongly recommended.

---

# 127. notifications

Logical:

```text
id
recipient_user_id
notification_type
severity
title
message
subject_type
subject_id
dedupe_key
created_at
read_at
```

Unique dedupe rules depend on event type.

---

# 128. notification_deliveries

If multiple delivery channels are supported:

```text
id
notification_id
channel
state
attempt_count
last_attempt_at
delivered_at
error_code
```

---

# 129. Transactional Outbox

Recommended entity:

```text
outbox_events
```

for durable after-commit actions.

Logical:

```text
id
event_type
aggregate_type
aggregate_id
payload
created_at
available_at
processed_at
attempt_count
last_error
dedupe_key
```

---

# 130. Outbox Purpose

Used for:

```text
Notifications
Search indexing
External integrations
Non-critical emails
Analytics events
```

without rerunning the business mutation.

---

# 131. Reporting Data Model

Reporting Source of Truth remains Domain data.

Do not duplicate operational truth into independent report tables unnecessarily.

Potential metadata entities:

```text
report_runs
report_artifacts
```

---

# 132. Report Definitions

Preferred initially:

> Canonical code registry.

Not necessarily DB rows.

Each definition declares:

```text
Report ID
Source
Authorization
Filters
Columns
Sort
Formats
```

Database-managed definitions only if a real customization requirement emerges.

---

# 133. report_runs

Logical:

```text
id
report_id
generated_by
generated_at
format
scope_context
filters
row_count
status
request_id
```

---

# 134. report_artifacts

Only if generated exports are retained.

```text
id
report_run_id
file_id
created_at
expires_at
```

Retention policy required.

---

# 135. Search Data Model

Search is not business source of truth.

Preferred initial implementation:

```text
PostgreSQL indexes
Search views
Full-text indexes where useful
```

No separate search database initially.

---

# 136. Search Read Models

Potential views:

```text
search_receiving
search_inspections
search_lab_tests
search_documents
search_equipment
```

but authorization must remain server-enforced.

---

# 137. Dashboard Data Model

Dashboard owns no Business Entity.

Preferred:

```text
Queries
Views
Read models
Aggregations
```

derived from source Domains.

---

# 138. Dashboard KPI Rule

Do not persist a KPI number unless real performance need exists.

Calculate from canonical source or maintained projection with reconciliation tests.

---

# 139. Backup & Recovery Metadata

Entities:

```text
backup_runs
restore_runs
```

Potential:

```text
backup_artifacts
```

---

# 140. backup_runs

Logical:

```text
id
state
requested_by
requested_at
started_at
created_at
verified_at
completed_at
storage_reference
size_bytes
checksum
database_schema_version
error_code
request_id
```

---

# 141. Backup State Truth

Separate:

```text
CREATED
VERIFIED
```

Do not store one `success = true` field representing both.

---

# 142. restore_runs

Logical:

```text
id
backup_run_id
restore_type
state
requested_by
authorized_by
requested_at
started_at
verified_at
completed_at
target_environment
error_code
evidence
request_id
```

---

# 143. Restore Types

Potential:

```text
DRILL
PRODUCTION
```

Production authority remains unconfirmed.

---

# 144. Restore Proof

A successful restore drill must record evidence separate from backup creation.

---

# 145. AI Advisory Metadata

Entity:

```text
ai_interactions
```

Potential later:

```text
ai_evaluation_runs
```

---

# 146. ai_interactions

Logical:

```text
id
actor_id
feature
subject_type
subject_id
model_provider
model_name
model_version
prompt_version
started_at
completed_at
status
schema_valid
request_id
```

---

# 147. AI Content Storage

Do not automatically persist full prompts/responses containing sensitive business data.

Storage policy:

```text
UNCONFIRMED
```

Minimum metadata first.

---

# 148. ai_evaluation_runs

Only when AI phase begins.

Potential:

```text
id
feature
evaluation_version
model_version
dataset_version
started_at
completed_at
result_summary
```

Not required in early Foundation migrations.

---

# 149. Generic Reference Policy

Typed generic references like:

```text
subject_type
subject_id
```

are allowed mainly for shared cross-domain infrastructure:

```text
Audit
Files/Evidence
Approvals
Notifications
AI metadata
Change Requests where necessary
```

---

# 150. Generic References Are Not Default for Core Business

Do not model:

```text
related_entity_type
related_entity_id
```

everywhere simply for convenience.

Core business relationships should use explicit FKs.

---

# 151. Explicit Cross-Domain FK Examples

Good:

```text
inspection_reports.receiving_item_id
lab_tests.source_receiving_item_id
calibration_records.equipment_id
document_versions.document_id
capa_actions.capa_id
```

---

# 152. Cross-Domain Write Ownership

FK does not grant write authority.

Example:

```text
lab_tests.source_receiving_item_id
```

does not allow Laboratory repository to update Receiving Item.

---

# 153. Historical Reference vs Snapshot

Always distinguish:

```text
Reference
```

from:

```text
Snapshot
```

Reference answers:

> What is the current record?

Snapshot answers:

> What was known/used at the historical action time?

---

# 154. Snapshot Strategy

Use Domain-specific snapshots for controlled workflows.

Recommended:

```text
inspection_report_snapshots
lab_test_snapshots
```

Potential future:

```text
document_signature_snapshot
change_request_target_snapshot
```

---

# 155. Snapshot Hash

Each final controlled snapshot should have:

```text
snapshot_hash
```

preferably SHA-256 over canonical serialization.

Exact canonicalization mechanism must be designed/tested before implementation.

---

# 156. Snapshot Mutability

After final controlled state:

```text
snapshot = IMMUTABLE
```

If corrected:

create:

```text
new version
new snapshot
correction record
```

instead of editing old snapshot.

---

# 157. Snapshot Size

Do not copy entire database rows unnecessarily.

Snapshot only facts necessary to explain historical controlled decision.

---

# 158. Snapshot Source References

Where useful store:

```text
source_record_id
source_version
snapshot_value
```

together.

This preserves both traceability and historical truth.

---

# 159. Current Master vs Snapshot Example

Equipment now:

```text
EQ-014
status = ACTIVE
calibration_due = 2027-01-01
```

Historical Lab Test may store:

```text
equipment_id = EQ-014 UUID
equipment_snapshot.status = ACTIVE
calibration_snapshot.valid_at_test_time = true
```

Changes later do not alter old test.

---

# 160. Controlled Source Versioning

Scientific results should refer to exact source version.

Examples:

```text
template_version_id
document_version_id
specification version
method version
```

Do not only store current `document_id`.

---

# 161. Product / Item Master

A dedicated:

```text
Product Master Domain
```

has not yet been approved.

Current Receiving information includes:

```text
item_code
description
```

as receiving facts.

---

# 162. Product Master Decision

Potential future entities:

```text
products
product_specifications
product_test_requirements
```

but:

> **DO NOT MIGRATE until Product Master requirements are defined.**

---

# 163. Item Code Snapshot

Even if Product Master is introduced later:

Receiving historical record keeps:

```text
item_code
description
```

as received at the time.

It should not display retroactively rewritten description by default.

---

# 164. Reference Data

Potential controlled lookup entities:

```text
reference_lists
reference_values
```

but generic lookup-table architecture should not be used for everything.

Use real columns/enums/tables when concept is stable.

---

# 165. Reference Data Change Control

Some reference data may require:

```text
Change Request
Approval
Versioning
```

Exact list:

```text
UNCONFIRMED
```

---

# 166. PostgreSQL Enums

Do not automatically use PostgreSQL ENUM for every state.

Trade-off:

```text
ENUM
→ strong validation
→ harder evolution

TEXT + CHECK
→ easier migrations
→ explicit constraint management
```

Exact strategy decided in Database Architecture.

---

# 167. Required Database Constraints

Use database constraints where possible:

```text
PRIMARY KEY
FOREIGN KEY
NOT NULL
CHECK
UNIQUE
EXCLUDE where useful
```

Business rules requiring richer context stay in Domain/Application layer.

---

# 168. Uniqueness Candidates

Examples:

```text
users.login_identity
roles.code
permissions.code
receiving_items.receiving_no
inspection_reports.inspection_no
lab_tests.lab_test_no
equipment.equipment_no
ncrs.ncr_no
capas.capa_no
document_identities.document_no
```

---

# 169. Composite Uniqueness Candidates

Examples:

```text
inspection_template_versions(template_id, version_no)

lab_test_template_versions(template_id, version_no)

document_versions(document_id, revision)

role_permissions(role_id, permission_id)
```

---

# 170. Conditional Uniqueness

Example:

> one EFFECTIVE Document Version at a time.

Can use PostgreSQL partial unique indexes where appropriate.

---

# 171. Indexing Principles

Index:

```text
Foreign Keys
Business Numbers
Common Search Keys
Workflow States where selective/useful
Dates used in due/overdue queries
Assignment columns
Scope columns
```

---

# 172. Receiving Index Candidates

```text
receiving_no
doc_no
item_code
lot
receiving_date
workflow_state
inspection_result
release_system
```

Composite indexes should follow measured queries.

---

# 173. Lab Index Candidates

```text
lab_test_no
state
scientific_result
template_version_id
source_receiving_item_id
submitted_at
approved_at
```

---

# 174. Audit Index Candidates

```text
subject_type + subject_id
actor_id
occurred_at
request_id
action
```

Audit size growth should be considered early.

---

# 175. Pagination

Large registers always support server-side pagination.

Do not load thousands of records and filter in Browser.

---

# 176. Pagination Strategy

Initial option:

```text
Cursor/keyset pagination
```

for large/high-frequency datasets.

Offset pagination may be acceptable for smaller management lists.

Exact approach per register.

---

# 177. Transaction Boundary — Inspection Submission

Recommended transaction:

```text
Verify actor
Verify permission/scope
Verify version
Validate report
Freeze submission snapshot
Transition DRAFT → SUBMITTED
Write audit event
Create durable outbox event
COMMIT
```

---

# 178. Transaction Boundary — Inspection Approval

```text
Verify actor
Verify approval permission
Verify domain permission
Verify scope
Verify state/version
Verify SoD
Verify required review/evidence
Create approval decision
Create signature evidence if required
Create/finalize controlled snapshot
Transition report → APPROVED
Update Receiving consequence
Write audit
Create outbox event
COMMIT
```

---

# 179. Transaction Boundary — Lab Approval

```text
Verify actor
Verify permission/scope
Verify state/version
Verify SoD
Validate scientific context
Validate equipment/calibration snapshot
Create approval evidence
Finalize snapshot
Transition → APPROVED
Write audit
Create outbox
COMMIT
```

---

# 180. Transaction Boundary — Receiving Release

After policy approval:

```text
Verify release permission
Verify Receiving version
Verify state
Verify approved inspection
Verify inspection result
Verify blockers
Verify signature if required
Set release_system = YES
Transition → RELEASED
Write audit
Create outbox
COMMIT
```

---

# 181. Transaction Boundary — Document Supersession

```text
Verify new version approved
Verify effective-date rule
Mark previous EFFECTIVE → SUPERSEDED
Mark new version → EFFECTIVE
Update current version reference
Write audit
Create notifications/outbox
COMMIT
```

---

# 182. Transaction Boundary — New Calibration Current

```text
Verify calibration approval
Mark old current record → SUPERSEDED
Mark new → CURRENT
Update equipment.current_calibration_id
Write audit
Create outbox
COMMIT
```

---

# 183. Transaction Boundary — Change Request Apply

```text
Lock/revalidate target
Verify target version
Verify approved change
Apply through owning Domain
Update target version
Mark change → APPLIED
Write audit
Create outbox
COMMIT
```

Failure:

```text
ROLLBACK target changes
```

and record controlled application failure appropriately.

---

# 184. Locks

PostgreSQL row locking may be used for sensitive actions where optimistic concurrency alone is insufficient.

Examples:

```text
Business number generation
Final approval
Release
Change application
Calibration supersession
Document supersession
```

Exact strategy defined later.

---

# 185. Idempotency Data

High-risk commands may require:

```text
idempotency_keys
```

or equivalent request-action registry.

Potential entity:

```text
idempotent_commands
```

---

# 186. idempotent_commands

Potential logical fields:

```text
id
key
actor_id
action
subject_type
subject_id
subject_version
created_at
completed_at
result_reference
```

Physical need/retention depends on API architecture.

---

# 187. Request IDs

`request_id` should propagate through:

```text
HTTP request
Application logs
Audit
Approval
E-signature
Outbox
Error response
```

where useful.

---

# 188. Application Logs

Application logs are not modeled as core PostgreSQL business tables by default.

They may be sent to structured logging/observability infrastructure.

---

# 189. Audit ≠ Logs

Never rely on runtime logs as the only evidence for:

```text
Approval
Release
Void
Correction
Permission change
```

Those require business audit data.

---

# 190. Data Retention

Exact retention periods are:

```text
UNCONFIRMED
```

for:

```text
Audit
Inspection
Lab Tests
Documents
Equipment
Calibration
Files
Reports
AI metadata
Backups
```

---

# 191. Retention Default

Until approved:

> Do not automatically delete controlled business history.

---

# 192. Object Storage Retention

Object storage lifecycle policy must not delete evidence while database record still requires it.

---

# 193. Backup Retention

Requires explicit operational decision.

Do not invent:

```text
7 days
30 days
1 year
```

without approval.

---

# 194. PII / Sensitive Data

Model should minimize unnecessary personal data.

Do not duplicate:

```text
emails
names
credentials
```

across business tables when `user_id` is sufficient.

Historical display-name snapshot may be used only if justified.

---

# 195. Password Storage

Only:

```text
password_hash
```

using approved password hashing algorithm.

Never:

```text
plaintext password
encrypted reversible password
```

---

# 196. Secrets

API keys and DB passwords:

```text
NOT BUSINESS DATABASE DATA
```

by default.

Use environment/secrets management.

---

# 197. Multi-Tenancy

Current system is:

```text
Single organization
```

unless future requirements change.

Do not add:

```text
tenant_id
```

to every table without actual requirement.

---

# 198. Multi-Site

Multi-site support may be useful.

But:

```text
Site hierarchy = UNCONFIRMED
```

Design should not block future Site scope, but must avoid premature complexity.

---

# 199. Database Schema Organization

Potential PostgreSQL schemas:

```text
public
```

or domain-specific schemas.

Domain-specific DB schemas may improve boundary visibility:

```text
identity
tasks
quality
quarantine
laboratory
equipment
documents
workflow
platform
```

but add operational complexity.

Final choice belongs in:

```text
DATABASE-ARCHITECTURE.md
```

---

# 200. Modular Monolith Boundary

Even with one PostgreSQL database:

```text
Laboratory Repository
```

does not write directly to:

```text
Quarantine tables
```

without owning Domain contract/orchestration.

---

# 201. Repositories

Each Domain owns its repositories.

Example:

```text
ReceivingRepository
InspectionRepository
LabTestRepository
EquipmentRepository
DocumentRepository
```

No generic:

```text
DatabaseRepository
```

containing all business operations.

---

# 202. Views

PostgreSQL Views may be used for:

```text
Reporting
Search
Dashboard
Read models
```

but not as a way to bypass Domain authorization.

---

# 203. Materialized Views

Only introduce when measured performance need exists.

They are:

```text
derived data
```

not source of truth.

---

# 204. Data Migration History

Migration naming:

```text
001_...
002_...
003_...
```

Once applied:

```text
IMMUTABLE
```

Fix:

```text
004_fix_xxx
```

not edit `003`.

---

# 205. Migration Verification

CI must eventually test:

```text
Fresh database migration
Upgrade migration
Migration checksum
Expected schema version
Foreign keys
Constraints
Indexes
```

---

# 206. Seed Data

Separate:

```text
System seed
Development fixture
Test fixture
Demo data
```

Production must not automatically receive fake test records.

---

# 207. System Seed Candidates

Potential safe system seed:

```text
Roles
Canonical permission codes
Required system configuration keys
```

User accounts should follow secure provisioning policy.

---

# 208. Test Data

Tests must be able to create independent:

```text
Users
Roles
Receiving
Inspections
Lab Tests
Equipment
Documents
Approvals
```

without depending on production-style shared state.

---

# 209. Referential Integrity

Core relationships use FKs wherever feasible.

Examples:

```text
inspection_reports.receiving_item_id
→ receiving_items.id

calibration_records.equipment_id
→ equipment.id

document_versions.document_id
→ document_identities.id

capa_actions.capa_id
→ capas.id
```

---

# 210. Generic Platform Reference Integrity

For:

```text
Audit
Approvals
Evidence
Notifications
AI
```

generic subject references may not have normal FKs.

Therefore integrity must be protected using:

```text
Application contracts
Tests
Typed reference registry if adopted
No arbitrary client-supplied subject types
```

---

# 211. Controlled Subject Types

Never accept:

```text
subject_type = arbitrary string
```

from Browser.

Use canonical server-side registry.

---

# 212. Status Columns

Status/state values:

* canonical.
* constrained.
* machine-verifiable.
* documented in `STATE-MACHINES.md`.

No free-text state.

---

# 213. Result Columns

Outcome/result must remain separate from workflow state where needed.

Examples:

```text
inspection_reports.state
inspection_reports.final_result

lab_tests.state
lab_tests.scientific_result

receiving_items.workflow_state
receiving_items.inspection_result
receiving_items.release_system
```

---

# 214. Boolean Explosion

Avoid dozens of mutually conflicting booleans such as:

```text
is_submitted
is_reviewed
is_approved
is_void
```

if one lifecycle state should own the truth.

Use booleans only for independent facts.

---

# 215. Derived Fields

Do not persist derived values without reason.

Example:

```text
is_overdue
```

could be calculated from:

```text
due_at < trusted current time
```

unless performance/reporting need justifies persisted projection.

---

# 216. Generated / Calculated Results

Any persisted calculated scientific result must preserve inputs and rule version/source necessary for traceability.

---

# 217. JSONB Allowed Uses

Good candidates:

```text
Historical snapshots
Structured controlled rule payload
Change before/after
Audit structured payload
Report filters
Outbox event payload
```

---

# 218. JSONB Bad Uses

Avoid:

```text
entire receiving item as JSONB
entire user as JSONB
all lab measurements in one uncontrolled blob
all permissions in arbitrary JSON
```

when relational modeling is appropriate.

---

# 219. Nullability

`NULL` should mean:

> value not present / not applicable.

Do not use inconsistent mixtures:

```text
NULL
""
"N/A"
"-"
```

for the same concept.

---

# 220. Units

Measurements must separate:

```text
value
unit
```

when relevant.

Never store:

```text
"25 °C"
```

as the only numeric representation for calculations.

---

# 221. Precision

Scientific numeric fields must use appropriate:

```text
NUMERIC(p,s)
```

when precision matters.

Do not default everything to floating point.

Exact precision determined per field in `DATA-DICTIONARY.md`.

---

# 222. Dates vs Timestamps

Use:

```text
DATE
```

for pure business dates such as expiry date when time-of-day is irrelevant.

Use:

```text
TIMESTAMPTZ
```

for events/actions.

---

# 223. Historical User Attribution

Store:

```text
user_id
```

for actor relationships.

Changing user's current role does not alter historical action meaning.

Audit may additionally capture role/permission context if required.

---

# 224. Record Ownership

Each Business Entity should explicitly define whether it has:

```text
creator
owner
assignee
reviewer
approver
```

These are not synonyms.

---

# 225. Approval Shortcut Fields

Fields like:

```text
approved_by
approved_at
```

may exist for efficient current reads.

But approval history remains in:

```text
approval_decisions
+
audit_events
```

---

# 226. Snapshot Source Hash

Controlled source files/templates may have:

```text
content_hash
```

to prove exact content version used.

---

# 227. File Hash ≠ Business Approval

A hash proves binary identity.

It does not prove:

```text
approved
effective
valid
```

Those remain lifecycle facts.

---

# 228. Data Model Anti-Patterns

Forbidden:

```text
one giant qc_records table
```

Forbidden:

```text
one giant status enum for all domains
```

Forbidden:

```text
generic JSON record for every feature
```

Forbidden:

```text
approval columns copied inconsistently into every table
```

Forbidden:

```text
hard delete cascade through controlled history
```

Forbidden:

```text
one attachments blob inside every business table
```

Forbidden:

```text
role varchar copied into business records as authorization source
```

---

# 229. God Table Prohibition

Do not create:

```text
qc_operations
```

with hundreds of columns for:

```text
Receiving
Inspection
Lab
NCR
Equipment
Documents
```

Each Domain owns its own model.

---

# 230. State History

Audit events are the primary cross-domain transition history.

If a Domain requires optimized state timeline, it may add dedicated state event table later.

Do not duplicate without need.

---

# 231. Critical Data Quality Constraints

Examples to enforce:

```text
qty > 0

retest_sequence >= 0

version > 0

expiry_date >= receiving_date
where policy logically requires

due_date >= calibration_date
where applicable
```

Exact exceptions must be reviewed.

---

# 232. Expiry Constraint Warning

Do not blindly enforce:

```text
expiry_date >= receiving_date
```

if business may legitimately receive already-expired material for investigation.

This requires business confirmation.

---

# 233. Calibration Constraint Warning

Do not blindly enforce:

```text
due_date > calibration_date
```

until calibration data semantics are confirmed.

---

# 234. Database Check vs Domain Rule

Use DB constraint when rule is:

```text
always true independent of context
```

Use Domain rule when it depends on:

```text
Role
State
Related records
Policy
Controlled source
```

---

# 235. Deferred Decisions Register

The following data decisions remain unresolved.

| ID     | Decision                                                  |
| ------ | --------------------------------------------------------- |
| DM-001 | Exact organizational hierarchy: Site/Department/Team/Lab  |
| DM-002 | Whether users can hold multiple roles                     |
| DM-003 | Whether direct user permission overrides are required     |
| DM-004 | Product Master Domain design                              |
| DM-005 | Receiving duplicate definition                            |
| DM-006 | Exact Receiving quantity precision                        |
| DM-007 | Inspection result physical value model                    |
| DM-008 | Lab measurement precision per test                        |
| DM-009 | Whether Retest Request entity is required                 |
| DM-010 | Maximum/allowed Retest policy                             |
| DM-011 | Equipment required master fields                          |
| DM-012 | Calibration APPROVED vs CURRENT separation                |
| DM-013 | Calibration interval source model                         |
| DM-014 | Equipment effect of overdue calibration                   |
| DM-015 | Document revision datatype                                |
| DM-016 | Document effective-date model                             |
| DM-017 | Controlled Document acknowledgement model                 |
| DM-018 | Exact Approval workflow step configuration                |
| DM-019 | Audit cryptographic integrity mechanism                   |
| DM-020 | Data retention periods                                    |
| DM-021 | Backup retention period                                   |
| DM-022 | Report artifact retention                                 |
| DM-023 | AI prompt/output retention                                |
| DM-024 | PostgreSQL domain schemas vs single schema                |
| DM-025 | Idempotency persistence implementation                    |
| DM-026 | Exact controlled reference-data model                     |
| DM-027 | Multi-site requirements                                   |
| DM-028 | Hard-delete eligibility for Draft entities                |
| DM-029 | Exact scientific calculation versioning model             |
| DM-030 | Whether current reviewer/approver shortcut FKs are needed |

---

# 236. Do Not Migrate Unconfirmed Models

The following should not be blindly implemented before decisions:

```text
Product Master
Retest Requests
Organizational hierarchy
Document acknowledgements
Generic configurable workflows
Complex reference-data engine
Multi-site hierarchy
AI evaluation persistence
```

---

# 237. Recommended Initial Foundation Tables

Once outstanding prerequisites are resolved, the first core schema is expected to center around:

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
task_dependencies

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
lab_test_template_sections
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

This is:

> **Logical candidate set, not an instruction to create every table immediately.**

---

# 238. Migration Sequencing Principle

Do not create all Domains in migration `001`.

Recommended progression:

```text
Identity
↓
Authorization
↓
Shared audit/integrity infrastructure
↓
Files/outbox
↓
Domain schemas in build order
```

---

# 239. Foundation Migration Groups

Conceptual:

```text
001 Core Identity
002 Roles & Permissions
003 Audit / Request Infrastructure
004 Files / Evidence
005 Tasks
006 Quality
007 Quarantine
008 Inspection Templates
009 Inspection Reports
010 Laboratory
011 Equipment / Calibration
012 Documents
013 Approvals / E-Signatures
014 Change Requests
015 Notifications / Outbox
016 Reporting Metadata
017 Backup / Recovery Metadata
```

Actual numbering depends on implementation plan.

---

# 240. Fresh Database Requirement

A completely empty PostgreSQL database must be able to migrate deterministically to the current schema.

---

# 241. Upgrade Requirement

Existing schema version must upgrade without rewriting historical migrations.

---

# 242. Migration Ownership

Migration files should reflect Domain boundaries where practical.

No arbitrary schema changes hidden inside unrelated feature migrations.

---

# 243. Database Verification

Each major Domain migration eventually requires tests for:

```text
Tables
Columns
PK
FK
Unique constraints
Check constraints
Indexes
Fresh migration
Upgrade path
Rollback/failure behavior where applicable
```

---

# 244. Model Testability

Every important Business Rule should map to one or more:

```text
Database constraint
Domain test
Integration test
Permission test
Transaction test
```

---

# 245. Traceability

Future chain:

```text
REQ-QUAR-001
        ↓
BR-QUAR-001
        ↓
STATE transition
        ↓
DATA entity / constraint
        ↓
Implementation
        ↓
Test
        ↓
Evidence
```

---

# 246. Data Model Review Gate

Before creating PostgreSQL migrations, verify at minimum:

```text
Domain ownership approved
Business rules approved
Roles approved
Permissions approved
State machines approved
Entity relationships reviewed
Unconfirmed scientific rules not invented
Historical snapshot strategy accepted
Deletion strategy accepted
Audit strategy accepted enough for first migration
```

---

# 247. Final Data Ownership Rule

When deciding where a field belongs, ask:

> **Which Domain owns the business truth represented by this field?**

Not:

> Which page displays it?

---

# 248. Final Historical Integrity Rule

When deciding whether to reference current data or snapshot it, ask:

> **If this value changes next year, must this historical record still show what was true when the action occurred?**

If yes:

> Snapshot/version reference is required.

---

# 249. Final Relational Rule

Use relational structure for:

```text
Current entities
Relationships
Searchable fields
Constraints
Ownership
```

Use JSONB selectively for:

```text
Immutable historical snapshots
Structured before/after payloads
Outbox payloads
Report filter metadata
```

---

# 250. Final PostgreSQL Principle

PostgreSQL is not only storage.

It participates in system integrity through:

```text
Foreign Keys
Unique Constraints
Check Constraints
Transactions
Row Locks
Version Checks
Indexes
Trusted Timestamps
Migration History
```

But Business Rules remain owned by the Domain.

---

# 251. Foundation Relationship

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

# 252. Document Status

```text
Document:
DATA-MODEL.md

Version:
1.0

Product:
QC Operations & Laboratory Management System

Database:
PostgreSQL

Model Type:
Logical Data Model

Primary Keys:
UUID

Business IDs:
Separate Human-Readable Identifiers

Time:
TIMESTAMPTZ / UTC

Concurrency:
Version-Based Optimistic Concurrency

Current Data:
Normalized

Historical Controlled Context:
Immutable Domain Snapshots

Controlled Deletion:
No Normal Hard Delete

Audit:
Independent Cross-Domain History

Files:
Metadata in PostgreSQL
Binary in Object Storage

Cross-Domain Writes:
Owning Domain Only

Generic References:
Restricted to justified Shared Capabilities

Unconfirmed Models:
Do Not Migrate Until Approved

Status:
FOUNDATION — APPROVED LOGICAL DATA MODEL

Next Foundation Document:
DATA-DICTIONARY.md
```
