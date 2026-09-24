# QC-ADAPTIVE-PAGE-BY-PAGE-AUDIT-001 — تدقيق تكيفي لكل صفحات النظام

**التاريخ:** 2026-09-24 · **HEAD لجولة المشاهدة الأصلية:** `7c0856262ee789a3e43495b4091de033c7cf1846` · **HEAD لإعادة فحص المصدر:** `72626aced7aa436010766a64b04b9ded392ba824` · **الفرع:** `main` · **حالة الشجرة عند البدء:** نظيفة · **النتيجة:** `PARTIAL / NO-GO`.

> **حد الدليل:** هذا جرد كامل للمسارات الفيزيائية مع إشارات مصدر محددة، ومشاهدة قراءة فقط لعينة كبيرة من صفحات الإنتاج بحساب المالك؛ ليس اختبارًا شاملاً لكل سجل ديناميكي أو كل دور أو قياس أداء أو اعتماد UAT. النسب التقديرية السابقة سُحبت؛ الحكم الحالي يُسند إلى أدلة قابلة للتتبع ولا يساوي درجة امتثال. `NOT VERIFIED` لا يساوي `FAIL`، و`PASS` محلي لا يساوي `RELEASED`.

## 1. الملخص التنفيذي
- الجرد: **90 موضع صفحة**: 88 مسارًا مسجلًا (86 ملفًا فعليًا + 2 deferred)، وصفحتا 404/500 فعليتان خارج السجل؛ **88 ملف Astro فعلي**. الصفحات الحية التي فُتحت قراءة فقط: **47** وجهة مميزة، تشمل سجل مهمة ديناميكي واحد؛ `/laboratory` يعيد التوجيه إلى `/laboratory/tests`.
- أكبر مانع إنتاج مثبت: مخطط Reject Reports غير متاح (`0018` applied مقابل `0039` shipped). الهوية الحالية للإصدار والاستعادة غير متحققتين. المعالجة الخارجية للـAI مغلقة وفق السياسة.
- مصادر القرار العلمي والسياسة في inspection/NCR/CAPA، وقالب المختبر المعتمد، ودليل قاعدة بيانات/مصادقة/UAT على المرشح نفسه لا تزال مفتوحة. لا يجوز سدها بمعايير مختلقة.
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
| 1 | `RT-ROOT-001` | `/` | Authentication | Redirect | `src/pages/index.astro` | public/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016 |
| 2 | `RT-AUTH-001` | `/login` | Authentication | Authentication | `src/pages/login.astro` | public/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016 |
| 3 | `RT-AUTH-002` | `/auth/recovery` | Authentication | Authentication | `src/pages/auth/recovery.astro` | public/deferred | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | DEFERRED | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-017 |
| 4 | `RT-AUTH-003` | `/auth/reset/[requestId]` | Authentication | Authentication | `src/pages/auth/reset/[requestId].astro` | public/deferred | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | DEFERRED | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-017 |
| 5 | `RT-DASH-001` | `/dashboard` | Dashboard & work | Overview | `src/pages/dashboard/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-008, QC-PAGE-F-014 |
| 6 | `RT-WORK-001` | `/work` | Dashboard & work | Overview | `src/pages/work/index.astro` | authenticated/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-008, QC-PAGE-F-014 |
| 7 | `RT-TASK-001` | `/tasks` | Tasks | Register | `src/pages/tasks/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 |
| 8 | `RT-TASK-002` | `/tasks/new` | Tasks | Form | `src/pages/tasks/new.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015 |
| 9 | `RT-TASK-003` | `/tasks/[taskId]` | Tasks | Detail | `src/pages/tasks/[taskId].astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 |
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
| 27 | `RT-INSP-002` | `/quarantine/inspections/[inspectionId]` | Quarantine | Detail | `src/pages/quarantine/inspections/[inspectionId]/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002, QC-PAGE-F-014 |
| 28 | `RT-INSP-003` | `/quarantine/inspections/[inspectionId]/execute` | Quarantine | Execution | `src/pages/quarantine/inspections/[inspectionId]/execute.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002, QC-PAGE-F-015 |
| 29 | `RT-INSP-004` | `/quarantine/inspections/[inspectionId]/review` | Quarantine | Review | `src/pages/quarantine/inspections/[inspectionId]/review.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002 |
| 30 | `RT-QUAR-002` | `/quarantine/admin` | Quarantine | Register | `src/pages/quarantine/admin/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002, QC-PAGE-F-014 |
| 31 | `RT-LAB-001` | `/laboratory` | Laboratory | Register | `src/pages/laboratory/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005, QC-PAGE-F-014 |
| 32 | `RT-LAB-002` | `/laboratory/tests` | Laboratory | Register | `src/pages/laboratory/tests/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005, QC-PAGE-F-014 |
| 33 | `RT-LAB-003` | `/laboratory/tests/new` | Laboratory | Form | `src/pages/laboratory/tests/new.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005, QC-PAGE-F-015 |
| 34 | `RT-LAB-009` | `/laboratory/report-templates` | Laboratory | Draft/print | `src/pages/laboratory/report-templates.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005, QC-PAGE-F-006, QC-PAGE-F-015 |
| 35 | `RT-LAB-004` | `/laboratory/tests/[labTestId]` | Laboratory | Detail | `src/pages/laboratory/tests/[labTestId]/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005, QC-PAGE-F-014 |
| 36 | `RT-LAB-005` | `/laboratory/tests/[labTestId]/execute` | Laboratory | Execution | `src/pages/laboratory/tests/[labTestId]/execute.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005, QC-PAGE-F-015 |
| 37 | `RT-LAB-006` | `/laboratory/tests/[labTestId]/review` | Laboratory | Review | `src/pages/laboratory/tests/[labTestId]/review.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005 |
| 38 | `RT-LAB-007` | `/laboratory/tests/[labTestId]/retests/new` | Laboratory | Form | `src/pages/laboratory/tests/[labTestId]/retests/new.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005, QC-PAGE-F-015 |
| 39 | `RT-ASSET-001` | `/assets` | Assets | Overview | `src/pages/assets/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 |
| 40 | `RT-EQUIP-001` | `/assets/equipment` | Assets | Register | `src/pages/assets/equipment/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 |
| 41 | `RT-EQUIP-002` | `/assets/equipment/new` | Assets | Form | `src/pages/assets/equipment/new.astro` | permission-bound/conditional | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015 |
| 42 | `RT-EQUIP-003` | `/assets/equipment/[equipmentId]` | Assets | Detail | `src/pages/assets/equipment/[equipmentId].astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 |
| 43 | `RT-CAL-001` | `/assets/calibrations` | Assets | Register | `src/pages/assets/calibrations/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 |
| 44 | `RT-CAL-002` | `/assets/calibrations/new` | Assets | Form | `src/pages/assets/calibrations/new.astro` | permission-bound/conditional | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015 |
| 45 | `RT-CAL-003` | `/assets/calibrations/[calibrationId]` | Assets | Detail | `src/pages/assets/calibrations/[calibrationId].astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 |
| 46 | `RT-MAINT-001` | `/assets/maintenance` | Assets | Register | `src/pages/assets/maintenance/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 |
| 47 | `RT-MAINT-002` | `/assets/maintenance/new` | Assets | Form | `src/pages/assets/maintenance/new.astro` | permission-bound/conditional | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015 |
| 48 | `RT-MAINT-003` | `/assets/maintenance/[maintenanceId]` | Assets | Detail | `src/pages/assets/maintenance/[maintenanceId].astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 |
| 49 | `RT-DOC-001` | `/documents` | Documents | Register | `src/pages/documents/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 |
| 50 | `RT-DOC-002` | `/documents/new` | Documents | Form | `src/pages/documents/new.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015 |
| 51 | `RT-DOC-003` | `/documents/[documentId]` | Documents | Detail | `src/pages/documents/[documentId]/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 |
| 52 | `RT-DOC-004` | `/documents/[documentId]/versions/new` | Documents | Form | `src/pages/documents/[documentId]/versions/new.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015 |
| 53 | `RT-DOC-005` | `/documents/[documentId]/versions/[versionId]` | Documents | Detail | `src/pages/documents/[documentId]/versions/[versionId]/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 |
| 54 | `RT-DOC-006` | `/documents/[documentId]/versions/[versionId]/review` | Documents | Review | `src/pages/documents/[documentId]/versions/[versionId]/review.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016 |
| 55 | `RT-APPROVAL-001` | `/approvals` | Approvals | Register | `src/pages/approvals/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 |
| 56 | `RT-APPROVAL-002` | `/approvals/[approvalId]` | Approvals | Detail | `src/pages/approvals/[approvalId].astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 |
| 57 | `RT-CHANGE-001` | `/change-requests` | Change requests | Register | `src/pages/change-requests/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 |
| 58 | `RT-CHANGE-002` | `/change-requests/new` | Change requests | Form | `src/pages/change-requests/new.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015 |
| 59 | `RT-CHANGE-003` | `/change-requests/[changeRequestId]` | Change requests | Detail | `src/pages/change-requests/[changeRequestId]/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 |
| 60 | `RT-CHANGE-004` | `/change-requests/[changeRequestId]/review` | Change requests | Review | `src/pages/change-requests/[changeRequestId]/review.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016 |
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
| 71 | `RT-SYSTEM-001` | `/system/health` | System & recovery | Overview | `src/pages/system/health.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-003, QC-PAGE-F-004, QC-PAGE-F-014 |
| 72 | `RT-SYSTEM-002` | `/system/control-center` | System & recovery | Overview | `src/pages/system/control-center.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-003, QC-PAGE-F-004, QC-PAGE-F-014 |
| 73 | `RT-BACKUP-001` | `/system/backups` | System & recovery | Register | `src/pages/system/backups/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-003, QC-PAGE-F-004, QC-PAGE-F-014 |
| 74 | `RT-BACKUP-002` | `/system/backups/[backupId]` | System & recovery | Detail | `src/pages/system/backups/[backupId]/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-003, QC-PAGE-F-004, QC-PAGE-F-014 |
| 75 | `RT-BACKUP-003` | `/system/backups/[backupId]/restore` | System & recovery | Recovery | `src/pages/system/backups/[backupId]/restore.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-003, QC-PAGE-F-004 |
| 76 | `RT-REJ-001` | `/reject-reports` | Reject Reports | Register | `src/pages/reject-reports/index.astro` | authenticated/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-001, QC-PAGE-F-014 |
| 77 | `RT-REJ-002` | `/reject-reports/new` | Reject Reports | Form | `src/pages/reject-reports/new.astro` | authenticated/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-001, QC-PAGE-F-015 |
| 78 | `RT-REJ-003` | `/reject-reports/issue-slips/[reportId]` | Reject Reports | Detail | `src/pages/reject-reports/issue-slips/[reportId].astro` | authenticated/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-001, QC-PAGE-F-014 |
| 79 | `RT-REJ-004` | `/reject-reports/daily/[reportId]` | Reject Reports | Detail | `src/pages/reject-reports/daily/[reportId].astro` | authenticated/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-001, QC-PAGE-F-014 |
| 80 | `RT-AI-001` | `/ai-advisory` | Shared | Utility | `src/pages/ai-advisory.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-019 |
| 81 | `RT-SHARED-001` | `/search` | Shared | Utility | `src/pages/search.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016 |
| 82 | `RT-SHARED-002` | `/notifications` | Shared | Register | `src/pages/notifications.astro` | authenticated/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 |
| 83 | `RT-SHARED-003` | `/account` | Shared | Utility | `src/pages/account.astro` | authenticated/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016 |
| 84 | `RT-SHARED-004` | `/audit` | Shared | Register | `src/pages/audit.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 |
| 85 | `RT-HELP-001` | `/help` | Shared | Utility | `src/pages/help/index.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | LIVE+SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016 |
| 86 | `RT-QUAR-003` | `/quarantine/admin/[templateId]` | Quarantine | Detail | `src/pages/quarantine/admin/[templateId].astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002, QC-PAGE-F-014 |
| 87 | `RT-DOC-007` | `/documents/[documentId]/versions/[versionId]/edit` | Documents | Detail | `src/pages/documents/[documentId]/versions/[versionId]/edit.astro` | permission-bound/required | NOT VERIFIED | فعل/دور/حالة أو قياس ناقص | SOURCE | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 |
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
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016.

### RT-AUTH-001 — `/login`
- **النوع/المنهج/السبب:** Authentication؛ سلامة الدخول واسترداد الوصول. الهوية والجلسة ورسائل الرفض هي الخطر الأساسي.
- **الملف/الظهور/المستخدم:** `src/pages/login.astro`؛ `public` (`required`)؛ PUBLIC أو مستخدم مصادق بحسب المسار. **الهدف/الدورة:** هوية الدخول واسترداد الجلسة؛ تحقق دخول/استرداد؛ لا قرار QC.
- **المصدر والبيانات:** قراءة عبر shared/use case أو صفحة ثابتة. كيانات مرجعية مرشحة: `سجل جلسات/مستخدمين`. الحالة النصية المستخرجة: AUTH_RATE_LIMITED, AUTH_RATE_LIMIT_STORE_UNAVAILABLE.
- **أثر مصدر قابل للتتبع:** استدعاء واجهة الإجراء `actions.login` L9، `actions.login` L35. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Show؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** راجع المهمة الأساسية واللغة والاسترداد وإتاحة لوحة المفاتيح، مع عدم توسيع السلطة.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016.

### RT-AUTH-002 — `/auth/recovery`
- **النوع/المنهج/السبب:** Authentication؛ سلامة الدخول واسترداد الوصول. الهوية والجلسة ورسائل الرفض هي الخطر الأساسي.
- **الملف/الظهور/المستخدم:** `src/pages/auth/recovery.astro`؛ `public` (`deferred`)؛ PUBLIC أو مستخدم مصادق بحسب المسار. **الهدف/الدورة:** هوية الدخول واسترداد الجلسة؛ تحقق دخول/استرداد؛ لا قرار QC.
- **المصدر والبيانات:** لا ملف صفحة؛ عقد مؤجل. كيانات مرجعية مرشحة: `سجل جلسات/مستخدمين`. الحالة النصية المستخرجة: لم تُستخرج حالات نصية مباشرة؛ راجع use case.
- **أثر مصدر قابل للتتبع:** لا يوجد ملف Astro فعلي لهذا المسار المؤجل؛ سلوك الصفحة وقرار إتاحتها يحتاجان عقد منتج.
- **الأفعال/الصفحات المرتبطة:** قراءة/توجيه؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** لم تُثبت مشاهدة حية لهذا المسار. مسار مؤجل بلا ملف صفحة؛ تجربة الاسترداد عبر هذا URL غير متاحة.
- **التوصية والتصميم:** راجع المهمة الأساسية واللغة والاسترداد وإتاحة لوحة المفاتيح، مع عدم توسيع السلطة.
- **بطاقة الدليل:** source=DEFERRED؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-017.

### RT-AUTH-003 — `/auth/reset/[requestId]`
- **النوع/المنهج/السبب:** Authentication؛ سلامة الدخول واسترداد الوصول. الهوية والجلسة ورسائل الرفض هي الخطر الأساسي.
- **الملف/الظهور/المستخدم:** `src/pages/auth/reset/[requestId].astro`؛ `public` (`deferred`)؛ PUBLIC أو مستخدم مصادق بحسب المسار. **الهدف/الدورة:** هوية الدخول واسترداد الجلسة؛ تحقق دخول/استرداد؛ لا قرار QC.
- **المصدر والبيانات:** لا ملف صفحة؛ عقد مؤجل. كيانات مرجعية مرشحة: `سجل جلسات/مستخدمين`. الحالة النصية المستخرجة: لم تُستخرج حالات نصية مباشرة؛ راجع use case.
- **أثر مصدر قابل للتتبع:** لا يوجد ملف Astro فعلي لهذا المسار المؤجل؛ سلوك الصفحة وقرار إتاحتها يحتاجان عقد منتج.
- **الأفعال/الصفحات المرتبطة:** قراءة/توجيه؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** لم تُثبت مشاهدة حية لهذا المسار. مسار مؤجل بلا ملف صفحة؛ تجربة الاسترداد عبر هذا URL غير متاحة.
- **التوصية والتصميم:** راجع المهمة الأساسية واللغة والاسترداد وإتاحة لوحة المفاتيح، مع عدم توسيع السلطة.
- **بطاقة الدليل:** source=DEFERRED؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-017.

### RT-DASH-001 — `/dashboard`
- **النوع/المنهج/السبب:** Overview؛ دعم القرار ودلالة المؤشرات. الغرض تحديد ما يتطلب انتباهًا ووجهة الإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/dashboard/index.astro`؛ `permission-bound` (`required`)؛ كل مستخدم نشط. **الهدف/الدورة:** وعي تشغيلي وتوجيه العمل؛ قراءة مؤشرات/طوابير وروابط إلى السجلات.
- **المصدر والبيانات:** `../../modules/dashboard/application/dependencies.js`, `../../modules/dashboard/application/get-dashboard.js`, `../../modules/dashboard/application/dashboard-empty.js`. كيانات مرجعية مرشحة: `read models متعددة`. الحالة النصية المستخرجة: AUTHORIZATION, AVAILABLE.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../modules/dashboard/application/dependencies.js` L7، `../../modules/dashboard/application/get-dashboard.js` L8، `../../modules/dashboard/application/dashboard-empty.js` L9. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Open the receiving register, Open my approvals, Open my overdue tasks, Open history؛ `/tasks`, `/quarantine/receiving`, `/quarantine/inspections`, `/laboratory/tests`, `/approvals`.
- **قوة/مشكلة مرصودة:** حَيًّا: كل عدادات الإجراءات المعروضة 0، مع تعريف source/scope وروابط drill-down؛ صفحة التغطية تصرح بطوابير غير موردة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** اربط كل مؤشر بمصدر ونطاق وزمن ورابط filter مطابق؛ أظهر unavailable بصدق ولا تحوّل الصفر إلى بيانات مفقودة.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-008, QC-PAGE-F-014.

### RT-WORK-001 — `/work`
- **النوع/المنهج/السبب:** Overview؛ دعم القرار ودلالة المؤشرات. الغرض تحديد ما يتطلب انتباهًا ووجهة الإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/work/index.astro`؛ `authenticated` (`required`)؛ كل مستخدم نشط. **الهدف/الدورة:** وعي تشغيلي وتوجيه العمل؛ قراءة مؤشرات/طوابير وروابط إلى السجلات.
- **المصدر والبيانات:** `../../modules/dashboard/application/dependencies.js`. كيانات مرجعية مرشحة: `read models متعددة`. الحالة النصية المستخرجة: AUTHORIZATION, AVAILABLE.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../modules/dashboard/application/dependencies.js` L5. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** قراءة/توجيه؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** اربط كل مؤشر بمصدر ونطاق وزمن ورابط filter مطابق؛ أظهر unavailable بصدق ولا تحوّل الصفر إلى بيانات مفقودة.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-008, QC-PAGE-F-014.

### RT-TASK-001 — `/tasks`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/tasks/index.astro`؛ `permission-bound` (`required`)؛ مالك/مكلّف/مشرف. **الهدف/الدورة:** إدارة مهمة تشغيلية؛ إنشاء ثم تعيين وتفعيل وتحديث حالة.
- **المصدر والبيانات:** `../../modules/tasks/application/dependencies.js`, `../../modules/identity/application/admin-dependencies.js`. كيانات مرجعية مرشحة: `qc.tasks`. الحالة النصية المستخرجة: DRAFT, OPEN, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../modules/tasks/application/dependencies.js` L8، `../../modules/identity/application/admin-dependencies.js` L12؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-TASK-CREATE` L88. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Create task؛ `/tasks/new`, `/tasks/${task.id`.
- **قوة/مشكلة مرصودة:** حَيًّا: سجل واحد، فلاتر due/assignee/state، ترتيب وكثافة صفوف؛ أزرار bulk غير متاحة بوضوح. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014.

### RT-TASK-002 — `/tasks/new`
- **النوع/المنهج/السبب:** Form؛ تحليل نموذج ومنع الخطأ. يدخل المستخدم بيانات قد تنشئ سجلًا دائمًا.
- **الملف/الظهور/المستخدم:** `src/pages/tasks/new.astro`؛ `permission-bound` (`required`)؛ مالك/مكلّف/مشرف. **الهدف/الدورة:** إدارة مهمة تشغيلية؛ إنشاء ثم تعيين وتفعيل وتحديث حالة.
- **المصدر والبيانات:** قراءة عبر shared/use case أو صفحة ثابتة. كيانات مرجعية مرشحة: `qc.tasks`. الحالة النصية المستخرجة: UNSPECIFIED, POST.
- **أثر مصدر قابل للتتبع:** مفاتيح صلاحية مذكورة في الصفحة `PERM-TASK-CREATE` L16؛ استدعاء واجهة الإجراء `actions.tasks.createTask` L45، `actions.tasks.createTask` L78. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Save draft, Back to tasks؛ `/tasks`, `/tasks/`.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** افصل الحقول المصدرية عن المشتقة؛ وفّر اختيارًا/تعبئة مسبقة حيث يوجد سجل موثوق؛ اختبر required/server error/duplicate submit/unsaved.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015.

### RT-TASK-003 — `/tasks/[taskId]`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/tasks/[taskId].astro`؛ `permission-bound` (`required`)؛ مالك/مكلّف/مشرف. **الهدف/الدورة:** إدارة مهمة تشغيلية؛ إنشاء ثم تعيين وتفعيل وتحديث حالة.
- **المصدر والبيانات:** `../../modules/tasks/application/dependencies.js`, `../../modules/identity/application/admin-dependencies.js`. كيانات مرجعية مرشحة: `qc.tasks`. الحالة النصية المستخرجة: DRAFT, OPEN, IN_PROGRESS, ON_HOLD, COMPLETED, ACTIVATE, START, COMPLETE.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../modules/tasks/application/dependencies.js` L3، `../../modules/identity/application/admin-dependencies.js` L4؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-TASK-CREATE` L30، `PERM-TASK-EDIT` L30، `PERM-TASK-BLOCK` L30، `PERM-TASK-COMPLETE` L30، `PERM-TASK-REOPEN` L30؛ استدعاء واجهة الإجراء `actions.tasks.transition` L47؛ يوجد تمرير `expectedVersion` في الصفحة. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Activate, Start, Put on hold, Complete, Resume, Reopen؛ `/tasks`.
- **قوة/مشكلة مرصودة:** حَيًّا على سجل واحد: يظهر Draft ونسخة 1 وزر Activate؛ يظهر UNSPECIFIED للـPriority. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** أظهر الحالة والنسخة والسجل المرتبط والحدث التالي؛ اختبر صلاحيات الأفعال على use case لا على ظهور الزر.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014.

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
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002, QC-PAGE-F-014.

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
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005, QC-PAGE-F-014.

### RT-LAB-005 — `/laboratory/tests/[labTestId]/execute`
- **النوع/المنهج/السبب:** Execution؛ تسلسل تشغيل وعوامل بشرية. إدخال القياس/نتيجة الفحص معرض للنقل الخاطئ وفقد السياق.
- **الملف/الظهور/المستخدم:** `src/pages/laboratory/tests/[labTestId]/execute.astro`؛ `permission-bound` (`required`)؛ فني مختبر/Supervisor/QCM. **الهدف/الدورة:** إنشاء وتنفيذ ومراجعة اختبارات ومسودات تقارير؛ قالب معتمد → عينة/قياس → مراجعة → اعتماد.
- **المصدر والبيانات:** `../../../../modules/laboratory/application/dependencies.js`, `../../../../modules/laboratory/application/lab-presentation.js`. كيانات مرجعية مرشحة: `qc.lab_tests; qc.lab_samples; qc.lab_measurements; qc.laboratory_report_drafts`. الحالة النصية المستخرجة: DRAFT, BOOLEAN, NUMERIC.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../../modules/laboratory/application/dependencies.js` L4، `../../../../modules/laboratory/application/lab-presentation.js` L5؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-LAB-EDIT-DRAFT` L19، `PERM-LAB-SUBMIT` L20؛ استدعاء واجهة الإجراء `actions.laboratory.saveMeasurements` L231، `actions.laboratory.submit` L268؛ يوجد تمرير `expectedVersion` في الصفحة. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Save observations, Submit for review؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** ثبّت سياق العينة/الوحدة/المعيار ومصدره قرب القيمة؛ اختبر إدخالًا خاطئًا واسترداد المسودة دون اختراع criterion.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005, QC-PAGE-F-015.

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
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014.

### RT-EQUIP-001 — `/assets/equipment`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/assets/equipment/index.astro`؛ `permission-bound` (`required`)؛ مالك أصل/فني/مراجع. **الهدف/الدورة:** تأهيل معدات ومعايرة وصيانة؛ معدات → معايرة/صيانة → أهلية استخدام.
- **المصدر والبيانات:** `../../../modules/assets/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.equipment; qc.calibration_records; qc.maintenance_records`. الحالة النصية المستخرجة: DRAFT, ACTIVE, OUT_OF_SERVICE, UNDER_MAINTENANCE, DECOMMISSIONED.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/assets/application/dependencies.js` L7. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Add equipment؛ `/assets/equipment/new`, `/assets/equipment/${item.id`.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014.

### RT-EQUIP-002 — `/assets/equipment/new`
- **النوع/المنهج/السبب:** Form؛ تحليل نموذج ومنع الخطأ. يدخل المستخدم بيانات قد تنشئ سجلًا دائمًا.
- **الملف/الظهور/المستخدم:** `src/pages/assets/equipment/new.astro`؛ `permission-bound` (`conditional`)؛ مالك أصل/فني/مراجع. **الهدف/الدورة:** تأهيل معدات ومعايرة وصيانة؛ معدات → معايرة/صيانة → أهلية استخدام.
- **المصدر والبيانات:** قراءة عبر shared/use case أو صفحة ثابتة. كيانات مرجعية مرشحة: `qc.equipment; qc.calibration_records; qc.maintenance_records`. الحالة النصية المستخرجة: POST.
- **أثر مصدر قابل للتتبع:** مفاتيح صلاحية مذكورة في الصفحة `PERM-EQP-CREATE` L16؛ استدعاء واجهة الإجراء `actions.assets.createEquipment` L45، `actions.assets.createEquipment` L91. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Create draft, Back to equipment؛ `/assets/equipment`.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** افصل الحقول المصدرية عن المشتقة؛ وفّر اختيارًا/تعبئة مسبقة حيث يوجد سجل موثوق؛ اختبر required/server error/duplicate submit/unsaved.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015.

### RT-EQUIP-003 — `/assets/equipment/[equipmentId]`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/assets/equipment/[equipmentId].astro`؛ `permission-bound` (`required`)؛ مالك أصل/فني/مراجع. **الهدف/الدورة:** تأهيل معدات ومعايرة وصيانة؛ معدات → معايرة/صيانة → أهلية استخدام.
- **المصدر والبيانات:** `../../../modules/assets/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.equipment; qc.calibration_records; qc.maintenance_records`. الحالة النصية المستخرجة: لم تُستخرج حالات نصية مباشرة؛ راجع use case.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/assets/application/dependencies.js` L2. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** قراءة/توجيه؛ `/assets`, `/assets/equipment`, `/assets/calibrations/new`, `/assets/calibrations`, `/assets/calibrations/${item.id`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** أظهر الحالة والنسخة والسجل المرتبط والحدث التالي؛ اختبر صلاحيات الأفعال على use case لا على ظهور الزر.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014.

### RT-CAL-001 — `/assets/calibrations`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/assets/calibrations/index.astro`؛ `permission-bound` (`required`)؛ مالك أصل/فني/مراجع. **الهدف/الدورة:** تأهيل معدات ومعايرة وصيانة؛ معدات → معايرة/صيانة → أهلية استخدام.
- **المصدر والبيانات:** `../../../modules/assets/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.equipment; qc.calibration_records; qc.maintenance_records`. الحالة النصية المستخرجة: DRAFT, SCHEDULED, SUBMITTED, APPROVED, CURRENT, DUE, OVERDUE, COMPLETED.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/assets/application/dependencies.js` L7. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Add calibration record؛ `/assets/calibrations/new`, `/assets/calibrations/${record.id`, `/assets/equipment/${record.equipmentId`.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014.

### RT-CAL-002 — `/assets/calibrations/new`
- **النوع/المنهج/السبب:** Form؛ تحليل نموذج ومنع الخطأ. يدخل المستخدم بيانات قد تنشئ سجلًا دائمًا.
- **الملف/الظهور/المستخدم:** `src/pages/assets/calibrations/new.astro`؛ `permission-bound` (`conditional`)؛ مالك أصل/فني/مراجع. **الهدف/الدورة:** تأهيل معدات ومعايرة وصيانة؛ معدات → معايرة/صيانة → أهلية استخدام.
- **المصدر والبيانات:** `../../../modules/assets/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.equipment; qc.calibration_records; qc.maintenance_records`. الحالة النصية المستخرجة: POST.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/assets/application/dependencies.js` L18؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-CAL-CREATE` L20، `PERM-EQP-VIEW` L34؛ استدعاء واجهة الإجراء `actions.assets.createCalibration` L89، `actions.assets.createCalibration` L132. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Create draft, Back to calibrations, Create equipment, Create the equipment first؛ `/assets/equipment/new`.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** افصل الحقول المصدرية عن المشتقة؛ وفّر اختيارًا/تعبئة مسبقة حيث يوجد سجل موثوق؛ اختبر required/server error/duplicate submit/unsaved.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015.

### RT-CAL-003 — `/assets/calibrations/[calibrationId]`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/assets/calibrations/[calibrationId].astro`؛ `permission-bound` (`required`)؛ مالك أصل/فني/مراجع. **الهدف/الدورة:** تأهيل معدات ومعايرة وصيانة؛ معدات → معايرة/صيانة → أهلية استخدام.
- **المصدر والبيانات:** `../../../modules/assets/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.equipment; qc.calibration_records; qc.maintenance_records`. الحالة النصية المستخرجة: DRAFT, SUBMITTED, APPROVED, DUE, OVERDUE.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/assets/application/dependencies.js` L2. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** قراءة/توجيه؛ `/assets`, `/assets/calibrations`, `/assets/equipment/${record.equipmentId`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** أظهر الحالة والنسخة والسجل المرتبط والحدث التالي؛ اختبر صلاحيات الأفعال على use case لا على ظهور الزر.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014.

### RT-MAINT-001 — `/assets/maintenance`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/assets/maintenance/index.astro`؛ `permission-bound` (`required`)؛ مالك أصل/فني/مراجع. **الهدف/الدورة:** تأهيل معدات ومعايرة وصيانة؛ معدات → معايرة/صيانة → أهلية استخدام.
- **المصدر والبيانات:** `../../../modules/assets/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.equipment; qc.calibration_records; qc.maintenance_records`. الحالة النصية المستخرجة: DRAFT, PLANNED, IN_PROGRESS, COMPLETED, CANCELLED, VOID.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/assets/application/dependencies.js` L7. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Add maintenance record؛ `/assets/maintenance/new`, `/assets/maintenance/${record.id`, `/assets/equipment/${record.equipmentId`.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014.

### RT-MAINT-002 — `/assets/maintenance/new`
- **النوع/المنهج/السبب:** Form؛ تحليل نموذج ومنع الخطأ. يدخل المستخدم بيانات قد تنشئ سجلًا دائمًا.
- **الملف/الظهور/المستخدم:** `src/pages/assets/maintenance/new.astro`؛ `permission-bound` (`conditional`)؛ مالك أصل/فني/مراجع. **الهدف/الدورة:** تأهيل معدات ومعايرة وصيانة؛ معدات → معايرة/صيانة → أهلية استخدام.
- **المصدر والبيانات:** `../../../modules/assets/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.equipment; qc.calibration_records; qc.maintenance_records`. الحالة النصية المستخرجة: POST.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/assets/application/dependencies.js` L18؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-MNT-CREATE` L20، `PERM-EQP-VIEW` L34؛ استدعاء واجهة الإجراء `actions.assets.createMaintenance` L88، `actions.assets.createMaintenance` L129. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Create draft, Back to maintenance, Create equipment, Create the equipment first؛ `/assets/equipment/new`.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** افصل الحقول المصدرية عن المشتقة؛ وفّر اختيارًا/تعبئة مسبقة حيث يوجد سجل موثوق؛ اختبر required/server error/duplicate submit/unsaved.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015.

### RT-MAINT-003 — `/assets/maintenance/[maintenanceId]`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/assets/maintenance/[maintenanceId].astro`؛ `permission-bound` (`required`)؛ مالك أصل/فني/مراجع. **الهدف/الدورة:** تأهيل معدات ومعايرة وصيانة؛ معدات → معايرة/صيانة → أهلية استخدام.
- **المصدر والبيانات:** `../../../modules/assets/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.equipment; qc.calibration_records; qc.maintenance_records`. الحالة النصية المستخرجة: لم تُستخرج حالات نصية مباشرة؛ راجع use case.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/assets/application/dependencies.js` L2. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** قراءة/توجيه؛ `/assets`, `/assets/maintenance`, `/assets/equipment/${record.equipmentId`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** أظهر الحالة والنسخة والسجل المرتبط والحدث التالي؛ اختبر صلاحيات الأفعال على use case لا على ظهور الزر.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014.

### RT-DOC-001 — `/documents`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/documents/index.astro`؛ `permission-bound` (`required`)؛ مالك مستند/مراجع/QCM. **الهدف/الدورة:** هوية مستند ونسخة ومراجعة؛ إنشاء → نسخة → مراجعة → فعالية.
- **المصدر والبيانات:** `../../modules/documents/application/dependencies.js`, `../../modules/identity/application/admin-dependencies.js`. كيانات مرجعية مرشحة: `qc.document_identities; qc.document_versions`. الحالة النصية المستخرجة: لم تُستخرج حالات نصية مباشرة؛ راجع use case.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../modules/documents/application/dependencies.js` L4، `../../modules/identity/application/admin-dependencies.js` L5؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-DOC-CREATE` L13. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Filter, Create document, Create a document identity؛ `/documents/new`, `/documents/${document.id`.
- **قوة/مشكلة مرصودة:** حَيًّا: لا مستندات في النطاق؛ إنشاء الهوية متاح كمسار مستقل. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014.

### RT-DOC-002 — `/documents/new`
- **النوع/المنهج/السبب:** Form؛ تحليل نموذج ومنع الخطأ. يدخل المستخدم بيانات قد تنشئ سجلًا دائمًا.
- **الملف/الظهور/المستخدم:** `src/pages/documents/new.astro`؛ `permission-bound` (`required`)؛ مالك مستند/مراجع/QCM. **الهدف/الدورة:** هوية مستند ونسخة ومراجعة؛ إنشاء → نسخة → مراجعة → فعالية.
- **المصدر والبيانات:** `../../modules/documents/application/document-vocabulary.js`. كيانات مرجعية مرشحة: `qc.document_identities; qc.document_versions`. الحالة النصية المستخرجة: POST.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../modules/documents/application/document-vocabulary.js` L13؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-DOC-CREATE` L17؛ استدعاء واجهة الإجراء `actions.documents.create` L45، `actions.documents.create` L85. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Create document, Back to library؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** افصل الحقول المصدرية عن المشتقة؛ وفّر اختيارًا/تعبئة مسبقة حيث يوجد سجل موثوق؛ اختبر required/server error/duplicate submit/unsaved.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015.

### RT-DOC-003 — `/documents/[documentId]`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/documents/[documentId]/index.astro`؛ `permission-bound` (`required`)؛ مالك مستند/مراجع/QCM. **الهدف/الدورة:** هوية مستند ونسخة ومراجعة؛ إنشاء → نسخة → مراجعة → فعالية.
- **المصدر والبيانات:** `../../../modules/documents/application/dependencies.js`, `../../../modules/identity/application/admin-dependencies.js`. كيانات مرجعية مرشحة: `qc.document_identities; qc.document_versions`. الحالة النصية المستخرجة: EFFECTIVE, IN_REVIEW, REVIEW, APPROVED, SUPERSEDED, VOID, DRAFT.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/documents/application/dependencies.js` L4، `../../../modules/identity/application/admin-dependencies.js` L6؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-DOC-CREATE` L26، `PERM-DOC-REVISE` L26. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Create revision؛ `/documents`, `/documents/${document.id`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** أظهر الحالة والنسخة والسجل المرتبط والحدث التالي؛ اختبر صلاحيات الأفعال على use case لا على ظهور الزر.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014.

### RT-DOC-004 — `/documents/[documentId]/versions/new`
- **النوع/المنهج/السبب:** Form؛ تحليل نموذج ومنع الخطأ. يدخل المستخدم بيانات قد تنشئ سجلًا دائمًا.
- **الملف/الظهور/المستخدم:** `src/pages/documents/[documentId]/versions/new.astro`؛ `permission-bound` (`required`)؛ مالك مستند/مراجع/QCM. **الهدف/الدورة:** هوية مستند ونسخة ومراجعة؛ إنشاء → نسخة → مراجعة → فعالية.
- **المصدر والبيانات:** `../../../../modules/documents/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.document_identities; qc.document_versions`. الحالة النصية المستخرجة: POST.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../../modules/documents/application/dependencies.js` L3؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-DOC-CREATE` L9، `PERM-DOC-REVISE` L9؛ استدعاء واجهة الإجراء `actions.documents.createVersion` L19، `actions.documents.createVersion` L46. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Create draft version, Back to document؛ `/documents/${document.id`, `/documents/${form.dataset.documentId`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** افصل الحقول المصدرية عن المشتقة؛ وفّر اختيارًا/تعبئة مسبقة حيث يوجد سجل موثوق؛ اختبر required/server error/duplicate submit/unsaved.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015.

### RT-DOC-005 — `/documents/[documentId]/versions/[versionId]`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/documents/[documentId]/versions/[versionId]/index.astro`؛ `permission-bound` (`required`)؛ مالك مستند/مراجع/QCM. **الهدف/الدورة:** هوية مستند ونسخة ومراجعة؛ إنشاء → نسخة → مراجعة → فعالية.
- **المصدر والبيانات:** `../../../../../modules/documents/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.document_identities; qc.document_versions`. الحالة النصية المستخرجة: DRAFT, IN_REVIEW, APPROVED, EFFECTIVE, REVIEW, SUPERSEDED, VOID.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../../../modules/documents/application/dependencies.js` L5؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-DOC-EDIT-DRAFT` L12، `PERM-DOC-SUBMIT` L13، `PERM-DOC-REVIEW` L14؛ استدعاء واجهة الإجراء `actions.documents.submit` L25؛ يوجد تمرير `expectedVersion` في الصفحة. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Submit for review, Open review workspace؛ `/documents`, `/documents/${document.id`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** أظهر الحالة والنسخة والسجل المرتبط والحدث التالي؛ اختبر صلاحيات الأفعال على use case لا على ظهور الزر.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014.

### RT-DOC-006 — `/documents/[documentId]/versions/[versionId]/review`
- **النوع/المنهج/السبب:** Review؛ هندسة قرار وصلاحية. المراجع يحتاج أدلة وسياقًا قبل انتقال الحالة.
- **الملف/الظهور/المستخدم:** `src/pages/documents/[documentId]/versions/[versionId]/review.astro`؛ `permission-bound` (`required`)؛ مالك مستند/مراجع/QCM. **الهدف/الدورة:** هوية مستند ونسخة ومراجعة؛ إنشاء → نسخة → مراجعة → فعالية.
- **المصدر والبيانات:** `../../../../../modules/documents/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.document_identities; qc.document_versions`. الحالة النصية المستخرجة: EFFECTIVE, IN_REVIEW.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../../../modules/documents/application/dependencies.js` L4؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-DOC-REVIEW` L11، `PERM-APR-REVIEW` L11، `PERM-DOC-APPROVE` L12، `PERM-APR-APPROVE` L12؛ استدعاء واجهة الإجراء `actions.documents.review` L35، `actions.documents.approve` L37؛ يوجد تمرير `expectedVersion` في الصفحة. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Record review, Approve revision, Back to version؛ `/documents`, `/documents/${document.id`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** اعرض الدليل والنسخة وصاحب القرار قبل التأكيد؛ اختبر SoD والتوقيع والتعارض ومواصلة العمل بعد الرفض.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016.

### RT-APPROVAL-001 — `/approvals`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/approvals/index.astro`؛ `permission-bound` (`required`)؛ المراجع المكلّف. **الهدف/الدورة:** قرار مراجعة مضبوط؛ طابور → سياق/توقيع → قرار.
- **المصدر والبيانات:** `../../modules/approvals/application/dependencies.js`, `../../modules/identity/application/admin-dependencies.js`. كيانات مرجعية مرشحة: `qc.approval_cases; qc.approval_work_items`. الحالة النصية المستخرجة: لم تُستخرج حالات نصية مباشرة؛ راجع use case.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../modules/approvals/application/dependencies.js` L6، `../../modules/identity/application/admin-dependencies.js` L11. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Open review؛ `/approvals/${item.approvalCase.id`.
- **قوة/مشكلة مرصودة:** حَيًّا: طابور 0 ويشرح أن التعيين والنطاق والنسخة تتحكم بالظهور. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014.

### RT-APPROVAL-002 — `/approvals/[approvalId]`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/approvals/[approvalId].astro`؛ `permission-bound` (`required`)؛ المراجع المكلّف. **الهدف/الدورة:** قرار مراجعة مضبوط؛ طابور → سياق/توقيع → قرار.
- **المصدر والبيانات:** `../../modules/approvals/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.approval_cases; qc.approval_work_items`. الحالة النصية المستخرجة: PENDING, IN_PROGRESS, RETURN, REJECT, APPROVE, SUCCESS, CONFLICT_STALE.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../modules/approvals/application/dependencies.js` L9؛ استدعاء واجهة الإجراء `actions.approvals.decide` L79. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Submit controlled decision؛ `/approvals`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** أظهر الحالة والنسخة والسجل المرتبط والحدث التالي؛ اختبر صلاحيات الأفعال على use case لا على ظهور الزر.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014.

### RT-CHANGE-001 — `/change-requests`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/change-requests/index.astro`؛ `permission-bound` (`required`)؛ طالب/مراجع. **الهدف/الدورة:** طلب تغيير مضبوط؛ مسودة → مراجعة → تطبيق منفصل.
- **المصدر والبيانات:** `../../modules/change-requests/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.change_requests; qc.change_application_attempts`. الحالة النصية المستخرجة: DRAFT, SUBMITTED, UNDER_REVIEW, RETURNED, APPROVED, REJECTED, APPLYING, APPLIED.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../modules/change-requests/application/dependencies.js` L5؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-CHG-CREATE` L28. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Filter, New change request؛ `/change-requests/new`, `/change-requests/${changeRequest.id`.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014.

### RT-CHANGE-002 — `/change-requests/new`
- **النوع/المنهج/السبب:** Form؛ تحليل نموذج ومنع الخطأ. يدخل المستخدم بيانات قد تنشئ سجلًا دائمًا.
- **الملف/الظهور/المستخدم:** `src/pages/change-requests/new.astro`؛ `permission-bound` (`required`)؛ طالب/مراجع. **الهدف/الدورة:** طلب تغيير مضبوط؛ مسودة → مراجعة → تطبيق منفصل.
- **المصدر والبيانات:** `../../modules/change-requests/application/dependencies.js`, `../../modules/change-requests/application/document-version-change-fields.js`. كيانات مرجعية مرشحة: `qc.change_requests; qc.change_application_attempts`. الحالة النصية المستخرجة: POST.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../modules/change-requests/application/dependencies.js` L18، `../../modules/change-requests/application/document-version-change-fields.js` L22؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-CHG-CREATE` L26، `PERM-DOC-VIEW` L41؛ استدعاء واجهة الإجراء `actions.changeRequests.createForDocumentVersion` L130، `actions.changeRequests.createForDocumentVersion` L171. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Create draft, Back to register؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** افصل الحقول المصدرية عن المشتقة؛ وفّر اختيارًا/تعبئة مسبقة حيث يوجد سجل موثوق؛ اختبر required/server error/duplicate submit/unsaved.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015.

### RT-CHANGE-003 — `/change-requests/[changeRequestId]`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/change-requests/[changeRequestId]/index.astro`؛ `permission-bound` (`required`)؛ طالب/مراجع. **الهدف/الدورة:** طلب تغيير مضبوط؛ مسودة → مراجعة → تطبيق منفصل.
- **المصدر والبيانات:** `../../../modules/change-requests/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.change_requests; qc.change_application_attempts`. الحالة النصية المستخرجة: SUBMITTED, UNDER_REVIEW, APPROVED, APPLICATION_FAILED, DRAFT, APPLYING, APPLIED.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/change-requests/application/dependencies.js` L5؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-CHG-REVIEW` L18، `PERM-CHG-RETURN` L18، `PERM-CHG-APPROVE` L18، `PERM-CHG-REJECT` L18. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Open review؛ `/change-requests/${changeRequest.id`, `/change-requests`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** أظهر الحالة والنسخة والسجل المرتبط والحدث التالي؛ اختبر صلاحيات الأفعال على use case لا على ظهور الزر.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014.

### RT-CHANGE-004 — `/change-requests/[changeRequestId]/review`
- **النوع/المنهج/السبب:** Review؛ هندسة قرار وصلاحية. المراجع يحتاج أدلة وسياقًا قبل انتقال الحالة.
- **الملف/الظهور/المستخدم:** `src/pages/change-requests/[changeRequestId]/review.astro`؛ `permission-bound` (`required`)؛ طالب/مراجع. **الهدف/الدورة:** طلب تغيير مضبوط؛ مسودة → مراجعة → تطبيق منفصل.
- **المصدر والبيانات:** `../../../modules/change-requests/application/dependencies.js`. كيانات مرجعية مرشحة: `qc.change_requests; qc.change_application_attempts`. الحالة النصية المستخرجة: SUBMITTED, UNDER_REVIEW, SUBMIT, START_REVIEW, RETURN, RESUME, APPROVE, REJECT.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../../modules/change-requests/application/dependencies.js` L3؛ مفاتيح صلاحية مذكورة في الصفحة `PERM-CHG-REVIEW` L15، `PERM-APR-REVIEW` L15، `PERM-CHG-APPROVE` L16، `PERM-APR-APPROVE` L16، `PERM-CHG-RETURN` L17، `PERM-APR-RETURN` L17؛ استدعاء واجهة الإجراء `actions.changeRequests.transition` L44؛ يوجد تمرير `expectedVersion` في الصفحة. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Start review, Return, Reject, Approve change request, Back to record؛ `/change-requests/${changeRequest.id`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** اعرض الدليل والنسخة وصاحب القرار قبل التأكيد؛ اختبر SoD والتوقيع والتعارض ومواصلة العمل بعد الرفض.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016.

### RT-REPORT-001 — `/reports`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/reports/index.astro`؛ `permission-bound` (`required`)؛ مستخدم مصرح. **الهدف/الدورة:** تقرير وتصدير متطابقان؛ فلترة → قراءة → تصدير.
- **المصدر والبيانات:** `../../modules/reporting/application/dependencies.js`. كيانات مرجعية مرشحة: `read model حسب التقرير`. الحالة النصية المستخرجة: VIEW, REPORT, ACTIVE, REPORTING.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../modules/reporting/application/dependencies.js` L4؛ يوجد تمرير `expectedVersion` في الصفحة. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** قراءة/توجيه؛ `/reports/${report.code`.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-011, QC-PAGE-F-014.

### RT-REPORT-002 — `/reports/[reportCode]`
- **النوع/المنهج/السبب:** Detail؛ فهم السجل وتسلسل الحالة. السجل يربط قرار المستخدم بتاريخ وعلاقات وسياق.
- **الملف/الظهور/المستخدم:** `src/pages/reports/[reportCode].astro`؛ `permission-bound` (`required`)؛ مستخدم مصرح. **الهدف/الدورة:** تقرير وتصدير متطابقان؛ فلترة → قراءة → تصدير.
- **المصدر والبيانات:** `../../modules/reporting/application/run-report.js`, `../../modules/reporting/application/dependencies.js`, `../../modules/reporting/application/parse-report-filters.js`. كيانات مرجعية مرشحة: `read model حسب التقرير`. الحالة النصية المستخرجة: RESOURCE_NOT_FOUND, AUTHZ_, VALIDATION_, UNAPPROVED_INFORMATIONAL_COPY.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../../modules/reporting/application/run-report.js` L3، `../../modules/reporting/application/dependencies.js` L4، `../../modules/reporting/application/parse-report-filters.js` L6؛ حالة HTTP صريحة `Astro.response.status = 404` L18، `Astro.response.status = 403` L18. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Back to reports, Export CSV, Export XLSX؛ `/reports`, `/reports/${code`, `/reports/${definition.code`.
- **قوة/مشكلة مرصودة:** المسار والملف ومكوّنات الصفحة موجودة في المصدر؛ السلوك الحي لهذا المسار غير مثبت. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** أظهر الحالة والنسخة والسجل المرتبط والحدث التالي؛ اختبر صلاحيات الأفعال على use case لا على ظهور الزر.
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-011, QC-PAGE-F-014.

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
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-003, QC-PAGE-F-004, QC-PAGE-F-014.

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
- **قوة/مشكلة مرصودة:** حَيًّا: المعالجة الخارجية معطلة وتظهر حدود AI advisory. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** راجع المهمة الأساسية واللغة والاسترداد وإتاحة لوحة المفاتيح، مع عدم توسيع السلطة.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-019.

### RT-SHARED-001 — `/search`
- **النوع/المنهج/السبب:** Utility؛ إيجاد/إرشاد/حدود صلاحية. الصفحة تؤدي مهمة مساعدة لا انتقال QC مباشر.
- **الملف/الظهور/المستخدم:** `src/pages/search.astro`؛ `permission-bound` (`required`)؛ مستخدم نشط. **الهدف/الدورة:** بحث وإشعارات وحساب وتاريخ ومساعدة وAI؛ قراءة أو إجراء مقيد بحسب السطح.
- **المصدر والبيانات:** قراءة عبر shared/use case أو صفحة ثابتة. كيانات مرجعية مرشحة: `حسب المجال`. الحالة النصية المستخرجة: RIS.
- **أثر مصدر قابل للتتبع:** مفاتيح صلاحية مذكورة في الصفحة `PERM-SRCH-USE` L14. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Search؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** راجع المهمة الأساسية واللغة والاسترداد وإتاحة لوحة المفاتيح، مع عدم توسيع السلطة.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016.

### RT-SHARED-002 — `/notifications`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/notifications.astro`؛ `authenticated` (`required`)؛ مستخدم نشط. **الهدف/الدورة:** بحث وإشعارات وحساب وتاريخ ومساعدة وAI؛ قراءة أو إجراء مقيد بحسب السطح.
- **المصدر والبيانات:** قراءة عبر shared/use case أو صفحة ثابتة. كيانات مرجعية مرشحة: `حسب المجال`. الحالة النصية المستخرجة: لم تُستخرج حالات نصية مباشرة؛ راجع use case.
- **أثر مصدر قابل للتتبع:** لا تُظهر الصفحة نفسها استدعاء `astro:actions` أو مفتاح `PERM-*`؛ افحص التوجيه والخادم قبل استنتاج الصلاحية. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** قراءة/توجيه؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014.

### RT-SHARED-003 — `/account`
- **النوع/المنهج/السبب:** Utility؛ إيجاد/إرشاد/حدود صلاحية. الصفحة تؤدي مهمة مساعدة لا انتقال QC مباشر.
- **الملف/الظهور/المستخدم:** `src/pages/account.astro`؛ `authenticated` (`required`)؛ مستخدم نشط. **الهدف/الدورة:** بحث وإشعارات وحساب وتاريخ ومساعدة وAI؛ قراءة أو إجراء مقيد بحسب السطح.
- **المصدر والبيانات:** `../modules/identity/application/get-account.js`, `../modules/identity/application/identity-dependencies.js`. كيانات مرجعية مرشحة: `حسب المجال`. الحالة النصية المستخرجة: لم تُستخرج حالات نصية مباشرة؛ راجع use case.
- **أثر مصدر قابل للتتبع:** اعتمادات التطبيق `../modules/identity/application/get-account.js` L4، `../modules/identity/application/identity-dependencies.js` L5؛ استدعاء واجهة الإجراء `actions.account.changePassword` L54، `actions.logout` L110. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Show, Change password, Sign out؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** فُتحت الصفحة الحية؛ وجود المحتوى/حالة الصفر مثبت، لا اكتمال الدورة. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** راجع المهمة الأساسية واللغة والاسترداد وإتاحة لوحة المفاتيح، مع عدم توسيع السلطة.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016.

### RT-SHARED-004 — `/audit`
- **النوع/المنهج/السبب:** Register؛ إيجاد وفرز ونطاق البيانات. المستخدم يحدد السجل الصحيح ثم ينتقل لإجراء.
- **الملف/الظهور/المستخدم:** `src/pages/audit.astro`؛ `permission-bound` (`required`)؛ مستخدم نشط. **الهدف/الدورة:** بحث وإشعارات وحساب وتاريخ ومساعدة وAI؛ قراءة أو إجراء مقيد بحسب السطح.
- **المصدر والبيانات:** قراءة عبر shared/use case أو صفحة ثابتة. كيانات مرجعية مرشحة: `حسب المجال`. الحالة النصية المستخرجة: AUTHORIZATION.
- **أثر مصدر قابل للتتبع:** لا تُظهر الصفحة نفسها استدعاء `astro:actions` أو مفتاح `PERM-*`؛ افحص التوجيه والخادم قبل استنتاج الصلاحية. هذه إشارات مصدر وليست إثبات نجاح الإجراء.
- **الأفعال/الصفحات المرتبطة:** Apply filters؛ ترابط المسار يُراجع من شاشة المصدر/السجل.
- **قوة/مشكلة مرصودة:** حَيًّا: خمسة أحداث وفلاتر، لكن جدول العرض يظهر نوع الحدث/UUID التقني. غياب fixture وسيناريو دور/حالة يعني أن نجاح القراءة والانتقال والكتابة غير مثبت.
- **التوصية والتصميم:** تحقق من filter/sort/pagination/empty-state مع بيانات ممتلئة متعددة النطاق، ثم افتح سجلًا وخطوة العمل التالية.
- **بطاقة الدليل:** source=PASS؛ live=OBSERVED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014.

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
- **بطاقة الدليل:** source=PASS؛ live=NOT VERIFIED؛ populated/role/PG/AT/performance/UAT=NOT VERIFIED. **تقييم الجودة:** NOT VERIFIED؛ **العوائق/الفحوص المطلوبة:** QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014.

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

## 18. قدرات اكتُشفت
- كود report-templates الجديد يقدم مسودة مؤلفة بنسخة وطباعة مع تحذير أنها ليست نتيجة معتمدة؛ ظهوره الحي لا يثبت صلاحية الكتابة أو migration 0039.
- Dashboard يسمي تغطية كل مصدر وسبب غياب البيانات، ويمنع جمع PASS مع release؛ سجل Tasks الحي يوفر pagination/filter/density.
- نماذج calibration وmaintenance تختار equipment من النطاق بدل إدخال UUID يدوي.

## 19. قدرات ناقصة أو مؤجلة
- مصدر نتيجة inspection وقالب lab معتمدان؛ سياسة NCR creation وCAPA effectiveness/closure؛ read models لطابور مراجعة الوثائق وquality ownership؛ نطاق reject analytics؛ أدلة release ingestion؛ backup/restore policy؛ auth recovery routes المؤجلة؛ UAT وAT وperformance على بيانات ممثلة.

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
| QC-PAGE-F-008 | P1 | Dashboard & work | لوحة حية تسمي NOT_SUPPLIED لهذه المصادر وتمنع عداد رفض global على سطح scope-aware. | طوابير مستندات/جودة وتحليلات رفض غير موردة؛ توفير read models محددة النطاق وقابلة للحفر والتحقق من تطابق العدد. | نفّذ فحصًا على المرشح نفسه مع حالة رفض ونجاح ودليل قابل لإعادة الإنتاج | QC-ADP-07 |
| QC-PAGE-F-009 | P1 | All | معظم الصفحات الحية فارغة؛ dynamic routes بلا fixtures؛ security E2E السابقة 8 PASS/4 FAIL. | اختبارات الدور والحالة والسجل الفعلي غير مكتملة؛ بيئة اختبار معزولة وست شخصيات، فحص GET/POST وحالات الانتقال. | نفّذ فحصًا على المرشح نفسه مع حالة رفض ونجاح ودليل قابل لإعادة الإنتاج | QC-ADP-08 |
| QC-PAGE-F-010 | P1 | All | Mind يسجل browser/AT matrix NOT RUN أو PARTIAL؛ لا تكفي قراءة DOM. | مصفوفة keyboard/AT/responsive لم تُثبت؛ تشغيل فحص 320/390/768/1440 و200% وkeyboard وscreen reader للطرق الحرجة. | نفّذ فحصًا على المرشح نفسه مع حالة رفض ونجاح ودليل قابل لإعادة الإنتاج | QC-ADP-09 |
| QC-PAGE-F-011 | P1 | Reports | السجل السابق يذكر populated PostgreSQL scope/export parity BLOCKED. | تكافؤ التقارير والتصدير على بيانات حقيقية غير مثبت؛ مطابقة query/filter/scope/count/export على fixture متعدد النطاق. | نفّذ فحصًا على المرشح نفسه مع حالة رفض ونجاح ودليل قابل لإعادة الإنتاج | QC-ADP-10 |
| QC-PAGE-F-012 | P1 | System & recovery | advisory نتيجة NOT VERIFIED؛ أربع تراخيص UNKNOWN؛ provider host allowlist OPEN. | عقد الأمن وسلسلة التوريد بحاجة دليل نهائي؛ حسم التراخيص والallowlist وإعادة security E2E وadvisory على المرشح. | نفّذ فحصًا على المرشح نفسه مع حالة رفض ونجاح ودليل قابل لإعادة الإنتاج | QC-ADP-11 |
| QC-PAGE-F-013 | P1 | All | Mind وUAT plan: ست شخصيات بشرية غير مثبتة، ونطاق توقيع الدورة مفتوح. | UAT البشرية غير منفذة؛ تنفيذ UAT موثق بمشاركين حقيقيين وصلاحية توقيع معتمدة. | نفّذ فحصًا على المرشح نفسه مع حالة رفض ونجاح ودليل قابل لإعادة الإنتاج | QC-ADP-12 |
| QC-PAGE-F-014 | P2 | Registers | لقطات حية تعرض UNSPECIFIED وVOID ورموزًا داخلية؛ و`/404` يضع نص Go to dashboard فوق رابط login للزائر؛ بعض حالات الصفر لا تعطي فعلًا بحسب الصلاحية. | جودة النصوص وحالات الصفر تحتاج مصالحة؛ تدقيق كل النصوص في الحالات populated/empty/error وتوحيد المصطلحات المضبوطة. | نفّذ فحصًا على المرشح نفسه مع حالة رفض ونجاح ودليل قابل لإعادة الإنتاج | QC-ADP-13 |
| QC-PAGE-F-015 | P2 | Forms | نماذج الاستلام/المختبر تتطلب بيانات سياق؛ بعض نماذج الأصول تستخدم اختيار equipment بالفعل. | إعادة الإدخال بين السجلات تحتاج قياسًا وتخفيضًا؛ تتبع الحقول المصدرية واستبدال المكرر بlookup/pre-fill مع سجل المصدر. | نفّذ فحصًا على المرشح نفسه مع حالة رفض ونجاح ودليل قابل لإعادة الإنتاج | QC-ADP-14 |
| QC-PAGE-F-016 | P2 | All | الصفحات الحية فقيرة البيانات؛ لا أدلة query/N+1/Web Vitals لهذه الجولة. | الأداء تحت بيانات ممثلة غير مقاس؛ قياس قبل/بعد لصفحات السجل واللوحات وإصلاح الاختناقات المثبتة. | نفّذ فحصًا على المرشح نفسه مع حالة رفض ونجاح ودليل قابل لإعادة الإنتاج | QC-ADP-15 |
| QC-PAGE-F-017 | P2 | Routing | routes.ts: 88 registered/86 physical؛ 404 و500 فعليتان خارج registry. | صفحتا استعادة معلنتان deferred وصفحتا خطأ خارج التسجيل؛ حسم نطاق recovery وتحديث route matrix والتغطية المعمارية. | نفّذ فحصًا على المرشح نفسه مع حالة رفض ونجاح ودليل قابل لإعادة الإنتاج | QC-ADP-16 |
| QC-PAGE-F-018 | P2 | Administration | الحساب الحي يعرض دورين ونطاق GLOBAL؛ العرض لا يثبت فحوص self-grant/SoD على POST. | السطوح الإدارية تحتاج اختبارات إجراء عالي الأثر؛ اختبار الدور والإبطال والنطاق والنسخة على API مع تدقيق. | نفّذ فحصًا على المرشح نفسه مع حالة رفض ونجاح ودليل قابل لإعادة الإنتاج | QC-ADP-08 |
| QC-PAGE-F-019 | P2 | AI Advisory | المزود معطل بلا policy artifact؛ eval محلي synthetic فقط. | سلوك مزود AI الحي غير مثبت؛ اعتماد policy ومعالجة البيانات قبل أي مزود ثم تقييم حي محدود. | نفّذ فحصًا على المرشح نفسه مع حالة رفض ونجاح ودليل قابل لإعادة الإنتاج | QC-ADP-11 |

## 23. معيار الإغلاق
لا تُعلن جودة كاملة بالتصميم أو مرور build وحده. لكل صفحة يلزم: مصدر سياسة معتمد، وظيفة وتخزين حقيقي، رفض خادمي، قياس populated/empty/error، keyboard/AT، أداء عند اللزوم، E2E على أدوار وحالات، UAT، وprod parity. لكل مسار deferred يلزم قرار منتج: تنفيذ أو إزالة العقد المعتمد بموافقة؛ ولا يُعد stub إثبات وظيفة.

## 24. خطة معالجة مرتبة
1. **P0:** حسم مصادر QC/السياسات، إكمال schema بأثر إنتاج مصرح، إثبات release identity/gates وrestore. لا production migration قبل بوابة الأسرار وموافقة نشر مستقلة.
2. **P1:** بيانات fixtures ممثلة + PG18 + E2E أدوار وحالات + UAT؛ مختبر/QMS/reports/security/accessibility.
3. **P2:** النصوص/النماذج/الأداء المقاس والمسارات المؤجلة والتصميم المشترك. عالج root cause واحدًا في component/use case مشتركة.

## 25. تتبع حزمة البرومبتات
| Page | Findings | Evidence required | Prompt IDs | Acceptance/evidence |
|---|---|---|---|---|
| `/` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/login` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/auth/recovery` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-017 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-16 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/auth/reset/[requestId]` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-017 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-16 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/dashboard` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-008, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-07, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/work` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-008, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-07, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/tasks` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/tasks/new` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-14 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/tasks/[taskId]` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/quality` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-06, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/quality/findings` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-06, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/quality/findings/new` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-015 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-06, QC-ADP-14 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/quality/findings/[findingId]` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-06, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/quality/ncr` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-06, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/quality/ncr/new` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-015 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-06, QC-ADP-14 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/quality/ncr/[ncrId]` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-06, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/quality/rca` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-06, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/quality/rca/[rcaId]` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-06, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/quality/capa` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-06, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/quality/capa/new` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-015 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-06, QC-ADP-14 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/quality/capa/[capaId]` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-007, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-06, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/quarantine` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-02, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/quarantine/receiving` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-02, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/quarantine/receiving/new` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002, QC-PAGE-F-015 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-02, QC-ADP-14 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/quarantine/receiving/[receivingId]` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-02, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/quarantine/inspections` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-02, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/quarantine/inspections/[inspectionId]` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-02, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/quarantine/inspections/[inspectionId]/execute` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002, QC-PAGE-F-015 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-02, QC-ADP-14 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/quarantine/inspections/[inspectionId]/review` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-02 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/quarantine/admin` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-02, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/laboratory` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-05, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/laboratory/tests` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-05, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/laboratory/tests/new` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005, QC-PAGE-F-015 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-05, QC-ADP-14 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/laboratory/report-templates` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005, QC-PAGE-F-006, QC-PAGE-F-015 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-05, QC-ADP-14 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/laboratory/tests/[labTestId]` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-05, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/laboratory/tests/[labTestId]/execute` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005, QC-PAGE-F-015 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-05, QC-ADP-14 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/laboratory/tests/[labTestId]/review` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-05 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/laboratory/tests/[labTestId]/retests/new` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-005, QC-PAGE-F-015 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-05, QC-ADP-14 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/assets` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/assets/equipment` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/assets/equipment/new` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-14 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/assets/equipment/[equipmentId]` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/assets/calibrations` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/assets/calibrations/new` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-14 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/assets/calibrations/[calibrationId]` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/assets/maintenance` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/assets/maintenance/new` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-14 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/assets/maintenance/[maintenanceId]` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/documents` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/documents/new` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-14 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/documents/[documentId]` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/documents/[documentId]/versions/new` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-14 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/documents/[documentId]/versions/[versionId]` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/documents/[documentId]/versions/[versionId]/review` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/approvals` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/approvals/[approvalId]` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/change-requests` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/change-requests/new` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-015 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-14 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/change-requests/[changeRequestId]` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/change-requests/[changeRequestId]/review` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/reports` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-011, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-10, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/reports/[reportCode]` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-011, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-10, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/admin` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-018, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/admin/users` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-018, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/admin/users/new` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-018, QC-PAGE-F-015 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-14 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/admin/users/[userId]` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-018, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/admin/roles` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-018, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/admin/roles/[roleId]` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-018, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/admin/permissions` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-018, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/admin/scopes` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-018, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/system/health` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-003, QC-PAGE-F-004, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-03, QC-ADP-04, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/system/control-center` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-003, QC-PAGE-F-004, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-03, QC-ADP-04, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/system/backups` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-003, QC-PAGE-F-004, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-03, QC-ADP-04, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/system/backups/[backupId]` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-003, QC-PAGE-F-004, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-03, QC-ADP-04, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/system/backups/[backupId]/restore` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-003, QC-PAGE-F-004 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-03, QC-ADP-04 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/reject-reports` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-001, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-01, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/reject-reports/new` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-001, QC-PAGE-F-015 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-01, QC-ADP-14 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/reject-reports/issue-slips/[reportId]` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-001, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-01, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/reject-reports/daily/[reportId]` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-001, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-01, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/ai-advisory` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-019 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-11 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/search` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/notifications` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/account` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/audit` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/help` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/quarantine/admin/[templateId]` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-002, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-02, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/documents/[documentId]/versions/[versionId]/edit` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/governance/releases/[releaseId]` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-003, QC-PAGE-F-004, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-03, QC-ADP-04, QC-ADP-13 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/404` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-017, QC-PAGE-F-014 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-16 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
| `/500` | QC-PAGE-F-009, QC-PAGE-F-010, QC-PAGE-F-013, QC-PAGE-F-016, QC-PAGE-F-017 | مراجعة الدليل لكل بُعد مرتبط | QC-ADP-08, QC-ADP-09, QC-ADP-12, QC-ADP-15, QC-ADP-16 | عقد الدور/الحالة والبيانات/AT/UAT والإصدار حسب finding |
حساب التتبع: orphan P0=0؛ orphan P1=0؛ صفحة بلا مهمة إغلاق مرتبطة=0؛ prompt بلا finding=0. هذا **ربط خطة** وليس دليل إنجاز.

## 26. الحكم النهائي
**NO-GO / PARTIAL.** لا يوجد مبرر لإعلان اكتمال الصفحة أو النظام مع migration drift وReject Reports محجوب وrelease/restore/UAT/E2E/AT غير مثبتة. النطاق الحي الذي تمت مشاهدته يؤكد بعض التقدم في الوضوح، ولا يثبت الدورات المقفلة.

## 27. ملحق الأدلة
- Source: `src/shared/routing/routes.ts`، `src/pages/**` (88 ملفًا)، `src/ui/navigation/navigation.ts`، `Documents/ROUTE-MATRIX.md`، `Documents/STATE-MACHINES.md`، `Documents/ROLE-MATRIX.md`، `Documents/DATA-MODEL.md`، migrations حتى 0039، `.agents/mind/01-mind-latest.md`.
- فرق `src/pages/**` و`src/shared/routing/routes.ts` بين HEAD المشاهدة الأصلي `7c0856262ee789a3e43495b4091de033c7cf1846` وHEAD إعادة الفحص `72626aced7aa436010766a64b04b9ded392ba824`: فارغ. تم التحقق من وجود 88 ملف صفحة فعلي وصحة حدود أسطر إشارات المصدر في البطاقات؛ لا يثبت ذلك سلوك use case أو قاعدة البيانات.
- Live read-only 2026-09-24 حوالى 09:37–09:40 Asia/Riyadh: `/dashboard`, `/system/health`, `/reject-reports`, `/laboratory/tests/new`, `/laboratory/report-templates`, `/system/backups`, `/quality/ncr`, `/quality/capa`, `/tasks` وسجل مهمة واحد، وسائر الوجهات المدرجة في set الجولة. لا URL سري ولا كلمة مرور في الأثر.
- Verification: مقارنة inventory آلية 88 registered/86 physical/2 deferred + 2 error files؛ لا تشغيل PostgreSQL أو Playwright role matrix أو load/AT/UAT في هذه الجولة. Node الحالي `v22.22.3` خارج العقد `>=24.20.0 <25`؛ لهذا لم تُستخدم نتائج بناء جديدة كدليل. فحص بنية HTML وعدد البطاقات وJavaScript syntax وPrettier PASS؛ العرض المرئي والتفاعل مع زر النسخ **NOT VERIFIED** لأن سياسة المتصفح منعت فتح الملف المحلي، وربط خادم localhost مُنع بصلاحية البيئة. لم يُستخدم مسار التفاف.
