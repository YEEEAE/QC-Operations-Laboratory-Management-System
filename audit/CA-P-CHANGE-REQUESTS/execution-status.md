# CA-P-CHANGE-REQUESTS — change-request register (CAPA A)

Date: 2026-10-22
Candidate: working tree (no commit)
Page: `src/pages/change-requests/index.astro`
Status: **PARTIAL** — presentation, state separation, filtering, keyboard and responsive
evidence pass on real fixture rows; native 200%/400% browser zoom and screen-reader
testing are **NOT RUN**. `PASS ≠ RELEASED`.

## Scope

Changed only:

- `src/pages/change-requests/index.astro` — wide register order: page header → filters
  → applied filters → result count → table → pagination. Same read use case, same
  filter parameters, same columns, same `PERM-CHG-CREATE` action gate.
- `src/ui/components/data/EmptyTableState.astro` — its action link now uses
  `max(var(--control-height), 44px)` (shared 44px target floor; no markup change).
- `tests/unit/ui/register-surface-contract.test.ts` — registered `/change-requests`
  as an existing filter-chip surface (the ratchet list may only grow).
- `tests/unit/ui/change-requests-register-surface.test.ts` — new source contract.

No schema, API, action, use case, repository, policy, permission, route, Sidebar, or
export change. No mutation was added; the page remains read-only. No canonical hidden
input exists on this route, so CSRF/expectedVersion/requestId are **N/A** (there is no
POST on the register).

Read sources (complete files): `src/pages/change-requests/index.astro`,
`src/modules/change-requests/application/{dependencies,list-change-requests,authorization}.ts`,
`src/modules/change-requests/infrastructure/postgres-repository.ts` (read paths),
`src/modules/change-requests/ports/repository.ts`,
`src/shared/copy/{format,ux-vocabulary}.ts`,
`src/ui/components/{PageHeader,StatusBadge}.astro`,
`src/ui/components/data/{FilterBar,AppliedFilters,EmptyTableState,Pagination}.astro`,
`src/ui/components/feedback/ProviderUnavailableState.astro`,
`src/ui/layouts/AppLayout.astro`, `src/ui/client/{scroll-regions,register-preferences}.ts`,
`src/shared/authorization/visibility.ts`, and the register/copy/design test files.

## State / transition / guard matrix

| UI machine | State | Entry condition | Guard / source | Visible result |
|---|---|---|---|---|
| READ | authorized, populated | ACTIVE actor; `PERM-CHG-VIEW` with `OWN`/`GLOBAL`/`DOMAIN` | `ListChangeRequestsUseCase.executePage` → `PostgresChangeRequestRepository.listPage` (ACTIVE + grant + scope predicate before count/page) | 25 rows, count, table, pager |
| READ | authorized, empty | same read returns 0 rows | same | `No change requests found` + scope note |
| READ | filtered empty | filter matches 0 rows | same + `state`/`targetType` predicate | `No change requests match these filters` + clear |
| READ | page beyond end | `page > totalPages` | repository clamps to the last page | last page + correct count |
| READ | read denied | ACTIVE actor whose grant scope is `TEAM` only (`verify-manager`) | `listPage` returns `{items:[],total:0}` without throwing (existence-leakage-safe) | empty state only: 0 rows, no table, no count, no outage |
| READ | provider unavailable | any repository/database error | page `catch`; failure is not mapped to zero | `ProviderUnavailableState`, no count/rows/pager, retry keeps the query |
| FILTER | idle / applied | native `GET` | `FilterBar` (`method=get`, `role=search`); `state` allowlist and `targetType` trim/slice server-side | fields, result count, chips |
| FILTER | remove one chip | applied filter | `chipHref` drops only that key and `page` | same register without that filter |
| FILTER | invalid state value | manual `?state=…` outside the allowlist | `validStates.find` ignores it | unfiltered register (current behavior preserved) |
| FILTER | pending | native submit | `FilterBar` `aria-busy` + one `role=status` “Updating results…” | pending status only |
| AUTH | unauthenticated | no actor | page redirect | `/login?returnTo=%2Fchange-requests` |
| EXPORT | — | no export function exists on this page | source inspection | **N/A** |
| CREATE | action link | `PERM-CHG-CREATE` active | page predicate; mutation itself is guarded server-side by the create use case | `New change request` link only |

### Authorization personas (measured, not inferred)

- **Authorized:** `verify-admin` (ACTIVE, `GLOBAL`) reads 28 stored change-request rows.
- **Read denied:** `verify-manager` (ACTIVE, `TEAM` only) gets **HTTP 200**, an empty
  register, 0 rows, no table, no count, no outage panel, no mutation form. This is the
  current paging read's scope decision, not a 404 sentinel.
- **Universal read:** `verify-least` (no role-level change-request grant) receives
  `PERM-CHG-VIEW` with `GLOBAL` from `addUniversalOperationalReadPermissions` and reads
  the same 25-row first page as the admin. Page-level denial is therefore **N/A** for
  every ACTIVE account; the reachable denial is the `TEAM`-scope read above.
- **Unauthenticated:** redirect to `/login?returnTo=%2Fchange-requests`.

## Before / after elements (same data, same accounts)

| Element | Before | After |
|---|---|---|
| Page header | custom `.page-head`; malformed action fragment containing a stray `</section>` | shared `PageHeader` slots (section, H1, purpose, gated action) |
| Filters | custom form, no landmark, 40px controls, no clear, no pending status | shared `FilterBar`: `role=search`, 44px controls, clear-all, one pending status |
| Active filters | none (clear link appeared only inside the empty state) | `AppliedFilters` chips with individual remove links + clear all |
| Count | only inside the pager (`Page 1 of 2 — 28 change requests`) | canonical `role=status` “Showing 1–25 of 28 … · Page 1 of 2” + pager |
| Table container | `.table-wrap`; region/tabindex added only when the enhancer detected overflow | labelled `role=region` + `tabindex=0` at every width |
| Table rows | 15px inline row links; long change numbers wrapped but targets were raw UUID lines | same columns/data; row links 44px; long change number and target reference wrap without ellipsis |
| Empty | custom dashed section; 18px links | shared `EmptyTableState`: filtered vs truly empty, 44px action, line above the state |
| Outage | `ProviderUnavailableState` | unchanged component, retry preserves the query, no count/pager |
| Pagination | rendered even with 0 rows | rendered only when the read is available and `total > 0` |
| Mobile (`≤760px`) | shared enhancer collapsed the table to cards | same shared card behaviour; labelled cells, 0 clipped content, 0 page overflow |

Measured before → after (same 28 rows, `verify-admin`):

| Width | Rows | Overflow | Targets <44px | Clipped | Axe | Table region |
|---|---|---|---|---|---|---|
| 320 | 25 → 25 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | cards (JS enhancer) |
| 390 | 25 → 25 | 0 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | cards (JS enhancer) |
| 768 | 25 → 25 | 0 → 0 | 24 → **0** | 0 → 0 | 0 → 0 | overflow region → labelled focusable region |
| 1024 | 25 → 25 | 0 → 0 | 24 → **0** | 0 → 0 | 0 → 0 | unlabelled scroll → labelled focusable region |
| 1440 | 25 → 25 | 0 → 0 | 25 → **0** | 0 → 0 | 0 → 0 | no region → labelled focusable region |

Filtered states: 4 rows (`state=UNDER_REVIEW`), 1 row (`targetType=DOCUMENT`), 0 rows
(`targetType=NO_SUCH_TARGET`), 3 rows on page 2, 1 server chip; all at 0 overflow,
0 clipped content and 0 axe violations. Text never drops below 12px.

## Evidence

- Database: disposable PostgreSQL 18.6 on `127.0.0.1:55432` (`qc_disposable`), local
  accounts from `.tmp/ca04-fixture-env.json`. No provider connection, no `.env` read.
- Fixture: 28 rows inserted into `qc.change_requests` through the real schema
  (`requested_by = verify-admin`, one long change number, one `DOCUMENT` target type,
  nine states) so the page renders through `ListChangeRequestsUseCase`. They are
  disposable verification rows, not product data or business claims. All 28 were
  deleted after the final capture (`deleted: 28`; table count returned to 0).
- Screenshots and raw metrics: `audit/CA-P-CHANGE-REQUESTS/{before,after}/`.
- Comparison: `audit/CA-P-CHANGE-REQUESTS/comparison.json`.
- Keyboard: filter input, table region, pager link and applied-filter chip each receive
  a visible 2px `rgb(146,184,242)` focus ring. A 14-stop Tab walk from the target-type
  field reaches the table region and row links in order, every stop with a visible ring.
- No-JS: native GET `targetType=DOCUMENT` returned 1 row; Clear returned 25.
- Reachable actions (after): the first row link opened `/change-requests/<id>` with
  HTTP 200 and the record heading; `New change request` opened the create form;
  Next page moved to `?page=2` with 3 rows; removing the state chip returned to the
  unfiltered register with 25 rows.
- Measured contrast on rendered colours: h1 15.15:1, purpose 10.88:1, filter heading
  12.12:1, filter label 8.71:1, count 8.71:1, table header 11.00:1, change number
  8.09:1, target label 12.12:1, target reference 8.71:1, chip 11.00:1. Minimum 8.09:1.
- Provider outage: renaming `qc.change_requests` produced the unavailable state with
  0 rows, no count and no pager; restored in `finally`.
- Reduced motion and forced colours at 320px: 0 overflow.

## Commands and results

Node used: `~/.nvm/versions/node/v24.20.0/bin/node` (v24.20.0).

```text
vitest run tests/unit/ui/{change-requests-register-surface,register-surface-contract,
  copy-governance-contract,design-governance-contract,ux-writing-contract,
  universal-shell,interaction-state-contract}.test.ts
  tests/integration/change-requests/change-requests.test.ts
  → 7 files PASS, 1 file FAIL (77/78). The one failure is the pre-existing
    `interaction-state-contract` assertion against `src/ui/forms/enhance-with-classification.ts`
    (file untouched by this change; baseline debt, not caused here).

vitest run tests/unit/ui/change-requests-register-surface.test.ts   → 8/8 PASS
vitest run (5 affected files, before adding the new test)            → 55/55 PASS

astro check → 2 errors, both pre-existing missing BaseLayout imports in
              audit/CA-P-500/{committed,workingtree}-500.astro; 0 in changed files
astro build → PASS
node audit/CA-P-CHANGE-REQUESTS/browser.mjs before → PASS (10 captures)
node audit/CA-P-CHANGE-REQUESTS/browser.mjs after  → PASS (10 captures + states)
git diff --check → PASS
```

## Remaining / N/A

- Native browser zoom **200%/400%**: **NOT RUN** (Playwright cannot change browser UI
  zoom). 320/390 are reflow proxies, not a substitute.
- Screen reader (VoiceOver/NVDA): **NOT RUN**. Axe is not an AT walkthrough.
- Before-phase click-through was not recorded separately for the row/create/pager
  actions; their `href`/query targets are unchanged by this diff, and the after-phase
  navigation above proves each target. The before-phase source was captured for the
  visual/state comparison.
- Export: **N/A** (no export exists on `/change-requests`).
- Pre-existing read-policy debt (not repaired, outside presentation scope):
  `listPage` accepts only `OWN`/`GLOBAL`/`DOMAIN` scopes while a role grant may carry
  `TEAM`; a TEAM-only account (measured with `verify-manager`) silently reads an empty
  register. Changing that predicate is an authorization decision, not a UI change.
- Pre-existing `interaction-state-contract` failure is recorded above and was not
  repaired.
- No commit, push, merge, deploy, production connection, schema change, or new
  dependency. `PASS ≠ RELEASED`; `APPROVED ≠ EFFECTIVE`.
