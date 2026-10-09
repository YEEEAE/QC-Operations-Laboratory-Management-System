# QC-LAUNCH-013 — Decision and execution plan

## Current disposition

- Task result: `BLOCKED`; criterion `QC360-SC-03-05` is `NOT_TESTED`.
- Product/code diff: none. The `src/pages/audit.astro`, `src/pages/approvals/[approvalId].astro`, `Documents/UAT-ACCEPTANCE-PLAN.md`, and `Documents/REQUIREMENTS-TRACEABILITY.md` source files were only inspected.
- Accepted score: `0.00 / 2.00`. An independent rubric reviewer has not accepted points.
- GitHub/remote: read-only; no branch, commit, push, PR, settings, or remote file changes.

## Controlled source/authority request

**To:** QC Record Owner and QMS / Document Control

1. Appoint the named QC Record Owner and QMS reviewer for this acceptance cycle; identify their controlled authority and participant roles. UAT plan decisions `UAT-DD-001` and `UAT-DD-002` are currently deferred.
2. Provide the effective, approved action-specific authority for each signature/review/correction/void step, including signer role, meaning, required reauthentication, separation-of-duties constraints, permitted states, and version binding. `UAT-DD-008`, `REQ-APR-009`, and `REQ-ESIG-008` remain unresolved/policy-dependent. Do not execute an unsupported signature or void action.
3. Decide whether the current browser surfaces, together with the linked record and audit views, provide sufficient historical actor, version, trusted time, reason, and replay-denial evidence. The approval timeline at `src/pages/approvals/[approvalId].astro:65-68,73-78` contains request/assignment/start milestones and a descriptive source-transition entry; the audit table at `src/pages/audit.astro:69-74` does not display a version column. This is an observation for controlled review, not a confirmed product defect.
4. Return a signed/controlled decision identifying any required remediation and its approved source/revision. Until then, preserve fail-closed behavior and do not grant criterion points.

## Synthetic execution sequence after authority is supplied

1. Freeze the exact application/build identity and provision a disposable PostgreSQL 18 database with only synthetic records. Record environment identity, migration head, generated business IDs, roles, and candidate SHA.
2. Execute the authorized sign/review path, then correction/return to a new version, then void only if an effective controlled path allows it. For each event, capture browser route, actor identity/role, action, reason, trusted time, exact subject/version, state transition, and immutable audit/signature references.
3. Attempt replay in the isolated fixture. Verify denial or idempotent reconciliation according to the approved operation contract, with no unauthorized or duplicate controlled/audit/signature write.
4. Have the appointed QC Record Owner and QMS reviewer inspect the record and approval chain in-browser. Record each scenario as `PASS`, `FAIL`, `BLOCKED`, or `NOT EXECUTED`; link unedited evidence; record findings and remediation; sign the final acceptance record with actual identities and the same release SHA.
5. If a required version/actor/time/reason field cannot be inspected or replay is accepted improperly, open a controlled finding. Engineering must reproduce it on the same candidate and make the smallest authorized fix; any source change creates a new candidate and invalidates affected prior evidence.

## Owners, dependencies, and blockers

| Work | Owner | Dependency | Current state |
|---|---|---|---|
| Appoint authorized participants and acceptance authority | QC Record Owner / QMS | Controlled appointment and authority | BLOCKED |
| Approve action-specific signature/review/correct/void map | QMS / Document Control | Effective controlled policy revision | BLOCKED |
| Provide isolated PG18 fixture and authenticated browser access | Verification / environment owner | Safe isolated environment; no production data | NOT AVAILABLE |
| Execute browser inspection, replay denial, and sign acceptance | Appointed QC Record Owner + QMS | Prior items complete; candidate SHA frozen | NOT TESTED |
| Independently review score and accept earned points | Independent rubric reviewer | Signed candidate-bound evidence | NOT AVAILABLE |

## Rollback and remote boundary

No product patch, schema change, database write, role change, deploy, or remote update was made. The three local evidence files and the short Project Mind ledger entry are reversible documentation-only additions. If this packet is superseded, retain it as candidate-bound evidence and create a new packet rather than editing an already signed human record. No human signature record exists yet.
