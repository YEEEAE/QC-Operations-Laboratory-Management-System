# CA-P-ADMIN — execution status

**State: PARTIAL.** The overview hierarchy changed locally. Source guards and static destinations were checked; authenticated browser acceptance on authorized/denied accounts and a real populated account was not run. This is not an authorization or accessibility acceptance claim.

## Before / after inventory

| Page element | Before | After | Preserved source / result |
|---|---|---|---|
| Page header | Administration; “Manage members, roles and access.” | Unchanged | `PageHeader.astro` |
| Users (`UI-ADM-USR-001`) | One card in the same-weight grid | Spans the grid and gets a wider two-column text/action layout on larger screens; stacks at 600px and below | Text and `/admin/users` stay; `/admin/users/new` remains conditional on `hasAdminCapability(actor, 'createUser')` |
| Roles (`UI-ADM-ROLE-001`) | Same-weight card | Same content and destination; follows Users | `/admin/roles` |
| Permissions (`UI-ADM-PERM-001`) | Same-weight card | Same content and destination; follows Users | `/admin/permissions` |
| Scopes (`UI-ADM-SCOPE-001`) | Same-weight card | Same content and destination; follows Users | `/admin/scopes` |
| Audit history | Conditionally rendered same-weight card | Same content and destination; follows Users | `/audit`, still conditional on `hasAdminCapability(actor, 'viewAudit')` |
| Sidebar / shell | Existing `AppLayout`, Sidebar, Topbar, command palette | Unchanged | `AppLayout.astro`; no navigation code or styles changed |
| Filter / export / page-local auth form | Absent | N/A; not added | `/admin` has no form, filter, export or client script |

No fields, headings, section copy, destinations, action handlers, API/schema/business rules, permissions, role/scope version behavior, or status/error/pending regions were added or removed. No secrets, hashes, raw sessions, KPIs or data projections were introduced.

## Reachable states, transitions, and guards

| Concern / action | State or transition | Guard and source | Evidence / status |
|---|---|---|---|
| READ `/admin` | Request → overview; missing actor → login redirect | `pageAccessDecision` allows registered non-owner pages to ACTIVE actors; page redirects when `Astro.locals.actor` is missing. Route visibility is not mutation authority. | Source verified; authenticated real-record browser NOT RUN. |
| Open users | Link activation → `/admin/users` read | `ListUsersUseCase.executePage` requires ACTIVE; safe read projection is separate from mutation authority. `users/index.astro` handles denied/provider states. | Link and route registry PASS; runtime click/read NOT RUN. |
| Create user | Link is rendered only when predicate is true → `/admin/users/new` | `hasAdminCapability`: ACTIVE + active `PERM-IDN-MANAGE-USERS` grant + GLOBAL scope. Page and create use case/action make their own server-side checks. Initial role/scope assignment has separate capability checks. | Predicate/unit coverage source verified; real positive/negative accounts NOT RUN. |
| Open roles | Link activation → `/admin/roles` read | Route requires ACTIVE actor; `ListRolesUseCase` is server-side read gate. Role-grant mutations use separate explicit permission, scope and role-version checks on detail/action paths. | Link and route registry PASS; runtime click/read NOT RUN. |
| Open permissions | Link activation → `/admin/permissions` read | Route requires ACTIVE actor; `ListPermissionsUseCase` denies non-ACTIVE actors. Grants are managed through roles, not this overview. | Link and route registry PASS; runtime click/read NOT RUN. |
| Open scopes | Link activation → `/admin/scopes` | Scope-kind vocabulary is read-only here; member scope changes are handled on member routes through existing guards/actions. `user_scopes` has no version field; no version check was introduced. | Link and route registry PASS; runtime click/read NOT RUN. |
| Open audit | Link rendered only when predicate is true → `/audit` | `hasAdminCapability`: ACTIVE + active `PERM-ADM-AUDIT-VIEW` + GLOBAL scope. Audit query/use case retains its explicit authorization and safe denial behavior. | Predicate source verified; real allowed/denied audit reads NOT RUN. |
| AUTH | Missing/expired session is handled by middleware/login; there is no login control on this page. | `pageAccessDecision`, `Astro.locals.actor`, existing login route. | Source verified; session expiry/redirect browser test NOT RUN. |
| FILTER / EXPORT | N/A | No filter, register, export control or corresponding action exists on `/admin`. | No UI or new operation added. |
| Page-local status/error/pending | N/A | Page is static SSR with native links; no page-local async or mutation. Child pages own their own loading/error/denied behavior. | No state machine added. |

Role and scope labels are not used to infer eligibility. Hiding Create user/Audit links is only presentation; downstream server decisions remain authoritative. No expectedVersion was added for roles or scopes.

## Verification

| Check | Result |
|---|---|
| Focused admin guard + UI reflow/design contracts (Node 24.20.0) | **PASS — 3 files, 24 tests** |
| Astro production build | **PASS** (existing third-party bundler/chunk warnings) |
| Route registry integrity | **PASS** |
| Graph refresh | **PASS** — graphify reported no topology changes |
| Prettier for changed TypeScript test | **PASS** |
| Prettier for Astro page | **NOT RUN** — `prettier-plugin-astro` is not installed/resolvable in this checkout |
| `astro check` | **FAIL, unrelated existing errors** — `audit/CA-P-500/{committed-500,workingtree-500}.astro` import a missing `../ui/layouts/BaseLayout.astro`; no diagnostic points to the changed admin page |
| `git diff --check` | **PASS** |
| Same candidate/account/data authenticated before/after render and screenshot | **NOT RUN** — no authorized browser session was available; no fixture or example data substituted. No screenshot retained. |
| Allowed and denied live account; dynamic record; click-through behavior | **NOT RUN** — source/unit guards verified, but real account/browser evidence unavailable |
| 320/390/768/1024/1440 browser matrix, keyboard/focus, 200%/400%, forced colors/reduced motion, runtime contrast, long text | **NOT RUN** — no authenticated rendered page. No color or motion values were changed; this does not replace rendered measurement. |

## Prior debt kept out of scope

- Role/scope grant dialogs and mutations remain on their existing detail routes and are not repaired or reworked here.
- Runtime denial, source-unavailable, and populated-register behavior on destination routes was not re-tested; the overview does not replace those canonical states.
- No production connection, commit, push, merge, deployment, schema/API/policy change, or CA-F-* work was performed.
