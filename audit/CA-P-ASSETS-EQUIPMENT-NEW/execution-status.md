# CA-P-ASSETS-EQUIPMENT-NEW — execution status

**State: PARTIAL.** The presentation is implemented and source-level checks pass. Authenticated browser acceptance on a permitted and a denied account, populated equipment history, same-record before/after captures, viewport/keyboard/zoom and measured-contrast evidence were not collected in this run. No synthetic equipment, calibration or maintenance record was introduced.

## Candidate

- Branch: `main`; starting worktree was clean.
- Base HEAD: `216b389622c1e4d299933de037a3c05bb1c58846` (verified before change).
- Changed page: `src/pages/assets/equipment/new.astro`.
- Focused surface test: `tests/unit/ui/equipment-create-form-surface.test.ts`.
- Final source SHA-256: `5c0fbcbe3a4541e474ccbd0dd4e2010e849c12f26bd6cd08c8b5b62580e5c574`.
- Focused test SHA-256: `34746dc78f8ff0ba2cb461ecdf63d8602ef450acef38c90b094cb0e096086713`.
- Visual reference: CA-00 Variant A (`audit/CA-00/reference/capa-a.png`, SHA-256 `53b0136482d83ad7ac23932b7d90b3ad8a9ce4a394b84597be54883ae7e0cb91`) and CA-05's measured shared form/layout rules. There is no page-specific equipment-new reference screenshot.

## Before / after inventory

| Concern | Before | After |
|---|---|---|
| Heading, purpose, return | New equipment; draft activation note; back link | Same English/LTR heading, purpose and back link, laid out as a page header |
| Source eligibility and history | Not represented | Explicitly marked not assessed/unavailable because this new equipment draft has no persisted equipment ID or linked calibration/maintenance records. Existing register/history route is linked. No new status is inferred. |
| Equipment identity | Existing eight controls in a dense inline template | Same eight controls and names/values in a one-column mobile layout and a two-column layout from 960px; persistent labels and source-oriented help added |
| Validation | Existing field errors and `FormErrorSummary` | Preserved error summary, required fields, field errors and `aria-describedby` relationships |
| Actions and result | Cancel, Create draft, one result region | Same actions and native POST/enhanced action; one result region retains pending/result feedback |
| Authorization and workflow | `PERM-EQP-CREATE` display gate, server action and use-case authorization, unsaved-change guard | Unchanged. No new role-derived business decision, action or route |
| Shell / navigation | `AppLayout`, full shared Sidebar | Unchanged; no Sidebar markup or policy changes |

## UI state / transition / guard matrix

| Surface/state | Reachability and transition | Guard / authoritative source | Evidence |
|---|---|---|---|
| AUTH — anonymous | Redirect to `/login?returnTo=%2Fassets%2Fequipment%2Fnew` | Existing `Astro.locals.actor` page guard | Source inspected; runtime NOT RUN |
| FORM — create visible | Edit equipment number, name, manufacturer, model, serial number, location and requirement checkboxes | Existing page check for `PERM-EQP-CREATE`; server action/use case remains authoritative | Focused source contract PASS; authorized account NOT RUN |
| FORM — create denied | Creation-unavailable message; no create form | Page's existing `canCreate`; action/use case `PERM-EQP-CREATE` authorization is still required on submit | Source inspected; denied account NOT RUN |
| SOURCE — eligibility | N/A: no persisted equipment record exists at form entry | Eligibility use case assesses a persisted equipment ID and linked source records | Explicit explanatory state; no fabricated eligible/current status |
| SOURCE — calibration/maintenance state and history | N/A: no records are linked to a not-yet-created equipment draft | Source records are only meaningful after equipment persistence and their own read guards | Explicit explanatory state; populated-record browser NOT RUN |
| FORM — required-field validation | Browser and server validation can retain entered values and render summary/field errors | Existing native required attributes, `toFormFailure`, server action schema | Surface contract PASS; runtime validation NOT RUN |
| FORM — submit pending / result | Enhanced submit disables the button and updates `[data-result]`; no-JS form submits by POST | Existing `enhanceClassifiedForm` and Astro action | Build/source PASS; keyboard and actual action NOT RUN |
| FORM — create success | Existing enhanced redirect or server-rendered redirect to equipment detail | `assets.createEquipment` / `CreateEquipmentUseCase`; action authorization is authoritative | NOT RUN; no write performed |
| FILTER / EXPORT | N/A | No filter/export function exists on this page | Source inspection |
| MAKE_CURRENT / VOID | N/A; not exposed here | Not a create-form action; existing transition guards remain untouched | Source inspection |

Source read authorization for equipment eligibility and linked records is enforced by `GetEquipmentEligibilityUseCase.authorizeSourceReads`: `PERM-EQP-VIEW`, `PERM-CAL-VIEW`, and `PERM-MNT-VIEW` as applicable. `CURRENT`, `OVERDUE`, and `UNDER_MAINTENANCE` were not collapsed into color; those statuses cannot be read for this uncreated draft.

## Verification

| Check | Result |
|---|---|
| Focused equipment form surface + eligibility tests, Node 24.20.0 | PASS — 14/14 |
| Astro build, Node 24.20.0 | PASS |
| Prettier check for new focused test | PASS |
| Prettier check of `.astro` page | NOT RUN — repository Prettier setup has no parser for `.astro` |
| `astro check` | FAIL — 2 unresolved `../ui/layouts/BaseLayout.astro` imports in the unrelated `audit/CA-P-500/{committed-500,workingtree-500}.astro`; no error reported for the changed page |
| `git diff --check` | PASS |
| Browser viewports 320/390/768/1024/1440, overflow/action clipping, reduced-motion/forced-colors | NOT RUN |
| Keyboard order/focus, icon names, long text, browser zoom 200%/400% | NOT RUN |
| Rendered contrast measurement | NOT RUN — palette values are not treated as measured evidence |
| Authorized/denied accounts, populated record, same-data before/after screenshots, validation/denial runtime paths | NOT RUN — no permitted authenticated runtime and populated source record was available for this execution |
| `graphify query` / `graphify update .` | BLOCKED — `graphify` executable is unavailable in the environment despite the committed graph file |

## Existing functional debt outside this presentation change

The no-JavaScript POST success branch passes the full `Astro.callAction(...)` result to `extractDetailId(data)`. The shared helper expects the record payload itself; Astro action results expose the payload under `data`. This appears to leave native POST success without the intended detail redirect and can report an unconfirmed result after a successful commit. It was not repaired because this request limits non-CAPA-* changes to presentation. Runtime reproduction is NOT RUN, so retain as source-identified debt, not a verified runtime failure.

## Scope boundary

No API, schema, business-rule, permission, policy, Sidebar, or external system change was made. `CA-F-*` NCR/CAPA/Retest workflows are not in this page scope. `PASS` here does not mean UAT, release, or production approval.
