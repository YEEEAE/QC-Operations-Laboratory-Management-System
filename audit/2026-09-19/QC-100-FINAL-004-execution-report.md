# QC-100-FINAL-004 — Execution Report (Tasks 1–8)

**Date:** 2026-09-19 · **Candidate HEAD:** `9e258276a0f851a35c58d150f474bc962e38e12d` (working tree clean at report time; Task 8 fixes in `src/pages/quarantine/inspections/[inspectionId]/review.astro` and `tests/integration/uat-evidence/uat-evidence-ingestion.test.ts` are part of this tree)
**UAT database:** `qc_uat_bringup` on the disposable PostgreSQL 18.6 cluster (`127.0.0.1:55432`, TLS verify-full), migration head `0031`, 77 tables, 0 orphans
**Plan:** `docs/plans/2026-09-19-qc-100-final-004-uat-implementation.md`

> **Terminal status: PARTIAL — the sole terminal BLOCKER is the real human sign-off.**
> No human UAT session, no e-signature, and no `SIGNED_UAT_CYCLE` row exists anywhere.
> All `qc.uat_cycles` rows are non-ACCEPTED (0 of 7) and the `uat` release gate is **UNVERIFIED**
> (0 rows in `qc.release_gate_evidence`). Nothing was fabricated; the automated suite structurally
> cannot flip the gate. No push, merge, deploy, or commit was performed by the agent.

## 1. Regression cycle (Task 8 Detect→Fix→Retest→Regression)

**Detected:** `astro check` on the final tree had 4 errors:
`canApprove` unresolved in the inspection review page (Task 2 residue), and 3 `'pool' is possibly 'undefined'`
in the Task 5 integration test (inconsistent non-null style vs the `pool!` used elsewhere).

**Fixed → Retested:**
- `src/pages/quarantine/inspections/[inspectionId]/review.astro` — `nextAction` now uses the
  two-stage capabilities that actually exist (`canStageApprove` at `UNDER_REVIEW`, `canFinalApprove`
  at `PENDING_QCM_APPROVAL`) instead of the removed single-stage `canApprove`.
- `tests/integration/uat-evidence/uat-evidence-ingestion.test.ts` — the three `pool.query` call
  sites now use `pool!` like the rest of the file.

**Regression evidence (all re-run on the final tree, 0 FAIL):**

| Gate | Result |
|---|---|
| `pnpm typecheck` (astro check) | **846 files / 0 errors** |
| `pnpm test:architecture` | PASS (boundaries + route registry) |
| unit: uat-evidence + authorization + release-governance + approvals | 7 files / **82 PASS** |
| unit: qc-permission-contract + seeds-factories | 2 files / 11 PASS |
| integration (PG 18.6 `qc_uat_t8`): uat-evidence + release-governance | 2 files / **13 PASS** |
| integration (PG 18.6): reject-reports + quarantine | 13 files / **49 PASS** |
| `pnpm uat:scenarios` on `qc_uat_bringup` | **14 PASS / 0 FAIL / 3 NOT RUN / 0 BLOCKED** |
| `db:migrate:check` / `db:schema:check` | `{"status":"ok","migrations":31}` / `31 / 77 tables / 0 orphans` |

**Known boundary:** local Node is `v22.22.3` (`package.json` declares `>=24.20.0 <25`) — evidence is
candidate-level, not runtime-parity proof.

## 2. Per-item status (plan Tasks 1–8)

### Task 1 — Permission & seed changes (EMPLOYEE full creation) — **DONE / PASSED**
`0031_qc_creation_parity_two_stage_approval.sql` + `FOUNDATION_ROLE_PERMISSIONS` extension.
Measured in the UAT DB: EMPLOYEE role carries **14 create/print/export grants** incl.
`PERM-INSP-CREATE, PERM-LAB-CREATE, PERM-QUAR-CREATE, PERM-INSP-PRINT/EXPORT, PERM-LAB-PRINT/EXPORT,
PERM-EQP-VIEW, PERM-CAL-VIEW, PERM-RPT-RUN, PERM-RPT-EXPORT-CSV` and **zero** `*-APPROVE`/`PERM-APR-*`/
`PERM-ESIG-SIGN`. Guarded by `tests/unit/authorization/qc-permission-contract.test.ts` (PASS).

### Task 2 — Two-stage approval state machine — **DONE (code+schema+unit) / integration coverage PARTIAL**
`PENDING_QCM_APPROVAL` state exists in migration 0031 CHECKs, policy registry, inspection + lab
domains; `supervisor-approve` / `final-approve` split with e-signature at the QCM stage; REOPEN path
exists (`reopen-inspection.ts`); review/execute pages render stage-appropriate controls.
Unit contracts PASS (`two-stage-approval-contract.test.ts` 6/6, lab workflow + scientific-governance
PASS). **Gap:** the plan's dedicated `tests/integration/inspection/two-stage-flow.test.ts` was not
found; the live chain (Supervisor→QCM) has unit + policy coverage but no dedicated PostgreSQL
integration file. Listed in §3 as item 5-g.

### Task 3 — Reject Reports workflow alignment — **DONE / PASSED**
Ordered checkpoint gating `SUPERVISOR→QC_MANAGER→FACTORY_DIRECTOR` enforced in domain + use case;
20 unit tests incl. EMPLOYEE cross-stage denials and QCM-before-SUPERVISOR order; 6 integration
tests on the ordered chain PASS.

### Task 4 — Six real users + RBAC — **DONE / PASSED**
`uat:seed`/`uat:clean` + `tests/fixtures/uat-personas.ts`. Measured in the UAT DB: `yazeed`
(ADMIN+SYSTEM_OWNER, ACTIVE, `must_change_password=false`, never seed-managed) and five disposable
`uat-*` accounts (ACTIVE, `must_change_password=true`, 72h expiry) with scopes `OWN`+`TEAM:QC-UAT-TEAM`
(EMPLOYEE) / `GLOBAL`+`TEAM` (QCM, Supervisor). Fail-closed guards proven live in earlier cycles.

### Task 5 — UAT evidence ingestion module — **DONE / PASSED (fail-closed proven)**
`src/modules/uat-evidence/` + `pnpm uat:ingest` CLI; business-key contract fixed and integration
suite **8/8 PASS** on a fresh database; acceptance is fail-closed (an automated-only cycle was
actually refused live: `acceptances=0 gate_rows=0 signatures=0` after the attempt). Gate-evidence
writer added to release-governance, written **only inside the acceptance transaction**.
**Open owner decision carried:** the acceptance signer must hold `GLOBAL` scope (QCM's `TEAM` scope
is denied with `AUTHZ_SCOPE_DENIED`); today that means the human sign-off is owner-executed unless
the owner grants QCM `GLOBAL`. Recorded, not changed.

### Task 6 — Local UAT environment bring-up — **DONE / PASSED**
Full zero→31 migration chain + foundation seed + owner grant + Task 4 seed + `pnpm dev` verified on
`qc_uat_bringup` with identity block (gitSha/buildId/releaseId/version/migration head/environment
`test`); schema checks PASS; re-run today as part of the regression cycle.

### Task 7 — Automated UAT scenario suite — **DONE (executed scope) / PARTIAL (remaining scope honestly NOT RUN)**
`pnpm uat:scenarios` drives the real HTTP surface and writes automated facilitator session evidence
through the Task 5 path. Latest run on the final tree: **14 PASS / 0 FAIL / 3 NOT RUN / 0 BLOCKED**.
Executed: 5 persona logins + wrong-password recovery; 12-route × 3-persona creation matrix (36/36
HTTP 200, identical capability vectors); real receiving draft per persona visible in the register;
authority negatives on a real record (`release/holdReceiving` → `FORBIDDEN`); admin surface closed
(shell denies the form; `admin.createUser` valid-payload → `FORBIDDEN`; **0 accounts created in DB**);
cross-scope edit denied with the owner self-edit positive control and DB-verified record integrity;
audit rows present; Task 5 round-trip keeps the cycle `IN_PROGRESS` with zero gate rows.
**NOT RUN with reasons** (records do not yet reach the required states): full chain with e-signatures
at each stage; return-for-correction round-trip; stage-skip/edit-after-APPROVED/owner-override
negatives beyond the real-record ones; lock+REOPEN; per-transition audit-field assertions;
per-type draft payloads beyond receiving. Method rule enforced throughout: a refusal before
authorization (e.g. `BAD_REQUEST` on a fabricated id) is **never** counted as an authority proof.

### Task 8 — Defect loop, regression, final report — **DONE / PASSED (this report)**
One Detect→Fix→Retest→Regression cycle executed (§1); the two defects found were fixed and all
affected gates re-run green on the final tree.

## 3. Coverage against the plan's 22 self-review items

| # | Item (plan §Self-review) | Status |
|---|---|---|
| 1 | EMPLOYEE creation grants (code+DB) | **PASSED** (Task 1) |
| 2 | No approval/sign for EMPLOYEE (code+DB+tests) | **PASSED** (Task 1; 0 approve/sign measured) |
| 3 | Two-stage state machine (Inspection) | **PASSED** (unit+policy+DB CHECK) |
| 4 | Two-stage state machine (Lab) | **PASSED** (unit) |
| 5 | Dedicated two-stage PostgreSQL integration file | **FAILED (missing)** — not found in tree |
| 6 | Reject checkpoint ordering | **PASSED** (Task 3) |
| 7 | Six real users seeded | **PASSED** (Task 4; measured) |
| 8 | Disposable records + cleanup + expiry | **PASSED** (Task 4) |
| 9 | Post-seed assertions | **PASSED** (Task 4) |
| 10 | Ingestion module (cycle/session/defect) | **PASSED** (Task 5, 8/8 integration) |
| 11 | Acceptance bound to e-signature + transactional gate evidence | **PASSED** (Task 5) |
| 12 | Automated runs never accept a cycle | **PASSED** (Task 5+7, proven live) |
| 13 | Read model + redacted proof dump | **PASSED** (Task 5 CLI `show` + audit dumps) |
| 14 | Local disposable UAT environment | **PASSED** (Task 6) |
| 15 | Identity block recorded | **PASSED** (Task 6) |
| 16 | Automated scenario suite (executed scope) | **PASSED** (Task 7: 14 PASS / 0 FAIL) |
| 17 | Automated suite (remaining scope: full chain, return, stage-skip, lock, per-type drafts) | **NOT RUN** (recorded with reasons) |
| 18 | Per-user/per-type mapping absence-proof | **PASSED** — sweep found no user/type map in `src/`; identical capability vectors measured live |
| 19 | Docs synced with the two-stage change (`Documents/STATE-MACHINES.md`, `PERMISSION-MATRIX.md`) | **FAILED (open)** — `PENDING_QCM_APPROVAL` absent from both documents; Inspection/Lab sections still show the single-stage `UNDER_REVIEW→APPROVED` chain and Supervisor/Manager as interchangeable approvers. Code is ahead of the approved docs; doc sync remains open work. |
| 20 | Honest PASS/FAIL evidence only | **PASSED** (refusal-before-authorization rule; NOT RUN columns) |
| 21 | Execution report format (this file) | **PASSED** |
| 22 | No push/merge/deploy/commit by the agent | **PASSED** (working tree left for the owner) |

## 4. Report Access Matrix (measured from the live UAT database, 2026-09-19)

Effective grants resolved through `role_permissions` for ACTIVE accounts on `qc_uat_bringup`
(duplicate rows in the seed bundle are collapsed by the resolver; counts below are measured):

| Capability | uat-qc-01/02/03 (EMPLOYEE) | uat-supervisor (SUPERVISOR) | uat-qcm (MANAGER) | yazeed (SYSTEM_OWNER) |
|---|---|---|---|---|
| Distinct effective permissions | 106 | 170 | 128 | 255 |
| Approve-family grants (`PERM-APR-*`) | **0** | 6 | 8 | 6 |
| E-signature (`PERM-ESIG-SIGN`) | **0** | 2 | 2 | 1 |
| Create-family grants | 14 | 18 | 10 | 18 |
| Scopes | `OWN` + `TEAM:QC-UAT-TEAM` | `GLOBAL` + `TEAM` | `GLOBAL` + `TEAM` | `GLOBAL` (canonical owner) |

Key segregation points (measured, not asserted):
- **EMPLOYEE holds zero approve/sign grants** — the data-entry persona can create all 12 surfaced
  report types (verified live in Task 7: 12/12 routes × 3 personas, identical vectors) but can never
  approve, release, or sign. Proven twice: grants-side (0 in DB) and behavior-side
  (`release/holdReceiving` on a real record → `FORBIDDEN`; `admin.createUser` → `FORBIDDEN`).
- **Supervisor keeps stage-1 only.** Holds `PERM-INSP-APPROVE` + `PERM-ESIG-SIGN` (stage approval)
  but the policy registry no longer allows final-approve from `UNDER_REVIEW`; `PERM-APR-APPROVE`
  belongs to QCM/owner.
- **QCM = MANAGER** with `PERM-APR-APPROVE` + `PERM-ESIG-SIGN` (final approval ceremony).
- **UAT-cycle acceptance** is `GLOBAL`-scoped (see Task 5 note): `yazeed` can sign; `uat-qcm`
  (TEAM) is denied — open owner decision, unchanged behavior.

## 5. Evidence-state truth (queried, 2026-09-19, `qc_uat_bringup`)

```
uat_cycles=7 accepted=0
gate_evidence_rows=0            (qc.release_gate_evidence — uat gate UNVERIFIED)
electronic_signatures=0
uat_acceptances=0
uat_session_evidence: 77 automated / 0 human
```

## 6. Terminal blocker (unchanged, nothing fabricated)

**Real human UAT + authorized sign-off is the sole terminal BLOCKER.** The plan, the UAT acceptance
plan (`Documents/UAT-ACCEPTANCE-PLAN.md`), and the ingestion module all require real human
participant sessions and a reauthenticated, e-signature-bound acceptance by a signer with release
authority. None exists; the automated path structurally cannot produce one (fail-closed acceptance,
automated rows carry `participant_code='FACILITATOR-AUTOMATED'`, gate row is written only inside the
acceptance transaction). The `uat` release gate therefore remains **UNVERIFIED** and no cycle is
ACCEPTED. The controlled kit (`audit/100-percent/uat/UAT-COVERAGE-MATRIX.csv`, 30 rows `NOT EXECUTED`)
was left untouched by automation — only real human sessions may write it.

## 7. Open items for the owner

1. **Doc sync:** update `Documents/STATE-MACHINES.md` + `PERMISSION-MATRIX.md` for the two-stage
   chain (code and DB are ahead of the approved documents).
2. **Two-stage integration test file:** add the dedicated `tests/integration/inspection/two-stage-flow.test.ts`
   (unit + policy + DB CHECK coverage exists today).
3. **Signer scope decision:** either grant QCM `GLOBAL` (or a suitable scope) for UAT acceptance, or
   confirm the named owner executes the sign-off.
4. **Remaining automated scenarios** (full chain, return-for-correction, stage-skip/lock negatives,
   per-type drafts) once records can be driven to those states.
5. **Node runtime parity:** local Node `v22.22.3` is outside the declared `>=24.20.0 <25` contract.

## 8. Evidence index

- `audit/2026-09-19/QC-100-FINAL-004-task5-uat-ingestion-closure.md`
- `audit/2026-09-19/QC-100-FINAL-004-task6-local-uat-bringup.md` (+ `...-task6-uat-bringup-evidence.json`)
- `audit/2026-09-19/QC-100-FINAL-004-task7-uat-scenarios.md` (+ `...-task7-uat-scenarios-evidence.json`)
- `audit/2026-09-19/QC-100-FINAL-004-human-uat-signoff.md` (terminal blocker record)
- This file: `audit/2026-09-19/QC-100-FINAL-004-execution-report.md`
