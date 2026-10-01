# QC-ENV26-03 — AI environment gates

**Finding:** QC-ENV-F-002  
**State:** PARTIAL — external AI processing remains disabled pending owner policy and production evidence  
**Page:** `/ai/advisory`  
**Position:** after QC-ADP26-14; original task identifiers preserved

## Candidate and evidence identity

| Item | Result |
|---|---|
| Frozen branch / HEAD before edits | `main` / `64c961bb96f7ee1cddeab978415e3a580e707353` |
| Initial working tree | clean; unstaged and staged diff fingerprints both SHA-256 empty `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| Final candidate SHA / dirty fingerprint | `.ci-results/run-context.json` (ignored local evidence, generated after tracked changes and workspace map are finalized) |
| Verification date | 2026-10-01 (Asia/Riyadh) |
| Render observation | `update_in_progress` at `6f12fecdd58acb89d6c0fceb5a8c20b33101b628`; last listed live SHA `831a0f4396e2ae6ea3766489be06012e2ff753ce`. Neither is attributed to this candidate or treated as a completed runtime. |

The environment comparison records 0/7 explicit AI variables present on the service out of seven local names: `AI_PRIMARY_PROVIDER`, `AI_FALLBACK_PROVIDER`, `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_BASE_URL`, `GEMINI_API_KEY`, `GEMINI_MODEL`. Presence/validity only was compared; values are not recorded. This is a historical API snapshot, not current runtime proof. The separately named `AI_EXTERNAL_PROCESSING_APPROVED` remains a false-by-default technical gate and is not an owner decision.

Evidence files were re-read and checksummed: `render-env-comparison.json` SHA-256 `929bcbfe143b6df39506c868a248997dd1c9e98c2e89ba92adfb224fc6579ce8`; `database-readonly.json` SHA-256 `d10223f4ab1a222bc21d1126a63573ef5f351dd2a63c3c54371f377aefe0fbc6`; source migration manifest SHA-256 `328c549688ad342c6df6246ea9187b98a211d4d04644e296ca71911e040b8955`. The manifest has 42 source migrations through `0042_immutable_lab_equipment_usage`; the read-only PostgreSQL 18.6/TLS snapshot reports 18 applied, 24 pending, and 18/18 aggregate applied checksum matches. The snapshot contains no per-row applied checksums for independent recomputation. No business rows were read.

## Changed

- `/ai/advisory` now reports provider selection defaults and actual key/model presence independently of approval/policy gates, invalid configuration, owner approval absent, invalid/missing policy, and provider outage. Only variable names can appear in configuration errors; credentials, values, and endpoints are not exposed.
- Provider defaults are described as selection preferences. They do not establish credentials, provider reachability, policy approval, or authorization to send.
- Request submission is disabled in the UI until an approved policy and configured provider are present. Server-side checks remain authoritative: owner approval, complete policy, permitted data class, and fresh per-request consent are required before provider availability/completion. Existing authz and mode permission checks remain in the use case.
- System health remains the source for database schema readiness, distinct from AI provider availability. No AI action can approve/sign/release or write controlled data.
- No migration, database, external setting, Render deploy, or provider call was performed.

## Evidence

| Check | State | Evidence / limits |
|---|---|---|
| Seven-variable parity snapshot | HISTORICAL / 0 of 7 | Names/presence only in `env-parity/render-env-comparison.json`; deployment was in progress. |
| Source migration names/checksums | PASS | 42-row `env-parity/source-migration-manifest.tsv`; no historical migration changed. |
| Applied migration ledger | HISTORICAL / PARTIAL | `env-parity/database-readonly.json`: PG 18.6, TLS, read-only catalog/ledger, 18/42 applied, aggregate 18/18 matching; no per-row checksum export. |
| Isolated PostgreSQL ledger/constraints | BLOCKED | `tests/integration/database/migrations.test.ts`: 5 cases skipped; setup failed because Testcontainers could not find a working container runtime. No DB endpoint was used. |
| AI configuration/provider contracts and synthetic evaluation | PASS / environment-qualified | Focused AI suite: 5 files, 93/93 PASS, including synthetic evaluation/security tests. No live provider call. Node 22.22.3 is below the repository minimum 24.20.0. |
| Build | PASS / environment-qualified | `pnpm run build` completed and generated a dirty local artifact for frozen HEAD `64c961bb`; Node 22.22.3 is unsupported by the project engine contract. Build warnings are existing dependency/bundle warnings. |
| Typecheck | FAIL / unrelated | `astro check`: 1 error at `src/pages/quality/findings/index.astro:35` (`Date.formatDate` is not defined on `Date`); no diagnostic was reported in changed AI files. Existing project history records the same unrelated error. Node 22.22.3 is below the supported engine range. |
| Authenticated browser, keyboard, 320/375/768/1440 and 200% review | NOT VERIFIED | No authenticated current-candidate session was available. |
| Client/log secret exposure | PASS (focused contract) | Existing AI security contract plus new availability contract passed. Configuration diagnostics expose variable names only; provider credentials and endpoint values are not returned by page availability. The approved policy details are shown only when a valid policy and configured provider exist. |

## Acceptance status and owner decision

**Acceptance remains open.** Missing configuration, invalid configuration, disabled policy, and provider outage have separate presentation/recovery paths. Schema readiness remains separately reported through `/system/health`. Synthetic tests can prove fail-closed behavior only; they do not establish safe or approved AI processing.

The authorized owner must decide and document the approved provider/model, use scope and data classes, minimization, retention/deletion and incident terms, processing location, privacy/QMS review, human-review ownership, consent language/version, and evaluation acceptance. Until then, do not set the technical approval flag true or send user content. After that decision, the authorized operator must configure the approved provider, run candidate-bound synthetic evaluation and refusal/denial/outage checks, and obtain the separately required completed-runtime and human route acceptance evidence. 7/7 variable presence would not mean 100% AI safety, release readiness, or UAT acceptance.

No secret values, credential-bearing URLs, provider prompts, production business rows, production writes/migrations, commit, push, merge, deploy, or external setting changes were made.
