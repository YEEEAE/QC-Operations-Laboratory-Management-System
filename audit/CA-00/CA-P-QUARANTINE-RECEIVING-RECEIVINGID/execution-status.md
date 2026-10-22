# CA-P-QUARANTINE-RECEIVING-RECEIVINGID

State: **PARTIAL** — CAPA A presentation was applied to the receiving detail; runtime and acceptance evidence are incomplete.

## Scope and changes

- Route: `src/pages/quarantine/receiving/[receivingId].astro`.
- Kept the CAPA A shell and Sidebar unchanged. Chose the approved single-column reading direction (B): existing sections now flow vertically, with the current action area after inspection and before history.
- Split the existing `Evidence links` count and conditional `Imported from` value into a read-only **Evidence and source** section. No evidence/source values were invented.
- Preserved the receiving identity/version, all separate controlled states, Journey Context, receiving facts, inspection links and results, approved-template create form, current action controls/forms, correction component, history entries and context facts.
- CSS is page-scoped. No component, action, API, schema, business rule, policy, Sidebar, or application client script was changed.
- Inspection Result remains independent from Release System State. Inspection approval is not a release or HOLD-removal action.
- This receiving read model does not expose inspection template snapshot, notes or equipment fields. The existing inspection detail owns that information; this page retains its linked Inspection report navigation rather than inventing or copying those data.

## Before / after inventory

| Element | Before | After | Content / behavior check |
| --- | --- | --- | --- |
| Identity and version | Record heading and version | Same heading/version in the record header | Preserved |
| Controlled states | Receiving, Inspection Result, Release System State | Same three separate values | Preserved; no PASS-to-release inference |
| Journey context | Read-only state/prerequisites/evidence/audit/related workspace | Same component and props | Preserved |
| Receiving facts | Supplier, document, purchase order, quantity/unit, dates, evidence count, import source | Facts retained; evidence count/source moved together to dedicated section | Preserved; no field dropped |
| Evidence/source | Mixed into receiving facts | Dedicated read-only section | Existing values only |
| Inspection/relationships | Register link and linked inspection no/state/result | Same links and values | Preserved |
| Create inspection | Permission/state/in-flight/mapping-gated form | Same form and controls | Preserved |
| Current actions | Start/release buttons, HOLD and void forms, separate correction UI | Same controls; action group stacks in document order | No server or client action edits |
| History | Controlled event/action/time/reason list | Same records after current actions | Preserved |
| Context | Created by, last updated, version | Same values after correction area | Preserved |

Source comparison: `source-comparison.json`. Frontmatter and page client scripts compare identical to HEAD; form count (4), intent names, hidden input names, action names, label targets and state-boundary copy match. This is a source-level comparison, **not** a matched visual/runtime comparison.

## UI-state / action / guard matrix

| UI state / control | Reachable presentation condition | Authoritative guard / transition source | Runtime before/after |
| --- | --- | --- | --- |
| READ | Actor required; item missing/denied redirects to `/404`; provider read failure returns 503 | `GetReceivingUseCase` enforces `PERM-QUAR-VIEW`, owner scope and record version; `read-failure.ts` separates unavailable from missing/denied | BLOCKED — current populated record and denied-account comparison unavailable |
| FORM — create inspection | `PERM-INSP-CREATE`; receiving state READY_FOR_INSPECTION or UNDER_INSPECTION; no in-flight report; approved mapped template(s) available | `CreateInspectionFromReceivingUseCase`: `PERM-INSP-CREATE`, state, in-flight duplicate, explicit mapped selection, server-read APPROVED template; creates frozen source context/snapshot | NOT RUN |
| FORM — start inspection | State READY_FOR_INSPECTION | `TransitionReceivingUseCase`: `PERM-QUAR-START-INSPECTION`, scope, expected version and domain transition to UNDER_INSPECTION | NOT RUN; JS action, no mutation confirmation dialog |
| FORM — HOLD | `PERM-QUAR-HOLD` and UI state not RELEASED/EXPIRED/CANCELLED; reason required | `HoldReceivingUseCase` delegates to transition; permission/scope/version/reason and state transition enforced server-side | NOT RUN |
| FORM — void | `PERM-QUAR-EDIT`, state PENDING; reason required in existing UI | CANCEL requires reason in domain; page currently omits the reason when dispatching the transition. Existing functional debt, deliberately not repaired by a presentation task | NOT RUN; UI/action mismatch remains |
| FORM — correct receiving | `PERM-QUAR-EDIT` and `isReceivingCorrectable` state; shared correction form preserves expectedVersion and required reason | `CorrectReceivingUseCase`: correctable state, input validation, `PERM-QUAR-EDIT`, owner scope, expected version and reason; repository rechecks under lock | NOT RUN |
| FORM — release | UI shows only with release permission and RELEASE_PENDING | `ReleaseReceivingUseCase`: P-05 authority, `PERM-QUAR-RELEASE`, scope, SoD, expected version, RELEASE_PENDING, Inspection Result PASS, not already released and release policy | NOT RUN; JS action, no mutation confirmation dialog |
| FILTER | Existing search field filters mapped Inspection Report `<option>` elements; AppLayout also filters navigation links | Page filter is client-side display only; approved item mappings/template eligibility remain server-derived. Shell navigation behavior is unchanged | NOT RUN |
| DIALOG — workspace command palette | Reachable from the AppLayout search/navigation control or Cmd/Ctrl+K; search results, close control and Escape | `CommandPalette.astro`, `AppLayout.astro` and shared `dialog.ts`; this is navigation only, not a mutation confirmation dialog | NOT RUN; shell unchanged |
| EXPORT | N/A — no export action or export data surface exists on this page | No export source/guard to exercise | N/A |
| AUTH | Page read and visible action controls | Page visibility is not mutation authority. Each use case reauthorizes permissions/scope/state/version and any P-05/SoD gates | NOT RUN with authorized and rejected live accounts |

Canonical concerns remain as found: server POST errors use `FormErrorSummary`/field feedback; JS actions use the existing `role=status` result region and local `aria-busy`. No status/error/pending region or machine was added. UI states describe the existing flow and do not replace business transitions.

## Verification

- **PASS** — `pnpm exec vitest run` on Node 24.20.0, focused UX copy, receiving release/data, correction, Journey Context, and action vocabulary tests: **76 passed**.
- **FAIL (existing unrelated contract assertion)** — same focused command has 1 failure in `mutation-safety-contract.test.ts` asserting a shared `form.getAttribute('aria-busy')` duplicate guard that is absent from the unchanged `src/ui/forms/mutation-interaction.ts`. Neither the test nor shared mutation implementation is changed in this task.
- **FAIL (pre-existing errors outside changed page)** — `pnpm run typecheck`: 2 missing-module errors in `audit/CA-P-500/{committed-500,workingtree-500}.astro`; 0 warnings, 128 hints. The changed receiving route reports no new type error (existing unused import hint remains).
- **PASS (Astro compilation only)** — `astro build` completed server and client compilation; package `pnpm run build` ended **FAIL** because `write-build-evidence.mjs` rejected the existing verification context as belonging to another candidate. It was not overwritten. Build alone is not release evidence.
- **FAIL (existing architecture violation)** — `pnpm run test:architecture` reports `src/actions/ncr.ts:3 delivery-domain-import`; unrelated to this page and left untouched.
- **PASS** — `git diff --check`.
- **PARTIAL** — 775 local skill-library paths across mirrored stores were discovered; the applicable skills were loaded, but all discovered skill files were not exhaustively read.
- **NOT RUN/BLOCKED** — current populated-record browser checks, matched before/after screenshots, five viewport widths, keyboard/focus, contrast, zoom 200%/400%, reduced-motion, forced-colors, axe/AT, authorized and denied accounts, native POST/no-JS action ceremonies, and dynamic action outcomes. The local PG18 cluster was stopped, and prior discovery found no populated receiving detail. No record or account fixture was fabricated; no production database was accessed.

## Existing functional debt retained (outside presentation scope)

- `void` page POST does not forward its visible reason to `transitionReceiving`; domain validation requires it.
- The HOLD form's visibility condition also includes the existing HOLD state, but the receiving domain has no transition out of HOLD; its presented repeat-HOLD action cannot pass the domain transition.
- Multiple native POST branches treat a resolved Astro Action response as success without checking its `.error`; dynamic failure/denied messages can therefore be misreported as a redirect.
- Start/release remain JS-only action controls, and the page has no route-owned confirmation dialog.
- The page-level obsolete correction surface remains hidden by the shared correction component's existing selector; the canonical shared correction form remains the rendered form and retains expectedVersion.

These observations were found in existing source and not proven through a populated-record runtime. They are recorded, not repaired here. This task does not add CAPA/NCR/Retest functions or change CA-F-* authority.
