# QC-100-FINAL-005 (follow-up) — Quarantine KPI alignment + approved trend series

- **Task:** `Align quarantine KPIs` → `Add approved trend series`
- **Candidate:** `4b559a60ca7169b6f98b6c33aedc056684cfab71` (`update site`, the commit landing the previous
  QC-100-FINAL-005 dashboard repair) **plus the uncommitted working tree of this task**.
- **Environment:** macOS host; Node `24.20.0` + pnpm `11.25.0` (declared contract);
  disposable PostgreSQL 18.6 (`scripts/db/disposable-postgres.sh`, TLS, throwaway local CA,
  `qc_test` / `qc_owner` on `127.0.0.1:55432`), one cluster reused across suites.
  No production contact, no provider call, no `git commit`/`push`/`deploy`.
- **Date:** 2026-09-19.

## 1. Problem being repaired

The previous task recorded this as a residual, owned by the Quarantine domain, not fixed silently:

> `/quarantine` counters used their own `created_by = actor` SQL while linking to authorized-scope
> registers, and "Awaiting inspection" counted two workflow states behind a single link.

The dashboard separately declared "Not supplied: … trend series", so no chart existed on any surface.

## 2. What changed

### 2.1 One register projection feeds every Quarantine counter (`/quarantine`)

`GetQuarantineOverviewUseCase` no longer owns counting SQL. It projects the **same register the
drill-downs open** through a `ReceivingOverviewSource` port, so counter ⇄ link agreement holds by
construction instead of by two hand-kept predicates:

- actor scope claim now matches the numerator: **"Your authorized scope — every creator you are
  allowed to read"** (the register's own `actorHasScope` set), not a personal `created_by` count;
- "Awaiting inspection" (two states, one link) is replaced by two counters, each with a link that
  reproduces it: `Pending` → `?state=PENDING`, `Ready for inspection` → `?state=READY_FOR_INSPECTION`;
- the compound HOLD counter is split: `Receiving HOLD` → `?state=HOLD`, `Inspection HOLD` →
  `?inspectionResult=HOLD` (a `workflow_state = 'HOLD' OR inspection_result = 'HOLD'` counter cannot
  honestly link to a single-state register view);
- `Received today` gained a **supported** time-window filter at the owning boundary
  (`?receivedOn=today` → exact `receiving_date` comparison in PostgreSQL, resolved once from the UTC
  server date by `ListReceivingUseCase`), replacing a link that showed the whole register;
- every counter now carries `numerator` / `state` / `actorScope` / `timeRange` / `source` /
  `drilldownLabel` and is rendered through the shared `KpiCard` decision-surface component.

The page also stopped converting failures into an empty surface: a denied account
(`AUTHORIZATION`) and an unavailable provider are now separate, named states, and neither renders an
empty KPI row.

### 2.2 Approved receiving trend series (dashboard)

New server-side series in the **owning module** (`src/modules/quarantine/application/get-receiving-trend.ts`
+ `PostgresQuarantineReadModel.getReceivingTrend`) with the grain/numerator/unit/window/zero policy
declared in the contract, not invented by the consumer:

- **grain:** one calendar day of `receiving_date` (UTC), ascending — the day string is produced by
  PostgreSQL (`receiving_date::text`), so no JavaScript time-zone conversion can shift a point;
- **numerator:** receiving items the actor may read, on that day (optionally narrowed to records the
  actor created); **unit:** records counted, never a summed/converted quantity;
- **window:** fixed trailing 14 days ending on the current UTC server date, every day present;
- **zero policy:** a day with no receiving records is a real count of zero — it is never missing data;
- rows are scope-checked with the same evaluator the register uses.

The dashboard consumes it through a `DashboardSeriesProvider` port and the owning module's
application contract (no dashboard SQL over another domain's tables). The series carries four
explicit states and **only `AVAILABLE` carries points**:

| state | meaning | rendering |
| --- | --- | --- |
| `AVAILABLE` | supplied, readable, at least one record | `Chart` with the accessible data table + grain/numerator/scope/window/zero metadata |
| `EMPTY` | supplied and readable, every day genuinely zero | no chart; "this is a real zero, not missing data" |
| `UNAVAILABLE` | supplied series could not be read | no chart, explicit message, no zero |
| `NOT_SUPPLIED` | no supplied series for this scope (incl. not authorized) | no chart, explicit message, no zero |

Actor scope is declared per surface: the dashboard chart is narrowed to **records you created**
(so it matches the personal KPIs beside it), while the same series can be read for the authorized
scope. The dashboard "Data coverage" panel no longer claims a trend is missing outright.

## 3. Evidence

### Static / unit

| Gate | Command | Result |
| --- | --- | --- |
| typecheck (`astro check` + tsc, validates the new `.astro` props) | `pnpm typecheck` | **813 files / 0 errors** (67 pre-existing hints) |
| unit | `pnpm test:unit` | **85 files / 579 PASS** |
| architecture + route registry | `pnpm test:architecture` | **PASS** |
| focused eslint on every touched path | `npx eslint src/modules/quarantine src/modules/dashboard tests/integration/{quarantine,dashboard} tests/unit/ui` | **0 errors** (1 "file ignored" warning for `Chart.astro`, no matching ESLint config) |
| prettier | `npx prettier --write <touched ts paths>` | applied; `.astro` has no Prettier parser in this project (pre-existing) |

New static guardrail: `tests/unit/ui/quarantine-decision-surface.test.ts` fails if a counter is ever
labelled with another actor's scope, if a counter regains its own counting predicate, or if a
drill-down link carries a parameter the register does not implement.
`tests/unit/ui/dashboard-decision-surface.test.ts` now also pins the series contract, the four states
and the rule that only `AVAILABLE` carries points.

### PostgreSQL 18.6 (disposable cluster, TLS)

| Suite | Result |
| --- | --- |
| `tests/integration/quarantine/overview-parity.test.ts` (**new**) | **6/6 PASS** |
| `tests/integration/quarantine/read-models.test.ts` (updated) | **7/7 PASS** |
| `tests/integration/dashboard/` (rollup + query) | **10/10 PASS** |
| `tests/integration/shared/audit-dashboard-parity.test.ts` | **9/9 PASS** |
| `pnpm test:migrations` | **8 files / 29 PASS** |
| `pnpm test:concurrency` | **2 files / 12 PASS** |

The new suite executes the **real register** for every counter's own `href` on a populated schema
(two creators, eight states) and requires an exact match — the check the audit's acceptance clause
asks for, made executable. It also proves:

- the counter ⇄ link fix is real: `Released` counts both creators' rows (2), and both appear in the
  linked register (a `created_by` counter would have hidden one);
- `PASS / not released` stays separate from the release system state;
- the trend's last point equals the register's own `today` count, and the whole 14-day window equals
  the register's authorized row count; the `ownership: 'mine'` variant equals the actor's own rows
  and never leaks another creator.

### Deliberately not claimed

- **`pnpm build` was not run for this candidate.** `.astro` prop/type integrity is covered by
  `astro check` (0 errors), not by an emitted build.
- **No browser run.** Everything above is local and server-side; the dashboard chart and the aligned
  `/quarantine` counters were not re-observed in an authenticated browser for this candidate.
- **No deployment, migration or provider action** was performed anywhere.

## 4. Pre-existing failures found (not caused by this change)

A full `pnpm test:integration` run on a **freshly provisioned** cluster reports **4–5 failing files**
that this task did not touch:

```
FAIL tests/integration/identity/system-owner-upgrade-parity.test.ts
     Error: Migration checksum mismatch for version 0030.
FAIL tests/integration/system/control-center.test.ts        (migration.drift === true)
FAIL tests/integration/reporting/report-export-parity.test.ts (row-count expectation)
FAIL tests/integration/shared/search-scope.test.ts           (LIKE-wildcard row count)
FAIL tests/integration/shared/notification-outbox-delivery.test.ts (dedupe claim, intermittent)
```

Root cause of the first two (traced, not guessed): the shared external-cluster path runs every
integration file against **one** database with `fileParallelism: false`, so whichever suite migrates
first applies `0030`. `system-owner-upgrade-parity` then registers the same database as
`migrations.filter((m) => m.version !== '0030')`, and `verifyMigrationIntegrity` throws for an applied
row absent from the supplied list — i.e. the suite requires a virgin database. The remaining row-count
suites are order/state dependent on the same shared cluster.

**Isolation proof that this is not a regression from this task:** with the new suite excluded and on a
fresh cluster, the same files fail (`5 failed | 88 passed`, 93 files). All five belong to the
QC-100-FINAL-016 remediation's test/migration design (migration `0030` + the upgrade-parity suite),
which has not had a clean full integration run since; prior recorded integration numbers predate it.

Action taken: **none** — repairing another task's migration-ledger test design is outside this scope
and would silently rewrite unrelated contracts. Recorded here and in the Mind as an open issue.

## 5. Files

Changed: `src/modules/quarantine/application/get-quarantine-overview.ts`,
`src/modules/quarantine/application/dependencies.ts`,
`src/modules/quarantine/infrastructure/postgres-quarantine-read-model.ts`,
`src/modules/quarantine/receiving/{ports/repository.ts,application/list-receiving.ts,infrastructure/postgres-repository.ts}`,
`src/modules/dashboard/{ports/dashboard-query.ts,application/dependencies.ts,infrastructure/postgres-dashboard-query.ts}`,
`src/pages/quarantine/index.astro`, `src/pages/quarantine/receiving/index.astro`,
`src/pages/dashboard/index.astro`, `src/ui/charts/Chart.astro`.
New: `src/modules/quarantine/application/get-receiving-trend.ts`,
`src/modules/dashboard/application/dashboard-series.ts`,
`tests/integration/quarantine/overview-parity.test.ts`,
`tests/unit/ui/quarantine-decision-surface.test.ts`.
Tests updated for the changed contracts: `tests/integration/quarantine/read-models.test.ts`,
`tests/integration/dashboard/{dashboard-rollup,dashboard-query}.test.ts`,
`tests/integration/shared/audit-dashboard-parity.test.ts`,
`tests/unit/ui/{dashboard-decision-surface,universal-shell}.test.ts`.

`PASS ≠ RELEASED`: none of the above is a deployment, UAT, accessibility or performance claim.
