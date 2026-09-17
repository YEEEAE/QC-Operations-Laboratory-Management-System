# Authorization / Visibility UI Audit — 2026-09-10

## Scope

Read-only validation against the approved AVD, permission, role, state-machine,
and business-rule documents. The `ui-ux-pro-max` skill was used for the UI review.
No policy, source code, database record, account, or production state was changed.
No mutation or form POST was submitted.

## Evidence

- Anonymous browser checks against local `http://127.0.0.1:4321` sent all tested
  protected routes to `/login?returnTo=...`: `/dashboard`, `/tasks`, `/laboratory`,
  `/approvals`, `/admin`, `/admin/users`, `/system/health`, `/audit`,
  `/ai-advisory`, `/system/backups`, and `/account`.
- Focused UI tests after the fixes: `7` files / `86` tests passed.
- Full unit suite after the fixes: `66` files / `410` tests passed.
- `pnpm typecheck`: passed with `0` errors and `62` existing hints.
- `pnpm test:architecture`: passed.
- `pnpm build`: passed; existing Vite chunk-size and dependency warnings remain.
- Authenticated disposable-persona coverage was **NOT VERIFIED** because the
  required `QC_VERIFY_*` passwords were not present.

## Findings

### F-01 — RESOLVED LOCALLY — ordinary operational navigation is discoverable

Ordinary operational groups no longer use capability filtering in
`src/ui/navigation/navigation.ts`. Sensitive configuration, admin, and health
routes remain capability-gated. `resolveActor()` adds only the approved
read-only operational grants in `src/shared/authorization/visibility.ts`; the
authorization layer still denies inactive accounts and all mutation, approval,
release, health, and admin actions.

### F-02 — RESOLVED LOCALLY — laboratory action workspaces are state/capability aware

`src/pages/laboratory/tests/[labTestId]/index.astro` now derives execution and
review availability from both state and explicit permissions. Retest is not
offered as an actionable link; the page explains that the policy-defined
sequence is unavailable and the original test remains unchanged.

### F-03 — RESOLVED LOCALLY — return-for-correction is review-authorized

`src/pages/quarantine/inspections/[inspectionId]/review.astro` now renders the
return control only when both inspection-return and approval-return permissions
are present. Otherwise it keeps the record readable and gives a safe,
permission-specific explanation without implying that visibility grants action
authority.

### F-04 — RESOLVED LOCALLY — inspection execution is state/capability aware

`src/pages/quarantine/inspections/[inspectionId]/execute.astro` now separates
state eligibility from edit, submit, and resume permissions. Textareas and
buttons are disabled/hidden accordingly, with truthful safe reasons for missing
authority or an incompatible state. Server actions remain the enforcement
boundary.

### F-05 — PASS — direct anonymous route denial is safe in the tested sample

The browser sample redirected to login and preserved a URL-encoded `returnTo`.
No protected content was exposed. Owner/admin route behavior for authenticated
personas remains **NOT VERIFIED**.

### F-06 — PASS — controlled semantic truths are clearly represented

- Receiving separates workflow state, inspection result, and Release System State
  and explicitly states that PASS does not release.
- Backup detail/restore separates backup job success from restore verification and
  keeps production restore denied.
- AI Advisory labels output as advisory-only and forbids official PASS/FAIL,
  approval, rejection, release, or signature.
- Inspection and laboratory surfaces show state/version/context and use safe
  refresh wording for stale/action failure paths.

Evidence: `src/pages/quarantine/receiving/[receivingId].astro`,
`src/pages/system/backups/[backupId]/index.astro`,
`src/pages/system/backups/[backupId]/restore.astro`, and
`src/pages/ai-advisory.astro:12-15,45`.

### F-07 — NOT VERIFIED — authenticated persona matrix and indistinguishable empties

No disposable accounts were seeded and no credentials were available. Therefore
the following are not claimed: ordinary active member, Supervisor, Manager,
Admin-only, SYSTEM_OWNER `yazeed`, inactive account, direct admin/health denial,
owner/admin navigation split, ordinary data read scope, secret-field exclusion,
SoD visibility, stale handling, e-signature, or indistinguishable empty-state
behavior for unauthorized records.

## Required follow-up

1. Run `pnpm verify:fixtures:seed`, authenticated Playwright coverage, and
   `pnpm verify:fixtures:clean` in non-production with disposable credentials.
2. Exercise stale version, SoD, reauthentication/e-signature, rejection/return,
   release, VOID, and restore-denial flows with captured UI outcomes.

## Result

**Partial / fail-closed.** The identified presentation mismatches are fixed
locally and covered by passing source-level tests. Authenticated persona,
database fixture, stale/SoD/e-signature, and indistinguishable-empty-state
behavior remain unverified because disposable credentials were unavailable.
