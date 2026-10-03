# مصالحة الصور مع برومبتات QC-POST-100

- جرد الأصول: **84 صورة** من المجلد المحلي؛ HEAD وقت الجرد `435f9f704049dee4916223b24b96866d7fa9af2e`.
- حزمة HTML الأصلية مجمدة عند `b165dd50`، لذلك هذا **ملحق لاحق** ولا يغيّر نسبها أو يمنح PASS.
- `SHA-256` يثبت بايتات الملف المحلي فقط. لا يثبت المنشأ أو اكتمال المستند أو صلاحية الاعتماد.
- لم تُنسخ الصور أو تُنشر أو تُرسل لخدمة خارجية. صور HEIC الثلاثون لم تكن قابلة للفحص البصري الموثوق في هذه البيئة؛ تبقى `NOT READABLE`.
- ربط `OP-*` أدناه ربط **عائلة محتمل** بسجل التقرير التاريخي، وليس قبول صورة بعينها أو قاعدة علمية.

## ربط البرومبتات

| البرومبت | عائلة دليل محتملة | ما يبقى مطلوبًا | الحالة |
|---|---|---|---|
| QC-POST-100-001 | لا يوجد ربط مباشر بالصور | Native POST, negative paths, rollback and no-JS proof needs current candidate runtime. | EVIDENCE_PENDING |
| QC-POST-100-002 | OP-RCV | Receiving form image can inform fields only; correction needs authorized record, previous/new link and audit. | EVIDENCE_PENDING |
| QC-POST-100-003 | لا يوجد ربط مباشر بالصور | Unavailable/denied/empty requires fault-injected read and HTTP evidence. | EVIDENCE_PENDING |
| QC-POST-100-004 | لا يوجد ربط مباشر بالصور | Source contract and test failure evidence required. | EVIDENCE_PENDING |
| QC-POST-100-005 | OP-RCV, OP-INSP, OP-REJ | Photos may inform human labels; paging and authorization need populated DB/HTTP. | EVIDENCE_PENDING |
| QC-POST-100-006 | OP-RCV, OP-INSP, OP-PDEC, OP-SUBA, OP-RAW, OP-LHIST, OP-REJ, OP-DAILY, OP-TRF | Owner-signed decisions and complete controlled scientific sources are absent. | EVIDENCE_PENDING |
| QC-POST-100-009 | لا يوجد ربط مباشر بالصور | Search/notification/dashboard read models require scoped populated data. | EVIDENCE_PENDING |
| QC-POST-100-013 | لا يوجد ربط مباشر بالصور | Login/throttle/session evidence is runtime-specific. | EVIDENCE_PENDING |
| QC-POST-100-017 | OP-RCV, OP-INSP, OP-PDEC, OP-SUBA, OP-RAW, OP-LHIST, OP-REJ, OP-DAILY, OP-TRF, OP-SAMPLE, OP-NOTE | Photos add source context; denominator and applicability approval remains separate. | EVIDENCE_PENDING |
| QC-POST-100-021 | لا يوجد ربط مباشر بالصور | Version-bound document edit needs concurrency/rollback proof. | EVIDENCE_PENDING |
| QC-POST-100-022 | OP-PDEC, OP-SUBA, OP-RAW | Lab images may illustrate values/units; declared type and round-trip need approved template and PostgreSQL. | EVIDENCE_PENDING |
| QC-POST-100-007 | OP-INSP, OP-PDEC, OP-SUBA, OP-RAW, OP-LHIST | Lab/inspection photos may illustrate rows; source revisions, exact values, signatures and workflows need verification. | EVIDENCE_PENDING |
| QC-POST-100-011 | لا يوجد ربط مباشر بالصور | Photos cannot prove durable backup or isolated database/file restore. | EVIDENCE_PENDING |
| QC-POST-100-014 | لا يوجد ربط مباشر بالصور | Photos cannot approve nineteen release gates or attest provider identity. | EVIDENCE_PENDING |
| QC-POST-100-023 | OP-REJ, OP-DAILY | Reject records may inform examples; SQL parity and approval chain need current DB and authorization proof. | EVIDENCE_PENDING |
| QC-POST-100-024 | OP-LHIST, OP-REJ, OP-DAILY | Records may inform report fields; screen/export parity and durable provenance need current runtime and policy. | EVIDENCE_PENDING |
| QC-POST-100-025 | لا يوجد ربط مباشر بالصور | Photos cannot prove worker execution, provider delivery, metrics or alerts. | EVIDENCE_PENDING |
| QC-POST-100-027 | OP-INSP, OP-REJ | Inspection/rejection records may serve as contextual inputs; approved lifecycle authority and real transitions absent. | EVIDENCE_PENDING |
| QC-POST-100-028 | لا يوجد ربط مباشر بالصور | Photos cannot prove IAM, owner protection or runtime security. | EVIDENCE_PENDING |
| QC-POST-100-029 | لا يوجد ربط مباشر بالصور | Photos are controlled data; no permission to send them to AI providers. Policy and provider evidence absent. | EVIDENCE_PENDING |
| QC-POST-100-032 | OP-INSP, OP-PDEC, OP-SUBA, OP-RAW | Execution images may identify points; WI/specifications, sampling tables, limits, revisions and effectivity absent. | EVIDENCE_PENDING |
| QC-POST-100-033 | OP-RCV, OP-INSP, OP-PDEC, OP-REJ, OP-TRF | Photos identify candidate forms; original registered controlled files, revision/effectivity/scan/retention and approval authority absent. | EVIDENCE_PENDING |
| QC-POST-100-035 | لا يوجد ربط مباشر بالصور | Photos cannot prove authorized restore intent transaction. | EVIDENCE_PENDING |
| QC-POST-100-012 | لا يوجد ربط مباشر بالصور | Photos cannot establish before/after performance baseline. | EVIDENCE_PENDING |
| QC-POST-100-026 | لا يوجد ربط مباشر بالصور | Photos cannot establish provider recovery or measured RPO/RTO. | EVIDENCE_PENDING |
| QC-POST-100-034 | لا يوجد ربط مباشر بالصور | Visible names/signatures in photos do not verify identity, SoD or electronic signature binding. | EVIDENCE_PENDING |
| QC-POST-100-008 | لا يوجد ربط مباشر بالصور | Photos cannot prove PostgreSQL 18 constraints/atomicity/concurrency. | EVIDENCE_PENDING |
| QC-POST-100-018 | OP-RCV, OP-INSP, OP-PDEC, OP-REJ, OP-TRF | Photos can inform terminology; page copy still needs approved vocabulary and rendered review. | EVIDENCE_PENDING |
| QC-POST-100-015 | OP-RCV, OP-INSP, OP-PDEC, OP-REJ, OP-DAILY, OP-TRF | Photos can provide fixture context after safe redaction; 88 route/AT acceptance requires runtime and human evidence. | EVIDENCE_PENDING |

## سجل الأصول

كل ملف له بصمة وحجم وحالة مراجعة في [image-manifest.json](image-manifest.json). الصور الأصلية محفوظة في مجلدها دون تعديل.

## شروط الترقية إلى دليل مقبول

1. يطابق مراجع ضبط الوثائق كل صورة مع أصل النموذج ورقمه ومراجعته وسريانها وسجل حفظها، ويثبت هوية السجل وتسلسل صفحاته.
2. يقدّم مالك QC/QMS وثيقة WI/SOP/المواصفة وجداول العينات والحدود ونسخها وتواريخ سريانها وقرار الاعتماد الموقّع. إشارة نموذج إلى WI ليست الوثيقة نفسها.
3. يربط منفذ الاختبار السجل الحقيقي بمرشح كود محدد، PostgreSQL 18، صلاحية المستخدم، نتيجة POST/HTTP، audit/outbox، وحالات الرفض/التزامن حسب البرومبت.
4. تثبت الجهة المسؤولة اعتماد التوقيع وSoD والاحتفاظ وسياسة الملفات؛ ولا تُنقل أسماء أو تواقيع ظاهرة من الصورة إلى توقيع إلكتروني مفترض.
5. تبقى استعادة النسخ، الأدلة الخارجية، UAT، الأداء والأمن مستقلة عن هذه الصور.

## حدود الفحص

فُحصت ملفات JPG/JPEG/PNG على أوراق اتصال مصغرة للتصنيف العام فقط؛ لم تتم مطابقة كل حقل أو توقيع، ولم تُستخرج بيانات شخصية أو قيم QC من الصور. HEIC لم يتوفر له عرض موثوق؛ تجزئتها فقط مؤكدة. لا قبول علمي أو تشغيلي أو إصدار ناتج من هذا الملحق.
