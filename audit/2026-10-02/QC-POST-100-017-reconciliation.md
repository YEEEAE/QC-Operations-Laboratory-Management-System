# QC-POST-100-017 — Exact-HEAD coverage reconciliation

**State: PARTIAL / EVIDENCE_PENDING / BLOCKED_BY_AUTHORITY_SOURCE — the user approved separate metric denominators; no combined score, current domain average or release approval is implied.**

## Freeze and authority boundary

- Reconciled repository: branch `main`, HEAD `fcde3b81e9c9dbf8213d977309bd8bb423c35aa9`.
- Working tree at reconciliation start: modified `.agents/mind/01-mind-latest.md`; untracked `audit/fcde3b81e9c9dbf8213d977309bd8bb423c35aa9/`. Both were present before this report and preserved.
- Source-tree fingerprint at start: `3928ce40436ecd0cc1cd5c54bf924387afd76416da5625f01396e6830ff2613e`; final source fingerprint: `bd9bcd328add9f8ed6dc19816a648ed389a1acb031f78872e70af735407e435d`. Both use sorted relative path + NUL + file bytes + NUL and exclude generated coverage-register outputs, secret-named paths and this report. The hash identifies the documentation/source snapshot, not a build or runtime artifact.
- Toolchain observed: Node `v22.22.3`, outside the repository contract `>=24.20.0 <25`; package-manager execution, build identity, applied schema and runtime were not established by this read-only reconciliation.
- Current source migration manifest: 45 SQL migrations through `0045_provider_attestation_nonce_replay_guard`; this is source state only. Applied schema remains NOT VERIFIED. The old register’s `0043_controlled_document_source_binding` is stale.
- No source/schema/runtime changes, database writes, production operations, or release decisions were made.

## Source reconciliation (not score approval)

| Subject | Reconciled source count | Finding / treatment |
|---|---:|---|
| Canonical routes | 86 | Read from `src/shared/routing/routes.ts`; this is the current route source, not the old report’s historical count. |
| Error pages | 2 | `/404` and `/500` are outside the canonical route registry. Together with 86 canonical routes these explain the historical 88-page scope, but do not prove current browser acceptance. |
| Current route/persona planning rows | 528 | 88 × 6 planning personas. These are visibility/planning rows only; the route-acceptance contract says its 3,696 rows are planning, not an approved acceptance denominator. Applicability, mutation authority and human acceptance remain unresolved. |
| Post-report page criteria | 671 | Preserved separately from `audit/2026-10-02/post-implementation/verification-data.json`: 88 pages, 671 checks, candidate `6059e177438d8ae110c99084d32758b048f22cd2`, statuses 311 PASS / 337 NOT VERIFIED / 23 FAIL. Entire set is HISTORICAL, not evidence for current HEAD. |
| Older coverage-register page checks | 657 | Distinct older source rows in the stale 1,508-row register. They must be replaced, not counted alongside the 671 post-report criteria. |
| Requirements | 100 | Exact stable rows in `Documents/REQUIREMENTS-RECONCILIATION.md` (96 MANDATORY, 4 OPTIONAL). Requirement-source review does not approve a new evidence-scoring denominator or assign acceptance authority. |
| Audit domains | 80 | D01–D80, unchanged. The domain source provides historical arithmetic (`2,638/80 = 32.98`) on another freeze; that is not a current score or approval of QC-POST scoring rules. |
| Prompt specifications | 36 | `prompt-specifications.json` has 36 unique task IDs, 37 named prompt fields, and row-ID links. The current user-trimmed authoritative HTML has 17 cards; the 36-task source specification is a different historical pack generation, not 36 current executable cards. |
| Prompt master ledger | 2,609 | Unique structural rows across source/report/register types. Includes 671 post-report page criteria, 657 older register checks, 528 route/persona planning rows, 100 requirements, 80 domains, 61 register tasks, 47 findings, 25 indicators, 22 report audit gates, 19 master gates and 16 older report headings among other preserved rows. Structural linkage is not accepted evidence. |
| Post-report checklist metric | 671 checks | User approved the post-report check denominator as a separate weighted-checklist measure. Current accepted evidence is 0/671; this is evidence coverage, not product maturity. The old 657 checks are not substituted or added. |
| Domain arithmetic metric | 80 domains | User approved D01–D80 as a separate arithmetic-mean denominator. Current domain scores are not accepted/current, so the current mean is NOT VERIFIED (not zero). |
| Release readiness | 19 gates | User approved 19 as the separate Go/NoGo gate set. Gate names/rules remain unresolved and dispositions BLOCKED; this is not a percentage or checklist score. |
| Post-report sections | 52 rows | `POST-REPORT:01`…`POST-REPORT:52` in the post-report ledger. Preserve/map all 52 for traceability; do not substitute the older 16-section set or count sections as checklist checks without an approved rule. |
| Provisional 1,516 proposal | 1,516 rows | Rejected/not applied: it combined unlike metric groups and included 14 scored report-section rows from the older register. User subsequently approved separate denominators instead. |
| Prior coverage register | 1,508 rows | Preserved unchanged: 100 requirements + 528 page-role + 657 older page-check + 80 domains + 19 release-gate + 16 report-section + 47 findings + 61 tasks. Its 1,502 denominator is stale and not adopted. |
| Current register evidence | 0 accepted | Its prior candidate was `f284dc38b6c5bda68ad6a28ff91a419f0f85c7bc`, fingerprint `47d9e43793f85a0fd82b3649717cd5b543cfa362d174e616f04e85a5a385bafb`, runtime Node 22.22.3, migration source head `0043_controlled_document_source_binding`; applied schema and build identity are null. That binding is stale against this HEAD/tree and the observed source head `0045_provider_attestation_nonce_replay_guard`. |
| Report headings / gates | 52 / 22 vs 19 | The post-report has 52 section rows. The historical 16-section register rows are not substituted. The 22 report audit gates are a separate inventory, not the 19 canonical release gates. The 19-gate names, criteria, owners, signer/provider/freshness/digest rules remain unresolved in the approved source and are BLOCKED_BY_AUTHORITY_SOURCE. |

## Row review and evidence disposition

The full 100-row source register and 80-row domain matrix were compared with their approved source documents. The prior JSON inventory was parsed across all 1,508 rows: all have unique IDs and non-empty owner, criterion, source, responsible-prompt and candidate/fingerprint evidence-binding fields; none has `evidence.accepted=true`. This verifies record shape/link completeness only. It does **not** verify that a task label is an accountable authorized person, that the criterion is scientifically/policy-authorized, that applicability is approved, or that an artifact exists and passes. The user explicitly approved using separate denominators for the 671-check weighted checklist, the 80-domain arithmetic average, and the 19-gate Go/NoGo decision. That approval is a scoring-method decision only; it does not accept row evidence or authorize product/release claims.

All 671 post-report criteria replace, rather than add to, the 657 older checks for the checklist metric. The old 657 remain separately preserved for traceability. The 528 route/persona planning rows, 52 post-report sections, original/post prompt mappings, 25 indicators, 22 report gates and 19 master-gate slots remain distinct. Their full row identifiers and source references remain in `master-coverage-ledger.json`; no historic PASS was promoted. Historical scores stay unchanged.

Approved separate measures: **671** post-report checks for the weighted checklist; **80** domains for the arithmetic mean; **19** canonical gates for Go/NoGo. For the first measure, current accepted candidate-bound evidence is **0/671**; this is checklist evidence coverage only, not product maturity. The 80-domain current arithmetic mean is **NOT VERIFIED** because no current domain scores are accepted. The release decision remains **NO-GO** with 19 gate definitions/dispositions blocked; no gate percentage is computed. The 52 post-report sections and 25 indicators remain mapped/reviewed as distinct rows, not merged into those three measures. No additional N/A/exemption is approved. The 22 report audit gates remain separate from the 19 master gates.

The three measurement concepts remain separate:

1. Historical report weighted checklist: `311/671 = 46.3%` on historical candidate `6059e177…`; not current product maturity.
2. Domain arithmetic mean: the 80-domain audit’s historic `2,638/80 = 32.98/100`; separate method and freeze; not the checklist score.
3. Release Go/NoGo: governed gate decision. The approved release-gate source says current decision `NO-GO`; neither structural mappings nor either numeric measure changes it. `PASS ≠ RELEASED`.

## Disposition / required authority

- `QC-POST-F-001`: source repair is reported present by QC-POST-100-002/current Mind, but no current-candidate populated PostgreSQL 18, no-JS/browser, direct denial/rollback, or human UAT evidence is in this reconciliation. **PARTIAL / EVIDENCE_PENDING**, not closed.
- `G-010`: the user approved separate scoring measures (671 / 80 / 19), but requirement-to-evidence traceability remains structural only, the prior register is candidate-stale, and the 52 report sections/25 indicators remain distinct unmixed mappings. **PARTIAL / EVIDENCE_PENDING**.
- The 19 master-gate definitions, scientific criteria and other policy/source-dependent decisions still lack an approved WI/SOP/specification/policy/revision and named accountable owner. The scoring-method approval does not approve these matters.
- `QC-POST-F-001` and `G-010` remain OPEN pending row-level evidence, exact candidate bindings and review. Do not promote evidence or change the NO-GO decision.

## Verification record

- Direct source/metadata audit and machine parsing: PASS for reported structural counts and fields (read-only; does not establish criterion acceptance).
- Denominator verification: PASS — the three approved denominators remain separate (671 checklist checks, 80 domains, 19 gates); no combined total is calculated. Current checklist evidence accepted: 0/671.
- Prompt-pack interaction model: `validate-interactions.cjs` PASS 32/32; this is DOM-model logic only, not browser rendering/clipboard/manual AT or product evidence. `validate-pack.py` could not run because it hard-codes the removed old pack path `audit/QC-POST-IMPLEMENTATION-REMAINING-TO-100-PROMPTS.html`; the live pack is under `audit/QC-POST-100-PROMPTS/`. No regeneration attempted.
- Current implementation tests, release build, PostgreSQL 18 transaction/checksum/rollback/concurrency evidence, authenticated HTTP/browser traces, exact release artifact/runtime, provider parity and human UAT: NOT RUN / NOT VERIFIED here. Host Node is outside contract; no current candidate-bound proof was accepted.
- Historical source data and prior handoffs were treated as HISTORICAL unless explicitly recorded above as source inventory only.

## Source files

- `audit/QC-POST-100-PROMPTS/QC-POST-IMPLEMENTATION-REMAINING-TO-100-PROMPTS.md` (pointer to the current user-trimmed HTML pack)
- `audit/QC-POST-100-PROMPTS/QC-POST-IMPLEMENTATION-REMAINING-TO-100-PROMPTS.html`
- `audit/2026-10-02/prompt-pack-optimization/prompt-specifications.json`
- `audit/2026-10-02/prompt-pack-optimization/master-coverage-ledger.json`
- `audit/2026-10-02/prompt-pack-optimization/handoff.md`
- `audit/2026-10-02/coverage-register.json` (stale candidate; preserved)
- `audit/2026-10-02/post-implementation/verification-data.json` (historical 671-check source)
- `Documents/REQUIREMENTS-RECONCILIATION.md`
- `Documents/REQUIREMENTS-TRACEABILITY.md`
- `Documents/ROUTE-ACCEPTANCE-MATRIX.md`
- `src/shared/routing/routes.ts`
- `audit/100-percent/QC-CLOSURE-017-FINAL-80-DOMAIN-AUDIT.md`
- `audit/100-percent/RELEASE-GATE.md`
