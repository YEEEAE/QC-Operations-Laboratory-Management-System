# QC-ADP26-26 — capability grants and safe administration reads

**State: PARTIAL.** The source/UI scope is implemented and focused tests pass. PostgreSQL 18 denial snapshots, authenticated role-specific browser coverage, responsive/zoom checks, manual assistive-technology review, and human UAT remain unverified. No database migration or production write was performed.

## Candidate and tool identity

- Candidate HEAD: `7a9ce20b279eb4989639173ebe3b6921268c2b41` on branch `main`; this differs from requested audit HEAD `0b1bb21bb3b4eca77862dbba1da8623044e96355`. Evidence below is bound to the actual candidate, not transferred from the requested SHA.
- Dirty source fingerprint and source migration head: `.ci-results/QC-ADP26-26-source-identity.json` (generated with the project's `evidenceIdentity()`; this output is excluded from its own source fingerprint).
- Starting working tree was clean. Final tracked source/doc changes are locally diffable; no commit, push, merge, deployment, or production migration occurred.
- Node: `v24.20.0`, matching the package engine. Manifest requires pnpm `11.25.0`; Corepack could not read it because its cache path under the home directory is outside the writable sandbox. Tests were run using the installed `node_modules/.bin/vitest` directly.
- Applied schema: **NOT VERIFIED**. Source migration head is recorded in the identity artifact. Candidate build succeeded using the isolated verification flow; `.ci-results/QC-ADP26-26-build.json`, `.ci-results/QC-ADP26-26-build-manifest.json`, and `.ci-results/QC-ADP26-26-release-identity.json` preserve task evidence. Original `.ci-results/build.json`, manifest, run context and `dist` were restored after the build.

## Changed

- Replaced the misleading route/permission helper with `ADMIN_ACTION_CAPABILITIES` and `hasAdminCapability()`. Each visible mutation has its own canonical permission and required GLOBAL presentation scope; the helper is explicitly presentation-only. Actual authorization still belongs to the server use cases.
- Split safe user, role, permission and scope projections from control visibility. User detail reads role/scope projections for active actors regardless of mutation capability; profile, lifecycle, role, scope and role-permission controls are gated independently. Self-change restrictions and protected owner grants remain intact.
- Fixed role permission form capability gating and enhancer selector mismatch. The working submit now has a matching selector, disables duplicate submits, exposes a focused status region, preserves selected grants after a rejected result, and sends POST rather than leaking permission codes in a fallback GET URL.
- Reused human-first state, role and scope labels across administration lists/details and control center, retaining canonical codes as secondary details where useful. Scope values and permission codes remain data, not titles.
- No SQL, write path, database constraint, audit or outbox contract changed. Existing role-permission replacement remains an optimistic-version transaction with audit; role/scope membership updates remain their existing audited transactions. Safe page reads issue projections only. No outbox is required by this presentation-only change. No migration is justified.

## Evidence

| Requirement | Status | Evidence |
| --- | --- | --- |
| Candidate SHA and dirty fingerprint | PASS | Candidate above; `.ci-results/QC-ADP26-26-source-identity.json` |
| Node / package manager | PARTIAL | Node `v24.20.0` verified; pnpm `11.25.0` required by manifest but Corepack cache creation was denied |
| Source schema head | PASS | Current migration filenames in identity artifact; no migration added |
| Applied schema | NOT VERIFIED | No database was available; no applied migration ledger could be read |
| Candidate build identity | PASS | Build `local-7a9ce20b279e`, release `rel-bfe18124b9f68619`, artifact SHA-256 `ed8b8f2e…53c6bb`; exact records in task-specific `.ci-results/QC-ADP26-26-*.json` |
| Production build | PASS | `astro build`, release identity generation, and project build-evidence writer completed on the exact dirty candidate |
| Per-action capabilities and page visibility separation | PASS | `tests/unit/admin/admin-workspace-guard.test.ts`; ordinary admin routes remain ALLOWED for active actors without grants; disabled actors require authentication |
| Positive ASSIGN / view-only denial on existing role | PASS (application unit) | `tests/integration/administration/authorization-use-cases.test.ts`: repository returns an existing active role; permission-less actor is denied before `replaceRolePermissions`; canonical ASSIGN actor reaches repository. This is a use-case test with a repository double, not a PostgreSQL/direct-HTTP proof. |
| Safe self/read projection without mutation | PASS (application unit) | `tests/unit/admin/administration-read.test.ts`: active caller reads own scope projection with no assignment authority and no replace call; safe role reads likewise require no mutation permission |
| Database row/audit/outbox unchanged on denial | NOT VERIFIED | PostgreSQL 18 unavailable; no before/after DB snapshot. No production DB used. |
| `yazeed` protected grants | PASS (source/unit contract) | Existing owner-protection checks in `tests/unit/admin/user-scope-administration.test.ts` and role UI guard; persistence protection was not re-exercised against PostgreSQL in this task. |
| Focused regression tests | PASS | Direct Vitest command on seven files: **55/55 passed**, exit 0. Includes admin capability presentation, safe reads, role/scope use cases, identity admin, page access, and authorization use cases. |
| Astro project check | FAIL (unrelated) | `astro check`: **1 error / 1022 files**, `src/pages/ai-advisory.astro:148` (`requestButton` possibly null/undefined); no diagnostics in changed admin pages or shared authorization/copy files. 113 hints remain. |
| ESLint | PARTIAL | TypeScript files passed; ESLint ignored nine `.astro` files because no matching configuration is registered. |
| Diff whitespace | PASS | `git diff --check` |
| Local browser | PARTIAL | Actual `/admin/users` request redirected to `/login?returnTo=%2Fadmin%2Fusers`. No authenticated test persona/credentials were available, so changed authenticated UI was not rendered. |
| Direct HTTP POST authorization / browser role matrix | NOT VERIFIED | Requires authenticated fixtures and PG-backed app; server mutation actions continue to call the existing guarded use cases. |
| 320/375/768/1440 CSS px, 200% zoom, keyboard and manual AT | NOT VERIFIED | Authenticated page could not be rendered in this environment; no WCAG claim. |
| UAT | NOT VERIFIED | Human acceptance was not performed or signed by an operator. |

Commands and counts:

- PASS: `PATH=/Users/yzydalshmry/.nvm/versions/node/v24.20.0/bin:$PATH node_modules/.bin/vitest run tests/unit/admin/admin-workspace-guard.test.ts tests/unit/admin/administration-read.test.ts tests/unit/admin/user-role-administration.test.ts tests/unit/admin/user-scope-administration.test.ts tests/unit/admin/identity-admin.test.ts tests/unit/routing/page-access.test.ts tests/integration/administration/authorization-use-cases.test.ts --reporter=dot` — 7 files, 55/55 tests.
- PASS: `node scripts/verification/begin-verification-run.mjs`, `node_modules/.bin/astro build`, `node scripts/release/release-id.mjs --artifact dist/server/entry.mjs`, `node scripts/verification/write-build-evidence.mjs` — all 4 exit 0; evidence files are task-specific under `.ci-results/QC-ADP26-26-*`.
- FAIL (unrelated): `node_modules/.bin/astro check` — 1022 files, 1 error at `src/pages/ai-advisory.astro:148`, no diagnostics in changed admin files.
- BLOCKED: `PATH=/Users/yzydalshmry/.nvm/versions/node/v24.20.0/bin:$PATH node_modules/.bin/vitest run tests/integration/system/control-center.test.ts --reporter=dot` — Testcontainers could not find a container runtime; local PostgreSQL 18 bootstrap separately failed at `shmget`.

Fixture binding for application tests: active actor role `ADMIN`; view-only actor has `PERM-ADM-ROLE-VIEW` and `PERM-ADM-PERMISSION-VIEW`; positive actor has global `PERM-ADM-PERMISSION-ASSIGN`; the role test double is `role-1` / `ADMIN` / ACTIVE / version `2`. This is a synthetic repository double, not a database record or authenticated fixture.

## Database and transaction boundary

- Reads affected: safe user list/detail, assigned roles/scopes, role/permission catalogs and role grants. Source uses read projections; no GET path was changed to write.
- Writes affected in UI: create user and optional initial grants, profile/lifecycle, user role/scope grant/revoke, role permission replacement. Their existing use cases remain the authorization boundary. Role-permission replacement updates role version and grants plus audit within one transaction. User role/scope grant/revoke writes and audit use the repository transaction. These are UI affordance changes only.
- Constraints: existing foreign keys/unique active-grant indexes and scope-kind/value checks remain unchanged. Role membership/scope records have no expected-version column; none was invented. Role permission replacement retains role `expectedVersion`.
- Audit/outbox: existing audit writes remain. This task adds no domain mutation and requires no new audit event or outbox message. Rejected DB mutation non-change proof is still open because no PG18 database could start.
- PostgreSQL evidence is BLOCKED: Docker daemon socket was absent; local PG18 `initdb` failed during bootstrap with `could not create shared memory segment: Operation not permitted` (`shmget`). The test database was not initialized, and no shared or production DB was contacted.

## Pages and findings

Source/UI work completed on `/admin`, `/admin/users`, `/admin/users/new`, `/admin/users/[userId]`, `/admin/roles`, `/admin/roles/[roleId]`, `/admin/permissions`, `/admin/scopes`, and `/system/control-center`. All nine remain **PARTIAL** for full acceptance until authenticated HTTP/DB/browser/AT/UAT evidence is collected. The owner-only control center still relies on `pageAccessDecision` and the canonical named-owner check; action permissions do not make that page visible to other actors.

The task prompt calls the capability-grant issue `QC-PAGE-F-026`, citing the role page and user page. The older adaptive report assigns the same identifier to cross-scope search/notifications (`QC-ADP-23`), while its admin cards also list F-026 as a shared linked finding. This identifier collision is retained, not silently rewritten. The admin source subfinding is addressed; the older search/notification finding remains OPEN, and the broader admin route cards remain PARTIAL pending their runtime proof.

## Remaining decisions / blockers

- Identity/RBAC policy owner still needs to reconcile the role matrix and seed grant conflict described in `handoff-QC-ADP26-25.md`. Unresolved grants remain denied; this task does not infer new authority.
- Run the direct crafted HTTP denial against an existing PostgreSQL 18 fixture and capture redacted before/after target row, audit, and outbox state, plus a positive ASSIGN control.
- Render each affected route under the approved active, view-only, ASSIGN-capable and canonical-owner fixtures. Cover responsive widths, 200% zoom, keyboard and manual assistive technology. Obtain human UAT separately.
- Resolve the historical F-026 identifier collision in audit governance before claiming a global finding closed.

No commit or push was created.
