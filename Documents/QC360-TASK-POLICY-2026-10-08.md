# QC360 Task reference and recurrence technical policy

Policy identity: `QC360-TASK-POLICY-2026-10-08/v1`.
Authored on 2026-10-08 under the user's explicit request to create sources for QC360 residual requirements. Status: USER-AUTHORIZED TECHNICAL IMPLEMENTATION SOURCE. This document records the implemented contract; no named QMS ratification, electronic signature, effectivity approval, production execution or human UAT is asserted.

## REQ-TASK-002 / BR-TASK-002

A Task may carry one immutable reference to DOCUMENT, LAB_TEST, CHANGE_REQUEST, FINDING, NCR, RCA or CAPA. The caller must hold the active owning application's VIEW permission, and its application read facade must resolve that identity in the caller's scope before Task creation. Each detail read rechecks this access. Missing or denied records expose no related title or link; provider failure is shown separately as unavailable. Task ownership, assignee and lifecycle stay Task-owned. Task creation, completion, reopen and deletion never transfer ownership, mutate, approve or release the foreign record. A reference supplies context, never mandatory evidence or approval authority. Other foreign record categories require an explicit adapter and source extension before use.

## REQ-TASK-008 / BR-TASK-009

This version authorizes the smallest recurrence-generation contract: an active operator with PERM-TASK-CREATE submits one explicit rule identity and one canonical UTC occurrence instant (`YYYY-MM-DDTHH:mm:ss.sssZ`) through the existing native/Action creation path. Each occurrence starts DRAFT and follows the existing permissioned lifecycle. The operator supplies the established schedule occurrence; the application does not infer frequencies, working days, missed intervals, time zones, scientific tasks, escalation, assignment or disposition.

The global pair `(rule identity, occurrence instant)` identifies exactly one Task. A transaction advisory lock serializes concurrent generators, followed by a unique database index. An identical normalized request by the same owner returns the original Task in its current state and creates no new business row, audit event or outbox event. A changed owner, task number, title, description, priority, due date, assignee or specialized reference for that pair yields CONFLICT_DUPLICATE_COMMAND. Replay rechecks current creation, assignment and foreign-record view authorization. Request IDs and generation timestamps do not affect equivalence. Generated occurrences cannot be deleted through the draft-delete application path, preserving deduplication history; they can use existing lifecycle actions where authorized. Ordinary draft editing does not redefine the immutable original request fingerprint.

New creation, audit and outbox stay atomic in the repository transaction. This implementation does not activate an autonomous scheduler, external cron, paid service or system-actor permission. An autonomous schedule/rule catalogue, missed-run policy, cancellation/retention authority and production activation remain separate owner decisions. The implemented operator-driven generation must not be reported as an activated autonomous scheduler.

## Verification boundary

Focused unit checks and local PostgreSQL probes, when performed, prove only the candidate technical behavior. Applied production migration, provider runtime, authenticated browser/assistive-technology acceptance and human UAT remain NOT VERIFIED unless independently evidenced. The source migration is 0047_task_references_occurrences.sql; execution on production is outside this request.
