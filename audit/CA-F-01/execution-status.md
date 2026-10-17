# CA-F-01 — NCR creation from Finding

2026-10-17 · Candidate base `c450b2b67b1feace7addae5c4f242fc1596ccffe` + working tree.
**PARTIAL** — NCR creation is implemented and locally tested; CAPA and Retest remain blocked.

## Authority supplied for this task

The owner explicitly resolved the missing NCR gate in this session:

| Decision | Value |
|---|---|
| Eligible Finding states | All existing states |
| NCRs per Finding | More than one allowed |
| `ncrNo` | Entered by the user; uniqueness enforced; no invented format or sequence |
| `ownerId` | Must be absent; a supplied owner is rejected |
| `affectedItemCode` / `affectedLot` | Optional free user entries; no matching to the Finding |
| Source checks retained | Existence, authorized Finding read scope, permission re-check |

This is a scoped CA-F-01 creation decision. It does not decide PD-16 inspection-FAIL handling, PD-17 closure, scientific results, CAPA, Retest or release.

## Implementation

- `src/modules/quality/ncr/domain/create-input.ts` — one strict schema for Native POST and JS: `intentId`, `findingId`, trimmed nonblank `ncrNo/title/description`, optional references. Server fields (`id`, actor, state, version, timestamps, owner) are absent and rejected.
- `src/modules/quality/ncr/application/create-ncr.ts` — authorization then schema validation; no `Boolean(findingId)` gate; passes only the scoped command to persistence.
- `src/modules/quality/ncr/infrastructure/postgres-repository.ts` — one transaction:
  - advisory lock per actor + intent;
  - receipt lookup before any write; matching replay returns the stored record, conflicting content is `CONFLICT_DUPLICATE_COMMAND`;
  - `SELECT … FOR UPDATE` on the Finding with the same owner/creator scope used by authorized Finding reads;
  - permission re-check, then `ncrs` DRAFT insert with `finding_id`;
  - `CREATE` audit row with `requestId` and source state/version;
  - receipt completion. Any failure rolls back the NCR, relation, audit and receipt.
  - duplicate `ncr_no` maps to `VALIDATION_FAILED` with an `ncrNo` field error; `requestId` is never used as the idempotency key.
- `src/actions/ncr.ts` — native/JSON action using the same schema; safe mapping to `ActionInputError`/`UNAUTHORIZED`/`FORBIDDEN`/`NOT_FOUND`/`CONFLICT` without raw database messages.
- `src/pages/quality/ncr/new.astro` — real form: authorized Finding selector (no raw UUID entry), read-only Finding context, retained values and field summary, Create NCR, 303 to the new record only after a confirmed result. JS enhancement disables the submit and guards duplicate submission; the Native POST baseline remains.
- Entry points: Finding detail (`Create NCR`) and NCR register (`Create NCR`); the older PD-15 creation blocker text was removed from Findings/NCR surfaces while PD-16/PD-17 remain.
- No migration: `0007_quality` already supplies NCR constraints/FKs and `0015_idempotency_records` supplies the durable receipt table. No schema change was needed or applied.
- Sidebar, CAPA/Retest gates, signatures and release policy were not changed.

## UI states and guards

| State | Behavior | Guard source |
|---|---|---|
| context-loading | SSR waits for the authorized Finding list; no separate loading markup is emitted | page render |
| eligible / FORM | Form rendered when the actor holds `PERM-NCR-CREATE` and authorized Findings exist | `authorize` + `findingsReadDependencies().list` |
| policy-blocked | No-create message when the permission/scope check fails | `authorize` in page/use case/action |
| source-unavailable | Unavailable message without treating it as empty; no form | authorized Finding list failure |
| empty | No authorized Finding, so no selectable source | authorized list |
| validation | Field summary and retained values; no redirect | shared input schema + form failure mapping |
| success | 303 to `/quality/ncr/{id}` only after a confirmed id | action result + id check |

## Verification

| Check | Result |
|---|---|
| Focused unit + PG18 integration (`quality/ncr-create-postgres`, `creation-source-gates`, prerequisite guards) | **PASS — 28/28** on Node 24.20.0 and disposable PostgreSQL 18 |
| Positive PG coverage | all five Finding states, multiple NCRs per Finding, manual number, absent owner, audit row, source Finding unchanged |
| Negative PG coverage | missing/out-of-scope Finding, permission/account denial, tampered owner/server fields, blank fields, duplicate number, audit-trigger rollback, source-lock authorization change |
| Replay/concurrency PG coverage | concurrent same intent returns one record; repeat with new trace returns same record with no new rows; same key/different content rejected |
| Astro typecheck | **PASS — 0 errors** (128 existing hints) |
| Authenticated Playwright on isolated PG18 | **PARTIAL** — create → register → detail → audit scenario **PASS**; replay scenario was patched after a secure-cookie issue in `APIRequestContext`, then the run was interrupted: replay, tampered/missing/out-of-scope, and no-JS **NOT RUN** |
| Build / architecture / graphify update / workspace map | **NOT RUN** after these changes |
| AT / UAT / release acceptance | **NOT RUN / none claimed** |

Reproduction commands:

```sh
PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH" node_modules/.bin/vitest run \
  tests/unit/quality/creation-source-gates.test.ts \
  tests/integration/quality/ncr-create-postgres.test.ts
```

`QC_TEST_DATABASE_URL` must point at the disposable loopback `qc_test` database with verified TLS.

## Remaining

- Finish the replay/no-JS/negative browser run with a same-origin browser session.
- Run build, architecture checks, graphify update and workspace map.
- Record screenshots only from the final candidate.
- CAPA and Retest remain blocked under their own gates; no approval, CAPA, release or effectivity is created by NCR creation.

PASS ≠ RELEASED; an NCR draft is not an approved NCR.
