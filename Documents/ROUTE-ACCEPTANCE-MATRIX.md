# Candidate-bound route acceptance — QC-ADP26-01

Status: **PARTIAL / NOT VERIFIED / NO-GO**. This is a derived execution
inventory, not a new business policy or a UAT signature.

The current scope is the **88 paths explicitly listed by QC-PAGE-F-001** in
`audit/2026-09-30-ADAPTIVE-PAGE-BY-PAGE-FULL-SYSTEM-AUDIT.html`. The generator
requires one card for every target path and checks its page filename against
the canonical registry. `/404` and `/500` are Astro error conventions outside
that registry; their source-function fallback checks do not prove middleware,
error rendering or authenticated recovery.

Run with the repository's Node 24.20.0 / pnpm 11.25.0 contract:

```sh
node --import=tsx scripts/verification/build-route-acceptance.ts
node --import=tsx scripts/verification/build-route-acceptance.ts --evidence path/to/executions.json
```

The output is `.ci-results/route-acceptance.json`. It binds exact Git SHA,
dirty source fingerprint, source migration head, all migration filenames and
bytes through `schemaDigest`, tool version, audit content digest and a current
build artifact digest. An absent/stale build stays null. Applied schema stays
NOT VERIFIED until separately proven; a current task supporting-proof artifact
can establish local ledger/checksum parity only. Source files are not applied DB proof.
Run again after any tracked or untracked source/document change. The output
directory is excluded by the existing verification identity contract, avoiding
self-referential hashes. No production connection or environment secrets are
read by the generator.

Each page retains its own card's documented states, reads, writes,
transaction/audit/outbox boundary, authority constraints, recovery and
accessibility requirements. The six approved UAT personas come directly from
`tests/fixtures/uat-personas.ts`; fixture grant declarations are not live grant
verification. Admin-only and noncanonical SYSTEM_OWNER actors are additional
negative page-visibility controls, not new UAT participants.

Each persona has separate identifiers for page-access, state-outcome,
direct-denial, transaction-replay, browser-recovery, accessibility and human
UAT. There are **3,696 planning rows**, not an approved acceptance denominator.
Domain-state strings remain card-derived context, not an assertion that every
state/action combination is approved. Applicability for state, direct mutation,
transaction and accessibility rows remains NOT VERIFIED pending route-specific
contract reconciliation. In particular, a read-only/redirect page must not be
given a fabricated POST or blanket N/A. QC/QMS owns that reconciliation and
the open scientific/authority decisions; named acceptance authority remains
under UAT-DD-001. No N/A is emitted by default.

The 2,200 source-function checks cover guest and ACTIVE/INACTIVE/DISABLED
accounts, six personas and two negative identities on every page. They use
`pageAccessDecision` with empty mutation grants deliberately. A source PASS
proves only visibility function behavior. It cannot authorize mutations or
close HTTP, PostgreSQL, E2E, AT or UAT requirements.

## Execution evidence boundary

`evaluateEvidence` rejects stale/missing SHA, dirty fingerprint, source schema
digest/head or build identity, wrong route/persona, unresolved applicability,
missing applied schema binding, missing fixture grants/scopes/state, or absent
command, execution timestamp and expected/observed outcome references.

Direct denial additionally requires a valid existing record and positive read
control, a recognized AUTHZ denial, equal before/after state digests and
unchanged audit/outbox. BAD_REQUEST, missing records and hidden controls cannot
count as authorization proof. A contradictory observed outcome is FAIL.
Evidence assertions must be backed by the referenced raw sanitized artifact;
this validator checks completeness and identity, not the authenticity of
arbitrary JSON or screenshots. It is not a release-evidence provider.

Human UAT always remains NOT VERIFIED here, even with strings claiming a
signature. Only the existing governed server-side UAT acceptance workflow can
verify participants, authority and signatures. N/A requires an already
reconciled scenario with the same contractual reference and named decision
owner. Unknown statuses remain NOT VERIFIED. No readiness scores or page
closures are updated by this tool.

No DB schema change is needed. Page reads/writes/constraints and transaction
owners remain those in the cards and their linked source/use cases/SQL. The
matrix does not move domain writes, audit or outbox into verification code.
Rollback, race, replay, scientific roundtrip, browser recovery, keyboard/AT
and real UAT remain separate evidence obligations when applicable.
