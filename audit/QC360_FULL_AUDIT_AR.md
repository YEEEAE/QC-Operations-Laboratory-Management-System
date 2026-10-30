# QC Universe 360 — تقرير تدقيق GitHub المستقل

**التاريخ:** 2026-10-30 (Asia/Riyadh) · **المستودع:** [YEEEAE/QC-Operations-Laboratory-Management-System](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/tree/ae2f9f51cbda67e85017aa1038dba8d948ef1804) · **Git SHA:** `ae2f9f51cbda67e85017aa1038dba8d948ef1804`

## الملخص التنفيذي

- **اكتمال التنفيذ المدعوم بالأدلة:** **63.3%** (المدى المحافظ إلى 72.8%)؛ تغطية الأدلة 90.5%. هذا **مؤشر إثبات كود ومصادر** وليس نسبة نجاح التشغيل الفعلي.
- **إنجاز حزمة البرومبتات الـ51:** **36.3%** كحد أدنى، حتى 53.9% عند احتساب الحالات غير المتحققة كاحتمال أعلى؛ 9 حالة غير متحققة. تم ترجيح PARTIAL=0.5 لا اعتمادها كاملة.
- **Neon المطبق فعليًا:** **NOT VERIFIED / 0080 source**. آخر تقرير قراءة إنتاج مؤرخ 28 أكتوبر أشار إلى 0045، لكنه ليس قراءة اليوم.
- **مصادر المستندات:** 207 مصدرًا فريدًا في Manifest و179 ملفًا موجودًا بمسار المستودع، و28 غير متاح؛ 194 كتالوج F-823-T، و13 نموذجًا رقميا مرشحًا فقط. **عدد ملفات Neon المخزنة حاليًا: UNKNOWN**.
- **جاهزية التجربة:** **NO-GO / NOT PROVEN**: 1 بوابة فشل، و3 محجوبة، و3 غير متحققة.
- **GitHub CI:** [Verification failed](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/actions/runs/40988851859)؛ [Pages/Jekyll failed](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/actions/runs/40988851374).

> **حدود التدقيق:** تمت مراجعة GitHub على SHA المحدد ونتائج CI السابقة. لم أستخدم حساب Neon ولا نسخة النظام المنشورة، ولم أشغّل اختبارات أو Build أو Lint أو Screenshots أو أي كتابة. درجات `UNKNOWN` لم تحوّل إلى فشل.

## طريقة حساب النسب

الأوزان [F1=30%, F2=25%, F3=20%, F4=15%, F5=10%]. COMPLETE=1، PARTIAL=0.5، BLOCKED/ABSENT=0، UNKNOWN=null. الحد الأدنى يحسب فقط المكتمل أو الجزئي المثبت، والحد الأعلى يحتسب المجهول كاملًا. النسب تقدير تغطية الدليل على مصدر نظام، وليست حكمًا نهائيًا على وظائف الإنتاج.

## مصفوفة المجالات الـ18

| ID | المجال | الوزن | الأدنى % | الأعلى % | تغطية الأدلة % | ثقة |
|---|---|---:|---:|---:|---:|---|
| D01 | الهوية والجلسات والصلاحيات والنطاقات | 7 | 70.0 | 80.0 | 90.0 | MEDIUM |
| D02 | البيانات المرجعية والموردون والأصناف | 6 | 60.0 | 70.0 | 90.0 | MEDIUM |
| D03 | الاستلام والحجر والـHOLD والإفراج | 7 | 70.0 | 80.0 | 90.0 | MEDIUM |
| D04 | فحص الوارد والقوالب وF-823-T | 7 | 55.0 | 65.0 | 90.0 | MEDIUM |
| D05 | In-Process وخطوط الإنتاج والورديات | 7 | 57.5 | 67.5 | 90.0 | MEDIUM |
| D06 | المختبر والقياسات والاعتمادات وإعادة الفحص | 6 | 70.0 | 80.0 | 90.0 | MEDIUM |
| D07 | Findings وNCR وRCA وCAPA | 6 | 70.0 | 80.0 | 90.0 | MEDIUM |
| D08 | Reject وFocus والنسب والتصعيد | 6 | 70.0 | 80.0 | 90.0 | MEDIUM |
| D09 | Controlled Documents وWI/SOP/TF/ISO | 7 | 70.0 | 80.0 | 90.0 | MEDIUM |
| D10 | بايتات الملفات والاستيراد والتتبّع | 6 | 60.0 | 70.0 | 90.0 | MEDIUM |
| D11 | الأجهزة والمعايرة والصيانة | 3 | 70.0 | 80.0 | 90.0 | MEDIUM |
| D12 | الموافقات والتواقيع وسياسة القرارات | 5 | 70.0 | 80.0 | 90.0 | MEDIUM |
| D13 | التتبع العرضي والـAudit Trail | 5 | 55.0 | 65.0 | 90.0 | LOW |
| D14 | الداشبورد والتقارير والتحليلات | 4 | 70.0 | 80.0 | 90.0 | MEDIUM |
| D15 | المهام وتسليم الورديات والإشعارات | 3 | 70.0 | 80.0 | 90.0 | MEDIUM |
| D16 | PostgreSQL/Neon والترحيلات | 6 | 60.0 | 70.0 | 90.0 | MEDIUM |
| D17 | الأمن والمرونة التشغيلية | 4 | 60.0 | 70.0 | 90.0 | LOW |
| D18 | CI والنشر والعزل والاستعادة وجاهزية الشركة | 5 | 32.5 | 32.5 | 100.0 | LOW |

### أدلة كل مجال وتقييم الأسطح

**D01 — الهوية والجلسات والصلاحيات والنطاقات**: بنية تسجيل دخول وإدارة جلسات وRBAC ونطاقات ماثلة؛ لا توجد أدلة تشغيلية على صلاحيات موظفي الشركة الفعلية.  
الحالات: `F1_source=COMPLETE, F2_workflow=PARTIAL, F3_database_source=COMPLETE, F4_authorization_audit=PARTIAL, F5_runtime=UNKNOWN`. أدلة: [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/identity/application/login.ts#L10-L30), [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/administration/application/manage-user-scopes.ts#L12-L42).

**D02 — البيانات المرجعية والموردون والأصناف**: الاستيراد والمراجعة وسجلات الموافقات مُمثلة بالمصدر؛ بيانات Item Codes والاعتمادات الفعلية غير مثبتة.  
الحالات: `F1_source=COMPLETE, F2_workflow=PARTIAL, F3_database_source=PARTIAL, F4_authorization_audit=PARTIAL, F5_runtime=UNKNOWN`. أدلة: [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/administration/application/master-data.ts#L18-L112), [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/migrations/0052_master_data_intake_approval.sql#L1).

**D03 — الاستلام والحجر والـHOLD والإفراج**: تدفقات استلام وتقارير اعتماد موجودة؛ لا دليل على ربط تشغيل فعلي بالمستودع وتصرفات الإفراج.  
الحالات: `F1_source=COMPLETE, F2_workflow=PARTIAL, F3_database_source=COMPLETE, F4_authorization_audit=PARTIAL, F5_runtime=UNKNOWN`. أدلة: [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/quarantine/receiving/application/create-receiving.ts#L20-L50), [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/quarantine/inspection/application/final-approve-inspection.ts#L32-L100).

**D04 — فحص الوارد والقوالب وF-823-T**: كتالوج 194 نموذجًا و13 نموذجًا مُرقمنًا في المصدر؛ المصدر الأصلي والمطابقة والاعتماد غير مكتملين.  
الحالات: `F1_source=PARTIAL, F2_workflow=PARTIAL, F3_database_source=COMPLETE, F4_authorization_audit=PARTIAL, F5_runtime=UNKNOWN`. أدلة: [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/quarantine/inspection/application/resolve-inspection-template.ts#L29-L106), [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/quarantine/catalog/master-rev14.json).

**D05 — In-Process وخطوط الإنتاج والورديات**: مسارات وسجلات In-Process موجودة لكن migration 0077 يمنح قراءة فقط افتراضيًا؛ طلبات الكتابة غير مُفعّلة دون مصفوفة معتمدة.  
الحالات: `F1_source=COMPLETE, F2_workflow=BLOCKED, F3_database_source=COMPLETE, F4_authorization_audit=PARTIAL, F5_runtime=UNKNOWN`. أدلة: [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/migrations/0077_in_process_controls.sql#L15-L46), [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/pages/in-process/index.astro#L27-L85).

**D06 — المختبر والقياسات والاعتمادات وإعادة الفحص**: أعمال المعمل وإعادة الفحص والاعتماد ماثلة، لكنها تعتمد على مصادر Method وQualification معتمدة وغير مُثبتة في البيئة الفعلية.  
الحالات: `F1_source=COMPLETE, F2_workflow=PARTIAL, F3_database_source=COMPLETE, F4_authorization_audit=PARTIAL, F5_runtime=UNKNOWN`. أدلة: [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/laboratory/application/create-retest.ts#L53-L90), [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/laboratory/application/final-approve-lab-test.ts#L35-L90).

**D07 — Findings وNCR وRCA وCAPA**: منطق انتقالات وموافقة وإغلاق CAPA موجود؛ اكتمال سلسلة الأدلة والبيانات الواقعية غير مثبت.  
الحالات: `F1_source=COMPLETE, F2_workflow=PARTIAL, F3_database_source=COMPLETE, F4_authorization_audit=PARTIAL, F5_runtime=UNKNOWN`. أدلة: [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/quality/ncr/application/transition-ncr.ts#L24-L50), [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/quality/capa/application/close-capa.ts#L38-L104).

**D08 — Reject وFocus والنسب والتصعيد**: إدخال Focus والتوفيق وسجل الرفض والموافقات موجود، لكن تطبيق حدود المصنع وأدلة الإدخال اليومي غير متحقق.  
الحالات: `F1_source=COMPLETE, F2_workflow=PARTIAL, F3_database_source=COMPLETE, F4_authorization_audit=PARTIAL, F5_runtime=UNKNOWN`. أدلة: [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/reject-reports/application/focus-compliance.ts#L90-L165), [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/reject-reports/application/transition-daily-reject-review.ts#L25-L54).

**D09 — Controlled Documents وWI/SOP/TF/ISO**: مراجعة وإصدارات وتفعيل موثق موجود؛ موافقات غير المالك موقوفة بانتظار سياسة موثقة.  
الحالات: `F1_source=COMPLETE, F2_workflow=PARTIAL, F3_database_source=COMPLETE, F4_authorization_audit=PARTIAL, F5_runtime=UNKNOWN`. أدلة: [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/documents/application/approve-version.ts#L13-L42), [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/documents/application/request-effectivity-decision.ts#L36-L80).

**D10 — بايتات الملفات والاستيراد والتتبّع**: توجد أداة apply وحفظ BYTEA والتحقق من التجزئة؛ لا دليل على استيراد مستمر فعلي في Neon الحالي.  
الحالات: `F1_source=COMPLETE, F2_workflow=PARTIAL, F3_database_source=PARTIAL, F4_authorization_audit=PARTIAL, F5_runtime=UNKNOWN`. أدلة: [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/scripts/qc-library/import-sources.ts#L1-L80), [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/shared/files/postgres-bytea-object-store.ts#L26-L100).

**D11 — الأجهزة والمعايرة والصيانة**: السجلات وحواجز صلاحية المصدر والمعايرة موجودة؛ اعتماد أصول المصنع غير مثبت.  
الحالات: `F1_source=COMPLETE, F2_workflow=PARTIAL, F3_database_source=COMPLETE, F4_authorization_audit=PARTIAL, F5_runtime=UNKNOWN`. أدلة: [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/assets/equipment/application/get-equipment-eligibility.ts#L120-L135), [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/migrations/0067_equipment_source_eligibility_requests.sql#L1).

**D12 — الموافقات والتواقيع وسياسة القرارات**: نمط صلاحيات ومراسم توقيع مدمجة؛ اكتمال مصفوفة التفويض لكل الحالات ليس ثابتًا.  
الحالات: `F1_source=COMPLETE, F2_workflow=PARTIAL, F3_database_source=COMPLETE, F4_authorization_audit=PARTIAL, F5_runtime=UNKNOWN`. أدلة: [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/approvals/application/decide-approval.ts), [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/quarantine/inspection/application/final-approve-inspection.ts#L32-L95).

**D13 — التتبع العرضي والـAudit Trail**: توجد طبقات تتبع وتدقيق وأدلة إصدارات؛ سلسلة التتبع الموحدة بين كل الوحدات ليست مثبتة طرفًا لطرف.  
الحالات: `F1_source=PARTIAL, F2_workflow=PARTIAL, F3_database_source=COMPLETE, F4_authorization_audit=PARTIAL, F5_runtime=UNKNOWN`. أدلة: [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/quarantine/application/lot-traceability.ts), [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/migrations/0004_audit_outbox_idempotency.sql).

**D14 — الداشبورد والتقارير والتحليلات**: صفحات وتقارير وسياق صلاحيات موجودة؛ صحة المؤشرات من بيانات تشغيل فعلية غير متحققة.  
الحالات: `F1_source=COMPLETE, F2_workflow=PARTIAL, F3_database_source=COMPLETE, F4_authorization_audit=PARTIAL, F5_runtime=UNKNOWN`. أدلة: [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/reporting/application/report-registry.ts#L15-L65), [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/dashboard/application/get-dashboard.ts).

**D15 — المهام وتسليم الورديات والإشعارات**: مهام وربط سجل وإدارة ورديات موجودة؛ استلام وتسليم 3 ورديات وإيصال outbox في Neon غير متحقق.  
الحالات: `F1_source=COMPLETE, F2_workflow=PARTIAL, F3_database_source=COMPLETE, F4_authorization_audit=PARTIAL, F5_runtime=UNKNOWN`. أدلة: [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/tasks/application/record-source.ts#L13-L97), [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/migrations/0079_shift_handovers.sql).

**D16 — PostgreSQL/Neon والترحيلات**: 80 Migration متسلسلة بالمصدر مع واجهات اتصال مباشرة ومجمّعة؛ HEAD المطبق فعليًا غير متحقق حاليًا.  
الحالات: `F1_source=COMPLETE, F2_workflow=PARTIAL, F3_database_source=PARTIAL, F4_authorization_audit=PARTIAL, F5_runtime=UNKNOWN`. أدلة: [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/README.md#L3-L12), [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/migrations/0080_ai_advisory_policy.sql).

**D17 — الأمن والمرونة التشغيلية**: حواجز تفويض وتنزيل ملفات مصدر موجودة؛ مستندات QC الأصلية في مستودع عام تقتضي مراجعة تصنيف وسرية.  
الحالات: `F1_source=COMPLETE, F2_workflow=PARTIAL, F3_database_source=PARTIAL, F4_authorization_audit=PARTIAL, F5_runtime=UNKNOWN`. أدلة: [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/shared/authorization/authorize.ts#L9-L42), [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/pages/documents/source-library/[occurrenceId]/download.ts#L8-L34).

**D18 — CI والنشر والعزل والاستعادة وجاهزية الشركة**: فشل CI وPages على SHA نفسه، واستعادة الإنتاج غير مُنفذة، ونقاط استعادة Neon غير متحققة.  
الحالات: `F1_source=PARTIAL, F2_workflow=BLOCKED, F3_database_source=PARTIAL, F4_authorization_audit=PARTIAL, F5_runtime=BLOCKED`. أدلة: [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/backup-recovery/application/controlled-recovery-runner.ts#L15-L79), [GitHub](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/.github/workflows/ci.yml#L1-L12).

## سلسلة سير العمل من الواجهة للبيانات

| العملية | الحالة | UI | Use Case | PostgreSQL | الفجوة |
|---|---|---|---|---|---|
| Authentication/RBAC | PARTIAL | [UI](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/pages/login.astro) | [Code](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/identity/application/login.ts) | [SQL](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/migrations/0002_identity.sql) | التطبيق الفعلي والصلاحيات الحالية غير متحققة |
| Receiving/Quarantine | PARTIAL | [UI](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/pages/quarantine/receiving/new.astro) | [Code](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/quarantine/receiving/application/create-receiving.ts) | [SQL](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/migrations/0008_quarantine.sql) | لا يوجد دليل ربط مخزني واقعي |
| Inspection/F-823-T | PARTIAL | [UI](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/pages/quarantine/inspections/[inspectionId]/execute.astro) | [Code](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/quarantine/inspection/application/record-inspection-results.ts) | [SQL](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/migrations/0046_inspection_report_catalog.sql) | مصادر القوالب الأصلية/الاعتماد غير كاملة |
| In-Process/F-823-i | BLOCKED | [UI](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/pages/in-process/new.astro) | [Code](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/in-process/application/start-run.ts) | [SQL](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/migrations/0077_in_process_controls.sql) | WRITE grants غير معتمدة |
| Laboratory/Retest | PARTIAL | [UI](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/pages/laboratory/tests/new.astro) | [Code](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/laboratory/application/create-retest.ts) | [SQL](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/migrations/0070_laboratory_retest_requests.sql) | تعتمد على مصدر Method معتمد |
| NCR/CAPA | PARTIAL | [UI](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/pages/quality/capa/new.astro) | [Code](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/quality/capa/application/close-capa.ts) | [SQL](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/migrations/0007_quality.sql) | الإغلاق التشغيلي لا يوجد له إثبات |
| Reject/Focus | PARTIAL | [UI](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/pages/reject-reports/focus.astro) | [Code](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/reject-reports/application/focus-compliance.ts) | [SQL](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/migrations/0076_manual_focus_daily_reconciliation.sql) | إدخال Focus وإثباته الفعلي غير متحقق |
| Documents WI/SOP/TF | PARTIAL | [UI](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/pages/documents/index.astro) | [Code](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/documents/application/approve-version.ts) | [SQL](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/migrations/0011_documents.sql) | اعتمادات غير المالك بحاجة سياسة |
| Source BYTEA | PARTIAL | [UI](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/pages/documents/source-library.astro) | [Code](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/scripts/qc-library/import-sources.ts) | [SQL](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/migrations/0066_qc_source_library_bytea.sql) | لا توجد قراءة من Neon تثبت أن البايتات مستوردة |
| Asset/Calibration | PARTIAL | [UI](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/pages/assets/equipment/index.astro) | [Code](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/assets/equipment/application/get-equipment-eligibility.ts) | [SQL](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/migrations/0010_assets.sql) | أدلة أجهزة المصنع غير متوفرة |
| Tasks/Handover | PARTIAL | [UI](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/pages/tasks/index.astro) | [Code](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/tasks/application/shift-handover.ts) | [SQL](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/migrations/0079_shift_handovers.sql) | لا توجد أدلة تشغيل 3 ورديات |
| Reporting | PARTIAL | [UI](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/pages/reports/index.astro) | [Code](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/reporting/application/run-report.ts) | [SQL](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/migrations/0029_performance_query_indexes.sql) | لا تحقق مباشر من مصادر البيانات |
| AI Advisory | BLOCKED | [UI](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/pages/ai-advisory.astro) | [Code](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/ai-advisory/application/get-advisory.ts) | [SQL](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/migrations/0080_ai_advisory_policy.sql) | المعالجة الخارجية مشروطة بموافقة وسياسة فعلية |
| Backup/Restore | BLOCKED | [UI](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/pages/system/backups/index.astro) | [Code](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/backup-recovery/application/controlled-recovery-runner.ts) | [SQL](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/migrations/0078_recovery_policy_governance.sql) | Recovery runner لا ينفذ الاستعادة |

## جرد المستودع والمصادر

- عدد ملفات GitHub: 6,471. الوحدات الرئيسية 21، وملفات الهجرة 80 من 0001 إلى 0080 بلا تكرار أسماء رقمية.
- تتضمن الترحيلات الجديدة 0066 لحفظ BYTEA و0068 للاستخراج/الـaliases و0077 لسجلات In-Process، و0080 لسياسات AI.
- مسار المكتبة في GitHub يحوي 179 مستندًا مادياً من الفئات المحكومة بالإضافة لملفات metadata؛ المصدر الكامل 207 صفًا مرجعيًا ويعتمد على ملاحظات ترحيل 28 أكتوبر، ولا يدل على 207 سجل Neon.
- الفئات الموثقة: 18 Work Instructions، و28 F-823-i، و123 Draft/Gap، و4 SOP، و2 Technical File، و4 Operational، و25 ISO file entries لم تُنقل بسبب ترخيص/توفر المصادر.
- [Manifest الأصلي](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/Documents/QC_Library_Source_Import/SOURCE_MANIFEST.json) و[المصادر غير المنقولة](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/Documents/QC_Library_Source_Import/NOT_TRANSFERRED.md).
- الفهرس F-823-T يحوي 194 هوية، و13 رقمية، و28 source-evidence records حالتها 16 MATCHED / 3 Revision conflict / 3 Title conflict / 4 Rescan / 2 خارج Master.
- لم يثبت وجود approved/effective source-backed templates أو قياسات byte counts في قاعدة Neon اليوم.

## سجل نتائج التدقيق الأولوية

### QC360-D18-001 — [P1] CI والتحقق على SHA الحالي فاشلان
**المشاهدة:** Verification CI فشل لنفس Git SHA؛ سبب الفشل التفصيلي غير متاح من سجل الوظيفة، فلا يُختلق.
**الأثر:** OPERATIONS؛ إذا بقيت الفجوة قد تعطل أو تقيد العملية ذات الصلة.
**الإجراء:** إصلاح بوابة التحقق ثم توثيق نتائج ناجحة للـHEAD المحدد. — **المالك:** IT/Engineering.
**الأدلة:** [مرجع](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/actions/runs/40988851859), [مرجع](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/.github/workflows/ci.yml#L1-L55).

### QC360-D18-002 — [P1] GitHub Pages يحاول Jekyll بدل نشر Astro SSR
**المشاهدة:** صفحة Pages Build فشلت، وسجلها يشير إلى Jekyll وتحليل YAML لملفات .astro؛ هذا ليس إثبات فشل Astro build الفعلي.
**الأثر:** OPERATIONS؛ إذا بقيت الفجوة قد تعطل أو تقيد العملية ذات الصلة.
**الإجراء:** فصل Pages/Jekyll عن نشر Astro SSR أو تعطيل مسار Pages غير المرغوب بموافقة مالك المستودع. — **المالك:** IT/DevOps.
**الأدلة:** [مرجع](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/actions/runs/40988851374), [مرجع](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/package.json#L10-L17).

### QC360-D18-003 — [P0] لا يوجد دليل حاضر على ترحيل Neon ولا نقطة استعادة
**المشاهدة:** توجد 80 ترحيلة بالمصدر؛ تقرير 28 أكتوبر يسجل إنتاجًا عند 0045 دون snapshot، وهو دليل تاريخي فقط. الرأس الحالي NOT VERIFIED.
**الأثر:** MIGRATION؛ إذا بقيت الفجوة قد تعطل أو تقيد العملية ذات الصلة.
**الإجراء:** تحديد المشروع والفرع والنسخة، والحصول على نقطة استعادة موثقة، ثم فحص قراءة فقط والمطابقة ضمن إجراء تغيير معتمد. — **المالك:** DBA/IT/System Owner.
**الأدلة:** [مرجع](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/README.md#L3-L12), [مرجع](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/audit/QC-DOC-NEON-360/PRODUCTION_IMPORT_RUNBOOK.md#L1-L25).

### QC360-D05-001 — [P0] In-Process محجوب افتراضيًا أمام صلاحيات الكتابة
**المشاهدة:** Migration 0077 لا تمنح إلا VIEW وتصرّح أن WRITE grants مؤجلة لغياب سياسة مصفوفة الصلاحيات.
**الأثر:** POLICY_BLOCKED؛ إذا بقيت الفجوة قد تعطل أو تقيد العملية ذات الصلة.
**الإجراء:** اعتماد مصفوفة المشغل/QC/المشرف حسب القسم والوردية ثم تطبيق grants والتأكد من اختيار WI فعّال. — **المالك:** QC Manager/Production/IT.
**الأدلة:** [مرجع](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/migrations/0077_in_process_controls.sql#L15-L46), [مرجع](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/pages/in-process/index.astro#L27-L86).

### QC360-D17-001 — [P0] مستندات QC الأصلية موجودة في مستودع GitHub عام
**المشاهدة:** المستودع public ويتضمن 179 مستندًا مصدريًا قابلًا للفهرسة، بينها WI ونماذج تشغيل ومراجعات؛ حساسية كل ملف وترخيص نشره غير مثبتين.
**الأثر:** SECURITY؛ إذا بقيت الفجوة قد تعطل أو تقيد العملية ذات الصلة.
**الإجراء:** مراجعة سرية وملكية كل مستند؛ منع إتاحة غير المصرح به ومراجعة التاريخ والمرايا عند الحاجة. لا تفترض أن التحويل إلى private يمحو النسخ السابقة. — **المالك:** IT Security/QA/Legal.
**الأدلة:** [مرجع](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/tree/ae2f9f51cbda67e85017aa1038dba8d948ef1804), [مرجع](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/Documents/QC_Library_Source_Import/README_FIRST.md).

### QC360-D18-004 — [P1] استعادة Production موقوفة ومسار التنفيذ غير مطبق
**المشاهدة:** controlled-recovery-runner يعيد false للإذن الإنتاجي ويحجب التنفيذ ويصرح بعدم وجود تنفيذ استعادة.
**الأثر:** OPERATIONS؛ إذا بقيت الفجوة قد تعطل أو تقيد العملية ذات الصلة.
**الإجراء:** اعتماد إجراءات Recovery وRPO/RTO وإثبات الاستعادة ببيئة منفصلة، لا تعديل إنتاج أثناء التدقيق. — **المالك:** IT/DBA/QA.
**الأدلة:** [مرجع](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/backup-recovery/application/controlled-recovery-runner.ts#L15-L79).

### QC360-D04-001 — [P1] تغطية F-823-T التشغيلية أقل من فهرس Rev14
**المشاهدة:** فهرس المصدر يحوي 194 هوية؛ ملفات digitized-forms.json تحوي 13 مرشحًا. المطابقة/الاعتماد لا يثبتان تلقائيًا.
**الأثر:** SOURCE_MISSING؛ إذا بقيت الفجوة قد تعطل أو تقيد العملية ذات الصلة.
**الإجراء:** تأمين المصادر الأصلية وملء النماذج باحتفاظ بالـrevision، وعدم توليد تقارير قابلة للتنفيذ قبل المطابقة والاعتماد. — **المالك:** QC/QMS Document Control.
**الأدلة:** [مرجع](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/quarantine/catalog/master-rev14.json), [مرجع](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/quarantine/catalog/digitized-forms.json).

### QC360-D04-002 — [P1] تعارضات مصدر Inspection غير محسومة
**المشاهدة:** source-evidence.json يحتوي 16 MATCHED، و3 تعارض Revision، و3 Title، و4 Rescan، وحالتين خارج master؛ نتائج وصفية للمصدر فقط.
**الأثر:** DOCUMENT_CONTROL؛ إذا بقيت الفجوة قد تعطل أو تقيد العملية ذات الصلة.
**الإجراء:** إنشاء قرارات Source Resolution مع سند مالك النظام، وعدم إصدار Form Approval تلقائيًا. — **المالك:** Document Control/QC Manager.
**الأدلة:** [مرجع](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/quarantine/catalog/source-evidence.json), [مرجع](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/migrations/0065_rev14_source_reconciliation.sql).

### QC360-D10-001 — [P1] الاستيراد الحقيقي إلى Neon غير مثبت
**المشاهدة:** يوجد سكربت import --apply وحفظ BYTEA ودعم readback؛ ليس لدينا جلسة قراءة معتمدة لقياس الصفوف أو البايتات المحفوظة.
**الأثر:** INTEGRATION؛ إذا بقيت الفجوة قد تعطل أو تقيد العملية ذات الصلة.
**الإجراء:** فحص الصفوف والـbytes والـdigests والـalias في Staging معتمد قبل إثبات استيراد Production. — **المالك:** DBA/Document Control.
**الأدلة:** [مرجع](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/scripts/qc-library/import-sources.ts#L1-L80), [مرجع](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/shared/files/postgres-bytea-object-store.ts#L26-L130).

### QC360-D10-002 — [P1] ملفات QC المطلوبة ناقصة من الحزمة
**المشاهدة:** SOURCE_MANIFEST.json يوثق 207 فريدة، بينما 179 مصدرًا داخل المسار؛ 28 غير متاحة، بينها 25 ملف معايير بانتظار ترخيص. التاريخ 28 أكتوبر.
**الأثر:** SOURCE_MISSING؛ إذا بقيت الفجوة قد تعطل أو تقيد العملية ذات الصلة.
**الإجراء:** تحديد الملفات الناقصة وحالة حق نشر المعايير، واستخدام metadata للـISO دون توزيع النص المحمي. — **المالك:** Document Control/Legal.
**الأدلة:** [مرجع](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/Documents/QC_Library_Source_Import/SOURCE_MANIFEST.json), [مرجع](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/Documents/QC_Library_Source_Import/NOT_TRANSFERRED.md).

### QC360-D09-001 — [P1] موافقة غير مالك النظام على الوثائق تفتقر لمصفوفة
**المشاهدة:** approve-version.ts يستدعي POLICY_SOURCE_REQUIRED عند مسار غير المالك صراحة، رغم وجود دعم لمسار المالك.
**الأثر:** POLICY_BLOCKED؛ إذا بقيت الفجوة قد تعطل أو تقيد العملية ذات الصلة.
**الإجراء:** اعتماد صلاحيات QC/QA والتوقيع وحدود SoD وتفعيل المسار رسميًا دون تجاوز قواعد مصدر المستند. — **المالك:** QC/QA/System Owner.
**الأدلة:** [مرجع](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/documents/application/approve-version.ts#L18-L28).

### QC360-D06-001 — [P1] الاعتماد المختبري مشروط بمصدر Method فعّال
**المشاهدة:** create-retest وfinal-approve-lab-test يرفضان التنفيذ عند غياب Method Source، وهو سلوك آمن لكنه يعطل التشغيل حتى اعتماد المصادر.
**الأثر:** DOCUMENT_CONTROL؛ إذا بقيت الفجوة قد تعطل أو تقيد العملية ذات الصلة.
**الإجراء:** ربط Methoden وWI المعتمدة وتحديد صلاحية اختبارات ومعايير القرار لكل منتج دون حدود مخترعة. — **المالك:** Lab/QC Manager.
**الأدلة:** [مرجع](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/laboratory/application/create-retest.ts#L53-L88), [مرجع](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/laboratory/application/final-approve-lab-test.ts#L39-L53).

### QC360-D11-001 — [P1] الأجهزة غير المؤهلة تفشل مغلقًا لكن أدلة الاعتماد غير مثبتة
**المشاهدة:** get-equipment-eligibility يرفض مصدر الجهاز غير APPROVED وعدم المعايرة الحالية، ولا توجد قياسات حية للكتالوج.
**الأثر:** DOCUMENT_CONTROL؛ إذا بقيت الفجوة قد تعطل أو تقيد العملية ذات الصلة.
**الإجراء:** اعتماد سجل أجهزة المصنع/المعايرات والأدلة وربطه بعمليات المختبر. — **المالك:** Lab/Metrology.
**الأدلة:** [مرجع](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/assets/equipment/application/get-equipment-eligibility.ts#L120-L135).

### QC360-D17-002 — [P2] سياسة تشغيل AI الخارجي غير مثبتة
**المشاهدة:** صفحة AI تنص على إيقاف المعالجة الخارجية حتى وجود سياسة وحالة موافقة مستقلة.
**الأثر:** POLICY_BLOCKED؛ إذا بقيت الفجوة قد تعطل أو تقيد العملية ذات الصلة.
**الإجراء:** إبقاء AI استشاريًا محصورًا، ثم توثيق سياسة البيانات والمزود والموافقة إذا لزم التشغيل. — **المالك:** IT/QA/Legal.
**الأدلة:** [مرجع](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/pages/ai-advisory.astro#L26-L50), [مرجع](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/migrations/0080_ai_advisory_policy.sql).

### QC360-D15-001 — [P2] تسليم الورديات والـOutbox لا يوجد له دليل تشغيل مطابق
**المشاهدة:** مجلدات الشيفرة وmigration 0079 موجودة، لكن لا توجد سجلات تسليم 3 ورديات أو استلام/فشل مهام خارجية على SHA الحالي.
**الأثر:** OBSERVABILITY؛ إذا بقيت الفجوة قد تعطل أو تقيد العملية ذات الصلة.
**الإجراء:** إرفاق أدلة تشغيل مقيدة النطاق للوردية والعمليات الإشعارية بعد ضمان صلاحيات المصدر. — **المالك:** Production/QC/IT.
**الأدلة:** [مرجع](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/tasks/application/shift-handover.ts), [مرجع](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/migrations/0079_shift_handovers.sql).

### QC360-D18-005 — [P1] لا توجد أدلة UAT وتوقيع تشغيل مرتبطة بهذا SHA
**المشاهدة:** أدلة اختبارات الوحدة القديمة محفوظة لمرشح سابق وليست شهادة قبول لـae2f9f51؛ تشغيل CI الحالي فاشل.
**الأثر:** OPERATIONS؛ إذا بقيت الفجوة قد تعطل أو تقيد العملية ذات الصلة.
**الإجراء:** استكمال Evidence موثق للمرشح الحالي وتوقيعات QC/QA/IT على نسخة Pilot معزولة. — **المالك:** QA/IT/QC.
**الأدلة:** [مرجع](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/audit/launch-readiness/QC-LAUNCH-021/evidence.json), [مرجع](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/actions/runs/40988851859).

## بوابات تجربة الشركة G1–G7

| البوابة | الحالة | السبب |
|---|---|---|
| G1 — تطابق SHA والنشر وCI | FAIL | فشل CI وPages المرتبطين بنفس Git SHA؛ deployed SHA ليس مثبتًا. |
| G2 — Neon والترحيل واستيراد البايتات | NOT VERIFIED | سجل Neon الحالي/backup/byte counts لم يُتحقق منه عبر اتصال مباشر مسموح. |
| G3 — سلسلة QC/In-Process والموافقات | BLOCKED | صلاحيات كتابة In-Process غير ممنوحة افتراضيًا؛ UAT غير مثبت. |
| G4 — حماية الوثائق والأذونات والتراخيص | NOT VERIFIED | مستودع GitHub عام يحوي مصادر QC؛ تصنيف وحق نشر هذه الملفات غير مثبت. |
| G5 — WI/SOP/Templates والبيانات والتدريب | BLOCKED | غياب مصفوفة موافقات غير المالك وقوالب F-823-T غير مكتملة. |
| G6 — Backup/Restore وRPO/RTO | BLOCKED | استعادة الإنتاج محظورة برمجيًا ولا توجد أدلة استعادة فعلية لهذا الـSHA. |
| G7 — اعتماد QC/QA/IT وقرار التجربة | NOT VERIFIED | لم تتوفر سجلات موافقةPilot/Go-Live رسمية مرتبطة بهذه النسخة. |

## قائمة تنفيذ البرومبتات الـ51

| البرومبت | المهمة | الحالة | المصدر |
|---|---|---|---|
| `MASTER-00` | Session setup (once before prompt 01) | NOT_VERIFIABLE | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/README.md) |
| `REL-01` | Repair verification pipeline configuration | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/.github/workflows/ci.yml#L1-L40) |
| `REL-02` | Separate Astro SSR deployment from Jekyll Pages | BLOCKED | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/.github/workflows/ci.yml) |
| `SAFE-01` | Implement isolated staging and pilot configuration | NOT_VERIFIABLE | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/migrations/0050_pilot_shadow_release_scope.sql) |
| `REL-03` | Guarantee pilot decisions cannot release real product | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/migrations/0050_pilot_shadow_release_scope.sql) |
| `DATA-01` | Implement governed Master Data onboarding | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/administration/application/master-data.ts) |
| `DATA-02` | Harden PostgreSQL migrations and schema governance | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/README.md) |
| `NDB-01` | Secure Neon credentials and runtime configuration | NOT_VERIFIABLE | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/.env.example) |
| `NDB-02` | Neon pooled runtime, direct migrations and Kysely integration | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/shared/database/pool.ts) |
| `NDB-03` | Isolate Neon production, staging and pilot branches | NOT_VERIFIABLE | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/audit/NDB-14/neon-staging-setup.md) |
| `NDB-04` | Neon migration runner, checksum ledger and schema drift | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/scripts/db/migrate.ts) |
| `NDB-05` | PostgreSQL data-integrity, foreign keys and query indexes | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/migrations/0054_laboratory_traceability_integrity.sql) |
| `NDB-06` | Neon Auth JWKS and JWT server verification boundary | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/identity/application/manage-external-identity-link.ts) |
| `NDB-07` | Safe identity mapping between Neon Auth and QC users | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/identity/application/manage-external-identity-link.ts) |
| `NDB-08` | Astro API and database action contract hardening | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/actions/quarantine.ts) |
| `NDB-09` | EXPLABS key handling and external API provider adapter | NOT_VERIFIABLE | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/ai-advisory/application/get-advisory.ts) |
| `NDB-10` | Neon data import, revisions and manual template mappings | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/scripts/qc-library/import-sources.ts) |
| `NDB-11` | Database transaction outbox, Focus status and delivery integrity | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/reject-reports/application/focus-compliance.ts) |
| `NDB-12` | Neon backup, point-in-time recovery and QC file traceability | BLOCKED | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/backup-recovery/application/controlled-recovery-runner.ts#L15-L79) |
| `NDB-13` | Neon readiness, observability and operational runbook | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/system-health/application/get-system-health.ts) |
| `SEC-01` | Implement explicit authorization and shift scope matrix | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/migrations/0060_authorization_area_shift_function_scopes.sql) |
| `SEC-02` | Strengthen identity, sessions, credentials and shared terminals | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/identity/application/login.ts) |
| `APP-01` | Unify Owner Controlled Internal Approvals | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/approvals/application/owner-approval-policy.ts) |
| `DOC-01` | Complete controlled WI/SOP approval and effectivity | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/documents/application/approve-version.ts#L18-L28) |
| `DOC-02` | Pin effective document version into execution evidence | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/migrations/0043_controlled_document_source_binding.sql) |
| `TMP-01` | Reconcile Rev14 source conflicts and controlled forms | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/quarantine/catalog/source-evidence.json) |
| `TMP-02` | Manual controlled Item Code to Inspection Template mapping | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/quarantine/inspection/application/resolve-inspection-template.ts) |
| `ASSET-01` | Operational equipment, calibration and maintenance eligibility | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/assets/equipment/application/get-equipment-eligibility.ts) |
| `LAB-02` | Govern scientific methods, thresholds and test interpretation | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/laboratory/application/create-retest.ts) |
| `LAB-01` | Activate evidence-based laboratory retest | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/laboratory/application/create-retest.ts) |
| `QMS-01` | Implement complete controlled CAPA creation | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/quality/capa/application/create-capa.ts) |
| `QMS-02` | Complete Finding → NCR → RCA/CAPA → closure workflow | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/quality/ncr/application/transition-ncr.ts) |
| `REJ-01` | Version rejection denominator and rate formula | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/migrations/0071_reject_percentage_denominators.sql) |
| `REJ-04` | Correct creator-recorded Issue Slip approval semantics | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/reject-reports/application/confirm-issue-slip-approval.ts) |
| `REJ-05` | Production → QC → Supervisor daily reject workflow | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/reject-reports/application/transition-daily-reject-review.ts) |
| `REJ-02` | Controlled reject thresholds and approval escalation | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/reject-reports/application/reject-limit-profiles.ts) |
| `REJ-03` | Implement manual Focus daily entry and reconciliation | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/reject-reports/application/focus-compliance.ts) |
| `QMS-03` | Link Reject Slip, HOLD, Quarantine and disposition | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/reject-reports/application/create-issue-slip.ts) |
| `INP-01` | Build independent In-Process Controls workspace | BLOCKED | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/db/migrations/0077_in_process_controls.sql#L15-L46) |
| `REP-01` | Expand reporting across factory QC modules | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/reporting/application/report-registry.ts) |
| `OPS-02` | Wire Outbox delivery and backup scheduling | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/backup-recovery/application/schedule-backup-recovery.ts) |
| `OPS-01` | Govern RPO, RTO, backup retention and recovery | BLOCKED | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/backup-recovery/application/controlled-recovery-runner.ts#L15-L79) |
| `OPS-03` | Build accountable shift handover | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/tasks/application/shift-handover.ts) |
| `REL-04` | Source-controlled release manifest and Go/No-Go state | BLOCKED | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/.github/workflows/ci.yml) |
| `ANL-01` | Operational reject analytics and Pareto | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/reporting/application/report-registry.ts) |
| `TRC-01` | Unified Lot Traceability 360° | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/quarantine/application/lot-traceability.ts) |
| `INP-02` | Barcode and QR workflow extension | NOT_VERIFIABLE | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/modules/in-process/application/start-run.ts) |
| `SEC-03` | Strengthen advisory AI policy and confidentiality | PARTIAL | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/pages/ai-advisory.astro) |
| `UX-01` | Optional cinematic QC Universe Story Experience | NOT_VERIFIABLE | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/pages/dashboard/index.astro) |
| `USR-01` | Role-guided onboarding and adoption controls | NOT_VERIFIABLE | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/src/pages/help/index.astro) |
| `FINAL-37` | Integrate all edits without testing or deployment | NOT_VERIFIABLE | [المصدر](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/blob/ae2f9f51cbda67e85017aa1038dba8d948ef1804/.github/workflows/ci.yml) |

حزمة البرومبتات `51` كانت متاحة في المستودع والمرفقات؛ لا توجد وثيقة قبول مستقلة لكل مهمة على SHA الحالي. لم تُضم برومبتات NDB-14/QC-DOC-361 إلى مقام 51 بدون مصدر قبول وتحديد نطاق صريح.

## الفجوات والحدود

- فشل CI على SHA الحالي مثبت من GitHub، لكن سجل Verify الكامل غير متاح من هذا الموصل؛ لا تُذكر أسباب مفترضة.
- Pages/Jekyll job فشل بعد تحليل `.astro` بوصفها YAML، ولا يعني وحده فشل Astro SSR.
- `Neon HEAD=0045` و`imported bytes=0` حقائق مؤرخة 28 أكتوبر محفوظة في Runbook، لا يُعاد وصفها كحقائق حية في 30 أكتوبر.
- لا توجد صلاحية في هذا التدقيق لتفحص بيانات المرضى/الشركة، أو نشر ISO، أو اختبار نشر أو موقع، أو تشغيل استعادة.
- الأدلة المستقبلية المطلوبة: Neon SELECT صادر من حساب read-only مصرح به مع هوية الفرع، قائمة source/effective approvals، حالة استعادة مستقلة، CI ناجح مرتبط بـHEAD، موافقات pilot QC/QA/IT.

**NO TESTS, BUILD, LINT, SCREENSHOTS, GIT REPOSITORY WRITES OR PRODUCTION DATABASE WRITES WERE PERFORMED.**