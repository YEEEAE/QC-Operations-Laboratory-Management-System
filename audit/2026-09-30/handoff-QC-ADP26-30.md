# QC-ADP26-30 — Reporting dataset snapshot, print, and export

Date: 2026-10-02  
State: **PARTIAL** — source contract changes and focused regression evidence are present; PostgreSQL 18 integration, authenticated browser, print rendering, AT, and human UAT remain blocked or not verified.

## Changed

- The registered report remains an **UNAPPROVED INFORMATIONAL COPY**, not a controlled record. Screen provenance, CSV, and XLSX carry the same informational status.
- Added request-local SHA-256 dataset binding over report code, actor identity, normalized filters, columns, internal source row IDs, and exact returned row values. Row IDs are used only in the server-side digest and are not rendered or exported.
- Screen download links carry the digest. The download endpoint re-runs the canonical registered query under the current actor's permissions and server filters; if the digest changed after screen rendering, it returns `409 REPORT_DATASET_CHANGED` without a file. The digest is also in CSV/XLSX provenance.
- Screen, CSV, and XLSX continue to use the one `PostgresReportQuery`, including `created_by = actor.id`, inclusive date filters, literal LIKE filters, and stable `receiving_date DESC, id DESC` ordering. Provenance now identifies the exact rendered dataset digest.
- XLSX preserves decimal/date values as exact strings (avoids spreadsheet floating-point rounding); booleans use native boolean cells. CSV/XLSX text cells remain formula-neutralized and XML-escaped.
- `/reports/[reportCode]` print CSS now targets A4 portrait, repeats table headers, avoids row splits where possible, and prints a clear unapproved-copy banner. Reject Issue Slip and Daily Reject `?print=1` views omit mutation controls from server-rendered markup and display the same informational-copy watermark. `/laboratory/report-templates` already has a separate transcription-only print view with no editable form in the print branch; it remains explicitly not an approved laboratory result.
- No migration or data write was added. No durable report snapshot/artifact or retention period was introduced.

## Contract and data path

- **Approved copy:** approved source contract says the report is informational and not a controlled record. Printing/exporting does not approve, sign, release, or change QC state.
- **Snapshot:** request-local content digest pins a later download to the dataset shown. A changed row, row membership/order, actor, filter, or column set blocks that download; refresh the report to get a current link. This is not durable history or a retrievable snapshot.
- **Open owner decision:** `REQ-RPT-005` says generation metadata is stored in `report_runs`, while `BR-RPT-005` requires generation context “where applicable”; current data dictionary marks `report_artifacts` retention UNCONFIRMED and the data model calls `report_runs` logical. Reporting/QMS owner must reconcile whether/which run metadata is persisted and its retention before a durable run/artifact store is added. Runtime remains deny/no durable retention until then.
- **Reads:** registered report definition; one `SELECT` from `qc.receiving_items`, scoped to the authenticated actor and validated filters. Current source migration head is `0043_controlled_document_source_binding` (43 source migrations). Applied schema head was not verified.
- **Writes/transaction/audit/outbox:** none. Query, digest, and download generation are read-only; no business state changes, so there is no domain transaction, audit event, or outbox event. Rejected permission/stale requests likewise have no write path. No before/after database snapshot is available because isolated PG18 could not start.
- **Authorization:** page visibility follows existing `pageAccessDecision` middleware; report detail checks registered view/run permissions; each export checks overall and format-specific export permissions, then reruns view/run authorization and the actor-scope SQL predicate. This is read-only export, so SoD, reauthentication, e-signature, and record expected-version gates are N/A by contract. `yazeed` receives no bypass.

## Candidate and tools

| Item | State | Evidence |
|---|---|---|
| Initial candidate | VERIFIED | HEAD `3b7b1915ef7e53a4412e3387754ed97ab2da859e`, branch `main`, clean at freeze; requested audit HEAD `0b1bb21bb3b4eca77862dbba1da8623044e96355` did not match. |
| Build source fingerprint | VERIFIED | `.ci-results/build.json` candidate fingerprint `806fbf25199d4700f9a7e2fbab23aa9e7c8d897aef1c1326fb453286d17864fd`; captured after source/test changes and before handoff, Mind, and generated workspace-map documentation. No runtime/test source changed after that build. |
| Runtime / package manager | VERIFIED | Node `v24.20.0` (project contract); pnpm `11.25.0`. Corepack invocation was blocked writing its external cache, so exact Node CLI binaries ran checks; bundled pnpm reports `11.25.0` but itself used Node `v24.19.0` and emitted an unsupported-engine warning. |
| Source/applied schema | PARTIAL | Source head `0043_controlled_document_source_binding`; no migration added. Applied schema NOT VERIFIED. |
| Build identity | PASS | Astro build via Node 24.20.0; release `rel-7dfe8f2c501b2c78`, build `local-3b7b1915ef7e`, entry SHA-256 `addbdba94965b4d4a824106e740b20210825c325b62a2f4cf9317436b4ee0655`, migration head 0043; `release:verify` verified. `.ci-results/build.json`: 1/1 PASS. Existing dependency/chunk warnings remain. |

## Evidence

| Check | State | Evidence / limit |
|---|---|---|
| Snapshot determinism and actor/filter/row/source identity changes | PASS | `tests/unit/reporting/report-snapshot.test.ts` (1/1). |
| Export success, formula neutralization, permission denial, stale digest denial, exact decimal text and XLSX boolean typing | PASS | `tests/integration/reporting/export-report.test.ts` (4 cases) plus reporting unit suite; combined focused run: 5 files / 24 tests PASS. This file uses fake queries and is not PostgreSQL evidence. |
| Date/filter boundaries, scope, ordering, CSV/XLSX cell parity, and concurrent source-write freshness gate | BLOCKED | `tests/integration/reporting/report-export-parity.test.ts` requested disposable PostgreSQL 18; Testcontainers failed before tests because no working container runtime. 10 tests skipped. |
| Typecheck | PARTIAL | `astro-check`: 1 unrelated existing error at `src/pages/ai-advisory.astro:148` (`requestButton` may be null), 0 warnings, 113 hints. No diagnostic in the changed reporting/reject-report files. |
| Lint | PARTIAL/PASS for applicable TS | Focused ESLint exit 0, 0 errors; Astro files are ignored by configured ESLint parser. |
| Formatting | PASS / Astro parser N/A | Prettier passed changed TS/JS tests; installed formatter reports no parser for `.astro`, so those files were validated by successful Astro build instead. |
| Build and release identity | PASS | See candidate table. |
| Database rollback/concurrency/replay and redacted before/after | BLOCKED | No isolated PG18 runtime. Feature paths are read-only, so rollback/audit/outbox mutation checks are contractually N/A; DB fixture concurrency and applied schema proof remain unverified. |
| Browser, direct HTTP, A4 page-cut rendering | NOT VERIFIED | Local preview server could not bind `127.0.0.1:4321` (`listen EPERM`); authenticated fixture/credentials were not supplied. A4 page rules and print branch are source/build verified only. |
| Responsive 320/375/768/1440px, 200%, keyboard/manual AT | NOT VERIFIED | No rendered authenticated browser available. Source includes table captions/column and row headers, but no AT or rendered reflow claim is made. |
| Human UAT | NOT VERIFIED | No human acceptance performed or signed. |

## Pages and finding

- `/reports`: registry page has no result dataset, print action, or download; source-level N/A for dataset-specific acceptance, live visibility remains NOT VERIFIED.
- `/reports/[reportCode]`: source finding addressed for request-bound identity, changed-dataset denial, provenance, formula safety, and A4 print styling. Live download and print acceptance remain NOT VERIFIED.
- `/reject-reports/issue-slips/[reportId]`, `/reject-reports/daily/[reportId]`: print branch now omits controls and marks the output informational. Authenticated rendering and A4 pagination remain NOT VERIFIED.
- `/reject-reports`, `/reject-reports/new`: no export/print surface is added; daily/issue-slip state remains governed by their existing application actions. Authenticated evidence remains dependent on PG18/browser fixtures.
- `/laboratory/report-templates`: existing `print=1` branch shows transcription-only report content and explicitly says it is not an approved result; saved-draft rendering and A4 cuts remain NOT VERIFIED.
- `QC-PAGE-F-030`: **PARTIAL**. Local source gaps are addressed for report detail/export and reject print views. The finding remains open for PG18, authenticated download, rendered print, responsive/AT, and UAT proof. No percentage or 100% claim.

## Final state

Candidate SHA: `3b7b1915ef7e53a4412e3387754ed97ab2da859e`  
Dirty fingerprint: `806fbf25199d4700f9a7e2fbab23aa9e7c8d897aef1c1326fb453286d17864fd`  
No commit, push, merge, deployment, production database access, or migration was performed.

Mind status: the current state and ledger were updated in `01-mind-latest.md`. Archiving its older history in `02-mind-mid.md` was blocked by the filesystem read-only boundary on that archive; `01` remains 505 lines / 117,439 bytes (below the 120 KB hard limit, above the soft targets).
