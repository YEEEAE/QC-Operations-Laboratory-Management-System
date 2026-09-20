# Documents/ — مستندات النظام الرسمية

هذا المسار هو المرجع الرسمي والموثوق لجميع مستندات نظام إدارة عمليات ضبط الجودة والمختبرات
(QC Operations & Laboratory Management System). كل ملف هنا يشرح كيفية عمل النظام وبنائه
وتكامله وتصميمه وربط أجزائه وصلاحيات المستخدمين وسير عمل الرفض (Reject) — والترتيب بينها:

> **أولوية الاستخدام:** الكود الحالي و`db/migrations/` وسجل المسارات في `src/` هي المصدر الفعلي
> للسلوك. هذه المستندات تشرح العقود والقرارات المعتمدة، ويجب أن تبقى متوافقة مع الواقع الحالي.
> المفهرس الرسمي: `DOCUMENTATION-INVENTORY.md` — راجعه أولًا لمعرفة تصنيف كل مستند (معتمد /
> مرجعي / تاريخي) قبل استخدامه كدليل.

## ماذا يوجد هنا

| المحور | المستندات |
| --- | --- |
| **كيف يعمل النظام** (المجال، القواعد، الحالات) | `BUSINESS-RULES.md`, `SYSTEM-INVARIANTS.md`, `DOMAIN-MAP.md`, `STATE-MACHINES.md`, `DATA-MODEL.md`, `DATA-DICTIONARY.md` |
| **كيف يُبنى ويُشغّل** (تطوير، تشغيل، نشر) | `LOCAL-DEVELOPMENT.md`, `TESTING.md`, `TESTING-STRATEGY.md`, `RENDER-DEPLOYMENT.md`, `RENDER-DATABASE-CONNECTION.md`, `RENDER-MIGRATION-RUNBOOK.md`, `RELEASE-RUNBOOK.md`, `AI-PROVIDERS.md`, `BACKUP-RECOVERY-PLAN.md`, `F11-BACKUP-RECOVERY-RUNBOOK.md`, `RESTORE-DRILL-RUNBOOK.md`, `INCIDENT-QUICK-REFERENCE.md`, `INITIAL-ADMIN-BOOTSTRAP.md` |
| **التصميم المعماري** (البنية، الطبقات، الأخطاء، المراقبة) | `ARCHITECTURE-SPECIFICATION.md`, `DATABASE-ARCHITECTURE.md`, `DEPLOYMENT-ARCHITECTURE.md`, `ERROR-ARCHITECTURE.md`, `OBSERVABILITY-ARCHITECTURE.md`, `SECURITY-ARCHITECTURE.md`, `THREAT-MODEL-030.md` |
| **الواجهة والتجربة** | `DESIGN-SYSTEM.md`, `UI-UX-SPECIFICATION.md`, `UX-WRITING-GUIDE.md`, `AUTHORIZATION-VISIBILITY-DECISION.md` |
| **الصلاحيات والأدوار** (من يفعل ماذا) | `ROLE-MATRIX.md`, `PERMISSION-MATRIX.md`, `AUTHORIZATION-VISIBILITY-DECISION.md` — مع `ROUTE-MATRIX.md` و`ROUTE-MANIFEST-SPECIFICATION.md` لربط المسارات بالأدوار |
| **الرفض (Reject)** (سير عمل الرفض وتقاريره) | `REJECT-REPORTS.md`, `STATE-MACHINES.md` |
| **التخطيط والحوكمة** (المتطلبات، المخاطر، الاستعداد) | `REQUIREMENTS-TRACEABILITY.md`, `UAT-ACCEPTANCE-PLAN.md`, `RISK-REGISTER.md`, `PRODUCTION-READINESS-CHECKLIST.md`, `PRODUCT-ANALYTICS-MEASUREMENT-PLAN.md`, `QC-SYSTEM-DESIGN-CONSTITUTION.md` |
| **التوسعة** (كيف تضيف ميزة/مسار/جدول) | `EXTENDING-THE-SYSTEM.md`, `ROUTE-MATRIX.md`, `db/migrations/README.md` |


## الملفات خارج هذا المسار المرتبطة به

- `README.md` (جذر المستودع) — مدخل المنتج.
- `AGENTS.md` و`.agents/AGENTS.md` (جذر المستودع) و`.agents/mind/01-mind-latest.md` — قواعد التشغيل وذاكرة المشروع.
- `db/migrations/README.md` — عقد قاعدة البيانات والهجرات.
- `audit/` — سجلات التدقيق المرتبطة بتاريخها وليست وثائق الحالة الحالية.
- عقود تنفيذية: `.github/workflows/ci.yml`, `render.yaml`, `package.json`,
  `astro.config.mjs`, `playwright.config.ts`, `vitest.config.ts`, `tsconfig.json`.

## قاعدة التحديث

عند تغيير سلوك فعلي (مسار، صلاحية، حالة، جدول، تكامل)، حدّث المستند المعني هنا في نفس
التغيير، وتأكد أن `ROUTE-MATRIX.md` مشتق من سجل المسارات القانوني وليس معدّلًا يدويًا.
