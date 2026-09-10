# Dashboard decision-surface audit — 2026-09-10

## Current authorized data contract

The dashboard currently receives four server-side, actor-scoped record counts, an actor-scoped attention queue, and actor-scoped recent audit activity. It does not receive a time series, due-date model, calibration-risk model, laboratory workload model, or blocked-reason taxonomy.

## KPI verification

| KPI | Purpose | Source / definition | Time / unit | Audience and action | Scope / drill-down | Empty / unavailable |
| --- | --- | --- | --- | --- | --- | --- |
| Pending review | Surface work awaiting review or approval | Inspection reports and assigned approval work items | Current snapshot / records | Authorized operators; open the review queue | Actor-authorized scope / /approvals | Zero is shown only after a successful read; provider failure withholds the KPI |
| HOLD items | Surface quality attention in receiving | Receiving items where inspection result is HOLD | Current snapshot / records | Operators responsible for follow-up; inspect the source records | Actor-authorized scope / filtered receiving register | Same fail-closed rule |
| Inspection PASS | Show completed scientific result without implying release | Inspection reports with final result PASS | Current snapshot / records | Operators needing inspection context; open inspection reports | Actor-authorized scope / /quarantine/inspections | Same fail-closed rule |
| Released items | Show release-system state separately from scientific result | Receiving items with release state true | Current snapshot / records | Operators checking released records; open filtered receiving register | Actor-authorized scope / released receiving records | Same fail-closed rule |

## Visualization decision

No chart is rendered today. A trend requires a server-defined series with a time range, unit, scope, and drill-down. The UI exposes the missing coverage instead of plotting placeholders or browser-derived values. Once that contract exists, the default visualization is a line chart with a visible data-table alternative.

## State and action rules

- Provider unavailable is not rendered as zero or “no items”. KPI, attention, and activity claims are withheld or explicitly marked unavailable.
- Empty attention means no current follow-up items in the authorized scope, not “no overdue” or “no risk” globally.
- Each available KPI and attention row links to an operational register or queue.
- The dashboard does not claim overdue, blocked, calibration risk, laboratory workload, or meaningful trend coverage until the backend supplies those definitions.
