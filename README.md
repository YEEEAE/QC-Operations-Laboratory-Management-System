# تقرير مبسط عن النظام

## اسم النظام

**QC Operations & Laboratory Management System**

## فكرة النظام

النظام عبارة عن منصة داخلية موحدة لإدارة عمليات الجودة والمختبر والاستلام والفحص والتقارير والموافقات والمستندات، بحيث تكون كل العمليات مترابطة ويمكن تتبعها بسهولة.

الهدف الأساسي منه هو:

* تنظيم أعمال الجودة.
* تقليل العمل اليدوي والأخطاء.
* تسريع الفحص والمراجعة والاعتماد.
* حفظ كل العمليات بشكل موثق.
* معرفة من قام بأي إجراء ومتى.
* تسهيل استخراج التقارير.
* إعطاء الإدارة رؤية واضحة عن حالة العمل.

---

# Technology Baseline

الأساس التقني المعتمد للنظام:

```text
Web Framework:      Astro — server output (server-rendered / on-demand)
Runtime Adapter:    Node adapter — يدعم on-demand rendering وActions وSessions
Database:           PostgreSQL — من اليوم الأول
Architecture:       Modular Monolith — مع Domain boundaries واضحة
Authorization:      Server-side — Default Deny
```

> **ملاحظة معمارية:** البناء الافتراضي للتطبيق هو **server output**؛ Static-only Astro لا يناسب هذا النظام لأنه يعتمد على Authentication وserver-side authorization وPostgreSQL وcontrolled mutations. صفحات/UI/Astro Actions هي Delivery Layer فقط، وBusiness Logic يعيش داخل Modules مستقلة عن الـFramework.

## Deployment and CI boundary

The application deployment path is the Render Web Service defined in `render.yaml`:
Render installs the pinned pnpm lockfile, builds the Astro SSR output, and starts
`dist/server/entry.mjs`. GitHub Pages/Jekyll is not an application deployment target,
and Verification CI does not depend on it. If the repository's externally configured
Pages workflow remains enabled, disable it in GitHub repository Settings → Pages →
Build and deployment, or remove the Pages source/workflow from repository settings.

## Current implementation snapshot — 2026-09-18

This snapshot is synchronized with the current source freeze. See the
[canonical route matrix](Documents/ROUTE-MATRIX.md) and the
[documentation inventory](Documents/DOCUMENTATION-INVENTORY.md) for the detailed
contracts and document classifications.

| Item | Current truth |
| --- | --- |
| Git | `a6876f0fb0de6acbead7f62b3d1fbdf6c61e5de7` on `main`; working tree is not a committed release |
| Runtime contract | Node `>=24.20.0 <25`; pnpm `11.25.0`; this host runs Node `v22.22.3` |
| Structure | Astro SSR, Node standalone adapter, PostgreSQL 18 baseline, modular monolith, 18 modules |
| Pages/routes | 83 physical Astro page files; 85 registered routes; 77 required route files; 2 deferred auth declarations; 2 `YAZEED_ONLY` routes |
| Database | `qc` schema; 29 forward-only migration files; source head `0029_performance_query_indexes` |
| Local checks | architecture PASS; typecheck PASS with 68 hints; unit `83 files / 564 PASS`; build PASS |
| Incomplete gates | format FAIL (3 files); lint FAIL (19 errors); PostgreSQL-backed integration/migration/concurrency unavailable without a container runtime; exact-head CI, authenticated E2E, UAT, provider and production recovery evidence remain unverified |
| Release posture | `PARTIAL / NO-GO`; `PASS != RELEASED`; no production-readiness or UAT claim |

The route visibility model is `PUBLIC`, `AUTHENTICATED`, and `YAZEED_ONLY`.
Page visibility does not grant mutation authority: every Action/use case
re-checks permission, scope, state, version, SoD, signature, and business rules.
The only owner-exclusive pages are `/system/health` and
`/system/control-center`, and both require the active `SYSTEM_OWNER` account
whose login identity is `yazeed`.

---

# الأقسام الرئيسية

## 1. Dashboard

الصفحة الرئيسية للنظام.

تعرض لكل مستخدم المعلومات التي تهمه حسب دوره، مثل:

* المهام المطلوبة.
* الفحوصات المعلقة.
* التقارير التي تحتاج مراجعة.
* المواد الموجودة تحت Quarantine.
* الاعتمادات المعلقة.
* المعايرات القريبة أو المتأخرة.
* التنبيهات والحالات الحرجة.

الهدف منها أن يعرف المستخدم مباشرة:

> ما المطلوب مني الآن؟

---

## 2. Tasks

قسم لإدارة المهام اليومية.

يشمل:

* إنشاء مهمة.
* إسنادها لمستخدم.
* تحديد الأولوية والتاريخ.
* Checklist.
* Comments.
* Attachments.
* Evidence.
* متابعة الحالة.
* إكمال المهمة.
* سجل كامل للتغييرات.

---

## 3. Quality

قسم خاص بعمليات الجودة.

يشمل:

* Findings
* NCR
* RCA
* CAPA

مثال على دورة العمل:

`Inspection Failure → Finding → NCR → RCA → CAPA`

بحيث يتم متابعة المشكلة من اكتشافها حتى إغلاق الإجراء التصحيحي.

---

# 4. Quarantine

من أهم الأقسام الجديدة في النظام.

يتكون من:

### Quarantine Dashboard

يعرض حالة جميع المواد المستلمة، مثل:

* Pending
* Under Inspection
* Released
* Expired
* Hold
* Failed
* Awaiting Report
* Awaiting Review
* Release System = No

---

### Receiving Items

يتم تسجيل جميع المواد المستلمة.

البيانات الأساسية:

* Doc No
* Item Code
* Description
* Lot
* Qty
* Date
* Exp Date
* Status Inspection
* Release System Yes / No

ويضيف النظام تلقائيًا:

* Receiving ID
* Created By
* Created At
* Updated At
* Inspection Report
* Attachments
* Audit History

---

### Inspection Reports

يتم إنشاء تقارير الفحص من Templates جاهزة.

عند إنشاء التقرير من Receiving Item، النظام يعبئ تلقائيًا:

* Doc No
* Item Code
* Description
* Lot
* Qty
* Date
* Exp Date

ثم يقوم المستخدم بإدخال نتائج الفحص فقط.

التقرير يمر بدورة:

`Draft → Submit → Review → Approval`

---

### Quarantine Administration

صفحة خاصة بالـAdmin.

من خلالها يمكن إدارة:

* Inspection Templates
* إعدادات Quarantine
* Reference Lists
* Import Data
* إعدادات الحالات
* Administrative Corrections
* Archive

لكن حتى Admin لا يستطيع تعديل سجل معتمد بدون وجود أثر واضح في Audit Trail.

---

# 5. Laboratory Testing

قسم المختبر.

يشمل:

* إنشاء الاختبارات.
* إدخال نتائج العينات.
* استخدام Test Templates.
* ربط الاختبار بالمنتج.
* ربطه بالمعدات.
* تسجيل القياسات.
* Retest.
* Review.
* Approval.
* Attachments.
* Print / Export.

ويتم الاحتفاظ بنسخة من المعلومات المستخدمة وقت الاختبار حتى لا تتغير النتائج التاريخية لاحقًا.

---

# 6. Equipment / Calibration

قسم خاص بالمعدات.

يشمل:

* Equipment Register.
* Equipment Details.
* Calibration Records.
* Calibration Due.
* Calibration Overdue.
* Maintenance History.
* Equipment Status.

ويمكن ربط كل Lab Test بالمعدة المستخدمة أثناء الاختبار.

---

# 7. WI / SOP / Controlled Documents

قسم إدارة المستندات المضبوطة.

يشمل:

* WI
* SOP
* Versions
* Revisions
* Review
* Approval
* Superseded Documents
* Archived Documents

كل Revision يبقى محفوظًا.

مثال:

`WI-001 Rev 1 → Rev 2 → Rev 3`

ولا يتم حذف التاريخ السابق.

---

# 8. Reviews / Approvals / E-Signatures

قسم مركزي للمراجعات والاعتمادات.

المستخدم يرى جميع الأشياء التي تحتاج منه إجراء، مثل:

* Inspection Reports.
* Lab Tests.
* Documents.
* Change Requests.
* CAPA.
* Templates.

العمليات الحساسة يمكن أن تتطلب E-Signature.

مثل:

`Enter password → Verify identity → Verify permission → Approve`

---

# 9. Change Requests

أي تعديل مهم أو Controlled Data يمكن أن يتم من خلال Change Request.

يعرض:

* القيمة الحالية.
* القيمة المقترحة.
* السبب.
* مقدم الطلب.
* المراجع.
* القرار.
* وقت التطبيق.

وبعد الاعتماد يقوم النظام بتنفيذ التغيير مع تسجيل كامل.

---

# 10. Reports

قسم التقارير.

يشمل تقارير:

* Tasks
* Quality
* Quarantine
* Receiving
* Inspection
* Laboratory
* Equipment
* Calibration
* Documents
* Management

ويمكن التصدير إلى:

* CSV
* Excel
* PDF

كل أنواع التصدير تعتمد نفس البيانات ونفس الفلاتر حتى لا تختلف النتائج.

---

# 11. Administration

صفحة الإدارة قابلة للفتح ضمن نموذج الرؤية العامة للحسابات النشطة، لكن قراءة
projections الإدارية وتنفيذ mutations تبقى محكومة بالصلاحيات الخادمية. لا يكفي
وجود دور `Admin` وحده، ولا يمنح Admin صلاحية اعتماد أعمال الجودة أو صحة النظام.

يشمل:

* Users
* Roles
* Permissions
* Account Activation
* Password Reset
* Reference Data
* System Configuration
* Templates
* Security Settings

---

# 12. System Health / Backup / Recovery

`/system/health` و`/system/control-center` خاصتان بالحساب المسمى `yazeed` ذي
الدور `SYSTEM_OWNER`. كتالوج النسخ الاحتياطية ومساحات التعافي لها رؤية
مصادق عليها، بينما تنفيذ الاستعادة يحتاج use case وصلاحية وسياسة وهدفًا
معزولًا وتدقيقًا.

يعرض حالة:

* النظام.
* PostgreSQL.
* قاعدة البيانات.
* Migrations.
* Integrity.
* Audit.
* Backup.
* Storage.
* AI Provider.
* Deployment.

ويتم التفريق بين:

* Backup Created
* Backup Verified
* Restore Proven

بحيث لا نعتبر Backup ناجحًا فعليًا إلا إذا تم التأكد من إمكانية الاسترجاع.

---

# 13. AI Advisory

الذكاء الاصطناعي يكون مساعد فقط.

يمكنه:

* تلخيص تقرير.
* إبراز المخاطر.
* اقتراح أسئلة RCA.
* تلخيص المشاكل.
* تحليل الاتجاهات.
* إعداد Draft.

لكن لا يستطيع:

* Approve
* Reject
* PASS
* FAIL
* Release
* Sign
* تغيير سجل معتمد

القرار النهائي دائمًا للإنسان.

---

# قاعدة البيانات

النظام الجديد سيكون مبني من البداية على:

## PostgreSQL

وهي الأنسب بسبب:

* دعم عدة مستخدمين في نفس الوقت.
* Transactions قوية.
* أداء أفضل مع توسع البيانات.
* تقارير أقوى.
* Integrity أفضل.
* قابلية أكبر للتوسع مستقبلًا.

---

# الصلاحيات

النظام يستخدم صلاحيات مركزية.

لا يعتمد على إخفاء الأزرار فقط.

كل عملية يتم التحقق منها في السيرفر.

مثال:

الموظف قد لا يرى زر Approve، لكن حتى لو حاول الوصول للعملية مباشرة، السيرفر يمنعه.

---

# التتبع Audit Trail

أي عملية مهمة يتم تسجيلها.

مثل:

* من قام بها.
* ماذا فعل.
* على أي سجل.
* الحالة القديمة.
* الحالة الجديدة.
* الوقت.
* السبب.
* التوقيع إن وجد.

الهدف:

> القدرة على معرفة تاريخ أي سجل بشكل كامل.

---

# حماية السجلات المعتمدة

أي سجل أصبح:

* Approved
* Signed
* Closed
* Void
* Superseded

لا يتم تعديله بشكل عادي.

إذا احتاج تعديل:

* Correction.
* New Version.
* Void.
* Supersede.

مع Audit كامل.

---

# تجربة المستخدم

النظام مصمم حسب الدور.

الموظف يشوف المطلوب منه فقط.

السوبرفايزر يشوف ما يحتاج مراجعة.

المدير يشوف ما يحتاج اعتماد.

الـAdmin يشوف الإدارة والحالة التقنية.

وهذا يقلل الزحمة والتشتت.

---

# الاختبارات والجودة

أي Feature جديدة لا تعتبر مكتملة إلا بعد التحقق من:

* Business Rules.
* Permissions.
* Validation.
* Database.
* Audit.
* Error Handling.
* Accessibility.
* Security.
* Unit Tests.
* Integration Tests.
* Negative Tests.
* E2E.
* Documentation.

---

# الهدف النهائي

النظام النهائي لازم يحقق هذا السيناريو:

> المستخدم يدخل، يعرف مباشرة وش عليه، ينفذ عمله بسرعة، البيانات تتعبى تلقائيًا قدر الإمكان، يتم منع الأخطاء قبل وقوعها، المراجع يراجع، المدير يعتمد، وكل خطوة تبقى محفوظة وقابلة للتتبع.

والإدارة تقدر تعرف في أي وقت:

* وش دخل للمخزن؟
* وش اللي Pending؟
* وش اللي تحت الفحص؟
* وش اللي فشل؟
* وش اللي Released؟
* وش اللي لسه ما تم Release له في النظام؟
* وش التقارير المعلقة؟
* وش الأشياء التي تحتاج Approval؟
* وش المعايرات المتأخرة؟
* وش المشاكل المفتوحة؟
* ومن قام بكل إجراء؟

## الخلاصة

النظام سيكون **منصة تشغيل جودة متكاملة** تجمع:

**Tasks + Quality + Quarantine + Laboratory + Equipment + Documents + Approvals + Reports + Administration + Backup + AI Advisory**

في نظام واحد مبني على **PostgreSQL**، مع صلاحيات قوية، Audit كامل، Records Integrity، وواجهة مختلفة حسب دور كل مستخدم.
