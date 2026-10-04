# المرحلة 3 — مصالحة أولية لسلامة QC والعلم والبيانات

**الحالة: PARTIAL / BLOCKED — NO-GO.**

## هوية الفحص وحدود الدليل

- HEAD عند بدء هذه المهمة: `4a207bbc2341c7a17416f51558f1232d2a5d0cf0`، `main`، شجرة نظيفة.
- فحص `docker info` الحالي: فشل الاتصال بـDocker socket؛ لم تشغّل أي حاوية أو اختبار PostgreSQL لهذه النسخة. نتيجة 5/5 migrations و11/17 concurrency السابقة تخص SHA `6fc63e7` وشجرة مختلفة؛ تاريخية لهذا HEAD.
- النطاق هنا قراءة مصدرية واختبارات موجودة فقط. لا مراجعة لبيانات إنتاج، ولا معيار علمي مخترع، ولا UAT.
- فحوص وحدة مركزة على HEAD الحالي: `pnpm exec vitest run tests/unit/shared/p05-authority.test.ts tests/unit/authorization/two-stage-approval-contract.test.ts tests/unit/policy/controlled-policy-fail-closed.test.ts` نجحت 26/26 (exit 0). تثبت عقود source للسلطة والمنع فقط، ولا تحل محل اختبار PG18 المتزامن.

## مصالحة الإخفاقات الستة السابقة مع المصدر الحالي

| الحالة السابقة | المصدر/التفسير المتاح الآن | الاستنتاج والإجراء |
|---|---|---|
| مرحلتا اعتماد التفتيش المتزامنتان: صفر نجاح | `tests/integration/concurrency/controlled-mutations.test.ts:39-62` يبني كل الفاعلين بدور `MANAGER`. `src/modules/quarantine/inspection/application/approve-inspection.ts:37-38` يشترط سلطة المرحلة الأولى؛ قرار P-05 يجعلها Supervisor فقط. | Fixture غير صالح لإثبات نجاح مرحلة Supervisor. لا تُمنح MANAGER صلاحية مرحلة أولى لإرضاء الاختبار. يتطلب ضابط Supervisor موجب وضابط Manager سلبي ثم إعادة اختبار التسلسل. |
| HOLD أثناء اعتماد التفتيش: رفض `AUTHZ_DENIED` | الاختبار نفسه يستخدم `approver()` من MANAGER للمرحلة الأولى (`controlled-mutations.test.ts:491-498`). | الرفض قبل تجربة حماية HOLD النهائية؛ اختبار HOLD **غير حاسم** حتى يصل تقرير صحيح إلى `PENDING_QCM_APPROVAL` عبر Supervisor. |
| اعتماد المختبر المتزامن: صفر نجاح | `controlled-mutations.test.ts:632-645` يستخدم MANAGER لمرحلة أولى؛ قرار P-05 يفصل Supervisor عن QCM. المقيّم في الاختبار fake، لا مصدر علمي معتمد. | لا يُثبت عيب تزامن من صفر نجاح؛ أصلح fixture البحثية وفق السلطة، ثم أثبت الرفض/السماح في PostgreSQL مع عدم ادعاء صحة النتيجة العلمية fake. |
| إنشاء مراجعتين متزامنتين: صفر نجاح | `controlled-mutations.test.ts:818-846` يجعل السلف `APPROVED` ثم يتوقع إنشاء revision؛ عقد المستندات الحالي يشترط predecessor `EFFECTIVE` وليس APPROVED (`Documents/STATE-MACHINES.md`، ومصدر إنشاء النسخة). | التوقع القديم يتعارض مع السريان. اختبر منع revision قبل effectivity، ثم سيناريو تنافس من EFFECTIVE مع صلاحية وفعل معتمدين، دون تجاوز RD-019/PD-13. |
| رفض المراجعة: `AUTHZ_PERMISSION_MISSING` بدل `AUTHZ_DENIED` | `controlled-mutations.test.ts:962-972` يثبت كود رفض محدد، لكن النظام يرجع كود permission أدق. | راجع عقد ErrorCode وخريطة الواجهة قبل تعديل التوقع. المهم إثبات صفر تغييرات في النسخة/audit/outbox، وليس تحويل رفض آمن إلى سماح. |
| حقن فشل outbox: `SYSTEM_DATABASE_UNAVAILABLE` بدل نص الحقن | `controlled-mutations.test.ts:1018-1050` يتوقع رسالة داخلية `injected outbox failure`؛ طبقة البيانات تصنف خطأ المزود بشكل منقح. | لا تُسرّب نص الخطأ الخام لإرضاء الاختبار. تحقق من rollback الأربعة صفريًا وبقاء الخطأ المنقح، ثم صالح التوقع إذا وافق عقد الخطأ. |

## فجوات القرار العلمي والوثائق — لا تُفتح بإصلاح اختبار

- `PostgresControlledLabSources.evaluate()` في `src/modules/laboratory/infrastructure/postgres-controlled-sources.ts:128-134` يرفض عمدًا التقييم الرسمي. لا مصدر QC/QMS معتمد للوحدات/الحدود/المعادلة/التقريب؛ نتيجة fake داخل اختبار التزامن ليست قبولًا علميًا.
- `ApproveVersionUseCase` في `src/modules/documents/application/approve-version.ts:5-14` يرمي `POLICY_SOURCE_REQUIRED` حتى اعتماد RD-019/PD-32. `APPROVED ≠ EFFECTIVE`، ولا بديل عن مصدر السريان PD-13.
- مسار التفتيش الإيجابي يحتاج تقرير نتيجة رسمية وربطها بمصدر معتمد قبل اعتماد QCM؛ لا يمكن إثبات رحلة QC كاملة أو رفع P0 إلى PASS الآن.

## إعادة الاختبار المطلوبة

1. استعادة Docker Testcontainers على نفس المرشح، مع إزالة متغيرات اتصال القواعد الخارجية وتأكيد هدف `postgres:18-alpine` المؤقت.
2. إعداد fixtures منفصلة: مؤلف QC، مشرف للمرحلة الأولى، مدير جودة للمرحلة النهائية، وAdmin للرفض؛ استخدم سجلات ونسخًا صالحة وضابط سماح/رفض لكل إجراء.
3. شغّل أولًا `tests/integration/concurrency/controlled-mutations.test.ts` بعد مصالحة التوقعات مع السلطة/السريان المعتمد، ثم `tests/integration/qc-100-final-013/two-stage-controlled-approval.test.ts` واختبارات المختبر والتقرير والتتبع ذات الصلة على قاعدة معزولة.
4. لكل فشل: سجّل كود الخطأ والصف قبل/بعد وعدد audit/signature/outbox، وميّز `FIXTURE_DRIFT` من `PRODUCT_DEFECT` من `POLICY_BLOCKED`. لا تعدّل المصدر لمجرد الوصول إلى أخضر.
5. لا تُحدّث درجة التدقيق أو الهوية القديمة إلا بعد دليل مرشح جديد كامل؛ CI، runtime، UAT، الوثائق الموقعة والاستعادة مستقلة عن PG المحلي.
