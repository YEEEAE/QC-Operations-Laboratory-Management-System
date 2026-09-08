# QC-100-13 — Executable Usability Study Package

## MASTER HEADER

- Repository: `YEEEAE/QC-Operations-Laboratory-Management-System`
- Target: `main`
- HEAD under audit: `ca8d1bdc49d84cb447c88ed12d380a38ff3940e9`
- Study status: `UNVERIFIED — no real participants have executed this study`
- Confidential production data: prohibited; use seeded, synthetic records only

## Objective

Measure whether representative users can complete critical QC and laboratory workflows without unsafe workarounds, hidden state changes, scope leakage, or confusion between inspection result and release authority.

## Participants

Recruit at least one representative for each role for a pilot, then 5–8 per segment for a formal study: Employee, QC Inspector, Laboratory user, Supervisor, Manager, Administrator, and Auditor. Record role, experience band, accessibility needs, and whether the participant has prior exposure to this product. Do not record names in the result dataset.

## Moderated protocol

1. Use a fresh seeded account and synthetic records for every session.
2. Read the scenario exactly as written; do not name buttons or routes.
3. Ask the participant to think aloud, but do not coach.
4. Stop assistance after one neutral clarification and record the assistance.
5. Capture screen recording only with consent; otherwise use the observation sheet.
6. Do not ask the participant to make a real approval, release, signature, or production change.

## Task scenarios

| ID | Representative role(s) | Scenario and success criterion |
|---|---|---|
| U-01 | All | Log in with the supplied test account and reach the assigned work view without exposing another scope. |
| U-02 | Employee, QC Inspector, Laboratory user | Find the work assigned to you and open the correct record. |
| U-03 | QC Inspector | Create and complete a Receiving inspection using synthetic evidence; leave the item in the correct non-release state. |
| U-04 | Laboratory user | Record laboratory observations with raw values and controlled context; do not invent a limit. |
| U-05 | QC Inspector, Supervisor | Handle a HOLD condition and explain what remains blocked. |
| U-06 | QC Inspector, Supervisor, Manager | Create and review an NCR/CAPA without silently changing controlled history. |
| U-07 | Supervisor, Manager | Review an approval task and identify the required authorized human decision. |
| U-08 | All applicable roles | Find the current WI/SOP version and distinguish it from a superseded version. |
| U-09 | Laboratory user, Administrator | Find equipment and calibration status and identify an ineligible instrument. |
| U-10 | Supervisor, Manager, Auditor | Export a permitted report and state its scope and timestamp. |
| U-11 | Auditor, Manager | Trace the audit history for a synthetic record from creation through its current state. |

## Measures

For every task record: success (yes/no), time on task in seconds, error count, backtracking count, failed navigation count, form correction count, assistance (none/clarification/coaching), and confidence (1–5). After the session record SEQ (1–7) per task and SUS only after the full task set. A participant result is not a system result; aggregate only after the planned sample is complete.

## Observation record

```text
session_id,role,task_id,success,time_seconds,error_count,backtracking_count,
failed_navigation_count,form_correction_count,assistance,confidence_1_to_5,
seq_1_to_7,unsafe_workaround,scope_or_authority_confusion,notes
```

## Pilot checklist

- Seeded accounts cover each role and required permission boundary.
- Synthetic records cover draft, HOLD, approved, superseded, and audit-history states.
- No task requires an unresolved scientific limit or policy decision.
- Recorder consent and data-retention wording are approved.
- Stop conditions are defined for accidental production access, scope disclosure, or attempted real signature.
- Observer can timestamp every task and record assistance without coaching.

## Analysis and acceptance

Report raw counts, medians, ranges, and missing sessions. Do not fabricate a success rate or time-on-task value. Findings need a task ID, role, observed evidence, severity, and proposed owner. This package becomes runtime/UAT evidence only after actual sessions are executed and the signed study record is attached to this HEAD.
