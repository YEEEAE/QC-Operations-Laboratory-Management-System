# Deliverable browser verification — not application acceptance

- Candidate source: `b3874da019300f6f81f75fe50904456bc251de2b`.
- Environment: local Chromium via Playwright; audit-only static HTTP server bound to `127.0.0.1:8766`. No application server or database connection.
- Initial browser check: 2026-10-05T07:39Z; both files rendered without JavaScript page errors, report had 88 item articles and 27 scorecards, playbook had 88 item articles plus the separately rendered final reconciliation. Desktop had no document overflow. Initial 320px layout failed.
- Audit-output-only CSS correction added wrapping, shrinkable containers and scrollable table wrappers. No product source changed.
- First retest at 2026-10-05T08:05:16Z reused cached HTML and still showed the old widths. This is not final-byte acceptance.
- Cache-busted navigation at approximately 2026-10-05T08:05:40Z loaded the corrected styles: both files had document width exactly 320px at viewport width 320px. Wide tables scroll inside their wrappers instead of expanding the document. Result: PASS for this limited document reflow probe.
- Tablet 768px and desktop 1280px probes returned matching document/viewport widths. This is not WCAG conformance, manual screen-reader acceptance, application route acceptance, or Human UAT.
- `file:` navigation was blocked by browser-tool policy. HTML has no external resources; file-open transport itself was not verified in this browser tool.
- No business operations, credentials, user records, database writes, migrations or production requests were involved.
