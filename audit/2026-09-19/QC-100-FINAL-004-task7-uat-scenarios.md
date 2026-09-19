# QC-100-FINAL-004 — Task 7: Automated UAT scenario suite (HTTP)

**Status:** PARTIAL — suite runs green end to end; the plan's items 1, 2, 5 (partially), 8 are
executed against the real application, items 3, 4, 6, 7 and the remainder of item 5 are NOT RUN
with reasons recorded below.

**Date:** 2026-09-19
**Candidate identity (measured from the working tree):** gitSha `fa724dec9e2ce6c4f61addd2e5060837633ffd1c` ·
buildId `uat-scenarios-fa724dec9e2c` · releaseId `rel-fa724dec9e2ce6c4` · applicationVersion `0.1.0`
**Migration head of the UAT database:** `0031`
**Environment:** `test` (local disposable PostgreSQL 18.6, `qc_uat_bringup`, TLS `verify-full`)
**Runner:** `pnpm uat:scenarios` → `scripts/uat/run-uat-scenarios.ts`
**Evidence:** `audit/2026-09-19/QC-100-FINAL-004-task7-uat-scenarios-evidence.json`

## Result

| Metric | Value |
|---|---|
| Automated scenarios | 14 PASS / 0 FAIL / 3 NOT RUN / 0 BLOCKED |
| Creation-route coverage rows | 36 (12 routes × QC-01/02/03) — all HTTP 200, capability sets identical |
| Negative probes executed | 17 (6 auth-denied, 11 refused before authorization → reported NOT RUN) |
| Session evidence written | one `qc.uat_session_evidence` row per executed scenario (13) via the Task 5 path |
| Cycle state after the run | `IN_PROGRESS`; `qc.release_gate_evidence` rows for `uat` = **0** |
| `uat` release gate | **UNVERIFIED** (unchanged) |

## What was executed and proven

1. **Login ×5 disposable personas + wrong-password recovery** — each persona establishes a real
   session (`/dashboard` 200); a rejected password produces no session and the sign-in page reports
   the refusal. `yazeed` (named owner) is not seeded by the harness, so it is intentionally absent.
2. **Creation capability matrix** — all 12 create routes discovered in `src/pages` return HTTP 200
   for QC-01/02/03 with **identical ordered status vectors**, and one real receiving draft is created
   per persona over `/_actions/quarantine.createReceiving` and then found in the register.
3. **N-UAT-02 — admin surface closed** — the `/admin/users/new` shell renders the denial section
   (not the create form) for all three QC personas, and `admin.createUser` with a *valid* payload is
   refused with `FORBIDDEN` for all three. Verified in the database: **0** accounts created.
4. **N-UAT-01 — authority negatives on a real record** — `quarantine.releaseReceiving` and
   `quarantine.holdReceiving` against a receiving actually owned by `uat-qc-01` are refused with
   `FORBIDDEN`. This is the strongest authority evidence produced, because the record exists and is
   visible to the actor, so the request reaches the authorization boundary.
5. **Cross-scope draft mutation** — the owner's self-edit of the same draft succeeds (positive
   control), the outsider's edit is refused, and the stored row is verified unchanged
   (`receiving_no` = the owner's value, `version` = 2, outsider mutation = false).
6. **Audit trail** — `qc.audit_events` carries `CREATE_RECEIVING` and `UAT_CYCLE_CREATED` rows for
   every controlled write performed by the suite.
7. **Task 5 round-trip** — the run creates its own append-only cycle, ingests session evidence
   through `pnpm uat:ingest`, and the cycle stays `IN_PROGRESS` with zero gate rows: automated
   evidence can never flip the `uat` gate.

## Honest method notes (why some checks say NOT RUN)

- **Refusal ≠ authority proof.** A refusal that happens before authorization (input validation, or a
  record that does not exist) proves nothing, so it is reported `INCONCLUSIVE`/`NOT RUN`, never PASS.
  Six of the seven fabricated-id probes (`approveInspection`, `finalApproveInspection`,
  `laboratory.approve`, `documents.approve`, `releaseGovernance.approveRelease`, `admin.createUser`)
  fail in this category and are **not** counted as evidence of denial.
- **Page shells are default-deny by design.** `/admin/users/new` answers HTTP 200 for everyone and
  simply omits the form; the test therefore asserts on the rendered form, not the status code.
- **Astro action responses are devalue-serialized** (`[{field: index}, …]`); the suite reads record
  ids through `scripts/uat/scenario-support.ts`, and that decision logic is unit tested
  (`tests/unit/uat-evidence/uat-scenario-support.test.ts`, 28 tests).
- **The controlled UAT kit matrix is untouched.** `audit/100-percent/uat/*` (manifest, coverage
  matrix, defect backlog) is deliberately not written by automation: only real human sessions may
  produce human UAT records.

## NOT RUN — remaining Task 7 scope (with reasons)

| Plan item | State | Reason / what is needed |
|---|---|---|
| 3. Full chain happy path (inspection + lab test + issue slip) with e-signature at each stage | NOT RUN | Needs the receiving→inspection→lab lifecycle drivers plus a real e-signature ceremony; not implemented in this suite yet. |
| 4. Return-for-correction from Supervisor and QCM; reason persisted; resubmit re-enters the stage | NOT RUN | Depends on item 3 reaching `UNDER_REVIEW`/`PENDING_QCM_APPROVAL`. |
| 5. Stage-skip submit, edit of an APPROVED report, Supervisor final-approve at PENDING_QCM, QCM approve after Supervisor, owner override | NOT RUN | All require records driven to those exact states (item 3). Only the real-record release/hold denials and the admin denial are proven today. |
| 6. Lock on APPROVED + REOPEN by MANAGER/owner with reason + audit row | NOT RUN | Requires a record in `APPROVED` state. |
| 7. Per-transition audit assertions (user/role/action/prev→new state/reason/stage) | NOT RUN | Only aggregate audit-row counts are asserted today; field-level assertions need the lifecycle trace from item 3. |
| 2 (rest). Successful draft creation per report type (NCR, CAPA, finding, change request, issue slip, daily reject, lab test, equipment/calibration/maintenance) | NOT RUN | Route availability is proven for all 12; per-type payloads are only automated for the receiving surface. |

## Verification commands

```
pnpm uat:scenarios                 # 14 PASS / 0 FAIL / 3 NOT RUN (this report's evidence)
pnpm vitest run tests/unit/uat-evidence        # 28 tests
pnpm typecheck                     # 0 errors
pnpm test:architecture             # boundary + route registry checks PASS
```

## Boundaries

- Node on this machine is `v22.22.3`, outside the `>=24.20.0 <25` contract: local evidence is not
  runtime parity.
- No human session, no e-signature and no `SIGNED_UAT_CYCLE` exists in any database, so the `uat`
  release gate remains **UNVERIFIED** and no cycle is `ACCEPTED`.
- Nothing was pushed, merged, deployed, or committed.
