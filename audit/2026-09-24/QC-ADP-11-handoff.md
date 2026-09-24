# QC-ADP-11 — AI, security, and supply-chain evidence

**Status: PARTIAL / NO-GO.** Technical endpoint allowlisting and license identification are verified; the security E2E, dependency advisory result, owner policy, and approved live evaluation remain blocked. No production data was sent to an AI provider. No commit, push, or deployment was performed.

## Candidate identity

- Git HEAD: `dc47645cc7072185cfd2c016668e6b611895f2e2`
- Working tree: documentation/evidence handoff changes are local and uncommitted. Final candidate checks are rerun after the documentation changes; application source and lockfile remain unchanged. No pushed or deployed revision is claimed.
- Release identity schema: 1. Migration head: `0041_document_review_queue_indexes`, checksum `41fe296853afe831a8932ad03000dfe60bfa00ecad112ec1ed3cf2f73b246a0a`.
- Candidate runtime: Node `24.20.0`; package version `0.1.0`. Release schema 1 identity `rel-87b94bdda6b0df74` is recorded in `dist/release-identity.json` (`workingTree=dirty`, exact HEAD `dc47645cc7072185cfd2c016668e6b611895f2e2`) and verified after the final documentation changes. Rebuilt server artifact SHA-256: `ed8b8f2ef6174e65c7fa2f72572fcbf44d04dcfd80f5144971a16da84253c6bb`.
- Source schema only; no database was changed. No authenticated actor was established because the disposable E2E harness stopped before Playwright when no container runtime was available.
- Build: PASS. `astro check`: PASS (984 files, 0 errors, 0 warnings, 89 hints).
- Fresh focused AI/advisory suites: PASS, 90/90 tests across 4 files. Synthetic evaluation dataset: `qc-ai-governance-v2` v4.0.0, 33 cases, deterministic fake model only; no provider call.
- Fresh SBOM regeneration: 822 locked packages, zero UNKNOWN licenses; lockfile SHA-256 `c82b96f2a756792f05f7a120e08b605b8e7058706db3095b34e10d83c4577ee5`. Tracked evidence: `audit/2026-09-24/QC-ADP-11/sbom.cdx.json` SHA-256 `6d8235990372bfc2f2aae2649e330279a11755cc18356ef5098670cb8ae35405`, and `licenses.json` SHA-256 `7373cdf770fafba205f73cd8158c83198c614e07ea4227870c26be2cf7af3604`. Four exact package/version license-text matches are MIT.
- Requirements reconciliation guard: **FAIL**, one unchanged baseline row `REQ-READY-003` is owned by `QC-ADP-03`, while the guard requires the legacy `QC-100-FINAL-NNN` owner syntax. The row is identical at HEAD and is unrelated to the AI requirement rows updated here; no owner ID was fabricated.

## Fixed acceptance denominator for `RT-AI-001`

The denominator is **10** applicable checks. BLOCKED and NOT VERIFIED remain in the denominator. `5 / 10 = 50%`; this page is not READY and both linked findings remain open.

| # | Acceptance check | Result | Evidence / limitation |
|---|---|---|---|
| 1 | Exact provider destination allowlist accepts official endpoints and rejects altered, spoofed, loopback, port, query, and scheme variants | PASS | `tests/unit/ai-advisory/providers.test.ts`; implementation `src/modules/ai-advisory/infrastructure/ai-configuration.ts` |
| 2 | Missing/invalid policy or request consent fails closed; synthetic policy/eval/security contracts | PASS | Fresh focused Vitest run 90/90; `tests/integration/ai-advisory/security.test.ts`, `tests/integration/ai-advisory/evals.test.ts`; synthetic-only |
| 3 | AI remains advisory-only and cannot write or decide QC outcomes | PASS | Existing domain boundaries and focused AI suite; no AI database/schema changes |
| 4 | Advisory disclosure, source/provenance, readable warning and human review boundary on the candidate UI | NOT VERIFIED | Static source/build only; no browser or assistive-technology inspection in this run |
| 5 | Four formerly UNKNOWN installed package licenses are resolved from exact version-pinned upstream and installed license text | PASS | `licenses.json`, `scripts/security/license-evidence.mjs`; four classifications MIT with text digests and release-tag source links |
| 6 | Candidate SBOM/license inventory contains no unresolved UNKNOWN licenses | PASS | 822 locked packages; `unknownLicenses={}`; lockfile SHA-256 `c82b96f2a756792f05f7a120e08b605b8e7058706db3095b34e10d83c4577ee5` |
| 7 | Targeted AI advisory security E2E proves allow and deny behavior on this candidate | BLOCKED | Fresh release identity was verified, then the authenticated runner stopped before Playwright: `Could not find a working container runtime strategy`; no actor/role result. Evidence: `.ci-results/qc-adp-11-security-e2e-current.json` |
| 8 | Current high-severity dependency advisory audit on this exact candidate | BLOCKED | Fresh Corepack attempt using an isolated writable cache failed fetching pnpm from `registry.npmjs.org` with DNS `ENOTFOUND`; no advisory result exists |
| 9 | Owner-approved provider, processing location, retention, deletion, permitted classes, and consent artifact | BLOCKED | PD-31 remains PARTIAL; no approved artifact. Provider sending remains disabled by default |
| 10 | Approved, limited live-provider evaluation with consent and deletion/retention evidence | BLOCKED | Not run because provider/data-processing approval is absent; no external provider received data |

**Metric:** 5 PASS / 10 applicable = 50%. Checks 4 and 7–10 remain in the denominator as NOT VERIFIED/BLOCKED. The page cannot be accepted or called complete while any such check remains. No N/A checks were used.

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
- Security E2E: **BLOCKED** before browser/test execution on the exact source HEAD; no authenticated role/scope evidence. Exact attempt record: `.ci-results/qc-adp-11-security-e2e-current.json`.
- Provider policy and live evaluation: **BLOCKED** pending business owner approval under PD-31. Approved provider, location, retention, deletion, permitted data classes, consent wording/version, and reviewer acceptance are still required. Do not enable external processing before this decision.
- No production schema, role, or QC decision data changed. UI live readability/accessibility and live provider behavior remain NOT VERIFIED.

## Finding and route disposition

- `QC-PAGE-F-012` (P1): PARTIAL / OPEN. Four UNKNOWN license classifications and the provider destination allowlist are technically resolved. The current high-severity advisory audit and security E2E remain BLOCKED, so the finding cannot close.
- `QC-PAGE-F-019` (P2): PARTIAL / OPEN. Synthetic safeguards and endpoint checks pass; no approved processing artifact or live-provider evaluation exists.
- `RT-AI-001` (`/ai-advisory`): 5/10 PASS (50%); NOT READY / NO-GO. Current candidate: HEAD `dc47645cc7072185cfd2c016668e6b611895f2e2`, migration `0041_document_review_queue_indexes`, release schema 1. Route card keeps the fixed denominator of ten; route-specific evidence and blocked checks are listed above.
- Policy status: PD-31 remains PARTIAL; this handoff is not an owner approval.
