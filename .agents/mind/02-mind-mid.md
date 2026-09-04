# QC Operations & Laboratory Management System — Project Mind Archive

> **Status:** ARCHIVE — read-only historical project memory
> **Source:** Rotated from `01-mind-latest.md` on 2026-09-04 after the live mind exceeded the operating-size guideline.

## [2026-09-04] — تثبيت Astro كإطار رسمي في Foundation documents

### تم التنفيذ
- `Documents/QC-SYSTEM-DESIGN-CONSTITUTION.md`: أُضيف تثبيت Astro كـWeb Framework رسمي مع server output + Node adapter (on-demand rendering / Actions / Sessions)، واستُبدل مثال `React Component → Database` بـ`Astro Component / UI Component / Client Island → Database`، وحُدّث مسار القسم 14 ليبدأ بـ`Astro Page / UI Component / Client Island → Astro Action / API Endpoint`.
- `Documents/DOMAIN-MAP.md`: أُضيف قسم Delivery Layer في §2 يثبت أن `src/pages/` و`src/actions/` و`src/middleware.ts` هي Delivery Layer فقط و`src/modules/` مالك الـBusiness Logic.
- `Documents/PERMISSION-MATRIX.md`: أُضيف قسم فرعي بعد §2 يثبت أن middleware يثبت session/user context في locals فقط، وكل Action/API endpoint يعيد authorization بنفسه (Astro Actions public endpoints).
- `Documents/STATE-MACHINES.md`: حُدّث SM-GEN-002 من `UI / API` إلى `Astro Page / Astro Action / API Endpoint` بدون أي تغيير على State Machines.
- `README.md`: أُضيف قسم Technology Baseline (Astro + server rendering + Node adapter + PostgreSQL + Modular Monolith + Default Deny) مع ملاحظة أن static-only لا يناسب النظام.
- `DATA-MODEL.md` و`DATA-DICTIONARY.md`: لم تُغيَّر — PostgreSQL/UUID/snapshots/transactions مستقلة عن الـFramework.

### الملفات المتأثرة
- `.agents/mind/01-mind-latest.md`
- `Documents/QC-SYSTEM-DESIGN-CONSTITUTION.md`
- `Documents/DOMAIN-MAP.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/STATE-MACHINES.md`
- `README.md`

### التحقق
- فحوص `rg` أكدت وجود النصوص الجديدة في الوثائق المطلوبة ✅
- `rg -F "UI / API" Documents/STATE-MACHINES.md` → لا نتائج ✅
- `rg -F "React Component" Documents README.md` → لا نتائج ✅
- `git diff --quiet -- Documents/DATA-MODEL.md Documents/DATA-DICTIONARY.md` → لم يتغير الملفان ✅
- `git diff --check` على الملفات المتأثرة → نظيف ✅
- لم يُشغّل build أو tests لأن التغيير توثيقي فقط.

### النتيجة
- **الحالة:** نجح
- **مختصر:** تثبيت Astro server-rendered كـFoundation في الوثائق المعتمدة بدون تغيير أي Business Rule أو State Machine.

### القيود / المتبقي
- هذا تحديث Foundation توثيقي؛ لم يُنشأ بعد تطبيق Astro أو Node adapter أو PostgreSQL runtime.
- تغييرات `AGENTS.md` و`.claude/AGENTS.md` و`.clinerules/` موجودة في working tree خارج نطاق هذه المهمة ولم تُعدَّل.

---

## [2026-09-04] — Reset project mind for new QC system

### تم التنفيذ
- أُلغي الاعتماد على mind/brain الموروث من BRIGHTAI و`apps/qc-task-manager` القديم.
- أُنشئ هذا الملف كذاكرة حية خاصة بمستودع `YEEEAE/QC-Operations-Laboratory-Management-System` فقط.
- ثُبتت القرارات الحالية: Astro server-rendered/on-demand + Modular Monolith + PostgreSQL.
- ثُبت `Documents/` كمصدر Foundation للمواصفات.
- ثُبتت قاعدة evidence-before-claims وعدم اختراع scientific/policy decisions.

### الملفات المتأثرة
- `.agents/mind/01-mind-latest.md`
- إزالة `.agents/mind/02-mind-mid.md`
- إزالة `.agents/mind/03-mind-earliest.md`
- إزالة `.agents/brain.md`

### التحقق
- Repository state verification مطلوب بعد اكتمال تحديث AGENTS.

### النتيجة
- **الحالة:** IN PROGRESS أثناء هذا السجل إلى أن يتم التحقق النهائي من AGENTS والـmind paths.

---

## Mind Maintenance

هذا الملف archive للقراءة فقط. السجل الحي هو `01-mind-latest.md`.

---

## Archived operating notes from the live mind

### Git Safety

- لا `git push` أو `git commit` بدون طلب صريح.
- لا `git reset --hard` أو حذف ملفات المستخدم.
- لا secrets في الكود أو ملفات الـmind.

### Verification Rule

لا يوجد claim عن fix أو readiness بدون evidence حالي مناسب: repository inspection، typecheck/lint، tests، build، وE2E/migration checks حسب نطاق التغيير.

### Prior Foundation Work Queue

كانت الخطوة التالية بعد إغلاق Foundation metadata هي Astro/PostgreSQL scaffolding، ثم auth/authz/audit، ثم domains وUAT/readiness evidence. تم إنجاز Astro/Render baseline في سجل MASTER-001 الحي؛ تفاصيل النطاق المتبقي توجد في السجل الحي والـFoundation documents.
