# QC-LAUNCH-014 — patch-or-decision-plan

**القرار: لا patch برمجي. الخطة قرار مصدر محكوم (controlled-source decision request).**

## لماذا لا يوجد patch

- الهدف (`create/edit/version/review/effective/supersede/archive`) يمرّ عبر حاجز سلطة مقصود:
  - `ApproveVersionUseCase` يرمي `POLICY_SOURCE_REQUIRED` (RD-019/PD-32) — `src/modules/documents/application/approve-version.ts:6-14`.
  - `MAKE_EFFECTIVE`/`ARCHIVE` غير موصولين بuse case، وسياسة السريان `UNCONFIRMED`.
  - `SupersedeVersionUseCase` يرفض افتراضيًا لأن `EffectiveDatePolicy.isApproved()` ترجع `false`.
- توجد حراسة سلبية سليمة (DRAFT-only edit، submit evidence+digest، CAS على النسخة/التجزئة، SoD self-review، append-only file/template-source triggers). إضافة lifecycle إيجابي أو تخفيف fail-closed سيُضعف الضابط الحرج — ممنوع.
- لا يوجد مصدر WI/SOP معتمد/فعال: حزمة المؤلف `D0.2 DRAFT FOR REVIEW`، و`PERM-DOC-APPROVE = DENY UNTIL EXPLICITLY APPROVED`.
- البيئة لا تسمح بإثبات runtime: Docker/Testcontainers غير متاح، و`verify:e2e:authenticated` يفشل في preflight (artifact غير مربوط بالمرشح). لا وصول إنتاج ولم يُنشأ أي patch.

## قرارات المصدر المطلوبة

| # | القرار | المالك | المطلوب بدقة | الأثر fail-closed الحالي | البديل المؤقت |
|---|---|---|---|---|---|
| D-01 | RD-019 WI/SOP approval | Document Control / QMS owner | الأدوار المصرّح لها، النطاق، SoD (author/reviewer/approver)، ومعنى التوقيع لكل transition | `ApproveVersionUseCase` → `POLICY_SOURCE_REQUIRED` | أبقِ الاعتماد مرفوضًا؛ لا تحويل لـ`EFFECTIVE` |
| D-02 | PD-13 effectivity / effective date | Document Control + Document owner | فوري عند الاعتماد أم تاريخ سريان أم تفعيل يدوي/مجدول | `EffectiveDatePolicy.isApproved()` = false؛ supersede مرفوض | لا تفعيل تلقائي؛ `APPROVED ≠ EFFECTIVE` |
| D-03 | PD-32 فعل التوقيع للمستندات | QMS + Security | mapping action×subject×state×signer×meaning×policy revision؛ أي فعل يستثنى (RETURN/VOID) | لا ceremony توقيع للمستندات | unlisted → deny قبل reauthentication |
| D-04 | الاحتفاظ/الأرشفة | Document Control + Records | سياسة ARCHIVE/retention ومدة الحفظ وحالات الإتلاف | transition موجود بلا use case | أبقِ ARCHIVED غير موصول |
| D-05 | مصدر النسخة الفعالة | Document Control + QC technical | نسخة WI/SOP المعتمدة، revision، effective date، وSHA-256 للملفات | لا مصدر فعال لاسترجاعه | عدم اختراع محتوى |

## المالك والاعتماد

- المالك الأساسي: Document Control / QMS owner تحت RD-019، مع تأكيد التوقيع تحت PD-32.
- لا يُنشئ الوكيل أي توقيع أو موافقة، ولا يختار أدوارًا أو تواريخ سريان.

## Rollback / الأثر

- لا patch ⇒ لا rollback مطلوب.
- أي patch مستقبلي يجب أن يُطبَّق محليًا في فرع معزول، باختبار PostgreSQL 18 على مرشح مجمّد، ويُرفق بـevidence.json محدث؛ لا دفع أو commit دون تفويض صريح.

## Dependencies

- QC-LAUNCH-002 (اعتماد السياسات) وQC-LAUNCH-004 (PG18) وQC-LAUNCH-007 (كتالوج القوالب) وQC-LAUNCH-010 (خريطة التوقيع).
- توفّر Docker/Testcontainers أو PG18 معزول لقاعدة اختبار، وحسابات مصادقة اختبارية synthetics.

## Remote / Governance

- لا تعديل بعيد، لا commit/push، لا migrations إنتاجية، لا تغيير أدوار أو وثائق محكومة، ولا وصول لقاعدة الإنتاج. كل الأدلة محلية مرتبطة بـ`960dc79f`.
