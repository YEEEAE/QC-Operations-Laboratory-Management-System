# CA-P-ADMIN-PERMISSIONS — execution status

Date: 2026-10-22  
Work state: **PARTIAL** — presentation and source-level checks completed; requested browser acceptance remains unverified.

## Before / after inventory

| Existing element / behavior | Before | After | Preserved / evidence |
|---|---|---|---|
| Page heading and description | `Permissions`; read-only catalog copy | Same content, normalized PageHeader structure | Source unchanged in meaning |
| Return navigation | Back to administration | Same link | `/admin` retained |
| Server read and access behavior | Active actor required; `listPermissions.execute({ actor })`; authorization category rendered as unavailable | Unchanged | No write/API/schema/guard change |
| Permission identity | Description (fallback domain/action) and code | Same, code wraps without truncation | `permission.code` |
| Domain and action | Visible | Visible | Same source fields |
| Risk classification | Present in read projection but not rendered | Added as Risk level table column | `permission.riskLevel`; no new decision derived |
| Filtering | None | Client-side text filter over code/domain/action/description; active chip and clear actions | Only filters already-loaded rows; no API mutation |
| Count and paging | No count/pagination | Matching-row count; client-side pages of 25 when needed | No server paging claim; count is catalog projection |
| Export | No action | N/A — no source export/download function or action found | No export affordance added |
| User/role mutation | Not on this page | Still not on this page | Role grants remain managed through role workflows |
| Secrets / hashes / raw sessions | Not in permission projection | Not rendered | Projection remains permission records only |

## State, transition, and guard matrix

| Concern/state | Transition / action | Guard or source | Result / verification |
|---|---|---|---|
| READ: unauthenticated | Request `/admin/permissions` | Page checks `Astro.locals.actor` | Redirect to login with return path; source inspection only |
| READ: authenticated active account | `listPermissions.execute({actor})` | `ListPermissionsUseCase` rejects non-ACTIVE actor; repository returns active permissions ordered by code | Preserved; focused read tests PASS (existing suite) |
| READ: denied | Catch `AppError` category `AUTHORIZATION` | `ListPermissionsUseCase` active-account guard | Existing unavailable/alert surface retained; denied-account runtime test NOT RUN |
| READ: provider/other error | Rethrow | Existing page behavior | Preserved; runtime failure NOT RUN |
| FILTER: empty query | input | Client searches loaded code/domain/action/description | All loaded rows; source-contract tests PASS; browser interaction NOT RUN |
| FILTER: query / zero matches | input | Same client predicate; no new server authority decision | Matching rows or zero-result count; browser interaction NOT RUN |
| FILTER: clear | Reset button or chip removal | Native reset / button handlers | Clears query, resets page and focuses input; browser keyboard proof NOT RUN |
| PAGE: next/previous | Buttons | Client-only page index, 25 rows/page | Controls shown only when >25 matches; dataset of >25 permissions NOT verified |
| EXPORT | N/A | No existing export source/action | Not implemented |
| AUTH mutation | N/A | Page exposes no mutation action; server role/scope guards remain owners of changes | No action added; protected grants/scope rules untouched |

## Evidence

- Focused: `tests/unit/admin/permissions-register-surface.test.ts`, `tests/unit/admin/administration-read.test.ts`, `tests/unit/admin/admin-workspace-guard.test.ts` — **15/15 PASS** on Node 24.20.0.
- `astro build` — **PASS**. Existing dependency/chunk warnings remain in build output.
- `graphify update .` — **PASS** (local graph refreshed).
- Contrast measurements: **NOT RUN**. No computed-color runtime evidence collected.
- Authenticated same-record before/after, populated record comparison, and snapshots: **NOT RUN** (no authorized browser session/data supplied; no sample substituted).
- Viewports 320/390/768/1024/1440, keyboard/focus, zoom 200%/400%, reduced-motion and forced-colors: **NOT RUN** in browser. Source includes horizontal-scroll region, 44px filter/pagination controls and focus/reduced-motion/forced-colors styling; these are not browser acceptance evidence.
- Authorized and denied accounts against a real existing record: **NOT RUN**. 404 sentinel not used.

## Pre-existing debt / scope boundary

- The list is currently unbounded at the repository/query layer. This change paginates only the client-rendered result set and does not claim bounded server paging; server-side list contract work is outside this presentation change.
- Existing permission-read error handling renders the same unavailable copy for authorization denial and does not separately expose provider failure. Preserved rather than altering established error semantics outside the verified source.
- No changes to CA-F-* models, application rules, schema, API, sidebar, or mutation guards.
