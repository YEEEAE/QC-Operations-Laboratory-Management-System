# QC-100-FINAL-007 — Performance, Capacity & Operational Monitoring Evidence

**Date:** 2026-09-19 (Asia/Riyadh)
**State:** PARTIAL — reproducible measurements DONE on an isolated disposable
environment; provider alerts, session-valid long-task INP/CLS, write-path load,
and any production-capacity claim remain OPEN (NOT VERIFIED / NOT RUN).

## 0. Frozen candidate & environment (exact)

| Item | Value |
|---|---|
| Source candidate | `daf513ea3f2620f88cee1041bb8cf4ca04273fde` (branch `main`) |
| Working tree | clean except untracked `scripts/performance/` (this task's harness) and pre-existing `block_pdf_image_read.py` |
| Built artifact | `dist/` rebuilt from this candidate 2026-09-19 pre-measurement (`dist/server/entry.mjs` present); release identity `rel-85e7b5f5428083e4` / `local-daf513ea3f26`, migration head `0030_reject_reports_role_parity`, `dirty:true` (untracked `scripts/performance/` harness only), `dist/release-identity.json` |
| Database | disposable local PostgreSQL `18.6 (Homebrew)` on `localhost:55432`, database `qc_disposable` |
| Migration head | `0030` (`0030_reject_reports_role_parity`), 0 pending |
| Runtime | Node `v24.20.0` + pnpm `11.25.0` (matches engines contract `>=24.20.0 <25`) |
| Server | built `dist/server/entry.mjs`, `NODE_ENV=development`, `PORT=4321`, disposable `SESSION_SECRET`, `SERVICE_VERSION=qc-perf-daf513ea3f26` |
| Measurement identity | disposable `perf-measure` (MANAGER + TEAM scope), generated password, never logged |
| Prior audit baseline | `298e307721af97d9c1bd22279d0c784fbf5b62a8` (2026-09-18) — historical input only, not proof |

`NODE_ENV=development` was required so the production canonical-host guard
(`qclevel.top` 308 redirect) does not mask page timings; the only deviation
from production is transport/host canonicalization, recorded here explicitly.
The `__Host-qc_session` Secure cookie semantics are unchanged.

## 1. Representative synthetic dataset (recorded size & distribution)

Seeder: `scripts/performance/seed-synthetic-dataset.ts` (deterministic RNG seed
`20260919`, idempotent, `PERF-`/`perf-` prefixed, disposable-cluster guards).
Re-seeded for this candidate 2026-09-19T04:01:59Z; verified `PERF-`-prefixed rows:

| Table | PERF- rows |
|---|---|
| `users` | 25 (24 synthetic across ADMIN/MANAGER/SUPERVISOR/EMPLOYEE + `perf-measure`) |
| `tasks` | 3000 |
| `receiving_items` | 8000 |
| `inspection_reports` | 2500 |
| `lab_tests` | 1800 |
| `reject_reports` | 1200 (900 daily + 300 issue slips) |
| `notifications` | 2500 |
| `audit_events` (synthetic actor) | 12000 |
| `outbox_events` | 1200 |

Plus equipment (80), calibrations (240), findings (400), NCRs (250), CAPAs
(120), approval cases (400), documents (250 identities × 2 versions); 120-day
spread. Machine manifest: `.tmp/perf007-reseed.json` (gitignored scratch).

Table sizes (data+indexes+TOAST): `receiving_items` 9408 kB, `audit_events`
5584 kB, `tasks` 2840 kB, `inspection_reports` 2792 kB, `lab_tests` 1672 kB,
`notifications` 1600 kB, `reject_reports` 1016 kB.

## 2. EXPLAIN (ANALYZE, BUFFERS) — critical reads

Harness: `scripts/performance/explain-critical-reads.mjs`.
Machine output: `.tmp/perf007-explain.json`. All buffers shared-hit (warm).

| # | Statement | Plan (top) | Rows | Time | Buffers (hit/read) | Reading |
|---|---|---|---|---|---|---|
| 1 | dashboard audit timeline (actor-scoped, LIMIT 8) | Limit → Index Scan (0029 `actor_time` family) | 8 | 3.7 ms | 10/0 | PASS — bounded, indexed |
| 2 | tasks full-scope list (page shape) | Sort → **Seq Scan** `tasks` | 3000 | 3.9 ms | 172/0 | RISK — unbounded; no `(updated_at,id)` list index; page renders all rows (§3) |
| 3 | tasks checklist batch (`IN` 3000 ids) | Nested Loop | 0 (no checklist fixtures) | 1.4 ms | 3/0 | PASS shape — batched, not N+1; content volume untested |
| 4 | receiving register scan (8000) | Sort → **Seq Scan** `receiving_items` | 8000 | 29.7 ms | 452/0 | RISK — full-register scan+sort on the quarantine source path |
| 5 | inspection review queue (`state`, LIMIT 50) | Limit → Sort → scan | 50 | 6.2 ms | 61/0 | PARTIAL — bounded output, sort not index-served |
| 6 | lab workload (`state IN`, LIMIT 50) | Limit → Sort → scan | 50 | 1.8 ms | 80/0 | PARTIAL — same note as 5 |
| 7 | reject register (LIMIT 50) | Limit → Sort → scan | 50 | 1.0 ms | 52/0 | PARTIAL — page itself renders 1200 rows (~100 KB, §3) |
| 8 | notifications queue (`dedupe_key LIKE 'PERF-%'`, LIMIT 50) | Limit → Sort → scan | 50 | 9.4 ms | 142/0 | PARTIAL — leading-wildcard predicate cannot use btree |
| 9 | outbox relation probe | Result | 1 | 0.8 ms | 2/0 | informational |

Indexes present: 250 total in `qc`; 123 match the composite `idx_*__*`
convention; 9 created by migration 0029 (tasks assignee/state, receiving
creator/date+filters, inspection/lab author/state, audit actor/time, active
user grants).

N+1 status: list pages use one batched query per relation
(`ListTasksUseCase` → base + checklist + evidence = 3 queries for the whole
page), not per-row queries. Dashboard/quarantine counters share one register
source; no duplicate dashboard SQL observed. **No targeted code changes were
made**: every critical read completes in <30 ms server-side at this scale, so
an index change would be optimization without a measured bottleneck.
Pagination bounds remain the open item (§6).

## 3. Page timings — TTFB/FCP/LCP/CLS/bytes (authenticated, session-valid)

Harness: `scripts/performance/login-and-capture.mjs` (real Chromium form login
as `perf-measure`; cold = fresh page, warm = revisit).
Machine output: `.tmp/perf007-vitals.json` (2026-09-19T04:14:12Z).
Server render time is inside TTFB (SSR; no client hydration framework).

| Route | TTFB cold/warm | FCP cold/warm | LCP cold/warm | CLS | Transfer | Document transfer/decoded |
|---|---|---|---|---|---|---|
| `/dashboard` | 30/19 ms | 108/60 | 108/60 | 0/0 | 44.5 KB | 51.1/50.8 KB |
| `/tasks` | 149/148 ms | 360/256 | 360/256 | 0/0 | 30.1 KB | **1259.8/1259.5 KB** |
| `/quarantine` | 7/11 ms | 72/84 | 72/84 | 0/0 | 36.6 KB | 27.3/27.0 KB |
| `/reject-reports` | 65/56 ms | 160/136 | 160/136 | 0/0 | 32.7 KB | 100.8/100.5 KB |
| `/reports` | 10/17 ms | 80/56 | 80/56 | 0/0 | 27.3 KB | 27.2/26.9 KB |
| `/laboratory` | 242/235 ms | 320/268 | 320/268 | 0/0 | 29.0 KB | 26.9/26.6 KB |
| `/notifications` | 7/19 ms | 76/52 | 76/52 | 0/0 | 29.8 KB | 27.1/26.8 KB |
| `/audit` | 42/22 ms | 124/60 | 124/60 | 0/0 | 29.2 KB | 47.6/47.3 KB |

JS/WASM per page: ~2.9 KB transferred / ~2.6 KB decoded JS, 0 B WASM on every
route (enhancement scripts only, no framework hydration).

INP: no qualifying input-delay events (≥16 ms) fired during scripted loads
and no synthetic interaction was injected, so session-valid INP under real
interaction is **NOT VERIFIED**. CLS = 0 on all routes in both phases (PASS
within this load-only scope).

HTTP smoke (5 samples + 1 warmup, session cookie;
machine output `.tmp/perf007-smoke.json`, 2026-09-19T04:16:26Z):

| Path | Status | TTFB p50/p95 | Total p50/p95 | Bytes |
|---|---|---|---|---|
| `/dashboard` | 200 | 8.7/13.6 ms | 8.8/14.6 ms | 50771 |
| `/tasks` | 200 | 113.5/131.7 ms | 122.6/135.0 ms | 1259536 |
| `/quarantine` | 200 | 4.2/4.4 ms | 4.2/4.5 ms | 27013 |
| `/reject-reports` | 200 | 16.8/21.2 ms | 17.0/21.3 ms | 100508 |
| `/reports` | 200 | 4.0/7.6 ms | 4.1/7.7 ms | 26867 |
| `/laboratory` | 200 | 161.2/168.4 ms | 161.3/168.5 ms | 26643 |
| `/notifications` | 200 | 3.6/3.6 ms | 3.6/3.6 ms | 26770 |
| `/audit` | 200 | 5.8/6.8 ms | 5.9/6.9 ms | 47349 |
| `/tasks?state=OPEN` | 200 | 35.6/39.2 ms | 36.0/39.5 ms | 376708 |
| `/approvals` | 200 | 4.4/4.7 ms | 4.5/4.8 ms | 26640 |
| `/search?q=PERF` | 200 | 8.9/11.5 ms | 9.0/11.6 ms | 27106 |

Readings: `/tasks` unfiltered renders all 3000 rows inline (1.26 MB HTML —
the single largest transfer; matches QC-CLOSURE-014's "task list remains
unbounded"). `/laboratory` is the slowest TTFB (~161 ms warm) at only 26 KB,
so its cost is server compute/queries, not bytes — first candidate for query
tracing when budgets tighten. `/reject-reports` ships 1200 rows (~100 KB).

## 4. Concurrency, pool, rate limits, contention, outbox, dependencies

- **Approved read concurrency** (`scripts/performance/concurrency-probe.mjs`,
  machine output `.tmp/perf007-concurrency.json`; mixed `/dashboard` +
  `/tasks?state=OPEN`, 40 requests/rung):

| Concurrency | Statuses | p50 | p95 | max | App backends observed |
|---|---|---|---|---|---|
| 1 | 40×200 | 25.5 ms | 38.9 ms | 95.1 ms | 5 |
| 4 | 40×200 | 68.4 ms | 127.7 ms | 135.0 ms | 11 |
| 8 | 40×200 | 115.3 ms | 175.4 ms | 198.8 ms | 11 |
| 16 | 40×200 | 243.6 ms | 315.9 ms | 332.9 ms | 11 |
| 24 | 40×200 | 353.0 ms | 537.5 ms | 600.3 ms | 11 |

No 5xx/429 at any rung; 200/200 requests succeeded. Latency grows ~linearly
past c=8 — the signature of the single shared pool (node-postgres default
max 10 via `getPool()`, no explicit max configured) saturating on the
heavier `/tasks?state=OPEN` leg. **Tested capacity limit on this host: 24
concurrent readers, p95 ≈ 538 ms, zero errors**; degradation mode observed is
latency, not errors. Dashboard-only re-runs at c=8/16: p95 41.9/54.0 ms.

- **Pool limits:** default pool (`max` 10, one shared `Pool` per process —
  `src/shared/database/pool.ts`). Pool-exhaustion behavior was not forced; no
  pool timeout observed.
- **Rate limits:** login policy unresolved in development (env unset → no
  limit; 12 sequential bad-password attempts → 12×400, 0 throttled).
  Mechanism verified in-process with `LOGIN max=5/window=60s` against the
  disposable DB: 5×ALLOWED then THROTTLED (`PostgresRateLimitStore` +
  `RateLimiter`; 1 `rate_limit_windows` row). Production values deferred
  (PRD-DD-004/005), not set here.
- **Transaction contention / idempotency:** `tests/integration/concurrency`
  12/12 PASS against the disposable DB in this run (`controlled-mutations` 6
  + `idempotency` 6).
- **Outbox pressure:** `qc.outbox_events` held 1 pending `RECEIVING_CHANGED`
  event; `scripts/workers/outbox.ts` drained it (pending 1→0,
  `processed_at` set). No dead-letter table; retry is `markRetry`
  (`available_at = now()+30s`, `attempt_count+1`). A 1200-event pressure
  drain was NOT RUN.
- **Dependency failures:** `/api/health/live` + `/api/health/ready` → 200
  healthy with DB up. DB-down 503 shape proven by QC-CLOSURE-014
  (HISTORICAL — not re-run; the cluster had to stay up). AI probe reports
  `UNAVAILABLE` with core readiness unaffected by design; no AI keys
  configured, no live provider call made.

## 5. Operational monitoring — logs, correlation, metrics, alerts

- **Structured logs:** pino JSON with `service_name`, `service_version`,
  `environment`, `event`, `request_id`, `trace_id`, `route_template`,
  `http_method`, `status_class`, `duration_ms` (`.tmp/perf007-server.log`,
  521 `http.request` events). Normal responses carry `x-request-id`.
- **Correlation:** `auth.login.success` (11) and `auth.login.failure` (6, all
  expected invalid-credential outcomes from the pre-fix credential mismatch)
  carry the originating `requestId`; middleware rows carry
  `request_id`+`trace_id`. PASS.
- **Secret scan:** `password|secret|token=` matches in the server log: **0**;
  vitals/smoke/explain/concurrency outputs contain no cookie, hash, URL
  credential, or password. PASS (cookie/credential files 0600, gitignored).
- **Metrics export:** counters/histograms exist at the seam
  (`qc_db_queries_total`, `qc_rate_limit_denials_total`,
  `qc_outbox_events_total`) but default providers are **no-op**; no
  `/metrics` endpoint, OTLP unset. Export liveness NOT VERIFIED.
- **Alert delivery:** no webhook/pager/email integration in source;
  OBSERVABILITY-ARCHITECTURE §40/59/63 defines alert *logic* but exact
  thresholds are deferred (PRD-DD-004/005). Delivery NOT RUN / OPEN.
- **Health/readiness:** live+ready healthy with DB; release-identity 401
  anonymously (fail-closed, PASS); `/system/health` + `/system/control-center`
  303→login for the non-owner session (owner gate intact, PASS). Owner
  control-center render NOT RUN (requires named `yazeed`/SYSTEM_OWNER).

## 6. Budgets (proposed from measured baseline — NOT approved SLOs)

PRD-DD-004/005 reserve exact SLOs/thresholds as deferred decisions; nothing
below is an approved gate. All values are disposable-host-local (single
process, warm buffers) and must be re-baselined per environment.

| Budget | Proposed value | Basis |
|---|---|---|
| Typical register page TTFB p95 | ≤ 100 ms | measured 4–43 ms except `/tasks`, `/laboratory` |
| `/tasks` unfiltered TTFB p95 | ≤ 150 ms **after** bounding the page (now 132 ms at 3000 rows — ~zero headroom) | §3 |
| `/laboratory` TTFB p95 | ≤ 200 ms (now 168 ms; trace server cost) | §3 |
| List-page document transfer | ≤ 300 KB (`/tasks` 1.26 MB — **over**) | §3 |
| LCP p95 | ≤ 500 ms (measured ≤ 360 ms) | §3 |
| CLS | 0 (measured 0 everywhere) | §3 |
| Session-valid INP | budget pending scripted-interaction measurement | §3 open |
| Read concurrency | 24 concurrent readers, p95 ≤ 600 ms, 0 errors | §4 |
| Critical-read SQL | ≤ 50 ms each (measured ≤ 30 ms) | §2 |
| Outbox drain | single-batch verified; pressure benchmark pending | §4 open |
| Login rate limit (production) | values pending PRD-DD-005; mechanism verified 5/60s→throttle | §4 |

Follow-ups (not done here — no performance code changed, so no revalidation
debt was created): bound `/tasks` (+ quarantine-aging report) pagination; add
a `(updated_at,id)`-serving list index or keyset pagination; trace
`/laboratory` server cost; script INP interactions; run a 1200-event outbox
pressure drain; configure OTLP export + `/metrics`; define PRD-DD-004/005 and
prove provider alert delivery.

## 7. Acceptance & handoff

- **Task state: PARTIAL.** Reproducible measurements, tested read-capacity
  limit, proposed budgets, and failure-mode behavior are published.
  **Open:** provider alert delivery, metrics export liveness, session-valid
  INP under interaction, write-path load, outbox pressure drain,
  pool-exhaustion forcing, owner control-center render, any production/Render
  capacity claim.
- **Evidence:** dataset seed PASS; EXPLAIN PASS; web-vitals PASS (INP NOT
  RUN); HTTP smoke PASS; read-concurrency PASS to c=24; concurrency suite
  12/12 PASS; rate-limit mechanism PASS / production values NOT RUN; outbox
  single-drain PASS / pressure NOT RUN; logs + correlation + secret scan
  PASS; health/readiness PASS (DB-down shape HISTORICAL); metrics export NOT
  VERIFIED; alert delivery NOT RUN; DB-down re-probe NOT RUN (deliberate).
- **Changes (local, uncommitted):** new harness
  `scripts/performance/{login-and-capture,explain-critical-reads,
  concurrency-probe,rate-limit-probe}.mjs` (untracked); pre-existing
  `seed-synthetic-dataset.ts` reused as-is; this audit report; disposable-only
  `perf-measure` credential rotation (DB row, not source). No source,
  migration, policy, paid-service, commit, push, or deploy change.
- **Commands & counts:** reseed 1 (25/3000/8000/2500/1800/1200/2500/12000
  PERF- rows verified); EXPLAIN 9 statements; vitals 8 routes × cold/warm;
  smoke 11 paths × 5 samples; concurrency 5 rungs × 40 req; load profiles 6
  runs; rate-limit 12-attempt probe + 7-step store check; outbox drain 1;
  concurrency suite 12/12 PASS; secret scan 0 hits over ~530 log events.
- **Redacted evidence (all `.tmp/`, gitignored):** `perf007-reseed.json`,
  `perf007-explain.json`, `perf007-vitals.json`, `perf007-smoke.json`,
  `perf007-concurrency.json`, `perf007-load-*.json`, `perf007-server.log`.
  `perf007-cookie.txt` / `perf-credentials.json` (0600) excluded everywhere.
- **Downstream:** 014 owns the §6 pagination/index follow-ups; 011/005
  queries+UI reused unchanged; 003 fixtures reused; release-governance must
  treat §6 as *proposed*, never approved SLOs. No other task marked complete.

