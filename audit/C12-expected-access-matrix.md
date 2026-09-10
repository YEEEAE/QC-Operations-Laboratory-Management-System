# C-12 Expected-Access Matrix — Prompt 13 (Verification Fixtures)

**Scope:** every route and action exercised by C-01 through C-12.
**Authority:** `Documents/ROLE-MATRIX.md`, `Documents/PERMISSION-MATRIX.md`,
`Documents/ROUTE-MANIFEST-SPECIFICATION.md`, P-04/P-05/P-06/P-07 decisions in
`audit/2026-09-09-production-ui-audit.md` §0.
**Personas:** `tests/fixtures/verification-personas.ts` (no secrets in this file).
**Secrets:** passwords live only in `QC_VERIFY_*` env vars; never in source, logs,
screenshots, or this report.
**Cleanup/expiry:** seed-managed `verify-*` accounts expire after 24h
(`valid_until` on `user_roles`) and are DISABLED by
`scripts/verification/cleanup-verification-fixtures.ts`. Disposable records use
the `VERIFY-` prefix. `yazeed` is operator-owned and never seed-managed.

Legend: `ALLOW` = positive access expected. `DENY-PAGE` = route renders safe
denied/empty without data. `DENY-ACTION` = server re-authorization rejects with a
stable code (`AUTHZ_*` / `CONFLICT_STALE_VERSION`). `REDIRECT` = unauthenticated
bounces to `/login`.

## 1. C-item to route/action map

| C-item | Routes / actions covered |
| --- | --- |
| C-01 | `GET /login`, login action, `GET /dashboard` after auth |
| C-02 | `GET /dashboard`, `GET /tasks`, `GET /quarantine/receiving`, `GET /laboratory/tests`, `GET /documents`, `GET /admin*` (negative), `GET /system/health` (negative except owner) |
| C-03 | `GET /dashboard` (KPI/attention/activity read models) |
| C-04 | `GET /system/health`, `GET /api/health/live`, `GET /api/health/ready`, `GET /api/system/release-identity`, `GET /system/backups` |
| C-05 | `GET /audit`, `GET /dashboard` (activity parity: same actor sees same eligible event) |
| C-06 | `GET /change-requests/new`, `changeRequests.createForDocumentVersion` (allowlist `revision`, `changeSummary`, `contentHash` only) |
| C-07/C-08/C-09 | Same read routes at 320px / 200% zoom / mobile drawer (no new permissions) |
| C-10 | `GET /tasks/new` (+ 8 sibling `/new` forms) validation without commit; POST baseline retains values on recoverable failure |
| C-11 | `GET /api/system/release-identity` identity equality start/end |
| C-12 | Negative matrix below: direct URL + forged Astro Action / API attempts for every sensitive operation |

## 2. Route matrix (authenticated, ACTIVE account)

| Route | SYSTEM_OWNER `yazeed` | Supervisor `verify-supervisor` | Manager `verify-manager` | Admin-only `verify-admin` | Employee `verify-employee` | Least-privileged `verify-least` |
| --- | --- | --- | --- | --- | --- | --- |
| `GET /login` | REDIRECT to `/dashboard` when authed | same | same | same | same | same |
| `GET /dashboard` | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW (read-only) |
| `GET /tasks`, `GET /tasks/[taskId]` | ALLOW (global read) | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW (read-only; no create/transition buttons) |
| `GET /quality/*`, `GET /quarantine/receiving*`, `GET /quarantine/inspections*`, `GET /laboratory/tests*`, `GET /assets/*`, `GET /documents*`, `GET /change-requests*`, `GET /reports`, `GET /search` | ALLOW (global operational read) | ALLOW | ALLOW | ALLOW | ALLOW | ALLOW (read-only) |
| `GET /audit` | ALLOW (`PERM-ADM-AUDIT-VIEW`) | DENY-PAGE (no audit-view grant) | DENY-PAGE | ALLOW (`PERM-ADM-AUDIT-VIEW`) | DENY-PAGE | DENY-PAGE |
| `GET /admin`, `GET /admin/users*`, `GET /admin/roles*`, `GET /admin/permissions`, `GET /admin/scopes` | ALLOW | DENY-PAGE | DENY-PAGE | ALLOW (workspace visible; each mutation still re-authorizes) | DENY-PAGE | DENY-PAGE |
| `GET /system/health` | ALLOW (`PERM-HLTH-VIEW`) | DENY-PAGE | DENY-PAGE | DENY-PAGE (Admin role alone is not health authority) | DENY-PAGE | DENY-PAGE |
| `GET /system/backups`, `GET /system/backups/[backupId]` | ALLOW | DENY-PAGE | DENY-PAGE (view not granted) | ALLOW (`PERM-BKP-VIEW`) | DENY-PAGE | DENY-PAGE |
| `GET /quarantine/admin`, `GET /quarantine/admin/[templateId]` | ALLOW (read; lifecycle via P-06 authority) | ALLOW (P-06 authority) | ALLOW (P-06 authority) | DENY-PAGE for lifecycle mutations (Admin-only is not a template authority) | ALLOW list/create-DRAFT only; DENY review/approve/stop/void/supersede | DENY-PAGE (no `PERM-ADM-TEMPLATES`) |
| `GET /approvals`, `GET /approvals/[approvalId]` | ALLOW where assigned | ALLOW where assigned | ALLOW where assigned | DENY-PAGE unless assigned + dual permission | DENY-PAGE unless assigned | DENY-PAGE |
| Forged direct URL with substituted UUID (`01900000-…f1`) | safe 404 / empty, no leak | same | same | same | same | same |

Notes:
- Global operational read does NOT transfer to any mutation.
- `verify-least` proves C-12 "hidden controls + server denial": create/approve/release/void/restore buttons are hidden or disabled in UI, and direct URL/action invocation is denied server-side.
- F-02 negative: Supervisor/Manager/Employee/least are denied on `/admin*`; F-07 negative: non-audit-viewer roles are denied on `/audit` even when data exists.

## 3. Action matrix (server-side, forged-request safe)

| Action (Astro Action / use case) | Owner | Supervisor | Manager | Admin-only | Employee | Least |
| --- | --- | --- | --- | --- | --- | --- |
| `tasks.createTask` / `tasks.transition` | ALLOW with perm+scope+state | ALLOW (Supervisor task perms) | CONDITIONAL (Manager task perms) | DENY-ACTION (`AUTHZ_PERMISSION_MISSING`) | DENY-ACTION except own-draft where granted | DENY-ACTION |
| `quarantine.approveInspection` + `PERM-APR-APPROVE` (P-05) | ALLOW | ALLOW | ALLOW | DENY-ACTION | DENY-ACTION | DENY-ACTION |
| `quarantine.releaseReceiving` (P-05) | ALLOW | ALLOW | ALLOW | DENY-ACTION | DENY-ACTION | DENY-ACTION |
| `laboratory.approve` + `PERM-APR-APPROVE` (P-05) | ALLOW | ALLOW | ALLOW | DENY-ACTION | DENY-ACTION | DENY-ACTION |
| `laboratory.createRetest` / authorize (P-05) | ALLOW | ALLOW | ALLOW | DENY-ACTION | DENY-ACTION | DENY-ACTION |
| `documents.approve` / `void` / `supersede` (P-05) | ALLOW | ALLOW | ALLOW | DENY-ACTION | DENY-ACTION | DENY-ACTION |
| `changeRequests.createForDocumentVersion` | ALLOW (allowlist only) | ALLOW (allowlist only) | ALLOW (allowlist only) | ALLOW (allowlist only; approve still denied) | ALLOW create (allowlist only; approve denied) | DENY-ACTION (no `PERM-CHG-CREATE`) |
| `changeRequests.*` approve/review/return | ALLOW with dual perm | ALLOW with dual perm | ALLOW with dual perm | DENY-ACTION | DENY-ACTION | DENY-ACTION |
| `findings` review/close/void | ALLOW per finding perms | ALLOW per perms (P-05 where approval) | ALLOW per perms | DENY-ACTION | DENY-ACTION (create allowed only where granted) | DENY-ACTION |
| `CloseCapaUseCase` CLOSE (P-04, Supervisor-only) | DENY-ACTION (not Supervisor) | ALLOW (with `PERM-CAPA-CLOSE` + reason + reauth + `CLOSE` signature + version) | DENY-ACTION | DENY-ACTION | DENY-ACTION | DENY-ACTION |
| `quarantineTemplates.*` (P-06/F-10) | ALLOW (authority) | ALLOW (authority) | ALLOW (authority) | DENY-ACTION (lifecycle) | CREATE→DRAFT only; review/approve/stop/void/supersede DENY-ACTION | DENY-ACTION |
| `releaseGovernance.approveRelease` (P-07) | ALLOW (single signer sufficient) | DENY-ACTION | ALLOW (single signer sufficient) | DENY-ACTION | DENY-ACTION | DENY-ACTION |
| `admin.*` (create/update/disable/reset user, role/permission/scope grants) | ALLOW | DENY-ACTION | DENY-ACTION | ALLOW only with explicit `PERM-ADM-*` + version + SoD (self-disable blocked) | DENY-ACTION | DENY-ACTION |
| `system.requestRestore` production | ALLOW (`yazeed` only + reauth + e-sign + exact artifact/build + audit) | DENY-ACTION | DENY-ACTION | DENY-ACTION | DENY-ACTION | DENY-ACTION |
| `system.requestRestore` drill | ALLOW | DENY-ACTION | DENY-ACTION | ALLOW (drill only, `PERM-BKP-RESTORE-DRILL`) | DENY-ACTION | DENY-ACTION |
| Self-approval / self-review (SoD) | DENY-ACTION (`AUTHZ_SOD_VIOLATION`) | same | same | same | same | same |
| Stale `expectedVersion` replay | DENY-ACTION (`CONFLICT_STALE_VERSION`) for all | — | — | — | — | — |
| Inactive / disabled account | DENY-ACTION (`AUTHZ_DENIED`) for all | — | — | — | — | — |

P-04/P-05/P-06/P-07 negatives above are the missing evidence named by Prompt 13
for F-02, F-07, F-10, P-04, P-05, P-06, P-07. Positive paths are proved by the
existing domain/application suites; this matrix binds them to the six C-12
fixtures and to direct-URL + forged-request verification.

## 4. How C-12 is executed

1. Provision: `pnpm verify:fixtures:seed` (non-production guards; `yazeed` untouched).
2. Positive: each persona opens its ALLOW routes; hidden/disabled controls asserted for DENY.
3. Negative direct URL: open each DENY route directly (including substituted-UUID detail URLs) → safe denied/empty, no data leak.
4. Negative forged request: invoke each DENY Astro Action / API directly with `expectedVersion` + `requestId` → stable `AUTHZ_*` / `CONFLICT_*` rejection, no mutation, no leak.
5. Authenticated E2E: `tests/e2e/verification-access.spec.ts` (gated on `QC_VERIFY_*`; skips without fixtures).
6. Server-side unit/integration: `tests/unit/verification/expected-access-matrix.test.ts` +
   `tests/integration/verification/verification-access.test.ts`.
7. Cleanup: `pnpm verify:fixtures:clean` (DISABLES `verify-*`; history preserved).
