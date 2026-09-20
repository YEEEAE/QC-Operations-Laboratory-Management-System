# Copy Inventory — Route-Level Content Surfaces

QC-100-FINAL-023 copy inventory. One row per canonical route family, covering the five
copy surfaces: **labels/headings**, **help/hints**, **confirmations**, **notifications**,
and **error/success messages**. Route IDs and paths are the registry source of truth
(`src/shared/routing/routes.ts`, 87 routes / 26 families at this candidate).

- **Shared copy sources:** `src/shared/copy/ux-vocabulary.ts` (labels, lifecycle, boundaries,
  error classes), `src/shared/copy/help-content.ts` (help + guidance matrix),
  `src/shared/copy/format.ts` (dates/times).
- **Shared feedback components:** `src/ui/components/feedback/{ProviderUnavailableState,
  EmptyState,ErrorState,ConfirmDialog,ToastRegion}`, `src/ui/components/data/EmptyTableState.astro`,
  `src/ui/components/FormErrorSummary.astro`, `src/ui/forms/mutation-interaction.ts`.
- **Owner column** = the domain that owns the meaning; 023 owns wording only.

## A. Public / session

| Family | Routes | Copy surfaces | Owner |
| --- | --- | --- | --- |
| Root | `RT-ROOT-001` `/` | Landing lede, sign-in link, redirect label | Auth |
| Auth | `RT-AUTH-001..003` `/login`, `/auth/recovery`, `/auth/reset/[requestId]` | Field labels/hints, throttled + invalid-credential messages, safe `returnTo` recovery | Identity |
| Errors | `404`, `500` | One clear action each; no generic failure phrase | Shared UI |

## B. Work and dashboard

| Family | Routes | Copy surfaces | Owner |
| --- | --- | --- | --- |
| Dashboard | `RT-DASH-001` `/dashboard` | KPI labels, measurement contract (`numerator`/`grain`/`timezone`/`freshness`/`drilldown`), series states `AVAILABLE/EMPTY/UNAVAILABLE/NOT_SUPPLIED`, decision queue | Dashboard |
| Work | `RT-WORK-001` `/work` | Group headings (ASSIGNED/DUE_TODAY/OVERDUE/BLOCKED), per-item reason + next action + responsible role, unresolved sources | Dashboard |
| Tasks | `RT-TASK-001..003` `/tasks`, `/tasks/new`, `/tasks/[taskId]` | Column headings, state/priority labels, assignee display name, draft-create help, due-window empty copy | Tasks |

## C. Quarantine

| Family | Routes | Copy surfaces | Owner |
| --- | --- | --- | --- |
| Quarantine overview | `RT-QUAR-001` `/quarantine` | Attention board, state distribution, **PASS ≠ Released** callout, outage vs empty branches | Quarantine |
| Receiving | `RT-REC-001..003` `/quarantine/receiving*` | Register headings ("Receiving number", "Workflow state", "Inspection result", "Release state"), create-form labels/hints, transition history, HOLD/release confirmations, `PASS is recorded but not released` note | Quarantine |
| Inspections | `RT-INSP-001..004` `/quarantine/inspections*` | Register headings ("Inspection number", "Inspector", "Workflow state"), two-stage review guidance, reject/return/approve form labels, server-recheck note | Quarantine |
| Templates | `RT-QUAR-002..003` `/quarantine/admin*` | Template register + detail states, version suffix | Quarantine |

## D. Quality

| Family | Routes | Copy surfaces | Owner |
| --- | --- | --- | --- |
| Quality overview | `RT-QUAL-001` `/quality` | Domain entry labels | Quality |
| Findings | `RT-FIND-001..003` `/quality/findings*` | Register headings ("Finding number", Owner), severity labels, draft-create help, filtered-empty vs no-data | Findings |
| NCR / RCA / CAPA | `RT-NCR-001..003`, `RT-RCA-001..002`, `RT-CAPA-001..003` | State labels, create-form hints, transition history | Quality |

## E. Laboratory

| Family | Routes | Copy surfaces | Owner |
| --- | --- | --- | --- |
| Laboratory overview | `RT-LAB-001` `/laboratory` | Domain entry labels | Laboratory |
| Tests | `RT-LAB-002..007` `/laboratory/tests*` | Register headings ("Test number", "Executor"), state + official-result labels, execution/review guidance, retest unavailability, bounded-read notes | Laboratory |

## F. Controlled documents and change requests

| Family | Routes | Copy surfaces | Owner |
| --- | --- | --- | --- |
| Documents | `RT-DOC-001..007` `/documents*` | Register headings (Owner resolved to display name), version lifecycle labels, review checklist, `Approval is a separate controlled action` note, attachment metadata | Documents |
| Change requests | `RT-CHANGE-001..004` `/change-requests*` | Filter options, state labels, target-type label, captured-snapshot note, review guidance | Change Requests |

## G. Reject reports

| Family | Routes | Copy surfaces | Owner |
| --- | --- | --- | --- |
| Reject reports | `RT-REJ-001..004` `/reject-reports*` | Register headings, status labels (register now matches detail), availability state (no generic 500), issue-slip checkpoint guidance | Reject Reports |

## H. Assets

| Family | Routes | Copy surfaces | Owner |
| --- | --- | --- | --- |
| Assets overview | `RT-ASSET-001` `/assets` | Domain entry labels | Equipment |
| Equipment / calibrations / maintenance | `RT-EQUIP-001..003`, `RT-CAL-001..003`, `RT-MAINT-001..003` | Register headings ("… number"), state labels, due/overdue and interval notes, create-form hints, status history | Equipment |

## I. Admin, approvals, system

| Family | Routes | Copy surfaces | Owner |
| --- | --- | --- | --- |
| Admin | `RT-ADMIN-001..003`, `RT-USER-001..003`, `RT-ROLE-001..002` | Scope-kind labels, permission labels, create/edit field hints, destructive confirmations (role/scope removal, disable, revoke sessions, password reset) | Identity Admin |
| Approvals | `RT-APPROVAL-001..002` | Queue headings, workflow-type label, requester display name, controlled-decision form labels, reauthentication hint | Approvals |
| System | `RT-SYSTEM-001..002`, `RT-BACKUP-001..003` | Health/dependency labels, AI advisory phrasing, backup vs restore boundary, restore-request wording | System |

## J. Shared surfaces

| Family | Routes | Copy surfaces | Owner |
| --- | --- | --- | --- |
| Search | `RT-SHARED-001` `/search` | Query label, scoped-result labels, empty vs unavailable | Shared |
| Notifications | `RT-SHARED-002` `/notifications` | Read/unread labels, destination labels, outage state | Shared |
| Account | `RT-SHARED-003` `/account` | Identity labels, password field hints, result status | Identity |
| Audit | `RT-SHARED-004` `/audit` | Transition labels, event count vs unavailable, "no matching events" vs no events | Shared |
| Help | `RT-HELP-001` `/help` | Guidance matrix rendered from `HELP_GUIDANCE_MATRIX`, route-checked links, print stylesheet | 023/020 |
| Governance | `RT-REL-001` `/governance/releases/[releaseId]` | Release candidate states, unavailable/not-authorized copy | Governance |
| Reports | `RT-REPORT-001..002` `/reports*` | Report labels, export/print parity, empty vs unavailable | Reporting |
| AI advisory | `RT-AI-001` `/ai-advisory` | Advisory boundary wording, degraded/unavailable phrasing | AI Advisory |

## Copy source files (implementation owners)

| Path | Owns |
| --- | --- |
| `src/shared/copy/ux-vocabulary.ts` | State labels, lifecycle words, scope kinds, severity, target/workflow types, error classes, boundaries |
| `src/shared/copy/help-content.ts` | Help sections, guidance matrix, route/permission references |
| `src/shared/copy/format.ts` | Date/time rendering |
| `src/ui/forms/mutation-interaction.ts` | Progress and per-class failure copy for async mutations |
| `src/ui/components/FormErrorSummary.astro` | Visible, focusable error summary + anchor links to fields |

## Known copy surfaces not changed by this phase (with owner)

| Surface | Why unchanged | Owner |
| --- | --- | --- |
| Arabic / RTL wording | No approved localization scope; English/LTR is the approved baseline | 013 |
| Support ownership names (`UNRESOLVED`) | Organizational decision, not wording | 013/026 |
| Person identifiers inside detail-page metadata slots (`Created by`, `Linked by`) | The guide permits a raw identifier in a labelled metadata slot; only register rows/headings are governed | respecting domain |
