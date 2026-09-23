# Current interface review and measurement baseline

**Date:** 2026-09-23  
**Source revision:** `2040cbf3a6598a78583693f9b2ca4b4cd5e910be` (working tree already contained two unrelated user edits at review start)  
**Scope:** Current navigation contract, seven priority screens, route-level copy context, source-backed states, and a repeatable usability baseline. This is a review artifact; no QC logic or permission implementation was changed.

## Decision summary

The current route registry contains **87 routes** and the current navigation declaration contains **34 destinations**. Every ordinary page is `AUTHENTICATED`; the only `YAZEED_ONLY` routes are `/system/health` and `/system/control-center`. `pageAccessDecision` governs the page gate, while reads and actions remain the responsibility of the owning read model or use case. The active-account visibility matrix has 435 route/persona rows in [route-visibility-matrix.csv](route-visibility-matrix.csv).

The project decision states that active accounts can read ordinary operational records. That decision does not imply access to identity administration data, secrets, or security evidence. This review did not execute read requests as five separate personas, so role-specific data projection remains **NOT VERIFIED** here. No action authority is inferred from link visibility or route access.

The strongest current direction is an operational work surface: show the current record state and the next permitted task first, keep evidence and history available on demand, and make loading, empty, unavailable, denied, conflict, draft, and success states distinct. That direction follows the project’s existing command-center and copy contracts; it does not authorize a visual redesign or new data claims.

## Route visibility and authorization findings

Sources read: `src/shared/routing/routes.ts`, `src/shared/routing/route-types.ts`, `src/shared/routing/page-access.ts`, `src/ui/navigation/navigation.ts`, `src/middleware.ts`, `Documents/ROUTE-MATRIX.md`, `Documents/ROLE-MATRIX.md`, `Documents/UI-UX-SPECIFICATION.md`, and `Documents/AUTHORIZATION-VISIBILITY-DECISION.md`.

| Route class | Employee / Supervisor / Manager / Admin | `yazeed` (`SYSTEM_OWNER`) | Read data | Actions |
|---|---|---|---|---|
| Ordinary route with a primary navigation item | Link visible; active authenticated page gate allows direct opening | Link visible; active authenticated page gate allows direct opening | The approved decision allows ordinary operational reads. Each read model still owns fields, source scope, and failure handling; identity/security data is excluded. | Link and page access grant no action. The owning use case enforces its permission, scope, state, version, SoD, signature, and business rules. |
| Ordinary route without a primary navigation item | No primary-nav item; contextual links/direct paths are available; page gate allows active authenticated accounts | Same | As above | As above |
| `/admin` and `/admin/*` | Primary administration links remain visible; page gate allows active authenticated accounts. Identity/admin read projections require their own authorization. | Same | No identity/security administration data is granted by route visibility. | Explicit action authorization remains required; role label alone is not authority. |
| `/system/health`, `/system/control-center` | Link hidden; direct request is denied as 404 | Link visible; direct page gate allows the active account only when role is `SYSTEM_OWNER` and server-derived `loginIdentity === 'yazeed'` | Sanitized owner-only read model; no raw secrets or diagnostics | Health is read-only. Control-center actions go through their owning use cases and controls. |
| Public root and sign-in surfaces | Public | Public | No protected operational data from the route | Auth use cases only |

`navigation.ts` filters destinations through `pageAccessDecision`; its optional capability hints do not replace that check and do not authorize reads or actions. `routes.ts` also has conditional physical pages: a route gate allowing access does not guarantee a record exists or that an optional page file is present. Record lookup, data authorization, and operation outcomes are separate checks.

The route matrix document retains an older dated freeze (86 routes / 33 destinations). The count above is freshly derived from the current route and navigation source: 87 / 34. The older figures remain historical rather than current code claims.

The contradiction in `Documents/AUTHORIZATION-VISIBILITY-DECISION.md` was corrected in this task: its former `/admin` verification lines said to hide the navigation and deny direct pages for non-Admin accounts. The updated decision now keeps those ordinary pages visible/openable and explicitly leaves identity reads and actions separately authorized. No permission policy or QC rule changed.

## Seven priority screens: task, information, and source

This screen inventory uses the requested paths and current registered route IDs. It describes what the screen should make easy to answer, not proof that a workflow succeeded.

Role coverage for the seven screens: Dashboard, Receiving, Laboratory, Approvals, Controlled documents, and Reports are ordinary authenticated routes for Employee, Supervisor, Manager, Admin, and `yazeed`; data reads and actions are governed separately as shown in the route matrix. System health is visible/openable only for active `yazeed`/`SYSTEM_OWNER`; the other four roles see no link and receive 404 on direct access.

| Screen / route | User need now | Next action | Reveal on demand | Current data source in page code |
|---|---|---|---|---|
| Dashboard — `RT-DASH-001` `/dashboard` | What assigned work needs attention and which register backs each count? | Open the register using the same filter as the count, then open a record | KPI definition, scope, source, freshness, series definition | `dashboardDependencies().get.execute(actor)`; domain-owned projections |
| Receiving — `RT-REC-001` `/quarantine/receiving` | Which receiving item, inspection result, and release state need attention? | Search/filter and open the receiving record | Transition history and linked evidence | `receivingReadDependencies().list.execute({ actor, ...filters })` |
| Laboratory — `RT-LAB-002` `/laboratory/tests` | Which test, sample, workflow state, and official recorded result apply? | Filter and open the test | Approved method/version, criteria source, measurements, and history | `laboratoryReadDependencies().list.execute(...)`; display identity read where present |
| Approvals — `RT-APPROVAL-001` `/approvals` | Is an item assigned to this account/role, and what stage/evidence is awaiting review? | Open the item and inspect current evidence before a controlled decision | Requester, stage history, signature and SoD context | `approvalsReadDependencies().list.execute(actor)` |
| Controlled documents — `RT-DOC-001` `/documents` | Which document and effective version answer the current task? | Search/filter and open the document/version | Version history, captured snapshot, approval details | `documentsReadDependencies().list.execute({ actor, filter })` |
| Reports — `RT-REPORT-001` `/reports` | Which report is available, for what source and period? | Open a report after its read authorization succeeds | Source coverage, period, filters, and export status | Report registry; each report’s owning data query and authorization |
| System health — `RT-SYSTEM-001` `/system/health` | For `yazeed` only: what is healthy, unavailable, or blocking readiness now? | Follow the relevant operational recovery path; the screen performs no QC release action | Dependency/schema detail, sanitized release evidence, backup/recovery posture | `systemHealthReadDependencies().health.execute({ actor })` plus status projections |

### Required screen/state coverage

`SSR` means the page waits for its server-rendered response; it is not a measured loading treatment. `Register only` means the listed screen does not itself prove that state; inspect the detail/action route. `Source-backed` means the source has an explicit branch, not that the branch was visually tested for every role.

| Screen | Loading | Empty | Error | Denied | Unavailable | Conflict | Draft | Success |
|---|---|---|---|---|---|---|---|---|
| Dashboard | SSR; no sampled loading frame | Source projection can be empty/zero | Authorization and read failure branches in the page | Page gate allows active accounts; individual reads may deny | Provider-unavailable branch; do not convert to zero | Detail/action route only | Not a dashboard success state | Server state only; dashboard display is not workflow proof |
| Receiving | SSR; no sampled loading frame | Empty and filtered-empty copy branches | Invalid filter/input and provider failures are separate concerns | Ordinary route gate; verify read/use-case denial separately | `ProviderUnavailableState` | Version conflict belongs to receiving detail/action path | Detail/create workflow only | Requires accepted server transition and record state |
| Laboratory | SSR; no sampled loading frame | Register empty/no-match branch | Filter/read failure branches | Ordinary route gate; action/read use cases remain separate | Provider-unavailable branch | Execution/review detail path | Register may contain source `DRAFT` records | Requires server-accepted save/submit/review; result alone does not release |
| Approvals | SSR; no sampled loading frame | Empty or no-actionable queue | Page catch renders unavailable rather than success | Ordinary page gate does not grant approval authority | Provider-unavailable branch | Current-version conflict belongs to decision flow | Workflow stage comes from the record | Requires server result plus updated approval state/audit |
| Controlled documents | SSR; no sampled loading frame | Empty/no-match branch | Filter/read failure branch | Ordinary route gate; protected identity data excluded | Provider-unavailable branch | Version conflict in edit/review path | Draft version is a distinct lifecycle state | Requires accepted approval/version transition; approval is not release |
| Reports | SSR; no sampled loading frame | Empty registry/read result | Owning report query can fail | Page gate is not report query/export authorization | Must remain distinct from empty | Register only; source-specific report state may conflict | Not implied by registry row | Report load/export requires a confirmed server result |
| System health | SSR; no sampled loading frame | Not a valid substitute for unknown health | Health dependency/error mapping | Non-owner denied as 404 | Explicit unavailable/unknown health state | Not applicable to the read-only health surface | Not applicable | A healthy screen does not prove release readiness or UAT |

For a visual redesign, take one verified frame for each state and role before calling its appearance current. Current static inventory and page code do not establish that all eight states were exercised. In particular, a route status, empty list, `PASS`, or successful build is not evidence of successful end-to-end QC work.

## Copy inventory and information order

Per-route user need, next action, and on-demand detail are mapped in [route-copy-context.csv](route-copy-context.csv) (87 routes). The exact title, button, status, error, and family-owned wording must continue to come from `Documents/COPY-INVENTORY.md`, `Documents/COPY-GLOSSARY.md`, and `src/shared/copy/ux-vocabulary.ts`; the route-context sheet does not introduce new interface copy.

Representative current copy pinned by those sources:

| Surface | Existing wording/source | Design implication |
|---|---|---|
| Receiving register | “Receiving number”, “Workflow state”, “Inspection result”, “Release state”; “Create receiving item”; `passNotRelease` | Keep the three QC facts separately visible; do not compress PASS into release. |
| Inspection registers/review | “Inspection number”, “Inspector”, “Workflow state”; two-stage review wording | Put assigned stage and submitted evidence before history; keep return/reject/approve as distinct controlled actions. |
| Laboratory register | “Test number”, “Executor”; official-result labels and bounded-read notes | Show test/sample/state/result first; put method source, criteria, and detail behind the record context. |
| Documents | “Approval is a separate controlled action”; owner/display-name and lifecycle labels | Show effective version and current state first; reveal prior versions and approval trail on demand. |
| Shared actions | “Apply filters”, “Clear filters”, “Try again”, “Refresh record”, “View audit history” | Buttons name their result or recovery action. |
| Unavailable/empty | “Data is temporarily unavailable”; “The system did not receive a confirmed response. This view is not empty, and no count is shown.” / “No records in this view” | Never present unavailable data as empty or zero. |

Canonical mutation failures remain distinct by class in `uxVocabulary.errorClasses`: validation preserves entries and points to fields; authorization change preserves entries and directs the user to return/contact an administrator; stale conflict requests a reload and says nothing was resubmitted; unavailable dependency requests a current-state check; duplicate command says reload to see the applied state; unknown-safe failure says nothing changed and offers retry or return. Keep the exact source copy when implementing.

For every route, the first viewport should answer **what record/state matters now** and show **the next permitted step**. Put source definitions, full history, evidence detail, and secondary metadata behind a clearly named disclosure or record detail. This reduces paragraph load without hiding the effect of a QC decision.

## Visual audit: repeated patterns and hierarchy

The current desktop dashboard screenshot rendered in the active live session has a left navigation, a two-sentence dashboard introduction, ten equally weighted operational count cards, and larger workflow/attention/trend/activity/coverage panels below. This makes useful source/scope disclosure available, but the shared card rhythm gives unlike tasks similar visual weight and long definition text consumes the first scan. Design decisions should test one ranked work queue or compact count group against the user's actual immediate task; do not remove source/scope truth.

Static source review found:

- Dashboard uses ten `KpiCard` projections plus distinct panels. Every count has a real register/filter relationship; visual grouping may reduce repetition only if that relationship stays clear.
- Receiving uses one primary create action, filter controls, a dense register, and separate empty/provider-unavailable branches. The table is task-appropriate; prioritize item number, inspection result, and release state before secondary history.
- Laboratory, approvals, and documents are register pages with separate unavailable branches. Preserve the table-to-record path; avoid duplicating the same explanation in the page lede, panel heading, and each row.
- Reports uses report tiles as entry points, which differ in purpose from record tables and should not be forced into the same table template.
- System health groups application/schema/dependency and backup/recovery evidence. Distinguish current health from readiness blockers; never let a green health value imply release readiness.
- Shared `Card`, table, dialog, and panel surfaces repeat border/background/radius. Repetition supports a coherent shell, but the seven-screen static review did not find evidence that every container, shadow, or icon is meaningless. Keep elevation for overlays; decide whether a static panel needs a card from its task and grouping function.
- The Impeccable detector reported accent-border patterns on Dashboard, Receiving, and System health. This is a review cue, not proof that those colors lack state meaning. Do not remove a status color before checking its vocabulary and role meaning.
- Screen code includes concise task-oriented labels alongside some longer explanatory text. The dashboard has the clearest paragraph-density candidate; test whether definitions can be disclosed on demand while retaining scope and source labels.
- No specific phrase is labelled “AI-generated” by this review. The source-backed issues are repeated explanatory copy and the Dashboard's long first-scan paragraph; authorship or user perception cannot be inferred from static wording alone.

### Ordered gaps by user impact

1. **High — authenticated visual and interaction coverage is incomplete.** Available persisted images show the unauthenticated `/dashboard` gate at 1440×1000 and 390×844 only. They do not show the authenticated application. Existing artifacts: [desktop gate](desktop-unauthenticated-gate.png), [mobile gate](mobile-unauthenticated-gate.png). A current owner dashboard was observed live at the browser's available viewport, but no 1440/390 authenticated screenshots were saved. Do not present the gate captures as current authenticated screenshots.
2. **High — task success, elapsed time, and errors have no measured baseline.** The task protocol is repeatable, but there are no participant/task runs or raw measurements in this review.
3. **High — populated, denied, conflict, and action-success states are not evidenced across roles.** Live read-only data and source branches cannot stand in for controlled synthetic fixtures or accepted QC actions.
4. **Medium — `/admin` documentation conflict was just reconciled.** Recheck route/navigation behavior with all five personas before any implementation claims; data reads/actions remain separate.
5. **Medium — information density in Dashboard is a design candidate.** Validate collapse/disclosure against source/scope comprehension; no count or definition should be removed without evidence.
6. **Low — repeated framing, borders, and accent bars need task-by-task evidence.** Current source does not prove all cards/shadows/icons are decorative, so no blanket removal is recommended.

## Repeatable three-task baseline

This is a measurement protocol, not a measured score. Use the same approved local test build, browser, viewport, synthetic `PERF-` records, persona, task wording, and start/stop events for baseline and comparison. Record one attempt per row without placing credentials or personal data in the report. Do not use production mutations or controlled QC decisions as test steps.

| Task | Representative screen / role | Success condition | Time | Errors | Current baseline |
|---|---|---|---|---|---|
| Find a receiving item and report its current inspection result and separate release state | Receiving register / active Employee | Opens the target record and correctly identifies both source-backed facts | Seconds from task start to correct read-back | Count wrong record, filter reset, misunderstanding of PASS versus RELEASED, and unavailable/denied confusion | Success/time/errors: **NOT MEASURED**; no target record fixture used |
| Find a laboratory test and locate its approved method/criteria source | Laboratory register/detail / authorized laboratory worker persona | Opens the correct test and finds the source/version shown by the record; no scientific value is inferred | Seconds from task start to source identification | Count wrong test, source/version confusion, extra navigation, or treating unavailable as empty | Success/time/errors: **NOT MEASURED**; no synthetic populated state used |
| Find an assigned approval and identify its stage and required evidence without deciding | Approvals queue/detail / Supervisor or Manager persona as assigned by fixture | Opens the assigned item and identifies stage/evidence; does not submit a decision | Seconds from task start to correct stage/evidence read-back | Count wrong item, assignment confusion, missed evidence, permission confusion, or attempt to decide | Success/time/errors: **NOT MEASURED**; no fixture or action submitted |

For each attempt, record `task_id`, opaque synthetic record label, persona, viewport, browser, start/end timestamps, completion (yes/no), and error count/type. A zero-error result means no observed navigation, interpretation, or recovery error in that attempt; it does not prove scientific correctness, broad usability, or UAT. Compare medians and task completion across the same task set only after actual runs exist.

## Captures, tools, and verification state

- **Current live view:** an existing authenticated `yazeed` browser session showed `/dashboard`; the accessible navigation contained Administration, Audit history, System health, Control center, Backup and recovery, Controlled documents, Notifications, Search, and Account settings. Current screenshot viewport was about 868 CSS px wide; the browser tool could not persist that live view to the project. Other role accounts were not exercised.
- **Persisted screenshots:** desktop 1440×1000 and mobile 390×844 are local unauthenticated redirect-gate captures only, as linked above. Authenticated desktop/mobile current-page imagery is **NOT VERIFIED**.
- **21st tools/references:** no 21st MCP/tool was present in this session's callable tools. No 21st reference search or use is claimed; reference links are **NOT AVAILABLE**.
- **Impeccable:** read the local Impeccable context and its new-work/operate/critique/audit guidance; its `critique` command returned “Unknown command” in this installed version. The review therefore relies on its written method, the actual page code, project design/copy documents, and the live page observation. No critique-tool result is claimed.
- **Synthetic data:** no `PERF-` fixtures were created or inserted. Live reads were read-only. No production data, permissions, QC logic, or migrations were changed.
- **Verification:** performed source/route/copy inspection and generated both CSVs on Node `24.20.0`; the route-role matrix contract passed for all 87 routes and five ACTIVE personas. Focused route/navigation/copy unit tests passed 43/43 and Prettier passed. One broader UI contract test remains a confirmed pre-existing text mismatch in a Laboratory source/test pair and is documented in the delivery status.

### Remaining status

`PARTIAL`. Route visibility and copy context are documented and `/admin` wording is reconciled. Human success/time/error baselines, authenticated 1440/390 screenshots, per-role live reads, synthetic populated/error/conflict/success branches, and direct route proof for each role remain **NOT VERIFIED**. These gaps do not justify changing permissions, scientific criteria, retention periods, or QC behavior.
