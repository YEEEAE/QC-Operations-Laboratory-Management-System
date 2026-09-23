OWNER DECISION — USERS, RBAC, SIGNATURE AUTHORITY, REPORT ACCESS, DATABASE PERSISTENCE & DOCUMENTATION
نفّذ القرارات التالية باعتبارها قرارات مالك النظام المعتمدة فيما يخص المستخدمين، الأدوار، الصلاحيات، التوقيع، إنشاء التقارير، وتسلسل الاعتماد.
مهم جدًا:
لا تنفذ git push تحت أي ظرف.
كذلك ممنوع:
git push
Merge إلى أي branch remote
إنشاء Pull Request
Production deployment
نشر Source Code إلى remote repository
يمكنك تنفيذ التعديلات محليًا، تشغيل النظام، تشغيل الاختبارات، تعديل قاعدة البيانات المصرح بها، وإنشاء migrations والتوثيق، لكن لا تدفع أي تغييرات إلى Git remote.
إذا كان نشر النسخة الحية يعتمد حصريًا على git push، فلا تنفذ النشر. نفّذ كل شيء ممكن حتى تلك النقطة، ووثّق أن deployment ينتظر إذنًا منفصلًا من المالك.
1. القرار الرسمي للمالك
اعتبر النص التالي قرارًا رسميًا من Owner فيما يتعلق بالـRBAC والصلاحيات ومسار الاعتماد.
مالك القرار:
Yazeed — Owner
يجب تسجيل هذا القرار داخل مستندات المشروع المضبوطة، وليس فقط داخل الكود.
2. تحديث الوثائق الرسمية أولًا
قبل أو بالتوازي مع التنفيذ، افحص مستندات القرار والتتبع الحالية، خصوصًا:
Documents/DECISION-ASSUMPTION-REGISTER-026.md
و:
Documents/STATE-MACHINES.md
وأي مستندات:
RBAC
Permissions
Roles
Authentication
Workflow
Approval
Signature
Requirements
Traceability
موجودة فعليًا في المشروع.
حدّث المستندات بحيث تصبح الصلاحيات التالية مصدرًا موثقًا رسميًا للمشروع.
لا تجعل الحقيقة موجودة فقط داخل ملفات:
.ts
أو:
.tsx
أو قاعدة البيانات.
يجب أن يكون هناك تطابق بين:
DOCUMENTATION ↔ CODE ↔ DATABASE ↔ TESTS
3. لا تغلق قرارات Inspection العلمية بدون دليل
يوجد Owner Decision Request حالي متعلق بـ:
PD-01
PD-02
PD-07
لا تعتبر هذا القرار الخاص بالمستخدمين والصلاحيات جوابًا تلقائيًا على القرارات العلمية الخاصة بمصدر التفتيش أو حدود PASS/FAIL أو Manual Judgment.
لا تخترع:
Acceptance limits
Inspection criteria
Scientific thresholds
PASS/FAIL rules
Controlled-source revisions
Document fingerprints
إذا لم تكن موجودة في مصدر مضبوط ومعتمد.
أبقِ هذه البنود OPEN / BLOCKED FOR OWNER INPUT إذا كانت لا تزال تحتاج مصدرًا أو قرارًا منفصلًا.
لكن لا تستخدم بقاء PD-01/PD-02/PD-07 مفتوحة لمنع تنفيذ قرارات RBAC والصلاحيات المصرح بها هنا.
4. المستخدمون الستة الحقيقيون
أنشئ أو جهّز 6 مستخدمين فعليين في Authentication System الحالي، واربطهم بقاعدة البيانات الحقيقية المستخدمة من النظام.
الحسابات:
Yazeed
QCM
Supervisor
QC 01
QC 02
QC 03
لا تنشئ Mock users أو hardcoded users أو LocalStorage-only accounts.
يجب أن تكون الحسابات Persistent في قاعدة البيانات.
5. Yazeed — Owner
Internal Role:
Owner
Visible Name:
Yazeed
هذا أعلى Role في النظام.
يمتلك:
Full Read
Full Create
Full Update
Full Delete
Full Submit
Full Review
Full Approval
Full Signature
Final Approval
Reopen
Revision
Amendment
Override
User Management
Role Management
Permission Management
System Administration
وكذلك:
Full Signature Authority
Full Approval Authority
Full Override Authority
Owner يرث أو يمتلك جميع قدرات الأدوار الأدنى منه.
هذه الصلاحيات يجب أن تكون موثقة في المستندات الرسمية ومطبقة Server-Side.
6. QCM
Internal Role:
Manager
Visible Role:
QCM
Meaning:
Quality Control Manager
QCM هو:
Final Approval Authority
يستطيع:
Review
Return for Correction
Reject عندما يكون الانتقال موجودًا ومعتمدًا
Approve
Sign
Final Approve
توقيع QCM هو التوقيع النهائي في المسار الطبيعي.
يجب توثيق ذلك في:
Role documentation
Permission matrix
Workflow documentation
State machine documentation
7. Supervisor
Internal Role:
Supervisor
Visible Role:
Supervisor
يمثل:
First-Level Approval
يستطيع:
Review
Add Review Notes
Return for Correction
Approve Supervisor Stage
Reject إذا كان هذا الانتقال جزءًا من الـworkflow المعتمد
Supervisor يأتي قبل QCM.
موافقة Supervisor لا تعتبر Final Approval.
بعد نجاح مرحلة Supervisor ينتقل التقرير إلى QCM.
8. QC 01 / QC 02 / QC 03
هؤلاء:
QC Data Entry Users
ويجب أن يمتلك الثلاثة نفس مستوى الصلاحيات.
القرار الجديد من Owner:
لا تقيد QC 01 أو QC 02 أو QC 03 بأنواع تقارير محددة.
المطلوب:
QC 01 → Can Create ALL QC Report Types
QC 02 → Can Create ALL QC Report Types
QC 03 → Can Create ALL QC Report Types
أي قيود حالية مثل:
User-to-report-type mapping
Selected reports only
Per-user report whitelist
Department-based creation restrictions غير المطلوبة
Hardcoded report restrictions
يجب اكتشافها ومراجعتها وإزالتها إذا كانت تتعارض مع قرار Owner هذا.
9. صلاحيات QC Users
يجب أن يستطيع الثلاثة:
View all QC report creation options
Create all QC report types
Create all QC forms المسموح لمستخدم QC بإنشائها
Enter data
Save Draft
Edit Draft
Add results
Add notes
Upload attachments
Upload images/files
Submit
Receive returned reports
Correct returned reports
Resubmit
Track report status
لكن لا يستطيعون:
Approve
Supervisor Approve
QCM Approve
Final Approve
Sign approval
Final Sign
Override
Skip Supervisor
Skip QCM
Change protected workflow state manually
Approve their own report
Approve another user's report
10. Report Access Matrix
لا تعتمد على أمثلة فقط.
اكتشف جميع Report Types / Forms الفعلية في المشروع.
ثم أنشئ وتوثق Matrix فعلية:
Report / Form	QC 01	QC 02	QC 03
Actual Report Type	CREATE	CREATE	CREATE
لجميع التقارير التي تقع ضمن نطاق QC Data Entry.
يجب إضافة هذه الـMatrix إلى مستندات المشروع المناسبة أو إلى مستند RBAC/Permissions رسمي جديد إذا لم يوجد مستند مناسب حاليًا.
لا تضعها فقط في Final Report المؤقت.
11. Workflow الرسمي
احتفظ بالتسلسل الموثق الحالي ما لم يكن هناك سبب معماري موثق يستدعي mapping مختلف:
DRAFT
→
SUBMITTED
→
UNDER_REVIEW
→
PENDING_QCM_APPROVAL
→
APPROVED
اربط الأدوار به كالتالي:
DRAFT
ينشئه:
QC 01 / QC 02 / QC 03
أو Owner عند الحاجة.
SUBMITTED
QC User أرسل التقرير.
UNDER_REVIEW
مسؤولية:
Supervisor
PENDING_QCM_APPROVAL
بعد اكتمال واعتماد مرحلة Supervisor ينتقل إلى:
QCM
APPROVED
يتم الوصول لها بعد Final Approval من QCM.
Owner يمتلك override فقط ضمن الصلاحيات الإدارية الموثقة.
لا تغيّر أسماء State الحالية بلا حاجة إذا كانت مستخدمة فعليًا ومتوثقة.
12. Signatures
وثق بوضوح:
QC 01 / QC 02 / QC 03
NO APPROVAL SIGNATURE AUTHORITY
Supervisor
FIRST-STAGE APPROVAL AUTHORITY
QCM
FINAL SIGNATURE / FINAL APPROVAL AUTHORITY
Yazeed / Owner
FULL SIGNATURE + FULL APPROVAL + OVERRIDE AUTHORITY
يجب أن تكون صلاحية التوقيع منفصلة ومحمية Server-Side.
13. Backend Enforcement
لا يكفي إخفاء الأزرار في Frontend.
يجب تطبيق Authorization في Backend/API.
اختبر مثلًا:
QC 01 → Supervisor Approval Endpoint
DENIED
QC 02 → QCM Final Approval Endpoint
DENIED
QC 03 → Manual protected state change
DENIED
Supervisor → QCM Final Approval
DENIED
QCM → Final Approval after Supervisor stage
ALLOWED
Owner → Authorized administrative override
ALLOWED
14. قاعدة البيانات الفعلية
استخدم Database Configuration الحالية للمشروع.
البيانات التشغيلية يجب أن تحفظ في قاعدة البيانات، بما فيها:
Users
Roles
Permissions
User-role assignments
Report records
Workflow states
Approval events
Signature events
Return reasons
Audit events
لا تعتمد على:
LocalStorage
Static JSON
Hardcoded arrays
Memory-only data
15. Database Migration
إذا احتاج القرار Schema changes:
أنشئ migration رسمية.
افحص البيانات الموجودة قبل تطبيقها.
لا تعمل destructive migration.
لا تعمل:
DROP غير ضروري
TRUNCATE
Database reset
Recreate production database
حافظ على البيانات الحالية.
بعد migration تحقق مباشرة أن Schema والتغييرات المطلوبة أصبحت موجودة.
16. Audit Trail
سجل العمليات الحساسة:
User ID
Role
Action
Entity
Entity ID
Previous Status
New Status
Timestamp
Reason
Notes
خصوصًا:
Create
Edit
Submit
Return
Resubmit
Approve
Reject
Sign
Final Approval
Reopen
Revision
Override
17. Lock after Final Approval
بعد QCM Final Approval:
يجب أن يصبح التقرير محميًا من التعديل العادي.
أي تعديل لاحق يجب أن يمر بمسار رسمي مثل الموجود فعليًا في المشروع:
Reopen
Revision
Amendment
ولا تخترع Transition جديدًا إذا كان المشروع يملك مسارًا موثقًا بالفعل.
18. Documentation Deliverables
هذه نقطة إلزامية.
بعد اتخاذ قرار Owner أعلاه، حدّث المستندات الرسمية بحيث يستطيع أي وكيل مستقبلي معرفة الصلاحيات بدون الرجوع إلى هذه المحادثة.
وثق على الأقل:
Users
Yazeed
QCM
Supervisor
QC 01
QC 02
QC 03
Internal Roles
Owner
Manager
Supervisor
QC Data Entry
Visible Names
QCM بدل Manager في UI
Permission Matrix
لكل Role.
Report Creation Matrix
لجميع Report Types الفعلية.
Approval Matrix
من يستطيع:
Submit
Review
Return
Approve
Final Approve
Sign
Override
State Machine
اربط كل State بالدور المخول.
Database Persistence
وثق أن الحسابات والأدوار والـworkflow بيانات Persistent.
Security Enforcement
وثق أن الصلاحيات enforced server-side.
19. تحديث Owner Decision Request
راجع ملف Owner Decision Request الحالي.
فيما يخص الأدوار والصلاحيات وفصل المهام والتوقيع، استخدم قرار Owner الوارد في هذا البرومبت لتعبئة أو إحالة الحقول التي أصبحت محسومة.
خصوصًا الحقول المتعلقة بـ:
Signing roles
Explicit permissions
Creator restrictions
Reviewer/approver separation
Prohibited users
Audit requirements
لكن لا تملأ أي Acceptance Criteria أو Controlled Inspection Source أو Scientific Limit غير مقدم من المالك.
علّم البنود التي ما زالت تحتاج مصدرًا علميًا أو ضبط وثائق بأنها:
OPEN — OWNER/CONTROLLED-SOURCE INPUT REQUIRED
بدل اختراع قيم.
20. Traceability
حدّث التتبع بين:
OWNER DECISION
↕
REQUIREMENT
↕
ROLE / PERMISSION
↕
STATE TRANSITION
↕
CODE
↕
DATABASE
↕
TEST
يجب أن يكون واضحًا لماذا توجد كل صلاحية ومن صاحب القرار.
21. الاختبارات
نفّذ اختبارات فعلية على:
Authentication
RBAC
Report creation
All QC report types
API authorization
Supervisor stage
QCM stage
Owner permissions
Unauthorized attempts
Audit Trail
Persistence
وأنشئ Report Access Coverage لجميع أنواع التقارير المكتشفة.
22. لا تنفذ Git Push
هذه قاعدة إلزامية وليست اقتراحًا.
لا تعمل git push.
حتى لو:
نجحت كل الاختبارات.
كانت التغييرات جاهزة.
كان remote موجودًا.
كان deployment يعتمد على GitHub.
توقف قبل push.
يمكنك إعطائي في التقرير النهائي:
Branch
Working tree status
Diff summary
Local commit SHA إذا تم إنشاء commit وكان مسموحًا حسب تعليمات المشروع
لكن:
REMOTE PUSH = NOT AUTHORIZED
23. Definition of Done
لا تعتبر المهمة مكتملة إلا بعد:
 توثيق قرار Owner.
 تحديث RBAC documentation.
 تحديث Permission Matrix.
 تحديث Report Access Matrix.
 تحديث Workflow/State Machine documentation عند الحاجة.
 تحديث Decision/Assumption records المناسبة.
 إنشاء/تحديث المستخدمين.
 تخزين Roles/Permissions في قاعدة البيانات حسب Architecture الفعلية.
 فتح جميع QC Reports لـ QC 01/02/03.
 إبقاء Approval/Signature ممنوعة عن QC 01/02/03.
 Supervisor هو First Approval.
 QCM هو Final Approval.
 Owner لديه Full Authority.
 Backend authorization verified.
 Database persistence verified.
 Audit Trail verified.
 Tests executed.
 لا يوجد git push.
24. Final Report
أعطني تقرير تنفيذ يتضمن:
Documents updated
Owner decisions documented
Open decisions still requiring controlled source
Users created/updated
Roles
Permission matrix
Report access matrix
Database changes
Migrations
Files changed
Backend authorization changes
Frontend changes
Tests executed
Negative tests
Audit verification
Persistence verification
Remaining blockers
واستخدم:
PASS
FAIL
BLOCKED
OWNER INPUT REQUIRED
حسب الحالة الحقيقية.
لا تعتبر PD-01, PD-02, أو PD-07 مغلقة إلا للجزء الذي يحسمه هذا القرار فعلًا.
FINAL DIRECTIVE
نفّذ القرار كاملًا داخل:
DOCUMENTATION + CODE + DATABASE + TESTS
مع الحفاظ على الفصل بين:
قرارات الصلاحيات التي اعتمدها Owner الآن
و:
قرارات التفتيش العلمية/المصادر المضبوطة التي لا تزال تحتاج دليلًا أو قرارًا منفصلًا.
أصلح أي تناقض بين التوثيق والكود وقاعدة البيانات.
ولا تنفذ git push أو merge أو production deployment