## [2026-09-04] — تقرير تفصيلي لقسم /lab في qc-task-manager (قراءة فقط، بدون تعديل كود)

### تم التنفيذ
- جردت قسم المختبر بالكامل: 48 صفحة Astro (10,861 سطرًا، 672KB) موزعة على 13 وحدة، و37 ملفًا في `lib/lab` (~15,400 سطر)، و11 مكونًا في `components/lab` (~2,735 سطرًا).
- تحققت من الـroute-manifest: 47 مسار `/lab/*` + 8 مسارات `/api/lab/*` = 55 مسار مختبر، كلها ملفّقة في القناع (manifest) بدون مسارات ميتة.
- وثقت الالتزامات المعمارية المطبقة: فلترة RBAC في طبقة lib (`navigation.ts` عبر 87 دالة `can*Lab`)، صفر SQL داخل الصفحات، 18+ Zod schema للمختبر، وحواجز immutability لسجلات APPROVED/VOID.
- حصرت التغطية الاختبارية: ~29 سكربت `test:lab-*` + 16 سكربت `e2e-lab-*`.

### الملفات المتأثرة
- `.agents/mind/01-mind-latest.md` (هذا السجل فقط — لا تعديل كود)

### التحقق
- `route-manifest.mjs` ✅ قراءةً — 47/8 مسارات lab/API
- `git status` على مجلدات lab الثلاثة ✅ نظيف — كله ملتزم في HEAD `394be485`

### النتيجة
- **الحالة:** نجح (مهمة تقرير فقط)
- **مختصر:** قسم المختبر مكتمل البنية (55 مسارًا) بنمط معماري موحد ومغطى اختباريًا؛ أكبر ملفات هي `tests.ts` (1,203 سطرًا) و`LabTestForm.tsx` (1,436 سطرًا) كملكية موثقة بقرار المالك.

### ملاحظات / مشاكل مفتوحة
- لا شيء جديد؛ المشاكل المفتوحة المعروفة (UAT البشري، e2e-search P0) مسجلة في سجلات سابقة.


## [2026-09-04] — CLOSURE: تكامل سلامة السجلات والتوقيع الإلكتروني (E-Records / Auditability)

### تم التنفيذ
- حُسمت بنية الأدلة: `login_attempts` لمحاولات المصادقة/الأمن فقط، و`qc_audit_log` كسجل الأعمال الكنسي الوحيد، و`lab_test_approvals` كختم snapshot/action immutable؛ ما انضاف أي audit log ثانٍ.
- صُحّح `src/lib/lab/esignature.ts`: كلمة المرور الفاضية/المفقودة ترجع `invalid` وتُعدّ وتُسجّل كمحاولة فاشلة؛ `rate_limited` يرجع فقط عند وجود lockout سابق، مع تسجيل المحاولة المرفوضة.
- توسّع ختم `lab_test_approvals` بحقل `action` (`APPROVAL`/`VOID`) مع ترقية runtime آمنة للقواعد القديمة، وصار لكل موافقة/VOID ناجح actor + action + signature meaning + timestamp + serialized snapshot + SHA-256 hash.
- أُضيفت حواجز runtime تمنع تعديل/حذف سجلات lab `APPROVED`/`VOID`، نسخ المستندات `APPROVED`/`SUPERSEDED`/`ARCHIVED`، نسخ القوالب `APPROVED`/`SUPERSEDED`، وسجلات `qc_audit_log` التاريخية؛ وأُصلح backfill ليتجنب no-op UPDATE على سجل genesis.
- أُنشئت وثيقة `ELECTRONIC-RECORDS-INTEGRITY.md` ومصفوفة coverage محدثة للدومينات: Data Integrity, Records Integrity, Auditability, Traceability, E-Signature, Data Lineage, State Machine.
- أُضيفت سويتة `test:records-integrity-100` المسجلة بالمانيفست، وتغطي credential outcomes، SoD، role bypass، stale state، double approval، replay، terminal mutations، historical metadata، retention/deletion، backup/restore، وسلسلتي التدقيق.

### الملفات المتأثرة
- `apps/qc-task-manager/src/lib/lab/esignature.ts`
- `apps/qc-task-manager/src/lib/qcWorkflow.ts`
- `apps/qc-task-manager/src/lib/audit/qcChain.ts`
- `apps/qc-task-manager/src/lib/lab/{tests,documents,templates}.ts`
- `apps/qc-task-manager/scripts/test-records-integrity-100.mjs`
- `apps/qc-task-manager/docs/ELECTRONIC-RECORDS-INTEGRITY.md`
- `apps/qc-task-manager/docs/FINAL-100-DOMAIN-COVERAGE.md`

### الأرقام / التحقق
- `test:records-integrity-100` ✅ **31/31**؛ `test:e-signature-integrity` ✅ **8/8**؛ `test:lab-esignature` ✅ **16/16**؛ `test:qc-compliance-100` ✅ **16/16**.
- `test:audit-integrity` ✅؛ `test:lab-documents` ✅ **303/303**؛ `test:lab-templates` ✅ **51/51**؛ `test:lab-review` ✅ **97/97**.
- `test:database-100` ✅ **23/23**؛ `test:production-operations` ✅؛ `test:schema-reference` ✅ **166 object**؛ embedded migration parity ✅ **40/40**.
- `test-manifest-guard` ✅ **89 canonical + 28 E2E**؛ `route-manifest --check` ✅ **115/25/6**؛ `astro check` ✅ 0 errors / 2 hints معروفة؛ `astro build` ✅.
- ما صار commit أو push أو deploy. HEAD وقت التحقق: `9e3e70ed86193277dcf3b91dea41518e9677759b`.

### النتيجة
- **الحالة:** نجح لنطاق سلامة السجلات والتدقيق والتوقيع الإلكتروني محليًا.
- **مختصر:** كل محاولات التلاعب المطلوبة انرفضت حسب السياسة، والأدلة التجارية صارت منفصلة عن محاولات كلمة المرور وقابلة للتحقق بعد restore؛ UAT البشري والتحقق على قاعدة الإنتاج ما زالوا مفتوحين.

### ملاحظات / مشاكل مفتوحة
- الدليل لا يدّعي وحده الامتثال التنظيمي للتوقيع الإلكتروني؛ يلزم اعتماد سياسة identity proofing/retention وUAT بشري قبل أي claim تنظيمي.
- خطا P0 في acceptance الكامل (بحث `e2e-search`) والدومينات المحجوبة سابقًا ما عولجت ضمن هذه المهمة.
- تحذيرات WI catalog collisions وbackup catch-up في قواعد الاختبارات المعزولة ظهرت من السلوك التشغيلي الموجود، ولم تفشل أي بوابة.

## [2026-09-04] — CLOSURE: إغلاق مشكلة نقل التقارير وعقد المسار (tracked-source absence ⇎ PASS)

### تم التنفيذ
- أعيد إنتاج الدليل المدّعى من الشجرة الحالية قبل تصديقه: نقل `/api/reports/[reportType].[format].ts` و`audit.ts` **موجود على القرص ويخدم فعليًا** (يعيد استخدام catalog/filters/scope/authorization/queries/كتابة csv/xlsx/pdf/تدقيق report_audit_log كاملة) لكنه **غير متتبع في git** — السبب الجذري: نمط `.gitignore:88` غير مثبَّت `reports/` يطابق أي مجلد اسمه reports بأي عمق فحوّل `src/pages/api/reports/` لمغمور لا يمكن commit أبدًا، بينما route-manifest (فاحص قرص) كان يمر محليًا — هذا هو التعارض "غياب المصدر المتتبع + PASS تاريخي".
- ثبّتُّ النمط إلى `/reports/` (مثبَّت للجذر — مجلد المخرجات المولّدة فقط) فصار ملفا النقل قابلين للتتبع، وأضفتهما للفهرس (`git add` — بدون commit، الالتزام على المستخدم).
- **عزّزت `route-manifest.mjs`**: `REQUIRED_API_ROUTES` الأربعة لازم يدعمها ملف مفعّل **متتبع في git** (`git ls-files --full-name`) — مو مجرد موجود على القرص؛ اختبرت سلبيًا: فشل فوري عند إلغاء التتبع، وفشل عند إعادة النمط القديم، ونجاح فقط مع مصدر متتبع.
- أنشأت سويتة كنسية جديدة `test:reports-transport` (124 فحصًا، مسجلة بالمانيفست 87→88): تمنع أي نمط gitignore غير مثبَّت اسمه reports، تتحقق أن كل مسار مطلوب متتبع، تمنع بناء محرك SQL ثانٍ داخل المحوّل، وتثبّت عقد الأمان (requireApiUser، تحقق النوع/الصيغة/الفلاتر، scope خادمي عبر resolveReportContext وparseReportScope، لا بناء مسارات من مدخلات المستخدم، أنواع محتوى آمنة، Content-Disposition attachment من النوع الكتالوغي فقط، no-store، apiJsonError بلا تسريب).
- **وسّعت `e2e-reports.mjs` بتحقق عميق من الملفات المولّدة فعليًا**: تحليل CSV كامل (BOM + تطابق عناوين الكتالوج حرفيًا + RPT-ids)، فتح XLSX برمجيًا بـExcelJS (workbook + ورقة Report + العناوين + عدد الصفوف + تكافؤ بيانات الصف الأول مع CSV مع استثناء عمود Report ID المتغير لكل تنزيل ومعالجة اقتصاص ExcelJS للخلايا الفارغة الذيلية)، وفحص بايتات PDF (%PDF-1.4 + %%EOF + عدد الصفحات + تضمين الخط + Info) — على كل الأنواع الـ24.
- **نتيجة الشريحة الحية**: e2e-reports بمفرده في نفس بيئة الـrunner (سيرفر إنتاج + قاعدة معزولة): **1186 فحصًا ناجحًا / 0 فاشل / exit 0** — تغطي كل مصفوفة الأمان المطلوبة: anonymous→302، كل الأدوار، employee نطاق own فقط (manager-only مستبعد)، تزوير scope=organization→403، تزوير نطاق lab→403، نوع/صيغة غير صالحة→404، فلاتر وتواريخ غير صالحة→400، param غير مدعوم→400، التدقيق ينشأ لكل تنزيل ويُرى حسب الدور، أسماء الملفات وأنواع المحتوى صحيحة.

### الملفات المتأثرة
- `.gitignore` (نمط reports/ ← /reports/)
- `apps/qc-task-manager/src/pages/api/reports/[reportType].[format].ts` + `audit.ts` (ملفات النقل — أصبحت متتبعة)
- `apps/qc-task-manager/scripts/route-manifest.mjs` (شرط التتبع + إزالة تكرار)
- `apps/qc-task-manager/scripts/test-reports-transport.mjs` (جديد، كنسي)
- `apps/qc-task-manager/scripts/e2e-reports.mjs` (تحقق عميق من الملفات)
- `apps/qc-task-manager/{scripts/test-manifest.mjs,package.json}` (تسجيل السويتة)
- `apps/qc-task-manager/docs/FINAL-100-DOMAIN-COVERAGE.md` (6 دومينات + توزيع الحالات)

### الأرقام
- سويتات كنسية: **87 → 88** (orphan-free) · route-manifest: 115/25/6 مع شرط تتبع جديد
- e2e-reports: **1186/0** (كان ~240 فحصًا قبل التحقيق العميق)
- typecheck: 0/0/2 hints (المعروفة) · بناء إنتاجي: Complete 9.94s

### القرارات
- **ما بُني محرك تقارير ثانٍ**: النقل الموجود محليًا هو المحوّل الكنسي الصحيح (أعاد استخدام كل مكوّنات المحرك) — المشكلة كانت تتبعه لا وجوده، فالإصلاح تتبّع + تحصين بوابات.
- **git add بدون commit**: التتبع شرط لعملية الإغلاق والبوابة الجديدة، والـcommit النهائي على المستخدم (القاعدة الثانية).
- **استثناء عمود Report ID من مقارنة CSV↔XLSX**: كل تنزيل يولّد RPT-uuid خاصًا فيه — تصميم مقصود للتدقيق، مو عيب بيانات.

### التحقق
- `pnpm typecheck` ✅ 0/0/2 · `test:route-manifest` ✅ · `test:reports-transport` ✅ 124/124 · `test:manifest` ✅ 88+28 orphan-free
- `pnpm test` ✅ **88/88 exit 0** · `NODE_ENV=production pnpm build` ✅
- `e2e-reports` منفردة ✅ **1186/0 exit 0** (بيئة runner مطابقة)
- `pnpm e2e:acceptance` ❌ **لا يزال أحمر عند السويتة 9/28 (`e2e-search` = P0-1/P0-2 المعروف)**: 8 سويتات خضرا قبله (admin-users→backup) ثم 35 ناجح/4 فاشل + timeout عند Next — نفس الانهيار الموثق بالعقد، **غير مرتبط بالتقارير** (الشريحة أثبتت خضرها بمعزل عنه)

### النتيجة
- **الحالة:** نجح لنطاق المهمة (نقل التقارير مُغلق ومُتحقق) — بوابة القبول الكاملة تبقى حمرا بسبب P0-1/P0-2 الموروث (خارج نطاق هذه المهمة حسب العقد §3/§9: إصلاحها CLOSURE-01 ويتطلب قرارًا منتجيًا في per=10)
- **مختصر:** التعارض "غياب مصدر متتبع + PASS تاريخي" صار مستحيلًا بنيويًا: النمط مثبَّت، الملفات متتبعة، الحارس يفشل مع أي إلغاء تتبع، والملفات المولّدة نفسها تتفتح وتتحقق بايتًا-بايتًا في كل قبول.

### ملاحظات / مشاكل مفتوحة
- تحديثات التغطية: #12/#13/#34/#73 → TEST_VERIFIED، #74 → RUNTIME_VERIFIED، #1/#54 تبقى BLOCKED بدليل طازج.
- الـcommit (بما فيه ملفا النقل والـgitignore والسكربتات) على المستخدم.
- لا push ولا deploy.


### تم التنفيذ
- قرأت العقل كاملًا + AGENTS.md (النسختين) + CLAUDE.md + README.md + SECURITY.md + package.json لتطبيق QC، وجردت المهارات (366 مجلد مهارة مقابل 365 في skills-lock.json) وقرأت مهارات Superpowers الأربع المعتمدة للإصلاحات (systematic-debugging, test-driven-development, verification-before-completion, requesting/receiving-code-review).
- جمّدت الواقع: HEAD `394be485` على `main`، تعديل متتبع واحد (هذا الملف)، 3 ملفات untracked سابقة (الدليل 14 + تقرير 15 + prompt11)، وصفر تعديل على كود المنتج — الشجرة الحالية هي المرجع ولا تُهمل.
- أعدت تشغيل بوابتي القراءة فقط طازجًا: `route-manifest --check` PASS (115 مسار ملف / 25 وسيط / 6 حراس) و`test-manifest-guard` PASS (87 سويتة كنسية / 28 E2E بدون يتيمة) — هذي المراسي الطازجة الوحيدة؛ كل PASS تاريخي آخر ما يُعتبر دليلًا.
- أنشأت `apps/qc-task-manager/docs/FINAL-CLOSURE-CONTRACT.md`: عقد إلزامي لكل مهام الإغلاق الجاية — baseline مجمّد، قواعد الثقة (المصدر+DB+الوقت الحالي فقط)، الـP0-1/P0-2 بجذورهما، الثوابت الـ17 للمشروع، بوابات التحقق الإلزامية، سلّم حالات الدومين، وبروتوكول المهارات.
- أنشأت `apps/qc-task-manager/docs/FINAL-100-DOMAIN-COVERAGE.md`: جدول الـ100 دومين كاملًا (الهدف 100% لكل دومين) مع مناطق التنفيذ والمهارات والسويتات الكنسية والدليل المطلوب والفجوة الحالية والحالة — **صفر PASS**: 95 UNVERIFIED + 2 SOURCE_VERIFIED (#11 معمارية، #13 معمارية اختبارات — بمراسي هذه الجلسة) + 3 BLOCKED (#1 V&V، #54 متجاوب، #73 طباعة/PDF — محجوبة بانهيار acceptance عند P0).
- ما أصلّح أي ملاحظة خارج نطاق المهمة عمدًا — المهمة baseline توثيقية فقط.

### الملفات المتأثرة
- `apps/qc-task-manager/docs/FINAL-CLOSURE-CONTRACT.md` (جديد)
- `apps/qc-task-manager/docs/FINAL-100-DOMAIN-COVERAGE.md` (جديد)
- `.agents/mind/01-mind-latest.md`

### التحقق
- `route-manifest --check` ✅ 115/25/6 (طازج بهذه الجلسة) · `test-manifest-guard` ✅ 87/28 (طازج)
- Node `v22.22.3` · pnpm `10.19.0` · `git status/diff` مجمّدة وموثقة بالعقد
- build/test/E2E الكاملة: لم تُشغّل — مهمة baseline توثيقية، والـE2E معروف أنها حمرا عند `e2e-task-search` (P0-1/P0-2) من تحقق 016 المستقل بتاريخ اليوم

### النتيجة
- **الحالة:** نجح (baseline) — برنامج الإغلاق قد يكمل بأمان؛ المهمة الأولى بعد الـbaseline هي إصلاح P0-1/P0-2 بـTDD ثم acceptance كاملة 28/28 + persistence
- **مختصر:** صار للإغلاق النهائي عقد ملزم ولوحة 100 دومين بصفر PASS ومراسي طازجة، والطريق مرسوم: P0 → acceptance خضرا → الموجة البشرية/التشغيلية حسب worksheets الـ015.

### ملاحظات / مشاكل مفتوحة
- لا commit ولا push ولا deploy — الشجرة جاهزة لمراجعة المستخدم.
- إيصالات تدوير الأسرار + UAT + staging كلها صفوف مالك/مشغّل مفتوحة كما في الدليل 14.
- قرار منتجي مطلوب قبل إصلاح P0-2: إما إعادة قبول `per=10` لسجلات البحث أو إعادة كتابة السيناريو D على 25 مع fixtures أكبر.

## [2026-09-04] — QC-FINAL-100-016: التحقق النهائي المستقل وإعادة التسعير (الحكم: NO-GO)

### تم التنفيذ
- أعدت تشغيل كل البوابات طازجة عند HEAD `394be485` بدون تعديل أي كود منتج: typecheck 0/0/2 hints، build إنتاجي Complete، manifests (87 suite + 28 E2E، routes 115/25/6)، parity هجرات 40/40، schema-ref 166، DATABASE-100 23/23، والمجمّع الكامل 87/87 exit 0.
- اكتشفت P0 حقيقيًا: قبول E2E ينهار عند سويت البحث (35 نجح/4 فشل ثم timeout) — نص `13 tasks found` متقادم غير موجود بالمصدر + `per=10` مرفوض من `SEARCH_PAGE_SIZE_OPTIONS=[25,50,100]` فلا زر Next — و~19 سويت ومرحلتا persistence لم تُنفّذ. السبب الجذري موثق file:line (انحدار من توحيد pagination في ARCHITECTURE-002).
- أعدت تسعير 34 دومينًا بالقاعدة المطلقة: 11 دومين آلي 100%، الإجمالي الصارم 76% (مقابل 73.50% بتقرير 09-02)، وصفر دومين بشري/خارجي 100%.
- أنشأت `audit/qc/QC-Task-Manager/15-FINAL-100-PERCENT-SYSTEM-REPORT.md` بكل الأقسام المطلوبة (ملخص، baseline مجمّد، لوحة 34، أدلة، P0/P1/P2/P3، claims-vs-reality، ledger، حكم).

### الملفات المتأثرة
- `audit/qc/QC-Task-Manager/15-FINAL-100-PERCENT-SYSTEM-REPORT.md` (جديد)
- `.agents/mind/01-mind-latest.md`

### التحقق
- full unit ✅ 87/87 exit 0 · build ✅ · typecheck ✅ 0/0/2 hints · manifests/parity/schema/DB/prod-ops/deploy-contract ✅
- E2E acceptance ❌ ينهار عند `e2e-task-search` (P0-1/P0-2) — 8 سويتات (557 assertion) خضرا قبله
- UAT بشري/AT/staging/restore حي/telemetry/rotation: صفر — كما في 015

### النتيجة
- **الحالة:** NO-GO — بوابة الإطلاق حمرا + كل الأدلة البشرية صفر
- **مختصر:** الإجمالي الصارم 76%؛ الطريق لـ CONDITIONAL GO: إصلاح P0-1/P0-2 ثم acceptance أخضر 28/28 ثم staging ثم worksheets الـ015.

### ملاحظات / مشاكل مفتوحة
- لم أصلّح الـP0 عمدًا (مهمة تحقق مستقلة — الإصلاح يفقد الاستقلالية ويتطلب إعادة تشغيل كاملة).
- سجلات `/tmp/qc-final-{full,e2e}.log` محلية للجلسة — قابلة لإعادة الإنتاج بالأوامر الموثقة.
- لا commit ولا push ولا deploy.

## [2026-09-04] — QC-100-OPERATIONS-015: الإغلاق التشغيلي البشري (staging/UAT/backup/telemetry/security)

### تم التنفيذ
- أنشأت `apps/qc-task-manager/14-OPERATIONAL-100-EVIDENCE.md` كملف إغلاق صريح يفصل الدليل الآلي المحلي عن الصفوف البشرية — بدون فبركة: صفر جلسات UAT مدّعاة وصفر نشر staging وصفر telemetry إنتاجية.
- وثقت هوية البناء المدقق محليًا: HEAD `394be485`، هجرات 40 (parity 40/40 sha256)، عقد النشر 22/22، وDATABASE-100 23/23 — كلها أُعيد تشغيلها بتاريخ 2026-09-04.
- جهزت جداول UAT فارغة للأدوار الأربعة (26 سيناريو من `docs/PILOT-UAT.md`) + 5 أبعاد وصول، وقوائم توقيع المشغّل لـ staging والنسخ/الاستعادة والـtelemetry وتدوير الأسرار.
- سجلت حالة الأسرار بقراءة فقط: لا مفاتيح في `~/.claude/settings.local.json` حاليًا ولا أسرار مضمّنة بالريبو، لكن إيصالات التدوير (Anthropic/Semrush/admin) بانتظار المالك — بدون كتابة أي قيمة سرية.
- رصدت drift توثيقي غير حاجب: مثال `schemaVersion: 38` في DEPLOYMENT.md مقابل 40 الفعلية.

### الملفات المتأثرة
- `apps/qc-task-manager/14-OPERATIONAL-100-EVIDENCE.md` (جديد)
- `.agents/mind/01-mind-latest.md`

### التحقق
- `test-deployment-contract` ✅ 22/22 (أُعيد التشغيل)
- `test-embedded-migration-parity` ✅ 40/40
- `test-database-100` ✅ 23/23 (أُعيد التشغيل)
- `test-production-operations` ✅ (أُعيد التشغيل)
- build/staging-deploy/UAT/telemetry: لم تُنفّذ — بانتظار المشغّل والمالك

### النتيجة
- **الحالة:** جزئي / CONDITIONAL — الدليل الآلي أخضر محليًا، والإغلاق التشغيلي مفتوح للمشغّل
- **مختصر:** ملف الدليل 14 صار موجودًا بأرقام محلية مثبتة وصفوف بشرية مفتوحة صراحةً بدل ادعاءات غير مثبتة.

### ملاحظات / مشاكل مفتوحة
- لا commit ولا push ولا deploy — النشر على Render يدوي وملك المستخدم.
- إيصالات revoke/rotation الأربعة + 26 سيناريو UAT + telemetry الحية كلها OPEN.

## [2026-09-04] — QC-100-PERMISSION-IA-014: مطابقة ما يراه المستخدم مع ما يقدر يسويه (Permission↔UI)

### تم التنفيذ
- بنيت المصفوفة الكاملة للأدوار الأربعة (تنقل/صفحات/أكشن/ممنوع/اعتماد/ملكية/بيانات حساسة) في `apps/qc-task-manager/13-PERMISSION-IA-100-EVIDENCE.md` — كل `can*` في `permissions.ts` صار لها تمثيل UI مقصود.
- أصلحت 7 تناقضات مثبتة file:line: استثناء `/manager/workload` من حارس prefix لصالح `canViewTeamWorkload` (السوبرفايزر كان ينطرد)، وإظهار Reports للموظف (نطاق own موجود بالسيرفر)، وإظهار `/lab/search` اليتيمة وحذف رابط maintenance الميت، وقفل مالك الـFinding للموظف + نطاق مهامه، وبوابة RCA/CAPA/Evidence + زر Reject جديد + بوابة EFFECTIVE/CLOSED، وبوابة Edit للتمبلت لكل صف، وبوابات عرض صريحة لصفحات الطباعة الأربع.
- ما مسّيت `permissions.ts` ولا أي handler بالسيرفر — السيرفر يبقى المرجع، التعديل UI فقط.

### الملفات المتأثرة
- `apps/qc-task-manager/13-PERMISSION-IA-100-EVIDENCE.md` (جديد)
- `apps/qc-task-manager/src/{middleware.ts,components/Navbar.tsx,lib/lab/navigation.ts,lib/qc-operations.ts,lib/lab/templates.ts}`
- `apps/qc-task-manager/src/pages/{findings/index.astro,findings/[id].astro,lab/templates/index.astro,lab/{equipment,calibration,documents,maintenance}/[id]/print.astro}`

### التحقق
- `test-ui-consistency` ✅ 214/214 · `route-manifest --check` ✅ · `test-manifest-guard` ✅ · `architecture-guard` ✅
- `test-security-rbac-privacy-100` ✅ · `test-lab-security` ✅ 66/0 · `test-lab-templates` + `test-templates` ✅ · `test-qc-operations` ✅
- `astro check` ✅ 0 errors (تشخيصا LSP الظاهران stale)
- full `pnpm test` + production build + نقرة متصفح لكل دور: لم تُشغّل (مخاطر UI فقط — السيرفر لم يُمس)

### النتيجة
- **الحالة:** نجح
- **مختصر:** صفر تناقضات تفويض معروفة بين UI والسيرفر، والمصفوفة 100% route/action مع deep-link audit موثق.

### ملاحظات / مشاكل مفتوحة
- لا commit ولا push ولا deploy.

## [2026-09-04] — تحسين عنقود PDPL + AI لنية بحث المؤسسات العملية

### تم التنفيذ
- وسّعت `pdpl-ai-governance.md` من صفحة نحيفة (19 سطرًا) إلى صفحة عملية كاملة بسعودي حواري: لوحة مصدر رسمي تفصل المتطلب النظامي عن تنفيذ المنتج، 3 بطاقات سيناريو (دعم/موارد بشرية/عقود)، مخطط تدفق 5 مراحل، جدول آمن/غير آمن، قائمة تشغيلية 8 بنود تغطي كل المطلوب (اكتشاف، تصنيف، أدوات مسموحة، تنقيح، حجب، سجل، موافقات، أدلة)، ولوحة مصادر سدايا — مع روابط الخمسة المطلوبة.
- رقّيت `pdpl-chatgpt-data-protection.md`: أضفت مخطط `pdpl-flow` خماسيًا، 3 بطاقات سيناريو (`scenario-card`)، حوّلت جدول آمن/غير آمن لثلاث أعمدة (الحالة/الطلب/القرار)، ووسّعت الـchecklist من 7 إلى 8 بنود بكل الأفعال المطلوبة + فقرة تربط الحوكمة والاكتشاف والجدار والسجل والمنصة والتقييم.
- أضفت `FAQPage` لـ `pdpl-ai-governance` في `[...slug].astro` (3 أسئلة من المتن: التعريف، توليد AI لبيانات جديدة، عدم الاستغناء عن الاستشارة) بدون اختلاق؛ الـ ChatGPT كان مغطى أصلًا (6 أسئلة).
- أبقيت `pdpl-ai-complete-guide.md` (الركيزة) بدون مساس — يحقق المواصفة أصلًا (تدفق + سيناريوهات + جداول + checklist + مصادر) وروابطه الخمسة سليمة.

### الملفات المتأثرة
- `src/content/docs/pdpl-ai-governance.md` (توسعة شاملة)
- `src/content/docs/pdpl-chatgpt-data-protection.md` (تدفق + سيناريوهات + checklist)
- `src/pages/docs/[...slug].astro` (FAQ schema للحوكمة)

### التحقق
- `pnpm build` ✅ — exit 0
- `pnpm seo:gate` ✅ — 0 أخطاء
- `pnpm seo:schema` ✅ — speakable 267
- `pnpm test` ✅ — 16+29+38 pass / 0 fail
- فحص HTML المبني ✅ — الحوكمة والـChatGPT: H1 واحد، FAQPage حاضرة، الروابط الخمسة 11111، flow/checklist/scenario/safe/sources كلها Y

### النتيجة
- **الحالة:** نجح
- **مختصر:** عنقود PDPL صار ثلاث صفحات عملية بلهجة سعودية بفصل نظامي/تنفيذي ومصادر سدايا وروابط المنتج الخمسة، وكل البوابات خضرا.

### ملاحظات / مشاكل مفتوحة
- لا commit ولا push ولا deploy.

## [2026-09-04] — إصلاح أخطاء Semrush: 60 structured data items invalid (Software App + Local Business)

### تم التنفيذ
- شخصت السبب الجذري من الـHTML الحي (نفس ما يزحفه Semrush): عقد `WebApplication` بدون `aggregateRating/review` تُقرأ كـSoftware App ناقص حقل التقييم (الرئيسية وكل `/kernel/*` → 1 field، وصفحة التقييم بدون `offers` → 2 fields)، وعقد `ProfessionalService` (subtype من LocalBusiness) بدون `address` في مدن غير الرياض → 1 field.
- حولت `KERNEL_PRODUCT` وكل صفحات `/kernel/*` والرئيسية وصفحة التقييم من `WebApplication` إلى `Service` (بدون أي تقييم مفبرك — `aggregateRating` المفبرك 4.8/47 محذوف منذ BAI-SEO-003-S3 ولا يعود)، مع `serviceType` و`areaServed: SA` و`offers` بسعر 0.
- حولت مدن غير الرياض (الخبر، الدمام، جدة، مكة، المدينة) من `ProfessionalService+Service` إلى `Service` فقط، ووسعت مصفاة الـmigrated JSON لتسقط عقد `ProfessionalService/Service` المكررة بدون عنوان (الدمام وجدة)، وأصلحت wikidata المدينة `Q35484` → `Q334084`.
- حولت عقدة `kernel-offline.json` المهاجرة من `SoftwareApplication+WebApplication` إلى `Service` (صفحة offline لا تدمج غيرها؛ باقي kernel JSONs المهاجرة بيانات ميتة لا تُعرض).
- جربت Semrush API بالتوكن المعطى: رد `403` على classic API و`401/400` على management/siteaudit — التوكن لا يملك صلاحية Site Audit، فالتشخيص تم من الـHTML الحي وهو مصدر الحقيقة الذي يزحفه Semrush.

### الملفات المتأثرة
- `src/data/schema-helpers.ts` (KERNEL_PRODUCT + تعليق getKernelSubPageJsonLd)
- `src/pages/index.astro` (WebApplication → Service)
- `src/pages/assessment/ai-governance-readiness/index.astro` (WebApplication → Service مع offers)
- `src/pages/solutions/[sector]/[city].astro` (نوع المدن + wikidata + مصفاة migrated)
- `src/pages/kernel/index.astro` (تعليق فقط)
- `src/data/migrated-pages/kernel-offline.json` (عقدة واحدة → Service)

### التحقق
- `pnpm build` ✅ — exit 0 (تحذيرات route collision القديمة فقط)
- `pnpm seo:schema` ✅ — 64 صفحة + speakable 267
- `pnpm seo:gate` ✅ — 0 أخطاء
- `pnpm seo:hreflang` ✅ — 0 أخطاء
- `pnpm test` ✅ — 16+29+38 pass / 0 fail
- فحص `dist/client` ✅ — صفر `WebApplication`/`SoftwareApplication` في كل الـHTML، وصفر `ProfessionalService` إلا عقدة الرياض الصالحة بعنوان

### النتيجة
- **الحالة:** نجح محليًا / يحتاج نشرًا ثم إعادة زحف Semrush
- **مختصر:** كل الـ60 عنصرًا المبلغ عنها سقط سببها من القوالب (نفس القالب يغطي كل روابط `?trace=` و`?scenario=` و`?pack=`)، لكن تقرير Semrush البعيد يبقى قديمًا حتى النشر وإعادة تشغيل الحملة.

### ملاحظات / مشاكل مفتوحة
- توكن Semrush أُرسل مكشوفًا بالمحادثة ولم يُخزن في المستودع — يُوصى بتدويره من لوحة Semrush.
- لا commit ولا push ولا deploy.

## [2026-09-03] — دليل مسودة NCA لإرشادات الأمن السيبراني للذكاء الاصطناعي

### تم التنفيذ
- تحققت من المصدر الرسمي قبل الكتابة: إعلان NCA عن التشاور العام على «AI Cybersecurity Guidelines» (نُشرت 5 يوليو 2026، وأُغلق التشاور 5 أغسطس 2026 عبر استطلاع) بأربعة نطاقات (الحوكمة، الدفاع، المرونة، الطرف الثالث) وسكوب يشمل التوليدي والوكلاء — الحالة: **مسودة تشاورية مغلقة بانتظار النهائية، وليست ملزمة**، ووثّقت هذا الفصل في كل أقسام الدليل.
- ميّزت النية عن المحتوى القائم: وثائق NCA الأربع الحالية كلها ECC ملزم، فبنيت الجديد حول المسودة التشاورية (النطاقات، مخاطر الوكلاء، ~42 إرشادًا) بدون تكرار — ECC للخط الساري، والمسودة للجاهزية المبكرة.
- أنشأت `src/content/docs/nca-ai-cybersecurity-guidelines.md` (فئة NCA): جواب مختصر يعلن حالة المسودة أولًا، جدول ثلاث طبقات (مسودة/ساري/منظومة أوسع)، النطاقات الأربع بأسئلتها الحاكمة، 7 تهديدات AI خاصة (تسريب، مخرجات غير آمنة، ظل، صلاحيات وكلاء، فجوات تسجيل، طرف ثالث، عدائية)، مصفوفة تهديد ← ضابط ← دليل بعمود النطاق، مخطط بنية خفيف من 5 مراحل بستايل scoped، قسم BrightAI منفصل مع تنبيه عدم الاعتماد، checklist عشر بنود، FAQ خمس أسئلة، ولوحة مصادر (إعلان NCA + وثيقة ECC).
- أضفت FAQPage JSON-LD (3 أسئلة) عبر `FAQ_BY_DOC` + مدخلين في `llms.txt` و`llms-full.txt` مع فصل النية (المسودة للشرح، ووثائق ECC للخط الملزم).

### الملفات المتأثرة
- `src/content/docs/nca-ai-cybersecurity-guidelines.md` (جديد)
- `src/pages/docs/[...slug].astro` (FAQ schema)
- `public/llms.txt` و`public/llms-full.txt`
- `sitemap.xml` و`public/sitemap.xml` (توليد تلقائي +URL الجديد)

### التحقق
- `pnpm build` ✅ (تحذيرات route collision قديمة فقط)
- `pnpm seo:gate` ✅ — 0 أخطاء
- `pnpm seo:schema` ✅ — 0 أخطاء (TechArticle + FAQPage)
- `pnpm seo:hreflang` ✅ — 0 أخطاء
- `pnpm internal-links:audit` ✅ — 0 orphans، depth ≤3
- `pnpm test` ✅ — pass بدون fail
- فحص HTML المبني ✅ — H1 واحد، canonical ذاتي، index/follow، الروابط الخمسة كلها حاضرة، «مسودة» مذكورة 48 مرة

### النتيجة
- **الحالة:** نجح
- **مختصر:** صار عند الموقع المرجع الوحيد لمسودة NCA الأمنية بحالة تشاورية موثقة ومصفوفة تهديد-ضابط-دليل، وكل البوابات خضرا.

### ملاحظات / مشاكل مفتوحة
- رقم «42 إرشادًا» من تغطية صحفية ثانوية — يُثبَّت من النسخة الرسمية عند نشرها النهائية ويُحدَّث الدليل.
- لا commit ولا push ولا deploy.

## [2026-09-03] — الدليل السعودي المعمّق لإطار سدايا SDAIA-P145 لإدارة مخاطر AI

### تم التنفيذ
- تحققت من المصدر الرسمي قبل الكتابة: الاسم المعتمد «الإطار الوطني لإدارة مخاطر الذكاء الاصطناعي» SDAIA-P145 v1.0 أبريل 2026 (النص العربي مرجع)، وإطلاق يوليو 2026 بأربع مراحل وسبعة مبادئ ومصفوفة احتمالية×أثر — مع تفاصيل المراحل والمصفوفة 4×4 والنطاقات والاستراتيجيات الأربع من توثيق تحليلي ثانوي يُنسب كل شي لـ SDAIA-P145.
- اكتشفت أن `/hub/sdaia-ai-risk-management/` يغطي نفس الموضوع بمستوى مختصر، فبنيت الدليل الجديد كمرجع معمّق متمايز (ركائز، مبادئ، فئات، مصفوفة بالأرقام، مثال LLM، جدول قرار، checklist) بدل التكرار — Hub مختصر وDocs مرجع.
- أنشأت `src/content/docs/sdaia-ai-risk-management-framework.md` (فئة SDAIA): جواب مختصر أولًا، 3 فئات مستهدفة، 4 ركائز، 7 مبادئ، 4 مراحل، 7 فئات مخاطر، مصفوفة 4×4 كاملة بالنواتج والنطاقات، 4 استراتيجيات معالجة + خطر متبقٍ + قبول/تصعيد، تشغيل 8 خطوات، جدول قرار 5 صفوف، checklist عشر بنود، قسم BrightAI منفصل مع تنبيه عدم الاعتماد، لوحة مصادر رسمية، وFAQ خمس أسئلة — كله بلهجة سعودية بيضاء مع فصل «كلام الوثيقة» عن «اجتهاد المورّد».
- أضفت FAQPage JSON-LD (4 أسئلة) عبر `FAQ_BY_DOC` في `[...slug].astro` — وأصلحت خطأ إدخال كسر `getStaticPaths` أثناء التنفيذ قبل البناء.
- ربطت ثنائي الاتجاه: سطر واحد في Hub يشير للدليل المعمّق + `related` أمامية لخمس وثائق + مدخلان في `llms.txt` و`llms-full.txt` مع فصل النية (Hub مختصر، Docs مرجع).

### الملفات المتأثرة
- `src/content/docs/sdaia-ai-risk-management-framework.md` (جديد)
- `src/pages/docs/[...slug].astro` (FAQ schema)
- `src/components/hub/SdaiaAiRiskManagementGuide.astro` (سطر ربط واحد)
- `public/llms.txt` و`public/llms-full.txt`
- `sitemap.xml` و`public/sitemap.xml` (توليد تلقائي +URL الجديد)

### التحقق
- `pnpm build` ✅
- `pnpm seo:gate` ✅ — 0 أخطاء
- `pnpm seo:schema` ✅ — 0 أخطاء (TechArticle + FAQPage على الصفحة)
- `pnpm seo:hreflang` ✅ — 0 أخطاء
- `pnpm internal-links:audit` ✅ — 0 orphans، depth ≤3
- `pnpm test` ✅ — pass بدون fail
- فحص HTML المبني ✅ — H1 واحد، canonical ذاتي، index/follow، الروابط الستة كلها حاضرة، 19 معرف عناوين للـTOC

### النتيجة
- **الحالة:** نجح
- **مختصر:** صار عند الموقع مرجع سدايا المعمّق الوحيد (SDAIA-P145 بالأرقام الرسمية) متمايز عن Hub المختصر، وكل البوابات خضرا.

### ملاحظات / مشاكل مفتوحة
- تفاصيل المصفوفة والمستويات والاستراتيجيات معتمدة على توثيق ثانوي دقيق ينسب كل بند لـ SDAIA-P145 — تستحق مطابقة حرفية مع PDF سدايا عند توفره محليًا.
- لا commit ولا push ولا deploy.

## [2026-09-03] — تدقيق cannibalization لمجلد /answer/ ودمج المكرر + قالب خفيف

### تم التنفيذ
- فحصت 17 صفحة `/answer/*` (كلها 57–106 كلمات، بدون GSC وبدون equity: النطاق rank 1.5M وكلمة واحدة pos 62 و0 زيارات، وbacklinks ascore 2) ضد المالكين (hub/solutions/docs/blog) — القرار بالأدلة لا بعدد الكلمات.
- **KEEP (13):** كل الأزواج EN/AR (نية SERP مختلفة)، و`ai-governance-framework` (نية مكونات الإطار)، و`ai-safety-platform-enterprise` + `saudi-ai-safety-os` (ميزتهما: فئة عامة vs وصف منتج)، و`audit-trail-saudi-ar` و`sdaia-generative-ai` و`iso-42001` — كل واحدة تجيب سؤالًا واحدًا وتربط للركيزة.
- **REDIRECT (2) بعد دمج المحتوى:** `nca-compliance` → `nca-ecc-controls` (نفس النية ونفس الضوابط، لا محتوى فريد يُنقل)، و`sama-ai` → `ai-banking` (نُقلت نقطتها الفريدة "تقارير دورية للإدارة العليا" لـ keyPoints البنوك) — أضفت 4 entries في `redirects.json` (مع/بدون slash) وحدّثت 5 روابط FAQ في `blog/[...slug].astro` للوجهات الجديدة.
- **NOINDEX (0):** لا مبرر — كل الباقي له سؤال مستقل، وسياسة المشروع تمنع noindex للصفحات العامة.
- صححت `furtherReading`: البنوك → `/solutions/banking-ai-governance/` والصحة → `/solutions/healthcare-ai-governance/` (بدل hub العام)، وISO → `/blog/iso-42001-saudi-implementation-guide/` (المالك P1 الفعلي حسب خريطة الملكية).
- بنيت قالب answer الخفيف في `answer/[slug].astro`: إجابة مباشرة (H1 = السؤال) ← ليش يهمك بالسعودية ← أهم النقاط ← المصادر (مالك داخلي + جهات رسمية roots فقط) ← رابط next-step واحد + تقييم الجاهزية — بدون صندوق Kernel التسويقي، وzero-JS كما قبل.
- مددت `AnswerUnit` بحقول `saudiNote/keyPoints/sources` (مشتقة من النصوص المعتمدة فقط، والنصوص العربية المنشورة لم تُمس حرفًا)، وعبأتها لكل الـ15 صفحة.

### الملفات المتأثرة
- `src/data/answers.ts` (حقول + تعبئة 15 صفحة + حذف وحدتين + 3 تصحيحات furtherReading)
- `src/pages/answer/[slug].astro` (القالب الخفيف)
- `redirects.json` (+4 entries → 213)
- `src/pages/blog/[...slug].astro` (5 روابط FAQ للوجهات الجديدة)
- `public/sitemap.xml` (17→15 answer URLs، توليد تلقائي)

### التحقق
- `pnpm build` ✅
- `pnpm seo:gate` ✅ — 0 أخطاء (278 HTML، broken 0/48148)
- `pnpm redirects:check` ✅ — 213 بدون chains/cycles/missing
- `pnpm seo:schema` ✅ — 62 صفحة + speakable 265
- `pnpm seo:hreflang` ✅ — 0 أخطاء
- `pnpm internal-links:audit` ✅ — 0 orphans، depth ≤3، sitemap 261
- `pnpm test` ✅ — 38/38
- فحص HTML مبني (`ai-banking`) ✅ — H1 سؤال، الأقسام الخمسة، FAQPage+BreadcrumbList، canonical ذاتي، index/follow

### النتيجة
- **الحالة:** نجح
- **مختصر:** مجلد answer صار 15 صفحة متمايزة بقالب خفيف وروابط صاعدة صحيحة، والتكراران الحقيقيان الوحيدان اندمجا بتوجيه 301 موثق بدون أي redirect جماعي.

### ملاحظات / مشاكل مفتوحة
- لا commit ولا push ولا deploy.
- GSC/impressions غير متوفرة — القرارات مبنية على النية والمحتوى والروابط الداخلية؛ تُراجع بعد توفر بيانات Search Console.

## [2026-09-03] — تنظيف معمارية الفهرسة التقنية (canonical/sitemap/redirects/hreflang)

### تم التنفيذ
- دققت كل محاور الفهرسة على `dist/client` (280 HTML) ضد `public/sitemap.xml` (263 URL): صيغة canonical واحدة `https://brightai.live/` + trailing slash، و209 redirects بدون chains/cycles/self/duplicates، و264 hreflang set بدون أخطاء.
- أثبت أن 4 تنبيهات audit-tool كانت artifacts لا مشاكل حقيقية: تطابق sitemap/canonical للفئات العربية (ترميز percent مقابل raw)، وتداخل noindex/sitemap لصفحات المدن (الـalias redirect stubs مقابل الصفحات الحقيقية المفهرسة)، وتكرار canonical (نفس السبب)، و103 hash issues (معرفات `id` وهمية داخل عينات كود مُهرّبة `&#x3C;` في صفحات docs).
- أصلحت الفجوة الحقيقية الوحيدة: 17 صفحة `/answer/*` كانت تُنشر بدون `<lastmod>` لأن `resolveSourceFiles` ما كان يغطي مسارات answer — أضفت فرع answer (route template + `src/data/answers.ts`) وأعدت توليد الـsitemap.
- تحققت بعد التعديل: `seo:gate` صفر أخطاء، و`seo:hreflang` صفر، و`redirects:check` نظيف، و`internal-links:audit` صفر orphans وصفر broken وعمق نقر ≤3.

### الملفات المتأثرة
- `scripts/generate-sitemap-all-pages.mjs` (فرع answer في `resolveSourceFiles`)
- `public/sitemap.xml` (+17 سطر lastmod فقط)
- `sitemap.xml` (+17 سطر lastmod فقط)

### التحقق
- `pnpm sitemap:generate` ✅ — 263 URL ثابتة
- `pnpm seo:gate` ✅ — 0 أخطاء (sitemap 263، broken 0/48135)
- `pnpm seo:hreflang` ✅ — 264 sets، 0 أخطاء
- `pnpm redirects:check` ✅ — 209 redirects، 0 chains/cycles
- `pnpm internal-links:audit` ✅ — 0 orphans، 0 broken، depth ≤3
- build/tests: لم تُشغّل — تعديل سكربت توليد + ملفات sitemap فقط، والـHTML المبني لم يُمس

### النتيجة
- **الحالة:** نجح
- **مختصر:** معمارية الفهرسة سليمة ومثبتة بالأدلة على صيغة canonical واحدة، والإصلاح الوحيد اللازم كان freshness صفحات answer (17 lastmod)، والباقي artifacts موثقة بدون تعديل.

### ملاحظات / مشاكل مفتوحة
- hash anchors حقيقية جزئيًا كـUX papercut في صفحات docs/kernel (روابط TOC بدون هدف فعلي) — خارج نطاق الفهرسة، تُعالج في مهمة UX مستقلة إذا طُلبت.
- `og:locale` الإنجليزية (`en_SA` مقابل سياسة `en_US`) ما زالت P1 مفتوحة من baseline ولم تُمس في هذه المهمة.
- لا commit ولا push ولا deploy.

## [2026-09-03] — أداء الجوال P0: إعادة قياس LCP وتأجيل الخلفية لما بعد الخمول (BAI-PERF-LCP-001)

### تم التنفيذ
- أعدت القياس مخبريًا (Playwright + محاكاة جوال 360px و4x CPU وشبكة F4G) قبل الافتراض: الجوال LCP كان ~4.7s (عنصر LCP نصي `P.split-hero__lead`) مقابل الديسكتوب ~0.2s (عنصر LCP الـH1) — يؤكد الفجوة التاريخية (5.8s مقابل 1.3s) بدون الاعتماد عليها.
- أجلت تشغيل `SiteBackground` (DotLottie: ملف 1.2MB + wasm بـ1.2MB) إلى `requestIdleCallback` بحد 3000ms مع `setTimeout` بديل، وأضفت تلاشيًا دخوليًا (`opacity` + `is-ready`) فوق نفس اللون الثابت `#0a0e1a` — بدون أي تغيير بصري أو تخطيطي (opacity لا يسبب CLS).
- أضفت `preconnect` إلى `googletagmanager.com` في `BaseLayout` لأن سكربت gtag (إلزامي من المالك، async) كان يتعطل ~3.7s على الجوال المخنوق.
- لم أُجرِ `preload` شاملًا، ولم أؤجل CSS الحرج (يمنع FOUC)، ولم أمسِ الخطوط (preload واحد صحيح) أو الصور (كلها بأبعاد وصيغ حديثة) أو الـhydration (لا جزر عميلة في الرئيسية أصلًا).

### الملفات المتأثرة
- `src/components/SiteBackground.astro` (تأجيل الخمول + تلاشي الدخول)
- `src/layouts/BaseLayout.astro` (preconnect فقط)

### التحقق
- `pnpm build` ✅ — exit 0
- `pnpm test` ✅ — 38/38
- `node scripts/qa/verify-background-contract.mjs` ✅ — 95/95
- `git diff --check` ✅ (على ملفي المهمة فقط)
- قياس مخبري بتكافؤ الإنتاج (gzip للنصوص): الرئيسية جوال **1944ms** (قبل الإصلاح بنفس الشروط 2072ms)، ديسكتوب **324ms**؛ `/solutions/ai-governance-platform/` جوال **1464ms** — كلها تحت 2.5s
- فحص يدوي ✅ — الديسكتوب ما زال يجلب الخلفية بعد ~350ms (لا انحدار بصري)، ولا `lazy` على أصول فوق الـfold، ولا redirect على الرئيسية

### النتيجة
- **الحالة:** نجح
- **مختصر:** عنصر LCP الحقيقي نصي (خط + CSS حرج)، والخلفية المتحركة صارت خارج نافذة LCP تمامًا بدون أي تنازل بصري، وكل القياسات المخبرية تحت الميزانية.

### ملاحظات / مشاكل مفتوحة
- فرق المختبر المحلي (2072→1944ms) ضمن الضجيج لأن localhost لا يحاكي ازدحام HTTP/2 الحقيقي؛ الكسب الحقيقي بالإنتاج حيث 2.4MB كانت تزاحم CSS/الخط داخل نافذة LCP — يحتاج تأكيد CrUX/PSI بعد النشر.
- gtag إلزامي من المالك ويبقى أكبر طرف ثالث؛ لا يُؤجَّل بدون قرار مالك جديد.
- خريطة خرائط Google في `/contact/` كسولة أصلًا (`loading="lazy"`) — لا إجراء.
- `sitemap.xml` و`public/sitemap.xml` تغيرتا كآثار بناء معروفة؛ تُرِكت للمراجعة بدون commit.
- هذا الملف تجاوز 150KB منذ مهام سابقة (الآن ~221KB)؛ الأرشفة للقسم 2 ما زالت قرارًا مستقلًا لم تُنفَّذ (سوابق: 2026-08-29 و2026-09-02).
- لا commit ولا push ولا deploy.

## [2026-09-03] — تحسين /assessment/ai-governance-readiness/ للتحويل والفهرسة (واجهة تقييم مؤسسية عالية الثقة)

### تم التنفيذ
- طبقت مهارات `seo-page` و`seo-geo` و`seo-content` و`form-design`: قسم جديد "لمن هذا التقييم؟" (4 أدوار + تنبيه أنه مو بديل عن التدقيق/الشهادة)، وقسم "كيف يشتغل؟" (3 خطوات + توقع 5 دقائق)، وقسم شفافية "وش اللي ما يسويه التقييم؟" (مو شهادة/موافقة/درجة — عمدًا بدون درجة رقمية)، وFAQ رابعة عن المدة — كله سعودي حواري بدون منهجية أو اعتماد مختلق.
- وسعت JSON-LD من WebPage فقط إلى WebPage (مع dateModified) + WebApplication وصفية + `extraSpeakableSelectors` لخلاصة tl-dr؛ الـbreadcrumbs تكمل BreadcrumbList تلقائيًا عبر FoundationSchema، وبدون FAQ schema تجاري جديد (قرار سابق محفوظ).
- قويت الفورم: مؤشر مرحلة مرئي (`data-assessment-step-label`)، كل سؤال `role=radiogroup` مع `aria-labelledby`، أهداف لمس 52px، أزرار مكدسة كاملة العرض على الجوال، `auto-fit minmax(220px,1fr)` للخيارات على الواسع، ونتائج بأيقونات وفصل بصري (قوة/فجوة/ضوابط) + CTA رئيسي لجلسة استكشافية وثانوي لمنصة الحوكمة.
- شددت التحليلات بدون PII: `ALLOWED_KEYS` (step/dimension/position فقط)، بدء/تقدم/إكمال/تخلي كما قبل + `pagehide` مع حارس once (إضافة لـvisibilitychange)، واحترام `prefers-reduced-motion` عند التمرير للنتيجة؛ نقرات CTA مغطاة أصلًا عبر تفويض `[data-cta]` العام في `public/js/analytics.js`.
- وسعت اختبار `assessment-readiness` من 2 إلى 5 (تجميع/تقدم مرئي، كامل القمع بدون PII، وربط CTA بالـtaxonomy الموحد) مع بقاء ضمانات عدم الدرجة الرقمية.

### الملفات المتأثرة
- `src/pages/assessment/ai-governance-readiness/index.astro` (محتوى + سكيما + CSS)
- `public/js/ai-governance-readiness.js` (step label + pagehide + reduced-motion + allowlist)
- `scripts/assessment-readiness.test.mjs` (2→5 فحوصات)

### التحقق
- `node --test scripts/assessment-readiness.test.mjs` ✅ — 5/5
- `pnpm build` ✅ — Complete (تحذيرات route-collision قديمة فقط)
- `pnpm seo:schema` ✅ — 62 صفحة + speakable 267
- `pnpm seo:hreflang` ✅ — 0 أخطاء
- `pnpm seo:gate` ✅ — 0 أخطاء (broken 0/47885، noindex/canonical نظيفة)
- فحص HTML المبني ✅ — H1 واحد، canonical ذاتي، `index, follow`، الأسئلة الثمانية SSR بدون JS، وWebApplication + BreadcrumbList حاضرة
- `git diff --check` ✅

### النتيجة
- **الحالة:** نجح
- **مختصر:** صفحة التقييم صارت أغنى شرحًا (جمهور/خطوات/حدود/روابط داخلية) وبواجهة تقييم أرقى وقمع تحليلي كامل بدون PII، وكل البوابات خضرا.

### ملاحظات / مشاكل مفتوحة
- لا commit ولا push ولا deploy.
- ملاحظة: `src/data/solutions.ts` و`src/pages/solutions/[slug].astro` و`AiGovernancePillar.astro` عليها تعديلات محلية سابقة من مهام اليوم — لم تُمس في هذه المهمة.

## [2026-09-03] — ترقية /hub/ai-governance/ كركيزة معرفية للحوكمة (فصل النية عن صفحة الشراء)

### تم التنفيذ
- طبقت مهارات `seo-geo` و`seo-page` و`seo-content`: إجابة أولى موجزة (lede 102 + فقرة 53 = 155 كلمة ضمن 150-250)، تعريف جاهز للاقتباس، جدول مقارنة حوكمة/سلامة/أمن/مخاطر، و3 جمل citation-ready بدون أرقام مختلقة.
- أضفت قسم `checklist` جديد (10 بنود) في الـTOC والمتن، ووسعت FAQ من 4 إلى 7 (فرق المفاهيم، تجهيز الدليل، نطاق الأنظمة السعودية) مع FAQPage JSON-LD متزامن 7/7 مع المرئي.
- أضفت تنبيه نية صريح (تعليمي vs تجاري) يربط بـ`/solutions/ai-governance-platform/`، وأبقيت روابط المنتج والأدلة التنظيمية (matrix + docs + assessment + tools) بدون حشو.
- حسنت القراءة والتصميم: عرض مريح 75ch لكل الأقسام عدا المصفوفة الواسعة، TOC sticky مع scroll و44px touch، تنقل جوال مضغوط 44px، أسهم evidence بـ`aria-hidden`، وfocus-visible لأسئلة FAQ — كله logical properties وRTL سليم.
- دققت الـcannibalization: الـ6 إجابات الحوكمة (`ai-governance-saudi-arabia`, `-ar`, `-framework`, `ai-banking`, `ai-healthcare`, `sama-ai`) كلها thin + تشير بـfurtherReading للركيزة؛ والحل التجاري بنية شراء مميزة — **التوصية: إبقاء الكل مفهرسًا بدون دمج أو noindex**، وتقوية الربط الصاعد فقط (تم).

### الملفات المتأثرة
- `src/components/hub/AiGovernancePillar.astro` (TOC + checklist + FAQ + intent-note + FAQPage + CSS)

### التحقق
- `pnpm build` ✅
- `pnpm seo:schema` ✅ — 62 صفحة + speakable 267
- `pnpm seo:gate` ✅ — 0 أخطاء (sitemap 263، broken 0/47881)
- `pnpm seo:hreflang` ✅ — 0 أخطاء
- `pnpm test` ✅ — 38/38
- فحص HTML المبني ✅ — H1 واحد، canonical ذاتي، noindex صفر، TOC 14 بند، FAQ sync 7/7، وأول 155 كلمة تجاوب مباشرة

### النتيجة
- **الحالة:** نجح
- **مختصر:** صفحة الحوكمة صارت ركيزة تعليمية مكتملة (checklist + أسئلة + مصفوفة + خارطة) بفصل نية واضح عن صفحة الشراء، وكل البوابات خضرا.

### ملاحظات / مشاكل مفتوحة
- لا commit ولا push ولا deploy.
- ملاحظة: `src/data/solutions.ts` و`src/pages/solutions/[slug].astro` عليها تعديلات محلية سابقة من مهمة اليوم (صفحة المنصة التجارية) — لم تُمس في هذه المهمة.

## [2026-09-03] — تحسين صفحة منصة حوكمة AI كصفحة تجارية رئيسية

### تم التنفيذ
- طبقت مهارات `seo-page` و`seo-schema` و`seo-geo`: إجابات مباشرة أول الفقرات، عناوين H2 بصيغة أسئلة، وكتل Q&A قصيرة قابلة للاقتباس (40-60 كلمة) بدون أي رقم أو شهادة مختلقة.
- قصرت الهيرو فوق الـfold: سطر القيمة الواحد بقي بارزًا، والوصف صار جملة واحدة من `shortDesc` بدل فقرتين، مع تضييق H1 والـpadding على الجوال (360px) وتكديس CTA كامل العرض.
- حسنت قسم الفلو البصري Regulation → Risk → Control → Enforcement → Evidence: أيقونات SVG موجودة فعليًا في `icons.svg` (استبدلت 4 أسماء مفقودة) + أسهم اتجاه خفيفة CSS فقط تتجه للأسفل تلقائيًا على الجوال، بدون أنيميشن ثقيل.
- أضفت روابط داخلية سياقية لكل المطلوب: Firewall وRisk Classification وHuman Approval وAudit Trail وEvidence File وتقييم الجاهزية داخل متن الأقسام، وأضفت `ai-risk-classification` لقائمة `related` عشان يظهر في RelatedLinks.
- لينت إجابة FAQ الأولى قانونيًا ("حماية كاملة" و"Immutable Audit Log" صارت "سجل مراجعة واحد" و"داخل حدود واضحة") مع بقاء تنبيه عدم الاستغناء عن التقييم القانوني/الشهادة.
- أبقيت Service schema (صحيح دلاليًا لصفحة خدمة) وFAQPage المتزامن مع الأسئلة المرئية (7/7) لأن `seo-schema-audit` يشترطه؛ إزالته كانت ستكسر البوابة — موثق كقرار.

### الملفات المتأثرة
- `src/data/solutions.ts` (related + إجابة FAQ الأولى)
- `src/pages/solutions/[slug].astro` (فرع الحوكمة: هيرو، إجابات، عناوين أسئلة، فلو بالأيقونات، روابط، CSS جوال)

### التحقق
- `pnpm build` ✅
- `pnpm seo:schema` ✅ — 62 صفحة + speakable 267، وFAQ sync بدون drift
- `pnpm seo:gate` ✅ — 0 أخطاء
- `pnpm seo:hreflang` ✅ — 0 أخطاء
- `pnpm test` ✅ — 38/38
- فحص HTML المبني ✅ — H1 واحد، canonical ذاتي، noindex صفر، الروابط الستة كلها 6-7 مرات، ولا حشو مدن (المدن بس في Organization areaServed العامة)

### النتيجة
- **الحالة:** نجح
- **مختصر:** صفحة الحوكمة صارت أقصر فوق الـfold، بفلو مرئي وأسئلة GEO وروابط داخلية كاملة وصياغة آمنة قانونيًا، وكل بوابات SEO والاختبارات خضرا.

### ملاحظات / مشاكل مفتوحة
- لا commit ولا push ولا deploy.

## [2026-09-03] — توحيد سياسة الزواحف: تدريب Disallow وبحث/استشهاد Allow

### تم التنفيذ
- طبّقت مهارة `seo-technical` (AI Crawler Management) وحوّلت `public/robots.txt` من allow-all شامل التدريب إلى سياسة مقصودة: بحث تقليدي Allow، وبحث/تأريض/استشهاد AI Allow فقط حيث توثيق المزود يؤكد الدور، وتدريب فقط Disallow افتراضيًا.
- سمحت صراحة: `OAI-SearchBot` و`ChatGPT-User` (OpenAI)، و`PerplexityBot` و`Perplexity-User` (Perplexity)، و`Claude-SearchBot` و`Claude-User` (Anthropic)، و`YouBot`، مع `Disallow: /api/` مكرر Disallow-first في كل مجموعة Allow.
- منعت صراحة: `GPTBot` و`ClaudeBot` و`Google-Extended` و`Applebot-Extended` و`CCBot` و`Bytespider` و`Meta-ExternalAgent` عبر `Disallow: /` بناءً على توثيق رسمي تم التحقق منه.
- أزلت توكنز legacy/غير موثقة (`Perplexity-ai` و`anthropic-ai` و`Google-CloudVertexBot` و`cohere-ai` و`FacebookBot` و`Timpibot` و`omgili`) لتغطيها `*` بدل ادعاء دور غير مثبت، وحذفت `Host:` وأبقيت `Sitemap` واحدًا بدون `Content-Signal`.
- حدّثت `public/ai.txt` (التدريب صار Disallowed + تاريخ 2026-09-03)، وأنشأت تقرير `audit/report/2026-09-03-crawler-policy-training-disallow.md` بمقارنة لايف سطر بسطر وجدول توثيق المزودين وخطوات Cloudflare اليدوية بدون أي تغيير وهمي لإعدادات الحساب.

### الملفات المتأثرة
- `public/robots.txt`
- `public/ai.txt`
- `audit/report/2026-09-03-crawler-policy-training-disallow.md`

### التحقق
- `urllib.robotparser` ✅ — 19/19 (بحث/استشهاد يسمح ويُمنع من /api/، وتدريب ممنوع).
- فحص تكرار ✅ — 24 وكيلًا بدون تكرار، Sitemap واحد، Host صفر، ولا سطر توجيه Content-Signal.
- لايف ✅ — `https://brightai.live/robots.txt` كان 102 سطرًا مطابقًا للنسخة القديمة بدون managed prepend ظاهر؛ الجديد 113 سطرًا بانتظار النشر وpurge.
- `pnpm build` ✅ — نجح بدون أخطاء.
- فحص يدوي ✅ — diff يوضح عكس قرار 2026-08-23 المفتوح عمدًا لصالح منع التدريب مع بقاء الاستشهاد.

### النتيجة
- **الحالة:** نجح
- **مختصر:** صارت سياسة الزواحف واحدة ومقصودة تسمح بالبحث والاستشهاد وتمنع التدريب افتراضيًا، مع خطوات Cloudflare اليدوية موثقة بدون دفع.

### ملاحظات / مشاكل مفتوحة
- يحتاج نشرًا ثم purge لـ robots.txt وإعادة جلب خارجي للتأكيد، ومراجعة سجلات Bytespider لأنه مختلط التدريب/البحث.
- لا commit ولا push ولا deploy.

## [2026-09-03] — توحيد لون البراند وظلال النصوص الخفيفة للأقسام

### تم التنفيذ
- طبّقت مهارة `redesign-existing-projects` (تشخيص ثم إصلاحات مركزة بدون إعادة كتابة).
- وحّدت 69 موضع teal خام قديم في `components.css` و`pages.css` من `(42,138,126)` و`(59,163,149)` إلى لون البراند المعتمد `(32,165,151)` per DEC-A11Y-001 — نفس الـalpha والهندسة؛ الحدود والتوهجات والخلفيات الزجاجية صارت بلون واحد.
- أضفت ظل نص خفيف على `.section__subtitle` بنفس قيمة `.section__title` (`0 2px 24px rgba(4,7,17,0.6)`) لوضوح الوصف الرمادي فوق الخلفية المتحركة.
- فحصت بالمتصفح (Playwright headless + preview محلي): الرئيسية والحلول على 1440 و360 قبل/بعد — لا كسر بصري، وقسم "الإجابة المختصرة" تأكد أنه مليء (732px، المحتوى تحت الـfold مو خلل).
- حذفت 4 سكربتات فحص مؤقتة أنشأتها بنفسي وأطفأت سيرفر المعاينة.

### الملفات المتأثرة
- `src/styles/components.css` (25 موضع + ظل الـsubtitle)
- `src/styles/pages.css` (44 موضع)

### التحقق
- `node scripts/calc-contrast.mjs` ✅ — title 13.42:1، eyebrow 8.57:1، subtitle 5.73:1 (كلها AA حتى بأسوأ إطار)
- `pnpm build` ✅ — exit 0 (تحذيرات route collision قديمة فقط)
- `pnpm test` ✅ — 38 pass / 0 fail
- فحص بصري Chromium 1440 + 360 قبل/بعد ✅

### النتيجة
- **الحالة:** نجح
- **مختصر:** الحدود والتوهجات والخلفيات الزجاجية صارت بلون براند واحد، ووصف الأقسام أوضح فوق الخلفية المتحركة بدون أي كسر.

### ملاحظات / مشاكل مفتوحة
- حدود البطاقات الأساسية كانت موحدة أصلًا (1px slate 0.1) — لم تُمس.
- لا commit ولا push ولا deploy.

## [2026-09-03] — توحيد خلفية الموقع على 5CrsnzDP8H-3.lottie ثابتة بالمنتصف

### تم التنفيذ
- ثبتُّ `5CrsnzDP8H-3.lottie` كمصدر موحد بنسخها إلى `brightai-background.lottie` (البصمة `59bee6ba…` متطابقة، 1197133B).
- زامنت الأصل عبر `sync-background-media.mjs` إلى `public/media` والـdashboard والـQC (8 أصول متطابقة byte-for-byte).
- أكدت الهندسة الموحدة القائمة: `position: fixed` + `contain` + `align: [0.5, 0.5]` + لون مثبت `#0a0e1a` بدون scrim أو cover أو فلتر، وتغطي BaseLayout و3 صفحات `<html>` مستقلة والـdashboard والـQC و`500.html`.
- لم أغيّر كود العرض لأن العقد يحقق طلب "ثابتة وبالمنتصف" حرفيًا؛ ولم أحذف ملف المستخدم الأصلي.

### الملفات المتأثرة
- `5CrsnzDP8H-3.lottie` (مصدر المستخدم)
- `brightai-background.lottie`
- `public/media/brightai-background.lottie`
- `apps/dashboard/public/media/brightai-background.lottie`
- `apps/qc-task-manager/public/media/brightai-background.lottie`

### التحقق
- `node scripts/sync-background-media.mjs` ✅ — 8/8 متطابقة
- `node scripts/qa/verify-background-contract.mjs` ✅ — 95/95
- `pnpm build` ✅ — اكتمل بدون أخطاء

### النتيجة
- **الحالة:** نجح
- **مختصر:** كل صفحات المشروع صارت على نفس الخلفية الجديدة، ثابتة ومتمركزة بهندسة واحدة.

### ملاحظات / مشاكل مفتوحة
- ملف `5CrsnzDP8H-3.lottie` بقي في الجذر كمصدر مرفوع؛ الحذف يحتاج تأكيد المستخدم.
- لا commit ولا push ولا deploy.

## [2026-09-03] — تثبيت baseline SEO التقني للمستودع والـlive architecture

### تم التنفيذ
- أنشأت تقرير baseline مستقلًا قبل أي optimization في `audit/report/2026-09-03-technical-seo-baseline.md`، بدون تعديل layouts أو صفحات أو CSS أو إعدادات Cloudflare.
- جردت sitemap والـHTML الناتج: **263 URL** في sitemap، **280 HTML** محليًا، و**0** duplicate titles أو canonical مفقود؛ صنفت عائلات `/answer/`, `/hub/`, `/solutions/`, `/docs/`, `/blog/`, `/assessment/` وربطتها بمالكيها الفعليين.
- وثقت 6 city redirect aliases بلا H1 وموسومة `noindex`، و13 HTML outputs تحت 300 كلمة منها redirect/utility وquick answers قصيرة؛ مقالات المصدر **97/97** اجتازت حد 1200 كلمة.
- وثقت architecture الحالية للـrobots/llms/sitemap/redirects/headers وCloudflare: 209 redirects مفحوصة بدون chains/cycles، وCloudflare HTTP enforcement بقي غير مثبت live.
- سجلت تصميم baseline: CSS layers متعددة، page-scoped styles وraw utility/inline patterns، `ClientRouter`/hydration، وحجم `9.mp4` المسجل سابقًا **~7.96MB** مع CWV الفعلية `N/A`.

### الملفات المتأثرة
- `audit/report/2026-09-03-technical-seo-baseline.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm build` ✅ — exit 0؛ تحذيرات route collisions legacy وVite موثقة في التقرير.
- `pnpm typecheck` ✅ — 0 errors، 0 warnings، 2 hints.
- `pnpm test` ✅ — 70/70 root tests.
- `pnpm seo:hreflang` ✅ — 264 sets، 0 errors.
- `pnpm seo:schema` ✅ — schema 62 صفحة وspeakable 267 صفحة.
- `pnpm seo:gate` ✅ — 263 sitemap URLs، 0 broken/canonical/noindex policy errors.
- `pnpm redirects:check` ✅ — 209 redirects، 0 chains/cycles/missing/duplicates.
- `pnpm internal-links:audit` ⚠️ — architecture gate PASS، لكن source audit وجد عطلين CSS داخل demos لمهارة تحت `.agents/skills/scroll-world-storytelling/`.
- `pnpm lint` ❌ — خطآن قائمين في `apps/dashboard/lib/observability/logger.ts:81`.
- `pnpm verify:live:headers` ⏭️ — DNS غير متاح؛ 20/20 fetches فشلت، لذلك live HTTP/CWV/indexing = `N/A`.

### النتيجة
- **الحالة:** جزئي / CONDITIONAL baseline.
- **مختصر:** صار عند المشروع baseline محلي قابل لإعادة التشغيل ومربوط بمصادر الملكية الفعلية، لكن route collisions وقياسات live/CWV تحتاج جولة لاحقة قبل أي optimization أو ادعاء جاهزية إنتاجية.

### ملاحظات / مشاكل مفتوحة
- الـbuild أنشأ آثارًا محلية في sitemap وبعض نسخ media؛ ما تم commit أو push، ويجب تنظيف artifacts قبل أي commit.
- اختلاف `og:locale` للإنجليزية (`en_SA` في التنفيذ مقابل policy `en_US`) وتعدد مصادر hreflang موثقين كـP1، بدون تعديل ضمن مهمة baseline.
- لا Search Console/CrUX/PSI/Lighthouse أو production HTTP evidence: `N/A`.

## [2026-09-03] — تنفيذ حزمة SEO/Semrush وتسليم تقرير صريح بالحدود

### تم التنفيذ
- خزّنت نتائج Semrush وissue details في `seo/raw/` وأنشأت baseline والتقرير وخريطة الكلمات وملفات Lighthouse.
- وثّقت FACTs: 113 Error و929 Warning و403 Notice من 313 صفحة، ووسمت الرصيد والـrecrawl وLighthouse غير المتاحة بوضوح.

### الملفات المتأثرة
- `seo/`, `.gitignore`, `.agents/mind/01-mind-latest.md`

### التحقق
- Semrush pulls ✅؛ `pnpm build` ✅ (Complete 29.66s، مع تحذيرات route collision/Vite معروفة)؛ Lighthouse ⏭️ لعدم وجود CLI.

### النتيجة
- **الحالة:** جزئي / CONDITIONAL — يلزم نشر وإعادة crawl لإثبات التحسن.

### ملاحظات / مشاكل مفتوحة
- لا commit ولا push ولا deploy.

## [2026-09-03] — إصلاح أخطاء Semrush Site Audit (113 خطأ)

### تم التنفيذ
- حذفت توجيه `Content-Signal` غير المدعوم من `public/robots.txt`، مع الإبقاء على سياسة السماح والـ sitemap.
- حصّنت مولّد hreflang ضد القيم الفاضية والتكرار، وأبقيت صفحة 404 على self-reference صحيح حتى يمر تدقيق التبادلية.
- غيّرت تعريف Kernel من `SoftwareApplication` إلى `WebApplication` لأن تقييمات المراجعات غير متوفرة بمصدر حقيقي؛ ما فيه أي أرقام تقييم مفبركة.
- عطّلت LocalBusiness العام في صفحات المدن غير الرياض، لأن الصفحة تمثل نطاق خدمة وتستخدم `ProfessionalService` مع service area بدون عنوان فرع وهمي.
- أزلت microdata FAQ القديمة غير الصحيحة من HTML النهائي للمقالات؛ أسئلة وأجوبة المقالات المرئية بقيت كما هي، وJSON-LD المنظم هو المصدر المعتمد.

### الملفات المتأثرة
- `public/robots.txt`
- `astro.config.mjs`
- `scripts/rehype-strip-legacy-faq-microdata.mjs`
- `src/components/SEOHead.astro`
- `src/layouts/BaseLayout.astro`
- `src/layouts/ArabicLayout.astro`
- `src/data/schema-helpers.ts`
- `src/pages/index.astro`
- `src/pages/404.astro`
- `src/pages/solutions/[sector]/[city].astro`

### التحقق
- `pnpm build` ✅ — اكتمل بنجاح.
- `pnpm astro build` ✅ — اكتمل بنجاح بعد آخر تعديل.
- `pnpm seo:hreflang` ✅ — 263 مجموعة، 0 أخطاء.
- فحص HTML المولّد ✅ — 0 ملفات فيها hreflang فاضي، 0 ملفات فيها `SoftwareApplication`، و0 مقالات فيها microdata FAQ قديمة.
- `pnpm astro check` ⚠️ — ما زال يفشل بأخطاء TypeScript قديمة خارج نطاق أخطاء Semrush، منها Storybook وملفات API وملفات client.
- `node scripts/seo-schema-audit.mjs` ⚠️ — أظهر مشكلة سابقة منفصلة في `solutions/ai-firewall` (FAQPage مفقود بعد build؛ ليست من أخطاء Semrush الثلاثة المعالجة هنا).

### النتيجة
- **الحالة:** جزئي محليًا / إصلاحات Semrush منفذة.
- **مختصر:** تم إصلاح جذور أخطاء Semrush الـ113 المستهدفة في الكود والناتج المولّد. لازم نشر التغييرات ثم إعادة تشغيل الحملة `31075135` عشان يتحدث التقرير البعيد؛ ما تم أي commit أو push.

### ملاحظات / مشاكل مفتوحة
- Snapshot Semrush الحالي قديم وسيظل يعرض 113 إلى أن تتم إعادة الزحف بعد النشر.
- بقيت تحذيرات Semrush الأخرى خارج طلب “Errors” مثل روابط GitHub 404 وملفات JavaScript، وتحتاج جولة مستقلة.

## [2026-09-03] — بحث Semrush عربي وخريطة سلطة موضوعية سعودية لـ BRIGHTAI

### تم التنفيذ
- استخدمت Semrush connector وقاعدة السعودية `sa` لقياس 51 كلمة عربية و51 كلمة إنجليزية، ثم وسّعت البحث العربي إلى الحوكمة والمخاطر وحماية البيانات والتحول الرقمي والشات بوت؛ أربع صيغ من قائمة exact رجعت بقياسات فعلية والباقي وُثّق `no_data` بدل تحويله إلى صفر.
- قست حضور `brightai.live`: Semrush Rank **1,535,346**، كلمة عضوية واحدة، ترتيبها **62** وحجمها **210**، وزيارات عضوية مقدرة **0**.
- استخرجت أعلى الفرص العربية المناسبة: `نظام حماية البيانات الشخصية` **1,900/KD17**، `إدارة المخاطر` **1,600/KD18**، `التحول الرقمي` **1,600/KD31**، `شات بوت` **720/KD16**، `حوكمة البيانات` **480/KD23**، `شركات الذكاء الاصطناعي في السعودية` **170/KD8**، و`مخاطر الذكاء الاصطناعي` **110/KD20**.
- صنفت الكلمات الأعلى حجمًا لكنها غير صالحة كأهداف للرئيسية، ومنها `الذكاء الاصطناعي` **165,000/KD71** و`سدايا` **33,100/KD39** و`الأمن السيبراني` **22,200/KD50**؛ لأنها عامة أو ملاحية أو خارج نية المنتج المباشرة.
- حللت منافسي SERP لكلمات `AI governance` و`حوكمة البيانات` و`الأمن السيبراني` بعد أن أعاد تقرير منافسي النطاق المباشر `NOTHING FOUND` بسبب ضعف بصمة النطاق الحالية.
- أنشأت مخطط سلطة موضوعية يثبت الرئيسية كصفحة كيان/فئة تجارية، ويقسم الموقع إلى أعمدة حوكمة AI وPDPL والمخاطر والأدلة والاكتساب المجاور، مع خريطة ملكية تمنع التنافس الداخلي وخطة 90 يوم.
- راجعت الرئيسية: حوالي **15 H2 و40 H3**؛ القرار هو تخفيضها إلى **8–10 أقسام** وإرسال العمق للصفحات المالكة بدل زيادة الحشو.
- لم أستخدم أو أخزن بيانات الدخول الحساسة الموجودة في المرفق.

### الملفات المتأثرة
- `audit/website-builder-SEO/SEMRUSH-SA-KEYWORD-RESEARCH-2026-09-03.md`
- `audit/website-builder-SEO/SEMRUSH-SA-EXACT-KEYWORDS.csv`
- `audit/website-builder-SEO/SEMRUSH-SA-LONGTAIL-OPPORTUNITIES.csv`
- `audit/website-builder-SEO/SEMRUSH-SA-SERP-COMPETITORS.csv`
- `audit/website-builder-SEO/BRIGHTAI-SA-HIGH-VOLUME-ARABIC-KEYWORDS.csv`
- `audit/website-builder-SEO/BRIGHTAI-SA-PAGE-OWNERSHIP-MAP.csv`
- `audit/website-builder-SEO/BRIGHTAI-SA-TOPICAL-AUTHORITY-BLUEPRINT-2026-09-03.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- Semrush `phrase_these` ✅ — 102 صيغة دقيقة، 4 measured والباقي no-data غير مساوى بالصفر.
- Semrush `domain_rank` + `resource_organic` ✅ — اتساق الكلمة الوحيدة مع شريحة الموضع 61–70.
- Semrush `phrase_fullsearch` + `phrase_organic` ✅ — توسعات وSERPs من قاعدة السعودية.
- فحص CSV آلي للبنية وعدد الأعمدة ✅ — 6 ملفات CSV موجودة داخل مجلد التدقيق، وكل صف مطابق لعدد أعمدة ترويسته مع تجاهل الأسطر الفارغة.
- فحص الأسرار على ملفات المخرجات الجديدة ✅ — لا API keys ولا كلمات مرور ولا Authorization headers محفوظة.
- `git diff --check` ✅ — لا أخطاء whitespace في ملفات المهمة؛ ظهر تحذير fsmonitor محلي فقط.
- build/tests: لم تُشغّل — مخرجات بحث وتوثيق فقط، بدون تعديل كود الموقع.

### النتيجة
- **الحالة:** نجح.
- **مختصر:** صار للمشروع baseline سعودي موثق من Semrush، قائمة عربية مرتبة بالحجم والملاءمة، مالك واحد لكل نية، وهيكل رئيسية وخطة 90 يوم لبناء السلطة بدون keyword stuffing أو تضارب صفحات.

### ملاحظات / مشاكل مفتوحة
- تقرير منافسي النطاق المباشر لم يرجع بيانات؛ منافسو التقرير هم منافسو SERP وليسوا بالضرورة منافسين تجاريين.
- بيانات الدخول المرسلة في المرفق مكشوفة داخل المحادثة ويُوصى بتدويرها؛ لم تُستخدم أو تُنسخ للمستودع.
- لا commit ولا push ولا deploy.

## [2026-09-03] — برومبتز تنفيذية لإدخال الكلمات العربية وبناء السلطة الموضوعية

### تم التنفيذ
- أنشأت حزمة برومبتز تنفيذية عربية بلهجة سعودية بيضاء للتخطيط، الرئيسية، أعمدة PDPL والمخاطر والحوكمة، AI Firewall، ISO/SDAIA/NCA، المقارنات، الشات بوت، والتحول الرقمي.
- أضفت قواعد مشتركة تمنع keyword stuffing، اختلاق الأرقام والعملاء والشهادات، والادعاء بالاعتماد أو الامتثال الكامل بدون مصدر.
- أضفت برومبتًا خاصًا لتحويل ملف «كيفية تعزيز خصوصيتك...» إلى مقال أصلي، مع فصل المحتوى التوعوي عن الاستشارة القانونية.
- أضفت برومبت مدير مشروع لمنع cannibalization وبرومبت تحديث آمن وبرومبت QC قبل النشر.
- وثقت خطة تنفيذ 12 أسبوعًا: تثبيت الملكية، بناء الأعمدة، الجسور والاكتساب، التنظيف والربط، ثم القياس بـGSC وSemrush.

### الملفات المتأثرة
- `audit/website-builder-SEO/BRIGHTAI-SA-EXECUTION-PROMPTS.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- مراجعة يدوية لبنية البرومبتز، الكلمات العربية، URLs/الصفحات المالكة، حواجز الادعاءات النظامية، وتسلسل المراحل ✅
- `git -c core.fsmonitor=false diff --check` يُشغّل بعد التعديل.
- build/tests: لم تُشغّل — مخرج تخطيطي/تحريري فقط، بدون تعديل كود الموقع.

### النتيجة
- **الحالة:** نجح.
- **مختصر:** صار عند المشروع نظام برومبتز قابل للنسخ والتنفيذ يدرج الكلمات داخل نياتها الصحيحة، مع خطة صفحات تمنع التداخل وتبني سلطة موضوعية سعودية تدريجيًا.

### ملاحظات / مشاكل مفتوحة
- البرومبتز لا تنشر المقالات تلقائيًا؛ تحتاج تشغيلها على النص أو تنفيذها داخل ملفات الموقع بإذن المهمة.
- لا commit ولا push ولا deploy.

## [2026-09-03] — برومبتز تنفيذية لبناء السلطة الموضوعية السعودية (محتوى سعودي عامي)

### تم التنفيذ
- أنشأت `audit/website-builder-SEO/BRIGHTAI-SA-EXECUTION-PROMPTS.md` يحتوي **17 برومبت تنفيذيًا جاهزًا للنسخ/اللصق** مقسمة المراحل P0/P1/P2 + برومبت موحد "فحص الجودة قبل النشر".
- كل برومبت يشمل: الهدف، الكلمات المستهدفة، نية البحث، البنية (H1/H2 بصيغة سؤال-جواب)، قواعد GEO، الروابط الداخلية (URLs حقيقية)، الـ CTA، وقيود عدم اختلاق أرقام/اعتمادات/جهات.
- أضفت "نظام النبرة" المشترك: عربية فصيحة مبسّطة بلمسة سعودية عامية خفيفة بلسان خبير (مو عامية شارع ولا فصحى متكلفة) مع أمثلة عبارات وانطلاق answer-first 40–60 كلمة.
- غطّيت الأولويات من خطة الـ 90 يوم: تحديث العمود الحوكمة، صفحة الشراء، توحيد PDPL/NCA، ربط ISO 42001، دليل PDPL+GenAI، قالب AI Audit Trail Schema، مقارنة مصطلحات الجدار، حالات قطاعية، معايير اختيار مورّد، تحويل PDF، وقوالب/checklists الـ P2.
- أدخلت ملاحظة تنفيذية عن "إدخال الكلمات": حقنها عبر البنية والأسئلة الفرعية، لا وضع كل كلمة في H1 (تجنب keyword stuffing الذي يضر GEO بـ −10%).

### الملفات المتأثرة
- `audit/website-builder-SEO/BRIGHTAI-SA-EXECUTION-PROMPTS.md` (جديد)

### التحقق
- فحص يدوي: بنية الملف، وجود كل القواعد والروابط، إزالة سطر GEO المكرر، واستعادة قواعد GEO الخاصة بـ P1-2 في موضعها ✅
- build/tests: لم تُشغّل — توثيق استراتيجي فقط، لا تغيير على كود الموقع

### النتيجة
- **الحالة:** نجح
- **مختصر:** ملف برومبتز تنفيذية مكتمل ومتسق مع خطة الـ 90 يوم وخريطة السلطة، بأسلوب سعودي عامي خفيف بلسان خبير.

### ملاحظات / مشاكل مفتوحة
- البرومبتز وصفية (نصوص توجيه) وليست صفحات منشورة؛ التنفيذ يتطلب إدخالها في أداة كتابة محتوى أو مباشرة بإذن المستخدم.
- لا commit ولا push.
## [2026-09-03] — QC-REMEDIATION-007: الداشبورد والرسوم البيانية والتحليلات القابلة للتنفيذ (PROMPT-07)

### تم التنفيذ
- فصلت عيب P2-2 (تكرار KPI): كرتا "Average Completion Time" و"Average Resolution" كانا يعرضان نفس الرقم؛ صارت "Average Completion Time" = AVG(completed_at − created_at) من الإنشاء إلى إكمال الفني، وكرت جديد "Average Work Duration" = AVG(completed_at − started_at) من بدء العمل إلى الإكمال، مع مفتاح drill-down جديد `average_completion` وإعادة تسمية ترويسة تقرير employee-performance إلى "Average Work Duration".
- أضفت المقام ومعادلة الحساب على كل بطاقة KPI تنفيذية (N مرئي على البطاقة + tooltip بالمعادلة)، وأضفت مقام `completed_tasks` إلى `KpiSnapshot`.
- طبّقت قاعدة N=0 التنفيذية: `formatKpiDuration/formatKpiPercent` تعرض "N/A (N=0)" بدل 0 hours/0%/100% للمقام الصفر (شملت SLA Compliance التي كانت تعرض 0.0% مضللة، وCompletion Rate، وEvidence Compliance، وchecklist، وبطاقة نسبة الإكمال في جزيرة الرسوم).
- أنشأت وحدة نقية `src/lib/chartTables.ts` ومكون `src/components/charts/ChartTableToggle.tsx`: زر "عرض كجدول بيانات" (aria-expanded/aria-controls) يفتح جدولًا دلاليًا 1-to-1 (caption، th scope=col/row، tfoot إجمالي) لـ12 رسم SVG في الداشبورد والمختبر، مع aria-label يبدأ بخلاصة "أكبر شريحة بنسبتها" (`chartTakeaway`).
- عالجت P1-4 بمؤشرات نطاق صريحة فوق قسم Laboratory (شريحان: Task metrics مقيدة بالفلاتر / Lab metrics لكل سجلات المختبر + ملاحظة صريحة عند تفعيل الفلاتر) بدل الفلترة الصامتة المفككة؛ قرار موثق: لا تطبيق فلاتر المهام على المختبر لأن أبعاده مختلفة ولتطابق أرقام البطاقات مع drill-down السجلات.
- أضفت EmptyState قابل للإجراء عند فلاتر بلا نتائج (total=0) مع رابط "Reset filters".
- أضفت هجرة `040_dashboard_created_at_index.sql` (فهرس `idx_tasks_created_at` المفقود المطلوب برومبت) + تحديث migrationRegistry وschema.sql وعدّادات الإصدار 39→40 في 8 سكربتات اختبار.
- أنشأت سويت `test:dashboard-analytics-100` (58 فحصًا: أرقام KPI مقابل fixtures + إعادة اشتقاق SQL، تكافؤ رسم↔جدول، N=0، أداء 0.03ms، scope الموظف own_tasks) وسجلته بالمانيفست (85 سويت)، ووسّعت `e2e-dashboard.mjs` بسيناريو 6 (فتح/إغلاق زر الجدول، تحقق DOM للجدول، N=0، مؤشرات النطاق) ومحلل aria-label محدّث ومقارنة KPI المعرضة بناتج SQL.

### الملفات المتأثرة
- `apps/qc-task-manager/src/lib/dashboard.ts` · `src/lib/chartTables.ts` (جديد) · `src/lib/reporting/queries.ts` · `src/lib/reporting/catalog.ts` · `src/lib/migrationRegistry.ts`
- `apps/qc-task-manager/src/components/DashboardCharts.tsx` · `src/components/LabDashboardCharts.tsx` · `src/components/charts/ChartTableToggle.tsx` (جديد)
- `apps/qc-task-manager/src/pages/dashboard.astro` · `src/pages/dashboard/drilldown.astro`
- `apps/qc-task-manager/db/migrations/040_dashboard_created_at_index.sql` (جديد) · `db/schema.sql`
- `apps/qc-task-manager/scripts/test-dashboard-analytics-100.mjs` (جديد) · `scripts/e2e-dashboard.mjs` · `scripts/test-manifest.mjs` · `package.json` · عدّادات 39→40 في 8 سكربتات اختبار
- `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-07-EVIDENCE.md` (جديد)

### الأرقام
- test:dashboard-analytics-100: **58/58** · test:dashboard-reports (التحقق النهائي للبرومبت): **PASS** · test:migrations: **PASS** · embedded parity: **40/40** · schema-reference: **166 كائنًا** · manifest: **85 canonical / 28 E2E** · typecheck: **0/0/0** · build إنتاجي: **Complete 12.57s** · استعلام created_at+status: **0.03ms (< 20ms)**.
- جداول بديلة: **12/12 رسم** (6 داشبورد + 6 مختبر).

### القرارات
- لا بطاقة "Average Review & Resolution Time" (completion→sign-off): نموذج المهام بلا timestamp اعتماد منفصل، وأي رقم كان سيكون مختلقًا مخالفًا لقاعدة عدم التضليل — البديل مقياس حقيقي مميز موثق في الأدلة.
- مؤشرات النطاق الصريحة بدل توحيد فلاتر المختبر: أبعاد المختبر مختلفة، والفلترة الجزئية كانت ستكسر تطابق البطاقة مع الـdrill-down.
- الجدول البديل render شرطي وليس display:none، والفهرس أُضيف رغم أن مسند date() لا يستفيد منه لبحث المدى — موثق بصدق في قسم حدود الأدلة.

### التحقق
- `pnpm run test:dashboard-analytics-100` ✅ 58/58 · `pnpm run test:dashboard-reports` ✅ · `test:migrations` ✅ · `test:embedded-migration-parity` ✅ 40/40 · `test:schema-reference` ✅ 166 · `test:manifest` ✅ 85/28 · `test:scheduled-notifications` ✅ 69/69 · `test:db-doctor` ✅ · `typecheck` ✅ 0/0/0 · `build` ✅.
- `pnpm test` الكاملة و`pnpm run e2e:acceptance` و`e2e-dashboard` المركز ⏭️ **تجاوز صريح بأمر المستخدم ("تجاوز التحقق")** — السويتات المكتوبة غير مشغلة على الشجرة النهائية.

### النتيجة
- **الحالة:** جزئي (PARTIAL) — المعايير 6/6 منفَّذة ومتحقق منها محليًا بالحدود المتاحة؛ التحقق المتصفحي والسلسلة الكاملة متوقفة بتجاوز المستخدم.
- **مختصر:** صار الداشبورد بمؤشرين زمنيين حقيقيين مختلفين بمقامات مرئية، وقاعدة N=0 صارمة، و12 رسمًا بجداول بديلة مختبرة التكافؤ وحدويًا، وفهرس created_at مضاف — والأدلة في PROMPT-07-EVIDENCE.md.

### ملاحظات / مشاكل مفتوحة
- إعادة تشغيل `pnpm test` + `e2e:acceptance` (بما فيها Scenario 6 الجديد) شرط لإغلاق البرومبت بالكامل — متوقفة بأمر المستخدم.
- تحذيرات backup المؤقتة أثناء fixture معروفة ومتوقعة ولا تؤثر على النتائج.
- لا commit ولا push ولا deploy.

## [2026-09-03] — SEO/GEO: استكمال مخرجات خطة السلطة الموضوعية السعودية (نظام seo-geo skill)

### تم التنفيذ
- قرأت العقل ومهارة `.agents/skills/seo-geo/` كاملة (SKILL + geo-research + tools-and-apis) وأكّدت أن البحث الكامل بالقياسات المقيّمة موجود مسبقًا في `SEO-GEO-KEYWORD-COMPETITOR-RESEARCH-2026-09-03.md` (نفس اليوم) — لم أكرر استدعاءات DataForSEO المدفوعة (credentials غير متوفرة في env؛ القياسات المخزّنة في dfs-*.json كافية).
- أثرتُ `brightai-sa-keyword-research.csv` من 25 إلى 38 عمودًا (51 صفًا محفوظة): parent_topic, subcluster, entity, page_type, business_fit, saudi_relevance, geo_citation_potential, topical_authority_value, opportunity_score, serp_overlap_cluster, competitor_gap, zero_volume_strategic, source_timestamp — القياسات الرقمية لم تُمَس؛ الأعمدة الجديدة تقييم تحريري موثق بمصدر تاريخي، والأصفار المقاسة وُسمت strategic zero-volume.
- أنشأت 7 مخرجات ناقصة: خريطة السلطة الموضوعية، فجوات المحتوى، منافسو SERP مصنفون، التعارض الداخلي، خريطة الروابط الداخلية، خطة 90 يوم، والتقرير التنفيذي.
- خريطة الروابط الداخلية مبنية على URLs فعلية مجردة من `src/` (solutions: ai-governance-platform, ai-firewall, ai-audit-trail, ai-risk-classification, human-approval-layer, ai-evidence-file, ai-use-case-discovery + قطاعات).

### الملفات المتأثرة
- `audit/website-builder-SEO/brightai-sa-keyword-research.csv` (enriched)
- `audit/website-builder-SEO/BRIGHTAI-SA-TOPICAL-AUTHORITY-MAP.md`
- `audit/website-builder-SEO/BRIGHTAI-SA-CONTENT-GAPS.csv`
- `audit/website-builder-SEO/BRIGHTAI-SA-SERP-COMPETITORS.csv`
- `audit/website-builder-SEO/BRIGHTAI-SA-CANNIBALIZATION.csv`
- `audit/website-builder-SEO/BRIGHTAI-SA-INTERNAL-LINKING-MAP.csv`
- `audit/website-builder-SEO/BRIGHTAI-SA-90-DAY-AUTHORITY-PLAN.md`
- `audit/website-builder-SEO/BRIGHTAI-SA-KEYWORD-RESEARCH-REPORT.md`

### التحقق
- قراءة التقرير الأساسي (881 سطرًا) وجرد فعلي لـ src/content وsrc/pages ✅
- Python CSV validation: 51 rows × 38 cols، القياسات سليمة ✅
- build/tests: لم تُشغّل — مخرجات بحث وتوثيق فقط، لا تغيير على كود الموقع

### النتيجة
- **الحالة:** نجح (جزئي النطاق — انظر الملاحظات)
- **مختصر:** كل المخرجات الإلزامية الثمانية موجودة الآن ومبنية على قياسات DataForSEO السعودية (location 2682) وواقع الريبو بدون أي رقم مختلق.

### ملاحظات / مشاكل مفتوحة
- opportunity_score والعلامات النوعية تقديرات تحريرية من weights موثقة (25/20/15/15/10/10/5 تقريبيًا عبر priority+intent) — ليست قياسات مزود؛ تُعاد مع بيانات GSC.
- قياسات إضافية (SERP features رقمية، KD إنجليزي، backlinks) تتطلب DataForSEO credentials في env — لم تُشغّل لتجنب تكلفة بلا طلب صريح.
- لا commit ولا push.


## [2026-09-03] — QC-REMEDIATION-005: إصلاح تصدير PDF العربي/RTL وتقارير مهام الجودة

### تم التنفيذ
- وحّدت تصدير تقارير المهام مع كاتب PDF Unicode الموجود في `apps/qc-task-manager/src/lib/reporting/writers/pdf.ts`، وأضافت المعالجة تشكيل العربية، ترتيب BiDi، خرائط ToUnicode، تضمين خط IBM Plex Sans Arabic المحلي، `/Lang (ar)`، اتجاه القراءة `/R2L`، وإصلاح حفظ كل صفحات التقارير الطويلة.
- أنشأت `apps/qc-task-manager/src/lib/taskPdf.ts` لتجميع تقرير ثنائي اللغة بترويسة QC/CoA احترافية تشمل Task ID وStatus وPriority وInspector Name وDate/Generated ووسم `E-SIGNATURE BADGE: VERIFIED` وبيانات الأدلة.
- حدّثت مسار `src/pages/api/export/tasks/pdf/[id].ts` ليعيد PDF بـ `charset=utf-8` و`Content-Disposition: inline` ويسجل حدث `report_exported` في `task_activity_log`، مع بقاء المصادقة وRBAC و404 العام للمهام غير المصرح بها.
- شدّدت print CSS و`PrintLayout.astro` لإخفاء chrome، منع تقطيع الصفوف والأقسام، استخدام A4، وتحميل الخط المحلي بـ `font-display: swap`.
- أضفت suite كنسي `test:export-reports-100`، وربطت diagnostic العربي بالأمر المباشر `node scripts/test-report-pdf-arabic.mjs`، وحدّثت manifest وfixture runner ليستخدم `NODE_ENV=test` فقط لقواعد بيانات الاختبار المعزولة.
- وثّقت الأدلة التشغيلية في `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-05-EVIDENCE.md`.

### الملفات المتأثرة
- `apps/qc-task-manager/src/lib/reporting/writers/pdf.ts`
- `apps/qc-task-manager/src/lib/taskPdf.ts`
- `apps/qc-task-manager/src/pages/api/export/tasks/pdf/[id].ts`
- `apps/qc-task-manager/src/lib/activity.ts`
- `apps/qc-task-manager/src/lib/taskDetails.ts`
- `apps/qc-task-manager/src/layouts/PrintLayout.astro`
- `apps/qc-task-manager/src/styles/global.css`
- `apps/qc-task-manager/scripts/test-report-pdf-arabic.mjs`
- `apps/qc-task-manager/scripts/test-export-reports-100.mjs`
- `apps/qc-task-manager/scripts/e2e-acceptance.mjs`
- `apps/qc-task-manager/scripts/test-manifest.mjs`
- `apps/qc-task-manager/package.json`
- `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-05-EVIDENCE.md`

### الأرقام
- تشخيص PDF العربي: **34/34**.
- اختبار التصدير المخصص: **20/20**.
- الاختبارات الوحدوية الكنسية: **83/83**.
- full E2E: **30/30 suites، صفر فشل، 3059+ assertion ناجح**؛ مرحلتا restart persistence نجحتا لكنهما لا تطبعان عدادات رقمية، لذلك ظهر الإجمالي بصيغة `3059+`.
- focused lab E2E: **94/94**، وresponsive E2E: **648/648**، وreports E2E: **912/912**.

### القرارات
- أبقيت `src/lib/pdf.ts` القديم للتوافق مع اختبار المجال الموجود، واستخدمت writer Unicode المشترك لمسار task export الجديد حتى ما يصير pipeline ثاني منفصل لمعالجة العربية.
- اعتبرت دور `employee` هو Inspector في طبقة الصلاحيات الحالية بدل إضافة role جديد؛ هذا يطابق نموذج المستخدمين القائم ويمنع تغيير schema.
- عدّلت runner فقط في بيئة fixture المعزولة إلى `NODE_ENV=test` لأن `QC_SEED_MUST_CHANGE_PASSWORD=0` ممنوع في production؛ build نفسه ظل production-compatible.

### المشاكل / الحلول
- فشل `test-report-pdf-arabic.mjs` المباشر سابقًا بسبب غياب TS loader عولج بbootstrap يعيد تشغيل الأمر نفسه مع loader المشروع.
- فشل عقد PDF في full E2E بسبب غياب النص الحرفي `Generated:` عولج بإضافته إلى metadata مع بقاء الحقل العربي/الثنائي في الترويسة.
- ظهرت مرة مشكلة chunks مؤقتة أثناء E2E؛ إعادة التشغيل النهائية تجاوزتها ونجحت كل suites بدون فشل.

### التحقق
- `node scripts/test-report-pdf-arabic.mjs` ✅
- `pnpm run test:export-reports-100` ✅
- `node scripts/test-manifest-guard.mjs` ✅ — 83 canonical / 28 E2E
- `node_modules/.bin/astro check` ✅ — 0 أخطاء، 0 تحذيرات، 0 hints
- `node_modules/.bin/astro build` ✅
- `pnpm test` ✅ — 83/83
- focused `/lab/tests/1/print` E2E ✅ — print emulation + A4 PDF
- `pnpm e2e:acceptance` ✅ — 30/30 suites، 0 failed

### النتيجة
- **الحالة:** نجح (100%).
- **مختصر:** تم إصلاح عيب تشكيل العربية وBiDi في تصدير PDF، إضافة ترويسة QC/CoA ثنائية اللغة وتدقيق التصدير، وتجاوزت اختبارات الوحدة وE2E والبناء كاملة بدون دفع أو commit.

### ملاحظات / مشاكل مفتوحة
- لا يوجد. تحذيرات backup التي ظهرت أثناء اختبارات قواعد البيانات المؤقتة متوقعة ولا تؤثر على النتيجة.

## [2026-09-02] — QC-REMEDIATION-004: سير عمل ضبط الجودة، التوقيع الإلكتروني المزدوج وختم السجلات وتحديثات طلبات التغيير

### تم التنفيذ
- أعدت هيكلة وتصميم نموذج طلبات التغيير المخبرية في `src/pages/lab/change-requests/new.astro` من عرض حقول الجداول المسطحة إلى مسار نية المستخدم (Intent-Driven Wizard) من 3 خطوات واضحة (الهدف والنطاق، تقييم مخاطر GMP وخطة التراجع، وخطة العمل وتعيين المسؤولين) مع دعم كامل للوصولية وقارئات الشاشة عبر `aria-current="step"` ونصوص المساعدة السياقية `ContextualHelp.astro`.
- صممت ونفّذت مخطط التحقق الشامل `labChangeRequestIntentSchema` في `src/lib/validation.ts` ودمجه في خدمة `src/lib/lab/changeRequests.ts` لحفظ بيانات النية مع تفاصيل التغيير.
- أسست وحدة التحكم بسير العمل المخبري `src/lib/qcWorkflow.ts` التي تطبق العزل الصارم للمهام (Segregation of Duties)، وتمنع الفاحص أو منشئ الفحص من اعتماده إطلاقاً (`Segregation of duties violation: Analyst cannot approve own test.`) وتعيد كود المنع `403 Forbidden` عند استدعاء نقطة النهاية `/api/lab/tests/[id]/review` عبر المتصفح أو API مباشرة.
- نفّذت التوقيع الإلكتروني ثنائي النية (Dual-Intent E-Signature): التحقق من كلمة المرور من جهة الخادم وطلب سبب الاعتماد الإلزامي، مع تسلسل السجل وتشفيره وحساب بصمة `SHA-256` وتخزينه في جدول `lab_test_approvals`.
- وفّرت آلية التحقق من السلامة `verifyLabTestApprovalSealing` لكشف أي تلاعب لاحق بالبيانات المخبرية فوراً.
- ربطت ترقية الإصدارات الرئيسية للأدلة والإجراءات (SOP Major Version Bump) بتفعيل إشعارات الإقرار الإلزامية للمشغلين والمحللين تلقائياً في `lab_document_acknowledgements`.
- أنشأت الـ View الكنسي `lab_audit_log` وتريجرات الحماية الصارمة في SQLite (`qc_audit_log_no_delete`, `lab_test_approvals_no_delete`, `lab_test_approvals_no_update`, `lab_test_records_frozen_after_approval_update`) لمنع أي حذف أو تعديل لسجلات التدقيق والتوقيعات بعد الاعتماد.
- أنشأت 4 سويتات اختبارات كنسية جديدة: `test:qc-compliance-100` (16 فحصاً)، `test:lab-workflows-100` (13 فحصاً)، `test:e-signature-integrity` (8 فحوص)، `test:lab-change-request-intent` (14 فحصاً)، وسجلتها في `package.json` و `test-manifest.mjs`.
- حررت وثيقة الأدلة التشغيلية الرسمية في `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-04-EVIDENCE.md`.

### الملفات المتأثرة
- `apps/qc-task-manager/src/lib/qcWorkflow.ts` (جديد)
- `apps/qc-task-manager/src/pages/lab/change-requests/new.astro`
- `apps/qc-task-manager/src/lib/validation.ts`
- `apps/qc-task-manager/src/lib/lab/changeRequests.ts`
- `apps/qc-task-manager/src/lib/lab/review.ts`
- `apps/qc-task-manager/src/pages/api/lab/tests/[id]/review.ts`
- `apps/qc-task-manager/src/components/EsignDialog.astro`
- `apps/qc-task-manager/public/scripts/esign-confirm.js`
- `apps/qc-task-manager/src/lib/lab/documents.ts`
- `apps/qc-task-manager/scripts/test-qc-compliance-100.mjs` (جديد)
- `apps/qc-task-manager/scripts/test-lab-workflows-100.mjs` (جديد)
- `apps/qc-task-manager/scripts/test-e-signature-integrity.mjs` (جديد)
- `apps/qc-task-manager/scripts/test-lab-change-request-intent.mjs` (جديد)
- `apps/qc-task-manager/scripts/test-manifest.mjs`
- `apps/qc-task-manager/package.json`
- `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-04-EVIDENCE.md` (جديد)

### التحقق
- `pnpm run test:manifest` ✅ (81 canonical suites, 28 canonical E2E suites)
- `pnpm run test:qc-compliance-100` ✅ (16/16 checks passed)
- `pnpm run test:lab-workflows-100` ✅ (13/13 checks passed)
- `pnpm run test:e-signature-integrity` ✅ (8/8 checks passed)
- `pnpm run test:lab-change-request-intent` ✅ (14/14 checks passed)
- `pnpm run test:lab-review` ✅ (97/97 tests passed)
- `pnpm run test:lab-documents` ✅ (303/303 tests passed)
- `pnpm run test:lab-acknowledgements` ✅ (116/116 tests passed)
- `pnpm run test:embedded-migration-parity` ✅ (39/39 byte-identical)
- `pnpm run test:schema-reference` ✅ (165 catalog objects)
- `pnpm run test:database-100` ✅ (23/23 checks passed)
- `pnpm run test:architecture` ✅ (115 file routes, 25 middleware routes, 6 guards passed)
- `ASTRO_TELEMETRY_DISABLED=1 pnpm run typecheck` ✅ (310 files checked: 0 errors, 0 warnings, 0 hints)
- `ASTRO_TELEMETRY_DISABLED=1 pnpm run build` ✅ (Production server build succeeded in 14.62s)
- `pnpm test` ✅ (81/81 canonical suites passed)

### النتيجة
- **الحالة:** نجح (100%).
- **مختصر:** تم إنجاز جميع متطلبات PROMPT 04 وتجاوزت كافة معايير القبول AC-01 إلى AC-06 بنجاح مع ثبات كامل وتطابق تام للهجرات والمخططات دون أي دفع للريبو (No Push).

### ملاحظات / مشاكل مفتوحة
- لا يوجد. كل متطلبات الـ QC/QMS وسير العمل المخبري مكتملة بنسبة 100%.

## [2026-09-02] — تدقيق SEO/GEO حي شامل للنطاق brightai.live

### تم التنفيذ
- شغّلت مهارة `seo-geo` على `https://brightai.live` وفحصت الصفحة الرئيسية والميتا وH1 وcanonical وOpen Graph وhreflang وJSON-LD ووقت النقل الاصطناعي.
- تحققت من `robots.txt` عمليًا: 17/17 زاحف بحث وAI رجع HTTP 200 وكان مسموحًا، وشملت Googlebot وBingbot وGPTBot وChatGPT-User وOAI-SearchBot وPerplexityBot وClaudeBot وanthropic-ai.
- حللت `sitemap.xml`: 262 رابطًا، كلها على `brightai.live`، وصفر ذكر لـ`brightai.site`؛ مسح الصفحات الحية لم يجد `noindex` أو canonical مفقود.
- تحققت من `/llms.txt` و`/llms-full.txt` (200)، ومن عينة الصفحات الأساسية العربية والإنجليزية (200، H1 واحد، canonical وJSON-LD صالحان).
- راجعت قرار حذف `SearchAction` من `WebSite` schema وتأكدت أنه مقصود وصحيح لعدم وجود مسار `/search` عام، بدل إنشاء schema يشير إلى 404.
- فصلت عطل بوابات SEO المحلية عن الإنتاج: `dist/client` ignored يحتوي artifacts متقادمة بأسماء مثل `index 2.html`؛ المسارات المكافئة غير منشورة وترجع 404 ولا تظهر في sitemap.
- أنشأت تقرير الأدلة والأولويات في `audit/website-builder-SEO/SEO-GEO-AUDIT-2026-09-02.md` بدون تعديل كود الموقع أو النشر.

### الملفات المتأثرة
- `audit/website-builder-SEO/SEO-GEO-AUDIT-2026-09-02.md`
- `.agents/mind/01-mind-latest.md`

### الأرقام
- زواحف البحث وAI: **17/17 HTTP 200 + robots allowed**.
- sitemap: **262/262** على `brightai.live`، و**0** على `brightai.site`.
- الرئيسية: title 42 حرفًا، description 158 حرفًا، H1 واحد، JSON-LD واحد مدمج بعدة عقد، TTFB اصطناعي 0.317s وإجمالي نقل 0.337s؛ ليست قياسات CWV.

### التحقق
- `python3 scripts/seo_audit.py https://brightai.live` ✅ — load 0.62s، metadata/robots/sitemap موجودة.
- فحص crawler حي عبر Python/curl ✅ — 17/17؛ `node scripts/verify-crawler-access.mjs` ❌ بيئيًا لأن Node fetch لم يستخدم مسار البروكسي وأعاد `fetch failed` لكل الشبكة.
- `pnpm seo:schema` ✅ — schema 62 صفحة وspeakable 283 صفحة.
- `pnpm seo:all` و`pnpm seo:gate` ❌ محليًا — 50 خطأ مشتقة من artifacts قديمة داخل `dist/client` ignored، وليست أخطاء إنتاجية.
- إعادة فحص `/kernel/reports/` و`/terms/` بعد تعثر المسح المتوازي ✅ — كلاهما 200.

### النتيجة
- **الحالة:** جزئي / PASS للإنتاج الحي.
- **مختصر:** ما فيه P0 يمنع الزحف أو الفهرسة؛ الميتا والـschema والـrobots والـsitemap ووصول AI سليمة حيًا. البوابة المحلية الكاملة تحتاج تنظيف `dist/` بموافقة المستخدم ثم build وإعادة الفحص.

### ملاحظات / مشاكل مفتوحة
- لا يوجد دليل Search Console/Bing على الفهرسة والترتيب ضمن هذه المهمة، ولا Lighthouse/PSI لـLCP وINP وCLS.
- لم أحذف `dist/` التزامًا بمنع الحذف بدون تأكيد، ولم يحدث commit أو push أو deploy.

## [2026-09-02] — إضافة/تحديث مهارة SEO-GEO من opc-skills لـZed

### تم التنفيذ
- شغّلت `npx skills add https://github.com/resciencelab/opc-skills --skill seo-geo` مع كاش npm مؤقت مستقل بسبب صلاحيات كاش npm القديم.
- ثبّتُّ المهارة `seo-geo` للمشروع تحت `.agents/skills/seo-geo` بنسخة مستقلة (`--copy`) ومخصصة لـZed.
- حدّثت محتوى `SKILL.md` وأضافت الأداة ملفات `.claude-plugin/` و`examples/` و`references/` و`scripts/`.
- حدّثت `skills-lock.json` لتسجيل مصدر المهارة وتثبيتها.
- حافظت على ملف التكامل المتتبّع `.agents/skills/seo-geo/agents/openai.yaml` بعد أن أزالته أداة التثبيت، وأعدته لمحتوى النسخة الأصلية.

### الملفات المتأثرة
- `.agents/skills/seo-geo/`
- `skills-lock.json`
- `.agents/mind/01-mind-latest.md`

### التحقق
- أمر الإضافة النهائي ✅ — `Installation complete`, `Installed 1 skill: seo-geo (copied)`.
- قراءة `.agents/skills/seo-geo/SKILL.md` ✅ — frontmatter صالح والمهارة تحتوي تعليمات SEO/GEO ومراجعها.
- `skills list --json` ✅ — المهارة موجودة ومربوطة بالوكيل `Zed`.
- `git status` ✅ — تغييرات الإضافة محصورة في `seo-geo` و`skills-lock.json` وmind؛ ملف `agents/openai.yaml` رجع مطابقًا للنسخة الأصلية.
- تحذيرات YAML من مهارتي `dispatching-parallel-agents` و`minimalist-ui` ظهرت أثناء الفهرسة؛ خارج نطاق هذه المهمة ولم تُعدّل.

### النتيجة
- **الحالة:** نجح.
- **مختصر:** مهارة `seo-geo` صارت مثبتة محليًا ومكتشفة لـZed، بدون commit أو push.

### ملاحظات / مشاكل مفتوحة
- كاش npm الأصلي `~/.npm` ما زال يحتوي ملفات مملوكة لـroot؛ تم تجاوز المشكلة بكاش مؤقت بدون تغيير صلاحيات النظام.

## [2026-09-02] — QC-REMEDIATION-002: اعتمادية قاعدة البيانات والتزامن ومفاتيح منع التكرار (Idempotency)

### تم التنفيذ
- ثبّت واستخرجت إعدادات SQLite WAL pragmas الحتمية في `src/lib/db.ts` (`WAL`, `foreign_keys=ON`, `busy_timeout=5000`, `synchronous=NORMAL`) مع دالة تحقق فوري من صحة إعدادات الاتصال.
- صممت ونفّذت المعمارية الكنسية لمفاتيح منع التكرار في `src/lib/idempotency.ts` مدعومة بجدول `idempotency_keys` وفهارس فريدة ومفهرسة للمفاتيح الأجنبية `(user_id, key)` لمنع تضارب المفاتيح بين المستخدمين.
- طبقت حساب البصمة الرقمية للبيانات (SHA-256) لمنع هجمات التعديل (`400 Mismatched Payload`)، وحفظ الردود وإعادتها فورياً مع ترويسة `X-Idempotent-Replay: true` خلال نافذة صلاحية 24 ساعة، وكشف وتفادي التعارض اللحظي أثناء المعالجة (`409 Conflict`).
- حصّنت نقاط نهاية التعديل الحساسة بتغليفها بـ `withIdempotency`: إغلاق المهام (`/api/tasks/[id]/close`)، ومراجعة الفحوص المخبرية (`/api/lab/tests/[id]/review`)، وتعديل وتحديث دورة حياة الـ CAPA (`/api/findings/[id]/capa`).
- غلّفت جميع العمليات المعدلة لجداول متعددة داخل معاملات ذرية حتمية `db.transaction()` في `uploadAttachment` و `transitionCapa` و `addEvidence` و `createDeleteRequest` ومسار رفض طلبات الحذف في `reviewDeleteRequest`.
- عالجت مهلة قفل قاعدة البيانات (`SQLITE_BUSY`) بأمان عبر الوسيط والواجهات بإرجاع `503 Service Unavailable` مع ترويسة `Retry-After: 2` لمنع انهيار التطبيق والسماح بالمعاودة التلقائية.
- أنشأت سويت اختبار منع التكرار `scripts/test-idempotency.mjs` (11 فحصاً شاملاً) وسويت إجهاد التزامن والمعاملات `scripts/test-concurrency-transactions-100.mjs` (20 خيط متزامن بدون أي خطأ `SQLITE_BUSY`، ومطابقة عدد السجلات بنسبة 20/20، واجتياز `integrity_check` و `foreign_key_check` بـ 0 انتهاكات، وفحص سلبي لمهلة القفل).
- وثقت الأدلة التشغيلية في `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-02-EVIDENCE.md` مع استيفاء كافة المعايير 6/6 دون أي commit أو push.

### الملفات المتأثرة
- `apps/qc-task-manager/src/lib/db.ts`
- `apps/qc-task-manager/src/lib/idempotency.ts`
- `apps/qc-task-manager/src/lib/taskUpdates/attachments.ts`
- `apps/qc-task-manager/src/lib/qc-operations.ts`
- `apps/qc-task-manager/src/lib/deleteRequests.ts`
- `apps/qc-task-manager/src/pages/api/tasks/[id]/close.ts`
- `apps/qc-task-manager/src/pages/api/lab/tests/[id]/review.ts`
- `apps/qc-task-manager/src/pages/api/findings/[id]/capa.ts`
- `apps/qc-task-manager/src/middleware.ts`
- `apps/qc-task-manager/scripts/test-idempotency.mjs`
- `apps/qc-task-manager/scripts/test-concurrency-transactions-100.mjs`
- `apps/qc-task-manager/scripts/test-manifest.mjs`
- `apps/qc-task-manager/package.json`
- `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-02-EVIDENCE.md`

### التحقق
- `pnpm run test:manifest` ✅ (76 canonical suites, 28 canonical E2E suites)
- `pnpm run test:idempotency` ✅ (11/11 checks passed)
- `pnpm run test:concurrency-transactions-100` ✅ (7/7 checks passed, 20 parallel threads, 0 SQLITE_BUSY)
- `pnpm run test:database-100` ✅ (23/23 checks passed)
- `pnpm run test:embedded-migration-parity` ✅ (39/39 byte-identical)
- `pnpm run test:schema-reference` ✅ (165 catalog objects)
- `pnpm run test` ✅ (76/76 canonical unit suites passed)
- `ASTRO_TELEMETRY_DISABLED=1 pnpm astro check` ✅ (0 errors, 0 warnings, 0 hints across 308 files)
- `ASTRO_TELEMETRY_DISABLED=1 pnpm build` ✅ (Complete in 5.52s)
- `node scripts/e2e-acceptance.mjs` ✅ (30/30 suites passed, 3059+ assertions, 0 failures)

### النتيجة
- **الحالة:** نجح بالكامل (PASS - 6/6 المعايير مستوفاة)
- **مختصر:** تم تحصين قاعدة بيانات SQLite بنمط WAL ومهلة انشغال 5000ms، وتطبيق منع التكرار الحتمي بـ Idempotency-Key مع عزل الجلسات ونافذة 24 ساعة، وتأكيد ذرية المعاملات والتزامن لـ 20 خيط بدون أي تراجع.

### ملاحظات / مشاكل مفتوحة
- تم حل العيبين P1-7 و P2-6 بالكامل.
- تم رفع عدد السويتات الكنسية من 74 إلى 76 سويتاً بنجاح.
- جاهز للانتقال إلى PROMPT-03 أو البوابات التالية.

## [2026-09-02] — QC-REMEDIATION-001: معالجة عيوب P0 وفك حجب بوابات القبول الكنسية بالكامل

### تم التنفيذ
- أعدت إنتاج عيوب P0 الثلاثة في HEAD بشكل مستقل وموثق بالأدلة (Red-Green TDD).
- أصلحت عيب P0-1 في `scripts/test-observability.mjs`: حدّثت نص التحقق ليطابق رسالة الخطأ الآمنة المحسنة الصادرة من `src/lib/observability.ts`.
- أصلحت عيب P0-2 في `scripts/test-a11y-ergonomics-100.mjs`: حدّثت مسار فحص ملف الأدلة ليتعرف على ملف الأدلة الموحد `QC-TASK-MANAGER-ALL-EVIDENCES-COMBINED.md` مع استمرار دعم المسار المحلي.
- أصلحت عيب P0-3 في `scripts/e2e-delete-request.mjs`: صحّحت محدد زر تأكيد الحذف ليطابق نص الزر الفعلي `Delete task permanently` في `ReviewDeleteRequestDialog.tsx:83` ومحدد الرفض ليطابق `Reject deletion request`.
- عالجت التداعيات الإضافية لمحددات الواجهة بعد تحسينات النصوص السابقة: حدّثت محدد `Clear filters` في `e2e-task-search.mjs` ومحدد `No matching records` في `e2e-lab-search.mjs`.
- أنجزت فك الحظر الكامل لمنظومة الاختبارات: شغّلت كافة السويتات الكنسية الـ 74 للوحدات بنجاح 100%، وكامل سويتات القبول E2E الـ 28 مع مرحلتي فحص استمرارية إعادة التشغيل (إجمالي 30 سويت) بنجاح تام 0 أخطاء و 0 timeouts.
- وثقت كامل النتائج والأدلة التشغيلية في `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-01-EVIDENCE.md` مع استيفاء 6/6 من معايير القبول دون أي commit أو push.

### الملفات المتأثرة
- `apps/qc-task-manager/scripts/test-observability.mjs`
- `apps/qc-task-manager/scripts/test-a11y-ergonomics-100.mjs`
- `apps/qc-task-manager/scripts/e2e-delete-request.mjs`
- `apps/qc-task-manager/scripts/e2e-task-search.mjs`
- `apps/qc-task-manager/scripts/e2e-lab-search.mjs`
- `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-01-EVIDENCE.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm run test:observability` ✅ (0 assertions failed, exit code 0)
- `pnpm run test:a11y-ergonomics-100` ✅ (0 errors, 76 pages + 59 components verified)
- `node scripts/e2e-delete-request.mjs` ✅ (40/40 passed, duration 8.35s < 15s)
- `pnpm run test:manifest` ✅ (74 canonical suites, 28 canonical E2E suites)
- `pnpm run test` ✅ (74/74 canonical unit suites passed)
- `ASTRO_TELEMETRY_DISABLED=1 pnpm astro check` ✅ (0 errors, 0 warnings, 0 hints)
- `ASTRO_TELEMETRY_DISABLED=1 pnpm build` ✅ (Complete in 5.29s)
- `node scripts/e2e-acceptance.mjs` ✅ (30/30 acceptance suites passed, 3059+ assertions, 0 timeouts)

### النتيجة
- **الحالة:** نجح بالكامل (PASS - 6/6 المعايير مستوفاة)
- **مختصر:** عيوب P0 أغلقت رسمياً، وبوابات القبول تعمل الآن تتابعياً حتى النهاية بنجاح 100% وبدون أي حجب أو تعليق، والنظام جاهز للبوابات اللاحقة.

### ملاحظات / مشاكل مفتوحة
- تم تصفير جميع معوقات P0 في HEAD بنجاح (Remaining P0 Blockers = 0).
- جاهز للانتقال لـ PROMPT-02 ومتابعة خطة العلاج.

## [2026-09-02] — QC-REMEDIATION-000: تجميد خط الأساس لبرنامج العلاج والتحقق الشامل من البيئة

### تم التنفيذ
- جمّدت خط الأساس البرمجي والبيئي لبدء برنامج العلاج الشامل عند HEAD `9bba1817acf92ffba48cd318a55580e8192a4a7d`.
- تحققت من اشتراطات بيئة التشغيل: Node.js `v22.22.3` (>= 20)، pnpm `10.19.0` (>= 9)، macOS ARM64، وتفعيل `ASTRO_TELEMETRY_DISABLED=1`.
- شغّلت حارس المانيفست `test:manifest` وتحققت من مطابقة 74 سويتاً كنسياً للوحدات و 28 سويتاً لـ E2E مع 0 سكريبتات يتيمة (Orphans).
- شغّلت حارس المسارات `route-manifest.mjs --check` وتأكدت من مطابقة 115 مسار ملف و 25 مسار وسيط محمي و 6 حراس رقابية.
- تحققت من تطابق هجرات قاعدة البيانات المضمنة بنسبة 100% (39/39 هجرة متطابقة sha256 بايت لبايت) ومطابقة كتالوج قاعدة البيانات (165 كائناً).
- أجريت الاختبار السلبي للحارس وتأكدت من فشله الفوري (Exit code 1) عند وجود أي سكريبت اختبار غير مسجل، وفحصت النظافة الأمنية للريبو.
- أنشأت مجلد وملف الأدلة غير القابل للتعديل في `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-00-EVIDENCE.md` مع توثيق التجزئات وحالة المعايير (6/6 PASS) دون أي تعديل على كود المنتج.

### الملفات المتأثرة
- `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-00-EVIDENCE.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm run test:manifest` ✅ (74 canonical suites, 28 E2E, 0 orphans)
- `node scripts/route-manifest.mjs --check` ✅ (115 file routes, 25 middleware routes, 6 guards)
- `pnpm run test:embedded-migration-parity` ✅ (39/39 sha256 byte-identical)
- `pnpm run test:schema-reference` ✅ (165 catalog objects)
- `node scripts/verify-security-hygiene.mjs` ✅ (Security hygiene passed)
- الاختبار السلبي لحارس المانيفست ✅ (Rejected unlisted script with exit code 1)
- فحص بقاء عيوب P0 المعلقة ✅ (P0-1, P0-2, P0-3 مؤكدة ومستعدة للعلاج في PROMPT-01)

### النتيجة
- **الحالة:** نجح بالكامل (PASS - 6/6 المعايير مستوفاة)
- **مختصر:** اكتمل تجميد خط الأساس وتوثيق البيئة بنجاح، وجميع بوابات المرحلة 0 اجتازت التحقق تمهيداً لفك حجب PROMPT-01.

### ملاحظات / مشاكل مفتوحة
- خط الأساس جاهز رسمياً؛ البداية المباشرة في تنفيذ `PROMPT-01` لإصلاح عيوب P0 الثلاثة.

## [2026-09-02] — QC-ULTIMATE-REMEDIATION-PROMPT-GENERATOR: توليد برنامج العلاج الشامل وبرومبتات التنفيذ للوصول إلى 100%

### تم التنفيذ
- حوّلت نتائج التدقيق الشامل للـ 100 مجال إلى برنامج علاجي تنفيذي متكامل ومحكم في `audit/qc/QC-Task-Manager/Remediation/`.
- أنشأت خطة العلاج الرئيسية `00-REMEDIATION-MASTER-PLAN.md` متضمنة ملخص التدقيق، تصنيف العيوب، تحليل الاعتماديات، ومعايير الاكتمال.
- طوّرت مصفوفة التغطية الشاملة `01-REMEDIATION-COVERAGE-MATRIX.md` محققاً 0 عيوب غير مخصصة (UNASSIGNED ACTIONABLE FINDINGS = 0) وتغطية 100% لعيوب P0 و P1 و P2 و P3 وكافة المجالات الـ 98 التي تقل عن 100%.
- وضعت جدول الترتيب الصارم `REMEDIATION-EXECUTION-ORDER.md` عبر 6 مراحل متتابعة مع 4 بوابات تكامل ملزمة (Gates A, B, C, D).
- ولّدت 14 برومبتاً تنفيذياً برمجياً محلياً (`PROMPT-00` إلى `PROMPT-13`) تغطي كافة العيوب المحلية بدقة (P0-1, P0-2, P0-3, P1-4, P1-5, P1-6, P1-7, P2-1, P2-2, P2-3, P2-5, P2-6, P3-1, P3-2, P3-3).
- ولّدت 5 بروتوكولات تحقق بشري (`PROMPT-H1` إلى `PROMPT-H5`) تغطي UAT، VoiceOver/NVDA، بيئة المختبر، واختبار الاختراق والاعتماد القانوني.
- ولّدت 4 بروتوكولات تشغيل وإنتاج (`PROMPT-E1` إلى `PROMPT-E4`) تغطي Staging، استعادة الكوارث RTO/RPO، قياس RUM، والتراجع الطارئ.
- ولّدت برومبت التدقيق النهائي المستقل `PROMPT-FINAL-INDEPENDENT-100-REAUDIT.md` لإعادة تقييم كافة الـ 100 مجال من الصفر دون افتراضات مسبقة.
- لم يُجرَ أي تعديل على كود المنتج (مهمة معمارية وتخطيطية فقط)، ولم يتم تنفيذ أي commit أو push.

### الملفات المتأثرة
- `audit/qc/QC-Task-Manager/Remediation/00-REMEDIATION-MASTER-PLAN.md`
- `audit/qc/QC-Task-Manager/Remediation/01-REMEDIATION-COVERAGE-MATRIX.md`
- `audit/qc/QC-Task-Manager/Remediation/REMEDIATION-EXECUTION-ORDER.md`
- `audit/qc/QC-Task-Manager/Remediation/PROMPT-00-REMEDIATION-BASELINE-FREEZE.md` إلى `PROMPT-13-TECH-DEBT-HYGIENE-DOCS.md` (14 ملفاً)
- `audit/qc/QC-Task-Manager/Remediation/PROMPT-H1-QC-STAFF-UAT.md` إلى `PROMPT-H5-QC-LEGAL-REGULATORY-SIGNOFF.md` (5 ملفات)
- `audit/qc/QC-Task-Manager/Remediation/PROMPT-E1-STAGING-DEPLOYMENT-SMOKE-TEST.md` إلى `PROMPT-E4-INCIDENT-RESPONSE-ROLLBACK-DRILL.md` (4 ملفات)
- `audit/qc/QC-Task-Manager/Remediation/PROMPT-FINAL-INDEPENDENT-100-REAUDIT.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- فحص سلامة الملفات المولدة: 27 ملفاً في `audit/qc/QC-Task-Manager/Remediation/` بنجاح ✅
- التحقق من تصفير العيوب غير المخصصة: UNASSIGNED = 0 ✅
- التحقق من تغطية عيوب P0 (3/3)، P1 (7/7)، P2 (6/6)، P3 (3/3) بنسبة 100% ✅
- التحقق من تغطية الـ 98 مجال الأقل من 100% بنسبة 100% ✅

### النتيجة
- **الحالة:** نجح بالكامل (توليد حزمة برنامج العلاج الشامل بنجاح)
- **مختصر:** اكتملت حزمة المعالجة بـ 24 برومبتاً تنفيذياً وتشغيلياً و3 وثائق إدارية تمكّن أي وكيل قادم من معالجة كل عيوب النظام خطوة بخطوة حتى الوصول إلى 100% المثبتة.

### ملاحظات / مشاكل مفتوحة
- البدء بتنفيذ `PROMPT-00` ثم `PROMPT-01` فوراً لفك حجب بوابات الإطلاق P0.

## [2026-09-02] — QC-ULTIMATE-100-DOMAIN-SYSTEM-AUDIT: تدقيق الـ 100 مجال الشامل المستقل لتطبيق QC Task Manager

### تم التنفيذ
- جمّدت الواقع الفعلي للنظام عند HEAD `d9a45b07`؛ وثّقت حالة الشجرة والمستودع وإحصائيات المسارات (115 مسار ملف، 39 مسار API)، و39 migration متطابقة sha256، و165 كائن قاعدة بيانات، و0 أخطاء في astro check.
- أنجزت تدقيق الـ 100 مجال الإلزامي بالكامل بموجب 400 معيار ثنائي صارم (294 MET، 10 PARTIAL، 84 OPEN، 12 BLOCKED، 0 N/A).
- حُسبت النسب النهائية بدقة: الدرجة الصارمة الإجمالية 73.50%، درجة النضج الإجمالية 74.75%، الموزونة للمجالات الحرجة 72.57%، الجاهزية التقنية المحلية 97.33%، الجاهزية البشرية والخارجية 2.00%، والجاهزية التشغيلية للإنتاج 20.37%.
- أعدت إنتاج وتأكيد الـ 3 P0 الحقيقية في HEAD: (1) فشل `test:observability` بسبب عدم تطابق رسالة الخطأ الآمنة الجديدة مع نص الاختبار القديم، (2) فشل `test:a11y-ergonomics-100` لطلب ملف الأدلة بجانب البوابة بعد حذفه في دمج الأدلة السابق، (3) فشل `e2e:delete-request` وتوقفه بسبب تغير نص زر تأكيد الحذف مما حجب 23 سويت E2E تالية.
- ولّدت كافة مخرجات التدقيق الخمسة في `audit/qc/QC-Task-Manager/ULTIMATE-AUDIT-2026-09-02/` (التقرير النهائي الشامل بـ 36 قسماً، تجميد الواقع، جرد المسارات، مصفوفة الادعاءات، وحقيقة الاختبارات) والارتفاكت المقترن.
- لم يُجرَ أي تعديل على كود المنتج، ولم يتم تنفيذ أي commit أو push عملاً بالقواعد الصارمة.

### الملفات المتأثرة
- `audit/qc/QC-Task-Manager/ULTIMATE-AUDIT-2026-09-02/QC-TASK-MANAGER-ULTIMATE-100-PERCENT-AUDIT.md`
- `audit/qc/QC-Task-Manager/ULTIMATE-AUDIT-2026-09-02/CURRENT-REALITY-FREEZE.md`
- `audit/qc/QC-Task-Manager/ULTIMATE-AUDIT-2026-09-02/FILE-COVERAGE.md`
- `audit/qc/QC-Task-Manager/ULTIMATE-AUDIT-2026-09-02/CLAIMS-VS-REALITY.md`
- `audit/qc/QC-Task-Manager/ULTIMATE-AUDIT-2026-09-02/TEST-COVERAGE-TRUTH.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm run test:manifest` ✅ (74 canonical suites, 28 E2E)
- `node scripts/route-manifest.mjs --check` ✅ (115 routes)
- `test:embedded-migration-parity` ✅ (39/39 sha256)
- `test:schema-reference` ✅ (165 objects)
- `ASTRO_TELEMETRY_DISABLED=1 pnpm astro check` ✅ (0 errors, 0 warnings, 0 hints على 307 ملفات)
- `ASTRO_TELEMETRY_DISABLED=1 pnpm build` ✅ (5.14s)
- تشغيل السويتات الكنسية: 72/74 نجحت، 2 فاشلة (P0-1, P0-2)
- تشغيل E2E: توقف عند السويت 5/28 (P0-3)

### النتيجة
- **الحالة:** نجح (إنجاز تقرير التدقيق المستقل الكامل) — الحكم النهائي: **NO-GO**
- **مختصر:** النظام يتمتع بجاهزية تقنية محلية عالية (97.33%) لكنه ممنوع من الإطلاق حالياً لوجود 3 P0 تعطل البوابات الكنسية ولغياب الأدلة البشرية والإنتاجية (UAT، Screen Reader، Production Restore).

### ملاحظات / مشاكل مفتوحة
- إصلاح الـ P0s الثلاثة فوراً كشرط مسبق لفتح البوابات الكنسية.
- إطلاق مرحلة الاختبار البشري (UAT) واختبارات قارئ الشاشة الحقيقية VoiceOver/NVDA.



### تم التنفيذ
- جمّدت الواقع الحالي عند HEAD `cc9185d4` (شجرة نظيفة): 74 جناح canonical + 28 E2E، 115 مسار ملف (القديم 116 متقادم)، 39 migration parity sha256، 165 كائن schema، typecheck 0/0/0.
- شغّلت كل بوابات التحقق: اكتشفت **3 P0 حقيقية في HEAD**: (1) `test:observability` فاشل — توقع اختبار متقادم مقابل نسخة خطأ محسّنة في المنتج، (2) `test:a11y-ergonomics-100` فاشل — ملف evidence المطلوب بجانب البوابة انتقل في `ba29fb7e` ثم أزيل بالدمج، (3) `e2e:delete-request` فاشل — زر تأكيد الحذف التدميري لا يظهر (Timeout) ويوقف الـrunner فتبقى 23 جناح E2E محجوبة.
- بنيت denominator جديد من 303 مجال (300 قابل بعد N/A مبرر): النتيجة **169/300 = 56.33%** — NO-GO للإطلاق.
- أنشأت المخرجات العشرة كاملة في `audit/qc/QC-Task-Manager/ULTIMATE-AUDIT-2026-09-02/`: Freeze, Skills Matrix, File Coverage, Claims-vs-Reality, Test Truth, Evidence Matrix, Gap Matrix, Human/External Gaps, Audit النهائي، و14 برومبت تنفيذ (EP-01…EP-10 + 15 برومبت بشري + EP-FINAL).
- لم يُعدَّل أي كود منتج (مهمة تدقيق فقط).

### الملفات المتأثرة
- `audit/qc/QC-Task-Manager/ULTIMATE-AUDIT-2026-09-02/` (10 ملفات جديدة)

### التحقق
- بوابات سريعة 7/7 ✅ · 72/74 جناح unit ✅ (2 P0 فاشلة) · E2E: 4 نجحت، 1 فاشل، 23 محجوبة ✅ موثقة
- `git status` ✅ — لا تغييرات على كود المنتج

### النتيجة
- **الحالة:** نجح (التدقيق) — الحكم: **NO-GO** بسبب الـ3 P0.
- **مختصر:** النظام تقنيًا صلب لكن HEAD الحالي يكسر بوابته الخاصة؛ الإطلاق يتطلب إغلاق P0s ثم أدلة بشرية/إنتاجية.

### ملاحظات / مشاكل مفتوحة
- قرار دمج الأدلة السابق تفاعل مع عقد بوابة a11y (الملف مطلوب بجانبها) — الإصلاح في EP-02.
- credential محلي ما زال بحاجة تدوير (EP-H14).


## [2026-09-02] — حذف ملفات الأدلة الأصلية بعد الدمج

### تم التنفيذ
- حذفت الملفات الأصلية الـ17 من `audit/qc/QC-Task-Manager/Evidences/` بتأكيد صريح من المستخدم، وبقي الملف المدمج `QC-TASK-MANAGER-ALL-EVIDENCES-COMBINED.md` (232KB) فقط في المجلد.

### الملفات المتأثرة
- `audit/qc/QC-Task-Manager/Evidences/` — 17 ملف md محذوف؛ المجلد يحتوي الملف المدمج فقط.

### التحقق
- `ls` بعد الحذف ✅ — ملف واحد فقط متبقٍ بالمجلد.

### النتيجة
- **الحالة:** نجح.
- **مختصر:** المحتوى الكامل محفوظ داخل الملف المدمج، والمجلد نظيف بملف واحد.

### ملاحظات / مشاكل مفتوحة
- لا يوجد. لا commit ولا push.


## [2026-09-02] — دمج ملفات أدلة QC-Task-Manager في ملف واحد

### تم التنفيذ
- دمجت 17 ملف أدلة من `audit/qc/QC-Task-Manager/Evidences/` في ملف واحد `QC-TASK-MANAGER-ALL-EVIDENCES-COMBINED.md` (2614 سطر / 232KB).
- الترتيب المنطقي: Baseline → المصفوفات (Evidence/Gap) → أدلة المجالات (Architecture, Database, Security, Verification, Design System, UI, UX/IA, Motion, Pilot Research, UX Writing, A11Y, Data Viz, Forms) → تقرير ما قبل الإطلاق.
- أضفت فهرس بروابط داخلية + تعليقات `SOURCE FILE` تحدد مصدر كل قسم.
- لم يُعدَّل محتوى الملفات الأصلية — بقت كما هي في المجلد.

### الملفات المتأثرة
- `audit/qc/QC-Task-Manager/Evidences/QC-TASK-MANAGER-ALL-EVIDENCES-COMBINED.md` (جديد)

### التحقق
- فحص يدوي ✅ — 17 قسم `SOURCE FILE` + فهرس سليم + نهاية الملف تُطابق نهاية `PRE-LAUNCH-REPORT.md`.
- لا build/lint مطلوب — ملف توثيقي فقط.

### النتيجة
- **الحالة:** نجح.
- **مختصر:** ملف مدمج واحد جاهز للمراجعة، والمصادر الأصلية محفوظة.

### ملاحظات / مشاكل مفتوحة
- لا يوجد. لا commit ولا push.


## [2026-09-02] — QC-100-FORMS-013: تدقيق شامل وتحسين مواصفات كل نماذج QC

### تم التنفيذ
- جردت كل أسطح النماذج في تطبيق `apps/qc-task-manager` من المصدر؛ وُجدت **51 ملفًا** يحتوي على `<form`، وشملت المهام، Findings/RCA/CAPA، المختبر، master data، الوثائق، الاعتمادات، retest، change requests، المستخدمين، الإعدادات، الفلاتر والبحث.
- أنشأت `12-ADVANCED-FORMS-100-EVIDENCE.md` كمصفوفة أدلة مستقلة تفصل الوضع المثبت آليًا عن UAT اليدوي غير المنفذ.
- وثقت findings مع RCA/CAPA مرتبة P0–P2، أبرزها: عدم شمول عقد `data-qc-form` لكل mutations، عدم ضمان `aria-describedby` لأخطاء الحقول، وتكرار شكل قاعدة البيانات داخل نموذج change request.
- صممت بنية intent-first باستخدام sections وprogressive disclosure وconditional fields وlookup/search وdate/numeric helpers، مع متطلبات pending/duplicate protection/success/recovery/unsaved protection.
- أضفت خطة LAB-F-01 إلى LAB-F-12 لتغطية validation، server rejection، duplicate submit، failure recovery، keyboard، mobile، zoom، screen reader، conditional fields، والإجراءات المدمرة.

### الملفات المتأثرة
- `apps/qc-task-manager/12-ADVANCED-FORMS-100-EVIDENCE.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm run test:form-productivity` ✅ — 20/20.
- `pnpm run typecheck` ✅ — 0 errors / 0 warnings / 0 hints.
- `pnpm run build` ✅ — Complete.
- جرد المصدر ✅ — 51 ملف form.
- `git -c core.fsmonitor=false diff --check` ✅.

### النتيجة
- **الحالة:** جزئي / CONDITIONAL GO للتوثيق.
- **مختصر:** اكتمل التدقيق وخطة CAPA، لكن لا يجوز ادعاء 100% form UX أو zero data-loss قبل تطبيق العقد الموحد وتشغيل مصفوفة الاختبارات اليدوية والآلية على كل النماذج.

### ملاحظات / مشاكل مفتوحة
- VoiceOver/NVDA، UAT حسب الدور، اختبار 360/1440/200% لكل نموذج، وstaging/production evidence غير متوفرة.
- لم يتغير سلوك المنتج في هذه المهمة التوثيقية.
- لا commit ولا push ولا deploy.

## [2026-09-02] — QC-100-DATA-VIZ-012: تدقيق لوحات البيانات والـKPI والرسوم والتقارير

### تم التنفيذ
- جردت كل أسطح التحليل في `apps/qc-task-manager`: `/dashboard`، `/lab`، لوحات الأدوار Employee/Supervisor/Manager، `/manager/workload`، `/reports`، `/lab/reports`، KPI drilldown، ومصادر الرسوم والجداول.
- أنشأت `11-DASHBOARD-DATA-VIZ-100-EVIDENCE.md` بمصفوفة KPI تجيب سؤال المقياس، المستخدم، الإجراء، المقارنة، الفترة، ومعنى الجيد/السيئ.
- وثقت 20 KPI رئيسية للمهام ومجموعات KPI المختبر، وجردت 14 visualization، 8 تقارير مهام، 16 تقرير مختبر، ومسارات drilldown والجداول التشغيلية.
- حدّدت تكرارًا فعليًا بين `Average Completion Time` و`Average Resolution`، وتضخمًا في صف KPI، ومقاييس حجم/نشاط ينبغي demote لها بدل اعتبارها قرارات.
- حددت فجوات القرار: غياب denominator/target/as-of لبعض المقاييس، اختلاف عقد الفترة بين dashboard والمختبر، غياب جدول بديل كامل لبعض الرسوم، وقص drilldown عند 500 بلا pagination.
- فصلت الأدلة الآلية عن الاعتماد البشري: أسماء SVG و`title` وملخصات نصية وجداول موجودة جزئيًا، لكن VoiceOver/NVDA والـUAT الإنتاجي غير مثبتين.

### الملفات المتأثرة
- `apps/qc-task-manager/11-DASHBOARD-DATA-VIZ-100-EVIDENCE.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm run test:dashboard-reports` ✅
- `pnpm run test:report-preview` ✅ — ظهرت رسائل WI catalog collisions وbackup catch-up متوقعة من fixture، والسويت نجحت.
- `pnpm run test:lab-reports` ✅ — 196 passed / 0 failed.
- `pnpm run test:lab-trends` ✅ — 45 passed / 0 failed.
- `pnpm run test:a11y-ergonomics-100` ✅ — 76 صفحة و59 مكونًا؛ العقد الآلي 100%، وAT اليدوي ما زال منفصلًا.
- `pnpm run test:manifest` ✅ — 74 suite كنسية و28 E2E.
- `pnpm run typecheck` ✅ — 0 errors / 0 warnings / 0 hints.
- `pnpm run build` ✅ — Complete.
- `git diff --check` ✅.

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** اكتمل التدقيق التوثيقي الشامل وخرجت قائمة remediation مرتبة P0–P2؛ التطبيق لا يحقق بعد شرط المستخدم النهائي صفر misleading/مقاييس بلا معنى/رسوم بلا بديل وصول كامل، لذلك لم أدّعِ 100% ولم أغيّر منطق المنتج.

### ملاحظات / مشاكل مفتوحة
- P0/P1 الموثقة في الدليل: تقليل KPI tier، إزالة التكرار، إظهار الفترة/المقام/الهدف، جدول HTML لكل رسم، توضيح استقلال مختبر dashboard عن فلاتر المهام أو توحيد العقد.
- VoiceOver/NVDA وUAT البشري والإثبات على بيانات staging/production غير منفذة.
- لا commit ولا push ولا deploy.

## [2026-09-02] — QC-100-CONTENT-UX-010: تدقيق وتحسين النصوص الظاهرة وخطة البحث التجريبي

### تم التنفيذ
- راجعت عقد UX Writing والجرد البرمجي للنصوص الظاهرة في `apps/qc-task-manager/src/pages` و`src/components`، ووسّعت التغطية لتشمل العناوين والأوصاف والأفعال والحقول والحالات الفارغة والأخطاء والصلاحيات والإجراءات الحساسة.
- حسّنت لغة إنشاء المهام، الحقول الاختيارية، التكرار، الإسناد، حالات السجلات، إغلاق المهمة، وإعادة فتحها؛ صارت الأفعال تسمّي النتيجة والكائن بدل العبارات العامة.
- حسّنت حوار الحذف الدائم وطلب الحذف، مع تسمية صريحة للعاقبة ورسائل أوضح لرفض الطلب، بدون تغيير workflow أو RBAC أو API.
- حدّثت رسائل فشل الإكمال/الإلغاء/إعادة الفتح ورسالة الخطأ العامة لتوضح ما حدث، وهل حُفظت البيانات، وأن إعادة المحاولة آمنة عندما تكون الحالة معروفة؛ وإذا كانت غير معروفة تطلب مراجعة السجل قبل المحاولة.
- أنشأت خطة بحث دورية صريحة في `9-PILOT-UX-RESEARCH.md` تغطي المشاركين، السيناريوهات، ورقة الملاحظة، معايير النجاح، الوقت، المساعدة، الأخطاء، الالتباس، SUS-style والأسئلة النوعية؛ لا توجد نتائج بشرية مختلقة.
- أنشأت `UX-WRITING-RESEARCH-EVIDENCE.md` لتفصل دليل المصدر والفحوص الآلية عن UAT البشري، وأضفت حارس `test-content-quality-100` بعقد 9/9 وجرد 137 ملف واجهة، وربطته بالـmanifest.

### الملفات المتأثرة
- `apps/qc-task-manager/9-PILOT-UX-RESEARCH.md`
- `apps/qc-task-manager/UX-WRITING-RESEARCH-EVIDENCE.md`
- `apps/qc-task-manager/docs/UX-WRITING.md`
- `apps/qc-task-manager/scripts/test-content-quality-100.mjs`
- `apps/qc-task-manager/scripts/test-ux-writing.mjs`
- `apps/qc-task-manager/scripts/test-manifest.mjs`
- `apps/qc-task-manager/src/components/{OperationalState,NewTaskForm,TaskLifecycle,DeleteRequestDialog,ReviewDeleteRequestDialog}`
- `apps/qc-task-manager/src/pages/{findings,search,lab}` (copy-only updates)
- `apps/qc-task-manager/src/lib/observability.ts`

### التحقق
- `pnpm run test:content-quality-100` ✅ — 9/9 rules، 306 ملف مصدر مفحوص.
- `pnpm run test:ux-writing` ✅ — 14/14.
- `pnpm run test:manifest` ✅ — 73 suite كنسية و28 E2E، بدون orphan.
- `pnpm run typecheck` ✅ — 0 errors / 0 warnings / 0 hints.
- `pnpm run build` ✅ — Complete.
- `git diff --check` ⚠️ — trailing whitespace موجود مسبقًا في `audit/qc/QC-Task-Manager/prompt10.md`، خارج نطاق المهمة ولم ألمسه.

### النتيجة
- **الحالة:** نجح محليًا آليًا.
- **مختصر:** تحسنت النصوص عالية المخاطر، وصار عند المشروع حارس آلي معلن التغطية وخطة بحث قابلة للتنفيذ؛ جودة الفهم البشرية وSUS وtime-on-task ما زالت غير مقاسة حتى ينفذ المشاركون الجلسات.

### ملاحظات / مشاكل مفتوحة
- `git status` ما زال يعرض حذفَي أدلة وتغييرات أخرى سابقة للمهمة؛ تم الحفاظ عليها بدون لمس.
- لا commit ولا push ولا deploy.

## [2026-09-02] — QC-100-INTERACTION-MOTION-009: تغطية حالات التفاعل ونظام الحركة

### تم التنفيذ
- وحّدت توكنز الحركة الكنسية إلى `duration-instant/fast/standard/moderate` و`ease-standard/decelerate/accelerate/linear` بقيم 0/120/180/240ms، مع إبقاء aliases القديمة للتوافق.
- ربطت توكنز الحركة بـTailwind (`duration-qc-*` و`ease-qc-*`) وأضفت وصفتي `qc-motion-feedback` و`qc-motion-enter`؛ أضفت Toast entry motion بدون تغيير workflow.
- قوّيت `prefers-reduced-motion` على مستوى النظام: اختصار المدد إلى 1ms، تعطيل smooth scrolling، ومنع تكرار الحركة؛ ومررت التركيز في نموذج المختبر عبر scroll فوري عند تفعيل تقليل الحركة.
- أضفت دعم Escape لحوار مراجعة اختبار المختبر، وبدّلت انتقالات الرسوم المباشرة `duration-150` إلى توكن الحركة الكنسي.
- أنشأت `8-INTERACTION-MOTION-100-EVIDENCE.md` بمصفوفة حالات default/hover/focus/active/selected/loading/success/error/disabled/destructive/pending وحدود الأدلة البشرية المطلوبة.
- أضفت حارس `test-interaction-motion-100.mjs` وفحصت 10 مالكي feedback و5 مالكي dialogs، ومنعت `transition-all` وhover translate/scale والحركة غير المسمّاة.

### الملفات المتأثرة
- `apps/qc-task-manager/src/styles/global.css`
- `apps/qc-task-manager/tailwind.config.mjs`
- `apps/qc-task-manager/src/components/{ui/Toast,DashboardCharts,LabDashboardCharts}.tsx` / `.astro`
- `apps/qc-task-manager/src/components/lab/LabTestForm.tsx`
- `apps/qc-task-manager/scripts/test-interaction-motion-100.mjs`
- `apps/qc-task-manager/{package.json,scripts/test-manifest.mjs,docs/UI-DESIGN-SYSTEM.md,8-INTERACTION-MOTION-100-EVIDENCE.md}`

### التحقق
- `pnpm run test:interaction-motion-100` ✅ — 75/75.
- `pnpm run test:interaction-feedback` ✅ — 25/25؛ `test:ui-consistency` ✅ — 212/212.
- `pnpm run test:lab-form` ✅ — 72/72؛ `test:form-productivity` ✅ — 20/20.
- `pnpm run test:manifest` ✅ — 72 canonical suites و28 E2E.
- `pnpm run typecheck` ✅ — 0 أخطاء؛ `pnpm run build` ✅ — Complete.
- `git diff --check` ✅؛ لم تُشغّل full test وE2E acceptance لهذه الدفعة.

### النتيجة
- **الحالة:** نجح محليًا آليًا.
- **مختصر:** صار عند QC عقد حركة موحّد وحارس قابل لإعادة التنفيذ يغطي feedback والحالات عالية الأثر مع reduced-motion؛ التحقق اليدوي عبر الأجهزة وقارئات الشاشة ما زال مطلوبًا.

### ملاحظات / مشاكل مفتوحة
- لا commit ولا push ولا deploy.
- فحص `test:form-productivity` طبع رسائل backup مؤقتة متوقعة أثناء الـfixture، لكن السويت نفسها نجحت 20/20.
- UAT البشري وVoiceOver/NVDA واختبار جهاز منخفض الطاقة لم تُنفذ، فلا تُحسب ضمن إثبات 100% الخارجي.

## [2026-09-02] — QC-100-UX-IA-008: تدقيق IA وتصميم الخدمة حسب الأدوار

### تم التنفيذ
- أنشأت دليلًا مستقلًا لتدقيق المنتج كاملًا من منظور Employee وSupervisor وManager وAdmin، مبنيًا على jobs-to-be-done بدل بنية الكود.
- وثقت الوضع الحالي للـglobal navigation وLaboratory secondary navigation والـbreadcrumbs والعناوين وdashboard/search/reports/notifications/settings/admin، مع أدلة مسارات ومراجع file:line.
- عرّفت IA مستهدفًا موحدًا يفرّق بين My Work وTeam Review وCommand Center وAdministration، ويقترح إعادة تسمية/تجميع تقلل ازدواجية Search وReports وNotifications بدون تغيير URLs أو RBAC.
- رسمت 7 رحلات end-to-end: tasks، findings/RCA/CAPA، lab tests، equipment/calibration/maintenance، SOP/WI، change requests، notifications؛ وحددت الملكية، نقاط التسليم، الاسترجاع، والفجوات الحالية.
- أضفت cross-workflow service blueprint، route/navigation traceability contract، قاعدة قابلة للاختبار لـzero orphan/dead-end، وخطة remediation مرتبة P0–P2.

### الملفات المتأثرة
- `apps/qc-task-manager/7-UX-IA-SERVICE-DESIGN-100-EVIDENCE.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- قراءة `.agents/mind/01-mind-latest.md` كاملة على دفعات ✅
- قراءة مهارات `information-architecture` و`service-blueprint` و`journey-map` و`heuristic-evaluation` ✅
- جرد routes/navigation/source/docs ✅ — لا تغييرات على كود المنتج أو URLs أو الصلاحيات
- `git diff --check` ✅
- build/tests: لم تُشغّل — المهمة توثيقية فقط

### النتيجة
- **الحالة:** جزئي
- **مختصر:** الدليل مكتمل ويثبت أساس IA الحالي والفجوات القابلة للتنفيذ، لكنه لا يدّعي أن zero orphan/dead-end أو UX success تحققت قبل route registry واختبارات tree/UAT البشرية.

### ملاحظات / مشاكل مفتوحة
- ازدواجية Search/Reports/Notifications، ومسار Apply في change requests، وتغطية traceability الكاملة بقيت كـP0/P1 remediation موثقة.
- لا commit ولا push ولا deploy.

## [2026-09-02] — توحيد قوائم الـ Checklist في prompt10.md

### تم التنفيذ
- استبدلت قوائم الـ Checklist التفصيلية لكل برومبت داخل `audit/qc/QC-Task-Manager/prompt10.md` ببند واحد فقط.
- الصيغة النهائية بالإنجليزي: `- [✅] Executed` للبرومبتات المنفذة (00–03) و`- [ ] Not executed` للباقي (04–15)، مطابقة لحالة القائمة الرئيسية (Master Execution Checklist).
- المجموع: 16 قائمة Checklist معالجة — 6 ✅ و10 غير منفذة.
- لم يُعدَّل أي محتوى داخل بلوكات أوامر البرومبتات نفسها.

### الملفات المتأثرة
- `audit/qc/QC-Task-Manager/prompt10.md`

### التحقق
- `grep -n -A1 '^## Checklist'` ✅ — 16/16 بالصيغة الجديدة.
- لا build/اختبارات: التغيير توثيقي فقط.

### النتيجة
- **الحالة:** نجح.
- **مختصر:** قوائم الـ Checklist للبرومبتات صارت بندًا واحدًا (Executed / Not executed) بعلامة صح للمنجز.

### ملاحظات / مشاكل مفتوحة
- لا يوجد.


## [2026-09-02] — QC-100-SECURITY-004: تثبيت عقود Security / RBAC / Privacy القابلة للأتمتة

### تم التنفيذ
- أزلت تعريفات صلاحيات مكررة، وثبّتُّ `src/lib/permissions.ts` كمصدر الصلاحيات الكنسي، وربطت بوابة ملخص AI وإذن التقارير بالمفاتيح الكنسية بدل قوائم أدوار محلية.
- أصلحت IDOR حقيقيًا: ربط evidence الخاص بـCAPA بالـFinding الأب في طبقة العملية والـAPI؛ CAPA/Finding غير المتطابق يرجع not-found آمن ولا ينشئ صفًا.
- حوّلت الموارد غير المرئية للموظف (Task/Finding، PDF، attachments، comments، وسياق AI) إلى 404 عام حتى ما تتسرّب حقيقة وجود السجل، مع بقاء 403 للمنع القائم على الدور عندما السجل مرئي أصلًا.
- أضفت `test-security-rbac-privacy-100.mjs` لمصفوفة الصلاحيات والأدوار وفصل الواجبات، وربطته بالـmanifest؛ وعدّلت E2E لتثبت عقد non-discovery.
- وحّدت مسار النسخ الاحتياطي المجدول مع `configuredBackupDirectory` بعد ما كشف اختبار عقد التشغيل drift فعليًا.
- أنشأت `apps/qc-task-manager/SECURITY-RBAC-PRIVACY-100-EVIDENCE.md` بالأدلة وحدود الادعاء والحواجز الخارجية.

### الملفات المتأثرة
- `apps/qc-task-manager/src/lib/{permissions,aiQcContext,qc-operations,backup-scheduler}.ts`
- `apps/qc-task-manager/src/lib/reporting/authorization.ts`
- `apps/qc-task-manager/src/pages/{tasks/[id],findings/[id]}.astro` وendpoints الـFinding/Task/PDF المتأثرة
- `apps/qc-task-manager/scripts/{test-security-rbac-privacy-100,test-lab-security,test-manifest,e2e-findings,e2e-task-search,e2e-reports}.mjs`
- `apps/qc-task-manager/{package.json,SECURITY-RBAC-PRIVACY-100-EVIDENCE.md}`

### التحقق
- كل حواجز `test:*` المحلية ✅ — **69/69 PASS**.
- `test-security-rbac-privacy-100` ✅؛ `test-lab-security` ✅ **66/66**؛ `test-request-security` ✅ **56/56**؛ deployment contract ✅ **22/22**.
- `astro check` ✅ 0 errors / 0 warnings / 0 hints؛ production build ✅ — قبل تعديلات E2E النهائية فقط.
- acceptance browser: تحققت 404 لملفات PDF وFindings الأجنبية؛ كشف التشغيل توقعين E2E قديمين لـ403 فصُحّحا إلى404. إعادة القبول النهائية وtypecheck/build بعد آخر تعديلين **لم تُشغّل بطلب المستخدم بتجاوز الاختبارات**.

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** الحواجز المحلية المكتملة خضراء والإصلاحات الأمنية موثقة، لكن لا يوجد ادعاء full final acceptance للشجرة النهائية بعد طلب تجاوز الاختبارات.

### ملاحظات / مشاكل مفتوحة
- blocker صريح: إعداد Anthropic محلي سابق في `.claude/settings.local.json` بلا دليل revoke/rotation؛ يلزم تدوير فعلي وتسجيل دليل المزوّد، بدون نسخ السر في أي ملف.
- لا staging/production evidence ولا UAT بشري/VoiceOver/NVDA، ولا commit أو push أو deploy.

## [2026-09-02] — QC-100-DATABASE-003: رفع قاعدة البيانات والهجرات والتكامل والنسخ الاحتياطي والاستعادة إلى بوابة 100%

### تم التنفيذ
- أضفت بوابة معزولة موحدة `test-database-100.mjs` تجمع اختبارات fresh initialization، 001→latest، parity، schema، integrity، constraints، retention، backup/restore، restart، والفشل.
- رفعت عقد startup validation في `src/lib/db.ts` من تغطية جزئية إلى **106/106 index** الموجود في `db/schema.sql`؛ لم تُضف فهارس speculative جديدة.
- تحققت من **39/39** migration مضمّنة byte-identical مع SHA-256، ومن **165** schema object متطابق مع المرجع.
- تحققت من WAL وforeign keys وbusy timeout وsynchronous، rollback transactional، منع التكرار، منع الحالات غير الصالحة، وفشل الهجرة مع recovery.
- نفذت backup/verify/restore إلى مسارات temp نظيفة، مع integrity/FK/schema version 39 ومساواة سجل restore marker قبل/بعد.
- أنشأت `DATABASE-100-EVIDENCE.md` مع مصفوفة المتطلبات وحدود الادعاء؛ لا يوجد ادعاء live production restore.

### الملفات المتأثرة
- `apps/qc-task-manager/src/lib/db.ts`
- `apps/qc-task-manager/scripts/test-database-100.mjs`
- `apps/qc-task-manager/package.json`
- `apps/qc-task-manager/DATABASE-100-EVIDENCE.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `node --import ../../scripts/test-ts-loader.mjs --experimental-strip-types scripts/test-database-100.mjs` ✅ — `DATABASE-100: PASS (23 checks)`، وكل قواعد البيانات معزولة ومؤقتة.
- `node_modules/.bin/astro check` ✅ — 0 errors / 0 warnings / 0 hints.
- `node_modules/.bin/astro build` ✅ — Complete.
- `git diff --check` ✅.
- `pnpm test:database-100` لم يُشغّل بسبب منع Corepack من تنزيل pnpm عبر npm؛ نفس entrypoint نُفّذ مباشرة بـNode ونجح.

### النتيجة
- **الحالة:** نجح محليًا آليًا.
- **مختصر:** متطلبات DATABASE-100 المحلية والـisolated backup/restore مثبتة؛ التحقق الحي في staging/production وPROMPT 14 ما زال خارج النطاق ولم يُدّعَ.

### ملاحظات / مشاكل مفتوحة
- لا توجد فجوة محلية معروفة في نطاق المهمة. يلزم فقط دليل PROMPT 14 الحقيقي إذا أُريد اعتماد live restore.
- لا commit ولا push ولا deploy.

## [2026-09-02] — QC-100-ARCHITECTURE-002: رفع المعمارية وجودة الكود وسلامة الأنواع ومعالجة الأخطاء إلى إثبات مدعوم بالأدلة

### تم التنفيذ
- شغّلت ثلاثة وكلاء تدقيق متوازيين على `apps/qc-task-manager/` وأنتجت `audit/qc/QC-Task-Manager/REPORT3.md` بأدلة file:line لكل بند من قائمة التدقيق، مع أول توثيق كامل للـ27 hint.
- **حذفت الكود الميت بموافقة صريحة:** مسار `api/tasks/suggestions.ts` (صفر مراجع) + `scripts/smoke-task-detail.mjs` + `auth.ts:requireRole` + دالتي `lab/overview` المتقادمتين (كانتا تُنفّذان بلا مستهلك منذ `05a32acd`) + إلغاء تصدير 8 صادرات داخلية. صحّحت تقرير الوكيل: 5 صادرات كان يعتبرها ميتة تستخدمها سويتات الاختبار فعليًا.
- **وحّدت سلطة الصلاحيات:** `canApproveFinding` كانت معرّفة مرتين بجسمين مستقلين → تعريف واحد؛ ونقلت `canReviewFinding` و`canOpenLabRetestForm` و`canViewLabTestRecord` و`canRequestTaskDeletion` و`isLabTestRecordImmutable` من الصفحات إلى المالكين الكنسيين.
- **أنشأت 3 وحدات مشتركة:** `lib/scope.ts` (عبارة ملكية الموظف منسوخة في 13 موضعًا → واحد بستة أشكال)، `lib/pagination.ts` (25 إعلان ترقيم → واحد)، `lib/roleWorkspace.ts` (SQL صفحات الأدوار — المدير والمشرف كانا توأمًا).
- **أخرجت كل SQL من طبقة العرض:** 17 statement في 5 صفحات + 3 endpoints → صفر داخل `src/pages/**` (الاستثناء الموثق `readiness.ts`).
- **وحّدت عقد API بـTDD:** `test-api-contract.mjs` كُتب أولًا ففشل بـ38 مخالفة، ثم أضفت `apiJson()` بجانب `apiJsonError()` ورحّلت 35 endpoint — صفر helper محلي، صفر body نصي، صفر خطأ بلا `code`.
- **صححت خطأ ذاتيًا:** تحويل كل catch من 400 إلى 500 كسر 3 assertions في `e2e-findings` لأن مخالفات قواعد QC رفضٌ متوقع لا عطل. الحل: صنف `DomainRuleError` في `qc-operations.ts` (10 مواضع)، والـendpoints ترد 400 برسالة القاعدة و500 عامة للأعطال.
- **typecheck 0/0/0** (كانت 0/0/27) و**تحذيرا Vite → صفر**: كانا من 13 استيراد ديناميكي زائد؛ حُوِّلت إلى static وأُزيلت الأغلفة العدمية. أُغلقت PERF-001.
- **فكّكت `taskUpdates.ts`** (1,556 سطرًا) إلى ستة ملفات عند عناوين أقسامه الأصلية مع `index.ts` يفرض الواجهة العامة حرفيًا. الوحدات الضخمة الأربع الأخرى بقيت بقرار المالك وتُوثَّق ملكيتها.
- **قوّيت `architecture-guard.mjs` من 5 إلى 9 قواعد** — وقاعدة ORPHAN_ROUTE كشفت **خللًا حقيقيًا**: زرّا Export CSV/XLSX في سجل اختبارات المختبر كانا يشيران إلى `/lab/tests/export.*` وهو غير موجود (404 على كل تصدير)؛ أُصلح وأُضيف فحص regression.
- ثوابت مسماة (`BCRYPT_ROUNDS` 6→1، `RETENTION_WINDOW_MS`، `LAB_FAIL_RATE_ALERT_THRESHOLD`) و12 catch مبتلع صار يسجّل `console.error` بدون تغيير نص المستخدم.

### الملفات المتأثرة
- جديد: `src/lib/{scope,pagination,roleWorkspace}.ts` · `src/lib/taskUpdates/{index,shared,update,closure,lifecycle,attachments}.ts` · `scripts/test-api-contract.mjs` · `audit/qc/QC-Task-Manager/{REPORT3,ARCHITECTURE-100-EVIDENCE}.md`
- محذوف: `src/pages/api/tasks/suggestions.ts` · `scripts/smoke-task-detail.mjs` · `src/lib/taskUpdates.ts`
- موسّط: `scripts/architecture-guard.mjs` (9 قواعد) · `scripts/test-{manifest,ui-consistency,lab-ux-presentation}.mjs` · `src/lib/{permissions,api-security,observability,qc-operations,task-policy,lab/policy}.ts` · `package.json`
- معدّل: `docs/ARCHITECTURE.md` + 35 endpoint + 10 وحدات lab + الصفحات المتأثرة
- الإجمالي: **110 ملفًا، +804 / −2508**

### الأرقام
- typecheck: `0/0/27` → **`0/0/0`** · Vite warnings: `2` → **`0`** · guard rules: `5` → **`9`**
- canonical suites: `65` → **`67`** · file routes: `116` → **`115`** · ui-consistency: `207` → **`212`**
- scope-SQL: `13` → `1` · per-page decls: `25` → `2` · SQL في الصفحات: `17` → `0` · API error dialects: `4` → `1` · أخطاء بلا code: `53` → `0`

### التحقق
- `npx astro check` ✅ 0/0/0 · `NODE_ENV=production astro build` ✅ exit 0 وصفر تحذير
- `architecture-guard` ✅ (9) · `route-manifest --check` ✅ 115/25/6 · `test-manifest-guard` ✅ 67+28
- `test-api-contract` ✅ 159 فحصًا · `test-ui-consistency` ✅ 212/212 · `verify-security-hygiene` ✅ · `test-qc-operations` ✅
- `run-full-tests` — آخر تشغيل كامل 66/67؛ الفشل الوحيد (`test:lab-ux-presentation`: نص انتقل لمالكه الكنسي) أُصلح وشُغّل وحده ✅ 14/14؛ **لم تُعَد السلسلة كاملة بعد تعديل `DomainRuleError`**
- `e2e:acceptance` ⚠️ **غير مُتحقَّق على الشجرة النهائية** — تشغيل ما قبل التصحيح فشل بـ3 assertions في `e2e-findings` تطلب 400 (وهي ما يعالجه التصحيح)، ولم يُعَد التشغيل
- `git diff --check` ✅ · لا commit ولا push ولا deploy

### النتيجة
- **الحالة:** جزئي
- **مختصر:** كل الأهداف الصلبة القابلة للقياس ساكنًا تحققت (0/0/0، بناء نظيف بلا تحذيرات، حارس 9 قواعد، صفر ازدواجية صلاحيات، صفر كود ميت غير مبرر، عقد API واحد)، وأُصلح خلل 404 حقيقي في تصدير المختبر. البوابة المتبقية للاعتماد النهائي هي `e2e:acceptance` كاملة.

### ملاحظات / مشاكل مفتوحة
- **إلزامي قبل أي نشر:** `pnpm e2e:acceptance` في runner يسمح بـlocalhost للتحقق من تصحيح `DomainRuleError` (3 assertions) وبقية الـ28 suite.
- **مؤجّل موثق:** دورات الاستيراد `lab/changeRequests ↔ {equipment, products, calibration, retests}` تحتاج inversion عبر sink module.
- تعديلان على ملفي حراسة بسبب موثق (النص الكنسي + `DomainRuleError` كرفض مشروع بـ400)؛ لم يُعطَّل أو يُخفَّف أي assertion.
- الفجوات الخارجية من PROMPT 00 (G-01…G-05) بلا تغيير — المهمة داخلية معمارية.

## [2026-09-02] — إعداد نماذج Claude في `.claude/settings.local.json`

### تم التنفيذ
- أضفت المفتاح `"model": "claude-opus-5"` كالنموذج الافتراضي.
- أضفت `ANTHROPIC_MODEL_THINKING: "claude-opus-5-thinking"` داخل `env` كمرجع لنموذج التفكير.

### الملفات المتأثرة
- `.claude/settings.local.json`

### التحقق
- قراءة الملف بعد التعديل ✅ — JSON سليم.

### النتيجة
- **الحالة:** نجح
- **مختصر:** أُضيفا النموذجان كما طلب المستخدم؛ ملاحظة أن `ANTHROPIC_MODEL_THINKING` ليس متغيرًا معتمدًا رسميًا في Claude Code — التبديل الفعلي للـ thinking يُدار بالأوامر داخل الجلسة (`/model`) أو عبر خصائص reasoning للنموذج نفسه.

### ملاحظات / مشاكل مفتوحة
- ⚠️ الملف يحتوي `ANTHROPIC_API_KEY` في نص صريح و`ANTHROPIC_BASE_URL` لطرف ثالث (`api.justwoker.icu`) — تأكد المستخدم هو من وضعها؛ لا يُنشر ولا يُcommit للريبو العام.


## [2026-09-02] — QC-100-BASELINE-001: تجميد الحقيقة الحالية قبل المعالجة

### تم التنفيذ
- جمدت الحالة على HEAD `05ae8fbab78eacf7bc8363a3d75177f849a835de`، الفرع `main`، مع إبقاء تعديل المستخدم الوحيد في `audit/qc/QC-Task-Manager/prompt10.md` بدون لمس.
- أعدت جرد تطبيق QC من المصدر: 487 ملفًا متتبعًا، 116 route file، 36 API file، 39 migration، 365 skill، 65 canonical unit/integration suite، و28 canonical E2E suite.
- شغّلت التحقق الحالي: typecheck/build/full unit/manifest/routes/schema/migrations/parity/security/deployment/production-operations/UI/responsive؛ كلها نجحت، و`e2e:acceptance` نجح بصلاحية localhost بـ30/30 و3059+ assertion وrestart persistence.
- أنشأت scorecard من 173 معيارًا ثنائيًا: `125/173` مثبتة حاليًا؛ لم أساوِ بين وجود الكود وبين إثبات الإنتاج أو UAT أو AT اليدوي أو restore التشغيلي.
- وثقت الفجوات الحاجبة: لا live staging/production evidence، لا UAT موظفين حقيقيين، لا VoiceOver/NVDA/disabled-user evidence، ولا production/off-site restore أو RUM performance.

### الملفات المتأثرة
- `audit/qc/QC-Task-Manager/100-PERCENT-BASELINE.md`
- `audit/qc/QC-Task-Manager/100-PERCENT-GAP-MATRIX.md`
- `audit/qc/QC-Task-Manager/100-PERCENT-EVIDENCE-MATRIX.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm --dir apps/qc-task-manager test` ✅ — 65 canonical suites.
- `pnpm --dir apps/qc-task-manager e2e:acceptance` ✅ بصلاحية localhost — 30/30؛ `3059+` assertions؛ responsive `648/0`؛ a11y `86/0`.
- `typecheck/build/manifest/route/schema/migrations/parity/security/deployment/production-operations/UI` ✅.
- `git -c core.fsmonitor=false status --short --branch` ✅ — التعديل السابق بقي محفوظًا؛ لا commit ولا push ولا deploy.

### النتيجة
- **الحالة:** جزئي — baseline التقني المحلي قابل لإعادة التنفيذ، لكن 100% والتشغيل الفعلي غير مثبتين.
- **مختصر:** ملفات baseline وgap/evidence matrix تثبت الوضع الحالي بلا تنفيذ remediation، وتفصل الأدلة الآلية عن الأدلة البشرية والخارجية المطلوبة.

### ملاحظات / مشاكل مفتوحة
- فشل التشغيل الأول لـE2E داخل sandbox كان `listen EPERM` بيئيًا، ثم نجح نفس الاختبار بعد السماح بالـlocalhost؛ محاولة سكربت a11y غير موجودة سُجلت كخطأ أمر لا كفشل منتج.
- لا يجوز استخدام أي نسبة أو PASS تاريخي بدل مصفوفة الأدلة الحالية.

## [2026-09-01] — QC-PILOT-UAT-EXECUTION-BLOCKED-001: التحقق من جاهزية UAT البشري

### تم التنفيذ
- قرأت `apps/qc-task-manager/docs/PILOT-UAT.md` كاملًا وحددت أنه runbook لجلسات موظفين حقيقيين، وليس تقرير نتائج.
- راجعت تعليمات اختبار الوصول اليدوي؛ نتائج VoiceOver/NVDA والكيبورد لا تُستنتج من الاختبارات الآلية.
- تحققت من أدوات المتصفح؛ الصفحة الوحيدة المفتوحة `about:blank`، ولا توجد جلسة موظف أو بيئة staging موصولة.
- تحققت من وثائق التشغيل؛ حسابات `admin`/`manager`/`supervisor`/`employee` المتاحة محلية/demo وليست موظفين QC حقيقيين.
- لم أسجل نتائج success/time/assistance/errors/recovery/confusion/comments، ولم أنشئ وثيقة موقعة أو أدّعي UAT مكتملًا.

### الملفات المتأثرة
- `.agents/mind/01-mind-latest.md`

### التحقق
- قراءة `PILOT-UAT.md` وتعليمات الوصول ✅
- فحص جلسة المتصفح ✅ — لا توجد جلسة بشرية
- فحص وثائق الأدوار وحسابات التشغيل ✅
- automated tests ❌ لم تُستخدم كبديل عن UAT البشري

### النتيجة
- **الحالة:** جزئي — متوقف بانتظار مشاركين وبيئة تشغيل وتفويض توقيع.
- **مختصر:** لم تُنفذ جلسات UAT فعلية، لذلك لا توجد نتائج صالحة للرفع أو التوقيع.

### ملاحظات / مشاكل مفتوحة
- المطلوب خارجيًا: مشارك QC حقيقي واحد على الأقل لكل دور، رابط staging أو جلسة مشتركة، بيانات اختبار غير إنتاجية، وهوية صاحب التوقيع.
- لا يجوز اعتماد حسابات demo أو أي اختبار آلي كنتيجة UAT.

## [2026-09-01] — QC-STAGING-READINESS-EVIDENCE-001: تحقق provenance والهجرة والـUI والتصدير والتدقيق وتشغيل SQLite محليًا

### تم التنفيذ
- لم أنشئ WI pages 2/3 أو 3/3، ولم أغيّر سياسة أو semantics المعايرة؛ المصدر الحالي يثبت فقط 33 صفًا مضبوطًا للصفحة 1 ويرفض الصفحات غير الموردة.
- شغّلت provenance/conflicts والهجرة: `test:migrations` نجح، وembedded migration parity تحقق `39/39` byte-identical.
- شغّلت فحوص WI UI والتصدير والتدقيق والمعايرة؛ فحوص `lab-documents`, `lab-reports`, `lab-audit`, `lab-calibration`, و`audit-integrity` نجحت مع RBAC وsafe CSV وimmutability.
- نفذت `test:production-operations` طازجًا؛ restore drill وbackup verification وintegrity/FK/migrations/audit chains وdeployment contract نجحت.
- شغّلت acceptance في runner يسمح بـlocalhost: `30/30`، و`3059+` assertion، وresponsive `648/0`، وa11y `86/0`، مع التصدير وRBAC وrestart persistence.
- شغّلت خادمًا محليًا مع SQLite مؤقتة؛ `/api/health` و`/api/readiness` أعادا HTTP 200، وreadiness أكد `schemaVersion=39`، ثم نُظفت البيئة.

### الملفات المتأثرة
- `audit/qc/QC-Task-Manager/STAGING-READINESS-EVIDENCE-2026-09-01.md`
- `apps/qc-task-manager/_reports/qa/acceptance-20260901/e2e-acceptance.log`
- `.agents/mind/01-mind-latest.md`

### التحقق
- migration/provenance ✅؛ embedded parity `39/39` ✅
- WI UI `test:lab-documents` ✅؛ calibration `97/0` ✅؛ reports `196/0` ✅؛ audit `60/0` ✅
- `test:production-operations` ✅؛ deployment contract `22` checks ✅
- `pnpm e2e:acceptance` ✅ — `30/30`; `3059+`; restart persistence ناجح
- health/readiness smoke ✅ — HTTP `200`، schema `39`
- `git -c core.fsmonitor=false diff --check` ✅
- لا commit ولا push ولا deploy ولا production mutation ✅

### النتيجة
- **الحالة:** جزئي — البوابات المحلية ناجحة، لكن staging الحقيقي والـpersistent disk والـoperator restore read-back غير مثبتة لأنها تحتاج operator deploy.
- **مختصر:** كل الفحوص المحلية المطلوبة مثبتة بأدلة جديدة؛ النشر الخارجي بقي محجوبًا حسب التفويض.

### ملاحظات / مشاكل مفتوحة
- المصدر المضبوط لـWI pages 2/3 و3/3 ما زال غير مورّد؛ لا يجوز ملء النقص أو استنتاج الصفحات.
- direct `e2e-backup.mjs` بدون `QC_DATABASE_PATH` أعاد خطأ إعداد متوقع؛ acceptance backup suite نجحت `13/0`.
- لا يوجد staging deployment evidence أو operator UAT أو production mutation.

## [2026-09-01] — QC-TEST-MANIFEST-E2E-ACCEPTANCE-001: تحقق manifest وكل E2E في runner يسمح بـlocalhost

### تم التنفيذ
- راجعت `apps/qc-task-manager/scripts/test-manifest.mjs` و`test-manifest-guard.mjs` و`e2e-registry.mjs` و`e2e-acceptance.mjs`، وجردت كل ملفات `e2e-*.mjs`؛ لا يوجد suite orphan أو registry drift.
- شغّلت `pnpm test:manifest` في `apps/qc-task-manager`: اجتاز الحارس 65 canonical unit suites و28 canonical E2E suites، exit code 0.
- شغّلت `pnpm e2e:acceptance` في runner يسمح للـAstro production server بالـbind على `127.0.0.1`; الـbuild اكتمل ثم نفّذ 28 workflow suites مع SQLite وport معزولين، إضافة إلى create/verify restart persistence.
- كل الـworkflow suites نجحت: 3,059 assertion ناجحة و0 فاشلة، بدون timeout؛ مرحلتا restart persistence نجحتا وتحققتا من بقاء ملف PDF وتنزيل نفس bytes بعد إعادة تشغيل السيرفر.
- راجعت السويتات كاملة عبر registry والتنفيذ الفعلي وجرد line/assertion markers؛ شملت `a11y` (keyboard/focus/ARIA/axe) و`responsive` (360/390/768/1024/1440) و`reports` وباقي عائلات auth/task/lab.
- لم يحصل أي تعديل على assertions أو كود المنتج؛ ما كان فيه فشل يبرر إصلاحًا جذريًا.

### الملفات المتأثرة
- `apps/qc-task-manager/scripts/test-manifest.mjs`
- `apps/qc-task-manager/scripts/test-manifest-guard.mjs`
- `apps/qc-task-manager/scripts/e2e-registry.mjs`
- `apps/qc-task-manager/scripts/e2e-acceptance.mjs`
- `apps/qc-task-manager/scripts/e2e-*.mjs` (فحص وتنفيذ كامل، بدون تعديل)
- `apps/qc-task-manager/_reports/qa/acceptance-20260901/test-manifest.log`
- `apps/qc-task-manager/_reports/qa/acceptance-20260901/e2e-acceptance.log`

### الأرقام
- Manifest: `65` canonical unit suites، `28` canonical E2E suites، exit `0`.
- Acceptance: `30/30` executions ناجحة (28 workflow + مرحلتا persistence)، exit `0`.
- Assertions القابلة للعد من الـworkflow output: `3059 passed / 0 failed`.
- Persistence: `2/2` operational checks ناجحة؛ السكربت ما يطبع صيغة رقمية، لذلك orchestrator سجّل aggregate بصيغة `3059+ passed / parsability incomplete` بدل ادعاء رقم غير مطبوع.
- الزمن الكلي المسجل: `250979ms`.
- HEAD وقت التشغيل: `269e207ad4a717d33f8dd47abade83e5ba468c09`؛ الشجرة كانت نظيفة.

### القرارات
- استخدمت runner بصلاحية bind محلي لأن sandbox العادي كان معروفًا أنه يمنع `listen`؛ هذا غيّر بيئة التشغيل فقط وما غيّر الاختبارات.
- أبقيت تحذيرات Vite الخاصة بالـdynamic/static imports كما هي؛ البناء نجح ولا يوجد دليل أنها سبب خلل في acceptance.
- لم أعتبر logs المتوقعة لمسارات الرفض (`404/405` ومحاولة retest غير مؤهلة) فشلًا؛ الـassertions الخاصة بها نجحت.

### التحقق
- `pnpm test:manifest` ✅ exit 0 — manifest guard passed.
- `pnpm e2e:acceptance` ✅ exit 0 — build + 30 executions، 0 failed، 0 timeout.
- `a11y` E2E ✅ `86/0`؛ axe critical/serious/moderate/minor كلها `0`.
- `responsive` E2E ✅ `648/0` عبر المقاسات المسجلة.
- `git -c core.fsmonitor=false status --short` ✅ قبل تحديث mind كانت الشجرة نظيفة؛ التغيير النهائي الوحيد هو سجل هذا الملف.
- لا commit ولا push ولا deploy ✅.

### النتيجة
- **الحالة:** نجح.
- **مختصر:** manifest وكل acceptance suites اجتازت في runner قادر على localhost binding، بدون إضعاف assertions أو الحاجة لإصلاح كود؛ السجل الكامل محفوظ في logs المذكورة.

### ملاحظات / مشاكل مفتوحة
- `e2e-acceptance.mjs` لا يفسر مخرجات persistence الرقمية، فبقي aggregate الرسمي `3059+ / parsability incomplete` رغم نجاح المرحلتين؛ هذه ملاحظة reporting وليست فشل اختبار، ولم أغيّر runner لأن الطلب كان فحصًا لا إعادة تصميم صيغة العد.
- نجاح `a11y` الآلي لا يغني عن manual expert testing أو UAT مع مستخدمين ذوي إعاقة.
- لا يوجد فشل مفتوح من هذه المهمة.

## [2026-09-01] — BAI-SECTION-UNIFICATION-001: توحيد إيقاع الأقسام وسلامة ظهور البطاقات

### تم التنفيذ
- أنشأت جردًا تنفيذيًا لـ185 ملف Astro و450 قسمًا، ووثقت انقسام padding بين `home-section--padded` و`inner-section` وخطة التوحيد الآمنة في `_reports/section-unification-audit.md`.
- وحّدت عقد التباعد إلى 64px على الجوال و128px من 1024px عبر `section--padded` مع إبقاء الاسمين السابقين aliases توافقية؛ وأزلت آخر قيم Tailwind اليدوية من أقسام الرئيسية.
- حسّنت قابلية قراءة العناوين والأوصاف فوق الفيديو: حد subtitle صار `65ch`، ظل نص محافظ، وإضافة فحص صريح لتباين عنوان/eyebrow/وصف القسم في `calc-contrast`.
- فعّلت `SectionHeading` في أربعة أقسام نصية مناسبة في hub الحلول مع `id` للوصول؛ أبقيت البطاقات الغنية على markup القائم لحماية عقود CTA و`data-*` وعدم فقد slots أو روابط مركبة.
- أصلحت انحدار ظهور: بطاقات `.feature-card` و`.card--feature` و`.inner-card` لم تعد تبدأ مخفية عبر reveal؛ فحص Chromium النهائي جعل `/solutions/` بلا محتوى غير مرئي في الجوال والديسكتوب.
- لم تُمس `SiteBackground.astro` أو أصول `brightai-background*`، ولم تتغير روابط أو خصائص التحليلات أو النصوص المحمية.

### الملفات المتأثرة
- `_reports/section-unification-audit.md`
- `src/styles/{components,animations}.css`
- `src/components/ui/SectionHeading.astro`
- `src/pages/{index,solutions/index}.astro`
- `scripts/calc-contrast.mjs`
- `download/qa/global-bg-audit/section-unification-final-20260901/`

### الأرقام
- 185 ملف Astro، 450 `<section>`، و121 استخدامًا لـ`inner-section` في 37 ملفًا جُردت.
- التباين المحافظ: title `13.42:1`، eyebrow `8.57:1`، subtitle `5.73:1`.
- فحص Chromium النهائي: 4/4 على `/` و`/solutions/` بمقاسي 360×800 و1440×1000؛ صفر overflow/escapees/big voids/bare text on media/CSS مفقود، و`/solutions/` صفر محتوى مخفي.

### القرارات
- الخلفيات ambient تبقى opt-in للأسطح التسويقية فقط؛ لا تعميم للـdocs أو القانوني أو Kernel لأن هذا يضيف طبقات بصرية بلا معنى للمحتوى المرجعي.
- `Card.astro` يبقى primitive اختياريًا، ولا يُرحّل عليه markup البطاقات الغني حتى يدعم تمرير عقود attributes وslots بأمان.

### التحقق
- `pnpm build` ✅ (تحذيرات تصادم مسارات Astro قديمة فقط).
- `pnpm typecheck` ✅.
- `pnpm test` ✅ — 38 اختبارًا.
- `pnpm contrast:verify` و`node scripts/calc-contrast.mjs` ✅.
- `git diff --check` ✅.
- فحص بصري Chromium 360px و1440px ✅.
- `pnpm lint` ❌ بسبب خطأين قائمين خارج نطاق المهمة في `apps/dashboard/lib/observability/logger.ts:81` (`no-explicit-any`).

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** توحيد الأقسام وقراءة النص وظهور البطاقات اكتمل محليًا وتحقق بصريًا؛ تسليم lint الكامل متوقف على خطأي dashboard القائمين غير المرتبطين بالتغييرات.

### ملاحظات / مشاكل مفتوحة
- بقيت إشارتا Chromium في الرئيسية لعناصر مقصودة خارج تدفق القراءة: chip متحرك وtooltip مخفي حتى hover؛ لا تظهر في `/solutions/` ولا تمثل محتوى مفقودًا.
- لا commit ولا push ولا deploy.

## [2026-09-01] — تحليل شامل وصياغة برومبت تحسين أقسام ومحتوى BRIGHTAI

### تم التنفيذ
- حللت عقل المشروع والجرد الحالي وتقارير التصميم السابقة وتغييرات أسطح القراءة المحلية غير الملتزمة، بدون تعديل كود المنتج.
- فحصت صور المستخدم الأصلية والنسخة الحية `brightai.live` داخل Chrome على 1440×1000 و360×800، مع فصل محتوى الصفحة عن تعليمات المهمة.
- وثقت مشاكل مثبتة: قص H1 عند `x=-28px` على الجوال، هيرو بطول ~2743px، أقسام متكررة بارتفاع 728–1056px، نصوص عارية فوق الفيديو، أهداف لمس صغيرة، وفقرات صفحة الحلول بعرض يصل 1176px وطول 372 حرفًا.
- أنشأت برومبت تنفيذي مخصص لـGPT-5.6 Terra يحافظ على عقد الخلفية حرفيًا، ويبني أسطح قراءة محلية دلالية، ويحسن بنية الأقسام والنصوص عبر عائلات المسارات الثلاثة.
- ضمّنت معايير قبول رقمية للتباين والاستجابة والوصول وSEO والبناء، مع إلزام Chrome وroute inventory وlayout-audit والتغطية الكاملة بدل اللقطات الانتقائية.

### الملفات المتأثرة
- `docs/audits/BRIGHTAI-GLOBAL-SECTIONS-CONTENT-PROMPT.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- قراءة `.agents/mind/01-mind-latest.md` كاملة على دفعات ✅
- قراءة مهارات `redesign-existing-projects` و`accessible-content-rewrite` ومراجعها ✅
- Chrome حي: الرئيسية 1440×1000 و360×800 + صفحة الحلول 1440×1000 ✅
- مطابقة البرومبت مع جرد 369 مسارًا / 176 قالبًا ومع عقد الخلفية 95/95 ✅
- `git diff --check` ✅
- لم يُشغّل build/tests: المهمة تحليلية وتوثيقية ولم تعدّل كود المنتج.

### النتيجة
- **الحالة:** نجح
- **مختصر:** البرومبت النهائي جاهز للتنفيذ داخل Codex 5.6 Terra، مبني على المصدر المحلي والصور وفحص Chrome الحي، ويمنع تغيير الخلفية أو الاكتفاء بتعتيم عام.

### ملاحظات / مشاكل مفتوحة
- انقطع اتصال Chrome بعد فحص الرئيسية والحلول؛ لم أستبدله بمتصفح آخر التزامًا بطلب المستخدم، وبقية العائلات مغطاة من جرد المصدر وتقارير Chromium المحلية ويُلزم البرومبت بإعادة فحصها حيًا أثناء التنفيذ.
- تغييرات `RDX-CONTRAST-ON-MEDIA` المحلية تخص المستخدم وبقيت محفوظة بدون تعديل.

## [2026-09-01] — نقل مخرجات تدقيق QC إلى audit/qc/QC-Task-Manager

### تم التنفيذ
- نقلت 9 ملفات من مخرجات التدقيق الأخيرة من `apps/qc-task-manager/docs/` إلى `audit/qc/QC-Task-Manager/`.
- شملت الملفات التقرير النهائي، سجل الأدلة، تغطية الملفات والمسارات وقاعدة البيانات والاختبارات، مصفوفة المهارات، إجراءات الإغلاق، وprompts الإغلاق.
- لم أكتب فوق أي ملف موجود مسبقًا في المجلد الهدف؛ ملف `CLAIMS-VS-REALITY.md` لم يكن موجودًا بالمصدر، لذلك لم يُنقل.
- حدّثت مراجع المسارات داخل التقرير الرئيسي لتشير للموقع الجديد.

### الملفات المتأثرة
- `audit/qc/QC-Task-Manager/`
- `audit/qc/QC-Task-Manager/ULTIMATE-SYSTEM-AUDIT.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- تحقق من اختفاء الملفات التسعة من المصدر ووجودها غير فارغة في الهدف ✅
- تحقق من عدم وجود تعارض مع ملفات الهدف الموجودة ✅
- لم يُنفذ commit أو push ✅

### النتيجة
- **الحالة:** نجح
- **مختصر:** نُقلت مخرجات التدقيق المطلوبة للمجلد المحدد، مع الحفاظ على الملفات السابقة وتحديث مرجع التقرير الرئيسي.

### ملاحظات / مشاكل مفتوحة
- `CLAIMS-VS-REALITY.md` غير موجود بالمصدر الحالي، لذلك بقي بدون نقل.

## [2026-09-01] — QC-ULTIMATE-INDEPENDENT-AUDIT-001: تدقيق جنائي مستقل طازج للنظام كاملًا

### تم التنفيذ
- جمدت baseline على HEAD `77bf18b6592dbb91ddace645347b4e893efbabea`، وراجعت حالة الشجرة بدون commit أو push أو deploy.
- أعدت جرد QC من المصدر: 489 ملفًا متتبعًا، 116 route file، 36 API file، 39 migration، 365 skill، 65 canonical test suite، و28 canonical E2E.
- نفذت typecheck/build/manifest/route-manifest/schema-reference/embedded-parity/security-hygiene/deployment-contract/production-operations/badge-contrast طازجًا؛ نفذت `pnpm test` كاملًا و`e2e:acceptance` كاملًا في runner مسموح.
- تحققت من قاعدة SQLite مؤقتة معزولة: schema 39، 39/39 checksum، WAL وforeign keys، integrity وforeign-key checks PASS.
- أنشأت تقارير التدقيق والتغطية وسجل الأدلة ومصفوفة المهارات وادعاءات مقابل الواقع وإجراءات الإغلاق وprompts الإغلاق؛ لم أعدل سلوك المنتج.
- صححت نتيجة سابقة: `skills-lock.json` الحالي 365/365 exact و`test:schema-reference` PASS؛ لا يوجد دليل حالي على drift القديم المذكور في تقارير سابقة.

### الملفات المتأثرة
- `apps/qc-task-manager/docs/ULTIMATE-SYSTEM-AUDIT.md`
- `apps/qc-task-manager/docs/FINAL-EVIDENCE-LEDGER.md`
- `apps/qc-task-manager/docs/{FILE-COVERAGE,ROUTE-COVERAGE,DB-COVERAGE,TEST-COVERAGE,SKILL-USAGE-MATRIX,CLAIMS-VS-REALITY,MANUAL-CLOSURE-ACTIONS}.md`
- `apps/qc-task-manager/docs/ULTIMATE-CLOSING-PROMPTS.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm --dir apps/qc-task-manager typecheck` ✅ 0 errors / 0 warnings / 27 hints.
- `pnpm --dir apps/qc-task-manager build` ✅ exit 0.
- `pnpm --dir apps/qc-task-manager test` ✅ 65 canonical suites.
- `pnpm --dir apps/qc-task-manager e2e:acceptance` ✅ كل الأجنحة + restart persistence في runner مسموح؛ sandbox وحده فشل `listen EPERM` قبل التشغيل.
- `test:manifest` ✅ 65 unit + 28 E2E؛ `test:route-manifest` ✅ 116/25/6؛ migration parity ✅ 39/39؛ schema reference ✅ 165 objects.
- `test:deployment-contract` ✅ 22؛ `test:production-operations` ✅؛ security hygiene ✅؛ badge contrast ✅.
- `git diff --check` ✅ بعد إنشاء التقارير؛ لا commit ولا push ولا deploy.

### النتيجة
- **الحالة:** جزئي — التقنية والاختبارات الطازجة ناجحة، لكن جاهزية الشركة مشروطة.
- **مختصر:** الحكم الحالي `CONDITIONAL GO` بسبب credential محلي يحتاج تدوير، غياب live deployment evidence وUAT بشري، ونقص مصدر WI pages 2/3 و3/3. لا يوجد P0 مثبت.

### ملاحظات / مشاكل مفتوحة
- `RUNTIME USER UAT REQUIRED` لكل الأدوار؛ الأتمتة ليست بديلًا.
- credential محلي غير متتبع في `.claude/settings.local.json` يحتاج revoke/rotate وتنظيفًا من مالك البيئة؛ لم تُسجل قيمته.
- لا يوجد نشر حي أو restore drill على staging/production مثبت ضمن هذه المهمة.
- عدّ الدستور «67 skill» متقادم مقابل الواقع 365؛ يحتاج prompt توثيقي.
- قسم mind تجاوز حد الحجم التاريخي؛ الأرشفة للقسم 2 ما زالت قرارًا مستقلًا ولم تُنفذ.

## [2026-08-29] — BAI-BG-VIDEO-001: تعميم خلفية 9.mp4 على كل الواجهات + إصلاح انحدار توصيل CSS + تدقيق شامل

### تم التنفيذ
- **اكتشفت وأصلحت انحدار P0 في توصيل CSS:** 52 من 273 مسارًا في الموقع الرئيسي كانت تُشحن بدون `components.css` (105KB) و`pages.css` (164KB)، لأن `ArabicLayout` هو الوحيد اللي يستوردهم و`index.astro` و`en/*` و`kernel/*` تستخدم `BaseLayout` مباشرة. نقلت الاستيرادين إلى `BaseLayout` بنفس ترتيب الـlayers. **هذا سبب الصور اللي أرسلها المستخدم** (شبكات منهارة، أزرار كروابط، بطاقات بلا أسطح، فقرة مقصوصة من اليسار).
- **اكتشفت وأصلحت إخفاء محتوى P0:** `.gsap-fade` كانت `opacity: 0` وتُكشف بـ`[data-revealed]` — سمة **ما يضبطها أي شي في المستودع** (GSAP محذوف من المشروع)، فشبكة `k-unit-card` في `/kernel/` كانت مخفية كليًا. وحالة الدخول لـ`.card--feature` وعائلتها صارت مشروطة بـ`html.reveal-ready` اللي يضبطها `scroll-reveal.js` كأول إجراء، فلو ما اشتغل السكربت يبقى المحتوى ظاهرًا.
- **عمّمت `9.mp4`** كخلفية طبقة الصفحة الوحيدة: `SiteBackground.astro` في `BaseLayout`، مكوّن React في `apps/dashboard/app/layout.tsx`، تركيب مستقل في الـ3 صفحات اللي تملك `<html>` خاص، وعقد مضمّن يدويًا في `public/500.html`. نسخة واحدة مُلتزمة + `scripts/sync-background-media.mjs` ينسخ ويتحقق SHA-256 في `prebuild`، والنسخ المولّدة في `.gitignore` (صفر MB إضافية في git).
- **اكتشفت أن الفيديو كان يحمّل ولا يشتغل:** `paused: true` في 2184/2184 على الموقع مقابل 0/424 على QC. السبب: `ClientRouter` يعيد إدراج عقد `<body>` و Chromium يحترم `autoplay` فقط للعنصر المُدرج وقت التحليل. أضفت `play()` صريح في الثلاثة (`BAI-BG-VIDEO-002`) مع تجاهل الرفض عمدًا لأن الـposter هو البديل المصمم.
- **أزلت طبقة الخلفية القديمة:** `DottedBackground` (6 طبقات)، canvas الهيرو + 4 beams + spotlight + vignette + سكربت rAF + الاستيراد الديناميكي لـ`dotted-surface.js` (321 سطر)، طبقة noise الثابتة `body::before` (كان `mix-blend-mode: overlay` بيغيّر لون الفيديو)، تعارض اسم `.dotted-bg` في `components.css:3047`، و`BackgroundGrid` من 26 ملفًا (كان يرسم div بلا أي CSS في المستودع).
- **بنيت أدوات قياس:** `route-inventory.mjs` (369 مسارًا، 176 قالبًا، 62 endpoint مستبعدًا)، `layout-audit.mjs` (harness في Chromium حقيقي)، `verify-background-contract.mjs` (95 فحصًا)، `qc-login-state.mjs`.
- **شغّلت مدققًا مستقلًا** على التقارير، ولقى 4 ادعاءات غير مدعومة في المسودة الأولى — صحّحتها كلها وسجّلت التصحيحات صراحةً داخل التقارير نفسها.

### الملفات المتأثرة
- `src/layouts/{BaseLayout,ArabicLayout}.astro` · `src/components/{SiteBackground.astro,SplitHero.astro}`
- `src/styles/{base.css,components.css}` · `public/js/scroll-reveal.js` · `public/500.html`
- `src/pages/{answer/[slug],lp/[slug],kernel/admin/quota}.astro` + 26 ملفًا أُزيل منها `BackgroundGrid`
- `apps/dashboard/{app/layout.tsx,components/SiteBackground.{tsx,module.css},styles/globals.css,app/page.module.css,app/(app|auth|onboarding)/layout.module.css}`
- `scripts/sync-background-media.mjs` · `scripts/qa/{route-inventory,layout-audit,verify-background-contract,qc-login-state}.mjs`
- `docs/audits/{GLOBAL-VIDEO-BACKGROUND-IMPLEMENTATION-REPORT.md,REPOSITORY-DESIGN-UX-AUDIT.md,REPOSITORY-DESIGN-UX-AUDIT.json,REPOSITORY-DESIGN-EXECUTION-PROMPTS.md}`
- `package.json` (`bg:sync`, `bg:verify`, `prebuild`) · `.gitignore`

### الأرقام
- **الجرد:** 369 مسارًا مرئيًا (موقع 273، QC 76، dashboard 20)، 176 قالبًا، 62 endpoint مستبعدًا.
- **الخلفية:** `noVideo` من **2184/2184 → 0/2184**، فيديو واحد بالضبط في كل الـ2184 run، صفر مخالفة بنيوية للعقد، صفر scrim، صفر تحميل مكرر. `9.mp4` = 1600×1200، 7,958,354B، `2ea48871…bb97`، والنسخ الأربع متطابقة byte-for-byte.
- **CSS:** الرئيسية 562 → **1509** قاعدة · `/en/*` 388 → **1350** · `/kernel/*` 1781 → **2743** · المجموعة الضابطة `/about/` 1366 → 1345 (−21 كلها CSS ميت محذوف). `lostCss` 416 → 192 (والـ192 = 24 مسارًا يملك `<html>` خاصًا وما استخدم `pages.css` أصلًا — سليم مو عيب).
- **ارتفاع `/kernel/`:** 29,712px → **9,875px** (شبكة البطاقات رجعت grid).
- **QC:** 53 قالبًا × 8 مقاسات = **424 run** مصادَقة — صفر overflow/escapee/clip/scrim/مخالفة عقد.
- **التغطية:** موقع 273/273 و80/80 = **100%**. QC 53/76 = **69.7%** (مسار وقالب). dashboard **0/20**. الإجمالي: مسارات 88.3%، قوالب 75.6%.
- **درجة التدقيق:** **54.3%** — 126.0 من 232 نقطة منطبقة. **Evidence Confidence 33.3%** (4 من 12). **Human Validation 0%**.

### القرارات
- **إزالة طبقة الصفحة فقط** (قرار المستخدم): أسطح الأقسام والبطاقات تبقى كسطح محلي للتباين، فما فيه overlay عام فوق الفيديو ولا إعادة تصميم للموقع العام.
- **نسخة واحدة + نسخ وقت البناء:** يضمن تطابق SHA-256 بالبناء مو بالفحص اليدوي، ويمنع +16MB في تاريخ git.
- **ما لمست `next.config.mjs` للـdashboard:** إصلاح `serverExternalPackages` يخرج عن نطاق مهمة بصرية؛ كتبت له برومبت `RDX-P0-DASH-BUILD` بدل التنفيذ.
- **ما حذفت أي ملف من القرص:** `DottedBackground.astro` و`dotted-surface.js` و`BackgroundGrid.astro` و`BaseLayout.astro.noapp` غير مركّبة بس باقية، والحذف يحتاج تأكيد المستخدم.

### التحقق
- `pnpm build` (الموقع) ✅ exit 0 · `pnpm --dir apps/qc-task-manager build` ✅ exit 0
- `verify-background-contract.mjs` ✅ 95/95 · `pnpm bg:verify` ✅ 7 أصول متطابقة
- `pnpm test` ✅ 38/38 · QC `test:ui-consistency` ✅ 207/207 · QC `typecheck` ✅ 0 errors
- `pnpm headers:check` ✅ لا drift · `git diff --check` ✅ نظيف
- Chromium فعلي: **2184 run** (موقع) + **424** (QC) + **640×4** conditions (default / reduced-motion / print / zoom 200%)
- تشغيل الفيديو بعد الإصلاح ✅ — `/about/` `currentTime 1.48`، `/500.html` `1.68`، QC `/login` `0.95`
- ❌ `pnpm lint:tokens` — **فشل سابق للمهمة**، مُثبت: `src/pages/tools/ai-risk-register/index.astro` مطابق byte-for-byte لـ`HEAD`
- ❌ `astro check` (الموقع) — 126 خطأ، نمط سابق؛ سكربت `typecheck` الجذري ما يشغّله أصلًا
- ❌ `apps/dashboard` build — **فشل سابق للمهمة**: `node:crypto` UnhandledSchemeError عبر `@sentry/nextjs → @opentelemetry/instrumentation → require-in-the-middle`. مُثبت بالتوقيتات وبأن الملفات الست المعدلة كلها CSS/layout خارج سلسلة الاستيراد
- لم يُشغّل: `e2e:acceptance`، `a11y:scan`، `seo:gate`، Lighthouse، LCP/INP/CLS

### النتيجة
- **الحالة:** جزئي
- **مختصر:** الخلفية تعمل وتشتغل فعليًا على 349 من 369 مسارًا مرئيًا بعقدها الكامل وصفر مخالفة، وانحدارَي CSS وإخفاء المحتوى انحلّا بأدلة مقاسة. الـ20 مسار المتبقية في `apps/dashboard` منفَّذة في المصدر وغير متحقَّقة تشغيليًا لأن التطبيق ما يبني — وهو خلل سابق للمهمة. الحكم في التدقيق: **CONDITIONAL GO**.

### ملاحظات / مشاكل مفتوحة
- **P0 مفتوح:** بناء `apps/dashboard` (`RDX-P0-DASH-BUILD`) — سطر واحد في `serverExternalPackages`.
- **P0 مفتوح:** معمارية الـreveal — 170 من 640 run لسه فيها محتوى مخفي (9,581 عقدة) بعد بوابة `html.reveal-ready`. **مو خلل قياس** — الـharness ينتظر البوابة 6 ثوان ثم يمشي الصفحة كاملة. الحل: الحركة تبدأ من حالة ظاهرة (`RDX-P0-REVEAL-ARCH`).
- **P1:** zoom 200% يتدهور بحدة (123 escapee / 88 clipped مقابل 20/30) — WCAG 1.4.4 + 1.4.10.
- **انحدار معلن:** `groupSplits` 41 → 43 في الزوج المتماثل؛ المقياس المصحّح يقول 10 لكنه كُتب بعد التعديل فما فيه رقم "before" مصحّح.
- **الأداء:** 7.96MB = 3.79× ميزانية الصفحة على كل مسار. استثناء مقصود بأمر المستخدم، وأثره على LCP **لم يُقس** — `RDX-PERF-001`.
- **حارس ضعيف:** `verify-background-contract.mjs` يشتق مقامه من الفحوص المنفذة وأغلبه string-presence — `RDX-P0-GUARD-STRENGTH`.
- **ملفات متروكة:** `src/layouts/ArabicLayout 2.astro` (2026-08-05) لسه فيه الاستيرادين القديمين — فخ للقارئ التالي.
- `public/sitemap.xml` و`sitemap.xml` أعاد كتابتهما `sitemap:generate` (إعادة ترتيب، 1200 داخل/1200 خارج).
- **حجم هذا الملف 412KB** — فوق حد 150KB في الدستور. يلزم نقل أقدم السجلات إلى القسم 2، وما نفّذته بدون إذن.
- لم يحدث commit ولا push ولا deploy.

## [2026-08-28] — QC-SYSTEM-VIDEO-BACKGROUND-002: استبدال الخلفية بـ9.mp4 بألوانها وأبعادها الأصلية

### تم التنفيذ
- استبدلت فيديو الخلفية السابق بملف `9.mp4` نفسه حرفيًا؛ تطابق SHA-256 بين المصدر والأصل المنشور داخل التطبيق.
- ثبّتُّ الفيديو في منتصف الـviewport بأبعاده الطبيعية `1600×1200` بدون `cover` أو scale أو أي تغيير حجم.
- أزلت شفافية الفيديو والفلتر والـscrim بالكامل؛ العرض الآن `opacity: 1` و`filter: none` ويحافظ على اللون الأسود واللمعان الأصليين.
- ولّدت poster جديدًا من الفيديو نفسه بأبعاد `1600×1200` لحالة التحميل المبكر و`prefers-reduced-motion`.
- تحققت أن تسجيل الدخول يستخدم `BaseLayout` نفسه وأن الخلفية تظهر فيه، بدون تصغير حاويات الصفحات لأن عرض المحتوى الحالي `1152px` أصغر من عرض الفيديو الطبيعي.
- وسعت حارس اتساق الواجهة ليفشل إذا عاد `cover` أو scrim أو شفافية/فلتر، أو خرج الفيديو عن أبعاده الطبيعية.

### الملفات المتأثرة
- `apps/qc-task-manager/public/media/qc-system-background.mp4`
- `apps/qc-task-manager/public/media/qc-system-background-poster.jpg`
- `apps/qc-task-manager/src/components/SystemBackground.astro`
- `apps/qc-task-manager/scripts/test-ui-consistency.mjs`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm run test:ui-consistency` ✅ — 207/207.
- `pnpm run typecheck` ✅ — 0 errors و0 warnings؛ 27 hints قديمة.
- `pnpm run build` ✅ — Complete؛ تحذيرا Vite المعروفان فقط.
- Chrome فعلي على `/dashboard` و`/login` ✅ — الفيديو `1600×1200`، opacity=1، filter=none، scrim غير موجود، position=fixed.
- Chrome على 1200×742 و360×800 ✅ — لا overflow أفقي، وتسجيل الدخول يعرض الخلفية والبطاقة داخل الشاشة.
- `cmp` + SHA-256 ✅ — ملف التطبيق مطابق حرفيًا لـ`9.mp4` (`2ea48871471a43fe59773356bfa548679053e9075263f91a0feef04bf5f4bb97`).
- `git diff --check` ✅.

### النتيجة
- **الحالة:** نجح
- **مختصر:** الخلفية الجديدة تظهر في كل الصفحات وتسجيل الدخول بلونها الطبيعي، ثابتة وبمقاسها الأصلي، بدون طبقة شفافة أو تغيير حجم.

### ملاحظات / مشاكل مفتوحة
- الملف الأصلي حجمه 7.6MB؛ أُبقي حرفيًا بدون ضغط أو تغيير بناءً على طلب المستخدم بعدم تغيير حجمه.
- لم يحدث commit أو push أو deploy.

## [2026-08-28] — QC-AUTH-RECOVERY-001: مسار استرجاع كلمة مرور admin عبر CLI (بدل إلغاء المصادقة)

### تم التنفيذ
- المستخدم طلب أول الأمر إلغاء اشتراط كلمة المرور في `https://qc-task-manager.onrender.com/login` (دخول باسم `admin` فقط)، ورفضتُ التنفيذ المباشر لأنه إزالة مصادقة على رابط عام لتطبيق فيه e-signature وaudit chain وRBAC، ثم اختار المستخدم بديل «كلمة مرور تعرفها».
- أضفت سكربت `scripts/reset-user-password.mjs` يعيد تعيين كلمة مرور أي حساب على قاعدة البيانات المنشورة، ويقرأ الكلمة من `QC_NEW_PASSWORD` (مو من argv) حتى ما تدخل shell history أو قائمة العمليات.
- السكربت يستخدم `resetPassword()` نفسها اللي يستخدمها `/admin/users` — فيتحقق من السياسة (8 أحرف)، يفك قفل brute-force، يكتب صفًا في سلسلة تدقيق المستخدمين، ويعيد رفع `must_change_password = 1`.
- أضفت أمر `auth:reset-password` في `package.json`.
- وثّقت المسار في `docs/DEPLOYMENT.md` تحت قسم جديد «Recovering a service nobody can sign in to»، وشرحت ليش `ADMIN_DEFAULT_PASSWORD` ما ينفع لقاعدة بيانات فيها حسابات (يُقرأ فقط لما جدول `users` فارغ).
- ما كتبتُ أي كلمة مرور داخل الكود أو الوثائق أو العقل — الكلمة المؤقتة أُعطيت للمستخدم في المحادثة فقط.

### الملفات المتأثرة
- `apps/qc-task-manager/scripts/reset-user-password.mjs` (جديد)
- `apps/qc-task-manager/package.json`
- `apps/qc-task-manager/docs/DEPLOYMENT.md`
- `.agents/mind/01-mind-latest.md`

### القرارات
- **رفض إلغاء كلمة المرور:** الخدمة منشورة على رابط عام، وإلغاء المصادقة يفتح صلاحيات admin كاملة (حذف/موافقات/تصدير) لأي أحد، ويفرّغ التوقيع الإلكتروني وسلسلة التدقيق من معناها، ويكسر 3 حزم اختبار مصادقة قائمة.
- **إبقاء `must_change_password = 1` بعد الاسترجاع:** الكلمة المؤقتة مرّت عبر قناة محادثة، فلازم تُستبدل من صاحب الحساب في أول دخول.
- **الكلمة من متغير بيئة مو من argv:** منع تسريبها في history وقائمة العمليات على مضيف مشترك.

### التحقق
- تشغيل فعلي على قاعدة مؤقتة (`/tmp`) بعد `db:init` ✅ — الهاش الجديد يطابق، `admin123` صار غير صالح، `must_change_password=1`، `failed_login_attempts=0`، `locked_until=null`، وصف `USER_PASSWORD_RESET` مكتوب في `qc_audit_log`.
- `pnpm run test:auth-password-lifecycle` ✅ — 23/23.
- `pnpm run test:manifest` ✅ — 65 suite + 28 E2E.
- `pnpm run test:deployment-contract` ✅ — 22 فحصًا.
- `node scripts/verify-security-hygiene.mjs` ✅.
- `pnpm run typecheck` ✅ — 0 errors، 0 warnings، 27 hints قديمة.
- حذفت ملفات الاختبار المؤقتة من `/tmp` ✅.

### النتيجة
- **الحالة:** نجح
- **مختصر:** صار فيه مسار استرجاع دخول موثّق ومختبر بدون إضعاف المصادقة، لكنه ما يسري على الخدمة المنشورة إلا بعد commit + push + deploy من المستخدم (وكيل ما يدفع ولا ينشر).

### ملاحظات / مشاكل مفتوحة
- **قاعدة البيانات المحلية `apps/qc-task-manager/db/qc_tasks.db` فيها checksum drift على migration `011_lab_core_master_data.sql`** — ظهر عند فتحها بالسكربت، وهو خلل سابق مستقل عن هذه المهمة ولم أعالجه. أي أداة تفتح هالقاعدة محليًا بترمي `MigrationError`.
- لم يحدث commit ولا push ولا deploy.

## [2026-08-28] — QC-UX-RESEARCH-PROGRAM-001: تجهيز برنامج أبحاث UX تشغيلي حسب الأدوار

### تم التنفيذ
- أنشأت برنامج بحث موحّد لتطبيق `apps/qc-task-manager` يغطي أسئلة البحث، معايير المشاركين، السكربت، السيناريوهات، المقاييس، نموذج الملاحظة، synthesis، severity، وimpact readout.
- فصلت شرائح Employee وSupervisor وManager وLab operator/reviewer وAdmin، مع هدف 5–8 مشاركين لكل شريحة عند الحاجة، ومنعت خلط النتائج بين الأدوار.
- غطيت رحلات create/save/resume/submit/review/reject-rework/approve/search/investigate failure/calibration/report-export، وربطت كل مهمة بنتيجة قابلة للملاحظة بدون تغيير business rules.
- أضفت SEQ بعد كل مهمة وSUS القياسي بعد الجلسة، مع تعريف task success/time/errors/assistance/recovery وقواعد التقرير حسب الدور.
- ثبّتُّ أن النتائج البشرية وbaseline/comparison غير موجودة قبل تنفيذ الجلسات، وأن الاختبارات الآلية لا تكفي لإعلان UX success؛ baseline telemetry يستمر وفق عقد الخصوصية ومدته 14 يومًا.
- ربطت الخطة المختصرة الحالية بالبرنامج الكامل، مع بقاء `PILOT-UAT.md` و`UX-MEASUREMENT.md` مصادر تشغيلية مكملة.

### الملفات المتأثرة
- `apps/qc-task-manager/docs/UX-RESEARCH-PROGRAM.md`
- `apps/qc-task-manager/docs/UX-USABILITY-TEST-PLAN.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm --dir apps/qc-task-manager run test:lab-ux-presentation` ✅ — 14/14.
- `pnpm --dir apps/qc-task-manager run test:ux-telemetry` ✅.
- `git -c core.fsmonitor=false diff --check` ✅.
- لم يُشغّل build/typecheck: التغيير وثائقي فقط ولا يلمس كود التطبيق.

### النتيجة
- **الحالة:** نجح
- **مختصر:** برنامج البحث جاهز للتنفيذ الفعلي، بدون اختلاق نتائج أو إعلان نجاح UX قبل جلسات المشاركين وتحليلها حسب الدور.

### ملاحظات / مشاكل مفتوحة
- UAT البشري، VoiceOver، baseline الفعلي، ونتائج المشاركين ما زالت مطلوبة ولم تُنفّذ في هذه الدفعة.
- بقي حذف غير متعلق ظاهرًا في `audit/brightai-sa-keyword-research.csv` كما هو ولم ألمسه.
- لم يحدث commit أو push أو deploy.

## [2026-08-28] — إنشاء إضافة BRIGHTAI SEO لأبحاث السعودية وGEO

### تم التنفيذ
- أنشأت إضافة Codex شخصية باسم `brightai-seo` ضمن `~/plugins/brightai-seo`.
- أضفت أربع مهارات تشغيلية: `saudi-keyword-research` و`seo-audit` و`topical-authority` و`ai-visibility`.
- ربطت الإضافة بالـ marketplace الشخصي `personal` مع سياسة تثبيت `AVAILABLE` ومصادقة `ON_INSTALL`.
- صممت المهارات لتستخدم نطاق BRIGHTAI المعتمد `https://brightai.live`، وتستفيد من DataForSEO MCP الموجود في إعداد المشروع بدون تخزين أسرار.
- غطت المهارات بحث الكلمات السعودية، التدقيق الشامل، خريطة السلطة الموضوعية، وقياس ظهور BRIGHTAI في منصات الذكاء مع فصل القياس الفعلي عن الاستنتاج.

### الملفات المتأثرة
- `/Users/yzydalshmry/plugins/brightai-seo/.codex-plugin/plugin.json`
- `/Users/yzydalshmry/plugins/brightai-seo/skills/saudi-keyword-research/SKILL.md`
- `/Users/yzydalshmry/plugins/brightai-seo/skills/seo-audit/SKILL.md`
- `/Users/yzydalshmry/plugins/brightai-seo/skills/topical-authority/SKILL.md`
- `/Users/yzydalshmry/plugins/brightai-seo/skills/ai-visibility/SKILL.md`
- `/Users/yzydalshmry/.agents/plugins/marketplace.json`

### التحقق
- `validate_plugin.py /Users/yzydalshmry/plugins/brightai-seo` ✅
- فحص JSON للـmanifest والـmarketplace ✅
- عدد المهارات المنشأة: 4 ✅
- لا توجد أسرار أو بيانات اعتماد داخل الإضافة ✅
- لم يُنفذ build للمشروع؛ الإضافة مستقلة عن كود الموقع ✅

### النتيجة
- **الحالة:** نجح
- **مختصر:** الإضافة جاهزة للاستخدام في Codex كحزمة SEO/GEO متخصصة لـBRIGHTAI، والـcommit أو push غير منفذين.

### ملاحظات / مشاكل مفتوحة
- تشغيل DataForSEO الفعلي يحتاج وجود `DATAFORSEO_LOGIN` و`DATAFORSEO_PASSWORD` في البيئة وإعادة تشغيل Codex إذا لم يظهر الخادم.

## [2026-08-28] — QC-AI-SECURITY-UX-001: توضيح حدود AI وحالات الجلسة والصلاحيات

### تم التنفيذ
- وحّدت عرض `AiReviewPanel` بإضافة مؤشر ثابت يوضح أن AI advisory فقط.
- فصلت نتيجة AI بصريًا إلى `System data` و`AI suggestion` و`User decision`، مع إبقاء تفاصيل JSON داخل disclosure قابل للفتح.
- أضفت حالة آمنة لانتهاء الجلسة (401) مع رابط تسجيل دخول، وحالة صلاحية (403) تمنع إعادة المحاولة العمياء وتشرح مسار طلب الوصول.
- أبقيت حالة مزود AI غير المهيأ منفصلة، بحيث يتعطل تشغيل AI فقط وتستمر مسارات QC الأساسية يدويًا.
- أضفت حراسة UX Writing تمنع رجوع حدود القرار البشري ورسائل الاسترجاع الأساسية.

### الملفات المتأثرة
- `apps/qc-task-manager/src/components/AiReviewPanel.tsx`
- `apps/qc-task-manager/scripts/test-ux-writing.mjs`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm --dir apps/qc-task-manager run test:ux-writing` ✅ — 14/14.
- `pnpm --dir apps/qc-task-manager run test:interaction-feedback` ✅ — 25/25.
- `pnpm --dir apps/qc-task-manager run test:ai-foundation` ✅.
- `pnpm --dir apps/qc-task-manager run test:ai-features` ✅.
- `pnpm --dir apps/qc-task-manager run test:ai-lab` ✅.
- `pnpm --dir apps/qc-task-manager run typecheck` ✅ — 0 errors، 0 warnings، 27 hints قديمة.
- `NODE_ENV=production pnpm --dir apps/qc-task-manager run build` ✅ — Complete؛ تحذيرات Vite الديناميكية المعروفة فقط.
- `git -c core.fsmonitor=false diff --check` ✅.

### النتيجة
- **الحالة:** نجح
- **مختصر:** صار AI أوضح كاقتراح غير ملزم، مع مسارات استرجاع آمنة لانتهاء الجلسة وفشل الصلاحية، بدون تغيير API أو RBAC أو workflow أو قرار QC بشري.

### ملاحظات / مشاكل مفتوحة
- ما زال فحص UAT البشري وVoiceOver على أجهزة فعلية مطلوبًا؛ لم يُجرَ في هذه الدفعة.
- لم يحدث commit أو push أو deploy.

## [2026-08-28] — SEO-DOMAIN-CANONICAL-002: قرار النطاق المعتمد brightai.live + بناء ملف الكلمات عليه

### تم التنفيذ
- المستخدم حسم القرار: **`brightai.live` هو النطاق المعتمد والوحيد** — أي تحليل سابق افترض `brightai.site` كنطاق تجاري ظاهر أُلغي.
- تحققت قراءةً فقط أن المصدر مبني بالفعل على `brightai.live` (`astro.config.mjs: site: 'https://brightai.live'` + كل إدخالات kernel/سايت ماب) — **صفر تعديل مطلوب في المصدر**.
- حدّثت `target_url` في CSV الكلمات من مسارات نسبية إلى روابط مطلقة على `https://brightai.live/...` — 45/45 صف، و0 ذكر لـ`brightai.site`.
- لم أتلمس أي ملف مشروع آخر — لا build ولا إعدادات ولا صفحات، بالأمر الصريح من المستخدم.

### الملفات المتأثرة
- `download/seo/brightai-sa-keyword-research.csv`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `grep -c 'https://brightai.live'` = 45 ✅ و`grep -c 'brightai.site'` = 0 ✅
- `pending_credentials` = 45 (أعمدة DataForSEO محفوظة كما هي) ✅
- قراءة `astro.config.mjs` ✅ — النطاق `brightai.live` مؤكد من المصدر

### النتيجة
- **الحالة:** نجح
- **مختصر:** ملف الكلمات صار مبنيًا صراحةً على النطاق المعتمد `brightai.live`، والمصدر أصلًا متوافق معه — ظهور `brightai.site` في نتائج البحث مسألة إشارات خارجية (فهرسة/ملكية النطاق الثاني عند Google) مو تعارض داخل الكود.

### ملاحظات / مشاكل مفتوحة
- أُغلق سؤال النطاق P1 المسجل في SEO-KEYWORD-RESEARCH-001 بقرار المستخدم.
- بقي مفتوحًا (خارج نطاق اليوم): تعامل محركات البحث مع `brightai.site` (إعادة توجيه 301 أو إزالة فهرسته) — يُنفّذ فقط إذا طلب المستخدم.
- DataForSEO ما زال `pending_credentials` (45 صفًا) — ترتيب الأولوية بالـvolume ينتظر تفعيل الاعتماد.


## [2026-08-28] — SEO-KEYWORD-RESEARCH-001: تحليل الصفحات الأساسية وتجهيز CSV لكلمات السعودية

### تم التنفيذ
- حللت الصفحات الأساسية محليًا: الرئيسية، `about`, `services`, `solutions`, صفحة الحل، `trust`, `contact`, `blog`, `pricing`, وتقييم جاهزية حوكمة AI.
- قارنت إشارات المصدر مع نتائج البحث الحية؛ النطاق الظاهر للجمهور هو `brightai.site` بينما المصدر يضع `brightai.live` في `astro.config.mjs` وcanonical وsitemap، وسُجّلت كنقطة P1 قبل الاعتماد على إشارات البحث.
- راجعت إشارات المحتوى الحالية: حوكمة AI، AI Firewall، PDPL، NCA ECC، SDAIA، ISO 42001، ملفات الأدلة، الموافقات البشرية، القطاعات والمدن السعودية.
- أنشأت CSV يضم 45 فرصة كلمات مفتاحية عربية/إنجليزية، مع التجميع، نية البحث، صفحة الهدف، مرحلة القمع، الأولوية، long-tail، وطريقة السيطرة المقترحة.
- امتنعت عن اختلاق volume أو CPC أو competition؛ كل أعمدة DataForSEO موسومة `pending_credentials` لأن أداة DataForSEO غير ظاهرة كأداة MCP قابلة للاستدعاء في الجلسة وبيئتا `DATAFORSEO_LOGIN` و`DATAFORSEO_PASSWORD` غير موجودتين.

### الملفات المتأثرة
- `download/seo/brightai-sa-keyword-research.csv`
- `.agents/mind/01-mind-latest.md`

### التحقق
- فحص CSV ✅ — 45 صف بيانات + رأس الملف.
- `git -c core.fsmonitor=false diff --check` — لم يُنفّذ بعد هذا السجل؛ فحص Git العادي تأثر بخطأ بيئي في `fsmonitor_ipc`.
- تحليل حي عبر نتائج البحث ✅ — تم التحقق من ظهور `brightai.site` وصفحة الحل الرئيسية.
- DataForSEO API ⚠️ — لم يُنفّذ بسبب غياب الأداة القابلة للاستدعاء والاعتمادات، بدون طباعة أو تخزين أسرار.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** تحليل الصفحات وCSV الاستراتيجي جاهزان، لكن ترتيب الكلمات حسب أعلى volume ومؤشرات السوق السعودية ينتظر تفعيل DataForSEO بعد توفير الاعتمادات وإعادة تحميل MCP.

### ملاحظات / مشاكل مفتوحة
- يلزم توحيد النطاق canonical بين `brightai.site` و`brightai.live` قبل ضخ بيانات الكلمات في قرارات الصفحات أو بناء الروابط.
- يلزم تشغيل DataForSEO على بذور CSV نفسها، ثم ملء `monthly_searches_sa`, `competition`, و`cpc_sar` وإعادة ترتيب الأولوية بالبيانات الفعلية.

## [2026-08-28] — DATAFORSEO-MCP-001: ربط خادم DataForSEO الرسمي بإعداد Codex المحلي

### تم التنفيذ
- أضفت خادم MCP الرسمي `dataforseo-mcp-server@latest` إلى إعداد المشروع عبر بروتوكول stdio.
- ضبطت التشغيل ليقرأ `DATAFORSEO_LOGIN` و`DATAFORSEO_PASSWORD` من بيئة العملية فقط.
- امتنعت عن كتابة بيانات الدخول أو أي secret داخل المستودع أو ملف العقل أو إعداد MCP.
- تحققت من صحة صيغة TOML وظهور خادمي MCP: `caveman-shrink` و`dataforseo`.

### الملفات المتأثرة
- `.codex/config.toml`
- `.agents/mind/01-mind-latest.md`

### التحقق
- تحليل TOML ✅ — `TOML_OK`.
- فحص `git diff --check` ✅.
- لم يُشغّل اتصال API فعليًا: متغيرات الاعتماد لم تُخزّن أو تُطبع حفاظًا على السرية.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** إعداد DataForSEO MCP صار مربوطًا محليًا، ويبقى تفعيل الاعتماد وإعادة تشغيل Codex بمتغيرات البيئة، ثم اختبار `api_request`.

### ملاحظات / مشاكل مفتوحة
- بيانات الدخول التي أُرسلت في المحادثة يُفضّل تدويرها من لوحة DataForSEO بعد التحقق.
- لا يوجد commit أو push.

## [2026-08-28] — QC-UX-WRITING-001: توحيد لغة المنتج والـmicrocopy

### تم التنفيذ
- أضفت عقد UX Writing موحّدًا يغطي النبرة، قاموس المصطلحات، الأفعال، الأخطاء، الحالات الفارغة، الصلاحيات، AI، التوطين، وإمكانية الوصول.
- عرّفت المصطلحات التشغيلية الأساسية: Save draft، Submit for review، Approve، Reject، Return for changes، Reopen task، Complete task، Pass/Fail/Hold، وRetest required.
- حسّنت رسائل `OperationalState` لتشرح الحالة والخطوة التالية بدون لوم المستخدم أو كشف تفاصيل داخلية.
- حسّنت رسائل أخطاء وإجراءات `TaskLifecycle` و`CommentBox` و`AttachmentUploader` لتوضح ما حدث وما الإجراء التالي، ووضحت تسميات evidence وoverride.
- وضحت في `AiReviewPanel` أن المخرجات اقتراحات advisory فقط، وأن AI لا يعتمد أو يرفض أو يقرر نتائج QC.
- وضحت `ReviewDeleteRequestDialog` أن الإجراء هو الموافقة على الحذف الدائم، مع صياغة أوضح لسبب الرفض.
- أضفت حارس `test:ux-writing` وربطته بالـmanifest، وحدّثت عقد interaction feedback بعد إزالة عبارات recovery القديمة.

### الملفات المتأثرة
- `apps/qc-task-manager/docs/UX-WRITING.md`
- `apps/qc-task-manager/scripts/test-ux-writing.mjs`
- `apps/qc-task-manager/scripts/test-interaction-feedback.mjs`
- `apps/qc-task-manager/scripts/test-manifest.mjs`
- `apps/qc-task-manager/package.json`
- `apps/qc-task-manager/src/components/{OperationalState,TaskLifecycle,CommentBox,AttachmentUploader,AiReviewPanel,ReviewDeleteRequestDialog}`

### التحقق
- `pnpm run test:ux-writing` ✅ — 10/10.
- `pnpm run test:interaction-feedback` ✅ — 25/25.
- `pnpm run test:ui-consistency` ✅ — 181/181.
- `pnpm run test:manifest` ✅ — 64 canonical suites و28 canonical E2E.
- `pnpm run typecheck` ✅ — 0 errors، 0 warnings، 26 hints قديمة.
- `NODE_ENV=production pnpm run build` ✅ — Complete؛ تحذيرات Vite الديناميكية المعروفة فقط.
- `git diff --check` ✅.

### النتيجة
- **الحالة:** نجح
- **مختصر:** توحّدت لغة العمليات والرسائل الحساسة للمستخدم في الأسطح المشتركة، مع توثيق قاموس قابل للتوسع وحراسة تمنع رجوع المصطلحات القديمة، بدون تغيير RBAC أو workflows أو business rules أو API contracts.

### ملاحظات / مشاكل مفتوحة
- يلزم UAT بشري للتأكد من أن المصطلحات الإنجليزية الحالية تطابق لغة فرق QC، وفحص VoiceOver على الأجهزة الفعلية حسب السجلات السابقة.
- توجد تغييرات مستخدم سابقة في الشجرة وتم الحفاظ عليها؛ لم يحدث commit أو push.

## [2026-08-28] — QC-MOTION-DIGITAL-ART-001: توحيد لغة الحركة التشغيلية في QC Task Manager

### تم التنفيذ
- أزلت حركة رفع البطاقات (`hover:-translate-y`) من dashboard وLab Management، وأبقيت feedback بصريًا عبر shadow transition صريح.
- استبدلت الانتقالات العامة بخصائص محددة مع `duration-qc-standard` و`ease-qc-standard` في بطاقات dashboard وLab وdocuments وnotifications.
- أزلت `transition-all` من نقاط الرسوم التفاعلية؛ تغيّر نصف قطر الدائرة صار فوريًا بدل تحريك خاصية غير مطلوبة تشغيليًا.
- أضفت حراسة مصدرية للحركة تمنع `transition-all` وgeneric transitions وhover translate/scale داخل التطبيق، مع استمرار حراسة reduced motion العامة.
- وثّقت motion language: 120ms للحركة السريعة، 180ms للحركة القياسية، حد تشغيلي 240ms، ورفض page entrance/parallax/loops/KPI animation والـ decorative art في الشاشات الحرجة.

### الملفات المتأثرة
- `apps/qc-task-manager/src/pages/dashboard.astro`
- `apps/qc-task-manager/src/pages/lab/{index,management}.astro`
- `apps/qc-task-manager/src/pages/lab/documents/index.astro`
- `apps/qc-task-manager/src/components/{DashboardCharts,LabDashboardCharts}.tsx`
- `apps/qc-task-manager/src/components/NotificationCard.astro`
- `apps/qc-task-manager/src/components/lab/LabFailRateChart.tsx`
- `apps/qc-task-manager/scripts/test-lab-ux-performance.mjs`
- `apps/qc-task-manager/docs/UI-DESIGN-SYSTEM.md`

### التحقق
- `pnpm run test:lab-ux-performance` ✅ — 9/9.
- `pnpm run test:ui-consistency` ✅ — 181/181، و`test:manifest` ✅ — 63 canonical و28 E2E.
- `pnpm run test:badge-contrast` ✅ — 13/13، و`test:responsive-e2e-contract` ✅.
- `pnpm test` ✅ — 63 canonical suites بدون فشل.
- `NODE_ENV=production pnpm build` ✅ — Complete؛ تحذيرات Vite الديناميكية المعروفة فقط.
- `pnpm run e2e:acceptance` ✅ — 30/30 suite، 3047+ assertion، وresponsive 648/0 وa11y 86/0.
- `git -c core.fsmonitor=false diff --check` ✅، وmotion inventory بعد التعديل بلا violations مستهدفة.

### النتيجة
- **الحالة:** نجح
- **مختصر:** صارت الحركة في واجهة QC مقصودة ومحدودة لدعم فهم الحالة، بدون حركة زخرفية أو تغيير في RBAC أو workflows أو database أو business rules أو dependencies.

### ملاحظات / مشاكل مفتوحة
- ما زال UAT البشري على أجهزة حقيقية وVoiceOver مطلوبًا؛ الاختبارات الآلية لا تستبدله.
- مهارة `motion-and-zoom` المطلوبة غير متاحة في جلسة التنفيذ؛ تم تطبيق المهارات المتاحة ذات الصلة.
- لم يحدث commit أو push أو deploy.

## [2026-08-28] — QC-INTERACTION-FEEDBACK-001: توحيد حالات التفاعل والتغذية الراجعة

### تم التنفيذ
- أضفت `ActionFeedback` مشتركًا لمناطق live ثابتة، مع أدوار مختلفة للأخطاء والتحديثات الروتينية، ونبرات semantic متوافقة مع نظام التصميم.
- وحّدت feedback المحلي في التعليقات، المرفقات، مراجعة AI، الإشعارات، طلبات الحذف، وتحديث المهمة، مع رسائل نجاح وفشل تشرح الخطوة التالية وتحافظ على المدخلات.
- أضفت `aria-busy` وحالات loading محلية، ووضّحت labels أثناء التنفيذ، وحسّنت أزرار الإجراءات بحالات focus-visible وpressed وهدف لمس لا يقل عن 44px.
- أضفت حراسة مصدرية `test-interaction-feedback` وربطتها بالـ manifest لضمان وجود feedback قابل للاسترجاع في الـ React islands الحرجة.
- حدّثت `AppButton` ليعرض حالة pressed بوضوح عبر الـ variants الحالية، بدون إضافة dependency أو تغيير endpoint أو workflow أو RBAC.

### الملفات المتأثرة
- `apps/qc-task-manager/src/components/ui/ActionFeedback.tsx`
- `apps/qc-task-manager/src/components/ui/AppButton.astro`
- `apps/qc-task-manager/src/components/{CommentBox,AttachmentUploader,AiReviewPanel,MarkReadButton,MarkAllReadButton,DeleteRequestDialog,TaskUpdatePanel}.tsx`
- `apps/qc-task-manager/scripts/test-interaction-feedback.mjs`
- `apps/qc-task-manager/package.json`
- `apps/qc-task-manager/scripts/test-manifest.mjs`

### التحقق
- `pnpm --dir apps/qc-task-manager test:interaction-feedback` ✅ — 25/25.
- `pnpm typecheck` ✅ — 0 errors، 0 warnings، و26 hints غير حاجبة موجودة مسبقًا.
- `pnpm test` ✅ — 63 canonical suites بدون فشل.
- `pnpm build` ✅ — Complete؛ تحذيرات Astro/Vite الديناميكية المعروفة فقط.
- `pnpm e2e:acceptance` ✅ — 30/30 suite، 3047+ assertion، مع اختبار restart persistence؛ احتاج تشغيل الخادم المحلي خارج sandbox بعد فشل EPERM قبل بدء الاختبارات.
- `pnpm test:ui-consistency` ✅ — 181/181، و`git diff --check` ✅.

### النتيجة
- **الحالة:** نجح
- **مختصر:** صار عند المستخدم feedback متوقع ومباشر للأفعال المحلية عالية التكرار والحساسية، مع recovery واضح، بدون المساس بقواعد المجال أو سلامة التدقيق.

### ملاحظات / مشاكل مفتوحة
- ما زال UAT البشري على أجهزة حقيقية وVoiceOver مطلوبًا حسب سجل المشروع؛ الاختبارات الآلية لا تستبدله.
- لم يحدث commit أو push أو deploy.

## [2026-08-28] — QC-ADVANCED-FORM-UX-001: رحلة أقسام آمنة ومراجعة صريحة لنموذج اختبارات المختبر

### تم التنفيذ
- حسّنت `LabTestForm` بعقد حالات حفظ صريحة (`saved`, `unsaved`, `saving`, `failed`) مع رسالة حالة live واضحة وحماية فقدان التعديلات القائمة.
- صححت تنقل الأقسام ليطابق ترتيب النموذج الفعلي من 1 إلى 8، ويعرض نص الحالة `Not started` / `In progress` / `Complete` / `Error` بدل الاعتماد على رمز أو لون فقط.
- أضفت خطوة مراجعة قابلة للتركيز قبل إرسال اختبار عالي الأثر إلى طابور المراجعة، مع ملخص المنتج وعدد العينات والنتيجة، وإرجاع التركيز إلى زر الإرسال عند اختيار `Keep editing`.
- حسّنت ملخص أخطاء الإرسال ليكون focusable، وربطت أخطاء الحقول المطلوبة المجاورة بالـ controls عبر `aria-describedby`، وجعلت رابط أخطاء شبكة العينات يركز أول control قابل للاستخدام داخل القسم.
- ثبّتُّ أن تغيير Connector Type يسجل أن المستخدم لمس الحقل، فلا يعيد Product Master الكتابة فوق اختياره.
- حدّثت اختبار E2E لنموذج المختبر ليؤكد خطوة `Confirm and send for review`، وأضافت حراسة form productivity لعقد المراجعة وحالات الحفظ وحالات الأقسام.

### الملفات المتأثرة
- `apps/qc-task-manager/src/components/lab/LabTestForm.tsx`
- `apps/qc-task-manager/scripts/e2e-lab-form.mjs`
- `apps/qc-task-manager/scripts/test-form-productivity.mjs`

### التحقق
- `pnpm run test:form-productivity` ✅ — 20/20.
- `pnpm run test:lab-form` ✅ — 72/72.
- `pnpm run test:lab-ux-presentation` ✅ — 14/14.
- `pnpm run test:ui-consistency` ✅ — 181/181.
- `pnpm run test:responsive-e2e-contract` ✅.
- `pnpm run typecheck` ✅ — 0 errors، 0 warnings، 26 hints غير حاجبة.
- `NODE_ENV=production pnpm run build` ✅ — Complete؛ تحذيرات Vite الديناميكية المعروفة فقط.
- `pnpm run e2e:acceptance` ✅ — 30/30 suite، 3047+ assertion، و`lab-form` 141/0 وresponsive 648/0 وa11y 86/0.
- `pnpm test` ✅ — 62 canonical suites، بدون فشل.
- `git diff --check` ✅.

### النتيجة
- **الحالة:** نجح
- **مختصر:** صار نموذج اختبار المختبر يوجّه المستخدم عبر أقسام صحيحة، يحافظ على سياقه عند الخطأ، ويطلب تأكيدًا صريحًا قبل الإرسال، بدون تغيير قواعد المجال أو RBAC أو CSRF أو schema.

### ملاحظات / مشاكل مفتوحة
- مهارة `zeigarnik-effect` غير متاحة في جلسة التنفيذ؛ تم تطبيق مبادئ chunking/progressive disclosure من المهارات المتاحة.
- ما زال فحص UAT البشري الفعلي على أجهزة حقيقية وVoiceOver مطلوبًا حسب سجل المشروع؛ الاختبارات الآلية لا تستبدله.
- لم يحدث commit أو push أو deploy.

## [2026-08-28] — QC-CORE-UI-CONSOLIDATION-001: توحيد headers/actions/alerts/empty states في الأسطح عالية الاستخدام

### تم التنفيذ
- رحّلت header صفحة `/dashboard` و`/search` إلى `PageHeader` مع eyebrow ووصف وaction row متجاوب، بدون تغيير المسارات أو محتوى التشغيل.
- رحّلت actions الأساسية في dashboard (فتح التقارير، تطبيق الفلاتر، المسح) وعمليات التصدير/حفظ الفلاتر في البحث إلى `AppButton` مع ترتيب primary/secondary واضح.
- رحّلت أزرار CTA في `EmptyState` إلى `AppButton`، فصار نمط الحالة الفارغة يعتمد على نفس focus/height/semantic token contract.
- استبدلت focus ring اليدوي في روابط تنقل أقسام dashboard بعقد `qc-focus`، مع إبقاء روابط الأقسام والـanchors كما هي.
- وحّدت خطأ dashboard مع `Banner` بحالة error وعنوان واضح، بدل alert markup محلي.
- وسّعت `test-ui-consistency` ليحرس استخدام `PageHeader` في dashboard/search.

### الملفات المتأثرة
- `apps/qc-task-manager/src/pages/dashboard.astro`
- `apps/qc-task-manager/src/pages/search.astro`
- `apps/qc-task-manager/src/components/EmptyState.astro`
- `apps/qc-task-manager/scripts/test-ui-consistency.mjs`

### التحقق
- `pnpm --filter @brightai/qc-task-manager test:ui-consistency` ✅ — 181/181.
- `pnpm --filter @brightai/qc-task-manager test:responsive-e2e-contract` ✅.
- `pnpm --filter @brightai/qc-task-manager test:badge-contrast` ✅ — كل الأزواج ضمن WCAG 2.2 AA.
- `pnpm --filter @brightai/qc-task-manager typecheck` ✅ — 0 errors، 0 warnings، 26 hints قديمة.
- `NODE_ENV=production pnpm --filter @brightai/qc-task-manager build` ✅ — Complete؛ تحذيرات Vite الديناميكية المعروفة فقط.
- `git -c core.fsmonitor=false diff --check` ✅.

### النتيجة
- **الحالة:** نجح
- **مختصر:** توحّدت أعلى أنماط العرض تكرارًا في dashboard/search وEmptyState باستخدام primitives الحالية، مع بقاء server-side filtering وRBAC وPOST/GET contracts وسلوك workflow بدون تغيير.

### ملاحظات / مشاكل مفتوحة
- بقيت بعض raw controls وcard/action markup في dashboard/search، إضافةً إلى صفحات الإدارة، ضمن الترحيل التدريجي route-sized؛ لم يتم اختراع abstraction عام جديد لها.
- لم يتم تشغيل full `pnpm test` أو `pnpm e2e:acceptance` في هذا workstream؛ تم تشغيل البوابات المتأثرة مباشرة وbuild/typecheck.
- لم يحدث commit أو push أو deploy.

## [2026-08-28] — QC-IA-NAV-WAYFINDING-001: تنظيم IA وتحسين التنقل والـ breadcrumbs

### تم التنفيذ
- وثّقت inventory فعلي للمسارات، التنقل العام والمحلي للمختبر، تنقل الأدوار، روابط الأدوات، والعلاقات التشغيلية بين السجلات في وثيقة IA مستقلة.
- ربطت نموذج التنقل بالمهام الفعلية ومسارات `Task → Finding → CAPA → Evidence` و`Product → Test → Review → Retest → Report` وغيرها، مع تثبيت أن RBAC على الخادم هو المصدر authoritative.
- أضفت breadcrumbs مشتركة لصفحات تفاصيل Tasks وFindings مع الحفاظ على الروابط الحالية وسلوك الرجوع الخاص بالدور.
- حسّنت أهداف اللمس وحالات التركيز في مكوّن Breadcrumbs لتناسب الجوال ولوحة المفاتيح.
- أضفت حراسة consistency تمنع رجوع صفحات تفاصيل Tasks وFindings بدون Breadcrumbs.
- أصلحت تباين أزرار Pagination المعطّلة في السطح المحايد، بعد ما كشف فحص الوصول الحالة المشتركة في `/lab/documents` و`/lab/search`.

### الملفات المتأثرة
- `apps/qc-task-manager/docs/INFORMATION-ARCHITECTURE.md`
- `apps/qc-task-manager/src/components/Breadcrumbs.astro`
- `apps/qc-task-manager/src/pages/tasks/[id].astro`
- `apps/qc-task-manager/src/pages/findings/[id].astro`
- `apps/qc-task-manager/src/components/ui/Pagination.astro`
- `apps/qc-task-manager/scripts/test-ui-consistency.mjs`

### التحقق
- `node scripts/test-ui-consistency.mjs` ✅ — 179/179
- `node scripts/architecture-guard.mjs` ✅
- `node scripts/test-lab-ux-presentation.mjs` ✅ — 14/14
- `node scripts/test-responsive-e2e-contract.mjs` ✅
- `node scripts/verify-badge-contrast.mjs` ✅
- `astro check` ✅ — 0 errors، 0 warnings، 26 hints موجودة مسبقًا
- `NODE_ENV=production astro build` ✅
- `node scripts/e2e-acceptance.mjs` ✅ — 30/30 suites، 3047+ assertions parsed، و86/86 accessibility و648/648 responsive
- `git diff --check` ✅

### النتيجة
- **الحالة:** نجح
- **مختصر:** اكتمل workstream تنظيم IA والـ wayfinding بدون تغيير URLs أو RBAC أو workflows أو DB أو CSRF، مع اجتياز بوابة القبول الكاملة.

### ملاحظات / مشاكل مفتوحة
- ما تم تنفيذ جلسة card sort/tree testing بشرية ولا فحص VoiceOver كامل أو اختبار zoom بنسبة 200%؛ تبقى ضمن UAT اليدوي.
- ما صار `git commit` ولا `git push`؛ التغييرات المحلية جاهزة للمراجعة.

## [2026-08-28] — QC-STATUS-SEMANTICS-001: توحيد دلالات الحالات في QC Task Manager

### تم التنفيذ
- وحّدت أدوار العرض إلى `neutral`, `info`, `pending`, `warning`, `success`, `danger`, و`blocked` داخل `statusTones.ts`، مع إبقاء aliases قديمة معلنة للتوافق فقط.
- أضفت adapters مستقلة لـ Tasks وFindings وCAPA وEvidence وLab Tests وDocuments وEquipment وCalibration وMaintenance وRetests وNotifications وAccount وAI، بدون تغيير raw enums أو قواعد المجال.
- حوّلت `StatusBadge` و`QcStatusBadge` و`LabDocumentStatusBadge` إلى wrappers فوق `StatusPill`؛ خرائط المختبر القديمة صارت تشتق classes من الطبقة المركزية.
- جعلت fallback للحالات غير المعروفة label مقروءًا بدل عرض raw enum فقط، مع بقاء النص دائمًا حاضرًا والإشارة البصرية decorative.
- ربطت notification severity بالـsemantic tokens، وأضفت `test:status-semantics` لحراسة adapters، delegation، fallback labels، ومنع raw status colors في wrappers.
- وثقت inventory كاملًا وقواعد الترحيل والتوافق في `docs/STATUS-SEMANTICS.md` وحدّثت وثائق design-system وmigration.

### الملفات المتأثرة
- `apps/qc-task-manager/src/components/ui/statusTones.ts`
- `apps/qc-task-manager/src/components/ui/{StatusPill,labBadgeClasses,notificationPresentation}.astro` / `.ts`
- `apps/qc-task-manager/src/components/{StatusBadge,QcStatusBadge,NotificationCard}.astro`
- `apps/qc-task-manager/src/components/lab/LabDocumentStatusBadge.astro`
- `apps/qc-task-manager/src/pages/admin/templates/index.astro`
- `apps/qc-task-manager/scripts/test-status-semantics.mjs`
- `apps/qc-task-manager/{package.json,scripts/test-manifest.mjs}`
- `apps/qc-task-manager/docs/{STATUS-SEMANTICS,UI-DESIGN-SYSTEM,DESIGN-SYSTEM-MIGRATION}.md`

### الأرقام
- أدوار العرض: 8 مسميات قديمة/مختلطة → 7 أدوار semantic canonical.
- الاختبارات: 62 canonical suites كاملة بدون فشل.
- typecheck: 0 errors، 0 warnings، 26 hints قديمة.

### القرارات
- فصل raw domain enums عن presentation semantics؛ السبب الحفاظ على RBAC والـworkflow والـdatabase integrity مع توحيد المعنى البصري.
- إبقاء compatibility adapters مؤقتًا بدل حذف imports دفعة واحدة؛ السبب ترحيل آمن route-sized ومنع كسر الشاشات القديمة.

### التحقق
- `pnpm test` ✅ — 62/62 canonical suites.
- `pnpm typecheck` ✅ — 0 أخطاء، 0 تحذيرات، 26 hints قائمة.
- `NODE_ENV=production pnpm build` ✅ — Complete؛ تحذيرات Vite الديناميكية المعروفة فقط.
- `pnpm test:status-semantics` ✅؛ `test:ui-consistency` ✅؛ `test:badge-contrast` ✅؛ `test:manifest` ✅.
- اختبارات `test:lab-tests` و`test:lab-documents` و`test:lab-calibration` ✅ — calibration 97/0.
- `git diff --check` ✅؛ لم يحدث commit أو push.

### النتيجة
- **الحالة:** نجح
- **مختصر:** صار عند التطبيق عقد semantic موحّد للحالات مع adapters واضحة وحراسة regression، بدون تعديل قواعد العمل أو الصلاحيات أو بيانات SQLite.

### ملاحظات / مشاكل مفتوحة
- ما زالت بعض الشاشات الطرفية تستخدم raw status markup أو خرائط محلية خارج wrappers؛ ترحيلها هو المرحلة التالية حسب المخاطر.
- الفحص اليدوي الكامل لقارئ الشاشة والـprint/ألوان الوضع الداكن يحتاج UAT مستقل؛ الاختبارات المصدرية والتباين الآلي نجحت.

## [2026-08-28] — QC-DESIGN-SYSTEM-FOUNDATION-001: تأسيس طبقة التوكنز والعقود المشتركة

### تم التنفيذ
- أضفت semantic design tokens للألوان في `global.css` وربطتها بـ Tailwind aliases للـsurface/content/accent/focus وحالات success/warning/danger/info.
- أضفت vocabulary مقيّدًا للـspacing (`qc-*`)، radius، motion، وأدوار typography المسماة، مع عقد `qc-focus` موحّد.
- حدّثت `AppButton` و`Banner` و`PageHeader` و`Pagination` و`StatusPill` و`formPresets` لاستهلاك التوكنز semantic بدل قيم المظهر المباشرة، مع الحفاظ على اللغة والشكل الحاليين.
- أبقيت adapters القديمة مثل `LabActionButton` وstatus badges متوافقة، ووثقت ownership/deprecation وخطة ترحيل تدريجية بدون حذف أو rewrite واسع.
- أضفت حارسًا داخل `test-ui-consistency` يثبت وجود semantic tokens في الـprimitives ويمنع رجوع `focus:ring-*` داخلها.

### الملفات المتأثرة
- `apps/qc-task-manager/tailwind.config.mjs`
- `apps/qc-task-manager/src/styles/global.css`
- `apps/qc-task-manager/src/components/ui/{AppButton,Banner,ContextualHelp,PageHeader,Pagination,StatusPill,formPresets,statusTones}`
- `apps/qc-task-manager/src/layouts/BaseLayout.astro`
- `apps/qc-task-manager/docs/{UI-DESIGN-SYSTEM,DESIGN-SYSTEM-MIGRATION}.md`
- `apps/qc-task-manager/scripts/test-ui-consistency.mjs`

### التحقق
- `pnpm --filter @brightai/qc-task-manager typecheck` ✅ — 0 أخطاء و0 تحذيرات، 26 hints قديمة.
- `test:ui-consistency` ✅ — 177/177.
- `test:badge-contrast` ✅ — كل أزواج WCAG AA ناجحة.
- `test:architecture` ✅ — 114 route، وarchitecture guard ناجح.
- `test:responsive-e2e-contract` ✅؛ `test:lab-ux-presentation` ✅ — 14؛ `test:lab-ux-performance` ✅ — 7.
- `pnpm --filter @brightai/qc-task-manager test` ✅ — 61 canonical suites بدون فشل.
- `NODE_ENV=production pnpm --filter @brightai/qc-task-manager build` ✅ — Complete؛ تحذيرات Vite الديناميكية المعروفة فقط.
- `git diff --check` ✅؛ ما صار commit أو push.

### النتيجة
- **الحالة:** نجح
- **مختصر:** صار عند التطبيق أساس semantic موحّد وعقود واضحة للـprimitives عالية الاستخدام، مع ترحيل آمن تدريجي للشاشات بدل تغيير قواعد المجال أو البنية.

### ملاحظات / مشاكل مفتوحة
- بقيت الشاشات الطرفية التي تستخدم raw Tailwind classes خارج نطاق الترحيل الأول؛ ترحيلها يكون route-sized حسب الخطة والاختبارات.
- الفحص اليدوي الفعلي على 360/1440 وقارئ الشاشة يحتاج UAT مستقل؛ اختبارات responsive العقدية نجحت.

## [2026-08-28] — QC-DB-HYGIENE-025: تغطية ملفات SQLite المتتبعة في تطبيق QC

### تم التنفيذ
- وسّعت `.gitignore` الخاص بتطبيق `apps/qc-task-manager` ليغطي `*.db` و`*.db-wal` و`*.db-shm` بأي عمق.
- أضفت نمط `db/e2e_*.db*` لحماية قواعد الاختبارات وملفاتها الجانبية، مع بقاء `db/schema.sql` غير متأثر لأنه SQL.
- وسّعت `verify-security-hygiene.mjs` ليفشل صراحةً عند تتبع أي `.db` أو `.db-wal` أو `.db-shm` تحت تطبيق QC بأي عمق.
- لم أحذف أي قاعدة محلية غير متتبعة؛ قواعد `db/qc_tasks.db` و`db/e2e_*.db*` بقيت على القرص ومهملة من Git.

### الملفات المتأثرة
- `apps/qc-task-manager/.gitignore`
- `apps/qc-task-manager/scripts/verify-security-hygiene.mjs`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `node apps/qc-task-manager/scripts/verify-security-hygiene.mjs` ✅ — Security hygiene passed.
- `git check-ignore -v` ✅ — الجذر، WAL، SHM، و`db/e2e_*.db*` طابقت الأنماط الجديدة.
- `pnpm test` ✅ — 60 canonical suites، بدون فشل، exit 0.
- `git status --short` ✅ — لا يظهر `.db` غير مقصود؛ ملفات DB المحلية مهملة.
- `git diff --check` ✅.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** حماية التجاهل وحارس hygiene مكتملان والاختبارات خضراء. الحذفان المرحّلان المذكوران في سياق المهمة غير موجودين حاليًا في الـ index أو HEAD، لذلك لم أعد staging أو حذفًا من عندي.

### ملاحظات / مشاكل مفتوحة
- لا توجد staged deletions حاليًا عند التحقق عبر `git diff --cached`؛ يلزم مراجعة جلسة/حالة Git السابقة إذا كان المطلوب استعادتهما كحذفين مرحّلين.
## [2026-09-02] — QC-100-VERIFICATION-005: جرد أدلة التحقق الآلي وعقود CI

### تم التنفيذ
- أنشأت دليل أدلة محليًا باسم `AUTOMATED-VERIFICATION-100-EVIDENCE.md` يفصل بين PASS المنفذ، الفشل الصريح، والفحوص المتجاوزة بطلب المستخدم؛ ولا يدّعي RUM/CWV إنتاجية قبل PROMPT 14.
- تحققت من manifest: **69** suite كنسية و**28** E2E، مع 4 ملفات test و4 ملفات E2E مصنفة صراحةً؛ الحارس يمنع أي `test-*` أو `e2e-*` يتيم أو registry/drift صامت.
- تحققت من route/architecture (**115** file routes، **25** middleware routes، **6** guards)، وschema reference (**165** objects)، وembedded parity (**39/39** migrations)، وبدأت السلسلة الكنسية حتى اجتياز domain/RBAC/audit الظاهر في التشغيل.
- صححت تشخيص PDF العربي: كان يتوقع equipment code في عمود Report ID ويعطل بـ`TypeError` عند خلية غير مفكوكة؛ صار يفحص الحضور أولًا ويكشف الفشل الفعلي بدل الانهيار.
- راجعت عقد `qc-release-gate.yml`: install frozen + typecheck + manifest/routes/parity + migrations SQLite معزولة + canonical test + production build + E2E على push/nightly/manual، بدون تعديل workflow أو نشر.

### الملفات المتأثرة
- `apps/qc-task-manager/AUTOMATED-VERIFICATION-100-EVIDENCE.md`
- `apps/qc-task-manager/scripts/test-report-pdf-arabic.mjs`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm --dir apps/qc-task-manager test:manifest` ✅ — 69/28 وبدون orphan.
- `test:architecture` ✅ — 115/25/6 وArchitecture Guard.
- `test:migrations` ✅، `test:embedded-migration-parity` ✅ 39/39، `test:schema-reference` ✅ 165.
- `test:domain` ✅ — 343/0؛ `test:auth-password-lifecycle` ✅ 23/23؛ `test:user-audit` ✅ 21/21؛ `test:audit-integrity` ✅.
- `test-report-pdf-arabic` ❌ — لم يعد crash، لكن بقيت فحوص RTL/marks/pagination فاشلة صراحة.
- `pnpm test` و`pnpm e2e:acceptance` ⏭️ — المتبقي المتزامن الثقيل تجاوز بطلب المستخدم الصريح.

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** الجرد وعقد عدم وجود orphan موثقان، ومشكلة PDF صارت failure قابلًا للتشخيص لا crash؛ لا يوجد ادعاء قبول نهائي أو صفر budget failures لأن E2E والسلسلة الكاملة وبناء ميزانيات p95 لم تكتمل بعد تجاوز وقت التشغيل.

### ملاحظات / مشاكل مفتوحة
- `test-report-pdf-arabic.mjs` ما زال manual diagnostic مصنفًا ويفشل في RTL wrapping/mark/pagination؛ يلزم إصلاحه ثم تقرير هل يصبح canonical.
- `test:performance` يجمع p50/p95/max وplans للـ11 scenario، لكنه لا يفرض رقم budget بعد؛ يلزم baseline وthresholds قبل ادعاء صفر local performance failures.
- توجد تغييرات وحذوفات غير مرتبطة مسبقًا في الشجرة؛ بقيت بدون لمس. لا commit ولا push ولا deploy.
## [2026-09-02] — QC-100-DESIGN-SYSTEM-006: تثبيت نظام تصميم QC الكنسي وحراسته

### تم التنفيذ
- وسّعت طبقة التوكنز إلى v2: typography، spacing، radius، borders، elevation/shadows، surfaces/overlay/glass، icon/container/breakpoint، motion/focus، chart، وحالات semantic كاملة.
- أنشأت primitives موحّدة للتحكمات والنماذج (`Input`/`Textarea`/`Select`/`Checkbox`/`Radio`/`Switch`/Date/Search/FormField) والإجراءات والعرض (`IconButton`/`Card`/`Skeleton`/`Toast`/`SectionHeader`) فوق وصفة CSS واحدة.
- رحّلت `WorkflowContext` وContextualHelp وattention/status/lab badge maps من ألوان Tailwind الخام إلى الأدوار الدلالية، بدون تغيير RBAC أو workflow أو URLs.
- وثّقت catalogue لكل المكونات المطلوبة وعقد dialogs/drawers/dropdowns/tables/charts، وحدود ترحيل legacy بوضوح بدل ادعاء 100% غير مثبت.
- أضفت `test:design-system-100` وربطته بالـmanifest: يفحص 29 token family، 21 primitive، ويمنع raw palette و`transition-all` داخل طبقة `src/components/ui/`.
- أنشأت `apps/qc-task-manager/DESIGN-SYSTEM-100-EVIDENCE.md` بجرد فعلي وحدود الادعاء وخطوات الحراسة.

### الملفات المتأثرة
- `apps/qc-task-manager/src/styles/global.css` و`tailwind.config.mjs`
- `apps/qc-task-manager/src/components/ui/` (primitives + contracts)
- `apps/qc-task-manager/{docs/UI-DESIGN-SYSTEM.md,DESIGN-SYSTEM-100-EVIDENCE.md}`
- `apps/qc-task-manager/{scripts/test-design-system-100.mjs,scripts/test-manifest.mjs,package.json}`

### الأرقام
- primitive catalog: **8 سابقًا → 21** عناصر كنسية محروسة.
- canonical test suites: **69 → 70**؛ E2E بقيت **28**.
- legacy raw-palette queue: **98 ملفًا**؛ موثقة كترحيل لاحق ولا تُحسب كالتزام semantic كامل.

### التحقق
- `pnpm test:design-system-100` ✅ — 29 token checks / 21 primitives / 27 canonical files.
- `pnpm test:ui-consistency` ✅ — 212/212؛ `pnpm test:status-semantics` ✅؛ `pnpm test:manifest` ✅ — 70/28.
- `pnpm typecheck` ✅ — 0 errors / 0 warnings / 0 hints.
- `NODE_ENV=production pnpm build` ✅؛ `git diff --check` ✅.

### النتيجة
- **الحالة:** نجح محليًا آليًا.
- **مختصر:** الطبقة الكنسية والحراسة مكتملتان من دون تعديل سلوك المنتج؛ ترحيل الـ98 ملف legacy يحتاج batches حسب المسار مع تحقق متصفح، ولا يوجد ادعاء 100% route-level قبل ذلك.

### ملاحظات / مشاكل مفتوحة
- لا commit ولا push ولا deploy.
- `01-mind-latest.md` متجاوز حد الحجم الإرشادي التاريخي؛ الأرشفة إلى القسم 2 قرار منفصل ولم تُنفّذ ضمن هذه المهمة كي لا تخلط أرشفة واسعة مع تغيير تصميمي.
## [2026-09-02] — QC-100-UI-VISUAL-007: ترقية الأسطح والهرمية البصرية لكل مسارات QC

### تم التنفيذ
- أضفت `qc-page-content` إلى `BaseLayout` مع حاوية موحدة بعرض `max-w-7xl` وهوامش متجاوبة، فصار الإيقاع الرأسي والأفقي مشتركًا لكل الصفحات القياسية بدون تغيير الخلفية أو الـslot.
- أضفت وصفات semantic جديدة في `global.css`: `qc-page-stack` و`qc-surface-panel` و`qc-table-panel` و`type-metadata`، مع تنسيق موحّد لرؤوس الجداول وخلاياها وحالات hover.
- رحّلت جداول البحث والاختبارات والمستندات إلى `qc-table-panel` مع إبقاء query filters وpagination والروابط وحالات StatusPill كما هي.
- رحّلت `/login` و`/404` إلى أسطح وPage title وFormField وBanner وAppButton الكنسية، ووسّعت `Input` لدعم autocomplete بدون تغيير مسار المصادقة.
- حسّنت `WorkflowContext` بإزالة `opacity-70` منخفض التباين واستبداله بدور `type-metadata` المقروء.
- أنشأت مواصفة وخطة تنفيذ ودليل `UI-VISUAL-100-EVIDENCE.md`؛ حارس `test:ui-visual-100` يجرد **76** صفحة Astro (منها **5** طباعة وredirect واحد) ويثبت تصنيفها.

### الملفات المتأثرة
- `apps/qc-task-manager/src/layouts/BaseLayout.astro`
- `apps/qc-task-manager/src/styles/global.css`
- `apps/qc-task-manager/src/components/ui/{Input,WorkflowContext}.astro`
- `apps/qc-task-manager/src/pages/{login,404,search}.astro`
- `apps/qc-task-manager/src/pages/lab/{tests,index,documents/index}.astro`
- `apps/qc-task-manager/scripts/{test-ui-visual-100,test-manifest}.mjs`
- `apps/qc-task-manager/{UI-VISUAL-100-EVIDENCE.md,docs/superpowers/specs/2026-09-02-qc-ui-visual-007-design.md,docs/superpowers/plans/2026-09-02-qc-ui-visual-007.md,package.json}`

### التحقق
- `pnpm test:ui-visual-100` ✅ — 171/171 فحصًا، 76 صفحة Astro.
- `pnpm test:ui-consistency` ✅ — 212/212؛ `test:design-system-100` ✅؛ `test:interaction-feedback` ✅ 25/25؛ `test:responsive-e2e-contract` ✅؛ `test:manifest` ✅ 71/28.
- `pnpm typecheck` ✅ — 0 أخطاء / 0 تحذيرات / 0 hints.
- `NODE_ENV=production pnpm build` ✅ — Complete.
- `git diff --check` ✅.
- `pnpm e2e:acceptance` ⏭️ — أُلغي بناءً على طلب المستخدم بعد بدء أول ثلاث suites؛ لا يوجد ادعاء acceptance كامل.

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** طبقة العرض المشتركة والجداول والأسطح عالية الاستخدام تحسنت، والتغطية المصدرية كاملة. لقطات browser لكل المقاسات العشرة ومراجعة بشرية/قارئ شاشة ما زالت غير منفذة، وacceptance الكامل أُلغي بطلب المستخدم.

### ملاحظات / مشاكل مفتوحة
- `apps/qc-task-manager/DESIGN-SYSTEM-100-EVIDENCE.md` كان حذفًا سابقًا للمهمة وبقي بدون لمس، وكذلك تعديل `prompt10.md` ونسخة الدليل المنقولة تحت `audit/qc/`.
- لا commit ولا push ولا deploy.
## [2026-09-02] — QC-100-A11Y-011: تدقيق WCAG والـergonomics وبوابة الأدلة

### تم التنفيذ
- أضفت حارس `test:a11y-ergonomics-100` يجرد كل ملفات صفحات ومكونات QC (76 صفحة و59 مكونًا) ويتحقق من skip link، landmark الرئيسي، لغة الصفحة، علاقات dialog، إعلان الحالات، بدائل الرسوم، focus-visible، reduced-motion، وzoom-safe dialogs.
- أضفت الحارس إلى `package.json` و`test-manifest.mjs` حتى ما يصير orphan أو drift في سلسلة الاختبارات.
- أصلحت حواري طلب الحذف ومراجعة طلب الحذف: مزامنة الإغلاق الأصلي مع حالة React، Escape/cancel، وإضافة `aria-describedby`.
- أضفت `aria-describedby` لحواري دورة حياة المهمة، وربطت Toast بـ`role=status` و`aria-live`.
- قوّيت CSS العام بعقد focus-visible احتياطي، أهداف لمس على pointer coarse، وحاويات حوار قابلة للتمرير عند التكبير؛ بدون تغيير workflow أو RBAC أو URLs.
- أنشأت `A11Y-ERGONOMICS-100-EVIDENCE.md` بمصفوفة المقاسات 320–1920 و100/150/200/400%، رحلات الكيبورد، ومصفوفتي VoiceOver وNVDA فارغتين للتعبئة اليدوية.

### الملفات المتأثرة
- `apps/qc-task-manager/A11Y-ERGONOMICS-100-EVIDENCE.md`
- `apps/qc-task-manager/scripts/test-a11y-ergonomics-100.mjs`
- `apps/qc-task-manager/{package.json,scripts/test-manifest.mjs}`
- `apps/qc-task-manager/src/{styles/global.css,components/DeleteRequestDialog.tsx,components/ReviewDeleteRequestDialog.tsx,components/TaskLifecycle.tsx,components/ui/Toast.astro}`

### التحقق
- `pnpm --dir apps/qc-task-manager test:a11y-ergonomics-100` ✅ — 76 page sources / 59 component sources، automated contract 100%.
- `pnpm --dir apps/qc-task-manager test:manifest` ✅ — 74 canonical suites / 28 E2E.
- `pnpm --dir apps/qc-task-manager typecheck` ✅ — 0 errors / 0 warnings / 0 hints.
- `git diff --check` ✅؛ build وE2E الثقيلان ⏭️ بتوجيه المستخدم.
- VoiceOver/NVDA والفحص اليدوي 320–1920 والـzoom ⏭️ — لم تُنفذ، ولا يوجد ادعاء manual AT.

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** عقد الوصول الآلي الجديد والإصلاحات عالية الأثر ناجحة محليًا، لكن اعتماد WCAG الكامل متوقف على build/E2E اليدوي واستمارات VoiceOver/NVDA الموقعة.

### ملاحظات / مشاكل مفتوحة
- full accessibility score غير مُدّعى؛ يلزم تسجيل manual assistive-technology evidence قبل إعلان 100% الكامل.
- لا commit ولا push ولا deploy.
## [2026-09-02] — QC-REMEDIATION-003: Security / IAM / Secrets / Adversarial Hardening

### تم التنفيذ
- ثبّتُّ فحصًا وقت تشغيل الخادم يرفض `SESSION_SECRET` و`JWT_SECRET` إذا كانت قيمتهما fallback تطويرية مع منع تسريب قيمة السر في الخطأ.
- منعت تشغيل `QC_SEED_MUST_CHANGE_PASSWORD=0` في production، ومنعت seed الإنتاج باستخدام `admin123`؛ بقي إجبار تغيير كلمة المرور للحسابات المزروعة عند أول دخول.
- شددت تحقق الرفع: SVG مرفوض صراحةً، وmarkers المحتوى النشط/polyglot والتنفيذية تُرفض قبل تخزين BLOB، مع بقاء فحص MIME والـmagic bytes.
- أضفت سويت adversarial تثبت bcrypt `$2a$/$2b$` cost 10، رفض SVG وpolyglot وعدم إنشاء attachment، رفض Employee لنسخ admin الاحتياطي بـ403، إلغاء session عند logout، وحواجز production السلبية.
- أضفت `PROMPT-03-EVIDENCE.md` بمصفوفة قبول صريحة وحدود الأدلة المحلية مقابل اختبارات المتصفح وبيئة production.

### الملفات المتأثرة
- `apps/qc-task-manager/src/lib/security-config.ts`
- `apps/qc-task-manager/src/lib/db.ts`
- `apps/qc-task-manager/src/lib/seed.ts`
- `apps/qc-task-manager/src/lib/taskUpdates/shared.ts`
- `apps/qc-task-manager/scripts/test-security-adversarial.mjs`
- `apps/qc-task-manager/package.json`
- `apps/qc-task-manager/scripts/test-manifest.mjs`
- `apps/qc-task-manager/SECURITY.md`
- `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-03-EVIDENCE.md`

### التحقق
- `pnpm run test:security-adversarial` ✅ — 9/9.
- `pnpm run test:security-hygiene` ✅؛ `pnpm run test:security-rbac-privacy-100` ✅؛ `pnpm run test:architecture` ✅.
- `pnpm run test:auth-password-lifecycle` ✅ — 23/23؛ `pnpm run test:request-security` ✅ — 56/56.
- `pnpm run test:manifest` ✅ — 77 canonical suites و28 E2E.
- `pnpm run typecheck` ✅ — 0 errors / 0 warnings / 0 hints.
- `NODE_ENV=production pnpm run build` ✅.

### النتيجة
- **الحالة:** جزئي / CONDITIONAL GO محليًا.
- **مختصر:** ضوابط الأمان المحلية والحواجز العدائية خضراء، لكن full browser E2E للـlogin/session-expiry/re-authentication وتدوير الأسرار فعليًا عند مزود production ما زالت أدلة خارجية معلقة.

### ملاحظات / مشاكل مفتوحة
- لم تُعد تشغيل سلسلة 76 unit / 30 E2E كاملة بعد هذا التغيير الأمني؛ baseline الأخير قبل PROMPT-03 كان أخضر.
- لا commit ولا push ولا deploy.
## [2026-09-03] — QC-REMEDIATION-006: العقد canonical للنماذج وحماية المسودات

### تم التنفيذ
- استبدلت helper النماذج الجزئي في `apps/qc-task-manager/public/scripts/form-productivity.js` بكنترولر canonical واحد يكتشف كل نماذج التطبيق، ويتابع dirty state ويحفظ المسودات بعد 500ms ويستعيدها.
- عزلت مفاتيح `localStorage` حسب `userId` والمسار والفعل، ومنعت حفظ password/passcode/PIN/secret/token/signature/file، وأضافت تنظيف مسودات المستخدم عند logout.
- أضفت `beforeunload`، تركيز أول حقل غير صالح، `aria-invalid` و`aria-describedby` للأخطاء، وقفل الإرسال الفوري مع `aria-busy` وspinner ونسخة `جاري الحفظ...`.
- أضفت `data-qc-user-id` من `BaseLayout` ووسمت `LabTestForm` كـ canonical consumer، مع إبقاء Zod في الخادم مصدر التحقق النهائي.
- أضفت `test:forms-advanced-100` واختبار Playwright سلوكي يغطي الاستعادة، التحذير، الوصول، القفل، logout، وجرد 51 ملف نموذج.

### الملفات المتأثرة
- `apps/qc-task-manager/public/scripts/form-productivity.js`
- `apps/qc-task-manager/src/layouts/BaseLayout.astro`
- `apps/qc-task-manager/src/components/lab/LabTestForm.tsx`
- `apps/qc-task-manager/src/styles/global.css`
- `apps/qc-task-manager/scripts/test-forms-advanced-100.mjs`
- `apps/qc-task-manager/scripts/test-manifest.mjs`
- `apps/qc-task-manager/package.json`
- `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-06-EVIDENCE.md`

### التحقق
- `pnpm run test:forms-advanced-100` ✅ — 9/9.
- `pnpm run test:form-productivity` ✅ — 20/20.
- `pnpm run test:manifest` ✅ — 84 canonical unit suites و28 E2E suites.
- `pnpm typecheck` ✅ — 311 ملفات، 0 أخطاء/تحذيرات/hints.
- `pnpm build` ✅.
- `pnpm test` ✅ — كل السويتات المسجلة اكتملت بـ0 assertions فاشلة.
- `pnpm e2e:acceptance` ✅ — 28 سويت E2E + مرحلتا restart persistence.

### النتيجة
- **الحالة:** نجح (PASS — 6/6).
- **مختصر:** صار فيه عقد موحد يحمي إدخال المستخدم والمسودات لكل 51 ملف نموذج، مع تغطية متصفح وفحوص regression كاملة، بدون commit أو push.

### ملاحظات / مشاكل مفتوحة
- `git diff --check` العام ما زال يبلّغ عن trailing whitespace قديم في `audit/website-builder-SEO/SEO-GEO-KEYWORD-COMPETITOR-RESEARCH-2026-09-03.md` خارج نطاق المهمة؛ diff ملفات المهمة سليم.
- لا توجد مشكلة مفتوحة ضمن نطاق PROMPT-06.
## [2026-09-03] — استخراج Errors من Semrush Site Audit للحملة k

### تم التنفيذ
- استدعيت Semrush Site Audit للحملة `31075135` باسم `k`، وآخر snapshot هو `6a98bf36b9c43339eff578c1`، بعد فحص **313 صفحة من أصل 500**.
- تأكدت أن رقم Errors **113** يتطابق حسابيًا مع: robots.txt = **1**، hreflang conflicts = **35**، structured data markup errors = **77**.
- حددت خطأ robots في `https://brightai.live/robots.txt`، وSemrush أشار تحديدًا إلى السطر غير القياسي `Content-Signal: search=yes, ai-input=yes, ai-train=yes`.
- حددت 35 صفحة hreflang: **34** ضمن `/kernel/*` وواحدة `/404/`؛ بيانات Semrush تعرض `errorType=7` وحقل `hreflang` فارغ، لذلك لم أفترض سببًا غير مثبت.
- حللت 77 خطأ structured data حسب المكان: **53** في `/kernel/*`، **18** في `/blog/*`، **5** في صفحات المدن تحت `/solutions/*`، وواحد في الرئيسية.
- كشفت أسبابًا مؤكدة من `page_info`: الرئيسية تحمل `SOFTWARE_APP` بدون `aggregateRating` و`review`؛ صفحة مكة تحمل `LOCAL_BUSINESS` بدون `address`؛ وصفحات Kernel تكرر مشكلة SoftwareApplication؛ أما صفحات المدن الأخرى فتحتاج مراجعة عقد JSON-LD النهائي قبل أي تعديل.
- لم أعدل كودًا أو أضف بيانات تقييم مختلقة؛ لأن حل aggregateRating/review الصحيح يتطلب مصدر مراجعات حقيقي أو إزالة/تغيير نوع schema المتأثر.

### الملفات المتأثرة
- `.agents/mind/01-mind-latest.md`

### التحقق
- Semrush `snapshots` ✅ — snapshot محدد.
- Semrush `info` ✅ — 113 errors، 929 warnings، 403 notices، quality 84، و313 صفحة.
- Semrush `snapshot` ✅ — توزيع الأخطاء 1 + 35 + 77 = 113.
- Semrush `meta_issues` + `issue_details` + `page_info` ✅ — الروابط والأماكن والأسباب/الحقول المتاحة.
- build/tests: لم تُشغّل — تشخيص خارجي فقط، بدون تعديل كود الموقع.

### النتيجة
- **الحالة:** نجح التشخيص.
- **مختصر:** صار عند المشروع تفصيل كامل لرقم 113 Error مع مصدر كل مجموعة وروابط الصفحات المتأثرة وسبب Semrush المباشر، مع فصل الأخطاء الحقيقية عن صفحات Kernel/query والبيانات المنظمة غير المكتملة.

### ملاحظات / مشاكل مفتوحة
- لا commit ولا push ولا deploy.
- لا يُضاف `aggregateRating` أو `review` بأرقام افتراضية؛ يلزم مصدر تقييم منشور أو قرار schema بديل.
## [2026-09-03] — QC-REMEDIATION-009: الوصولية، تنقل الكيبورد، والدلالات الداعمة

### تم التنفيذ
- غيّرت `BaseLayout` إلى skip link عربي يوجّه إلى `#main-content`، وأضفت footer وstable polite live region مع بقاء Navbar كـheader/nav مشترك.
- ثبّتُّ focus ring عالميًا بـ`*:focus-visible` باستخدام `--color-primary-500`، مع إبقاء reduced-motion وحواجز التكبير السابقة.
- أضفت `role="dialog"` و`aria-modal="true"` للحورات الأصلية، وأضفت focus trap للـreview dialog في `LabTestForm` مع Escape واستعادة focus الموجودة في الحوارات.
- أضفت `aria-atomic="true"` لمناطق الحالة الديناميكية، وإعلانًا ثابتًا لعدد إشعارات Navbar، ووسمت غلاف chart table باسم دلالي.
- أنشأت حارسي `test:keyboard-ux-100` و`test:screen-reader-semantic-100` وسجلتهما في manifest، وحدّثت اختبار axe/keyboard الموجود لاسم main الجديد.

### الملفات المتأثرة
- `apps/qc-task-manager/src/layouts/BaseLayout.astro`
- `apps/qc-task-manager/src/styles/global.css`
- `apps/qc-task-manager/src/components/{DeleteRequestDialog,ReviewDeleteRequestDialog,EsignDialog,Navbar}.tsx` / `.astro`
- `apps/qc-task-manager/src/components/lab/LabTestForm.tsx` ومناطق الحالة الديناميكية
- `apps/qc-task-manager/scripts/{test-a11y-ergonomics-100,test-keyboard-ux-100,test-screen-reader-semantic-100,e2e-a11y}.mjs`
- `apps/qc-task-manager/{package.json,scripts/test-manifest.mjs}`
- `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-09-EVIDENCE.md`

### التحقق
- `test:a11y-ergonomics-100` ✅ — 76 صفحة / 60 مكوّنًا.
- `test:keyboard-ux-100` ✅ — 138 مصدرًا؛ `test:screen-reader-semantic-100` ✅ — 138 مصدرًا.
- `test:badge-contrast` ✅ — 13/13؛ `test:manifest` ✅ — 87/28.
- `typecheck` ✅ — 0 أخطاء، 0 تحذيرات، 2 hints قائمة؛ `NODE_ENV=production build` ✅؛ `git diff --check` ✅.
- full Playwright/axe لكل 115 route وVoiceOver/NVDA ⏭️ — لم تُشغّل في هذه المهمة، ومذكورة كحدود في evidence.

### النتيجة
- **الحالة:** جزئي (PARTIAL).
- **مختصر:** كل حواجز الوصول القابلة للإثبات من المصدر والحراس الآليين عولجت ونجحت، لكن اعتماد WCAG الكامل ما زال يحتاج تشغيل browser axe على كل المسارات وجلسات AT بشرية.

### ملاحظات / مشاكل مفتوحة
- `Layout.astro` و`Header.astro` غير موجودين في الشجرة الحالية؛ البدائل الفعلية هما `BaseLayout.astro` و`Navbar.tsx`.
- لا commit ولا push ولا deploy.
## [2026-09-03] — تنفيذ حزمة SEO/Semrush وتسليم تقرير صريح بالحدود

### تم التنفيذ
- تحققت من أدوات Semrush المتاحة، المشاريع، snapshot `6a98bf36b9c43339eff578c1` للحملة `31075135`، وبيانات domain/backlinks لقاعدة السعودية.
- خزّنت raw responses لكل issue مفحوص في `seo/raw/`، مع جرد الأدوات ووسم رصيد الوحدات وrecrawl كـ`not available` لعدم وجود endpoint.
- أنشأت baseline JSON/Markdown يجمع 113 Error و929 Warning و403 Notice من 313 صفحة، مجمعة حسب root cause مع روابط raw لكل issue.
- أنشأت خريطة كلمات عربية للصفحات الأساسية، وصفحات جديدة مقترحة، وplaybook متابعة؛ القيم غير المقاسة بقيت `not available` ولم تُحوّل إلى أصفار.
- أنشأت تقريري Lighthouse mobile/desktop كحالة `not run` لأن CLI غير مثبت، بدون ادعاء درجات.

### الملفات المتأثرة
- `seo/audit/baseline.json`
- `seo/audit/baseline.md`
- `seo/keyword-map.csv`
- `seo/new-pages.md`
- `seo/monitor.md`
- `seo/report.md`
- `seo/lighthouse/{mobile,desktop}.json`
- `seo/raw/`
- `.gitignore`

### التحقق
- Semrush capability/project/site-audit/domain/backlinks pulls ✅ — FACTs محفوظة في `seo/raw/`.
- issue detail pulls ✅ — 16 issue types محفوظة لكل snapshot.
- `git diff --check` ⏭️ — fsmonitor IPC error في البيئة كما هو مسجل سابقًا.
- Lighthouse ⏭️ — CLI غير مثبت، لذلك لا توجد أرقام أداء مختلقة.
- `pnpm build` ✅ — Complete 29.66s; ظهرت تحذيرات Astro route collisions قديمة وVite export معروفة.

### النتيجة
- **الحالة:** جزئي / CONDITIONAL.
- **مختصر:** اكتملت حزمة الأدلة والملفات المطلوبة بالحقائق المتاحة، لكن شروط 0/0/0 وLighthouse 100 وإثبات كل الصفحات تحتاج نشرًا وإعادة crawl وأداة Lighthouse قابلة للتشغيل.

### ملاحظات / مشاكل مفتوحة
- لا commit ولا push ولا deploy؛ المستخدم يقرر النشر وإعادة الزحف.
## [2026-09-03] — تنفيذ حزمة SEO/Semrush وتسليم تقرير صريح بالحدود

### تم التنفيذ
- تحققت من أدوات Semrush المتاحة، المشاريع، snapshot `6a98bf36b9c43339eff578c1` للحملة `31075135`، وبيانات domain/backlinks لقاعدة السعودية.
- خزّنت raw responses لكل issue مفحوص في `seo/raw/`، مع جرد الأدوات ووسم رصيد الوحدات وrecrawl كـ`not available` لعدم وجود endpoint.
- أنشأت baseline JSON/Markdown يجمع 113 Error و929 Warning و403 Notice من 313 صفحة، مجمعة حسب root cause مع روابط raw لكل issue.
- أنشأت خريطة كلمات عربية للصفحات الأساسية، وصفحات جديدة مقترحة، وplaybook متابعة؛ القيم غير المقاسة بقيت `not available` ولم تُحوّل إلى أصفار.
- أنشأت تقريري Lighthouse mobile/desktop كحالة `not run` لأن CLI غير مثبت، بدون ادعاء درجات.

### الملفات المتأثرة
- `seo/audit/baseline.json`
- `seo/audit/baseline.md`
- `seo/keyword-map.csv`
- `seo/new-pages.md`
- `seo/monitor.md`
- `seo/report.md`
- `seo/lighthouse/{mobile,desktop}.json`
- `seo/raw/`
- `.gitignore`

### التحقق
- Semrush capability/project/site-audit/domain/backlinks pulls ✅ — FACTs محفوظة في `seo/raw/`.
- issue detail pulls ✅ — 16 issue types محفوظة لكل snapshot.
- `git diff --check` ⏭️ — fsmonitor IPC error في البيئة كما هو مسجل سابقًا.
- Lighthouse ⏭️ — CLI غير مثبت، لذلك لا توجد أرقام أداء مختلقة.
- build/tests ⏭️ — لم تُشغّل؛ المهمة مخرجات تدقيق وتوثيق، وإصلاحات كود SEO كانت موجودة مسبقًا في الشجرة.

### النتيجة
- **الحالة:** جزئي / CONDITIONAL.
- **مختصر:** اكتملت حزمة الأدلة والملفات المطلوبة بالحقائق المتاحة، لكن شروط 0/0/0 وLighthouse 100 وإثبات كل الصفحات تحتاج نشرًا وإعادة crawl وأداة Lighthouse قابلة للتشغيل.

### ملاحظات / مشاكل مفتوحة
- لا commit ولا push ولا deploy؛ المستخدم يقرر النشر وإعادة الزحف.
## [2026-09-03] — تقوية صفحة AI Firewall التجارية لأمن LLM

### تم التنفيذ
- رفعت عنوان الصفحة ووصفها لاستهداف AI Firewall لأمن LLM ومنع تسريب البيانات، مع إبقاء النية التجارية واضحة بدون تكرار كلمة Saudi Arabia.
- أضفت FAQPage JSON-LD من نفس مصفوفة الأسئلة المرئية؛ صار عند الصفحة 7 أسئلة متزامنة بعد إصلاح فجوة كانت تظهر في تدقيق schema.
- ضبطت الإجابة الأولى بصيغة answer-first لسؤال «وش هو AI Firewall؟» ووضحت أنه طبقة تحكم للطلبات المهيأة قبل النموذج.
- حدّدت الكاشفات حسب التنفيذ الفعلي في `@brightai/firewall-detectors`، ووضحت أن فحص الردود وتقييم خطورة الوجهات/الموديلات يعتمد على التكامل والسياسة ولا يُفترض تلقائياً.
- أبقيت المقارنة مع traditional firewall وDLP، وفلو Input → inspection → decision → output/evidence، وبطاقات REDACT/BLOCK/FLAG/LOG والـCTA عالي النية.

### الملفات المتأثرة
- `src/data/solutions.ts`
- `src/pages/solutions/[slug].astro`

### التحقق
- `node --test scripts/ai-firewall-commercial-page.test.mjs` ✅ — 2/2
- `pnpm build` ✅ — Complete؛ تحذيرات route collision legacy فقط
- `pnpm seo:schema` ✅ — schema audit 64 صفحة وspeakable 267 صفحة
- `pnpm seo:gate` ✅ — 0 أخطاء، 0 تحذيرات، 0 روابط مكسورة
- `pnpm test` ✅ — chat 16/16، CSRF 29/29، PII 38/38
- فحص بصري Chromium محلي ✅ — hero وFAQ وflow ظاهرة على عرض 715px؛ CSS responsive موجود لـ360 و1440، ولم تُنفذ جلسة Lighthouse أو AT كاملة
- `git diff --check` ✅ — لا أخطاء whitespace

### النتيجة
- **الحالة:** نجح
- **مختصر:** صفحة `/solutions/ai-firewall/` صارت صفحة تجارية أوضح وأقوى لأمن LLM، مع حدود تنفيذ صريحة وFAQ schema سليم، بدون ادعاء منع كامل أو امتثال مضمون.

### ملاحظات / مشاكل مفتوحة
- تحذيرات Astro route collision القديمة ما زالت موجودة خارج نطاق المهمة.
- لا commit ولا push ولا deploy.
## [2026-09-03] — إصلاح جذور تحذيرات وأخطاء Semrush Site Audit

### تم التنفيذ
- حللت أحدث snapshot لحملة Semrush `31075135` للموقع `brightai.live`: **94 Error، 929 Warning، 405 Notice، و314 صفحة مفحوصة**؛ وفصلت المشاكل القابلة للإصلاح عن صفحات الأدوات والـquery والصفحات الخدمية المقصودة.
- أزلت رابط GitHub غير الصحيح من `sameAs` والـfooter وملف schema الثابت، ومنعت ظهوره داخل JSON-LD الموروث لصفحات الحلول والقطاعات والمدن؛ وأزلت روابط GitHub edit التي كانت تنتج 404.
- أزلت `nofollow` من روابط واتساب الخارجية مع إبقاء `noopener noreferrer`، لتفادي تحذير الروابط الخارجية غير المتبوعة.
- صححت صفحات `/answer/*` الإنجليزية الخمس لتخرج `lang="en"` و`dir="ltr"` و`en-SA` ذاتية صحيحة، وطوّرت فحص hreflang ليتحقق أيضًا من صفحات الإنجليزية المستقلة بدون اختراع peer عربي.
- أضفت `scripts/minify-public-js.mjs` إلى build لتصغير JavaScript العام المنشور؛ build أكد تصغير **57 ملف JavaScript**.

### الملفات المتأثرة
- `src/pages/answer/[slug].astro`
- `src/pages/solutions/[slug].astro`
- `src/pages/solutions/[sector].astro`
- `src/pages/solutions/[sector]/[city].astro`
- `scripts/hreflang-bidirectional-audit.mjs`
- `scripts/minify-public-js.mjs`
- `src/data/site.ts` و`src/components/Footer.astro`
- `src/components/{Header,LeadForm,MobileNav,SplitHero,WhatsAppCTA}.astro`
- `src/pages/{about,contact,demo,design/buttons,en,index,pricing,services,sitemap,404}.astro`
- `src/data/{hub-content-inline,legal-content-inline}.ts`
- `public/{500.html,schema-saudi-seo.json}` و`package.json`

### التحقق
- `pnpm build` ✅ — اكتمل؛ sitemap **263 URL**، وAstro ولّد **280 HTML**، مع تحذيرات route collision قديمة فقط.
- `node scripts/hreflang-bidirectional-audit.mjs` ✅ — **0 أخطاء** في 264 مجموعة.
- `pnpm seo:schema` ✅ — Schema **64 صفحة** وSpeakable **267 صفحة** بدون فشل.
- `pnpm seo:gate` ✅ — **0 Errors، 0 Warnings، 0 روابط مكسورة**؛ 48,195 مرجعًا مفحوصًا.
- فحص artifact ✅ — لا GitHub URL غير صحيح ولا `nofollow` على روابط واتساب؛ `git diff --check` ✅.

### النتيجة
- **الحالة:** نجح محليًا / مشروط خارجيًا.
- **مختصر:** تم إصلاح جذور المشاكل القابلة للإثبات وإخراج deploy محلي نظيف. أرقام Semrush البعيدة ما تتغير إلا بعد نشر الناتج ثم إعادة crawl للحملة.

### ملاحظات / مشاكل مفتوحة
- HSTS يحتاج تحققًا من بيئة الاستضافة بعد النشر؛ الكود المحلي يضيف الهيدر لكن Semrush السابق كان يقرأ snapshot قديمًا.
- تحذيرات low text/HTML ratio وlow word count والروابط الداخلية للصفحات parameterized وبعض صفحات utility هي heuristics مقصودة؛ ما ضفت حشو أو محتوى مكرر لإخفائها.
- لا commit ولا push ولا deploy.
## [2026-09-04] — إصلاح جذور أخطاء وتحذيرات Semrush Site Audit

### تم التنفيذ
- أضفت `url` و`@id` الصحيحة لعُقد `Service` في صفحات الأسعار، وطبّعت عُقد `Service` الموروثة داخل صفحات الحلول على الرابط canonical الخاص بكل صفحة.
- أصلحت تسريب تعليقات HTML داخل عناوين صفحات الحلول القطاعية، بحيث ما عاد نص JSON-LD يظهر داخل `<title>`.
- وحّدت عناوين metadata الطويلة: حدّ أقصى 60 حرفًا، وفصلت عنوان docs عن H1، فصار ما فيه تكرار H1/title في HTML المبني.
- صححت `og:locale` للصفحات الإنجليزية إلى `en_US`، وأكملت `address` في بيانات `LocalBusiness` لصفحة 500.
- أبقيت تحسينات JavaScript المصغّر والـ hreflang والروابط الداخلية القائمة كما هي؛ ما أضفت محتوى أو روابط وهمية فقط لإرضاء مؤشرات Semrush.

### الملفات المتأثرة
- `src/data/schema-helpers.ts`
- `src/data/migratedSolutionPages.ts`
- `src/data/landing-pages.ts`
- `src/pages/pricing/index.astro`
- `src/pages/solutions/[slug].astro`
- `src/pages/solutions/[sector].astro`
- `src/pages/solutions/[sector]/[city].astro`
- `src/components/SEOHead.astro`
- `src/layouts/DocsLayout.astro`
- `src/content/docs/kernel-accessibility-mobile.md`
- `public/500.html`

### التحقق
- `pnpm build` ✅ — اكتمل، 263 رابط sitemap و57 ملف JavaScript مصغّر.
- `pnpm seo:schema` ✅ — تدقيق 64 صفحة، وSpeakable على 267 صفحة.
- `pnpm seo:hreflang` ✅ — 264 مجموعة، 0 أخطاء.
- `pnpm seo:gate` ✅ — 0 أخطاء، 0 تحذيرات، 0 روابط مكسورة ضمن 48,195 مرجعًا.
- `pnpm test` ✅ — 83 اختبارًا ناجحًا، 0 فشل.
- `pnpm typecheck` ✅ — 0 أخطاء و0 تحذيرات، مع تلميحين قائمين في qc-task-manager.
- فحص HTML المبني ✅ — 278 ملفًا، 0 عنوان أطول من 60، 0 تكرار H1/title، 0 Service بدون url، 0 LocalBusiness بدون address.

### النتيجة
- **الحالة:** جزئي خارجيًا / ناجح محليًا
- **مختصر:** جذور أخطاء schema وhreflang وعناوين metadata انحلت في المصدر والبناء المحلي. أرقام Semrush الخارجية تحتاج deployment ثم إعادة crawl حتى تتحدث فعليًا.

### ملاحظات / مشاكل مفتوحة
- صفحة Semrush الحالية لم تعرض بيانات الحملة، وملفات API التاريخية الموجودة للمشروع لا تحتوي URLs داخل `data`؛ لذلك ما يصح ادعاء تحديد أو تصفير 340 رابطًا خارجيًا أو 57 صفحة من دون crawl جديد.
- ما زالت تحذيرات route collision القديمة وتحذير Vite الخاص بـ `PiiTypeId` ظاهرة أثناء البناء، لكنها لم تمنع النجاح.
- HSTS للنطاقات الفرعية وفحص الروابط الخارجية الحية يحتاجان deployment وفحص Semrush/HTTP من خارج بيئة البناء.
- لا commit ولا push ولا deploy.
## [2026-09-04] — تشغيل منظومة Semrush SEO الكاملة ومطابقة live مع المصدر المحلي

### تم التنفيذ
- استخدمت اتصال Semrush الفعلي لحملة `31075135` والمشروع `k` على `brightai.live`، واستخرجت `snapshots`, `info`, `meta_issues`, `snapshot`, و`issue_details` لكل issue غير صفري.
- ثبّتُّ أحدث snapshot `6a99df64360b06655c4f0b0e`: **Quality 89، 312 صفحة، 95 Error، 924 Warning، 405 Notice**؛ وفصلت نتائج live القديمة عن الإصلاحات الموجودة محليًا.
- استخرجت الصفحات المتأثرة فعليًا: 35 hreflang، 60 structured-data markup، 340 external-link، 6 title طويل، 32 H1/title، 139 text/HTML، 15 word count، 392 JS/CSS unminified، 303 nofollow خارجي، 5 language mismatch، 2 HSTS، 27 one-link، صفحة semantic واحدة، و57 content optimization.
- شغّلت تقارير Semrush المتاحة خارج Site Audit: `domain_rank` للسعودية (1 keyword، traffic 0)، `resource_organic`، `backlinks_overview` (67 links / 30 referring domains / Authority score 2)، واكتشفت أن `domain_organic_organic` بلا بيانات وأن `position_tracking` غير مفعّل للحملة.
- أصلحت false positive في `scripts/seo-health-check.mjs`: صار يفرّق بين `Disallow: /` لزواحف تدريب AI وبين قواعد منع Google/search، مع إبقاء منع التدريب مقصودًا.

### الملفات المتأثرة
- `scripts/seo-health-check.mjs`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm seo:all` ✅ — لا مشاكل محلية ضمن الفحوصات المطلوبة، وcontent acceptance 4/4.
- `pnpm seo:schema` ✅ — 64 صفحة، وSpeakable 267 صفحة.
- `pnpm seo:hreflang` ✅ — 264 مجموعة، 0 أخطاء.
- `pnpm seo:gate` ✅ — 0 أخطاء، 0 تحذيرات، 0 روابط مكسورة ضمن 48,195 مرجعًا.
- Semrush Site Audit API ✅ — issue details مكتملة لكل الـ15 issue النشطة.

### النتيجة
- **الحالة:** ناجح محليًا / مشروط بالنشر
- **مختصر:** صارت نتائج Semrush مفهومة على مستوى الصفحة والسبب، والحارس المحلي صار متوافقًا مع سياسة AI crawler الحالية. معظم أرقام live ناتجة من deployment أقدم وتحتاج نشر ثم إعادة crawl.

### ملاحظات / مشاكل مفتوحة
- الـ60 structured-data و340 external links و303 nofollow و392 unminified التي ظهرت في Semrush مرتبطة بنسخة live القديمة؛ المصدر المحلي الحالي عالج الجذور القابلة للإثبات.
- `brightai.live` عنده organic visibility ضعيفة جدًا: كلمة واحدة بالمركز 62 وorganic traffic تقديري 0، و67 backlink من 30 domain مع Authority score 2؛ تحتاج خطة authority/content بعد توفر أدوات Semrush الأخرى.
- Semrush Position Tracking غير موجود في المشروع، و`domain_organic_organic` بلا بيانات؛ لا توجد بيانات ranking history يمكن اختلاقها.
- لا commit ولا push ولا deploy.
## [2026-09-04] — تحقق نهائي من خطأ Semrush Structured Data (issue 45)

### تم التنفيذ
- راجعت لقطة Semrush الأحدث المسجلة للحملة `31075135`: issue 45 ما زال يعرض **60** عنصر Structured Data في نسخة live؛ نتائج السحب التاريخية لا تحتوي صفوف الروابط (`data: []`)، لذلك لم أخمّن صفحات متأثرة.
- جرّبت المفتاح المرسل بصيغ `Apikey` و`Bearer` على Projects API الرسمي وPAT على MCP الرسمي؛ جميعها أعادت `401`، لذلك لم يُحفظ المفتاح ولم يُستخدم في أي ملف أو إعداد.
- بنيت الموقع محليًا ثم تحققت من مخرجات JSON-LD الفعلية: مزامنة FAQ وDocs نظيفة، تدقيق schema نجح على **64** صفحة، وSpeakable schema نجح على **267** صفحة.
- شغّلت بوابة SEO على **280** ملف HTML و**48,195** مرجعًا: 0 أخطاء، 0 تحذيرات، و0 روابط مكسورة؛ ما ظهر خلل schema محلي إضافي يستلزم تعديل المصدر.
- أعاد البناء توليد `sitemap.xml` و`public/sitemap.xml` لتحديث تواريخ `lastmod` للصفحات التي تعدّلت مصادرها في 4 سبتمبر.

### الملفات المتأثرة
- `sitemap.xml`
- `public/sitemap.xml`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm build` ✅ — اكتمل؛ مع تحذيرات route collision قائمة خارج نطاق المهمة.
- `pnpm schema:solutions:check` ✅
- `pnpm schema:docs:check` ✅
- `node scripts/seo-schema-audit.mjs` ✅ — 64 صفحة.
- `node scripts/check-speakable-schema.mjs` ✅ — 267 صفحة.
- `pnpm seo:gate` ✅ — 0 errors / 0 warnings / 0 broken links.

### النتيجة
- **الحالة:** ناجح محليًا / مشروط خارجيًا.
- **مختصر:** المصدر الحالي ومخرجاته لا تحتوي خطأ Structured Data قابلًا للإصلاح؛ تصفير عداد Semrush يتطلب نشر التغييرات المحلية ثم إعادة crawl، أو مفتاح Projects API صالح لاستخراج روابط اللقطة مباشرة.

### ملاحظات / مشاكل مفتوحة
- لا commit ولا push ولا deploy.
- لا تحفظ مفتاح Semrush المرسل في المستودع؛ يلزم مفتاح API من صفحة Semrush API Keys بصيغة مدعومة إذا احتجنا استخراج URLs من Projects API.
