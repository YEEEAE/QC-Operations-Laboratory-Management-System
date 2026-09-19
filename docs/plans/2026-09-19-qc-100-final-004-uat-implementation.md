# QC-100-FINAL-004 — Real Users, Unrestricted QC Creation, Two-Stage Workflow, UAT Evidence Ingestion & Automated UAT

> **Mode:** deep-planning (skill `deep-planning` not installed; `writing-plans` used as the planning protocol, adapted to this repo — no commit steps, per the standing no-commit rule).
> **Status:** DRAFT PLAN — pending user confirmation before implementation.
> **Date:** 2026-09-19 · HEAD `31ab21a70ca479e8735d04835b5df62cafc9bc5a` · working tree has pre-existing unrelated changes (preserved).

**Goal:** Six real DB-backed users with enforced RBAC; QC users create every report/form type but can never approve/sign; mandatory QC→Supervisor→QCM workflow with return-for-correction, audit, and post-final lock; a controlled UAT evidence ingestion path writing to `qc.uat_*` + `qc.release_gate_evidence`; a local disposable UAT environment; a full automated scenario suite with real PASS/FAIL evidence.

**Architecture:** Extend the existing clean architecture — domain policies in `src/shared/authorization/policy-registry.ts`, role→permission bundles in `db/seeds/common.ts` (+ a new migration), workflow use cases per module, new `src/modules/uat-evidence/` module for ingestion, and a Playwright/HTTP harness under `scripts/uat/` + `tests/`. All enforcement server-side; UI only reflects capabilities.

**Tech stack:** Astro 4 SSR, Kysely/PostgreSQL 18 (disposable via `scripts/db/disposable-postgres.sh`), pnpm 11.25.0, vitest + Playwright. Local Node is v22.22.3 (outside the declared ≥24.20.0 contract — local results are evidence, not runtime-parity proof).

---

## Reality map (verified on HEAD, drives every task)

| Fact | Source |
|---|---|
| Roles `EMPLOYEE, SUPERVISOR, MANAGER, ADMIN` seeded in migration 0003; `SYSTEM_OWNER` = named-account full bundle refreshed by 0030 | `db/migrations/0003_authorization.sql`, `0030_reject_reports_role_parity.sql` |
| Role→permission bundles live in code | `db/seeds/common.ts` `FOUNDATION_ROLE_PERMISSIONS` |
| Policy registry binds permission→action→entityType→states | `src/shared/authorization/policy-registry.ts` |
| EMPLOYEE lacks `PERM-INSP-CREATE`, `PERM-LAB-CREATE`, `PERM-QUAR-CREATE`, `PERM-INSP-PRINT/EXPORT`, `PERM-LAB-PRINT/EXPORT` | `db/seeds/common.ts` |
| No per-report-type whitelist exists for QC creation (no "QC 01 → Report A only" logic found) — the gap to close is the *missing create grants*, not a type map | rg sweep: registry, routes, actions, migrations |
| Inspection/Lab approval chain is **single-stage**: DRAFT→SUBMITTED→UNDER_REVIEW→{APPROVED\|REJECTED\|RETURNED}; both SUPERVISOR and MANAGER hold `PERM-INSP-APPROVE`/`PERM-LAB-APPROVE` and either can final-approve today | registry lines 421–468; `Documents/STATE-MACHINES.md` |
| Reject Issue Slip has a 3-checkpoint model (SUPERVISOR→QC_MANAGER→FACTORY_DIRECTOR) via `qc.issue_slip_approval_confirmations` | `db/migrations/0026_reject_reports.sql` |
| `qc.uat_*` tables exist (migration 0023, append-only, e-signature-bound acceptance) but **zero write paths** exist in `src/` or `scripts/` | verified by rg |
| `qc.release_gate_evidence` (migration 0022) has **no writer**; gate `uat` requires `source='SIGNED_UAT_CYCLE'` + exact candidate binding | `src/modules/release-governance/domain/release-approval.ts` |
| Five disposable `verify-*` personas + seed/cleanup harness exist; `yazeed` is never seed-managed | `tests/fixtures/verification-personas.ts`, `scripts/verification/` |
| `ApproveReleaseUseCase` reauth + server-derived evidence; fail-closed | `src/modules/release-governance/application/approve-release.ts` |

## Policy decisions recorded (derived from the user's directive + approved docs; nothing invented)

1. **QCM = MANAGER role code** everywhere (code, DB, matrix); display name "QCM" in UAT contexts only.
2. **EMPLOYEE = QC Data Entry User.** Grant missing *create/edit/data-entry* permissions to EMPLOYEE (create inspection, create lab test, create quarantine/receiving, print/export own-scope) — **no approval/sign/review permissions added, ever.**
3. **New two-stage chain for Inspection + Lab:** SUPERVISOR approve (with e-sign) moves `UNDER_REVIEW → PENDING_QCM_APPROVAL`; only MANAGER (or named owner) approves `PENDING_QCM_APPROVAL → APPROVED` (locked). SUPERVISOR loses final-approve on these two entity types; keeps RETURN/REJECT at their stage. MANAGER cannot approve from `UNDER_REVIEW` (no stage skip) but may RETURN from `PENDING_QCM_APPROVAL` to the author.
4. **Owner override:** named `yazeed` may execute any stage transition (existing `isNamedSystemOwner` pattern); override is explicit and audited.
5. **Return-for-correction:** from either review stage → `RETURNED` with mandatory reason, bound to author; resubmit re-enters `SUBMITTED` (Supervisor stage).
6. **UAT sign-off binding:** acceptance writes `qc.uat_acceptances` (signer FK + e-signature FK + snapshot hash) **and** a `release_gate_evidence` row (`uat`, `PASS`, `source='SIGNED_UAT_CYCLE'`) in one transaction — only for a cycle with recorded sessions. Without real human sessions the cycle stays `BLOCKED`/`UNVERIFIED`; automated runs record facilitator sessions and can never flip the release gate.
7. **UAT environment = local disposable PostgreSQL** (`environment='test'` in `qc.uat_cycles`; schema allows `test|staging`). Render/production untouched.

---

## Tasks

### Task 1 — Permission & seed changes: EMPLOYEE full creation, staged approval prep

**Files:**
- Modify: `db/seeds/common.ts` (`FOUNDATION_ROLE_PERMISSIONS`)
- Create: `db/migrations/0031_qc_creation_parity_two_stage_approval.sql`
- Test: `tests/unit/authorization/foundation-role-matrix.test.ts` (extend existing pattern)

- [ ] Step 1: In EMPLOYEE bundle add: `PERM-INSP-CREATE, PERM-LAB-CREATE, PERM-QUAR-CREATE, PERM-INSP-PRINT, PERM-INSP-EXPORT, PERM-LAB-PRINT, PERM-LAB-EXPORT, PERM-EQP-VIEW, PERM-CAL-VIEW, PERM-RPT-RUN, PERM-RPT-EXPORT-CSV` (data-entry scope; **no** `*-APPROVE`, `PERM-APR-*`, `PERM-ESIG-SIGN`).
- [ ] Step 2: Migration 0031 — idempotent upserts aligning DB grants with the new bundle for EMPLOYEE (INSERT … ON CONFLICT DO NOTHING; no deletions).
- [ ] Step 3: Failing-then-passing test: EMPLOYEE bundle contains every create/data-entry permission the matrix declares for QC data entry and **zero** `*-APPROVE`/`PERM-ESIG-SIGN`/`PERM-APR-*` codes. Run: `pnpm vitest run tests/unit/authorization`.

### Task 2 — Two-stage approval state machine (Inspection + Lab)

**Files:**
- Modify: `src/shared/authorization/policy-registry.ts`
- Modify: `src/modules/quarantine/inspection/domain/inspection.ts`, `src/modules/laboratory/domain/*`
- Modify: `db/migrations/0031…sql` (status CHECKs + new state)
- Modify: `src/pages/quarantine/inspections/[inspectionId]/*`, `src/pages/laboratory/tests/[labTestId]/*`
- Test: `tests/unit/authorization/two-stage-approval.test.ts`, `tests/integration/inspection/two-stage-flow.test.ts`

- [ ] Step 1: Add state `PENDING_QCM_APPROVAL` to inspection + lab state vocabularies and DB CHECK constraints.
- [ ] Step 2: Registry — SUPERVISOR stage: approval action on `['UNDER_REVIEW']` transitions to `PENDING_QCM_APPROVAL` (e-sign + SoD vs author). MANAGER stage: `PERM-INSP-APPROVE`/`PERM-LAB-APPROVE` re-scoped to states `['PENDING_QCM_APPROVAL']` → `APPROVED`. `PERM-*-RETURN` allowed from both review states, bound to author. MANAGER `APPROVE` from `UNDER_REVIEW` no longer exists.
- [ ] Step 3: Use cases — split `approve-inspection` into `supervisor-approve` and `final-approve` (MANAGER/owner only, e-sign, SoD); same for lab. `APPROVED` = locked (existing VOID escape + new REOPEN path with mandatory reason, audited).
- [ ] Step 4: UI renders stage-appropriate actions from server-computed capabilities only.
- [ ] Step 5: Tests — full chain Draft→Submitted→Supervisor approve→PENDING_QCM_APPROVAL→QCM approve→Approved/Locked, plus denial of each stage-skip and each wrong-role attempt.

### Task 3 — Reject Reports workflow alignment

**Files:** Modify `src/modules/reject-reports/application/confirm-issue-slip-approval.ts` + domain; Test: `tests/unit/reject-reports/*`

- [ ] Verify checkpoint order SUPERVISOR→QC_MANAGER→FACTORY_DIRECTOR gating: EMPLOYEE holding `PERM-RREJ-CONFIRM-APPROVAL` must not confirm a checkpoint above their stage; add negative tests proving DENIED, and order tests proving QC_MANAGER cannot confirm before SUPERVISOR.

### Task 4 — Six real users + RBAC on the UAT DB

**Files:** Create `scripts/uat/seed-uat-personas.ts` + `scripts/uat/cleanup-uat-personas.ts` (mirrors `scripts/verification/` pattern; passwords only via env vars, never logged)

- [ ] Users: `yazeed` (existing owner — verify only, never mutated), `qcm` (MANAGER, TEAM scope), `supervisor` (SUPERVISOR, TEAM), `qc-01`, `qc-02`, `qc-03` (EMPLOYEE, TEAM scope so they share a work queue).
- [ ] Disposable `UAT-`-prefixed records, 72h expiry, cleanup script.
- [ ] Post-seed assertions: effective permission set per user equals the bundle (query `role_permissions` join), scopes present, accounts ACTIVE.

### Task 5 — UAT evidence ingestion module

**Files:**
- Create: `src/modules/uat-evidence/{domain,application,infrastructure,ports}/*` — create-cycle, record-session, record-defect, accept-cycle use cases
- Modify: `src/modules/release-governance/ports/repository.ts` + `infrastructure/postgres-repository.ts` (gate-evidence writer — currently read-only)
- Create: `scripts/uat/ingest-uat-evidence.ts` (operator CLI; validates kit CSV rows via `validate-uat-records.mjs` rules; transactional writes; every write audited)
- Test: `tests/unit/uat-evidence/*`, `tests/integration/uat-evidence/*`

- [ ] Cycle creation binds release identity (SHA/buildId/version/migration head/environment) + snapshot hash; session insert enforces cycle FK + participant user FK; acceptance requires e-signature id + reauth timestamp; `release_gate_evidence(source='SIGNED_UAT_CYCLE')` written only inside the acceptance transaction.
- [ ] Automated runs write sessions with `participant_code='FACILITATOR-AUTOMATED'` and cycle status `IN_PROGRESS` — never ACCEPTED; release gate `uat` stays UNVERIFIED for automated-only cycles.
- [ ] Retrieval read model + redacted proof query dumped into `audit/`.

### Task 6 — Local UAT environment bring-up

- [ ] `scripts/db/disposable-postgres.sh` cluster → `pnpm db:migrate` (0001→0031) → `db:seed:foundation` → owner grant check → Task 4 seed → `pnpm db:migrate:check` PASS → `pnpm dev` against it. Record the identity block (SHA, buildId, version, migration head, environment `test`).

### Task 7 — Automated UAT scenario suite (Playwright/HTTP)

**Files:** Create `scripts/uat/run-uat-scenarios.ts`, `tests/e2e/uat/*`. Every scenario writes a `qc.uat_session_evidence` row via Task 5.

1. Login ×6 users; wrong-password recovery.
2. **Report-type coverage matrix:** enumerate every creation surface (quarantine receiving, inspection, lab test, NCR, RCA, CAPA, finding, change request, issue slip, daily reject, equipment/calibration/maintenance where role-creatable) → QC-01/02/03 each: HTTP 200 on every create route + successful draft creation per type; capability sets identical across the three.
3. Full chain happy path (inspection + lab test + issue slip) with e-sign at each stage.
4. Return-for-correction from Supervisor and from QCM; reason persisted; resubmit re-enters Supervisor stage.
5. **Negative security over real HTTP (not UI-only):** QC-01 approve → DENIED; QC-02 direct approval API call → DENIED; QC-03 stage-skip submit → DENIED; QC edits APPROVED report → DENIED; Supervisor final-approves at PENDING_QCM → DENIED; QCM approves after Supervisor → ALLOWED; owner override → ALLOWED; cross-scope draft access → DENIED.
6. Lock: mutation on APPROVED → DENIED; REOPEN by MANAGER/owner with reason → audit row present.
7. Audit trail assertions: `qc.audit_events` rows carry user/role/action/entity/prev→new status/timestamp/reason/stage for every transition in the chain.
8. Evidence ingestion + retrieval round-trip (Task 5).

### Task 8 — Defect loop, regression, final report

- [ ] Detect→Fix→Retest→Regression loop; per cycle run `pnpm typecheck`, affected unit/integration suites, `pnpm test:architecture`.
- [ ] Deliverables: `audit/2026-09-19/QC-100-FINAL-004-execution-report.md` (per-item EXECUTED/PASSED/FAILED/BLOCKED + Report Access Matrix) + Mind current-state update.
- [ ] Human sign-off remains the **sole terminal BLOCKER** — stated explicitly, nothing fabricated; cycle stays non-ACCEPTED; gate `uat` stays UNVERIFIED.

---

## Self-review vs. the 22 items

- Items 1–11: Tasks 1–4. Honest note: Supervisor→QCM two-stage is a **workflow change** (code+schema), not just grants; `Documents/STATE-MACHINES.md` + `PERMISSION-MATRIX.md` updates ride in Tasks 1–2.
- Item 4: no per-user/per-type mapping exists; deliverable = documented absence-proof (rg sweep) + closed grant gaps + a coverage-matrix test that fails if any future type mapping appears.
- Items 12–13: Tasks 5–6. Items 14–17: Tasks 7–8. Item 18: terminal blocker isolation. Items 19–20: real verification only. Item 21: Task 8 report format. Item 22: no push/merge/deploy anywhere; no commit steps (standing rule).
- Risks: Node 22 vs contract (local evidence ≠ runtime parity); two-stage change touches approved state-machine docs; Playwright host sandbox may limit browser E2E → HTTP-level fallback via Astro actions is the contingency, recorded as PARTIAL for browser-only checks if so.


