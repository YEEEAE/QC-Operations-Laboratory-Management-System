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

# 1. خريطة الدمج الجديدة

- **MASTER-001 — Root project + package.json + Render baseline** ← يدمج: `IMP-001`, `IMP-002`, `IMP-003`, `IMP-004`, `IMP-225`
- **MASTER-002 — Foundation normalization + architecture folders + canonical routes** ← يدمج: `IMP-000`, `IMP-007`, `IMP-224`
- **MASTER-003 — Testing harness + CI baseline** ← يدمج: `IMP-005`, `IMP-006`
- **MASTER-004 — Runtime config + IDs/time + errors + validation** ← يدمج: `IMP-010`, `IMP-011`, `IMP-012`, `IMP-040`, `IMP-042`
- **MASTER-005 — PostgreSQL runtime + migration engine + core qc schema + migration verification** ← يدمج: `IMP-013`, `IMP-014`, `IMP-015`, `IMP-030`
- **MASTER-006 — Identity/AuthZ/Audit/Outbox/Files shared schemas** ← يدمج: `IMP-016`, `IMP-017`, `IMP-018`, `IMP-019`
- **MASTER-007 — Tasks + Quality + Quarantine + Laboratory schemas** ← يدمج: `IMP-020`, `IMP-021`, `IMP-022`, `IMP-023`
- **MASTER-008 — Assets + Documents + Approvals + Change Requests + Backup metadata + seeds** ← يدمج: `IMP-024`, `IMP-025`, `IMP-026`, `IMP-027`, `IMP-028`, `IMP-029`
- **MASTER-009 — Concurrency + central authorization + SoD + Audit + Outbox** ← يدمج: `IMP-041`, `IMP-043`, `IMP-044`, `IMP-045`, `IMP-046`
- **MASTER-010 — Notifications + Files/Evidence + Object Storage + Search** ← يدمج: `IMP-047`, `IMP-048`, `IMP-049`, `IMP-092`
- **MASTER-011 — Logging + OpenTelemetry + health + security HTTP helpers + i18n** ← يدمج: `IMP-050`, `IMP-051`, `IMP-052`, `IMP-053`, `IMP-054`
- **MASTER-012 — Identity domain + repositories + password/session + login/logout** ← يدمج: `IMP-060`, `IMP-061`, `IMP-062`, `IMP-063`
- **MASTER-013 — Account/admin-user use cases + Actions + login/account pages + middleware** ← يدمج: `IMP-064`, `IMP-065`, `IMP-066`, `IMP-067`, `IMP-068`
- **MASTER-014 — Roles/permissions/scopes repository + use cases + Actions** ← يدمج: `IMP-070`, `IMP-071`, `IMP-072`
- **MASTER-015 — Design tokens + layouts + primitives + forms** ← يدمج: `IMP-080`, `IMP-081`, `IMP-082`, `IMP-083`
- **MASTER-016 — Tables + shell/navigation + dialogs/stale UX + E-Sign + charts + root/error pages** ← يدمج: `IMP-084`, `IMP-085`, `IMP-086`, `IMP-087`, `IMP-088`, `IMP-089`
- **MASTER-017 — Dashboard + Search + Notifications + Audit UI** ← يدمج: `IMP-090`, `IMP-091`, `IMP-093`, `IMP-094`
- **MASTER-018 — Report registry + CSV/XLSX export + report pages** ← يدمج: `IMP-095`, `IMP-096`, `IMP-097`
- **MASTER-019 — Tasks end-to-end implementation** ← يدمج: `IMP-100`, `IMP-101`, `IMP-102`, `IMP-103`, `IMP-104`
- **MASTER-020 — Quality: Finding + NCR + RCA + CAPA** ← يدمج: `IMP-110`, `IMP-111`, `IMP-112`, `IMP-113`, `IMP-114`, `IMP-115`, `IMP-116`
- **MASTER-021 — Quarantine: Receiving + Inspection execution** ← يدمج: `IMP-120`, `IMP-121`, `IMP-122`, `IMP-123`
- **MASTER-022 — Quarantine: Review + Release + dashboards/pages + E2E** ← يدمج: `IMP-124`, `IMP-125`, `IMP-126`, `IMP-127`, `IMP-128`
- **MASTER-023 — Laboratory complete implementation** ← يدمج: `IMP-130`, `IMP-131`, `IMP-132`, `IMP-133`, `IMP-134`, `IMP-135`
- **MASTER-024 — Assets: Equipment + Calibration + Maintenance** ← يدمج: `IMP-140`, `IMP-141`, `IMP-142`, `IMP-143`, `IMP-144`, `IMP-145`
- **MASTER-025 — Controlled Documents complete implementation** ← يدمج: `IMP-150`, `IMP-151`, `IMP-152`, `IMP-153`, `IMP-154`
- **MASTER-026 — Approvals + E-Signatures** ← يدمج: `IMP-160`, `IMP-161`, `IMP-162`, `IMP-163`
- **MASTER-027 — Change Requests** ← يدمج: `IMP-164`, `IMP-165`, `IMP-166`
- **MASTER-028 — Admin users + roles + permissions + scopes pages** ← يدمج: `IMP-170`, `IMP-171`
- **MASTER-029 — System Health + Backup/Restore catalog/orchestration/UI** ← يدمج: `IMP-180`, `IMP-181`, `IMP-182`, `IMP-183`
- **MASTER-030 — AI Advisory boundary + UI + security tests** ← يدمج: `IMP-190`, `IMP-191`, `IMP-192`
- **MASTER-031 — Production security + rate limiting + observability wiring** ← يدمج: `IMP-200`, `IMP-201`, `IMP-202`
- **MASTER-032 — Concurrency/idempotency stress + full authorization/IDOR matrix** ← يدمج: `IMP-203`, `IMP-210`
- **MASTER-033 — Critical workflow E2E + files/reports security** ← يدمج: `IMP-211`, `IMP-212`
- **MASTER-034 — Accessibility + failure UX + performance baseline** ← يدمج: `IMP-213`, `IMP-214`, `IMP-215`
- **MASTER-035 — Release identity + full CI + developer/operator docs** ← يدمج: `IMP-220`, `IMP-221`, `IMP-222`
- **MASTER-036 — Recovery verification tooling + restore-drill runbook** ← يدمج: `IMP-223`
- **MASTER-037 — UAT actors/scenarios/data + evidence collector** ← يدمج: `IMP-230`, `IMP-231`
- **MASTER-038 — Production readiness checker + release evidence record** ← يدمج: `IMP-232`, `IMP-233`
- **MASTER-039 — Provider-aware Go-Live runbook and Render deployment gate** ← يدمج: `IMP-234`
- **MASTER-040 — Traceability closure + final Production Readiness assessment** ← يدمج: `IMP-240`, `IMP-241`

---

# 2. أول 10 برومبتز — الترتيب المقصود

1. MASTER-001 — ملفات الجذر الأساسية: Git hygiene + Node/pnpm + `package.json` + lockfile + Astro/TS/env + **`render.yaml`**.
2. MASTER-002 — اعتماد الـFoundation metadata + هيكل `src/` + architecture folders + canonical TypeScript routes/path registry.
3. MASTER-003 — Vitest + Playwright + PostgreSQL 18 Testcontainers + GitHub CI.
4. MASTER-004 — runtime config + IDs + UTC/Riyadh + AppError + validation + request context/middleware base.
5. MASTER-005 — PostgreSQL/Kysely + migration runner + `qc` schema + migration verification.
6. MASTER-006 — Identity/AuthZ/Audit/Outbox/Files shared DB schemas.
7. MASTER-007 — Tasks/Quality/Quarantine/Laboratory DB schemas.
8. MASTER-008 — Assets/Documents/Approvals/Change Requests/Backup metadata + seeds.
9. MASTER-009 — concurrency/idempotency + Authorization/SoD + Audit + Outbox runtime.
10. MASTER-010 — Notifications + Files/Evidence + Object Storage + Authorized Search.

---

# 3. القواعد الثابتة لكل برومبت

```text
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
```

---

# MASTER-001 — Root project + package.json + Render baseline

**Phase:** Bootstrap  
**Merged from:** `IMP-001`, `IMP-002`, `IMP-003`, `IMP-004`, `IMP-225`

## Files in scope

- Create: .gitignore
- Create: .gitattributes
- Create: .editorconfig
- Create: .prettierignore
- Remove only when separately authorized: tracked .DS_Store files
- Create: package.json
- Generate: pnpm-lock.yaml
- Create: .node-version
- Create: .npmrc
- Create: astro.config.mjs
- Create: tsconfig.json
- Create: src/env.d.ts
- Create: .env.example
- Create: eslint.config.mjs
- Create: .prettierrc.json
- Create: render.yaml
- Modify: .env.example
- Modify: docs/operations/RENDER-DEPLOYMENT.md

## Required specs

- `AGENTS.md`
- `Documents/DEPLOYMENT-ARCHITECTURE.md`
- `Documents/ARCHITECTURE-SPECIFICATION.md`
- `Documents/TESTING-STRATEGY.md`
- `Documents/OBSERVABILITY-ARCHITECTURE.md`
- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/PRODUCTION-READINESS-CHECKLIST.md`

## Copy-ready Codex prompt



---

# MASTER-012 — Identity domain + repositories + password/session + login/logout

**Phase:** Identity & Auth  
**Merged from:** `IMP-060`, `IMP-061`, `IMP-062`, `IMP-063`

## Files in scope

- Create: src/modules/identity/domain/user.ts
- Create: src/modules/identity/domain/account-state.ts
- Create: src/modules/identity/domain/session.ts
- Create: src/modules/identity/ports/user-repository.ts
- Create: src/modules/identity/ports/session-repository.ts
- Create: tests/unit/identity/user.test.ts
- Create: src/modules/identity/infrastructure/postgres-user-repository.ts
- Create: src/modules/identity/infrastructure/postgres-session-repository.ts
- Create: tests/integration/identity/repositories.test.ts
- Create: src/modules/identity/security/password-hasher.ts
- Create: src/modules/identity/security/argon2-password-hasher.ts
- Create: src/modules/identity/application/session-service.ts
- Create: tests/unit/identity/password-hasher.test.ts
- Create: tests/integration/identity/session-service.test.ts
- Create: src/modules/identity/application/login.ts
- Create: src/modules/identity/application/logout.ts
- Create: src/modules/identity/application/resolve-session.ts
- Create: tests/integration/identity/auth-use-cases.test.ts

## Required specs

- `Documents/DOMAIN-MAP.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/DATABASE-ARCHITECTURE.md`
- `Documents/ERROR-ARCHITECTURE.md`

## Copy-ready Codex prompt

```text
PROMPT ID: MASTER-012
TITLE: Identity domain + repositories + password/session + login/logout

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
- Documents/BUSINESS-RULES.md
- Documents/DATA-DICTIONARY.md
- Documents/SECURITY-ARCHITECTURE.md
- Documents/DATABASE-ARCHITECTURE.md
- Documents/ERROR-ARCHITECTURE.md

FILES / PATHS IN SCOPE:
- Create: src/modules/identity/domain/user.ts
- Create: src/modules/identity/domain/account-state.ts
- Create: src/modules/identity/domain/session.ts
- Create: src/modules/identity/ports/user-repository.ts
- Create: src/modules/identity/ports/session-repository.ts
- Create: tests/unit/identity/user.test.ts
- Create: src/modules/identity/infrastructure/postgres-user-repository.ts
- Create: src/modules/identity/infrastructure/postgres-session-repository.ts
- Create: tests/integration/identity/repositories.test.ts
- Create: src/modules/identity/security/password-hasher.ts
- Create: src/modules/identity/security/argon2-password-hasher.ts
- Create: src/modules/identity/application/session-service.ts
- Create: tests/unit/identity/password-hasher.test.ts
- Create: tests/integration/identity/session-service.test.ts
- Create: src/modules/identity/application/login.ts
- Create: src/modules/identity/application/logout.ts
- Create: src/modules/identity/application/resolve-session.ts
- Create: tests/integration/identity/auth-use-cases.test.ts

MISSION:
1. Identity domain types/invariants with no persistence details.
2. Implement identity persistence behind ports.
3. Password verification and opaque server-side sessions.
4. Implement authentication use cases.

NON-NEGOTIABLE REQUIREMENTS:
1. Active authenticated actor required for controlled actions.
2. Shared accounts not allowed for controlled actions.
3. Disabled users cannot create new sessions.
4. No role hierarchy inside User.
5. Kysely/qc schema only.
6. Opaque sessions stored/compared securely.
7. Disable/session invalidation atomic where required.
8. Use Argon2id if consistent with Security Architecture/current guidance; record technical parameters, not invented business policy.
9. HttpOnly/Secure-in-production/SameSite cookie semantics.
10. Never store/log plaintext password.
11. Admin password reset invalidates sessions as approved.
12. Actor derived server-side from session.
13. Login failure does not leak user existence where required.
14. Logout revokes session and is idempotent.
15. Disabled/expired/revoked rejected.

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
- domain invariants
- no infra imports
- real PG repository tests
- disabled-account behavior
- hash/verify/wrong password
- rotation/revocation
- cookie attrs
- success/wrong password/unknown/disabled/revoked/repeated logout

FINAL RESPONSE:
- What was created/changed
- Exact paths
- Tests/commands actually run + results
- Security/authorization/state/concurrency evidence relevant to this prompt
- Anything BLOCKED by missing approved policy/provider/scientific data
- Suggested commit message only; do not commit unless explicitly authorized
```

---

# MASTER-013 — Account/admin-user use cases + Actions + login/account pages + middleware

**Phase:** Identity & Auth  
**Merged from:** `IMP-064`, `IMP-065`, `IMP-066`, `IMP-067`, `IMP-068`

## Files in scope

- Create: src/modules/identity/application/get-account.ts
- Create: src/modules/identity/application/change-password.ts
- Create: tests/integration/identity/account.test.ts
- Create: src/modules/identity/application/create-user.ts
- Create: src/modules/identity/application/update-user.ts
- Create: src/modules/identity/application/disable-user.ts
- Create: src/modules/identity/application/admin-reset-password.ts
- Create: tests/integration/identity/admin-user-lifecycle.test.ts
- Create: src/actions/index.ts
- Create: src/actions/auth.ts
- Create: src/actions/account.ts
- Create: tests/integration/actions/auth-actions.test.ts
- Create: src/pages/login.astro
- Create: src/pages/account.astro
- Modify: src/middleware.ts
- Create: tests/integration/http/auth-middleware.test.ts

## Required specs

- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/ERROR-ARCHITECTURE.md`
- `Documents/DESIGN-SYSTEM.md`

## Copy-ready Codex prompt

```text
PROMPT ID: MASTER-013
TITLE: Account/admin-user use cases + Actions + login/account pages + middleware

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
- Documents/UI-UX-SPECIFICATION.md
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/PERMISSION-MATRIX.md
- Documents/BUSINESS-RULES.md
- Documents/ERROR-ARCHITECTURE.md
- Documents/DESIGN-SYSTEM.md

FILES / PATHS IN SCOPE:
- Create: src/modules/identity/application/get-account.ts
- Create: src/modules/identity/application/change-password.ts
- Create: tests/integration/identity/account.test.ts
- Create: src/modules/identity/application/create-user.ts
- Create: src/modules/identity/application/update-user.ts
- Create: src/modules/identity/application/disable-user.ts
- Create: src/modules/identity/application/admin-reset-password.ts
- Create: tests/integration/identity/admin-user-lifecycle.test.ts
- Create: src/actions/index.ts
- Create: src/actions/auth.ts
- Create: src/actions/account.ts
- Create: tests/integration/actions/auth-actions.test.ts
- Create: src/pages/login.astro
- Create: src/pages/account.astro
- Modify: src/middleware.ts
- Create: tests/integration/http/auth-middleware.test.ts

MISSION:
1. Authenticated account read/change-password; keep password recovery deferred.
2. User administration behind explicit authorization.
3. Thin Actions for login/logout/account mutations.
4. Server-rendered login/account pages.
5. Resolve opaque sessions into Astro.locals while preserving per-use-case authorization.

NON-NEGOTIABLE REQUIREMENTS:
1. Reauthentication/current-password semantics from Security Architecture.
2. No `/auth/recovery` or reset implementation while deferred.
3. Session invalidation per policy.
4. No public signup.
5. Every command authorizes actor server-side.
6. Admin role alone insufficient.
7. Disable/reset audit + session invalidation as required.
8. No repository/Kysely imports.
9. Logout Action only, no GET logout.
10. Validate safe returnTo.
11. Map AppError safely.
12. Authenticated /login → /dashboard.
13. Account class AUTHENTICATED.
14. Accessible labels/errors/focus.
15. No recovery/reset pages.
16. Protect operational routes unauthenticated.
17. Public /login accessible.
18. No domain permission logic in middleware.

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
- password change
- session behavior
- prove no deferred recovery files
- no permission/wrong scope/allowed/audit atomicity
- direct Action
- origin/CSRF
- raw-error absence
- Playwright login success/failure
- account unauth redirect
- protected redirect
- revoked session
- no authz bypass

FINAL RESPONSE:
- What was created/changed
- Exact paths
- Tests/commands actually run + results
- Security/authorization/state/concurrency evidence relevant to this prompt
- Anything BLOCKED by missing approved policy/provider/scientific data
- Suggested commit message only; do not commit unless explicitly authorized
```

---

# MASTER-014 — Roles/permissions/scopes repository + use cases + Actions

**Phase:** Authorization Admin  
**Merged from:** `IMP-070`, `IMP-071`, `IMP-072`

## Files in scope

- Create: src/modules/administration/ports/authorization-repository.ts
- Create: src/modules/administration/infrastructure/postgres-authorization-repository.ts
- Create: tests/integration/administration/authorization-repository.test.ts
- Create: src/modules/administration/application/list-roles.ts
- Create: src/modules/administration/application/get-role.ts
- Create: src/modules/administration/application/update-role-permissions.ts
- Create: src/modules/administration/application/list-permissions.ts
- Create: src/modules/administration/application/manage-user-scopes.ts
- Create: tests/integration/administration/authorization-use-cases.test.ts
- Create: src/actions/admin.ts
- Modify: src/actions/index.ts
- Create: tests/integration/actions/admin-actions.test.ts

## Required specs

- `Documents/PERMISSION-MATRIX.md`
- `Documents/ROLE-MATRIX.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/RISK-REGISTER.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/ERROR-ARCHITECTURE.md`

## Copy-ready Codex prompt

```text
PROMPT ID: MASTER-014
TITLE: Roles/permissions/scopes repository + use cases + Actions

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
- Documents/PERMISSION-MATRIX.md
- Documents/ROLE-MATRIX.md
- Documents/DATA-DICTIONARY.md
- Documents/RISK-REGISTER.md
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/ERROR-ARCHITECTURE.md

FILES / PATHS IN SCOPE:
- Create: src/modules/administration/ports/authorization-repository.ts
- Create: src/modules/administration/infrastructure/postgres-authorization-repository.ts
- Create: tests/integration/administration/authorization-repository.test.ts
- Create: src/modules/administration/application/list-roles.ts
- Create: src/modules/administration/application/get-role.ts
- Create: src/modules/administration/application/update-role-permissions.ts
- Create: src/modules/administration/application/list-permissions.ts
- Create: src/modules/administration/application/manage-user-scopes.ts
- Create: tests/integration/administration/authorization-use-cases.test.ts
- Create: src/actions/admin.ts
- Modify: src/actions/index.ts
- Create: tests/integration/actions/admin-actions.test.ts

MISSION:
1. Role/permission/scope/grant persistence.
2. High-risk permission/scope administration.
3. Thin Delivery Actions for users/roles/permissions/scopes.

NON-NEGOTIABLE REQUIREMENTS:
1. No hierarchy.
2. Explicit permission/scope only.
3. No Admin implied privileges.
4. Explicit admin permission codes only.
5. Do not create new Foundation roles.
6. No self-grant bypass unless approved.
7. Audit before/after meaning.
8. Reauthorize each mutation.
9. No actor/decision from client.
10. Optimistic version where present.

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
- repository operations supported by model
- cross-scope isolation
- Admin-without-permission denied
- authorized change
- audit atomicity
- direct Action denial
- stale conflict
- no GET mutation

FINAL RESPONSE:
- What was created/changed
- Exact paths
- Tests/commands actually run + results
- Security/authorization/state/concurrency evidence relevant to this prompt
- Anything BLOCKED by missing approved policy/provider/scientific data
- Suggested commit message only; do not commit unless explicitly authorized
```

---

# MASTER-015 — Design tokens + layouts + primitives + forms

**Phase:** UI Foundation  
**Merged from:** `IMP-080`, `IMP-081`, `IMP-082`, `IMP-083`

## Files in scope

- Create: src/ui/styles/tokens.css
- Create: src/ui/styles/global.css
- Create: src/ui/styles/motion.css
- Create: src/ui/styles/density.css
- Create: src/ui/layouts/BaseLayout.astro
- Create: src/ui/layouts/AuthLayout.astro
- Create: src/ui/layouts/AppLayout.astro
- Create: src/ui/components/Button.astro
- Create: src/ui/components/IconButton.astro
- Create: src/ui/components/Badge.astro
- Create: src/ui/components/Card.astro
- Create: src/ui/components/Divider.astro
- Create: src/ui/components/Tooltip.astro
- Create: src/ui/components/StatusBadge.astro
- Create: src/ui/components/StateBanner.astro
- Create: src/ui/components/forms/FormField.astro
- Create: src/ui/components/forms/TextInput.astro
- Create: src/ui/components/forms/TextArea.astro
- Create: src/ui/components/forms/Select.astro
- Create: src/ui/components/forms/Checkbox.astro
- Create: src/ui/components/forms/DateInput.astro
- Create: src/ui/components/forms/NumberInput.astro
- Create: src/ui/components/forms/ErrorSummary.astro
- Create: src/ui/components/forms/FormActions.astro

## Required specs

- `Documents/DESIGN-SYSTEM.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/ERROR-ARCHITECTURE.md`

## Copy-ready Codex prompt

```text
PROMPT ID: MASTER-015
TITLE: Design tokens + layouts + primitives + forms

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
- Documents/DESIGN-SYSTEM.md
- Documents/UI-UX-SPECIFICATION.md
- Documents/SECURITY-ARCHITECTURE.md
- Documents/ERROR-ARCHITECTURE.md

FILES / PATHS IN SCOPE:
- Create: src/ui/styles/tokens.css
- Create: src/ui/styles/global.css
- Create: src/ui/styles/motion.css
- Create: src/ui/styles/density.css
- Create: src/ui/layouts/BaseLayout.astro
- Create: src/ui/layouts/AuthLayout.astro
- Create: src/ui/layouts/AppLayout.astro
- Create: src/ui/components/Button.astro
- Create: src/ui/components/IconButton.astro
- Create: src/ui/components/Badge.astro
- Create: src/ui/components/Card.astro
- Create: src/ui/components/Divider.astro
- Create: src/ui/components/Tooltip.astro
- Create: src/ui/components/StatusBadge.astro
- Create: src/ui/components/StateBanner.astro
- Create: src/ui/components/forms/FormField.astro
- Create: src/ui/components/forms/TextInput.astro
- Create: src/ui/components/forms/TextArea.astro
- Create: src/ui/components/forms/Select.astro
- Create: src/ui/components/forms/Checkbox.astro
- Create: src/ui/components/forms/DateInput.astro
- Create: src/ui/components/forms/NumberInput.astro
- Create: src/ui/components/forms/ErrorSummary.astro
- Create: src/ui/components/forms/FormActions.astro

MISSION:
1. Implement approved dark-only design tokens/typography.
2. Base/Auth/App layouts only; no DB/business logic.
3. Accessible reusable visual components.
4. Accessible long-form QC inputs.

NON-NEGOTIABLE REQUIREMENTS:
1. Copy exact approved tokens.
2. Inter Latin + IBM Plex Sans Arabic using verified privacy-safe build strategy.
3. Reduced motion.
4. PASS token distinct from RELEASED; color not sole status signal.
5. lang/dir from i18n.
6. AppLayout composes shell slots.
7. No secret/debug HTML.
8. Status always explicit text.
9. PASS/RELEASED separate tokens.
10. Permission decisions passed in; components never authorize.
11. Keyboard/focus-visible.
12. Explicit labels/error association.
13. No placeholder-only label.
14. Number input does not invent precision/rounding.
15. Controlled action distinct from save draft.

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
- compare tokens to spec
- CSS build
- Astro build/typecheck
- accessible names/focus
- token usage
- keyboard form
- error association
- RTL

FINAL RESPONSE:
- What was created/changed
- Exact paths
- Tests/commands actually run + results
- Security/authorization/state/concurrency evidence relevant to this prompt
- Anything BLOCKED by missing approved policy/provider/scientific data
- Suggested commit message only; do not commit unless explicitly authorized
```

---

# MASTER-016 — Tables + shell/navigation + dialogs/stale UX + E-Sign + charts + root/error pages

**Phase:** UI Foundation  
**Merged from:** `IMP-084`, `IMP-085`, `IMP-086`, `IMP-087`, `IMP-088`, `IMP-089`

## Files in scope

- Create: src/ui/components/data/DataTable.astro
- Create: src/ui/components/data/TableToolbar.astro
- Create: src/ui/components/data/FilterBar.astro
- Create: src/ui/components/data/Pagination.astro
- Create: src/ui/components/data/SortHeader.astro
- Create: src/ui/components/data/EmptyTableState.astro
- Create: src/ui/shell/Sidebar.astro
- Create: src/ui/shell/Topbar.astro
- Create: src/ui/shell/Breadcrumbs.astro
- Create: src/ui/shell/ScopeIndicator.astro
- Create: src/ui/shell/UserMenu.astro
- Create: src/ui/navigation/navigation.ts
- Create: src/ui/components/feedback/EmptyState.astro
- Create: src/ui/components/feedback/ErrorState.astro
- Create: src/ui/components/feedback/LoadingState.astro
- Create: src/ui/components/feedback/StaleVersionState.astro
- Create: src/ui/components/feedback/ConfirmDialog.astro
- Create: src/ui/components/feedback/ToastRegion.astro
- Create: src/ui/client/dialog.ts
- Create: src/ui/client/toast.ts
- Create: src/ui/components/governance/ESignatureDialog.astro
- Create: src/ui/client/e-signature.ts
- Create: src/ui/charts/Chart.astro
- Create: src/ui/charts/chart-client.ts
- Create: src/ui/charts/KpiCard.astro
- Create: src/ui/charts/Legend.astro
- Create: src/pages/index.astro
- Create: src/pages/404.astro
- Create: src/pages/500.astro
- Modify: src/ui/layouts/AppLayout.astro

## Required specs

- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/DESIGN-SYSTEM.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/ERROR-ARCHITECTURE.md`
- `Documents/SECURITY-ARCHITECTURE.md`

## Copy-ready Codex prompt

```text
PROMPT ID: MASTER-016
TITLE: Tables + shell/navigation + dialogs/stale UX + E-Sign + charts + root/error pages

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
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/PERMISSION-MATRIX.md
- Documents/ERROR-ARCHITECTURE.md
- Documents/SECURITY-ARCHITECTURE.md

FILES / PATHS IN SCOPE:
- Create: src/ui/components/data/DataTable.astro
- Create: src/ui/components/data/TableToolbar.astro
- Create: src/ui/components/data/FilterBar.astro
- Create: src/ui/components/data/Pagination.astro
- Create: src/ui/components/data/SortHeader.astro
- Create: src/ui/components/data/EmptyTableState.astro
- Create: src/ui/shell/Sidebar.astro
- Create: src/ui/shell/Topbar.astro
- Create: src/ui/shell/Breadcrumbs.astro
- Create: src/ui/shell/ScopeIndicator.astro
- Create: src/ui/shell/UserMenu.astro
- Create: src/ui/navigation/navigation.ts
- Create: src/ui/components/feedback/EmptyState.astro
- Create: src/ui/components/feedback/ErrorState.astro
- Create: src/ui/components/feedback/LoadingState.astro
- Create: src/ui/components/feedback/StaleVersionState.astro
- Create: src/ui/components/feedback/ConfirmDialog.astro
- Create: src/ui/components/feedback/ToastRegion.astro
- Create: src/ui/client/dialog.ts
- Create: src/ui/client/toast.ts
- Create: src/ui/components/governance/ESignatureDialog.astro
- Create: src/ui/client/e-signature.ts
- Create: src/ui/charts/Chart.astro
- Create: src/ui/charts/chart-client.ts
- Create: src/ui/charts/KpiCard.astro
- Create: src/ui/charts/Legend.astro
- Create: src/pages/index.astro
- Create: src/pages/404.astro
- Create: src/pages/500.astro
- Modify: src/ui/layouts/AppLayout.astro

MISSION:
1. Data-dense server-driven list UI.
2. Universal shell navigation from authorized capabilities.
3. Consistent feedback and explicit controlled-action confirmation.
4. Reusable E-Signature ceremony UI only.
5. Dashboard charts with a pinned verified library; ECharts preferred.
6. Root redirects and safe error pages.

NON-NEGOTIABLE REQUIREMENTS:
1. Server pagination/filter/sort.
2. URL query only for display filters, never authoritative mutation/permission.
3. Responsive without hiding critical state.
4. Accessible table semantics.
5. Groups match approved IA.
6. Visibility permission/scope-aware but not authorization.
7. Collapsed sidebar accessible.
8. Topbar search/scope/notifications/approvals/user context.
9. Stale version blocks overwrite.
10. Accessible dialog focus/restore/Escape.
11. Reason/intent where required.
12. Toast is never controlled evidence.
13. Show meaning/subject/version/context.
14. No independent sign route.
15. Reauth secret server-only and not persisted.
16. Server decides authz/state/version/SoD.
17. Authorized aggregated data only.
18. Accessible text/table summary.
19. Approved tokens/semantic colors.
20. Reduced motion.
21. / unauth→/login; auth→/dashboard.
22. 404 safe for IDOR.
23. 500 requestId, no stack/SQL.
24. Wire sidebar/topbar.

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
- keyboard/sort
- query serialization
- role/capability rendering
- keyboard order
- dialog keyboard
- stale blocking
- live region
- focus
- secret not persisted
- server denial rendering
- render/accessibility
- no DB import
- root redirects
- safe 404/500
- pnpm build

FINAL RESPONSE:
- What was created/changed
- Exact paths
- Tests/commands actually run + results
- Security/authorization/state/concurrency evidence relevant to this prompt
- Anything BLOCKED by missing approved policy/provider/scientific data
- Suggested commit message only; do not commit unless explicitly authorized
```

---

# MASTER-017 — Dashboard + Search + Notifications + Audit UI

**Phase:** Shared UX  
**Merged from:** `IMP-090`, `IMP-091`, `IMP-093`, `IMP-094`

## Files in scope

- Create: src/modules/dashboard/application/get-dashboard.ts
- Create: src/modules/dashboard/ports/dashboard-query.ts
- Create: src/modules/dashboard/infrastructure/postgres-dashboard-query.ts
- Create: tests/integration/dashboard/dashboard-query.test.ts
- Create: src/pages/dashboard/index.astro
- Create: src/pages/search.astro
- Create: src/pages/notifications.astro
- Modify: src/ui/shell/Topbar.astro
- Create: src/shared/audit/audit-query.ts
- Create: src/shared/audit/postgres-audit-query.ts
- Create: src/pages/audit.astro
- Create: tests/integration/shared/audit-query.test.ts

## Required specs

- `Documents/DOMAIN-MAP.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/DESIGN-SYSTEM.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`

## Copy-ready Codex prompt

```text
PROMPT ID: MASTER-017
TITLE: Dashboard + Search + Notifications + Audit UI

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
- Documents/UI-UX-SPECIFICATION.md
- Documents/PERMISSION-MATRIX.md
- Documents/DESIGN-SYSTEM.md
- Documents/ROUTE-MANIFEST-SPECIFICATION.md

FILES / PATHS IN SCOPE:
- Create: src/modules/dashboard/application/get-dashboard.ts
- Create: src/modules/dashboard/ports/dashboard-query.ts
- Create: src/modules/dashboard/infrastructure/postgres-dashboard-query.ts
- Create: tests/integration/dashboard/dashboard-query.test.ts
- Create: src/pages/dashboard/index.astro
- Create: src/pages/search.astro
- Create: src/pages/notifications.astro
- Modify: src/ui/shell/Topbar.astro
- Create: src/shared/audit/audit-query.ts
- Create: src/shared/audit/postgres-audit-query.ts
- Create: src/pages/audit.astro
- Create: tests/integration/shared/audit-query.test.ts

MISSION:
1. Role/scope-aware dashboard aggregation only.
2. QC Operational Command Center from authorized read model.
3. Search and notifications surfaces using shared services.
4. Explicit-permission global audit viewing plus composable record history.

NON-NEGOTIABLE REQUIREMENTS:
1. No global fetch then client hide.
2. PASS and Release separate metrics.
3. No invented KPI formula.
4. No GET mutation.
5. Scoped attention/approvals/activity.
6. Responsive/a11y.
7. Search URL query validated.
8. Notifications recipient-only.
9. Cmd/Ctrl+K if implemented uses same server service.
10. Scope-limited.
11. No secret payload fields.
12. Record-level history remains composable.

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
- cross-scope dashboard tests
- role-scoped Playwright
- RTL/mobile
- search keyboard
- notification isolation
- no permission
- scope
- safe rendering

FINAL RESPONSE:
- What was created/changed
- Exact paths
- Tests/commands actually run + results
- Security/authorization/state/concurrency evidence relevant to this prompt
- Anything BLOCKED by missing approved policy/provider/scientific data
- Suggested commit message only; do not commit unless explicitly authorized
```

---

# MASTER-018 — Report registry + CSV/XLSX export + report pages

**Phase:** Reporting  
**Merged from:** `IMP-095`, `IMP-096`, `IMP-097`

## Files in scope

- Create: src/modules/reporting/domain/report-definition.ts
- Create: src/modules/reporting/application/report-registry.ts
- Create: src/modules/reporting/application/run-report.ts
- Create: src/modules/reporting/ports/report-query.ts
- Create: src/modules/reporting/infrastructure/postgres-report-query.ts
- Create: tests/integration/reporting/reports.test.ts
- Create: src/modules/reporting/application/export-report.ts
- Create: src/modules/reporting/infrastructure/csv-exporter.ts
- Create: src/modules/reporting/infrastructure/xlsx-exporter.ts
- Create: tests/unit/reporting/export-safety.test.ts
- Create: tests/integration/reporting/export-report.test.ts
- Create: src/pages/reports/index.astro
- Create: src/pages/reports/[reportCode].astro
- Create: src/actions/reports.ts
- Modify: src/actions/index.ts

## Required specs

- `Documents/DOMAIN-MAP.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/RISK-REGISTER.md`
- `Documents/SECURITY-ARCHITECTURE.md`

## Copy-ready Codex prompt

```text
PROMPT ID: MASTER-018
TITLE: Report registry + CSV/XLSX export + report pages

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
- Documents/PERMISSION-MATRIX.md
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/UI-UX-SPECIFICATION.md
- Documents/RISK-REGISTER.md
- Documents/SECURITY-ARCHITECTURE.md

FILES / PATHS IN SCOPE:
- Create: src/modules/reporting/domain/report-definition.ts
- Create: src/modules/reporting/application/report-registry.ts
- Create: src/modules/reporting/application/run-report.ts
- Create: src/modules/reporting/ports/report-query.ts
- Create: src/modules/reporting/infrastructure/postgres-report-query.ts
- Create: tests/integration/reporting/reports.test.ts
- Create: src/modules/reporting/application/export-report.ts
- Create: src/modules/reporting/infrastructure/csv-exporter.ts
- Create: src/modules/reporting/infrastructure/xlsx-exporter.ts
- Create: tests/unit/reporting/export-safety.test.ts
- Create: tests/integration/reporting/export-report.test.ts
- Create: src/pages/reports/index.astro
- Create: src/pages/reports/[reportCode].astro
- Create: src/actions/reports.ts
- Modify: src/actions/index.ts

MISSION:
1. Allowlisted report definitions and scoped datasets.
2. Authorized exports with spreadsheet formula-injection defense.
3. Report list/detail and export Action.

NON-NEGOTIABLE REQUIREMENTS:
1. reportCode registry only.
2. No arbitrary SQL/table names.
3. Same application scope.
4. No invented KPI/report definition.
5. Exact authorized report dataset.
6. PERM-RPT-EXPORT.
7. Sanitize formula-trigger cells.
8. No public temporary export.
9. No PDF unless approved requirement says so.
10. GET never exports.
11. Allowlist reportCode.
12. Action reauthorizes.
13. No SQL in Delivery.

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
- unknown code 404
- scope leakage
- injection
- formula injection
- unauthorized export
- CSV/XLSX parity
- Playwright report
- unknown code
- export authz

FINAL RESPONSE:
- What was created/changed
- Exact paths
- Tests/commands actually run + results
- Security/authorization/state/concurrency evidence relevant to this prompt
- Anything BLOCKED by missing approved policy/provider/scientific data
- Suggested commit message only; do not commit unless explicitly authorized
```

---

# MASTER-019 — Tasks end-to-end implementation

**Phase:** Domains  
**Merged from:** `IMP-100`, `IMP-101`, `IMP-102`, `IMP-103`, `IMP-104`

## Files in scope

- Create: src/modules/tasks/domain/model.ts
- Create: src/modules/tasks/domain/state.ts
- Create: src/modules/tasks/ports/repository.ts
- Create: tests/unit/tasks/domain.test.ts
- Create: src/modules/tasks/infrastructure/postgres-repository.ts
- Create: tests/integration/tasks/repository.test.ts
- Create: src/modules/tasks/application/create.ts
- Create: src/modules/tasks/application/get.ts
- Create: src/modules/tasks/application/list.ts
- Create: src/modules/tasks/application/update-draft.ts
- Create: src/modules/tasks/application/transition.ts
- Create: tests/integration/tasks/use-cases.test.ts
- Create: src/actions/tasks.ts
- Modify: src/actions/index.ts
- Create: src/pages/tasks/index.astro
- Create: src/pages/tasks/new.astro
- Create: src/pages/tasks/[taskId].astro
- Create: tests/e2e/tasks.spec.ts
- Create: tests/integration/tasks/authorization-matrix.test.ts

## Required specs

- `Documents/DOMAIN-MAP.md`
- `Documents/STATE-MACHINES.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/DATA-MODEL.md`
- `Documents/DATABASE-ARCHITECTURE.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/DESIGN-SYSTEM.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/TESTING-STRATEGY.md`
- `Documents/RISK-REGISTER.md`

## Copy-ready Codex prompt

```text
PROMPT ID: MASTER-019
TITLE: Tasks end-to-end implementation

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
- Documents/STATE-MACHINES.md
- Documents/BUSINESS-RULES.md
- Documents/DATA-MODEL.md
- Documents/DATABASE-ARCHITECTURE.md
- Documents/DATA-DICTIONARY.md
- Documents/PERMISSION-MATRIX.md
- Documents/UI-UX-SPECIFICATION.md
- Documents/DESIGN-SYSTEM.md
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/TESTING-STRATEGY.md
- Documents/RISK-REGISTER.md

FILES / PATHS IN SCOPE:
- Create: src/modules/tasks/domain/model.ts
- Create: src/modules/tasks/domain/state.ts
- Create: src/modules/tasks/ports/repository.ts
- Create: tests/unit/tasks/domain.test.ts
- Create: src/modules/tasks/infrastructure/postgres-repository.ts
- Create: tests/integration/tasks/repository.test.ts
- Create: src/modules/tasks/application/create.ts
- Create: src/modules/tasks/application/get.ts
- Create: src/modules/tasks/application/list.ts
- Create: src/modules/tasks/application/update-draft.ts
- Create: src/modules/tasks/application/transition.ts
- Create: tests/integration/tasks/use-cases.test.ts
- Create: src/actions/tasks.ts
- Modify: src/actions/index.ts
- Create: src/pages/tasks/index.astro
- Create: src/pages/tasks/new.astro
- Create: src/pages/tasks/[taskId].astro
- Create: tests/e2e/tasks.spec.ts
- Create: tests/integration/tasks/authorization-matrix.test.ts

MISSION:
1. Implement Tasks domain model owned by Tasks Domain.
2. Implement Tasks persistence behind repository port.
3. Implement Tasks commands/queries with authorization, transaction and audit/outbox.
4. Implement Tasks browser workspaces and thin Actions.
5. Prove Tasks positive/negative behavior.

NON-NEGOTIABLE REQUIREMENTS:
1. Copy lifecycle/invariants exactly from State Machines/Business Rules.
2. Undeclared transition DENY.
3. No Astro/Kysely imports in domain.
4. Client never supplies authoritative final state.
5. Tasks must not replace Inspection/Lab/NCR/CAPA/Document Approval/Calibration/Receiving.
6. Implement assignment/checklist/dependency/comment/blocker/recurrence/completion only when canonical model supports them.
7. Exact canonical table/column names.
8. Optimistic version matching where specified.
9. No cross-domain writes.
10. Map DB failures safely.
11. Every command reauthorizes.
12. Draft-only ordinary edits.
13. Current state/version/SoD for controlled transitions.
14. Action intent derives state; no arbitrary target-state input.
15. Audit important mutations atomically.
16. Use exact Route Manifest paths.
17. Pages only parse context/query, call use cases/read models and render.
18. Actions no SQL/business rules.
19. Show state/version/history/authorized capabilities.
20. Unauthenticated/missing permission/wrong scope/wrong state/direct Action/stale/IDOR/SoD where relevant.
21. Roles are not hierarchy.
22. Run tests before claiming PASS.

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
- domain transition/invariant tests
- no infrastructure imports
- real PG repository
- stale version
- constraints
- allowed/no permission/wrong scope/wrong state/stale version/SoD/audit
- UUID params
- direct Action authorization
- Playwright workflows
- route checker
- domain integration matrix
- pnpm exec playwright test tests/e2e/tasks.spec.ts
- pnpm architecture:check

FINAL RESPONSE:
- What was created/changed
- Exact paths
- Tests/commands actually run + results
- Security/authorization/state/concurrency evidence relevant to this prompt
- Anything BLOCKED by missing approved policy/provider/scientific data
- Suggested commit message only; do not commit unless explicitly authorized
```

---

# MASTER-020 — Quality: Finding + NCR + RCA + CAPA

**Phase:** Domains  
**Merged from:** `IMP-110`, `IMP-111`, `IMP-112`, `IMP-113`, `IMP-114`, `IMP-115`, `IMP-116`

## Files in scope

- Create: src/modules/quality/findings/domain/finding.ts
- Create: src/modules/quality/findings/ports/repository.ts
- Create: src/modules/quality/findings/infrastructure/postgres-repository.ts
- Create: src/modules/quality/findings/application/create-finding.ts
- Create: src/modules/quality/findings/application/get-finding.ts
- Create: src/modules/quality/findings/application/list-findings.ts
- Create: src/modules/quality/findings/application/transition-finding.ts
- Create: tests/integration/quality/findings.test.ts
- Create: src/modules/quality/ncr/domain/ncr.ts
- Create: src/modules/quality/ncr/ports/repository.ts
- Create: src/modules/quality/ncr/infrastructure/postgres-repository.ts
- Create: src/modules/quality/ncr/application/create-ncr.ts
- Create: src/modules/quality/ncr/application/get-ncr.ts
- Create: src/modules/quality/ncr/application/list-ncr.ts
- Create: src/modules/quality/ncr/application/transition-ncr.ts
- Create: tests/integration/quality/ncr.test.ts
- Create: src/modules/quality/rca/domain/rca.ts
- Create: src/modules/quality/rca/ports/repository.ts
- Create: src/modules/quality/rca/infrastructure/postgres-repository.ts
- Create: src/modules/quality/rca/application/get-rca.ts
- Create: src/modules/quality/rca/application/list-rca.ts
- Create: src/modules/quality/rca/application/update-rca.ts
- Create: src/modules/quality/rca/application/transition-rca.ts
- Create: tests/integration/quality/rca.test.ts
- Create: src/modules/quality/capa/domain/capa.ts
- Create: src/modules/quality/capa/ports/repository.ts
- Create: src/modules/quality/capa/infrastructure/postgres-repository.ts
- Create: src/modules/quality/capa/application/create-capa.ts
- Create: src/modules/quality/capa/application/get-capa.ts
- Create: src/modules/quality/capa/application/list-capa.ts
- Create: src/modules/quality/capa/application/transition-capa.ts
- Create: tests/integration/quality/capa.test.ts
- Create: src/modules/quality/application/get-quality-overview.ts
- Create: src/modules/quality/infrastructure/postgres-quality-overview.ts
- Create: src/pages/quality/index.astro
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
- Create: tests/e2e/quality.spec.ts
- Create: tests/integration/quality/authorization-matrix.test.ts

## Required specs

- `Documents/DOMAIN-MAP.md`
- `Documents/STATE-MACHINES.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/DESIGN-SYSTEM.md`
- `Documents/TESTING-STRATEGY.md`
- `Documents/RISK-REGISTER.md`

## Copy-ready Codex prompt

```text
PROMPT ID: MASTER-020
TITLE: Quality: Finding + NCR + RCA + CAPA

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
- Documents/STATE-MACHINES.md
- Documents/BUSINESS-RULES.md
- Documents/DATA-DICTIONARY.md
- Documents/PERMISSION-MATRIX.md
- Documents/UI-UX-SPECIFICATION.md
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/DESIGN-SYSTEM.md
- Documents/TESTING-STRATEGY.md
- Documents/RISK-REGISTER.md

FILES / PATHS IN SCOPE:
- Create: src/modules/quality/findings/domain/finding.ts
- Create: src/modules/quality/findings/ports/repository.ts
- Create: src/modules/quality/findings/infrastructure/postgres-repository.ts
- Create: src/modules/quality/findings/application/create-finding.ts
- Create: src/modules/quality/findings/application/get-finding.ts
- Create: src/modules/quality/findings/application/list-findings.ts
- Create: src/modules/quality/findings/application/transition-finding.ts
- Create: tests/integration/quality/findings.test.ts
- Create: src/modules/quality/ncr/domain/ncr.ts
- Create: src/modules/quality/ncr/ports/repository.ts
- Create: src/modules/quality/ncr/infrastructure/postgres-repository.ts
- Create: src/modules/quality/ncr/application/create-ncr.ts
- Create: src/modules/quality/ncr/application/get-ncr.ts
- Create: src/modules/quality/ncr/application/list-ncr.ts
- Create: src/modules/quality/ncr/application/transition-ncr.ts
- Create: tests/integration/quality/ncr.test.ts
- Create: src/modules/quality/rca/domain/rca.ts
- Create: src/modules/quality/rca/ports/repository.ts
- Create: src/modules/quality/rca/infrastructure/postgres-repository.ts
- Create: src/modules/quality/rca/application/get-rca.ts
- Create: src/modules/quality/rca/application/list-rca.ts
- Create: src/modules/quality/rca/application/update-rca.ts
- Create: src/modules/quality/rca/application/transition-rca.ts
- Create: tests/integration/quality/rca.test.ts
- Create: src/modules/quality/capa/domain/capa.ts
- Create: src/modules/quality/capa/ports/repository.ts
- Create: src/modules/quality/capa/infrastructure/postgres-repository.ts
- Create: src/modules/quality/capa/application/create-capa.ts
- Create: src/modules/quality/capa/application/get-capa.ts
- Create: src/modules/quality/capa/application/list-capa.ts
- Create: src/modules/quality/capa/application/transition-capa.ts
- Create: tests/integration/quality/capa.test.ts
- Create: src/modules/quality/application/get-quality-overview.ts
- Create: src/modules/quality/infrastructure/postgres-quality-overview.ts
- Create: src/pages/quality/index.astro
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
- Create: tests/e2e/quality.spec.ts
- Create: tests/integration/quality/authorization-matrix.test.ts

MISSION:
1. Finding is Quality-owned and may reference source records without mutating their domain.
2. NCR lifecycle and Finding/source linkage.
3. RCA linked to NCR exactly as canonical model.
4. CAPA with approved source/RCA relation and controlled closure.
5. Authorized Quality overview only.
6. Quality Delivery Layer exactly from approved/conditional routes.
7. Prove approved Finding→NCR→RCA→CAPA flow and negative controls.

NON-NEGOTIABLE REQUIREMENTS:
1. Exact fields/state.
2. Authz/scope every operation.
3. No cross-domain source mutation.
4. Audit controlled transitions.
5. Read Business Rules before enabling direct NCR creation; if direct creation is forbidden, use case only accepts approved source flow.
6. Preserve history.
7. Closure authority unresolved => deny.
8. No unrelated generic note.
9. Preserve NCR link/context.
10. No invented root-cause taxonomy.
11. Creation route/use-case conditional on business flow.
12. Closure authority not invented.
13. Preserve verification/closure history.
14. Scoped aggregates.
15. No invented KPI.
16. No client-side hiding of global dataset.
17. Do not create conditional new routes when business flow forbids them.
18. No SQL/business rules in Delivery.
19. Show source/history/capabilities.
20. Conditional creation behavior.
21. Closure/SoD/permission/version.
22. Source records not silently changed.

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
- transition matrix
- source linkage
- stale/IDOR
- creation policy
- state/authz
- source unchanged
- NCR linkage
- state/version
- permission/scope
- closure denial if unresolved
- state/version/SoD
- cross-scope overview
- route checker
- Action authz
- UUID/IDOR
- Quality integration/E2E

FINAL RESPONSE:
- What was created/changed
- Exact paths
- Tests/commands actually run + results
- Security/authorization/state/concurrency evidence relevant to this prompt
- Anything BLOCKED by missing approved policy/provider/scientific data
- Suggested commit message only; do not commit unless explicitly authorized
```

---

# MASTER-021 — Quarantine: Receiving + Inspection execution

**Phase:** Domains  
**Merged from:** `IMP-120`, `IMP-121`, `IMP-122`, `IMP-123`

## Files in scope

- Create: src/modules/quarantine/receiving/domain/receiving-item.ts
- Create: src/modules/quarantine/receiving/domain/receiving-state.ts
- Create: src/modules/quarantine/receiving/ports/repository.ts
- Create: src/modules/quarantine/receiving/infrastructure/postgres-repository.ts
- Create: tests/integration/quarantine/receiving-repository.test.ts
- Create: src/modules/quarantine/receiving/application/create-receiving.ts
- Create: src/modules/quarantine/receiving/application/get-receiving.ts
- Create: src/modules/quarantine/receiving/application/list-receiving.ts
- Create: src/modules/quarantine/receiving/application/update-receiving-draft.ts
- Create: src/modules/quarantine/receiving/application/transition-receiving.ts
- Create: tests/integration/quarantine/receiving-use-cases.test.ts
- Create: src/modules/quarantine/inspection/domain/inspection.ts
- Create: src/modules/quarantine/inspection/domain/inspection-result.ts
- Create: src/modules/quarantine/inspection/domain/inspection-state.ts
- Create: src/modules/quarantine/inspection/ports/repository.ts
- Create: src/modules/quarantine/inspection/infrastructure/postgres-repository.ts
- Create: tests/integration/quarantine/inspection-repository.test.ts
- Create: src/modules/quarantine/inspection/application/start-inspection.ts
- Create: src/modules/quarantine/inspection/application/get-inspection.ts
- Create: src/modules/quarantine/inspection/application/list-inspections.ts
- Create: src/modules/quarantine/inspection/application/save-inspection-draft.ts
- Create: src/modules/quarantine/inspection/application/submit-inspection.ts
- Create: tests/integration/quarantine/inspection-execution.test.ts

## Required specs

- `Documents/DOMAIN-MAP.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/STATE-MACHINES.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/PERMISSION-MATRIX.md`

## Copy-ready Codex prompt

```text
PROMPT ID: MASTER-021
TITLE: Quarantine: Receiving + Inspection execution

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
- Documents/BUSINESS-RULES.md
- Documents/STATE-MACHINES.md
- Documents/DATA-DICTIONARY.md
- Documents/PERMISSION-MATRIX.md

FILES / PATHS IN SCOPE:
- Create: src/modules/quarantine/receiving/domain/receiving-item.ts
- Create: src/modules/quarantine/receiving/domain/receiving-state.ts
- Create: src/modules/quarantine/receiving/ports/repository.ts
- Create: src/modules/quarantine/receiving/infrastructure/postgres-repository.ts
- Create: tests/integration/quarantine/receiving-repository.test.ts
- Create: src/modules/quarantine/receiving/application/create-receiving.ts
- Create: src/modules/quarantine/receiving/application/get-receiving.ts
- Create: src/modules/quarantine/receiving/application/list-receiving.ts
- Create: src/modules/quarantine/receiving/application/update-receiving-draft.ts
- Create: src/modules/quarantine/receiving/application/transition-receiving.ts
- Create: tests/integration/quarantine/receiving-use-cases.test.ts
- Create: src/modules/quarantine/inspection/domain/inspection.ts
- Create: src/modules/quarantine/inspection/domain/inspection-result.ts
- Create: src/modules/quarantine/inspection/domain/inspection-state.ts
- Create: src/modules/quarantine/inspection/ports/repository.ts
- Create: src/modules/quarantine/inspection/infrastructure/postgres-repository.ts
- Create: tests/integration/quarantine/inspection-repository.test.ts
- Create: src/modules/quarantine/inspection/application/start-inspection.ts
- Create: src/modules/quarantine/inspection/application/get-inspection.ts
- Create: src/modules/quarantine/inspection/application/list-inspections.ts
- Create: src/modules/quarantine/inspection/application/save-inspection-draft.ts
- Create: src/modules/quarantine/inspection/application/submit-inspection.ts
- Create: tests/integration/quarantine/inspection-execution.test.ts

MISSION:
1. Quarantine-owned Receiving Item.
2. Authorized/audited receiving commands/queries.
3. Inspection linked to Receiving with controlled template/version context.
4. Assigned/scoped execution and submission.

NON-NEGOTIABLE REQUIREMENTS:
1. Receiving Workflow State separate from Inspection Result and Release State.
2. Version/history as specified.
3. PERM-QUAR-CREATE where canonical.
4. No arbitrary target state.
5. Current state/version.
6. Inspection Result separate from Release.
7. No invented acceptance criteria/template fields.
8. Approved read-only except controlled mechanisms.
9. Creation contextual from Receiving; no /inspections/new.
10. Autosave draft-only.
11. Submission freezes historical controlled context.
12. No scientific inventions.

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
- repo/state
- prove PASS cannot auto-release in model
- permission/scope/state/version
- audit
- template/version linkage
- state/result constraints
- history
- assigned/unassigned
- state
- stale
- snapshot

FINAL RESPONSE:
- What was created/changed
- Exact paths
- Tests/commands actually run + results
- Security/authorization/state/concurrency evidence relevant to this prompt
- Anything BLOCKED by missing approved policy/provider/scientific data
- Suggested commit message only; do not commit unless explicitly authorized
```

---

# MASTER-022 — Quarantine: Review + Release + dashboards/pages + E2E

**Phase:** Domains  
**Merged from:** `IMP-124`, `IMP-125`, `IMP-126`, `IMP-127`, `IMP-128`

## Files in scope

- Create: src/modules/quarantine/inspection/application/review-inspection.ts
- Create: src/modules/quarantine/inspection/application/approve-inspection.ts
- Create: src/modules/quarantine/inspection/application/return-inspection.ts
- Create: tests/integration/quarantine/inspection-review.test.ts
- Create: src/modules/quarantine/receiving/application/release-receiving.ts
- Create: src/modules/quarantine/receiving/application/hold-receiving.ts
- Create: tests/integration/quarantine/release-state.test.ts
- Create: src/modules/quarantine/application/get-quarantine-overview.ts
- Create: src/modules/quarantine/application/get-quarantine-admin.ts
- Create: src/modules/quarantine/infrastructure/postgres-quarantine-read-model.ts
- Create: tests/integration/quarantine/read-models.test.ts
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
- Create: tests/e2e/quarantine.spec.ts
- Create: tests/integration/quarantine/authorization-matrix.test.ts

## Required specs

- `Documents/PERMISSION-MATRIX.md`
- `Documents/STATE-MACHINES.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/RISK-REGISTER.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/DOMAIN-MAP.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/DESIGN-SYSTEM.md`
- `Documents/TESTING-STRATEGY.md`

## Copy-ready Codex prompt

```text
PROMPT ID: MASTER-022
TITLE: Quarantine: Review + Release + dashboards/pages + E2E

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
- Documents/PERMISSION-MATRIX.md
- Documents/STATE-MACHINES.md
- Documents/BUSINESS-RULES.md
- Documents/RISK-REGISTER.md
- Documents/UI-UX-SPECIFICATION.md
- Documents/DOMAIN-MAP.md
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/DESIGN-SYSTEM.md
- Documents/TESTING-STRATEGY.md

FILES / PATHS IN SCOPE:
- Create: src/modules/quarantine/inspection/application/review-inspection.ts
- Create: src/modules/quarantine/inspection/application/approve-inspection.ts
- Create: src/modules/quarantine/inspection/application/return-inspection.ts
- Create: tests/integration/quarantine/inspection-review.test.ts
- Create: src/modules/quarantine/receiving/application/release-receiving.ts
- Create: src/modules/quarantine/receiving/application/hold-receiving.ts
- Create: tests/integration/quarantine/release-state.test.ts
- Create: src/modules/quarantine/application/get-quarantine-overview.ts
- Create: src/modules/quarantine/application/get-quarantine-admin.ts
- Create: src/modules/quarantine/infrastructure/postgres-quarantine-read-model.ts
- Create: tests/integration/quarantine/read-models.test.ts
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
- Create: tests/e2e/quarantine.spec.ts
- Create: tests/integration/quarantine/authorization-matrix.test.ts

MISSION:
1. Controlled review/approval.
2. Release System State is explicit controlled action independent of PASS.
3. Scoped Quarantine overview and domain admin read models.
4. All approved Quarantine workspaces.
5. Prove RISK-005/006/007 and authz/concurrency behavior.

NON-NEGOTIABLE REQUIREMENTS:
1. Review vs approve permissions distinct where matrix says.
2. SoD/state/version.
3. Official result only through approved deterministic rule/source.
4. Audit/e-sign only as approved.
5. PASS never auto-releases.
6. Unresolved release authority => DENY.
7. Check approved prerequisites/current version/scope.
8. Audit release/hold.
9. Always separate receiving state/result/release state.
10. Domain admin explicit permission.
11. No /inspections/new.
12. Execute editable/assignment guarded.
13. Review route ≠ approval permission.
14. Controlled states read-only.
15. PASS/RELEASED distinct.
16. Incorrect PASS/FAIL/source handling.
17. PASS not Release.
18. Unauthorized Release.
19. IDOR/SoD/stale/direct Action.

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
- reviewer/approver
- SoD
- stale
- audit
- PASS+no release remains not released
- unauthorized release
- stale/SoD
- scope leakage
- PASS vs Released
- route checker
- Playwright receiving→inspection
- direct release attack
- Quarantine integration/E2E

FINAL RESPONSE:
- What was created/changed
- Exact paths
- Tests/commands actually run + results
- Security/authorization/state/concurrency evidence relevant to this prompt
- Anything BLOCKED by missing approved policy/provider/scientific data
- Suggested commit message only; do not commit unless explicitly authorized
```

---

# MASTER-023 — Laboratory complete implementation

**Phase:** Domains  
**Merged from:** `IMP-130`, `IMP-131`, `IMP-132`, `IMP-133`, `IMP-134`, `IMP-135`

## Files in scope

- Create: src/modules/laboratory/domain/lab-test.ts
- Create: src/modules/laboratory/domain/measurement.ts
- Create: src/modules/laboratory/domain/lab-state.ts
- Create: src/modules/laboratory/ports/repository.ts
- Create: src/modules/laboratory/infrastructure/postgres-repository.ts
- Create: tests/integration/laboratory/repository.test.ts
- Create: src/modules/laboratory/application/create-lab-test.ts
- Create: src/modules/laboratory/application/get-lab-test.ts
- Create: src/modules/laboratory/application/list-lab-tests.ts
- Create: src/modules/laboratory/application/save-measurements.ts
- Create: src/modules/laboratory/application/submit-lab-test.ts
- Create: tests/integration/laboratory/execution.test.ts
- Create: src/modules/laboratory/application/review-lab-test.ts
- Create: src/modules/laboratory/application/approve-lab-test.ts
- Create: src/modules/laboratory/application/return-lab-test.ts
- Create: tests/integration/laboratory/review.test.ts
- Create: src/modules/laboratory/domain/retest.ts
- Create: src/modules/laboratory/application/create-retest.ts
- Create: src/modules/laboratory/application/get-retest-context.ts
- Create: tests/integration/laboratory/retest.test.ts
- Create: src/actions/laboratory.ts
- Modify: src/actions/index.ts
- Create: src/pages/laboratory/index.astro
- Create: src/pages/laboratory/tests/index.astro
- Create: src/pages/laboratory/tests/new.astro
- Create: src/pages/laboratory/tests/[labTestId]/index.astro
- Create: src/pages/laboratory/tests/[labTestId]/execute.astro
- Create: src/pages/laboratory/tests/[labTestId]/review.astro
- Create: src/pages/laboratory/tests/[labTestId]/retests/new.astro
- Create: tests/e2e/laboratory.spec.ts
- Create: tests/integration/laboratory/authorization-matrix.test.ts
- Create: tests/integration/laboratory/scientific-boundaries.test.ts

## Required specs

- `Documents/DOMAIN-MAP.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/STATE-MACHINES.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/RISK-REGISTER.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/DESIGN-SYSTEM.md`
- `Documents/TESTING-STRATEGY.md`

## Copy-ready Codex prompt

```text
PROMPT ID: MASTER-023
TITLE: Laboratory complete implementation

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
- Documents/BUSINESS-RULES.md
- Documents/STATE-MACHINES.md
- Documents/DATA-DICTIONARY.md
- Documents/PERMISSION-MATRIX.md
- Documents/RISK-REGISTER.md
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/UI-UX-SPECIFICATION.md
- Documents/DESIGN-SYSTEM.md
- Documents/TESTING-STRATEGY.md

FILES / PATHS IN SCOPE:
- Create: src/modules/laboratory/domain/lab-test.ts
- Create: src/modules/laboratory/domain/measurement.ts
- Create: src/modules/laboratory/domain/lab-state.ts
- Create: src/modules/laboratory/ports/repository.ts
- Create: src/modules/laboratory/infrastructure/postgres-repository.ts
- Create: tests/integration/laboratory/repository.test.ts
- Create: src/modules/laboratory/application/create-lab-test.ts
- Create: src/modules/laboratory/application/get-lab-test.ts
- Create: src/modules/laboratory/application/list-lab-tests.ts
- Create: src/modules/laboratory/application/save-measurements.ts
- Create: src/modules/laboratory/application/submit-lab-test.ts
- Create: tests/integration/laboratory/execution.test.ts
- Create: src/modules/laboratory/application/review-lab-test.ts
- Create: src/modules/laboratory/application/approve-lab-test.ts
- Create: src/modules/laboratory/application/return-lab-test.ts
- Create: tests/integration/laboratory/review.test.ts
- Create: src/modules/laboratory/domain/retest.ts
- Create: src/modules/laboratory/application/create-retest.ts
- Create: src/modules/laboratory/application/get-retest-context.ts
- Create: tests/integration/laboratory/retest.test.ts
- Create: src/actions/laboratory.ts
- Modify: src/actions/index.ts
- Create: src/pages/laboratory/index.astro
- Create: src/pages/laboratory/tests/index.astro
- Create: src/pages/laboratory/tests/new.astro
- Create: src/pages/laboratory/tests/[labTestId]/index.astro
- Create: src/pages/laboratory/tests/[labTestId]/execute.astro
- Create: src/pages/laboratory/tests/[labTestId]/review.astro
- Create: src/pages/laboratory/tests/[labTestId]/retests/new.astro
- Create: tests/e2e/laboratory.spec.ts
- Create: tests/integration/laboratory/authorization-matrix.test.ts
- Create: tests/integration/laboratory/scientific-boundaries.test.ts

MISSION:
1. Lab Test/sample/measurement/result persistence and invariants.
2. Authorized lab execution against controlled criteria.
3. Controlled Lab review/approval.
4. Separate Retest linked to original.
5. Laboratory Delivery Layer.
6. Prove authz/scientific-source/history safety.

NON-NEGOTIABLE REQUIREMENTS:
1. Preserve raw measurements.
2. Criteria/units/precision/rounding from controlled sources only.
3. Snapshot required equipment/calibration/document context.
4. No AI official result.
5. PERM-LAB-CREATE.
6. Draft measurements only editable state.
7. Submission freezes context.
8. Assets eligibility via Assets capability, not table write.
9. State/version/SoD.
10. Official PASS/FAIL deterministic controlled logic only.
11. Reviewer cannot silently edit submitted measurements.
12. Unresolved retest policy/count/authority => DENY/BLOCKED, no invented count.
13. Original raw measurements/result never overwritten.
14. PERM-LAB-RETEST.
15. /laboratory behavior per manifest.
16. Retest page may exist but server blocks unresolved policy.
17. Exact controlled context/raw history.
18. No scientific calc in Astro.
19. Only approved fixture criteria.
20. Wrong document/equipment/calibration context.
21. Retest misuse.
22. Raw measurements preserved.

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
- raw value
- context snapshots
- no scientific constants
- create/execute/submit matrix
- controlled criteria fixtures only
- SoD
- stale
- wrong criteria/source
- audit
- policy-unresolved denial
- original unchanged
- allowed fixture only
- route checker
- execute/review/retest Playwright
- direct Action negatives
- Lab integration/E2E

FINAL RESPONSE:
- What was created/changed
- Exact paths
- Tests/commands actually run + results
- Security/authorization/state/concurrency evidence relevant to this prompt
- Anything BLOCKED by missing approved policy/provider/scientific data
- Suggested commit message only; do not commit unless explicitly authorized
```

---

# MASTER-024 — Assets: Equipment + Calibration + Maintenance

**Phase:** Domains  
**Merged from:** `IMP-140`, `IMP-141`, `IMP-142`, `IMP-143`, `IMP-144`, `IMP-145`

## Files in scope

- Create: src/modules/assets/equipment/domain/equipment.ts
- Create: src/modules/assets/equipment/ports/repository.ts
- Create: src/modules/assets/equipment/infrastructure/postgres-repository.ts
- Create: src/modules/assets/equipment/application/create-equipment.ts
- Create: src/modules/assets/equipment/application/get-equipment.ts
- Create: src/modules/assets/equipment/application/list-equipment.ts
- Create: src/modules/assets/equipment/application/update-equipment.ts
- Create: tests/integration/assets/equipment.test.ts
- Create: src/modules/assets/calibration/domain/calibration.ts
- Create: src/modules/assets/calibration/ports/repository.ts
- Create: src/modules/assets/calibration/infrastructure/postgres-repository.ts
- Create: src/modules/assets/calibration/application/create-calibration.ts
- Create: src/modules/assets/calibration/application/get-calibration.ts
- Create: src/modules/assets/calibration/application/list-calibrations.ts
- Create: src/modules/assets/calibration/application/transition-calibration.ts
- Create: tests/integration/assets/calibration.test.ts
- Create: src/modules/assets/maintenance/domain/maintenance.ts
- Create: src/modules/assets/maintenance/ports/repository.ts
- Create: src/modules/assets/maintenance/infrastructure/postgres-repository.ts
- Create: src/modules/assets/maintenance/application/create-maintenance.ts
- Create: src/modules/assets/maintenance/application/get-maintenance.ts
- Create: src/modules/assets/maintenance/application/list-maintenance.ts
- Create: src/modules/assets/maintenance/application/transition-maintenance.ts
- Create: tests/integration/assets/maintenance.test.ts
- Create: src/modules/assets/equipment/application/get-equipment-eligibility.ts
- Create: src/modules/assets/equipment/ports/equipment-eligibility.ts
- Create: tests/integration/assets/equipment-eligibility.test.ts
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
- Create: tests/e2e/assets.spec.ts
- Create: tests/integration/assets/authorization-matrix.test.ts

## Required specs

- `Documents/DOMAIN-MAP.md`
- `Documents/STATE-MACHINES.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/RISK-REGISTER.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/DESIGN-SYSTEM.md`
- `Documents/TESTING-STRATEGY.md`

## Copy-ready Codex prompt

```text
PROMPT ID: MASTER-024
TITLE: Assets: Equipment + Calibration + Maintenance

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
- Documents/STATE-MACHINES.md
- Documents/DATA-DICTIONARY.md
- Documents/PERMISSION-MATRIX.md
- Documents/BUSINESS-RULES.md
- Documents/RISK-REGISTER.md
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/UI-UX-SPECIFICATION.md
- Documents/DESIGN-SYSTEM.md
- Documents/TESTING-STRATEGY.md

FILES / PATHS IN SCOPE:
- Create: src/modules/assets/equipment/domain/equipment.ts
- Create: src/modules/assets/equipment/ports/repository.ts
- Create: src/modules/assets/equipment/infrastructure/postgres-repository.ts
- Create: src/modules/assets/equipment/application/create-equipment.ts
- Create: src/modules/assets/equipment/application/get-equipment.ts
- Create: src/modules/assets/equipment/application/list-equipment.ts
- Create: src/modules/assets/equipment/application/update-equipment.ts
- Create: tests/integration/assets/equipment.test.ts
- Create: src/modules/assets/calibration/domain/calibration.ts
- Create: src/modules/assets/calibration/ports/repository.ts
- Create: src/modules/assets/calibration/infrastructure/postgres-repository.ts
- Create: src/modules/assets/calibration/application/create-calibration.ts
- Create: src/modules/assets/calibration/application/get-calibration.ts
- Create: src/modules/assets/calibration/application/list-calibrations.ts
- Create: src/modules/assets/calibration/application/transition-calibration.ts
- Create: tests/integration/assets/calibration.test.ts
- Create: src/modules/assets/maintenance/domain/maintenance.ts
- Create: src/modules/assets/maintenance/ports/repository.ts
- Create: src/modules/assets/maintenance/infrastructure/postgres-repository.ts
- Create: src/modules/assets/maintenance/application/create-maintenance.ts
- Create: src/modules/assets/maintenance/application/get-maintenance.ts
- Create: src/modules/assets/maintenance/application/list-maintenance.ts
- Create: src/modules/assets/maintenance/application/transition-maintenance.ts
- Create: tests/integration/assets/maintenance.test.ts
- Create: src/modules/assets/equipment/application/get-equipment-eligibility.ts
- Create: src/modules/assets/equipment/ports/equipment-eligibility.ts
- Create: tests/integration/assets/equipment-eligibility.test.ts
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
- Create: tests/e2e/assets.spec.ts
- Create: tests/integration/assets/authorization-matrix.test.ts

MISSION:
1. Equipment master/controlled context.
2. Calibration linked to Equipment.
3. Maintenance linked to Equipment.
4. Assets-owned eligibility consumed by Lab.
5. Assets workspaces with only approved conditional routes.
6. Prove Equipment/Calibration/Maintenance controls.

NON-NEGOTIABLE REQUIREMENTS:
1. Creation only if v1 scope supports.
2. No calibration interval invention.
3. Master changes never rewrite historical Lab context.
4. No interval/pass criteria invention.
5. Contextual creation if approved.
6. Preserve history.
7. No automatic availability policy invention.
8. Audit/history.
9. If overdue-calibration behavior unresolved, return policy unresolved/deny; do not invent.
10. Provide approved snapshot context only.
11. /assets behavior per manifest.
12. No policy in pages.
13. Show historical/status clearly.
14. Invalid equipment/calibration context risk.
15. scope/permission/state/version.
16. No invented intervals.

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
- permission/state/version
- history non-rewrite
- equipment linkage
- state/permission/version
- linkage/state/permission
- unresolved policy
- valid controlled fixture
- no cross-domain write
- route checker
- Playwright navigation
- conditional routes
- Assets suites

FINAL RESPONSE:
- What was created/changed
- Exact paths
- Tests/commands actually run + results
- Security/authorization/state/concurrency evidence relevant to this prompt
- Anything BLOCKED by missing approved policy/provider/scientific data
- Suggested commit message only; do not commit unless explicitly authorized
```

---

# MASTER-025 — Controlled Documents complete implementation

**Phase:** Domains  
**Merged from:** `IMP-150`, `IMP-151`, `IMP-152`, `IMP-153`, `IMP-154`

## Files in scope

- Create: src/modules/documents/domain/document.ts
- Create: src/modules/documents/domain/document-version.ts
- Create: src/modules/documents/domain/document-state.ts
- Create: src/modules/documents/ports/repository.ts
- Create: src/modules/documents/infrastructure/postgres-repository.ts
- Create: tests/integration/documents/repository.test.ts
- Create: src/modules/documents/application/create-document.ts
- Create: src/modules/documents/application/get-document.ts
- Create: src/modules/documents/application/list-documents.ts
- Create: src/modules/documents/application/create-version.ts
- Create: src/modules/documents/application/update-version-draft.ts
- Create: tests/integration/documents/editing.test.ts
- Create: src/modules/documents/application/submit-version.ts
- Create: src/modules/documents/application/review-version.ts
- Create: src/modules/documents/application/approve-version.ts
- Create: src/modules/documents/application/supersede-version.ts
- Create: tests/integration/documents/review.test.ts
- Create: src/actions/documents.ts
- Modify: src/actions/index.ts
- Create: src/pages/documents/index.astro
- Create: src/pages/documents/new.astro
- Create: src/pages/documents/[documentId]/index.astro
- Create: src/pages/documents/[documentId]/versions/new.astro
- Create: src/pages/documents/[documentId]/versions/[versionId]/index.astro
- Create: src/pages/documents/[documentId]/versions/[versionId]/review.astro
- Create: tests/e2e/documents.spec.ts
- Create: tests/integration/documents/authorization-matrix.test.ts

## Required specs

- `Documents/DOMAIN-MAP.md`
- `Documents/STATE-MACHINES.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/RISK-REGISTER.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/DESIGN-SYSTEM.md`
- `Documents/TESTING-STRATEGY.md`

## Copy-ready Codex prompt

```text
PROMPT ID: MASTER-025
TITLE: Controlled Documents complete implementation

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
- Documents/STATE-MACHINES.md
- Documents/DATA-DICTIONARY.md
- Documents/BUSINESS-RULES.md
- Documents/PERMISSION-MATRIX.md
- Documents/RISK-REGISTER.md
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/UI-UX-SPECIFICATION.md
- Documents/DESIGN-SYSTEM.md
- Documents/TESTING-STRATEGY.md

FILES / PATHS IN SCOPE:
- Create: src/modules/documents/domain/document.ts
- Create: src/modules/documents/domain/document-version.ts
- Create: src/modules/documents/domain/document-state.ts
- Create: src/modules/documents/ports/repository.ts
- Create: src/modules/documents/infrastructure/postgres-repository.ts
- Create: tests/integration/documents/repository.test.ts
- Create: src/modules/documents/application/create-document.ts
- Create: src/modules/documents/application/get-document.ts
- Create: src/modules/documents/application/list-documents.ts
- Create: src/modules/documents/application/create-version.ts
- Create: src/modules/documents/application/update-version-draft.ts
- Create: tests/integration/documents/editing.test.ts
- Create: src/modules/documents/application/submit-version.ts
- Create: src/modules/documents/application/review-version.ts
- Create: src/modules/documents/application/approve-version.ts
- Create: src/modules/documents/application/supersede-version.ts
- Create: tests/integration/documents/review.test.ts
- Create: src/actions/documents.ts
- Modify: src/actions/index.ts
- Create: src/pages/documents/index.astro
- Create: src/pages/documents/new.astro
- Create: src/pages/documents/[documentId]/index.astro
- Create: src/pages/documents/[documentId]/versions/new.astro
- Create: src/pages/documents/[documentId]/versions/[versionId]/index.astro
- Create: src/pages/documents/[documentId]/versions/[versionId]/review.astro
- Create: tests/e2e/documents.spec.ts
- Create: tests/integration/documents/authorization-matrix.test.ts

MISSION:
1. Implement Controlled Document Identity separately from Document Version.
2. Implement document identity and draft-version workflows.
3. Implement controlled review/approval/supersession.
4. Implement Controlled Documents UI with version history/review workspace.
5. Prove controlled-document version integrity and authorization.

NON-NEGOTIABLE REQUIREMENTS:
1. Approved/effective versions are controlled.
2. Revision creates a new version; never edit approved version in place.
3. Superseded versions remain historical.
4. Binary linkage uses Files capability.
5. Document identity creation is not approval.
6. Only editable Draft version may change.
7. Do not invent effective-date policy.
8. File attachments go through FileService.
9. PERM-DOC-APPROVE only where explicitly granted.
10. State/version/SoD checks.
11. Effective-date behavior remains policy-controlled.
12. Superseding never deletes prior version.
13. No `/effective` mutation route.
14. Detail shows current effective version from read model.
15. Review page does not grant approval.
16. Approved versions read-only.
17. Wrong-version use, silent edit, superseded-history and scope-leakage tests.
18. No approval authority invented.

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
- identity/version separation
- approved version mutation denied
- superseded history retained
- draft editing
- approved edit denied
- permission/scope/version
- wrong-version approval denied
- SoD
- history retained
- wrong controlled version risk
- route checker
- Playwright create→draft→review
- approved-edit denial
- Documents integration/E2E

FINAL RESPONSE:
- What was created/changed
- Exact paths
- Tests/commands actually run + results
- Security/authorization/state/concurrency evidence relevant to this prompt
- Anything BLOCKED by missing approved policy/provider/scientific data
- Suggested commit message only; do not commit unless explicitly authorized
```

---

# MASTER-026 — Approvals + E-Signatures

**Phase:** Governance  
**Merged from:** `IMP-160`, `IMP-161`, `IMP-162`, `IMP-163`

## Files in scope

- Create: src/modules/approvals/domain/approval.ts
- Create: src/modules/approvals/ports/repository.ts
- Create: src/modules/approvals/infrastructure/postgres-repository.ts
- Create: tests/integration/approvals/repository.test.ts
- Create: src/modules/approvals/application/list-my-approvals.ts
- Create: src/modules/approvals/application/get-approval.ts
- Create: src/modules/approvals/application/decide-approval.ts
- Create: tests/integration/approvals/orchestration.test.ts
- Create: src/modules/e-signatures/domain/signature-evidence.ts
- Create: src/modules/e-signatures/ports/repository.ts
- Create: src/modules/e-signatures/infrastructure/postgres-repository.ts
- Create: src/modules/e-signatures/application/sign-controlled-action.ts
- Create: tests/integration/e-signatures/signature.test.ts
- Create: src/actions/approvals.ts
- Modify: src/actions/index.ts
- Create: src/pages/approvals/index.astro
- Create: src/pages/approvals/[approvalId].astro

## Required specs

- `Documents/DOMAIN-MAP.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/STATE-MACHINES.md`
- `Documents/DATA-DICTIONARY.md`
- `Documents/BUSINESS-RULES.md`
- `Documents/SECURITY-ARCHITECTURE.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/DESIGN-SYSTEM.md`

## Copy-ready Codex prompt

```text
PROMPT ID: MASTER-026
TITLE: Approvals + E-Signatures

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
- Documents/PERMISSION-MATRIX.md
- Documents/STATE-MACHINES.md
- Documents/DATA-DICTIONARY.md
- Documents/BUSINESS-RULES.md
- Documents/SECURITY-ARCHITECTURE.md
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/UI-UX-SPECIFICATION.md
- Documents/DESIGN-SYSTEM.md

FILES / PATHS IN SCOPE:
- Create: src/modules/approvals/domain/approval.ts
- Create: src/modules/approvals/ports/repository.ts
- Create: src/modules/approvals/infrastructure/postgres-repository.ts
- Create: tests/integration/approvals/repository.test.ts
- Create: src/modules/approvals/application/list-my-approvals.ts
- Create: src/modules/approvals/application/get-approval.ts
- Create: src/modules/approvals/application/decide-approval.ts
- Create: tests/integration/approvals/orchestration.test.ts
- Create: src/modules/e-signatures/domain/signature-evidence.ts
- Create: src/modules/e-signatures/ports/repository.ts
- Create: src/modules/e-signatures/infrastructure/postgres-repository.ts
- Create: src/modules/e-signatures/application/sign-controlled-action.ts
- Create: tests/integration/e-signatures/signature.test.ts
- Create: src/actions/approvals.ts
- Modify: src/actions/index.ts
- Create: src/pages/approvals/index.astro
- Create: src/pages/approvals/[approvalId].astro

MISSION:
1. Implement approval workflow infrastructure without duplicating subject-domain rules.
2. Implement approval orchestration delegating final subject mutation to owning Domain use cases.
3. Implement Meaning → Reauthentication → Reauthorization → State/Version/SoD → Evidence → Controlled Transition.
4. Implement My Approvals queue/detail and E-Signature integration.

NON-NEGOTIABLE REQUIREMENTS:
1. Approval points to subject/version/context.
2. Subject domain remains transition authority.
3. My Approvals returns only truly actionable scoped items.
4. No universal approver.
5. Reauthorize at decision time.
6. State/version/SoD validated.
7. No duplicate domain business logic.
8. Approval decision idempotent where applicable.
9. Never store password as evidence.
10. Bind signature to subject/version/action/meaning/actor/trusted time as schema supports.
11. Workflow e-sign requirement unresolved => do not invent/bypass.
12. Approval detail composes subject-specific review context.
13. No independent sign route.
14. Only actionable scoped approvals appear.

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
- subject linkage
- scope/actionability
- no cross-domain write
- cross-scope
- SoD
- stale subject
- replay
- wrong reauth
- stale version
- evidence excludes password
- Playwright queue/detail/sign
- direct Action tests

FINAL RESPONSE:
- What was created/changed
- Exact paths
- Tests/commands actually run + results
- Security/authorization/state/concurrency evidence relevant to this prompt
- Anything BLOCKED by missing approved policy/provider/scientific data
- Suggested commit message only; do not commit unless explicitly authorized
```

---

# MASTER-027 — Change Requests

**Phase:** Governance  
**Merged from:** `IMP-164`, `IMP-165`, `IMP-166`

## Files in scope

- Create: src/modules/change-requests/domain/change-request.ts
- Create: src/modules/change-requests/ports/repository.ts
- Create: src/modules/change-requests/infrastructure/postgres-repository.ts
- Create: src/modules/change-requests/application/create-change-request.ts
- Create: src/modules/change-requests/application/get-change-request.ts
- Create: src/modules/change-requests/application/list-change-requests.ts
- Create: src/modules/change-requests/application/transition-change-request.ts
- Create: tests/integration/change-requests/change-requests.test.ts
- Create: src/actions/change-requests.ts
- Modify: src/actions/index.ts
- Create: src/pages/change-requests/index.astro
- Create: src/pages/change-requests/new.astro
- Create: src/pages/change-requests/[changeRequestId]/index.astro
- Create: src/pages/change-requests/[changeRequestId]/review.astro
- Create: tests/e2e/governance.spec.ts
- Create: tests/integration/approvals/authorization-matrix.test.ts

## Required specs

- `Documents/DOMAIN-MAP.md`
- `Documents/STATE-MACHINES.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/TESTING-STRATEGY.md`
- `Documents/RISK-REGISTER.md`

## Copy-ready Codex prompt

```text
PROMPT ID: MASTER-027
TITLE: Change Requests

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
- Documents/STATE-MACHINES.md
- Documents/PERMISSION-MATRIX.md
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/UI-UX-SPECIFICATION.md
- Documents/TESTING-STRATEGY.md
- Documents/RISK-REGISTER.md

FILES / PATHS IN SCOPE:
- Create: src/modules/change-requests/domain/change-request.ts
- Create: src/modules/change-requests/ports/repository.ts
- Create: src/modules/change-requests/infrastructure/postgres-repository.ts
- Create: src/modules/change-requests/application/create-change-request.ts
- Create: src/modules/change-requests/application/get-change-request.ts
- Create: src/modules/change-requests/application/list-change-requests.ts
- Create: src/modules/change-requests/application/transition-change-request.ts
- Create: tests/integration/change-requests/change-requests.test.ts
- Create: src/actions/change-requests.ts
- Modify: src/actions/index.ts
- Create: src/pages/change-requests/index.astro
- Create: src/pages/change-requests/new.astro
- Create: src/pages/change-requests/[changeRequestId]/index.astro
- Create: src/pages/change-requests/[changeRequestId]/review.astro
- Create: tests/e2e/governance.spec.ts
- Create: tests/integration/approvals/authorization-matrix.test.ts

MISSION:
1. Implement controlled Change Request lifecycle.
2. Implement Change Request Delivery Layer.
3. Prove approvals/E-Signature/change-request integrity.

NON-NEGOTIABLE REQUIREMENTS:
1. PERM-CHG-APPROVE only when granted.
2. No arbitrary target state.
3. Audit decisions.
4. Approved CR does not automatically rewrite unrelated history.
5. Review needs explicit capability.
6. GET never applies controlled change.
7. Show history/impact/context safely.
8. Wrong subject/version signature, SoD bypass, unauthorized approval, stale version, replay, CR review.
9. Audit/evidence correlation.

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
- state/permission/scope/version/SoD
- no cross-domain rewrite
- route/action/e2e
- Governance suites

FINAL RESPONSE:
- What was created/changed
- Exact paths
- Tests/commands actually run + results
- Security/authorization/state/concurrency evidence relevant to this prompt
- Anything BLOCKED by missing approved policy/provider/scientific data
- Suggested commit message only; do not commit unless explicitly authorized
```

---

# MASTER-028 — Admin users + roles + permissions + scopes pages

**Phase:** Administration  
**Merged from:** `IMP-170`, `IMP-171`

## Files in scope

- Create: src/pages/admin/index.astro
- Create: src/pages/admin/users/index.astro
- Create: src/pages/admin/users/new.astro
- Create: src/pages/admin/users/[userId].astro
- Create: src/pages/admin/roles/index.astro
- Create: src/pages/admin/roles/[roleId].astro
- Create: src/pages/admin/permissions.astro
- Create: src/pages/admin/scopes.astro

## Required specs

- `Documents/ROUTE-MANIFEST-SPECIFICATION.md`
- `Documents/UI-UX-SPECIFICATION.md`
- `Documents/PERMISSION-MATRIX.md`
- `Documents/ROLE-MATRIX.md`

## Copy-ready Codex prompt

```text
PROMPT ID: MASTER-028
TITLE: Admin users + roles + permissions + scopes pages

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
- Documents/ROUTE-MANIFEST-SPECIFICATION.md
- Documents/UI-UX-SPECIFICATION.md
- Documents/PERMISSION-MATRIX.md
- Documents/ROLE-MATRIX.md

FILES / PATHS IN SCOPE:
- Create: src/pages/admin/index.astro
- Create: src/pages/admin/users/index.astro
- Create: src/pages/admin/users/new.astro
- Create: src/pages/admin/users/[userId].astro
- Create: src/pages/admin/roles/index.astro
- Create: src/pages/admin/roles/[roleId].astro
- Create: src/pages/admin/permissions.astro
- Create: src/pages/admin/scopes.astro

MISSION:
1. Implement user administration UI from existing Identity admin use cases.
2. Authorization administration UI.

NON-NEGOTIABLE REQUIREMENTS:
1. Explicit permissions only.
2. No password/hash/token display.
3. Disable/reset use controlled Actions.
4. Never imply hierarchy.
5. Explicit permissions/scopes.
6. Mutation server-authorized with confirmation.
7. No self-grant client bypass.

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
- Playwright authorized/unauthorized admin user flows
- Playwright grant/scope negatives
- direct Action no authority

FINAL RESPONSE:
- What was created/changed
- Exact paths
- Tests/commands actually run + results
- Security/authorization/state/concurrency evidence relevant to this prompt
- Anything BLOCKED by missing approved policy/provider/scientific data
- Suggested commit message only; do not commit unless explicitly authorized
```

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
