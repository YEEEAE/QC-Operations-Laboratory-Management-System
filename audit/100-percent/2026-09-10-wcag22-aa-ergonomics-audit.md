# WCAG 2.2 AA + Enterprise Ergonomics Audit — 2026-09-10

## نطاق التدقيق

هذا تدقيق للكود الحالي ونسخة الإنتاج الظاهرة، مع تركيز على تطبيق QC المكتبي كثيف البيانات. التقييم يوازن بين الوصول، الدقة، الكثافة، السرعة، والراحة في الجلسات الطويلة؛ ما يوصي بتكبير كل شيء تلقائيًا.

## ملخص الحكم

**الحالة: PARTIAL / NEEDS LIVE EVIDENCE**

الأساس الدلالي قوي في الشل، النماذج، الأخطاء، الرسوم، الأيقونات، reduced motion، وforced colors. ما يمنع الاعتماد هو أن الفحص الحي الموثوق اقتصر على `/login` بدون جلسة تشغيلية مصادق عليها، بينما تشغيل Astro المحلي محجوب بسبب `listen EPERM` على `127.0.0.1:4321`. لذلك لا يوجد claim بأن كل route أو كل workflow يحقق WCAG 2.2 AA.

## الإصلاحات المنفذة لاحقًا

- صارت `LoadingState` تستخدم `role="status"` و`aria-live="polite"`، والعناصر الزخرفية فيها مخفية عن شجرة الوصول.
- صارت شدة الإشعار في `notifications.astro` نصًا وصوليًا مخفيًا بدل الاعتماد على لون النقطة فقط.
- أضيف عقد عام لـ`forced-colors: active` يثبت وضوح focus وحدود الحقول وشارات الحالات بألوان النظام.
- أضيفت اختبارات regression لهذه الإصلاحات ضمن عقد WCAG.

## AUTOMATED VERIFIED

- عقد اختبارات ثابت جديد في `tests/unit/ui/wcag22-accessibility-contract.test.ts` يغطي 8 assertions groups: skip link/landmarks، visible focus، reduced motion، forced colors، mobile drawer isolation/restoration، icon names، error summary، charts/tables، status semantics، وauthentication.
- `AppLayout` يصدّر `Skip to main content` و`main#main-content`، مع `nav` و`aria-label` للتنقل.
- `global.css` يعرّف `:focus-visible` لكل عناصر التشغيل الرئيسية، و`scroll-padding-top` لتقليل حجب الفوكس عند التنقل المرساوي.
- drawer الجوال يعزل workspace والـskip link بـ`inert`، يحبس Tab، يدعم Escape، ويعيد الفوكس لزر الفتح.
- `FormErrorSummary` يستخدم `role=alert` وهدفًا قابلًا للفوكس وروابط للحقول ومسار رجوع؛ النماذج تحتفظ بـ`method=post` كمسار no-JS في الصفحات التي راجعتها.
- `Chart` يعرض ملخصًا وصوليًا وجدول بيانات بديلًا؛ `DataTable` يملك caption وعناوين أعمدة دلالية.
- `IconButton` وأزرار الشل لها accessible names، وحالات التنقل النشطة لا تعتمد على اللون وحده.
- `login.astro` يستخدم `autocomplete=username/current-password` ورسالة خطأ معلنة.

## MANUAL VERIFIED

### المتصفح — `/login` فقط

- H1 واحد: `Sign in`.
- labels مرتبطة فعليًا بـ`Login identity` و`Password`.
- زر إظهار كلمة المرور معلن باسم `Show password` وحالته كزر قابلة للوصول.
- التنقل بالـTab مرّ على `Password` ثم `Show password` ثم `Sign in` مع outline مرئي لونه أخضر وبسمك يقارب 2px.
- حقلا الهوية وكلمة المرور ظهرا كعناصر قابلة للتعبئة، ولا يوجد منع ظاهر للصق أو مدير كلمات المرور.
- لم تُرسل بيانات اعتماد ولم تُنفذ mutation أو login بحساب حقيقي في هذه الجولة.

## NOT VERIFIED

- axe حي على كل route مصادق، وNVDA/VoiceOver semantics الكاملة.
- keyboard-only عبر كل الشل، الجداول، الفلاتر، dialogs، drawers، approval، release، void، restore، وfocus restoration بعد كل انتقال.
- focus not obscured عند sticky/scroll طويل على صفحات التشغيل.
- heading hierarchy وlandmarks لكل route family المصادق.
- error announcements بعد POST حقيقي، retained values، stale/provider failure، ورفض الصلاحية.
- tables الحية: row/column headers، sort/pagination، horizontal scroll، وtable scanning عند كثافة compact.
- chart interaction أو أي chart مستخدم فعليًا؛ الجرد السابق يشير إلى أن الرسوم غير مستخدمة حاليًا في أسطح البيانات.
- 200% browser zoom الحقيقي، text spacing override، و320px reflow على المحتوى المصادق. يوجد عقد E2E سابق لهذه المقاسات لكنه gated/لم يصل assertions في بيئة Chromium الحالية.
- forced-colors حي، reduced-motion حي على كل route، وscreen-reader announcement للـstatus/toast.
- authentication success، password-manager integration الفعلي، وno-JS submit عبر بيئة قاعدة بيانات مصادق عليها.
- ergonomics طويلة المدة: eye travel، repetitive actions، scanning time، data-entry fatigue، target spacing أثناء العمل الفعلي، ولوحات متعددة البيانات.

## ملاحظات ergonomics للمراجعة القادمة

- الكثافة الحالية مناسبة لتطبيق مكتبي، ورفع compact إلى `40px` يحافظ على قابلية التحكم؛ لا أنصح بتحويل الجداول إلى cards أو تكبير كل الصفوف.
- الأولوية للـkeyboard efficiency: اختبر الانتقال بين filter → table → action، وحفظ focus بعد الفرز/الترقيم، وعدم إجبار المشغل على إعادة بدء المسار.
- افحص eye travel حول Topbar/Sidebar والجداول الطويلة، خصوصًا عند compact density، وتحقق أن الأفعال الحساسة قريبة من سياق القرار وليست في مكان ثابت بعيد.
- راقب data-entry fatigue في النماذج الطويلة: ترتيب tab منطقي، حفظ draft، رسائل inline، وعدم إعادة إدخال القيم بعد stale/provider failure.
- target spacing الحالي في الشل العام 40px، لكن يجب قياس الأزرار المحلية والروابط الصغيرة داخل كل route بدل تعميم الحكم من CSS المشترك.

## خطوات الإغلاق المطلوبة

1. تشغيل preview/production build ببيئة Chromium مسموحة وfixture مصادق disposable.
2. تنفيذ مصفوفة Playwright المصادقة للمقاسات 320/200%/forced-colors/reduced-motion، مع axe وقياسات الفوكس والـoverflow.
3. تنفيذ جلسة VoiceOver أو NVDA على login، shell، form، table، dialog، وapproval.
4. تسجيل route-by-route evidence مع SHA وهوية الإصدار؛ أي نقص يبقى `NOT VERIFIED`.
