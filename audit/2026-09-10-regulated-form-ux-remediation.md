# Regulated Form UX Audit & Remediation — 2026-09-10

## النطاق

تمت مراجعة كل النماذج الفعلية تحت `src/pages` و`src/ui`، وعددها 48 نموذجًا:

| مساحة العمل | النماذج التي تمت مراجعتها | قرار UX المطبق |
|---|---:|---|
| Tasks | 2 | البحث GET؛ إنشاء draft بترتيب المهمة؛ لا تعرض الحالة كنص قابل للتعديل |
| Findings / NCR / RCA / CAPA | 4 | Finding creation واضح؛ NCR/RCA landing لا تعرض form غير مدعوم؛ CAPA close إجراء مضبوط بسبب state/permission |
| Receiving / Inspection | 8 | هوية الاستلام والكمية والتواريخ في مجموعات؛ inspection context مقروء فقط؛ notes/reason labels مرتبطة |
| Laboratory | 4 | template selector مصادق؛ raw scientific values لا تُخترع في الواجهة؛ submit منفصل عن PASS |
| Equipment / Calibration / Maintenance | 7 | اختيار المعدة بسياق مصادق؛ identifiers التجارية فقط؛ dates typed؛ لا UUID للمشغل |
| Documents / Change Requests | 8 | target selectors بشرية؛ proposed change منفصل عن reason؛ version/context خادمي |
| Administration | 9 | إزالة UUID member lookup واستبداله بمسار Browse members؛ بيانات الصلاحيات تبقى controlled |
| Controlled actions / approvals / release / restore | 6 | decision intent واضح؛ reason dependencies؛ e-sign/re-auth فقط عند policy؛ restore intent لا يدّعي التنفيذ |

## عقد الحقل المستخدم

لكل حقل تم تقييم: الحاجة، الاسم، النوع، القيمة الابتدائية، required، format، allowed values، dependency، توقيت التحقق، help/error، permission، وstate restriction.

- الحقول التقنية (`id`, UUID، version، request identifiers، snapshots) تبقى hidden أو server-derived فقط عندما تحتاجها العملية؛ لا يطلب النظام من المشغل كتابتها.
- الاختيارات المرتبطة بسجل (`equipment`, `template`, `document version`) تعرض business label وتعيد resolution/authorization على الخادم.
- القيم العلمية والحدود والوحدات والـprecision لا تُملأ بافتراضات من الواجهة؛ تأتي من المصدر المتحكم به.
- حالات `PASS`, `RELEASED`, `APPROVED`, `RESTORE VERIFIED` تبقى حقائق منفصلة، ولا يُسمح للـdefault أو label بدمجها.
- أخطاء POST تحتفظ بالقيم، وتعرض inline error مع summary وروابط للحقول، وتستخدم رسالة آمنة بدون SQL/stack/secret.

## الإصلاحات المنفذة

- أزيل نموذج إدخال UUID من `/admin/scopes`؛ الوصول صار عبر سجل الأعضاء المصرح به.
- أزيلت IDs وbackend enums من العرض البشري في Approval review، مع إبقاء المراجع hidden للـserver contract.
- أضيفت labels مرتبطة فعليًا بـ`id` في inspection notes وreturn reason.
- صار زر حفظ draft في inspection يحمل `data-submit` ليدخل عقد منع النقر المكرر.
- صار سبب قرار Approval dependency واضحة: مطلوب عند Return/Reject، مع بقاء تحقق الخادم هو المصدر النهائي.
- أضيفت حواجز regression تمنع عودة UUID exposure أو فقدان label association أو شرط reason.

## حالات لا يجوز اختلاقها

- لم تُضف قيم severity/priority/maintenance type أو scientific limits جديدة؛ الوثائق الحالية لا تعتمد vocabulary كاملة لهذه الحقول.
- لم تتحول حقول release identity إلى defaults قابلة للتعديل؛ هذه أدلة exact يجب أن يراجعها صاحب الصلاحية، والخادم يطابقها مع المرشح.
- لم يُبنَ endpoint جديد لاستبدال UUID admin lookup؛ ذلك يحتاج قرارًا domain/API ومصدرًا معتمدًا للبحث، فتم اختيار المسار الآمن الموجود.

## التحقق

- `pnpm exec astro check` ✅ — 0 أخطاء، 0 warnings، 62 hints قائمة من قبل.
- `pnpm exec vitest run tests/unit/ui/form-ux-contract.test.ts tests/unit/ui/mutation-post.test.ts tests/unit/ui/app-shell.test.ts` ✅ — 61 اختبارًا.
- `pnpm test:unit` ✅ — 68 ملفًا / 422 اختبارًا.
- `pnpm exec astro check` ✅ — 0 أخطاء.
- `pnpm test:architecture` ✅.
- `pnpm build` ✅ — server/client build مكتمل.
- `git diff --check` ✅.
- اختبار المتصفح المصادق، POST/no-JS، الأدوار، stale، وprovider unavailable يحتاج fixture وبيئة تشغيل؛ لا يُعتبر PASS من فحص المصدر.

## الحالة

**نجح محليًا / يحتاج live evidence.** تم إصلاح الملاحظات المؤكدة في المصدر ضمن حدود البيانات والسياسات المعتمدة، مع إبقاء الفجوات التي تتطلب backend fixture أو قرارًا علميًا/تشغيليًا صريحة بدل اختراع سلوك.
