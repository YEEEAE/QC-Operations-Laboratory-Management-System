# QC-ADAPTIVE-PAGE-BY-PAGE-AUDIT-001 — تدقيق تكيفي لكل صفحات النظام

**التاريخ:** 2026-09-24 · **HEAD لجولة المشاهدة الأصلية:** `7c0856262ee789a3e43495b4091de033c7cf1846` · **HEAD لإعادة فحص المصدر:** `72626aced7aa436010766a64b04b9ded392ba824` · **الفرع:** `main` · **حالة الشجرة عند البدء:** نظيفة · **النتيجة:** `PARTIAL / NO-GO`.

> **حد الدليل:** هذا جرد كامل للمسارات الفيزيائية مع إشارات مصدر محددة، ومشاهدة قراءة فقط لعينة كبيرة من صفحات الإنتاج بحساب المالك؛ ليس اختبارًا شاملاً لكل سجل ديناميكي أو كل دور أو قياس أداء أو اعتماد UAT. النسب التقديرية السابقة سُحبت؛ الحكم الحالي يُسند إلى أدلة قابلة للتتبع ولا يساوي درجة امتثال. `NOT VERIFIED` لا يساوي `FAIL`، و`PASS` محلي لا يساوي `RELEASED`.

## 1. الملخص التنفيذي
- الجرد: **90 موضع صفحة**: 88 مسارًا مسجلًا (86 ملفًا فعليًا + 2 deferred)، وصفحتا 404/500 فعليتان خارج السجل؛ **88 ملف Astro فعلي**. الصفحات الحية التي فُتحت قراءة فقط: **47** وجهة مميزة، تشمل سجل مهمة ديناميكي واحد؛ `/laboratory` يعيد التوجيه إلى `/laboratory/tests`.
- أكبر مانع إنتاج مثبت: مخطط Reject Reports غير متاح (`0018` applied مقابل `0039` shipped). الهوية الحالية للإصدار والاستعادة غير متحققتين. المعالجة الخارجية للـAI مغلقة وفق السياسة.
- مصادر القرار العلمي والسياسة في inspection/NCR/CAPA، وقالب المختبر المعتمد، ودليل قاعدة بيانات/مصادقة/UAT على المرشح نفسه لا تزال مفتوحة. لا يجوز سدها بمعايير مختلقة.
- سجل التقرير الآن **29 نتيجة موثقة أو فجوة تحقق**، و**20 تحسينًا محددًا** في القسم 19A، و**26 برومبتًا** مرتبطًا بها في الحزمة. هذا اكتمال ربط الخطة بما وُثّق هنا، وليس إثبات اكتمال وظائف الصفحات أو جميع العيوب الممكنة.
- لا تغييرات تشغيلية في الموقع، ولا commit أو push أو migration إنتاجية.

## 2. بطاقة النظام وحدود القياس

**القرار:** `NO-GO` استنادًا إلى موانع محددة في الأقسام 5 و22 و26. لا توجد درجة جودة كلية أو نسب مجال قابلة لإعادة الحساب من أدلة هذه الجولة. الأرقام المنشورة سابقًا (ومنها 47% للكل و20% للأداء) كانت تقديرات بلا مقام أو أوزان أو قياس؛ سُحبت ولا تُستخدم للمقارنة أو ترتيب العمل. ترتيب الأولوية يعتمد على أثر المانع واحتمال وقوعه والدليل المباشر، لا على متوسطات الصفحات.

| المجال | الحكم المدعوم بهذه الجولة | ما يلزم لقياسه |
|---|---|---|
| الوظيفة وتدفقات QC والمختبر | PARTIAL؛ مسارات ظاهرة وموانع سياسة/مخطط مثبتة | حالات فعلية لكل انتقال ودور، ونجاح/رفض خادمي موثق |
| البيانات والتقارير | PARTIAL؛ drift الإنتاج و503 في Reject Reports مثبتان | PostgreSQL على المرشح نفسه ومقارنة source/scope/filters مع الصادرات |
| الأمن والصلاحيات | NOT VERIFIED على كامل المصفوفة | طلبات GET/POST بأدوار ونطاقات وحالات ونسخ مختلفة |
| الإتاحة وتجربة الإنسان | NOT VERIFIED شاملًا | لوحة مفاتيح وقارئ شاشة ومقاسات وبيانات ممتلئة وUAT |
| الأداء والاعتمادية | NOT VERIFIED قياسًا | زمن واستعلامات وحمل واستعادة على بيانات وبيئة ممثلتين |
| جاهزية الإصدار | NO-GO | إزالة الموانع المثبتة وإثبات البوابات على هوية إصدار واحدة |

**وحدة الدليل:** `SOURCE` تعني قراءة ملف الصفحة فقط، و`LIVE-GET` تعني مشاهدة قراءة بحساب واحد، و`ACTION` تعني اختبار إجراء مسموح في بيئة معزولة، و`HUMAN/AT` اختبارًا بشريًا أو بتقنية مساعدة. عدم توفر الدليل يبقى `NOT VERIFIED`؛ لا يُحوّل إلى نسبة جودة أو إخفاق وظيفي.

## 3. جرد الصفحات وترتيبها
| # | Page ID | Route | Family | Type | Source | Visibility | Quality | Evidence gap | Evidence | Findings |
|---:|---|---|---|---|---|---|---|---|---|---|
| 1 | `RT-ROOT-001` | `/` | Authentication | Redirect | `src/pages/index.astro` | public/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-025 |
| 2 | `RT-AUTH-001` | `/login` | Authentication | Authentication | `src/pages/login.astro` | public/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-025 |
| 3 | `RT-AUTH-002` | `/auth/recovery` | Authentication | Authentication | `src/pages/auth/recovery.astro` | public/deferred | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | DEFERRED | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-017, QC-PAGE-F-025 |
| 4 | `RT-AUTH-003` | `/auth/reset/[requestId]` | Authentication | Authentication | `src/pages/auth/reset/[requestId].astro` | public/deferred | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | DEFERRED | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-017, QC-PAGE-F-025 |
| 5 | `RT-DASH-001` | `/dashboard` | Dashboard & work | Overview | `src/pages/dashboard/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-008, QC-PAGE-F-014 |
| 6 | `RT-WORK-001` | `/work` | Dashboard & work | Overview | `src/pages/work/index.astro` | authenticated/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-008, QC-PAGE-F-014 |
| 7 | `RT-TASK-001` | `/tasks` | Tasks | Register | `src/pages/tasks/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-020 |
| 8 | `RT-TASK-002` | `/tasks/new` | Tasks | Form | `src/pages/tasks/new.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015, QC-PAGE-F-020 |
| 9 | `RT-TASK-003` | `/tasks/[taskId]` | Tasks | Detail | `src/pages/tasks/[taskId].astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-020 |
| 10 | `RT-QUAL-001` | `/quality` | Quality | Overview | `src/pages/quality/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-014 |
| 11 | `RT-FIND-001` | `/quality/findings` | Quality | Register | `src/pages/quality/findings/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-014 |
| 12 | `RT-FIND-002` | `/quality/findings/new` | Quality | Form | `src/pages/quality/findings/new.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-015 |
| 13 | `RT-FIND-003` | `/quality/findings/[findingId]` | Quality | Detail | `src/pages/quality/findings/[findingId].astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-014 |
| 14 | `RT-NCR-001` | `/quality/ncr` | Quality | Register | `src/pages/quality/ncr/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-014 |
| 15 | `RT-NCR-002` | `/quality/ncr/new` | Quality | Form | `src/pages/quality/ncr/new.astro` | permission-bound/conditional | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-015 |
| 16 | `RT-NCR-003` | `/quality/ncr/[ncrId]` | Quality | Detail | `src/pages/quality/ncr/[ncrId].astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-014 |
| 17 | `RT-RCA-001` | `/quality/rca` | Quality | Register | `src/pages/quality/rca/index.astro` | permission-bound/conditional | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-014 |
| 18 | `RT-RCA-002` | `/quality/rca/[rcaId]` | Quality | Detail | `src/pages/quality/rca/[rcaId].astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-014 |
| 19 | `RT-CAPA-001` | `/quality/capa` | Quality | Register | `src/pages/quality/capa/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-014 |
| 20 | `RT-CAPA-002` | `/quality/capa/new` | Quality | Form | `src/pages/quality/capa/new.astro` | permission-bound/conditional | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-015 |
| 21 | `RT-CAPA-003` | `/quality/capa/[capaId]` | Quality | Detail | `src/pages/quality/capa/[capaId].astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-014 |
| 22 | `RT-QUAR-001` | `/quarantine` | Quarantine | Overview | `src/pages/quarantine/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002, QC-PAGE-F-014 |
| 23 | `RT-REC-001` | `/quarantine/receiving` | Quarantine | Register | `src/pages/quarantine/receiving/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002, QC-PAGE-F-014 |
| 24 | `RT-REC-002` | `/quarantine/receiving/new` | Quarantine | Form | `src/pages/quarantine/receiving/new.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002, QC-PAGE-F-015 |
| 25 | `RT-REC-003` | `/quarantine/receiving/[receivingId]` | Quarantine | Detail | `src/pages/quarantine/receiving/[receivingId].astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002, QC-PAGE-F-014 |
| 26 | `RT-INSP-001` | `/quarantine/inspections` | Quarantine | Register | `src/pages/quarantine/inspections/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002, QC-PAGE-F-014 |
| 27 | `RT-INSP-002` | `/quarantine/inspections/[inspectionId]` | Quarantine | Detail | `src/pages/quarantine/inspections/[inspectionId]/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002, QC-PAGE-F-014, QC-PAGE-F-028 |
| 28 | `RT-INSP-003` | `/quarantine/inspections/[inspectionId]/execute` | Quarantine | Execution | `src/pages/quarantine/inspections/[inspectionId]/execute.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002, QC-PAGE-F-015 |
| 29 | `RT-INSP-004` | `/quarantine/inspections/[inspectionId]/review` | Quarantine | Review | `src/pages/quarantine/inspections/[inspectionId]/review.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002 |
| 30 | `RT-QUAR-002` | `/quarantine/admin` | Quarantine | Register | `src/pages/quarantine/admin/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002, QC-PAGE-F-014 |
| 31 | `RT-LAB-001` | `/laboratory` | Laboratory | Register | `src/pages/laboratory/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005, QC-PAGE-F-014 |
| 32 | `RT-LAB-002` | `/laboratory/tests` | Laboratory | Register | `src/pages/laboratory/tests/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005, QC-PAGE-F-014 |
| 33 | `RT-LAB-003` | `/laboratory/tests/new` | Laboratory | Form | `src/pages/laboratory/tests/new.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005, QC-PAGE-F-015 |
| 34 | `RT-LAB-009` | `/laboratory/report-templates` | Laboratory | Draft/print | `src/pages/laboratory/report-templates.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005, QC-PAGE-F-006, QC-PAGE-F-015 |
| 35 | `RT-LAB-004` | `/laboratory/tests/[labTestId]` | Laboratory | Detail | `src/pages/laboratory/tests/[labTestId]/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005, QC-PAGE-F-014, QC-PAGE-F-028 |
| 36 | `RT-LAB-005` | `/laboratory/tests/[labTestId]/execute` | Laboratory | Execution | `src/pages/laboratory/tests/[labTestId]/execute.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005, QC-PAGE-F-015, QC-PAGE-F-029 |
| 37 | `RT-LAB-006` | `/laboratory/tests/[labTestId]/review` | Laboratory | Review | `src/pages/laboratory/tests/[labTestId]/review.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005 |
| 38 | `RT-LAB-007` | `/laboratory/tests/[labTestId]/retests/new` | Laboratory | Form | `src/pages/laboratory/tests/[labTestId]/retests/new.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005, QC-PAGE-F-015 |
| 39 | `RT-ASSET-001` | `/assets` | Assets | Overview | `src/pages/assets/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-022 |
| 40 | `RT-EQUIP-001` | `/assets/equipment` | Assets | Register | `src/pages/assets/equipment/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-022 |
| 41 | `RT-EQUIP-002` | `/assets/equipment/new` | Assets | Form | `src/pages/assets/equipment/new.astro` | permission-bound/conditional | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015, QC-PAGE-F-022 |
| 42 | `RT-EQUIP-003` | `/assets/equipment/[equipmentId]` | Assets | Detail | `src/pages/assets/equipment/[equipmentId].astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-022 |
| 43 | `RT-CAL-001` | `/assets/calibrations` | Assets | Register | `src/pages/assets/calibrations/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-022 |
| 44 | `RT-CAL-002` | `/assets/calibrations/new` | Assets | Form | `src/pages/assets/calibrations/new.astro` | permission-bound/conditional | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015, QC-PAGE-F-022 |
| 45 | `RT-CAL-003` | `/assets/calibrations/[calibrationId]` | Assets | Detail | `src/pages/assets/calibrations/[calibrationId].astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-022 |
| 46 | `RT-MAINT-001` | `/assets/maintenance` | Assets | Register | `src/pages/assets/maintenance/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-022 |
| 47 | `RT-MAINT-002` | `/assets/maintenance/new` | Assets | Form | `src/pages/assets/maintenance/new.astro` | permission-bound/conditional | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015, QC-PAGE-F-022 |
| 48 | `RT-MAINT-003` | `/assets/maintenance/[maintenanceId]` | Assets | Detail | `src/pages/assets/maintenance/[maintenanceId].astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-022 |
| 49 | `RT-DOC-001` | `/documents` | Documents | Register | `src/pages/documents/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-023 |
| 50 | `RT-DOC-002` | `/documents/new` | Documents | Form | `src/pages/documents/new.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015, QC-PAGE-F-023 |
| 51 | `RT-DOC-003` | `/documents/[documentId]` | Documents | Detail | `src/pages/documents/[documentId]/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-023 |
| 52 | `RT-DOC-004` | `/documents/[documentId]/versions/new` | Documents | Form | `src/pages/documents/[documentId]/versions/new.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015, QC-PAGE-F-023 |
| 53 | `RT-DOC-005` | `/documents/[documentId]/versions/[versionId]` | Documents | Detail | `src/pages/documents/[documentId]/versions/[versionId]/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-023, QC-PAGE-F-028 |
| 54 | `RT-DOC-006` | `/documents/[documentId]/versions/[versionId]/review` | Documents | Review | `src/pages/documents/[documentId]/versions/[versionId]/review.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-023 |
| 55 | `RT-APPROVAL-001` | `/approvals` | Approvals | Register | `src/pages/approvals/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-021 |
| 56 | `RT-APPROVAL-002` | `/approvals/[approvalId]` | Approvals | Detail | `src/pages/approvals/[approvalId].astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-021 |
| 57 | `RT-CHANGE-001` | `/change-requests` | Change requests | Register | `src/pages/change-requests/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-024 |
| 58 | `RT-CHANGE-002` | `/change-requests/new` | Change requests | Form | `src/pages/change-requests/new.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015, QC-PAGE-F-024 |
| 59 | `RT-CHANGE-003` | `/change-requests/[changeRequestId]` | Change requests | Detail | `src/pages/change-requests/[changeRequestId]/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-024 |
| 60 | `RT-CHANGE-004` | `/change-requests/[changeRequestId]/review` | Change requests | Review | `src/pages/change-requests/[changeRequestId]/review.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-024 |
| 61 | `RT-REPORT-001` | `/reports` | Reports | Register | `src/pages/reports/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-011, QC-PAGE-F-014 |
| 62 | `RT-REPORT-002` | `/reports/[reportCode]` | Reports | Detail | `src/pages/reports/[reportCode].astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-011, QC-PAGE-F-014 |
| 63 | `RT-ADMIN-001` | `/admin` | Administration | Overview | `src/pages/admin/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-018, QC-PAGE-F-014 |
| 64 | `RT-USER-001` | `/admin/users` | Administration | Register | `src/pages/admin/users/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-018, QC-PAGE-F-014 |
| 65 | `RT-USER-002` | `/admin/users/new` | Administration | Form | `src/pages/admin/users/new.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-018, QC-PAGE-F-015 |
| 66 | `RT-USER-003` | `/admin/users/[userId]` | Administration | Detail | `src/pages/admin/users/[userId].astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-018, QC-PAGE-F-014 |
| 67 | `RT-ROLE-001` | `/admin/roles` | Administration | Register | `src/pages/admin/roles/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-018, QC-PAGE-F-014 |
| 68 | `RT-ROLE-002` | `/admin/roles/[roleId]` | Administration | Detail | `src/pages/admin/roles/[roleId].astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-018, QC-PAGE-F-014 |
| 69 | `RT-ADMIN-002` | `/admin/permissions` | Administration | Register | `src/pages/admin/permissions/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-018, QC-PAGE-F-014 |
| 70 | `RT-ADMIN-003` | `/admin/scopes` | Administration | Register | `src/pages/admin/scopes/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-018, QC-PAGE-F-014 |
| 71 | `RT-SYSTEM-001` | `/system/health` | System & recovery | Overview | `src/pages/system/health.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-003, QC-PAGE-F-004, QC-PAGE-F-014, QC-PAGE-F-029 |
| 72 | `RT-SYSTEM-002` | `/system/control-center` | System & recovery | Overview | `src/pages/system/control-center.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-003, QC-PAGE-F-004, QC-PAGE-F-014 |
| 73 | `RT-BACKUP-001` | `/system/backups` | System & recovery | Register | `src/pages/system/backups/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-003, QC-PAGE-F-004, QC-PAGE-F-014 |
| 74 | `RT-BACKUP-002` | `/system/backups/[backupId]` | System & recovery | Detail | `src/pages/system/backups/[backupId]/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-003, QC-PAGE-F-004, QC-PAGE-F-014 |
| 75 | `RT-BACKUP-003` | `/system/backups/[backupId]/restore` | System & recovery | Recovery | `src/pages/system/backups/[backupId]/restore.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-003, QC-PAGE-F-004 |
| 76 | `RT-REJ-001` | `/reject-reports` | Reject Reports | Register | `src/pages/reject-reports/index.astro` | authenticated/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-001, QC-PAGE-F-014 |
| 77 | `RT-REJ-002` | `/reject-reports/new` | Reject Reports | Form | `src/pages/reject-reports/new.astro` | authenticated/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-001, QC-PAGE-F-015 |
| 78 | `RT-REJ-003` | `/reject-reports/issue-slips/[reportId]` | Reject Reports | Detail | `src/pages/reject-reports/issue-slips/[reportId].astro` | authenticated/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-001, QC-PAGE-F-014 |
| 79 | `RT-REJ-004` | `/reject-reports/daily/[reportId]` | Reject Reports | Detail | `src/pages/reject-reports/daily/[reportId].astro` | authenticated/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-001, QC-PAGE-F-014 |
| 80 | `RT-AI-001` | `/ai-advisory` | Shared | Utility | `src/pages/ai-advisory.astro` | permission-bound/required | PARTIAL / NO-GO (5/10) | owner policy، dependency audit، security E2E والقراءة الحية غير مثبتة/محجوبة | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-019, QC-PAGE-F-029؛ QC-ADP-11 handoff |
| 81 | `RT-SHARED-001` | `/search` | Shared | Utility | `src/pages/search.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-026 |
| 82 | `RT-SHARED-002` | `/notifications` | Shared | Register | `src/pages/notifications.astro` | authenticated/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-026, QC-PAGE-F-029 |
| 83 | `RT-SHARED-003` | `/account` | Shared | Utility | `src/pages/account.astro` | authenticated/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-025 |
| 84 | `RT-SHARED-004` | `/audit` | Shared | Register | `src/pages/audit.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-027 |
| 85 | `RT-HELP-001` | `/help` | Shared | Utility | `src/pages/help/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016 |
| 86 | `RT-QUAR-003` | `/quarantine/admin/[templateId]` | Quarantine | Detail | `src/pages/quarantine/admin/[templateId].astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002, QC-PAGE-F-014 |
| 87 | `RT-DOC-007` | `/documents/[documentId]/versions/[versionId]/edit` | Documents | Detail | `src/pages/documents/[documentId]/versions/[versionId]/edit.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-023 |
| 88 | `RT-REL-001` | `/governance/releases/[releaseId]` | System & recovery | Detail | `src/pages/governance/releases/[releaseId].astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-003, QC-PAGE-F-004, QC-PAGE-F-014 |
| 89 | `RT-ERROR-404` | `/404` | Shared | Error | `src/pages/404.astro` | public/unregistered-error | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-017, QC-PAGE-F-014 |
| 90 | `RT-ERROR-500` | `/500` | Shared | Error | `src/pages/500.astro` | public/unregistered-error | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-017 |

## 4. المنهج وحدود التغطية
- المصدر: `src/shared/routing/routes.ts` و88 ملف `.astro` وخرائط الأعمال/الصلاحيات/المخطط وMind الحالي. أُعيد استخراج إشارات محددة من ملفات الصفحات على HEAD المذكور أعلاه؛ لم يُتتبع كل استدعاء حتى قاعدة البيانات. الحقول المستخرجة من source هي إشارات تنفيذ لا برهان سلوك.
- الحي: جلسة yazeed على `https://qclevel.top`، تنقل GET فقط؛ لم يُضغط زر ينشئ أو يغير سجلًا. لا توجد بيانات كافية لفحص غالبية detail/review/execute/print، ولا شخصيات أخرى. لم تُرسل أسرار إلى التقرير.
- مهارات مستخدمة: `heuristic-evaluation` لمبادئ الحالة/اللغة/الاسترداد، `accessibility-audit` لتحديد حدود POUR، `better-writing` للنصوص، `journey-map` لمسارات التشغيل، و`better-interface` لفصل الدليل المرئي عن المصدر. لم يُستخدم Figma لتقييم مطابقة تصميم لعدم وجود رابط ملف/عقدة تصميم معتمدة في الطلب أو المشروع.
- لكل صفحة: قائمة المخاطر لا تدّعي وقوعها؛ ما لم يدعمه مصدر محدد أو مشاهدة حية موسوم `NOT VERIFIED`. الصلاحية المرئية لا تثبت سلطة mutation؛ تُعاد على الخادم.
- **عينة تتبع عبر حدود الصفحة:** انتقال المهمة في `src/pages/tasks/[taskId].astro:47` يستدعي `src/actions/tasks.ts:81` مع `expectedVersion`، ويربط `src/modules/tasks/application/transition.ts:31` الذي يختار صلاحية لكل انتقال. حفظ القياسات في `src/pages/laboratory/tests/[labTestId]/execute.astro:231` يصل إلى `src/actions/laboratory.ts:37` ثم `src/modules/laboratory/application/save-measurements.ts:23` حيث تُطلب صلاحيتا تعديل المسودة وإدخال القياس. قرار الاعتماد في `src/pages/approvals/[approvalId].astro` يصل إلى `src/actions/approvals.ts:34` ثم `src/modules/approvals/application/decide-approval.ts:94` مع نسخة الموضوع وإعادة المصادقة. هذه أدلة **عقود مصدر**؛ نجاح الكتابة والتراجع والتدقيق الفعلي في PostgreSQL والإنتاج `NOT VERIFIED` بهذه الجولة.

## 5. نتائج مشتركة في النظام
- **QC-PAGE-F-009 (P1):** اختبارات الدور والحالة والسجل الفعلي غير مكتملة — معظم الصفحات الحية فارغة؛ dynamic routes بلا fixtures؛ security E2E السابقة 8 PASS/4 FAIL. الإجراء: بيئة اختبار معزولة وست شخصيات، فحص GET/POST وحالات الانتقال.
- **QC-PAGE-F-010 (P1):** مصفوفة keyboard/AT/responsive لم تُثبت — Mind يسجل browser/AT matrix NOT RUN أو PARTIAL؛ لا تكفي قراءة DOM. الإجراء: تشغيل فحص 320/390/768/1440 و200% وkeyboard وscreen reader للطرق الحرجة.
- **QC-PAGE-F-013 (P1):** UAT البشرية غير منفذة — Mind وUAT plan: ست شخصيات بشرية غير مثبتة، ونطاق توقيع الدورة مفتوح. الإجراء: تنفيذ UAT موثق بمشاركين حقيقيين وصلاحية توقيع معتمدة.
- **QC-PAGE-F-014 (P2):** جودة النصوص وحالات الصفر تحتاج مصالحة — لقطات حية تعرض UNSPECIFIED وVOID ورموزًا داخلية؛ و`/404` يضع نص Go to dashboard فوق رابط login للزائر؛ بعض حالات الصفر لا تعطي فعلًا بحسب الصلاحية. الإجراء: تدقيق كل النصوص في الحالات populated/empty/error وتوحيد المصطلحات المضبوطة.
- **QC-PAGE-F-015 (P2):** إعادة الإدخال بين السجلات تحتاج قياسًا وتخفيضًا — نماذج الاستلام/المختبر تتطلب بيانات سياق؛ بعض نماذج الأصول تستخدم اختيار equipment بالفعل. الإجراء: تتبع الحقول المصدرية واستبدال المكرر بlookup/pre-fill مع سجل المصدر.
- **QC-PAGE-F-016 (P2):** الأداء تحت بيانات ممثلة غير مقاس — الصفحات الحية فقيرة البيانات؛ لا أدلة query/N+1/Web Vitals لهذه الجولة. الإجراء: قياس قبل/بعد لصفحات السجل واللوحات وإصلاح الاختناقات المثبتة.

## 6. أساس نظام التصميم
تستخدم الصفحات `AppLayout` وshared DataTable/feedback/status/workflow components وsemantic tokens؛ المصدر والحي يبرزان تعريف source/scope في اللوحات وحالات zero صريحة في عدة سجلات. قبل أي إعادة تصميم، افحص الحالات الأربع empty/loading/error/populated على 320/390/768/1440 و200%/forced-colors/reduced-motion/print. وحّد نص الحالة وتنسيق الأرقام والتواريخ وموقع فعل الإنشاء في shared primitives حيث يثبت التكرار. تجنب إضافة رسومات بلا سؤال عمل أو مصدر بيانات. مقارنة Figma **NOT VERIFIED** لغياب ملف تصميم محدد.

## 7. تحليل صفحة بصفحة
### RT-ROOT-001 — `/`
- **النوع/المنهج/السبب:** Redirect؛ توجيه آمن. المسار يحدد الوجهة والجلسة قبل أي عمل.
- **الملف/الظهور/المستخدم:** `src/pages/index.astro`؛ `public` (`required`)؛ PUBLIC أو مستخدم مصادق بحسب المسار. **الهدف/الدورة:** هوية الدخول واسترداد الجلسة؛ تحقق دخول/استرداد؛ لا قرار QC.
- **المصدر والبيانات:** قراءة عبر shared/use case أو صفحة ثابتة. كيانات مرجعية مرشحة: `سجل جلسات/مستخدمين`. الحالة النصية المستخرجة: لم تُستخرج حالات نصية مباشرة؛ راجع use case.
- **أثر مصدر قابل للتتبع:** لا تُظهر الصفحة نفسها استدعاء `astro:actions` أو مفتاح `PERM-*`؛ افحص التوجيه والخادم قبل استنتاج الصلاحية. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** قراءة/توجيه؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** راجع المهمة الأساسية واللغة والاسترداد وإتاحة لوحة المفاتيح، مع عدم توسيع السلطة.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016., QC-PAGE-F-025

### RT-AUTH-001 — `/login`
- **النوع/المنهج/السبب:** Authentication؛ سلامة الدخول واسترداد الوصول. الهوية والجلسة ورسائل الرفض هي الخطر الأساسي.
- **الملف/الظهور/المستخدم:** `src/pages/login.astro`؛ `public` (`required`)؛ PUBLIC أو مستخدم مصادق بحسب المسار. **الهدف/الدورة:** هوية الدخول واسترداد الجلسة؛ تحقق دخول/استرداد؛ لا قرار QC.
- **المصدر والبيانات:** قراءة عبر shared/use case أو صفحة ثابتة. كيانات مرجعية مرشحة: `سجل جلسات/مستخدمين`. الحالة النصية المستخرجة: AUTH_RATE_LIMITED, AUTH_RATE_LIMIT_STORE_UNAVAILABLE.
- **أثر مصدر قابل للتتبع:** استدعاء واجهة الإجراء `actions.login` L9، `actions.login` L35. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Show؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** راجع المهمة الأساسية واللغة والاسترداد وإتاحة لوحة المفاتيح، مع عدم توسيع السلطة.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016., QC-PAGE-F-025

### RT-AUTH-002 — `/auth/recovery`
- **النوع/المنهج/السبب:** Authentication؛ سلامة الدخول واسترداد الوصول. الهوية والجلسة ورسائل الرفض هي الخطر الأساسي.
- **الملف/الظهور/المستخدم:** `src/pages/auth/recovery.astro`؛ `public` (`deferred`)؛ PUBLIC أو مستخدم مصادق بحسب المسار. **الهدف/الدورة:** هوية الدخول واسترداد الجلسة؛ تحقق دخول/استرداد؛ لا قرار QC.
- **المصدر والبيانات:** لا ملف صفحة؛ عقد مؤجل. كيانات مرجعية مرشحة: `سجل جلسات/مستخدمين`. الحالة النصية المستخرجة: لم تُستخرج حالات نصية مباشرة؛ راجع use case.
- **أثر مصدر قابل للتتبع:** لا يوجد ملف Astro فعلي لهذا المسار المؤجل؛ سلوك الصفحة وقرار إتاحتها يحتاجان عقد منتج.
- **الأفعال/الصفحات المرتبطة:** قراءة/توجيه؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** لم تُثبت مشاهدة حية لهذا المسار. مسار مؤجل بلا ملف صفحة؛ تجربة الاسترداد عبر هذا URL غير متاحة.
- **التوصية والتصميم:** راجع المهمة الأساسية واللغة والاسترداد وإتاحة لوحة المفاتيح، مع عدم توسيع السلطة.
- **بطاقة الدليل:** source=DEFERRED؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-017., QC-PAGE-F-025

### RT-AUTH-003 — `/auth/reset/[requestId]`
- **النوع/المنهج/السبب:** Authentication؛ سلامة الدخول واسترداد الوصول. الهوية والجلسة ورسائل الرفض هي الخطر الأساسي.
- **الملف/الظهور/المستخدم:** `src/pages/auth/reset/[requestId].astro`؛ `public` (`deferred`)؛ PUBLIC أو مستخدم مصادق بحسب المسار. **الهدف/الدورة:** هوية الدخول واسترداد الجلسة؛ تحقق دخول/استرداد؛ لا قرار QC.
- **المصدر والبيانات:** لا ملف صفحة؛ عقد مؤجل. كيانات مرجعية مرشحة: `سجل جلسات/مستخدمين`. الحالة النصية المستخرجة: لم تُستخرج حالات نصية مباشرة؛ راجع use case.
- **أثر مصدر قابل للتتبع:** لا يوجد ملف Astro فعلي لهذا المسار المؤجل؛ سلوك الصفحة وقرار إتاحتها يحتاجان عقد منتج.
- **الأفعال/الصفحات المرتبطة:** قراءة/توجيه؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** لم تُثبت مشاهدة حية لهذا المسار. مسار مؤجل بلا ملف صفحة؛ تجربة الاسترداد عبر هذا URL غير متاحة.
- **التوصية والتصميم:** راجع المهمة الأساسية واللغة والاسترداد وإتاحة لوحة المفاتيح، مع عدم توسيع السلطة.
- **بطاقة الدليل:** source=DEFERRED؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-017., QC-PAGE-F-025

### RT-DASH-001 — `/dashboard`
- **النوع/المنهج/السبب:** Overview؛ دعم القرار ودلالة المؤشرات. الغرض تحديد ما يتطلب انتباهًا ووجهة الإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/dashboard/index.astro`؛ `permission-bound` (`required`)؛ كل مستخدم نشط. **الهدف/الدورة:** وعي تشغيلي وتوجيه العمل؛ قراءة مؤشرات/طوابير وروابط إلى السجلات.
- **المصدر والبيانات:** `../../modules/dashboard/application/dependencies.js`, `../../modules/dashboard/application/get-dashboard.js`, `../../modules/dashboard/application/dashboard-empty.js`. كيانات مرجعية مرشحة: `read models متعددة`. الحالة النصية المستخرجة: AUTHORIZATION, AVAILABLE.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../modules/dashboard/application/dependencies.js` L7، `../../modules/dashboard/application/get-dashboard.js` L8، `../../modules/dashboard/application/dashboard-empty.js` L9. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Open the receiving register, Open my approvals, Open my overdue tasks, Open history؛ `/tasks`, `/quarantine/receiving`, `/quarantine/inspections`, `/laboratory/tests`, `/approvals`.
- **قوة/مشكلة مرصودة:** حَيًّا: كل عدادات الإجراءات المعروضة 0، مع تعريف source/scope وروابط drill-down؛ صفحة التغطية تصرح بطوابير غير موردة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** اربط كل مؤشر بمصدر ونطاق وزمن ورابط filter مطابق؛ أظهر unavailable بصدق ولا تحوّل الصفر إلى بيانات مفقودة.
- **بطاقة الدليل (QC-ADP-07 candidate):** source=PARTIAL — document queue/use case/filter and bounded-index migration implemented; dashboard source wired. Live/populated/role/PG parity/query plan/AT/performance/UAT=NOT VERIFIED or BLOCKED (Testcontainers runtime missing); quality/reject/blocked reason owner contracts remain open. **تقييم الجودة:** NOT VERIFIED / NO-GO؛ الفحوص: QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-008, QC-PAGE-F-014.

### RT-WORK-001 — `/work`
- **النوع/المنهج/السبب:** Overview؛ دعم القرار ودلالة المؤشرات. الغرض تحديد ما يتطلب انتباهًا ووجهة الإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/work/index.astro`؛ `authenticated` (`required`)؛ كل مستخدم نشط. **الهدف/الدورة:** وعي تشغيلي وتوجيه العمل؛ قراءة مؤشرات/طوابير وروابط إلى السجلات.
- **المصدر والبيانات:** `../../modules/dashboard/application/dependencies.js`. كيانات مرجعية مرشحة: `read models متعددة`. الحالة النصية المستخرجة: AUTHORIZATION, AVAILABLE.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../modules/dashboard/application/dependencies.js` L5. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** قراءة/توجيه؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** اربط كل مؤشر بمصدر ونطاق وزمن ورابط filter مطابق؛ أظهر unavailable بصدق ولا تحوّل الصفر إلى بيانات مفقودة.
- **بطاقة الدليل (QC-ADP-07 candidate):** source=PARTIAL — shared document-review queue wired through the same dashboard read model and linked register filter. Live/populated/role/PG parity/query plan/AT/performance/UAT=NOT VERIFIED or BLOCKED; quality/reject/blocked reason sources remain withheld pending decisions. **تقييم الجودة:** NOT VERIFIED / NO-GO؛ الفحوص: QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-008, QC-PAGE-F-014.

### RT-TASK-001 — `/tasks`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/tasks/index.astro`؛ `permission-bound` (`required`)؛ مالك/مكلّف/مشرف. **الهدف/الدورة:** إدارة مهمة تشغيلية؛ إنشاء ثم تعيين وتفعيل وتحديث حالة.
- **المصدر والبيانات:** `../../modules/tasks/application/dependencies.js`, `../../modules/identity/application/admin-dependencies.js`. كيانات مرجعية مرشحة: `qc.tasks`. الحالة النصية المستخرجة: DRAFT, OPEN, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../modules/tasks/application/dependencies.js` L8، `../../modules/identity/application/admin-dependencies.js` L12؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-TASK-CREATE` L88. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Create task؛ `/tasks/new`, `/tasks/${task.id`.
- **قوة/مشكلة مرصودة:** حَيًّا: سجل واحد، فلاتر due/assignee/state، ترتيب وكثافة صفوف؛ أزرار bulk غير متاحة بوضوح. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **تحسين مسار مطلوب:** اعرض مالك المهمة والأولوية والموعد والحالة والنسخة والخطوة التالية مع سجل انتقالات واضح؛ فسّر UNSPECIFIED بلغة بشرية. **إغلاقه:** اختبار إنشاء ثم Activate/Start/Hold/Resume/Complete/Reopen وحالات الرفض للنطاق والنسخة القديمة؛ توافق السجل والتدقيق بعد كل خطوة. (`QC-PAGE-F-020` / `QC-ADP-17`).
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-020.

### RT-TASK-002 — `/tasks/new`
- **النوع/المنهج/السبب:** Form؛ تحليل نموذج ومنع الخطأ. يدخل المستخدم بيانات قد تنشئ سجلًا دائمًا.
- **الملف/الظهور/المستخدم:** `src/pages/tasks/new.astro`؛ `permission-bound` (`required`)؛ مالك/مكلّف/مشرف. **الهدف/الدورة:** إدارة مهمة تشغيلية؛ إنشاء ثم تعيين وتفعيل وتحديث حالة.
- **المصدر والبيانات:** قراءة عبر shared/use case أو صفحة ثابتة. كيانات مرجعية مرشحة: `qc.tasks`. الحالة النصية المستخرجة: UNSPECIFIED, POST.
- **أثر مصدر قابل للتتبع:** مفاتيح صلاحية مذكورة في الصفحة `PERM-TASK-CREATE` L16؛ استدعاء واجهة الإجراء `actions.tasks.createTask` L45، `actions.tasks.createTask` L78. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Save draft, Back to tasks؛ `/tasks`, `/tasks/`.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** افصل الحقول المصدرية عن المشتقة؛ وفّر اختيارًا/تعبئة مسبقة حيث يوجد سجل موثوق؛ اختبر required/server error/duplicate submit/unsaved.
- **تحسين مسار مطلوب:** اعرض مالك المهمة والأولوية والموعد والحالة والنسخة والخطوة التالية مع سجل انتقالات واضح؛ فسّر UNSPECIFIED بلغة بشرية. **إغلاقه:** اختبار إنشاء ثم Activate/Start/Hold/Resume/Complete/Reopen وحالات الرفض للنطاق والنسخة القديمة؛ توافق السجل والتدقيق بعد كل خطوة. (`QC-PAGE-F-020` / `QC-ADP-17`).
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015, QC-PAGE-F-020.

### RT-TASK-003 — `/tasks/[taskId]`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/tasks/[taskId].astro`؛ `permission-bound` (`required`)؛ مالك/مكلّف/مشرف. **الهدف/الدورة:** إدارة مهمة تشغيلية؛ إنشاء ثم تعيين وتفعيل وتحديث حالة.
- **المصدر والبيانات:** `../../modules/tasks/application/dependencies.js`, `../../modules/identity/application/admin-dependencies.js`. كيانات مرجعية مرشحة: `qc.tasks`. الحالة النصية المستخرجة: DRAFT, OPEN, IN_PROGRESS, ON_HOLD, COMPLETED, ACTIVATE, START, COMPLETE.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../modules/tasks/application/dependencies.js` L3، `../../modules/identity/application/admin-dependencies.js` L4؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-TASK-CREATE` L30، `PERM-TASK-EDIT` L30، `PERM-TASK-BLOCK` L30، `PERM-TASK-COMPLETE` L30، `PERM-TASK-REOPEN` L30؛ استدعاء واجهة الإجراء `actions.tasks.transition` L47؛ يوجد تمرير `expectedVersion` في الصفحة. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Activate, Start, Put on hold, Complete, Resume, Reopen؛ `/tasks`.
- **قوة/مشكلة مرصودة:** حَيًّا على سجل واحد: يظهر Draft ونسخة 1 وزر Activate؛ يظهر UNSPECIFIED للـPriority. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** أظهر الحالة والنسخة والسجل المرتبط والحدث التالي؛ اختبر صلاحيات الأفعال على use case لا على ظهور الزر.
- **تحسين مسار مطلوب:** اعرض مالك المهمة والأولوية والموعد والحالة والنسخة والخطوة التالية مع سجل انتقالات واضح؛ فسّر UNSPECIFIED بلغة بشرية. **إغلاقه:** اختبار إنشاء ثم Activate/Start/Hold/Resume/Complete/Reopen وحالات الرفض للنطاق والنسخة القديمة؛ توافق السجل والتدقيق بعد كل خطوة. (`QC-PAGE-F-020` / `QC-ADP-17`).
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-020.

### RT-QUAL-001 — `/quality`
- **النوع/المنهج/السبب:** Overview؛ دعم القرار ودلالة المؤشرات. الغرض تحديد ما يتطلب انتباهًا ووجهة الإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/quality/index.astro`؛ `permission-bound` (`required`)؛ QC/QMS ومكلفون. **الهدف/الدورة:** سلسلة Finding → NCR → RCA → CAPA؛ سجل → تحقيق → إجراء → فعالية → إغلاق.
- **المصدر والبيانات:** قراءة عبر shared/use case أو صفحة ثابتة. كيانات مرجعية مرشحة: `qc.findings; qc.ncrs; qc.rcas; qc.capas`. الحالة النصية المستخرجة: لم تُستخرج حالات نصية مباشرة؛ راجع use case.
- **أثر مصدر قابل للتتبع:** لا تُظهر الصفحة نفسها استدعاء `astro:actions` أو مفتاح `PERM-*`؛ افحص التوجيه والخادم قبل استنتاج الصلاحية. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** قراءة/توجيه؛ `/quality/findings`, `/quality/ncr`, `/quality/rca`, `/quality/capa`.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** اربط كل مؤشر بمصدر ونطاق وزمن ورابط filter مطابق؛ أظهر unavailable بصدق ولا تحوّل الصفر إلى بيانات مفقودة.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-014.

### RT-FIND-001 — `/quality/findings`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/quality/findings/index.astro`؛ `permission-bound` (`required`)؛ QC/QMS ومكلفون. **الهدف/الدورة:** سلسلة Finding → NCR → RCA → CAPA؛ سجل → تحقيق → إجراء → فعالية → إغلاق.
- **المصدر والبيانات:** `../../../modules/quality/findings/application/dependencies.js`, `../../../modules/identity/application/admin-dependencies.js`. كيانات مرجعية مرشحة: `qc.findings; qc.ncrs; qc.rcas; qc.capas`. الحالة النصية المستخرجة: DRAFT, OPEN, UNDER_REVIEW, CLOSED, VOID.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/quality/findings/application/dependencies.js` L5، `../../../modules/identity/application/admin-dependencies.js` L6. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Apply filter, Create finding؛ `/quality/findings/new`, `/quality/findings/${finding.id`.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-014.

### RT-FIND-002 — `/quality/findings/new`
- **النوع/المنهج/السبب:** Form؛ تحليل نموذج ومنع الخطأ. يدخل المستخدم بيانات قد تنشئ سجلًا دائمًا.
- **الملف/الظهور/المستخدم:** `src/pages/quality/findings/new.astro`؛ `permission-bound` (`required`)؛ QC/QMS ومكلفون. **الهدف/الدورة:** سلسلة Finding → NCR → RCA → CAPA؛ سجل → تحقيق → إجراء → فعالية → إغلاق.
- **المصدر والبيانات:** قراءة عبر shared/use case أو صفحة ثابتة. كيانات مرجعية مرشحة: `qc.findings; qc.ncrs; qc.rcas; qc.capas`. الحالة النصية المستخرجة: POST.
- **أثر مصدر قابل للتتبع:** استدعاء واجهة الإجراء `actions.findings.create` L41، `actions.findings.create` L74. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Save draft, Back to findings؛ `/quality/findings`, `/quality/findings/${record.id`.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** افصل الحقول المصدرية عن المشتقة؛ وفّر اختيارًا/تعبئة مسبقة حيث يوجد سجل موثوق؛ اختبر required/server error/duplicate submit/unsaved.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-015.

### RT-FIND-003 — `/quality/findings/[findingId]`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/quality/findings/[findingId].astro`؛ `permission-bound` (`required`)؛ QC/QMS ومكلفون. **الهدف/الدورة:** سلسلة Finding → NCR → RCA → CAPA؛ سجل → تحقيق → إجراء → فعالية → إغلاق.
- **المصدر والبيانات:** `../../../modules/quality/findings/application/dependencies.js`, `../../../modules/quality/findings/application/list-related-ncrs.js`. كيانات مرجعية مرشحة: `qc.findings; qc.ncrs; qc.rcas; qc.capas`. الحالة النصية المستخرجة: DRAFT, OPEN, UNDER_REVIEW, CLOSED.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/quality/findings/application/dependencies.js` L4، `../../../modules/quality/findings/application/list-related-ncrs.js` L5. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** قراءة/توجيه؛ `/quality/ncr/${ncr.id`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** أظهر الحالة والنسخة والسجل المرتبط والحدث التالي؛ اختبر صلاحيات الأفعال على use case لا على ظهور الزر.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-014.

### RT-NCR-001 — `/quality/ncr`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/quality/ncr/index.astro`؛ `permission-bound` (`required`)؛ QC/QMS ومكلفون. **الهدف/الدورة:** سلسلة Finding → NCR → RCA → CAPA؛ سجل → تحقيق → إجراء → فعالية → إغلاق.
- **المصدر والبيانات:** قراءة عبر shared/use case أو صفحة ثابتة. كيانات مرجعية مرشحة: `qc.findings; qc.ncrs; qc.rcas; qc.capas`. الحالة النصية المستخرجة: لم تُستخرج حالات نصية مباشرة؛ راجع use case.
- **أثر مصدر قابل للتتبع:** لا تُظهر الصفحة نفسها استدعاء `astro:actions` أو مفتاح `PERM-*`؛ افحص التوجيه والخادم قبل استنتاج الصلاحية. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** قراءة/توجيه؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** حَيًّا: إنشاء NCR المباشر معطل حتى اعتماد سياسة الإنشاء. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-014.

### RT-NCR-002 — `/quality/ncr/new`
- **النوع/المنهج/السبب:** Form؛ تحليل نموذج ومنع الخطأ. يدخل المستخدم بيانات قد تنشئ سجلًا دائمًا.
- **الملف/الظهور/المستخدم:** `src/pages/quality/ncr/new.astro`؛ `permission-bound` (`conditional`)؛ QC/QMS ومكلفون. **الهدف/الدورة:** سلسلة Finding → NCR → RCA → CAPA؛ سجل → تحقيق → إجراء → فعالية → إغلاق.
- **المصدر والبيانات:** قراءة عبر shared/use case أو صفحة ثابتة. كيانات مرجعية مرشحة: `qc.findings; qc.ncrs; qc.rcas; qc.capas`. الحالة النصية المستخرجة: لم تُستخرج حالات نصية مباشرة؛ راجع use case.
- **أثر مصدر قابل للتتبع:** لا تُظهر الصفحة نفسها استدعاء `astro:actions` أو مفتاح `PERM-*`؛ افحص التوجيه والخادم قبل استنتاج الصلاحية. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Open the NCR register, Open findings؛ `/quality/ncr`, `/quality/findings`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** افصل الحقول المصدرية عن المشتقة؛ وفّر اختيارًا/تعبئة مسبقة حيث يوجد سجل موثوق؛ اختبر required/server error/duplicate submit/unsaved.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-015.

### RT-NCR-003 — `/quality/ncr/[ncrId]`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/quality/ncr/[ncrId].astro`؛ `permission-bound` (`required`)؛ QC/QMS ومكلفون. **الهدف/الدورة:** سلسلة Finding → NCR → RCA → CAPA؛ سجل → تحقيق → إجراء → فعالية → إغلاق.
- **المصدر والبيانات:** `../../../modules/quality/ncr/application/dependencies.js`, `../../../modules/quality/capa/application/dependencies.js`, `../../../modules/quality/findings/application/list-findings-for-actor.js`. كيانات مرجعية مرشحة: `qc.findings; qc.ncrs; qc.rcas; qc.capas`. الحالة النصية المستخرجة: OPEN, UNDER_INVESTIGATION, RCA_IN_PROGRESS, CAPA_IN_PROGRESS, READY_FOR_CLOSURE, CLOSED.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/quality/ncr/application/dependencies.js` L4، `../../../modules/quality/capa/application/dependencies.js` L5، `../../../modules/quality/findings/application/list-findings-for-actor.js` L6. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** قراءة/توجيه؛ `/quality/findings/${sourceFinding.id`, `/quality/capa/${capa.id`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** أظهر الحالة والنسخة والسجل المرتبط والحدث التالي؛ اختبر صلاحيات الأفعال على use case لا على ظهور الزر.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-014.

### RT-RCA-001 — `/quality/rca`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/quality/rca/index.astro`؛ `permission-bound` (`conditional`)؛ QC/QMS ومكلفون. **الهدف/الدورة:** سلسلة Finding → NCR → RCA → CAPA؛ سجل → تحقيق → إجراء → فعالية → إغلاق.
- **المصدر والبيانات:** قراءة عبر shared/use case أو صفحة ثابتة. كيانات مرجعية مرشحة: `qc.findings; qc.ncrs; qc.rcas; qc.capas`. الحالة النصية المستخرجة: لم تُستخرج حالات نصية مباشرة؛ راجع use case.
- **أثر مصدر قابل للتتبع:** لا تُظهر الصفحة نفسها استدعاء `astro:actions` أو مفتاح `PERM-*`؛ افحص التوجيه والخادم قبل استنتاج الصلاحية. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** قراءة/توجيه؛ `/quality/ncr`.
- **قوة/مشكلة مرصودة:** حَيًّا: يوجّه المستخدم إلى NCR كبداية للسلسلة بدل RCA مستقل. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-014.

### RT-RCA-002 — `/quality/rca/[rcaId]`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/quality/rca/[rcaId].astro`؛ `permission-bound` (`required`)؛ QC/QMS ومكلفون. **الهدف/الدورة:** سلسلة Finding → NCR → RCA → CAPA؛ سجل → تحقيق → إجراء → فعالية → إغلاق.
- **المصدر والبيانات:** قراءة عبر shared/use case أو صفحة ثابتة. كيانات مرجعية مرشحة: `qc.findings; qc.ncrs; qc.rcas; qc.capas`. الحالة النصية المستخرجة: لم تُستخرج حالات نصية مباشرة؛ راجع use case.
- **أثر مصدر قابل للتتبع:** لا تُظهر الصفحة نفسها استدعاء `astro:actions` أو مفتاح `PERM-*`؛ افحص التوجيه والخادم قبل استنتاج الصلاحية. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** قراءة/توجيه؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** أظهر الحالة والنسخة والسجل المرتبط والحدث التالي؛ اختبر صلاحيات الأفعال على use case لا على ظهور الزر.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-014.

### RT-CAPA-001 — `/quality/capa`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/quality/capa/index.astro`؛ `permission-bound` (`required`)؛ QC/QMS ومكلفون. **الهدف/الدورة:** سلسلة Finding → NCR → RCA → CAPA؛ سجل → تحقيق → إجراء → فعالية → إغلاق.
- **المصدر والبيانات:** قراءة عبر shared/use case أو صفحة ثابتة. كيانات مرجعية مرشحة: `qc.findings; qc.ncrs; qc.rcas; qc.capas`. الحالة النصية المستخرجة: لم تُستخرج حالات نصية مباشرة؛ راجع use case.
- **أثر مصدر قابل للتتبع:** لا تُظهر الصفحة نفسها استدعاء `astro:actions` أو مفتاح `PERM-*`؛ افحص التوجيه والخادم قبل استنتاج الصلاحية. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** قراءة/توجيه؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** حَيًّا: الإغلاق مرفوض افتراضيًا حتى حسم صلاحية الإغلاق ودليل الفعالية. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-014.

### RT-CAPA-002 — `/quality/capa/new`
- **النوع/المنهج/السبب:** Form؛ تحليل نموذج ومنع الخطأ. يدخل المستخدم بيانات قد تنشئ سجلًا دائمًا.
- **الملف/الظهور/المستخدم:** `src/pages/quality/capa/new.astro`؛ `permission-bound` (`conditional`)؛ QC/QMS ومكلفون. **الهدف/الدورة:** سلسلة Finding → NCR → RCA → CAPA؛ سجل → تحقيق → إجراء → فعالية → إغلاق.
- **المصدر والبيانات:** قراءة عبر shared/use case أو صفحة ثابتة. كيانات مرجعية مرشحة: `qc.findings; qc.ncrs; qc.rcas; qc.capas`. الحالة النصية المستخرجة: لم تُستخرج حالات نصية مباشرة؛ راجع use case.
- **أثر مصدر قابل للتتبع:** لا تُظهر الصفحة نفسها استدعاء `astro:actions` أو مفتاح `PERM-*`؛ افحص التوجيه والخادم قبل استنتاج الصلاحية. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Open the CAPA register, Open NCR؛ `/quality/capa`, `/quality/ncr`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** افصل الحقول المصدرية عن المشتقة؛ وفّر اختيارًا/تعبئة مسبقة حيث يوجد سجل موثوق؛ اختبر required/server error/duplicate submit/unsaved.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-015.

### RT-CAPA-003 — `/quality/capa/[capaId]`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/quality/capa/[capaId].astro`؛ `permission-bound` (`required`)؛ QC/QMS ومكلفون. **الهدف/الدورة:** سلسلة Finding → NCR → RCA → CAPA؛ سجل → تحقيق → إجراء → فعالية → إغلاق.
- **المصدر والبيانات:** `../../../modules/quality/capa/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.findings; qc.ncrs; qc.rcas; qc.capas`. الحالة النصية المستخرجة: OPEN, IN_PROGRESS, AWAITING_VERIFICATION, EFFECTIVENESS_REVIEW, READY_FOR_CLOSURE, CLOSED.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/quality/capa/application/dependencies.js` L4؛ استدعاء واجهة الإجراء `actions.length` L24، `actions.capa.close` L55؛ يوجد تمرير `expectedVersion` في الصفحة. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Close CAPA؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** أظهر الحالة والنسخة والسجل المرتبط والحدث التالي؛ اختبر صلاحيات الأفعال على use case لا على ظهور الزر.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-014.

### RT-QUAR-001 — `/quarantine`
- **النوع/المنهج/السبب:** Overview؛ دعم القرار ودلالة المؤشرات. الغرض تحديد ما يتطلب انتباهًا ووجهة الإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/quarantine/index.astro`؛ `permission-bound` (`required`)؛ Receiving/Inspector/Supervisor/QCM. **الهدف/الدورة:** استلام وفحص وحجر وقرار release منفصل؛ استلام → فحص → مراجعة → release.
- **المصدر والبيانات:** `../../modules/quarantine/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.receiving_items; qc.inspection_reports; qc.inspection_templates`. الحالة النصية المستخرجة: AUTHORIZATION, CRITICAL, FAIL, WARNING.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../modules/quarantine/application/dependencies.js` L6. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** قراءة/توجيه؛ `/tasks`, `/quarantine/receiving`.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** اربط كل مؤشر بمصدر ونطاق وزمن ورابط filter مطابق؛ أظهر unavailable بصدق ولا تحوّل الصفر إلى بيانات مفقودة.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002, QC-PAGE-F-014.

### RT-REC-001 — `/quarantine/receiving`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/quarantine/receiving/index.astro`؛ `permission-bound` (`required`)؛ Receiving/Inspector/Supervisor/QCM. **الهدف/الدورة:** استلام وفحص وحجر وقرار release منفصل؛ استلام → فحص → مراجعة → release.
- **المصدر والبيانات:** `../../../modules/quarantine/application/dependencies.js`, `../../../modules/quarantine/receiving/application/receiving-filters.js`, `../../../modules/quarantine/receiving/application/presentation.js`. كيانات مرجعية مرشحة: `qc.receiving_items; qc.inspection_reports; qc.inspection_templates`. الحالة النصية المستخرجة: UNKNOWN_PARAMETER, NOT_RELEASED, RELEASE_PENDING, RELEASED, HOLD.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/quarantine/application/dependencies.js` L6، `../../../modules/quarantine/receiving/application/receiving-filters.js` L9، `../../../modules/quarantine/receiving/application/presentation.js` L13. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Create receiving item, Open, Create a receiving item؛ `/quarantine/receiving/new`, `/quarantine/receiving/${item.id`.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002, QC-PAGE-F-014.

### RT-REC-002 — `/quarantine/receiving/new`
- **النوع/المنهج/السبب:** Form؛ تحليل نموذج ومنع الخطأ. يدخل المستخدم بيانات قد تنشئ سجلًا دائمًا.
- **الملف/الظهور/المستخدم:** `src/pages/quarantine/receiving/new.astro`؛ `permission-bound` (`required`)؛ Receiving/Inspector/Supervisor/QCM. **الهدف/الدورة:** استلام وفحص وحجر وقرار release منفصل؛ استلام → فحص → مراجعة → release.
- **المصدر والبيانات:** `../../../modules/quarantine/receiving/application/presentation.js`. كيانات مرجعية مرشحة: `qc.receiving_items; qc.inspection_reports; qc.inspection_templates`. الحالة النصية المستخرجة: POST.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/quarantine/receiving/application/presentation.js` L14، `../../../modules/quarantine/receiving/application/presentation.js` L106؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-QUAR-CREATE` L18؛ استدعاء واجهة الإجراء `actions.quarantine.createReceiving` L59، `actions.quarantine.createReceiving` L108. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Create receiving item, Back to register؛ `/quarantine/receiving`.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** افصل الحقول المصدرية عن المشتقة؛ وفّر اختيارًا/تعبئة مسبقة حيث يوجد سجل موثوق؛ اختبر required/server error/duplicate submit/unsaved.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002, QC-PAGE-F-015.

### RT-REC-003 — `/quarantine/receiving/[receivingId]`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/quarantine/receiving/[receivingId].astro`؛ `permission-bound` (`required`)؛ Receiving/Inspector/Supervisor/QCM. **الهدف/الدورة:** استلام وفحص وحجر وقرار release منفصل؛ استلام → فحص → مراجعة → release.
- **المصدر والبيانات:** `../../../modules/quarantine/application/dependencies.js`, `../../../modules/quarantine/receiving/application/presentation.js`. كيانات مرجعية مرشحة: `qc.receiving_items; qc.inspection_reports; qc.inspection_templates`. الحالة النصية المستخرجة: READY_FOR_INSPECTION, UNDER_INSPECTION, DRAFT, SUBMITTED, UNDER_REVIEW, PENDING_QCM_APPROVAL, POST, CANCEL.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/quarantine/application/dependencies.js` L6، `../../../modules/quarantine/receiving/application/presentation.js` L7؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-QUAR-HOLD` L16، `PERM-QUAR-RELEASE` L17، `PERM-QUAR-EDIT` L18، `PERM-INSP-CREATE` L19؛ استدعاء واجهة الإجراء `actions.quarantine.holdReceiving` L69، `actions.quarantine.correctReceiving` L76، `actions.quarantine.transitionReceiving` L95، `actions.quarantine.createInspectionFromReceiving` L101؛ يوجد تمرير `expectedVersion` في الصفحة. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Create inspection, Start inspection, Release item, Place on HOLD, Void this receiving item, Apply correction؛ `/quarantine`, `/quarantine/receiving`, `/quarantine/inspections`, `/quarantine/inspections/${report.id`, `/quarantine/receiving/${item.id`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** أظهر الحالة والنسخة والسجل المرتبط والحدث التالي؛ اختبر صلاحيات الأفعال على use case لا على ظهور الزر.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002, QC-PAGE-F-014.

### RT-INSP-001 — `/quarantine/inspections`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/quarantine/inspections/index.astro`؛ `permission-bound` (`required`)؛ Receiving/Inspector/Supervisor/QCM. **الهدف/الدورة:** استلام وفحص وحجر وقرار release منفصل؛ استلام → فحص → مراجعة → release.
- **المصدر والبيانات:** `../../../modules/quarantine/application/dependencies.js`, `../../../modules/quarantine/inspection/application/inspection-result-options.js`, `../../../modules/identity/application/admin-dependencies.js`. كيانات مرجعية مرشحة: `qc.receiving_items; qc.inspection_reports; qc.inspection_templates`. الحالة النصية المستخرجة: DRAFT, SUBMITTED, UNDER_REVIEW, RETURNED, APPROVED, REJECTED, VOID.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/quarantine/application/dependencies.js` L5، `../../../modules/quarantine/inspection/application/inspection-result-options.js` L6، `../../../modules/identity/application/admin-dependencies.js` L8. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Apply filters, Open receiving register, Open the receiving register؛ `/quarantine/receiving`, `/quarantine/inspections/${inspection.id`.
- **قوة/مشكلة مرصودة:** حَيًّا: لا تقارير؛ توجّه حالة الصفر إلى سجل الاستلام. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002, QC-PAGE-F-014.

### RT-INSP-002 — `/quarantine/inspections/[inspectionId]`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/quarantine/inspections/[inspectionId]/index.astro`؛ `permission-bound` (`required`)؛ Receiving/Inspector/Supervisor/QCM. **الهدف/الدورة:** استلام وفحص وحجر وقرار release منفصل؛ استلام → فحص → مراجعة → release.
- **المصدر والبيانات:** `../../../../modules/quarantine/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.receiving_items; qc.inspection_reports; qc.inspection_templates`. الحالة النصية المستخرجة: DRAFT, RETURNED, SUBMITTED, UNDER_REVIEW.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../../modules/quarantine/application/dependencies.js` L4. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Open execution, Open review؛ `/quarantine`, `/quarantine/inspections`, `/quarantine/inspections/${inspection.id`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** أظهر الحالة والنسخة والسجل المرتبط والحدث التالي؛ اختبر صلاحيات الأفعال على use case لا على ظهور الزر.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002, QC-PAGE-F-014., QC-PAGE-F-028

### RT-INSP-003 — `/quarantine/inspections/[inspectionId]/execute`
- **النوع/المنهج/السبب:** Execution؛ تسلسل تشغيل وعوامل بشرية. إدخال القياس/نتيجة الفحص معرض للنقل الخاطئ وفقد السياق.
- **الملف/الظهور/المستخدم:** `src/pages/quarantine/inspections/[inspectionId]/execute.astro`؛ `permission-bound` (`required`)؛ Receiving/Inspector/Supervisor/QCM. **الهدف/الدورة:** استلام وفحص وحجر وقرار release منفصل؛ استلام → فحص → مراجعة → release.
- **المصدر والبيانات:** `../../../../modules/quarantine/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.receiving_items; qc.inspection_reports; qc.inspection_templates`. الحالة النصية المستخرجة: DRAFT, RETURNED, NUMERIC_MEASUREMENT, MULTI_MEASUREMENT, BOOLEAN_ACCEPTABILITY, REMARK_ONLY, NOT_APPLICABLE, PASS.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../../modules/quarantine/application/dependencies.js` L3؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-INSP-EDIT-DRAFT` L11، `PERM-INSP-SUBMIT` L12، `PERM-INSP-EDIT-DRAFT` L13؛ استدعاء واجهة الإجراء `actions.quarantine.recordInspectionResults` L82، `actions.quarantine.submitInspection` L104، `actions.quarantine.resumeInspection` L105؛ يوجد تمرير `expectedVersion` في الصفحة. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Save results, Submit for review, Resume for correction, Back to record؛ `/quarantine/inspections`, `/quarantine/inspections/${inspection.id`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** ثبّت سياق العينة/الوحدة/المعيار ومصدره قرب القيمة؛ اختبر إدخالًا خاطئًا واسترداد المسودة دون اختراع criterion.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002, QC-PAGE-F-015.

### RT-INSP-004 — `/quarantine/inspections/[inspectionId]/review`
- **النوع/المنهج/السبب:** Review؛ هندسة قرار وصلاحية. المراجع يحتاج أدلة وسياقًا قبل انتقال الحالة.
- **الملف/الظهور/المستخدم:** `src/pages/quarantine/inspections/[inspectionId]/review.astro`؛ `permission-bound` (`required`)؛ Receiving/Inspector/Supervisor/QCM. **الهدف/الدورة:** استلام وفحص وحجر وقرار release منفصل؛ استلام → فحص → مراجعة → release.
- **المصدر والبيانات:** `../../../../modules/quarantine/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.receiving_items; qc.inspection_reports; qc.inspection_templates`. الحالة النصية المستخرجة: UNDER_REVIEW, PENDING_QCM_APPROVAL, SUBMITTED, APPROVED, RETURNED, NOT_DETERMINED.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../../modules/quarantine/application/dependencies.js` L5؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-INSP-REVIEW` L12، `PERM-APR-REVIEW` L12، `PERM-INSP-APPROVE` L14، `PERM-INSP-APPROVE` L17، `PERM-APR-APPROVE` L18، `PERM-ESIG-SIGN` L18؛ استدعاء واجهة الإجراء `actions.quarantine.reviewInspection` L73، `actions.quarantine.approveInspection` L74، `actions.quarantine.finalApproveInspection` L88، `actions.quarantine.returnInspection` L107؛ يوجد تمرير `expectedVersion` في الصفحة. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Begin review, Supervisor approval — send to QCM, Reject inspection, QCM final approval — approve and lock, Reject at QCM stage, Return for correction؛ `/quarantine`, `/quarantine/inspections`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** اعرض الدليل والنسخة وصاحب القرار قبل التأكيد؛ اختبر SoD والتوقيع والتعارض ومواصلة العمل بعد الرفض.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002.

### RT-QUAR-002 — `/quarantine/admin`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/quarantine/admin/index.astro`؛ `permission-bound` (`required`)؛ Receiving/Inspector/Supervisor/QCM. **الهدف/الدورة:** استلام وفحص وحجر وقرار release منفصل؛ استلام → فحص → مراجعة → release.
- **المصدر والبيانات:** `../../../modules/quarantine/templates/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.receiving_items; qc.inspection_reports; qc.inspection_templates`. الحالة النصية المستخرجة: SUPERVISOR, MANAGER, SYSTEM_OWNER, AUTHORIZATION, POST, REVIEW, APPROVE, STOP.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/quarantine/templates/application/dependencies.js` L5؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-ADM-TEMPLATES` L12؛ استدعاء واجهة الإجراء `actions.quarantineTemplates.createTemplate` L208. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Create template, Back to Quarantine, Open؛ `/quarantine`, `/quarantine/admin/${t.id`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002, QC-PAGE-F-014.

### RT-LAB-001 — `/laboratory`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/laboratory/index.astro`؛ `permission-bound` (`required`)؛ فني مختبر/Supervisor/QCM. **الهدف/الدورة:** إنشاء وتنفيذ ومراجعة اختبارات ومسودات تقارير؛ قالب معتمد → عينة/قياس → مراجعة → اعتماد.
- **المصدر والبيانات:** قراءة عبر shared/use case أو صفحة ثابتة. كيانات مرجعية مرشحة: `qc.lab_tests; qc.lab_samples; qc.lab_measurements; qc.laboratory_report_drafts`. الحالة النصية المستخرجة: لم تُستخرج حالات نصية مباشرة؛ راجع use case.
- **أثر مصدر قابل للتتبع:** لا تُظهر الصفحة نفسها استدعاء `astro:actions` أو مفتاح `PERM-*`؛ افحص التوجيه والخادم قبل استنتاج الصلاحية. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** قراءة/توجيه؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005, QC-PAGE-F-014.

### RT-LAB-002 — `/laboratory/tests`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/laboratory/tests/index.astro`؛ `permission-bound` (`required`)؛ فني مختبر/Supervisor/QCM. **الهدف/الدورة:** إنشاء وتنفيذ ومراجعة اختبارات ومسودات تقارير؛ قالب معتمد → عينة/قياس → مراجعة → اعتماد.
- **المصدر والبيانات:** `../../../modules/laboratory/application/dependencies.js`, `../../../modules/identity/application/admin-dependencies.js`. كيانات مرجعية مرشحة: `qc.lab_tests; qc.lab_samples; qc.lab_measurements; qc.laboratory_report_drafts`. الحالة النصية المستخرجة: DRAFT, SUBMITTED, UNDER_REVIEW, PENDING_QCM_APPROVAL, RETURNED, APPROVED, REJECTED, VOID.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/laboratory/application/dependencies.js` L11، `../../../modules/identity/application/admin-dependencies.js` L14. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Create laboratory test؛ `/laboratory/report-templates`, `/laboratory/tests/new`, `/laboratory/tests/${test.id`.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005, QC-PAGE-F-014.

### RT-LAB-003 — `/laboratory/tests/new`
- **النوع/المنهج/السبب:** Form؛ تحليل نموذج ومنع الخطأ. يدخل المستخدم بيانات قد تنشئ سجلًا دائمًا.
- **الملف/الظهور/المستخدم:** `src/pages/laboratory/tests/new.astro`؛ `permission-bound` (`required`)؛ فني مختبر/Supervisor/QCM. **الهدف/الدورة:** إنشاء وتنفيذ ومراجعة اختبارات ومسودات تقارير؛ قالب معتمد → عينة/قياس → مراجعة → اعتماد.
- **المصدر والبيانات:** `../../../modules/laboratory/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.lab_tests; qc.lab_samples; qc.lab_measurements; qc.laboratory_report_drafts`. الحالة النصية المستخرجة: POST.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/laboratory/application/dependencies.js` L17؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-LAB-CREATE` L21؛ استدعاء واجهة الإجراء `actions.laboratory.create` L82، `actions.laboratory.create` L117. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Save draft, Back to laboratory tests؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** حَيًّا: لا يوجد قالب معتمد في النطاق؛ إنشاء الاختبار لا يكتمل. لا قالب معتمد في النطاق الحي؛ الإدخال العلمي لا يبدأ.
- **التوصية والتصميم:** افصل الحقول المصدرية عن المشتقة؛ وفّر اختيارًا/تعبئة مسبقة حيث يوجد سجل موثوق؛ اختبر required/server error/duplicate submit/unsaved.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005, QC-PAGE-F-015.

### RT-LAB-009 — `/laboratory/report-templates`
- **النوع/المنهج/السبب:** Draft/print؛ نقل بيانات وتحذير اعتماد. النص المنقول والطباعة قد يُفهمان خطأ كاعتماد رسمي.
- **الملف/الظهور/المستخدم:** `src/pages/laboratory/report-templates.astro`؛ `permission-bound` (`required`)؛ فني مختبر/Supervisor/QCM. **الهدف/الدورة:** إنشاء وتنفيذ ومراجعة اختبارات ومسودات تقارير؛ قالب معتمد → عينة/قياس → مراجعة → اعتماد.
- **المصدر والبيانات:** `../../modules/laboratory/application/report-template-form.js`, `../../modules/laboratory/application/report-drafts.js`. كيانات مرجعية مرشحة: `qc.lab_tests; qc.lab_samples; qc.lab_measurements; qc.laboratory_report_drafts`. الحالة النصية المستخرجة: ACTIVE, GLOBAL, OWN, PRESSURE_DECAY, SUBATMOSPHERIC_AIR_LEAKAGE, POST, PASS, FAIL.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../modules/laboratory/application/report-template-form.js` L6، `../../modules/laboratory/application/report-drafts.js` L7؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-LAB-VIEW` L13، `PERM-LAB-CREATE` L14، `PERM-LAB-EDIT-DRAFT` L39، `PERM-LAB-EDIT-DRAFT` L117؛ يوجد تمرير `expectedVersion` في الصفحة. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Print report, Save draft, Back to draft, Open print view؛ `/laboratory/tests`.
- **قوة/مشكلة مرصودة:** حَيًّا: الحساب الحالي لا يملك إنشاء مسودة؛ الكود يفصل المسودة عن الاعتماد ويحدد 12 عينة. منع إنشاء مسودة لحساب المالك حيًا؛ سبب grant أو schema يحتاج تشخيصًا مأمونًا.
- **التوصية والتصميم:** راجع المهمة الأساسية واللغة والاسترداد وإتاحة لوحة المفاتيح، مع عدم توسيع السلطة.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005, QC-PAGE-F-006, QC-PAGE-F-015.

### RT-LAB-004 — `/laboratory/tests/[labTestId]`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/laboratory/tests/[labTestId]/index.astro`؛ `permission-bound` (`required`)؛ فني مختبر/Supervisor/QCM. **الهدف/الدورة:** إنشاء وتنفيذ ومراجعة اختبارات ومسودات تقارير؛ قالب معتمد → عينة/قياس → مراجعة → اعتماد.
- **المصدر والبيانات:** `../../../../modules/laboratory/application/dependencies.js`, `../../../../modules/laboratory/application/get-source-receiving.js`. كيانات مرجعية مرشحة: `qc.lab_tests; qc.lab_samples; qc.lab_measurements; qc.laboratory_report_drafts`. الحالة النصية المستخرجة: DRAFT, SUBMITTED, UNDER_REVIEW, NOT_DETERMINED.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../../modules/laboratory/application/dependencies.js` L2، `../../../../modules/laboratory/application/get-source-receiving.js` L2؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-LAB-RETEST` L7، `PERM-LAB-AUTHORIZE-RETEST` L7، `PERM-LAB-EDIT-DRAFT` L10، `PERM-LAB-REVIEW` L11، `PERM-APR-REVIEW` L11. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Open execution workspace, Open review workspace؛ `/laboratory/tests/${test.id`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** أظهر الحالة والنسخة والسجل المرتبط والحدث التالي؛ اختبر صلاحيات الأفعال على use case لا على ظهور الزر.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005, QC-PAGE-F-014., QC-PAGE-F-028

### RT-LAB-005 — `/laboratory/tests/[labTestId]/execute`
- **النوع/المنهج/السبب:** Execution؛ تسلسل تشغيل وعوامل بشرية. إدخال القياس/نتيجة الفحص معرض للنقل الخاطئ وفقد السياق.
- **الملف/الظهور/المستخدم:** `src/pages/laboratory/tests/[labTestId]/execute.astro`؛ `permission-bound` (`required`)؛ فني مختبر/Supervisor/QCM. **الهدف/الدورة:** إنشاء وتنفيذ ومراجعة اختبارات ومسودات تقارير؛ قالب معتمد → عينة/قياس → مراجعة → اعتماد.
- **المصدر والبيانات:** `../../../../modules/laboratory/application/dependencies.js`, `../../../../modules/laboratory/application/lab-presentation.js`. كيانات مرجعية مرشحة: `qc.lab_tests; qc.lab_samples; qc.lab_measurements; qc.laboratory_report_drafts`. الحالة النصية المستخرجة: DRAFT, BOOLEAN, NUMERIC.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../../modules/laboratory/application/dependencies.js` L4، `../../../../modules/laboratory/application/lab-presentation.js` L5؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-LAB-EDIT-DRAFT` L19، `PERM-LAB-SUBMIT` L20؛ استدعاء واجهة الإجراء `actions.laboratory.saveMeasurements` L231، `actions.laboratory.submit` L268؛ يوجد تمرير `expectedVersion` في الصفحة. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Save observations, Submit for review؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** ثبّت سياق العينة/الوحدة/المعيار ومصدره قرب القيمة؛ اختبر إدخالًا خاطئًا واسترداد المسودة دون اختراع criterion.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005, QC-PAGE-F-015., QC-PAGE-F-029

### RT-LAB-006 — `/laboratory/tests/[labTestId]/review`
- **النوع/المنهج/السبب:** Review؛ هندسة قرار وصلاحية. المراجع يحتاج أدلة وسياقًا قبل انتقال الحالة.
- **الملف/الظهور/المستخدم:** `src/pages/laboratory/tests/[labTestId]/review.astro`؛ `permission-bound` (`required`)؛ فني مختبر/Supervisor/QCM. **الهدف/الدورة:** إنشاء وتنفيذ ومراجعة اختبارات ومسودات تقارير؛ قالب معتمد → عينة/قياس → مراجعة → اعتماد.
- **المصدر والبيانات:** `../../../../modules/laboratory/application/dependencies.js`, `../../../../modules/laboratory/application/lab-presentation.js`. كيانات مرجعية مرشحة: `qc.lab_tests; qc.lab_samples; qc.lab_measurements; qc.laboratory_report_drafts`. الحالة النصية المستخرجة: UNDER_REVIEW, PENDING_QCM_APPROVAL.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../../modules/laboratory/application/dependencies.js` L4، `../../../../modules/laboratory/application/lab-presentation.js` L5؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-LAB-APPROVE` L17، `PERM-APR-APPROVE` L17، `PERM-ESIG-SIGN` L18، `PERM-LAB-APPROVE` L21، `PERM-APR-APPROVE` L22، `PERM-ESIG-SIGN` L22؛ استدعاء واجهة الإجراء `actions.laboratory.approve` L190، `actions.laboratory.returnTest` L191، `actions.laboratory.finalApprove` L192؛ يوجد تمرير `expectedVersion` في الصفحة. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Supervisor approval — send to QCM, Return for correction, QCM final approval — approve and lock, Return at QCM stage؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** اعرض الدليل والنسخة وصاحب القرار قبل التأكيد؛ اختبر SoD والتوقيع والتعارض ومواصلة العمل بعد الرفض.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005.

### RT-LAB-007 — `/laboratory/tests/[labTestId]/retests/new`
- **النوع/المنهج/السبب:** Form؛ تحليل نموذج ومنع الخطأ. يدخل المستخدم بيانات قد تنشئ سجلًا دائمًا.
- **الملف/الظهور/المستخدم:** `src/pages/laboratory/tests/[labTestId]/retests/new.astro`؛ `permission-bound` (`required`)؛ فني مختبر/Supervisor/QCM. **الهدف/الدورة:** إنشاء وتنفيذ ومراجعة اختبارات ومسودات تقارير؛ قالب معتمد → عينة/قياس → مراجعة → اعتماد.
- **المصدر والبيانات:** قراءة عبر shared/use case أو صفحة ثابتة. كيانات مرجعية مرشحة: `qc.lab_tests; qc.lab_samples; qc.lab_measurements; qc.laboratory_report_drafts`. الحالة النصية المستخرجة: لم تُستخرج حالات نصية مباشرة؛ راجع use case.
- **أثر مصدر قابل للتتبع:** لا تُظهر الصفحة نفسها استدعاء `astro:actions` أو مفتاح `PERM-*`؛ افحص التوجيه والخادم قبل استنتاج الصلاحية. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** الإجراء مشروط في use case؛ يلزم إثبات حيوي؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** افصل الحقول المصدرية عن المشتقة؛ وفّر اختيارًا/تعبئة مسبقة حيث يوجد سجل موثوق؛ اختبر required/server error/duplicate submit/unsaved.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005, QC-PAGE-F-015.

### RT-ASSET-001 — `/assets`
- **النوع/المنهج/السبب:** Overview؛ دعم القرار ودلالة المؤشرات. الغرض تحديد ما يتطلب انتباهًا ووجهة الإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/assets/index.astro`؛ `permission-bound` (`required`)؛ مالك أصل/فني/مراجع. **الهدف/الدورة:** تأهيل معدات ومعايرة وصيانة؛ معدات → معايرة/صيانة → أهلية استخدام.
- **المصدر والبيانات:** `../../modules/assets/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.equipment; qc.calibration_records; qc.maintenance_records`. الحالة النصية المستخرجة: لم تُستخرج حالات نصية مباشرة؛ راجع use case.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../modules/assets/application/dependencies.js` L4. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** قراءة/توجيه؛ `/assets/equipment`, `/assets/calibrations`, `/assets/maintenance`.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** اربط كل مؤشر بمصدر ونطاق وزمن ورابط filter مطابق؛ أظهر unavailable بصدق ولا تحوّل الصفر إلى بيانات مفقودة.
- **تحسين مسار مطلوب:** أظهر أهلية المعدة وسبب المنع وتاريخ المعايرة/الصيانة في موضع اختيارها؛ لا تطلب إعادة إدخال معرف موجود. **إغلاقه:** معدة مؤهلة وأخرى منتهية المعايرة وثالثة تحت الصيانة؛ رفض خادمي للاستخدام غير المؤهل ولقطة مصدر مجمدة في الاختبار. (`QC-PAGE-F-022` / `QC-ADP-19`).
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-022.

### RT-EQUIP-001 — `/assets/equipment`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/assets/equipment/index.astro`؛ `permission-bound` (`required`)؛ مالك أصل/فني/مراجع. **الهدف/الدورة:** تأهيل معدات ومعايرة وصيانة؛ معدات → معايرة/صيانة → أهلية استخدام.
- **المصدر والبيانات:** `../../../modules/assets/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.equipment; qc.calibration_records; qc.maintenance_records`. الحالة النصية المستخرجة: DRAFT, ACTIVE, OUT_OF_SERVICE, UNDER_MAINTENANCE, DECOMMISSIONED.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/assets/application/dependencies.js` L7. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Add equipment؛ `/assets/equipment/new`, `/assets/equipment/${item.id`.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **تحسين مسار مطلوب:** أظهر أهلية المعدة وسبب المنع وتاريخ المعايرة/الصيانة في موضع اختيارها؛ لا تطلب إعادة إدخال معرف موجود. **إغلاقه:** معدة مؤهلة وأخرى منتهية المعايرة وثالثة تحت الصيانة؛ رفض خادمي للاستخدام غير المؤهل ولقطة مصدر مجمدة في الاختبار. (`QC-PAGE-F-022` / `QC-ADP-19`).
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-022.

### RT-EQUIP-002 — `/assets/equipment/new`
- **النوع/المنهج/السبب:** Form؛ تحليل نموذج ومنع الخطأ. يدخل المستخدم بيانات قد تنشئ سجلًا دائمًا.
- **الملف/الظهور/المستخدم:** `src/pages/assets/equipment/new.astro`؛ `permission-bound` (`conditional`)؛ مالك أصل/فني/مراجع. **الهدف/الدورة:** تأهيل معدات ومعايرة وصيانة؛ معدات → معايرة/صيانة → أهلية استخدام.
- **المصدر والبيانات:** قراءة عبر shared/use case أو صفحة ثابتة. كيانات مرجعية مرشحة: `qc.equipment; qc.calibration_records; qc.maintenance_records`. الحالة النصية المستخرجة: POST.
- **أثر مصدر قابل للتتبع:** مفاتيح صلاحية مذكورة في الصفحة `PERM-EQP-CREATE` L16؛ استدعاء واجهة الإجراء `actions.assets.createEquipment` L45، `actions.assets.createEquipment` L91. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Create draft, Back to equipment؛ `/assets/equipment`.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** افصل الحقول المصدرية عن المشتقة؛ وفّر اختيارًا/تعبئة مسبقة حيث يوجد سجل موثوق؛ اختبر required/server error/duplicate submit/unsaved.
- **تحسين مسار مطلوب:** أظهر أهلية المعدة وسبب المنع وتاريخ المعايرة/الصيانة في موضع اختيارها؛ لا تطلب إعادة إدخال معرف موجود. **إغلاقه:** معدة مؤهلة وأخرى منتهية المعايرة وثالثة تحت الصيانة؛ رفض خادمي للاستخدام غير المؤهل ولقطة مصدر مجمدة في الاختبار. (`QC-PAGE-F-022` / `QC-ADP-19`).
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015, QC-PAGE-F-022.

### RT-EQUIP-003 — `/assets/equipment/[equipmentId]`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/assets/equipment/[equipmentId].astro`؛ `permission-bound` (`required`)؛ مالك أصل/فني/مراجع. **الهدف/الدورة:** تأهيل معدات ومعايرة وصيانة؛ معدات → معايرة/صيانة → أهلية استخدام.
- **المصدر والبيانات:** `../../../modules/assets/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.equipment; qc.calibration_records; qc.maintenance_records`. الحالة النصية المستخرجة: لم تُستخرج حالات نصية مباشرة؛ راجع use case.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/assets/application/dependencies.js` L2. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** قراءة/توجيه؛ `/assets`, `/assets/equipment`, `/assets/calibrations/new`, `/assets/calibrations`, `/assets/calibrations/${item.id`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** أظهر الحالة والنسخة والسجل المرتبط والحدث التالي؛ اختبر صلاحيات الأفعال على use case لا على ظهور الزر.
- **تحسين مسار مطلوب:** أظهر أهلية المعدة وسبب المنع وتاريخ المعايرة/الصيانة في موضع اختيارها؛ لا تطلب إعادة إدخال معرف موجود. **إغلاقه:** معدة مؤهلة وأخرى منتهية المعايرة وثالثة تحت الصيانة؛ رفض خادمي للاستخدام غير المؤهل ولقطة مصدر مجمدة في الاختبار. (`QC-PAGE-F-022` / `QC-ADP-19`).
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-022.

### RT-CAL-001 — `/assets/calibrations`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/assets/calibrations/index.astro`؛ `permission-bound` (`required`)؛ مالك أصل/فني/مراجع. **الهدف/الدورة:** تأهيل معدات ومعايرة وصيانة؛ معدات → معايرة/صيانة → أهلية استخدام.
- **المصدر والبيانات:** `../../../modules/assets/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.equipment; qc.calibration_records; qc.maintenance_records`. الحالة النصية المستخرجة: DRAFT, SCHEDULED, SUBMITTED, APPROVED, CURRENT, DUE, OVERDUE, COMPLETED.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/assets/application/dependencies.js` L7. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Add calibration record؛ `/assets/calibrations/new`, `/assets/calibrations/${record.id`, `/assets/equipment/${record.equipmentId`.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **تحسين مسار مطلوب:** أظهر أهلية المعدة وسبب المنع وتاريخ المعايرة/الصيانة في موضع اختيارها؛ لا تطلب إعادة إدخال معرف موجود. **إغلاقه:** معدة مؤهلة وأخرى منتهية المعايرة وثالثة تحت الصيانة؛ رفض خادمي للاستخدام غير المؤهل ولقطة مصدر مجمدة في الاختبار. (`QC-PAGE-F-022` / `QC-ADP-19`).
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-022.

### RT-CAL-002 — `/assets/calibrations/new`
- **النوع/المنهج/السبب:** Form؛ تحليل نموذج ومنع الخطأ. يدخل المستخدم بيانات قد تنشئ سجلًا دائمًا.
- **الملف/الظهور/المستخدم:** `src/pages/assets/calibrations/new.astro`؛ `permission-bound` (`conditional`)؛ مالك أصل/فني/مراجع. **الهدف/الدورة:** تأهيل معدات ومعايرة وصيانة؛ معدات → معايرة/صيانة → أهلية استخدام.
- **المصدر والبيانات:** `../../../modules/assets/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.equipment; qc.calibration_records; qc.maintenance_records`. الحالة النصية المستخرجة: POST.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/assets/application/dependencies.js` L18؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-CAL-CREATE` L20، `PERM-EQP-VIEW` L34؛ استدعاء واجهة الإجراء `actions.assets.createCalibration` L89، `actions.assets.createCalibration` L132. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Create draft, Back to calibrations, Create equipment, Create the equipment first؛ `/assets/equipment/new`.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** افصل الحقول المصدرية عن المشتقة؛ وفّر اختيارًا/تعبئة مسبقة حيث يوجد سجل موثوق؛ اختبر required/server error/duplicate submit/unsaved.
- **تحسين مسار مطلوب:** أظهر أهلية المعدة وسبب المنع وتاريخ المعايرة/الصيانة في موضع اختيارها؛ لا تطلب إعادة إدخال معرف موجود. **إغلاقه:** معدة مؤهلة وأخرى منتهية المعايرة وثالثة تحت الصيانة؛ رفض خادمي للاستخدام غير المؤهل ولقطة مصدر مجمدة في الاختبار. (`QC-PAGE-F-022` / `QC-ADP-19`).
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015, QC-PAGE-F-022.

### RT-CAL-003 — `/assets/calibrations/[calibrationId]`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/assets/calibrations/[calibrationId].astro`؛ `permission-bound` (`required`)؛ مالك أصل/فني/مراجع. **الهدف/الدورة:** تأهيل معدات ومعايرة وصيانة؛ معدات → معايرة/صيانة → أهلية استخدام.
- **المصدر والبيانات:** `../../../modules/assets/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.equipment; qc.calibration_records; qc.maintenance_records`. الحالة النصية المستخرجة: DRAFT, SUBMITTED, APPROVED, DUE, OVERDUE.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/assets/application/dependencies.js` L2. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** قراءة/توجيه؛ `/assets`, `/assets/calibrations`, `/assets/equipment/${record.equipmentId`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** أظهر الحالة والنسخة والسجل المرتبط والحدث التالي؛ اختبر صلاحيات الأفعال على use case لا على ظهور الزر.
- **تحسين مسار مطلوب:** أظهر أهلية المعدة وسبب المنع وتاريخ المعايرة/الصيانة في موضع اختيارها؛ لا تطلب إعادة إدخال معرف موجود. **إغلاقه:** معدة مؤهلة وأخرى منتهية المعايرة وثالثة تحت الصيانة؛ رفض خادمي للاستخدام غير المؤهل ولقطة مصدر مجمدة في الاختبار. (`QC-PAGE-F-022` / `QC-ADP-19`).
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-022.

### RT-MAINT-001 — `/assets/maintenance`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/assets/maintenance/index.astro`؛ `permission-bound` (`required`)؛ مالك أصل/فني/مراجع. **الهدف/الدورة:** تأهيل معدات ومعايرة وصيانة؛ معدات → معايرة/صيانة → أهلية استخدام.
- **المصدر والبيانات:** `../../../modules/assets/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.equipment; qc.calibration_records; qc.maintenance_records`. الحالة النصية المستخرجة: DRAFT, PLANNED, IN_PROGRESS, COMPLETED, CANCELLED, VOID.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/assets/application/dependencies.js` L7. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Add maintenance record؛ `/assets/maintenance/new`, `/assets/maintenance/${record.id`, `/assets/equipment/${record.equipmentId`.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **تحسين مسار مطلوب:** أظهر أهلية المعدة وسبب المنع وتاريخ المعايرة/الصيانة في موضع اختيارها؛ لا تطلب إعادة إدخال معرف موجود. **إغلاقه:** معدة مؤهلة وأخرى منتهية المعايرة وثالثة تحت الصيانة؛ رفض خادمي للاستخدام غير المؤهل ولقطة مصدر مجمدة في الاختبار. (`QC-PAGE-F-022` / `QC-ADP-19`).
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-022.

### RT-MAINT-002 — `/assets/maintenance/new`
- **النوع/المنهج/السبب:** Form؛ تحليل نموذج ومنع الخطأ. يدخل المستخدم بيانات قد تنشئ سجلًا دائمًا.
- **الملف/الظهور/المستخدم:** `src/pages/assets/maintenance/new.astro`؛ `permission-bound` (`conditional`)؛ مالك أصل/فني/مراجع. **الهدف/الدورة:** تأهيل معدات ومعايرة وصيانة؛ معدات → معايرة/صيانة → أهلية استخدام.
- **المصدر والبيانات:** `../../../modules/assets/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.equipment; qc.calibration_records; qc.maintenance_records`. الحالة النصية المستخرجة: POST.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/assets/application/dependencies.js` L18؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-MNT-CREATE` L20، `PERM-EQP-VIEW` L34؛ استدعاء واجهة الإجراء `actions.assets.createMaintenance` L88، `actions.assets.createMaintenance` L129. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Create draft, Back to maintenance, Create equipment, Create the equipment first؛ `/assets/equipment/new`.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** افصل الحقول المصدرية عن المشتقة؛ وفّر اختيارًا/تعبئة مسبقة حيث يوجد سجل موثوق؛ اختبر required/server error/duplicate submit/unsaved.
- **تحسين مسار مطلوب:** أظهر أهلية المعدة وسبب المنع وتاريخ المعايرة/الصيانة في موضع اختيارها؛ لا تطلب إعادة إدخال معرف موجود. **إغلاقه:** معدة مؤهلة وأخرى منتهية المعايرة وثالثة تحت الصيانة؛ رفض خادمي للاستخدام غير المؤهل ولقطة مصدر مجمدة في الاختبار. (`QC-PAGE-F-022` / `QC-ADP-19`).
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015, QC-PAGE-F-022.

### RT-MAINT-003 — `/assets/maintenance/[maintenanceId]`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/assets/maintenance/[maintenanceId].astro`؛ `permission-bound` (`required`)؛ مالك أصل/فني/مراجع. **الهدف/الدورة:** تأهيل معدات ومعايرة وصيانة؛ معدات → معايرة/صيانة → أهلية استخدام.
- **المصدر والبيانات:** `../../../modules/assets/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.equipment; qc.calibration_records; qc.maintenance_records`. الحالة النصية المستخرجة: لم تُستخرج حالات نصية مباشرة؛ راجع use case.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/assets/application/dependencies.js` L2. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** قراءة/توجيه؛ `/assets`, `/assets/maintenance`, `/assets/equipment/${record.equipmentId`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** أظهر الحالة والنسخة والسجل المرتبط والحدث التالي؛ اختبر صلاحيات الأفعال على use case لا على ظهور الزر.
- **تحسين مسار مطلوب:** أظهر أهلية المعدة وسبب المنع وتاريخ المعايرة/الصيانة في موضع اختيارها؛ لا تطلب إعادة إدخال معرف موجود. **إغلاقه:** معدة مؤهلة وأخرى منتهية المعايرة وثالثة تحت الصيانة؛ رفض خادمي للاستخدام غير المؤهل ولقطة مصدر مجمدة في الاختبار. (`QC-PAGE-F-022` / `QC-ADP-19`).
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-022.

### RT-DOC-001 — `/documents`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/documents/index.astro`؛ `permission-bound` (`required`)؛ مالك مستند/مراجع/QCM. **الهدف/الدورة:** هوية مستند ونسخة ومراجعة؛ إنشاء → نسخة → مراجعة → فعالية.
- **المصدر والبيانات:** `../../modules/documents/application/dependencies.js`, `../../modules/identity/application/admin-dependencies.js`. كيانات مرجعية مرشحة: `qc.document_identities; qc.document_versions`. الحالة النصية المستخرجة: لم تُستخرج حالات نصية مباشرة؛ راجع use case.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../modules/documents/application/dependencies.js` L4، `../../modules/identity/application/admin-dependencies.js` L5؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-DOC-CREATE` L13. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Filter, Create document, Create a document identity؛ `/documents/new`, `/documents/${document.id`.
- **قوة/مشكلة مرصودة:** حَيًّا: لا مستندات في النطاق؛ إنشاء الهوية متاح كمسار مستقل. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **تحسين مسار مطلوب:** أظهر النسخة الفعالة ومصدرها وتاريخها وماذا يستخدمها، وافصل المسودة عن النسخة المعتمدة مع سبب الإرجاع. **إغلاقه:** نسختان مع انتقال فعالية؛ سجل يستخدم النسخة الصحيحة المجمدة، ورفض تعديل/حذف نسخة معتمدة أو توقيع غير مخول. (`QC-PAGE-F-023` / `QC-ADP-20`).
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-023.

### RT-DOC-002 — `/documents/new`
- **النوع/المنهج/السبب:** Form؛ تحليل نموذج ومنع الخطأ. يدخل المستخدم بيانات قد تنشئ سجلًا دائمًا.
- **الملف/الظهور/المستخدم:** `src/pages/documents/new.astro`؛ `permission-bound` (`required`)؛ مالك مستند/مراجع/QCM. **الهدف/الدورة:** هوية مستند ونسخة ومراجعة؛ إنشاء → نسخة → مراجعة → فعالية.
- **المصدر والبيانات:** `../../modules/documents/application/document-vocabulary.js`. كيانات مرجعية مرشحة: `qc.document_identities; qc.document_versions`. الحالة النصية المستخرجة: POST.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../modules/documents/application/document-vocabulary.js` L13؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-DOC-CREATE` L17؛ استدعاء واجهة الإجراء `actions.documents.create` L45، `actions.documents.create` L85. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Create document, Back to library؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** افصل الحقول المصدرية عن المشتقة؛ وفّر اختيارًا/تعبئة مسبقة حيث يوجد سجل موثوق؛ اختبر required/server error/duplicate submit/unsaved.
- **تحسين مسار مطلوب:** أظهر النسخة الفعالة ومصدرها وتاريخها وماذا يستخدمها، وافصل المسودة عن النسخة المعتمدة مع سبب الإرجاع. **إغلاقه:** نسختان مع انتقال فعالية؛ سجل يستخدم النسخة الصحيحة المجمدة، ورفض تعديل/حذف نسخة معتمدة أو توقيع غير مخول. (`QC-PAGE-F-023` / `QC-ADP-20`).
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015, QC-PAGE-F-023.

### RT-DOC-003 — `/documents/[documentId]`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/documents/[documentId]/index.astro`؛ `permission-bound` (`required`)؛ مالك مستند/مراجع/QCM. **الهدف/الدورة:** هوية مستند ونسخة ومراجعة؛ إنشاء → نسخة → مراجعة → فعالية.
- **المصدر والبيانات:** `../../../modules/documents/application/dependencies.js`, `../../../modules/identity/application/admin-dependencies.js`. كيانات مرجعية مرشحة: `qc.document_identities; qc.document_versions`. الحالة النصية المستخرجة: EFFECTIVE, IN_REVIEW, REVIEW, APPROVED, SUPERSEDED, VOID, DRAFT.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/documents/application/dependencies.js` L4، `../../../modules/identity/application/admin-dependencies.js` L6؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-DOC-CREATE` L26، `PERM-DOC-REVISE` L26. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Create revision؛ `/documents`, `/documents/${document.id`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** أظهر الحالة والنسخة والسجل المرتبط والحدث التالي؛ اختبر صلاحيات الأفعال على use case لا على ظهور الزر.
- **تحسين مسار مطلوب:** أظهر النسخة الفعالة ومصدرها وتاريخها وماذا يستخدمها، وافصل المسودة عن النسخة المعتمدة مع سبب الإرجاع. **إغلاقه:** نسختان مع انتقال فعالية؛ سجل يستخدم النسخة الصحيحة المجمدة، ورفض تعديل/حذف نسخة معتمدة أو توقيع غير مخول. (`QC-PAGE-F-023` / `QC-ADP-20`).
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-023.

### RT-DOC-004 — `/documents/[documentId]/versions/new`
- **النوع/المنهج/السبب:** Form؛ تحليل نموذج ومنع الخطأ. يدخل المستخدم بيانات قد تنشئ سجلًا دائمًا.
- **الملف/الظهور/المستخدم:** `src/pages/documents/[documentId]/versions/new.astro`؛ `permission-bound` (`required`)؛ مالك مستند/مراجع/QCM. **الهدف/الدورة:** هوية مستند ونسخة ومراجعة؛ إنشاء → نسخة → مراجعة → فعالية.
- **المصدر والبيانات:** `../../../../modules/documents/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.document_identities; qc.document_versions`. الحالة النصية المستخرجة: POST.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../../modules/documents/application/dependencies.js` L3؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-DOC-CREATE` L9، `PERM-DOC-REVISE` L9؛ استدعاء واجهة الإجراء `actions.documents.createVersion` L19، `actions.documents.createVersion` L46. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Create draft version, Back to document؛ `/documents/${document.id`, `/documents/${form.dataset.documentId`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** افصل الحقول المصدرية عن المشتقة؛ وفّر اختيارًا/تعبئة مسبقة حيث يوجد سجل موثوق؛ اختبر required/server error/duplicate submit/unsaved.
- **تحسين مسار مطلوب:** أظهر النسخة الفعالة ومصدرها وتاريخها وماذا يستخدمها، وافصل المسودة عن النسخة المعتمدة مع سبب الإرجاع. **إغلاقه:** نسختان مع انتقال فعالية؛ سجل يستخدم النسخة الصحيحة المجمدة، ورفض تعديل/حذف نسخة معتمدة أو توقيع غير مخول. (`QC-PAGE-F-023` / `QC-ADP-20`).
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015, QC-PAGE-F-023.

### RT-DOC-005 — `/documents/[documentId]/versions/[versionId]`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/documents/[documentId]/versions/[versionId]/index.astro`؛ `permission-bound` (`required`)؛ مالك مستند/مراجع/QCM. **الهدف/الدورة:** هوية مستند ونسخة ومراجعة؛ إنشاء → نسخة → مراجعة → فعالية.
- **المصدر والبيانات:** `../../../../../modules/documents/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.document_identities; qc.document_versions`. الحالة النصية المستخرجة: DRAFT, IN_REVIEW, APPROVED, EFFECTIVE, REVIEW, SUPERSEDED, VOID.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../../../modules/documents/application/dependencies.js` L5؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-DOC-EDIT-DRAFT` L12، `PERM-DOC-SUBMIT` L13، `PERM-DOC-REVIEW` L14؛ استدعاء واجهة الإجراء `actions.documents.submit` L25؛ يوجد تمرير `expectedVersion` في الصفحة. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Submit for review, Open review workspace؛ `/documents`, `/documents/${document.id`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** أظهر الحالة والنسخة والسجل المرتبط والحدث التالي؛ اختبر صلاحيات الأفعال على use case لا على ظهور الزر.
- **تحسين مسار مطلوب:** أظهر النسخة الفعالة ومصدرها وتاريخها وماذا يستخدمها، وافصل المسودة عن النسخة المعتمدة مع سبب الإرجاع. **إغلاقه:** نسختان مع انتقال فعالية؛ سجل يستخدم النسخة الصحيحة المجمدة، ورفض تعديل/حذف نسخة معتمدة أو توقيع غير مخول. (`QC-PAGE-F-023` / `QC-ADP-20`).
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-023., QC-PAGE-F-028

### RT-DOC-006 — `/documents/[documentId]/versions/[versionId]/review`
- **النوع/المنهج/السبب:** Review؛ هندسة قرار وصلاحية. المراجع يحتاج أدلة وسياقًا قبل انتقال الحالة.
- **الملف/الظهور/المستخدم:** `src/pages/documents/[documentId]/versions/[versionId]/review.astro`؛ `permission-bound` (`required`)؛ مالك مستند/مراجع/QCM. **الهدف/الدورة:** هوية مستند ونسخة ومراجعة؛ إنشاء → نسخة → مراجعة → فعالية.
- **المصدر والبيانات:** `../../../../../modules/documents/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.document_identities; qc.document_versions`. الحالة النصية المستخرجة: EFFECTIVE, IN_REVIEW.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../../../modules/documents/application/dependencies.js` L4؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-DOC-REVIEW` L11، `PERM-APR-REVIEW` L11، `PERM-DOC-APPROVE` L12، `PERM-APR-APPROVE` L12؛ استدعاء واجهة الإجراء `actions.documents.review` L35، `actions.documents.approve` L37؛ يوجد تمرير `expectedVersion` في الصفحة. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Record review, Approve revision, Back to version؛ `/documents`, `/documents/${document.id`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** اعرض الدليل والنسخة وصاحب القرار قبل التأكيد؛ اختبر SoD والتوقيع والتعارض ومواصلة العمل بعد الرفض.
- **تحسين مسار مطلوب:** أظهر النسخة الفعالة ومصدرها وتاريخها وماذا يستخدمها، وافصل المسودة عن النسخة المعتمدة مع سبب الإرجاع. **إغلاقه:** نسختان مع انتقال فعالية؛ سجل يستخدم النسخة الصحيحة المجمدة، ورفض تعديل/حذف نسخة معتمدة أو توقيع غير مخول. (`QC-PAGE-F-023` / `QC-ADP-20`).
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-023.

### RT-APPROVAL-001 — `/approvals`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/approvals/index.astro`؛ `permission-bound` (`required`)؛ المراجع المكلّف. **الهدف/الدورة:** قرار مراجعة مضبوط؛ طابور → سياق/توقيع → قرار.
- **المصدر والبيانات:** `../../modules/approvals/application/dependencies.js`, `../../modules/identity/application/admin-dependencies.js`. كيانات مرجعية مرشحة: `qc.approval_cases; qc.approval_work_items`. الحالة النصية المستخرجة: لم تُستخرج حالات نصية مباشرة؛ راجع use case.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../modules/approvals/application/dependencies.js` L6، `../../modules/identity/application/admin-dependencies.js` L11. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Open review؛ `/approvals/${item.approvalCase.id`.
- **قوة/مشكلة مرصودة:** حَيًّا: طابور 0 ويشرح أن التعيين والنطاق والنسخة تتحكم بالظهور. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **تحسين مسار مطلوب:** ضع الدليل والموضوع والنسخة والصلاحية والتبعات بجانب أزرار القرار؛ أظهر سبب الرفض والعودة إلى العمل واسترداد التركيز. **إغلاقه:** موضوعان ممثلان لمراجع مخول وغير مخول؛ نجاح القرار ورفض self-approval/secret خاطئ/نسخة قديمة مع أثر توقيع وتدقيق صحيح. (`QC-PAGE-F-021` / `QC-ADP-18`).
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-021.

### RT-APPROVAL-002 — `/approvals/[approvalId]`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/approvals/[approvalId].astro`؛ `permission-bound` (`required`)؛ المراجع المكلّف. **الهدف/الدورة:** قرار مراجعة مضبوط؛ طابور → سياق/توقيع → قرار.
- **المصدر والبيانات:** `../../modules/approvals/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.approval_cases; qc.approval_work_items`. الحالة النصية المستخرجة: PENDING, IN_PROGRESS, RETURN, REJECT, APPROVE, SUCCESS, CONFLICT_STALE.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../modules/approvals/application/dependencies.js` L9؛ استدعاء واجهة الإجراء `actions.approvals.decide` L79. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Submit controlled decision؛ `/approvals`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** أظهر الحالة والنسخة والسجل المرتبط والحدث التالي؛ اختبر صلاحيات الأفعال على use case لا على ظهور الزر.
- **تحسين مسار مطلوب:** ضع الدليل والموضوع والنسخة والصلاحية والتبعات بجانب أزرار القرار؛ أظهر سبب الرفض والعودة إلى العمل واسترداد التركيز. **إغلاقه:** موضوعان ممثلان لمراجع مخول وغير مخول؛ نجاح القرار ورفض self-approval/secret خاطئ/نسخة قديمة مع أثر توقيع وتدقيق صحيح. (`QC-PAGE-F-021` / `QC-ADP-18`).
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-021.

### RT-CHANGE-001 — `/change-requests`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/change-requests/index.astro`؛ `permission-bound` (`required`)؛ طالب/مراجع. **الهدف/الدورة:** طلب تغيير مضبوط؛ مسودة → مراجعة → تطبيق منفصل.
- **المصدر والبيانات:** `../../modules/change-requests/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.change_requests; qc.change_application_attempts`. الحالة النصية المستخرجة: DRAFT, SUBMITTED, UNDER_REVIEW, RETURNED, APPROVED, REJECTED, APPLYING, APPLIED.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../modules/change-requests/application/dependencies.js` L5؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-CHG-CREATE` L28. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Filter, New change request؛ `/change-requests/new`, `/change-requests/${changeRequest.id`.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **تحسين مسار مطلوب:** اعرض الهدف ونسخته والأثر قبل القرار وبعده؛ سمّ خطوة Apply صراحة وحالة الفشل/إعادة المحاولة. **إغلاقه:** طلب معتمد يطبق مرة واحدة فقط؛ محاولة مكررة وتعارض نسخة ورفض صلاحية تعيد نتيجة آمنة مع سجل تدقيق وهدف غير متغير عند الفشل. (`QC-PAGE-F-024` / `QC-ADP-21`).
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-024.

### RT-CHANGE-002 — `/change-requests/new`
- **النوع/المنهج/السبب:** Form؛ تحليل نموذج ومنع الخطأ. يدخل المستخدم بيانات قد تنشئ سجلًا دائمًا.
- **الملف/الظهور/المستخدم:** `src/pages/change-requests/new.astro`؛ `permission-bound` (`required`)؛ طالب/مراجع. **الهدف/الدورة:** طلب تغيير مضبوط؛ مسودة → مراجعة → تطبيق منفصل.
- **المصدر والبيانات:** `../../modules/change-requests/application/dependencies.js`, `../../modules/change-requests/application/document-version-change-fields.js`. كيانات مرجعية مرشحة: `qc.change_requests; qc.change_application_attempts`. الحالة النصية المستخرجة: POST.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../modules/change-requests/application/dependencies.js` L18، `../../modules/change-requests/application/document-version-change-fields.js` L22؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-CHG-CREATE` L26، `PERM-DOC-VIEW` L41؛ استدعاء واجهة الإجراء `actions.changeRequests.createForDocumentVersion` L130، `actions.changeRequests.createForDocumentVersion` L171. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Create draft, Back to register؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** افصل الحقول المصدرية عن المشتقة؛ وفّر اختيارًا/تعبئة مسبقة حيث يوجد سجل موثوق؛ اختبر required/server error/duplicate submit/unsaved.
- **تحسين مسار مطلوب:** اعرض الهدف ونسخته والأثر قبل القرار وبعده؛ سمّ خطوة Apply صراحة وحالة الفشل/إعادة المحاولة. **إغلاقه:** طلب معتمد يطبق مرة واحدة فقط؛ محاولة مكررة وتعارض نسخة ورفض صلاحية تعيد نتيجة آمنة مع سجل تدقيق وهدف غير متغير عند الفشل. (`QC-PAGE-F-024` / `QC-ADP-21`).
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015, QC-PAGE-F-024.

### RT-CHANGE-003 — `/change-requests/[changeRequestId]`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/change-requests/[changeRequestId]/index.astro`؛ `permission-bound` (`required`)؛ طالب/مراجع. **الهدف/الدورة:** طلب تغيير مضبوط؛ مسودة → مراجعة → تطبيق منفصل.
- **المصدر والبيانات:** `../../../modules/change-requests/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.change_requests; qc.change_application_attempts`. الحالة النصية المستخرجة: SUBMITTED, UNDER_REVIEW, APPROVED, APPLICATION_FAILED, DRAFT, APPLYING, APPLIED.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/change-requests/application/dependencies.js` L5؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-CHG-REVIEW` L18، `PERM-CHG-RETURN` L18، `PERM-CHG-APPROVE` L18، `PERM-CHG-REJECT` L18. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Open review؛ `/change-requests/${changeRequest.id`, `/change-requests`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** أظهر الحالة والنسخة والسجل المرتبط والحدث التالي؛ اختبر صلاحيات الأفعال على use case لا على ظهور الزر.
- **تحسين مسار مطلوب:** اعرض الهدف ونسخته والأثر قبل القرار وبعده؛ سمّ خطوة Apply صراحة وحالة الفشل/إعادة المحاولة. **إغلاقه:** طلب معتمد يطبق مرة واحدة فقط؛ محاولة مكررة وتعارض نسخة ورفض صلاحية تعيد نتيجة آمنة مع سجل تدقيق وهدف غير متغير عند الفشل. (`QC-PAGE-F-024` / `QC-ADP-21`).
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-024.

### RT-CHANGE-004 — `/change-requests/[changeRequestId]/review`
- **النوع/المنهج/السبب:** Review؛ هندسة قرار وصلاحية. المراجع يحتاج أدلة وسياقًا قبل انتقال الحالة.
- **الملف/الظهور/المستخدم:** `src/pages/change-requests/[changeRequestId]/review.astro`؛ `permission-bound` (`required`)؛ طالب/مراجع. **الهدف/الدورة:** طلب تغيير مضبوط؛ مسودة → مراجعة → تطبيق منفصل.
- **المصدر والبيانات:** `../../../modules/change-requests/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.change_requests; qc.change_application_attempts`. الحالة النصية المستخرجة: SUBMITTED, UNDER_REVIEW, SUBMIT, START_REVIEW, RETURN, RESUME, APPROVE, REJECT.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/change-requests/application/dependencies.js` L3؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-CHG-REVIEW` L15، `PERM-APR-REVIEW` L15، `PERM-CHG-APPROVE` L16، `PERM-APR-APPROVE` L16، `PERM-CHG-RETURN` L17، `PERM-APR-RETURN` L17؛ استدعاء واجهة الإجراء `actions.changeRequests.transition` L44؛ يوجد تمرير `expectedVersion` في الصفحة. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Start review, Return, Reject, Approve change request, Back to record؛ `/change-requests/${changeRequest.id`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** اعرض الدليل والنسخة وصاحب القرار قبل التأكيد؛ اختبر SoD والتوقيع والتعارض ومواصلة العمل بعد الرفض.
- **تحسين مسار مطلوب:** اعرض الهدف ونسخته والأثر قبل القرار وبعده؛ سمّ خطوة Apply صراحة وحالة الفشل/إعادة المحاولة. **إغلاقه:** طلب معتمد يطبق مرة واحدة فقط؛ محاولة مكررة وتعارض نسخة ورفض صلاحية تعيد نتيجة آمنة مع سجل تدقيق وهدف غير متغير عند الفشل. (`QC-PAGE-F-024` / `QC-ADP-21`).
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-024.

### RT-REPORT-001 — `/reports`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/reports/index.astro`؛ `permission-bound` (`required`)؛ مستخدم مصرح. **الهدف/الدورة:** تقرير وتصدير متطابقان؛ فلترة → قراءة → تصدير.
- **المصدر والبيانات:** `../../modules/reporting/application/dependencies.js`. كيانات مرجعية مرشحة: `read model حسب التقرير`. الحالة النصية المستخرجة: VIEW, REPORT, ACTIVE, REPORTING.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../modules/reporting/application/dependencies.js` L4؛ يوجد تمرير `expectedVersion` في الصفحة. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** قراءة/توجيه؛ `/reports/${report.code`.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** سجل التقارير للاكتشاف والتوجيه فقط؛ تحقق من فلترة/صلاحية القائمة والرابط إلى التقرير المسجل. فحوص الصفوف والتصدير والطباعة تخص بطاقة التفاصيل RT-REPORT-002.
- **بطاقة الدليل بعد QC-ADP-10:** source=PASS لفلترة registry حسب view permission والرابط للمسار المسجل؛ filter/count/order/export/print/run-provenance checks N/A من `src/pages/reports/index.astro:7-14` لعدم وجود هذه الأسطح في route registry. live/role/AT/performance/UAT=NOT VERIFIED. **النتيجة:** NOT VERIFIED / NO-GO؛ مرجع التفاصيل `audit/2026-09-24/QC-ADP-10-report-parity-handoff.md`.

### RT-REPORT-002 — `/reports/[reportCode]`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/reports/[reportCode].astro`؛ `permission-bound` (`required`)؛ مستخدم مصرح. **الهدف/الدورة:** تقرير وتصدير متطابقان؛ فلترة → قراءة → تصدير.
- **المصدر والبيانات:** `../../modules/reporting/application/run-report.js`, `../../modules/reporting/application/dependencies.js`, `../../modules/reporting/application/parse-report-filters.js`. كيانات مرجعية مرشحة: `read model حسب التقرير`. الحالة النصية المستخرجة: RESOURCE_NOT_FOUND, AUTHZ_, VALIDATION_, UNAPPROVED_INFORMATIONAL_COPY.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../modules/reporting/application/run-report.js` L3، `../../modules/reporting/application/dependencies.js` L4، `../../modules/reporting/application/parse-report-filters.js` L6؛ حالة HTTP صريحة `Astro.response.status = 404` L18، `Astro.response.status = 403` L18. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Back to reports, Export CSV, Export XLSX؛ `/reports`, `/reports/${code`, `/reports/${definition.code`.
- **قوة/مشكلة مرصودة بعد QC-ADP-10:** وجدنا فرقًا بين Action export وباقي مسارات التصدير: Action كان يسقط خمسة فلاتر. أُصلح بمحول parser مشترك. provenance واحدة الآن توحّد المصدر والنطاق والفترة والفلاتر والفرز والعدد والحالة؛ fixture متعدد المالكين والتواريخ يثبت النطاق والفلاتر والحدود والترتيب والعدد وكل قيم CSV/XLSX ورفض الصلاحية/تحييد الصيغ على PostgreSQL 18.
- **التوصية والتصميم:** الشاشة والطباعة تستخدمان نفس SSR dataset؛ روابط التنزيل وAction تعيد تشغيل query canonical. لا يوجد ضمان snapshot دائم بين HTTP requests منفصلة؛ يلزم حسم retention لـ`report_runs` قبل تخزين نتيجة قابلة لإعادة العرض.
- **بطاقة الدليل بعد QC-ADP-10:** focused parser/export/provenance/report + PG18 Docker=PASS (35/35؛ منها PG parity 9/9)؛ source table caption/headers/shared provenance=PASS؛ print E2E=NOT RUN لغياب بيانات دخول. live release/schema/role/UAT=NOT VERIFIED. **النتيجة:** PARTIAL / NO-GO؛ مرجع التفاصيل `audit/2026-09-24/QC-ADP-10-report-parity-handoff.md`.

### RT-ADMIN-001 — `/admin`
- **النوع/المنهج/السبب:** Overview؛ دعم القرار ودلالة المؤشرات. الغرض تحديد ما يتطلب انتباهًا ووجهة الإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/admin/index.astro`؛ `permission-bound` (`required`)؛ مسؤول بتفويض صريح. **الهدف/الدورة:** عضويات وأدوار ونطاقات؛ عرض → تعديل محكوم/تدقيق.
- **المصدر والبيانات:** قراءة عبر shared/use case أو صفحة ثابتة. كيانات مرجعية مرشحة: `qc.users; qc.roles; qc.permissions; qc.user_scopes`. الحالة النصية المستخرجة: لم تُستخرج حالات نصية مباشرة؛ راجع use case.
- **أثر مصدر قابل للتتبع:** مفاتيح صلاحية مذكورة في الصفحة `PERM-ADM-AUDIT-VIEW` L8، `PERM-001` L39. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Open users, Create user, Open roles, Open permissions, Open scopes, Open audit؛ `/admin/users`, `/admin/users/new`, `/admin/roles`, `/admin/permissions`, `/admin/scopes`.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** اربط كل مؤشر بمصدر ونطاق وزمن ورابط filter مطابق؛ أظهر unavailable بصدق ولا تحوّل الصفر إلى بيانات مفقودة.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-018, QC-PAGE-F-014.

### RT-USER-001 — `/admin/users`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/admin/users/index.astro`؛ `permission-bound` (`required`)؛ مسؤول بتفويض صريح. **الهدف/الدورة:** عضويات وأدوار ونطاقات؛ عرض → تعديل محكوم/تدقيق.
- **المصدر والبيانات:** `../../../modules/identity/application/admin-dependencies.js`, `../../../modules/administration/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.users; qc.roles; qc.permissions; qc.user_scopes`. الحالة النصية المستخرجة: AUTHORIZATION.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/identity/application/admin-dependencies.js` L3، `../../../modules/administration/application/dependencies.js` L6. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Create user, Back to administration؛ `/admin/users/new`, `/admin`, `/admin/users/${user.id`.
- **قوة/مشكلة مرصودة:** حَيًّا: حساب yazeed فعال بدوري ADMIN وSYSTEM_OWNER ونطاق GLOBAL. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-018, QC-PAGE-F-014.

### RT-USER-002 — `/admin/users/new`
- **النوع/المنهج/السبب:** Form؛ تحليل نموذج ومنع الخطأ. يدخل المستخدم بيانات قد تنشئ سجلًا دائمًا.
- **الملف/الظهور/المستخدم:** `src/pages/admin/users/new.astro`؛ `permission-bound` (`required`)؛ مسؤول بتفويض صريح. **الهدف/الدورة:** عضويات وأدوار ونطاقات؛ عرض → تعديل محكوم/تدقيق.
- **المصدر والبيانات:** `../../../modules/administration/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.users; qc.roles; qc.permissions; qc.user_scopes`. الحالة النصية المستخرجة: OWN, ASSIGNED, TEAM, DEPARTMENT, SITE, DOMAIN, GLOBAL.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/administration/application/dependencies.js` L4؛ استدعاء واجهة الإجراء `actions.admin.createUser` L132. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Create user, Back to users؛ `/admin/users`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** افصل الحقول المصدرية عن المشتقة؛ وفّر اختيارًا/تعبئة مسبقة حيث يوجد سجل موثوق؛ اختبر required/server error/duplicate submit/unsaved.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-018, QC-PAGE-F-015.

### RT-USER-003 — `/admin/users/[userId]`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/admin/users/[userId].astro`؛ `permission-bound` (`required`)؛ مسؤول بتفويض صريح. **الهدف/الدورة:** عضويات وأدوار ونطاقات؛ عرض → تعديل محكوم/تدقيق.
- **المصدر والبيانات:** `../../../modules/identity/application/admin-dependencies.js`, `../../../modules/administration/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.users; qc.roles; qc.permissions; qc.user_scopes`. الحالة النصية المستخرجة: RESOURCE_NOT_FOUND, AUTHORIZATION, YES, ACTIVE, SUCCESS, UNKNOWN_SAFE_ERROR, OWN, ASSIGNED.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/identity/application/admin-dependencies.js` L4، `../../../modules/administration/application/dependencies.js` L5؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-ADM-ROLE-VIEW` L53، `PERM-ADM-ROLE-ASSIGN` L54، `PERM-ADM-SCOPE-ASSIGN` L55؛ استدعاء واجهة الإجراء `actions.admin.updateUser` L715، `actions.admin.assignUserRole` L727، `actions.admin.assignUserScope` L758، `actions.admin.manageUserScopes` L778؛ يوجد تمرير `expectedVersion` في الصفحة. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Refresh record, Save profile, Reset password, Disable account, Activate account, Revoke all sessions؛ `/admin/users`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** أظهر الحالة والنسخة والسجل المرتبط والحدث التالي؛ اختبر صلاحيات الأفعال على use case لا على ظهور الزر.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-018, QC-PAGE-F-014.

### RT-ROLE-001 — `/admin/roles`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/admin/roles/index.astro`؛ `permission-bound` (`required`)؛ مسؤول بتفويض صريح. **الهدف/الدورة:** عضويات وأدوار ونطاقات؛ عرض → تعديل محكوم/تدقيق.
- **المصدر والبيانات:** `../../../modules/administration/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.users; qc.roles; qc.permissions; qc.user_scopes`. الحالة النصية المستخرجة: AUTHORIZATION, YES.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/administration/application/dependencies.js` L3. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Back to administration؛ `/admin`, `/admin/roles/${role.id`.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-018, QC-PAGE-F-014.

### RT-ROLE-002 — `/admin/roles/[roleId]`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/admin/roles/[roleId].astro`؛ `permission-bound` (`required`)؛ مسؤول بتفويض صريح. **الهدف/الدورة:** عضويات وأدوار ونطاقات؛ عرض → تعديل محكوم/تدقيق.
- **المصدر والبيانات:** `../../../modules/administration/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.users; qc.roles; qc.permissions; qc.user_scopes`. الحالة النصية المستخرجة: RESOURCE_NOT_FOUND, AUTHORIZATION, YES.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/administration/application/dependencies.js` L3؛ استدعاء واجهة الإجراء `actions.admin.updateRolePermissions` L171؛ يوجد تمرير `expectedVersion` في الصفحة. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Replace grants, Back to roles؛ `/admin/roles`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** أظهر الحالة والنسخة والسجل المرتبط والحدث التالي؛ اختبر صلاحيات الأفعال على use case لا على ظهور الزر.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-018, QC-PAGE-F-014.

### RT-ADMIN-002 — `/admin/permissions`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/admin/permissions/index.astro`؛ `permission-bound` (`required`)؛ مسؤول بتفويض صريح. **الهدف/الدورة:** عضويات وأدوار ونطاقات؛ عرض → تعديل محكوم/تدقيق.
- **المصدر والبيانات:** `../../../modules/administration/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.users; qc.roles; qc.permissions; qc.user_scopes`. الحالة النصية المستخرجة: AUTHORIZATION.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/administration/application/dependencies.js` L3. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Back to administration؛ `/admin`.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-018, QC-PAGE-F-014.

### RT-ADMIN-003 — `/admin/scopes`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/admin/scopes/index.astro`؛ `permission-bound` (`required`)؛ مسؤول بتفويض صريح. **الهدف/الدورة:** عضويات وأدوار ونطاقات؛ عرض → تعديل محكوم/تدقيق.
- **المصدر والبيانات:** قراءة عبر shared/use case أو صفحة ثابتة. كيانات مرجعية مرشحة: `qc.users; qc.roles; qc.permissions; qc.user_scopes`. الحالة النصية المستخرجة: لم تُستخرج حالات نصية مباشرة؛ راجع use case.
- **أثر مصدر قابل للتتبع:** لا تُظهر الصفحة نفسها استدعاء `astro:actions` أو مفتاح `PERM-*`؛ افحص التوجيه والخادم قبل استنتاج الصلاحية. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Back to administration؛ `/admin`, `/admin/users`.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-018, QC-PAGE-F-014.

### RT-SYSTEM-001 — `/system/health`
- **النوع/المنهج/السبب:** Overview؛ دعم القرار ودلالة المؤشرات. الغرض تحديد ما يتطلب انتباهًا ووجهة الإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/system/health.astro`؛ `permission-bound` (`required`)؛ yazeed أو مستخدم مخول. **الهدف/الدورة:** صحة ونشر ونسخ واستعادة؛ تشخيص/دليل إصدار/استعادة معزولة.
- **المصدر والبيانات:** `../../modules/system-health/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.backup_runs; qc.restore_runs; qc.recovery_evidence`. الحالة النصية المستخرجة: HEALTHY, DEGRADED, UNAVAILABLE, UNKNOWN, READY, UNVERIFIED, VERIFIED, VERIFICATION_FAILED.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../modules/system-health/application/dependencies.js` L3؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-BKP-VIEW` L15. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** قراءة/توجيه؛ `/system/backups`.
- **قوة/مشكلة مرصودة:** حَيًّا: NOT READY؛ 0018 applied و0039 shipped؛ release identity UNVERIFIED؛ restore NOT VERIFIED. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** اربط كل مؤشر بمصدر ونطاق وزمن ورابط filter مطابق؛ أظهر unavailable بصدق ولا تحوّل الصفر إلى بيانات مفقودة.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-003, QC-PAGE-F-004, QC-PAGE-F-014., QC-PAGE-F-029

### RT-SYSTEM-002 — `/system/control-center`
- **النوع/المنهج/السبب:** Overview؛ دعم القرار ودلالة المؤشرات. الغرض تحديد ما يتطلب انتباهًا ووجهة الإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/system/control-center.astro`؛ `permission-bound` (`required`)؛ yazeed أو مستخدم مخول. **الهدف/الدورة:** صحة ونشر ونسخ واستعادة؛ تشخيص/دليل إصدار/استعادة معزولة.
- **المصدر والبيانات:** `../../modules/system-health/application/dependencies.js`, `../../modules/identity/application/admin-dependencies.js`, `../../modules/administration/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.backup_runs; qc.restore_runs; qc.recovery_evidence`. الحالة النصية المستخرجة: ACTIVE, INACTIVE, DISABLED, HEALTHY, READY, VERIFIED, DEGRADED, UNKNOWN.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../modules/system-health/application/dependencies.js` L7، `../../modules/identity/application/admin-dependencies.js` L8، `../../modules/administration/application/dependencies.js` L9؛ استدعاء واجهة الإجراء `actions.admin.createUser` L543. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Apply, Create account, Backups, Open workspace, Open role؛ `/system/health`, `/system/backups`, `/admin/users/${user.id`, `/admin/roles/${role.id`, `/admin/roles`.
- **قوة/مشكلة مرصودة:** حَيًّا: Core system READY في لوحة المالك مع migration drift؛ ليست موافقة QC أو جهوزية إطلاق. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** اربط كل مؤشر بمصدر ونطاق وزمن ورابط filter مطابق؛ أظهر unavailable بصدق ولا تحوّل الصفر إلى بيانات مفقودة.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-003, QC-PAGE-F-004, QC-PAGE-F-014.

### RT-BACKUP-001 — `/system/backups`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/system/backups/index.astro`؛ `permission-bound` (`required`)؛ yazeed أو مستخدم مخول. **الهدف/الدورة:** صحة ونشر ونسخ واستعادة؛ تشخيص/دليل إصدار/استعادة معزولة.
- **المصدر والبيانات:** `../../../modules/backup-recovery/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.backup_runs; qc.restore_runs; qc.recovery_evidence`. الحالة النصية المستخرجة: CREATED, VERIFIED, SUCCEEDED, FAILED.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/backup-recovery/application/dependencies.js` L4. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** قراءة/توجيه؛ `/system/backups/${item.id`.
- **قوة/مشكلة مرصودة:** حَيًّا: الكتالوج فارغ، والحالة تُعرض Unknown recovery posture. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-003, QC-PAGE-F-004, QC-PAGE-F-014.

### RT-BACKUP-002 — `/system/backups/[backupId]`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/system/backups/[backupId]/index.astro`؛ `permission-bound` (`required`)؛ yazeed أو مستخدم مخول. **الهدف/الدورة:** صحة ونشر ونسخ واستعادة؛ تشخيص/دليل إصدار/استعادة معزولة.
- **المصدر والبيانات:** `../../../../modules/backup-recovery/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.backup_runs; qc.restore_runs; qc.recovery_evidence`. الحالة النصية المستخرجة: CREATED, VERIFIED, SUCCEEDED, VERIFICATION_FAILED, VERIFYING, FAILED, UNKNOWN.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../../modules/backup-recovery/application/dependencies.js` L3؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-BKP-RESTORE-DRILL` L19. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** قراءة/توجيه؛ `/system/backups/${backup.id`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** أظهر الحالة والنسخة والسجل المرتبط والحدث التالي؛ اختبر صلاحيات الأفعال على use case لا على ظهور الزر.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-003, QC-PAGE-F-004, QC-PAGE-F-014.

### RT-BACKUP-003 — `/system/backups/[backupId]/restore`
- **النوع/المنهج/السبب:** Recovery؛ سلامة عملية عالية الأثر. طلب الاستعادة يتطلب هدفًا معزولًا وصلاحية ودليلًا.
- **الملف/الظهور/المستخدم:** `src/pages/system/backups/[backupId]/restore.astro`؛ `permission-bound` (`required`)؛ yazeed أو مستخدم مخول. **الهدف/الدورة:** صحة ونشر ونسخ واستعادة؛ تشخيص/دليل إصدار/استعادة معزولة.
- **المصدر والبيانات:** `../../../../modules/backup-recovery/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.backup_runs; qc.restore_runs; qc.recovery_evidence`. الحالة النصية المستخرجة: VERIFIED, VERIFICATION_FAILED, VERIFYING, UNKNOWN, DRILL, PRODUCTION.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../../modules/backup-recovery/application/dependencies.js` L3؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-BKP-RESTORE-DRILL` L20، `PERM-BKP-RESTORE-PRODUCTION` L21؛ استدعاء واجهة الإجراء `actions.system.requestRestore` L105. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Record restore request, Back to backup؛ `/system/backups/${backup.id`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** لا تنفّذ restore إلا على هدف معزول مصرح، بتأكيد السبب والدليل وrollback/runbook.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-003, QC-PAGE-F-004.

### RT-REJ-001 — `/reject-reports`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/reject-reports/index.astro`؛ `authenticated` (`required`)؛ QC ومصرّح. **الهدف/الدورة:** تقرير رفض وإيصال/يومي؛ إنشاء → مراجعة → تقرير/طباعة.
- **المصدر والبيانات:** `../../modules/reject-reports/application/dependencies.js`, `../../modules/reject-reports/ports/repository.js`. كيانات مرجعية مرشحة: `qc.reject_reports; qc.reject_issue_slips; qc.daily_reject_entries`. الحالة النصية المستخرجة: AWAITING, COMPLETED, SCHEMA_NOT_READY, RIS.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../modules/reject-reports/application/dependencies.js` L4، `../../modules/reject-reports/ports/repository.js` L7؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-RREJ-CREATE` L75؛ حالة HTTP صريحة `Astro.response.status = 503` L28. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Filter, New Report؛ `/reject-reports/new`, `/reject-reports/issue-slips/${slip.id`, `/reject-reports/daily/${record.id`.
- **قوة/مشكلة مرصودة:** حَيًّا: 503 بحالة SCHEMA_NOT_READY بدل قائمة البيانات. المخطط الحي يمنع دورة التقرير؛ لا يُقترح تجاوز بوابة الهجرة.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-001, QC-PAGE-F-014.

### RT-REJ-002 — `/reject-reports/new`
- **النوع/المنهج/السبب:** Form؛ تحليل نموذج ومنع الخطأ. يدخل المستخدم بيانات قد تنشئ سجلًا دائمًا.
- **الملف/الظهور/المستخدم:** `src/pages/reject-reports/new.astro`؛ `authenticated` (`required`)؛ QC ومصرّح. **الهدف/الدورة:** تقرير رفض وإيصال/يومي؛ إنشاء → مراجعة → تقرير/طباعة.
- **المصدر والبيانات:** `../../modules/reject-reports/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.reject_reports; qc.reject_issue_slips; qc.daily_reject_entries`. الحالة النصية المستخرجة: POST.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../modules/reject-reports/application/dependencies.js` L12؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-RREJ-CREATE` L17؛ استدعاء واجهة الإجراء `actions.rejectReports.createDailyReject` L77، `actions.rejectReports.createIssueSlip` L117، `actions.rejectReports.createDailyReject` L266، `actions.rejectReports.createIssueSlip` L281؛ حالة HTTP صريحة `Astro.response.status = 503` L22. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Back to reject reports؛ `/reject-reports`.
- **قوة/مشكلة مرصودة:** حَيًّا: الإنشاء محجوب بنص يصرح بعدم جاهزية المخطط. المخطط الحي يمنع دورة التقرير؛ لا يُقترح تجاوز بوابة الهجرة.
- **التوصية والتصميم:** افصل الحقول المصدرية عن المشتقة؛ وفّر اختيارًا/تعبئة مسبقة حيث يوجد سجل موثوق؛ اختبر required/server error/duplicate submit/unsaved.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-001, QC-PAGE-F-015.

### RT-REJ-003 — `/reject-reports/issue-slips/[reportId]`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/reject-reports/issue-slips/[reportId].astro`؛ `authenticated` (`required`)؛ QC ومصرّح. **الهدف/الدورة:** تقرير رفض وإيصال/يومي؛ إنشاء → مراجعة → تقرير/طباعة.
- **المصدر والبيانات:** `../../../modules/reject-reports/application/dependencies.js`, `../../../modules/reject-reports/application/view-model.js`. كيانات مرجعية مرشحة: `qc.reject_reports; qc.reject_issue_slips; qc.daily_reject_entries`. الحالة النصية المستخرجة: PENDING, CONFIRMED, REVERSED, APPROVAL_TRACKING, DRAFT, VOID, COMPLETED, SUPERVISOR.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/reject-reports/application/dependencies.js` L3، `../../../modules/reject-reports/application/view-model.js` L7؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-RREJ-EDIT` L26، `PERM-RREJ-CONFIRM-APPROVAL` L27، `PERM-RREJ-ADMIN-CORRECT` L127، `PERM-RREJ-VOID` L147؛ استدعاء واجهة الإجراء `actions.rejectReports.confirmApproval` L181، `actions.rejectReports.reverseApproval` L197، `actions.rejectReports.issueIssueSlip` L208، `actions.rejectReports.voidReport` L215؛ يوجد تمرير `expectedVersion` في الصفحة. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Mark confirmed, Reverse (correction), Issue slip (start approval tracking), Void report, Back to Reject Reports, Print view؛ `/reject-reports`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. المخطط الحي يمنع دورة التقرير؛ لا يُقترح تجاوز بوابة الهجرة.
- **التوصية والتصميم:** أظهر الحالة والنسخة والسجل المرتبط والحدث التالي؛ اختبر صلاحيات الأفعال على use case لا على ظهور الزر.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-001, QC-PAGE-F-014.

### RT-REJ-004 — `/reject-reports/daily/[reportId]`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/reject-reports/daily/[reportId].astro`؛ `authenticated` (`required`)؛ QC ومصرّح. **الهدف/الدورة:** تقرير رفض وإيصال/يومي؛ إنشاء → مراجعة → تقرير/طباعة.
- **المصدر والبيانات:** `../../../modules/reject-reports/application/dependencies.js`, `../../../modules/reject-reports/application/view-model.js`. كيانات مرجعية مرشحة: `qc.reject_reports; qc.reject_issue_slips; qc.daily_reject_entries`. الحالة النصية المستخرجة: DRAFT, VOID.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/reject-reports/application/dependencies.js` L3، `../../../modules/reject-reports/application/view-model.js` L4؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-RREJ-VOID` L185؛ استدعاء واجهة الإجراء `actions.rejectReports.updateDailyRejectDraft` L243، `actions.rejectReports.finalizeDailyReject` L255، `actions.rejectReports.voidReport` L262؛ يوجد تمرير `expectedVersion` في الصفحة. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Add entry, Finalize record, Void record, Back to Reject Reports, Print view؛ `/reject-reports`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. المخطط الحي يمنع دورة التقرير؛ لا يُقترح تجاوز بوابة الهجرة.
- **التوصية والتصميم:** أظهر الحالة والنسخة والسجل المرتبط والحدث التالي؛ اختبر صلاحيات الأفعال على use case لا على ظهور الزر.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-001, QC-PAGE-F-014.

### RT-AI-001 — `/ai-advisory`
- **النوع/المنهج/السبب:** Utility؛ إيجاد/إرشاد/حدود صلاحية. الصفحة تؤدي مهمة مساعدة لا انتقال QC مباشر.
- **الملف/الظهور/المستخدم:** `src/pages/ai-advisory.astro`؛ `permission-bound` (`required`)؛ مستخدم نشط. **الهدف/الدورة:** بحث وإشعارات وحساب وتاريخ ومساعدة وAI؛ قراءة أو إجراء مقيد بحسب السطح.
- **المصدر والبيانات:** `../modules/ai-advisory/application/page-availability.js`. كيانات مرجعية مرشحة: `حسب المجال`. الحالة النصية المستخرجة: PUBLIC, SYNTHETIC, AUTHORIZED_NONCONFIDENTIAL_EXCERPT, SUMMARIZE, SUGGEST, DRAFT, REFUSED, UNAVAILABLE.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../modules/ai-advisory/application/page-availability.js` L4؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-AI-USE` L8، `PERM-AI-SUMMARIZE` L9، `PERM-AI-SUGGEST` L10، `PERM-AI-DRAFT` L11؛ استدعاء واجهة الإجراء `actions.aiAdvisory.requestAdvisory` L129. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Request advisory, Prepare correction for human review, Copy, Use as Draft؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** حَيًّا: المعالجة الخارجية معطلة وتظهر حدود AI advisory. المصدر الآن يحصر الوجهات في نقاط المزود الرسمية، ويصنف ملفات الترخيص الأربع وفق بصمات نصوص مثبتة الإصدار؛ لا artifact اعتماد مزود ولا تحقق حي للدور.
- **التوصية والتصميم:** راجع المهمة الأساسية واللغة والاسترداد وإتاحة لوحة المفاتيح، مع عدم توسيع السلطة.
- **بطاقة الدليل:** source/build=PASS؛ focused AI/provider/license tests=79/79 PASS؛ provider processing remains disabled. `RT-AI-001` acceptance is 5/10 (50%): 5 PASS, 1 NOT VERIFIED (live readability/accessibility), 4 BLOCKED (security E2E, dependency audit, owner policy approval, approved live evaluation). Registry DNS `ENOTFOUND` and unavailable container runtime blocked external/security execution; role/PG/AT/performance/UAT remain NOT VERIFIED. **تقييم الجودة:** PARTIAL / NO-GO؛ **handoff:** `audit/2026-09-24/QC-ADP-11-handoff.md`؛ العوائق المرتبطة: QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-019, QC-PAGE-F-029

### RT-SHARED-001 — `/search`
- **النوع/المنهج/السبب:** Utility؛ إيجاد/إرشاد/حدود صلاحية. الصفحة تؤدي مهمة مساعدة لا انتقال QC مباشر.
- **الملف/الظهور/المستخدم:** `src/pages/search.astro`؛ `permission-bound` (`required`)؛ مستخدم نشط. **الهدف/الدورة:** بحث وإشعارات وحساب وتاريخ ومساعدة وAI؛ قراءة أو إجراء مقيد بحسب السطح.
- **المصدر والبيانات:** قراءة عبر shared/use case أو صفحة ثابتة. كيانات مرجعية مرشحة: `حسب المجال`. الحالة النصية المستخرجة: RIS.
- **أثر مصدر قابل للتتبع:** مفاتيح صلاحية مذكورة في الصفحة `PERM-SRCH-USE` L14. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Search؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** راجع المهمة الأساسية واللغة والاسترداد وإتاحة لوحة المفاتيح، مع عدم توسيع السلطة.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016., QC-PAGE-F-026

### RT-SHARED-002 — `/notifications`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/notifications.astro`؛ `authenticated` (`required`)؛ مستخدم نشط. **الهدف/الدورة:** بحث وإشعارات وحساب وتاريخ ومساعدة وAI؛ قراءة أو إجراء مقيد بحسب السطح.
- **المصدر والبيانات:** قراءة عبر shared/use case أو صفحة ثابتة. كيانات مرجعية مرشحة: `حسب المجال`. الحالة النصية المستخرجة: لم تُستخرج حالات نصية مباشرة؛ راجع use case.
- **أثر مصدر قابل للتتبع:** لا تُظهر الصفحة نفسها استدعاء `astro:actions` أو مفتاح `PERM-*`؛ افحص التوجيه والخادم قبل استنتاج الصلاحية. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** قراءة/توجيه؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014., QC-PAGE-F-026, QC-PAGE-F-029

### RT-SHARED-003 — `/account`
- **النوع/المنهج/السبب:** Utility؛ إيجاد/إرشاد/حدود صلاحية. الصفحة تؤدي مهمة مساعدة لا انتقال QC مباشر.
- **الملف/الظهور/المستخدم:** `src/pages/account.astro`؛ `authenticated` (`required`)؛ مستخدم نشط. **الهدف/الدورة:** بحث وإشعارات وحساب وتاريخ ومساعدة وAI؛ قراءة أو إجراء مقيد بحسب السطح.
- **المصدر والبيانات:** `../modules/identity/application/get-account.js`, `../modules/identity/application/identity-dependencies.js`. كيانات مرجعية مرشحة: `حسب المجال`. الحالة النصية المستخرجة: لم تُستخرج حالات نصية مباشرة؛ راجع use case.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../modules/identity/application/get-account.js` L4، `../modules/identity/application/identity-dependencies.js` L5؛ استدعاء واجهة الإجراء `actions.account.changePassword` L54، `actions.logout` L110. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Show, Change password, Sign out؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** راجع المهمة الأساسية واللغة والاسترداد وإتاحة لوحة المفاتيح، مع عدم توسيع السلطة.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016., QC-PAGE-F-025

### RT-SHARED-004 — `/audit`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/audit.astro`؛ `permission-bound` (`required`)؛ مستخدم نشط. **الهدف/الدورة:** بحث وإشعارات وحساب وتاريخ ومساعدة وAI؛ قراءة أو إجراء مقيد بحسب السطح.
- **المصدر والبيانات:** قراءة عبر shared/use case أو صفحة ثابتة. كيانات مرجعية مرشحة: `حسب المجال`. الحالة النصية المستخرجة: AUTHORIZATION.
- **أثر مصدر قابل للتتبع:** لا تُظهر الصفحة نفسها استدعاء `astro:actions` أو مفتاح `PERM-*`؛ افحص التوجيه والخادم قبل استنتاج الصلاحية. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Apply filters؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** حَيًّا: خمسة أحداث وفلاتر، لكن جدول العرض يظهر نوع الحدث/UUID التقني. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014., QC-PAGE-F-027

### RT-HELP-001 — `/help`
- **النوع/المنهج/السبب:** Utility؛ إيجاد/إرشاد/حدود صلاحية. الصفحة تؤدي مهمة مساعدة لا انتقال QC مباشر.
- **الملف/الظهور/المستخدم:** `src/pages/help/index.astro`؛ `permission-bound` (`required`)؛ مستخدم نشط. **الهدف/الدورة:** بحث وإشعارات وحساب وتاريخ ومساعدة وAI؛ قراءة أو إجراء مقيد بحسب السطح.
- **المصدر والبيانات:** قراءة عبر shared/use case أو صفحة ثابتة. كيانات مرجعية مرشحة: `حسب المجال`. الحالة النصية المستخرجة: لم تُستخرج حالات نصية مباشرة؛ راجع use case.
- **أثر مصدر قابل للتتبع:** لا تُظهر الصفحة نفسها استدعاء `astro:actions` أو مفتاح `PERM-*`؛ افحص التوجيه والخادم قبل استنتاج الصلاحية. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Print this guide؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** راجع المهمة الأساسية واللغة والاسترداد وإتاحة لوحة المفاتيح، مع عدم توسيع السلطة.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016.

### RT-QUAR-003 — `/quarantine/admin/[templateId]`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/quarantine/admin/[templateId].astro`؛ `permission-bound` (`required`)؛ Receiving/Inspector/Supervisor/QCM. **الهدف/الدورة:** استلام وفحص وحجر وقرار release منفصل؛ استلام → فحص → مراجعة → release.
- **المصدر والبيانات:** `../../../modules/quarantine/templates/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.receiving_items; qc.inspection_reports; qc.inspection_templates`. الحالة النصية المستخرجة: SUPERVISOR, MANAGER, SYSTEM_OWNER, REVIEW, DRAFT, APPROVE, UNDER_REVIEW, STOP.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/quarantine/templates/application/dependencies.js` L5؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-ADM-TEMPLATES` L14؛ يوجد تمرير `expectedVersion` في الصفحة. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Create DRAFT revision؛ `/quarantine/admin`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** أظهر الحالة والنسخة والسجل المرتبط والحدث التالي؛ اختبر صلاحيات الأفعال على use case لا على ظهور الزر.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002, QC-PAGE-F-014.

### RT-DOC-007 — `/documents/[documentId]/versions/[versionId]/edit`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/documents/[documentId]/versions/[versionId]/edit.astro`؛ `permission-bound` (`required`)؛ مالك مستند/مراجع/QCM. **الهدف/الدورة:** هوية مستند ونسخة ومراجعة؛ إنشاء → نسخة → مراجعة → فعالية.
- **المصدر والبيانات:** `../../../../../modules/documents/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.document_identities; qc.document_versions`. الحالة النصية المستخرجة: DRAFT.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../../../modules/documents/application/dependencies.js` L3؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-DOC-EDIT-DRAFT` L9؛ استدعاء واجهة الإجراء `actions.documents.updateDraft` L35؛ يوجد تمرير `expectedVersion` في الصفحة. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Save draft, Back to version؛ `/documents/${document.id`, `/documents/${form.dataset.documentId`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** أظهر الحالة والنسخة والسجل المرتبط والحدث التالي؛ اختبر صلاحيات الأفعال على use case لا على ظهور الزر.
- **تحسين مسار مطلوب:** أظهر النسخة الفعالة ومصدرها وتاريخها وماذا يستخدمها، وافصل المسودة عن النسخة المعتمدة مع سبب الإرجاع. **إغلاقه:** نسختان مع انتقال فعالية؛ سجل يستخدم النسخة الصحيحة المجمدة، ورفض تعديل/حذف نسخة معتمدة أو توقيع غير مخول. (`QC-PAGE-F-023` / `QC-ADP-20`).
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014, QC-PAGE-F-023.

### RT-REL-001 — `/governance/releases/[releaseId]`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/governance/releases/[releaseId].astro`؛ `permission-bound` (`required`)؛ yazeed أو مستخدم مخول. **الهدف/الدورة:** صحة ونشر ونسخ واستعادة؛ تشخيص/دليل إصدار/استعادة معزولة.
- **المصدر والبيانات:** `../../../modules/release-governance/application/capability.js`. كيانات مرجعية مرشحة: `qc.backup_runs; qc.restore_runs; qc.recovery_evidence`. الحالة النصية المستخرجة: PENDING, UNVERIFIED, SERVER_EVIDENCE_REQUIRED.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/release-governance/application/capability.js` L3؛ استدعاء واجهة الإجراء `actions.releaseGovernance.approveRelease` L34؛ يوجد تمرير `expectedVersion` في الصفحة. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Approve release؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** أظهر الحالة والنسخة والسجل المرتبط والحدث التالي؛ اختبر صلاحيات الأفعال على use case لا على ظهور الزر.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-003, QC-PAGE-F-004, QC-PAGE-F-014.

### RT-ERROR-404 — `/404`
- **النوع/المنهج/السبب:** Error؛ استرداد الخطأ والإرشاد. المهمة هنا العودة الآمنة من فشل أو رابط غير صالح.
- **الملف/الظهور/المستخدم:** `src/pages/404.astro`؛ `public` (`unregistered-error`)؛ مستخدم نشط. **الهدف/الدورة:** بحث وإشعارات وحساب وتاريخ ومساعدة وAI؛ قراءة أو إجراء مقيد بحسب السطح.
- **المصدر والبيانات:** قراءة عبر shared/use case أو صفحة ثابتة. كيانات مرجعية مرشحة: `حسب المجال`. الحالة النصية المستخرجة: لم تُستخرج حالات نصية مباشرة؛ راجع use case.
- **أثر مصدر قابل للتتبع:** لا تُظهر الصفحة نفسها استدعاء `astro:actions` أو مفتاح `PERM-*`؛ افحص التوجيه والخادم قبل استنتاج الصلاحية. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** قراءة/توجيه؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. النص المصدر يوجه إلى Dashboard حتى حين يكون href للضيف `/login`. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** راجع المهمة الأساسية واللغة والاسترداد وإتاحة لوحة المفاتيح، مع عدم توسيع السلطة.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-017, QC-PAGE-F-014.

### RT-ERROR-500 — `/500`
- **النوع/المنهج/السبب:** Error؛ استرداد الخطأ والإرشاد. المهمة هنا العودة الآمنة من فشل أو رابط غير صالح.
- **الملف/الظهور/المستخدم:** `src/pages/500.astro`؛ `public` (`unregistered-error`)؛ مستخدم نشط. **الهدف/الدورة:** بحث وإشعارات وحساب وتاريخ ومساعدة وAI؛ قراءة أو إجراء مقيد بحسب السطح.
- **المصدر والبيانات:** قراءة عبر shared/use case أو صفحة ثابتة. كيانات مرجعية مرشحة: `حسب المجال`. الحالة النصية المستخرجة: لم تُستخرج حالات نصية مباشرة؛ راجع use case.
- **أثر مصدر قابل للتتبع:** لا تُظهر الصفحة نفسها استدعاء `astro:actions` أو مفتاح `PERM-*`؛ افحص التوجيه والخادم قبل استنتاج الصلاحية. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Back to dashboard؛ `/dashboard`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** راجع المهمة الأساسية واللغة والاسترداد وإتاحة لوحة المفاتيح، مع عدم توسيع السلطة.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-017.

### تعميق مرجعي للمسارات الأعلى أثرًا

**`/laboratory/tests/[labTestId]/execute` — هندسة القياس.** المصدر `src/pages/laboratory/tests/[labTestId]/execute.astro:22-37,55-147,231-280` يربط التحرير بـ`DRAFT` و`PERM-LAB-EDIT-DRAFT`، ويعرض العينة والوحدة والدقة والمعيار ومصدره من سياق مجمّد، ويستدعي `actions.laboratory.saveMeasurements` ثم `submit`. هذه قوة ملموسة تقلل إعادة كتابة الوحدات، لكنها لم تُشغّل حيًا لأن لا قالب معتمدًا/سجلًا حقيقيًا. اختبار الإغلاق: قيم ناقصة، نوع خاطئ، تعارض نسخة، معدات منتهية المعايرة، RETURN ثم استئناف، 12 عينة، ومطابقة نتيجة الخادم مع المصدر المعتمد. لا يُخترع حد قبول.

**`/approvals/[approvalId]` — قرار مضبوط.** المصدر `src/pages/approvals/[approvalId].astro:10-21,28-36,46-94` يقدم subject snapshot وversion/SoD ومبرر RETURN/REJECT، ويستدعي `actions.approvals.decide`؛ لا يغيّر صاحب السجل تلقائيًا بمجرد التوقيع. الطابور الحي فارغ، لذلك قرار موافقة/رفض فعلي وصلاحية yazeed في حالة كل موضوع غير مثبتين. تحقق من fresh reauthentication وسياسة التوقيع والرفض المباشر وإعادة التركيز بعد خطأ النسخة.

**`/tasks/[taskId]` — مثال populated وحيد.** السجل الحي أظهر `DRAFT` ونسخة `1` وزر `Activate`، بينما المصدر `src/pages/tasks/[taskId].astro:30,47` يربط الظهور بـ`PERM-TASK-CREATE` ويرسل `expectedVersion` إلى `actions.tasks.transition`. النص `UNSPECIFIED` في الأولوية لغة تنفيذية يمكن تحويلها إلى `لم تُحدد الأولوية`. فتح السجل لا يثبت تنفيذ الانتقال؛ لا نضغط زر Activate في الإنتاج خلال تدقيق قراءة فقط.

**`/reject-reports` و`/reject-reports/new` — توقف مخطط مثبت.** المصدر `src/pages/reject-reports/index.astro:25-36` يفحص availability ويضبط HTTP 503 مع رسالة استرداد صريحة؛ الحي يرد بحظر schema. النص أفضل من 500 التاريخي، لكنه لا يوفر سير العمل. لا تقدم برومبتات الحزمة زر تجاوز أو mock data؛ الإغلاق يحتاج migration parity وصلاحية تشغيل منفصلة.

**`/dashboard` و`/system/health` — دلالة مختلفة للصحة.** لوحة القيادة الحية تعرض تعريف البسط/النطاق ورابط الحفر لكل KPI، وتمنع رسم سلسلة استلام صفرية كاتجاه وهمي. صفحة الصحة تؤكد `NOT READY` و`0018/0039` و`release identity UNVERIFIED` و`RESTORE NOT VERIFIED`؛ لوحة control-center قد تعرض `Core system READY` لأنها تفحص نواة مختلفة. يلزم إبقاء العنوانين مميزين بصريًا ولغويًا حتى لا يستنتج المشغّل GO من صحة العملية.

**`/404` — اتساق رابط الاسترداد.** المصدر `src/pages/404.astro:4` يبدّل `href` إلى `/login` للزائر غير المصادق، لكن النص يبقى `Go to dashboard`. راجع تسمية الرابط وفق الوجهة الفعلية. هذا يدخل ضمن `QC-PAGE-F-014` و`QC-ADP-13` في فحص النصوص، دون تغيير منطق التفويض.

### عقد الأفعال المرصودة في المصدر

| الفعل | المستخدم/الحالة | Entry point | Mutation وaudit المطلوب التحقق منه | حالة الدليل |
|---|---|---|---|---|
| Create task | `PERM-TASK-CREATE`، سجل جديد | `actions.tasks.createTask` من `src/pages/tasks/new.astro:45,78` | `qc.tasks` داخل use case + حدث CREATE_TASK؛ ظهرت واقعة تاريخية في audit الحي، لكن هذه الجولة بلا كتابة | SOURCE + live form؛ transaction الحالي NOT VERIFIED هنا |
| Activate task | `PERM-TASK-CREATE`، `DRAFT`، نسخة متوقعة | `actions.tasks.transition` من `src/pages/tasks/[taskId].astro:30,47` | تعديل حالة `qc.tasks` مشروط بالنسخة + audit | SOURCE + live button؛ mutation NOT RUN |
| Create receiving | صلاحية إنشاء الاستلام، سجل جديد | `actions.quarantine.createReceiving` من `src/pages/quarantine/receiving/new.astro:59,108` | إدراج `qc.receiving_items` مع audit؛ لا release من الإنشاء | SOURCE + live form؛ mutation NOT RUN |
| Save lab measurements | `DRAFT` + `PERM-LAB-EDIT-DRAFT` + version | `actions.laboratory.saveMeasurements` من `src/pages/laboratory/tests/[labTestId]/execute.astro:231` | قياسات `qc.lab_measurements`/لقطة سياق وتدقيق حسب use case | SOURCE فقط؛ populated PG NOT VERIFIED |
| Decide approval | مكلّف مع `PENDING/IN_PROGRESS` + SoD/reauth/version | `actions.approvals.decide` من `src/pages/approvals/[approvalId].astro:46-94` | `qc.approval_decisions`/توقيع/تدقيق مع انتقال الدومين المنفصل | SOURCE فقط؛ queue الحية 0 |

أي اقتراح زر آخر في هذا التقرير هو **طلب تحليل سياسة/use case**، لا تفويض للتنفيذ أو اسم mutation مفترض. يجب أن يسمي تنفيذ كل مهمة actor/state/entry point/SQL/audit/outbox قبل إضافة الزر.

## 8. رحلات المستخدم عبر الصفحات
- **Receiving → Inspection → HOLD/PASS → Review → Release:** المسار الحي يبدأ بسجل استلام فارغ، وسجل الفحص يوجّه إليه؛ مصدر النتيجة/قرار release النهائي غير مثبت. يجب حفظ item/lot/quantity من الاستلام وتجنب إعادة كتابتها في الفحص، وإظهار PASS منفصلًا عن RELEASED.
- **Finding → NCR → RCA → CAPA → Effectiveness → Closure:** قوائم Findings/NCR/RCA/CAPA حية لكنها فارغة؛ NCR direct create وCAPA close معلّقان على السياسة. الربط يظهر من المصدر في detail؛ اختبر رحلة سجلية كاملة، مصدر finding، نقل النسخة والأدلة، والرجوع بعد RETURN.
- **Lab template → test → execute → submit → review → QCM:** إنشاء اختبار حي يتوقف عند غياب قالب معتمد؛ مصدر التنفيذ يعرض وحدات/precision/criteria من frozen context بدل إعادة الإدخال. اختبار 12 عينة ومراجعة مستقلة وقرار QCM يحتاج fixture وقاعدة بيانات ومصدر معتمد.
- **Equipment → calibration → eligibility → test usage:** نماذج calibration/maintenance الحية تختار equipment بدل إعادة كتابة معرّفه؛ لا معدات حيًا. اختبر منع استخدام معدة غير مؤهلة وتجميد لقطة المعايرة في الاختبار.
- **Document → version → review → effective → usage:** لا مستندات حيًا؛ مسارات النسخة/المراجعة موجودة مصدرًا. اختبر تاريخ الفعالية وروابط WI/SOP وتوقيع المراجع على بيانات ممثلة.
- **Change request → review → apply:** الواجهة الحية توضح أن الموافقة لا تعدّل الهدف تلقائيًا. اختبر تطبيق التغيير مرة واحدة، التأخر والتعارض والرجوع.
- **Reject report → slip/daily → report/export:** محجوب عند migration 0018/0039؛ لا يمكن تقييم المسار الفعلي قبل بيئة متطابقة مع مصدر 0039.
- **Backup → restore request → isolated rehearsal:** الكتالوج الحي فارغ؛ لا دليل على استعادة. يلزم مصدر bundle وهدف معزول وسياسة قرار RPO/RTO.

## 9. ربط قاعدة البيانات
العمود التالي **خريطة مرشحة من migrations/source** وليست إثبات query path/transaction على قاعدة الإنتاج. كل write يحتاج فحص use case/repository/SQL وأثر audit/outbox في خطة التنفيذ.
| العائلة | Reads / related | Writes / transaction / audit | Live state |
|---|---|---|---|
| Administration | `qc.users; qc.roles; qc.permissions; qc.user_scopes` | read-only للفهارس؛ mutations عبر application use case، حد transaction/audit/outbox **NOT VERIFIED لكل فعل** | شوهدت صفحة واحدة على الأقل |
| Approvals | `qc.approval_cases; qc.approval_work_items` | read-only للفهارس؛ mutations عبر application use case، حد transaction/audit/outbox **NOT VERIFIED لكل فعل** | شوهدت صفحة واحدة على الأقل |
| Assets | `qc.equipment; qc.calibration_records; qc.maintenance_records` | read-only للفهارس؛ mutations عبر application use case، حد transaction/audit/outbox **NOT VERIFIED لكل فعل** | شوهدت صفحة واحدة على الأقل |
| Authentication | `سجل جلسات/مستخدمين` | read-only للفهارس؛ mutations عبر application use case، حد transaction/audit/outbox **NOT VERIFIED لكل فعل** | SOURCE فقط |
| Change requests | `qc.change_requests; qc.change_application_attempts` | read-only للفهارس؛ mutations عبر application use case، حد transaction/audit/outbox **NOT VERIFIED لكل فعل** | شوهدت صفحة واحدة على الأقل |
| Dashboard & work | `read models متعددة` | read-only للفهارس؛ mutations عبر application use case، حد transaction/audit/outbox **NOT VERIFIED لكل فعل** | شوهدت صفحة واحدة على الأقل |
| Documents | `qc.document_identities; qc.document_versions` | read-only للفهارس؛ mutations عبر application use case، حد transaction/audit/outbox **NOT VERIFIED لكل فعل** | شوهدت صفحة واحدة على الأقل |
| Laboratory | `qc.lab_tests; qc.lab_samples; qc.lab_measurements; qc.laboratory_report_drafts` | read-only للفهارس؛ mutations عبر application use case، حد transaction/audit/outbox **NOT VERIFIED لكل فعل** | شوهدت صفحة واحدة على الأقل |
| Quality | `qc.findings; qc.ncrs; qc.rcas; qc.capas` | read-only للفهارس؛ mutations عبر application use case، حد transaction/audit/outbox **NOT VERIFIED لكل فعل** | شوهدت صفحة واحدة على الأقل |
| Quarantine | `qc.receiving_items; qc.inspection_reports; qc.inspection_templates` | read-only للفهارس؛ mutations عبر application use case، حد transaction/audit/outbox **NOT VERIFIED لكل فعل** | شوهدت صفحة واحدة على الأقل |
| Reject Reports | `qc.reject_reports; qc.reject_issue_slips; qc.daily_reject_entries` | read-only للفهارس؛ mutations عبر application use case، حد transaction/audit/outbox **NOT VERIFIED لكل فعل** | شوهدت صفحة واحدة على الأقل |
| Reports | `read model حسب التقرير` | read-only للفهارس؛ mutations عبر application use case، حد transaction/audit/outbox **NOT VERIFIED لكل فعل** | شوهدت صفحة واحدة على الأقل |
| Shared | `حسب المجال` | read-only للفهارس؛ mutations عبر application use case، حد transaction/audit/outbox **NOT VERIFIED لكل فعل** | شوهدت صفحة واحدة على الأقل |
| System & recovery | `qc.backup_runs; qc.restore_runs; qc.recovery_evidence` | read-only للفهارس؛ mutations عبر application use case، حد transaction/audit/outbox **NOT VERIFIED لكل فعل** | شوهدت صفحة واحدة على الأقل |
| Tasks | `qc.tasks` | read-only للفهارس؛ mutations عبر application use case، حد transaction/audit/outbox **NOT VERIFIED لكل فعل** | شوهدت صفحة واحدة على الأقل |

## 10. مصفوفة التفويض
`PUBLIC` للدخول/الأخطاء؛ الصفحات التشغيلية تتطلب جلسة ACTIVE؛ `/system/health` و`/system/control-center` محصورتان في yazeed/SYSTEM_OWNER وفق route policy. بقية صفحات admin مرئية للمصادق لكن data read/action تُحكم منفصلًا. قراءة yazeed للصفحات المبينة لا تثبت Create/Edit/Approve/Void/Release. اطلب لكل action: permission + scope + state + expectedVersion + SoD + audit في الخادم، واختبر رفض الدور الآخر وdirect POST.

## 11. نتائج كتابة UX
| قبل (مرصود) | بعد مقترح | السبب |
|---|---|---|
| `UNSPECIFIED` في Priority بمهمة حية | `لم تُحدد الأولوية` | مصطلح بشري دون تعديل القيمة المخزنة |
| `VOID` في فلاتر الحي | `ملغى (VOID)` عند الحاجة للمصطلح المضبوط | يظل الرمز القانوني ظاهرًا مع تفسير |
| `SCHEMA_NOT_READY` ككود داخلي | عنوان: `تقارير الرفض غير متاحة حتى اكتمال تحديث قاعدة البيانات` | النص الحي فعلًا يشرح الاسترداد؛ أبق الكود للتشخيص الداخلي فقط |
| UUID في جدول Audit | مرجع سجل بشري ورابط، مع UUID في التفاصيل التقنية المخولة | تقليل عبء التذكر والنسخ |
هذه أمثلة مثبتة/مستندة إلى المصدر؛ **مراجعة كل visible string في كل حالة ليست مكتملة** لأن أغلب السطوح بلا سجلات.

## 12. العوامل البشرية
الأولوية لسياق تنفيذ المختبر والفحص قرب الحقول، ثم قرار المراجع مع دليل ونسخة واضحة، ثم تقليل الانتقال بين السجلات. عند أي إعادة إدخال item/lot/supplier/PO/sample/equipment/document/user/date/reportNo يجب إثبات مصدر موثوق؛ الأصول الحية تُظهر lookup للمعدة، وهذا نمط يستحق تعميمًا مضبوطًا. لا تعتمد autosave لسجل مضبوط قبل سياسة مسودة/احتفاظ/نسخة.

## 13. إتاحة الوصول
المصدر يبين `skip-link` وlandmarks وعناوين وlabels في صفحات فُحصت، لكن لا حكم WCAG شامل. المطلوب: keyboard-only، focus return بعد dialog/خطأ، قارئ شاشة، 200% zoom، 320px reflow، contrast للحالات، target size، reduced motion، forced colors، وطباعة. سجل `PASS/FAIL/BLOCKED` لكل route/state/viewport، وأصلح أي مانع قبل إعلان الإغلاق.

## 14. الأداء
لم تُقَس Web Vitals أو query timings أو N+1 في هذه الجولة؛ الصفحات الحية غالبًا فارغة. لا درجة أداء وظيفية مستنتجة من سرعة التنقل الشخصي. قِس `/dashboard`, `/work`, receiving/tasks/lab registers, audit/report export على fixtures ممتلئة وممثلة، مع budget يقره المالك، ثم أصلح موضع البطء المقاس.

## 15. التقارير والتحليل
تقرير `quarantine-aging` ظاهر حيًا، ودلالات source/scope/filter/time موجودة في كود التقارير الحديث. إثبات التماثل بين الشاشة وCSV/XLSX والطباعة والحساب الإجمالي على بيانات متعددة النطاق ما زال مطلوبًا. لا تعرض reject analytics global في لوحة ذات scope شخصي قبل بناء predicate متطابق.

## 16. توصيات لوحة القيادة
| KPI حي | المعنى/البسط | المقام | النطاق/الزمن | مصدر القراءة/الحفر | الحالة |
|---|---|---|---|---|---|
| Pending review | عناصر موافقة قابلة للإجراء | لا ينطبق | المكلف/الدور؛ لقطة حالية | `/approvals`؛ query الدقيقة في read model تحتاج اختبار parity | مرئي 0؛ دلالة مفسرة، صحة العدد على بيانات ممثلة NOT VERIFIED |
| Unread notifications | إشعارات غير مقروءة | لا ينطبق | المستلم؛ لقطة حالية | `/notifications?unread=1`؛ query الدقيقة في read model تحتاج اختبار parity | مرئي 0؛ دلالة مفسرة، صحة العدد على بيانات ممثلة NOT VERIFIED |
| My HOLD items | استلامات HOLD المنشأة بواسطته | لا ينطبق | المالك؛ لقطة حالية | `/quarantine/receiving?inspectionResult=HOLD&ownership=mine`؛ query الدقيقة في read model تحتاج اختبار parity | مرئي 0؛ دلالة مفسرة، صحة العدد على بيانات ممثلة NOT VERIFIED |
| Returned to me | تقارير تفتيش RETURNED للمؤلف | لا ينطبق | المؤلف؛ لقطة حالية | `/quarantine/inspections?state=RETURNED&ownership=mine`؛ query الدقيقة في read model تحتاج اختبار parity | مرئي 0؛ دلالة مفسرة، صحة العدد على بيانات ممثلة NOT VERIFIED |
| Tasks overdue | مهام مسندة ومتأخرة | لا ينطبق | المكلف؛ اليوم UTC | `/tasks?assignee=mine&due=overdue`؛ query الدقيقة في read model تحتاج اختبار parity | مرئي 0؛ دلالة مفسرة، صحة العدد على بيانات ممثلة NOT VERIFIED |
| Tasks due today | مهام مسندة تستحق اليوم | لا ينطبق | المكلف؛ اليوم UTC | `/tasks?assignee=mine&due=today`؛ query الدقيقة في read model تحتاج اختبار parity | مرئي 0؛ دلالة مفسرة، صحة العدد على بيانات ممثلة NOT VERIFIED |
| Tasks assigned to me | مهام مفتوحة مسندة | لا ينطبق | المكلف؛ لقطة حالية | `/tasks?assignee=mine&open=1`؛ query الدقيقة في read model تحتاج اختبار parity | مرئي 0؛ دلالة مفسرة، صحة العدد على بيانات ممثلة NOT VERIFIED |
| Tasks on hold | مهام ON_HOLD مسندة | لا ينطبق | المكلف؛ لقطة حالية | `/tasks?assignee=mine&state=ON_HOLD`؛ query الدقيقة في read model تحتاج اختبار parity | مرئي 0؛ دلالة مفسرة، صحة العدد على بيانات ممثلة NOT VERIFIED |
| Calibrations overdue | معايرات OVERDUE | لا ينطبق | نطاق القراءة؛ لقطة حالية | `/assets/calibrations?state=OVERDUE`؛ query الدقيقة في read model تحتاج اختبار parity | مرئي 0؛ دلالة مفسرة، صحة العدد على بيانات ممثلة NOT VERIFIED |
| Lab tests returned to me | اختبارات RETURNED للمؤلف | لا ينطبق | المؤلف؛ لقطة حالية | `/laboratory/tests?state=RETURNED&ownership=mine`؛ query الدقيقة في read model تحتاج اختبار parity | مرئي 0؛ دلالة مفسرة، صحة العدد على بيانات ممثلة NOT VERIFIED |
المخطط الوحيد الحالي: receiving records/day؛ سؤال العمل «هل تغيّر حجم الاستلام يوميًا؟»، unit=records، grain=UTC day، window=14 يومًا، مصدر receiving، drill-down سجل الاستلام. الحي صرّح بأنه لا يرسم شيئًا لأن كل الأيام صفر. لا تُضاف مخططات أخرى حتى يتوفر مصدر ونطاق وفترة ووحدة وفائدة قرار.

## 17. توصيات التصميم
أبقِ الفروق بين صفحة تنفيذ علمي، طابور قرار، سجل، وصفحة استعادة. لصفحات القياس: رأس ثابت بسياق العينة/الوحدة/مصدر المعيار، شبكة قابلة للوصول مع تسمية كل خلية. للمراجعة: عمود دليل وعمود قرار مع النسخة/SoD. للسجلات: فلاتر واضحة ثم عدد/فرز/صف/حالة صفر وفعل ضمن الصلاحية. لا توحد كثافة هذه الصفحات قسرًا.

## 17A. مصطلحات لا يجوز خلطها عند التسليم
| المصطلح | المعنى الذي يجب أن تعرضه الصفحة | اختبار القبول |
|---|---|---|
| `PASS` | نتيجة فحص/اختبار وفق مصدر معتمد؛ لا تعني إطلاق المادة | لا يظهر `RELEASED` بمجرد `PASS` |
| `HOLD` | إيقاف القرار أو الحركة مع سبب ومسؤول وخطوة تالية | لا يسمح الخادم بانتقال محظور من HOLD |
| `RELEASED` | قرار إطلاق مستقل بصلاحية ودليل وتوقيع حسب السياسة | يظهر الفاعل والوقت والمصدر، ويرفض غير المخول |
| `DRAFT` / `RETURNED` | مسودة أو سجل أُعيد للتصحيح؛ ليس اعتمادًا | تظهر الحقول القابلة للتعديل والسبب والنسخة |
| `NOT VERIFIED` | لم يوجد دليل كافٍ على هذا السلوك | لا يُعرض كـ`PASS` أو `READY` |
| `NO-GO` | بوابة إطلاق لم تستوفِ الأدلة الإلزامية | يعرض المانع والمالك والخطوة المطلوبة |

## 18. قدرات اكتُشفت
- كود report-templates الجديد يقدم مسودة مؤلفة بنسخة وطباعة مع تحذير أنها ليست نتيجة معتمدة؛ ظهوره الحي لا يثبت صلاحية الكتابة أو migration 0039.
- Dashboard يسمي تغطية كل مصدر وسبب غياب البيانات، ويمنع جمع PASS مع release؛ سجل Tasks الحي يوفر pagination/filter/density.
- نماذج calibration وmaintenance تختار equipment من النطاق بدل إدخال UUID يدوي.

## 19. قدرات ناقصة أو مؤجلة
- مصدر نتيجة inspection وقالب lab معتمدان؛ سياسة NCR creation وCAPA effectiveness/closure؛ read models لطابور مراجعة الوثائق وquality ownership؛ نطاق reject analytics؛ أدلة release ingestion؛ backup/restore policy؛ auth recovery routes المؤجلة؛ UAT وAT وperformance على بيانات ممثلة.

## 19A. سجل الإضافات والاقتراحات والتحسينات

هذا السجل يحول المقترحات المتناثرة في الأقسام 8–19 والوثائق المعتمدة إلى عمل قابل للقبول. ظهور المقترح هنا **لا يعني أنه نُفذ**. يلزم لكل بند دليل على المرشح نفسه، وحالة `PASS/FAIL/BLOCKED/NOT VERIFIED`.

| ID | الإضافة/التحسين المحدد | معيار الإغلاق | البرومبت |
|---|---|---|---|
| I-01 | سياق العينة والوحدة والدقة ومصدر المعيار قرب خلية قياس المختبر | 12 عينة، وحدة/precision ومصدر مجمد، منع حقل غير صالح واسترداد إدخال | QC-ADP-05 |
| I-02 | قرار التفتيش مع دليل مستقل وفصل PASS عن RELEASED | رفض release بلا مصدر/مراجع، وإظهار سبب HOLD والنسخة | QC-ADP-02 |
| I-03 | ربط Finding وNCR وRCA وCAPA مع خطوة لاحقة واضحة | رحلة سجلية حتى effectiveness/closure بعد اعتماد السياسة | QC-ADP-06 |
| I-04 | معنى وscope وفترة ومصدر كل KPI ورابط حفر بنفس المرشح | مطابقة عدد اللوحة مع السجل عبر أدوار وفلاتر وبيانات ممثلة | QC-ADP-07 |
| I-05 | مصالحة الشاشة وCSV/XLSX والطباعة | نفس النطاق والفلاتر والعدد والفرز والمصدر في كل مخرج | QC-ADP-10 |
| I-06 | نصوص UNSPECIFIED وVOID وSCHEMA_NOT_READY وUUID و404 | `Before/After` لكل موضع مرصود، رابط/زر يصف وجهته، وحالة خطأ قابلة للاسترداد | QC-ADP-13 |
| I-07 | lookup/pre-fill للقيم الموجودة بدل تكرار item/lot/PO/equipment | مصفوفة مصدر لكل حقل، حفظ رابطه ورفض المصدر غير المخول | QC-ADP-14 |
| I-08 | وصول keyboard/AT/reflow لحالات empty/error/populated/decision | مصفوفة route/state/viewport وتقنية مساعدة مع معالجة الموانع | QC-ADP-09 |
| I-09 | أداء سجلات ولوحات وتقارير على بيانات ممثلة | baseline، زمن واستعلامات، budget معتمد، وقياس بعد الإصلاح | QC-ADP-15 |
| I-10 | رحلة المهمة من المسودة إلى الإكمال والعودة | نجاح ورفض جميع الانتقالات بالنسخة والدور وأثر audit | QC-ADP-17 |
| I-11 | دليل القرار وإعادة المصادقة وفصل الواجبات في الاعتماد | نجاح قرار ورفض self-approval/نسخة قديمة/secret خاطئ | QC-ADP-18 |
| I-12 | أهلية المعدات عند اختيارها في المختبر | منع معدات منتهية المعايرة/تحت الصيانة وتجميد لقطة المصدر | QC-ADP-19 |
| I-13 | النسخة الفعالة للمستند وعلاقتها بالاستخدام | استخدام WI/SOP الصحيح ورفض تغيير نسخة معتمدة | QC-ADP-20 |
| I-14 | فصل اعتماد طلب التغيير عن تطبيقه | Apply مرة واحدة ورفض التعارض والتكرار مع حفظ الهدف عند الفشل | QC-ADP-21 |
| I-15 | مسارات الاسترداد المؤجلة وروابط 404/500 | قرار منتج موثق؛ لا رابط مضلل أو مسار شبح | QC-ADP-16 |
| I-16 | دورة الحساب والجلسة والاسترداد | نجاح وفشل وإبطال وتغيير كلمة مرور وreturnTo آمن | QC-ADP-22 |
| I-17 | بحث وإشعارات بالنطاق الصحيح | نتائج ومستلم وروابط مخولة دون صفر مضلل | QC-ADP-23 |
| I-18 | سجل تدقيق كامل ومحمي | حدث لكل فعل حرج ورفض تعديل/حذف أو قراءة خارج النطاق | QC-ADP-24 |
| I-19 | سلامة المرفقات والدليل | نوع/حجم/hash وصلاحية وتعويض فشل وسياسة احتفاظ معتمدة | QC-ADP-25 |
| I-20 | عقود التكامل والتكرار | idempotency وdelivery failure آمن ومزود معتمد | QC-ADP-26 |

## 20. مصفوفة حالة دليل الصفحات
- القسم 3 يغطي 90 موضعًا؛ 47 وجهة شوهدت قراءة فقط في الجولة الأصلية، والصفحات الديناميكية الأخرى تحتاج سجلات ممثلة. لا يوجد متوسط درجات صالح. بطاقة كل صفحة تعرض ما ثبت وما لم يُتحقق منه، مع روابط findings.

## 21. حالة دليل النظام
القسم 2 يلخص حكم كل مجال وحدود القياس. لا تُعاد نسب الجودة إلا بعد تعريف مقاييس ذات مقام وأوزان ومصادر بيانات، وتحققها على المرشح نفسه.

## 22. سجل النتائج
| Finding | Severity | Page/family | Evidence | Impact/root cause | Required verification | Prompt |
|---|---|---|---|---|---|---|
| QC-PAGE-F-001 | P0 | Reject Reports | /reject-reports و/new محجوبتان؛ health يعرض 0018 applied مقابل 0039 shipped و21 pending. | مخطط الإنتاج ناقص؛ إكمال مسار migration المصرح بعد بوابة الأسرار وقياس parity. | نفّذ فحصًا على المرشح نفسه مع حالة رفض ونجاح ودليل قابل لإعادة الإنتاج | QC-ADP-01 |
| QC-PAGE-F-002 | P0 | Quarantine | Mind F-013-1 واختبار المرحلتين يذكران غياب مصدر النتيجة الرسمي؛ لا تُخترع معايير. | مصدر نتيجة الفحص وسياسة الاعتماد غير مكتملين؛ اعتماد المصدر والسياسة ثم وصل التنفيذ والمراجعة بنهاية قابلة للتحقق. | نفّذ فحصًا على المرشح نفسه مع حالة رفض ونجاح ودليل قابل لإعادة الإنتاج | QC-ADP-02 |
| QC-PAGE-F-003 | P0 | Release | health حي: Release identity UNVERIFIED؛ سجلات البوابة لا تملك ingest موثوقًا. | أدلة الإصدار وهوية النشر غير مكتملتين؛ ربط exact SHA بالأدلة ثم قرار NO-GO/GO وفق البوابة. | نفّذ فحصًا على المرشح نفسه مع حالة رفض ونجاح ودليل قابل لإعادة الإنتاج | QC-ADP-03 |
| QC-PAGE-F-004 | P0 | System & recovery | health/backups حي: no catalog data وRESTORE NOT VERIFIED. | الاستعادة الإنتاجية غير مثبتة؛ سياسة احتفاظ/RPO/RTO معتمدة وتجربة restore معزولة ودليل. | نفّذ فحصًا على المرشح نفسه مع حالة رفض ونجاح ودليل قابل لإعادة الإنتاج | QC-ADP-04 |
| QC-PAGE-F-005 | P1 | Laboratory | /laboratory/tests/new حي يعرض No approved templates. | لا قوالب اختبار معتمدة في النطاق الحي؛ توفير مصدر وقالب معتمدين ثم اختبار دورة 12 عينة/مراجعة بحسب السياسة. | نفّذ فحصًا على المرشح نفسه مع حالة رفض ونجاح ودليل قابل لإعادة الإنتاج | QC-ADP-05 |
| QC-PAGE-F-006 | P1 | Laboratory | /laboratory/report-templates حي يعرض You do not have permission to create a report draft. | حساب yazeed لا يستطيع إنشاء مسودة تقرير حيًا؛ مصالحة grants الفعلية مع عقد المالك دون تجاوز الصلاحية؛ فحص migration 0039. | نفّذ فحصًا على المرشح نفسه مع حالة رفض ونجاح ودليل قابل لإعادة الإنتاج | QC-ADP-05 |
| QC-PAGE-F-007 | P1 | Quality | /quality/ncr حي: Direct creation is not enabled؛ /quality/capa: closure authority and effectiveness unresolved. | NCR/CAPA معلّقان على قرارات مصدر/فعالية/إغلاق؛ اعتماد قرارات QMS ثم إكمال RCA/CAPA/effectiveness والاختبارات. | نفّذ فحصًا على المرشح نفسه مع حالة رفض ونجاح ودليل قابل لإعادة الإنتاج | QC-ADP-06 |
| QC-PAGE-F-008 | P1 | Dashboard & work | مصدر مستندات محدود النطاق متاح الآن على source candidate مع رابط `/documents?review=mine`؛ جودة/سبب التعطيل/رفض ما زالت NOT_SUPPLIED بقرار. | مستندات: تحقق PG18/role/perf والعدد مقابل register على المرشح نفسه؛ الجودة/الرفض/الأسباب تنتظر قرارات المصدر والمالك. | نفّذ فحصًا على المرشح نفسه مع حالة رفض ونجاح ودليل قابل لإعادة الإنتاج | QC-ADP-07 |
| QC-PAGE-F-009 | P1 | All | معظم الصفحات الحية فارغة؛ dynamic routes بلا fixtures؛ security E2E السابقة 8 PASS/4 FAIL. | اختبارات الدور والحالة والسجل الفعلي غير مكتملة؛ بيئة اختبار معزولة وست شخصيات، فحص GET/POST وحالات الانتقال. | نفّذ فحصًا على المرشح نفسه مع حالة رفض ونجاح ودليل قابل لإعادة الإنتاج | QC-ADP-08 |
| QC-PAGE-F-010 | P1 | All | Mind يسجل browser/AT matrix NOT RUN أو PARTIAL؛ لا تكفي قراءة DOM. | مصفوفة keyboard/AT/responsive لم تُثبت؛ تشغيل فحص 320/390/768/1440 و200% وkeyboard وscreen reader للطرق الحرجة. | نفّذ فحصًا على المرشح نفسه مع حالة رفض ونجاح ودليل قابل لإعادة الإنتاج | QC-ADP-09 |
| QC-PAGE-F-011 | P1 | Reports | سجل QC-ADP-10 يثبت PG18 parity على fixture متعدد النطاق والتاريخ؛ فرق Action filter أُصلح. | تحقق populated query/filter/scope/count/order/CSV/XLSX/formula/security PASS على source candidate؛ print E2E والـlive release/persisted cross-request snapshot ما زالت NOT VERIFIED/BLOCKED. | أُضيف handoff مرتبط ببطاقتي RT-REPORT-001/002؛ أبقِ READY محجوبًا حتى إغلاق E2E/live وقرار run snapshot | QC-ADP-10 |
| QC-PAGE-F-012 | P1 | System & recovery | أربع تصنيفات UNKNOWN حُسمت MIT بدليل نص LICENSE المثبت الإصدار؛ provider URL صار exact allowlist. Advisory audit بلا نتيجة بسبب `registry.npmjs.org` DNS ENOTFOUND، وsecurity E2E توقف لعدم وجود container runtime. | الجزء التقني من التراخيص والوجهات محسوم؛ تبقى نتيجة advisory وsecurity E2E على المرشح مطلوبة قبل الإغلاق. | شغّل pnpm audit وsecurity E2E على المرشح نفسه مع نتيجة نجاح ورفض؛ لا تدّعِ إغلاق high advisories دون نتيجة مصدرية. | QC-ADP-11؛ `audit/2026-09-24/QC-ADP-11-handoff.md` |
| QC-PAGE-F-013 | P1 | All | Mind وUAT plan: ست شخصيات بشرية غير مثبتة، ونطاق توقيع الدورة مفتوح. | UAT البشرية غير منفذة؛ تنفيذ UAT موثق بمشاركين حقيقيين وصلاحية توقيع معتمدة. | نفّذ فحصًا على المرشح نفسه مع حالة رفض ونجاح ودليل قابل لإعادة الإنتاج | QC-ADP-12 |
| QC-PAGE-F-014 | P2 | Registers | لقطات حية تعرض UNSPECIFIED وVOID ورموزًا داخلية؛ و`/404` يضع نص Go to dashboard فوق رابط login للزائر؛ بعض حالات الصفر لا تعطي فعلًا بحسب الصلاحية. | جودة النصوص وحالات الصفر تحتاج مصالحة؛ تدقيق كل النصوص في الحالات populated/empty/error وتوحيد المصطلحات المضبوطة. | نفّذ فحصًا على المرشح نفسه مع حالة رفض ونجاح ودليل قابل لإعادة الإنتاج | QC-ADP-13 |
| QC-PAGE-F-015 | P2 | Forms | نماذج الاستلام/المختبر تتطلب بيانات سياق؛ بعض نماذج الأصول تستخدم اختيار equipment بالفعل. | إعادة الإدخال بين السجلات تحتاج قياسًا وتخفيضًا؛ تتبع الحقول المصدرية واستبدال المكرر بlookup/pre-fill مع سجل المصدر. | نفّذ فحصًا على المرشح نفسه مع حالة رفض ونجاح ودليل قابل لإعادة الإنتاج | QC-ADP-14 |
| QC-PAGE-F-016 | P2 | All | الصفحات الحية فقيرة البيانات؛ لا أدلة query/N+1/Web Vitals لهذه الجولة. | الأداء تحت بيانات ممثلة غير مقاس؛ قياس قبل/بعد لصفحات السجل واللوحات وإصلاح الاختناقات المثبتة. | نفّذ فحصًا على المرشح نفسه مع حالة رفض ونجاح ودليل قابل لإعادة الإنتاج | QC-ADP-15 |
| QC-PAGE-F-017 | P2 | Routing | routes.ts: 88 registered/86 physical؛ 404 و500 فعليتان خارج registry. | صفحتا استعادة معلنتان deferred وصفحتا خطأ خارج التسجيل؛ حسم نطاق recovery وتحديث route matrix والتغطية المعمارية. | نفّذ فحصًا على المرشح نفسه مع حالة رفض ونجاح ودليل قابل لإعادة الإنتاج | QC-ADP-16 |
| QC-PAGE-F-018 | P2 | Administration | الحساب الحي يعرض دورين ونطاق GLOBAL؛ العرض لا يثبت فحوص self-grant/SoD على POST. | السطوح الإدارية تحتاج اختبارات إجراء عالي الأثر؛ اختبار الدور والإبطال والنطاق والنسخة على API مع تدقيق. | نفّذ فحصًا على المرشح نفسه مع حالة رفض ونجاح ودليل قابل لإعادة الإنتاج | QC-ADP-08 |
| QC-PAGE-F-019 | P2 | AI Advisory | المزود ما زال معطلًا بلا policy artifact؛ endpoint allowlist واختبارات consent/policy والسلوك synthetic PASS، لكن E2E المصادق blocked ولا تقييم حي معتمد. | سلوك المزود الحي غير مثبت؛ يلزم اعتماد المزود والمكان والاحتفاظ والحذف وفئات البيانات والconsent قبل تجربة محدودة. | أبقِ external processing معطلًا؛ بعد قرار المالك نفّذ E2E وlive eval محدودة على candidate مع consent وحذف موثق. | QC-ADP-11؛ `audit/2026-09-24/QC-ADP-11-handoff.md` |
| QC-PAGE-F-020 | P2 | رحلة المهام وحالاتها | سجل حي واحد DRAFT/نسخة 1 وزر Activate؛ التعديل والانتقالات لم تُنفذ في الجولة. | صلاحية الحالة والنسخة والتعيين وسجل التدقيق عبر إنشاء/تفعيل/إكمال/إعادة فتح غير مثبتة عمليًا. | اختبار إنشاء ثم Activate/Start/Hold/Resume/Complete/Reopen وحالات الرفض للنطاق والنسخة القديمة؛ توافق السجل والتدقيق بعد كل خطوة. | QC-ADP-17 |
| QC-PAGE-F-021 | P1 | قرار الاعتماد وسلسلة الدليل | صفحة القرار تعرض snapshot/نسخة/سبب/reauth في المصدر؛ الطابور الحي فارغ. | قرار APPROVE/RETURN/REJECT مع فصل الواجبات وإعادة المصادقة ورفض النسخة القديمة لم يُختبر بسجل فعلي. | موضوعان ممثلان لمراجع مخول وغير مخول؛ نجاح القرار ورفض self-approval/secret خاطئ/نسخة قديمة مع أثر توقيع وتدقيق صحيح. | QC-ADP-18 |
| QC-PAGE-F-022 | P1 | أهلية المعدات والمعايرة والصيانة | نماذج المعايرة والصيانة الحية تختار المعدات؛ لا معدات ممثلة لفحص الأهلية. | منع استعمال معدة غير مؤهلة وربط لقطة معايرتها بالاختبار غير مثبتين عبر الرحلة. | معدة مؤهلة وأخرى منتهية المعايرة وثالثة تحت الصيانة؛ رفض خادمي للاستخدام غير المؤهل ولقطة مصدر مجمدة في الاختبار. | QC-ADP-19 |
| QC-PAGE-F-023 | P1 | دورة المستند والإصدار والفعالية | مسارات النسخة والمراجعة موجودة في المصدر؛ لا مستند حي ممثل في الجولة. | إثبات نسخة WI/SOP المعتمدة وتاريخ فعاليتها واستخدامها في سجل فحص/مختبر غير مكتمل. | نسختان مع انتقال فعالية؛ سجل يستخدم النسخة الصحيحة المجمدة، ورفض تعديل/حذف نسخة معتمدة أو توقيع غير مخول. | QC-ADP-20 |
| QC-PAGE-F-024 | P1 | طلب التغيير وتطبيقه على الهدف | الواجهة تصرح بأن الموافقة لا تطبق التغيير تلقائيًا؛ لا طلب تغيير مكتمل حيًا. | فصل الموافقة عن التطبيق ومنع التكرار والتعارض والرجوع لم يُثبت بسجل فعلي. | طلب معتمد يطبق مرة واحدة فقط؛ محاولة مكررة وتعارض نسخة ورفض صلاحية تعيد نتيجة آمنة مع سجل تدقيق وهدف غير متغير عند الفشل. | QC-ADP-21 |
| QC-PAGE-F-025 | P1 | الحساب والجلسة واسترداد الوصول | صفحة account تستدعي changePassword وlogout؛ recovery/reset مساران deferred؛ E2E الجلسة/الإبطال غير مثبت في هذه الجولة. | فشل الدخول وحد المعدل وتغيير كلمة المرور وانتهاء/إبطال الجلسة وreturnTo تحتاج رحلة قبول متصلة. | نجاح وفشل الدخول، rate limit، تغيير كلمة المرور، logout/revocation، returnTo آمن، ورفض token منتهي/مكرر إن اعتُمد recovery. | QC-ADP-22 |
| QC-PAGE-F-026 | P1 | البحث والإشعارات عبر النطاق | صفحة search تتحقق من PERM-SRCH-USE، وصفحة notifications تعرض المستلم والوجهة؛ لا fixture متعدد النطاق في الجولة. | صحة نتائج البحث والمستلم وعدد غير المقروء وروابط الإشعار تحت دورين ونطاقين غير مثبتة. | بحث يجد المصرح فقط، إشعار يصل لمستلمه فقط، رابط صحيح ومخول، وعدم إظهار صفر مضلل عند عطل المزود. | QC-ADP-23 |
| QC-PAGE-F-027 | P1 | اكتمال سجل التدقيق وسلامة تاريخه | صفحة audit تعرض فلاتر subject/actor/action/time وتفصل تعطل المزوّد عن الفراغ؛ أحداث متعددة الأدوار لم تُختبر. | اكتمال أحداث mutations الحساسة وحدود قراءة التاريخ وعدم تعديل الأثر لم يثبت على قاعدة ممثلة. | حدث صحيح لكل فعل حرج، رفض تعديل/حذف الأثر وقراءة خارج النطاق، والفراغ/التعطل لا يُخلطان. | QC-ADP-24 |
| QC-PAGE-F-028 | P1 | سلامة المرفقات ودورة الدليل | Threat model يذكر تحقق signature/size/hash وتعويض الكتابة الجزئية؛ سياسة scanner/MIME/retention وorphan reconciliation مفتوحة. | التحميل والربط والتنزيل والاحتفاظ والتنظيف الدوري لا تملك دليلًا نهائيًا وسياسة معتمدة على المرشح. | رفض ملف مزيف أو كبير وتنزيل غير مخول؛ تعويض الكتابة الجزئية؛ hash صحيح؛ لا حذف تاريخ بلا سياسة. | QC-ADP-25 |
| QC-PAGE-F-029 | P1 | عقود التكامل والتسليم المتكرر | INTEGRATION-CONTRACTS.md مسودة؛ instrument adapter sandbox بلا نقل خارجي، وسياسات retry/dead-letter/provider/receiver مفتوحة. | هوية المصدر والتكرار وإعادة المحاولة وحدود أثر فشل المزود على قرار QC غير مثبتة بتكامل حي معتمد. | رسالة مكررة لا تنشئ قرارًا ثانيًا، فشل المزود يبقي السجل آمنًا ويظهر في health، ولا تنفذ معالجة خارجية بلا سياسة/موافقة. | QC-ADP-26 |

## 23. معيار الإغلاق وحساب نسبة إتمام الأدلة
نسبة الإتمام لكل صفحة = عدد فحوص القبول `PASS` ÷ عدد الفحوص المنطبقة المعتمدة × 100. يسجل منفذ البرومبت الفحوص المنطبقة مسبقًا للوظيفة والبيانات والتفويض وحالات empty/populated/error والإتاحة والأداء عند اللزوم وUAT؛ ويبرر `N/A` بمصدر. `BLOCKED` و`NOT VERIFIED` في المقام ولا تُحسب نجاحًا. لا تُحسب نسبة جودة المنتج من هذه النسبة، ولا تُعلن 100% إلا إذا كانت كل الفحوص المنطبقة PASS وكل P0/P1 مغلقة على المرشح نفسه.

لا تُعلن جودة كاملة بالتصميم أو مرور build وحده. لكل صفحة يلزم: مصدر سياسة معتمد، وظيفة وتخزين حقيقي، رفض خادمي، قياس populated/empty/error، keyboard/AT، أداء عند اللزوم، E2E على أدوار وحالات، UAT، وprod parity. لكل مسار deferred يلزم قرار منتج: تنفيذ أو إزالة العقد المعتمد بموافقة؛ ولا يُعد stub إثبات وظيفة.

## 24. خطة معالجة مرتبة
1. **P0:** حسم مصادر QC/السياسات، إكمال schema بأثر إنتاج مصرح، إثبات release identity/gates وrestore. لا production migration قبل بوابة الأسرار وموافقة نشر مستقلة.
2. **P1:** بيانات fixtures ممثلة + PG18 + E2E أدوار وحالات + UAT؛ مختبر/QMS/reports/security/accessibility.
3. **P2:** النصوص/النماذج/الأداء المقاس والمسارات المؤجلة والتصميم المشترك. عالج root cause واحدًا في component/use case مشتركة.

## 25. مصفوفة الإطلاق والاستلام لكل صفحة

كل سطر يحدد مصطلحات المجال ومشكلة مثبتة أو فجوة دليل، ثم حلًا واختبار قبول. **هذه متطلبات تنفيذ، وليست شهادة جاهزية.** يبقى الحكم `NOT VERIFIED / NO-GO` حتى توجد بيئة وبيانات وأدوار وقرارات سياسة وأدلة على المرشح نفسه. البرومبتات التفصيلية المقابلة موجودة في HTML.

| Page ID | Route | المصطلحات | المشكلة أو فجوة الدليل | الحل المطلوب | اختبار قبول خاص | برومبتات المجال | حالة التسليم |
|---|---|---|---|---|---|---|---|
| `RT-ROOT-001` | `/` | الحساب، الجلسة، returnTo، استرداد الوصول | تحويل الزائر والمصادق وreturnTo لم يُختبر كرحلة كاملة. | حدد وجهة الزائر والمصادق في الخادم، واقبل returnTo المحلي فقط مع سبب واضح لفقد الجلسة. | زائر→login، مصادق→dashboard، returnTo داخلي صالح يعمل والخارجي مرفوض. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-22 | NOT VERIFIED / NO-GO |
| `RT-AUTH-001` | `/login` | الحساب، الجلسة، returnTo، استرداد الوصول | الدخول والخطأ وحد المعدل واسترداد الجلسة لم تُقَس بأدوار وحالات فعلية في هذه الجولة. | اختبر حقول الدخول ورسائل الرفض دون كشف وجود الحساب، وحفظ returnTo الآمن بعد نجاح المصادقة. | نجاح وفشل وحد معدل وإبطال جلسة؛ لا كشف هوية ولا إعادة إرسال تلقائية لفعل قديم. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-22 | NOT VERIFIED / NO-GO |
| `RT-AUTH-002` | `/auth/recovery` | الحساب، الجلسة، returnTo، استرداد الوصول | المسار معلن مؤجلًا ولا يوجد له ملف صفحة فعلي. | احسم قرار المنتج: نفذ استردادًا آمنًا أو أزل الرابط والعقد من التنقل والتوثيق. | استرداد مصرح بلا كشف وجود الحساب، أو قرار تأجيل موثق بلا رابط مكسور. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-16, QC-ADP-22 | NOT VERIFIED / NO-GO |
| `RT-AUTH-003` | `/auth/reset/[requestId]` | الحساب، الجلسة، returnTo، استرداد الوصول | المسار معلن مؤجلًا ولا يوجد له ملف صفحة فعلي. | احسم دورة الرمز والمهلة والاستخدام الواحد أو أزل العقد المؤجل. | رمز صالح مرة واحدة، رفض المنتهي والمعاد، وعدم كشف هوية الحساب؛ أو قرار تأجيل موثق. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-16, QC-ADP-22 | NOT VERIFIED / NO-GO |
| `RT-DASH-001` | `/dashboard` | مصدر المؤشر، النطاق، الفترة، رابط التفاصيل | مصدر queue للمستندات وربط `/documents?review=mine` أضيفا على المرشح؛ PG parity وrole/perf والبيانات الحية غير مثبتة، والجودة/الرفض/الأسباب ما زالت غير موردة. | تحقق من مصدر كل KPI ونطاقه ورابطه، ثم طابق العدد مع السجل لممثلين اثنين وحالات empty/error/populated؛ أبقِ غير المورّد unavailable. | تطابق كل عدد مع صفوف السجل للممثلين المختلفين؛ لا يظهر صفر عند تعطل المصدر. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-07, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-WORK-001` | `/work` | مصدر المؤشر، النطاق، الفترة، رابط التفاصيل | queue المستندات المصدرية يدخل مجموعة ASSIGNED مع وصف ملكية/صلاحية؛ تحقق البيانات الحية والعدد عبر register لم يحدث. مصادر الجودة/الرفض/الأسباب باقية محجوبة. | طابق أعداد طابور العمل مع سجلات المصدر تحت نطاقين ودورين، وأثبت unavailable/denied controls على المرشح نفسه. | باستخدام بيانات ممثلة لطابور العمل: الأعداد تطابق السجل تحت نطاقين، والتعطل لا يُعرض صفرًا. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-07, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-TASK-001` | `/tasks` | DRAFT، IN_PROGRESS، ON_HOLD، COMPLETED، نسخة السجل | لم يُثبت على بيانات ممثلة أن `/tasks` يعرض المهمة وتكليفها وحالتها بالنطاق الصحيح ويفصل الصفر الحقيقي عن غياب المصدر. | حدد مصدر المهمة وتكليفها وحالتها وعقد القراءة/الكتابة في الخادم؛ ثبت المصدر والنطاق والفلاتر والفرز والصفحات وحالات empty/error/populated. | باستخدام بيانات ممثلة لـالمهمة وتكليفها وحالتها: سجلات ممتلئة وفارغة وعطل، فلاتر/فرز/صفحات وحدود صلاحية، ورابط الصف صحيح. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13, QC-ADP-17 | NOT VERIFIED / NO-GO |
| `RT-TASK-002` | `/tasks/new` | DRAFT، IN_PROGRESS، ON_HOLD، COMPLETED، نسخة السجل | لم تُنفذ كتابة أو قرار المهمة وتكليفها وحالتها في `/tasks/new`؛ صحة الحفظ والنسخة والرفض الخادمي وأثر التدقيق ما زالت غير مثبتة. | حدد مصدر المهمة وتكليفها وحالتها وعقد القراءة/الكتابة في الخادم؛ حقق الحقول عند الخادم، واحفظ المصدر والنسخة، واظهر خطأ قابلًا للإصلاح دون فقد المدخلات. | باستخدام بيانات ممثلة لـالمهمة وتكليفها وحالتها: حفظ صالح ورفض إدخال/صلاحية/نسخة مكررة، مع استبقاء المدخلات. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-14, QC-ADP-17 | NOT VERIFIED / NO-GO |
| `RT-TASK-003` | `/tasks/[taskId]` | DRAFT، IN_PROGRESS، ON_HOLD، COMPLETED، نسخة السجل | سجل DRAFT واحد ظهر حيًا؛ زر Activate موجود ولم يُختبر انتقاله. | أظهر الفاعل والحالة والنسخة والسبب والخطوة التالية، واختبر الانتقال من المصدر حتى التدقيق. | نجاح Activate بالنسخة الصحيحة ورفض دور أو نسخة قديمة؛ حالة وأثر audit متطابقان. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13, QC-ADP-17 | NOT VERIFIED / NO-GO |
| `RT-QUAL-001` | `/quality` | Finding، NCR، RCA، CAPA، الفعالية والإغلاق | لوحة الجودة حية لكن سجلات NCR/RCA/CAPA فارغة والسياسات المرتبطة مفتوحة. | اظهر مصدر كل عدد وحالة سياسة الإنشاء/الفعالية والخطوة التالية لكل عائلة. | تطابق الأعداد مع السجلات، ولا يفتح فعل NCR/CAPA غير المعتمد أو يوحي بإكماله. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-06, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-FIND-001` | `/quality/findings` | Finding، NCR، RCA، CAPA، الفعالية والإغلاق | لم يُثبت على بيانات ممثلة أن `/quality/findings` يعرض Finding والمصدر المرتبط بالنطاق الصحيح ويفصل الصفر الحقيقي عن غياب المصدر. | حدد مصدر Finding والمصدر المرتبط وعقد القراءة/الكتابة في الخادم؛ ثبت المصدر والنطاق والفلاتر والفرز والصفحات وحالات empty/error/populated. | باستخدام بيانات ممثلة لـFinding والمصدر المرتبط: سجلات ممتلئة وفارغة وعطل، فلاتر/فرز/صفحات وحدود صلاحية، ورابط الصف صحيح. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-06, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-FIND-002` | `/quality/findings/new` | Finding، NCR، RCA، CAPA، الفعالية والإغلاق | لم تُنفذ كتابة أو قرار Finding والمصدر المرتبط في `/quality/findings/new`؛ صحة الحفظ والنسخة والرفض الخادمي وأثر التدقيق ما زالت غير مثبتة. | حدد مصدر Finding والمصدر المرتبط وعقد القراءة/الكتابة في الخادم؛ حقق الحقول عند الخادم، واحفظ المصدر والنسخة، واظهر خطأ قابلًا للإصلاح دون فقد المدخلات. | باستخدام بيانات ممثلة لـFinding والمصدر المرتبط: حفظ صالح ورفض إدخال/صلاحية/نسخة مكررة، مع استبقاء المدخلات. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-06, QC-ADP-14 | NOT VERIFIED / NO-GO |
| `RT-FIND-003` | `/quality/findings/[findingId]` | Finding، NCR، RCA، CAPA، الفعالية والإغلاق | لا يوجد سجل Finding والمصدر المرتبط ممثل للتحقق من الحالة والنسخة والعلاقات ورفض المعرّف أو الدور غير المخول في `/quality/findings/[findingId]`. | حدد مصدر Finding والمصدر المرتبط وعقد القراءة/الكتابة في الخادم؛ أظهر الحالة والنسخة والتاريخ والعلاقات والأفعال المسموحة مع سبب المنع. | باستخدام بيانات ممثلة لـFinding والمصدر المرتبط: سجل صحيح ومفقود وخارج النطاق؛ حالة/نسخة/أثر تدقيق وأفعال مطابقة للخادم. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-06, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-NCR-001` | `/quality/ncr` | Finding، NCR، RCA، CAPA، الفعالية والإغلاق | لم يُثبت على بيانات ممثلة أن `/quality/ncr` يعرض NCR بالنطاق الصحيح ويفصل الصفر الحقيقي عن غياب المصدر. | حدد مصدر NCR وعقد القراءة/الكتابة في الخادم؛ ثبت المصدر والنطاق والفلاتر والفرز والصفحات وحالات empty/error/populated. | باستخدام بيانات ممثلة لـNCR: سجلات ممتلئة وفارغة وعطل، فلاتر/فرز/صفحات وحدود صلاحية، ورابط الصف صحيح. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-06, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-NCR-002` | `/quality/ncr/new` | Finding، NCR، RCA، CAPA، الفعالية والإغلاق | الإنشاء المباشر مرتبط بسياسة غير معتمدة. | أبق المنع حتى قرار QMS؛ بعده اربط الإنشاء بمصدر Finding وصلاحية ونسخة. | رفض قبل اعتماد السياسة؛ نجاح مسار معتمد فقط مع أصل السجل وتدقيقه. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-06, QC-ADP-14 | NOT VERIFIED / NO-GO |
| `RT-NCR-003` | `/quality/ncr/[ncrId]` | Finding، NCR، RCA، CAPA، الفعالية والإغلاق | لا يوجد سجل NCR ممثل للتحقق من الحالة والنسخة والعلاقات ورفض المعرّف أو الدور غير المخول في `/quality/ncr/[ncrId]`. | حدد مصدر NCR وعقد القراءة/الكتابة في الخادم؛ أظهر الحالة والنسخة والتاريخ والعلاقات والأفعال المسموحة مع سبب المنع. | باستخدام بيانات ممثلة لـNCR: سجل صحيح ومفقود وخارج النطاق؛ حالة/نسخة/أثر تدقيق وأفعال مطابقة للخادم. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-06, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-RCA-001` | `/quality/rca` | Finding، NCR، RCA، CAPA، الفعالية والإغلاق | لم يُثبت على بيانات ممثلة أن `/quality/rca` يعرض RCA بالنطاق الصحيح ويفصل الصفر الحقيقي عن غياب المصدر. | حدد مصدر RCA وعقد القراءة/الكتابة في الخادم؛ ثبت المصدر والنطاق والفلاتر والفرز والصفحات وحالات empty/error/populated. | باستخدام بيانات ممثلة لـRCA: سجلات ممتلئة وفارغة وعطل، فلاتر/فرز/صفحات وحدود صلاحية، ورابط الصف صحيح. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-06, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-RCA-002` | `/quality/rca/[rcaId]` | Finding، NCR، RCA، CAPA، الفعالية والإغلاق | لا يوجد سجل RCA ممثل للتحقق من الحالة والنسخة والعلاقات ورفض المعرّف أو الدور غير المخول في `/quality/rca/[rcaId]`. | حدد مصدر RCA وعقد القراءة/الكتابة في الخادم؛ أظهر الحالة والنسخة والتاريخ والعلاقات والأفعال المسموحة مع سبب المنع. | باستخدام بيانات ممثلة لـRCA: سجل صحيح ومفقود وخارج النطاق؛ حالة/نسخة/أثر تدقيق وأفعال مطابقة للخادم. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-06, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-CAPA-001` | `/quality/capa` | Finding، NCR، RCA، CAPA، الفعالية والإغلاق | لم يُثبت على بيانات ممثلة أن `/quality/capa` يعرض CAPA بالنطاق الصحيح ويفصل الصفر الحقيقي عن غياب المصدر. | حدد مصدر CAPA وعقد القراءة/الكتابة في الخادم؛ ثبت المصدر والنطاق والفلاتر والفرز والصفحات وحالات empty/error/populated. | باستخدام بيانات ممثلة لـCAPA: سجلات ممتلئة وفارغة وعطل، فلاتر/فرز/صفحات وحدود صلاحية، ورابط الصف صحيح. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-06, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-CAPA-002` | `/quality/capa/new` | Finding، NCR، RCA، CAPA، الفعالية والإغلاق | الفعالية والإغلاق مرتبطان بسياسة QMS مفتوحة. | اعرض حالة السياسة والسبب، ثم وصل الفعالية والإغلاق بمصدر ودليل معتمدين. | لا إغلاق بلا دليل فعالية أو صلاحية؛ اختبار نجاح ورفض بعد القرار المعتمد. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-06, QC-ADP-14 | NOT VERIFIED / NO-GO |
| `RT-CAPA-003` | `/quality/capa/[capaId]` | Finding، NCR، RCA، CAPA، الفعالية والإغلاق | لا يوجد سجل CAPA ممثل للتحقق من الحالة والنسخة والعلاقات ورفض المعرّف أو الدور غير المخول في `/quality/capa/[capaId]`. | حدد مصدر CAPA وعقد القراءة/الكتابة في الخادم؛ أظهر الحالة والنسخة والتاريخ والعلاقات والأفعال المسموحة مع سبب المنع. | باستخدام بيانات ممثلة لـCAPA: سجل صحيح ومفقود وخارج النطاق؛ حالة/نسخة/أثر تدقيق وأفعال مطابقة للخادم. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-06, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-QUAR-001` | `/quarantine` | Receiving، Inspection، HOLD، PASS، RELEASED | عرض الحجر لا يثبت انتقال Receiving→Inspection→Release بسبب غياب سجل ومصدر قرار معتمد. | اعرض استقبال المادة وحالة HOLD/PASS وقرار RELEASED منفصلًا مع المصدر والمراجع. | رحلة ممثلة تحفظ lot/item/quantity، وتمنع RELEASED عند PASS وحده. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-02, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-REC-001` | `/quarantine/receiving` | Receiving، Inspection، HOLD، PASS، RELEASED | لم يُثبت على بيانات ممثلة أن `/quarantine/receiving` يعرض الاستلام وlot/item/quantity بالنطاق الصحيح ويفصل الصفر الحقيقي عن غياب المصدر. | حدد مصدر الاستلام وlot/item/quantity وعقد القراءة/الكتابة في الخادم؛ ثبت المصدر والنطاق والفلاتر والفرز والصفحات وحالات empty/error/populated. | باستخدام بيانات ممثلة لـالاستلام وlot/item/quantity: سجلات ممتلئة وفارغة وعطل، فلاتر/فرز/صفحات وحدود صلاحية، ورابط الصف صحيح. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-02, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-REC-002` | `/quarantine/receiving/new` | Receiving، Inspection، HOLD، PASS، RELEASED | لم تُنفذ كتابة أو قرار الاستلام وlot/item/quantity في `/quarantine/receiving/new`؛ صحة الحفظ والنسخة والرفض الخادمي وأثر التدقيق ما زالت غير مثبتة. | حدد مصدر الاستلام وlot/item/quantity وعقد القراءة/الكتابة في الخادم؛ حقق الحقول عند الخادم، واحفظ المصدر والنسخة، واظهر خطأ قابلًا للإصلاح دون فقد المدخلات. | باستخدام بيانات ممثلة لـالاستلام وlot/item/quantity: حفظ صالح ورفض إدخال/صلاحية/نسخة مكررة، مع استبقاء المدخلات. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-02, QC-ADP-14 | NOT VERIFIED / NO-GO |
| `RT-REC-003` | `/quarantine/receiving/[receivingId]` | Receiving، Inspection، HOLD، PASS، RELEASED | لا يوجد سجل الاستلام وlot/item/quantity ممثل للتحقق من الحالة والنسخة والعلاقات ورفض المعرّف أو الدور غير المخول في `/quarantine/receiving/[receivingId]`. | حدد مصدر الاستلام وlot/item/quantity وعقد القراءة/الكتابة في الخادم؛ أظهر الحالة والنسخة والتاريخ والعلاقات والأفعال المسموحة مع سبب المنع. | باستخدام بيانات ممثلة لـالاستلام وlot/item/quantity: سجل صحيح ومفقود وخارج النطاق؛ حالة/نسخة/أثر تدقيق وأفعال مطابقة للخادم. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-02, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-INSP-001` | `/quarantine/inspections` | Receiving، Inspection، HOLD، PASS، RELEASED | لم يُثبت على بيانات ممثلة أن `/quarantine/inspections` يعرض التفتيش ونتيجة HOLD/PASS بالنطاق الصحيح ويفصل الصفر الحقيقي عن غياب المصدر. | حدد مصدر التفتيش ونتيجة HOLD/PASS وعقد القراءة/الكتابة في الخادم؛ ثبت المصدر والنطاق والفلاتر والفرز والصفحات وحالات empty/error/populated. | باستخدام بيانات ممثلة لـالتفتيش ونتيجة HOLD/PASS: سجلات ممتلئة وفارغة وعطل، فلاتر/فرز/صفحات وحدود صلاحية، ورابط الصف صحيح. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-02, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-INSP-002` | `/quarantine/inspections/[inspectionId]` | Receiving، Inspection، HOLD، PASS، RELEASED | لا يوجد سجل التفتيش ونتيجة HOLD/PASS ممثل للتحقق من الحالة والنسخة والعلاقات ورفض المعرّف أو الدور غير المخول في `/quarantine/inspections/[inspectionId]`. | حدد مصدر التفتيش ونتيجة HOLD/PASS وعقد القراءة/الكتابة في الخادم؛ أظهر الحالة والنسخة والتاريخ والعلاقات والأفعال المسموحة مع سبب المنع. | باستخدام بيانات ممثلة لـالتفتيش ونتيجة HOLD/PASS: سجل صحيح ومفقود وخارج النطاق؛ حالة/نسخة/أثر تدقيق وأفعال مطابقة للخادم. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-02, QC-ADP-13, QC-ADP-25 | NOT VERIFIED / NO-GO |
| `RT-INSP-003` | `/quarantine/inspections/[inspectionId]/execute` | Receiving، Inspection، HOLD، PASS، RELEASED | لم يُختبر إدخال نتيجة فحص على قالب ومصدر معيار معتمدين. | أظهر lot/item/العينة/الوحدة/حد المعيار وإصداره قرب الإدخال، واحفظ المسودة والسبب. | قياس صالح وغير صالح مع snapshot معيار؛ PASS لا يعني RELEASED. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-02, QC-ADP-14 | NOT VERIFIED / NO-GO |
| `RT-INSP-004` | `/quarantine/inspections/[inspectionId]/review` | Receiving، Inspection، HOLD، PASS، RELEASED | مراجعة فحص فعلي مع فصل الواجبات والنسخة لم تُنفذ. | اعرض دليل القياس ومصدر القالب والنسخة وسبب HOLD/RETURN بجانب القرار. | قبول مراجع مخول ورفض المؤلف/نسخة قديمة؛ قرار إطلاق منفصل. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-02 | NOT VERIFIED / NO-GO |
| `RT-QUAR-002` | `/quarantine/admin` | Receiving، Inspection، HOLD، PASS، RELEASED | لم يُثبت على بيانات ممثلة أن `/quarantine/admin` يعرض قالب التفتيش المعتمد بالنطاق الصحيح ويفصل الصفر الحقيقي عن غياب المصدر. | حدد مصدر قالب التفتيش المعتمد وعقد القراءة/الكتابة في الخادم؛ ثبت المصدر والنطاق والفلاتر والفرز والصفحات وحالات empty/error/populated. | باستخدام بيانات ممثلة لـقالب التفتيش المعتمد: سجلات ممتلئة وفارغة وعطل، فلاتر/فرز/صفحات وحدود صلاحية، ورابط الصف صحيح. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-02, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-LAB-001` | `/laboratory` | القالب المعتمد، العينة، الوحدة، الدقة، المراجعة | المسار يعيد التوجيه إلى سجل الاختبارات؛ وجهة الوصول والصلاحية لا تثبتان رحلة مختبر. | وثق التحويل واحفظ returnTo والصلاحية، ثم اربط إنشاء الاختبار بالقالب المعتمد. | المخول يصل إلى /laboratory/tests، وغير المخول يُرفض؛ لا دورة قياس بلا قالب معتمد. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-05, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-LAB-002` | `/laboratory/tests` | القالب المعتمد، العينة، الوحدة، الدقة، المراجعة | لم يُثبت على بيانات ممثلة أن `/laboratory/tests` يعرض اختبار المختبر والعينة والوحدة بالنطاق الصحيح ويفصل الصفر الحقيقي عن غياب المصدر. | حدد مصدر اختبار المختبر والعينة والوحدة وعقد القراءة/الكتابة في الخادم؛ ثبت المصدر والنطاق والفلاتر والفرز والصفحات وحالات empty/error/populated. | باستخدام بيانات ممثلة لـاختبار المختبر والعينة والوحدة: سجلات ممتلئة وفارغة وعطل، فلاتر/فرز/صفحات وحدود صلاحية، ورابط الصف صحيح. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-05, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-LAB-003` | `/laboratory/tests/new` | القالب المعتمد، العينة، الوحدة، الدقة، المراجعة | الواجهة الحية لا تعرض قالب اختبار معتمدًا للاختيار. | وفّر مصدر قالب معتمد ونطاق اختيار مخول، ولا تختلق حدودًا علمية. | إنشاء من قالب معتمد فقط، ورفض قالب منتهي أو خارج النطاق. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-05, QC-ADP-14 | NOT VERIFIED / NO-GO |
| `RT-LAB-009` | `/laboratory/report-templates` | القالب المعتمد، العينة، الوحدة، الدقة، المراجعة | الحساب الحي لا يملك صلاحية إنشاء مسودة، والتقرير المطبوع غير معتمد علميًا. | افصل مسودة 12 عينة عن النتيجة الرسمية، وأظهر سبب عدم الصلاحية وطريق الحل. | حفظ/إعادة قراءة بالمالك والنسخة على قاعدة ممثلة؛ print يحمل وسم غير معتمد؛ رفض غير المخول. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-05, QC-ADP-14 | NOT VERIFIED / NO-GO |
| `RT-LAB-004` | `/laboratory/tests/[labTestId]` | القالب المعتمد، العينة، الوحدة، الدقة، المراجعة | لا يوجد سجل اختبار المختبر والعينة والوحدة ممثل للتحقق من الحالة والنسخة والعلاقات ورفض المعرّف أو الدور غير المخول في `/laboratory/tests/[labTestId]`. | حدد مصدر اختبار المختبر والعينة والوحدة وعقد القراءة/الكتابة في الخادم؛ أظهر الحالة والنسخة والتاريخ والعلاقات والأفعال المسموحة مع سبب المنع. | باستخدام بيانات ممثلة لـاختبار المختبر والعينة والوحدة: سجل صحيح ومفقود وخارج النطاق؛ حالة/نسخة/أثر تدقيق وأفعال مطابقة للخادم. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-05, QC-ADP-13, QC-ADP-25 | NOT VERIFIED / NO-GO |
| `RT-LAB-005` | `/laboratory/tests/[labTestId]/execute` | القالب المعتمد، العينة، الوحدة، الدقة، المراجعة | حفظ 12 عينة وقياساتها مع وحدة/precision وسجل معدات مؤهلة لم يُثبت على PG ممثل. | اربط كل خلية بالعينة والمعيار والنسخة والمعدة، واحفظ مسودة قابلة للاسترداد مع رفض القيم غير الصالحة. | 12 عينة محفوظة ومستعادة، وحدة/دقة صحيحتان، رفض معدة غير مؤهلة ونسخة قديمة. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-05, QC-ADP-14, QC-ADP-26 | NOT VERIFIED / NO-GO |
| `RT-LAB-006` | `/laboratory/tests/[labTestId]/review` | القالب المعتمد، العينة، الوحدة، الدقة، المراجعة | قرار المختبر الفعلي لم يُختبر بعد إرسال القياسات. | قدم snapshot القياسات والمصدر والمعدة والنسخة للمراجع مع سبب RETURN وSoD. | قبول/إرجاع مخولان ورفض مؤلف أو نسخة قديمة؛ النتيجة والتدقيق متطابقان. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-05 | NOT VERIFIED / NO-GO |
| `RT-LAB-007` | `/laboratory/tests/[labTestId]/retests/new` | القالب المعتمد، العينة، الوحدة، الدقة، المراجعة | إنشاء إعادة اختبار مرتبطة بالأصل لم يُختبر، وسياق السبب/التفويض غير مثبت. | اعرض الاختبار الأصلي وسبب الإعادة ومن يصرح بها؛ انسخ السياق المعتمد فقط مع رابط أصل ثابت. | رفض غير المخول والتكرار غير المصرح؛ retest يحمل مرجع الأصل والسبب والنسخة. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-05, QC-ADP-14 | NOT VERIFIED / NO-GO |
| `RT-ASSET-001` | `/assets` | المعدة، المعايرة، الأهلية، الصيانة | لوحة الأصول لا تثبت أهلية معدات عند المعايرة أو الصيانة الفعلية. | اجمع حالة المعدات والمعايرة والصيانة بمصدر وتاريخ ونطاق، واربطها باختيار المعدة في المختبر. | معدة منتهية المعايرة أو تحت الصيانة تظهر غير مؤهلة وتُرفض عند الاستخدام. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13, QC-ADP-19 | NOT VERIFIED / NO-GO |
| `RT-EQUIP-001` | `/assets/equipment` | المعدة، المعايرة، الأهلية، الصيانة | لم يُثبت على بيانات ممثلة أن `/assets/equipment` يعرض المعدة وأهليتها بالنطاق الصحيح ويفصل الصفر الحقيقي عن غياب المصدر. | حدد مصدر المعدة وأهليتها وعقد القراءة/الكتابة في الخادم؛ ثبت المصدر والنطاق والفلاتر والفرز والصفحات وحالات empty/error/populated. | باستخدام بيانات ممثلة لـالمعدة وأهليتها: سجلات ممتلئة وفارغة وعطل، فلاتر/فرز/صفحات وحدود صلاحية، ورابط الصف صحيح. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13, QC-ADP-19 | NOT VERIFIED / NO-GO |
| `RT-EQUIP-002` | `/assets/equipment/new` | المعدة، المعايرة، الأهلية، الصيانة | لم تُنفذ كتابة أو قرار المعدة وأهليتها في `/assets/equipment/new`؛ صحة الحفظ والنسخة والرفض الخادمي وأثر التدقيق ما زالت غير مثبتة. | حدد مصدر المعدة وأهليتها وعقد القراءة/الكتابة في الخادم؛ حقق الحقول عند الخادم، واحفظ المصدر والنسخة، واظهر خطأ قابلًا للإصلاح دون فقد المدخلات. | باستخدام بيانات ممثلة لـالمعدة وأهليتها: حفظ صالح ورفض إدخال/صلاحية/نسخة مكررة، مع استبقاء المدخلات. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-14, QC-ADP-19 | NOT VERIFIED / NO-GO |
| `RT-EQUIP-003` | `/assets/equipment/[equipmentId]` | المعدة، المعايرة، الأهلية، الصيانة | لا يوجد سجل المعدة وأهليتها ممثل للتحقق من الحالة والنسخة والعلاقات ورفض المعرّف أو الدور غير المخول في `/assets/equipment/[equipmentId]`. | حدد مصدر المعدة وأهليتها وعقد القراءة/الكتابة في الخادم؛ أظهر الحالة والنسخة والتاريخ والعلاقات والأفعال المسموحة مع سبب المنع. | باستخدام بيانات ممثلة لـالمعدة وأهليتها: سجل صحيح ومفقود وخارج النطاق؛ حالة/نسخة/أثر تدقيق وأفعال مطابقة للخادم. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13, QC-ADP-19 | NOT VERIFIED / NO-GO |
| `RT-CAL-001` | `/assets/calibrations` | المعدة، المعايرة، الأهلية، الصيانة | لم يُثبت على بيانات ممثلة أن `/assets/calibrations` يعرض المعايرة وتاريخ صلاحيتها بالنطاق الصحيح ويفصل الصفر الحقيقي عن غياب المصدر. | حدد مصدر المعايرة وتاريخ صلاحيتها وعقد القراءة/الكتابة في الخادم؛ ثبت المصدر والنطاق والفلاتر والفرز والصفحات وحالات empty/error/populated. | باستخدام بيانات ممثلة لـالمعايرة وتاريخ صلاحيتها: سجلات ممتلئة وفارغة وعطل، فلاتر/فرز/صفحات وحدود صلاحية، ورابط الصف صحيح. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13, QC-ADP-19 | NOT VERIFIED / NO-GO |
| `RT-CAL-002` | `/assets/calibrations/new` | المعدة، المعايرة، الأهلية، الصيانة | لم تُنفذ كتابة أو قرار المعايرة وتاريخ صلاحيتها في `/assets/calibrations/new`؛ صحة الحفظ والنسخة والرفض الخادمي وأثر التدقيق ما زالت غير مثبتة. | حدد مصدر المعايرة وتاريخ صلاحيتها وعقد القراءة/الكتابة في الخادم؛ حقق الحقول عند الخادم، واحفظ المصدر والنسخة، واظهر خطأ قابلًا للإصلاح دون فقد المدخلات. | باستخدام بيانات ممثلة لـالمعايرة وتاريخ صلاحيتها: حفظ صالح ورفض إدخال/صلاحية/نسخة مكررة، مع استبقاء المدخلات. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-14, QC-ADP-19 | NOT VERIFIED / NO-GO |
| `RT-CAL-003` | `/assets/calibrations/[calibrationId]` | المعدة، المعايرة، الأهلية، الصيانة | لا يوجد سجل المعايرة وتاريخ صلاحيتها ممثل للتحقق من الحالة والنسخة والعلاقات ورفض المعرّف أو الدور غير المخول في `/assets/calibrations/[calibrationId]`. | حدد مصدر المعايرة وتاريخ صلاحيتها وعقد القراءة/الكتابة في الخادم؛ أظهر الحالة والنسخة والتاريخ والعلاقات والأفعال المسموحة مع سبب المنع. | باستخدام بيانات ممثلة لـالمعايرة وتاريخ صلاحيتها: سجل صحيح ومفقود وخارج النطاق؛ حالة/نسخة/أثر تدقيق وأفعال مطابقة للخادم. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13, QC-ADP-19 | NOT VERIFIED / NO-GO |
| `RT-MAINT-001` | `/assets/maintenance` | المعدة، المعايرة، الأهلية، الصيانة | لم يُثبت على بيانات ممثلة أن `/assets/maintenance` يعرض الصيانة وأثرها على الأهلية بالنطاق الصحيح ويفصل الصفر الحقيقي عن غياب المصدر. | حدد مصدر الصيانة وأثرها على الأهلية وعقد القراءة/الكتابة في الخادم؛ ثبت المصدر والنطاق والفلاتر والفرز والصفحات وحالات empty/error/populated. | باستخدام بيانات ممثلة لـالصيانة وأثرها على الأهلية: سجلات ممتلئة وفارغة وعطل، فلاتر/فرز/صفحات وحدود صلاحية، ورابط الصف صحيح. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13, QC-ADP-19 | NOT VERIFIED / NO-GO |
| `RT-MAINT-002` | `/assets/maintenance/new` | المعدة، المعايرة، الأهلية، الصيانة | لم تُنفذ كتابة أو قرار الصيانة وأثرها على الأهلية في `/assets/maintenance/new`؛ صحة الحفظ والنسخة والرفض الخادمي وأثر التدقيق ما زالت غير مثبتة. | حدد مصدر الصيانة وأثرها على الأهلية وعقد القراءة/الكتابة في الخادم؛ حقق الحقول عند الخادم، واحفظ المصدر والنسخة، واظهر خطأ قابلًا للإصلاح دون فقد المدخلات. | باستخدام بيانات ممثلة لـالصيانة وأثرها على الأهلية: حفظ صالح ورفض إدخال/صلاحية/نسخة مكررة، مع استبقاء المدخلات. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-14, QC-ADP-19 | NOT VERIFIED / NO-GO |
| `RT-MAINT-003` | `/assets/maintenance/[maintenanceId]` | المعدة، المعايرة، الأهلية، الصيانة | لا يوجد سجل الصيانة وأثرها على الأهلية ممثل للتحقق من الحالة والنسخة والعلاقات ورفض المعرّف أو الدور غير المخول في `/assets/maintenance/[maintenanceId]`. | حدد مصدر الصيانة وأثرها على الأهلية وعقد القراءة/الكتابة في الخادم؛ أظهر الحالة والنسخة والتاريخ والعلاقات والأفعال المسموحة مع سبب المنع. | باستخدام بيانات ممثلة لـالصيانة وأثرها على الأهلية: سجل صحيح ومفقود وخارج النطاق؛ حالة/نسخة/أثر تدقيق وأفعال مطابقة للخادم. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13, QC-ADP-19 | NOT VERIFIED / NO-GO |
| `RT-DOC-001` | `/documents` | مسودة النسخة، WI/SOP، النسخة الفعالة، تاريخ السريان | لم يُثبت على بيانات ممثلة أن `/documents` يعرض المستند ونسخته الفعالة بالنطاق الصحيح ويفصل الصفر الحقيقي عن غياب المصدر. | حدد مصدر المستند ونسخته الفعالة وعقد القراءة/الكتابة في الخادم؛ ثبت المصدر والنطاق والفلاتر والفرز والصفحات وحالات empty/error/populated. | باستخدام بيانات ممثلة لـالمستند ونسخته الفعالة: سجلات ممتلئة وفارغة وعطل، فلاتر/فرز/صفحات وحدود صلاحية، ورابط الصف صحيح. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13, QC-ADP-20 | NOT VERIFIED / NO-GO |
| `RT-DOC-002` | `/documents/new` | مسودة النسخة، WI/SOP، النسخة الفعالة، تاريخ السريان | لم تُنفذ كتابة أو قرار المستند ونسخته الفعالة في `/documents/new`؛ صحة الحفظ والنسخة والرفض الخادمي وأثر التدقيق ما زالت غير مثبتة. | حدد مصدر المستند ونسخته الفعالة وعقد القراءة/الكتابة في الخادم؛ حقق الحقول عند الخادم، واحفظ المصدر والنسخة، واظهر خطأ قابلًا للإصلاح دون فقد المدخلات. | باستخدام بيانات ممثلة لـالمستند ونسخته الفعالة: حفظ صالح ورفض إدخال/صلاحية/نسخة مكررة، مع استبقاء المدخلات. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-14, QC-ADP-20 | NOT VERIFIED / NO-GO |
| `RT-DOC-003` | `/documents/[documentId]` | مسودة النسخة، WI/SOP، النسخة الفعالة، تاريخ السريان | لا يوجد سجل المستند ونسخته الفعالة ممثل للتحقق من الحالة والنسخة والعلاقات ورفض المعرّف أو الدور غير المخول في `/documents/[documentId]`. | حدد مصدر المستند ونسخته الفعالة وعقد القراءة/الكتابة في الخادم؛ أظهر الحالة والنسخة والتاريخ والعلاقات والأفعال المسموحة مع سبب المنع. | باستخدام بيانات ممثلة لـالمستند ونسخته الفعالة: سجل صحيح ومفقود وخارج النطاق؛ حالة/نسخة/أثر تدقيق وأفعال مطابقة للخادم. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13, QC-ADP-20 | NOT VERIFIED / NO-GO |
| `RT-DOC-004` | `/documents/[documentId]/versions/new` | مسودة النسخة، WI/SOP، النسخة الفعالة، تاريخ السريان | إنشاء نسخة مستند مع مصدر الملف وتاريخ السريان لم يُختبر على سجل فعلي. | اربط النسخة بالهوية والملف وhash، وامنع اعتمادها قبل مراجعة مخولة. | مسودة محفوظة برقم نسخة صحيح ورفض ملف/صلاحية غير صالحين. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-14, QC-ADP-20 | NOT VERIFIED / NO-GO |
| `RT-DOC-005` | `/documents/[documentId]/versions/[versionId]` | مسودة النسخة، WI/SOP، النسخة الفعالة، تاريخ السريان | لا يوجد سجل المستند ونسخته الفعالة ممثل للتحقق من الحالة والنسخة والعلاقات ورفض المعرّف أو الدور غير المخول في `/documents/[documentId]/versions/[versionId]`. | حدد مصدر المستند ونسخته الفعالة وعقد القراءة/الكتابة في الخادم؛ أظهر الحالة والنسخة والتاريخ والعلاقات والأفعال المسموحة مع سبب المنع. | باستخدام بيانات ممثلة لـالمستند ونسخته الفعالة: سجل صحيح ومفقود وخارج النطاق؛ حالة/نسخة/أثر تدقيق وأفعال مطابقة للخادم. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13, QC-ADP-20, QC-ADP-25 | NOT VERIFIED / NO-GO |
| `RT-DOC-006` | `/documents/[documentId]/versions/[versionId]/review` | مسودة النسخة، WI/SOP، النسخة الفعالة، تاريخ السريان | مراجعة نسخة WI/SOP واعتماد تاريخ الفعالية لم يُختبرا ببيانات ممثلة. | اعرض الفرق عن النسخة السابقة والملف وhash والمراجع وسبب RETURN بجانب القرار. | رفض self-review/نسخة قديمة؛ النسخة الفعالة الوحيدة تُثبت بمصدر وتدقيق. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-20 | NOT VERIFIED / NO-GO |
| `RT-APPROVAL-001` | `/approvals` | موضوع القرار، نسخة الموضوع، SoD، إعادة المصادقة | الطابور الحي فارغ، فلا يوجد قرار فعلي لتقييمه. | وفّر fixture لموضوع قابل للقرار وآخر غير مخول وأظهر الدليل والنسخة. | تصفية الطابور للمكلف فقط، وفتح موضوع صحيح دون تسرب خارج النطاق. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13, QC-ADP-18 | NOT VERIFIED / NO-GO |
| `RT-APPROVAL-002` | `/approvals/[approvalId]` | موضوع القرار، نسخة الموضوع، SoD، إعادة المصادقة | المصدر يعرض snapshot وreauth، لكن قرارًا فعليًا لم يُختبر. | اختبر APPROVE/RETURN/REJECT مع فصل الواجبات والنسخة والسبب والتوقيع. | نجاح المخول ورفض self-approval/سر خاطئ/نسخة قديمة، مع أثر توقيع وتدقيق. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13, QC-ADP-18 | NOT VERIFIED / NO-GO |
| `RT-CHANGE-001` | `/change-requests` | طلب التغيير، اعتماد الطلب، Apply، نسخة الهدف | لم يُثبت على بيانات ممثلة أن `/change-requests` يعرض طلب التغيير ونسخة الهدف بالنطاق الصحيح ويفصل الصفر الحقيقي عن غياب المصدر. | حدد مصدر طلب التغيير ونسخة الهدف وعقد القراءة/الكتابة في الخادم؛ ثبت المصدر والنطاق والفلاتر والفرز والصفحات وحالات empty/error/populated. | باستخدام بيانات ممثلة لـطلب التغيير ونسخة الهدف: سجلات ممتلئة وفارغة وعطل، فلاتر/فرز/صفحات وحدود صلاحية، ورابط الصف صحيح. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13, QC-ADP-21 | NOT VERIFIED / NO-GO |
| `RT-CHANGE-002` | `/change-requests/new` | طلب التغيير، اعتماد الطلب، Apply، نسخة الهدف | لم تُنفذ كتابة أو قرار طلب التغيير ونسخة الهدف في `/change-requests/new`؛ صحة الحفظ والنسخة والرفض الخادمي وأثر التدقيق ما زالت غير مثبتة. | حدد مصدر طلب التغيير ونسخة الهدف وعقد القراءة/الكتابة في الخادم؛ حقق الحقول عند الخادم، واحفظ المصدر والنسخة، واظهر خطأ قابلًا للإصلاح دون فقد المدخلات. | باستخدام بيانات ممثلة لـطلب التغيير ونسخة الهدف: حفظ صالح ورفض إدخال/صلاحية/نسخة مكررة، مع استبقاء المدخلات. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-14, QC-ADP-21 | NOT VERIFIED / NO-GO |
| `RT-CHANGE-003` | `/change-requests/[changeRequestId]` | طلب التغيير، اعتماد الطلب، Apply، نسخة الهدف | لا يوجد سجل طلب التغيير ونسخة الهدف ممثل للتحقق من الحالة والنسخة والعلاقات ورفض المعرّف أو الدور غير المخول في `/change-requests/[changeRequestId]`. | حدد مصدر طلب التغيير ونسخة الهدف وعقد القراءة/الكتابة في الخادم؛ أظهر الحالة والنسخة والتاريخ والعلاقات والأفعال المسموحة مع سبب المنع. | باستخدام بيانات ممثلة لـطلب التغيير ونسخة الهدف: سجل صحيح ومفقود وخارج النطاق؛ حالة/نسخة/أثر تدقيق وأفعال مطابقة للخادم. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13, QC-ADP-21 | NOT VERIFIED / NO-GO |
| `RT-CHANGE-004` | `/change-requests/[changeRequestId]/review` | طلب التغيير، اعتماد الطلب، Apply، نسخة الهدف | لا يوجد سجل طلب التغيير ونسخة الهدف ممثل للتحقق من الحالة والنسخة والعلاقات ورفض المعرّف أو الدور غير المخول في `/change-requests/[changeRequestId]/review`. | حدد مصدر طلب التغيير ونسخة الهدف وعقد القراءة/الكتابة في الخادم؛ ضع الدليل والنسخة والفاعل/SoD بجانب القرار، واختبر RETURN/REJECT/APPROVE بآثارها. | باستخدام بيانات ممثلة لـطلب التغيير ونسخة الهدف: قرار مخول ومرفوض بفصل واجبات ونسخة قديمة؛ توقيع/تدقيق وحالة موضوع صحيحة. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-21 | NOT VERIFIED / NO-GO |
| `RT-REPORT-001` | `/reports` | المصدر، النطاق، الفلاتر، العدد، CSV/XLSX | لم يُثبت على بيانات ممثلة أن `/reports` يعرض التقرير ومصدره ونطاقه بالنطاق الصحيح ويفصل الصفر الحقيقي عن غياب المصدر. | حدد مصدر التقرير ومصدره ونطاقه وعقد القراءة/الكتابة في الخادم؛ ثبت المصدر والنطاق والفلاتر والفرز والصفحات وحالات empty/error/populated. | باستخدام بيانات ممثلة لـالتقرير ومصدره ونطاقه: سجلات ممتلئة وفارغة وعطل، فلاتر/فرز/صفحات وحدود صلاحية، ورابط الصف صحيح. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-10, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-REPORT-002` | `/reports/[reportCode]` | المصدر، النطاق، الفلاتر، العدد، CSV/XLSX | تماثل التقرير على الشاشة مع CSV/XLSX والطباعة لم يُثبت ببيانات متعددة النطاق. | ثبت code/source/scope/filter/time/sort/count لكل مخرج من query موحد. | تطابق الصفوف والأعداد في الشاشة والتصدير، ورفض التقرير أو النطاق غير المخول. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-10, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-ADMIN-001` | `/admin` | المستخدم، الدور، الصلاحية، النطاق، التدقيق | عرض الإدارة لا يثبت منع self-grant أو تغير الدور أثناء الطلب. | اعرض الدور والنطاق بوضوح واربط الإجراءات عالية الأثر بقرار خادمي وتدقيق. | رفض self-grant والدور المسحوب والنسخة القديمة على API؛ كل تغيير يسجل الفاعل. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-USER-001` | `/admin/users` | المستخدم، الدور، الصلاحية، النطاق، التدقيق | لم يُثبت على بيانات ممثلة أن `/admin/users` يعرض حساب المستخدم ودوره بالنطاق الصحيح ويفصل الصفر الحقيقي عن غياب المصدر. | حدد مصدر حساب المستخدم ودوره وعقد القراءة/الكتابة في الخادم؛ ثبت المصدر والنطاق والفلاتر والفرز والصفحات وحالات empty/error/populated. | باستخدام بيانات ممثلة لـحساب المستخدم ودوره: سجلات ممتلئة وفارغة وعطل، فلاتر/فرز/صفحات وحدود صلاحية، ورابط الصف صحيح. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-USER-002` | `/admin/users/new` | المستخدم، الدور، الصلاحية، النطاق، التدقيق | لم تُنفذ كتابة أو قرار حساب المستخدم ودوره في `/admin/users/new`؛ صحة الحفظ والنسخة والرفض الخادمي وأثر التدقيق ما زالت غير مثبتة. | حدد مصدر حساب المستخدم ودوره وعقد القراءة/الكتابة في الخادم؛ حقق الحقول عند الخادم، واحفظ المصدر والنسخة، واظهر خطأ قابلًا للإصلاح دون فقد المدخلات. | باستخدام بيانات ممثلة لـحساب المستخدم ودوره: حفظ صالح ورفض إدخال/صلاحية/نسخة مكررة، مع استبقاء المدخلات. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-14 | NOT VERIFIED / NO-GO |
| `RT-USER-003` | `/admin/users/[userId]` | المستخدم، الدور، الصلاحية، النطاق، التدقيق | لا يوجد سجل حساب المستخدم ودوره ممثل للتحقق من الحالة والنسخة والعلاقات ورفض المعرّف أو الدور غير المخول في `/admin/users/[userId]`. | حدد مصدر حساب المستخدم ودوره وعقد القراءة/الكتابة في الخادم؛ أظهر الحالة والنسخة والتاريخ والعلاقات والأفعال المسموحة مع سبب المنع. | باستخدام بيانات ممثلة لـحساب المستخدم ودوره: سجل صحيح ومفقود وخارج النطاق؛ حالة/نسخة/أثر تدقيق وأفعال مطابقة للخادم. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-ROLE-001` | `/admin/roles` | المستخدم، الدور، الصلاحية، النطاق، التدقيق | لم يُثبت على بيانات ممثلة أن `/admin/roles` يعرض الدور ومصفوفة صلاحياته بالنطاق الصحيح ويفصل الصفر الحقيقي عن غياب المصدر. | حدد مصدر الدور ومصفوفة صلاحياته وعقد القراءة/الكتابة في الخادم؛ ثبت المصدر والنطاق والفلاتر والفرز والصفحات وحالات empty/error/populated. | باستخدام بيانات ممثلة لـالدور ومصفوفة صلاحياته: سجلات ممتلئة وفارغة وعطل، فلاتر/فرز/صفحات وحدود صلاحية، ورابط الصف صحيح. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-ROLE-002` | `/admin/roles/[roleId]` | المستخدم، الدور، الصلاحية، النطاق، التدقيق | لا يوجد سجل الدور ومصفوفة صلاحياته ممثل للتحقق من الحالة والنسخة والعلاقات ورفض المعرّف أو الدور غير المخول في `/admin/roles/[roleId]`. | حدد مصدر الدور ومصفوفة صلاحياته وعقد القراءة/الكتابة في الخادم؛ أظهر الحالة والنسخة والتاريخ والعلاقات والأفعال المسموحة مع سبب المنع. | باستخدام بيانات ممثلة لـالدور ومصفوفة صلاحياته: سجل صحيح ومفقود وخارج النطاق؛ حالة/نسخة/أثر تدقيق وأفعال مطابقة للخادم. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-ADMIN-002` | `/admin/permissions` | المستخدم، الدور، الصلاحية، النطاق، التدقيق | لم يُثبت على بيانات ممثلة أن `/admin/permissions` يعرض إعداد الإدارة والصلاحيات بالنطاق الصحيح ويفصل الصفر الحقيقي عن غياب المصدر. | حدد مصدر إعداد الإدارة والصلاحيات وعقد القراءة/الكتابة في الخادم؛ ثبت المصدر والنطاق والفلاتر والفرز والصفحات وحالات empty/error/populated. | باستخدام بيانات ممثلة لـإعداد الإدارة والصلاحيات: سجلات ممتلئة وفارغة وعطل، فلاتر/فرز/صفحات وحدود صلاحية، ورابط الصف صحيح. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-ADMIN-003` | `/admin/scopes` | المستخدم، الدور، الصلاحية، النطاق، التدقيق | لم يُثبت على بيانات ممثلة أن `/admin/scopes` يعرض إعداد الإدارة والصلاحيات بالنطاق الصحيح ويفصل الصفر الحقيقي عن غياب المصدر. | حدد مصدر إعداد الإدارة والصلاحيات وعقد القراءة/الكتابة في الخادم؛ ثبت المصدر والنطاق والفلاتر والفرز والصفحات وحالات empty/error/populated. | باستخدام بيانات ممثلة لـإعداد الإدارة والصلاحيات: سجلات ممتلئة وفارغة وعطل، فلاتر/فرز/صفحات وحدود صلاحية، ورابط الصف صحيح. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-SYSTEM-001` | `/system/health` | هوية الإصدار، NO-GO، النسخ، الاستعادة المثبتة | الإنتاج عرض NOT READY وschema drift وهوية إصدار/استعادة غير متحققتين. | اعرض السبب الدقيق والهوية والبوابات دون دمج صحة العملية مع قرار الإطلاق. | لا GO قبل تطابق المخطط والهوية وأدلة الاستعادة والبوابات على المرشح نفسه. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-03, QC-ADP-04, QC-ADP-13, QC-ADP-26 | NOT VERIFIED / NO-GO |
| `RT-SYSTEM-002` | `/system/control-center` | هوية الإصدار، NO-GO، النسخ، الاستعادة المثبتة | العرض قد يقول Core system READY بينما health العام NOT READY؛ خطر فهمهما كقرار إطلاق واحد. | سمّ صحة النواة وجاهزية الإصدار كحالتين منفصلتين مع أسباب NO-GO وروابط الأدلة. | لا يظهر GO عند schema drift أو release identity/restore غير متحققين. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-03, QC-ADP-04, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-BACKUP-001` | `/system/backups` | هوية الإصدار، NO-GO، النسخ، الاستعادة المثبتة | الكتالوج الحي فارغ ولا توجد استعادة مثبتة. | اعرض غياب النسخ بوضوح، ثم نفذ تجربة استعادة معزولة بعد سياسة وهدف معتمدين. | نسخة مقروءة ودليل hash/زمن/استرجاع على هدف معزول؛ لا تجربة على الإنتاج. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-03, QC-ADP-04, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-BACKUP-002` | `/system/backups/[backupId]` | هوية الإصدار، NO-GO، النسخ، الاستعادة المثبتة | لا يوجد سجل النسخة الاحتياطية ودليل الاستعادة ممثل للتحقق من الحالة والنسخة والعلاقات ورفض المعرّف أو الدور غير المخول في `/system/backups/[backupId]`. | حدد مصدر النسخة الاحتياطية ودليل الاستعادة وعقد القراءة/الكتابة في الخادم؛ أظهر الحالة والنسخة والتاريخ والعلاقات والأفعال المسموحة مع سبب المنع. | باستخدام بيانات ممثلة لـالنسخة الاحتياطية ودليل الاستعادة: سجل صحيح ومفقود وخارج النطاق؛ حالة/نسخة/أثر تدقيق وأفعال مطابقة للخادم. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-03, QC-ADP-04, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-BACKUP-003` | `/system/backups/[backupId]/restore` | هوية الإصدار، NO-GO، النسخ، الاستعادة المثبتة | لا توجد نسخة حية في الكتالوج؛ تجربة استعادة فعلية غير مثبتة. | نفذ فقط على هدف معزول بعد سياسة وصلاحية وسبب، مع hash ووقت ونتيجة وتوقيع. | استعادة معزولة ناجحة ورفض غير المخول أو bundle فاسد؛ لا أثر على الإنتاج. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-03, QC-ADP-04 | NOT VERIFIED / NO-GO |
| `RT-REJ-001` | `/reject-reports` | تقرير الرفض، issue slip، daily، جاهزية المخطط | الحالة الحية 503 بسبب schema 0018 مقابل source 0039. | صالح المخطط عبر خطة معزولة وتفويض تشغيل، ثم اختبر بيانات حقيقية مع بقاء 503 الصريح عند الفشل. | READ/CREATE/issue slip/daily على مخطط مطابق؛ منع غير المخول؛ لا بيانات وهمية. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-01, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-REJ-002` | `/reject-reports/new` | تقرير الرفض، issue slip، daily، جاهزية المخطط | إنشاء تقرير رفض محجوب حتى جاهزية المخطط. | أزل الانسداد بعد مصالحة المخطط وطبّق صلاحية الإدخال وحدود المصدر. | إنشاء صالح على PG ممثل ورفض حقول/صلاحية/نسخة غير صحيحة. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-01, QC-ADP-14 | NOT VERIFIED / NO-GO |
| `RT-REJ-003` | `/reject-reports/issue-slips/[reportId]` | تقرير الرفض، issue slip، daily، جاهزية المخطط | لا يوجد سجل قسيمة رفض التقرير ممثل للتحقق من الحالة والنسخة والعلاقات ورفض المعرّف أو الدور غير المخول في `/reject-reports/issue-slips/[reportId]`. | حدد مصدر قسيمة رفض التقرير وعقد القراءة/الكتابة في الخادم؛ أظهر الحالة والنسخة والتاريخ والعلاقات والأفعال المسموحة مع سبب المنع. | باستخدام بيانات ممثلة لـقسيمة رفض التقرير: سجل صحيح ومفقود وخارج النطاق؛ حالة/نسخة/أثر تدقيق وأفعال مطابقة للخادم. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-01, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-REJ-004` | `/reject-reports/daily/[reportId]` | تقرير الرفض، issue slip، daily، جاهزية المخطط | لا يوجد سجل السجل اليومي للرفض ممثل للتحقق من الحالة والنسخة والعلاقات ورفض المعرّف أو الدور غير المخول في `/reject-reports/daily/[reportId]`. | حدد مصدر السجل اليومي للرفض وعقد القراءة/الكتابة في الخادم؛ أظهر الحالة والنسخة والتاريخ والعلاقات والأفعال المسموحة مع سبب المنع. | باستخدام بيانات ممثلة لـالسجل اليومي للرفض: سجل صحيح ومفقود وخارج النطاق؛ حالة/نسخة/أثر تدقيق وأفعال مطابقة للخادم. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-01, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-AI-001` | `/ai-advisory` | حدود الاستشارة، provenance، consent، سياسة المعالجة  | provider endpoint allowlist و4 تصنيفات MIT ودليل SBOM واختبارات AI المركزة PASS؛ قبول الصفحة 5/10 (50%). Live UI readability NOT VERIFIED؛ security E2E، dependency audit، owner policy artifact، وapproved live eval BLOCKED. | أبق الإرسال الخارجي معطلًا حتى اعتماد المزود والمكان والاحتفاظ/الحذف وفئات البيانات وconsent؛ أظهر حدود المخرجات الاستشارية. | استكمل الفحوص العشرة على المرشح نفسه؛ أرفق نجاحًا ورفضًا وحدود الدور؛ لا READY حتى إغلاق المحجوبات وP0/P1. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-11, QC-ADP-26؛ `audit/2026-09-24/QC-ADP-11-handoff.md` | PARTIAL / NO-GO |
| `RT-SHARED-001` | `/search` | مصطلح البحث، النطاق، نتيجة مرخصة، رابط السجل  | نتائج النطاق والصلاحية لم تُختبر ببيانات متعددة المالكين. | اختبر البحث بمعرّف ووصف، الفشل، عدم النتائج، وتسرب سجلات الدور الآخر. | نتائج مخولة فقط مع عدّ صحيح ورابط صالح؛ لا كشف للسجل خارج النطاق. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-23 | NOT VERIFIED / NO-GO |
| `RT-SHARED-002` | `/notifications` | المستلم، الإشعار غير المقروء، الوجهة، فشل التسليم  | لا يوجد اختبار حي لإشعارات مستلمين متعددين أو الوجهات. | طابق المستلم وشدة الإشعار وحالة المقروء والرابط مع السجل المصدر. | لا يصل إشعار لحساب آخر؛ الرابط يفتح سجلًا مخولًا؛ العطل لا يظهر صفرًا مضللًا. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13, QC-ADP-23, QC-ADP-26 | NOT VERIFIED / NO-GO |
| `RT-SHARED-003` | `/account` | الجلسة، كلمة المرور، الإبطال، returnTo  | تغيير كلمة المرور وتسجيل الخروج وإبطال الجلسة لم تُختبر في هذه الجولة. | اختبر التحقق الحالي، تدوير الجلسة، sign out، الإبطال، ورسائل الاسترداد. | رفض كلمة مرور حالية خاطئة؛ انتهاء الجلسة بعد الخروج/الإبطال؛ returnTo محلي آمن. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-22 | NOT VERIFIED / NO-GO |
| `RT-SHARED-004` | `/audit` | الفاعل، الفعل، الموضوع، الزمن، سلامة الأثر  | الفلاتر والنطاق وغياب المزوّد لم تُختبر بأحداث فعلية متعددة الأدوار. | اختبر اكتمال الأحداث ورابط الطلب والفرز والفلاتر ومنع تسرب الأحداث. | حدث لكل mutation حرجة، ورفض القراءة خارج النطاق؛ العطل لا يظهر كقائمة فارغة مؤكدة. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13, QC-ADP-24 | NOT VERIFIED / NO-GO |
| `RT-HELP-001` | `/help` | HOLD، PASS، RELEASED، استرداد الوصول، NO-GO  | دقة إرشادات المساعدة مقابل المسارات والسياسات الحالية لم تُراجع في هذه الجولة. | راجع كل رابط وخطوة في المساعدة على المسار الحي، واشرح HOLD/PASS/RELEASED وNO-GO دون وعد بوظيفة مؤجلة. | روابط صحيحة للدور، مصطلحات مطابقة للواجهة، ولا توجيه إلى recovery مؤجل بلا قرار. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15 | NOT VERIFIED / NO-GO |
| `RT-QUAR-003` | `/quarantine/admin/[templateId]` | Receiving، Inspection، HOLD، PASS، RELEASED | لا يوجد سجل قالب التفتيش المعتمد ممثل للتحقق من الحالة والنسخة والعلاقات ورفض المعرّف أو الدور غير المخول في `/quarantine/admin/[templateId]`. | حدد مصدر قالب التفتيش المعتمد وعقد القراءة/الكتابة في الخادم؛ أظهر الحالة والنسخة والتاريخ والعلاقات والأفعال المسموحة مع سبب المنع. | باستخدام بيانات ممثلة لـقالب التفتيش المعتمد: سجل صحيح ومفقود وخارج النطاق؛ حالة/نسخة/أثر تدقيق وأفعال مطابقة للخادم. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-02, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-DOC-007` | `/documents/[documentId]/versions/[versionId]/edit` | مسودة النسخة، WI/SOP، النسخة الفعالة، تاريخ السريان | تحرير نسخة مستند عند حدود DRAFT/معتمد لم يُثبت. | اسمح بتحرير المسودة فقط مع expectedVersion وتحذير تغيير غير محفوظ؛ اقفل النسخة المعتمدة. | حفظ مسودة صحيح، رفض نسخة قديمة أو معتمدة، وبقاء التاريخ دون تغيير. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13, QC-ADP-20 | NOT VERIFIED / NO-GO |
| `RT-REL-001` | `/governance/releases/[releaseId]` | هوية الإصدار، NO-GO، النسخ، الاستعادة المثبتة | مرشح الإصدار بلا دليل هوية ونشر متطابقين في الجولة. | اربط المرشح بـexact SHA وbuild digest وبوابات CI/PG/E2E/UAT والقرار الموقّع. | مرشح ناقص دليل واحد يبقى NO-GO؛ لا ترقية من نجاح build وحده. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-03, QC-ADP-04, QC-ADP-13 | NOT VERIFIED / NO-GO |
| `RT-ERROR-404` | `/404` | الوجهة، حالة الجلسة، رابط الاسترداد  | رابط الزائر يذهب إلى login بينما نصه Go to dashboard. | اجعل نص الرابط مطابقًا لوجهته حسب حالة الجلسة. | زائر يرى Go to login، والمصادق يرى Go to dashboard؛ كلا الرابطين يعملان بلوحة المفاتيح. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-16 | NOT VERIFIED / NO-GO |
| `RT-ERROR-500` | `/500` | خطأ الخادم، سبب قابل للاسترداد، سرية التفاصيل  | لم تُختبر استجابة الخطأ العام مع فقد الجلسة أو تعطل المزوّد. | اعرض رسالة بشرية ورابط استرداد يعمل، وأخفِ تفاصيل الخادم والطلب الحساسة. | خطأ 500 لا يكشف stack/secret، ويعطي استردادًا قابلًا للوصول دون إعلان نجاح. | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-16 | NOT VERIFIED / NO-GO |

## 26. الحكم النهائي
**NO-GO / PARTIAL.** لا يوجد مبرر لإعلان اكتمال الصفحة أو النظام مع migration drift وReject Reports محجوب وrelease/restore/UAT/E2E/AT غير مثبتة. النطاق الحي الذي تمت مشاهدته يؤكد بعض التقدم في الوضوح، ولا يثبت الدورات المقفلة.

### بوابة الإطلاق والاستلام
لا يوقّع المالك استلامًا نهائيًا إلا على مرشح واحد بهوية build معروفة، وبعد إثبات كل شرط أدناه. البرومبتات والبطاقات خطة تنفيذ؛ لا تغيّر حالة البوابة وحدها.

| شرط التسليم | الحالة الحالية | دليل الإغلاق المطلوب |
|---|---|---|
| صفحات النظام الـ90 | NOT VERIFIED كحزمة إطلاق | بطاقة قبول كل صفحة في القسم 25 = `PASS` لكل فحص منطبق، مع `N/A` مبرر بمصدر |
| مخطط الإنتاج وReject Reports | FAIL / BLOCKED: applied `0018` مقابل shipped `0039` وHTTP 503 | migration parity مصرح بها، وقراءة/إنشاء/تقرير على بيانات ممثلة |
| السياسات العلمية وQMS | BLOCKED حيث المصدر/القرار مفتوح | مصدر معتمد للمعيار والقالب وقرار NCR/CAPA/الإطلاق |
| هوية الإصدار والبوابات | NOT VERIFIED | exact SHA وbuild identity وCI/PG/E2E/security مرتبطة بالمرشح |
| الصلاحيات والبيانات | NOT VERIFIED شاملًا | اختبار قبول ورفض لكل دور ونطاق وحالة ونسخة وSoD على قاعدة ممثلة |
| الإتاحة والأداء وUAT | NOT VERIFIED شاملًا | مصفوفة keyboard/AT ومقاسات، قياسات أداء، وقبول بشري موثق |
| النسخ والاستعادة | NOT VERIFIED | نسخة فعلية وتجربة استعادة معزولة وقياس/توقيع وفق سياسة معتمدة |

**قرار الاستلام الحالي: NO-GO.** لا يكفي إغلاق جدول المتطلبات أو نجاح build؛ يلزم تنفيذ الإصلاحات والتحقق وتوقيع صاحب الصلاحية. لا يشمل هذا التقرير تفويضًا بالنشر أو migration الإنتاج.

## 27. ملحق الأدلة
- Source: `src/shared/routing/routes.ts`، `src/pages/**` (88 ملفًا)، `src/ui/navigation/navigation.ts`، `Documents/ROUTE-MATRIX.md`، `Documents/STATE-MACHINES.md`، `Documents/ROLE-MATRIX.md`، `Documents/DATA-MODEL.md`، migrations حتى 0039، `.agents/mind/01-mind-latest.md`.
- فرق `src/pages/**` و`src/shared/routing/routes.ts` بين HEAD المشاهدة الأصلي `7c0856262ee789a3e43495b4091de033c7cf1846` وHEAD إعادة الفحص `72626aced7aa436010766a64b04b9ded392ba824`: فارغ. تم التحقق من وجود 88 ملف صفحة فعلي وصحة حدود أسطر إشارات المصدر في البطاقات؛ لا يثبت ذلك سلوك use case أو قاعدة البيانات.
- Live read-only 2026-09-24 حوالى 09:37–09:40 Asia/Riyadh: `/dashboard`, `/system/health`, `/reject-reports`, `/laboratory/tests/new`, `/laboratory/report-templates`, `/system/backups`, `/quality/ncr`, `/quality/capa`, `/tasks` وسجل مهمة واحد، وسائر الوجهات المدرجة في set الجولة. لا URL سري ولا كلمة مرور في الأثر.
- Verification: مقارنة inventory آلية 88 registered/86 physical/2 deferred + 2 error files؛ لا تشغيل PostgreSQL أو Playwright role matrix أو load/AT/UAT في هذه الجولة. Node الحالي `v22.22.3` خارج العقد `>=24.20.0 <25`؛ لهذا لم تُستخدم نتائج بناء جديدة كدليل. فحص بنية HTML وعدد البطاقات وJavaScript syntax وPrettier PASS؛ العرض المرئي والتفاعل مع زر النسخ **NOT VERIFIED** لأن سياسة المتصفح منعت فتح الملف المحلي، وربط خادم localhost مُنع بصلاحية البيئة. لم يُستخدم مسار التفاف.
