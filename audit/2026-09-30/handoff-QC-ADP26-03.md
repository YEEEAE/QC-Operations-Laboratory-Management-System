# QC-ADP26-03 — inspection draft save authorization

Date: 2026-09-30, Asia/Riyadh. State: **PARTIAL**. Finding: **QC-PAGE-F-003 technically fixed and verified locally**; page RT-INSP-003 remains PARTIAL / NO-GO. No production access, commit, push, merge, deployment, schema change or human UAT signature.

## Changed

- Results recording authorizes `PERM-INSP-EDIT-DRAFT` / EDIT before criteria evaluation and writes, checking ACTIVE actor, explicit grant, owner/assignee scope, DRAFT state and expected version. Existing result-claim rejection remains.
- The repository locks and rereads the report, repeats authorization against the locked scope/state/version, then atomically updates report metadata/version, replaces results and appends mandatory `MEASUREMENT_RECORDED` audit (`kind: INSPECTION_RESULTS`). PostgreSQL audit is rebound to the transaction; omission of an adapter uses a transaction-bound PostgreSQL writer.
- Frozen criteria are projected from `criteria_snapshot` for the execution page. Edit/submit/resume controls use registered authorization decisions. JSON transports versions as exact strings through a typed union/coercion; safe-number and bigint callers remain supported. Actions use the shared error-code mapping, so permission/conflict/provider failures are distinguishable without SQL or record content.
- The page preserves entered values on rejection, guards repeated submission, focuses status, and provides a record/history recovery link. Network failure is described as unknown outcome, without claiming rollback.
- Contract: [INSPECTION-DRAFT-SAVE-CONTRACT.md](../../Documents/INSPECTION-DRAFT-SAVE-CONTRACT.md).

## Candidate and evidence binding

Audit HEAD `0b1bb21bb3b4eca77862dbba1da8623044e96355` is historical. This task started at clean `main`, HEAD **08d15788f6e7d6e9aedd777a5f4296d44fee8708**; initial diff empty, SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`. Task changes remain local/uncommitted.

[evidence-QC-ADP26-03.json](evidence-QC-ADP26-03.json) retains the seven-file implementation manifest/fingerprint **d42caf7a4f0a4e7a6c9fc636791f128b1af4e63001d0554ee64e51e174eeb4a7**, source migration hashes, build identity/digest, synthetic fixture/role/state binding and sanitized DB before/after counts. Fingerprint boundary explicitly excludes document/evidence self-reference and generated artifacts. The final complete dirty diff is locally reviewable; evidence must not be transplanted to another SHA/tree.

Node **v24.20.0** used for verification. Package declares pnpm **11.25.0**; executable version **NOT VERIFIED**: Corepack cache initially denied; isolated cache attempt failed registry DNS. Installed project CLIs were invoked directly; no dependency installation.

Source head **0042_immutable_lab_equipment_usage**, 42 current source migrations. Isolated PostgreSQL 18 fixture was freshly migrated by the integration suite; migrations and test writes succeeded. Final exact `SHOW server_version` and full applied-ledger export **BLOCKED** by automatic approval-review usage limit, so JSON intentionally records no exported applied ledger or exact-match claim. No historical ledger is substituted.

Local build/release verification **PASS**: release `rel-9641f5aab12878fa`, entry SHA-256 `addbdba94965b4d4a824106e740b20210825c325b62a2f4cf9317436b4ee0655`, full dist digest **db368e74f83ed5b00351f90339f3118a4c5585091a8e137592666d6b69876d0c**. Entry digest alone is insufficient because changed behavior lives in chunks; full build digest is retained. This is a local identity, not deployed identity.

## Evidence / acceptance

| Requirement | Status | Evidence |
| --- | --- | --- |
| Application permission/scope/state/version rejection before criteria/write | PASS | `tests/unit/quarantine/inspection-dynamic-points.test.ts`; six negative cases including inactive, scope, stale, locked and named-owner locked report. Baseline HEAD failed all six; final focused suite passed. |
| Focused unit/domain/error/UI regressions | PASS | 7 files, **70/70**: `node node_modules/vitest/vitest.mjs run tests/unit/quarantine tests/unit/shared/action-error-code.test.ts tests/unit/ui/quarantine-decision-surface.test.ts`. |
| Authorized result evaluation / scientific synthetic roundtrip | PASS, synthetic only | `tests/integration/quarantine/qc-data-002-dynamic-workflow.test.ts` stores server-computed PASS for synthetic 5.4 within synthetic 5–6; structured AQL roundtrip. This does not approve a scientific source. |
| Readable existing DRAFT / denied write / unchanged row/results/version/audit/outbox | PASS | Same PG suite and real browser/direct POST. Read-only actor GET 200, content contains bound inspection reference; direct authenticated POST 403. Full DB snapshots equal before/after rejection. |
| Audit failure rollback | PASS | PG trigger injects audit INSERT failure; entire report/results/audit/outbox snapshots remain unchanged, trigger removed in finally. |
| Locked scope/state/version / race / replay | PASS | PG suite **5/5** total; repository bypass denied, scoped actor reads real record but cannot edit, wrong version/state rejected. Same-version race has exactly one commit/audit; stale replay leaves snapshot unchanged. |
| Real authorized HTTP save / stale UI recovery | PASS | `tests/e2e/inspection-draft-authorization.spec.ts`, **1/1**, final build. Explicit EMPLOYEE+EDIT-DRAFT/GLOBAL versus separate read-only user, existing DRAFT. HTTP 200 then 409; version 7→8, audit 6→7, one result, outbox 0→0 on final run; denial is unchanged. Stale enhanced submission preserves 5.4 and focuses status. Actual values retained in JSON. |
| Actual 320/375/768/1440 CSSpx | PASS, bounded | Same browser test reloads at each actual viewport, asserts no document horizontal overflow and visible measurement control. `.ci-results/QC-ADP26-03-captures/`; 320px capture inspected. Resize-retained drawer state is outside this page test and remains with shell acceptance. |
| Keyboard / focus | PASS, bounded | Actual measurement focus and stale error-status focus; not a full keyboard audit. |
| 200% zoom / manual AT / human UAT | NOT VERIFIED | 720px additional reflow is not claimed as 200% zoom. No manual screen-reader or human acceptance/signature. |
| Astro diagnostics / targeted lint / build / release verify | PASS | `astro-check`: 994 files, 0 errors / 0 warnings / 89 hints. Targeted ESLint and diff whitespace checks pass. Astro build and `verify-release.mjs` pass. |
| Final applied-ledger export / deployment identity | BLOCKED / NOT VERIFIED | Approval-review usage limit blocked final local DB export; no production identity queried. |

PG command: `NODE_ENV=test QC_TEST_DATABASE_URL=<dedicated-loopback-database> node node_modules/vitest/vitest.mjs run tests/integration/quarantine/qc-data-002-dynamic-workflow.test.ts`.
Browser command: `QC_ADP03_DATABASE_URL=<dedicated-loopback-TLS-database> node node_modules/@playwright/test/cli.js test tests/e2e/inspection-draft-authorization.spec.ts --workers=1 --reporter=list`, with built server on loopback port 4323. Test explicitly rejects any external/non-dedicated database. Tokens are generated in memory, traces/video disabled, sessions revoked in finally; no credentials logged or captured.

## Database contract / N/A

Reads: report under lock; receiving/template/frozen snapshot/result context; criteria bound to template version. Writes: report metadata/version, result rows, mandatory audit. Existing report/result/point/user foreign keys and result constraints remain; no migration necessary. Transaction starts before locked reread and ends after audit. No signature/approval/receiving transition or scientific final-result aggregation is added.

Outbox creation **N/A** for this DRAFT save: the registered EDIT workflow has no downstream delivery consumer or receiving transition; existing outbox is asserted unchanged. Reauth/signature/approval SoD **N/A** under registered EDIT policy; approval/release ceremony remains independently required. Named yazeed cannot override draft state/version. Replay uses optimistic version rejection, not a newly invented dedupe contract.

## Remaining decisions / open pages and findings

- QC-PAGE-F-003: local implementation and technical acceptance verified; production deployment and broad page acceptance remain open. RT-INSP-003 score/denominator unchanged.
- F-004 numeric text transport / decimal scientific contract, F-005 notes/remarks/NA storage, F-008 unavailable-source versus missing/denied page read classification, F-010 approved scientific source/hash/final-result binding, and F-011 native POST remain OPEN with their own tasks. No policy was relaxed to obtain a PASS.
- QC/QMS owns PD-01/02/07 source/result decisions; draft recording does not close them. AT/zoom and human acceptance require real evidence, not source/axe inference. No UAT signed on behalf of a person.
- Automatic approval review failed for final DB evidence export due to usage limit; it did not judge the operation unsafe. No bypass attempted. The temporary cluster `/private/tmp/qc-adp26-03-pg` on loopback 55433 may remain running pending permitted cleanup; it contains synthetic data only. The application preview is stopped at handoff.
