# QC-ADP26-07 — P-04 and equipment eligibility

## Changed

- CAPA register/new/detail copy maps BR-QUAL-032 and P-04: ACTIVE Supervisor, explicit CAPA-close grant, scope/state/version, reason, reauthentication and CLOSE signature. PD-18 effectiveness criteria remain open with the Quality-policy owner; closure makes no effectiveness verdict.
- Calibration detail maps approved BR-CAL-004 and BR-MNT-004. Current equipment/current calibration determines eligibility; overdue/non-active equipment cannot be used. Missing eligibility source remains unconfirmed. Primary/history provider failures are distinct from missing/empty records. Reads do not mutate equipment or calibration.
- PostgreSQL regression exposed omitted actions in CAPA read aggregates and BigInt JSON failures in signed snapshots/idempotency responses. Reads now include ordered actions; persistence uses the same canonical JSON used for the signature and replay hydrates version/date values.
- Preserved existing QC-ADP26-06 changes and other dirty user files. No commit/push/deploy, production connection or new migration.

## Evidence

- Candidate `a5ae05df9f7d20f69b13195534afe414525b7c01`, branch `main`. Requested audit SHA `0b1bb21bb3b4eca77862dbba1da8623044e96355` is HISTORICAL; F-007 was rechecked against this working tree, not transferred automatically.
- Node `24.20.0`, pnpm `11.25.0`, PostgreSQL `18.6`; source/applied migration ledger 42 entries, head `0042_immutable_lab_equipment_usage.sql`. Exact ledger and sanitized DB before/after are in `evidence-QC-ADP26-07.json`. Implementation manifest hashes bind these results; final full dirty fingerprint is in ignored `.ci-results/QC-ADP26-07-final-identity.json` to avoid a self-referential digest.
- PASS: Node24 Vitest five files, **36/36**. Command: `NODE_ENV=test QC_TEST_DATABASE_URL=<dedicated-loopback> node node_modules/vitest/vitest.mjs run tests/integration/quality/capa-close-postgres.test.ts tests/unit/quality/capa-close.test.ts tests/unit/assets/equipment-eligibility.test.ts tests/unit/ui/record-journey-contract.test.ts tests/integration/assets/equipment-eligibility.test.ts`.
- PASS: PG five acceptance cases — incomplete-action closure, existing readable record denial for role/grant/scope/inactive/version/reason/reauth, audit failure rollback, same-version race, committed repository replay. Assertions cover unchanged row/actions/audit/signatures/snapshot/idempotency/outbox on rejection. Initial failing tests proved the read/snapshot defects before repair.
- PASS: `node node_modules/@playwright/test/cli.js test tests/e2e/capa-policy-copy.spec.ts --workers=1 --reporter=list`, **1/1**. Real authorized CAPA read, invalid reauth direct HTTP rejection with unchanged row/audit/outbox, real Argon2 reauth and signed closure, register/new copy, expired CURRENT calibration detail. CAPA/calibration details tested at actual 320/375/768/1440 CSSpx without document overflow. Synthetic role SUPERVISOR, CAPA IN_PROGRESS with OPEN action, equipment ACTIVE and expired CURRENT source calibration. Fixtures are technical evidence, not human acceptance.
- PASS: Node24 `node node_modules/astro/astro.js build`; server/client compile. Build entry SHA-256 recorded in evidence; this is compilation, not signed release identity. PASS: `git diff --check` and regenerated workspace map.
- FAIL: earlier `pnpm typecheck` reported nine declaration/type errors in untouched verification/E2E script paths. No claim that these were reproduced on clean HEAD. Earlier wrapper build/release reporter needed a fresh candidate run context; local Astro build and list reporter are recorded separately, with no release claim.
- NOT VERIFIED: manual AT, actual 200% browser zoom, six-persona acceptance, human UAT, production/applied production schema and signed release identity. No WCAG or production-readiness claim.

## Database and authorization boundary

- CAPA reads: actor-scoped `capas`, related `capa_actions`; assets reads: equipment/current calibration/maintenance/history. Page entry remains governed by middleware `pageAccessDecision`; Action rechecks permission/scope/state/version and P-04 Supervisor authority. Canonical yazeed alone cannot satisfy Supervisor.
- CAPA close transaction: idempotency record, CAPA `FOR UPDATE`, current ordered actions and matching signature hash; append close snapshot/signature/audit, update CAPA state/version, complete idempotency. Any failure rolls back all. Existing FKs/positive versions/snapshot constraints suffice; no schema change required.
- Outbox N/A for closure writes: existing close contract defines no event or consumer. Tests prove outbox unchanged. No invented event or effectiveness transition. Equipment eligibility is read-only here; established lab/inspection record and submit paths perform server checks.
- SoD N/A for this exception: approved P-04 contract defines Supervisor authority and explicit ceremony, not a new independent-actor requirement. Reauthentication/signature remain mandatory. PD-18 unresolved rules stay deny/owner-dependent; no policy was invented.

## State and handoff

**PARTIAL**. F-007 copy-to-policy mapping and P-04 technical positive/negative acceptance PASS. RT-CAPA-001/002/003 and RT-CAL-003 source copy repaired and live fixtures bound. Manual AT/200%/UAT remain open; page-wide findings F-008/011/018/020/031/033 outside this narrow task are not closed globally. Other quality creation/transition owner decisions remain open. No effectiveness claim, automatic equipment activation or automatic CAPA transition was introduced.

The disposable database is local `qc_adp26_07`; no production data or credentials are included in this handoff or evidence. Local test services are stopped after evidence collection.
