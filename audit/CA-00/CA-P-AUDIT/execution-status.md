# CA-P-AUDIT — audit register (CAPA A)

Date: 2026-10-22
Candidate: working tree on `f4ac3129` (no commit)
Status: **PARTIAL** — presentation and browser evidence are complete for the reachable
states; native 200%/400% browser zoom and screen-reader testing are **NOT RUN**.
`PASS ≠ RELEASED`.

## Scope

Changed only:

- `src/pages/audit.astro` — wide register order: page header → filters → applied
  filters → count → table → pagination.
- `src/ui/components/data/AppliedFilters.astro` — 44px floor for its “Clear all
  filters” link (shared component; affects the surfaces that already use it).
- `tests/unit/ui/{audit-human-labels,register-surface-contract}.test.ts` — moved
  the named-landmark assertion to the shared `FilterBar` and registered `/audit`
  as an existing filter-chip surface.
- `tests/unit/ui/audit-register-surface.test.ts` — new source contract for this page.

No schema, API, action, use case, policy, permission, route, Sidebar, or export
change. No mutation was added. The page remains read-only.

Read sources (complete files): `src/pages/audit.astro`,
`src/shared/audit/{audit-query,audit-dependencies,postgres-audit-query}.ts`,
`src/shared/copy/{format,ux-vocabulary,audit-vocabulary}.ts`,
`src/shared/authorization/visibility.ts`, `src/ui/components/PageHeader.astro`,
`src/ui/components/feedback/ProviderUnavailableState.astro`,
`src/ui/layouts/AppLayout.astro`, `src/ui/client/{register-preferences,scroll-regions}.ts`,
`src/ui/components/data/{FilterBar,AppliedFilters,DataTable,Pagination,EmptyTableState}.astro`,
`src/pages/{admin/users/index,tasks/index}.astro`, and the audit/route test files.
The read model still selects no raw payload and keeps `occurred_at DESC, event_no DESC`.

## State / transition / guard matrix

| Concern | State | Entry condition | Guard / source | Visible result |
|---|---|---|---|---|
| READ | authorized, populated | actor + permission; source returns rows | `AuditQueryService.list` + `PERM-ADM-AUDIT-VIEW`; PostgreSQL count and page share one predicate | count, full table, pager |
| READ | authorized, empty | source returns 0 rows | same read | `0 authorized events` + empty state |
| READ | filtered empty | filter matches 0 rows | same read | filtered-empty heading + clear link |
| READ | offset beyond end | `offset > total`, total > 0 | normalized offset in the service | “No audit events on this page” + first-page link |
| READ | provider unavailable | any non-`AUTHORIZATION` error | page catch; source failure is not zero | `ProviderUnavailableState`, no count/rows; retry preserves the query |
| READ | authorization denied | `AppError.category === 'AUTHORIZATION'` | service `authorize` rejects before repository read | denied section, no record content/count |
| FILTER | idle / applied | native `GET` parameters | `FilterBar` (`method=get`, `role=search`), server normalization | fields, chips with individual remove links, clear-all |
| FILTER | invalid identifier | a non-UUID `subjectId`/`actorId` reaches the typed column | **pre-existing debt** — classified as provider unavailable | documented below, not repaired |
| FILTER | pending | native form submit | `FilterBar` status region (`aria-live`) | “Updating results…” only while submitting |
| AUTH | unauthenticated | no actor | page redirect | `/login?returnTo=%2Faudit` |
| EXPORT | — | no export function exists on `/audit` | source inspection | **N/A** |

### Authorization note (important)

`addUniversalOperationalReadPermissions` adds `PERM-ADM-AUDIT-VIEW` to every
`ACTIVE` authenticated account. Therefore the **page-level denied state is N/A**
for all ACTIVE users in the current source; `verify-least` reads the same 9
events as `verify-admin`. The denied branch is retained because the service
guard remains authoritative, and the service-level denial is proven by
`tests/integration/shared/{audit-query,audit-dashboard-parity}.test.ts` (16/16).
No account or policy was fabricated to force a page denial.

## Responsive / keyboard / preference evidence

Same disposable PostgreSQL 18.6 database, same account (`verify-admin`), same
9 audit events before and after. Screenshots and raw metrics:
`audit/CA-P-AUDIT/{before,after}/`, `comparison.json`.

| Width | Before | After |
|---|---|---|
| 320 | 0 overflow; 7 controls at 40px | 0 overflow; 0 targets <44px; cards; 0 clipped |
| 390 | 0 overflow; 7 controls at 40px | 0 overflow; 0 targets <44px; 0 clipped |
| 768 | 0 overflow; 7 controls at 40px | 0 overflow; 0 targets <44px; table scroll region |
| 1024 | 0 overflow; 7 controls at 40px | 0 overflow; 0 targets <44px; table scroll region |
| 1440 | 0 overflow; 7 controls at 40px | 0 overflow; 0 targets <44px; table fits (1126/1126) |

Before also had 18px applied-filter links and a 40px pager link; both are now
≥44px. Every measured text node is ≥12px before and after. Axe (WCAG 2.0/2.1 A
and AA, `#main-content`) reports **0 violations** at all captured states.

- Keyboard: filter input, table region, applied-filter chip and pager link each
  receive a visible 2px focus ring (`rgb(146, 184, 242)` on the dark surface).
- Table: `role="region"`, `aria-label="Audit event table"`, `tabindex="0"`; at
  ≤760px the shared enhancer turns the table into labelled cards.
- No-JS: native GET filter applied `CREATE_TASK`, returned 1 row; clear filters
  returned 9 rows.
- Reduced motion and forced colors at 320px: 0 overflow; forced-colors keeps
  CanvasText borders and a Highlight focus ring.
- Measured contrast on rendered colors: h1 15.15:1, filter heading 12.12:1,
  filter label 8.71:1, timezone note 5.60:1, count 8.71:1, table action 12.12:1,
  record reference 5.60:1, request reference 8.71:1, chip 11.00:1, empty message
  8.71:1. Minimum 5.60:1 (12px text).
- Dynamic record proof: the 9 real events include task, receiving, equipment and
  calibration records; request references are UUID-length strings and wrap
  without clipping.
- Provider failure proof: renaming the local `qc.audit_events` table produced the
  unavailable state with 0 rows and no count; the table was restored in `finally`.

## Commands and results

Node used: `~/.nvm/versions/node/v24.20.0/bin/node` (v24.20.0).

```text
vitest run audit-human-labels, register-surface-contract, design-governance-contract,
  ux360-verified-fixes, copy-governance-contract, audit-register-surface
PASS — 6 files, 62 tests

vitest run tests/integration/shared/audit-dashboard-parity.test.ts
  tests/integration/shared/audit-query.test.ts
PASS — 2 files, 16 tests

astro check
FAIL — 2 pre-existing errors in audit/CA-P-500/{committed,workingtree}-500.astro
       (missing ../ui/layouts/BaseLayout.astro); 0 errors in changed files

astro build
PASS — server and client build completed

node audit/CA-P-AUDIT/browser.mjs before   PASS (evidence recorded)
node audit/CA-P-AUDIT/browser.mjs after    PASS — 9 state captures + 4 filter states
git diff --check                           PASS
```

Focused `record-journey-contract.test.ts -t "audit reason"` also PASS; the whole
file still fails on unrelated Findings assertions and the absent
`Documents/PERMISSION-MATRIX.md` (pre-existing).

## Remaining / N/A

- Native browser zoom **200%/400%**: **NOT RUN** (Playwright cannot change the
  browser UI zoom level). The 320/390 widths are narrower reflow proxies, not a
  substitute.
- Screen reader (VoiceOver/NVDA): **NOT RUN**. Axe is not an AT walkthrough.
- Page-level denied persona: **N/A** by the universal operational read grant;
  service denial is PASS.
- Export: **N/A** (no export exists on this page).
- Pre-existing debt (not repaired): a non-UUID `subjectId`/`actorId` filter reaches
  the typed PostgreSQL column and renders the provider-unavailable state instead
  of a validation message. Evidence: `after/evidence.json`
  `invalidIdentifierFilter`. Fixing it would change input validation/business
  behavior outside this presentation task.
- No commit, push, merge, deploy, production connection, schema change, or new
  dependency. `PASS ≠ RELEASED`; `APPROVED ≠ EFFECTIVE`.
