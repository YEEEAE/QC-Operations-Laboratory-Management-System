# Reject Reports

## Access and routes

Reject Reports is a normal operational module. Every ACTIVE authenticated user can view the dashboard and create both report types. The canonical routes are:

- `/reject-reports` — dashboard, filters, analytics, and paginated registers.
- `/reject-reports/new?type=slip` — Rejected Material/Product Issue Slip.
- `/reject-reports/new?type=daily` — Daily Production & Rejection Record.
- `/reject-reports/issue-slips/[reportId]` — Issue Slip detail, print view, and approval tracker.
- `/reject-reports/daily/[reportId]` — Daily Reject detail, totals, rows, finalization, and print view.

## Data model and lifecycle

Migration `0026_reject_reports.sql` adds `qc.reject_reports`, `qc.reject_issue_slips`, `qc.issue_slip_approval_confirmations`, and `qc.daily_reject_entries`. Report numbers are generated server-side (`RIS-YYYYMMDD-####` and `DRR-YYYYMMDD-####`) under an advisory transaction lock.

Issue Slips use `DRAFT → APPROVAL_TRACKING → COMPLETED` (with controlled `VOID`). The three relational checkpoints are `SUPERVISOR`, `QC_MANAGER`, and `FACTORY_DIRECTOR`. A confirmation means the creator recorded that the real-world approval was obtained; it is not an electronic signature by the named approver. Completion is atomic only after all three are confirmed. Reversal requires a reason and remains in the audit trail.

Daily Reject records use `DRAFT → FINALIZED` (with controlled `VOID`) and require no approval stage. Each record supports multiple production/rejection rows.

## Calculation and evidence

Reject percentage is computed server-side as `reject quantity / good production quantity * 100`, rounded to four decimal places. A zero good quantity produces `NULL`, not infinity. Attachments use the existing file/evidence linkage contract; no parallel file subsystem is introduced.

Audit actions include `REJECT_REPORT_CREATED`, `REJECT_REPORT_UPDATED`, `ISSUE_SLIP_ISSUED`, `ISSUE_SLIP_APPROVAL_CONFIRMED`, `ISSUE_SLIP_COMPLETED`, `DAILY_REJECT_FINALIZED`, `REJECT_REPORT_CORRECTED`, and `REJECT_REPORT_VOIDED`.

The application use cases enforce ACTIVE-account access, creator-owned draft mutation, optimistic version checks, non-destructive correction/void semantics, and PostgreSQL-backed dashboard/search data.