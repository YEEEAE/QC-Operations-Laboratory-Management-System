# QC-LAUNCH-016 — patch or decision plan

## Local change summary

- No application source, permission, lockfile, migration, controlled document, or remote resource was changed.
- Restored `audit/100-percent/ai-evals/deterministic-eval-dataset.json` byte-for-byte from the parent of deletion commit `60e78cc6fdafe6c70e249be2d687c1df3af45412`; SHA-256 `83fbd94816e3bfeede5d9c994216d4cf0d962867e0e5d79fd2c3da21ba395160`. The extant AI eval test reads this synthetic-only dataset. On the new source fingerprint, all 33 eval cases ran with zero category disposition errors.
- Added the required local execution report and evidence register. Rerun logs, SBOM, license inventory, and the synthetic metrics negative check are stored under ignored `.ci-results/QC-LAUNCH-016/observed/`.
- `pnpm-lock.yaml` was not changed because the registry advisory service was unreachable and no current vulnerability result was available to justify remediation.

## Owners and next actions

| Owner | Action | Exit evidence |
|---|---|---|
| Engineering / CI | Restore registry DNS/network access, then rerun `pnpm audit --audit-level high` and refresh SBOM/license inventory for this exact SHA. | Successful current advisory response; triage every high/critical item and pin only justified lockfile remediation. |
| Engineering / test infrastructure | Provide isolated PostgreSQL 18/Testcontainers capability. The missing AI eval dataset has been restored locally from its exact deletion parent. | `pnpm test:security` completes without infrastructure/setup failure on a frozen candidate. |
| Security / QC | Run approved synthetic authenticated negative HTTP cases for authorization, session fixation/expiry, CSRF, output encoding, brute force, IDOR/download scope, and secret-free response/audit behavior. | Candidate-bound logs, actor roles, response status/body, unchanged records/audit controls, and independent reviewer. |
| Security / Operations | Confirm the deployed production metrics route remains inaccessible using an authorized non-production deployment or exact-release test environment. | Runtime proof bound to the deployed source SHA and environment; do not use production data. |
| Independent rubric reviewer | Review only completed candidate-bound evidence and decide accepted points. | Signed reviewer disposition; until then accepted points remain 0. |

## Rollback

There is no product patch to roll back. Remove only the QC-LAUNCH-016 local report packet and its `.ci-results` evidence outputs if the owner requests cleanup; preserve the original repository state and never remove unrelated audit evidence.

## Dependencies and controls

- Requires supported Node `24.20.0`, pnpm `11.25.0`, a reachable npm registry, and an isolated PostgreSQL 18 runtime.
- No production database, deployment, account/role change, controlled-document edit, GitHub write, commit, or push was performed or is authorized by this task.
- AI external processing stays governed by the existing policy gate; no live provider request was made.
- Criteria `QC360-SC-07-03` and `QC360-SC-07-04` remain unaccepted and worth 0 points pending complete evidence and independent review.
