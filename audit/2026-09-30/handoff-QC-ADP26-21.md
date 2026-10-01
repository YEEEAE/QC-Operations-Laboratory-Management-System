# QC-ADP26-21 — restore intent audit/outbox atomicity handoff

**State: PARTIAL.** Source behavior is corrected and the focused suites/build pass. The full database acceptance and authenticated browser/assistive-technology acceptance are blocked or not verified, so QC-PAGE-F-021 remains open pending those proofs. No production restore was requested or run.

## Candidate and tool identity

| Field | Value |
|---|---|
| Requested audit SHA | `0b1bb21bb3b4eca77862dbba1da8623044e96355` |
| Candidate | `9e6b721fe36c772f64b0586ed42de583f5a54f5b` on `main`; audit evidence rebound to this HEAD because the requested SHA differs |
| Initial checkout | Clean; initial user-change set empty. No pre-existing changes were overwritten. |
| Final worktree | Local source/test/documentation changes only; no commit. `git diff --check` PASS. |
| Dirty source/test fingerprint | `fbf095075adf5b1ad91a743597c7f955a7396903998329a8a462ab9ac653482a` — SHA-256 over the task's source/test diff, excluding audit/Mind/workspace-map/build output |
| Runtime | Node `v24.20.0`; Vitest `5.0.0`; package contract pins `pnpm@11.25.0` |
| Package-manager runtime | NOT VERIFIED: Corepack attempted to download pnpm and was blocked by registry DNS (`ENOTFOUND`); existing local binaries were used directly. |
| Source schema | `0042_immutable_lab_equipment_usage.sql` |
| Applied schema | NOT VERIFIED; no isolated PG18 container or DB URL was available. No production DB was accessed. |
| Migration | None required. Existing `restore_runs` JSONB `evidence` stores reason/fingerprint; existing unique constraint `(backup_run_id, request_id)` provides the idempotency key. |
| Build | Astro server/client build PASS, Node `v24.20.0`, command `node_modules/.bin/astro build --outDir .tmp/qc-adp26-21-final-build`; exit 0. Local-only build, no release identity manifest generated. |
| Build artifact | `.tmp/qc-adp26-21-final-build/dist/server/entry.mjs`, SHA-256 `07cf2db6881d756b63491baecb1f06a30d7ce215d913bad2dca45fcb1c0d1daf` |

The application source SHA and dirty source fingerprint identify local candidate source, while the build artifact is local-only. There is no production/deployed identity claim.

## Implementation and data boundary

`recordRestoreRequest` now holds a transaction-scoped `FOR UPDATE` lock on the existing backup row, rechecks its restorable state, inserts the planned intent, and appends audit and outbox rows through adapters bound to that same transaction. Any write failure aborts all three writes. A conflict on `(backup_run_id, request_id)` loads the prior intent: matching fingerprint returns it without duplicate effects; a different fingerprint is rejected. The fingerprint covers backup, actor, restore type, target environment, and normalized operator reason. The reason is stored in the restore evidence and as the audit reason.

The database boundary is:

| Operation | Reads | Writes | Constraint / transaction |
|---|---|---|---|
| Request | Locked `backup_runs(id,state)` row; on idempotency conflict, matching `restore_runs` row/evidence | One `restore_runs` intent, one audit event, one outbox event | Existing unique `(backup_run_id, request_id)`; all writes and reads above are within one PostgreSQL transaction. Backup row lock and state recheck serialize competing intents against a state transition. |
| Replay | Existing restore row and `evidence.requestFingerprint` | None | Exact replay is idempotent; a different reason or other fingerprinted input is denied. |
| Read pages | Backup catalog and restore runs | None | Checksum is projected to `hasChecksum: boolean` only when metadata is a valid 64-hex SHA-256; raw checksum stays in infrastructure. |

There is no backup version column in the existing schema. The transaction locks and rechecks state; no synthetic version or migration was added. The intent remains `PLANNED` with `restoreExecuted=false`. Domain restore verification derives only from terminal restore runs, so a planned request never claims `RESTORED` or `VERIFIED`. No restore executor/orchestrator was added.

Production restore remains deny-by-policy, including for canonical `yazeed`. Recovery authority/signature policy (RD-020) and business recovery objectives remain unresolved; no owner decision was inferred. Drill authorization is application-checked and production permission remains denied. Page visibility remains subject to `pageAccessDecision`.

## Verification evidence

| Requirement / check | Result | Reference / limits |
|---|---|---|
| Focused backup catalog, restore authorization, and system health suites | PASS — 3 files, 34 tests | `node_modules/.bin/vitest run tests/integration/system/backup-catalog.test.ts tests/integration/system/restore-authorization.test.ts tests/integration/system/system-health.test.ts`; Node `v24.20.0`; exit 0. Includes checksum availability, reason boundary/conflicting replay, planned-vs-verified, readable record positive control, and application authorization denial. |
| `git diff --check` | PASS | Final source changes; no whitespace errors. |
| Astro server/client build | PASS | Local candidate build above; exit 0. Vendor annotation, dynamic-import, and large-chunk warnings remain. |
| Existing full `astro check` | FAIL — one unrelated error | `src/pages/ai-advisory.astro:148`, nullable `requestButton`; 113 hints. No reported error in the changed backup files. |
| PostgreSQL 18 integration | BLOCKED — 7 tests skipped | New `tests/integration/system/backup-restore-atomicity-postgres.test.ts` covers insert/audit/outbox failure rollback, before/after rows on denial, valid/missing checksum, reason persistence, same/conflicting replay, concurrent retry, and production denial. Runner failed before setup: `Could not find a working container runtime strategy`; no PG18 DB URL was available. The test cases did not execute. |
| PostgreSQL role/state fixture and audit/outbox before/after | BLOCKED | App-level authorization mocks pass, but no live isolated DB evidence. The tests bind the denied action to an existing readable backup and compare `restore_runs`, audit, and outbox counts when run. |
| Schema migration/applied schema | N/A for changes / NOT VERIFIED for environment | No schema change was required or made; source head is 0042. Applied schema could not be queried without the blocked isolated database. |
| Direct HTTP / authenticated browser, viewport 320/375/768/1440 CSS px and 200%, keyboard/AT | NOT VERIFIED | No authenticated disposable PG18 fixture/session. Build verifies compilation only, not rendered behavior. |
| Human UAT / signature | NOT VERIFIED | No human UAT was performed or signed by the agent. |
| Production request/restore | PASS — no production write | No production DB or provider was accessed. Production restore remains denied in application policy. |

## Pages and finding status

- `/system/backups`: source review confirms catalog filtering/empty/provider states and no checksum claim; not changed because the affected detail and restore displays consume the corrected safe checksum projection. Render/browser acceptance remains NOT VERIFIED.
- `/system/backups/[backupId]`: now renders checksum availability from `hasChecksum` and preserves the `RESTORE NOT VERIFIED` posture until an actual successful restore run exists.
- `/system/backups/[backupId]/restore`: shows checksum availability and maintains explicit planned-request/production-denial posture. Requesting the page does not execute a restore.
- **QC-PAGE-F-021 — PARTIAL / OPEN:** transaction-bound adapters, reason persistence, boolean checksum projection, replay fingerprint, and planned-vs-restored source behavior are implemented. The requested failure-injection/rollback/race proof is BLOCKED until PG18 is available; authenticated page and AT acceptance remains NOT VERIFIED. Do not raise the historical score or close the finding until those proofs are accepted.

## Changed paths

- `src/modules/backup-recovery/application/dependencies.ts`
- `src/modules/backup-recovery/application/request-restore.ts`
- `src/modules/backup-recovery/application/validate-restore-request.ts`
- `src/modules/backup-recovery/domain/backup-record.ts`
- `src/modules/backup-recovery/infrastructure/postgres-repository.ts`
- `src/modules/backup-recovery/ports/repository.ts`
- `src/pages/system/backups/[backupId]/index.astro`
- `src/pages/system/backups/[backupId]/restore.astro`
- `tests/integration/system/backup-catalog.test.ts`
- `tests/integration/system/restore-authorization.test.ts`
- `tests/integration/system/system-health.test.ts`
- `tests/integration/system/backup-restore-atomicity-postgres.test.ts` (new)
- `.agents/mind/01-mind-latest.md`
- `workspace-map/` generated inventories

No commit, push, merge, deploy, production migration, external write, or UAT signature was performed.
