# UX Research Scenarios and Usability-Test Plan

**Date:** 2026-09-10  
**Scope:** QC operator / data-entry user, Supervisor, Manager, Admin, and `SYSTEM_OWNER`  
**Study status:** `RESEARCH PLAN — UNVERIFIED`  
**Important:** This document does not claim that interviews, observations, sentiment, task success, error rates, or analytics results exist. Any untested recommendation is labelled `RESEARCH HYPOTHESIS`.

## 1. Evidence discipline

The study uses five evidence classes. Findings must keep the same label when they are copied into another research or product document.

| Evidence class | What it means in this document | Current status |
|---|---|---|
| **OBSERVED EVIDENCE** | What a recruited participant did or said during a witnessed session, including hesitation, wrong turn, recovery, and confidence rating. | **None collected in this task.** The prior study package says no real participants have executed it. |
| **REPOSITORY EVIDENCE** | Current source, approved documents, route inventory, domain/state rules, and existing audit reports. | Available and cited below. |
| **AUTOMATION EVIDENCE** | What tests, static checks, or scripted browser runs prove about implementation behavior. | Available for selected contracts; it is not evidence of user comprehension or task success. |
| **ANALYTICS EVIDENCE** | Aggregated product telemetry with a defined denominator and privacy-safe event contract. | No current dataset or dashboard. Search instrumentation exists only for selected events. |
| **RESEARCH HYPOTHESIS** | A proposition to validate with participants, observation, or approved measurement. | Proposed below; not a finding. |
| **UNVERIFIED ASSUMPTION** | A planning assumption that must not be treated as fact until checked. | Marked inline and kept separate from evidence. |

### Current evidence boundary

- **OBSERVED EVIDENCE:** No interview, usability session, field observation, or participant sentiment was run for this document.
- **REPOSITORY EVIDENCE:** The product separates Receiving Workflow State, Inspection Result, and Release System State; `PASS` does not automatically mean release; review/approval/release require server-side permission, scope, state, version, SoD, and business-rule checks. Sources: `Documents/SYSTEM-INVARIANTS.md`, `Documents/DOMAIN-MAP.md`, `Documents/STATE-MACHINES.md`, `Documents/ROLE-MATRIX.md`, and `Documents/PERMISSION-MATRIX.md`.
- **REPOSITORY EVIDENCE:** Recent implementation work added server-derived journey context, record-level links where identifiers are confirmed, waiting/owner/reason fields, and a split handoff timeline. Source: `audit/2026-09-10-service-design-journey-maps.md` and the current mind entries.
- **AUTOMATION EVIDENCE:** Focus, error-summary, navigation, journey-context, search sanitization, and workflow contract tests pass in the recorded repository history. These prove implementation contracts only; they do not prove that a person understands the UI.
- **ANALYTICS EVIDENCE:** The measurement plan explicitly says there is no current Product Analytics provider/dashboard or usable behavioral dataset. Internal instrumentation covers selected search and validation events, without raw query or QC content. Source: `Documents/PRODUCT-ANALYTICS-MEASUREMENT-PLAN.md`.
- **UNVERIFIED ASSUMPTION:** Participants can use seeded synthetic records and can explain QC terminology in their normal work language. Screen this rather than assuming it.

## 2. Study objectives

1. Determine whether each role can locate the right record, understand its current state, identify the reason for a blocker or failure, select the correct follow-up, and return to the originating record.
2. Detect unsafe wrong turns: treating `PASS` as `RELEASED`, treating `Approved` as `Effective` or `Applied`, editing submitted controlled work directly, choosing the wrong domain owner, or attempting an action outside authority.
3. Measure task success, wrong-turn risk, error rate, recovery quality, navigation confidence, terminology comprehension, decision confidence, and unnecessary steps without inventing baseline values.
4. Identify which issues are comprehension problems, which are wayfinding problems, which are workflow/state problems, and which are permission or policy dependencies that should remain blocked.
5. Validate whether the existing journey-context and handoff concepts give users enough context without creating a misleading cross-domain “master status.”

## 3. Role and authority guardrails

These are scenario boundaries, not claims that every person with a role can perform every action.

| Role | Scenario focus | Authority guardrail from repository |
|---|---|---|
| **QC operator / data-entry user** | Enter receiving/inspection/laboratory data, attach evidence, submit work, respond to returned work, and find the correct follow-up. | Employee-like execution authority is conditional on permission, assignment/scope, state, evidence, and validation. Review is not a default Employee capability. |
| **Supervisor** | Monitor team work, review submitted records, return incomplete work with a reason, and escalate exceptions. | Supervisor role alone is not enough; review requires permission, scope, entity state, assignment, and SoD. A Supervisor must not silently edit submitted work. |
| **Manager** | Make authorized controlled decisions, review escalations, inspect management visibility, and understand approval/release dependencies. | Manager is not automatically authorized for every approval, release, closure, or void. Permission, scope, state, version, SoD, and e-signature still apply. |
| **Admin** | Manage authorized configuration, backup/recovery visibility, administrative records, and explain what is outside Admin authority. | Admin is not a universal business approver and cannot directly rewrite controlled history. System Health and owner-exclusive identity administration are not granted by the ordinary Admin role. |
| **`SYSTEM_OWNER`** | Inspect System Health, identity/permission administration, release identity, and cross-system recovery evidence. | Current foundation binds exclusive System Health ownership to `SYSTEM_OWNER` for `yazeed`. Full permission coverage does not bypass state machines, SoD, version checks, or audit requirements. |

## 4. Core task model and measures

### Task success definition

A task is successful only when the participant reaches the intended record or decision and can explain the relevant state and next action. A click or page open alone is not success.

For the high-value inspection task, success requires all of the following:

1. Opens the correct inspection, not merely the register.
2. States the current inspection result and the separate receiving/release facts.
3. Identifies the recorded failure reason or says that the reason is unavailable/not exposed without inventing one.
4. Finds or creates the correct follow-up only when the seeded scenario and policy allow it.
5. Returns to the original inspection/receiving record and preserves context.
6. Does not perform an unauthorized mutation or confuse a requested handoff with a committed transition.

### Measures to capture per task

| Measure | Operational definition | Report status before sessions |
|---|---|---|
| **Task success** | Binary outcome plus the failed criterion from the success definition. | No value yet. |
| **Wrong-turn risk** | Count of incorrect route/domain/state/action choices before recovery; mark unsafe wrong turns separately. | No value yet. |
| **Error rate** | Errors per task, with a fixed taxonomy: wrong record, wrong state interpretation, wrong terminology, invalid action, form error, permission/SoD misunderstanding, and recovery failure. | No value yet. |
| **Recovery** | Whether the participant notices the problem, finds the cause, chooses a safe recovery, and returns to task without moderator coaching. | No value yet. |
| **Navigation confidence** | Participant rating 1–5 after each task plus observed backtracking and failed navigation. | No value yet. |
| **Terminology comprehension** | Ask the participant to explain labels such as `HOLD`, `FAIL`, `PASS`, `RELEASED`, `SUBMITTED`, `RETURNED`, `APPROVED`, `EFFECTIVE`, `SUPERSEDED`, and `APPLICATION_FAILED` in their own words before explaining them. | No value yet. |
| **Decision confidence** | Rating 1–5 after the decision point, paired with the participant’s reason. Confidence without correct reasoning is not success. | No value yet. |
| **Unnecessary steps** | Steps beyond the shortest pre-defined safe path, including repeated search, register detours, duplicate identity entry, and avoidable return-to-context work. | Baseline path must be piloted first. |
| **Time on task** | Seconds from scenario readout to success, abandonment, or stop condition. | No value yet. |
| **Assistance** | None, neutral clarification, or coaching; coaching is a failure of independent completion for that task and must be reported. | No value yet. |

Do not aggregate these measures across roles until the denominator, task version, seed state, and participant segment are documented.

## 5. Role/task scenarios

Each scenario is written without naming a button or prescribing the route. The moderator should provide only the synthetic context and the goal.

### S-01 — QC operator / data-entry user: enter and submit an inspection

**Scenario prompt:** “You have received a synthetic item that needs inspection. Enter the observations and raw values from the supplied evidence, attach the supplied evidence, and submit the work for the next authorized step. Do not decide release unless the system and the study setup explicitly authorize that action.”

**Expected safe path:** Locate the receiving context → open or create the linked inspection → enter data/evidence → review validation → submit → explain the resulting state and next owner.

**Success criteria:** Correct record; required fields/evidence complete; raw values preserved; submitted state understood; no invented limit or automatic release assumption.

**Wrong-turn probes:** Starts a second inspection; enters a technical ID instead of selecting the record; treats a validation message as a business rejection; assumes `PASS` means release; edits after submit as if it were a draft.

**Recovery to observe:** Can the participant use inline/error-summary feedback, retained values, and the server-derived next action to recover without losing controlled data?

**RESEARCH HYPOTHESIS:** Visible field-linked errors, an explicit current state, and a next-owner block will reduce repeated submission and route confusion.

### S-02 — QC operator / data-entry user: locate inspection failure and follow up

**High-value scenario prompt:** “An inspection for a synthetic receiving item has a recorded failure. Locate the inspection, understand its state, identify the failure reason, find or create the correct follow-up available to you, and return to the original record. Explain what remains blocked.”

**Expected safe path:** Search or open the receiving item → open the exact inspection record → separate receiving state, inspection result, and release system state → inspect evidence/failure reason → follow the approved Quality/NCR/CAPA route when present in the fixture → return to source record.

**Success criteria:** All six task-success conditions in Section 4 are met.

**Do not mark as failure:** If the policy intentionally does not create an automatic NCR, the participant should be able to say that the follow-up is policy-dependent or not created. The study must not reward inventing a follow-up.

**RESEARCH HYPOTHESIS:** A record-level source/child link, separate state labels, and a typed “why unavailable” explanation will lower wrong-domain navigation compared with a register-only handoff.

### S-03 — Supervisor: review, return, and track team work

**Scenario prompt:** “A team member submitted a synthetic inspection with an incomplete or incorrect part. Review it, decide whether it can progress, and if it cannot, return it with a clear reason. Then locate the returned work and explain who owns the next step.”

**Expected safe path:** Open assigned/team queue → open submitted record → review evidence and current version → return with reason when allowed → verify recorded transition/audit context → identify next owner and return destination.

**Success criteria:** No silent editing of submitted data; correct reason; current version understood; returned state and next owner explained; no self-review/self-approval violation.

**Wrong-turn probes:** Uses edit controls to overwrite submitter data; assumes Supervisor can approve every controlled record; loses the source record after returning; treats notification delivery as business completion.

**RESEARCH HYPOTHESIS:** Showing “review authority,” “why unavailable,” current version, and a separate handoff timeline will improve decision confidence while preserving deliberate review.

### S-04 — Supervisor: manage HOLD and escalation

**Scenario prompt:** “A synthetic receiving item is on `HOLD`. Find out what is blocked, what evidence or decision is missing, and what safe next step is available within your scope. Escalate or return to the correct owner if you cannot act.”

**Success criteria:** Distinguishes `HOLD` from `FAIL`; identifies dependency and owner; does not release; records or locates the escalation path; returns to the receiving context.

**RESEARCH HYPOTHESIS:** Users will make fewer unsafe assumptions if `HOLD`, inspection result, and release state are visually and verbally separate.

### S-05 — Manager: make an authorized approval decision

**Scenario prompt:** “A synthetic controlled record is awaiting a decision. Review the exact version and evidence, determine whether you are the authorized decision-maker in this fixture, and take the permitted decision or explain why you cannot.”

**Expected safe path:** Open approval work item → open source record → verify version/state/scope/SoD → review evidence → sign/decide only if authorized → verify source-domain transition and audit evidence → return to source.

**Success criteria:** Decision is based on the current controlled context; participant distinguishes approval from application/effectiveness/release; correct reason is given for any blocked action; no self-approval.

**Wrong-turn probes:** Treats Manager as universal approver; approves a stale version; assumes approval changed the source; uses a generic “approved” badge as proof of effectiveness.

**RESEARCH HYPOTHESIS:** Explicit milestones for review, approval, application, and effective status will improve decision confidence and reduce false completion.

### S-06 — Manager: inspect failed follow-up and close the loop

**Scenario prompt:** “A synthetic inspection failure has an associated NCR/CAPA or an explicitly policy-blocked follow-up. Trace from the original inspection to the follow-up, identify the current owner and blocker, and return to the original record with a concise status explanation.”

**Success criteria:** Record chain is followed without duplicate creation; NCR/CAPA state is understood; the participant identifies whether required actions/evidence/verification are complete; no closure or release is assumed without authority.

**RESEARCH HYPOTHESIS:** A single read-only journey context across source and follow-up will reduce duplicate search and improve recovery after a cross-domain handoff.

### S-07 — Admin: configure or recover without crossing business authority

**Scenario prompt:** “A synthetic administrative request requires a permitted configuration or backup/recovery review. Complete the administrative task available to you, then explain which business decisions remain outside Admin authority and where the audit evidence is.”

**Success criteria:** Uses authorized administrative surface; does not edit approved inspection/lab/document history; distinguishes backup created from restore verified; locates admin audit evidence; understands System Health owner restriction.

**Wrong-turn probes:** Attempts inspection approval or release because of Admin role; treats a backup record as proof of restore; edits historical facts directly; assumes viewing audit grants editing authority.

**RESEARCH HYPOTHESIS:** A capability-aware Admin workspace that states “Admin ≠ business approver” at the point of action will reduce unsafe authority inference.

### S-08 — `SYSTEM_OWNER`: diagnose release/system evidence and return to operations

**Scenario prompt:** “A synthetic release candidate or system incident needs diagnosis. Check the system health and release identity evidence, identify any unavailable or unverified dependency, and return to the relevant operational or governance record without making a production mutation.”

**Success criteria:** Opens owner-only System Health; distinguishes live/readiness, database, storage, AI provider, backup, restore, and release identity; does not treat `UNVERIFIED` or provider unavailable as healthy/empty; returns to the source governance or operational record.

**Wrong-turn probes:** Uses `Admin` role as sufficient authority; treats all-green machine health as release readiness; confuses notification/outbox failure with business transition failure; exposes secrets or raw diagnostics.


**RESEARCH HYPOTHESIS:** A typed health/readiness surface with release identity and explicit “not verified” states will improve diagnosis confidence without encouraging unsafe production action.

### S-09 — `SYSTEM_OWNER`: identity and permission administration

**Scenario prompt:** “Using synthetic accounts, investigate a role/permission issue. Determine the current account state, role, permission, and scope, make only the permitted administrative change, and verify the audit event and session impact.”

**Success criteria:** Understands role versus permission versus scope; applies the intended change only to the seeded account; sees audit evidence; knows that page visibility does not itself grant authority; no password or secret is exposed.

**RESEARCH HYPOTHESIS:** Showing actor state, permission, scope, SoD, and version as separate decision facts will reduce the tendency to infer authority from a role label alone.

## 6. Cross-role heuristic evaluation

This is an expert review against the requested heuristics and the QC domain constraints. It is **REPOSITORY EVIDENCE + expert analysis**, not participant evidence. Severity follows the project heuristic scale: 0 none, 1 cosmetic, 2 minor, 3 major, 4 catastrophe.

| Heuristic | Current evidence / risk to test | Severity | Recommendation status |
|---|---|---:|---|
| **System status visibility** | Repository evidence shows recent journey context and handoff timeline work for state, owner, waiting, evidence, and audit. Open question: can a participant distinguish committed transition, approval decision, application result, notification delivery, and `UNVERIFIED`/provider-unavailable in the actual fixture? | 3 until tested | **RESEARCH HYPOTHESIS:** Keep separate status facts and expose last committed action, current version, waiting owner, expected event, and recovery. |
| **Match with QC real-world concepts** | Foundation explicitly separates Receiving, Inspection Result, and Release System State; `PASS ≠ RELEASED`, `HOLD ≠ FAILURE`, and controlled records are not ordinary drafts. Terminology comprehension is not observed. | 3 until tested | **RESEARCH HYPOTHESIS:** Test labels in participants’ own words; do not rename or merge states based on assumption. |
| **User control / freedom** | Existing contracts cover cancel/Escape/focus return and safe back/return links; controlled actions cannot be treated as undoable ordinary edits. Live recovery and accidental action behavior are unverified. | 2–3 | **RESEARCH HYPOTHESIS:** Provide explicit Back to source, Cancel, Return with reason, and safe recovery while preserving immutable history. |
| **Consistency and standards** | Repository audits identify shared navigation, error, stale, and journey-context contracts, but some live route/fixture coverage remains unverified. | 2–3 | **RESEARCH HYPOTHESIS:** Use the same vocabulary, state ordering, action placement, and error families across registers and detail pages. |
| **Error prevention** | Server-side authorization, state machine, version, SoD, and idempotency contracts are repository/automation evidence. It is unverified whether UI cues prevent a participant from attempting the wrong action. | 3 | **RESEARCH HYPOTHESIS:** Show preconditions before commitment; prevent duplicate submit; surface stale, permission, evidence, and policy blockers before a decision. |
| **Recognition over recall** | Record-level links and derived next-action context exist in recent implementation; earlier audits documented register-only handoff risk and repeated search. | 3 | **RESEARCH HYPOTHESIS:** Prefer visible source/child links, current version, owner, reason, evidence, and next action over asking users to remember IDs or state definitions. |
| **Efficiency** | Search and internal analytics contracts exist, but no behavioral data establishes where time or steps are spent. | 2–3 | **RESEARCH HYPOTHESIS:** Measure repeated search, backtracking, failed navigation, and unnecessary steps before adding shortcuts such as “open next eligible item.” |
| **Minimal design** | The system intentionally avoids unsupported charts/metrics and separates domain facts; current information density and scan order still need task testing. | 2 | **RESEARCH HYPOTHESIS:** Put decision-critical facts first; defer definitions and trace details behind accessible disclosure without hiding blockers. |
| **Error recovery** | Shared error/stale/provider-unavailable contracts and field-linked summaries are automation/repository evidence. Recovery success by role is unobserved. | 3 | **RESEARCH HYPOTHESIS:** Every error should name what happened, what was preserved, who owns recovery, and the safe next destination; never show unavailable as empty/zero. |
| **Contextual help** | Domain rules and state names are documented; the question is whether help appears at the decision point and uses plain QC language rather than a policy dump. | 2–3 | **RESEARCH HYPOTHESIS:** Add short definitions for state/action terms and “why unavailable”; test comprehension before adding more documentation. |

### Priority rule

Prioritize a heuristic issue as `P0/P1` only after one of these is demonstrated: an unsafe wrong turn, a repeated failure across participants, an automation/implementation defect that blocks the task, or analytics with a valid denominator showing material friction. Do not prioritize from severity language alone.

## 7. Usability-test protocol

### Method

- Moderated, task-based, think-aloud study using synthetic, seeded records only.
- One fresh account and fixture set per session; never use confidential production data.
- Do not name routes or buttons in the task prompt.
- Allow one neutral clarification only; record it. Do not coach the participant to the answer.
- Do not request real approval, release, e-signature, restore, password reset, or production mutation.
- Recommended pilot: one participant per role. Formal sample: 5–8 participants per segment only after the pilot proves the fixture and wording work. This is a sampling plan, not evidence that the sample exists.

### Moderator introduction

“Thanks for joining. We are testing the product, not you. We want to learn how you find and understand QC work. I may ask you to think aloud. I will not explain the intended path while you work. Please use only the synthetic records provided, and stop if you see anything that looks like a real production action. We may ask how confident you feel, but we are not evaluating your job performance. With your permission, we will record notes or the screen; otherwise we will use notes only.”

### Task delivery

1. Read the selected scenario exactly as written.
2. Start the timer after the final sentence.
3. Note first click/route, search terms only as a category (never store raw QC content), wrong turns, hesitation, terminology explanations, and recovery.
4. If the participant asks for help, first say: “What would you expect to happen next?” If needed, give one neutral clarification: “Please continue with the information visible in the system.” Record the assistance.
5. Stop timing at success, abandonment, safety stop, or the pre-defined maximum agreed in the pilot.
6. Ask task ratings and the open debrief question before moving to the next task.

### Per-task probes

- “What are you looking at right now?”
- “What does this state mean to you?”
- “What would you expect to happen after this action?”
- “What tells you who owns the next step?”
- “What would you do if this action were unavailable?”
- “How confident are you in that decision, from 1 to 5? What makes you say that?”
- “Which information, if any, did you have to remember rather than recognize?”

### Neutral debrief

- “Which task felt most straightforward, and what made it so?”
- “Which task required the most backtracking or checking?”
- “Were any labels or states unclear? Tell me what you expected them to mean.”
- “Where would you look for the reason a task cannot continue?”
- “What would make you less likely to make an incorrect change?”
- “What did we miss about how this work is done?”

## 8. Interview guide for contextual discovery

This guide is for interviews before or after task testing. It is written to avoid leading questions and does not imply that any sentiment or behavior is already known.

### Warm-up

- “Tell me about your role in QC work and the records you personally handle.”
- “Think of the last time you had to find an inspection or follow-up. What were you trying to accomplish?”
- “What happened next, and which system or person did you rely on?”

### Mental model and terminology

- “How do you distinguish receiving status, inspection result, and release status in your work?”
- “What do `HOLD`, `FAIL`, `PASS`, and `RELEASED` mean in your current process?”
- “When a record is returned, approved, effective, superseded, or not applied, what do you expect to be different?”
- “Which words in this system match your workplace language, and which do not?”

### Handoffs and recovery

- “Tell me about the last handoff that required you to move from an inspection to a follow-up.”
- “How did you know which record or person to go to?”
- “What did you do when the expected next step was unavailable or the record had changed?”
- “What evidence do you need before you consider a follow-up complete?”

### Authority and trust

- “How do you determine whether you can perform an action?”
- “What is the difference, in your work, between seeing a record and being allowed to change or approve it?”
- “What information would you need before trusting that a controlled decision actually took effect?”

### Role-specific probes

- **QC operator:** “How do you recover from a validation or returned-work issue without losing what you entered?”
- **Supervisor:** “How do you correct submitted work while preserving who entered the original value?”
- **Manager:** “How do you verify the exact version and evidence behind a decision?”
- **Admin:** “Which administrative actions are separate from business approval or release?”
- **`SYSTEM_OWNER`:** “How do you distinguish an application health signal from evidence that a release or restore is ready?”

## 9. Observation sheet

Use one row per task and one note per observable event. Do not write inferred motives as facts.

```text
session_id,role,experience_band,accessibility_context,task_id,
start_time,end_time,success,failed_success_criterion,
wrong_turn_count,unsafe_wrong_turn,error_count,error_taxonomy,
backtracking_count,failed_navigation_count,unnecessary_step_count,
terminology_issue,assistance,independent_recovery,
navigation_confidence_1_to_5,decision_confidence_1_to_5,
seq_1_to_7,participant_quote_or_observation,notes
```

Record quotes only with consent and only if they are necessary for the research question. Do not store passwords, raw QC content, record identifiers in the research dataset, or private identity/security data.

## 10. Analysis plan

1. Separate observation notes from interpretation during transcription.
2. Code each event as `wayfinding`, `state comprehension`, `terminology`, `authority/SoD`, `form/validation`, `cross-domain handoff`, `error recovery`, `confidence`, or `unnecessary step`.
3. Calculate success and error summaries by role and task only when the planned denominator is complete; show missing sessions and task exclusions.
4. Report median and range for time-on-task, not only an average. Keep raw counts visible.
5. Compare confidence with correctness; high confidence plus an unsafe interpretation is a high-risk finding.
6. Treat a participant’s explanation as observed evidence from that session, not as a universal user truth.
7. Triangulate only when evidence types remain distinct: repository/automation can explain what the system does, sessions can show what people do, and analytics can show aggregate frequency.
8. Assign each finding an ID, evidence class, role/task, severity, affected domain, owner, and validation status.

### Finding template

```md
## FINDING-XXX — [short neutral title]

- Evidence class: OBSERVED EVIDENCE / REPOSITORY EVIDENCE / AUTOMATION EVIDENCE / ANALYTICS EVIDENCE
- Status: observed / supported / hypothesis / unverified
- Role and task: [role] / [scenario ID]
- What happened: [observable behavior or exact source fact]
- Impact: [task, safety, comprehension, recovery, or efficiency impact]
- Severity: 0–4 with rationale
- Evidence reference: [session/task/source/test]
- RESEARCH HYPOTHESIS: [only if proposing a change]
- Next validation: [test, instrumentation, or document decision]
```

## 11. Analytics and automation boundaries

### Analytics evidence currently available

The repository defines privacy-safe events for navigation, search, forms, mutations, workflow steps, errors, features, responsive behavior, and performance. Only selected search/validation events are internally wired. No current rates, denominators, retention policy, provider export, or dashboard are available. Therefore this document reports **no analytics findings**.

If enabled for a study, use aggregate buckets such as route template, domain, error family, outcome, input method, and duration bucket. Never capture search text, form values, QC notes/results, record IDs, user IDs, credentials, or controlled-document content.

### Automation evidence currently available

Automation may confirm that a route exposes a label, a state contract, an error link, a safe server-side denial, or a record-level link. It cannot confirm that a participant notices, understands, trusts, or successfully uses that affordance. Report automation evidence as implementation evidence, not as usability success.

## 12. Pilot checklist and stop conditions

- [ ] One synthetic fixture covers draft, submitted, returned, HOLD, FAIL, PASS, approved, superseded, and audit-history states where relevant.
- [ ] Separate Receiving, Inspection Result, and Release System State are visible in the fixture.
- [ ] Failure reason and follow-up policy are explicit in the fixture; no scientific limits or policy values are invented for the test.
- [ ] Positive and negative permissions, scope, SoD, stale version, unavailable provider, and `SYSTEM_OWNER` boundaries are seeded and verified.
- [ ] Moderator can return to source record without a production mutation.
- [ ] No raw production data, secrets, passwords, or unapproved e-signatures are used.
- [ ] Screen-reader/keyboard and responsive variants are planned where participants need them; accessibility needs are not treated as defects in the participant.
- [ ] Timer, error taxonomy, assistance rules, and maximum task duration are piloted.
- [ ] Stop immediately for accidental production access, real controlled mutation, secret exposure, or attempted real signature/release/restore.

## 13. Open decisions and explicit assumptions

### RESEARCH HYPOTHESIS

- Record-level cross-domain links will reduce repeated search and improve return-to-source success.
- Separate state facts plus a typed “why unavailable” explanation will reduce `PASS → RELEASED`, `Approved → Effective`, and `Approved → Applied` misconceptions.
- Visible owner/version/evidence/audit context will improve decision confidence without reducing deliberate review quality.
- A stable vocabulary and action order across role workspaces will reduce terminology errors and unnecessary steps.

### UNVERIFIED ASSUMPTION

- The seeded fixture can represent every role’s intended workflow without policy ambiguity.
- The current live deployment exposes the same journey-context and handoff contracts as the current working tree.
- Participants will interpret `NCR`, `CAPA`, `RCA`, `SoD`, `Effective`, and `Superseded` consistently.
- Search and analytics event denominators will be sufficient to estimate repeated search, recovery, and navigation friction.

## 14. Conclusion

**Status: RESEARCH PLAN COMPLETE / PRODUCT USABILITY UNVERIFIED.** The repository supports a strong testable model of role boundaries, controlled state, cross-domain handoffs, and safe recovery. It does not supply participant evidence or current analytics proving that users can perform these tasks. The next valid claim must come from a piloted synthetic usability study and/or approved aggregate telemetry, with every recommendation retaining its `RESEARCH HYPOTHESIS` label until validated.
