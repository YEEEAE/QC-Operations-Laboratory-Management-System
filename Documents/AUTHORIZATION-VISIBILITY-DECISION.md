# AUTHORIZATION-VISIBILITY-DECISION.md

# QC Operations & Laboratory Management System

## Universal Page Visibility & Owner-Exclusive Administration — v1.0

**Status:** FOUNDATION — APPROVED  
**Date:** 2026-09-09  
**Decision owner:** Product/System Owner (`yazeed`)

---

# 1. Context

المطلوب التشغيلي المعتمد هو أن كل عضو نشط ومسجل دخوله يقدر يشوف صفحات النظام ويتنقل بينها بشكل طبيعي، بدون إخفاء أقسام العمل حسب الدور.

يوجد استثناءان فقط يجب ألا يظهرا أو يفتحا لأي عضو آخر:

1. صحة النظام والتفاصيل التقنية.
2. إدارة الأعضاء والأدوار والصلاحيات والنطاقات.

---

# 2. Decision

## AVD-001 — Universal Operational Page Visibility

كل حساب `ACTIVE` ومصادق عليه يحصل على **Page Visibility / Page Access** لكل صفحات التشغيل العادية، وتشمل:

```text
Dashboard
Tasks
Quality: Findings / NCR / RCA / CAPA
Quarantine: dashboard / receiving / inspections / reference administration view
Laboratory
Assets: equipment / calibration / maintenance
Documents
Approvals queue
Change Requests
Reports
AI Advisory
Audit History
Backups catalog/posture
Notifications
Search
Own Account
```

## AVD-002 — فصل صفحات المالك والإدارة

صفحة صحة النظام حصرية على `SYSTEM_OWNER` المرتبط بحساب الدخول `yazeed`، بينما مساحات الإدارة التالية متاحة لدور `Admin` ولهذا الحساب:

```text
/admin
/admin/users
/admin/users/new
/admin/users/[userId]
/admin/roles
/admin/roles/[roleId]
/admin/permissions
/admin/scopes
```

بالنسبة لمسارات الإدارة، أي حساب لا يحمل دور `Admin` ولا يمثل `yazeed` تكون النتيجة:

```text
Navigation visibility: HIDDEN
Direct route access: DENY
Mutation/action access: DENY
```

## AVD-003 — Visibility Is Not Mutation Authority

رؤية الصفحة لا تعطي تلقائيًا صلاحية `Create` أو `Edit` أو `Submit` أو `Review` أو `Approve` أو `Reject` أو `Release` أو `Sign` أو `Void` أو `Restore` أو تغيير الصلاحيات أو إدارة المستخدمين.

كل action يبقى خاضعًا لـ:

```text
Permission + Scope + Entity + State + SoD + Version + Business Rule
```

## AVD-004 — Universal Operational Data Read Access

كل حساب `ACTIVE` ومصادق عليه يقدر يقرأ كل بيانات السجلات التشغيلية في الصفحات العادية على مستوى النظام، بما فيها القوائم والتفاصيل والبحث والتقارير وسجل التدقيق التشغيلي وكتالوج النسخ الاحتياطية.

هذا السماح خاص بـ`VIEW/READ` فقط. أي mutation أو controlled action يبقى permission/state/policy-aware.

الاستثناءات التي لا تدخل في القراءة العامة:

```text
Passwords and password hashes
Session tokens and security evidence
Secrets and provider credentials
Raw infrastructure diagnostics
Member security administration data
Role / Permission / Scope administration data
Any field explicitly classified as secret or security-restricted
```

## AVD-005 — Owner Identity

الحصرية تُربط بـ`SYSTEM_OWNER` كـsecurity principal حصري، وليس بمقارنة نصية مبعثرة مع اسم المستخدم داخل الصفحات. أمر التعيين التشغيلي يضمن أن المالك النشط الوحيد هو حساب `yazeed`.

---

# 3. Alternatives Considered

- **Role-based page hiding:** رُفض لأن قرار المنتج هو تمكين كل الأعضاء من اكتشاف صفحات العمل وفهم النظام كاملًا.
- **إعطاء Admin العادي صحة النظام:** رُفض لأن صحة النظام تخص المالك وحده؛ أما إدارة الأعضاء والأدوار والصلاحيات والنطاقات فمسموحة لـAdmin ضمن التفويض المضبوط.
- **إعطاء كل الأفعال مع رؤية الصفحة:** رُفض لأنه يلغي Separation of Duties وstate machines.

---

# 4. Security and UX Impact

- تقل مشكلة الصفحات المختفية وصعوبة اكتشاف وظائف النظام.
- كل السجلات التشغيلية العادية متاحة للقراءة لكل عضو نشط، بينما الأسرار وبيانات إدارة الهوية تبقى محمية.
- تبقى الأفعال الحساسة مخفية أو read-only أو مرفوضة حسب permission/state/policy.
- تفاصيل health وإدارة الهوية لا تتوسع خارج مالك النظام.
- لا يجوز للواجهة أن توحي أن مجرد رؤية الصفحة تعني القدرة على تنفيذ كل ما فيها.

---

# 5. Required Verification

```text
Every ACTIVE authenticated non-owner:
  all ordinary navigation items visible
  all ordinary page routes resolve
  all ordinary operational records are readable
  secrets and identity-security data remain hidden
  unauthorized actions remain denied server-side
  /system/health denied
  /admin and /admin/* visible only with explicit Admin permissions

SYSTEM_OWNER yazeed:
  all ordinary pages visible
  /system/health visible and authorized
  /admin and /admin/* visible and authorized

Anonymous/inactive account:
  protected routes denied or redirected safely
```

---

# 6. Supersession Rule

هذا القرار أحدث من الجداول القديمة التي كانت تربط رؤية صفحات التشغيل بالدور. عند التعارض في **page visibility/page access** يفوز هذا المستند.

لا ينسخ هذا القرار permissions الخاصة بالـactions ولا يغيّر أي scientific أو approval أو release policy.
