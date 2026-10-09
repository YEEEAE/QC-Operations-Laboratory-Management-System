# QC Global Electronic Signature — Action × Signer × Meaning Map

**Status:** APPROVED / EFFECTIVE — owner-approved 2026-10-09, effective 2026-10-09  
**Revision:** `QC-GESAP-ACTION-MAP-v1` (repository registration label)  
**Basis:** `Documents/QC-GLOBAL-ELECTRONIC-SIGNATURE-POLICY.md` (owner-approved functional requirement)

> **Approval record.** The system owner approved this map in full on 2026-10-09
> ("اعتمد الخريطة كامله تاريخ السريان اليوم") with an effective date of 2026-10-09.
> Approved rows now bind implementation and acceptance; every row without an explicit, wired
> transition stays fail-closed (`UNRESOLVED`) in source until it is implemented and verified.
> This is an owner approval; it is not an independent QMS/Security/Release test result and does
> not by itself score any module (policy §9).

## 0. Activation log

| Date | Change | Evidence |
|---|---|---|
| 2026-10-09 | Map approved in full; effective 2026-10-09. | Owner instruction recorded in this session. |
| 2026-10-09 | Central registry added: `src/modules/approvals/application/signature-policy-registry.ts`. | `pnpm typecheck` 0 errors; `tests/unit/approvals/signature-policy-registry.test.ts` PASS. |
| 2026-10-09 | Change-request authorization requires an account-bound signature (`Authorize change request {id}`); RETURN/REJECT stay unsigned workflow refusals. | focused unit 7/7 and approvals/documents/change-requests units 25/25 PASS; approvals integration 41 PASS / 9 skipped / 2 suites BLOCKED (Docker unavailable). |
| pending | Controlled document version approval (rows 13–14) still blocked: `ApproveVersionUseCase` is `POLICY_SOURCE_REQUIRED` pending document approval authority/effectivity (PD-13/RD-019). | source unchanged. |

## 1. Signer model (from policy §3)

| Role | Allowed signing scope | Required extra grants |
|---|---|---|
| QC01–QC04 / Employee | None — create/update eligible records and submit for review only. | — |
| Supervisor | Preliminary/stage-1 approval; return/reject where the workflow permits. | subject permission + `PERM-ESIG-SIGN` + `PERM-APR-REVIEW`/`PERM-APR-RETURN` where applicable |
| QCM / Manager | Final approval across applicable workflows; preliminary only where explicitly permitted. | subject permission + `PERM-APR-APPROVE` + `PERM-ESIG-SIGN` |
| System Owner — named `yazeed` | Full authority; explicit, justified, audited overrides only. | named-owner resolution (`SYSTEM_OWNER` + `loginIdentity === 'yazeed'`) |
| Admin | No QC approval authority through the Admin role. | — |

Rules: independent stages must not be silently satisfied by one person; overrides are recorded
as exceptions, never as independent approvals; every signature reauthenticates, binds the exact
record version and action meaning, and commits atomically with the transition, audit and outbox.

## 2. What requires a signature (decision rule)

- **REQUIRED** — formal approval, disposition, authorization, verification, closure, release, or
  controlled decision on a live controlled record.
- **NOT_REQUIRED** — opening a page, entering draft data, search/filter, viewing a report, ordinary
  exports, and routine draft edits (policy §2, §5).
- **UNRESOLVED / fail-closed** — no approved meaning or authority mapping exists yet.

## 3. The map

Status codes: `IMPLEMENTED` (source enforces version-bound signature), `UNRESOLVED` (source
fail-closed), `NOT_IMPLEMENTED` (no signature path today), `N/A` (routine, not a controlled
decision).

| # | Module | Subject type | Event / decision | Pre-state | Stage / signer | Required authority | Proposed signature meaning | Current status |
|---|---|---|---|---|---|---|---|---|
| 1 | Inspection Reports | `INSPECTION_REPORT` | `STAGE1_APPROVE` | `UNDER_REVIEW` | Supervisor | `PERM-INSP-APPROVE` + `PERM-ESIG-SIGN` | `Stage 1 approval: inspection report {no} v{v}` | IMPLEMENTED |
| 2 | Inspection Reports | `INSPECTION_REPORT` | `FINAL_APPROVE` | `PENDING_QCM_APPROVAL` | QCM / named owner | `PERM-APR-APPROVE` + `PERM-ESIG-SIGN` | `Final approval: inspection report {no} v{v}` | IMPLEMENTED |
| 3 | Laboratory Tests | `LAB_TEST` | `STAGE1_APPROVE` | `UNDER_REVIEW` | Supervisor | `PERM-LAB-APPROVE` + `PERM-ESIG-SIGN` | `Stage 1 approval: lab test {no} v{v}` | IMPLEMENTED |
| 4 | Laboratory Tests | `LAB_TEST` | `FINAL_APPROVE` | `PENDING_QCM_APPROVAL` | QCM / named owner | `PERM-APR-APPROVE` + `PERM-ESIG-SIGN` | `Final approval: lab test {no} v{v}` | IMPLEMENTED |
| 5 | Retests | `LAB_TEST` | `AUTHORIZE_RETEST` | eligible states | Supervisor / QCM | `PERM-LAB-RETEST` or `PERM-LAB-AUTHORIZE-RETEST` | `Authorize retest for lab test {no}` | NOT_IMPLEMENTED |
| 6 | CAPA | `CAPA` | `CLOSE` | pre-close states (P-04) | Supervisor | `PERM-CAPA-CLOSE` + `PERM-ESIG-SIGN` | `Close CAPA {capaNo}, version {v}` | IMPLEMENTED |
| 7 | CAPA | `CAPA` | plan approval / effectiveness verification | `AWAITING_VERIFICATION`, `EFFECTIVENESS_REVIEW` | QCM / named owner | `PERM-CAPA-APPROVE` + `PERM-ESIG-SIGN` | `Approve CAPA {capaNo} effectiveness, version {v}` | NOT_IMPLEMENTED |
| 8 | NCR | `NCR` | review, disposition, closure | `UNDER_INVESTIGATION`→`CLOSED` | Supervisor review + QCM final | `PERM-NCR-REVIEW` / `PERM-NCR-APPROVE` / `PERM-NCR-CLOSE` | `Approve NCR {ncrNo} disposition` / `Close NCR {ncrNo}` | NOT_IMPLEMENTED |
| 9 | RCA | `RCA` | review and approval | `SUBMITTED` | Supervisor review + QCM approval | `PERM-RCA-REVIEW` / `PERM-RCA-APPROVE` | `Approve RCA {rcaNo}` | NOT_IMPLEMENTED |
| 10 | Findings | `FINDING` | formal review, disposition, closure | `UNDER_REVIEW` | Supervisor / QCM | `PERM-FIND-REVIEW` / `PERM-FIND-CLOSE` | `Review finding {findingNo}` / `Close finding {findingNo}` | NOT_IMPLEMENTED |
| 11 | Receiving | `RECEIVING_ITEM` | `RELEASE` | `RELEASE_PENDING` | Supervisor / QCM / named owner | `PERM-QUAR-RELEASE` + `PERM-ESIG-SIGN` | `Authorize release of receiving {receivingNo}` | NOT_IMPLEMENTED |
| 12 | Receiving | `RECEIVING_ITEM` | HOLD / release authorization | eligible states | Supervisor / QCM | `PERM-QUAR-HOLD` / `PERM-QUAR-RELEASE` | `Place/clear HOLD on receiving {receivingNo}` | NOT_IMPLEMENTED |
| 13 | Controlled Documents | `DOCUMENT_VERSION` | `APPROVE` | `IN_REVIEW` | QCM / named owner | `PERM-DOC-APPROVE` / `PERM-APR-APPROVE` + `PERM-ESIG-SIGN` | `Approve controlled document {docId} revision {revision}` | UNRESOLVED |
| 14 | Controlled Documents | `DOCUMENT_VERSION` | effectivity / supersede | `APPROVED` / `EFFECTIVE` | Document Control / QCM | `PERM-DOC-SUPERSEDE` + `PERM-ESIG-SIGN` | `Make revision {revision} effective` / `Supersede revision {revision}` | UNRESOLVED (effectivity deny-by-default) |
| 15 | Change Requests | `CHANGE_REQUEST` | `APPROVE` / `REJECT` / `RETURN` | `UNDER_REVIEW` | QCM review + approval | `PERM-CHG-APPROVE` / `PERM-CHG-REJECT` / `PERM-CHG-RETURN` + `PERM-ESIG-SIGN` | `Authorize change request {crId}` | IMPLEMENTED (APPROVE signed; RETURN/REJECT unsigned refusals) |
| 16 | Inspection Template Versions | `INSPECTION_TEMPLATE_VERSION` | `APPROVE` / `STOP` / `VOID` / `SUPERSEDE` | `DRAFT` / `APPROVED` / `STOPPED` | QCM / template authority | `PERM-ADM-TEMPLATES` + `PERM-ESIG-SIGN` | existing template meanings (see `template-ceremony.ts`) | IMPLEMENTED |
| 17 | Equipment | `EQUIPMENT` | `RETURN_TO_SERVICE` / eligibility decision | `UNDER_MAINTENANCE` / `OUT_OF_SERVICE` | Supervisor / QCM | `PERM-EQP-CHANGE-STATUS` + `PERM-ESIG-SIGN` | `Return equipment {eqId} to service` | NOT_IMPLEMENTED |
| 18 | Calibration | `CALIBRATION_RECORD` | review / `APPROVE` | `SUBMITTED` | Supervisor / QCM | `PERM-CAL-REVIEW` / `PERM-CAL-APPROVE` + `PERM-ESIG-SIGN` | `Approve calibration record {calId}` | NOT_IMPLEMENTED |
| 19 | Maintenance | `MAINTENANCE_RECORD` | verification / release-to-use | `IN_PROGRESS` | Supervisor / QCM | `PERM-MNT-COMPLETE` + `PERM-ESIG-SIGN` | `Verify maintenance {mntId} and release to use` | NOT_IMPLEMENTED |
| 20 | Tasks | `TASK` | formal acceptance / closure *where policy requires* | `IN_PROGRESS` | policy-dependent | `PERM-TASK-COMPLETE` | `Accept/close task {taskId}` | N/A unless a task family is designated controlled |
| 21 | Reports & Exports | `REPORT` | formal report approval *where required* | `ACTIVE` | policy-dependent | `PERM-RPT-*` | `Approve report {reportCode} run {runId}` | N/A for ordinary exports; formal approval UNRESOLVED |
| 22 | Administration | high-risk admin events | administrative approval *where explicitly governed* | policy-dependent | named owner | policy-dependent | policy-dependent | NOT_IMPLEMENTED |
| 23 | Backup & Recovery | `BACKUP_RESTORE` | authorized production restore / recovery | `CREATED` / `VERIFIED` | named owner | `PERM-BKP-RESTORE-PRODUCTION` | existing production-recovery authorization evidence | IMPLEMENTED |
| 24 | Release Governance | `RELEASE_CANDIDATE` | formal authorization | pre-approval states | Manager / named owner (P-07) | `PERM-APR-APPROVE` + `PERM-ESIG-SIGN` | `Approve production release {releaseId} at {sha} build {buildId}` | IMPLEMENTED |
| 25 | Release Governance | `RELEASE_CANDIDATE` | applicable exceptions | policy-dependent | named owner | policy-dependent | explicit recorded exception (not a silent bypass) | UNRESOLVED |
| 26 | Reject Reports / Issue Slips | `REJECT_REPORT` / `ISSUE_SLIP_APPROVAL` | review, rejection confirmation, approval stages | `ISSUED` → `FINALIZED` | Issue-Slip chain (Supervisor → QCM → Factory Director per source) | `PERM-RREJ-CONFIRM-APPROVAL` | today: creator-recorded **attestation**, not an e-signature | NOT_IMPLEMENTED as signatures |
| 27 | UAT | `UAT_CYCLE` | acceptance | `IN_PROGRESS` | release authority | `PERM-APR-APPROVE` + `PERM-ESIG-SIGN` | `Accept UAT cycle {cycleId} for release {releaseId} at {sha}` | IMPLEMENTED |

## 4. Open decisions required from Owner / QMS (blocking)

1. **Policy revision ID + effective date** for the global policy and this map.
2. **Approve/adjust the proposed meanings** in §3 (wording is presentation-level but is part of the
   signed evidence, so it must be approved once).
3. **Scope of signing for non-approval decisions** — the policy text says `REJECT / RETURN / REOPEN /
   VOID / RELEASE / AUTHORIZE_RETEST` need a separate decision before signatures become mandatory.
   Confirm which of these are signed, and at which stage.
4. **Override boundary** — the exact, justified, audited override semantics for the named owner
   (policy §3), and the explicit statement that overrides are never represented as independent
   approvals.
5. **Scientific-source exception** — whether any signature path is exempt when the approved source
   is absent (default: no exemption; stay fail-closed).
6. **Document effectivity / retention** — `PD-13`, `RD-019`, `PD-32` boundaries for documents and
   the release-gate map.

## 5. Phased activation plan

| Phase | Scope | Code touch | Exit evidence |
|---|---|---|---|
| 0 | This map approved (revision + effective date) | docs only | owner approval recorded |
| 1 | Central signature-policy registry + Documents + Change Requests | `src/shared/authorization/`, `src/modules/approvals/`, `documents`, `change-requests` | focused unit + PG18 approval/rollback/replay + browser |
| 2 | Quality: NCR, RCA, Findings, CAPA plan/effectiveness | `src/modules/quality/*` | unit + PG18 + SoD/version |
| 3 | Quarantine: Receiving release/HOLD, Inspection/template alignment | `quarantine/receiving`, `quarantine/inspection` | unit + PG18 + SoD |
| 4 | Assets: Equipment return-to-service, Calibration, Maintenance | `src/modules/assets/*` | unit + PG18 |
| 5 | Reject Reports, Backup/Recovery, Release exceptions, Administration | `reject-reports`, `backup-recovery`, `release-governance`, `administration` | unit + PG18 + parity |
| 6 | Reports/exports formal approval, Tasks where designated | `reporting`, `tasks` | policy decision + unit |
| 7 | Global verification | all | per-module rubric; no score without passing tests |

**Scoring rule (policy §9):** a module receives no verified approval/signature completion score
until its rows in §3 are `REQUIRED` with an approved meaning and its tests pass with evidence on
the frozen candidate. `PASS ≠ RELEASED`.

## 6. What is explicitly NOT claimed

- No code, permission, migration or production change is made by this document.
- No signer, meaning, revision or effective date is invented; every unapproved row stays fail-closed.
- Existing implemented modules are not automatically "policy-complete": they still need the §9
  test matrix (unauthorized denial, version binding, sequence, reauthentication, concurrency,
  override behavior, correction after signing).
