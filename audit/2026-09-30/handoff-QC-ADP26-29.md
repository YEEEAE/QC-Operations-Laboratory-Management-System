# QC-ADP26-29 — Reject analytics filter/unit/decimal parity

Date: 2026-10-02  
State: **PARTIAL** — local source changes and focused unit evidence are complete; the live PostgreSQL/browser/AT evidence is blocked or not verified.

## Changed

- Dashboard summary, analytics, recent records, and both paginated lists now accept the shared report filter: report type/status, inclusive date window, department, unit/missing unit, item code/name, lot, and search. Aggregate quantity joins use the matching detail-row filter so a unit/item drilldown does not count other entries from the same report. Quantities and percentages remain decimal strings; quantity values are grouped by report type and recorded unit, with no cross-unit conversion or total.
- Daily Reject totals are exact-string totals grouped by recorded raw-material unit. Zero good quantity remains `NULL` for percentage.
- Adding a daily row now sends one entry plus expected report version. The server checks existing record, DRAFT state, creator ownership, active account, permission/scope, and version before calling append. Repository append compare-and-sets the report version, allocates a position, inserts exactly one row, and writes audit and outbox events within one transaction. A stale/replayed version fails before any write. The old replace-all draft action/use case was removed.
- Field errors are mapped to Astro input errors, connected to the input with `aria-describedby`, and focused. Returned deny/conflict/missing/provider outcomes require refresh; an unconfirmed network result locks repeat submission until refresh. Numeric inputs remain text decimal strings, avoiding browser floating point.
- No database migration was added: source migration `0026_reject_reports.sql` already stores these values as PostgreSQL `NUMERIC`, and report version/entry position plus audit/outbox contracts support append.

## Evidence

| Check | State | Evidence / limit |
|---|---|---|
| Candidate identity | VERIFIED | Initial candidate was `50eb761d415010a9d88f0acae3a518e8a0b6466a`, branch `main`, initially clean. Requested audit SHA `0b1bb21bb3b4eca77862dbba1da8623044e96355` did not match; this implementation is bound to the actual candidate, not that requested SHA. Final dirty fingerprint is recorded below after final review. |
| Toolchain | VERIFIED | Node `v24.20.0` via installed version path; package contract is Node `>=24.20.0 <25`, pnpm `11.25.0`. Corepack/pnpm invocation was blocked by EPERM creating its cache directory, so local package binaries were used directly. |
| Focused regression | PASS | `node_modules/.bin/vitest run tests/unit/reject-reports` under Node 24.20.0 — 3 files, 26 tests passed. Includes >safe-integer exact decimal arithmetic, mixed-unit grouping, zero denominator, aggregate strings over the input length limit, positive owned-draft append call, missing permission, out-of-scope owner, stale version, and finalized-state denial. These are unit fakes, not PostgreSQL evidence. |
| Typecheck | PARTIAL | `node_modules/.bin/astro check` under Node 24.20.0 found no remaining diagnostics in changed Reject Reports files after fixes. Overall reports one existing error at `src/pages/ai-advisory.astro:148` (`requestButton` may be null), plus existing project hints. |
| Build identity | PASS | Astro build completed on the dirty candidate. `dist/release-identity.json`: release `rel-4d0dd72cf1cd2771`, build `local-50eb761d4150`, migration source head `0043_controlled_document_source_binding`, server artifact SHA-256 `ed8b8f2ef6174e65c7fa2f72572fcbf44d04dcfd80f5144971a16da84253c6bb`; `scripts/release/verify-release.mjs` verified the release. `.ci-results/build.json` binds this to source fingerprint `8cf763842203b17cc4c396aaf7be1972d20f63fea0eacad6a932d78bb3fc3266`; build evidence 1/1 PASS. |
| Source schema | VERIFIED | Read `db/migrations/0026_reject_reports.sql`: quantity/value columns use unconstrained `NUMERIC`; reject percent is server-computed and nullable at zero denominator. Source migration list and build identity confirm head `0043_controlled_document_source_binding.sql` (43 migrations); generated/applied database schema state is NOT VERIFIED. |
| Applied schema / isolated PostgreSQL 18 | BLOCKED | Source migration head is `0043_controlled_document_source_binding.sql` (43 migrations); local `psql` is PostgreSQL 14.19 with no server responding at `/tmp:5432`. Docker CLI exists but cannot reach a daemon (`~/.docker/run/docker.sock` absent). No PostgreSQL MCP/DB connector is available and no production database was used. The PostgreSQL integration command reached setup and failed with “Could not find a working container runtime strategy”; all 7 tests were skipped before execution. No migration, SQL integration, rollback, concurrency, replay, sanitized DB before/after, audit/outbox rollback evidence, or applied-schema head is claimed. |
| Browser | PARTIAL | Local Astro server ran at `127.0.0.1:4321`; browser navigation to `/reject-reports` redirected to `/login?returnTo=%2Freject-reports`. No credentials were supplied/used. Protected dashboard, create/issue-slip/daily detail rendering, responsive widths, and browser mutation behavior are NOT VERIFIED. |
| AT / responsive | NOT VERIFIED | Manual AT and actual 320/375/768/1440 CSS px plus 200% zoom were not performed. Source has labels, associated field errors, focus handling, table headers and status text, but source inspection is not AT evidence. |
| Role/state/fixture binding | PARTIAL | Source path verifies ACTIVE creator-owned DRAFT plus PERM-RREJ-EDIT and expected version before append. Positive/deny fake tests passed. No real role-bound database fixture or before/after row/audit/outbox evidence is available. |
| Architecture / route manifest | PARTIAL | Canonical route coverage/registry check PASS. Architecture boundary check still fails only on existing unrelated `src/actions/documents.ts:6`; newly introduced page-to-domain imports were moved behind the Reject Reports application view model. |
| UAT | NOT VERIFIED | No human UAT was performed or signed. |

## Remaining decisions and blockers

1. QC/QMS owner must approve the domain precision/scale for issue-slip quantities, costs/value, daily reject/good/pump-out quantities and reject limits. The existing migration uses unconstrained `NUMERIC`; the source contract defines four decimal places only for calculated reject percentage. The current app validates decimal-string syntax/length and preserves exact values without rounding, but must not claim an approved quantity scale until the owner decides it.
2. QC/QMS owner must confirm the semantic unit relationship used when presenting daily reject percentage by recorded `rm_unit`; source data does not prove that good production quantity shares that unit. Until confirmed, percentage remains keyed by date and recorded unit and is not converted across units.
3. Start PostgreSQL 18 in an isolated disposable environment, verify source and applied schema heads, then run append positive/denial, transaction failure injection, rollback, concurrent same-version submissions, and replay; capture sanitized before/after row/audit/outbox evidence.
4. Resolve the unrelated project typecheck error or obtain an accepted scoped typecheck/build command; then produce a build identity. No deployment is authorized or performed.
5. Supply a non-production authenticated browser fixture/persona and a human AT/UAT operator. Verify all four routes, filters/drilldowns, field failures, slip zero rejection, existing-entry retention, duplicate/replay behavior, keyboard/AT, required widths and zoom. No credentials belong in this handoff.
6. `.agents/mind/01-mind-latest.md` was updated with a concise ledger/current-state entry and compacted back to 500 lines. No archival mind files were edited.

## Pages and findings

- `/reject-reports` — **source finding closed locally** for consistent filters, exact per-type/unit aggregates, and filter-preserving date/unit drilldown. **Live behavior NOT VERIFIED** because the authenticated page redirects to login.
- `/reject-reports/new` — decimal text inputs and server decimal-string validation are in place. **Live positive/invalid submission NOT VERIFIED**.
- `/reject-reports/issue-slips/[reportId]` — stored decimal quantities remain string-rendered; server validation rejects zero issue-slip rejected quantity. **Live record/detail/zero rejection NOT VERIFIED**.
- `/reject-reports/daily/[reportId]` — exact totals by recorded unit and server append replace client replace-all. **PG append/replay and live page NOT VERIFIED**.
- `QC-PAGE-F-029` — source changes are implemented for independent verification; overall evidence remains **PARTIAL**, not 100%.

## Final candidate / dirty fingerprint

Candidate SHA: `50eb761d415010a9d88f0acae3a518e8a0b6466a`  
Branch: `main` (requested audit SHA did not match)  
Dirty source fingerprint: recorded in `.ci-results/build.json` as `candidate.sourceFingerprint`.  
Build evidence: `.ci-results/build.json` (run ID recorded in that file).
