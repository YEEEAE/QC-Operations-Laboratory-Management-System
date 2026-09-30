# QC-ADP26-11 — POST baseline and unknown write outcomes

**State: PARTIAL / NO-GO for full route acceptance.** Source-level improvements are in place for task lifecycle POST and selected create forms plus shared unknown-outcome messaging. The requested route inventory is not fully implemented or verified; all acceptance cards linked to QC-ADP26-11 remain open pending route-by-route review and runtime evidence.

## Candidate and scope

- Candidate base: `b3d2d47684e74f76ef3da05435de1e5c47b05b4e` (`main`). The requested audit SHA `0b1bb21bb3b4eca77862dbba1da8623044e96355` does not match this checkout.
- Node `v24.20.0`; package contract pnpm `11.25.0`, Node `>=24.20.0 <25`.
- Source migration head: `0042_immutable_lab_equipment_usage.sql`. No migration was added and no database was accessed or changed.
- User-owned starting changes in `.agents/mind/01-mind-latest.md`, `workspace-map/VERIFICATION.md`, and `audit/2026-10-01/handoff-QC-ADP26-10.md` were present before this task and preserved.

## Implemented

- `/tasks/[taskId]` now has native POST lifecycle controls and strict positive expected-version parsing. Server Action / domain transition logic remains the authority for current permission, scope, state, and version; `CANCEL` remains denied. A redirect after success and a reconcile-history link after ambiguous failure support refresh-before-retry.
- Shared mutation copy and classified enhancement now treat transport loss or `SYSTEM_DATABASE_UNAVAILABLE` as an unknown commit outcome. Recovery directs users to inspect the record/history before retrying; it no longer claims that nothing was saved.
- The task creation, quality finding creation, and quarantine receiving creation forms use the shared classification enhancement and unsaved-navigation guard while retaining native POST behavior.
- Related manual mutation catch copy was corrected on the edited approvals, role, change request, document version, lab test, quarantine review/receiving, reject report, index, and 500 surfaces. This is not a claim that every listed route meets the complete native POST baseline.
- No data-model or policy change was made. The existing task transition use case and repository keep task update, audit append, and outbox append in one transaction; PostgreSQL runtime atomicity was not exercised for this candidate.

## Evidence

- Focused unit/contracts: **85/85 PASS** across 4 files, including task transition and unknown-write classification contracts.
- Astro build: **1/1 PASS** on Node 24.20.0. Build output includes non-blocking dependency/chunk warnings.
- Release identity and verification: **PASS**, release `rel-0a2c26c8e723ff04`; identity records a dirty working tree, so it is local candidate evidence only.
- Typecheck: **FAIL**, one existing error at `src/pages/quality/findings/index.astro:35` (`Date.formatDate` is not defined on `Date`). This file was not changed by this task.
- Local PostgreSQL readiness returned no response; Docker daemon socket was unavailable. PostgreSQL 18, database before/after, direct HTTP, authenticated role/scope, browser, assistive technology, and human UAT evidence are **BLOCKED / NOT VERIFIED**. No production access was attempted.
- Source evidence does not prove exactly-once browser behavior, commit outcome recovery, accessibility, or transaction rollback against a live database.

## Open acceptance

- Review every QC-ADP26-11 route/card in the supplied prompt and record a disposition. The edited pages are only a subset; the requested POST, validation recovery, duplicate-submit, unknown-write, idempotency, authorization and evidence expectations remain **NOT VERIFIED** route by route.
- Run PostgreSQL 18 fault/atomicity checks and candidate-bound direct HTTP plus authenticated role/scope tests when the local database/container environment is available.
- Verify browser interactions, responsive states, keyboard/screen-reader behavior and UAT against the final candidate.
- Reconcile exact requested SHA versus current `main` candidate before treating any evidence as audit evidence for that SHA.

## Final evidence identity

After updating this handoff, Mind, and workspace map, verification run `e1d9876a-6252-4c43-978e-ecddad2bd418` recorded source fingerprint `1170d4f14f7253b39059f228274ac9320039d5550015b2f5f22e20e64402f12e`; build was **1/1 PASS**. Release verification was **PASS** for `rel-0a2c26c8e723ff04`. The candidate fingerprint is sensitive to handoff edits; `.ci-results/run-context.json` is the source of truth for the final run identity.
