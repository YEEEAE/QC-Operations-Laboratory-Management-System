# Documentation inventory

**Freeze:** 2026-09-18 — `a6876f0fb0de6acbead7f62b3d1fbdf6c61e5de7`  
**Status:** CURRENT / AUTHORITATIVE inventory of repository documentation

Classification describes how a document may be used as evidence. Historical and
audit documents are preserved and must not be used as current implementation
truth without checking the source code and current documents.

## Current / authoritative

| Scope | Files |
| --- | --- |
| Product entry point | `README.md` |
| Normative product documents | All files under `Documents/` |
| Development and operations | `docs/development/LOCAL-DEVELOPMENT.md`, `docs/development/TESTING.md`, current runbooks under `docs/operations/`, and `docs/architecture/*` |
| Architecture additions | `docs/architecture/EXTENDING-THE-SYSTEM.md`, `docs/architecture/ROUTE-MATRIX.md`, `docs/REJECT-REPORTS.md` |
| Database contract | `db/migrations/README.md` |
| Project operating instructions | `AGENTS.md`, `.agents/AGENTS.md`, `.agents/mind/01-mind-latest.md` |
| Executable contracts | `.github/workflows/ci.yml`, `render.yaml`, `package.json`, `astro.config.mjs`, `playwright.config.ts`, `vitest.config.ts`, `tsconfig.json` |

## Reference

| Scope | Files |
| --- | --- |
| Design plans and specifications | All files under `docs/superpowers/plans/` and `docs/superpowers/specs/` |
| Retained duplicate | `docs/operations/POSTGRES-MCP 2.md` |

Reference files explain intent or historical implementation work. Current code,
migrations, and the authoritative documents above decide present behavior.

`docs/operations/RENDER-POSTGRES-RECOVERY-AUDIT.md` is explicitly historical
and superseded; `docs/verification/PERFORMANCE-BASELINE.md` is a historical
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
