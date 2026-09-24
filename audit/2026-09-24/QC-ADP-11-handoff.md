# QC-ADP-11 — AI, security, and supply-chain evidence

**Status: PARTIAL / NO-GO.** Technical endpoint allowlisting, license identification, and targeted security E2E are verified; the dependency advisory result, owner policy, and approved live evaluation remain blocked, and browser/AT readability remains NOT VERIFIED. No production data was sent to an AI provider. No commit, push, or deployment was performed.

## Candidate identity

- Git HEAD: `6b999b71c54e7e9c29399f8bae6a25b83ee39385`
- Working tree: dirty for local evidence/docs and the E2E assertion correction; the candidate build, release verification, SBOM, and test evidence bind to exact HEAD plus the recorded working-tree fingerprint. No pushed or deployed revision is claimed.
- Release identity schema: 1. Migration head: `0041_document_review_queue_indexes`, checksum `41fe296853afe831a8932ad03000dfe60bfa00ecad112ec1ed3cf2f73b246a0a`.
- Candidate runtime: Node `24.20.0`; package version `0.1.0`. Release schema 1 identity `rel-f295273109c23809` was verified for exact HEAD `6b999b71c54e7e9c29399f8bae6a25b83ee39385` and the E2E source fingerprint. Migration head `0041_document_review_queue_indexes`, checksum `41fe296853afe831a8932ad03000dfe60bfa00ecad112ec1ed3cf2f73b246a0a`; server artifact SHA-256 `addbdba94965b4d4a824106e740b20210825c325b62a2f4cf9317436b4ee0655`.
- No production database or schema was changed. A fresh disposable PostgreSQL 18.6 database and synthetic personas were used; the authenticated actor was `verify-least` (least-privileged, no foundation role, derived operational-read access only).
- Build: PASS (existing Rollup/Zod annotation, unused import, and chunk-size warnings). Fresh `astro check`: PASS (984 files, 0 errors, 0 warnings, 89 hints).
- Fresh focused AI/advisory + requirements contract suites: PASS, 97/97 tests across 5 files. Synthetic evaluation dataset: `qc-ai-governance-v2` v4.0.0, 33 cases, deterministic fake model only; no provider call.
- Targeted authenticated security E2E: PASS, 1 test plus run configuration (2/2 scenarios, 0 failed/skipped) on the exact candidate. The least-privileged actor sees the advisory boundary and no request form; direct POST returns sanitized HTTP 403 `FORBIDDEN`, with provider/model/secret details absent. Evidence: `.ci-results/qc-adp-11-security-e2e-current.json`.
- Fresh SBOM regeneration: 822 locked packages, zero UNKNOWN licenses; lockfile SHA-256 `c82b96f2a756792f05f7a120e08b605b8e7058706db3095b34e10d83c4577ee5`. Tracked evidence: `audit/2026-09-24/QC-ADP-11/sbom.cdx.json` SHA-256 `6d8235990372bfc2f2aae2649e330279a11755cc18356ef5098670cb8ae35405`, and `licenses.json` SHA-256 `7373cdf770fafba205f73cd8158c83198c614e07ea4227870c26be2cf7af3604`. Four exact package/version license-text matches are MIT.
- Requirements reconciliation guard: **PASS** after correcting its accepted owner-ID syntax to include existing `QC-ADP-NN` task IDs; the owner `QC-ADP-03` was preserved. Current result: 100 requirements, 34 risks, 20 gaps, 33 decisions, 5 assumptions, 7 mapped domains, and 80 audit domains.

## Fixed acceptance denominator for `RT-AI-001`

The denominator is **10** applicable checks. BLOCKED and NOT VERIFIED remain in the denominator. The current result is `6 / 10 = 60%`; this page is not READY and both linked findings remain open.

| # | Acceptance check | Result | Evidence / limitation |
|---|---|---|---|
| 1 | Exact provider destination allowlist accepts official endpoints and rejects altered, spoofed, loopback, port, query, and scheme variants | PASS | `tests/unit/ai-advisory/providers.test.ts`; implementation `src/modules/ai-advisory/infrastructure/ai-configuration.ts` |
| 2 | Missing/invalid policy or request consent fails closed; synthetic policy/eval/security contracts | PASS | Fresh focused Vitest run 90/90; `tests/integration/ai-advisory/security.test.ts`, `tests/integration/ai-advisory/evals.test.ts`; synthetic-only |
| 3 | AI remains advisory-only and cannot write or decide QC outcomes | PASS | Existing domain boundaries and focused AI suite; no AI database/schema changes |
| 4 | Advisory disclosure, source/provenance, readable warning and human review boundary on the candidate UI | NOT VERIFIED | Static source/build only; no browser or assistive-technology inspection in this run |
| 5 | Four formerly UNKNOWN installed package licenses are resolved from exact version-pinned upstream and installed license text | PASS | `licenses.json`, `scripts/security/license-evidence.mjs`; four classifications MIT with text digests and release-tag source links |
| 6 | Candidate SBOM/license inventory contains no unresolved UNKNOWN licenses | PASS | 822 locked packages; `unknownLicenses={}`; lockfile SHA-256 `c82b96f2a756792f05f7a120e08b605b8e7058706db3095b34e10d83c4577ee5` |
| 7 | Targeted AI advisory security E2E proves permitted page access and denied invocation on this candidate | PASS | Release identity `rel-f295273109c23809`; PostgreSQL 18.6 disposable database; `verify-least` least-privilege actor. Page access is allowed and shows the advisory boundary with no request form; direct POST is denied with sanitized HTTP 403 and exposes no provider data. E2E: 1 test PASS. Evidence: `.ci-results/qc-adp-11-security-e2e-current.json` |
| 8 | Current high-severity dependency advisory audit on this exact candidate | BLOCKED | `pnpm audit --audit-level high` ran with pnpm `11.25.0`; npm bulk advisory endpoint returned DNS `ENOTFOUND` and `fetch failed`. No advisory result exists |
| 9 | Owner-approved provider, processing location, retention, deletion, permitted classes, and consent artifact | BLOCKED | PD-31 remains PARTIAL; no approved artifact. Provider sending remains disabled by default |
| 10 | Approved, limited live-provider evaluation with consent and deletion/retention evidence | BLOCKED | Not run because provider/data-processing approval is absent; no external provider received data |

**Metric:** 6 PASS / 10 applicable = 60%. Check 4 remains NOT VERIFIED; checks 8–10 remain BLOCKED. All remain in the denominator. The page cannot be accepted or called complete while any such check remains. No N/A checks were used.

## Root cause and changes

- Provider URL configuration accepted arbitrary HTTPS destinations. Replaced that with exact vendor endpoint matching and fail-closed configuration for any changed host, path, port, query, or scheme. The fixed endpoints are documented in `Documents/AI-PROVIDERS.md` and `Documents/CONFIGURATION-REFERENCE.md`.
- SBOM license resolution used package manifest metadata alone. Four installed packages have no usable SPDX field. Added a narrow package/version/license-text digest map; only an exact installed text match for the pinned version is classified MIT. Unknown or changed versions/text stay UNKNOWN. Evidence lives in `sbom.cdx.json` and `licenses.json`.
- The first live E2E run exposed a stale assertion that expected an internal authorization reason in the public response. The action intentionally returns a sanitized generic `FORBIDDEN` response; updated the E2E assertion to verify that public contract, then reran successfully on disposable PG18.6.
- The reconciliation guard accepted only legacy `QC-100-FINAL-NNN` task IDs despite the existing `QC-ADP-03` owner; it now accepts both formats without changing the recorded owner.
- `Documents/THREAT-MODEL-030.md` records the corrected endpoint boundary and reproducible license evidence. This establishes the technical allowlist; it does not approve vendor processing or settle license compatibility policy beyond identifying each exact upstream license as MIT.

## Evidence files and remaining owner decisions

- `sbom.cdx.json` SHA-256: `6d8235990372bfc2f2aae2649e330279a11755cc18356ef5098670cb8ae35405`
- `licenses.json` SHA-256: `7373cdf770fafba205f73cd8158c83198c614e07ea4227870c26be2cf7af3604`
- AI synthetic evaluation contract: dataset `qc-ai-governance-v2` v4.0.0, 33 cases; focused integration suite passed on this candidate. Existing report: `audit/100-percent/ai-evals/results-2026-09-24.json`.
- External high-severity advisory result: **NOT VERIFIED** (registry DNS unavailable); do not claim zero unresolved advisories.
- Security E2E: **PASS** for permitted page access and denied invocation on the exact candidate; one authenticated least-privilege actor, no provider call. Exact run record: `.ci-results/qc-adp-11-security-e2e-current.json`.
- Provider policy and live evaluation: **BLOCKED** pending business owner approval under PD-31. Approved provider, location, retention, deletion, permitted data classes, consent wording/version, and reviewer acceptance are still required. Do not enable external processing before this decision.
- No production schema, role, or QC decision data changed. UI live readability/accessibility and live provider behavior remain NOT VERIFIED.

## Finding and route disposition

- `QC-PAGE-F-012` (P1): PARTIAL / OPEN. Four UNKNOWN license classifications and the provider destination allowlist are technically resolved; the authenticated E2E passes. The current high-severity advisory audit remains BLOCKED, so the finding cannot close.
- `QC-PAGE-F-019` (P2): PARTIAL / OPEN. Synthetic safeguards and endpoint checks pass; no approved processing artifact or live-provider evaluation exists.
- `RT-AI-001` (`/ai-advisory`): 6/10 PASS (60%); NOT READY / NO-GO. Current candidate: HEAD `6b999b71c54e7e9c29399f8bae6a25b83ee39385`, migration `0041_document_review_queue_indexes`, release schema 1. Route card keeps the fixed denominator of ten; route-specific evidence and blocked checks are listed above.
- Policy status: PD-31 remains PARTIAL; this handoff is not an owner approval.
