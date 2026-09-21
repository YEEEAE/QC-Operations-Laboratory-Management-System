# QC-100-FINAL-032-B — Integration and Technical Evidence

**Phase status: DONE (technical items evidenced).**  
**QC-100-FINAL-032 family status: PARTIAL** pending the policy/source owners and final audit reconciliation listed below.  
**Evidence labels:** database suites and local recovery `PASS`; provider-applied schema and Docker/Testcontainers path `NOT VERIFIED` / `NOT RUN`.

## Candidate and runtime identity

| Field | Frozen at B entry | Final candidate exercised |
|---|---|---|
| Git SHA | `0e9bdf28ae448ab2ebc197c567a05832ea88c07d` | `0e9bdf28ae448ab2ebc197c567a05832ea88c07d` |
| Content-based dirty fingerprint | `d5b7f826d510c22a555f1c6f4e8ad878829fada7fd3f13196731487cb7e1dab3` (13 source paths; existing 033 work preserved) | `4d51084e350a79da5e8aed8d81e48f478f2101b8d5d2b5564841371fb807c51d` (18 source paths; includes existing 033 work and B changes) |
| Relationship to 032-A | `a0d0661294cb7cba17d8a9a9068a9f696ec197cf` is an ancestor of this SHA; its Quality CAS and governance changes are present in the candidate | Same |
| Node / pnpm | — | Node `24.20.0` / pnpm `11.25.0` |
| Build / release identity | — | `pnpm build` PASS; `rel-ad3217a896358bca`, build `local-0e9bdf28ae44`, service/application `0.1.0`, build timestamp `2026-09-21T00:08:47.767Z`, SHA verified exact; working tree dirty |
| Source schema | — | 34 SQL migrations; head `0034_template_document_link_variable_scope`; SHA-256 `628dc3dcb228906e813e532d093c3284a5b220f5226b0346bb762265a9e5f2ab` |
| Applied schema | — | Task-owned PostgreSQL 18.6 `qc_disposable` and `qc032b_recovery`: ledger 34, tables 79, orphan rows 0. Provider/Render schema remains NOT VERIFIED. |
| Evidence window | — | `2026-09-20T23:49Z`–`2026-09-21T00:08Z` |
| Audit comparison | — | 2026-09-19 candidate `653b58d22d4a17994db7376a3bd691ca6e789f1a`; maturity 45.8%, gates 0/19, NO-GO. No score or 80-domain denominator change. |

The final dirty fingerprint uses sorted `path NUL status NUL SHA256(file bytes)` rows joined by LF, excluding `.agents/mind/**` and `audit/**`, matching the 032-A convention. The initial candidate and unrelated 033 edits were preserved. Historical migration `0033` was not modified.

## Item-by-item evidence

| Scoped item | Changed paths | Evidence / result | Unresolved dependency / owner |
|---|---|---|---|
| 1. Clean/upgrade migrations, checksum integrity, rollback safety, and query plans | `db/migrations/0034_template_document_link_variable_scope.sql`; `tests/integration/database/controlled-record-integrity.test.ts`; `Documents/DATA-GOVERNANCE-REGISTER-032.md`; `Documents/DATA-MODEL.md`; `Documents/DATABASE-ARCHITECTURE.md` | Clean migration on disposable PG18.6 applied `0001`–`0034`; migration engine and supported upgrade tests passed. Database suite: 8 files / 33 tests PASS, including injected checksum mismatch denial, concurrent migration runner lock, failed-migration rollback (probe table and ledger row absent), and no-op after latest migration. `db:migrate:check` PASS on source and restored databases (34 migrations); `db:schema:check` PASS on both (79 tables / 0 orphans). Four conditional Quality CAS updates were planned with `EXPLAIN`: findings, NCR, CAPA, and RCA each use its primary-key index and filter by expected version. These are planner-shape checks, not latency claims or a representative-volume benchmark. | Docker/Testcontainers exact path NOT RUN (daemon unavailable). The existing `PERF-` data seeder was NOT RUN because it requires a named `yazeed` owner account absent from this fresh disposable database; no owner identity was fabricated. 002/027 may consume the local PG18.6 evidence and run the container path when available. |
| 2. Concurrent races, duplicate retries, partial failures, FK violations, time boundaries, lineage, and deterministic reconciliation after recovery | Same paths, plus `tests/integration/concurrency/controlled-mutations.test.ts` and `Documents/DATABASE-ARCHITECTURE.md` | Final-candidate targeted database suites: 14 files / 65 tests PASS on Node 24.20.0 + PG18.6, including Quality CAS and duplicate-idempotency races (13/13), template concurrency/replay (2/2), release concurrency (5/5), release state (4/4), UTC-midnight dashboard/register parity (8/8), migration/constraint/integrity checks, and controlled-record transactional rollback. FK integrity checks reported zero orphans. `integrity-governance` verified actor lineage columns; a task-owned report projection joined two `QC032B-*` findings to their disposable actor and one audit event each. A custom-format dump (294,994 bytes; SHA-256 `b13d282c27f9dbf4a9d0277f9326a12f11b595e8b811e381f126c4a39c758c46`) was restored into a new isolated database. The ordered lineage projection matched byte-for-byte before/after restore (SHA-256 `18acb2b8576945579bcd708126cf4944d4fa45c28095c533846df3f8b7680fc1`); restored schema/checksum/orphan checks passed. | Local logical restore proves only the task-owned sample and local PostgreSQL archive path; provider backup/PITR/DR and production applied schema remain NOT VERIFIED. 012 performs final evidence reconciliation. |

## Verified integration gap fixed

The first PG18 run exposed a real SQL ambiguity in the `0033` template-document trigger: local variable `template_id` conflicted with `inspection_template_versions.template_id`, so valid document-source inserts failed. Two TRUNCATE assertions also stopped at PostgreSQL’s FK guard before reaching the intended append-only trigger. B adds forward migration `0034` with distinct local variable names and qualified columns, and updates the trigger tests to use `TRUNCATE ... CASCADE`, which reaches the append-only guard. Migration `0033` and its checksum remain untouched. After the fixes, the controlled-record-integrity suite passed 7/7 and the full database suite passed 33/33.

## Other checks and boundaries

- Typecheck PASS: 889 files, 0 errors, 0 warnings, 74 hints. Build and local release identity verification PASS on the declared Node runtime. Existing dependency/chunk warnings remain non-fatal.
- Prettier on changed test/docs PASS; ESLint on the changed integration test PASS; requirements guard PASS (`requirements=100`, `risks=34`, `gaps=20`, `decisions=33`, `assumptions=5`, `mappedDomains=7`, `domains=80`); final `git diff --check` PASS.
- PostgreSQL was a new task-owned loopback cluster with TLS. No production/provider database, provider credentials, shared evidence data, or human acceptance evidence were accessed or changed. No commit, push, merge, deploy, or production migration was performed.
- The approved performance seeder’s missing owner fixture is a bounded limitation: it prevents volume-based EXPLAIN/latency claims, not the static CAS plans or integration results above. No workload budget or performance claim is inferred.
- `PASS ≠ RELEASED`; this work does not alter maturity scores, audit domains, release gates, scope/state/version/SoD, idempotency, or immutable evidence policy.

## Handoff

- **013/026:** provide approved organizational stewards, field classification, and correction/retention/source rules. No policy or scientific authority was invented in B.
- **002/027:** consume this exact-SHA local PG18.6 evidence; Docker/Testcontainers exact-candidate verification remains NOT RUN while the daemon is unavailable.
- **012:** next phase is final audit reconciliation using this report, final SHA/fingerprint, schema/build identity, and the outstanding owner evidence above. Human acceptance remains external and excluded.
