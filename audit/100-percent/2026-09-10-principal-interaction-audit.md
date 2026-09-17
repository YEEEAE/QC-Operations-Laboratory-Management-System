# Principal Interaction Audit — QC Operations & Laboratory Management System

**التاريخ:** 2026-09-10  
**النطاق:** تفاعلات الويب التشغيلية في `src/pages` و`src/ui`  
**المرجع:** `Documents/UI-UX-SPECIFICATION.md`، `Documents/STATE-MACHINES.md`، `Documents/ERROR-ARCHITECTURE.md`، `Documents/SYSTEM-INVARIANTS.md`  
**الحكم:** `PARTIAL / NEEDS LIVE AUTHENTICATED EVIDENCE`

## ملخص تنفيذي

الواجهة عندها أساس جيد: server-side authorization، منع `window.alert/confirm/prompt`، contract موحّد للـasync mutations، `aria-busy`، حفظ المدخلات، focus واضح للأخطاء، وdrawer جوال فيه inert/focus trap/Escape. لكن التنفيذ الحالي ما يزال غير متجانس على مستوى كل الصفحات:

- فيه 31 صفحة فيها `<script>` inline و26 نموذجًا يستخدم `data-submit`، وهذا يرفع احتمال اختلاف loading/error/focus بين المساحات.
- `ConfirmDialog` و`ESignatureDialog` و`DataTable` و`SortHeader` و`Pagination` و`ToastRegion` معرفة كمكوّنات مشتركة لكن غير مستخدمة فعليًا في الصفحات؛ لذلك لا يوجد تطبيق جامع يمكن إثباته على كل register/قرار.
- الصفحات الكبيرة تعتمد غالبًا على GET server navigation بدل pagination/sort primitives المشتركة؛ هذا آمن دلاليًا لكنه ليس عقدًا موحّدًا لسلوك loading/scroll preservation.
- أي action حساس يبقى محكومًا بالسيرفر؛ ظهور الزر لا يمنح permission، ولا يجوز للواجهة اختراع PASS/RELEASE أو تجاوز version/SoD/e-signature.

## مصفوفة التفاعلات

كل صف يحدد العقد المطلوب للتفاعل: **trigger → immediate → intermediate → completion → failure → cancellation → recovery → keyboard/focus → permission/state dependency**.

| التفاعل | العقد التشغيلي المطلوب | الاعتمادية والقيود |
|---|---|---|
| Click على رابط تنقل/بطاقة/صف | الانتقال يبدأ فورًا من target واضح؛ لا يوجد click على حاوية غامضة أو hover-only؛ أثناء navigation لا يتغير layout قبل وصول الصفحة؛ completion هو ظهور الوجهة وH1؛ failure يعرض صفحة/حالة خطأ قابلة للرجوع؛ Cancel = Back أو الرابط السابق؛ recovery = Retry/Back. Tab يصل للرابط، Enter يفتحه، focus يبدأ على H1/الموضع المتوقع. | visibility عامة لصفحات التشغيل العادية بعد authentication؛ mutation/health/admin لا يستنتج من visibility. |
| Sidebar collapse / mobile drawer | click أو `Ctrl/Cmd+K` (للبحث) يعطي pressed/expanded state مباشرة؛ drawer يثبت الخلفية بـ`inert` وscroll lock؛ completion عند فتح/إغلاق drawer؛ Escape يغلق ويرجع focus إلى toggle؛ failure لا يترك drawer نصف مفتوح؛ recovery بإعادة الفتح. | `aria-expanded` و`aria-controls`؛ لا ينتقل focus إلى عناصر خلف drawer؛ active route non-color. |
| Keyboard navigation / hover / focus / tooltip | كل control native أو له role/name/state؛ hover يضيف توضيحًا فقط ولا يحمل action وحيدًا؛ focus-visible واضح بدون تغيير layout؛ tooltip يظهر أيضًا مع focus ويختفي عند blur/Escape. | لا hover-only؛ focus يبقى ظاهرًا ولا يغطيه header/drawer؛ reduced motion يلغي الحركة غير الضرورية. |
| Search / filtering | Enter أو زر Search/Filter يرسل GET بمعايير معتمدة؛ immediate feedback هو إبقاء query/filter values؛ intermediate = server request/ثبات layout؛ completion = result count أو empty/provider-unavailable؛ failure = لا يظهر empty/zero كاذب؛ cancel = Clear/عودة للرابط الأصلي؛ recovery = توسيع query أو إعادة المحاولة. Ctrl/Cmd+K يركز search surface/ينقل له، وTab/Enter يعملان بدون pointer. | النتائج authorized فقط؛ provider unavailable منفصل عن empty؛ لا كشف لوجود unauthorized record. |
| Select / checkbox / row selection | التغيير يظهر selected state فورًا مع label؛ intermediate لا يرسل mutation تلقائيًا إلا إذا كان العقد يصرح؛ completion بعد Apply/Submit؛ failure يحافظ على الاختيار ويعرض سببًا؛ cancel يعيد الاختيار السابق عند وجود draft. Space/Arrow/Enter بحسب native control، focus لا يقفز. | selection لا يغيّر state controlled من العميل؛ linked option يعاد التحقق منه خادميًا ويُرفض stale selection. |
| Sort / pagination | click على header أو Next/Previous يرسل URL حتميًا، يحافظ على باقي filters ويعيد page إلى 1 عند sort؛ immediate = `aria-sort`/label وdisabled boundary؛ intermediate = loading/عدم duplicate clicks؛ completion = table/caption/page indicator؛ failure = يحتفظ بالـURL ويعرض provider/error؛ cancel = العودة للصفحة السابقة؛ recovery = retry. Keyboard Tab/Enter، وdisabled boundary ليس رابطًا قابلًا للضغط. | deterministic server sort، scope/authorization على كل صفحة، لا claim أن count كامل عند provider unavailable. |
| Form field / validation | typing/paste مسموح، label/hint/error مرتبط بـ`for`/`aria-describedby`؛ immediate validation لا تمسح البيانات؛ submit يظهر Saving/Processing ويعطل triggering submit فقط؛ completion = success + redirect/record id؛ failure = inline errors + summary focus؛ cancel = رابط حقيقي لا يرسل؛ recovery = تصحيح الحقول أو retry مع بقاء القيم. | server هو مصدر الحقيقة؛ client يرسل intent/fields لا final state؛ no-JS POST يبقى صالحًا. |
| Submit / create / edit / save draft | click أو Enter يمنع duplicate عبر `aria-busy` وguard؛ intermediate status قابل للقراءة؛ success واضح وليس silent؛ validation/auth/conflict/dependency/unknown لها نسخ منفصلة؛ cancellation قبل submit لا يحتاج confirmation، وبعد submit لا يلغي request إلا إذا دعم transport ذلك؛ recovery يحافظ على draft/القيم. | create/edit permissions + scope + state؛ controlled records لا تعدل في place بعد APPROVED/SIGNED/CLOSED/VOID/SUPERSEDED. |
| Routine safe transition: activate/start/hold/resume/complete/reopen | button يوضح الفعل والـcurrent state؛ immediate pressed/loading؛ intermediate button disabled/output status؛ completion يعرض الحالة الجديدة ويربط next step؛ failure يعرض stable reason وretry/reload؛ cancel قبل الطلب لا mutation؛ recovery = reload latest ثم إعادة المحاولة إذا بقيت transition صالحة. Enter/Space يعملان وfocus يبقى على result/action region. | action permission + current state + version + scope + business rule؛ unknown transition = deny. |
| Approve / reject / return / review | فتح workspace يعرض subject/version/evidence قبل القرار؛ submit القرار مع reason إن لزم؛ intermediate reauthorization/e-sign/SoD check؛ completion فقط بعد server transition وaudit/outbox؛ failure يميز stale/authz/validation/dependency؛ cancel يغلق القرار بدون mutation؛ recovery = latest version/review evidence. في modal يبدأ focus على intent/reason أو أول control ويعود للـopener. | approval لا يعني entity state تلقائيًا؛ reviewer/approver وSoD وe-sign حسب policy؛ AI لا يقرر. |
| Release / PASS / hold / inspection result | UI يعرض Receiving Workflow State وInspection Result وRelease System State منفصلة؛ completion لا يساوي PASS إلا إذا transition release نجحت؛ failure يشرح precondition؛ cancel لا يغير نتيجة علمية؛ recovery يعرض evidence/refresh. keyboard مثل بقية buttons. | PASS != RELEASED؛ لا scientific limits/formulas/rounding من UI؛ release requires explicit policy/state/version/permission. |
| Void / supersede / cancel / destructive action | trigger يوضح أنه irreversible/historical؛ modal مقصود فقط عند destructive/irreversible action ويعرض record/version/intent/reason؛ immediate lock بعد confirm؛ intermediate processing؛ completion state history/audit visible؛ failure لا يعلن success؛ cancel عبر Escape/Cancel/close بدون POST؛ recovery latest record أو corrective workflow، وليس overwrite/delete. | VOID/SUPERSEDED تحفظ التاريخ؛ draft deletion فقط إذا transition معتمدة؛ confirmation لا تستخدم للتصرفات الروتينية الآمنة. |
| Restore / backup / verify | restore button يشرح أنه تشغيل controlled؛ confirmation مع environment/backup identity/expected effect؛ intermediate مراحل REQUESTED→PRECHECK→RESTORING→VERIFYING؛ completion فقط PROVEN بعد verification؛ failure يحافظ على evidence ولا يحولها PROVEN؛ cancel قبل التنفيذ فقط؛ recovery retry للمرحلة المسموحة أو drill جديد. focus يعود للزر/status. | backup success != restore verified؛ permission وowner/scope وstate machine؛ لا retry أعمى لعملية غير idempotent. |
| Drawer / modal / e-signature | trigger native button؛ immediate `showModal` + backdrop؛ intermediate focus trap وscroll lock؛ completion عند close/submit result؛ failure يبقى داخل modal مع focus على error؛ cancel/ESC يغلقان بلا mutation؛ recovery يحتفظ بالقيم إذا فشل submit. focus يعود للـopener حتى لو تغيرت الصفحة/العنصر. | e-signature = meaning→reauth→reauthorize→state/version/SoD→evidence؛ password ليس signature evidence. |
| Table action / row action | target مستقل وواضح داخل الصف؛ لا تجعل الصف كله destructive؛ immediate focus/pressed؛ intermediate يمنع duplicate لنفس action فقط؛ completion يحدّث row/status أو ينتقل للتفاصيل؛ failure يبقي row ويفصل provider/conflict؛ cancel بدون mutation؛ recovery reload latest. keyboard يمر على action controls بترتيب بصري. | action يظهر فقط إذا state/permission يسمحان presentation-wise، مع server denial كمرجع نهائي. |
| Notifications / toast / badge | فتح notifications يوضح Unread/All؛ click notification يفتح record حقيقي؛ immediate status لا يكون رقمًا عاريًا؛ intermediate provider loading؛ completion read/destination؛ failure provider-unavailable بدون تصفير badge؛ cancel = رجوع؛ recovery retry. Tab/Enter، Escape يغلق overlays، ولا ينقل focus بسبب badge update. | notification ليست business truth؛ badge هو count authorized actionable items فقط؛ لا `aria-live` مستقل لكل رقم. |
| Global success/error/provider/stale state | كل نتيجة تحمل next step واضحًا: retry/reload latest/return/clear filters/contact owner حسب الحالة؛ لا silent action ولا generic “something went wrong” وحدها؛ focus على summary/result عند submit أو stale. | `AppError`/stable categories، لا raw SQL/stack/secret؛ stale لا يسمح overwrite anyway؛ provider unavailable لا يتحول إلى empty/zero. |

## القرارات عالية المخاطر

- **Friction مقصود:** approve/reject/release/void/supersede/restore/e-signature تحتاج evidence + version + server recheck، وconfirmation فقط عند irreversibility أو أثر تشغيلي حقيقي.
- **Friction منخفض:** navigation، search، filtering، sort، pagination، cancel قبل submit، وفتح record لا تحتاج confirmation؛ feedback يكون فوريًا وواضحًا.
- **Progressive disclosure:** القرار يبدأ بملخص الحالة والنسخة، ثم يكشف reason/e-signature/evidence عند الحاجة؛ لا يخلط كل تفاصيل policy في أول viewport.
- **Motion:** transition قصير للـfocus/feedback فقط؛ `prefers-reduced-motion` يلغي الحركة، ولا تستخدم الحركة لتأكيد نجاح mutation بدل النص/state.

## فجوات التنفيذ الحالية

| الأولوية | الفجوة | الدليل | الإجراء |
|---|---|---|---|
| P0 | primitives المشتركة غير موصولة بالصفحات | `ConfirmDialog`, `ESignatureDialog`, `DataTable`, `SortHeader`, `Pagination`, `ToastRegion` لا تظهر في usages فعلية | اعتماد migration تدريجي حسب route family، مع اختبار contract لكل primitive قبل توسيع الاستخدام |
| P1 | اختلاف inline mutation handlers | 31 صفحة فيها `<script>` inline و26 نموذجًا بـ`data-submit` | جعل `enhanceMutationForm` نقطة الاستخدام الافتراضية، مع adapters صغيرة فقط لـpayload/redirect |
| P1 | live authenticated matrix غير متاح | لا توجد جلسة/fixture في هذه الجولة | إعادة اختبار click/keyboard/focus/stale/authz/provider على identities disposable |
| P2 | registers لا تستخدم sort/pagination المشتركة | القوائم الحالية server GET محلية لكل صفحة | توحيد query contract بعد اعتماد backend pagination/deterministic sort؛ لا إضافة client filtering على controlled data |
| P2 | e-sign/confirmation adoption غير مثبت | primitives معرفة لكن غير مستخدمة فعليًا | ربطها فقط بالمسارات التي يثبت فيها route/state policy الحاجة، وعدم إضافة confirmations روتينية |

## مصفوفة تحقق التنفيذ

- `dialog.ts`: focus أولي، fallback للعنوان، Escape/native cancel، close/return-focus، منع double enhancement.
- `ConfirmDialog`: heading focusable، labels صحيحة، reason مرتبط، Cancel/Confirm native keyboard controls.
- `Pagination`: disabled boundary ليس رابطًا، rel prev/next، aria-label للوجهة، live page indicator.
- `SortHeader`: `aria-sort`، label يشرح الاتجاه القادم، target لا يقل عن control height المشتركة.
- mutation contract الحالي: `aria-busy`، منع duplicate، حفظ القيم، تصنيف validation/conflict/authz/dependency/unknown، focus على recovery.

## حدود الدليل

هذا التدقيق static + unit/build verification. لم يُنفذ login أو POST أو approve/reject/release/void/restore أو تغيير إنتاجي. لذلك لا يوجد claim أن كل role/scope/state أو كل سلوك browser/assistive technology مثبت حيًا. يلزم تشغيل مصفوفة مصادق عليها ببيانات disposable قبل اعتماد النتيجة كـrelease evidence.
