# Documentation inventory

**Freeze:** 2026-09-19 — working tree after docs consolidation into `Documents/`  
**Status:** CURRENT / AUTHORITATIVE inventory of repository documentation

Note: the legacy `docs/` tree (development, operations, architecture, and
top-level references) was consolidated into `Documents/` as a flat set.
`docs/superpowers/plans/` and `docs/superpowers/specs/` were removed and no
longer exist under `Documents/`; their historical content is represented by the
audit records referenced below.

Classification describes how a document may be used as evidence. Historical and
audit documents are preserved and must not be used as current implementation
truth without checking the source code and current documents.

## Current / authoritative

| Scope | Files |
| --- | --- |
| Product entry point | `README.md` |
| Normative product documents | All files under `Documents/` |
| System design / architecture | `Documents/ARCHITECTURE-SPECIFICATION.md`, `Documents/DATABASE-ARCHITECTURE.md`, `Documents/DEPLOYMENT-ARCHITECTURE.md`, `Documents/DATA-MODEL.md`, `Documents/DATA-DICTIONARY.md`, `Documents/DOMAIN-MAP.md`, `Documents/STATE-MACHINES.md`, `Documents/ERROR-ARCHITECTURE.md`, `Documents/OBSERVABILITY-ARCHITECTURE.md`, `Documents/SECURITY-ARCHITECTURE.md` |
| Product and requirements | `Documents/BUSINESS-RULES.md`, `Documents/SYSTEM-INVARIANTS.md`, `Documents/REQUIREMENTS-TRACEABILITY.md`, `Documents/ROLE-MATRIX.md`, `Documents/PERMISSION-MATRIX.md`, `Documents/ROUTE-MANIFEST-SPECIFICATION.md`, `Documents/UAT-ACCEPTANCE-PLAN.md`, `Documents/RISK-REGISTER.md`, `Documents/PRODUCTION-READINESS-CHECKLIST.md`, `Documents/PRODUCT-ANALYTICS-MEASUREMENT-PLAN.md`, `Documents/QC-SYSTEM-DESIGN-CONSTITUTION.md` |
| UX and design | `Documents/DESIGN-SYSTEM.md`, `Documents/UI-UX-SPECIFICATION.md`, `Documents/UX-WRITING-GUIDE.md`, `Documents/AUTHORIZATION-VISIBILITY-DECISION.md` |
| Role operating & support | `Documents/ROLE-OPERATING-GUIDES.md`, `Documents/SUPPORT-OWNERSHIP-REGISTER.md` (derived layer; canonical policy stays in ROLE-MATRIX/PERMISSION-MATRIX) |
| Development and operations | `Documents/LOCAL-DEVELOPMENT.md`, `Documents/TESTING.md`, `Documents/TESTING-STRATEGY.md`, current runbooks under `Documents/` (`AI-PROVIDERS.md`, `F11-BACKUP-RECOVERY-RUNBOOK.md`, `INCIDENT-QUICK-REFERENCE.md`, `INCIDENT-PROBLEM-RUNBOOK.md`, `FIRST-DAY-OPERATING-CHECKLIST.md`, `INITIAL-ADMIN-BOOTSTRAP.md`, `RELEASE-RUNBOOK.md`, `RENDER-DATABASE-CONNECTION.md`, `RENDER-DEPLOYMENT.md`, `RENDER-MIGRATION-RUNBOOK.md`, `RESTORE-DRILL-RUNBOOK.md`, `BACKUP-RECOVERY-PLAN.md`) |
| Architecture additions | `Documents/EXTENDING-THE-SYSTEM.md`, `Documents/ROUTE-MATRIX.md`, `Documents/REJECT-REPORTS.md` |
| Database contract | `db/migrations/README.md` |
| Starting data preparation | `Documents/MASTER-DATA-STARTING-DATA.md`, `Documents/FIRST-USE-DATA-MANIFEST.md` (inventory derived from `scripts/data/`) |
| Project operating instructions | `AGENTS.md`, `.agents/AGENTS.md`, `.agents/mind/01-mind-latest.md` |
| Executable contracts | `.github/workflows/ci.yml`, `render.yaml`, `package.json`, `astro.config.mjs`, `playwright.config.ts`, `vitest.config.ts`, `tsconfig.json` |

## Reference

| Scope | Files |
| --- | --- |
| Retained duplicates | `Documents/POSTGRES-MCP.md`, `Documents/POSTGRES-MCP 2.md` |

Reference files explain intent or historical implementation work. Current code,
migrations, and the authoritative documents above decide present behavior.

`Documents/RENDER-POSTGRES-RECOVERY-AUDIT.md` is explicitly historical
and superseded; `Documents/PERFORMANCE-BASELINE.md` is a historical
observational baseline, not current release evidence.

## Audit evidence

Every file under `audit/2026-09-18/`, every dated closure report at
`audit/2026-09-18-*.md`, and the evidence records under `audit/100-percent/` are
audit snapshots. Each is bound to its own date, SHA, environment, and scope.
The latest relevant evidence is linked from the current Mind; it does not
supersede code or rewrite older observations.

The records under `audit/100-percent/uat/` are controlled UAT templates or
session evidence. Empty/unexecuted records remain `BLOCKED`/`UNVERIFIED`.

## Historical / superseded

Older dated audits, closure reports, scorecards, prompts, and decision packages
under `audit/100-percent/`—including the 2026-09-09 through 2026-09-17 records
and older `FINAL-*`, `CLOSURE-*`, `PROMPT*`, and remediation files—are retained
as historical or superseded evidence. They are not current-state documentation
and must not be edited merely to remove drift.

## Archived

`02-mind-*`, `03-mind-*`, and `brain.md` are read-only Mind archives under the
project rules. `.agents/skills-archive/**` and the legacy snapshot archive are
archived reference material.

## Generated / cached

`.agents/plugins/codex-cache/**`, generated `dist/**`, `coverage/**`,
`.ci-results/**`, Playwright `test-results/**`, and other build outputs are
generated or tool-cache material. They are not living documentation and are
excluded from current-state claims.

## Freshness rules

- Current documents must agree with the route registry, migrations, package
  contract, and current evidence at the time of use.
- Historical audits preserve what was known and observed at their own freeze.
- `PASS` is a test result, not a release, UAT, security, or production claim.
- The route matrix is derived from the canonical registry and should be reviewed
  whenever a page or route declaration changes.
