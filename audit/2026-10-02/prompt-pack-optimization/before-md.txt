# QC — برومبتات الإغلاق والاختصار والديمو

تحديث النطاق: 2026-10-02. 20 برومبتًا؛ الديمو على qclevel.top ببيانات حقيقية فقط. نسبة 46.3% تاريخية، و100% مشروطة بأدلة كل معيار قابل للتطبيق. المطلوب الآن تحديث البرومبتات فقط.

ترتيب العمل: 017 ثم الفجوات 001–014، ثم 018 و015، ثم 019 و020، ثم 016 للمصالحة النهائية.

```text
Prompt ID: QC-POST-100-001
Priority: P1
Audit candidate: 6059e177438d8ae110c99084d32758b048f22cd2; re-freeze final candidate before evidence.
Historical evidence: report sections4/5/41/50 and verification-data.json on audit candidate; recheck current source and evidence before work.
Exact remaining problem: إصلاح النماذج التي تُرسل الأسرار أو بيانات العمل عبر GET
Trace: QC-POST-F-002, QC-PAGE-F-011
Affected pages/domains: /laboratory/tests/[labTestId]/review, /reject-reports/daily/[reportId], /reject-reports/issue-slips/[reportId]
Required implementation: أضف native POST إلى نفس use case المصرح، دون أسرار في URL؛ امسح إعادة المصادقة بعد محاولة الطلب. حافظ على validation وunknown-write reconciliation.
Required verification/tests/acceptance: no-JS populated positive/negative POST؛ URL خالٍ من secret/business fields؛ rollback وduplicate/stale tests.
Dependencies: none
Read AGENTS and current Mind. Preserve current owner/scientific/signature decisions. Do not manufacture policy, evidence or human UAT. Only modify unresolved parts. No commit/push/merge/deploy/production migration without explicit authorization. Update candidate-bound evidence and Mind after result. CLOSED only after required proof; otherwise PARTIAL/BLOCKED/NOT VERIFIED.
```

```text
Prompt ID: QC-POST-100-002
Priority: P1
Audit candidate: 6059e177438d8ae110c99084d32758b048f22cd2; re-freeze final candidate before evidence.
Historical evidence: report sections4/5/41/50 and verification-data.json on audit candidate; recheck current source and evidence before work.
Exact remaining problem: إصلاح فتح التصحيح ونسخة تعديل الوثيقة ونوع القياس
Trace: QC-POST-F-001, QC-POST-F-003, QC-POST-F-004
Affected pages/domains: /quarantine/receiving/[receivingId], /documents/[documentId]/versions/[versionId]/edit, /laboratory/tests/[labTestId]/execute
Required implementation: اجعل التصحيح يفتح نموذجًا موجودًا؛ مرر expectedVersion من فتح النموذج كحقل مسمى، وأعد فحصه في transaction؛ حوّل القياس حسب dataType فقط.
Required verification/tests/acceptance: تصحيح مع/بدون JS؛ رفض stale draft edit بلا آثار؛ حفظ TEXT true/false وBOOLEAN وDECIMAL ثم reload.
Dependencies: none
Read AGENTS and current Mind. Preserve current owner/scientific/signature decisions. Do not manufacture policy, evidence or human UAT. Only modify unresolved parts. No commit/push/merge/deploy/production migration without explicit authorization. Update candidate-bound evidence and Mind after result. CLOSED only after required proof; otherwise PARTIAL/BLOCKED/NOT VERIFIED.
```

```text
Prompt ID: QC-POST-100-003
Priority: P1
Audit candidate: 6059e177438d8ae110c99084d32758b048f22cd2; re-freeze final candidate before evidence.
Historical evidence: report sections4/5/41/50 and verification-data.json on audit candidate; recheck current source and evidence before work.
Exact remaining problem: إكمال تصنيف إخفاق مصادر القراءة واستقلال الأقسام
Trace: QC-PAGE-F-008
Affected pages/domains: /quality/findings/[findingId], /quality/ncr, /quality/rca, /quality/capa, /quarantine/admin
Required implementation: احتفظ بالقراءة الأساسية عند فشل related؛ لا تعرض outage كسجل فارغ؛ حالة كل مصدر مستقلة.
Required verification/tests/acceptance: fault injection لكل مصدر، primary محفوظ، withheld counts، no existence leak.
Dependencies: QC-POST-100-001, QC-POST-100-002
Read AGENTS and current Mind. Preserve current owner/scientific/signature decisions. Do not manufacture policy, evidence or human UAT. Only modify unresolved parts. No commit/push/merge/deploy/production migration without explicit authorization. Update candidate-bound evidence and Mind after result. CLOSED only after required proof; otherwise PARTIAL/BLOCKED/NOT VERIFIED.
```

```text
Prompt ID: QC-POST-100-004
Priority: P2
Audit candidate: 6059e177438d8ae110c99084d32758b048f22cd2; re-freeze final candidate before evidence.
Historical evidence: report sections4/5/41/50 and verification-data.json on audit candidate; recheck current source and evidence before work.
Exact remaining problem: إغلاق بوابات الكود وعقود UI والبيئة الحالية
Trace: QC-POST-F-007, QC-PAGE-F-019, QC-PAGE-F-020, QC-ENV-F-004
Affected pages/domains: src/actions/documents.ts, /ai-advisory, Documents/EXTENDING-THE-SYSTEM.md, .env.example
Required implementation: أصلح import عبر application port؛ أصلح الخطأين TypeScript؛ صالح assertions للمعنى المعتمد دون تعطيل اختبارات؛ وثق 0043 ومفاتيح البيئة الناقصة؛ أصلح lint/format الفعلي.
Required verification/tests/acceptance: Node24.20/pnpm11.25؛ unit/lint/format/typecheck/architecture/parity PASS؛ لا تحديث expected لإخفاء defect.
Dependencies: QC-POST-100-001, QC-POST-100-002
Read AGENTS and current Mind. Preserve current owner/scientific/signature decisions. Do not manufacture policy, evidence or human UAT. Only modify unresolved parts. No commit/push/merge/deploy/production migration without explicit authorization. Update candidate-bound evidence and Mind after result. CLOSED only after required proof; otherwise PARTIAL/BLOCKED/NOT VERIFIED.
```

```text
Prompt ID: QC-POST-100-005
Priority: P2
Audit candidate: 6059e177438d8ae110c99084d32758b048f22cd2; re-freeze final candidate before evidence.
Historical evidence: report sections4/5/41/50 and verification-data.json on audit candidate; recheck current source and evidence before work.
Exact remaining problem: إكمال الفلاتر وتسميات Audit وروابط السلطة
Trace: QC-POST-F-005, QC-POST-F-006, QC-PAGE-F-012, QC-PAGE-F-018
Affected pages/domains: /tasks, /audit, /ai-advisory
Required implementation: صفّر page عند تغيير/remove filter؛ حل human references/action/actor؛ فلتر private link بنفس pageAccessDecision.
Required verification/tests/acceptance: صفحة>1 fixture، تغيير/removal، readable/nonowner/private denial، screen-reader labels.
Dependencies: QC-POST-100-001, QC-POST-100-002
Read AGENTS and current Mind. Preserve current owner/scientific/signature decisions. Do not manufacture policy, evidence or human UAT. Only modify unresolved parts. No commit/push/merge/deploy/production migration without explicit authorization. Update candidate-bound evidence and Mind after result. CLOSED only after required proof; otherwise PARTIAL/BLOCKED/NOT VERIFIED.
```

```text
Prompt ID: QC-POST-100-006
Priority: P1
Audit candidate: 6059e177438d8ae110c99084d32758b048f22cd2; re-freeze final candidate before evidence.
Historical evidence: report sections4/5/41/50 and verification-data.json on audit candidate; recheck current source and evidence before work.
Exact remaining problem: حسم المصدر العلمي والتوقيع والإفراج من أصحاب القرار
Trace: QC-PAGE-F-010, QC-PAGE-F-023, QC-PAGE-F-024
Affected pages/domains: /quarantine/inspections, /laboratory, /documents, /approvals
Required implementation: اجمع approved source/revision/hash/units/precision ومعايير QC/QMS وper-decision signature/effectivity/file retention؛ أبق deny حتى الاعتماد.
Required verification/tests/acceptance: positive official-source ثم negative missing/hash drift/client PASS؛ لا اختراع policy ولا human signature.
Dependencies: QC-POST-100-001, QC-POST-100-002
Read AGENTS and current Mind. Preserve current owner/scientific/signature decisions. Do not manufacture policy, evidence or human UAT. Only modify unresolved parts. No commit/push/merge/deploy/production migration without explicit authorization. Update candidate-bound evidence and Mind after result. CLOSED only after required proof; otherwise PARTIAL/BLOCKED/NOT VERIFIED.
```

```text
Prompt ID: QC-POST-100-007
Priority: P1
Audit candidate: 6059e177438d8ae110c99084d32758b048f22cd2; re-freeze final candidate before evidence.
Historical evidence: report sections4/5/41/50 and verification-data.json on audit candidate; recheck current source and evidence before work.
Exact remaining problem: إكمال المختبر والمعدات حسب QC-ADP26-33 غير المبدوء
Trace: QC-PAGE-F-033
Affected pages/domains: /laboratory/tests/[labTestId], /laboratory/tests/[labTestId]/review, /assets, /quarantine/inspections
Required implementation: اربط SUBMITTED/PENDING_QCM بالخطوة المسموحة؛ أصلح stage filters/context؛ نفذ approved asset actions دون اختراع دورة جديدة.
Required verification/tests/acceptance: populated role/state/version fixtures؛ eligible/ineligible lab use؛ repair creation؛ audit atomicity.
Dependencies: QC-POST-100-001, QC-POST-100-002
Read AGENTS and current Mind. Preserve current owner/scientific/signature decisions. Do not manufacture policy, evidence or human UAT. Only modify unresolved parts. No commit/push/merge/deploy/production migration without explicit authorization. Update candidate-bound evidence and Mind after result. CLOSED only after required proof; otherwise PARTIAL/BLOCKED/NOT VERIFIED.
```

```text
Prompt ID: QC-POST-100-008
Priority: P1
Audit candidate: 6059e177438d8ae110c99084d32758b048f22cd2; re-freeze final candidate before evidence.
Historical evidence: report sections4/5/41/50 and verification-data.json on audit candidate; recheck current source and evidence before work.
Exact remaining problem: إثبات معاملات الدومينات والتزامن على PostgreSQL18
Trace: QC-PAGE-F-003, QC-PAGE-F-004, QC-PAGE-F-005, QC-PAGE-F-006, QC-PAGE-F-007, QC-PAGE-F-009, QC-PAGE-F-013, QC-PAGE-F-021, QC-PAGE-F-022, QC-PAGE-F-025, QC-PAGE-F-026, QC-PAGE-F-028
Affected pages/domains: quarantine, quality, identity, documents, approvals, system
Required implementation: عالج فقط إخفاقات التكامل المثبتة؛ ثم أثبت كل boundary rollback/replay/race/current-version/authority؛ استخدم قاعدة disposable وعزل suites.
Required verification/tests/acceptance: integration/migrations/concurrency/security بلا skips وفشل؛ Node24 evidence مرتبط SHA/schema/fingerprint؛ لا production DB.
Dependencies: QC-POST-100-001, QC-POST-100-002
Read AGENTS and current Mind. Preserve current owner/scientific/signature decisions. Do not manufacture policy, evidence or human UAT. Only modify unresolved parts. No commit/push/merge/deploy/production migration without explicit authorization. Update candidate-bound evidence and Mind after result. CLOSED only after required proof; otherwise PARTIAL/BLOCKED/NOT VERIFIED.
```

```text
Prompt ID: QC-POST-100-009
Priority: P1
Audit candidate: 6059e177438d8ae110c99084d32758b048f22cd2; re-freeze final candidate before evidence.
Historical evidence: report sections4/5/41/50 and verification-data.json on audit candidate; recheck current source and evidence before work.
Exact remaining problem: إثبات البحث والإشعارات واللوحة والتقارير ببيانات ممثلة
Trace: QC-PAGE-F-014, QC-PAGE-F-015, QC-PAGE-F-017, QC-PAGE-F-029, QC-PAGE-F-030, QC-POST-F-008, QC-POST-F-009
Affected pages/domains: /search, /notifications, /dashboard, /work, /reports, /reject-reports
Required implementation: أثبت exact totals/scopes/order/51 notifications/decimal units؛ احسم durable report snapshot والretention عند لزوم العقد.
Required verification/tests/acceptance: screen/CSV/XLSX/print parity، changed-source denial، recipient isolation، no double-count، rollback append.
Dependencies: QC-POST-100-001, QC-POST-100-002
Read AGENTS and current Mind. Preserve current owner/scientific/signature decisions. Do not manufacture policy, evidence or human UAT. Only modify unresolved parts. No commit/push/merge/deploy/production migration without explicit authorization. Update candidate-bound evidence and Mind after result. CLOSED only after required proof; otherwise PARTIAL/BLOCKED/NOT VERIFIED.
```

```text
Prompt ID: QC-POST-100-010
Priority: P1
Audit candidate: 6059e177438d8ae110c99084d32758b048f22cd2; re-freeze final candidate before evidence.
Historical evidence: report sections4/5/41/50 and verification-data.json on audit candidate; recheck current source and evidence before work.
Exact remaining problem: مصالحة الإنتاج والمخطط بعد تدوير الاتصال المعتمد
Trace: QC-PAGE-F-002, QC-ENV-F-001
Affected pages/domains: /system/health, production database
Required implementation: جهز migration/rollback/recovery plan بعد بوابة تدوير credential؛ اجمع read-only ledger names/checksums وتطابق artifact/runtime/config؛ أي تنفيذ إنتاج يتطلب تفويضًا مستقلًا.
Required verification/tests/acceptance: 43 source↔applied ledger parity وchecksum/no missing tables؛ live ready على exact candidate؛ محفوظ SHA/provider readback.
Dependencies: QC-POST-100-001, QC-POST-100-002
Read AGENTS and current Mind. Preserve current owner/scientific/signature decisions. Do not manufacture policy, evidence or human UAT. Only modify unresolved parts. No commit/push/merge/deploy/production migration without explicit authorization. Update candidate-bound evidence and Mind after result. CLOSED only after required proof; otherwise PARTIAL/BLOCKED/NOT VERIFIED.
```

```text
Prompt ID: QC-POST-100-011
Priority: P1
Audit candidate: 6059e177438d8ae110c99084d32758b048f22cd2; re-freeze final candidate before evidence.
Historical evidence: report sections4/5/41/50 and verification-data.json on audit candidate; recheck current source and evidence before work.
Exact remaining problem: التخزين والمراقبة والاستعادة وDR
Trace: QC-PAGE-F-027, QC-ENV-F-003
Affected pages/domains: /system/health, /system/backups, /system/control-center
Required implementation: احسم required/optional مع المالك؛ جهز durable storage وoutbox worker/receiver والalerts؛ اعتمد RPO/RTO ثم نفذ isolated restore drill.
Required verification/tests/acceptance: storage roundtrip، delivery age/count/ack، backup checksum/schema/business history، measured restore/RPO/RTO؛ لا إنتاج restore.
Dependencies: QC-POST-100-001, QC-POST-100-002
Read AGENTS and current Mind. Preserve current owner/scientific/signature decisions. Do not manufacture policy, evidence or human UAT. Only modify unresolved parts. No commit/push/merge/deploy/production migration without explicit authorization. Update candidate-bound evidence and Mind after result. CLOSED only after required proof; otherwise PARTIAL/BLOCKED/NOT VERIFIED.
```

```text
Prompt ID: QC-POST-100-012
Priority: P2
Audit candidate: 6059e177438d8ae110c99084d32758b048f22cd2; re-freeze final candidate before evidence.
Historical evidence: report sections4/5/41/50 and verification-data.json on audit candidate; recheck current source and evidence before work.
Exact remaining problem: إغلاق الأداء المقاس فقط
Trace: QC-PAGE-F-031
Affected pages/domains: /assets/maintenance/new, /assets/calibrations/new, /dashboard, /login
Required implementation: أزل N+1 للصيانة إذا أثبته القياس؛ استخدم أحجام بيانات ممثلة وbudgets معتمدة؛ لا threshold مخترع.
Required verification/tests/acceptance: SQL query count وp95/payload/LCP/INP/GPU قبل/بعد نفس الظروف؛ test compatibility.
Dependencies: QC-POST-100-001, QC-POST-100-002
Read AGENTS and current Mind. Preserve current owner/scientific/signature decisions. Do not manufacture policy, evidence or human UAT. Only modify unresolved parts. No commit/push/merge/deploy/production migration without explicit authorization. Update candidate-bound evidence and Mind after result. CLOSED only after required proof; otherwise PARTIAL/BLOCKED/NOT VERIFIED.
```

```text
Prompt ID: QC-POST-100-013
Priority: P2
Audit candidate: 6059e177438d8ae110c99084d32758b048f22cd2; re-freeze final candidate before evidence.
Historical evidence: report sections4/5/41/50 and verification-data.json on audit candidate; recheck current source and evidence before work.
Exact remaining problem: إكمال الدخول حسب QC-ADP26-34 غير المبدوء
Trace: QC-PAGE-F-034
Affected pages/domains: /login
Required implementation: حافظ native POST، أضف pending/double-submit guard وserver-derived throttle/session recovery.
Required verification/tests/acceptance: no-JS، slow network، repeated submit، invalid/rate-limited/expired، password-manager/keyboard.
Dependencies: QC-POST-100-001, QC-POST-100-002
Read AGENTS and current Mind. Preserve current owner/scientific/signature decisions. Do not manufacture policy, evidence or human UAT. Only modify unresolved parts. No commit/push/merge/deploy/production migration without explicit authorization. Update candidate-bound evidence and Mind after result. CLOSED only after required proof; otherwise PARTIAL/BLOCKED/NOT VERIFIED.
```

```text
Prompt ID: QC-POST-100-014
Priority: P1
Audit candidate: 6059e177438d8ae110c99084d32758b048f22cd2; re-freeze final candidate before evidence.
Historical evidence: report sections4/5/41/50 and verification-data.json on audit candidate; recheck current source and evidence before work.
Exact remaining problem: مصالحة 19 بوابة الإصدار حسب QC-ADP26-32 غير المبدوء
Trace: QC-PAGE-F-032
Affected pages/domains: /governance/releases/[releaseId]
Required implementation: احصل mapping معتمد لـ19 gate↔requirements↔provider/signer digest؛ اربط SHA/build/schema/scope؛ recompute خادميًا؛ لا إغلاق بمجرد تقرير.
Required verification/tests/acceptance: tamper/stale/wrong SHA/scope/replay denial؛ trusted intake؛ كل gate disposition؛ لا release approval قبل الدليل.
Dependencies: QC-POST-100-001, QC-POST-100-002
Read AGENTS and current Mind. Preserve current owner/scientific/signature decisions. Do not manufacture policy, evidence or human UAT. Only modify unresolved parts. No commit/push/merge/deploy/production migration without explicit authorization. Update candidate-bound evidence and Mind after result. CLOSED only after required proof; otherwise PARTIAL/BLOCKED/NOT VERIFIED.
```

```text
Prompt ID: QC-POST-100-015
Priority: P1
Audit candidate: 6059e177438d8ae110c99084d32758b048f22cd2; re-freeze final candidate before evidence.
Historical evidence: report sections4/5/41/50 and verification-data.json on audit candidate; recheck current source and evidence before work.
Exact remaining problem: القبول المصادق والإتاحة والنصوص حسب QC-ADP26-35
Trace: QC-PAGE-F-001, QC-PAGE-F-011, QC-PAGE-F-016, QC-PAGE-F-017, QC-ENV-F-002
Affected pages/domains: 88 pages / applicable states
Required implementation: نفذ المتبقي فقط من route/state/persona matrix مع source/fixture identity؛ راجع النصوص في حالات العرض؛ AI processing فقط بعد سياسة معتمدة.
Required verification/tests/acceptance: six-persona positive/negative direct HTTP + no-JS/error/session؛ 320/375/768/1440 و200% ولوحة مفاتيح وAT يدوي؛ provider AI conditional دون بيانات حساسة.
Dependencies: QC-POST-100-001, QC-POST-100-002
Read AGENTS and current Mind. Preserve current owner/scientific/signature decisions. Do not manufacture policy, evidence or human UAT. Only modify unresolved parts. No commit/push/merge/deploy/production migration without explicit authorization. Update candidate-bound evidence and Mind after result. CLOSED only after required proof; otherwise PARTIAL/BLOCKED/NOT VERIFIED.
```

```text
Prompt ID: QC-POST-100-016
Priority: P1
Audit candidate: 6059e177438d8ae110c99084d32758b048f22cd2; re-freeze final candidate before evidence.
Historical evidence: report sections4/5/41/50 and verification-data.json on audit candidate; recheck current source and evidence before work.
Exact remaining problem: UAT والمصالحة النهائية حسب QC-ADP26-36
Trace: QC-PAGE-F-001
Affected pages/domains: all mandatory workflows
Required implementation: اجمع قبولًا بشريًا حقيقيًا من Yazeed/QCM/Supervisor/QC01–03؛ صالح كل old/new finding وgate على المرشح النهائي؛ لا توقيع نيابة عن المشاركين.
Required verification/tests/acceptance: coverage-register 017 + copy acceptance 018 + demo rehearsal 020؛ signed UAT scope/digest؛ P0/P1=0، mandatory FAIL/BLOCKED/NV=0؛ exact SHA CI/security/PG/E2E/AT/provider evidence.
Dependencies: QC-POST-100-001, QC-POST-100-002
Read AGENTS and current Mind. Preserve current owner/scientific/signature decisions. Do not manufacture policy, evidence or human UAT. Only modify unresolved parts. No commit/push/merge/deploy/production migration without explicit authorization. Update candidate-bound evidence and Mind after result. CLOSED only after required proof; otherwise PARTIAL/BLOCKED/NOT VERIFIED.
```

```text
Prompt ID: QC-POST-100-017
Priority: P1
Objective: تغطية كل متطلب وصفحة وموضوع وتثبيت طريقة حساب 100%
Dependencies: none
Scope: جميع أقسام تقرير التدقيق، جميع متطلبات الوثائق المعتمدة، الدومينات، بوابات الإصدار، صفحات النظام وحالاتها وأدوارها؛ أعد اكتشاف العدد الحالي ولا تفترض بقاء 88 صفحة أو 100 متطلب أو 80 دومين.
Implementation: أنشئ سجل تغطية row-level بمرجع المتطلب/قسم التقرير، الصفحة والدور والحالة، معيار القبول، owner، prompt المسؤول، dependencies، denominator، حالة الدليل ومصدره ووقته وSHA/fingerprint/runtime/schema. اربط كل finding قديم وجديد وكل task لم يبدأ بعمل متبقٍ محدد. كل قسم وصفي بلا نسبة يوضح أنه وصفي؛ كل معيار قابل للقياس له مقام معلن. لا تترك صفًا بلا مسؤول أو معيار قبول.
Scoring: نسبة الجزء = عدد المعايير PASS بأدلة مقبولة على النسخة المطلوبة / كل المعايير الإلزامية القابلة للتطبيق ×100. FAIL وBLOCKED وNOT VERIFIED وNOT RUN لا تدخل البسط. N/A يحتاج قرار تطبيق موثق من صاحب الصلاحية؛ لا تستبعد عائقًا لرفع الدرجة. لا متوسط يخفي فشل جزء إلزامي. اعرض نسب الصفحات والموضوعات والدومينات والمجموع مع المقامات؛ 100% لكل جزء فقط عند اكتمال كل أدلته بلا فجوة إلزامية.
Verification: طابق السجل مع التقرير والوثائق ومصفوفة routes والبوابات آليًا للكشف عن missing/duplicate/unowned rows؛ راجع المقامات والتطبيق بشريًا. حافظ على التقرير التاريخي كما هو وأصدر قياسًا جديدًا منفصلًا. المنتج والديمو والأمن والإتاحة وجاهزية الإنتاج مؤشرات منفصلة. Deliverables: coverage-register.json + .md + HTML بأدلة وروابط فعلية؛ unresolved decisions تظهر BLOCKED لا نسبًا مخترعة.
Read current AGENTS/Mind and approved requirements. Only implement unresolved work after re-baselining current source. Preserve dirty work and decisions. No commit/push/deploy/production migrations or writes without explicit operation authorization. No manufactured policy/evidence/human acceptance. Evidence must bind to final candidate. Update Mind only with meaningful current facts.
```

```text
Prompt ID: QC-POST-100-018
Priority: P1
Objective: اختصار كبير للنصوص وصياغة بشرية في جميع الصفحات
Dependencies: QC-POST-100-017, QC-POST-100-005
Scope: كل الصفحات وحالات normal/loading/empty/error/denied/stale/unknown-write، dialogs، forms، notifications، exports والنسخ المطبوعة. اقرأ UX-WRITING-GUIDE وCOPY-INVENTORY وCOPY-GLOSSARY قبل التعديل. حافظ على English/LTR وعلى PASS/FAIL/HOLD/RELEASED/VOID وNCR/CAPA؛ لا تساوِ approval وrelease أو submitted وsaved.
Implementation: احصر النصوص الحالية قبل/بعد ومسارها وسبب حذفها. استهدف خفض 50% أو أكثر من النثر التفسيري غير الضروري على الصفحات المزدحمة؛ الصفحة المختصرة أصلًا أو النص الضروري له استثناء مفسر، لا حذف آلي لتحقيق الرقم. احذف التكرار والشروح التقنية الداخلية والمقدمات، اجعل لكل صفحة غرضًا واضحًا وفعلًا أساسيًا واضحًا؛ اجعل الأزرار تصف الفعل، والخطأ يشرح النتيجة والخطوة الآمنة. انقل المساعدة الثانوية عند الحاجة إلى إفصاح متاح، مع إبقاء المعلومات اللازمة لاتخاذ القرار والتحذيرات الجوهرية أمام المستخدم في وقتها.
Safety: لا تحذف labels/accessibility names/units/precision/record context أو المتطلبات العلمية والتنظيمية؛ لا تخفِ unknown-write uncertainty أو تدعُ لإعادة إرسال عمياء. لا تقلل الخط أو تخفي النص عبر CSS كدليل اختصار. لا تستخدم شعارات أو مصطلحات بنية التطبيق في رحلة المشغّل.
Measurement: قِس الكلمات المرئية في النثر المؤهل لكل route/state بنفس البيانات والمقاس قبل/بعد، منفصلة عن قيم السجلات والجداول والقوائم. سجل baseline/after/reduction/excluded necessary text/reason؛ عدّ أول viewport وكل الصفحة والإفصاح الثانوي منفصلة حتى لا تعتبر نقل النص حذفًا.
Acceptance: راجع كل نص مع الإجراء الفعلي، ثم browser keyboard/AT/responsive بعد التعديل. مشغّل بشري يقرأ ويفهم المطلوب ويكمل المهمة دون شرح خارجي؛ سجل ملاحظاته وتصحيحاتها. لا تدّعِ أن النص «بشري 100%» من درجة أداة؛ اقبل الصياغة بمراجعة بشرية موثقة. Deliverables: copy inventory before/after + measured reduction + route screenshots + operator acceptance؛ مصدر وحده لا يثبت القبول المرئي.
Read current AGENTS/Mind and approved requirements. Only implement unresolved work after re-baselining current source. Preserve dirty work and decisions. No commit/push/deploy/production migrations or writes without explicit operation authorization. No manufactured policy/evidence/human acceptance. Evidence must bind to final candidate. Update Mind only with meaningful current facts.
```

```text
Prompt ID: QC-POST-100-019
Priority: P1
Objective: تحضير الديمو على الموقع الحالي ببيانات حقيقية فقط
Dependencies: QC-POST-100-017, QC-POST-100-010, QC-POST-100-011, QC-POST-100-018
Environment: https://qclevel.top؛ real data only. ابدأ بقراءة مصرح بها للصحة وهوية النشر والهجرات المطبقة والتخزين والصلاحيات؛ أي projection تُسمى projection ولا تُساوى بledger مباشر. لا تستخدم بيانات التقرير التاريخي كحالة حية.
Implementation: اختر رحلات واقعية من سجلات موجودة وصحيحة ومسموح عرضها، مع الأدوار والحالة والمراجع والأفعال المتاحة. حدد هدف العرض ومدته وتسلسل التنقل والنتيجة المتوقعة لكل خطوة ومتى يتوقف العرض. لا fixtures أو synthetic seed أو شخصيات اختبار أو counters مزيفة أو state patches أو توقيعات مصطنعة على الموقع. نقص البيانات المطلوبة عائق واضح يتطلب مصدرًا حقيقيًا معتمدًا، لا اختلاقه.
Readiness: عالج محليًا الفجوات المؤثرة على الرحلات، وجهز تغييرات قابلة للمراجعة وخطة تحقق ونسخة تعافٍ معتمدة قبل طلب إذن العملية الخارجية. تحقق من applied schema/runtime identity وreadiness والتخزين وروابط الملفات والاستعلامات الحقيقية والأذونات. الهجرات المعلقة والتحذيرات لا تُخفى. قرارات QC/QMS والتوقيع والإفراج لا تُتجاوز لغرض العرض؛ AI يبقى معطلًا إذا سياسة معالجة البيانات الحقيقية غير معتمدة.
Authorization: هذا البرومبت لا يفوض deploy/migration/rotation/permission changes أو production mutations. جهزها أولًا ثم نفذ فقط إذا طلب المستخدم العملية صراحة وضمن نطاقها. العرض الافتراضي قراءة فقط؛ انتقالات عمل حقيقية تحتاج إذنًا محددًا وموافقات الدومين المعتادة. لا cleanup يحذف بيانات حقيقية أو retry أعمى عند نتيجة غير مؤكدة.
Deliverables: demo-runbook.md + HTML، readiness checklist، مصفوفة real-record/role/state والقيود، قائمة blockers والمالك والتصرف التالي. احفظ معرّفات السجلات الحساسة في دليل خاص مناسب ولا تنشر بيانات العملاء أو أسرار الدخول في البرومبت أو التقرير.
Read current AGENTS/Mind and approved requirements. Only implement unresolved work after re-baselining current source. Preserve dirty work and decisions. No commit/push/deploy/production migrations or writes without explicit operation authorization. No manufactured policy/evidence/human acceptance. Evidence must bind to final candidate. Update Mind only with meaningful current facts.
```

```text
Prompt ID: QC-POST-100-020
Priority: P1
Objective: بروفة حية وقبول الديمو بدون ادعاءات زائدة
Dependencies: QC-POST-100-019, QC-POST-100-015
Scope: بروفة على qclevel.top بعد تحضير 019 وعلى النسخة المنشورة المحددة، ببيانات حقيقية فقط. سجل domain/time/deployed identity/applied-schema evidence والأدوار والرحلات المسموح بها. لا تنقل نجاح localhost إلى الموقع.
Verification: نفذ الرحلات المسموح بها بالفعل في المتصفح؛ اختبر سهولة القراءة والتنقل والتحميل والبحث والعدّ والتفاصيل والملفات والتصدير المسموح، وسجل expected/actual/evidence لكل خطوة. اختبارات التزامن والرفض المتلفة والتحميل وfixtures تبقى على بيئة اختبار معزولة؛ لا تستخدم الإنتاج مختبرًا. تعامل مع أسرار الدخول بأمان ولا تضعها في الصور أو logs. لكل write مصرح به راجع السجل والتاريخ والآثار قبل إعادة المحاولة؛ لا توقّع نيابة عن أحد.
Acceptance: مشغّل حقيقي يراجع العرض، كل خطوة حرجة PASS، صفر blockers في نطاق العرض، هوية النسخة والدليل متطابقان، البيانات حقيقية وصحيحة ومصرح عرضها، ولا روابط معطلة أو تسريب. عند نقص دليل أو schema/storage/permission/source blocker يكون DEMO BLOCKED مع السبب؛ العرض المحدود للقراءة يُسمى صراحة ولا يُسوّق كرحلة تنفيذ كاملة.
Scoring: احسب نسبة الديمو بمقام خطواته الإلزامية، منفصلة عن نسب جميع متطلبات النظام. استبعاد رحلة من العرض لا يغلق متطلبها ولا يرفع درجة النظام. DEMO READY لا يعني PRODUCTION READY أو UAT PASSED أو 100% شاملًا. أجّل القرار النهائي إذا تغيّرت النسخة وأعد الأدلة المتأثرة.
Deliverables: live-demo-rehearsal.md + HTML + acceptance checklist، نتيجة DEMO READY/BLOCKED/NOT VERIFIED، المشغّل ووقت القبول ومراجع الأدلة وحدود العرض؛ لا تبدل التقرير التاريخي.
Read current AGENTS/Mind and approved requirements. Only implement unresolved work after re-baselining current source. Preserve dirty work and decisions. No commit/push/deploy/production migrations or writes without explicit operation authorization. No manufactured policy/evidence/human acceptance. Evidence must bind to final candidate. Update Mind only with meaningful current facts.
```
