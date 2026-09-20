# QC-100-FINAL-029-A — Core contracts and controls

## Candidate and evidence identity

| Field | Value |
|---|---|
| Frozen candidate before execution | Git SHA `32652b93de4d4dede9f5427c47a3cb940a8f168e` (branch `main`) |
| Final candidate SHA | `32652b93de4d4dede9f5427c47a3cb940a8f168e` |
| Content-based dirty fingerprint | `8cea29755f1c27d6bacffa7f17951fca539a8aa024bdcebaa428f19de3ff56bc`; sorted `path NUL git-status NUL SHA256(file bytes)` rows joined by LF, then SHA-256; excludes `.agents/mind/**` and `audit/**`. Included only this task's migration, migration README, and changed integrity test. Existing dirty Mind and 028 audit files are preserved and excluded. |
| Runtime / package manager | Node `22.22.3` / pnpm `11.25.0`; project requires Node `>=24.20.0 <25`, so runtime is unsupported. |
| Build / release identity | `pnpm build` PASS; `rel-efb56b6dceddb70f`, build `local-32652b93de4d`, timestamp `2026-09-20T21:50:05.731Z`; `pnpm release:verify` PASS, exact Git SHA matches. |
| Source schema identity | Migration head `0032_document_version_file_integrity`, SHA-256 `caba57067c08cdd4e28ea38d934cfe834001ccccd6b323d632ad1a3f99168b0a`. This is source identity only; applied database schema is NOT VERIFIED. |
| Evidence run time | `2026-09-20T21:50Z` UTC / `2026-09-21 00:50` Asia/Riyadh (latest post-edit checks). |

## Item-by-item evidence

| Scoped item | Changed path(s) | Evidence and result | Unresolved dependency / owner |
|---|---|---|---|
| 1. Trace controlled record creation, revision, approval, signature, correction, archival, and historical reads against approved policy; preserve prior versions and hashes | `db/migrations/0032_document_version_file_integrity.sql`; `tests/integration/database/controlled-record-integrity.test.ts`; `db/migrations/README.md` | Existing document application paths create revisions as separate rows, permit draft edits only, require a content hash before approval, advance expected versions, atomically supersede old/new versions, and return all historical versions on authorized read. Existing migration `0028` protects approved document content and makes signatures append-only. Added DB control: document-version files may be linked only while their version is `DRAFT`; file-link rows reject update/delete/truncate. Test covers DRAFT insertion, update/delete denial, and denial of linking to an approved version. **Source trace DONE; DB behavior NOT VERIFIED** because PostgreSQL setup did not start. | 013/026: approved correction and record-class retention/archive schedule; 002/027: execute the new trigger contract on disposable PostgreSQL; 012: evidence reconciliation. No retention period or policy edge was invented. |
| 2. Verify signature intent, reauthentication, authority, timestamp, candidate/record version and snapshot binding; reject stale/tampered/wrong-context/replayed commands without fabricating signatures | No signature implementation path changed in this phase. Existing paths: `src/modules/e-signatures/application/sign-controlled-action.ts`, `src/modules/e-signatures/application/final-approval-ceremony.ts`, `src/modules/approvals/application/decide-approval.ts`, `src/shared/e-signatures/insert-signature-evidence.ts`, migration `0028` | Existing contract reauthenticates, reauthorizes `PERM-ESIG-SIGN`, takes server time, requires action/meaning/version/snapshot/request id, uses server-loaded approval subject context, persists final-approval signatures with the owning transaction and exact pre-transition version, and checks request-id replay before a new approval. Existing signature + document contract tests: **5/5 PASS**. Existing code/schema inspection confirms committed signature evidence is append-only. New database test also asserts document file evidence cannot be attached after approval. Candidate-specific PostgreSQL and replay/concurrency results are **NOT VERIFIED** (integration setup blocked). | 002/027: fresh disposable-PG stale/tampered/context/replay/concurrency verification; 013/026: approved action-to-signature scope (PD-32) and generic document approver authority (PD/RD); 012: reconciliation. Do not infer signature requirement for a policy-open action. |

## Technical checks

| Check | Result | Details |
|---|---|---|
| `pnpm exec prettier --check tests/integration/database/controlled-record-integrity.test.ts` | PASS | Latest post-edit run. Prettier has no SQL parser; PostgreSQL syntax/application remains NOT VERIFIED because the database test could not start. |
| `git diff --check` | PASS | No whitespace errors. |
| `pnpm typecheck` | PASS | 883 files, 0 errors, 0 warnings, 74 hints. Run on unsupported Node 22.22.3. |
| `pnpm build` | PASS | Run on unsupported Node 22.22.3; emitted existing dependency annotation/chunk-size warnings. |
| Existing document/signature focused tests | PASS | `tests/integration/e-signatures/signature.test.ts` + `tests/integration/documents/repository.test.ts`: 5/5. These are unit-level contracts despite their directory names. |
| New controlled-record PostgreSQL integration test | BLOCKED / NOT VERIFIED | 4 tests skipped; Testcontainers: “Could not find a working container runtime strategy”. Retried after the final migration edit; same environment blocker. |
| `pnpm db:migrate:check` | BLOCKED | `tsx` IPC listener failed with `EPERM`; no database integrity claim made. |
| Release identity | PASS | `pnpm release:identity` followed by `pnpm release:verify`; exact SHA and source migration head recorded above. |

## State and next phase

- **Task state: PARTIAL.** Item 1 source trace and file-link guard are implemented; item 2's existing code paths were traced and focused unit contracts pass, but this candidate's database and replay behavior is not proven. Therefore phase DONE criteria are not met.
- **Evidence state: PASS** for typecheck, build, focused unit contracts, formatting, diff check and local release identity; **BLOCKED / NOT VERIFIED** for PostgreSQL integration, migration-ledger check and applied schema identity.
- **Other dependencies:** 013/026 policy/authority decisions; 002/027 candidate-bound database regression; 003 affected E2E; 006/040 applicable accessibility checks; 004 genuine human evidence remains external and excluded from this implementation task; 012 final reconciliation.
- **Scores and denominator:** no score adjustment; existing 80-domain denominator and 15/19/31/32/33/34/35/36/78/79 audit mappings unchanged. `PASS ≠ RELEASED`.
- **Next:** QC-100-FINAL-029-B. Required inputs: this report, final candidate SHA and dirty fingerprint, disposable PostgreSQL run for migration `0032` and the controlled-record test, current approved 013/026 policy/authority decisions, owner regression/E2E/accessibility outputs as applicable, and 012 reconciliation. Preserve the external human-evidence dependency; do not treat it as completed by technical checks.
