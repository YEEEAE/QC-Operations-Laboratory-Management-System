# QC-POST-100-005 — Candidate handoff

## Current-source recheck — 2026-10-02

- **Base HEAD:** `d3fb77dcd18dcc5505769cfd29827b16d9cf5acb`; final source fingerprint, Node, migration head, artifact digest, and focused unit report are recorded in `.ci-results/build.json` and `.ci-results/unit.json` for the same final candidate. The earlier candidate evidence below is HISTORICAL and not reused as current proof.
- **Source classification:** PARTIAL. Existing `/tasks` filter reset and owner-only link work were preserved. `/system/control-center` Accounts now reads a 10-row SQL page with exact matching total; query, state, and allowlisted sort are applied to the same SQL count/page predicates. `/quality/findings` now has actor-scoped SQL count/page queries and native GET state paging. Identity display-name lookups are actor-gated and limited to 100 requested IDs; `/audit` uses that typed identity port for actors, and subject UUID is no longer rendered without an authorized business-subject resolver.
- **Inventory:** The executable register inventory lists 18 routes; 7 have bounded source paging (tasks, audit, reject reports, findings, laboratory, admin users, backups), leaving 11 explicitly unbounded. Other affected register routes and selector sources remain to be reconciled. The admin scopes page is a static scope vocabulary/link surface, not a paged record register.
- **Migration:** none. Source migration head remains `0045_provider_attestation_nonce_replay_guard`.
- **Evidence:** focused unit/source contracts 40/40 PASS, 0 failed/0 skipped; typecheck 0 errors/0 warnings/114 hints; architecture and targeted lint PASS; TypeScript Prettier check PASS. Final build and release identity PASS; candidate-bound identity is in `.ci-results/build.json` (same run as `.ci-results/unit.json`).
- **BLOCKED / NOT VERIFIED:** PostgreSQL 18/Testcontainers could not start (`Could not find a working container runtime strategy`), so both new real-record paging tests are NOT RUN. Authenticated browser/HTTP traces, exact runtime/provider state, manual AT and human UAT are NOT VERIFIED. No production migration, deployment, commit, or push.
- **Residual acceptance:** all other unbounded registers and selectors; typed, per-domain authorized business-subject number resolution and deleted/denied/outage cases; final PG18 page/count/scope evidence; authenticated route and human acceptance. Completion remains PARTIAL, not CLOSED.

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
