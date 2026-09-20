# QC-100-FINAL-026 — Strengthen requirements, product scope and risk traceability — Phase A

## Candidate freeze

| Field | Value |
|---|---|
| Freeze timestamp (UTC) | 2026-09-20T17:43Z (execution window) |
| HEAD SHA | `6f07cf28fdf63469ab32c294a0943563ea962fff` (main) |
| Working tree at freeze | CLEAN (`git status --porcelain` empty) |
| Deliverable content fingerprint (content-based) | `5fc27086af7c8231afff28a1f7a4dfcc3f4f713f` — `git diff HEAD` + sorted `git status --porcelain` over the six deliverable paths only (`Documents/REQUIREMENTS-RECONCILIATION.md`, `Documents/GAP-RISK-PRIORITY-MATRIX.md`, `Documents/DOCUMENTATION-INVENTORY.md`, `scripts/requirements/check-reconciliation.mjs`, `tests/unit/requirements/reconciliation-contract.test.ts`, `package.json`). Mind files and this report are excluded to avoid a self-referential fingerprint. |
| Audit comparison | 2026-09-19 candidate `653b58d22d4a17994db7376a3bd691ca6e789f1a` (exists in history); maturity 45.8%, gates 0/19, NO-GO |
| Build/runtime identity | applicationVersion 0.1.0; buildId `local-6f07cf28fdf6`; releaseId `rel-9c21a4b6db52b36c` (local generation, not a release) |
| Schema identity | repository migration head `0031_qc_creation_parity_two_stage_approval.sql` (31 migrations); applied DB head NOT VERIFIED this task |
| Host toolchain | Node v22.22.3 — outside declared contract `>=24.20.0 <25` (recorded deviation, matches prior audits); pnpm 11.25.0 |

## Item 1 — Requirements reconciliation register

**Changed paths:**

- `Documents/REQUIREMENTS-RECONCILIATION.md` (new) — 100-row register across 9 families (RC-01..RC-09). Every row carries: stable requirement ID, reconciliation ID (RC-nn-nnn), statement with legacy IDs, source (governing document/rule), business objective, applicability, capability class (MANDATORY/OPTIONAL), owning task, technical evidence reference. Legacy IDs from `REQUIREMENTS-TRACEABILITY.md` (273 unique across 31 families) folded verbatim in section 6 coverage map — never renumbered, never deleted. Open decisions (PD/RD) stay POLICY-DEPENDENT / SOURCE-DEPENDENT with runtime DENY; none closed.
- All 80 audit domain IDs retained: denominator statement in register §3/§5; guard asserts presence of all 80 domain rows in `audit/100-percent/QC-CLOSURE-017-FINAL-80-DOMAIN-AUDIT.md` and citation of covered domains D01, D21, D42, D53, D60, D61, D80. No new scored domain added.

**Evidence:** `node scripts/requirements/check-reconciliation.mjs` → PASS (requirements=100, risks=34, gaps=20, domains=80); unit contract `tests/unit/requirements/reconciliation-contract.test.ts` 5/5 PASS.

## Item 2 — Gap & risk priority matrix

**Changed paths:**

- `Documents/GAP-RISK-PRIORITY-MATRIX.md` (new) — documented method (RISK-REGISTER §4–§8; impact-led priority because likelihood is never invented: every entry stays Likelihood=ASSESSMENT REQUIRED, Severity=ASSESSMENT REQUIRED, Score=NOT YET RATED). 20 consolidated workflow/operational gaps (G-026-01..20) mapped from legacy G-001..G-020 and Mind open issues, each with capability class, impact, owner and register linkage. All 34 registered risks prioritized without re-scoring or acceptance. Mandatory/optional split explicit: 19 MANDATORY gaps, 1 OPTIONAL (G-026-20 product analytics); no required feature reclassified as optional.

**Evidence:** same guard PASS; contract test rows for class honesty (OPTIONAL pinned to REQ-AIGV-008, REQ-OPS-012, REQ-SCOPE-005, REQ-SCOPE-006) and no-fabricated-likelihood assertions.

## Supporting changes

- `scripts/requirements/check-reconciliation.mjs` (new) — machine guard: ID convention/budget, 100-row register integrity, sequential numbering per family, owner/source/evidence columns, legacy-ID verbatim coverage, 80-domain retention, gap/risk matrix shape (20+34 rows, vocabulary, impact ordering, register linkage).
- `tests/unit/requirements/reconciliation-contract.test.ts` (new) — 5 tests executing the guard and asserting contract invariants.
- `Documents/DOCUMENTATION-INVENTORY.md` — both new documents registered under "Product and requirements".
- `package.json` — added `requirements:check` script exposing the guard (`pnpm requirements:check`).
- `.agents/mind/01-mind-latest.md` + `02-mind-mid.md` — Mind updated with the 026 ledger entry; `01` exceeded the 120 KB hard limit (121,894 bytes) so an organized rollover moved the oldest 2026-09-18 ledger records to the top of `02` after verifying their absence there, first promoting still-active constants into current-state sections: current audit decision `NO-GO` / gates 0/19 (Release Governance) and the live Render-service divergence from `render.yaml` (Architecture/Deployment). `01` after rollover: 99,769 bytes / 392 lines.

## Checks (this candidate, this tree)

| Check | Command | Result |
|---|---|---|
| Reconciliation guard | `node scripts/requirements/check-reconciliation.mjs` / `pnpm requirements:check` | PASS (exit 0) |
| Unit contract | `npx vitest run tests/unit/requirements/reconciliation-contract.test.ts` | 5/5 PASS |
| Focused regression sanity (adjacent contract) | `npx vitest run tests/unit/requirements tests/unit/ui/copy-governance-contract.test.ts` | 2 files / 18 PASS |
| Lint (touched files) | `npx eslint scripts/requirements/... tests/unit/requirements/...` | PASS (0 errors) |
| Format (touched files) | `npx prettier --check <5 touched files>` | PASS |
| Typecheck | `npx tsc --noEmit` | Pre-existing FAIL in `tests/integration/qc-100-final-024/record-journey-linkage.test.ts` (TS2353 `occurredAt`) — untouched by this diff, recorded in Mind as prior failure; no new type errors introduced by this task (test file type-checked by eslint/parser; no new TS sources) |
| Regression / E2E / accessibility | owned by 002/027, 003, 006/040 | NOT RUN — out of this phase scope; no runtime code changed |

## Unresolved dependencies / owners

| Dependency | Owner | State |
|---|---|---|
| Open policy/authority decisions (PD-32, PD-38, retest, calibration blocking, RPO/RTO, restore authority, …) | QC-100-FINAL-013 | BLOCKED (external policy approval) — runtime DENY retained |
| UAT human evidence | QC-100-FINAL-004 | BLOCKED (external, human) |
| Exact-head CI, Docker/PostgreSQL regression, browser E2E | QC-100-FINAL-002/027, 003 | NOT RUN / BLOCKED on this host |
| Accessibility matrix | QC-100-FINAL-006/040 | BLOCKED (external environment) |
| Final evidence reconciliation | QC-100-FINAL-012 | pending family completion |

## Next phase

**QC-100-FINAL-026-B** — decision/assumption register with owner question, affected behavior, dependency, evidence needed; mapping to requirements/domains. Required inputs: this report; `Documents/REQUIREMENTS-RECONCILIATION.md`; `Documents/GAP-RISK-PRIORITY-MATRIX.md`; `audit/100-percent/POLICY-CLOSURE-MATRIX.md` (PD-01..38); RISK-REGISTER deferred decisions (RISK-DEC-001..012, §67).

## Status

Work: **PARTIAL** (phase A items 1–2 DONE locally; family completion requires 026-B and external evidence above).
Evidence: guard/contract/format/lint **PASS** on candidate `6f07cf2`; typecheck pre-existing 024 failure **FAIL (not this diff)**; regression/E2E/a11y/UAT/provider **NOT RUN / BLOCKED**. `PASS != RELEASED`; gates 0/19 unchanged; NO-GO unchanged.
