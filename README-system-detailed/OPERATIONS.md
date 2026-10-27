# Operations map

## Application hosting boundary

The application is an Astro server-rendered Node.js service backed by PostgreSQL.
`astro.config.mjs` uses the standalone Node adapter, `package.json` owns the
`start` command, and `render.yaml` defines the production Render Web Service.
GitHub Actions in this repository currently contains verification CI only; there
is no Pages/Jekyll workflow or static-site artifact. A Pages/Jekyll failure is
therefore not an Astro SSR runtime result.

The current Render Blueprint defines separate production, staging, and pilot
web services. Staging and pilot have automatic deploy disabled and dedicated
database/storage variable names; the Blueprint does not provision their
database or storage resources. Keep their credentials isolated in each
service's protected environment settings; do not treat a Pages source as
staging.

If GitHub Pages is enabled in repository settings, a repository administrator
must disable its publishing source separately; editing this repository cannot
change that external setting. In GitHub, open **Settings → Pages → Build and
deployment**, select **Deploy from a branch** under **Source**, choose **None**
in the branch selector, then select **Save**. This removes the Pages deployment
and its publishing source. The **Unpublish site** action beside the live-site
URL removes the current deployment but does not clear the source setting.

- `workspace-map/OPERATIONS.md` — complete file-by-file inventory for configuration and operations.
- `Documents/CONFIGURATION-REFERENCE.md` — environment variable names and approved defaults.
- `Documents/NEON-CREDENTIAL-ROTATION-RUNBOOK.md` — manual owner-led credential revocation and rotation steps.
- `Documents/ENVIRONMENT-DRIFT-REGISTER.md` — known environment differences and operator actions.
- `Documents/RENDER-DEPLOYMENT.md` — application deployment instructions.
- `Documents/RENDER-MIGRATION-RUNBOOK.md` — database migration procedure for Render.
- `Documents/RELEASE-RUNBOOK.md` — release sequence and gates.
- `Documents/PRODUCTION-READINESS-CHECKLIST.md` — readiness evidence requirements.
- `Documents/BACKUP-RECOVERY-PLAN.md` — backup and recovery design.
- `Documents/RESTORE-DRILL-RUNBOOK.md` — restore validation procedure.
- `Documents/INCIDENT-QUICK-REFERENCE.md` — immediate incident response steps.
- `Documents/SUPPORT-OWNERSHIP-REGISTER.md` — support owners and escalation.
- `render.yaml` — Render service definition.
- `.github/workflows/ci.yml` — CI verification workflow.
- `scripts/release/` — release identity and evidence checks.
- `scripts/recovery/` — backup and restore checks.
