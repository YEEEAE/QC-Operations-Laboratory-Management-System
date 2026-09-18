# QC-CLOSURE-010 — Cross-domain integration evidence

**Date:** 2026-09-18 Asia/Riyadh  
**Source:** working tree on `main`; no commit, push, or deployment  
**State:** PARTIAL — source and focused tests pass; PostgreSQL/outbox runtime is blocked locally.

## Implemented contract

- Inspection and laboratory approval events already commit state, audit, and outbox rows in the owning transaction. The outbox worker now has a real QC handler that projects approval events to the record author as a recipient-scoped notification.
- Notification projection is replay-safe through the existing database dedupe key. It emits generic record-state copy and no measurements, evidence contents, credentials, or raw payload.
- Global search now includes receiving lot values and the existing reject-report result type in the public search contract. Existing predicates remain actor-scoped; laboratory tests remain searchable by their authoritative test number.
- Canonical quarantine reports accept server-validated lot, item, workflow, inspection-result, release-state, and date filters. Exports continue to use the same canonical dataset and independent export permissions.

## Acceptance gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Audit/state/outbox source integration | PASS (source) | Inspection and lab repositories write state + audit + outbox in one transaction. |
| Notification recipient, leakage, retry/idempotency | PASS (source) / BLOCKED (runtime) | `qc-event-handler.ts`, unique notification dedupe, outbox retry worker; no PostgreSQL run. |
| Search identifiers and authorization boundary | PASS (source/focused) | `PostgresSearch`, `search-result.ts`, `tests/integration/shared/search.test.ts`. |
| Report current-state filters and export canonicality | PASS | `run-report.ts`, `postgres-report-query.ts`, reporting focused tests. |
| Files/evidence integrity | PASS (prior focused evidence) | Existing file-service focused suite covers authorization, MIME/signature, hash/tamper, and evidence linkage. |
| PostgreSQL migration/outbox/dashboard/report runtime | BLOCKED | Disposable PostgreSQL failed to start because `shmget` is not permitted; Docker daemon unavailable. |

## Verification run

- Focused Vitest: **8 files / 29 tests PASS**.
- `pnpm typecheck`: **0 errors**, 68 existing hints; Node `v22.22.3` is outside the declared `>=24.20.0 <25` contract.
- `pnpm test:architecture`: **PASS**.
- `pnpm build`: **PASS** with existing dependency/chunk warnings.
- `git diff --check`: **PASS**.

## Remaining evidence boundary

The source path is wired, but live proof that an approval commits the related receiving state, audit row, searchable visibility, dashboard/report projection, outbox delivery, and notification row together still requires the disposable PostgreSQL 18/Testcontainers path and authenticated workflow execution. This record does not claim UAT, production, or Render verification.
