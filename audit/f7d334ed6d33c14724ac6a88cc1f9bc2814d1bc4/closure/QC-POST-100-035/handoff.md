# QC-POST-100-035 — restore-intent reconciliation

**Status: PARTIAL / EVIDENCE_PENDING.** This is a source-level completion of the locally addressable gap, not task closure or restore acceptance.

## Candidate and pre-existing work

- Git HEAD: `f7d334ed6d33c14724ac6a88cc1f9bc2814d1bc4` (`main`).
- Candidate identity and complete dirty-tree fingerprint: `.ci-results/run-context.json`; current candidate-bound reports: `.ci-results/unit.json`, `.ci-results/integration.json`, `.ci-results/build.json`.
- The working tree was already dirty before this task, including Mind and document-approval changes. Those changes were preserved. No commit, push, deployment, migration, production write, or restore was performed.
- Runtime for task-bound checks: Node `v24.20.0`; source migration head `0045_provider_attestation_nonce_replay_guard.sql`. No schema migration was needed.

## Reconciliation

The source already had an Astro native POST fallback and JavaScript enhancement routed to `RequestRestoreUseCase`, and source already wrote PLANNED intent, reason, audit and outbox transactionally. The older QC-ADP26-21 handoff on candidate `9e6b721fe36c772f64b0586ed42de583f5a54f5b` is historical, not current runtime proof. On this current candidate, the residual implementation gap was that neither transport submitted an opened backup snapshot nor shared a stable idempotency key across native and enhanced submissions.

The form now sends an opaque SHA-256 expected snapshot and one per-form UUID idempotency key. Server code checks active explicit restore permission and GLOBAL scope, validates reason/backup policy and expected snapshot, then the repository rechecks the same snapshot and eligibility while holding the backup row lock before writing the intent/audit/outbox. The checksum value stays inside infrastructure; only its opaque digest contributes to the snapshot token. Same-key/same-command retry resolves to the existing row; reused keys with changed command content are denied. A successful native POST redirects to backup history, which renders the saved intent's own `Planned` state. Production requests remain denied; no provider executor was added.

## Data / authorization boundary

Canonical current source schema remains migration head `0045_provider_attestation_nonce_replay_guard.sql`. Relevant existing schema sources are `0014_backup_recovery_metadata.sql` and `0044_restore_request_idempotency.sql`. `backup_runs` has no version column; no synthetic integer or migration was introduced. The expected version is a safe optimistic snapshot token over fields already projected by the catalog and the checksum-derived opaque digest. Transaction writes remain `restore_runs`, `audit_events`, and `outbox_events`; reads/lock use `backup_runs`, and replay lookup uses `restore_runs`. Details are in `scope-db-auth-manifest.json`.

## Evidence and residuals

- Current candidate-bound focused tests: `39/39 PASS`, `0` skipped (`.ci-results/unit.json`). They cover valid planned intent, missing permission, wrong scope, invalid backup/reason, stale expected snapshot, changed-command replay, intent-only state, native POST and enhanced POST token wiring, and reload copy.
- Formatting, focused lint, diff check: PASS.
- Astro typecheck: `0 errors`, `0 warnings`, `114 hints`. Build: PASS; local artifact SHA-256 `ed8b8f2ef6174e65c7fa2f72572fcbf44d04dcfd80f5144971a16da84253c6bb`; local release identity `rel-9a65e6c60e89574a` (not deployed identity).
- Architecture check: FAIL on an unrelated, unchanged delivery-domain import at `src/pages/laboratory/tests/[labTestId]/execute.astro:265`.
- PostgreSQL 18: BLOCKED before setup because Testcontainers could not find a working container runtime. All eight PostgreSQL transaction/race/rollback tests were skipped; this is not PASS. Authenticated browser/no-JS route traces, assistive technology, human UAT, actual provider restore and provider operator identity remain NOT VERIFIED.
- No evidence was registered as an accepted row in the coverage matrix. QC-PAGE-F-021 remains OPEN/PARTIAL until database and applicable route evidence are reviewed. No claim that any actual recovery occurred.

See `candidate.json`, `criteria.json`, and `commands-and-results.json` for bounded task evidence and explicit non-claims.
