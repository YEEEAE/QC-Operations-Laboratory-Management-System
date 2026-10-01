# QC-POST-100-004 — Candidate handoff

- **State:** PARTIAL; required CLOSED proof is incomplete.
- **Audit candidate:** `6059e177438d8ae110c99084d32758b048f22cd2` (historical; not used as current evidence).
- **Current source candidate:** `b0f8f734ca299d755deb1ddbc502f0fbb5630db5`.
- **Frozen source fingerprint:** `9115ebb0cfe97ed4c1c2946559a1a324503af9e94b0b1bb0a75d8f653701ce06`.
- **Verification run:** `b31bc299-2838-43de-85f2-7b393ee37763`.
- **Runtime:** Node `24.20.0`, pnpm `11.25.0`.
- **Migration source head:** `0043_controlled_document_source_binding`; applied PostgreSQL 18 state NOT VERIFIED.

## Changes

- Removed delivery-to-domain import in `src/actions/documents.ts` by exposing the controlled state options through the documents application vocabulary.
- Fixed the AI advisory request-button null check and the equipment eligibility test's literal permission typing.
- Fixed uploaded-document date formatting and corrected UI contract assertions to check approved meaning without weakening or disabling tests.
- Added the missing release signer and AI policy environment key names and documented their meaning; no values or policies were invented.
- Updated the system extension guide to identify migration 0043 as source head, not applied database proof.
- Fixed current lint errors and formatted eligible source files. Historical audit/evidence artifacts remain byte-preserved.

## Evidence

- Focused affected unit suites: `61/61 PASS`.
- Signed intake, attestation, server evidence, and environment parity suites: `18/18 PASS`.
- `pnpm test:architecture`: PASS.
- `pnpm typecheck`: PASS, 1030 files, 0 errors, 0 warnings, 113 hints.
- `pnpm lint`: PASS.
- `pnpm release:parity:check`: PASS, `7/7`.
- `pnpm test:unit`: FAIL, `1135/1158 PASS`, 23 failed tests across 17 files.
- `pnpm format:check`: FAIL on 15 historical audit/evidence files; eligible non-historical source was formatted.
- `git diff --check`: PASS.
- `pnpm build`: PASS on the frozen candidate; release identity binds source SHA and migration head. Artifact digest `dbfbf873019e491cf98ac8e6b2310e2d0942951ec1b8ad223a0ab5464be6fd20`; server entry digest `ed8b8f2ef6174e65c7fa2f72572fcbf44d04dcfd80f5144971a16da84253c6bb`.
- Final candidate-bound `pnpm test:unit`: FAIL, `1135/1158 PASS`, 23 failed across 17 files; evidence envelope matches the frozen fingerprint.

## Acceptance boundary

- QC-POST-F-007: source boundary corrected; architecture PASS.
- QC-PAGE-F-019: local route/architecture and signed-evidence intake suites PASS; live PostgreSQL/runtime proof NOT VERIFIED.
- QC-PAGE-F-020: focused UI contracts PASS; rendered browser, assistive technology, and human UAT NOT VERIFIED.
- QC-ENV-F-004: local config/parity PASS; live Render read-back NOT VERIFIED.
- No production migration, deployment, commit, or push performed.
