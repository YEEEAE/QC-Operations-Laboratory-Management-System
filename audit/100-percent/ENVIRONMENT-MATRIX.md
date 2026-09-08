# QC-100-12 Environment Matrix

## Master Header

| Field | Value |
|---|---|
| Prompt | QC-100-12 |
| Scope | Production delivery, release governance and Secure SDLC |
| Target domains | 31, 32, 33, 78, 79, 80, 81, 85, 86, 87 |
| Review date | 2026-09-08 |
| Current branch | `main` |
| Current repository evidence | Local working tree only; provider/production evidence is not inferred |

This matrix is the environment contract. `LOCAL`, `TEST/CI`, `STAGING/UAT`, and `PRODUCTION` are distinct states; a passing lower environment never proves a production gate.

## Environment boundaries

| Environment | Purpose | Data / secrets | Release identity | Allowed mutation | Evidence required before promotion |
|---|---|---|---|---|---|
| LOCAL / DEVELOPMENT | Developer feedback and safe local checks | Disposable/local data only; no production secrets | `local-*`, may be dirty | Local migrations/seeds only when explicitly guarded | Command output and local diff |
| TEST / CI | Reproducible automated verification | Ephemeral PostgreSQL 18/Testcontainers and CI-managed secrets | `ci-*`, exact checkout SHA | Test fixtures only | CI run URL/ID, reports, artifact evidence |
| STAGING / UAT | Exact candidate operational and business acceptance | Isolated sanitized data and staging secrets | Same immutable candidate identity promoted from CI | Controlled migration and approved UAT fixtures | UAT cycle, migration, health, smoke and rollback decision records |
| PRODUCTION | Live controlled operation | Production database, object storage, sessions and secrets isolated from all lower environments | Exact approved release ID, SHA, artifact hash and migration head | Explicit operator-approved migration/bootstrap only | Signed release gate, provider deployment record, post-deploy evidence |

## Provider contract

- Render is the documented deployment baseline, but no Render service, database, secret, or deployment is claimed by this repository-only review.
- `render.yaml` pins Node `24.20.0`, uses Corepack/frozen pnpm install, starts `dist/server/entry.mjs`, and checks `/api/health/ready`.
- `DATABASE_URL`, `SESSION_SECRET`, and telemetry values are `sync: false`; their values must never enter Git, logs, artifacts, or client output.
- Production migration, foundation seed, initial-admin bootstrap, DNS, TLS, object storage, backup/PITR, and provider rollback require separate operator evidence.

## Promotion invariants

1. Build once and promote the same release identity; do not rebuild between UAT and production.
2. Every evidence record includes release ID, exact Git SHA, build/artifact ID or hash, application/service version, migration head, target environment, timestamp, and operator/automation reference.
3. A readiness endpoint is not a liveness proof; capture both separately.
4. A successful deployment message is not a post-deploy smoke result.
5. `UNVERIFIED`, `PARTIAL`, or `FAIL` on a critical item is `NO-GO`.
6. No production mutation is considered complete without a change record and release evidence record.

## Current evidence status

| Control | Current repository evidence | Status |
|---|---|---|
| Exact Node/pnpm | `.node-version`, `package.json`, `render.yaml`, CI setup | PASS (repository contract) |
| Frozen lockfile | CI and Render build commands | PASS (configured; execution still needs current CI evidence) |
| Release identity | `scripts/release/release-id.mjs`, `verify-release.mjs` | PASS (local contract) |
| Migration head | `0018_rate_limit_windows` from repository files | PASS (source head; applied DB head unverified) |
| Provider runtime | Render service/database/secrets | UNVERIFIED |
| Staging/UAT | Current candidate UAT record | UNVERIFIED |
| Production deployment | Provider deployment and smoke evidence | UNVERIFIED |

