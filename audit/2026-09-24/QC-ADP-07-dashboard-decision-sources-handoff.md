# QC-ADP-07 — Dashboard decision sources handoff

**Status: PARTIAL / NO-GO.** Source implementation now supplies a bounded document-review queue to the dashboard and `/work`; exact candidate PostgreSQL parity, role E2E, performance, live schema/role, and screenshots remain unverified or blocked. Quality ownership, free-text blocked reasons, and reject analytics remain withheld pending the decisions below. No commit, push, deployment, or live migration was performed.

## Candidate identity and evidence

- Repository `HEAD`: `c14369a7c524f07ebe8ba19e3c93c607e97010f8` (changes are uncommitted).
- Runtime used for local unit/Astro checks: Node `24.20.0`; pnpm `11.25.0` was not available through Corepack because registry DNS was unavailable.
- Source migration head: `0041_document_review_queue_indexes` (new candidate migration). Previously recorded provider applied head `0018` is historical only; current applied head and schema parity are **NOT VERIFIED**. No database role was queried; role/grant parity is **NOT VERIFIED**.
- Unit/UI/dashboard focused suite: **20/20 PASS**.
- Astro check: **0 errors, 0 warnings, 89 hints** (hints are not represented as zero).
- `git diff --check`: **PASS**.
- PostgreSQL integration `tests/integration/documents/review-queue.test.ts`: **BLOCKED** before test setup — Testcontainers found no working container runtime. No PG parity or query-plan/performance result is claimed.
- Role E2E/live screenshots: **NOT RUN**; no authorized live candidate was available.

## Root cause and source disposition

1. **Document review queue — implemented on source candidate; runtime verification blocked.** The old document-list path applied filtering in memory and loaded versions N+1. New `ListDocumentReviewQueueUseCase` requires both `PERM-DOC-REVIEW` and `PERM-APR-REVIEW`, rejects inactive actors and unsupported named scopes, and caps page size at 100. `PostgresDocumentReviewQueueQuery` joins active identities to `IN_REVIEW` versions, excludes self-authored versions, and applies the same actor/scope predicate before both the window total and bounded page. The dashboard queue and `/documents?review=mine` use this source. Migration 0041 adds partial indexes for review-state ordering and active owner/creator lookup. PG18 parity, query plan, and exact register equality remain **BLOCKED** until the exact candidate runs with PostgreSQL.
2. **Quality ownership filters — still blocked.** Findings/NCR/CAPA reads use `owner_id = actor.id OR created_by = actor.id`; RCA uses creator. The domains do not share one approved membership/state contract, and several registers are placeholders. No cross-domain count was introduced. Owner must approve membership, states, and visibility per domain before code can safely align KPI and register filters.
3. **Blocked reason — still blocked by source/data decision.** Task free text exists in immutable transition audit data, not as a queue field. No text is extracted or exposed as a dashboard reason. A structured queue reason source and access/retention policy require approval.
4. **Reject analytics — still blocked by scope decision.** Existing aggregate is global and `/reject-reports` is authenticated rather than permission-bound. No reject count, ratio, or trend is published. Scope, permitted roles, time basis, measure grain, and denominator require owner approval.
5. **Quality percentages — not defined.** No measure, denominator, or weights were approved; no percentage is created.

## Route acceptance denominator and results

Six checks apply to each route: (1) all KPI source/question/grain/time/scope; (2) exact count equals linked register for same actor; (3) denied and unavailable states never leak counts or become zero; (4) document queue bounded/indexed/authorized with same count-page predicate; (5) quality ownership matches domain registers; (6) blocked/reject sources are truthful and do not expose unsupported measures.

| Route | Denominator | PASS | FAIL | BLOCKED | NOT VERIFIED | Closure |
|---|---:|---:|---:|---:|---:|---:|
| `/dashboard` (`RT-DASH-001`) | 6 | 0 | 0 | 3 | 3 | 0/6 (0%) |
| `/work` (`RT-WORK-001`) | 6 | 0 | 0 | 3 | 3 | 0/6 (0%) |
| **Total** | **12** | **0** | **0** | **6** | **6** | **0/12 (0%)** |

The source-level document queue and its unit tests are partial evidence only; acceptance #2–4 require exact-candidate PG and role parity, so they remain BLOCKED. Overall KPI contract and register equality remain NOT VERIFIED. No check is N/A. Neither route is READY.

## Required next evidence / owner decisions

- Run the candidate migration and PG18 integration/parity suite against an authorized disposable candidate, capture exact source/applied head, query plan and bounded row/query behavior; exercise own/global/denied actors and compare KPI count to register rows under the same filter.
- Run authenticated role E2E and populated `/dashboard`, `/work`, and `/documents?review=mine` capture on that same candidate. Include source failure and permission-denial controls.
- Approve per-domain quality membership and state definitions before quality filters/KPIs.
- Approve whether blocked reasons may be exposed from audit or need a dedicated structured field, including access and retention.
- Approve reject analytics population/scope, roles, time basis, measure grain, and denominator before any aggregate.
- Recompute route closure against the fixed 6-check denominator; FAIL/BLOCKED/NOT VERIFIED remain in the denominator. Do not declare READY until every applicable check and P0/P1 finding is closed on the same candidate.

## Traceability

- Finding: `QC-PAGE-F-008`; improvement: `I-04`.
- Routes: `RT-DASH-001` (`/dashboard`), `RT-WORK-001` (`/work`); drilldown `/documents?review=mine`.
- Source: `src/modules/documents/application/list-review-queue.ts`, `src/modules/documents/infrastructure/postgres-review-queue.ts`, `src/modules/dashboard/application/dashboard-sources.ts`, `src/pages/documents/index.astro`.
- Schema: `db/migrations/0041_document_review_queue_indexes.sql` (source only; not applied to production).
- Tests: `tests/unit/documents/review-queue.test.ts`, `tests/unit/ui/my-work-surface.test.ts`, `tests/integration/documents/review-queue.test.ts`.
- Audit cards updated only for the source disposition; page-wide status remains NOT VERIFIED / NO-GO pending populated role evidence.
