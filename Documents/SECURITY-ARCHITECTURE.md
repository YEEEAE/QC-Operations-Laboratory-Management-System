# Security architecture addendum: optional Neon Auth JWT verification

## Status

The server has an optional JWT verification adapter and an additive operator-managed subject-link record. Verification is disabled by default and does not replace the application's current password login, `__Host-qc_session` cookie, server-persisted session, CSRF protection, reauthentication, or session-revocation behavior. No external login path is wired. Provider issuer/audience values, each real user binding, and runtime behavior remain unapproved or unverified.

The supplied JWKS endpoint is public key discovery only. It is not a database connection, a user directory, a write API, or proof that a token is acceptable. The adapter does not call it at startup; the first explicit verification request would trigger a fetch only when the feature is enabled and a caller invokes the adapter.

## Verification boundary

`src/modules/identity/security/neon-auth-jwt-verifier.ts` uses the maintained `jose` implementation and accepts only the pinned owner-supplied HTTPS JWKS URL. It uses a remote JWKS resolver with a five-second fetch timeout, a 30-second refresh cooldown, and a ten-minute cache. Requests are GET-only, send a fixed `Accept` header, reject redirects and alternate URLs, and cap JWKS response bodies at 256 KiB.

Before key resolution, the verifier rejects oversized tokens, missing or malformed `kid`, algorithms other than EdDSA, token types other than `JWT`, and token headers that supply `jku`, `x5u`, or an embedded `jwk`. JOSE verification pins the accepted algorithm, exact configured issuer and audience, requires `exp` and `sub`, and applies `exp`/`nbf` validation. All verification and provider-fetch failures return the same safe error without token, claims, endpoint response, or raw JOSE error details.

The adapter returns only the external subject and minimal verified claim metadata, and requires a caller-supplied `NeonAuthSessionPolicy` to resolve an approved local identity and reject inactive or revoked local session context. If that policy is absent or rejects the identity, verification fails closed. The external subject is not a local user id. No external claim may assign `SYSTEM_OWNER`, `MANAGER`, `SUPERVISOR`, any QC permission, or any scope. QC roles and scopes continue to come from the active local user and locally approved grants through `resolveActor`.

## Session and authorization boundary

The existing middleware continues to resolve only the application session cookie through `ResolveSessionUseCase`. The optional verifier is not invoked by middleware or login. A valid signature therefore does not authenticate a QC account or authorize an application request. `NEON_AUTH_ENABLED` controls the server-side verifier; it is not an external-login switch. `LOCAL_PASSWORD_LOGIN_ENABLED` controls the existing password path and defaults to `true`.

`qc.external_identity_links` is a forward-only, additive mapping to an existing QC user. `(issuer, subject)` is unique for the lifetime of the record; a deactivated key stays reserved and cannot silently move to another QC user. Link and unlink actions require `PERM-IDN-MANAGE-USERS`, target scope, an ACTIVE operator, local-password reauthentication (and no forced password change), a non-self target, and CSRF-checked Astro Action submission. Linking is limited to an existing ACTIVE QC account that already resolves to an ACTIVE local role and scoped permission; it records the operator attestation and local approver, and writes the event with the local actor plus the non-secret issuer/subject reference in one transaction. It does not query mutable email, create users, transfer roles/scopes, or support binding the canonical named system owner. Duplicate external identities fail closed. Disabled local accounts are not made ACTIVE by a link; current QC sessions continue to resolve state and permissions from local records.

The operator attestation records an externally reviewed subject reference; this workflow does not prove control of that external identity. Before enabling an external login path, owner-approved policy must define how the external account proves possession, active local role/scope eligibility, external revocation/session freshness, local session creation and rotation, audit semantics, rollback, and merge/rebinding disposition. No external token is accepted by the application request path today.

## Required protected configuration and owner decisions

- Keep `NEON_AUTH_ENABLED=false` (or the matching staging/pilot variable) until the profile is explicitly approved for the integration.
- Keep the existing password login enabled by default. Do not treat the verifier switch as an external login feature flag; external login remains unavailable until its client and session policy are implemented.
- Configure the pinned `NEON_AUTH_JWKS_URL` only in server-side protected settings.
- Obtain the exact `NEON_AUTH_ISSUER` and `NEON_AUTH_AUDIENCE` from the approved provider configuration. Do not infer them from the JWKS URL, token, branch label, or database URL.
- Keep staging and pilot values isolated to their matching profiles; do not reuse production credentials or assume their identity state is isolated without owner provisioning.
- Establish and review the subject mapping and revocation/session transition policy before adding a login or middleware call site.

No JWKS request, token verification, database connection, migration, test, build, lint, browser check, or deployment is part of the implementation evidence for this addendum.

## Astro Actions and JSON API boundary (NDB-08)

### Canonical workflow boundary

QC workflow reads and writes remain on the existing server-side Astro Action namespaces exported by `src/actions/index.ts`: receiving and inspections (`quarantine`), task records (`tasks`), laboratory (`laboratory`), reject records (`rejectReports`), controlled documents (`documents`), approvals (`approvals`), and reports (`reports`). The source inventory contains no separate in-process action namespace, so no such API is invented here. The action handlers parse their declared schemas and call the owning domain use cases. Session actors come from middleware-resolved local sessions; permission and entity scope, state transitions, separation of duties, and current versions are resolved or rechecked by the use case/repository. Do not add parallel `/api` mutations for an operation already represented by one of these actions.

Astro is configured with `security.checkOrigin: true`; session-bound writes use Astro Actions and inherit its origin check. Browser endpoints do not enable CORS. Action-specific request schemas and size limits remain owned by each action and domain; adding an operation still requires an explicit schema and the domain's existing authorization and audit path. A middleware request ID is trace correlation, not by itself a durable idempotency key. Durable replay receipts must be implemented in the owning transaction where the operation's established contract requires them; do not apply a generic wrapper that can commit a receipt separately from the QC write.

### Current `/api` routes

The checked-in API surface is limited to these operational routes; no receiving, inspection, in-process, laboratory, reject, document, approval, or reporting REST endpoint is added by NDB-08.

| Route | Contract and authority |
| --- | --- |
| `GET /api/health/live` | Public liveness only; reports process availability and no QC decision. |
| `GET /api/health/ready` | Public operational readiness; `healthy` or `unhealthy` reflects the canonical readiness probe, not QC acceptance or product release. |
| `GET /api/system/release-identity` | Requires a middleware-resolved actor and `PERM-HLTH-VIEW` through `GetReleaseIdentityUseCase`; returns only server-derived release identity fields. Errors are sanitized problem JSON with stable `code`, `status`, and optional `requestId`. |
| `GET /api/performance-metrics` | Development/test only, explicitly enabled, bearer-token protected, and bound to loopback hostnames; returns process/pool measurements only. Denial is an opaque 404. |
| `POST /api/release-evidence` | Machine-to-machine signed intake only. Requires `application/json` with UTF-8 (no other media parameters or content encodings), no `Origin` header, a body of at most 32 KiB, and the configured signer key ID, timestamp, and HMAC signature headers. There is no CORS grant. The payload's consumed fields are validated by the release-governance use case against signer gate/environment scope and the locked candidate identity; unconsumed extra properties are not persisted. A durable signer/key/nonce claim, append-only evidence row, and audit event are written in one PostgreSQL transaction; duplicate nonce submissions fail with stable `409 EVIDENCE_REPLAY_REJECTED`. Successful responses retain the established body where `status` is the gate result (`PASS`, `PARTIAL`, `FAIL`, or `UNVERIFIED`), not the HTTP status. This is evidence intake only and cannot approve a gate or release a product. |

JSON API responses use UTF-8 JSON, `Cache-Control: no-store`, and `X-Content-Type-Options: nosniff`. The release-identity response adds a `code` field to its existing error object; existing fields and the successful payload are retained. The release-evidence response keeps its established top-level `status` and `code` fields and now includes the request correlation ID on failures. Clients must treat only the documented stable `code` as a machine class and must not parse server exception text.

### Limits and open owner decisions

This route inventory does not establish blanket idempotency for every Astro Action. Existing action/use-case replay guarantees remain operation-specific; any expansion to durable request keys across other commands needs an approved client key contract and transaction-level receipt in each owning repository. No endpoint may accept caller-supplied actor, role, permission, scope, source revision, or eligible transition as authority. Source-level contract edits do not establish runtime behavior, database schema parity, provider signer configuration, or production acceptance.
