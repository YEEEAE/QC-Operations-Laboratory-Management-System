# QC-100-FINAL-004 — Task 5 closure: controlled UAT evidence ingestion

> **Date:** 2026-09-19 · **Candidate:** `04004eec154d4ddb4bd512c144d8efba05b23bae` (`main`, Task 5 changes in the working tree)
> **Scope:** close the Task 5 ingestion module — fix the two defects that made its PostgreSQL suite fail, verify the suite green, and exercise the operator CLI on the local bring-up database. No production, Render, or shared database was touched.

## Result

| Gate | Result |
|---|---|
| `tests/integration/uat-evidence` | **8/8 PASS** (was 1/8) |
| `tests/unit/uat-evidence` | 17/17 PASS |
| `pnpm typecheck` | 0 errors |
| `pnpm test:architecture` | PASS |
| `tests/unit/{release-governance,authorization,approvals,uat-evidence}` | 70/70 PASS |
| `tests/integration/{release-governance,database}` | 9 files / 34 PASS |
| Live operator CLI cycle (`pnpm uat:ingest`) | PASS — create → sessions → defects → show; acceptance correctly refused |

**State: `DONE` for the ingestion module (verification closed on a disposable PostgreSQL 18.6 database).** The wider QC-100-FINAL-004 goal is unchanged: human UAT, sign-off, and the `uat` release gate remain open and `UNVERIFIED`.

## Defects found by the failing suite, and the fixes

### 1. Business cycle identifier resolved through a UUID-keyed lookup

`qc.uat_cycles` has an internal UUID primary key (`id`) **and** a business identifier (`cycle_id`, e.g. `UAT-INT-001`). Five repository methods (`getEvidenceSummary`, `listSessions`, `listDefects`, `recordSession`, `recordDefect`) resolved their input through `getCycle()`, which filtered `WHERE id = $1`. Every caller passed the business identifier, so the very first session write died with `invalid input syntax for type uuid: "UAT-INT-001"`, and the failures cascaded into "no sessions → acceptance refused for the wrong reason".

Fix: the contract now addresses a cycle **only** by its business identifier — the UUID-keyed `getCycle` was removed from the port, the implementation, and the unit-test fake, so the mistake cannot recur. The two internal call sites that were passing the internal UUID (`AcceptUatCycleUseCase`, `GetUatCycleEvidenceUseCase`) now pass `cycle.cycleId`, which is what the fresh load already had.

### 2. Acceptance violated the cycle execution-window constraint

Every acceptance failed with `new row for relation "uat_cycles" violates check constraint "uat_cycles_check"`: the transaction set `execution_ended_at` while `execution_started_at` was still NULL, and migration 0023 requires `execution_ended_at >= execution_started_at`.

Fix: closing the execution window now derives a start from evidence rather than inventing one — the existing `execution_started_at`, else the earliest recorded session's `started_at`, else the reauthentication moment. The end is the server-side transition time.

### 3. Two fixture defects in the Task 5 integration test

- Three e-signature ids contained non-hex characters (`…bs01`/`bs02`/`bs03`), so the fixture `INSERT` into `qc.electronic_signatures` could never succeed. Now valid hex (`…ab01`/`ab02`/`ab03`).
- The audit assertion expected `>= 5` rows where exactly 4 are written (1 cycle + 2 sessions + 1 defect); the rejected duplicate session is denied before any write. Now asserted exactly, with the arithmetic recorded in the test.

Files changed: `src/modules/uat-evidence/ports/repository.ts`, `.../infrastructure/postgres-repository.ts`, `.../application/use-cases.ts`, `tests/integration/uat-evidence/uat-evidence-ingestion.test.ts`, `tests/unit/uat-evidence/uat-evidence.test.ts`.

## Live operator CLI proof (bring-up database `qc_uat_bringup`)

Exercised the real operator path with synthetic, untracked kit inputs (`.tmp/uat-cli/{sessions,defects}.csv`, automated facilitator rows — clearly not human participants):

```
pnpm uat:ingest create-cycle --cycle-id UAT-2026-09-19-LIVE-001 … --environment test --in-progress true
  → cycle created: id=01a0b957-3926-7f12-b821-a44bc27900f5 status=IN_PROGRESS
    snapshotHash=68011ac2970313277cae4f4f25686c1350d78bba699a5323c2be5021d6cfc081
pnpm uat:ingest record-sessions … → UAT sessions recorded: 2
pnpm uat:ingest record-defects  … → UAT defects recorded: 1
pnpm uat:ingest show …          → status IN_PROGRESS, sessionCount 2, humanSessionCount 0,
                                  openCriticalDefectCount 0, releaseGateStatus UNVERIFIED
pnpm uat:ingest accept --outcome ACCEPTED … → refused (exit 1)
```

Database truth after the attempt: `cycles=1 sessions=2 defects=1 acceptances=0 gate_rows=0 signatures=0`, with audit rows `UAT_CYCLE_CREATED`, `UAT_SESSION_RECORDED ×2`, `UAT_DEFECT_RECORDED`. An automated-only cycle therefore cannot flip the release gate, and no synthetic acceptance exists anywhere. The CLI's production guard also refused a render.com-looking `DATABASE_URL`.

## Finding requiring an owner decision: scope of the acceptance signer

The acceptance ceremony authorizes with `scope: {}` on entity `UAT_CYCLE`, exactly as `ApproveReleaseUseCase` does on `RELEASE_CANDIDATE`. Because `evaluateScope('GLOBAL', …)` returns true while `TEAM` requires `entity.teamId` (a UAT cycle carries no team context), the practical consequence is:

- the named owner `yazeed` (GLOBAL) can sign acceptance;
- the Task 4 `uat-qcm` persona (MANAGER, `TEAM:QC-UAT-TEAM`) is denied with `AUTHZ_SCOPE_DENIED` — fail-closed, not a bug in the check order.

This is consistent with the approved release-authority pattern, so it was **not** changed. It does mean the human sign-off in Task 7 will be owner-executed unless the owner approves a GLOBAL grant for the QCM persona. Recorded here as an open decision rather than silently altered.

## Limits

- No real human UAT session, no e-signature ceremony by a human, and no signed cycle exist; `release_gate_evidence(source='SIGNED_UAT_CYCLE')` has never been written in any database. The `uat` gate stays `UNVERIFIED`.
- Local Node is `v22.22.3`, outside the declared `>=24.20.0 <25` contract; this is local evidence, not runtime-parity proof.
- The full integration suite was not re-run (its pre-existing unrelated failures are documented in the Mind); the affected suites were run instead.
- Nothing was pushed, merged, or deployed, and no migration was applied anywhere outside the disposable local cluster.
