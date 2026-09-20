# QC-100-FINAL-032-A — Core contracts and controls

**Work status: PARTIAL.** Local source contracts and documentation are implemented. Candidate-specific PostgreSQL behavior is not verified because disposable database startup is blocked in this environment.

## Candidate and runtime identity

| Field | Value |
|---|---|
| Frozen candidate before execution | Git SHA `a0d0661294cb7cba17d8a9a9068a9f696ec197cf`; initial worktree clean |
| Final source candidate SHA | `a0d0661294cb7cba17d8a9a9068a9f696ec197cf` (working changes are uncommitted) |
| Final content-based dirty fingerprint | `cd63ebb3036e9154a9c57d073eb553d200d41ebf0dfd92d067fff1014ee5cf2b`; SHA-256 over sorted `path NUL git-status NUL SHA256(file bytes)` rows joined with LF; excludes `.agents/mind/**` and `audit/**`; 10 changed source/document/test paths |
| Audit comparison | 2026-09-19 candidate `653b58d22d4a17994db7376a3bd691ca6e789f1a`; maturity 45.8%, gates 0/19, NO-GO (historical comparison, unchanged) |
| Runtime / package manager | Node `22.22.3` / pnpm `11.25.0`; declared Node contract is `>=24.20.0 <25`, so all local Node checks are outside contract |
| Build / local release identity | `pnpm build` PASS; `pnpm release:identity` + `pnpm release:verify` PASS; release `rel-ac6232405c719762`, build `local-a0d0661294cb`, service/application `0.1.0`, build timestamp `2026-09-20T23:05:35.931Z` UTC, exact Git SHA matches |
| Source schema identity | 33 migration files; head `0033_controlled_document_execution_context`; SHA-256 `6b4cf38ab8974ba0dbb30fc4cccb766dac3351796f4d84eb5bf226de0d75c472` |
| Applied schema identity | NOT VERIFIED; no production or provider DB was queried or migrated |
| Evidence window | `2026-09-20T23:03Z`–`23:06Z` UTC (`2026-09-21 02:03`–`02:06` Asia/Riyadh); exact check outputs below |

## Item-by-item evidence

| Scoped item | Changed paths | Evidence / result | Unresolved dependency / owner |
|---|---|---|---|
| 1. Map ownership, keys, constraints, lineage, classification, authoritative source, stewardship, and approved correction rules | `Documents/DATA-GOVERNANCE-REGISTER-032.md`, `Documents/DATA-MODEL.md`, `Documents/DATABASE-ARCHITECTURE.md` | Added a migration-backed entity-family map across business and platform modules with UUID/business keys, principal FK/unique/check constraints, source/lineage, field-level classification authority, functional steward, and correction routing. Explicitly marks Reporting/Dashboard/Search and AI as having no dedicated persisted tables in migrations 0001–0033. Corrected stale schema count/head to source migration 0033 while marking applied schema NOT VERIFIED. **Map delivered; policy-owned details remain PARTIAL.** | 013/026: name organizational stewards, finish field-level classification where dictionary entries are unconfirmed, and approve reference-data, retention, correction, file scan/MIME, scientific-source, and authority rules. Runtime remains fail-closed for unresolved policy/source edges. 012 reconciles evidence. |
| 2. Inspect transaction/isolation/locks/version/idempotency and implement missing concurrency guarantees | `src/modules/quality/{findings,ncr,capa,rca}/infrastructure/postgres-repository.ts`, `src/modules/quality/rca/{application/update-rca.ts,ports/repository.ts}`, `tests/integration/concurrency/controlled-mutations.test.ts` | Fixed four Quality transitions that compared `expectedVersion` without advancing stored `version`; each now increments within the conditional UPDATE and rejects a losing write as `CONFLICT_STALE_VERSION`. RCA draft update now carries an explicit expected version and compares it atomically. Added PG concurrency cases for same-version transitions and RCA updates. Isolation remains READ COMMITTED; no global serialization, authorization change, SoD relaxation, or signature/evidence mutation. **Source implementation DONE; DB evidence BLOCKED.** | 002/027: execute the added suite and migration regression against disposable PostgreSQL 18 and return exact-candidate results. 003 E2E only if affected browser flows require it. 006/040: no accessibility-specific change. 012: reconcile final evidence. |

## Checks

| Check | Result |
|---|---|
| Prettier on all changed source/test/docs | PASS (`2026-09-20T23:05Z` UTC) |
| ESLint on changed TypeScript source and concurrency test | PASS |
| `git diff --check` | PASS |
| `pnpm requirements:check` | PASS — requirements 100, risks 34, gaps 20, decisions 33, assumptions 5, mappedDomains 7, domains 80 |
| `pnpm typecheck` | PASS — 887 files, 0 errors, 0 warnings, 74 hints; Node 22.22.3 unsupported |
| `pnpm build` | PASS — Node 22.22.3 unsupported; existing dependency annotation and chunk-size warnings remain |
| `pnpm release:identity` / `pnpm release:verify` | PASS — release identity matches exact candidate SHA; local dirty flag true |
| `tests/integration/concurrency/controlled-mutations.test.ts` | BLOCKED — Testcontainers could not find a container runtime; 7 cases skipped before test execution |
| Alternate local disposable PostgreSQL | BLOCKED — installed PostgreSQL 14.19 `initdb` failed creating a System V shared-memory segment (`Operation not permitted`) before cluster startup, even when a separate task-owned `/tmp` cluster was requested |
| `db:migrate:check`, `db:schema:check`, applied schema | NOT RUN / NOT VERIFIED — no database started; no migrations applied |

## Guardrails and handoff

- No migration was added or applied. No production/provider connection, credential, secret, or human-acceptance evidence was accessed or changed.
- Existing 002/027 evidence is from older candidates and is HISTORICAL for this SHA; it does not replace the blocked exact-candidate PostgreSQL run.
- Existing server authorization, scope/state/version checks, SoD, idempotency, immutable evidence, and `PASS ≠ RELEASED` remain intact. No audit discipline or scored domain was added; denominator remains 80.
- Human acceptance execution is excluded and remains external. Its absence is not converted to technical completion.

**Next phase:** QC-100-FINAL-032-B. Required inputs: this report; final SHA/fingerprint and migration head above; run `tests/integration/concurrency/controlled-mutations.test.ts`, migrations, and affected database regression on a disposable PostgreSQL 18 instance using task-owned fixture identities/data; return output with evidence timestamps; provide any 013/026 decisions that close named steward/classification/correction dependencies. Then 012 performs final reconciliation. Do not apply migrations to production or change the NO-GO score/gates based on local PASS results.
