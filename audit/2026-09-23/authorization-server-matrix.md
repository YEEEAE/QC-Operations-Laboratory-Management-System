# Authorization Server Matrix — 2026-09-23

## Status and scope

**State: PARTIAL.** Source review and synthetic-actor use-case tests were run. Real database-backed actors and HTTP writes were not tested: `QC_UAT_DATABASE_URL` and `QC_TEST_DATABASE_URL` are unset, Docker has no running daemon, and the local PostgreSQL 18 `initdb` attempt failed because the host denies shared-memory segments. The owner RBAC decision prohibits mutating production accounts or data. No production request or write was made.

`pageAccessDecision` is a page visibility decision only. It does not grant a mutation. `policy-registry` defines permission/action/entity/state tuples; application use cases additionally check the permission grant, scope, current version, business conditions, SoD, and ceremonies as applicable.

## Persona matrix

| Server-derived persona | Ordinary page/read baseline | High-impact write baseline | Evidence from this run |
|---|---|---|---|
| Employee (`EMPLOYEE`) | Allow on ordinary operational pages | Create/data-entry only where the explicit domain grant and business rules allow; deny controlled approval, release, signing, and administrative writes | Synthetic actor contract PASS; no database actor/HTTP write |
| Supervisor (`SUPERVISOR`) | Allow | P-05 actions only with exact permission/scope/state/version/SoD and required ceremony; P-04 CAPA closure only with its explicit Supervisor grant and full ceremony; P-06 template lifecycle under its specific rules | Synthetic use-case contract PASS; no database actor/HTTP write |
| Manager/QCM (`MANAGER`) | Allow | P-05 actions only with exact checks; final approval/signature at the approved stage; deny P-04 CAPA closure and inspection/lab stage-1 approval | Synthetic contract PASS; no database actor/HTTP write |
| Admin (`ADMIN`) | Allow on ordinary pages | Admin permissions do not confer QC approval or receiving release; P-04/P-05/P-06 authority is denied to Admin alone | Synthetic negative controls PASS; no database actor/HTTP write |
| Unnamed `SYSTEM_OWNER` | Allow on ordinary pages; owner-only health/control-center denied | No named-owner exception; role label alone does not qualify for owner-only paths or P-05/P-06 owner exception | Synthetic negative controls PASS; no database actor/HTTP write |
| Named `yazeed` + active `SYSTEM_OWNER` | Allow | Only explicit named-owner use cases; required permission, scope/state/version/SoD and ceremonies still apply; no direct history/audit rewrite | Synthetic positive controls PASS; no live account mutation or HTTP write |

The page test covers all six identities for ordinary routes and checks owner-only route denial/allow plus inactive-account denial. These are `ActorContext` unit cases, not proof of database identity resolution.

## Positive and negative controls

| Control | Expected server result | Evidence/result |
|---|---|---|
| Active Employee/Supervisor/Manager/Admin/unnamed owner/named owner → ordinary page | `ALLOWED` | `tests/unit/routing/page-access.test.ts`: PASS (synthetic actors) |
| Unauthenticated or inactive actor → protected page | `AUTHENTICATION_REQUIRED` | `tests/unit/routing/page-access.test.ts`: PASS |
| Unnamed `SYSTEM_OWNER` → `/system/health` | `YAZEED_ONLY` | `tests/unit/routing/page-access.test.ts`: PASS |
| Active named `yazeed` owner → `/system/health` | `ALLOWED` | `tests/unit/routing/page-access.test.ts`: PASS |
| P-04 CAPA closure, valid Supervisor with grant/reason/current version/reauth | Write allowed with `CLOSE` signature | `tests/unit/quality/capa-close.test.ts`: PASS |
| P-04 Employee/Manager/Admin/unnamed owner, missing permission, inactive account, bad reauth | Denied before repository write | `tests/unit/quality/capa-close.test.ts`: PASS |
| P-05 authority set | Supervisor/Manager/named owner recognized; Admin and unnamed owner denied | `tests/unit/shared/p05-authority.test.ts`: PASS |
| P-06 template authority set | Supervisor/Manager/named owner eligible; Employee/Admin/unnamed owner denied elevated lifecycle | `tests/unit/quarantine/template-policy.test.ts`: PASS |
| P-06 lifecycle with valid state/reason/version/ceremony | Only defined lifecycle edges accepted | `tests/unit/quarantine/template-state.test.ts` and `tests/unit/quarantine/*`: PASS |
| Two-stage lab approval and final signature | Stage 1 and final authority separated; final ceremony required | `tests/unit/laboratory/*` and `tests/unit/authorization/*`: PASS |
| Expiry/logout/revoked sessions | Subsequent resolution rejected; no protected actor is resolved | `tests/unit/identity/session-service.test.ts` and `session-recovery.test.ts`: PASS |
| Existing/authorized record compared with unknown identifier | Must use a valid persisted record; `BAD_REQUEST` and `RESOURCE_NOT_FOUND` are inconclusive | NOT RUN against PostgreSQL or HTTP; no result counted |
| Concurrent write / stale version / concurrent permission revoke while request is in flight | At most one current-version write; revocation timing must be observed at the server transaction boundary | PostgreSQL integration BLOCKED; not counted |

Focused synthetic-actor suite after the UX change: **24/24 files, 268/268 tests PASS** on Node `24.20.0`. PostgreSQL suite attempt: **3 suites failed during setup**, 1 suite passed; 19 cases skipped. No skipped/setup-failed case is counted as a permission result.

## Findings and changes

- No source path was found where page visibility itself grants write authority. `pageAccessDecision` only checks authentication and owner-only page visibility.
- The reviewed P-04, P-05, and P-06 use cases apply additional permission/record checks. The existing unit controls deny Admin-only and unnamed-owner cases. This is source/unit evidence only, not database-backed actor proof.
- UI copy previously distinguished authorization denial from `RESOURCE_NOT_FOUND`, including text that said a referenced record could not be found. Mutation, admin, and create-form copy now uses the same generic message for these outcomes, avoiding an existence hint in the visible UX. Stale-version and validation copy remain distinct.
- Astro Action responses still retain canonical machine error classes for programmatic handling. This change is specifically to rendered UX copy; it is not a claim that raw API status/code responses are indistinguishable.

## Not verified / required to complete

- Real persisted actors and direct authenticated HTTP reads/writes for the six personas.
- Database-backed ACTIVE/disabled changes, scope changes, permission revocation during an in-flight request, concurrent write races, logout, and expiry against the current migration head.
- A valid persisted target record for every negative control. No malformed-input rejection or missing-record rejection is treated as an authorization denial.

Required environment: isolated PostgreSQL 18 UAT with six actor accounts, valid domain fixtures, and real actor credentials supplied through the established secret mechanism. Do not substitute production.
