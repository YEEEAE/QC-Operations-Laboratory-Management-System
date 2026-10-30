# Operations map

## Application hosting boundary

The application is an Astro server-rendered Node.js service backed by PostgreSQL.
`astro.config.mjs` uses the standalone Node adapter, `package.json` owns the
`start` command, and `render.yaml` defines the production Render Web Service.
GitHub Actions in this repository currently contains verification CI only; there
is no Pages/Jekyll workflow or static-site artifact. A Pages/Jekyll failure is
therefore not an Astro SSR runtime result.

An external GitHub Pages run observed on 2026-10-30 (run `40994437252`, commit
`80e5947f22bc4ccce1a71c911c7c9d0cae99f2d9`) invoked the generated `pages build
and deployment` workflow and failed in `Build with Jekyll` on invalid YAML front
matter in `src/pages/reject-reports/focus.astro`; the log also reports other
`.astro` files being parsed as YAML. This confirms that Pages processed the
repository source as Jekyll input. It does not establish a failure in Render's
Astro SSR service or in the current local checkout. The Pages settings were not
readable through the available repository inspection endpoint, so whether a
publishing source remains configured is `NOT VERIFIED`.

Do not publish the repository root as a static Pages site or add `.nojekyll` as
an SSR remedy: skipping Jekyll would neither produce the standalone Node server
nor make raw application and document sources an appropriate static artifact.
Keep the Astro Node SSR deployment on Render. If Pages is still enabled, the
repository administrator action documented immediately below is required;
there is no local source change that can clear that external setting.

Read-only GitHub repository metadata reported the repository as public during
this review. That does not establish which files are approved for public access.
If company-controlled or confidential material is not authorized for public
distribution, the repository owner must change visibility under **Settings →
General → Danger Zone → Change repository visibility**, then separately assess
published Git history, forks, caches, and exposed credentials. A visibility
change alone does not retract copies already made; history remediation and
credential rotation require owner-led action where applicable.

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
