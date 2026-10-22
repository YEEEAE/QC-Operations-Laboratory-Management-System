# CA-P-ADMIN-USERS-USERID Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved CAPA Variant A detail layout to `/admin/users/[userId]` while preserving its safe read model, every existing field, guard, action, form/dialog contract, and Sidebar.

**Architecture:** Keep the page’s data loading, Astro actions, capability predicates, client script, and dialogs as the existing server/client behavior. Reorganize only the page presentation into the identity header, a reading column (profile, role grants, scope grants, technical disclosure), and a responsive action rail (lifecycle and authority); add a focused static contract test plus route-level browser verification. No new application/use-case/API/schema/policy/Sidebar behavior is in scope.

**Tech Stack:** Astro 4.16.19, TypeScript, Vitest 5, Playwright, existing CAPA A CSS tokens, existing `ConfirmDialog` and admin action helpers.

---

## Scope and constraints

- Follow `docs/superpowers/specs/2026-10-22-ca-p-admin-users-userid-design.md` as the approved design.
- Modify only the target Astro page, focused test files, and the task’s `audit/CA-P-ADMIN-USERS-USERID/` execution evidence. Update `.agents/mind/01-mind-latest.md` only when closing the task and only with useful current state/evidence.
- Do not modify action/use-case files, authorization policy, schema, API, business rules, Sidebar, shared PageHeader/AppLayout/ConfirmDialog behavior, or CA-F-* creation flows.
- Keep role/scope versionless. Preserve user `expectedVersion` payloads for profile/lifecycle/password changes, preserve request identity generated at the action boundary, and do not introduce client-side authority checks as a substitute for server guards.
- Use only authorized disposable local fixtures. Never connect to production, seed fake records to make a browser scenario look successful, or treat a 404 as a denial test. If a matching populated record or required account is unavailable, record the relevant evidence as BLOCKED/NOT RUN and continue independent checks.
- Capture before/after screenshots only in an isolated temporary evidence directory and delete image files after comparison. Retain only nonsensitive measurements and evidence metadata in the repository.
- No commit, push, merge, deploy, or production write.

## Source-derived preservation checklist

The page currently presents profile facts and profile editing; account lifecycle; safe role memberships and assignment/removal; scope memberships and incremental assignment/removal; bulk scope replacement; an authority summary; a technical UUID disclosure; a page failure alert; enhanced form status; and per-action confirmation dialogs. The page has no audit/history read source, filter, export, or sign-in workflow. Keep history/filter/export/auth marked **N/A** rather than adding features.

Existing source guards to retain:

- `GetUserUseCase`, `ListUserRolesUseCase`, and `ListUserScopesUseCase` require an ACTIVE actor for safe projections; read visibility does not imply mutation permission.
- `hasAdminCapability` controls presentation affordances only. The use cases/actions recheck canonical permissions and conditions.
- Profile update uses `PERM-IDN-MANAGE-USERS` and user `expectedVersion`; activation uses `PERM-IDN-ACTIVATE` plus user version; disable uses `PERM-IDN-DEACTIVATE`, user version, no self-disable, named-owner protection, session revocation, and audit.
- Password reset uses `PERM-IDN-RESET-PASSWORD`, user version, no self-reset, credential commit, and must-change-password. Never render the temporary password outside its existing input or any hash.
- Session revoke uses `PERM-IDN-REVOKE-SESSIONS`, server-derived current user version, and no raw session listing.
- Role assignment/removal use `PERM-ADM-ROLE-ASSIGN`, target/self conditions, and persistence protection of the canonical `yazeed`/`SYSTEM_OWNER` grant. Role grants have no version.
- Scope assignment/removal/replacement use `PERM-ADM-SCOPE-ASSIGN`, no self-scope management, the canonical scope vocabulary/value validation, and persistence protection of `yazeed`/`GLOBAL`. Scope grants have no version.
- Keep the existing READ, FORM, and DIALOG UI behavior. FILTER, EXPORT, and AUTH are N/A for this detail surface.

## Files and responsibility

| File | Responsibility |
|---|---|
| `src/pages/admin/users/[userId].astro` | Add record identity/version presentation and the responsive read-column/action-rail structure. Preserve server reads, IDs/data attributes, form fields, action payload construction, feedback regions, dialog instances, and inline client code. |
| `tests/unit/admin/users-detail-surface.test.ts` | New focused source contract for all preserved fields, section/action hooks, safe projection boundaries, and absence of invented history/API/version behavior. |
| `tests/unit/ui/reflow-320.test.ts` | Extend the existing narrow-screen source contract for the detail layout’s fluid track and ≤820px single-column collapse. |
| `tests/unit/ui/design-governance-contract.test.ts` | Add the user detail page to the phase-owned 12px type-floor ratchet; do not expand the page-level date-formatting scope. |
| `tests/e2e/admin-user-detail.spec.ts` | New authenticated browser checks for a populated existing target, readable/denied affordances, responsiveness, focus/dialog behavior, and reachable actions when configured disposable fixtures exist. Missing fixtures must be reported as NOT RUN/BLOCKED, never passed through a sentinel. |
| `audit/CA-P-ADMIN-USERS-USERID/execution-status.md` | Record exact status, source-derived state/guard matrix, before/after action outcomes, measurements, blockers, pre-existing debt, commands/results, and screenshot cleanup. |

## Task 1: Add the focused page preservation contract

**Files:**
- Create: `tests/unit/admin/users-detail-surface.test.ts`
- Read only: `src/pages/admin/users/[userId].astro`, `src/shared/authorization/admin-workspace.ts`, `src/shared/authorization/p05-authority.ts`, `src/shared/authorization/types.ts`

- [ ] **Step 1: Add tests for the agreed record structure and every existing concern.**

Create the test with these explicit expectations (the focused selector/class names are part of the implementation contract):

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync(
  new URL('../../../src/pages/admin/users/[userId].astro', import.meta.url),
  'utf8',
);

describe('admin user detail presentation contract', () => {
  it('retains the safe account facts, current user version, and record sections', () => {
    for (const fragment of [
      'Record version',
      'Login identity',
      'Must change password',
      'Last login',
      'id="profile"',
      'id="security"',
      'id="roles"',
      'id="scopes"',
      'id="administrative-control"',
      'class="record-layout"',
      'class="record-content"',
      'class="action-rail"',
    ]) {
      expect(page).toContain(fragment);
    }
    expect(page).toContain('user?.version.toString()');
    expect(page).toContain('User record UUID');
  });

  it('preserves form hooks, action dispatches, confirmation IDs, and version payloads', () => {
    for (const fragment of [
      'data-update-user',
      'data-reset-password',
      'data-assign-role',
      'data-assign-scope',
      'data-replace-scopes',
      'data-dialog-open',
      'actions.admin.updateUser',
      'actions.admin.resetPassword',
      'actions.admin.activateUser',
      'actions.admin.disableUser',
      'actions.admin.revokeUserSessions',
      'actions.admin.assignUserRole',
      'actions.admin.removeUserRole',
      'actions.admin.assignUserScope',
      'actions.admin.removeUserScope',
      'actions.admin.manageUserScopes',
      'expectedVersion: version',
      'roleId: String(data.get(\'roleId\'))',
      'kind: String(data.get(\'kind\'))',
    ]) {
      expect(page).toContain(fragment);
    }
  });

  it('keeps presentation guards and protected-grant rules source-bound', () => {
    for (const fragment of [
      "hasAdminCapability(actor, 'updateUserProfile')",
      "hasAdminCapability(actor, 'assignUserRole')",
      "hasAdminCapability(actor, 'assignUserScope')",
      'isProtectedOwnerRoleGrant',
      'isProtectedOwnerScope',
      '!isSelf',
      'SCOPE_KINDS',
      'scopeRequiresValue',
    ]) {
      expect(page).toContain(fragment);
    }
    expect(page).not.toMatch(/scope|role)[^\n]{0,80}expectedVersion/i);
  });

  it('does not invent audit history or render credential/session data', () => {
    expect(page).not.toMatch(/listUserAudit|userAuditHistory|sessionToken|passwordHash/i);
    expect(page).not.toMatch(/actions\.(?:admin\.)?(?:createAudit|listAudit)/i);
  });
});
```

- [ ] **Step 2: Run the new test and verify it fails only on the not-yet-added layout/version contract.**

Run: `~/.nvm/versions/node/v24.20.0/bin/node node_modules/vitest/vitest.mjs run tests/unit/admin/users-detail-surface.test.ts`  
Expected: FAIL because `.record-layout`, `.record-content`, `.action-rail`, and visible user version are not present yet. Existing field/action/safety expectations should pass; if they fail, re-check the test against current source rather than weakening unrelated guard assertions.

## Task 2: Add the record header and read/action columns

**Files:**
- Modify: `src/pages/admin/users/[userId].astro`
- Test: `tests/unit/admin/users-detail-surface.test.ts`

- [ ] **Step 1: Add the user record version to the existing page header.**

Keep the existing title, login identity, account state, and return link. Add visible text using the already computed `version` string (the safe user version); do not derive any version from roles/scopes. Keep status readable without color.

- [ ] **Step 2: Add the reading-column and action-rail wrappers without changing server or client behavior.**

Inside the existing `[data-admin-user]` root, retain the current page-level `.failure` region, then wrap the profile/roles/scopes sections in `.record-content` and the existing security/administrative-control sections in an `<aside class="action-rail" aria-label="Account actions and authority">`. Keep the combined `.record-layout` wrapper. Keep the technical record disclosure in the reading column. Do not add an audit-history section; record its N/A source gap in the execution status.

The resulting hierarchy must be:

```astro
<div class="grid" data-admin-user ...>
  <div class="failure" ...>...</div>
  <div class="record-layout">
    <div class="record-content">
      <!-- existing profile, role-membership, and scope-membership sections -->
      <!-- existing technical-record disclosure -->
    </div>
    <aside class="action-rail" aria-label="Account actions and authority">
      <!-- existing account lifecycle and authority sections -->
    </aside>
  </div>
  <!-- existing ConfirmDialog instances remain under the same data root -->
</div>
```

- [ ] **Step 3: Keep every existing form/dialog/client hook and all form controls byte-for-byte where possible.**

Do not rename IDs, `data-*` selectors, `name` values, action dispatches, modal IDs, labels, descriptions, or request payload construction. Do not introduce an `expectedVersion` for role/scope. Preserve the one page alert, per-form status, and dialog-local feedback in their current owners.

- [ ] **Step 4: Run the focused preservation test.**

Run: `~/.nvm/versions/node/v24.20.0/bin/node node_modules/vitest/vitest.mjs run tests/unit/admin/users-detail-surface.test.ts`  
Expected: PASS. Any action/hook assertion failure is a scope regression; restore the original contract instead of modifying the action boundary.

## Task 3: Apply responsive CAPA A detail styling

**Files:**
- Modify: `src/pages/admin/users/[userId].astro`
- Test: `tests/unit/admin/users-detail-surface.test.ts`
- Reference: `audit/CA-05/visual-decisions.md`

- [ ] **Step 1: Define the two-column detail layout with a constrained action rail.**

Use existing semantic tokens only. The implementation must be equivalent to:

```css
.record-layout {
  display: grid;
  grid-template-columns: minmax(min(100%, 44rem), 1.7fr) minmax(17rem, 0.8fr);
  gap: var(--space-5);
  align-items: start;
}
.record-content,
.action-rail {
  display: grid;
  gap: var(--space-5);
  min-inline-size: 0;
}
.action-rail {
  align-content: start;
}
@media (max-width: 820px) {
  .record-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
```

Retain `.panel` styling and existing content spacing; add no 264px gutter. Verify the `minmax` track remains shrinkable and that long role/scope values wrap.

- [ ] **Step 2: Raise page-local text and interactive targets to the CA-05 floors.**

Page-local secondary copy must be at least 12px. Buttons, links, inputs, selects, summary controls, and any new header control must be at least 44px high. Use the already established focus token/ring and existing accent-on-accent text role; do not use raw hex or infer contrast from the token table.

- [ ] **Step 3: Run the focused source and layout ratchets.**

Run: `~/.nvm/versions/node/v24.20.0/bin/node node_modules/vitest/vitest.mjs run tests/unit/admin/users-detail-surface.test.ts tests/unit/ui/reflow-320.test.ts tests/unit/ui/design-governance-contract.test.ts`  
Expected: PASS with no page-level fixed minimum width, no new sub-12px page text, and an explicit ≤820px collapse.

## Task 4: Add populated-record browser evidence for READ, FORM, and DIALOG

**Files:**
- Create: `tests/e2e/admin-user-detail.spec.ts`
- Modify: `src/pages/admin/users/[userId].astro` only if a directly related presentation defect is demonstrated; never to add policy/API behavior.
- Evidence: `audit/CA-P-ADMIN-USERS-USERID/execution-status.md`

- [ ] **Step 1: Bind the browser scenario to existing disposable fixtures.**

Use the existing Playwright project server and `QC_E2E_ADMIN_LOGIN_IDENTITY` / `QC_E2E_ADMIN_PASSWORD` fixture contract. Require `QC_E2E_USER_DETAIL_USER_ID` to point to an existing dynamic record different from the actor; use the established employee/least fixture to test view-only/denied presentation. Never use a made-up ID, a 404 sentinel, production credentials, or direct SQL insertion. If the environment cannot provide an authorized target or a true denied action, mark that evidence NOT RUN/BLOCKED.

- [ ] **Step 2: Verify the authorized populated READ state and page structure.**

Assert the actual target identity/state/version, all five profile facts, current role/scope rows, the authority copy, the UUID disclosure, safe omission of password/hash/session material, no History UI, and intact Sidebar. Assert roles/scopes show actual rows or source-backed empty copy, not inferred values.

- [ ] **Step 3: Verify layout and focus behavior at every requested viewport.**

At 320/390/768/1024/1440px, assert `documentElement.scrollWidth <= innerWidth + 1`, no clipped action, 44px minimum interactive target, 12px minimum secondary copy, and single-column behavior at/below 820px. Tab through the page and check focus is visible; open/cancel each available dialog by keyboard and confirm focus return. Test long real identity/email/role/scope text when it exists in the authorized fixture.

- [ ] **Step 4: Exercise every reachable route action on an isolated disposable record.**

For each of update profile, reset password, activate, disable, revoke sessions, assign role, remove role, assign scope, remove scope, and bulk replace scopes, record the source-backed eligibility before attempting it; use only actual available active roles/canonical scope kinds; confirm through the existing dialog where present; then verify the saved server result or exact classified error and read the same record again. Compare the same action against the same record/account/data before and after the presentation change. Restore or discard the fixture only through the established authorized fixture lifecycle; never clean up using direct SQL or an unapproved server-side shortcut. If an action is unsafe to restore, use a fresh disposable fixture made through the approved fixture process or record the case BLOCKED.

- [ ] **Step 5: Verify denied-account presentation and a real server-side rejection.**

On the same existing user record, use the established active least-privilege account to verify safe read visibility and that privileged controls are absent. Separately exercise a denied mutation through the existing guarded action/use case and require the authorization denial, not a missing-record response. Confirm protected owner role/GLOBAL grant controls cannot be used to remove those grants; use source-backed protection and existing use-case/persistence tests if a suitable real fixture is not available.

- [ ] **Step 6: Verify form/dialog result states without changing their machines.**

For each reachable FORM/DIALOG concern, record pending, successful result, validation or denied result, and stale result where the relevant user-version action supports it. Role/scope do not receive stale-version tests because they are unversioned. Confirm dialogs keep Escape blocked while pending, return focus on cancellation, retain the existing action-specific error, reveal refresh only for stale, and do not automatically retry. Do not fabricate server failures by changing domain rules.

- [ ] **Step 7: Measure contrast, preferences, and screenshot cleanup.**

Measure rendered text/control pairs on the candidate DOM; require ≥4.5:1 ordinary text and ≥3:1 relevant non-text boundaries. Test 200% and 400% zoom, `prefers-reduced-motion`, and forced-colors where the browser supports them. Capture matched screenshots only in an external temporary folder, compare with identical data/account/viewport, then remove every image file and confirm the project has no screenshot artifact.

- [ ] **Step 8: Run the authenticated route spec only when fixtures are configured.**

Run: `pnpm exec playwright test tests/e2e/admin-user-detail.spec.ts`  
Expected with valid disposable fixtures: route/action checks pass and produce candidate-bound measurements. Without required fixture identity/credentials: test is explicitly skipped or marked blocked, not reported as PASS.

## Task 5: Record evidence and run final focused checks

**Files:**
- Create: `audit/CA-P-ADMIN-USERS-USERID/execution-status.md`
- Modify: `.agents/mind/01-mind-latest.md` only on task closure and when there is useful new current state/evidence.

- [ ] **Step 1: Record a before/after inventory and state/guard matrix.**

For each entry in the spec’s preservation table, record `PRESENT BEFORE`, `PRESENT AFTER`, or a precisely sourced `N/A`. For READ/FORM/DIALOG, record source state, expected guard, actual account/record, observed transition, and evidence status separately. Mark FILTER/EXPORT/AUTH N/A with the source-based reason. Record history N/A because there is no page history read source.

- [ ] **Step 2: Record every action outcome and all blockers.**

For all ten action IDs, record before/after reachability, authorized result, denied result when relevant, target record key in a redacted or safe test-only form, and cleanup result. Record non-run cases as NOT RUN or BLOCKED with the exact missing prerequisite. Include pre-existing functional debt separately and do not fix it in this presentation task.

- [ ] **Step 3: Run the final focused unit/route checks on the last candidate.**

Run:

```sh
NODE=$HOME/.nvm/versions/node/v24.20.0/bin/node
$NODE node_modules/vitest/vitest.mjs run \
  tests/unit/admin/users-detail-surface.test.ts \
  tests/unit/admin/admin-workspace-guard.test.ts \
  tests/unit/admin/user-role-administration.test.ts \
  tests/unit/admin/user-scope-administration.test.ts \
  tests/unit/admin/identity-admin.test.ts \
  tests/unit/ui/reflow-320.test.ts \
  tests/unit/ui/design-governance-contract.test.ts \
  tests/unit/ui/mutation-safety-contract.test.ts
$NODE node_modules/astro/astro.js check
$NODE node_modules/astro/astro.js build
git diff --check
```

Expected: focused unit tests PASS; typecheck/build results recorded verbatim with known unrelated baseline failures distinguished from new failures; `git diff --check` PASS. Do not claim a browser, authorization, or accessibility gate passed solely from these commands.

- [ ] **Step 4: Refresh the project knowledge graph and inspect final scope.**

Run `graphify update .` after the Astro page changes. If the graph CLI is unavailable, record BLOCKED without installing tools or modifying graph output manually. Check `git status --short` and `git diff --` to confirm only the permitted page, tests, evidence and conditional Mind changes exist. Never stage or commit.

- [ ] **Step 5: Close the task with an honest status.**

Set the execution record to DONE only if the requested page change and all required evidence are complete; otherwise PARTIAL or BLOCKED with exact gaps. Add one concise current-date entry at the top of the Mind ledger only if the state changes or a blocker/evidence fact is useful later. Do not copy full test output into Mind.

## Plan self-review

- **Spec coverage:** record identity/version, every existing field/section/form/dialog/action, safe projection, roles/scopes/relationships, N/A history/filter/export/auth, canonical feedback, responsive CAPA A layout, Sidebar invariance, accessibility, real authorized/denied account requirements, action-level before/after, screenshot cleanup, evidence matrix, and local-only boundary all have explicit tasks.
- **Source scope:** only one page, focused unit/E2E tests, an execution record, and conditional Mind state are named. No API, schema, business policy, action/use-case, or Sidebar edit is planned.
- **Version consistency:** user version applies to profile/lifecycle/password actions only; role/scope remain unversioned; session revoke does not invent a client expected version.
- **No placeholder claim:** browser evidence requires existing disposable records/accounts and turns missing prerequisites into NOT RUN/BLOCKED; it does not synthesize a passing record.
- **No commit step:** local commit is not authorized by the user, so the usual plan commit task is intentionally omitted.
