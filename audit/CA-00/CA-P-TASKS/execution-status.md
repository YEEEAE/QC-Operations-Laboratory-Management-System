# CA-P-TASKS — PARTIAL (local only)

## Delivered

`src/pages/tasks/index.astro` now groups the existing native GET filters in a
named CAPA A panel, using existing semantic surface/border/type tokens. Responsive
grid sizing accommodates the actual shared enhancer (advanced filters and saved
presets occupy full rows). Task identity links and empty recovery links have a
44px floor; next-step text has reading space; version numbers remain tabular.
No new dependency, animation, business state, field, API or schema was added.

Frontmatter is byte-identical to HEAD (`comparison.json`). All nine columns,
query names, stored state values, task detail/create links, sorting, pagination,
permission checks and next-step derivation are preserved. Sidebar source was not
edited. Sidebar text/links/background and rendered task rows compare identically
at all five matched widths. Reference is the pinned CA-00 CAPA A token direction,
not a claim of pixel-identical reproduction of a CAPA domain screen.

## Execution / evidence matrix

| Requirement | Evidence / result |
|---|---|
| Populated READ, real record | PASS: disposable employee-owned `CA-P-TASKS-LOCAL`; actual PG18 and actual `/tasks`; detail link opens that existing UUID, not sentinel |
| Matched account/data/viewport before-after | PASS for rows/account/320,390,768,1024,1440; screenshots in `before/` and `after/`; `comparison.json` |
| Identical runtime before-after | NOT VERIFIED: initial Homebrew executable named node@24 actually returned v26.0.0; final rerun uses explicit nvm v24.20.0. No performance comparison claimed |
| Document reflow, five widths | PASS: zero document overflow before and after; mobile retains all nine fields as shared register cards |
| Contrast / automated accessibility | PASS: final main-content axe WCAG tagged scan 0 violations; not comprehensive conformance |
| Keyboard | PASS: Search→State Tab and populated record navigation; complete keyboard journey NOT RUN |
| FILTER / filtered empty / clear | PASS: actual query, zero matches and clear back to populated table |
| No JavaScript | PASS: authenticated cookie with JS disabled, native GET submission and filtered-empty result |
| Forced colors / reduced motion | PASS limited reflow probes at320; complete visual/AT review NOT RUN |
| True browser zoom200/400 | NOT RUN; no CSS zoom or device-scale emulation counted as browser zoom |
| READ loading | N/A for initial server HTML; progressive filter pending exists, timing/announcement NOT RUN |
| Confirmed empty without filters | NOT RUN on final dataset (populated positive control deliberately retained) |
| Provider unavailable | Source preserved; final runtime fault injection NOT RUN (CA04 historical evidence not relabeled current) |
| Denied account / existing-record negative | NOT RUN; no missing record or unrelated owner-only route counted as task-authorization denial |
| Read guards | Source: ACTIVE actor + active PERM-TASK-VIEW + OWN/ASSIGNED/GLOBAL in `ListTasksUseCase`; repository applies scope before count/limit, SQL UTC due/open predicates and batched related reads |
| Create/transition/delete/save/conflict/signature/upload | N/A on this read/filter register; linked pages and use cases retain their own guards; no mutation acceptance claimed |
| Unit | PASS 43/43, 6 files, explicit Node24.20.0; `tests.log` |
| Astro typecheck | PASS 0 errors/0 warnings, 1120 files; `typecheck.log` |
| graphify | PASS update; `graphify.log` |
| Build / full E2E / screen reader | NOT RUN |

## Reproduction

Use `NODE=$HOME/.nvm/versions/node/v24.20.0/bin/node` (verified v24.20.0),
not `/opt/homebrew/opt/node@24/bin/node` (observed v26.0.0).

```sh
$NODE audit/CA-04/local-run.mjs "$NODE" --import=tsx scripts/db/migrate.ts
$NODE audit/CA-04/local-run.mjs "$NODE" --import=tsx scripts/db/seed-foundation.ts
$NODE audit/CA-04/local-run.mjs "$NODE" --import=tsx scripts/verification/seed-verification-fixtures.ts
$NODE audit/CA-04/local-run.mjs "$NODE" audit/CA-P-TASKS/fixture.mjs
$NODE audit/CA-04/local-run.mjs "$NODE" node_modules/astro/astro.js dev --host 127.0.0.1 --port 4331
$NODE audit/CA-04/local-run.mjs "$NODE" audit/CA-P-TASKS/browser.mjs after
$NODE node_modules/vitest/vitest.mjs run tests/unit/tasks tests/unit/registers tests/unit/ui/register-preferences.test.ts tests/unit/ui/register-surface-contract.test.ts
$NODE node_modules/astro/astro.js check
~/.venvs/graphifyy/bin/graphify update .
git diff --check
```

Local runner allowlists environment and pins localhost:55432/qc_disposable;
no `.env` sourcing, provider credential or production access. All49 migrations
were applied only to this initially empty disposable database. Fixture credentials
remain gitignored in `.tmp/ca04-fixture-env.json` (0600), not in this packet.

Initial browser attempts exposed failed login/no source tables and then an empty
employee dataset. Local schema/foundation/verification seed and one explicit
disposable task fixed the environment; assertions were not removed. Screenshot
review exposed tall whitespace caused by client-inserted presets in the new
grid; full-row advanced/preset layout fixed it and final browser/typecheck reran.
The development toolbar can appear in dev screenshots; this is not release-build
visual evidence. Skills discovery was performed but reading every local SKILL.md
was not completed; relevant frontend-design/graphify/verification instructions
were read. ENGINEERING.md entry point is absent. No complete-protocol compliance,
WCAG certification, UAT or release claim. CA04 PARTIAL did not block local work.

## Remaining

PARTIAL: exact zoom200/400, full keyboard/AT, denied-account existing-record
control, final provider failure and unfiltered empty matrix remain unverified.
No commit/push/deploy/production action was performed. Existing user changes in
Mind and CA-F-02 / CA-P-QUALITY-CAPA-NEW remain untouched except additive task
evidence in Mind. Workspace-map regeneration ran; generated unrelated inventory
changes were removed to respect this task's explicit file scope.
