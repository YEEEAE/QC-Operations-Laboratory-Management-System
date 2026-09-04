# IMPLEMENTATION-MASTER-PLAN.md

# QC Operations & Laboratory Management System
## Complete Implementation Master Plan — Documentation-Only Repository → Go-Live

**Repository:** `YEEEAE/QC-Operations-Laboratory-Management-System`  
**Status:** EXECUTION PLAN — NOT IMPLEMENTATION EVIDENCE  
**Starting Reality:** Documentation/Foundation only; no `package.json`, no application `src/`, no migrations, no runtime, no tests at plan creation  
**Architecture:** Modular Monolith  
**Web:** Astro server-rendered/on-demand + Astro Actions/API  
**Runtime Baseline:** Node.js 24 LTS line  
**Database:** PostgreSQL 18.x  
**Data Access:** `pg` + Kysely  
**Testing:** Vitest + PostgreSQL 18 Testcontainers + Playwright  
**Observability:** Structured JSON Logs + OpenTelemetry Traces/Metrics  
**Canonical Production Web Host:** Render Web Service  
**Canonical Production Domain:** `qclevel.top`  
**Current DNS Manager:** Hostinger  
**UI:** Unified Dark Enterprise QC Control Room; Arabic/English; WCAG 2.2 AA target  

> This plan begins at the first package/runtime scaffold because the repository is intentionally dry from an implementation perspective. Writing this plan does not mean any implementation exists.

> Execute one Task ID at a time with `superpowers:subagent-driven-development` or `superpowers:executing-plans`, TDD, systematic debugging for failures, and verification-before-completion.

---

# 1. Execution Constitution

- Read Project Mind, root AGENTS, required specs, repository reality, and matching local skill before every task.
- Never trust prior PASS/complete/readiness claims without fresh evidence.
- `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only; no SQL/business rules.
- Canonical flow: Astro Page/Client → Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
- Default DENY. Role ≠ Permission. Admin is not universal approver/restore authority.
- Client never supplies trusted actor identity, permission result, final state, official PASS/FAIL, release or signature authority.
- PASS ≠ RELEASED everywhere.
- Controlled history cannot be silently rewritten; VOID/SUPERSEDED preserve history.
- Critical mutations transactional, idempotent where applicable, concurrency-safe.
- Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy or policy-dependent authority/RPO/RTO/retention.
- Audit ≠ logs ≠ security logging ≠ telemetry ≠ E-Signature evidence.
- AI advisory only.
- Backup Created ≠ Restore Verified.
- No push/merge/deploy/commit/delete unless explicitly authorized in the execution session.
- No percentage overrides a blocker; evidence before assertion.

---

# 2. Approved Foundation Inputs

- `Documents/SYSTEM-INVARIANTS.md`
- `Documents/QC-SYSTEM-DESIGN-CONSTITUTION.md`
- `Documents/DOMAIN-MAP.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/ROLE-MATRIX.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/STATE-MACHINES.md`
- `Documents/DATA-MODEL.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/REQUIREMENTS-TRACEABILITY.md`
- `Documents/ARCHITECTURE-SPECIFICATION.md`
- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/DATABASE-ARCHITECTURE.md`
- `Documents/ERROR-ARCHITECTURE.md`
- `Documents/TESTING-STRATEGY.md`
- `Documents/RISK-REGISTER.md`
- `Documents/DESIGN-SYSTEM.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/OBSERVABILITY-ARCHITECTURE.md`
- `Documents/BACKUP-RECOVERY-PLAN.md`
- `Documents/DEPLOYMENT-ARCHITECTURE.md`
- `Documents/UAT-ACCEPTANCE-PLAN.md`
- `Documents/PRODUCTION-READINESS-CHECKLIST.md`

---

# 3. Technical Version Rule

- Node.js: **24 LTS line**; pin actual patch at bootstrap.
- Astro: **7.x stable** + `@astrojs/node`; pin exact compatible versions.
- PostgreSQL: **18.x**, current supported minor.
- Vitest: **5.x stable line**.
- Playwright: current stable compatible with locked Node/package set.
- pnpm: exact compatible version pinned through `packageManager`/Corepack.
- Do not use floating `latest` ranges in production package metadata.

---

# 4. Phase Map

- **Phase 0 — Foundation Closure:** `IMP-000` → `IMP-001` — 2 task(s)
- **Phase 0 — Bootstrap:** `IMP-002` → `IMP-007` — 6 task(s)
- **Phase 1 — Database Foundation:** `IMP-010` → `IMP-030` — 21 task(s)
- **Phase 2 — Shared Application Infrastructure:** `IMP-040` → `IMP-054` — 15 task(s)
- **Phase 3 — Identity & Authentication:** `IMP-060` → `IMP-068` — 9 task(s)
- **Phase 4 — Authorization Administration:** `IMP-070` → `IMP-072` — 3 task(s)
- **Phase 5 — Design System & Application Shell:** `IMP-080` → `IMP-089` — 10 task(s)
- **Phase 6 — Shared Read Models & Insights:** `IMP-090` → `IMP-097` — 8 task(s)
- **Phase 7 — Tasks:** `IMP-100` → `IMP-104` — 5 task(s)
- **Phase 8 — Quality:** `IMP-110` → `IMP-116` — 7 task(s)
- **Phase 9 — Quarantine:** `IMP-120` → `IMP-128` — 9 task(s)
- **Phase 10 — Laboratory:** `IMP-130` → `IMP-135` — 6 task(s)
- **Phase 11 — Assets:** `IMP-140` → `IMP-145` — 6 task(s)
- **Phase 12 — Controlled Documents:** `IMP-150` → `IMP-154` — 5 task(s)
- **Phase 13 — Governance:** `IMP-160` → `IMP-166` — 7 task(s)
- **Phase 14 — Administration:** `IMP-170` → `IMP-171` — 2 task(s)
- **Phase 15 — System Operations:** `IMP-180` → `IMP-183` — 4 task(s)
- **Phase 16 — AI Advisory:** `IMP-190` → `IMP-192` — 3 task(s)
- **Phase 17 — Security & Observability Hardening:** `IMP-200` → `IMP-203` — 4 task(s)
- **Phase 18 — System Verification:** `IMP-210` → `IMP-215` — 6 task(s)
- **Phase 19 — Release Engineering:** `IMP-220` → `IMP-225` — 6 task(s)
- **Phase 20 — UAT & Acceptance:** `IMP-230` → `IMP-234` — 5 task(s)
- **Phase 21 — Implementation Closure:** `IMP-240` → `IMP-241` — 2 task(s)

**Total Task/Prompt count:** 151

---

# 5. Planned File Ownership Index

| Planned path | First owner Task |
|---|---|
| `.agents/mind/01-mind-latest.md` | `IMP-000` |
| `.editorconfig` | `IMP-001` |
| `.env.example` | `IMP-003` |
| `.gitattributes` | `IMP-001` |
| `.github/workflows/ci.yml` | `IMP-006` |
| `.gitignore` | `IMP-001` |
| `.node-version` | `IMP-002` |
| `.npmrc` | `IMP-002` |
| `.prettierignore` | `IMP-001` |
| `.prettierrc.json` | `IMP-004` |
| `Documents/DEPLOYMENT-ARCHITECTURE.md` | `IMP-224` |
| `Documents/REQUIREMENTS-TRACEABILITY.md` | `IMP-240` |
| `Documents/ROUTE-MANIFEST-SPECIFICATION.md` | `IMP-000` |
| `Documents/UI-UX-SPECIFICATION.md` | `IMP-000` |
| `astro.config.mjs` | `IMP-003` |
| `db/migrations/0001_core_schema.sql` | `IMP-015` |
| `db/migrations/0002_identity.sql` | `IMP-016` |
| `db/migrations/0003_authorization.sql` | `IMP-017` |
| `db/migrations/0004_audit_outbox_idempotency.sql` | `IMP-018` |
| `db/migrations/0005_files_notifications.sql` | `IMP-019` |
| `db/migrations/0006_tasks.sql` | `IMP-020` |
| `db/migrations/0007_quality.sql` | `IMP-021` |
| `db/migrations/0008_quarantine.sql` | `IMP-022` |
| `db/migrations/0009_laboratory.sql` | `IMP-023` |
| `db/migrations/0010_assets.sql` | `IMP-024` |
| `db/migrations/0011_documents.sql` | `IMP-025` |
| `db/migrations/0012_approvals_esignatures.sql` | `IMP-026` |
| `db/migrations/0013_change_requests.sql` | `IMP-027` |
| `db/migrations/0014_backup_recovery_metadata.sql` | `IMP-028` |
| `db/migrations/README.md` | `IMP-014` |
| `db/seeds/dev.ts` | `IMP-029` |
| `db/seeds/test.ts` | `IMP-029` |
| `docs/development/LOCAL-DEVELOPMENT.md` | `IMP-222` |
| `docs/development/TESTING.md` | `IMP-222` |
| `docs/operations/GO-LIVE-RUNBOOK.md` | `IMP-234` |
| `docs/operations/INCIDENT-QUICK-REFERENCE.md` | `IMP-222` |
| `docs/operations/RELEASE-RUNBOOK.md` | `IMP-222` |
| `docs/operations/RENDER-DEPLOYMENT.md` | `IMP-224` |
| `docs/operations/RESTORE-DRILL-RUNBOOK.md` | `IMP-223` |
| `docs/verification/IMPLEMENTATION-EVIDENCE-INDEX.md` | `IMP-240` |
| `docs/verification/PERFORMANCE-BASELINE.md` | `IMP-215` |
| `eslint.config.mjs` | `IMP-004` |
| `evidence/readiness/README.md` | `IMP-232` |
| `evidence/releases/README.md` | `IMP-233` |
| `evidence/uat/README.md` | `IMP-231` |
| `package.json` | `IMP-002` |
| `playwright.config.ts` | `IMP-005` |
| `pnpm-lock.yaml` | `IMP-002` |
| `render.yaml` | `IMP-225` |
| `scripts/architecture/check-boundaries.mjs` | `IMP-007` |
| `scripts/architecture/check-route-files.mjs` | `IMP-007` |
| `scripts/db/check-migration-integrity.ts` | `IMP-014` |
| `scripts/db/migrate.ts` | `IMP-014` |
| `scripts/db/migration-status.ts` | `IMP-014` |
| `scripts/readiness/check-production-readiness.ts` | `IMP-232` |
| `scripts/readiness/generate-release-record.ts` | `IMP-233` |
| `scripts/recovery/validate-restored-database.ts` | `IMP-223` |
| `scripts/recovery/validate-restored-files.ts` | `IMP-223` |
| `scripts/recovery/verify-recovery-manifest.ts` | `IMP-223` |
| `scripts/release/release-id.mjs` | `IMP-220` |
| `scripts/release/verify-release.mjs` | `IMP-220` |
| `scripts/uat/collect-evidence.ts` | `IMP-231` |
| `scripts/uat/run-uat.ts` | `IMP-231` |
| `scripts/uat/seed-uat.ts` | `IMP-230` |
| `scripts/workers/outbox.ts` | `IMP-046` |
| `src/actions/account.ts` | `IMP-066` |
| `src/actions/admin.ts` | `IMP-072` |
| `src/actions/ai-advisory.ts` | `IMP-191` |
| `src/actions/approvals.ts` | `IMP-163` |
| `src/actions/assets.ts` | `IMP-144` |
| `src/actions/auth.ts` | `IMP-066` |
| `src/actions/capa.ts` | `IMP-115` |
| `src/actions/change-requests.ts` | `IMP-165` |
| `src/actions/documents.ts` | `IMP-153` |
| `src/actions/findings.ts` | `IMP-115` |
| `src/actions/index.ts` | `IMP-066` |
| `src/actions/laboratory.ts` | `IMP-134` |
| `src/actions/ncr.ts` | `IMP-115` |
| `src/actions/quarantine.ts` | `IMP-127` |
| `src/actions/rca.ts` | `IMP-115` |
| `src/actions/reports.ts` | `IMP-097` |
| `src/actions/system.ts` | `IMP-183` |
| `src/actions/tasks.ts` | `IMP-103` |
| `src/config/constants.ts` | `IMP-010` |
| `src/config/env.ts` | `IMP-010` |
| `src/config/release.ts` | `IMP-220` |
| `src/config/runtime.ts` | `IMP-010` |
| `src/env.d.ts` | `IMP-003` |
| `src/i18n/ar.ts` | `IMP-054` |
| `src/i18n/en.ts` | `IMP-054` |
| `src/i18n/index.ts` | `IMP-054` |
| `src/i18n/locale.ts` | `IMP-054` |
| `src/middleware.ts` | `IMP-042` |
| `src/modules/administration/application/get-role.ts` | `IMP-071` |
| `src/modules/administration/application/list-permissions.ts` | `IMP-071` |
| `src/modules/administration/application/list-roles.ts` | `IMP-071` |
| `src/modules/administration/application/manage-user-scopes.ts` | `IMP-071` |
| `src/modules/administration/application/update-role-permissions.ts` | `IMP-071` |
| `src/modules/administration/infrastructure/postgres-authorization-repository.ts` | `IMP-070` |
| `src/modules/administration/ports/authorization-repository.ts` | `IMP-070` |
| `src/modules/ai-advisory/application/get-advisory.ts` | `IMP-190` |
| `src/modules/ai-advisory/domain/advisory-response.ts` | `IMP-190` |
| `src/modules/ai-advisory/infrastructure/disabled-ai-provider.ts` | `IMP-190` |
| `src/modules/ai-advisory/ports/ai-provider.ts` | `IMP-190` |
| `src/modules/approvals/application/decide-approval.ts` | `IMP-161` |
| `src/modules/approvals/application/get-approval.ts` | `IMP-161` |
| `src/modules/approvals/application/list-my-approvals.ts` | `IMP-161` |
| `src/modules/approvals/domain/approval.ts` | `IMP-160` |
| `src/modules/approvals/infrastructure/postgres-repository.ts` | `IMP-160` |
| `src/modules/approvals/ports/repository.ts` | `IMP-160` |
| `src/modules/assets/calibration/application/create-calibration.ts` | `IMP-141` |
| `src/modules/assets/calibration/application/get-calibration.ts` | `IMP-141` |
| `src/modules/assets/calibration/application/list-calibrations.ts` | `IMP-141` |
| `src/modules/assets/calibration/application/transition-calibration.ts` | `IMP-141` |
| `src/modules/assets/calibration/domain/calibration.ts` | `IMP-141` |
| `src/modules/assets/calibration/infrastructure/postgres-repository.ts` | `IMP-141` |
| `src/modules/assets/calibration/ports/repository.ts` | `IMP-141` |
| `src/modules/assets/equipment/application/create-equipment.ts` | `IMP-140` |
| `src/modules/assets/equipment/application/get-equipment-eligibility.ts` | `IMP-143` |
| `src/modules/assets/equipment/application/get-equipment.ts` | `IMP-140` |
| `src/modules/assets/equipment/application/list-equipment.ts` | `IMP-140` |
| `src/modules/assets/equipment/application/update-equipment.ts` | `IMP-140` |
| `src/modules/assets/equipment/domain/equipment.ts` | `IMP-140` |
| `src/modules/assets/equipment/infrastructure/postgres-repository.ts` | `IMP-140` |
| `src/modules/assets/equipment/ports/equipment-eligibility.ts` | `IMP-143` |
| `src/modules/assets/equipment/ports/repository.ts` | `IMP-140` |
| `src/modules/assets/maintenance/application/create-maintenance.ts` | `IMP-142` |
| `src/modules/assets/maintenance/application/get-maintenance.ts` | `IMP-142` |
| `src/modules/assets/maintenance/application/list-maintenance.ts` | `IMP-142` |
| `src/modules/assets/maintenance/application/transition-maintenance.ts` | `IMP-142` |
| `src/modules/assets/maintenance/domain/maintenance.ts` | `IMP-142` |
| `src/modules/assets/maintenance/infrastructure/postgres-repository.ts` | `IMP-142` |
| `src/modules/assets/maintenance/ports/repository.ts` | `IMP-142` |
| `src/modules/backup-recovery/application/get-backup.ts` | `IMP-181` |
| `src/modules/backup-recovery/application/list-backups.ts` | `IMP-181` |
| `src/modules/backup-recovery/application/request-restore.ts` | `IMP-182` |
| `src/modules/backup-recovery/application/validate-restore-request.ts` | `IMP-182` |
| `src/modules/backup-recovery/domain/backup-record.ts` | `IMP-181` |
| `src/modules/backup-recovery/infrastructure/postgres-repository.ts` | `IMP-181` |
| `src/modules/backup-recovery/ports/recovery-orchestrator.ts` | `IMP-182` |
| `src/modules/backup-recovery/ports/repository.ts` | `IMP-181` |
| `src/modules/change-requests/application/create-change-request.ts` | `IMP-164` |
| `src/modules/change-requests/application/get-change-request.ts` | `IMP-164` |
| `src/modules/change-requests/application/list-change-requests.ts` | `IMP-164` |
| `src/modules/change-requests/application/transition-change-request.ts` | `IMP-164` |
| `src/modules/change-requests/domain/change-request.ts` | `IMP-164` |
| `src/modules/change-requests/infrastructure/postgres-repository.ts` | `IMP-164` |
| `src/modules/change-requests/ports/repository.ts` | `IMP-164` |
| `src/modules/dashboard/application/get-dashboard.ts` | `IMP-090` |
| `src/modules/dashboard/infrastructure/postgres-dashboard-query.ts` | `IMP-090` |
| `src/modules/dashboard/ports/dashboard-query.ts` | `IMP-090` |
| `src/modules/documents/application/approve-version.ts` | `IMP-152` |
| `src/modules/documents/application/create-document.ts` | `IMP-151` |
| `src/modules/documents/application/create-version.ts` | `IMP-151` |
| `src/modules/documents/application/get-document.ts` | `IMP-151` |
| `src/modules/documents/application/list-documents.ts` | `IMP-151` |
| `src/modules/documents/application/review-version.ts` | `IMP-152` |
| `src/modules/documents/application/submit-version.ts` | `IMP-152` |
| `src/modules/documents/application/supersede-version.ts` | `IMP-152` |
| `src/modules/documents/application/update-version-draft.ts` | `IMP-151` |
| `src/modules/documents/domain/document-state.ts` | `IMP-150` |
| `src/modules/documents/domain/document-version.ts` | `IMP-150` |
| `src/modules/documents/domain/document.ts` | `IMP-150` |
| `src/modules/documents/infrastructure/postgres-repository.ts` | `IMP-150` |
| `src/modules/documents/ports/repository.ts` | `IMP-150` |
| `src/modules/e-signatures/application/sign-controlled-action.ts` | `IMP-162` |
| `src/modules/e-signatures/domain/signature-evidence.ts` | `IMP-162` |
| `src/modules/e-signatures/infrastructure/postgres-repository.ts` | `IMP-162` |
| `src/modules/e-signatures/ports/repository.ts` | `IMP-162` |
| `src/modules/identity/application/admin-reset-password.ts` | `IMP-065` |
| `src/modules/identity/application/change-password.ts` | `IMP-064` |
| `src/modules/identity/application/create-user.ts` | `IMP-065` |
| `src/modules/identity/application/disable-user.ts` | `IMP-065` |
| `src/modules/identity/application/get-account.ts` | `IMP-064` |
| `src/modules/identity/application/login.ts` | `IMP-063` |
| `src/modules/identity/application/logout.ts` | `IMP-063` |
| `src/modules/identity/application/resolve-session.ts` | `IMP-063` |
| `src/modules/identity/application/session-service.ts` | `IMP-062` |
| `src/modules/identity/application/update-user.ts` | `IMP-065` |
| `src/modules/identity/domain/account-state.ts` | `IMP-060` |
| `src/modules/identity/domain/session.ts` | `IMP-060` |
| `src/modules/identity/domain/user.ts` | `IMP-060` |
| `src/modules/identity/infrastructure/postgres-session-repository.ts` | `IMP-061` |
| `src/modules/identity/infrastructure/postgres-user-repository.ts` | `IMP-061` |
| `src/modules/identity/ports/session-repository.ts` | `IMP-060` |
| `src/modules/identity/ports/user-repository.ts` | `IMP-060` |
| `src/modules/identity/security/argon2-password-hasher.ts` | `IMP-062` |
| `src/modules/identity/security/password-hasher.ts` | `IMP-062` |
| `src/modules/laboratory/application/approve-lab-test.ts` | `IMP-132` |
| `src/modules/laboratory/application/create-lab-test.ts` | `IMP-131` |
| `src/modules/laboratory/application/create-retest.ts` | `IMP-133` |
| `src/modules/laboratory/application/get-lab-test.ts` | `IMP-131` |
| `src/modules/laboratory/application/get-retest-context.ts` | `IMP-133` |
| `src/modules/laboratory/application/list-lab-tests.ts` | `IMP-131` |
| `src/modules/laboratory/application/return-lab-test.ts` | `IMP-132` |
| `src/modules/laboratory/application/review-lab-test.ts` | `IMP-132` |
| `src/modules/laboratory/application/save-measurements.ts` | `IMP-131` |
| `src/modules/laboratory/application/submit-lab-test.ts` | `IMP-131` |
| `src/modules/laboratory/domain/lab-state.ts` | `IMP-130` |
| `src/modules/laboratory/domain/lab-test.ts` | `IMP-130` |
| `src/modules/laboratory/domain/measurement.ts` | `IMP-130` |
| `src/modules/laboratory/domain/retest.ts` | `IMP-133` |
| `src/modules/laboratory/infrastructure/postgres-repository.ts` | `IMP-130` |
| `src/modules/laboratory/ports/repository.ts` | `IMP-130` |
| `src/modules/quality/application/get-quality-overview.ts` | `IMP-114` |
| `src/modules/quality/capa/application/create-capa.ts` | `IMP-113` |
| `src/modules/quality/capa/application/get-capa.ts` | `IMP-113` |
| `src/modules/quality/capa/application/list-capa.ts` | `IMP-113` |
| `src/modules/quality/capa/application/transition-capa.ts` | `IMP-113` |
| `src/modules/quality/capa/domain/capa.ts` | `IMP-113` |
| `src/modules/quality/capa/infrastructure/postgres-repository.ts` | `IMP-113` |
| `src/modules/quality/capa/ports/repository.ts` | `IMP-113` |
| `src/modules/quality/findings/application/create-finding.ts` | `IMP-110` |
| `src/modules/quality/findings/application/get-finding.ts` | `IMP-110` |
| `src/modules/quality/findings/application/list-findings.ts` | `IMP-110` |
| `src/modules/quality/findings/application/transition-finding.ts` | `IMP-110` |
| `src/modules/quality/findings/domain/finding.ts` | `IMP-110` |
| `src/modules/quality/findings/infrastructure/postgres-repository.ts` | `IMP-110` |
| `src/modules/quality/findings/ports/repository.ts` | `IMP-110` |
| `src/modules/quality/infrastructure/postgres-quality-overview.ts` | `IMP-114` |
| `src/modules/quality/ncr/application/create-ncr.ts` | `IMP-111` |
| `src/modules/quality/ncr/application/get-ncr.ts` | `IMP-111` |
| `src/modules/quality/ncr/application/list-ncr.ts` | `IMP-111` |
| `src/modules/quality/ncr/application/transition-ncr.ts` | `IMP-111` |
| `src/modules/quality/ncr/domain/ncr.ts` | `IMP-111` |
| `src/modules/quality/ncr/infrastructure/postgres-repository.ts` | `IMP-111` |
| `src/modules/quality/ncr/ports/repository.ts` | `IMP-111` |
| `src/modules/quality/rca/application/get-rca.ts` | `IMP-112` |
| `src/modules/quality/rca/application/list-rca.ts` | `IMP-112` |
| `src/modules/quality/rca/application/transition-rca.ts` | `IMP-112` |
| `src/modules/quality/rca/application/update-rca.ts` | `IMP-112` |
| `src/modules/quality/rca/domain/rca.ts` | `IMP-112` |
| `src/modules/quality/rca/infrastructure/postgres-repository.ts` | `IMP-112` |
| `src/modules/quality/rca/ports/repository.ts` | `IMP-112` |
| `src/modules/quarantine/application/get-quarantine-admin.ts` | `IMP-126` |
| `src/modules/quarantine/application/get-quarantine-overview.ts` | `IMP-126` |
| `src/modules/quarantine/infrastructure/postgres-quarantine-read-model.ts` | `IMP-126` |
| `src/modules/quarantine/inspection/application/approve-inspection.ts` | `IMP-124` |
| `src/modules/quarantine/inspection/application/get-inspection.ts` | `IMP-123` |
| `src/modules/quarantine/inspection/application/list-inspections.ts` | `IMP-123` |
| `src/modules/quarantine/inspection/application/return-inspection.ts` | `IMP-124` |
| `src/modules/quarantine/inspection/application/review-inspection.ts` | `IMP-124` |
| `src/modules/quarantine/inspection/application/save-inspection-draft.ts` | `IMP-123` |
| `src/modules/quarantine/inspection/application/start-inspection.ts` | `IMP-123` |
| `src/modules/quarantine/inspection/application/submit-inspection.ts` | `IMP-123` |
| `src/modules/quarantine/inspection/domain/inspection-result.ts` | `IMP-122` |
| `src/modules/quarantine/inspection/domain/inspection-state.ts` | `IMP-122` |
| `src/modules/quarantine/inspection/domain/inspection.ts` | `IMP-122` |
| `src/modules/quarantine/inspection/infrastructure/postgres-repository.ts` | `IMP-122` |
| `src/modules/quarantine/inspection/ports/repository.ts` | `IMP-122` |
| `src/modules/quarantine/receiving/application/create-receiving.ts` | `IMP-121` |
| `src/modules/quarantine/receiving/application/get-receiving.ts` | `IMP-121` |
| `src/modules/quarantine/receiving/application/hold-receiving.ts` | `IMP-125` |
| `src/modules/quarantine/receiving/application/list-receiving.ts` | `IMP-121` |
| `src/modules/quarantine/receiving/application/release-receiving.ts` | `IMP-125` |
| `src/modules/quarantine/receiving/application/transition-receiving.ts` | `IMP-121` |
| `src/modules/quarantine/receiving/application/update-receiving-draft.ts` | `IMP-121` |
| `src/modules/quarantine/receiving/domain/receiving-item.ts` | `IMP-120` |
| `src/modules/quarantine/receiving/domain/receiving-state.ts` | `IMP-120` |
| `src/modules/quarantine/receiving/infrastructure/postgres-repository.ts` | `IMP-120` |
| `src/modules/quarantine/receiving/ports/repository.ts` | `IMP-120` |
| `src/modules/reporting/application/export-report.ts` | `IMP-096` |
| `src/modules/reporting/application/report-registry.ts` | `IMP-095` |
| `src/modules/reporting/application/run-report.ts` | `IMP-095` |
| `src/modules/reporting/domain/report-definition.ts` | `IMP-095` |
| `src/modules/reporting/infrastructure/csv-exporter.ts` | `IMP-096` |
| `src/modules/reporting/infrastructure/postgres-report-query.ts` | `IMP-095` |
| `src/modules/reporting/infrastructure/xlsx-exporter.ts` | `IMP-096` |
| `src/modules/reporting/ports/report-query.ts` | `IMP-095` |
| `src/modules/system-health/application/get-system-health.ts` | `IMP-180` |
| `src/modules/tasks/application/create.ts` | `IMP-102` |
| `src/modules/tasks/application/get.ts` | `IMP-102` |
| `src/modules/tasks/application/list.ts` | `IMP-102` |
| `src/modules/tasks/application/transition.ts` | `IMP-102` |
| `src/modules/tasks/application/update-draft.ts` | `IMP-102` |
| `src/modules/tasks/domain/model.ts` | `IMP-100` |
| `src/modules/tasks/domain/state.ts` | `IMP-100` |
| `src/modules/tasks/infrastructure/postgres-repository.ts` | `IMP-101` |
| `src/modules/tasks/ports/repository.ts` | `IMP-100` |
| `src/pages/404.astro` | `IMP-089` |
| `src/pages/500.astro` | `IMP-089` |
| `src/pages/account.astro` | `IMP-067` |
| `src/pages/admin/index.astro` | `IMP-170` |
| `src/pages/admin/permissions.astro` | `IMP-171` |
| `src/pages/admin/roles/[roleId].astro` | `IMP-171` |
| `src/pages/admin/roles/index.astro` | `IMP-171` |
| `src/pages/admin/scopes.astro` | `IMP-171` |
| `src/pages/admin/users/[userId].astro` | `IMP-170` |
| `src/pages/admin/users/index.astro` | `IMP-170` |
| `src/pages/admin/users/new.astro` | `IMP-170` |
| `src/pages/ai-advisory.astro` | `IMP-191` |
| `src/pages/api/health/live.ts` | `IMP-052` |
| `src/pages/api/health/ready.ts` | `IMP-052` |
| `src/pages/approvals/[approvalId].astro` | `IMP-163` |
| `src/pages/approvals/index.astro` | `IMP-163` |
| `src/pages/assets/calibrations/[calibrationId].astro` | `IMP-144` |
| `src/pages/assets/calibrations/index.astro` | `IMP-144` |
| `src/pages/assets/calibrations/new.astro` | `IMP-144` |
| `src/pages/assets/equipment/[equipmentId].astro` | `IMP-144` |
| `src/pages/assets/equipment/index.astro` | `IMP-144` |
| `src/pages/assets/equipment/new.astro` | `IMP-144` |
| `src/pages/assets/index.astro` | `IMP-144` |
| `src/pages/assets/maintenance/[maintenanceId].astro` | `IMP-144` |
| `src/pages/assets/maintenance/index.astro` | `IMP-144` |
| `src/pages/assets/maintenance/new.astro` | `IMP-144` |
| `src/pages/audit.astro` | `IMP-094` |
| `src/pages/change-requests/[changeRequestId]/index.astro` | `IMP-165` |
| `src/pages/change-requests/[changeRequestId]/review.astro` | `IMP-165` |
| `src/pages/change-requests/index.astro` | `IMP-165` |
| `src/pages/change-requests/new.astro` | `IMP-165` |
| `src/pages/dashboard/index.astro` | `IMP-091` |
| `src/pages/documents/[documentId]/index.astro` | `IMP-153` |
| `src/pages/documents/[documentId]/versions/[versionId]/index.astro` | `IMP-153` |
| `src/pages/documents/[documentId]/versions/[versionId]/review.astro` | `IMP-153` |
| `src/pages/documents/[documentId]/versions/new.astro` | `IMP-153` |
| `src/pages/documents/index.astro` | `IMP-153` |
| `src/pages/documents/new.astro` | `IMP-153` |
| `src/pages/index.astro` | `IMP-089` |
| `src/pages/laboratory/index.astro` | `IMP-134` |
| `src/pages/laboratory/tests/[labTestId]/execute.astro` | `IMP-134` |
| `src/pages/laboratory/tests/[labTestId]/index.astro` | `IMP-134` |
| `src/pages/laboratory/tests/[labTestId]/retests/new.astro` | `IMP-134` |
| `src/pages/laboratory/tests/[labTestId]/review.astro` | `IMP-134` |
| `src/pages/laboratory/tests/index.astro` | `IMP-134` |
| `src/pages/laboratory/tests/new.astro` | `IMP-134` |
| `src/pages/login.astro` | `IMP-067` |
| `src/pages/notifications.astro` | `IMP-093` |
| `src/pages/quality/capa/[capaId].astro` | `IMP-115` |
| `src/pages/quality/capa/index.astro` | `IMP-115` |
| `src/pages/quality/capa/new.astro` | `IMP-115` |
| `src/pages/quality/findings/[findingId].astro` | `IMP-115` |
| `src/pages/quality/findings/index.astro` | `IMP-115` |
| `src/pages/quality/findings/new.astro` | `IMP-115` |
| `src/pages/quality/index.astro` | `IMP-114` |
| `src/pages/quality/ncr/[ncrId].astro` | `IMP-115` |
| `src/pages/quality/ncr/index.astro` | `IMP-115` |
| `src/pages/quality/ncr/new.astro` | `IMP-115` |
| `src/pages/quality/rca/[rcaId].astro` | `IMP-115` |
| `src/pages/quality/rca/index.astro` | `IMP-115` |
| `src/pages/quarantine/admin/index.astro` | `IMP-127` |
| `src/pages/quarantine/index.astro` | `IMP-127` |
| `src/pages/quarantine/inspections/[inspectionId]/execute.astro` | `IMP-127` |
| `src/pages/quarantine/inspections/[inspectionId]/index.astro` | `IMP-127` |
| `src/pages/quarantine/inspections/[inspectionId]/review.astro` | `IMP-127` |
| `src/pages/quarantine/inspections/index.astro` | `IMP-127` |
| `src/pages/quarantine/receiving/[receivingId].astro` | `IMP-127` |
| `src/pages/quarantine/receiving/index.astro` | `IMP-127` |
| `src/pages/quarantine/receiving/new.astro` | `IMP-127` |
| `src/pages/reports/[reportCode].astro` | `IMP-097` |
| `src/pages/reports/index.astro` | `IMP-097` |
| `src/pages/search.astro` | `IMP-093` |
| `src/pages/system/backups/[backupId]/index.astro` | `IMP-183` |
| `src/pages/system/backups/[backupId]/restore.astro` | `IMP-183` |
| `src/pages/system/backups/index.astro` | `IMP-183` |
| `src/pages/system/health.astro` | `IMP-180` |
| `src/pages/tasks/[taskId].astro` | `IMP-103` |
| `src/pages/tasks/index.astro` | `IMP-103` |
| `src/pages/tasks/new.astro` | `IMP-103` |
| `src/shared/audit/audit-event.ts` | `IMP-045` |
| `src/shared/audit/audit-query.ts` | `IMP-094` |
| `src/shared/audit/audit-repository.ts` | `IMP-045` |
| `src/shared/audit/audit-service.ts` | `IMP-045` |
| `src/shared/audit/postgres-audit-query.ts` | `IMP-094` |
| `src/shared/audit/postgres-audit-repository.ts` | `IMP-045` |
| `src/shared/authorization/authorize.ts` | `IMP-044` |
| `src/shared/authorization/decision.ts` | `IMP-043` |
| `src/shared/authorization/permissions.ts` | `IMP-043` |
| `src/shared/authorization/policy-registry.ts` | `IMP-044` |
| `src/shared/authorization/scope-evaluator.ts` | `IMP-044` |
| `src/shared/authorization/scopes.ts` | `IMP-043` |
| `src/shared/authorization/sod.ts` | `IMP-044` |
| `src/shared/authorization/types.ts` | `IMP-043` |
| `src/shared/concurrency/version.ts` | `IMP-041` |
| `src/shared/database/database.ts` | `IMP-013` |
| `src/shared/database/db-types.ts` | `IMP-013` |
| `src/shared/database/pool.ts` | `IMP-013` |
| `src/shared/database/transaction.ts` | `IMP-013` |
| `src/shared/errors/action-error.ts` | `IMP-012` |
| `src/shared/errors/app-error.ts` | `IMP-012` |
| `src/shared/errors/error-codes.ts` | `IMP-012` |
| `src/shared/errors/problem-details.ts` | `IMP-012` |
| `src/shared/files/file-record.ts` | `IMP-048` |
| `src/shared/files/file-repository.ts` | `IMP-048` |
| `src/shared/files/file-service.ts` | `IMP-048` |
| `src/shared/files/local-object-store.ts` | `IMP-049` |
| `src/shared/files/object-store.ts` | `IMP-048` |
| `src/shared/files/postgres-file-repository.ts` | `IMP-048` |
| `src/shared/files/s3-object-store.ts` | `IMP-049` |
| `src/shared/files/sha256.ts` | `IMP-048` |
| `src/shared/http/request-context.ts` | `IMP-042` |
| `src/shared/http/safe-return-to.ts` | `IMP-042` |
| `src/shared/id/uuid.ts` | `IMP-011` |
| `src/shared/idempotency/idempotency-repository.ts` | `IMP-041` |
| `src/shared/idempotency/idempotency-service.ts` | `IMP-041` |
| `src/shared/idempotency/postgres-idempotency-repository.ts` | `IMP-041` |
| `src/shared/notifications/notification-repository.ts` | `IMP-047` |
| `src/shared/notifications/notification-service.ts` | `IMP-047` |
| `src/shared/notifications/notification.ts` | `IMP-047` |
| `src/shared/notifications/postgres-notification-repository.ts` | `IMP-047` |
| `src/shared/observability/context.ts` | `IMP-050` |
| `src/shared/observability/health.ts` | `IMP-052` |
| `src/shared/observability/instrumentation/postgres.ts` | `IMP-051` |
| `src/shared/observability/logger.ts` | `IMP-050` |
| `src/shared/observability/metrics.ts` | `IMP-051` |
| `src/shared/observability/redaction.ts` | `IMP-050` |
| `src/shared/observability/security-events.ts` | `IMP-050` |
| `src/shared/observability/telemetry.ts` | `IMP-051` |
| `src/shared/observability/tracing.ts` | `IMP-051` |
| `src/shared/outbox/outbox-event.ts` | `IMP-046` |
| `src/shared/outbox/outbox-repository.ts` | `IMP-046` |
| `src/shared/outbox/postgres-outbox-repository.ts` | `IMP-046` |
| `src/shared/outbox/worker.ts` | `IMP-046` |
| `src/shared/pagination/page.ts` | `IMP-011` |
| `src/shared/search/postgres-search.ts` | `IMP-092` |
| `src/shared/search/search-result.ts` | `IMP-092` |
| `src/shared/search/search-service.ts` | `IMP-092` |
| `src/shared/security/constant-time.ts` | `IMP-053` |
| `src/shared/security/headers.ts` | `IMP-053` |
| `src/shared/security/origin.ts` | `IMP-053` |
| `src/shared/security/postgres-rate-limit-store.ts` | `IMP-201` |
| `src/shared/security/rate-limit-store.ts` | `IMP-201` |
| `src/shared/security/rate-limit.ts` | `IMP-201` |
| `src/shared/time/clock.ts` | `IMP-011` |
| `src/shared/time/riyadh.ts` | `IMP-011` |
| `src/shared/validation/common-schemas.ts` | `IMP-040` |
| `src/shared/validation/parse.ts` | `IMP-040` |
| `src/ui/charts/Chart.astro` | `IMP-088` |
| `src/ui/charts/KpiCard.astro` | `IMP-088` |
| `src/ui/charts/Legend.astro` | `IMP-088` |
| `src/ui/charts/chart-client.ts` | `IMP-088` |
| `src/ui/client/dialog.ts` | `IMP-086` |
| `src/ui/client/e-signature.ts` | `IMP-087` |
| `src/ui/client/toast.ts` | `IMP-086` |
| `src/ui/components/Badge.astro` | `IMP-082` |
| `src/ui/components/Button.astro` | `IMP-082` |
| `src/ui/components/Card.astro` | `IMP-082` |
| `src/ui/components/Divider.astro` | `IMP-082` |
| `src/ui/components/IconButton.astro` | `IMP-082` |
| `src/ui/components/StateBanner.astro` | `IMP-082` |
| `src/ui/components/StatusBadge.astro` | `IMP-082` |
| `src/ui/components/Tooltip.astro` | `IMP-082` |
| `src/ui/components/data/DataTable.astro` | `IMP-084` |
| `src/ui/components/data/EmptyTableState.astro` | `IMP-084` |
| `src/ui/components/data/FilterBar.astro` | `IMP-084` |
| `src/ui/components/data/Pagination.astro` | `IMP-084` |
| `src/ui/components/data/SortHeader.astro` | `IMP-084` |
| `src/ui/components/data/TableToolbar.astro` | `IMP-084` |
| `src/ui/components/feedback/ConfirmDialog.astro` | `IMP-086` |
| `src/ui/components/feedback/EmptyState.astro` | `IMP-086` |
| `src/ui/components/feedback/ErrorState.astro` | `IMP-086` |
| `src/ui/components/feedback/LoadingState.astro` | `IMP-086` |
| `src/ui/components/feedback/StaleVersionState.astro` | `IMP-086` |
| `src/ui/components/feedback/ToastRegion.astro` | `IMP-086` |
| `src/ui/components/forms/Checkbox.astro` | `IMP-083` |
| `src/ui/components/forms/DateInput.astro` | `IMP-083` |
| `src/ui/components/forms/ErrorSummary.astro` | `IMP-083` |
| `src/ui/components/forms/FormActions.astro` | `IMP-083` |
| `src/ui/components/forms/FormField.astro` | `IMP-083` |
| `src/ui/components/forms/NumberInput.astro` | `IMP-083` |
| `src/ui/components/forms/Select.astro` | `IMP-083` |
| `src/ui/components/forms/TextArea.astro` | `IMP-083` |
| `src/ui/components/forms/TextInput.astro` | `IMP-083` |
| `src/ui/components/governance/ESignatureDialog.astro` | `IMP-087` |
| `src/ui/layouts/AppLayout.astro` | `IMP-081` |
| `src/ui/layouts/AuthLayout.astro` | `IMP-081` |
| `src/ui/layouts/BaseLayout.astro` | `IMP-081` |
| `src/ui/navigation/navigation.ts` | `IMP-085` |
| `src/ui/shell/Breadcrumbs.astro` | `IMP-085` |
| `src/ui/shell/ScopeIndicator.astro` | `IMP-085` |
| `src/ui/shell/Sidebar.astro` | `IMP-085` |
| `src/ui/shell/Topbar.astro` | `IMP-085` |
| `src/ui/shell/UserMenu.astro` | `IMP-085` |
| `src/ui/styles/density.css` | `IMP-080` |
| `src/ui/styles/global.css` | `IMP-080` |
| `src/ui/styles/motion.css` | `IMP-080` |
| `src/ui/styles/tokens.css` | `IMP-080` |
| `tests/e2e/accessibility.spec.ts` | `IMP-213` |
| `tests/e2e/ai-advisory.spec.ts` | `IMP-192` |
| `tests/e2e/assets.spec.ts` | `IMP-145` |
| `tests/e2e/authorization-matrix.spec.ts` | `IMP-210` |
| `tests/e2e/critical-workflows.spec.ts` | `IMP-211` |
| `tests/e2e/documents.spec.ts` | `IMP-154` |
| `tests/e2e/error-recovery.spec.ts` | `IMP-214` |
| `tests/e2e/files-reports.spec.ts` | `IMP-212` |
| `tests/e2e/governance.spec.ts` | `IMP-166` |
| `tests/e2e/laboratory.spec.ts` | `IMP-135` |
| `tests/e2e/quality.spec.ts` | `IMP-116` |
| `tests/e2e/quarantine.spec.ts` | `IMP-128` |
| `tests/e2e/responsive.spec.ts` | `IMP-213` |
| `tests/e2e/security-headers.spec.ts` | `IMP-200` |
| `tests/e2e/tasks.spec.ts` | `IMP-104` |
| `tests/helpers/factories.ts` | `IMP-029` |
| `tests/helpers/postgres-container.ts` | `IMP-005` |
| `tests/helpers/test-env.ts` | `IMP-005` |
| `tests/integration/actions/admin-actions.test.ts` | `IMP-072` |
| `tests/integration/actions/auth-actions.test.ts` | `IMP-066` |
| `tests/integration/administration/authorization-repository.test.ts` | `IMP-070` |
| `tests/integration/administration/authorization-use-cases.test.ts` | `IMP-071` |
| `tests/integration/ai-advisory/security.test.ts` | `IMP-192` |
| `tests/integration/approvals/authorization-matrix.test.ts` | `IMP-166` |
| `tests/integration/approvals/orchestration.test.ts` | `IMP-161` |
| `tests/integration/approvals/repository.test.ts` | `IMP-160` |
| `tests/integration/assets/authorization-matrix.test.ts` | `IMP-145` |
| `tests/integration/assets/calibration.test.ts` | `IMP-141` |
| `tests/integration/assets/equipment-eligibility.test.ts` | `IMP-143` |
| `tests/integration/assets/equipment.test.ts` | `IMP-140` |
| `tests/integration/assets/maintenance.test.ts` | `IMP-142` |
| `tests/integration/change-requests/change-requests.test.ts` | `IMP-164` |
| `tests/integration/concurrency/controlled-mutations.test.ts` | `IMP-203` |
| `tests/integration/concurrency/idempotency.test.ts` | `IMP-203` |
| `tests/integration/dashboard/dashboard-query.test.ts` | `IMP-090` |
| `tests/integration/database/constraints.test.ts` | `IMP-030` |
| `tests/integration/database/migrations.test.ts` | `IMP-030` |
| `tests/integration/database/upgrade-path.test.ts` | `IMP-030` |
| `tests/integration/documents/authorization-matrix.test.ts` | `IMP-154` |
| `tests/integration/documents/editing.test.ts` | `IMP-151` |
| `tests/integration/documents/repository.test.ts` | `IMP-150` |
| `tests/integration/documents/review.test.ts` | `IMP-152` |
| `tests/integration/e-signatures/signature.test.ts` | `IMP-162` |
| `tests/integration/http/auth-middleware.test.ts` | `IMP-068` |
| `tests/integration/http/health.test.ts` | `IMP-052` |
| `tests/integration/http/middleware.test.ts` | `IMP-042` |
| `tests/integration/identity/account.test.ts` | `IMP-064` |
| `tests/integration/identity/admin-user-lifecycle.test.ts` | `IMP-065` |
| `tests/integration/identity/auth-use-cases.test.ts` | `IMP-063` |
| `tests/integration/identity/repositories.test.ts` | `IMP-061` |
| `tests/integration/identity/session-service.test.ts` | `IMP-062` |
| `tests/integration/laboratory/authorization-matrix.test.ts` | `IMP-135` |
| `tests/integration/laboratory/execution.test.ts` | `IMP-131` |
| `tests/integration/laboratory/repository.test.ts` | `IMP-130` |
| `tests/integration/laboratory/retest.test.ts` | `IMP-133` |
| `tests/integration/laboratory/review.test.ts` | `IMP-132` |
| `tests/integration/laboratory/scientific-boundaries.test.ts` | `IMP-135` |
| `tests/integration/observability/correlation.test.ts` | `IMP-202` |
| `tests/integration/quality/authorization-matrix.test.ts` | `IMP-116` |
| `tests/integration/quality/capa.test.ts` | `IMP-113` |
| `tests/integration/quality/findings.test.ts` | `IMP-110` |
| `tests/integration/quality/ncr.test.ts` | `IMP-111` |
| `tests/integration/quality/rca.test.ts` | `IMP-112` |
| `tests/integration/quarantine/authorization-matrix.test.ts` | `IMP-128` |
| `tests/integration/quarantine/inspection-execution.test.ts` | `IMP-123` |
| `tests/integration/quarantine/inspection-repository.test.ts` | `IMP-122` |
| `tests/integration/quarantine/inspection-review.test.ts` | `IMP-124` |
| `tests/integration/quarantine/read-models.test.ts` | `IMP-126` |
| `tests/integration/quarantine/receiving-repository.test.ts` | `IMP-120` |
| `tests/integration/quarantine/receiving-use-cases.test.ts` | `IMP-121` |
| `tests/integration/quarantine/release-state.test.ts` | `IMP-125` |
| `tests/integration/reporting/export-report.test.ts` | `IMP-096` |
| `tests/integration/reporting/reports.test.ts` | `IMP-095` |
| `tests/integration/security/rate-limit.test.ts` | `IMP-201` |
| `tests/integration/shared/audit-query.test.ts` | `IMP-094` |
| `tests/integration/shared/audit.test.ts` | `IMP-045` |
| `tests/integration/shared/files.test.ts` | `IMP-048` |
| `tests/integration/shared/idempotency.test.ts` | `IMP-041` |
| `tests/integration/shared/notifications.test.ts` | `IMP-047` |
| `tests/integration/shared/object-store.test.ts` | `IMP-049` |
| `tests/integration/shared/outbox.test.ts` | `IMP-046` |
| `tests/integration/shared/search.test.ts` | `IMP-092` |
| `tests/integration/system/backup-catalog.test.ts` | `IMP-181` |
| `tests/integration/system/restore-authorization.test.ts` | `IMP-182` |
| `tests/integration/system/system-health.test.ts` | `IMP-180` |
| `tests/integration/tasks/authorization-matrix.test.ts` | `IMP-104` |
| `tests/integration/tasks/repository.test.ts` | `IMP-101` |
| `tests/integration/tasks/use-cases.test.ts` | `IMP-102` |
| `tests/performance/smoke.mjs` | `IMP-215` |
| `tests/setup/unit.ts` | `IMP-005` |
| `tests/uat/README.md` | `IMP-230` |
| `tests/uat/acceptance.test.ts` | `IMP-231` |
| `tests/uat/actors.ts` | `IMP-230` |
| `tests/uat/scenarios.ts` | `IMP-230` |
| `tests/unit/ai-advisory/advisory.test.ts` | `IMP-190` |
| `tests/unit/i18n/i18n.test.ts` | `IMP-054` |
| `tests/unit/identity/password-hasher.test.ts` | `IMP-062` |
| `tests/unit/identity/user.test.ts` | `IMP-060` |
| `tests/unit/release/release-id.test.ts` | `IMP-220` |
| `tests/unit/reporting/export-safety.test.ts` | `IMP-096` |
| `tests/unit/shared/authorization-types.test.ts` | `IMP-043` |
| `tests/unit/shared/authorize.test.ts` | `IMP-044` |
| `tests/unit/shared/metrics-cardinality.test.ts` | `IMP-051` |
| `tests/unit/shared/redaction.test.ts` | `IMP-050` |
| `tests/unit/shared/safe-return-to.test.ts` | `IMP-042` |
| `tests/unit/shared/security-http.test.ts` | `IMP-053` |
| `tests/unit/shared/sod.test.ts` | `IMP-044` |
| `tests/unit/shared/validation.test.ts` | `IMP-040` |
| `tests/unit/tasks/domain.test.ts` | `IMP-100` |
| `tsconfig.json` | `IMP-003` |
| `vitest.config.ts` | `IMP-005` |

**Unique concrete planned paths indexed:** 587

---

# 6. Deferred / Forbidden-to-Invent Areas

| Area | Files/config | Rule |
|---|---|---|
| Password recovery/reset | `src/pages/auth/recovery.astro`, `src/pages/auth/reset/[requestId].astro` and related Actions/use cases | DEFERRED until authentication recovery policy is approved. |
| Production AI provider | Provider SDK adapter/config files | Provider not selected; core uses provider port + disabled adapter. |
| PostgreSQL hosting provider | Provider-specific DB/IaC configuration | Still requires explicit production infrastructure decision. |
| Object-storage provider | Provider-specific object-storage infrastructure | S3-compatible application port exists; actual provider must be approved. |
| Secrets/KMS provider | Provider-specific secret/key infrastructure | Must be selected with deployment/security architecture. |
| Telemetry backend/Collector topology | Provider-specific observability deployment | OTel/OTLP is canonical; backend/topology remains deployment-specific. |
| HA/cross-region failover | Standby/replication/failover configuration | HA topology and RPO/RTO remain policy/deployment dependent. |
| Production restore/e-sign authority | Policy/grant records | Authority is POLICY-DEPENDENT and defaults to DENY. |
| Unapproved scientific master data | Limits/formulas/rounding/sampling/calibration intervals | Must come from controlled QC/company sources; never invented. |

---

# 7. Universal Codex Contract

```text
REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.
```

---

# Phase 0 — Foundation Closure

## IMP-000 — Normalize UI/UX and Route Manifest approval metadata

**Files in scope:**
- Modify: Documents/UI-UX-SPECIFICATION.md
- Modify: Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Modify: .agents/mind/01-mind-latest.md

**Required specs:**
- `Documents/DESIGN-SYSTEM.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`

**Acceptance requirements:**
- Do not alter routes/UI requirements/business behavior.
- Remove stale Draft/APPROVAL wording and use an APPROVED Foundation baseline status.
- Update Project Mind canonical Foundation list.

**Required verification:**
- Re-read first 30 lines of both docs.
- Search for stale `DRAFT FOR APPROVAL`, `Draft for Approval`, and bare `Status: APPROVAL`; expect none.
- Verify Mind list.

### Copy-ready Codex prompt

```text
TASK ID: IMP-000
TITLE: Normalize UI/UX and Route Manifest approval metadata

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DESIGN-SYSTEM.md
- Documents/UI-UX-SPECIFICATION.md
- Documents/ROUTE-MANIFEST-SPECIFICATION.md

MISSION:
Normalize metadata only so the two already user-approved specs are represented as APPROVED baselines.

FILES IN SCOPE:
- Modify: Documents/UI-UX-SPECIFICATION.md
- Modify: Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Modify: .agents/mind/01-mind-latest.md

NON-NEGOTIABLE REQUIREMENTS:
1. Do not alter routes/UI requirements/business behavior.
2. Remove stale Draft/APPROVAL wording and use an APPROVED Foundation baseline status.
3. Update Project Mind canonical Foundation list.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Re-read first 30 lines of both docs.
- Search for stale `DRAFT FOR APPROVAL`, `Draft for Approval`, and bare `Status: APPROVAL`; expect none.
- Verify Mind list.

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-001 — Repository hygiene

**Preconditions:** `IMP-000`

**Files in scope:**
- Create: .gitignore
- Create: .gitattributes
- Create: .editorconfig
- Create: .prettierignore
- Remove only when separately authorized: tracked .DS_Store files

**Required specs:**
- `AGENTS.md`
- `Documents/DEPLOYMENT-ARCHITECTURE.md`

**Acceptance requirements:**
- Ignore Node/Astro/build/test/local-env/OS/IDE artifacts.
- Never ignore Documents, .agents, migrations, lockfiles, tests or evidence templates.
- Do not delete tracked files unless explicitly authorized.

**Required verification:**
- git status --short
- git check-ignore -v on representative generated paths

### Copy-ready Codex prompt

```text
TASK ID: IMP-001
TITLE: Repository hygiene

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- AGENTS.md
- Documents/DEPLOYMENT-ARCHITECTURE.md

PRECONDITIONS:
- IMP-000 must already be accepted in current repository reality.

MISSION:
Prepare repository hygiene for a documentation-only repository before code scaffolding.

FILES IN SCOPE:
- Create: .gitignore
- Create: .gitattributes
- Create: .editorconfig
- Create: .prettierignore
- Remove only when separately authorized: tracked .DS_Store files

NON-NEGOTIABLE REQUIREMENTS:
1. Ignore Node/Astro/build/test/local-env/OS/IDE artifacts.
2. Never ignore Documents, .agents, migrations, lockfiles, tests or evidence templates.
3. Do not delete tracked files unless explicitly authorized.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- git status --short
- git check-ignore -v on representative generated paths

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

---

# Phase 0 — Bootstrap

## IMP-002 — Create package.json and pin toolchain

**Preconditions:** `IMP-001`

**Files in scope:**
- Create: package.json
- Generate: pnpm-lock.yaml
- Create: .node-version
- Create: .npmrc

**Required specs:**
- `Documents/ARCHITECTURE-SPECIFICATION.md`
- `Documents/TESTING-STRATEGY.md`
- `Documents/OBSERVABILITY-ARCHITECTURE.md`

**Acceptance requirements:**
- Use Node 24 LTS line; verify latest supported 24.x patch at execution time.
- Use pnpm/Corepack with exact packageManager version.
- Use Astro 7.x + @astrojs/node server/on-demand.
- Runtime families: astro/node adapter, kysely, pg, zod, password/session support, structured logger, OpenTelemetry. Dev: TypeScript, ESLint, Prettier, Vitest 5.x, coverage, Playwright, Testcontainers, tsx, types, accessibility E2E tooling.
- Do not add React/Vue/Svelte by default.
- Scripts: dev, build, preview, typecheck, lint, format:check, test, test:unit, test:integration, test:e2e, test:coverage, db:migrate, db:migrate:check.

**Required verification:**
- node --version
- pnpm --version
- pnpm exec astro --version
- pnpm install --frozen-lockfile after initial lock generation

### Copy-ready Codex prompt

```text
TASK ID: IMP-002
TITLE: Create package.json and pin toolchain

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/ARCHITECTURE-SPECIFICATION.md
- Documents/TESTING-STRATEGY.md
- Documents/OBSERVABILITY-ARCHITECTURE.md

PRECONDITIONS:
- IMP-001 must already be accepted in current repository reality.

MISSION:
Bootstrap from zero; there is no package.json. Pin stable compatible dependencies instead of floating `latest`.

FILES IN SCOPE:
- Create: package.json
- Generate: pnpm-lock.yaml
- Create: .node-version
- Create: .npmrc

NON-NEGOTIABLE REQUIREMENTS:
1. Use Node 24 LTS line; verify latest supported 24.x patch at execution time.
2. Use pnpm/Corepack with exact packageManager version.
3. Use Astro 7.x + @astrojs/node server/on-demand.
4. Runtime families: astro/node adapter, kysely, pg, zod, password/session support, structured logger, OpenTelemetry. Dev: TypeScript, ESLint, Prettier, Vitest 5.x, coverage, Playwright, Testcontainers, tsx, types, accessibility E2E tooling.
5. Do not add React/Vue/Svelte by default.
6. Scripts: dev, build, preview, typecheck, lint, format:check, test, test:unit, test:integration, test:e2e, test:coverage, db:migrate, db:migrate:check.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- node --version
- pnpm --version
- pnpm exec astro --version
- pnpm install --frozen-lockfile after initial lock generation

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-003 — Astro/TypeScript/environment skeleton

**Preconditions:** `IMP-002`

**Files in scope:**
- Create: astro.config.mjs
- Create: tsconfig.json
- Create: src/env.d.ts
- Create: .env.example

**Required specs:**
- `Documents/ARCHITECTURE-SPECIFICATION.md`
- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/DEPLOYMENT-ARCHITECTURE.md`

**Acceptance requirements:**
- No secrets in config/client.
- Document variable names only in .env.example.
- Keep provider-specific deployment out.

**Required verification:**
- pnpm exec astro check when available
- pnpm typecheck

### Copy-ready Codex prompt

```text
TASK ID: IMP-003
TITLE: Astro/TypeScript/environment skeleton

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/ARCHITECTURE-SPECIFICATION.md
- Documents/SECURITY-ARCHITECTURE.md
- Documents/DEPLOYMENT-ARCHITECTURE.md

PRECONDITIONS:
- IMP-002 must already be accepted in current repository reality.

MISSION:
Configure Astro server/on-demand with strict TypeScript and safe environment names only.

FILES IN SCOPE:
- Create: astro.config.mjs
- Create: tsconfig.json
- Create: src/env.d.ts
- Create: .env.example

NON-NEGOTIABLE REQUIREMENTS:
1. No secrets in config/client.
2. Document variable names only in .env.example.
3. Keep provider-specific deployment out.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- pnpm exec astro check when available
- pnpm typecheck

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-004 — Lint/format baseline

**Preconditions:** `IMP-003`

**Files in scope:**
- Create: eslint.config.mjs
- Create: .prettierrc.json

**Required specs:**
- `AGENTS.md`
- `Documents/ARCHITECTURE-SPECIFICATION.md`

**Acceptance requirements:**
- Check unused/unsafe code and promises appropriately.
- Do not rewrite all existing docs.

**Required verification:**
- pnpm lint
- pnpm format:check

### Copy-ready Codex prompt

```text
TASK ID: IMP-004
TITLE: Lint/format baseline

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- AGENTS.md
- Documents/ARCHITECTURE-SPECIFICATION.md

PRECONDITIONS:
- IMP-003 must already be accepted in current repository reality.

MISSION:
Create deterministic checks for JS/TS/Astro without bulk-reformatting controlled Foundation docs.

FILES IN SCOPE:
- Create: eslint.config.mjs
- Create: .prettierrc.json

NON-NEGOTIABLE REQUIREMENTS:
1. Check unused/unsafe code and promises appropriately.
2. Do not rewrite all existing docs.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- pnpm lint
- pnpm format:check

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-005 — Vitest/Playwright/Testcontainers harness

**Preconditions:** `IMP-002`, `IMP-003`

**Files in scope:**
- Create: vitest.config.ts
- Create: playwright.config.ts
- Create: tests/setup/unit.ts
- Create: tests/helpers/postgres-container.ts
- Create: tests/helpers/test-env.ts

**Required specs:**
- `Documents/TESTING-STRATEGY.md`
- `Documents/DATABASE-ARCHITECTURE.md`
- `Documents/SECURITY-ARCHITECTURE.md`

**Acceptance requirements:**
- Integration tests use real PostgreSQL 18 Testcontainers.
- Separate unit/integration/E2E concerns.
- No production credentials.

**Required verification:**
- Unit smoke test
- PostgreSQL 18 SELECT version() integration smoke
- pnpm exec playwright --version

### Copy-ready Codex prompt

```text
TASK ID: IMP-005
TITLE: Vitest/Playwright/Testcontainers harness

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/TESTING-STRATEGY.md
- Documents/DATABASE-ARCHITECTURE.md
- Documents/SECURITY-ARCHITECTURE.md

PRECONDITIONS:
- IMP-002 must already be accepted in current repository reality.
- IMP-003 must already be accepted in current repository reality.

MISSION:
Establish test-first infrastructure before production features.

FILES IN SCOPE:
- Create: vitest.config.ts
- Create: playwright.config.ts
- Create: tests/setup/unit.ts
- Create: tests/helpers/postgres-container.ts
- Create: tests/helpers/test-env.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Integration tests use real PostgreSQL 18 Testcontainers.
2. Separate unit/integration/E2E concerns.
3. No production credentials.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Unit smoke test
- PostgreSQL 18 SELECT version() integration smoke
- pnpm exec playwright --version

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-006 — CI verification baseline

**Preconditions:** `IMP-005`

**Files in scope:**
- Create: .github/workflows/ci.yml

**Required specs:**
- `Documents/TESTING-STRATEGY.md`
- `Documents/DEPLOYMENT-ARCHITECTURE.md`
- `Documents/PRODUCTION-READINESS-CHECKLIST.md`

**Acceptance requirements:**
- Frozen install, architecture checks, format/lint/typecheck, unit/integration/migrations/build/E2E as they become available.
- Upload failure artifacts safely.
- No production deploy job.

**Required verification:**
- Validate YAML
- Run local command parity

### Copy-ready Codex prompt

```text
TASK ID: IMP-006
TITLE: CI verification baseline

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/TESTING-STRATEGY.md
- Documents/DEPLOYMENT-ARCHITECTURE.md
- Documents/PRODUCTION-READINESS-CHECKLIST.md

PRECONDITIONS:
- IMP-005 must already be accepted in current repository reality.

MISSION:
Create verification CI only; no deployment.

FILES IN SCOPE:
- Create: .github/workflows/ci.yml

NON-NEGOTIABLE REQUIREMENTS:
1. Frozen install, architecture checks, format/lint/typecheck, unit/integration/migrations/build/E2E as they become available.
2. Upload failure artifacts safely.
3. No production deploy job.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Validate YAML
- Run local command parity

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-007 — Architecture and route-manifest checkers

**Preconditions:** `IMP-004`

**Files in scope:**
- Create: scripts/architecture/check-boundaries.mjs
- Create: scripts/architecture/check-route-files.mjs

**Required specs:**
- `Documents/DOMAIN-MAP.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/ARCHITECTURE-SPECIFICATION.md`

**Acceptance requirements:**
- Reject database imports from pages/actions/UI.
- Encode approved route file tree; deferred/conditional routes are not forced.
- Exit nonzero with actionable paths.

**Required verification:**
- Run both scripts and record expected missing-route results until later phases

### Copy-ready Codex prompt

```text
TASK ID: IMP-007
TITLE: Architecture and route-manifest checkers

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DOMAIN-MAP.md
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/ARCHITECTURE-SPECIFICATION.md

PRECONDITIONS:
- IMP-004 must already be accepted in current repository reality.

MISSION:
Create machine checks for Delivery→DB/business-rule violations and route-file coverage.

FILES IN SCOPE:
- Create: scripts/architecture/check-boundaries.mjs
- Create: scripts/architecture/check-route-files.mjs

NON-NEGOTIABLE REQUIREMENTS:
1. Reject database imports from pages/actions/UI.
2. Encode approved route file tree; deferred/conditional routes are not forced.
3. Exit nonzero with actionable paths.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Run both scripts and record expected missing-route results until later phases

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

---

# Phase 1 — Database Foundation

## IMP-010 — Validated server runtime config

**Preconditions:** `IMP-003`, `IMP-005`

**Files in scope:**
- Create: src/config/env.ts
- Create: src/config/runtime.ts
- Create: src/config/constants.ts

**Required specs:**
- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/DEPLOYMENT-ARCHITECTURE.md`
- `Documents/OBSERVABILITY-ARCHITECTURE.md`

**Acceptance requirements:**
- Separate critical vs optional dependencies.
- Expose environment/service version/database URL server-side only.
- Never print secret values.

**Required verification:**
- Unit invalid/missing env tests
- pnpm typecheck

### Copy-ready Codex prompt

```text
TASK ID: IMP-010
TITLE: Validated server runtime config

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/SECURITY-ARCHITECTURE.md
- Documents/DEPLOYMENT-ARCHITECTURE.md
- Documents/OBSERVABILITY-ARCHITECTURE.md

PRECONDITIONS:
- IMP-003 must already be accepted in current repository reality.
- IMP-005 must already be accepted in current repository reality.

MISSION:
Implement typed server-only env parsing with safe redacted errors.

FILES IN SCOPE:
- Create: src/config/env.ts
- Create: src/config/runtime.ts
- Create: src/config/constants.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Separate critical vs optional dependencies.
2. Expose environment/service version/database URL server-side only.
3. Never print secret values.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Unit invalid/missing env tests
- pnpm typecheck

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-011 — IDs/time/pagination primitives

**Preconditions:** `IMP-010`

**Files in scope:**
- Create: src/shared/id/uuid.ts
- Create: src/shared/time/clock.ts
- Create: src/shared/time/riyadh.ts
- Create: src/shared/pagination/page.ts

**Required specs:**
- `Documents/DATA-DICTIONARY.md`
- `Documents/DATABASE-ARCHITECTURE.md`
- `Documents/BUSINESS-RULES.md`

**Acceptance requirements:**
- Technical IDs follow approved UUID strategy.
- Internal time UTC/TIMESTAMPTZ; display Asia/Riyadh.
- No business-ID generation here.

**Required verification:**
- UUID tests
- Riyadh date rollover tests
- Pagination boundary tests

### Copy-ready Codex prompt

```text
TASK ID: IMP-011
TITLE: IDs/time/pagination primitives

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DATA-DICTIONARY.md
- Documents/DATABASE-ARCHITECTURE.md
- Documents/BUSINESS-RULES.md

PRECONDITIONS:
- IMP-010 must already be accepted in current repository reality.

MISSION:
Implement technical UUID, trusted time, Riyadh display conversion and bounded pagination.

FILES IN SCOPE:
- Create: src/shared/id/uuid.ts
- Create: src/shared/time/clock.ts
- Create: src/shared/time/riyadh.ts
- Create: src/shared/pagination/page.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Technical IDs follow approved UUID strategy.
2. Internal time UTC/TIMESTAMPTZ; display Asia/Riyadh.
3. No business-ID generation here.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- UUID tests
- Riyadh date rollover tests
- Pagination boundary tests

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-012 — Canonical AppError model

**Preconditions:** `IMP-011`

**Files in scope:**
- Create: src/shared/errors/app-error.ts
- Create: src/shared/errors/error-codes.ts
- Create: src/shared/errors/action-error.ts
- Create: src/shared/errors/problem-details.ts

**Required specs:**
- `Documents/ERROR-ARCHITECTURE.md`
- `Documents/SECURITY-ARCHITECTURE.md`

**Acceptance requirements:**
- CONFLICT_STALE_VERSION maps 409.
- IDOR-sensitive cases may map safe 404.
- No raw SQL/stack/path/tokens in clients.
- Preserve requestId.

**Required verification:**
- Unit mapping tests
- RFC9457 response-shape tests
- secret-leak negative tests

### Copy-ready Codex prompt

```text
TASK ID: IMP-012
TITLE: Canonical AppError model

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/ERROR-ARCHITECTURE.md
- Documents/SECURITY-ARCHITECTURE.md

PRECONDITIONS:
- IMP-011 must already be accepted in current repository reality.

MISSION:
Implement AUTH/AUTHZ/VALIDATION/DOMAIN/CONFLICT/RESOURCE/SYSTEM error families and safe delivery mappings.

FILES IN SCOPE:
- Create: src/shared/errors/app-error.ts
- Create: src/shared/errors/error-codes.ts
- Create: src/shared/errors/action-error.ts
- Create: src/shared/errors/problem-details.ts

NON-NEGOTIABLE REQUIREMENTS:
1. CONFLICT_STALE_VERSION maps 409.
2. IDOR-sensitive cases may map safe 404.
3. No raw SQL/stack/path/tokens in clients.
4. Preserve requestId.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Unit mapping tests
- RFC9457 response-shape tests
- secret-leak negative tests

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-013 — pg + Kysely + transaction boundary

**Preconditions:** `IMP-005`, `IMP-010`

**Files in scope:**
- Create: src/shared/database/db-types.ts
- Create: src/shared/database/pool.ts
- Create: src/shared/database/database.ts
- Create: src/shared/database/transaction.ts

**Required specs:**
- `Documents/DATABASE-ARCHITECTURE.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/ERROR-ARCHITECTURE.md`

**Acceptance requirements:**
- Runtime expected non-superuser.
- Use-case owns transaction.
- Translate infra failures before application boundary.
- No primary RLS v1.

**Required verification:**
- PostgreSQL 18 connection integration
- commit/rollback
- pool shutdown

### Copy-ready Codex prompt

```text
TASK ID: IMP-013
TITLE: pg + Kysely + transaction boundary

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DATABASE-ARCHITECTURE.md
- Documents/DATA-DICTIONARY.md
- Documents/ERROR-ARCHITECTURE.md

PRECONDITIONS:
- IMP-005 must already be accepted in current repository reality.
- IMP-010 must already be accepted in current repository reality.

MISSION:
Implement shared pg.Pool/Kysely runtime boundary; no business tables yet.

FILES IN SCOPE:
- Create: src/shared/database/db-types.ts
- Create: src/shared/database/pool.ts
- Create: src/shared/database/database.ts
- Create: src/shared/database/transaction.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Runtime expected non-superuser.
2. Use-case owns transaction.
3. Translate infra failures before application boundary.
4. No primary RLS v1.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- PostgreSQL 18 connection integration
- commit/rollback
- pool shutdown

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-014 — Forward-only migration runner

**Preconditions:** `IMP-013`

**Files in scope:**
- Create: scripts/db/migrate.ts
- Create: scripts/db/migration-status.ts
- Create: scripts/db/check-migration-integrity.ts
- Create: db/migrations/README.md

**Required specs:**
- `Documents/DATABASE-ARCHITECTURE.md`
- `Documents/BACKUP-RECOVERY-PLAN.md`
- `Documents/DEPLOYMENT-ARCHITECTURE.md`

**Acceptance requirements:**
- Historical migrations immutable.
- No application-startup migrations.
- Safe migration lock.
- No credentials in output.

**Required verification:**
- Empty DB bootstrap
- checksum mismatch
- concurrent migration lock

### Copy-ready Codex prompt

```text
TASK ID: IMP-014
TITLE: Forward-only migration runner

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DATABASE-ARCHITECTURE.md
- Documents/BACKUP-RECOVERY-PLAN.md
- Documents/DEPLOYMENT-ARCHITECTURE.md

PRECONDITIONS:
- IMP-013 must already be accepted in current repository reality.

MISSION:
Create explicit SQL migration execution with ledger/checksum/concurrency protection.

FILES IN SCOPE:
- Create: scripts/db/migrate.ts
- Create: scripts/db/migration-status.ts
- Create: scripts/db/check-migration-integrity.ts
- Create: db/migrations/README.md

NON-NEGOTIABLE REQUIREMENTS:
1. Historical migrations immutable.
2. No application-startup migrations.
3. Safe migration lock.
4. No credentials in output.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Empty DB bootstrap
- checksum mismatch
- concurrent migration lock

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-015 — Core qc schema

**Preconditions:** `IMP-014`

**Files in scope:**
- Create: db/migrations/0001_core_schema.sql

**Required specs:**
- `Documents/DATABASE-ARCHITECTURE.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/DATA-MODEL.md`

**Acceptance requirements:**
- No domain tables yet.
- Harden public schema as documented.
- Use approved UUID support only.

**Required verification:**
- Fresh PostgreSQL18 migration
- inspect schema/search_path/privileges

### Copy-ready Codex prompt

```text
TASK ID: IMP-015
TITLE: Core qc schema

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DATABASE-ARCHITECTURE.md
- Documents/DATA-DICTIONARY.md
- Documents/DATA-MODEL.md

PRECONDITIONS:
- IMP-014 must already be accepted in current repository reality.

MISSION:
Create qc schema/extensions/privilege primitives only.

FILES IN SCOPE:
- Create: db/migrations/0001_core_schema.sql

NON-NEGOTIABLE REQUIREMENTS:
1. No domain tables yet.
2. Harden public schema as documented.
3. Use approved UUID support only.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Fresh PostgreSQL18 migration
- inspect schema/search_path/privileges

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-016 — Identity/session schema

**Preconditions:** `IMP-015`

**Files in scope:**
- Create when canonically supported: db/migrations/0002_identity.sql

**Required specs:**
- `Documents/DATA-MODEL.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/SECURITY-ARCHITECTURE.md`

**Acceptance requirements:**
- Every table/column/type/default/check/FK/index comes from Data Model/Dictionary/State Machines.
- Use UUID/TIMESTAMPTZ/version where specified.
- No convenience columns or JSONB catch-all.
- No destructive controlled-history cascades.

**Required verification:**
- Fresh migration
- Upgrade-path migration
- Representative invalid-row constraint tests

### Copy-ready Codex prompt

```text
TASK ID: IMP-016
TITLE: Identity/session schema

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DATA-MODEL.md
- Documents/DATA-DICTIONARY.md
- Documents/SECURITY-ARCHITECTURE.md

PRECONDITIONS:
- IMP-015 must already be accepted in current repository reality.

MISSION:
Users/credentials/session persistence; opaque server sessions; no plaintext passwords.

FILES IN SCOPE:
- Create when canonically supported: db/migrations/0002_identity.sql

NON-NEGOTIABLE REQUIREMENTS:
1. Every table/column/type/default/check/FK/index comes from Data Model/Dictionary/State Machines.
2. Use UUID/TIMESTAMPTZ/version where specified.
3. No convenience columns or JSONB catch-all.
4. No destructive controlled-history cascades.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Fresh migration
- Upgrade-path migration
- Representative invalid-row constraint tests

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-017 — Authorization schema

**Preconditions:** `IMP-016`

**Files in scope:**
- Create when canonically supported: db/migrations/0003_authorization.sql

**Required specs:**
- `Documents/ROLE-MATRIX.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/DATA-MODEL.md`
- `Documents/DATA-DICTIONARY.md`

**Acceptance requirements:**
- Every table/column/type/default/check/FK/index comes from Data Model/Dictionary/State Machines.
- Use UUID/TIMESTAMPTZ/version where specified.
- No convenience columns or JSONB catch-all.
- No destructive controlled-history cascades.

**Required verification:**
- Fresh migration
- Upgrade-path migration
- Representative invalid-row constraint tests

### Copy-ready Codex prompt

```text
TASK ID: IMP-017
TITLE: Authorization schema

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/ROLE-MATRIX.md
- Documents/PERMISSION-MATRIX.md
- Documents/DATA-MODEL.md
- Documents/DATA-DICTIONARY.md

PRECONDITIONS:
- IMP-016 must already be accepted in current repository reality.

MISSION:
Roles/permissions/scopes/grants; no role hierarchy or Admin bypass.

FILES IN SCOPE:
- Create when canonically supported: db/migrations/0003_authorization.sql

NON-NEGOTIABLE REQUIREMENTS:
1. Every table/column/type/default/check/FK/index comes from Data Model/Dictionary/State Machines.
2. Use UUID/TIMESTAMPTZ/version where specified.
3. No convenience columns or JSONB catch-all.
4. No destructive controlled-history cascades.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Fresh migration
- Upgrade-path migration
- Representative invalid-row constraint tests

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-018 — Audit/outbox/idempotency schema

**Preconditions:** `IMP-017`

**Files in scope:**
- Create when canonically supported: db/migrations/0004_audit_outbox_idempotency.sql

**Required specs:**
- `Documents/DATA-MODEL.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/BUSINESS-RULES.md`

**Acceptance requirements:**
- Every table/column/type/default/check/FK/index comes from Data Model/Dictionary/State Machines.
- Use UUID/TIMESTAMPTZ/version where specified.
- No convenience columns or JSONB catch-all.
- No destructive controlled-history cascades.

**Required verification:**
- Fresh migration
- Upgrade-path migration
- Representative invalid-row constraint tests

### Copy-ready Codex prompt

```text
TASK ID: IMP-018
TITLE: Audit/outbox/idempotency schema

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DATA-MODEL.md
- Documents/DATA-DICTIONARY.md
- Documents/BUSINESS-RULES.md

PRECONDITIONS:
- IMP-017 must already be accepted in current repository reality.

MISSION:
Durable audit/outbox/idempotency; no destructive audit cascade.

FILES IN SCOPE:
- Create when canonically supported: db/migrations/0004_audit_outbox_idempotency.sql

NON-NEGOTIABLE REQUIREMENTS:
1. Every table/column/type/default/check/FK/index comes from Data Model/Dictionary/State Machines.
2. Use UUID/TIMESTAMPTZ/version where specified.
3. No convenience columns or JSONB catch-all.
4. No destructive controlled-history cascades.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Fresh migration
- Upgrade-path migration
- Representative invalid-row constraint tests

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-019 — Files/notifications schema

**Preconditions:** `IMP-018`

**Files in scope:**
- Create when canonically supported: db/migrations/0005_files_notifications.sql

**Required specs:**
- `Documents/DATA-MODEL.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/DOMAIN-MAP.md`

**Acceptance requirements:**
- Every table/column/type/default/check/FK/index comes from Data Model/Dictionary/State Machines.
- Use UUID/TIMESTAMPTZ/version where specified.
- No convenience columns or JSONB catch-all.
- No destructive controlled-history cascades.

**Required verification:**
- Fresh migration
- Upgrade-path migration
- Representative invalid-row constraint tests

### Copy-ready Codex prompt

```text
TASK ID: IMP-019
TITLE: Files/notifications schema

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DATA-MODEL.md
- Documents/DATA-DICTIONARY.md
- Documents/DOMAIN-MAP.md

PRECONDITIONS:
- IMP-018 must already be accepted in current repository reality.

MISSION:
File metadata/hash/storage refs and notifications; binary content outside PostgreSQL.

FILES IN SCOPE:
- Create when canonically supported: db/migrations/0005_files_notifications.sql

NON-NEGOTIABLE REQUIREMENTS:
1. Every table/column/type/default/check/FK/index comes from Data Model/Dictionary/State Machines.
2. Use UUID/TIMESTAMPTZ/version where specified.
3. No convenience columns or JSONB catch-all.
4. No destructive controlled-history cascades.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Fresh migration
- Upgrade-path migration
- Representative invalid-row constraint tests

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-020 — Tasks schema

**Preconditions:** `IMP-019`

**Files in scope:**
- Create when canonically supported: db/migrations/0006_tasks.sql

**Required specs:**
- `Documents/DATA-MODEL.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/STATE-MACHINES.md`
- `Documents/DOMAIN-MAP.md`

**Acceptance requirements:**
- Every table/column/type/default/check/FK/index comes from Data Model/Dictionary/State Machines.
- Use UUID/TIMESTAMPTZ/version where specified.
- No convenience columns or JSONB catch-all.
- No destructive controlled-history cascades.

**Required verification:**
- Fresh migration
- Upgrade-path migration
- Representative invalid-row constraint tests

### Copy-ready Codex prompt

```text
TASK ID: IMP-020
TITLE: Tasks schema

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DATA-MODEL.md
- Documents/DATA-DICTIONARY.md
- Documents/STATE-MACHINES.md
- Documents/DOMAIN-MAP.md

PRECONDITIONS:
- IMP-019 must already be accepted in current repository reality.

MISSION:
Tasks-owned records only; no generic replacement for specialized domains.

FILES IN SCOPE:
- Create when canonically supported: db/migrations/0006_tasks.sql

NON-NEGOTIABLE REQUIREMENTS:
1. Every table/column/type/default/check/FK/index comes from Data Model/Dictionary/State Machines.
2. Use UUID/TIMESTAMPTZ/version where specified.
3. No convenience columns or JSONB catch-all.
4. No destructive controlled-history cascades.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Fresh migration
- Upgrade-path migration
- Representative invalid-row constraint tests

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-021 — Quality schema

**Preconditions:** `IMP-020`

**Files in scope:**
- Create when canonically supported: db/migrations/0007_quality.sql

**Required specs:**
- `Documents/DATA-MODEL.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/STATE-MACHINES.md`

**Acceptance requirements:**
- Every table/column/type/default/check/FK/index comes from Data Model/Dictionary/State Machines.
- Use UUID/TIMESTAMPTZ/version where specified.
- No convenience columns or JSONB catch-all.
- No destructive controlled-history cascades.

**Required verification:**
- Fresh migration
- Upgrade-path migration
- Representative invalid-row constraint tests

### Copy-ready Codex prompt

```text
TASK ID: IMP-021
TITLE: Quality schema

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DATA-MODEL.md
- Documents/DATA-DICTIONARY.md
- Documents/STATE-MACHINES.md

PRECONDITIONS:
- IMP-020 must already be accepted in current repository reality.

MISSION:
Finding/NCR/RCA/CAPA canonical persistence.

FILES IN SCOPE:
- Create when canonically supported: db/migrations/0007_quality.sql

NON-NEGOTIABLE REQUIREMENTS:
1. Every table/column/type/default/check/FK/index comes from Data Model/Dictionary/State Machines.
2. Use UUID/TIMESTAMPTZ/version where specified.
3. No convenience columns or JSONB catch-all.
4. No destructive controlled-history cascades.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Fresh migration
- Upgrade-path migration
- Representative invalid-row constraint tests

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-022 — Quarantine schema

**Preconditions:** `IMP-021`

**Files in scope:**
- Create when canonically supported: db/migrations/0008_quarantine.sql

**Required specs:**
- `Documents/DATA-MODEL.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/STATE-MACHINES.md`
- `Documents/BUSINESS-RULES.md`

**Acceptance requirements:**
- Every table/column/type/default/check/FK/index comes from Data Model/Dictionary/State Machines.
- Use UUID/TIMESTAMPTZ/version where specified.
- No convenience columns or JSONB catch-all.
- No destructive controlled-history cascades.

**Required verification:**
- Fresh migration
- Upgrade-path migration
- Representative invalid-row constraint tests

### Copy-ready Codex prompt

```text
TASK ID: IMP-022
TITLE: Quarantine schema

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DATA-MODEL.md
- Documents/DATA-DICTIONARY.md
- Documents/STATE-MACHINES.md
- Documents/BUSINESS-RULES.md

PRECONDITIONS:
- IMP-021 must already be accepted in current repository reality.

MISSION:
Receiving/Inspection with separate workflow/result/release facts.

FILES IN SCOPE:
- Create when canonically supported: db/migrations/0008_quarantine.sql

NON-NEGOTIABLE REQUIREMENTS:
1. Every table/column/type/default/check/FK/index comes from Data Model/Dictionary/State Machines.
2. Use UUID/TIMESTAMPTZ/version where specified.
3. No convenience columns or JSONB catch-all.
4. No destructive controlled-history cascades.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Fresh migration
- Upgrade-path migration
- Representative invalid-row constraint tests

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-023 — Laboratory schema

**Preconditions:** `IMP-022`

**Files in scope:**
- Create when canonically supported: db/migrations/0009_laboratory.sql

**Required specs:**
- `Documents/DATA-MODEL.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/STATE-MACHINES.md`
- `Documents/BUSINESS-RULES.md`

**Acceptance requirements:**
- Every table/column/type/default/check/FK/index comes from Data Model/Dictionary/State Machines.
- Use UUID/TIMESTAMPTZ/version where specified.
- No convenience columns or JSONB catch-all.
- No destructive controlled-history cascades.

**Required verification:**
- Fresh migration
- Upgrade-path migration
- Representative invalid-row constraint tests

### Copy-ready Codex prompt

```text
TASK ID: IMP-023
TITLE: Laboratory schema

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DATA-MODEL.md
- Documents/DATA-DICTIONARY.md
- Documents/STATE-MACHINES.md
- Documents/BUSINESS-RULES.md

PRECONDITIONS:
- IMP-022 must already be accepted in current repository reality.

MISSION:
Lab tests/samples/measurements/results/retests/historical controlled context.

FILES IN SCOPE:
- Create when canonically supported: db/migrations/0009_laboratory.sql

NON-NEGOTIABLE REQUIREMENTS:
1. Every table/column/type/default/check/FK/index comes from Data Model/Dictionary/State Machines.
2. Use UUID/TIMESTAMPTZ/version where specified.
3. No convenience columns or JSONB catch-all.
4. No destructive controlled-history cascades.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Fresh migration
- Upgrade-path migration
- Representative invalid-row constraint tests

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-024 — Assets schema

**Preconditions:** `IMP-023`

**Files in scope:**
- Create when canonically supported: db/migrations/0010_assets.sql

**Required specs:**
- `Documents/DATA-MODEL.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/STATE-MACHINES.md`

**Acceptance requirements:**
- Every table/column/type/default/check/FK/index comes from Data Model/Dictionary/State Machines.
- Use UUID/TIMESTAMPTZ/version where specified.
- No convenience columns or JSONB catch-all.
- No destructive controlled-history cascades.

**Required verification:**
- Fresh migration
- Upgrade-path migration
- Representative invalid-row constraint tests

### Copy-ready Codex prompt

```text
TASK ID: IMP-024
TITLE: Assets schema

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DATA-MODEL.md
- Documents/DATA-DICTIONARY.md
- Documents/STATE-MACHINES.md

PRECONDITIONS:
- IMP-023 must already be accepted in current repository reality.

MISSION:
Equipment/Calibration/Maintenance.

FILES IN SCOPE:
- Create when canonically supported: db/migrations/0010_assets.sql

NON-NEGOTIABLE REQUIREMENTS:
1. Every table/column/type/default/check/FK/index comes from Data Model/Dictionary/State Machines.
2. Use UUID/TIMESTAMPTZ/version where specified.
3. No convenience columns or JSONB catch-all.
4. No destructive controlled-history cascades.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Fresh migration
- Upgrade-path migration
- Representative invalid-row constraint tests

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-025 — Controlled Documents schema

**Preconditions:** `IMP-024`

**Files in scope:**
- Create when canonically supported: db/migrations/0011_documents.sql

**Required specs:**
- `Documents/DATA-MODEL.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/STATE-MACHINES.md`

**Acceptance requirements:**
- Every table/column/type/default/check/FK/index comes from Data Model/Dictionary/State Machines.
- Use UUID/TIMESTAMPTZ/version where specified.
- No convenience columns or JSONB catch-all.
- No destructive controlled-history cascades.

**Required verification:**
- Fresh migration
- Upgrade-path migration
- Representative invalid-row constraint tests

### Copy-ready Codex prompt

```text
TASK ID: IMP-025
TITLE: Controlled Documents schema

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DATA-MODEL.md
- Documents/DATA-DICTIONARY.md
- Documents/STATE-MACHINES.md

PRECONDITIONS:
- IMP-024 must already be accepted in current repository reality.

MISSION:
Document Identity and Version history.

FILES IN SCOPE:
- Create when canonically supported: db/migrations/0011_documents.sql

NON-NEGOTIABLE REQUIREMENTS:
1. Every table/column/type/default/check/FK/index comes from Data Model/Dictionary/State Machines.
2. Use UUID/TIMESTAMPTZ/version where specified.
3. No convenience columns or JSONB catch-all.
4. No destructive controlled-history cascades.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Fresh migration
- Upgrade-path migration
- Representative invalid-row constraint tests

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-026 — Approvals/E-Signatures schema

**Preconditions:** `IMP-025`

**Files in scope:**
- Create when canonically supported: db/migrations/0012_approvals_esignatures.sql

**Required specs:**
- `Documents/DATA-MODEL.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/PERMISSION-MATRIX.md`

**Acceptance requirements:**
- Every table/column/type/default/check/FK/index comes from Data Model/Dictionary/State Machines.
- Use UUID/TIMESTAMPTZ/version where specified.
- No convenience columns or JSONB catch-all.
- No destructive controlled-history cascades.

**Required verification:**
- Fresh migration
- Upgrade-path migration
- Representative invalid-row constraint tests

### Copy-ready Codex prompt

```text
TASK ID: IMP-026
TITLE: Approvals/E-Signatures schema

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DATA-MODEL.md
- Documents/DATA-DICTIONARY.md
- Documents/PERMISSION-MATRIX.md

PRECONDITIONS:
- IMP-025 must already be accepted in current repository reality.

MISSION:
Approval work items and signature evidence; never passwords.

FILES IN SCOPE:
- Create when canonically supported: db/migrations/0012_approvals_esignatures.sql

NON-NEGOTIABLE REQUIREMENTS:
1. Every table/column/type/default/check/FK/index comes from Data Model/Dictionary/State Machines.
2. Use UUID/TIMESTAMPTZ/version where specified.
3. No convenience columns or JSONB catch-all.
4. No destructive controlled-history cascades.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Fresh migration
- Upgrade-path migration
- Representative invalid-row constraint tests

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-027 — Change Requests schema

**Preconditions:** `IMP-026`

**Files in scope:**
- Create when canonically supported: db/migrations/0013_change_requests.sql

**Required specs:**
- `Documents/DATA-MODEL.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/STATE-MACHINES.md`

**Acceptance requirements:**
- Every table/column/type/default/check/FK/index comes from Data Model/Dictionary/State Machines.
- Use UUID/TIMESTAMPTZ/version where specified.
- No convenience columns or JSONB catch-all.
- No destructive controlled-history cascades.

**Required verification:**
- Fresh migration
- Upgrade-path migration
- Representative invalid-row constraint tests

### Copy-ready Codex prompt

```text
TASK ID: IMP-027
TITLE: Change Requests schema

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DATA-MODEL.md
- Documents/DATA-DICTIONARY.md
- Documents/STATE-MACHINES.md

PRECONDITIONS:
- IMP-026 must already be accepted in current repository reality.

MISSION:
Controlled Change Request lifecycle.

FILES IN SCOPE:
- Create when canonically supported: db/migrations/0013_change_requests.sql

NON-NEGOTIABLE REQUIREMENTS:
1. Every table/column/type/default/check/FK/index comes from Data Model/Dictionary/State Machines.
2. Use UUID/TIMESTAMPTZ/version where specified.
3. No convenience columns or JSONB catch-all.
4. No destructive controlled-history cascades.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Fresh migration
- Upgrade-path migration
- Representative invalid-row constraint tests

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-028 — Backup/Recovery metadata schema

**Preconditions:** `IMP-027`

**Files in scope:**
- Create when canonically supported: db/migrations/0014_backup_recovery_metadata.sql

**Required specs:**
- `Documents/BACKUP-RECOVERY-PLAN.md`
- `Documents/DATA-MODEL.md`
- `Documents/DATA-DICTIONARY.md`

**Acceptance requirements:**
- Every table/column/type/default/check/FK/index comes from Data Model/Dictionary/State Machines.
- Use UUID/TIMESTAMPTZ/version where specified.
- No convenience columns or JSONB catch-all.
- No destructive controlled-history cascades.

**Required verification:**
- Fresh migration
- Upgrade-path migration
- Representative invalid-row constraint tests

### Copy-ready Codex prompt

```text
TASK ID: IMP-028
TITLE: Backup/Recovery metadata schema

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/BACKUP-RECOVERY-PLAN.md
- Documents/DATA-MODEL.md
- Documents/DATA-DICTIONARY.md

PRECONDITIONS:
- IMP-027 must already be accepted in current repository reality.

MISSION:
Create only if Backup/Recovery entities are explicitly in canonical data model; otherwise mark BLOCKED and do not invent tables.

FILES IN SCOPE:
- Create when canonically supported: db/migrations/0014_backup_recovery_metadata.sql

NON-NEGOTIABLE REQUIREMENTS:
1. Every table/column/type/default/check/FK/index comes from Data Model/Dictionary/State Machines.
2. Use UUID/TIMESTAMPTZ/version where specified.
3. No convenience columns or JSONB catch-all.
4. No destructive controlled-history cascades.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Fresh migration
- Upgrade-path migration
- Representative invalid-row constraint tests

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-029 — Dev/test seeds and factories

**Preconditions:** `IMP-028`

**Files in scope:**
- Create: db/seeds/dev.ts
- Create: db/seeds/test.ts
- Create: tests/helpers/factories.ts

**Required specs:**
- `Documents/DATA-DICTIONARY.md`
- `Documents/ROLE-MATRIX.md`
- `Documents/PERMISSION-MATRIX.md`

**Acceptance requirements:**
- Seed four Foundation roles and explicit approved permission codes only.
- No production credentials/scientific policy invention.
- Factories allow explicit state/version/scope for negative tests.

**Required verification:**
- Run seeds twice on disposable PG18
- prove non-production guard

### Copy-ready Codex prompt

```text
TASK ID: IMP-029
TITLE: Dev/test seeds and factories

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DATA-DICTIONARY.md
- Documents/ROLE-MATRIX.md
- Documents/PERMISSION-MATRIX.md

PRECONDITIONS:
- IMP-028 must already be accepted in current repository reality.

MISSION:
Create deterministic non-production data only.

FILES IN SCOPE:
- Create: db/seeds/dev.ts
- Create: db/seeds/test.ts
- Create: tests/helpers/factories.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Seed four Foundation roles and explicit approved permission codes only.
2. No production credentials/scientific policy invention.
3. Factories allow explicit state/version/scope for negative tests.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Run seeds twice on disposable PG18
- prove non-production guard

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-030 — Full migration verification

**Preconditions:** `IMP-029`

**Files in scope:**
- Create: tests/integration/database/migrations.test.ts
- Create: tests/integration/database/constraints.test.ts
- Create: tests/integration/database/upgrade-path.test.ts

**Required specs:**
- `Documents/DATABASE-ARCHITECTURE.md`
- `Documents/TESTING-STRATEGY.md`

**Acceptance requirements:**
- Fresh DB and supported upgrade path.
- Checksum immutability.
- Key FK/check/unique/history behavior.

**Required verification:**
- pnpm test:integration -- database
- pnpm db:migrate:check

### Copy-ready Codex prompt

```text
TASK ID: IMP-030
TITLE: Full migration verification

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DATABASE-ARCHITECTURE.md
- Documents/TESTING-STRATEGY.md

PRECONDITIONS:
- IMP-029 must already be accepted in current repository reality.

MISSION:
Prove full PostgreSQL18 migration chain before repositories.

FILES IN SCOPE:
- Create: tests/integration/database/migrations.test.ts
- Create: tests/integration/database/constraints.test.ts
- Create: tests/integration/database/upgrade-path.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Fresh DB and supported upgrade path.
2. Checksum immutability.
3. Key FK/check/unique/history behavior.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- pnpm test:integration -- database
- pnpm db:migrate:check

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

---

# Phase 2 — Shared Application Infrastructure

## IMP-040 — Validation contracts

**Preconditions:** `IMP-012`, `IMP-030`

**Files in scope:**
- Create: src/shared/validation/parse.ts
- Create: src/shared/validation/common-schemas.ts
- Create: tests/unit/shared/validation.test.ts

**Required specs:**
- `Documents/ERROR-ARCHITECTURE.md`
- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`

**Acceptance requirements:**
- Invalid UUID fails before DB lookup.
- Client never supplies trusted actor/permission/final state/PASS/FAIL/release.
- Canonical validation errors.

**Required verification:**
- UUID/date/pagination/query tests

### Copy-ready Codex prompt

```text
TASK ID: IMP-040
TITLE: Validation contracts

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/ERROR-ARCHITECTURE.md
- Documents/SECURITY-ARCHITECTURE.md
- Documents/ROUTE-MANIFEST-SPECIFICATION.md

PRECONDITIONS:
- IMP-012 must already be accepted in current repository reality.
- IMP-030 must already be accepted in current repository reality.

MISSION:
Reusable server validation for UUID/date/pagination/query input.

FILES IN SCOPE:
- Create: src/shared/validation/parse.ts
- Create: src/shared/validation/common-schemas.ts
- Create: tests/unit/shared/validation.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Invalid UUID fails before DB lookup.
2. Client never supplies trusted actor/permission/final state/PASS/FAIL/release.
3. Canonical validation errors.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- UUID/date/pagination/query tests

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-041 — Concurrency/idempotency

**Preconditions:** `IMP-013`, `IMP-018`

**Files in scope:**
- Create: src/shared/concurrency/version.ts
- Create: src/shared/idempotency/idempotency-service.ts
- Create: src/shared/idempotency/idempotency-repository.ts
- Create: src/shared/idempotency/postgres-idempotency-repository.ts
- Create: tests/integration/shared/idempotency.test.ts

**Required specs:**
- `Documents/BUSINESS-RULES.md`
- `Documents/DATABASE-ARCHITECTURE.md`
- `Documents/ERROR-ARCHITECTURE.md`

**Acceptance requirements:**
- Stale writes raise CONFLICT_STALE_VERSION.
- Replay does not duplicate controlled mutation.
- Conflicting key reuse rejected.

**Required verification:**
- Real PG concurrent tests
- replay/conflict tests

### Copy-ready Codex prompt

```text
TASK ID: IMP-041
TITLE: Concurrency/idempotency

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/BUSINESS-RULES.md
- Documents/DATABASE-ARCHITECTURE.md
- Documents/ERROR-ARCHITECTURE.md

PRECONDITIONS:
- IMP-013 must already be accepted in current repository reality.
- IMP-018 must already be accepted in current repository reality.

MISSION:
Reusable stale-version and critical-request idempotency.

FILES IN SCOPE:
- Create: src/shared/concurrency/version.ts
- Create: src/shared/idempotency/idempotency-service.ts
- Create: src/shared/idempotency/idempotency-repository.ts
- Create: src/shared/idempotency/postgres-idempotency-repository.ts
- Create: tests/integration/shared/idempotency.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Stale writes raise CONFLICT_STALE_VERSION.
2. Replay does not duplicate controlled mutation.
3. Conflicting key reuse rejected.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Real PG concurrent tests
- replay/conflict tests

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-042 — Request context + middleware base

**Preconditions:** `IMP-040`

**Files in scope:**
- Create: src/shared/http/request-context.ts
- Create: src/shared/http/safe-return-to.ts
- Create: src/middleware.ts
- Create: tests/unit/shared/safe-return-to.test.ts
- Create: tests/integration/http/middleware.test.ts

**Required specs:**
- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/ERROR-ARCHITECTURE.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`

**Acceptance requirements:**
- requestId plus trace correlation.
- safe returnTo local relative only.
- Middleware may populate locals, never replace per-action authorization.

**Required verification:**
- returnTo attacks
- requestId propagation
- no client actor trust

### Copy-ready Codex prompt

```text
TASK ID: IMP-042
TITLE: Request context + middleware base

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/SECURITY-ARCHITECTURE.md
- Documents/ERROR-ARCHITECTURE.md
- Documents/ROUTE-MANIFEST-SPECIFICATION.md

PRECONDITIONS:
- IMP-040 must already be accepted in current repository reality.

MISSION:
Generate request correlation and safe request/session context without turning middleware into authorization.

FILES IN SCOPE:
- Create: src/shared/http/request-context.ts
- Create: src/shared/http/safe-return-to.ts
- Create: src/middleware.ts
- Create: tests/unit/shared/safe-return-to.test.ts
- Create: tests/integration/http/middleware.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. requestId plus trace correlation.
2. safe returnTo local relative only.
3. Middleware may populate locals, never replace per-action authorization.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- returnTo attacks
- requestId propagation
- no client actor trust

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-043 — Authorization types

**Preconditions:** `IMP-017`

**Files in scope:**
- Create: src/shared/authorization/types.ts
- Create: src/shared/authorization/permissions.ts
- Create: src/shared/authorization/scopes.ts
- Create: src/shared/authorization/decision.ts
- Create: tests/unit/shared/authorization-types.test.ts

**Required specs:**
- `Documents/ROLE-MATRIX.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/BUSINESS-RULES.md`

**Acceptance requirements:**
- Policy-dependent runtime behavior DENY.
- No role hierarchy.
- Copy permission codes; do not invent.

**Required verification:**
- Type/unit decision tests

### Copy-ready Codex prompt

```text
TASK ID: IMP-043
TITLE: Authorization types

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/ROLE-MATRIX.md
- Documents/PERMISSION-MATRIX.md
- Documents/BUSINESS-RULES.md

PRECONDITIONS:
- IMP-017 must already be accepted in current repository reality.

MISSION:
Encode actor/account/permission/scope/entity/state/ownership/SoD/version decision inputs.

FILES IN SCOPE:
- Create: src/shared/authorization/types.ts
- Create: src/shared/authorization/permissions.ts
- Create: src/shared/authorization/scopes.ts
- Create: src/shared/authorization/decision.ts
- Create: tests/unit/shared/authorization-types.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Policy-dependent runtime behavior DENY.
2. No role hierarchy.
3. Copy permission codes; do not invent.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Type/unit decision tests

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-044 — Central authorization + SoD evaluator

**Preconditions:** `IMP-043`

**Files in scope:**
- Create: src/shared/authorization/authorize.ts
- Create: src/shared/authorization/sod.ts
- Create: src/shared/authorization/scope-evaluator.ts
- Create: src/shared/authorization/policy-registry.ts
- Create: tests/unit/shared/authorize.test.ts
- Create: tests/unit/shared/sod.test.ts

**Required specs:**
- `Documents/PERMISSION-MATRIX.md`
- `Documents/ROLE-MATRIX.md`
- `Documents/STATE-MACHINES.md`
- `Documents/RISK-REGISTER.md`

**Acceptance requirements:**
- Evaluate permission+scope+entity+state+assignment/ownership+SoD+version/business condition.
- Undefined policy DENY.
- Admin without explicit permission can be denied.

**Required verification:**
- positive/negative matrix
- cross-scope
- self-approval default denial

### Copy-ready Codex prompt

```text
TASK ID: IMP-044
TITLE: Central authorization + SoD evaluator

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/PERMISSION-MATRIX.md
- Documents/ROLE-MATRIX.md
- Documents/STATE-MACHINES.md
- Documents/RISK-REGISTER.md

PRECONDITIONS:
- IMP-043 must already be accepted in current repository reality.

MISSION:
Implement Default-Deny authorization reusable by all use cases.

FILES IN SCOPE:
- Create: src/shared/authorization/authorize.ts
- Create: src/shared/authorization/sod.ts
- Create: src/shared/authorization/scope-evaluator.ts
- Create: src/shared/authorization/policy-registry.ts
- Create: tests/unit/shared/authorize.test.ts
- Create: tests/unit/shared/sod.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Evaluate permission+scope+entity+state+assignment/ownership+SoD+version/business condition.
2. Undefined policy DENY.
3. Admin without explicit permission can be denied.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- positive/negative matrix
- cross-scope
- self-approval default denial

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-045 — Audit service

**Preconditions:** `IMP-018`, `IMP-013`

**Files in scope:**
- Create: src/shared/audit/audit-event.ts
- Create: src/shared/audit/audit-service.ts
- Create: src/shared/audit/audit-repository.ts
- Create: src/shared/audit/postgres-audit-repository.ts
- Create: tests/integration/shared/audit.test.ts

**Required specs:**
- `Documents/BUSINESS-RULES.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/OBSERVABILITY-ARCHITECTURE.md`

**Acceptance requirements:**
- Capture approved actor/time/entity/action/reason/correlation fields.
- Same transaction as controlled mutation when required.
- No passwords/tokens in audit.

**Required verification:**
- atomic commit/rollback
- history survival

### Copy-ready Codex prompt

```text
TASK ID: IMP-045
TITLE: Audit service

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/BUSINESS-RULES.md
- Documents/DATA-DICTIONARY.md
- Documents/OBSERVABILITY-ARCHITECTURE.md

PRECONDITIONS:
- IMP-018 must already be accepted in current repository reality.
- IMP-013 must already be accepted in current repository reality.

MISSION:
Immutable audit persistence distinct from logs.

FILES IN SCOPE:
- Create: src/shared/audit/audit-event.ts
- Create: src/shared/audit/audit-service.ts
- Create: src/shared/audit/audit-repository.ts
- Create: src/shared/audit/postgres-audit-repository.ts
- Create: tests/integration/shared/audit.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Capture approved actor/time/entity/action/reason/correlation fields.
2. Same transaction as controlled mutation when required.
3. No passwords/tokens in audit.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- atomic commit/rollback
- history survival

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-046 — Durable outbox

**Preconditions:** `IMP-045`

**Files in scope:**
- Create: src/shared/outbox/outbox-event.ts
- Create: src/shared/outbox/outbox-repository.ts
- Create: src/shared/outbox/postgres-outbox-repository.ts
- Create: src/shared/outbox/worker.ts
- Create: scripts/workers/outbox.ts
- Create: tests/integration/shared/outbox.test.ts

**Required specs:**
- `Documents/BUSINESS-RULES.md`
- `Documents/OBSERVABILITY-ARCHITECTURE.md`
- `Documents/DATABASE-ARCHITECTURE.md`

**Acceptance requirements:**
- Enqueue atomically when required.
- Concurrency-safe claim/retry.
- No external network wait inside critical DB transaction.

**Required verification:**
- concurrent worker
- retry/idempotency

### Copy-ready Codex prompt

```text
TASK ID: IMP-046
TITLE: Durable outbox

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/BUSINESS-RULES.md
- Documents/OBSERVABILITY-ARCHITECTURE.md
- Documents/DATABASE-ARCHITECTURE.md

PRECONDITIONS:
- IMP-045 must already be accepted in current repository reality.

MISSION:
Durable side-effect delivery after business commit.

FILES IN SCOPE:
- Create: src/shared/outbox/outbox-event.ts
- Create: src/shared/outbox/outbox-repository.ts
- Create: src/shared/outbox/postgres-outbox-repository.ts
- Create: src/shared/outbox/worker.ts
- Create: scripts/workers/outbox.ts
- Create: tests/integration/shared/outbox.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Enqueue atomically when required.
2. Concurrency-safe claim/retry.
3. No external network wait inside critical DB transaction.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- concurrent worker
- retry/idempotency

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-047 — Notifications

**Preconditions:** `IMP-019`, `IMP-046`

**Files in scope:**
- Create: src/shared/notifications/notification.ts
- Create: src/shared/notifications/notification-repository.ts
- Create: src/shared/notifications/postgres-notification-repository.ts
- Create: src/shared/notifications/notification-service.ts
- Create: tests/integration/shared/notifications.test.ts

**Required specs:**
- `Documents/DOMAIN-MAP.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/UI-UX-SPECIFICATION.md`

**Acceptance requirements:**
- Recipient/scope isolation.
- Mark-read idempotent.
- No external email/SMS provider invented.

**Required verification:**
- cross-user isolation
- mark-read replay

### Copy-ready Codex prompt

```text
TASK ID: IMP-047
TITLE: Notifications

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DOMAIN-MAP.md
- Documents/DATA-DICTIONARY.md
- Documents/UI-UX-SPECIFICATION.md

PRECONDITIONS:
- IMP-019 must already be accepted in current repository reality.
- IMP-046 must already be accepted in current repository reality.

MISSION:
In-app notifications as delivery capability, not business truth.

FILES IN SCOPE:
- Create: src/shared/notifications/notification.ts
- Create: src/shared/notifications/notification-repository.ts
- Create: src/shared/notifications/postgres-notification-repository.ts
- Create: src/shared/notifications/notification-service.ts
- Create: tests/integration/shared/notifications.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Recipient/scope isolation.
2. Mark-read idempotent.
3. No external email/SMS provider invented.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- cross-user isolation
- mark-read replay

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-048 — Files/evidence service

**Preconditions:** `IMP-019`, `IMP-044`

**Files in scope:**
- Create: src/shared/files/file-record.ts
- Create: src/shared/files/file-repository.ts
- Create: src/shared/files/postgres-file-repository.ts
- Create: src/shared/files/object-store.ts
- Create: src/shared/files/sha256.ts
- Create: src/shared/files/file-service.ts
- Create: tests/integration/shared/files.test.ts

**Required specs:**
- `Documents/DOMAIN-MAP.md`
- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/BACKUP-RECOVERY-PLAN.md`
- `Documents/DATA-DICTIONARY.md`

**Acceptance requirements:**
- SHA-256 actual bytes.
- Authorization before access.
- No raw file bodies in logs.
- Preserve historical evidence linkage.

**Required verification:**
- hash match/mismatch
- unauthorized access

### Copy-ready Codex prompt

```text
TASK ID: IMP-048
TITLE: Files/evidence service

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DOMAIN-MAP.md
- Documents/SECURITY-ARCHITECTURE.md
- Documents/BACKUP-RECOVERY-PLAN.md
- Documents/DATA-DICTIONARY.md

PRECONDITIONS:
- IMP-019 must already be accepted in current repository reality.
- IMP-044 must already be accepted in current repository reality.

MISSION:
Controlled file metadata/hash/object-store abstraction.

FILES IN SCOPE:
- Create: src/shared/files/file-record.ts
- Create: src/shared/files/file-repository.ts
- Create: src/shared/files/postgres-file-repository.ts
- Create: src/shared/files/object-store.ts
- Create: src/shared/files/sha256.ts
- Create: src/shared/files/file-service.ts
- Create: tests/integration/shared/files.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. SHA-256 actual bytes.
2. Authorization before access.
3. No raw file bodies in logs.
4. Preserve historical evidence linkage.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- hash match/mismatch
- unauthorized access

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-049 — Object-store adapters

**Preconditions:** `IMP-048`

**Files in scope:**
- Create: src/shared/files/local-object-store.ts
- Create: src/shared/files/s3-object-store.ts
- Create: tests/integration/shared/object-store.test.ts

**Required specs:**
- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/BACKUP-RECOVERY-PLAN.md`
- `Documents/DEPLOYMENT-ARCHITECTURE.md`

**Acceptance requirements:**
- Local adapter forbidden in production and prevents traversal.
- S3 private objects only.
- Runtime credentials cannot manage protected backup copies.

**Required verification:**
- path traversal
- local roundtrip
- S3 contract if disposable compatible service available

### Copy-ready Codex prompt

```text
TASK ID: IMP-049
TITLE: Object-store adapters

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/SECURITY-ARCHITECTURE.md
- Documents/BACKUP-RECOVERY-PLAN.md
- Documents/DEPLOYMENT-ARCHITECTURE.md

PRECONDITIONS:
- IMP-048 must already be accepted in current repository reality.

MISSION:
Local/test adapter plus S3-compatible adapter behind ObjectStore while provider stays unspecified.

FILES IN SCOPE:
- Create: src/shared/files/local-object-store.ts
- Create: src/shared/files/s3-object-store.ts
- Create: tests/integration/shared/object-store.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Local adapter forbidden in production and prevents traversal.
2. S3 private objects only.
3. Runtime credentials cannot manage protected backup copies.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- path traversal
- local roundtrip
- S3 contract if disposable compatible service available

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-050 — Structured JSON logging/redaction

**Preconditions:** `IMP-012`, `IMP-042`

**Files in scope:**
- Create: src/shared/observability/logger.ts
- Create: src/shared/observability/context.ts
- Create: src/shared/observability/redaction.ts
- Create: src/shared/observability/security-events.ts
- Create: tests/unit/shared/redaction.test.ts

**Required specs:**
- `Documents/OBSERVABILITY-ARCHITECTURE.md`
- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/ERROR-ARCHITECTURE.md`

**Acceptance requirements:**
- requestId/trace/span correlation where available.
- Never log passwords/hashes/session tokens/cookies/Auth headers/reset tokens/DB secrets/files/full controlled narratives/AI bodies.
- Logs != Audit.

**Required verification:**
- redaction matrix
- JSON shape

### Copy-ready Codex prompt

```text
TASK ID: IMP-050
TITLE: Structured JSON logging/redaction

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/OBSERVABILITY-ARCHITECTURE.md
- Documents/SECURITY-ARCHITECTURE.md
- Documents/ERROR-ARCHITECTURE.md

PRECONDITIONS:
- IMP-012 must already be accepted in current repository reality.
- IMP-042 must already be accepted in current repository reality.

MISSION:
Canonical safe structured logging.

FILES IN SCOPE:
- Create: src/shared/observability/logger.ts
- Create: src/shared/observability/context.ts
- Create: src/shared/observability/redaction.ts
- Create: src/shared/observability/security-events.ts
- Create: tests/unit/shared/redaction.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. requestId/trace/span correlation where available.
2. Never log passwords/hashes/session tokens/cookies/Auth headers/reset tokens/DB secrets/files/full controlled narratives/AI bodies.
3. Logs != Audit.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- redaction matrix
- JSON shape

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-051 — OpenTelemetry traces/metrics

**Preconditions:** `IMP-050`, `IMP-013`

**Files in scope:**
- Create: src/shared/observability/telemetry.ts
- Create: src/shared/observability/tracing.ts
- Create: src/shared/observability/metrics.ts
- Create: src/shared/observability/instrumentation/postgres.ts
- Create: tests/unit/shared/metrics-cardinality.test.ts

**Required specs:**
- `Documents/OBSERVABILITY-ARCHITECTURE.md`

**Acceptance requirements:**
- W3C Trace Context.
- requestId distinct from traceId/spanId.
- Bounded metric labels only; no user/record/request/trace/file/business IDs or email.
- Exporter failure must not normally fail business transaction.

**Required verification:**
- propagation
- cardinality
- exporter-down

### Copy-ready Codex prompt

```text
TASK ID: IMP-051
TITLE: OpenTelemetry traces/metrics

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/OBSERVABILITY-ARCHITECTURE.md

PRECONDITIONS:
- IMP-050 must already be accepted in current repository reality.
- IMP-013 must already be accepted in current repository reality.

MISSION:
Vendor-neutral OTel traces/metrics and OTLP configuration.

FILES IN SCOPE:
- Create: src/shared/observability/telemetry.ts
- Create: src/shared/observability/tracing.ts
- Create: src/shared/observability/metrics.ts
- Create: src/shared/observability/instrumentation/postgres.ts
- Create: tests/unit/shared/metrics-cardinality.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. W3C Trace Context.
2. requestId distinct from traceId/spanId.
3. Bounded metric labels only; no user/record/request/trace/file/business IDs or email.
4. Exporter failure must not normally fail business transaction.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- propagation
- cardinality
- exporter-down

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-052 — Liveness/readiness

**Preconditions:** `IMP-051`

**Files in scope:**
- Create: src/shared/observability/health.ts
- Create: src/pages/api/health/live.ts
- Create: src/pages/api/health/ready.ts
- Create: tests/integration/http/health.test.ts

**Required specs:**
- `Documents/OBSERVABILITY-ARCHITECTURE.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/DEPLOYMENT-ARCHITECTURE.md`

**Acceptance requirements:**
- Liveness process-only.
- Readiness checks PostgreSQL/critical config.
- Optional AI outage does not kill core readiness.

**Required verification:**
- DB up/down
- no secret output

### Copy-ready Codex prompt

```text
TASK ID: IMP-052
TITLE: Liveness/readiness

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/OBSERVABILITY-ARCHITECTURE.md
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/DEPLOYMENT-ARCHITECTURE.md

PRECONDITIONS:
- IMP-051 must already be accepted in current repository reality.

MISSION:
Machine health endpoints without sensitive diagnostics.

FILES IN SCOPE:
- Create: src/shared/observability/health.ts
- Create: src/pages/api/health/live.ts
- Create: src/pages/api/health/ready.ts
- Create: tests/integration/http/health.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Liveness process-only.
2. Readiness checks PostgreSQL/critical config.
3. Optional AI outage does not kill core readiness.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- DB up/down
- no secret output

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-053 — HTTP security helpers

**Preconditions:** `IMP-042`

**Files in scope:**
- Create: src/shared/security/headers.ts
- Create: src/shared/security/origin.ts
- Create: src/shared/security/constant-time.ts
- Create: tests/unit/shared/security-http.test.ts

**Required specs:**
- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`

**Acceptance requirements:**
- No authenticated CORS wildcard.
- State-changing browser actions use approved same-origin/CSRF protection.
- CSP must be Astro-compatible and tested.

**Required verification:**
- origin tests
- header tests

### Copy-ready Codex prompt

```text
TASK ID: IMP-053
TITLE: HTTP security helpers

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/SECURITY-ARCHITECTURE.md
- Documents/ROUTE-MANIFEST-SPECIFICATION.md

PRECONDITIONS:
- IMP-042 must already be accepted in current repository reality.

MISSION:
Security headers/origin/safe-comparison helpers.

FILES IN SCOPE:
- Create: src/shared/security/headers.ts
- Create: src/shared/security/origin.ts
- Create: src/shared/security/constant-time.ts
- Create: tests/unit/shared/security-http.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. No authenticated CORS wildcard.
2. State-changing browser actions use approved same-origin/CSRF protection.
3. CSP must be Astro-compatible and tested.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- origin tests
- header tests

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-054 — Arabic/English i18n

**Preconditions:** `IMP-040`

**Files in scope:**
- Create: src/i18n/en.ts
- Create: src/i18n/ar.ts
- Create: src/i18n/index.ts
- Create: src/i18n/locale.ts
- Create: tests/unit/i18n/i18n.test.ts

**Required specs:**
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/DESIGN-SYSTEM.md`

**Acceptance requirements:**
- Correct lang/dir.
- Stable business IDs/status codes; labels localized.
- Do not translate controlled source text unless approved translation exists.

**Required verification:**
- missing key
- RTL/LTR
- language switch preserves route

### Copy-ready Codex prompt

```text
TASK ID: IMP-054
TITLE: Arabic/English i18n

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/UI-UX-SPECIFICATION.md
- Documents/DESIGN-SYSTEM.md

PRECONDITIONS:
- IMP-040 must already be accepted in current repository reality.

MISSION:
Arabic/English-capable labels without locale-prefixed routes.

FILES IN SCOPE:
- Create: src/i18n/en.ts
- Create: src/i18n/ar.ts
- Create: src/i18n/index.ts
- Create: src/i18n/locale.ts
- Create: tests/unit/i18n/i18n.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Correct lang/dir.
2. Stable business IDs/status codes; labels localized.
3. Do not translate controlled source text unless approved translation exists.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- missing key
- RTL/LTR
- language switch preserves route

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

---

# Phase 3 — Identity & Authentication

## IMP-060 — Identity domain + ports

**Preconditions:** `IMP-016`, `IMP-040`

**Files in scope:**
- Create: src/modules/identity/domain/user.ts
- Create: src/modules/identity/domain/account-state.ts
- Create: src/modules/identity/domain/session.ts
- Create: src/modules/identity/ports/user-repository.ts
- Create: src/modules/identity/ports/session-repository.ts
- Create: tests/unit/identity/user.test.ts

**Required specs:**
- `Documents/DOMAIN-MAP.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/SECURITY-ARCHITECTURE.md`

**Acceptance requirements:**
- Active authenticated actor required for controlled actions.
- Shared accounts not allowed for controlled actions.
- Disabled users cannot create new sessions.
- No role hierarchy inside User.

**Required verification:**
- domain invariants
- no infra imports

### Copy-ready Codex prompt

```text
TASK ID: IMP-060
TITLE: Identity domain + ports

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DOMAIN-MAP.md
- Documents/BUSINESS-RULES.md
- Documents/DATA-DICTIONARY.md
- Documents/SECURITY-ARCHITECTURE.md

PRECONDITIONS:
- IMP-016 must already be accepted in current repository reality.
- IMP-040 must already be accepted in current repository reality.

MISSION:
Identity domain types/invariants with no persistence details.

FILES IN SCOPE:
- Create: src/modules/identity/domain/user.ts
- Create: src/modules/identity/domain/account-state.ts
- Create: src/modules/identity/domain/session.ts
- Create: src/modules/identity/ports/user-repository.ts
- Create: src/modules/identity/ports/session-repository.ts
- Create: tests/unit/identity/user.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Active authenticated actor required for controlled actions.
2. Shared accounts not allowed for controlled actions.
3. Disabled users cannot create new sessions.
4. No role hierarchy inside User.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- domain invariants
- no infra imports

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-061 — PostgreSQL user/session repositories

**Preconditions:** `IMP-060`, `IMP-013`

**Files in scope:**
- Create: src/modules/identity/infrastructure/postgres-user-repository.ts
- Create: src/modules/identity/infrastructure/postgres-session-repository.ts
- Create: tests/integration/identity/repositories.test.ts

**Required specs:**
- `Documents/DATABASE-ARCHITECTURE.md`
- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/DATA-DICTIONARY.md`

**Acceptance requirements:**
- Kysely/qc schema only.
- Opaque sessions stored/compared securely.
- Disable/session invalidation atomic where required.

**Required verification:**
- real PG repository tests
- disabled-account behavior

### Copy-ready Codex prompt

```text
TASK ID: IMP-061
TITLE: PostgreSQL user/session repositories

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DATABASE-ARCHITECTURE.md
- Documents/SECURITY-ARCHITECTURE.md
- Documents/DATA-DICTIONARY.md

PRECONDITIONS:
- IMP-060 must already be accepted in current repository reality.
- IMP-013 must already be accepted in current repository reality.

MISSION:
Implement identity persistence behind ports.

FILES IN SCOPE:
- Create: src/modules/identity/infrastructure/postgres-user-repository.ts
- Create: src/modules/identity/infrastructure/postgres-session-repository.ts
- Create: tests/integration/identity/repositories.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Kysely/qc schema only.
2. Opaque sessions stored/compared securely.
3. Disable/session invalidation atomic where required.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- real PG repository tests
- disabled-account behavior

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-062 — Password hashing + session service

**Preconditions:** `IMP-061`

**Files in scope:**
- Create: src/modules/identity/security/password-hasher.ts
- Create: src/modules/identity/security/argon2-password-hasher.ts
- Create: src/modules/identity/application/session-service.ts
- Create: tests/unit/identity/password-hasher.test.ts
- Create: tests/integration/identity/session-service.test.ts

**Required specs:**
- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/BUSINESS-RULES.md`

**Acceptance requirements:**
- Use Argon2id if consistent with Security Architecture/current guidance; record technical parameters, not invented business policy.
- HttpOnly/Secure-in-production/SameSite cookie semantics.
- Never store/log plaintext password.
- Admin password reset invalidates sessions as approved.

**Required verification:**
- hash/verify/wrong password
- rotation/revocation
- cookie attrs

### Copy-ready Codex prompt

```text
TASK ID: IMP-062
TITLE: Password hashing + session service

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/SECURITY-ARCHITECTURE.md
- Documents/BUSINESS-RULES.md

PRECONDITIONS:
- IMP-061 must already be accepted in current repository reality.

MISSION:
Password verification and opaque server-side sessions.

FILES IN SCOPE:
- Create: src/modules/identity/security/password-hasher.ts
- Create: src/modules/identity/security/argon2-password-hasher.ts
- Create: src/modules/identity/application/session-service.ts
- Create: tests/unit/identity/password-hasher.test.ts
- Create: tests/integration/identity/session-service.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Use Argon2id if consistent with Security Architecture/current guidance; record technical parameters, not invented business policy.
2. HttpOnly/Secure-in-production/SameSite cookie semantics.
3. Never store/log plaintext password.
4. Admin password reset invalidates sessions as approved.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- hash/verify/wrong password
- rotation/revocation
- cookie attrs

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-063 — Login/logout/session resolution

**Preconditions:** `IMP-062`

**Files in scope:**
- Create: src/modules/identity/application/login.ts
- Create: src/modules/identity/application/logout.ts
- Create: src/modules/identity/application/resolve-session.ts
- Create: tests/integration/identity/auth-use-cases.test.ts

**Required specs:**
- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/ERROR-ARCHITECTURE.md`
- `Documents/BUSINESS-RULES.md`

**Acceptance requirements:**
- Actor derived server-side from session.
- Login failure does not leak user existence where required.
- Logout revokes session and is idempotent.
- Disabled/expired/revoked rejected.

**Required verification:**
- success/wrong password/unknown/disabled/revoked/repeated logout

### Copy-ready Codex prompt

```text
TASK ID: IMP-063
TITLE: Login/logout/session resolution

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/SECURITY-ARCHITECTURE.md
- Documents/ERROR-ARCHITECTURE.md
- Documents/BUSINESS-RULES.md

PRECONDITIONS:
- IMP-062 must already be accepted in current repository reality.

MISSION:
Implement authentication use cases.

FILES IN SCOPE:
- Create: src/modules/identity/application/login.ts
- Create: src/modules/identity/application/logout.ts
- Create: src/modules/identity/application/resolve-session.ts
- Create: tests/integration/identity/auth-use-cases.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Actor derived server-side from session.
2. Login failure does not leak user existence where required.
3. Logout revokes session and is idempotent.
4. Disabled/expired/revoked rejected.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- success/wrong password/unknown/disabled/revoked/repeated logout

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-064 — Account self-service

**Preconditions:** `IMP-063`

**Files in scope:**
- Create: src/modules/identity/application/get-account.ts
- Create: src/modules/identity/application/change-password.ts
- Create: tests/integration/identity/account.test.ts

**Required specs:**
- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`

**Acceptance requirements:**
- Reauthentication/current-password semantics from Security Architecture.
- No `/auth/recovery` or reset implementation while deferred.
- Session invalidation per policy.

**Required verification:**
- password change
- session behavior
- prove no deferred recovery files

### Copy-ready Codex prompt

```text
TASK ID: IMP-064
TITLE: Account self-service

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/SECURITY-ARCHITECTURE.md
- Documents/UI-UX-SPECIFICATION.md
- Documents/ROUTE-MANIFEST-SPECIFICATION.md

PRECONDITIONS:
- IMP-063 must already be accepted in current repository reality.

MISSION:
Authenticated account read/change-password; keep password recovery deferred.

FILES IN SCOPE:
- Create: src/modules/identity/application/get-account.ts
- Create: src/modules/identity/application/change-password.ts
- Create: tests/integration/identity/account.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Reauthentication/current-password semantics from Security Architecture.
2. No `/auth/recovery` or reset implementation while deferred.
3. Session invalidation per policy.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- password change
- session behavior
- prove no deferred recovery files

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-065 — Administrative user lifecycle

**Preconditions:** `IMP-044`, `IMP-045`, `IMP-063`

**Files in scope:**
- Create: src/modules/identity/application/create-user.ts
- Create: src/modules/identity/application/update-user.ts
- Create: src/modules/identity/application/disable-user.ts
- Create: src/modules/identity/application/admin-reset-password.ts
- Create: tests/integration/identity/admin-user-lifecycle.test.ts

**Required specs:**
- `Documents/PERMISSION-MATRIX.md`
- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/BUSINESS-RULES.md`

**Acceptance requirements:**
- No public signup.
- Every command authorizes actor server-side.
- Admin role alone insufficient.
- Disable/reset audit + session invalidation as required.

**Required verification:**
- no permission/wrong scope/allowed/audit atomicity

### Copy-ready Codex prompt

```text
TASK ID: IMP-065
TITLE: Administrative user lifecycle

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/PERMISSION-MATRIX.md
- Documents/SECURITY-ARCHITECTURE.md
- Documents/BUSINESS-RULES.md

PRECONDITIONS:
- IMP-044 must already be accepted in current repository reality.
- IMP-045 must already be accepted in current repository reality.
- IMP-063 must already be accepted in current repository reality.

MISSION:
User administration behind explicit authorization.

FILES IN SCOPE:
- Create: src/modules/identity/application/create-user.ts
- Create: src/modules/identity/application/update-user.ts
- Create: src/modules/identity/application/disable-user.ts
- Create: src/modules/identity/application/admin-reset-password.ts
- Create: tests/integration/identity/admin-user-lifecycle.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. No public signup.
2. Every command authorizes actor server-side.
3. Admin role alone insufficient.
4. Disable/reset audit + session invalidation as required.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- no permission/wrong scope/allowed/audit atomicity

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-066 — Auth/account Astro Actions

**Preconditions:** `IMP-064`

**Files in scope:**
- Create: src/actions/index.ts
- Create: src/actions/auth.ts
- Create: src/actions/account.ts
- Create: tests/integration/actions/auth-actions.test.ts

**Required specs:**
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/ERROR-ARCHITECTURE.md`
- `Documents/SECURITY-ARCHITECTURE.md`

**Acceptance requirements:**
- No repository/Kysely imports.
- Logout Action only, no GET logout.
- Validate safe returnTo.
- Map AppError safely.

**Required verification:**
- direct Action
- origin/CSRF
- raw-error absence

### Copy-ready Codex prompt

```text
TASK ID: IMP-066
TITLE: Auth/account Astro Actions

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/ERROR-ARCHITECTURE.md
- Documents/SECURITY-ARCHITECTURE.md

PRECONDITIONS:
- IMP-064 must already be accepted in current repository reality.

MISSION:
Thin Actions for login/logout/account mutations.

FILES IN SCOPE:
- Create: src/actions/index.ts
- Create: src/actions/auth.ts
- Create: src/actions/account.ts
- Create: tests/integration/actions/auth-actions.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. No repository/Kysely imports.
2. Logout Action only, no GET logout.
3. Validate safe returnTo.
4. Map AppError safely.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- direct Action
- origin/CSRF
- raw-error absence

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-067 — Login + Account pages

**Preconditions:** `IMP-066`, `IMP-054`

**Files in scope:**
- Create: src/pages/login.astro
- Create: src/pages/account.astro

**Required specs:**
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/DESIGN-SYSTEM.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`

**Acceptance requirements:**
- Authenticated /login → /dashboard.
- Account class AUTHENTICATED.
- Accessible labels/errors/focus.
- No recovery/reset pages.

**Required verification:**
- Playwright login success/failure
- account unauth redirect

### Copy-ready Codex prompt

```text
TASK ID: IMP-067
TITLE: Login + Account pages

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/UI-UX-SPECIFICATION.md
- Documents/DESIGN-SYSTEM.md
- Documents/ROUTE-MANIFEST-SPECIFICATION.md

PRECONDITIONS:
- IMP-066 must already be accepted in current repository reality.
- IMP-054 must already be accepted in current repository reality.

MISSION:
Server-rendered login/account pages.

FILES IN SCOPE:
- Create: src/pages/login.astro
- Create: src/pages/account.astro

NON-NEGOTIABLE REQUIREMENTS:
1. Authenticated /login → /dashboard.
2. Account class AUTHENTICATED.
3. Accessible labels/errors/focus.
4. No recovery/reset pages.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Playwright login success/failure
- account unauth redirect

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-068 — Connect middleware to real session resolver

**Preconditions:** `IMP-063`, `IMP-042`

**Files in scope:**
- Modify: src/middleware.ts
- Create: tests/integration/http/auth-middleware.test.ts

**Required specs:**
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/SECURITY-ARCHITECTURE.md`

**Acceptance requirements:**
- Protect operational routes unauthenticated.
- Public /login accessible.
- No domain permission logic in middleware.

**Required verification:**
- protected redirect
- revoked session
- no authz bypass

### Copy-ready Codex prompt

```text
TASK ID: IMP-068
TITLE: Connect middleware to real session resolver

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/SECURITY-ARCHITECTURE.md

PRECONDITIONS:
- IMP-063 must already be accepted in current repository reality.
- IMP-042 must already be accepted in current repository reality.

MISSION:
Resolve opaque sessions into Astro.locals while preserving per-use-case authorization.

FILES IN SCOPE:
- Modify: src/middleware.ts
- Create: tests/integration/http/auth-middleware.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Protect operational routes unauthenticated.
2. Public /login accessible.
3. No domain permission logic in middleware.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- protected redirect
- revoked session
- no authz bypass

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

---

# Phase 4 — Authorization Administration

## IMP-070 — Authorization persistence repository

**Preconditions:** `IMP-017`, `IMP-044`

**Files in scope:**
- Create: src/modules/administration/ports/authorization-repository.ts
- Create: src/modules/administration/infrastructure/postgres-authorization-repository.ts
- Create: tests/integration/administration/authorization-repository.test.ts

**Required specs:**
- `Documents/PERMISSION-MATRIX.md`
- `Documents/ROLE-MATRIX.md`
- `Documents/DATA-DICTIONARY.md`

**Acceptance requirements:**
- No hierarchy.
- Explicit permission/scope only.
- No Admin implied privileges.

**Required verification:**
- repository operations supported by model
- cross-scope isolation

### Copy-ready Codex prompt

```text
TASK ID: IMP-070
TITLE: Authorization persistence repository

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/PERMISSION-MATRIX.md
- Documents/ROLE-MATRIX.md
- Documents/DATA-DICTIONARY.md

PRECONDITIONS:
- IMP-017 must already be accepted in current repository reality.
- IMP-044 must already be accepted in current repository reality.

MISSION:
Role/permission/scope/grant persistence.

FILES IN SCOPE:
- Create: src/modules/administration/ports/authorization-repository.ts
- Create: src/modules/administration/infrastructure/postgres-authorization-repository.ts
- Create: tests/integration/administration/authorization-repository.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. No hierarchy.
2. Explicit permission/scope only.
3. No Admin implied privileges.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- repository operations supported by model
- cross-scope isolation

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-071 — Role/permission/scope use cases

**Preconditions:** `IMP-070`, `IMP-045`

**Files in scope:**
- Create: src/modules/administration/application/list-roles.ts
- Create: src/modules/administration/application/get-role.ts
- Create: src/modules/administration/application/update-role-permissions.ts
- Create: src/modules/administration/application/list-permissions.ts
- Create: src/modules/administration/application/manage-user-scopes.ts
- Create: tests/integration/administration/authorization-use-cases.test.ts

**Required specs:**
- `Documents/PERMISSION-MATRIX.md`
- `Documents/ROLE-MATRIX.md`
- `Documents/RISK-REGISTER.md`

**Acceptance requirements:**
- Explicit admin permission codes only.
- Do not create new Foundation roles.
- No self-grant bypass unless approved.
- Audit before/after meaning.

**Required verification:**
- Admin-without-permission denied
- authorized change
- audit atomicity

### Copy-ready Codex prompt

```text
TASK ID: IMP-071
TITLE: Role/permission/scope use cases

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/PERMISSION-MATRIX.md
- Documents/ROLE-MATRIX.md
- Documents/RISK-REGISTER.md

PRECONDITIONS:
- IMP-070 must already be accepted in current repository reality.
- IMP-045 must already be accepted in current repository reality.

MISSION:
High-risk permission/scope administration.

FILES IN SCOPE:
- Create: src/modules/administration/application/list-roles.ts
- Create: src/modules/administration/application/get-role.ts
- Create: src/modules/administration/application/update-role-permissions.ts
- Create: src/modules/administration/application/list-permissions.ts
- Create: src/modules/administration/application/manage-user-scopes.ts
- Create: tests/integration/administration/authorization-use-cases.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Explicit admin permission codes only.
2. Do not create new Foundation roles.
3. No self-grant bypass unless approved.
4. Audit before/after meaning.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Admin-without-permission denied
- authorized change
- audit atomicity

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-072 — Admin Actions

**Preconditions:** `IMP-065`, `IMP-071`

**Files in scope:**
- Create: src/actions/admin.ts
- Modify: src/actions/index.ts
- Create: tests/integration/actions/admin-actions.test.ts

**Required specs:**
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/ERROR-ARCHITECTURE.md`

**Acceptance requirements:**
- Reauthorize each mutation.
- No actor/decision from client.
- Optimistic version where present.

**Required verification:**
- direct Action denial
- stale conflict
- no GET mutation

### Copy-ready Codex prompt

```text
TASK ID: IMP-072
TITLE: Admin Actions

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/PERMISSION-MATRIX.md
- Documents/ERROR-ARCHITECTURE.md

PRECONDITIONS:
- IMP-065 must already be accepted in current repository reality.
- IMP-071 must already be accepted in current repository reality.

MISSION:
Thin Delivery Actions for users/roles/permissions/scopes.

FILES IN SCOPE:
- Create: src/actions/admin.ts
- Modify: src/actions/index.ts
- Create: tests/integration/actions/admin-actions.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Reauthorize each mutation.
2. No actor/decision from client.
3. Optimistic version where present.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- direct Action denial
- stale conflict
- no GET mutation

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

---

# Phase 5 — Design System & Application Shell

## IMP-080 — Tokens/fonts/global CSS

**Preconditions:** `IMP-002`

**Files in scope:**
- Create: src/ui/styles/tokens.css
- Create: src/ui/styles/global.css
- Create: src/ui/styles/motion.css
- Create: src/ui/styles/density.css

**Required specs:**
- `Documents/DESIGN-SYSTEM.md`
- `Documents/UI-UX-SPECIFICATION.md`

**Acceptance requirements:**
- Copy exact approved tokens.
- Inter Latin + IBM Plex Sans Arabic using verified privacy-safe build strategy.
- Reduced motion.
- PASS token distinct from RELEASED; color not sole status signal.

**Required verification:**
- compare tokens to spec
- CSS build

### Copy-ready Codex prompt

```text
TASK ID: IMP-080
TITLE: Tokens/fonts/global CSS

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DESIGN-SYSTEM.md
- Documents/UI-UX-SPECIFICATION.md

PRECONDITIONS:
- IMP-002 must already be accepted in current repository reality.

MISSION:
Implement approved dark-only design tokens/typography.

FILES IN SCOPE:
- Create: src/ui/styles/tokens.css
- Create: src/ui/styles/global.css
- Create: src/ui/styles/motion.css
- Create: src/ui/styles/density.css

NON-NEGOTIABLE REQUIREMENTS:
1. Copy exact approved tokens.
2. Inter Latin + IBM Plex Sans Arabic using verified privacy-safe build strategy.
3. Reduced motion.
4. PASS token distinct from RELEASED; color not sole status signal.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- compare tokens to spec
- CSS build

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-081 — Layouts

**Preconditions:** `IMP-080`, `IMP-054`

**Files in scope:**
- Create: src/ui/layouts/BaseLayout.astro
- Create: src/ui/layouts/AuthLayout.astro
- Create: src/ui/layouts/AppLayout.astro

**Required specs:**
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/DESIGN-SYSTEM.md`
- `Documents/SECURITY-ARCHITECTURE.md`

**Acceptance requirements:**
- lang/dir from i18n.
- AppLayout composes shell slots.
- No secret/debug HTML.

**Required verification:**
- Astro build/typecheck

### Copy-ready Codex prompt

```text
TASK ID: IMP-081
TITLE: Layouts

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/UI-UX-SPECIFICATION.md
- Documents/DESIGN-SYSTEM.md
- Documents/SECURITY-ARCHITECTURE.md

PRECONDITIONS:
- IMP-080 must already be accepted in current repository reality.
- IMP-054 must already be accepted in current repository reality.

MISSION:
Base/Auth/App layouts only; no DB/business logic.

FILES IN SCOPE:
- Create: src/ui/layouts/BaseLayout.astro
- Create: src/ui/layouts/AuthLayout.astro
- Create: src/ui/layouts/AppLayout.astro

NON-NEGOTIABLE REQUIREMENTS:
1. lang/dir from i18n.
2. AppLayout composes shell slots.
3. No secret/debug HTML.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Astro build/typecheck

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-082 — Core visual primitives

**Preconditions:** `IMP-081`

**Files in scope:**
- Create: src/ui/components/Button.astro
- Create: src/ui/components/IconButton.astro
- Create: src/ui/components/Badge.astro
- Create: src/ui/components/Card.astro
- Create: src/ui/components/Divider.astro
- Create: src/ui/components/Tooltip.astro
- Create: src/ui/components/StatusBadge.astro
- Create: src/ui/components/StateBanner.astro

**Required specs:**
- `Documents/DESIGN-SYSTEM.md`
- `Documents/UI-UX-SPECIFICATION.md`

**Acceptance requirements:**
- Status always explicit text.
- PASS/RELEASED separate tokens.
- Permission decisions passed in; components never authorize.
- Keyboard/focus-visible.

**Required verification:**
- accessible names/focus
- token usage

### Copy-ready Codex prompt

```text
TASK ID: IMP-082
TITLE: Core visual primitives

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DESIGN-SYSTEM.md
- Documents/UI-UX-SPECIFICATION.md

PRECONDITIONS:
- IMP-081 must already be accepted in current repository reality.

MISSION:
Accessible reusable visual components.

FILES IN SCOPE:
- Create: src/ui/components/Button.astro
- Create: src/ui/components/IconButton.astro
- Create: src/ui/components/Badge.astro
- Create: src/ui/components/Card.astro
- Create: src/ui/components/Divider.astro
- Create: src/ui/components/Tooltip.astro
- Create: src/ui/components/StatusBadge.astro
- Create: src/ui/components/StateBanner.astro

NON-NEGOTIABLE REQUIREMENTS:
1. Status always explicit text.
2. PASS/RELEASED separate tokens.
3. Permission decisions passed in; components never authorize.
4. Keyboard/focus-visible.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- accessible names/focus
- token usage

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-083 — Form components

**Preconditions:** `IMP-082`

**Files in scope:**
- Create: src/ui/components/forms/FormField.astro
- Create: src/ui/components/forms/TextInput.astro
- Create: src/ui/components/forms/TextArea.astro
- Create: src/ui/components/forms/Select.astro
- Create: src/ui/components/forms/Checkbox.astro
- Create: src/ui/components/forms/DateInput.astro
- Create: src/ui/components/forms/NumberInput.astro
- Create: src/ui/components/forms/ErrorSummary.astro
- Create: src/ui/components/forms/FormActions.astro

**Required specs:**
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/DESIGN-SYSTEM.md`
- `Documents/ERROR-ARCHITECTURE.md`

**Acceptance requirements:**
- Explicit labels/error association.
- No placeholder-only label.
- Number input does not invent precision/rounding.
- Controlled action distinct from save draft.

**Required verification:**
- keyboard form
- error association
- RTL

### Copy-ready Codex prompt

```text
TASK ID: IMP-083
TITLE: Form components

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/UI-UX-SPECIFICATION.md
- Documents/DESIGN-SYSTEM.md
- Documents/ERROR-ARCHITECTURE.md

PRECONDITIONS:
- IMP-082 must already be accepted in current repository reality.

MISSION:
Accessible long-form QC inputs.

FILES IN SCOPE:
- Create: src/ui/components/forms/FormField.astro
- Create: src/ui/components/forms/TextInput.astro
- Create: src/ui/components/forms/TextArea.astro
- Create: src/ui/components/forms/Select.astro
- Create: src/ui/components/forms/Checkbox.astro
- Create: src/ui/components/forms/DateInput.astro
- Create: src/ui/components/forms/NumberInput.astro
- Create: src/ui/components/forms/ErrorSummary.astro
- Create: src/ui/components/forms/FormActions.astro

NON-NEGOTIABLE REQUIREMENTS:
1. Explicit labels/error association.
2. No placeholder-only label.
3. Number input does not invent precision/rounding.
4. Controlled action distinct from save draft.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- keyboard form
- error association
- RTL

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-084 — Tables/filters/pagination

**Preconditions:** `IMP-083`

**Files in scope:**
- Create: src/ui/components/data/DataTable.astro
- Create: src/ui/components/data/TableToolbar.astro
- Create: src/ui/components/data/FilterBar.astro
- Create: src/ui/components/data/Pagination.astro
- Create: src/ui/components/data/SortHeader.astro
- Create: src/ui/components/data/EmptyTableState.astro

**Required specs:**
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/DESIGN-SYSTEM.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`

**Acceptance requirements:**
- Server pagination/filter/sort.
- URL query only for display filters, never authoritative mutation/permission.
- Responsive without hiding critical state.
- Accessible table semantics.

**Required verification:**
- keyboard/sort
- query serialization

### Copy-ready Codex prompt

```text
TASK ID: IMP-084
TITLE: Tables/filters/pagination

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/UI-UX-SPECIFICATION.md
- Documents/DESIGN-SYSTEM.md
- Documents/ROUTE-MANIFEST-SPECIFICATION.md

PRECONDITIONS:
- IMP-083 must already be accepted in current repository reality.

MISSION:
Data-dense server-driven list UI.

FILES IN SCOPE:
- Create: src/ui/components/data/DataTable.astro
- Create: src/ui/components/data/TableToolbar.astro
- Create: src/ui/components/data/FilterBar.astro
- Create: src/ui/components/data/Pagination.astro
- Create: src/ui/components/data/SortHeader.astro
- Create: src/ui/components/data/EmptyTableState.astro

NON-NEGOTIABLE REQUIREMENTS:
1. Server pagination/filter/sort.
2. URL query only for display filters, never authoritative mutation/permission.
3. Responsive without hiding critical state.
4. Accessible table semantics.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- keyboard/sort
- query serialization

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-085 — Sidebar/topbar/navigation

**Preconditions:** `IMP-082`, `IMP-044`

**Files in scope:**
- Create: src/ui/shell/Sidebar.astro
- Create: src/ui/shell/Topbar.astro
- Create: src/ui/shell/Breadcrumbs.astro
- Create: src/ui/shell/ScopeIndicator.astro
- Create: src/ui/shell/UserMenu.astro
- Create: src/ui/navigation/navigation.ts

**Required specs:**
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/PERMISSION-MATRIX.md`

**Acceptance requirements:**
- Groups match approved IA.
- Visibility permission/scope-aware but not authorization.
- Collapsed sidebar accessible.
- Topbar search/scope/notifications/approvals/user context.

**Required verification:**
- role/capability rendering
- keyboard order

### Copy-ready Codex prompt

```text
TASK ID: IMP-085
TITLE: Sidebar/topbar/navigation

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/UI-UX-SPECIFICATION.md
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/PERMISSION-MATRIX.md

PRECONDITIONS:
- IMP-082 must already be accepted in current repository reality.
- IMP-044 must already be accepted in current repository reality.

MISSION:
Universal shell navigation from authorized capabilities.

FILES IN SCOPE:
- Create: src/ui/shell/Sidebar.astro
- Create: src/ui/shell/Topbar.astro
- Create: src/ui/shell/Breadcrumbs.astro
- Create: src/ui/shell/ScopeIndicator.astro
- Create: src/ui/shell/UserMenu.astro
- Create: src/ui/navigation/navigation.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Groups match approved IA.
2. Visibility permission/scope-aware but not authorization.
3. Collapsed sidebar accessible.
4. Topbar search/scope/notifications/approvals/user context.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- role/capability rendering
- keyboard order

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-086 — Feedback/dialog/toast/stale conflict

**Preconditions:** `IMP-083`

**Files in scope:**
- Create: src/ui/components/feedback/EmptyState.astro
- Create: src/ui/components/feedback/ErrorState.astro
- Create: src/ui/components/feedback/LoadingState.astro
- Create: src/ui/components/feedback/StaleVersionState.astro
- Create: src/ui/components/feedback/ConfirmDialog.astro
- Create: src/ui/components/feedback/ToastRegion.astro
- Create: src/ui/client/dialog.ts
- Create: src/ui/client/toast.ts

**Required specs:**
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/ERROR-ARCHITECTURE.md`
- `Documents/DESIGN-SYSTEM.md`

**Acceptance requirements:**
- Stale version blocks overwrite.
- Accessible dialog focus/restore/Escape.
- Reason/intent where required.
- Toast is never controlled evidence.

**Required verification:**
- dialog keyboard
- stale blocking
- live region

### Copy-ready Codex prompt

```text
TASK ID: IMP-086
TITLE: Feedback/dialog/toast/stale conflict

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/UI-UX-SPECIFICATION.md
- Documents/ERROR-ARCHITECTURE.md
- Documents/DESIGN-SYSTEM.md

PRECONDITIONS:
- IMP-083 must already be accepted in current repository reality.

MISSION:
Consistent feedback and explicit controlled-action confirmation.

FILES IN SCOPE:
- Create: src/ui/components/feedback/EmptyState.astro
- Create: src/ui/components/feedback/ErrorState.astro
- Create: src/ui/components/feedback/LoadingState.astro
- Create: src/ui/components/feedback/StaleVersionState.astro
- Create: src/ui/components/feedback/ConfirmDialog.astro
- Create: src/ui/components/feedback/ToastRegion.astro
- Create: src/ui/client/dialog.ts
- Create: src/ui/client/toast.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Stale version blocks overwrite.
2. Accessible dialog focus/restore/Escape.
3. Reason/intent where required.
4. Toast is never controlled evidence.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- dialog keyboard
- stale blocking
- live region

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-087 — E-Signature dialog

**Preconditions:** `IMP-086`

**Files in scope:**
- Create: src/ui/components/governance/ESignatureDialog.astro
- Create: src/ui/client/e-signature.ts

**Required specs:**
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/PERMISSION-MATRIX.md`

**Acceptance requirements:**
- Show meaning/subject/version/context.
- No independent sign route.
- Reauth secret server-only and not persisted.
- Server decides authz/state/version/SoD.

**Required verification:**
- focus
- secret not persisted
- server denial rendering

### Copy-ready Codex prompt

```text
TASK ID: IMP-087
TITLE: E-Signature dialog

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/UI-UX-SPECIFICATION.md
- Documents/SECURITY-ARCHITECTURE.md
- Documents/PERMISSION-MATRIX.md

PRECONDITIONS:
- IMP-086 must already be accepted in current repository reality.

MISSION:
Reusable E-Signature ceremony UI only.

FILES IN SCOPE:
- Create: src/ui/components/governance/ESignatureDialog.astro
- Create: src/ui/client/e-signature.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Show meaning/subject/version/context.
2. No independent sign route.
3. Reauth secret server-only and not persisted.
4. Server decides authz/state/version/SoD.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- focus
- secret not persisted
- server denial rendering

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-088 — Charts/KPI primitives

**Preconditions:** `IMP-080`

**Files in scope:**
- Create: src/ui/charts/Chart.astro
- Create: src/ui/charts/chart-client.ts
- Create: src/ui/charts/KpiCard.astro
- Create: src/ui/charts/Legend.astro

**Required specs:**
- `Documents/DESIGN-SYSTEM.md`
- `Documents/UI-UX-SPECIFICATION.md`

**Acceptance requirements:**
- Authorized aggregated data only.
- Accessible text/table summary.
- Approved tokens/semantic colors.
- Reduced motion.

**Required verification:**
- render/accessibility
- no DB import

### Copy-ready Codex prompt

```text
TASK ID: IMP-088
TITLE: Charts/KPI primitives

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DESIGN-SYSTEM.md
- Documents/UI-UX-SPECIFICATION.md

PRECONDITIONS:
- IMP-080 must already be accepted in current repository reality.

MISSION:
Dashboard charts with a pinned verified library; ECharts preferred.

FILES IN SCOPE:
- Create: src/ui/charts/Chart.astro
- Create: src/ui/charts/chart-client.ts
- Create: src/ui/charts/KpiCard.astro
- Create: src/ui/charts/Legend.astro

NON-NEGOTIABLE REQUIREMENTS:
1. Authorized aggregated data only.
2. Accessible text/table summary.
3. Approved tokens/semantic colors.
4. Reduced motion.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- render/accessibility
- no DB import

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-089 — Root/404/500 + AppLayout shell

**Preconditions:** `IMP-068`, `IMP-085`, `IMP-086`

**Files in scope:**
- Create: src/pages/index.astro
- Create: src/pages/404.astro
- Create: src/pages/500.astro
- Modify: src/ui/layouts/AppLayout.astro

**Required specs:**
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/ERROR-ARCHITECTURE.md`
- `Documents/UI-UX-SPECIFICATION.md`

**Acceptance requirements:**
- / unauth→/login; auth→/dashboard.
- 404 safe for IDOR.
- 500 requestId, no stack/SQL.
- Wire sidebar/topbar.

**Required verification:**
- root redirects
- safe 404/500
- pnpm build

### Copy-ready Codex prompt

```text
TASK ID: IMP-089
TITLE: Root/404/500 + AppLayout shell

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/ERROR-ARCHITECTURE.md
- Documents/UI-UX-SPECIFICATION.md

PRECONDITIONS:
- IMP-068 must already be accepted in current repository reality.
- IMP-085 must already be accepted in current repository reality.
- IMP-086 must already be accepted in current repository reality.

MISSION:
Root redirects and safe error pages.

FILES IN SCOPE:
- Create: src/pages/index.astro
- Create: src/pages/404.astro
- Create: src/pages/500.astro
- Modify: src/ui/layouts/AppLayout.astro

NON-NEGOTIABLE REQUIREMENTS:
1. / unauth→/login; auth→/dashboard.
2. 404 safe for IDOR.
3. 500 requestId, no stack/SQL.
4. Wire sidebar/topbar.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- root redirects
- safe 404/500
- pnpm build

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

---

# Phase 6 — Shared Read Models & Insights

## IMP-090 — Dashboard read model

**Preconditions:** `IMP-044`, `IMP-030`

**Files in scope:**
- Create: src/modules/dashboard/application/get-dashboard.ts
- Create: src/modules/dashboard/ports/dashboard-query.ts
- Create: src/modules/dashboard/infrastructure/postgres-dashboard-query.ts
- Create: tests/integration/dashboard/dashboard-query.test.ts

**Required specs:**
- `Documents/DOMAIN-MAP.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/PERMISSION-MATRIX.md`

**Acceptance requirements:**
- No global fetch then client hide.
- PASS and Release separate metrics.
- No invented KPI formula.

**Required verification:**
- cross-scope dashboard tests

### Copy-ready Codex prompt

```text
TASK ID: IMP-090
TITLE: Dashboard read model

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DOMAIN-MAP.md
- Documents/UI-UX-SPECIFICATION.md
- Documents/PERMISSION-MATRIX.md

PRECONDITIONS:
- IMP-044 must already be accepted in current repository reality.
- IMP-030 must already be accepted in current repository reality.

MISSION:
Role/scope-aware dashboard aggregation only.

FILES IN SCOPE:
- Create: src/modules/dashboard/application/get-dashboard.ts
- Create: src/modules/dashboard/ports/dashboard-query.ts
- Create: src/modules/dashboard/infrastructure/postgres-dashboard-query.ts
- Create: tests/integration/dashboard/dashboard-query.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. No global fetch then client hide.
2. PASS and Release separate metrics.
3. No invented KPI formula.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- cross-scope dashboard tests

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-091 — Dashboard page

**Preconditions:** `IMP-088`, `IMP-090`

**Files in scope:**
- Create: src/pages/dashboard/index.astro

**Required specs:**
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/DESIGN-SYSTEM.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`

**Acceptance requirements:**
- No GET mutation.
- Scoped attention/approvals/activity.
- Responsive/a11y.

**Required verification:**
- role-scoped Playwright
- RTL/mobile

### Copy-ready Codex prompt

```text
TASK ID: IMP-091
TITLE: Dashboard page

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/UI-UX-SPECIFICATION.md
- Documents/DESIGN-SYSTEM.md
- Documents/ROUTE-MANIFEST-SPECIFICATION.md

PRECONDITIONS:
- IMP-088 must already be accepted in current repository reality.
- IMP-090 must already be accepted in current repository reality.

MISSION:
QC Operational Command Center from authorized read model.

FILES IN SCOPE:
- Create: src/pages/dashboard/index.astro

NON-NEGOTIABLE REQUIREMENTS:
1. No GET mutation.
2. Scoped attention/approvals/activity.
3. Responsive/a11y.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- role-scoped Playwright
- RTL/mobile

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-092 — Authorized global search service

**Preconditions:** `IMP-044`, `IMP-040`

**Files in scope:**
- Create: src/shared/search/search-result.ts
- Create: src/shared/search/search-service.ts
- Create: src/shared/search/postgres-search.ts
- Create: tests/integration/shared/search.test.ts

**Required specs:**
- `Documents/DOMAIN-MAP.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/PERMISSION-MATRIX.md`

**Acceptance requirements:**
- Approved entity types/fields only.
- Authz/scope in server query; unauthorized results never returned.
- Validate/limit q.

**Required verification:**
- scope leakage
- query limits
- SQL injection

### Copy-ready Codex prompt

```text
TASK ID: IMP-092
TITLE: Authorized global search service

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DOMAIN-MAP.md
- Documents/UI-UX-SPECIFICATION.md
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/PERMISSION-MATRIX.md

PRECONDITIONS:
- IMP-044 must already be accepted in current repository reality.
- IMP-040 must already be accepted in current repository reality.

MISSION:
Cross-domain search read capability.

FILES IN SCOPE:
- Create: src/shared/search/search-result.ts
- Create: src/shared/search/search-service.ts
- Create: src/shared/search/postgres-search.ts
- Create: tests/integration/shared/search.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Approved entity types/fields only.
2. Authz/scope in server query; unauthorized results never returned.
3. Validate/limit q.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- scope leakage
- query limits
- SQL injection

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-093 — Search + Notifications pages

**Preconditions:** `IMP-047`, `IMP-092`, `IMP-085`

**Files in scope:**
- Create: src/pages/search.astro
- Create: src/pages/notifications.astro
- Modify: src/ui/shell/Topbar.astro

**Required specs:**
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`

**Acceptance requirements:**
- Search URL query validated.
- Notifications recipient-only.
- Cmd/Ctrl+K if implemented uses same server service.

**Required verification:**
- search keyboard
- notification isolation

### Copy-ready Codex prompt

```text
TASK ID: IMP-093
TITLE: Search + Notifications pages

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/UI-UX-SPECIFICATION.md
- Documents/ROUTE-MANIFEST-SPECIFICATION.md

PRECONDITIONS:
- IMP-047 must already be accepted in current repository reality.
- IMP-092 must already be accepted in current repository reality.
- IMP-085 must already be accepted in current repository reality.

MISSION:
Search and notifications surfaces using shared services.

FILES IN SCOPE:
- Create: src/pages/search.astro
- Create: src/pages/notifications.astro
- Modify: src/ui/shell/Topbar.astro

NON-NEGOTIABLE REQUIREMENTS:
1. Search URL query validated.
2. Notifications recipient-only.
3. Cmd/Ctrl+K if implemented uses same server service.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- search keyboard
- notification isolation

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-094 — Audit query + page

**Preconditions:** `IMP-045`, `IMP-089`

**Files in scope:**
- Create: src/shared/audit/audit-query.ts
- Create: src/shared/audit/postgres-audit-query.ts
- Create: src/pages/audit.astro
- Create: tests/integration/shared/audit-query.test.ts

**Required specs:**
- `Documents/PERMISSION-MATRIX.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`

**Acceptance requirements:**
- Scope-limited.
- No secret payload fields.
- Record-level history remains composable.

**Required verification:**
- no permission
- scope
- safe rendering

### Copy-ready Codex prompt

```text
TASK ID: IMP-094
TITLE: Audit query + page

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/PERMISSION-MATRIX.md
- Documents/UI-UX-SPECIFICATION.md
- Documents/ROUTE-MANIFEST-SPECIFICATION.md

PRECONDITIONS:
- IMP-045 must already be accepted in current repository reality.
- IMP-089 must already be accepted in current repository reality.

MISSION:
Explicit-permission global audit viewing plus composable record history.

FILES IN SCOPE:
- Create: src/shared/audit/audit-query.ts
- Create: src/shared/audit/postgres-audit-query.ts
- Create: src/pages/audit.astro
- Create: tests/integration/shared/audit-query.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Scope-limited.
2. No secret payload fields.
3. Record-level history remains composable.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- no permission
- scope
- safe rendering

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-095 — Report registry/query

**Preconditions:** `IMP-044`, `IMP-030`

**Files in scope:**
- Create: src/modules/reporting/domain/report-definition.ts
- Create: src/modules/reporting/application/report-registry.ts
- Create: src/modules/reporting/application/run-report.ts
- Create: src/modules/reporting/ports/report-query.ts
- Create: src/modules/reporting/infrastructure/postgres-report-query.ts
- Create: tests/integration/reporting/reports.test.ts

**Required specs:**
- `Documents/DOMAIN-MAP.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/UI-UX-SPECIFICATION.md`

**Acceptance requirements:**
- reportCode registry only.
- No arbitrary SQL/table names.
- Same application scope.
- No invented KPI/report definition.

**Required verification:**
- unknown code 404
- scope leakage
- injection

### Copy-ready Codex prompt

```text
TASK ID: IMP-095
TITLE: Report registry/query

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DOMAIN-MAP.md
- Documents/PERMISSION-MATRIX.md
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/UI-UX-SPECIFICATION.md

PRECONDITIONS:
- IMP-044 must already be accepted in current repository reality.
- IMP-030 must already be accepted in current repository reality.

MISSION:
Allowlisted report definitions and scoped datasets.

FILES IN SCOPE:
- Create: src/modules/reporting/domain/report-definition.ts
- Create: src/modules/reporting/application/report-registry.ts
- Create: src/modules/reporting/application/run-report.ts
- Create: src/modules/reporting/ports/report-query.ts
- Create: src/modules/reporting/infrastructure/postgres-report-query.ts
- Create: tests/integration/reporting/reports.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. reportCode registry only.
2. No arbitrary SQL/table names.
3. Same application scope.
4. No invented KPI/report definition.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- unknown code 404
- scope leakage
- injection

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-096 — CSV/XLSX exports

**Preconditions:** `IMP-095`

**Files in scope:**
- Create: src/modules/reporting/application/export-report.ts
- Create: src/modules/reporting/infrastructure/csv-exporter.ts
- Create: src/modules/reporting/infrastructure/xlsx-exporter.ts
- Create: tests/unit/reporting/export-safety.test.ts
- Create: tests/integration/reporting/export-report.test.ts

**Required specs:**
- `Documents/RISK-REGISTER.md`
- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/PERMISSION-MATRIX.md`

**Acceptance requirements:**
- Exact authorized report dataset.
- PERM-RPT-EXPORT.
- Sanitize formula-trigger cells.
- No public temporary export.
- No PDF unless approved requirement says so.

**Required verification:**
- formula injection
- unauthorized export
- CSV/XLSX parity

### Copy-ready Codex prompt

```text
TASK ID: IMP-096
TITLE: CSV/XLSX exports

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/RISK-REGISTER.md
- Documents/SECURITY-ARCHITECTURE.md
- Documents/PERMISSION-MATRIX.md

PRECONDITIONS:
- IMP-095 must already be accepted in current repository reality.

MISSION:
Authorized exports with spreadsheet formula-injection defense.

FILES IN SCOPE:
- Create: src/modules/reporting/application/export-report.ts
- Create: src/modules/reporting/infrastructure/csv-exporter.ts
- Create: src/modules/reporting/infrastructure/xlsx-exporter.ts
- Create: tests/unit/reporting/export-safety.test.ts
- Create: tests/integration/reporting/export-report.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Exact authorized report dataset.
2. PERM-RPT-EXPORT.
3. Sanitize formula-trigger cells.
4. No public temporary export.
5. No PDF unless approved requirement says so.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- formula injection
- unauthorized export
- CSV/XLSX parity

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-097 — Reports pages/Action

**Preconditions:** `IMP-096`, `IMP-084`

**Files in scope:**
- Create: src/pages/reports/index.astro
- Create: src/pages/reports/[reportCode].astro
- Create: src/actions/reports.ts
- Modify: src/actions/index.ts

**Required specs:**
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/PERMISSION-MATRIX.md`

**Acceptance requirements:**
- GET never exports.
- Allowlist reportCode.
- Action reauthorizes.
- No SQL in Delivery.

**Required verification:**
- Playwright report
- unknown code
- export authz

### Copy-ready Codex prompt

```text
TASK ID: IMP-097
TITLE: Reports pages/Action

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/UI-UX-SPECIFICATION.md
- Documents/PERMISSION-MATRIX.md

PRECONDITIONS:
- IMP-096 must already be accepted in current repository reality.
- IMP-084 must already be accepted in current repository reality.

MISSION:
Report list/detail and export Action.

FILES IN SCOPE:
- Create: src/pages/reports/index.astro
- Create: src/pages/reports/[reportCode].astro
- Create: src/actions/reports.ts
- Modify: src/actions/index.ts

NON-NEGOTIABLE REQUIREMENTS:
1. GET never exports.
2. Allowlist reportCode.
3. Action reauthorizes.
4. No SQL in Delivery.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Playwright report
- unknown code
- export authz

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

---

# Phase 7 — Tasks

## IMP-100 — Tasks domain + repository port

**Preconditions:** `IMP-030`, `IMP-044`

**Files in scope:**
- Create: src/modules/tasks/domain/model.ts
- Create: src/modules/tasks/domain/state.ts
- Create: src/modules/tasks/ports/repository.ts
- Create: tests/unit/tasks/domain.test.ts

**Required specs:**
- `Documents/DOMAIN-MAP.md`
- `Documents/STATE-MACHINES.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/DATA-MODEL.md`

**Acceptance requirements:**
- Copy lifecycle/invariants exactly from State Machines/Business Rules.
- Undeclared transition DENY.
- No Astro/Kysely imports in domain.
- Client never supplies authoritative final state.
- Tasks must not replace Inspection/Lab/NCR/CAPA/Document Approval/Calibration/Receiving.
- Implement assignment/checklist/dependency/comment/blocker/recurrence/completion only when canonical model supports them.

**Required verification:**
- domain transition/invariant tests
- no infrastructure imports

### Copy-ready Codex prompt

```text
TASK ID: IMP-100
TITLE: Tasks domain + repository port

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DOMAIN-MAP.md
- Documents/STATE-MACHINES.md
- Documents/BUSINESS-RULES.md
- Documents/DATA-MODEL.md

PRECONDITIONS:
- IMP-030 must already be accepted in current repository reality.
- IMP-044 must already be accepted in current repository reality.

MISSION:
Implement Tasks domain model owned by Tasks Domain.

FILES IN SCOPE:
- Create: src/modules/tasks/domain/model.ts
- Create: src/modules/tasks/domain/state.ts
- Create: src/modules/tasks/ports/repository.ts
- Create: tests/unit/tasks/domain.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Copy lifecycle/invariants exactly from State Machines/Business Rules.
2. Undeclared transition DENY.
3. No Astro/Kysely imports in domain.
4. Client never supplies authoritative final state.
5. Tasks must not replace Inspection/Lab/NCR/CAPA/Document Approval/Calibration/Receiving.
6. Implement assignment/checklist/dependency/comment/blocker/recurrence/completion only when canonical model supports them.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- domain transition/invariant tests
- no infrastructure imports

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-101 — Tasks PostgreSQL repository

**Preconditions:** `IMP-100`

**Files in scope:**
- Create: src/modules/tasks/infrastructure/postgres-repository.ts
- Create: tests/integration/tasks/repository.test.ts

**Required specs:**
- `Documents/DOMAIN-MAP.md`
- `Documents/STATE-MACHINES.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/DATA-MODEL.md`
- `Documents/DATABASE-ARCHITECTURE.md`
- `Documents/DATA-DICTIONARY.md`

**Acceptance requirements:**
- Exact canonical table/column names.
- Optimistic version matching where specified.
- No cross-domain writes.
- Map DB failures safely.

**Required verification:**
- real PG repository
- stale version
- constraints

### Copy-ready Codex prompt

```text
TASK ID: IMP-101
TITLE: Tasks PostgreSQL repository

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DOMAIN-MAP.md
- Documents/STATE-MACHINES.md
- Documents/BUSINESS-RULES.md
- Documents/DATA-MODEL.md
- Documents/DATABASE-ARCHITECTURE.md
- Documents/DATA-DICTIONARY.md

PRECONDITIONS:
- IMP-100 must already be accepted in current repository reality.

MISSION:
Implement Tasks persistence behind repository port.

FILES IN SCOPE:
- Create: src/modules/tasks/infrastructure/postgres-repository.ts
- Create: tests/integration/tasks/repository.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Exact canonical table/column names.
2. Optimistic version matching where specified.
3. No cross-domain writes.
4. Map DB failures safely.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- real PG repository
- stale version
- constraints

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-102 — Tasks application use cases

**Preconditions:** `IMP-101`, `IMP-045`

**Files in scope:**
- Create: src/modules/tasks/application/create.ts
- Create: src/modules/tasks/application/get.ts
- Create: src/modules/tasks/application/list.ts
- Create: src/modules/tasks/application/update-draft.ts
- Create: src/modules/tasks/application/transition.ts
- Create: tests/integration/tasks/use-cases.test.ts

**Required specs:**
- `Documents/DOMAIN-MAP.md`
- `Documents/STATE-MACHINES.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/DATA-MODEL.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/BUSINESS-RULES.md`

**Acceptance requirements:**
- Every command reauthorizes.
- Draft-only ordinary edits.
- Current state/version/SoD for controlled transitions.
- Action intent derives state; no arbitrary target-state input.
- Audit important mutations atomically.

**Required verification:**
- allowed/no permission/wrong scope/wrong state/stale version/SoD/audit

### Copy-ready Codex prompt

```text
TASK ID: IMP-102
TITLE: Tasks application use cases

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DOMAIN-MAP.md
- Documents/STATE-MACHINES.md
- Documents/BUSINESS-RULES.md
- Documents/DATA-MODEL.md
- Documents/PERMISSION-MATRIX.md
- Documents/BUSINESS-RULES.md

PRECONDITIONS:
- IMP-101 must already be accepted in current repository reality.
- IMP-045 must already be accepted in current repository reality.

MISSION:
Implement Tasks commands/queries with authorization, transaction and audit/outbox.

FILES IN SCOPE:
- Create: src/modules/tasks/application/create.ts
- Create: src/modules/tasks/application/get.ts
- Create: src/modules/tasks/application/list.ts
- Create: src/modules/tasks/application/update-draft.ts
- Create: src/modules/tasks/application/transition.ts
- Create: tests/integration/tasks/use-cases.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Every command reauthorizes.
2. Draft-only ordinary edits.
3. Current state/version/SoD for controlled transitions.
4. Action intent derives state; no arbitrary target-state input.
5. Audit important mutations atomically.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- allowed/no permission/wrong scope/wrong state/stale version/SoD/audit

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-103 — Tasks Actions + Route pages

**Preconditions:** `IMP-102`, `IMP-084`, `IMP-086`

**Files in scope:**
- Create: src/actions/tasks.ts
- Modify: src/actions/index.ts
- Create: src/pages/tasks/index.astro
- Create: src/pages/tasks/new.astro
- Create: src/pages/tasks/[taskId].astro

**Required specs:**
- `Documents/DOMAIN-MAP.md`
- `Documents/STATE-MACHINES.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/DATA-MODEL.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/DESIGN-SYSTEM.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`

**Acceptance requirements:**
- Use exact Route Manifest paths.
- Pages only parse context/query, call use cases/read models and render.
- Actions no SQL/business rules.
- Show state/version/history/authorized capabilities.

**Required verification:**
- UUID params
- direct Action authorization
- Playwright workflows
- route checker

### Copy-ready Codex prompt

```text
TASK ID: IMP-103
TITLE: Tasks Actions + Route pages

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DOMAIN-MAP.md
- Documents/STATE-MACHINES.md
- Documents/BUSINESS-RULES.md
- Documents/DATA-MODEL.md
- Documents/UI-UX-SPECIFICATION.md
- Documents/DESIGN-SYSTEM.md
- Documents/ROUTE-MANIFEST-SPECIFICATION.md

PRECONDITIONS:
- IMP-102 must already be accepted in current repository reality.
- IMP-084 must already be accepted in current repository reality.
- IMP-086 must already be accepted in current repository reality.

MISSION:
Implement Tasks browser workspaces and thin Actions.

FILES IN SCOPE:
- Create: src/actions/tasks.ts
- Modify: src/actions/index.ts
- Create: src/pages/tasks/index.astro
- Create: src/pages/tasks/new.astro
- Create: src/pages/tasks/[taskId].astro

NON-NEGOTIABLE REQUIREMENTS:
1. Use exact Route Manifest paths.
2. Pages only parse context/query, call use cases/read models and render.
3. Actions no SQL/business rules.
4. Show state/version/history/authorized capabilities.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- UUID params
- direct Action authorization
- Playwright workflows
- route checker

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-104 — Tasks E2E + authorization matrix

**Preconditions:** `IMP-103`

**Files in scope:**
- Create: tests/e2e/tasks.spec.ts
- Create: tests/integration/tasks/authorization-matrix.test.ts

**Required specs:**
- `Documents/DOMAIN-MAP.md`
- `Documents/STATE-MACHINES.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/DATA-MODEL.md`
- `Documents/TESTING-STRATEGY.md`
- `Documents/RISK-REGISTER.md`

**Acceptance requirements:**
- Unauthenticated/missing permission/wrong scope/wrong state/direct Action/stale/IDOR/SoD where relevant.
- Roles are not hierarchy.
- Run tests before claiming PASS.

**Required verification:**
- domain integration matrix
- pnpm exec playwright test tests/e2e/tasks.spec.ts
- pnpm architecture:check

### Copy-ready Codex prompt

```text
TASK ID: IMP-104
TITLE: Tasks E2E + authorization matrix

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DOMAIN-MAP.md
- Documents/STATE-MACHINES.md
- Documents/BUSINESS-RULES.md
- Documents/DATA-MODEL.md
- Documents/TESTING-STRATEGY.md
- Documents/RISK-REGISTER.md

PRECONDITIONS:
- IMP-103 must already be accepted in current repository reality.

MISSION:
Prove Tasks positive/negative behavior.

FILES IN SCOPE:
- Create: tests/e2e/tasks.spec.ts
- Create: tests/integration/tasks/authorization-matrix.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Unauthenticated/missing permission/wrong scope/wrong state/direct Action/stale/IDOR/SoD where relevant.
2. Roles are not hierarchy.
3. Run tests before claiming PASS.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- domain integration matrix
- pnpm exec playwright test tests/e2e/tasks.spec.ts
- pnpm architecture:check

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

---

# Phase 8 — Quality

## IMP-110 — Finding implementation

**Preconditions:** `IMP-021`, `IMP-044`

**Files in scope:**
- Create: src/modules/quality/findings/domain/finding.ts
- Create: src/modules/quality/findings/ports/repository.ts
- Create: src/modules/quality/findings/infrastructure/postgres-repository.ts
- Create: src/modules/quality/findings/application/create-finding.ts
- Create: src/modules/quality/findings/application/get-finding.ts
- Create: src/modules/quality/findings/application/list-findings.ts
- Create: src/modules/quality/findings/application/transition-finding.ts
- Create: tests/integration/quality/findings.test.ts

**Required specs:**
- `Documents/DOMAIN-MAP.md`
- `Documents/STATE-MACHINES.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/PERMISSION-MATRIX.md`

**Acceptance requirements:**
- Exact fields/state.
- Authz/scope every operation.
- No cross-domain source mutation.
- Audit controlled transitions.

**Required verification:**
- transition matrix
- source linkage
- stale/IDOR

### Copy-ready Codex prompt

```text
TASK ID: IMP-110
TITLE: Finding implementation

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DOMAIN-MAP.md
- Documents/STATE-MACHINES.md
- Documents/BUSINESS-RULES.md
- Documents/DATA-DICTIONARY.md
- Documents/PERMISSION-MATRIX.md

PRECONDITIONS:
- IMP-021 must already be accepted in current repository reality.
- IMP-044 must already be accepted in current repository reality.

MISSION:
Finding is Quality-owned and may reference source records without mutating their domain.

FILES IN SCOPE:
- Create: src/modules/quality/findings/domain/finding.ts
- Create: src/modules/quality/findings/ports/repository.ts
- Create: src/modules/quality/findings/infrastructure/postgres-repository.ts
- Create: src/modules/quality/findings/application/create-finding.ts
- Create: src/modules/quality/findings/application/get-finding.ts
- Create: src/modules/quality/findings/application/list-findings.ts
- Create: src/modules/quality/findings/application/transition-finding.ts
- Create: tests/integration/quality/findings.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Exact fields/state.
2. Authz/scope every operation.
3. No cross-domain source mutation.
4. Audit controlled transitions.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- transition matrix
- source linkage
- stale/IDOR

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-111 — NCR implementation

**Preconditions:** `IMP-110`

**Files in scope:**
- Create: src/modules/quality/ncr/domain/ncr.ts
- Create: src/modules/quality/ncr/ports/repository.ts
- Create: src/modules/quality/ncr/infrastructure/postgres-repository.ts
- Create: src/modules/quality/ncr/application/create-ncr.ts
- Create: src/modules/quality/ncr/application/get-ncr.ts
- Create: src/modules/quality/ncr/application/list-ncr.ts
- Create: src/modules/quality/ncr/application/transition-ncr.ts
- Create: tests/integration/quality/ncr.test.ts

**Required specs:**
- `Documents/DOMAIN-MAP.md`
- `Documents/STATE-MACHINES.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/PERMISSION-MATRIX.md`

**Acceptance requirements:**
- Read Business Rules before enabling direct NCR creation; if direct creation is forbidden, use case only accepts approved source flow.
- Preserve history.
- Closure authority unresolved => deny.

**Required verification:**
- creation policy
- state/authz
- source unchanged

### Copy-ready Codex prompt

```text
TASK ID: IMP-111
TITLE: NCR implementation

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DOMAIN-MAP.md
- Documents/STATE-MACHINES.md
- Documents/BUSINESS-RULES.md
- Documents/PERMISSION-MATRIX.md

PRECONDITIONS:
- IMP-110 must already be accepted in current repository reality.

MISSION:
NCR lifecycle and Finding/source linkage.

FILES IN SCOPE:
- Create: src/modules/quality/ncr/domain/ncr.ts
- Create: src/modules/quality/ncr/ports/repository.ts
- Create: src/modules/quality/ncr/infrastructure/postgres-repository.ts
- Create: src/modules/quality/ncr/application/create-ncr.ts
- Create: src/modules/quality/ncr/application/get-ncr.ts
- Create: src/modules/quality/ncr/application/list-ncr.ts
- Create: src/modules/quality/ncr/application/transition-ncr.ts
- Create: tests/integration/quality/ncr.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Read Business Rules before enabling direct NCR creation; if direct creation is forbidden, use case only accepts approved source flow.
2. Preserve history.
3. Closure authority unresolved => deny.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- creation policy
- state/authz
- source unchanged

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-112 — RCA implementation

**Preconditions:** `IMP-111`

**Files in scope:**
- Create: src/modules/quality/rca/domain/rca.ts
- Create: src/modules/quality/rca/ports/repository.ts
- Create: src/modules/quality/rca/infrastructure/postgres-repository.ts
- Create: src/modules/quality/rca/application/get-rca.ts
- Create: src/modules/quality/rca/application/list-rca.ts
- Create: src/modules/quality/rca/application/update-rca.ts
- Create: src/modules/quality/rca/application/transition-rca.ts
- Create: tests/integration/quality/rca.test.ts

**Required specs:**
- `Documents/DOMAIN-MAP.md`
- `Documents/STATE-MACHINES.md`
- `Documents/BUSINESS-RULES.md`

**Acceptance requirements:**
- No unrelated generic note.
- Preserve NCR link/context.
- No invented root-cause taxonomy.

**Required verification:**
- NCR linkage
- state/version
- permission/scope

### Copy-ready Codex prompt

```text
TASK ID: IMP-112
TITLE: RCA implementation

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DOMAIN-MAP.md
- Documents/STATE-MACHINES.md
- Documents/BUSINESS-RULES.md

PRECONDITIONS:
- IMP-111 must already be accepted in current repository reality.

MISSION:
RCA linked to NCR exactly as canonical model.

FILES IN SCOPE:
- Create: src/modules/quality/rca/domain/rca.ts
- Create: src/modules/quality/rca/ports/repository.ts
- Create: src/modules/quality/rca/infrastructure/postgres-repository.ts
- Create: src/modules/quality/rca/application/get-rca.ts
- Create: src/modules/quality/rca/application/list-rca.ts
- Create: src/modules/quality/rca/application/update-rca.ts
- Create: src/modules/quality/rca/application/transition-rca.ts
- Create: tests/integration/quality/rca.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. No unrelated generic note.
2. Preserve NCR link/context.
3. No invented root-cause taxonomy.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- NCR linkage
- state/version
- permission/scope

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-113 — CAPA implementation

**Preconditions:** `IMP-112`

**Files in scope:**
- Create: src/modules/quality/capa/domain/capa.ts
- Create: src/modules/quality/capa/ports/repository.ts
- Create: src/modules/quality/capa/infrastructure/postgres-repository.ts
- Create: src/modules/quality/capa/application/create-capa.ts
- Create: src/modules/quality/capa/application/get-capa.ts
- Create: src/modules/quality/capa/application/list-capa.ts
- Create: src/modules/quality/capa/application/transition-capa.ts
- Create: tests/integration/quality/capa.test.ts

**Required specs:**
- `Documents/DOMAIN-MAP.md`
- `Documents/STATE-MACHINES.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/PERMISSION-MATRIX.md`

**Acceptance requirements:**
- Creation route/use-case conditional on business flow.
- Closure authority not invented.
- Preserve verification/closure history.

**Required verification:**
- creation policy
- closure denial if unresolved
- state/version/SoD

### Copy-ready Codex prompt

```text
TASK ID: IMP-113
TITLE: CAPA implementation

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DOMAIN-MAP.md
- Documents/STATE-MACHINES.md
- Documents/BUSINESS-RULES.md
- Documents/PERMISSION-MATRIX.md

PRECONDITIONS:
- IMP-112 must already be accepted in current repository reality.

MISSION:
CAPA with approved source/RCA relation and controlled closure.

FILES IN SCOPE:
- Create: src/modules/quality/capa/domain/capa.ts
- Create: src/modules/quality/capa/ports/repository.ts
- Create: src/modules/quality/capa/infrastructure/postgres-repository.ts
- Create: src/modules/quality/capa/application/create-capa.ts
- Create: src/modules/quality/capa/application/get-capa.ts
- Create: src/modules/quality/capa/application/list-capa.ts
- Create: src/modules/quality/capa/application/transition-capa.ts
- Create: tests/integration/quality/capa.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Creation route/use-case conditional on business flow.
2. Closure authority not invented.
3. Preserve verification/closure history.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- creation policy
- closure denial if unresolved
- state/version/SoD

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-114 — Quality overview read model

**Preconditions:** `IMP-113`, `IMP-084`

**Files in scope:**
- Create: src/modules/quality/application/get-quality-overview.ts
- Create: src/modules/quality/infrastructure/postgres-quality-overview.ts
- Create: src/pages/quality/index.astro

**Required specs:**
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/DOMAIN-MAP.md`
- `Documents/PERMISSION-MATRIX.md`

**Acceptance requirements:**
- Scoped aggregates.
- No invented KPI.
- No client-side hiding of global dataset.

**Required verification:**
- cross-scope overview

### Copy-ready Codex prompt

```text
TASK ID: IMP-114
TITLE: Quality overview read model

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/UI-UX-SPECIFICATION.md
- Documents/DOMAIN-MAP.md
- Documents/PERMISSION-MATRIX.md

PRECONDITIONS:
- IMP-113 must already be accepted in current repository reality.
- IMP-084 must already be accepted in current repository reality.

MISSION:
Authorized Quality overview only.

FILES IN SCOPE:
- Create: src/modules/quality/application/get-quality-overview.ts
- Create: src/modules/quality/infrastructure/postgres-quality-overview.ts
- Create: src/pages/quality/index.astro

NON-NEGOTIABLE REQUIREMENTS:
1. Scoped aggregates.
2. No invented KPI.
3. No client-side hiding of global dataset.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- cross-scope overview

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-115 — Quality Actions + pages

**Preconditions:** `IMP-110`, `IMP-111`, `IMP-112`, `IMP-113`, `IMP-114`

**Files in scope:**
- Create: src/actions/findings.ts
- Create: src/actions/ncr.ts
- Create: src/actions/rca.ts
- Create: src/actions/capa.ts
- Modify: src/actions/index.ts
- Create: src/pages/quality/findings/index.astro
- Create: src/pages/quality/findings/new.astro
- Create: src/pages/quality/findings/[findingId].astro
- Create: src/pages/quality/ncr/index.astro
- Create conditionally if direct creation allowed: src/pages/quality/ncr/new.astro
- Create: src/pages/quality/ncr/[ncrId].astro
- Create: src/pages/quality/rca/index.astro
- Create: src/pages/quality/rca/[rcaId].astro
- Create: src/pages/quality/capa/index.astro
- Create conditionally if creation allowed: src/pages/quality/capa/new.astro
- Create: src/pages/quality/capa/[capaId].astro

**Required specs:**
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/DESIGN-SYSTEM.md`
- `Documents/BUSINESS-RULES.md`

**Acceptance requirements:**
- Do not create conditional new routes when business flow forbids them.
- No SQL/business rules in Delivery.
- Show source/history/capabilities.

**Required verification:**
- route checker
- Action authz
- UUID/IDOR

### Copy-ready Codex prompt

```text
TASK ID: IMP-115
TITLE: Quality Actions + pages

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/UI-UX-SPECIFICATION.md
- Documents/DESIGN-SYSTEM.md
- Documents/BUSINESS-RULES.md

PRECONDITIONS:
- IMP-110 must already be accepted in current repository reality.
- IMP-111 must already be accepted in current repository reality.
- IMP-112 must already be accepted in current repository reality.
- IMP-113 must already be accepted in current repository reality.
- IMP-114 must already be accepted in current repository reality.

MISSION:
Quality Delivery Layer exactly from approved/conditional routes.

FILES IN SCOPE:
- Create: src/actions/findings.ts
- Create: src/actions/ncr.ts
- Create: src/actions/rca.ts
- Create: src/actions/capa.ts
- Modify: src/actions/index.ts
- Create: src/pages/quality/findings/index.astro
- Create: src/pages/quality/findings/new.astro
- Create: src/pages/quality/findings/[findingId].astro
- Create: src/pages/quality/ncr/index.astro
- Create conditionally if direct creation allowed: src/pages/quality/ncr/new.astro
- Create: src/pages/quality/ncr/[ncrId].astro
- Create: src/pages/quality/rca/index.astro
- Create: src/pages/quality/rca/[rcaId].astro
- Create: src/pages/quality/capa/index.astro
- Create conditionally if creation allowed: src/pages/quality/capa/new.astro
- Create: src/pages/quality/capa/[capaId].astro

NON-NEGOTIABLE REQUIREMENTS:
1. Do not create conditional new routes when business flow forbids them.
2. No SQL/business rules in Delivery.
3. Show source/history/capabilities.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- route checker
- Action authz
- UUID/IDOR

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-116 — Quality E2E risk suite

**Preconditions:** `IMP-115`

**Files in scope:**
- Create: tests/e2e/quality.spec.ts
- Create: tests/integration/quality/authorization-matrix.test.ts

**Required specs:**
- `Documents/TESTING-STRATEGY.md`
- `Documents/RISK-REGISTER.md`
- `Documents/PERMISSION-MATRIX.md`

**Acceptance requirements:**
- Conditional creation behavior.
- Closure/SoD/permission/version.
- Source records not silently changed.

**Required verification:**
- Quality integration/E2E

### Copy-ready Codex prompt

```text
TASK ID: IMP-116
TITLE: Quality E2E risk suite

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/TESTING-STRATEGY.md
- Documents/RISK-REGISTER.md
- Documents/PERMISSION-MATRIX.md

PRECONDITIONS:
- IMP-115 must already be accepted in current repository reality.

MISSION:
Prove approved Finding→NCR→RCA→CAPA flow and negative controls.

FILES IN SCOPE:
- Create: tests/e2e/quality.spec.ts
- Create: tests/integration/quality/authorization-matrix.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Conditional creation behavior.
2. Closure/SoD/permission/version.
3. Source records not silently changed.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Quality integration/E2E

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

---

# Phase 9 — Quarantine

## IMP-120 — Receiving domain + repository

**Preconditions:** `IMP-022`, `IMP-044`

**Files in scope:**
- Create: src/modules/quarantine/receiving/domain/receiving-item.ts
- Create: src/modules/quarantine/receiving/domain/receiving-state.ts
- Create: src/modules/quarantine/receiving/ports/repository.ts
- Create: src/modules/quarantine/receiving/infrastructure/postgres-repository.ts
- Create: tests/integration/quarantine/receiving-repository.test.ts

**Required specs:**
- `Documents/DOMAIN-MAP.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/STATE-MACHINES.md`
- `Documents/DATA-DICTIONARY.md`

**Acceptance requirements:**
- Receiving Workflow State separate from Inspection Result and Release State.
- Version/history as specified.

**Required verification:**
- repo/state
- prove PASS cannot auto-release in model

### Copy-ready Codex prompt

```text
TASK ID: IMP-120
TITLE: Receiving domain + repository

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DOMAIN-MAP.md
- Documents/BUSINESS-RULES.md
- Documents/STATE-MACHINES.md
- Documents/DATA-DICTIONARY.md

PRECONDITIONS:
- IMP-022 must already be accepted in current repository reality.
- IMP-044 must already be accepted in current repository reality.

MISSION:
Quarantine-owned Receiving Item.

FILES IN SCOPE:
- Create: src/modules/quarantine/receiving/domain/receiving-item.ts
- Create: src/modules/quarantine/receiving/domain/receiving-state.ts
- Create: src/modules/quarantine/receiving/ports/repository.ts
- Create: src/modules/quarantine/receiving/infrastructure/postgres-repository.ts
- Create: tests/integration/quarantine/receiving-repository.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Receiving Workflow State separate from Inspection Result and Release State.
2. Version/history as specified.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- repo/state
- prove PASS cannot auto-release in model

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-121 — Receiving use cases

**Preconditions:** `IMP-120`, `IMP-045`

**Files in scope:**
- Create: src/modules/quarantine/receiving/application/create-receiving.ts
- Create: src/modules/quarantine/receiving/application/get-receiving.ts
- Create: src/modules/quarantine/receiving/application/list-receiving.ts
- Create: src/modules/quarantine/receiving/application/update-receiving-draft.ts
- Create: src/modules/quarantine/receiving/application/transition-receiving.ts
- Create: tests/integration/quarantine/receiving-use-cases.test.ts

**Required specs:**
- `Documents/BUSINESS-RULES.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/STATE-MACHINES.md`

**Acceptance requirements:**
- PERM-QUAR-CREATE where canonical.
- No arbitrary target state.
- Current state/version.

**Required verification:**
- permission/scope/state/version
- audit

### Copy-ready Codex prompt

```text
TASK ID: IMP-121
TITLE: Receiving use cases

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/BUSINESS-RULES.md
- Documents/PERMISSION-MATRIX.md
- Documents/STATE-MACHINES.md

PRECONDITIONS:
- IMP-120 must already be accepted in current repository reality.
- IMP-045 must already be accepted in current repository reality.

MISSION:
Authorized/audited receiving commands/queries.

FILES IN SCOPE:
- Create: src/modules/quarantine/receiving/application/create-receiving.ts
- Create: src/modules/quarantine/receiving/application/get-receiving.ts
- Create: src/modules/quarantine/receiving/application/list-receiving.ts
- Create: src/modules/quarantine/receiving/application/update-receiving-draft.ts
- Create: src/modules/quarantine/receiving/application/transition-receiving.ts
- Create: tests/integration/quarantine/receiving-use-cases.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. PERM-QUAR-CREATE where canonical.
2. No arbitrary target state.
3. Current state/version.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- permission/scope/state/version
- audit

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-122 — Inspection domain/template context/repository

**Preconditions:** `IMP-120`

**Files in scope:**
- Create: src/modules/quarantine/inspection/domain/inspection.ts
- Create: src/modules/quarantine/inspection/domain/inspection-result.ts
- Create: src/modules/quarantine/inspection/domain/inspection-state.ts
- Create: src/modules/quarantine/inspection/ports/repository.ts
- Create: src/modules/quarantine/inspection/infrastructure/postgres-repository.ts
- Create: tests/integration/quarantine/inspection-repository.test.ts

**Required specs:**
- `Documents/DOMAIN-MAP.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/STATE-MACHINES.md`
- `Documents/DATA-DICTIONARY.md`

**Acceptance requirements:**
- Inspection Result separate from Release.
- No invented acceptance criteria/template fields.
- Approved read-only except controlled mechanisms.

**Required verification:**
- template/version linkage
- state/result constraints
- history

### Copy-ready Codex prompt

```text
TASK ID: IMP-122
TITLE: Inspection domain/template context/repository

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DOMAIN-MAP.md
- Documents/BUSINESS-RULES.md
- Documents/STATE-MACHINES.md
- Documents/DATA-DICTIONARY.md

PRECONDITIONS:
- IMP-120 must already be accepted in current repository reality.

MISSION:
Inspection linked to Receiving with controlled template/version context.

FILES IN SCOPE:
- Create: src/modules/quarantine/inspection/domain/inspection.ts
- Create: src/modules/quarantine/inspection/domain/inspection-result.ts
- Create: src/modules/quarantine/inspection/domain/inspection-state.ts
- Create: src/modules/quarantine/inspection/ports/repository.ts
- Create: src/modules/quarantine/inspection/infrastructure/postgres-repository.ts
- Create: tests/integration/quarantine/inspection-repository.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Inspection Result separate from Release.
2. No invented acceptance criteria/template fields.
3. Approved read-only except controlled mechanisms.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- template/version linkage
- state/result constraints
- history

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-123 — Inspection execution

**Preconditions:** `IMP-122`, `IMP-044`

**Files in scope:**
- Create: src/modules/quarantine/inspection/application/start-inspection.ts
- Create: src/modules/quarantine/inspection/application/get-inspection.ts
- Create: src/modules/quarantine/inspection/application/list-inspections.ts
- Create: src/modules/quarantine/inspection/application/save-inspection-draft.ts
- Create: src/modules/quarantine/inspection/application/submit-inspection.ts
- Create: tests/integration/quarantine/inspection-execution.test.ts

**Required specs:**
- `Documents/BUSINESS-RULES.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/STATE-MACHINES.md`

**Acceptance requirements:**
- Creation contextual from Receiving; no /inspections/new.
- Autosave draft-only.
- Submission freezes historical controlled context.
- No scientific inventions.

**Required verification:**
- assigned/unassigned
- state
- stale
- snapshot

### Copy-ready Codex prompt

```text
TASK ID: IMP-123
TITLE: Inspection execution

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/BUSINESS-RULES.md
- Documents/PERMISSION-MATRIX.md
- Documents/STATE-MACHINES.md

PRECONDITIONS:
- IMP-122 must already be accepted in current repository reality.
- IMP-044 must already be accepted in current repository reality.

MISSION:
Assigned/scoped execution and submission.

FILES IN SCOPE:
- Create: src/modules/quarantine/inspection/application/start-inspection.ts
- Create: src/modules/quarantine/inspection/application/get-inspection.ts
- Create: src/modules/quarantine/inspection/application/list-inspections.ts
- Create: src/modules/quarantine/inspection/application/save-inspection-draft.ts
- Create: src/modules/quarantine/inspection/application/submit-inspection.ts
- Create: tests/integration/quarantine/inspection-execution.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Creation contextual from Receiving; no /inspections/new.
2. Autosave draft-only.
3. Submission freezes historical controlled context.
4. No scientific inventions.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- assigned/unassigned
- state
- stale
- snapshot

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-124 — Inspection review/approval

**Preconditions:** `IMP-123`, `IMP-045`

**Files in scope:**
- Create: src/modules/quarantine/inspection/application/review-inspection.ts
- Create: src/modules/quarantine/inspection/application/approve-inspection.ts
- Create: src/modules/quarantine/inspection/application/return-inspection.ts
- Create: tests/integration/quarantine/inspection-review.test.ts

**Required specs:**
- `Documents/PERMISSION-MATRIX.md`
- `Documents/STATE-MACHINES.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/RISK-REGISTER.md`

**Acceptance requirements:**
- Review vs approve permissions distinct where matrix says.
- SoD/state/version.
- Official result only through approved deterministic rule/source.
- Audit/e-sign only as approved.

**Required verification:**
- reviewer/approver
- SoD
- stale
- audit

### Copy-ready Codex prompt

```text
TASK ID: IMP-124
TITLE: Inspection review/approval

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/PERMISSION-MATRIX.md
- Documents/STATE-MACHINES.md
- Documents/BUSINESS-RULES.md
- Documents/RISK-REGISTER.md

PRECONDITIONS:
- IMP-123 must already be accepted in current repository reality.
- IMP-045 must already be accepted in current repository reality.

MISSION:
Controlled review/approval.

FILES IN SCOPE:
- Create: src/modules/quarantine/inspection/application/review-inspection.ts
- Create: src/modules/quarantine/inspection/application/approve-inspection.ts
- Create: src/modules/quarantine/inspection/application/return-inspection.ts
- Create: tests/integration/quarantine/inspection-review.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Review vs approve permissions distinct where matrix says.
2. SoD/state/version.
3. Official result only through approved deterministic rule/source.
4. Audit/e-sign only as approved.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- reviewer/approver
- SoD
- stale
- audit

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-125 — Explicit Release System actions

**Preconditions:** `IMP-124`

**Files in scope:**
- Create: src/modules/quarantine/receiving/application/release-receiving.ts
- Create: src/modules/quarantine/receiving/application/hold-receiving.ts
- Create: tests/integration/quarantine/release-state.test.ts

**Required specs:**
- `Documents/BUSINESS-RULES.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/RISK-REGISTER.md`
- `Documents/STATE-MACHINES.md`

**Acceptance requirements:**
- PASS never auto-releases.
- Unresolved release authority => DENY.
- Check approved prerequisites/current version/scope.
- Audit release/hold.

**Required verification:**
- PASS+no release remains not released
- unauthorized release
- stale/SoD
- audit

### Copy-ready Codex prompt

```text
TASK ID: IMP-125
TITLE: Explicit Release System actions

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/BUSINESS-RULES.md
- Documents/PERMISSION-MATRIX.md
- Documents/RISK-REGISTER.md
- Documents/STATE-MACHINES.md

PRECONDITIONS:
- IMP-124 must already be accepted in current repository reality.

MISSION:
Release System State is explicit controlled action independent of PASS.

FILES IN SCOPE:
- Create: src/modules/quarantine/receiving/application/release-receiving.ts
- Create: src/modules/quarantine/receiving/application/hold-receiving.ts
- Create: tests/integration/quarantine/release-state.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. PASS never auto-releases.
2. Unresolved release authority => DENY.
3. Check approved prerequisites/current version/scope.
4. Audit release/hold.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- PASS+no release remains not released
- unauthorized release
- stale/SoD
- audit

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-126 — Quarantine overview/admin read models

**Preconditions:** `IMP-125`

**Files in scope:**
- Create: src/modules/quarantine/application/get-quarantine-overview.ts
- Create: src/modules/quarantine/application/get-quarantine-admin.ts
- Create: src/modules/quarantine/infrastructure/postgres-quarantine-read-model.ts
- Create: tests/integration/quarantine/read-models.test.ts

**Required specs:**
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/DOMAIN-MAP.md`
- `Documents/PERMISSION-MATRIX.md`

**Acceptance requirements:**
- Always separate receiving state/result/release state.
- Domain admin explicit permission.

**Required verification:**
- scope leakage
- PASS vs Released

### Copy-ready Codex prompt

```text
TASK ID: IMP-126
TITLE: Quarantine overview/admin read models

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/UI-UX-SPECIFICATION.md
- Documents/DOMAIN-MAP.md
- Documents/PERMISSION-MATRIX.md

PRECONDITIONS:
- IMP-125 must already be accepted in current repository reality.

MISSION:
Scoped Quarantine overview and domain admin read models.

FILES IN SCOPE:
- Create: src/modules/quarantine/application/get-quarantine-overview.ts
- Create: src/modules/quarantine/application/get-quarantine-admin.ts
- Create: src/modules/quarantine/infrastructure/postgres-quarantine-read-model.ts
- Create: tests/integration/quarantine/read-models.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Always separate receiving state/result/release state.
2. Domain admin explicit permission.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- scope leakage
- PASS vs Released

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-127 — Quarantine Actions + all pages

**Preconditions:** `IMP-126`, `IMP-084`, `IMP-087`

**Files in scope:**
- Create: src/actions/quarantine.ts
- Modify: src/actions/index.ts
- Create: src/pages/quarantine/index.astro
- Create: src/pages/quarantine/receiving/index.astro
- Create: src/pages/quarantine/receiving/new.astro
- Create: src/pages/quarantine/receiving/[receivingId].astro
- Create: src/pages/quarantine/inspections/index.astro
- Create: src/pages/quarantine/inspections/[inspectionId]/index.astro
- Create: src/pages/quarantine/inspections/[inspectionId]/execute.astro
- Create: src/pages/quarantine/inspections/[inspectionId]/review.astro
- Create: src/pages/quarantine/admin/index.astro

**Required specs:**
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/DESIGN-SYSTEM.md`

**Acceptance requirements:**
- No /inspections/new.
- Execute editable/assignment guarded.
- Review route ≠ approval permission.
- Controlled states read-only.
- PASS/RELEASED distinct.

**Required verification:**
- route checker
- Playwright receiving→inspection
- direct release attack

### Copy-ready Codex prompt

```text
TASK ID: IMP-127
TITLE: Quarantine Actions + all pages

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/UI-UX-SPECIFICATION.md
- Documents/DESIGN-SYSTEM.md

PRECONDITIONS:
- IMP-126 must already be accepted in current repository reality.
- IMP-084 must already be accepted in current repository reality.
- IMP-087 must already be accepted in current repository reality.

MISSION:
All approved Quarantine workspaces.

FILES IN SCOPE:
- Create: src/actions/quarantine.ts
- Modify: src/actions/index.ts
- Create: src/pages/quarantine/index.astro
- Create: src/pages/quarantine/receiving/index.astro
- Create: src/pages/quarantine/receiving/new.astro
- Create: src/pages/quarantine/receiving/[receivingId].astro
- Create: src/pages/quarantine/inspections/index.astro
- Create: src/pages/quarantine/inspections/[inspectionId]/index.astro
- Create: src/pages/quarantine/inspections/[inspectionId]/execute.astro
- Create: src/pages/quarantine/inspections/[inspectionId]/review.astro
- Create: src/pages/quarantine/admin/index.astro

NON-NEGOTIABLE REQUIREMENTS:
1. No /inspections/new.
2. Execute editable/assignment guarded.
3. Review route ≠ approval permission.
4. Controlled states read-only.
5. PASS/RELEASED distinct.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- route checker
- Playwright receiving→inspection
- direct release attack

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-128 — Quarantine E2E risk suite

**Preconditions:** `IMP-127`

**Files in scope:**
- Create: tests/e2e/quarantine.spec.ts
- Create: tests/integration/quarantine/authorization-matrix.test.ts

**Required specs:**
- `Documents/TESTING-STRATEGY.md`
- `Documents/RISK-REGISTER.md`

**Acceptance requirements:**
- Incorrect PASS/FAIL/source handling.
- PASS not Release.
- Unauthorized Release.
- IDOR/SoD/stale/direct Action.

**Required verification:**
- Quarantine integration/E2E

### Copy-ready Codex prompt

```text
TASK ID: IMP-128
TITLE: Quarantine E2E risk suite

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/TESTING-STRATEGY.md
- Documents/RISK-REGISTER.md

PRECONDITIONS:
- IMP-127 must already be accepted in current repository reality.

MISSION:
Prove RISK-005/006/007 and authz/concurrency behavior.

FILES IN SCOPE:
- Create: tests/e2e/quarantine.spec.ts
- Create: tests/integration/quarantine/authorization-matrix.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Incorrect PASS/FAIL/source handling.
2. PASS not Release.
3. Unauthorized Release.
4. IDOR/SoD/stale/direct Action.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Quarantine integration/E2E

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

---

# Phase 10 — Laboratory

## IMP-130 — Lab domain/repository

**Preconditions:** `IMP-023`, `IMP-044`

**Files in scope:**
- Create: src/modules/laboratory/domain/lab-test.ts
- Create: src/modules/laboratory/domain/measurement.ts
- Create: src/modules/laboratory/domain/lab-state.ts
- Create: src/modules/laboratory/ports/repository.ts
- Create: src/modules/laboratory/infrastructure/postgres-repository.ts
- Create: tests/integration/laboratory/repository.test.ts

**Required specs:**
- `Documents/DOMAIN-MAP.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/STATE-MACHINES.md`
- `Documents/DATA-DICTIONARY.md`

**Acceptance requirements:**
- Preserve raw measurements.
- Criteria/units/precision/rounding from controlled sources only.
- Snapshot required equipment/calibration/document context.
- No AI official result.

**Required verification:**
- raw value
- context snapshots
- no scientific constants

### Copy-ready Codex prompt

```text
TASK ID: IMP-130
TITLE: Lab domain/repository

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DOMAIN-MAP.md
- Documents/BUSINESS-RULES.md
- Documents/STATE-MACHINES.md
- Documents/DATA-DICTIONARY.md

PRECONDITIONS:
- IMP-023 must already be accepted in current repository reality.
- IMP-044 must already be accepted in current repository reality.

MISSION:
Lab Test/sample/measurement/result persistence and invariants.

FILES IN SCOPE:
- Create: src/modules/laboratory/domain/lab-test.ts
- Create: src/modules/laboratory/domain/measurement.ts
- Create: src/modules/laboratory/domain/lab-state.ts
- Create: src/modules/laboratory/ports/repository.ts
- Create: src/modules/laboratory/infrastructure/postgres-repository.ts
- Create: tests/integration/laboratory/repository.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Preserve raw measurements.
2. Criteria/units/precision/rounding from controlled sources only.
3. Snapshot required equipment/calibration/document context.
4. No AI official result.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- raw value
- context snapshots
- no scientific constants

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-131 — Lab creation/execution/submission

**Preconditions:** `IMP-130`

**Files in scope:**
- Create: src/modules/laboratory/application/create-lab-test.ts
- Create: src/modules/laboratory/application/get-lab-test.ts
- Create: src/modules/laboratory/application/list-lab-tests.ts
- Create: src/modules/laboratory/application/save-measurements.ts
- Create: src/modules/laboratory/application/submit-lab-test.ts
- Create: tests/integration/laboratory/execution.test.ts

**Required specs:**
- `Documents/PERMISSION-MATRIX.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/STATE-MACHINES.md`

**Acceptance requirements:**
- PERM-LAB-CREATE.
- Draft measurements only editable state.
- Submission freezes context.
- Assets eligibility via Assets capability, not table write.

**Required verification:**
- create/execute/submit matrix
- controlled criteria fixtures only

### Copy-ready Codex prompt

```text
TASK ID: IMP-131
TITLE: Lab creation/execution/submission

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/PERMISSION-MATRIX.md
- Documents/BUSINESS-RULES.md
- Documents/STATE-MACHINES.md

PRECONDITIONS:
- IMP-130 must already be accepted in current repository reality.

MISSION:
Authorized lab execution against controlled criteria.

FILES IN SCOPE:
- Create: src/modules/laboratory/application/create-lab-test.ts
- Create: src/modules/laboratory/application/get-lab-test.ts
- Create: src/modules/laboratory/application/list-lab-tests.ts
- Create: src/modules/laboratory/application/save-measurements.ts
- Create: src/modules/laboratory/application/submit-lab-test.ts
- Create: tests/integration/laboratory/execution.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. PERM-LAB-CREATE.
2. Draft measurements only editable state.
3. Submission freezes context.
4. Assets eligibility via Assets capability, not table write.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- create/execute/submit matrix
- controlled criteria fixtures only

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-132 — Lab review/approval

**Preconditions:** `IMP-131`, `IMP-045`

**Files in scope:**
- Create: src/modules/laboratory/application/review-lab-test.ts
- Create: src/modules/laboratory/application/approve-lab-test.ts
- Create: src/modules/laboratory/application/return-lab-test.ts
- Create: tests/integration/laboratory/review.test.ts

**Required specs:**
- `Documents/PERMISSION-MATRIX.md`
- `Documents/STATE-MACHINES.md`
- `Documents/RISK-REGISTER.md`

**Acceptance requirements:**
- State/version/SoD.
- Official PASS/FAIL deterministic controlled logic only.
- Reviewer cannot silently edit submitted measurements.

**Required verification:**
- SoD
- stale
- wrong criteria/source
- audit

### Copy-ready Codex prompt

```text
TASK ID: IMP-132
TITLE: Lab review/approval

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/PERMISSION-MATRIX.md
- Documents/STATE-MACHINES.md
- Documents/RISK-REGISTER.md

PRECONDITIONS:
- IMP-131 must already be accepted in current repository reality.
- IMP-045 must already be accepted in current repository reality.

MISSION:
Controlled Lab review/approval.

FILES IN SCOPE:
- Create: src/modules/laboratory/application/review-lab-test.ts
- Create: src/modules/laboratory/application/approve-lab-test.ts
- Create: src/modules/laboratory/application/return-lab-test.ts
- Create: tests/integration/laboratory/review.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. State/version/SoD.
2. Official PASS/FAIL deterministic controlled logic only.
3. Reviewer cannot silently edit submitted measurements.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- SoD
- stale
- wrong criteria/source
- audit

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-133 — Retest workflow

**Preconditions:** `IMP-132`

**Files in scope:**
- Create: src/modules/laboratory/domain/retest.ts
- Create: src/modules/laboratory/application/create-retest.ts
- Create: src/modules/laboratory/application/get-retest-context.ts
- Create: tests/integration/laboratory/retest.test.ts

**Required specs:**
- `Documents/BUSINESS-RULES.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/STATE-MACHINES.md`
- `Documents/RISK-REGISTER.md`

**Acceptance requirements:**
- Unresolved retest policy/count/authority => DENY/BLOCKED, no invented count.
- Original raw measurements/result never overwritten.
- PERM-LAB-RETEST.

**Required verification:**
- policy-unresolved denial
- original unchanged
- allowed fixture only

### Copy-ready Codex prompt

```text
TASK ID: IMP-133
TITLE: Retest workflow

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/BUSINESS-RULES.md
- Documents/PERMISSION-MATRIX.md
- Documents/STATE-MACHINES.md
- Documents/RISK-REGISTER.md

PRECONDITIONS:
- IMP-132 must already be accepted in current repository reality.

MISSION:
Separate Retest linked to original.

FILES IN SCOPE:
- Create: src/modules/laboratory/domain/retest.ts
- Create: src/modules/laboratory/application/create-retest.ts
- Create: src/modules/laboratory/application/get-retest-context.ts
- Create: tests/integration/laboratory/retest.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Unresolved retest policy/count/authority => DENY/BLOCKED, no invented count.
2. Original raw measurements/result never overwritten.
3. PERM-LAB-RETEST.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- policy-unresolved denial
- original unchanged
- allowed fixture only

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-134 — Lab Actions + all pages

**Preconditions:** `IMP-133`, `IMP-083`, `IMP-087`

**Files in scope:**
- Create: src/actions/laboratory.ts
- Modify: src/actions/index.ts
- Create: src/pages/laboratory/index.astro
- Create: src/pages/laboratory/tests/index.astro
- Create: src/pages/laboratory/tests/new.astro
- Create: src/pages/laboratory/tests/[labTestId]/index.astro
- Create: src/pages/laboratory/tests/[labTestId]/execute.astro
- Create: src/pages/laboratory/tests/[labTestId]/review.astro
- Create: src/pages/laboratory/tests/[labTestId]/retests/new.astro

**Required specs:**
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/DESIGN-SYSTEM.md`

**Acceptance requirements:**
- /laboratory behavior per manifest.
- Retest page may exist but server blocks unresolved policy.
- Exact controlled context/raw history.
- No scientific calc in Astro.

**Required verification:**
- route checker
- execute/review/retest Playwright
- direct Action negatives

### Copy-ready Codex prompt

```text
TASK ID: IMP-134
TITLE: Lab Actions + all pages

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/UI-UX-SPECIFICATION.md
- Documents/DESIGN-SYSTEM.md

PRECONDITIONS:
- IMP-133 must already be accepted in current repository reality.
- IMP-083 must already be accepted in current repository reality.
- IMP-087 must already be accepted in current repository reality.

MISSION:
Laboratory Delivery Layer.

FILES IN SCOPE:
- Create: src/actions/laboratory.ts
- Modify: src/actions/index.ts
- Create: src/pages/laboratory/index.astro
- Create: src/pages/laboratory/tests/index.astro
- Create: src/pages/laboratory/tests/new.astro
- Create: src/pages/laboratory/tests/[labTestId]/index.astro
- Create: src/pages/laboratory/tests/[labTestId]/execute.astro
- Create: src/pages/laboratory/tests/[labTestId]/review.astro
- Create: src/pages/laboratory/tests/[labTestId]/retests/new.astro

NON-NEGOTIABLE REQUIREMENTS:
1. /laboratory behavior per manifest.
2. Retest page may exist but server blocks unresolved policy.
3. Exact controlled context/raw history.
4. No scientific calc in Astro.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- route checker
- execute/review/retest Playwright
- direct Action negatives

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-135 — Lab scientific/security E2E

**Preconditions:** `IMP-134`

**Files in scope:**
- Create: tests/e2e/laboratory.spec.ts
- Create: tests/integration/laboratory/authorization-matrix.test.ts
- Create: tests/integration/laboratory/scientific-boundaries.test.ts

**Required specs:**
- `Documents/TESTING-STRATEGY.md`
- `Documents/RISK-REGISTER.md`

**Acceptance requirements:**
- Only approved fixture criteria.
- Wrong document/equipment/calibration context.
- Retest misuse.
- Raw measurements preserved.

**Required verification:**
- Lab integration/E2E

### Copy-ready Codex prompt

```text
TASK ID: IMP-135
TITLE: Lab scientific/security E2E

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/TESTING-STRATEGY.md
- Documents/RISK-REGISTER.md

PRECONDITIONS:
- IMP-134 must already be accepted in current repository reality.

MISSION:
Prove authz/scientific-source/history safety.

FILES IN SCOPE:
- Create: tests/e2e/laboratory.spec.ts
- Create: tests/integration/laboratory/authorization-matrix.test.ts
- Create: tests/integration/laboratory/scientific-boundaries.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Only approved fixture criteria.
2. Wrong document/equipment/calibration context.
3. Retest misuse.
4. Raw measurements preserved.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Lab integration/E2E

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

---

# Phase 11 — Assets

## IMP-140 — Equipment implementation

**Preconditions:** `IMP-024`, `IMP-044`

**Files in scope:**
- Create: src/modules/assets/equipment/domain/equipment.ts
- Create: src/modules/assets/equipment/ports/repository.ts
- Create: src/modules/assets/equipment/infrastructure/postgres-repository.ts
- Create: src/modules/assets/equipment/application/create-equipment.ts
- Create: src/modules/assets/equipment/application/get-equipment.ts
- Create: src/modules/assets/equipment/application/list-equipment.ts
- Create: src/modules/assets/equipment/application/update-equipment.ts
- Create: tests/integration/assets/equipment.test.ts

**Required specs:**
- `Documents/DOMAIN-MAP.md`
- `Documents/STATE-MACHINES.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/PERMISSION-MATRIX.md`

**Acceptance requirements:**
- Creation only if v1 scope supports.
- No calibration interval invention.
- Master changes never rewrite historical Lab context.

**Required verification:**
- permission/state/version
- history non-rewrite

### Copy-ready Codex prompt

```text
TASK ID: IMP-140
TITLE: Equipment implementation

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DOMAIN-MAP.md
- Documents/STATE-MACHINES.md
- Documents/DATA-DICTIONARY.md
- Documents/PERMISSION-MATRIX.md

PRECONDITIONS:
- IMP-024 must already be accepted in current repository reality.
- IMP-044 must already be accepted in current repository reality.

MISSION:
Equipment master/controlled context.

FILES IN SCOPE:
- Create: src/modules/assets/equipment/domain/equipment.ts
- Create: src/modules/assets/equipment/ports/repository.ts
- Create: src/modules/assets/equipment/infrastructure/postgres-repository.ts
- Create: src/modules/assets/equipment/application/create-equipment.ts
- Create: src/modules/assets/equipment/application/get-equipment.ts
- Create: src/modules/assets/equipment/application/list-equipment.ts
- Create: src/modules/assets/equipment/application/update-equipment.ts
- Create: tests/integration/assets/equipment.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Creation only if v1 scope supports.
2. No calibration interval invention.
3. Master changes never rewrite historical Lab context.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- permission/state/version
- history non-rewrite

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-141 — Calibration implementation

**Preconditions:** `IMP-140`

**Files in scope:**
- Create: src/modules/assets/calibration/domain/calibration.ts
- Create: src/modules/assets/calibration/ports/repository.ts
- Create: src/modules/assets/calibration/infrastructure/postgres-repository.ts
- Create: src/modules/assets/calibration/application/create-calibration.ts
- Create: src/modules/assets/calibration/application/get-calibration.ts
- Create: src/modules/assets/calibration/application/list-calibrations.ts
- Create: src/modules/assets/calibration/application/transition-calibration.ts
- Create: tests/integration/assets/calibration.test.ts

**Required specs:**
- `Documents/DOMAIN-MAP.md`
- `Documents/STATE-MACHINES.md`
- `Documents/BUSINESS-RULES.md`

**Acceptance requirements:**
- No interval/pass criteria invention.
- Contextual creation if approved.
- Preserve history.

**Required verification:**
- equipment linkage
- state/permission/version

### Copy-ready Codex prompt

```text
TASK ID: IMP-141
TITLE: Calibration implementation

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DOMAIN-MAP.md
- Documents/STATE-MACHINES.md
- Documents/BUSINESS-RULES.md

PRECONDITIONS:
- IMP-140 must already be accepted in current repository reality.

MISSION:
Calibration linked to Equipment.

FILES IN SCOPE:
- Create: src/modules/assets/calibration/domain/calibration.ts
- Create: src/modules/assets/calibration/ports/repository.ts
- Create: src/modules/assets/calibration/infrastructure/postgres-repository.ts
- Create: src/modules/assets/calibration/application/create-calibration.ts
- Create: src/modules/assets/calibration/application/get-calibration.ts
- Create: src/modules/assets/calibration/application/list-calibrations.ts
- Create: src/modules/assets/calibration/application/transition-calibration.ts
- Create: tests/integration/assets/calibration.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. No interval/pass criteria invention.
2. Contextual creation if approved.
3. Preserve history.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- equipment linkage
- state/permission/version

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-142 — Maintenance implementation

**Preconditions:** `IMP-141`

**Files in scope:**
- Create: src/modules/assets/maintenance/domain/maintenance.ts
- Create: src/modules/assets/maintenance/ports/repository.ts
- Create: src/modules/assets/maintenance/infrastructure/postgres-repository.ts
- Create: src/modules/assets/maintenance/application/create-maintenance.ts
- Create: src/modules/assets/maintenance/application/get-maintenance.ts
- Create: src/modules/assets/maintenance/application/list-maintenance.ts
- Create: src/modules/assets/maintenance/application/transition-maintenance.ts
- Create: tests/integration/assets/maintenance.test.ts

**Required specs:**
- `Documents/DOMAIN-MAP.md`
- `Documents/STATE-MACHINES.md`
- `Documents/BUSINESS-RULES.md`

**Acceptance requirements:**
- No automatic availability policy invention.
- Contextual creation if approved.
- Audit/history.

**Required verification:**
- linkage/state/permission

### Copy-ready Codex prompt

```text
TASK ID: IMP-142
TITLE: Maintenance implementation

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DOMAIN-MAP.md
- Documents/STATE-MACHINES.md
- Documents/BUSINESS-RULES.md

PRECONDITIONS:
- IMP-141 must already be accepted in current repository reality.

MISSION:
Maintenance linked to Equipment.

FILES IN SCOPE:
- Create: src/modules/assets/maintenance/domain/maintenance.ts
- Create: src/modules/assets/maintenance/ports/repository.ts
- Create: src/modules/assets/maintenance/infrastructure/postgres-repository.ts
- Create: src/modules/assets/maintenance/application/create-maintenance.ts
- Create: src/modules/assets/maintenance/application/get-maintenance.ts
- Create: src/modules/assets/maintenance/application/list-maintenance.ts
- Create: src/modules/assets/maintenance/application/transition-maintenance.ts
- Create: tests/integration/assets/maintenance.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. No automatic availability policy invention.
2. Contextual creation if approved.
3. Audit/history.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- linkage/state/permission

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-143 — Equipment eligibility capability for Lab

**Preconditions:** `IMP-142`

**Files in scope:**
- Create: src/modules/assets/equipment/application/get-equipment-eligibility.ts
- Create: src/modules/assets/equipment/ports/equipment-eligibility.ts
- Create: tests/integration/assets/equipment-eligibility.test.ts

**Required specs:**
- `Documents/BUSINESS-RULES.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/RISK-REGISTER.md`

**Acceptance requirements:**
- If overdue-calibration behavior unresolved, return policy unresolved/deny; do not invent.
- Provide approved snapshot context only.

**Required verification:**
- unresolved policy
- valid controlled fixture
- no cross-domain write

### Copy-ready Codex prompt

```text
TASK ID: IMP-143
TITLE: Equipment eligibility capability for Lab

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/BUSINESS-RULES.md
- Documents/DATA-DICTIONARY.md
- Documents/RISK-REGISTER.md

PRECONDITIONS:
- IMP-142 must already be accepted in current repository reality.

MISSION:
Assets-owned eligibility consumed by Lab.

FILES IN SCOPE:
- Create: src/modules/assets/equipment/application/get-equipment-eligibility.ts
- Create: src/modules/assets/equipment/ports/equipment-eligibility.ts
- Create: tests/integration/assets/equipment-eligibility.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. If overdue-calibration behavior unresolved, return policy unresolved/deny; do not invent.
2. Provide approved snapshot context only.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- unresolved policy
- valid controlled fixture
- no cross-domain write

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-144 — Assets Actions + pages

**Preconditions:** `IMP-143`, `IMP-084`

**Files in scope:**
- Create: src/actions/assets.ts
- Modify: src/actions/index.ts
- Create: src/pages/assets/index.astro
- Create: src/pages/assets/equipment/index.astro
- Create conditionally: src/pages/assets/equipment/new.astro
- Create: src/pages/assets/equipment/[equipmentId].astro
- Create: src/pages/assets/calibrations/index.astro
- Create conditionally: src/pages/assets/calibrations/new.astro
- Create: src/pages/assets/calibrations/[calibrationId].astro
- Create: src/pages/assets/maintenance/index.astro
- Create conditionally: src/pages/assets/maintenance/new.astro
- Create: src/pages/assets/maintenance/[maintenanceId].astro

**Required specs:**
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/DESIGN-SYSTEM.md`

**Acceptance requirements:**
- /assets behavior per manifest.
- No policy in pages.
- Show historical/status clearly.

**Required verification:**
- route checker
- Playwright navigation
- conditional routes

### Copy-ready Codex prompt

```text
TASK ID: IMP-144
TITLE: Assets Actions + pages

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/UI-UX-SPECIFICATION.md
- Documents/DESIGN-SYSTEM.md

PRECONDITIONS:
- IMP-143 must already be accepted in current repository reality.
- IMP-084 must already be accepted in current repository reality.

MISSION:
Assets workspaces with only approved conditional routes.

FILES IN SCOPE:
- Create: src/actions/assets.ts
- Modify: src/actions/index.ts
- Create: src/pages/assets/index.astro
- Create: src/pages/assets/equipment/index.astro
- Create conditionally: src/pages/assets/equipment/new.astro
- Create: src/pages/assets/equipment/[equipmentId].astro
- Create: src/pages/assets/calibrations/index.astro
- Create conditionally: src/pages/assets/calibrations/new.astro
- Create: src/pages/assets/calibrations/[calibrationId].astro
- Create: src/pages/assets/maintenance/index.astro
- Create conditionally: src/pages/assets/maintenance/new.astro
- Create: src/pages/assets/maintenance/[maintenanceId].astro

NON-NEGOTIABLE REQUIREMENTS:
1. /assets behavior per manifest.
2. No policy in pages.
3. Show historical/status clearly.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- route checker
- Playwright navigation
- conditional routes

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-145 — Assets E2E risk suite

**Preconditions:** `IMP-144`

**Files in scope:**
- Create: tests/e2e/assets.spec.ts
- Create: tests/integration/assets/authorization-matrix.test.ts

**Required specs:**
- `Documents/TESTING-STRATEGY.md`
- `Documents/RISK-REGISTER.md`

**Acceptance requirements:**
- Invalid equipment/calibration context risk.
- scope/permission/state/version.
- No invented intervals.

**Required verification:**
- Assets suites

### Copy-ready Codex prompt

```text
TASK ID: IMP-145
TITLE: Assets E2E risk suite

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/TESTING-STRATEGY.md
- Documents/RISK-REGISTER.md

PRECONDITIONS:
- IMP-144 must already be accepted in current repository reality.

MISSION:
Prove Equipment/Calibration/Maintenance controls.

FILES IN SCOPE:
- Create: tests/e2e/assets.spec.ts
- Create: tests/integration/assets/authorization-matrix.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Invalid equipment/calibration context risk.
2. scope/permission/state/version.
3. No invented intervals.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Assets suites

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

---

# Phase 12 — Controlled Documents

## IMP-150 — Document identity/version domain + repository

**Preconditions:** `IMP-025`, `IMP-048`, `IMP-044`

**Files in scope:**
- Create: src/modules/documents/domain/document.ts
- Create: src/modules/documents/domain/document-version.ts
- Create: src/modules/documents/domain/document-state.ts
- Create: src/modules/documents/ports/repository.ts
- Create: src/modules/documents/infrastructure/postgres-repository.ts
- Create: tests/integration/documents/repository.test.ts

**Required specs:**
- `Documents/DOMAIN-MAP.md`
- `Documents/STATE-MACHINES.md`
- `Documents/DATA-DICTIONARY.md`

**Acceptance requirements:**
- Approved/effective versions are controlled.
- Revision creates a new version; never edit approved version in place.
- Superseded versions remain historical.
- Binary linkage uses Files capability.

**Required verification:**
- identity/version separation
- approved version mutation denied
- superseded history retained

### Copy-ready Codex prompt

```text
TASK ID: IMP-150
TITLE: Document identity/version domain + repository

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DOMAIN-MAP.md
- Documents/STATE-MACHINES.md
- Documents/DATA-DICTIONARY.md

PRECONDITIONS:
- IMP-025 must already be accepted in current repository reality.
- IMP-048 must already be accepted in current repository reality.
- IMP-044 must already be accepted in current repository reality.

MISSION:
Implement Controlled Document Identity separately from Document Version.

FILES IN SCOPE:
- Create: src/modules/documents/domain/document.ts
- Create: src/modules/documents/domain/document-version.ts
- Create: src/modules/documents/domain/document-state.ts
- Create: src/modules/documents/ports/repository.ts
- Create: src/modules/documents/infrastructure/postgres-repository.ts
- Create: tests/integration/documents/repository.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Approved/effective versions are controlled.
2. Revision creates a new version; never edit approved version in place.
3. Superseded versions remain historical.
4. Binary linkage uses Files capability.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- identity/version separation
- approved version mutation denied
- superseded history retained

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-151 — Document create/revision/edit use cases

**Preconditions:** `IMP-150`

**Files in scope:**
- Create: src/modules/documents/application/create-document.ts
- Create: src/modules/documents/application/get-document.ts
- Create: src/modules/documents/application/list-documents.ts
- Create: src/modules/documents/application/create-version.ts
- Create: src/modules/documents/application/update-version-draft.ts
- Create: tests/integration/documents/editing.test.ts

**Required specs:**
- `Documents/BUSINESS-RULES.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/STATE-MACHINES.md`

**Acceptance requirements:**
- Document identity creation is not approval.
- Only editable Draft version may change.
- Do not invent effective-date policy.
- File attachments go through FileService.

**Required verification:**
- draft editing
- approved edit denied
- permission/scope/version

### Copy-ready Codex prompt

```text
TASK ID: IMP-151
TITLE: Document create/revision/edit use cases

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/BUSINESS-RULES.md
- Documents/PERMISSION-MATRIX.md
- Documents/STATE-MACHINES.md

PRECONDITIONS:
- IMP-150 must already be accepted in current repository reality.

MISSION:
Implement document identity and draft-version workflows.

FILES IN SCOPE:
- Create: src/modules/documents/application/create-document.ts
- Create: src/modules/documents/application/get-document.ts
- Create: src/modules/documents/application/list-documents.ts
- Create: src/modules/documents/application/create-version.ts
- Create: src/modules/documents/application/update-version-draft.ts
- Create: tests/integration/documents/editing.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Document identity creation is not approval.
2. Only editable Draft version may change.
3. Do not invent effective-date policy.
4. File attachments go through FileService.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- draft editing
- approved edit denied
- permission/scope/version

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-152 — Document submit/review/approve/supersede

**Preconditions:** `IMP-151`, `IMP-045`

**Files in scope:**
- Create: src/modules/documents/application/submit-version.ts
- Create: src/modules/documents/application/review-version.ts
- Create: src/modules/documents/application/approve-version.ts
- Create: src/modules/documents/application/supersede-version.ts
- Create: tests/integration/documents/review.test.ts

**Required specs:**
- `Documents/PERMISSION-MATRIX.md`
- `Documents/STATE-MACHINES.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/RISK-REGISTER.md`

**Acceptance requirements:**
- PERM-DOC-APPROVE only where explicitly granted.
- State/version/SoD checks.
- Effective-date behavior remains policy-controlled.
- Superseding never deletes prior version.

**Required verification:**
- wrong-version approval denied
- SoD
- history retained
- wrong controlled version risk

### Copy-ready Codex prompt

```text
TASK ID: IMP-152
TITLE: Document submit/review/approve/supersede

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/PERMISSION-MATRIX.md
- Documents/STATE-MACHINES.md
- Documents/BUSINESS-RULES.md
- Documents/RISK-REGISTER.md

PRECONDITIONS:
- IMP-151 must already be accepted in current repository reality.
- IMP-045 must already be accepted in current repository reality.

MISSION:
Implement controlled review/approval/supersession.

FILES IN SCOPE:
- Create: src/modules/documents/application/submit-version.ts
- Create: src/modules/documents/application/review-version.ts
- Create: src/modules/documents/application/approve-version.ts
- Create: src/modules/documents/application/supersede-version.ts
- Create: tests/integration/documents/review.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. PERM-DOC-APPROVE only where explicitly granted.
2. State/version/SoD checks.
3. Effective-date behavior remains policy-controlled.
4. Superseding never deletes prior version.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- wrong-version approval denied
- SoD
- history retained
- wrong controlled version risk

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-153 — Document Actions + all pages

**Preconditions:** `IMP-152`, `IMP-087`

**Files in scope:**
- Create: src/actions/documents.ts
- Modify: src/actions/index.ts
- Create: src/pages/documents/index.astro
- Create: src/pages/documents/new.astro
- Create: src/pages/documents/[documentId]/index.astro
- Create: src/pages/documents/[documentId]/versions/new.astro
- Create: src/pages/documents/[documentId]/versions/[versionId]/index.astro
- Create: src/pages/documents/[documentId]/versions/[versionId]/review.astro

**Required specs:**
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/DESIGN-SYSTEM.md`

**Acceptance requirements:**
- No `/effective` mutation route.
- Detail shows current effective version from read model.
- Review page does not grant approval.
- Approved versions read-only.

**Required verification:**
- route checker
- Playwright create→draft→review
- approved-edit denial

### Copy-ready Codex prompt

```text
TASK ID: IMP-153
TITLE: Document Actions + all pages

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/UI-UX-SPECIFICATION.md
- Documents/DESIGN-SYSTEM.md

PRECONDITIONS:
- IMP-152 must already be accepted in current repository reality.
- IMP-087 must already be accepted in current repository reality.

MISSION:
Implement Controlled Documents UI with version history/review workspace.

FILES IN SCOPE:
- Create: src/actions/documents.ts
- Modify: src/actions/index.ts
- Create: src/pages/documents/index.astro
- Create: src/pages/documents/new.astro
- Create: src/pages/documents/[documentId]/index.astro
- Create: src/pages/documents/[documentId]/versions/new.astro
- Create: src/pages/documents/[documentId]/versions/[versionId]/index.astro
- Create: src/pages/documents/[documentId]/versions/[versionId]/review.astro

NON-NEGOTIABLE REQUIREMENTS:
1. No `/effective` mutation route.
2. Detail shows current effective version from read model.
3. Review page does not grant approval.
4. Approved versions read-only.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- route checker
- Playwright create→draft→review
- approved-edit denial

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-154 — Document-control E2E risk suite

**Preconditions:** `IMP-153`

**Files in scope:**
- Create: tests/e2e/documents.spec.ts
- Create: tests/integration/documents/authorization-matrix.test.ts

**Required specs:**
- `Documents/TESTING-STRATEGY.md`
- `Documents/RISK-REGISTER.md`

**Acceptance requirements:**
- Wrong-version use, silent edit, superseded-history and scope-leakage tests.
- No approval authority invented.

**Required verification:**
- Documents integration/E2E

### Copy-ready Codex prompt

```text
TASK ID: IMP-154
TITLE: Document-control E2E risk suite

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/TESTING-STRATEGY.md
- Documents/RISK-REGISTER.md

PRECONDITIONS:
- IMP-153 must already be accepted in current repository reality.

MISSION:
Prove controlled-document version integrity and authorization.

FILES IN SCOPE:
- Create: tests/e2e/documents.spec.ts
- Create: tests/integration/documents/authorization-matrix.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Wrong-version use, silent edit, superseded-history and scope-leakage tests.
2. No approval authority invented.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Documents integration/E2E

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

---

# Phase 13 — Governance

## IMP-160 — Approval work-item domain + repository

**Preconditions:** `IMP-026`, `IMP-044`

**Files in scope:**
- Create: src/modules/approvals/domain/approval.ts
- Create: src/modules/approvals/ports/repository.ts
- Create: src/modules/approvals/infrastructure/postgres-repository.ts
- Create: tests/integration/approvals/repository.test.ts

**Required specs:**
- `Documents/DOMAIN-MAP.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/STATE-MACHINES.md`
- `Documents/DATA-DICTIONARY.md`

**Acceptance requirements:**
- Approval points to subject/version/context.
- Subject domain remains transition authority.
- My Approvals returns only truly actionable scoped items.
- No universal approver.

**Required verification:**
- subject linkage
- scope/actionability
- no cross-domain write

### Copy-ready Codex prompt

```text
TASK ID: IMP-160
TITLE: Approval work-item domain + repository

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DOMAIN-MAP.md
- Documents/PERMISSION-MATRIX.md
- Documents/STATE-MACHINES.md
- Documents/DATA-DICTIONARY.md

PRECONDITIONS:
- IMP-026 must already be accepted in current repository reality.
- IMP-044 must already be accepted in current repository reality.

MISSION:
Implement approval workflow infrastructure without duplicating subject-domain rules.

FILES IN SCOPE:
- Create: src/modules/approvals/domain/approval.ts
- Create: src/modules/approvals/ports/repository.ts
- Create: src/modules/approvals/infrastructure/postgres-repository.ts
- Create: tests/integration/approvals/repository.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Approval points to subject/version/context.
2. Subject domain remains transition authority.
3. My Approvals returns only truly actionable scoped items.
4. No universal approver.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- subject linkage
- scope/actionability
- no cross-domain write

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-161 — Approval orchestration

**Preconditions:** `IMP-160`

**Files in scope:**
- Create: src/modules/approvals/application/list-my-approvals.ts
- Create: src/modules/approvals/application/get-approval.ts
- Create: src/modules/approvals/application/decide-approval.ts
- Create: tests/integration/approvals/orchestration.test.ts

**Required specs:**
- `Documents/PERMISSION-MATRIX.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/STATE-MACHINES.md`

**Acceptance requirements:**
- Reauthorize at decision time.
- State/version/SoD validated.
- No duplicate domain business logic.
- Approval decision idempotent where applicable.

**Required verification:**
- cross-scope
- SoD
- stale subject
- replay

### Copy-ready Codex prompt

```text
TASK ID: IMP-161
TITLE: Approval orchestration

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/PERMISSION-MATRIX.md
- Documents/BUSINESS-RULES.md
- Documents/STATE-MACHINES.md

PRECONDITIONS:
- IMP-160 must already be accepted in current repository reality.

MISSION:
Implement approval orchestration delegating final subject mutation to owning Domain use cases.

FILES IN SCOPE:
- Create: src/modules/approvals/application/list-my-approvals.ts
- Create: src/modules/approvals/application/get-approval.ts
- Create: src/modules/approvals/application/decide-approval.ts
- Create: tests/integration/approvals/orchestration.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Reauthorize at decision time.
2. State/version/SoD validated.
3. No duplicate domain business logic.
4. Approval decision idempotent where applicable.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- cross-scope
- SoD
- stale subject
- replay

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-162 — E-Signature service

**Preconditions:** `IMP-062`, `IMP-161`

**Files in scope:**
- Create: src/modules/e-signatures/domain/signature-evidence.ts
- Create: src/modules/e-signatures/ports/repository.ts
- Create: src/modules/e-signatures/infrastructure/postgres-repository.ts
- Create: src/modules/e-signatures/application/sign-controlled-action.ts
- Create: tests/integration/e-signatures/signature.test.ts

**Required specs:**
- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/BUSINESS-RULES.md`

**Acceptance requirements:**
- Never store password as evidence.
- Bind signature to subject/version/action/meaning/actor/trusted time as schema supports.
- Workflow e-sign requirement unresolved => do not invent/bypass.

**Required verification:**
- wrong reauth
- stale version
- SoD
- replay
- evidence excludes password

### Copy-ready Codex prompt

```text
TASK ID: IMP-162
TITLE: E-Signature service

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/SECURITY-ARCHITECTURE.md
- Documents/PERMISSION-MATRIX.md
- Documents/BUSINESS-RULES.md

PRECONDITIONS:
- IMP-062 must already be accepted in current repository reality.
- IMP-161 must already be accepted in current repository reality.

MISSION:
Implement Meaning → Reauthentication → Reauthorization → State/Version/SoD → Evidence → Controlled Transition.

FILES IN SCOPE:
- Create: src/modules/e-signatures/domain/signature-evidence.ts
- Create: src/modules/e-signatures/ports/repository.ts
- Create: src/modules/e-signatures/infrastructure/postgres-repository.ts
- Create: src/modules/e-signatures/application/sign-controlled-action.ts
- Create: tests/integration/e-signatures/signature.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Never store password as evidence.
2. Bind signature to subject/version/action/meaning/actor/trusted time as schema supports.
3. Workflow e-sign requirement unresolved => do not invent/bypass.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- wrong reauth
- stale version
- SoD
- replay
- evidence excludes password

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-163 — Approvals Actions + pages

**Preconditions:** `IMP-162`, `IMP-087`

**Files in scope:**
- Create: src/actions/approvals.ts
- Modify: src/actions/index.ts
- Create: src/pages/approvals/index.astro
- Create: src/pages/approvals/[approvalId].astro

**Required specs:**
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/DESIGN-SYSTEM.md`

**Acceptance requirements:**
- Approval detail composes subject-specific review context.
- No independent sign route.
- Only actionable scoped approvals appear.

**Required verification:**
- Playwright queue/detail/sign
- direct Action tests

### Copy-ready Codex prompt

```text
TASK ID: IMP-163
TITLE: Approvals Actions + pages

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/UI-UX-SPECIFICATION.md
- Documents/DESIGN-SYSTEM.md

PRECONDITIONS:
- IMP-162 must already be accepted in current repository reality.
- IMP-087 must already be accepted in current repository reality.

MISSION:
Implement My Approvals queue/detail and E-Signature integration.

FILES IN SCOPE:
- Create: src/actions/approvals.ts
- Modify: src/actions/index.ts
- Create: src/pages/approvals/index.astro
- Create: src/pages/approvals/[approvalId].astro

NON-NEGOTIABLE REQUIREMENTS:
1. Approval detail composes subject-specific review context.
2. No independent sign route.
3. Only actionable scoped approvals appear.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Playwright queue/detail/sign
- direct Action tests

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-164 — Change Request domain/repository/use cases

**Preconditions:** `IMP-027`, `IMP-044`, `IMP-045`

**Files in scope:**
- Create: src/modules/change-requests/domain/change-request.ts
- Create: src/modules/change-requests/ports/repository.ts
- Create: src/modules/change-requests/infrastructure/postgres-repository.ts
- Create: src/modules/change-requests/application/create-change-request.ts
- Create: src/modules/change-requests/application/get-change-request.ts
- Create: src/modules/change-requests/application/list-change-requests.ts
- Create: src/modules/change-requests/application/transition-change-request.ts
- Create: tests/integration/change-requests/change-requests.test.ts

**Required specs:**
- `Documents/DOMAIN-MAP.md`
- `Documents/STATE-MACHINES.md`
- `Documents/PERMISSION-MATRIX.md`

**Acceptance requirements:**
- PERM-CHG-APPROVE only when granted.
- No arbitrary target state.
- Audit decisions.
- Approved CR does not automatically rewrite unrelated history.

**Required verification:**
- state/permission/scope/version/SoD
- no cross-domain rewrite

### Copy-ready Codex prompt

```text
TASK ID: IMP-164
TITLE: Change Request domain/repository/use cases

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DOMAIN-MAP.md
- Documents/STATE-MACHINES.md
- Documents/PERMISSION-MATRIX.md

PRECONDITIONS:
- IMP-027 must already be accepted in current repository reality.
- IMP-044 must already be accepted in current repository reality.
- IMP-045 must already be accepted in current repository reality.

MISSION:
Implement controlled Change Request lifecycle.

FILES IN SCOPE:
- Create: src/modules/change-requests/domain/change-request.ts
- Create: src/modules/change-requests/ports/repository.ts
- Create: src/modules/change-requests/infrastructure/postgres-repository.ts
- Create: src/modules/change-requests/application/create-change-request.ts
- Create: src/modules/change-requests/application/get-change-request.ts
- Create: src/modules/change-requests/application/list-change-requests.ts
- Create: src/modules/change-requests/application/transition-change-request.ts
- Create: tests/integration/change-requests/change-requests.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. PERM-CHG-APPROVE only when granted.
2. No arbitrary target state.
3. Audit decisions.
4. Approved CR does not automatically rewrite unrelated history.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- state/permission/scope/version/SoD
- no cross-domain rewrite

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-165 — Change Request Actions + pages

**Preconditions:** `IMP-164`

**Files in scope:**
- Create: src/actions/change-requests.ts
- Modify: src/actions/index.ts
- Create: src/pages/change-requests/index.astro
- Create: src/pages/change-requests/new.astro
- Create: src/pages/change-requests/[changeRequestId]/index.astro
- Create: src/pages/change-requests/[changeRequestId]/review.astro

**Required specs:**
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/UI-UX-SPECIFICATION.md`

**Acceptance requirements:**
- Review needs explicit capability.
- GET never applies controlled change.
- Show history/impact/context safely.

**Required verification:**
- route/action/e2e

### Copy-ready Codex prompt

```text
TASK ID: IMP-165
TITLE: Change Request Actions + pages

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/UI-UX-SPECIFICATION.md

PRECONDITIONS:
- IMP-164 must already be accepted in current repository reality.

MISSION:
Implement Change Request Delivery Layer.

FILES IN SCOPE:
- Create: src/actions/change-requests.ts
- Modify: src/actions/index.ts
- Create: src/pages/change-requests/index.astro
- Create: src/pages/change-requests/new.astro
- Create: src/pages/change-requests/[changeRequestId]/index.astro
- Create: src/pages/change-requests/[changeRequestId]/review.astro

NON-NEGOTIABLE REQUIREMENTS:
1. Review needs explicit capability.
2. GET never applies controlled change.
3. Show history/impact/context safely.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- route/action/e2e

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-166 — Governance E2E suite

**Preconditions:** `IMP-163`, `IMP-165`

**Files in scope:**
- Create: tests/e2e/governance.spec.ts
- Create: tests/integration/approvals/authorization-matrix.test.ts

**Required specs:**
- `Documents/TESTING-STRATEGY.md`
- `Documents/RISK-REGISTER.md`

**Acceptance requirements:**
- Wrong subject/version signature, SoD bypass, unauthorized approval, stale version, replay, CR review.
- Audit/evidence correlation.

**Required verification:**
- Governance suites

### Copy-ready Codex prompt

```text
TASK ID: IMP-166
TITLE: Governance E2E suite

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/TESTING-STRATEGY.md
- Documents/RISK-REGISTER.md

PRECONDITIONS:
- IMP-163 must already be accepted in current repository reality.
- IMP-165 must already be accepted in current repository reality.

MISSION:
Prove approvals/E-Signature/change-request integrity.

FILES IN SCOPE:
- Create: tests/e2e/governance.spec.ts
- Create: tests/integration/approvals/authorization-matrix.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Wrong subject/version signature, SoD bypass, unauthorized approval, stale version, replay, CR review.
2. Audit/evidence correlation.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Governance suites

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

---

# Phase 14 — Administration

## IMP-170 — Administration overview + users pages

**Preconditions:** `IMP-065`, `IMP-072`, `IMP-084`

**Files in scope:**
- Create: src/pages/admin/index.astro
- Create: src/pages/admin/users/index.astro
- Create: src/pages/admin/users/new.astro
- Create: src/pages/admin/users/[userId].astro

**Required specs:**
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/PERMISSION-MATRIX.md`

**Acceptance requirements:**
- Explicit permissions only.
- No password/hash/token display.
- Disable/reset use controlled Actions.

**Required verification:**
- Playwright authorized/unauthorized admin user flows

### Copy-ready Codex prompt

```text
TASK ID: IMP-170
TITLE: Administration overview + users pages

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/UI-UX-SPECIFICATION.md
- Documents/PERMISSION-MATRIX.md

PRECONDITIONS:
- IMP-065 must already be accepted in current repository reality.
- IMP-072 must already be accepted in current repository reality.
- IMP-084 must already be accepted in current repository reality.

MISSION:
Implement user administration UI from existing Identity admin use cases.

FILES IN SCOPE:
- Create: src/pages/admin/index.astro
- Create: src/pages/admin/users/index.astro
- Create: src/pages/admin/users/new.astro
- Create: src/pages/admin/users/[userId].astro

NON-NEGOTIABLE REQUIREMENTS:
1. Explicit permissions only.
2. No password/hash/token display.
3. Disable/reset use controlled Actions.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Playwright authorized/unauthorized admin user flows

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-171 — Roles/Permissions/Scopes pages

**Preconditions:** `IMP-071`, `IMP-072`

**Files in scope:**
- Create: src/pages/admin/roles/index.astro
- Create: src/pages/admin/roles/[roleId].astro
- Create: src/pages/admin/permissions.astro
- Create: src/pages/admin/scopes.astro

**Required specs:**
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/ROLE-MATRIX.md`
- `Documents/PERMISSION-MATRIX.md`

**Acceptance requirements:**
- Never imply hierarchy.
- Explicit permissions/scopes.
- Mutation server-authorized with confirmation.
- No self-grant client bypass.

**Required verification:**
- Playwright grant/scope negatives
- direct Action no authority

### Copy-ready Codex prompt

```text
TASK ID: IMP-171
TITLE: Roles/Permissions/Scopes pages

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/UI-UX-SPECIFICATION.md
- Documents/ROLE-MATRIX.md
- Documents/PERMISSION-MATRIX.md

PRECONDITIONS:
- IMP-071 must already be accepted in current repository reality.
- IMP-072 must already be accepted in current repository reality.

MISSION:
Authorization administration UI.

FILES IN SCOPE:
- Create: src/pages/admin/roles/index.astro
- Create: src/pages/admin/roles/[roleId].astro
- Create: src/pages/admin/permissions.astro
- Create: src/pages/admin/scopes.astro

NON-NEGOTIABLE REQUIREMENTS:
1. Never imply hierarchy.
2. Explicit permissions/scopes.
3. Mutation server-authorized with confirmation.
4. No self-grant client bypass.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Playwright grant/scope negatives
- direct Action no authority

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

---

# Phase 15 — System Operations

## IMP-180 — Authorized System Health UI

**Preconditions:** `IMP-052`, `IMP-049`, `IMP-046`

**Files in scope:**
- Create: src/modules/system-health/application/get-system-health.ts
- Create: src/pages/system/health.astro
- Create: tests/integration/system/system-health.test.ts

**Required specs:**
- `Documents/OBSERVABILITY-ARCHITECTURE.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/UI-UX-SPECIFICATION.md`

**Acceptance requirements:**
- Show app/DB/storage/outbox/dependencies/backup posture as available.
- No secrets/raw infra errors.
- Optional AI can be DEGRADED while core READY.

**Required verification:**
- no-permission
- sanitized dependency failure

### Copy-ready Codex prompt

```text
TASK ID: IMP-180
TITLE: Authorized System Health UI

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/OBSERVABILITY-ARCHITECTURE.md
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/UI-UX-SPECIFICATION.md

PRECONDITIONS:
- IMP-052 must already be accepted in current repository reality.
- IMP-049 must already be accepted in current repository reality.
- IMP-046 must already be accepted in current repository reality.

MISSION:
Sanitized authenticated system-health view distinct from machine endpoints.

FILES IN SCOPE:
- Create: src/modules/system-health/application/get-system-health.ts
- Create: src/pages/system/health.astro
- Create: tests/integration/system/system-health.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Show app/DB/storage/outbox/dependencies/backup posture as available.
2. No secrets/raw infra errors.
3. Optional AI can be DEGRADED while core READY.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- no-permission
- sanitized dependency failure

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-181 — Backup catalog/recovery evidence read model

**Preconditions:** `IMP-028`, `IMP-180`

**Files in scope:**
- Create only if schema supports: src/modules/backup-recovery/domain/backup-record.ts
- Create only if supported: src/modules/backup-recovery/ports/repository.ts
- Create only if supported: src/modules/backup-recovery/infrastructure/postgres-repository.ts
- Create only if supported: src/modules/backup-recovery/application/list-backups.ts
- Create only if supported: src/modules/backup-recovery/application/get-backup.ts
- Create: tests/integration/system/backup-catalog.test.ts

**Required specs:**
- `Documents/BACKUP-RECOVERY-PLAN.md`
- `Documents/DATA-MODEL.md`
- `Documents/DATA-DICTIONARY.md`

**Acceptance requirements:**
- Backup Job SUCCEEDED != Restore VERIFIED.
- If entities absent, do not invent tables; use external read-only adapter later.
- Recovery manifest must not exist only inside DB being recovered.

**Required verification:**
- status separation
- no false green state

### Copy-ready Codex prompt

```text
TASK ID: IMP-181
TITLE: Backup catalog/recovery evidence read model

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/BACKUP-RECOVERY-PLAN.md
- Documents/DATA-MODEL.md
- Documents/DATA-DICTIONARY.md

PRECONDITIONS:
- IMP-028 must already be accepted in current repository reality.
- IMP-180 must already be accepted in current repository reality.

MISSION:
Implement app-level backup/recovery catalog only if canonical model supports it.

FILES IN SCOPE:
- Create only if schema supports: src/modules/backup-recovery/domain/backup-record.ts
- Create only if supported: src/modules/backup-recovery/ports/repository.ts
- Create only if supported: src/modules/backup-recovery/infrastructure/postgres-repository.ts
- Create only if supported: src/modules/backup-recovery/application/list-backups.ts
- Create only if supported: src/modules/backup-recovery/application/get-backup.ts
- Create: tests/integration/system/backup-catalog.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Backup Job SUCCEEDED != Restore VERIFIED.
2. If entities absent, do not invent tables; use external read-only adapter later.
3. Recovery manifest must not exist only inside DB being recovered.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- status separation
- no false green state

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-182 — Restore orchestration authorization boundary

**Preconditions:** `IMP-044`, `IMP-181`

**Files in scope:**
- Create: src/modules/backup-recovery/ports/recovery-orchestrator.ts
- Create: src/modules/backup-recovery/application/request-restore.ts
- Create: src/modules/backup-recovery/application/validate-restore-request.ts
- Create: tests/integration/system/restore-authorization.test.ts

**Required specs:**
- `Documents/BACKUP-RECOVERY-PLAN.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/SECURITY-ARCHITECTURE.md`

**Acceptance requirements:**
- PERM-BKP-RESTORE + environment/scope/state/policy.
- Admin not automatic authority.
- GET never restores.
- Unresolved production restore authority/e-sign => DENY.
- No real destructive provider calls.

**Required verification:**
- unauthorized Admin
- wrong environment
- policy unresolved
- fake orchestrator contract

### Copy-ready Codex prompt

```text
TASK ID: IMP-182
TITLE: Restore orchestration authorization boundary

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/BACKUP-RECOVERY-PLAN.md
- Documents/PERMISSION-MATRIX.md
- Documents/SECURITY-ARCHITECTURE.md

PRECONDITIONS:
- IMP-044 must already be accepted in current repository reality.
- IMP-181 must already be accepted in current repository reality.

MISSION:
Implement restore intent/authz boundary without fake provider restore backend.

FILES IN SCOPE:
- Create: src/modules/backup-recovery/ports/recovery-orchestrator.ts
- Create: src/modules/backup-recovery/application/request-restore.ts
- Create: src/modules/backup-recovery/application/validate-restore-request.ts
- Create: tests/integration/system/restore-authorization.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. PERM-BKP-RESTORE + environment/scope/state/policy.
2. Admin not automatic authority.
3. GET never restores.
4. Unresolved production restore authority/e-sign => DENY.
5. No real destructive provider calls.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- unauthorized Admin
- wrong environment
- policy unresolved
- fake orchestrator contract

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-183 — Backup/Restore Actions + pages

**Preconditions:** `IMP-182`, `IMP-086`

**Files in scope:**
- Create: src/actions/system.ts
- Modify: src/actions/index.ts
- Create: src/pages/system/backups/index.astro
- Create: src/pages/system/backups/[backupId]/index.astro
- Create: src/pages/system/backups/[backupId]/restore.astro

**Required specs:**
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/BACKUP-RECOVERY-PLAN.md`

**Acceptance requirements:**
- Restore page shows backup/environment/timezone/DB/app/migration/verification/gaps context available.
- Explicit reason/confirmation.
- No restore on GET.
- No claim of operational restore before provider/drill evidence.

**Required verification:**
- GET no restore
- unauthorized Action
- Backup Success vs Restore Verified UI

### Copy-ready Codex prompt

```text
TASK ID: IMP-183
TITLE: Backup/Restore Actions + pages

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/UI-UX-SPECIFICATION.md
- Documents/BACKUP-RECOVERY-PLAN.md

PRECONDITIONS:
- IMP-182 must already be accepted in current repository reality.
- IMP-086 must already be accepted in current repository reality.

MISSION:
Implement Backup/Restore UI and controlled request Action.

FILES IN SCOPE:
- Create: src/actions/system.ts
- Modify: src/actions/index.ts
- Create: src/pages/system/backups/index.astro
- Create: src/pages/system/backups/[backupId]/index.astro
- Create: src/pages/system/backups/[backupId]/restore.astro

NON-NEGOTIABLE REQUIREMENTS:
1. Restore page shows backup/environment/timezone/DB/app/migration/verification/gaps context available.
2. Explicit reason/confirmation.
3. No restore on GET.
4. No claim of operational restore before provider/drill evidence.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- GET no restore
- unauthorized Action
- Backup Success vs Restore Verified UI

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

---

# Phase 16 — AI Advisory

## IMP-190 — AI provider port + disabled adapter

**Preconditions:** `IMP-052`

**Files in scope:**
- Create: src/modules/ai-advisory/ports/ai-provider.ts
- Create: src/modules/ai-advisory/infrastructure/disabled-ai-provider.ts
- Create: src/modules/ai-advisory/application/get-advisory.ts
- Create: src/modules/ai-advisory/domain/advisory-response.ts
- Create: tests/unit/ai-advisory/advisory.test.ts

**Required specs:**
- `Documents/DOMAIN-MAP.md`
- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/OBSERVABILITY-ARCHITECTURE.md`
- `Documents/RISK-REGISTER.md`

**Acceptance requirements:**
- Default disabled/degraded adapter.
- AI cannot encode authoritative approval/release/sign/PASS/FAIL.
- No full prompt/response/controlled-data logging.
- No provider SDK/credentials yet.

**Required verification:**
- disabled behavior
- authoritative output rejected as authority
- core readiness unaffected

### Copy-ready Codex prompt

```text
TASK ID: IMP-190
TITLE: AI provider port + disabled adapter

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DOMAIN-MAP.md
- Documents/SECURITY-ARCHITECTURE.md
- Documents/OBSERVABILITY-ARCHITECTURE.md
- Documents/RISK-REGISTER.md

PRECONDITIONS:
- IMP-052 must already be accepted in current repository reality.

MISSION:
Advisory-only AI boundary that is safe with no provider selected.

FILES IN SCOPE:
- Create: src/modules/ai-advisory/ports/ai-provider.ts
- Create: src/modules/ai-advisory/infrastructure/disabled-ai-provider.ts
- Create: src/modules/ai-advisory/application/get-advisory.ts
- Create: src/modules/ai-advisory/domain/advisory-response.ts
- Create: tests/unit/ai-advisory/advisory.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Default disabled/degraded adapter.
2. AI cannot encode authoritative approval/release/sign/PASS/FAIL.
3. No full prompt/response/controlled-data logging.
4. No provider SDK/credentials yet.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- disabled behavior
- authoritative output rejected as authority
- core readiness unaffected

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-191 — AI Action + page

**Preconditions:** `IMP-190`, `IMP-083`

**Files in scope:**
- Create: src/actions/ai-advisory.ts
- Modify: src/actions/index.ts
- Create: src/pages/ai-advisory.astro

**Required specs:**
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/DESIGN-SYSTEM.md`

**Acceptance requirements:**
- Advisory label prominent.
- No controlled-action buttons from AI output.
- Server scope limits data.
- Provider unavailable does not break core.

**Required verification:**
- Playwright unavailable state
- no authority trigger

### Copy-ready Codex prompt

```text
TASK ID: IMP-191
TITLE: AI Action + page

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/UI-UX-SPECIFICATION.md
- Documents/DESIGN-SYSTEM.md

PRECONDITIONS:
- IMP-190 must already be accepted in current repository reality.
- IMP-083 must already be accepted in current repository reality.

MISSION:
Implement advisory workspace.

FILES IN SCOPE:
- Create: src/actions/ai-advisory.ts
- Modify: src/actions/index.ts
- Create: src/pages/ai-advisory.astro

NON-NEGOTIABLE REQUIREMENTS:
1. Advisory label prominent.
2. No controlled-action buttons from AI output.
3. Server scope limits data.
4. Provider unavailable does not break core.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Playwright unavailable state
- no authority trigger

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-192 — AI security/authority tests

**Preconditions:** `IMP-191`

**Files in scope:**
- Create: tests/e2e/ai-advisory.spec.ts
- Create: tests/integration/ai-advisory/security.test.ts

**Required specs:**
- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/RISK-REGISTER.md`

**Acceptance requirements:**
- No out-of-scope data.
- Prompt injection cannot change server authz.
- AI outage no core readiness fail.
- No prompt/response in standard logs.

**Required verification:**
- AI security suite with deterministic fake provider

### Copy-ready Codex prompt

```text
TASK ID: IMP-192
TITLE: AI security/authority tests

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/SECURITY-ARCHITECTURE.md
- Documents/RISK-REGISTER.md

PRECONDITIONS:
- IMP-191 must already be accepted in current repository reality.

MISSION:
Test prompt injection/data disclosure/authority boundaries.

FILES IN SCOPE:
- Create: tests/e2e/ai-advisory.spec.ts
- Create: tests/integration/ai-advisory/security.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. No out-of-scope data.
2. Prompt injection cannot change server authz.
3. AI outage no core readiness fail.
4. No prompt/response in standard logs.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- AI security suite with deterministic fake provider

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

---

# Phase 17 — Security & Observability Hardening

## IMP-200 — Production HTTP/session hardening

**Preconditions:** `IMP-068`, `IMP-053`

**Files in scope:**
- Modify: src/middleware.ts
- Modify: astro.config.mjs
- Create: tests/e2e/security-headers.spec.ts

**Required specs:**
- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/DEPLOYMENT-ARCHITECTURE.md`

**Acceptance requirements:**
- CSP/security headers from approved/current support.
- Secure cookies by environment.
- No debug/public source leakage.
- No auth CORS wildcard.

**Required verification:**
- Playwright headers/cookies/origin
- pnpm build

### Copy-ready Codex prompt

```text
TASK ID: IMP-200
TITLE: Production HTTP/session hardening

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/SECURITY-ARCHITECTURE.md
- Documents/DEPLOYMENT-ARCHITECTURE.md

PRECONDITIONS:
- IMP-068 must already be accepted in current repository reality.
- IMP-053 must already be accepted in current repository reality.

MISSION:
Apply verified Astro-compatible production security controls.

FILES IN SCOPE:
- Modify: src/middleware.ts
- Modify: astro.config.mjs
- Create: tests/e2e/security-headers.spec.ts

NON-NEGOTIABLE REQUIREMENTS:
1. CSP/security headers from approved/current support.
2. Secure cookies by environment.
3. No debug/public source leakage.
4. No auth CORS wildcard.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Playwright headers/cookies/origin
- pnpm build

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-201 — Abuse/rate-limit integration boundary

**Preconditions:** `IMP-200`

**Files in scope:**
- Create: src/shared/security/rate-limit.ts
- Create: src/shared/security/rate-limit-store.ts
- Create: src/shared/security/postgres-rate-limit-store.ts
- Create: tests/integration/security/rate-limit.test.ts

**Required specs:**
- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/RISK-REGISTER.md`

**Acceptance requirements:**
- Thresholds policy/config-driven; no arbitrary business constants.
- Protect login/high-risk endpoints.
- Rate limiting is not authorization.

**Required verification:**
- window/concurrency with test thresholds
- no secret logs

### Copy-ready Codex prompt

```text
TASK ID: IMP-201
TITLE: Abuse/rate-limit integration boundary

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/SECURITY-ARCHITECTURE.md
- Documents/RISK-REGISTER.md

PRECONDITIONS:
- IMP-200 must already be accepted in current repository reality.

MISSION:
Implement rate-limit capability where required without inventing production thresholds.

FILES IN SCOPE:
- Create: src/shared/security/rate-limit.ts
- Create: src/shared/security/rate-limit-store.ts
- Create: src/shared/security/postgres-rate-limit-store.ts
- Create: tests/integration/security/rate-limit.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Thresholds policy/config-driven; no arbitrary business constants.
2. Protect login/high-risk endpoints.
3. Rate limiting is not authorization.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- window/concurrency with test thresholds
- no secret logs

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-202 — Wire observability across real paths

**Preconditions:** `IMP-051`, `IMP-046`, `IMP-048`

**Files in scope:**
- Modify: src/middleware.ts
- Modify: src/shared/database/database.ts
- Modify: src/shared/outbox/worker.ts
- Modify: src/shared/files/file-service.ts
- Create: tests/integration/observability/correlation.test.ts

**Required specs:**
- `Documents/OBSERVABILITY-ARCHITECTURE.md`

**Acceptance requirements:**
- Normalized route templates.
- Domain/operation spans.
- Safe DB/outbox/file telemetry.
- No high-cardinality metric IDs.

**Required verification:**
- request→trace correlation
- exporter-down
- cardinality guard

### Copy-ready Codex prompt

```text
TASK ID: IMP-202
TITLE: Wire observability across real paths

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/OBSERVABILITY-ARCHITECTURE.md

PRECONDITIONS:
- IMP-051 must already be accepted in current repository reality.
- IMP-046 must already be accepted in current repository reality.
- IMP-048 must already be accepted in current repository reality.

MISSION:
Wire request/trace/metrics to HTTP/DB/outbox/files/critical workflows.

FILES IN SCOPE:
- Modify: src/middleware.ts
- Modify: src/shared/database/database.ts
- Modify: src/shared/outbox/worker.ts
- Modify: src/shared/files/file-service.ts
- Create: tests/integration/observability/correlation.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Normalized route templates.
2. Domain/operation spans.
3. Safe DB/outbox/file telemetry.
4. No high-cardinality metric IDs.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- request→trace correlation
- exporter-down
- cardinality guard

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-203 — Cross-system concurrency/idempotency stress tests

**Preconditions:** `IMP-125`, `IMP-132`, `IMP-152`, `IMP-171`

**Files in scope:**
- Create: tests/integration/concurrency/controlled-mutations.test.ts
- Create: tests/integration/concurrency/idempotency.test.ts

**Required specs:**
- `Documents/BUSINESS-RULES.md`
- `Documents/DATABASE-ARCHITECTURE.md`
- `Documents/RISK-REGISTER.md`

**Acceptance requirements:**
- Inspection approval, Release, Lab approval, Document approval, permission administration.
- No silent overwrite.
- No duplicate audit/e-sign evidence on replay.

**Required verification:**
- real PG concurrent barriers/locks, not flaky sleeps

### Copy-ready Codex prompt

```text
TASK ID: IMP-203
TITLE: Cross-system concurrency/idempotency stress tests

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/BUSINESS-RULES.md
- Documents/DATABASE-ARCHITECTURE.md
- Documents/RISK-REGISTER.md

PRECONDITIONS:
- IMP-125 must already be accepted in current repository reality.
- IMP-132 must already be accepted in current repository reality.
- IMP-152 must already be accepted in current repository reality.
- IMP-171 must already be accepted in current repository reality.

MISSION:
Stress representative Tier-1 controlled operations.

FILES IN SCOPE:
- Create: tests/integration/concurrency/controlled-mutations.test.ts
- Create: tests/integration/concurrency/idempotency.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Inspection approval, Release, Lab approval, Document approval, permission administration.
2. No silent overwrite.
3. No duplicate audit/e-sign evidence on replay.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- real PG concurrent barriers/locks, not flaky sleeps

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

---

# Phase 18 — System Verification

## IMP-210 — Full authorization/IDOR matrix

**Preconditions:** `IMP-203`

**Files in scope:**
- Create: tests/e2e/authorization-matrix.spec.ts

**Required specs:**
- `Documents/PERMISSION-MATRIX.md`
- `Documents/ROLE-MATRIX.md`
- `Documents/TESTING-STRATEGY.md`
- `Documents/RISK-REGISTER.md`

**Acceptance requirements:**
- Unauthenticated/missing permission/wrong scope/direct Action/UUID substitution/wrong state/SoD/disabled account.
- Reports/search/files/dashboard included.

**Required verification:**
- Playwright matrix with traces on failure

### Copy-ready Codex prompt

```text
TASK ID: IMP-210
TITLE: Full authorization/IDOR matrix

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/PERMISSION-MATRIX.md
- Documents/ROLE-MATRIX.md
- Documents/TESTING-STRATEGY.md
- Documents/RISK-REGISTER.md

PRECONDITIONS:
- IMP-203 must already be accepted in current repository reality.

MISSION:
Browser/API/Action negative authorization across all protected domains.

FILES IN SCOPE:
- Create: tests/e2e/authorization-matrix.spec.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Unauthenticated/missing permission/wrong scope/direct Action/UUID substitution/wrong state/SoD/disabled account.
2. Reports/search/files/dashboard included.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Playwright matrix with traces on failure

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-211 — Critical controlled workflow E2E

**Preconditions:** `IMP-128`, `IMP-135`, `IMP-154`, `IMP-166`

**Files in scope:**
- Create: tests/e2e/critical-workflows.spec.ts

**Required specs:**
- `Documents/STATE-MACHINES.md`
- `Documents/TESTING-STRATEGY.md`
- `Documents/RISK-REGISTER.md`

**Acceptance requirements:**
- Receiving→Inspection→review; PASS remains separate from Release.
- Lab execute→review with approved fixture criteria.
- Quality flow only as allowed.
- Document version→review→approval/supersede.
- Approval/e-sign only where explicit test policy supports.
- Audit history preserved.

**Required verification:**
- critical Playwright suite
- DB postconditions via test-only server helpers

### Copy-ready Codex prompt

```text
TASK ID: IMP-211
TITLE: Critical controlled workflow E2E

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/STATE-MACHINES.md
- Documents/TESTING-STRATEGY.md
- Documents/RISK-REGISTER.md

PRECONDITIONS:
- IMP-128 must already be accepted in current repository reality.
- IMP-135 must already be accepted in current repository reality.
- IMP-154 must already be accepted in current repository reality.
- IMP-166 must already be accepted in current repository reality.

MISSION:
Representative end-to-end controlled workflows through browser/server/PG.

FILES IN SCOPE:
- Create: tests/e2e/critical-workflows.spec.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Receiving→Inspection→review; PASS remains separate from Release.
2. Lab execute→review with approved fixture criteria.
3. Quality flow only as allowed.
4. Document version→review→approval/supersede.
5. Approval/e-sign only where explicit test policy supports.
6. Audit history preserved.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- critical Playwright suite
- DB postconditions via test-only server helpers

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-212 — Files/reports/export security E2E

**Preconditions:** `IMP-049`, `IMP-097`

**Files in scope:**
- Create: tests/e2e/files-reports.spec.ts

**Required specs:**
- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/RISK-REGISTER.md`
- `Documents/PERMISSION-MATRIX.md`

**Acceptance requirements:**
- Unauthorized content never leaks.
- Hash mismatch detected.
- Spreadsheet formula injection neutralized.
- Report export dataset equals authorized screen dataset.

**Required verification:**
- Playwright + exporter assertions

### Copy-ready Codex prompt

```text
TASK ID: IMP-212
TITLE: Files/reports/export security E2E

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/SECURITY-ARCHITECTURE.md
- Documents/RISK-REGISTER.md
- Documents/PERMISSION-MATRIX.md

PRECONDITIONS:
- IMP-049 must already be accepted in current repository reality.
- IMP-097 must already be accepted in current repository reality.

MISSION:
Verify file/evidence/report/export security.

FILES IN SCOPE:
- Create: tests/e2e/files-reports.spec.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Unauthorized content never leaks.
2. Hash mismatch detected.
3. Spreadsheet formula injection neutralized.
4. Report export dataset equals authorized screen dataset.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Playwright + exporter assertions

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-213 — Accessibility/responsive E2E

**Preconditions:** `IMP-211`

**Files in scope:**
- Create: tests/e2e/accessibility.spec.ts
- Create: tests/e2e/responsive.spec.ts

**Required specs:**
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/DESIGN-SYSTEM.md`
- `Documents/TESTING-STRATEGY.md`

**Acceptance requirements:**
- Use axe Playwright/current equivalent + manual keyboard assertions.
- Desktop/tablet/mobile.
- Arabic RTL/English LTR.
- Forms/dialogs/tables/nav/chart summaries.
- Color not sole status signal.

**Required verification:**
- axe
- keyboard-only critical flow
- reduced motion

### Copy-ready Codex prompt

```text
TASK ID: IMP-213
TITLE: Accessibility/responsive E2E

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/UI-UX-SPECIFICATION.md
- Documents/DESIGN-SYSTEM.md
- Documents/TESTING-STRATEGY.md

PRECONDITIONS:
- IMP-211 must already be accepted in current repository reality.

MISSION:
Verify WCAG 2.2 AA target behaviors and responsive layouts.

FILES IN SCOPE:
- Create: tests/e2e/accessibility.spec.ts
- Create: tests/e2e/responsive.spec.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Use axe Playwright/current equivalent + manual keyboard assertions.
2. Desktop/tablet/mobile.
3. Arabic RTL/English LTR.
4. Forms/dialogs/tables/nav/chart summaries.
5. Color not sole status signal.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- axe
- keyboard-only critical flow
- reduced motion

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-214 — Error/stale/dependency failure E2E

**Preconditions:** `IMP-202`, `IMP-213`

**Files in scope:**
- Create: tests/e2e/error-recovery.spec.ts

**Required specs:**
- `Documents/ERROR-ARCHITECTURE.md`
- `Documents/OBSERVABILITY-ARCHITECTURE.md`
- `Documents/TESTING-STRATEGY.md`

**Acceptance requirements:**
- Stale overwrite blocked.
- Safe 404/IDOR.
- 500 requestId no stack.
- AI degraded.
- Outbox/notification degradation does not lie about committed truth.

**Required verification:**
- controlled failure injection
- no secrets in response/log capture

### Copy-ready Codex prompt

```text
TASK ID: IMP-214
TITLE: Error/stale/dependency failure E2E

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/ERROR-ARCHITECTURE.md
- Documents/OBSERVABILITY-ARCHITECTURE.md
- Documents/TESTING-STRATEGY.md

PRECONDITIONS:
- IMP-202 must already be accepted in current repository reality.
- IMP-213 must already be accepted in current repository reality.

MISSION:
Safe user behavior under conflicts/dependency failures.

FILES IN SCOPE:
- Create: tests/e2e/error-recovery.spec.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Stale overwrite blocked.
2. Safe 404/IDOR.
3. 500 requestId no stack.
4. AI degraded.
5. Outbox/notification degradation does not lie about committed truth.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- controlled failure injection
- no secrets in response/log capture

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-215 — Performance baseline

**Preconditions:** `IMP-214`

**Files in scope:**
- Create: tests/performance/smoke.mjs
- Create: docs/verification/PERFORMANCE-BASELINE.md

**Required specs:**
- `Documents/OBSERVABILITY-ARCHITECTURE.md`
- `Documents/PRODUCTION-READINESS-CHECKLIST.md`

**Acceptance requirements:**
- Record env/dataset/release/measured values.
- No pass threshold without approved SLO.
- Investigate obvious N+1/unbounded queries.

**Required verification:**
- run controlled staging-like baseline
- record measurements not false PASS

### Copy-ready Codex prompt

```text
TASK ID: IMP-215
TITLE: Performance baseline

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/OBSERVABILITY-ARCHITECTURE.md
- Documents/PRODUCTION-READINESS-CHECKLIST.md

PRECONDITIONS:
- IMP-214 must already be accepted in current repository reality.

MISSION:
Measure representative performance without invented SLOs.

FILES IN SCOPE:
- Create: tests/performance/smoke.mjs
- Create: docs/verification/PERFORMANCE-BASELINE.md

NON-NEGOTIABLE REQUIREMENTS:
1. Record env/dataset/release/measured values.
2. No pass threshold without approved SLO.
3. Investigate obvious N+1/unbounded queries.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- run controlled staging-like baseline
- record measurements not false PASS

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

---

# Phase 19 — Release Engineering

## IMP-220 — Release identity/build verification

**Preconditions:** `IMP-215`

**Files in scope:**
- Create: scripts/release/release-id.mjs
- Create: scripts/release/verify-release.mjs
- Create: src/config/release.ts
- Create: tests/unit/release/release-id.test.ts

**Required specs:**
- `Documents/DEPLOYMENT-ARCHITECTURE.md`
- `Documents/OBSERVABILITY-ARCHITECTURE.md`

**Acceptance requirements:**
- Refuse production evidence from unknown dirty state unless explicitly non-production.
- Expose service.version safely.
- No secrets.

**Required verification:**
- deterministic metadata
- mismatch
- build service version

### Copy-ready Codex prompt

```text
TASK ID: IMP-220
TITLE: Release identity/build verification

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DEPLOYMENT-ARCHITECTURE.md
- Documents/OBSERVABILITY-ARCHITECTURE.md

PRECONDITIONS:
- IMP-215 must already be accepted in current repository reality.

MISSION:
Bind release identity to exact Git SHA/build ID/migration head.

FILES IN SCOPE:
- Create: scripts/release/release-id.mjs
- Create: scripts/release/verify-release.mjs
- Create: src/config/release.ts
- Create: tests/unit/release/release-id.test.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Refuse production evidence from unknown dirty state unless explicitly non-production.
2. Expose service.version safely.
3. No secrets.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- deterministic metadata
- mismatch
- build service version

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-221 — Full release-candidate CI

**Preconditions:** `IMP-220`

**Files in scope:**
- Modify: .github/workflows/ci.yml

**Required specs:**
- `Documents/DEPLOYMENT-ARCHITECTURE.md`
- `Documents/TESTING-STRATEGY.md`
- `Documents/PRODUCTION-READINESS-CHECKLIST.md`

**Acceptance requirements:**
- Frozen install.
- Architecture/lint/type/unit/integration/migration/concurrency/security/build/E2E.
- Evidence artifacts.
- No prod secrets/deploy.

**Required verification:**
- workflow validation
- local command parity
- remote remains UNVERIFIED until run

### Copy-ready Codex prompt

```text
TASK ID: IMP-221
TITLE: Full release-candidate CI

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DEPLOYMENT-ARCHITECTURE.md
- Documents/TESTING-STRATEGY.md
- Documents/PRODUCTION-READINESS-CHECKLIST.md

PRECONDITIONS:
- IMP-220 must already be accepted in current repository reality.

MISSION:
CI creates traceable release-candidate evidence but does not deploy.

FILES IN SCOPE:
- Modify: .github/workflows/ci.yml

NON-NEGOTIABLE REQUIREMENTS:
1. Frozen install.
2. Architecture/lint/type/unit/integration/migration/concurrency/security/build/E2E.
3. Evidence artifacts.
4. No prod secrets/deploy.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- workflow validation
- local command parity
- remote remains UNVERIFIED until run

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-222 — Developer/operator docs

**Preconditions:** `IMP-221`

**Files in scope:**
- Create: docs/development/LOCAL-DEVELOPMENT.md
- Create: docs/development/TESTING.md
- Create: docs/operations/RELEASE-RUNBOOK.md
- Create: docs/operations/INCIDENT-QUICK-REFERENCE.md

**Required specs:**
- `Documents/DEPLOYMENT-ARCHITECTURE.md`
- `Documents/TESTING-STRATEGY.md`
- `Documents/ERROR-ARCHITECTURE.md`

**Acceptance requirements:**
- No fake commands/secrets.
- Distinguish deployment/rollback-forward-fix/recovery.
- Incident correlation uses requestId/trace, not logs as Audit.

**Required verification:**
- execute every safe documented local command

### Copy-ready Codex prompt

```text
TASK ID: IMP-222
TITLE: Developer/operator docs

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DEPLOYMENT-ARCHITECTURE.md
- Documents/TESTING-STRATEGY.md
- Documents/ERROR-ARCHITECTURE.md

PRECONDITIONS:
- IMP-221 must already be accepted in current repository reality.

MISSION:
Document actual implemented commands/runbooks.

FILES IN SCOPE:
- Create: docs/development/LOCAL-DEVELOPMENT.md
- Create: docs/development/TESTING.md
- Create: docs/operations/RELEASE-RUNBOOK.md
- Create: docs/operations/INCIDENT-QUICK-REFERENCE.md

NON-NEGOTIABLE REQUIREMENTS:
1. No fake commands/secrets.
2. Distinguish deployment/rollback-forward-fix/recovery.
3. Incident correlation uses requestId/trace, not logs as Audit.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- execute every safe documented local command

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-223 — Recovery verification tooling

**Preconditions:** `IMP-030`, `IMP-049`

**Files in scope:**
- Create: scripts/recovery/verify-recovery-manifest.ts
- Create: scripts/recovery/validate-restored-database.ts
- Create: scripts/recovery/validate-restored-files.ts
- Create: docs/operations/RESTORE-DRILL-RUNBOOK.md

**Required specs:**
- `Documents/BACKUP-RECOVERY-PLAN.md`
- `Documents/DATABASE-ARCHITECTURE.md`
- `Documents/PRODUCTION-READINESS-CHECKLIST.md`

**Acceptance requirements:**
- Do not fake physical backup/WAL provider implementation.
- Validate migration ledger/core relations/history/file object/hash/app context.
- Isolated drill default.
- Backup Created != Restore Verified.

**Required verification:**
- disposable restored fixture validation
- provider PITR remains blocked until hosting choice

### Copy-ready Codex prompt

```text
TASK ID: IMP-223
TITLE: Recovery verification tooling

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/BACKUP-RECOVERY-PLAN.md
- Documents/DATABASE-ARCHITECTURE.md
- Documents/PRODUCTION-READINESS-CHECKLIST.md

PRECONDITIONS:
- IMP-030 must already be accepted in current repository reality.
- IMP-049 must already be accepted in current repository reality.

MISSION:
Provider-neutral post-restore validation tooling.

FILES IN SCOPE:
- Create: scripts/recovery/verify-recovery-manifest.ts
- Create: scripts/recovery/validate-restored-database.ts
- Create: scripts/recovery/validate-restored-files.ts
- Create: docs/operations/RESTORE-DRILL-RUNBOOK.md

NON-NEGOTIABLE REQUIREMENTS:
1. Do not fake physical backup/WAL provider implementation.
2. Validate migration ledger/core relations/history/file object/hash/app context.
3. Isolated drill default.
4. Backup Created != Restore Verified.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- disposable restored fixture validation
- provider PITR remains blocked until hosting choice

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-224 — Render + qclevel.top deployment baseline decision

**Preconditions:** `IMP-222`, `IMP-223`

**Files in scope:**
- Modify: Documents/DEPLOYMENT-ARCHITECTURE.md
- Modify: .agents/mind/01-mind-latest.md
- Create: docs/operations/RENDER-DEPLOYMENT.md

**Required specs:**
- `Documents/DEPLOYMENT-ARCHITECTURE.md`
- `Documents/BACKUP-RECOVERY-PLAN.md`
- `Documents/OBSERVABILITY-ARCHITECTURE.md`

**Acceptance requirements:**
- Web runtime hosting decision is Render Web Service, not Render Static Site, because the Astro app has SSR/Actions/API/server sessions.
- Canonical production domain is `qclevel.top`; root domain should be added to the Render service and `www.qclevel.top` handled as Render's paired redirect/custom domain behavior.
- Hostinger remains the current DNS manager unless nameservers are intentionally moved later.
- Document DNS baseline: root `A @ → 216.24.57.1` when Hostinger lacks ALIAS/ANAME flattening for the intended setup, and `CNAME www → <service>.onrender.com`; remove conflicting AAAA records while Render remains IPv4-only. Re-verify Render DNS docs at execution time before changing DNS.
- Render web service requires Astro Node adapter server build; verify actual start command from the built output. Current Render Astro guidance uses `node dist/server/entry.mjs` for SSR Web Services.
- Bind the service to `HOST=0.0.0.0`; pin Node 24 using the repository/runtime configuration rather than relying blindly on platform defaults.
- Use an HTTP health check path mapped to `/api/health/ready` only after its dependency semantics are verified; Render treats 2xx/3xx as healthy and 4xx/5xx as unhealthy.
- Do not yet invent PostgreSQL provider, object-storage provider, KMS/secrets provider, telemetry backend, or physical backup/PITR implementation if they remain unapproved.
- Record `qclevel.top` as the canonical app origin for production security/origin configuration once deployment settings are implemented.

**Required verification:**
- Re-check current Render Astro Web Service, custom domain, DNS and health-check documentation.
- Document the exact existing Render service name/onrender.com hostname from current infrastructure before DNS commands are treated as executable.
- Confirm `qclevel.top` and `www.qclevel.top` DNS resolution after propagation when DNS is actually configured.
- Confirm Render custom-domain verification/TLS becomes valid when deployment exists.
- Do not claim production deployment exists merely because this architecture decision is documented.

### Copy-ready Codex prompt

```text
TASK ID: IMP-224
TITLE: Render + qclevel.top deployment baseline decision

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DEPLOYMENT-ARCHITECTURE.md
- Documents/BACKUP-RECOVERY-PLAN.md
- Documents/OBSERVABILITY-ARCHITECTURE.md

PRECONDITIONS:
- IMP-222 must already be accepted in current repository reality.
- IMP-223 must already be accepted in current repository reality.

MISSION:
Lock the already user-selected web hosting/domain baseline: Render Web Service for the Astro SSR app, with `qclevel.top` as the canonical production domain and DNS currently managed at Hostinger; separately resolve still-open database/object-storage/secrets/telemetry/backup provider decisions.

FILES IN SCOPE:
- Modify: Documents/DEPLOYMENT-ARCHITECTURE.md
- Modify: .agents/mind/01-mind-latest.md
- Create: docs/operations/RENDER-DEPLOYMENT.md

NON-NEGOTIABLE REQUIREMENTS:
1. Web runtime hosting decision is Render Web Service, not Render Static Site, because the Astro app has SSR/Actions/API/server sessions.
2. Canonical production domain is `qclevel.top`; root domain should be added to the Render service and `www.qclevel.top` handled as Render's paired redirect/custom domain behavior.
3. Hostinger remains the current DNS manager unless nameservers are intentionally moved later.
4. Document DNS baseline: root `A @ → 216.24.57.1` when Hostinger lacks ALIAS/ANAME flattening for the intended setup, and `CNAME www → <service>.onrender.com`; remove conflicting AAAA records while Render remains IPv4-only. Re-verify Render DNS docs at execution time before changing DNS.
5. Render web service requires Astro Node adapter server build; verify actual start command from the built output. Current Render Astro guidance uses `node dist/server/entry.mjs` for SSR Web Services.
6. Bind the service to `HOST=0.0.0.0`; pin Node 24 using the repository/runtime configuration rather than relying blindly on platform defaults.
7. Use an HTTP health check path mapped to `/api/health/ready` only after its dependency semantics are verified; Render treats 2xx/3xx as healthy and 4xx/5xx as unhealthy.
8. Do not yet invent PostgreSQL provider, object-storage provider, KMS/secrets provider, telemetry backend, or physical backup/PITR implementation if they remain unapproved.
9. Record `qclevel.top` as the canonical app origin for production security/origin configuration once deployment settings are implemented.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Re-check current Render Astro Web Service, custom domain, DNS and health-check documentation.
- Document the exact existing Render service name/onrender.com hostname from current infrastructure before DNS commands are treated as executable.
- Confirm `qclevel.top` and `www.qclevel.top` DNS resolution after propagation when DNS is actually configured.
- Confirm Render custom-domain verification/TLS becomes valid when deployment exists.
- Do not claim production deployment exists merely because this architecture decision is documented.

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-225 — Render Web Service Blueprint / production service configuration

**Preconditions:** `IMP-224`, `IMP-221`

**Files in scope:**
- Create: render.yaml
- Modify: .env.example
- Modify: docs/operations/RENDER-DEPLOYMENT.md

**Required specs:**
- `Documents/DEPLOYMENT-ARCHITECTURE.md`
- `Documents/OBSERVABILITY-ARCHITECTURE.md`
- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/PRODUCTION-READINESS-CHECKLIST.md`

**Acceptance requirements:**
- Use a Render `web` service, not a static site.
- Use pnpm frozen-install/build commands consistent with package.json and the locked pnpm version; verify the exact command on Render before finalizing.
- Start the Astro Node server using the actual local build output; expected baseline is `node dist/server/entry.mjs`, but verify it.
- Set `healthCheckPath: /api/health/ready` only after readiness semantics are implemented and passing.
- Set custom domain `qclevel.top` in Blueprint if the current Render Blueprint spec supports the `domains` field; current Render docs do support `domains` for Web Services.
- Prefer `autoDeployTrigger: checksPass` if the linked Render/Git integration and plan support it, so production deploys wait for CI checks; otherwise document the exact safe alternative rather than silently using commit-triggered production auto-deploy.
- Do not put DATABASE_URL, session secrets, object-store keys, OTel credentials or other secrets in render.yaml. Reference Render-managed secret environment values/configuration instead.
- Do not define a Render PostgreSQL database in this task unless PostgreSQL provider has been explicitly selected.
- Keep the Render onrender.com subdomain policy decision explicit; do not disable it until `qclevel.top` is verified and operational.
- Production deployment still requires the Go/No-Go and explicit user authorization defined later; render.yaml existence is not deployment approval.

**Required verification:**
- Validate render.yaml against the current Render Blueprint specification.
- pnpm build locally and confirm the start command path.
- Run `/api/health/ready` locally/test environment and confirm healthy/unhealthy semantics.
- Inspect render.yaml for secrets.
- Do not trigger an actual production deploy without explicit authorization.

### Copy-ready Codex prompt

```text
TASK ID: IMP-225
TITLE: Render Web Service Blueprint / production service configuration

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DEPLOYMENT-ARCHITECTURE.md
- Documents/OBSERVABILITY-ARCHITECTURE.md
- Documents/SECURITY-ARCHITECTURE.md
- Documents/PRODUCTION-READINESS-CHECKLIST.md

PRECONDITIONS:
- IMP-224 must already be accepted in current repository reality.
- IMP-221 must already be accepted in current repository reality.

MISSION:
Define the Render Web Service deployment configuration for the Astro SSR application and canonical domain `qclevel.top`, while keeping secrets/provider-sensitive values outside Git.

FILES IN SCOPE:
- Create: render.yaml
- Modify: .env.example
- Modify: docs/operations/RENDER-DEPLOYMENT.md

NON-NEGOTIABLE REQUIREMENTS:
1. Use a Render `web` service, not a static site.
2. Use pnpm frozen-install/build commands consistent with package.json and the locked pnpm version; verify the exact command on Render before finalizing.
3. Start the Astro Node server using the actual local build output; expected baseline is `node dist/server/entry.mjs`, but verify it.
4. Set `healthCheckPath: /api/health/ready` only after readiness semantics are implemented and passing.
5. Set custom domain `qclevel.top` in Blueprint if the current Render Blueprint spec supports the `domains` field; current Render docs do support `domains` for Web Services.
6. Prefer `autoDeployTrigger: checksPass` if the linked Render/Git integration and plan support it, so production deploys wait for CI checks; otherwise document the exact safe alternative rather than silently using commit-triggered production auto-deploy.
7. Do not put DATABASE_URL, session secrets, object-store keys, OTel credentials or other secrets in render.yaml. Reference Render-managed secret environment values/configuration instead.
8. Do not define a Render PostgreSQL database in this task unless PostgreSQL provider has been explicitly selected.
9. Keep the Render onrender.com subdomain policy decision explicit; do not disable it until `qclevel.top` is verified and operational.
10. Production deployment still requires the Go/No-Go and explicit user authorization defined later; render.yaml existence is not deployment approval.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- Validate render.yaml against the current Render Blueprint specification.
- pnpm build locally and confirm the start command path.
- Run `/api/health/ready` locally/test environment and confirm healthy/unhealthy semantics.
- Inspect render.yaml for secrets.
- Do not trigger an actual production deploy without explicit authorization.

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

---

# Phase 20 — UAT & Acceptance

## IMP-230 — UAT actors/dataset/scenario matrix

**Preconditions:** `IMP-221`

**Files in scope:**
- Create: tests/uat/README.md
- Create: tests/uat/actors.ts
- Create: tests/uat/scenarios.ts
- Create: scripts/uat/seed-uat.ts

**Required specs:**
- `Documents/UAT-ACCEPTANCE-PLAN.md`
- `Documents/ROLE-MATRIX.md`
- `Documents/PERMISSION-MATRIX.md`

**Acceptance requirements:**
- Explicit grants/scopes only.
- Role × Domain × Workflow × State × Permission × positive/negative × evidence.
- No invented scientific data.

**Required verification:**
- seed isolated UAT DB
- unique/required scenario coverage

### Copy-ready Codex prompt

```text
TASK ID: IMP-230
TITLE: UAT actors/dataset/scenario matrix

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/UAT-ACCEPTANCE-PLAN.md
- Documents/ROLE-MATRIX.md
- Documents/PERMISSION-MATRIX.md

PRECONDITIONS:
- IMP-221 must already be accepted in current repository reality.

MISSION:
Materialize release-bound UAT matrix.

FILES IN SCOPE:
- Create: tests/uat/README.md
- Create: tests/uat/actors.ts
- Create: tests/uat/scenarios.ts
- Create: scripts/uat/seed-uat.ts

NON-NEGOTIABLE REQUIREMENTS:
1. Explicit grants/scopes only.
2. Role × Domain × Workflow × State × Permission × positive/negative × evidence.
3. No invented scientific data.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- seed isolated UAT DB
- unique/required scenario coverage

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-231 — Executable UAT evidence collector

**Preconditions:** `IMP-230`

**Files in scope:**
- Create: scripts/uat/run-uat.ts
- Create: scripts/uat/collect-evidence.ts
- Create: tests/uat/acceptance.test.ts
- Create: evidence/uat/.gitkeep
- Create: evidence/uat/README.md

**Required specs:**
- `Documents/UAT-ACCEPTANCE-PLAN.md`
- `Documents/PRODUCTION-READINESS-CHECKLIST.md`

**Acceptance requirements:**
- Statuses only approved vocabulary.
- Every PASS links actual evidence.
- Code change invalidates affected evidence.
- No sensitive artifacts indiscriminately committed.

**Required verification:**
- run against staging when exists; otherwise release status NOT_EXECUTED

### Copy-ready Codex prompt

```text
TASK ID: IMP-231
TITLE: Executable UAT evidence collector

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/UAT-ACCEPTANCE-PLAN.md
- Documents/PRODUCTION-READINESS-CHECKLIST.md

PRECONDITIONS:
- IMP-230 must already be accepted in current repository reality.

MISSION:
Create UAT runner/evidence schema; never pre-fill PASS.

FILES IN SCOPE:
- Create: scripts/uat/run-uat.ts
- Create: scripts/uat/collect-evidence.ts
- Create: tests/uat/acceptance.test.ts
- Create: evidence/uat/.gitkeep
- Create: evidence/uat/README.md

NON-NEGOTIABLE REQUIREMENTS:
1. Statuses only approved vocabulary.
2. Every PASS links actual evidence.
3. Code change invalidates affected evidence.
4. No sensitive artifacts indiscriminately committed.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- run against staging when exists; otherwise release status NOT_EXECUTED

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-232 — Production readiness evidence checker

**Preconditions:** `IMP-231`, `IMP-223`

**Files in scope:**
- Create: scripts/readiness/check-production-readiness.ts
- Create: evidence/readiness/.gitkeep
- Create: evidence/readiness/README.md

**Required specs:**
- `Documents/PRODUCTION-READINESS-CHECKLIST.md`
- `Documents/RISK-REGISTER.md`
- `Documents/UAT-ACCEPTANCE-PLAN.md`
- `Documents/BACKUP-RECOVERY-PLAN.md`

**Acceptance requirements:**
- Critical FAIL/UNVERIFIED => NO-GO.
- Required UAT FAIL/NOT_EXECUTED => NO-GO.
- Residual CRITICAL => NO-GO; VERY HIGH blocked by default.
- Required restore evidence missing => NO-GO.
- Artifact/Git SHA/migration mismatch => NO-GO.
- Script cannot be final human authority.

**Required verification:**
- unit every blocking rule
- no readiness percentage

### Copy-ready Codex prompt

```text
TASK ID: IMP-232
TITLE: Production readiness evidence checker

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/PRODUCTION-READINESS-CHECKLIST.md
- Documents/RISK-REGISTER.md
- Documents/UAT-ACCEPTANCE-PLAN.md
- Documents/BACKUP-RECOVERY-PLAN.md

PRECONDITIONS:
- IMP-231 must already be accepted in current repository reality.
- IMP-223 must already be accepted in current repository reality.

MISSION:
Machine-assisted Go/No-Go aggregation without percentages.

FILES IN SCOPE:
- Create: scripts/readiness/check-production-readiness.ts
- Create: evidence/readiness/.gitkeep
- Create: evidence/readiness/README.md

NON-NEGOTIABLE REQUIREMENTS:
1. Critical FAIL/UNVERIFIED => NO-GO.
2. Required UAT FAIL/NOT_EXECUTED => NO-GO.
3. Residual CRITICAL => NO-GO; VERY HIGH blocked by default.
4. Required restore evidence missing => NO-GO.
5. Artifact/Git SHA/migration mismatch => NO-GO.
6. Script cannot be final human authority.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- unit every blocking rule
- no readiness percentage

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-233 — Final release evidence record generator

**Preconditions:** `IMP-232`

**Files in scope:**
- Create: scripts/readiness/generate-release-record.ts
- Create: evidence/releases/.gitkeep
- Create: evidence/releases/README.md

**Required specs:**
- `Documents/DEPLOYMENT-ARCHITECTURE.md`
- `Documents/PRODUCTION-READINESS-CHECKLIST.md`

**Acceptance requirements:**
- Release/Git/Build/Migration/CI/UAT/security/restore/open risks/limitations/Go-NoGo fields.
- Do not auto-fill decision authority or GO.
- No secrets.

**Required verification:**
- schema/unit
- sample TEST/UNVERIFIED record only

### Copy-ready Codex prompt

```text
TASK ID: IMP-233
TITLE: Final release evidence record generator

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DEPLOYMENT-ARCHITECTURE.md
- Documents/PRODUCTION-READINESS-CHECKLIST.md

PRECONDITIONS:
- IMP-232 must already be accepted in current repository reality.

MISSION:
Generate exact release evidence record.

FILES IN SCOPE:
- Create: scripts/readiness/generate-release-record.ts
- Create: evidence/releases/.gitkeep
- Create: evidence/releases/README.md

NON-NEGOTIABLE REQUIREMENTS:
1. Release/Git/Build/Migration/CI/UAT/security/restore/open risks/limitations/Go-NoGo fields.
2. Do not auto-fill decision authority or GO.
3. No secrets.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- schema/unit
- sample TEST/UNVERIFIED record only

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-234 — Go-Live runbook hard stop

**Preconditions:** `IMP-224`, `IMP-233`, `IMP-225`

**Files in scope:**
- Create: docs/operations/GO-LIVE-RUNBOOK.md

**Required specs:**
- `Documents/DEPLOYMENT-ARCHITECTURE.md`
- `Documents/UAT-ACCEPTANCE-PLAN.md`
- `Documents/PRODUCTION-READINESS-CHECKLIST.md`
- `Documents/BACKUP-RECOVERY-PLAN.md`

**Acceptance requirements:**
- If provider/evidence absent, mark Go-Live BLOCKED; do not invent commands.
- Approved release→migration→deploy→health/readiness→post-deploy→monitoring→release evidence.
- No dirty production deployment.
- Actual deployment requires explicit user authorization.

**Required verification:**
- dry-run non-destructive commands
- confirm exact release IDs

### Copy-ready Codex prompt

```text
TASK ID: IMP-234
TITLE: Go-Live runbook hard stop

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/DEPLOYMENT-ARCHITECTURE.md
- Documents/UAT-ACCEPTANCE-PLAN.md
- Documents/PRODUCTION-READINESS-CHECKLIST.md
- Documents/BACKUP-RECOVERY-PLAN.md

PRECONDITIONS:
- IMP-224 must already be accepted in current repository reality.
- IMP-233 must already be accepted in current repository reality.
- IMP-225 must already be accepted in current repository reality.

MISSION:
Write provider-aware Go-Live runbook only after provider decisions + real staging evidence.

FILES IN SCOPE:
- Create: docs/operations/GO-LIVE-RUNBOOK.md

NON-NEGOTIABLE REQUIREMENTS:
1. If provider/evidence absent, mark Go-Live BLOCKED; do not invent commands.
2. Approved release→migration→deploy→health/readiness→post-deploy→monitoring→release evidence.
3. No dirty production deployment.
4. Actual deployment requires explicit user authorization.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- dry-run non-destructive commands
- confirm exact release IDs

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

---

# Phase 21 — Implementation Closure

## IMP-240 — Traceability + evidence index

**Preconditions:** `IMP-234`

**Files in scope:**
- Modify: Documents/REQUIREMENTS-TRACEABILITY.md
- Modify: .agents/mind/01-mind-latest.md
- Create: docs/verification/IMPLEMENTATION-EVIDENCE-INDEX.md

**Required specs:**
- `Documents/REQUIREMENTS-TRACEABILITY.md`
- `Documents/TESTING-STRATEGY.md`
- `Documents/RISK-REGISTER.md`
- `Documents/PRODUCTION-READINESS-CHECKLIST.md`

**Acceptance requirements:**
- Requirement→Rule→Permission→State→Data→Implementation→Tests→E2E/UAT→Evidence→PASS/FAIL.
- Unexecuted tests never PASS.
- Residual risks remain unverified until proven.
- Mind reflects actual code/runtime, not plan.

**Required verification:**
- full lint/type/unit/integration/E2E/build
- fresh+upgrade migrations
- architecture check
- evidence consistency

### Copy-ready Codex prompt

```text
TASK ID: IMP-240
TITLE: Traceability + evidence index

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/REQUIREMENTS-TRACEABILITY.md
- Documents/TESTING-STRATEGY.md
- Documents/RISK-REGISTER.md
- Documents/PRODUCTION-READINESS-CHECKLIST.md

PRECONDITIONS:
- IMP-234 must already be accepted in current repository reality.

MISSION:
Close implementation traceability only from current executed evidence.

FILES IN SCOPE:
- Modify: Documents/REQUIREMENTS-TRACEABILITY.md
- Modify: .agents/mind/01-mind-latest.md
- Create: docs/verification/IMPLEMENTATION-EVIDENCE-INDEX.md

NON-NEGOTIABLE REQUIREMENTS:
1. Requirement→Rule→Permission→State→Data→Implementation→Tests→E2E/UAT→Evidence→PASS/FAIL.
2. Unexecuted tests never PASS.
3. Residual risks remain unverified until proven.
4. Mind reflects actual code/runtime, not plan.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- full lint/type/unit/integration/E2E/build
- fresh+upgrade migrations
- architecture check
- evidence consistency

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

## IMP-241 — Final Production Readiness assessment

**Preconditions:** `IMP-240`

**Files in scope:**
- No new code unless defects are found; use approved checklist and evidence outputs

**Required specs:**
- `Documents/PRODUCTION-READINESS-CHECKLIST.md`
- `Documents/RISK-REGISTER.md`
- `Documents/UAT-ACCEPTANCE-PLAN.md`

**Acceptance requirements:**
- No unsupported 100%.
- No percentage overrides blocker.
- Human/policy authority owns final decision.
- Any required critical UNVERIFIED => NO-GO.

**Required verification:**
- record release/evidence refs
- if GO not proven report NO-GO blockers

### Copy-ready Codex prompt

```text
TASK ID: IMP-241
TITLE: Final Production Readiness assessment

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System
MODE: Execute exactly one task. Do not skip ahead or implement unrelated work.
GIT SAFETY: no push, merge, deploy, delete, or commit unless explicitly authorized by the user in the execution session.

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read every REQUIRED SPEC listed in this prompt.
4. Inspect current repository reality; never assume files already exist.
5. Inspect `.agents/skills/`; read any matching `SKILL.md` completely.
6. Use TDD and verification-before-completion.
7. Preserve: Astro Page/Client → Astro Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific limits/formulas/precision/rounding/sampling/calibration intervals/retest policy/release authority/RPO/RTO/retention/approval authority.
11. No silent overwrite. Controlled history is preserved. Critical mutations are transactional/idempotent where applicable.
12. AI is advisory only.
13. Evidence before PASS/COMPLETE/READY claims.

REQUIRED SPECS:
- Documents/PRODUCTION-READINESS-CHECKLIST.md
- Documents/RISK-REGISTER.md
- Documents/UAT-ACCEPTANCE-PLAN.md

PRECONDITIONS:
- IMP-240 must already be accepted in current repository reality.

MISSION:
Perform final Go/No-Go for exact release; any fix creates a new candidate and may invalidate evidence.

FILES IN SCOPE:
- No new code unless defects are found; use approved checklist and evidence outputs

NON-NEGOTIABLE REQUIREMENTS:
1. No unsupported 100%.
2. No percentage overrides blocker.
3. Human/policy authority owns final decision.
4. Any required critical UNVERIFIED => NO-GO.

TDD / EXECUTION:
1. Inspect every in-scope path first; if reality conflicts, stop and report rather than overwrite blindly.
2. For behavior tasks, write the smallest failing test that proves required behavior before production implementation.
3. Run the focused test and capture the expected failure; do not fake a red state.
4. Implement the minimal correct behavior while preserving all Foundation constraints.
5. Run the focused test to PASS, then the relevant neighboring suite.
6. Run typecheck/lint/migration/architecture/build/E2E checks appropriate to changed files.
7. Inspect `git diff` and `git diff --check`; exclude unrelated changes.
8. Search for accidental secrets, Delivery→DB imports, Admin bypasses, arbitrary target-state mutation, and invented policy/scientific constants.
9. Do not claim COMPLETE/PASS/READY unless listed verification actually ran successfully.
10. Do not commit unless user explicitly authorizes commits in this execution session.

VERIFICATION REQUIRED:
- record release/evidence refs
- if GO not proven report NO-GO blockers

FINAL RESPONSE FORMAT:
- What changed
- Exact files changed/created
- Tests/commands actually run + exact result
- Evidence for authorization/state/data integrity
- Remaining gaps / blocked policy decisions
- Suggested narrow commit message (do not commit unless authorized)

STOP after this task. Do not start the next task.
```

---

# 8. No-Skip Execution Checklist

- [ ] `IMP-000` — Normalize UI/UX and Route Manifest approval metadata
- [ ] `IMP-001` — Repository hygiene
- [ ] `IMP-002` — Create package.json and pin toolchain
- [ ] `IMP-003` — Astro/TypeScript/environment skeleton
- [ ] `IMP-004` — Lint/format baseline
- [ ] `IMP-005` — Vitest/Playwright/Testcontainers harness
- [ ] `IMP-006` — CI verification baseline
- [ ] `IMP-007` — Architecture and route-manifest checkers
- [ ] `IMP-010` — Validated server runtime config
- [ ] `IMP-011` — IDs/time/pagination primitives
- [ ] `IMP-012` — Canonical AppError model
- [ ] `IMP-013` — pg + Kysely + transaction boundary
- [ ] `IMP-014` — Forward-only migration runner
- [ ] `IMP-015` — Core qc schema
- [ ] `IMP-016` — Identity/session schema
- [ ] `IMP-017` — Authorization schema
- [ ] `IMP-018` — Audit/outbox/idempotency schema
- [ ] `IMP-019` — Files/notifications schema
- [ ] `IMP-020` — Tasks schema
- [ ] `IMP-021` — Quality schema
- [ ] `IMP-022` — Quarantine schema
- [ ] `IMP-023` — Laboratory schema
- [ ] `IMP-024` — Assets schema
- [ ] `IMP-025` — Controlled Documents schema
- [ ] `IMP-026` — Approvals/E-Signatures schema
- [ ] `IMP-027` — Change Requests schema
- [ ] `IMP-028` — Backup/Recovery metadata schema
- [ ] `IMP-029` — Dev/test seeds and factories
- [ ] `IMP-030` — Full migration verification
- [ ] `IMP-040` — Validation contracts
- [ ] `IMP-041` — Concurrency/idempotency
- [ ] `IMP-042` — Request context + middleware base
- [ ] `IMP-043` — Authorization types
- [ ] `IMP-044` — Central authorization + SoD evaluator
- [ ] `IMP-045` — Audit service
- [ ] `IMP-046` — Durable outbox
- [ ] `IMP-047` — Notifications
- [ ] `IMP-048` — Files/evidence service
- [ ] `IMP-049` — Object-store adapters
- [ ] `IMP-050` — Structured JSON logging/redaction
- [ ] `IMP-051` — OpenTelemetry traces/metrics
- [ ] `IMP-052` — Liveness/readiness
- [ ] `IMP-053` — HTTP security helpers
- [ ] `IMP-054` — Arabic/English i18n
- [ ] `IMP-060` — Identity domain + ports
- [ ] `IMP-061` — PostgreSQL user/session repositories
- [ ] `IMP-062` — Password hashing + session service
- [ ] `IMP-063` — Login/logout/session resolution
- [ ] `IMP-064` — Account self-service
- [ ] `IMP-065` — Administrative user lifecycle
- [ ] `IMP-066` — Auth/account Astro Actions
- [ ] `IMP-067` — Login + Account pages
- [ ] `IMP-068` — Connect middleware to real session resolver
- [ ] `IMP-070` — Authorization persistence repository
- [ ] `IMP-071` — Role/permission/scope use cases
- [ ] `IMP-072` — Admin Actions
- [ ] `IMP-080` — Tokens/fonts/global CSS
- [ ] `IMP-081` — Layouts
- [ ] `IMP-082` — Core visual primitives
- [ ] `IMP-083` — Form components
- [ ] `IMP-084` — Tables/filters/pagination
- [ ] `IMP-085` — Sidebar/topbar/navigation
- [ ] `IMP-086` — Feedback/dialog/toast/stale conflict
- [ ] `IMP-087` — E-Signature dialog
- [ ] `IMP-088` — Charts/KPI primitives
- [ ] `IMP-089` — Root/404/500 + AppLayout shell
- [ ] `IMP-090` — Dashboard read model
- [ ] `IMP-091` — Dashboard page
- [ ] `IMP-092` — Authorized global search service
- [ ] `IMP-093` — Search + Notifications pages
- [ ] `IMP-094` — Audit query + page
- [ ] `IMP-095` — Report registry/query
- [ ] `IMP-096` — CSV/XLSX exports
- [ ] `IMP-097` — Reports pages/Action
- [ ] `IMP-100` — Tasks domain + repository port
- [ ] `IMP-101` — Tasks PostgreSQL repository
- [ ] `IMP-102` — Tasks application use cases
- [ ] `IMP-103` — Tasks Actions + Route pages
- [ ] `IMP-104` — Tasks E2E + authorization matrix
- [ ] `IMP-110` — Finding implementation
- [ ] `IMP-111` — NCR implementation
- [ ] `IMP-112` — RCA implementation
- [ ] `IMP-113` — CAPA implementation
- [ ] `IMP-114` — Quality overview read model
- [ ] `IMP-115` — Quality Actions + pages
- [ ] `IMP-116` — Quality E2E risk suite
- [ ] `IMP-120` — Receiving domain + repository
- [ ] `IMP-121` — Receiving use cases
- [ ] `IMP-122` — Inspection domain/template context/repository
- [ ] `IMP-123` — Inspection execution
- [ ] `IMP-124` — Inspection review/approval
- [ ] `IMP-125` — Explicit Release System actions
- [ ] `IMP-126` — Quarantine overview/admin read models
- [ ] `IMP-127` — Quarantine Actions + all pages
- [ ] `IMP-128` — Quarantine E2E risk suite
- [ ] `IMP-130` — Lab domain/repository
- [ ] `IMP-131` — Lab creation/execution/submission
- [ ] `IMP-132` — Lab review/approval
- [ ] `IMP-133` — Retest workflow
- [ ] `IMP-134` — Lab Actions + all pages
- [ ] `IMP-135` — Lab scientific/security E2E
- [ ] `IMP-140` — Equipment implementation
- [ ] `IMP-141` — Calibration implementation
- [ ] `IMP-142` — Maintenance implementation
- [ ] `IMP-143` — Equipment eligibility capability for Lab
- [ ] `IMP-144` — Assets Actions + pages
- [ ] `IMP-145` — Assets E2E risk suite
- [ ] `IMP-150` — Document identity/version domain + repository
- [ ] `IMP-151` — Document create/revision/edit use cases
- [ ] `IMP-152` — Document submit/review/approve/supersede
- [ ] `IMP-153` — Document Actions + all pages
- [ ] `IMP-154` — Document-control E2E risk suite
- [ ] `IMP-160` — Approval work-item domain + repository
- [ ] `IMP-161` — Approval orchestration
- [ ] `IMP-162` — E-Signature service
- [ ] `IMP-163` — Approvals Actions + pages
- [ ] `IMP-164` — Change Request domain/repository/use cases
- [ ] `IMP-165` — Change Request Actions + pages
- [ ] `IMP-166` — Governance E2E suite
- [ ] `IMP-170` — Administration overview + users pages
- [ ] `IMP-171` — Roles/Permissions/Scopes pages
- [ ] `IMP-180` — Authorized System Health UI
- [ ] `IMP-181` — Backup catalog/recovery evidence read model
- [ ] `IMP-182` — Restore orchestration authorization boundary
- [ ] `IMP-183` — Backup/Restore Actions + pages
- [ ] `IMP-190` — AI provider port + disabled adapter
- [ ] `IMP-191` — AI Action + page
- [ ] `IMP-192` — AI security/authority tests
- [ ] `IMP-200` — Production HTTP/session hardening
- [ ] `IMP-201` — Abuse/rate-limit integration boundary
- [ ] `IMP-202` — Wire observability across real paths
- [ ] `IMP-203` — Cross-system concurrency/idempotency stress tests
- [ ] `IMP-210` — Full authorization/IDOR matrix
- [ ] `IMP-211` — Critical controlled workflow E2E
- [ ] `IMP-212` — Files/reports/export security E2E
- [ ] `IMP-213` — Accessibility/responsive E2E
- [ ] `IMP-214` — Error/stale/dependency failure E2E
- [ ] `IMP-215` — Performance baseline
- [ ] `IMP-220` — Release identity/build verification
- [ ] `IMP-221` — Full release-candidate CI
- [ ] `IMP-222` — Developer/operator docs
- [ ] `IMP-223` — Recovery verification tooling
- [ ] `IMP-224` — Render + qclevel.top deployment baseline decision
- [ ] `IMP-225` — Render Web Service Blueprint / production service configuration
- [ ] `IMP-230` — UAT actors/dataset/scenario matrix
- [ ] `IMP-231` — Executable UAT evidence collector
- [ ] `IMP-232` — Production readiness evidence checker
- [ ] `IMP-233` — Final release evidence record generator
- [ ] `IMP-234` — Go-Live runbook hard stop
- [ ] `IMP-240` — Traceability + evidence index
- [ ] `IMP-241` — Final Production Readiness assessment

---

# 9. Master Verification Gates

- Gate A — Foundation/Bootstrap: approval metadata, locked toolchain, Astro server config, test harness, architecture checks.
- Gate B — Database: PostgreSQL 18 fresh/upgrade migrations, checksum integrity, constraints, all supported schemas.
- Gate C — Identity/Auth: opaque sessions, password security, disable/revoke semantics, middleware context.
- Gate D — Authorization: permission/scope/entity/state/SoD/version Default-Deny matrix including Admin-denied cases.
- Gate E — Shared integrity: Audit/Outbox/Idempotency/Files/Notifications/Errors/Telemetry.
- Gate F — UI: exact Design System, shell, forms/tables/dialogs, RTL/LTR, accessibility, route coverage.
- Gate G — Domain: Tasks, Quality, Quarantine, Laboratory, Assets, Controlled Documents, Governance.
- Gate H — Critical safety: PASS≠RELEASED, scientific source binding, controlled history, E-Signature, IDOR, export/file security, concurrency.
- Gate I — Full verification: lint/type/unit/integration/migration/security/concurrency/E2E/a11y/build/performance measurements.
- Gate J — Release Candidate: exact Git SHA + Build/Artifact ID + Migration Head.
- Gate K — Render staging/production configuration: Render Web Service, qclevel.top, Hostinger DNS, verified readiness health check; remaining infrastructure providers explicitly resolved.
- Gate L — UAT: exact release, positive/negative evidence.
- Gate M — Recovery: isolated restore validation; backup job success alone insufficient.
- Gate N — Production Readiness: any critical FAIL/UNVERIFIED or required evidence missing => NO-GO.
- Gate O — Go-Live: explicit authorization, migration, Render deployment, qclevel.top TLS/domain verification, health/readiness, post-deploy monitoring/evidence.

---

# 10. Coverage Self-Review

- [ ] No task assumes package.json/src/migrations/tests exist.
- [ ] Every active canonical Route Manifest page/endpoint is assigned.
- [ ] All conditional creation routes are represented conditionally.
- [ ] Password recovery/reset remains deferred.
- [ ] Every Domain Map owner has implementation tasks.
- [ ] Every controlled domain has negative authz/state/version/IDOR coverage.
- [ ] PASS and RELEASED remain separate end-to-end.
- [ ] Scientific policy is never invented.
- [ ] Audit/logs/telemetry/E-Signature evidence stay separate.
- [ ] Backup Success vs Restore Verified remains separate.
- [ ] Render + qclevel.top is represented explicitly without inventing unresolved DB/object/KMS/telemetry providers.
- [ ] AI stays advisory-only.
- [ ] Production readiness is Go/No-Go evidence, not percentage.
- [ ] Every Task has copy-ready prompt + STOP.

---

# 11. Plan Coverage Facts

- Total task prompts: **151**.
- Unique concrete planned file/code/config paths indexed: **587**.
- Canonical active Route Manifest coverage check: **no missing active route paths** at plan-generation verification time.
- Conditional Route Manifest creation routes represented: **5/5**.
- Provider-specific unresolved infrastructure remains intentionally gated instead of guessed.

---

# 12. Handoff

This is a complete execution roadmap, not proof the software exists. A checkbox is completed only when current code + tests/evidence prove it. Execute one Task ID at a time and update the Project Mind after accepted repository work.

> **Final rule:** The prompt being written is not implementation evidence.
