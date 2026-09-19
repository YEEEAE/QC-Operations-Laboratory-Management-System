# QC-100-FINAL-013 — Approved policy gaps and two-stage controlled workflows

**Date:** 2026-09-19
**State:** PARTIAL
**Evidence:** PASS on the scoped local candidate; NOT RUN/BLOCKED where marked below.
**Release:** `PASS ≠ RELEASED` — this is technical evidence only, not a release authorization or a UAT result.

## 1. Candidate and environment (frozen before the edits)

| Item | Value |
| --- | --- |
| Repository HEAD | `8133185975809e37f4cda0f4006913f19921780d` (`main`) |
| Working tree | dirty, 8 changed files; content fingerprint `9cf1a9437d56f47655a22a8a139e4ec06658fb9a8df4adaaa1792fd03d461d22` |
| Frozen change set | `Documents/{STATE-MACHINES,PERMISSION-MATRIX,ROLE-MATRIX,BUSINESS-RULES,REQUIREMENTS-TRACEABILITY}.md`, `audit/100-percent/POLICY-CLOSURE-MATRIX.md`, `src/shared/authorization/policy-registry.ts`, `tests/integration/qc-100-final-013/two-stage-controlled-approval.test.ts` |
| Node / pnpm (local) | `v22.22.3` / `11.25.0` — **outside** the declared `>=24.20.0 <25` contract; local results are not runtime-parity evidence |
| Database | disposable task-owned PostgreSQL **18.6** cluster at `.tmp/pg18` (`scripts/db/disposable-postgres.sh`), task-owned database `qc_final013` on `127.0.0.1:55432`, TLS `verify-full` |
| Migration head (source + applied in the disposable DB) | `0031_qc_creation_parity_two_stage_approval` |
| Comparison baseline (not proof for this candidate) | `653b58d22d4a17994db7376a3bd691ca6e789f1a`: maturity 45.8%, mandatory production gates 0/19, PARTIAL / NO-GO |

`.agents/mind/01-mind-latest.md` and `.agents/mind/02-mind-mid.md` (memory, including the FINAL-013 rollover), this report, and the disposable database are **not** part of the implementation change set: they were written after the freeze. The frozen fingerprint above covers exactly the eight implementation/documentation files listed.

No commit, push, merge, deploy, production migration, credential rotation or paid-service change was performed. No production database was touched (Render remains at its last verified applied head `0018`; the credential-rotation gate stays open). No secret or credential-bearing URL appears in this report or in any artifact produced here.

## 2. Requirement → implementation → evidence → gap → owner

| # | Required work | Status | Evidence | Gap / owner |
| --- | --- | --- | --- | --- |
| 1 | Reconcile `POLICY-CLOSURE-MATRIX` with approved requirements and source; enumerate unresolved decisions with owner/question/dependent behavior/evidence | **DONE** | New dated reconciliation section in `audit/100-percent/POLICY-CLOSURE-MATRIX.md`; P-04/P-05/P-06/P-07 not reopened | Unresolved: PD-01, PD-02, PD-07, PD-16, PD-11, PD-32, PD-24/25, PD-38 — owner per row |
| 2 | Prove create/save/submit → stage-1 → `PENDING_QCM_APPROVAL` → QCM final approval, return/resubmit, reauth/signature, lock, authorized REOPEN, and the denial classes | **PARTIAL** | 16 new integration cases; laboratory chain complete end to end; inspection chain proven from a record that carries a source-supplied official result | Inspection create + official result are unreachable from the application → **P0 finding F-013-1** (owner: QC decision PD-01/PD-02/PD-07, implementation 013) |
| 3 | Implement remaining approved receiving/inspection/QMS/release/retest/equipment/template/evidence requirements end-to-end | **PARTIAL** | Items 3 classes cross-checked against source and existing closure evidence (QC-CLOSURE-006/008/009, QC-100-FINAL-014); nothing was reopened or re-scored | No new implementation was required by the approved decisions except the chain fix in §4; PD-38 lab reject, TR-LAB-008 VOID and the scientific evaluators stay fail-closed and were **not** changed |
| 4 | Complete server-derived, candidate-bound release-evidence ingestion for CI/security/E2E/UAT/recovery | **BLOCKED** (UAT path exists; CI/security/database/E2E writers do not) | `ReleaseGovernanceRepository` + trusted-source/freshness derivation exist; only `ReleaseGateEvidenceWriter.recordUatGateEvidence` is implemented | **F-013-2** — no writer or ingestion command for `ci`/`security`/`database`/`e2e` gate evidence (owner 013; inputs: trusted CI artifact format + an authorized CI candidate publication path) |
| 5 | Synchronize `STATE-MACHINES`/`PERMISSION-MATRIX`/`ROLE-MATRIX`/`BUSINESS-RULES`/traceability with `PENDING_QCM_APPROVAL` and the approved ceremonies; resolve domain-70 applicability | **DONE** | Five documents updated (two-stage chain, stage permissions, REOPEN, bounded review-only rules, new trace section `#103`) | Domain 70 = **Security UX** (applies; runtime denial/enumeration evidence pending). Arabic/RTL is a separate approved capability requirement (`UI-UX-SPECIFICATION §42`, `DESIGN-SYSTEM §16`, readiness `§31`, UAT `§57`) and is **not implemented** → implementation to 005/018, verification to 006; **no unapproved N/A** |

## 3. Defect found and fixed — the QCM signature was unreachable

**Root cause:** `PERM-ESIG-SIGN` / `SIGN` in `src/shared/authorization/policy-registry.ts` listed `DRAFT, SUBMITTED, UNDER_REVIEW, IN_REVIEW, RETURNED, APPROVED, STOPPED, REJECTED, OPEN, IN_PROGRESS, CLOSED, READY_FOR_CLOSURE, UNVERIFIED, BLOCKED` — but **not** `PENDING_QCM_APPROVAL`. `FinalApproveInspectionUseCase` and `FinalApproveLabTestUseCase` hand the ceremony the *pre-transition* state, so `createFinalApprovalCeremony` denied at the policy-state check (`authorize.ts:26`) every time.

**Impact:** the owner-approved two-stage decision was unimplementable — no record could ever reach `APPROVED` through the application, and the whole `PENDING_QCM_APPROVAL → APPROVED` path was dead. Six of the eight first-run failures in the new suite reproduced exactly this.

**Fix:** one state added to the registry entry, with a comment naming the approved decision. Everything else in the ceremony is unchanged (reauthentication, `PERM-ESIG-SIGN` grant, SoD, subject/version binding, signature evidence).

**Before/after:** first run `8 failed | 7 passed` → after the fix `16 passed` in the new file, `31 passed` across the FINAL-013 directory, four consecutive green runs, exit code 0 each time.

## 4. Findings recorded, not hidden

### F-013-1 (P0, not fixed — decision input missing): the official inspection result cannot be produced
* `ApproveInspectionUseCase` requires `Boolean(inspection.finalResult)`.
* `SaveInspectionDraftUseCase` refuses a browser-supplied official result (`AUTHZ_DENIED`, `errors.official_result_must_come_from_approved_source`).
* No inspection controlled-source evaluator exists (the laboratory module has `PostgresControlledLabSources`, whose `evaluate()` also refuses until the approved source exists).
* `StartInspectionUseCase` is **not** wired into `quarantineActionDependencies()`, and no create/start action exists, so an inspection report cannot be created from the application at all.
* **Consequence:** `TR-INSP-006` is fail-closed for any application-created report; the approved two-stage inspection chain cannot complete. Supplying an evaluator here would invent the very QC criteria that PD-01/PD-02/PD-07 withhold, so nothing was invented and nothing was weakened. Proven by the `[blocker]` case in the new suite.
* **Owner/next step:** QC/QMS source for PD-01/PD-02/PD-07, then 013 implements the inspection create action and the controlled result source.

### F-013-2 (P1, not fixed): no release-gate evidence writer except UAT
`ReleaseGateEvidenceWriter` exposes a single method (`recordUatGateEvidence`). The domain already declares `ci: TRUSTED_CI|IMPORTED_CI`, `security: TRUSTED_SECURITY_SUITE|IMPORTED_SECURITY`, `database: TRUSTED_DATABASE_PREFLIGHT|IMPORTED_DATABASE`, `e2e: TRUSTED_PLAYWRIGHT|IMPORTED_E2E`, yet nothing persists such rows (`scripts/verification/run-authenticated-e2e.ts` produces a `TRUSTED_PLAYWRIGHT` artifact that is never ingested). Owner: 013, dependent on an authorized CI candidate-publication path.

### F-013-3 (measured, documented): signature evidence is written before the transition
The ceremony stores signature evidence, and only afterwards does the repository transition run inside its own transaction. When a transition is legitimately refused (e.g. the receiving item is on HOLD), the signing evidence remains while state, version, audit and outbox are untouched. The new suite asserts this ordering explicitly (`[boundary]` case) so it cannot silently change. Not fixed here because moving the ceremony inside the repository transaction changes a contract shared with release governance; recorded for an explicit decision.

## 5. Verification commands and results (all on the frozen change set)

| Command | Result |
| --- | --- |
| `pnpm exec vitest run tests/integration/qc-100-final-013/` | **31/31 PASS** (2 files) — repeated 4 consecutive runs, exit 0 each |
| `pnpm test:integration` (fresh `qc_final013`) | **435/435 PASS**, 97 files, exit 0 (0 skips) |
| `pnpm test:unit` | **677/677 PASS**, 93 files, exit 0 |
| `pnpm test:migrations` | **29/29 PASS**, 8 files, exit 0 |
| `pnpm test:concurrency` | **12/12 PASS**, 2 files, exit 0 |
| `pnpm test:security` | **52/52 PASS**, 7 files, exit 0 |
| `pnpm test:architecture` | PASS (boundaries + canonical route coverage), exit 0 |
| `pnpm build` (Astro SSR) | PASS, exit 0 — server built, no errors |
| `pnpm format:check` | PASS — `All matched files use Prettier code style!` |
| `pnpm lint` | PASS (no findings), exit 0 |
| `pnpm typecheck` (`astro check`) | **847 files / 0 errors / 0 warnings / 74 hints**, exit 0 |
| Authenticated E2E against a real browser + six personas | **NOT RUN** — no container runtime on this host; unchanged blocker |
| CI on the exact candidate | **NOT RUN** — the published run for the prior candidate failed before any step with the GitHub billing lock; no authorized candidate publication path exists (operator dependency) |
| Human UAT / sign-off | **OUT OF SCOPE** — no real participants, and none may be fabricated |

Concurrency claims use a declared iteration count: the inspection race repeats **5** times and the laboratory race (combined with the stale-version check) repeats **5** times, each asserting exactly one winner, one audit row for the winner's request, and a documented loser code (`CONFLICT_STALE_VERSION` or `AUTHZ_DENIED`) — no intermittent failures in any of the four full-file runs.

## 6. What the new suite proves

`tests/integration/qc-100-final-013/two-stage-controlled-approval.test.ts` — populated PostgreSQL, every denial asserted together with the absence of state/audit/outbox/signature side effects:

* **Inspection**: stage-1 → `PENDING_QCM_APPROVAL` with no signature and no `approved_at`; QCM final approval → `APPROVED` locked with exactly one `FINAL_APPROVE` signature bound to the pre-transition version; receiving consequence `INSPECTION_COMPLETE` + result, never a release; return-for-correction (reason mandatory) → resume → resubmit → complete with exactly one signature; named-owner final approval; stage skipping, Supervisor-final, employee-with-every-permission, inactive and OWN-scoped actors all refused; author SoD refusal; stale version; replay with no second effect; two simultaneous stage-1 approvals; locked-record edit refusal; authorized REOPEN with reason and stage order re-enforced; `HOLD` never releases and a receiving `HOLD` is never overwritten.
* **Laboratory**: create → measurements → submit → review → stage-1 (evaluated result matching the frozen context source/hash, so the drift guard runs) → final approval with the binding signature → locked; reopen with reason; stage skipping, employee-with-every-permission and author-SoD refusals; reauthentication refusals; stale version; two simultaneous stage-1 approvals; unapproved template provenance refusal; and `PostgresControlledLabSources.evaluate()` still refusing to calculate an outcome.

The laboratory cases inject a **test-only server evaluator** that mirrors the frozen context (baseline `PASS`), and the suite separately asserts that the production adapter still refuses. No limit, tolerance, method, unit or signer was invented, and no scientific rule was inferred.

## 7. Human/external dependencies (unchanged, unfulfilled)

Mandatory production gates remain **0/19**; exact-candidate CI, authenticated E2E, provider verification, production migration and signed UAT remain unfulfilled. None may be manufactured under this task. Render stays at applied head `0018` with the credential-rotation gate open.

## 8. Final state

* Implementation status: **PARTIAL** (item 1 DONE, item 2 PARTIAL, item 3 PARTIAL/verified-no-change-required, item 4 BLOCKED, item 5 DONE).
* Evidence status: **PASS** for every command in §5; **BLOCKED/NOT RUN** for CI, authenticated E2E and UAT.
* Downstream owners: 002 (scientific/domain inputs), 003 (workflow/E2E), 004 (authentic acceptance), 005/018 (localization if the approved scope is activated), 006 (verification of that localization), 013 (inspection create + controlled result source, release-evidence writers).

No other task is marked complete by implication.
