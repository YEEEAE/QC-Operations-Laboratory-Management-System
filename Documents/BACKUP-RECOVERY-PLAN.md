# Backup and Recovery Plan — NDB-12 operator draft

**Status: DRAFT / NOT OPERATIONALLY VERIFIED.** This document defines a source contract and operator-controlled procedure. It does not approve a schedule, retention duration, recovery objective, provider capability, or production restore.

## Scope and recovery boundary

A recoverable QC set has two independently verifiable parts:

1. A PostgreSQL logical archive, its exact database/schema and release provenance, and an immutable manifest.
2. The detached private object-store artifacts referenced by `qc.files`, with their exact identities, byte sizes, and SHA-256 digests. Controlled document version snapshots must retain the document number/type, version id, WI revision, recorded state, content digest, and referenced file ids.

A database dump alone does not restore or verify QC evidence attachments. The current application file store and the backup R2 store are distinct boundaries. No file-store backup adapter or cross-environment object copy is approved or wired by this plan; until one is implemented and separately rehearsed, a backup set with detached files is incomplete.

## Evidence states

Keep these states separate in the catalog, manifest, and operator record:

- `REQUESTED` / `RUNNING`: backup intent or active job.
- `CREATED`: the database archive was written to the configured artifact store. This is not integrity verification.
- `ARTIFACT_VERIFIED`: stored bytes were read back and matched the recorded size and SHA-256. This says nothing about a successful database restore or file-store completeness.
- `RESTORE_VERIFIED`: a named operator completed an isolated restore, validated the database and separately restored objects, and recorded the independent verification outcome. A successful backup or artifact checksum never sets this state.
- `PRODUCTION_RESTORE`: remains blocked. A request-only POST may record `PLANNED` intent; GET paths and backup scripts do not execute a restore.

The current `recovery:backup:daily` source path stores a logical dump and a SHA-256-protected version 2 sidecar in R2. It captures the schema checksum, migration ledger, active `qc.files` metadata, and document-version snapshots from the direct source database. It does not persist an application catalog row, identify the actual file-store account/bucket, copy detached QC file bytes, or prove private access/encryption/isolation. The generated manifest therefore carries known gaps and the command exits nonzero; treat its output as a candidate archive only, not a complete QC recovery set.

## Manifest contract

The controlled recovery manifest (version 2) must be stored beside the archive in the private artifact store and contain, at minimum:

- A 40-character Git commit SHA, release/build identity, exact migration head, and the ordered migration ledger with each source checksum.
- PostgreSQL version, a SHA-256 of the schema-only export, archive byte size and SHA-256, creation timestamps, and the artifact-integrity outcome.
- File-store identity and a record for every QC file: immutable file id, provider identity, storage key, byte size, and source SHA-256. Each entry must identify the detached recovery artifact that contains its bytes. Do not put object contents or credentials in the manifest.
- The captured controlled document/WI identity and version: document number/type, exact revision, state at capture, content digest, and associated immutable file ids/digests. Do not infer approval or effectivity from a captured state.
- `restoreVerificationStatus: NOT_VERIFIED` at creation. Only a separate restore evidence record can change the restore outcome.
- Known gaps, including any file-store objects not copied, unknown encryption/access configuration, or unverified provenance.

Manifest v1 is historical/legacy and cannot establish schema checksum or detached file-store completeness. The recovery validator marks this gap; it must never be upgraded by assertion alone.

## Connections and environment isolation

- Astro SSR uses the profile-bound pooled `DATABASE_URL` for ordinary application traffic. Future controlled `pg_dump`/`pg_restore` maintenance uses only the operator-held direct `DATABASE_URL_UNPOOLED` in a non-web process. The credential value must never enter source, docs, browser input, command arguments, logs, or artifacts.
- `NEON_BRANCH` is only a configured label. Resolve and confirm the actual source and isolated target identities through the approved operator procedure before any future operation; do not treat a matching label as provider attestation.
- The source/target environment, database identity, profile-specific private file-store identity, and artifact bucket must be distinct and recorded. Fail closed on unknown or matching source/target identities. Never accept a target from a browser or arbitrary request field as connection configuration.
- Keep production restore unavailable until the owner approves numeric RPO/RTO, names the emergency release authority, approves the recovery ceremony and isolation controls, and defines a separate verification outcome. Existing `PRODUCTION` restore requests remain denied by server policy. No permission label, e-signature record, or backup run is sufficient alone.

## Operator procedure: logical backup and verification

1. Obtain an approved change/incident reference and identify the source profile, branch, database, release SHA, current migration head, and exact file-store identity without placing credentials in the evidence.
2. Use a controlled operator host and the direct non-pooled connection. Never run this procedure from an Astro request handler, browser session, arbitrary GET route, or web worker.
3. Capture the logical archive and schema-only checksum. Read the applied migration ledger from that same source and compare its head with the release metadata; stop on mismatch.
4. Enumerate the complete `qc.files` inventory and controlled document-version bindings. Copy every referenced object to a detached, private, encrypted recovery location with a profile-specific identity. Preserve original immutable file id/provider/key/digest metadata in the manifest. Do not silently write restored objects into another environment's active file store.
5. Read back the database archive and detached objects. Verify byte size and SHA-256 against the captured manifest. Record `CREATED` separately from `ARTIFACT_VERIFIED`; failures remain failures or unverified gaps.
6. Store the immutable manifest and artifacts under restricted operator access. Record the artifact references without credentials or customer file contents in logs.
7. Reconcile the artifact against a separate isolated restore rehearsal using `Documents/RESTORE-DRILL-RUNBOOK.md`. A backup's artifact verification cannot stand in for that outcome.

## Optional Neon-native branch recovery / PITR

An operator may consider a provider-native point-in-time branch as an alternative recovery source only after checking current account/project configuration, the exact branch, applicable plan/settings, provider retention limits, eligible recovery timestamp, and the provider's current operation result. Record the provider reference, source identity, requested point in time, and resulting isolated branch identity.

This is an optional operator procedure, not an asserted capability or fixed recovery window. This repository does not infer retention from a branch label, plan name, past provider observation, or a successful API connection. A provider-created branch is an isolated recovery input; it still requires database, file-store, authorization, security, and controlled-evidence verification. Do not promote it to production automatically.

## Retention and expiration control

Retention duration and legal/QMS holds require owner approval. Maintain an operator inventory with approval reference, creation time, environment, artifact/manifest digests, detached object references, hold status, and proposed expiry. The code may calculate review candidates only. Expiration must be reviewed and executed manually through the separately approved provider/storage process; this repository does not delete backup artifacts automatically. Never expire the only known recovery set or any set under hold.

## Governed recovery policy (OPS-01)

Recovery objectives are stored as versioned policy records, not constants:

- `qc.recovery_policy_versions` holds the RPO, RTO, retention duration, immutable copy count, responsible person, exact policy source (type, reference, revision, SHA-256), effective window, status and internal approval reference. A new version is always `PENDING_APPROVAL`; the platform supplies no value and no default.
- A backup administrator transcribes an approved source into a pending version. The named system owner approves it with an explicit internal approval reference (signatures remain deferred) after the source and every objective are present. Self-approval and incomplete versions are refused. Approval supersedes the previously approved version; an approved version past its end date is reported as expired and is not treated as current.
- `qc.recovery_policy_events` is append-only and records the draft/approval/rejection/supersession snapshot and digest.
- Service-level evidence is derived at read time, never stored as an objective: latest backup and age, artifact checksum presence and verification, last verified drill and its outcome, observed restore time, and unresolved exceptions. RPO/RTO comparisons use only the approved values; where a value is absent the comparison is not made.
- Readiness states are explicit: `NOT_CONFIGURED` (no approved policy in force), `POLICY_EXPIRED`, `BACKUP_MISSING`, `BACKUP_NOT_VERIFIED`, `BACKUP_OUTSIDE_RPO`, `BACKUP_VERIFIED`, `RESTORE_NOT_VERIFIED`, `RESTORE_OUTSIDE_RTO` and `WITHIN_OBJECTIVE`. A verified backup artifact is never reported as a verified restore.
- `qc.recovery_incidents` is append-only. An incident observation is `OPEN`; closure is a separate `RESOLVED` record that references the original. Open incidents are the unresolved exceptions shown in the readiness panel. Observed RPO/RTO are computed from recorded incident timestamps, not asserted.
- `qc.recovery_storage_boundaries` records one non-secret boundary label per environment (store kind, isolation state, verification, cross-environment read policy). Bucket names, keys, endpoints and credentials are never stored or rendered. Cross-environment object write is refused by constraint.

## Controlled recovery execution boundary

- A restore request remains a `PLANNED` intent. Planning, approval, verification and execution are separate states.
- `qc.recovery_procedure_authorizations` is a separate, environment-scoped approval of an actual recovery procedure. There is no creation route in this baseline, so the table is empty and the controlled runner refuses every request with `RECOVERY_PROCEDURE_NOT_APPROVED`; production is prohibited independently.
- The runner port accepts an intent and returns only `BLOCKED`/`NOT_AVAILABLE`. No adapter connects to a provider, runs `pg_restore`, or writes a receipt. Holding `PERM-BKP-RESTORE-PRODUCTION` never authorizes execution.

## Current blockers

- RPO/RTO and retention durations are not approved; no policy version has been recorded.
- No named emergency release authority or approved production recovery ceremony is configured.
- No current provider retention/PITR attestation is recorded; no recovery window is asserted here.
- R2 credentials, private-bucket policy, encryption configuration, cross-environment isolation, and object-store durability are owner/provider configuration and remain unverified.
- No runtime consumer currently copies and verifies the application's detached QC file objects into the backup set, and backup catalog persistence is not wired.
- No current full recovery set or isolated rehearsal is established by this source edit.
