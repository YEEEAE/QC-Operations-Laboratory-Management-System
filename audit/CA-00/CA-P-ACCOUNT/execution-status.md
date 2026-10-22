# CA-P-ACCOUNT — execution status

**State: PARTIAL** — CAPA Variant A account overview presentation is implemented locally. Dynamic, authenticated acceptance is not verified; this record does not claim release, authorization acceptance, or WCAG conformance.

## Change boundary

- `/account` retains the existing account facts and guidance, with the approved B layout: account information, password and security, then session in stacked graphite panels. Account facts form a two-column grid that collapses to one column on narrow screens.
- Native POST actions remain `account.changePassword` and `logout`. The page now consumes the existing logout action result: confirmed success follows its supplied `/login` destination; an action error has a safe, visible message; actual submission has one pending status region. No action, policy, API, schema, role, or permission definition changed.
- Password inputs remain blank on a returned response; no credential is copied into markup, storage, or status text. Labels and show/hide names identify current versus new password.
- `PageHeader`, `AppLayout`, Sidebar source, layout shell, existing account facts/copy, and account correction guidance are preserved. No filter, export, role editor, new data, or KPI was added.
- The prior uncommitted `src/pages/404.astro` change was present before this work and was not modified.

## State / transition / guard matrix

| Concern | Reachable states and transitions | Guard / source of authority | Rendered representation and coverage |
|---|---|---|---|
| READ | Request → authorized account view; unauthenticated request → login; expired/revoked session → login with recovery notice | `src/pages/account.astro` checks `Astro.locals.actor`; `GetAccountUseCase` reads by actor ID and requires `PERM-IDN-VIEW-SELF`, matching owner and current version. Middleware resolves/denies the session; login renders `sessionRecoveryCopy`. | Four values from the existing `AccountView`; no secret, grant list, or invented empty state. Source inspected; populated authenticated browser path NOT RUN. |
| FILTER | N/A | This page has no filter controls, register, or filter query contract. | No filter state or UI added. |
| EXPORT | N/A | This page has no export source or action. | No export state or UI added. |
| Password mutation | Ready → submitting/pending → redirect on confirmed result; field error, denied, stale, missing, provider-unconfirmed, or unknown result → rendered response | `ChangePasswordUseCase`: explicit `PERM-IDN-CHANGE-OWN-PASSWORD`, same actor/owner, current account version, current-password verification, then existing credential mutation commit with `requestId`. Server remains authoritative. | Native POST retained. One form alert for form-level failures, field-linked current/new password errors, one pending `role=status`; no automatic retry. Successful existing action destination remains `/login?session=PASSWORD_CHANGED`. Source and focused guard tests run; browser submission NOT RUN. |
| Logout / AUTH | Ready → signing out/pending → existing action destination on confirmed success; action error → safe alert. Authenticated session expiry is handled outside the page. | `LogoutUseCase` resolves/revokes the supplied session when possible and expires the cookie; its existing idempotent behavior is unchanged. Middleware handles session expiry/revocation and `login.astro` displays the recovery notice. | Native POST retained; one logout alert and one pending status region. No login form or auth policy added on this page. Source inspected; browser transitions NOT RUN. |

`AUTH` as a separate login UI machine is **N/A**: `/account` is protected and contains no sign-in controls. The session guard and recovery path remain source-owned as above. Status/error/pending are presentation states only; they do not grant authority.

## Evidence

| Check | Result |
|---|---|
| Focused account UI contract + account use-case + privacy copy tests (Node 24.20.0) | **PASS — 3 files, 11 tests**. The account test repository is in-memory; this is not evidence of a real authenticated route or populated live record. |
| `node node_modules/astro/astro.js build` | **PASS** — Astro server/client build completed. This does not prove authorization or runtime UI acceptance. |
| `node node_modules/astro/astro.js check` | **FAIL, unrelated paths** — 2 unresolved imports in `audit/CA-P-500/{committed-500,workingtree-500}.astro` (`../ui/layouts/BaseLayout.astro`); 128 hints. No reported diagnostic pointed to the account page. |
| `pnpm run test:architecture` | **FAIL, unrelated path** — existing `src/actions/ncr.ts:3` delivery-domain-import violation. |
| `node --import=tsx scripts/architecture/check-route-files.mjs` | **PASS** — canonical route coverage/registry integrity. |
| `~/.venvs/graphifyy/bin/graphify update .` | **PASS** — local graph refreshed; graphify reported existing partial extraction warnings for unrelated files. |
| `git diff --check` | **PASS**. |
| Authenticated same-record before/after browser comparison, real allowed account and real denied account | **NOT RUN** — no authorized account credentials/session were available. No fabricated account values or test fixture were substituted. |
| 320/390/768/1024/1440 rendered checks; keyboard/focus; 200%/400% zoom; forced-colors/reduced-motion; runtime contrast; long-value clipping; axe; sidebar pixel comparison | **NOT RUN** — these require the authenticated, populated account surface. CSS and source contracts alone are not acceptance evidence. |
| Screenshots at the same candidate | **NOT RUN** — no authenticated real-record render was available. The temporary brainstorming preview and its screenshot were deleted at the user's request. |

## Prior functional debt / scope boundary

- Logout action failure/pending was previously not presented by `/account` (CA-03 called out logout failure UX as a gap). This page now presents pending and a safe action-error message and consumes the existing success destination; the underlying action, session authority, and idempotency behavior were not changed. Its browser behavior remains NOT VERIFIED.
- No CA-F-* creation functionality or other schema/API/business-rule work was performed.
- No production connection, commit, push, merge, or deployment was performed.

## Commands

```sh
PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH" \
  node node_modules/vitest/vitest.mjs run \
  tests/unit/ui/account-surface-contract.test.ts \
  tests/integration/identity/account.test.ts \
  tests/unit/ui/privacy-copy-contract.test.ts
PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH" node node_modules/astro/astro.js check
PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH" node node_modules/astro/astro.js build
PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH" pnpm run test:architecture
PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH" \
  node --import=tsx scripts/architecture/check-route-files.mjs
~/.venvs/graphifyy/bin/graphify update .
git diff --check
```
