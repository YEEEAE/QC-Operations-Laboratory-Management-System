# QC Operations & Laboratory Management System — Project Mind

## [2026-09-10] — تدقيق وكتابة UX للنصوص المنظمة

### تم التنفيذ
- أنشأت قاموسًا قابلًا لإعادة الاستخدام للنصوص والأفعال والحالات والحدود التنظيمية في `src/shared/copy/ux-vocabulary.ts`، مع إبقاء NCR/CAPA/PASS/RELEASED والمصطلحات المنظمة كما هي.
- وحّدت الأفعال الحرجة إلى صيغ تشغيلية مثل `Submit for review` و`Record restore request` و`Sign and continue` بدل العبارات العامة.
- حسّنت حالات عدم التوفر والـempty/error states بحيث لا تخلط provider failure مع empty/zero، وتعرض مسار تعافٍ واضحًا.
- حسّنت تسمية التنقل ومرشحات سجل التدقيق، وأزلت تسريب `Subject type` و`Actor id` كعناوين تشغيلية لصالح `Record type` و`Record reference` و`Changed by`.
- ثبّتُّ في AI Advisory حدًّا صريحًا أن الناتج استشاري فقط، وثبّتُّ في القاموس الفصل بين backup وrestore verification وبين PASS وrelease.
- أنشأت تقرير التدقيق `audit/2026-09-10-ux-writing-audit.md` يغطي navigation/page copy/actions/states/errors/AI/System Health/Backup/Restore/Audit والحدود المتبقية.

### الملفات المتأثرة
- `src/shared/copy/ux-vocabulary.ts`
- `src/ui/navigation/navigation.ts`
- `src/ui/components/feedback/ProviderUnavailableState.astro`
- `src/ui/components/feedback/ErrorState.astro`
- `src/ui/components/forms/FormActions.astro`
- `src/ui/components/forms/ErrorSummary.astro`
- `src/ui/components/data/EmptyTableState.astro`
- `src/ui/components/governance/ESignatureDialog.astro`
- `src/pages/ai-advisory.astro`
- `src/pages/audit.astro`
- `audit/2026-09-10-ux-writing-audit.md`
- `tests/unit/ui/action-vocabulary.test.ts`

### التحقق
- `pnpm exec vitest run tests/unit/ui/action-vocabulary.test.ts tests/unit/ui/icon-and-copy-contract.test.ts tests/unit/ui/navigation-permissions.test.ts tests/unit/ui/form-ux-contract.test.ts` ✅ — 4 ملفات / 20 اختبارًا.
- `pnpm test:unit` ✅ — 68 ملفًا / 423 اختبارًا.
- `pnpm test:architecture` ✅.
- `pnpm exec astro check` ✅.
- `pnpm build` ✅ — تحذيرات Node 22/chunk المعروفة فقط.
- `git diff --check` ✅.
- Browser/provider/outbox runtime ⚠️ لم يُثبت في هذه الجولة؛ لا fixture مصادق ولا تحقق حي من كل نصوص notifications المولدة من البيانات.

### النتيجة
- **الحالة:** جزئي ناجح محليًا / يحتاج live evidence.
- **مختصر:** تم توحيد ورفع دقة النسخ في المكونات والأسطح الحساسة مع حفظ المعاني المنظمة، لكن لا يوجد claim بأن كل notification runtime تستخدم القاموس حتى تُفحص ببيانات مصادق عليها.

### ملاحظات / مشاكل مفتوحة
- ما صار commit أو push أو deploy.
- ما زالت بعض الصفحات تحتوي نصوصًا محلية قديمة خارج المكونات والأسطح المعدلة، وتحتاج ترحيلًا تدريجيًا للقاموس مع اختبار browser مصادق.

## [2026-09-10] — إصلاح ملاحظات نماذج UX للبيانات المنظمة

### تم التنفيذ
- راجعت 48 نموذجًا فعليًا تحت `src/pages` و`src/ui` ضمن Tasks وQuality وQuarantine وLaboratory وAssets وDocuments وAdministration وControlled Actions.
- أزلت نموذج إدخال UUID من `/admin/scopes` واستبدلته بالوصول عبر سجل الأعضاء المصرح به، بحيث لا يكتب المشغل معرّفًا تقنيًا يدويًا.
- حسّنت Approval review بإخفاء subject/requester IDs وbackend enums من العرض البشري، مع إبقاء المراجع hidden اللازمة لعقد الخادم وتحويل labels إلى تسميات سياقية.
- ربطت حقول inspection notes وreturn reason بعناصرها عبر `for/id`، وأضفت `data-submit` لحفظ draft، وفعّلت required لسبب Approval عند Return/Reject.
- أضفت تقرير remediation ومجموعة regression tests تمنع رجوع UUID exposure أو فقدان label association أو dependency الخاصة بسبب القرار.

### الملفات المتأثرة
- `src/pages/admin/scopes/index.astro`
- `src/pages/approvals/[approvalId].astro`
- `src/pages/quarantine/inspections/[inspectionId]/execute.astro`
- `src/pages/quarantine/inspections/[inspectionId]/review.astro`
- `audit/2026-09-10-regulated-form-ux-remediation.md`
- `tests/unit/ui/form-ux-contract.test.ts`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm exec vitest run tests/unit/ui/form-ux-contract.test.ts tests/unit/ui/mutation-post.test.ts tests/unit/ui/app-shell.test.ts` ✅ — 3 ملفات / 61 اختبارًا.
- `pnpm test:unit` ✅ — 68 ملفًا / 422 اختبارًا.
- `pnpm test:architecture` ✅.
- `pnpm exec astro check` ✅ — 0 أخطاء، 0 warnings، 62 hints قائمة من قبل.
- `pnpm build` ✅ — server/client build مكتمل؛ بقيت تحذيرات Node 22 خارج عقد المشروع وتحذير chunk Three.js المعروف.
- `git diff --check` ✅.
- Browser المصادق وPOST/no-JS والـrole/stale/provider matrix ⚠️ لم تُثبت لغياب fixture/بيئة تشغيل مناسبة.

### النتيجة
- **الحالة:** نجح محليًا / يحتاج live evidence.
- **مختصر:** أُصلحت الملاحظات المؤكدة في النماذج بدون تغيير authorization أو state machine أو business/scientific policy، ووُثقت حدود ما يحتاج backend fixture أو قرار مالك.

### ملاحظات / مشاكل مفتوحة
- لا commit أو push أو deploy.
- حقول `severity` و`priority` و`maintenance type` بقيت نصية لأن الوثائق الحالية لا تعتمد vocabularies كاملة لها؛ لا يجوز اختلاق allowed values.
- يلزم تشغيل متصفح مصادق للتحقق من جميع المسارات والمقاسات وPOST/no-JS قبل أي claim اكتمال.

## [2026-09-10] — Principal interaction audit وتنضيج primitives المشتركة

### تم التنفيذ
- أنشأت `audit/2026-09-10-principal-interaction-audit.md` بمصفوفة تفاعلات تغطي click/keyboard/hover/focus/search/filter/select/submit/transition/approve/reject/release/void/restore/edit/cancel/drawer/modal/table/notifications وحالات النجاح والفشل والإلغاء والتعافي والـpermission/state dependency.
- وثّقت فجوات الاستخدام الحالية: 31 صفحة فيها inline scripts، و26 نموذج mutation، وprimitives مشتركة (`ConfirmDialog`/`ESignatureDialog`/`DataTable`/`SortHeader`/`Pagination`/`ToastRegion`) غير موصولة فعليًا بالصفحات.
- نضّجت `initDialogs` ليمنع duplicate enhancement، يدعم native Escape/cancel، يختار focus أولي آمن، ويرجع focus للـopener المتصل فقط بعد الإغلاق.
- حسّنت `ConfirmDialog` بربط reason بالـlabel، عنوان قابل للتركيز، وزر close semantic قابل للكيبورد.
- حسّنت `Pagination` بحيث disabled boundaries ليست روابط قابلة للتركيز/النقر، وأضفت rel/aria-label/page status؛ وحسّنت `SortHeader` ليعلن اتجاه الفرز القادم ويحافظ على control height المشتركة.
- أضفت regression assertions لعقد dialog/pagination/sort بدون تغيير authorization أو state machine أو server mutation flow.

### الملفات المتأثرة
- `audit/2026-09-10-principal-interaction-audit.md`
- `src/ui/client/dialog.ts`
- `src/ui/components/feedback/ConfirmDialog.astro`
- `src/ui/components/data/Pagination.astro`
- `src/ui/components/data/SortHeader.astro`
- `tests/unit/ui/app-shell.test.ts`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm exec vitest run tests/unit/ui/app-shell.test.ts tests/unit/ui/design-system-maturity.test.ts tests/unit/ui/mutation-post.test.ts` ✅ — 3 ملفات / 61 اختبارًا.
- `pnpm test:unit` ✅ — 67 ملفًا / 417 اختبارًا.
- `pnpm exec astro check` ✅ — 0 أخطاء، 0 warnings، و62 hints قائمة.
- `pnpm test:architecture` ✅.
- `pnpm build` ✅ — تحذيرات Vite/chunk المعروفة، وNode `v22.22.3` خارج عقد المشروع.
- `git diff --check` ✅.
- Browser/local runtime ⚠️ NOT VERIFIED — تشغيل Astro المحلي فشل بسبب `listen EPERM` على `127.0.0.1:4321`؛ لا login ولا POST ولا mutation ولا production action نُفذت.

### النتيجة
- **الحالة:** نجح محليًا / PARTIAL live evidence.
- **مختصر:** صار عند المشروع تدقيق تفاعلات قابل للتتبع وتحسينات فعلية في focus/cancel/disabled sort-pagination، مع إبقاء friction والتفويض/state rules حسب الأساس المعتمد. التوصيل الكامل لكل الصفحات والتحقق المصادق ما زال دفعة لاحقة.

### ملاحظات / مشاكل مفتوحة
- يلزم migration تدريجي من inline mutation handlers إلى `enhanceMutationForm`/adapters مشتركة، وربط primitives بالـroute families بعد اعتماد backend pagination/sort.
- يلزم تشغيل مصفوفة browser مصادق عليها ببيانات disposable للتحقق من approve/reject/release/void/restore/stale/provider/unavailable.
- لا commit أو push أو deploy.

## [2026-09-10] — تدقيق Information Architecture كامل وتحسينات wayfinding آمنة

### تم التنفيذ
- أنشأت `audit/2026-09-10-information-architecture-audit.md` كمصفوفة شاملة للمسارات الفعلية تربط Domain/Page/Route/Record/Task/Read visibility/Mutation permission/State/Scope/Next destination، مع تدقيق Sidebar وTopbar وBreadcrumbs وSearch وDeep links وCross-domain links وBack/approval/notifications/audit/admin.
- طبقت قاعدة AVD صراحة في التقرير: كل عضو `ACTIVE` ومصادق عليه يقرأ صفحات وسجلات التشغيل العادية، بينما الأفعال الحساسة تبقى permission + scope + state + SoD + version + business-rule aware.
- صححت route metadata لمساري `/admin/permissions` و`/admin/scopes` ليطابقا ملفات `index.astro` الموجودة فعليًا.
- حسّنت `routeBreadcrumbs` لتعرض سياق المجال وworkflow suffixes (`New record`/`Review`/`Execution`/`Record detail`) بدون اختراع رابط `/system` أو كشف record IDs من metadata العامة.
- أضفت `aria-current="page"` للرابط النشط في Sidebar مع إبقاء active styling غير معتمد على اللون فقط.
- أضفت regression test للتنقل والـbreadcrumbs، وسجلت فجوات runtime المصادق وprovider/register states كـPARTIAL/NOT VERIFIED بدل false-green.

### الملفات المتأثرة
- `audit/2026-09-10-information-architecture-audit.md`
- `src/ui/navigation/navigation.ts`
- `src/ui/shell/Sidebar.astro`
- `src/shared/routing/routes.ts`
- `tests/unit/ui/navigation-permissions.test.ts`
- `tests/unit/ui/universal-shell.test.ts`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm exec vitest run tests/unit/ui/navigation-permissions.test.ts tests/unit/ui/universal-shell.test.ts tests/unit/ui/app-shell.test.ts` ✅ — 3 ملفات / 19 اختبارًا.
- `pnpm exec astro check` ✅ — 0 أخطاء، 0 warnings، و62 hints قائمة مسبقًا.
- `pnpm build` ✅ — server/client build مكتمل؛ تحذير Node `v22.22.3` خارج عقد المشروع، وتحذيرات bundle المعروفة قائمة.
- `git diff --check` ✅.
- لم تُنفذ أي login أو POST أو mutation أو commit أو push أو deploy.

### النتيجة
- **الحالة:** نجح محليًا / PARTIAL runtime evidence.
- **مختصر:** صار عند النظام تقرير IA قابل للتتبع وتحسينات wayfinding/semantic navigation بدون تغيير سياسة الأمن أو صلاحيات الأفعال، لكن مصفوفة الأدوار/النطاقات الحية وسلوك browser/AT الكامل ما زال يحتاج fixture مصادق وبيئة تشغيل مناسبة.

### ملاحظات / مشاكل مفتوحة
- يلزم لاحقًا توحيد pagination/sort/loading/stale والوجهة التالية على registers الكبيرة، وربط counts بمصادر خادمية حقيقية فقط.
- مسارات `/quality` و`/laboratory` و`/assets` صارت ظاهرة في breadcrumbs كوجهات مجال؛ ما أُضيفت كعناصر Sidebar حتى ما تتكرر الوجهات الحالية.

## [2026-09-10] — تدقيق responsive والكثافة الكامل على route families مع assertions للـoverflow

### تم التنفيذ
- أضفت `responsive-density-audit.spec.ts` لتدقيق route families الفعلية: overview، quality، quarantine، laboratory، assets، documents/governance، وadvisory/system، مع شرط fixture مصادق حتى لا تتحول الصفحات الفارغة إلى false-green.
- غطت اختبارات E2E المقاسات `320/375/414/768/1024/1440`، phone landscape، tablet landscape، اتجاهي LTR/RTL، 200% browser-scale، text-spacing overrides، والكثافات comfortable/standard/compact.
- أضفت assertions على document/body overflow، bounding boxes للـmain/fieldsets/action bars/dialogs/drawer، احتواء table scroll، clipping للنصوص الأساسية، وإبقاء أزرار النماذج وstatus badges قابلة للرؤية.
- عدّلت contract الـresponsive العام ليعطي flex/grid children `min-width:0` و`overflow-wrap:anywhere` مع إبقاء الجداول مالكة للـhorizontal scroll، ووسّعت reflow للـtopbar على الجوال.
- رفعت `compact` density من `32px` إلى `40px`: الكثافة تقلل الفراغات وحشو الصفوف، لكنها ما تنزل control usability تحت الحد العام.
- أضفت regression unit assertion لعقد compact density واحتواء الجداول، بدون تحويل الجداول المكتبية إلى cards.

### الملفات المتأثرة
- `tests/e2e/responsive-density-audit.spec.ts`
- `tests/unit/ui/design-system-maturity.test.ts`
- `src/ui/styles/density.css`
- `src/ui/styles/global.css`
- `src/ui/layouts/AppLayout.astro`
- `src/ui/shell/Topbar.astro`

### التحقق
- `pnpm exec vitest run tests/unit/ui/design-system-maturity.test.ts tests/unit/ui/universal-shell.test.ts tests/unit/ui/mobile-drawer-inert.test.ts` ✅ — 3 ملفات / 22 اختبارًا.
- `pnpm exec eslint tests/e2e/responsive-density-audit.spec.ts tests/unit/ui/design-system-maturity.test.ts` ✅.
- `pnpm exec astro check` ✅ — 0 أخطاء، 0 warnings، و62 hints موجودة مسبقًا؛ Node `v22.22.3` خارج عقد المشروع `>=24.20.0 <25`.
- `pnpm build` ✅ — server/client build مكتمل مع تحذيرات Vite المعروفة.
- `git diff --check` ✅.
- `pnpm exec playwright test tests/e2e/responsive-density-audit.spec.ts --reporter=line` ⚠️ — 14 حالة لم تصل للـassertions بسبب قيد Chromium headless المحلي `MachPortRendezvous ... Permission denied`؛ كذلك fixture المصادق `QC_E2E_LOGIN_IDENTITY/QC_E2E_PASSWORD` غير متوفر، لذلك لا يوجد evidence حي للمحتوى المصادق في هذه الجولة.
- `pnpm lint` ⚠️ — فشل عام بسبب 143 خطأ قديم في `.opencode/skills/brand/**`؛ لا أخطاء من ملفات المهمة في lint المستهدف.
- لم تُنفذ أي login أو POST أو mutation أو commit أو push أو deploy.

### النتيجة
- **الحالة:** جزئي / NEEDS LIVE EVIDENCE.
- **مختصر:** عقود responsive والكثافة وقياسات E2E أضيفت محليًا مع build/unit evidence، لكن تشغيل المصفوفة على current authenticated content يحتاج بيئة Chromium/fixture مصادق قابلة للتشغيل.

### ملاحظات / مشاكل مفتوحة
- يلزم إعادة تشغيل `tests/e2e/responsive-density-audit.spec.ts` بقاعدة/fixture مصادق وChromium مسموح، ثم تسجيل نتائج كل route family والمقاس بدل اعتبار skipped أو provider-unavailable نجاحًا.
- أخطاء lint داخل `.opencode/skills/brand` ما زالت خارج نطاق المهمة وتحتاج تنظيفًا منفصلًا.

## [2026-09-10] — تدقيق أسطح البيانات والقرارات كمحطة QC مؤسسية

### تم التنفيذ
- جردت أسطح Dashboard وFindings/NCR/RCA/CAPA وReceiving/Inspection/Quarantine وLaboratory وEquipment/Calibration/Maintenance وDocuments وChange Requests وApprovals وReports وAudit وBackups وSearch وNotifications وAdmin registers من الكود الحالي.
- أثبتُّ static أن `DataTable` و`SortHeader` و`LoadingState` و`StaleVersionState` غير مستخدمة فعليًا داخل `src`، وأن `Pagination` لا تظهر خارج تعريفها؛ لذلك أغلب القوائم بلا sort/pagination/loading/stale contract موحّد.
- وثّقت false empty/false zero عند فشل مزوّد القراءة في Dashboard/Search/Notifications وعدة registers، مع بقاء التفويض server-side وعدم كشف unauthorized search results.
- وثّقت فجوات اكتمال NCR/RCA/CAPA، وحقول القرار الناقصة في Laboratory/Findings، وفجوات filters/context في الجداول التشغيلية، مع تثبيت أن PASS منفصل عن RELEASED وBackup success منفصل عن Restore Verified.
- راجعت قرارات الرسوم: لا chart مستخدم فعليًا؛ لم أختلق metrics أو series، وسجلت أن trend الفارغ صادق لكنه يترك Dashboard/Reports ناقصة إلى أن يدعمها backend.
- أنشأت تقريرًا تنفيذيًا بمصفوفة حالة وأولويات remediation، بدون تعديل source implementation أو database أو runtime mutation.

### الملفات المتأثرة
- `audit/2026-09-10-enterprise-qc-data-decision-surface-audit.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `python3` skill searches لـ enterprise tables / accessible charts / authorized search / notification live regions / Astro SSR ✅
- `pnpm exec vitest run tests/unit/ui/design-system-maturity.test.ts tests/unit/ui/universal-shell.test.ts tests/unit/ui/navigation-permissions.test.ts tests/unit/ui/authorization-visibility-ui.test.ts` ✅ — 4 ملفات / 20 اختبارًا.
- `git diff --check` ✅
- Browser read-only: `https://qclevel.top/dashboard` أعاد `/login`؛ لا جلسة مصادقة، لذلك role/provider/stale live matrix غير مثبتة.
- لا POST أو login أو mutation أو commit أو push أو deploy.

### النتيجة
- **الحالة:** جزئي / NEEDS CHANGES — لا claim readiness أو 100%.
- **مختصر:** الدليل static يثبت أن البنية الدلالية الأساسية موجودة، لكن تجربة القوائم والحالات المؤسسية غير موحّدة، وأكبر blocker هو خلط provider unavailable مع empty/zero، ثم غياب sort/pagination/loading/stale على registers.

### ملاحظات / مشاكل مفتوحة
- يلزم read outcome typed يفرق loaded/empty/filtered-empty/unauthorized-empty/provider-unavailable قبل أي تحسين تجميلي.
- يلزم server pagination + deterministic sort وتوصيل primitives المشتركة فعليًا، ثم إعادة تحقق مصادق لكل role/scope على release candidate واحد.
- NCR/RCA/CAPA ما زالت landing/policy-blocked وليست registers تشغيلية كاملة؛ الرسوم لا تُضاف حتى يثبت backend dataset.

## [2026-09-10] — تنضيج أساس نظام التصميم المؤسسي

### تم التنفيذ
- أضفت طبقة semantic وcomponent tokens فوق palette المعتمدة بدون تغيير الهوية أو دمج الحالات الدلالية.
- أضفت عقود typography وspacing/density وfocus وmotion وdisabled وread-only وstale.
- ربطت المكوّنات المشتركة للأزرار والحقول والجداول والبطاقات والرسوم والتنقل وStatusBadge بالعقود الجديدة، مع حالات hover/focus/active/disabled/loading/error حيث ينطبق.
- وسّعت `StatusBadge` لتشمل `STALE` و`READ_ONLY` مع الحفاظ على PASS != RELEASED وAPPROVED != PASS وHOLD != FAILURE وDRAFT != REVIEW.
- أنشأت تقرير inventory/debt رسمي واختبارات regression تمنع undefined tokens وعودة القيم المكررة في المكونات المشتركة.

### الملفات المتأثرة
- `src/ui/styles/tokens.css`
- `src/ui/styles/density.css`
- `src/ui/styles/motion.css`
- `src/ui/components/forms/form-control.css`
- `src/ui/components/{Button,IconButton,Card,StatusBadge}.astro`
- `src/ui/components/data/DataTable.astro`
- `src/ui/charts/{Chart,Legend}.astro`
- `src/ui/shell/Sidebar.astro`
- `Documents/DESIGN-SYSTEM.md`
- `audit/2026-09-10-design-system-maturity.md`
- `tests/unit/ui/design-system-maturity.test.ts`

### التحقق
- `pnpm exec vitest run ...` ✅ — 4 ملفات / 47 اختبار.
- `pnpm typecheck` ✅ — 0 أخطاء، 62 hints موجودة مسبقًا؛ تحذير Node 22 مقابل عقد 24.
- `pnpm test:architecture` ✅.
- `pnpm build` ✅ — مع تحذيرات Vite/الحجم المعروفة.
- `git diff --check` ✅.

### النتيجة
- **الحالة:** نجح محليًا / debt موثق.
- **مختصر:** صارت طبقة التصميم المشتركة أوضح وقابلة للتوسع، لكن ترحيل كل CSS المحلي وتعديل تباين semantic status يحتاج دفعات لاحقة وقرار مالك للألوان.

### ملاحظات / مشاكل مفتوحة
- ما صار commit أو push أو deploy.
- Prettier ما قدر يستنتج parser لملفات Astro، وظهر warning تنسيق فقط لبعض CSS/TS؛ ما تم تشغيل rewrite تلقائي.
- ما زالت 43 occurrence لـ`#fff` على مستوى `src`، وبعضها مشروع للـlogin/visual assets؛ تحتاج دفعات template-family.

## [2026-09-10] — إصلاح فجوات التفويض والرؤية في الواجهة

### تم التنفيذ
- فصلت اكتشاف صفحات التشغيل العادية عن صلاحيات الأفعال؛ بقيت صفحات الإدارة والصحة محجوبة حسب capability.
- أضفت منح القراءة التشغيلية العامة المعتمدة وقت حلّ actor، بدون منح mutation أو approval أو release أو health أو admin.
- ربطت مساحات inspection وlaboratory بالحالة والصلاحية مع رسائل آمنة توضّح أن visibility ما تعني authority.
- أخفيت retest غير المعتمد كإجراء قابل للتنفيذ، وحافظت على العبارات الدلالية: PASS لا يساوي RELEASED، والـAI استشاري فقط.
- حدّثت اختبارات navigation وfixtures وE2E لتطابق AVD، وأضافت اختبارات UI authorization/visibility.

### الملفات المتأثرة
- `src/ui/navigation/navigation.ts`
- `src/shared/authorization/visibility.ts`
- `src/modules/identity/application/identity-dependencies.ts`
- `src/pages/quarantine/inspections/[inspectionId]/execute.astro`
- `src/pages/quarantine/inspections/[inspectionId]/review.astro`
- `src/pages/laboratory/tests/[labTestId]/index.astro`
- `src/pages/laboratory/tests/[labTestId]/execute.astro`
- `audit/2026-09-10-authorization-visibility-ui-audit.md`
- `tests/unit/ui/authorization-visibility-ui.test.ts`

### التحقق
- `pnpm typecheck` ✅ — 0 أخطاء، و62 hints موجودة مسبقًا.
- `pnpm test:architecture` ✅.
- `pnpm build` ✅ — مع تحذيرات Vite الحالية الخاصة بحجم chunk وبعض الاعتمادات.
- `pnpm test:unit` ✅ — 66 ملف / 410 اختبار.
- `pnpm exec playwright test tests/e2e/verification-access.spec.ts` ⚠️ — الاختباران skipped لعدم توفر `QC_VERIFY_*`.
- `git diff --check` ✅.

### النتيجة
- **الحالة:** جزئي / fail-closed.
- **مختصر:** انحلت فجوات presentation المكتشفة محليًا بدون تغيير السياسة، لكن التحقق المصادق للشخصيات والـfixtures وstale/SoD/e-signature وindistinguishable empty states ما زال ينتظر credentials بيئة غير إنتاجية.

### ملاحظات / مشاكل مفتوحة
- ما صار commit أو push أو mutation أو deploy.
- تحذير Node مستمر: البيئة الحالية `v22.22.3` بينما عقد المشروع `>=24.20.0 <25`.

## [2026-09-10] — تدقيق واجهة التفويض والرؤية مقابل AVD (fail-closed)

### تم التنفيذ
- قرأت وثائق AVD والصلاحيات والأدوار وآلات الحالة وقواعد العمل ومهارة `ui-ux-pro-max` كاملة، وراجعت navigation وAppLayout ومساحات inspection/lab/receiving/backup/AI.
- فتحت النسخة المحلية بالمتصفح ونفذت فحصًا anonymous قراءة فقط على 11 مسارًا محميًا؛ كلها أعادت `/login?returnTo=...` بدون كشف بيانات أو POST.
- أثبتت فجوة F-01: `visibleNavigation` ما زال يخفي أغلب صفحات التشغيل العادية حسب `PERM-*-VIEW`، بينما AVD-001/004 يفرضان visibility/read عامة لكل عضو نشط.
- أثبتت فجوات عرض إضافية: روابط execution/review/retest في تفاصيل المختبر غير مربوطة بوضوح بالصلاحية/الحالة، وReturn/Submit/Resume في مساحات inspection تحتاج capability-aware presentation.
- أثبتت semantic truths في UI: `PASS != RELEASED`، وbackup success لا يساوي restore verified، وAI advisory لا يقرر PASS/FAIL أو approval/release/sign.
- أنشأت تقرير التدقيق التفصيلي بدون تعديل policy أو source implementation أو database أو production.

### الملفات المتأثرة
- `audit/2026-09-10-authorization-visibility-ui-audit.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- Browser anonymous direct-route sample ✅ — 11/11 protected routes redirected safely.
- `pnpm exec vitest run tests/unit/ui/navigation-permissions.test.ts tests/unit/ui/universal-shell.test.ts tests/unit/ui/action-vocabulary.test.ts tests/unit/ui/mutation-post.test.ts tests/unit/ui/app-shell.test.ts tests/unit/ui/mobile-drawer-inert.test.ts` ✅ — 6 files / 82 tests.
- `pnpm typecheck` ✅ — 0 errors, 62 existing hints; Node `v22.22.3` خارج عقد المشروع `>=24.20.0 <25`.
- `pnpm test:architecture` ✅.
- Authenticated disposable personas / inactive persona / SoD / stale / e-sign / no-existence leakage ⚠️ NOT VERIFIED — `QC_VERIFY_*` credentials/fixture run غير متاحة.
- لا POST أو mutation أو commit أو push أو deploy.

### النتيجة
- **الحالة:** جزئي / fail-closed.
- **مختصر:** denial anonymous والحدود الدلالية الأساسية واضحة، لكن AVD universal operational visibility غير منعكس بالكامل في navigation، والتحقق المصادق لكل الشخصيات ما اكتمل.

### ملاحظات / مشاكل مفتوحة
- F-01 أولوية عالية: يلزم فصل page visibility/read عن mutation permissions مع إبقاء `/system/health` owner-only و`/admin/*` admin/owner-only.
- F-02 إلى F-04 تحتاج تحسين presentation للروابط والأفعال حسب state + permission + safe reason.
- يلزم تشغيل fixtures في non-production ثم إعادة الجولة قبل أي claim اكتمال.

## [2026-09-10] — إصلاح motion والأداء وتقسيم Three.js في login

### تم التنفيذ
- استبدلت `SystemBackground` المتحرك بسطح CSS ثابت غير تفاعلي للصفحات التشغيلية؛ أزلت runtime Lottie/WASM من المسار، مع بقاء الخلفية الداكنة والـgrid الهادئ و`aria-hidden` وprint fallback.
- أزلت dependency `@lottiefiles/dotlottie-web` من `package.json` و`pnpm-lock.yaml`، وثبّتُّ `three` من `^0.185.1` إلى `0.185.1` exact.
- أخّرت تهيئة 3D login إلى `requestIdleCallback`/timeout fallback، ومنعت تهيئته مع `prefers-reduced-motion`، وأبقيت context loss/visibility/disposal/fallback القائمة.
- حوّلت Three.js وGLTFLoader إلى dynamic imports بعد idle بدل تحميلهما ضمن chunk login الأولي.
- حدّثت عقود unit/E2E لتعكس الحد الفاصل الجديد: CSS static للـworkspace وThree.js decorative للـlogin فقط، مع حراسة عدم وجود imports ثابتة أو animation runtime للخلفية التشغيلية.
- أصلحت مسارات Three.js القديمة التي تشير إلى `sRGBEncoding` غير المصدّرة في الإصدار exact، واستخدمت `SRGBColorSpace` فقط.

### الملفات المتأثرة
- `src/ui/components/SystemBackground.astro`
- `src/ui/components/QCLogin3DBackground.astro`
- `package.json`
- `pnpm-lock.yaml`
- `tests/unit/ui/system-background.test.ts`
- `tests/e2e/system-background.spec.ts`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm exec vitest run tests/unit/ui/system-background.test.ts` ✅ — 6 passed
- `pnpm test:unit` ✅ — 65 files / 405 tests
- `pnpm exec astro check` ✅ — 0 errors / 0 warnings / 62 hints قائمة مسبقًا
- `pnpm build` ✅ — server/client build مكتمل؛ warning chunk Three.js المؤجل فقط، واختفى warning `sRGBEncoding`
- bundle login قبل/بعد: `617.67KB` initial hoisted → `12.31KB` initial hoisted؛ chunks المؤجلة `three.module 734.44KB` و`GLTFLoader 45.61KB`
- `git diff --check` ✅
- preview smoke: الخادم بدأ على `4322` لكن `/login` رجع `503 config.invalid_environment` لغياب إعدادات PostgreSQL/البيئة؛ لم تُزوّر env ولم تُنفذ mutation ✅

### النتيجة
- **الحالة:** نجح محليًا / smoke runtime جزئي
- **مختصر:** الحركة الزخرفية الثقيلة خرجت من authenticated workspaces، و3D login بقي محفوظًا لكن صار مؤجلًا وlazy وموقوفًا مع reduced motion، مع تثبيت Three.js وإزالة fallback API مكسور.

### ملاحظات / مشاكل مفتوحة
- TTFB الإنتاجي للجوال `1651ms` ما زال blocker خادميًا خارج نطاق هذا الإصلاح؛ يحتاج profiling للبنية/قاعدة البيانات على بيئة تشغيل صحيحة.
- التحقق من GPU memory وcontext-loss على جهاز جوال حقيقي ما زال غير متوفر.
- لا commit/push/deploy.

## [2026-09-10] — تدقيق motion/performance للـSystemBackground وThree.js login على الإنتاج

### تم التنفيذ
- قرأت `SystemBackground.astro` و`QCLogin3DBackground.astro` و`package.json` وassets والـFoundation UI docs، وطبّقت بحوث `ui-ux-pro-max` الموجهة للـanimation/reduced-motion وThree.js lifecycle وAstro client performance.
- فحصت الإنتاج بحساب `yazeed` قراءة فقط، ثم قست login وdashboard عبر Chrome DevTools على desktop و375px mobile.
- وثّقت أن login يحمّل Three.js بحجم `161,885B` مضغوطًا / `617,409B` مفكوكًا، وGLB بحجم `943,748B`، مع canvas واحد pointer-inert وDPR فعلي 1.65 desktop و1.35 عند العينة tablet.
- وثّقت أن dashboard لا يطلب `background.lottie` أو `dotlottie-player.wasm` في الجولة، وحالة `data-motion=fallback`؛ حجم الأصول المحلية المقصود `1.1M` Lottie + `1.2M` WASM، لذلك transfer الحي الفعلي لهما كان `0B` في العينة.
- راجعت lifecycle: visibility pause، reduced-motion، fallback، context lost/restored، disposal، renderer واحد، وresponsive camera موجودة في مصدر Three.js؛ لم يُثبت فحص جهاز جوال حقيقي أو GPU memory.

### الملفات المتأثرة
- `.agents/mind/01-mind-latest.md`
- بلا تعديل في `src/` أو `public/` أو `package.json`؛ التدقيق قراءة فقط.

### التحقق
- Chrome DevTools login desktop: LCP `353ms`، CLS `0.00`، TTFB `266ms`، FCP `356ms` ✅
- Chrome DevTools dashboard desktop: LCP `774ms`، CLS `0.00`، TTFB `624ms` ✅
- Chrome DevTools dashboard عند `375×812`: LCP `1836ms`، CLS `0.00`، TTFB `1651ms` ✅
- `performance.getEntriesByType('longtask')`: لا long tasks مرصودة في عينة dashboard بعد الاستقرار ✅
- 375px: `scrollWidth=375` و`clientWidth=375` بلا تمدد أفقي ✅
- Lighthouse snapshot للـlogin: Accessibility `100` وBest Practices `100` ✅
- Pro Max searches: `ux` animation/reduced-motion + `threejs` + `astro` ✅
- `git status`: لا تغييرات مصدرية قبل سجل الـmind؛ لا commit/push/deploy/mutation إنتاجية ✅

### النتيجة
- **الحالة:** تدقيق مكتمل / تحسينات كودية غير منفذة
- **مختصر:** التصميم الحالي محافظ على fallback آمن وواجهة login قابلة للعمل بدون WebGL، لكن لا يوجد claim أن الحركة حسّنت الأداء. الأولوية التالية: تفسير سبب fallback، pin exact لـThree.js إذا اعتمدت سياسة المستودع، وخفض TTFB على mobile قبل أي إزالة للـ3D.

### ملاحظات / مشاكل مفتوحة
- `package.json` يستخدم `three: ^0.185.1` وليس exact pin؛ يحتاج قرار سياسة dependencies.
- `background.lottie` و`dotlottie-player.wasm` غير مطلوبين حيًا في الجولة بسبب fallback، فلا يجوز احتساب نقل 2.3MB كأداء فعلي حالي.
- INP التفاعلي، CPU/GPU أثناء تشغيل form/table، context-loss على جهاز جوال حقيقي، وfield data/CrUX غير متوفرة في هذه الجولة.

## [2026-09-10] — Standardize complete mutation UX without weakening server controls (ui-ux-pro-max)

### تم التنفيذ
- أضفت عقد التفاعل المشترك `src/ui/forms/mutation-interaction.ts` بالحالات الثمان: IDLE/SUBMITTING/SUCCESS/VALIDATION_ERROR/CONFLICT_STALE/AUTHORIZATION_CHANGED/DEPENDENCY_UNAVAILABLE/UNKNOWN_SAFE_ERROR، مع تعطيل زر الإرسال فقط أثناء SUBMITTING و`aria-busy` ونص تقدم ومنع الإرسال المكرر وحفظ المدخلات وتركيز الحالة ونسخ آمنة بدون stack/SQL/secrets.
- وصّلت كل `FormErrorSummary` في صفحات الإنشاء التسع + قوالب الحجر بقائمة `errors` المرتبطة (`#fieldId`) مع بقاء الأخطاء Inline و`aria-describedby` صحيحة و`tabindex=-1` و`role=alert` وروابط no-JS.
- صلّحت إنشاء قالب الحجر: حقول `id/for` و`aria-invalid/describedby` وأخطاء Inline و`fieldset/legend` و`details` للمراجع الاختيارية و`tabindex` على `[data-result]`، وحوّلت السكربت لاستخدام العقد المشترك مع بقاء POST الخادمي.
- وحّدت أسطح القرارات/الانتقالات (استلام/فحص/مستندات/tasks/change-requests/approvals/CAPA/release/restore/admin users/roles/scopes) على نفس العقد: `aria-busy` و`data-submit` وحالة `role=status` قابلة للتركيز ونسخ مخصصة لكل حالة، وشلت `window.alert/prompt` نهائيًا.
- أضفت Show/Hide للباسورد في `account.astro` (وكان موجودًا في `login.astro`): زر semantic بـ`aria-pressed/controls/label` مع بقاء `autocomplete` وبدون منع اللصق وبدون تسجيل القيمة.
- وسّعت `tests/unit/ui/mutation-post.test.ts` بعقد العقد المشترك والتصنيف الستي وربط الأخطاء، وشغّلت `vitest` و`astro check` والحدود المعمارية.

### الملفات المتأثرة
- `src/ui/forms/mutation-interaction.ts` (جديد)
- `src/pages/quarantine/admin/index.astro` (+fieldset/details/contract)
- `src/pages/{tasks, laboratory/tests, assets/*, change-requests, documents, quality/findings, quarantine/receiving}/new.astro` (ربط errors)
- `src/pages/{approvals, quality/capa, governance/releases, quarantine/*, documents/*, tasks, change-requests, admin/*, system/backups, account}.astro` (توحيد العقد)
- `tests/unit/ui/mutation-post.test.ts` (عقد + تصنيف)

### التحقق
- `vitest tests/unit/ui/mutation-post.test.ts` ✅ — 49 passed
- `vitest tests/unit/ui` ✅ — 164 passed (15 files)
- `astro check` ✅ — 0 errors (704 files)
- `architecture boundary check` ✅
- `eslint` للملفات TS ✅ — `diff --check` ✅
- Chrome DevTools حي (قراءة + تسجيل دخول yazeed): لوحة التحكم تعمل، و`/tasks/new` المنشور لا يزال يفتقد `[data-result]` — أي أن التحقق الحي يخص النسخة المنشورة القديمة لا الكود المحلي الجديد (لم يُنشر/يُبنى للإنتاج هنا).

### النتيجة
- **الحالة:** نجح محليًا / النشر غير منفذ
- **مختصر:** العقد الموحد مطبق محليًا على كل أسطح الـmutation المطلوبة مع بقاء التفويض الخادمي وآلات الحالة والتزامن المتفائل والتدقيق وPOST الاحتياطي، لكن الدليل الحي الكامل (JS/no-JS/bطء/نقر مزدوج/stale/auth/dependency/success) يحتاج نشرًا ثم إعادة فحص Chrome على المرشح المنشور.

### ملاحظات / مشاكل مفتوحة
- لا commit/push/deploy — الكود محلي فقط (30 ملفًا معدلًا + ملف جديد).
- التحقق الحي الكامل الثماني (JS + no-JS + slow + double-click + validation + stale + authorization + dependency + success) ما زال مفتوحًا على النسخة المنشورة بعد النشر.
- `login.astro` كان فيه زر Show/Hide أصلًا — لم يُمس إلا `account.astro`.
- مطلوب قرار مالك حول تباين الألوان المعروف قبل أي تغيير توكنز.


## [2026-09-10] — WCAG 2.2 AA closure pass: laboratory table scopes (read-only live evidence + one local presentation fix)

### تم التنفيذ
- ثبّت البيئة على `main@fe21eb2` بتاريخ `2026-09-10T09:33:03Z`، واستخدمت بيانات `ui-ux-pro-max` المحلية فقط للبحوث الثمانية المطلوبة، بدون توليد نظام تصميم وبدون `--persist/--force`.
- عدّلت عرضًا فقط جدول `/laboratory/tests`: أضفت `scope="col"` لأعمدة الرأس و`scope="row"` لخلية المعرف في كل صف، بدون تغيير بيانات أو تفويض أو حالات أو مسارات.
- فحصت ثم رجّعت أي تغيير غير مثبت على `Breadcrumbs`: الدليل الحي أثبت بقاء روابط `Home/Tasks` بحجم `29×14` و`27×14`، فسجلتها كروابط inline معفاة بدل ادعاء صندوق `24px` غير موجود.
- شغّلت فحوص المصادقة الحية قراءة فقط على كل الأسطح المطلوبة: `H1=1` و`posTab=0` في كل العينات الحية، مع بقاء `account/404/500` بلا `skip-link`.

### الملفات المتأثرة
- `src/pages/laboratory/tests/index.astro` (إضافة `scope` فقط)
- بلا مساس: التفويض الخادمي، آلات الحالة، `SoD`، التوقيع، التدقيق، `POST fallbacks`، الإنجليزية فقط، `dark-only`.

### التحقق
- `vitest` مركزة ✅ — 3 ملفات / 23 اختبارًا
- `architecture boundary check` ✅
- `git diff --check` ✅
- axe حي سابق: `/dashboard` ديسكتوب `100` و`/tasks/new` جوال `92`، لكن تفاصيل العناصر الفاشلة داخل `/tmp` غير مقروءة من سياق الصفحة لذلك سُجلت `NOT VERIFIED` للتفاصيل.
- فحوص معلقة سُجلت `NOT VERIFIED`: زوم حقيقي `200%`، `320px` حي، تجاوز تباعد النصوص، `forced-colors/reduced-motion` حي، تنقل كيبورد كامل، إرسال فاشل حي، `stale/conflict` إنتاجي، وصفحات `review/approve/release/e-sign` بهويات حقيقية.

### النتيجة
- **الحالة:** نجح جزئيًا
- **مختصر:** إصلاح عرضي واحد مثبت محليًا، مع إغلاق قراءة فقط موثق، لكن لا يوجد ادعاء امتثال كامل `WCAG 2.2 AA`.

### ملاحظات / مشاكل مفتوحة
- لا commit/push/deploy/mutation إنتاجية.
- تباين الألوان المعروف من المالك ما زال مفتوحًا ويحتاج قرار صريح قبل أي تغيير توكنز.
- `account/404/500` تحتاج `skip-link` موحدًا إذا اعتمد المالك تغيير التخطيط.
- روابط `breadcrumb` المضمنة تحتاج قرارًا: إبقاء الإعفاء أو إعادة التصميم لصناديق `24px`.

## [2026-09-10] — إصلاح بنية التنقل الجامع وحماية الداشبورد من استبدال الشل (universal shell repair)

### تم التنفيذ
- جمّدت `main@7ea7fda` بتاريخ `2026-09-10T05:55:30Z` (Node المحلي `v22.22.3` خارج العقد — النتائج محلية) وقرأت `DESIGN-SYSTEM.md` و`UI-UX-SPECIFICATION.md` (أقسام الـUniversal App Shell والـSidebar والـTop Context Bar) و`AUTHORIZATION-VISIBILITY-DECISION.md` ومهارة `ui-ux-pro-max` المحلية (`SKILL.md` كاملًا + 5 بحوث محلية موثقة: 3 في `ux` وواحد `astro` صفر نتائج أُعيد بصياغة أضيق فأعطى 3).
- ثبتّ الداشبورد على الشل الجامع (بلا `slot="topbar/sidebar"`) ومررت `scope={dashboard.scopeLabel}` المعتمد خادميًا إلى الـTopbar، مع بقاء `QC OPERATIONAL COMMAND CENTER` والـsnapshot داخل جسم الصفحة لا بديلًا عن الـTopbar.
- وسّعت `AppLayout` بخصائص اختيارية (`scope/approvalCount/notificationCount/userRole`) تمر للـTopbar مع بقاء الافتراضات السابقة (بلا صفر كاذب وبلا تغيير تفويض أو مسارات أو صلاحيات).
- أضفت في `Sidebar` مؤشر active غير لوني (`underline` + وزن) ودعم `forced-colors` (`Highlight` للنشط و`ButtonBorder` للتولتيب)؛ التولتيب المطوي كان يعمل hover+focus أصلًا وزر `Close navigation` الداخلي كان موجودًا فأُبقيا بلا مساس بالتفويض.
- تحققت من `Topbar`: الشارات مشروطة بـ`number` (بلا صفر كاذب) والتسميات الذرية على الروابط الأب وبلا `aria-live` أو `autofocus` أو `fetch` — تُركت كما هي بعد إثبات التكافؤ.
- أضفت `tests/unit/ui/universal-shell.test.ts` (7 اختبارات) يفشل إذا أي صفحة استبدلت الشل: الداشبورد + 11 صفحة ممثلة لكل مجموعة تنقل علوية، والـtoggle والـbreadcrumbs والبحث والـscope والتنبيهات والاعتمادات وقائمة المستخدم، والكيبورد/Escape/Tab والسكرول والـbreakpoint وتقليل الحركة و`forced-colors` وإخفاء `health/admin` بلا منح.

### الملفات المتأثرة
- `src/pages/dashboard/index.astro` (تمرير الـscope المعتمد)
- `src/ui/layouts/AppLayout.astro` (خصائص اختيارية وتمرير للـTopbar)
- `src/ui/shell/Sidebar.astro` (مؤشر non-color + `forced-colors`)
- `tests/unit/ui/universal-shell.test.ts` (جديد)
- بلا مساس: `Topbar.astro` و`navigation.ts` والتفويض الخادمي والـPOST fallbacks والإنجليزية فقط وdark-only.

### التحقق
- `vitest` مركزة ✅ — 6 ملفات / 41 اختبارًا
- `pnpm test:unit` ✅ — 65 ملفًا / 402 اختبارًا (كانت 64/395: +ملف/7 اختبارات هنا)
- `pnpm typecheck` ✅ — 0 أخطاء (62 hint قائمة)؛ `pnpm test:architecture` ✅؛ `pnpm build` ✅ (تحذيرا chunk الـ617kB وsRGB القائمان)؛ `eslint` للاختبار ✅ (ملفات astro خارج التغطية — قائم)؛ `prettier` ✅؛ `git diff --check` ✅
- حي (متصفح/مقاسات 320/375/414/768/1024/1440/كيبورد فقط/forced-colors حي/reduced-motion حي/أدوار حية): NOT VERIFIED — لم يُشغّل هنا
- Node المحلي `v22.22.3` خارج العقد — النتائج محلية

### النتيجة
- **الحالة:** نجح جزئيًا
- **مختصر:** بنية الشل الجامع مُصلحة ومحروسة بالاختبارات محليًا بلا تغيير تفويض، لكن الإثبات الحي الكامل للمصفوفة ما زال مفتوحًا.

### ملاحظات / مشاكل مفتوحة
- لا commit/push/deploy/mutation إنتاجية؛ تعديلات `audit/*` ومدخل العقل الأحدث لزميل متزامن تُركت كما هي.
- `aria-current` على روابط التنقل النشطة تُرك للمعالجة لاحقًا (سطور القوالب ذات `${}` لا تُطابقها أداة التحرير الحالية) ويُعوَّض عنه مؤقتًا بالـbreadcrumbs والـH1.

## [2026-09-10] — إضافة سطر حالة تحت كل برومبت + جدول متابعة رئيسي (complete-prompts)

### تم التنفيذ
- أضفت سطر `> **الحالة:** ☐ لم يُنجَز — بدّلها بـ ✅ عند الاكتمال` تحت عناوين الـ24 برومبت كلها (MASTER + PHASE 2 MASTER + PROMPT 1–22) في ملف الـprompts، وحذفت أقسام التشيك ليست المطولة السابقة حسب طلب المالك.
- أضفت جدول متابعة `📊 جدول متابعة الحالة` بداية الملف فيه 24 صفًا (☐ لكل برومبت) للتحديث من مكان واحد.

### الملفات المتأثرة
- `audit/2026-09-10-qc-ui-ux-pro-max-complete-prompts.md` (إضافات فقط: 82 سطرًا، صفر حذف)

### التحقق
- عدّ أسطر الحالة: 24/24 ✅ / عدّ العناوين: 25 (عنوان + 24 برومبت) ✅ / لا بقايا تشيك ليست ✅ / توازن code fences سليم (بلوك الجدول ضاف زوجًا واحدًا متوازنًا) ✅ / `git diff --stat`: إضافات فقط ✅
- لم يُشغّل build/tests — تعديل توثيقي خالص بلا كود.

### النتيجة
- **الحالة:** نجح
- **مختصر:** كل برومبت صار تحته سطر حالة واحد `☐/✅` وجدول متابعة رئيسي بالأعلى؛ الملف سليم البنية.

### ملاحظات / مشاكل مفتوحة
- لا يوجد. الـcommit على المستخدم.

## [2026-09-10] — تدقيق عقد التوكنز البصرية والتباين (visual-token audit, fail-closed)

### تم التنفيذ
- جمّدت `main@64b443b` بتاريخ `2026-09-10T05:52:48Z` (Node المحلي `v22.22.3` خارج العقد — النتائج محلية) وقرأت `DESIGN-SYSTEM.md` و`UI-UX-SPECIFICATION.md` و`tokens.css` و`global.css` و`StatusBadge.astro` ومهارة `ui-ux-pro-max` المحلية (`SKILL.md` كاملًا + بحثان محليان موثقان، وثالث `astro/focus` بلا نتائج مسجلة كذلك).
- جردت التوكنز: المعرفة `75` تحت `src/ui/styles` والمستهلكة `71` في `src/pages+src/ui`؛ الوحيدان خارج العقد العام هما `--bar-size` و`--legend-color` وهما scoped inline معرّفان في موقع الاستخدام (`quarantine/index.astro` و`Legend.astro`)، وتحقق `--status-success/error` أنهما alias معرّفان (`pass/danger`) مع بقاء `PASS != RELEASED`.
- حسبت تباين WCAG لكل زوج معروض فعليًا: الناجح (body/secondary/link/focus/badges pass-approved-hold-warning/pills ok-warn-unknown/primary-inverse/secondary/ghost/controlled/error-summary/input) محروس، والفاشل المثبت كفجوات مالك: `muted-on-raised 4.41` و`danger-on-panel 4.43` و`danger-on-raised 4.04` و`released 3.98` و`danger-badge 3.84` و`review 4.04` و`neutral 4.21` و`pill-bad 4.43` و`white-on-accent 3.12` و`danger-btn 3.84` و`disabled/borders` — بلا توحيد hues وبلا تغيير باليت وبلا عربي وبلا light وبلا مساس بأسماء الحالات أو POST fallbacks أو التفويض الخادمي.
- أضفت `tests/unit/ui/visual-token-contract.test.ts` (عقد شامل كل الملفات + scoped + aliases + الفروقات الدلالية الأربع + نص الحالة + تطابق الوثائق) و`tests/unit/ui/visual-contrast.test.ts` (أزواج PASS صارمة + فجوات مثبتة كـpinned FAILs + توثيق white-vs-inverse وdisabled/borders) لمنع أي تراجع مستقبلي.

### الملفات المتأثرة
- `tests/unit/ui/visual-token-contract.test.ts` (جديد)
- `tests/unit/ui/visual-contrast.test.ts` (جديد)
- بلا تعديل مصدري: `tokens.css` و`DESIGN-SYSTEM.md` والصفحات والمكونات لم تُمس.

### التحقق
- `pnpm exec vitest run` للملفين + العقد القديم ✅ — 3 ملفات / 43 اختبارًا
- `pnpm test:unit` ✅ — 64 ملفًا / 395 اختبارًا (كانت 62/355 في سجل Pro Max: +2 ملف/40 اختبارًا هنا)
- `pnpm typecheck` ✅ — 0 أخطاء؛ `pnpm test:architecture` ✅؛ `pnpm build` ✅ (تحذير chunk الـ617kB القائم)؛ `eslint` للملفين ✅؛ `git diff --check` ✅
- بحثا Pro Max المحليان ✅ (`color/dark-mode-contrast` و`ux/error-summary-contrast` بـ5+5 نتائج) والثالث `astro/focus` سُجل صفر نتائج بصدق؛ فحص حي (متصفح/زوم/forced-colors حي): NOT VERIFIED — لم يُشغّل هنا
- Node المحلي `v22.22.3` خارج العقد — النتائج محلية

### النتيجة
- **الحالة:** جزئي (NEEDS CHANGES — fail-closed)
- **مختصر:** عقد التوكنز العام سليم (صفر undefined عامة) والنص المصاحب للحالة وتطابق الوثائق محققان، لكن تباين النص العادي ما زال فاشلًا في 9 تركيبات معروضة (badges released/danger/review/neutral وdanger-on-panel/raised وmuted-on-raised وpill-bad وwhite-buttons) فيحتاج قرار مالك على الباليت قبل أي PASS؛ لم تُدخل عربي ولم يُكسر dark-only ولم يحدث commit/push/deploy.

### ملاحظات / مشاكل مفتوحة
- إصلاح `white→inverse` المقترح (`#fff` إلى `var(--color-text-inverse)` على أزرار الـaccent في ~20 صفحة) يرفع 3.12 إلى 5.74 بتوكن معتمد وبلا تغيير hue — تُرك للمالك لتأكيد الـdiff البصري قبل التنفيذ.
- تفتيح `released/danger/review/neutral/muted/danger-on-panel` يحتاج قرار مالك صريح (ممنوع `--persist/--force` وممنوع توحيد الألوان)؛ الاختبارات الجديدة ستفشل تلقائيًا إذا ساءت أي نسبة وتحتاج تحديثًا صريحًا إذا أُصلحت الفجوات.
- `HOLD` و`WARNING` يتشاركان tone الـ`warning` في `StatusBadge` (مقبول للفروقات الأربع المطلوبة لكنه يدمج hold/warning) — موثق بلا تغيير دلالي.
- الشجرة فيها تغييرات مسبقة خارج مهمتي (`D audit/...final-prompts.md` و`?? complete-prompts`) تُركت كما هي.

## [2026-09-10] — تدقيق UI/UX Pro Max المستقل + معالجة P0 الآمنة (MASTER + Prompts 1–9 جزئيًا)

### تم التنفيذ
- جمّدت `main@9df61a2` (فرق src صفر عن `40c1711` المدقق سابقًا؛ الفرق مجرد نسخة `.agents/skills` + نقل audit) وشغّلت 7 بحوث Pro Max موجهة وطبقتها على desktop-first QC.
- أصلحت `UXPM-01`: شلت `slot="topbar"` من الداشبورد ورجّعت الـUniversal Topbar مع نقل السياق لداخل الصفحة.
- أصلحت `UXPM-02` جزئيًا: aliases لـ`--status-success/--status-error` + بدّلت `--space-7` غير المعرفة بـ`--space-8`؛ قيم التباين الست الفاشلة بقيت مفتوحة بقرار مالك.
- أصلحت `UXPM-03` جزئيًا: شلت الصفر الكاذب من Topbar (شارة مشروطة بـnumber)؛ الربط بعدّادات خادم حقيقية ما زال مفتوحًا.
- أصلحت `UXPM-04/05/06/08/10`: روابط أخطاء اختيارية في FormErrorSummary، وعقد إرسال quarantine (aria-busy+تعطيل+مخرج)، وتولتيب collapsed على hover/focus، وزر Show/Hide للباسورد، و`initial-scale=1`.
- أضفت `tests/unit/ui/design-token-contract.test.ts` (7 اختبارات) لمنع الانحدار.

### الملفات المتأثرة
- `src/ui/styles/tokens.css` و`src/pages/dashboard/index.astro` و`src/ui/shell/{Topbar,Sidebar}.astro`
- `src/ui/components/FormErrorSummary.astro` و`src/pages/quarantine/admin/index.astro`
- `src/pages/login.astro` و`src/ui/layouts/BaseLayout.astro` و`src/pages/assets/index.astro`
- `tests/unit/ui/design-token-contract.test.ts` (جديد)

### التحقق
- `pnpm test:unit` ✅ — 62 ملفًا / 355 اختبارًا (0 فشل)
- عقد التوكنز الجديد ✅ — 7/7؛ UI المركزة ✅ — 5 ملفات / 27
- `pnpm typecheck` ✅ — 0 أخطاء؛ `pnpm test:architecture` ✅؛ `pnpm build` ✅ (تحذير chunk قديم 617kB)
- `pnpm lint` ❌ — 143 خطأ كلها في `.opencode/skills/*/scripts/*.cjs` قديمة؛ ملفاتي 0 أخطاء
- `git diff --check` ✅؛ حي (متصفح/زوم/أدوار/no-JS حي/Web Vitals): NOT VERIFIED — لم تُشغّل هنا
- Node المحلي `v22.22.3` خارج العقد — النتائج محلية

### النتيجة
- **الحالة:** جزئي (NEEDS CHANGES)
- **مختصر:** 4/10 Pro Max مغلقة بالكامل و4/10 جزئية و2/10 مفتوحة؛ التباين الستي والعدّادات الحقيقية والتحقق الحي الكامل على نفس SHA المنشور ما زالت تمنع APPROVE.

### ملاحظات / مشاكل مفتوحة
- تباين `<4.5:1`: released/danger/review/neutral/muted-on-raised/danger-on-panel — يحتاج قرار مالك على تفتيح الباليت.
- Topbar counts تحتاج use cases خادمية مرخصة؛ no-JS/at-scale/200% zoom حقيقي وأدوار حية وWeb Vitals: NOT VERIFIED.
- لا commit/push/deploy/mutation إنتاجية.

## [2026-09-10] — تنفيذ Prompt 15 (C-07..C-12) بنفس جلسة Chrome وهوية بناء ثابتة: ‏0/6 PASS و1 FAIL

### تم التنفيذ
- ثبت عينة البداية `2026-09-10T04:18:51Z` والنهاية `2026-09-10T04:22:22Z` عبر `GET /api/system/release-identity` بنفس الجلسة: كلتاهما `200 {"status":"UNVERIFIED","release":{}}` بلا حقول، و`/api/health/live` ‏`healthy`‏؛ البناء ثابت داخل الجولة لكن البوابة fail-closed تمنع C-11 (لا يطابق HEAD المحلي `b8d3949ac9270ad0556779078b42739b1ff0b5d6` ولا حزمة Prompt 12).
- فحصت C-07 عند `320×720` على `/dashboard`: ‏`docScrollWidth=320` و`bodyScrollWidth=320` بلا تمدد أفقي للصفحة، لكن زر التنقل `display:none/visibility:hidden/0×0` و30 رابطًا جانبيًا عند `x=-274` غير قابلة للوصول من هذه الصفحة؛ لذلك C-07 ‏NOT VERIFIED‏ (لا PASS مع action غير reachable).
- فحصت C-08 بوكيلين (CSS `zoom:200%` عند 1280 وviewport مكافئ `640×400`): بلا `hOverflow` و0 عناصر مقصوصة في عينة الـmain، لكن `visualViewport.scale=1` والزوم الحقيقي للمتصفح غير قابل للضبط عبر Playwright؛ لذلك C-08 ‏NOT VERIFIED‏.
- اختبرت C-09 بالكيبورد: على `/dashboard` الدرج لا يُفتح (الزر مخفي)؛ وعلى `/tasks/new` عند 320 الزر `Open navigation` ظهر وفتح الدرج (`aria-expanded=true` مع `.app-workspace[inert]` وقفل `body:hidden` ونقل الفوكس) ثم Tab هرّب الفوكس إلى `BODY` ورابط `Skip to main content` خارج الدرج (احتواء مكسور)، بينما Escape أغلق وأزال `inert`/القفل وأعاد الفوكس إلى `Open navigation`؛ لذلك C-09 ‏FAIL‏.
- فحصت C-10 على `GET /tasks/new` قراءة فقط: نموذج `method=post` (baseline لـno-JS) مع `required` على `taskNo/title/priority` وبلا UUID خام، مع `Back/Cancel` الآمنة؛ لم أرسل أي POST إنتاجي فلا retained-values ولا safe-errors مثبتة؛ وC-10 ‏NOT VERIFIED‏.
- فحصت C-12: كل `QC_VERIFY_*` الست + `QC_VERIFY_BASE_URL` ‏ABSENT‏ فلا فيكستشر `verify-least` ولا تزوير مسموح (ممنوع mutation)؛ الجلسة الحالية owner تفتح `/admin/users` و`/system/health` و`/audit` بـ200 فلا دليل حرمان؛ وC-12 ‏NOT VERIFIED‏.
- جمعت a11y: فوكس مرئي `outline:solid 2px rgb(127,177,118)` مع `active=true`، وتباين عينة `h1/body` ‏`16.33:1`‏ (زوج واحد فقط لا مصفوفة كاملة)، و`prefers-reduced-motion=false` و`forced-colors=false` (بلا محاكاة forced-colors حية)، مع شجرة وصول فيها `Skip link/nav/headings`.

### الملفات المتأثرة
- `.playwright-mcp/page-2026-09-10T04-*.yml` (أدلة الجولة الجديدة، غير متتبعة)
- `.agents/mind/01-mind-latest.md` (هذا السجل)
- بلا تعديل كود: `git diff --check` نظيف و`git status` فيه فقط ملفات `.playwright-mcp/` غير المتتبعة على HEAD `b8d3949`

### التحقق
- `fetch /api/system/release-identity` بداية ونهاية ✅ — كلتاهما `200 UNVERIFIED {}` (البوابة تفشل مغلقة)
- `fetch /api/health/live` ✅ — `healthy` (آلات فقط)
- قياسات Chrome الحية ✅ — ‏320/reflow وzoom الوكيل وdrawer/inert/scroll/Tab/Escape/focus وform-baseline وcontrast/focus/media
- `QC_VERIFY_*` غياب ✅ موثق — 7/7 ‏ABSENT‏
- `git diff --check` ✅ — نظيف؛ بلا commit/push/deploy/mutation إنتاجية
- مهارات: `verification-before-completion` و`responsive-accessibility` و`keyboard-navigation` ✅ مطبقة

### النتيجة
- **الحالة:** فشل مغلق / غير مكتمل (fail-closed)
- **مختصر:** C-07 ‏NOT VERIFIED‏ وC-08 ‏NOT VERIFIED‏ وC-09 ‏FAIL‏ وC-10 ‏NOT VERIFIED‏ وC-11 ‏NOT VERIFIED‏ وC-12 ‏NOT VERIFIED‏ (‏0/6 PASS‏)؛ كسر واحد يمنع ‏12/12‏ ويمنع أي مقياس حي من بلوغ ‏100%‏.

### ملاحظات / مشاكل مفتوحة
- تناقض مسارات: زر الملاحة مخفي على `/dashboard` عند 320 لكنه ظاهر على `/tasks/new`؛ يلزم توحيد الـTopbar/Shell قبل إعادة C-07/C-09.
- احتواء Tab مكسور: رابط `Skip to main content` يبقى focusable رغم `inert` على `.app-workspace`؛ يلزم نقل الـskip-link داخل الدرج أو عزله مع الخلفية.
- الإنتاج يعرض `favicon.svg` في HTML (تحسّن) لكن ما زال بلا `RELEASE_*`؛ يلزم نشر نفس SHA `b8d3949` بهوية محقونة ثم إعادة Prompt 15.
- C-10 يحتاج بيئة non-production بفيكستشر disposable لإثبات retained-values وno-JS؛ وC-12 يحتاج بذرة Prompt 13 على non-production ثم `verify:fixtures:clean`.

## [2026-09-10] — تنفيذ Prompt 14 (C-01..C-06) في Chrome: الكل NOT VERIFIED لبوابة الهوية

### تم التنفيذ
- ثبت عينة البداية والنهاية لهوية البناء عبر `GET /api/system/release-identity` في Chrome: كلتاهما `200 {"status":"UNVERIFIED","release":{}}` بلا releaseId/buildId/gitSha/timestamp/environment، وصفحة `/system/health` تعرض Release identity كلها `UNVERIFIED`؛ البوابة fail-closed تمنع أي PASS.
- أعدت استخدام جلسة Playwright المصادقة الموجودة مسبقًا (بلا إدخال أو تسجيل secrets وبلا logout/login جديد): `/login` أعاد التوجيه إلى `/dashboard`، والتنقل يعرض Administration وSystem، وDashboard يعرض 4 KPI صفرية وحدث `GRANT_SYSTEM_OWNER_ACCESS` واحدًا بلا raw exception.
- فحصت `/system/health`: ‏`Core system: READY` مع `database HEALTHY` وفصل `storage UNKNOWN` و`ai-provider UNKNOWN` و`NO CATALOG DATA` و`RESTORE NOT VERIFIED` بلا false-green ظاهريًا، لكنه غير محسوب PASS لغياب الهوية.
- فحصت `/audit`: ‏4 أحداث مع فلاتر Subject/Actor/Action/From/To/Page size وترقيم `Showing 4 of 4` وحدث `GRANT_SYSTEM_OWNER_ACCESS` ظاهر في السطحين، وفحصت `/change-requests/new`: منتقي نسخة مصرح + 3 خيارات فقط (`Revision reference/Change summary/Controlled content hash`) بلا `targetSnapshot/Field path/Data type/targetId`؛ الـUUID الوحيد هو user header وليس target.
- لم أرسل أي mutation إنتاجية (لا POST ولا approval/release/restore) والتقطت لقطات viewport مؤرخة داخل `.playwright-mcp/` مع snapshots و`fetch` assertions للـstatus/body.

### الملفات المتأثرة
- `.playwright-mcp/page-2026-09-10T04-1*.png/yml` (أدلة الجولة المؤرخة، غير متتبعة)
- `.agents/mind/01-mind-latest.md` (هذا السجل)
- بلا تعديل كود: `git diff --check` نظيف على HEAD `853532913a8fae67c0c13bf20572125653b0c65a`

### التحقق
- `fetch /api/health/live` ✅ — `200 {"status":"healthy"}`
- `fetch /api/health/ready` ✅ — `200 {"status":"healthy"}` (آلات فقط، بلا هوية)
- `fetch /api/system/release-identity` بداية ونهاية ❌ — `200 UNVERIFIED {}` (البوابة تفشل مغلقة)
- Chrome snapshots/screenshots ✅ — dashboard/health/audit/change-request مؤرشفة
- `git diff --check` ✅

### النتيجة
- **الحالة:** فشل مغلق / غير متحقق (fail-closed)
- **مختصر:** C-01 وC-02 وC-03 وC-04 وC-05 وC-06 كلها `NOT VERIFIED` (‏0/6 PASS و0 FAIL) لأن هوية Prompt 12 غائبة على المنشور (`UNVERIFIED` ولا تطابق SHA المحلي) ولا توجد fixtures أدوار سالبة/موجبة ولا مصادقة جديدة مشهودة في هذه الجولة؛ الملاحظات السطحية الإيجابية لا تُحتسب PASS.

### ملاحظات / مشاكل مفتوحة
- الإنتاج يرد `200 UNVERIFIED` بدل `401 AUTH_REQUIRED` المسجل في `src/pages/api/system/release-identity.ts` — المنشور أقدم من كود Prompt 12 أو بلا `RELEASE_*` محقونة؛ يلزم نشر نفس SHA `8535329` مع تعبئة `RELEASE_*` ثم إعادة Prompt 14.
- C-01 يحتاج مصادقة جديدة مشهودة (labels/errors/redirect) وC-02/C-12 يحتاجان fixture least-privileged واختبار direct-route/forged؛ لم تُستخدم أي credentials هنا.
- لا commit أو push أو deploy أو production mutation.

## [2026-09-10] — تجهيز حسابات وفيكستشرز التحقق الآمنة ومصفوفة C-12 (Prompt 13)

### تم التنفيذ
- أضفت `tests/fixtures/verification-personas.ts`: الشخصيات الست (yazeed غير مُدار + supervisor/manager/admin-only/employee/least بأقل صلاحيات موثقة) بلا أي secrets؛ كلمات المرور عبر `QC_VERIFY_*` فقط.
- أضفت سكربتي `scripts/verification/seed-verification-fixtures.ts` و`cleanup-verification-fixtures.ts` بحراسة non-production ثلاثية ورفض الإنتاج ورفض لمس yazeed؛ الحسابات `verify-*` تنتهي بعد 24h والسجلات `VERIFY-*` قابلة للتنظيف مع حفظ التاريخ (DISABLE لا حذف).
- أنتجت `audit/C12-expected-access-matrix.md`: مصفوفة كل routes/actions المستخدمة في C-01..C-12 (قراءة عامة + admin/health/audit + template/P-04/P-05/P-06/P-07 + forged URL/action).
- أضفت اختبارات: وحدة للمصفوفة (6: ست شخصيات/انتهاء/أقل صلاحيات/Admin بلا approvals/طرق canonical/بادئة VERIFY) وتكامل للرفض الخادمي (7: موجب supervisor + سالب admin/least + SoD + stale + wrong-state + inactive) ومواصفة Playwright gated (قراءة least + تزوير approval بـadmin).
- وسّعت `.env.example` بأسماء `QC_VERIFY_*` فقط و`package.json` بأمري `verify:fixtures:seed/clean`؛ بلا credentials في المصدر أو السجلات.

### الملفات المتأثرة
- `tests/fixtures/verification-personas.ts` (جديد)
- `scripts/verification/{seed-verification-fixtures,cleanup-verification-fixtures}.ts` (جديدة)
- `audit/C12-expected-access-matrix.md` (جديد)
- `tests/unit/verification/expected-access-matrix.test.ts` و`tests/integration/verification/verification-access.test.ts` و`tests/e2e/verification-access.spec.ts` (جديدة)
- `.env.example` و`package.json`

### التحقق
- `pnpm exec vitest run` للملفين الجديدين ✅ — 2 ملف / 14 اختبارًا
- `pnpm test:unit` ✅ — 61 ملفًا / 348 اختبارًا (كانت 60/342: +1 ملف وحدة ظاهر هنا والبقية تكامل/E2E خارج العد)
- `pnpm typecheck` ✅ — 0 أخطاء؛ `pnpm lint` ✅؛ `pnpm test:architecture` ✅؛ `pnpm build` ✅
- Playwright للمواصفة الجديدة: list فقط ✅ — 2 tests (gated: تتخطى بلا `QC_VERIFY_*`)
- `git diff --check` ✅
- Node المحلي `v22.22.3` خارج العقد — النتائج محلية

### النتيجة
- **الحالة:** نجح محليًا / جزئي
- **مختصر:** فيكستشرز Prompt 13 والمصفوفة والتحقق السالب/الموجب جاهزة ومحروسة، لكن C-12 نفسه يبقى `NOT VERIFIED` حتى تشغيل البذرة على بيئة non-production وتنفيذ المواصفة المصادقة على نفس هوية البناء المنشورة.

### ملاحظات / مشاكل مفتوحة
- لا commit أو push أو deploy؛ لم تُبذر أي قاعدة حقيقية هنا.
- درفت معروف: `FOUNDATION_ROLE_PERMISSIONS.ADMIN` ما زال يحمل `PERM-HLTH-*` بينما الوثائق تحصر الصحة بـyazeed — المصفوفة تفرض DENY لـadmin-only على `/system/health` كسلوك متوقع، والتوحيد يحتاج قرارًا منفصلًا.
- التشغيل المصادق يحتاج `QC_VERIFY_BASE_URL` + كلمات المرور الست في مدير الأسرار ثم `pnpm verify:fixtures:seed` فـ Playwright فـ `pnpm verify:fixtures:clean`.

## [2026-09-10] — سطح هوية البناء المصادق وتحقق C-11 المقفل على الفشل (Prompt 12)

### تم التنفيذ
- أضفت متحققًا خالصًا `src/shared/release/deployed-identity.ts`: ‏`assertDeployedIdentitySample`‏ ترفض الناقص/المشوه، و‏`assertSameDeployedIdentity`‏ تشترط تطابق عينتي البداية والنهاية مع حزمة الأدلة (SHA غير حساس لحالة الأحرف، وأي غياب أو انحراف = رمي خطأ).
- أضفت `GetReleaseIdentityUseCase` بنفس تفويض عرض الصحة (`PERM-HLTH-VIEW`) ومصنع `systemHealthReleaseIdentityDependencies`؛ القيمة تُحقن من `getRuntimeConfig().release` ولا تُقبل أي قيمة من المتصفح.
- أضفت مسار `GET /api/system/release-identity`: ‏401‏ بلا جلسة، ‏403‏ بلا صلاحية صريحة، و‏200‏ بهوية معقمة (خمسة حقول + migration head فقط، بلا أسرار أو endpoints أو أخطاء خام)؛ وأضفت صف Build timestamp وسمات `data-release-field` لصفحة `/system/health` ليثبت Chrome التطابق.
- أضفت اختبارات: وحدة للمتحقق (7) وuse case (4)، وتكامل للمسار (5: رفض/شكل/تجاهل حقن المتصفح/UNVERIFIED بلا تسريب)، ومواصفة Playwright بعينتي بداية/نهاية لكشف redeploy أثناء الجولة (غير المصادق يعمل، والمصادق gated).
- أثبت حيًا على preview محلي أن المسار يرد ‏401‏ معقمًا بلا تسريب هوية، ومرر Playwright غير المصادق ✅؛ مهارة `astro-developer` المحلية تخص مستودع إطار Astro نفسه فلم تُطبق، وطبقت `verification-before-completion`.

### الملفات المتأثرة
- `src/shared/release/deployed-identity.ts` (جديد)
- `src/modules/system-health/application/{get-release-identity.ts,dependencies.ts}`
- `src/pages/api/system/release-identity.ts` (جديد)
- `src/pages/system/health.astro` (صف timestamp + سمات الاختبار)
- `tests/unit/release/deployed-identity.test.ts` و`tests/unit/system-health/get-release-identity.test.ts` و`tests/integration/http/release-identity.test.ts` و`tests/e2e/release-identity.spec.ts` (جديدة)

### التحقق
- `pnpm test:unit` ✅ — 60 ملفًا / 342 اختبارًا (كانت 58/331: +2 ملف وحدة ظاهرة هنا والبقية تكامل/E2E خارج العد)
- `pnpm typecheck` ✅ — 0 أخطاء؛ `pnpm lint` ✅ بعد إصلاح خطأين من ملفاتي؛ `pnpm test:architecture` ✅؛ `pnpm build` ✅
- Playwright حي ضد preview محلي ✅ — 1 passed (رفض 401 معقم) / 1 skipped-gated (المصادق يحتاج fixture وهوية ledger متوقعة)
- `curl` حي: `/api/health/live` ‏200‏ و`/api/system/release-identity` ‏401‏ مع `requestId` وبلا هوية
- Node المحلي `v22.22.3` خارج العقد — النتائج محلية

### النتيجة
- **الحالة:** نجح محليًا / جزئي
- **مختصر:** آلية C-11 مكتملة ومحروسة (سطح مصادق + متحقق fail-closed + عينتا بداية/نهاية)، لكن C-11 نفسه يبقى `NOT VERIFIED` حتى نشر نفس SHA بهوية محقونة (wiring الـCI/Render اليدوي) وتنفيذ الجزء المصادق من المواصفة.

### ملاحظات / مشاكل مفتوحة
- لا commit أو push أو deploy؛ لم أغيّر `render.yaml` أو CI (التعبئة اليدوية لـ`RELEASE_*` في Render ما زالت شرطًا).
- `/api/health/ready` بقي `{status}` فقط عمدًا (مسار آلات غير مصادق لفحص Render)؛ الهوية الكاملة على السطح المصادق الجديد وصفحة الصحة فقط.
- سجل Prompt 11 السابق ما زال ‏0/15‏ — لا يُرحّل له أي PASS من هذه المهمة قبل دليل حي على نفس البناء المنشور.

## [2026-09-10] — سجل إغلاق ثابت 15 بندًا على مرشح واحد (Prompt 11: كلها OPEN، ‏0.0%)

### تم التنفيذ
- ولّدت هوية إصدار محلية للسجل: `rel-256b4f57b9618cc0` على SHA ‏`94bf2763c94e…`‏ (build ‏`local-94bf2763c94e-ledger`‏، بيئة `local`‏، ‏`2026-09-10T03:37:56.560Z`‏، migration ‏`0021_release_governance`‏، working tree ‏`clean`‏).
- أعدت تشغيل معايير القبول لكل البنود الـ15 على نفس SHA بدون ترحيل أي PASS قديم؛ الفحوص الطازجة: unit ‏19 ملفًا/138 اختبارًا ✅، integration ‏4 ملفات/28 ✅، typecheck ‏0 أخطاء ✅، architecture ✅، build ✅.
- سجلت لكل بند الحالة والدليل الآلي والدليل الحي والمراجع والقيد في `audit/15-item-closure-ledger-rel-256b4f57b9618cc0.md`؛ الدليل الحي لنفس البناء مفقود (البناء محلي غير منشور، والإنتاج على بناء أقدم بلا هوية SHA ظاهرة، وE2E المصادق/التزامن الحقيقي gated).
- عاملت كل دليل مفقود/قديم/متعارض/مصدري فقط كـOPEN حسب القاعدة، فصارت النتيجة ‏0/15 = 0.0%‏ مع ‏6 MEDIUM‏ غير محلولة، ومنعت ادعاء ‏100.0%‏.
- طبقت مهارة `verification-before-completion`: لا ادعاء إغلاق بدون أمر تحقق طازج ومخرجات مقروءة.

### الملفات المتأثرة
- `audit/15-item-closure-ledger-rel-256b4f57b9618cc0.md` (جديد — السجل الثابت)
- `dist/release-identity-ledger.json` (دليل بناء ignored، غير ملتزم)
- `.agents/mind/01-mind-latest.md` (هذا السجل)

### التحقق
- `pnpm release:identity` ✅ — ‏`rel-256b4f57b9618cc0`‏ / SHA مطابق / ‏clean‏
- وحدات مركزة ✅ — 19/138؛ تكامل مركز ✅ — 4/28
- `pnpm typecheck` ✅ — 0 أخطاء؛ `pnpm test:architecture` ✅؛ `pnpm build` ✅
- دليل حي لنفس البناء: مفقود لجميع البنود (لا نشر، لا Chrome run، لا artifact/restore حي) — مسجل OPEN بصدق
- Node المحلي `v22.22.3` خارج العقد — النتائج محلية

### النتيجة
- **الحالة:** نجح (السجل منجز fail-closed)
- **مختصر:** السجل الثابت مكتمل ومربوط بمرشح واحد، لكن الإغلاق ‏0/15‏ لأن الدليل الحي لنفس البناء غائب؛ أي PASS سابق لبناء آخر لم يُرحّل.

### ملاحظات / مشاكل مفتوحة
- لا commit أو push أو deploy.
- الإغلاق المستقبلي يحتاج: نشر نفس SHA بهوية ظاهرة (Prompt 12)، fixtures أدوار (Prompt 13)، تنفيذ C-01..C-12 بلا تغيير البناء (Prompts 14–15)، ثم سجل جديد بنفس الهوية المنشورة.

## [2026-09-10] — تنفيذ حوكمة اعتماد إصدار الإنتاج (fail-closed, Manager أو yazeed)

### تم التنفيذ
- بنيت وحدة `src/modules/release-governance`: دومين البوابات الثمان (CI/security/database/E2E/UAT/signatures/criticalRisks/residualRisk) كلها لازم PASS لنفس المرشح، والسلطة النهائية Manager أو yazeed/SYSTEM_OWNER فقط (موقّع واحد يكفي، وAdmin وحده مرفوض).
- طبقت قاعدة المخاطر المتبقية: LOW/MEDIUM/MODERATE/HIGH تحتاج قبولًا موثقًا بدليل من Manager أو SYSTEM_OWNER، وCRITICAL وVERY_HIGH يحجبان الإصدار العادي fail-closed.
- بنيت `ApproveReleaseUseCase` بشهادة reauthentication وتوقيع `RELEASE_CANDIDATE` (مضاف لـ`APPROVAL_SUBJECT_TYPES` و`policy-registry` و`domainPrefix`)، وتحقق هوية البناء (releaseId/gitSha/buildId/version/migrationHead) لنفس المرشح، مع سياسة `PERM-APR-APPROVE` + فحص `PENDING`/النسخة.
- أضفت migration `0021_release_governance.sql` (جدولا `release_candidates` و`release_approvals` مع FKs وقيود) ووسعت `db-types.ts`، والمعاملة الذرية تحفظ التوقيع والاعتماد (approved_by/authority/release_id/git_sha/build_id/uat_status/residual_risk_status/signature_evidence_id/approved_at) والـAudit وidempotency مع إعادة حساب snapshot hash داخل الترانزاكشن وحماية replay/stale/concurrent.
- أضفت أكشن `releaseGovernance.approveRelease` وصفحة `/governance/releases/[releaseId]` بزر معطل افتراضيًا (`disabled` + `aria-disabled`) لا يُفعّل عميلًا إلا بتأكيد البوابات الثمان، والخادم يعيد التحقق من كل شيء قبل التخزين؛ و`getReleaseApprovalPageModel` بطبقة application لاحترام حدود المعمارية.

### الملفات المتأثرة
- `src/modules/release-governance/{domain/release-approval,ports/repository,application/{approve-release,capability,dependencies},infrastructure/postgres-repository}.ts`
- `db/migrations/0021_release_governance.sql` و`src/shared/database/db-types.ts`
- `src/modules/approvals/domain/approval.ts` و`src/modules/approvals/application/authorization.ts` و`src/shared/authorization/policy-registry.ts`
- `src/actions/{release-governance,index}.ts` و`src/pages/governance/releases/[releaseId].astro`
- `tests/unit/release-governance/release-approval.test.ts` (31 اختبارًا) و`tests/integration/release-governance/release-concurrency.test.ts` و`tests/e2e/release-governance.spec.ts`

### التحقق
- `pnpm exec vitest run tests/unit/release-governance` ✅ — 31/31.
- `pnpm test:unit` ✅ — 58 ملفًا / 331 اختبارًا (كانت 57/300).
- `pnpm typecheck` ✅ — 0 أخطاء؛ `pnpm exec astro check` ✅ — 0 أخطاء.
- `pnpm lint` ✅ و`pnpm test:architecture` ✅ (بعد نقل فحص السلطة لطبقة application).
- `pnpm build` ✅ و`git diff --check` ✅.
- Playwright ضد preview محلي ✅ — 2 passed (redirect + زر غير مفعّل بلا جلسة) / 1 skipped (gated يحتاج fixture مرشح PENDING).
- PostgreSQL integration/concurrency الحقيقي لم يُشغّل: يحتاج Docker/QC_TEST_DATABASE_URL (gated مثل قوالب P-06).

### النتيجة
- **الحالة:** نجح محليًا / جزئي.
- **مختصر:** حوكمة الإصدار المقفلة على الفشل منفذة ومحروسة بالاختبارات والبناء، لكن الإثبات الحي (PG transaction حقيقي + E2E مصادق على مرشح إصدار حقيقي + migration مطبق على قاعدة اختبار) ما زال مفتوحًا.

### ملاحظات / مشاكل مفتوحة
- لا commit أو push أو deploy.
- VERY_HIGH يُحجب مثل CRITICAL (البرومبت ذكر LOW/MEDIUM/HIGH فقط؛ الاختيار fail-closed موثق في الدومين).
- هوية الإصدار UUID لتوافق `electronic_signatures.subject_id`؛ المرشحات النصية غير-UUID تُرفض بـNOT_FOUND.
- أدلة CI/UAT/E2E تُقدَّم كحزمة attestation في الأكشن ويتحقق منها الخادم (لا جلب تلقائي من أنظمة خارجية بعد).

## [2026-09-10] — تنفيذ P-05 authority matrix inline (دفعة أولى)

### تم التنفيذ
- أضفت `isP05Authority` لتمييز Supervisor وManager/QCM وyazeed/SYSTEM_OWNER، مع رفض Admin-only والحسابات غير النشطة.
- سجلت سياسات P-05 الصريحة ومنحت Supervisor وManager صلاحيات inspection/lab/release/retest/document/VOID مع `PERM-APR-APPROVE` و`PERM-ESIG-SIGN` بدون منح Admin.
- فعّلت inspection وlab وrelease وdocument approval بفحص السلطة، وفعّلت retest بصلاحيتي `PERM-LAB-RETEST` و`PERM-LAB-AUTHORIZE-RETEST` وربط تسلسلي من البيانات القائمة بدون اختراع limits.
- أضفت `VoidInspectionUseCase` و`VoidVersionUseCase` وشددت Finding VOID على سلطة P-05، مع سبب إلزامي وحفظ التاريخ.
- أضفت عقد `assertP05Ceremony` وsuite مصفوفة يغطي Employee/Supervisor/Manager/Admin-only/yazeed/Admin+Manager لخمس عمليات، وحدثت اختبارات fail-closed القديمة للسياسة الجديدة.

### الملفات المتأثرة
- `src/shared/authorization/{p05-authority,p05-ceremony,policy-registry}.ts`
- `db/seeds/common.ts`
- `src/modules/quarantine/inspection/application/{approve-inspection,void-inspection}.ts`
- `src/modules/laboratory/application/{approve-lab-test,create-retest}.ts`
- `src/modules/quarantine/receiving/application/release-receiving.ts`
- `src/modules/documents/application/{approve-version,void-version,dependencies}.ts`
- `src/modules/quality/findings/application/transition-finding.ts`
- `tests/unit/shared/{p05-authority,p05-ceremony}.test.ts`
- `tests/unit/policy/controlled-policy-fail-closed.test.ts`
- `tests/integration/{p05/authority-matrix,quarantine/{inspection-review,release-state}}`

### التحقق
- `pnpm exec vitest run` للمسارات المركزة ✅ — 8 ملفات / 44 اختبارًا.
- `pnpm typecheck` ✅ — 0 أخطاء، 61 hint legacy.
- `pnpm lint` ✅ بعد إصلاح `any` في اختبار المصفوفة.
- `pnpm test:architecture` ✅.
- `pnpm test:unit` ✅ — 57 ملفًا / 300 اختبارًا.
- `pnpm build` ✅ — تحذيرات bundle السابقة فقط.
- `git diff --check` ✅.
- PostgreSQL integration/concurrency/E2E المصادق لم تُشغّل في هذه الدفعة.

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** نواة P-05 التنفيذية والمصفوفة الأساسية خضراء محليًا، لكن أدلة transaction/concurrency/rollback وPlaywright المصادق وتوثيق المصفوفات النهائية ما زالت مفتوحة.

### ملاحظات / مشاكل مفتوحة
- E-Signature/reauthentication الكاملة ما زالت عبر محرك Approvals ولم تُدمج ذريًا داخل كل repository دومين.
- VOID المختبر والاستلام وNCR/RCA ما زالت `DENY` لعدم وجود transition/permission موثق.
- لا commit أو push أو deploy.

## [2026-09-10] — إنشاء خطة تنفيذ P-05

### تم التنفيذ
- أنشأت خطة تنفيذ تفصيلية لـP-05 مقسمة إلى عشر مهام صغيرة تبدأ بالسياسة المشتركة ثم ceremony والعمليات والاختبارات والتوثيق.
- ربطت كل مهمة بمسارات ملفات محددة، خطوات RED/GREEN، أوامر التحقق، ونقاط atomicity وconcurrency وidempotency.
- ثبّتت في الخطة أن `QCM` هو `Manager`، وأن Admin-only مرفوض، وأن Admin+Manager ينجح عبر Manager فقط.
- ثبّتت أن Retest لا يضيف limits أو sampling أو rounding أو عدد محاولات غير معتمد، وأن VOID لا يحذف التاريخ ولا يضيف انتقالات مجهولة.
- راجعت الخطة ذاتيًا وأزلت الصياغات الفضفاضة ومسارات الترحيل غير اللازمة مبدئيًا؛ لا يوجد commit أو push.

### الملفات المتأثرة
- `docs/superpowers/plans/2026-09-10-p05-authority-matrix.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- قراءة الخطة كاملة بعد إنشائها ✅
- فحص placeholders/الغموض والتغطية مقابل المواصفة ✅
- لم يُكتب كود ولم تُشغّل اختبارات أو build.

### النتيجة
- **الحالة:** الخطة مكتملة.
- **مختصر:** خطة P-05 جاهزة للتنفيذ task-by-task عبر subagent-driven development أو executing-plans، لكن التنفيذ نفسه لم يبدأ.

### ملاحظات / مشاكل مفتوحة
- لا يبدأ التنفيذ إلا بعد اختيار المستخدم طريقة التنفيذ.

## [2026-09-10] — اعتماد وتصميم P-05 authority matrix

### تم التنفيذ
- اعتمد المستخدم نهائيًا أن `QCM` هو دور `Manager`، وأن سلطة P-05 هي `Supervisor OR Manager OR yazeed/SYSTEM_OWNER`.
- ثبّت المستخدم أن `Admin` وحده ليس جهة اعتماد، وأن كل عملية تبقى مشروطة بالصلاحية الصريحة والنطاق والحالة والنسخة والدليل والتوقيع حسب العملية.
- أعددت مواصفات تصميم P-05 باختيار المعمارية الهجينة: Approval/E-Signature للـceremony العامة، وكل Domain يملك transition والدليل والـsnapshot.
- غطت المواصفة Inspection وLaboratory وRelease وRetest وControlled VOID وDocument approval، مع حدود عدم اختراع أي سياسة علمية أو تشغيلية.
- أضفت خطة transaction ذرية وidempotency وconcurrency وrollback واختبارات table-driven وPostgreSQL وauthenticated Playwright.

### الملفات المتأثرة
- `docs/superpowers/specs/2026-09-10-p05-authority-matrix-design.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- مراجعة ذاتية للمواصفة كاملة ✅ — لا placeholders أو تعارضات داخلية ظاهرة.
- لم يُكتب كود ولم تُشغّل اختبارات أو build.
- لا commit أو push أو deploy أو production mutation.

### النتيجة
- **الحالة:** التصميم مكتمل بانتظار مراجعة المستخدم المكتوبة.
- **مختصر:** مواصفة P-05 جاهزة للمراجعة قبل إنشاء خطة التنفيذ؛ التنفيذ لم يبدأ بعد التزامًا ببوابة التصميم.

### ملاحظات / مشاكل مفتوحة
- بعد موافقة المستخدم على ملف المواصفة، الخطوة التالية هي إنشاء implementation plan؛ لا يبدأ تعديل الكود قبل ذلك.

## [2026-09-10] — استكشاف P-05 وتحديد فجوات authority matrix

### تم التنفيذ
- راجعت P-05 مقابل الواقع الحالي في Inspection وLaboratory وReceiving/Release وRetest وControlled VOID وControlled Documents.
- ثبت أن approval/release الأساسية موجودة كـuse cases وActions وبعض معاملات PostgreSQL، لكنها تبقى runtime `DENY` عند غياب policy معتمدة.
- ثبت أن Retest authorization وcontrolled VOID العام ناقصان كتدفقات تطبيقية مستقلة، ولا توجد لهما تغطية مكتملة.
- ثبت أن Approval/E-Signature engine العام موجود، لكن ربطه النهائي بعمليات P-05 وسياسات التوقيع والـreauthentication غير محسوم.
- جردت فجوات الاختبارات: matrix table-driven لكل الأدوار، Admin+Manager، scope/state/evidence/replay، وفشل transaction/توقيع، وauthenticated E2E.

### الملفات المتأثرة
- `.agents/mind/01-mind-latest.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/STATE-MACHINES.md`
- `src/modules/{quarantine,laboratory,documents,approvals}/`
- `tests/{unit,integration,e2e}/`

### التحقق
- استكشاف قراءة فقط للوثائق والكود والاختبارات ✅
- لم تُشغّل اختبارات أو build؛ ما صار أي تعديل implementation.
- لم يحدث commit أو push أو deploy أو production mutation.

### النتيجة
- **الحالة:** جزئي / بانتظار قرار سياسة.
- **مختصر:** اتحدد نطاق P-05 وفجواته بدقة، لكن ما نقدر ننفذ بأمان قبل حسم التعارض بين Prompt 9 والوثائق التي ما زالت تسمي authority/retest/VOID `POLICY-DEPENDENT`.

### ملاحظات / مشاكل مفتوحة
- يلزم تأكيد هل Prompt 9 هو اعتماد السياسة النهائي، أو أن تبقى العمليات `DENY` حتى تصدر مصفوفة QMS/RD رسمية تفصل كل عملية ومتطلبات التوقيع والدليل.

## [2026-09-10] — تنفيذ P-04 لإغلاق CAPA بمسار Supervisor مضبوط

### تم التنفيذ
- أضفت استثناء P-04 في حالة CAPA: Supervisor فقط مع `PERM-CAPA-CLOSE`، نطاق وصلاحية وحساب ACTIVE ونسخة مطابقة وسبب وإعادة تحقق وتوقيع `CLOSE`.
- أبقيت متطلبات `ACTIONS_COMPLETE` ومراجعة الفعالية كما هي، ومنعت مسار `TransitionCapaUseCase` العام من تنفيذ `CLOSE` حتى لا يتجاوز مراسم التوقيع.
- أضفت `CloseCapaUseCase` مع تحقق الدور/الصلاحية/الحالة/النسخة، reauthentication، snapshot hash، وتوقيع إلكتروني صريح.
- أضفت معاملة PostgreSQL تحفظ snapshot قبل الإغلاق، وتحدّث CAPA، وتحفظ التوقيع وAudit وidempotency في وحدة واحدة، مع migration `0020_capa_close_evidence.sql`.
- أضفت Astro Action وواجهة إغلاق قابلة للوصول تعرض الحالة والإصدار والسبب وإعادة التحقق وتمنع الإرسال المكرر، مع capability مشتقة خادميًا.
- أضفت اختبارات domain وapplication للنجاح والرفض للأدوار والصلاحية والحساب غير النشط وإعادة التحقق والسبب، وحدّثت وثائق الحالة وقواعد العمل ومصفوفة الصلاحيات.

### الملفات المتأثرة
- `src/modules/quality/capa/{domain/capa.ts,application/{close-capa,dependencies}.ts,ports/repository.ts,infrastructure/postgres-repository.ts}`
- `src/actions/capa.ts` و`src/pages/quality/capa/[capaId].astro`
- `src/shared/{authorization/policy-registry.ts,database/db-types.ts}` و`db/migrations/0020_capa_close_evidence.sql`
- `Documents/{STATE-MACHINES,BUSINESS-RULES,PERMISSION-MATRIX}.md`
- `tests/unit/quality/capa-close.test.ts` و`tests/integration/quality/capa.test.ts`
- `docs/superpowers/{specs/2026-09-10-p04-capa-close-design.md,plans/2026-09-10-p04-capa-close.md}`

### التحقق
- `pnpm test:unit` ✅ — 55 ملفًا / 290 اختبارًا.
- اختبارات CAPA المركزة ✅ — 2 ملف / 9 اختبارات.
- `pnpm exec astro check` ✅ — 0 أخطاء، 56 hint legacy.
- `pnpm typecheck` ✅ — 0 أخطاء، مع تحذير Node المحلي `v22.22.3` خارج عقد المشروع.
- `pnpm lint` ✅.
- `pnpm test:architecture` ✅ بعد نقل قراءة CAPA إلى application dependencies.
- `pnpm build` ✅ — تحذيرات bundle السابقة فقط.
- `git diff --check` ✅.
- PostgreSQL integration/E2E حقيقي لم يُشغّل: لا توجد بيئة PostgreSQL disposable/fixture مؤكدة في هذه الجولة.

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** مسار P-04 منفذ محليًا ومغطى باختبارات unit/domain/build وarchitecture، لكن إثبات PostgreSQL الفعلي وE2E المصادق لم يُنفذ، ولا يوجد commit أو push أو deploy.

### ملاحظات / مشاكل مفتوحة
- يلزم تشغيل migration `0020` واختبار transaction/idempotency على PostgreSQL disposable قبل اعتبار المسار مثبتًا runtime.
- يلزم E2E ببيانات Supervisor وCAPA حقيقية في بيئة اختبار؛ الواجهة والـAction موجودان لكن لم يُثبتا عبر متصفح مصادق.

## [2026-09-10] — تنفيذ الإصلاحات الأربعة لفجوات تحقق الإنتاج محليًا

### تم التنفيذ
- أضفت read model لهوية الإصدار في `System Health` مع تحقق fail-closed للقيم server-derived: release ID وbuild ID وtimestamp وenvironment وGit SHA وmigration head؛ الناقص/غير الصالح يظهر `UNVERIFIED`.
- أضفت مفاتيح الهوية الاختيارية إلى `src/config/env.ts` و`.env.example` و`render.yaml`، بدون أسرار أو قبول قيم من المتصفح.
- شددت Mobile Drawer trigger في `Topbar.astro` ليكون ظاهرًا عند `max-width:760px` وبحجم 40×40 مع focus ring، مع الحفاظ على منطق `inert` وscroll lock وTab/Escape/focus return في `AppLayout`.
- أضفت `public/favicon.svg` وربطه من `BaseLayout.astro`.
- أضفت فحص WebAssembly مسبقًا، وحالات `loadError`/`renderError`، وCSS fallback آمن لـdotLottie؛ لم أضف `unsafe-eval` ولم أعدّل CSP.
- أضفت تصميم وخطة التنفيذ واختبارات release identity وfavicon/background/mobile contracts.

### الملفات المتأثرة
- `src/config/{constants.ts,env.ts,release.ts,runtime.ts}` و`render.yaml` و`.env.example`
- `src/modules/system-health/application/{dependencies,get-system-health}.ts`
- `src/pages/system/health.astro`
- `src/ui/{components/SystemBackground.astro,layouts/BaseLayout.astro,shell/Topbar.astro}`
- `public/favicon.svg`
- `tests/unit/{system-health/release-identity.test.ts,ui/app-shell.test.ts,ui/system-background.test.ts}`
- `docs/superpowers/{specs/2026-09-10-production-verification-gaps-design.md,plans/2026-09-10-production-verification-gaps.md}`
- `audit/2026-09-09-production-ui-audit.md`

### التحقق
- `pnpm test:unit` ✅ — 54 ملفًا / 284 اختبارًا.
- الاختبارات المركزة ✅ — 3 ملفات / 15 اختبارًا.
- `pnpm exec astro check` ✅ — 0 أخطاء، 56 hints legacy.
- `pnpm typecheck` ✅ — 0 أخطاء، 56 hints legacy.
- `pnpm lint` ✅ — مع تحذير Node المحلي خارج العقد `>=24.20.0 <25`.
- `pnpm test:architecture` ✅.
- `pnpm build` ✅ — تحذيرات chunk login وThree.js/Zod قائمة، بلا failure.
- `git diff --check` ✅.
- `pnpm format:check` ❌ — 42 ملفًا قائمًا/أدلة Playwright غير منسقة؛ الملفات الجديدة TypeScript ذات الصلة نُسّقت بشكل منفصل.

### النتيجة
- **الحالة:** نجح محليًا / النشر غير منفذ.
- **مختصر:** الإصلاحات الأربعة مضافة للكود ومحروسة بالاختبارات، لكن C-08/C-09/C-11 تحتاج نشرًا يدويًا ثم تحقق Chrome جديد، وC-12 يحتاج fixtures أدوار منفصلة.

### ملاحظات / مشاكل مفتوحة
- لا commit أو push أو deploy.
- `RELEASE_*` لازم تتعبى في Render قبل اعتبار release identity موثقة؛ بدونها تظهر `UNVERIFIED` عمدًا.
- `pnpm format:check` ما زال محجوبًا بملفات قديمة/أدلة Playwright غير منسقة خارج نطاق الإصلاح.

## [2026-09-10] — استكمال تحقق Chrome الحي لبنود C-01 إلى C-12

### تم التنفيذ
- واصلت جلسة Google Chrome المصادق عليها على `https://qclevel.top` بدون أي production mutation.
- أثبت حيًا أن `/change-requests/new` صار contextual: selector لنسخة الوثيقة وحقول `Revision reference` و`Change summary` و`Controlled content hash`، بدون UUID/JSON/field path/data type للمشغل؛ لذلك C-06 انتقل من FAIL إلى PASS.
- أثبت حيًا أن Dashboard عند `320×720` لا يملك تمددًا أفقيًا: `documentElement.scrollWidth=320` و`body.scrollWidth=320`؛ لذلك C-07 PASS.
- أعدت التحقق من Dashboard وSystem Health وAudit: C-01 إلى C-05 PASS، مع System Health صريح في فصل core readiness عن AI/backup/restore gaps.
- أبقيت C-08 وC-09 وC-10 وC-11 وC-12 `NOT VERIFIED`: 200% zoom لم ينتج دليلًا موثوقًا، mobile drawer لا يظهر له زر فتح عند 320px، لم تُرسل mutations، release identity غير ظاهرة، ولا توجد fixtures منفصلة للأدوار.
- وثقت فشل favicon وdotLottie WASM/CSP كفجوات مفتوحة بدون تعديل CSP أو الإنتاج.

### الملفات المتأثرة
- `audit/2026-09-09-production-ui-audit.md`
- `.agents/mind/01-mind-latest.md`
- أدلة Playwright غير المتتبعة داخل `.playwright-mcp/` وملفات `evidence-*.png` و`console-*.txt` و`*-text.txt` و`*-network.txt`

### التحقق
- Google Chrome live read-only ✅ — `/dashboard`, `/system/health`, `/api/health/ready`, `/change-requests/new`, `/audit`.
- C-01..C-07 ✅ — 7 PASS في هذه الجولة/التراكم الحالي.
- C-08..C-12 — لم تُثبت، وسُجلت `NOT VERIFIED` بدل false-green.
- `/api/health/ready` ✅ — `{"status":"healthy"}` فقط، بدون release identity.
- لا build/test محلي جديد — الجولة الحالية تحقق متصفح وتوثيق فقط.

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** تم إغلاق C-06 وC-07 بالدليل الحي، لكن لا يزال التحقق الكامل 12/12 محجوبًا بسبب zoom، mobile drawer، fixtures، وdeployed release identity.

### ملاحظات / مشاكل مفتوحة
- يلزم fixture منفصل لـAdmin وعضو قليل الصلاحيات، ومسار واضح لهوية SHA/build/release المنشورة قبل C-11/C-12.
- لازم معالجة mobile drawer على الإنتاج أو توفير نسخة منشورة تحتوي الإصلاح قبل إعادة C-09.
- favicon/CSP dotLottie ما زالت مفتوحة وتحتاج قرار AppSec قبل أي تعديل.

## [2026-09-10] — تشخيص أخطاء Console في جلسة Dashboard الحية

### تم التنفيذ
- راجعت رسائل Console من جلسة الموقع الحي بعد تسجيل الدخول، وميّزت رسائل الموقع الحي عن رسائل خادم التطوير المحلي المتبقية في نفس سجل المتصفح.
- أثبتت أن `https://qclevel.top/favicon.ico` يرجع `404`.
- أثبتت أن `dotlottie-player.wasm` يُحمّل من نفس الأصل، لكن CSP الحالية `default-src 'self'` تمنع `WebAssembly.instantiateStreaming` وbuffered fallback بسبب غياب السماح المطلوب، فيفشل تهيئة dotLottie.
- لم أغيّر CSP أو أضيف `unsafe-eval`؛ القرار يحتاج مراجعة أمنية لأن توسيع CSP قد يضعف الحماية.

### التحقق
- Console الحي: favicon `404`، وWASM فشل في المسار الأساسي والـfallback، ثم `dotlottie-web Initialization failed`.
- لا توجد production mutations أو تغييرات ملفات في هذه الجولة.

### النتيجة
- **الحالة:** تشخيص مكتمل، الإصلاح غير منفذ.
- **مختصر:** الأخطاء ليست من نظام SVG؛ سببها favicon مفقود وCSP تمنع WASM الخاص بخلفية dotLottie.

### ملاحظات / مشاكل مفتوحة
- يلزم قرار صريح: تعطيل الخلفية عند CSP الصارمة، أو اعتماد CSP directive مناسب بعد مراجعة AppSec؛ لا نضيف `unsafe-eval` تلقائيًا.
- يلزم إضافة favicon محلي إن كان مطلوبًا، مع اختبار response `200`.

## [2026-09-10] — تحقق حي من نسخة الموقع باستخدام yazeed

### تم التنفيذ
- سجلت الدخول بنجاح إلى `https://qclevel.top/login` بحساب `yazeed` باستخدام كلمة المرور المقدمة عبر إدخال متصفح مباشر، بدون حفظها أو تسجيلها.
- تحققت من Dashboard الحي: كل مجموعات التنقل ظاهرة، والأيقونات المحلية موجودة بدل glyphs، والنصوص الجديدة خالية من `read model` والرموز المحظورة.
- تحققت من عقد SVG حيًا: `35` SVG مرئيًا، و`badIcons=0` لكل `viewBox/stroke/stroke-width/aria-hidden/focusable`.
- اختبرت طي Sidebar على سطح المكتب؛ تغيّر الزر إلى `Expand navigation` واختفت روابط التنقل من العرض كما هو متوقع.

### التحقق
- تسجيل الدخول الحي ✅ — `/login` → `/dashboard`.
- فحص DOM على Dashboard ✅ — `svgCount=35`، `badIcons=0`، المصطلحات المحظورة `false`، glyphs المحظورة `false`.
- فحص الجوال عند `320×720` ⚠️ — لم يظهر زر `Open navigation` بعد تغيير viewport، و`scrollWidth` تجاوز viewport؛ لم أعدّل الإنتاج أو أنشئ أي سجل.

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** نسخة الموقع الحية تحمل نظام SVG والنصوص الجديدة وتسجيل الدخول يعمل، لكن سلوك mobile drawer عند resize الحي يحتاج متابعة منفصلة قبل اعتباره مثبتًا.

### ملاحظات / مشاكل مفتوحة
- ظهرت 3 console errors و3 warnings في جلسة Dashboard؛ لم تُفحص تفاصيلها ضمن هذه الجولة.
- لا توجد أي production mutations، ولا commit أو push أو deploy من هذه الجلسة.

## [2026-09-10] — محاولة تشغيل اختبارات الأيقونات ببيانات yazeed

### تم التنفيذ
- شغّلت اختبار Playwright المصادق باستخدام بيانات الدخول المقدمة عبر متغيرات عملية مؤقتة فقط؛ لم تُحفظ كلمة المرور في الملفات أو السجل.
- الخادم المحلي كان يعمل على `127.0.0.1:4321`، لكن تسجيل دخول `yazeed` رجع HTTP `400` وبقي على `/login` بدون session cookie.

### التحقق
- `pnpm exec playwright test tests/e2e/navigation-icons.spec.ts` مع fixture: **1 passed / 2 failed**؛ الفشلان بسبب عدم اكتمال تسجيل الدخول المحلي، وليس assertion على الأيقونات.
- الفشل أعاد رسالة آمنة `Sign-in could not be completed` ولم يظهر أي secret أو stack trace.

### النتيجة
- **الحالة:** محجوب جزئيًا.
- **مختصر:** بيانات الدخول لم تُقبل على البيئة المحلية الحالية؛ يلزم تحديد بيئة/قاعدة تحتوي الحساب أو التحقق من بيانات الدخول قبل إعادة تشغيل المسارات المصادق عليها.

### ملاحظات / مشاكل مفتوحة
- لا يمكن استنتاج أن كلمة المرور خاطئة أو أن الإنتاج متاح؛ الاختبار الحالي محلي فقط.
- لا commit أو push أو deploy.

## [2026-09-10] — توحيد أيقونات SVG المحلية وتنظيف النسخ التشغيلية

### تم التنفيذ
- أضفت primitive محليًا موحدًا `Icon.astro` مع registry typed من 33 اسمًا دلاليًا، كلها inline SVG بـ`24×24` و`currentColor` و`aria-hidden`؛ بدون مكتبة أو assets خارجية.
- استبدلت رموز Unicode في navigation وSidebar وTopbar وUserMenu والفرز والـKPI وحالة الجدول والتقارير، مع بقاء labels والأسماء الوصولية كما هي.
- حوّلت قيم navigation من glyph strings إلى `IconName`، بدون تغيير hrefs أو capabilities أو منطق الظهور والتفويض.
- نظفت مصطلحات `read model` الظاهرة في dashboard/documents/change requests، واستبدلت الأسهم والرموز المعروضة في صفحات audit/change request/tasks بنصوص واضحة أو SVG محلي.
- أضفت contract ثابت يفحص كل `src/pages` و`src/ui` ضد المصطلحات والرموز المحظورة، واختبار Playwright عام لعقد SVG مع تغطية authenticated fixture-gated للطي/الجوال/الزوم/forced-colors.

### الملفات المتأثرة
- `src/ui/components/{Icon.astro,icon.ts}` و`src/ui/{navigation/navigation.ts,shell/*,components/data/*,charts/KpiCard.astro}`
- `src/pages/{dashboard/index,reports/index,audit,tasks/[taskId],documents/[documentId]/index,change-requests/**}`
- `tests/unit/ui/icon-and-copy-contract.test.ts`
- `tests/e2e/navigation-icons.spec.ts`

### التحقق
- `pnpm exec vitest run tests/unit/ui/icon-and-copy-contract.test.ts tests/unit/ui/app-shell.test.ts tests/unit/ui/navigation-permissions.test.ts` ✅ — 3 ملفات / 12 اختبارًا.
- `pnpm typecheck` ✅ — 0 أخطاء، 56 hints سابقة؛ Node المحلي `v22.22.3` خارج العقد `>=24.20.0 <25`.
- `pnpm lint` ✅ و`pnpm build` ✅ و`git diff --check` ✅.
- `pnpm exec playwright test tests/e2e/navigation-icons.spec.ts` ✅ — 1 passed / 2 skipped لغياب fixture مصادقة.
- الحزمة المرتبطة Playwright: 2 passed / 27 skipped / 6 failed؛ الفشل العام في login axe و`boundingBox` عند 320px/200%، وهو نفس عائق headless لخلفية login الموثق سابقًا، وليس فشلًا من اختبار الأيقونات الجديد.
- `prettier` نسّق ملفات TypeScript الجديدة/المعدلة؛ لا parser Astro مهيأ في إعداد Prettier الحالي.

### النتيجة
- **الحالة:** نجح جزئيًا.
- **مختصر:** توحيد الأيقونات والنسخ وعقود الحماية مكتمل محليًا، لكن إثبات shell المصادق في المتصفح ينتظر fixture دخول، وحزمة Playwright العامة ما زالت تتأثر بعائق login headless المعروف.

### ملاحظات / مشاكل مفتوحة
- لا commit أو push أو deploy.
- مجلد `.playwright-mcp/` غير متتبع وموجود خارج نطاق هذه المهمة ولم يُلمس.

## [2026-09-10] — استمرار تنفيذ F-11: تشغيل النسخ المحلي وتوثيق RPO/RTO

### تم التنفيذ
- أضفت أسماء إعدادات R2 الاختيارية إلى `src/config/constants.ts` و`src/config/env.ts` و`.env.example` بدون أسرار أو قيم فعلية.
- أضفت `PostgresRecoveryEvidenceRepository` لحفظ أدلة الاستعادة بشكل append-only عبر PostgreSQL، مع قراءة الأدلة المرتبطة بنسخة محددة.
- أضفت scripts محلية للنسخة اليومية وmonthly restore drill؛ النسخة اليومية fail-closed، وrestore drill يبقى blocked حتى توفير target معزول صريح.
- أضفت runbook تشغيلي يثبت حدود R2، خطوات `pg_dump` والتحقق بالـSHA-256، retention، restore drill، وقاعدة إبقاء F-11 مفتوحًا حتى وجود artifact وrestore evidence حيّين.
- أضفت واجهة Backups تعرض أهداف RPO=24 ساعة وRTO=4 ساعات وتفصلها بوضوح عن القياسات الفعلية.
- أضفت اختبارات adapters وbackup job للتحقق من round-trip للبايتات، اكتمال R2 config، success بعد read-after-write، وfail-closed عند فشل التنفيذ.

### الملفات المتأثرة
- `src/config/{constants.ts,env.ts}` و`.env.example`
- `src/modules/backup-recovery/infrastructure/postgres-recovery-evidence-repository.ts`
- `scripts/recovery/{run-daily-backup.ts,run-monthly-restore-drill.ts}`
- `docs/operations/F11-BACKUP-RECOVERY-RUNBOOK.md`
- `src/pages/system/backups/index.astro`
- `tests/unit/backup-recovery/{adapters.test.ts,backup-job.test.ts}`
- `package.json`

### التحقق
- `pnpm exec vitest run tests/unit/backup-recovery` ✅ — 6 ملفات / 12 اختبارًا.
- `pnpm exec astro check` ✅ — 0 أخطاء، 56 hints/warnings legacy.
- `git diff --check` ✅
- لم تُشغّل اختبارات PostgreSQL/integration أو إثبات R2/restore حي: لا توجد credentials أو target معزول، وNode المحلي `v22.22.3` خارج العقد `>=24.20.0 <25`.

### النتيجة
- **الحالة:** جزئي.
- **مختصر:** زادت تغطية التنفيذ المحلي والتوثيق والواجهة، لكن F-11 ما زال `OPEN / PARTIAL` لأن catalog wiring الكامل، restore drill المعزول، وartifact حي بنفس deployed release لم تُثبت بعد.

### ملاحظات / مشاكل مفتوحة
- لا commit أو push أو deploy.
- `src/modules/backup-recovery/infrastructure/cloudflare-r2-artifact-store.ts` ما زال يحتاج list/retention provider wiring مكتملًا.
- `run-daily-backup.ts` يرفع ويتحقق من artifact لكنه يحتاج ربطًا نهائيًا بـbackup catalog/evidence transaction قبل اعتباره job تشغيليًا مكتملًا.
- تغيير `.opencode/opencode.json` السابق غير متعلق بالمهمة وتُرك كما هو.

## [2026-09-10] — تنفيذ Prompt 3 (F-10): دورة حياة قوالب الحجر بسياسة P-06

### تم التنفيذ
- بنيت وحدة `src/modules/quarantine/templates`: دومين (`template-state` بست حالات وTR-TMPL-001..007 + `template` + `template-policy` للسلطات الثلاث)، منفذ `TemplateRepository`، وتطبيق Postgres ذري (نسخة متوقعة/رفض stale + audit/outbox بنفس الترانزاكشن + إعادة idempotent بنفس requestId).
- أضفت حالات استخدام: إنشاء (Employee→DRAFT بلا توقيع، والسلطات→APPROVED بتوقيع إلزامي)، review/approve (للسلطات فقط مع استثناء SoD الخاص بالقوالب)، stop/void/supersede (سبب إلزامي + reauth + توقيع)، وrevise (مراجعة DRAFT جديدة بدل التعديل المباشر).
- وسّعت `policy-registry` بكيانات `INSPECTION_TEMPLATE_VERSION`، ومنحت `PERM-ADM-TEMPLATES` لـEmployee/Supervisor/Manager و`PERM-ESIG-SIGN` للسلطتين (Admin وحده مرفوض)، ومدّدت `APPROVAL_SUBJECT_TYPES` لنوع القالب.
- بنيت أكشنات `quarantineTemplates` السبع وصفحتي `/quarantine/admin` (قائمة + إنشاء POST baseline + سجل الإتاحة بأسباب التعطيل) و`/quarantine/admin/[templateId]` (الخمسة أفعال + مراجعة جديدة).
- وثّقت الدورة في `STATE-MACHINES.md` (§118) و`PERMISSION-MATRIX.md` (§151) و`ROUTE-MANIFEST-SPECIFICATION.md` (مسار التفاصيل).

### الملفات المتأثرة
- `src/modules/quarantine/templates/{domain,ports,infrastructure,application}/*` (جديدة)
- `src/actions/quarantine-templates.ts` + `src/actions/index.ts`
- `src/pages/quarantine/admin/{index,[templateId].astro}`
- `src/shared/authorization/policy-registry.ts` + `db/seeds/common.ts`
- `src/modules/approvals/{domain/approval,application/authorization}.ts`
- `Documents/{STATE-MACHINES,PERMISSION-MATRIX,ROUTE-MANIFEST-SPECIFICATION}.md`
- `tests/unit/quarantine/*` + `tests/integration/quarantine/template-{lifecycle,concurrency}.test.ts` + `tests/e2e/quarantine-templates.spec.ts`

### التحقق
- `pnpm exec astro check` ✅ — 0 errors (637 ملفًا)
- `pnpm lint` ✅ exit 0 و`pnpm test:architecture` ✅
- `pnpm test:unit` ✅ — 46 ملفًا / 263 اختبارًا (كانت 44/252: +11 وحدة قوالب)
- `tests/integration/quarantine` ✅ — 26 passed / 2 skipped (منها 11 دورة حياة P-06)
- `pnpm build` ✅ و`git diff --check` ✅
- دخان preview: `/quarantine/admin` بلا جلسة `303 → /login` ✅
- Playwright للمواصفة الجديدة: 2 passed / 1 skipped (gated بلا fixture) ✅
- اختبار `template-concurrency` حقيقي PG: gated (يُتخطى بلا `QC_TEST_DATABASE_URL`/Docker)
- Node المحلي `v22.22.3` خارج عقد `>=24.20.0` — النتائج محلية

### النتيجة
- **الحالة:** نجح (تنفيذيًا؛ الإغلاق الرسمي لـF-10 يحتاج fixture مصادقة وتمرير كل أفعال الدورة على مرشح الإصدار حسب البرومبت)
- **مختصر:** دورة حياة القوالب كاملة بسياسة P-06 ومحروسة بالاختبارات السالبة/الموجبة وSoD والتزامن، لكن F-10 يبقى OPEN حتى دليل حي على نفس الـbuild المنشور.

### ملاحظات / مشاكل مفتوحة
- لا commit أو push أو deploy.
- مجلد `.opencode/` غير متتبع ومو من شغلي — تُرك كما هو.
- الإثبات الحي المصادق (C-12 وأفعال الدورة لكل سلطة) يحتاج fixtures وbuild منشور — مغطى بـE2E gated.

## [2026-09-10] — تنفيذ Prompt 2: مسار سياقي مصرح به لإنشاء Change Request (DOCUMENT_VERSION)

### تم التنفيذ
- أضفت `document-version-change-fields.ts`: القائمة المسموحة `revision` و`changeSummary` و`contentHash` فقط، مع عناوين بشرية وأنواع `text`، ورفض أي حقل آخر بخطأ تحقق آمن.
- أضفت منفذ `ChangeTargetSource` وتطبيقه `PostgresChangeTargetSource` (قائمة/تحميل بتفويض `PERM-DOC-VIEW` لكل هدف) وحالة استخدام `CreateDocumentVersionChangeRequestUseCase` التي تشتق `targetId/version/snapshot/currentValue/dataType` خادميًا فقط.
- أضفت `createForDocumentVersion` في `PostgresChangeRequestRepository` (إعادة قراءة صف النسخة `FOR UPDATE` داخل نفس الترانزاكشن ورفض `CONFLICT_STALE_VERSION`) وفي Astro Action الجديد، مع تشديد المسار الخام القديم بنفس القائمة.
- أعدت كتابة `change-requests/new.astro`: منتقي نسخ مصرح بتسميات بشرية + معاينة قيم حالية + منتقي حقل من 3 حقول + قيمة مقترحة، بلا أي `targetSnapshot/fieldPath/dataType/targetId/targetVersion/currentValue/targetType`، مع POST baseline وAction enhancement وقيم محفوظة وتحذير stale.
- حدّثت اختبار `change-requests.test.ts` القديم من `title` إلى `revision` المسموح، وحدّثت عقد `entity-select.test.ts` ومسار `create-forms-resilience.spec.ts` (بوابة `QC_E2E_DOCUMENT_VERSION_ID/NO` للنجاح + دعم SELECT)، وأضفت `change-request-contextual.spec.ts` (فشل no-JS مزدوج + عقد عرض + كيبورد + 320px).

### الملفات المتأثرة
- `src/modules/change-requests/application/{document-version-change-fields,create-document-version-change-request}.ts` (جديدة)
- `src/modules/change-requests/ports/change-target-source.ts` + `infrastructure/postgres-change-target-source.ts` (جديدة)
- `src/modules/change-requests/{ports/repository,application/{create-change-request,dependencies},infrastructure/postgres-repository}.ts`
- `src/actions/change-requests.ts` (+`createForDocumentVersion`)
- `src/pages/change-requests/new.astro` (إعادة كتابة سياقية)
- `tests/unit/change-requests/document-version-change-fields.test.ts` + `tests/integration/change-requests/document-version-change-request.test.ts` (جديدة)
- `tests/integration/change-requests/change-requests.test.ts` + `tests/unit/ui/entity-select.test.ts` (تحديث)
- `tests/e2e/change-request-contextual.spec.ts` (جديدة) + `tests/e2e/create-forms-resilience.spec.ts` (تحديث)

### التحقق
- `pnpm exec astro check` ✅ — 0 errors (بعد إصلاح cast واحد في سكربت الصفحة)
- `pnpm test:unit` ✅ — 44 ملفًا / 252 اختبارًا (كانت 43/246: +6 وحدة allowlist و+تحديث عقد)
- `tests/integration/change-requests` ✅ — 3 ملفات / 17 اختبارًا (5 سياقية جديدة)
- `pnpm lint` ✅ و`pnpm test:architecture` ✅ و`pnpm build` ✅
- دخان preview محلي: GET بلا جلسة `303 → /login`، وPOST بلا جلسة `403` مطابقة لصفحة tasks (سلوك CSRF الإطاري — لا انتكاس)
- Playwright للمواصفة السياقية: 5 skipped (gated بلا fixture) ✅ وتحميل 41 اختبارًا للملفين بلا أخطاء بناء
- `prettier --write` لثلاثة ملفات جديدة ✅ و`git diff --check` ✅
- Node المحلي `v22.22.3` خارج عقد `>=24.20.0` — النتائج محلية

### النتيجة
- **الحالة:** نجح
- **مختصر:** فورم Change Request صار سياقيًا مصرحًا بلا UUID/JSON ظاهرين، والقيم الحرجة تُشتق خادميًا مع فحص تزامن ذري، والقائمة المسموحة محروسة من المسارين الخام والسياقي.

### ملاحظات / مشاكل مفتوحة
- لا commit أو push أو deploy.
- الإثبات الحي في Chrome (C-06) يحتاج fixture مصادقة + نسخة وثيقة حقيقية وbuild منشور — مغطى بـ E2E gated.
- نجاح E2E العام لـ change-request يحتاج `QC_E2E_DOCUMENT_VERSION_ID/NO` في CI.
- `change-target-vocabulary.ts` القديم (`CHANGE_TARGET_TYPES`) بقي للتوافق ولم يعد مستخدمًا في الصفحة.

## [2026-09-10] — تنفيذ BI-01: عزل خلفية درج الجوال في AppLayout

### تم التنفيذ
- في `AppLayout.astro`: الدرج المفتوح عند breakpoint الجوال يعزل `.app-workspace` بـ`inert` الأصلي ويقفل سكرول الخلفية (`body overflow:hidden`)، مع حبس Tab/Shift+Tab داخل الدرج والإغلاق بـEscape وإرجاع الفوكس لزر التنقل.
- إغلاق الدرج أو مغادرة الـbreakpoint يشيل كل حالة مؤقتة (`inert` عن اللوحتين + فك قفل السكرول)؛ الفوكس عند الفتح يروح لأول رابط، وما فيه أي `smooth` يخالف تقليل الحركة.
- frontmatter السيرفر والتنقل والصلاحيات ما انلمست — التغيير سكرِبت عميل فقط.
- أضفت `tests/unit/ui/mobile-drawer-inert.test.ts` (8 حراس ثابتين) و`tests/e2e/mobile-drawer-inert.spec.ts` (5 سيناريوهات حية: عزل/سكرول/فوكس، Tab ذهابًا وإيابًا، Escape وإرجاع الفوكس، تغيير الـbreakpoint، تقليل الحركة).
- أثبتّ السلوك على الـchunk المشحون فعليًا (`hoisted.DaTPGyGg.js`) عبر harness متصفح مؤقت: 9/9، ثم حذفته.

### الملفات المتأثرة
- `src/ui/layouts/AppLayout.astro`
- `tests/unit/ui/mobile-drawer-inert.test.ts` (جديد)
- `tests/e2e/mobile-drawer-inert.spec.ts` (جديد)

### التحقق
- `pnpm test:unit` ✅ — 43 ملفًا / 246 اختبارًا (كانت 238: +8 الجديدة)
- `pnpm typecheck` ✅ — 0 errors (36 hints سابقة)
- `pnpm lint` ✅ و`pnpm test:architecture` ✅ و`pnpm build` ✅ (تحذير chunk كبير سابق من خلفية الدخول)
- Runtime harness على الكود المشحون ✅ — 9/9 (مؤقت ومحذوف)
- Playwright على preview محلي: 1 passed / 25 skipped (gated بلا fixture) / 6 failed — الستة عامة (login/a11y/reflow) وأُثبتت pre-existing بتكرارها على baseline بدون تغييري (stash + rebuild + نفس الفشل)
- `prettier --check` للملفين الجديدين ✅ و`git diff --check` ✅ (ملفات astro خارج تغطية prettier — قائم مسبقًا)
- Node المحلي `v22.22.3` خارج عقد `>=24.20.0` — النتائج محلية

### النتيجة
- **الحالة:** نجح جزئيًا
- **مختصر:** عزل الدرج مطبق ومغطى ومثبت سلوكيًا على البناء المحلي، لكن الإغلاق الحي للإيجاد (C-09 على الإنتاج) ما زال `NOT VERIFIED` — يحتاج fixture مصادقة وbuild منشور.

### ملاحظات / مشاكل مفتوحة
- لا commit أو push أو deploy أو production mutation؛ سيرفر الـpreview أُطفئ.
- فشل الـ6 العامة مرتبط ببيئة headless مع خلفية الدخول ثلاثية الأبعاد (الفورم يرسم سليمًا لكن `focus()` و`boundingBox` يعلقان) — خارج نطاق BI-01 ويحتاج مهمة مستقلة.
- اختبارات الدرج المصادقة الـ5 الجديدة ستعمل في CI مع توفر `QC_E2E_LOGIN_IDENTITY/PASSWORD`.

## [2026-09-10] — استكمال برومبتات الوصول المثبت إلى 100% في تدقيق الإنتاج

### تم التنفيذ
- راجعت تغطية البرومبتات الحالية مقابل 15 Finding و12 سيناريو Chrome، وحددت أن التنفيذ والـlive verification ما كانا مفصلين بما يكفي لضمان عدم سقوط أي بند من الحساب.
- أضفت Prompt 11 لإعادة إثبات البنود الـ15 كلها على release candidate واحد، بما فيها البنود المغلقة سابقًا بدل ترحيل دليل قديم.
- أضفت Prompt 12 لإثبات Git SHA/build/RC المنشور، وPrompt 13 لحسابات وأدوار التحقق الآمنة واختبارات الرفض.
- أضفت Prompt 14 وPrompt 15 لتنفيذ C-01 إلى C-12 تفصيليًا في Chrome، وPrompt 16 لتجميع الأدلة وحساب المقاييس الأربعة بلا تقريب مضلل.
- أضفت جدول ربط يوضح البرومبتات المطلوبة وشرط 100% لكل مقياس، مع إبقاء القيم الحالية كما هي إلى أن يظهر دليل تنفيذي حي.

### الملفات المتأثرة
- `audit/2026-09-09-production-ui-audit.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- تأكدت من وجود 16 برومبتًا ومن تغطية `15/15` و`12/12` وشروط `0 FAIL` و`0 NOT VERIFIED` نصيًا ✅
- `git diff --check` ✅
- ما شغلت build/tests لأن التغيير توثيقي وبرومبتات فقط.

### النتيجة
- **الحالة:** نجح
- **مختصر:** التقرير يغطي الآن كامل مسار جعل المقاييس الأربعة 100% بشكل قابل للإثبات، لكنه ما يدّعي تحققها قبل التنفيذ والنشر والفحص الحي.

## [2026-09-10] — تثبيت قرارات السياسة داخل تقرير التدقيق كبرومبتات فقط

### تم التنفيذ
- حدّثت تقرير تدقيق الإنتاج بقرارات P-01 إلى P-07 المعتمدة، مع توضيح أن اعتماد السياسة ما يرفع النسب بدون تنفيذ ودليل حي.
- ثبّتت أن حقول تغيير `DOCUMENT_VERSION` المسموحة فقط هي `revision` و`changeSummary` و`contentHash`، وأضفتها لمعايير Prompt 2 واختباراته المطلوبة.
- ثبّتت أن Supervisor فقط يغلق CAPA وأن الإغلاق ما يشترط اكتمال الإجراءات ولا `effectivenessVerified=true`، وحولته إلى Prompt 8 تنفيذي محكوم بالتوقيع وإعادة التحقق والنسخة والـAudit.
- وسّعت برومبتات القوالب والنسخ والاستعادة، وأضفت Prompt 9 لصلاحيات P-05 وPrompt 10 لاعتماد Production Release حسب P-07.
- أوقفت ورجعت كل تعديلات التنفيذ الجزئية التي بدأت قبل توجيه المالك الأخير؛ ما بقي من المهمة هو تحديث التقرير فقط.

### الملفات المتأثرة
- `audit/2026-09-09-production-ui-audit.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `git diff --check` ✅
- مراجعة نصية لوجود القرارات الثلاثة الخاصة بـ`DOCUMENT_VERSION` وCAPA وبرومبتات 8–10 ✅
- ما شغلت build/tests لأن التغيير توثيقي فقط، وبناءً على طلب المالك بعدم تنفيذ البرومبتات.

### النتيجة
- **الحالة:** نجح
- **مختصر:** التقرير صار يحتوي القرارات النهائية وبرومبتات تنفيذية دقيقة بدون تطبيق تغييرات على النظام، وبقيت النسب كما هي لأنها ما زالت مرتبطة بأدلة التنفيذ الحقيقية.

## [2026-09-09] — إعادة تدقيق واجهة الإنتاج بنسب قابلة لإعادة الحساب

### تم التنفيذ
- أعدت جولة `better-interface` قراءة فقط على الإنتاج في Google Chrome بالحساب المصرح، وشملت Login وDashboard وSystem Health وAudit وChange Requests.
- استبدلت تقدير 88% السابق بأربعة مقاييس ذات بسط ومقام صريحين: إغلاق Findings ‏53.3% (8/15)، تغطية الجولة الحية 50.0% (6/12)، نجاح المنفذ 83.3% (5/6)، والنجاح المحافظ 41.7% (5/12).
- أثبتت حيًا نجاح Login/navigation/Dashboard/Health/Audit، وأكدت فشل تبسيط Change Request بسبب ظهور UUID/version/JSON/field path/data type للمشغل.
- وثقت أن storage وAI ما زالا `UNKNOWN` وأن backup catalog بلا بيانات وrestore غير متحقق؛ لم أغيّرها إلى false-green.
- أضفت سبعة برومبتات تنفيذية لإغلاق drawer accessibility وChange Request وquarantine administration وoperational evidence والأيقونات/النسخ ثم استكمال الجولة الحية وحساب 100% ببوابة صارمة.

### الملفات المتأثرة
- `audit/2026-09-09-production-ui-audit.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- فحص حي مصادق عليه في Google Chrome لـ5 سيناريوهات PASS وFinding واحد FAIL؛ 6 سيناريوهات بقيت `NOT VERIFIED` ومذكورة بالاسم في التقرير.
- مراجعة المصدر الحالية عند HEAD `2adb7871a285711e87a24a3b83dd3848b795d64a` مع شواهد `file:line` للفجوات المفتوحة.
- `pnpm` typecheck/lint/tests/build لم يكتمل في هذه الجولة، لذلك لم يُسجّل كـPASS ولم يدخل النسب.
- `git diff --check` ✅ بعد إزالة trailing whitespace من ترويسة التقرير.

### النتيجة
- **الحالة:** نجح جزئيًا
- **مختصر:** التقرير صار صادقًا حسابيًا وقابلًا لإعادة الإنتاج، والجولة الحية أكدت الواقع بدل الاعتماد على تقدير؛ الحكم بقي `Needs changes` ولا توجد مطالبة 100% أو Production Ready.

### ملاحظات / مشاكل مفتوحة
- إثبات deployed SHA، و320px/200%، وmobile drawer keyboard containment، وcontrast الشامل، وnegative authorization، وتشغيل الاختبارات المحلية الطازجة ما زالت مفتوحة وموثقة `NOT VERIFIED`.

## [2026-09-09] — دمج خلفية QC ثلاثية الأبعاد في صفحة /login فقط

### تم التنفيذ
- نسخت المكوّن المورّد كما هو إلى `src/ui/components/QCLogin3DBackground.astro` (مطابق byte-for-byte للأصل) والموديل إلى `public/assets/qc-medical-hero.glb` (يُخدم على `/assets/qc-medical-hero.glb`)، وثبتّ `three@0.185.1` عبر `pnpm add three` ليُحزم محليًا عبر Astro/Vite (مقطع `hoisted.BTW2StZB.js` بحجم 617KB مرتبط بمسار `/login` فقط في الـ manifest).
- ركّبت الخلفية في `src/pages/login.astro` فقط (لا وجود لها في أي layout) مع `systemBackground={false}` و`transparent` حتى لا تتحمل الصفحة خلفيتين ولا يغطي AuthLayout المشهد؛ النموذج فوق الخلفية بـ `position:relative; z-index:1` والـ canvas لا يعترض المؤشر (`pointer-events:none`) والمحتوى الزخرفي مخفي عن التقنيات المساعدة (`aria-hidden` + `role=presentation` على الـ canvas).
- أضفت opt-out في `BaseLayout` (`systemBackground` الافتراضي `true`) ومررته `AuthLayout` مع صنف `is-transparent`؛ باقي الصفحات تستخدم الافتراضي بلا تغيير، والمصادقة والتحقق والتحويلات ونصوص الإنجليزية LTR لم تُمس.
- أبقيت سلوك المكوّن المورّد: `prefers-reduced-motion` وfallback CSS عند غياب WebGL/فشل GLB وresponsive (portrait/tablet/desktop) وتنظيف الـ renderer والـ listeners عبر `astro:before-swap` و`pagehide`.

### الملفات المتأثرة
- `src/ui/components/QCLogin3DBackground.astro` (جديد — نسخة المورّد)
- `public/assets/qc-medical-hero.glb` (جديد — نسخة الموديل)
- `src/pages/login.astro` (التركيب + رفع النموذج)
- `src/ui/layouts/BaseLayout.astro` و`src/ui/layouts/AuthLayout.astro` (opt-out فقط، بلا تركيب للخلفية)
- `package.json` و`pnpm-lock.yaml` (`three 0.185.1`)

### التحقق
- `pnpm exec astro check` ✅ (0 أخطاء) و`pnpm build` ✅ والموديل يُخدم `200 model/gltf-binary` ✅.
- `tests/unit/ui` ✅ (92/92) و`test:architecture` ✅ وESLint على الملفات (ملفات astro خارج تغطية الكونفق — قائم مسبقًا) وprettier لا يparse أي astro في الريبو (قائم مسبقًا).
- سيرفر البناء: `/login` يعرض `data-qc-3d-background` مع الموديل ولا `data-system-background`، و`/dashboard` و`/audit` بلا جلسة `303 → /login`، وPOST فارغ يرد `AstroActionInputError/400` ثم يعرض `Sign-in could not be completed` بلا crash.
- متصفح headless حقيقي (desktop ‏1440×900 وmobile ‏390×844 لاحقًا ب800×600): canvas بملء الشاشة و`pointer-events:none` والنموذج ظاهر وقابل للتعبئة والإرسال (alert ظهر، صفر crash)، وبعد الانتقال لصفحة 404: صفر عناصر QC وصفر canvases، ومقطع chunks الصفحات الأخرى (dashboard/index/audit/account/404) خالٍ من أي إشارة للموديل أو الحزمة.
- ملاحظات قائمة مسبقًا (ليست من هذا التغيير): خطأ `/favicon.ico` (لا ملف favicon) وفشل WASM الخاص بـ dotlottie/SystemBackground على صفحة 404 بسبب CSP — الكودان لم يُمسّا.

### النتيجة
- **الحالة:** نجح
- **مختصر:** خلفية الدخول ثلاثية الأبعاد تعمل على `/login` فقط (desktop وmobile) مع بقاء المصادقة والعزل والتنظيف، وبلا commit أو push.

### ملاحظات / مشاكل مفتوحة
- نجاح الدخول ببيانات صحيحة (303) لم يُجرّب حيًا (يحتاج DB ببيانات) — مغطى بـ e2e الحالي في CI، ومنطق الـ action لم يُمس.
- التحقق البصري الحركي الكامل (جودة المشهد/الـ parallax) يحتاج GPU حقيقيًا — SwiftShader البرمجي ثقيل مع هذه الخامة لكنه أكمل التهيئة بلا أخطاء صفحة.

### تم التنفيذ
- أضفت Prompt 9 بالإنجليزي لدمج حزمة `public/assets/astro` كخلفية لصفحة `/login` فقط، مع المسارات الفعلية للمكوّن والموديل.
- ضمّنت متطلبات وضوح النموذج وعزل التحميل وتنظيف WebGL والتحقق من الصفحات الأخرى.
- اكتمل تعديل Prompt 6 للواجهة الإنجليزية فقط وإزالة طلب التعريب من F-08 وPrompt 4؛ التقرير نفسه بقي بالعربي.

### الملفات المتأثرة
- `audit/2026-09-09-production-ui-audit.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- راجعت README وتأكدت من وجود المكوّن وملف GLB.
- مراجعة نصية للبرومبت؛ لم يُنفّذ دمج الخلفية لأن الطلب إضافة برومبت فقط.

### النتيجة
- **الحالة:** نجح
- **مختصر:** التقرير يحتوي تسعة برومبتات تنفيذية بالإنجليزي، وآخرها مخصص لخلفية تسجيل الدخول وحدها.


## [2026-09-09] — حزمة F-10 وF-11: سياسة ونشر مضبوطة بلا تغيير جاهزية

### تم التنفيذ
- أنتجت `audit/F-10-F-11-policy-deployment-package.md`: جرد الستة (تخزين، نسخ/استعادة، مزود AI، إدارة قوالب الحجر، إغلاق NCR/CAPA، سلطات الاعتماد) بشواهد `file:line` حية على HEAD `6e65cd5`.
- فصلت فجوات التنفيذ (G-01..G-06: لا مزود تخزين/نسخ/PITR، لا orchestrator استعادة، لا mutations قوالب، لا AI adapter) عن القرارات السياسية (P-01..P-07: مزودون، RPO/RTO، سلطات الإغلاق والاستعادة وإعادة الفتح، e-signature) — بلا اختراع أي قيمة.
- أبقيت الرفض: الاستعادة الإنتاجية DENY خادميًا (`isProductionRestorePolicyApproved()=false` + `AUTHZ_DENIED`)، وإغلاق CAPA مستحيل دومين، وإغلاق NCR مشروط بتحقق، وADMIN ليس سلطة استعادة تلقائية.
- وثقت الأدلة الحالية: تخزين `UNKNOWN`، كتالوج نسخ فارغ (لا artifact للتحقق)، AI ‏`NOT_CONFIGURED`، drill السابق `RER-2026-09-08-001` stale على HEAD مختلف ولا يُعاد استخدامه، وUAT ‏`NOT EXECUTED` (صفر جلسات).
- لم أغيّر أي حالة جاهزية: F-10/F-11 تبقى OPEN، والجاهزية `UNVERIFIED`، وحكم التدقيق BLOCKED ‏(68%) قائم — بلا ادعاء 100% أو production-ready.

### الملفات المتأثرة
- `audit/F-10-F-11-policy-deployment-package.md` (جديد — الحزمة)
- `.agents/mind/01-mind-latest.md` (هذا السجل)

### التحقق
- `vitest`: ‏45/45 ✅ (‏restore-authorization ‏10 + ‏backup-catalog ‏8 + ‏advisory ‏14 + ‏fail-closed ‏10 + ‏ncr ‏2 + ‏capa ‏1) — طازجة على نفس HEAD
- `prettier --check` للحزمة ✅ و`git diff --check` ✅
- `pnpm build` / ‏E2E / ‏drill معزول جديد: لم تُشغّل (خارج نطاق الحزمة — الحزمة توثيق وجرد وأدلة، لا تنفيذ مزودين)
- Node المحلي `v22.22.3` خارج عقد `>=24.20.0` — النتائج محلية

### النتيجة
- **الحالة:** نجح
- **مختصر:** الحزمة المضبوطة جاهزة كـ blocker متتبع: الجرد والفصل والرفض موثقة بدليل طازج، ولا مزود اختُرع ولا جاهزية تغيّرت.

### ملاحظات / مشاكل مفتوحة
- لا commit أو push أو deploy.
- الإغلاق الفعلي يحتاج: اعتماد P-01..P-07، تنفيذ G-01..G-05، drill معزول جديد على المرشح الدقيق، وسلامة artifacts، وUAT منفذة — بالترتيب الموثق في §10 من الحزمة.

## [2026-09-09] — إصلاح F-07: توحيد استعلام التدقيق بين Dashboard و/audit

### تم التنفيذ
- تتبعت شروط السطحين: الـ dashboard يتفوض بـ DASH permission ونشاطه مقيد بحدث الفاعل نفسه (`actor_id = actor.id`)، بينما `/audit` يتطلب `PERM-ADM-AUDIT-VIEW` الصريح — ووثقت أن أي تباين خارج هذا مقصود سياسةً لا انحرافًا.
- وسعت العقد المعتمد في `audit-query.ts`: تطبيع الفلاتر (`limit` 1..100 و`offset` ≥0 وقص النصوص وتحقق التواريخ)، و`total` = العدد الكامل المطابق لا طول الصفحة، وترتيب ثابت (`occurred_at DESC, event_no DESC`)، و`mapAuditRowToView` كمسار allowlist الوحيد (بلا `payload` بنيويًا).
- أصلحت `PostgresAuditQuery`: كانت ترد صفوف snake_case خامًا بلا mapping (سبب كسر العرض) و`total` = طول الصفحة وبلا offset — صارت query-builder بنفس الشروط للـ COUNT والصفحة، بأعمدة آمنة صريحة وmapping معتمد، ولا تختار `payload` أبدًا.
- وحّدت نشاط الـ dashboard على نفس الـ mapper والترتيب والإسقاط الآمن بدل SQL اليدوي (`COALESCE(reason, action)` صار `reason ?? action` بعد الـ mapping).
- أعطيت صفحة `/audit` فلاتر كاملة (subject/actor/action/from/to/limit) وترقيم Prev/Next مع echo للفلاتر، مع بقاء الرفض والفراغ بنفس حالة empty (حماية existence-leakage).
- أضفت `tests/integration/shared/audit-dashboard-parity.test.ts` (9 اختبارات): نفس الفاعل يرى نفس الحدث المؤهل على السطحين، عزل own-scope، رفض بلا صلاحية (حتى Admin وحده) بنفس الكود مع/بدون بيانات، ترقيم وtotal، فلاتر الأبعاد الستة، ثبات الترتيب عند تساوي الوقت، وإثبات عدم تسريب `payload`/الأسرار، وتمرير الفاعل عبر `GetDashboardUseCase`.

### الملفات المتأثرة
- `src/shared/audit/audit-query.ts` (العقد المعتمد)
- `src/shared/audit/postgres-audit-query.ts` (COUNT + صفحة + mapping)
- `src/modules/dashboard/infrastructure/postgres-dashboard-query.ts` (توحيد النشاط)
- `src/pages/audit.astro` (فلاتر + ترقيم)
- `tests/integration/shared/audit-query.test.ts` (تحديث fake للعقد)
- `tests/integration/shared/audit-dashboard-parity.test.ts` (جديد)

### التحقق
- RED→GREEN: بدون الإصلاح 7/9 تفشل، ومعه 9/9 ✅
- `pnpm exec astro check` ✅ — 0 errors
- `pnpm lint` ✅ و`pnpm test:architecture` ✅
- `pnpm test:unit` ✅ — 238 اختبارًا (بلا تغيير)
- `tests/integration/shared + dashboard` ✅ — 10 ملفات / 28 اختبارًا
- `pnpm build` ✅
- دخان إنتاجي: `/audit` و`/audit?...filters` و`/dashboard` بلا جلسة ترد `303 → /login` (لا 404/500 ولا تسريب) ✅
- Node المحلي `v22.22.3` خارج عقد `>=24.20.0` — النتائج محلية

### النتيجة
- **الحالة:** نجح
- **مختصر:** السطحان يقرآن الآن نفس العقد المعتمد بترتيب وmapping وترقيم موحد، وحدث GRANT المؤهل يظهر متطابقًا عليهما لنفس الفاعل المخوّل، مع بقاء حماية عدم التسريب وبلا payload/أسرار.

### ملاحظات / مشاكل مفتوحة
- لا commit أو push أو deploy.
- الإثبات المصادق الحي (دخول yazeed ورؤية GRANT على السطحين في الإنتاج) يحتاج بيئة disposable ولم يُنفذ هنا.
- تباين مقصود موثق: فاعل بـ DASH فقط يرى نشاطه الخاص في الـ dashboard لكن `/audit` ترفضه — سياسة لا خلل.

## [2026-09-09] — إصلاح F-12: واجهة إنجليزية فقط + مفردات sentence-case موحدة

### تم التنفيذ
- ثبتّ الواجهة على الإنجليزية فقط: أزلت فرع `?locale=ar` من `login.astro` فصارت دائمًا `lang="en" dir="ltr"` بنسخة إنجليزية ثابتة، بلا مبدّل لغة أو ملفات ترجمة أو واجهة ثنائية.
- وحّدت مفردات الأفعال بحالة الجملة: `Create task` و`Create finding` و`Create document` و`Create receiving item` و`Save draft` و`Create draft version` و`Edit draft` و`Back to tasks/users/administration/roles`، مع عناوين `New equipment/calibration/maintenance/change request/revision` بحالة الجملة.
- أبقيت دلالات الانتقالات المضبوطة كما هي: `Submit for review` و`Approve revision` و`Record review` و`Release item` و`PASS ≠ RELEASED` بلا إعادة تسمية، وحُفظت المصطلحات العلمية المعتمدة بلا تغيير.
- حدّثت توقعات E2E لتثبيت القفل الإنجليزي (`?locale=ar` يرد إنجليزيًا LTR) وصححت `submitName` الثلاثة (`Save draft` و`Create document`)، وأضفت حارس `tests/unit/ui/action-vocabulary.test.ts` (5 اختبارات: قفل اللغة، غياب العربية/RTL، حظر Title Case، حضور المفردات، حفظ المضبوط).
- أبقيت CSS المنطقي القائم (`[dir='rtl']` الخامل) بلا حذف حتى لا ينتكس F-03؛ الفحص الساكن يثبت أن لا صفحة تمرر `ar`/`rtl` وأن لا نسخة عربية في `src/pages`.

### الملفات المتأثرة
- `src/pages/login.astro` (قفل إنجليزي)
- `src/pages/{tasks/index,new,[taskId],quality/findings/{index,new},documents/{index,new},documents/[documentId]/versions/{new,[versionId]/{edit,index}},assets/{equipment,calibrations,maintenance}/new,quarantine/receiving/new,change-requests/new,laboratory/tests/new,admin/{scopes,permissions,users,roles}/**}`
- `src/ui/components/forms/FormActions.astro` (الافتراضي `Save draft`)
- `tests/unit/ui/action-vocabulary.test.ts` (جديد)
- `tests/e2e/{accessibility,responsive,reflow-320,system-background,create-forms-resilience}.spec.ts` (توقعات إنجليزية فقط)

### التحقق
- `pnpm exec astro check` ✅ — 0 errors
- `pnpm lint` ✅ (exit 0)
- `pnpm test:unit` ✅ — 238 اختبارًا (كانت 233: +5 الجديدة)
- `pnpm test:architecture` ✅ — بلا مخالفات Delivery
- `pnpm build` ✅
- دخان preview محلي على `localhost`: `/login` و`/login?locale=ar` يردان `<html lang="en" dir="ltr">` بنسخة `Sign in` وصفر عربية ✅؛ الأسطح التمثيلية (dashboard/tasks/receiving/documents/lab/approvals) ترد `303 → /login` بلا جلسة (لا 404/500) ✅
- Playwright المتصفح لم يُشغّل ضد سيرفر حي هنا (فشل `ERR_CONNECTION_REFUSED` المتوقع بدون preview على 4321) — التغطية عبر الحراس الساكنة والدخان الإنتاجي أعلاه
- Node المحلي `v22.22.3` خارج عقد `>=24.20.0` — النتائج محلية

### النتيجة
- **الحالة:** نجح
- **مختصر:** الواجهة الآن إنجليزية فقط بمفردات جملة موحدة ومحروسة آليًا، مع بقاء semantics المضبوطة والمصطلحات العلمية كما اعتُمدت.

### ملاحظات / مشاكل مفتوحة
- لا commit أو push أو deploy.
- فرق `audit/2026-09-09-production-ui-audit.md` الظاهر في `git diff` ليس من هذه المهمة (قرار لغة المنتج + حذف F-08 سابقًا) — تُرك كما هو.
- محتوى `Documents/UI-UX-SPECIFICATION.md` ما زال يذكر قدرة عربية/RTL (§13 و§42) و`Sign In` و`Create Task` Title Case — متروك كمصدر معتمد بلا تعديل؛ مهمة F-12 نفّذت تعليم المستخدم المباشر (إنجليزية فقط) وسُجّل التعارض هنا.
- تحقّق مصادق عليه داخل المتصفح (dashboard/lists/forms/errors/dialogs بمقاسات desktop/mobile) يحتاج fixture دخول وبيئة disposable ولم يُنفذ هنا.

### تم التنفيذ
- استبدلت حقول UUID الخام بـ selectors خادمية مصرح بها: قائمة معدات (`PERM-EQP-VIEW`) في `calibrations/new` و`maintenance/new`، وقائمة قوالب معتمدة جديدة (`PERM-LAB-CREATE` عبر `ListApprovedLabTemplatesUseCase`) في `laboratory/tests/new` — والـ UUID يبقى قيمة مخفية بعد الاختيار فقط.
- أضفت `listApprovedTemplates` لمنفذ `ControlledLabSources` وتطبيقه في Postgres (حالة APPROVED فقط، حد 200، بلا قيم علمية) مع use case يفوّض بنفس شرط الإنشاء.
- قيّدت `targetType` في `change-requests/new` بقائمة `DOCUMENT_VERSION` (المدعوم الوحيد في approvals) مع رابط سياقي لمكتبة الوثائق، و`documentType` بقيم `DOCUMENT_TYPES` عبر مفردات طبقة التطبيق (بلا استيراد domain في الصفحات).
- أبقيت أرقام الأعمال يدوية من مصدر معتمد (لا سياسة ترقيم معتمدة: DD-08/BD-13 مفتوحة — الاختراع ممنوع) مع توضيح موحد، وأثبتّ أن الـ UUIDs التقنية تُولّد خادميًا فقط (`uuidv7` في use cases).
- وحّدت Cancel/back مع `safeListHref` يمنع open-redirect (خمس صفحات)، ورتّبت Cancel قبل الإرسال في `tasks/new`، وأضفت روابط إنشاء سياقية من صفحة المعدات (`Record calibration/maintenance` مع `?equipmentId=`).
- أضفت `entity-select.ts` (خيارات/ Stale-selection/return آمن) و`tests/unit/ui/entity-select.test.ts` (14 اختبارًا: تفويض، فراغ/خطأ، كيبورد، stale، عقود الصفحات).

### الملفات المتأثرة
- `src/ui/forms/entity-select.ts` (جديد)، `src/modules/laboratory/application/list-approved-templates.ts` (جديد)
- `src/modules/documents/application/document-vocabulary.ts` + `src/modules/change-requests/application/change-target-vocabulary.ts` (جديدة)
- `src/modules/laboratory/{ports/controlled-sources, infrastructure/postgres-controlled-sources, application/dependencies}.ts`
- `src/pages/{laboratory/tests, assets/{calibrations,maintenance}, change-requests, documents, tasks, quality/findings, quarantine/receiving, assets/equipment}/new.astro` + `assets/equipment/[equipmentId].astro`
- `tests/unit/ui/entity-select.test.ts` (جديد)، `tests/unit/policy/controlled-policy-fail-closed.test.ts`، `tests/integration/concurrency/controlled-mutations.test.ts` (إضافة العضو الجديد للـ fakes)

### التحقق
- `pnpm exec astro check` ✅ — 0 errors
- `pnpm lint` ✅، و`pnpm test:architecture` ✅ (بعد نقل المفردات لطبقة التطبيق)
- `pnpm test:unit` ✅ — 41 ملفًا / 233 اختبارًا (كانت 40/212)
- `pnpm build` ✅
- دخان preview محلي: التسع صفحات ترد `503` موحد `config.invalid_environment` بلا env (نفس السلوك للمعدلة وغير المعدلة — لا كسر routes ولا 404/500 من الكود) ✅
- Node المحلي `v22.22.3` خارج عقد `>=24.20.0` — النتائج محلية

### النتيجة
- **الحالة:** نجح
- **مختصر:** حقول القالب/المعدات/الهدف صارت selectors مصرح بها أو مسارات سياقية، والتعدادات المدعومة بقوائم مضبوطة من مصادر الكود القائمة، مع Cancel/back آمنة وتغطية اختبارية — وبدون اختراع ترقيم أو سياسات علمية.

### ملاحظات / مشاكل مفتوحة
- لا commit أو push أو deploy.
- توليد أرقام الأعمال خادميًا معلّق على سياسة ترقيم معتمدة (DD-008/BD-13) — الأرقام ما زالت يدوية من مصدر معتمد.
- `priority/severity/maintenanceType/dataType` بقيت نصًا حرًا (لا مصدر مضبوط في الدومين) — التقييد يحتاج سياسة معتمدة.
- `targetId` لطلب التغيير ما زال إدخال UUID يدويًا مع رابط سياقي (لا قائمة إصدارات معتمدة عبر الدومينات) — الإثبات المصادق الكامل يحتاج DB disposable.
- ملف `ه.html` غير متتبع ومو من شغلي — تُرك كما هو.

## [2026-09-09] — إصلاح F-03: إغلاق التمدد الأفقي عند 320px و200% زوم (LTR/RTL)

### تم التنفيذ
- أزلت `min-width:320px` العام عن `html`/`body` في `global.css` واستبدلته بحراسة reflow: `min-width/min-inline-size:0` على الصفحة والحاويات، وتصفير `min-inline-size` للـ`fieldset`، وتقييد الوسائط والحقول بـ`max-inline-size:100%`، مع إبقاء التمرير الأفقي محصورًا داخل `.table-wrap`/`.table-scroll` — كلها بتوكنز التصميم القائمة وCSS منطقي فقط.
- قوّيت درج الجوال في `AppLayout.astro`: إزاحة وتموضع منطقي (`inset-inline-start` + `[dir='rtl']`)، وإخفاء `visibility` عند الإغلاق، وركن `inert` للوحة المغلقة على الجوال فقط، ونقل focus لأول رابط عند الفتح، وإبقاء Escape-to-close مع إرجاع focus للزر، ومزامنة `aria-expanded` — مع احترام `prefers-reduced-motion`.
- صلّحت `Sidebar.astro`: مؤشر العنصر النشط معكوس في RTL، وشبكة الدرج عمود واحد تحت 380px، وقص `brand-name`/`nav-label` بـellipsis بدل الدفع الأفقي.
- وحّدت المسارات الثابتة: `minmax(320px/280px,1fr)` في صفحات الإدارة صارت `minmax(min(100%,17.5rem),1fr)`، وأضفت fallback جوال (`page-head/grid/dl/actions`) لصفحات System Health والتدقيق والتنبيهات والملاحظات والنسخ الاحتياطية والمختبر والمهام والاستشارات — بما فيها `banner` قابل للالتفاف وتكديس `dl`.
- أضفت `tests/unit/ui/reflow-320.test.ts` (7 حراس ثابتين) و`tests/e2e/reflow-320.spec.ts` (22 اختبارًا: 320px و200% زوم باتجاهين للوحة المعلومات والقوائم والفورمات الطويلة والجداول وصحة النظام، مع إثبات عدم قصّ الضوابط الحرجة وسلوك الدرج).

### الملفات المتأثرة
- `src/ui/styles/global.css`، `src/ui/layouts/AppLayout.astro`، `src/ui/shell/Sidebar.astro`
- `src/pages/system/health.astro` + 11 صفحة (admin ×3، audit، notifications، findings list/new، backups/index، lab index/new، tasks/new، ai-advisory)
- `tests/unit/ui/reflow-320.test.ts` (جديد)، `tests/e2e/reflow-320.spec.ts` (جديد)

### التحقق
- RED→GREEN للحراس: مع CSS القديم يفشل اختباران، ومع الجديد 7/7 ✅
- `pnpm test:unit` ✅ — 40 ملفًا / 219 اختبارًا (كانت 39/212)
- `pnpm exec astro check` ✅ — 0 errors، و`pnpm lint` ✅، و`pnpm test:architecture` ✅، و`pnpm build` ✅
- Playwright على البناء الإنتاجي: العامة 4/4 ✅ (دخول EN/AR عند 320px و200%)، و`responsive.spec` القائم أخضر ✅، والمصادقة 18 تُتخطى gated (لا fixture ولا Docker — نفس عرف الريبو)
- دخان إنتاجي: الأسطح الخمس المستهدفة ترد `303 → /login` بلا جلسة (لا 404/500) ✅

### النتيجة
- **الحالة:** نجح جزئيًا (الكود والحراسة العامة خضراء؛ الإثبات المصادق على المتصفح يحتاج fixture)
- **مختصر:** التمدد الأفقي على مستوى الصفحة مغلق بالتوكنز القائمة مع درج ميسّر، والحراسة الآلية تمنع الانتكاس، لكن تشغيل الـ18 اختبارًا المصادق يحتاج بيئة disposable بصلاحيات مناسبة (وصحة النظام تحتاج مالك SYSTEM_OWNER).

### ملاحظات / مشاكل مفتوحة
- لا commit أو push أو deploy.
- `var(--status-success/error)` مستخدم في 5 صفحات (health/backups/admin) لكنه غير معرّف في `tokens.css` — خارج نطاق F-03 ويحتاج مهمة توكنز مستقلة.
- Node المحلي `v22.22.3` خارج عقد `>=24.20.0` — النتائج محلية.

## [2026-09-09] — إصلاح F-04 وF-05: POST baseline لكل فورمات الإنشاء التسعة

### تم التنفيذ
- أعطيت كل فورم إنشاء (`tasks/laboratory/equipment/calibrations/maintenance/change-requests/documents/findings/receiving`) مسار POST حقيقي: الفورم `method="post"` ينشر على نفس الصفحة، والـ frontmatter ينادي نفس Astro Action عبر `Astro.callAction` بنفس `actor` وإعادة التفويض الخادمية — بدون SQL أو business rules في الصفحات.
- أضفت مساعد عرض مشترك `src/ui/forms/mutation-post.ts` (نقل فقط + نسخ أخطاء آمنة، تصنيف هيكلي بلا `instanceof`) ومكوّن `FormErrorSummary.astro` (`role="alert"` + `autofocus` + رابط رجوع آمن للقائمة).
- كل فورم صار فيه: ملخص خطأ مرئي، أخطاء بجانب الحقول مع `aria-invalid`/`aria-describedby`، إدارة focus (خادميًا بالـ autofocus وJS بأول حقل غير صالح)، حالة انتظار (تعطيل الزر + `aria-busy` + `role="status"`)، قيم محفوظة بعد الفشل، واسترداد تعارض/تبعية/عدم توفر بنسخ مخصصة لكل نوع.
- النجاح يعيد توجيه `303` للسجل الجديد بالـ id فقط (مفحوص uuid) — لا حمولة أعمال في الـ URL. سكربتات JS بقيت تحسينًا اختياريًا فقط (`preventDefault` + نفس الأكشنات JSON).
- أضفت `tests/unit/ui/mutation-post.test.ts` (مساعد + عقود التسع صفحات) و`tests/e2e/create-forms-resilience.spec.ts` (فشل تحقق + نجاح إنشاء، no-JS وJS، ببيانات `E2E-…` disposable وحراسة fixture تمنع الإنتاج).
- أضفت زر Cancel/رجوع لفورم الملاحظات والمختبر (كانت بلا تنقل رجوع) كجزء من الاسترداد.

### الملفات المتأثرة
- `src/pages/{tasks, laboratory/tests, assets/{equipment,calibrations,maintenance}, change-requests, documents, quality/findings, quarantine/receiving}/new.astro`
- `src/ui/forms/mutation-post.ts` (جديد)، `src/ui/components/FormErrorSummary.astro` (جديد)
- `tests/unit/ui/mutation-post.test.ts` (جديد)، `tests/e2e/create-forms-resilience.spec.ts` (جديد)

### التحقق
- `pnpm exec astro check` ✅ — 0 errors (قبل إضافات المستخدم الأخيرة على ملفات أخرى لم تُلمس)
- `pnpm test:unit` ✅ — 39 ملفًا / 212 اختبارًا (منها 44 الجديدة)
- `pnpm test:architecture` ✅ — لا مخالفات Delivery
- `pnpm build` ✅
- دخان إنتاجي على `dist/server/entry.mjs`: التسع صفحات GET وPOST بلا جلسة ترد `303 → /login` (لا 404/500) ✅
- E2E الجديد مُدرج في Playwright (103 اختبارًا بالإجمال) لكنه gated: يُتخطى بدون `QC_E2E_LOGIN_IDENTITY/PASSWORD` ولم يُشغّل هنا (لا DB/fixture) — والمعمل يحتاج `QC_E2E_LAB_TEMPLATE_VERSION_ID` للنجاح
- Node المحلي `v22.22.3` خارج عقد `>=24.20.0` — تحذير معتاد، النتائج محلية

### النتيجة
- **الحالة:** نجح
- **مختصر:** الفورمات التسعة تعمل الآن بلا JavaScript عبر POST حقيقي مع أخطاء مرئية وقيم محفوظة واسترداد، وJS تحسين اختياري، مع تغطية unit وعقود وE2E gated.

### ملاحظات / مشاكل مفتوحة
- لا commit أو push أو deploy. ملفات المستخدم الأخرى (tasks module/index/detail/navigation/mind) لم تُلمس.
- تشغيل E2E المصادق يحتاج بيئة disposable مع fixture + DB ثم مراجعة أن السجلات `E2E-…` عُزلت.

## [2026-09-09] — إظهار صفحة Tasks وبياناتها لكل الأعضاء النشطين

### تم التنفيذ
- أزلت شرط `PERM-TASK-VIEW` من عنصر Tasks في القائمة، وصار الرابط يظهر لكل عضو مصادق عليه داخل غلاف التطبيق.
- عدّلت قراءة قائمة المهام وتفاصيل المهمة لتسمح لكل حساب `ACTIVE` بقراءة كل سجلات المهام، بما يطابق قرار الرؤية التشغيلية العامة.
- أبقيت الحسابات غير النشطة مرفوضة، وأبقيت إنشاء المهام وتغييرات الحالة مربوطة بصلاحياتها الصريحة.
- أخفيت زر **Create Task** وأزرار انتقال الحالة عن العضو الذي لا يملك صلاحية الإجراء المطلوبة.
- أضفت تحققًا وحدويًا يثبت ظهور `/tasks` حتى بدون منح إجراءات المهام.

### الملفات المتأثرة
- `src/ui/navigation/navigation.ts`
- `src/pages/tasks/index.astro`
- `src/pages/tasks/[taskId].astro`
- `src/modules/tasks/application/list.ts`
- `src/modules/tasks/application/get.ts`
- `src/modules/tasks/infrastructure/postgres-repository.ts`
- `tests/unit/ui/navigation-permissions.test.ts`
- `tests/unit/ui/master-016.test.ts`
- `.agents/mind/01-mind-latest.md`

### التحقق
- اختبارات التنقل والغلاف ومصفوفة صلاحيات المهام: **18/18 نجحت** ✅
- ESLint للملفات TypeScript المتأثرة: بلا أخطاء ✅؛ ملفات Astro ظهرت كـignored حسب إعداد ESLint الحالي.
- `git diff --check` ✅
- `pnpm typecheck` جزئي: خطأ المهمة الذي ظهر أولًا تم إصلاحه؛ بقي خطأ غير متعلق بالمهمة في `src/pages/assets/maintenance/new.astro` بسبب مسار استيراد `FormErrorSummary.astro` غير موجود.

### النتيجة
- **الحالة:** نجح
- **مختصر:** صفحة Tasks وبياناتها صارت ظاهرة لكل الأعضاء النشطين، بينما الإنشاء والتعديل وتغييرات الحالة ما زالت محكومة بالصلاحيات.

## [2026-09-09] — تنفيذ F-02: مساحة Administration المضبوطة (/admin × 8 مسارات)

### تم التنفيذ
- بنيت صفحات `/admin` الثمانية حسب Route Manifest (§68–72): index/users/users-new/user-detail/roles/role-detail/permissions/scopes، كلها server-rendered بلا SQL أو business rules، وتستدعي use cases عبر `*Dependencies()` فقط.
- أضفت حارس `canAccessAdminRoute` (default deny: ACTIVE + منح صريح، الدور وحده لا يكفي) ومجموعة تنقل Administration بصلاحيات canonical فقط.
- أضفت use cases قراءة جديدة بنفس عقد التفويض القائم: `ListUsers`/`GetUser` (إسقاط hash دائمًا)، `ListUserScopes`، `ListRolePermissions`، مع `listUsers`/`listRolePermissions` في المنافذ وتطبيقات Postgres.
- وسّعت `actions/admin` بأربع mutations تعيد استخدام use cases الهوية مع audit: create/update/disable/reset (تعطيل/تصفير يبطل كل الجلسات، وحظر ذاتي عبر SoD/businessCondition، ونسخة مطلوبة لكل كتابة).
- أصلحت تسريبًا محتملًا: `updateUser` كان يرجع `passwordHash` كاملًا — الـ action الآن يرد `SafeUserView` فقط.

### الملفات المتأثرة
- `src/pages/admin/**` (8 صفحات جديدة)، `src/ui/navigation/navigation.ts`
- `src/shared/authorization/admin-workspace.ts` (جديد)
- `src/modules/identity/application/{safe-user-view,list-users,get-user,admin-dependencies}.ts` + منفذ/تطبيق `listUsers`
- `src/modules/administration/application/{list-user-scopes,list-role-permissions}.ts` + منفذ/تطبيق `listRolePermissions` + `dependencies.ts`
- `src/actions/admin.ts` (4 actions جديدة)
- `tests/unit/admin/{admin-workspace-guard,identity-admin,administration-read}.test.ts` + `tests/unit/ui/navigation-admin.test.ts` (جديدة)
- `tests/unit/identity/session-service.test.ts` و`tests/integration/identity/account.test.ts` (إضافة `listUsers` للـ fakes فقط)

### التحقق
- `pnpm typecheck` ✅ — 0 errors على Node `v24.20.0` داخل العقد
- `pnpm lint` ✅ و`pnpm test:architecture` ✅ (صفر مخالفات Delivery)
- `pnpm test:unit` ✅ — 38 ملفًا / 167 اختبارًا (كانت 34/139: +4 ملفات/+28 اختبارًا)
- `prettier --check` ✅ و`git diff --check` ✅ و`pnpm build` ✅
- دخان إنتاجي على `dist/server/entry.mjs` بدون `DATABASE_URL`: المسارات الستة الثابتة ترد `303 → /login?returnTo=...` (لا 404/500 للمجهول) ✅
- اختبارات التكامل المعتمدة على PostgreSQL/Vitest-container لم تُشغّل: لا Docker runtime محليًا (خارج النطاق).

### النتيجة
- **الحالة:** نجح
- **مختصر:** مساحة الإدارة الثمانية تعمل بإنكار افتراضي ومنح صريح، مع رفض Admin-بلا-صلاحية وظهور SYSTEM_OWNER مثبتًا بالاختبارات، وكل الكتابات مدققة ومبنية على النسخة مع إبطال الجلسات.

### ملاحظات / مشاكل مفتوحة
- لا commit أو push أو deploy.
- سلوك المصادق عليه (granted/denied panels) مغطى على مستوى use-case والحارس والتنقل؛ إثبات runtime حي بحساب حقيقي يحتاج بيئة PostgreSQL ولم يُنفذ هنا.

## [2026-09-09] — إصلاح F-01: توحيد فحص جاهزية قاعدة البيانات بين System Health وready

### تم التنفيذ
- أنشأت فحصًا معياريًا واحدًا `checkCanonicalDatabaseReadiness` يستخدم نفس إعداد TLS المعتمد (`getDatabaseConnectionConfig`: رفض `sslmode=disable`، حفظ `sslmode` المزود، و`rejectUnauthorized: true` عند غيابه).
- وصّلت `PostgresReadinessProbe` (مسار `/api/health/ready`) و`PostgresSystemHealthProbes.database` (صفحة `/system/health`) على نفس الفحص ونفس مصدر `DATABASE_URL` عبر `resolveCanonicalDatabaseUrl`، مع إبقاء المخرجات منقّحة (boolean → حالات ثابتة فقط).
- أضفت اختبار unit للاتفاق (صحي/غير متاح/3 أخطاء إعدادية + حفظ TLS) واختبار integration يمرر `readinessDependencies` الحقيقية و`GetSystemHealthUseCase` مع `PostgresSystemHealthProbes` الحقيقية لنفس النتائج الثلاث مع إثبات عدم تسريب أسرار/مضيفين.
- لم أضعف TLS ولم أكشف تفاصيل اتصال؛ حالات الخطأ تنهار إلى `false`/`UNAVAILABLE`/`503` بدون نص استثناء.

### الملفات المتأثرة
- `src/shared/health/canonical-database-readiness.ts` (جديد)
- `src/shared/health/postgres-readiness-probe.ts`
- `src/modules/system-health/infrastructure/postgres-health-probes.ts`
- `tests/unit/health/canonical-readiness-agreement.test.ts` (جديد)
- `tests/integration/health/health-agreement.test.ts` (جديد)

### التحقق
- `pnpm typecheck` ✅ — 0 errors (26 hints سابقة)
- `pnpm lint` ✅
- `pnpm test:unit` ✅ — 34 ملفًا / 139 اختبارًا
- `pnpm vitest` للصحة (unit+integration+system+http) ✅ — 6 ملفات / 32 اختبارًا
- `pnpm test:architecture` ✅ — لا مخالفات Delivery
- `prettier --check` للملفات الملموسة ✅ و`git diff --check` ✅
- `pnpm build` ✅
- دخان إنتاجي على `dist/server/entry.mjs`: بدون `DATABASE_URL` (live 200 / ready 503) ومع `DATABASE_URL` غير قابل للوصول (ready 503 منقّح + security headers + x-request-id، وlive 200) ✅
- Node `v24.20.0` داخل العقد؛ Docker غير متاح لذا اختبارات الحاويات خارج النطاق ولم تُشغّل.

### النتيجة
- **الحالة:** نجح
- **مختصر:** الواجهتان تستهلكان الآن نفس فحص الجاهزية وإعداد TLS، وتتفقان في الحالات الثلاث مع مخرجات منقّحة مثبتة بالاختبارات والدخان الإنتاجي.

### ملاحظات / مشاكل مفتوحة
- لا commit أو push أو deploy.
- بقية مشاكل التدقيق (F-02 حتى F-12) خارج نطاق هذه المهمة ولم تُلمس.

## [2026-09-09] — توسيع وصول Administration لـAdmin وyazeed

### تم التنفيذ
- عدّلت قرار F-02 بحيث تكون مساحات `/admin/*` متاحة لدور `Admin` وللحساب `yazeed` بصلاحيات صريحة.
- أبقيت `/system/health` حصرية على `SYSTEM_OWNER` المرتبط بـ`yazeed`.
- حدّثت مصفوفات الصلاحيات والأدوار وثوابت النظام وبيان المسارات ومواصفات الواجهة وقرار الرؤية.
- حدّثت صياغة F-02 في تقرير التدقيق لتوضح الجهات المصرح لها وزر **Create user**.

### الملفات المتأثرة
- `audit/2026-09-09-production-ui-audit.md`
- `Documents/AUTHORIZATION-VISIBILITY-DECISION.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/ROLE-MATRIX.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/SYSTEM-INVARIANTS.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `rg` لمراجعة العبارات المتعارضة حول Admin و`yazeed` ✅
- `git diff --check` ✅
- لم تُشغّل اختبارات التطبيق أو build لأن التغيير توثيقي فقط.

### النتيجة
- **الحالة:** نجح
- **مختصر:** Admin و`yazeed` صاروا مخولين لمساحة Administration، وصحة النظام بقيت مقصورة على `yazeed`.

## [2026-09-09] — تعريب تقرير تدقيق واجهة الإنتاج

### تم التنفيذ
- عرّبت متن تقرير تدقيق واجهة الإنتاج وتدفقات العمل إلى العربية الواضحة، بما يشمل النطاق والأدلة والنتائج والمشاكل والحلول وترتيب التنفيذ والحكم النهائي.
- أبقيت عناوين ونصوص البرومبتات التنفيذية الثمانية بالإنجليزي كما طلب المستخدم.
- حافظت على المعرّفات التقنية والمسارات ونِسَب التدقيق والأكواد التشغيلية دون تغيير.

### الملفات المتأثرة
- `audit/2026-09-09-production-ui-audit.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- فحص يدوي لعناوين البرومبتات ونصوصها ✅
- `git diff --check` ✅
- لم تُشغّل اختبارات التطبيق أو build لأن التغيير توثيقي فقط ✅

### النتيجة
- **الحالة:** نجح
- **مختصر:** التقرير الآن بالعربي مع إبقاء البرومبتات التنفيذية بالإنجليزي.

## [2026-09-09] — اعتماد القراءة العامة وحصرية صحة النظام وإدارة الأعضاء

### تم التنفيذ
- اعتمدت قرارًا رسميًا بأن كل حساب `ACTIVE` ومصادق عليه يشوف كل صفحات التشغيل العادية ويقرأ كل السجلات التشغيلية على مستوى النظام.
- فصلت القراءة العامة عن صلاحيات الأفعال؛ الإنشاء والتعديل والمراجعة والاعتماد والإفراج والتوقيع والإلغاء والاستعادة تبقى خاضعة للـpermission/state/scope/SoD/version/business rules.
- حصرت `/system/health` و`/admin` وكل إدارة الأعضاء والأدوار والصلاحيات والنطاقات في `SYSTEM_OWNER` المرتبط بحساب `yazeed`؛ Foundation Admin العادي لا يكفي.
- استثنيت كلمات المرور والـhashes والجلسات والأسرار وبيانات أمن الهوية والتشخيصات الخام من القراءة العامة.
- حدّثت Permission Matrix وRole Matrix وUI/UX وRoute Manifest وSystem Invariants، وأضافت وثيقة قرار مستقلة مع سياق وبدائل وأثر وعقد تحقق.

### الملفات المتأثرة
- `Documents/AUTHORIZATION-VISIBILITY-DECISION.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/ROLE-MATRIX.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/SYSTEM-INVARIANTS.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- فحص اتساق عبارات universal operational read وSYSTEM_OWNER exclusivity عبر الوثائق ✅
- `git diff --check` ✅
- لم تُشغّل اختبارات التطبيق أو build لأن المهمة توثيق قرار فقط ولم يتغير runtime أو seed.

### النتيجة
- **الحالة:** نجح توثيقيًا.
- **مختصر:** أصبحت سياسة الوثائق واضحة: قراءة تشغيلية عامة لكل الأعضاء، مع بقاء الأفعال الحساسة مفوضة، وحصرية صحة النظام وإدارة الأعضاء لـ`yazeed`.

### ملاحظات / مشاكل مفتوحة
- التطبيق والـFoundation seed ما زالا يحتاجان مهمة تنفيذ منفصلة لتطبيق السياسة؛ هذه المهمة لم تغيّر الصلاحيات الفعلية في runtime أو الإنتاج.
- لا commit أو push أو deploy.

## [2026-09-09] — تدقيق إنتاجي شامل للواجهة والتدفقات بحساب yazeed

### تم التنفيذ
- دخلت إلى `qclevel.top` بحساب `yazeed` وراجعت 25/25 من وجهات القائمة الظاهرة و9/9 من مسارات الإنشاء المتاحة بدون إنشاء أو تعديل أي سجل إنتاجي.
- قارنت الواجهة الحية مع Route Manifest والواقع الحالي للصفحات، وثبت غياب مساحة Administration ومسار/زر إنشاء المستخدم رغم صلاحيات SYSTEM_OWNER.
- رصدت 12 فجوة مرتبة: 5 عالية، 6 متوسطة، و1 منخفضة؛ أبرزها تناقض System Health مع readiness الحية، الاعتماد الكامل على JavaScript في عدة نماذج إنشاء، رسائل أخطاء غير قابلة للاسترجاع، وتمدد أفقي على 320px.
- تحققت أن `/api/health/live` و`/api/health/ready` يرجعان HTTP 200 و`healthy` بينما صفحة `/system/health` تعرض database UNAVAILABLE وCore NOT READY؛ السبب المرجح من الكود أن UI probe ينشئ `pg.Client` مستقلًا عن إعداد probe canonical/TLS.
- كتبت تقريرًا كاملًا بدرجة موزونة 68% وحكم BLOCK، مع تغطية أزرار الإنشاء، الحلول، ترتيب التنفيذ، وثمانية برومبتات تنفيذية.

### الملفات المتأثرة
- `audit/2026-09-09-production-ui-audit.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- تسجيل الدخول الإنتاجي والوصول إلى Dashboard ✅
- فتح 25/25 وجهة قائمة و9/9 صفحات إنشاء ظاهرة ✅
- فحص 320px لخمس صفحات ممثلة ❌ — page-level horizontal overflow مرصود.
- قياس contrast لعينة نصوص Dashboard ✅ — لا زوج نص عادي أقل من 4.5:1 في العينة.
- `curl` لـlive/readiness ✅ — الاثنان HTTP 200 و`healthy`.
- `git diff --check` ✅
- لم تُشغّل application tests/build لأن المهمة تدقيق قراءة فقط وتغييرها توثيقي؛ لم يتغير كود التطبيق.

### النتيجة
- **الحالة:** نجح التدقيق، والمنتج محجوب تشغيليًا حسب نتيجة التدقيق.
- **مختصر:** الوصول الأساسي قوي، لكن النتيجة الإجمالية 68% مع خمس مشكلات عالية تمنع اعتماد الواجهة كتجربة تشغيلية مكتملة.

### ملاحظات / مشاكل مفتوحة
- لم تُفحص workspaces الديناميكية للتفاصيل/review/execute/restore لعدم وجود سجلات إنتاجية أو backup sets، ولم تُنفذ أي controlled mutation.
- لا commit أو push أو deploy.

## [2026-09-09] — تفعيل SYSTEM_OWNER لحساب yazeed على إنتاج Render

### تم التنفيذ
- تحققت من أن الإصدار `507d670` الذي يحتوي أمر `access:grant-system-owner` منشور حيًا على Render.
- بسبب عدم توفر Shell في خطة Render المجانية، عدلت Start Command إلى تشغيل منح `SYSTEM_OWNER` لحساب `yazeed` قبل تشغيل Astro؛ استخدمت فصلًا يحافظ على تشغيل الخدمة إذا تعذر المنح في إقلاع لاحق.
- وافق المستخدم مباشرة قبل حفظ تغيير إعداد الإنتاج، وحفظ Render الإعداد وبدأ deploy بسبب `Start command updated`.
- ثبت نجاح المنح من التطبيق الحي بظهور حدث `GRANT_SYSTEM_OWNER_ACCESS` وسبب `User-approved exclusive full-system access` في Recent Activity.
- تحققت من ظهور كل مجموعات القائمة وفتحت فعليًا Quarantine Administration وLaboratory Tests وQuality Findings وAssets Equipment؛ الصفحات لم تعرض منع صلاحية وظهرت روابط الإنشاء في Lab وEquipment.

### الملفات المتأثرة
- `.agents/mind/01-mind-latest.md`
- إعداد Render الخارجي: Start Command لخدمة `QC-Operations-Laboratory-Management-System`.

### التحقق
- Render deploy `dep-dag84aek1f9s738dmfag` بدأ على commit `507d670` بسبب تحديث Start Command ✅
- Dashboard الإنتاجي أظهر مجموعات Overview/Work/Quality/Quarantine/Laboratory/Assets/Governance/Insights/System ✅
- حدث التدقيق `GRANT_SYSTEM_OWNER_ACCESS` ظاهر في Dashboard ✅
- `/quarantine/admin` ✅، `/laboratory/tests` ✅، `/quality/findings` ✅، `/assets/equipment` ✅

### النتيجة
- **الحالة:** نجح.
- **مختصر:** حساب yazeed يملك الآن `SYSTEM_OWNER` وكل الصلاحيات النشطة بنطاق GLOBAL، والصفحات الأربع التي كانت مفقودة أصبحت ظاهرة وقابلة للفتح على الإنتاج.

### ملاحظات / مشاكل مفتوحة
- Start Command سيعيد محاولة المنح idempotently عند كل تشغيل ثم يبدأ السيرفر؛ فشل محاولة مستقبلية لا يمنع تشغيل الموقع.
- لم أنفذ commit أو push محليًا في هذه المهمة.

## [2026-09-09] — استثناء yazeed كمالك نظام بصلاحيات كاملة

### تم التنفيذ
- أضفت أمرًا تشغيليًا idempotent ينشئ دورًا غير نظامي وحصريًا باسم `SYSTEM_OWNER`، ويمنحه كل permissions النشطة ثم يربطه بالحساب المحدد عبر `SYSTEM_OWNER_LOGIN_IDENTITY` مع نطاق `GLOBAL`.
- جعلت الأمر يرفض تعيين الدور لحساب ثانٍ إذا كان له مالك نشط، ويتحقق من وجود الحساب وأن حالته `ACTIVE`، ويسجل المنح في `audit_events` مع عدد الصلاحيات المضافة.
- أبقيت قرار الصلاحية المركزي وفحوصات الحالة/الإصدار/SoD فعالة؛ الاستثناء يمنح كل permissions والصفحات لكنه لا يغير التاريخ ولا يسمح بتجاوز state machine أو اعتماد المستخدم لسجله عند منع ذلك.
- عدلت فحص Foundation حتى يسمح بأدوار مخصصة غير نظامية بدون اعتبار grants الخاصة بها drift في الأدوار النظامية الأربعة.
- أضفت AI Advisory وQuarantine Administration للقائمة، واختبارًا يثبت أن مجموعة كل permissions تعرض كل روابط التنقل المنفذة.

### الملفات المتأثرة
- `scripts/access/grant-system-owner.ts`
- `package.json`
- `scripts/db/load-local-env.ts`
- `db/seeds/common.ts`
- `src/ui/navigation/navigation.ts`
- `tests/unit/access/grant-system-owner.test.ts`
- `tests/integration/identity/system-owner-access.test.ts`
- `tests/unit/ui/navigation-permissions.test.ts`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm typecheck` ✅ — 0 errors، 26 hints سابقة.
- `pnpm lint` ✅
- `pnpm format:check` ✅
- `pnpm test:unit` ✅ — 33 ملفًا / 133 اختبارًا.
- `pnpm build` ✅ — تحذيرات bundle السابقة فقط.
- اختبار PostgreSQL للاستثناء أُضيف لكنه لم يعمل محليًا: Testcontainers محجوب لعدم وجود container runtime؛ حالتا الاختبار skipped بعد فشل setup.
- `git diff --check` ✅

### النتيجة
- **الحالة:** نجح محليًا للكود والاختبارات غير المعتمدة على DB؛ تفعيل الإنتاج معلق.
- **مختصر:** أصبح هناك مسار صريح وحصري يمنح yazeed كل permissions والصفحات عبر `SYSTEM_OWNER`. يلزم نشر النسخة ثم تشغيل الأمر على قاعدة الإنتاج حتى يصبح الحساب فعليًا كامل الصلاحيات.

### ملاحظات / مشاكل مفتوحة
- لم يُنفذ الأمر على قاعدة الإنتاج، ولا deploy أو commit أو push.
- التحقق التكاملي الفعلي للـSQL يحتاج PostgreSQL 18 disposable أو بيئة اختبار مع `QC_TEST_DATABASE_URL` قبل ادعاء نجاح runtime الكامل.
