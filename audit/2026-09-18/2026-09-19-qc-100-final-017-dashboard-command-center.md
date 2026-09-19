# QC-100-FINAL-017 — Dashboard intelligence & real-data visualization expansion

> Date: 2026-09-19 · Scope: candidate-side source change, local verification only.
> `PASS ≠ RELEASED`: no commit, push, migration, deploy, credential or paid-service change was performed.

## 1. What changed

The dashboard was rebuilt as an operational command center whose every number is a
server read-model row count, whose every drill-down is a supported register filter, and
whose unanswerable questions are stated instead of estimated.

| Area | Change |
| --- | --- |
| Read-model contract | `DashboardMetricDefinition` (numerator / condition / actor scope / window / link) + nullable `value`; new `DashboardFlow`, `DashboardAttention` (reason, age, state, source), `DashboardAttentionSource`, `DashboardCoverageItem`. |
| Decision counts | 7 action counts, each read from the owning module's own use case: approvals, unread notifications, own receiving HOLD, returned inspections, tasks overdue, tasks due today, overdue calibrations. |
| Quarantine flow | 6 stages (Received today → Awaiting inspection → Under inspection → HOLD → PASS not released → Released) projected from `GetQuarantineOverviewUseCase`, i.e. the same read model `/quarantine` renders. |
| Attention queue | Built from the same rows each count counted, with a human reason, an age derived from a real timestamp (`assignedAt` / `updatedAt` / `dueAt` / `notification.createdAt`), the current state and a direct link, ordered by real severity and bounded to 10. |
| Honesty states | A source the account may not read renders “Not available” with no number and no link; any other read failure withholds the whole snapshot; the series keeps `AVAILABLE|EMPTY|UNAVAILABLE|NOT_SUPPLIED` with no points outside `AVAILABLE`; 13 coverage entries state what the snapshot can and cannot answer. |
| Chart declarations | The trend chart now declares source, unit, grain, counts, scope, period, zero policy and freshness next to the plot. |
| Registers | Tasks register gained supported `assignee=mine` and `due=overdue|today` filters with visible chips; the tasks list lost its per-row N+1; the inspections list pushes its state/result/assignee/ownership filters into SQL and batches its related reads. |
| Shared UI | `KpiCard` supports a nullable value with an explicit unavailable message; `StatusBadge` accepts `CRITICAL`/`INFO`; one shared `notificationDestination` mapper now serves the notifications register and the attention queue. |

## 2. Data sources and links (every displayed number)

| Card / stage | Source (server read model) | Link (supported filter) |
| --- | --- | --- |
| Pending review | `approvalsReadDependencies().list` | `/approvals` |
| Unread notifications | `NotificationService.listOwn(actor, true)` | `/notifications?unread=1` |
| My HOLD items | `ListReceivingUseCase({inspectionResult:'HOLD', ownership:'mine'})` | `/quarantine/receiving?inspectionResult=HOLD&ownership=mine` |
| Returned to me | `ListInspectionsUseCase({state:'RETURNED', ownership:'mine'})` | `/quarantine/inspections?state=RETURNED&ownership=mine` |
| Tasks overdue | `ListTasksUseCase({assigneeId, due:'overdue'})` | `/tasks?assignee=mine&due=overdue` |
| Tasks due today | `ListTasksUseCase({assigneeId, due:'today'})` | `/tasks?assignee=mine&due=today` |
| Calibrations overdue | `ListCalibrationsUseCase({state:'OVERDUE'})` | `/assets/calibrations?state=OVERDUE` |
| Quarantine flow stages | `GetQuarantineOverviewUseCase` | the receiving register with that stage's own filter |
| Receiving trend | `GetReceivingTrendUseCase` (approved 14-day UTC series) | `/quarantine/receiving` |

The dashboard no longer issues its own SQL over `qc.receiving_items` / `qc.inspection_reports`
(only the audit activity read remains, using the canonical audit query builder and the
actor's own events).

## 3. Verification (candidate working tree, Node v22.22.3 local — outside the declared 24.20 contract)

| Gate | Command | Result |
| --- | --- | --- |
| Typecheck | `pnpm typecheck` | `817 files / 0 errors / 0 warnings / 68 hints` |
| Unit | `pnpm vitest run tests/unit` | `85 files / 580 PASS` |
| Architecture | `pnpm test:architecture` | PASS (boundaries + route registry) |
| Lint (changed TS) | `npx eslint …` | `0 errors` (`.astro` files are not matched by the ESLint config) |
| Build | `pnpm build` | PASS |
| Integration (disposable PostgreSQL 18.6, TLS, fresh cluster `scripts/db/disposable-postgres.sh`) | `pnpm vitest run tests/integration` | `90 files PASS / 4 files FAIL`, `403 PASS / 3 FAIL / 2 skipped` |
| Changed-area integration | `tests/integration/{dashboard,quarantine,tasks,assets,shared}` | `34 files PASS / 1 FAIL`, `117 PASS / 1 FAIL` |
| Migrations | `pnpm vitest run tests/integration/database` | `8 files / 29 PASS` |

New/updated suites:

- `tests/integration/dashboard/dashboard-rollup.test.ts` (9 PASS) — contract fields, link↔count parity for every card **and** every flow stage (the link's query string is executed against the register it names), personal scoping, attention reason/age/ordering, authorization “not available” without a zero, fail-closed snapshot, series parity, coverage list.
- `tests/integration/dashboard/dashboard-register-bounds.test.ts` (3 PASS) — query-count growth invariance for the tasks due filter, the inspections register and the whole dashboard snapshot.
- `tests/unit/ui/dashboard-decision-surface.test.ts`, `tests/unit/ui/universal-shell.test.ts` — static guards, incl. a new check that every declared drill-down parameter is parsed by the page it targets.

### Pre-existing failures (not caused by this change)

The same four files fail on a fresh cluster and none of them is touched by this diff
(`src/shared/search`, `reporting`, `identity/system-owner-upgrade-parity`,
`system/control-center`); they match the P1 record already in the Project Mind:
`shared/search-scope` (LIKE wildcard row count), `reporting/report-export-parity`,
`identity/system-owner-upgrade-parity` (migration checksum/registry drift),
`system/control-center` (`drift=true`).

The unit suite additionally fails `tests/unit/verification/expected-access-matrix.test.ts`
only when the local ignored `.env` verification passwords are exported into the process
environment (`process.env[name]` must be undefined); with those variables unset the file
passes 6/6. No source in this change reads those variables.

## 4. Before / after measurements

Measured against the disposable PostgreSQL 18.6 cluster with the real read models
(Kysely statement logging; bootstrap-size data, so timings are smoke values only):

| Measurement | Value |
| --- | --- |
| Dashboard snapshot — SQL statements | **8** with approvals/notifications/series injected as zero-query stand-ins (7 counts + the flow's 2 register reads + 1 audit activity read); the composed surface adds those three reads ≈ **11** |
| Dashboard snapshot — growth invariance | constant as unrelated receiving / inspection / task rows are added (guard ceiling 30 statements) |
| Whole dashboard read (real wiring, warm) | 24 ms cold / 2 ms warm on the bootstrap dataset |
| Tasks due filter | 1 statement, 1 ms |
| Inspections register (`state=RETURNED&ownership=mine`, batched loads) | ≤ 12 statements, constant as the table grows, 1 ms |
| Tasks register before | 3 statements **per task** (per-row `get()`: task + checklist + evidence) |
| Inspections register before | 1 + **6 per report** (per-row `load()`) |

Volume/scale timing, browser rendering, Core Web Vitals and production capacity remain
**NOT VERIFIED** (Task 007 owns dashboard performance after these changes).

## 5. Remaining NOT VERIFIED / NOT SUPPLIED data products

Recorded in the surface itself (coverage panel) and here:

- **Laboratory workload** — the laboratory register exposes no server-side state filter or bounded workload read model, so no lab count is presented.
- **Document review queue** — no composed document-review read model is wired to this surface.
- **Blocked reasons** — no composed read model.
- **Reject analytics** — rejected quantity, top items/reasons/departments and daily trend stay off the surface until their SQL/runtime defects close (the live `/reject-reports` 500 and the Render migration gap are environment facts) and an authorized read path defines the scope.
- **Quality record summary** — the quality registers expose no ownership-scoped filter, so a count could not be reconciled with a drill-down link.
- **Owner-only system health** — deliberately kept on `/system/health`; never mixed into the shared dashboard.
- **Authenticated browser / E2E / UAT** — not executed in this host (Docker-only runner); responsive and screen-reader verification of the new flow/attention markup remains open.

## 6. Boundaries respected

No commit, push, merge, deploy, production migration, credential rotation, paid-service
change or external contact. No secret, credential URL or session value was written to
source, fixtures, reports or logs. Authorization, scope/state/version/SoD, idempotency,
immutable audit and `PASS ≠ RELEASED` semantics are unchanged.
