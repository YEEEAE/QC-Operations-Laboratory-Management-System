# QC Operations & Laboratory Management System — Project Mind

> **Status:** ACTIVE — canonical live project memory
> **Repository:** `YEEEAE/QC-Operations-Laboratory-Management-System`
> **Default branch:** `main`
> **Product:** QC Operations & Laboratory Management System
> **Architecture:** Modular Monolith
> **Web framework:** Astro
> **Rendering model:** Server-rendered / on-demand
> **Database:** PostgreSQL
> **Operational timezone:** `Asia/Riyadh`
> **Last reset:** 2026-09-04

## [2026-09-04] — اعتماد Backup & Recovery Foundation Baseline

### تم التنفيذ
- إنشاء `Documents/BACKUP-RECOVERY-PLAN.md` كوثيقة Foundation معتمدة، بدون Draft status.
- اعتماد Layered Recovery Architecture تشمل PostgreSQL physical base backups + continuous WAL archiving + PITR، مع logical export كطبقة ثانوية وprovider snapshots كطبقة إضافية عند توفرها.
- إدخال Object Storage / Evidence binaries ضمن recovery scope وربط الاستعادة بـSHA-256 والـmetadata/business linkage.
- اعتماد Recovery Manifest يربط backup set بـPostgreSQL version context وWAL coverage وobject recovery context وGit SHA/migration context وrestore-verification status.
- تثبيت أن Backup Job Success لا يساوي Restore Verified، وأن telemetry لا تستبدل controlled recovery evidence.
- اعتماد isolated restore كافتراضي للـdrills، واعتبار Production Restore عملية high-risk controlled operation.
- تثبيت أن Admin لا يملك Production Restore Authority تلقائيًا، وأن major disaster/database recovery يبطل sessions الحالية افتراضيًا قبل reopening.
- تثبيت أن exact RPO/RTO والretention/cadence/authority/provider topology تبقى POLICY/DEPLOYMENT-DEPENDENT ولا يتم اختراعها.

### الملفات المتأثرة
- `Documents/BACKUP-RECOVERY-PLAN.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- تم إنشاء الوثيقة على `main` بالـcommit `c90e77bc7eb50c17f23158e3f00f720c9b7b8175`.
- تمت إعادة قراءة `Documents/BACKUP-RECOVERY-PLAN.md` من `main` بعد الإنشاء.
- Blob SHA المتحقق للوثيقة: `6b71c9189ecd3ae18bcdb9ccf737ea2e561afe6f`.
- الـStatus المتحقق داخل الملف: `FOUNDATION — APPROVED BACKUP & RECOVERY BASELINE`.
- لم تُشغّل application tests/build لأن المهمة توثيق Foundation فقط ولا يوجد claim بأن backup implementation أو runtime recovery جاهز.

### النتيجة والقيود
- الوثيقة نفسها مثبتة كـFoundation baseline معتمدة.
- هذا لا يثبت أن backup/PITR/object recovery/restore drills مطبقة أو operationally verified؛ `RISK-028` يبقى residual risk غير متحقق حتى يوجد implementation + restore evidence.
- Exact RPO/RTO والretention والcadence والrestore approval/reopen authority والprovider choices ما زالت قرارات مفتوحة.

---

## [2026-09-04] — تثبيت بروتوكول استخدام مهارات المشروع

### تم التنفيذ
- توحيد تعليمات `AGENTS.md` و`.agents/AGENTS.md` و`.claude/AGENTS.md` و`.clinerules/e.md` لإلزام فحص `.agents/skills/` قبل كل مهمة.
- تثبيت قراءة `SKILL.md` كاملًا للمهارة المطابقة قبل تنفيذ الإجراء، واتباع المراجع المطلوبة، وذكر عدم وجود مهارة مناسبة عند الحاجة.

### التحقق
- فحص تطابق قسم Skills في ملفات تعليمات الوكلاء الأربعة.
- فحص `git diff --check` بعد التعديل.

### النتيجة والقيود
- أصبحت مهارات المشروع موثقة كمسار استخدام دائم ضمن تعليمات المستودع.
- لا يضمن ذلك تطبيق مهارة غير مرتبطة بالمهمة؛ الاختيار يظل حسب موضوع المهمة وتعارضات وثائق Foundation.

---

# 1. Purpose

هذا الملف هو الذاكرة الحية للمشروع الجديد فقط.

ممنوع استخدام تاريخ BRIGHTAI أو `apps/qc-task-manager` القديم كواقع أو مصدر حقيقة لهذا المشروع.

المرجع التشغيلي الحالي يكون بالترتيب التالي:

1. الواقع الحالي للمستودع وقاعدة البيانات والـruntime عند وجودها.
2. الوثائق المعتمدة داخل `Documents/`.
3. هذا الملف للقرارات الحديثة وسجل العمل.
4. `README.md` للعرض العام.

إذا تعارض هذا الملف مع وثيقة Foundation معتمدة، لا يتم تجاهل التعارض؛ يجب توثيقه وتصحيح أحد المصدرين صراحة.

---

# 2. Current Project Stage

الحالة الحالية:

> **FOUNDATION / SPECIFICATION STAGE**

لا يُفترض وجود application implementation أو database schema أو migrations أو tests أو deployment لمجرد وجود المواصفات.

أي claim مثل:

- implemented
- complete
- verified
- production ready
- 100%

يحتاج دليل حالي من المستودع/الـruntime/الاختبارات.

---

# 3. Canonical Foundation Documents

المجلد الرسمي:

`Documents/`

الوثائق الأساسية الحالية:

- `Documents/QC-SYSTEM-DESIGN-CONSTITUTION.md`
- `Documents/SYSTEM-INVARIANTS.md`
- `Documents/DOMAIN-MAP.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/ROLE-MATRIX.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/STATE-MACHINES.md`
- `Documents/DATA-MODEL.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/REQUIREMENTS-TRACEABILITY.md`
- `Documents/ARCHITECTURE-SPECIFICATION.md`
- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/DATABASE-ARCHITECTURE.md`
- `Documents/ERROR-ARCHITECTURE.md`
- `Documents/TESTING-STRATEGY.md`
- `Documents/RISK-REGISTER.md`
- `Documents/OBSERVABILITY-ARCHITECTURE.md`
- `Documents/BACKUP-RECOVERY-PLAN.md`

`Documents/ROUTE-MANIFEST-SPECIFICATION.md` موجود حاليًا لكنه لا يدخل قائمة الـapproved canonical baseline إلا بعد إزالة Draft status واعتماده صراحة.

الوثائق تصف الـFoundation. الكود يجب أن يطابقها، وليس العكس.

---

# 4. Product Scope

المجالات الرئيسية:

- Dashboard
- Tasks
- Quality
  - Findings
  - NCR
  - RCA
  - CAPA
- Quarantine
  - Receiving Items
  - Inspection Reports
  - Quarantine Administration
- Laboratory Testing
- Equipment / Calibration / Maintenance
- WI / SOP / Controlled Documents
- Reviews / Approvals / E-Signatures
- Change Requests
- Reports
- Administration
- System Health / Backup / Recovery
- AI Advisory

Shared capabilities تشمل:

- Authorization
- Audit
- Notifications
- Files / Evidence
- Search
- Validation
- Transactions
- Errors
- Observability
- Time

---

# 5. Technology Decisions

## Web

- Astro هو الـWeb Framework الرسمي.
- النظام ليس static marketing site.
- الوظائف المحمية تعتمد server/on-demand rendering.
- `src/pages/`, Astro Actions/API endpoints, وmiddleware تعتبر Delivery Layer فقط.
- Business Rules لا توضع داخل `.astro` component أو client island أو route handler.

## Database

- PostgreSQL من اليوم الأول.
- Technical IDs: UUID.
- Human-readable business IDs منفصلة.
- Event timestamps: `TIMESTAMPTZ`.
- Internal time handling: UTC.
- Display timezone: `Asia/Riyadh`.
- Optimistic concurrency عبر record `version` للسجلات المناسبة.

## Architecture

- Modular Monolith.
- One application + one PostgreSQL database مع domain boundaries واضحة.
- لا Microservices في الـFoundation.
- لا direct UI → DB.
- لا direct cross-domain table writes.

---

# 6. Canonical Application Flow

```text
Astro Page / Client Island
        ↓
Astro Action / API Endpoint
        ↓
Authenticated Request Context
        ↓
Application Use Case
        ↓
Central Authorization
        ↓
Domain Rules / State Machine
        ↓
Transaction
        ↓
Repository
        ↓
PostgreSQL
        ↓
Audit / Durable Outbox / Notifications
```

---

# 7. Roles

الـFoundation roles الحالية فقط:

- Employee
- Supervisor
- Manager
- Admin

قاعدة ثابتة:

> **Role ≠ Permission**

Authorization يعتمد على:

`Role + Permission + Scope + Entity + State + SoD + Version + Business Rule`

Admin ليس Universal Business Approver.

Manager لا يرث تلقائيًا كل صلاحيات Supervisor/Employee.

---

# 8. Authorization Principles

- Default Deny.
- Authorization server-side دائمًا.
- UI visibility ليست security boundary.
- Astro middleware لا يستبدل domain authorization.
- كل sensitive Action تعيد authorization عند التنفيذ.
- Reports / Search / Export / Files تطبق نفس scope.
- Self-review وself-approval للـcontrolled records: DENY كـFoundation default إلى أن تعتمد SoD policy النهائية.
- أي sensitive permission غير محسومة: DENY UNTIL APPROVED.

---

# 9. Core System Invariants

1. UI visibility is never authorization.
2. Authorization is always server-side.
3. Separation of Duties must be enforced according to approved policy.
4. Approved controlled records cannot be silently edited.
5. VOID preserves history.
6. SUPERSEDED preserves history.
7. Important mutations require actor/time/entity/action/reason where required/audit evidence.
8. Scientific acceptance limits come only from approved controlled sources.
9. AI cannot approve, reject, release, sign, or set official PASS/FAIL.
10. Historical migrations are immutable.
11. Reports obey application authorization scope.
12. Backup is not proven until restore is verified.
13. Master-data changes do not rewrite historical records.
14. Draft / Submitted / Approved have different integrity rules.
15. Admin cannot rewrite historical facts.
16. Critical operations are transactional.
17. Critical actions are idempotent where applicable.
18. Concurrent edits never silently overwrite.
19. Routes, tests, and controlled workflows must be machine-verifiable.
20. No readiness claim without evidence.

---

# 10. Critical Domain Decisions Already Established

## Quarantine

These are separate facts:

- Receiving workflow state
- Inspection result
- Release System state

`PASS` does not automatically mean `Released`.

## Inspection

- Controlled report uses exact approved template version.
- Submission freezes historical controlled context.
- Approved records are not directly editable.

## Laboratory

- Raw observations/measurements are preserved.
- Scientific criteria are source-controlled.
- Retest is a separate execution linked to original test.
- Historical equipment/calibration/document context is snapshotted.

## Documents

- Document Identity and Document Version are separate.
- Approved/effective versions are controlled.
- Revision creates a new version.
- Superseded versions remain historical.

## Audit

- Audit is separate from application logging.
- Audit history must not be destroyed by cascade deletion.

## Files

- File metadata in PostgreSQL.
- Binary content in object storage abstraction.
- SHA-256 retained for integrity.

## AI

AI is advisory only and core workflows must function without AI.

---

# 11. Data Principles

- Normalize current business truth.
- Snapshot historical controlled truth.
- Use explicit FKs for core business relationships where practical.
- Restrict polymorphic `subject_type + subject_id` patterns to justified shared capabilities such as Audit / Evidence / Approval infrastructure.
- No giant generic QC table.
- No giant JSONB business model.
- No destructive cascades through controlled history.

---

# 12. Scientific / Policy Unknowns

Codex/developer/AI must not invent:

- Scientific acceptance limits
- Sampling rules
- Measurement precision
- Rounding rules
- Calibration intervals
- Release authority
- Release e-signature requirements
- Inspection final approver
- Lab final approver
- Retest allowance/count/authority
- NCR/CAPA closure authority
- Void authority
- Document approval authority
- Document effective-date policy
- Equipment behavior when calibration overdue
- RPO / RTO
- Retention periods

Unresolved sensitive behavior defaults to DENY/BLOCKED until approved.

---

# 13. Agent Working Rules

قبل أي مهمة:

1. اقرأ هذا الملف كاملًا.
2. اقرأ `AGENTS.md`.
3. اقرأ Foundation documents المرتبطة بالمهمة داخل `Documents/`.
4. افحص الواقع الحالي للمستودع قبل تصديق أي claim سابق.
5. افحص `.agents/skills/` واستخدم المهارة المناسبة إذا كانت موجودة.

بعد أي مهمة فعلية:

1. وثّق ما تم فعليًا فقط في أعلى هذا الملف.
2. اذكر الملفات المتأثرة.
3. اذكر verification commands/results الفعلية.
4. اذكر المشاكل المفتوحة/القيود.
5. لا تسجل خطة مستقبلية كأنها إنجاز.

---

# 14. Git Safety

Default project rule:

- لا `git push` بدون طلب صريح وواضح من المستخدم.
- لا `git commit` بدون طلب صريح.
- لا `git reset --hard` على عمل المستخدم.
- لا حذف ملفات بدون موافقة المستخدم.
- لا تعديل secrets أو `.env*` بشكل غير مصرح.
- لا claims عن branch cleanliness بدون فحص فعلي.

---

# 15. Verification Rule

قبل قول:

- fixed
- pass
- complete
- verified
- ready

يجب وجود current evidence.

Minimum حسب المهمة:

- `git diff` / repository inspection
- typecheck/lint عند وجودهما
- unit tests
- integration tests
- negative tests للحالات الحساسة
- build
- E2E عند الحاجة
- migration verification عند وجود DB changes

Evidence before assertion.

---

# 16. Current Open Foundation Work

الحالة الحالية ما زالت Foundation / Specification، ولم يبدأ إثبات runtime implementation بمجرد اعتماد الوثائق.

Recommended next areas:

- اعتماد/إغلاق `ROUTE-MANIFEST-SPECIFICATION.md` إذا تقرر تثبيته كbaseline.
- `DESIGN-SYSTEM.md`.
- `UI-UX-SPECIFICATION.md`.
- Deployment Architecture.
- UAT Acceptance Plan.
- Production Readiness Checklist.
- Implementation plans حسب build phases بعد إغلاق المواصفات المطلوبة.

---

# 17. Current Ledger

## [2026-09-04] — تثبيت Astro كإطار رسمي في Foundation documents

### تم التنفيذ
- `Documents/QC-SYSTEM-DESIGN-CONSTITUTION.md`: أُضيف تثبيت Astro كـWeb Framework رسمي مع server output + Node adapter (on-demand rendering / Actions / Sessions)، واستُبدل مثال `React Component → Database` بـ`Astro Component / UI Component / Client Island → Database`، وحُدّث مسار القسم 14 ليبدأ بـ`Astro Page / UI Component / Client Island → Astro Action / API Endpoint`.
- `Documents/DOMAIN-MAP.md`: أُضيف قسم Delivery Layer في §2 يثبت أن `src/pages/` و`src/actions/` و`src/middleware.ts` هي Delivery Layer فقط و`src/modules/` مالك الـBusiness Logic.
- `Documents/PERMISSION-MATRIX.md`: أُضيف قسم فرعي بعد §2 يثبت أن middleware يثبت session/user context في locals فقط، وكل Action/API endpoint يعيد authorization بنفسه (Astro Actions public endpoints).
- `Documents/STATE-MACHINES.md`: حُدّث SM-GEN-002 من `UI / API` إلى `Astro Page / Astro Action / API Endpoint` بدون أي تغيير على State Machines.
- `README.md`: أُضيف قسم Technology Baseline (Astro + server rendering + Node adapter + PostgreSQL + Modular Monolith + Default Deny) مع ملاحظة أن static-only لا يناسب النظام.
- `DATA-MODEL.md` و`DATA-DICTIONARY.md`: لم تُغيَّر — PostgreSQL/UUID/snapshots/transactions مستقلة عن الـFramework.

### الملفات المتأثرة
- `.agents/mind/01-mind-latest.md`
- `Documents/QC-SYSTEM-DESIGN-CONSTITUTION.md`
- `Documents/DOMAIN-MAP.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/STATE-MACHINES.md`
- `README.md`

### التحقق
- فحوص `rg` أكدت وجود النصوص الجديدة في الوثائق المطلوبة ✅
- `rg -F "UI / API" Documents/STATE-MACHINES.md` → لا نتائج ✅
- `rg -F "React Component" Documents README.md` → لا نتائج ✅
- `git diff --quiet -- Documents/DATA-MODEL.md Documents/DATA-DICTIONARY.md` → لم يتغير الملفان ✅
- `git diff --check` على الملفات المتأثرة → نظيف ✅
- لم يُشغّل build أو tests لأن التغيير توثيقي فقط.

### النتيجة
- **الحالة:** نجح
- **مختصر:** تثبيت Astro server-rendered كـFoundation في الوثائق المعتمدة بدون تغيير أي Business Rule أو State Machine.

### القيود / المتبقي
- هذا تحديث Foundation توثيقي؛ لم يُنشأ بعد تطبيق Astro أو Node adapter أو PostgreSQL runtime.
- تغييرات `AGENTS.md` و`.claude/AGENTS.md` و`.clinerules/` موجودة في working tree خارج نطاق هذه المهمة ولم تُعدَّل.

---

# 18. Earlier Ledger

## [2026-09-04] — Reset project mind for new QC system

### تم التنفيذ
- أُلغي الاعتماد على mind/brain الموروث من BRIGHTAI و`apps/qc-task-manager` القديم.
- أُنشئ هذا الملف كذاكرة حية خاصة بمستودع `YEEEAE/QC-Operations-Laboratory-Management-System` فقط.
- ثُبتت القرارات الحالية: Astro server-rendered/on-demand + Modular Monolith + PostgreSQL.
- ثُبت `Documents/` كمصدر Foundation للمواصفات.
- ثُبتت قاعدة evidence-before-claims وعدم اختراع scientific/policy decisions.

### الملفات المتأثرة
- `.agents/mind/01-mind-latest.md`
- إزالة `.agents/mind/02-mind-mid.md`
- إزالة `.agents/mind/03-mind-earliest.md`
- إزالة `.agents/brain.md`

### التحقق
- Repository state verification مطلوب بعد اكتمال تحديث AGENTS.

### النتيجة
- **الحالة:** IN PROGRESS أثناء هذا السجل إلى أن يتم التحقق النهائي من AGENTS والـmind paths.

---

# 19. Mind Maintenance

هذا الملف هو mind الوحيد حاليًا.

لا تنشئ `02-mind-mid.md` أو `03-mind-earliest.md` إلا عندما يكبر الملف فعلًا ويحتاج archival rotation.

عندها:

- `01-mind-latest.md` يبقى current truth.
- `02/03` archives للقراءة فقط.
- لا يعود `.agents/brain.md` كمصدر حقيقة.