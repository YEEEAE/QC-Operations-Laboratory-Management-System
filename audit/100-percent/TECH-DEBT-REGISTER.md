# QC-100-12 Technical Debt Register

## Master Header

| Field | Value |
|---|---|
| Prompt | QC-100-12 |
| Review date | 2026-09-08 |
| Owner model | Each item needs a named owner before promotion |
| Status vocabulary | `OPEN`, `IN_PROGRESS`, `BLOCKED`, `ACCEPTED`, `DONE` |
| Automation | `pnpm release:tech-debt:check` validates this table in CI |

This is an execution register, not a score. Debt remains open until evidence proves the stated exit condition. Do not convert missing evidence into `DONE`.

## Register

| ID | Priority | Domains | Debt / blocker | Owner | Status | Exit evidence |
|---|---|---|---|---|---|---|
| TD-001 | P0 | 31,32,33,78-81,85-87 | Provider-backed staging/production release evidence is absent | Release authority | BLOCKED | Exact candidate deployment, DB/migration, health, smoke, change and release records |
| TD-002 | P0 | 31,32,78,79 | Current CI run and dependency vulnerability/SBOM/provenance outputs are not available in this workspace | CI/security owner | OPEN | CI run ID, dependency policy result, SBOM/provenance artifact bound to SHA |
| TD-003 | P0 | 80,81,85 | Applied PostgreSQL head/checksum/privilege state is unverified | Database operator | BLOCKED | Redacted `db:preflight`, `db:migrate:status`, `db:migrate:check`, `db:schema:check` output against named target |
| TD-004 | P1 | 86,87 | Rollback/forward-fix rehearsal and post-deploy smoke are not provider-backed | Operations owner | OPEN | Staging rehearsal and exact decision record |
| TD-005 | P1 | 31,33 | Release/change evidence is not yet stored in an approved external record system | Change authority | OPEN | Record IDs linked from release gate |
| TD-006 | P1 | 85 | Node local runtime may differ from the pinned project contract | Developer/CI owner | OPEN | Verification under Node `24.20.0` or CI evidence |

## Automation contract

The checker must fail closed when:

- an ID is duplicated or malformed;
- priority/status is outside the vocabulary;
- an item has no owner, exit evidence, or status;
- a `P0` item is marked `DONE` without an explicit evidence reference in the row;
- the table header or required columns are changed without updating the checker.

The checker does not auto-close debt, mutate production, call providers, or treat a passing local test as deployment evidence.

