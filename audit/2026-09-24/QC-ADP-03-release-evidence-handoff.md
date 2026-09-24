# QC-ADP-03 — إغلاق أدلة الإصدار

## القرار

**PARTIAL / NO-GO / handoff غير جاهز للاستلام النهائي.** أُضيف مسار استقبال attestations موقعة لـCI/security/database/E2E وربطها بهوية مرشح الإصدار، وأُضيفت حماية append-only، وعُرض قرار NO-GO بوضوح. لكن سجل الـ19 بوابة المعتمد غير موجود في نموذج التطبيق، ولا توجد أدلة مورد حالية على مرشح exact SHA، ولا هوية نشر حية قابلة للمطابقة. لذلك لا توجد نتيجة GO/RELEASED ولا نسبة إغلاق للصفحات.

## السبب الجذري

1. النظام يشتق ثماني فئات داخلية (`ci`, `security`, `database`, `e2e`, `uat`, `signatures`, `criticalRisks`, `residualRisk`) بينما سياسة الجاهزية المعتمدة تتطلب 19 بوابة. لا يوجد register يربط الفئات بالبوابات الـ19 أو يثبت اكتمال المقام على مرشح واحد.
2. مسار server evidence السابق كان يثق بتسمية `TRUSTED_*`/`IMPORTED_*` في المصدر؛ القيمة النصية لا تثبت هوية الموقّع أو صلاحية اعتماده.
3. health/control center يعرضان operational readiness وهوية الإصدار المتاحة، لكنهما لا يثبتان أن build المنشور يطابق المرشح أو أن قرار الـ19 بوابة وصل إلى GO.
4. لم يتوفر في هذه الجولة اعتماد مالك لسياسة signer/key/scope، ولا candidate SHA جديد نظيف، ولا run CI/DB/E2E/UAT حديث مرتبط به.

## التنفيذ المحلي

- migration `0040_signed_release_gate_evidence.sql`: digest للـevidence والتوقيع وهوية الموقّع ومجاله، unique digest، ومنع update/delete/truncate. لم تُطبّق على قاعدة حية.
- endpoint `POST /api/release-evidence`: يستقبل raw-body موقّعًا بـHMAC، يرفض signature/timestamp/scope/environment/identity غير المطابق، ولا يعتمد مفاتيح أو نطاقات مرسلة من العميل. التكرار المتطابق idempotent، وتغيير محتوى digest متعارض.
- المصدر المقبول لمزودي CI/security/database/E2E صار `SIGNED_PROVIDER_ATTESTATION` فقط؛ أدلة UAT البشرية تبقى على مسار التوقيع الحالي ولا تُحوّل إلى مزود آلي.
- قرار صفحة الإصدار يعرض NO-GO؛ طبقة القدرة ومسار الموافقة الخلفي كلاهما يرفضان الاعتماد عند عدم مصالحة سجل الـ19 بوابة مع هوية المرشح. PostgreSQL repository يرجع `false` عمدًا حتى يتوفر مصدر register معتمد، ولا يستنتج GO من الفئات الثماني.
- health/control center يوضحان الفرق بين جاهزية التشغيل وقرار الإصدار. لا تعرض الشاشة أي RELEASED من health.
- صفحات backup الحالية تفصل حالة مهمة النسخ عن نتيجة restore، وتمنع restore production وتعرض غياب SHA/version binding؛ لم يظهر من هذا التغيير سبب لتعديل سلوكها.

## المقام وقبول الصفحات

ثُبّت مقام **4 فحوص لكل route، 24 فحصًا إجمالًا** لهذه الجولة من findings المربوطة بـ`QC-PAGE-F-003` وبطاقات الطرق؛ كل صف أدناه يسجل الحالة والدليل. `PASS` يعني تحقق المصدر/الوحدة فقط، وليس قبولًا حيًا أو إغلاق البطاقة. لم تُحتسب N/A، ولم تُحسب نسبة جودة لأن الصفحات تحتاج تحققًا على المصدر/المرشح المناسب ولا يوجد candidate منشور لهذه الشجرة المعدلة.

| Route card | فحص القبول | الحالة | الدليل / الحد |
|---|---|---|---|
| RT-SYSTEM-001 `/system/health` | فصل operational health عن GO/RELEASED | PASS | مصدر health المعدّل؛ لا screenshot حي |
| RT-SYSTEM-001 | عرض هوية release كـUNVERIFIED عند غياب القيمة | PASS | مصدر `health.astro` |
| RT-SYSTEM-001 | ربط health بهوية build منشور على exact SHA | BLOCKED | لا نشر/Render workspace أو مرشح حالي |
| RT-SYSTEM-001 | تمييز schema/release readiness في جدول دلالي | NOT VERIFIED | source inspection فقط؛ لا browser/AT run |
| RT-SYSTEM-002 `/system/control-center` | قصر الوصول على SYSTEM_OWNER المسمى | PASS | guard في مصدر الصفحة |
| RT-SYSTEM-002 | عدم تحويل Core READY إلى Production GO | PASS | boundary copy في المصدر |
| RT-SYSTEM-002 | عرض Release ID/Build ID/Git SHA عند توافرها | PASS | source inspection |
| RT-SYSTEM-002 | مطابقة الهوية مع build حي منشور | BLOCKED | لا workspace/بيانات نشر حية |
| RT-BACKUP-001 `/system/backups` | تعذر المزود يظهر unavailable بدل نجاح أخضر | PASS | empty/unavailable state بالمصدر |
| RT-BACKUP-001 | فصل سجل النسخ عن نجاح الاستعادة | PASS | boundary copy بالمصدر |
| RT-BACKUP-001 | إثبات صلاحية/نطاق قراءة مستخدم فعلي | NOT VERIFIED | لم يُنفذ actor matrix |
| RT-BACKUP-001 | فحص الجدول دلاليًا مع بيانات حيّة | NOT VERIFIED | لا browser/live capture |
| RT-BACKUP-002 `/system/backups/[backupId]` | إظهار حالة restore مستقلة عن backup job | PASS | مصدر صفحة التفاصيل |
| RT-BACKUP-002 | عدم الادعاء بنجاح restore دون تحقق محفوظ | PASS | `restoreVerification`/known gaps بالمصدر |
| RT-BACKUP-002 | مطابقة backup identity/checksum مع مصدر حي | BLOCKED | لا artifact/restore live evidence |
| RT-BACKUP-002 | رفض scope غير المسموح على سجل صالح | NOT VERIFIED | لا اختبار HTTP بصلاحيات متباينة |
| RT-BACKUP-003 `/system/backups/[backupId]/restore` | حجب production restore | PASS | `productionBlocked` صريح بالمصدر |
| RT-BACKUP-003 | عدم ادعاء SHA/version binding للنسخ القديمة | PASS | UI يعرض Not recorded |
| RT-BACKUP-003 | إثبات عدم وجود أثر جانبي في GET | NOT VERIFIED | لا E2E/DB run |
| RT-BACKUP-003 | رفض actor/scope غير مصرح له على restore POST | NOT VERIFIED | لم يُنفذ اختبار رفض حي |
| RT-REL-001 `/governance/releases/[releaseId]` | عرض exact candidate identity وقرار NO-GO | PASS | مصدر الصفحة + release approval unit |
| RT-REL-001 | رفض ادعاء provider بلا signer/scope/digest | PASS | `provider-attestation` unit |
| RT-REL-001 | reconciliation/persistence على PostgreSQL 18 | BLOCKED | Testcontainers لا يجد container runtime |
| RT-REL-001 | رفض الاعتماد ما دام سجل الـ19 غير reconciled | PASS | unit fail-closed؛ DB repository افتراضيًا false |

إغلاق البطاقات حسب المقام المجمد: RT-SYSTEM-001 **2/4 = 50%**؛ RT-SYSTEM-002 **3/4 = 75%**؛ RT-BACKUP-001 **2/4 = 50%**؛ RT-BACKUP-002 **2/4 = 50%**؛ RT-BACKUP-003 **2/4 = 50%**؛ RT-REL-001 **3/4 = 75%**. المحصلة **14 PASS / 5 NOT VERIFIED / 5 BLOCKED من 24**. هذه نسب إغلاق الفحوص المنطبقة لكل بطاقة فقط وليست مقياس جودة للنظام؛ أي بطاقة متبقية NOT VERIFIED/BLOCKED تمنع الاستلام النهائي وفق معيار المهمة.

## أدلة التنفيذ والاختبار

- Source HEAD قبل edits: `7e0a3535f80b956bcfe0143201ddfee2e4277e4c` على `main`; working tree dirty بعد التنفيذ، لذلك لا تمثل edits SHA منشورًا أو CI candidate.
- GitHub combined status على HEAD كان `statuses: []`. أداة workflow-runs المتاحة محدودة بـPR ولم تعِد تشغيلات. لا يوجد دليل CI exact-SHA لهذه الشجرة.
- Render connector: لا workspace محدد؛ لم يُختر workspace. لا live deployment check ولا نشر.
- Unit: `provider-attestation`, `server-evidence`, `release-approval` — **38/38 PASS** على Node 24.20.0.
- Integration: `provider-ingestion` **BLOCKED** قبل تنفيذ الحالتين لأن Testcontainers لم يجد container runtime؛ الاختباران skipped. لا ندّعي DB migration/integration PASS.
- `astro check`: **PASS بعد إعادة التحقق** (976 ملفًا، 0 errors، 89 hints) بعد إصلاح import type ناقص في fixture؛ كانت نتيجة الفحص الأولى بعد التعديل FAIL بخطأ واحد وتم تصحيحه.
- Source migration head بعد الإضافة: `0040_signed_release_gate_evidence`; **غير مطبق**. Live applied head غير متحقق في هذه الجولة. Role للمصدر الحي: لم تُستخدم جلسة/صلاحية نشر؛ اختبارات الوحدة تستخدم fake manager، ولا تمثل actor حيًا.
- لم تُلتقط screenshots أو E2E؛ السجل لا يحتوي أسرارًا أو مفاتيح signer.

## مصدر/قرار مالك مطلوب لإغلاق العمل

1. اعتماد قائمة البوابات الـ19 ومصدرها وmapping كل gate إلى evidence provider، مع denominator وقواعد N/A.
2. اعتماد signer IDs/key IDs وscopes والبيئات ومدة صلاحية evidence ومرجع موافقة صريح لكل provider. المفاتيح تُضبط server-side فقط.
3. candidate exact SHA نظيف مع CI/security/DB/E2E artifacts، ودليل UAT موقّع مرتبط بالمرشح نفسه.
4. مصدر موثوق لهوية build المنشور وربطه بـSHA وrelease/build ID وmigration head، ثم قرار GO/NO-GO الناتج.
5. migration 0040 مطبقة على disposable PostgreSQL 18 واختبارات reconciliation/append-only مارة؛ ثم فحص browser/keyboard/table semantics لكل route في بيئة مناسبة.

القبول الحالي: **0/19 evidence reconciliation / NO-GO**. Health ليس قرار RELEASED. لا تُعلن READY أو 100%، ولا يتم commit/push/deploy ضمن هذا التسليم.
