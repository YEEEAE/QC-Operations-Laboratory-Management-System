# QC-ENV26-04 — storage, backup, and monitoring integration

**Task:** QC-ENV26-04  
**Finding:** QC-ENV-F-003  
**Position:** after QC-ADP26-14; original task identifiers preserved  
**Pages:** `/system/backups`, `/system/health`, `/documents`  
**State:** PARTIAL — source contract clarified; durable provider selection and integration acceptance remain open

## Candidate and evidence identity

| Item | Result |
|---|---|
| Frozen branch / HEAD before edits | `main` / `c493d87e0399af6b39c1add55ade07876dc4ceb8` |
| Initial tree | Clean; source fingerprint `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| Final source fingerprint | See `sourceFingerprint` in `.ci-results/run-context.json` after final workspace-map generation and focused verification. |
| Verification date | 2026-10-01 (Asia/Riyadh) |
| Runtime | Host Node `22.22.3`; project contract is `>=24.20.0 <25`. Focused test output is environment-qualified. |
| Render observation | Historical env snapshot: latest deploy `update_in_progress` at `6f12fecdd58acb89d6c0fceb5a8c20b33101b628`; last listed live deploy `831a0f4396e2ae6ea3766489be06012e2ff753ce`. Neither is attributed to this frozen HEAD or treated as completed runtime evidence. |

## Contract decision

| Integration | Decision | Basis and scope |
|---|---|---|
| Cloudflare R2 variables (4) | **OPTIONAL provider selection; durable backup outcome remains NOT VERIFIED** | The typed config allows all four values absent and rejects a partial set. The daily backup script requires all four and directly constructs the R2 adapter. The application catalog does not wire that job; `LocalArtifactStore` keeps bytes in process memory and is not a durable server fallback. No scheduled job or restore orchestrator is present. R2 itself is not required by source policy; a durable backup provider/plan must be selected by the owner before recovery can be claimed. |
| OTEL variables (2) | **OPTIONAL / no-op by default; export NOT IMPLEMENTED** | Config requires endpoint and headers together and allows both absent. Runtime exposes endpoint and a boolean header-presence flag, but `src/shared/observability/telemetry.ts` leaves tracer and meter as no-op unless code installs providers. No exporter is installed. Setting the pair alone would not enable telemetry. |

R2/OTEL absence is not folded into required database readiness. Neither integration is marked `N/A`: both have source adapters/contracts and need an owner decision on whether the capability is required. No service/resource creation, secret entry, provider call, or external setting change was performed.

## Environment evidence

Names and presence/syntax only; no values, credential URLs, or secret material are recorded.

| Name group | Service snapshot | Local `.env` | Contract result |
|---|---:|---:|---|
| `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | 0/4 present | 0/4 present | Partial config rejects; all absent is accepted. Credential/provider validity cannot be assessed without an approved isolated target. |
| `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_HEADERS` | 0/2 present | 0/2 present | Endpoint-only and headers-only reject; pair accepted syntactically. Backend reachability/export is NOT VERIFIED and no exporter exists. |

Local presence was checked without printing values. The Render comparison came from `audit/2026-10-01/env-parity/render-env-comparison.json`; its SHA-256 remains `929bcbfe143b6df39506c868a248997dd1c9e98c2e89ba92adfb224fc6579ce8`. The snapshot records a deployment in progress. It is a historical configuration observation, not evidence of the current completed runtime.

## Source and database evidence

- `src/config/env.ts` validates endpoint URL and non-empty headers as a pair and validates the four R2 settings all-or-none. `tests/unit/config/server-env.test.ts` includes incomplete/invalid pair and partial/full R2 contracts.
- `scripts/recovery/run-daily-backup.ts` requires database/release metadata and calls R2; it does not create or schedule a Render service. The local adapter is an in-memory map. The restore-drill script fails closed until given an explicit isolated target. The backup catalog read page distinguishes an unavailable provider and does not represent an empty catalog as healthy.
- `RequestRestoreUseCase` records an authorized restore intent only. Production restore is denied while its policy is unapproved; no recovery orchestrator executes a restore.
- Telemetry call sites use the vendor-neutral no-op defaults; configuration is not proof of an exporter.
- Source migration manifest remains 42 migrations through `0042_immutable_lab_equipment_usage`; no migration file was edited. Existing read-only PostgreSQL snapshot: PostgreSQL 18.6/TLS, 18/42 applied, 24 pending, aggregate checksum difference count 0. The JSON does not expose per-row applied checksums for independent recalculation; this remains historical snapshot evidence. `database-readonly.json` SHA-256: `d10223f4ab1a222bc21d1126a63573ef5f351dd2a63c3c54371f377aefe0fbc6`; source manifest SHA-256: `328c549688ad342c6df6246ea9187b98a211d4d04644e296ca71911e040b8955`.

No business rows were read. No production connection, database writes, migration, or historical migration edit was made.

## Changes

- Corrected `Documents/CONFIGURATION-REFERENCE.md`: unset R2 no longer claims “local file artifacts”; documents memory-only fallback, lack of application wiring, and no-op OTEL providers. Added a safe, server-side setup outline conditional on approval.
- Added QC-ENV26-04 to `Documents/ENVIRONMENT-DRIFT-REGISTER.md` with the exact owner action and evidence limits.
- No runtime code, UI, permissions, schema, migration, provider setting, or service resource changed.

## Evidence status

| Acceptance evidence | Status | Scope / limitation |
|---|---|---|
| Environment comparison | HISTORICAL — 0/4 R2, 0/2 OTEL | Names/presence only; deploy in progress. |
| Local env comparison | PASS — 0/4 R2, 0/2 OTEL | Presence only; no values printed. |
| Typed configuration pair/all-or-none behavior | PASS — 15/15 focused tests | Run on host Node 22.22.3, below the repository contract; confirms parser and in-memory adapter behavior only, not a live provider. |
| R2 artifact round-trip / provider outage | NOT VERIFIED | No approved bucket/credentials/isolated provider; no call made. |
| Backup catalog persistence and scheduled execution | NOT VERIFIED / implementation gap | Backup script and catalog are not wired together or scheduled. |
| Restore and permission isolation | PARTIAL / NOT VERIFIED end-to-end | Request path retains server authorization and production deny; no orchestrator or current isolated restore evidence. |
| OTEL export / outage behavior | NOT VERIFIED / implementation gap | No exporter installed; no endpoint or headers configured. |
| Applied migration ledger / checksums | HISTORICAL / PARTIAL | Existing read-only snapshot only; no per-row checksums available in evidence JSON. |
| Authenticated page, keyboard, AT, 320/375/768/1440, 200% | NOT VERIFIED | No authenticated candidate-bound browser evidence. No UI was changed in this task. |
| Production write, migration, deploy, external settings | NOT RUN | Explicitly outside authorization. |

## Acceptance and owner decision

The source-level decision is that R2 provider selection and OTEL export are **optional pending owner policy**; their absence alone is not a service configuration failure. The task's current score remains **0%** against the environment addendum's scoped R2 0/4 and OTEL 0/2 denominators; this is not a product-quality score. Source contract review does not raise provider-integration acceptance.

**Named owner decision required:** decide whether durable backup and/or telemetry export is required; for backup, select an approved provider/plan, access scope, retention and recovery target/owner; for monitoring, select an approved backend and alert/response owner. If R2 or an alternate store is selected, implement runtime wiring and scheduling, then prove round-trip, isolated restore, provider failure, permission isolation, and redacted export. If OTEL is selected, implement an exporter, then prove both-variable validation, emitted signals, backend outage handling, and redacted export. Do not provision a paid service or enter secrets until authorized.

No claim of durable backup, restore readiness, telemetry export, production readiness, deployment success, or UAT acceptance is made.
