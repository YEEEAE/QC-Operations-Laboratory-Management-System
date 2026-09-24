# QC-ADP-11 — AI, security, and supply-chain evidence

**Status: PARTIAL / NO-GO.** Root causes addressed locally; required external and authenticated evidence remains blocked. No production data was sent to an AI provider. No commit, push, or deployment was performed.

## Candidate identity

- Git HEAD: `4cfffb455d0437fdc305358cf0ad2947257fddf9`
- Working tree: dirty; all results below apply to this local candidate and its exact build, not a pushed or deployed revision.
- Release identity: `rel-b2bab19ec0f6dde9`; build `qc-adp-11`; artifact `dist/server/entry.mjs`, SHA-256 `ed8b8f2ef6174e65c7fa2f72572fcbf44d04dcfd80f5144971a16da84253c6bb`.
- Latest local build evidence: `.ci-results/build.json` (same HEAD and working-tree source fingerprint); exact release identity and artifact digest are recorded above. This ignored local evidence file is not a CI or deployment attestation.
- Release identity schema: 1. Database migration head: `0041_document_review_queue_indexes`, checksum `41fe296853afe831a8932ad03000dfe60bfa00ecad112ec1ed3cf2f73b246a0a`.
- No database schema was changed. No authenticated actor was established: the E2E harness stopped before test execution while locating a container runtime.
- Build: PASS. `astro check`: PASS (984 files, 0 errors, 0 warnings, 89 hints).
- Focused AI/provider/license/evaluation/security unit and integration suites: PASS, 79/79 tests.

## Fixed acceptance denominator for `RT-AI-001`

The denominator is **10** applicable checks. BLOCKED and NOT VERIFIED remain in the denominator. `5 / 10 = 50%`; this page is not READY and both linked findings remain open.

| # | Acceptance check | Result | Evidence / limitation |
|---|---|---|---|
| 1 | Exact provider destination allowlist accepts official endpoints and rejects altered, spoofed, loopback, port, query, and scheme variants | PASS | `tests/unit/ai-advisory/providers.test.ts`; implementation `src/modules/ai-advisory/infrastructure/ai-configuration.ts` |
| 2 | Missing/invalid policy or request consent fails closed; synthetic policy/eval/security contracts | PASS | Focused Vitest run 79/79; `tests/integration/ai-advisory/security.test.ts`, `tests/integration/ai-advisory/evals.test.ts` |
| 3 | AI remains advisory-only and cannot write or decide QC outcomes | PASS | Existing domain boundaries and focused AI suite; no AI database/schema changes |
| 4 | Advisory disclosure, source/provenance, readable warning and human review boundary on the candidate UI | NOT VERIFIED | Static source/build only; no browser or assistive-technology inspection in this run |
| 5 | Four formerly UNKNOWN installed package licenses are resolved from exact version-pinned upstream and installed license text | PASS | `licenses.json`, `scripts/security/license-evidence.mjs`; four classifications MIT with text digests and release-tag source links |
| 6 | Candidate SBOM/license inventory contains no unresolved UNKNOWN licenses | PASS | 822 locked packages; `unknownLicenses={}`; lockfile SHA-256 `c82b96f2a756792f05f7a120e08b605b8e7058706db3095b34e10d83c4577ee5` |
| 7 | Targeted AI advisory security E2E proves allow and deny behavior on this candidate | BLOCKED | Playwright discovery found the selected read-only role denial test. Harness verified release identity then stopped before Playwright: no working container runtime (Docker socket permission denied); no actor/role result |
| 8 | Current high-severity dependency advisory audit on this exact candidate | BLOCKED | Corepack cache path workaround reached registry request; `registry.npmjs.org` DNS returned `ENOTFOUND`, so no advisory result exists |
| 9 | Owner-approved provider, processing location, retention, deletion, permitted classes, and consent artifact | BLOCKED | PD-31 remains PARTIAL; no approved artifact. Provider sending remains disabled by default |
| 10 | Approved, limited live-provider evaluation with consent and deletion/retention evidence | BLOCKED | Not run because provider/data-processing approval is absent; no external provider received data |

**Metric:** 5 PASS / 10 applicable = 50%. The page cannot be accepted or called complete while a NOT VERIFIED/BLOCKED check remains. No N/A checks were used.

## Root cause and changes

- Provider URL configuration accepted arbitrary HTTPS destinations. Replaced that with exact vendor endpoint matching and fail-closed configuration for any changed host, path, port, query, or scheme. The fixed endpoints are documented in `Documents/AI-PROVIDERS.md` and `Documents/CONFIGURATION-REFERENCE.md`.
- SBOM license resolution used package manifest metadata alone. Four installed packages have no usable SPDX field. Added a narrow package/version/license-text digest map; only an exact installed text match for the pinned version is classified MIT. Unknown or changed versions/text stay UNKNOWN. Evidence lives in `sbom.cdx.json` and `licenses.json`.
- Added least-privilege AI advisory E2E coverage for the read-only role, UI visibility, and direct action denial. Execution is blocked by the unavailable container runtime, so the new E2E assertion is not claimed as passing.
- `Documents/THREAT-MODEL-030.md` records the corrected endpoint boundary and reproducible license evidence. This establishes the technical allowlist; it does not approve vendor processing or settle license compatibility policy beyond identifying each exact upstream license as MIT.

## Evidence files and remaining owner decisions

- `sbom.cdx.json` SHA-256: `615688e55082a2b445b822c46ee3b5f2e693ce9076b63021a7c7bee8459eff88`
- `licenses.json` SHA-256: `7373cdf770fafba205f73cd8158c83198c614e07ea4227870c26be2cf7af3604`
- AI synthetic evaluation contract: dataset `qc-ai-governance-v2` v4.0.0, 33 cases; focused integration suite passed on this candidate. Existing report: `audit/100-percent/ai-evals/results-2026-09-24.json`.
- External high-severity advisory result: **NOT VERIFIED** (registry DNS unavailable); do not claim zero unresolved advisories.
- Security E2E: **BLOCKED** before browser/test execution; no authenticated role/scope evidence.
- Provider policy and live evaluation: **BLOCKED** pending business owner approval under PD-31. Approved provider, location, retention, deletion, permitted data classes, consent wording/version, and reviewer acceptance are still required. Do not enable external processing before this decision.
- No production schema, role, or QC decision data changed. UI live readability/accessibility and live provider behavior remain NOT VERIFIED.

## Finding and route disposition

- `QC-PAGE-F-012` (P1): PARTIAL / OPEN. Four license UNKNOWN labels and the open provider URL allowlist are resolved technically; the advisory audit and security E2E are still blocked, so the finding cannot close.
- `QC-PAGE-F-019` (P2): PARTIAL / OPEN. Synthetic safeguards and endpoint checks pass; no approved processing artifact or live-provider evaluation exists.
- `RT-AI-001` (`/ai-advisory`): 5/10 PASS (50%); NOT READY / NO-GO. `QC-ADP-08` live security evidence remains a dependency.
- Policy status: PD-31 remains PARTIAL; this handoff is not an owner approval.
