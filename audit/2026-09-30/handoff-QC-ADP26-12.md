# QC-ADP26-12 — unbounded registers and UUID-first labels

## Changed

- `/admin/users` now uses a PostgreSQL-backed, deterministic 25-row page with `login_identity, id` ordering, optional name/login/email search and account-state filtering. The filtered count and page rows use the same predicates; the old 500-row source limit no longer controls this route. Existing role and scope summaries remain batch lookups for only the current page.
- `/system/backups` now uses a deterministic 25-row page ordered by `requested_at DESC, id DESC`, state filtering, a filtered total count, and previous/next navigation. The prior fixed 50-row view is removed from this route. The backup list use case rechecks `PERM-BKP-VIEW`; middleware continues to make route visibility decisions through `pageAccessDecision`.
- User detail and backup detail now lead with the human account name / request time and place record UUIDs in an expandable technical-details section. Tables keep row headers, explicit column headers, captions, and named pagination navigation.
- No domain writes, schema change, migration, policy change, audit event, or outbox event. All database work in the changed paths is read-only. No production database was used.

## Evidence

- Requested audit SHA `0b1bb21bb3b4eca77862dbba1da8623044e96355` did not match the checked-out candidate. Branch: `main`; candidate HEAD: `3b212bf93a7f5487fbe1a60fd3b68591999f08ab`; the starting worktree was clean. Runtime contract: Node `24.20.0`, pnpm `11.25.0`; the shell initially resolved Node `22.22.3`, so verification commands explicitly used Node `24.20.0`.
- **PASS — synthetic pagination contracts:** focused identity + backup suites, 18/18 tests. Fixtures model 501 users and 51 backups; the user-list actor is ACTIVE/ADMIN, and backup controls bind an ACTIVE operator with `PERM-BKP-VIEW` against a no-grant denial. Assertions cover first/last pages, filtered count parity, filter application, safe user projections, and denied backup-list access. These tests use in-memory repositories; they are not PostgreSQL query evidence.
- **PASS — Astro production build:** completed on the candidate after `verification:begin`; build artifact evidence was written for the run. Existing large Three.js chunk and dependency annotation warnings remain.
- **FAIL — typecheck:** one existing error remains at `src/pages/quality/findings/index.astro:35` (`Date.formatDate` is not a Date API). It is outside this change and was already recorded on the preceding candidate. Other diagnostics were warnings/hints.
- **NOT VERIFIED — PostgreSQL 18 query execution / count-before-limit plan / 501-user and 51-backup database fixtures.** No local server answered on the default port; the repo's disposable cluster path contains a stopped pre-existing data directory and was left untouched. Docker daemon is unavailable. Source migration head is `0042_immutable_lab_equipment_usage.sql`; applied schema identity was not read.
- **NOT VERIFIED — authenticated HTTP, live browser, 320/375/768/1440 CSS-pixel layouts, 200% zoom, keyboard and assistive technology, or human UAT.** No route acceptance card is closed by these source/unit/build results.
- Candidate/build run identity: `.ci-results/run-context.json` and the build evidence emitted by `scripts/verification/write-build-evidence.mjs`; these are generated local evidence, not provider deployment evidence.

## Authorization / data boundary

- Reads changed: users (count + filtered page), backup runs (count + filtered page), and the existing role/scope batch reads for displayed user IDs. Table reads have no row writes, audit inserts, or outbox inserts, so denial before data access leaves business rows and audit/outbox unchanged by construction. A populated PostgreSQL before/after denial snapshot was **NOT RUN**.
- `/admin/users` remains behind middleware `pageAccessDecision`; `ListUsersUseCase.executePage` also rejects inactive actors. The list path does not introduce new mutation authority. `/system/backups` retains its explicit `PERM-BKP-VIEW` use-case authorization. No new policy or owner exception was introduced.
- The page count and rows are separate SELECTs and are not currently enclosed in one repeatable-read transaction. Under concurrent inserts/deletes, total and current page may briefly reflect adjacent snapshots; this needs a PostgreSQL concurrency decision/test before claiming snapshot parity.

## Page / finding disposition

- **Source correction implemented:** the hard row caps on `/admin/users` and `/system/backups` are replaced by server-side filtered paging; human labels are primary on `/admin/users/[userId]` and `/system/backups/[backupId]`.
- **Page acceptance still OPEN:** `/admin/users`, `/system/backups`, `/admin/users/[userId]`, `/system/backups/[backupId]`. The 501/51 database acceptance, route role fixture, query-count/performance evidence, browser and accessibility checks remain outstanding.
- **QC-PAGE-F-012 remains OPEN / PARTIAL.** No full page-card finding is marked closed because the issue spans the routes below and lacks database/runtime/AT evidence. Remaining routes include:
  - Quality: `/quality/findings`, `/quality/findings/new`, `/quality/findings/[findingId]`.
  - Quarantine: `/quarantine`, `/quarantine/receiving`, `/quarantine/receiving/new`, `/quarantine/receiving/[receivingId]`, `/quarantine/inspections`, `/quarantine/inspections/[inspectionId]`, `/quarantine/inspections/[inspectionId]/execute`, `/quarantine/inspections/[inspectionId]/review`, `/quarantine/admin`, `/quarantine/admin/[templateId]`.
  - Assets: `/assets`, `/assets/equipment`, `/assets/equipment/new`, `/assets/equipment/[equipmentId]`, `/assets/calibrations`, `/assets/calibrations/new`, `/assets/calibrations/[calibrationId]`, `/assets/maintenance`, `/assets/maintenance/new`, `/assets/maintenance/[maintenanceId]`.
  - Documents: `/documents`, `/documents/new`, `/documents/[documentId]`, `/documents/[documentId]/versions/new`, `/documents/[documentId]/versions/[versionId]`, `/documents/[documentId]/versions/[versionId]/review`, `/documents/[documentId]/versions/[versionId]/edit`.
  - Change requests: `/change-requests`, `/change-requests/new`, `/change-requests/[changeRequestId]`, `/change-requests/[changeRequestId]/review`.
  - Administration: `/admin`, `/admin/roles`, `/admin/roles/[roleId]`, `/admin/permissions`, `/admin/scopes`, `/admin/users/new`.
  - System and operations: `/system/backups/[backupId]/restore`, `/tasks`, `/audit`.
- Finding implementation status: the explicit 500-user and 50-backup cutoffs are addressed at source on the two registers above. SQL scoping/paging, filters, UUID labels, disclosure and row identity remain **OPEN** for all other routes until individually inspected and evidenced. Owner-dependent policies remain deny; no unresolved policy was broadened.

## State

**PARTIAL.** Two register paths have source-level pagination/filtering and human-label corrections, with focused synthetic tests and a successful candidate build. The requested multi-domain implementation, PostgreSQL/browser/AT/UAT evidence, and route-card closures remain outstanding. No commit, push, merge, deployment, or production migration was performed.
