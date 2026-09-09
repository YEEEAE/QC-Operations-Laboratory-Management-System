# تدقيق واجهة الإنتاج وتدفقات العمل — qclevel.top

**التاريخ:** 2026-09-09  
**الحساب:** `yazeed` (`SYSTEM_OWNER`)  
**النمط:** جولة فحص للبيئة الإنتاجية للقراءة فقط؛ ما تم إنشاء أو تعديل أو اعتماد أو إفراج أو استعادة أو حذف أي سجل أعمال.  
**الحكم:** **محجوب — النتيجة الإجمالية 68%**

## النطاق والأدلة

- تم تسجيل الدخول بنجاح عبر `/login` والتأكد من ظهور مجموعات التنقل التسع.
- تم فتح وجهات التنقل **25/25** الظاهرة للحساب.
- تم فتح مسارات الإنشاء **9/9** المكتشفة من صفحات القوائم الحالية.
- تم فحص حقول النماذج وتسمياتها وأزرارها وحالات الفراغ وعناوين الصفحات والعناوين الرئيسية ووجهات المسارات والأسماء الميسّرة.
- تم اختبار صفحات ممثلة بعرض 320 بكسل: لوحة المعلومات والمهام وإنشاء الاستلام وإنشاء طلب التغيير وصحة النظام.
- تم قياس تباين نص لوحة المعلومات المرسوم؛ ولم تُرصد عينة نص عادي أقل من نسبة WCAG AA ‏4.5:1.
- تمت مطابقة واجهة الإنتاج مع بيان المسارات المعتمد والتنفيذ الحالي في `src/pages`.
- تم التحقق خارجيًا: `/api/health/live` = HTTP 200 `healthy`؛ و`/api/health/ready` = HTTP 200 `healthy`.

تعذر اختبار مساحات التفاصيل والمراجعة والتنفيذ والاستعادة الديناميكية لأن الإنتاج ما فيه سجلات أعمال أو مجموعات نسخ احتياطية مقابلة. ولم تُرسل أي تغييرات مضبوطة عمدًا.

## منهج احتساب النتيجة

| المجال | الوزن | النتيجة | الناتج الموزون |
| --- | ---: | ---: | ---: |
| إمكانية الوصول للمسارات والتنقل | 20% | 96% | 19.2 |
| اكتمال الإنشاء وتدفقات العمل | 25% | 64% | 16.0 |
| الاعتمادية والأخطاء والواقع التشغيلي | 20% | 55% | 11.0 |
| أسس الإتاحة ولوحة المفاتيح | 15% | 82% | 12.3 |
| التجاوب مع المقاسات | 10% | 55% | 5.5 |
| اللغة والاتساق والصقل | 10% | 42% | 4.2 |
| **الإجمالي** | **100%** |  | **68.2% ← 68%** |

النسبة درجة تدقيق وليست إعلان جاهزية للإنتاج. أي مشكلة **عالية** غير محلولة تبقي الحكم «محجوب» مهما كان المتوسط.

## تغطية مسارات الإنشاء

| المجال | مدخل الإنشاء | النتيجة |
| --- | --- | --- |
| المهام | `/tasks/new` | موجود |
| الملاحظات | `/quality/findings/new` | موجود |
| الاستلام | `/quarantine/receiving/new` | موجود |
| المختبر | `/laboratory/tests/new` | موجود |
| المعدات | `/assets/equipment/new` | موجود |
| المعايرة | `/assets/calibrations/new` | موجود |
| الصيانة | `/assets/maintenance/new` | موجود |
| طلبات التغيير | `/change-requests/new` | موجود |
| الوثائق المضبوطة | `/documents/new` | موجود |
| المستخدمون | `/admin/users/new` | **مفقود** |
| NCR | تم حجب الإنشاء المباشر عمدًا إلى حين اعتماد السياسة | غير معروض بشكل صحيح |
| RCA | إنشاء سياقي من NCR | غير معروض عالميًا بشكل صحيح |
| CAPA | تم حجب الإنشاء المباشر عمدًا إلى حين اعتماد السياسة | غير معروض بشكل صحيح |
| الفحوصات | تُنشأ من تدفق الاستلام؛ ما فيه `/new` عام | غير معروضة بشكل صحيح |

## المشاكل مرتبة حسب الأولوية

| المعرّف | الخطورة | المشكلة والدليل | الحل المتكامل |
| --- | --- | --- | --- |
| F-01 | **HIGH** | **صحة النظام تناقض نقطة الجاهزية الفعلية.** الصفحة الموثقة عرضت `Core system: NOT READY` و`database UNAVAILABLE`، بينما نقطتا النظام أعادتا HTTP 200 بحالة سليمة. فحص الواجهة يفتح `pg.Client` جديدًا من `DATABASE_URL` (`src/modules/system-health/infrastructure/postgres-health-probes.ts:22`) بدل إعادة استخدام فحص قاعدة البيانات وTLS المهيأ والمعتمد. | خلِّ العرضين يستهلكان عقد فحص جاهزية مشتركًا بنفس إعداد TLS ودلالات المهلة. أضف اختبار انحدار يثبت تطابق حالة قاعدة البيانات في الواجهة مع `/api/health/ready` لنفس نتيجة الاعتمادية، مع إبقاء التفاصيل منقّحة. |
| F-02 | **HIGH** | **الإدارة مفقودة لدور Admin والحساب `yazeed`.** البيان المعتمد يحدد `/admin` والمستخدمين والمستخدم الجديد والأدوار والصلاحيات والنطاقات، لكن ما فيه أي منها داخل `src/pages`، والتنقل بلا مدخل Administration (`src/ui/navigation/navigation.ts:16`). هذا يوقف إضافة المستخدمين وإدارة الوصول، ومنها زر **Create user** المتوقع. | نفّذ المسارات `/admin` و`/admin/users` و`/admin/users/new` و`/admin/users/[id]` و`/admin/roles` و`/admin/roles/[id]` و`/admin/permissions` و`/admin/scopes`، واسمح بها فقط لدور `Admin` والحساب `yazeed` مع صلاحيات صريحة واستعلامات خادمية محددة النطاق وإصدارات تفاؤلية وتدقيق واختبارات رفض. أضف مجموعة/مدخل Administration للجهات المصرح لها، مع إبقاء صحة النظام حصرية على `yazeed`. |
| F-03 | **HIGH** | **مقاس 320 بكسل يسبب تمريرًا أفقيًا في كل الصفحات الممثلة المختبرة.** دليل المتصفح أظهر أن `scrollWidth` أكبر من العرض الفعلي في لوحة المعلومات والمهام وإنشاء الاستلام وإنشاء طلب التغيير وصحة النظام. يفرض `html` و`body` حدًا أدنى ثابتًا `min-width:320px` (`src/ui/styles/global.css:21,26`)، كما يضيف الغلاف هوامش للجوال ودرجًا ثابتًا (`src/ui/layouts/AppLayout.astro:27`). | أزل الحد الأدنى العام الثابت، واستخدم `min-width:0` لعناصر الشبكات والمرن، وأبقِ الدرج خارج الشاشة بالكامل بقواعد inset/translate منطقية. أضف تأكيدات Playwright عند 320 بكسل وتكبير 200% بأن `scrollWidth <= clientWidth` وأن كل الإجراءات الأساسية قابلة للوصول. |
| F-04 | **HIGH** | **عدة تدفقات إنشاء تفشل بلا رسالة استعادة مفيدة.** نماذج المعدات والمعايرة والصيانة والوثائق تضبط فقط `aria-invalid=true` على النموذج كاملًا عند رجوع خطأ من Action (`src/pages/assets/equipment/new.astro:9`، `src/pages/assets/calibrations/new.astro:7`، `src/pages/assets/maintenance/new.astro:7`، `src/pages/documents/new.astro:12`). ما فيه خطأ ظاهر يوضح وش فشل أو وش المطلوب إصلاحه. | أضف ملخصًا ثابتًا بـ`role="alert"`، واربط أخطاء التحقق بجانب الحقول مع `aria-invalid` و`aria-describedby`، وركّز أول حقل غير صالح، واحتفظ بالقيم المدخلة، واعرض مسار إعادة المحاولة لأخطاء الاعتمادية. اختبر نتائج الإدخال غير الصالح وغير المصرح والتعارض وتعذر الاعتمادية. |
| F-05 | **HIGH** | **معظم نماذج الإنشاء تعتمد بالكامل على JavaScript في العميل وتستخدم GET افتراضيًا.** المهام والمختبر والمعدات والمعايرة والصيانة وطلبات التغيير والوثائق لا تحدد `method="post"`؛ وإذا تعطل سكربت العميل أو مُنع، يتحول الإرسال إلى تنقل بسلسلة استعلام ولا يعمل إجراء الإنشاء. وقد تتضمن بيانات طلب التغيير لقطة هدف وقيمًا مقترحة. | استخدم إجراءات POST حقيقية وبدائيات التحسين التدريجي في Astro كأساس. يسمح لـJavaScript بتحسين حالة الانتظار وإعادة التوجيه، لكن لا يكون مسار التغيير الوحيد. تأكد أن حمولات الأعمال الحساسة لا تدخل عناوين URL. أضف تغطية E2E بلا JavaScript لكل مسار إنشاء من Tier-2. |
| F-06 | **MEDIUM** | **نماذج الإنشاء تطلب معرّفات داخلية خامًا وقيم رموز غير مضبوطة.** أمثلة ذلك UUID لقالب المختبر والمعدات وهدف طلب التغيير ونوعه ونوع البيانات، وإدخال أرقام المهام والملاحظات والاستلام والمعدات يدويًا. هذا يجعل العمل اليومي معرضًا للخطأ ويكشف مفاهيم التنفيذ للمشغلين. | استبدل إدخال UUID/الرموز الخام بقوائم بحث مرتبطة بالخادم ومصرح بها وروابط إنشاء سياقية. ولّد معرّفات الأعمال على الخادم من قواعد ترقيم معتمدة. استخدم قوائم مضبوطة للتعدادات، واحتفظ بالـUUID فقط كمعرّف مخفي بعد الاختيار. |
| F-07 | **MEDIUM** | **واجهتا التدقيق غير متطابقتين.** عرضت «النشاط الأخير» في لوحة المعلومات `GRANT_SYSTEM_OWNER_ACCESS`، بينما عرض `/audit` عدد `0 events` لنفس مالك النظام المسجل. | تتبع شروط استعلام لوحة المعلومات والتدقيق ومرشحات الصلاحيات/النطاقات وافتراضات الترقيم. عرّف خدمة استعلام تدقيق معتمدة وموحدة، واختبر نفس الممثل/البيانات عبر الواجهتين، واعرض شرحًا واضحًا للمرشح إذا كان الاختلاف مقصودًا. |
| F-08 | **MEDIUM** | **التطبيق إنجليزي فقط ويفرض LTR في تجربة الإنتاج المدققة.** جذر الوثيقة كان `lang=en` و`dir=ltr`، والصفحات التشغيلية تمرر الإنجليزية/LTR صراحة رغم استهداف الجمهور السعودي. | أضف نصًا عربيًا معتمدًا ومبدّل لغة، واحفظ التفضيل على الخادم أو في مخزن آمن. استخدم `lang="ar"`/`dir="rtl"` وCSS منطقيًا و`<bdi>` للمعرّفات المختلطة، وشغّل اختبارات تطابق RTL/الإنجليزية. لا تترجم المصطلحات العلمية المضبوطة آليًا بلا اعتماد. |
| F-09 | **MEDIUM** | **إنشاء الملاحظات والمختبر يفتقد التنقل بالإلغاء/الرجوع.** المساران `/quality/findings/new` و`/laboratory/tests/new` يعرضان إجراء الإرسال فقط، بخلاف صفحات الإنشاء السبع الأخرى. | أضف زر `Cancel` ثانويًا ثابتًا وتنقلًا سياقيًا `Back to …`، واحفظ سياق الرجوع الآمن للقائمة، وخَلِّ الإجراء الأساسي مميزًا بصريًا. |
| F-10 | **MEDIUM** | **إدارة الحجر قراءة فقط ومساحة Administration الأوسع غير موجودة.** يقدر المشغلون يشوفون سياق القالب المعتمد، لكن ما يقدرون يدخلون تدفق إدارة مضبوط حتى مع صلاحيات المالك الصريحة. | افصل عرض المراجع للقراءة فقط عن إدارة القوالب/الإصدارات المضبوطة. أضف مسارات الإنشاء/الإصدار/المراجعة فقط عند وجود سياسات معتمدة، مع دورة مسودة/إصدار وفصل مهام وتوقيع إلكتروني عند الحاجة ودليل تدقيق. خلِّ الاعتمادات غير المعرفة مرفوضة. |
| F-11 | **MEDIUM** | **فجوات القدرة التشغيلية ظاهرة:** تخزين الكائنات `UNKNOWN`، وفهرس النسخ الاحتياطية فارغ بلا مزود، ومزود الذكاء الاصطناعي غير معروف/غير مهيأ، وسياسات إغلاق NCR/CAPA ما زالت غير محسومة. | تعامل معها كعوائق نشر/سياسة متتبعة، مو مجرد تحذيرات شكلية. هيّئ المزودين المعتمدين، وأنتج دليل اختبار الاستعادة، وخذ قرارات السياسة المضبوطة قبل تفعيل الأزرار الحساسة. لا تحول التحذيرات إلى أخضر بلا دليل وقت التشغيل. |
| F-12 | **LOW** | **مفردات الإجراءات وحالة الأحرف غير متسقة.** أمثلة: `Create Task` و`Create receiving item` و`New document` و`Save Draft` و`Save controlled draft` و`Create draft`. | اعتمد مفردات موحدة بحالة جملة: `Create task` و`Save draft` و`Create receiving item` و`Create document`. احجز `Submit` و`Approve` و`Release` و`Make effective` للانتقالات المضبوطة الخاصة بها. |

## وش اللي اشتغل بشكل جيد

- نجح تسجيل الدخول، وأظهر فلتر الصلاحيات على الخادم كل مجموعات التنقل المنفذة حاليًا.
- كل وجهات التنقل الأساسية الـ25 ظهرت بدون 404/500 أثناء الجولة.
- كل صفحات الإنشاء التسع المنفذة حاليًا كانت متاحة لـ`yazeed`.
- كل عنصر نموذج تم فحصه له تسمية ظاهرة؛ وعناصر الغلاف ذات الأيقونة فقط لها أسماء ميسّرة.
- توجد وصلة تخطي ومعلم رئيسي واحد وCSS للتركيز الظاهر وعناصر أصلية وارتفاع تحكم لا يقل عن 40 بكسل وCSS لتقليل الحركة.
- اجتاز تباين النص المأخوذ من لوحة المعلومات حد WCAG AA ‏4.5:1.
- ما زال PASS وReleased منفصلين بصريًا ومفهوميًا.
- الإجراءات المضبوطة الحساسة مثل إنشاء NCR/CAPA المباشر وإنشاء الفحص العام والاستعادة غير معروضة بلا سياسة/سياق معتمد.

## ترتيب التنفيذ

1. **P0 — صحة البيانات والوصول:** F-01 وF-02 وF-07.
2. **P0 — إكمال المهام والسلامة:** F-04 وF-05.
3. **P1 — التشغيل المتجاوب:** F-03.
4. **P1 — كفاءة المشغل:** F-06 وF-09.
5. **P1/P2 — التعريب والاتساق:** F-08 وF-12.
6. **مسار السياسة والنشر:** F-10 وF-11؛ إبقاء السلوك الحساس غير المعرّف مرفوضًا إلى أن يُعتمد.

## البرومبتات التنفيذية

### Prompt 1 — Unify health truth

> Fix F-01 from `audit/2026-09-09-production-ui-audit.md`. Make the authenticated System Health page and `/api/health/ready` consume the same canonical database readiness probe and TLS configuration. Preserve sanitized output. Add unit and integration tests proving both surfaces agree for healthy, unavailable, and configuration-error cases. Run typecheck, lint, unit/integration tests, build, and a production-like HTTP smoke test. Do not weaken TLS or expose connection details.

### Prompt 2 — Build Administration and Create User

> Implement F-02 as a controlled Administration workspace matching `Documents/ROUTE-MANIFEST-SPECIFICATION.md`: `/admin`, `/admin/users`, `/admin/users/new`, `/admin/users/[userId]`, `/admin/roles`, `/admin/roles/[roleId]`, `/admin/permissions`, and `/admin/scopes`. Add permission-aware navigation. Reuse existing administration/identity application use cases; do not put SQL or business rules in Astro pages. Enforce default deny, scope, version, self-grant protection, audit, and session invalidation rules. Add positive and negative route/action tests, including Admin-role-without-permission denial and SYSTEM_OWNER visibility. No commit or push.

### Prompt 3 — Make every create form resilient and accessible

> Fix F-04 and F-05 across Tasks, Laboratory, Equipment, Calibration, Maintenance, Change Requests, Documents, Findings, and Receiving. Give every mutation form a real POST baseline, preserve Astro Actions and server-side reauthorization, and make JavaScript enhancement optional. Add visible error summaries, field errors, focus management, pending state, retained values, conflict/dependency recovery, and safe redirects. Ensure no business payload enters the URL. Add no-JS and JavaScript E2E tests for validation failure and successful creation using disposable data. No production records.

### Prompt 4 — Close the 320px/200% responsive blocker

> Fix F-03 using the existing design tokens and logical CSS. Remove the global minimum-width overflow, harden the shell/drawer and form grids, and verify Dashboard, list pages, long create forms, tables, and System Health at 320px width and 200% zoom in both LTR and RTL. Add automated assertions that no critical control is clipped and no page-level horizontal overflow exists. Preserve accessible focus, Escape-to-close, and focus return for the mobile drawer.

### Prompt 5 — Replace raw IDs with authorized selectors

> Fix F-06 and F-09. Replace raw template/equipment/target UUID fields with authorized searchable selectors or contextual create routes. Replace free-text enumerations with controlled options, and generate business identifiers server-side only from approved numbering sources. Add consistent Cancel/back controls and safe list return context. Do not invent numbering, scientific, calibration, approval, or retest policy. Add authorization, empty/loading/error, keyboard, and stale-selection tests.

### Prompt 6 — Arabic/RTL and UX vocabulary pass

> Fix F-08 and F-12 with an approved bilingual localization layer. Add Arabic and English UI copy, locale switching, correct `lang`/`dir`, logical layout rules, and bidi isolation for mixed IDs. Standardize sentence-case action vocabulary without changing controlled action semantics. Verify representative dashboards, lists, forms, errors, and confirmation dialogs in Arabic RTL and English LTR at desktop and mobile widths. Do not translate controlled scientific terminology without an approved source.

### Prompt 7 — Resolve audit inconsistency

> Fix F-07 by tracing Dashboard Recent Activity and `/audit` through their authorization/scope predicates. Consolidate on one canonical audit-query contract where appropriate, preserve existence-leakage protections, and add a regression fixture where the same actor sees the same qualifying event on both surfaces. Add pagination/filter tests and prove no raw payload or secret is exposed.

### Prompt 8 — Operational closure package

> Address F-10 and F-11 as a controlled policy/deployment package. Inventory storage, backup/restore, AI provider, quarantine template management, NCR/CAPA closure, and approval authorities. Separate implementation gaps from policy decisions. Keep undefined sensitive actions DENY. Produce current provider evidence, backup artifact integrity, isolated restore verification, and UAT evidence before changing any readiness status. Do not claim 100% or production ready from documentation alone.

## الحكم النهائي

غلاف الإنتاج قابل للوصول بدرجة واسعة وعنده أساس جيد للعمليات المضبوطة، لكنه **غير مكتمل تشغيليًا**. نتيجة صحة النظام الخاطئة، وغياب مساحة Administration/Create User، ومسارات الإنشاء الهشة المعتمدة على العميل فقط، والأخطاء بلا استعادة، والتمرير في الجوال؛ كلها تمنع الإصدار. درجة التدقيق الإجمالية: **68% — محجوب**.
