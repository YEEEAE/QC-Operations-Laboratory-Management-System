# QC Service Design — End-to-End Operational Journey Maps

**Date:** 2026-09-10  
**Scope:** Receiving → Quarantine → Inspection → Laboratory (when required) → Finding/NCR (when applicable) → Disposition → Approval → Release → Audit; Equipment/Calibration; Controlled Documents/Change Requests.  
**Method:** As-is service blueprint from the current repository, Foundation documents, route map, and available application use cases. Proposed changes are marked **TO-BE**.  
**Authority:** `SYSTEM-INVARIANTS.md`, `DOMAIN-MAP.md`, `BUSINESS-RULES.md`, `STATE-MACHINES.md`, `ROLE-MATRIX.md`, `PERMISSION-MATRIX.md`, `UI-UX-SPECIFICATION.md`, `ROUTE-MANIFEST-SPECIFICATION.md`.

## Executive verdict

**Status: PARTIAL — the domain ownership is clear, but the service currently behaves like a set of linked workspaces rather than one visible operational journey.**

The safest improvement is a cross-domain **case context and next-action rail** assembled from authorized read models. It should show where the record is, which domain owns the next transition, what is waiting, and what evidence is already captured. It must not create a shared “master status” or move mutation authority into Dashboard, Search, Notifications, Approvals, or Tasks.

### Highest-impact service problems

| Priority | Problem | Operational effect | Recommended service response |
|---|---|---|---|
| P0 | Waiting states do not consistently name the next owner, dependency, or expected event. | Work can sit in `SUBMITTED`, `RELEASE_PENDING`, `DUE`, or `IN_REVIEW` with no clear recovery path. | Add a server-derived `Next action / Waiting on / Blocked by / Last updated` block to every detail and review workspace. |
| P0 | Cross-domain links are often register-level, not record-level. | Operators must search again for the receiving item, inspection, lab test, equipment, or audit trail. | Add authorized record-context links using canonical UUID routes and human-readable business numbers; never expose an ID as authority. |
| P1 | Notification, approval, and audit evidence are not presented as one traceable handoff. | Users cannot tell whether a handoff committed, was delivered, or was only requested. | Show business transition, outbox/notification delivery, and audit evidence as separate facts in one timeline. |
| P1 | Policy-dependent gates are presented as if they were ordinary unavailable buttons. | Users reach dead ends without knowing whether the blocker is policy, permission, state, evidence, or provider availability. | Use typed reason copy and a safe recovery destination; never invent a scientific or release policy. |
| P1 | Repeated identity entry remains possible at domain boundaries. | Receiving identity, equipment, calibration, document version, and source context can be re-found or re-entered. | Use read-only source snapshots and “create from source” handoffs; require correction/change request for controlled data changes. |
| P2 | List/detail/review return paths are not a guaranteed case-preserving loop. | Back navigation can lose filters, queue context, or the user’s next work item. | Preserve safe `returnTo` list context and provide explicit “Back to [queue]” plus “Open next eligible item” where the server can prove it. |

## Service blueprint conventions

- **Read visibility:** every active authenticated member may read ordinary operational pages/records; this does not grant action authority.
- **Action authority:** every mutation is rechecked server-side for actor, account state, permission, scope, entity, state, version, SoD, business preconditions, and e-signature where required.
- **Handoff:** a reference, snapshot, notification, approval request, or owning-domain use case—not a direct write across domain tables.
- **Wait state:** a visible state with a named owner and dependency. “No action” is not an acceptable explanation.
- **Evidence:** controlled snapshot, raw measurement, source version, file/hash, approval/signature evidence, audit event, or notification/outbox reference as applicable.
- **Completion:** the domain-owned transition committed. A notification delivered, search indexed, or task created is a side effect and does not replace completion.

## Journey 1 — Receiving item to release and audit

### Service actors and ownership

| Actor / capability | Responsibility in this journey |
|---|---|
| Receiving operator / active member | Registers and prepares the receiving item when authorized. |
| Inspector / laboratory executor | Performs the owned inspection or test and records observations/results. |
| Reviewer / approver | Reviews or approves only with explicit permission and SoD checks; exact role policy remains source-dependent where marked. |
| Quarantine Domain | Owns Receiving Item, Inspection workflow/result, Quarantine status, and System Release State. |
| Laboratory Domain | Owns Lab Test, Sample, Measurement, Result, Retest, and scientific context when a test is required. |
| Quality Domain | Owns Finding/NCR/RCA/CAPA when a quality workflow is created. |
| Reviews & Approvals / E-Signature | Own approval assignment/decision and signature evidence; do not own the source record’s state machine. |
| Notifications / Audit / Files & Evidence | Shared capabilities: delivery record, append-only history, and evidence metadata/storage. |

### As-is journey map

| Stage | Actor | Trigger | System touchpoint | Action | System response | Handoff | Wait state | Failure mode | Decision | Evidence | Completion | Next owner |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1. Register receiving | Receiving operator | Physical item/document arrives | `/quarantine/receiving/new` → Quarantine create use case | Enters receiving identity, lot, quantity, dates, and evidence | Creates formal Receiving Item in `PENDING`; generates Receiving ID; validates required data | Quarantine owns the record | None if valid; otherwise validation recovery | Missing/invalid quantity, expiry, duplicate definition unresolved, provider unavailable | Accept draft or correct before creation | Receiving fields, attachments, actor, timestamp, audit reference | `PENDING` record exists | Quarantine receiving owner |
| 2. Prepare quarantine | Quarantine operator | Required receiving data complete | Receiving detail/register | Marks item ready when allowed | Transitions `PENDING → READY_FOR_INSPECTION`; does not infer inspection result or release | Quarantine → Inspection workflow | `PENDING` while incomplete | Expired/cancelled item, stale version, missing required data | Ready now or remain pending | Current record version and transition audit | `READY_FOR_INSPECTION` | Inspector / inspection owner |
| 3. Start inspection | Inspector | Item is ready and action is authorized | Receiving detail → `/quarantine/inspections/[inspectionId]/execute` | Starts inspection intent | Transactionally creates/links Inspection Report, captures receiving identity and approved template context, moves receiving to `UNDER_INSPECTION` | Quarantine inspection workflow | `UNDER_INSPECTION` until submitted/returned/completed | No approved template, authorization denied, stale item, transaction failure | Execute inspection or stop/hold via owned transition | Receiving snapshot, template/version reference, evidence requirements | Inspection report in `DRAFT`; receiving under inspection | Inspector / executor |
| 4. Execute inspection | Inspector | Draft or resumed returned report | Inspection execution workspace | Records observations and required evidence | Validates required points and controlled criteria; preserves source context | Inspection → review queue | `DRAFT` / `RETURNED` while work is incomplete | Missing point/evidence, invalid source, conflicting edit, upload failure | Submit, correct, or remain draft | Observations, evidence, source/template version, version number | `DRAFT → SUBMITTED` only when preconditions pass | Reviewer |
| 5. Review / approve inspection | Reviewer / approver | Submitted report enters review | Inspection review + Approval work item | Begins review; returns, rejects, or approves as authorized | Revalidates state/version/SoD/evidence; approval is atomic with required Quarantine consequences; creates durable notification/outbox | Approval evidence → Quarantine owning transition | `SUBMITTED` / `UNDER_REVIEW` while assigned or awaiting decision | Self-review/self-approval, stale version, missing evidence, policy-dependent approval gate | `RETURNED`, `REJECTED`, or `APPROVED`; scientific `PASS/FAIL/HOLD` remains distinct | Final inspection snapshot, decision/reason, signature if policy requires, audit event | Inspection approved/rejected; receiving consequence committed if defined | Quarantine release/disposition owner, or Quality/Lab depending result |
| 6. Laboratory test (conditional) | Lab executor/reviewer | Approved inspection/test method requires lab evidence | `/laboratory/tests/[labTestId]/execute` and `/review` | Creates/executes test, records raw measurements, units, conditions, equipment, and controlled sources | Saves raw values and snapshots; keeps PASS/FAIL tied to approved criteria; retest never overwrites original | Quarantine references Lab Test; Laboratory owns test | `DRAFT`, `SUBMITTED`, `UNDER_REVIEW` | Invented limit, missing unit/source/equipment, calibration context unavailable, invalid bulk paste, stale version | Test required? If yes, submit/review/approve; if no, continue inspection path | Raw observations, method/WI/SOP version, equipment/calibration snapshot, result, evidence | Lab Test approved/rejected; original/retest history preserved | Quarantine decision owner / Quality if failure |
| 7. Finding / NCR (conditional) | Quality owner | Inspection/lab failure or hold meets Quality policy | Linked Quality finding/NCR route | Creates or starts Finding/NCR workflow; records reason and source link | Creates Quality-owned record; does not rewrite Inspection/Lab record | Quarantine/Lab → Quality by reference/event | `OPEN`, `UNDER_REVIEW`, or policy-defined investigation state | Automatic NCR policy is unconfirmed; source link missing; wrong owner | Create NCR, create Finding, or no quality case according to approved policy | Source record reference/snapshot, reason, evidence, audit | Quality case reaches its own defined state | Quality/NCR owner |
| 8. Disposition / release pending | Quarantine owner / authorized decision maker | Inspection is complete and result is compatible with release | Receiving detail, Quarantine overview, approval queue | Reviews all blockers and requests/executes disposition | Keeps Receiving workflow, Inspection Result, and Release System separate; moves to `RELEASE_PENDING` only when preconditions are met | Quality/Lab/Approval evidence → Quarantine | `HOLD` or `RELEASE_PENDING` with explicit blocker | PASS mistaken for release, unresolved hold/NCR, expired item, missing approval, policy gate not approved | Release, hold, expire, or another approved disposition | Linked inspection/lab/quality decisions and release preconditions | `RELEASE_PENDING` or controlled hold/expiry state | Quarantine release authority |
| 9. Release | Authorized release actor | Release action is explicitly allowed | Receiving detail → `releaseReceiving` use case | Performs release intent; signs/re-authenticates if required by approved policy | Rechecks state/version/permission; transactionally sets `RELEASED` and `Release System = YES`; writes audit and durable notification/outbox | Quarantine → downstream operational owner/consumer | `RELEASE_PENDING` until decision commits | Release permission/policy denied, stale version, unresolved blocker, signature failure | Release or remain pending/hold | Release decision, actor, trusted timestamp, version, signature/audit references | Receiving item `RELEASED`; release system yes | Downstream material/process owner |
| 10. Audit history | Any authorized audit viewer / record owner | Any important mutation | `/audit` plus record-context history | Filters/opens history from the source journey | Shows append-only events; must distinguish business transition from notification/search side effects | All domains → Audit capability | Audit query/provider unavailable | Empty mistaken for provider failure, inaccessible security fields, no record-context link | Trace event or return to source record | Actor, timestamp, entity, action, old/new state, reason, request ID | Trace is complete when source event and controlled evidence are findable | Audit viewer / source owner |

### Journey 1 — Broken handoffs and fixes

| Finding | Evidence from current design/repository | TO-BE service link |
|---|---|---|
| Receiving detail points to the inspection register, not necessarily the linked inspection record/workspace. | `src/pages/quarantine/receiving/[receivingId].astro` exposes “Inspection register”; the domain model supports a Receiving → Inspection relationship. | Render the authorized linked inspection business number, state, and `Open execution/review` destination when the link exists; otherwise show “No inspection linked yet” with the authorized next action. |
| Approval is a separate workspace without a guaranteed source-record return path. | `/approvals/[approvalId]` presents a controlled subject snapshot and context; route manifest defines source detail as a next destination. | Add `Back to source record`, `Open approval evidence`, and a visible “owner of next transition” label. Keep Approval infrastructure read/decision-only. |
| PASS and release are correctly separated, but the user can still stop at a note. | Receiving detail warns “PASS is recorded, but this item is not released”; release remains policy-controlled. | Replace the note-only ending with typed next action: `Release item` when allowed, `Why release is unavailable` with reason, or `Open unresolved blocker`. |
| Failure-to-Quality routing is policy-dependent and can become a dead end. | `BR-INSP-015` allows a Quality workflow; `BR-INSP-016` leaves automatic NCR creation unconfirmed. | Show `Quality case: not created / pending policy decision / linked NCR` as a separate fact; never auto-create NCR until policy is approved. |
| Audit is a global table and not consistently a contextual trail. | `/audit` is read-only and filterable, but detail pages commonly describe history without embedding a subject-filtered destination. | Add `View audit history for this record` using a server-built safe subject filter; preserve audit ownership and authorization. |
| Notification delivery is not the same as handoff completion. | Business rules require idempotent notifications and retry-only delivery after a committed transition. | Timeline rows must say `Transition committed`, `Notification queued/delivered/failed`, and `Audit recorded` separately. |

### Journey 1 — Decision gates that must be visible

1. **Needs laboratory test?** The decision belongs to the approved inspection/test method or source policy; it must not be inferred from a generic UI flag.
2. **Does a failure create Finding/NCR?** Current policy is unconfirmed; show a pending policy gate rather than inventing automatic behavior.
3. **Is inspection result compatible with release?** Current policy is source-dependent; `PASS` alone is insufficient.
4. **Can this actor review/approve/release?** Server-side permission, scope, state, version, SoD, and signature checks decide.
5. **What is waiting?** Always name the owner and dependency: `waiting for inspector`, `waiting for reviewer`, `waiting for Quality disposition`, `waiting for approved release authority`, or `waiting for notification retry`.

## Journey 2 — Equipment to calibration due and status update

### As-is journey map

| Stage | Actor | Trigger | System touchpoint | Action | System response | Handoff | Wait state | Failure mode | Decision | Evidence | Completion | Next owner |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1. Identify equipment | Asset owner / active member | New equipment or existing asset needs attention | `/assets/equipment` → equipment detail | Opens stable equipment record | Shows explicit equipment identity/status and related calibration/maintenance | Equipment → Calibration/Maintenance by link | None | Record not found, related provider unavailable, status unclear | Create, inspect, or open related work | Equipment identity, status, version, history | Correct asset context opened | Asset owner |
| 2. Calibration becomes due | System / calibration owner | Trusted time reaches approved due date | Calibration register/dashboard/read model | Reviews due item | Derives `DUE`/`OVERDUE` from approved date/time; does not invent interval | Calibration → notification/assignment | `DUE` or `OVERDUE` until work is submitted/approved/current | Missing approved interval/date, stale read model, no notification, false zero | Warn, assign, or create calibration record according to policy | Due date source, trusted time, current calibration reference | Due state is visible and actionable | Calibration owner |
| 3. Warning and assignment | Notification capability + owner | Due/overdue event or assignment | Notifications, dashboard, calibration detail | Opens notification and follows record-level link | Notification contains safe context; it authorizes nothing; deduplication key prevents repeats | Notification → Calibration detail/task if one exists | Unread/assigned; delivery may be pending/failed | Notification delivered without owner/action, duplicate notification, record link lost | Open calibration, create/continue work, escalate | Event reference, recipient, delivery/read state | Owner has a canonical work destination | Calibration owner |
| 4. Execute calibration | Calibration executor | Authorized calibration work starts | `/assets/calibrations/new`/detail | Records source-provided calibration result and certificate/evidence | Creates historical calibration record; validates evidence; preserves prior record | Calibration → reviewer/approval | `DRAFT` / `SUBMITTED` | Missing certificate/hash, invalid source, no equipment link, stale draft | Submit or correct | Certificate metadata/hash, calibration values/source, equipment link | `SUBMITTED` | Reviewer/approver |
| 5. Review / approve | Reviewer/approver | Calibration submitted | Calibration detail + approval infrastructure | Reviews evidence and decides | Uses current state/version/permission/SoD; approval does not silently make equipment current unless policy says so | Approval → Calibration owning transition | `SUBMITTED`/approval `PENDING` | Self-approval, stale version, approval policy unavailable | Approve, return, reject | Decision, reason, signature if required, audit | `APPROVED` | Calibration owner / equipment owner |
| 6. Make current / update status | Calibration owner / system | Approved calibration and policy permit activation | Calibration detail + equipment detail | Makes calibration current; system updates due lifecycle | New current calibration supersedes previous current/due/overdue record; equipment status remains a separate fact | Calibration → Equipment read contract | `APPROVED` until current; equipment may remain status-unchanged | Current/equipment policy unresolved; maintenance completion confused with calibration | Current, warn, out-of-service, or exception only per approved policy | Calibration transition, supersession, equipment status audit | `CURRENT` calibration; next due lifecycle visible | Equipment/Calibration owner |

### Journey 2 — Broken handoffs and fixes

- **Due does not equal unavailable.** `BR-CAL-004` leaves overdue use policy unconfirmed. UI must show `OVERDUE` plus “Use policy: not approved” or the approved restriction, never silently disable laboratory work or imply safe use.
- **Notification can end at an inbox.** Every calibration notification needs a canonical calibration/equipment destination and a named owner; if no task exists, the notification should say “Open calibration record” rather than imply a task was created.
- **Maintenance and calibration are easy to confuse.** The equipment context must show separate cards: `Maintenance status`, `Calibration status`, `Equipment operational status`; maintenance completion must never be rendered as calibration proof.
- **Approval-to-current is a hidden dependency.** The detail screen must state whether `APPROVED → CURRENT` is automatic, manual, or policy-blocked. The source currently marks it policy-dependent.
- **Old calibration evidence needs a historical route.** When a new calibration becomes current, the previous record must remain one click away as `SUPERSEDED`, including the exact test/inspection snapshots that referenced it.

## Journey 3 — Controlled document through supersession

### As-is journey map

| Stage | Actor | Trigger | System touchpoint | Action | System response | Handoff | Wait state | Failure mode | Decision | Evidence | Completion | Next owner |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1. Create identity/draft | Document owner | New WI/SOP or controlled revision is needed | `/documents/new` or `/documents/[documentId]/versions/new` | Creates identity or new version draft | Keeps identity separate from version; new revision does not overwrite effective version | Documents → author | `CATALOG_ONLY`/`DRAFT` | Confusing identity with version, target/version not authorized, source missing | Manage catalog or start controlled draft | Document identity, draft version, author, source files | New draft exists | Document author |
| 2. Submit for review | Document author | Draft content and required evidence are complete | Version detail/edit → review route | Submits version | Transitions `DRAFT → IN_REVIEW`; freezes the submitted review context as required | Documents → Reviews & Approvals | `IN_REVIEW` until reviewed | Missing content/evidence, stale version, generic error, no return reason | Submit or correct | Content/hash, version, submitted timestamp, audit | `IN_REVIEW` | Reviewer |
| 3. Review | Reviewer | Version is in review | `/documents/.../review` and approval work item | Reviews content, returns/rejects/approves as authorized | Preserves review history and separates review from approval | Reviewer → author or approver | `IN_REVIEW` / `RETURNED` | Reviewer cannot find source, return reason hidden, SoD conflict | Return with reason, reject, or progress to approval | Review comments, decision, version, evidence | `RETURNED` or approval-ready | Author or approver |
| 4. Approve | Approver | Review complete and policy permits | Approval detail + document version | Approves controlled version | Revalidates permission/state/version/SoD; stores approval evidence; does not directly mutate unrelated domains | Approval → Documents owning transition | Approval `PENDING` | Stale content, missing signature, wrong authority, policy gate unresolved | Approve or reject | Snapshot/hash, approval decision, signature/audit reference | `APPROVED` | Document owner / effective-date owner |
| 5. Make effective | Document owner/system | Approved version reaches effective condition | Version detail/document history | Activates or schedules effective version | Uses explicit policy; old effective version remains until transactionally superseded | Documents → downstream WI/SOP consumers | `APPROVED` while awaiting effective date/activation | Effective-date policy unconfirmed, scheduled activation not visible | Effective now, scheduled, or policy-blocked | Effective timestamp/date, version relationship, audit | `EFFECTIVE` | Document owner / operational consumers |
| 6. Request change | Any authorized requester | Effective content needs controlled change | `/change-requests/new` | Selects authorized target/version, enters current/proposed values and reason | Server derives target/version/snapshot; creates request without direct target mutation | Change Requests → Documents owning domain | Change request `DRAFT`/`SUBMITTED` | Repeated target entry, stale target, missing reason, ambiguous field path | Submit request or keep draft | Current/proposed values, target snapshot, reason, requester, version | `SUBMITTED` | Change reviewer |
| 7. Review/approve/apply change | Change reviewer/approver + Documents owner | Request submitted | Change request detail/review + approval | Reviews and approves; owning Documents use case applies | Approval does not guarantee application; stale/invalid target fails safely; application is transactional | Change Requests → Documents | `UNDER_REVIEW`/`APPROVED`/`APPLYING` | Target changed, application failure, direct update temptation, notification failure | Return/reject/approve/apply/retry application only | Request history, approval evidence, target version, application result/audit | `APPLIED` or explicit failed state with recovery | Document owner |
| 8. Supersede | Documents owner/system | New approved version becomes effective | Document version/history | Supersedes old version transactionally | Old version becomes `SUPERSEDED`, remains available; historical inspection/lab records keep the version actually used | Documents → all consumers by reference, notification, or search projection | Old version `SUPERSEDED`; downstream acknowledgement may be separate | Old version disappears, downstream history rewritten, search stale | Supersede and activate new version | Version chain, effective/superseded timestamps, controlled hash, audit | New `EFFECTIVE`; old `SUPERSEDED` | Operational consumers / document owner |

### Journey 3 — Broken handoffs and fixes

- **Review and approval are visually close but operationally different.** The UI should show two explicit milestones and owners, not a generic “approved” badge on a review page.
- **Effective timing is a real wait state.** `APPROVED` must expose `Effective: pending policy/date/activation` when `APPROVED` and `EFFECTIVE` are separate; do not assume approval means effective.
- **Change Request target selection still risks repeated entry.** The current route intentionally uses an authorized document-version picker. Extend that pattern to display current version, proposed version, hash, and link back to the source version; do not accept raw target IDs from the user as the business meaning.
- **Application failure after approval needs a next action.** Show `Approved, not applied` as a distinct state with owner, failure code, retry/application destination, and preserved approval evidence. Never silently re-run approval.
- **Supersession must close the consumer loop.** A new effective version should show affected downstream records/uses as read-only references where authorized, while preserving historical snapshots. Do not rewrite old inspection/lab context to the latest version.

## Cross-journey service contract (TO-BE)

Every operational detail/review page should expose the following server-derived block. It is a composition/read model, not a new domain record:

```text
Journey context
  Source record: [business number + owning domain]
  Current state: [domain-owned state(s), never one merged status]
  Current version: [optimistic concurrency version]
  Last committed action: [action + trusted timestamp]

Next action
  Primary next action: [authorized intent route, or “No action available”]
  Why unavailable: [permission | scope | state | version | SoD | evidence | policy | dependency]
  Next owner: [role/assignment from authorized read model]

Waiting / dependency
  Waiting on: [actor, domain, approval, evidence, provider, scheduled date]
  Since: [trusted timestamp]
  Expected event: [submission, review, approval, notification retry, activation]
  Recovery: [safe link or explicit reason; no silent retry of business mutation]

Evidence and trace
  Controlled context: [template/method/document/calibration snapshot]
  Related records: [record-level links, read-only where cross-domain]
  Audit: [subject-filtered history link]
  Notifications: [delivery state, separate from business completion]
```

### Link and handoff rules

| Link type | Allowed destination | Required behavior |
|---|---|---|
| Source → child workflow | Owning domain’s canonical detail/execute/review route | Carry record context; prefill from source snapshot; do not re-enter controlled identity. |
| Source → related domain | Authorized read/detail route owned by related domain | Use reference/snapshot semantics; label the owning domain and preserve “back to source”. |
| Approval → source | Owning domain detail/review route | Show exact version under decision and return destination; Approval does not mutate source directly. |
| Notification → work | Canonical record or queue route | Safe context, deduplicated event, explicit action; notification never grants permission. |
| Detail → audit | `/audit` with a server-built, authorized subject filter | Read-only, append-only history; distinguish unavailable from empty. |
| Change Request → target | Authorized target version detail | Show current/proposed values and stale guard; application runs through target owner. |
| Dashboard/Search → record | Authorized read model/detail route | Read-side only; no dashboard/search mutation and no false zero when provider is unavailable. |

## Prioritized service backlog

| Rank | Change | Impact | Feasibility | Boundary preserved |
|---:|---|---|---|---|
| 1 | Add a reusable server-derived `Next action / Waiting on / Next owner / Why` panel to Receiving, Inspection, Lab Test, Calibration, Document Version, Approval, and Change Request detail pages. | Very high | Medium | Yes; read composition only, action remains in owner use case. |
| 2 | Replace register-only cross-links with record-level links and safe return context across Receiving ↔ Inspection ↔ Lab ↔ Quality ↔ Release ↔ Audit. | Very high | Medium | Yes; references/snapshots only. |
| 3 | Add a split timeline for committed business transition, approval/signature evidence, audit event, and notification delivery. | High | Medium | Yes; Audit/Notifications remain separate capabilities. |
| 4 | Add typed waiting/error states for policy-dependent, stale, authorization, evidence, and provider-unavailable blockers. | High | Low–medium | Yes; no policy values invented. |
| 5 | Add “open next eligible item” only where server-side assignment/state/permission can prove the destination. | Medium | Medium | Yes; no client-side queue authority. |
| 6 | Add journey-level negative tests for missing linked child, stale source, failed notification, approval-without-application, and superseded historical context. | High | Medium | Yes; strengthens fail-closed behavior. |

## Verification and limitations

- **Repository evidence reviewed:** current routes/use cases for Quarantine, Laboratory, Assets/Calibration, Documents, Approvals, Change Requests, Notifications, and Audit; related IA and interaction audits.
- **UI Pro Max:** `journey-map` skill applied; `ui-ux-pro-max` UX search initially returned no exact “enterprise workflow handoff” match, then verified narrower matches for workflow feedback, loading/double-submit prevention, keyboard navigation, breadcrumbs, deep links, and active navigation. Astro stack guidance verified server/on-demand routes, API routes, and no-JS fallback.
- **Static confidence:** ownership, state separation, authorization boundaries, snapshots, stale checks, and most canonical route destinations are supported by the Foundation documents and source inventory.
- **Not verified live:** authenticated browser journey completion for every role/scope, real notifications/outbox delivery, database/provider failures, policy-dependent release/NCR/calibration/document-effective decisions, and end-to-end handoff timing. No POST, approval, release, change application, or production mutation was performed.
- **No scientific or policy values were introduced.** Unconfirmed/source-dependent decisions remain explicitly blocked or policy-labeled.

## Conclusion

The product has the right domain boundaries for a controlled QC service, but users still need a visible service spine across those boundaries. The next implementation slice should make each waiting state and cross-domain handoff explicit, record-level, reversible in navigation, and evidence-linked—while keeping every business transition inside its owning domain and every authorization decision on the server.
