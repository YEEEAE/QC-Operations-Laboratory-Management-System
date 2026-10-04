# QC-POST-100-010 — PARTIAL / EVIDENCE_PENDING

Candidate inspected: `275ab3c8bcd545c5720f54c7041cdd7e3226cd68`. Fresh collection: 2026-10-04. No production write, migration, grant, deployment, commit or push performed. Secret values were not exported.

## Verified collection

- Isolated PostgreSQL 18.6 with verified local TLS, Node 24.20.0: preflight, 45 forward migrations and schema integrity all exit 0; 86 tables, zero orphans. Cluster stopped and removed. This is not a rollback/restore drill or production acceptance.
- Canonical local DATABASE_URL: connection uses project TLS policy; server-enforced default_transaction_read_only and BEGIN READ ONLY, bounded statement timeout; rolled back. Applied ledger: 18 migrations through 0018, 27 pending, zero exact applied name/checksum mismatches; 63 observed tables.
- Schema column digest in database-current.json covers ordered information_schema column metadata only, not full DDL or an owner-approved schema identity. Query-role observations do not establish the application's runtime credential binding.
- Live document identities registry: zero rows returned. Controlled-source registration cannot be established; newer source-binding schema migrations are pending. D0.2 presence on disk does not mean application registration.
- Render GET read-back: deployment dep-db0h06ivcj2c7399tiig is live at SHA 435f9f704049dee4916223b24b96866d7fa9af2e, not the candidate. Runtime configuration, commands and environment key presence/comparison are recorded in provider-current.json. Secret comparisons and values excluded. Local configuration is a comparison point, not approved production authority.
- Both /api/health/live and /api/health/ready returned HTTP 404 at the provider-reported URL. Readiness is NOT VERIFIED; this is an endpoint observation, not proof the whole service is unavailable.
- Recursively inventoried both canonical folders: D0.2 30 SOP PDFs and 68 WI DOCX; 117/117 manifest hashes match, 84 operational originals present. Draft/proposal/blank-form/source-integrity classifications only; no signature, approval, effectivity or UAT inferred. No fresh rendering acceptance claimed.

## NEW_RESIDUAL_FINDING — RF-010-CURRENT-PARITY

Bound to 010 and FINAL, not reopening historical closure: candidate/deployed SHA mismatch, 27 pending migrations, readiness endpoints 404, and empty document registry prevent acceptance. Provider runtime reports rust, healthCheckPath is empty and startup includes access:grant-system-owner; commands were observed, never executed. Actual Node runtime, full artifact digest, approved schema digest, complete effective environment contract and runtime-to-DB binding remain NOT VERIFIED. Zero applied checksum mismatches is not zero overall parity mismatches.

## Dependencies

030 continuation completeness exit 1 and 031 handoff remain blocking; neither is a successful exact-current-candidate immutable artifact acceptance packet. No passing artifact or owner approval was manufactured. Historical collection.json is preserved separately from fresh read-backs.

## MISSING INPUT REQUEST

- Exact missing item: passing exact-candidate 030/031 CI/full-artifact evidence and owner-approved artifact/schema/runtime/environment comparison baseline, plus read-only provider runtime attestation establishing actual Node, complete artifact digest and service-to-database binding.
- Why required: repository defaults, provider configuration, database query role and draft documents cannot establish deployed byte identity or approved operational parity.
- Paths searched: current HEAD/tree, repository scripts and Documents, recursively Documents/QC_System_WI_SOP_Pack and QC_Controlled_Forms_and_Operational_Evidence, application Documents source and authorized live registry, audit/2026-10-04/QC-POST-100-031 and .ci-results/QC-POST-100-030-continuation, prior 010 packet; fresh provider and canonical database reads.
- Existing evidence: verified draft hashes, local rehearsal, fresh provider deployment/configuration and read-only ledger/schema/registry observations.
- Why insufficient: deployed SHA differs; 27 migrations pending; readiness is 404; full artifact/runtime identity and approved baselines absent; dependencies not passing.
- Minimum additional input: exact approval/attestation references and successful candidate-bound CI artifact, not underlying SOP/WI/forms or secret values. Remediation of production drift requires separate explicit authorization with target and scope; this collection request does not authorize it.
- Gate blocked: QC-POST-100-010 and FINAL; dependent 030/031 acceptance remains open.

## Limits

Full rollback/restore rehearsal, complete DDL digest, runtime process inspection, authenticated health, trusted signatures and owner approval NOT VERIFIED. Full project-skill reading requirement was not completed (379 discovered skill files); relevant database/verification guidance was read. No release gate is marked closed.