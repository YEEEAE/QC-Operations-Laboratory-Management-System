# QC-100-FINAL-020 — Role-specific daily operation and support guides

**Date:** 2026-09-20 (UTC)
**Candidate:** base HEAD `4d73dd26298e39656634c761d6e157418e53d0ff` + dirty working tree
(includes the uncommitted QC-100-FINAL-019 tree this task was layered on).
**Dirty fingerprint (full tree):** `28f14357adc6e2884e68c9a8682d98eaa11bde9a70d0dc154b89d0e31567a27c`
(computed 2026-09-20T01:50Z at reconciliation time; the untracked artifacts — including this
record — are part of the tree, so any later edit to them shifts the value)
**Task-scoped content fingerprint (this task's files only):**
`944e688ee3ff5c484b5ec0cfd28515664956967c9b4b438c4cd089dbe94dd051`
**Runtime:** Node `v22.22.3` (outside the declared contract — environment limitation, unchanged).
**Build:** `npx astro build` exit 0. **Schema/migrations:** untouched by this task (no migration,
no schema change; source head remains `0031`).
**Evidence timestamps:** commands executed ~2026-09-20T01:44–01:46Z.

> `PASS ≠ RELEASED`. A passing link/route contract is not a release, UAT, security, or
> accessibility claim. Production gates remain 0/19.

## Prerequisites inspected

- `.agents/mind/01-mind-latest.md` (read in full, then again at the relevant sections).
- `AGENTS.md` project rules; skills discovery via
  `rg --files --hidden .agents/skills -g 'SKILL.md'` (374 skills present; the workflow-relevant
  ones are documentation/UX/service-design oriented — consumed, not re-implemented).
- Canons: `Documents/ROLE-MATRIX.md`, `Documents/PERMISSION-MATRIX.md`,
  `Documents/STATE-MACHINES.md`, `Documents/ROUTE-MATRIX.md`,
  `Documents/DOCUMENTATION-INVENTORY.md`.
- Source of truth for authority: `src/shared/routing/routes.ts`,
  `src/shared/routing/route-integrity.ts`, `src/shared/routing/page-access.ts`,
  `src/shared/authorization/{permissions,policy-registry,p05-authority}.ts`,
  `db/seeds/common.ts`.
- Prerequisite/base owners 013 and 019 were reused (policies, starting-data inventory); no rebuild.

## Scoped item results — DONE / PARTIAL / BLOCKED

### Item 1 — Role → start-of-day, primary tasks, handoff, exception recovery mapped to real routes and approved permissions

**State: DONE (local).**
**Changed:** `Documents/ROLE-OPERATING-GUIDES.md` (new).
Each foundation role (Employee, Supervisor, Manager/QCM, Admin) and the named system owner has a
start-of-day route sequence, a primary-task table binding each work item to a canonical route and
its approved permission codes (cited from `db/seeds/common.ts` `FOUNDATION_ROLE_PERMISSIONS`), a
"who acts next" handoff, and an exception-recovery table. Two-stage approval and `PASS ≠ RELEASED`
are stated explicitly; Admin is shown denied at both approval stages. No role, permission, state, or
authority was invented.
**Evidence:** link/registry resolution is enforced by
`tests/unit/ui/help-content-contract.test.ts` (see Item 3); permission citations resolve against
`src/shared/authorization/permissions.ts`.

### Item 2 — In-app help + printable operating guide; troubleshooting, escalation ownership, service interruption; no secrets/raw diagnostics

**State: DONE (local) for implementation, PARTIAL for UI verification.**
**Changed:**
- `src/pages/help/index.astro` (new) — concise in-app guide in the shared shell with
  start-of-day cards, everyday routes, a troubleshooting table (caption + row identity), escalation
  and handoff, and service-interruption steps. Print affordance (`data-print-guide`) plus a
  `@media print` stylesheet that hides the shell chrome and expands links.
- `src/shared/copy/help-content.ts` (new) — reference-only content: route IDs and permission codes;
  it never restates a path or invents a permission.
- `src/shared/routing/routes.ts` — added `RT-HELP-001` `/help` (`AUTHENTICATED`, required file).
- `src/ui/navigation/navigation.ts` — added "Operating guides" to the System group.
- `src/ui/components/icon.ts` — added the semantic `help` icon.
**Evidence:** `npx astro check` → 863 files, 0 errors, 0 warnings, 74 hints;
`npx astro build` exit 0; architecture route/boundary gates pass; help page resolves route IDs via
`getRouteById` and throws on an unregistered ID (build-time, not silent). The help surface renders
no secret value or raw diagnostic; a secret-pattern scan is part of the contract test.
**Unresolved dependency:** authenticated browser + assistive-technology review (`DEP-020-01/02`,
owners 003/006/040) — `NOT RUN`.

### Item 3 — Verify every guide link and instruction against current UI, including denied/read-only states; record unresolved ownership

**State: PARTIAL (static verification DONE; live UI verification BLOCKED).**
**Changed:** `tests/unit/ui/help-content-contract.test.ts` (new).
**Evidence (PASS):** `npx vitest run tests/unit` → **98 files / 731 PASS** (includes the new 16-test
contract). The contract:
- resolves every quick link and every role start-of-day route ID against the canonical registry;
- resolves every backtick route reference in `Documents/ROLE-OPERATING-GUIDES.md` and
  `Documents/SUPPORT-OWNERSHIP-REGISTER.md` through `getRouteByPathname` (no dead links);
- asserts every cited permission code exists in `PERMISSION_CODES`;
- asserts the help route is registered, navigable, and uses a registered icon;
- asserts the printable affordance, print stylesheet, table caption/`scope="row"`, and absence of
  native `confirm/alert/prompt`;
- scans the four task surfaces for secret-like values.
**Denied/read-only states:** documented from source facts (page visibility ≠ mutation authority;
Admin denied in both approval stages; Supervisor holds stage-1 only; `PASS ≠ RELEASED`) and pinned
by assertions. Live observed denial states were **NOT RUN** (no authenticated browser run).
**Unresolved ownership:** recorded in `Documents/SUPPORT-OWNERSHIP-REGISTER.md` — every L1–L3
support row is `UNRESOLVED` with its decision owner (013/026); no real person was assigned, and
the canonical owner is named only where the system itself enforces the identity (`yazeed`).

### Deliverable — Support ownership register and dependency list

**State: DONE (local).** `Documents/SUPPORT-OWNERSHIP-REGISTER.md` (new): functional support tiers,
an ownership register with explicit `UNRESOLVED` naming status, a functional escalation path, and a
12-row dependency list (`DEP-020-01…12`) mapping each external blocker to its owner task.

## Requirement → implementation → evidence → unresolved dependency

| Requirement | Implementation | Evidence | Unresolved dependency (owner) |
| --- | --- | --- | --- |
| Role daily operations mapped to real routes | `Documents/ROLE-OPERATING-GUIDES.md` | route/registry contract test | Live UI walkthrough `NOT RUN` (003) |
| Approved permissions, no invented authority | permission citations in guide + help content | `PERMISSION_CODES` resolution assertions | None for code; live role sessions `NOT RUN` (003) |
| Handoff with "who acts next" | guide §1–§6 + help escalation panel | policy facts (`p05-authority`, `policy-registry`) | Org naming `UNRESOLVED` (013/026) |
| In-app help + printable guide | `src/pages/help/index.astro` | build + typecheck + print contract test | Browser/AT review `NOT RUN` (003/006/040) |
| Troubleshooting / escalation / interruption | help page sections + guide §7–§8 | contract test assertions | — |
| No secrets or raw diagnostics | help page + content module | secret-pattern scan in contract test | — |
| Support ownership + dependency list | `Documents/SUPPORT-OWNERSHIP-REGISTER.md` | register rows `DEP-020-01…12` | Organizational naming (013/026) |

## Evidence status matrix

| Check | Result |
| --- | --- |
| `npx astro check` | PASS — 863 files, 0 errors, 0 warnings, 74 hints |
| `npx astro build` | PASS — exit 0 |
| `npx vitest run tests/unit` | PASS — 98 files / 731 tests |
| `node scripts/architecture/check-route-files.mjs` | PASS — registry integrity |
| `node scripts/architecture/check-boundaries.mjs` | PASS |
| `npx eslint` (changed TS) | PASS (0 errors) |
| `npx prettier --check` (changed TS/MD) | PASS |
| Authenticated E2E of `/help` and cited routes | NOT RUN — owner 003 |
| Accessibility (keyboard/AT/zoom/forced-colors) | NOT RUN — owners 006/040 |
| Integration / concurrency / security suites | NOT RUN for this task (no server-side behavior changed) |
| Human UAT | BLOCKED — external human evidence (owner 004) |
| Production migration / release | BLOCKED — governance gate |

## Scope and safety notes

- No server authorization, scope, state, version, SoD, idempotency, or immutable-evidence rule was
  changed. The new route is read-only guidance with no mutation capability.
- No secrets are present in any artifact; the help surface exposes only role guidance and route
  references.
- No commit, push, merge, deploy, production migration, credential rotation, or paid change was
  performed.
- Preserved unrelated changes from the QC-100-FINAL-019 working tree.

## Handoff

- **Next phase:** live authenticated verification of `/help` and the cited routes (owner 003 with
  006/040 for accessibility), then final reconciliation feeding 012.
- **Required inputs:** a frozen candidate, an authenticated environment with representative
  records, and the DEP-020 external decisions above.
- **Owners to notify:** 002/027 (regression), 003 (E2E), 006/040 (accessibility), 012 (final
  reconciliation), 013/026 (organizational naming and open policy decisions).

**Overall: PARTIAL.** Items 1 and 2 are DONE locally; item 3 is PARTIAL — static route/permission
verification PASS, live UI/AT verification NOT RUN. No `DONE` is claimed for the phase while the
live UI verification dependency is open.

**Ledger entry (concise):** added the role operating guide, support ownership register, `/help`
in-app printable guide, and a route-checked contract test; typecheck/build/unit/architecture/lint/
format PASS; live E2E/AT/UAT remain external dependencies.
