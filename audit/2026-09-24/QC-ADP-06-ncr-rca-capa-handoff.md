# QC-ADP-06 — NCR/RCA/CAPA decision and route handoff

**Date:** 2026-09-24  
**Candidate:** `c14369a7c524f07ebe8ba19e3c93c607e97010f8` (`main`; no pre-existing working-tree changes observed)  
**Disposition:** `BLOCKED / NO-GO` — the requested controlled workflow depends on unresolved QMS owner decisions. This handoff records the blocker and the candidate-bound evidence gathered; it does not approve policy or change runtime/schema.

## Root cause and policy boundary

The workflow is incomplete because the source of truth does not define the decisions that authorize its transitions, rather than because the routes or state-machine code are absent. The audit finding `QC-PAGE-F-007` points at the unproven Finding → NCR → RCA → CAPA journey. The adaptive audit route cards `RT-QUAL-001`, `RT-FIND-001..003`, `RT-NCR-001..003`, `RT-RCA-001..002`, and `RT-CAPA-001..003` remain NOT VERIFIED for populated, role, PostgreSQL, accessibility, performance, and UAT behavior.

The technical gap is also in evidence binding: `TransitionNcrUseCase` receives `rcaComplete`, `capaComplete`, and `verificationComplete` booleans from its caller and passes them to the state machine; `CreateCapaUseCase` accepts caller-supplied `verificationRequired` and `effectivenessRequired`. Current schemas/domain models do not define a CAPA effectiveness evidence record or criteria/version reference. The code therefore has transition guards, but those guards do not themselves prove policy-authorized source evidence. The approved policy must specify evidence shape and authority before a migration or positive completion path can safely be designed.

Canonical open decisions remain `PD-15` (Finding→NCR criteria), `PD-16` (FAIL→NCR automatic or user action), `PD-17` (NCR closure authority/workflow; partial mechanics only), and `PD-18` (CAPA effectiveness requirement/criteria). The approved interim boundary is no automatic NCR threshold/inference and no automatic FAIL→NCR; invalid and unauthorized close is denied. These are not a complete NCR creation or closure policy.

There is an additional acceptance conflict: the requested acceptance says closure must have effectiveness evidence, while approved `P-04` expressly allows a Supervisor with `PERM-CAPA-CLOSE`, active state, scope/version, reason, reauthentication, e-signature and audit to close despite incomplete mandatory actions or absent effectiveness acceptance. `BR-QUAL-031` also says action completion is not effectiveness, while `BR-QUAL-033` leaves the effectiveness requirement unconfirmed. This task cannot remove or narrow P-04. The owner must decide whether the acceptance criterion describes the normal closure path while P-04 remains an explicit exception, or whether the owner intends a policy change to P-04.

## Owner decision needed to resume

Please supply an approved QMS decision/source with named owner, effective date/version, and positive plus negative examples for:

1. Finding→NCR criteria: whether NCR creation is an explicit user action, which Finding classes qualify, whether a Finding may have multiple NCRs, required source snapshot/version, and duplicate/idempotency behavior. No threshold or automation may be inferred.
2. Inspection FAIL consequence: explicitly retain manual creation or authorize an automatic rule, including source version, transaction/retry behavior, and duplicate handling.
3. NCR closure: eligible states, prerequisites/required RCA and CAPA links, closure permission/roles/scope, reviewer/closer SoD, reason/signature/reauthentication requirements, and allowed void/cancel states. Current runtime default remains deny where authority is unresolved.
4. CAPA effectiveness: whether it is required, criteria/measure and evidence source, evaluator independence, time window/sample, pass/fail/return/retest rules, version snapshot, and evidence immutability. No effectiveness claim or percentage may be generated without approved measure, denominator, and weights.
5. CAPA closure relationship: confirm how normal evidence-backed closure coexists with P-04's exceptional closure. If P-04 is to change, provide a separately approved decision; this task has no authority to alter it.

## Existing implementation trace

- `src/modules/quality/findings/application/create-finding.ts` authorizes `PERM-FIND-CREATE`; the Finding domain stores a source context when supplied.
- `src/modules/quality/ncr/application/create-ncr.ts` requires `PERM-NCR-CREATE` and a Finding ID; `src/modules/quality/ncr/domain/ncr.ts` requires a Finding and non-empty description. Creation is not automatic from Finding/FAIL.
- `src/modules/quality/ncr/domain/ncr.ts` has a guarded progression and rejects CLOSE without verification; `Documents/STATE-MACHINES.md` marks NCR closure policy-dependent/runtime default deny. Existing closure authority is not enough to establish the approved role/scope/SoD policy.
- `src/modules/quality/rca/domain/rca.ts` guards required analysis/root cause before submit; RCA remains linked to an NCR.
- `src/modules/quality/capa/domain/capa.ts` distinguishes action completion, verification, effectiveness acceptance, and closure. Its CLOSE transition intentionally permits P-04's exceptional path. `src/modules/quality/capa/application/close-capa.ts` enforces Supervisor role, `PERM-CAPA-CLOSE`, scope/state/version, reason, reauthentication and a version-bound signature before repository close.
- Route matrix: `Documents/ROUTE-MATRIX.md` RT-QUAL-001 and RT-FIND/NCR/RCA/CAPA route rows. Canonical policy sources: `audit/100-percent/POLICY-CLOSURE-MATRIX.md` PD-15..18; `Documents/DECISION-ASSUMPTION-REGISTER-026.md` PD-15..18 and RD-017/018; `Documents/BUSINESS-RULES.md` BR-QUAL-010..033.

No migration is justified before those decisions are supplied: the candidate already has Finding→NCR/RCA/CAPA relationships and versioned records. Snapshot/immutability needs should be specified from the approved evidence ceremony before adding columns or audit semantics.

## Route acceptance register

Denominator is fixed at **5 applicable checks per route × 13 routes = 65**. Each route needs: (1) source/card and policy trace, (2) positive behavior on representative linked records, (3) unauthorized/wrong-scope/wrong-state/stale-version denial, (4) keyboard/form/timeline and next-step/link accessibility behavior, and (5) PostgreSQL 18 persistence/lineage plus route E2E/UAT evidence. All five apply to every listed route. A blocked owner policy prevents a passing positive journey and does not remove that check from the denominator.

| Route card | Applicable | PASS | FAIL | BLOCKED / NOT VERIFIED | Evidence |
|---|---:|---:|---:|---:|---|
| RT-QUAL-001 `/quality` | 5 | 0 | 0 | 5 | This handoff; source trace only |
| RT-FIND-001 `/quality/findings` | 5 | 0 | 0 | 5 | This handoff; source trace only |
| RT-FIND-002 `/quality/findings/new` | 5 | 0 | 0 | 5 | This handoff; source trace only |
| RT-FIND-003 `/quality/findings/[findingId]` | 5 | 0 | 0 | 5 | This handoff; source trace only |
| RT-NCR-001 `/quality/ncr` | 5 | 0 | 0 | 5 | This handoff; source trace only; live audit observed create disabled pending policy |
| RT-NCR-002 `/quality/ncr/new` | 5 | 0 | 0 | 5 | This handoff; source trace only |
| RT-NCR-003 `/quality/ncr/[ncrId]` | 5 | 0 | 0 | 5 | This handoff; source trace only |
| RT-RCA-001 `/quality/rca` | 5 | 0 | 0 | 5 | This handoff; source trace only; live audit observed routing to NCR |
| RT-RCA-002 `/quality/rca/[rcaId]` | 5 | 0 | 0 | 5 | This handoff; source trace only |
| RT-CAPA-001 `/quality/capa` | 5 | 0 | 0 | 5 | This handoff; source trace only |
| RT-CAPA-002 `/quality/capa/new` | 5 | 0 | 0 | 5 | This handoff; source trace only |
| RT-CAPA-003 `/quality/capa/[capaId]` | 5 | 0 | 0 | 5 | This handoff; source trace only |

**Result:** 0/65 PASS; 0/65 FAIL; 65/65 BLOCKED or NOT VERIFIED. Closure metric: `0 ÷ 65 = 0%`. No N/A checks. The acceptance denominator cannot be reduced by the absent policy, PG18 runtime evidence, browser evidence, or UAT.

## Candidate verification

- **Quality domain unit + integration-file suites:** `17/17 PASS` on Node `24.20.0` using direct Vitest invocation. These tests cover guards/mechanics and do not prove the unresolved policy or a complete persisted journey.
- **PostgreSQL 18:** `BLOCKED / NOT RUN` for this candidate. The executed `tests/integration/quality` set is not a PostgreSQL 18 runtime proof.
- **E2E:** `FAIL / BLOCKED before scenario` — `tests/e2e/quality.spec.ts` could not launch Chromium; macOS Mach rendezvous returned permission denied (1100) in the sandbox. No route behavior was observed by this run.
- **Package-manager invocation:** `NOT RUN` via `pnpm`; ambient Node was `22.22.3`, and Corepack failed creating `/Users/yzydalshmry/.cache/node/corepack/v1`. Direct Node 24.20.0 execution was used for the unit/integration-file suites.
- **Live source:** no fresh live inspection in this task; only the read-only observations recorded in the adaptive audit are cited. Candidate HEAD is the local source; no deployment/schema identity or role/session was established for it.
- **Schema head/version:** candidate migration HEAD and live applied schema are `NOT VERIFIED` for this task; no database migration was run.
- **UAT/keyboard/screen-reader evidence:** `NOT RUN`.
- **Commit/push/deploy:** not performed.

## Handoff gate

Resume implementation only after the authorized QMS owner supplies decisions 1–5 (or explicitly marks which remain open). Then bind schema needs to approved versioned source/evidence requirements, implement the permitted path and negative controls, update each of the 13 route cards with candidate-specific evidence, and rerun unit, PG18, authenticated E2E and UAT on the same candidate. Keep `READY/NO-GO` until every applicable check and P0/P1 is closed.
