# QC-100-FINAL-030-B — Integration and technical evidence

**Work status: PARTIAL.** Item 1 is PARTIAL: lockfile integrity and an SBOM are evidenced, but the current vulnerability query is blocked and repeated build artifacts are not byte-reproducible. Item 2 is DONE as preparation: the reference-only inventory and rotation/leak-response procedure are recorded; no credential was read or rotated. Evidence states remain separate from work states. `PASS != RELEASED`.

## Candidate and environment identity

| Identity | Value |
|---|---|
| Frozen candidate before execution | `4d889128052ba66791b2c7a1a0b6e414f3beecfb` (`main`); working tree clean at freeze. This is newer than 030-A's `df647bc455e55fbec879661e898d147ffbec94e3`. |
| Final Git SHA | `4d889128052ba66791b2c7a1a0b6e414f3beecfb` (unchanged; no source/test file changed). |
| Content-based source dirty fingerprint | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` — SHA-256 of the empty set of source/test paths changed from the frozen candidate. |
| Evidence artifact fingerprint | `5ab59be676f97546d441a053df3434ee6bf2f6f96b8263a0741495225793d4a0`; SHA-256 of sorted `path NUL git-status NUL SHA256(file bytes)` rows joined with LF, excluding this report and `.agents/mind/01-mind-latest.md`; includes the SBOM only. |
| Runtime / package manager | Node `v22.22.3` (outside project contract `>=24.20.0 <25`); pnpm `11.25.0` (matches `packageManager`). |
| Source schema identity | `0033_controlled_document_execution_context`, checksum `6b4cf38ab8974ba0dbb30fc4cccb766dac3351796f4d84eb5bf226de0d75c472`. Applied schema: **NOT VERIFIED**; no DB URL was supplied to this task and no database was contacted. |
| Local build identity | Release `rel-b1ba82df142eb97c`, build `qc-100-final-030-b-4d889128`, Git SHA above, artifact `dist/server/entry.mjs`, SHA-256 `b2a481d775d533cf934f9a094b4cff90701e4fb013c37fd2c9e61214d1e554fc`; release identity verification PASS. Identity is marked dirty because the task's audit SBOM is untracked; implementation source/test fingerprint is empty. |
| Evidence capture | 2026-09-20 22:23–22:40 UTC (2026-09-21 01:23–01:40 Asia/Riyadh). SBOM timestamp is embedded in its metadata. |

The supplied comparison remains historical: candidate `653b58d22d4a17994db7376a3bd691ca6e789f1a`, maturity 45.8%, gates 0/19, NO-GO. This task does not recalculate scores or change the 80-domain denominator.

## Item 1 — Lockfile, reproducible build, SBOM, provenance, vulnerability evidence

**Work state: PARTIAL. Evidence state: mixed.**

| Check | State | Evidence and limit |
|---|---|---|
| Frozen dependency install | **PASS** | `pnpm install --offline --frozen-lockfile` completed “Already up to date” on the frozen candidate. It warned that Node 22.22.3 is outside the declared engine range. `pnpm-lock.yaml` is lockfile v9.0; SHA-256 `c82b96f2a756792f05f7a120e08b605b8e7058706db3095b34e10d83c4577ee5`. No lockfile or dependency version changed. |
| Build | **PASS (local build only)** | `pnpm build` exited 0 repeatedly. Existing Rollup warnings were emitted for Zod annotations, an unused `Writable` import, mixed static/dynamic import, and the large Three.js chunk. All builds ran on unsupported Node 22.22.3. |
| Byte reproducibility | **FAIL** | Four successive `dist/server/entry.mjs` outputs differed: `4ed42a6e207fd864aac3fc2eb82add835f04065d455c2aad9ea754c6cc2f1518`, `db1a31ab627838903543d31d0ddd69eea7561a15214dae83b3d824fe6620440c`, `0a160c62a66535101c23a9f9248c38309a3c33024da93b5413a41b55dbd13fcb`, `b2a481d775d533cf934f9a094b4cff90701e4fb013c37fd2c9e61214d1e554fc`. Inspection found the first differing bytes in the generated server-manifest filename referenced by `entry.mjs` (`manifest_-YGxeY69.mjs`, `manifest_f0SusZS4.mjs`, etc.). No dependency or source change occurred between builds. Root cause inside Astro's manifest generation is not yet proven; owner: 030 implementation follow-up / 012 to keep the evidence open. |
| Release identity | **PASS (local identity only)** | `node scripts/release/verify-release.mjs --input dist/release-identity.json --expected-git-sha 4d889128052ba66791b2c7a1a0b6e414f3beecfb --artifact dist/server/entry.mjs` verified release `rel-b1ba82df142eb97c` against the exact frozen SHA and final artifact hash. It is not remote CI evidence. |
| SBOM | **PASS (lockfile inventory)** | Generated [CycloneDX 1.5 SBOM](QC-100-FINAL-030-B-sbom.cdx.json) from all 822 `pnpm-lock.yaml` package locators, including development dependencies. All 822 components have a lockfile `integrity` hash; all bom-refs are unique. JSON/CycloneDX structural assertions PASS. Lockfile SHA is embedded. This locally generated inventory does not contain dependency edges, license assertions, or registry attestations. No SBOM generator was installed or fetched. |
| Dependency provenance | **PARTIAL** | Every resolved locator in the lockfile has an integrity digest (822/822); frozen lock install passed. `.github/workflows/ci.yml` checks out the event SHA, pins pnpm 11.25.0 and Node 24.20.0, then frozen-installs before auditing. No candidate-bound remote CI run or signed build/provenance attestation was found for this SHA. |
| Vulnerability/advisory evidence | **BLOCKED** | `pnpm audit --audit-level high` made no advisory determination: npm registry request failed with `ENOTFOUND` for `registry.npmjs.org`, then `fetch failed`. No zero-vulnerability or no-advisory claim is made, and no package was upgraded without findings/compatibility evidence. Retry with registry access, then remediate each confirmed advisory within the supported Node/package constraints. |
| Private key names in client output | **PASS (bounded scan)** | Searched `dist/client` for `GROQ_API_KEY`, `GEMINI_API_KEY`, `R2_SECRET_ACCESS_KEY`, `SESSION_SECRET`, and `DATABASE_URL`; none found. This is a bounded name scan, not a dedicated secret scanner. |
| Current exact-candidate regression / applied schema | **NOT RUN / NOT VERIFIED** | Existing 002/027 evidence cited in the Mind and older reports belongs to prior candidates (`84bdf249…`, `0f25de0f…`, etc.); it is historical for this SHA. No current-candidate PostgreSQL evidence was present. Route to 002/027 on disposable PostgreSQL 18, then reconcile with 012. |

Fresh focused security contracts on this candidate: **10 files / 88 tests PASS** using `pnpm exec vitest run` across session service, security headers, Astro Origin contract, export safety, AI advisory unit/security/evaluation, and file/object-store integrations. This is not a substitute for PostgreSQL-backed parity, broad security suite, or E2E. Previous 030-A result (113/113 focused tests, typecheck 884 files) is historical to its SHA.

## Item 2 — Secret references, rotation preparation, and leak response

**Work state: DONE for preparation. Evidence state: PASS for the names-only inventory and documented procedure; NOT VERIFIED for live credential inventory, exposure status, and provider rotation.**

No value from `.env`, provider settings, logs, process environment, or credentials was read, copied, or included. `.env` is present locally, is not tracked by Git, and is ignored. Its contents were not inspected, so this does not establish that its values are current or safe. `.env.example` is the tracked names-only reference.

| Secret reference family | Consumer / boundary references |
|---|---|
| `DATABASE_URL` | `src/shared/database/pool.ts`, health/readiness and DB CLI boundaries; local/provider connection secret. |
| `SESSION_SECRET` and authentication/session credentials | `src/config/env.ts`, `src/middleware.ts`, `src/modules/identity/**`; session tokens are random and the database stores token hashes. |
| `BOOTSTRAP_ADMIN_PASSWORD`, password reset and reauthentication inputs | `src/modules/identity/application/{bootstrap-initial-admin,admin-reset-password,change-password}.ts`, controlled approval verifiers. |
| `GROQ_API_KEY`, `GEMINI_API_KEY` | `src/config/env.ts`, server-only AI provider configuration/adapters under `src/modules/ai-advisory/**`; live provider use still needs external processing approval. |
| `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | `src/modules/backup-recovery/infrastructure/cloudflare-r2-artifact-store.ts`. |
| `OTEL_EXPORTER_OTLP_HEADERS` | server observability/exporter configuration; must remain server-side and redacted. |
| `QC_VERIFY_*`, `QC_E2E_*`, `QC_UAT_*`, `QC_RECOVERY_DATABASE_URL` | disposable verification/E2E/UAT/recovery runners and task-owned fixtures; use one-time values and isolated data only. |

`Documents/RENDER-DATABASE-CONNECTION.md` already classifies the credential in a local Render export as compromised and blocks production connections/migrations until the operator rotates it. This task did not inspect the export or establish whether that credential remains present. No actual credential was rotated.

### Prepared operator sequence

1. Treat any value confirmed in Git, build artifacts, logs, tickets, chat, or an unauthorized local export as compromised; record only its reference, consumer, exposure window, owner, and incident ID.
2. Identify the provider's authorized credential owner and rotation window. For the Render DB gate, follow `Documents/RENDER-DATABASE-CONNECTION.md`: create the replacement through the provider Credentials interface, update the local canonical `DATABASE_URL` and managed service variable securely, verify with the documented read-only preflight, then revoke the old credential after the operator confirms the replacement works. Do not delete the only usable credential before that confirmation.
3. For provider/API credentials, stage the replacement in the provider's secret store, update the server-side consumer, perform a bounded health/authentication check, observe failures, and revoke the old key after the replacement is confirmed. Keep actual values out of shell history, Git, logs, artifacts, and this report.
4. For suspected session-secret exposure, use the authorized identity/session-revocation path and require fresh authentication; do not change user passwords or provider credentials without the responsible owner's authorization.
5. Preserve sanitized incident metadata and relevant access logs; scan current tracked files, repository history, CI artifacts, and managed configuration through approved secret-scanning tooling. If a value entered Git history, revoke first and coordinate any history cleanup with the repository owner; do not rewrite history as part of this task.
6. Record completion by reference only: provider/key identifier, consumer, rotation/revocation timestamps, read-only verification result, and follow-up. Never record the secret value.

A dedicated scanner was unavailable (`gitleaks`, `trufflehog`, `syft`, and `cyclonedx-npm` were not installed). The tracked-file scan therefore remains **NOT VERIFIED** for leaked values; the bundle name scan is bounded evidence only. Owner for live rotation and any confirmed incident: credential/provider owner under QC-015/010 operations; 013/026 for policy decisions where required. No external notification or contact was made.

## Handoff and owners

| Follow-up | Required input / action | Owner |
|---|---|---|
| Current advisory result and remediation | Rerun `pnpm audit --audit-level high` with registry access; remediate only confirmed findings within compatibility constraints and rerun affected checks. | 030 implementation + 012 evidence reconciliation |
| Byte-reproducible build | Pin down why Astro's generated server-manifest content/name changes between repeated builds; establish a supported-Node comparison and retain artifact hashes. | 030 implementation; reconcile claim in 012 |
| Exact-candidate regression/schema | Run impacted file/evidence and report-export parity plus relevant regression on a disposable PostgreSQL 18 database for SHA `4d889128…`; return schema identity and timestamps. | 002/027 |
| CI provenance | Run exact-SHA CI when account/runner permits; retain candidate-bound audit, build, SBOM/provenance, and security results. | 002/027 + CI owner; 012 reconciles |
| Secret rotation / leak response | Verify provider state privately, rotate the previously flagged Render DB credential and any confirmed exposed values only under authorized operator workflow; store reference-only evidence. | Credential/provider owner (QC-015); no action performed here |
| Requirement and policy gaps | Approved `REQ-FILE-008` MIME/size/scanner/data path and retention/orphan lifecycle authority remain open; this task did not infer policy. | 013/026 |
| Final audit | Consume this report and SBOM; keep missing advisory, reproducibility, current DB/CI, and live-secret evidence open. Preserve 80 domains and evidence-derived scores. | 012 |

**Next phase:** QC-100-FINAL-012 final evidence reconciliation. Required inputs: this report and SBOM; exact-candidate 002/027 PostgreSQL/regression evidence; current dependency advisory result; reproducibility diagnosis and supported-Node build hashes; 013/026 approved policy inputs where relevant; and reference-only operator evidence if/when authorized rotation occurs. Human acceptance remains external to this task. No score, gate, release state, or 80-domain denominator was changed.
