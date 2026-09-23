# Authorization Server Matrix — 2026-09-23

## Status and scope

**State: PARTIAL.** Docker/Testcontainers was available for isolated verification after startup. PostgreSQL-backed integration and an authenticated disposable HTTP E2E run completed; no production URL, account, request, or write was used. The authenticated E2E report is `FAIL` overall because accessibility checks failed (see below), so it is not a clean suite pass. Real authenticated HTTP write authorization on an existing persisted target, in-flight permission revocation, and a true concurrent business write remain unverified.

`pageAccessDecision` is a page visibility decision only. It does not grant a mutation. `policy-registry` defines permission/action/entity/state tuples; application use cases additionally check the permission grant, scope, current version, business conditions, SoD, and ceremonies as applicable.

## Persona matrix

| Server-derived persona | Ordinary page/read baseline | High-impact write baseline | Evidence from this run |
|---|---|---|---|
| Employee (`EMPLOYEE`) | Allow on intended operational read pages | Create/data-entry only where explicit domain grant and business rules allow; deny controlled approval/release/signing/admin writes | Disposable authenticated HTTP read PASS; write denial probe used invalid UUID and is INCONCLUSIVE. Use-case tests PASS |
| Supervisor (`SUPERVISOR`) | Allow on intended operational read pages | P-05 exact permission/scope/state/version/SoD/ceremony; P-04 explicit Supervisor grant and ceremony; P-06 lifecycle rules | Disposable authenticated HTTP read PASS; write denial probe used invalid UUID and is INCONCLUSIVE. Use-case tests PASS |
| Manager/QCM (`MANAGER`) | Allow on intended operational read pages | P-05 exact checks and approved final stage; deny P-04 closure and stage-1 approval | Disposable authenticated HTTP read PASS; write denial probe used invalid UUID and is INCONCLUSIVE. Use-case tests PASS |
| Admin (`ADMIN`) | Allow on intended operational read pages | Admin grants do not confer QC approval/release; P-04/P-05/P-06 authority denied to Admin alone | Disposable authenticated HTTP read PASS; write denial probe used invalid UUID and is INCONCLUSIVE. Use-case tests PASS |
| Unnamed `SYSTEM_OWNER` | No supported actor should be assignable; owner-only exception denied | Role label alone never qualifies for named-owner paths | PostgreSQL persistence test PASS: assigning SYSTEM_OWNER to a persisted non-yazeed user returns `AUTHZ_DENIED`; page/action actor exercise not run because the supported write path refuses to create this actor |
| Named `yazeed` + active `SYSTEM_OWNER` | Allow on intended operational read pages, including owner-only health | Only explicitly named-owner use cases; remaining scope/state/version/SoD/ceremonies apply | Disposable HTTP persona `yazeed` read PASS; it is a fresh test DB owner, not the production account. Write denial probe used invalid UUID and is INCONCLUSIVE |

The authenticated browser scenario passed for the seeded disposable Employee, Supervisor, Manager, Admin, and `verify-least` identities on their intended pages; the `yazeed` persona passed `/dashboard`, `/admin`, and `/system/health`. The disposable least-privilege actor reads additional operational surfaces. These are real sessions resolved by the server against a temporary PostgreSQL database. They do not cover an HTTP mutation against an existing valid record. The unnamed-owner database negative control proves the persisted grant boundary, but is not an HTTP page test.

## Positive and negative controls

| Control | Expected server result | Evidence/result |
|---|---|---|
| Active Employee/Supervisor/Manager/Admin/named owner → intended pages | HTTP 2xx | `tests/e2e/authenticated-closure.spec.ts` persona/read scenarios: PASS (disposable PostgreSQL-backed sessions) |
| Unnamed owner candidate account → assign `SYSTEM_OWNER` | `AUTHZ_DENIED` | `tests/integration/identity/identity-rbac-postgres.test.ts`: PASS, persisted non-yazeed user and real PostgreSQL constraint/repository path |
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
| Employee/Supervisor/Manager/Admin/named owner → direct write against an existing allowed/denied record | Domain-specific success or `AUTHZ_DENIED`; a valid record must exist | NOT RUN. E2E probe used an invalid UUID and its 4xx is explicitly excluded as authorization evidence |
| Existing/authorized record compared with unknown identifier | Must use a valid persisted record; `BAD_REQUEST` and `RESOURCE_NOT_FOUND` are inconclusive | NOT RUN for authenticated HTTP; no result counted |
| Concurrent role/scope grants | One effective assignment and preserved audit | `tests/integration/identity/identity-rbac-postgres.test.ts`: PASS with simultaneous persisted writes |
| Concurrent business write / stale version / permission revoke while a request is in flight | At most one current-version write; revocation timing observed at server transaction boundary | NOT RUN; no result counted |
| Logout/session revoke/expiry | Subsequent request resolves no protected actor | Authenticated E2E logout PASS; PostgreSQL disable/reset/session-revoke integration PASS; exact HTTP expiry not tested |

Focused synthetic-actor suite after the UX change: **24/24 files, 268/268 tests PASS** on Node `24.20.0`. Docker PostgreSQL run: **4 suites, 21/21 tests PASS**. Playwright reported **15 passed, 21 failed, 1 skipped, 2 did not run**; the evidence wrapper also records its `RUN_CONFIG` check, yielding **16 PASS, 21 FAIL, 3 skipped/not-run**. Role/persona read and logout checks passed, but the accessibility run failed at a missing navigation landmark and subsequent missing saved auth storage state. The authenticated E2E evidence remains `FAIL`, not an overall pass. Failed/skipped cases are not counted as successful authorization results.

## Findings and changes

- No source path was found where page visibility itself grants write authority. `pageAccessDecision` only checks authentication and owner-only page visibility.
- The reviewed P-04, P-05, and P-06 use cases apply additional permission/record checks. The existing unit controls deny Admin-only and unnamed-owner cases. This is source/unit evidence only, not database-backed actor proof.
- UI copy previously distinguished authorization denial from `RESOURCE_NOT_FOUND`, including text that said a referenced record could not be found. Mutation, admin, and create-form copy now uses the same generic message for these outcomes, avoiding an existence hint in the visible UX. Stale-version and validation copy remain distinct.
- Astro Action responses still retain canonical machine error classes for programmatic handling. This change is specifically to rendered UX copy; it is not a claim that raw API status/code responses are indistinguishable.

## Not verified / required to complete

- Direct authenticated HTTP write results against valid persisted target records for each relevant persona.
- Authenticated HTTP tests for permission/scope changes during an in-flight request, current-version business write races, and exact session expiry behavior.
- A valid persisted target record for every negative control. No malformed-input rejection or missing-record rejection is treated as an authorization denial.

Required next fixture: disposable PostgreSQL 18 with valid seeded domain targets (CAPA, inspection/release, template lifecycle and laboratory approval) so each HTTP mutation can prove that the target exists before interpreting a denial. Continue using generated disposable actor credentials; unnamed SYSTEM_OWNER must remain a denied role assignment, not a fabricated authorization grant. Do not substitute production.
