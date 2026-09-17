# File Coverage — Independent Final Verification

## Audited scope

- Repository source, migrations, pages, shared infrastructure, tests, CI workflow, public assets, release scripts, recovery scripts, UAT records, and prior audit artifacts were inspected.
- The canonical domain names and IDs were taken from `audit/100-percent/01-100-DOMAIN-SCORECARD.md`; every ID 1–100 appears in `FINAL-100-DOMAIN-AUDIT.md`.
- Baseline diff was independently frozen from `ca8d1bdc49d84cb447c88ed12d380a38ff3940e9` to `1686d2951e9eed78b5b78a2c44444cdd6c8acecd`: 1267 files, 267000 insertions, 4837 deletions.

## Evidence coverage boundaries

| Area | Covered | Not proven |
|---|---|---|
| Source/static | `src/`, `db/migrations/`, `scripts/`, `Documents/`, `docs/`, `public/` | Production behavior |
| Automated | unit, architecture, typecheck, build, release identity/verify, UAT validator | lint/format are failing; integration/E2E blocked |
| Database | migration source inventory and checks in code | live PostgreSQL 18, applied head, privileges, concurrency, restore |
| Browser | test specifications and UI source | current authenticated execution, AT, UAT |
| Provider/production | Render config and release policy | CI run, Render revision, provider logs, production smoke |
| Human | UAT plan/template | participants, signed cycle, usability measurements |
| Recovery | recovery tools/runbooks | backup bytes, isolated restore, parity, RPO/RTO |
| Hygiene | tracked-file and public scans | no claim beyond the scans recorded |

## Reproducible commands

```sh
git diff --name-status ca8d1bdc49d84cb447c88ed12d380a38ff3940e..HEAD
pnpm test:unit
pnpm test:architecture
pnpm typecheck
pnpm build
pnpm lint
pnpm format:check
node audit/100-percent/uat/validate-uat-records.mjs --session audit/100-percent/uat/UAT-SESSION-RECORD.csv --release "$(git rev-parse HEAD)"
docker info
```

