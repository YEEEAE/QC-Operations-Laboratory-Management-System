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
- `Documents/BACKUP-RECOVERY-PLAN.md` — backup and recovery design.
- `Documents/RESTORE-DRILL-RUNBOOK.md` — restore validation procedure.
- `Documents/NDB-13-OPERATIONS-AND-OBSERVABILITY.md` — readiness boundaries, non-secret observability definitions, tenant-scope protections, and current runbook inventory.
- `render.yaml` — Render service definition.
- `.github/workflows/ci.yml` — CI verification workflow.
- `scripts/release/` — release identity and evidence checks.
- `scripts/recovery/` — backup and restore checks.

The source-level runbook inventory identifies the dedicated Neon branch/grant, user enrollment, incident response, controlled GO/NO-GO, and production-readiness checklist documents as missing. A missing runbook is a governance/configuration gap; do not infer owner approval or operational readiness from this index or a successful health probe.

## Release manifest and production Go/No-Go

`scripts/release/release-manifest.schema.json` defines a candidate-bound readiness manifest, separate from `dist/release-identity.json` and the deterministic artifact hash manifest. Its identity includes the environment, Git SHA, build ID/version, migration head and UAT cycle; additional references cover approved source revisions, effective master-data version, backup and restore evidence, security controls, and deployment destination. Keep the environment and candidate SHA visible together: staging, pilot, local and simulated evidence cannot be relabeled as production evidence.

Every dimension is `MISSING`, `PROVIDED`, `VERIFIED` or `APPROVED`. `MISSING` is the source default. `PROVIDED` records a submitted reference only; `VERIFIED` requires the named trusted source's immutable receipt to be checked against this exact candidate; `APPROVED` requires a separate authorized business decision. Presence of a file, manifest field, URL or operator-entered reference does not advance a state. UAT, CI, scientific, data, backup, IT and QC Manager signoff are independent requirements and are never auto-satisfied.

The system control center presents a candidate-bound evidence checklist as `MISSING` and Go/No-Go as `NO-GO` until an authoritative 19-gate production register is reconciled. Provider receipts are submitted to `POST /api/release-evidence`; the current intake rejects them while the approved 19-gate mapping is absent. An authorized business decision uses the existing release-candidate detail action. The dashboard does not create candidates, infer approval from runtime health, or promote staging/pilot/shadow releases.
