# DATABASE-ARCHITECTURE.md

# QC Operations & Laboratory Management System
## PostgreSQL Database Architecture Specification — v1.0

**Document Path:** `Documents/DATABASE-ARCHITECTURE.md`  
**Status:** FOUNDATION — APPROVED DATABASE ARCHITECTURE BASELINE  
**Product:** QC Operations & Laboratory Management System  
**Database:** PostgreSQL 18.x — latest supported minor release  
**Runtime Access:** `pg` + Kysely  
**Migration Style:** Explicit forward-only SQL migrations  
**Primary Application Schema:** `qc`  
**Technical Identifier:** UUIDv7  
**Time Model:** UTC / `TIMESTAMPTZ`; display in `Asia/Riyadh`  
**Concurrency:** Optimistic versioning first; row locking where justified  
**Authorization:** Application-layer, server-side; PostgreSQL RLS deferred  

---

# 1. Purpose

هذه الوثيقة تحدد الـphysical PostgreSQL architecture الرسمية للنظام، وتحول العقود المنطقية الموجودة في:

```text
DATA-MODEL.md
DATA-DICTIONARY.md
STATE-MACHINES.md
PERMISSION-MATRIX.md
ARCHITECTURE-SPECIFICATION.md
SECURITY-ARCHITECTURE.md
```

إلى قواعد قابلة لبناء migrations وrepositories وtransactions واختبارات قاعدة البيانات بدون اختراع schema أو lifecycle أو scientific rules غير معتمدة.

هذه الوثيقة تحدد:

- PostgreSQL baseline.
- Runtime database access.
- Schema organization.
- Naming conventions.
- UUID generation.
- Business number generation.
- Data types.
- Constraints.
- Foreign keys.
- Indexing.
- Transactions.
- Isolation.
- Locking.
- Optimistic concurrency.
- Idempotency support.
- Database roles.
- Connection pooling.
- Migration governance.
- Audit/outbox persistence.
- Historical snapshots.
- Environment separation.
- Database testing and verification requirements.

---

# 2. Authority Chain

```text
SYSTEM-INVARIANTS.md
        ↓
QC-SYSTEM-DESIGN-CONSTITUTION.md
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
        ↓
ARCHITECTURE-SPECIFICATION.md
        ↓
SECURITY-ARCHITECTURE.md
        ↓
DATABASE-ARCHITECTURE.md
        ↓
PostgreSQL migrations
```

إذا خالفت migration وثيقة أعلى، الـmigration هي الخطأ ولا تصبح هي Business Truth بمجرد تطبيقها.

---

# 3. Core Database Principle

> **Normalize current business truth. Snapshot historical controlled truth. Enforce structural integrity in PostgreSQL. Keep business authority in the Domain/Application layers.**

PostgreSQL يحمي:

```text
Identity
Relationships
Nullability
Uniqueness
Structural state validity
Referential integrity
Concurrency primitives
Transactional consistency
Historical persistence
```

لكن لا يحل محل:

```text
Authorization
Separation of Duties
Approval authority
Release authority
Scientific source interpretation
Workflow orchestration
```

---

# 4. PostgreSQL Version Baseline

المعتمد:

```text
PostgreSQL 18.x
```

ويجب تشغيل:

```text
latest supported minor release
```

داخل major 18 ما لم توجد compatibility blocker موثقة.

لا يتم تثبيت architecture على minor محددة في الكود أو الوثائق طويلة العمر.

Major upgrade من 18 إلى إصدار أعلى يحتاج:

- Compatibility review.
- Extension review.
- Driver/Kysely compatibility review.
- Migration rehearsal.
- Backup/restore verification.
- Performance verification.
- Explicit architecture decision.

---

# 5. Runtime Database Stack

المعتمد:

```text
Application / Use Case
        ↓
Repository / Query Service
        ↓
Kysely
        ↓
node-postgres (`pg`)
        ↓
PostgreSQL
```

Kysely يستخدم كـtype-safe SQL query builder وليس كـDomain Model أو migration authority.

`pg` هو PostgreSQL driver/pool boundary.

---

# 6. Why Kysely + pg

الاختيار يحقق:

- Strong PostgreSQL access.
- Type-safe query composition.
- Predictable SQL.
- Full transaction support.
- Raw SQL escape hatch عند الحاجة.
- `SELECT ... FOR UPDATE` والـlocking primitives.
- CTEs وwindow functions وadvanced PostgreSQL features.
- فصل الـruntime queries عن migration history.

ممنوع تحويل Kysely types إلى مصدر Business Rules بديل عن `DATA-DICTIONARY.md`.

---

# 7. ORM Boundary

لا يعتمد النظام Active Record pattern.

Domain entities لا يجب أن تصبح ORM objects مرتبطة تلقائيًا بقاعدة البيانات.

المسار الصحيح:

```text
Domain/Application
        ↓
Repository Port
        ↓
PostgreSQL Repository Implementation
        ↓
Kysely / pg
```

---

# 8. Primary PostgreSQL Schema

Application business objects توضع افتراضيًا في:

```text
qc
```

مثال:

```text
qc.users
qc.tasks
qc.receiving_items
qc.inspection_reports
qc.lab_tests
qc.audit_events
qc.outbox_events
```

الهدف:

- Namespace واضح.
- عدم خلط application objects مع `public`.
- تبسيط Modular Monolith.
- تجنب cross-schema complexity المبكر.

---

# 9. `public` Schema Policy

`public` ليس مكانًا افتراضيًا لإنشاء business tables.

Production configuration يجب أن تمنع untrusted/runtime roles من امتلاك `CREATE` غير مطلوب داخل `public`.

`search_path` لا يعتمد على writable schema غير موثوق.

Qualified names مثل:

```sql
qc.inspection_reports
```

مفضلة في migrations وSQL الحساس.

---

# 10. Domain Ownership vs PostgreSQL Schema

وجود schema واحد `qc` لا يلغي Domain ownership.

Ownership يأتي من:

```text
DOMAIN-MAP.md
Application module boundaries
Repository boundaries
Architecture guards
```

وليس من إنشاء PostgreSQL schema منفصلة لكل Domain.

---

# 11. Table Naming

Canonical table naming:

```text
snake_case
plural nouns
```

مثال:

```text
users
sessions
receiving_items
inspection_reports
lab_tests
approval_decisions
controlled_document_versions
```

يتم الحفاظ على الأسماء المعتمدة في `DATA-MODEL.md` و`DATA-DICTIONARY.md` عند توفرها.

---

# 12. Column Naming

Canonical column naming:

```text
snake_case
```

Standard examples:

```text
id
created_at
created_by
updated_at
updated_by
version
state
```

لا يتم إنشاء aliases مختلفة لنفس المفهوم بين Domains بدون سبب موثق.

---

# 13. Constraint Naming

Naming convention:

```text
pk_<table>
fk_<table>__<column>
uq_<table>__<columns>
ck_<table>__<meaning>
```

Examples:

```text
pk_inspection_reports
fk_inspection_reports__receiving_item_id
uq_users__email
ck_inspection_reports__version_positive
```

---

# 14. Index Naming

Index naming:

```text
idx_<table>__<columns_or_purpose>
```

Partial/functional indexes يوضح اسمها purpose عند الحاجة.

Examples:

```text
idx_tasks__assignee_state
idx_lab_tests__created_at
idx_documents__effective_lookup
```

---

# 15. Technical Primary Keys

كل Business Entity مهم يستخدم:

```text
UUID PRIMARY KEY
```

الـUUID ليس permission ولا proof of ownership.

---

# 16. UUID Version

المعتمد للـnew records:

```text
UUIDv7
```

السبب:

- Globally unique technical identity.
- Time-ordered characteristics أفضل للـB-tree locality من random UUIDv4.
- Native PostgreSQL 18 support.

---

# 17. UUID Generation Location

Default:

```sql
id uuid PRIMARY KEY DEFAULT uuidv7()
```

أي Application-generated UUID يحتاج سبب تقني واضح، ولا يسمح للـclient-generated ID أن يصبح دليل authorization.

---

# 18. Human-Readable Business IDs

Technical UUID منفصل عن Business ID.

أمثلة من الـFoundation:

```text
RCV-...
IR-...
LAB-...
NCR-...
CAPA-...
```

Business ID:

- Human-readable.
- Unique ضمن الـapproved scope.
- Immutable بعد assignment ما لم توجد policy صريحة.
- ليس Primary Key تقني.

---

# 19. Business Number Allocation

ممنوع:

```sql
SELECT MAX(number) + 1
```

كآلية allocation غير محمية.

المعتمد هو counter allocation transactional.

Logical structure:

```text
business_number_counters
- namespace
- period_key
- scope_key where applicable
- next_value
- updated_at
```

Exact scope/format لكل Domain يأتي من Business Rules، ولا يتم اختراعه في migration.

---

# 20. Business Number Transaction

Allocation يجب أن يكون atomic عبر:

- Atomic `INSERT ... ON CONFLICT ... DO UPDATE ... RETURNING`, أو
- Row lock على counter row داخل نفس transaction.

Formatting يتم بعد الحصول على numeric sequence الموثوق.

إذا transaction الأساسية فشلت، سياسة استهلاك الرقم أو إعادة استخدامه يجب أن تكون Domain-specific ومعلنة؛ لا نفترض أن الأرقام يجب أن تكون gapless.

---

# 21. Text Types

Default descriptive/string type:

```text
TEXT
```

لا نستخدم `VARCHAR(n)` عشوائيًا لمجرد تقليد schema قديمة.

Length constraints توضع فقط عندما `DATA-DICTIONARY.md` أو business/security requirement يحدد حدًا فعليًا.

---

# 22. Canonical Codes

Codes/statuses القصيرة:

```text
TEXT
+ CHECK constraint
```

عندما تكون القيم معتمدة ومستقرة.

---

# 23. PostgreSQL ENUM Policy

Default:

```text
DO NOT USE PostgreSQL ENUM for workflow states
```

نستخدم:

```text
TEXT + CHECK
```

لأن state machines controlled لكنها قد تتطور عبر migrations، ونريد migration/change behavior واضحًا.

ENUM يمكن اعتماده مستقبلًا فقط بقرار database architecture صريح.

---

# 24. State Columns

`state` أو status-like business columns:

- تأتي values من `STATE-MACHINES.md` أو source معتمد.
- تستخدم CHECK عندما القائمة APPROVED.
- لا يتم إضافة state لمجرد حاجة UI.
- لا يقبل generic client PATCH لتغييرها.

---

# 25. Boolean Policy

Boolean يستخدم فقط لحقيقة ثنائية حقيقية.

لا نستخدم boolean عندما lifecycle فعليًا متعدد الحالات.

Bad:

```text
is_approved
is_closed
is_released
```

إذا الحالة controlled state machine وتحتاج تاريخًا أو معنى إضافيًا.

---

# 26. Numeric Types

Scientific quantities والقياسات:

```text
NUMERIC(p,s)
```

عندما تتطلب precision decimal مضبوطة.

Exact `p,s`:

```text
SOURCE-DEPENDENT / FIELD-SPECIFIC
```

ممنوع اختراع precision أو rounding rule.

---

# 27. Floating Point

`REAL` / `DOUBLE PRECISION` لا تستخدم للقياسات العلمية controlled إلا إذا المصدر العلمي المعتمد يسمح بطبيعة floating-point وعدم exact decimal behavior.

---

# 28. Integer Types

Counters والversions تستخدم:

```text
BIGINT
```

عند الحاجة لطول عمر كبير.

Small bounded quantities يمكن أن تستخدم `INTEGER` إذا الـData Dictionary يقرر ذلك.

---

# 29. Time Model

Event timestamps:

```text
TIMESTAMPTZ
```

Internal interpretation:

```text
UTC
```

UI display:

```text
Asia/Riyadh
```

---

# 30. Database Session Timezone

Application database sessions يجب أن تعمل بـ:

```text
UTC
```

حتى لا تعتمد stored/query behavior على timezone الخاصة بالhost.

---

# 31. Pure Business Dates

إذا المفهوم تاريخ بدون وقت:

```text
DATE
```

Examples قد تشمل تاريخ انتهاء/تاريخ document حسب تعريف الحقل.

لا نحول pure dates إلى midnight timestamps.

---

# 32. Trusted Timestamps

Critical timestamps تأتي من server/database trusted time.

لا يقبل browser كauthority لـ:

```text
approved_at
released_at
signed_at
created_at
audit time
```

---

# 33. Standard Metadata

Business records التي حددها Data Dictionary تحتاج حسب applicability:

```text
id UUID
created_at TIMESTAMPTZ
created_by UUID
updated_at TIMESTAMPTZ
updated_by UUID
version BIGINT
```

ولا يتم نسخ metadata إلى records لا معنى لها بدون حاجة.

---

# 34. Version Column

Optimistic concurrency column:

```sql
version bigint NOT NULL DEFAULT 1
CHECK (version > 0)
```

---

# 35. Optimistic Update Pattern

Canonical mutation:

```sql
UPDATE qc.some_record
SET
  ...,
  version = version + 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = $1
  AND version = $2
RETURNING *;
```

إذا row count = 0 يجب التمييز آمنًا بين:

- Not found / unauthorized context.
- Stale version.

حسب Error/Security Architecture.

---

# 36. No Silent Overwrite

ممنوع update حساس على pattern:

```sql
UPDATE ... WHERE id = $1
```

إذا record مصنف concurrency-sensitive ويجب فحص `version`.

---

# 37. Current Transaction Isolation

Default PostgreSQL/application transaction isolation:

```text
READ COMMITTED
```

ولا يتم رفع كل النظام إلى `SERIALIZABLE` بلا حاجة.

---

# 38. Isolation Escalation

يمكن استخدام:

```text
REPEATABLE READ
SERIALIZABLE
```

في use cases محددة إذا أثبتت invariants ذلك.

كل use case تستخدم isolation أعلى يجب أن توثق:

- سبب الحاجة.
- Expected contention.
- Retry behavior.
- Tests.

---

# 39. Serialization Failures

`SERIALIZABLE` يمكن أن ينتج serialization failure.

Transaction helper يجب أن تكون قادرة على bounded retry للحالات التي تم تصميمها لذلك.

Exact retry count/backoff:

```text
IMPLEMENTATION / OPERATIONS DEPENDENT
```

ويجب عدم إعادة external side effect داخل retry بشكل غير آمن.

---

# 40. Deadlocks

Deadlock يعتبر expected concurrency failure class وليس حالة مستحيلة.

Mitigation:

- Consistent lock ordering.
- Short transactions.
- Lock only required rows.
- Bounded retry where safe.
- Tests للعمليات الحرجة.

---

# 41. Row Locking

استخدم:

```sql
SELECT ... FOR UPDATE
```

فقط عندما يحتاج use case serialization على row حقيقية.

Candidates:

- Business number counters.
- Release decisions.
- Approval finalization.
- Document supersession.
- Current calibration transition.
- Change Request application.

لكن actual lock requirement يثبت per use case.

---

# 42. Lock Scope

Locks يجب أن تكون:

```text
Minimal
Deterministic
Short-lived
Inside explicit transaction
```

ممنوع فتح transaction ثم انتظار المستخدم أو network API.

---

# 43. External Calls in Transactions

Default:

```text
DO NOT perform slow external network calls inside critical DB transaction
```

استخدم local transaction + outbox ثم background/external processing عندما تكون side effect غير جزء من atomic database truth.

---

# 44. Transaction Ownership

Application Use Case يحدد transaction boundary.

Repositories لا تبدأ independent transactions عشوائيًا عندما يجب أن تشارك في transaction واحدة.

---

# 45. Transaction Context

Repository operations داخل نفس use case يجب أن تكون قادرة على استخدام نفس transaction handle.

Conceptual:

```text
transaction.execute(async trx => {
  repositoryA(trx)
  repositoryB(trx)
  audit(trx)
  outbox(trx)
})
```

---

# 46. Atomic Critical Mutation

Critical mutation يجب أن تحفظ في transaction واحدة كل الحقائق required atomicity مثل:

```text
State transition
Approval decision
E-signature evidence
Required snapshot
Audit event
Required same-database consequence
Outbox event
```

حسب workflow.

---

# 47. Idempotency

Critical command يجب أن تكون idempotent where applicable.

Database يمكن أن يدعم ذلك عبر:

- Unique command key.
- Unique business constraint.
- Existing transition/state verification.
- Dedicated idempotency record إذا احتاج use case.

Exact strategy لكل command لا يتم تعميمها بلا حاجة.

---

# 48. Primary Keys

كل table business entity لها Primary Key صريح.

Join/pure association tables يمكن أن تستخدم composite unique/PK إذا كان هذا أفضل contract، لكن القرار يجب أن يكون واضحًا.

---

# 49. Foreign Keys

كل relationship authoritative معروف يجب أن يملك FK ما لم توجد مبررات موثقة لعدم ذلك.

Application validation لا تستبدل referential integrity.

---

# 50. Foreign Key Delete Default

Controlled/history parent records:

```text
ON DELETE RESTRICT
```

هو الأصل.

`ON DELETE CASCADE` يستخدم فقط عندما child:

- Purely dependent.
- بلا historical meaning مستقل.
- Delete semantics معتمدة.
- لا يمحو controlled evidence.

---

# 51. `SET NULL`

`ON DELETE SET NULL` لا يستخدم لتجاوز historical truth.

إذا historical actor/reference يجب أن يبقى معروفًا، parent deletion نفسها قد تكون ممنوعة.

---

# 52. User Historical References

Deactivating user لا يعني حذف user row إذا records historical تعتمد عليه.

Identity lifecycle يجب أن يحافظ على audit/reference integrity.

---

# 53. Unique Constraints

Business uniqueness المهمة يجب أن تكون enforced في PostgreSQL وليس application-only.

Examples حسب approved dictionary:

- Business identifier uniqueness.
- Canonical codes.
- One relationship uniqueness.
- Session token hash uniqueness.
- Idempotency key uniqueness عند استخدامها.

---

# 54. Partial Unique Indexes

يمكن استخدام partial unique index لقواعد مثل:

```text
One current/effective record per parent
```

لكن فقط إذا policy نفسها APPROVED.

ممنوع اختراع:

```text
one current calibration
one effective document
```

إذا lifecycle definition غير محسومة في المصدر.

---

# 55. CHECK Constraints

PostgreSQL CHECK يستخدم للـstructural invariants مثل:

```text
version > 0
non-negative counters
allowed canonical state values
valid paired fields when rule is purely row-local and approved
```

لا نستخدم CHECK لتكرار complex cross-row/domain authorization logic.

---

# 56. Cross-Row Rules

Cross-row invariants تستخدم appropriate combination من:

- UNIQUE indexes.
- Partial unique indexes.
- Transactions.
- Row locking.
- Application/domain validation.

لا نضع hidden business logic في trigger كخيار افتراضي.

---

# 57. Trigger Policy

Default:

```text
NO BUSINESS-RULE TRIGGERS
```

Triggers يمكن استخدامها فقط لحاجة database-integrity ضيقة لا يمكن التعبير عنها بصورة أوضح، وبعد Architecture Decision موثق واختبارات مباشرة.

---

# 58. Updated Timestamps

لا نعتمد generic trigger خفي لتعديل كل `updated_at` افتراضيًا.

Mutation SQL/repository مسؤول عن update metadata بشكل صريح حتى تبقى semantics واضحة وقابلة للاختبار.

---

# 59. JSONB Policy

JSONB يستخدم عندما data طبيعتها structured document/snapshot أو flexible metadata معروفة.

Approved use cases تشمل conceptually:

```text
Historical controlled snapshots
Structured event payloads
Outbox payloads
Provider-specific metadata when appropriate
```

---

# 60. JSONB Is Not Default Modeling

ممنوع تحويل relational domain إلى:

```text
one table + JSONB payload
```

لتجنب modeling.

Current business truth يبقى normalized حيث العلاقات والاستعلامات والقيود مهمة.

---

# 61. JSONB Validation

Snapshot payload يجب أن يحمل:

```text
schema_version
canonical content
integrity hash where required
```

والـApplication validates schema قبل persistence.

Database-side JSON checks تستخدم فقط عندما مفيدة ومستقرة.

---

# 62. Historical Snapshots

Snapshot لا يعاد توليده عند قراءة record approved.

يتم حفظ الـcontrolled context وقت الحدث المطلوب، ويظل immutable حسب lifecycle.

---

# 63. Snapshot Hash

حيث يتطلب integrity:

```text
hash = SHA-256 or approved stronger equivalent
```

لكن canonical serialization algorithm يجب أن يكون محددًا قبل claim أن hash يثبت exact semantic content.

---

# 64. Audit Storage

Audit history تكون append-oriented.

Normal application path:

```text
INSERT
```

ولا يقوم بتعديل/حذف events التاريخية.

---

# 65. Audit Transaction

إذا audit event جزء من integrity للعملية، يتم إدخاله في نفس transaction مع business mutation.

---

# 66. Security Logs vs Audit

Security/application logs ليست بديلًا عن `qc.audit_events` أو audit persistence الرسمية.

Database audit history تمثل business/security evidence وفق الـAudit Architecture.

---

# 67. Outbox Table

Durable outbox تكون داخل PostgreSQL حتى تُكتب atomically مع business transaction.

Logical fields قد تشمل:

```text
id
occurred_at
topic/event_type
aggregate/entity reference
payload JSONB
attempt metadata
processed_at
```

Exact dictionary يتم تثبيته قبل migration.

---

# 68. Outbox Claiming

Worker claiming يجب أن يكون concurrency-safe.

يمكن استخدام PostgreSQL locking primitives مثل:

```text
FOR UPDATE SKIP LOCKED
```

عند اختيار processor design المناسب.

لكن no queue implementation claim قبل وجود worker فعلي واختباره.

---

# 69. Session Persistence

Server-side sessions تحفظ في PostgreSQL وفق Security Architecture.

Database stores:

```text
hashed session token
user reference
created/expiry/revocation metadata
```

ولا تخزن plaintext session token.

---

# 70. Database Roles

Minimum logical roles:

```text
qc_migrator
qc_app_runtime
```

Optional/operational roles عندما نحتاجها:

```text
qc_readonly
qc_backup
```

Exact provisioning يتم في Deployment/Operations.

---

# 71. Migrator Role

`qc_migrator` مسؤول عن schema evolution المصرح بها.

يمتلك DDL privileges اللازمة للمigrations.

لا تستخدم credentials الخاصة به كـruntime application credentials.

---

# 72. Runtime Role

`qc_app_runtime`:

- ليس PostgreSQL superuser.
- ليس database-wide administrator.
- لا يملك create/drop schema بشكل طبيعي.
- يحصل على DML/sequence/function privileges المطلوبة فقط.

---

# 73. Readonly Role

إذا ظهر operational/reporting need منفصل:

```text
qc_readonly
```

يكون read-only وعلى scope data المسموح به هندسيًا.

وجود DB readonly role لا يتجاوز application authorization للمستخدم النهائي.

---

# 74. Backup Role

Backup role/provider account:

- Least privilege.
- منفصل عن runtime.
- Managed حسب backup technology.
- لا يصبح application credential.

---

# 75. PostgreSQL RLS

Version 1 decision:

```text
NO PostgreSQL Row-Level Security as primary authorization mechanism
```

Authorization الرسمي يبقى في Application layer حسب `PERMISSION-MATRIX.md`.

---

# 76. RLS Future Position

RLS يمكن إعادة تقييمها defense-in-depth بعد حسم:

- Organizational scopes.
- Tenant/site model.
- Connection identity model.
- Reporting implications.
- Migration/testing burden.

لا يتم إضافتها جزئيًا بلا model متكامل.

---

# 77. Connection Pool

Runtime يستخدم shared `pg.Pool` per application process.

ممنوع إنشاء new connection لكل Astro Action.

---

# 78. Pool Sizing

Exact pool size:

```text
ENVIRONMENT / DEPLOYMENT DEPENDENT
```

ويحسب بناءً على:

```text
PostgreSQL max connections
Number of app instances
Background workers
Migration/admin reserve
Expected concurrency
```

لا hard-code رقم عشوائي.

---

# 79. Connection Lifecycle

Application startup/shutdown يجب أن يدير pool lifecycle بوضوح.

Graceful shutdown:

- Stop accepting new work.
- Finish/abort bounded in-flight work.
- Close pool.

---

# 80. Database Timeouts

Production يجب أن يحدد قيمًا مناسبة لـ:

```text
statement_timeout
lock_timeout
idle_in_transaction_session_timeout
connection timeout
```

Exact values:

```text
PERFORMANCE / OPERATIONS DEPENDENT
```

لكن unlimited accidental long transactions ليست baseline مقبولة.

---

# 81. Statement Timeout Overrides

Long-running approved report/maintenance task قد يحتاج timeout مختلف، لكن يتم ضبطه محليًا للعملية وليس رفع global timeout عشوائيًا.

---

# 82. Prepared / Parameterized Queries

كل user-controlled values تمر كparameters.

Dynamic identifiers مثل sort column تمر allowlist mapping.

---

# 83. SQL Logging

لا نسجل SQL مع sensitive bound values بشكل قد يسرب:

- Password data.
- Session tokens.
- Sensitive evidence.
- Personal data.

Query observability يجب أن تدعم redaction.

---

# 84. Index Baseline

PostgreSQL ينشئ indexes اللازمة للـPrimary Key وUnique constraints.

لكن Foreign Key referencing columns لا تُفترض indexed تلقائيًا.

كل FK access pattern يحتاج index review.

---

# 85. FK Index Rule

Add index عندما FK يستخدم بكثرة في:

```text
joins
parent delete/update checks
scoped listing
child lookup
```

ولا ننشئ index تلقائيًا على كل عمود بدون access-pattern review.

---

# 86. Composite Indexes

ترتيب الأعمدة يعتمد على actual query predicates/sort.

مثال conceptual:

```text
(scope_id, state, created_at DESC)
```

لكن لا يتم إنشاءه قبل معرفة query حقيقية.

---

# 87. Partial Indexes

مناسبة لـqueries مثل active/open/current rows عند وجود selective predicate ثابت ومعتمد.

تحتاج evidence من access pattern أو invariant.

---

# 88. Functional Indexes

تستخدم فقط عندما query contract يحتاج normalized expression ثابتًا، مثل case-normalized canonical lookup إذا policy تسمح.

---

# 89. Index Overuse

كل index له write/storage cost.

ممنوع إنشاء index لكل filter محتمل قبل قياس/use-case واضح.

---

# 90. Query Analysis

Performance tuning تعتمد على:

```text
EXPLAIN (ANALYZE, BUFFERS)
realistic data volume
actual query pattern
```

عند وجود environment آمنة للاختبار.

لا claims عن performance بدون evidence.

---

# 91. Dashboard Queries

Dashboard تستخدم read-model/aggregate queries server-side.

لا تحمل آلاف rows إلى browser لحساب KPI.

Indexes للـDashboard يجب أن تتبع queries الفعلية وauthorization scope.

---

# 92. Reporting Queries

Reporting يمكن أن يستخدم purpose-built query services/views إذا ذلك يحسن الوضوح والأداء.

لكن report read model لا يصبح writable business truth.

---

# 93. Database Views

Ordinary views مسموحة للـstable read projections إذا:

- Ownership واضح.
- Authorization لا يتم افتراضه داخل view وحدها.
- Tests تغطي query semantics.

---

# 94. Materialized Views

Default:

```text
DEFERRED
```

تستخدم فقط إذا أثبتت أحجام البيانات/reporting الحاجة، مع refresh/freshness contract واضح.

---

# 95. Partitioning

Default:

```text
NO PARTITIONING IN FOUNDATION
```

تُضاف فقط إذا evidence من الحجم/retention/query patterns تبررها.

---

# 96. PostgreSQL Full-Text Search

يمكن استخدام PostgreSQL full-text/search capabilities مستقبلًا قبل إضافة search service خارجي، إذا تلبي requirement.

ليست مفروضة الآن.

---

# 97. Soft Delete

لا يوجد universal:

```text
deleted_at
```

لكل table.

Deletion semantics تأتي من lifecycle.

Controlled records تستخدم states مثل:

```text
VOID
SUPERSEDED
ARCHIVED
```

حيث معتمدة، بدل محو التاريخ.

---

# 98. Physical Delete

Physical delete يسمح فقط عندما:

- Lifecycle يسمح.
- No historical/audit/evidence requirement.
- FK consequences معروفة.
- Authorization واضح.

Draft cleanup policy تبقى policy-dependent إذا لم تحسم.

---

# 99. Data Retention

Exact retention periods:

```text
POLICY / REGULATORY DEPENDENT
```

ولا يتم وضع scheduled delete job قبل اعتمادها.

---

# 100. Migration Location

Canonical location:

```text
database/
└── migrations/
    ├── 0001_....sql
    ├── 0002_....sql
    └── ...
```

Exact repository scaffold ينفذ لاحقًا.

---

# 101. Migration Format

Migrations هي:

```text
Explicit SQL
Forward-only
Sequential
Immutable after application
```

---

# 102. Migration Naming

Pattern:

```text
NNNN_short_descriptive_name.sql
```

مثال conceptual:

```text
0001_create_qc_schema.sql
0002_identity_foundation.sql
0003_authorization_foundation.sql
0004_audit_foundation.sql
```

Final ordering يعتمد على actual dependency graph.

---

# 103. Migration History Table

Database تحتوي migration history table مثل:

```text
qc.schema_migrations
```

أو dedicated trusted schema إذا runner يتطلب ذلك.

Minimum metadata:

```text
version
name
checksum
applied_at
```

Potential additional metadata:

```text
execution duration
runner version
```

---

# 104. Migration Checksum

Runner يتحقق أن migration applied سابقًا لم تتغير bytes/content بدون acknowledgement.

Changed historical checksum:

```text
FAIL
```

ولا يصلح تلقائيًا.

---

# 105. Historical Migration Immutability

بعد تطبيق migration على shared/staging/production environment:

```text
DO NOT EDIT IT
```

الإصلاح:

```text
new migration
```

---

# 106. Migration Transaction

DDL migration تستخدم transaction عندما PostgreSQL operation يسمح بذلك.

Operations التي تحتاج no-transaction behavior يجب أن تكون explicit ومدروسة.

---

# 107. Destructive Migrations

Drop/rename/destructive change لا ينفذ كخطوة عمياء.

استخدم عند الحاجة:

```text
Expand
Migrate/Backfill
Verify
Switch application
Contract later
```

خصوصًا للـproduction data.

---

# 108. Backfills

Large data backfill:

- لا يفترض أنه DDL سريع.
- يحتاج batching عند الحجم المناسب.
- قابل للاستئناف حيث مفيد.
- monitored.
- verified before constraint tightening.

---

# 109. `NOT NULL` Evolution

عند إضافة required column لجدول populated:

- Add safely.
- Backfill trusted value حسب business rule.
- Verify no NULL.
- Add/enforce constraint.

لا يتم اختراع default business value فقط لتنجح migration.

---

# 110. Schema Drift

Production schema يجب أن تكون reproducible من migration history.

Manual production DDL خارج migration process:

```text
FORBIDDEN except emergency procedure
```

وأي emergency change يجب أن يعاد تمثيله migration فورًا مع evidence.

---

# 111. Migration CI

CI يجب أن يثبت على الأقل:

```text
Fresh database → latest schema
Supported previous schema → latest schema
Historical checksums stable
Constraints created
Expected indexes created
Migration ordering valid
```

---

# 112. Seed Data

Seeds منفصلة عن migrations ما لم تكن canonical reference data ضرورية لسلامة schema.

---

# 113. Seed Safety

ممنوع في seeds:

```text
Production passwords
Real secrets
Production tokens
Sensitive real user data
```

---

# 114. Reference Data

Controlled reference/master data التي تحتاج governance لا تعامل كـcasual seed إذا lifecycle business-controlled.

يجب أن تمر عبر master-data architecture/approved migration/import path حسب نوعها.

---

# 115. Environment Databases

يجب فصل:

```text
Development
Test
Staging
Production
```

على الأقل logical/database boundaries مستقلة.

---

# 116. Local Development

VS Code local development يمكن أن يستخدم:

```text
Local PostgreSQL 18.x
or
Containerized PostgreSQL 18.x
```

بـdevelopment-only credentials.

---

# 117. Test Database

Automated integration tests تستخدم:

```text
Dedicated disposable test database
```

ولا تتصل Production.

---

# 118. Test Isolation

Test strategy يجب أن تمنع tests المتوازية من تلويث بعضها.

Options:

- Separate database per worker.
- Separate schema per worker.
- Controlled transaction reset.

Exact strategy يحسم في `TESTING-STRATEGY.md`.

---

# 119. Staging Database

Staging تحاكي Production schema/config قدر الإمكان، لكن ببيانات غير Production-sensitive أو sanitized حسب policy.

---

# 120. Production Database Safety

Local `.env` أو default test config لا يجوز أن تشير إلى Production DB.

Dangerous scripts تحتاج explicit environment guard.

---

# 121. Database URL Handling

`DATABASE_URL` أو equivalent:

```text
SECRET
SERVER ONLY
```

ولا تصل client bundle أو logs.

---

# 122. TLS to PostgreSQL

إذا الاتصال يعبر network غير موثوق/managed network requirement:

```text
TLS REQUIRED
```

Exact certificate verification mode يحسم حسب provider/deployment.

---

# 123. Database Least Privilege Verification

قبل Production يجب اختبار أن `qc_app_runtime` لا يستطيع:

```text
DROP TABLE
CREATE arbitrary schema
ALTER protected structure
become superuser
bypass database administration controls
```

إلا privileges مطلوبة ومبررة.

---

# 124. Function / Procedure Policy

PostgreSQL functions يمكن استخدامها لحاجة DB-native ضيقة، لكن لا ننقل Domain/Application بالكامل إلى stored procedures.

Any security-definer function يحتاج security review خاص لـ:

- Owner.
- `search_path`.
- Input validation.
- Grants.

---

# 125. Extension Policy

PostgreSQL extensions ليست allowed by default لمجرد الراحة.

كل extension تحتاج:

- Requirement.
- Supported-version check.
- Hosting/provider availability.
- Security/upgrade review.

UUIDv7 لا يحتاج extension في PostgreSQL 18.

---

# 126. No SQLite Compatibility Layer

لا يوجد requirement للمحافظة على compatibility مع SQLite.

نستخدم PostgreSQL capabilities مباشرة عندما تخدم correctness.

---

# 127. Repository Transactions

Repository APIs يجب أن تدعم transaction-scoped implementation بدون فتح nested autonomous transaction يخالف atomicity.

---

# 128. Repository Return Types

Database rows لا تنتشر كـuntyped objects في التطبيق.

Infrastructure تحول rows إلى application/domain-friendly structures مع parsing واضح للـ:

```text
UUID
NUMERIC
TIMESTAMPTZ
JSONB
```

---

# 129. NUMERIC Parsing

JavaScript `number` لا يفترض أنه آمن لكل `NUMERIC` precision.

Field-specific parsing/value-object strategy تحدد حسب scientific precision requirements.

---

# 130. BigInt Handling

`BIGINT` مثل `version` وcounters يحتاج mapping لا يفقد precision.

الـruntime adapter/Kysely types يجب أن يكون لها conversion policy واضحة.

---

# 131. Date Parsing

`TIMESTAMPTZ` و`DATE` لا يعاملان كنفس النوع في application.

- Instant/event time → timestamp/instant semantics.
- Business date → calendar-date semantics.

---

# 132. Data Validation Duplication

وجود CHECK/FK لا يلغي application validation.

Layers:

```text
Transport validation
Domain validation
Database constraints
```

كلها defense/correctness layers بأدوار مختلفة.

---

# 133. Constraint Error Mapping

Known PostgreSQL constraint violations يجب أن تتحول إلى stable application error where appropriate.

لا نعرض:

```text
raw SQLSTATE details
constraint internals
SQL text
```

للمستخدم النهائي.

---

# 134. Database Error Classes

Infrastructure يجب أن تميز على الأقل:

```text
Unique violation
Foreign key violation
Check violation
Serialization failure
Deadlock
Timeout
Connection failure
```

ثم application mapping حسب context.

---

# 135. Lock Ordering

Critical multi-row/multi-domain transaction توثق lock ordering عندما يوجد خطر deadlock.

مثال principle:

```text
Lock parent/context first
Then child/decision rows
Then counters/secondary records according to stable order
```

Exact order per workflow.

---

# 136. Long Transactions

ممنوع transaction تبقى مفتوحة أثناء:

```text
User think time
File upload over slow client connection
External AI call
Email delivery
External API wait
```

---

# 137. File Metadata

Binary content خارج PostgreSQL في Object Storage.

PostgreSQL يحتفظ:

```text
File identity
Storage key
Original filename
Media type
Size
SHA-256
Created metadata
Evidence relationships
Lifecycle metadata
```

حسب Data Dictionary النهائي.

---

# 138. Large Objects

PostgreSQL Large Objects/bytea ليست default storage للملفات controlled الكبيرة.

تحتاج exception موثقة إذا استُخدمت.

---

# 139. Backup Architecture Interface

Database architecture يجب أن تسمح بـ:

```text
Logical/physical backups حسب provider
Point-in-time recovery where available/required
Restore verification
```

لكن exact RPO/RTO/provider في `BACKUP-RECOVERY-PLAN.md`.

---

# 140. Backup Is Not Verified Restore

وجود backup artifact لا يعني readiness.

يجب التفريق بين:

```text
Backup created
Backup integrity checked
Restore executed
Restore verified
```

---

# 141. Restore and Migrations

Restore verification يجب أن يثبت أيضًا migration history/schema compatibility مع التطبيق المستهدف.

---

# 142. Observability

Database observability يجب أن تغطي حسب environment:

```text
Connection utilization
Pool saturation
Long queries
Lock waits
Deadlocks
Transaction errors
Storage growth
Backup state
Replication/PITR health when applicable
```

---

# 143. Query Metrics Privacy

Observability لا تسجل full sensitive bind values.

---

# 144. Database Health

Application readiness check يمكن أن يختبر lightweight DB connectivity.

لا يستخدم heavy query أو يكشف internals للعميل.

---

# 145. Maintenance

`VACUUM`, autovacuum, statistics, analyze, reindex/maintenance policies تعتبر operational PostgreSQL responsibilities.

لا نعطل autovacuum للنظام كحل performance عشوائي.

---

# 146. Statistics

Query planner يعتمد على statistics صحيحة.

Performance investigations يجب أن تراجع stats قبل القفز إلى caching أو denormalization.

---

# 147. Denormalization

Default business model:

```text
Normalized
```

Denormalization تحتاج:

- Proven query/performance need.
- Refresh/update consistency contract.
- Tests.
- Ownership.

---

# 148. Read Models

Read model denormalization مسموح لأنها derived وغير authoritative، بشرط:

- Source truth معروف.
- Refresh semantics واضحة.
- Authorization-aware access.

---

# 149. Cache Is Not Database Truth

أي cache مستقبلية:

```text
Derived
Disposable
Authorization-safe
```

ولا تستبدل PostgreSQL للحقيقة التشغيلية.

---

# 150. Data Import

Bulk/import path لا يستخدم direct unvalidated `COPY` من user upload إلى business tables.

Flow:

```text
Parse
Validate
Stage if needed
Preview
Authorize
Apply through controlled transaction
Audit
```

---

# 151. Staging Tables

Temporary/staging tables يمكن استخدامها للimports الكبيرة، لكن لا تصبح authoritative قبل validation/application step.

Lifecycle/cleanup واضح.

---

# 152. Data Export

Exports تقرأ عبر canonical authorized query services.

Database role أو export query لا يمنح user scope أوسع من التطبيق.

---

# 153. Referential Historical Integrity

Master-data changes لا تعيد كتابة historical approved facts.

عند الحاجة نستخدم:

```text
Reference + snapshot
```

بدل الاعتماد على current master record وحده.

---

# 154. Controlled Record Immutability

Approved/Signed/Closed/Void/Superseded records لا تعدل via generic repository `save()`.

Controlled corrections تمر use cases/transitions معتمدة وتاريخ محفوظ.

---

# 155. Generic Repository Restriction

لا نستخدم generic CRUD repository يسمح لأي module بـ:

```text
update(table, arbitrary fields)
delete(table, id)
```

للـcontrolled records.

Repositories تعكس use-case/domain boundaries.

---

# 156. Cross-Domain Writes

Database transaction يمكن أن تمس أكثر من Domain عندما orchestrating use case معتمد يحتاج atomicity.

لكن الوصول يتم عبر application contracts/repositories الرسمية، وليس repository من Domain يكتب table الآخر مباشرة بلا orchestration.

---

# 157. Cross-Domain Foreign Keys

FK cross-domain مسموحة عندما العلاقة جزء من logical data model.

FK لا تمنح write ownership.

---

# 158. Database Authorization Boundary

Database role تحمي infrastructure privilege.

Business authorization مثل:

```text
Who may approve this inspection?
```

تبقى application authorization ولا تُستنتج من مجرد ability to execute UPDATE.

---

# 159. Architecture Guards

يجب أن نضيف لاحقًا guards تمنع:

```text
src/pages → database imports
src/ui → database imports
client islands → database imports
Domain A → Domain B infrastructure repository
historical migration modifications
```

---

# 160. Database Test Categories

Minimum database test coverage:

```text
Migration tests
Constraint tests
Foreign-key tests
Unique-rule tests
Transaction rollback tests
Optimistic concurrency tests
Row-lock/concurrency tests
Business-number concurrency tests
Audit atomicity tests
Outbox atomicity tests
Role/privilege tests
Timezone/date tests
Snapshot persistence tests
```

---

# 161. Concurrency Tests

Critical concurrent workflows يجب اختبارها بعمليتين فعليتين ضد PostgreSQL، وليس mocks فقط.

Examples:

```text
Two actors approve same version
Two workers allocate same business number
Two edits with same expected version
Two releases on same receiving item
```

حسب approved workflow.

---

# 162. Migration Test from Empty

CI يجب أن ينشئ PostgreSQL فارغة ويطبق كل migrations إلى latest بدون manual step.

---

# 163. Upgrade Migration Test

قبل release مؤثر، يتم اختبار upgrade من supported prior schema state إلى current schema.

---

# 164. Constraint Tests Are Required Evidence

وجود constraint في SQL migration لا يكفي وحده.

يجب اختبار أنها:

```text
Accept valid data
Reject invalid data
Behave correctly under transaction
```

للـcritical constraints.

---

# 165. Data Dictionary Gate

إذا `DATA-DICTIONARY.md` يصنف field/table:

```text
UNCONFIRMED
DO NOT MIGRATE UNTIL APPROVED
```

فلا يتم إنشاء production migration لها لمجرد اكتمال folder structure.

---

# 166. Source-Dependent Scientific Fields

Scientific precision/limits/units/calculation source:

```text
SOURCE-DEPENDENT
```

لا يتم ملء migration بقيم guessed.

---

# 167. Policy-Dependent Fields

Policy-dependent schema decision إذا كان يؤثر جوهريًا على البيانات:

```text
BLOCK MIGRATION UNTIL POLICY APPROVED
```

إذا يمكن تصميم nullable/neutral structure بدون اختراع policy، يجب توثيق ذلك بوضوح.

---

# 168. Database Architecture Decision Register

## DB-001

```text
Decision:
PostgreSQL 18.x, latest supported minor.

Status:
APPROVED
```

## DB-002

```text
Decision:
Runtime database layer uses pg + Kysely.

Status:
APPROVED
```

## DB-003

```text
Decision:
Explicit forward-only SQL migrations are authoritative schema history.

Status:
APPROVED
```

## DB-004

```text
Decision:
Primary application schema is qc.

Status:
APPROVED
```

## DB-005

```text
Decision:
New technical IDs use database-generated UUIDv7 by default.

Status:
APPROVED
```

## DB-006

```text
Decision:
Human-readable business IDs are separate from technical UUIDs.

Status:
APPROVED
```

## DB-007

```text
Decision:
Business-number allocation uses concurrency-safe counters; MAX()+1 is forbidden.

Status:
APPROVED
```

## DB-008

```text
Decision:
Workflow states use TEXT + CHECK by default, not PostgreSQL ENUM.

Status:
APPROVED
```

## DB-009

```text
Decision:
READ COMMITTED is default transaction isolation.

Status:
APPROVED
```

## DB-010

```text
Decision:
Optimistic versioning is primary concurrency strategy; explicit row locking only where justified.

Status:
APPROVED
```

## DB-011

```text
Decision:
Runtime DB credentials are separate from migration credentials and are not superuser/owner-level administration credentials.

Status:
APPROVED
```

## DB-012

```text
Decision:
Controlled/history delete behavior defaults to RESTRICT; CASCADE only for proven dependent children.

Status:
APPROVED
```

## DB-013

```text
Decision:
No universal soft-delete column.

Status:
APPROVED
```

## DB-014

```text
Decision:
No PostgreSQL RLS in v1 as primary authorization; application authorization remains canonical.

Status:
APPROVED
```

## DB-015

```text
Decision:
No business-rule triggers by default.

Status:
APPROVED
```

## DB-016

```text
Decision:
No partitioning, materialized views, or external cache without evidence.

Status:
APPROVED
```

## DB-017

```text
Decision:
Binary files are stored outside PostgreSQL; PostgreSQL stores metadata and relationships.

Status:
APPROVED
```

## DB-018

```text
Decision:
Audit/outbox records required for atomic integrity are written in the same transaction as the business mutation.

Status:
APPROVED
```

---

# 169. Deferred Database Decisions

| ID | Decision |
|---|---|
| DD-DB-001 | Exact `pg` version |
| DD-DB-002 | Exact Kysely version |
| DD-DB-003 | Migration runner implementation |
| DD-DB-004 | Exact pool sizes per environment |
| DD-DB-005 | Exact statement/lock/idle transaction timeouts |
| DD-DB-006 | Retry count/backoff for serialization/deadlock |
| DD-DB-007 | Business-number scopes/formats per Domain |
| DD-DB-008 | Exact scientific `NUMERIC(p,s)` values |
| DD-DB-009 | Exact deletion/retention policies where unresolved |
| DD-DB-010 | Partial unique indexes tied to unresolved policies |
| DD-DB-011 | RLS future adoption |
| DD-DB-012 | Materialized views if reporting volume requires |
| DD-DB-013 | Partitioning thresholds/strategy |
| DD-DB-014 | Full-text search configuration |
| DD-DB-015 | Backup/PITR provider details |
| DD-DB-016 | Production PostgreSQL hosting/provider |
| DD-DB-017 | TLS certificate mode per provider |
| DD-DB-018 | Test database isolation method |
| DD-DB-019 | Audit cryptographic chaining storage if approved |
| DD-DB-020 | Read replica architecture if future load requires |

---

# 170. Forbidden Database Patterns

```text
SQLite compatibility architecture
UI → PostgreSQL
Astro Page → raw SQL
Client Island → DB
Generic uncontrolled CRUD over controlled records
SELECT MAX(number) + 1 without concurrency protection
Sequential integer as exposed authorization mechanism
Client timestamp as official audit/approval time
Client state as database authority
Floating point for controlled decimal science without approved reason
PostgreSQL ENUM for workflow states by default
Runtime role as PostgreSQL superuser
Runtime role using migration credentials
Manual production DDL without controlled recovery
Editing applied migration history
Universal ON DELETE CASCADE
Universal deleted_at
Business logic hidden in triggers
JSONB as excuse to avoid relational modeling
Long external network calls inside DB transaction
Unbounded transactions
Unparameterized user SQL
Arbitrary user-controlled ORDER BY identifiers
Indexing every column without access-pattern evidence
Premature partitioning
Premature materialized views
Tests against Production database
Secrets inside migration/source files
Database errors leaked directly to users
```

---

# 171. Database Feature Checklist

قبل إنشاء أي table/feature:

```text
[ ] Owning Domain identified
[ ] Data Model entity approved
[ ] Data Dictionary fields approved
[ ] UNCONFIRMED fields not invented
[ ] Primary key defined
[ ] Business ID strategy known where applicable
[ ] Nullability justified
[ ] Types justified
[ ] Scientific precision sourced
[ ] FK relationships defined
[ ] Delete behavior explicit
[ ] UNIQUE rules implemented where approved
[ ] CHECK constraints considered
[ ] Version column included where required
[ ] Trusted timestamps used
[ ] Historical snapshot behavior known
[ ] Audit significance known
[ ] Index access patterns reviewed
[ ] Transaction boundary known
[ ] Concurrency strategy known
[ ] Migration written forward-only
[ ] Database tests defined
```

---

# 172. Critical Transaction Checklist

```text
[ ] Explicit transaction boundary
[ ] Correct isolation level
[ ] Current version checked
[ ] Locking requirement reviewed
[ ] Lock order deterministic
[ ] Business number allocation safe if needed
[ ] Same-DB consequences atomic
[ ] Audit atomic where required
[ ] Outbox atomic where required
[ ] No slow external calls inside transaction
[ ] Serialization/deadlock behavior handled
[ ] Rollback tested
[ ] Concurrent execution tested
```

---

# 173. Migration Checklist

```text
[ ] Sequential unique migration number
[ ] Descriptive immutable filename
[ ] Explicit SQL
[ ] Schema-qualified objects
[ ] Safe dependency order
[ ] No guessed policy/scientific values
[ ] Constraints named
[ ] FK delete behavior explicit
[ ] Indexes intentional
[ ] Migration transactional where possible
[ ] Fresh DB migration tested
[ ] Upgrade path tested where applicable
[ ] Checksum tracked
[ ] Roll-forward remediation plan considered
[ ] No secrets/test credentials
```

---

# 174. PostgreSQL Production Readiness Gate

قبل Production database readiness claim:

```text
[ ] Supported PostgreSQL 18 minor running
[ ] Migration history clean
[ ] Fresh migration path passes
[ ] Upgrade rehearsal passes
[ ] Runtime role least privilege verified
[ ] Migrator credentials separated
[ ] TLS configured where required
[ ] Connection pool sized for deployment
[ ] Timeouts configured
[ ] Critical constraints verified
[ ] Critical indexes verified
[ ] Concurrency tests pass
[ ] Business-number collision tests pass
[ ] Backup created
[ ] Restore proven
[ ] Observability enabled
[ ] No unresolved schema-blocking policies migrated by assumption
```

---

# 175. Final Database Model

```text
┌──────────────────────────────────────┐
│ Astro Delivery / Application        │
└───────────────────┬──────────────────┘
                    │
┌───────────────────▼──────────────────┐
│ Domain Repositories / Query Services│
└───────────────────┬──────────────────┘
                    │
┌───────────────────▼──────────────────┐
│ Kysely                             │
│ Typed SQL / Transactions           │
└───────────────────┬──────────────────┘
                    │
┌───────────────────▼──────────────────┐
│ pg Pool                            │
└───────────────────┬──────────────────┘
                    │
┌───────────────────▼──────────────────┐
│ PostgreSQL 18.x                    │
│ qc schema                          │
│                                    │
│ Normalized Current Truth           │
│ Controlled Historical Snapshots    │
│ Sessions                           │
│ Audit                              │
│ Outbox                             │
│ File Metadata                      │
└────────────────────────────────────┘
```

---

# 176. Final Principle

> **PostgreSQL protects persisted truth, but does not replace the Domain.  
> Transactions protect atomicity, but do not replace authorization.  
> Constraints protect structural integrity, but do not invent business policy.  
> Migrations describe history, and history is not silently rewritten.**

---

# 177. Document Status

```text
Document:
Documents/DATABASE-ARCHITECTURE.md

Version:
1.0

Database:
PostgreSQL 18.x — latest supported minor

Runtime Driver:
pg

Query Layer:
Kysely

Schema:
qc

Technical IDs:
UUIDv7

Business IDs:
Separate concurrency-safe human-readable identifiers

Time:
UTC / TIMESTAMPTZ
Display: Asia/Riyadh

Migrations:
Explicit SQL
Forward-only
Sequential
Checksummed
Immutable after application

Concurrency:
Optimistic versioning first
Explicit row locking where justified

Default Isolation:
READ COMMITTED

Database Roles:
Migrator separated from runtime
Least privilege

Authorization:
Application-layer canonical
PostgreSQL RLS deferred

Files:
Metadata in PostgreSQL
Binary in Object Storage

Audit / Outbox:
Transactional where integrity requires

Unknown Policy / Scientific Decisions:
DO NOT INVENT
DO NOT MIGRATE when schema-blocking

Status:
FOUNDATION — APPROVED DATABASE ARCHITECTURE BASELINE
```
