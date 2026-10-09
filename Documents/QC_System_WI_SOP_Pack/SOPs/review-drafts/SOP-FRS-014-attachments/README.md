# SOP-FRS-014 attachments

Provenance for the evidence embedded in
`SOPs/review-drafts/SOP-FRS-014-D0.1-User-Experience-All-Pages.docx`.

## Status

- Document: REVIEW DRAFT — not approved, not effective, not registered in the application.
- Proposed improvements `UX-014-01..14`: **PROPOSED / NOT IMPLEMENTED**.
- No code, permission, migration, policy or controlled document was changed.

## live/

Authenticated live read of `https://qclevel.top` on **09 October 2026**, using the
existing `yazeed` session (Administrator, System owner, global scope), viewport
1440×1000. Thirty-two routes were captured; each has a viewport PNG and a
`*-full.png` full-page capture.

Captured routes: dashboard, tasks, work, quality/findings, quality/ncr,
quality/rca, quality/capa, reject-reports, quarantine, quarantine/receiving,
quarantine/inspections, quarantine/admin, laboratory/tests, assets/equipment,
assets/calibrations, assets/maintenance, approvals, change-requests, documents,
reports, ai-advisory, admin/users, admin/roles, admin/permissions,
system/health, system/control-center, system/backups, notifications, search,
account, help, audit.

Observed environment facts (honest states, not defects): all counts were zero
because the database holds no operational records yet; migration schema was
DEGRADED (0045 applied vs 0047 shipped, two pending); storage UNAVAILABLE
(not configured); outbox DEGRADED; AI provider POLICY_DISABLED.

## stitch/

Visual-direction proposals generated through the Stitch MCP server
(`https://stitch.googleapis.com/mcp`, `X-Goog-Api-Key`) in the private project
`2994222140523388486` ("SOP-FRS-014 UX Proposals").

- `01-register-page.{png,html,json}` — proposed register-page layout.
- `02-record-header.{png,html,json}` — proposed record-header layout.

**These are unimplemented, unreviewed proposals with synthetic content.** They
contain invented navigation, compliance labels, record numbers, site names and
narrative text (for example a fictional site name and a 21 CFR menu item). None
of that content is approved or may enter the product. Only the visual structure
is offered for review, and only after owner approval.
