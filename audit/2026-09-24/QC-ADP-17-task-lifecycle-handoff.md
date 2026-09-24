# QC-ADP-17 — رحلة المهام وحالاتها

## النتيجة

`PARTIAL / NO-GO` — نُفذ تحسين المصدر محليًا على المسارات الثلاثة وربطت البطاقة بهذا التقرير. لا تُعتمد أي بطاقة `READY`: اختبار PostgreSQL وE2E المصادق وUAT لم يكتملوا. لم تُضف migration، ولم يحدث commit أو push أو deploy.

## هوية المرشح والسياسة

- المستودع/الفرع: `main`; HEAD قبل التعديل `4f9ae0c4ab37eae186e8bb9435bcd99a192234ed`؛ تغييرات العمل غير committed.
- بصمة SHA-256 لملفات تنفيذ/اختبار المهمة الاثني عشر المذكورة أدناه (المسارات + المحتوى): `f6df4a1439754c295495157a4cb97205f97f5bf8ba234a664d54cea895d48302`.
- مصدر migration head: `0041_document_review_queue_indexes`; لم تُعدّل migration. لا يثبت هذا ما هو مطبق على أي قاعدة حية.
- قرارات المجال: حافظ التنفيذ على الصلاحيات والانتقالات الموجودة. `CANCEL` ما زال مرفوضًا. صلاحية `REOPEN` القائمة تُستخدم ولا تُمنح لأدوار جديدة؛ القرار `SD-002` بشأن سياسة إعادة الفتح/الإلغاء ما زال مفتوحًا. لا إثبات `SoD` خاص بالمهمة ولا اعتماد بشري جديد.
- Fixture المكتوب لاختبار PG: ممثل اصطناعي `EMPLOYEE`, scope=`OWN`, بصلاحيات task الحالية (`CREATE`, `VIEW`, `EDIT`, `BLOCK`, `COMPLETE`, `REOPEN`) من دون `ASSIGN`; وممثل ثانٍ `EMPLOYEE` يملك `COMPLETE/OWN` فقط لرفض النطاق. E2E المقصود حساب `yazeed` ضمن قاعدة محلية قابلة للتخلص، لكنه لم يتصل بسبب غياب إعدادات البيئة.

## مسار التنفيذ وأثره

`/tasks`, `/tasks/new`, `/tasks/[taskId]` → صفحة Astro وإجراء `actions.tasks.*` القائم → use case المهمة → `PostgresTaskRepository`/SQL → audit + outbox داخل معاملة الكتابة. قراءة التفاصيل تشترط `PERM-TASK-VIEW` والنطاق؛ قائمة المهام تقيد SQL إلى `OWN`, `ASSIGNED`, أو `GLOBAL` صريح. لأن سجل المهام لا يحمل مفتاح team/site/domain، النطاقات الأخرى لا توسع القراءة.

تُظهر الصفحات المالك والمكلّف والأولوية والموعد والحالة والنسخة والخطوة التالية، وسجل انتقالات مفهومًا؛ priority `UNSPECIFIED` يظهر `Not specified` دون تغيير التخزين. تعرض صفحة الإنشاء ملخصًا لما سيُحفظ: المالك هو الحساب الحالي، الحالة DRAFT، النسخة 1، والخطوة التالية Activate. أضيف سبب مطلوب لـHold وReopen، ورسالة تحقق تركّز حقل السبب. القراءة تعرض أسباب audit المسجلة ضمن تفاصيل المهمة.

مسار الاختبار المحدد: إنشاء DRAFT بالنسخة 1؛ ثم `ACTIVATE → OPEN/v2`, `START → IN_PROGRESS/v3`, `HOLD → ON_HOLD/v4`, `RESUME → IN_PROGRESS/v5`, `COMPLETE → COMPLETED/v6`, `REOPEN → IN_PROGRESS/v7`. يجب أن ينتج حدث إنشاء + حدث لكل انتقال، وأثر outbox مطابق. اختبارات PG/E2E التي تتحقق من هذا المسار موجودة لكن لم تُشغّل بنجاح؛ هذا وصف المتوقع من الكود والاختبارات، وليس trace لقاعدة فعلية.

معرّفات الطلبات في fixture: `task-create-${run}` للإنشاء و`task-${action.toLowerCase()}-${run}` لكل انتقال؛ الرفض يستخدم `task-denial-*`, `task-denied-scope-${run}`, `task-denied-stale-${run}`, و`task-denied-assignment-${run}`. لا توجد نتيجة request/DB فعلية لهذه المعرفات لأن fixture لم يبدأ.

## المقام المسبق ونتائج بطاقات الصفحات

سبعة فحوص منطبقة لكل route (21 إجمالًا)، محددة قبل التقييم:

1. تتبع مصدر الصفحة إلى action/use case/repository/SQL/audit/outbox.
2. نجاح الرحلة ببيانات محفوظة وتطابق الحالة والنسخة وسجل audit/outbox.
3. رفض scope/نسخة قديمة/تعيين غير مخول دون تغيير السجل أو التدقيق أو outbox.
4. إثبات actor/role/scope/permissions الفعلية على طلب مصادق.
5. الحالات populated/empty/error والخطوة التالية على الصفحة.
6. keyboard/focus/reflow ونصوص قبل/بعد على المتصفح.
7. قبول UAT البشري للقرارات التي تتطلب صاحب سياسة.

| Route / page card | Source trace | باقي الفحوص 2–7 | النتيجة |
| --- | --- | --- | --- |
| `/tasks` — RT-TASK-001 | PASS | BLOCKED / NOT VERIFIED | NOT VERIFIED / NO-GO |
| `/tasks/new` — RT-TASK-002 | PASS | BLOCKED / NOT VERIFIED | NOT VERIFIED / NO-GO |
| `/tasks/[taskId]` — RT-TASK-003 | PASS | BLOCKED / NOT VERIFIED | NOT VERIFIED / NO-GO |

الحساب: `PASS / المنطبق = 3 / 21 = 14.3%` لفحوص الأدلة المحددة فقط؛ هذه ليست نسبة جودة. أي بطاقة غير مغلقة تمنع READY كما هو مطلوب.

## الأدلة

- Unit + authorization: 3 ملفات، `11/11 PASS` (`tests/unit/tasks` و`tests/integration/tasks/use-cases.test.ts` و`tests/integration/tasks/authorization-matrix.test.ts`). تشمل تسلسل حالات use case، النسخة القديمة، ومنع التعيين دون `PERM-TASK-ASSIGN` قبل الكتابة.
- Astro check على Node `24.20.0`: `986 files`, `0 errors`, `0 warnings`, `88 hints`.
- PostgreSQL integration: `BLOCKED` قبل الاختبارات؛ Testcontainers لم يجد container runtime. النتيجة: 3 اختبارات skipped مع فشل suite setup، فلا تعد `PASS` ولا `FAIL` لسلوك قاعدة البيانات.
- Authenticated E2E: `BLOCKED` قبل السيناريو؛ Chromium تعطل في بيئة macOS sandbox (`MachPortRendezvousServer Permission denied`/`SIGTRAP`). كما أن `QC_VERIFY_SYSTEM_OWNER_PASSWORD` و`QC_TEST_DATABASE_URL` غير مضبوطين. انتهى release-evidence reporter كذلك لغياب verification-run context؛ لا screenshot أو نتيجة متصفح لهذه النسخة.
- لا قاعدة حية فُحصت ولا actor/role حي تحققنا منه. لا UAT؛ لا يوجد إقرار من صاحب قرار SD-002.

## الملفات والدليل

- التنفيذ: `src/modules/tasks/application/{get,list}.ts`, `src/modules/tasks/domain/{model,state}.ts`, `src/modules/tasks/infrastructure/postgres-repository.ts`, `src/modules/tasks/ports/repository.ts`, `src/pages/tasks/{new,index,[taskId].astro}`.
- التحقق: `tests/integration/tasks/{use-cases.test.ts,lifecycle.test.ts}`, `tests/e2e/tasks.spec.ts`.
- بطاقات الصفحات: [adaptive audit](../2026-09-24-ADAPTIVE-PAGE-BY-PAGE-FULL-SYSTEM-AUDIT.md) — RT-TASK-001/002/003؛ route registry: `Documents/ROUTE-MATRIX.md`.
- Before/After نص priority: `UNSPECIFIED` → `Not specified` (نص واجهة فقط؛ لا تغيير لقيمة المجال). لا لقطة قبل/بعد: المتصفح لم يصل للسيناريو.

## الخطوة اللازمة لإغلاق البطاقات

على runner مع PostgreSQL 18/Testcontainers وChromium وصلاحية fixture معتمدة: شغّل اختبارات lifecycle PG، ثم E2E المصادق مع نجاح ورفض scope/assignment/version، واحفظ trace متصلًا بمعرّفات الطلب، وافحص empty/populated/error وkeyboard/focus/reflow واللقطات لكل route. يبقى UAT وقرار Reopen/Cancel عند مالك السياسة؛ لا توسع grants لتنفيذ هذا handoff.
