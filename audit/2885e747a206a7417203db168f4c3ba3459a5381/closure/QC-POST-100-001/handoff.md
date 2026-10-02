# QC-POST-100-001 — frozen-candidate acceptance handoff

State: **PARTIAL / NOT VERIFIED**. No assigned atomic criterion is accepted as PASS and no finding is closed.

## Candidate

- HEAD: `2885e747a206a7417203db168f4c3ba3459a5381` (`main`), clean at freeze.
- Source fingerprint: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (captured before this evidence packet; algorithm in `scripts/verification/evidence-identity.mjs`).
- Source migration head/count: `0043_controlled_document_source_binding.sql` / 43; source migration digest SHA-256: `8c0a80f8d1dfaa1d6fa6279f7819fb6d1a0f5fb277b178805d6ac30c2e3fc606`. Applied schema digest: NOT VERIFIED.
- Runtime: Node `v22.22.3` (contract `>=24.20.0 <25`, not satisfied); pnpm `11.25.0`. No build artifact/runtime digest generated.

## Current source review

Native POST handling remains present on all three requested routes. Laboratory final approval submits the reauthentication secret in the POST body and clears the input after every client attempt; server final approval uses the existing signature ceremony and transactional repository path. Daily Reject and Issue Slip POST handlers retain submitted values and dispatch through existing Actions; repository source uses expected-version/state guards and same-transaction audit/outbox writes for the reviewed transitions. The Issue Slip approval name is a creator-recorded confirmation, not an electronic signature. These are source observations, not runtime acceptance.

## Acceptance status

- AC-01 **NOT VERIFIED**: no populated no-JS request, browser response/result, URL/log/retained-HTML inspection.
- AC-02 **NOT VERIFIED**: no same-candidate valid-record positive control plus direct denied/stale/replay/invalid-state/SoD requests and zero-write snapshots.
- AC-03 **BLOCKED**: Docker API socket unavailable; no PostgreSQL 18 transaction/failure-injection/rollback evidence. No retry is recommended after an ambiguous write without record/history reconciliation.
- AC-ROW **PARTIAL**: 87 assigned atomic rows are separately listed in `criteria.json`; all remain NOT VERIFIED or BLOCKED and OPEN/PARTIAL.

Prior `audit/2026-10-02/handoff-QC-POST-100-001.md` is HISTORICAL: it binds to HEAD `6059e177438d8ae110c99084d32758b048f22cd2`, fingerprint `402846...`, and Node 24.20.0. It cannot transfer its focused-test/build result to this SHA.

## Minimum remaining evidence

Run on this exact source candidate in an environment with Node 24.20.x, an isolated disposable PostgreSQL 18 database, and authorized populated UAT fixtures/credentials: no-JS positive path for each route; direct valid-record negative controls and before/after row/audit/outbox/signature reads; fault-injected transactional rollback; stale/duplicate replay and unknown-result record/history reconciliation; exact runtime/build/schema identity; retain sanitized traces and checksums. Manual owner/AT/UAT evidence remains distinct and must be provided for applicable human rows.

No source repair was reopened because this inspection did not reproduce a defect. No production or Git operation was performed.
