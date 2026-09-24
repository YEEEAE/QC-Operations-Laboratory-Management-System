# QC-ADP-08 — مصفوفة الأدوار والحالات

**الحالة: PARTIAL / BLOCKED / NO-GO.** ثبت GET ورفض POST عبر HTTP لصفحة `/tasks/[taskId]` واحدة على المرشح؛ لم تغطَّ بقية البطاقات الـ89 ولا شروط قبول هذه الصفحة كاملة.

## المرشح والنطاق

- HEAD: `069bebfcaca57ba6f0c9a278e33b4462ca8f83ad`، branch `main`، وworking tree غير نظيف بسبب تغييرات المهمة.
- migration head من المصدر: `0041_document_review_queue_indexes`.
- نسخة البناء: `dist/server/entry.mjs` SHA-256 `ed8b8f2ef6174e65c7fa2f72572fcbf44d04dcfd80f5144971a16da84253c6bb`، release identity `rel-fe87abce1b96cf1e` (test، dirty=true).
- النطاق المطلوب: 90 بطاقة في القسم 25 من `audit/2026-09-24-ADAPTIVE-PAGE-BY-PAGE-FULL-SYSTEM-AUDIT.md`، مع findingَي `QC-PAGE-F-009` و`QC-PAGE-F-018`.

## المقام والقبول

خمسة أنواع فحص على 90 بطاقة تعطي **450 خانة تخطيطية إجمالية** فقط. هذا ليس مقامًا معتمدًا: يلزم أولًا تثبيت فحوص كل بطاقة وفق معيارها ومصدرها، وتبرير N/A لكل route من العقد. لا نسبة جودة محسوبة ولا بطاقة READY. في `/tasks/[taskId]` فقط: GET positive وPOST denial مثبتان؛ بقية فحوص البطاقة والبطاقات الـ89 الأخرى NOT VERIFIED/BLOCKED.

الأنواع المقترحة للتخطيط: GET ناجح على fixture؛ حد قراءة النطاق؛ POST مسموح مع تحقق الكتابة والتدقيق؛ POST مرفوض مع تحقق عدم التغيير؛ وإبطال الصلاحية/تعارض version أو state. لا يُحسب status code وحده، ولا يُقبل أي 4xx دليلًا على التفويض.

## السبب الجذري والتغييرات

- probe في `tests/e2e/authenticated-closure.spec.ts` كان يرسل `quarantine.approveInspection` بمعرّف UUID لا يقابله سجلًا، ويقبل أي 4xx. ترتيب التنفيذ في `src/modules/quarantine/inspection/application/approve-inspection.ts` يقرأ السجل قبل فحص الدور، لذلك لا يثبت probe رفض التفويض.
- `tests/integration/actions/server-contract.test.ts` أضيف له سيناريو task حقيقي: إنشاء DRAFT بدور مسموح، رفض START لدور read-only بخطأ `errors.authz_permission_missing`، قبول التفعيل إلى OPEN/version 2، ثم رفض START بversion قديم بخطأ conflict والتحقق من الحالة المخزنة.
- `scripts/verification/seed-verification-fixtures.ts` يضيف سجل task disposable ثابتًا مربوطًا بـ`verify-least`، ويتحقق عند التكرار من الهوية/المالك/state/version بدل تجاهل تعارض fixture. هوية fixture لا تلمس `yazeed`.
- `scripts/verification/run-authenticated-e2e.ts` يقبل الآن `QC_TEST_DATABASE_URL` فقط لـlocalhost/loopback مع `sslmode=verify-full` و`sslrootcert`، وإلا يبقى Testcontainers هو المسار الافتراضي. أضيف اختيار تشغيل سيناريو QC-ADP-08 منفردًا عبر `QC_ADP08_AUTHORIZATION_ONLY=true`.
- أزيل POST الوهمي من `authenticated-closure.spec.ts` واستُبدل بـGET للـtask fixture وPOST مباشر إلى `/_actions/tasks.transition`. مشغل الاختبار يولّد token عشوائيًا قصير العمر ويربط hash بجلسة `verify-least` في قاعدة disposable؛ المتصفح يرسل cookie عبر middleware الحقيقي. الاختبار يثبت marker الصفحة، غياب زر التفعيل، `errors.authz_permission_missing`، ثبات DRAFT/version 1، وعدم إضافة audit event للسجل.
- `tests/e2e/authorization-matrix.spec.ts` يثبت جلسة عدم المصادقة فقط؛ فحوص UUID البديلة و4xx فيه لا تثبت حدود الدور/النطاق ولا تحتسب ضمن مصفوفة QC-ADP-08.

## الأدلة على المرشح

- PostgreSQL: `PostgreSQL 18.6 (Homebrew)` في cluster وقواعد اختبار disposable فقط، مع TLS موثق. schema head `0041_document_review_queue_indexes`. لم يُلمس مصدر حي أو production.
- `tests/integration/actions/server-contract.test.ts`: **7/7 PASS** بعد التعديل.
- تسع مجموعات تكامل مصادقة/نطاق سابقة على PG18: **23/23 PASS** (أدوار الهوية والإدارة والمهام والحجر والجودة والأصول والوثائق والموافقات). هذه اختبارات تكامل وليست HTTP/browser proof.
- `npm run typecheck`: **0 أخطاء، 0 تحذيرات، 89 hints** (على آخر source).
- `npm run build`: **PASS** على HEAD أعلاه؛ تحذيرات bundler/chunk موجودة. artifact digest مثبت في هوية المرشح أعلاه.
- Playwright المستهدف: `QC_ADP08_AUTHORIZATION_ONLY=true`، **1/1 سيناريو قبول PASS، 0 FAIL، 0 skip** (تقرير runner يحصي كذلك صف project-count: الإجمالي 2 PASS). GET `/tasks/<fixture>` ثم POST مصادق؛ denial code والصف/audit قبل وبعد مطابقان. report `.ci-results/authenticated-e2e-evidence.json`، testRunId `31a76850-a62d-49e0-b882-2605c245bade`.
- هذه الجلسة الاصطناعية تثبت middleware/action authorization، ولا تثبت تدفق كلمة المرور أو انتهاء/إبطال الجلسة. مجموعات E2E أوسع أظهرت إخفاقات login/accessibility سابقة؛ لا تستخدم كإغلاق لهذه الصفحات.

## القرار والتسليم

- لم يتغير أي قرار منتج أو مالك صلاحية. بطاقات routes المؤجلة تبقى BLOCKED حتى اعتماد قرارات المالك المذكورة ببطاقاتها؛ بقية البطاقات NOT VERIFIED حتى دليلها الخاص.
- رُبط الدليل بـ`/tasks/[taskId]` واختبار `QC-CLOSURE-E2E-006` و`server-contract.test.ts` والتقرير أعلاه، لكن لم تُحدّث بطاقات القسم 25. لا route acceptance مكتمل بالكامل ولا finding أُغلق.
- لا تغلق `QC-PAGE-F-009` أو `QC-PAGE-F-018`، ولا تعلن READY أو نسبة جودة. الخطوة التالية: إصلاح/عزل تعثر Playwright login على المرشح، إثبات سيناريو task HTTP مباشرة، ثم بناء fixture/action catalog route-specific وتعبئة كل بطاقة ومقامها على SHA واحد. لا commit أو push أو نشر.
