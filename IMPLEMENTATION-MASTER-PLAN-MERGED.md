# IMPLEMENTATION-MASTER-PLAN-MERGED.md

# QC Operations & Laboratory Management System
## Progressive Merged Implementation Prompts — Empty Repository → Go-Live

**Repository:** `YEEEAE/QC-Operations-Laboratory-Management-System`  
**Starting Reality:** Foundation documents only; no application package/runtime implementation  
**Prompt Count:** 40 merged execution prompts  
**Previous Plan Coverage:** all 151 original tasks are mapped exactly once into this merged plan  
**Production Web Hosting:** Render Web Service  
**Production Domain:** `qclevel.top`  
**DNS:** Hostinger  

> هذه النسخة مرتبة عمدًا من الملفات الأساسية أولًا: package/Render/Astro/config/paths/testing، ثم DB/Auth/Core/UI، ثم Domains، ثم Hardening/UAT/Go-Live. لا تبدأ Domain قبل إنهاء الأساس الذي يعتمد عليه.





--- 



---

# MASTER-029 — System Health + Backup/Restore catalog/orchestration/UI

**Phase:** System Ops  
**Merged from:** `IMP-180`, `IMP-181`, `IMP-182`, `IMP-183`

## Files in scope

- Create: src/modules/system-health/application/get-system-health.ts
- Create: src/pages/system/health.astro
- Create: tests/integration/system/system-health.test.ts
- Create only if schema supports: src/modules/backup-recovery/domain/backup-record.ts
- Create only if supported: src/modules/backup-recovery/ports/repository.ts
- Create only if supported: src/modules/backup-recovery/infrastructure/postgres-repository.ts
- Create only if supported: src/modules/backup-recovery/application/list-backups.ts
- Create only if supported: src/modules/backup-recovery/application/get-backup.ts
- Create: tests/integration/system/backup-catalog.test.ts
- Create: src/modules/backup-recovery/ports/recovery-orchestrator.ts
- Create: src/modules/backup-recovery/application/request-restore.ts
- Create: src/modules/backup-recovery/application/validate-restore-request.ts
- Create: tests/integration/system/restore-authorization.test.ts
- Create: src/actions/system.ts
- Modify: src/actions/index.ts
- Create: src/pages/system/backups/index.astro
- Create: src/pages/system/backups/[backupId]/index.astro
- Create: src/pages/system/backups/[backupId]/restore.astro

## Required specs

- `Documents/OBSERVABILITY-ARCHITECTURE.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/BACKUP-RECOVERY-PLAN.md`
- `Documents/DATA-MODEL.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/SECURITY-ARCHITECTURE.md`

## Copy-ready Codex prompt

```text
PROMPT ID: MASTER-029
TITLE: System Health + Backup/Restore catalog/orchestration/UI

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read all REQUIRED SPECS listed below.
4. Inspect current repository reality; never assume the previous prompt succeeded unless current files/tests prove it.
5. Inspect `.agents/skills/`; read the full matching `SKILL.md` if a relevant local skill exists.
6. Use TDD for behavior changes and verification-before-completion.
7. Preserve: Astro Page/Client → Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State Rules → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no raw SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific/policy values, approval/release authority, RPO/RTO, retention, calibration/retest rules, or other deferred decisions.
11. PASS ≠ RELEASED. No silent overwrite. Controlled history is preserved.
12. AI is advisory only.
13. No PASS/READY/100% claim without fresh evidence.
14. No push, merge, commit, deletion or production deployment unless explicitly authorized in this execution session.

REQUIRED SPECS:
- Documents/OBSERVABILITY-ARCHITECTURE.md
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/UI-UX-SPECIFICATION.md
- Documents/BACKUP-RECOVERY-PLAN.md
- Documents/DATA-MODEL.md
- Documents/DATA-DICTIONARY.md
- Documents/PERMISSION-MATRIX.md
- Documents/SECURITY-ARCHITECTURE.md

FILES / PATHS IN SCOPE:
- Create: src/modules/system-health/application/get-system-health.ts
- Create: src/pages/system/health.astro
- Create: tests/integration/system/system-health.test.ts
- Create only if schema supports: src/modules/backup-recovery/domain/backup-record.ts
- Create only if supported: src/modules/backup-recovery/ports/repository.ts
- Create only if supported: src/modules/backup-recovery/infrastructure/postgres-repository.ts
- Create only if supported: src/modules/backup-recovery/application/list-backups.ts
- Create only if supported: src/modules/backup-recovery/application/get-backup.ts
- Create: tests/integration/system/backup-catalog.test.ts
- Create: src/modules/backup-recovery/ports/recovery-orchestrator.ts
- Create: src/modules/backup-recovery/application/request-restore.ts
- Create: src/modules/backup-recovery/application/validate-restore-request.ts
- Create: tests/integration/system/restore-authorization.test.ts
- Create: src/actions/system.ts
- Modify: src/actions/index.ts
- Create: src/pages/system/backups/index.astro
- Create: src/pages/system/backups/[backupId]/index.astro
- Create: src/pages/system/backups/[backupId]/restore.astro

MISSION:
1. Sanitized authenticated system-health view distinct from machine endpoints.
2. Implement app-level backup/recovery catalog only if canonical model supports it.
3. Implement restore intent/authz boundary without fake provider restore backend.
4. Implement Backup/Restore UI and controlled request Action.

NON-NEGOTIABLE REQUIREMENTS:
1. Show app/DB/storage/outbox/dependencies/backup posture as available.
2. No secrets/raw infra errors.
3. Optional AI can be DEGRADED while core READY.
4. Backup Job SUCCEEDED != Restore VERIFIED.
5. If entities absent, do not invent tables; use external read-only adapter later.
6. Recovery manifest must not exist only inside DB being recovered.
7. PERM-BKP-RESTORE + environment/scope/state/policy.
8. Admin not automatic authority.
9. GET never restores.
10. Unresolved production restore authority/e-sign => DENY.
11. No real destructive provider calls.
12. Restore page shows backup/environment/timezone/DB/app/migration/verification/gaps context available.
13. Explicit reason/confirmation.
14. No restore on GET.
15. No claim of operational restore before provider/drill evidence.

EXECUTION ORDER INSIDE THIS PROMPT:
1. Inspect the in-scope files and current repository tree.
2. Create/modify foundational/configuration files before files that import them.
3. For behavior, write focused failing tests first.
4. Implement from lowest layer upward: Domain/Shared primitive → Repository/Infrastructure → Application Use Case → Action/API → Page/UI.
5. Never create a UI/action that points to a not-yet-existing authoritative use case.
6. Run focused verification after each coherent sub-part.
7. Run the combined verification listed below.
8. Inspect `git diff` + `git diff --check` and search for secrets, raw SQL in Delivery, Admin bypasses, arbitrary target-state handling, and invented policy/science.
9. Update Project Mind only with work actually implemented and verified.
10. STOP. Do not continue to the next MASTER prompt.

VERIFICATION:
- no-permission
- sanitized dependency failure
- status separation
- no false green state
- unauthorized Admin
- wrong environment
- policy unresolved
- fake orchestrator contract
- GET no restore
- unauthorized Action
- Backup Success vs Restore Verified UI

FINAL RESPONSE:
- What was created/changed
- Exact paths
- Tests/commands actually run + results
- Security/authorization/state/concurrency evidence relevant to this prompt
- Anything BLOCKED by missing approved policy/provider/scientific data
- Suggested commit message only; do not commit unless explicitly authorized
```

---

# MASTER-030 — AI Advisory boundary + UI + security tests

**Phase:** AI  
**Merged from:** `IMP-190`, `IMP-191`, `IMP-192`

## Files in scope

- Create: src/modules/ai-advisory/ports/ai-provider.ts
- Create: src/modules/ai-advisory/infrastructure/disabled-ai-provider.ts
- Create: src/modules/ai-advisory/application/get-advisory.ts
- Create: src/modules/ai-advisory/domain/advisory-response.ts
- Create: tests/unit/ai-advisory/advisory.test.ts
- Create: src/actions/ai-advisory.ts
- Modify: src/actions/index.ts
- Create: src/pages/ai-advisory.astro
- Create: tests/e2e/ai-advisory.spec.ts
- Create: tests/integration/ai-advisory/security.test.ts

## Required specs

- `Documents/DOMAIN-MAP.md`
- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/OBSERVABILITY-ARCHITECTURE.md`
- `Documents/RISK-REGISTER.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/DESIGN-SYSTEM.md`

## Copy-ready Codex prompt

```text
PROMPT ID: MASTER-030
TITLE: AI Advisory boundary + UI + security tests

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read all REQUIRED SPECS listed below.
4. Inspect current repository reality; never assume the previous prompt succeeded unless current files/tests prove it.
5. Inspect `.agents/skills/`; read the full matching `SKILL.md` if a relevant local skill exists.
6. Use TDD for behavior changes and verification-before-completion.
7. Preserve: Astro Page/Client → Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State Rules → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no raw SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific/policy values, approval/release authority, RPO/RTO, retention, calibration/retest rules, or other deferred decisions.
11. PASS ≠ RELEASED. No silent overwrite. Controlled history is preserved.
12. AI is advisory only.
13. No PASS/READY/100% claim without fresh evidence.
14. No push, merge, commit, deletion or production deployment unless explicitly authorized in this execution session.

REQUIRED SPECS:
- Documents/DOMAIN-MAP.md
- Documents/SECURITY-ARCHITECTURE.md
- Documents/OBSERVABILITY-ARCHITECTURE.md
- Documents/RISK-REGISTER.md
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/UI-UX-SPECIFICATION.md
- Documents/DESIGN-SYSTEM.md

FILES / PATHS IN SCOPE:
- Create: src/modules/ai-advisory/ports/ai-provider.ts
- Create: src/modules/ai-advisory/infrastructure/disabled-ai-provider.ts
- Create: src/modules/ai-advisory/application/get-advisory.ts
- Create: src/modules/ai-advisory/domain/advisory-response.ts
- Create: tests/unit/ai-advisory/advisory.test.ts
- Create: src/actions/ai-advisory.ts
- Modify: src/actions/index.ts
- Create: src/pages/ai-advisory.astro
- Create: tests/e2e/ai-advisory.spec.ts
- Create: tests/integration/ai-advisory/security.test.ts

MISSION:
1. Advisory-only AI boundary that is safe with no provider selected.
2. Implement advisory workspace.
3. Test prompt injection/data disclosure/authority boundaries.

NON-NEGOTIABLE REQUIREMENTS:
1. Default disabled/degraded adapter.
2. AI cannot encode authoritative approval/release/sign/PASS/FAIL.
3. No full prompt/response/controlled-data logging.
4. No provider SDK/credentials yet.
5. Advisory label prominent.
6. No controlled-action buttons from AI output.
7. Server scope limits data.
8. Provider unavailable does not break core.
9. No out-of-scope data.
10. Prompt injection cannot change server authz.
11. AI outage no core readiness fail.
12. No prompt/response in standard logs.

EXECUTION ORDER INSIDE THIS PROMPT:
1. Inspect the in-scope files and current repository tree.
2. Create/modify foundational/configuration files before files that import them.
3. For behavior, write focused failing tests first.
4. Implement from lowest layer upward: Domain/Shared primitive → Repository/Infrastructure → Application Use Case → Action/API → Page/UI.
5. Never create a UI/action that points to a not-yet-existing authoritative use case.
6. Run focused verification after each coherent sub-part.
7. Run the combined verification listed below.
8. Inspect `git diff` + `git diff --check` and search for secrets, raw SQL in Delivery, Admin bypasses, arbitrary target-state handling, and invented policy/science.
9. Update Project Mind only with work actually implemented and verified.
10. STOP. Do not continue to the next MASTER prompt.

VERIFICATION:
- disabled behavior
- authoritative output rejected as authority
- core readiness unaffected
- Playwright unavailable state
- no authority trigger
- AI security suite with deterministic fake provider

FINAL RESPONSE:
- What was created/changed
- Exact paths
- Tests/commands actually run + results
- Security/authorization/state/concurrency evidence relevant to this prompt
- Anything BLOCKED by missing approved policy/provider/scientific data
- Suggested commit message only; do not commit unless explicitly authorized
```

---

# MASTER-031 — Production security + rate limiting + observability wiring

**Phase:** Hardening  
**Merged from:** `IMP-200`, `IMP-201`, `IMP-202`

## Files in scope

- Modify: src/middleware.ts
- Modify: astro.config.mjs
- Create: tests/e2e/security-headers.spec.ts
- Create: src/shared/security/rate-limit.ts
- Create: src/shared/security/rate-limit-store.ts
- Create: src/shared/security/postgres-rate-limit-store.ts
- Create: tests/integration/security/rate-limit.test.ts
- Modify: src/shared/database/database.ts
- Modify: src/shared/outbox/worker.ts
- Modify: src/shared/files/file-service.ts
- Create: tests/integration/observability/correlation.test.ts

## Required specs

- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/DEPLOYMENT-ARCHITECTURE.md`
- `Documents/RISK-REGISTER.md`
- `Documents/OBSERVABILITY-ARCHITECTURE.md`

## Copy-ready Codex prompt

```text
PROMPT ID: MASTER-031
TITLE: Production security + rate limiting + observability wiring

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read all REQUIRED SPECS listed below.
4. Inspect current repository reality; never assume the previous prompt succeeded unless current files/tests prove it.
5. Inspect `.agents/skills/`; read the full matching `SKILL.md` if a relevant local skill exists.
6. Use TDD for behavior changes and verification-before-completion.
7. Preserve: Astro Page/Client → Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State Rules → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no raw SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific/policy values, approval/release authority, RPO/RTO, retention, calibration/retest rules, or other deferred decisions.
11. PASS ≠ RELEASED. No silent overwrite. Controlled history is preserved.
12. AI is advisory only.
13. No PASS/READY/100% claim without fresh evidence.
14. No push, merge, commit, deletion or production deployment unless explicitly authorized in this execution session.

REQUIRED SPECS:
- Documents/SECURITY-ARCHITECTURE.md
- Documents/DEPLOYMENT-ARCHITECTURE.md
- Documents/RISK-REGISTER.md
- Documents/OBSERVABILITY-ARCHITECTURE.md

FILES / PATHS IN SCOPE:
- Modify: src/middleware.ts
- Modify: astro.config.mjs
- Create: tests/e2e/security-headers.spec.ts
- Create: src/shared/security/rate-limit.ts
- Create: src/shared/security/rate-limit-store.ts
- Create: src/shared/security/postgres-rate-limit-store.ts
- Create: tests/integration/security/rate-limit.test.ts
- Modify: src/shared/database/database.ts
- Modify: src/shared/outbox/worker.ts
- Modify: src/shared/files/file-service.ts
- Create: tests/integration/observability/correlation.test.ts

MISSION:
1. Apply verified Astro-compatible production security controls.
2. Implement rate-limit capability where required without inventing production thresholds.
3. Wire request/trace/metrics to HTTP/DB/outbox/files/critical workflows.

NON-NEGOTIABLE REQUIREMENTS:
1. CSP/security headers from approved/current support.
2. Secure cookies by environment.
3. No debug/public source leakage.
4. No auth CORS wildcard.
5. Thresholds policy/config-driven; no arbitrary business constants.
6. Protect login/high-risk endpoints.
7. Rate limiting is not authorization.
8. Normalized route templates.
9. Domain/operation spans.
10. Safe DB/outbox/file telemetry.
11. No high-cardinality metric IDs.

EXECUTION ORDER INSIDE THIS PROMPT:
1. Inspect the in-scope files and current repository tree.
2. Create/modify foundational/configuration files before files that import them.
3. For behavior, write focused failing tests first.
4. Implement from lowest layer upward: Domain/Shared primitive → Repository/Infrastructure → Application Use Case → Action/API → Page/UI.
5. Never create a UI/action that points to a not-yet-existing authoritative use case.
6. Run focused verification after each coherent sub-part.
7. Run the combined verification listed below.
8. Inspect `git diff` + `git diff --check` and search for secrets, raw SQL in Delivery, Admin bypasses, arbitrary target-state handling, and invented policy/science.
9. Update Project Mind only with work actually implemented and verified.
10. STOP. Do not continue to the next MASTER prompt.

VERIFICATION:
- Playwright headers/cookies/origin
- pnpm build
- window/concurrency with test thresholds
- no secret logs
- request→trace correlation
- exporter-down
- cardinality guard

FINAL RESPONSE:
- What was created/changed
- Exact paths
- Tests/commands actually run + results
- Security/authorization/state/concurrency evidence relevant to this prompt
- Anything BLOCKED by missing approved policy/provider/scientific data
- Suggested commit message only; do not commit unless explicitly authorized
```

---

# MASTER-032 — Concurrency/idempotency stress + full authorization/IDOR matrix

**Phase:** Verification  
**Merged from:** `IMP-203`, `IMP-210`

## Files in scope

- Create: tests/integration/concurrency/controlled-mutations.test.ts
- Create: tests/integration/concurrency/idempotency.test.ts
- Create: tests/e2e/authorization-matrix.spec.ts

## Required specs

- `Documents/BUSINESS-RULES.md`
- `Documents/DATABASE-ARCHITECTURE.md`
- `Documents/RISK-REGISTER.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/ROLE-MATRIX.md`
- `Documents/TESTING-STRATEGY.md`

## Copy-ready Codex prompt

```text
PROMPT ID: MASTER-032
TITLE: Concurrency/idempotency stress + full authorization/IDOR matrix

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read all REQUIRED SPECS listed below.
4. Inspect current repository reality; never assume the previous prompt succeeded unless current files/tests prove it.
5. Inspect `.agents/skills/`; read the full matching `SKILL.md` if a relevant local skill exists.
6. Use TDD for behavior changes and verification-before-completion.
7. Preserve: Astro Page/Client → Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State Rules → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no raw SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific/policy values, approval/release authority, RPO/RTO, retention, calibration/retest rules, or other deferred decisions.
11. PASS ≠ RELEASED. No silent overwrite. Controlled history is preserved.
12. AI is advisory only.
13. No PASS/READY/100% claim without fresh evidence.
14. No push, merge, commit, deletion or production deployment unless explicitly authorized in this execution session.

REQUIRED SPECS:
- Documents/BUSINESS-RULES.md
- Documents/DATABASE-ARCHITECTURE.md
- Documents/RISK-REGISTER.md
- Documents/PERMISSION-MATRIX.md
- Documents/ROLE-MATRIX.md
- Documents/TESTING-STRATEGY.md

FILES / PATHS IN SCOPE:
- Create: tests/integration/concurrency/controlled-mutations.test.ts
- Create: tests/integration/concurrency/idempotency.test.ts
- Create: tests/e2e/authorization-matrix.spec.ts

MISSION:
1. Stress representative Tier-1 controlled operations.
2. Browser/API/Action negative authorization across all protected domains.

NON-NEGOTIABLE REQUIREMENTS:
1. Inspection approval, Release, Lab approval, Document approval, permission administration.
2. No silent overwrite.
3. No duplicate audit/e-sign evidence on replay.
4. Unauthenticated/missing permission/wrong scope/direct Action/UUID substitution/wrong state/SoD/disabled account.
5. Reports/search/files/dashboard included.

EXECUTION ORDER INSIDE THIS PROMPT:
1. Inspect the in-scope files and current repository tree.
2. Create/modify foundational/configuration files before files that import them.
3. For behavior, write focused failing tests first.
4. Implement from lowest layer upward: Domain/Shared primitive → Repository/Infrastructure → Application Use Case → Action/API → Page/UI.
5. Never create a UI/action that points to a not-yet-existing authoritative use case.
6. Run focused verification after each coherent sub-part.
7. Run the combined verification listed below.
8. Inspect `git diff` + `git diff --check` and search for secrets, raw SQL in Delivery, Admin bypasses, arbitrary target-state handling, and invented policy/science.
9. Update Project Mind only with work actually implemented and verified.
10. STOP. Do not continue to the next MASTER prompt.

VERIFICATION:
- real PG concurrent barriers/locks, not flaky sleeps
- Playwright matrix with traces on failure

FINAL RESPONSE:
- What was created/changed
- Exact paths
- Tests/commands actually run + results
- Security/authorization/state/concurrency evidence relevant to this prompt
- Anything BLOCKED by missing approved policy/provider/scientific data
- Suggested commit message only; do not commit unless explicitly authorized
```

---

# MASTER-033 — Critical workflow E2E + files/reports security

**Phase:** Verification  
**Merged from:** `IMP-211`, `IMP-212`

## Files in scope

- Create: tests/e2e/critical-workflows.spec.ts
- Create: tests/e2e/files-reports.spec.ts

## Required specs

- `Documents/STATE-MACHINES.md`
- `Documents/TESTING-STRATEGY.md`
- `Documents/RISK-REGISTER.md`
- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/PERMISSION-MATRIX.md`

## Copy-ready Codex prompt

```text
PROMPT ID: MASTER-033
TITLE: Critical workflow E2E + files/reports security

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read all REQUIRED SPECS listed below.
4. Inspect current repository reality; never assume the previous prompt succeeded unless current files/tests prove it.
5. Inspect `.agents/skills/`; read the full matching `SKILL.md` if a relevant local skill exists.
6. Use TDD for behavior changes and verification-before-completion.
7. Preserve: Astro Page/Client → Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State Rules → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no raw SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific/policy values, approval/release authority, RPO/RTO, retention, calibration/retest rules, or other deferred decisions.
11. PASS ≠ RELEASED. No silent overwrite. Controlled history is preserved.
12. AI is advisory only.
13. No PASS/READY/100% claim without fresh evidence.
14. No push, merge, commit, deletion or production deployment unless explicitly authorized in this execution session.

REQUIRED SPECS:
- Documents/STATE-MACHINES.md
- Documents/TESTING-STRATEGY.md
- Documents/RISK-REGISTER.md
- Documents/SECURITY-ARCHITECTURE.md
- Documents/PERMISSION-MATRIX.md

FILES / PATHS IN SCOPE:
- Create: tests/e2e/critical-workflows.spec.ts
- Create: tests/e2e/files-reports.spec.ts

MISSION:
1. Representative end-to-end controlled workflows through browser/server/PG.
2. Verify file/evidence/report/export security.

NON-NEGOTIABLE REQUIREMENTS:
1. Receiving→Inspection→review; PASS remains separate from Release.
2. Lab execute→review with approved fixture criteria.
3. Quality flow only as allowed.
4. Document version→review→approval/supersede.
5. Approval/e-sign only where explicit test policy supports.
6. Audit history preserved.
7. Unauthorized content never leaks.
8. Hash mismatch detected.
9. Spreadsheet formula injection neutralized.
10. Report export dataset equals authorized screen dataset.

EXECUTION ORDER INSIDE THIS PROMPT:
1. Inspect the in-scope files and current repository tree.
2. Create/modify foundational/configuration files before files that import them.
3. For behavior, write focused failing tests first.
4. Implement from lowest layer upward: Domain/Shared primitive → Repository/Infrastructure → Application Use Case → Action/API → Page/UI.
5. Never create a UI/action that points to a not-yet-existing authoritative use case.
6. Run focused verification after each coherent sub-part.
7. Run the combined verification listed below.
8. Inspect `git diff` + `git diff --check` and search for secrets, raw SQL in Delivery, Admin bypasses, arbitrary target-state handling, and invented policy/science.
9. Update Project Mind only with work actually implemented and verified.
10. STOP. Do not continue to the next MASTER prompt.

VERIFICATION:
- critical Playwright suite
- DB postconditions via test-only server helpers
- Playwright + exporter assertions

FINAL RESPONSE:
- What was created/changed
- Exact paths
- Tests/commands actually run + results
- Security/authorization/state/concurrency evidence relevant to this prompt
- Anything BLOCKED by missing approved policy/provider/scientific data
- Suggested commit message only; do not commit unless explicitly authorized
```

---

# MASTER-034 — Accessibility + failure UX + performance baseline

**Phase:** Verification  
**Merged from:** `IMP-213`, `IMP-214`, `IMP-215`

## Files in scope

- Create: tests/e2e/accessibility.spec.ts
- Create: tests/e2e/responsive.spec.ts
- Create: tests/e2e/error-recovery.spec.ts
- Create: tests/performance/smoke.mjs
- Create: docs/verification/PERFORMANCE-BASELINE.md

## Required specs

- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/DESIGN-SYSTEM.md`
- `Documents/TESTING-STRATEGY.md`
- `Documents/ERROR-ARCHITECTURE.md`
- `Documents/OBSERVABILITY-ARCHITECTURE.md`
- `Documents/PRODUCTION-READINESS-CHECKLIST.md`

## Copy-ready Codex prompt

```text
PROMPT ID: MASTER-034
TITLE: Accessibility + failure UX + performance baseline

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read all REQUIRED SPECS listed below.
4. Inspect current repository reality; never assume the previous prompt succeeded unless current files/tests prove it.
5. Inspect `.agents/skills/`; read the full matching `SKILL.md` if a relevant local skill exists.
6. Use TDD for behavior changes and verification-before-completion.
7. Preserve: Astro Page/Client → Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State Rules → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no raw SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific/policy values, approval/release authority, RPO/RTO, retention, calibration/retest rules, or other deferred decisions.
11. PASS ≠ RELEASED. No silent overwrite. Controlled history is preserved.
12. AI is advisory only.
13. No PASS/READY/100% claim without fresh evidence.
14. No push, merge, commit, deletion or production deployment unless explicitly authorized in this execution session.

REQUIRED SPECS:
- Documents/UI-UX-SPECIFICATION.md
- Documents/DESIGN-SYSTEM.md
- Documents/TESTING-STRATEGY.md
- Documents/ERROR-ARCHITECTURE.md
- Documents/OBSERVABILITY-ARCHITECTURE.md
- Documents/PRODUCTION-READINESS-CHECKLIST.md

FILES / PATHS IN SCOPE:
- Create: tests/e2e/accessibility.spec.ts
- Create: tests/e2e/responsive.spec.ts
- Create: tests/e2e/error-recovery.spec.ts
- Create: tests/performance/smoke.mjs
- Create: docs/verification/PERFORMANCE-BASELINE.md

MISSION:
1. Verify WCAG 2.2 AA target behaviors and responsive layouts.
2. Safe user behavior under conflicts/dependency failures.
3. Measure representative performance without invented SLOs.

NON-NEGOTIABLE REQUIREMENTS:
1. Use axe Playwright/current equivalent + manual keyboard assertions.
2. Desktop/tablet/mobile.
3. Arabic RTL/English LTR.
4. Forms/dialogs/tables/nav/chart summaries.
5. Color not sole status signal.
6. Stale overwrite blocked.
7. Safe 404/IDOR.
8. 500 requestId no stack.
9. AI degraded.
10. Outbox/notification degradation does not lie about committed truth.
11. Record env/dataset/release/measured values.
12. No pass threshold without approved SLO.
13. Investigate obvious N+1/unbounded queries.

EXECUTION ORDER INSIDE THIS PROMPT:
1. Inspect the in-scope files and current repository tree.
2. Create/modify foundational/configuration files before files that import them.
3. For behavior, write focused failing tests first.
4. Implement from lowest layer upward: Domain/Shared primitive → Repository/Infrastructure → Application Use Case → Action/API → Page/UI.
5. Never create a UI/action that points to a not-yet-existing authoritative use case.
6. Run focused verification after each coherent sub-part.
7. Run the combined verification listed below.
8. Inspect `git diff` + `git diff --check` and search for secrets, raw SQL in Delivery, Admin bypasses, arbitrary target-state handling, and invented policy/science.
9. Update Project Mind only with work actually implemented and verified.
10. STOP. Do not continue to the next MASTER prompt.

VERIFICATION:
- axe
- keyboard-only critical flow
- reduced motion
- controlled failure injection
- no secrets in response/log capture
- run controlled staging-like baseline
- record measurements not false PASS

FINAL RESPONSE:
- What was created/changed
- Exact paths
- Tests/commands actually run + results
- Security/authorization/state/concurrency evidence relevant to this prompt
- Anything BLOCKED by missing approved policy/provider/scientific data
- Suggested commit message only; do not commit unless explicitly authorized
```

---

# MASTER-035 — Release identity + full CI + developer/operator docs

**Phase:** Release  
**Merged from:** `IMP-220`, `IMP-221`, `IMP-222`

## Files in scope

- Create: scripts/release/release-id.mjs
- Create: scripts/release/verify-release.mjs
- Create: src/config/release.ts
- Create: tests/unit/release/release-id.test.ts
- Modify: .github/workflows/ci.yml
- Create: docs/development/LOCAL-DEVELOPMENT.md
- Create: docs/development/TESTING.md
- Create: docs/operations/RELEASE-RUNBOOK.md
- Create: docs/operations/INCIDENT-QUICK-REFERENCE.md

## Required specs

- `Documents/DEPLOYMENT-ARCHITECTURE.md`
- `Documents/OBSERVABILITY-ARCHITECTURE.md`
- `Documents/TESTING-STRATEGY.md`
- `Documents/PRODUCTION-READINESS-CHECKLIST.md`
- `Documents/ERROR-ARCHITECTURE.md`

## Copy-ready Codex prompt

```text
PROMPT ID: MASTER-035
TITLE: Release identity + full CI + developer/operator docs

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read all REQUIRED SPECS listed below.
4. Inspect current repository reality; never assume the previous prompt succeeded unless current files/tests prove it.
5. Inspect `.agents/skills/`; read the full matching `SKILL.md` if a relevant local skill exists.
6. Use TDD for behavior changes and verification-before-completion.
7. Preserve: Astro Page/Client → Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State Rules → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no raw SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific/policy values, approval/release authority, RPO/RTO, retention, calibration/retest rules, or other deferred decisions.
11. PASS ≠ RELEASED. No silent overwrite. Controlled history is preserved.
12. AI is advisory only.
13. No PASS/READY/100% claim without fresh evidence.
14. No push, merge, commit, deletion or production deployment unless explicitly authorized in this execution session.

REQUIRED SPECS:
- Documents/DEPLOYMENT-ARCHITECTURE.md
- Documents/OBSERVABILITY-ARCHITECTURE.md
- Documents/TESTING-STRATEGY.md
- Documents/PRODUCTION-READINESS-CHECKLIST.md
- Documents/ERROR-ARCHITECTURE.md

FILES / PATHS IN SCOPE:
- Create: scripts/release/release-id.mjs
- Create: scripts/release/verify-release.mjs
- Create: src/config/release.ts
- Create: tests/unit/release/release-id.test.ts
- Modify: .github/workflows/ci.yml
- Create: docs/development/LOCAL-DEVELOPMENT.md
- Create: docs/development/TESTING.md
- Create: docs/operations/RELEASE-RUNBOOK.md
- Create: docs/operations/INCIDENT-QUICK-REFERENCE.md

MISSION:
1. Bind release identity to exact Git SHA/build ID/migration head.
2. CI creates traceable release-candidate evidence but does not deploy.
3. Document actual implemented commands/runbooks.

NON-NEGOTIABLE REQUIREMENTS:
1. Refuse production evidence from unknown dirty state unless explicitly non-production.
2. Expose service.version safely.
3. No secrets.
4. Frozen install.
5. Architecture/lint/type/unit/integration/migration/concurrency/security/build/E2E.
6. Evidence artifacts.
7. No prod secrets/deploy.
8. No fake commands/secrets.
9. Distinguish deployment/rollback-forward-fix/recovery.
10. Incident correlation uses requestId/trace, not logs as Audit.

EXECUTION ORDER INSIDE THIS PROMPT:
1. Inspect the in-scope files and current repository tree.
2. Create/modify foundational/configuration files before files that import them.
3. For behavior, write focused failing tests first.
4. Implement from lowest layer upward: Domain/Shared primitive → Repository/Infrastructure → Application Use Case → Action/API → Page/UI.
5. Never create a UI/action that points to a not-yet-existing authoritative use case.
6. Run focused verification after each coherent sub-part.
7. Run the combined verification listed below.
8. Inspect `git diff` + `git diff --check` and search for secrets, raw SQL in Delivery, Admin bypasses, arbitrary target-state handling, and invented policy/science.
9. Update Project Mind only with work actually implemented and verified.
10. STOP. Do not continue to the next MASTER prompt.

VERIFICATION:
- deterministic metadata
- mismatch
- build service version
- workflow validation
- local command parity
- remote remains UNVERIFIED until run
- execute every safe documented local command

FINAL RESPONSE:
- What was created/changed
- Exact paths
- Tests/commands actually run + results
- Security/authorization/state/concurrency evidence relevant to this prompt
- Anything BLOCKED by missing approved policy/provider/scientific data
- Suggested commit message only; do not commit unless explicitly authorized
```

---

# MASTER-036 — Recovery verification tooling + restore-drill runbook

**Phase:** Recovery  
**Merged from:** `IMP-223`

## Files in scope

- Create: scripts/recovery/verify-recovery-manifest.ts
- Create: scripts/recovery/validate-restored-database.ts
- Create: scripts/recovery/validate-restored-files.ts
- Create: docs/operations/RESTORE-DRILL-RUNBOOK.md

## Required specs

- `Documents/BACKUP-RECOVERY-PLAN.md`
- `Documents/DATABASE-ARCHITECTURE.md`
- `Documents/PRODUCTION-READINESS-CHECKLIST.md`

## Copy-ready Codex prompt

```text
PROMPT ID: MASTER-036
TITLE: Recovery verification tooling + restore-drill runbook

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read all REQUIRED SPECS listed below.
4. Inspect current repository reality; never assume the previous prompt succeeded unless current files/tests prove it.
5. Inspect `.agents/skills/`; read the full matching `SKILL.md` if a relevant local skill exists.
6. Use TDD for behavior changes and verification-before-completion.
7. Preserve: Astro Page/Client → Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State Rules → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no raw SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific/policy values, approval/release authority, RPO/RTO, retention, calibration/retest rules, or other deferred decisions.
11. PASS ≠ RELEASED. No silent overwrite. Controlled history is preserved.
12. AI is advisory only.
13. No PASS/READY/100% claim without fresh evidence.
14. No push, merge, commit, deletion or production deployment unless explicitly authorized in this execution session.

REQUIRED SPECS:
- Documents/BACKUP-RECOVERY-PLAN.md
- Documents/DATABASE-ARCHITECTURE.md
- Documents/PRODUCTION-READINESS-CHECKLIST.md

FILES / PATHS IN SCOPE:
- Create: scripts/recovery/verify-recovery-manifest.ts
- Create: scripts/recovery/validate-restored-database.ts
- Create: scripts/recovery/validate-restored-files.ts
- Create: docs/operations/RESTORE-DRILL-RUNBOOK.md

MISSION:
1. Provider-neutral post-restore validation tooling.

NON-NEGOTIABLE REQUIREMENTS:
1. Do not fake physical backup/WAL provider implementation.
2. Validate migration ledger/core relations/history/file object/hash/app context.
3. Isolated drill default.
4. Backup Created != Restore Verified.

EXECUTION ORDER INSIDE THIS PROMPT:
1. Inspect the in-scope files and current repository tree.
2. Create/modify foundational/configuration files before files that import them.
3. For behavior, write focused failing tests first.
4. Implement from lowest layer upward: Domain/Shared primitive → Repository/Infrastructure → Application Use Case → Action/API → Page/UI.
5. Never create a UI/action that points to a not-yet-existing authoritative use case.
6. Run focused verification after each coherent sub-part.
7. Run the combined verification listed below.
8. Inspect `git diff` + `git diff --check` and search for secrets, raw SQL in Delivery, Admin bypasses, arbitrary target-state handling, and invented policy/science.
9. Update Project Mind only with work actually implemented and verified.
10. STOP. Do not continue to the next MASTER prompt.

VERIFICATION:
- disposable restored fixture validation
- provider PITR remains blocked until hosting choice

FINAL RESPONSE:
- What was created/changed
- Exact paths
- Tests/commands actually run + results
- Security/authorization/state/concurrency evidence relevant to this prompt
- Anything BLOCKED by missing approved policy/provider/scientific data
- Suggested commit message only; do not commit unless explicitly authorized
```

---

# MASTER-037 — UAT actors/scenarios/data + evidence collector

**Phase:** UAT  
**Merged from:** `IMP-230`, `IMP-231`

## Files in scope

- Create: tests/uat/README.md
- Create: tests/uat/actors.ts
- Create: tests/uat/scenarios.ts
- Create: scripts/uat/seed-uat.ts
- Create: scripts/uat/run-uat.ts
- Create: scripts/uat/collect-evidence.ts
- Create: tests/uat/acceptance.test.ts
- Create: evidence/uat/.gitkeep
- Create: evidence/uat/README.md

## Required specs

- `Documents/UAT-ACCEPTANCE-PLAN.md`
- `Documents/ROLE-MATRIX.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/PRODUCTION-READINESS-CHECKLIST.md`

## Copy-ready Codex prompt

```text
PROMPT ID: MASTER-037
TITLE: UAT actors/scenarios/data + evidence collector

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read all REQUIRED SPECS listed below.
4. Inspect current repository reality; never assume the previous prompt succeeded unless current files/tests prove it.
5. Inspect `.agents/skills/`; read the full matching `SKILL.md` if a relevant local skill exists.
6. Use TDD for behavior changes and verification-before-completion.
7. Preserve: Astro Page/Client → Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State Rules → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no raw SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific/policy values, approval/release authority, RPO/RTO, retention, calibration/retest rules, or other deferred decisions.
11. PASS ≠ RELEASED. No silent overwrite. Controlled history is preserved.
12. AI is advisory only.
13. No PASS/READY/100% claim without fresh evidence.
14. No push, merge, commit, deletion or production deployment unless explicitly authorized in this execution session.

REQUIRED SPECS:
- Documents/UAT-ACCEPTANCE-PLAN.md
- Documents/ROLE-MATRIX.md
- Documents/PERMISSION-MATRIX.md
- Documents/PRODUCTION-READINESS-CHECKLIST.md

FILES / PATHS IN SCOPE:
- Create: tests/uat/README.md
- Create: tests/uat/actors.ts
- Create: tests/uat/scenarios.ts
- Create: scripts/uat/seed-uat.ts
- Create: scripts/uat/run-uat.ts
- Create: scripts/uat/collect-evidence.ts
- Create: tests/uat/acceptance.test.ts
- Create: evidence/uat/.gitkeep
- Create: evidence/uat/README.md

MISSION:
1. Materialize release-bound UAT matrix.
2. Create UAT runner/evidence schema; never pre-fill PASS.

NON-NEGOTIABLE REQUIREMENTS:
1. Explicit grants/scopes only.
2. Role × Domain × Workflow × State × Permission × positive/negative × evidence.
3. No invented scientific data.
4. Statuses only approved vocabulary.
5. Every PASS links actual evidence.
6. Code change invalidates affected evidence.
7. No sensitive artifacts indiscriminately committed.

EXECUTION ORDER INSIDE THIS PROMPT:
1. Inspect the in-scope files and current repository tree.
2. Create/modify foundational/configuration files before files that import them.
3. For behavior, write focused failing tests first.
4. Implement from lowest layer upward: Domain/Shared primitive → Repository/Infrastructure → Application Use Case → Action/API → Page/UI.
5. Never create a UI/action that points to a not-yet-existing authoritative use case.
6. Run focused verification after each coherent sub-part.
7. Run the combined verification listed below.
8. Inspect `git diff` + `git diff --check` and search for secrets, raw SQL in Delivery, Admin bypasses, arbitrary target-state handling, and invented policy/science.
9. Update Project Mind only with work actually implemented and verified.
10. STOP. Do not continue to the next MASTER prompt.

VERIFICATION:
- seed isolated UAT DB
- unique/required scenario coverage
- run against staging when exists; otherwise release status NOT_EXECUTED

FINAL RESPONSE:
- What was created/changed
- Exact paths
- Tests/commands actually run + results
- Security/authorization/state/concurrency evidence relevant to this prompt
- Anything BLOCKED by missing approved policy/provider/scientific data
- Suggested commit message only; do not commit unless explicitly authorized
```

---

# MASTER-038 — Production readiness checker + release evidence record

**Phase:** Readiness  
**Merged from:** `IMP-232`, `IMP-233`

## Files in scope

- Create: scripts/readiness/check-production-readiness.ts
- Create: evidence/readiness/.gitkeep
- Create: evidence/readiness/README.md
- Create: scripts/readiness/generate-release-record.ts
- Create: evidence/releases/.gitkeep
- Create: evidence/releases/README.md

## Required specs

- `Documents/PRODUCTION-READINESS-CHECKLIST.md`
- `Documents/RISK-REGISTER.md`
- `Documents/UAT-ACCEPTANCE-PLAN.md`
- `Documents/BACKUP-RECOVERY-PLAN.md`
- `Documents/DEPLOYMENT-ARCHITECTURE.md`

## Copy-ready Codex prompt

```text
PROMPT ID: MASTER-038
TITLE: Production readiness checker + release evidence record

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read all REQUIRED SPECS listed below.
4. Inspect current repository reality; never assume the previous prompt succeeded unless current files/tests prove it.
5. Inspect `.agents/skills/`; read the full matching `SKILL.md` if a relevant local skill exists.
6. Use TDD for behavior changes and verification-before-completion.
7. Preserve: Astro Page/Client → Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State Rules → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no raw SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific/policy values, approval/release authority, RPO/RTO, retention, calibration/retest rules, or other deferred decisions.
11. PASS ≠ RELEASED. No silent overwrite. Controlled history is preserved.
12. AI is advisory only.
13. No PASS/READY/100% claim without fresh evidence.
14. No push, merge, commit, deletion or production deployment unless explicitly authorized in this execution session.

REQUIRED SPECS:
- Documents/PRODUCTION-READINESS-CHECKLIST.md
- Documents/RISK-REGISTER.md
- Documents/UAT-ACCEPTANCE-PLAN.md
- Documents/BACKUP-RECOVERY-PLAN.md
- Documents/DEPLOYMENT-ARCHITECTURE.md

FILES / PATHS IN SCOPE:
- Create: scripts/readiness/check-production-readiness.ts
- Create: evidence/readiness/.gitkeep
- Create: evidence/readiness/README.md
- Create: scripts/readiness/generate-release-record.ts
- Create: evidence/releases/.gitkeep
- Create: evidence/releases/README.md

MISSION:
1. Machine-assisted Go/No-Go aggregation without percentages.
2. Generate exact release evidence record.

NON-NEGOTIABLE REQUIREMENTS:
1. Critical FAIL/UNVERIFIED => NO-GO.
2. Required UAT FAIL/NOT_EXECUTED => NO-GO.
3. Residual CRITICAL => NO-GO; VERY HIGH blocked by default.
4. Required restore evidence missing => NO-GO.
5. Artifact/Git SHA/migration mismatch => NO-GO.
6. Script cannot be final human authority.
7. Release/Git/Build/Migration/CI/UAT/security/restore/open risks/limitations/Go-NoGo fields.
8. Do not auto-fill decision authority or GO.
9. No secrets.

EXECUTION ORDER INSIDE THIS PROMPT:
1. Inspect the in-scope files and current repository tree.
2. Create/modify foundational/configuration files before files that import them.
3. For behavior, write focused failing tests first.
4. Implement from lowest layer upward: Domain/Shared primitive → Repository/Infrastructure → Application Use Case → Action/API → Page/UI.
5. Never create a UI/action that points to a not-yet-existing authoritative use case.
6. Run focused verification after each coherent sub-part.
7. Run the combined verification listed below.
8. Inspect `git diff` + `git diff --check` and search for secrets, raw SQL in Delivery, Admin bypasses, arbitrary target-state handling, and invented policy/science.
9. Update Project Mind only with work actually implemented and verified.
10. STOP. Do not continue to the next MASTER prompt.

VERIFICATION:
- unit every blocking rule
- no readiness percentage
- schema/unit
- sample TEST/UNVERIFIED record only

FINAL RESPONSE:
- What was created/changed
- Exact paths
- Tests/commands actually run + results
- Security/authorization/state/concurrency evidence relevant to this prompt
- Anything BLOCKED by missing approved policy/provider/scientific data
- Suggested commit message only; do not commit unless explicitly authorized
```

---

# MASTER-039 — Provider-aware Go-Live runbook and Render deployment gate

**Phase:** Go-Live  
**Merged from:** `IMP-234`

## Files in scope

- Create: docs/operations/GO-LIVE-RUNBOOK.md

## Required specs

- `Documents/DEPLOYMENT-ARCHITECTURE.md`
- `Documents/UAT-ACCEPTANCE-PLAN.md`
- `Documents/PRODUCTION-READINESS-CHECKLIST.md`
- `Documents/BACKUP-RECOVERY-PLAN.md`

## Copy-ready Codex prompt

```text
PROMPT ID: MASTER-039
TITLE: Provider-aware Go-Live runbook and Render deployment gate

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read all REQUIRED SPECS listed below.
4. Inspect current repository reality; never assume the previous prompt succeeded unless current files/tests prove it.
5. Inspect `.agents/skills/`; read the full matching `SKILL.md` if a relevant local skill exists.
6. Use TDD for behavior changes and verification-before-completion.
7. Preserve: Astro Page/Client → Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State Rules → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no raw SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific/policy values, approval/release authority, RPO/RTO, retention, calibration/retest rules, or other deferred decisions.
11. PASS ≠ RELEASED. No silent overwrite. Controlled history is preserved.
12. AI is advisory only.
13. No PASS/READY/100% claim without fresh evidence.
14. No push, merge, commit, deletion or production deployment unless explicitly authorized in this execution session.

REQUIRED SPECS:
- Documents/DEPLOYMENT-ARCHITECTURE.md
- Documents/UAT-ACCEPTANCE-PLAN.md
- Documents/PRODUCTION-READINESS-CHECKLIST.md
- Documents/BACKUP-RECOVERY-PLAN.md

FILES / PATHS IN SCOPE:
- Create: docs/operations/GO-LIVE-RUNBOOK.md

MISSION:
1. Write provider-aware Go-Live runbook only after provider decisions + real staging evidence.

NON-NEGOTIABLE REQUIREMENTS:
1. This prompt must use the already selected Render Web Service + qclevel.top baseline.
2. Before actual production deploy, verify exact Render service hostname, Hostinger DNS, TLS, health-check behavior, exact release Git SHA/build ID/migration head, and Go/No-Go evidence.
3. Actual production deployment still requires explicit user authorization in that execution session.
4. If provider/evidence absent, mark Go-Live BLOCKED; do not invent commands.
5. Approved release→migration→deploy→health/readiness→post-deploy→monitoring→release evidence.
6. No dirty production deployment.
7. Actual deployment requires explicit user authorization.

EXECUTION ORDER INSIDE THIS PROMPT:
1. Inspect the in-scope files and current repository tree.
2. Create/modify foundational/configuration files before files that import them.
3. For behavior, write focused failing tests first.
4. Implement from lowest layer upward: Domain/Shared primitive → Repository/Infrastructure → Application Use Case → Action/API → Page/UI.
5. Never create a UI/action that points to a not-yet-existing authoritative use case.
6. Run focused verification after each coherent sub-part.
7. Run the combined verification listed below.
8. Inspect `git diff` + `git diff --check` and search for secrets, raw SQL in Delivery, Admin bypasses, arbitrary target-state handling, and invented policy/science.
9. Update Project Mind only with work actually implemented and verified.
10. STOP. Do not continue to the next MASTER prompt.

VERIFICATION:
- dry-run non-destructive commands
- confirm exact release IDs

FINAL RESPONSE:
- What was created/changed
- Exact paths
- Tests/commands actually run + results
- Security/authorization/state/concurrency evidence relevant to this prompt
- Anything BLOCKED by missing approved policy/provider/scientific data
- Suggested commit message only; do not commit unless explicitly authorized
```

---

# MASTER-040 — Traceability closure + final Production Readiness assessment

**Phase:** Closure  
**Merged from:** `IMP-240`, `IMP-241`

## Files in scope

- Modify: Documents/REQUIREMENTS-TRACEABILITY.md
- Modify: .agents/mind/01-mind-latest.md
- Create: docs/verification/IMPLEMENTATION-EVIDENCE-INDEX.md
- No new code unless defects are found; use approved checklist and evidence outputs

## Required specs

- `Documents/REQUIREMENTS-TRACEABILITY.md`
- `Documents/TESTING-STRATEGY.md`
- `Documents/RISK-REGISTER.md`
- `Documents/PRODUCTION-READINESS-CHECKLIST.md`
- `Documents/UAT-ACCEPTANCE-PLAN.md`

## Copy-ready Codex prompt

```text
PROMPT ID: MASTER-040
TITLE: Traceability closure + final Production Readiness assessment

REPOSITORY: YEEEAE/QC-Operations-Laboratory-Management-System

BEFORE WORK:
1. Read `.agents/mind/01-mind-latest.md` completely.
2. Read root `AGENTS.md` completely.
3. Read all REQUIRED SPECS listed below.
4. Inspect current repository reality; never assume the previous prompt succeeded unless current files/tests prove it.
5. Inspect `.agents/skills/`; read the full matching `SKILL.md` if a relevant local skill exists.
6. Use TDD for behavior changes and verification-before-completion.
7. Preserve: Astro Page/Client → Action/API → Authenticated Context → Application Use Case → Authorization → Domain/State Rules → Transaction → Repository → PostgreSQL → Audit/Outbox/Notifications.
8. `src/pages/**`, `src/actions/**`, `src/middleware.ts` are Delivery only: no raw SQL/business rules.
9. Default authorization DENY. Role ≠ Permission. Admin is not universal business authority.
10. Never invent scientific/policy values, approval/release authority, RPO/RTO, retention, calibration/retest rules, or other deferred decisions.
11. PASS ≠ RELEASED. No silent overwrite. Controlled history is preserved.
12. AI is advisory only.
13. No PASS/READY/100% claim without fresh evidence.
14. No push, merge, commit, deletion or production deployment unless explicitly authorized in this execution session.

REQUIRED SPECS:
- Documents/REQUIREMENTS-TRACEABILITY.md
- Documents/TESTING-STRATEGY.md
- Documents/RISK-REGISTER.md
- Documents/PRODUCTION-READINESS-CHECKLIST.md
- Documents/UAT-ACCEPTANCE-PLAN.md

FILES / PATHS IN SCOPE:
- Modify: Documents/REQUIREMENTS-TRACEABILITY.md
- Modify: .agents/mind/01-mind-latest.md
- Create: docs/verification/IMPLEMENTATION-EVIDENCE-INDEX.md
- No new code unless defects are found; use approved checklist and evidence outputs

MISSION:
1. Close implementation traceability only from current executed evidence.
2. Perform final Go/No-Go for exact release; any fix creates a new candidate and may invalidate evidence.

NON-NEGOTIABLE REQUIREMENTS:
1. Requirement→Rule→Permission→State→Data→Implementation→Tests→E2E/UAT→Evidence→PASS/FAIL.
2. Unexecuted tests never PASS.
3. Residual risks remain unverified until proven.
4. Mind reflects actual code/runtime, not plan.
5. No unsupported 100%.
6. No percentage overrides blocker.
7. Human/policy authority owns final decision.
8. Any required critical UNVERIFIED => NO-GO.

EXECUTION ORDER INSIDE THIS PROMPT:
1. Inspect the in-scope files and current repository tree.
2. Create/modify foundational/configuration files before files that import them.
3. For behavior, write focused failing tests first.
4. Implement from lowest layer upward: Domain/Shared primitive → Repository/Infrastructure → Application Use Case → Action/API → Page/UI.
5. Never create a UI/action that points to a not-yet-existing authoritative use case.
6. Run focused verification after each coherent sub-part.
7. Run the combined verification listed below.
8. Inspect `git diff` + `git diff --check` and search for secrets, raw SQL in Delivery, Admin bypasses, arbitrary target-state handling, and invented policy/science.
9. Update Project Mind only with work actually implemented and verified.
10. STOP. Do not continue to the next MASTER prompt.

VERIFICATION:
- full lint/type/unit/integration/E2E/build
- fresh+upgrade migrations
- architecture check
- evidence consistency
- record release/evidence refs
- if GO not proven report NO-GO blockers

FINAL RESPONSE:
- What was created/changed
- Exact paths
- Tests/commands actually run + results
- Security/authorization/state/concurrency evidence relevant to this prompt
- Anything BLOCKED by missing approved policy/provider/scientific data
- Suggested commit message only; do not commit unless explicitly authorized
```

---

# 4. No-Skip Checklist

- [ ] `MASTER-001` — Root project + package.json + Render baseline
- [ ] `MASTER-002` — Foundation normalization + architecture folders + canonical routes
- [ ] `MASTER-003` — Testing harness + CI baseline
- [ ] `MASTER-004` — Runtime config + IDs/time + errors + validation
- [ ] `MASTER-005` — PostgreSQL runtime + migration engine + core qc schema + migration verification
- [ ] `MASTER-006` — Identity/AuthZ/Audit/Outbox/Files shared schemas
- [ ] `MASTER-007` — Tasks + Quality + Quarantine + Laboratory schemas
- [ ] `MASTER-008` — Assets + Documents + Approvals + Change Requests + Backup metadata + seeds
- [ ] `MASTER-009` — Concurrency + central authorization + SoD + Audit + Outbox
- [ ] `MASTER-010` — Notifications + Files/Evidence + Object Storage + Search
- [ ] `MASTER-011` — Logging + OpenTelemetry + health + security HTTP helpers + i18n
- [ ] `MASTER-012` — Identity domain + repositories + password/session + login/logout
- [ ] `MASTER-013` — Account/admin-user use cases + Actions + login/account pages + middleware
- [ ] `MASTER-014` — Roles/permissions/scopes repository + use cases + Actions
- [ ] `MASTER-015` — Design tokens + layouts + primitives + forms
- [ ] `MASTER-016` — Tables + shell/navigation + dialogs/stale UX + E-Sign + charts + root/error pages
- [ ] `MASTER-017` — Dashboard + Search + Notifications + Audit UI
- [ ] `MASTER-018` — Report registry + CSV/XLSX export + report pages
- [ ] `MASTER-019` — Tasks end-to-end implementation
- [ ] `MASTER-020` — Quality: Finding + NCR + RCA + CAPA
- [ ] `MASTER-021` — Quarantine: Receiving + Inspection execution
- [ ] `MASTER-022` — Quarantine: Review + Release + dashboards/pages + E2E
- [ ] `MASTER-023` — Laboratory complete implementation
- [ ] `MASTER-024` — Assets: Equipment + Calibration + Maintenance
- [ ] `MASTER-025` — Controlled Documents complete implementation
- [ ] `MASTER-026` — Approvals + E-Signatures
- [ ] `MASTER-027` — Change Requests
- [ ] `MASTER-028` — Admin users + roles + permissions + scopes pages
- [ ] `MASTER-029` — System Health + Backup/Restore catalog/orchestration/UI
- [ ] `MASTER-030` — AI Advisory boundary + UI + security tests
- [ ] `MASTER-031` — Production security + rate limiting + observability wiring
- [ ] `MASTER-032` — Concurrency/idempotency stress + full authorization/IDOR matrix
- [ ] `MASTER-033` — Critical workflow E2E + files/reports security
- [ ] `MASTER-034` — Accessibility + failure UX + performance baseline
- [ ] `MASTER-035` — Release identity + full CI + developer/operator docs
- [ ] `MASTER-036` — Recovery verification tooling + restore-drill runbook
- [ ] `MASTER-037` — UAT actors/scenarios/data + evidence collector
- [ ] `MASTER-038` — Production readiness checker + release evidence record
- [ ] `MASTER-039` — Provider-aware Go-Live runbook and Render deployment gate
- [ ] `MASTER-040` — Traceability closure + final Production Readiness assessment

---

# 5. Coverage / Merge Verification

- Original tasks covered: **151/151**.
- New merged prompts: **40**.
- Every original Task ID appears in exactly one merged prompt.
- `render.yaml`, `package.json`, Node/pnpm/Astro/TypeScript/environment setup are deliberately in `MASTER-001`.
- Canonical paths/routing architecture is deliberately in `MASTER-002`, while functional `.astro` pages are created later with the Domain that owns their behavior.
- Testing/CI is `MASTER-003`, before database/business implementation.
- Deferred provider/scientific/policy decisions remain gated and are never silently invented.

# 6. Recommended execution cadence

نفّذ برومبت واحد في كل مرة. بعد ما ينجح ويكون عنده evidence فعلية، انتقل للي بعده. إذا ظهر قرار Policy/Scientific/Provider غير محسوم، Codex يوقف ويبلّغك بدل ما يخترع قرار.
