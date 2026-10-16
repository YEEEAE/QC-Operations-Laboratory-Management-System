3. Complete page-by-page inventory
[id] below denotes dynamic route parameters, not synthetic example values.
A. Errors, account and administration — pages 1–11
1. /404 — “We could not find that page”
- No sidebar; public BaseLayout.
- Text: address may be outdated or requested record inaccessible.
- Recovery link selected from session context.
- Preserve non-disclosure: do not distinguish unauthorized existing record from absent record.
2. /500 — “Something interrupted this request”
- No sidebar; title Service unavailable.
- Session-ended recovery variant or unconfirmed-request variant.
- Optional request Reference.
- Recovery link; instruct review of record/history before retrying; never imply failed mutation definitely rolled back.
3. /account — “Account”
- Account information: Login identity, Display name, Email, State.
- Password: Current password, New password; independent Show/Hide buttons.
- Actions: Change password; Sign out.
- Changing password ends all sessions including current one.
- Profile/role/scope editing is not offered here.
4. /admin — “Administration”
- Cards: Users, Roles, Permissions, Scopes; conditional Audit history.
- Links: Open users, conditional Create user, Open roles, Open permissions, Open scopes, Open audit.
- Administration landing, not a universal authority override.
5. /admin/permissions — “Permissions”
- Read-only catalog.
- Columns: Permission, Domain, Action.
- Permission description primary, canonical code secondary.
- Back to administration; unavailable/empty states.
- Grants change through roles, not this page.
6. /admin/roles/[roleId] — role name / “Role detail”
- Header: name, code, active state, record version.
- Configuration: Code, System role, Description.
- Canonical grants: permission checkbox list; description, code, domain/action/risk.
- Action: Replace grants.
- Read-only grant list when assignment unavailable.
- Inactive role cannot change grants; high-risk audited replacement; stale version rejects.
7. /admin/roles — “Roles”
- Columns: Name, Role type, Status, Version.
- Role name opens detail; code secondary.
- Role type: System role / Custom role.
- Read-only catalog; no create-role form.
8. /admin/scopes — “Scopes”
- Canonical vocabulary: OWN, ASSIGNED, TEAM, DEPARTMENT, SITE, DOMAIN, GLOBAL.
- Plain-language meanings; Browse members; Back to administration.
- Actual assign/remove controls live on member detail.
- Scope alone grants no action; self-grants blocked.
9. /admin/users/[userId] — member display name / “User detail”
- Technical record disclosure: UUID.
- Profile facts: Login identity, Email, State, Must change password, Last login.
- Editable fields: Display name, optional Email; Save profile.
- Security: Temporary password → Reset password; Disable/Activate account; Revoke all sessions.
- Roles: current grants, protected/view-only/inactive labels; Role selector + optional Reason → Assign role; Remove role.
- Scopes: current kinds/values; Kind, conditional Value, optional Reason → Assign scope; Remove scope.
- Bulk disclosure: resulting scope checkbox/value set + Reason → Replace scopes.
- Authority summary: Profile edit, Account lifecycle, Role administration, Scope administration.
- Confirmation dialogs for reset, disable/activate, revoke, remove role/scope.
- No self-edit/security/role/scope administration; canonical owner SYSTEM_OWNER/GLOBAL grants protected.
- Profile/security actions use account version; role/scope grants do not invent version fields.
10. /admin/users — “Users”
- Filters: Search accounts (login/name/email), Account state.
- Columns: Login identity, Display name, State, Roles, Scopes.
- Actions: Create user, Apply/Clear filters, record link, Previous/Next pages, Back.
- Relationship failures show “Not confirmed” without hiding confirmed user data.
11. /admin/users/new — “Create user”
- Required: Login identity, Display name, Temporary password.
- Optional: Email; Initial roles; Initial scopes with values where applicable.
- Actions: Create user, Cancel, Back to users.
- Separate permissions for initial roles/scopes; creation can proceed without them.
- First sign-in requires password change.
B. AI and approvals — pages 12–14
12. /ai-advisory — “AI advisory”
- Boundary notices: advisory only; human review; minimized external processing.
- Configuration facts: provider routing defaults, credential presence, approved policy, availability, per-request consent, schema link where allowed.
- Form:
- Output type: Summarize / Suggest questions / Draft text, permission-dependent.
- Question for analysis.
- Optional Source label, Source identity, Source type, Citation, Excerpt.
- Approved Content class and explicit external-processing consent when configured.
- Actions: Request advisory; Copy; Edit locally; Prepare correction for human review.
- Response: advisory label, text, source context/references, review guidance/provenance; local correction textarea.
- No QC mutation/approval from response. Missing policy/config blocks sending. Changing question/excerpt clears consent.
13. /approvals/[approvalId] — controlled subject label
- Subject/type/version, work-item state.
- Record overview and handoff timeline.
- Controlled snapshot: Workflow, Version under review, Requester/audit reference, State, Integrity reference.
- Dynamic Review context facts.
- Authorized Decision selector; Reason/comments; conditional reauthentication password and signature meaning.
- Action: Submit controlled decision; open owning-domain record; reload stale approval.
- Return/Reject require reason when offered.
- If signature applicability unresolved: Decision unavailable, no password/decision control.
- Decisions only from supported subject handler and current assignment/scope/state/version/SoD.
14. /approvals — “My approvals”
- Policy-status notices: unresolved or partial signing policy.
- Columns: Subject, Workflow, Submitted by, Version, State, Decision status.
- Decision status has explanatory reason.
- Queue count only when confirmed.
- Empty queue does not prove decisions are operational.
C. Assets — pages 15–24
15. /assets/calibrations/[calibrationId] — calibration number
- Equipment link, state, version.
- Calibration information: Calibration date, Due date, Provider, Certificate, Result, Equipment.
- Eligibility block: eligible / ineligible reason / unconfirmed; source due date.
- Immutable history columns: Action, State, Version, Changed.
- Created by/at, Approved at, Version.
- State-dependent rail:
- DRAFT: Schedule calibration, Submit calibration.
- SCHEDULED: Submit calibration.
- SUBMITTED: Approve calibration.
- APPROVED/CURRENT: Record calibration completion / failure.
- No inferred interval; current selection is separate/policy-controlled; no bypass.
16. /assets/calibrations — “Calibration records”
- Filters: Search, State; contextual equipment filter.
- Columns: Calibration number, Equipment, State, Calibration date, Due date, Certificate.
- Add calibration record; row/detail/equipment links; Clear filters; pagination.
17. /assets/calibrations/new — “New calibration record”
- Required: Calibration number, scoped Equipment, Calibration date.
- Optional: source-provided Due date, Provider, Certificate number, Result/source note.
- Create draft, Cancel, Back; Create equipment helper link.
- Selector unavailable, no equipment, and stale selection are distinct states.
- No invented due date/interval.
18. /assets/equipment/[equipmentId] — equipment name
- Identity: equipment number/version/state, Manufacturer, Model, Serial number, Location, Calibration required, Maintenance required.
- Calibration history: Calibration number, State, Date, Due date.
- Maintenance history: Maintenance number, State, Planned.
- Status history: Action, From, To, Changed.
- Links: Record calibration/maintenance; View all records.
- Created by, Updated.
- No inline master-edit form; historical laboratory context stays frozen.
19. /assets/equipment — “Equipment”
- Filters: Search, Operational state.
- Columns: Equipment number, Name, Model / serial, Operational state, Location, Version.
- Add equipment; row links; Clear filters; pagination.
20. /assets/equipment/new — “New equipment”
- Required: Equipment number, Name.
- Optional: Manufacturer, Model, Serial number, Location.
- Checkboxes: Calibration required, Maintenance required.
- Create draft / Cancel.
- Activation is separate governed workflow.
21. /assets — “Assets”
- Three linked count cards: Equipment register, Calibration records, Maintenance.
- Scope label and control-boundary notice.
- Provider failure withholds counts.
- Asset master changes do not rewrite historical lab snapshots.
22. /assets/maintenance/[maintenanceId] — maintenance number
- Summary: Description, Type, Equipment, Provider, Performed by, Downtime.
- Timeline: Planned, Started, Completed, Result.
- Immutable history: Action, State, Version, Changed.
- DRAFT → Plan maintenance.
- PLANNED → Start maintenance / Cancel maintenance with reason.
- IN_PROGRESS → Complete maintenance.
- Completion does not return equipment to service or prove calibration.
- VOID not offered.
23. /assets/maintenance — “Maintenance”
- Filters: Search, State; contextual equipment.
- Columns: Maintenance number, Equipment, Type, State, Scheduled, Completed.
- Add maintenance record, row links, Clear filters, pagination.
24. /assets/maintenance/new — “New maintenance record”
- Required: Maintenance number, Equipment, Description.
- Optional: Type, Scheduled date, Performed by, Provider.
- Create draft / Cancel.
- Eligibility options supplied from batched source, not invented operational status.
D. Audit, changes, dashboard — pages 25–30
25. /audit — “Audit history”
- Filters: Record type, Record reference, Changed by account reference, Action, From/To factory time, Results per page 1–100.
- Columns: When, Action, Changed by, Record reference, Transition, Reason, Request reference.
- Apply/Clear filters; Previous/Next.
- Display timezone Asia/Riyadh UTC+03.
- Sanitized projections; no raw payload.
- Current UI may say “Business record number unavailable”; do not fabricate one.
26. /change-requests/[changeRequestId] — change number
- Target type/id, state, request/target versions, requester, reason.
- Captured target snapshot is historical review evidence.
- Proposed changes: Field path, Current, Proposed, Data type.
- Audit history; handoff timeline; application attempts.
- Open review when permitted.
- For approved DOCUMENT_VERSION: Apply approved change.
- Approval, application, and effectivity remain distinct.
27. /change-requests/[changeRequestId]/review — “Review {changeNo}”
- Current request and target versions.
- Reason and current→proposed field changes.
- Action: Start review, only when eligible.
- Direct page does not offer Return/Reject/Approve; those belong to controlled approval workflow.
- Decision-unavailable explanation otherwise.
28. /change-requests — “Change requests”
- Filters: Target type, State.
- Columns: Change no., Target, State, Target version, Request version, Updated.
- New change request; Filter; row links; pagination.
- Approval does not automatically update target.
29. /change-requests/new — “New change request”
- Required: Change number, Reason, Controlled document version, Change field, Proposed value.
- Current-value preview: Document, Revision, State, Change summary, Controlled content hash.
- Only supported target: DOCUMENT_VERSION.
- Only proposed fields: revision, changeSummary.
- Create draft / Cancel.
- Target id/version/snapshot/current value/type/hash server-owned; no user JSON/UUID workflow.
30. /dashboard — “Dashboard”
- Server snapshot + Refresh.
- Needs your attention: linked title, reason, real age, state/severity; source disclosure.
- Work queues:
- Review and approval work items.
- Documents awaiting my review.
- Receiving HOLD.
- Inspection review.
- Laboratory review.
- PASS, not released.
- Operational areas directory mirrors visible sidebar groups/tools; not replacement navigation.
- 11 source-derived action counts:
- Pending reviews.
- Due-today tasks.
- Overdue tasks.
- HOLD items.
- Returned inspections.
- Returned laboratory tests.
- Documents pending my review.
- Assigned tasks.
- On-hold tasks.
- Unread notifications.
- Overdue calibrations.
- Four featured KPI keys: pending review, tasks due today, overdue tasks, hold items.
- Confirmed-all-zero variant: compact zero strip, not decorative empty charts.
- Quarantine pipeline, receiving trend with source/unit/grain/scope/period/freshness and zero baseline.
- Recent account activity; Data coverage disclosure; PASS/release boundary.
- Missing source data must not become made-up “healthy” metrics.
E. Controlled documents and release — pages 31–38
31. /documents/[documentId] — document title
- Code, type, identity version.
- Current effective revision, Owner, Active document.
- Versions table: Revision, State, Created, Approved, Effective, Author.
- Create revision; version links.
- Catalog identity may exist with no versions; approved history immutable.
32. /documents/[documentId]/versions/[versionId]/edit — “Edit draft revision {revision}”
- Fields: Revision reference, Change summary.
- Read-only bound file list: filename, bytes, SHA-256; server fingerprint.
- Save draft; Back.
- Only draft metadata editable; source links fixed at draft creation.
- Expected record version and expected content hash checked; no browser-set fingerprint.
33. /documents/[documentId]/versions/[versionId] — document title, revision
- Lifecycle, server source fingerprint/verification, Created by, Approved at.
- Record overview; Edit draft, Submit for review, Open review workspace conditionally.
- Attachments: Source file, Role, SHA-256, Linked at.
- Change summary.
- Recorded authorization: Decision, Actor, Assigned role requirement, Recorded at, Version at decision, Evidence.
- A recorded decision/name is not an e-signature unless matching signature evidence exists.
- APPROVED does not imply EFFECTIVE.
34. /documents/[documentId]/versions/[versionId]/review — “Review revision {revision}”
- Proposed revision/files/fingerprint compared to previous effective revision.
- Review checklist and policy blocker.
- Action: Record review when IN_REVIEW and authorized.
- Back to version.
- Approval/effectivity not offered while governing authority/signature/effective-date policies unresolved.
35. /documents/[documentId]/versions/new — “New controlled version”
- Revision reference; Change summary.
- Registered source-file checkbox list: filename, bytes, added date.
- Create draft version / Cancel.
- Requires registered file(s); no upload control.
- New revision blocked by draft/in-review/returned predecessor; latest predecessor must be EFFECTIVE for subsequent revision.
- Identity/predecessor snapshots checked server-side.
36. /documents — “Controlled documents”
- Filters: Search, Type.
- Columns: Document code, Title, Type, Current effective version, Owner, Updated.
- Create document; My review queue; pagination.
- ?review=mine variant:
- Title Documents awaiting your review.
- Columns Document code, Title, Revision, State, Submitted.
- Active IN_REVIEW versions, own authored versions excluded.
- Requires both applicable review grants; denied count withheld.
37. /documents/new — “Create controlled document”
- Required: Document code, Document type, Title.
- Create document / Cancel / Back to library.
- Creates catalog identity only, no content editor, file upload, approval, or effectivity.
38. /governance/releases/[releaseId] — “Production release approval”
- Prominent Production decision: NO-GO.
- Identity: Git SHA, Build ID, Application version, Migration head, UAT cycle.
- Gates table: Gate, Status, Evidence reference, Source, Observed, Exact identity.
- Controlled residual risks; approval blockers.
- Re-enter password; signature meaning; Approve release disabled while unapprovable.
- Evidence read-only/server-derived.
- Current eight evidence classes do not satisfy approved 19-gate register; no editable PASS/risk checkboxes.
F. Help, redirects, laboratory — pages 39–48
39. /help — “Operating guides”
- Search this guide; Print this guide.
- TOC:
1. Start of day by role.
2. Everyday routes.
3. Screen and state guidance.
4. Troubleshooting.
5. Escalation and handoff.
6. Service interruption.
- Role cards, authorized quick links, state/next-action tables.
- Derived summary only; does not replace controlled requirements or grant authority.
40. / — redirect only
- Authenticated → /dashboard.
- Guest → /login with safe return destination and optional session-recovery notice.
- No existing public landing page.
41. /laboratory — redirect only
- Redirect to /laboratory/tests.
- No standalone laboratory dashboard.
42. /laboratory/report-templates — “Laboratory report templates”
Two report choices:
- Subatmospheric Pressure Air Leakage Test Report
- Pressure Decay Test Report
UI modes: type selection, saved drafts, draft editor, ?draft=[id], and print mode.
Field groups:
- Record identification: Company/facility, Record category, Document number, Revision, Document date, Page number.
- Sample identification: Product/description, Testing date, Number of samples tested, Lot number, Testing area.
- Requirements: Medium name, Medium used.
- Connector assembly: Actual force, Torque, Assembly time, Assembly angle.
- Environmental condition: Temperature, Humidity.
- Test conditions: Standard condition, Remaining difference, Time preset (sec).
- Remarks/signoffs: Remarks, Tested by, Reviewed by QC/E, Approved by QA/E.
- Connector configuration text.
- Exactly 12 sample rows, columns:
Sample no., Sample identifier, Part name, Set pressure, Applied pressure, Volume, Pressure difference, Holding time, Leakage rate, Result recorded on source report.
- Overall result radio: Not recorded / PASS / FAIL / HOLD / FURTHER EVALUATION.
- Save draft; Open print view; Back.
Transcription only: exact source strings/units/precision; no conversion or scientific evaluation. Names are not account-bound signatures.
43. /laboratory/tests/[labTestId]/execute — “Laboratory execution”
- Test number, method, current version; record overview.
- Raw-observation matrix:
- Rows = frozen sample identifiers.
- Columns = controlled parameter label/code, required marker, unit, criteria, precision/source.
- Numeric/text values or Yes/No; per-cell Remarks.
- Excel clipboard disclosure:
- Exact five-column header Sample, Parameter, Value, Unit, Remarks.
- Clipboard textarea → Preview observations; preview does not save.
- Save observations; Submit for review.
- Equipment used for a run: Run selector, eligible Equipment selector → Record equipment use.
- Frozen context: method/template/source, official server result, controlled-document snapshots, equipment/calibration snapshots.
- No editable submitted/returned state without controlled resume; no browser scientific result.
44. /laboratory/tests/[labTestId] — test number
- State, Official result, Version.
- Controlled method, template version, source.
- Record overview; source receiving link where confirmed.
- Open execution / Open review workspace according to state and authority.
- Retest/original context explanation.
- View-only overview; no implicit test approval.
45. /laboratory/tests/[labTestId]/retests/new — “Retest”
- Explicit blocked informational page.
- No retest form.
- Authority/count/sequence/original-result handling policy required; original cannot be overwritten.
- Do not design this as an enabled creation workflow.
46. /laboratory/tests/[labTestId]/review — “Laboratory review”
- Comparison columns: Sample, Parameter, Observed, Unit, Approved criteria, Outcome.
- Required/calculated markers; reviewer-decision status when no approved rule.
- Read-only submission context; measurements/sample counts; controlled documents.
- Decision rail:
- Supervisor approval — send to QCM + stage reauthentication.
- Return for correction + reason.
- QCM final approval — approve and lock + final reauthentication.
- Return at QCM stage + reason.
- Reject authority remains policy-blocked; reject is not scientific FAIL.
- Copy inconsistency: footer still says only final approval carries signature; current Mind and forms require signatures at both stages. Do not reproduce misleading footer in Stitch.
47. /laboratory/tests — “Laboratory tests”
- Filters: Search, Workflow state, Ownership, Sort by, Direction.
- Columns: Test number, Sample, Method / version, State, Official result, Executor, Last updated.
- Create laboratory test; Enter report draft; row links; density/pagination.
- Distinct denied/unavailable/empty/filtered-empty.
48. /laboratory/tests/new — “Create laboratory test”
- Required: Approved template; Approved laboratory test number.
- Save draft / Cancel / Back.
- Source/version assigned from controlled template selection.
- No available approved template = cannot start; no invented template picker contents.
G. Login, notifications, quality — pages 49–62
49. /login — “Sign in”
- Application name: QC Operations & Laboratory Management System.
- Description: Secure operational access.
- Login identity, Password, Show/Hide; Sign in.
- Pending, invalid credentials, rate-limit/countdown, authentication service unavailable, expired/account-unavailable/password-changed notices.
- No sidebar; dedicated medical GLB background.
- Panel maximum 440px; padding 32px, mobile 20px; inputs/buttons 48px.
- No implemented self-registration or forgotten-password link.
50. /notifications — “Notifications”
- All / Unread filters.
- Rows/cards: severity text, title, message, created time, Read/Unread.
- Destination link; Mark “title” as read.
- Pagination; invalid-page recovery; per-row action feedback.
- Only addressed to current authenticated account.
51. /quality/capa/[capaId] — “CAPA detail”
- CAPA reference/version/state in record overview.
- Source NCR link; action count; verification/effectiveness flags; owning/waiting stage.
- PD-18 policy explanation.
- Conditional Close CAPA:
- Closure reason, Reauthentication password, explicit CLOSE meaning.
- Close CAPA.
- Current page does not render a full editable action-plan table; do not invent one as existing.
- P-04 exception: active Supervisor + close grant/scope/version/reason/signature; closure does not establish effectiveness.
52. /quality/capa — “CAPA records”
- Policy blockers PD-18/PD-17.
- State filter; contextual NCR filter.
- Columns: CAPA, Action plan, State, Source NCR, Actions, Effectiveness, Next step.
- Completion count “x of y”; no inferred effectiveness verdict.
- Row links, Clear filters, pagination.
53. /quality/capa/new — “New CAPA”
- Direct creation is not available.
- Link to CAPA register / NCR.
- Authorized NCR relationship and creation grant required.
- No current create form; do not invent enabled builder.
54. /quality/findings/[findingId] — finding number
- Title, description, State, Severity, Version, Source context.
- Record overview; Related NCR links and source-availability states.
- PD-15 Finding→NCR initiation blocker.
- No NCR creation button or automatic escalation.
55. /quality/findings — “Findings”
- State filter.
- Columns: Finding number, Summary, Severity, State, Owner, Created, Source context.
- Create finding; row links; Clear filter; pagination.
- PD-15 blocker preserves readable records.
56. /quality/findings/new — “Create finding”
- Required: Finding number, Title, Description.
- Optional Severity (if approved).
- Save draft / Cancel / Back.
- Severity is not permission to invent classification policy.
57. /quality — “Quality”
- Four area links/cards: Findings, NCR, RCA, CAPA.
- No additional charts, quality score, or maturity KPI currently rendered.
58. /quality/ncr/[ncrId] — NCR number
- Title, Description, State, Version, Opened, Closed, Affected item, Affected lot.
- Record overview.
- Source finding, Related RCA, Linked CAPAs.
- Links read-only; closure blocked by PD-17; no direct closure button.
59. /quality/ncr — “NCR records”
- PD-15/16/17 policy blockers.
- State filter.
- Columns: NCR, Nonconformance, State, Source finding, RCA, Next step.
- RCA count/link; context-specific next links; pagination.
- No create action on register.
60. /quality/ncr/new — “New NCR”
- Direct creation is not available.
- PD-15 Finding-to-NCR and PD-16 inspection FAIL handling owners.
- Open NCR register / Findings.
- No enabled create form.
61. /quality/rca/[rcaId] — RCA reference
- Editable in DRAFT/IN_PROGRESS/RETURNED:
- Method, Analysis, Root cause.
- Save analysis.
- Start analysis in DRAFT/RETURNED.
- Submit recorded analysis for review in IN_PROGRESS.
- Facts: State, Version, Method, Analysis, Root cause, Submitted, Approved.
- Source NCR; Related CAPAs; next-step/policy explanation.
- SUBMITTED: approval/return/void unavailable pending controlled policy/signature ceremony.
62. /quality/rca — “Root-cause analyses”
- Create linked RCA draft buttons for scoped eligible NCR sources.
- State filter; contextual NCR filter.
- Columns: RCA, Linked NCR, State, Root cause recorded, Next step.
- RCA pagination plus independent NCR-source pagination.
- Draft creation/submission do not approve RCA or close NCR.
H. Quarantine — pages 63–72
63. /quarantine/admin/[templateId] — “{templateCode} · {versionNo}”
- Template name, lifecycle state, record version.
- Lifecycle forms: review, approve, stop, void, supersede.
- Stop/void/supersede require Reason; all except review show password confirmation.
- Disabled actions retain reason.
- New revision: New version number, read-only Template name, Description → Create DRAFT revision.
- Record context: Code, Version, State, Record version.
- Read-only controlled digital preview.
- Authored DRAFT only: embedded Template designer, described below.
- P-06 authority Supervisor/Manager/named yazeed; employee draft-only; approved content never edited in place.
64. /quarantine/admin — “Quarantine administration”
- Rev14 catalog search by Doc. Code or official title.
- Catalog columns: Doc. Code, Official title, Master Rev, Digital template, Version, Item mappings, Source.
- Import source drafts, authority-dependent; creates no approval/mapping.
- Template versions columns: Code, Version, State, Open.
- Lifecycle availability per row; template and catalog pagination.
- Create catalog template: Inspection Report identity selector, Description → Create template.
- Create from scratch: Document code, Revision, Template name, Description → Create draft template.
- Source digest/reference server-owned; conflicted sources not usable.
- No current item-mapping editor or controlled-document binding creator.
65. /quarantine — “Quarantine”
- Scope + server snapshot.
- Items needing follow-up attention list.
- Receiving workflow distribution bars.
- Source-derived KPI cards with definition/source/window/scope/drilldown.
- Separate receiving HOLD and inspection HOLD meanings.
- PASS/release boundary; no zero counts on failed source.
66. /quarantine/inspections/[inspectionId]/execute — “Execute inspection”
- Inspection/receiving/item identity and version.
- Controlled digital form if available, otherwise legacy point form.
- Receiving snapshot: Document, Lot/batch, Quantity, Template version.
- Sections/points: label, required marker, requirement, unit.
- Numeric exact reading; Acceptable/Not acceptable; Observation/remarks; N/A per point type.
- Per-point remarks/result/error.
- Save results; Submit for review; Resume for correction where authorized.
- Submission-readiness checklist; current record/history link.
- Legacy general notes are not saved; digital form general remarks are persisted.
- Official final result not accepted from client.
67. /quarantine/inspections/[inspectionId] — inspection number
- Workflow state, Inspection result, Controlled template/version.
- Receiving snapshot; author/executor, created/version.
- Open execution / Open review, state-dependent.
- Editable digital inspection metadata:
- AQL, Code letter, Inspection level, Sample size, Accept number, Reject number, Observed defects, Source reference.
- Sampling result: Accept / Reject / Not applicable.
- Record sampling.
- Equipment selector → Link current calibration evidence.
- Read-only digital preview.
- No scientific sampling values calculated here.
- Current detail-link condition does not visibly include pending-QCM review in the same way the laboratory overview does; preserve as an implementation caveat, not an invented transition.
68. /quarantine/inspections/[inspectionId]/review — “Review inspection”
- Record overview, approval stage, prerequisites.
- Snapshot: workflow state, author/audit context, receiving/item, template.
- Recorded points/evidence counts; preserved submission/return history.
- Decision rail:
- Begin review.
- Sign stage approval — send to QCM + password.
- Reject inspection + reason.
- QCM final approval — approve and lock + password.
- Reject at QCM stage + reason.
- Return for correction + reason.
- Controlled digital read-only preview.
- Each action scope/state/version/SoD/policy checked; approval never releases receiving.
69. /quarantine/inspections — “Inspection reports”
- Filters: Workflow state, Inspection result, Ownership.
- Columns: Inspection number, Receiving item, Inspector, Workflow state, Inspection result.
- Row links; Open receiving register; Clear filters; pagination.
- New inspection starts from receiving, not a standalone /new page.
70. /quarantine/receiving/[receivingId] — receiving number
- Item code/description/lot/supplier/version.
- Three separate facts: Receiving state, Inspection result, Release System State.
- Details: Supplier, Document, Purchase order, Quantity+unit, Received, Expiry, Evidence links, import source.
- Linked inspections; history.
- Create inspection:
- Approved mapped template auto-selected if unique, otherwise filtered selector.
- Inspection number from approved source.
- Create inspection.
- Primary actions: Start inspection, conditional Release item, Refresh latest.
- HOLD reason → Place on HOLD.
- Void reason → Void this receiving item for eligible pending item.
- Correction: supplier/document/item/description/lot/quantity/received/expiry + reason; Start correction / Apply correction.
- Version and release prerequisites visible; source/item mapping/effective template required.
- PASS alone does not release; HOLD cannot be bypassed.
71. /quarantine/receiving — “Receiving items”
- Filters:
Search, Item code, Lot, Supplier, Purchase order, Workflow state, Inspection status, Quarantine status, Inspection result, Release state, Received from/to, Expiry from/to, Ownership, Received on (Today).
- Columns:
Receiving number, Item code, Description, Lot, Quantity, Received, Expiry, Inspection, Quarantine, Release, Actions.
- Create receiving item; Open row; filter/clear; pagination.
- Rejected unsupported filters explicitly disclosed.
72. /quarantine/receiving/new — “Create receiving item”
- Required: Receiving number, Supplier, Document number, Item code, Lot/batch, Description, Quantity, Quantity unit, Receiving date.
- Optional: Purchase order, Expiry date.
- Create receiving item / Cancel / Back.
- Starts Pending.
- Quantity and unit separate; no merged string input.
I. Reject reports — pages 73–76
73. /reject-reports/daily/[reportId] — report number
- Header: Record date, Department/section, Shift, Recorded by, Created, Finalized, void details.
- Totals grouped by exact recorded unit:
Reject quantity, Good production quantity, Reject %, Entries.
- Entry columns:
#, Machine, Item code, Description, Lot, BU/RM product, RM details, Pump out, Reject qty, Good qty, Reject %, Limit, Formula/BOM, Reason.
- Add-entry form:
Machine name, Item code, Material/product description, Lot, BU & RM product, RM description/unit/lot/type, Pump out qty, Reject qty, Good qty, Reject limit, Formula/BOM, Reject reason, Analysis/notes.
- Add entry; Finalize record when at least one entry; Void record + reason; Print view.
- Creator/permission/state controls.
- Reject %=reject÷good×100, server-rounded 4 decimals; zero good has no percentage.
- Never add incompatible unit totals; no approval confirmation required for this type.
74. /reject-reports — “Reject reports”
- Seven cards: Reports today, Reports this month, Issue slips, Daily reject records, Awaiting approvals, Completed Issue slips, Finalized Daily reject.
- Analytics disclosure:
- quantities by report type/unit;
- trend table Date, Report type, Recorded unit, Rejected qty, Reports, Open matching records;
- top items, reasons, department, approval status, daily reject-% trend.
- Tabs exact: All, Issue slips, Daily reject, Awaiting approvals, Completed.
- Filters: Search, Item code, Item name, Lot, Department, Recorded unit, Include missing unit, Status, From, To.
- Issue-slip columns: Report no, Date, Item, Lot, Qty, Department, Status.
- Daily columns: Record no, Date, Department, Entries, Reject qty, Status.
- Recent reports list; Create report; drilldown links.
- Unit/type separation mandatory; no combined scalar rejected quantity.
75. /reject-reports/issue-slips/[reportId] — report number
- Report/date/department/creator/created/issued/completed/void metadata.
- Item: code/name/description/lot, rejected quantity+unit, unit cost, total value.
- Reject reason, Remarks.
- Three approval checkpoints in order: Supervisor → QC Manager → Factory Director.
- Checkpoint states: Pending / Confirmed / Reversed; name/time/note/reversal reason.
- Creator records optional Approver name → Confirm approval.
- Reverse confirmation requires Correction reason.
- Issue slip (start approval tracking); Void report + reason; Print view.
- Only next checkpoint confirmable.
- These are creator-recorded real-world confirmations, not approver electronic signatures; formal signature applicability remains blocked/unresolved.
76. /reject-reports/new — “New reject report”
- Type tabs:
Rejected Material/Product Issue Slip / Daily Production & Rejection Record.
- Common: Report/Record date, Department/section, optional Shift.
- Slip: Item code/name, Goods description, Lot/batch, Unit, Rejected quantity, optional Unit cost/Total value, Reject reason, Detailed remarks.
- Daily: Machine, FG/Small-FG item code, Material/product description, Lot, BU/RM product, RM description/unit/lot/type, Pump out, Total reject qty, Total good qty, Reject limit, Formula/BOM, Reject reason, Analysis.
- Create issue slip / Create daily reject record; Cancel.
- Report numbers generated automatically.
- Do not redesign the checkpoints as in-app signature approvals.
J. Reports, search, backups, system — pages 77–84
77. /reports/[reportCode] — registered report title
- Only current registered code: quarantine-aging.
- Title: Quarantine receiving register.
- Provenance: Source, Prepared by, Actor scope, Period, Filters, Sort, Dataset snapshot, Status, Generated at UTC, Rows.
- Columns:
Receiving number, Document number, Item code, Description, Lot, Quantity, Receiving date, Expiry date, Workflow state, Inspection result, Release system state.
- Export CSV / XLSX; density selector; All reports.
- No bulk actions, no editable rows.
- Digest-pinned exports reject stale changed dataset; not a durable report-run snapshot.
- Print informational watermark.
78. /reports — “Reports”
- Cards: code, linked title, description, Open report.
- Only one current report definition; do not populate fictional report catalog as implemented capability.
79. /search — “Find authorized records”
- Search records text, Search, Clear search.
- Result rows: type, business id, descriptor, state, context; destination link.
- Showing x of total; Next results cursor.
- Initial guidance, no results, invalid query/cursor, denied, provider unavailable.
- Search 1–200 chars; no disclosure outside read scope.
80. /system/backups/[backupId] — “Backup set”
- Job state separate from restore verification.
- Metadata: requested/artifact created/verified dates, size, checksum presence (value withheld), catalog checked, schema version.
- Restore operations columns:
Operation, Type, State, Target environment, Requested.
- Technical disclosure: internal reference, request id.
- Known gaps; conditional Request restore.
- Merely opening never executes restore.
81. /system/backups/[backupId]/restore — “Restore request”
- Backup state/artifact/checksum/schema/timing context; app/SHA binding missing if unrecorded.
- Verification-requirements list explicitly not recorded; RPO/RTO not approved.
- Form: Restore type, Target environment, required Reason, acknowledgement checkbox.
- Targets: test/local/staging; production unavailable.
- Record restore request; Back.
- Records PLANNED intent only; no executor, no verified restore claim.
- Idempotency and eligibility snapshot checked.
82. /system/backups — “Backups”
- Filter: Backup job result.
- Columns:
Backup set, Backup job result, Artifact verified, Schema version, Requested (Asia/Riyadh).
- Row links; pagination.
- Recovery objectives: RPO not approved, RTO not approved, Measured recovery not measured.
- Coverage: Scheduler, Catalog, Artifact storage, Retention, PITR/WAL, Failure monitoring, Response owner.
- Historical provider observations must remain dated, not portrayed as fresh live proof.
83. /system/control-center — “System control center”
- Named-owner-only.
- Top release-readiness banner, not subsystem “healthy” conclusion.
- Overview cards: Application, PostgreSQL, Audit subsystem, Migrations; checked timestamps.
- Applied/build/expected migration heads; pending count; release verification/id/build/SHA/version/environment.
- Accounts:
- Search/State; sortable login/display/state/last login.
- Columns Login identity, Display name, Email, State, Roles, Scopes, Last login, Manage.
- Matching count; paging; protected-owner marker.
- Embedded Create account:
Login identity, Display name, Email, Temporary password, optional initial roles/scopes.
- Canonical roles table: Role, State, Administration.
- Configuration boundary: secrets managed outside app; no settings editor.
- Recent activity: When, Action, Subject, State change.
- Existing governed admin workflows reused; no owner bypass of business controls.
84. /system/health — “System health”
- Named-owner-only.
- Separate summary layers:
Application/database connectivity; Database migration state; Required workflow readiness; QC release acceptance evidence.
- Dependencies columns: Dependency, Status, Checked (Asia/Riyadh), Detail.
- Recovery guidance.
- Outbox diagnostics:
Pending, Available now, Retrying, highest attempts, oldest pending/time-age, most recent processed.
- Worker heartbeat NOT RECORDED; channel delivery NOT REPRESENTED.
- Alerting NOT APPROVED / NOT CONFIGURED.
- Backup/recovery posture when allowed.
- Release identity: verification, working-tree cleanliness, release/build/timestamp/SHA/environment/migration.
- Identity table: Identity element, Source, Status.
- Health/readiness never production acceptance; no fabricated green GO.
K. Tasks and personal work — pages 85–88
85. /tasks/[taskId] — task title
- Task number/version.
- Overview: Owner, Assignee, Priority, Due date, State, Version, Next step, Description.
- Related specialized record + recurrence; read-only checklist.
- Reason textarea.
- State/permission-dependent actions:
Activate, Start, Put on hold, Complete, Resume, Reopen.
- Transition history: action/state change/time/actor/reason.
- Hold/reopen/resume reasons remain governed.
- Completing task does not approve/change linked domain record.
86. /tasks — “Tasks”
- Filters: Search, State, Due (Overdue/Today), Assignee (Only mine), Show (Open work only), Sort by, Direction.
- Columns:
Task number, Title, Owner, Priority, Assignee, Due, State, Version, Next step.
- Create task; row links; density/pagination; Clear filters.
- Completed/cancelled tasks never overdue.
87. /tasks/new — “Create task”
- Required: Task number, Title.
- Optional: Description, Priority, Due date.
- Related specialized record:
Record type (DOCUMENT/LAB_TEST/CHANGE_REQUEST/FINDING/NCR/RCA/CAPA), Record identity.
- Recurrence: Rule identity + exact UTC occurrence.
- Save draft / Cancel / Back.
- Draft preview: current owner, priority/due/state/version/next action.
- Same rule+occurrence retry returns same task; changed command conflicts.
- No invented assignee/team selector.
88. /work — “My work today”
- Authenticated identity: Signed in as, Role, Scope.
- Server snapshot, UTC windows, Refresh.
- Four source-defined groups:
Assigned to you, Due today, Overdue, Blocked.
- Each: true total/null, membership text, state message, count-definition disclosure, source register links.
- Item: title, reason, age/state, next action, responsible role, source label, severity.
- Each record displayed once in most urgent group; group counts can overlap and must not be summed.
- Maximum 10 displayed per group; true totals remain visible.
- Unresolved-source panel names missing data and owner.
- No invented free-text blocked-reason column or SLA.