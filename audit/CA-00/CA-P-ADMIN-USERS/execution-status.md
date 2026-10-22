# CA-P-ADMIN-USERS — users register

**Work state: PARTIAL.** The local presentation candidate and focused source/unit checks are complete. Real-account, matched before/after browser evidence and the requested responsive/accessibility acceptance remain NOT VERIFIED. No commit, push, merge, deploy, production connection, API/schema change, or authorization change was performed.

## Before / after inventory

| Existing element or behavior | Before | Candidate after | Preservation / evidence |
| --- | --- | --- | --- |
| Page heading and actions | Users; conditional Create user; Back to administration | Same | `PageHeader`, `canCreate`, both destinations retained |
| Primary read | Server-side `executePage`; 25-row page; q/state filters | Same read and query contract | `ListUsersUseCase.executePage`; no new data source |
| Filters | Native GET search and account state; clear all | Native GET retained; visible active-filter chips can remove either filter independently | No JS/API mutation; source/unit contract PASS |
| Count and pagination | Count in table caption; previous/next links | Live result count above results; page navigation retains q/state | Same `total`, `page`, `pages`, pageSize 25 |
| Desktop records | Five table columns: login identity, display name, state, roles, scopes | Same columns and fields | Table identity links retained; long values wrap rather than truncate |
| Mobile records | Desktop table only, horizontally scrollable | Same five record fields in readable cards below 760px; table hidden at that breakpoint | Card/detail links retain the original user id target |
| User links | Login identity opens user detail | Same | No inline identity, role, scope, password, or session action added |
| Empty states | No visible member accounts / no filter matches | Same distinction | Source/unit contract PASS |
| Denial/provider/relationship failures | Existing denied state, provider component, relationship warning | Same meanings and source behavior | No failed source is shown as zero or as a fabricated record |
| Export | No export action | N/A — no export function, action, or download source exists on this page | No export affordance added |
| Identity/role/scope mutation | Not available on register; managed from existing detail workflows | Still not available on register | No mutation dependencies imported; use-case/server guards unchanged |
| Sensitive projection fields | No secrets or raw sessions rendered | Still absent | Safe list projection and source contract retained |

## State, transition, and guard matrix

| Concern/state | Transition or action | Canonical source / guard | Candidate evidence/status |
| --- | --- | --- | --- |
| READ — unauthenticated | Request `/admin/users` | Page redirects to login with `returnTo` | Source unchanged; runtime NOT RUN |
| READ — active authenticated account | Initial list read | `ListUsersUseCase.executePage` requires `actor.accountState === 'ACTIVE'`; results are existing safe user projections | Same call and projection; unit source and identity tests PASS; real account NOT RUN |
| READ — inactive/denied | Read fails with authorization category | Page classifies `AUTHORIZATION` separately from provider failure | Existing denied section retained; denied account/runtime NOT RUN |
| READ — provider unavailable | Main list read fails outside authorization | `classifyReadFailure` + `ProviderUnavailableState`; no table/count is rendered | Existing unavailable state retained; runtime failure NOT RUN |
| READ — relationships available | Load roles and scopes for current page | Separate `ListUserRolesUseCase.executeForUsers` and `ListUserScopesUseCase.executeForUsers`; both require active actor | Existing resolver calls and code/labels retained; populated runtime NOT RUN |
| READ — relationship failure | Either role/scope relation load fails | Existing shared `Promise.all` catch sets `relationshipUnavailable`; fields display `Not confirmed` and one relationship notice | Preserved. **Pre-existing limitation:** one relationship failure marks both relation columns unconfirmed; not changed in this presentation task |
| FILTER — query/state apply | Submit search and/or state | Native GET; current server query contract; state allowlist is ACTIVE/INACTIVE/DISABLED | Source/unit PASS; browser interaction NOT RUN |
| FILTER — active chip removal | Remove search or account-state chip | GET link retains the other applied filter | Source/unit PASS; browser interaction NOT RUN |
| FILTER — clear | Clear filters link | `/admin/users` without filter parameters | Source/unit PASS; browser interaction NOT RUN |
| FILTER — unsupported state | Request unsupported `state` value | Existing allowlist rejects it; informational status retained | Source/unit PASS; browser interaction NOT RUN |
| PAGE — previous/next | Navigate pages | Server `executePage`; generated GET links retain q/state | Source/unit PASS; populated multi-page browser NOT RUN |
| OPEN USER | Activate a login-identity link | Existing `/admin/users/{user.id}` details route and its page access/use-case checks | Link retained; real-record browser NOT RUN |
| CREATE USER | Activate Create user | Rendered only when `hasAdminCapability(actor, 'createUser')`; create use case remains the authority | Conditional link unchanged; authorized/denied runtime NOT RUN |
| AUTH mutation | Change identity/password/account state, sessions, roles, or scopes | No such action exists on this register; existing detail actions/use cases own their guards, protected grants, self restrictions, and user-version checks | N/A on register. No UI or server action added |
| EXPORT | Export/download records | No source function or action exists | N/A — not implemented |

Role/scope list reads only check for an active actor in their use cases; the page does not infer mutation authority from displayed roles or scopes. Role/scope membership has no version column, so no expectedVersion control was invented. User profile/lifecycle mutations and their existing expectedVersion controls remain on the detail route, not this register.

## Verification

| Check | Result |
| --- | --- |
| Focused unit tests: users register surface, admin-workspace guards, identity admin use cases | **PASS — 24/24** on Node 24.20.0, rerun on final page and test source |
| `pnpm exec astro build` | **PASS** — final Astro server/client build completed; existing Rollup/Zod and large-chunk warnings remain. This is not authenticated runtime acceptance or full `pnpm build` evidence |
| `pnpm exec astro check` | **FAIL / PARTIAL** — final run has 2 errors, both pre-existing missing imports in `audit/CA-P-500/committed-500.astro` and `workingtree-500.astro`; no diagnostic is reported for this candidate page |
| `prettier --check` | **PARTIAL** — test file PASS; the repository has no installed/discoverable Astro Prettier parser/plugin, so the page cannot be checked by this command |
| `graphify update .` | **BLOCKED** — CLI is not installed in this shell; exposed graph MCP has no update tool |
| Same-account/same-record before/after screenshots | **NOT RUN** — no authorized local session or isolated populated database was available; no synthetic row substituted |
| Viewports 320/390/768/1024/1440; keyboard/focus; 200%/400% zoom; reduced-motion/forced-colors | **NOT RUN** in browser |
| Contrast measured from rendered computed colors | **NOT RUN** |
| Authorized and denied account against a real existing record | **NOT RUN** — no valid local auth session/data. No 404 sentinel used |
| Dynamic relationship failure and denied-source runtime states | **NOT RUN** |
| Screenshot artifacts | **N/A / NOT CAPTURED** — source-level or static mockups would not meet the required same-data runtime comparison |

## Scope and remaining gaps

- Product changes are limited to `src/pages/admin/users/index.astro`; no imported component, Sidebar, action, API, schema, or business rule was modified.
- The acceptance matrix, runtime comparisons, measured contrast, and real-account authority evidence remain open; therefore this task is **PARTIAL**, not a full acceptance PASS.
- The existing relationship aggregation behavior described above is independent pre-existing debt; it is recorded, not repaired here.
- No NCR/CAPA/Retest functionality is applicable to this users register.
