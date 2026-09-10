# Motion Design & Digital Art Direction Audit — QC Operations & Laboratory Management System

**التاريخ:** 2026-09-10 — Asia/Riyadh  
**الـHEAD المراجع:** `0a557916b8b3c468b711f3335ae868010218290d`  
**النطاق:** system background، login Three.js، Lottie، navigation، drawer، buttons، status، charts، loading، feedback، page transitions.  
**المرجع المستخدم:** `ui-ux-pro-max` مع إرشادات `optimize-web-animations` ومبادئ النظام التشغيلية.

## الحكم التنفيذي

الحركة الحالية منضبطة أكثر من كونها مزخرفة، وهذا الاتجاه صحيح لبيئة QC. لا توجد حركة مطلوبة لفهم حالة controlled record؛ الحالات تتغير نصيًا وبإعادة تحميل بعد قرار الخادم، وهذا يقلل خطر أن تُفهم الحركة كاعتماد أو release.

**الحالة:** `NEEDS CHANGES — SOURCE AUDIT PASS WITH ONE HIGH MOTION DEBT AND LIVE PERFORMANCE UNVERIFIED`

أهم القرارات:

- أبقِ الخلفية التشغيلية ثابتة. لا ترجع Lottie إلى authenticated workspace بدون دليل usability وأداء.
- أبقِ 3D في login فقط؛ هو brand expression مقبول لأنه يخدم inspection/measurement، وليس أداة تشغيلية.
- أصلح collapse navigation لاحقًا ليتجنب تحريك `grid-template-columns`؛ هذا هو العيب التقني الأوضح في الحركة الحالية.
- لا تضف page transitions أو status animations أو chart choreography الآن؛ الانتقال الفوري أكثر أمانًا مع النماذج والسجلات المضبوطة.
- لا يوجد إثبات حي CPU/GPU/INP/LCP/CLS في هذه الجولة؛ لذلك لا يوجد claim أن الأداء تحسن أو أن الـ3D آمن على كل الأجهزة.

## مصفوفة التصنيف

| السطح / الحركة | التصنيف الأساسي | الحكم | القرار |
|---|---|---|---|
| Authenticated system background | Decorative، مع brand expression خفيف | الخلفية CSS ثابتة؛ لا تنافس الجداول أو القرارات | **Keep static** |
| Login Three.js: float/parallax/scan | Brand expression + Decorative؛ scan له معنى Orienting بصري | مناسب للـlogin النادر، غير تفاعلي، ومفصول عن النموذج | **Keep scoped to login; measure before fidelity increase** |
| Lottie asset | لا توجد حركة runtime مؤكدة؛ asset غير مربوط من `src` | `background.lottie` وزنها 1,197,133 bytes وقد تكون بقايا/legacy | **Do not load; prune only بعد تأكيد artifact ownership** |
| Sidebar collapse | Orienting + State-transition | يحرك `grid-template-columns` ويسبب layout work | **Change owner to transform/opacity or instant width state** |
| Mobile navigation drawer | Orienting + State-transition | `transform` مناسب، focus/inert/Escape موجودة، reduced motion يلغي الانتقال | **Keep; replace generic easing with drawer token** |
| Dialogs / drawers | Orienting + State-transition | native dialog/focus contract جيد؛ لا توجد choreography زائدة | **Keep mostly instant** |
| Buttons | Functional feedback | hover/focus/pressed/loading واضحة؛ press `translateY(1px)` ثابت ومحدود | **Keep; add transform to explicit token only if it remains useful** |
| Status transitions | State-transition + Feedback | لا يوجد morph أو color flash؛ النص والحالة الموثقة هي المصدر | **Keep non-animated** |
| Charts | Orienting / Feedback عند وجودها | SVG وtable alternative ثابتان؛ لا line-draw أو auto-play | **Keep static** |
| Loading skeleton / sheen | Functional feedback | يوضح الانتظار، لكن infinite paint animation مؤقتة فقط | **Keep for short waits; pause offscreen if reused in long views** |
| Toast / inline feedback | Feedback | feedback نصي، بدون keyframe أو دخول يقطع التركيز | **Keep; prioritize contextual feedback** |
| Page transitions | Orienting | لا `ClientRouter` ولا View Transition مستخدم | **Keep instant for now** |

## 1. System background

### الأدلة

- `src/ui/components/SystemBackground.astro` لا يحتوي `<script>` ولا `requestAnimationFrame` ولا dependency runtime.
- العنصر `aria-hidden="true"` و`pointer-events: none` و`data-motion="static"`.
- `BaseLayout` يضيفه افتراضيًا، بينما login يمرر `systemBackground={false}`.
- يوجد asset باسم `public/assets/background.lottie` بحجم **1,197,133 bytes**، لكن لا يوجد reference له من `src`.

### التقييم

**التصنيف:** Decorative فقط.  
**القيمة:** فصل بصري هادئ بين canvas والـpanels، بدون حركة مستمرة.  
**القرار:** ممتاز للـauthenticated workspaces؛ المشغل يتعامل مع بيانات طويلة ونماذج وقرارات، لذلك أي infinite background motion ستكون تكلفة بلا قيمة تشغيلية مثبتة.

لا تُحذف الـasset تلقائيًا في هذا التدقيق لأن الملكية/الـartifact النهائي غير مثبتة. لكنها **dead-weight risk** إذا كان bundling أو deployment ينشرها دون استخدام.

## 2. Login Three.js art direction

### ما ينجح

- المشهد decorative ومعلن `aria-hidden`، والـcanvas `role="presentation"`؛ النموذج والنص لا يعتمدان عليه.
- الـGLB محلي وحجمه **943,748 bytes**.
- الاستيراد deferred عبر `requestIdleCallback` مع fallback timeout، ويتوقف مع `prefers-reduced-motion`.
- loop يتوقف عند `document.hidden`، وWebGL context loss يوقف الرسم ويظهر fallback.
- `destroy()` يلغي RAF، يفك listeners، يلغي init، يعمل dispose للـgeometry/material/texture/renderer، ويزيل canvas.
- pointer tracking gated على `(hover: hover) and (pointer: fine)`؛ لا توجد particle field أو random particles أو holographic HUD.
- المواد physical/standard، والإضاءة key/fill/rim/scan تعطي material realism وcontrolled lighting.
- portrait mobile يخفي inspection overlays ويقلل DPR إلى `1.15`؛ desktop سقفه `1.65`.

### ملاحظات art direction

المشهد يحقق: **medical quality، precision، inspection، measurement، verification، material realism، negative space**. خطوط القياس والقوس وscan strip مرتبطة بالموضوع وليست cyberpunk decoration. مع ذلك، scan وanchor pulsing وparallax تعمل معًا باستمرار أثناء بقاء صفحة login مفتوحة؛ لذلك لا تزيد fidelity أو عدد overlays قبل قياس session طويلة وعلى mobile GPU.

**التصنيف:** Brand expression، مع Orienting بصري ثانوي.  
**القرار:** Keep on login only. لا تنقل هذا المستوى إلى workspace.

## 3. Motion tokens

الحالي:

- `--motion-fast: 150ms`
- `--motion-standard: 200ms`
- `--motion-slow: 220ms`
- easing عام واحد تقريبًا (`--motion-ease-standard`)

هذا أفضل من raw durations، لكنه لا يشرح الغرض. التوصية التصميمية التالية تحافظ على القيم الحالية وتضيف معنى بدل تغيير السلوك مباشرة:

```css
--motion-feedback: 150ms;
--motion-orient: 200ms;
--motion-drawer: 240ms;
--motion-brand: 350ms;
--motion-ease-feedback: cubic-bezier(0.23, 1, 0.32, 1);
--motion-ease-orient: cubic-bezier(0.23, 1, 0.32, 1);
--motion-ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
--motion-ease-linear: linear;
```

لا يلزم تطبيق `--motion-brand` على workspaces. و`--motion-feedback` لا يُستخدم في keyboard shortcut أو انتقال يكرر عشرات المرات بلا فائدة.

## 4. Findings

### MOTION-01 — HIGH — Sidebar collapse يحرّك layout geometry

`src/ui/layouts/AppLayout.astro` يستخدم:

```css
transition: grid-template-columns var(--motion-standard) ease;
```

هذا يحرك عرض عمود كامل، فيعيد layout للـworkspace أثناء كل collapse/expand. النتيجة قد تكون reflow محسوسة وتنافس content، خصوصًا مع جداول كثيفة.

**التوصية:** إما state change فوري (مقبول لتكرار عالٍ)، أو حرّك sidebar نفسه بـ`transform` مع مساحة layout ثابتة؛ لا تعتمد على `transition: all` ولا تحرك `width`/`grid-template-columns` كحل عام. أي انتقال يجب أن يلغي/يستبدل الحركة السابقة وتبقى الحالة semantic صحيحة فورًا.

**الأولوية:** P1، لكن لا أطبقه ضمن audit-only task بدون طلب تنفيذ.

### MOTION-02 — MEDIUM — Drawer يستخدم easing عام

الموبايل يستخدم `transform` وهو property صحيحة، لكن `ease` العامة لا تعبّر عن drawer. استبدالها بـpurpose token يحسن spatial consistency بدون إضافة حركة جديدة. reduced motion موجود ويوقف transition.

### MOTION-03 — MEDIUM — Loading sheen غير محكوم بالظهور

`LoadingState` يشغل sheen على كل line عبر `background-position`. هو feedback وظيفي ومقبول أثناء انتظار قصير، لكنه infinite animation. لو استُخدم داخل صفحات طويلة أو أكثر من loading region، يلزم gate بالظهور أو الاكتفاء بـstatic skeleton عند offscreen.

### MOTION-04 — LOW — Button press لا يحتاج زيادة

`translateY(1px)` يقدم feedback صغيرًا لكنه ليس ضمن transition list العامة؛ لذلك هو snap مقصود وسريع. لا تضف scale أو ripple أو bounce؛ الزر جزء من سطح تشغيلي عالي التكرار.

## 5. Reduced motion / stability

المصدر يملك safeguards جيدة:

- global CSS يقلل animation/transition ويوقف smooth scroll.
- App shell يلغي transition.
- Three.js لا يبدأ أصلًا مع reduced motion ويعرض fallback static.
- loading sheen يتوقف.
- login canvas transition يتوقف.

المطلوب في التحقق الحي لاحقًا: reduced motion على login، mobile drawer، loading، وroute cycle، مع التأكد من عدم وجود layout shift أو focus jump.

## 6. القياس المطلوب قبل رفع fidelity

هذه الجولة **لم تنفذ browser runtime measurement** لعدم وجود tab/server/fixture متاح. قبل أي زيادة في 3D أو إعادة Lottie، اجمع على نفس release:

- LCP / INP / CLS / TTFB.
- JS transferred/executed، GLB transfer، وأي Lottie/WASM transfer فعلي.
- long tasks وframe time في login idle، login pointer movement، form typing، dashboard tables.
- CPU/GPU أو observable canvas behavior على desktop وmobile.
- reduced-motion مقابل normal-motion.
- route cycle وhidden-tab pause؛ لا يكفي screenshot أو وجود cleanup في المصدر.

## 7. الخطة المقترحة

1. **P1:** استبدال collapse layout transition بقرار فوري أو transform-based owner، مع اختبار reduced motion وlayout stability.
2. **P1:** قياس login Three.js بالـbrowser قبل أي material/post-processing إضافي.
3. **P2:** تسمية motion tokens حسب الغرض وربط drawer بـdrawer easing.
4. **P2:** فحص artifact/deployment لمعرفة هل `background.lottie` يصل للمستخدم رغم عدم استخدامه.
5. **P3:** إبقاء charts/status/page transitions بلا حركة إلى أن تظهر حاجة usability مثبتة.

## الخلاصة

الحركة المناسبة للنظام هي: **هادئة في التشغيل، ذات معنى في feedback، ومميزة فقط عند الدخول**. login art الحالي يحقق الاتجاه الطبي الدقيق، بينما authenticated workspaces لا تحتاج حركة زخرفية. العيب المؤكد الوحيد عالي الأولوية هو تحريك layout geometry في collapse؛ أما CPU/GPU وWeb Vitals فما زالت `NOT VERIFIED` وتحتاج قياسًا حيًا قبل أي قرار fidelity.
