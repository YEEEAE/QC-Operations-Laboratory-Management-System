# DESIGN-SYSTEM.md

# QC Operations & Laboratory Management System
## Unified Dark Enterprise Design System — v1.0

**Document Path:** `Documents/DESIGN-SYSTEM.md`  
**Status:** FOUNDATION — APPROVED DESIGN SYSTEM BASELINE  
**Product:** QC Operations & Laboratory Management System  
**Visual Direction:** Dark Enterprise QC Operations / Control Room  
**Reference Intent:** Inspired by the operational-control-room logic of the previously approved OpsPulse-style direction, but adapted specifically to this QC/Laboratory product and never copied literally  
**Theme:** Dark-first / Dark-only baseline for v1  
**Primary Latin Typeface:** Inter  
**Primary Arabic Typeface:** IBM Plex Sans Arabic  
**Default Density:** Standard  
**Data-Dense Density:** Compact  
**Dashboard Style:** Operational command center with scoped KPIs, charts, alerts, approvals and activity  

---

# 1. Purpose

هذه الوثيقة تحدد اللغة البصرية الرسمية للنظام كاملًا.

هي لا تحدد كل field أو section أو workflow لكل صفحة.

القاعدة الأساسية:

```text
Design System
→ يحدد اللغة البصرية والمكونات والـtokens والسلوك العام

Template Family
→ يحدد الهيكل العام لنوع الصفحة

UI-UX-SPECIFICATION.md
→ يحدد التفاصيل الفعلية لكل صفحة حسب الـDomain والـBusiness Rules والـPermissions والـState Machine
```

بالتالي:

> **الـTemplates ليست صفحات نهائية ولا تُنسخ حرفيًا.**

كل صفحة تتكيف مع احتياجات نظام QC الفعلية.

---

# 2. Authority Chain

```text
SYSTEM-INVARIANTS.md
        ↓
QC-SYSTEM-DESIGN-CONSTITUTION.md
        ↓
DOMAIN-MAP.md
        ↓
BUSINESS-RULES.md
        ↓
ROLE-MATRIX.md
        ↓
PERMISSION-MATRIX.md
        ↓
STATE-MACHINES.md
        ↓
DATA-MODEL.md
        ↓
DATA-DICTIONARY.md
        ↓
ARCHITECTURE-SPECIFICATION.md
        ↓
SECURITY-ARCHITECTURE.md
        ↓
DATABASE-ARCHITECTURE.md
        ↓
ERROR-ARCHITECTURE.md
        ↓
TESTING-STRATEGY.md
        ↓
RISK-REGISTER.md
        ↓
DESIGN-SYSTEM.md
        ↓
UI-UX-SPECIFICATION.md
```

إذا كان التصميم جميلًا لكنه يخالف Business Rule أو Authorization أو State Machine، فالتصميم هو الخطأ.

---

# 3. Core Design Principle

> **Operational clarity before decoration.**

النظام يجب أن يبدو:

```text
Enterprise
Controlled
High-trust
Modern
Data-rich
Calm
Precise
Operational
```

ولا يجب أن يبدو:

```text
Gaming dashboard
Marketing landing page
Crypto dashboard
Over-animated concept UI
Generic admin template
Copied Dribbble shot
```

---

# 4. Approved Visual Direction

المعتمد هو:

> **Unified Dark Enterprise QC Control Room**

خصائصه:

- خلفية داكنة هادئة.
- Surfaces متعددة المستويات بدل أسود مسطح.
- Borders خفيفة وواضحة.
- Cards منظمة وليست مبالغًا فيها.
- Semantic status colors محسوبة.
- Charts بنفس هوية النظام.
- Tables واضحة وعالية الكثافة عند الحاجة.
- Forms مريحة للقراءة والعمل الطويل.
- Command-center feeling في Dashboard فقط بالقدر المناسب.
- الصفحات الداخلية تبقى بنفس الألوان والهوية، لكن الـlayout يتغير حسب العمل.

---

# 5. Theme Policy

Canonical v1 theme:

```text
DARK
```

كل الصفحات الأساسية تستخدم نفس dark palette.

Light theme:

```text
DEFERRED
```

ولا يتم بناء تصميمين متوازيين قبل إثبات الحاجة.

---

# 6. Color Foundation

## Canvas

```text
--color-canvas:            #141714
--color-canvas-deep:       #101310
--color-sidebar:           #111411
```

## Surfaces

```text
--color-surface-1:         #1B1F1B
--color-surface-2:         #222722
--color-surface-3:         #2A302A
--color-surface-hover:     #303630
--color-surface-selected:  #273128
```

## Borders

```text
--color-border-subtle:     #2D332D
--color-border-default:    #3A413A
--color-border-strong:     #505850
```

## Text

```text
--color-text-primary:      #F2F4F1
--color-text-secondary:    #B8BEB7
--color-text-muted:        #858C85
--color-text-disabled:     #626862
--color-text-inverse:      #151815
```

---

# 7. Brand / Operational Accent

Primary QC accent:

```text
--color-accent-primary:        #6D9E67
--color-accent-primary-hover:  #7FB176
--color-accent-primary-muted:  #314631
```

Accent يستخدم في:

```text
Current navigation
Primary selected state
Key chart emphasis
Focus-adjacent highlights
Primary non-destructive CTA
```

ولا يستخدم لتلوين كل شيء.

---

# 8. Semantic Status Colors

Semantic colors لها معنى ثابت.

## Positive / Approved

```text
--status-approved:      #6FA66D
--status-approved-bg:   #233424
```

## Inspection PASS

```text
--status-pass:          #79AF70
--status-pass-bg:       #253A25
```

## Released

```text
--status-released:      #4F9B91
--status-released-bg:   #1F3532
```

## Hold / Attention

```text
--status-hold:          #D2A24B
--status-hold-bg:       #3B3020
```

## Warning / Due Soon

```text
--status-warning:       #C9903D
--status-warning-bg:    #382B1D
```

## Fail / Rejected / Critical

```text
--status-danger:        #C96666
--status-danger-bg:     #3B2323
```

## Review / Informational

```text
--status-review:        #6D8DBB
--status-review-bg:     #222E3E
```

## Draft / Neutral

```text
--status-neutral:       #8A918A
--status-neutral-bg:    #2B2F2B
```

---

# 9. PASS ≠ RELEASED

قاعدة تصميم رسمية:

> **Inspection PASS وRelease System State لا يستخدمان نفس visual token.**

حتى لو كلاهما إيجابي:

```text
PASS
→ green operational result

RELEASED
→ teal release/system-state result
```

ويجب دائمًا إظهار النص/label، وعدم الاعتماد على اللون وحده.

---

# 10. Color Semantics Rule

```text
Green
→ approved / healthy / passed

Teal
→ released / release-state positive

Amber
→ hold / attention / due / pending risk

Red
→ fail / rejected / blocked / critical

Blue
→ information / review / in-progress governance

Gray
→ draft / inactive / neutral / archived context
```

لا يتم استخدام semantic colors كزينة.

---

# 11. Accessibility of Color

ممنوع الاعتماد على اللون وحده.

كل status مهم يحتاج أحد أو أكثر من:

```text
Text label
Icon
Pattern / shape
Position
Accessible description
```

---

# 12. Typography

## English / Latin

```text
Inter
```

## Arabic

```text
IBM Plex Sans Arabic
```

الهدف:

- وضوح عالي.
- أرقام وبيانات سهلة القراءة.
- دعم عربي احترافي.
- عدم استخدام display fonts زخرفية في العمليات.

---

# 13. Typography Scale

```text
Display / Dashboard hero metric:  32–40px
Page title:                       24–30px
Section title:                    18–22px
Card title:                       15–17px
Body:                             14–16px
Table body:                       13–14px
Metadata / caption:               12–13px
```

القيم النهائية تضبط بالتنفيذ والاختبارات البصرية.

---

# 14. Font Weight

```text
400 Regular
500 Medium
600 Semibold
700 Bold — limited use
```

لا نستخدم Bold بكثافة في كل النصوص.

---

# 15. Numeric Typography

KPIs والقياسات والـIDs الرقمية تستخدم tabular numerals حيث مناسب.

خصوصًا:

```text
Measurements
Quantities
Percentages
Dates/times
Dashboard KPIs
Business counters
```

---

# 16. Arabic / RTL

التصميم يجب أن يدعم:

```text
LTR
RTL
```

ولا يتم عمل RTL عن طريق `text-align:right` فقط.

يجب مراعاة:

```text
Logical properties
Navigation direction
Icons with directional meaning
Tables
Breadcrumbs
Drawers
Form label alignment
Charts/tooltips
```

---

# 17. Spacing Scale

Base spacing unit:

```text
4px
```

Canonical scale:

```text
4
8
12
16
20
24
32
40
48
64
```

---

# 18. Layout Rhythm

Default page rhythm:

```text
Page padding: 24–32px desktop
Section gap: 24–32px
Panel internal padding: 16–24px
Compact table controls: 8–12px
```

Exact values adapt responsively.

---

# 19. Radius

Canonical radius family:

```text
Small:   6px
Medium:  10px
Large:   14px
XL:      18px
```

Cards لا تكون overly rounded.

---

# 20. Shadow / Elevation

Dark UI يعتمد أكثر على:

```text
Surface difference
Border
Subtle shadow
```

ولا يستخدم heavy floating shadows.

Elevation levels:

```text
0 — page surface
1 — panel/card
2 — popover/dropdown
3 — modal/drawer
```

---

# 21. Density Modes

Canonical density modes:

```text
COMFORTABLE
STANDARD
COMPACT
```

## Dashboard

```text
STANDARD
```

## Lab grids / high-volume tables

```text
COMPACT
```

## Forms / approvals

```text
COMFORTABLE or STANDARD
```

Density لا تغير information hierarchy الأساسية.

---

# 22. App Shell

Desktop shell:

```text
┌───────────────┬──────────────────────────────────┐
│ Sidebar       │ Top Context Bar                  │
│               ├──────────────────────────────────┤
│               │ Page Content                     │
│               │                                  │
└───────────────┴──────────────────────────────────┘
```

Sidebar ثابتة/قابلة للطي حسب viewport.

---

# 23. Sidebar

تحتوي navigation حسب product domains:

```text
Dashboard
Tasks
Quality
Quarantine
Laboratory
Equipment
Documents
Approvals
Change Requests
Reports
Administration
System / Health
AI Advisory where enabled
```

Visibility حسب permission/scope، لكنها ليست authorization boundary.

---

# 24. Navigation Grouping

استخدم grouping بدل قائمة طويلة مسطحة.

مثال:

```text
OPERATIONS
Dashboard
Tasks
Quarantine
Laboratory

QUALITY
Findings / NCR / RCA / CAPA
Approvals
Documents

ASSETS
Equipment / Calibration / Maintenance

INSIGHTS
Reports

SYSTEM
Administration
Health / Backup
```

Final labels/routes تأتي من Route Manifest/UI-UX Specification.

---

# 25. Top Context Bar

يمكن أن تحتوي حسب الصفحة:

```text
Breadcrumb / current context
Global search
Scope/site context
Notifications
My Approvals shortcut
User menu
```

لا نحولها إلى marketing header.

---

# 26. Dashboard Principle

Dashboard هو:

> **Operational Command Center**

وليس gallery من الرسوم.

يجب أن يجيب بسرعة:

```text
What needs attention?
What is blocked?
What is due?
What changed?
What needs my approval?
What is the operational trend?
```

---

# 27. Dashboard Role Awareness

Dashboard data/components تعتمد على authorized role + permission + scope.

Examples:

## Employee

```text
My Tasks
My Drafts
Assigned Inspections
Tests requiring action
Recent personal activity
```

## Supervisor

```text
Team queue
Pending review
HOLD items
Open findings
Upcoming calibration concerns
```

## Manager

```text
Operational KPIs
Approval backlog
Open NCR/CAPA
Release/quality attention
Trend summaries
```

## Admin

```text
System health
Accounts/configuration requiring action
Backup/operational status
```

Admin dashboard لا يتحول إلى business approval dashboard تلقائيًا.

---

# 28. Dashboard Layout Family

Recommended composition:

```text
Context header
↓
Primary operational KPI strip
↓
Attention Required / Critical Alerts
↓
Main trend / throughput visualizations
↓
Pending Approvals + Holds / Exceptions
↓
QC / Lab / Calibration Pulse
↓
Recent Activity / Audit-aware operational timeline
```

Exact widgets حسب role/scope.

---

# 29. Dashboard KPI Cards

Metric Card anatomy:

```text
Label
Current value
Delta / trend if meaningful
Scope/time context
Micro status indicator
Optional mini sparkline
```

ممنوع KPI بدون تعريف واضح أو source.

---

# 30. KPI Integrity

KPIs:

- محسوبة server-side.
- Scope-aware.
- لا تعتمد browser-side raw data aggregation للحقيقة الرسمية.
- تعرض date range/context.
- توضح إن كان الرقم current snapshot أو trend.

---

# 31. Chart Palette

Charts تستخدم palette من نفس هوية النظام.

Base chart sequence:

```text
QC Green
Operational Teal
Review Blue
Amber
Muted Gray
Danger Red only when semantically appropriate
```

لا نستخدم rainbow palette.

---

# 32. Chart Rules

- لا 3D charts.
- لا pie chart إذا bar/stacked bar أوضح.
- لا أكثر من المعلومات التي يمكن تفسيرها.
- Axes/labels/tooltips واضحة.
- Color legend لا تعتمد اللون وحده عند critical meaning.
- Zero-baseline where statistically/semantically appropriate.
- No decorative animation that delays reading.

---

# 33. Preferred Visualizations

Use primarily:

```text
Line chart
Area chart — light use
Bar chart
Stacked bar
Horizontal bar
Donut only for simple part-to-whole
Sparkline
Progress / target indicator
Status distribution
Timeline
```

---

# 34. Data Visualization Context

كل chart يجب أن يوضح:

```text
Title
Time range
Scope
Unit
Legend where needed
Last updated when relevant
```

---

# 35. Cards

لا نستخدم “card لكل شيء”.

Canonical families فقط:

```text
Metric Card
Status Card
Action Card
Data Panel
```

---

# 36. Metric Card

للـKPIs والأرقام.

لا تحتوي paragraph طويل.

---

# 37. Status Card

للحالات التشغيلية مثل:

```text
Calibration status
System health
Quarantine attention
Approval backlog
```

---

# 38. Action Card

تستخدم عندما المستخدم يحتاج action واضح مرتبط بسياق.

لا تستخدم كبديل للجدول أو form.

---

# 39. Data Panel

Container أساسي لـ:

```text
Tables
Charts
Timeline
Details
Forms
Evidence
```

وهو أكثر component استعمالًا من cards التسويقية.

---

# 40. Table Principle

الجداول عنصر أساسي في النظام.

يجب أن تكون:

```text
Dense when needed
Readable
Sortable where valid
Filterable server-side
Keyboard-friendly
Scope-aware
Stable
```

---

# 41. Table Anatomy

```text
Table title / context
Optional KPI or count
Toolbar
Filters
Columns
Rows
Row status
Row actions
Pagination / cursor control
```

---

# 42. Table Row Actions

Primary row click يفتح record detail حيث مناسب.

Overflow menu للإجراءات الأقل استخدامًا.

Critical actions مثل Approve/Release/Delete-like lifecycle actions لا تُدفن بدون context أو confirmation/ceremony المطلوبة.

---

# 43. Table Status Display

Status badge:

```text
Icon + Label + Semantic styling
```

لا لون فقط.

---

# 44. Table Selection

Bulk selection يظهر فقط إذا العملية:

- allowed by business rule.
- supported safely.
- authorization/state semantics معروفة.

لا يوجد bulk approval/release تلقائيًا.

---

# 45. Filters

Filter bar تستخدم:

```text
Search
State
Date range
Assignee/owner
Scope/site
Domain-specific filters
```

لكن لا تعرض عشرات filters بنفس القوة بصريًا.

Advanced filters داخل expandable panel عند الحاجة.

---

# 46. Forms Principle

Forms في QC لازم تكون:

```text
Precise
Structured
Low ambiguity
Keyboard-friendly
Validation-aware
Safe under long data entry
```

---

# 47. Form Layout

Prefer:

```text
Sectioned form
2-column desktop where fields naturally pair
1-column for complex/critical input
Sticky action footer when form long and appropriate
```

---

# 48. Labels

Labels دائمًا visible للبيانات المهمة.

Placeholder ليس بديلًا عن label.

---

# 49. Required Fields

Required indication واضحة لكن غير مزعجة.

Validation لا تظهر فقط بعد full submit إذا يمكن اكتشافها مبكرًا بأمان.

---

# 50. Validation UI

Field error:

```text
Red semantic indicator
Readable text
Error icon where useful
ARIA linkage
```

Form summary للأخطاء الكبيرة/المتعددة.

---

# 51. Measurement Inputs

Lab/inspection measurement input يجب أن يوضح:

```text
Field name
Unit
Precision expectation if approved
Source/method context where needed
Raw vs calculated value distinction
```

لا نخترع precision في الـUI.

---

# 52. Buttons

Button hierarchy:

```text
Primary
Secondary
Tertiary / Ghost
Destructive
Critical Controlled Action
```

---

# 53. Primary Button

للـmain safe action في السياق.

مثال:

```text
Save Draft
Create Record
Continue
```

---

# 54. Controlled Action Button

Actions مثل:

```text
Approve
Release
Sign
Void
Close
```

لا تعامل كأي button عادي.

تحتاج حسب Business/Security Rules:

```text
Clear meaning
Current state/version context
Confirmation / reason
E-Signature / reauthentication where required
```

---

# 55. Destructive Visuals

Red لا يستخدم للـprimary brand action.

يخصص للأفعال الخطرة أو الحالات السلبية.

---

# 56. Status Badges

Canonical badge anatomy:

```text
Small icon / dot
Label
Semantic foreground
Muted semantic background
Border or subtle ring
```

---

# 57. Tags vs Status

Tags للتصنيف.

Status badges للحالة التشغيلية.

لا نستخدم نفس component semantics للاثنين إذا يؤدي لالتباس.

---

# 58. Alerts

Alert levels:

```text
Info
Success
Warning
Danger
Blocking
```

Blocking alert يوضح:

```text
What is blocked
Why at safe level
What user can do next
```

---

# 59. Toasts

Toasts مناسبة لـ:

```text
Save succeeded
Non-critical background completion
Small confirmation
```

غير مناسبة كالمكان الوحيد لـ:

```text
Critical validation
Approval failure
Release failure
Long-term blocking status
```

---

# 60. Empty States

Empty state يجب أن يفرق بين:

```text
No data exists
No data matches filters
No permission-visible data
Data failed to load
```

ولا يكشف unauthorized existence.

---

# 61. Loading States

Use:

```text
Skeleton for content structure
Progress indicator for explicit operation
Inline loading for button/action
```

لا نستخدم full-page spinner لكل شيء.

---

# 62. Error States

تتبع `ERROR-ARCHITECTURE.md`.

Known error:

```text
Specific recovery guidance
```

Unexpected error:

```text
Safe message + requestId/reference
```

---

# 63. Stale Version UI

`CONFLICT_STALE_VERSION` يظهر كحالة واضحة:

```text
Record changed since you opened it
Refresh/review required
No silent overwrite
```

ولا يعرض generic toast فقط.

---

# 64. Modal / Dialog

Modal تستخدم لـ:

```text
Focused confirmation
Short forms
Controlled action ceremony
```

لا نضع صفحات كاملة داخل modal.

---

# 65. Drawers

Drawer مناسبة لـ:

```text
Record preview
Filters
Contextual details
Quick evidence preview
```

وليست بديلًا دائمًا عن detail page.

---

# 66. Tabs

Tabs تستخدم فقط إذا الأقسام peers لنفس record.

Examples:

```text
Overview
Details
Evidence
Approvals
History
```

لا تستخدم tabs لإخفاء linear required workflow.

---

# 67. Timeline

Timeline component مهم لـ:

```text
Audit history
Quality case progression
Equipment history
Approval history
Document version history
```

ويفرق بصريًا بين:

```text
Business event
Approval
System event
Security-relevant event where appropriate
```

---

# 68. Evidence Component

Evidence/attachments تعرض:

```text
Filename
Type
Size
Uploaded by
Uploaded at
Linked record/context
Verification/security state if implemented
```

والتحميل يمر authorization server-side.

---

# 69. Record Header

Canonical record header قد يحتوي:

```text
Breadcrumb
Business ID
Title / descriptor
Primary State
Secondary State where domain requires
Version
Owner/assignee
Primary allowed actions
```

---

# 70. Multi-State Domains

عندما Domain فيه أكثر من state axis، لا نضغطها في status واحد.

مثال Quarantine:

```text
Receiving Workflow State
Inspection Result
Release System State
```

كل واحدة تظهر كحقيقة مستقلة.

---

# 71. Template Family Principle

المعتمد:

> **Shared Design System → Multiple Template Families → Domain-specific composition → Page-specific workflow.**

لا يوجد Template واحد ينسخ على 20 صفحة.

---

# 72. Template Family 1 — Executive / Operations Dashboard

مناسب لـ:

```text
Dashboard
Selected System Health views
High-level operational overview
```

Composition:

```text
Context
KPI strip
Attention Required
Trends
Approvals / Holds / Exceptions
Domain pulse
Recent activity
```

---

# 73. Template Family 2 — Operational List / Work Queue

مناسب لـ:

```text
Tasks
Receiving Items
Inspection Reports
Lab Tests
Findings
NCR
CAPA
Equipment
Documents
```

Composition:

```text
Page title + scope
Summary metrics where useful
Filter/search toolbar
Saved/quick views where useful
Primary table/list
Bulk actions only when approved
Optional detail preview
```

---

# 74. Template Family 3 — Record Workspace

مناسب لصفحات detail.

Composition:

```text
Record header
Primary actions
Main content
Context rail
Tabs/sections
Evidence
Approvals
History
```

Exact sections per Domain.

---

# 75. Template Family 4 — Laboratory Execution Workspace

Composition:

```text
Test identity
Controlled method/version
Sample context
Equipment/calibration context
Measurement grid
Criteria / calculation panel
Raw observations
Result summary
Evidence
Review readiness
```

هذه الصفحة أعلى كثافة من forms عادية.

---

# 76. Template Family 5 — Approval / Review Workspace

مناسب لـ:

```text
My Approvals
Inspection review
Lab review
Document approval
Change Request review
```

Composition:

```text
Subject/version snapshot
What changed / what is being approved
Risk/warnings
Evidence checklist
Related history
Decision panel
E-Signature ceremony where required
```

---

# 77. Template Family 6 — Quality Case Workspace

مناسب لـ:

```text
Finding
NCR
RCA
CAPA
```

Composition:

```text
Case summary
Ownership / due dates
Finding
Containment
Investigation
RCA
CAPA actions
Effectiveness / Closure
Evidence
Approvals
Timeline
```

فقط الأقسام المعتمدة فعليًا لكل lifecycle.

---

# 78. Template Family 7 — Equipment / Calibration Asset Page

Composition:

```text
Asset identity
Operational state
Calibration state
Maintenance state
Current attention items
Calibration history
Maintenance history
Certificates/evidence
Linked tests
Timeline
```

---

# 79. Template Family 8 — Controlled Documents

List/library composition:

```text
Document search/library
Type/version/status filters
Current effective version emphasis
Version history
Approval trail
Related usage/context
```

Detail page يحافظ على history وSuperseded versions بوضوح.

---

# 80. Template Family 9 — Reports / Analytics

Composition:

```text
Report title/context
Scope + date range
Filters
Summary metrics
Charts
Canonical dataset table
Export actions
```

Screen/CSV/XLSX/PDF يجب أن تعتمد dataset canonical authorized نفسها.

---

# 81. Template Family 10 — Administration

Composition:

```text
Settings navigation
Users / roles / permissions / master data
Dense tables/forms
Change warnings
Audit context
```

لا decorative charts بدون operational need.

---

# 82. Page Depth Rule

هذه الـTemplates **لا تحدد كامل تفاصيل الصفحة**.

كل صفحة فعلية قد تحتوي sections إضافية حسب:

```text
Business Rule
Permission
State
Domain Data
Historical Evidence
Approval
Audit
Attachments
Related Records
Risk
```

`UI-UX-SPECIFICATION.md` هو الوثيقة التي ستحدد كل صفحة حرفيًا.

---

# 83. Laboratory Page Example Depth

صفحة Laboratory Test النهائية يمكن أن تحتوي مثلًا:

```text
Sample identity
Test identity
Method/version
WI/SOP reference
Equipment/calibration context
Raw measurements
Calculated values
Acceptance criteria
Result
Reviewer comments
Evidence
Review
Approval
E-Signature
Audit timeline
Version/history
Related records
```

لكن لا يتم تثبيت field غير موجود في Data Dictionary/Business Rules.

---

# 84. NCR Page Example Depth

NCR قد يحتوي حسب approved lifecycle:

```text
Finding
Problem statement
Containment
Investigation
RCA
CAPA
Actions
Owners
Due dates
Effectiveness
Evidence
Approvals
Closure
History
```

Template لا يختصره إلى card + table فقط.

---

# 85. Interaction Principle

Interactions تكون:

```text
Predictable
Fast
Calm
Reversible where business allows
Explicit for controlled actions
```

---

# 86. Motion

Motion duration baseline:

```text
150–220ms
```

تستخدم لـ:

```text
Hover/focus
Drawer/modal
Status transition
Chart reveal
Small layout change
```

---

# 87. Motion Restrictions

ممنوع:

```text
Constant moving backgrounds behind operational data
Large parallax
Bouncy animations
Long celebratory effects
Animation that delays critical information
```

---

# 88. Reduced Motion

يجب احترام user/system reduced-motion preference.

Critical meaning لا يعتمد على animation.

---

# 89. Focus States

كل interactive element يحتاج focus واضح عالي التباين.

Focus ring لا يُلغى بدون بديل.

---

# 90. Keyboard Navigation

Critical workspaces يجب أن تدعم keyboard where practical، خصوصًا:

```text
Forms
Lab grids
Tables
Dialogs
Approval flows
```

---

# 91. Accessibility Baseline

الـDesign System يستهدف accessible enterprise UI.

التفاصيل النهائية في UI/UX/Testing، لكن baseline يشمل:

```text
Semantic HTML
Keyboard support
Visible focus
Labelled controls
Status not color-only
Readable contrast
Error announcements
Reduced motion
Zoom/responsive resilience
```

---

# 92. Contrast

Text/background/status combinations يجب أن يتم اختبارها آليًا ويدويًا.

لا نعتمد palette فقط لأنها تبدو جميلة على شاشة المصمم.

---

# 93. Responsive Strategy

Desktop-first operationally، لكن fully responsive.

Breakpoints النهائية implementation-dependent.

Behavior:

```text
Desktop → full sidebar / multi-column
Tablet → collapsible sidebar / reduced columns
Mobile → drawer navigation / single-column priority flow
```

---

# 94. Mobile Priority

على mobile:

- Primary state/actions تبقى ظاهرة.
- Context rail ينتقل sections.
- Tables تتحول بطريقة تحفظ المعلومات، وليس horizontal chaos فقط.
- Critical actions لا تختفي داخل obscure menu.

---

# 95. Data Table Responsive Behavior

حسب الجدول:

```text
Horizontal scroll with frozen key column
Column priority/hiding
Card-like row detail on small screens
Dedicated mobile list
```

يُختار per use case.

---

# 96. Icons

نستخدم icon family واحدة متناسقة.

الاختيار النهائي للمكتبة:

```text
DEFERRED
```

لكن style يكون:

```text
Simple
Outlined/consistent
Operational
No decorative mixed icon sets
```

---

# 97. Icon Meaning

Directional/destructive/approval icons يجب أن تكون مفهومة وترافقها labels عندما المعنى critical.

---

# 98. Microcopy

Microcopy يكون:

```text
Short
Specific
Operational
Non-ambiguous
```

Bad:

```text
Submit
```

إذا العملية actually:

```text
Submit for Review
```

نكتب المعنى الكامل.

---

# 99. Controlled Action Copy

Examples:

```text
Approve Inspection
Release Item
Return for Correction
Void Record
Submit for Review
Sign Approval
```

بدل generic:

```text
OK
Confirm
Done
```

---

# 100. AI Advisory UI

AI يظهر بصريًا كـ:

```text
Advisory
Suggestion
Insight
Draft assistance
```

وليس:

```text
Official decision
Approved result
Release authority
```

---

# 101. AI Visual Separation

AI-generated content يحتاج indicator واضح أنه AI-generated/advisory عند عرضه في controlled context.

لا يستخدم نفس visual treatment لofficial approved record بدون distinction.

---

# 102. Design Tokens

Implementation يجب أن تستخدم semantic tokens، وليس hex values داخل كل component.

Layers:

```text
Primitive tokens
→ Semantic tokens
→ Component tokens
```

---

# 103. Primitive vs Semantic Tokens

Example:

```text
Primitive green-500
    ↓
semantic.status.pass
    ↓
StatusBadge PASS
```

Components لا ترتبط مباشرة بألوان primitive عندما semantic token مناسب.

---

# 104. Component State Matrix

كل interactive component يجب أن يعرف states:

```text
Default
Hover
Focus
Active
Selected
Disabled
Loading
Error
```

حسب applicability.

---

# 105. Disabled State

Disabled control لا يستخدم لإخفاء authorization decision.

إذا action غير مصرح:

- قد لا يظهر حسب UX.
- server still denies direct invocation.

إذا disabled بسبب business state، tooltip/help يمكن أن يوضح safe reason.

---

# 106. Design System Component Baseline

Foundation components:

```text
AppShell
Sidebar
TopBar
Breadcrumb
PageHeader
MetricCard
StatusCard
ActionCard
DataPanel
DataTable
FilterBar
SearchInput
StatusBadge
Tag
Button
IconButton
Input
Textarea
Select
Combobox
DatePicker
DateRange
Checkbox
Radio
Switch — limited semantic use
FormField
FormSection
ErrorSummary
Alert
Toast
Modal
Drawer
Tabs
Accordion
Tooltip
Popover
DropdownMenu
Pagination
EmptyState
Skeleton
Progress
Timeline
EvidenceList
AttachmentUploader
RecordHeader
ContextRail
ApprovalPanel
AuditTimeline
ChartContainer
KpiSparkline
```

Exact code implementation later.

---

# 107. Switch Restriction

Switch يستخدم للـimmediate reversible boolean setting فقط.

لا يستخدم لـ:

```text
Approve
Release
PASS/FAIL
Controlled state transition
```

---

# 108. Approval Panel

Approval Panel component concept يحتوي:

```text
Subject/version
Current state
Decision options
Reason/comments if required
Warnings/SoD context
E-Signature trigger if required
```

ولا يحتوي business rule داخله؛ هو presentation layer فقط.

---

# 109. Audit Timeline Component

يعرض history ولا يسمح rewriting.

Supports:

```text
Actor
Action
Time
State transition
Reason where allowed
Version reference
```

بحسب البيانات المصرح بها.

---

# 110. Design System vs Authorization

> **The Design System may visualize permission outcomes, but it never authorizes.**

---

# 111. Design System vs Business Logic

Component لا يحسب:

```text
Official PASS/FAIL
Release eligibility
Approval authority
Scientific acceptance
SoD
```

هذه تأتي من Application/Domain.

---

# 112. Design System vs Error Logic

Component يعرض canonical errors من `ERROR-ARCHITECTURE.md`.

لا يخترع error semantics محليًا.

---

# 113. Design System vs Risk

High-risk action لازم يكون بصريًا واضح، لكن التصميم لا يخفّض risk وحده.

Risk reduction تحتاج controls + tests + evidence.

---

# 114. Dashboard Do

```text
Do show scoped operational KPIs
Do prioritize attention items
Do expose pending approvals clearly
Do use charts for trends, not decoration
Do keep role-aware content
Do show data freshness/context
Do separate PASS from RELEASED
```

---

# 115. Dashboard Don’t

```text
Don't show every available metric
Don't use giant decorative graphs
Don't show unauthorized global totals
Don't compute official KPIs in browser from hidden raw rows
Don't use rainbow colors
Don't make every section a card
```

---

# 116. Forms Do

```text
Do group related fields
Do keep labels visible
Do show units
Do preserve safe draft data
Do expose validation clearly
Do support keyboard work
```

---

# 117. Forms Don’t

```text
Don't use placeholder-only labels
Don't hide scientific context
Don't autosave controlled approved states
Don't silently normalize values that change scientific meaning
Don't submit authoritative final state from client
```

---

# 118. Tables Do

```text
Do prioritize business ID/state/context
Do support server-side filters
Do use stable status labels
Do keep actions contextual
Do support compact density where needed
```

---

# 119. Tables Don’t

```text
Don't display 30 columns by default
Don't hide required context behind tooltips
Don't use row color as only status indicator
Don't enable dangerous bulk actions by convenience
```

---

# 120. Dark UI Do

```text
Do use layered surfaces
Do preserve readable contrast
Do use subtle borders
Do keep semantic colors restrained
Do leave breathing room around critical actions
```

---

# 121. Dark UI Don’t

```text
Don't use pure black everywhere
Don't use neon glow
Don't use excessive glassmorphism
Don't place low-contrast gray text on dark gray
Don't make charts brighter than the content hierarchy
```

---

# 122. Visual Reference Rule

External references مثل Dribbble/OpsPulse تستخدم لـ:

```text
Information hierarchy inspiration
Card rhythm
Operational dashboard composition
Visual polish direction
```

ولا تستخدم لـ:

```text
Copying sections literally
Copying product semantics
Copying data labels
Copying workflow
Copying screen-by-screen structure
```

النظام النهائي مبني على QC requirements الخاصة بنا.

---

# 123. Design QA

قبل اعتماد component/page visually:

```text
[ ] Matches dark token system
[ ] Uses semantic status tokens
[ ] No raw arbitrary colors
[ ] RTL reviewed
[ ] Keyboard/focus reviewed
[ ] Contrast checked
[ ] Loading/empty/error states defined
[ ] Responsive behavior defined
[ ] Authorization not delegated to UI
[ ] Critical action meaning explicit
[ ] PASS and RELEASE separated where applicable
```

---

# 124. Dashboard QA

```text
[ ] Role/scope context visible
[ ] KPIs sourced server-side
[ ] Attention hierarchy obvious
[ ] Charts answer operational questions
[ ] Pending approvals visible when relevant
[ ] Holds/exceptions visible when relevant
[ ] Data freshness/time range visible
[ ] No unauthorized aggregate leakage
[ ] No decorative overload
```

---

# 125. Template QA

```text
[ ] Correct Template Family selected
[ ] Template adapted to Domain workflow
[ ] Page not copied from unrelated Domain
[ ] Required business sections represented
[ ] Context/evidence/history placed appropriately
[ ] High-risk actions surfaced correctly
[ ] Mobile behavior considered
```

---

# 126. Design Decision Register

## DS-001

```text
Decision:
Use a unified dark enterprise QC control-room visual language across the entire system.

Status:
APPROVED
```

## DS-002

```text
Decision:
The Dashboard follows an operational command-center model inspired by the approved OpsPulse-style concept, but adapted to this system and not copied.

Status:
APPROVED
```

## DS-003

```text
Decision:
Internal pages use the same dark palette as the Dashboard.

Status:
APPROVED
```

## DS-004

```text
Decision:
The system uses multiple Template Families rather than one repeated page template.

Status:
APPROVED
```

## DS-005

```text
Decision:
Templates define layout families only; exact page sections/content/workflows are defined in UI-UX-SPECIFICATION.md.

Status:
APPROVED
```

## DS-006

```text
Decision:
PASS and RELEASED use distinct semantic visual treatments.

Status:
APPROVED
```

## DS-007

```text
Decision:
Inter is the primary Latin typeface and IBM Plex Sans Arabic is the primary Arabic typeface.

Status:
APPROVED
```

## DS-008

```text
Decision:
Use Standard density by default, Compact for data-dense operational surfaces, and Comfortable where focused form/review work benefits.

Status:
APPROVED
```

## DS-009

```text
Decision:
Charts use the same semantic dark-system palette and are operational, not decorative.

Status:
APPROVED
```

## DS-010

```text
Decision:
Motion is subtle, functional, and respects reduced-motion preferences.

Status:
APPROVED
```

## DS-011

```text
Decision:
Semantic tokens are the canonical styling contract; arbitrary component-level colors are discouraged/forbidden where a token exists.

Status:
APPROVED
```

## DS-012

```text
Decision:
Dark-only is the v1 canonical theme; light mode is deferred.

Status:
APPROVED
```

---

# 127. Deferred Design Decisions

| ID | Decision |
|---|---|
| DD-DS-001 | Exact icon library |
| DD-DS-002 | Exact chart library |
| DD-DS-003 | Exact component implementation technology inside Astro islands |
| DD-DS-004 | Final responsive breakpoints |
| DD-DS-005 | Exact accessibility conformance target wording in UI/UX specification |
| DD-DS-006 | Light theme adoption |
| DD-DS-007 | Exact visual-regression tooling |
| DD-DS-008 | Exact density user preference support |
| DD-DS-009 | Exact animation easing tokens |
| DD-DS-010 | Final per-component token values after implementation visual QA |

---

# 128. Forbidden Design Patterns

```text
One generic admin template copied across all pages
Light pages mixed randomly with dark dashboard
PASS visually identical to RELEASED
Rainbow dashboard charts
Marketing hero sections inside operational pages
Glassmorphism everywhere
Neon gaming UI
Color-only status communication
Placeholder-only form labels
Hidden authorization implemented only in UI
Client-calculated official QC result
Client-calculated release eligibility
Generic OK/Confirm wording for controlled actions
Full-page spinner for normal partial loading
Toast-only critical errors
Giant decorative charts without operational purpose
3D charts
Constant animated backgrounds behind tables/forms
```

---

# 129. Implementation Checklist

```text
[ ] Create design tokens
[ ] Create dark app shell
[ ] Implement typography setup
[ ] Implement RTL foundations
[ ] Implement core surfaces/borders
[ ] Implement semantic status system
[ ] Implement Button/Input/FormField primitives
[ ] Implement DataPanel/DataTable
[ ] Implement StatusBadge/Alert/ErrorSummary
[ ] Implement Modal/Drawer/Tabs/Popover
[ ] Implement RecordHeader/ContextRail
[ ] Implement Dashboard MetricCard/chart container
[ ] Implement ApprovalPanel/AuditTimeline
[ ] Implement Evidence components
[ ] Add responsive states
[ ] Add keyboard/focus behavior
[ ] Add loading/empty/error states
[ ] Add automated accessibility checks
[ ] Add visual/component tests where valuable
```

---

# 130. UI-UX Specification Handoff

الوثيقة التالية `UI-UX-SPECIFICATION.md` يجب أن تستخدم هذه الـDesign System لبناء **تفاصيل الصفحات الفعلية**.

لكل route/page، يجب أن تحدد:

```text
Purpose
Primary user roles
Permissions
States
Page sections
Fields
Tables
Actions
Filters
Charts
Evidence
Approvals
Audit/history
Empty/loading/error states
Responsive behavior
Accessibility behavior
Template Family
```

وهذا هو المكان الذي سيتم فيه تفصيل كل صفحة، وليس `DESIGN-SYSTEM.md` وحدها.

---

# 131. Current Foundation Status

هذه الوثيقة تعتمد **التصميم** فقط.

لا تعني أن:

```text
Components implemented
Pages implemented
Accessibility verified
Charts built
Responsive behavior tested
```

حتى يوجد code + tests + current evidence.

Implementation status remains:

```text
UNVERIFIED
```

---

# 132. Final Design Model

```text
┌─────────────────────────────────────┐
│ Unified Dark QC Design Language     │
│ Tokens / Typography / Semantics     │
└───────────────────┬─────────────────┘
                    │
┌───────────────────▼─────────────────┐
│ Core Components                    │
│ Tables / Forms / Panels / Status   │
└───────────────────┬─────────────────┘
                    │
┌───────────────────▼─────────────────┐
│ Template Families                  │
│ Dashboard / List / Record / Lab    │
│ Approval / Quality / Assets / Docs │
│ Reports / Admin                    │
└───────────────────┬─────────────────┘
                    │
┌───────────────────▼─────────────────┐
│ Domain-specific Page Composition   │
└───────────────────┬─────────────────┘
                    │
┌───────────────────▼─────────────────┐
│ UI-UX-SPECIFICATION.md             │
│ Exact Page Details & Workflows     │
└─────────────────────────────────────┘
```

---

# 133. Final Principle

> **One visual language does not mean one repeated page.  
> The entire system shares the same dark operational identity, while each Domain receives the workspace it actually needs.  
> Design communicates state and risk, but never replaces Business Rules, Authorization, or evidence.**

---

# 134. Document Status

```text
Document:
Documents/DESIGN-SYSTEM.md

Version:
1.0

Theme:
Unified Dark Enterprise QC Control Room

Dashboard:
Operational Command Center
Role-aware / Scope-aware

Internal Pages:
Same dark Dashboard palette
Different Template Families by workflow

Templates:
Layout families only
Not literal final pages

Typography:
Inter
IBM Plex Sans Arabic

Density:
Standard default
Compact for data-heavy workflows
Comfortable where needed

PASS:
Green semantic result

RELEASED:
Distinct teal release-state semantic

Charts:
Dark operational palette
No decorative/rainbow charts

Motion:
Subtle / functional / reduced-motion aware

Accessibility:
Keyboard / focus / contrast / semantic status baseline

Exact Page Sections:
Defined later in UI-UX-SPECIFICATION.md

Implementation Evidence:
UNVERIFIED until code/tests exist

Status:
FOUNDATION — APPROVED DESIGN SYSTEM BASELINE
```
