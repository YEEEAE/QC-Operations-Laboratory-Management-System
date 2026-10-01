# QC-ADP26-27 — Health, outbox and recovery handoff

Date: 2026-10-01  
State: **PARTIAL** — source implementation and local verification are complete; operational, database and human acceptance evidence remain open.

## Changed

- `/system/health` now distinguishes application/database connectivity, required-workflow readiness and QC release acceptance evidence. Source checks carry their check time; a connected database does not imply workflow readiness or QC acceptance.
- The permission-gated outbox diagnostics read pending, available-now and retrying counts, maximum attempts, oldest pending age from `created_at`, and last processed time. A heartbeat is explicitly `NOT RECORDED`; channel delivery is `NOT REPRESENTED`. An aged backlog is degraded even when the database connection is healthy.
- `/system/control-center` labels application/database connectivity separately from QC acceptance and timestamps the source checks.
- Backup catalog/detail/restore pages show when the catalog was checked. Restore detail calls out checksum, schema/migration, QC/audit/business-history, evidence-file and application/authorization checks as absent from that view. RPO/RTO remain `NOT APPROVED`; restore requests remain intent-only.
- No schema migration was needed. No receiver, numeric budget, alert threshold, escalation owner, sender, schedule or external delivery was invented or enabled.

## Candidate and source binding

- Historical reference SHA supplied with the task: `0b1bb21bb3b4eca77862dbba1da8623044e96355`; it is not this checkout and was not treated as current evidence.
- Checkout at task start: branch `main`, HEAD `7a9ce20b279eb4989639173ebe3b6921268c2b41` (unchanged). Existing user changes were present and preserved.
- Pre-task dirty source fingerprint: `c9635790d31ff7e8bdd562eadf59bd349b1290473894e320a1e1d5fe99d0b510`.
- Final candidate dirty fingerprint: recorded in `.ci-results/unit.json` and `.ci-results/build.json`; both must match the final source state. These generated records are excluded from the fingerprint input.
- Migration source head: `0043_controlled_document_source_binding.sql`. **Applied schema: NOT VERIFIED** (no PostgreSQL endpoint/container available).
- Runtime: Node `v24.20.0`; `rtk 0.49.0`. `pnpm@11.25.0` was identified, but Corepack could not run with Node 24.20 because it could not write its cache (`EPERM`); scripts were invoked with installed binaries directly.
- Build identity is in `dist/release-identity.json` and `.ci-results/build.json`; it is local and dirty and does not attest deployment or production.

## Data boundary and authorization

- Health/outbox: one aggregate `SELECT` over `outbox_events`; reads `created_at`, `available_at`, `processed_at`, `attempt_count` and pending status. No writes, row locks or audit/outbox events are introduced by diagnostics. Invalid/missing aggregate data maps to `UNKNOWN`; provider/query failure maps to sanitized `UNAVAILABLE`.
- Backup pages: catalog/detail reads only. Existing restore request action is unchanged: it rechecks and locks the backup candidate and, within its existing transaction, writes `restore_runs`, audit and outbox as an idempotent `PLANNED` intent. It has no restore executor and does not restore data. Production stays denied.
- No database, production or external-provider write was performed. PostgreSQL before/after row, audit and outbox evidence is **BLOCKED**, not claimed.
- Existing page/action permission and scope/state/version checks remain the authority. The outbox detail is only included for `PERM-HLTH-READINESS`. Open decisions remain deny-by-default; named `yazeed` identity does not override them.

## Evidence

| Item | Result | Evidence / limit |
|---|---|---|
| Candidate SHA and branch | PASS | HEAD `7a9ce20b279eb4989639173ebe3b6921268c2b41`, `main`; task-start status/diff were frozen before edits. |
| Source dirty fingerprint | PASS | Initial `c9635790…`; final fingerprint must match `.ci-results/run-context.json` and `.ci-results/build.json` created after docs/map updates. |
| Focused unit + health integration tests | PASS | Node `v24.20.0`; `vitest run tests/unit/system-health tests/integration/system/system-health.test.ts`; 6 files, 36/36 passed; final run and candidate binding are recorded in `.ci-results/unit.json`. |
| Astro production build | PASS | Node `v24.20.0`; `astro build`; one build artifact passed; final candidate binding is recorded in `.ci-results/build.json`. |
| Build identity | PASS (local artifact only) | Release `rel-bfe18124b9f68619`; build `local-7a9ce20b279e`; entry SHA-256 `ed8b8f2ef6174e65c7fa2f72572fcbf44d04dcfd80f5144971a16da84253c6bb`; bundle digest is recorded in `.ci-results/build.json`; migration source head `0043_controlled_document_source_binding`. |
| PostgreSQL 18 positive/denial/boundary/failure/concurrency/replay | BLOCKED | `tests/integration/system/control-center.test.ts` did not run: Testcontainers could not find a container runtime; Docker socket unavailable. The attempted integration run skipped 10 tests. No DB fixture binding or redacted before/after rows exist. |
| Applied schema identity | NOT VERIFIED | No isolated PostgreSQL 18 instance. No migration was created or applied. |
| Browser rendering and authenticated routes | BLOCKED | Local Astro server could not bind `127.0.0.1:4321` (`listen EPERM`); no authenticated browser evidence. |
| Responsive 320/375/768/1440 CSS px and 200% | NOT VERIFIED | Browser unavailable. |
| Keyboard, screen-reader/AT, UAT | NOT VERIFIED | No human AT/UAT session; no UAT signed on another person's behalf. |
| Approved alert receiver, budget, thresholds, response owner and delivery | BLOCKED by policy | `DO-OBS-007/008/010` unresolved; no receiver or sender configured and no message sent. Decision owner: observability/on-call policy owner, not identified in approved source. |
| Isolated restore drill, checksum/schema/business-history proof | BLOCKED | No isolated PostgreSQL/target and no bound recovery bundle. Recovery owner must approve the drill procedure/target. |
| RPO / RTO | NOT APPROVED | `PD-26/PD-27` remain open; no targets or measurements inferred. |
| Production write / migration / deploy / commit / push | N/A | Not authorized or performed; no production endpoint was used. |

## Findings

- **Closed in source:** ambiguous core `READY` wording; no source timestamp on health/control-center checks; lack of measurable outbox backlog age/count diagnostics; backup pages did not show the catalog check time or distinguish missing restore evidence.
- **Open:** actual worker heartbeat and channel delivery are not represented by the data model; no alert receiver/budget/alert policy; no PostgreSQL 18 fixture-bound behavior/denial/rollback/concurrency/replay proof; no authenticated browser/responsive/AT/UAT proof; no isolated restore drill; RPO/RTO and production restore authority are not approved.
- `QC-PAGE-F-027` and `LIVE-2026-09-30-health` are historical audit references. Their snapshot claims were not rebound as current live measurements.

## Pages

- `/system/health` — source changes implemented; local build and focused tests PASS; runtime/browser and DB acceptance NOT VERIFIED/BLOCKED.
- `/system/control-center` — connectivity vs QC acceptance wording and timestamps implemented; browser/AT NOT VERIFIED.
- `/system/backups`, `/system/backups/[backupId]`, `/system/backups/[backupId]/restore` — catalog timestamps and restore evidence boundaries implemented; actual isolated drill BLOCKED.

No UAT sign-off, production readiness, external alert delivery, or recovery approval is claimed.
