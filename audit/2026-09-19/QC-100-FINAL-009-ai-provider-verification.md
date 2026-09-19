# QC-100-FINAL-009 — AI provider and safe-failure verification

**Date:** 2026-09-19  
**Work state:** `PARTIAL`  
**Evidence state:** offline checks `PASS`; live providers, external processing approval, and reviewer evidence `NOT VERIFIED` / `BLOCKED`.

## Candidate and environment

- Exact candidate used for final focused tests: `95d1380f2f463bad911d6ee041ae6a7f45cbf897` (`main`, same as `origin/main` at the final check).
- Parent: `daf513ea3f2620f88cee1041bb8cf4ca04273fde`.
- The repository advanced from the parent plus a dirty tree to this clean commit while the audit was running. The agent did not run `git commit` or `git push`; commit authorship or the cause of that concurrent advancement is not inferred.
- Runtime: bundled Node `v24.19.0`, pnpm `11.25.0`. Project contract is Node `>=24.20.0 <25`; therefore these fresh local results are outside the declared Node contract.
- No provider request, database mutation, production action, or AI prompt transmission was made. No prompt, credential value, password, credential-bearing URL, or screenshot is included here.

## Changes

- Expanded `tests/unit/ai-advisory/providers.test.ts` with provider status classification for bad request/authentication/forbidden/model missing/timeout/rate limit/server error; malformed JSON and structurally invalid output; the 12-second abort bound; real adapter-level Groq-to-Gemini failover after a 429; one-attempt behavior for non-retriable authentication failure; and sanitized application behavior when fallback completion or availability throws.
- No application source, workflow rule, authorization decision, scientific rule, or provider credential changed.

## Verification run

Commands were run with the bundled Node/pnpm directory first on `PATH`:

```text
pnpm exec vitest run tests/unit/ai-advisory/providers.test.ts tests/unit/ai-advisory/advisory.test.ts tests/integration/ai-advisory/security.test.ts tests/integration/ai-advisory/evals.test.ts
  PASS — 4 files, 66 tests

pnpm exec prettier --check tests/unit/ai-advisory/providers.test.ts
  PASS

pnpm typecheck
  PASS — Astro check: 821 files, 0 errors, 0 warnings, 72 hints
  Runtime warning: Node v24.19.0 does not satisfy >=24.20.0 <25

git diff --check
  PASS
```

The focused suite covers the existing deterministic checks for server authorization before provider access, secret-like/PII refusal, advisory-only authority refusal, source identity retention, and fixed sanitized `UNAVAILABLE`. These are fixture/mock checks, not model behavior evidence. The timeout test verifies the local abort signal; no live provider latency was measured.

## Evidence classification

| Requirement | Status | Evidence / limit |
|---|---|---|
| Adapter HTTP/error contracts | `PASS` | Deterministic fetch mocks; 401/403/404/408/429/5xx classes, malformed JSON, invalid structures and safety block. |
| Bounded fallback | `PASS` | Mocked Groq 429 calls Gemini once; auth failure does not call fallback; fallback exceptions degrade through the application boundary. |
| Both providers live, each configured model | `NOT RUN` | No provider transmission was authorized. No provider may be labeled `LIVE VERIFIED`. |
| Real live failover | `NOT RUN` | Cannot infer from adapter mocks or configuration availability. |
| Configured availability | `NOT VERIFIED` | `HttpAiProvider.availability()` reports configuration presence only; it makes no connectivity probe. Test configuration parsing is not a credential-validity check. |
| Privacy/external-processing approval | `BLOCKED` | QC-100-FINAL-010 records external AI processing approval as open / not verified. |
| Actual human review | `NOT VERIFIED` | No reviewer session or signed UAT record; QC-100-FINAL-004 remains open. |
| Disposable browser identity / non-production target | `NOT RUN` | No URL or disposable test identity was supplied. The privileged named account credentials sent in chat were not used. BrowserAct was requested and its CLI installed after approval, but no browser session or credential entry was started. Its `get-skills core --skill-version 2.0.2` command stalled during initialization and was interrupted. |
| Core workflow mutation under provider failure | `NOT RUN` | Offline application tests prove fixed `UNAVAILABLE` and no raw provider detail; no populated runtime workflow was exercised. |

## Dependencies and downstream work

- `QC-100-FINAL-010`: obtain and record approved external AI-processing scope before transmission.
- `QC-100-FINAL-004`: actual human reviewer and signed review evidence remain required; no completion is implied.
- `QC-100-FINAL-003`: supply a non-production URL and disposable fixture identity for browser verification.
- `QC-015` / PD-31: provider security/evidence ingestion and business-approved provider contract remain open.

**Decision:** `PARTIAL`. Offline failure handling and adapter contracts have fresh candidate-bound evidence, but acceptance requires independent live Groq and Gemini calls/model identities, real configured failover, approved data-processing scope, and accepted human review. The missing approval blocks transmission; no provider is reported `LIVE VERIFIED`.
