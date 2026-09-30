# QC-ADP26-08 — Provider read failures and partial sources

## Changed

- Added a shared, fail-closed read-failure classifier for missing records, authorization denials, and provider/unknown failures. Detail routes continue to return the same outward 404 for missing and denied records; provider failures return a sanitized, non-cacheable 503 with an internal retry path and no provider details.
- Task queue, task detail and My Work withhold counts or existence claims on denied or failed primary reads. Audit history no longer renders a false `0 events` count after an authorization denial.
- System health now renders an unavailable state with HTTP 503 when its read cannot be confirmed instead of redirecting to 404.
- Equipment detail keeps the primary record visible when one or more related reads fail and reports those relations as unconfirmed. Maintenance detail does the same for history. No failed related read becomes an empty-state claim.
- Applied the 503 primary-read handling to approvals, document/version detail and review routes, change-request detail/review, quarantine receiving and inspection detail/execute/review, lab test detail/execute/review, quarantine template detail, and backup detail/restore. Missing and denied reads retain the shared 404 behavior.
- Control center keeps the account register when role/scope relationship reads fail, explicitly withholds those relationship values, and reports audit-read failure as unavailable instead of an empty history.
- No domain writes, migration, policy or permission change. Refreshed `workspace-map/`.

## Evidence

- Requested audit SHA `0b1bb21bb3b4eca77862dbba1da8623044e96355` was not the current source. Worktree candidate HEAD: `829218e4204939b07fc91458b05765f6506d2f24`; source fingerprint: `ecf30cd7c723ccdf0241b8a910ec8a4907bd5716c608ab363938d7f2fc974b7e`. Branch `main`. Node `24.20.0`, pnpm `11.25.0`, source migration head `0042_immutable_lab_equipment_usage.sql`.
- PASS: new read-failure contract tests, 3/3. PASS: Astro server/client build and candidate-bound build evidence, 1/1; artifact digest `05ed1726ad9ec3dd2885c98aff8b922d0dd6cd8ac353200af8f1c4fe25e2ee0a`; entry artifact digest `ed8b8f2ef6174e65c7fa2f72572fcbf44d04dcfd80f5144971a16da84253c6bb`.
- FAIL: `pnpm typecheck` reports one existing `Date.formatDate` type error at `src/pages/quality/findings/index.astro:35`; the same expression is present at the starting HEAD. The changed files add no typecheck errors.
- NOT VERIFIED: PostgreSQL/database behavior, per-read provider fault injection on every route, direct HTTP/browser/accessibility/200%/assistive-technology, and human UAT. No database was used or changed. Build warnings include the existing large Three.js chunk and dependency annotation warnings.

## State

**PARTIAL.** The F-008 register contains 61 routes. The source fixes above cover the cited task, audit, health and equipment cases plus the listed primary detail reads. F-008 remains open for the remaining route cards, form-option/aggregate reads, route-by-route failure injection, and candidate-bound database/HTTP/browser evidence. No card is marked closed by source inspection or unit/build evidence alone.

## Routes and remaining coverage

- Source changes: `/tasks`, `/work`, `/audit`, `/system/health`, `/assets/equipment/[equipmentId]`, `/assets/maintenance/[maintenanceId]`, `/approvals/[approvalId]`, `/documents/[documentId]` and its version routes, `/change-requests/[changeRequestId]` and `/review`, `/quarantine/receiving/[receivingId]`, `/quarantine/inspections/[inspectionId]` and its execute/review routes, `/laboratory/tests/[labTestId]`, `/execute` and `/review`, `/system/backups/[backupId]` and `/restore`, `/quarantine/admin/[templateId]`, `/system/control-center` and `/tasks/[taskId]`.
- The other F-008 routes remain open, including domain registers and overview pages, creation-form option reads, laboratory/report-template pages, remaining equipment/calibration detail routes, backup catalog and task/audit secondary paths. Each must preserve the approved authorization decision and be tested with a populated positive read plus fault injection before closure.

## Data and authorization boundary

- Changed page reads only. Missing and denied records share an outward 404 for existence secrecy. Provider failures return no record identifiers, dependency details, counts or empty claims.
- Secondary history/provider failures withhold only the affected relationship and preserve a confirmed primary record. No audit/outbox or business row changes were expected because the work is read-only; database before/after evidence is therefore NOT RUN.
- No production database, credentials, deployment, commit, push or publication was used.
