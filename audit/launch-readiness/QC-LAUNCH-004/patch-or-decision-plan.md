# QC-LAUNCH-004 — local patch / decision plan

## Local diff summary

- No application, database, or migration source code changed.
- Added the required execution report and evidence packet, plus an observation record.
- Updated Project Mind with the current candidate and environment blockers.

## Owners and dependencies

- Engineering: rerun pnpm test:migrations and pnpm test:concurrency on this exact candidate using disposable PostgreSQL 18 Testcontainers.
- Platform / host owner: provide Docker and Node 24.20.0 or a later supported 24.x release.
- Database / release owner: provide a dedicated intrinsically read-only Neon role for repeatable parity checks. This capture used the existing direct endpoint within `BEGIN READ ONLY`; no writes or row-level data scans occurred. The repository has no canonical schema-hash contract.
- Independent QC rubric reviewer: review fresh candidate-bound evidence before accepting any points.

## Decision

Do not award QC360-SC-06-03 or QC360-SC-06-04 points from this run. Source filename order/checksums are a static PASS. PostgreSQL 18 Testcontainers runtime remains BLOCKED. Live Neon read-only parity is VERIFIED_FAIL: 45 applied checksums match, but 0046/0047 are pending and their two expected tables are absent. Both exact checker commands were limited to a safe localhost target because their shared helper issues CREATE SCHEMA and is not strictly read-only. Keep schema drift and pending migrations release-blocking. No source defect was demonstrated, so no code or migration fix is proposed.

## Rollback and external effects

No database or remote repository writes occurred. The bounded local evidence packet can be removed if rejected; preserve it if audit traceability is required. No commit, push, branch change, PR, deployment, or production migration was performed.
