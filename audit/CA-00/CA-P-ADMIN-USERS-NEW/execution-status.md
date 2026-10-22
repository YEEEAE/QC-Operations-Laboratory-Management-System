# CA-P-ADMIN-USERS-NEW — execution record

**Work state: PARTIAL.** CAPA Variant A presentation is updated locally. Authenticated before/after equivalence, live failure/denial workflows, and the full browser accessibility matrix are not verified; do not treat unit tests or build as authorization or release evidence.

## Before / after inventory

| Surface element | Before | After | Contract |
|---|---|---|---|
| Page title and destination | `Create user`; `Back to users` | Same title and destination; purpose now belongs to `PageHeader` | Preserved |
| Account fields | `loginIdentity`, `displayName`, `email`, `temporaryPassword` | Same names, values, constraints, autocomplete, and password input type; grouped under Account details | Preserved |
| Password help | Temporary-password instruction in page lede | Instruction remains and is associated with the password control | Preserved / more explicit |
| Initial role grant | Optional `roleCode` checkboxes if role-assignment capability allows; otherwise safe explanation | Same role list, conditional visibility, no-role states, and values | Preserved |
| Initial scope grant | Canonical `scopeKind` checkboxes and `scopeValue-${kind}` fields; named scopes require values | Same vocabulary, names, values, and required-value behavior | Preserved |
| Submit and cancel | `Create user`; `/admin/users` | Same actions and destinations | Preserved |
| Mutation feedback | One `data-result` region managed by shared mutation helper | Same canonical region; visual spacing/announcement semantics only | Preserved |
| Hidden/version/idempotency fields | None in the original form; request id is server-derived in action context | No new or removed hidden fields; role/scope still have no version | Preserved |
| Sidebar and shell | `AppLayout` owns navigation and behavior | No shell/layout/sidebar changes | Preserved by scope |

## UI state and guard matrix

| Concern / state | Reachability and transition | Guard/source | Evidence |
|---|---|---|---|
| READ — role options available | Server reads active roles only when role assignment is presented | `canCreate && hasAdminCapability(actor, 'assignUserRole')`; `administrationDependencies().listRoles.execute({ actor })` | Source inspection; browser NOT RUN |
| READ — no active roles | Role-grant-capable actor receives the existing “No active roles” explanation | Active-role read returns empty | Source inspection; browser NOT RUN |
| READ — role options unavailable | Existing safe options error is shown only for caught `AppError` | Same conditional role read/catch | Source inspection; browser NOT RUN |
| FORM — idle / validation / submitting | Native required/email validation; JS enhancement enters pending and disables only submit; entries retained except password cleared by existing helper | Native form constraints + `enhanceMutationForm` | Source contract test PASS; browser NOT RUN |
| FORM — create success | Valid action response with record id redirects to that user | `admin.createUser` → `CreateUserUseCase`; result classification remains shared | Action/use-case inspection; live create NOT RUN |
| FORM — denied / authorization changed | Missing create capability renders denial; server-side create and initial grant checks remain authoritative | `hasAdminCapability`; action `requireActor`; use-case `authorize` for manage users, each role, and scopes | Guard tests PASS for capability separation; real negative actor NOT RUN |
| FORM — failure | Existing exact error-class messages cover validation, authorization, dependency, provider, conflict, duplicate, and unknown outcomes through the shared helper | `admin.createUser` and `mutation-interaction.ts` | Existing UI-copy contracts PASS; runtime failure injection NOT RUN |
| FORM — scope value requirement | Named collection kinds require a value when checked; valueless kinds do not; server revalidates | `SCOPE_KINDS`, `scopeRequiresValue`, action schema/use case | Source inspection + guard tests; live POST NOT RUN |
| FILTER | N/A — no filter controls or filtering source on this creation page | Page markup contains no filter control | Static contract test PASS |
| EXPORT | N/A — no export operation/source on this creation page | Page markup contains no export control | Static contract test PASS |
| AUTH as a standalone UI workflow | N/A — no sign-in/reauthentication interaction here; create and grant eligibility are enforced by existing server checks | Action + use case authorization | Source inspection; signed-in/denied browser personas NOT RUN |
| Icon-name state | N/A — this page adds no icon control | Page markup has no icon controls | Source inspection |

## Verification

| Check | Result |
|---|---|
| Focused tests: create-user surface, admin capability guard, UX copy | PASS — 23/23 |
| `pnpm exec astro build` | PASS on final page code |
| `astro check` | FAIL — two unrelated missing imports in `audit/CA-P-500/{committed-500,workingtree-500}.astro`; no reported diagnostic points at this page |
| `pnpm exec prettier --check tests/unit/admin/users-create-form-surface.test.ts` | PASS; `.astro` parser is unavailable for the configured Prettier invocation |
| Contrast calculation (CAPA A token pairs) | PASS: text/panel 12.12:1; secondary/panel 8.71:1; muted/panel 5.60:1; control border/panel 3.29:1; accent/inverse 8.79:1; muted/canvas 7.00:1 |
| Responsive widths 320/390/768/1024/1440 | NOT RUN — no authenticated runtime/data was available for this page |
| Keyboard/focus, 200%/400% zoom, reduced-motion, forced-colors | NOT RUN in the rendered application; CSS retains forced-colors focus handling and adds no motion |
| Matched authenticated before/after comparison and screenshots | NOT RUN — no authorized session or live record/options fixture; no screenshot artifacts retained |
| Authorized and denied real accounts; dynamic active-role record; action success/denial/failure | NOT RUN — source/unit contracts are not substitutes for runtime authority evidence |
| Sidebar before/after comparison | NOT RUN as a browser measurement; its owning component/layout was not changed |
| `graphify update .` | BLOCKED — graphify executable is unavailable in this environment |

## Independent existing debt

No functional repair was made outside this presentation change. Full acceptance still depends on existing mutation-action behavior in the live server, including authenticated native POST/JS-enhanced outcome handling; this task did not alter the action, use case, authorization policy, schema, or API.

## Screenshot cleanup

The temporary visual-companion HTML files and local server are removed/stopped at task close. No image screenshot was captured or retained.
