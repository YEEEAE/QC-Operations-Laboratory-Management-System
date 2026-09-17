# تقرير التدقيق النهائي UI / UX — QC Operations & Laboratory Management System

**التاريخ:** 2026-09-10 — Asia/Riyadh  
**المستودع:** `YEEEAE/QC-Operations-Laboratory-Management-System`  
**الفرع:** `main`  
**HEAD المراجع:** `40c1711959a9ee3f447fefefcf7856f84345726a`  
**مهارة OpenCode المعتمدة:** `.opencode/skills/ui-ux-pro-max/SKILL.md`  
**نسخة المهارة داخل المستودع:** SHA `be12b5f2788328721b3d323b3c15e4f8eae947df`  
**Stack:** Astro + TypeScript + Three.js + PostgreSQL-backed server application  
**الهدف:** تدقيق UI/UX وما يتصل بهما عبر النظام كاملًا، بدون تغيير Business Rules أو Authorization أو State Machines.

---

## 1) الزبدة التنفيذية

الحكم الحالي:

> **Needs changes — المصدر تحسن بشكل كبير، لكن ما زالت توجد عيوب UI/UX مؤكدة من مستوى HIGH، والتحقق الحي الكامل على نفس النسخة المنشورة غير مكتمل.**

هذه النتيجة لا تعني أن النظام ضعيف. بالعكس، عدد كبير من مشاكل التقرير السابق تم إصلاحه في المصدر، ومنها:

- Mobile drawer isolation / inert / focus containment.
- SVG icon system موحد.
- Change Request contextual workflow بدل الحقول التقنية.
- Quarantine template lifecycle.
- إزالة مصطلحات backend من Dashboard.
- 320px reflow guards.
- no-JS POST baseline واستعادة الأخطاء في نماذج رئيسية.
- WCAG/axe/reduced-motion tests موجودة.
- System Health صار أكثر صدقًا ويفصل backup success عن restore verification.

لكن بعد تطبيق قواعد `ui-ux-pro-max` المحلية على المصدر الحالي ظهرت فجوات جديدة أو أعمق، أهمها:

1. Dashboard يستبدل الـUniversal Topbar كاملًا، فيفقد Global Search / Notifications / Approvals / User Menu، وعلى الجوال يفقد زر فتح التنقل.
2. Semantic status palette تحتوي ألوان نص لا تصل إلى 4.5:1 في حالات فعلية، وبعض الصفحات تستخدم CSS tokens غير معرفة مثل `--status-success` و`--status-error`.
3. Topbar يعرض notification/approval badges بقيمة `0` افتراضية لأن AppLayout لا يمرر العدادات الحقيقية.
4. `FormErrorSummary` قابل للتركيز لكنه لا يقدم روابط من ملخص الأخطاء إلى الحقول المخالفة، خلافًا لعقد Pro Max.
5. بعض mutation surfaces الجديدة لا توفر loading/double-submit protection بشكل متسق.
6. الأداء المرئي يحتاج قياس فعلي: النظام يحمل Lottie + WASM عالميًا، وتسجيل الدخول يحمل Three.js + GLB؛ المصدر فيه safeguards جيدة لكن Web Vitals غير مثبتة.

---

## 2) منهج التدقيق

تم الاعتماد على أربع طبقات بدل الرأي البصري فقط:

### A. مصدر الحقيقة الداخلي للنظام

- `Documents/DESIGN-SYSTEM.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/AUTHORIZATION-VISIBILITY-DECISION.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/STATE-MACHINES.md`
- `audit/2026-09-09-production-ui-audit.md`

قاعدة النظام نفسها صحيحة ومهمة:

> Operational clarity before decoration.

و:

> UI is presentation only — server/business truth wins.

### B. مهارة OpenCode المحلية

المصدر المعتمد ليس النسخة العامة فقط، بل النسخة الموجودة داخل المشروع:

`/.opencode/skills/ui-ux-pro-max/`

تم استخدام:

- `SKILL.md`
- `data/ux-guidelines.csv`
- `data/stacks/astro.csv`
- `data/stacks/threejs.csv`
- `data/catalog-summary.json`

الـcatalog المحلي يثبت وجود:

- 119 UX guidelines.
- 79 searchable styles.
- 192 product/palette/reasoning profiles.
- 74 font pairings.
- 105 curated icons.
- 17 motion presets.
- 25 chart types.
- 22 stacks.
- 1260 stack guidelines.

### C. المصدر الفعلي الحالي

تمت مراجعة مكونات وأسطح مركزية تشمل:

- `src/ui/layouts/BaseLayout.astro`
- `src/ui/layouts/AppLayout.astro`
- `src/ui/shell/Topbar.astro`
- `src/ui/shell/Sidebar.astro`
- `src/ui/navigation/navigation.ts`
- `src/ui/styles/tokens.css`
- `src/ui/styles/global.css`
- `src/ui/components/Icon.astro`
- `src/ui/components/StatusBadge.astro`
- `src/ui/components/FormErrorSummary.astro`
- `src/ui/components/SystemBackground.astro`
- `src/ui/components/QCLogin3DBackground.astro`
- `src/pages/dashboard/index.astro`
- `src/pages/login.astro`
- `src/pages/change-requests/new.astro`
- `src/pages/quarantine/admin/index.astro`
- `src/pages/system/health.astro`
- `src/pages/system/backups/index.astro`
- E2E/UI tests المرتبطة.

### D. آخر دليل حي موجود في المستودع

آخر جولة production موثقة في audit الحالي:

- **7 PASS**
- **5 NOT VERIFIED**
- **0 FAIL**
- من أصل 12 بند تحقق حي.

هذه الجولة مرتبطة بالنسخة المنشورة وقتها، وليست إثباتًا تلقائيًا لأي HEAD جديد.

---

## 3) المقاييس القابلة لإعادة الحساب

### 3.1 Legacy Finding Ledger — حالة المصدر الحالية

التقرير السابق كان يتابع 15 Finding مؤهلًا.

بعد آخر إصلاحات المصدر:

- المغلق/المطبق في المصدر: **14 / 15**
- المتبقي كإثبات تشغيلي/بيئي: **F-11**
- Source closure: **93.3%**

**مهم:** هذه ليست Production Readiness ولا UI/UX score؛ هي فقط نسبة إغلاق القائمة القديمة في المصدر.

### 3.2 آخر تحقق حي موثق

- PASS = 7
- FAIL = 0
- NOT VERIFIED = 5
- Planned = 12

الحساب المحافظ:

`7 / 12 = 58.3%`

نجاح ما تم تنفيذه فعليًا:

`7 / 7 = 100%`

لكن لا يجوز عرض 100% كجاهزية لأن خمسة سيناريوهات لم تُثبت.

### 3.3 حالة CI الحالية على HEAD

GitHub لا يعرض status checks أو workflow runs مرتبطة بـHEAD الحالي في موصل GitHub المستخدم لهذا التدقيق.

الحالة:

> **NOT VERIFIED**

وجود اختبارات في المستودع أو نتائج محلية سابقة لا يساوي CI pass على HEAD الحالي.

---

# 4) مراجعة Pro Max حسب المجالات

| المجال | الحالة | الخلاصة |
|---|---|---|
| Accessibility | **NEEDS CHANGES** | contrast + error-summary links + Dashboard mobile navigation |
| Touch / Interaction | **NEEDS CHANGES** | Dashboard drawer access + بعض feedback contracts |
| Performance | **NOT VERIFIED / SOURCE RISK** | Lottie/WASM عالمي + Three.js/GLB، لا Web Vitals حديثة |
| Style System | **NEEDS CHANGES** | النظام متماسك، لكن status token contract فيه خلل |
| Layout / Responsive | **NEEDS CHANGES** | 320 reflow جيد؛ Dashboard shell والـ200% zoom ما زالا مهمين |
| Typography / Color | **NEEDS CHANGES** | type scale جيد عمومًا؛ توجد contrast failures حسابية |
| Motion | **NEEDS CHANGES** | reduced-motion جيد؛ continuous decorative background يحتاج تقليل/قياس |
| Forms / Feedback | **NEEDS CHANGES** | no-JS recovery قوي؛ error summary والloading غير موحدين |
| Navigation / IA | **NEEDS CHANGES** | IA موجودة؛ Dashboard يكسر الـUniversal Topbar وcollapsed tooltip ناقص |
| Charts / Data | **PASS IN SOURCE / LIVE PARTIAL** | semantic contracts واختبارات موجودة؛ التحقق الحي الأشمل ما زال مطلوبًا |

---

# 5) Findings الجديدة

## UXPM-01 — HIGH — Dashboard يكسر Universal App Shell

### الدليل

`AppLayout.astro` يوفر Topbar افتراضي يحتوي على:

- Navigation toggle
- Breadcrumbs
- Scope
- Search
- Notifications
- Approvals
- User menu

لكن:

`src/pages/dashboard/index.astro`

يمرر:

```astro
<Fragment slot="topbar">
  <div class="topline">...</div>
</Fragment>
```

وهذا يستبدل الـTopbar الافتراضي كاملًا.

### الأثر

على Dashboard:

- Global Search يختفي.
- Notifications shortcut يختفي.
- My Approvals يختفي.
- User Menu يختفي.
- Breadcrumb/context pattern يتغير.
- زر `Open navigation` لا يأتي من Topbar.
- على mobile قد يصبح الوصول للتنقل غير متاح من Dashboard.

هذا يطابق مشكلة C-09 التي ظهرت في التحقق الحي السابق عند 320px.

### التعارض

`UI-UX-SPECIFICATION.md` يحدد Top Context Bar كجزء عالمي ويشمل:

- Breadcrumb/current location
- Global Search
- Scope
- Notifications
- My Approvals
- User/Profile

### الإصلاح

لا تسمح للصفحات باستبدال Shell controls.

حوّل Dashboard-specific information إلى:

- content داخل الصفحة،
- أو slot فرعي مخصص مثل `topbar-context`,
- مع إبقاء Topbar العالمي نفسه دائمًا.

### Acceptance

- Dashboard يعرض نفس global controls مثل بقية الصفحات.
- Mobile navigation toggle ظاهر ويعمل عند 320/375/414.
- drawer open/close/escape/focus tests تعمل على Dashboard فعلًا.
- لا يوجد page-level topbar replacement يحذف controls الأساسية.

---

## UXPM-02 — HIGH — Semantic Color / Contrast Contract غير آمن بالكامل

### القاعدة

Pro Max المحلي يطلب:

- normal text contrast ≥ **4.5:1**
- عدم الاعتماد على اللون وحده.

### الحساب من tokens الحالية

أمثلة:

| Foreground | Background | Contrast تقريبي |
|---|---|---:|
| `status-danger #C96666` | `status-danger-bg #3B2323` | **3.84:1** |
| `status-review #6D8DBB` | `status-review-bg #222E3E` | **4.04:1** |
| `status-released #4F9B91` | `status-released-bg #1F3532` | **3.98:1** |
| `status-neutral #8A918A` | `status-neutral-bg #2B2F2B` | **4.21:1** |
| `text-muted #858C85` | `surface-raised #222722` | **4.41:1** |
| `status-danger #C96666` | `surface-panel #1B1F1B` | **4.43:1** |

هذه القيم أقل من 4.5:1 للنص العادي.

### أين تظهر فعليًا

- `StatusBadge.astro` يستخدم semantic foreground + semantic background بنص ~13px.
- Login error يستخدم danger foreground/background.
- Field errors في بعض forms تستخدم danger على panel.
- بعض preview labels تستخدم muted على raised surfaces.

### مشكلة ثانية في نفس العقد

`system/health.astro` و`system/backups/index.astro` يستخدمان:

```css
var(--status-success)
var(--status-error)
```

بينما `tokens.css` لا يعرّف هذين الاسمين؛ الموجود مثلًا:

```css
--status-pass
--status-danger
--status-approved
```

أي declaration يعتمد على custom property غير معرفة يصبح غير صالح لذلك الـproperty، ما قد يسقط اللون/الحد إلى inherited/default styling.

### الإصلاح

- لا تغيّر المعاني: PASS وRELEASED يجب أن يظلا مختلفين.
- عدّل foreground/background pairs بما يحقق 4.5:1 للنص الطبيعي.
- اعمل aliases رسمية أو استبدل الاستخدامات غير المعرفة.
- أضف automated contrast/token tests.

### Acceptance

- كل status badge text ≥4.5:1.
- كل error text ≥4.5:1.
- كل normal muted text على كل surface مستخدمة فعليًا ≥4.5:1.
- meaningful icon/border ≥3:1 عند انطباق non-text contrast.
- لا يوجد `var(--*)` مستخدم في UI بدون تعريف.
- PASS ≠ RELEASED بصريًا ونصيًا.

---

## UXPM-03 — HIGH — Topbar badges ليست مربوطة ببيانات حقيقية

### الدليل

`Topbar.astro`:

```ts
approvalCount = 0
notificationCount = 0
```

`AppLayout.astro` يستدعي Topbar بدون تمرير counts.

إذًا الصفحات التي تستخدم الـdefault Topbar تعرض صفرًا افتراضيًا.

### التعارض

`UI-UX-SPECIFICATION.md` ينص أن:

- My Approvals badge = approvals التي يستطيع المستخدم تنفيذها فعليًا.
- Notifications ترتبط بسجلات فعلية.

### الأثر

قد يرى المستخدم:

```text
0 approvals
0 notifications
```

حتى لو توجد عناصر فعلية.

هذا Operational Truth UX defect وليس مجرد polish.

### الإصلاح

- Server-derived authorized counts.
- لا تحسب counts من DOM أو client-only.
- إذا count غير متاح، لا تعرض `0` كحقيقة زائفة؛ استخدم unknown/unavailable contract مناسب أو أخفِ الرقم مع الحفاظ على الرابط.
- live badge updates — إن وجدت — تكون contextual ولا تنقل focus.

### Acceptance

- counts تطابق authorized queues.
- role/scope negative tests.
- no cross-scope leakage.
- stale/unavailable provider لا يتحول إلى 0.

---

## UXPM-04 — HIGH — Error Summary غير مرتبط بالحقول

### الدليل

`FormErrorSummary.astro` جيد في:

- `role="alert"`
- `tabindex="-1"`
- focus after failed POST
- recovery copy

لكنه يعرض فقط:

- summary
- recovery
- back link

ولا يستقبل قائمة field errors ولا يقدم links للحقول المخالفة.

### قاعدة Pro Max

الـlocal guideline رقم 109 يطلب:

- summary أعلى form.
- focus إليه بعد failure.
- كل error item يربط مباشرة بالfield.
- inline errors تبقى موجودة.

### الإصلاح

وسع API للمكوّن إلى شيء مثل:

```ts
errors: Array<{
  fieldId: string;
  message: string;
}>
```

واعرض:

```html
<a href="#field-id">Error message</a>
```

مع بقاء inline `aria-describedby`.

### Acceptance

- validation متعددة الأخطاء تنتج summary links.
- الضغط/Enter على الرابط ينقل للfield.
- keyboard/screen-reader tested.
- لا يتم نقل focus مع كل blur؛ فقط failed submit summary.

---

## UXPM-05 — HIGH — Mutation feedback / double-submit غير موحد

### مثال مؤكد

`quarantine/admin/index.astro` في create template:

- JavaScript يعترض submit.
- لا يعطل الزر أثناء async request.
- لا يضع `aria-busy`.
- يبحث عن `[data-result]` لكن form markup لا يحتوي output بهذا الـselector.
- لذلك feedback client-side غير مكتمل وقد يمكن repeated submission.

### قاعدة Pro Max

- Loading Buttons = High.
- Submit Feedback = High.
- Error Feedback = High.

### الإصلاح

اعمل shared mutation UX contract لكل create/review/approve/void/release/e-sign flows:

```text
idle
→ submitting
→ success redirect/confirmation
→ recoverable error
→ conflict/stale
→ authorization changed
```

مع:

- disable only the triggering submit control.
- `aria-busy`.
- visible status.
- retained values.
- no duplicate mutation.
- no-JS POST remains fully functional.
- server remains authority.

### Acceptance

كل mutation surface يمر بنفس tests.

---

## UXPM-06 — MEDIUM — Collapsed Sidebar يعتمد على title بدل visible focus tooltip

### الدليل

عند collapsed:

```css
.nav-label { display:none }
```

والرابط يعتمد على:

```html
title={item.label}
```

### التعارض

المواصفة الحالية تقول collapsed state:

- Icon
- Tooltip
- Active indicator
- Label shown on hover/focus.

Browser `title` وحده ليس نمطًا كافيًا لضمان visible keyboard tooltip وتجربة موحدة.

### الإصلاح

- accessible name ثابت (`aria-label` أو text semantics سليمة).
- custom tooltip يعرض على hover **وfocus**.
- لا يكون tooltip هو الطريقة الوحيدة لفهم active state.
- forced-colors/reduced-motion safe.

---

## UXPM-07 — MEDIUM — Continuous global decorative animation / performance budget

### المصدر

`SystemBackground.astro` يعمل عبر الصفحات التي تستخدم BaseLayout افتراضيًا:

- DotLottie canvas.
- delayed start 180ms.
- infinite loop.
- reduced-motion supported.
- visibility pause supported.
- fallback جيد.

الأصول:

- `background.lottie` ≈ **1.20 MB**
- `dotlottie-player.wasm` ≈ **1.24 MB**

أي حوالي **2.44 MB** من assets قبل احتساب JS runtime، مع اختلاف النقل الفعلي حسب cache/compression.

### قاعدة Pro Max

- continuous decorative animation يجب تقليلها.
- bundle/asset weight يجب قياسه.
- motion لا يجب أن يشتت data-entry/controlled work.
- reduced-motion ممتاز لكنه ليس بديلًا عن performance budget.

### التوصية

- اجعل operational workspaces ثابتة أو أقل حركة افتراضيًا.
- احتفظ بالحركة حيث تضيف معنى، لا كزينة مستمرة.
- قس LCP/INP/CLS/CPU/GPU قبل وبعد.
- لا تحذف الخلفية فقط لأن لها animation؛ القرار بالدليل.

### Acceptance

- Web Vitals measured.
- no long tasks attributable to decorative animation.
- reduced-motion = static final state.
- background failure لا يؤثر على workflow.
- no layout shift.

---

## UXPM-08 — MEDIUM — Login authentication UX ينقصه password visibility control

Login الحالي:

- visible labels ✅
- password manager autocomplete ✅
- paste غير محظور ✅
- 48px controls ✅
- clear generic auth error ✅
- 3D decorative background aria-hidden ✅

لكن لا يوجد Show/Hide Password.

Pro Max يصنف Password Visibility كتوصية form usability.

### الإصلاح

- button semantic بجانب password.
- accessible name يتغير Show/Hide.
- `aria-pressed` أو equivalent state.
- لا يمسح القيمة.
- لا يمنع password managers.
- ≥24 CSS px target كحد WCAG web، ويفضل مساحة لمس مريحة في mobile layout.

---

## UXPM-09 — MEDIUM — Three.js UX performance/reproducibility يحتاج عقد أقوى

الإيجابيات الحالية:

- one renderer.
- DPR capped.
- reduced motion.
- visibility pause.
- context lost fallback.
- renderer/geometry/material/texture cleanup.
- resize + projection update.
- GLB ≈ 0.94 MB.

لكن:

`package.json`

يستخدم:

```json
"three": "^0.185.1"
```

بينما stack dataset المحلي لـPro Max يوصي بتثبيت exact Three.js release لضمان تطابق core/addons.

### الإصلاح

- pin exact version إن لم توجد سياسة dependency أخرى حاكمة.
- لا تعتمد على caret عند تحديث lock.
- قياس login LCP/CPU/GPU/JS parse.
- لا تجعل 3D شرطًا لإمكانية تسجيل الدخول.
- fallback يبقى first-class.

---

## UXPM-10 — LOW — Viewport contract غير كامل بحسب guideline

BaseLayout:

```html
<meta name="viewport" content="width=device-width" />
```

Pro Max guideline يوصي:

```html
width=device-width, initial-scale=1
```

لا تضف `maximum-scale=1` ولا `user-scalable=no`.

Acceptance:

- zoom يبقى مسموحًا.
- 200% browser zoom tested.
- text spacing overrides tested.
- no fixed-height clipping.

---

# 6) نقاط قوية يجب عدم كسرها

أي إعادة تصميم يجب أن تحافظ على التالي:

### Design System

- Dark-only v1.
- Unified Dark Enterprise QC Control Room.
- Inter.
- operational spacing/tokens.
- calm/high-trust visual language.
- no marketing/gaming/crypto aesthetic.

### Semantic truth

- PASS ≠ RELEASED.
- Backup succeeded ≠ Restore verified.
- AI optional degradation ≠ core system failure.
- UI never invents authorization.
- UI never turns UNKNOWN/UNVERIFIED into green.

### Forms

- no-JS POST baseline.
- server reauthorization.
- retained values on recoverable failure.
- safe errors.
- concurrency/stale handling.
- Cancel/Back context.
- no raw UUID/JSON/storage model fields for operators.

### Navigation

- ordinary operational visibility follows the approved AVD decision.
- owner/admin exclusions remain server controlled.
- navigation visibility is not mutation authority.

---

# 7) الأشياء غير المتحققة — لا يجوز تحويلها إلى PASS

1. **Real browser 200% zoom** على production.
2. **All-role/persona live matrix**:
   - active member
   - employee/data-entry
   - supervisor
   - manager
   - admin
   - SYSTEM_OWNER/yazeed
   - unauthorized/inactive.
3. **Production no-JS mutation recovery** باستخدام disposable fixtures.
4. **Current deployed build identity == audited Git SHA**.
5. **Current HEAD CI** — لا status checks/runs مستقلة ظاهرة.
6. **Web Vitals**:
   - LCP
   - INP
   - CLS
   - long tasks
   - asset transfer
   - GPU/context stability.
7. **Full keyboard pass لكل controlled workflow**.
8. **Contrast computed from rendered/composited runtime states** لكل surfaces.

---

# 8) ترتيب التنفيذ النهائي

## P0 — قبل أي polish بصري

1. إصلاح Dashboard/Universal Topbar.
2. إصلاح semantic token aliases + contrast.
3. ربط Topbar counts بauthorized server data.
4. ترقية FormErrorSummary إلى linked error summary.
5. توحيد mutation loading/error/success/double-submit contract.

## P1

6. Collapsed sidebar visible tooltip on hover/focus.
7. Password visibility.
8. Motion/background performance policy.
9. Three.js exact-version/performance budget.

## P2

10. Viewport metadata polish.
11. microcopy consistency.
12. measured Web Vitals tuning.
13. full role/mobile/zoom UAT.

---

# 9) استراتيجية الاختبار المطلوبة

## Accessibility

- axe WCAG 2.2 AA.
- keyboard only.
- focus visible.
- focus not obscured.
- 200% zoom.
- forced colors.
- reduced motion.
- error summary links.
- status contrast.
- password manager/paste.

## Responsive

على الأقل:

```text
320
375
414
768
1024
1440
```

واختبار:

- portrait.
- landscape where useful.
- long tokens.
- long business names.
- table scroll containment.
- no page-level horizontal overflow.

## Forms

لكل mutation:

```text
JS enabled
JS disabled
validation error
authorization denied
stale version
dependency unavailable
double click
slow response
success redirect
back/cancel
```

## Navigation

- Dashboard + every top-level domain.
- collapsed/expanded desktop.
- mobile drawer.
- Escape.
- Tab/Shift+Tab containment.
- focus return.
- breakpoint transition.
- direct deep links.
- browser back.

## Performance

- initial login.
- authenticated dashboard.
- one data-heavy table.
- one form-heavy page.
- one chart/report page.

قِس ولا تخمّن.

---

# 10) الحكم النهائي

**Source maturity:** مرتفع مقارنة بالتقرير السابق.  
**Legacy source finding closure:** **93.3% (14/15)** — ليست readiness score.  
**Last documented conservative live result:** **58.3% (7/12 PASS)** مع **5 NOT VERIFIED**.  
**Current Pro Max verdict:** **Needs changes**.

السبب ليس وجود انهيار شامل، بل وجود عدة HIGH findings مرتبطة بعناصر عالمية:

- Shell/navigation.
- semantic visual truth.
- operational counts.
- accessible form recovery.
- mutation feedback.

إغلاق هذه البنود ثم إعادة تحقق حي على **نفس deployed SHA** هو الطريق الصحيح للوصول إلى حكم Production UI/UX قابل للدفاع عنه.
