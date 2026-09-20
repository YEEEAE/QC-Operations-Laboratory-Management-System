# QC-100-FINAL-022 — Build a truthful “My work today” workspace

> Evidence record. Scope: task family 022, phase 1/1. Covered disciplines: Dashboard Design;
> Data-Driven Design (audit domains 37, 41, 64 — **no new scored domain, denominator unchanged at 80**).
> Human acceptance execution is excluded; missing human evidence stays an external dependency.

## 1. Candidate and identity block

| Field | Value |
| --- | --- |
| Base HEAD | `765553ed8580bb74eb3a5da8abf4e6f497c5a9be` |
| Working tree | dirty — 22 changed/added paths as reported by `git status --porcelain` (13 modified, 9 added; two of the added paths are directories) |
| Content fingerprint of the **code** tree as verified (tracked + untracked, sorted, SHA-256 of digests) | `1f107e4ba69ffea2f45770a68d3748deb0cca20eae67ca321c90996d3b85fdbb` |
| Final fingerprint including this report and the Mind update | `acc62e3de868cdb4a218566293e80ebccc125c1dda3f6e7eb1b58a9feb87cdf5` |
| Frozen tree at start | clean, tracked-only fingerprint `e67ed0fc0dc04f4ffabe2390f20c001e2000931226d9ab499f23811d674a39fb` |
| Audit comparison candidate | `653b58d22d4a17994db7376a3bd691ca6e789f1a` (2026-09-19, maturity 45.8%, gates 0/19, NO-GO) |
| Build identity | `pnpm release:identity` → `rel-de99198c47d51e09`, gitSha `765553ed…`, workingTree `dirty`, migrationHead `0031_qc_creation_parity_two_stage_approval` (checksum `44b160a6…`); `pnpm release:verify` → `verified: true` |
| Runtime | Node `v22.22.3`, pnpm `11.25.0` — **outside** the declared contract `>=24.20.0 <25` (pre-existing) |
| Database identity | disposable local PostgreSQL **18.6** (Homebrew, non-container) on `127.0.0.1:55432`, TLS `verify-full` against the task-owned CA; suite database `qc_final022` (created for this task) |
| Migrations | `31/31` applied, `{"status":"ok","migrations":31}` |
| Schema | `{"status":"ok","migrationCount":31,"tableCount":77,"orphanCount":0}` — **no migration and no schema change in this task** |
| Evidence timestamps | unit/integration/typecheck/build/architecture run 2026-09-20 ~05:19–05:24 UTC; live server smoke 2026-09-20T02:27Z |

Prerequisite owners consumed, not rebuilt: **017** (dashboard intelligence / domain-owned read models),
**019** (approved operational starting data), **024** (handoff / queue UX — its handoff queues are a later
phase and are not claimed here). Requirement/authority gaps that could not be created are recorded as
unresolved sources with owners **013/026**.

## 2. Item 1 — approved meanings of assigned / due today / overdue / blocked

**Deliverable:** metric definitions with timezone, ownership, actor scope and source timestamp; no invented
urgency threshold or target.

Single source of truth: `src/modules/dashboard/application/my-work-definitions.ts`
(`MY_WORK_GROUP_DEFINITIONS`), consumed by the read model, the workspace and the tests. No second policy
document was created.

| Group | Membership | Ownership | Actor scope | Clock | Source timestamp | Predicate |
| --- | --- | --- | --- | --- | --- | --- |
| ASSIGNED | Outstanding records whose owning register names your account — or your role — as the holder of the next step | You are the named holder (task assignee; report author it was returned to; work item assigned to you or a role you hold) | Records your account is authorized to read, narrowed to your own holding | UTC | register's own assignment / last-update timestamp | task `current_assignee_id = you AND state NOT IN (COMPLETED, CANCELLED)`; approval actionable work item assigned to you or with a role requirement you hold; inspection/laboratory `author = you AND state = RETURNED` |
| DUE_TODAY | Open work whose due date falls on the current UTC day | Assigned to you | as above | UTC | `tasks.due_at` (time-zone aware) | `due_at >= UTC midnight today AND due_at < UTC midnight tomorrow AND state NOT IN (COMPLETED, CANCELLED)` |
| OVERDUE | Open work whose due date is before the start of the current UTC day | Assigned to you | as above | UTC | `tasks.due_at` | `due_at < UTC midnight today AND state NOT IN (COMPLETED, CANCELLED)` |
| BLOCKED | Records the owning register records as unable to proceed: a task deliberately held, or a receiving item whose scientific result is HOLD | You are the named holder | as above | UTC | register's own holding timestamp | task `state = ON_HOLD` (reason required to hold **and** to resume); receiving `inspection_result = HOLD` |

No threshold, target or service level is defined: the only boundary named is the UTC day itself.
Guarded by `tests/unit/ui/my-work-surface.test.ts` (“invents no threshold, target or service level”).

**Unresolved-source list (deliverable, surfaced in the workspace):** `blocked-reason-text`,
`assignment-history`, `document-review-queue`, `equipment-eligibility-blocks`,
`unassigned-work-in-my-scope`, `reject-report-analytics` — each with the real missing piece and an owner
(013/026, 017-B). None is rendered as an empty group or a zero.

## 3. Item 2 — bounded role-aware queue on domain-owned read models

| Requirement | Implementation |
| --- | --- |
| Domain-owned read models, no duplicate business SQL | `myWorkDependencies()` composes the **same** `dashboardMetricSources()` registry the dashboard already uses; the queue performs **no SQL of its own** and the page contains none (`selectFrom` / `FROM qc.` / `getDatabase` absent — asserted) |
| Reason / next action / responsible role / source link per item | `DashboardMetricSource.queue` adds `category`, `reason`, `nextAction`, `responsibleRole`; the approval source overrides the role from the register's own `assigned_role_requirement` via `roleLabel()` (`src/shared/authorization/scope-description.ts`) |
| Avoid duplicate assignments | Records are claimed once by the most urgent group (`BLOCKED → OVERDUE → DUE_TODAY → ASSIGNED`); a claim is counted as a deferral and stated in the group message. The tasks register reads the single `current_assignee_id` holder pointer, so N `task_assignments` history rows cannot multiply a task |
| A missing source is never zero work | A register the account may not read yields `state = NOT_AUTHORIZED`, `count = null` and no drill-down link; a non-AUTHORIZATION read failure withholds the whole workspace (`ProviderUnavailableState`) |
| Bounded | `MY_WORK_ITEM_LIMIT = 10` per group; the group still publishes the **register's own full total** |
| Role-aware | Items and groups carry `actorScope` and `responsibleRole`; each group is authorized by the register that owns it. `GetMyWorkUseCase` requires an ACTIVE account only, deliberately not `PERM-DASH-*` (`src/modules/dashboard/application/get-my-work.ts`) |

Two genuine gaps closed rather than approximated:

- `tasks-assigned` (“everything assigned to me that is still open”) — the tasks register gained one
  supported server-side filter, `open`, applied in the same place as the existing due windows
  (`src/modules/tasks/ports/repository.ts`, `src/modules/tasks/infrastructure/postgres-repository.ts`).
  Previously a task assigned to you with **no due date was invisible** on every counter.
- `tasks-on-hold` — a register-backed blocked-work counter instead of a free-text “blocked reason” that no
  register stores. The dashboard coverage row for `blocked-reasons` was corrected to say exactly that
  (blocked work readable, free-text reason still not a field).

Dashboard KPI registry grew 8 → 10 by those two counters; the shared registry edit is intentional and the
existing bounds assertion was updated (`8` → `10`), not weakened.

Route and page: `src/pages/work/index.astro`, canonical route `RT-WORK-001 /work` (AUTHENTICATED),
navigation entry **My work today** under the Work group, breadcrumb section for `/work`.

## 4. Item 3 — parity, ordering, scope, time and performance evidence

Environment: PostgreSQL 18.6, `qc_final022`, TLS `verify-full`.

| Claim | Evidence | Result |
| --- | --- | --- |
| Queue/count/register parity **beyond one page** | `tests/integration/dashboard/my-work-parity.test.ts`: 35 open tasks assigned to the actor (> one 25-row register page); group link count == register `total` == rows collected by walking every register page; group list bounded to 10 | **PASS** |
| Stable ordering | two consecutive reads of unchanged data produce identical `item.key` order in every group; exact-tie case ordered by identity | **PASS** |
| Cross-scope denial | another account's identical rows appear in no group and in no count; a tasks-only actor gets `NOT_AUTHORIZED` + `count = null` for `BLOCKED`/`ASSIGNED` with no link into the unreadable registers, while `DUE_TODAY`/`OVERDUE` stay answerable | **PASS** |
| Time boundaries | `due_at` exactly at UTC midnight today is *due today*; one millisecond earlier is *overdue*; next UTC midnight is in neither; register totals agree | **PASS** |
| Duplicate assignments | a task carried by three `task_assignments` rows is listed once, in one group | **PASS** |
| Query count at representative volume | Kysely logging plugin over the real pool: baseline snapshot ≤ 60 statements and **identical** after unrelated growth (8 other-account tasks + 8 closed tasks) | **PASS** |
| Payload at representative volume | rendered read model JSON < 80 KB and unbounded-row growth does not change it | **PASS** |
| No page-local duplicate business SQL | static contract: page has no `selectFrom` / `FROM qc.` / `getDatabase` | **PASS** |

### Regression estate (re-run on the final tree)

| Check | Result |
| --- | --- |
| `pnpm typecheck` | 871 files, **0 errors**, 0 warnings, 74 hints (hints unchanged) |
| `pnpm test:unit` | **100 files / 753 PASS** |
| `pnpm test:integration` (PostgreSQL 18.6, 0 skips) | **101 files / 463 PASS** |
| `pnpm test:architecture` | boundaries PASS; canonical route file coverage and registry integrity PASS |
| `pnpm lint` | PASS (0 errors) |
| `pnpm format:check` | **FAIL — 2 files, both pre-existing at the frozen HEAD** (`src/shared/copy/help-content.ts`, `tests/unit/ui/help-content-contract.test.ts`); every file changed by this task is formatted |
| `pnpm build` | exit 0 |
| `pnpm release:identity` + `release:verify` | `rel-de99198c47d51e09`, `verified: true` |
| `pnpm db:migrate:check` / `db:schema:check` | 31 / 31, 77 tables, 0 orphans |
| Live unauthenticated smoke (`node dist/server/entry.mjs`) | `/work` → **303** `→ /login?returnTo=%2Fwork`; `/login` **200**; `/api/health/live` **200** |
| Live authenticated smoke (disposable bootstrap identity `verify022`) | `POST /login` **302 → /work**; `GET /work` **200**; page renders the four groups, their definitions, register links, the unresolved-source section, `Server snapshot`, and the PASS ≠ RELEASED note; empty groups read “No open record matches this group for your account”, never a fabricated number |

## 5. Requirement → implementation → evidence → unresolved dependency

| Requirement | Implementation | Evidence | Unresolved dependency / owner |
| --- | --- | --- | --- |
| Approved meanings for assigned / due today / overdue / blocked | `my-work-definitions.ts` | `tests/unit/ui/my-work-surface.test.ts`, `tests/unit/dashboard/my-work-queue.test.ts` | free-text blocked reason has no register field → 013/026 |
| Bounded role-aware queue with reason / next action / role / link | `my-work-queue.ts`, `dashboard-sources.ts` `queue` metadata | unit queue suite 11/11; integration parity suite 8/8 | document review queue → 017-B; unassigned-scope work → 013 |
| Missing source ≠ zero | `readMetricSource` + group state | integration “never turns an unreadable register into zero” | — |
| Parity beyond one page | register-owned totals + bounded page | integration parity test 1 | — |
| Stable ordering | `sortItems` severity → timestamp → identity | unit tie test + integration double read | — |
| Time boundaries | `utcDayStart` in the tasks repository | integration boundary test | — |
| Query count / payload bounds | no page SQL; bounded reads | integration bounds test | — |
| Cross-scope denial | per-register authorization | integration scope test | — |

## 6. Status

**Items 1 and 2: DONE** (implementation + technical evidence on the final tree).
**Item 3: DONE locally** (parity, ordering, scope, time, bounds evidenced on PostgreSQL 18.6).

Separate state reporting:

- Implementation work: **DONE** — all three scoped items carry reviewable changes and technical evidence.
- Verification: `PASS` for typecheck, unit, integration, architecture, lint, build, release identity,
  migrations, schema, and the live HTTP smoke (unauthenticated route gate + authenticated render of `/work`).
- `FAIL`: `pnpm format:check` on 2 files that are **pre-existing** at the frozen base HEAD and untouched by
  this task. Owner: 002/027 test-estate follow-up.
- `NOT RUN`: browser interaction matrix, axe/WCAG and screen-reader passes, 320 px / 200 % zoom, keyboard
  and no-JS navigation on `/work` — owners **003** (affected E2E) and **006/040** (accessibility).
- `BLOCKED` (external): human UAT / acceptance sign-off (004) and CI on the exact candidate (billing lock).
- `HISTORICAL`: the 2026-09-19 candidate figures (`653b58d2…`, maturity 45.8 %, gates 0/19) describe a
  different tree and are not evidence for this one.

`PASS ≠ RELEASED`. Production gates remain **0/19**; nothing was committed, pushed, deployed or migrated on
a production database. Scores stay evidence-derived: no external evidence was converted into completion.

### Unresolved sources (owning list, repeated for the final audit)

| Key | Missing piece | Owner |
| --- | --- | --- |
| `blocked-reason-text` | no register field for a blocked reason (audit trail only) | 013/026 |
| `document-review-queue` | no reviewer-scoped review-queue read model | 017-B with documents |
| `equipment-eligibility-blocks` | no materialized eligibility block record | 017-B with assets |
| `unassigned-work-in-my-scope` | registers support “mine” or scope-wide, not “mine or unowned” | 013 |
| `reject-report-analytics` | global aggregate with no actor-scope predicate | 017-B with 013/014 |
| `assignment-history` | only the current holder is a register field (deliberate) | not required; current-holder pointer approved |

## 7. Next phase and required inputs

Next phase: **022-B** — carry the workspace through live browser/AT verification and reconcile evidence.

Required inputs: a trusted-origin authenticated browser context (003) with the six-persona fixture set; the
accessibility verification matrix (006/040); the pre-existing `format:check` estate repair (002/027); final
evidence reconciliation (012). Any change to the queue contract after those runs invalidates the affected
entries above and they must be re-run on the new content fingerprint.
