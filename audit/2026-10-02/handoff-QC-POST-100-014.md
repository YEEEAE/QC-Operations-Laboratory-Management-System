# QC-POST-100-014 — Nineteen-gate registry and trusted evidence intake

**State:** PARTIAL / BLOCKED_BY_OWNER_INPUT. The nineteen-gate registry and final release decision are not approved or verified.  
**Current source base:** clean `main` HEAD `b9310b87dccd4e03e0da6ce4bc9df88e06bd4983` at task start. Final source fingerprint and command evidence are in `.ci-results/QC-POST-100-014/`.  
**Prior handoff:** `f284dc38b6c5bda68ad6a28ff91a419f0f85c7bc` is historical to this run and was not reused.

## Source result

The signed provider intake now rejects a previously consumed signer/key/nonce, including concurrent requests with different digests. Migration `0045_provider_attestation_nonce_replay_guard.sql` creates an immutable nonce-claim side table, backfills claims from existing signed evidence metadata, and fails closed on invalid or duplicate historical nonces. The evidence append, nonce claim, and service audit event share one PostgreSQL transaction. Existing release evidence remains append-only.

The release page now preserves candidate/evidence provider failures as `UNAVAILABLE`, shows a safe refresh action, and disables approval. It no longer presents an evidence read failure as a missing candidate or empty risk/evidence result.

The current source has eight internal evidence classes. They are not the owner-approved canonical 19 gates. `hasReconciledProductionGateDecision` still returns `false`, so release approval remains denied. No authority was inferred from the 22 audit gates, and no provider/signer, freshness, scope, applicability, or digest policy was invented.

## Row-level DB and authorization scope

The provider intake reads and locks `qc.release_candidates` (`id`, identity fields, `version`); reads `qc.release_provider_nonce_claims` (`signer_id`, `signer_key_id`, `nonce`); reads the latest `qc.release_gate_evidence.evidence_version`; and appends `qc.release_gate_evidence`, `qc.release_provider_nonce_claims`, and `qc.audit_events` in one transaction. Its exact columns, constraints, indexes, constraints, and N/A boundaries are recorded in `scope-db-auth-manifest.json`.

Provider intake has no browser actor or `PERM-APR-APPROVE` grant. It is authorized by the configured signed-provider allowlist (`RELEASE_EVIDENCE_SIGNERS_JSON`), with key ID, HMAC signature, gate/environment scope, freshness and candidate identity checks. The allowlist is not owner-approved or verified in this task. The separate release approval action uses `PERM-APR-APPROVE` and existing Manager or named `yazeed`/`SYSTEM_OWNER` authority; that approval path is not enabled by this intake change.

`qc.outbox_events` is not written: the provider intake has no approved downstream event consumer, and the current generic worker marks unknown events processed. Creating an event without a consumer would not prove delivery. `qc.electronic_signatures`, `qc.release_approvals`, `qc.release_risk_evidence`, and `qc.idempotency_records` are not written by this provider intake use case. No production database was read or written.

Migration required for the explicit replay-denial contract: **YES**, a new forward-only migration was added. It preserves prior evidence rows and refuses invalid/duplicate historical nonce claims. PostgreSQL 18 upgrade, concurrency, rollback and zero-orphan proof remain BLOCKED by the unavailable container runtime; the migration was not applied to any database.

## Verification

- Candidate-bound Node 24.20.0 release-governance unit suite, including the read-outcome contract: fresh results are in `commands-and-results.json`.
- PostgreSQL 18 provider-ingestion integration, including replay, concurrent claim, audit atomicity, and unchanged state on denial: BLOCKED if the configured container runtime cannot start; see command result.
- Build/release identity and source fingerprint: see `candidate.json` and `commands-and-results.json`.
- Authenticated populated route, direct negative HTTP request, production provider configuration, manual AT and human UAT: NOT VERIFIED.

## Owner input needed to continue

Supply an authorized signed decision that names all 19 canonical gates, applicability and mandatory rules, exact links to the 22 report audit gates, evidence acceptance/recomputation rules, trusted producer/provider and signer/key custody, allowed environment/scope, freshness, version/replay rules, digest fields and candidate/schema binding. Also supply the authorized role/scope and any human sign-off decisions that belong to the assigned rows. Until then the overall decision is NO-GO and all 19 gate dispositions remain NOT VERIFIED.

Evidence package: `.ci-results/QC-POST-100-014/` (local, candidate-bound, ignored verification artifacts). This run did not commit, push, deploy, run a production migration, or alter provider settings.
