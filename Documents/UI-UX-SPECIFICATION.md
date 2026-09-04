# UI-UX-SPECIFICATION.md

# QC Operations & Laboratory Management System

## Complete UI / UX Specification — v1.0 Draft for Approval

**Document Path:** `Documents/UI-UX-SPECIFICATION.md`
**Status:** FOUNDATION — DRAFT FOR APPROVAL
**Product:** QC Operations & Laboratory Management System
**Design System:** Unified Dark Enterprise QC Control Room
**Primary Experience:** Desktop operational application with responsive tablet/mobile support
**Accessibility Target:** WCAG 2.2 AA
**Languages:** Arabic / English capable
**Operational Timezone:** Asia/Riyadh
**Authorization:** Server-side / Default Deny
**UI Authority:** Presentation only — never Business Truth
**Dashboard Direction:** QC Operational Command Center
**Page Model:** Multiple domain-specific workspace families, not one copied template

---

# 1. Purpose

هذه الوثيقة تحدد تجربة المستخدم الكاملة للنظام:

```text
What pages exist?
What does each page contain?
What information is prioritized?
What tables appear?
What actions appear?
How do users move between workflows?
What appears by role and scope?
How are controlled actions presented?
How do loading/error/empty/stale states behave?
How do desktop/mobile/RTL/accessibility behave?
```

هذه الوثيقة تحول:

```text
Business Rules
Permissions
State Machines
Data Model
Design System
```

إلى تجربة استخدام قابلة للتنفيذ.

---

# 2. Source of Truth

الـUI لا يملك الحقيقة.

Canonical relationship:

```text
Business Rules
        ↓
Permissions
        ↓
State Machines
        ↓
Domain/Application
        ↓
Authorized Read Models
        ↓
UI / UX
```

إذا عرض الـUI Action بينما السيرفر يمنعه:

```text
Server Decision Wins
```

إذا أخفى الـUI Action لكن السيرفر يسمح به:

```text
هذا UX defect
```

لكن ليس Security bypass.

---

# 3. UI / UX Core Principle

> **The system should make the correct operational action obvious and the incorrect controlled action difficult or impossible.**

الهدف ليس فقط:

```text
Looks modern
```

الهدف:

```text
User understands current state
User understands what needs attention
User knows what they can do next
User understands why an action is unavailable
User can trace controlled history
User does not confuse PASS with RELEASE
User cannot accidentally overwrite controlled work
```

---

# 4. Product Experience Character

المنتج يجب أن يشعر بأنه:

```text
Serious
Enterprise
Controlled
Operational
Fast
Data-rich
Calm
Trustworthy
Precise
```

وليس:

```text
Generic admin panel
Marketing site
Gaming dashboard
AI chatbot with tables
Over-designed concept UI
```

---

# 5. Visual Language

كل النظام يستخدم:

```text
Unified Dark Enterprise QC Control Room
```

نفس ألوان الداشبورد مع اختلاف التكوين حسب وظيفة الصفحة.

لا يوجد:

```text
Dark Dashboard
+
Random Light Internal Pages
```

في v1.

---

# 6. UX Information Priority

كل صفحة تتبع ترتيب:

```text
1. Where am I?
2. What is the current state?
3. What requires my attention?
4. What information do I need?
5. What can I do?
6. What happened before?
7. What happens after my action?
```

---

# 7. Universal App Shell

Desktop:

```text
┌───────────────┬──────────────────────────────────────┐
│               │ Top Context Bar                      │
│ Sidebar       ├──────────────────────────────────────┤
│               │                                      │
│               │ Main Page Workspace                  │
│               │                                      │
│               │                                      │
└───────────────┴──────────────────────────────────────┘
```

---

# 8. Sidebar Information Architecture

Primary groups:

```text
OVERVIEW
Dashboard

WORK
Tasks

QUALITY
Findings
NCR
RCA
CAPA

QUARANTINE
Quarantine Dashboard
Receiving Items
Inspection Reports
Quarantine Administration

LABORATORY
Laboratory Tests

ASSETS
Equipment
Calibration
Maintenance

DOCUMENT CONTROL
WI / SOP / Controlled Documents

GOVERNANCE
My Approvals
Change Requests

INSIGHTS
Reports

SYSTEM
Administration
System Health
Backup & Recovery

ADVISORY
AI Advisory
```

Navigation visibility:

```text
Permission-aware
Scope-aware
```

لكن:

```text
Navigation visibility ≠ Authorization
```

---

# 9. Collapsed Sidebar

Collapsed state:

```text
Icon
Tooltip
Active indicator
```

Current Domain يبقى واضح.

على hover/focus:

```text
Label shown
```

---

# 10. Top Context Bar

تحتوي حسب السياق:

```text
Breadcrumb / current location
Global Search
Current operational scope
Notifications
My Approvals shortcut
User/Profile menu
```

Optional:

```text
System environment indicator
```

فقط إذا كان مفيدًا للتمييز بين:

```text
Development
Test
Production
```

---

# 11. Global Search

Search opens كـcommand/search surface.

Searchable entities حسب permission:

```text
Task
Receiving Item
Inspection
Lab Test
Finding
NCR
CAPA
Equipment
Document
Change Request
```

Result item يعرض:

```text
Entity type
Business ID
Primary descriptor
Current state
Context
```

لا يعرض unauthorized entity ثم يقول:

```text
Access denied
```

الأصل:

```text
Unauthorized results are not returned.
```

---

# 12. Global Search Keyboard

Recommended shortcut:

```text
Ctrl/Cmd + K
```

Search interaction:

```text
Type
↓
Grouped authorized results
↓
Arrow keys
↓
Enter opens record
```

---

# 13. Notifications

Notifications drawer تحتوي:

```text
Unread
All
```

Notification example:

```text
Inspection returned for correction
LAB-2026-0012 assigned to you
NCR review requested
Calibration due soon
Document approval requested
```

كل Notification ترتبط بrecord حقيقي.

Notification:

```text
is not business truth
```

---

# 14. My Approvals Shortcut

Top-bar shortcut يعرض badge بعدد approvals التي يستطيع المستخدم تنفيذها فعليًا.

لا يعرض:

```text
All pending approvals in system
```

إلا إذا scope يسمح.

---

# 15. User Menu

يشمل:

```text
Profile
Account
Language
Session information where useful
Sign out
```

Administrative options لا تظهر هنا إلا إذا UX يستفيد منها.

---

# 16. Page Header Standard

كل صفحة رئيسية تحتوي:

```text
Breadcrumb
Page title
Short operational description
Current scope/context
Primary actions
```

Example:

```text
Quarantine / Receiving Items

Receiving Items
Track material receiving and inspection readiness.

[Create Receiving Item]
```

---

# 17. Record Header Standard

كل record detail يستخدم:

```text
Business ID
Primary descriptor
State
Version
Owner / assignee where applicable
Important secondary states
Primary actions
```

Example:

```text
RCV-2026-0041
Medical Component ABC

Receiving: UNDER_INSPECTION
Inspection: HOLD
Release: NOT_RELEASED
Version: 6
```

---

# 18. Multi-State UX

إذا الـDomain يحتوي أكثر من حقيقة state:

```text
لا ندمجها.
```

Quarantine مثال رسمي:

```text
Receiving Workflow State
Inspection Result
Release System State
```

يتم عرضهم بشكل منفصل.

---

# 19. PASS vs RELEASED

ممنوع:

```text
PASS → automatically show Released
```

UX يعرض:

```text
Inspection Result: PASS
Release State: Not Released
```

إذا لم تحدث Release transition.

PASS:

```text
Green
```

RELEASED:

```text
Distinct Teal
```

---

# 20. Version UX

Record version يظهر خصوصًا في:

```text
Controlled record
Review
Approval
E-Signature
Concurrent editing
```

المستخدم لا يحتاج يفهم optimistic concurrency تقنيًا.

لكن يحتاج يفهم:

```text
You are reviewing version 8.
```

---

# 21. Stale Version UX

إذا record تغير:

```text
CONFLICT_STALE_VERSION
```

يظهر blocking panel:

```text
This record changed after you opened it.

Your action was not applied.

Review the latest version before continuing.
```

Actions:

```text
Reload Latest Version
Compare Changes — where supported
Cancel
```

ممنوع:

```text
Overwrite Anyway
```

---

# 22. Universal Page States

كل صفحة يجب أن تحدد:

```text
Loading
Loaded
Empty
Filtered Empty
Error
Unauthorized
Stale
Offline/dependency unavailable where applicable
```

---

# 23. Empty State Types

## Truly Empty

```text
No receiving items have been created yet.
```

إذا المستخدم يستطيع الإنشاء:

```text
[Create Receiving Item]
```

## Filtered Empty

```text
No records match the selected filters.
```

Action:

```text
Clear Filters
```

## Permission Empty

لا نكشف أن records موجودة خارج scope.

---

# 24. Loading

Prefer:

```text
Skeletons
Section-level loading
Button-level progress
```

Avoid:

```text
Full screen spinner for ordinary page load
```

---

# 25. Errors

Known recoverable error:

```text
Specific message
+
Recovery action
```

Unexpected:

```text
Something prevented this operation from completing.

Reference: REQ-...
```

بدون:

```text
Stack
SQL
Constraint
File path
```

---

# 26. Forms

Form page structure:

```text
Page / Record Context
↓
Section 1
↓
Section 2
↓
Section 3
↓
Evidence / Notes
↓
Sticky Action Footer where useful
```

---

# 27. Draft UX

في `DRAFT`:

```text
Editing allowed
Autosave may be allowed
Incomplete fields allowed
```

Autosave indicator:

```text
Saving...
Saved
Save failed
```

لكن autosave لا يستخدم بعد controlled approval.

---

# 28. Submitted UX

في:

```text
SUBMITTED
UNDER_REVIEW
```

المحتوى يصبح:

```text
Read-only or restricted
```

حسب Business Rules.

Primary focus ينتقل من:

```text
Edit
```

إلى:

```text
Review status
Comments
Evidence
Timeline
```

---

# 29. Approved UX

في `APPROVED`:

```text
Controlled Record
```

Normal edit buttons تختفي.

بدلها إذا policy تسمح:

```text
Create Revision
Correction
Void
Supersede
```

كل action له flow مستقل.

---

# 30. Controlled Action UX

Actions مثل:

```text
Approve
Release
Sign
Void
Close
Reject
```

لا تستخدم simple confirm فقط عندما تحتاج business/security ceremony.

Flow example:

```text
Review Record
↓
Choose Decision
↓
Enter reason/comment if required
↓
Reauthentication/E-Signature if required
↓
Server validation
↓
Controlled transition
↓
Success evidence
```

---

# 31. Unsaved Changes

إذا form ليس autosaved بالكامل:

```text
Unsaved changes
```

عند leave:

```text
Discard Changes
Continue Editing
```

لا يعرض prompt إذا لا توجد changes.

---

# 32. Tables

Operational lists هي core UX.

Default anatomy:

```text
Title
Count
Quick statuses
Search
Filters
Column controls where useful
Table
Pagination
```

---

# 33. Table Density

Default:

```text
Standard
```

Large operational grids:

```text
Compact
```

---

# 34. Table Primary Columns

عادة الأولوية:

```text
Business ID
Primary descriptor
Current state
Assigned / owner
Date / due date
Important operational context
Actions
```

---

# 35. Row Actions

Primary:

```text
Open Record
```

Secondary:

```text
Overflow menu
```

لا نحط:

```text
10 buttons
```

في كل row.

---

# 36. Filters

Filters الأساسية تبقى ظاهرة.

مثال:

```text
Search
State
Date range
Assignee
Priority
Result
```

Advanced:

```text
More Filters
```

---

# 37. Filter Persistence

خلال session/navigation القريب:

```text
Preserve sensible filters
```

خصوصًا عند:

```text
Open record
Back to list
```

---

# 38. Bulk Actions

Bulk actions فقط إذا business rule يسمح.

ممنوع default bulk:

```text
Approve All
Release All
Sign All
```

---

# 39. Accessibility Target

Target:

```text
WCAG 2.2 AA
```

Critical requirements تشمل:

```text
Keyboard navigation
Focus visibility
Focus not obscured
Accessible names
Accessible errors
Target size
Accessible authentication
Status not color-only
Zoom resilience
```

---

# 40. ARIA Pattern Rule

Native HTML first.

ARIA تستخدم عند الحاجة فقط.

Complex widgets مثل:

```text
Dialog
Combobox
Tabs
Grid
Menu
Tooltip
```

تتبع established accessible interaction patterns.

---

# 41. Keyboard Experience

Key workflows يجب أن تعمل بدون mouse:

```text
Navigation
Forms
Tables
Dialogs
Approvals
Lab data entry
```

---

# 42. Language / RTL

كل layout يستخدم logical positioning.

Arabic:

```text
RTL layout
Arabic typography
Correct icon direction
Correct breadcrumbs
Correct drawers
```

English:

```text
LTR
```

Data codes مثل:

```text
NCR-2026-0012
LAB-2026-0034
```

تبقى readable بدون تشويه direction.

---

# 43. Date / Time Display

Official event:

```text
Stored UTC
Displayed Asia/Riyadh
```

Display pattern يجب يكون غير ملتبس.

Preferred example:

```text
04 Sep 2026, 14:35
```

أو localized equivalent.

Pure business dates تعرض date فقط.

---

# 44. Template Families

Canonical:

```text
T1 Dashboard
T2 Operational List / Work Queue
T3 Record Workspace
T4 Laboratory Execution Workspace
T5 Approval / Review Workspace
T6 Quality Case Workspace
T7 Equipment / Calibration Asset Workspace
T8 Controlled Document Workspace
T9 Reports / Analytics
T10 Administration
```

---

# 45. Page Inventory

Primary page groups:

```text
Authentication
Dashboard
Tasks
Quality
Quarantine
Laboratory
Equipment / Calibration / Maintenance
Controlled Documents
Approvals / E-Signatures
Change Requests
Reports
Administration
System Health
Backup / Recovery
AI Advisory
Shared Search / Notifications / Account / Audit
```

---

# 46. AUTHENTICATION EXPERIENCE

---

# 47. Login Page

## Purpose

Secure access to internal application.

## Layout

مختلفة قليلًا عن operational shell، لكن بنفس dark identity.

```text
┌────────────────────────────────────┐
│ Product identity                   │
│                                    │
│         Sign in panel              │
│                                    │
│ Login identity                     │
│ Password                           │
│ [Sign In]                          │
│                                    │
│ Help / reset path if enabled       │
└────────────────────────────────────┘
```

## Content

```text
QC Operations & Laboratory Management System
Secure operational access
```

لا marketing content كبير.

## Fields

حسب approved authentication model:

```text
Login identity
Password
```

## States

```text
Default
Submitting
Invalid credentials
Account disabled
Session issue
Service unavailable
```

Invalid account/password response يجب ألا يسمح account enumeration.

## Actions

```text
Sign In
Password Recovery — if enabled
```

## Accessibility

* Password accessible.
* Error summary.
* Focus error field.
* No cognitive puzzle authentication.
* Support password manager/paste.

---

# 48. Password Reset / Recovery

يظهر فقط إذا authentication policy اعتمدته.

Flow:

```text
Request Reset
↓
Generic response
↓
Secure reset process
↓
Set new password
↓
Sessions revoked where required
```

Exact workflow يعتمد Security Architecture.

---

# 49. DASHBOARD

## Template

```text
T1 — Operational Command Center
```

## Primary Goal

في أقل من ثواني المستخدم يعرف:

```text
What needs me?
What is blocked?
What is at risk?
What changed?
What is overdue?
What needs approval?
```

---

# 50. Dashboard Top Context

Header:

```text
Dashboard
Operational overview

Scope: [authorized context]
Date Range: [Today / 7 Days / 30 Days / Custom]
Last updated: ...
```

Scope selector يظهر فقط إذا المستخدم يمتلك أكثر من scope مسموح.

---

# 51. Dashboard KPI Strip

لا تكون ثابتة لكل Role.

Available KPI library تشمل:

```text
My Pending Tasks
Tasks Due Today
Pending Inspections
Inspections Under Review
HOLD Items
Failed / Rejected Inspections
Not Released After PASS
Pending Lab Tests
Lab Tests Under Review
Open Findings
Open NCR
Open CAPA
CAPA Due / Overdue
Pending Approvals
Calibration Due Soon
Calibration Overdue
Maintenance Attention
Documents Awaiting Approval
Open Change Requests
```

يتم اختيار 4–8 فقط حسب role/scope.

---

# 52. KPI Card Interaction

Click:

```text
KPI
↓
Relevant authorized list
↓
Filter pre-applied
```

مثال:

```text
HOLD Items: 12
```

يفتح:

```text
Receiving Items
Filter: Inspection Result = HOLD
```

---

# 53. Attention Required

أهم جزء بعد KPI.

Structure:

```text
CRITICAL
NEEDS ACTION
UPCOMING
```

Examples:

### Critical

```text
Calibration overdue
Critical blocked QC process
Failed controlled operation requiring review
```

### Needs Action

```text
Inspection returned
Pending approval
CAPA nearing due date
```

### Upcoming

```text
Calibration due in 7 days
Tasks due tomorrow
```

---

# 54. Main Dashboard Charts

Dashboard لا يتحول إلى analytics wall.

Recommended pool:

### Inspection Outcomes Trend

```text
PASS
HOLD
FAIL/REJECT
```

over time.

### Operational Throughput

```text
Received
Inspected
Reviewed
Completed
```

### Quality Case Aging

```text
Open NCR by age band
CAPA due state
```

### Laboratory Workload

```text
Draft
Submitted
Under Review
Approved
```

### Calibration Outlook

```text
Due soon
Overdue
Current
```

---

# 55. Dashboard Chart Interaction

Hover/focus:

```text
Value
Date
Scope
Definition
```

Click segment:

```text
Open filtered list
```

where sensible.

---

# 56. Pending Approvals Panel

Contains:

```text
Entity
Business ID
Submitted by
Submitted at
Age
Current version
Risk/status context
```

Actions:

```text
Open Review
```

لا direct Approve from dashboard في v1 للcontrolled workflows.

---

# 57. Holds / Exceptions Panel

Displays:

```text
Record
Exception type
Age
Owner
Last activity
```

Priority:

```text
Blocked > overdue > recent
```

---

# 58. Domain Pulse

Compact status areas:

```text
Quarantine
Laboratory
Quality
Equipment
Documents
```

كل واحد يعرض maximum 2–3 operational facts.

---

# 59. Recent Activity

Activity stream:

```text
Actor
Action
Record
Time
```

لكن only authorized operational activity.

لا نعرض raw security logs.

---

# 60. Role-Specific Dashboard

## Employee

Priority:

```text
My Tasks
My Inspections
My Lab Tests
Returned Work
Due Today
Recent personal workflow activity
```

## Supervisor

Priority:

```text
Team Queue
Pending Review
HOLD
Returned Records
Operational aging
Calibration attention
```

## Manager

Priority:

```text
Approvals
NCR/CAPA
Quality trends
Operational backlog
Release-related attention where authorized
```

## Admin

Priority:

```text
System Health
Account issues
Configuration governance
Backup status
```

Admin لا يحصل تلقائيًا على business KPIs خارج permission.

---

# 61. TASKS

---

# 62. Tasks List

## Template

```text
T2 Operational Work Queue
```

## Header

```text
Tasks
Manage operational work and assignments.
```

## Quick Metrics

```text
My Open
Due Today
Overdue
Blocked
Completed This Week
```

حسب scope.

## Filters

```text
Search
State
Priority
Assignee
Due Date
Created By
Linked Domain
```

## Table

Recommended:

```text
Task ID
Title
Priority
State
Assignee
Due Date
Linked Record
Updated
```

## Actions

```text
Create Task
Open
Assign/Reassign — permission dependent
```

---

# 63. Create / Edit Task

Sections:

```text
Task Information
Assignment
Schedule
Checklist
Dependencies
Linked Record
Notes / Evidence
```

Known concepts:

```text
Title
Description
Priority
Due date
Assignee
Checklist
Blockers
Dependencies
Recurrence where approved
```

No task replaces specialized Domain records.

---

# 64. Task Detail

## Template

```text
T3 Record Workspace
```

Main:

```text
Overview
Checklist
Comments
Evidence
Dependencies
History
```

Context Rail:

```text
State
Priority
Assignee
Due date
Linked record
Created by
Version
```

Actions by state:

```text
Start
Update
Complete
Reassign
Reopen
```

only where authorized/declared.

---

# 65. QUALITY OVERVIEW

Quality landing page يمكن أن تعرض:

```text
Open Findings
Open NCR
RCA in progress
CAPA due
CAPA overdue
Cases awaiting closure
```

مع:

```text
Case aging chart
Open by source
CAPA due trend
```

ليست mandatory إذا Dashboard يغطيها بالكامل، لكن useful كDomain dashboard.

---

# 66. FINDINGS LIST

## Header

```text
Findings
Record and investigate quality observations.
```

## Table

```text
Finding ID
Summary
Source
Severity/classification where approved
State
Owner
Created
Linked Record
```

## Filters

```text
State
Source Domain
Owner
Date
Classification
```

## Actions

```text
Create Finding
Open
Escalate/Create NCR — only if approved transition
```

---

# 67. Finding Detail

Sections:

```text
Finding Summary
Source Context
Observation / Evidence
Immediate Actions / Containment where applicable
Ownership
Related NCR
Attachments
Comments
History
```

Context rail:

```text
State
Source
Owner
Created
Version
```

---

# 68. NCR LIST

Table:

```text
NCR ID
Title / Issue
Source
State
Owner
Age
Due Date where applicable
Linked Finding
```

Quick metrics:

```text
Open
Under Investigation
Awaiting RCA
CAPA Required
Overdue
```

---

# 69. NCR DETAIL

## Template

```text
T6 Quality Case Workspace
```

Header:

```text
NCR ID
Current state
Owner
Age
Critical flags
```

Main progression:

```text
1. Non-Conformance
2. Containment
3. Investigation
4. RCA
5. CAPA
6. Effectiveness / Closure
```

Exact sections displayed only if lifecycle/business rules include them.

Secondary sections:

```text
Evidence
Related Records
Approvals
Timeline
```

---

# 70. RCA Workspace

Main:

```text
RCA Summary
Problem Definition
Investigation Evidence
Analysis
Root Cause
Contributing Factors where approved
Review
History
```

Specific methodology:

```text
5 Why
Fishbone
Other
```

لا نفرضها في UI إلا إذا business requirements تعتمدها.

---

# 71. CAPA LIST

Table:

```text
CAPA ID
Related NCR
Action Summary
Owner
State
Due Date
Overdue
Effectiveness Status
```

Filters:

```text
State
Owner
Due
Overdue
Related NCR
```

---

# 72. CAPA Detail

Sections:

```text
CAPA Summary
Related NCR / RCA
Actions
Owners
Due Dates
Evidence
Progress
Effectiveness Verification
Review / Approval
Closure
History
```

Action items تعرض:

```text
Owner
Due
State
Evidence
```

---

# 73. QUARANTINE DASHBOARD

Dedicated Domain dashboard.

## Top KPIs

```text
Received Today
Awaiting Inspection
Under Inspection
HOLD
PASS / Not Released
Released
```

PASS / Not Released metric مهم جدًا.

---

# 74. Quarantine Attention Board

Sections:

```text
Awaiting Inspection
HOLD > X age
Inspection Returned
PASS but not Released
Blocked Release
```

Exact age threshold policy-dependent.

---

# 75. Quarantine Charts

Recommended:

```text
Inspection Results Trend
Receiving Throughput
HOLD Aging
Release State Distribution
```

لا نستخدم chart إذا table أو KPI أوضح.

---

# 76. RECEIVING ITEMS LIST

## Template

```text
T2 Operational Work Queue
```

## Table

High-priority columns:

```text
Receiving ID
Item / Description
Lot / Batch
Quantity
Received Date
Receiving State
Inspection Result
Release State
Assigned Inspector
Age
```

Optional fields from approved Data Dictionary only.

---

# 77. Receiving Filters

```text
Search
Receiving State
Inspection Result
Release State
Date
Assigned Inspector
Lot / Batch
Item
```

---

# 78. Receiving Quick Metrics

```text
Awaiting Inspection
Under Inspection
HOLD
PASS / Not Released
Released
```

---

# 79. Create Receiving Item

Form groups:

```text
Receiving Identification
Item Information
Lot / Batch Information
Quantity
Supplier / Source where approved
Receiving Context
Attachments / Evidence
Assignment
Notes
```

Footer:

```text
Save Draft
Submit / Create — exact lifecycle dependent
Cancel
```

No unapproved fields invented.

---

# 80. Receiving Item Detail

Header:

```text
Receiving ID
Item
Lot
```

Critical state strip:

```text
Receiving State
Inspection Result
Release System State
```

Main sections:

```text
Overview
Receiving Details
Inspection
Laboratory Links where applicable
Quarantine / Release
Evidence
Related Quality Records
Approvals
History
```

Context Rail:

```text
Assigned inspector
Received date
Quantity
Version
Created by
Last updated
```

---

# 81. Receiving Primary Actions

Possible, only where declared:

```text
Edit Draft
Assign Inspection
Start Inspection
Open Inspection
Submit
Release
Hold
Create Finding/NCR
```

`Release` يظهر فقط إذا policy/permission/state تسمح.

---

# 82. INSPECTION REPORTS LIST

Columns:

```text
Inspection ID
Receiving Item
Item / Lot
Inspector
State
Inspection Result
Review State
Created / Submitted
```

Filters:

```text
State
Result
Inspector
Reviewer
Date
Item
Lot
```

---

# 83. Inspection Execution Workspace

## Template

Custom:

```text
T3 + controlled operational execution
```

Header:

```text
Inspection ID
Receiving Item
Current State
Version
```

Sections:

```text
Receiving Snapshot
Inspection Requirements
Checklist / Characteristics
Measurements / Observations
Controlled WI/SOP Reference
Evidence
Result Summary
Notes
Submission Readiness
```

---

# 84. Inspection Result UX

Official result:

```text
PASS
HOLD
FAIL / REJECT
```

فقط حسب approved business rule/state model.

Result must show:

```text
Result
Criteria source/version
Relevant measured evidence
Decision timestamp after controlled transition
```

No manual arbitrary color-only result.

---

# 85. Inspection Submission

Before Submit:

```text
Required fields complete
Required evidence present
Controlled method/context valid
```

UI shows readiness checklist.

Action:

```text
Submit for Review
```

not:

```text
Save
```

---

# 86. Inspection Review Workspace

## Template

```text
T5 Approval / Review Workspace
```

Top:

```text
Inspection snapshot
Version being reviewed
Author
Submission time
Result
Receiving Item
```

Main:

```text
Inspection Details
Measurements
Criteria
Evidence
Comments
Previous Submission/Return History
```

Decision rail:

```text
Approve
Return for Correction
Reject — if state machine supports
```

---

# 87. QUARANTINE ADMINISTRATION

هذه ليست عامة Admin.

Potential areas:

```text
Operational quarantine configuration
Approved reference data
Assignment setup
Controlled lookup values
```

فقط approved configuration.

كل change يحتاج:

```text
Permission
Audit
Version/concurrency where applicable
```

---

# 88. LABORATORY TESTS LIST

## Template

```text
T2
```

Header:

```text
Laboratory Tests
Execute and review controlled laboratory testing.
```

Quick metrics:

```text
Assigned to Me
Draft
Submitted
Under Review
Returned
Approved
Retest Pending
```

---

# 89. Laboratory Table

```text
Lab Test ID
Sample / Item
Test / Method
State
Result where official
Executor
Reviewer
Started
Due
```

Filters:

```text
State
Result
Method
Executor
Reviewer
Date
Sample / Item
Equipment
```

---

# 90. Create Laboratory Test

Sections:

```text
Test Identity
Sample / Material Context
Controlled Method
Specification / Criteria Source
Assignment
Equipment Context
Due / Operational Context
Notes
```

Source-dependent values لا يكتبها المستخدم arbitrary إذا يجب تأتي من controlled source.

---

# 91. Laboratory Execution Workspace

## Template

```text
T4 — Laboratory Execution Workspace
```

Desktop layout:

```text
┌────────────────────────────────────────────────┐
│ Test Header / States / Version                 │
├──────────────────────────────┬─────────────────┤
│ Main execution               │ Test context    │
│                              │                 │
│ Method                       │ Sample          │
│ Measurements                 │ Equipment       │
│ Calculations                 │ Calibration     │
│ Observations                 │ Criteria        │
│ Evidence                     │ Version         │
└──────────────────────────────┴─────────────────┘
```

---

# 92. Laboratory Header

```text
Lab Test ID
Test name / method
Sample/item
State
Official result where available
Version
```

Primary actions:

```text
Save Draft
Submit for Review
Return path where applicable
```

---

# 93. Controlled Method Panel

Displays:

```text
Method / Test Method
Document identity
Version used
Effective state
Reference link
```

لا يعرض:

```text
Latest method
```

إذا execution مربوط historical version مختلف.

---

# 94. Sample Context Panel

Displays approved data such as:

```text
Sample identifier
Item
Lot / Batch
Receiving linkage
Collection / received context where approved
```

---

# 95. Equipment Context

Shows:

```text
Equipment ID
Equipment name/type
Operational state
Calibration status
Calibration validity context
```

إذا policy تمنع use بسبب calibration:

```text
Blocking state
```

وليس warning فقط.

---

# 96. Measurement Grid

الجزء الأكثر أهمية في Lab UX.

Features:

```text
Compact data entry
Keyboard navigation
Tab/Enter movement
Unit visible
Precision guidance from controlled source
Raw value vs calculated value distinction
Inline validation
```

Potential columns:

```text
Parameter
Raw Measurement
Unit
Specification / Criteria
Calculated Value
Result
Notes
```

حسب Test Method.

---

# 97. Measurement Grid Rules

ممنوع:

```text
Scientific rounding invented by UI
Browser-only authoritative calculation
Hidden unit
Auto-correcting entered number silently
```

---

# 98. Calculated Results

Calculated values:

```text
Read-only if domain-calculated
```

Display:

```text
Formula name/reference
Inputs
Calculated value
Unit
Result
```

Formula itself تظهر only if useful/allowed.

---

# 99. Acceptance Criteria Panel

Displays exact approved controlled criteria:

```text
Source
Version
Criterion
Unit
Range / requirement
```

If source unavailable:

```text
Cannot determine official result
```

rather than guessing.

---

# 100. Laboratory Raw Observations

Textarea / structured observations حسب test.

Should support:

```text
Draft editing
Evidence linkage
Review visibility
```

---

# 101. Laboratory Evidence

Evidence panel:

```text
Photos
Instrument output
PDF
Worksheet
Other approved evidence
```

Each:

```text
File
Uploader
Timestamp
Context
```

---

# 102. Lab Result Summary

Before submission:

```text
Calculated / proposed outcome
Validation readiness
Missing requirements
```

Official controlled result only after proper transition.

---

# 103. Lab Submit Readiness

Checklist examples:

```text
Method/version selected
Required measurements complete
Units valid
Required equipment context valid
Required evidence present
Calculation completed
```

---

# 104. Lab Review Workspace

Top snapshot:

```text
Test ID
Version
Executor
Method/version
Sample
Result
Submitted time
```

Review content:

```text
Measurements
Calculations
Criteria
Equipment/calibration
Evidence
Observations
Historical changes
```

Decision panel:

```text
Approve
Return for Correction
Other declared transitions
```

---

# 105. Retest UX

Retest never overwrites original Test.

Retest page shows:

```text
Original Test
Original Result
Reason / Authority
Retest number/reference
New execution
```

Original remains accessible.

If Retest policy unresolved:

```text
Action unavailable
```

---

# 106. EQUIPMENT LIST

## Template

```text
T2
```

Table:

```text
Equipment ID
Name
Type
Operational State
Calibration State
Next Due Date
Maintenance State
Location where approved
```

Quick filters:

```text
Operational
Due Soon
Overdue
Out of Service
Maintenance
```

---

# 107. Equipment Detail

## Template

```text
T7 Asset Workspace
```

Header:

```text
Equipment ID
Name
Operational status
Calibration status
Maintenance status
```

Main:

```text
Overview
Calibration
Maintenance
Documents / Certificates
Usage / Linked Tests
Evidence
Timeline
```

Context:

```text
Model
Serial number
Location
Owner
Version
```

only where approved.

---

# 108. Calibration List

Columns:

```text
Calibration ID
Equipment
State
Calibration Date
Due Date
Provider / performer where approved
Certificate
```

Filters:

```text
State
Due Soon
Overdue
Equipment
Date
```

---

# 109. Calibration Detail

Sections:

```text
Calibration Summary
Equipment Snapshot
Calibration Information
Result / Status where approved
Certificate / Evidence
Review / Approval where applicable
History
```

No invented calibration intervals.

---

# 110. Maintenance List

Columns:

```text
Maintenance ID
Equipment
Type
State
Scheduled Date
Completed Date
Owner / Assignee
```

---

# 111. Maintenance Detail

Sections:

```text
Maintenance Summary
Issue / Reason
Planned Work
Execution
Evidence
Parts/notes where approved
Equipment state impact
Completion
History
```

---

# 112. CONTROLLED DOCUMENT LIBRARY

## Template

```text
T8
```

Header:

```text
Controlled Documents
Manage approved WI, SOP and controlled document versions.
```

Search:

```text
Document code
Title
Type
Version
State
```

Filters:

```text
Document Type
State
Effective
Owner
```

---

# 113. Document Library Table

```text
Document Code
Title
Type
Current Effective Version
State
Owner
Effective Date
Updated
```

Important:

```text
Document identity
≠
Document version
```

---

# 114. Controlled Document Detail

Header:

```text
Document Code
Title
Current Effective Version
State
```

Main:

```text
Overview
Current Version
Version History
Approval Trail
Related Usage
Attachments / Content
Change Requests
Audit
```

---

# 115. Version History

Version table:

```text
Version
State
Created
Submitted
Approved
Effective
Superseded
Author
```

Current effective version visually prominent.

Superseded versions remain available for historical lookup according to permission.

---

# 116. Document Version Editor

Draft only.

Sections:

```text
Document Metadata
Content / File
Version Notes
Change Summary
Related Source/References
Reviewers / Workflow
```

No ordinary edit after Approved.

---

# 117. Document Review

## Template

```text
T5
```

Shows:

```text
Current proposed version
Previous version
Change summary
Content/file
Evidence
Comments
Approval history
```

Where supported:

```text
Compare Versions
```

---

# 118. MY APPROVALS

## Template

```text
T2 + T5
```

List table:

```text
Entity
Business ID
Approval Type
Submitted By
Submitted At
Age
Risk / Priority
Version
```

Filters:

```text
Domain
Approval Type
Age
Submitted By
```

---

# 119. Approval Detail

Top:

```text
What am I approving?
Which exact version?
Who submitted it?
What is the current state?
```

Main:

```text
Subject Snapshot
Key Data
Evidence
Changes
Prior Review
Risk / Warnings
Audit Context
```

Decision rail:

```text
Approve
Return
Reject
```

only declared actions.

---

# 120. E-Signature Ceremony

When required:

```text
Decision selected
↓
Meaning displayed
↓
Exact subject displayed
↓
Version displayed
↓
Reauthentication
↓
Submit Signature
↓
Server reauthorization/state/version/SoD check
↓
Result
```

Meaning example:

```text
I approve Inspection Report INSP-2026-0021, version 4.
```

---

# 121. E-Signature UX Rules

Must display:

```text
Action meaning
Entity
ID
Version
Current user
```

Must not store/show:

```text
Password as evidence
```

If stale after reauthentication:

```text
Signature not applied
Reload required
```

---

# 122. CHANGE REQUESTS LIST

Columns:

```text
CR ID
Title
Target Domain / Document
State
Requester
Owner
Created
Age
```

Filters:

```text
State
Target
Requester
Owner
Date
```

---

# 123. Change Request Detail

Sections:

```text
Change Summary
Reason / Justification
Current State
Proposed Change
Impact Analysis
Affected Records / Documents
Risk Assessment
Evidence
Reviews
Approvals
Implementation / Effectiveness where approved
History
```

---

# 124. REPORTS LANDING PAGE

## Template

```text
T9
```

Report catalog grouped by Domain:

```text
Quarantine
Laboratory
Quality
Equipment
Documents
Operational
Audit / Governance where permitted
```

Each report card:

```text
Title
Description
Available scope
Last used optional
```

---

# 125. Report Workspace

Header:

```text
Report Name
Scope
Date Range
```

Sections:

```text
Filters
Summary Metrics
Charts
Canonical Data Table
Export
```

---

# 126. Reports Filter UX

Filters validated server-side.

Common:

```text
Date range
State
Domain-specific context
Scope
```

User can reset.

No hidden unauthorized scope values.

---

# 127. Report Dataset

Data table is authoritative representation of report dataset.

Charts:

```text
visualize dataset
```

Exports:

```text
derive from same authorized dataset
```

---

# 128. Export UX

Actions:

```text
Export CSV
Export XLSX
Export PDF
```

only formats implemented.

Before export:

```text
Current filters
Scope
Record count
```

can be displayed.

Export errors do not change business data.

---

# 129. ADMINISTRATION LANDING PAGE

## Template

```text
T10
```

Categories:

```text
Users
Roles
Permissions
Assignments / Scope
Approved Master Data
System Configuration
```

No generic “everything settings”.

---

# 130. Users List

Table:

```text
User
Login Identity
Role(s)
Account State
Scope summary
Last Login
```

Actions:

```text
Create / Provision
Open
Disable
Reset Access
Manage Roles/Permissions
```

permission dependent.

No Delete for users with history.

---

# 131. User Detail

Sections:

```text
Identity
Account State
Roles
Permissions
Scopes
Sessions
Security Actions
Audit
```

No password/hash visible.

---

# 132. Roles Page

Shows Foundation roles:

```text
Employee
Supervisor
Manager
Admin
```

and their purpose.

A role detail should distinguish:

```text
Role Responsibility
Assigned Permissions
Users
```

No hierarchy visualization implying Admin > Manager > Supervisor > Employee.

---

# 133. Permission Management

Table:

```text
Permission Code
Domain
Action
Risk Level
Assigned Roles
Active
```

Permission changes are high-risk.

UI should show warning:

```text
Permission changes affect authorization and are audited.
```

---

# 134. Scope Management

Where implemented:

```text
OWN
ASSIGNED
TEAM
DEPARTMENT
SITE
DOMAIN
GLOBAL
```

UI must not suggest:

```text
GLOBAL = all permissions
```

Scope and Permission separate.

---

# 135. SYSTEM HEALTH

System Health page:

```text
Application
Database
Storage
Background processing / Outbox
External integrations
Backup status
```

Public-style raw diagnostics not shown to ordinary users.

Admin view may expose sanitized detail.

---

# 136. Health Status

Semantic:

```text
Healthy
Degraded
Unavailable
Unknown
```

Never:

```text
Green because page loaded
```

Each dependency card:

```text
State
Last check
Impact
Reference
```

---

# 137. BACKUP & RECOVERY

Landing:

```text
Backup Status
Recent Backups
Restore Verification
Recovery Evidence
```

Important visual distinction:

```text
Backup Created
≠
Restore Verified
```

---

# 138. Backup Table

```text
Backup ID
Created At
Environment
Status
Integrity Check
Restore Verification
```

Exact sensitive storage details hidden.

---

# 139. Restore Workspace

Restore is high-risk.

UX:

```text
Target environment/context
Selected backup
Backup metadata
Verification state
Impact warning
Authorization
Confirmation ceremony
Execution status
Verification
```

Production restore requires exact policy later.

---

# 140. AI ADVISORY PAGE

AI is separate visually from official records.

Header:

```text
AI Advisory
Suggestions and analysis only — not an approval authority.
```

---

# 141. AI Advisory Layout

```text
Context selection
Prompt / question
Authorized context summary
AI response
Sources / referenced records where available
Actions
```

Allowed outputs:

```text
Summaries
Suggested investigation questions
Draft text
Trend observations
Data explanations
```

---

# 142. AI Forbidden UX

No:

```text
Approve with AI
Release using AI
Set PASS
Set FAIL
Sign
Close NCR automatically
```

AI response action buttons may include:

```text
Copy
Use as Draft
Open Source Record
```

Never:

```text
Apply Official Result
```

---

# 143. AI Context Visibility

Before sending:

```text
AI can use:
- Current authorized record
- Selected authorized related records
```

No hidden/global context.

---

# 144. ACCOUNT / PROFILE

Sections:

```text
Display Name
Account Information
Language
Active Sessions where approved
Password / Security
```

Role/permissions display:

```text
Read-only summary
```

unless Admin workflow.

---

# 145. GLOBAL AUDIT TIMELINE

If dedicated page exists:

Filters:

```text
Entity
Actor
Action
Date
Domain
```

Only accessible with explicit permission.

Audit item:

```text
Actor
Action
Entity
Previous/next state summary where allowed
Timestamp
Request ID
Signature reference
```

Audit is read-only.

---

# 146. Record-Level Audit

Every important record detail includes:

```text
History / Audit tab
```

but summarized for UX.

Potential views:

```text
Timeline
Detailed table
```

---

# 147. COMMENTS

Comments are contextual.

Each:

```text
Author
Timestamp
Comment
Edited indicator only if editing is allowed
```

Controlled review comments may need immutable history depending business rules.

---

# 148. EVIDENCE / ATTACHMENTS

Attachment area:

```text
Upload
Preview
Download
Metadata
Linked context
```

Upload states:

```text
Uploading
Uploaded
Validation failed
Security processing where implemented
```

---

# 149. File Preview

Support safe file types only.

If unsupported:

```text
Download
```

Never load untrusted content directly in privileged DOM without safe handling.

---

# 150. APPROVAL / REVIEW COMMENTS

Decision comments should be visually tied to decision:

```text
Approved
Returned
Rejected
```

Timeline example:

```text
14:30 — Submitted by Employee
15:10 — Returned by Supervisor
Reason: ...
16:45 — Resubmitted
17:20 — Approved
```

---

# 151. Related Records

Contextual section:

```text
Receiving Item
Inspection
Lab Test
Finding
NCR
CAPA
Task
Document
Equipment
```

Relationship explicitly labeled:

```text
Source
Generated From
Related Task
Uses Equipment
Created NCR
```

---

# 152. Cross-Domain Navigation

Cross-domain link:

```text
Open related record
```

وليس embedded edit لrecord تابع Domain آخر.

---

# 153. Context Rail

Desktop record pages تستخدم right-side rail أو logical opposite in RTL.

Contains only high-value context:

```text
Current state
Secondary states
Assignment
Owner
Due
Version
Controlled source
Approval status
```

لا تتحول إلى duplicate page.

---

# 154. Sticky Actions

في long forms/workspaces:

```text
Save Draft
Submit
Cancel
```

يمكن أن تكون sticky.

Controlled actions may use dedicated decision rail.

---

# 155. UX Writing Principles

Buttons use verb + object.

Good:

```text
Submit for Review
Approve Inspection
Return for Correction
Release Item
Create NCR
Save Draft
```

Bad:

```text
OK
Done
Yes
Submit
Proceed
```

إذا المعنى غير واضح.

---

# 156. Confirmation Dialogs

Confirmation only when action:

```text
Irreversible
Controlled
High impact
Unexpected
```

Dialog shows:

```text
What will happen
Record
Current state
New intended action
Reason requirement
```

---

# 157. Avoid Confirmation Fatigue

No confirmation for:

```text
Opening page
Changing filter
Saving harmless draft repeatedly
```

---

# 158. Success Feedback

Ordinary:

```text
Toast
```

Controlled action:

```text
Persistent result state
+
Timeline update
+
optional toast
```

مثال:

```text
Inspection approved.
Version 4 is now APPROVED.
```

---

# 159. Permission UX

Three cases:

## User cannot see capability at all

Navigation/action omitted.

## User can see context but cannot perform action

May show disabled/read-only with reason where safe.

## Direct unauthorized access

Safe:

```text
Not found
```

or:

```text
Access denied
```

حسب security mapping.

---

# 160. SoD UX

إذا action blocked بسبب Separation of Duties:

Safe explanation:

```text
This record requires review by another authorized user.
```

بدل عرض تفاصيل security policy الكاملة.

---

# 161. Status Architecture

Each domain has status design mapping.

Status component accepts:

```text
Canonical status
Label
Semantic type
Optional icon
```

UI لا تختار color based on string heuristics.

---

# 162. Draft

Visual:

```text
Neutral gray
```

Meaning:

```text
Editable / incomplete possible
```

---

# 163. Submitted

Visual:

```text
Blue
```

Meaning:

```text
Waiting workflow
```

---

# 164. Under Review

Visual:

```text
Blue / active governance
```

---

# 165. Returned

Visual:

```text
Amber
```

Meaning:

```text
Action required from author
```

---

# 166. Approved

Visual:

```text
Green
```

Meaning:

```text
Controlled
```

---

# 167. Closed

Visual:

```text
Neutral / controlled completion
```

Not necessarily green depending domain.

---

# 168. Void

Visual:

```text
Muted / struck historical treatment
```

لكن record يبقى واضح ومقروء.

---

# 169. Superseded

Visual:

```text
Muted historical
```

Current version linked prominently.

---

# 170. Mobile Navigation

Mobile:

```text
Top bar
Hamburger / drawer
Page title
Content
Bottom/sticky action only when justified
```

No permanent desktop sidebar.

---

# 171. Mobile Dashboard

Priority:

```text
Attention
My actions
Critical KPI
Approvals
```

Charts lower priority.

Cards become single-column.

---

# 172. Mobile Record Page

Order:

```text
Record Header
Critical states
Primary action
Key details
Sections
Context
History
```

Context rail becomes inline accordion/sections.

---

# 173. Mobile Tables

Strategy per table:

```text
Priority columns
Horizontal scroll
Row detail
Mobile list
```

Avoid unreadable 12-column squeeze.

---

# 174. Mobile Lab Workspace

Lab execution may be desktop/tablet optimized.

Mobile supports:

```text
Review
Quick observation
Evidence
Status
```

Complex dense measurement entry may show:

```text
Recommended larger screen
```

إذا workflow فعليًا لا يناسب phone.

لكن لا يتم منع mobile بدون requirement.

---

# 175. Responsive Breakpoint Behavior

Exact pixel breakpoints deferred to implementation.

Conceptual:

```text
Large Desktop
Desktop
Tablet
Mobile
```

Design should respond by content needs, not device brand.

---

# 176. Page-Level Accessibility Checklist

Every page:

```text
[ ] One clear H1
[ ] Landmark structure
[ ] Logical heading hierarchy
[ ] Keyboard navigation
[ ] Visible focus
[ ] Accessible names
[ ] Status not color-only
[ ] Error summary where applicable
[ ] Focus moves appropriately after dialog/error
[ ] No keyboard trap
[ ] Zoom works
[ ] RTL reviewed
```

---

# 177. Form Accessibility

```text
[ ] Visible labels
[ ] Required indication
[ ] Programmatic label association
[ ] Description association
[ ] Error association
[ ] Invalid field announced
[ ] Error summary links/focuses fields where useful
```

---

# 178. Dialog Accessibility

```text
Focus enters dialog
Focus contained while modal active
Escape behavior where safe
Title announced
Focus returns logically
```

Critical dialogs may intentionally require explicit action rather than accidental close.

---

# 179. Table Accessibility

Native table semantics for non-interactive tables.

Interactive grid behavior only إذا functionality فعليًا تحتاج grid keyboard model.

Do not turn every table into ARIA grid.

---

# 180. Performance UX

Avoid:

```text
Loading entire 100k row table
```

Use:

```text
Server pagination
Server filtering
Server sorting
```

---

# 181. Optimistic UI

Controlled mutations:

```text
No fake optimistic approval/release
```

UI waits for authoritative server result.

Safe UI interactions like:

```text
filter state
panel expansion
```

can be optimistic/local.

---

# 182. Network Delay

Button during critical mutation:

```text
Processing...
```

disable duplicate submit.

لكن timeout لا يعني:

```text
Operation definitely failed.
```

UX can say:

```text
We could not confirm the outcome.
Refresh the record before trying again.
```

when appropriate.

---

# 183. Auto Refresh

Dashboard may refresh operational data periodically later.

لكن:

```text
No auto refresh that discards form work
```

Record detail with unsaved work should not replace user data silently.

---

# 184. Data Freshness

Dashboards/reports should expose:

```text
Last Updated
```

where data could reasonably become stale.

---

# 185. Charts Accessibility

Each chart needs:

```text
Title
Text summary where important
Accessible data alternative/table when needed
Keyboard-accessible tooltips where feasible
```

Critical information cannot exist only in visualization.

---

# 186. Chart Motion

Initial chart animation:

```text
Minimal
```

No animated streaming effect unless operational need.

---

# 187. AI Advice Accessibility

AI result structured with headings/lists.

Streaming output, if implemented, should not cause overwhelming live-region announcements.

---

# 188. UX Research / Validation Requirements

Before final production UI:

Test with representative:

```text
Employee
Supervisor
Manager
Admin
```

Tasks:

```text
Find assigned work
Complete inspection
Review inspection
Enter lab measurements
Approve controlled record
Find NCR status
Check calibration
Export report
```

---

# 189. Usability Success Measures

Possible metrics:

```text
Task completion rate
Time to find assigned work
Error recovery success
Review completion time
Data-entry error rate
Navigation success
Critical action comprehension
```

Exact targets later after baseline.

---

# 190. Critical UX Risks

UI must explicitly mitigate:

```text
Confusing PASS with Release
Approving wrong version
Missing HOLD/critical item
Editing controlled history
Reviewing own prohibited work
Entering measurement in wrong unit
Using wrong controlled document version
Losing draft work
Misreading current state
Exporting wrong scope
```

---

# 191. Dashboard UX Risks

Avoid:

```text
Global totals visible to scoped user
Charts with ambiguous date range
Same color for different controlled facts
Too many KPIs
Buried pending approvals
Stale data with no freshness indicator
```

---

# 192. Laboratory UX Risks

Avoid:

```text
Hidden unit
Hidden method version
Editable calculated result
Floating point display inconsistency
Accidental row shift during data entry
Auto-changing measurement
```

---

# 193. Approval UX Risks

Avoid:

```text
Approve button without subject/version
Approval directly from notification/dashboard
No distinction between review and signature
No warning when record changed
```

---

# 194. Administration UX Risks

Avoid:

```text
Admin appears omnipotent
Global scope confused with global permission
Permission changes without warning
Delete historical users
Raw secret visibility
```

---

# 195. Page Specification Contract

عند implementation، كل page file/spec يجب أن يملك:

```text
Page ID
Route
Domain
Template Family
Purpose
Primary Roles
Required Permissions
Scope
States
Sections
Primary Data
Filters
Actions
Controlled Actions
Empty State
Loading State
Error State
Stale State
Responsive Behavior
Accessibility Notes
Related Records
Audit Requirements
Test IDs
```

---

# 196. Proposed Page IDs

```text
UI-AUTH-001 Login
UI-AUTH-002 Password Recovery

UI-DASH-001 Dashboard

UI-TASK-001 Tasks List
UI-TASK-002 Task Create
UI-TASK-003 Task Detail

UI-QUAL-001 Quality Overview
UI-FIND-001 Findings List
UI-FIND-002 Finding Detail
UI-NCR-001 NCR List
UI-NCR-002 NCR Detail
UI-RCA-001 RCA Workspace
UI-CAPA-001 CAPA List
UI-CAPA-002 CAPA Detail

UI-QUAR-001 Quarantine Dashboard
UI-RCV-001 Receiving Items
UI-RCV-002 Receiving Create
UI-RCV-003 Receiving Detail
UI-INSP-001 Inspection Reports
UI-INSP-002 Inspection Execution
UI-INSP-003 Inspection Review
UI-QUAR-ADM-001 Quarantine Administration

UI-LAB-001 Laboratory Tests
UI-LAB-002 Lab Test Create
UI-LAB-003 Laboratory Execution
UI-LAB-004 Laboratory Review
UI-LAB-005 Retest

UI-EQP-001 Equipment List
UI-EQP-002 Equipment Detail
UI-CAL-001 Calibration List
UI-CAL-002 Calibration Detail
UI-MNT-001 Maintenance List
UI-MNT-002 Maintenance Detail

UI-DOC-001 Document Library
UI-DOC-002 Document Detail
UI-DOC-003 Version Editor
UI-DOC-004 Document Review

UI-APR-001 My Approvals
UI-APR-002 Approval Detail
UI-ESIG-001 E-Signature Ceremony

UI-CHG-001 Change Requests
UI-CHG-002 Change Request Detail

UI-RPT-001 Reports Catalog
UI-RPT-002 Report Workspace

UI-ADM-001 Administration
UI-ADM-USR-001 Users
UI-ADM-USR-002 User Detail
UI-ADM-ROLE-001 Roles
UI-ADM-PERM-001 Permissions
UI-ADM-SCOPE-001 Scope Management

UI-SYS-001 System Health
UI-BKP-001 Backup & Recovery
UI-RST-001 Restore Workspace

UI-AI-001 AI Advisory

UI-SHARED-001 Global Search
UI-SHARED-002 Notifications
UI-SHARED-003 Account
UI-SHARED-004 Audit Timeline
```

Exact routes:

```text
ROUTE-MANIFEST-SPECIFICATION.md
```

---

# 197. UX Decision Register

## UX-001

```text
Decision:
Use the approved unified dark QC visual language on all operational pages.

Status:
PROPOSED FOR APPROVAL
```

## UX-002

```text
Decision:
Dashboard is an operational command center, not a generic analytics dashboard.

Status:
PROPOSED FOR APPROVAL
```

## UX-003

```text
Decision:
Dashboard is role-aware and scope-aware.

Status:
PROPOSED FOR APPROVAL
```

## UX-004

```text
Decision:
No controlled approval or release occurs directly from Dashboard cards.

Status:
PROPOSED FOR APPROVAL
```

## UX-005

```text
Decision:
PASS and RELEASED remain separate visually, textually and behaviorally.

Status:
PROPOSED FOR APPROVAL
```

## UX-006

```text
Decision:
Every controlled record prominently shows current state and version.

Status:
PROPOSED FOR APPROVAL
```

## UX-007

```text
Decision:
Stale-version conflicts are blocking review/reload experiences, not generic errors.

Status:
PROPOSED FOR APPROVAL
```

## UX-008

```text
Decision:
WCAG 2.2 AA is the UI accessibility target.

Status:
PROPOSED FOR APPROVAL
```

## UX-009

```text
Decision:
Native HTML is preferred; WAI-ARIA patterns are used for complex widgets when required.

Status:
PROPOSED FOR APPROVAL
```

## UX-010

```text
Decision:
Critical forms support keyboard-oriented operation.

Status:
PROPOSED FOR APPROVAL
```

## UX-011

```text
Decision:
Laboratory execution gets a dedicated high-density workspace rather than a generic form.

Status:
PROPOSED FOR APPROVAL
```

## UX-012

```text
Decision:
Approval workflows use a dedicated review workspace.

Status:
PROPOSED FOR APPROVAL
```

## UX-013

```text
Decision:
E-Signature is a separate ceremony displaying meaning, subject and exact version.

Status:
PROPOSED FOR APPROVAL
```

## UX-014

```text
Decision:
Controlled records lose normal edit UX after controlled states.

Status:
PROPOSED FOR APPROVAL
```

## UX-015

```text
Decision:
Reports, charts and exports derive from the same authorized canonical dataset.

Status:
PROPOSED FOR APPROVAL
```

## UX-016

```text
Decision:
Mobile retains the same information authority but changes information priority and layout.

Status:
PROPOSED FOR APPROVAL
```

## UX-017

```text
Decision:
Complex Lab data entry is desktop/tablet optimized while mobile remains usable for appropriate review/context operations.

Status:
PROPOSED FOR APPROVAL
```

## UX-018

```text
Decision:
AI is visually and functionally identified as advisory.

Status:
PROPOSED FOR APPROVAL
```

## UX-019

```text
Decision:
Global Search returns only records already authorized for the actor.

Status:
PROPOSED FOR APPROVAL
```

## UX-020

```text
Decision:
Page templates are families only; domain pages may add/remove/reorder sections according to approved business workflow.

Status:
PROPOSED FOR APPROVAL
```

---

# 198. Deferred UX Decisions

```text
DUX-001 Exact route paths
DUX-002 Exact responsive breakpoints
DUX-003 Saved views support
DUX-004 User-customizable dashboard widgets
DUX-005 Dashboard automatic refresh interval
DUX-006 Exact mobile Lab entry scope
DUX-007 Exact chart library interactions
DUX-008 Exact rich text editor for controlled documents
DUX-009 Exact document comparison implementation
DUX-010 Exact report scheduling capability
DUX-011 Exact notification delivery channels
DUX-012 Exact session-management UI
DUX-013 Exact master-data administration screens
DUX-014 Exact accessibility test tooling
DUX-015 Exact user research success thresholds
```

هذه القرارات لا يتم اختراعها أثناء implementation.

---

# 199. Forbidden UX Patterns

```text
One generic CRUD page for all Domains
One template copied to every page
Light internal pages inside dark system
PASS = Released
Approve directly from a KPI
Hidden method/version in Lab
Editable calculated official result
Normal edit on Approved record
Admin presented as universal approver
Global dashboard totals for scoped users
Color-only status
Placeholder-only labels
Toast-only critical errors
Generic “Confirm” for controlled actions
Unclear action wording
UI-calculated authorization
UI-calculated official PASS/FAIL
Client-selected final status
Silent concurrent overwrite
Secret data in admin UI
AI presented as official authority
```

---

# 200. Implementation UX Checklist

Before a page is considered implemented:

```text
[ ] Page ID assigned
[ ] Correct Template Family
[ ] Purpose clear
[ ] Roles identified
[ ] Permission identified
[ ] Scope identified
[ ] States mapped
[ ] All required sections present
[ ] Primary actions correct
[ ] Controlled actions correct
[ ] Multi-state facts separated
[ ] Loading state
[ ] Empty state
[ ] Error state
[ ] Stale state if applicable
[ ] Mobile behavior
[ ] RTL
[ ] Keyboard
[ ] Focus
[ ] WCAG checks
[ ] Audit/history access where applicable
[ ] Related records
[ ] Test traceability
```

---

# 201. Dashboard Acceptance Checklist

```text
[ ] User can identify top required action quickly
[ ] Pending approvals visible to authorized approver
[ ] HOLD clearly visible
[ ] PASS/Not Released clearly visible where relevant
[ ] KPI scope visible
[ ] KPI time range visible
[ ] Charts operational and actionable
[ ] Charts link to filtered source list where useful
[ ] No unauthorized aggregates
[ ] No decorative overload
[ ] Mobile prioritizes attention over charts
```

---

# 202. Laboratory Acceptance Checklist

```text
[ ] Method/version visible
[ ] Sample context visible
[ ] Equipment/calibration visible
[ ] Units always visible
[ ] Raw vs calculated distinct
[ ] Criteria source visible
[ ] Keyboard data entry usable
[ ] Controlled calculations server authoritative
[ ] Missing controlled source blocks official decision
[ ] Submit readiness clear
[ ] Evidence accessible
[ ] Review exact version visible
```

---

# 203. Approval Acceptance Checklist

```text
[ ] Subject clear
[ ] Version clear
[ ] Current state clear
[ ] Submitter clear
[ ] Evidence visible
[ ] Previous returns/reviews visible
[ ] SoD evaluated server-side
[ ] Decision wording explicit
[ ] E-Signature ceremony when required
[ ] Stale version blocks action
[ ] Result reflected in controlled history
```

---

# 204. Quarantine Acceptance Checklist

```text
[ ] Receiving State visible
[ ] Inspection Result visible
[ ] Release State visible
[ ] Three facts never merged
[ ] PASS does not imply Released
[ ] HOLD receives high attention
[ ] Release action separately authorized
[ ] Inspection links visible
[ ] Evidence/history visible
```

---

# 205. Final UX Architecture

```text
                    ┌──────────────────────────┐
                    │ Unified Dark App Shell   │
                    └─────────────┬────────────┘
                                  │
              ┌───────────────────▼────────────────────┐
              │ Role / Permission / Scope-aware UX    │
              └───────────────────┬────────────────────┘
                                  │
       ┌──────────────────────────┼─────────────────────────┐
       │                          │                         │
       ▼                          ▼                         ▼
 Dashboard                 Work Queues               Record Workspaces
       │                          │                         │
       │                  ┌───────┴────────┐               │
       │                  ▼                ▼               │
       │                Tables          Filters            │
       │                                                    │
       ├────────────────────────────────────────────────────┤
       │                                                    │
       ▼                                                    ▼
 Attention / Charts                           Specialized Workspaces
                                              │
                                              ├─ Lab Execution
                                              ├─ Approval Review
                                              ├─ Quality Case
                                              ├─ Asset / Calibration
                                              ├─ Documents
                                              └─ Reports
                                                       │
                                                       ▼
                                             Controlled Actions
                                                       │
                                                       ▼
                                       Server Authorization / Domain
```

---

# 206. Final Principle

> **The user should never need to guess the current state, the meaning of an action, or whether a controlled decision has actually happened.**

> **The dashboard tells the user what requires attention.**

> **The workspace tells the user what evidence and context they need.**

> **The server decides what they are allowed to do.**

> **The state machine decides what can happen next.**

> **The UI makes those truths understandable without pretending to own them.**

---

# 207. Document Status

```text
Document:
Documents/UI-UX-SPECIFICATION.md

Version:
1.0 Draft

Design:
Unified Dark Enterprise QC Control Room

Dashboard:
Role-aware
Scope-aware
Operational Command Center

Page Families:
10 approved template families

Page Inventory:
Authentication
Dashboard
Tasks
Quality
Quarantine
Laboratory
Equipment / Calibration / Maintenance
Controlled Documents
Approvals / E-Signatures
Change Requests
Reports
Administration
System Health
Backup / Recovery
AI Advisory
Shared capabilities

Accessibility Target:
WCAG 2.2 AA

Arabic:
RTL supported

English:
LTR supported

Critical UX Rules:
PASS ≠ RELEASED
Controlled Record ≠ Draft
UI ≠ Authorization
AI ≠ Authority
Backup Created ≠ Restore Verified
Current Record Version must be explicit for controlled decisions

Implementation Status:
UNVERIFIED

Document Approval Status:
DRAFT FOR USER REVIEW
```
