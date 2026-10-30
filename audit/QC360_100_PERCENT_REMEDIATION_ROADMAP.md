# QC Universe — خارطة الإصلاح إلى جاهزية تشغيل قابلة للإثبات

**هذه خطة معالجة مشروطة وليست إدعاء 100%، ولا تُنفّذ أي تغيير في Production دون موافقة وسند استعادة.**

**مرجع التدقيق:** `ae2f9f51cbda67e85017aa1038dba8d948ef1804`. حالة الشركة: NO-GO / NOT PROVEN.

## المرحلة 0 — احتواء المخاطر وإثبات نقطة الانطلاق

1. **P0 — مراجعة نشر ملفات الشركة:** حصر 179 مستندًا مُخزّنًا في مستودع عام، وتصنيفها مع QA/Legal وIT Security؛ منع كشف معلومات خاضعة للسرية، ومراجعة آثار history/forks/cache إذا لزم. المصدر: `Documents/QC_Library_Source_Import/`. لا تحذف تاريخ Git بطريقة ارتجالية.
2. **P0 — النسخة والإصدار:** إصلاح Verification CI الفاشل (Run `40988851859`)، وفصل Jekyll Pages عن مسار نشر Astro SSR (Run `40988851374`). مبدأ القبول: Evidence حقيقي على نفس SHA، لا نجاح قديم.
3. **P0 — Neon وحماية البيانات:** تسجيل Project/Branch IDs وREAD-ONLY ledger head وSHA/checksums ونقطة استعادة موثقة. بلا schema changes أو import مباشر حتى إجراء تغيير QA/IT معتمد.

## المرحلة 1 — فك تعطل المسارات الأساسية (P0/P1)

4. **In-Process:** اعتماد مصفوفة Production/QC/Supervisor حسب shift وarea، ثم تفعيل `PERM-INP-*` بصورة محكومة، وربط WI فعّال ونموذج F-823-i لكل منتج؛ مراجعة `db/migrations/0077_in_process_controls.sql` و`src/modules/in-process/`.
5. **Document Control:** اعتماد مصفوفة صلاحيات التوقيع غير المالك وربط مراجعة/تفعيل WI-SOP-TF في `src/modules/documents/application/approve-version.ts`، والحفاظ على الفصل بين approved/effective.
6. **Inspection Templates:** تسوية 194 هوية Rev14 مع 13 مرشحًا وحالات 28 دليل المصدر. لا يسمح بتنفيذ أي نموذج بلا مصدر/Revision ومطابقة Item Code معتمدة.
7. **Laboratory:** ربط Method Source وQualification/Calibration المصدقة بكل اختبار وإعادة فحص، مع منع نتائج PASS من متطلبات ISO غير مرخصة أو غير مطبقة.
8. **Reject/Focus:** اعتماد خط سير Production→QC→Supervisor وقواعد النسب/thresholds، وربط الأدلة اليدوية Focus قبل الحكم باكتمال التوفيق.
9. **Library BYTEA:** تطبيق الخطة في بيئة staging معزولة ذات نقطة استعادة، والتحقق من counts/byte totals/readback (فقط بعد إذن مالك النظام). مصدر التنفيذ `scripts/qc-library/import-sources.ts` وليس مجرد `prepare`.

## المرحلة 2 — تشغيل ومصادقة العمليات (P1)

10. **Recovery:** اعتماد RPO/RTO وخطة استعادة مزود الخدمة، وتطوير Runner التنفيذ المستقل من `src/modules/backup-recovery/application/controlled-recovery-runner.ts` وفق سياسة معتمدة، ثم توثيق تجربة استعادة في منطقة غير الإنتاج.
11. **التتبع:** توحيد Lot/Item/Receiving/Inspection/In-Process/Lab/Reject/NCR/CAPA بإثبات source revisions وسجلات غير قابلة للتغيير.
12. **المهام والوردية:** ضبط تسليم ثلاث ورديات، إشعارات الأعمال، وقنوات Focus/Outbox بشرط مصدر معتمد وسجلات قابلة للتحقق.
13. **أمن البيانات والـAI:** سياسة external AI والـISO licenses وتعطيل الاستدعاءات الخارجية لحين موافقة واضحة. راجع `src/pages/ai-advisory.astro` و`db/migrations/0080_ai_advisory_policy.sql`.

## المرحلة 3 — التحقق التشغيلي والاعتماد (P1/P2)

14. الحصول على سجلات مسموح قراءتها تُثبت أعداد المستندات الفعلية ونسخ المصدر وBYTEA/aliases والقوالب المعتمدة وNeon migration head ومطابقته لـGit.
15. تشغيل برنامج تحقق تشغيلي منفصل ومصرح به **في مرحلة لاحقة فقط**؛ هذا التدقيق نفسه لا يشغّل اختبارات.
16. إكمال G1..G7 جميعها والحصول على اعتماد QC/QA/IT ونطاق Pilot/Shadow موثق قبل أي تصريح GO.

## أولويات التحسين الاختياري (P2/P3)

17. لوحة KPI حسب القسم والوردية مع مصدر SQL وfilters، وUI/UX نظيف دون تغيير Sidebar إلا بموافقة.
18. الواجهة السينمائية والتحليلات الإبداعية بعد سلامة QC والإفراج والقوالب، وليست معيار Ready-to-Go.

## شروط الإقفال

كل صف يُقفل فقط عندما يوجد: path/source revision، صاحب القرار، سياسة معتمدة إن لزم، Evidence مرتبط بـSHA وبالبيئة، والسجل غير قابل للتلاعب. لا تُعتمد نسبة 100% من عدد الملفات أو prompts منفذة وحدها.