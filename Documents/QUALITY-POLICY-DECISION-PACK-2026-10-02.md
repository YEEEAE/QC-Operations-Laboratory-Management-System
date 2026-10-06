# Quality workflow and signature decision pack

**Status:** PROPOSED — decision content awaiting owner confirmation; not a signed policy or runtime closure.
**Prepared:** 2026-10-02.
**Scope:** PD-15, PD-16, PD-17, PD-18 and PD-32. The user authorized completion work; this packet makes the remaining business choices explicit for review. Approval of the electronic evidence display does not answer these business questions.

**Current authority note (2026-10-06):** The owner decision effective 2026-10-04 and recorded in `QC-OWNER-DECISION-ALL-APPROVALS-SIGNATURE-2026-10-05.md` supersedes this proposal's stage-one signature row and its general wording that leaves unlisted approvals unsigned. In-system approval actions require a separate account-bound signature and fresh reauthentication. This packet remains **PROPOSED** for PD-15–18 and does not close the complete PD-32 action map, scientific sources, document effectivity, or other owner inputs.

## Proposed decisions

| Decision | Proposed rule | Required persisted evidence |
| --- | --- | --- |
| PD-15 — Finding to NCR | An authorized Supervisor/QCM assesses a Finding against an identified controlled requirement. A confirmed nonconformance is escalated by an explicit user action with a reason. No numeric severity threshold or automatic inference is introduced. QC staff may prepare drafts under the existing creation permissions. | Finding ID/version, source requirement/revision, observed deviation, assessment, reason, actor and decision time. |
| PD-16 — FAIL to NCR | An official inspection FAIL creates a need for human assessment; NCR creation remains an explicit user action through a linked Finding. A workflow Reject is not a scientific FAIL. The assessment records either escalation or a reason for no escalation. No automatic release follows. | Official inspection reference/version/result, Finding link, assessment and NCR link when created. |
| PD-17 — NCR closure | A Supervisor, QCM or named yazeed with active explicit closure permission and valid scope may close only from READY_FOR_CLOSURE, independently of the record's author. The server must verify approved linked RCA, completed and accepted linked CAPA effectiveness evidence, and a recorded closure verification. Closure requires a reason, reauthentication and a version-bound signature. | Server-derived linked record versions, independent verifier, verification result, signature, audit and idempotent command. CAPA CLOSED alone is insufficient. |
| PD-18 — CAPA effectiveness | A separate effectiveness review is required for normal completion. Before assessment, the record must identify the criterion, method, observation window and evidence expected for that case. An independent authorized Supervisor/QCM records the observed evidence and ACCEPTED/REJECTED conclusion. No generic duration, sample size or success percentage is assumed. | Case-specific approved plan and criterion, observations/evidence references, reviewer, conclusion, time and source versions. P-04 exceptional Supervisor closure remains available under its existing signed ceremony and never means effectiveness passed. |
| PD-32 — Electronic signatures | Use account-bound reauthentication and immutable stored evidence for the controlled decisions in the matrix below. Draft/save/submit and ordinary review remain audited actions without a signature unless explicitly listed. Undefined or unsupported actions remain denied. | Actor, action/meaning, exact subject/version/snapshot, signed time, reauthentication method and linked committed transition. Handwritten images are not substitutes. |

## Proposed signature scope

| Controlled action | Signature treatment |
| --- | --- |
| Inspection and laboratory stage-one Supervisor approval | No signature; retain the current mandatory first-stage workflow audit. |
| Inspection and laboratory final QCM approval | Required; retain the approved FINAL_APPROVE ceremony and stage separation. |
| Receiving release | Required with explicit release permission and existing P-05 authority/SoD. |
| Controlled document approval | Required; document authority/effectivity decisions remain separately governed. |
| RCA approval and NCR closure | Required with the authority and evidence conditions above. |
| CAPA effectiveness acceptance and CAPA CLOSE | Required; P-04 CLOSE remains Supervisor-only and does not accept effectiveness. |
| Change Request approval | Required; application of a change remains a separately authorized transition, not implicit approval. |
| Inspection template approve/stop/void/supersede | Preserve the already approved P-06 action-specific ceremony. |
| Release-candidate approval and UAT-cycle acceptance | Preserve the approved signed ceremonies; technical automation cannot replace real human UAT. |
| Other VOID, rejection, return, reopen or administrative actions | Preserve existing approved action-specific requirements. An unapproved domain/action is denied; this packet grants no new VOID or bypass authority. |

## Closure criteria and implementation work

Owner confirmation resolves decision content only. A policy row is not technically closed until its exact action matrix is reconciled with permission/state/SoD rules, schema and actions, and positive/negative evidence exists for the final candidate.

- Wire Finding assessment, explicit NCR creation, RCA lifecycle, CAPA action completion/verification/effectiveness, and NCR closure through server-owned use cases.
- Derive prerequisites from persisted records under the same transaction as the transition. Never accept caller-supplied `rcaComplete`, `capaComplete`, `verificationComplete`, `verified` or `effectivenessAccepted` booleans as evidence.
- Persist transition, required signature, audit and required outbox effects atomically; enforce stale-version, duplicate/replay and source-link consistency.
- Show the actual committed evidence, including the distinction between ordinary audit events, signed actions, exceptional closure and accepted effectiveness.
- Verify PostgreSQL 18 rollback/race/replay, real-record authorization denials, authenticated routes and human acceptance. Source/type checks alone do not close these gates.

## Current source gaps

Source review on local HEAD `0fbe30382d57345f4bb93f8b884a614fc4e98657` plus the preserved document-evidence working-tree changes found: NCR/CAPA creation and RCA transition Actions are policy-denied; generic quality repositories have incomplete atomic audit/transition protection; no persisted complete effectiveness ceremony exists; generic approval signature policy is universally UNRESOLVED. These are implementation gaps, not supplied human decisions or runtime test results.

Canonical decision tracking remains in `audit/100-percent/POLICY-CLOSURE-MATRIX.md` and `Documents/DECISION-ASSUMPTION-REGISTER-026.md`. Do not copy this proposal into those registers as CLOSED before the corresponding decision and technical evidence exist.

## Completed independent integrity repair — 2026-10-02

NCR/CAPA transition inputs no longer accept caller-supplied prerequisite flags. Both application and repository boundaries reject injected `conditions`; repository transitions requiring unavailable persisted verification remain denied. Ordinary authorized investigation/start paths remain available. The approved P-04 signed Supervisor closure path is unchanged.

Verification on Node 24.20.0: four focused files, 23 tests PASS; touched-file ESLint PASS; Astro typecheck 0 errors, 0 warnings (114 hints); `git diff --check` PASS. These tests use synthetic/domain/repository stubs, including files under `tests/integration`; they are not PostgreSQL execution evidence. PostgreSQL 18, authenticated browser, concurrency and human acceptance were NOT RUN. This repair does not implement the remaining workflows above or close policy decisions.
