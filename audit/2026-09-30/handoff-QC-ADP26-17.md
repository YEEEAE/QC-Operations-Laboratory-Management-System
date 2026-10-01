# QC-ADP26-17 — لوحة القرار والعمل تعرض تفاصيل التنفيذ

## Changed

- قدّمت `/dashboard` لوحة الانتباه ثم روابط القرار المدعومة ثم ملخص المؤشرات. أُظهر طابور مراجعة الوثائق الحالي مع وصف نطاقه وشرط استبعاد المؤلف، وأزيل النص القديم الذي يقول إن الطابور غير متاح.
- عرض النشاط يستخدم اسم فعل وموضوع مقروءين، ويزيل التكرار حسب هوية حدث التدقيق فقط. استعلام `audit_events` وسجل الأحداث والرابط إلى `/audit` باقية؛ لم يُحذف أو يُخفَ حدث من المصدر.
- أصلحت مجموعة `/work` رسالة empty المكررة، وأضفت تفاصيل قابلة للفتح تشرح مصدر المجموعة ومرشحها وحدودها. أزلت اقتراح CANCEL للعمل المحجوز؛ سياسة `TransitionTaskUseCase` الحالية ترفض CANCEL كما هي.
- في `/quarantine` يظهر الانتباه والتوزيع قبل ملخص المؤشرات.
- لا تغييرات مخطط أو migration أو اعتماد. مسارات القراءة القائمة هي dashboard metrics/audit، my-work queue، quarantine overview، وdocument review query. لا يضيف هذا التغيير كتابة أو audit/outbox. قاعدة البيانات/المعاملة غير مستعملة في عرض الصفحة؛ كل مصدر يقرأ وفق عقده الحالي، ولا يوجد snapshot موحد عبر المصادر. رفض CANCEL يسبق `repository.transition`؛ RESUME يتبع مسار الدومين المعتاد.

## Evidence

| البند | الحالة | الدليل |
|---|---|---|
| Candidate/branch | PASS (معلوم) | HEAD عند بداية المهمة `ac2f7db4a154d52bc55e72b41b4c1156f84e127a`, branch `main`; يختلف عن SHA التدقيق المطلوب `0b1bb21bb3b4eca77862dbba1da8623044e96355`. بدأت الشجرة نظيفة. مرشح التشغيل النهائي وsource fingerprint موجودان في `.ci-results/run-context.json`؛ hash/run ID هناك يخص هذه النسخة النهائية من المستندات. |
| Toolchain | PASS | Node `24.20.0` (عقد `.nvmrc`)، pnpm `11.25.0`. |
| Source schema | PASS | لا تعديل schema/migration. المصدر الموثق head `0042_immutable_lab_equipment_usage`; applied schema على PostgreSQL غير متحقق. |
| Unit | PASS | `pnpm exec vitest run tests/unit/dashboard/dashboard-presentation.test.ts tests/unit/dashboard/my-work-queue.test.ts tests/unit/ui/dashboard-decision-surface.test.ts tests/unit/tasks/transition-cancel-deny.test.ts tests/unit/documents/review-queue.test.ts` — 5 ملفات، 33/33 PASS. يشمل تكرار event identity مقابل تشابه العنوان، نشاط بشري مع بقاء السجل، ترتيب اللوحة، الصف الفارغ، والطابور/الرفض؛ إلغاء حقيقي من حالة ON_HOLD يُرفض قبل استدعاء transition، وRESUME موجب بوحدة use case. |
| Formatting | PASS | `pnpm exec prettier --check` على ستة ملفات TypeScript معدلة/مضافة — PASS. |
| Typecheck | FAIL | `pnpm typecheck` فشل بخطأين في `src/pages/ai-advisory.astro:148` و`src/pages/quality/findings/index.astro:35`؛ لم يُنسبا إلى الملفات المعدلة. |
| Build | PASS | بعد `pnpm verification:begin`, `pnpm build` — Astro + release identity + build evidence PASS. `buildId=local-ac2f7db4a154`, `releaseId=rel-fb3d8fc3803d9011`, artifact SHA-256 `ed8b8f2ef6174e65c7fa2f72572fcbf44d04dcfd80f5144971a16da84253c6bb`; `.ci-results/run-context.json` يربط بصمة الشجرة. ظهرت تحذيرات build قائمة للحزم/حجم chunk. |
| PostgreSQL 18 / source-applied schema | BLOCKED | Docker CLI موجود لكن daemon غير متاح؛ تعذر تشغيل قاعدة معزولة، PG parity/rollback/race/replay. لا اتصال أو كتابة إنتاجية. |
| DB before/after row, audit, outbox | NOT VERIFIED | اختبارات الوحدة تثبت رفض use case قبل استدعاء transition فقط؛ لم يُثبت عدم تغير row/audit/outbox على قاعدة فعلية. |
| Authorization / fixtures | PARTIAL | unit fixture اصطناعي لسجل ON_HOLD قائم صالح يثبت ضابط RESUME ورفض CANCEL؛ لا role/scope fixture حي ولا HTTP authenticated. |
| Direct HTTP / browser / widths / 200% / AT | NOT VERIFIED | لا جلسة/قاعدة اختبار متاحة لإظهار الصفحات المصادق عليها؛ لم تُنفذ قياسات 320/375/768/1440 CSS px أو 200% أو AT يدوي. |
| UAT | NOT VERIFIED | لا توقيع بشري. |
| KPI/list parity and unavailable null | NOT VERIFIED | التغيير أبقى مصادر KPI وقوائمها الحالية دون تغيير؛ لا دليل قاعدة حية لكل مرشح/نافذة في هذه المهمة. |
| Current document queue / CANCEL deny | PARTIAL | مصدر الصفحة الحالي يربط `/documents?review=mine`، ووحدة review queue ضمن الاختبارات المستهدفة؛ لا تحقق PG/HTTP حي. مصدر المهمة يرفض CANCEL قبل الكتابة. |

## State

**PARTIAL.** تغييرات المصدر واختبارات الوحدة وPrettier مكتملة. أدلة PG18 وHTTP/browser/AT/UAT وبناء release-bound النهائي غير متحققة. لا ادعاء 100% أو WCAG أو إغلاق كامل للبطاقات. لم يظهر قرار سياسة جديد غير محسوم؛ تبقى قرارات المصادر المفتوحة (blocked reason الحر، reject analytics، quality ownership) كما هي deny/NOT_SUPPLIED.

## Remaining findings

- مغلق على مستوى المصدر: أولوية العرض، نص تغطية document queue، lineage مجموعة العمل ورسالة empty واحدة، اقتراح CANCEL غير المعتمد، أسماء النشاط والتكرار حسب event identity.
- مفتوح للتحقق: تطابق KPI/list في PostgreSQL الحي، صف الرفض بلا أثر على row/audit/outbox، schema مطبقة، build identity النهائي، route/session/browser/accessibility/AT، UAT البشري.
- تسليم المتصفح وUAT للمالك/المراجع البشري؛ لا يوقع الوكيل نيابة عنهم.

## Files

`src/modules/dashboard/application/dashboard-sources.ts`, `src/modules/dashboard/application/dashboard-presentation.ts`, `src/modules/dashboard/application/my-work-queue.ts`, `src/modules/dashboard/infrastructure/postgres-dashboard-query.ts`, `src/pages/dashboard/index.astro`, `src/pages/work/index.astro`, `src/pages/quarantine/index.astro`, and focused tests under `tests/unit/`.
