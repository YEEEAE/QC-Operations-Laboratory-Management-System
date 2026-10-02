# QC-POST-100-023 handoff

**State: PARTIAL / BLOCKED / NO-GO.** Candidate source repair is local and build-tested; closure criteria are not met.

## Candidate

- Git SHA: `c305f5f6e42e0e876622d39054adc15dd2150f54`
- Source fingerprint at freeze: `9aebdfc8db7f305f283b6f256a21c66d9b6cd06f513452af74c91aa408af11e5`
- Migration source head: `0045_provider_attestation_nonce_replay_guard.sql`
- Local build: PASS, `4a7387e6894a9bf7da6b11e9fd15d5f621e0da9777340470223c799f9f392fcf`
- PostgreSQL 18: BLOCKED before container startup; no applied schema digest, fixture identity, or runtime data were captured.

## Changes

- Analytics compound queries now sort outside the UNION ALL result projection, so PostgreSQL can evaluate numeric casts at a legal query level.
- Approval names remain in the Issue Slip business confirmation row and are omitted from audit metadata. The audit continues to identify the server actor, role, action, subject, and request.
- No migration is required: no table/column/constraint/index changes. Daily Reject retains append-only entries and has no invented approval chain.

## Verification

- Focused Reject Reports unit tests: 26/26 PASS.
- Focused formatting: PASS.
- Local production build: PASS under Node 24.20.0; this is not deployed runtime or release approval.
- Two PostgreSQL integration suites: BLOCKED during Testcontainers setup; 13 cases skipped. No integration assertion ran.
- Authenticated routes, real-record denial, populated SQL/control-query parity, rollback/fault injection, PG18 concurrency, accessibility/manual AT, route owner approval, indicator denominator/policy decisions, provider and human UAT: NOT VERIFIED or BLOCKED.

## Finding disposition

No assigned row or finding is marked CLOSED. All 103 atomic components have an independent status entry in `criteria.json`; evidence-only source observations are not runtime acceptance. No prompt score or readiness percentage is calculated.

## Required next inputs

1. An isolated PostgreSQL 18 runtime or approved disposable PG18 test endpoint and controlled fixture, then rerun the two integration suites and verify exact aggregate/control-query parity, transaction rollback, replay/stale denial and zero side effects.
2. Owner-approved signed authority/policy and scope/denominator/applicability decisions for the mapped indicator, route, report and audit gates.
3. Authenticated route E2E and actual page-owner, accessibility/AT and human UAT evidence for applicable rows.
4. Independent review of this same-SHA packet before any finding/score/gate update.

No production migration, provider change, commit, push, merge or deployment was performed.
