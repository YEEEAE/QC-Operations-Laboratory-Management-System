# CA-05 — بوابة اعتماد التجربة قبل التعميم (pilots)

**حالة البرومبت: PARTIAL** (لا PASS ولا RELEASED).
المرشح: HEAD `b78534373bf25f1ac8288051d208bd6495167c6d` + شجرة عمل من 3 ملفات
(`.tmp/ca05.patch` SHA-256 `fa8f384400ff08d72681fabe5b2713747b2fcf723b8d8c01c15d4e32a7b0b809`).
Node `v24.20.0`، PostgreSQL 18.6 معزول على `localhost:55432/qc_disposable`،
Astro dev على `127.0.0.1:4331`. لا `.env` ولا مزوّد ولا اتصال إنتاج ولا commit/push/deploy.

المرجع A المثبّت: `audit/CA-00/reference/capa-a.{html,png}` (Stitch
`1787344711919595236` / screen `b93297bebbbd41c69aa4bbcbea0e3b6f`) مع استخراج
`audit/CA-01/reference-extraction.md`. المرجع **ليس** تخطيط لوحة/سجل/نموذج؛
العرض مُكيَّف بحسب نوع الصفحة، والقيم المرجعية هي الأساس اللوني والرقمي.

## 1. ما تغيّر فعليًا (عرض فقط، مشترك)

| الملف | التغيير | السبب المقاس |
| --- | --- | --- |
| `src/ui/styles/capa-a.css` | قاعدة الروابط العامة في `.app-main` استثنت روابط الأزرار (`.button`, `.link-button`, `.start`, `.action`, `.primary`, `.secondary`, `.controlled`, `.print-report`, `.empty-action`) | القاعدة كانت تعيد تلوين «Start correction» إلى `#A6C5F5` فوق `#92B8F2` ⇒ تباين **1.10:1** (فشل axe `color-contrast` على `.start` في صفحة تفاصيل الاستلام عند المقاسات الخمسة). بعد الإصلاح: `rgb(20,24,30)` على `rgb(146,184,242)` = **8.79:1** |
| `src/ui/components/data/FilterBar.astro` | `min-height: max(var(--control-height), 44px)` لمدخلات/محددات/زر/رابط «Clear» | زر «Apply filters» كان 40px ⇒ هدف دون 44px (مقاس) |
| `src/ui/components/data/DataTable.astro` | محدد «Row density» بنفس أرضية 44px | كان 40px ⇒ هدف دون 44px (مقاس) |

لم يتغير: `src/ui/shell/Sidebar.astro` (SHA-256 `973afdc935c684880b4a6f07a0f341270347fc3a1e43ecd20389e9dad6aeb818`، مطابق للـHEAD ولم يُمسّ)، ولا schema ولا API ولا قاعدة أعمال ولا سياسة ولا صلاحية ولا توقيع.

## 2. بوابة المعايير — نتيجة لكل معيار

| # | المعيار | النتيجة | الدليل | المرشح |
| --- | --- | --- | --- | --- |
| 1 | تنفيذ pilots الخمسة وقياسها على نفس البيانات | PASS | `audit/CA-05/after/evidence.json` | HEAD+patch |
| 2 | المقاسات 390/768/1440 ثم 320/1024 | PASS — overflow أفقي 0 في 25 فحصًا (5 صفحات × 5 مقاسات) | `after/evidence.json` → `pages.*.viewports[].overflow` |同上 |
| 3 | التكبير | PARTIAL — تكبير مكافئ للتخطيط (CDP device metrics: 720px/dsf2 و360px/dsf4) بلا overflow في 10 فحوص؛ **تكبير المتصفح الأصلي 200%/400% NOT RUN** | `after/evidence.json` → `zoom[]` |同上 |
| 4 | سجل موجود ومعبّأ | PASS — سجل مهمة `CA05-TASK-001` وسجل استلام `CA05-RCV-001` أُنشئا عبر النماذج المصرّحة ثم صُحِّحا في السجلين؛ لا إدراج مباشر في القاعدة | `prepared.json`، `after/states.json` → `taskRow` |同上 |
| 5 | نموذج بفشل تحقق | PARTIAL — رفض الخادم مثبت (0 صفوف) على المسار المحسّن (رسالة مصنّفة "Review the highlighted fields") وعلى المسار الأصلي (رسالة "result could not be confirmed")؛ **ربط الخطأ بالحقل على المسار الأصلي معطّل بسبب عيب سابق في مشترك النتيجة** (انظر §4) | `after/validation.json`، `after/evidence.json` → `noJs.taskValidation` |同上 |
| 6 | انقطاع قراءة | PASS — نوعان: (أ) إيقاف القاعدة كاملة ⇒ تحويل إلى `/login?returnTo=…` بلا بيانات ولا أصفار، واستعادة 200 بعد التشغيل؛ (ب) دور محدود بلا صلاحية `SELECT` على `qc.tasks` ⇒ «Tasks are temporarily unavailable … No records or count are shown» و«Dashboard data is unavailable» بينما تفاصيل الاستلام بقيت تُقرأ | `after/outage.json`، `after/read-outage.json` |同上 |
| 7 | حالة قرار مرفوضة | PARTIAL — حالة **مرفوضة (Not applied)** حقيقية في سجل الاستلام: «Not applied: “state” does not accept the value “NOT_A_STATE”. Nothing was filtered by these values.» بدور `status` مع بقاء السجل معروضًا؛ وحالة **قرار محجوب** في صفحة CAPA (PD-18، 0 نماذج/0 حقول داخل `#main-content`، رابطان فقط). **سجل قرار مرفوض على مستوى سجل قائم: NOT RUN/BLOCKED** (لا يوجد مصدر سلطان يجزم إنشاء سجل مرفوض) | `after/states.json` |同上 |
| 8 | نموذج CAPA بحفظ ناجح بعد أهلية مثبتة | **BLOCKED** — لا مصدر معتمد لمصدر الإنشاء/PD-18؛ لا نموذج إنشاء معروض ولا يُختلق. `capa.create` يرفض 403 `FORBIDDEN` صراحةً | `audit/CA-F-02/execution-status.md`، `after/evidence.json` → `capaGuard` |同上 |
| 9 | ضابط منع الحفظ عند غياب السلطة | PASS — `capa.create` ⇒ 403 FORBIDDEN؛ و`quarantine.releaseReceiving` على **سجل حقيقي** ⇒ 403 `AUTHZ_DENIED` (الموظف ليس جهة إصدار P-05) | `after/evidence.json` → `capaGuard`, `receivingGuard` |同上 |
| 10 | مقارنة Sidebar قبل/بعد (pixel/geometry/content + مرشّحات الصلاحيات) | PASS — المصدر مطابق، العرض مطابق (عرض 264px عند ≥768 و320/272px كدرج جانبي ≤760)، الروابط/الترتيب/الألوان/النص متطابقة، 14/14_stop تركيز بحلقة 2px. **فرق واحد متتبَّع**: ارتفاع صندوق الشريط على صفحة المهام +4px عند 768/1024 (امتداد عمود الشبكة بسبب أرضية 44px للزر في العمود المجاور) — ليس تغيّرًا بنيويًا. مرشّحات الصلاحيات: نفس 32 رابطًا لـadmin/employee/least (5 ظاهرة) بمجموعة hrefs متطابقة؛ لا يوجد ترشيح تنقّل حسب دور في النموذج الحالي | `before/evidence.json` مقابل `after/evidence.json` (`sidebarHash` لكل صفحة/مقاس)، `comparison.json` → `sidebar` |同上 |
| 11 | مجموعات النص والتباين والصفوف والحالة | PASS — لا نص تحت 12px في أي صفحة/مقاس؛ توزيع الأحجام مُسجّل (12/13/13.6/14/16/17/20/24/28)؛ أزواج التباين المقيسة ≥ 4.5:1 (h1 15.15:1، نص 12.12:1، muted 5.60:1، accent 8.79:1، رابط 10.11:1)؛ صفوف السجل: 1 صف مهمة + 1 صف استلام حقيقيان؛ حالات منفصلة: `PENDING` / `NOT_STARTED` / `NOT_RELEASED` | `after/evidence.json` → `sizes`, `contrast`, `rows`, `states` |同上 |
| 12 | الـfocus | PASS — 14/14 محطة تركيز في كل صفحة بحلقة outline صلبة 2px (skip link ← شريط ← روابط) | `after/focus.json` |同上 |
| 13 | وقت العرض | PASS كقياس فقط — 5 عينات دافئة لكل صفحة على خادم التطوير: وسيط before/after dashboard 136/160ms، tasks 80/117ms، tasks-new 129/104ms، receiving 94/91ms، capa-new 80/131ms. **لا يُدّعى أي تحسين** (نطاق الانحراف ±50ms؛ صفحة capa-new بلا أي عنصر من التعديل تحرّكت +51ms ⇒ ضجيج قياس) | `before/timing.json`، `after/timing.json` |同上 |
| 14 | axe على السطح | PASS — 0 مخالفة WCAG2A/2AA/2.1AA على 25 تركيبة (5×5) بعد الإصلاح؛ قبل الإصلاح كانت مخالفة `color-contrast` واحدة على `.start` في صفحة الاستلام عند المقاسات الخمسة | `after/evidence.json` → `axe[]` |同上 |
| 15 | لا-JS | PASS — `/tasks?q=` فلترة أصلية، صفحة تفاصيل الاستلام تُقرأ بلا JS، وPOST أصلي على `/tasks/new` يبقى في الصفحة | `after/evidence.json` → `noJs` |同上 |
| 16 | إصلاح المشترك ثم إعادة كل pilots | PASS — إصلاحان مشتركان ثم إعادة المقاسات/axe/اللقطة/الحالات/التركيز/الضبط لكل الصفحات الخمسة | `after/` كامل |同上 |
| 17 | فتح بقية الصفحات بعد نجاح فحوص النطاق | PASS — مسح 53 مسارًا ثابتًا (88 مسجّلًا − الديناميكية) عند 1440/390: **12 فرقًا فقط، كلها انخفاض في عدد الأهداف دون 44px** (assets×3، laboratory/tests، quarantine/receiving، tasks)؛ لا فرق في status أو overflow أو axe أو العنوان. صفر مخالفة axe بعد التغيير على كل المسارات | `before/sweep.json` مقابل `after/sweep.json` |同上 |
| 18 | انحدار الوحدة/البناء | PASS — مجموعة مركّزة (tests/unit/ui + tasks + registers): **14 فشلًا قبل و14 بعد، نفس الأسماء بالضبط** (كلها ع基本面 سابقة: `Documents/*.md` مفقودة وغيرها). `astro build` exit 0؛ `astro check` = 2 أخطاء سابقة في `audit/CA-P-500/*.astro` (خارج الملفات المعدّلة) + 128 hint؛ فحص حدود البنية: مخالفة سابقة واحدة `src/actions/ncr.ts`؛ فحص ملفات المسارات PASS؛ `git diff --check` PASS | سجلات الأوامر أدناه |同上 |

## 3. المرجع A مقابل المرشّح (لكل pilots)

| الدور (مرجع OBSERVED) | القيمة | المقاس في المرشّح | النتيجة |
| --- | --- | --- | --- |
| canvas | `#14181E` | `rgb(20,24,30)` | مطابق |
| panel | `#252B34` | `rgb(37,43,52)` | مطابق |
| text primary | `#E8EDF5` | `rgb(232,237,245)` | مطابق |
| text muted | `#9BA3AF` | `rgb(155,163,175)` | مطابق |
| accent | `#92B8F2` | `rgb(146,184,242)` | مطابق |
| accent hover | `#A6C5F5` | `rgb(166,197,245)` | مطابق |
| inverse على accent | 8.79:1 | 8.79:1 | مطابق |
| h1 | 24px | 24px | مطابق |
| حد أدنى لارتفاع الإجراء | 44px | 44px (كان 40px في زر الفلاتر) | مطابق بعد الإصلاح |
| card padding / max width | 32px / 720px | `var(--space-6)` / 720px | مطابق على بطاقة القرار |

**تكيف بحسب نوع الصفحة (مشتق، غير مرجعي):** لوحة = بطاقات مؤشرات + انتباه + سلسلة زمنية؛
سجل = جدول م densitý + شرائح مطبّقة؛ نموذج = عمود واحد حتى 768 وعمودان ≥960؛
تفاصيل = عمود قراءة واحد + لوحة إجراءات؛ صفحة قرار = بطاقة مركزية 720px. هذه
تكييفات نوعية لا تعيد إنتاج مرجع CAPA literal.

## 4. العيوب المؤكدة (موثّقة، خارج نطاق هذا البرومبت)

| العيب | الدليل | السبب | القرار |
| --- | --- | --- | --- |
| لا يوجد تحويل 303 بعد نجاح POST أصلي في نماذج المهمة/الاستلام: الصفحة تمرّر نتيجة `Astro.callAction` كاملة إلى `extractDetailId`، فتُعرض رسالة «result could not be confirmed» بدل التحويل | `after/evidence.json` → `noJs.taskValidation`، `after/validation.json` | `src/ui/forms/mutation-post.ts` + `src/pages/{tasks/new,quarantine/receiving/new}.astro` تستدعي `extractDetailId(data)` بينما `Astro.callAction` يعيد `{data,error}` — كما في `src/pages/quality/ncr/new.astro` (`extractDetailId(result.data)`) | **لم يُصلَح**: تغيير سلوك 15 صفحة POST خارج طبقة العرض، و«الفجوات الوظيفية» محصورة بـCA-F-* في هذا البرومبت. يُسجَّل كدين Dafault مفتوح |
| ربط خطأ الخادم بالحقل في المسار الأصلي لا يعمل (يُعرض خطأ عام/غير مؤكد بدل `aria-invalid` لحقل) | `after/validation.json` → `invalidFields: 0` | نفس خلل مطابقة النتيجة أعلاه | يُعالَج ضمن البند السابق |
| `src/actions/capa.ts:create` يرفض بلا فحص مصدر، والصفحة بلا نموذج | `after/evidence.json` → `capaGuard` | لا مصدر معتمد لمصدر الإنشاء (PD-16/PD-18) | BLOCKED — لا يُختلق معيار ولا دور |
| أهداف دون 44px باقية على صفحات خارج النطاق (admin/users 8، audit 7، help 4، laboratory/report-templates 5 …) | `after/sweep.json` | صفحات غير مُعتمدة في هذا البرومبت | تُفتح في التعميم اللاحق بالقواعد الثابتة أدناه |

## 5. ملاحظات تشغيلية على الأدلة

- **حدّ محاولات الدخول**: تشغيل عدّة بوابات متتالية في الدقيقة الواحدة يُصطدم بحدّ
  محاولات الدخول فتنتقل الجلسة إلى `/login` وتُفشل مرحلة المصفوفة (حدث ذلك مرة واحدة
  في هذه الجلسة). هو ضابط أمني قائم لا عيب عرض؛ الحل: فاصل 60–120 ثانية بين
  التشغيلات المتتالية.
- **خادم التطوير**: كل الأرقام الزمنية من `astro dev` (لا بناء إنتاج)؛ تُقرأ كقياس
  نسبي فقط.
- **الأدلة**: `audit/CA-05/before/screens/` (27 لقطة قبل) و`audit/CA-05/after/screens/`
  (36 لقطة بعد) على نفس الحساب (`verify-employee`) ونفس السجلين ونفس البيانات
  (`CA05-TASK-001`، `CA05-RCV-001`).
- **البيئة**: PostgreSQL 18.6 معزول على `localhost:55432/qc_disposable` (49 migration
  مطبَّقة، بذر foundation + verification fixtures، سجلان محليان عبر النماذج المصرّحة)،
  وخادم Astro dev أُوقف بعد جمع الأدلة؛ المجموعات موثّقة في `.tmp/ca04-fixture-env.json`
  (0600، غير متتبَّع).

## 6. أوامر التحقق (كلها محلية)

```sh
NODE=$HOME/.nvm/versions/node/v24.20.0/bin/node
$NODE audit/CA-04/local-run.mjs "$NODE" audit/CA-05/prepare.mjs
$NODE audit/CA-04/local-run.mjs "$NODE" audit/CA-05/gate.mjs after
$NODE audit/CA-04/local-run.mjs "$NODE" audit/CA-05/focus.mjs after
$NODE audit/CA-04/local-run.mjs "$NODE" audit/CA-05/validation.mjs after
$NODE audit/CA-04/local-run.mjs "$NODE" audit/CA-05/states.mjs after
$NODE audit/CA-04/local-run.mjs "$NODE" audit/CA-05/outage.mjs after
$NODE audit/CA-04/local-run.mjs "$NODE" audit/CA-05/read-outage.mjs after
$NODE audit/CA-04/local-run.mjs "$NODE" audit/CA-05/timing.mjs after
$NODE audit/CA-04/local-run.mjs "$NODE" audit/CA-05/sweep.mjs after
$NODE audit/CA-05/compare.mjs
$NODE node_modules/vitest/vitest.mjs run tests/unit/ui tests/unit/tasks tests/unit/registers
$NODE node_modules/astro/astro.js check
$NODE node_modules/astro/astro.js build
$NODE scripts/architecture/check-boundaries.mjs
$NODE --import=tsx scripts/architecture/check-route-files.mjs
git diff --check
```

## 7. الحالة النهائية للبوابة

- **العرض**: pilots الخمسة + 53 مسارًا آخر اجتازت المقاسات والتباين وأهداف اللمس والـfocus بلا انحداد، بعد إصلاح عيبين مشتركين مقاسين.
- **السلوك**: ضوابط الرفض (CAPA والإفراج) مثبتة على حساب مصادق وسجل حقيقي؛ حالات الفشل والفراغ والانقطاع مفصولة ولا تُعرض كأصفار.
- **ما يمنع PASS**: (أ) تكبير المتصفح الأصلي 200%/400% وقارئ الشاشة NOT RUN؛ (ب) حفظ CAPA بعد أهلية مثبتة BLOCKED بمصدر غائب؛ (ج) ربط خطأ الخادم بالحقل على المسار الأصلي معطّل بعيب مشترك سابق؛ (د) dashboard بلوحة/سلسلة معبّأة وسجل قرار مرفوض حقيقي غير متاح بمصدر معتمد.
- **PASS ≠ RELEASED**، و**APPROVED ≠ EFFECTIVE**. لا commit/push/merge/deploy ولا اتصال كتابة لإنتاج.
