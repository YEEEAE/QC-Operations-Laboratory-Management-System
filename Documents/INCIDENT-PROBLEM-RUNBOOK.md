# Incident & problem runbook

**Task:** QC-100-FINAL-025 — incident triage and problem records
**Status:** OPERATIONAL RUNBOOK (derived). It standardizes records and exercises; it does
not replace the canonical policy in `Documents/INCIDENT-QUICK-REFERENCE.md` and does not
create an incident system, on-call rotation, or notification channel.
**Evidence:** local failure/recovery exercise executed on the frozen candidate
(see `audit/2026-09-20/QC-100-FINAL-025-first-day-operating-checklist.md` §Item 2).

## 1. Scope and hard rules

- Triage anchor: the user-visible `requestId`, correlated to `traceId` via structured
  logs (per `INCIDENT-QUICK-REFERENCE.md`). Never record secrets, session tokens,
  connection strings, provider payloads, or raw stack traces in any record below.
- `PASS ≠ RELEASED`. A recovered service is not a released service; controlled business
  truth comes from QC Audit and current state, not from logs.
- Notifications are in-app only. Incident work must not send external alerts; external
  alerting does not exist on the candidate.
- Human approvals (e.g., production restore authorization) are external dependencies —
  record them as `BLOCKED` until the authorized artifact exists; never simulate one.

## 2. Incident record (template)

| Field | Content |
| --- | --- |
| Incident ID | From the approved incident system; `LOCAL-EXERCISE-*` for drills only |
| Detected at (UTC) | Timestamp and detection surface (readiness probe, user report, log) |
| Impact | Affected scope, affected roles, data at risk, business processes halted |
| Severity → tier | Map to `SUPPORT-OWNERSHIP-REGISTER.md` tiers L1–L4 |
| Safe containment | Immediate reversible action (halt scope, stop retries, freeze deploys) |
| Diagnosis | requestId → traceId → failing span/dependency → canonical error code |
| Current-state checks | Idempotency record, record version, QC Audit cross-reference for controlled events |
| Recovery actions | Ordered, reversible, each with executor function (not a named person unless agreed) |
| Recovery verification | Health/readiness + business integrity checks with current evidence |
| Follow-up | Linked problem record ID, or explicit "no problem record needed" with reason |

## 3. Problem record (template)

| Field | Content |
| --- | --- |
| Problem ID | From the approved incident/problem system |
| Linked incidents | Incident IDs that evidenced this problem |
| Root cause | Verified cause; "unknown — under investigation" is a valid honest state |
| Contributing conditions | Environment/config/policy gaps that allowed it |
| Corrective actions | Each with owner (function), due state, and reversible plan |
| Preventive actions | Tests/checks/monitors added, with evidence links |
| Closure criteria | What evidence closes the problem (never "time passed") |

## 4. Exercised scenarios (local, disposable data)

Executed 2026-09-20 against the disposable local PostgreSQL 18.6 cluster (database
`qc_f025`, task-owned keys `f025-*`); no external alert, no human approval simulated:

| Scenario | Steps exercised | Result |
| --- | --- | --- |
| S1 Dependency outage | Outage probe on unreachable endpoint failed closed with no credential leak in the error; recovery probe answered on the returned dependency under TLS verify-full | PASS |
| S2 Ambiguous controlled write (timeout-class) | Retry with same key + fingerprint replayed the recorded `COMPLETED` outcome (effect executed once); conflicting fingerprint rejected by the unique key, original record unchanged (409-class) | PASS |
| S3 Outbox/notification side-effect failure | Committed business record survived the undelivered outbox side effect; duplicate `dedupe_key` rejected; exactly one pending row remained claimable for separate recovery | PASS |
| S4 Backup-set integrity + isolated restore | `pg_dump` (276,813 bytes) restored into isolated `qc_restore_f025`; read-only validation PASS (77 tables, 31-entry ledger, checksums); corrupted-ledger negative control FAILed honestly; provider/operator gates remain BLOCKED | PASS (local) |

Raw machine output is retained in the ignored `.tmp/qc-f025/` bundle; redacted summaries
and checksums are in the audit record. These are local exercise results — continuity
without measured provider recovery evidence is never claimed.

## 5. Failure → first response map (derived, not new policy)

| Signal | First response | Canonical reference |
| --- | --- | --- |
| `503` readiness | Treat as dependency/readiness problem; preserve request correlation | `INCIDENT-QUICK-REFERENCE.md` §Error handling |
| `409` stale version / idempotency | Current-state investigation, not overwrite | Same |
| Timeout after a controlled write | Check idempotency/current state before any retry | Same |
| Candidate/build mismatch | Stop promotion; compare release JSON, SHA, build ID, migration head | Same §Release-related incidents |
| Ledger/hash mismatch in restore | Stop the drill; no automatic repair or destructive retry | `RESTORE-DRILL-RUNBOOK.md` §Failure handling |
