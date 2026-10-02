# QC-POST-100-006 — Scientific source, signature, and release decisions

State: **PARTIAL / NOT VERIFIED**. No approved scientific source or new owner decision was supplied, so positive scientific acceptance and release remain blocked. Existing deny behavior is preserved.

## Candidate freeze

- HEAD: `9b581ad07c3c10cef5d7e945d62c66e13105446b` (`main`).
- The final local build envelope in `.ci-results/build.json` records the current SHA, source fingerprint, migration head, Node version, and artifact digest. The evidence note and Mind entry are included in that final fingerprint.
- Source migration head: `0043_controlled_document_source_binding.sql`.
- Local build artifact SHA-256: `ed8b8f2ef6174e65c7fa2f72572fcbf44d04dcfd80f5144971a16da84253c6bb`.
- Evidence environment reported Node `v22.22.3`; the project requires `>=24.20.0 <25`. Treat the build and focused test results as environment-qualified local evidence, not a supported-runtime release PASS.

## Current source and owner boundaries

- Inspection rules require an approved controlled source and prohibit client-declared `PASS`/`FAIL`. The server-side inspection evaluator is not available to invent scientific outcomes; `PASS` does not release material.
- Laboratory creation/resolution requires approved template context, method/source reference, content hash, criteria and parameters; missing context is denied. The production laboratory evaluator throws `AUTHZ_DENIED`. Reject decision authority remains `POLICY_SOURCE_REQUIRED` (PD-38).
- Document digests are derived server-side from document identity, revision, active linked file IDs/roles and stored SHA-256 values. Approval rechecks the binding. The 0043 source migration snapshots effective document revision/hash/file manifest, but its PostgreSQL application is not verified.
- Generic approval signature policy remains `UNRESOLVED` (PD-32) and blocks before reauthentication. Document effectivity/effective-date policy (SD-023/PD-13), WI/SOP approval authority (RD-019), approved-file definition, scan/MIME, source ownership and retention remain with Document Control/QMS. P-05 role decisions do not resolve signature scope or scientific policy.

No official source/revision, owner approval, or human signature evidence was available in the current workspace for this task. Synthetic fixtures with an injected allow policy are test mechanics only and are not positive official-source proof. Do not use them to close the positive acceptance requirement.

## Verification performed on this source candidate

- Focused unit contracts: 5 files, 40/40 PASS: laboratory scientific governance, laboratory workflow, controlled-policy fail-closed, document digest, and approval decision capability UI contract.
- The focused contracts include denial for missing controlled lab evaluation, forged inspection `PASS`/`FAIL`, digest/revision mismatch, absent/inactive files, and unresolved approval signature policy. They do not establish that a real approved source exists or that the migration is applied to PostgreSQL.
- A broader evidence-wrapper invocation also discovered a PostgreSQL integration suite; it was BLOCKED because Testcontainers could not find a container runtime. Its result is not counted in the 40-test focused total.
- `pnpm build` completed and wrote a build envelope for this SHA, but the engine warning confirms unsupported Node `v22.22.3`; evidence remains environment-qualified.
- Authenticated browser, AT, populated PostgreSQL 18, official-source positive flow, and human UAT/signature: NOT VERIFIED / NOT RUN.

## Remaining owner inputs for a future positive candidate

1. QC/QMS-approved scientific source identity and revision, controlled file identity/hash, units, precision, criteria/formula and any manual-judgment rules for the affected inspection/lab workflows.
2. Document Control/QMS decisions for effectivity/effective date, approved-source-file definition, scan/MIME acceptance, ownership and retention.
3. QMS per-decision signature map/meaning and the outstanding RD-019 document approval authority decision.
4. Genuine approved source fixtures and authorized human evidence for positive acceptance; then rerun negative drift/missing/client-claim cases and PostgreSQL 18/browser acceptance on the re-frozen candidate.

No policy, approval, scientific evidence, human signature, UAT, production write, or migration was manufactured or executed. Do not mark CLOSED until these owner inputs and required proof exist.
