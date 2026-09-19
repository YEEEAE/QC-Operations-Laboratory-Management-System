# QC Operations & Laboratory Management System — Re-audit report

**Audit ID:** QC-MIDPOINT-REBASE-001

**Evidence date:** 2026-09-18

**Evidence revision:** `298e307721af97d9c1bd22279d0c784fbf5b62a8` on `main`

**Editorial revision:** `20e6ead8f397d02ac2de807a273795dfac47a703`

**Audit status:** PARTIAL — **Release decision:** NO-GO

> This rewrite clarifies the evidence, findings and remaining work. Application tests and production checks were not repeated during the editorial pass. All operational figures below belong to the evidence revision and date; they do not establish the state of the newer editorial revision. Percentages are disclosed evidence-maturity judgments, not statistically measured feature completion.

## 1. Executive Summary

**Release decision at the evidence freeze: NO-GO.** The system expanded to 18 modules, 85 routes and 29 migrations, and local PostgreSQL verification became executable. Those runs exposed real failures while production and human-acceptance evidence remained incomplete.

Local verification passed 564 unit tests, 29 migration tests and 52 security tests. Three integration cases and one concurrency case failed; authenticated six-persona E2E did not close. Formatting, lint, the Node runtime contract and CI remained open.

Owner login, the dashboard and both private owner pages worked; health and readiness returned HTTP 200. Reject Reports returned HTTP 500, and the owner console displayed migration head 0018 with 11 pending. Fully migrated local head 0029 independently exposed a Reject analytics SQL error, so applying migrations alone is not sufficient acceptance.

Evidence maturity is **46.7%**. Mandatory production-gate completion is **5.3%, or one of 19 gates**. Score changes include a stricter evidence-accounting method and do not alone prove functional regression. Open findings comprise **7 P0, 7 P1 and 2 P2**. The interactive plan now assigns these gaps to **18 tasks** with acceptance criteria, including three explicit product-experience tasks for live UX review, dashboard intelligence/visualization, and application-wide UX writing/content simplification.

Coverage consisted of mechanical content inspection of 1,048 first-party files, targeted semantic review and the recorded verification runs. Exhaustive line-by-line review, signed human UAT, populated controlled-record recovery and comprehensive provider/accessibility evidence were not completed. Audit status therefore remains PARTIAL.

## 2. Executive Scorecard

| Indicator | Current Result |
|---|---|
| Overall Product Maturity | 46.7% |
| Functional completeness | 45.1% |
| QC/QMS completeness | 55.1% |
| Laboratory | 49.7% |
| Database & Data Integrity | 58.5% |
| Security | 50.7% |
| Authentication / Authorization | 61.0% |
| UI/UX | 41.6% |
| Accessibility | 32.0% |
| Testing maturity | 27.0% |
| Architecture & Maintainability | 30.0% |
| Extensibility | 41.2% |
| Operations & Reliability | 46.7% |
| Production readiness — gate completion | 5.3% |
| Verdict | NO-GO |

### Supplementary Product-Experience Indicators

These are **planning/closure indicators derived from the existing 80-domain scores**. They are not additional scoring domains, do not double-count the 80-domain model, and do **not** change Overall Product Maturity or Production Readiness without new evidence. Their purpose is to make the newly added UX/product work measurable.

| Supplementary Indicator | Current | Target | Gap to 100 | Derivation |
|---|---:|---:|---:|---|
| Live Product UX & Human-Centered Review | 29.0% | 100.0% | 71.0 pp | Mean of domains 4 User Experience/Usability (28), 5 UI/Visual Design (29), 20 Error Handling & Recovery UX (55), and 47 Usability Testing (4) |
| Dashboard Intelligence & Data Visualization | 43.3% | 100.0% | 56.7 pp | Mean of domains 8 Performance (37), 39 Reports (49), 41 Dashboard (38), and 64 Data Consistency Across Modules (49) |
| UX Writing & Content Simplification | 43.7% | 100.0% | 56.3 pp | Mean of domains 4 UX (28), 65 Navigation & IA (40), 66 Forms (51), 67 Tables (47), 68 Dialogs (49), and 69 Empty/Loading/Error States (47) |

Task mapping: **016 → Live Product UX**, **017 → Dashboard Intelligence**, **018 → UX Writing**. Task 004 remains mandatory for real human usability/UAT evidence; task 006 remains mandatory for accessibility.

## 3. Previous vs Current Score Comparison

| Indicator | Previous | Current | Delta (percentage points) |
|---|---|---|---|
| Overall Product Maturity | 52.6% | 46.7% | -5.9 |
| Functional completeness | 55.3% | 45.1% | -10.2 |
| QC/QMS completeness | 58.6% | 55.1% | -3.5 |
| Laboratory | 53.3% | 49.7% | -3.6 |
| Database & Data Integrity | 58.6% | 58.5% | -0.1 |
| Security | 63.3% | 50.7% | -12.6 |
| Authentication / Authorization | 71.6% | 61.0% | -10.6 |
| UI/UX | 52.8% | 41.6% | -11.2 |
| Accessibility | 50.0% | 32.0% | -18.0 |
| Testing maturity | 27.0% | 27.0% | 0.0 |
| Architecture & Maintainability | 60.0% | 30.0% | -30.0 |
| Extensibility | 52.0% | 41.2% | -10.8 |
| Operations & Reliability | 41.4% | 46.7% | +5.3 |
| Production Readiness | 30.0% | 5.3% | -24.7 |
| Verdict | NO-GO | NO-GO | Unchanged |

The comparison preserves the previous report’s displayed values. The current layer model is more explicit and stricter; deltas describe changes in assessment and must not be used alone as measures of product improvement or regression.

The three supplementary product-experience indicators are **new in this revision**, so they have no historical previous-report baseline. Their current values are derived from the same existing domain evidence shown above; adding the indicators and prompts is planning work, not new implementation evidence.

| New Indicator | Previous | Current | Target | Remaining Gap |
|---|---:|---:|---:|---:|
| Live Product UX & Human-Centered Review | N/A | 29.0% | 100.0% | 71.0 pp |
| Dashboard Intelligence & Data Visualization | N/A | 43.3% | 100.0% | 56.7 pp |
| UX Writing & Content Simplification | N/A | 43.7% | 100.0% | 56.3 pp |

## 4. Audit Baseline

**Evidence source.** The audit ran against `298e307721af97d9c1bd22279d0c784fbf5b62a8` on `main` with existing working-tree changes. Those included the Markdown prompt-pack relocation, Render documentation changes and a production-parity record. Existing work was preserved and kept distinct from this audit’s evidence.

**Comparison baseline.** The previous report used `0128e1e53f493b37e7b39c61cad060d76b63cff3` and source head `0023_uat_evidence`. It displayed 52.6% overall maturity, 30.0% production readiness and NO-GO. Its domain sum was 4212 ÷ 80 = 52.65%; the historically displayed 52.6% is retained.

**Verification environment.** macOS/aarch64; Node `v22.22.3` against the declared `>=24.20.0 <25`; pnpm `11.25.0`. Tests used isolated local PostgreSQL 18.6 with TLS and a built server on `127.0.0.1:4321`. This approved equivalent database path does not establish execution of the CI Testcontainers path. Production browser observations were recorded at 10:10–10:13 UTC.

**Editorial scope.** HEAD during this rewrite is `20e6ead8f397d02ac2de807a273795dfac47a703`. Operational checks were not repeated against it; only the reports and plan were rewritten. Deliverables contain no passwords or session secrets. No commit, push, deployment or production migration was performed by this rewrite.

## 5. Changes Since Previous Audit

Modules 17→18; physical pages 78→83; registered routes: previous access-distribution rows total 76, now 85; migrations 23→29; unit files 75→83; integration files 79→87; E2E specs 28→29. Reject Reports and owner control center are present. Source head advanced from 0023 to 0029. Explicit visibility and architecture drift guards close the prior missing-type source gap. Tracked .DS_Store count fell 4→0. The final Issue Slip icon/copy unit regression passes in the full suite.

New local runtime evidence includes full integration/migration/concurrency/security runs and schema 77 tables/0 orphans. New failures exposed: Reject analytics ambiguous status, stale owner test-head assertion, synchronous rejection assertion, losing inspection concurrency error mismatch. New authenticated production evidence includes owner pages 200, Reject 500, migration drift and explicit axe label-in-name failure. No mandatory gate other than health/readiness is fully closed for production. Historical empty-record restore and provider deployment SHA observations are not newly executed provider/recovery evidence.

## 6. Current Repository Shape

| Measure | Truth and scope |
|---|---|
| Repository tracked files | 5329 |
| Non-ignored file inventory at freeze | 5329 |
| First-party mechanical content review | 1048 files; third-party skills/plugin cache excluded |
| Source / DB / scripts / tests / GitHub files | 568 / 34 / 30 / 208 / 1 |
| docs / Documents / audit / .agents / public files | 29 / 26 / 92 / 4108 / 4 |
| Application module directories | 18 (19 entries includes README.md) |
| Routes PUBLIC / AUTHENTICATED / YAZEED_ONLY | 85 = 2 / 81 / 2 |
| Astro pages / required / conditional / deferred routes | 83 / 77 / 6 / 2 |
| Navigation destinations | 32 (imported navigationRouteIds; 32 unique) |
| SQL migrations / source head | 29 / 0029_performance_query_indexes |
| Local qc base tables / orphans | 77 / 0 |
| Production qc base tables / orphans | NOT VERIFIED / NOT VERIFIED |
| Unit / integration files / E2E specs | 83 / 87 / 29 |
| Documentation Markdown files (docs + Documents) | 55 |
| Tracked .DS_Store | 0 |

Non-ignored inventory includes available local tooling evidence and may grow with browser outputs; it excludes dependencies/generated/ignored files.

## 7. Verification Reality

These results belong to the evidence revision in section 4. Durations are recorded command wall times and may differ from internal test timers. Migration, concurrency and security selections overlap integration suites; do not add their counts as unique tests.

| Command or scope | State | Result and scope | Duration |
|---|---|---|---|
| pnpm install --frozen-lockfile | PASS | Up to date; Node engine warning | 0.24 s |
| pnpm format:check | FAIL | 4 files initially; 3 remained after formatting the pack | 3.46 s (initial) |
| pnpm lint | FAIL | 37 errors: 19 source/script + 18 existing operational-helper errors | 3.45 s |
| pnpm typecheck | PASS | 793 files; 0 errors; 68 hints | 21.36 s |
| pnpm test:architecture | PASS | Boundaries and route-file consistency | 0.66 s |
| pnpm test:unit | PASS | 83 files; 564 passed; 0 skipped | 9.53 s |
| pnpm test:integration | FAIL | 85 files passed / 2 failed; 350 tests passed / 3 failed | 49.67 s |
| pnpm test:migrations | PASS | 8 files; 29 tests passed | 99.87 s |
| pnpm test:concurrency | FAIL | 11 tests passed / 1 failed; 2 files | 20.49 s |
| pnpm test:security | PASS | 7 files; 52 tests passed | 3.50 s |
| pnpm build | PASS | Local build under Node 22 | 5.03 s |
| pnpm release:identity | PASS | Local identity artifact only | 0.40 s |
| pnpm release:verify | PASS | Local artifact verification only | 0.35 s |
| pnpm release:tech-debt:check | PASS | Configured technical-debt check | 0.29 s |
| pnpm test:e2e | FAIL | Built server: 48 passed / 19 failed / 107 skipped; supervisor timed out | 180.02 s supervisor; 4.5 min child |
| pnpm test:e2e:closure | FAIL | Built server: 11 passed / 7 failed / 18 skipped | 118.35 s |
| Local DB: preflight / status / checksum / schema | PASS | 29 migrations; 77 tables; 0 orphans | 3.32 / 11.28 / 12.13 / 1.67 s |
| system-owner:check | FAIL | Empty local fixture DB lacked the owner; no production conclusion | 1.43 s |
| Production canonical db:preflight | BLOCKED | Canonical DATABASE_URL absent; no direct connection made | — |
| Owner login / dashboard / private pages | PASS | Authorized read-only owner smoke | — |
| GET /reject-reports | FAIL | Authenticated live response: HTTP 500 | — |
| Explicit live axe scan | FAIL | 35 passing rules; 3 incomplete; 1 serious node | — |
| Verification CI 35325572254 | BLOCKED | Verify job 105537703598: 0 steps; billing lock | — |

Initial E2E attempts without a running server took 32.62 and 8.48 seconds and are invalid product-failure evidence. Subsequent built-server runs are shown above. A complete flaky classification was not established; eventual child output does not turn the supervisor timeout into PASS.

## 8. Architecture

Astro 4.16.19 SSR with @astrojs/node 8.3.4 standalone; TypeScript 6.0.3, Kysely 0.29.5 and pg 8.23.0. Modular monolith has domain/application/ports/infrastructure boundaries. Pages/Actions are delivery boundaries; transactions, authorization and SQL are owned by application/infrastructure. Current architecture boundary and route-file checks PASS. Mechanical SQL/authority/skip/TODO scanning covered first-party content across all requested trees; targeted review followed routing, owner console, Reject, dashboard, scientific-source and AI paths. This does not certify every endpoint against every attack or substitute for runtime cases.

## 9. Extensibility

docs/architecture/EXTENDING-THE-SYSTEM.md matches the current module shape, definePageRoute default AUTHENTICATED, explicit private set, forward-only head 0029 and use-case mutation boundary. New page/domain/permission/workflow/migration/report paths are documented. The architecture gate detects page/registry/navigation drift; metadata is centralized but navigation, permission registry, seeds, tests and documents still need controlled coordinated changes. No current developer extension exercise proves error-free additions. Do not reimplement this source contract in the final pack; task 002 validates guards, task 013 supplies policy, task 011 owns report/master/import extension, task 012 re-audits evidence.

## 10. Routes / Pages / Visibility

Imported current routes.ts: 85 declarations = PUBLIC 2 + AUTHENTICATED 81 + YAZEED_ONLY 2. Owner-only set exactly /system/health and /system/control-center. 83 physical .astro files reconcile with 77 required + 6 conditional files, 2 deferred auth declarations and 2 physical error pages. Current pageAccessDecision requires ACTIVE authenticated actors for ordinary pages and named SYSTEM_OWNER yazeed for private pages; middleware denies private non-owner URLs with 404. Navigation consumes canonical route visibility. Live owner open passed; anonymous dashboard redirected to login. All-six-persona direct URL and mutation-denial proof remains NOT VERIFIED. Visibility never grants create/approve/release authority.

## 11. Authentication / Authorization / yazeed

Source authorize() checks ACTIVE account, canonical explicit grant, registered action/entity/state, scope, expected version, business condition and SoD. isNamedSystemOwner requires server-resolved loginIdentity=yazeed and SYSTEM_OWNER; role/GLOBAL grants are protected in persistence. Administrative profile/activate/disable/reset/revoke/role/scope use cases exist. User-authorized live sign-in and owner read PASS; no production account/grant/password mutation was performed. system-owner:check on the fresh empty disposable application database FAILS because no yazeed account was seeded; this is fixture absence, not proof of production owner failure. The live console shows ACTIVE yazeed, ADMIN/SYSTEM_OWNER and GLOBAL, but exact complete permission grant reconciliation needs approved read-only database evidence.

## 12. Yazeed Control Center

The private page delegates overview/accounts/roles/scopes/audit to application dependencies; inspected frontmatter has no raw SQL. GetControlCenterOverviewUseCase independently checks canonical owner. Account creation uses audited atomic provisioning; security/role/scope operations reuse governed workspaces. Current local owner integration has 5 PASS / 1 FAIL, with failure a hardcoded 0027 assertion against actual 0029, not a database outage.

Live console 200: system/PG/audit HEALTHY, migrations DRIFT DETECTED, applied 0018, expected displayed 0018, pending 11, release/build/Git/environment UNVERIFIED; one ACTIVE protected owner account and sanitized activity. Expected-head display is misleading: source is 0029 while the application displays 0018 and correctly detects pending migrations. No raw URL/hash/password value was requested or exported. Live create/edit/disable/reset/revoke operations were not executed to avoid changing production during audit; their local suites/source are partial evidence, not live persistence claims.

## 13. PostgreSQL / Database

Fresh local canonical commands PASS: preflight, migration status, checksum integrity and schema integrity. PostgreSQL 18.6, qc_disposable, qc_owner, schema qc; 29 applied, 0 pending, 77 tables, 0 orphans. The separate qc_test database supports suites. TLS verify-full uses a disposable CA; source pool enforces qc,pg_catalog and UTC and rejects sslmode=disable. Local details must never be mislabeled as production.

Production application projection freshly displays head 0018 / pending 11. Production table count, wire server version/principal/database/TLS/schema/search_path, checksum state and orphan count are NOT VERIFIED by a direct DB connection. Local production preflight fails closed: canonical DATABASE_URL missing. Prior provider task reported qc_operations / qc_operations_user / PG major18 / Oregon / free plan expiring 2026-10-05T05:41:06Z and confirmed exposed-credential reuse; those remain explicitly recorded prior evidence, not fresh provider API inspection by this task. No compromised URL was reconstructed or used and no production migration was applied.

## 14. Reject Reports

Source implements Issue Slip, Daily Reject, navigation/search/audit, PostgreSQL repository, printable records and analytics. Operational creation uses authenticated ACTIVE permissions distinct from regulated approval powers. Issue Slip stages are SUPERVISOR/QC_MANAGER/FACTORY_DIRECTOR; recorded confirmations are creator attestations, not approver electronic signatures; completion waits for all required stages. Daily Reject supports multiple entries, reject/good quantities, server percentage (zero-good denominator gives null), draft/finalized lifecycle and no approval workflow.

Current PG integration 4 PASS / 2 FAIL: anonymous/inactive rejection occurs synchronously before a Promise reaches .rejects (harness issue; denial is present); analytics COUNT FILTER uses unqualified status joined between confirmations and report, causing real ambiguous-column product error at repository line 1050. This persists at full 0029. Live /reject-reports returns 500; missing migration parity is independently observed but this audit has not proven which server exception caused that response. Do not assert migration alone will fix it. Task 014 owns SQL/regression/lifecycle/access/aggregate proof, tasks 003/011/001/004 own browser/export/production/human layers. No production report was created.

## 15. QC/QMS

Receiving/inspection/release source includes assignment, supplier/evidence/history, server-counted submission evidence, independent rejection, SoD, versioning, transactional audit/outbox and replay. PASS remains distinct from RELEASED. QMS findings/NCR/RCA/CAPA exist; P-04 close retains Supervisor authority, effectiveness, reason, reauthentication/signature requirements. Open policy matrix decisions are not implemented facts merely because use cases exist. Local QC tests are substantial; inspection concurrency loser did not match expected CONFLICT_STALE_VERSION. Critical workflows, all relevant scientific policies, runtime authority ceremony and real UAT still require closure. Task 013 supplies approved remaining policy and implementation; task 003 proves journeys.

## 16. Laboratory

Create/save/submit/review/return/resume/approve/reject mechanics exist with immutable measurements/context, controlled template/source hashes and equipment eligibility. Default PostgresControlledLabSources.evaluate throws AUTHZ_DENIED: there is no approved default evaluator that may invent limits. Reject defaults to POLICY_SOURCE_REQUIRED until PD-38 authority source exists; VOID/TR-LAB-008 remains unimplemented/policy-denied. Retest and scientific limits require approved sources. Existing tests prove fail-closed mechanics, not operational completion without those sources. Task 013 must close source/policy/required behavior and hand populated cases to E2E/UAT; no invented unit/tolerance/method is acceptable.

## 17. Equipment / Calibration / Maintenance

Migration 0027 models calibration SCHEDULED/COMPLETED/FAILED/CURRENT, equipment status histories, certificate preservation, maintenance downtime/lock and append-only transitions. Submit eligibility rejects invalid/current-pointer/overdue/maintenance mismatches and freezes snapshots. Local asset PG tests pass within current integration run. Nullable source-requirement flags and approved interval/overdue-exception policy remain unresolved inputs. There is no six-persona current live calibration/maintenance acceptance or measured availability claim.

## 18. Documents / Approvals / E-Signatures

Migration 0028 guards approved content/templates and audit/signature/approval/change/snapshot append-only history. Revision content is version-local; change request target/version/current values are derived server-side and locked. Signature/reauthentication/SoD mechanics exist and current controlled-record integration cases pass. P-05/P-06/P-07 authority decisions remain implemented and must not be reopened by missing runtime evidence. Full action-signature scope, retention and approved QMS policy still require authority. Populated record lifecycle, tamper, export and recovery must be proven in browser/human/provider layers.

## 19. AI — Groq / Gemini

Groq/Gemini/Failover/Disabled adapters are IMPLEMENTED. Source defaults Groq→Gemini, 12-second AbortController HTTP timeout, sanitized status/error mapping, bounded output, advisory-only instructions and PII/secret/authority refusals. Deterministic unit/security cases passed in current suites. HTTP availability currently returns configured availability, not a live network probe. Failover's fallback exception propagates at adapter level but GetAdvisoryUseCase catches provider exceptions and returns UNAVAILABLE without changing core business state. Authentication/forbidden/invalid-response errors are not treated as retriable. No live call to either provider was executed; Render AI env presence and external processing approval are NOT VERIFIED in this audit. Source configuration is not LIVE VERIFIED. Task 009 is verification/safety closure rather than adapter reimplementation.

## 20. Dashboard / UI / UX

Fresh authenticated dashboard renders Times. Current global.css later body/control font:inherit overrides the earlier body font family. KPI links still use inspectionResult=HOLD and workflowState=RELEASED while receiving list only reads state; displayed scope says authorized while several counts use author/creator actor predicates. Pending-review count and HOLD attention list are different definitions. AppLayout sends actor.id as human userName. Owner navigation headings H2 precede Dashboard H1; 10px metadata and 40px controls remain in source. Bounding-box probe found 46 visible interactives with a dimension below project 44px; this is a triage count, not 46 confirmed WCAG failures. Error-classification and empty/unavailable trend layout require review; no fabricated chart is requested.

Live background shows 3 WASM/CSP console errors; first resource observation downloaded decoded 1,238,072-byte WASM twice (transfer 476,637 and 300 bytes), with JS decoded 170,075 bytes. Fallback keeps content usable. Shared UI defects are task 005; cross-application proof is 006/003/004.

**Product-experience closure expansion.** The current audit evidence also justifies three explicit closure tracks rather than treating all UI work as one generic task: `QC-100-FINAL-016` performs a live, read-only, page-family product/UX audit; `QC-100-FINAL-017` expands the dashboard using only traceable real read models and working drill-downs; `QC-100-FINAL-018` simplifies and humanizes application-wide user-facing copy without weakening controlled QC terminology. Their derived planning indicators are 29.0%, 43.3%, and 43.7% respectively. These are composite views of existing domain scores, not new evidence credits.


## 21. Accessibility

Current live dashboard axe explicitly enabled label-content-name-mismatch with WCAG2A/2AA/21A/21AA/22AA tags: 35 passing rules, 3 incomplete checks, one serious violation / one node. Earlier narrower scan had 23 passing rules/2 incomplete/zero violations; it omitted the needed tag/rule and is superseded, not a conflicting clean bill. Landmark/focus/dialog/reduced-motion/reflow source and local tests exist. Comprehensive authenticated keyboard, VoiceOver/NVDA, zoom/reflow/contrast and all-persona status/error announcements are NOT VERIFIED. No WCAG 2.2 AA conformity claim is made; H1/nav ordering and project 44px target are separate reviewed product requirements.

## 22. Security / Privacy

Current security command 7 files / 52 tests PASS on the local equivalent PG environment. Reviewed controls include default-deny authorization, Argon2/session security, origin/CSRF, CSP/hardening, safe errors, upload size/filename checks, SQL parameters, advisory privacy and immutable controlled histories. This is not a complete current production penetration test. Credential rotation is documented open; the earlier parity task confirmed exposed service credential reuse and public database access, not re-tested here. Retention/deletion/correction/data-processing policy, dependency/SBOM/secret scan completeness and runtime IDOR/XSS/privilege tests still require accepted current candidate evidence. Regulatory certification is not claimed.

## 23. Testing / CI / E2E

Current test inventory: 83 unit files, 87 integration files, 29 specs. Exact-HEAD Verification CI run 35325572254, Verify job 105537703598, completed/failure, 1 job/0 steps. Fresh annotation: account locked due to billing issue. This is CI DID NOT START / ACCOUNT BLOCKER, not CODE FAILURE, and is not PASS. The commit-workflow connector returned [] because its wrapper filters pull-request events; authenticated gh read found the push run. Pages run 35325571280 also failed; Pages is not the application deployment path.

Browser CLI initially had no server (67 failures/107 skips), invalid product evidence. After the built local server started, the full runner emitted 48 PASS / 19 FAIL / 107 SKIP (174), eventual child summary 4.5 minutes; parent supervising command timed out at 180 seconds, so process lifecycle was not clean. Closure completed 11 PASS / 7 FAIL / 18 SKIP (36) in 118.35 seconds. No fixture-backed authenticated six-persona run or FLAKY classification was produced; real owner live read is narrow production browser evidence, not six-persona E2E or human UAT. Task 003 must manage runner process groups, independent records and rate limits and bind final machine-readable evidence.

## 24. Performance / Observability

Two owner dashboard navigations observed TTFB 951.9ms then 1991.6ms, FCP 5644ms then 2740ms; buffered LCP on the latter 2740ms. Cached latter resource transfer sum 900 bytes excludes document/cached bodies and is not a cold-page payload. Earlier JS/WASM decoded/transfer observations are in section 20. INP and valid session-window CLS were NOT VERIFIED; no inferred zero CLS or capacity budget. No representative EXPLAIN ANALYZE/load/N+1 timing was executed by this audit. Source has migration0029 indexes, batched admin grant reads, request IDs, structured logs and sanitized dependency states. Exporter/alert delivery/production query telemetry are NOT VERIFIED. Local build logs prove server activity, not provider observability. Task 007 owns measured dataset/query/page/load/alert evidence.

## 25. Backup / Restore / DR

Prior QC-CLOSURE-015 records PG18.6 dump 282954 bytes with checksum, 77/77 table parity, 29/29 ledger parity and 0 unvalidated FKs. Controlled audit/signature/file/session/release tables had zero rows; this proves structural empty-table parity, not populated controlled-record recovery. Current tooling tests passed in unit/integration, but this audit did not create/restore a new populated backup artifact. Current-head populated backup/isolated restore, file checksums, recovery of sessions/scopes/Reject/signatures/audit/releases and measured RPO/RTO remain NOT VERIFIED. Provider managed backup/retention/PITR/WAL evidence is independently absent. Targets of 24h/4h in UI are not achieved measurements. Task 008 owns populated isolated recovery and provider evidence; no production restoration was performed.

## 26. Render / Production

render.yaml declares runtime node, Node24.20.0, frozen install/build, start node dist/server/entry.mjs, checksPass, enabled Render subdomain, qclevel.top and /api/health/ready. Prior same-day parity task records provider runtime rust, blank health path, commit deploy, disabled subdomain, startup access:grant-system-owner, external DATABASE_URL and missing RELEASE_*/AI/OTEL fields; provider deploy dep-damfhv8u01pc738s4430 bound 298e307721af97d9c1bd22279d0c784fbf5b62a8. This task preserved that record but did not freshly inspect Render provider API/env names, so provider config/exact deployed SHA are NOT VERIFIED NOW by this task; the record is a historical accepted observation, not silently discarded.

Fresh live application evidence proves qclevel.top health 200 and owner console release/build/Git/environment UNVERIFIED, migration0018/pending11 and Reject500. Release provider commit equality does not prove application internal identity or parity. Task 001 verifies provider/release/schema after approved 015 rotation and source closure; no provider, deployment, domain or production database was changed.

## 27. UAT / Human Validation

UAT records are templates with no accepted real participant result/signature. Required personas remain Employee, Inspector, Supervisor, Manager, Administrator and yazeed. No task success/time/confusion/sign-off was invented. The user's permission to use an account and agent browser interaction are not a human UAT session. Each approved candidate requires actual participants/scenarios/expected/actual/severity/evidence/sign-off tied to release identity. Automated owner read cannot close UAT. Task004 follows source/security/accessibility/recovery/production proof and may remain BLOCKED until actual humans are available.

## 28. 80-Domain Matrix

| # | Domain | Previous | Current | Delta | State | Interpretation | Current evidence | Remaining gap / tasks |
|---|---|---|---|---|---|---|---|---|
| 1 | Functional Correctness | 55.0% | 51.0% | -4.0 | PARTIAL | Partial | `src/modules/` + `tests/integration/`: Source + current local suites; partial requirement coverage | Approved requirements and full role/workflow evidence; 013,003,004,014 |
| 2 | End-to-End Workflows | 42.0% | 44.0% | +2.0 | PARTIAL | Partial | `src/modules/` + `tests/integration/`: Source + current local suites; partial requirement coverage | Approved requirements and full role/workflow evidence; 013,003,004 |
| 3 | System Integration | 45.0% | 49.0% | +4.0 | PARTIAL | Partial | `src/modules/` + `tests/integration/`: Source + current local suites; partial requirement coverage | Approved requirements and full role/workflow evidence; 013,003,004,014 |
| 4 | User Experience / Usability | 55.0% | 28.0% | -27.0 | PARTIAL | Weak | `src/ui/` + `tests/unit/ui/`: Source + current UI/static suite; observed owner UI defects | Live product review, UI fixes, copy simplification, authenticated responsive/AT and human validation; 016,005,018,006,003,004 |
| 5 | UI / Visual Design | 55.0% | 29.0% | -26.0 | PARTIAL | Weak | `src/ui/` + `tests/unit/ui/`: Source + current UI/static suite; observed owner UI defects | Live product review, UI fixes, copy simplification, authenticated responsive/AT and human validation; 016,005,018,006,003,004 |
| 6 | Responsive Design | 52.0% | 32.0% | -20.0 | PARTIAL | Weak | `src/ui/` + `tests/unit/ui/`: Source + current UI/static suite; observed owner UI defects | Live product review plus authenticated responsive/AT and human validation; 016,006,013,004 |
| 7 | Accessibility | 50.0% | 32.0% | -18.0 | FAIL / PARTIAL | Weak | `src/ui/` + `tests/unit/ui/`: Source + current UI/static suite; observed owner UI defects | Live product review plus authenticated responsive/AT and human validation; 016,006,013,004 |
| 8 | Performance | 35.0% | 37.0% | +2.0 | PARTIAL | Weak | `src/shared/health/` + `tests/integration/system/`: Current local health/observability tests + live health 200 | Provider configuration, alerts/exporter and runtime parity; 017,007 |
| 9 | Authentication & Identity | 68.0% | 63.0% | -5.0 | PARTIAL | Substantial but incomplete | `src/shared/authorization/` + `tests/integration/administration/`: Current local authorization/identity suites + live owner read | Six-persona deny/allow matrix, security and live grant evidence; 010,003,004 |
| 10 | Authorization / RBAC / Scopes / SoD | 72.0% | 60.0% | -12.0 | PARTIAL | Substantial but incomplete | `src/shared/authorization/` + `tests/integration/administration/`: Current local authorization/identity suites + live owner read | Six-persona deny/allow matrix, security and live grant evidence; 010,003,004 |
| 11 | SYSTEM_OWNER / yazeed Control | 78.0% | 65.0% | -13.0 | PARTIAL | Substantial but incomplete | `src/shared/authorization/` + `tests/integration/administration/`: Current local authorization/identity suites + live owner read | Six-persona deny/allow matrix, security and live grant evidence; 010,003,004 |
| 12 | User Administration | 70.0% | 60.0% | -10.0 | PARTIAL | Substantial but incomplete | `src/shared/authorization/` + `tests/integration/administration/`: Current local authorization/identity suites + live owner read | Six-persona deny/allow matrix, security and live grant evidence; 010,003,004 |
| 13 | Security | 60.0% | 60.0% | 0.0 | PARTIAL | Substantial but incomplete | `src/shared/authorization/` + `tests/integration/administration/`: Current local authorization/identity suites + live owner read | Six-persona deny/allow matrix, security and live grant evidence; 010,003,004 |
| 14 | Database Architecture | 58.0% | 65.0% | +7.0 | PARTIAL | Substantial but incomplete | `db/migrations/` + `tests/integration/database/`: PG 18.6 local head 0029; 77 tables; 0 orphans; migration 29/29 | Production parity and complete negative/concurrency evidence; 002,001,003 |
| 15 | Data Integrity | 60.0% | 59.0% | -1.0 | PARTIAL | Partial | `db/migrations/` + `tests/integration/database/`: PG 18.6 local head 0029; 77 tables; 0 orphans; migration 29/29 | Production parity and complete negative/concurrency evidence; 002,001,003 |
| 16 | Transactions & Atomicity | 62.0% | 59.0% | -3.0 | PARTIAL | Partial | `db/migrations/` + `tests/integration/database/`: PG 18.6 local head 0029; 77 tables; 0 orphans; migration 29/29 | Production parity and complete negative/concurrency evidence; 002,001,003 |
| 17 | Concurrency & Idempotency | 55.0% | 53.0% | -2.0 | FAIL / PARTIAL | Partial | `db/migrations/` + `tests/integration/database/`: PG 18.6 local head 0029; 77 tables; 0 orphans; migration 29/29 | Production parity and complete negative/concurrency evidence; 002,001,003 |
| 18 | Persistence | 55.0% | 57.0% | +2.0 | PARTIAL | Partial | `db/migrations/` + `tests/integration/database/`: PG 18.6 local head 0029; 77 tables; 0 orphans; migration 29/29 | Production parity and complete negative/concurrency evidence; 002,001,003,014 |
| 19 | Audit Trail & Traceability | 60.0% | 60.0% | 0.0 | PARTIAL | Substantial but incomplete | `db/migrations/` + `tests/integration/database/`: PG 18.6 local head 0029; 77 tables; 0 orphans; migration 29/29 | Production parity and complete negative/concurrency evidence; 002,001,003 |
| 20 | Error Handling & Recovery UX | 62.0% | 55.0% | -7.0 | PARTIAL | Partial | `src/ui/` + `tests/unit/ui/`: Source + current UI/static suite; observed owner UI defects | Live product review, UI fixes, copy simplification, authenticated responsive/AT and human validation; 016,005,018,006,003,004 |
| 21 | Quality Management | 58.0% | 49.0% | -9.0 | PARTIAL | Partial | `src/modules/quality/` + `tests/integration/quality/`: Current local QMS tests; P-04 retained; policy register OPEN | Unresolved QMS policies and end-to-end human/production proof; 013,010,003,004 |
| 22 | Receiving & Quarantine | 60.0% | 57.0% | -3.0 | PARTIAL | Partial | `src/modules/quarantine/` + `tests/integration/quarantine/`: Current unit + local PostgreSQL QC suite; PASS != RELEASED | Approved policy slices, critical E2E, UAT and production evidence; 013,003,004 |
| 23 | Inspection Management | 62.0% | 57.0% | -5.0 | PARTIAL | Partial | `src/modules/quarantine/` + `tests/integration/quarantine/`: Current unit + local PostgreSQL QC suite; PASS != RELEASED | Approved policy slices, critical E2E, UAT and production evidence; 013,003,004 |
| 24 | Release Control | 65.0% | 57.0% | -8.0 | PARTIAL | Partial | `src/modules/quarantine/` + `tests/integration/quarantine/`: Current unit + local PostgreSQL QC suite; PASS != RELEASED | Approved policy slices, critical E2E, UAT and production evidence; 013,003,004 |
| 25 | Laboratory Management | 60.0% | 55.0% | -5.0 | PARTIAL | Partial | `src/modules/laboratory/` + `tests/integration/laboratory/`: Local scientific/lab tests; default evaluation/reject fail closed | Approved evaluator/methods, PD-38, VOID decision, full workflow; 013,003,004 |
| 26 | Scientific Data Governance | 48.0% | 47.0% | -1.0 | PARTIAL | Partial | `src/modules/laboratory/` + `tests/integration/laboratory/`: Local scientific/lab tests; default evaluation/reject fail closed | Approved evaluator/methods, PD-38, VOID decision, full workflow; 013,003,004 |
| 27 | Retest Management | 50.0% | 47.0% | -3.0 | PARTIAL | Partial | `src/modules/laboratory/` + `tests/integration/laboratory/`: Local scientific/lab tests; default evaluation/reject fail closed | Approved evaluator/methods, PD-38, VOID decision, full workflow; 013,003,004 |
| 28 | Equipment Management | 55.0% | 59.0% | +4.0 | PARTIAL | Partial | `src/modules/assets/` + `tests/integration/assets/`: Current local asset/closure-008 PG tests and 0027 constraints | Approved calibration policy and live browser/UAT proof; 013,003,004 |
| 29 | Calibration | 55.0% | 57.0% | +2.0 | PARTIAL | Partial | `src/modules/assets/` + `tests/integration/assets/`: Current local asset/closure-008 PG tests and 0027 constraints | Approved calibration policy and live browser/UAT proof; 013,003,004 |
| 30 | Maintenance | 52.0% | 57.0% | +5.0 | PARTIAL | Partial | `src/modules/assets/` + `tests/integration/assets/`: Current local asset/closure-008 PG tests and 0027 constraints | Approved calibration policy and live browser/UAT proof; 013,003,004 |
| 31 | Controlled Documents | 60.0% | 59.0% | -1.0 | PARTIAL | Partial | `src/modules/documents/` + `tests/integration/database/controlled-record-integrity.test.ts`: Current controlled-record PG tests; 0028 append-only guards | Complete signature scope/policy and populated E2E/recovery proof; 013,008,003,004 |
| 32 | Templates | 62.0% | 59.0% | -3.0 | PARTIAL | Partial | `src/modules/quarantine/` + `tests/integration/quarantine/`: Current unit + local PostgreSQL QC suite; PASS != RELEASED | Approved policy slices, critical E2E, UAT and production evidence; 013,003,004 |
| 33 | Change Requests | 58.0% | 57.0% | -1.0 | PARTIAL | Partial | `src/modules/documents/` + `tests/integration/database/controlled-record-integrity.test.ts`: Current controlled-record PG tests; 0028 append-only guards | Complete signature scope/policy and populated E2E/recovery proof; 013,008,003,004 |
| 34 | Approvals | 62.0% | 57.0% | -5.0 | PARTIAL | Partial | `src/modules/documents/` + `tests/integration/database/controlled-record-integrity.test.ts`: Current controlled-record PG tests; 0028 append-only guards | Complete signature scope/policy and populated E2E/recovery proof; 013,008,003,004 |
| 35 | E-Signatures / Reauthentication | 58.0% | 57.0% | -1.0 | PARTIAL | Partial | `src/modules/documents/` + `tests/integration/database/controlled-record-integrity.test.ts`: Current controlled-record PG tests; 0028 append-only guards | Complete signature scope/policy and populated E2E/recovery proof; 013,008,003,004 |
| 36 | Files & Evidence | 58.0% | 57.0% | -1.0 | PARTIAL | Partial | `src/modules/documents/` + `tests/integration/database/controlled-record-integrity.test.ts`: Current controlled-record PG tests; 0028 append-only guards | Complete signature scope/policy and populated E2E/recovery proof; 013,008,003,004 |
| 37 | Notifications | 52.0% | 49.0% | -3.0 | PARTIAL | Partial | `src/shared/` + `tests/integration/`: Current search/report/outbox tests; limited browser coverage | Scoped cross-domain lineage/filter/export and live delivery; 011,003,004 |
| 38 | Search | 50.0% | 49.0% | -1.0 | PARTIAL | Partial | `src/shared/` + `tests/integration/`: Current search/report/outbox tests; limited browser coverage | Scoped cross-domain lineage/filter/export and live delivery; 011,003,004 |
| 39 | Reports | 50.0% | 49.0% | -1.0 | PARTIAL | Partial | `src/shared/` + `tests/integration/`: Current search/report/outbox tests; limited browser coverage | Scoped cross-domain lineage/filter/export, dashboard intelligence and live delivery; 011,017,003,004,014 |
| 40 | Export / Print | 40.0% | 42.0% | +2.0 | PARTIAL | Partial | `src/shared/` + `tests/integration/`: Current search/report/outbox tests; limited browser coverage | Scoped cross-domain lineage/filter/export and live delivery; 011,003,004 |
| 41 | Dashboard | 50.0% | 38.0% | -12.0 | FAIL / PARTIAL | Weak | `src/ui/` + `tests/unit/ui/`: Source + current UI/static suite; observed owner UI defects | Live product review, UI fixes, copy simplification, authenticated responsive/AT and human validation; 016,005,018,006,003,004,014 |
| 42 | Release Governance | 62.0% | 57.0% | -5.0 | PARTIAL | Partial | `src/modules/documents/` + `tests/integration/database/controlled-record-integrity.test.ts`: Current controlled-record PG tests; 0028 append-only guards | Complete signature scope/policy and populated E2E/recovery proof; 013,008,003,004 |
| 43 | CI/CD | 30.0% | 29.0% | -1.0 | FAIL / PARTIAL | Weak | `src/shared/routing/` + `scripts/architecture/`: Current architecture gate PASS and guide reviewed | Quality gates, extension exercise and production/toolchain proof; 002,003 |
| 44 | Automated Testing | 55.0% | 60.0% | +5.0 | PARTIAL | Substantial but incomplete | `src/shared/routing/` + `scripts/architecture/`: Current architecture gate PASS and guide reviewed | Quality gates, extension exercise and production/toolchain proof; 002,003,012 |
| 45 | Browser / Playwright E2E | 25.0% | 31.0% | +6.0 | FAIL / PARTIAL | Weak | `src/shared/routing/` + `scripts/architecture/`: Current architecture gate PASS and guide reviewed | Quality gates, extension exercise and production/toolchain proof; 003 |
| 46 | Real UAT | 10.0% | 11.0% | +1.0 | NOT VERIFIED | Critical | `audit/100-percent/uat/` + `Documents/UAT-ACCEPTANCE-PLAN.md`: Scaffolding only; no real signed participant session | Actual participants, actual results and authorized sign-off; 004 |
| 47 | Usability Testing | 15.0% | 4.0% | -11.0 | NOT VERIFIED | Critical | `audit/100-percent/uat/` + `Documents/UAT-ACCEPTANCE-PLAN.md`: Scaffolding only; no real signed participant session | Actual participants, actual results and authorized sign-off; 016,004 |
| 48 | Backup | 35.0% | 39.0% | +4.0 | PARTIAL | Weak | `src/modules/backup-recovery/` + `tests/unit/backup-recovery/`: Current tooling tests; older local restore is HISTORICAL | Fresh populated backup/isolated restore and provider DR evidence; 008,001 |
| 49 | Restore / Disaster Recovery | 25.0% | 39.0% | +14.0 | PARTIAL | Weak | `src/modules/backup-recovery/` + `tests/unit/backup-recovery/`: Current tooling tests; older local restore is HISTORICAL | Fresh populated backup/isolated restore and provider DR evidence; 008,001 |
| 50 | Health & Readiness | 60.0% | 69.0% | +9.0 | PARTIAL | Substantial but incomplete | `src/shared/health/` + `tests/integration/system/`: Current local health/observability tests + live health 200 | Provider configuration, alerts/exporter and runtime parity; 007,001 |
| 51 | Observability | 55.0% | 53.0% | -2.0 | PARTIAL | Partial | `src/shared/health/` + `tests/integration/system/`: Current local health/observability tests + live health 200 | Provider configuration, alerts/exporter and runtime parity; 007,001 |
| 52 | Operational Supportability | 45.0% | 47.0% | +2.0 | PARTIAL | Partial | `src/shared/health/` + `tests/integration/system/`: Current local health/observability tests + live health 200 | Provider configuration, alerts/exporter and runtime parity; 007,001 |
| 53 | Architecture | 62.0% | 35.0% | -27.0 | PARTIAL | Weak | `src/shared/routing/` + `scripts/architecture/`: Current architecture gate PASS and guide reviewed | Quality gates, extension exercise and production/toolchain proof; 002,003,012 |
| 54 | Maintainability | 60.0% | 31.0% | -29.0 | PARTIAL | Weak | `src/shared/routing/` + `scripts/architecture/`: Current architecture gate PASS and guide reviewed | Quality gates, extension exercise and production/toolchain proof; 002,003,012 |
| 55 | Code Quality | 58.0% | 24.0% | -34.0 | FAIL / PARTIAL | Weak | `src/shared/routing/` + `scripts/architecture/`: Current architecture gate PASS and guide reviewed | Quality gates, extension exercise and production/toolchain proof; 002,003,012 |
| 56 | Migration Management | 60.0% | 65.0% | +5.0 | PARTIAL | Substantial but incomplete | `db/migrations/` + `tests/integration/database/`: PG 18.6 local head 0029; 77 tables; 0 orphans; migration 29/29 | Production parity and complete negative/concurrency evidence; 002,001,003 |
| 57 | Configuration & Secrets | 55.0% | 38.0% | -17.0 | PARTIAL | Weak | `src/shared/health/` + `tests/integration/system/`: Current local health/observability tests + live health 200 | Provider configuration, alerts/exporter and runtime parity; 015,010,001 |
| 58 | Deployment / Runtime | 40.0% | 33.0% | -7.0 | FAIL / PARTIAL | Weak | `src/shared/health/` + `tests/integration/system/`: Current local health/observability tests + live health 200 | Provider configuration, alerts/exporter and runtime parity; 001,002 |
| 59 | Data Privacy | 50.0% | 43.0% | -7.0 | PARTIAL | Partial | `src/shared/authorization/` + `tests/integration/administration/`: Current local authorization/identity suites + live owner read | Six-persona deny/allow matrix, security and live grant evidence; 010,003,004 |
| 60 | Compliance / QMS Governance | 45.0% | 40.0% | -5.0 | PARTIAL | Partial | `src/modules/quality/` + `tests/integration/quality/`: Current local QMS tests; P-04 retained; policy register OPEN | Unresolved QMS policies and end-to-end human/production proof; 013,010,003,004 |
| 61 | Business Rules Consistency | 60.0% | 51.0% | -9.0 | PARTIAL | Partial | `src/modules/` + `tests/integration/`: Source + current local suites; partial requirement coverage | Approved requirements and full role/workflow evidence; 013,003,004 |
| 62 | State Machines | 65.0% | 57.0% | -8.0 | PARTIAL | Partial | `src/modules/` + `tests/integration/`: Source + current local suites; partial requirement coverage | Approved requirements and full role/workflow evidence; 013,003,004 |
| 63 | Deletion / Correction Semantics | 58.0% | 47.0% | -11.0 | PARTIAL | Partial | `src/modules/` + `tests/integration/`: Source + current local suites; partial requirement coverage | Approved requirements and full role/workflow evidence; 013,003,004 |
| 64 | Data Consistency Across Modules | 50.0% | 49.0% | -1.0 | PARTIAL | Partial | `src/modules/` + `tests/integration/`: Source + current local suites; partial requirement coverage | Approved requirements, dashboard/read-model consistency and full role/workflow evidence; 013,017,003,004,014,011 |
| 65 | Navigation & Information Architecture | 45.0% | 40.0% | -5.0 | PARTIAL | Partial | `src/shared/routing/` + `scripts/architecture/`: Current architecture gate PASS and guide reviewed | Quality gates, extension exercise and production/toolchain proof; 002,016,018,003,012 |
| 66 | Forms Quality | 60.0% | 51.0% | -9.0 | PARTIAL | Partial | `src/ui/` + `tests/unit/ui/`: Source + current UI/static suite; observed owner UI defects | Live product review, UI fixes, copy simplification, authenticated responsive/AT and human validation; 016,005,018,006,003,004 |
| 67 | Tables & Data Grids | 55.0% | 47.0% | -8.0 | PARTIAL | Partial | `src/ui/` + `tests/unit/ui/`: Source + current UI/static suite; observed owner UI defects | Live product review, UI fixes, copy simplification, authenticated responsive/AT and human validation; 016,005,018,006,003,004 |
| 68 | Dialogs & Confirmations | 65.0% | 49.0% | -16.0 | PARTIAL | Partial | `src/ui/` + `tests/unit/ui/`: Source + current UI/static suite; observed owner UI defects | Live product review, UI fixes, copy simplification, authenticated responsive/AT and human validation; 016,005,018,006,003,004 |
| 69 | Empty / Loading / Error States | 55.0% | 47.0% | -8.0 | PARTIAL | Partial | `src/ui/` + `tests/unit/ui/`: Source + current UI/static suite; observed owner UI defects | Live product review, UI fixes, copy simplification, authenticated responsive/AT and human validation; 016,005,018,006,003,004 |
| 70 | Localization / Arabic / RTL | 25.0% | 7.0% | -18.0 | NOT VERIFIED | Critical | `src/ui/` + `tests/unit/ui/`: Source + current UI/static suite; observed owner UI defects | Live product review plus authenticated responsive/AT and human validation; 016,006,013,004 |
| 71 | Time / Date Handling | 55.0% | 49.0% | -6.0 | PARTIAL | Partial | `src/modules/` + `tests/integration/`: Source + current local suites; partial requirement coverage | Approved requirements and full role/workflow evidence; 013,003,004,011 |
| 72 | Reference Data | 45.0% | 38.0% | -7.0 | PARTIAL | Weak | `src/modules/` + `tests/integration/`: Source + current local suites; partial requirement coverage | Approved requirements and full role/workflow evidence; 013,003,004,011 |
| 73 | Import | 40.0% | 28.0% | -12.0 | PARTIAL | Weak | `src/modules/` + `tests/integration/`: Source + current local suites; partial requirement coverage | Approved requirements and full role/workflow evidence; 013,003,004,011 |
| 74 | Bulk Operations | 45.0% | 28.0% | -17.0 | PARTIAL | Weak | `src/modules/` + `tests/integration/`: Source + current local suites; partial requirement coverage | Approved requirements and full role/workflow evidence; 013,003,004,011 |
| 75 | AI Advisory | 55.0% | 45.0% | -10.0 | PARTIAL | Partial | `src/modules/ai-advisory/` + `tests/unit/ai-advisory/`: Current deterministic provider/safety tests; no live provider call | Live Groq/Gemini/failover, approved privacy, human UAT; 009,010,004 |
| 76 | AI Safety / Governance | 58.0% | 45.0% | -13.0 | PARTIAL | Partial | `src/modules/ai-advisory/` + `tests/unit/ai-advisory/`: Current deterministic provider/safety tests; no live provider call | Live Groq/Gemini/failover, approved privacy, human UAT; 009,010,004 |
| 77 | System Owner Recovery | 70.0% | 57.0% | -13.0 | PARTIAL | Partial | `src/shared/authorization/` + `tests/integration/administration/`: Current local authorization/identity suites + live owner read | Six-persona deny/allow matrix, security and live grant evidence; 010,003,004,008 |
| 78 | Audit Immutability | 60.0% | 59.0% | -1.0 | PARTIAL | Partial | `db/migrations/` + `tests/integration/database/`: PG 18.6 local head 0029; 77 tables; 0 orphans; migration 29/29 | Production parity and complete negative/concurrency evidence; 002,001,003 |
| 79 | Controlled Evidence Immutability | 55.0% | 59.0% | +4.0 | PARTIAL | Partial | `db/migrations/` + `tests/integration/database/`: PG 18.6 local head 0029; 77 tables; 0 orphans; migration 29/29 | Production parity and complete negative/concurrency evidence; 002,001,003 |
| 80 | Production Readiness | 30.0% | 5.3% | -24.7 | NOT VERIFIED | Critical | `src/shared/health/` + `tests/integration/system/`: Current local health/observability tests + live health 200 | Provider configuration, alerts/exporter and runtime parity; 001,002,003,004,006,008,009,010,012,015 |

Task suffixes refer to QC-100-FINAL-. All domains are below100 and mapped to closure work; domain70 is retained. Domain80 follows the separate gate formula.

## 29. Critical Release Gates

| Gate | Status | Current evidence | Remaining tasks |
|---|---|---|---|
| Authentication | NOT VERIFIED | Owner login PASS; six-persona/session lifecycle missing | 003,010,004 |
| Authorization | NOT VERIFIED | Local server policies + owner read; complete live persona/negative matrix missing | 003,010 |
| Data Integrity | NOT VERIFIED | Local PG 77/0; production schema/negative matrix not measured | 001,003 |
| Migrations | FAIL | Live owner projection 0018, 11 pending; source0029 | 015,001 |
| Critical Workflows | FAIL | Local browser failures and required auth skips; scientific policy/evaluator gaps | 013,014,003,004 |
| Audit Durability | NOT VERIFIED | Local guards PASS; populated live/restore continuity missing | 008,001 |
| Security | BLOCKED | 52 local PASS; exposed-credential prerequisite and runtime negatives incomplete | 015,010 |
| PostgreSQL Runtime | NOT VERIFIED | Local18.6 PASS; live projection only, canonical production connection blocked | 015,001 |
| Authenticated E2E | FAIL | Required six-persona fixtures absent; full/closure suites not green | 003 |
| Backup | NOT VERIFIED | No fresh populated exact-candidate artifact | 008 |
| Restore / DR | NOT VERIFIED | Historical empty-row parity only; provider DR absent | 008 |
| Deployment Identity | NOT VERIFIED | Prior provider commit bound source; live application RELEASE identity UNVERIFIED | 001 |
| Render Parity | NOT VERIFIED | Prior recorded provider drift; fresh provider API inspection unavailable | 001 |
| Groq Live | NOT VERIFIED | Implemented deterministic adapter; no accepted live call | 009 |
| Gemini Live | NOT VERIFIED | Implemented deterministic adapter; no accepted live call | 009 |
| UAT | NOT VERIFIED | No signed real human sessions | 004 |
| Accessibility | FAIL | Explicit axe label-content-name-mismatch serious; manual matrix missing | 005,006 |
| Health / Readiness | PASS | Fresh live/live and ready 200 healthy on qclevel.top | 001,007 |
| Exact-HEAD CI | BLOCKED | 35325572254 / Verify / 0 steps / billing account lock | 002 |

1 PASS of19. Any mandatory non-PASS prevents GO. A local pass is not production acceptance.

## 30. Claims vs Reality

| Claim | Expected source | Fresh evidence | Current reality | Verdict |
|---|---|---|---|---|
| Source identity remains fixed over time | Mind / README | Audit revision 298e307721af97d9c1bd22279d0c784fbf5b62a8; editorial revision 20e6ead8f397d02ac2de807a273795dfac47a703 | Each result stays bound to its evidence revision; newer HEAD requires revalidation | HISTORICAL / PARTIAL |
| All routes permission-bound | Previous living audit | 85=2PUBLIC+81AUTH+2OWNER; gatePASS | Prior missing visibility type fixed at source | SUPERSEDED |
| DB suites cannot run without Docker | README/current old Mind | LocalPG18 full suites executed | Equivalent path works; CI container path not rerun | FALSE as blanket claim |
| Source migration head0029 | Migrations/guide | 29 files + local applied0029 | True source; not production applied state | PASS source |
| Applied production head is unknown now | Earlier parity task | Owner live projection0018/pending11 | App projection verified; direct DB details not | PARTIAL / UPDATED |
| Render has exact source SHA | Earlier provider record | Previous dep binds 298e307721af97d9c1bd22279d0c784fbf5b62a8; not reread provider | Record retained; live internal identity unverified | HISTORICAL / PARTIAL |
| Reject is fixed by migrations | Source/live expectations | Local fully migrated ambiguous SQL + live500 | Both source defect and live parity must close | FAIL |
| Zero axe violations means accessibility closed | Narrow earlier scan | Explicit rule1serious;35pass/3incomplete | Narrow zero result superseded; AT missing | FAIL |
| AI availability means live provider verified | HTTP provider/source | availability returns true on configuration | No Groq/Gemini live proof | FALSE |
| Restore parity proves DR | Prior restore record | Zero controlled rows; structural parity only | Populated/provider recovery unverified | PARTIAL |
| Agent owner review proves UAT | UAT plan | No signed human session | Browser automation is not UAT | FALSE |
| Normal pages open means mutations allowed | Visibility vs authorization | Server usecases enforce grants/scope/state/version/SoD | Visibility and mutation remain separate | FALSE |
| Production ready | Release checklist | 18 non-PASS gates of19 | NO-GO | FAIL |

## 31. Findings

| ID | Severity | Finding | Evidence / reality | Domains | Closure tasks |
|---|---|---|---|---|---|
| QC-REAUDIT-F-001 | P0 | Credential-rotation prerequisite open | Prior provider task confirmed compromised credential reuse; current canonical DB URL absent. Direct DB connection not attempted. | 57,58,80 | 015,010,001 |
| QC-REAUDIT-F-002 | P0 | Live migration parity fails | Fresh owner console 0018 / 11 pending; source0029. Direct production tables/orphans NOT VERIFIED. | 14–19,56,80 | 015,001 |
| QC-REAUDIT-F-003 | P0 | Reject Reports live500 and local SQL product failure | Fully migrated analytics fails with ambiguous status; live500 independently observed. Migration alone is insufficient acceptance. | 1,3,18,39,41,64 | 014,003,001 |
| QC-REAUDIT-F-004 | P0 | Exact-head CI did not start | Run35325572254 / job105537703598 / 0 steps / billing lock, not a code-test failure. | 43,44,80 | 002 |
| QC-REAUDIT-F-005 | P0 | Authenticated critical browser closure absent | Full suite failures + 107 skips; six-persona fixtures not executed; timeout/process isolation defective. | 2,9–12,45,80 | 003 |
| QC-REAUDIT-F-006 | P0 | Populated recovery/provider DR missing | Historical77-table restore had zero controlled rows; fresh populated backup/restore and provider capability unverified. | 48,49,77–80 | 008 |
| QC-REAUDIT-F-007 | P0 | Signed real UAT absent | No participant/scenario actual result/sign-off; agent login is not human UAT. | 46,47,80 | 004 |
| QC-REAUDIT-F-008 | P1 | Toolchain/format/lint gates fail | Node22 outside24 contract; format4 files; lint37 errors (19 source/script +18 prior ignored operational helpers); required final Node24 rerun. | 44,53–55,58 | 002 |
| QC-REAUDIT-F-009 | P1 | Integration/concurrency harness or behavior gaps | Reject sync .rejects mismatch; control-center hardcoded0027 vs0029; inspection loser error mismatch. Do not weaken state/audit safety. | 11,17,44,56 | 002,014,003 |
| QC-REAUDIT-F-010 | P1 | Dashboard shared UI and semantics still open | Times, unsupported KPI filters, actor-personal scope/query mismatch, UUID identity, queue definitions, WASM/CSP, headings/targets/small copy. | 4–8,20,41,65–69 | 016,005,017,018,006,007 |
| QC-REAUDIT-F-011 | P1 | Serious Label in Name and manual accessibility missing | Explicit rule:1 serious node,35 passing rules,3 incomplete; comprehensive AT/keyboard not executed. | 7,45,47,80 | 016,005,018,006 |
| QC-REAUDIT-F-012 | P1 | Render/internal release parity unverified | Prior provider drift; live internal identity UNVERIFIED and expected head misleading; provider current SHA not re-read here. | 50,57,58,80 | 001,002 |
| QC-REAUDIT-F-013 | P1 | Live AI/provider/privacy approval absent | Source adapters/safety pass deterministic tests; no live Groq/Gemini/failover or business transmission approval. | 75,76,80 | 009,010,004 |
| QC-REAUDIT-F-014 | P1 | Approved controlled policy and evaluator incomplete | Default lab evaluator denied,PD38 reject blocked,VOID missing; QMS/calibration/signature/retention policies remain OPEN. | 21–36,60–63,72–74 | 013,010,003,004 |
| QC-REAUDIT-F-015 | P2 | Documentation baseline drift | README/route docs freeze a6876f/earlier current claims; old container-only blocker now contradicted by executed local suites. | 53,54,61,65 | 012 |
| QC-REAUDIT-F-016 | P2 | Reference/import/bulk/localization evidence incomplete | No approved scope decision may erase domain70; current app English/LTR; required catalog/import/bulk/report lineage acceptance incomplete. | 38–40,64,70–74 | 013,011,006,004 |

Open:7 P0,7 P1,2 P2. P0/P1 orphans=0; row-level score impact is in the layer appendix. Missing-evidence gates are not fabricated code defects.

## 32. Closed Findings Since Previous Audit

| Historical finding | Current state | Reason |
|---|---|---|
| QC-AUDIT-F-001 | SUPERSEDED | Failure cause freshly identified as zero-step billing blocker; replacement F004. |
| QC-AUDIT-F-002 | PARTIALLY CLOSED | Local PostgreSQL now executes; production and two genuine suite failures remain. |
| QC-AUDIT-F-003 | PARTIALLY CLOSED | Historical structural restore exists; populated/provider/current proof still missing. |
| QC-AUDIT-F-004 | STILL OPEN | Real signed UAT remains absent. |
| QC-AUDIT-F-005 | CLOSED | Explicit visibility source contract and architecture/unit checks now exist; separate E2E proof remains F005. |
| QC-AUDIT-F-006 | STILL OPEN | Full authenticated current E2E not green. |
| QC-AUDIT-F-007 | PARTIALLY CLOSED | Prior provider commit equality recorded; internal release identity/configuration remain open. |
| QC-AUDIT-F-008 | CLOSED | Tracked .DS_Store now0. |
| QC-AUDIT-F-009 | PARTIALLY CLOSED | Current source SHA synchronized; stale document freezes remain explicit. |
| QC-AUDIT-F-010 | PARTIALLY CLOSED | Canonical route integrity and extension guide added; coordinated policy/test/docs still required. |

2 CLOSED;5 PARTIALLY CLOSED;2 STILL OPEN;1 SUPERSEDED. Source closure does not erase a separate runtime gate.

## 33. Remaining Work to Reach 100%

| Order | Task | Purpose | Domains | Primary Indicator / Target |
|---|---|---|---|---|
| 1 | QC-100-FINAL-015 | Close the production connection safety gate | 57, 80 | Production readiness → 100% |
| 2 | QC-100-FINAL-002 | Repair verification gates and prove the final candidate in CI | 14, 15, 16, 17, 18, 19, 43, 44, 53, 54, 55, 56, 58, 65, 78, 79, 80 | Testing / maintainability → 100% |
| 3 | QC-100-FINAL-013 | Complete approved policies and controlled workflows | 1, 2, 3, 6, 7, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 42, 60, 61, 62, 63, 64, 70, 71, 72, 73, 74 | Functional/QC/Lab policy closure → 100% |
| 4 | QC-100-FINAL-014 | Fix Reject Reports and prove its lifecycle and analytics | 1, 3, 18, 39, 41, 64 | Reject/reporting path → 100% |
| 5 | QC-100-FINAL-011 | Complete data governance, reports, exports and imports | 37, 38, 39, 40, 64, 71, 72, 73, 74 | Data/reporting governance → 100% |
| 6 | QC-100-FINAL-016 | Perform live product UX & human-centered page-family review | 4, 5, 20, 41, 47, 65, 66, 67, 68, 69 | Live Product UX: 29.0% → 100% |
| 7 | QC-100-FINAL-005 | Repair the dashboard and shared user experience | 4, 5, 20, 41, 66, 67, 68, 69 | UI/UX → 100% |
| 8 | QC-100-FINAL-017 | Expand dashboard intelligence and real-data visualization | 8, 37, 38, 39, 41, 50, 51, 64, 69 | Dashboard Intelligence: 43.3% → 100% |
| 9 | QC-100-FINAL-018 | Humanize and simplify application-wide UX copy | 4, 20, 41, 65, 66, 67, 68, 69 | UX Writing: 43.7% → 100% |
| 10 | QC-100-FINAL-010 | Verify runtime security, privacy and software supply chain | 9, 10, 11, 12, 13, 21, 57, 59, 60, 75, 76, 77, 80 | Security / privacy → 100% |
| 11 | QC-100-FINAL-003 | Prove authenticated workflows for all six personas | 1, 2, 3, 4, 5, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 53, 54, 55, 56, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71, 72, 73, 74, 77, 78, 79, 80 | Authenticated E2E → 100% |
| 12 | QC-100-FINAL-006 | Verify accessibility across the application | 4, 5, 6, 7, 20, 41, 66, 67, 68, 69, 70, 80 | Accessibility → 100% |
| 13 | QC-100-FINAL-007 | Measure performance, capacity and operational monitoring | 8, 50, 51, 52 | Performance/observability → 100% |
| 14 | QC-100-FINAL-009 | Verify live AI providers and safe failure handling | 75, 76, 80 | AI live/safety → 100% |
| 15 | QC-100-FINAL-008 | Prove populated backup, isolated restore and disaster recovery | 31, 33, 34, 35, 36, 42, 48, 49, 77, 80 | Recovery readiness → 100% |
| 16 | QC-100-FINAL-001 | Verify production database, Render and release parity | 14, 15, 16, 17, 18, 19, 48, 49, 50, 51, 52, 56, 57, 58, 78, 79, 80 | Production parity → 100% |
| 17 | QC-100-FINAL-004 | Run real human UAT and obtain authorized sign-off | 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 46, 47, 59, 60, 61, 62, 63, 64, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 80 | Human UAT/usability → 100% |
| 18 | QC-100-FINAL-012 | Re-audit all 80 domains and reconcile the documentation | 44, 53, 54, 55, 65, 80 | Overall maturity / production readiness → legitimate 100% only with full evidence |

**Execution sequence.** The operator handles connection gate 015 while local engineering starts with 002/013/014/011. Run the read-only live product review 016 before finalizing shared UI work; 005 repairs the current UI, 017 expands only traceable dashboard intelligence, and 018 performs application-wide copy simplification. Then run accessibility/performance/authenticated E2E on the stabilized UI, followed by production parity, real human UAT, and final independent audit 012.

**Plan scope.** The plan now contains **18 independently copyable tasks**. The three added tasks introduce measurable product-experience closure without changing any current maturity score merely because they were added. Every prompt must produce evidence before Task 012 may award additional credit.

## 34. Exact Requirements for Legitimate 100%

A legitimate 100% requires accepted evidence for every applicable requirement across all 80 domains on the same final candidate:

1. All required code, database, build, authenticated E2E and CI gates pass on the declared runtime, with no mandatory scenario skipped.
2. No P0/P1 or mandatory release gate remains open. Missing or blocked evidence earns no passing status.
3. Deployment identity, PostgreSQL/Render parity, populated backup, isolated restoration and provider recovery are proven.
4. Required AI providers, safe failover and data-processing approval are verified; real signed human UAT and required automated/manual accessibility are complete.
5. Every non-applicable requirement has an approved decision and a transparent denominator adjustment. Difficulty or absent tests cannot justify exclusion.
6. Material source or environment changes trigger regeneration of affected evidence for the final revision.
7. Live page-family product review is complete, dashboard KPIs/charts are traceable to real read models and working filters, and application-wide user-facing copy is concise/human without weakening regulated terminology.
8. The three supplementary indicators (Live Product UX, Dashboard Intelligence, UX Writing) reach 100% from evidence, not by editing their displayed values.

The score is an assessment output. Do not edit it to meet a target, remove failing tests or weaken approval rules to increase it.

## 35. Final Decision

**Evidence-revision release decision: NO-GO. Audit status: PARTIAL.**

Source improvements and passing local checks do not close the Reject defect, migration drift, blocked CI, incomplete persona workflows, connection safety, populated recovery, human acceptance, accessibility finding or provider/application identity gaps.

Both living reports and the existing plan were rewritten in place while retaining scores, identifiers and evidence. Closure tasks were not executed during this editorial pass. Any decision for the newer HEAD requires verification appropriate to its changes; this report does not confer it automatically.

## 36. Scoring Formula / Evidence Appendix

Model: S source20,U unit/static15,I integration15,D PostgreSQL runtime15,B browser15,H UX/accessibility/human10,P production/provider10. Values below are awarded percentage points, not test results. Partial proof earns partial layer weight based on actual requirement coverage; absent proof earns zero. Passing tests do not prove every requirement. Missing layers are never redistributed. All layers were considered applicable to system-domain operational scope: architecture also requires integration/persistence/extension-user/deployment proof; no unapproved N/A is used. A later legitimate N/A uses score=100×awarded points/applicable weights with explicit authority/scope. Domain80 is separate:100×fully PASS production gates/19;1/19=5.263157… and does not sum source layers. Health/readiness is one full gate and18 gates earn zero until accepted. This conservative gate-completion metric is not predicted service availability.

| # | S/20 | U/15 | I/15 | D/15 | B/15 | H/10 | P/10 | Total |
|---|---|---|---|---|---|---|---|---|
| 1 | 16 | 13 | 10 | 10 | 2 | 0 | 0 | 51.0% |
| 2 | 16 | 12 | 8 | 8 | 0 | 0 | 0 | 44.0% |
| 3 | 16 | 13 | 10 | 10 | 0 | 0 | 0 | 49.0% |
| 4 | 14 | 12 | 0 | 0 | 2 | 0 | 0 | 28.0% |
| 5 | 14 | 12 | 0 | 0 | 3 | 0 | 0 | 29.0% |
| 6 | 16 | 13 | 0 | 0 | 3 | 0 | 0 | 32.0% |
| 7 | 16 | 13 | 0 | 0 | 3 | 0 | 0 | 32.0% |
| 8 | 14 | 10 | 5 | 5 | 3 | 0 | 0 | 37.0% |
| 9 | 18 | 15 | 12 | 12 | 6 | 0 | 0 | 63.0% |
| 10 | 18 | 15 | 12 | 12 | 3 | 0 | 0 | 60.0% |
| 11 | 20 | 15 | 12 | 12 | 6 | 0 | 0 | 65.0% |
| 12 | 18 | 15 | 12 | 12 | 3 | 0 | 0 | 60.0% |
| 13 | 18 | 15 | 12 | 12 | 3 | 0 | 0 | 60.0% |
| 14 | 20 | 15 | 15 | 15 | 0 | 0 | 0 | 65.0% |
| 15 | 18 | 15 | 13 | 13 | 0 | 0 | 0 | 59.0% |
| 16 | 18 | 15 | 13 | 13 | 0 | 0 | 0 | 59.0% |
| 17 | 18 | 15 | 10 | 10 | 0 | 0 | 0 | 53.0% |
| 18 | 18 | 15 | 12 | 12 | 0 | 0 | 0 | 57.0% |
| 19 | 18 | 15 | 12 | 12 | 3 | 0 | 0 | 60.0% |
| 20 | 18 | 15 | 10 | 10 | 2 | 0 | 0 | 55.0% |
| 21 | 16 | 13 | 10 | 10 | 0 | 0 | 0 | 49.0% |
| 22 | 18 | 15 | 12 | 12 | 0 | 0 | 0 | 57.0% |
| 23 | 18 | 15 | 12 | 12 | 0 | 0 | 0 | 57.0% |
| 24 | 18 | 15 | 12 | 12 | 0 | 0 | 0 | 57.0% |
| 25 | 16 | 15 | 12 | 12 | 0 | 0 | 0 | 55.0% |
| 26 | 12 | 15 | 10 | 10 | 0 | 0 | 0 | 47.0% |
| 27 | 14 | 13 | 10 | 10 | 0 | 0 | 0 | 47.0% |
| 28 | 18 | 15 | 13 | 13 | 0 | 0 | 0 | 59.0% |
| 29 | 16 | 15 | 13 | 13 | 0 | 0 | 0 | 57.0% |
| 30 | 16 | 15 | 13 | 13 | 0 | 0 | 0 | 57.0% |
| 31 | 18 | 15 | 13 | 13 | 0 | 0 | 0 | 59.0% |
| 32 | 18 | 15 | 13 | 13 | 0 | 0 | 0 | 59.0% |
| 33 | 18 | 15 | 12 | 12 | 0 | 0 | 0 | 57.0% |
| 34 | 18 | 15 | 12 | 12 | 0 | 0 | 0 | 57.0% |
| 35 | 16 | 15 | 13 | 13 | 0 | 0 | 0 | 57.0% |
| 36 | 18 | 15 | 12 | 12 | 0 | 0 | 0 | 57.0% |
| 37 | 16 | 13 | 10 | 10 | 0 | 0 | 0 | 49.0% |
| 38 | 16 | 13 | 10 | 10 | 0 | 0 | 0 | 49.0% |
| 39 | 16 | 13 | 10 | 10 | 0 | 0 | 0 | 49.0% |
| 40 | 14 | 12 | 8 | 8 | 0 | 0 | 0 | 42.0% |
| 41 | 12 | 12 | 5 | 5 | 4 | 0 | 0 | 38.0% |
| 42 | 18 | 15 | 12 | 12 | 0 | 0 | 0 | 57.0% |
| 43 | 16 | 13 | 0 | 0 | 0 | 0 | 0 | 29.0% |
| 44 | 18 | 15 | 12 | 12 | 3 | 0 | 0 | 60.0% |
| 45 | 16 | 12 | 0 | 0 | 3 | 0 | 0 | 31.0% |
| 46 | 5 | 6 | 0 | 0 | 0 | 0 | 0 | 11.0% |
| 47 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 4.0% |
| 48 | 16 | 15 | 8 | 0 | 0 | 0 | 0 | 39.0% |
| 49 | 16 | 15 | 8 | 0 | 0 | 0 | 0 | 39.0% |
| 50 | 18 | 15 | 12 | 12 | 6 | 0 | 6 | 69.0% |
| 51 | 18 | 15 | 10 | 8 | 2 | 0 | 0 | 53.0% |
| 52 | 16 | 13 | 8 | 8 | 2 | 0 | 0 | 47.0% |
| 53 | 20 | 15 | 0 | 0 | 0 | 0 | 0 | 35.0% |
| 54 | 18 | 13 | 0 | 0 | 0 | 0 | 0 | 31.0% |
| 55 | 14 | 10 | 0 | 0 | 0 | 0 | 0 | 24.0% |
| 56 | 20 | 15 | 15 | 15 | 0 | 0 | 0 | 65.0% |
| 57 | 12 | 13 | 8 | 5 | 0 | 0 | 0 | 38.0% |
| 58 | 14 | 12 | 5 | 0 | 2 | 0 | 0 | 33.0% |
| 59 | 14 | 13 | 8 | 8 | 0 | 0 | 0 | 43.0% |
| 60 | 12 | 12 | 8 | 8 | 0 | 0 | 0 | 40.0% |
| 61 | 16 | 15 | 10 | 10 | 0 | 0 | 0 | 51.0% |
| 62 | 18 | 15 | 12 | 12 | 0 | 0 | 0 | 57.0% |
| 63 | 14 | 13 | 10 | 10 | 0 | 0 | 0 | 47.0% |
| 64 | 16 | 13 | 10 | 10 | 0 | 0 | 0 | 49.0% |
| 65 | 20 | 15 | 0 | 0 | 5 | 0 | 0 | 40.0% |
| 66 | 18 | 15 | 8 | 8 | 2 | 0 | 0 | 51.0% |
| 67 | 16 | 13 | 8 | 8 | 2 | 0 | 0 | 47.0% |
| 68 | 18 | 15 | 8 | 8 | 0 | 0 | 0 | 49.0% |
| 69 | 16 | 13 | 8 | 8 | 2 | 0 | 0 | 47.0% |
| 70 | 4 | 3 | 0 | 0 | 0 | 0 | 0 | 7.0% |
| 71 | 16 | 13 | 10 | 10 | 0 | 0 | 0 | 49.0% |
| 72 | 12 | 10 | 8 | 8 | 0 | 0 | 0 | 38.0% |
| 73 | 10 | 8 | 5 | 5 | 0 | 0 | 0 | 28.0% |
| 74 | 10 | 8 | 5 | 5 | 0 | 0 | 0 | 28.0% |
| 75 | 18 | 15 | 12 | 0 | 0 | 0 | 0 | 45.0% |
| 76 | 18 | 15 | 12 | 0 | 0 | 0 | 0 | 45.0% |
| 77 | 18 | 15 | 12 | 12 | 0 | 0 | 0 | 57.0% |
| 78 | 18 | 15 | 13 | 13 | 0 | 0 | 0 | 59.0% |
| 79 | 18 | 15 | 13 | 13 | 0 | 0 | 0 | 59.0% |
| 80 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 5.3 | 5.3% |

Domain80: P cell displays the independent gate metric, not provider-layer credit; do not interpret it as a seven-layer sum. Overall maturity=sum of unrounded domain scores/80=3739.263157895/80=46.740789474%.

| Roll-up | Domain IDs: arithmetic mean |
|---|---|
| Overall Product Maturity | 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80 |
| Functional completeness | 1,2,3,20,37,38,39,40,41,64,66,67,68,69,71,72,73,74 |
| QC/QMS completeness | 21,22,23,24,31,32,33,34,35,36,42,60,61,62,63,78,79 |
| Laboratory | 25,26,27 |
| Database & Data Integrity | 14,15,16,17,18,19,56,64,78,79 |
| Security | 13,57,59,76,78,79 |
| Authentication / Authorization | 9,10,11,12,77 |
| UI/UX | 4,5,6,20,41,65,66,67,68,69 |
| Accessibility | 7 |
| Testing maturity | 43,44,45,46,47 |
| Architecture & Maintainability | 53,54,55 |
| Extensibility | 53,54,61,64,65 |
| Operations & Reliability | 8,48,49,50,51,52,56,57,58 |



**Supplementary product-experience formulas.** These are transparent composites of existing domains and therefore do not add weight to Overall Product Maturity:

- Live Product UX & Human-Centered Review = mean(D4=28, D5=29, D20=55, D47=4) = **29.0%**.
- Dashboard Intelligence & Data Visualization = mean(D8=37, D39=49, D41=38, D64=49) = **43.25% → 43.3%**.
- UX Writing & Content Simplification = mean(D4=28, D65=40, D66=51, D67=47, D68=49, D69=47) = **43.666…% → 43.7%**.

Their target is 100%. A new prompt or document does not increase them; only new accepted evidence changes the underlying domain scores.

Round only at final display to one decimal; delta=current displayed−previous displayed. Domain credits and evidence families are in section28; fractional unit/static/integration awards are disclosed rubric judgments, not inferred from file count. H=0 where required humans did not verify; P=0 where domain-specific accepted operational proof is absent. Source/test references use directories for multi-requirement families; ignored raw local logs are .tmp/qc-midpoint and durable important outcomes are retained here. Older documents/comparisons are HISTORICAL. Mechanical1048-file coverage is not exhaustive manual reading; incomplete manual/external/human coverage is PARTIAL.

**Precision limit.** The published points make the arithmetic reproducible, but partial credit remains an audit judgment. No independent numeric rule mapping every requirement to a point was established; a decimal place is not statistical precision or a confidence interval. Deltas from a different prior model do not quantify functional change. This rewrite preserves the scores rather than inventing a new assessment without new evidence.

**Editorial verification.** All 80 domain scores/states agree across languages and all 36 sections remain present. The plan contains 18 independently copyable prompts with unique IDs; the three added product-experience prompts are 016, 017 and 018. Expand/collapse all worked, copied text matched the prompt, and no horizontal overflow occurred at 320, 768 or 1440 pixels in light/dark mode. These are artifact checks, not new application-runtime evidence.
