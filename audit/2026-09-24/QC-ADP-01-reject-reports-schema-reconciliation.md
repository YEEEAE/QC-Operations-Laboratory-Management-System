# QC-ADP-01 — Reject Reports schema reconciliation handoff

**State:** PARTIAL / production and page acceptance BLOCKED  
**Source HEAD:** `ef1c220f47bbadf4b35318091071f01b88c151bc`  
**Candidate status:** dirty working tree; no release identity, commit, push, or deployment created.

## Finding and root cause

`QC-PAGE-F-001` is caused by migration lag, not a missing Reject Reports DDL definition: read-only live evidence recorded `0018` applied while the source build advertises `0039` with 21 migrations pending. Migration `0026_reject_reports.sql` creates the four report tables and their FK/unique constraints. `0039_laboratory_report_drafts.sql` creates only the separate laboratory draft table; it does not reconcile Reject Reports. The source health projection is not a direct database inspection and does not authorize migration.

The application already fails closed for absent report tables. Its availability probe only checked table names, however, so a partial/manual schema with missing columns or integrity constraints could be advertised as ready. The candidate change now checks migration ledger identity, all columns used by the four tables, and the report FK/unique constraints. All four page routes now use an explicit 503 recovery state when readiness is false; direct POST from the new-report form is also suppressed while unavailable. No historical migration was edited and no new migration was justified by the source comparison.

## Exact migration identities

| Migration | SHA-256 of current source file | Purpose |
|---|---|---|
| `0026_reject_reports.sql` | `a411f2e9ae36f8594639cedc4c984e5c6ecd976a69c631e3730b26008a917062` | Reject Reports tables, FK/unique/check constraints, indexes, baseline permissions |
| `0039_laboratory_report_drafts.sql` | `b52e70d5dc45aab6f1553a3d761b8d2dab2e455eb5db5f27e44caf27d0e823a9` | Laboratory report drafts; unrelated to Reject Reports |

The deployed database ledger checksum for `0026` and `0039` is **NOT VERIFIED**; the live source projection says `0018` applied, so neither is represented there as applied.

## Required migration plan (not executed against production)

1. **Authorization and secret gate:** rotate the exposed Render database credential per `Documents/RENDER-DATABASE-CONNECTION.md`; use only the canonical managed secret. Obtain explicit migration authorization for the exact target database, source HEAD, migration range `0019`–`0039`, and window. Confirm owner/scope and no open source/policy decision.
2. **Preflight:** freeze and record candidate HEAD plus dirty-file fingerprints; run read-only `db:preflight`, `db:migrate:status`, checksum/integrity, schema, role/ownership and PostgreSQL-version checks. Stop on checksum mismatch, foreign-owned objects, privilege gaps, unexpected applied migration, or candidate/source mismatch.
3. **Backup:** create a provider-native database backup/snapshot, record its immutable identity and checksum/metadata, and prove restore into an isolated database before authorizing forward application. Production backup/restore evidence is currently NOT VERIFIED; an empty backup catalog is not a backup.
4. **Isolated rehearsal:** on PostgreSQL 18, run clean install and upgrade from a sanitized representative copy at `0018` to source head. Verify exact ledger hashes, constraints, orphan counts, no history loss, report read/write/authorization/version behavior, and source/report parity. Rehearse failure rollback using the migration runner's transaction behavior and confirm the failed migration leaves its ledger entry absent.
5. **Forward-only execution:** apply the approved exact migration set once under the migration lock; never edit or delete migration history, disable FK/unique constraints, or delete report history. Verify zero pending migrations, exact checksums, readiness, audit/outbox integrity, and report parity.
6. **Rollback/recovery:** migrations are forward-only. Before commit of a failing migration, rely on transaction rollback and stop. After successful migrations, do not reverse/drop schema or rewrite ledger; stop report writes if needed and investigate. Any restore must use the verified snapshot into an isolated target first, with a separately authorized owner decision before any production restore or traffic switch.
7. **Postflight:** run health/readiness and authorized + unauthorized route/API checks on the same candidate/deployed SHA; record role/scope, DB migration head, version, evidence IDs and operator. Obtain separate explicit publication/deployment authorization before releasing.

## Page acceptance denominator and handoff

The affected page cards in `audit/2026-09-24-ADAPTIVE-PAGE-BY-PAGE-FULL-SYSTEM-AUDIT.md` define six applicable findings per route. Closure is `PASS ÷ 6`; unresolved findings remain in the denominator. Source inspection is not runtime closure.

| Route card | Applicable findings | PASS / denominator | State and evidence |
|---|---|---:|---|
| `RT-REJ-001` `/reject-reports` | F-001, F-009, F-010, F-013, F-016, F-014 | 0/6 (0%) | BLOCKED / NOT VERIFIED; controlled live 503 was observed in the audit; populated list/scope/performance/a11y/UAT not verified. |
| `RT-REJ-002` `/reject-reports/new` | F-001, F-009, F-010, F-013, F-016, F-015 | 0/6 (0%) | BLOCKED / NOT VERIFIED; source has 503 branch, but successful/denied POST, P-05, keyboard/focus and representative creation were not exercised. |
| `RT-REJ-003` `/reject-reports/issue-slips/[reportId]` | F-001, F-009, F-010, F-013, F-016, F-014 | 0/6 (0%) | BLOCKED / NOT VERIFIED; route source passes review only; populated/current/stale/unauthorized issue-slip actions were not exercised. |
| `RT-REJ-004` `/reject-reports/daily/[reportId]` | F-001, F-009, F-010, F-013, F-016, F-014 | 0/6 (0%) | BLOCKED / NOT VERIFIED; route source passes review only; populated/current/stale/unauthorized daily-report actions were not exercised. |

Candidate evidence: Reject Reports domain/approval unit tests **20/20 PASS**; Astro check **0 errors** (89 hints); PostgreSQL readiness and report integration suites **BLOCKED before tests** because Docker has no working runtime and local PostgreSQL is 14.19, below required PG18. No E2E, browser/keyboard, live source recheck, or production migration was run. The source read-only health evidence remains `0018` applied / `0039` shipped / 21 pending. Therefore readiness PASS, report parity, route closure and release acceptance are NOT VERIFIED; final status is **NO-GO**.

An additional owner dependency remains open in the current Mind: Reject Reports analytics currently aggregate globally, and the approved visibility/scope decision for publishing those aggregates on this route is unresolved. This task did not invent or change that policy. Even after database migration, route acceptance/release must remain BLOCKED until the owner decision and its positive/negative scope evidence are recorded.

## Files and traceability

- Implementation: `src/modules/reject-reports/infrastructure/postgres-repository.ts`
- Regression: `tests/integration/system/reject-reports-readiness.test.ts`
- Migration source: `db/migrations/0026_reject_reports.sql`, `db/migrations/0039_laboratory_report_drafts.sql`
- Finding and route cards: `audit/2026-09-24-ADAPTIVE-PAGE-BY-PAGE-FULL-SYSTEM-AUDIT.md` sections 3, 17 and 22
- Operations gates: `Documents/RENDER-DATABASE-CONNECTION.md`, `Documents/RENDER-MIGRATION-RUNBOOK.md`
