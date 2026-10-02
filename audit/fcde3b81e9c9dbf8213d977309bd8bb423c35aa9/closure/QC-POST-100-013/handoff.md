# QC-POST-100-013 — current candidate reconciliation

**Classification: PARTIAL / OPEN.** No implementation gap was reproduced that justifies changing source. Preserve the existing login implementation. The previous handoff `audit/2026-10-02/handoff-QC-ADP26-34.md` is HISTORICAL to `5e31667978d063e4f07accb80f8de868d3a6e538`; this packet records checks against current HEAD `fcde3b81e9c9dbf8213d977309bd8bb423c35aa9`.

## Current source observed

- `/login` keeps native `POST` to `actions.login`; JS enhances it with a one-time submit guard, disabled submit control and polite pending status. `username` and `current-password` autocomplete remain.
- The login Action obtains the retry duration from the server-side limiter decision; it does not accept a client-supplied wait duration. Failure logs omit identity/password values.
- Session recovery copy differentiates ended sessions, changed passwords and unavailable accounts; safe return paths are constrained.
- Credential-change/session-revoke/audit atomicity is a separate persistent path; the present run did not prove its PostgreSQL transaction behavior.
- No schema or migration change was needed. Source migration head is `0045_provider_attestation_nonce_replay_guard.sql`; no production migration was run.

## Candidate-bound evidence

- `candidate.json` binds this packet to clean tracked HEAD, empty-tree fingerprint, Node `v24.20.0`, migration head and built entry SHA.
- `commands-and-results.json` records exact commands, exits and counts. Focused recovery tests pass 8/8; pure rate-limit/policy tests pass 10/10 with one PostgreSQL test filtered (not counted as passing); built-login Playwright passes 4/4.
- The complete rate-limit + account test attempt reports 13 passed, 1 skipped, but its PostgreSQL suite failed during setup because Testcontainers could not find a container runtime. This is BLOCKED, not PASS.
- Follow-up environment probe: Docker CLI is installed but its daemon socket is absent; local loopback PostgreSQL is 16.9, and `QC_TEST_DATABASE_URL`/`DATABASE_URL` are unset. No PG16 substitution or database writes were attempted.
- `pnpm release:verify` was also attempted after adding this packet and the Mind entry; it failed because the available release identity was generated for the earlier clean tree. This is a candidate-evidence mismatch, not a passing release check. The build/test source files at the recorded HEAD were not changed.
- Browser checks do not establish genuine configured throttling, a delayed/interrupted network, password-manager behavior, authenticated session expiry, fixture-persona behavior or manual AT/UAT.

## Still open / blocked

- Real server throttle response and displayed retry duration; delayed timeout/interruption and retry behavior.
- Session-expired browser recovery and focus; actual password manager behavior; authenticated fixtures/persona matrix.
- PostgreSQL 18.6 failure-injection/race proof for credential update + session revocation + secret-free audit, plus expired-session write denial/reconciliation.
- Fresh build/release identity bound to the final documentation-inclusive dirty fingerprint; current release verification is not valid for the final workspace state.
- Manual keyboard/screen reader and human UAT, plus required independent review of the evidence matrix.

No source repair, production access, migration, commit, push or deployment was performed. Completion remains OPEN until applicable acceptance artifacts are current and reviewed.
