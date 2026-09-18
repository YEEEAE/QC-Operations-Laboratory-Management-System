# مراجعة حية للداشبورد — qclevel.top (قراءة فقط)

> التاريخ: 2026-09-18 | الحساب: `yazeed` (SYSTEM_OWNER، GLOBAL) | الأداة: متصفح آلي Chrome DevTools + قراءة الكود على HEAD `8f54442`
> النطاق: `/dashboard` مباشرة على الإنتاج، مع فحص الشِل المشترك (Topbar/Sidebar/UserMenu) ومقارنته بالمصدر.
> **حدود الأدلة:** مراجعة سطحية حية + قياسات DOM/CSS/شبكة/console/Lighthouse. ليست اختبار WCAG شاملًا، ولا UAT، ولم تُختبر أدوار أخرى (Supervisor/Employee). `PASS` هنا لا يعني إفراجًا.

## ملخص تنفيذي

الداشبورد يعمل والبنية الأساسية سليمة (SSR، fail-closed، تعريفات KPI، تباين مقبول، Lighthouse a11y = 100 في snapshot مع استثناء واحد). لكن المراجعة الحية كشفت **عيبًا بصريًا جهازيًا** (كل الصفحات المصادق عليها تُعرض بخط Times بدل Sans)، و**روابط drill-down لا تنفّذ الفلترة الموعودة**، و**عدم اتساق بين عدّاد وقائمة القرار**، وعرض **UUID داخلي كم هوية مستخدم**، و**طبقة Lottie لا تعمل أبدًا تحت CSP الإنتاج مع تكلفة 2.4MB لكل تحميل**. أعلى 4 إصلاحات كلها منخفضة الجهد وعالية الأثر.

## النتائج (بترتيب الخطورة، مقياس 0–4)

### 1. الخط: الواجهة المصادق عليها كلها تُعرض بخط Times (serif) — خطورة 3
- **الدليل الحي:** قياس عرض نص فعلي على الصفحة = 599.6px مطابق تمامًا لمقياس Times (599.5px) وليس لمقياس `var(--font-sans)` (613.2px) أو Helvetica (642.2px). `getComputedStyle(body).fontFamily` = `Times`.
- **السبب الجذري:** في `src/ui/styles/global.css` قاعدة `body { font-family: var(--font-sans); ... }` ثم في الأسطر 132–137 قاعدة `body, button, input, select, textarea { font: inherit; }`. الـshorthand `font: inherit` يشمل `font-family` ويأتي **بعد** قاعدة الخط، فيلغيها على `body` وتنتقل الوراثة إلى `html` بلا خط → الافتراضي Times. مؤكد في البناء المنشور: في `dist/client/_astro/login.CdNyMdNN.css` قاعدة الخط عند offset 5813 والـreset عند 6983.
- **ملاحظة إضافية:** `@font-face { src: local('Inter') }` يفشل على العملاء غير المثبّت لديهم Inter (`document.fonts.check('16px Inter') = false`)، و`--font-display` قيمة فارغة. حتى بعد الإصلاح سيسقط الخط إلى `ui-sans-serif`؛ إدراج Inter فعليًا يحتاج ملف woff2 محلي (قرار asset-pipeline وفق قواعد المشروع).
- **الإصلاح المقترح:** حذف `body` من قائمة محددات `font: inherit` (تصبح `button, input, select, textarea`)، أو نقل قاعدة خط body بعد الـreset. سطر واحد تقريبًا، أثره على كل الصفحات.

### 2. روابط drill-down للـKPI لا تنفّذ الفلترة الموعودة — خطورة 3
- تم التحقق حيًا: الرابط `Open HOLD records` → `/quarantine/receiving?inspectionResult=HOLD` **يتجاهل الـparam بصمت**؛ صفحة الاستقبال تقرأ فقط `state` (`src/pages/quarantine/receiving/index.astro:9`) ويبقى الفلتر "All states"، والفراغ يظهر برسالة "no records matching the selected state" رغم عدم اختيار أي حالة (نص مضلل).
- `Open released records` → `?workflowState=RELEASED` — نفس المشكلة.
- `Inspection PASS` → `/quarantine/inspections` بلا فلتر result، والصفحة لا تدعم أصلًا فلترة بنتيجة PASS (فقط workflow state) → لا يمكن للمستخدم الوصول إلى المجموعة المعدودة أبدًا.
- `Open review queue` → `/approvals` — متسق.
- **الإصلاح:** إما دعم `inspectionResult`/`workflowState` كفلاتر canonical في صفحات القوائم (مع إظهار الفلتر المطبق في الـUI)، أو تغيير الروابط إلى وجهات مدعومة فعلًا.

### 3. قيم KPI "شخصية" بينما النصوص تقول "Scope" — خطورة 3
- الاستعلام (`src/modules/dashboard/infrastructure/postgres-dashboard-query.ts`) يقيّد كل العدادات بـ`author_id/created_by = actor.id`، بينما الترويسة والـscopeLabel يقولان "Authorized operational scope". نتيجة حية: yazeed بـGLOBAL يرى أصفارًا كاملة بينما قد يوجد عمل غيره.
- **الإصلاح:** إما رفع الاستعلام إلى نطاق الصلاحيات الفعلي، أو صياغة صريحة "My records in scope" وتحديث تعريفات الـKPI لتطابق المعنى المحسوب.

### 4. قائمة القرار لا تطابق عدّاد "Pending review" — خطورة 2
- الـKPI يحسب عناصر approval work items المسندة للمستخدم، لكن قائمة "Items needing a decision" تعرض فقط receiving HOLD الذي أنشأه (`LIMIT 8`) → يمكن أن يظهر "4 pending review" مع "لا عناصر تحتاج قرارًا" في الشاشة نفسها. أيضًا `severity: 'CRITICAL'` غير قابل للحدوث في الاستعلام الحالي (كل شيء `WARNING` → بادج `HOLD`) فتلوين الأولوية ثابت بلا معنى.
- **الإصلاح:** اجعل الـqueue يجمع approval work items + HOLD بترتيب أولوية، واربط الأعداد، وفعّل مستويات الخطورة الفعلية أو احذف التمايز.

### 5. هوية المستخدم في الشريط العلوي = UUID داخلي — خطورة 2
- حيًا: يظهر `01a07e39-b3d7-7357-b05b-1eb0d11b08fb` + "Authenticated user". السبب: `src/ui/layouts/AppLayout.astro:16` يمرر `userName={actor?.id}`، و`src/ui/shell/UserMenu.astro` يستخدم افتراضي `role = 'Authenticated user'`. هذا يخالف فصل الهوية الداخلية `id` عن `loginIdentity` المعتمد في المشروع.
- **الإصلاح:** تمرير `actor?.loginIdentity` (أو اسم عرض مشتق خادميًا) ودور/نطاق حقيقي.

### 6. إمكانية وصول: Label in Name (WCAG 2.5.3) — خطورة 2 (Lighthouse: serious)
- زر البحث في الشريط: النص المرئي "Search" + `Ctrl K` والاسم accessible "Search authorized records (Control K)" — النص المرئي "Ctrl K" غير مشمول حرفيًا (`src/ui/shell/Topbar.astro:8`).
- **الإصلاح:** دمج الصيغة الحرفية "Ctrl K" في الاسم أو `aria-hidden="true"` على عنصر `kbd`.


### 7. طبقة Lottie لا تعمل أبدًا تحت CSP الإنتاج + تكلفة شبكة — خطورة 2
- حيًا: 4 أخطاء console (`dotlottie-player.wasm` مرفوض بسبب `unsafe-eval` في CSP)، والـWASM (1,238,072 بايت) يُنزّل **مرتين** في كل تحميل ثم يُهمل، ويبقى fallback التدرج دائمًا. `background.lottie` يُجلب أيضًا (206).
- **الإصلاح:** قرار واحد من اثنين: إضافة `wasm-unsafe-eval` إلى `script-src` (يحتاج مراجعة أمنية)، أو إسقاط طبقة Lottie والإكتفاء بالتدرج — يوفر ~2.4MB نقلًا وأخطاء console على كل صفحة مصادقة.

### 8. نصوص دقيقة بحجم 10px — خطورة 1–2
- `SOURCE/WINDOW/Updated` في KPI و`user-copy small` = 10px. التباين 4.84 يمر AA، لكن الحجم ضعيف القراءة خصوصًا على شاشات كثيفة. ارفعها إلى 11–12px.

### 9. ترتيب العناوين: عشر عناوين H2 في التنقل قبل H1 الصفحة — خطورة 1
- مخطط العناوين يبدأ بـH2 (Overview, Work, Quality…) قبل H1 "Dashboard". استخدم عناصر غير عناوين لتسميات مجموعات التنقل أو اجعل H1 أول عنوان فعلي.

### 10. أهداف اللمس أقل من معيار 44px المعتمد في المشروع — خطورة 1
- روابط التنقل 238×40، زر Collapse 32×32، رابط drill-down في KPI نص 11px. تستوفي 24px (WCAG 2.2 AA كحد أدنى) لكنها دون معيار المشروع الموثق 44px.

### 11. لوحة "Operational trend" فارغة دائمًا وتتكرر مع "Data coverage" — خطورة 1 (فرصة)
- عين مساحة رئيسية برسالة ساكنة مكررة في لوحتي مختلفتين. ادمجهما في سطر واحد داخل Data coverage أو أخفِ اللوحة حتى توفر read model معتمد للسلسلة الزمنية (وفق قاعدة "لا chart قبل backend time series").

### 12. الرسالة الموحّدة تخفي سبب الرفض (كود) — خطورة 2
- `src/pages/dashboard/index.astro:13` يلتقط كل الأخطاء إلى `providerUnavailable = true`؛ بما فيها `AUTHZ_PERMISSION_MISSING` → مستخدم بلا صلاحية DASH يرى "Dashboard data is unavailable" (رسالة عطل خارجي) بدل رسالة وصول واضحة. افصل فئات الخطأ مثل `classifyActionResult` المستخدمة في مسار الإدارة.

### 13. أداء التحميل — خطورة 1–2 (بيئة)
- حيًا: TTFB ≈ 1.67s وFCP ≈ 1.84s على 1440×900. على الأغلب Render free tier + جغرافيا المنطقة، وليس مشكلة كود مثبتة؛ الأثر يظهر مع WASM المكرر (بند 7). القياس الحي الكامل (Web Vitals متكررة) يبقى NOT VERIFIED وفق الذاكرة.

### 14. متن صغير
- صياغة "Updated current snapshot" مكررة/غير مفهومة (timeRange + freshness نفس القيمة حرفيًا).
- تنسيق التاريخ `9/18/2026` من `en-SA` — تأكد من الصيغة المقصودة للمستخدم.
- `Ctrl+K` ينقل لصفحة `/search` كاملة (بدل palette فوري) — يعمل لكنه أبطأ من المتوقع.
- لا `aria-live` ولا زر Refresh للقطة — اللقطة ثابتة عند الـSSR ووقتها في الترويسة فقط.
- المظهر داكن حصريًا (`color-scheme: dark` مفروض حتى مع `prefers-color-scheme: light`) — قرار تصميم مقبول لكنه يُذكر كفرصة (لا toggle ولا ثيم فاتح).
- الـActivity تعرض حدثًا إداريًا (`GRANT_SYSTEM_OWNER_ACCESS`) — فكّر في تصنيف/فلترة الأحداث التشغيلية أو تمييز الأحداث الإدارية بصريًا.

## نقاط قوة يجب الحفاظ عليها
- fail-closed: عند تعطل المزود تُحجب الأرقام بدل عرض أصفار مضللة (`ProviderUnavailableState`).
- تعريف + مصدر + نافذة لكل KPI عبر tooltip `i`، مع رابط drill-down.
- ملاحظة "PASS and Released are separate" ظاهرة للمستخدم.
- النشاط من سجل Audit بعقد القراءة الآمن نفسه.
- skip link وlandmarks، تباين ≥ 4.5 للألوان المقاسة، بيانات SSR بلا fetch عميل.
- Lighthouse (snapshot, desktop): Accessibility 100 / Best Practices 100 / SEO 75 (meta description فقط — غير جوهري لتطبيق مصادق).

## خطة أولويات مقترحة
1. **P1 (جهد منخفض، أثر شامل):** إصلاح قاعدة الخط (بند 1) — إصلاح drill-down أو روابطه (بند 2) — فصل خطأ الصلاحية عن خطأ المزود (بند 12) — عرض `loginIdentity` + الدور في الشريط (بند 5).
2. **P2:** مواءمة قائمة القرار مع عدّاد Pending review (بند 4) — قرار Lottie/CSP (بند 7) — Label in Name (بند 6) — رفع 10px إلى 11–12px (بند 8).
3. **P3:** دمج Trend/Data coverage (بند 11) — أهداف اللمس 44px (بند 10) — ترتيب العناوين (بند 9) — الصياغات والتواريخ وrefresh/live region (بند 14) — متابعة TTFB (بند 13).

## أدلة التحقق
- دخول فعلي إلى `https://qclevel.top/dashboard` بحساب `yazeed`؛ قياسات DOM/CSS/شبكة/console داخل الصفحة الحية.
- قياس عرض النص الفعلي (width probe) لإثبات خط Times: الافتراضي 599.6px ≈ Times 599.5px ≠ `var(--font-sans)` 613.2px.
- فحص CSSOM: قاعدة `body{font-family:var(--font-sans)}` موجودة لكنها ملغاة بـ`body,button,input,select,textarea{font:inherit}` (ترتيب مؤكد في dist: 5813 ثم 6983).
- تحقق drill-down: زيارة `/quarantine/receiving?inspectionResult=HOLD` والفلتر بقي "All states".
- Lighthouse snapshot: a11y 100 مع فشل `label-content-name-mismatch` (serious) على زر البحث.
- شبكة/console: 4 أخطاء WASM/CSP، WASM 1.2MB × 2، TTFB 1.67s، FCP 1.84s.

---

# إضافات مقترحة للداشبورد (مربوطة ببيانات وصفحات حقيقية)

> القاعدة: كل إضافة لها مصدر خادمي قائم + وجهة عمل + وحدة ونافذة معلنة. ما لا يوجد له read model يُذكر صراحة كـ"غير متوفر" ولا يُخترع.

## أ) محتوى جاهز الآن (read model موجود ويستحق النقل للداشبورد)

| الإضافة (بشرية) | المصدر الحقيقي | الرابط/الوجهة | العرض |
|---|---|---|---|
| "وصل اليوم" + "بانتظار الفحص" + "تحت الفحص" + "PASS ولم يُفرج" + "مُفرج" | `GetQuarantineOverviewUseCase` + `postgres-quarantine-read-model.ts` (6 عدادات حقيقية، تعمل على الإنتاج في `/quarantine`) | `/quarantine/receiving` و`/reports/quarantine-aging?...` | شريط مراحل (received → awaiting → inspecting → hold → pass-not-released → released) أو 6 بطاقات |
| "هذه تحتاج منك قرارًا" مع سبب حقيقي لكل عنصر | نفس المصدر: `attention` مع `summary` نصي و`severity` CRITICAL/WARNING (أغنى من قائمة الداشبورد الحالية التي تعرض receiving HOLD فقط) | رابط السجل مباشرة | قائمة أولوية |
| "توزيع حالة الاستقبال" | `overview.distributions` + مكوّن الأعمدة القائم في `/quarantine` (`--bar-size`) | `/quarantine/receiving` | بارات أفقية |
## ب) رسوم بيانية — ما يمكن رسمه فعلاً

| الرسم | المصدر | الحالة |
|---|---|---|
| أشرطة توزيع حالة الاستقبال | `distributions` (موجود ويعمل) | **جاهز** |
| خط زمني للاستلام/الرفض بحسب اليوم | `analytics.trend` في `postgres-repository.ts` (reject-reports) — سلسلة زمنية حقيقية بـ`report_date` | **في الكود فقط**: `/reject-reports` يرجّع **500** على الإنتاج (migration `0026` غير مطبق؛ Render على `0018`) |
| أعلى الأصناف/الأقسام/الأسباب المرجّحة | `analytics.byItem` / `byDepartment` / `byReason` | نفس القيد أعلاه |
| "الكمية المرفوضة الكلية" | `summary.totalRejectedQuantity` | نفس القيد أعلاه |
| ترند الجودة (Findings/NCR/CAPA) | غير موجود (`trendAvailable: false`) | **لا ترسم** حتى يتوفر read model معتمد |
| زمن دورات المراجعة/Finding→CAPA | غير موجود | **لا ترسم** |

**قاعدة العرض:** كل رسم يحمل وحدة + نافذة زمنية + مصدر + وقت تحديث، وإن لم تتوفر السلسلة تُستبدل بجملة واحدة بشرية: "لا يوجد ترند كافٍ في نطاقك بعد." — بدلاً من لوحة فارغة بحجم كبير.

## ج) صياغة بشرية + اختصار النصوص (قبل → بعد)

| الموضع | الحالي | المقترح المختصر |
|---|---|---|
| eyebrow الترويسة | OVERVIEW · QC OPERATIONAL COMMAND CENTER | نظرة عامة |
| الوصف | Authorized work that needs attention, in your current operational scope. Scope: Authorized operational scope. | "مهامك التي تحتاج إجراءً، نطاقك: {نطاق}" (يحذف تكرار النطاق) |
| معنى الأرقام | Values are scoped to your identity, not the whole scope label | صياغة واضحة: "أرقامك أنت" أو رفع الاستعلام للنطاق |
| KPI | Pending review | بانتظار مراجعتك |
| KPI | HOLD items | معلّقة (HOLD) |
| KPI | Inspection PASS | ناجحة فحصاً (PASS) |
| KPI | Released items | مُفرج عنها |
| لوحة القرار | Items needing a decision or follow-up | تحتاج قرارًا |
| لوحة القرار (فراغ) | No items currently require follow-up in this authorized scope. | "لا شيء ينتظرك الآن." |
| الترند | Trend charts are shown only when the authorized backend provides a time series with a defined unit. | "يظهر الترند عند توفر سلسلة زمنية معتمدة." |
| الترند (فراغ) | No trend series is available for this scope. Nothing is plotted until a server-defined series is available. | "لا ترند كافٍ في نطاقك بعد." |
| النشاط | Audit-aware timeline | آخر ما جرى |
| التغطية | What this snapshot can answer / Available now / Not supplied | "ما يغطيه هذا الملخص" / "متوفر" / "غير متوفر" |
| KPI صغير | Updated current snapshot | "لحظة العرض" (تُقال مرة واحدة أعلى الصفحة) |
| الخطأ | Dashboard data is unavailable (يشمل خطأ الصلاحية) | "تحتاج صلاحية عرض الداشبورد" لخطأ الصلاحية، و"بيانات غير متوفرة الآن" لخطأ المزود |
| الترتيب العام | Eyebrows إنجليزية UPPERCASE في كل لوحة | تخفيفها إلى تسمية واحدة قصيرة لكل لوحة (يقل الضجيج البصري) |

## د) ترتيب مقترح للشاشة (بشري: "ماذا أفعل الآن؟" أولاً)

1. سطر علوي: نطاق + وقت اللقطة + زر تحديث.
2. صف إجراءاتي: موافقات تنتظرك · إشعارات غير مقروءة · مهام قريبة الاستحقاق (`tasks.due_at`).
3. لوحة "تحتاج قرارًا" (من `attention` الحقيقي، مع سبب كل عنصر).
4. شريط مراحل الاستقبال + بارات التوزيع (مصدر واحد يغذي كل الأرقام فيتفق الرقم مع القائمة).
5. "جودة" و"معامل" في صف واحد، و"كاليبريشن/صيانة" تحته.
6. آخر ما جرى + رابط التدقيق.
7. "ما يغطيه هذا الملخص" (سطرين فقط) — وليس لوحة كاملة.

## هـ) ملاحظتان عمليتان قبل التنفيذ
1. **لا تربط أي رابط KPI بصفحة قائمة لا تدعم الفلتر.** البديل الجاهز والمتحقق منه: `/reports/quarantine-aging?inspectionResult=HOLD` و`?workflowState=RELEASED` (يفلتر خادميًا ويعرض "Filters are applied on the server") — بدل `?inspectionResult=` على صفحة الاستقبال.
2. **الترند الحقيقي موجود لكن غير متاح في الإنتاج** (`/reject-reports` = 500 حتى تطبيق `0026`). إن كان المطلوب "الداشبورد فيه رسوم"، فالطريق الآمن الآن هو `distributions` + شريط المراحل + بارات الجودة، ثم إضافة ترند الرفض بعد تطبيق المايغريشن عبر `analytics.trend`.
| "جودة: عناصر مفتوحة" (Findings/NCR/RCA/CAPA) | `PostgresQualityOverview` (مع `trendAvailable: false` صراحةً) | `/quality/findings` · `/quality/ncr` · `/quality/rca` · `/quality/capa` | 4 أرقام |
| "موافقات تنتظرك + إشعارات غير مقروءة" | أعداد الشريط العلوي الحالية (`approvalCount`/`notificationCount`) | `/approvals` · `/notifications?unread=true` (تعمل حيًا) | شريحة واحدة |
| "آخر نشاط" | Audit (نفس العقد الحالي) | `/audit?action=...&from=...` | قائمة زمنية |
| "حالة النظام" (للمالك فقط) | `/system/health` (readiness + تدهور منقّح) | `/system/health` + `/system/control-center` | شريحة حالة، تُخفى لغير المالك وفق `pageAccessDecision` |
| "الكاليبريشن المنتهي/المستحق" | `calibration_records.state` (CURRENT/DUE/OVERDUE) موجود والفلتر الحي يعمل | `/assets/calibrations?state=OVERDUE` | رقم + رابط (يحتاج read model عدّاد بسيط) |
| "تصدير لـExcel/CSV" | `QUARANTINE_AGING_REPORT` مع صلاحيات `PERM-RPT-EXPORT-CSV/XLSX` | `/reports/quarantine-aging` | زر تصدير من الداشبورد |

- استجابة: 4 أعمدة KPI عند ≥1200، عمودان عند 768، عمود واحد عند 500 (أصغر مقاس قابل للاختبار في هذه الجلسة)؛ لا overflow أفقي.
