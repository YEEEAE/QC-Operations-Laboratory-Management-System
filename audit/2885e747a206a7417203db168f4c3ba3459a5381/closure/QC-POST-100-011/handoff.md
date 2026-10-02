# QC-POST-100-011 — candidate-bound evidence handoff

State: **PARTIAL / BLOCKED**. Assigned rows remain open; no 100% or production readiness claim.

## Candidate

- HEAD `2885e747a206a7417203db168f4c3ba3459a5381` on `main`. Source fingerprint `c7561a3d8341330111d140a25e1dd6dcead397991f4fe5a208b2fe8ebc932069`, captured before this packet using `scripts/verification/evidence-identity.mjs`.
- Worktree was already dirty: user Mind edits and prior QC-POST-100-001 evidence were preserved; task source changes are included in the fingerprint.
- Source migration head/count: `0044_restore_request_idempotency.sql` / 44; digest `bccfd862f111ed3cd5e3c44f1680d3c115f48019c57f34f8aa378eeb1edfc417`. Applied schema/runtime identity NOT VERIFIED.
- Node v22.22.3 is outside `>=24.20.0 <25`.

## Source changes

Migration `0044_restore_request_idempotency.sql` adds the unique `(backup_run_id, request_id)` index required by PostgreSQL `ON CONFLICT`; it fails closed if duplicate pairs exist. Restore route now has a native POST handler calling the same server Action, redirecting after confirmed success and retaining values on failure. Backup list/detail labels are human-first, with UUID in technical metadata.

## Evidence and limits

- Focused unit: 18 PASS; 11 filtered/skipped across 6 passing files.
- Astro check: 1035 files; no changed-page errors after fixing confirmation typing; existing project warnings/hints remain.
- PostgreSQL18: BLOCKED before setup because Testcontainers found no container runtime; 7 cases skipped.
- Restore executor is not wired; R2 listing is unavailable; database dump excludes linked file bytes. Durable DB+file restore, provider round-trip, monitoring/retention/RPO/RTO, authenticated route, accessibility, AT and owner UAT are NOT VERIFIED.
- No production/provider writes, migration execution, commit, push, merge, or deploy.

All 65 assigned rows are independently listed in `criteria.json`; none is PASS.
