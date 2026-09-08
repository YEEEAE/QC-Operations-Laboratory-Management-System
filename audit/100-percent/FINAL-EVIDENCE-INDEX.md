# QC-100-13 — Final Evidence Index

## MASTER HEADER

- Repository: `YEEEAE/QC-Operations-Laboratory-Management-System`
- Target: `main`
- HEAD: `ca8d1bdc49d84cb447c88ed12d380a38ff3940e9`
- Freeze: `2026-09-08 07:16:20 +03`
- Working tree before this prompt: clean
- Evidence policy: current command output outranks historical audit claims

| Ref | Evidence | Scope | Result |
|---|---|---|---|
| E-01 | `git status --short --branch`, `git rev-parse HEAD`, `git diff` | identity and local changes | `main`, exact HEAD above, clean before this prompt |
| E-02 | `node --version`, `pnpm --version`, `package.json`, `.node-version` | runtime contract | Node `v22.22.3` is outside declared `>=24.20.0 <25`; pnpm `11.25.0` matches |
| E-03 | `ls db/migrations/*.sql` | repository migration head | `0018_rate_limit_windows.sql`; applied database state unverified |
| E-04 | `pnpm test:architecture` | delivery boundary guard | exit 0; static guard does not disprove direct imports found by scan |
| E-05 | focused AI Vitest run | existing AI tests | `23/23` passed |
| E-06 | `pnpm exec vitest run tests/integration/ai-advisory/evals.test.ts tests/unit/ai-advisory/advisory.test.ts tests/integration/ai-advisory/security.test.ts` | new deterministic AI eval suite plus existing AI boundaries | `3 files / 38 tests passed` |
| E-07 | `.github/workflows/ci.yml` | remote CI definition | workflow exists; current GitHub check-run unavailable from this host |
| E-08 | `gh run list --commit ca8d1bd...` | remote CI status | failed to connect to `api.github.com`; status `UNVERIFIED` |
| E-09 | `audit/100-percent/USABILITY-STUDY-PACKAGE.md` | executable research protocol | package exists; participant evidence `UNVERIFIED` |
| E-10 | `audit/100-percent/01-100-DOMAIN-SCORECARD.md` | prior row-level baseline | 100 rows; prior average `49.35/100`; not accepted as fresh runtime evidence |
| E-11 | `audit/100-percent/FINAL-100-DOMAIN-AUDIT.md` | current independent re-audit | current row ledger and blockers |
| E-12 | `audit/100-percent/FINAL-OPEN-RISKS.md` | residual risk | unresolved runtime, UAT, recovery, policy, and delivery-boundary blockers |

## Source and artifact index

- AI implementation: `src/modules/ai-advisory/**`
- AI tests: `tests/unit/ai-advisory/**`, `tests/integration/ai-advisory/**`
- Deterministic dataset: `audit/100-percent/ai-evals/deterministic-eval-dataset.json`
- Previous evidence and blocker baseline: `audit/100-percent/00-REALITY-FREEZE.md`, `04-CRITICAL-BLOCKERS.md`
- Required controlled sources: `Documents/SYSTEM-INVARIANTS.md`, `Documents/QC-SYSTEM-DESIGN-CONSTITUTION.md`, `Documents/BUSINESS-RULES.md`, `Documents/ROLE-MATRIX.md`, `Documents/PERMISSION-MATRIX.md`, `Documents/STATE-MACHINES.md`, `Documents/DATA-MODEL.md`, `Documents/DATA-DICTIONARY.md`, `Documents/REQUIREMENTS-TRACEABILITY.md`, and the architecture/security/testing/UAT documents named by the prompt.

No evidence in this index is a substitute for live PostgreSQL, browser, CI, UAT, backup/restore, or deployed-provider evidence.
