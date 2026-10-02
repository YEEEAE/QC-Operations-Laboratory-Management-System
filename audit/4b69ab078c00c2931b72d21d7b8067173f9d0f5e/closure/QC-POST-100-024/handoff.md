# QC-POST-100-024 handoff

**State: PARTIAL / BLOCKED / NO-GO.** Source analysis and focused reporting units are recorded; closure is blocked by the missing signed owner decision and absent PG18, authenticated route, print and human evidence.

## Candidate

- SHA `4b69ab078c00c2931b72d21d7b8067173f9d0f5e`, branch `main`, clean at freeze; source fingerprint `undefined` (run `b6714d2e-8cff-45bf-98f9-5ef58116c49a`).
- Source migration head `0045_provider_attestation_nonce_replay_guard` (45 files); directory digest in `candidate.json`. Applied schema is NOT VERIFIED. Node 24.20.0 / pnpm 11.25.0. Build NOT RUN.

## Findings

- Current report source uses one canonical `qc.receiving_items` query, filters `created_by = actor.id`, validated server filters and stable receiving-date/id ordering. Report view/run permissions are `PERM-RPT-VIEW` and `PERM-RPT-RUN`; CSV/XLSX also require general and format-specific export permissions. Download re-runs query and compares a request-local SHA-256 digest, returning 409 if changed. This is not durable and does not survive restart.
- CSV formula-dangerous text is neutralized; XLSX writes strings as inline strings and booleans as boolean cells. A4 print CSS/watermark exists for report detail. No separate PDF export implementation was identified; PDF N/A remains unsigned. Actual page cuts are NOT VERIFIED.
- `report_runs` is logical in DATA-MODEL; `REQ-RPT-005` calls for stored metadata; `BR-RPT-005` says “where applicable”. `report_artifacts` is conditional and retention is UNCONFIRMED. No migration creates these objects. Reporting/QMS must sign a reconciliation before durable persistence or retention is implemented.
- The current screen/export path is read-only: no business transaction, audit/signature/outbox write set.

## Verification

- Focused reporting unit: 4 files / 20 tests PASS on Node 24.20.0.
- PostgreSQL 18 parity: BLOCKED before suite setup; Testcontainers runtime unavailable; 10 skipped, zero assertions.
- Broad unit command mistakenly ran all unit suites: 20 FAIL / 1146 PASS over 160 files. Visible failures were unrelated UI, route acceptance and release-environment tests; reporting-only suite passed.
- Authenticated HTTP/browser, print rendering, AT, page owner/human UAT, applied schema and production runtime: NOT VERIFIED.

## Disposition and next evidence

All 39 linked ledger rows have individual NOT VERIFIED results in `criteria.json`; no prompt score/denominator calculated and no finding closed. QC-PAGE-F-030 remains PARTIAL.

Next: signed Reporting/QMS resolution for REQ-RPT-005/BR-RPT-005 and retention/applicability; disposable PG18 parity run; populated authenticated positive/negative route evidence; rendered print/PDF applicability and page cuts; accessibility/manual AT and page-owner/UAT; independent final review.

No migration, production write, provider change, commit, push, merge or deploy was performed.
