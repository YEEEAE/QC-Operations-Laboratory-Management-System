# QC-100-FINAL-010 — Runtime security, privacy and software supply chain

**Date:** 2026-09-19  
**Work state:** `PARTIAL`  
**Evidence state:** mixed: `PASS`, `BLOCKED`, `NOT RUN`, and `NOT VERIFIED`  
**Candidate:** commit `f87ffe107426bc988e1e1e88eed3c5945ce3cb8d` (`main`) plus a dirty working tree. The working-tree changes were preserved and not treated as this task's changes.

## Environment and safety

- Node `v22.22.3`, pnpm `11.25.0`; the project contract is Node `>=24.20.0 <25`, so local execution is outside the declared runtime contract.
- No commit, push, merge, deploy, migration, provider-credential action, or production mutation was performed.
- No password, session secret, provider key, credential-bearing URL, screenshot, or raw controlled data was written to evidence.
- Disposable PostgreSQL provision was attempted on ports `55432` and `55433`. The first attempt was blocked by sandbox shared-memory permission; the second was blocked because both ports were already in use by an existing local PostgreSQL process. That process was not stopped or reused.

## Candidate-specific verification

| Area | Result | Evidence |
|---|---|---|
| Security suite | `PARTIAL` | `pnpm test:security`: 6 test files passed; 51 tests passed, 1 skipped; the PostgreSQL rate-limit suite was blocked by missing Testcontainers runtime. |
| Role/scope/state/SoD negative matrix | `PASS` for the executed focused scope | 12 files, 63 tests passed: authorization types, central authorize, P-05 authority/ceremony, SoD, safe returnTo, validation, fail-closed policy, administration authorization, and auth middleware. |
| Auth/session/CSRF/XSS/IDOR/SQLi/file/rate-limit controls | `PARTIAL` | Source and focused tests cover headers, secure cookies, safe returnTo, authorization, AI boundary, redaction, and in-memory rate limits. Authenticated browser payload tests and PostgreSQL-backed rate-limit execution were not completed. |
| Browser security boundary | `NOT RUN` | Authenticated E2E/CSRF/IDOR/XSS and the browser security-header workflow require the authenticated fixture/runtime path. |
| Lockfile integrity | `PASS` | `pnpm install --frozen-lockfile --offline --ignore-scripts --prefer-offline` completed with “Already up to date”; `pnpm-lock.yaml` is lockfile version `9.0`, with 27 direct importer entries and 822 locked package/snapshot entries. |
| Dependency vulnerability audit | `BLOCKED` | `pnpm audit --prod --json` produced no result before the network-bound process was stopped. No high/critical conclusion is claimed. |
| SBOM | `NOT RUN` | No SBOM generator (`syft`, `trivy`, `grype`, `osv-scanner`, or equivalent) is installed in the local environment. The lockfile inventory above is not an SBOM. |
| Secret scan | `PARTIAL` | Tracked source/config scan found no private-key material or provider-key assignment. It did find deliberate fake credential examples in security tests; those remain test fixtures, not evidence of runtime secrets. A dedicated scanner was not available. |
| Privacy classification/retention/deletion/correction/export/AI rules | `NOT VERIFIED` | Current approved documents keep field-level classification, exact log/AI retention, deletion/correction, and provider-processing decisions policy-dependent or open. No external approval was invented. |
| Regulated workflow traceability | `PARTIAL` | Existing policy matrix and server-side state/authorization/audit contracts were inspected. Human approval, UAT, provider evidence, and external certification remain unverified. |

## Commands and counts

```text
pnpm test:security
  51 passed, 1 skipped; PostgreSQL rate-limit suite BLOCKED by missing container runtime

pnpm exec vitest run [focused authorization/policy/security files]
  12 files passed, 63 tests passed

pnpm install --frozen-lockfile --offline --ignore-scripts --prefer-offline
  PASS: Already up to date

pnpm audit --prod --json
  BLOCKED/NO RESULT: network-bound command produced no audit result

git diff --check
  PASS
```

## Privacy handling rules used for this audit

The current source documents allow only the following unambiguous handling decisions: `PUBLIC-INTERNAL`, `INTERNAL`, `SENSITIVE`, and `SECRET` are the classification vocabulary; passwords, session/reset tokens, API keys, database credentials, and private signing material are `SECRET`; exact log and AI retention is `POLICY-DEPENDENT`; sensitive full AI prompt/output retention is disallowed unless a requirement exists. Exact per-field classification, retention schedules, deletion/correction rules, export/audit privacy approval, and external AI processing approval remain open and therefore were not implemented or inferred.

## Handoff and downstream blockers

- `QC-015`: provider/CI security evidence, production credential safety, and backup/log retention evidence remain external or environment-gated.
- `QC-013`: controlled privacy/QMS decisions are still needed for classification, retention, deletion/correction, export/audit privacy, and regulated workflow acceptance.
- `QC-003`: authenticated disposable fixtures and the full six-persona role/scope/state/SoD browser matrix remain required.
- `QC-009`: AI provider transmission approval, live provider evidence, and human review/UAT remain unverified.
- Docker/Testcontainers or an explicitly authorized isolated PostgreSQL runtime is required to close the blocked database security case. A Node 24 environment is required to re-run the candidate under contract.

## Decision

`PARTIAL`. The executed candidate-specific negative tests passed for the focused source/policy scope, but acceptance is not met: runtime browser/PG evidence, current dependency audit, SBOM, approved privacy decisions, CI supply-chain evidence, and human/external evidence are still missing. No external certification or production security claim is made.
