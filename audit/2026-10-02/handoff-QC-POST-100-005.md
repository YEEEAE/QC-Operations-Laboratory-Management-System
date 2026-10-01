# QC-POST-100-005 — Candidate handoff

- **State:** PARTIAL; required CLOSED proof is incomplete.
- **Historical audit candidate:** `6059e177438d8ae110c99084d32758b048f22cd2` (not used for current evidence).
- **Final candidate binding:** `.ci-results/build.json` and `.ci-results/unit.json` record the same final verification run and worktree fingerprint after this handoff and Mind update.
- **Runtime:** Node `24.20.0`, pnpm `11.25.0`.
- **Migration source head:** `0043_controlled_document_source_binding`; applied PostgreSQL 18 state NOT VERIFIED.

## Changes

- `/tasks` filter-chip removal deletes the old `page` while preserving other filters. The GET form does not submit a page parameter, so changing filters starts from the first page too.
- `/audit` now joins actor IDs to `users.display_name`, humanizes known action codes and subject types, labels record/request references, and exposes an explicitly named search landmark. Missing actor rows display a safe fallback; internal actor UUIDs are not rendered.
- `/ai-advisory` shows `/system/health` only when `pageAccessDecision(actor, '/system/health')` is `ALLOWED`; other users see service-owner escalation text. The destination's server authorization remains unchanged.
- No policy, schema, scientific decision, signature rule, production setting, or external system was changed.

## Evidence on frozen candidate

- Focused candidate-bound UI, audit projection, and canonical page-access contracts: **13/13 PASS** (`.ci-results/unit.json`).
- `pnpm typecheck`: **PASS**, 0 errors, 0 warnings, 113 hints.
- `pnpm test:architecture`: **PASS**.
- `pnpm build`: **PASS**; release identity binds Git SHA and source fingerprint. Server entry digest: `ed8b8f2ef6174e65c7fa2f72572fcbf44d04dcfd80f5144971a16da84253c6bb`.
- `pnpm release:verify`: **PASS**, release ID `rel-7e3ac815cc4c3b54`.
- `git diff --check`: **PASS**.

## Acceptance boundary

- Filter removal/change reset is verified with a page-4 filter fixture at the pure contract level; populated multi-page PostgreSQL route behavior is NOT VERIFIED.
- The Audit display names actors and humanizes action/subject labels. Its polymorphic `subjectId` remains an explicitly labeled internal reference because no common, authorization-safe business-number resolver exists across the audited domains. Full human-reference resolution remains OPEN; no number is inferred from an ID.
- The private-link contract verifies canonical owner/non-owner visibility in source tests. Authenticated browser route behavior and screen-reader output were NOT RUN.
- PostgreSQL 18, live HTTP, responsive/browser, assistive technology, and human UAT evidence are NOT VERIFIED / NOT RUN. No production migration, deployment, commit, or push was performed.
