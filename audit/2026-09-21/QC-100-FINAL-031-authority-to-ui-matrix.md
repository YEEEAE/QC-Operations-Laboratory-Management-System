# QC-100-FINAL-031 — Authority-to-UI matrix and evidence

**State:** PARTIAL. This is a derived audit crosswalk, not a policy source. The approved permissions and state/action policies remain in `Documents/PERMISSION-MATRIX.md`, `Documents/ROLE-MATRIX.md`, `Documents/BUSINESS-RULES.md`, and `src/shared/authorization/policy-registry.ts`.

## Candidate identity

| Field | Value |
|---|---|
| Frozen base SHA before this task | `4d889128052ba66791b2c7a1a0b6e414f3beecfb` |
| Base tree | Dirty before this task: existing `.agents/mind/01-mind-latest.md` edit and untracked 030-B report/SBOM preserved |
| Base source dirty fingerprint | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (empty source/test set; the pre-existing dirty files were Mind/audit evidence and are excluded by the project convention) |
| Final source dirty fingerprint | `bf0472b30db6838a11f186c4cd9c42b410aac783d5e7ee251f3ff5156af85cab` (sorted `path NUL status NUL SHA256(file bytes)` rows joined by LF, then SHA-256; excludes `.agents/mind/**` and `audit/**`) |
| Runtime | Node `v22.22.3` (outside `>=24.20.0 <25`); pnpm `11.25.0` |
| Source migration head | `0033_controlled_document_execution_context` (source only; applied schema not verified) |
| Build/release identity | Build PASS; `rel-61446cc60088de49`, build `local-4d889128052b`, app/service `0.1.0`, release verification `verified: true`, SHA `4d889128052ba66791b2c7a1a0b6e414f3beecfb`; build timestamp `2026-09-20T22:49:53.194Z` |
| Evidence timestamp | `2026-09-20 22:49–22:50 UTC` |

## Requirement → implementation → technical evidence → dependency

| Requirement | Existing/current implementation and UI effect | Technical evidence | Unresolved owner/dependency |
|---|---|---|---|
| Role is not permission; unknown/missing grants deny | `authorize()` requires ACTIVE actor, canonical explicit active grant, registered permission/action/entity/state, matching scope, current version, business condition and SoD. Role labels only explain workflow participation. The `PERMISSION-MATRIX` plus `policy-registry` cover all registered actions; route visibility remains a separate registered decision. | New `effective-action-decision.test.ts` uses a valid lab record for allow, missing/revoked grant, inactive actor, changed scope, invalid lifecycle state and stale version; existing approval authorization matrix exercises direct application-use-case calls and SoD. | 002/027 exact-candidate populated regression; 003 authenticated direct-request role matrix. |
| Every mutation control reflects effective authority; navigation visibility is not mutation authority | Action-specific controls are delivery hints. They must derive from current server actor/record state; the mutation action rechecks in its use case. Admin surfaces use `canAccessAdminRoute`; operational registers keep safe reads while hiding or explaining unavailable actions. Canonical policy rows supply permission + action + entity + allowed state. Scope is evaluated against the concrete entity; no GLOBAL widening is authorized by this crosswalk. | Source trace of `authorize`, `pageAccessDecision`, admin route guard, role operating guide and canonical matrices; central decision regression above. | Full authenticated role/scope/state E2E surface review: 003; accessibility confirmation of denials/read-only guidance: 006/040. |
| Safe read projection remains available where permitted | Ordinary operational reads follow the approved visibility amendment; sensitive identity/session/security fields are excluded. Each domain read use case owns its projection and authorization/scope; dashboards, lists and details do not grant mutations. Route navigation only governs page access, not record action rights. | Existing read-model, safe-projection and route contracts; exact-candidate regressions remain with 002/027. | 002/027 populated database; 003 browser proof for multiple roles. |
| Named-owner protections and owner recovery | Owner-only system routes require ACTIVE + canonical `SYSTEM_OWNER` + `loginIdentity === 'yazeed'`; protected role/scope grants cannot be removed through assignment APIs. Recovery text never offers an Admin override or grants GLOBAL. | Existing `p05-authority`, `admin-workspace-guard`, `user-role-administration` and `user-scope-administration` contracts; named-owner final-approval state negative added here. | 002/027 exact-candidate data-backed recovery test; 003 owner recovery browser run. |
| Expired/revoked session recovery | Protected request with expired/revoked session returns to `/login` with validated local `returnTo` and a session-ended notice. Login must be completed again; password is not retained, and prior POST/action is explicitly not resubmitted. Disabled accounts receive separate support guidance. Server session and action checks remain decisive. | New session-recovery unit contract; existing `SessionService` expired/revoked/disabled session tests; `safeReturnTo` open-redirect contract. | 003 must verify browser recovery and direct-action response behavior; 006/040 applicable keyboard/announcement review. |
| Permission changes update UX without weakening server checks | `resolveActor` reloads current roles/grants from the database for each authenticated request. Thus a subsequent request reflects changed grants. Existing page controls are not cached authority; each mutation remains independently authorized server-side. | Source trace in middleware + application use cases; changing-grant tests in the new decision matrix. | 002/027 transaction/concurrency evidence; 003 browser proof across grant change/revocation. |

## Authority → UI mapping (all action families)

| Action/read family | Effective decision inputs (canonical source) | UI affordance and safe projection | Denial/recovery behavior |
|---|---|---|---|
| Operational read (`VIEW`, assigned/self reads, dashboard/search/report reads) | Active actor; explicit canonical read policy; record and requested scope; safe domain read model. | Keep approved read-only projection visible only through its read use case. A visible route/card does not imply write permission. Never render secret/session/password hashes or raw audit payloads. | Distinguish empty, unavailable and unauthorized without converting provider/authz failure into a false zero; retain non-sensitive context. |
| Create / draft / edit / resume / assign / upload | Explicit domain permission(s); active grant; canonical scope; valid lifecycle state; business constraints; expected version for existing records; SoD when applicable. | Show the form/control only when its server-rendered capability inputs permit it; explain the required domain permission and next responsible role. Keep permitted record projection read-only when mutation is unavailable. | Preserve ordinary entries on denial; refresh/review current record after stale state; never retry a privileged mutation automatically. |
| Submit / review / return / reject / stage-1 approval | Domain permission plus generic approval permission where specified; registered state/action pair; scope/version/SoD; approved source gates. | Name the current workflow stage and next authorized role from approved role guidance. Rejection/return does not imply scientific FAIL or release. | Explain missing authority, stage, source, scope or stale record separately where safe; do not hide server denial behind generic validation. |
| Final approval / e-signature / controlled close / release / VOID / restore | Required domain + generic permission pair, P-04/P-05/P-06 authority, reauthentication/signature ceremony, scope/state/version/SoD, source/hold/business gates and idempotency contract. | Render ceremony only when currently actionable. Clearly name consequence and required authority; PASS remains separate from RELEASED. | No mutation replay after reauthentication or session recovery. Refresh and re-review the current record; a fresh request is an explicit human action. |
| Identity, role, permission, scope and session administration | Explicit identity/admin grant (not Admin role alone), active actor, record scope/state/version, protected-owner grant invariants, incremental grant operation and audit. | Show safe account/role/scope metadata only. Exclude credential/session token values. Owner grants are presented as protected and cannot be removed by UI or action. | Explain the specific missing administration capability; never offer a role escalation or GLOBAL grant as a workaround. |
| System health / owner control center / recovery | Named owner gate on system routes plus each underlying use-case permission and source check. | Owner-only health/control surfaces remain absent/404 for non-owner; ordinary Admin has no universal override. Read projections are safe and operationally bounded. | Deny without revealing owner-private content; contact authorized owner for recovery. |

## Current candidate test fixture cases

Valid `LAB_TEST` record `lab-fixture-031-001`, state `UNDER_REVIEW`, version `4`, domain `LABORATORY`:

- active Supervisor + active `PERM-LAB-APPROVE` scoped to matching DOMAIN → allowed;
- same valid record with no grant or revoked grant → `AUTHZ_PERMISSION_MISSING`;
- inactive actor → `AUTHZ_DENIED`;
- changed requested domain → `AUTHZ_SCOPE_DENIED`;
- invalid record state (`APPROVED`) → `AUTHZ_DENIED`;
- expected version `3` against current version `4` → `CONFLICT_STALE_VERSION`;
- named owner final-approval permission in stage-1 state → `AUTHZ_DENIED`.

These prove the shared server decision on valid domain fixtures. Existing application authorization matrix tests also invoke the approval use case directly for valid authorized/unauthorized records and SoD. They do not replace populated-PostgreSQL or authenticated-browser evidence.

## Item status and handoff

| Item | Work state | Evidence state | Changed paths | Dependency / owner |
|---|---|---|---|---|
| 1. Authority map for actions, safe reads, scopes, lifecycle and owner grants | PARTIAL | PASS for crosswalk and central valid-fixture cases; NOT RUN for every authenticated action surface | This report; `tests/unit/authorization/effective-action-decision.test.ts` | Complete per-surface regression 002/027; 003 browser role matrix; final reconcile 012. |
| 2. Role-aware explanation and session-expiry recovery | PARTIAL | PASS for local session notice/re-entry contract; NOT RUN in browser | `src/shared/identity/session-recovery.ts`, `src/middleware.ts`, `src/pages/login.astro`, `tests/unit/identity/session-recovery.test.ts` | 003 E2E and 006/040 accessibility. No password retention or action replay. |
| 3. Authorized/unauthorized valid records, session lifecycle, scope change, inactive actor, direct requests, owner recovery | PARTIAL | PASS for unit decision/session cases and existing application authorization contracts; BLOCKED/NOT RUN for exact-candidate PostgreSQL + full direct-request/E2E | Both new tests; existing authorization/session tests cited above | 002/027 populated disposable PostgreSQL; 003 direct browser/API actions and owner recovery. |
| 4. Permission changes update controls; protect canonical owner; no GLOBAL expansion | PARTIAL | PASS by source trace/central tests for allow/deny behavior; NOT RUN for browser control refresh | Shared actor resolution and existing owner-grant protection; this report | 002/027 concurrent persistence; 003 permission-change UX; 013/026 if any unresolved grant policy is discovered. |

**Downstream:** send this evidence to final audit 012 and owners 002/027, 003, 006/040. Preserve external human acceptance as an external dependency; it is not executed here. Project score denominator remains 80 and no score is asserted. Next phase is 012 reconciliation after the named technical owners provide exact-candidate results.

## Final technical checks

| Check | Result |
|---|---|
| Focused Vitest selection (new decision/recovery + session service + central authorization + direct approval application + auth middleware) | PASS — 8 files / 34 tests |
| `pnpm typecheck` | PASS — 887 files / 0 errors / 0 warnings / 74 hints; host Node is outside contract |
| Targeted ESLint on changed TypeScript | PASS |
| `pnpm build` | PASS on Node `v22.22.3`; build emitted existing dependency annotation, unused import, and large chunk warnings |
| `pnpm release:verify` | PASS — `rel-61446cc60088de49`, candidate SHA matched |
| `pnpm requirements:check` | PASS — 100 requirements, 34 risks, 20 gaps, 33 decisions, 5 assumptions, 7 mapped domains, denominator 80 |
| `pnpm format:check` | FAIL — the only reported file is pre-existing, untouched `tests/unit/ui/record-journey-contract.test.ts`; targeted TypeScript files were formatted, and Prettier has no Astro parser installed for directly checking `login.astro` |
| Populated PostgreSQL 18 / applied-schema verification | BLOCKED / NOT VERIFIED — owned by 002/027; prior environment lacks container runtime |
| Authenticated browser/direct HTTP authorization, session recovery UX and accessibility | NOT RUN — 003 and 006/040 own these evidence runs |
| Human acceptance / production / release gates | BLOCKED / excluded as external evidence; no completion inferred |
