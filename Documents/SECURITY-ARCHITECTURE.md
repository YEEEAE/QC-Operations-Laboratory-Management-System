# Security architecture addendum: optional Neon Auth JWT verification

## Status

The server has an optional JWT verification adapter. It is disabled by default and does not replace the application's current password login, `__Host-qc_session` cookie, server-persisted session, CSRF protection, reauthentication, or session-revocation behavior. No Neon Auth issuer, audience, token, or user mapping has been approved or runtime-verified by this source change.

The supplied JWKS endpoint is public key discovery only. It is not a database connection, a user directory, a write API, or proof that a token is acceptable. The adapter does not call it at startup; the first explicit verification request would trigger a fetch only when the feature is enabled and a caller invokes the adapter.

## Verification boundary

`src/modules/identity/security/neon-auth-jwt-verifier.ts` uses the maintained `jose` implementation and accepts only the pinned owner-supplied HTTPS JWKS URL. It uses a remote JWKS resolver with a five-second fetch timeout, a 30-second refresh cooldown, and a ten-minute cache. Requests are GET-only, send a fixed `Accept` header, reject redirects and alternate URLs, and cap JWKS response bodies at 256 KiB.

Before key resolution, the verifier rejects oversized tokens, missing or malformed `kid`, algorithms other than EdDSA, token types other than `JWT`, and token headers that supply `jku`, `x5u`, or an embedded `jwk`. JOSE verification pins the accepted algorithm, exact configured issuer and audience, requires `exp` and `sub`, and applies `exp`/`nbf` validation. All verification and provider-fetch failures return the same safe error without token, claims, endpoint response, or raw JOSE error details.

The adapter returns only the external subject and minimal verified claim metadata, and requires a caller-supplied `NeonAuthSessionPolicy` to resolve an approved local identity and reject inactive or revoked local session context. If that policy is absent or rejects the identity, verification fails closed. The external subject is not a local user id. No external claim may assign `SYSTEM_OWNER`, `MANAGER`, `SUPERVISOR`, any QC permission, or any scope. QC roles and scopes continue to come from the active local user and locally approved grants through `resolveActor`.

## Session and authorization boundary

The existing middleware continues to resolve only the application session cookie through `ResolveSessionUseCase`; `LoginUseCase` is unchanged. The optional verifier is exposed from `identityDependencies` but is not invoked by middleware or login. A valid signature therefore does not authenticate a QC account or authorize an application request.

Neon Auth sign-out/revocation behavior for already-issued tokens is not established by this repository. Before any transition, an approved policy must define external-subject-to-local-user binding, active local account checks, revocation/session freshness checks, local session creation and rotation, CSRF/re-authentication behavior, audit semantics, and rollback. No such callback or transition is wired here, so the adapter cannot presently accept an external token for an application request. Existing QC session revocation remains authoritative for current application sessions.

## Required protected configuration and owner decisions

- Keep `NEON_AUTH_ENABLED=false` (or the matching staging/pilot variable) until the profile is explicitly approved for the integration.
- Configure the pinned `NEON_AUTH_JWKS_URL` only in server-side protected settings.
- Obtain the exact `NEON_AUTH_ISSUER` and `NEON_AUTH_AUDIENCE` from the approved provider configuration. Do not infer them from the JWKS URL, token, branch label, or database URL.
- Keep staging and pilot values isolated to their matching profiles; do not reuse production credentials or assume their identity state is isolated without owner provisioning.
- Establish and review the subject mapping and revocation/session transition policy before adding a login or middleware call site.

No JWKS request, token verification, database connection, migration, test, build, lint, browser check, or deployment is part of the implementation evidence for this addendum.
