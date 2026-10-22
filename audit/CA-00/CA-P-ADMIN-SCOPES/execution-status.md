# CA-P-ADMIN-SCOPES — execution status

**State: PARTIAL** — the approved Variant A presentation change and source-level guard checks are complete. Real-account browser comparison, populated member record, denied account, keyboard walkthrough, viewport/zoom matrix, forced-colors/reduced-motion runtime checks, and screenshot evidence were not available in this run. No screenshot files were created or retained.

## Candidate and scope

- Page: `src/pages/admin/scopes/index.astro` (`/admin/scopes`), overview surface.
- Route remains the existing authenticated application route. The page itself has no scope-data fetch, scope-specific client script, form, mutation, filter, export, or icon; it presents the canonical vocabulary and links to the existing member register. `AppLayout` still supplies its shared navigation/command-palette scripts, unchanged.
- No API, schema, business rule, authorization policy, Sidebar, or downstream member-detail implementation was changed.
- CAPA Variant A tokens are inherited from `AppLayout`/`capa-a.css`; Sidebar stays owned by `AppLayout` and was not touched.

## Before / after inventory

| Existing element | Before | After | Preservation |
|---|---|---|---|
| Page heading and purpose | “Scopes”; “Manage access scopes. Self-grants are blocked.” | Same text | Preserved |
| Back destination | “Back to administration” → `/admin` | Same | Preserved |
| Member-scopes section | “Choose a member” and current account/scope review instruction | Promoted into the “Next step” panel; heading is now “Review a member’s current scopes”; the full instruction remains | Section/instruction preserved; heading reframed |
| Primary destination | “Browse members” → `/admin/users` | Same link, visually emphasized, 44px minimum height | Preserved; no new destination |
| Canonical scope list | 7 kind codes, vocabulary labels, and explanatory descriptions | Same 7 entries and descriptions, now fluid graphite tiles | All preserved |
| Authorization caveat | Scope is not sufficient authority; mutation still requires permission/entity/state/SoD/version/business rule | Same statement | Preserved verbatim |
| Page actions and states | Two page links; no scope-data loading or mutation lifecycle | Same two page links; no scope fetch/form/action or page-level dynamic status | No function added; shared shell scripts unchanged |

## UI states, transitions, and guards

UI descriptions below reflect existing implementation; they do not define business state.

| Surface / transition | Existing condition or guard | UI result | Status |
|---|---|---|---|
| Open `/admin/scopes` without actor | Page checks `Astro.locals.actor` | Redirect to `/login?returnTo=…` | Source verified; browser redirect not exercised |
| Open registered page as ACTIVE account | `pageAccessDecision` requires ACTIVE for non-public routes; this route has no role-only visibility restriction | Overview and two existing navigation links are visible, including to read-only accounts | Source/unit verified |
| Open page as non-ACTIVE account | Central page-access guard returns `AUTHENTICATION_REQUIRED` | Login/authentication path; scope mutation is not considered | Source verified; browser not exercised |
| Read scope assignments on member detail | `ListUserScopesUseCase` requires ACTIVE actor only; permission to mutate is separate | Safe current-scope projection or its existing unavailable message | Source verified; real populated record not tested |
| Assign/remove scope from member detail | UI capability is display-only; use cases recheck `PERM-ADM-SCOPE-ASSIGN`, target and self-grant condition; repository rechecks protected-owner scope | Existing downstream form/dialog behavior; no scope change happens on this overview | Source + unit verified; action E2E not run |
| Replace scopes (bulk) | Existing separate capability and use case; self-target is denied; persistence is transactional | Existing downstream disclosure/form, not on overview | Source verified; action E2E not run |
| Remove canonical owner GLOBAL grant | `isProtectedOwnerScope` plus persistence guard | Protected/non-removable downstream grant | Source verified; database/browser denial not run here |
| Overview pending/error/empty/data states | No asynchronous data read, action, or form exists on this page | N/A — no such state is reachable on this overview | Source verified |
| FILTER / EXPORT / AUTH controls | No filter, export, or credential/session control exists on this page | N/A — no function added to complete a theoretical state table | Source verified |

### Permission boundary

`ListUserScopesUseCase` and `AssignUserScopeUseCase`/`RemoveUserScopeUseCase` are separate paths. The former only requires an ACTIVE actor; assign/remove require `PERM-ADM-SCOPE-ASSIGN` and reject self-scope changes in the use case. The named owner's GLOBAL scope is protected for every actor in persistence. Neither role membership nor visible color is treated as authorization. `user_scopes` has no version column; no `expectedVersion` was added. `requestId` remains server-derived in the existing downstream actions. The overview submits no mutation fields, CSRF token, version, or request ID because it has no mutation form.

## Verification evidence

| Check | Result | Evidence / limitation |
|---|---|---|
| Focused source contracts + adjacent scope guard tests | **PASS** — 46 tests, 6 files | Node 24.20.0; command: `pnpm exec vitest run tests/unit/ui/admin-scopes-overview.test.ts tests/unit/ui/form-ux-contract.test.ts tests/unit/admin/admin-workspace-guard.test.ts tests/unit/ui/reflow-320.test.ts tests/unit/admin/user-scope-administration.test.ts tests/unit/admin/administration-read.test.ts` |
| Astro build/route compilation | **PASS** | `astro build` completed and produced server/client bundles. The outer `pnpm build` command then **FAIL**ed in the evidence writer because no fresh verification-run context existed; release evidence was not written. |
| Typecheck | **FAIL (unrelated existing errors)** | `pnpm typecheck` reports 2 unresolved relative imports in `audit/CA-P-500/{committed-500,workingtree-500}.astro`. No reported error points to the changed page or new test. |
| ESLint | **PARTIAL** | New test lint is clean; ESLint has no parser configuration for `.astro` and warns that the page is ignored. |
| Prettier | **PASS for test / NOT SUPPORTED for Astro page** | Test file passes. Prettier has no parser configured for `.astro`; no dependency was installed. |
| Color contrast | **PASS (token-pair calculation)** | WCAG relative luminance computed from inherited CAPA A tokens: primary/panel 12.12:1; muted/panel 5.60:1; muted/inset 5.08:1; link/panel 8.09:1; accent label/accent 8.79:1; focus/panel 7.03:1. Not measured from authenticated browser rendering. |
| Browser, populated record, authorized/denied personas | **NOT RUN** | No authorized test account/session and no verified dynamic target record available; no 404 sentinel or synthetic data substituted. |
| 320 / 390 / 768 / 1024 / 1440, keyboard, focus, long text, 200% / 400%, reduced-motion, forced-colors | **NOT RUN** | No runtime browser audit of the final application page. Existing static reflow unit tests pass but are not viewport evidence. |
| Same-data before/after, screenshot comparison | **NOT RUN** | No same-account populated browser baseline or screenshots. The temporary visual companion mockup was not treated as runtime evidence; its temporary HTML will be removed. |
| Screenshot cleanup | **PASS** | No screenshots were captured or left behind. |
| Graph refresh | **PASS** | `$HOME/.venvs/graphifyy/bin/graphify update .` completed; graph reports 67,677 nodes. |

## Existing functional debt outside this presentation change

Scope assignment/revocation, bulk replacement, and owner/self protections are existing downstream functionality on `/admin/users/[userId]`; this change deliberately did not alter those authorities or their API/schema contracts. Runtime proof of positive/denied scope mutations remains unverified for this candidate.

## Files changed

- `src/pages/admin/scopes/index.astro`
- `tests/unit/ui/admin-scopes-overview.test.ts`
- `audit/CA-P-ADMIN-SCOPES/execution-status.md`
- `.agents/mind/01-mind-latest.md`
