# Incident quick reference

## First rule

Use the user-visible `requestId` as the support reference. Correlate it through structured logs to `traceId`, then inspect the failing span, dependency, status, and canonical error code. Logs and traces are operational diagnostics; they are not QC Audit, E-Signature evidence, or official PASS/FAIL truth.

## Triage flow

```text
requestId
  → structured log
  → traceId/spanId
  → failing HTTP/application/PostgreSQL/outbox span
  → canonical error code and dependency state
  → current business state / idempotency record when a controlled action was involved
  → QC Audit cross-reference only for the controlled business event itself
```

Do not put passwords, cookies, session tokens, authorization headers, database URLs, provider payloads, or raw stack traces into the incident record. Use the approved operator access path for logs and traces.

## Error handling

- Show the user a safe message and `requestId`; do not expose SQL, filesystem paths, provider errors, or stack traces.
- Treat `409` stale-version/idempotency outcomes as a current-state investigation, not as permission to overwrite.
- Treat `503` as a dependency/readiness problem and preserve the original request correlation.
- A timeout after a controlled write does not prove that the write did not happen. Check idempotency/current state before any retry.
- A failed notification/outbox side effect does not silently undo an already committed business transaction; investigate the side effect separately.

## Controlled action safety

For approval, release, signature, or other controlled actions:

1. Stop blind retries.
2. Use `requestId`, command/idempotency context, current record state, version, and Audit to determine what happened.
3. If the outcome is ambiguous, follow the application recovery contract and current-state checks.
4. Do not change final state from a client payload or use AI output as authority.

`PASS` is not `RELEASED`. A release, approval, or signature must preserve its exact subject/version and server-side authorization/SoD checks.

## Release-related incidents

- **Candidate/build mismatch:** stop promotion; compare the release JSON, exact Git SHA, build ID, migration head/checksum, and artifact checksum with the candidate under review.
- **Dirty/unknown production evidence:** reject the evidence and rebuild from a known committed source. The release verifier intentionally refuses it.
- **Deployment regression:** abort rollout where possible; select code rollback only after schema compatibility is checked, otherwise use a controlled forward fix.
- **Data/integrity or disaster event:** use the approved backup/recovery process. Do not use PITR as an ordinary code rollback.

Verify a candidate locally with actual non-secret values supplied by the environment:

```bash
pnpm run release:verify -- --input dist/release-identity.json --environment ci --build-id <ci-build-id> --artifact dist/server/entry.mjs
```

The placeholder is not a credential and must be replaced by the real candidate build ID. Do not paste secrets into commands, logs, or the repository.

## Closure evidence

Record the incident ID from the approved incident system, request/trace references, affected release identity, timeline in UTC, observed dependency/error codes, current-state checks, Audit references for controlled events, actions taken, and verification after recovery. Do not infer data truth from logs alone, and do not mark the service recovered until the relevant health/readiness and business integrity checks have current evidence.
