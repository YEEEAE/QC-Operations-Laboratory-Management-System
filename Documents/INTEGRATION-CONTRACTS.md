# External integration contracts

**Status:** DRAFT — no external provider is enabled. Each contract requires its
own source owner, data/privacy review, and recorded approval before credentials,
network access, or sensitive payloads are introduced. Schema names below are
proposed interfaces, not claims of vendor compatibility.

## Shared envelope

Each inbound envelope has `schema` (stable contract name), `schemaVersion`
(`1.0.0`), `source` (registered source ID and tenant/site scope), `eventId`,
`occurredAt`, monotonic source sequence where the source supports it,
`actor` (source principal plus mapped application identity), `idempotencyKey`,
`payload`, and a detached signature over the canonical envelope excluding the
signature field. Reject unknown major versions, malformed identity, invalid
signatures, and same-key/different-content replays. Authentication and
signature verification are separate controls. Actor mapping records provenance;
it never grants an application permission or business authority.

Audit records contain contract/source IDs, event ID, schema version, actor
mapping outcome, idempotency key digest, payload digest, signature result,
sequence outcome, delivery outcome, correlation ID, and timestamp. They exclude
payloads, credentials, tokens, private keys, and raw provider errors. No secret
may be logged. Business decision state is owned by the QC domain and is never
derived from transport delivery state.

## Per-source contracts

All six contracts inherit the shared envelope and audit rules. Their proposed
authentication, least-privilege, and retention values remain subject to owner
approval; no provider-specific configuration or retention duration is implied.

| Source | Schema/version and identity | Actor mapping | Authentication / least privilege / signature | Idempotency and ordering | Retry / dead-letter | Retention and privacy | Failure mode |
|---|---|---|---|---|---|---|---|
| Laboratory instruments | `qc.instrument-result` 1.0.0; registered instrument ID + lab/site | Instrument service principal → provenance-only instrument actor; authorized human reviewer remains separate | Mutual authentication mechanism is owner-selected; per-instrument ingest scope only; detached signature key registry and rotation are owner-approved | Key: source ID + event ID; persist sequence per instrument; duplicate is idempotent, stale sequence quarantines for review | Transient transport errors retry under approved bounded schedule; exhaustion routes to restricted dead-letter review; policy/limits OPEN | Measurement/equipment-linked confidential QC data; retention duration and evidence/legal hold are owner decisions | Invalid signature/schema/identity is rejected and audited; gap/out-of-order is quarantined; unavailable source remains pending; never silently becomes PASS/FAIL |
| QMS | `qc.qms-change` 1.0.0; registered QMS tenant + record ID | QMS service principal → provenance only; named reviewer mapped only from verified external identity | Owner-approved workload authentication; read/event subscription scope limited to approved QMS records; signed event required | Key: tenant + event ID; record revision is ordering key; duplicate idempotent, revision gap is held | Retry transient delivery; dead-letter exhausted or non-retryable events for controlled reconciliation; policy OPEN | Controlled document/change data; classification and retention per approved QMS record schedule | Unavailable/gap shows pending reconciliation; no change approval or document effectiveness inferred |
| Enterprise identity | `qc.identity-lifecycle` 1.0.0; registered IdP tenant + subject ID | Subject maps to existing account by immutable issuer+subject; no role grant inferred from group/name | Owner-approved OIDC/SAML back-channel or SCIM authentication; only lifecycle claims/scopes; signed assertions and issuer/audience validation | Key: issuer + event ID; version/issued-at ordering; duplicate safe, stale lifecycle event ignored with audit | Retry transient reads/events; dead-letter invalid or exhausted updates for identity-owner review; policy OPEN | Personal identity data; restricted; minimal claims only; retention/deletion governed by identity owner | Provider outage blocks provisioning/suspension sync and shows stale state; local authorization remains authoritative |
| File inspection | `qc.file-inspection` 1.0.0; registered scanner + file object digest | Scanner service principal → scan evidence actor only; no uploader identity substitution | Owner-approved workload auth; scan-only object access; signed verdict bound to immutable file digest and scanner version | Key: scanner ID + file digest + scan run ID; repeat verdict idempotent; changed digest is a new object | Retry transient scanner failures; unavailable/unknown verdict quarantines file; dead-letter requires owner policy | Potentially sensitive file content; restricted; retain minimal verdict/digest metadata per approved file policy | Unknown, timeout, or digest mismatch means quarantined/unavailable, never clean |
| CI evidence | `qc.ci-evidence` 1.0.0; registered CI installation + repository/workflow/run | CI workload maps to repository/workflow provenance only; cannot act as approver | Owner-approved OIDC workload identity; repository/workflow/run read scope only; signed attestation bound to exact commit and artifact digest | Key: installation + workflow run + attempt; commit/run sequence; same attempt idempotent, stale SHA rejected | Retry transient fetch/verification; dead-letter invalid attestations for release-owner review; policy OPEN | Build metadata and security evidence; internal/restricted according to finding content; retention owner-approved | Missing/mismatched SHA, artifact, signer, or unavailable API stays UNVERIFIED; never counts as release approval |
| Alerts | `qc.alert-delivery` 1.0.0; registered receiver + destination ID | Service sender maps to system integration actor; recipient is destination metadata, never actor authority | Owner-approved outbound credentials; send-only scoped destination; signed webhook payload if receiver supports it | Key: alert rule + incident ID + transition; repeated sends deduplicated; sequence by incident transition | Retry under approved schedule; exhaustion dead-letters delivery only; escalation/retention policy OPEN | Operational metadata; exclude record payload and personal data; retention owner-approved | Receiver failure records delivery failure and keeps incident/business state unchanged |

## First sandbox adapter: instrument results

`src/shared/integrations/instrument-sandbox-adapter.ts` is an offline contract
adapter, not a live connector. Tests inject a deterministic signing key and an
in-memory receiver. It validates version/source/event identity and HMAC,
deduplicates exact replays, rejects key reuse with changed content, and holds
out-of-order sequences. It records `deliveryStatus` separately from
`businessDecision: UNDECIDED`; it does not evaluate measurements or write QC
records. No key is configured in application runtime.

Retry delay, exhaustion threshold, dead-letter ownership, retention periods,
privacy schedules, key custody/rotation, actor-to-account mapping, and all live
provider choices remain owner decisions. The sandbox has no external transport
or sensitive test data.
