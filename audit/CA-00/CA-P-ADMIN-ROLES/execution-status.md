# CA-P-ADMIN-ROLES — roles register

**Status: PARTIAL.** Local candidate only; no commit, push, merge, deploy, production access, schema/API change, or role-grant mutation was performed.

## Change and comparison

| Area | Before | Candidate after |
| --- | --- | --- |
| Register | Unfiltered roles table | Separate native GET search/status filters, applied-filter chips, result count, and 25-row pagination |
| Read data | Existing `ListRolesUseCase` projection | Same projection; filters/pagination are applied to that returned list |
| Row action | Role detail link | Preserved as the only register action; grant mutation stays on role detail |
| Record content | Existing role fields | Name/code, description, system/custom type, active state, and current version remain visible |
| Visual/runtime evidence | No baseline captured in this task | No authenticated populated before/after screenshots were captured; the brainstorming companion is a mockup, not runtime evidence |

## Status and guard matrix

| Scenario | Current source contract | Candidate evidence/status |
| --- | --- | --- |
| Unauthenticated page request | Redirects to login with the current route as `returnTo` | Preserved in page source; browser NOT RUN |
| Active authenticated read | `ListRolesUseCase` checks `accountState === 'ACTIVE'` before returning roles | Same use case remains the page read source; no real-account run |
| Inactive/unauthenticated read | Use case rejects non-ACTIVE actors; page redirects when actor is absent | Source contract preserved; denied-account browser test NOT RUN |
| Grant authority | Role-detail action is capability-gated by `assignRolePermissions` and uses existing `expectedVersion` | No mutation added to register; unit source-contract assertion PASS; actual authorized/denied actions NOT RUN |
| Provider/read failure | Non-authorization read errors are rethrown by this page | No fabricated empty state; provider-unavailable UI is NOT PROVIDED by this route and remains a documented gap |
| Empty vs filtered-empty | Distinct “No roles are configured” and “No matches” states | Helper/markup checks PASS; runtime data states NOT RUN |

The directory contains no populated role data or authenticated-session evidence for this task, so records and account outcomes are not claimed.

## Verification

| Check | Result |
| --- | --- |
| Focused unit/contract tests | **PASS** — 3 files, 20 tests |
| `pnpm typecheck` | **FAIL / PARTIAL** — the new page no longer reports a type error; two errors remain in `audit/CA-P-500/committed-500.astro` and `workingtree-500.astro` for missing `../ui/layouts/BaseLayout.astro` imports. Environment is Node 22.22.3; package requires `>=24.20.0 <25`. |
| Astro compilation | **PASS** — `astro build` completed its Astro/Vite build phase |
| Full `pnpm build` | **FAIL** — post-build evidence writer stopped because no fresh verification-run context matched this candidate (`scripts/verification/write-build-evidence.mjs`). Do not interpret the Astro compile as a complete package build. |
| `graphify update .` | **BLOCKED** — graphify CLI is not available in this shell; graph MCP exposed query/read tools only, no update operation. Existing graph was queried before source exploration. |
| `git diff --check` | **PASS** at initial final review; rerun after report/mind updates |
| Authenticated populated browser, denied-account proof, keyboard/zoom/AT, and same-record before/after screenshots | **NOT RUN** — no authorized real-data browser session was established. The companion mockup is not runtime evidence. |

## Remaining gaps

1. Run the accepted real-data and account authorization matrix, then capture matched before/after browser evidence.
2. Verify responsive layout, keyboard/focus behavior, zoom, and assistive technology on the runtime page.
3. Decide whether this route should implement a safe provider-unavailable state; currently it rethrows non-authorization read errors.
4. Resolve the unrelated CA-P-500 imports and rerun typecheck; use the supported Node version and establish the build evidence context before rerunning the full build pipeline.

No claim of WCAG conformance, production readiness, UAT, or complete authorization validation is made.
