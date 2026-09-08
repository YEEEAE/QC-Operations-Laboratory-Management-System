# QC-100-12 Release Gate

## Master Header

| Field | Value |
|---|---|
| Prompt | QC-100-12 |
| Gate | Production Delivery, Release Governance and Secure SDLC Closure |
| Target domains | 31, 32, 33, 78, 79, 80, 81, 85, 86, 87 |
| Decision vocabulary | `GO`, `NO-GO`, `GO WITH EXPLICIT ACCEPTED RISK` only where policy permits |
| Review date | 2026-09-08 |
| Current decision | `NO-GO` — provider, UAT, production and database evidence are not current in this workspace |

## Release identity (required, never generic)

| Field | Candidate value | Evidence reference |
|---|---|---|
| Release ID | `<rel-...>` | `dist/release-identity.json` / CI artifact |
| Git SHA | `<40-char SHA>` | CI checkout assertion / provider revision |
| Build ID | `<CI run/build ID>` | CI run and artifact metadata |
| Artifact path + SHA-256 | `<path>`, `<64-char hash>` | Build artifact manifest |
| Application/service version | `<version>` | `package.json` and release identity |
| Migration head + checksum | `<migration>`, `<hash>` | release identity + DB ledger check |
| Target environment | `STAGING/UAT` or `PRODUCTION` | environment record |
| Review/UAT/change IDs | `<IDs>` | approved records |

Placeholders are not evidence and must not be replaced with prose such as “updated site”.

## Gate checklist

| Gate | Required evidence | Status rule |
|---|---|---|
| Source integrity | Clean exact SHA checkout; no untracked production mutation | PASS only with current checkout/provider evidence |
| Toolchain | Node `24.20.0`, pnpm `11.25.0`, frozen lockfile | PASS only from the exact candidate run |
| Dependency security | Lockfile review, vulnerability policy/result, license review where required, SBOM if supported | Missing current result = UNVERIFIED |
| Build/provenance | Reproducible build, artifact hash, release ID, provenance/attestation if provider supports it | Identity must bind to the exact SHA |
| Static verification | format, lint, typecheck, architecture, unit tests | Any critical failure = NO-GO |
| Database preflight | Connectivity, PostgreSQL major version, schema/search path, privilege and migration integrity checks | No secret values in evidence |
| Migration preflight | Pending migration list, checksum ledger, lock/transaction result, forward-only plan | Unknown applied head = NO-GO |
| Foundation/admin | Production seed verification and one-time admin bootstrap verification | Explicit operator evidence only; never infer from code |
| Environment protection | Distinct lower/prod secrets/config; no source secrets; protected deployment path | No protected config evidence = UNVERIFIED |
| Health | Liveness and readiness captured separately | Redirect/HTTP deployment message is insufficient |
| Staging/UAT | Critical workflow acceptance against the same release identity | Missing UAT = NO-GO |
| Production smoke | Non-destructive login and authorized-read smoke, DB/object/outbox health as applicable | Must be after deploy and release-bound |
| Recovery decision | Rollback vs forward-fix decision, schema compatibility, recovery posture | Never silently reverse controlled history |
| Evidence record | Release, change, deployment, migration, smoke and incident references | Generic summaries are rejected |

## Deterministic decision procedure

1. Freeze source and create CI release-candidate identity.
2. Run all repository verification and dependency checks; retain machine-readable outputs.
3. Verify artifact identity against the exact checkout SHA and migration source head.
4. Run staging database/migration preflight and promote the same artifact to Staging/UAT.
5. Capture UAT, health, security, backup/recovery posture and change approval.
6. Re-evaluate this gate. Any critical `FAIL`, `PARTIAL`, or `UNVERIFIED` yields `NO-GO`.
7. If approved, deploy the same immutable artifact to Production with an explicit change record.
8. Run liveness, readiness, non-destructive smoke and migration-head verification; record exact outputs.
9. Decide rollback or forward-fix from actual schema compatibility and controlled-record risk. Re-verify after any corrective release.

## Current repository-backed result

- PASS at contract level: exact runtime pins, frozen install commands, release identity, artifact hashing, migration source checksum, readiness route, guarded seed/bootstrap commands, and CI test sequence exist.
- UNVERIFIED: current CI run, dependency vulnerability/SBOM result, provenance attestation, staging/UAT, provider deployment, live DB migration head, production seed/admin check, smoke, rollback rehearsal, and release/change records.
- Therefore the current gate is `NO-GO`; this is an evidence status, not a claim that the implementation is permanently incomplete.

