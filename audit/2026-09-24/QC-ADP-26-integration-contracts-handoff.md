# QC-ADP-26 — Integration contracts and delivery/business decision boundary

**Finding:** `QC-PAGE-F-029`  
**Candidate:** `13a1a9025b4871b5b9d5f50015e6418d09a474dc` plus the local changes listed below  
**Source migration head:** `0042_immutable_lab_equipment_usage` (42 source migrations)  
**Outcome:** `PARTIAL / BLOCKED / NO-GO`

## Result

The local instrument sandbox contract is stricter and has focused regression
coverage. It remains offline, in-memory, and disconnected from laboratory
actions. The external integration contract remains `DRAFT`: source-owner,
privacy, retry/dead-letter, retention, and provider/receiver approvals are not
recorded. No external provider was contacted or enabled, and no QC business
decision was created by the adapter.

## Source trace and local changes

- `Documents/INTEGRATION-CONTRACTS.md` remains explicitly `DRAFT` and defines a
  proposed shared envelope, audit projection, and per-source failure boundary.
- `src/shared/integrations/instrument-sandbox-adapter.ts` now checks the
  configured source, site, and sandbox actor principal; verifies the canonical
  HMAC; keys accepted events by source/site/event; rejects changed event or key
  reuse; quarantines sequence gaps; and records correlation ID, record time,
  keyed digests, signature/actor/sequence/delivery outcomes, and
  `businessDecision: UNDECIDED`.
- The acceptance map and sequence cursor are process-local only. The adapter
  writes only through an injected audit callback, has no external transport,
  and is not imported by `src/actions/laboratory.ts` or the execution page.
- `src/modules/system-health/infrastructure/postgres-health-probes.ts` counts
  unprocessed outbox messages, reports a positive backlog as `DEGRADED`, and
  sanitizes probe failure as `UNAVAILABLE`. The health page separates delivery
  status from QC business decisions. This is generic outbox backlog evidence;
  it does not establish provider-specific failure classification, retry
  exhaustion, or dead-letter visibility.
- `/notifications` reads account-scoped in-application notifications; it is
  not an outbound provider receiver. `/ai-advisory` does not send externally
  without the complete approved processing policy and request consent; no
  policy artifact is currently configured.

## Evidence

| Check | Result | Evidence / limit |
|---|---|---|
| Source trace | PASS | Adapter is offline and unreferenced from laboratory action/page; health reads outbox backlog; in-app notifications remain recipient-scoped; AI external processing requires policy and consent. |
| Focused unit/source contracts | PASS | Node 24.20.0, Vitest: 2 files, 11 tests passed. Covers HMAC/tamper, source actor binding, duplicate event and key conflict, sequence quarantine, retryable sandbox failure, audit metadata, and one accepted delivery with all business decisions still `UNDECIDED`. |
| Focused advisory/notifications/laboratory/health tests | PASS | The earlier selected cross-domain run recorded 94 passing tests; its PostgreSQL suites initially could not reach a database from the sandbox. No result from another candidate is reused. |
| Representative PostgreSQL 18.6 integration | PASS (targeted) | Isolated TLS cluster on loopback, with disposable `qc_test` and fresh `qc_e2e` databases; 6 target suites passed: laboratory execution 1/1, lab governance 5/5, durable outbox 1/1, notification delivery/outbox 5/5, in-app notifications 2/2, system health 11/11 (25/25 total). The cluster was stopped and removed. A separate, out-of-scope release-governance provider-ingestion suite failed 2/2 on invalid JSON input and is not evidence about instrument/provider delivery. |
| Authenticated route E2E (role/scope/state/version and negative path) | PARTIAL / FAIL overall | Exact candidate release identity verified and disposable fixtures provisioned. Relevant checks passed: read-only role/scope can reach `/system/health`, `/notifications`, and other intended read surfaces; direct forbidden task mutation preserved state/version; read-only role was denied AI advisory view/invocation. Full harness evidence is `FAIL`: 13 PASS, 26 FAIL, 3 SKIPPED (42 evidence scenarios, including runner configuration); broad failures include 404 recovery-link mismatch and accessibility/keyboard timeouts. See `.ci-results/authenticated-e2e-evidence.json` and `test-results/`. |
| Accessibility / human UAT | NOT RUN | The E2E accessibility suite was attempted but failed as above; no route-bound assistive-technology session or participant UAT was run for this candidate. |
| Static check / formatting | PASS | `astro check`: 989 files, 0 errors, 0 warnings, 88 hints. Prettier formatted the four changed implementation/test/contract files; final focused verification is recorded below. |
| External provider activation | NOT PERFORMED | No approved provider/receiver policy or activation authorization was supplied; no outbound call was made. |

The AI/advisory checks in the selected run use the repository's synthetic/fake
provider harness. They do not count as a live provider test.

## Route handoff

| Route | Finding-specific evidence | Route acceptance |
|---|---|---|
| `/laboratory/tests/[labTestId]/execute` | Source trace and sandbox unit contract PASS; PostgreSQL lab execution 1/1 and governance 5/5 PASS. Execution actions remain the sole write path; adapter is not connected to them. | `PARTIAL / NO-GO`: authenticated execution-route state/version E2E, AT, UAT, and live instrument source remain unverified. |
| `/notifications` | Source trace PASS: account-scoped in-app notices only; PostgreSQL notifications 2/2 and outbox delivery 5/5 PASS. The authenticated read-surface E2E passed for the intended read-only role. | `PARTIAL / NO-GO`: cross-account denial assertion, route AT, and UAT are not closed. Full authenticated harness remains FAIL. External outbound-provider applicability is `N/A` because `src/pages/notifications.astro` renders in-app notifications and has no outbound receiver. |
| `/system/health` | Source trace PASS: pending outbox work degrades health separately from QC decisions; PostgreSQL system-health 11/11 PASS. Authenticated read-surface role/scope E2E passed. | `PARTIAL / NO-GO`: persisted provider-specific failures, exhausted retry/dead-letter state, route AT, and UAT remain unverified. Full authenticated harness remains FAIL. |
| `/ai-advisory` | Source trace PASS; PostgreSQL-independent synthetic advisory contract checks passed; authenticated E2E confirms read-only role is denied view and invocation. No provider call was made. | `PARTIAL / NO-GO`: owner policy and approved live evaluation remain blocked; permitted-role positive journey, AT, and UAT are not verified. Full authenticated harness remains FAIL. |

The route cards in section 25 remain open and explicitly carry these results.
No FAIL, BLOCKED, or NOT VERIFIED item is represented as PASS.

## Decisions required before live integration

The authorized source, QC/QMS, security/privacy, and operations owners must
record the decisions below before credentials, external network transport, or
controlled payloads are introduced:

1. Registered source, tenant/site scope, immutable service principal, actor
   mapping rules, and source sequence/revision semantics.
2. Live authentication and signature scheme, signer registry, key custody,
   rotation/revocation, and canonical serialization/version compatibility.
3. Idempotency scope and the retention/tombstone period needed to prevent a
   replay from creating a second accepted event after archival/deletion.
4. Data classification, allowed fields, minimization, retention/deletion,
   legal hold, and audit evidence retention for each source.
5. Retryable/non-retryable failure classes, bounded schedule and attempt
   limit, dead-letter ownership, operator visibility, and safe replay rules.
6. Approved provider and receiver identity, endpoint, egress/authentication
   scope, payload contract, and explicit activation approval.
7. The owning QC workflow that may consume verified raw observations, including
   reviewer authority and state/version checks. Delivery success or failure
   must never decide PASS/FAIL/HOLD, approval, or release.
8. Health and alert thresholds/recipient policy for pending, failed, or
   quarantined deliveries without exposing payloads or provider error text.

Until these are approved, retry exhaustion, dead-letter handling, durable
idempotency, production source identity, retention, live provider behavior, and
provider-specific health reporting remain `NOT VERIFIED`; sending remains
disabled.

## Closure metric and disposition

The user-specified metric is **NOT CALCULATED**. There is no task-specific,
per-route list of applicable checks, N/A sources, and UAT thresholds frozen and
approved before execution for this candidate. The four route cards retain
BLOCKED/NOT VERIFIED items and remain `NO-GO`.

Applicable `N/A` evidence: outbound provider behavior on `/notifications` is
outside that route's in-app-only source contract (`src/pages/notifications.astro`
and its notification read dependencies); it is still covered by the shared
integration/health boundary. No other required provider, role/scope, PostgreSQL,
accessibility, or human-acceptance check is declared N/A.

## Final focused verification

- Focused adapter/source tests: `11/11 PASS`.
- Targeted disposable PostgreSQL suites: `25/25 PASS` across six route-adjacent
  suites. Separate `release-governance/provider-ingestion` run: `2/2 FAIL` on
  JSON persistence; it is unrelated to the instrument integration boundary.
- Authenticated E2E: harness `FAIL`; evidence records `13 PASS / 26 FAIL /
  3 SKIPPED`. Read-only route access, AI-advisory denial, and forbidden state / 
  version mutation checks passed; broad accessibility and keyboard checks did
  not. Exact route acceptance remains open.
- `astro check`: `0 errors / 0 warnings` (88 hints).
- Route AT, UAT, live provider, and production behavior: `NOT RUN`.

No commit, push, deployment, production migration, or provider activation was
performed.
