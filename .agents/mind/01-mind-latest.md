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

## [2026-09-04] — MASTER-002: routing foundation + architecture boundary checks

### تم التنفيذ
- أُنشئ registry TypeScript مركزي لمسارات الـbrowser المعتمدة في `src/shared/routing/`، مع حالة file expectation تفصل `required` عن `deferred` و`conditional` بدون إنشاء صفحات Astro وهمية.
- أُنشئت policy helpers توضح أن metadata المسار ليست Authorization، وأن كل route محمي يحتاج re-authorization داخل الـApplication Use Case.
- أُنشئ فحص معماري لـDelivery يمنع imports قاعدة البيانات/Domain/Business Rules وraw SQL من `src/pages` و`src/actions` و`src/ui` وmiddleware عند وجوده.
- أُنشئ فحص route-file coverage يعطي مسارات الملفات الناقصة بوضوح ويخرج nonzero؛ النتيجة الحالية الناقصة متوقعة لأن صفحات الدومينات ما زالت غير منفذة، والـdeferred/conditional مستثناة عمدًا.
- أُضيفت READMEs لتثبيت حدود modules/shared/ui/pages/db/tests قبل feature code.
- ثُبّت Render Web Service و`qclevel.top` كأساس web/domain في وثائق التشغيل، مع Hostinger كمدير DNS حالي، وعدم اختراع hostname أو providers غير معتمدين.
- كانت metadata في UI/UX وRoute Manifest بالفعل `FOUNDATION — APPROVED` من العمل السابق؛ تم التحقق منها ولم يتغير محتواها.

### الملفات المتأثرة
- `src/shared/routing/route-types.ts`, `src/shared/routing/route-policy.ts`, `src/shared/routing/routes.ts`
- `scripts/architecture/check-boundaries.mjs`, `scripts/architecture/check-route-files.mjs`
- `src/{modules,shared,ui}/README.md`, `src/pages/README.md`, `db/README.md`, `tests/README.md`
- `tests/unit/routing-registry.test.ts`
- `Documents/DEPLOYMENT-ARCHITECTURE.md`, `docs/operations/RENDER-DEPLOYMENT.md`

### التحقق
- TDD: اختبار الـrouting فشل أولًا بسبب غياب registry ثم نجح بعد التنفيذ؛ `pnpm test:unit` → 5 tests ✅
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` ✅
- `node scripts/architecture/check-boundaries.mjs` ✅ بلا Delivery boundary violations.
- `pnpm exec tsx scripts/architecture/check-route-files.mjs` → nonzero متوقع مع قائمة الملفات المطلوبة الناقصة؛ لا يشمل deferred/conditional routes ✅
- إعادة قراءة metadata لأول 30 سطرًا من UI/UX وRoute Manifest، وفحص stale approval wording بلا نتائج ✅
- إعادة التحقق من Render الرسمي: Web Service يحتاج binding على `0.0.0.0`، root A fallback هو `216.24.57.1`، و`www` CNAME يحتاج hostname فعلي؛ لا توجد Render service/hostname/DNS/TLS حاليًا.
- `git diff --check` ✅

### النتيجة
- **الحالة:** نجح
- **مختصر:** Foundation routing والحدود قابلة للفحص آليًا، مع بقاء تنفيذ صفحات الدومينات وتهيئة Render/DNS/قاعدة الإنتاج خارج نطاق التنفيذ الحالي.

### ملاحظات / مشاكل مفتوحة
- الجهاز المحلي ما زال Node `22.22.3` بينما الـruntime المقفل Node `24.20.0`؛ التحقق المحلي مرّ لكن توافق Node 24 ما زال غير متحقق محليًا.
- PostgreSQL، object storage، KMS/secrets، telemetry، backup/PITR providers وRender service hostname غير معتمدة/غير منشأة؛ DNS commands لا تُنفذ قبل إنشاء الخدمة ونسخ hostname الفعلي.

## [2026-09-04] — إزالة قيد "Execute this prompt only" من خطة التنفيذ المدمجة

### تم التنفيذ
- حذف سطر `EXECUTION MODE: Execute this prompt only. Do not start the next prompt.` من جميع مواضعه في `IMPLEMENTATION-MASTER-PLAN-MERGED.md`.
- المواضع المحذوفة: قالب القواعد الثابتة (القسم 3) + الـ40 برومبت MASTER = 41 موضعًا.
- لم يتغير أي محتوى آخر في الملف (لا عناوين، ولا متطلبات، ولا verification).

### الملفات المتأثرة
- `IMPLEMENTATION-MASTER-PLAN-MERGED.md`

### التحقق
- `grep -c "EXECUTION MODE: Execute this prompt only"` → `0` ✅
- `wc -l` → 5668 (كان 5709؛ الفرق 41 سطرًا محذوفًا بالضبط) ✅
- `git diff --check` ✅ و`git diff --stat` → 41 deletions فقط ✅

### النتيجة
- **الحالة:** نجح
- **مختصر:** البرومبتز أصبحت خالية من قيد التوقف بعد كل برومبت؛ باقي محتوى الخطة سليم 100%.

### ملاحظات / مشاكل مفتوحة
- لا يوجد.



## [2026-09-04] — MASTER-001: Astro + Render baseline

### تم التنفيذ
- تهيئة أساس مشروع Astro SSR/on-demand مع Node adapter standalone وNode `24.20.0` وpnpm `11.25.0` مثبتين في config/lockfile.
- إضافة hygiene/configuration files، TypeScript strict، ESLint/Prettier، وscripts للفحص والاختبارات والتشغيل.
- إنشاء Render Web Service Blueprint لـ`qclevel.top` مع `checksPass` وCorepack frozen install وبدون أي secret أو PostgreSQL resource.
- تنفيذ readiness infrastructure مستقل عن Delivery: يفحص PostgreSQL، ويرجع `200` عند الجاهزية أو `503` minimal عند غياب/فشل dependency.
- إضافة unit tests لحالتي readiness، Playwright config لعزل E2E، ووثيقة تشغيل Render.
- تدوير السجلات الأقدم إلى `02-mind-mid.md` لأن الـlive mind تجاوز حد الحجم التشغيلي.

### الملفات المتأثرة
- `package.json`, `pnpm-lock.yaml`, `astro.config.mjs`, `render.yaml`
- `src/pages/api/health/ready.ts`, `src/shared/health/*`, `tests/unit/health-ready.test.ts`
- `docs/operations/RENDER-DEPLOYMENT.md`, `playwright.config.ts`
- `.agents/mind/01-mind-latest.md`, `.agents/mind/02-mind-mid.md`

### التحقق
- `pnpm install --frozen-lockfile` ✅ (بـpnpm 11.25.0؛ local Node 22 تجاوز القيد مؤقتًا)
- `pnpm exec astro --version` → `7.3.1` ✅
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm test:integration`, `pnpm test:e2e`, `pnpm test:coverage`, `pnpm build` ✅
- Render Blueprint JSON Schema validation من `https://render.com/schema/render.yaml.json` ✅
- `node dist/server/entry.mjs` ثم `GET /api/health/ready` بدون `DATABASE_URL` → `503 {"status":"unhealthy"}` ✅
- `git diff --check` وsecret/raw-SQL Delivery scans ✅

### النتيجة
- **الحالة:** نجح جزئيًا
- **مختصر:** baseline المحلي مكتمل ومتحقق؛ deploy وDNS/Render secrets وPostgreSQL الحقيقي غير منفذة عمدًا، لذلك الجاهزية الإنتاجية تبقى `UNVERIFIED`.

### ملاحظات / مشاكل مفتوحة
- الجهاز المحلي فيه Node `22.22.3` فقط؛ توافق Node 24 مو متحقق محليًا رغم تثبيت `.node-version` وRender `NODE_VERSION` على `24.20.0`.
- `DATABASE_URL`/Render service/DNS Hostinger ما زالت تحتاج إعداد وتشغيل معتمدين، ولا يوجد production deploy.

## [2026-09-04] — IMP-000: تطبيع اعتماد مواصفات UI/UX وRoute Manifest

### تم التنفيذ
- تحديث عنوان وحالة ونسخة `Documents/UI-UX-SPECIFICATION.md` إلى Foundation baseline معتمد.
- تحديث حالة ونسخة metadata النهائية في `Documents/ROUTE-MANIFEST-SPECIFICATION.md` إلى Foundation baseline معتمد.
- تحويل حالات سجلات قرارات UX وRoute من حالة الاعتماد المقترحة إلى `APPROVED` بدون تغيير متطلبات UI أو routes أو business behavior.
- إضافة الوثيقتين إلى قائمة `Canonical Foundation Documents` وإزالة ملاحظة أنهما ما زالتا Draft.

### الملفات المتأثرة
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- إعادة قراءة أول 30 سطرًا من الوثيقتين ✅
- فحص عبارات حالة المسودة/الاعتماد القديمة بلا نتائج ✅
- التحقق من قائمة `Canonical Foundation Documents` ✅
- `git diff --check` ✅
- لم تُشغّل application tests/build لأن التغيير metadata توثيقي فقط ولا يغيّر runtime behavior.

### النتيجة
- **الحالة:** نجح
- **مختصر:** أصبحت مواصفات UI/UX وRoute Manifest ممثلة كـFoundation APPROVED baselines، مع بقاء تغييرات working tree غير المرتبطة كما هي.

### ملاحظات / مشاكل مفتوحة
- لا توجد قرارات سياسة أو علمية جديدة؛ حالة التنفيذ الفعلي للصفحات والـroutes ما زالت `UNVERIFIED` حسب المواصفات.

## [2026-09-04] — اعتماد Deployment + UAT + Production Readiness Foundation Closure Package

### تم التنفيذ
- إنشاء `Documents/DEPLOYMENT-ARCHITECTURE.md` بحالة `FOUNDATION — APPROVED DEPLOYMENT ARCHITECTURE BASELINE`.
- إنشاء `Documents/UAT-ACCEPTANCE-PLAN.md` بحالة `FOUNDATION — APPROVED UAT ACCEPTANCE BASELINE`.
- إنشاء `Documents/PRODUCTION-READINESS-CHECKLIST.md` بحالة `FOUNDATION — APPROVED PRODUCTION READINESS BASELINE`.
- اعتماد Controlled Release Architecture: `Local/Development → Test/CI → Staging/UAT → Production`.
- تثبيت release identity مرتبطة بـGit SHA + Build/Artifact ID + Migration Head، مع تفضيل build-once/promote-same-artifact حيث يكون ذلك ممكنًا تقنيًا.
- تثبيت أن Production migrations خطوات explicit controlled وليست silent application-startup mutations، وأن code rollback لا يساوي database rollback.
- اعتماد UAT بنموذج `Role × Domain × Workflow × State × Permission × Positive/Negative Scenario × Evidence` مع ربط النتائج بالـexact release candidate.
- اعتماد Production Readiness كـfinal evidence-based Go/No-Go gate، ومنع percentage-based readiness من تجاوز أي blocker حرج.
- تثبيت أن Critical FAIL/UNVERIFIED، required UAT failure، residual CRITICAL، required restore evidence missing، أو artifact/commit mismatch تمنع Go-Live.

### الملفات المتأثرة
- `Documents/DEPLOYMENT-ARCHITECTURE.md`
- `Documents/UAT-ACCEPTANCE-PLAN.md`
- `Documents/PRODUCTION-READINESS-CHECKLIST.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `DEPLOYMENT-ARCHITECTURE.md` أُنشئ على `main` بالـcommit `2d35f7f62d08afa31757113ff9568936fcd745e6` وتمت إعادة قراءته؛ Blob SHA: `afd06581c9da000f281ce2e624c132e1ef56b738`.
- `UAT-ACCEPTANCE-PLAN.md` أُنشئ على `main` بالـcommit `83a0f1c006f247e7f604d282d8b145d70eac4444` وتمت إعادة قراءته؛ Blob SHA: `3a2d88a1dedbdd173053cac43045d6578b59ddc7`.
- `PRODUCTION-READINESS-CHECKLIST.md` أُنشئ على `main` بالـcommit `c5c31426e9ec3f43708f50f2e175914659a0a4b1` وتمت إعادة قراءته؛ Blob SHA: `529e263fb37555f37074b42df00d5278b784793b`.
- تم التحقق من أن الملفات الثلاثة تحمل APPROVED statuses وليست Draft.
- لم تُشغّل application tests/build لأن هذه المهمة توثيق Foundation فقط، ولا يوجد claim بأن CI/CD أو UAT runtime أو Production deployment مطبقة فعليًا.

### النتيجة والقيود
- حزمة Deployment/UAT/Production Readiness أصبحت Foundation baselines معتمدة.
- لا يعني ذلك أن deployment pipeline أو UAT execution أو production readiness evidence موجودة فعليًا؛ implementation/runtime status يبقى UNVERIFIED حتى يوجد code + environment + current evidence.
- Exact hosting/provider، CI/CD tooling، production release authority، RPO/RTO، retention، HA topology، deployment mode، وapproval ceremonies ما زالت POLICY/DEPLOYMENT-DEPENDENT حيث نصت الوثائق على ذلك.
- `Documents/UI-UX-SPECIFICATION.md` و`Documents/ROUTE-MANIFEST-SPECIFICATION.md` كان محتواهما معتمدًا من المستخدم، وتم لاحقًا تطبيع metadata إلى APPROVED وإدخالهما في قائمة الـcanonical baseline بهذا الـMind.

---

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
- لم تُشغّل application tests/build لأن التغيير توثيقي فقط ولا يوجد claim بأن backup implementation أو runtime recovery جاهز.

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

> **IMPLEMENTATION BOOTSTRAP — ASTRO / RENDER BASELINE INITIALIZED**

الـFoundation architecture/specification package الأساسية مكتملة بدرجة كبيرة، وAstro SSR/Render baseline صار موجودًا محليًا ومتحققًا. قاعدة البيانات الفعلية، migrations، identity/authz/audit، domains، وproduction deployment ما زالت غير منفذة أو غير متحققة حسب نطاقها.

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

الوثائق الأساسية المعتمدة حاليًا:

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
- `Documents/DESIGN-SYSTEM.md`
- `Documents/OBSERVABILITY-ARCHITECTURE.md`
- `Documents/BACKUP-RECOVERY-PLAN.md`
- `Documents/DEPLOYMENT-ARCHITECTURE.md`
- `Documents/UAT-ACCEPTANCE-PLAN.md`
- `Documents/PRODUCTION-READINESS-CHECKLIST.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`

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
