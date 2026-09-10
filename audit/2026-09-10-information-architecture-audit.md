# QC Information Architecture Audit

**Date:** 2026-09-10  
**Scope:** route registry, universal shell, sidebar, topbar, breadcrumbs, deep links, cross-domain destinations, notifications, audit, search, and owner/admin boundaries.  
**Authority:** `DOMAIN-MAP.md`, `AUTHORIZATION-VISIBILITY-DECISION.md`, `ROLE-MATRIX.md`, `PERMISSION-MATRIX.md`, `STATE-MACHINES.md`, `BUSINESS-RULES.md`.

## Executive verdict

**Status: PARTIAL — IA is structurally usable, but not closure-ready.**

The product now has one universal `AppLayout`, a server-derived sidebar, global search, notifications, approvals, account access, and safe anonymous redirects. The central security rule is preserved: ordinary operational pages remain discoverable/readable for every authenticated `ACTIVE` member; action controls remain permission/state/scope/SoD/version aware.

### Confirmed strengths

- One shell answers the global “where am I?” questions through sidebar, topbar, scope indicator, skip link, and breadcrumbs.
- Search and notification destinations are server-authorized and do not intentionally disclose unauthorized records.
- Detail pages commonly expose a next workspace or return link; creation forms preserve a list return path and redirect to the created detail record.
- `PASS` remains separate from release state; laboratory context is frozen/read-only where required; Admin is not treated as a universal business approver.
- `/system/health` and `/admin/*` remain owner/admin bounded instead of being opened by ordinary operational visibility.

### Findings requiring follow-up

| ID | Finding | Severity | Effect | Recommendation |
|---|---|---:|---|---|
| IA-01 | Several landing routes (`/quality`, `/laboratory`, `/assets`) are not sidebar destinations; their discoverability depends on cross-links or direct URLs. | Medium | A user can understand a child area but may not find the canonical domain landing page. | Keep child destinations in the sidebar, but make domain landing pages explicit in breadcrumbs and detail return paths. |
| IA-02 | Some detail/review/execute screens use generic breadcrumbs unless the page supplies record context in its body. | Medium | “What record/state am I viewing?” is not consistently answered in the top context bar. | Keep IDs out of generic routing metadata; expose the authorized business number and state in the page heading/status block. |
| IA-03 | Counts in the topbar are optional and correctly absent when unavailable, but the shell does not yet prove live authorized counts. | Medium | Users cannot always tell whether there is attention pending. | Wire only server-derived counts, and show an unavailable state rather than zero. |
| IA-04 | `Pagination`, `SortHeader`, loading, and stale primitives are not consistently consumed by operational registers. | High | Large registers may become dead-end lists and make attention/work prioritization difficult. | Add deterministic server sort, pagination, loading, empty, filtered-empty, unavailable, and stale states per register. |
| IA-05 | Route manifest previously pointed `/admin/permissions` and `/admin/scopes` at non-existent files. | High | Documentation/tooling could report false route integrity and mislead admin deep links. | Corrected the manifest to the implemented `index.astro` files; keep the route-integrity test. |
| IA-06 | Browser-back/deep-link behavior is mostly conventional but not uniformly expressed as a preserved list return context. | Medium | Users may return to an unfiltered list after create/detail/review. | Preserve `returnTo` only through `safeListHref`; use explicit “Back to …” links as the deterministic operational destination. |

## Canonical route → domain → task → authority matrix

**Read visibility convention:** `ACTIVE authenticated member` means universal operational read visibility under AVD-001/004; it does not grant mutation. `Owner` means `SYSTEM_OWNER`/`yazeed` only. `Admin workspace` means explicit Admin or the owner according to AVD-002. `Anonymous/inactive` is denied or safely redirected.

| Route | Domain | Record type | Primary task | Secondary task | Read visibility | Mutation permission | State restrictions | Scope restrictions | Next operational destination |
|---|---|---|---|---|---|---|---|---|---|
| `/dashboard` | Dashboard | operational snapshot | orient and find attention | open source register | ACTIVE member | none in dashboard; source action only | dashboard never owns business state | authorized read model only | selected source register/detail |
| `/tasks` | Tasks | task | find assigned/operational work | filter by state/search | ACTIVE member | `PERM-TASK-CREATE` / task action permissions | transition must be canonical | task scope | `/tasks/[taskId]` |
| `/tasks/new` | Tasks | task draft | create draft | recover validation | ACTIVE member | `PERM-TASK-CREATE` | starts `DRAFT`; server creates ID | task create scope | new task detail |
| `/tasks/[taskId]` | Tasks | task | inspect state/assignment | complete/block/comment if allowed | ACTIVE member | `PERM-TASK-EDIT`, `ASSIGN`, `COMPLETE`, etc. | action must match current state/version | entity scope | next allowed task transition or `/tasks` |
| `/quality` | Quality | domain index | orient quality work | choose register | ACTIVE member | none on landing | no domain transition | operational read | Findings/NCR/RCA/CAPA |
| `/quality/findings` | Quality | finding | review findings | filter/open detail | ACTIVE member | `PERM-FIND-CREATE` for create; finding actions for transitions | DRAFT/OPEN/UNDER_REVIEW/CLOSED/VOID per machine | finding scope | finding detail or linked NCR/CAPA |
| `/quality/findings/new` | Quality | finding draft | create finding | correct validation | ACTIVE member | `PERM-FIND-CREATE` | creates controlled draft only | finding scope | finding detail |
| `/quality/findings/[findingId]` | Quality | finding | inspect evidence/state | submit/review/void where allowed | ACTIVE member | `PERM-FIND-EDIT/SUBMIT/REVIEW/CLOSE/VOID` | state + version + SoD | finding scope | NCR/RCA/CAPA or findings list |
| `/quality/ncr` | Quality | NCR | inspect non-conformance register | follow finding linkage | ACTIVE member | `PERM-NCR-*` | policy-controlled transitions | NCR scope | NCR detail / linked finding |
| `/quality/ncr/[ncrId]` | Quality | NCR | inspect NCR context | follow linked corrective work | ACTIVE member | `PERM-NCR-EDIT/SUBMIT/REVIEW/APPROVE/CLOSE/VOID` | canonical NCR state machine | NCR scope | RCA/CAPA or NCR list |
| `/quality/rca` | Quality | RCA | inspect root-cause work | follow NCR | ACTIVE member | `PERM-RCA-*` where defined | draft/submitted/review/approved rules | RCA/NCR scope | RCA detail / NCR |
| `/quality/rca/[rcaId]` | Quality | RCA | inspect analysis | continue approved workflow | ACTIVE member | `PERM-RCA-EDIT/SUBMIT/REVIEW/APPROVE` | current state/version | RCA scope | CAPA/NCR or RCA list |
| `/quality/capa` | Quality | CAPA | inspect corrective action register | track action/effectiveness | ACTIVE member | `PERM-CAPA-*` | closure requires defined conditions; no silent close | CAPA/NCR scope | CAPA detail |
| `/quality/capa/[capaId]` | Quality | CAPA | inspect actions/effectiveness | close/void if authorized | ACTIVE member | `PERM-CAPA-CLOSE` plus approved ceremony; other CAPA permissions | `ACTIONS_COMPLETE` + effectiveness + signature where required | CAPA scope | actions/effectiveness or CAPA list |
| `/quarantine` | Quarantine | quarantine overview | see receiving/inspection/release posture | open source register | ACTIVE member | none on overview | receiving, inspection, release remain separate | operational read | receiving/inspections |
| `/quarantine/receiving` | Quarantine | receiving item | inspect received items | create/open detail | ACTIVE member | `PERM-QUAR-CREATE/EDIT/HOLD/RELEASE` as applicable | receiving state machine; PASS does not auto-release | receiving scope | receiving detail / inspections |
| `/quarantine/receiving/new` | Quarantine | receiving draft | register received item | link inspection context | ACTIVE member | `PERM-QUAR-CREATE` | starts controlled draft/receiving state | receiving scope | receiving detail |
| `/quarantine/receiving/[receivingId]` | Quarantine | receiving item | inspect quarantine state | start inspection/release when allowed | ACTIVE member | `PERM-QUAR-START-INSPECTION/HOLD/RELEASE` | release requires correct receiving + approved inspection state | item scope | inspection or release action/list |
| `/quarantine/inspections` | Quarantine | inspection report | find inspection work | filter/state review | ACTIVE member | `PERM-INSP-CREATE` and action permissions | draft/submitted/review/approved/void | inspection scope | inspection detail |
| `/quarantine/inspections/[inspectionId]` | Quarantine | inspection report | inspect result/state | open execution/review | ACTIVE member | `PERM-INSP-EDIT-DRAFT/SUBMIT/REVIEW/APPROVE/VOID` | state + version + evidence + SoD | inspection scope | execute/review/receiving |
| `/quarantine/inspections/[inspectionId]/execute` | Quarantine | inspection execution | enter controlled observations | upload evidence/submit | ACTIVE member | `PERM-INSP-ENTER-RESULT/EDIT-DRAFT/SUBMIT` | editable only in allowed draft/returned state | inspection scope | review workspace |
| `/quarantine/inspections/[inspectionId]/review` | Quarantine | inspection decision | review submitted report | return/approve/reject if authorized | ACTIVE member | `PERM-INSP-REVIEW/RETURN/APPROVE/REJECT` | submitted/review state; signature/SoD as required | inspection scope | receiving/release or inspection detail |
| `/quarantine/admin` | Quarantine | template register | view/manage controlled templates | create/revise lifecycle | ACTIVE member read; mutation explicit | `PERM-ADM-TEMPLATES`, signature for controlled transitions | DRAFT/IN_REVIEW/APPROVED/STOPPED/VOID/SUPERSEDED | template scope + ceremony | template detail |
| `/quarantine/admin/[templateId]` | Quarantine | controlled template | inspect lifecycle and available actions | revise/return to template register | ACTIVE member read; mutation explicit | `PERM-ADM-TEMPLATES` plus action-specific authority | state/version/re-authentication/SoD; approved content is revised, not overwritten | template scope | template register or new revision |
| `/laboratory` | Laboratory | domain index | orient laboratory work | open tests | ACTIVE member | none on landing | no laboratory transition | operational read | `/laboratory/tests` |
| `/laboratory/tests` | Laboratory | lab test | review tests/results | filter/open detail | ACTIVE member | `PERM-LAB-CREATE` and lab action permissions | scientific result separate from workflow state | lab scope | lab detail |
| `/laboratory/tests/new` | Laboratory | lab test draft | create test from approved template | preserve controlled context | ACTIVE member | `PERM-LAB-CREATE` | starts draft; approved template required | lab scope | lab detail/execution |
| `/laboratory/tests/[labTestId]` | Laboratory | lab test | inspect result/context/state | open execution/review | ACTIVE member | `PERM-LAB-EDIT-DRAFT/SUBMIT/REVIEW/APPROVE/VOID` | state/version; PASS ≠ RELEASED | lab scope | execute/review/linked quarantine |
| `/laboratory/tests/[labTestId]/execute` | Laboratory | raw observations | enter measurements | submit for review | ACTIVE member | `PERM-LAB-EDIT-DRAFT/ENTER-MEASUREMENT/SUBMIT` | draft/returned only; controlled method validates values | lab + equipment scope | review |
| `/laboratory/tests/[labTestId]/review` | Laboratory | submitted lab test | inspect submission | approve/return if authorized | ACTIVE member | `PERM-LAB-REVIEW/APPROVE/RETURN` | submitted/review state + SoD/signature | lab scope | detail/approval/release context |
| `/laboratory/tests/[labTestId]/retests/new` | Laboratory | retest request | view/request retest path | preserve original result | ACTIVE member | `PERM-LAB-RETEST` + authorization permission when policy active | blocked until approved policy defines sequence/count/handling | lab scope | original test detail |
| `/assets` | Assets | asset overview | orient asset work | open register | ACTIVE member | none on landing | no asset state transition | operational read | equipment/calibration/maintenance |
| `/assets/equipment` | Assets | equipment | inspect equipment register | create/open detail | ACTIVE member | `PERM-EQP-CREATE/EDIT/CHANGE-STATUS` | DRAFT/ACTIVE/OUT_OF_SERVICE/DECOMMISSIONED rules | equipment scope | equipment detail/calibration/maintenance |
| `/assets/equipment/new` | Assets | equipment draft | create equipment | link source evidence | ACTIVE member | `PERM-EQP-CREATE` | server creates draft | equipment scope | equipment detail |
| `/assets/equipment/[equipmentId]` | Assets | equipment | inspect identity/status | open calibration/maintenance | ACTIVE member | `PERM-EQP-EDIT/CHANGE-STATUS/DECOMMISSION` | state machine; no ordinary delete | equipment scope | calibration/maintenance/list |
| `/assets/calibrations` | Assets | calibration | find certificates/due work | filter/open detail | ACTIVE member | `PERM-CAL-CREATE/EDIT-DRAFT/SUBMIT/REVIEW/APPROVE` | draft/submitted/approved/void | equipment/calibration scope | calibration detail/equipment |
| `/assets/calibrations/new` | Assets | calibration draft | record source-provided calibration | link equipment | ACTIVE member | `PERM-CAL-CREATE` | controlled source required; no invented due date | equipment scope | calibration detail |
| `/assets/calibrations/[calibrationId]` | Assets | calibration | inspect certificate/result | follow equipment status | ACTIVE member | `PERM-CAL-EDIT-DRAFT/APPROVE/VOID` | version/state rules | calibration scope | equipment/maintenance/list |
| `/assets/maintenance` | Assets | maintenance | find maintenance work | filter/open detail | ACTIVE member | `PERM-MNT-CREATE/EDIT/COMPLETE` | maintenance state machine | equipment scope | maintenance detail/equipment |
| `/assets/maintenance/new` | Assets | maintenance draft | create work record | link equipment | ACTIVE member | `PERM-MNT-CREATE` | starts draft | equipment scope | maintenance detail |
| `/assets/maintenance/[maintenanceId]` | Assets | maintenance | inspect work/status | complete/upload evidence if allowed | ACTIVE member | `PERM-MNT-EDIT/COMPLETE/UPLOAD-EVIDENCE` | current state + evidence | equipment scope | equipment/calibration/list |
| `/documents` | Documents | controlled document | find approved/current documents | open version history | ACTIVE member | document action permissions | versions are controlled, not ordinary edits | document scope | document detail/version |
| `/documents/new` | Documents | document draft | create controlled document | attach evidence | ACTIVE member | `PERM-DOC-CREATE` | starts draft | document scope | document detail |
| `/documents/[documentId]` | Documents | document | inspect current controlled record | open versions/change request | ACTIVE member | `PERM-DOC-EDIT-DRAFT/REVISE/SUPERSEDE/ARCHIVE/VOID` | approved/signed/closed versions immutable by ordinary edit | document scope | current version/history/change request |
| `/documents/[documentId]/versions/new` | Documents | document version draft | create revision | provide change summary/hash | ACTIVE member | `PERM-DOC-CREATE/REVISE` | new draft leaves history intact | document scope | version detail |
| `/documents/[documentId]/versions/[versionId]` | Documents | controlled version | inspect version/context | review/download where allowed | ACTIVE member | `PERM-DOC-DOWNLOAD` and lifecycle permissions | DRAFT/REVIEW/APPROVED/VOID/SUPERSEDED | document scope | review/change request/history |
| `/documents/[documentId]/versions/[versionId]/review` | Documents | version review | review controlled content | return/approve/reject | ACTIVE member | `PERM-DOC-REVIEW/RETURN/APPROVE/REJECT` | review state + SoD/signature | document scope | approval/detail |
| `/documents/[documentId]/versions/[versionId]/edit` | Documents | draft version | edit an authorized draft | return to version detail | ACTIVE member | `PERM-DOC-EDIT-DRAFT` | DRAFT only; approved/history immutable; version revalidated | document scope | version detail |
| `/approvals` | Approvals | approval work item | find assigned decisions | filter/open evidence | ACTIVE member read; assigned action permission | `PERM-APR-REVIEW/RETURN/APPROVE/REJECT` | pending/current version/SoD/signature | assigned scope | approval detail/source record |
| `/approvals/[approvalId]` | Approvals | approval case/work item | inspect decision context | execute approved ceremony | ACTIVE member read | explicit approval + `PERM-ESIG-SIGN` where required | pending only; replay/stale denied | assigned/entity scope | source detail or next domain transition |
| `/change-requests` | Change Management | change request | find requested changes | filter/status/open detail | ACTIVE member | `PERM-CHG-CREATE/EDIT-DRAFT/REVIEW/APPROVE/APPLY` | draft/submitted/review/approved/applied/cancelled | change/document scope | change detail/source document |
| `/change-requests/new` | Change Management | change request draft | request controlled change | select authorized document version | ACTIVE member | `PERM-CHG-CREATE` | server derives target/version/snapshot | document/change scope | change detail |
| `/change-requests/[changeRequestId]` | Change Management | change request | inspect proposed change | review/apply/cancel | ACTIVE member | `PERM-CHG-EDIT/REVIEW/APPROVE/APPLY/CANCEL` | current version + policy/state | document/change scope | review/approval/source |
| `/change-requests/[changeRequestId]/review` | Change Management | change decision | review request | return/approve/reject | ACTIVE member | `PERM-CHG-REVIEW/RETURN/APPROVE/REJECT` | review state + SoD/version | assigned scope | change detail/document |
| `/governance/releases/[releaseId]` | Governance / Release | release candidate | inspect exact release evidence and approval gates | approve only when authorized | ACTIVE member read; release action explicit | release authority + reauthentication + signature; Admin alone denied | `PENDING` candidate, exact version/gates/evidence, SoD | release scope | release evidence or deployment operator destination |
| `/reports` | Reporting | report definition | choose authorized report | inspect availability | ACTIVE member | `PERM-RPT-RUN/EXPORT-*` for actions | reports never mutate source state | report scope | report detail/source register |
| `/reports/[reportCode]` | Reporting | report result | run/inspect report | export if allowed | ACTIVE member | `PERM-RPT-RUN`, export permission | current server filters/data only | report scope | source register/detail |
| `/ai-advisory` | AI Advisory | advisory response | request advisory guidance | inspect refusal/unavailable reason | ACTIVE member | no business mutation; advisory use only | provider/outage/refusal states; no official PASS/FAIL | input and data scope | source record/manual review |
| `/search` | Shared Search | authorized search result | locate a record | refine query | ACTIVE member | no mutation; destination action re-authorizes | provider unavailable distinct from empty | authorized scope; no existence leakage | authorized detail |
| `/notifications` | Shared Notifications | own notification | see attention item | open linked record/mark read | ACTIVE member; own notifications only | mark-own-read permission/contract | unread/read; provider unavailable distinct from empty | actor-owned inbox | linked operational destination |
| `/audit` | Audit | audit event | trace controlled action | filter/request reference | ACTIVE member for operational audit; security/admin fields restricted | no ordinary mutation | append-only history | authorized event scope | source record/related evidence |
| `/system/backups` | Backup/Recovery | backup catalog | inspect backup posture | open evidence | ACTIVE member catalog/read posture | `PERM-BKP-RESTORE` for restore ceremony | backup success ≠ restore verified; restore states separate | recovery scope | backup detail/restore |
| `/system/backups/[backupId]` | Backup/Recovery | backup record | inspect artifact/evidence | begin restore if allowed | ACTIVE member | restore permission + ceremony | artifact verified/restore states | recovery scope | restore workspace |
| `/system/backups/[backupId]/restore` | Backup/Recovery | restore operation | execute controlled restore | record evidence | ACTIVE member read; explicit restore authority | `PERM-BKP-RESTORE` | target isolation, evidence, idempotency, approval rules | recovery scope | backup detail/health evidence |
| `/account` | Identity | own account/session view | manage own account | change password/revoke own sessions | ACTIVE authenticated member | `PERM-IDN-VIEW-SELF`, own-password/session permissions | active session/re-authentication | self only | dashboard or login after logout |
| `/admin` | Administration | admin workspace | enter admin registers | choose users/roles/permissions/scopes | Admin or SYSTEM_OWNER only | explicit admin permissions | active account + admin guard | admin scope | admin register |
| `/admin/users` / `new` / `[userId]` | Administration | member account | manage users | view safe identity state | Admin or SYSTEM_OWNER only | `PERM-ADM-USERS` / identity management permissions | active/disabled; self-disable and stale denied | admin scope | user detail/roles/scopes |
| `/admin/roles` / `[roleId]` | Administration | role/grants | inspect/configure role | review permission set | Admin or SYSTEM_OWNER only | `PERM-ADM-ROLES`, role view/assign | versioned/audited; no business approval implied | admin scope | permissions/scopes |
| `/admin/permissions` | Administration | permission registry | inspect canonical permissions | review grants | Admin or SYSTEM_OWNER only | `PERM-ADM-PERMISSIONS` / view/assign | canonical registry/version rules | admin scope | role/user detail |
| `/admin/scopes` | Administration | scope assignment | inspect/assign scopes | browse users | Admin or SYSTEM_OWNER only | `PERM-ADM-SCOPES` / scope assign | versioned/audited | admin scope | user/role detail |
| `/system/health` | System Health | runtime/readiness posture | inspect technical health | inspect release identity | SYSTEM_OWNER only | no ordinary business mutation | health/readiness states; raw diagnostics restricted | owner scope | operator remediation, not operational record |

## Navigation and wayfinding audit

| Surface | Result | IA decision |
|---|---|---|
| Sidebar | PASS with caveat | Group labels are understandable and ordinary links are not hidden by mutation permissions. Owner/admin groups remain capability-bound. Active state now includes `aria-current="page"` plus non-color styling. |
| Topbar | PASS with evidence gap | Search, notifications, approvals, user menu, scope, and mobile navigation are global. Counts are absent when not server-confirmed; live count wiring still needs runtime evidence. |
| Breadcrumbs | IMPROVED / PARTIAL | Domain and workflow suffixes now identify `New record`, `Review`, `Execution`, or `Record detail`; record business number/state must remain in each authorized page heading/status block. |
| Deep links | PASS fail-closed | Protected direct URLs redirect anonymous users and domain/application layers re-authorize the current actor. Admin/health boundaries remain separate. |
| Search | PARTIAL | It distinguishes unavailable from empty and suppresses unauthorized existence, but register-level sort/pagination and complete destination coverage need a later data-surface pass. |
| Cross-domain links | PARTIAL | Notifications cover common entity types; detail pages expose next workspaces where implemented. Every new entity link must be owned by its source domain and re-authorize on open. |
| Browser back | PARTIAL | Native back remains safe; explicit back links are more deterministic. Preserve safe list filters through `returnTo` where a create/detail/review workflow uses it. |
| Create → detail | PASS in source | Forms retain values/errors and redirect to a server-created detail ID; no business payload is put into URLs. |
| Approval navigation | PASS in source / runtime partial | Approval queue/detail exists and keeps ceremony separate from domain transition; authenticated role/state/SoD runtime evidence is still required. |
| Notifications | PASS in source / provider partial | Own inbox and linked destinations are clear; unavailable provider must never become “all caught up.” |
| Audit history | PASS boundary / partial usability | Audit is separate and append-only; filters and source-record links should be standardized across all audit views. |
| Admin boundaries | PASS in source | Admin pages are explicit and separate; Admin does not become a universal approver and health remains owner-only. |

## User question coverage

| Question | Current answer | Gap |
|---|---|---|
| Where am I? | Sidebar active state + breadcrumbs + page H1 | Dynamic record identity is page-specific, not generic shell metadata. |
| What domain am I working in? | Navigation group, domain breadcrumb, page title | Legacy short labels such as “NCR” and “RCA” need product glossary/tooltips if users are not QC specialists. |
| What record am I viewing? | Authorized business number/H1 on detail pages; search result links | A few placeholder detail pages only expose generic copy; complete record read models remain a product gap. |
| What state is it in? | State text/status blocks where the read model provides it | Registers need consistent status badges and filters; state must never be inferred from color alone. |
| What needs attention? | Dashboard, approvals, notifications, task filters | Counts/provider availability are not fully live-evidenced. |
| What can I do next? | Capability-aware action area or explicit read-only reason on many workspaces | Standardize a single “Next workspace” pattern across all detail pages. |
| Why can/cannot I act? | Pages commonly distinguish missing permission from wrong state | Use safe reason codes/copy consistently; never disclose restricted record existence. |
| Where should I go afterward? | Explicit back links, source links, notification destinations, create redirect | Preserve list query context uniformly. |

## Implemented IA changes in this audit

- Corrected canonical route file metadata for `/admin/permissions` and `/admin/scopes` to match their implemented `index.astro` pages.
- Added semantic workflow breadcrumb suffixes for new/detail/review/execute routes and domain context for landing/detail paths.
- Added a governance breadcrumb for the implemented release-approval deep link so release evidence is not a dead-end route; no Sidebar destination was added because the route is a controlled internal approval workspace.
- Added `aria-current="page"` to the server-derived active sidebar link without changing its visibility policy or permission model.

## Verification and limitations

- `pnpm exec vitest run tests/unit/ui/navigation-permissions.test.ts tests/unit/ui/universal-shell.test.ts tests/unit/ui/app-shell.test.ts` — 18/18 passed.
- Existing route-integrity tests confirm sidebar destinations resolve to implemented page files; the corrected admin manifest paths now match runtime files.
- `git diff --check` — run after the final edits.
- Static/source audit completed against the six named authority documents and current route/page reality.
- Public authentication endpoints (`/login`, recovery/reset) are intentionally excluded from the operational matrix; they are documented as public route entries in the route manifest.
- Authenticated browser matrix for every role/scope, provider-unavailable states, stale/concurrency, full back-stack preservation, and assistive-technology navigation remains **NOT VERIFIED** in this audit. No readiness or 100% claim is made.
