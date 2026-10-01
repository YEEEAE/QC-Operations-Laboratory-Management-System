# QC-ADP26-14 — `/search` read authorization and paging handoff

**State: PARTIAL.** At freeze, branch was `main`, HEAD was `6f12fecdd58acb89d6c0fceb5a8c20b33101b628`, and the working tree was clean. Source changes are implemented; PostgreSQL 18, authenticated browser, assistive technology, responsive zoom, and human UAT evidence remain NOT VERIFIED. The reference audit candidate `0b1bb21bb3b4eca77862dbba1da8623044e96355` differs from this checkout; no historical live observation is carried forward as current evidence. Toolchain at freeze was Node `22.22.3` / pnpm `11.25.0`; verification used the installed Node `24.20.0` runtime required by the project.

## Changed

- `/search` now checks `PERM-SRCH-USE` and search result SQL applies each entity's active read permission and supported `GLOBAL`, `OWN`, or `ASSIGNED` scope before rows or totals are returned. Task visibility follows the same owner/assignee/global scope semantics as the task register and its read use case. Named team/department/site/domain scopes are not inferred where this search projection has no corresponding source key; those rows fail closed.
- Task title is searched and shown as the task descriptor. Result types use the shared human vocabulary; IDs and query text are not added to telemetry.
- Search uses stable keyset cursors at 25 rows per page and an exact total over the authorized result set. Count and page reads share a read-only PostgreSQL `REPEATABLE READ` transaction. Cursor input is size/type/query-bound and malformed query/cursor input receives a field-associated 400 response.
- A source failure remains a provider-unavailable state without a result count. Successful and failed query latency is measured into low-cardinality duration buckets in the existing privacy-filtered search analytics outbox.
- No schema/migration change. Business tables are read only. Search analytics may enqueue `PRODUCT_ANALYTICS_EVENT` outbox rows outside the read transaction; the search operation does not write business rows or business audit records. No migration is needed.

## Evidence

| Item | State | Evidence / limitation |
|---|---|---|
| Candidate identity | PASS | HEAD is `6f12fecdd58acb89d6c0fceb5a8c20b33101b628` on `main`; exact final dirty fingerprint and build identity are recorded in `.ci-results/build.json` after the final build. Node `v24.20.0`, pnpm `11.25.0`. |
| Source schema | PASS | Latest source migration is `0042_immutable_lab_equipment_usage`; no migration was added. |
| Applied schema | NOT VERIFIED | No production or remote database was queried. Local PostgreSQL available here is 14.19, not the required PostgreSQL 18. |
| Focused search/analytics tests | PASS | `pnpm exec vitest run tests/integration/shared/search.test.ts tests/unit/shared/product-analytics.test.ts` — 6/6 PASS. Covers valid query normalization, invalid bounds/cursor, required search permission, source-error classification/timing telemetry without query text, human type labels, and duration-bucket privacy filtering. |
| PostgreSQL scope/title/paging test | BLOCKED | `pnpm exec vitest run tests/integration/shared/search.test.ts tests/integration/shared/search-scope.test.ts` — unit file PASS; PostgreSQL file setup failed before cases because Testcontainers could not find a container runtime (6 cases skipped). Thus readable-other-owner, denied-existing, >25 cursor pages, title SQL match, PostgreSQL timing, and DB before/after controls remain NOT VERIFIED. |
| Build | PASS / environment-qualified | `pnpm verification:begin` then `pnpm build`; exact run identity is in `.ci-results/run-context.json` and `.ci-results/build.json`. Node 24.20.0 meets the project contract. |
| Typecheck | FAIL / unrelated | `pnpm typecheck` reports 9 TS7016/TS7006 errors in `scripts/verification/build-route-acceptance.ts`, `tests/e2e/authenticated-closure.spec.ts`, `tests/unit/release/*`, and `tests/unit/verification/route-acceptance.test.ts`; none reference this change. The Astro check also retains the existing `Date.formatDate` error in `src/pages/quality/findings/index.astro`; no search-file diagnostic was reported. |
| Authenticated HTTP/browser and rendered UI | NOT VERIFIED | No authenticated search fixture/session was available. No credential or production DB was used. |
| 320/375/768/1440 CSS px, 200% zoom, keyboard and manual AT | NOT VERIFIED | Requires rendered authenticated route; no WCAG claim is made. |
| DB writes/audit/outbox denial diff | NOT VERIFIED | Source route contains no business mutation; PostgreSQL test could not reach fixtures. Analytics outbox behavior is present and privacy-bucketed, but its DB record/rollback behavior was not exercised. |
| Query latency value | NOT VERIFIED | Duration buckets are instrumented for successful and failed repository requests. A PostgreSQL measurement could not be collected without PG18/container runtime. |
| Production migration / deployment / UAT | N/A by task authority | No schema change is needed; production DB, deploy, publication, and human UAT were not authorized or performed. |

## Findings and decisions

- `QC-PAGE-F-014`: source implementation is updated; route acceptance remains OPEN pending candidate-bound PostgreSQL 18 and authenticated UI evidence. The audit source at `audit/2026-09-30/adaptive-page-audit/audit-data.json` is historical and was not rewritten because it is tied to the audit snapshot. The task prompt is retained at the same path.
- Owner decision: none needed for the implemented default `GLOBAL`/`OWN`/`ASSIGNED` rules. Any future search over a source whose read policy depends on team/department/site/domain fields requires that source domain to provide an explicit searchable authorization projection; search must remain fail-closed until then.
- Other changes under `audit/2026-09-30-*`, `audit/2026-09-30/adaptive-page-audit/`, and `audit/2026-10-01/env-parity/`, plus a separate QC-ENV26 entry in Mind, appeared during this task and were preserved without edits or attribution to QC-ADP26-14.
- No commit, push, merge, deploy, production read/write, or human acceptance signature was performed.
