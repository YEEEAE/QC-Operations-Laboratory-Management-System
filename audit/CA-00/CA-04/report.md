# CA-04 — shared component presentation contracts

**State: PARTIAL.** Local only. No commit, push, merge, deployment or production connection.

## Delivered

- Reproducible static import inventory for **86 screen routes**, with `/` and
  `/laboratory` separately excluded as redirects. Includes every direct import
  declaration, bindings, resolved local paths, route SHA-256 and direct/transitive
  route consumers for all 14 named primitives. `RecordHeader` is reached through
  `JourneyContextPanel`; these are not two independent page implementations.
- `AppliedFilters`: 44px links, shrinkable/wrapping long values, non-collapsing
  labels/remove marks. Existing labels, hrefs, filter values and props are retained.
- `register-preferences.ts`: when the server supplies validated applied filters,
  do not append a duplicate raw-URL chip navigation. Fallback chips remain for
  consumers without the server component. Native GET, clear/reset semantics,
  presets and action bindings are unchanged.
- `Pagination`: wrap summary and navigation when narrow; 44px floor while retaining
  the existing control-height token. Query-preserving native links and disabled
  endpoints are unchanged.
- `ProviderUnavailableState`: a real 44px retry link and wrapping content column;
  no numeric/empty fallback, new provider, or changed retry target.

No route fields/actions, domain rules, schema, scientific result, signature,
expectedVersion, idempotency or Sidebar source was changed. All three component
frontmatter blocks and markup (apart from the applied-filter marker) remain
identical to HEAD; only the duplicate-chip guard changes client presentation logic.
English/LTR and sentence case remain the product contract. PASS ≠ RELEASED and
APPROVED ≠ EFFECTIVE.

## Primitive/state/guard table

Numbers below are **static transitive screen consumers**, not accepted screens.
All named component source files were read; no blanket visual acceptance is inferred.

| Primitive | Consumers | Presentation / state source and guard | This delivery |
|---|---:|---|---|
| `PageHeader` | 64 | Existing navigation section + supplied heading/purpose/actions slots; does not authorize actions | Unchanged; import inventory |
| `RecordHeader` | 14 | Supplied reference/state/next-action/blocker; links only; client section index | Unchanged; import inventory |
| `JourneyContextPanel` | 14 | Owning-domain read context, prerequisites, stage and evidence; secondary native details; unavailable reason stays visible | Unchanged; import inventory |
| `StatusBadge` | 12 | Supplied typed status + optional label; VOID explicitly retained in history | Unchanged; no new business state |
| `PolicyBlocker` | 4 | Supplied decision IDs/owner/consequence/link; missing source stated explicitly | Unchanged; no policy shortening |
| `ProviderUnavailableState` | 29 | Route read catch selects provider failure, not authorization denial; alert + native retry | Changed; tasks and laboratory actual fault fixtures |
| `FormErrorSummary` | 17 | Failed server POST classification supplies summary/field links/recovery; progressive summary focus | Unchanged; full form journeys NOT RUN |
| `FilterBar` | 6 | Native GET + progressive pending status, valid query names owned by route | Unchanged component; shared enhancer duplicate-chip fix verified on tasks/laboratory |
| `AppliedFilters` | 7 | Server-validated filter/chip values and hrefs; not raw URL-derived when server component present | Changed; tasks/laboratory long values and no duplicate chips |
| `DataTable` | 2 | Supplied caption/total/summary/empty; scroll region and native table; density local only | Unchanged; tasks populated table used in browser |
| `Pagination` | 14 | Supplied true authorized total/page; preserves current query parameters; disabled endpoints are spans | Changed; tasks/notifications; real next-page navigation |
| `ConfirmDialog` | 1 | Native dialog; `src/ui/client/dialog.ts` callback + pending/error/stale handling | Unchanged; CA-03 validity/focus-fallback gaps remain |
| `ControlledInspectionForm` | 4 | Schema + source values + editable/canSubmit flags; native POST/expectedVersion/intent retained; owning use case controls write | Unchanged; no source/schema interpretation or signature relaxation |
| `TemplateDesigner` | 1 | Explicit editable USER_AUTHORED_SPECIFICATION guard; native JSON + POST/expectedVersion; DRAFT-only server contract | Unchanged; no extra production consumer invented |

Exact component paths and all route/import relationships are in
`import-inventory.json`. Guard details/transition applicability remain
`../CA-03/state-contracts.md`; this task does not replace those contracts.

### Required state distinctions

| State | Existing representation / source | Evidence here |
|---|---|---|
| Ready | Owning list use case returns authorized rows + total | Populated `/tasks`, 51 disposable notifications |
| Loading/filter pending | `FilterBar` submit status; SSR does not render an artificial loading response | Source retained; pending timing NOT RUN |
| Empty | Successful confirmed read without applied filters | Laboratory no-data source retained; full empty-state matrix NOT RUN |
| Filtered empty | Successful read + supported server filters with zero matches | Tasks and laboratory, long `q`, visible text; no-JS task GET |
| Unavailable | Route catch for non-authorization read failure; alert without empty/pagination/zero count | Tasks and lab, isolated DB fault fixture; both restored |
| Denied | Route/use-case authorization; may intentionally be 404 to prevent enumeration | Least account existing task + `/system/health` 404. Not mutation-authorization proof |
| Policy blocked | Existing CA-F decision card and server create/retest denial | Unchanged; CA-F-00 PD-15/16/18 and RetestPolicy blockers remain BLOCKED |

## Verification and screenshots

Final runtime **44 checks PASS**, zero page errors. Six surfaces × five widths
(320/390/768/1024/1440), each with zero document overflow and each changed
component's targeted links at least 44px high. Six main-content axe scans reported
zero violations. Sidebar computed background `rgb(17, 29, 45)` and 32 links were
recorded; its source is unchanged. This is not app-wide accessibility compliance.

Actual consumers:

- AppliedFilters + duplicate-chip enhancer: `/tasks?q=…`, `/laboratory/tests?q=…`.
- Pagination: `/tasks` and `/notifications?unread=1` (51 real disposable rows;
  next link preserves `unread=1`, page 2 reports row 51).
- ProviderUnavailableState: `/tasks` and `/laboratory/tests` during isolated
  PostgreSQL table-name fault injection; no production provider substitution.

No-JS context successfully signs in, submits task GET, follows the clear chip,
returns to a populated table and follows notification pagination. Keyboard chip
focus has visible nonzero outline. Forced-colors/reduced-motion long-chip reflow
checks pass (not a comprehensive AT/media assessment).

Twelve retained screenshots: `screenshots/*-{320,1440}.png`. The long chip 320px
and laboratory unavailable 1440px images were visually reviewed. These are
**after-only** screenshots from the same built candidate/data/account/viewport
matrix, not a claimed matched pre-change comparison. Some unchanged filter fields
and unrelated page links remain below the global 44px goal.

Commands used (Node **24.20.0** via explicit nvm PATH):

```sh
node audit/CA-04/inventory.mjs
# PASS: 86 screens; 14 primitives; 2 excluded redirects
scripts/db/disposable-postgres.sh provision
node .tmp/ca02-run.mjs node --import=tsx scripts/db/migrate.ts
# PASS: local-only migrations; initial wrapper read .env as data then explicitly
# overrode DB URLs. It was NOT sourced. All subsequent runtime/seed commands
# used the sanitized local-run wrapper below, without .env/provider credentials.
node audit/CA-04/local-run.mjs node --import=tsx --input-type=module -e 'import {Pool} from "pg"; import {seedFoundationData} from "./db/seeds/common.ts"; const p=new Pool({connectionString:process.env.DATABASE_URL}); await seedFoundationData(p); await p.end();'
node audit/CA-04/local-run.mjs node --import=tsx scripts/verification/seed-verification-fixtures.ts
# PASS: disposable verify-* personas; yazeed untouched
node node_modules/vitest/vitest.mjs run \
  tests/unit/ui/ca04-presentation-contract.test.ts \
  tests/unit/ui/register-preferences.test.ts \
  tests/unit/ui/register-surface-contract.test.ts \
  tests/unit/ui/design-governance-contract.test.ts \
  tests/unit/ui/ux360-verified-fixes.test.ts \
  tests/unit/ui/capa-a-surface.test.ts
# PASS: 67/67
node node_modules/astro/astro.js check
# PASS: 0 errors, 0 warnings (118 hints)
node node_modules/astro/astro.js build
# PASS: Astro build; existing chunk-size warning; not release acceptance
node scripts/architecture/check-boundaries.mjs
node --import=tsx scripts/architecture/check-route-files.mjs
# PASS
node audit/CA-04/local-run.mjs node dist/server/entry.mjs
node audit/CA-04/local-run.mjs node audit/CA-04/browser.mjs
# PASS: 44 final checks; local PostgreSQL/read faults only
~/.venvs/graphifyy/bin/graphify update .
# PASS on second run with 300s timeout (first run exceeded 120s)
git diff --check
```

Intermediate failures were not hidden: no employee-owned task initially, duplicate
client chips exposed an 18px raw clear link, the prior token contract required
retaining `var(--control-height)`, and the negative read test initially selected
the wrong existing row. Fixtures/assertions and actual duplicate-chip root cause
were corrected, then all final checks above were rerun. No policy or guard was
disabled to obtain a pass.
One later login pointer-stability timeout was avoided with genuine keyboard Enter
submission (not force-click or skipped login); the final browser run is 44 PASS.
The final typecheck needed a 300s timeout after a 120s run was interrupted; its
completed result is 0 errors/0 warnings/118 hints.

## Remaining / limits

- **PARTIAL:** no complete 86-screen runtime anatomy/labels/errors/state review;
  import reachability is not proof every conditional slot renders.
- No matched pre-change runtime/screenshots, real 200/400% browser zoom, full
  screen-reader exercise, or every consumer's no-JS/mutation/signature journey.
- No full dialog/controlled-form/designer runtime acceptance, and no full suite,
  lint or requirements-reconciliation claim. CA-02/03 remain PARTIAL.
- CA-F missing creation authority remains BLOCKED; no write form enabled.
- Skill discovery found 387 local SKILL.md files; complete reading of all 387 was
  **not completed**. Relevant loaded/read skills were used; no claim of complete
  discovery-protocol compliance. `ENGINEERING.md` entry point remains absent.
- Static inventory uses TS import declarations in Astro frontmatter, inline
  client-script blocks and local modules (each entry names its context).
  Dynamic import expressions are excluded, explicitly, not silently counted as
  runtime coverage.

The disposable DB and generated one-time credential file were removed after
verification. Credentials existed only in gitignored `.tmp/ca04-fixture-env.json`
(0600); no values are in this packet. No production account, external provider or
production data was used.
