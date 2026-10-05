# Evidence appendix — fresh audit restart, current execution

## Identity and scope

- Repository: `YEEEAE/QC-Operations-Laboratory-Management-System`
- Branch / source HEAD: `main` / `b3874da019300f6f81f75fe50904456bc251de2b`
- Commit time: `2026-10-05T03:30:43+03:00`
- Audit execution checkpoint: `2026-10-05T10:12:48Z`–`10:14:37Z`; timestamps per shell UTC; test-run printed local time `13:12:50` +03:00 = `10:12:50Z`.
- Local worktree: not clean due pre-existing user changes. Current relevant diff includes `package.json` and `pnpm-lock.yaml` dependency changes. These files were preserved and no config/env values were read. Scoped source diff for `src/`, `Documents/`, `db/`, `tests/`, `scripts/`, `.github/`, manifests and runtime configuration is non-empty only in package/lock changes. Source finding checks are against HEAD and documented; the worktree dependency changes are not claimed as part of the candidate.
- Toolchain: default `node v22.22.3` is below repository contract `>=24.20.0 <25`; explicit session PATH selected installed `node v24.20.0`, `pnpm 11.25.0` for local commands. App `0.1.0`.
- Migration source: 45 files; last `0045_provider_attestation_nonce_replay_guard.sql`. Applied head/database environment/runtime URL/build ID: `NOT VERIFIED`. No database connections, queries, migrations, seeds or writes in this audit.
- Historical/current-source descriptions in Mind were used as navigation only, not as runtime proof. Prior audit percentages and CI allegations were not reused; CI and two static probes were freshly checked.

## Fresh local verification (read-only to databases)

| Time | Command / observation | Result | Limit |
|---|---|---|---|
| `2026-10-05T10:12:50Z` | `pnpm requirements:check` | PASS; requirements=100, risks=34, gaps=20, decisions=33, assumptions=5, mappedDomains=7, domains=80 | This validates register structure, not application requirements or acceptance. |
| same run | `pnpm test:architecture` | PASS; no Delivery→DB/domain violations; canonical route-file coverage and registry integrity pass | Static guards only; no all-boundary/runtime claim. |
| start `10:12:50Z`, elapsed 376ms | `pnpm exec vitest run tests/unit/authorization/stage-one-signature.test.ts tests/unit/reporting/report-snapshot.test.ts tests/unit/reporting/report-filter-parser.test.ts tests/unit/reporting/report-provenance.test.ts` | 4 files / 13 tests PASS | Reviewed these tests/setup as in-memory/unit scoped; narrow subset only. Not the full unit suite, app E2E, integration, DB, UAT or current release envelope. |
| `2026-10-05T10:12:48.821Z` | In-memory `xlsxBytes([],[])` probe; parse ZIP central directory | EOCD declared 8 entries; actual directory 5; mismatch | Reproduces source structural defect; no consumer/Excel/runtime integration test. |
| `2026-10-05T10:12:48.837Z` | In-memory `withSpan` with tracer whose `setAttribute` throws | callback completed; returned promise rejected with `audit_attribute_failure` | Reproduces source instrumentation exception leakage; not an observed production incident. |
| query at `2026-10-05T10:14Z` | `gh run list --repo YEEEAE/QC-Operations-Laboratory-Management-System --commit b3874da019300f6f81f75fe50904456bc251de2b --limit 10 --json ...` | 37247809215 and 37247808674 completed/failure | Exact SHA association only; no application verification inference. |
| `2026-10-05T10:14Z` | `gh run view 37247809215 --log-failed` | log retrieval error `log not found: 111569082810` | Failure cause NOT VERIFIED. |
| `2026-10-05T10:14Z` | `gh run view 37247808674 --log-failed` | `actions/jekyll-build-pages@v1` failed parsing `.astro` as Jekyll/YAML front matter (`src/pages/admin/scopes/index.astro`) | This is Pages/Jekyll, not an Astro app build or verification-suite run. No app-source changes to cater to Jekyll. |

## Fresh source findings

| Audit IDs | Current observation | Evidence | Confidence / impact boundary |
|---|---|---|---|
| `AUD-P0-011` | Owner source says every in-system approval, including Supervisor stage 1, is a formal account signature from effective 2026-10-04. UAT plan and STATE-MACHINES still state that Supervisor stage 1 has no signature. | `Documents/QC-OWNER-DECISION-ALL-APPROVALS-SIGNATURE-2026-10-05.md:9-18`; `Documents/UAT-ACCEPTANCE-PLAN.md:1550-1556`; `Documents/STATE-MACHINES.md:1834-1838`. Source inspection only. | Confirmed controlled-document drift. Does not establish stage-one runtime failure; inspected lab/inspection source implements ceremony in those paths. No historic signature backfill or policy expansion implied. |
| `AUD-P1-002` | Lab and inspection approval audit append calls omit `signatureId`, although the shared audit adapter persists it when supplied. | `src/shared/audit/postgres-audit-repository.ts:25-27`; `src/modules/laboratory/infrastructure/postgres-repository.ts:632-642`; `src/modules/quarantine/inspection/infrastructure/postgres-repository.ts:791-805`. | Confirmed missing direct audit→signature reference in the identified call sites; signature and transition may have other indirect linkages. No DB rows inspected. |
| `AUD-P1-003` | Final laboratory approval passes a textual identity/version/action string as `snapshotHash`; signature-evidence domain validation only checks nonempty. | `src/modules/laboratory/application/final-approve-lab-test.ts:51-60`; `src/modules/e-signatures/domain/signature-evidence.ts:23-42`. | Source does not prove a content digest in that field. Not a claim that all signature paths share this behavior. |
| `AUD-P1-007` | ZIP EOCD hardcodes entry counts `8`; generated XLSX passes 5 files to `zip()`. Fresh in-memory probe confirms 8 vs 5. | `src/modules/reporting/infrastructure/xlsx-exporter.ts:19-60,109-135`; probe above. | Confirmed archive metadata/source mismatch. XLSX consumer compatibility and end-to-end export parity not measured. |
| `AUD-OBS-001` | `withSpan` protects `recordException` and `end`, but success/error `setAttribute` calls are unguarded. Fresh fake tracer proves telemetry exception escapes after callback success. | `src/shared/observability/telemetry.ts:179-223`; probe above. | Confirmed local exception-leak behavior; no deployed exporter or production incident claim. |
| `AUD-P0-004` | Default production evaluation source denies; positive scientific result still requires an approved, exact source/reference/hash and QC-owned criteria. | `src/modules/laboratory/infrastructure/postgres-controlled-sources.ts:125-134`; `Documents/DECISION-ASSUMPTION-REGISTER-026.md`. | Fail-closed policy/source blocker, not fabricated scientific FAIL or bad-result claim. |
| `AUD-P0-012` | Release-gate reconciliation returns false absent accepted mapping for the 19 gates. | `src/modules/release-governance/infrastructure/postgres-repository.ts:93-98`. | Implementation decision boundary source evidence only; no release approval executed. |
| `AUD-ENG-006` | Source/route static checkers passed on this run. | command evidence above; `scripts/architecture/check-boundaries.mjs`; `scripts/architecture/check-route-files.mjs`. | PARTIAL credit only for the explicitly tested static subset. |

## Score rules and machine coverage

- 88 audit IDs, fixed weights: P0 12×5, P1 64×3 (10 core P1 + 34 UX + 8 ENG + 2 OBS + 12 OPS), P2 10×1 = `268`.
- Statuses from the report ledger: FAIL 5, BLOCKED 41, NOT VERIFIED 41, PARTIAL 1, PASS 0, NOT APPLICABLE 0. Weighted partial credit is ENG006 `3×0.5=1.5`; overall `1.5/268=0.56%`. This number describes *accepted checklist evidence*, not estimated product maturity.
- All 12 P0 have credit 0; P0 closure `0/60=0.00%`. All P1 closure `1.5/192=0.78%`; P2 `0/10=0.00%`.
- 19 additional scorecard slices are defined in the report; each denominator is the sum of included fixed item weights and every numerator is recalculated from the same ID rows. Overlapping domain totals are intentionally not added together.
- Source/read evidence footprint 8 IDs with E2/E3 refs (not requirement implementation-coverage acceptance): P0-004, P0-011, P0-012, P1-002, P1-003, P1-007, OBS-001, ENG-006. The executable coverage table enumerates the exact IDs. Source presence is not a PASS.
- No Human UAT, accepted runtime row or complete E4/E5/E6 criterion is in the ledger. Percentages, where shown, are evidence completion for their stated audit-ID subset only.
- Routes: registry declares 86 browser routes; route declaration visibility is PUBLIC for `/` and `/login`, YAZEED_ONLY for two system routes, otherwise AUTHENTICATED. Error pages `/404` and `/500` are additional source pages, giving 88 pages in that UI inventory. Route visibility is not mutation authority and none of these route rows claims visual/task completion.
- Text sample counts are mechanical counts of seven exact source literals. Necessary copy, duplicate count, compression potential and percentage remain unmeasured; the controlled scientific-status phrase is marked DO NOT AUTO-REDUCE.

## Database and operational restrictions

- Database reads/writes both zero. The user explicitly prohibited writes to *all* databases; the environment update later permitted file changes, not DB mutation. No `.env` contents or Neon credentials were read. Prior Mind statement that a Neon DB has zero application tables is historical and was not re-queried because of this constraint.
- No product/source/test/migration edits, seed, app server, E2E, integration, backup/restore, load run, human UAT session, provider call or deploy. No commits or pushes.
- HTML renderer, scorecard and prompt integrity checks are described in the validation appendix; a browser view of the files is separate from application runtime and WCAG/Human acceptance.

## Standalone document verification

- Local HTTP only, no application runtime: `python3 -m http.server 8767 --bind 127.0.0.1 --directory audit/2026-10-05/evidence-based-readiness-restart-1014`.
- Playwright cache-busted navigation / viewport checks, latest files at `2026-10-05T10:42Z`:
  - Readiness report: 88 audit rows, 88 route/page inventory rows, 27 requested score cards, 22 named score/domain groups; 320px/768px/1280px document widths equal viewport widths; zero JS page errors. Percentage guard passed with 6 negative malformed-ledger probes rejected.
  - Execution prompts: 88 cards plus 12 batch rows and FINAL reconciliation; 320px/768px/1280px document widths equal viewport; zero JS page errors. Prompt guard passed with 5 negative malformed-ledger probes rejected.
- Scope is only the two static deliverable HTML documents. This does not test the product UI, WCAG 2.2 AA, screen readers, print layout, or Human UAT. Browser `file:` opening remains unavailable under tool policy; standalone/offline is implemented with inline CSS/JS and no CDN/network fetch, but local `file:` transport was not proven.

## Final candidate identity refresh (HEAD moved during audit)

- Final HEAD: `d4f8893018c74d69126f197671bc59f2341f94cc`, branch `main`, commit `2026-10-05T13:18:42+03:00`.
- This supersedes the `b3874da...` provisional identity captured at audit start. Diff between the two HEADs is `package.json` and `pnpm-lock.yaml` only (Neon dependencies/lock graph); no `src/`, `Documents/`, `db/`, `tests/`, `scripts/`, `.github/`, or runtime config changes. Worktree still contains user edits in `package.json`/`pnpm-lock.yaml` and Mind, not altered by this audit. Keep those changes intact.
- Fresh checks on final HEAD, Node `24.20.0`, pnpm `11.25.0`: `pnpm requirements:check` PASS; `pnpm test:architecture` PASS; the same four reviewed-safe unit files PASS 4 files / 13 tests (start 2026-10-05 14:09:29 +03 = 11:09:29Z). Repeated in-memory XLSX and telemetry probes at `2026-10-05T11:09:28Z`: declared8/actual5; callback completed and telemetry `setAttribute` threw.
- New exact-SHA CI reads: run `37295775503` is the Pages/Jekyll failure, same Astro-as-YAML front matter error; run `37295776394` failed, logs unavailable (`log not found: 111716515015`). Neither is a passing application verification run.
- Both HTMLs dynamically bind the displayed candidate SHA/commit/test checkpoint to this final identity. Product-source and route/migration inventories were rechecked on final HEAD. Weighted status/score unchanged because the committed diff is dependencies/lockfile, not product implementation or evidence; still 1.5/268 = 0.56%, NO-GO.
- Final exact-SHA browser recheck after rebinding: `2026-10-05T11:11Z`, candidate `d4f88930...`. Both report and playbook show the final SHA, pass their local percentage guards, render 88 audit rows/88 prompts/88 route inventory entries as applicable, and have no JS page errors. Both fit 320/768/1280 CSS px without document overflow. Pages/Jekyll results are the two new run IDs above.
