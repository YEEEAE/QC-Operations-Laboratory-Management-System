# QC Operations & Laboratory Management System — Project Mind

## [2026-09-04] — MASTER-015: Design tokens, layouts, UI primitives, and QC forms

### تم التنفيذ
- أُنشئت طبقة tokens الداكنة المعتمدة حرفيًا للألوان، الحالات، الخطوط، المسافات، الحواف، الظلال، الحركة، والـdensity.
- أُضيفت typography privacy-safe محلية فقط عبر font stacks لـInter وIBM Plex Sans Arabic بدون CDN أو طلبات خارجية، مع أساس RTL/LTR يعتمد على `lang` و`dir` من layout props.
- أُنشئت Base/Auth/App layouts؛ AppLayout يركّب slots للـsidebar والـtopbar والمحتوى، ويضيف skip link بدون DB أو business logic.
- أُنشئت primitives قابلة لإعادة الاستخدام: Button وIconButton وBadge وCard وDivider وTooltip وStatusBadge وStateBanner، مع focus-visible وloading وcontrolled-action semantics.
- أُنشئت نماذج طويلة لـFormField وTextInput وTextArea وSelect وCheckbox وDateInput وNumberInput وErrorSummary وFormActions، مع labels ظاهرة، required indication، ARIA descriptions/errors، وعدم اختراع precision أو rounding.
- فُصل `PASS` بصريًا عن `RELEASED`، وفُصل `Save Draft` عن controlled action؛ الواجهات لا تنفذ authorization ولا تتعامل مع state كحقيقة موثوقة من العميل.

### الملفات المتأثرة
- `src/ui/styles/{tokens,global,motion,density}.css`
- `src/ui/layouts/{BaseLayout,AuthLayout,AppLayout}.astro`
- `src/ui/components/{Button,IconButton,Badge,Card,Divider,Tooltip,StatusBadge,StateBanner}.astro`
- `src/ui/components/forms/`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `git diff --check` ✅
- `node scripts/architecture/check-boundaries.mjs` ✅
- approved-token static contract: `24` مسار مطلوب موجود، وفحوص القيم المعتمدة ✅
- UI forbidden-pattern scan (DB/SQL/Auth/debug/secrets) ✅
- `pnpm build` ⚠️ محجوب: `astro` غير موجود في `node_modules`، والبيئة Node 22 بدل Node 24.20+
- typecheck/lint/runtime browser accessibility: لم تُشغّل بسبب الاعتمادات الناقصة؛ تحتاج بيئة المشروع المعتمدة.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** نطاق MASTER-015 مكتوب محليًا مع tokens وlayouts وprimitives وforms وحدود UI صحيحة؛ إثبات Astro build/typecheck وbrowser accessibility ينتظر استعادة الاعتمادات وNode المعتمد.

### ملاحظات / مشاكل مفتوحة
- يوجد تعديل سابق غير مرتبط في `IMPLEMENTATION-MASTER-PLAN-MERGED.md` وتم الحفاظ عليه كما هو.
- لا توجد بيانات علمية أو صلاحيات approval/release أو سياسات precision/rounding جديدة في هذا النطاق.

## [2026-09-04] — MASTER-014: Authorization administration repository, use cases, scopes, and Actions

### تم التنفيذ
- أُنشئت واجهة `AuthorizationRepository` وPostgreSQL implementation لقراءة الأدوار والصلاحيات، وتحديث grants الخاصة بالدور، وإدارة user scopes.
- أُضيفت migration `0016_authorization_scopes.sql` لتخزين scopes الصريحة؛ الإلغاء يحفظ التاريخ ولا يحذف assignment السابق.
- أُنشئت use cases لعرض الأدوار، عرض role، عرض permissions، تحديث role permissions، وإدارة user scopes مع authorization server-side ورفض self-grant.
- أُضيفت سياسات `PERM-ADM-*` إلى policy registry وأُضيفت Astro Actions رفيعة مربوطة بالـuse cases، بدون actor/target-state موثوق من العميل.
- تحديث role permissions يتم بمعاملة واحدة تشمل version check وgrant replacement وaudit؛ Actions تنشئ audit repository PostgreSQL لضمان atomicity مع mutation.
- أُضيفت اختبارات مركزة لـAdmin بدون permission، stale version، self-scope grant، canonical permission، cross-scope isolation، وعقود admin policies.

### الملفات المتأثرة
- `db/migrations/0016_authorization_scopes.sql`
- `src/modules/administration/{ports, infrastructure, application}/`
- `src/actions/{admin,index}.ts`
- `src/shared/{authorization/policy-registry,database/db-types}.ts`
- `tests/integration/{administration,actions/admin-actions.test.ts}`
- `tests/integration/database/migrations.test.ts`
- `tests/integration/database/upgrade-path.test.ts`

### التحقق
- `node scripts/architecture/check-boundaries.mjs` ✅
- `git diff --check` ✅
- forbidden-pattern scan للصلاحيات الوهمية وraw SQL في Delivery و`ON DELETE CASCADE` ✅
- `pnpm lint` ⚠️ محجوب: `eslint` غير موجود في `node_modules`، مع Node 22 بدل Node 24.20+
- Vitest tests ⚠️ محجوبة: executable `vitest` غير موجود في `node_modules`.
- PostgreSQL integration/atomicity الفعلية ⚠️ لم تُشغّل؛ تحتاج الاعتمادات وcontainer runtime.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** نطاق MASTER-014 مكتوب محليًا مع حدود authorization وDelivery صحيحة، لكن لا يوجد إثبات runtime للـTypeScript/Vitest/PostgreSQL بسبب بيئة الاعتمادات الحالية.

### ملاحظات / مشاكل مفتوحة
- يلزم تشغيل `pnpm install --frozen-lockfile` على Node 24.20+ ثم تشغيل lint وVitest وPostgreSQL integration.
- migration `0016` إضافة لازمة لأن repository الحالي لم يكن يملك storage رسميًا لـuser scopes.

## [2026-09-04] — MASTER-013: Account/admin-user use cases + Actions + login/account pages + middleware

### تم التنفيذ
- أُضيفت use cases لقراءة الحساب وتغيير كلمة المرور وإنشاء/تحديث/تعطيل المستخدم وAdministrative Password Reset، مع authorization server-side وصلاحيات الهوية الرسمية فقط.
- تغيير كلمة المرور وAdministrative Reset وتعطيل الحساب تتحقق من current password/expected version حيث يلزم، وتبطل الجلسات في المسارات الأمنية المطلوبة؛ recovery/reset pages العامة لم تُنشأ.
- أُضيفت Astro Actions رفيعة لـlogin/logout/change-password، مع `safeReturnTo`، cookies HttpOnly/SameSite، وتحويل الأخطاء إلى رسائل آمنة.
- أُضيفت صفحات SSR لـ`/login` و`/account` بعناوين labels، password autocomplete، error alert، وPOST-only logout.
- عُدّل middleware لإنشاء request context، وحل opaque session من الخادم، وتعبئة `Astro.locals.user/actor`، وحماية المسارات المحمية مع redirect محلي إلى login.
- أُضيفت اختبارات مركزة للحساب/session، منع Admin role bypass، safe returnTo، وعقد middleware/actions.

### الملفات المتأثرة
- `src/modules/identity/application/{get-account,change-password,create-user,update-user,disable-user,admin-reset-password,identity-dependencies}.ts`
- `src/modules/identity/{ports/user-repository,infrastructure/postgres-user-repository}.ts`
- `src/actions/{index,auth,account}.ts`
- `src/pages/{login,account}.astro`
- `src/middleware.ts`, `src/env.d.ts`, `src/shared/authorization/policy-registry.ts`, `src/shared/database/db-types.ts`
- `tests/integration/{identity,actions,http}`

### التحقق
- `node scripts/architecture/check-boundaries.mjs` ✅
- `git diff --check` ✅
- فحص عدم وجود recovery/reset pages ✅
- فحص عدم وجود raw SQL/Kysely imports داخل Delivery ✅
- `pnpm exec tsc --noEmit` ⚠️ البيئة ناقصة `node_modules` وأظهرت أخطاء dependencies/foundation؛ لم يظهر خطأ syntax في الملفات الجديدة بعد إصلاح الإغلاق.
- `pnpm lint` ⚠️ محجوب: `eslint` غير موجود لأن `node_modules` غير مكتملة.
- Vitest/Playwright/Build ⚠️ لم تُشغّل لنفس سبب نقص الاعتمادات؛ PostgreSQL/Testcontainers غير متاحين.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** تم تنفيذ نطاق MASTER-013 محليًا مع حدود Delivery صحيحة وفحوص static، لكن لا يمكن اعتبار runtime أو PostgreSQL أو Playwright متحققًا حتى تُستعاد الاعتمادات وبيئة Node المعتمدة.

### ملاحظات / مشاكل مفتوحة
- يلزم تشغيل `pnpm install --frozen-lockfile` في بيئة شبكة/Node 24.20+، ثم تشغيل Vitest وPlaywright وAstro build.
- يلزم مراجعة/تشغيل transaction integration الفعلية لتعريف إثبات atomicity بين mutation وsession invalidation وaudit على PostgreSQL.
- ملف `IMPLEMENTATION-MASTER-PLAN-MERGED.md` فيه تعديل سابق غير مرتبط بالمهمة، وتم تركه كما هو.

## [2026-09-04] — MASTER-012: Identity domain + password/session authentication (جزئي)

### تم التنفيذ
- أُنشئت كيانات domain مستقلة لـUser/AccountState/Session بدون imports من PostgreSQL أو Kysely.
- أُنشئت ports وPostgreSQL repositories لقراءة المستخدم والجلسة، إنشاء الجلسات، وتكرار revoke بشكل idempotent عبر predicates server-side.
- أُنشئت SessionService بجلسات opaque عشوائية 256-bit، تخزين SHA-256 فقط، وفحص ACTIVE/expiry/revocation من الخادم.
- أُنشئت Login/Logout/Resolve-session use cases؛ login لا يفرق للمستخدم بين unknown/wrong-password/disabled، وlogout يرجع cookie حذف idempotent.
- أُنشئ Argon2id adapter بمعايير Security Architecture (memory 19 MiB، iterations 2، parallelism 1) ويفشل بإعداد آمن إذا الاعتمادية غير مثبتة.
- أُضيفت اختبارات domain أولية واختبار configuration guard للـArgon2.

### الملفات المتأثرة
- `src/modules/identity/domain/`
- `src/modules/identity/ports/`
- `src/modules/identity/infrastructure/`
- `src/modules/identity/security/`
- `src/modules/identity/application/`
- `src/shared/errors/error-codes.ts`
- `tests/unit/identity/`

### التحقق
- `git diff --check` ✅
- `pnpm exec tsc --noEmit` ⚠️ محجوب بعد محاولة pnpm لإعادة بناء `node_modules`؛ lockfile لم يتغير، لكن البيئة الحالية Node 22 بدل Node 24.20+ ولا توجد شبكة/اعتمادية Argon2.
- اختبارات Vitest وreal PostgreSQL repository/session integration: لم تُشغّل لأن `node_modules` غير مكتمل وTestcontainers يحتاج runtime.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** طبقات الهوية الأساسية مكتوبة، لكن لا يوجد إثبات تشغيلي للاختبارات/PG، ولا يمكن اعتماد password hashing فعلي حتى تتوفر حزمة Argon2id في بيئة Node المعتمدة.

### ملاحظات / مشاكل مفتوحة
- يلزم تثبيت `argon2` وتحديث lockfile عبر بيئة شبكة/حزمة معتمدة قبل تشغيل password tests.
- لم تُضف Delivery actions/pages أو password-reset completion؛ خارج الملفات المطلوبة في هذا الـprompt.

## [2026-09-04] — MASTER-010: Notifications + Files/Evidence + Object Storage + Search

### تم التنفيذ
- أُنشئت notification capability بعقد domain/repository/service وPostgreSQL repository؛ القراءة محصورة بالمستلم، وmark-read يمرر recipient داخل UPDATE ويعيد نفس الحالة عند replay.
- أُضيفت سياسات authorization صريحة لـ`PERM-NOT-VIEW-OWN` و`PERM-NOT-MARK-READ` بدون Admin bypass أو provider خارجي.
- أُنشئت files/evidence capability مع metadata repository، ربط evidence تاريخيًا بدون حذف، SHA-256 للـbytes الفعلية، وFileService يفوض قبل upload/download ويتحقق من hash عند التحميل.
- أُنشئ ObjectStore abstraction مع LocalObjectStore للاختبار/التطوير فقط ومنع traversal، وS3-compatible adapter يفرض `acl: private` بدون اختراع provider أو credentials.
- أُنشئت SearchResult/SearchService/PostgresSearch للكيانات المعتمدة فقط؛ q محدود إلى 200 حرفًا، limit محدود إلى 100، والاستعلامات parameterized وتضع actor predicates داخل SQL.
- أُضيفت اختبارات العزل بين المستخدمين، mark-read replay، hash mismatch، unauthorized access، path traversal، local roundtrip، private S3 contract، query limits وSQL-injection input.

### الملفات المتأثرة
- `src/shared/notifications/{notification,notification-repository,postgres-notification-repository,notification-service}.ts`
- `src/shared/files/{file-record,file-repository,postgres-file-repository,object-store,local-object-store,s3-object-store,sha256,file-service}.ts`
- `src/shared/search/{search-result,search-service,postgres-search}.ts`
- `src/shared/authorization/policy-registry.ts`
- `src/shared/database/db-types.ts`
- `tests/integration/shared/{notifications,files,object-store,search}.test.ts`

### التحقق
- اختبارات مركزة MASTER-010: `4 files / 7 tests` ✅
- `pnpm test:unit`: `8 files / 21 tests` ✅
- `pnpm lint` ✅
- `pnpm build` ✅
- `node scripts/architecture/check-boundaries.mjs` ✅
- `git diff --check` ✅
- `pnpm test:integration`: ⚠️ 5 PostgreSQL suites محجوبة لأن Testcontainers لم يجد container runtime؛ 8 suites غير PostgreSQL مرّت و14 اختبارًا PostgreSQL تخطّت.
- `pnpm format:check`: ⚠️ ملف سابق خارج النطاق `db/seeds/common.ts` غير منسق؛ ملفات MASTER-010 منسقة.
- `pnpm exec tsc --noEmit`: ⚠️ أخطاء foundation/dependency في Astro وNode 22، مع تصفية أخطاء ملفات MASTER-010 وعدم ظهور أخطاء TypeScript جديدة فيها.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** capability layers والاختبارات المحلية وbuild/lint مكتملة، لكن إثبات PostgreSQL 18 الفعلي وS3 disposable service محجوبان؛ لا يوجد claim بجاهزية الإنتاج.

### ملاحظات / مشاكل مفتوحة
- نموذج scope assignments غير معتمد في المواصفات؛ Search يطبق server-side ownership/assignee predicates الحالية فقط، وتحتاج scopes الأوسع read model/policy معتمدة قبل إضافتها.
- لا توجد retention/MIME-size policy أو external email/SMS provider أو backup credential authority جديدة.

## [2026-09-04] — MASTER-009: concurrency + central authorization + SoD + audit + outbox

### تم التنفيذ
- أُضيفت optimistic-concurrency primitives في `src/shared/concurrency/version.ts` لرفض النسخة القديمة بـ`CONFLICT_STALE_VERSION` واحتساب النسخة التالية.
- أُضيفت idempotency service/repositories مع fingerprint SHA-256، replay بدون إعادة mutation، ورفض إعادة استخدام المفتاح مع command مختلف؛ وأُضيفت migration `0015` وجدول durable idempotency.
- أُنشئت authorization layer مركزية تجمع actor/account state/explicit permission/entity/state/scope/ownership/SoD/version/business condition، مع default-deny وبدون role hierarchy أو Admin bypass؛ أكواد permissions من canonical seed.
- أُنشئت SoD default تمنع self-review/self-approval/self-release/self-sign، مع policy registry لا يسمح إلا بسياسة معرفة صراحة.
- أُنشئت audit service/repository append-only contract مع حقول actor/action/reason/correlation ورفض payload keys الحساسة؛ وأُنشئت outbox enqueue/claim/processed/retry وworker بمعاملة claim و`SKIP LOCKED`.
- أُضيفت اختبارات authorization/SoD/idempotency/audit/outbox، وتحديث اختبارات migration لتتوقع 15 migration.

### الملفات المتأثرة
- `src/shared/{concurrency,authorization,idempotency,audit,outbox}/`
- `src/shared/database/db-types.ts`
- `db/migrations/0015_idempotency_records.sql`
- `scripts/workers/outbox.ts`
- `tests/unit/shared/{authorization-types,authorize,sod}.test.ts`
- `tests/integration/shared/{idempotency,audit,outbox}.test.ts`
- `tests/integration/database/{migrations,upgrade-path}.test.ts`

### التحقق
- `pnpm exec vitest run ...` للـauthorization/SoD/shared integration: 6 files / 12 tests ✅
- `pnpm test:unit`: 8 files / 21 tests ✅
- `pnpm exec tsc --noEmit`: ✅ على Node 22 مع تحذير engine؛ المشروع يطلب Node 24.20+
- `pnpm lint` ✅
- `pnpm build` ✅
- Prettier للملفات المتأثرة + `node scripts/architecture/check-boundaries.mjs` + `git diff --check` ✅
- `pnpm test:integration`: ⚠️ 5 suites PostgreSQL فشلت قبل الاختبارات لأن Docker/container runtime غير متاح؛ لا يوجد إثبات PG فعلي هنا.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** طبقات concurrency/idempotency/authorization/SoD/audit/outbox والاختبارات المحلية الأساسية منفذة ومتحققة، لكن real PostgreSQL concurrent/atomicity/privilege verification محجوب ببيئة التشغيل.

### ملاحظات / مشاكل مفتوحة
- يلزم تشغيل Testcontainers على PostgreSQL 18 فعلياً للتحقق من migration `0015`، replay/conflict عبر PG، claim المتوازي، rollback/atomic commit، وبقاء التاريخ.
- لا توجد قيم علمية أو صلاحيات release/approval غير معتمدة مخترعة؛ السياسات غير المعرفة تبقى DENY.

## [2026-09-04] — Commit ودفع تغييرات MASTER-008

### تم التنفيذ
- جرى تجهيز كل تغييرات MASTER-008 الحالية، بما فيها migrations وseeds وfactories والاختبارات وتحديث الـ mind.
- تم اعتماد commit محلي واحد للتغييرات قبل الدفع.
- تم الدفع إلى `origin/main` بعد تأكيد المستخدم.

### الملفات المتأثرة
- `db/migrations/0010_assets.sql` إلى `db/migrations/0014_backup_recovery_metadata.sql`
- `db/seeds/`
- `tests/`
- `.agents/mind/01-mind-latest.md`

### التحقق
- فحص حالة الفرع والريموت قبل الدفع ✅
- `git diff --check` ✅
- `git commit` بالرسالة `feat: add assets approvals and seed schemas` ✅
- `git push origin main` ✅ — `main` انتقل من `6c987b1` إلى `ab44284`

### النتيجة
- **الحالة:** نجح
- **مختصر:** تم إنشاء commit ودفع تغييرات MASTER-008 بنجاح إلى `origin/main` بدون force push.

### ملاحظات / مشاكل مفتوحة
- لا يوجد.

## [2026-09-04] — MASTER-008: Assets + Documents + Approvals + Change Requests + Backup metadata + seeds

### تم التنفيذ
- أُضيفت `0010_assets.sql` لكيانات Equipment/Calibration/Maintenance مع حالات lifecycle المعتمدة وFKs تاريخية `RESTRICT`، وربط `current_calibration_id` بدون اختراع interval أو overdue behavior.
- أُضيفت `0011_documents.sql` لفصل Document Identity عن Version وعن File bridge، مع revision uniqueness وpartial unique index يمنع أكثر من EFFECTIVE version لكل document.
- أُضيفت `0012_approvals_esignatures.sql` لـapproval cases/work items/append-only decisions/electronic signatures؛ لا توجد كلمات مرور أو reauth secrets أو Admin business bypass.
- أُضيفت `0013_change_requests.sql` مع target version/snapshot وfield-level JSONB changes ومحاولات apply ذات sequence ونتيجة success/failed.
- أُضيفت `0014_backup_recovery_metadata.sql` لـbackup/restore execution metadata فقط؛ لم تُخترع RPO/RTO أو retention/provider/production authority.
- أُضيفت seeds غير إنتاجية deterministic وidempotent (`db/seeds/dev.ts`, `db/seeds/test.ts`) للأدوار الأربعة و197 permission canonical فقط، مع production guard؛ لا يتم إنشاء users أو credentials.
- أُضيفت factories deterministic مع overrides صريحة للحالة والنسخة والـscope للاختبارات السلبية، واكتملت FKs المختبر المؤجلة إلى Equipment/Calibration/Documents داخل migrations المالكة.

### الملفات المتأثرة
- `db/migrations/0010_assets.sql`
- `db/migrations/0011_documents.sql`
- `db/migrations/0012_approvals_esignatures.sql`
- `db/migrations/0013_change_requests.sql`
- `db/migrations/0014_backup_recovery_metadata.sql`
- `db/seeds/{common,dev,test}.ts`
- `tests/helpers/factories.ts`
- `tests/unit/seeds-factories.test.ts`
- `tests/integration/database/seeds.test.ts`
- `tests/integration/database/{migrations,constraints,upgrade-path}.test.ts`

### التحقق
- `pnpm test:unit` → 5 files / 15 tests ✅
- `pnpm lint` ✅
- `pnpm build` ✅
- `node scripts/architecture/check-boundaries.mjs` ✅
- `prettier --check` للملفات الجديدة/المتأثرة ✅
- `git diff --check` ✅
- forbidden-pattern/secret scan ✅؛ لا `ON DELETE CASCADE` ولا `PERM-ADMIN-BYPASS-ALL` ولا credentials.
- PostgreSQL مؤقت محلي مع substitution مؤقت لـ`uuidv7()` بسبب عدم توفر PostgreSQL 18 محليًا: fresh migration للسلسلة كاملة، FKs/قيود، seed مرتين، `roles=4`, `permissions=197`, `nonrestrict_fks=0`, وproduction guard blocked ✅ كتحقق compatibility فقط.
- `pnpm exec vitest run tests/integration/database --passWithNoTests` ⚠️ محجوب: لا يوجد container runtime لـTestcontainers PostgreSQL 18.
- `pnpm typecheck` ⚠️ 5 أخطاء foundation سابقة خارج النطاق في `src/middleware.ts` و`src/pages/api/health/ready.ts`.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** ملفات assets/documents/approvals/change/backup وseed/factories مكتوبة ومتحققة static/unit، ونجح PostgreSQL compatibility run؛ إثبات Testcontainers PostgreSQL 18 وtypecheck العام ما زالا محجوبين/خارج النطاق.

### ملاحظات / مشاكل مفتوحة
- يلزم PostgreSQL 18/container runtime لتشغيل fresh/upgrade/invalid-row/seed integration الرسمية.
- `risk_level` للصلاحيات غير محدد في المواصفات، لذلك seed يستخدم قيمة metadata محايدة `UNSPECIFIED` ولا يوزع permissions على roles.
- Production restore، RPO/RTO، retention، provider، وexact approval authorities تبقى DENY/POLICY-DEPENDENT.

## [2026-09-04] — MASTER-007: Tasks + Quality + Quarantine + Laboratory schemas

### تم التنفيذ
- أُضيفت هجرات `0006` إلى `0009` لجداول Tasks وQuality وQuarantine وLaboratory حسب الكيانات migration-safe المعتمدة.
- أُضيفت قيود حالات Task/Finding/NCR/RCA/CAPA/Receiving/Inspection/Lab، وفصلت `workflow_state` عن `inspection_result` وعن `release_system`.
- حُفظت traceability للمختبر عبر template versions وsamples وraw typed measurements وretest self-reference/sequence/reason وhistorical snapshots.
- حُفظت controlled history عبر `ON DELETE RESTRICT`، ومنعت snapshots من UPDATE/DELETE لصلاحية runtime؛ لم تُخترع limits علمية أو release/approval policy.
- أُضيفت اختبارات migration ledger، upgrade count، وجود الجداول، وinvalid-row constraints للـquantity/state/retest.
- لم تُهاجر recurrence rules أو CAPA effectiveness reviews أو retest_requests لأنها غير مؤكدة/تعتمد على policy. كما بقيت FKs إلى Equipment/Calibration/Documents مؤجلة للهجرات المالكة اللاحقة حتى لا ينكسر fresh ordering.

### الملفات المتأثرة
- `db/migrations/0006_tasks.sql`
- `db/migrations/0007_quality.sql`
- `db/migrations/0008_quarantine.sql`
- `db/migrations/0009_laboratory.sql`
- `tests/integration/database/{migrations,constraints,upgrade-path}.test.ts`

### التحقق
- `pnpm test:unit` → 4 files / 13 tests ✅
- `pnpm lint` ✅
- `pnpm build` ✅
- `node scripts/architecture/check-boundaries.mjs` ✅
- `prettier --check tests/integration/database` ✅
- `git diff --check` ✅
- PostgreSQL مؤقت محلي مع substitution مؤقت لـ`uuidv7()` لأن النسخة المحلية ليست PostgreSQL 18: fresh application للسلسلة كاملة، 42 جدولًا، invalid quantity/state/retest rows مرفوضة، وruntime DDL privileges = false/false ✅ كتحقق صياغة/قيود فقط.
- `vitest` integration الرسمي على Testcontainers PostgreSQL 18 ⚠️ محجوب: لا يوجد container runtime.
- `pnpm typecheck` ⚠️ أخطاء foundation سابقة خارج النطاق في `src/middleware.ts` و`src/pages/api/health/ready.ts`.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** هجرات الدومينات واختبارات ledger/constraints مكتوبة ومراجعة، مع نجاح static/unit وPostgreSQL compatibility validation؛ إثبات Testcontainers PostgreSQL 18 وupgrade runner الفعلي ما زال محجوبًا ببيئة التشغيل.

### ملاحظات / مشاكل مفتوحة
- يلزم تشغيل integration على PostgreSQL 18 فعليًا لإغلاق fresh/upgrade/invalid-row runtime verification.
- يلزم تنفيذ هجرات Equipment/Calibration/Controlled Documents لاحقًا لإضافة FKs المؤجلة من usage bridges.
- لا توجد قيم علمية أو سياسات release/approval/retest/effectiveness جديدة مخترعة.

> **Status:** ACTIVE — canonical live project memory
> **Repository:** `YEEEAE/QC-Operations-Laboratory-Management-System`
> **Default branch:** `main`
> **Product:** QC Operations & Laboratory Management System
> **Architecture:** Modular Monolith
> **Web framework:** Astro
> **Rendering model:** Server-rendered / on-demand
> **Database:** PostgreSQL
> **Operational timezone:** `Asia/Riyadh`
> **Last reset:** 2026-09-04

## [2026-09-04] — MASTER-006: shared identity/authz/audit/outbox/files schemas

### تم التنفيذ
- أُضيفت `password_reset_requests` مع `token_hash` فقط، وقيود انتهاء الطلب ومرجع المستخدم بدون تخزين reset token plaintext.
- أُضيفت جداول `roles` و`permissions` و`role_permissions` و`user_roles` مع UUIDs، قيود uniqueness/FK/version/range، وزُرعت الأدوار الأساسية الأربعة فقط (`EMPLOYEE`, `SUPERVISOR`, `MANAGER`, `ADMIN`) بدون role hierarchy أو Admin bypass.
- أُضيفت `0004` لفهارس audit/outbox المعتمدة؛ audit وoutbox الأساسيان موجودان من `0001` بصلاحيات runtime محدودة وبدون cascade هدّام.
- أُضيفت `files` و`evidence_links` و`notifications` و`notification_deliveries` ببيانات metadata/hash/storage refs، مع إبقاء binary خارج PostgreSQL وقيود hash/size/removal/dedupe/subject pairs.
- لم يُنشأ `idempotent_commands` ولا scope tables لأن المواصفات تصنفها صراحة `DO NOT MIGRATE`/UNCONFIRMED إلى أن تعتمد استراتيجية API ونموذج التنظيم؛ تم توثيق ذلك داخل migration `0004` بدل اختراع policy.
- أُضيفت اختبارات وجود الجداول وinvalid-row constraints، وحُدّثت اختبارات ledger/upgrade path لتتوقع migrations `0001` إلى `0005`.

### الملفات المتأثرة
- `db/migrations/0002_identity.sql`
- `db/migrations/0003_authorization.sql`
- `db/migrations/0004_audit_outbox_idempotency.sql`
- `db/migrations/0005_files_notifications.sql`
- `tests/integration/database/{migrations,constraints,upgrade-path}.test.ts`

### التحقق
- `pnpm format:check` ✅
- `pnpm lint` ✅
- `pnpm test:unit` → 4 files / 13 tests ✅
- `pnpm build` ✅
- `node scripts/architecture/check-boundaries.mjs` ✅
- `git diff --check` ✅
- `pnpm exec vitest run tests/integration/database --passWithNoTests` ⚠️ تعذر runtime لأن Docker/container runtime غير متاح؛ fresh migration وupgrade وPostgreSQL constraint tests لم تُنفذ فعليًا.
- `pnpm typecheck` ⚠️ أخطاء سابقة خارج نطاق schema في `src/middleware.ts` و`src/pages/api/health/ready.ts`.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** migrations والاختبارات المطلوبة مكتوبة ومراجعة static، مع الحفاظ على حدود الصلاحيات والتاريخ؛ إثبات PostgreSQL runtime الفعلي واستراتيجية idempotency ما زالا محجوبين/غير معتمدين.

### ملاحظات / مشاكل مفتوحة
- يلزم تشغيل PostgreSQL 18 فعليًا لإثبات fresh/upgrade/invalid-row constraints.
- يلزم اعتماد API command/idempotency policy قبل إنشاء جدول idempotency.
- لا توجد قيم علمية أو سياسات release/approval أو retention جديدة في هذا التغيير.

## [2026-09-04] — MASTER-005: PostgreSQL runtime + migration engine + core schema

### تم التنفيذ
- أُنشئت حدود runtime مشتركة لـ`pg.Pool` وKysely وtransaction helper، مع `UTC` و`search_path=qc,pg_catalog` وإغلاق pool صريح وترجمة أخطاء PostgreSQL إلى `AppError`.
- أُنشئ migration runner صريح يقرأ migrations SQL بترتيب ثابت، يحسب SHA-256، يسجل ledger في `qc.schema_migrations`، ويستخدم PostgreSQL advisory lock لمنع التشغيل المتوازي.
- أُنشئت `0001_core_schema.sql` لبنية `qc` فقط: ledger، users، sessions، audit_events، outbox_events؛ بدون جداول domain أو RLS، ومع UUIDv7 native وقيود FK/CHECK/UNIQUE وسلوك تاريخي محافظ.
- أُضيفت أدوار PostgreSQL primitive منفصلة `qc_migrator` و`qc_app_runtime`، مع منع runtime من DDL وCREATE على `public` و`qc`، ومنح أقل صلاحيات لازمة للجداول الأساسية.
- أُضيفت اختبارات migrations/constraints/upgrade path، وREADME يثبت immutability وforward-only policy، وحُدّثت scripts `db:migrate` و`db:migrate:status` و`db:migrate:check` لمساراتها الجديدة.

### الملفات المتأثرة
- `src/shared/database/{db-types,pool,database,transaction}.ts`
- `scripts/db/{migrate,migration-status,check-migration-integrity}.ts`
- `db/migrations/{README.md,0001_core_schema.sql}`
- `tests/integration/database/{migrations,constraints,upgrade-path}.test.ts`
- `package.json`, `vitest.config.ts`

### التحقق
- TypeScript compile للملفات الجديدة مع `--ignoreConfig` ✅
- `pnpm lint` ✅
- `pnpm format:check` ✅
- `git diff --check` ✅
- `pnpm test:unit` → 4 files / 13 tests ✅
- `pnpm test:integration -- database` ⚠️ فشل لأن Docker/container runtime غير متاح؛ PostgreSQL 18 لم تُشغّل فعليًا في هذه البيئة.
- `pnpm db:migrate:check` ⚠️ وصل للسكريبت وفشل آمنًا بـ`errors.system_configuration_invalid` لغياب `DATABASE_URL`؛ لم تُعرض credentials.
- `pnpm typecheck` ⚠️ بقيت أخطاء سابقة خارج ملفات المهمة في `src/middleware.ts` و`src/pages/api/health/ready.ts` مرتبطة بـ`tsconfig`/Astro types.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** طبقة runtime وmigration/core schema والاختبارات مكتوبة ومتحققة static/unit، لكن إثبات PostgreSQL 18 الفعلي وfresh/upgrade/privilege runtime verification محجوبان بغياب Docker و`DATABASE_URL`، ولا يوجد claim بجاهزية الإنتاج.

### ملاحظات / مشاكل مفتوحة
- لا توجد قيم علمية أو سياسات release/approval جديدة، ولا جداول domain أُنشئت.
- يلزم تشغيل اختبارات database على PostgreSQL 18 فعلية، ثم معالجة أخطاء typecheck السابقة في نطاق منفصل قبل claim شامل.

## [2026-09-04] — MASTER-004: runtime config + IDs/time + errors + validation

### تم التنفيذ
- أُنشئت طبقة server-only typed config في `src/config/` تفرق بين `DATABASE_URL` و`SESSION_SECRET` كإعدادات حرجة للإنتاج، وإعدادات observability/version الاختيارية، مع أخطاء startup redacted.
- أُضيف UUIDv7 تقني مولّد على الخادم، وClock يعتمد وقت الخادم، وتحويل عرض آمن إلى `Asia/Riyadh`، وpagination bounded بحد أقصى تقني 100.
- أُنشئت عائلات AppError canonical (`AUTH/AUTHZ/VALIDATION/DOMAIN/CONFLICT/RESOURCE/SYSTEM`) مع mapping آمن إلى Action errors وRFC 9457 Problem Details؛ `CONFLICT_STALE_VERSION` يرجع 409 وdatabase unavailable يرجع 503.
- أُضيفت schemas/parsers للـUUID والتاريخ والتصفح/query، مع رفض UUID غير الصحيح قبل أي lookup، وstructured field errors.
- أُضيف request context وmiddleware يولدان/يحافظان على `requestId` ويربطان `traceId` و`spanId`، بدون أخذ actor أو permission أو final state من العميل.
- أُضيف `safeReturnTo` يقبل local relative paths فقط ويمنع open redirect، مع اختبارات unit وintegration مركزة.

### الملفات المتأثرة
- `src/config/{constants,env,runtime}.ts`
- `src/shared/{id,time,pagination,errors,validation,http}/`
- `src/middleware.ts`, `src/env.d.ts`
- `tests/unit/shared/`, `tests/integration/http/`

### التحقق
- TDD: اختبار pagination فشل أولًا مع السالب ثم نجح بعد تطبيق bounded normalization ✅
- `pnpm test:unit` → 4 files / 13 tests ✅
- `pnpm exec vitest run tests/integration/http/middleware.test.ts` → 1 test ✅
- `pnpm typecheck` → 0 errors/warnings/hints ✅
- `pnpm lint` ✅
- `pnpm format:check` ✅
- `pnpm build` ✅
- `git diff --check` وDelivery/raw-SQL/secret scans ✅
- `pnpm test:integration` ⚠️ اختبار PostgreSQL السابق لم يبدأ لأن Docker/container runtime غير متاح محليًا؛ اختبار HTTP integration نفسه نجح.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** foundation المطلوب لـruntime/config/IDs/time/errors/validation/request context منفذ ومتحقق محليًا؛ تحقق PostgreSQL container الكامل يبقى محجوبًا بسبب بيئة Docker، والتوافق المحلي مع Node 24 غير متاح (المحلي Node 22.22.3).

### ملاحظات / مشاكل مفتوحة
- ما زالت auth/session repository الفعلية وauthorization داخل use cases خارج نطاق MASTER-004؛ middleware لا يمنح صلاحية ولا ينفذ business rules.
- لا توجد قيم علمية أو سياسات release/approval جديدة في هذا التغيير.

## [2026-09-04] — إصلاح فشل Deploy على Render (port binding)

### تم التنفيذ
- شخص السبب الجذري: `@astrojs/node` standalone كان يربط السيرفر على localhost فقط (`[::1]`)، وRender يطلب المنفذ على `0.0.0.0` → "No open ports detected" → Deploy Timed Out.
- تحقق تجريبيًا أن `host` option داخل `node({...})` يتجاهله الـ adapter (يقرأ `config.server.host` فقط)، بينما `HOST` env يعمل ويُنتج binding على `*:port`.
- أضيف `HOST=0.0.0.0` كـ env var في `render.yaml` كحل رسمي.

### الملفات المتأثرة
- `render.yaml`

### التحقق
- `pnpm build` ✅
- `pnpm typecheck` ✅ (0 errors/warnings)
- تشغيل `PORT=4321 HOST=0.0.0.0 node dist/server/entry.mjs` → `lsof` يظهر `*:4321 LISTEN` (كل الواجهات) ✅
- بدون `HOST` → `[::1]` فقط (أعيد إنتاج مشكلة Render محليًا) ✅

### النتيجة
- **الحالة:** نجح (محليًا)
- **مختصر:** الإصلاح عبارة عن env var واحد في render.yaml؛ الـ deploy الفعلي على Render يحتاج المستخدم يعمل redeploy بعد commit.

### ملاحظات / مشاكل مفتوحة
- إذا خدمة Render غير مربوطة بـ Blueprint، لازم المستخدم يضيف `HOST=0.0.0.0` يدويًا في Environment Variables من الداشبورد أيضًا.


## [2026-09-04] — MASTER-003: Testing harness + CI baseline

### تم التنفيذ
- أُنشئ `vitest.config.ts` لفصل مسارات unit/integration وتشغيلها في Node مع timeouts مناسبة لحاويات الاختبار، وأُنشئ setup يعيد mocks/env stubs بعد كل test.
- أُنشئ helper لحاوية `postgres:18-alpine` عبر `@testcontainers/postgresql` وبـdatabase/username/password خاصة بالاختبار فقط؛ ما يكتب `DATABASE_URL` ولا يستخدم أي credential إنتاجي.
- أُنشئ PostgreSQL 18 integration smoke ينفذ `SELECT version()` على حاوية disposable ويتحقق من الإصدار، ويفشل صراحة إذا غاب container runtime بدل skip صامت.
- حُدّث Playwright لفصل E2E مع artifacts محتجزة عند الفشل فقط، وأُنشئ GitHub Actions verification CI بصلاحية `contents: read` فقط وبدون deploy job.
- CI يشغّل frozen install، format/lint/typecheck، architecture boundaries، unit/integration، migration check مشروط إلى أن يوجد runner، build، وPlaywright E2E؛ ويفعّل Chromium في CI ويرفع artifacts الفشل فقط.

### الملفات المتأثرة
- `vitest.config.ts`, `playwright.config.ts`, `package.json`, `pnpm-lock.yaml`
- `tests/setup/unit.ts`, `tests/helpers/{test-env,postgres-container}.ts`
- `tests/integration/postgres-container.smoke.test.ts`
- `.github/workflows/ci.yml`

### التحقق
- TDD: smoke test فشل أولًا بسبب helper غير موجود، ثم وصل لـTestcontainers بعد التنفيذ ✅
- `pnpm install --frozen-lockfile` ✅
- `pnpm test:unit` → 2 files / 5 tests ✅
- `pnpm exec playwright --version` → `1.62.1` ✅
- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm build` ✅
- YAML parse لـ`.github/workflows/ci.yml` ✅
- `node scripts/architecture/check-boundaries.mjs` و`git diff --check` ✅
- `pnpm test:integration` ⚠️ فشل محليًا لأن Docker/container runtime غير متاح؛ PostgreSQL 18 smoke لم يُتحقق runtime محليًا بعد.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** Test/CI harness موجود ومقفل بدون production credentials أو deployment، لكن إثبات PostgreSQL 18 الحقيقي محليًا محجوب إلى أن يتاح Docker runtime؛ CI سيشغله على GitHub runner الداعم للحاويات.

### ملاحظات / مشاكل مفتوحة
- `scripts/db-migrate.ts` غير موجود حاليًا؛ CI يسجل migration check كـdeferred ولا يدعي وجود migration verification.
- Node المحلي `22.22.3` بينما config يطلب Node `24.20.0`؛ CI يثبت Node `24.20.0` لكن التحقق المحلي عليه ما زال غير متاح.

## [2026-09-04] — MASTER-002: routing foundation + architecture boundary checks

### تم التنفيذ
- أُنشئ registry TypeScript مركزي لمسارات الـbrowser المعتمدة في `src/shared/routing/`، مع حالة file expectation تفصل `required` عن `deferred` و`conditional` بدون إنشاء صفحات Astro وهمية.
- أُنشئت policy helpers توضح أن metadata المسار ليست Authorization، وأن كل route محمي يحتاج re-authorization داخل الـApplication Use Case.
- أُنشئ فحص معماري لـDelivery يمنع imports قاعدة البيانات/Domain/Business Rules وraw SQL من `src/pages` و`src/actions` و`src/ui` وmiddleware عند وجوده.
- أُنشئ فحص route-file coverage يعطي مسارات الملفات الناقصة بوضوح ويخرج nonzero؛ النتيجة الحالية الناقصة متوقعة لأن صفحات الدومينات ما زالت غير منفذة، والـdeferred/conditional مستثناة عمدًا.
- أُضيفت READMEs لتثبيت حدود modules/shared/ui/pages/db/tests قبل feature code.
- ثُبّت Render Web Service و`qclevel.top` كأساس web/domain في وثائق التشغيل، مع Hostinger كمدير DNS حالي، وعدم اختراع hostname أو providers غير معتمدين.
- كانت metadata في UI/UX وRoute Manifest بالفعل `FOUNDATION — APPROVED` من العمل السابق؛ تم التحقق منها ولم يتغير محتواها.

### الملفات المتأثرة
- `src/shared/routing/route-types.ts`, `src/shared/routing/route-policy.ts`, `src/shared/routing/routes.ts`
- `scripts/architecture/check-boundaries.mjs`, `scripts/architecture/check-route-files.mjs`
- `src/{modules,shared,ui}/README.md`, `src/pages/README.md`, `db/README.md`, `tests/README.md`
- `tests/unit/routing-registry.test.ts`
- `Documents/DEPLOYMENT-ARCHITECTURE.md`, `docs/operations/RENDER-DEPLOYMENT.md`

### التحقق
- TDD: اختبار الـrouting فشل أولًا بسبب غياب registry ثم نجح بعد التنفيذ؛ `pnpm test:unit` → 5 tests ✅
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` ✅
- `node scripts/architecture/check-boundaries.mjs` ✅ بلا Delivery boundary violations.
- `pnpm exec tsx scripts/architecture/check-route-files.mjs` → nonzero متوقع مع قائمة الملفات المطلوبة الناقصة؛ لا يشمل deferred/conditional routes ✅
- إعادة قراءة metadata لأول 30 سطرًا من UI/UX وRoute Manifest، وفحص stale approval wording بلا نتائج ✅
- إعادة التحقق من Render الرسمي: Web Service يحتاج binding على `0.0.0.0`، root A fallback هو `216.24.57.1`، و`www` CNAME يحتاج hostname فعلي؛ لا توجد Render service/hostname/DNS/TLS حاليًا.
- `git diff --check` ✅

### النتيجة
- **الحالة:** نجح
- **مختصر:** Foundation routing والحدود قابلة للفحص آليًا، مع بقاء تنفيذ صفحات الدومينات وتهيئة Render/DNS/قاعدة الإنتاج خارج نطاق التنفيذ الحالي.

### ملاحظات / مشاكل مفتوحة
- الجهاز المحلي ما زال Node `22.22.3` بينما الـruntime المقفل Node `24.20.0`؛ التحقق المحلي مرّ لكن توافق Node 24 ما زال غير متحقق محليًا.
- PostgreSQL، object storage، KMS/secrets، telemetry، backup/PITR providers وRender service hostname غير معتمدة/غير منشأة؛ DNS commands لا تُنفذ قبل إنشاء الخدمة ونسخ hostname الفعلي.

## [2026-09-04] — إزالة قيد "Execute this prompt only" من خطة التنفيذ المدمجة

### تم التنفيذ
- حذف سطر `EXECUTION MODE: Execute this prompt only. Do not start the next prompt.` من جميع مواضعه في `IMPLEMENTATION-MASTER-PLAN-MERGED.md`.
- المواضع المحذوفة: قالب القواعد الثابتة (القسم 3) + الـ40 برومبت MASTER = 41 موضعًا.
- لم يتغير أي محتوى آخر في الملف (لا عناوين، ولا متطلبات، ولا verification).

### الملفات المتأثرة
- `IMPLEMENTATION-MASTER-PLAN-MERGED.md`

### التحقق
- `grep -c "EXECUTION MODE: Execute this prompt only"` → `0` ✅
- `wc -l` → 5668 (كان 5709؛ الفرق 41 سطرًا محذوفًا بالضبط) ✅
- `git diff --check` ✅ و`git diff --stat` → 41 deletions فقط ✅

### النتيجة
- **الحالة:** نجح
- **مختصر:** البرومبتز أصبحت خالية من قيد التوقف بعد كل برومبت؛ باقي محتوى الخطة سليم 100%.

### ملاحظات / مشاكل مفتوحة
- لا يوجد.



## [2026-09-04] — MASTER-001: Astro + Render baseline

### تم التنفيذ
- تهيئة أساس مشروع Astro SSR/on-demand مع Node adapter standalone وNode `24.20.0` وpnpm `11.25.0` مثبتين في config/lockfile.
- إضافة hygiene/configuration files، TypeScript strict، ESLint/Prettier، وscripts للفحص والاختبارات والتشغيل.
- إنشاء Render Web Service Blueprint لـ`qclevel.top` مع `checksPass` وCorepack frozen install وبدون أي secret أو PostgreSQL resource.
- تنفيذ readiness infrastructure مستقل عن Delivery: يفحص PostgreSQL، ويرجع `200` عند الجاهزية أو `503` minimal عند غياب/فشل dependency.
- إضافة unit tests لحالتي readiness، Playwright config لعزل E2E، ووثيقة تشغيل Render.
- تدوير السجلات الأقدم إلى `02-mind-mid.md` لأن الـlive mind تجاوز حد الحجم التشغيلي.

### الملفات المتأثرة
- `package.json`, `pnpm-lock.yaml`, `astro.config.mjs`, `render.yaml`
- `src/pages/api/health/ready.ts`, `src/shared/health/*`, `tests/unit/health-ready.test.ts`
- `docs/operations/RENDER-DEPLOYMENT.md`, `playwright.config.ts`
- `.agents/mind/01-mind-latest.md`, `.agents/mind/02-mind-mid.md`

### التحقق
- `pnpm install --frozen-lockfile` ✅ (بـpnpm 11.25.0؛ local Node 22 تجاوز القيد مؤقتًا)
- `pnpm exec astro --version` → `7.3.1` ✅
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm test:integration`, `pnpm test:e2e`, `pnpm test:coverage`, `pnpm build` ✅
- Render Blueprint JSON Schema validation من `https://render.com/schema/render.yaml.json` ✅
- `node dist/server/entry.mjs` ثم `GET /api/health/ready` بدون `DATABASE_URL` → `503 {"status":"unhealthy"}` ✅
- `git diff --check` وsecret/raw-SQL Delivery scans ✅

### النتيجة
- **الحالة:** نجح جزئيًا
- **مختصر:** baseline المحلي مكتمل ومتحقق؛ deploy وDNS/Render secrets وPostgreSQL الحقيقي غير منفذة عمدًا، لذلك الجاهزية الإنتاجية تبقى `UNVERIFIED`.

### ملاحظات / مشاكل مفتوحة
- الجهاز المحلي فيه Node `22.22.3` فقط؛ توافق Node 24 مو متحقق محليًا رغم تثبيت `.node-version` وRender `NODE_VERSION` على `24.20.0`.
- `DATABASE_URL`/Render service/DNS Hostinger ما زالت تحتاج إعداد وتشغيل معتمدين، ولا يوجد production deploy.

## [2026-09-04] — IMP-000: تطبيع اعتماد مواصفات UI/UX وRoute Manifest

### تم التنفيذ
- تحديث عنوان وحالة ونسخة `Documents/UI-UX-SPECIFICATION.md` إلى Foundation baseline معتمد.
- تحديث حالة ونسخة metadata النهائية في `Documents/ROUTE-MANIFEST-SPECIFICATION.md` إلى Foundation baseline معتمد.
- تحويل حالات سجلات قرارات UX وRoute من حالة الاعتماد المقترحة إلى `APPROVED` بدون تغيير متطلبات UI أو routes أو business behavior.
- إضافة الوثيقتين إلى قائمة `Canonical Foundation Documents` وإزالة ملاحظة أنهما ما زالتا Draft.

### الملفات المتأثرة
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- إعادة قراءة أول 30 سطرًا من الوثيقتين ✅
- فحص عبارات حالة المسودة/الاعتماد القديمة بلا نتائج ✅
- التحقق من قائمة `Canonical Foundation Documents` ✅
- `git diff --check` ✅
- لم تُشغّل application tests/build لأن التغيير metadata توثيقي فقط ولا يغيّر runtime behavior.

### النتيجة
- **الحالة:** نجح
- **مختصر:** أصبحت مواصفات UI/UX وRoute Manifest ممثلة كـFoundation APPROVED baselines، مع بقاء تغييرات working tree غير المرتبطة كما هي.

### ملاحظات / مشاكل مفتوحة
- لا توجد قرارات سياسة أو علمية جديدة؛ حالة التنفيذ الفعلي للصفحات والـroutes ما زالت `UNVERIFIED` حسب المواصفات.

## [2026-09-04] — اعتماد Deployment + UAT + Production Readiness Foundation Closure Package

### تم التنفيذ
- إنشاء `Documents/DEPLOYMENT-ARCHITECTURE.md` بحالة `FOUNDATION — APPROVED DEPLOYMENT ARCHITECTURE BASELINE`.
- إنشاء `Documents/UAT-ACCEPTANCE-PLAN.md` بحالة `FOUNDATION — APPROVED UAT ACCEPTANCE BASELINE`.
- إنشاء `Documents/PRODUCTION-READINESS-CHECKLIST.md` بحالة `FOUNDATION — APPROVED PRODUCTION READINESS BASELINE`.
- اعتماد Controlled Release Architecture: `Local/Development → Test/CI → Staging/UAT → Production`.
- تثبيت release identity مرتبطة بـGit SHA + Build/Artifact ID + Migration Head، مع تفضيل build-once/promote-same-artifact حيث يكون ذلك ممكنًا تقنيًا.
- تثبيت أن Production migrations خطوات explicit controlled وليست silent application-startup mutations، وأن code rollback لا يساوي database rollback.
- اعتماد UAT بنموذج `Role × Domain × Workflow × State × Permission × Positive/Negative Scenario × Evidence` مع ربط النتائج بالـexact release candidate.
- اعتماد Production Readiness كـfinal evidence-based Go/No-Go gate، ومنع percentage-based readiness من تجاوز أي blocker حرج.
- تثبيت أن Critical FAIL/UNVERIFIED، required UAT failure، residual CRITICAL، required restore evidence missing، أو artifact/commit mismatch تمنع Go-Live.

### الملفات المتأثرة
- `Documents/DEPLOYMENT-ARCHITECTURE.md`
- `Documents/UAT-ACCEPTANCE-PLAN.md`
- `Documents/PRODUCTION-READINESS-CHECKLIST.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `DEPLOYMENT-ARCHITECTURE.md` أُنشئ على `main` بالـcommit `2d35f7f62d08afa31757113ff9568936fcd745e6` وتمت إعادة قراءته؛ Blob SHA: `afd06581c9da000f281ce2e624c132e1ef56b738`.
- `UAT-ACCEPTANCE-PLAN.md` أُنشئ على `main` بالـcommit `83a0f1c006f247e7f604d282d8b145d70eac4444` وتمت إعادة قراءته؛ Blob SHA: `3a2d88a1dedbdd173053cac43045d6578b59ddc7`.
- `PRODUCTION-READINESS-CHECKLIST.md` أُنشئ على `main` بالـcommit `c5c31426e9ec3f43708f50f2e175914659a0a4b1` وتمت إعادة قراءته؛ Blob SHA: `529e263fb37555f37074b42df00d5278b784793b`.
- تم التحقق من أن الملفات الثلاثة تحمل APPROVED statuses وليست Draft.
- لم تُشغّل application tests/build لأن هذه المهمة توثيق Foundation فقط، ولا يوجد claim بأن CI/CD أو UAT runtime أو Production deployment مطبقة فعليًا.

### النتيجة والقيود
- حزمة Deployment/UAT/Production Readiness أصبحت Foundation baselines معتمدة.
- لا يعني ذلك أن deployment pipeline أو UAT execution أو production readiness evidence موجودة فعليًا؛ implementation/runtime status يبقى UNVERIFIED حتى يوجد code + environment + current evidence.
- Exact hosting/provider، CI/CD tooling، production release authority، RPO/RTO، retention، HA topology، deployment mode، وapproval ceremonies ما زالت POLICY/DEPLOYMENT-DEPENDENT حيث نصت الوثائق على ذلك.
- `Documents/UI-UX-SPECIFICATION.md` و`Documents/ROUTE-MANIFEST-SPECIFICATION.md` كان محتواهما معتمدًا من المستخدم، وتم لاحقًا تطبيع metadata إلى APPROVED وإدخالهما في قائمة الـcanonical baseline بهذا الـMind.

---

## [2026-09-04] — اعتماد Backup & Recovery Foundation Baseline

### تم التنفيذ
- إنشاء `Documents/BACKUP-RECOVERY-PLAN.md` كوثيقة Foundation معتمدة، بدون Draft status.
- اعتماد Layered Recovery Architecture تشمل PostgreSQL physical base backups + continuous WAL archiving + PITR، مع logical export كطبقة ثانوية وprovider snapshots كطبقة إضافية عند توفرها.
- إدخال Object Storage / Evidence binaries ضمن recovery scope وربط الاستعادة بـSHA-256 والـmetadata/business linkage.
- اعتماد Recovery Manifest يربط backup set بـPostgreSQL version context وWAL coverage وobject recovery context وGit SHA/migration context وrestore-verification status.
- تثبيت أن Backup Job Success لا يساوي Restore Verified، وأن telemetry لا تستبدل controlled recovery evidence.
- اعتماد isolated restore كافتراضي للـdrills، واعتبار Production Restore عملية high-risk controlled operation.
- تثبيت أن Admin لا يملك Production Restore Authority تلقائيًا، وأن major disaster/database recovery يبطل sessions الحالية افتراضيًا قبل reopening.
- تثبيت أن exact RPO/RTO والretention/cadence/authority/provider topology تبقى POLICY/DEPLOYMENT-DEPENDENT ولا يتم اختراعها.

### الملفات المتأثرة
- `Documents/BACKUP-RECOVERY-PLAN.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- تم إنشاء الوثيقة على `main` بالـcommit `c90e77bc7eb50c17f23158e3f00f720c9b7b8175`.
- تمت إعادة قراءة `Documents/BACKUP-RECOVERY-PLAN.md` من `main` بعد الإنشاء.
- Blob SHA المتحقق للوثيقة: `6b71c9189ecd3ae18bcdb9ccf737ea2e561afe6f`.
- الـStatus المتحقق داخل الملف: `FOUNDATION — APPROVED BACKUP & RECOVERY BASELINE`.
- لم تُشغّل application tests/build لأن التغيير توثيقي فقط ولا يوجد claim بأن backup implementation أو runtime recovery جاهز.

### النتيجة والقيود
- الوثيقة نفسها مثبتة كـFoundation baseline معتمدة.
- هذا لا يثبت أن backup/PITR/object recovery/restore drills مطبقة أو operationally verified؛ `RISK-028` يبقى residual risk غير متحقق حتى يوجد implementation + restore evidence.
- Exact RPO/RTO والretention والcadence والrestore approval/reopen authority والprovider choices ما زالت قرارات مفتوحة.

---

## [2026-09-04] — تثبيت بروتوكول استخدام مهارات المشروع

### تم التنفيذ
- توحيد تعليمات `AGENTS.md` و`.agents/AGENTS.md` و`.claude/AGENTS.md` و`.clinerules/e.md` لإلزام فحص `.agents/skills/` قبل كل مهمة.
- تثبيت قراءة `SKILL.md` كاملًا للمهارة المطابقة قبل تنفيذ الإجراء، واتباع المراجع المطلوبة، وذكر عدم وجود مهارة مناسبة عند الحاجة.

### التحقق
- فحص تطابق قسم Skills في ملفات تعليمات الوكلاء الأربعة.
- فحص `git diff --check` بعد التعديل.

### النتيجة والقيود
- أصبحت مهارات المشروع موثقة كمسار استخدام دائم ضمن تعليمات المستودع.
- لا يضمن ذلك تطبيق مهارة غير مرتبطة بالمهمة؛ الاختيار يظل حسب موضوع المهمة وتعارضات وثائق Foundation.

---

# 1. Purpose

هذا الملف هو الذاكرة الحية للمشروع الجديد فقط.

ممنوع استخدام تاريخ BRIGHTAI أو `apps/qc-task-manager` القديم كواقع أو مصدر حقيقة لهذا المشروع.

المرجع التشغيلي الحالي يكون بالترتيب التالي:

1. الواقع الحالي للمستودع وقاعدة البيانات والـruntime عند وجودها.
2. الوثائق المعتمدة داخل `Documents/`.
3. هذا الملف للقرارات الحديثة وسجل العمل.
4. `README.md` للعرض العام.

إذا تعارض هذا الملف مع وثيقة Foundation معتمدة، لا يتم تجاهل التعارض؛ يجب توثيقه وتصحيح أحد المصدرين صراحة.

---

# 2. Current Project Stage

الحالة الحالية:

> **IMPLEMENTATION BOOTSTRAP — ASTRO / RENDER BASELINE INITIALIZED**

الـFoundation architecture/specification package الأساسية مكتملة بدرجة كبيرة، وAstro SSR/Render baseline صار موجودًا محليًا ومتحققًا. قاعدة البيانات الفعلية، migrations، identity/authz/audit، domains، وproduction deployment ما زالت غير منفذة أو غير متحققة حسب نطاقها.

أي claim مثل:

- implemented
- complete
- verified
- production ready
- 100%

يحتاج دليل حالي من المستودع/الـruntime/الاختبارات.

---

# 3. Canonical Foundation Documents

المجلد الرسمي:

`Documents/`

الوثائق الأساسية المعتمدة حاليًا:

- `Documents/QC-SYSTEM-DESIGN-CONSTITUTION.md`
- `Documents/SYSTEM-INVARIANTS.md`
- `Documents/DOMAIN-MAP.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/ROLE-MATRIX.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/STATE-MACHINES.md`
- `Documents/DATA-MODEL.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/REQUIREMENTS-TRACEABILITY.md`
- `Documents/ARCHITECTURE-SPECIFICATION.md`
- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/DATABASE-ARCHITECTURE.md`
- `Documents/ERROR-ARCHITECTURE.md`
- `Documents/TESTING-STRATEGY.md`
- `Documents/RISK-REGISTER.md`
- `Documents/DESIGN-SYSTEM.md`
- `Documents/OBSERVABILITY-ARCHITECTURE.md`
- `Documents/BACKUP-RECOVERY-PLAN.md`
- `Documents/DEPLOYMENT-ARCHITECTURE.md`
- `Documents/UAT-ACCEPTANCE-PLAN.md`
- `Documents/PRODUCTION-READINESS-CHECKLIST.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`

الوثائق تصف الـFoundation. الكود يجب أن يطابقها، وليس العكس.

---

# 4. Product Scope

المجالات الرئيسية:

- Dashboard
- Tasks
- Quality
  - Findings
  - NCR
  - RCA
  - CAPA
- Quarantine
  - Receiving Items
  - Inspection Reports
  - Quarantine Administration
- Laboratory Testing
- Equipment / Calibration / Maintenance
- WI / SOP / Controlled Documents
- Reviews / Approvals / E-Signatures
- Change Requests
- Reports
- Administration
- System Health / Backup / Recovery
- AI Advisory

Shared capabilities تشمل:

- Authorization
- Audit
- Notifications
- Files / Evidence
- Search
- Validation
- Transactions
- Errors
- Observability
- Time

---

# 5. Technology Decisions

## Web

- Astro هو الـWeb Framework الرسمي.
- النظام ليس static marketing site.
- الوظائف المحمية تعتمد server/on-demand rendering.
- `src/pages/`, Astro Actions/API endpoints, وmiddleware تعتبر Delivery Layer فقط.
- Business Rules لا توضع داخل `.astro` component أو client island أو route handler.

## Database

- PostgreSQL من اليوم الأول.
- Technical IDs: UUID.
- Human-readable business IDs منفصلة.
- Event timestamps: `TIMESTAMPTZ`.
- Internal time handling: UTC.
- Display timezone: `Asia/Riyadh`.
- Optimistic concurrency عبر record `version` للسجلات المناسبة.

## Architecture

- Modular Monolith.
- One application + one PostgreSQL database مع domain boundaries واضحة.
- لا Microservices في الـFoundation.
- لا direct UI → DB.
- لا direct cross-domain table writes.

---

# 6. Canonical Application Flow

```text
Astro Page / Client Island
        ↓
Astro Action / API Endpoint
        ↓
Authenticated Request Context
        ↓
Application Use Case
        ↓
Central Authorization
        ↓
Domain Rules / State Machine
        ↓
Transaction
        ↓
Repository
        ↓
PostgreSQL
        ↓
Audit / Durable Outbox / Notifications
```

---

# 7. Roles

الـFoundation roles الحالية فقط:

- Employee
- Supervisor
- Manager
- Admin

قاعدة ثابتة:

> **Role ≠ Permission**

Authorization يعتمد على:

`Role + Permission + Scope + Entity + State + SoD + Version + Business Rule`

Admin ليس Universal Business Approver.

Manager لا يرث تلقائيًا كل صلاحيات Supervisor/Employee.

---

# 8. Authorization Principles

- Default Deny.
- Authorization server-side دائمًا.
- UI visibility ليست security boundary.
- Astro middleware لا يستبدل domain authorization.
- كل sensitive Action تعيد authorization عند التنفيذ.
- Reports / Search / Export / Files تطبق نفس scope.
- Self-review وself-approval للـcontrolled records: DENY كـFoundation default إلى أن تعتمد SoD policy النهائية.
- أي sensitive permission غير محسومة: DENY UNTIL APPROVED.

---

# 9. Core System Invariants

1. UI visibility is never authorization.
2. Authorization is always server-side.
3. Separation of Duties must be enforced according to approved policy.
4. Approved controlled records cannot be silently edited.
5. VOID preserves history.
6. SUPERSEDED preserves history.
7. Important mutations require actor/time/entity/action/reason where required/audit evidence.
8. Scientific acceptance limits come only from approved controlled sources.
9. AI cannot approve, reject, release, sign, or set official PASS/FAIL.
10. Historical migrations are immutable.
11. Reports obey application authorization scope.
12. Backup is not proven until restore is verified.
13. Master-data changes do not rewrite historical records.
14. Draft / Submitted / Approved have different integrity rules.
15. Admin cannot rewrite historical facts.
16. Critical operations are transactional.
17. Critical actions are idempotent where applicable.
18. Concurrent edits never silently overwrite.
19. Routes, tests, and controlled workflows must be machine-verifiable.
20. No readiness claim without evidence.

---

# 10. Critical Domain Decisions Already Established

## Quarantine

These are separate facts:

- Receiving workflow state
- Inspection result
- Release System state

`PASS` does not automatically mean `Released`.

## Inspection

- Controlled report uses exact approved template version.
- Submission freezes historical controlled context.
- Approved records are not directly editable.

## Laboratory

- Raw observations/measurements are preserved.
- Scientific criteria are source-controlled.
- Retest is a separate execution linked to original test.
- Historical equipment/calibration/document context is snapshotted.

## Documents

- Document Identity and Document Version are separate.
- Approved/effective versions are controlled.
- Revision creates a new version.
- Superseded versions remain historical.

## Audit

- Audit is separate from application logging.
- Audit history must not be destroyed by cascade deletion.

## Files

- File metadata in PostgreSQL.
- Binary content in object storage abstraction.
- SHA-256 retained for integrity.

## AI

AI is advisory only and core workflows must function without AI.

---

# 11. Data Principles

- Normalize current business truth.
- Snapshot historical controlled truth.
- Use explicit FKs for core business relationships where practical.
- Restrict polymorphic `subject_type + subject_id` patterns to justified shared capabilities such as Audit / Evidence / Approval infrastructure.
- No giant generic QC table.
- No giant JSONB business model.
- No destructive cascades through controlled history.

---

# 12. Scientific / Policy Unknowns

Codex/developer/AI must not invent:

- Scientific acceptance limits
- Sampling rules
- Measurement precision
- Rounding rules
- Calibration intervals
- Release authority
- Release e-signature requirements
- Inspection final approver
- Lab final approver
- Retest allowance/count/authority
- NCR/CAPA closure authority
- Void authority
- Document approval authority
- Document effective-date policy
- Equipment behavior when calibration overdue
- RPO / RTO
- Retention periods

Unresolved sensitive behavior defaults to DENY/BLOCKED until approved.

---

# 13. Agent Working Rules

قبل أي مهمة:

1. اقرأ هذا الملف كاملًا.
2. اقرأ `AGENTS.md`.
3. اقرأ Foundation documents المرتبطة بالمهمة داخل `Documents/`.
4. افحص الواقع الحالي للمستودع قبل تصديق أي claim سابق.
5. افحص `.agents/skills/` واستخدم المهارة المناسبة إذا كانت موجودة.

بعد أي مهمة فعلية:

1. وثّق ما تم فعليًا فقط في أعلى هذا الملف.
2. اذكر الملفات المتأثرة.
3. اذكر verification commands/results الفعلية.
4. اذكر المشاكل المفتوحة/القيود.
5. لا تسجل خطة مستقبلية كأنها إنجاز.

---
