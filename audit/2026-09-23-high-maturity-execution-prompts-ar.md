# برومبتات تنفيذية لرفع نضج نظام QC

> نسخة العمل الأساسية بصيغة Markdown. كل برومبت داخل كتلة نصية مستقلة لنسخه من زر النسخ المعتاد في عارض Markdown. [افتح نسخة الأزرار التفاعلية](2026-09-23-high-maturity-execution-prompts-ar.html) إذا كان العارض لا يوفر زر نسخ لكتل النص.

## طريقة الاستخدام والقياس

نفّذ البرومبتات بالترتيب. البرومبت **01** مطلوب أولًا للشريط الجانبي المتداخل. بعدها يمكن تنفيذ المجموعات المستقلة وفق الاعتمادات المذكورة. لا تطلب من الوكيل «اجعل النسبة 95%» دون عمل؛ اطلب دليلًا جديدًا ثم أعد التقييم. النسب هنا **أهداف نضج دليل** وليست نسب امتثال أو وعدًا بنتيجة. قاعدة التقييم لكل مجال: 0% غياب، 25% تصميم موثق، 50% تنفيذ مع عقد محلي، 75% تكامل وتشغيل معزول، 90% تحقق تشغيلي مع مستخدمين وسجلات، 100% أدلة متكررة على النسخة والبيئة المعنيتين. تُحجب النسبة عند فشل مانع حرج، مهما بلغ متوسط البنود.

**العقد المشترك لكل برومبت:** اقرأ `AGENTS.md` و`.agents/mind/01-mind-latest.md` كاملًا والتعليمات المحلية. تحقّق من HEAD وworking tree واحفظ عمل المستخدم. افحص المصدر والاختبارات والوثائق الحالية؛ لا تعتمد على تقرير سابق كدليل نجاح. اكتب التغيير المحلي المتكامل، واختبر مسار النجاح والرفض والفشل على النسخة النهائية. اذكر الملفات والنتائج والقيود وحالة `DONE/PARTIAL/BLOCKED`. لا تنفذ commit أو push أو deploy أو migration إنتاجية. لا تغيّر سياسة علمية أو سلطة اعتماد أو RPO/RTO بدون مصدر معتمد وقرار مالك موثق. واجهة المنتج إنجليزية قصيرة؛ هذه البرومبتات عربية فقط.

**هدف القياس:** ≥90% في المجالات التي تملك مصادر وسياسات واختبارات وتشغيلًا متاحًا، و≥85% للمجالات التي تحتاج قبولًا بشريًا بعد إتمامه. المجالات المحجوبة بقرار سياسة أو مزود أو UAT تبقى دون الهدف حتى يرد الدليل. أعد احتساب المجالات المئة، كل مجال على حدة، مع مقام ثابت ورابط للدليل وسبب أي حجب.

## 01 — القائمة الجانبية المتداخلة أولًا

مجالات: Navigation / Wayfinding، Information Architecture، Role-Based UX، Keyboard UX، Screen Reader UX، Responsive Design. هدف مشروط: ≥90% بعد اختبار الأدوار والمتصفح.

```text
نفّذ الآن إعادة بناء التنقل الرئيسي إلى قائمة جانبية متداخلة داخل التطبيق، لا مجرد رسم مقترح. ابدأ بجرد كل عناصر src/ui/navigation/navigation.ts ومسارات src/shared/routing/routes.ts وقواعد pageAccessDecision، ثم صمّم شجرة من مستويين بحد أقصى: Overview، Work، Quality، Quarantine، Laboratory، Assets، Governance، Insights، Administration، System؛ اجعل الصفحات الحالية أبناء واضحة، وأعد تنظيم العناصر المساعدة مثل Search وNotifications وAccount وHelp في مواضع مفهومة دون إخفاء وجهة. لا تكرر رابطًا ولا تنشئ route غير موجود. أبقِ بيانات الشجرة مصدرًا واحدًا تستخدمه الواجهة والاختبارات، واحفظ navigationRouteIds وتوافق routeBreadcrumbs والعقود الحالية.

عدّل src/ui/shell/Sidebar.astro وAppLayout وعميل الـdrawer عند الحاجة. لكل قسم زر فتح/إغلاق مستقل عن رابط الوجهة؛ aria-expanded وaria-controls واسم واضح، وقائمة ul متداخلة دلاليًا. افتح سلف الصفحة الحالية تلقائيًا، وأظهر العنصر الحالي بـaria-current='page' ونص/شكل مستقل عن اللون. اجعل Tab وEnter وSpace وEscape، إرجاع التركيز، collapse desktop، drawer mobile/inert، touch targets 44px، 320/390/1440px، 200% zoom، forced colors وreduced motion تعمل. عند تغيير الصفحة لا تفقد السياق. طبّق ترشيح pageAccessDecision قبل عرض القسم؛ لا يظهر قسم فارغ أو رابط مالك محظور، ولا تعتبر إخفاء الرابط تفويضًا للكتابة.

حدّث اختبارات navigation-permissions وapp-shell وuniversal-shell، وأضف عقدًا يمنع ضياع/تكرار route أو إظهار YAZEED_ONLY لغير المالك، واختبار متصفح حقيقي للفتح والإغلاق ولوحة المفاتيح ومقاس الهاتف. سلّم مقارنة قبل/بعد لعدد خطوات الوصول إلى 5 وجهات متكررة. لا تغيّر قواعد الأعمال أو صلاحيات use cases.
```

## 02 — تثبيت خط أساس المرشح وإصلاح بوابات الهندسة

مجالات: Quality Engineering، Testing Architecture، Maintainability، Technical Debt، Architecture، DevEx. هدف مشروط: ≥90% بعد نجاح بوابات المرشح نفسه.

```text
على الحالة الحالية، اجمع baseline جديدًا مع SHA وبصمة working tree ونسخ Node/pnpm. أصلح خطأ typecheck في src/pages/laboratory/tests/index.astro، وانتهاك architecture في src/pages/api/performance-metrics.ts، ومخالفات lint، وصنّف إخفاقات unit الحالية واحدًا واحدًا إلى عيب تنفيذ أو عقد اختبار قديم. أصلح السبب الجذري بلا تخفيف assertion أو حذف اختبار. ابدأ بالفحوص المتأثرة ثم شغّل typecheck وlint وarchitecture وunit وrequirements:check وbuild على نفس الحالة النهائية؛ سجّل المقام والنجاح والفشل والـskips. اربط أي فحص PostgreSQL أو E2E ببيئة مناسبة وسمّه BLOCKED إذا لم تتوفر، ولا تحوّل build PASS إلى Ready.
```

## 03 — قرارات المجال العلمي والمتطلبات والتتبّع

مجالات: Requirements، QC Compliance، QMS Integration، Scientific Workflow، Risk، Data Lineage. هدف مشروط: ≥90% فقط بعد قرارات المالك والتحقق.

```text
صالح Documents/REQUIREMENTS-RECONCILIATION.md وDECISION-ASSUMPTION-REGISTER-026.md وSTATE-MACHINES.md مع use cases الفعلية. لكل PD/RD مفتوح، حدّد owner والسؤال والمصدر الرسمي والقرار والأثر والاختبار وسلوك fail-closed الحالي. ركّز على مصدر نتيجة التفتيش، evaluator المختبر، قرار Reject، حدود الإفراج، سلطة التوقيع، WI/SOP، والـRPO/RTO. لا تخترع limit أو method أو tolerance أو سياسة. عندما يصل قرار معتمد، نفّذ مصدرًا خادميًا مُنسّخًا مع content hash وtrace إلى القياسات/التوقيع، ثم اختبارات قبول إيجابية وسلبية وmigrations عند الحاجة في بيئة معزولة. سلّم مصفوفة requirement → code → test → evidence → status؛ أبقِ غير المحسوم BLOCKED صراحة.
```

## 04 — التفويض والهوية والجلسة

مجالات: Authentication / IAM / RBAC، Security Engineering، Security UX، Session Expiry، Permission UX. هدف مشروط: ≥90% بعد اختبارات رفض بخادم وقاعدة بيانات.

```text
افحص pageAccessDecision وpolicy-registry وuse cases عالية الأثر ومصفوفة الأدوار. اختبر actor حقيقيًا لـEmployee وSupervisor وManager وAdmin وSYSTEM_OWNER غير المسمى وyazeed المسمى عبر مسارات القراءة والكتابة؛ لا تحتسب رفض BAD_REQUEST أو سجلًا غير موجود دليل صلاحية. اختبر ACTIVE/scope/version/SoD/reauthentication، والتزامن وتبدل الصلاحية أثناء الطلب، وlogout/session expiry. أصلح كل مسار يسمح بالكتابة اعتمادًا على إخفاء الواجهة أو role label وحده، وامنح رسائل UX لا تسرب وجود السجل. لا توسّع صلاحيات المالك أو تتجاوز P-04/P-05/P-06. سلّم matrix فيها positive/negative controls ونتيجة الخادم وليس screenshot فقط.
```

## 05 — سلامة البيانات والهجرات والمعاملات

مجالات: Database Reliability، Data Integrity، Concurrency، State Machines، MDM، Data Quality، Auditability. هدف مشروط: ≥90% بعد PostgreSQL 18 حديث.

```text
شغّل PostgreSQL 18 معزولًا على snapshot/fixtures ممثلة، تحقّق من جميع migrations حتى source head، القيود وFK والفهارس وdownstream consumers. اختبر transitions المتنافسة وexpectedVersion وidempotency وrollback atomic للتوقيع/audit/outbox/decision؛ لا تستخدم mock لإثبات atomicity. حوّل سجلات القراءة unbounded فقط بعد نقل scope predicate إلى SQL قبل LIMIT، وراجع query plans على بيانات ممثلة. عرّف قواعد جودة master data وهوية المصدر والتكرار والاستيراد والرفض، مع سجل منشأ وعرض أخطاء قابل للتصحيح. سلّم نتائج counts وزمن query وحدود البيانات والنسخة؛ إذا تعذرت قاعدة معزولة فالنتيجة BLOCKED بلا نسبة تكامل مرتفعة.
```

## 06 — ملفات الأدلة والتوقيع والسجل غير القابل للتلاعب

مجالات: File Security، Electronic Records، E-Signature، Document Control، Privacy، Audit Trail. هدف مشروط: ≥90% بعد إثبات تخزين/استرجاع ورفض.

```text
تتبع دورة كل attachment من الرفع حتى العرض والحذف/الاحتفاظ: MIME الحقيقي والحجم والاسم والفحص والعزل والتخزين والـhash والتفويض والرابط المؤقت وسياسة retention. اثبت أن لا رابط يعيد ملفًا خارج نطاق actor. في التوقيع، اربط reauthentication وهوية الشخص والنية ومعنى القرار ونسخة السجل وhash الدليل داخل transaction واحدة؛ اختبر فشل أي خطوة وrollback كاملًا. لنسخ WI/SOP اختبر draft/review/approve/effective/superseded وsnapshot التاريخي. راجع audit read model كي لا يكشف payload الخام، وأن يكون التسلسل والأثر قابلين للتتبع حتى المصدر.
```

## 07 — رحلة العمل والجودة والمختبر

مجالات: Workflow Correctness، Laboratory UX، Operational UX، Handoff، Compliance UX، Human Factors. هدف مشروط: ≥90% بعد تنفيذ رحلة end-to-end وقبول بشري.

```text
أعد تصميم رحلة Receiving → Inspection → Lab → Review → Release مع NCR/CAPA والوثائق والتسليمات دون كسر PASS ≠ RELEASED. اجعل كل شاشة تبيّن السجل والحالة والمالك والخطوة التالية والسبب والدليل المطلوب، مع وصول مباشر للطابور الصحيح. في مختبر القياس اعرض العينة والطريقة والنسخة والوحدة والقياسات الخام والمعدات وصلاحية المعايرة ومصدر النتيجة بشكل يمكن تدقيقه؛ لا تسمح للمتصفح بحساب نتيجة علمية معتمدة. افصل Save/Submit/Return/Approve/Reject/VOID، وحافظ على النص بعد validation/stale failure. اختبر المسار الذهبي وحالات HOLD، policy missing، provider unavailable، سجل قديم، actor خاطئ، وقياس زمن إنجاز المهمة مع مستخدمين فعليين.
```

## 08 — تعافٍ ونسخ احتياطي واستمرارية

مجالات: Backup/Restore/DR، Reliability، Business Continuity، Incident Management، Capacity. هدف مشروط: ≥90% بعد تمرين مزود وقرار أهداف معتمد.

```text
قارن Documents/BACKUP-RECOVERY-PLAN.md مع src/pages/system/backups/index.astro وrecovery-metrics: أزل إظهار 24h/4h كقيمة معتمدة إذا ظلت POLICY-DEPENDENT؛ اعرض «غير معتمد» مع السبب. اربط scheduler وcatalog وstorage وretention وPITR/WAL إن أجازها مزود النشر، مع مراقبة فشل ومالك استجابة. نفّذ restore drill آمنًا على target معزول لقاعدة معبأة وملفات مرفقة، وقارن row counts وhashes وFK وأذونات التطبيق وسلامة المرشح. احسب RPO/RTO المقاسين من timestamps الدليل بعد اعتماد الأهداف؛ لا تجرّب استعادة على الإنتاج. أضف runbook حادث وقرار إيقاف/عودة، وجرّب الاستجابة والزمن على بيئة ممثلة.
```

## 09 — الرصد والتنبيه وحقيقة جاهزية التشغيل

مجالات: Observability، Monitoring/Alerting، Performance، Reliability، Capacity. هدف مشروط: ≥90% بعد اختبار قناة التنبيه والاستجابة.

```text
عرّف SLI/SLO لكل تدفق حساس: readiness، معاملات الاعتماد، outbox، backup age، migration drift، أخطاء المختبر، latency، saturation. صل telemetry exporter بمجمع معتمد في بيئة اختبار؛ تحقّق من trace/metric/log correlation وredaction وعدم إرسال بيانات QC أو أسرار. اربط alert rules بقناة فعلية ومالك وتصعيد، وأثبت fire/delivery/acknowledgment/recovery باختبار اصطناعي. اعرض في health حالة مصدر الدليل ووقت آخر نجاح/فشل ولا تحوّل UNAVAILABLE إلى صفر أو أخضر. قس p95/p99 وCPU/heap/query load قبل أي ادعاء تحسين أو تخطيط سعة.
```

## 10 — تكاملات تشغيلية مؤمّنة

مجالات: API Governance، Operational Integrations، QMS، Notification Architecture، Secrets Management. هدف مشروط: ≥90% لكل تكامل مُفعّل.

```text
صمّم عقود تكامل منفصلة للأجهزة المخبرية، QMS، هوية المؤسسة، فحص الملفات، CI evidence، والتنبيهات. لكل مصدر: schema/version، source identity، actor mapping، authentication، least privilege، signature، idempotency key، retry/dead-letter، retention، privacy classification، audit، وfailure mode. نفّذ sandbox adapter واحدًا في كل مرة مع contract tests وحالات duplicate/out-of-order/tampered/unavailable. لا تفعّل مزودًا حيًا ولا ترسل بيانات حساسة قبل اعتماد المالك والعقد، ولا تسجل secrets. أثبت تمييز «فشل التسليم» عن «اكتمال قرار الأعمال» في الواجهة والسجل.
```

## 11 — نظام تصميم أصيل للمنظومة كاملة

مجالات: Product/UX/UI Design، Visual Hierarchy، Design System، Component Architecture، Tokens، Typography، Color، Iconography، Motion. هدف مشروط: ≥90% بعد اختبار بصري ووظيفي.

```text
قدّم أولًا ثلاثة اتجاهات أصلية مختلفة لمنتج QC مبنية على عمل المستخدم: غرفة قيادة القرار، مقعد المختبر العلمي، وسجل الدليل الزمني. لا تكرر شبكة البطاقات نفسها أو تبدل الألوان فقط؛ غيّر الإيقاع، كثافة البيانات، الطباعة، التخطيط، وطريقة إبراز الحالة وفق وظيفة كل سطح. اختر اتجاهًا واحدًا بمعايير المقروئية وزمن المهمة، ثم نفّذ مكتبة tokens semantic للألوان والخط/المسافات والكثافة والحركة والحدود، مع مكونات وحالات idle/loading/empty/filtered-empty/error/denied/stale/success. صمّم dashboard وسجلًا كثيفًا ونموذج إدخال وقرار اعتماد وتفصيل سجل وموبايل كنظام متكامل. اجعل الجمال يخدم حقيقة الدليل والحالة؛ لا تستخدم حركات مشتتة أو لونًا وحده. اختبر contrast وforced colors وreduced motion وprint ولقطات مرئية على 320/390/768/1440. وثّق قواعد المساهمة والحوكمة ومنع الانحراف.
```

## 12 — الجداول والبحث والتقارير والتصدير

مجالات: Advanced Tables، Search/Filter/Sorting، Reporting، Data Visualization، Data-Driven Design، Print/PDF/Export. هدف مشروط: ≥90% بعد parity وأدلة مجموعات البيانات.

```text
وحّد registers حول source query خادمي يطبق التفويض والفلترة والفرز والصفحات قبل العرض؛ اجعل العدد ورابط KPI يعيدان نفس المجموعة وبنفس نطاق actor. أظهر مصدر الرقم ووحدته وفترته ونطاقه وحداثته؛ فرّق EMPTY وFILTERED EMPTY وUNAVAILABLE وNOT AUTHORIZED. لكل جدول: caption، row identity، sort semantics، bulk action واضح، كثافة قابلة للضبط بدون إخفاء الأدلة. اجعل البحث لا يسرب أسماء سجلات غير مصرّح بها أو النص الخام للتحليلات. للتقارير وPDF/print/export أضف هوية المرشح والوقت والنطاق والحالة والمصدر ووسم غير معتمد حيث يلزم؛ اختبر CSV formula injection والترميز وفلاتر الصلاحية والتطابق مع الشاشة على بيانات معبأة.
```

## 13 — الوصول، الاستجابة، وكتابة التجربة

مجالات: Accessibility، Keyboard/Focus، Screen Reader، Responsive، UX Writing، Error Recovery، Loading، Draft/Autosave، Destructive Actions. هدف مشروط: ≥90% بعد axe + تقنيات مساعدة + مستخدمين.

```text
افحص الرحلات الأساسية في متصفح مصادق على 320/375/414/768/1024/1440 و200% zoom وtext spacing، ولوحة مفاتيح فقط وVoiceOver/NVDA وaxe؛ أصلح مشاكل الترتيب الدلالي، أسماء الحقول، error summary، focus return، live regions، overflow، touch target، والتباين. حافظ على عمل POST الأساسي بلا JavaScript حيث يمكن، وأغلق أسطح transition التسعة JS-only تدريجيًا مع no-JS fallback حقيقي. لكل form: بيانات محفوظة بعد الخطأ، سبب محدد، تصحيح متاح، وstale conflict لا يعيد الإرسال تلقائيًا. اجعل الحذف/VOID/اعتماد التوقيع يوضح أثره قبل التأكيد. وثّق نتائج البشر والعوائق بدل ادعاء WCAG كامل من فحص آلي فقط.
```

## 14 — الخصوصية وأمن التطبيق وسلسلة الإمداد

مجالات: AppSec، Privacy Engineering/UX، Secure SDLC، Dependency Management، Secrets. هدف مشروط: ≥90% بعد فحوص حيّة وإغلاق عالي الخطورة.

```text
ابنِ threat model للهوية والملفات وAI والتقارير وعمليات الموافقة، ثم افحص input boundaries وCSRF وXSS وSSRF وinjection والحد من المعدل وتسريب الأخطاء والheaders/CSP. راجع cookies/session وsecrets paths دون طباعتها. اربط dependency audit وSBOM والتراخيص وartifact provenance بمرشح واحد في CI، مع triage وثغرات عالية الخطورة ومالكين ومواعيد. اختبر رفض cross-scope وtampered signature وexpired link وpoisoned import على خادم وقاعدة فعلية؛ لا تعد نجاح lint فحص أمن. أوضح للمستخدم متى تغادر بياناته النظام في أي ميزة طرف ثالث قبل الإرسال.
```

## 15 — AI advisory بضوابط بشرية

مجالات: AI Governance، AI Evals، Model Risk، Human-in-the-Loop AI UX. هدف مشروط: ≥85% بعد تقييم حالات حقيقية وسياسة معتمدة.

```text
احصر AI advisory كاقتراح لا قرار QC معتمد. حدّد بيانات الدخول المسموحة والمحظورة، مزودها ومكان المعالجة وretention وconsent، وأبقِ fail-closed إذا غاب مصدر السياسة. ابنِ مجموعة evals ببيانات مصرح بها تغطي hallucination ورفض الطلبات الحساسة وprompt injection وتبدل السياق والحالات متعددة اللغات، مع version للموديل والبرومبت والمعايير. اعرض provenance والثقة والحدود وتاريخ التوليد ومسار تصحيح المستخدم؛ لا تسمح للنتيجة بتغيير PASS/FAIL/HOLD أو الإفراج أو توقيع إلكتروني مباشرة. اختبر أن الفشل أو عدم التوفر لا يحجب سير QC الأساسي ولا يرسل محتوى حساسًا دون موافقة.
```

## 16 — النشر والبيئات وحوكمة الإصدار

مجالات: CI/CD، Deployment، Environment Management، Change/Configuration Management، Release Governance. هدف مشروط: ≥90% بعد تطابق بيئة فعلية وأدلة بوابة.

```text
قارن بيئات dev/test/staging/prod مع render.yaml والإعدادات الفعلية بطريقة read-only أولًا. صحّح انحراف runtime/health check/auto deploy/subdomain/env وفق خطة تغيير معتمدة، وحدّد migration forward-only وrollback وحدود البيانات. اجعل CI ينتج أدلة موقعة ومرتبطة بـcommit+artifact digest+schema head+environment لكل typecheck/lint/unit/integration/E2E/security/accessibility/build، ولا يقبل browser ادعاء PASS. اختبر promotion gate على المرشح نفسه وقرار NO-GO عند missing/stale/mismatched evidence أو migration drift. لا تنشر ولا تنفذ migration إنتاجية ضمن هذا البرومبت دون تفويض صريح مستقل.
```

## 17 — تجربة الخدمة والاختبار البشري

مجالات: UX Research، Task Success، Service Design، Operational UX، Design QA، Human Factors. هدف مشروط: ≥85% بعد UAT موقع ومقاييس قابلة للإعادة.

```text
اكتب سيناريوهات عمل تمثل Employee/Supervisor/Manager ومالك النظام: إنشاء استلام، تفتيش، قياس، إرجاع، اعتماد، HOLD، وثيقة، incident. جهّز بيانات معزولة وحسابات حقيقية وفق الدور بلا مشاركة أسرار. قس task success ووقت المهمة والأخطاء والعودة للخلف واكتشاف الصلاحية لـ5 مستخدمين على الأقل لكل رحلة حرجة مناسبة؛ دوّن الملاحظات حرفيًا بعد موافقتهم. اختبر فهم PASS ≠ RELEASED ومعنى التوقيع وحالات UNAVAILABLE. أصلح مشاكل P0/P1 ثم أعد الجلسة على نفس المرشح، وسجّل UAT sign-off أو الرفض من مالك بشري؛ لا تصطنع قبولًا أو تتولى توقيعًا عنه.
```

## 18 — إقفال المخاطر وإعادة القياس المستقل

مجالات: QMS، Risk، Verification/Validation، Auditability، Operational Readiness، جميع المجالات المئة. هدف مشروط: ≥90% فقط بعد اكتمال الأدلة والبوابات.

```text
بعد تنفيذ البرومبتات السابقة، أنشئ سجل evidence جديدًا من الكود والاختبارات وبيئة التشغيل والقبول البشري على SHA/artifact/schema/environment واحدة، ولا تنسخ نتيجة التقرير السابق. أعد تقييم المجالات المئة بنفس rubric الثابت: evidence link، owner، status، score، blockers، وتاريخ الدليل. امنع score >75% إن غاب التكامل الحقيقي، و>90% إن غابت أدلة تشغيل أو قبول مطلوبة؛ اجعل المجالات POLICY-DEPENDENT وUAT/BLOCKED صريحة. أعد حساب المتوسط الموزون من القيم الفعلية مع المقام، ولا تخفِ فشل gate بمتوسط مرتفع. سلّم قرار GO/NO-GO مع قائمة مانعات دقيقة وخطة معالجة وقياس قبل/بعد؛ يبقى NO-GO إذا كانت health NOT READY أو migrations متأخرة أو restore/UAT/release identity غير متحققة.
```

## خريطة الاعتمادات المختصرة

`01 → 11/13`، `02 → جميع التحققات اللاحقة`، `03 → 05/07/08/15`، `04/05 → 06/07/12`، `08/09/10/14/16 → 18`، `11/12/13 → 17 → 18`.

**حدود الدليل الحالي:** التقرير المؤرخ 2026-09-23 سجّل متوسطًا استدلاليًا 49% فقط؛ هذه البرومبتات لا ترفع تلك النسبة تلقائيًا. عند الفحص المحلي السابق فشلت 15 حالة unit، وtypecheck/architecture/lint، وتعذر PostgreSQL/E2E الحديث. المشاهدة الحية أظهرت NOT READY وschema أقدم من المصدر وrestore غير متحقق. أعد التحقق قبل التنفيذ لأن الحالة قد تتغير.
