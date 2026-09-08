# DR Evidence Matrix

**Prompt:** `QC-100-11`  
**Date:** 2026-09-08  
**Hosting context:** Render Web Service + Render-managed PostgreSQL, with object storage provider still deployment-dependent  
**Posture:** evidence-first; repository checks are not a physical restore

## Decision rule

`BACKUP CREATED` is not `RESTORE VERIFIED`. A DR domain can only move to a
verified state after an isolated restore is actually executed and the evidence
below is attached to a new Recovery Evidence Record. A script, manifest, backup
catalog row, or provider UI message alone cannot close the domain.

| Evidence gate | Required proof | Current repository evidence | Status | Owner / exact action |
|---|---|---|---|---|
| 1. Approved target | Isolated non-production Render target and change/incident authority | [`RESTORE-DRILL-RUNBOOK.md`](../../docs/operations/RESTORE-DRILL-RUNBOOK.md) defines isolation; no target execution record | BLOCKED | Database/Platform Owner creates the isolated target and records service/database identifiers without secrets |
| 2. Provider restore | Render restore/export/clone operation completed with provider reference, timestamps, operator, and source/target identity | No provider API or physical restore implementation in repository | BLOCKED | Execute the approved Render operation manually; attach provider evidence |
| 3. PostgreSQL context | Version, schema, core relations, history relations, and read-only connectivity | `scripts/recovery/validate-restored-database.ts` | UNVERIFIED | Run checklist with the isolated `--database-url` |
| 4. Migration ledger | Exact ordered ledger and SHA-256 checksums match the immutable repository migrations and application head | Existing manifest contract + validator | UNVERIFIED | Capture `qc.schema_migrations` and compare; do not run forward migrations before baseline evidence |
| 5. Audit/history | `qc.audit_events`, controlled history relations, and representative audit rows are present and readable | Structural relation checks exist; no current restored-target evidence | UNVERIFIED | Record relation presence, row-presence query result, and sample IDs/timestamps only |
| 6. File metadata | Restored DB metadata (`qc.files`, `qc.evidence_links`) remains present and linked | File schema exists; no restored-target evidence | UNVERIFIED | Verify metadata/linkage on the restored DB and attach query result without sensitive content |
| 7. Object presence/integrity | Every manifest object exists, size matches, and SHA-256 matches | `scripts/recovery/validate-restored-files.ts` | UNVERIFIED | Run checklist with an isolated object root; no copying or mutation is performed |
| 8. Application compatibility | Exact release/Git SHA starts and reads restored data with matching migration head | App context is required in manifest; no drill evidence | BLOCKED | Start exact release and attach health, read-only record, and file-link checks |
| 9. Authorization | Server-side allowed and denied cases, including scope and protected operations | Authorization tests cover code paths; no restored-target smoke evidence | BLOCKED | Execute positive/negative checks with test identities; UI visibility is not evidence |
| 10. Sessions | Recovery impact on existing sessions, forced re-authentication, and disabled-account denial | Session service/tests exist; no recovery session evidence | BLOCKED | Run isolated session test and record token outcomes, never token values |
| 11. Secret exposure | Logs, manifests, provider output, and artifacts contain no credentials or raw URLs | Validators avoid printing credentials; no provider log evidence | BLOCKED | Review redacted logs/artifacts and record only pass/fail and artifact references |
| 12. Cleanup | Isolated target and copied objects are removed/retained according to approved policy | Policy/provider decision not evidenced here | BLOCKED | Execute approved cleanup and attach deletion/retention evidence |

## Domain mapping

| Target domain | Evidence required for improvement | Current disposition |
|---|---|---|
| 9 — Recovery | Gates 2–7 and a new evidence record | UNVERIFIED; tooling exists, real restore absent |
| 14 — Database recovery integrity | Gates 3–6, exact ledger/checksum comparison, no silent migration | UNVERIFIED; read-only validator available |
| 20 — Evidence/file integrity | Gates 6–7, metadata linkage plus object size/hash | UNVERIFIED; file validator available |
| 82 — Restore verification | All gates 1–11, with isolated restore and exact release | BLOCKED; no current drill evidence |
| 83 — Business continuity | Restore verification plus approved provider procedure, recovery authority, and tested application/security behavior | BLOCKED/UNVERIFIED; RPO/RTO/PITR not invented |

## Safe automation boundary

```text
run-recovery-checklist.ts
  ├─ validates manifest schema and SHA-256 syntax
  ├─ optionally runs read-only DB validation
  ├─ optionally validates restored file bytes/size/hash
  └─ emits BLOCKED manual/provider gates

Render/provider tooling
  └─ must be executed and evidenced by an authorized operator
```

The checklist never creates a backup, invokes Render, performs physical
restore/WAL/PITR, runs migrations, changes sessions, or declares restore proof.
