# QC-CLOSURE-CI-004 — Exact-HEAD Verification Evidence

**Checked:** 2026-09-16
**Local checkout:** `60371e6a59c97af2566c7d9ac29b49628ab497d1`
**Application deployment path:** Render Web Service (`render.yaml`), Astro SSR via `dist/server/entry.mjs`

## Repository classification

- Repository-owned workflows: `.github/workflows/ci.yml` only (`Verification CI`).
- No repository-owned Jekyll configuration, Pages workflow, `.nojekyll`, `CNAME`, or `_config.yml` was found.
- GitHub still has an externally configured `pages-build-deployment` workflow. Its latest observed failure was a Jekyll build failure and is independent of the Astro application workflow.
- `public/assets/astro/**` was a copied Astro source/project tree, not a runtime asset. It was removed; the application uses `public/assets/qc-medical-hero.glb` and `src/ui/components/QCLogin3DBackground.astro`. The architecture check now fails if `public/assets/astro` returns.

## Verification commands and evidence

| Workflow/job gate | Command | Result |
| --- | --- | --- |
| Frozen dependency contract | `pnpm install --frozen-lockfile` | Not re-run after edits; lockfile/package metadata unchanged |
| Format | `pnpm format:check` | PASS |
| Lint | `pnpm lint` | PASS |
| Typecheck / Astro check | `pnpm typecheck` | PASS; 0 errors, 61 hints |
| Architecture boundaries | `pnpm test:architecture` | PASS; copied-tree guard included |
| Technical debt contract | `pnpm release:tech-debt:check` | PASS; 6 items |
| Unit | `pnpm test:unit` | PASS; 72 files, 440 tests |
| Integration | `pnpm test:integration` | BLOCKED locally by missing Docker runtime; 63 files passed, 16 PostgreSQL suites failed to start, 252 passed, 50 skipped, 1 non-DB fixture failure was fixed and passed in focused rerun |
| Migrations | `pnpm test:migrations` | BLOCKED locally by missing Docker runtime; 6 suites, 22 tests skipped after container startup failure |
| Concurrency | `pnpm test:concurrency` | BLOCKED locally by missing Docker runtime; 2 suites, 12 tests skipped after container startup failure |
| Security | `pnpm test:security` | PASS for runnable portion: 6 files, 48 passed, 1 PostgreSQL test blocked; focused security rerun 38/38 passed |
| Build | `pnpm build` | PASS; Astro server/client build completed |
| Release identity | `pnpm run release:identity -- --environment ci --build-id local-verification --artifact dist/server/entry.mjs` then `pnpm run release:verify -- --input dist/release-identity.json --expected-git-sha 60371e6a59c97af2566c7d9ac29b49628ab497d1 --artifact dist/server/entry.mjs` | PASS; artifact hash and SHA matched |
| Playwright E2E | `pnpm test:e2e` | BLOCKED/FAIL locally: 42 passed, 98 skipped, 22 failed during unstable local WebGL/server run; targeted post-fix run 15 passed, 2 skipped, 3 intermittent timeouts |

## External GitHub evidence

- Latest observed Verification CI run: [run #54](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/actions/runs/34187138555), commit `f9c8eb9`; the job was not started because the account was locked due to a billing issue. This is an external runner/account blocker, not an application gate result.
- Latest observed Pages noise: [pages build and deployment #31](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System/actions/runs/34187138279); Jekyll attempted to build the Astro SSR repository and failed independently of `Verification CI`.
- GitHub exact-HEAD status for `60371e6a59c97af2566c7d9ac29b49628ab497d1` is **NOT VERIFIED/GREEN** from this workspace because the fixes are uncommitted and GitHub Actions is externally billing-blocked.

## Required external action

Disable the externally configured GitHub Pages deployment in repository Settings →
Pages → Build and deployment, then commit the local changes and run `Verification CI`
on the resulting exact commit. PostgreSQL 18/Testcontainers and Playwright must be
allowed to complete on the GitHub runner before declaring closure.
