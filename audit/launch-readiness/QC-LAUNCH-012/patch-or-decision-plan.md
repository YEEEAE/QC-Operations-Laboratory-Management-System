# QC-LAUNCH-012 — Patch or decision plan

## Disposition

**BLOCKED — required PostgreSQL 18 runtime evidence is unavailable.** Source inspection found the production mutation factories supply transaction-bound audit/outbox repositories, and the migration chain contains append-only row and truncate guards. No reproduced source defect justified a product patch. The PostgreSQL 18 rollback/tamper/race assertions did not execute, so neither criterion is accepted.

## Candidate

- Repository: `YEEEAE/QC-Operations-Laboratory-Management-System`
- Branch / HEAD: `main` / `acf7b5a74ab62845f95f1134e61f34d72f7c5fb3`
- Audit reference: `60e78cc6fdafe6c70e249be2d687c1df3af45412` (ancestor; 8 commits behind)
- Source fingerprint during all three valid evidence runs: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
- Migration head: `0047_task_references_occurrences.sql`
- Node / pnpm: `24.20.0` / `11.25.0`

## Local diff summary

- No product source, tests, migration or controlled QMS material changed.
- Local launch packet created: `evidence.json`, `execution-report.html`, and this plan.
- No database was available or modified. No real controlled record was created or edited.

## Source review decisions

1. `0004_audit_outbox_idempotency.sql` adds indexes; append-only audit enforcement is in `0028_qc_closure_009_controlled_records.sql` (UPDATE/DELETE) and `0033_controlled_document_execution_context.sql` (TRUNCATE).
2. Document, receiving, inspection, template and laboratory mutation repositories use database transactions and append audit/outbox effects through the transaction-bound PostgreSQL repositories when created by their action dependency factories.
3. Laboratory transcription-only report drafts write their record and audit row in the same transaction. They remain separate from controlled lab-test workflow events.
4. Repository constructors keep audit/outbox ports optional for read-only construction. Current product action factories pass the required evidence repositories; the PG18 test suite that would verify atomic behavior at runtime remains blocked.
5. Corrective-action/CAPA workflows are outside the prompt's listed source targets. In-scope correction and retest paths are included in the mutation inventory.

## Required remediation and owners

- **Database runtime owner:** provide a disposable PostgreSQL 18/Testcontainers-capable environment; keep test data synthetic and isolated.
- **Database QA:** start a fresh `pnpm verification:begin`, then run `pnpm test:integration`, `pnpm test:concurrency`, and `pnpm test:migrations`; preserve the resulting candidate-bound JSON and actual command exit codes.
- **Compliance QA:** review exact-SHA test evidence and verify audit reads retain actor, timestamp, reason, old/new state, request correlation and source-version context without exposing raw payloads.
- **Independent rubric reviewer:** decide criterion acceptance and earned points only after reviewing the current candidate's authentic runtime artifacts.

## Rollback / dependencies / residual risk

- There is no product patch to roll back. Removing the local report packet is the only cleanup action if the evidence is superseded.
- Do not point the commands at a provider or production database; use only disposable PG18.
- Residual risk: PG18 rollback, database-enforced immutability, concurrent same-version behavior, replay/idempotency and audit read consistency remain **NOT VERIFIED**. Any unlogged regulated transition remains a release blocker until the runtime matrix closes.
- Accepted points remain **0 / 5.50 targeted** pending independent review.
