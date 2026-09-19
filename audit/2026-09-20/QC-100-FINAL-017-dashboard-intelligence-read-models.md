# QC-100-FINAL-017 — Dashboard intelligence and operational read models

- **Date:** 2026-09-20 (local) · evidence timestamps in UTC below
- **Candidate (frozen before execution):** `d1827996c6396b1c3b63a9cd2ae2e523fb6d1781` (working tree, uncommitted)
- **Verified-tree fingerprint (diff + porcelain + untracked code/test contents, SHA-256):** `885d1dec0996fb1562a653f64e5497e8133aa0dff62dc4202cb481dfda57ba8e` — every verification run in this record was executed against exactly this content (re-checked identical after the final integration/unit runs).
- **Final tree fingerprint (same recipe, `2026-09-19T23:20:57Z`, now also covering this record and the Mind updates):** `6c35b73a0df22102c601ce19a2119cdf71064561e215477b8a9c8bcf8d99bf9f`
- **State:** PARTIAL — items 1–5 partially complete with evidence; item 6 (Dashboard Intelligence recomputation) BLOCKED on the external evidence owners (003/004/007/011/013/014) and on human/browser execution.
- **Overall evidence:** PASS ≠ RELEASED. Production gates stay 0/19; no commit, push, deploy, or production migration was performed.

## Identity block

| Fact | Value |
| --- | --- |
| Git SHA | `d1827996c6396b1c3b63a9cd2ae2e523fb6d1781` |
| Runtime | Node `v22.22.3`, pnpm `11.25.0` (outside the declared `>=24.20.0 <25` contract) |
| Database | disposable PostgreSQL 18.6, TLS `verify-full` on `127.0.0.1:55432` (`QC_TEST_DATABASE_URL`, `qc_test`) |
| Migration head | `0031_qc_creation_parity_two_stage_approval` (unchanged — this task adds no migration) |
| Build | `pnpm build` exit 0 (`[build] Complete!`) |
| Evidence UTC stamps | typecheck/unit/integration/build runs between `2026-09-19T23:12Z` and `2026-09-19T23:20Z` |

## 1. Panel/KPI/series inventory against approved requirements

Source of truth: `Documents/UI-UX-SPECIFICATION.md` §49 (`T1 Operational Command Center`), §51 (KPI library),
§54 (chart pool), §56–57 (approvals/holds panels), §60 (role-specific priorities), §201 (Dashboard acceptance checklist).

| Required data product (§51/§54) | Delivered on `/dashboard` | Evidence |
| --- | --- | --- |
| My Pending Tasks / Tasks Due Today | KPI `tasks-overdue`, `tasks-due-today` (register-bound, full-population `total`) | `dashboard-rollup.test.ts` parity, `dashboard-register-bounds.test.ts` |
| HOLD Items | KPI `hold-items` (owner-scoped) | `dashboard-rollup.test.ts` |
| Failed/Rejected · Not Released After PASS | quarantine flow stages `hold`, `pass-not-released`, `released` (one predicate per stage) | `dashboard-rollup.test.ts` |
| Pending Approvals | KPI `pending-review` + attention queue | `dashboard-rollup.test.ts` |
| Calibration Due / Overdue | KPI `calibrations-overdue` | `dashboard-rollup.test.ts` |
| **Pending Lab Tests / Lab Tests Under Review** | **KPI `lab-tests-returned`** + bounded laboratory workload read (state + ownership filtering) | `dashboard-lab-workload-bounds.test.ts` (9 PASS) |
| Open Findings / NCR / CAPA | NOT_SUPPLIED — quality registers expose a state filter only, no ownership filter | coverage row `quality-summary` (reason states the exact missing source) |
| Documents Awaiting Approval | NOT_SUPPLIED — documents module exposes identities + version history, no reviewer-scoped review queue | coverage row `document-review` |
| Laboratory Workload chart (§54) | AVAILABLE as a state-filtered, owner-scoped bounded read (not a multi-state chart) | coverage row `laboratory-workload` |
| Reject quantity / top items / by reason / by department / daily trend | NOT_SUPPLIED — the reject analytics read model aggregates globally with no actor-scope predicate and `/reject-reports` is declared `authenticated` (RT-REJ-001), so a global aggregate on a scope-aware dashboard would be an unauthorized aggregate | coverage row `reject-analytics` |
| Blocked reasons (§57 Holds/Exceptions) | NOT_SUPPLIED — no register records a blocked reason as a field; the recorded facts (quarantine HOLD, fail-closed equipment eligibility) are already their own counters | coverage row `blocked-reasons` |
| System health cards | NOT_SUPPLIED by decision — `/system/health` is gated by the system-health read use case (non-owners → 404) | coverage row `system-health` |
| Attention Required (§53) | `Needs your attention` queue: severity band → oldest first, reason + age + state + direct link | `dashboard-rollup.test.ts`, `dashboard-lab-workload-bounds.test.ts` |

Every coverage row now names the exact missing source and an owner instead of a generic sentence; `NOT_SUPPLIED`
remains honest until the source exists.

## 2. Metric contract (numerator, denominator, unit, grain, actor scope, predicates, window, timezone, freshness, drill-down)

`DashboardMetricDefinition` gained `denominator`, `grain`, `timezone: 'UTC'`, `freshness` and `drilldown`
(`src/modules/dashboard/ports/dashboard-query.ts`), and all eight metrics declare them
(`src/modules/dashboard/application/dashboard-sources.ts`). `KpiCard.astro` renders `Of / Grain / Counts /
Condition / Scope / Window (UTC) / Freshness / Drill-down`; `src/pages/dashboard/index.astro` forwards all of them.

Enforced by `tests/unit/ui/dashboard-decision-surface.test.ts` (11 PASS): every metric must carry the fields, the
counts of `denominator`/`grain`/`drilldown`/`freshness`/`timezone` must match, and the card must render them.

## 3. Full-population totals vs bounded attention queues + bounded laboratory read

| Change | Path |
| --- | --- |
| Laboratory register port: `LabListFilter {state, ownership}`, `LabWorkloadRead {total, rows}` | `src/modules/laboratory/ports/repository.ts` |
| Batched hydration (no N+1) + SQL count/page for `list` and `workload` | `src/modules/laboratory/infrastructure/postgres-repository.ts` |
| List use case takes the register filter; new bounded workload use case | `src/modules/laboratory/application/list-lab-tests.ts`, `src/modules/laboratory/application/get-lab-workload.ts` |
| Register page: server-side `state` + `ownership` filters, bounded newest-first page, applied-filter chips, readable floor | `src/pages/laboratory/tests/index.astro` |
| Dashboard wiring (bounded read feeds count + queue from one read) | `src/modules/dashboard/application/dashboard-sources.ts`, `src/modules/dashboard/application/dependencies.ts` |

Defects found and repaired (each reproduced before the fix):

1. **Laboratory register N+1 + unbounded payload.** `PostgresLabRepository.list` issued one `id` scan and then
   called `get()` per row — 1 + 4N statements with a full snapshot/measurement load per row. Now one count plus one
   bounded page plus four batched reads; measured `baseline <= 4` statements for the workload read and
   `<= 8` statements for a 25-row hydrated page, unchanged as the table grows by 12 rows.
2. **Count taken from the displayed page.** The dashboard's laboratory counter previously did not exist; the new
   source returns `{ total, rows }` from one register read, so the card shows 42 (30 + 12 seeded) while the register
   page renders 25 — the exact failure ("count = rows.length of the page") this contract exists to prevent.
3. **Latent policy defect exposed by the authorized workload read.** `PERM-LAB-VIEW` was published as one policy row
   per state, and `getAuthorizationPolicy` returns the *first* matching row, so `authorize()` could only ever see
   `['DRAFT']` and denied every other state as if no policy existed. Repaired in
   `src/shared/authorization/policy-registry.ts` with a single row carrying all eight laboratory states (the shape
   every other permission in the registry already uses).
4. **Denial vs zero, proven.** Without `PERM-LAB-VIEW` the read raises `AUTHZ_PERMISSION_MISSING`; with a `TEAM`
   grant it raises `AUTHZ_SCOPE_DENIED`; the dashboard renders `Not available` (`value: null`,
   `reason: NOT_AUTHORIZED`, no drill-down link) — never `0`. A `VOID` filter with ownership returns
   `{ total: 0, rows: [] }`, a confirmed zero.
5. **Missing timestamp says unknown.** `attentionAgeLabel` returns `Age not recorded` when the row carries no
   anchor timestamp (asserted in the new suite).

New suite: `tests/integration/dashboard/dashboard-lab-workload-bounds.test.ts` — 9 PASS on disposable PostgreSQL 18.6
(TLS), covering page-vs-population, page is the newest-first head of the population, actor/scope isolation
(OWN/GLOBAL/TEAM), denial vs zero, constant query counts, dashboard parity with >1 page, and the unknown-age case.
Every identifier is generated per run because `qc.lab_test_snapshots` is append-only by database trigger.

## 4. Zero / empty / denied / unavailable / stale

| Case | Evidence |
| --- | --- |
| Zero (confirmed empty filter) | `workload({state:'VOID', ownership:'mine'})` → `{total: 0, rows: []}` |
| Empty register page | `list({actor: teamActor})` → `{items: [], total: 0}` with the TEAM-scope denial above |
| Denied (permission missing) | `AUTHZ_PERMISSION_MISSING`, card `null` + `NOT_AUTHORIZED`, no link |
| Denied (scope) | `AUTHZ_SCOPE_DENIED` for the TEAM grant |
| Unavailable (read failure withholds the snapshot) | `dashboard-rollup.test.ts` "withholds the whole snapshot when a source read fails" |
| Series states | `AVAILABLE/EMPTY/UNAVAILABLE/NOT_SUPPLIED` unchanged; only `AVAILABLE` carries points |
| Stale / missing timestamp | `Age not recorded`; the series panel prints the snapshot's `Freshness` |
| No synthesized points or statistical availability | no chart is drawn for any non-`AVAILABLE` state; audit maturity scores are never used as data |

## 5. Role/scope isolation, navigation, failure, performance

- Role/scope isolation: proven at the read model and on the dashboard (OWN/GLOBAL/TEAM + no-permission).
- Navigation: every declared `href` is mapped to the register page that parses each of its query parameters
  (`dashboard-decision-surface.test.ts` "declares only drill-down links whose filters the target register parses"),
  now including `/laboratory/tests?state=RETURNED&ownership=mine`.
- Sorting: workload rows are newest-first by `updated_at` with an `id` tie-break; asserted as a sorted sequence.
- Query counts / N+1: measured through a logging Kysely plugin (workload `<= 4`, hydrated page `<= 8`, both constant
  as the table grows); the dashboard snapshot ceiling of 30 statements is unchanged.
- Payload bounds: the laboratory register is now a 25-row page plus a count; the dashboard laboratory source holds
  25 rows max.
- Mobile layout, browser rendering, and visual verification: **NOT RUN** (no container runtime / browser fixture);
  owned by 005/018 with 003/004.
- Representative volume/EXPLAIN and vitals: delegated to 007 (this task records only the read-model query counts).

## 6. Dashboard Intelligence recomputation

**BLOCKED.** The mapped domains cannot all be evidenced by this phase: a new panel is not evidence for a domain,
and the external owners below have not supplied accepted evidence on this candidate.

## Item-by-item result

| Item | State | Evidence result | Unresolved dependency / owner |
| --- | --- | --- | --- |
| 1. Inventory + complete missing bounded lab workload/state filtering | PARTIAL | lab workload/state/ownership filtering DONE + coverage honesty rewritten; documents/quality/reject/health explicitly withheld with named sources | document review queue, quality ownership filters → 017-B; reject scope decision → 017-B with 013/014 |
| 2. Metric contract definition | DONE | 8 metrics declare numerator/denominator/grain/scope/predicates/window/UTC/freshness/drill-down; enforcement test 11 PASS | none |
| 3. Full-population totals vs bounded queues (>1 page) | DONE | new suite 9 PASS; rollup parity 9 PASS; bounds suite 3 PASS | browser/authenticated E2E → 003/004 |
| 4. Zero/empty/denied/unavailable/stale + unknown timestamps | DONE | table in §4 above | human UAT → 004 (external) |
| 5. Role/scope, navigation, sorting, failure, query counts, payload | PARTIAL | role/scope/navigation/sorting/failure/query-count evidence PASS; mobile + browser + 007 volume NOT RUN | 005/018 (UX), 007 (performance) |
| 6. Dashboard Intelligence recomputation | BLOCKED | requires accepted evidence from its mapped domains | 012/012-B, 003/004/007/011/013/014 |

## Verification runs on the final tree (`885d1dec…`)

```text
typecheck:    853 files / 0 errors / 74 hints
unit:         96 files / 707 PASS
integration:  99 files / 451 PASS (0 skips)
focused:      tests/integration/dashboard + tests/integration/laboratory → 7 files / 35 PASS (3 consecutive runs)
architecture: PASS (boundaries + route/registry integrity)
lint:         0 errors
format:       clean (prettier --check .)
build:        exit 0
```

## Next phase and required inputs

- **017-B:** document review-queue read model (documents module) and quality ownership filters
  (findings/NCR/RCA/CAPA) with their register pages, so both become bounded, reproducible counters.
- Required inputs: 013/014 scope decision for reject analytics; 011 cross-domain read-model parity;
  003/004 browser + authenticated E2E; 007 representative-volume performance; human UAT remains
  an external mandatory dependency and is not fabricated.
