# QC-100-FINAL-038 — Task/Usability Measurement Definitions, Research Protocols & Evidence Gap Register

**Date:** 2026-09-22 · **Status:** `RESEARCH-READY — NOT EXECUTED WITH HUMANS`
**Frozen implementation baseline:** HEAD `03c41b61ec2d5a6df3c6cbe02e35a3a2ec9e2b32` + working-tree changes of this task (see §6 mapping).

## Evidence discipline (binding)

- **No human participant data exists for this task.** Human usability execution is excluded by instruction; this package provides measurement definitions and protocols only. Nothing below may be quoted as a usability result.
- **AUTOMATION EVIDENCE** in §5 is synthetic, produced by the unit test suite on the implementation itself, and is labeled as such. It proves implementation contracts, never user comprehension or task success.
- Evidence classes follow `audit/100-percent/2026-09-10-ux-research-scenarios-and-usability-plan.md`: OBSERVED / REPOSITORY / AUTOMATION / ANALYTICS / RESEARCH HYPOTHESIS / UNVERIFIED ASSUMPTION.

## 1. Task definitions (measurement-ready)

Each task below is one measurable unit. Denominator: one attempt = one participant × one task on one frozen record set.

### T-LAB-01 — Record raw observations (execute surface)
- **Start:** the frozen record's execute page is fully rendered and the participant says "ابدأ" / "Start".
- **End (success):** every required parameter for every sample has a value entered and the participant has saved **and** submitted; server returns success; the resulting state transition is visible on screen.
- **Abort:** participant stops for > 60 s and states inability, or explicitly quits; values left unsaved.
- **Assistance:** any unprompted hint from the moderator. First assistance may be scored; second marks the task `ASSISTED` (not `INDEPENDENT`).
- **Errors (counted, not fatal):** wrong unit assumption; value entered in a non-entry control; navigation away mid-entry (guard triggered); boolean entered as text.
- **Time units:** seconds, from Start to last server-acknowledged submit. Clock stops during moderator-initiated interruptions (recorded separately).
- **Success classes:** `INDEPENDENT_SUCCESS` / `ASSISTED_SUCCESS` / `FAIL` / `ABORT`.

### T-LAB-02 — Locate criteria and unit at the point of entry
- **Start:** execute page rendered with one parameter block visible.
- **End (success):** participant states the approved unit and the approved criteria text for a named parameter without navigating away (rendered context satisfies this from R1/R6).
- **Errors:** consulting an external document; misreading the rendered criteria; recalling a limit from memory that differs from the rendered one.

### T-LAB-03 — Review comparison (review surface)
- **Start:** review page rendered for a submitted record containing ≥ 1 rule-evaluated row and ≥ 1 reviewer-decision row.
- **End (success):** participant identifies, for each sampled row, whether the outcome came from an approved rule or is a reviewer decision, and names the approved criteria for one row of each type.
- **Errors (probe — unsafe turn):** treating `Reviewer decision` as a rule-derived PASS; treating a rule-derived FAIL as a workflow rejection (it is neither — the official result comes from the approved source at stage-1 approval); treating any badge as a release command (`PASS ≠ RELEASED`).

### T-LAB-04 — Controlled return / approval decision
- Carried unchanged from scenarios S-03 in the 2026-09-10 usability plan; measured under the same contract shape (start/success/abort/assistance/time). No new definition here to avoid conflicting contracts.

## 2. Privacy-safe measurement contract (per event)

No participant-identifying content and no QC record content leaves the system. Contract per event:

| Field | Type | Constraint |
|---|---|---|
| `task_id` | enum | `T-LAB-01..04` |
| `participant_ref` | opaque id | assigned at recruitment; no name/email/role text |
| `event` | enum | `TASK_START` / `TASK_END` / `ASSIST` / `ERROR` / `ABORT` |
| `outcome_class` | enum | §1 success classes; null except on `TASK_END` |
| `duration_ms` | integer | §1 time rules; excluding disclosed interruptions |
| `error_kind` | enum | §1 error lists only; free-text notes stored separately and de-identified |

- **Never captured:** raw measurement values, sample identifiers, criteria payloads, document numbers, free-text reasons.
- **Idle/abandoned exclusion:** a session with no interaction for **10 minutes** is treated as idle and excluded from the time denominator **only if the study consent form discloses this rule and its exact threshold before the session**. Abandoned sessions (participant leaves, no abort statement) are excluded from success-rate denominators and reported separately. Both exclusions appear in the per-study report with counts.
- This contract extends `Documents/PRODUCT-ANALYTICS-MEASUREMENT-PLAN.md`; no analytics provider or dataset exists today (`ANALYTICS EVIDENCE: NONE`).


## 3. Research-ready protocol (external execution)

**Protocol type:** moderated, think-aloud, single participant per session, remote or on-site; each session ≤ 45 min covering T-LAB-01 → T-LAB-03 on synthetic seeded records.

1. **Setup:** frozen build (one release candidate SHA) + seeded synthetic laboratory record with samples, parameters (numeric, boolean, text/enum), one rule-evaluated parameter and one no-rule parameter per sample set.
2. **Consent:** includes the disclosed idle/abandoned exclusion rule (§2) before any timing.
3. **Script discipline:** moderator reads the scenario prompt verbatim; no hints unless the assistance rule fires; every assist and error logged per §2.
4. **Wrong-turn probes recorded verbatim:** PASS-as-release, reviewer-decision-as-PASS, rule-FAIL-as-rejection, editing submitted data, invented limit recall.
5. **Confidence rating:** 5-point self-report after each task (recorded, not a success criterion).
6. **Debrief:** participant explains the resulting state and the next authorized owner; answers probed for "ماذا يتبقى محجوزًا؟".
7. **Reporting:** per-task success/abort/error/time tables + exclusion counts + de-identified verbatim quotes; all findings labeled `OBSERVED EVIDENCE` only after execution. Until then this document claims **no usability findings**.

## 4. External human-research gap register

| # | Gap | Blocks | Owner / dependency | Status |
|---|---|---|---|---|
| G1 | No real participants recruited or screened | All tasks | Recruitment owner (outside repo) | OPEN |
| G2 | No approved staging/UAT environment with the frozen candidate deployed | All tasks | Release owner; depends on approved candidate | OPEN |
| G3 | Moderator/facilitator and observer roles not assigned; script not rehearsed | §3 protocol | Research owner | OPEN |
| G4 | Consent form with disclosed idle/abandoned exclusion rule not drafted/approved | §2 exclusions | Compliance owner | OPEN |
| G5 | No analytics provider/dashboard to host the §2 event contract; ingestion undefined | Analytics | Product owner; see `Documents/PRODUCT-ANALYTICS-MEASUREMENT-PLAN.md` | OPEN |
| G6 | Signer / responsible role for accepting the study report unresolved (same class as UAT-DD-001) | Closure | Signatory owner | OPEN |
| G7 | Synthetic seed data must pass controlled-template eligibility (frozen context, approved rules) at execution time | Setup | Engineering (seed script must be validated on the deployed candidate) | OPEN |

## 5. Synthetic instrumentation verification — AUTOMATION EVIDENCE (labeled)

Produced by the unit suite on this task's working tree; **not** evidence of human usability.

- `tests/unit/laboratory/lab-presentation.test.ts` — 9/9 PASS:
  - `criteriaText` renders each approved rule type verbatim from the frozen payload (RANGE_INCLUSIVE / RANGE_EXCLUSIVE / MAX_LIMIT / MIN_LIMIT / EQUALS / ENUM_ALLOWED) and falls back to the stored JSON or "No approved criteria recorded" — no invented threshold.
  - `entryParameters` carries unit, required flag, precision guidance, source reference and criteria text (T-LAB-02 affordance).
  - `comparisonRows` yields PASS/FAIL only via the approved rule, `REVIEWER_DECISION` when no approved rule exists (F5/R4), `NOT_RECORDED` when no value, prefers the calculated value with calculated flag and unit precedence, renders booleans as Yes/No while evaluating the stored value.
- Laboratory unit family `tests/unit/laboratory` — 57/57 PASS (includes pre-existing contracts: reject-contract disclosure in review.astro remains intact).
- `astro check` — 0 errors across 937 files (execute.astro + review.astro rewrites compile).
- Regression owners not run in this session and unchanged: E2E 003/006/040; integration 002/027; PostgreSQL 18 container required. Status: **NOT RUN** here.

## 6. Item-by-item requirement → implementation → evidence → dependency

| Item | Requirement | Implementation | Evidence | Dependency |
|---|---|---|---|---|
| 1 | Ergonomic gap analysis | `audit/2026-09-22/task-038-lab-ergonomics-analysis.md` (F1–F7, R1–R6) | REPOSITORY EVIDENCE — DONE | — |
| 2 | Measurement entry / context visibility / review comparison | `lab-presentation.ts`, `execute.astro` (grid, unit/criteria/precision per parameter, boolean selects, sample identifiers, frozen-context panel, unsaved guard), `review.astro` (comparison table with outcome badges, read-only context, decision rail preserved) | unit lab-presentation 9/9; laboratory suite 57/57; astro check 0 errors | E2E/a11y 003/006/040 NOT RUN (Docker/browser) |
| 3 | Task + measurement definitions (privacy-safe) | §1–§2 above | Definitions only — no data collected | §4 G1/G4/G5 |
| 4 | Research-ready protocols + synthetic verification + external gap register | §3–§5 above | AUTOMATION EVIDENCE only (labeled) | §4 G1–G7 |
| 5 | Handoff report | this table + states below | — | — |

**Handoff:** items 1, 3, 4 = **DONE** (as definitions/protocols, not results); item 2 implementation = **DONE locally**, verification = **PARTIAL** (unit + typecheck PASS; E2E/a11y/integration NOT RUN). No usability PASS/FAIL claim exists or is implied. `PASS ≠ RELEASED`; gates 0/19 unchanged; no commit/push.
