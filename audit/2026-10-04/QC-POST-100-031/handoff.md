# QC-POST-100-031 — PARTIAL / EVIDENCE_PENDING

## Candidate and dependency

Inspected clean source HEAD `a2071eef8086f919fd4877456c9b621111d16e4f`; this packet describes local workflow changes, not an executed CI deployment. No commit, push, deployment, provider settings write or database operation performed.

QC-POST-100-030 remains blocking. Its continuation packet binds to `cd87faea079ca2d1812103068b7ac421842675ee`, not this HEAD. Its final completeness exit is 1: integration 30 failures/11 skips, migrations 1 failure, concurrency 6 failures, E2E 13 failures/5 skips. It is not a verified releasable artifact. Read-only GitHub Actions query for the inspected HEAD returned no workflow runs (`.ci-results/QC-POST-100-031/github-runs.json`).

## NEW_RESIDUAL_FINDING — RF-031-ARTIFACT-PROMOTION

Bind to QC-POST-100-031 and FINAL; do not reopen historical work. Current CI attests only `dist/server/entry.mjs` and previously uploaded evidence, not the entire runtime bundle. `render.yaml` builds again from source. An entrypoint digest, source SHA or historical reproducibility run cannot prove identical deployed bytes. No architecture-approved equivalent or current provider artifact attestation was found.

Local workflow now seals a gzip tar archive of `dist`, installed `node_modules`, package metadata and lockfile only after mandatory verification completeness succeeds. It verifies the earlier dist tree manifest, records exact Node/source/build/service/start contract, generates SHA256SUMS including archive and manifests, attests all sealed files and uploads a unique non-overwritten artifact. These steps are NOT RUN in GitHub; no signature or immutable remote artifact is claimed. Archive includes dev dependencies as installed by CI; it is not an OS/container identity and has not been accepted by architecture or adopted by the provider. Earlier entrypoint attestations remain limited-scope provenance, not full acceptance.

## Identity scope / D0.2

- SOURCE_SHA: all tracked repository content, including document/evidence folders. Local changes require a new committed candidate before trusted CI acceptance.
- BUILD_INPUT_SET: source, Astro configuration/integrations, scripts, dependencies/lockfile, runtime build toolchain and environment. No source/script reference to either canonical folder was found. Exact dynamic build-input closure is NOT VERIFIED; a docs-only commit must not be presumed byte-identical.
- DEPLOYED_ARTIFACT_BYTES: NOT VERIFIED. CI archive covers application output/dependencies, not provider OS/runtime image. Compare its actual archive SHA256 with promoted and provider-observed bytes, plus separately verify runtime contract and signatures. Repacking/rebuilding is not identity.
- Both canonical folders are excluded by the proposed explicit archive member set. They may remain in provider checkout/build workspace; that is not proof they are absent from its complete image. Current provider packaging is NOT VERIFIED.

Recursively enumerated D0.2: 30 SOP PDFs, 68 WI DOCX, 20 reference files. All 117 SHA256SUMS entries match; both ZIP integrity checks pass; original archive matches all 84 operational image bytes. READ-ME declares D0.2 DRAFT FOR REVIEW, 28 proposals and 20 blank continuation records. Classifications remain DRAFT_SOURCE_AVAILABLE, PROPOSAL_AVAILABLE, FILLABLE_FORM_AVAILABLE and SOURCE_INTEGRITY_EVIDENCE; no approval/effectivity/signature/UAT acceptance inferred. No new rendering acceptance claimed. Full hashed inventory: `.ci-results/QC-POST-100-031/source-discovery.json`.

Application registry source searched through `src/modules/documents/application/list-source-files.ts` and its PostgreSQL repository. Live controlled-source rows are NOT VERIFIED: no authorized current database/actor binding was available. Current audits/handoffs and dependency packets were searched. Historical provider observations in Mind are not current read-back.

## Verification

Node 24.20.0: focused build-manifest/Render tests 7/7 PASS. Workflow YAML parsing and step-order assertions PASS: seal/attest/upload follow completeness and are not always-run. Prettier and `git diff --check` PASS. Build, full CI, artifact archive execution, provider runtime read-back and signed attestation verification NOT RUN. No release gate closed.

## MISSING INPUT REQUEST

- Exact missing item: authorized read-only current provider service/deployment metadata and artifact digest/attestation, bound to a successful exact-candidate CI archive; approved signer/freshness policy and architecture decision for consuming that archive or a byte-for-byte equivalent mechanism.
- Why required: prove deployed Git SHA, exact Node, service version, effective start command and actual complete byte identity, rather than repository defaults or rebuild assumptions.
- Paths searched: `.github/workflows/ci.yml`, `render.yaml`, `scripts/release/`, `Documents/`, recursively both canonical folders, Documents application registry source, current `audit/` and `.ci-results/QC-POST-100-030*`. Live DB registry remains explicitly blocked, not searched by unauthenticated access.
- Already found: D0.2 drafts/hash evidence, original images, local manifest tooling, historical provider observations and failed dependency evidence.
- Why insufficient: none supplies a current signed full artifact/provider read-back or architecture approval; 030 is not passing.
- Minimum additional input: a read-only provider connection or sanitized signed export with deployment ID, timestamp, Git SHA, artifact SHA256 and byte scope, Node/service/start values, trusted signer/key/nonce; architecture approval reference. No underlying SOP/WI/form requested. First resolve 030 and produce a clean successful CI run; this request does not authorize deployment/settings writes.
- Gate blocked: QC-POST-100-031 artifact promotion identity and FINAL release acceptance.