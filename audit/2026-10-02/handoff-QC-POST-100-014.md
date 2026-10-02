# QC-POST-100-014 — Release gate reconciliation

**Trace:** QC-PAGE-F-032 · `/governance/releases/[releaseId]`  
**State:** PARTIAL / BLOCKED on the authoritative 19-gate mapping.  
**Review base:** clean `main` HEAD `f284dc38b6c5bda68ad6a28ff91a419f0f85c7bc`; requested audit candidate `6059e177438d8ae110c99084d32758b048f22cd2` is historical and is not current source.

## Finding

The approved business rule BR-GEN-020 and requirement REQ-READY-003 require server-owned release gate truth, exact-candidate evidence, trusted signed provider evidence, and an approved 19-gate register before approval. They do not define the authoritative 19 gate identifiers, the gate-to-requirement mapping, accepted evidence/provider per gate, signer/key ownership, or digest contract. The readiness checklist is a set of sections and control questions; it is not an owner-approved machine-readable 19-gate register.

The current release module has eight internal evidence classes (`ci`, `security`, `database`, `e2e`, `uat`, `signatures`, `criticalRisks`, `residualRisk`). `deriveReleaseEvidence` binds eligible evidence to release ID, SHA, build, application version, migration head, UAT cycle, release/evidence versions and observation time. Signed provider records require digests, signer/key IDs, gate scope and approval metadata. These technical checks do not define or satisfy the absent 19-gate policy.

Production approval remains fail-closed: `ApproveReleaseUseCase` recomputes the eight-class snapshot server-side and denies unless `hasReconciledProductionGateDecision` succeeds. The Postgres implementation currently returns `false` unconditionally because there is no approved 19-gate register/schema mapping. The approval page states NO-GO and disables approval for the same reason. This preserves existing owner/scientific/signature decisions.

An older reconciliation report (2026-09-23, SHA `5d591afc29c04d66f1c0a80b9cd24d5accb71527`) likewise documented that only UAT had a controlled writer and that no approved 19-gate register or authenticated CI/security/database/E2E intake existed at that time. It is historical evidence only; the current source was rechecked independently.

## Disposition

No mapping or new provider/signer trust policy was created. The unresolved dependency is an authorized Release Governance decision that supplies, at minimum:

1. The canonical 19 gate IDs and their mandatory/applicable status rules.
2. Each gate's controlled requirement IDs and evidence acceptance/recompute rule.
3. The trusted producer/provider, signer identity and key custody/rotation authority, allowed environment/scope, and immutable reference/digest contract for each gate.
4. Approved freshness, versioning and replay semantics, including the binding to SHA, build, schema/migration head, scope and release identity.

After that decision is supplied, implement a server-owned immutable register and recomputation path; validate tamper, stale/wrong SHA, wrong scope and replay denials; exercise trusted intake and every gate disposition; prove approval stays blocked until all required evidence is current and passing. PostgreSQL 18 and authenticated route acceptance remain separate proof requirements. No human UAT is inferred.

## Candidate-bound verification

The fresh candidate-bound unit/build/release-identity evidence is recorded in ignored `.ci-results/QC-POST-100-014.json`. It identifies the final worktree fingerprint; it is not a production release or 19-gate acceptance record. Local evidence was executed with Node 24.20.0. No production database, migration, provider, deployment, commit, or push was used.
