# CA-P-ADMIN-USERS-USERID — User detail design

**Status:** Design approved in conversation; awaiting review of this written specification.  
**Surface:** `/admin/users/[userId]` — detail  
**Design direction:** Option A — read-first record column with a separate action rail.  
**Scope boundary:** Presentation only under CAPA Variant A. No schema, API, business-rule, policy, permission, or Sidebar changes. The CA-F-* creation exception is not applicable to this route.

## 1. Evidence and source boundaries

Inspected the complete current page at `src/pages/admin/users/[userId].astro` (1,153 lines), its imported `PageHeader`, `AppLayout`, and `ConfirmDialog`, the listed authorization/copy/error/client/form modules, the admin action entry point, safe user view, and the user/role/scope application use cases. `audit/CA-05/visual-decisions.md`, `audit/CA-05/execution-status.md`, and `audit/CA-03/state-contracts.md` were read in full.

CA-05 provides the CAPA A color tokens and detail-page adaptation rule, not a page-specific screen design: one record-reading column plus an action panel, collapsing to one column at or below 820px. The selected visual option is a layout proposal derived from that rule; it is not an observed or approved Stitch screen for this route.

The page currently reads the safe user projection, role memberships, scope assignments, and available active roles. It does **not** query a user audit-history feed, activity timeline, raw sessions, password/hash fields, or a role/scope version. Existing audit writes in mutation use cases do not make audit history readable from this page.

No authenticated browser, real-record, before/after, responsive, keyboard, zoom, reduced-motion, forced-colors, contrast, or action-runtime verification was performed during design. These remain implementation/verification gates, not implied evidence.

## 2. Proposed page structure

1. **Record header:** retain the current `PageHeader` and `/admin/users` return link. Promote the existing safe display name and login identity, current account state, and the already-loaded `user.version` into a compact identity header. State text must remain explicit; color is supplementary. The version is the user record version only, never a role or scope version.
2. **Main reading column:**
   - **Account profile facts:** login identity, email, account state, must-change-password flag, and last login.
   - **Profile edit form:** separate from the facts, retaining display-name and email fields, current values, field constraints, version check, stale message, and save action.
   - **Role memberships:** existing role names/codes, protected/view-only/inactive state, targeted removal controls, and the existing assign-role form when its presentation predicate allows it.
   - **Scope assignments:** existing scope kind/value projection, protected/view-only state, targeted removal, assign-scope form, conditional scope-value requirement, and the existing disclosed bulk-replacement form.
   - **Technical record detail:** retain the current disclosure and its user record UUID. Do not expand it into a security or session disclosure.
   - **Audit/history:** **N/A — not sourced by the page or its read dependencies.** Do not add an empty timeline, synthetic history, audit query, or imply that mutation audit writes are readable here.
3. **Action rail:** group existing account lifecycle controls (password reset, state activation/deactivation, session revocation) separately from role/scope membership controls and the existing authority summary. Collapse this rail into the reading flow at ≤820px without changing control order or action eligibility.
4. **Feedback:** preserve one canonical page-level alert for enhanced form failures, one pending/status region per submitting form concern, and the existing dialog-local status/error/stale-refresh regions. Do not clone or relocate a message such that one outcome is announced twice. Keep field labels, accessible names, and action-specific descriptions.
5. **Shell:** use the existing `AppLayout` CAPA A shell. Preserve the Sidebar, its complete structure/appearance/links/order/icons/permission behavior and responsive drawer. Do not add the 264px discovery gutter to page content.

No new page-level facts, KPIs, filters, exports, history, authorization promises, or copy of CAPA A source prose are introduced.

## 3. Before/after preservation inventory

| Existing element | Proposed presentation | Preservation requirement |
|---|---|---|
| PageHeader, display-name H1, login identity/state lede, Back to users | Identity/state/version record header with same return link | Keep English/LTR, sentence case, safe projection only; expose version only as `user.version` |
| Technical record UUID disclosure | Technical details disclosure in main reading column | Retain existing value and disclosure; no secrets/session material |
| Page-level enhanced-action failure and stale refresh | Single page-level canonical alert, visually associated with record content | Preserve exact classified copy, focus, stale-only refresh, no auto-retry |
| Profile facts: login, email, state, must-change-password, last login | Explicit read-only facts block | All five fields remain visible and unchanged in meaning |
| Profile edit: displayName/email | Visually distinct form after facts | Preserve values/required/max lengths/email type/autocomplete/action and `expectedVersion` source |
| Account lifecycle: password reset, activate/disable, revoke sessions | Existing actions grouped in action rail | Preserve separate capability and state checks, current confirmation dialog, password capture/clear lifecycle, and server action payloads |
| Role list, protected marker, inactive/view-only text, remove role | Role memberships section | Preserve all existing role rows and statuses; protected-owner removal stays unavailable in UI and rejected by persistence |
| Assign role with active/unassigned options and optional reason | Separate role form adjacent to membership section | Preserve source-built options, optional reason, actor/self restrictions, no fabricated role/version |
| Scope list, protected marker, view-only text, remove scope | Scope assignment section | Preserve exact scope kind/value and per-grant targeted removal |
| Scope kind/value/reason form | Separate incremental assignment form | Preserve canonical `SCOPE_KINDS`, `scopeRequiresValue`, conditional label/required state, and optional reason |
| Bulk scope replacement disclosure and resulting-set inputs | Keep as secondary disclosure beneath incremental scope controls | Preserve atomic replacement explanation, values, protected checkbox states, and explicit permission/self guards |
| Authority summary: profile/lifecycle/role/scope | Authority summary in rail | Preserve existing presentation predicates and explanatory caveat; never treat it as action authorization |
| ConfirmDialog instances for reset/activate/disable/revoke/remove role/remove scope | Same existing dialogs, unchanged wiring | Preserve labels/descriptions, opener/focus restoration, pending Escape guard, error and stale refresh behavior |
| Error/status regions and JavaScript mutation client | Same existing control IDs/data attributes and single concern-owned feedback | No hidden input, action identity, `expectedVersion`, or request identity loss; do not add client authority logic |
| History feed | N/A | No feed or read use case exists in inspected page sources; creating one is out of scope |
| Filters/export/auth controls | N/A | No such page function exists; do not create UI or tests for a hypothetical feature |

## 4. Guard and action matrix

Presentation predicates below are visibility/usability hints only. Each server use case/action remains the authority and rechecks its own inputs. The matrix records the current source contract; it does not create a new authorization machine.

| Concern/action | Existing presentation condition | Source-side guard / data contract | Version / protected boundary |
|---|---|---|---|
| Read user profile | Authenticated page; safe projection | `GetUserUseCase`: target must exist; actor account must be ACTIVE; `toSafeUserView` excludes credentials and sessions | Returns the user’s own version |
| Read role memberships | User successfully read | `ListUserRolesUseCase`: ACTIVE actor; membership read does not authorize writes | Role grants have no version |
| Read scope memberships | User successfully read | `ListUserScopesUseCase`: ACTIVE actor; membership read does not authorize writes | Scope grants have no version |
| Update profile | `PERM-IDN-MANAGE-USERS` capability and not self | `UpdateUserUseCase`: explicit permission, target USER, exact expected/current version, update + audit | `expectedVersion` required |
| Activate account | Target not ACTIVE and `PERM-IDN-ACTIVATE` | `ActivateUserUseCase`: explicit permission, target state, expected/current version, audit | `expectedVersion` required |
| Disable account | Target ACTIVE and `PERM-IDN-DEACTIVATE` | `DisableUserUseCase`: explicit permission, expected/current version, not self, named-owner safeguard; state change revokes sessions and audits | `expectedVersion` required |
| Reset password | `PERM-IDN-RESET-PASSWORD`, not self | `AdminResetPasswordUseCase`: explicit permission, target USER, expected/current version, credential commit, must-change-password, reset reason; secret stays in the dialog-confirmed client path and is cleared after request | `expectedVersion` required; never render hash |
| Revoke sessions | `PERM-IDN-REVOKE-SESSIONS`, not self | `RevokeUserSessionsUseCase`: explicit permission, server-derived current version, revoke all, audit | UI request does not invent `expectedVersion`; no raw session rows |
| Assign role | Not self, assign-role capability, active role not already assigned | `ManageUserRoleUseCase.assign`: `PERM-ADM-ROLE-ASSIGN`, ROLE entity authorization, not-self business condition; repository persists grant/audit | No role version; no assignment to protected target grant inferred from UI alone |
| Remove role | Not self, remove-role capability, active role, not protected | `ManageUserRoleUseCase.remove`: explicit assignment permission and not-self condition; repository rejects protected canonical owner grant | No role version; canonical `yazeed`/`SYSTEM_OWNER` grant cannot be removed |
| Assign scope | Not self and `PERM-ADM-SCOPE-ASSIGN` | `AssignUserScopeUseCase`: canonical scope kind/value validation, explicit permission, not-self business condition, incremental grant/audit | No scope version; named scope kinds require values, valueless kinds reject values |
| Remove scope | Not self, remove-scope capability, not protected | `RemoveUserScopeUseCase`: canonical kind/value validation, explicit permission, not-self condition; persistence rejects canonical owner GLOBAL removal | No scope version; canonical `yazeed`/GLOBAL grant cannot be removed |
| Bulk replace scopes | Not self, replace-scope capability | `ManageUserScopesUseCase`: rejects self, explicit assignment permission, persistence performs replacement; protected-grant integrity remains repository responsibility | No scope version; retain this existing bulk operation, do not promote over incremental controls |

The current role/scope visibility behavior distinguishes role-read and scope-read authorization failures from successful empty results where their existing route code handles those errors. Do not turn unrelated provider failures into empty arrays or infer an enabled action from a displayed role, status chip, color, or this summary.

## 5. UI state and transition coverage

Only source-backed machines are represented. `READ`, `FORM`, and `DIALOG` apply. `FILTER`, `EXPORT`, and `AUTH` are **N/A** because the page has no page-level filter/export/sign-in operation; the authenticated shell owns sign-in outside this detail route.

| Machine/state | Trigger → next | Guard/effect and display | Evidence status |
|---|---|---|---|
| READ: request | SSR GET → record | Existing route and read dependencies resolve safe projection | Source observed; runtime acceptance pending |
| READ: request | missing user → `/404` | Existing not-found behavior; do not disclose a hidden record | Source observed; runtime pending |
| READ: request | authorization denial → unavailable/denied section | Existing sanitized `User detail is not available` message; do not show projection | Source observed; runtime pending |
| READ: role/scope assignments | successful non-empty read → rows | Show actual memberships and source-backed per-row controls | Source observed; populated record test pending |
| READ: role/scope assignments | successful empty read → empty text | Existing “No roles…” / “No active scopes…” text, never a guessed count | Source observed; empty-state runtime pending |
| READ: role/scope assignments | authorization failure → temporary-unavailable copy | Existing authorization-specific projection text; no fake assignments | Source observed; runtime pending |
| READ: other read failure | source exception → framework error path | Current route rethrows non-authorization failures; do not convert them to empty/zero | Source observed; provider failure evidence not run |
| FORM: idle/editing | valid submit → submitting | Existing Astro Action call; busy form and disabled triggering submit; no duplicate in-flight request | Source observed; runtime pending |
| FORM: editing | invalid submit → editing/validation | Native constraints remain; no fabricated server field errors | Source observed; runtime pending |
| FORM: submitting | success → reload/current record | Reload only after classified success; authoritative values re-read | Source observed; runtime pending |
| FORM: submitting | stale → error + explicit refresh | User version only; no replay against fresh data | Source observed; runtime pending |
| FORM: submitting | authorization/dependency/provider/unknown/duplicate → classified failure | Existing copy, retained non-secret values, canonical page alert; result is not claimed successful | Source observed; each outcome untested here |
| DIALOG: closed | eligible trigger → review | Existing `showModal`, focus into dialog, context/intent; do not change trigger eligibility | Source observed; runtime pending |
| DIALOG: review/error | cancel/Escape → closed | No pending operation; return focus to connected opener | Source observed; runtime pending |
| DIALOG: review | confirm → pending | Existing callback performs one action; pending disables controls; Escape does not close | Source observed; runtime pending |
| DIALOG: pending | repeated confirm/Escape → pending | Duplicate guard; no false cancellation or second invocation | Source observed; runtime pending |
| DIALOG: pending | confirmed success → closed/reloaded page | Close after action success then page reload | Source observed; runtime pending |
| DIALOG: pending | failure → error or stale-refresh state | Dialog-local focused alert; stale alone reveals refresh; no automatic retry | Source observed; runtime pending |

No additional `FILTER`, `EXPORT`, or `AUTH` interface or test path will be built for this page. No artificial client “loading read” state is added to SSR output.

## 6. Interaction and visual requirements for implementation

- Preserve AppLayout, Sidebar and PageHeader contracts; all page content stays inside the existing main region.
- Detail layout: main record column and separate action rail at wide viewports; one column at and below 820px. At 320px, no page-level horizontal overflow, clipped action, or inaccessible form field.
- Keep all interactive targets at least 44px high and secondary text at least 12px. Use existing CAPA A semantic tokens and calculate rendered contrast; do not treat palette selection as contrast evidence.
- Visible keyboard focus must remain at least 2px. Dialogs preserve native modal focus containment and return focus. Long identities, labels, emails, scope values, role names, and errors wrap without clipping.
- Preserve 200%/400% browser zoom reflow, reduced motion, and forced-colors behavior where applicable. Do not add motion solely for the redesign.
- Preserve English/LTR, sentence-case labels, icon accessible names, exact action descriptions, scope terminology, account state semantics, and safe error vocabulary.
- Keep role and scope rows as flexible wrapped lists rather than introducing a table with an untested horizontal-scroll path.
- Avoid reordering actions in a way that changes the meaning of the page or suggests different authorization. If markup order changes for layout, verify DOM/tab order remains understandable.

## 7. Verification plan and evidence gates

After implementation, use the same approved local, disposable data/account and candidate for before/after captures. Never use production or substitute a fake record for a missing authorized populated record.

1. Capture source/DOM inventory before and after for every row in §3; confirm no deleted fields, sections, grants, forms, disclosures, dialogues, links, IDs/data hooks, or mutation payload values.
2. Exercise every reachable action using an authorized account and existing dynamic user record, and the same action before/after. Cover profile update; reset password; activate/disable as state permits; revoke sessions; assign/remove role; assign/remove scope; bulk replace scopes. Denied-account/guard cases use an actual rejected authorization path with the same existing record, not a 404 sentinel. Protected-owner, self-target, non-versioned grants, and action-level guards remain separately source-checked.
3. Cover READ, FORM and DIALOG success/error/pending/stale/denied or empty states when reachable. Preserve all action errors/blockers exactly; do not claim unobserved cases passed.
4. Browser viewports: 320, 390, 768, 1024, and 1440 CSS px. Check keyboard-only traversal, visible focus, all labels and accessible icon names, long values/errors, page overflow and action clipping, 200%/400% zoom, reduced-motion, and forced-colors as applicable.
5. Measure foreground/background contrast on the actual candidate DOM and verify at least 4.5:1 for ordinary text and 3:1 for relevant controls/boundaries. Check target heights and text-size floors in the same captures.
6. Run targeted route/action UI tests and applicable authorization tests, then the project’s Astro build/typecheck and focused tests supported by current runtime. Re-run any affected check after the final edit. `build` or static snapshots do not prove action authority or full acceptance.
7. Keep comparison screenshots in a temporary audit workspace only during review; remove them after verification as requested. Record exact candidate identity, data/account match, dimensions, measured findings, and file cleanup. No screenshot artifacts are retained in the repository.

The target page currently exposes forms with `method="post"` and also enhances them through Astro Actions. This design makes no change to POST/action payload or client behavior. The actual no-JavaScript mutation behavior must be tested rather than inferred from the attribute; any existing functional defect is reported as debt, not repaired unless it is a direct presentation regression within the approved scope.

## 8. Scope, non-goals, and known gaps

- No new history/audit read model, API, schema, endpoint, permission, role, scope, or lifecycle rule.
- No mutation authority derived from color, role labels, status, or a client-side capability summary.
- No expected-version for role/scope grants, no invented request id, and no omission/replacement of a server-generated request identity.
- No exposure of password, password hash, session rows/tokens, provider details, or raw security evidence.
- No change to actions, authorization policy, API/schema, business use cases, persistence, or Sidebar.
- No synthetic empty, unavailable, or loading states to make a state table appear complete.
- No generated screenshots retained after the requested review.
- Existing route-level native POST behavior, actual server-denied account evidence, populated record browser coverage, responsive/accessibility matrix, and contrast measurements are not proven by this design document.

## 9. Self-review

- No placeholders remain in the agreed design; implementation-time evidence is explicitly marked pending rather than represented as completed.
- History is consistently N/A because this page has no history query; existing audit writes are not presented as readable history.
- User version semantics remain separate from unversioned role/scope grants.
- Page presentation predicates are explicitly subordinate to server authorization.
- The chosen detail layout and responsive collapse match the CA-05 adaptation rule; shell/Sidebar remain frozen.
- The specification does not claim any browser, account, accessibility, build, or action verification.
- User requested local work only; this specification is intentionally not committed.
