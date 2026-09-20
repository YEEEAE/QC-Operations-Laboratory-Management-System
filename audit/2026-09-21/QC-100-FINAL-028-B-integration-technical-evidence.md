# QC-100-FINAL-028-B — Integration and technical evidence

**Work status: PARTIAL.** Source review, focused local contracts, typecheck, and the candidate build are complete. The required populated PostgreSQL edge suite could not execute because Docker is unavailable and the sandbox denies PostgreSQL shared memory. No policy-blocked edge was opened, no implementation gap with an approved source was found, and no audit score or domain denominator changed. Human acceptance execution is excluded.

## Candidate, runtime, build, and schema identity

| Identity | Value |
|---|---|
| Frozen candidate before B | Git SHA `32652b93de4d4dede9f5427c47a3cb940a8f168e` (`main`, clean, equal to `origin/main`) |
| Final Git SHA | `32652b93de4d4dede9f5427c47a3cb940a8f168e` (no commit created) |
| Content dirty fingerprint | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`; SHA-256 of the empty set of implementation/test paths. Fingerprint method is sorted `path NUL status NUL SHA256(file bytes)` joined by LF; excludes `audit/**` and `.agents/mind/**`. No source/test path is dirty. |
| Runtime | Node `v24.20.0`, pnpm `11.25.0`; Node meets declared `>=24.20.0 <25`. |
| Service/application version | `0.1.0` / `0.1.0` |
| Build | `pnpm build` PASS, 2026-09-20T21:39:18Z–21:39:21Z; Astro SSR server build. Existing warnings: Zod annotations, unused stream import, dynamic/static template-state import, and large client chunk. |
| Release identity | `rel-068a28d3d71b279c`; build `local-32652b93de4d`; timestamp `2026-09-20T21:39:22.113Z`; `dirty=false`; `pnpm release:verify` PASS for exact SHA. Artifact `dist/server/entry.mjs`, SHA-256 `e5a6a2275d67272ef0f5f7126dd993b60a4898593770f4e4b9a072f464cac380`. |
| Source schema identity | `0031_qc_creation_parity_two_stage_approval`, checksum `44b160a6b8c09769fd7f18e19c29b2e29c98635cbf81de603a2cbbbd6324ec61`. Applied schema: **NOT VERIFIED**; this phase ran no migration or database check. |
| Evidence times | Focused DB-attempt start `2026-09-20T21:38:13Z`; unit + typecheck `2026-09-20T21:38:40Z`–`21:38:53Z`; build/release `21:39:18Z`–`21:39:22Z`; all UTC. |

The comparison baseline remains the 2026-09-19 candidate `653b58d22d4a17994db7376a3bd691ca6e789f1a`, maturity 45.8%, gates 0/19, NO-GO. None of these local results changes that status or establishes compliance certification.

## Prerequisite and handoff verification

- The QC-100-FINAL-028-A handoff exists at `audit/2026-09-21/QC-100-FINAL-028-A-core-contracts.md`. Its candidate source fingerprint and changed implementation paths are present at this frozen HEAD; the changes are committed in the candidate. A's focused 9/9 and typecheck evidence remains historical-to-B until re-run; the focused run below is fresh.
- QC-100-FINAL-013 has a prior dated report at `audit/2026-09-19/QC-100-FINAL-013-two-stage-controlled-workflows.md`, but no current-candidate owner handoff. Its open PD-01/02/07 inspection-source, PD-32 signature-scope, and PD-38 lab-reject decisions remain OPEN. QC-100-FINAL-026's current register preserves these decisions as source-owner dependencies and runtime DENY. This phase did not infer approvals from the historical 013 report.
- QC-100-FINAL-027-B evidence is for SHA `0f25de0f…`, before the committed 028-A changes, so its PG 18.6 results are not claimed as B-candidate verification. 027 remains the regression evidence owner.
- Environment discovery: no `QC_TEST_DATABASE_URL` or `DATABASE_URL` was present (only environment variable names were inspected). Docker client exists but daemon socket is unavailable. A new task-owned PG 18.6 cluster under `/private/tmp/qc-028b-pg18` failed during `initdb`: `shmget ... Operation not permitted`; PostgreSQL removed the incomplete data directory. The existing `.tmp/pg18` path was not touched.

## Item-by-item evidence

| Item | Work status | Changed path(s) | Evidence status and result | Unresolved dependency / owner |
|---|---|---|---|---|
| 1. Legal lifecycle edges plus representative illegal, stale, replayed, concurrent, return/correction/reopen, PASS-not-RELEASED, rollback, and immutable-history edges | **PARTIAL** | Evidence record only: this report. Runtime/test implementation unchanged. | **PASS:** 13 files / 66 focused tests at Node 24.20.0, including two-stage authorization, lab workflow/scientific governance, CAPA close, template policy/state, maintenance, inspection review/execution, and Finding/NCR/CAPA focused contracts. **PASS:** typecheck 883 files, 0 errors, 0 warnings, 74 hints. **PASS:** SSR build and exact-SHA release identity. **BLOCKED:** focused PostgreSQL integration invocation attempted for 11 files / 60 tests; 13 non-DB tests passed, 47 DB cases skipped, and 5 database suites failed setup because Testcontainers had no runtime. In particular the populated 028-A two-stage suite's 16 cases were all skipped, including correction/resubmit, reopen, stale/replay, five-race winner checks, HOLD rollback, and signature count. Therefore atomic persistence rollback, immutable rows, durable replay, and concurrent edges are not verified for this candidate. | 002/027: rerun on disposable PostgreSQL 18.6 and reconcile regression results; supported Testcontainers runtime or explicitly task-owned equivalent required. Do not treat skipped tests as PASS. |
| 2. Trace deviations/findings/NCR/CAPA and controlled decisions across modules | **PARTIAL** | Evidence record only: this report. Runtime/test implementation unchanged. | **PASS (source trace only):** Finding create/list/related NCR/transition paths connect to NCR creation and transitions, RCA updates/transitions, and CAPA create/transition/close (`src/modules/quality/{findings,ncr,rca,capa}/{application,domain,infrastructure}/*`). Integration suites exist for findings, NCR, CAPA, and controlled workflow matrix. **PASS:** 2, 2, and 3 focused finding/NCR/CAPA tests ran within the 66-test batch. **BLOCKED:** real PostgreSQL atomicity, cross-record linkage, audit/outbox/history and stale/replayed edge assertions could not execute; these DB suites did not connect to a database. Controlled source decisions PD-01/02/07, PD-32, PD-38 and per-edge source decisions remain DENY/OPEN in 013/026; no scientific, authority, or QMS policy was invented. | 013/026: approved source-owner decisions required before any currently denied edge can be implemented. 002/027: fresh DB evidence. 012: final evidence reconciliation. |

## Command results

| Command | Status | Evidence |
|---|---|---|
| `pnpm exec vitest run tests/integration/qc-100-final-013/ tests/integration/concurrency/controlled-mutations.test.ts tests/integration/concurrency/idempotency.test.ts tests/integration/quality/findings.test.ts tests/integration/quality/ncr.test.ts tests/integration/quality/capa.test.ts tests/integration/quarantine/inspection-review.test.ts tests/integration/quarantine/inspection-execution.test.ts tests/integration/laboratory/execution.test.ts tests/integration/laboratory/governance.test.ts` | **BLOCKED / partial execution** | 6 passed / 5 failed during PostgreSQL setup; 13 passed / 47 skipped. The failure is unavailable Testcontainers runtime, not a passing DB edge suite. |
| Focused 13-file lifecycle/QMS batch | **PASS** | 13/13 files, 66/66 tests. Includes local unit/use-case contracts and non-container suites; not PostgreSQL persistence proof. |
| `pnpm typecheck` | **PASS** | Node 24.20.0; 883 files, 0 errors, 0 warnings, 74 hints. |
| `pnpm build` + `pnpm release:identity` + `pnpm release:verify` | **PASS** | Exact frozen SHA and local artifact identity shown above; not production release evidence. |
| Migration/schema integrity against live DB | **NOT RUN / BLOCKED** | No disposable PG available; source head/checksum only. |
| Authenticated E2E (`003`) / applicable accessibility (`006/040`) | **NOT RUN** | No UI changes in B; owners retain candidate-bound coverage responsibilities. |
| Human acceptance (`004`) | **BLOCKED / excluded** | No participant evidence was created or inferred. |

## Next phase and handoff

Next owner is **QC-100-FINAL-012 final evidence reconciliation**. Required inputs: this report; a fresh 002/027 regression run on this exact candidate with disposable PG18 and the changed 028-A two-stage transaction contracts; current approved-source dispositions from 013/026 for any policy-dependent edge; 003 and 006/040 candidate-bound results where applicable; and genuine 004 human evidence only when available. A usable PostgreSQL container runtime or sandbox configuration permitting task-owned PG shared memory is required for the blocked database checks. Keep the 80-domain denominator and existing scored domains unchanged; technical evidence is not external compliance certification.

**Final state:** Work **PARTIAL**. Evidence **PASS** for the listed local contracts, typecheck, build, and exact-SHA release identity; **BLOCKED** for populated database edges and schema verification; **NOT RUN** for E2E/accessibility; human acceptance **BLOCKED / excluded**. `PASS ≠ RELEASED`; no gate or score is changed by this handoff.
