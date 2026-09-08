# Restore Drill Evidence Record

**Record ID:** `RER-YYYY-MM-DD-NNN`  
**Drill type:** `DRILL` (production restore is separately policy-gated)  
**Provider:** `Render`  
**Status:** `DRAFT | ACCEPTED | REJECTED | BLOCKED | UNVERIFIED`  
**Rule:** Do not set `ACCEPTED` unless every required gate has current evidence.

## 1. Authority and target

| Field | Value |
|---|---|
| Incident/change reference | |
| Recovery authority / approver | |
| Operator | |
| Reviewer independent of operator | |
| Source environment | |
| Isolated target environment/service/database | |
| Target isolation confirmed | `YES/NO` |
| Start/end UTC | |
| Cleanup reference | |

Do not enter passwords, tokens, `DATABASE_URL`, private URLs, storage keys, or
provider credentials in this record.

## 2. Exact recovery set and application identity

| Field | Value / evidence reference |
|---|---|
| Backup set ID | |
| Provider restore reference | |
| Backup job result | `SUCCEEDED/FAILED/UNKNOWN` |
| PostgreSQL source version | |
| PostgreSQL restored version | |
| Git commit SHA | |
| Release/build ID | |
| Migration head | |
| Migration ledger/checksum evidence | |
| Object-store recovery reference | |
| Encryption/key availability evidence | `REFERENCE ONLY; NO SECRET` |
| Known gaps | |

## 3. Execution commands and results

Run from the exact release checkout. Keep connection values in the shell
environment; do not paste them into this record or command output.

```bash
pnpm exec tsx scripts/recovery/verify-recovery-manifest.ts \
  --manifest /secure/recovery/manifest.json

pnpm exec tsx scripts/recovery/run-recovery-checklist.ts \
  --manifest /secure/recovery/manifest.json \
  --database-url "$QC_RECOVERY_DATABASE_URL" \
  --object-root /secure/isolated-object-root
```

| Check | Result | Evidence reference | Notes |
|---|---|---|---|
| Manifest schema | `PASS/FAIL` | | Schema validation is not restore proof |
| Render physical restore | `PASS/FAIL/BLOCKED` | | Provider evidence required |
| PostgreSQL version/schema | `PASS/FAIL` | | Read-only validator |
| Migration ledger/checksums/head | `PASS/FAIL` | | No automatic migration |
| Core relations | `PASS/FAIL` | | Include source-defined core relations |
| History/audit relations and row presence | `PASS/FAIL` | | No controlled record rewrite |
| File metadata and evidence links | `PASS/FAIL` | | DB-side linkage |
| Object presence/size/SHA-256 | `PASS/FAIL` | | Isolated object root |
| Exact app compatibility | `PASS/FAIL/BLOCKED` | | Exact SHA/release |
| Authorization positive/negative | `PASS/FAIL/BLOCKED` | | Server-side only |
| Session behavior | `PASS/FAIL/BLOCKED` | | No token values |
| Secret exposure review | `PASS/FAIL/BLOCKED` | | Redacted artifact review |

## 4. Render operator procedure

1. Confirm the approved incident/change and isolated target. Never point the
   drill at production or a shared developer machine.
2. In Render, use the approved PostgreSQL recovery/export/clone capability
   available to the account. Record the operation ID/reference, source and
   target identities, UTC timestamps, and operator. If the required capability
   is not available, mark this record `BLOCKED`; do not substitute a claim.
3. Confirm the target is not receiving application traffic. Keep credentials
   in the provider secret mechanism and issue a short-lived isolated connection
   value only to the operator.
4. Run the manifest verifier and the checklist. The database checks are
   read-only. Do not run migrations, seeds, bootstrap, or DDL before recording
   the restored baseline.
5. Verify audit/history and file metadata relations plus representative row
   presence. Then verify every object in the manifest by existence, byte size,
   and SHA-256.
6. Start the exact release recorded above against the isolated target. Capture
   health/read-only compatibility evidence, then execute authorization allow/
   deny checks, session re-authentication/invalidation checks, and a redacted
   secret-exposure review.
7. If any gate fails or is missing, mark `REJECTED`, `BLOCKED`, or `UNVERIFIED`
   as applicable. Do not repair the restored baseline in place and do not turn a
   forward migration into restore evidence.
8. Execute approved cleanup and record the provider cleanup reference. Retain
   only evidence allowed by the approved retention policy.

## 5. Decision

| Decision | Select one | Evidence reference |
|---|---|---|
| Isolated physical restore actually executed | `YES/NO/UNVERIFIED` | |
| All automated checks passed | `YES/NO/UNVERIFIED` | |
| All manual security/application checks passed | `YES/NO/UNVERIFIED` | |
| Provider/PITR/WAL capability evidenced | `YES/NO/BLOCKED/NOT APPLICABLE` | |
| Overall drill | `ACCEPTED/REJECTED/BLOCKED/UNVERIFIED` | |

`ACCEPTED` is not permitted when any required row is `NO`, `BLOCKED`, or
`UNVERIFIED`. This template records evidence; it does not create physical
backup, WAL, PITR, RPO, RTO, or provider capability.
