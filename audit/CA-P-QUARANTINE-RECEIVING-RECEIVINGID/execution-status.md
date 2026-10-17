# CA-P-QUARANTINE-RECEIVING-RECEIVINGID

State: **PARTIAL** — local presentation only; acceptance is not complete.

## Scope and reference

Route: `src/pages/quarantine/receiving/[receivingId].astro`.
CAPA A remains supplied by AppLayout; pinned references are `audit/CA-00/reference/` and CA-01. No shared component, Sidebar, action, schema, API, domain rule, scientific limit or release rule changed. No commit/push/deploy or production access.

## Before / after inventory

| Surface | Before | After |
| --- | --- | --- |
| Identity/version | Existing record heading and version | Framed panel, wrapping identity, tabular version |
| Controlled states | Three independent state cells | Same values/conditions, shrink-safe tracks and phone stacking |
| Facts/evidence | Receiving details includes evidence count/import source | Same data and order; wrapping values. Dedicated evidence section **not implemented** |
| Relations | Linked inspection list | Same links/states, wrapping rows, 44px links |
| History | Existing ordered events | Explicit vertical rhythm and block event metadata |
| Actions | Rail, HOLD/void forms, release/start buttons | Same guards/fields/events; inset rail and form separators |
| Correction | Shared form plus pre-existing hidden legacy correction surface | Both retained; no new editing or transport behavior |
| Responsive | Fixed 320px rail until 820px | Rail stacks at 1100px; fields/links shrink safely |

Source evidence: `source-comparison.json`. Entire frontmatter, markup and page client script are **byte-identical to HEAD**. All changes are appended page-scoped CSS. Sidebar diff is empty.

## State / guard matrix (static inventory, not runtime acceptance)

| Concern | Existing contract retained | Evidence |
| --- | --- | --- |
| READ | Actor required; missing/denied redirects404; unavailable503 | Source inspection; runtime detail NOT RUN |
| READ secondary | Mapping unavailable separate from no mapped template | Source inspection; runtime NOT RUN |
| FORM inspection | canCreateInspection, startable state, no in-flight report, available approved mapping; native POST | Unchanged source; action runtime NOT RUN |
| FORM HOLD | canHold and nonterminal state; required reason; native POST | Unchanged source; action runtime NOT RUN |
| FORM void | canEdit + PENDING; required visible reason | Unchanged source; action runtime NOT RUN |
| FORM correction | canEdit + correctable; shared hidden expectedVersion and intent preserved | Unchanged source; action runtime NOT RUN |
| Action start | READY_FOR_INSPECTION; JS action with record/version | Unchanged source; runtime NOT RUN |
| Action release | canRelease + RELEASE_PENDING; use case checks P05/permission/scope/SoD/version/PASS | Source/use-case unit tests; runtime NOT RUN |
| DIALOG | No route-owned dialog; shared shell command palette remains | No dialog implementation change; runtime NOT RUN |
| FILTER | Register filter N/A; mapped-template search exists and is retained | JS unchanged; runtime NOT RUN |
| EXPORT | N/A — absent | Source |

Inspection Result and Release System State remain separate; PASS is not RELEASED. No new idempotency behavior is asserted: existing request/replay behavior is unchanged.

## Verification

- PASS: supported Node **v24.20.0**; focused receiving release/correction/data contracts + UX writing **44/44**.
- PASS: Astro check **0 errors / 0 warnings**, 128 hints (1120 files).
- PASS: non-style byte comparison and Sidebar diff; `git diff --check`.
- PASS: `graphify update .`; workspace map generator ran.
- Browser attempted via the project's `audit/CA-04/local-run.mjs`, explicit local PG18 TLS URL and isolated credentials; no `.env` sourcing. Employee authentication reached dashboard/register, but discovery returned only `/quarantine/receiving/new`, not a populated detail. `browser-evidence.json` records PARTIAL. This is a fixture/discovery blocker, not a proven absence of all records.
- **NOT RUN:** matched populated-record baseline/candidate, 320/390/768/1024/1440 detail captures, keyboard, axe/contrast, true zoom200/400, forced-colors/reduced-motion detail checks, AT, all reachable action ceremonies/negative accounts, no-JS mutations, integration and full build.
- Discovery found the large project skill library; using-superpowers and better-layout were loaded. Exhaustive reading of every discovered skill and every transitive import was **not completed**; no full-protocol completion claim.

## Existing concerns retained, not fixed

The source contains JS-only start/release controls; native POST does not inspect every Astro callAction error result; void POST does not forward its visible reason; the legacy correction form omits expectedVersion but is hidden by the shared correction component. These are source observations, not new runtime findings. Changing these contracts is outside this presentation-only patch. Shared correction button inverse-color behavior also remains untouched.

Further acceptance needs a populated, authorized local receiving fixture and the matched runtime/action matrix. This patch is not WCAG/UAT/release acceptance.
