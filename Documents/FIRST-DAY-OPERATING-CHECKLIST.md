# First-day operating checklist

**Task:** QC-100-FINAL-025 — first-day operating checklist
**Status:** DERIVED OPERATIONAL LIST for the candidate working tree. It does not create
policy, RPO/RTO values, ownership assignments, or release authorization.
**Authority (read-only sources):** `Documents/PRODUCTION-READINESS-CHECKLIST.md`,
`Documents/BACKUP-RECOVERY-PLAN.md`, `Documents/RESTORE-DRILL-RUNBOOK.md`,
`Documents/RELEASE-RUNBOOK.md`, `Documents/RENDER-MIGRATION-RUNBOOK.md`,
`Documents/ROLE-OPERATING-GUIDES.md`, `Documents/SUPPORT-OWNERSHIP-REGISTER.md`,
`Documents/INCIDENT-QUICK-REFERENCE.md`, `Documents/OBSERVABILITY-ARCHITECTURE.md`.

> **Read this first.** `PASS ≠ RELEASED`. The 2026-09-19 independent audit of candidate
> `653b58d22d4a17994db7376a3bd691ca6e789f1a` is **NO-GO** (maturity 45.8%, gates 0/19).
> No row in this checklist converts a missing external dependency into readiness.
> Rows marked `READY (local)` have current local evidence on the frozen candidate.
> Rows marked `PENDING (external)` require the named owner and must not be worked
> around, re-scored, or presented as done.

## 1. Status vocabulary

| Status | Meaning |
| --- | --- |
| `READY (local)` | Verified on the frozen candidate working tree by current evidence. |

## 2. First-day checklist

| # | Item | Evidence (current) | Owner | Dependency | Reversible action |
| --- | --- | --- | --- | --- | --- |
| 1 | Confirm the candidate identity being operated: Git SHA + release identity from `dist/release-identity.json`, migration head `0031_qc_creation_parity_two_stage_approval` | `release:identity` run on this tree (audit record §2) | Operator on duty | None (local) | Read-only; no state change |
| 2 | Run the daily backup job against the environment under operation (`pnpm recovery:backup:daily` with provider store env) | Local job contract verified by FINAL-008; **provider R2 env + scheduled trigger not wired** | L3 Admin function | DEP-025-02, DEP-025-03 | Backup artifacts are additive; deleting a set is a governed retention act |
| 3 | Verify latest backup set integrity before relying on it (`verify-recovery-manifest` + detached SHA-256) | FINAL-008 bundle checks PASS locally; **no production backup set exists** | L3 Admin function | DEP-025-02 | Read-only verification |
| 4 | Check readiness/liveness surfaces before opening work: `/api/health/live`, `/api/health/ready`, `/system/health` (owner-only) | Live probes `200 healthy` re-verified 2026-09-19 (read-only); DB failure → sanitized `503` (FINAL-014; re-exercised locally in this task, scenario S1) | L4 named system owner for `/system/health` | None for probe; interpretation needs DEP-025-04 | Read-only |
| 5 | Confirm migration head parity between source and applied environment before any workday claim | Source head `0031`; **Render applied head `0018`, pending `0019`–`0031`** → `STOP` for production claims | L4 named system owner | DEP-025-01 (credential rotation gate, FINAL-015) | Parity check is read-only |
| 6 | Review overnight notification/backlog surface: unread notifications per role on `/dashboard` | In-app notification read model verified on candidate (FINAL-017/022); **no external delivery channel exists by design** | Each role per `ROLE-OPERATING-GUIDES.md` | None (local) | Read-only |
| 7 | Review the work queue (`/work`): ASSIGNED / DUE_TODAY / OVERDUE / BLOCKED groups with reasons | FINAL-022: definitions, server filters, and audit parity PASS | Each role | None (local) | Read-only |
| 8 | Confirm the support escalation path is understood (L1→L4 functional tiers) | `SUPPORT-OWNERSHIP-REGISTER.md` exists; **every L1–L3 row is `UNRESOLVED` (no named on-call)** | 013/026 for naming | DEP-020-10 | Documentation only |
| 9 | Backup retention posture: apply only the documented local retention rule; no deletion of evidence-bearing sets without authority | `retention.ts` contract unit-verified; provider retention **NOT VERIFIED** | L3 Admin function | DEP-025-02 | Deletion is irreversible → requires authority |
| 10 | Monitoring/alerting posture: structured logs + requestId/traceId correlation exist; **no exporter/alert pipeline configured on Render** (OTEL env absent) | `OBSERVABILITY-ARCHITECTURE.md`; live service env re-verified 2026-09-18 | L4 named system owner | DEP-025-04 | Config change on provider; reversible via env revert |
| 11 | Release-gate posture: gates remain **0/19**; no evidence ingestion for CI/security/E2E exists | FINAL-013 F-013-2; mind §14 | 013 + deployment path | DEP-025-05 | Read-only reporting |
| 12 | Stop-work review: any row in §4 tripped during the day halts the affected scope | This checklist §4 | Everyone | None | Halting is always safe; resuming needs the cleared condition |

## 3. Scheduled jobs

| Job | Contract | Trigger reality | First-day duty |
| --- | --- | --- | --- |
| Daily logical backup | `scripts/recovery/run-daily-backup.ts` → `runLogicalBackupJob`, fail-closed, artifact + manifest to R2 store | **No scheduler is wired** (calendar contract exists in `CalendarBackupScheduler`; no cron/trigger in the app or on the provider) | Operator runs it manually or schedules it externally; record the run as evidence |
| Monthly isolated restore drill | `scripts/recovery/run-monthly-restore-drill.ts` + `RESTORE-DRILL-RUNBOOK.md` | Same — calendar contract only | Schedule the drill; use the DR evidence template |
| Notification delivery | **None external.** Notifications are in-app records with replay-safe outbox dedupe; there is no email/SMS/webhook channel to monitor | By design | Watch unread counts; treat any claimed external alert as out of scope |

## 4. Minimum operating mode and stop-work conditions

Derived from `PRODUCTION-READINESS-CHECKLIST.md` (§7 FAIL / §8 UNVERIFIED / §10 outcomes),
`INCIDENT-QUICK-REFERENCE.md`, and `BACKUP-RECOVERY-PLAN.md`. No threshold is invented.

**Minimum operating mode (candidate/local operation):** authentication + authorization
enforced server-side, canonical health/readiness answering truthfully, database on the
frozen migration head, in-app notifications readable, daily backup executed and verified,
immutable QC audit untouched. Anything less is degraded, not "fine".

**Stop-work conditions — halt the affected scope immediately:**

1. Readiness returns `503`/degraded, or any surface that should fail is reported healthy
   by a dashboard (never hide a failed dependency behind a healthy dashboard).
2. Migration parity broken (applied head ≠ source head) on the environment in use.
3. A controlled action (approval/release/signature) outcome is ambiguous — stop blind

## 5. Unresolved external dependencies (fed to final audit 012)

| ID | Dependency | Owner | Blocks |
| --- | --- | --- | --- |
| DEP-025-01 | Credential rotation + production migration gate (applied head `0018` vs source `0031`) | operator / FINAL-015 | Any production operating day |
| DEP-025-02 | R2 artifact-store credentials + provider retention/PITR evidence | provider owner / 008 | Backup rows 2/3/9 production claim |
| DEP-025-03 | External scheduler wiring for daily backup / monthly drill | operator | "Scheduled" claim for jobs |
| DEP-025-04 | Monitoring/alerting pipeline (OTEL exporter, alerts) on the provider | L4 named owner | Row 10 |
| DEP-025-05 | Release-gate evidence ingestion (CI/security/E2E) | 013 + deployment path | Gates above 0/19 |
| DEP-025-06 | Organizational naming of L1–L3 support owners (DEP-020-10) | 013/026 | Escalation-by-name |
| DEP-025-07 | Authenticated E2E / accessibility / UAT on this candidate | 003 / 006 / 040 / 004 | Any UX/UAT readiness claim |

   retries and follow the idempotency/current-state checks.
4. A restore/backup integrity check FAILs (ledger, checksum, relation, or hash mismatch).
5. Any secret, credential, or raw diagnostic appears in a log, artifact, or support
   channel.
6. Data-loss, tamper, or unauthorized-scope evidence appears — escalate to the named
   system owner before any further write.


| `PENDING (external)` | Blocked on an external operation, human decision, or provider evidence. Owner named per row. |
| `STOP` | Stop-work condition applies; do not proceed until it clears (§4). |
