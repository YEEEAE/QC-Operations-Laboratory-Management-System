# CA-P-ASSETS-CALIBRATIONS-NEW — execution status

**State: PARTIAL.** The page presentation and focused source checks are complete. Required browser evidence on an authorized account and a real populated calibration/equipment record is not available in this session. The computer-use bridge returned “Computer Use permissions are not granted”; PostgreSQL 18 at `127.0.0.1:55432` returned no response. No sample/sentinel data was substituted.

## Candidate

- HEAD: `13356d1b20a20b5f608dd4f93f3731777438210c` (local changes uncommitted).
- Page SHA-256: `d01c8b686377c4affdf40b8f3761aa14fc3623ce58e5cf2c6c5ae4b7d0515873`.
- Eligibility helper SHA-256: `8c71bbf7f190290eb80a989b154d2daef52d891fec977dfcca15d96129b65627`.
- Test SHA-256: `b5f6990555f50aebf05dbed0986fe07cecfe80c6b734bb4f3934f07e6bb08982` and `a780180559a3935a681d0580923327a254639d2243a8c8b385f0bbe87550574a`.
- Focused tests: `tests/unit/assets/equipment-eligibility.test.ts`, `tests/unit/ui/calibration-create-form-surface.test.ts`.
- Visual reference: Stitch CA-00 Variant A screen (`audit/CA-00/reference/capa-a.png`, SHA-256 `53b0136482d83ad7ac23932b7d90b3ad8a9ce4a394b84597be54883ae7e0cb91`) used only for the shared visual language. No calibration-page-specific before/after screenshot was captured.

## Before / after inventory

| Area | Before | After |
|---|---|---|
| Page heading and purpose | `PageHeader` with the calibration title, equipment relationship and due-date source note | Same content preserved in a clear header and purpose; back link still uses `safeListHref` |
| Equipment selector | Human-readable equipment options with server-assessed eligibility; eligibility was embedded in long option labels | Short equipment identity in the select; one live status region shows the selected source eligibility, equipment/calibration/maintenance states and source dates. Source status is rendered as text, not color. |
| Calibration identity | `calibrationNo`, `equipmentId`, `calibrationDate`, optional `dueDate` | Same field names, values, requiredness and source meaning; help text added |
| Optional details | `provider`, `certificateNo`, `result` | Same field names and values; explicit optional help text |
| Grouping | Fields in the existing identity fieldset with a generic two-column layout | One column by default; only Provider and Certificate number pair at `min-width:64rem`; all other fields remain full width |
| Record relationship/history | Equipment selection and register route context | Existing selector remains; selected equipment has a link to its equipment detail/history. No history data is copied or fabricated here. |
| Submit/cancel/back | Native POST to `assets.createCalibration`, progressive enhancement, unsaved-change guard, safe return link | Same action, payload, POST fallback, pending/result region, error summary, cancel and back behavior |
| Shell/navigation | `AppLayout` and shared Sidebar | Preserved as-is; no route, sidebar, API, schema, business-rule or policy changes |

## States, transitions and guards

| UI machine / state | Reachable behavior | Guard/source and outcome |
|---|---|---|
| READ — equipment choices | Read authorized equipment during server rendering | `ListEquipmentUseCase` (`PERM-EQP-VIEW`) supplies scoped equipment; `GetEquipmentEligibilityUseCase.assessMany` authorizes source reads for equipment, calibration and maintenance (`PERM-EQP-VIEW`, `PERM-CAL-VIEW`, `PERM-MNT-VIEW`). Assessment text is source-derived. |
| READ — selected equipment | Read source status; open equipment record/history | The history link points to the existing `/assets/equipment/[equipmentId]` route. Its server read guards remain authoritative. The form does not infer permission from this link. |
| FORM — unauthenticated | Redirect to login with the original return path | Existing `Astro.locals.actor` guard. |
| FORM — account has create permission | Enter calibration number, equipment, calibration date, optional source due date, provider, certificate number and result/source note | `PERM-CAL-CREATE` gates the form. Field names, values and native POST contract are unchanged. |
| FORM — account lacks create permission | Read-only “Creation is not available” message | Existing page permission check. Direct action authorization remains on `assets.createCalibration` / `CreateCalibrationUseCase` (`PERM-CAL-CREATE`). |
| FORM — eligible equipment | Eligibility is described in text; submit remains governed by server action | Eligibility is information, not client authorization. No color or displayed role grants enabled behavior. |
| FORM — ineligible / CURRENT / OVERDUE / UNDER_MAINTENANCE source states | Exact available source state and reason are stated in the live status text | `GetEquipmentEligibilityUseCase` and its authorized source readers. No new duration/threshold calculation and no state-to-color-only reduction. Server action remains authority. |
| FORM — stale selection | Existing selection is rejected from the available authorized options; user is told to choose explicitly | `resolvePreselectedId` and the page's authorized equipment option set. Posted equipment is still validated by the action. |
| FORM — equipment read denied/fails | One status region explains the unavailable list; values remain on the native form | Existing fail-closed catch; source details are not disclosed. The create action still validates independently. |
| FORM — empty equipment list | One status region says no equipment is available in authorized scope; existing equipment-create link remains | Result of the scoped list read; no equipment is fabricated. |
| FORM — pending / action result | Existing `data-result` live region reports pending and action outcome | `enhanceClassifiedForm`; native POST remains the fallback. |
| FORM — validation/action failure | Existing `FormErrorSummary` and field-level errors; entered values are retained | `toFormFailure` and server action result. No client-side success is inferred. |
| FORM — successful create | Existing redirect to the created calibration detail | Server action success and existing `detailHref`; not exercised against a real record. |
| FILTER / EXPORT | N/A | No filter or export function exists on this create page. |
| DIALOG | N/A | No dialog is defined by this page or its nested components. |
| MAKE_CURRENT / VOID | Not offered | These actions are not part of this form and remain behind existing policy/server guards. |

## Verification

| Check | Result |
|---|---|
| Focused equipment eligibility + page surface tests, Node 24.20.0 | PASS — 14/14 |
| Astro build, Node 24.20.0, final source | PASS — completed; existing dependency/chunk-size warnings remain |
| Astro check, Node 24.20.0, final source | FAIL — two existing unresolved `../ui/layouts/BaseLayout.astro` imports in `audit/CA-P-500/committed-500.astro` and `workingtree-500.astro`; 130 hints; no diagnostic reported for the changed page |
| `git diff --check` | PASS |
| `graphify update .` | BLOCKED — `graphify` command not installed/available; graph query was likewise unavailable |
| Before/after screenshots, same candidate, authorized account and same populated record | NOT RUN — no browser control permission and no local PG18 response; 404 sentinel/sample data not used |
| Runtime matrix at 320/390/768/1024/1440 px; page overflow and action clipping | NOT RUN — browser unavailable |
| Keyboard order, visible focus, accessible names, long content, zoom 200%/400% | NOT RUN — browser unavailable |
| Actual rendered contrast measurement, reduced-motion and forced-colors | NOT RUN — browser unavailable; CSS declarations alone are not acceptance evidence |
| Authorized and denied personas; populated record; read/form failures and native/enhanced submit parity | NOT RUN — no authenticated runtime/database evidence |
| READ / FORM | Source-level coverage only; runtime cases above remain NOT RUN |
| DIALOG / FILTER / EXPORT | N/A for this route, by source inspection |

## Existing functional debt outside this change

The page's equipment-list catch intentionally displays one generic read-unavailable message rather than the underlying provider error. This is existing fail-closed behavior and was left unchanged. Runtime verification of the underlying error taxonomy is not part of the available evidence.
