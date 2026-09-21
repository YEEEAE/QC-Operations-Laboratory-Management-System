# QC-100-FINAL-034-A — Core resilience contracts and controls

**Work state: PARTIAL.** Phase A has implementation and focused local evidence. Neither scoped item is DONE: retry exhaustion budgets and representative pressure/recovery measurements remain unresolved. This report does not change any score or the 80-domain denominator.

## Frozen candidate and runtime identity

| Field | Value |
|---|---|
| Git SHA | `0e9bdf28ae448ab2ebc197c567a05832ea88c07d` |
| Branch | `main` |
| Worktree | Dirty at start and remains dirty; prior 032/033 work was preserved |
| Runtime | Node `24.20.0`, pnpm `11.25.0` |
| Build | Astro SSR / `@astrojs/node`; final `pnpm build` PASS at 2026-09-21 00:32:34 UTC |
| Release identity | `rel-ad3217a896358bca`, build `local-0e9bdf28ae44`; final `pnpm release:verify` PASS at 00:32:46 UTC |
| Source schema | PostgreSQL 18 source contract; 34 migrations; head `0034_template_document_link_variable_scope`, SHA-256 `628dc3dcb228906e813e532d093c3284a5b220f5226b0346bb762265a9e5f2ab` |
| Applied schema | NOT VERIFIED for this worktree; local PostgreSQL probe returned no server at `/tmp:5432` |
| Requirements guard | PASS: 100 requirements, 34 risks, 20 gaps, 33 decisions, 5 assumptions, 7 mapped domains, denominator 80 |

Content-based dirty fingerprint: `bc3746085e48528d6b7d95f9d8509d3963fd407d86bcb684b18fd831114909c1` (22 dirty candidate source/doc/test paths; SHA-256 over sorted relative paths and current file bytes, excluding `.agents/mind/**` and `audit/**` to avoid self-reference). No build identity asserts production readiness; `PASS ≠ RELEASED`.

## Evidence by scoped item

| Item | State | Changed paths and behavior | Evidence | Unresolved dependency / owner |
|---|---|---|---|---|
| 1. Failure classification and bounded timeout/retry/backoff | **PARTIAL** | `src/shared/errors/failure-classification.ts`; `src/shared/outbox/worker.ts`; `tests/unit/shared/failure-classification.test.ts`; `tests/integration/shared/outbox.test.ts`. Stable classes cover validation, authorization, stale state, duplicate, dependency and unknown errors. Outbox delivery errors now persist only a generic class summary, not raw exception text. Retry delay doubles from 30 seconds to a 15-minute cap. Provider HTTP timeout remains 12 seconds. Existing PostgreSQL translation keeps serialization/deadlock retryability internal-only and stale/duplicate decisions remain caller-visible. | Focused suite PASS: 43/43 across classifier, outbox, files, object-store and provider adapter contracts. Prettier PASS; typecheck PASS (0 errors, 0 warnings, 74 hints); build and local release identity PASS. No automatic retry was added to controlled business mutations. | Retry exhaustion/dead-letter policy and exact DB statement/lock timeout budgets remain implementation/operations or policy dependent in `DATABASE-ARCHITECTURE.md` and `OBSERVABILITY-ARCHITECTURE.md`. Owner: 013/026 to resolve authority/budget; 002/027 to verify database retry paths on exact candidate. No attempt cap is asserted for the outbox. |
| 2. Safe database/outbox/files/provider failure and pressure drills, saturation/recovery/drain measurements | **PARTIAL** | No additional runtime paths changed for pressure measurement. Reused existing disposable recovery/performance preparation from 008/025/032 and current adapter contracts. | Mocked provider timeout/error/failover tests, file service failures, object-store adapter checks and in-memory outbox failure handling PASS as part of the 43/43 focused tests. The only local PostgreSQL health probe returned `/tmp:5432 - no response`; no DB saturation or live queue-drain drill was run. Existing 032-B PG18.6 migration/recovery-projection results are candidate-bound evidence, but are not pressure results. No approved RPO/RTO, capacity or queue-drain numeric budget was found to compare against. | Disposable PostgreSQL 18 and isolated object-store failure/pressure environment required for representative drill; provider pressure requires approved test endpoint/credentials and must avoid paid/live side effects. Budgets/authority: 013/026 and operations owner; execution/reconciliation: 002/027 then 012. Human acceptance remains excluded. |

## Safety and controls

- No production database, production restore, live provider, external notification, credential, or paid resource was touched.
- No controlled mutation is automatically retried. Ambiguous commit remains a state/idempotency lookup before any user-directed retry.
- Dependency outage remains an error state; read paths do not become empty success.
- No authorization, scope, state, expected-version, SoD, idempotency, immutable-evidence, or release-gate behavior was weakened.
- Existing user changes in `.agents/mind/01-mind-latest.md`, privacy work, migration `0034`, and reports 032-B/033 were preserved.

## Command results and timestamps

All times UTC, 2026-09-21:

| Time | Check | Result |
|---|---|---|
| 00:28:23 | Focused suite initial attempt | FAIL (1 assertion expected attempt-1 delay while fixture was attempt 2); assertion corrected to test 60-second schedule |
| 00:31:58 | Final focused suite after last source edit | PASS, 43/43 |
| 00:32:08–00:32:18 | Final `pnpm typecheck` | PASS, 0 errors, 0 warnings, 74 hints |
| 00:32:34–00:32:37 | Final `pnpm build` | PASS |
| 00:32:46 | Final `pnpm release:identity`, `pnpm release:verify` | PASS; exact local SHA verified |
| 00:29:49 | `pnpm requirements:check` | PASS; denominator 80 |
| 00:28 | `pg_isready` | BLOCKED: no local PostgreSQL server at `/tmp:5432` |

Build output had existing dependency annotation, unused-import, dynamic/static import and large-chunk warnings; build exited successfully. No pressure, capacity or end-to-end claim is inferred from unit/adapter tests.

## Next phase: QC-100-FINAL-034-B

Required inputs: this report, final SHA/fingerprint and release identity; the exact-candidate adapter/classifier implementation; disposable PostgreSQL 18; isolated task-owned object-store fixture; approved non-production provider test endpoint if provider pressure is required; approved capacity/RPO/RTO/queue-drain budgets or an explicit owner decision that those measurements remain pending. B should run database/outbox/file/provider failure and recovery drills, record saturation/recovery/drain measurements against only approved budgets, then pass results to 002/027 regression and 012 reconciliation. Do not infer release readiness from local PASS results.
