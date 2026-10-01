# QC-ENV26-02 — release identity and runtime configuration

**Finding:** QC-ENV-F-001  
**State:** PARTIAL — production acceptance remains open  
**Pages:** `/system/health`, `/governance/releases/[releaseId]`

## Candidate freeze and evidence

| Item | Result |
|---|---|
| Frozen branch / HEAD before edits | `main` / `7a9f86ce75d136d832e677bacb6845de420f1db4` |
| Initial dirty fingerprint | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (clean at freeze) |
| Final local verification fingerprint | `sourceFingerprint` in `.ci-results/run-context.json`; generated after the handoff and workspace map were finalized. The run context is ignored local evidence. |
| Verification date | 2026-10-01 (Asia/Riyadh) |
| Runtime contract | Project requires Node `>=24.20.0 <25`; available shell Node was `22.22.3`, so build/test evidence is environment-qualified. Bundled Node `24.19.0` also falls below the project minimum. |

No complete Render runtime snapshot was available. The refined snapshot `audit/2026-10-01/env-parity/render-env-comparison.json` still records latest deploy `update_in_progress` at SHA `6f12fecdd58acb89d6c0fceb5a8c20b33101b628`; last listed live deploy is SHA `831a0f4396e2ae6ea3766489be06012e2ff753ce`. Neither is attributed to this frozen HEAD or to a completed deployment. Snapshot SHA-256 values were rechecked: `database-readonly.json` `d10223f4ab1a222bc21d1126a63573ef5f351dd2a63c3c54371f377aefe0fbc6`; `render-env-comparison.json` `929bcbfe143b6df39506c868a248997dd1c9e98c2e89ba92adfb224fc6579ce8`; source manifest `328c549688ad342c6df6246ea9187b98a211d4d04644e296ca71911e040b8955`. The 42 manifest rows and checksums still match the 42 current source migration files.

## Changed

- The six public release identity values now come from generated `dist/release-identity.json`, not browser input or manually configured `RELEASE_*` environment variables. The build records Git HEAD, platform-derived build ID/environment, build timestamp, highest source migration and checksum, and SHA-256 of the actual server entrypoint. Runtime recomputes the entrypoint SHA-256 and cross-checks Render `RENDER_GIT_COMMIT` and `SERVICE_VERSION`; any missing, invalid, mismatched or stale artifact/runtime pairing fails closed. `SERVICE_VERSION` alone cannot verify an identity.
- Render build generation runs as part of the existing build command. Removed six manual release identity env declarations; kept the existing core runtime configuration unchanged (the dated addendum's 5/5 remains intact).
- `/system/health` now shows six per-field sources and statuses, a scoped numerator/denominator/date, dirty/clean state, and safe recovery guidance. AI policy-disabled, invalid policy/configuration, missing configuration and provider outage are distinct safe states. Database/provider and Reject Reports schema readiness remain separate. The release identity API keeps existing auth guards and ignores query/body values.
- Release approval capability and server action now fail closed unless the current clean production runtime has a fresh six-field identity that matches the exact candidate's SHA/build/version/migration. Existing named-owner authority, permissions, scope, state, reauthentication, and signature guards remain in force.
- No historical migration, database schema, production database, or live Render setting was changed.

## Evidence

| Check | Result | Evidence / limitation |
|---|---|---|
| Six identity provenance sources | PASS | All six map to server artifact or platform/source-of-truth metadata; ad-hoc identity env vars are ignored. Unit covers absent artifact, malformed fields, runtime artifact mismatch, Render SHA mismatch, service version alone, dirty local vs dirty production. |
| Local build artifact and actual runtime entry | PASS / environment-qualified | `dist/release-identity.json` was generated; local runtime recomputed the SHA-256 of `dist/server/entry.mjs` and returned 6/6 `VERIFIED`. Build identity has `environment=local`, `workingTree=dirty`; not production evidence. Exact artifact values remain in the ignored local artifact file. |
| Focused tests | PASS | 8 files / 75 tests, including HTTP auth denial, browser/manual override rejection, AI synthetic disabled/malformed/missing/provider-outage states, release approval rejection for missing/mismatched/stale identity, and manifest binding. No real provider call or data send. |
| Build | PASS / environment-qualified | `pnpm run build` completed and wrote identity artifact; Node 22.22.3 violates repository Node minimum 24.20.0. Output contains existing bundler/dependency warnings. |
| Typecheck | FAIL / unrelated | After correcting the new artifact guard and nullable test assertion, Astro check reports one remaining error outside this diff: `src/pages/quality/findings/index.astro:35` calls missing `Date.formatDate`; 113 hints. |
| Source migration ledger | PASS | Manifest includes all 42 current migration source names/checksums; head `0042_immutable_lab_equipment_usage` with checksum in the manifest. No historical migration was edited. |
| Provider applied ledger | PARTIAL / HISTORICAL | The read-only snapshot reports PostgreSQL 18.6, TLS, 18/42 applied, 24 pending, 18/18 aggregate checksum match; no per-row applied checksums are included for independent recalculation. No business rows were read. |
| Isolated PostgreSQL migration/constraint tests | BLOCKED | Fresh Testcontainers run failed before setup: no working container runtime; 12 tests skipped. No production connection, write, or migration was attempted. |
| Render runtime identity | NOT VERIFIED | No current completed-deploy/runtime read; the only snapshot's deployment was in progress. |
| Browser/accessibility viewport review | NOT VERIFIED | No authenticated browser session was available to inspect the protected page at 320/375/768/1440 and 200%. Tables retain captions/headers and horizontal overflow handling; this is not a substitute for viewport/AT evidence. |
| Core environment settings | PASS / unchanged | Addendum records its existing core group as 5/5. No setting was duplicated or changed to copy another environment. Names and safe presence/validity only; no values, credentials, or credential URLs disclosed. |

## Acceptance and owner decision

Identity source contract: **6/6 mapped and locally verified against one dirty candidate artifact/runtime pair**. Overall finding remains **PARTIAL** because production runtime is NOT VERIFIED and the local artifact is dirty. The task's original 0% score is not a product-quality grade; no 100% acceptance or GO claim is made.

Still open: produce a clean candidate artifact on the required Node version; obtain a completed Render runtime identity that matches its artifact SHA and platform commit; independently export/reconcile every applied database migration checksum on a disposable PostgreSQL 18.x database; inspect the protected pages with authenticated browser and accessibility checks at required viewports.

**Named owner decision required:** a named release owner must identify the exact candidate and confirm whether production evidence collection is authorized. This handoff grants no release approval, AI processing authorization, UAT acceptance, production migration, Render setting change, or deployment permission. Existing named-owner guards, permissions, scope, candidate state, and signature requirements remain in force.

No secret values, API keys, passwords, credential-bearing URLs, production business records, production writes/migrations, commit, push, merge, or deploy were performed.
