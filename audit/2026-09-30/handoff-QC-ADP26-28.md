# QC-ADP26-28 — Revision predecessor selection and create race

**State: PARTIAL.** Source implementation is complete for deterministic predecessor selection, one open revision, and transactional history revalidation. PostgreSQL 18, authenticated route, responsive, assistive-technology, and human UAT evidence remain unverified or blocked. This handoff is bound to the local candidate below; the task's requested audit HEAD differs and its prior evidence was not transferred.

## Candidate and build identity

- Requested audit HEAD: `0b1bb21bb3b4eca77862dbba1da8623044e96355`.
- Actual HEAD/branch at freeze: `68443f02c49f6ad8046674de7f16c21a8fb081f4` / `main`; initial status and diff were clean.
- Dirty fingerprint: `0c69edbe526dd0b707ea4978bbf1ed33465982236c553dba2b30adefc88de1ce` (SHA-256 of `git diff --binary HEAD` plus sorted non-ignored untracked path/content, excluding this handoff file to avoid self-reference).
- Toolchain used: Node `v24.20.0`, pnpm `11.25.0`.
- Build: `astro build` PASS. Local release identity: `rel-393da0724ee7421b`, build ID `local-68443f02c49f`, artifact `dist/server/entry.mjs` SHA-256 `ed8b8f2ef6174e65c7fa2f72572fcbf44d04dcfd80f5144971a16da84253c6bb`.
- Source migration head/checksum: `0043_controlled_document_source_binding` / `bba7c163956c82fe0fa829828bfc0bab9e7b47c1895d197a04e5d82d802ef35c`. No migration was needed or added. Applied/provider schema: **NOT VERIFIED**.

## Changed

- Version history uses the repository's explicit `created_at DESC, id DESC` order. The domain keeps that exact DB order; it does not re-sort JavaScript `Date` values, which lose PostgreSQL timestamp microseconds.
- The newest `DRAFT`, `IN_REVIEW`, or `RETURNED` version blocks another creation. Creation is allowed for the first draft or when the newest predecessor is explicitly `EFFECTIVE`. `APPROVED` is never inferred to be effective. Creating a draft does not change effectivity.
- The form/action carry expected document and predecessor versions. POST compares the submitted snapshot to current page state; the application re-reads it; the repository then locks the document identity and version history in the creation transaction, compares the snapshot again, and re-applies the policy before inserting.
- The transaction also locks selected registered source-file rows and atomically writes the DRAFT, file links, audit event, and outbox event. Existing unique `(document_id, revision)` and effective-version constraints remain the database guards; no new schema constraint or migration was introduced.
- Unknown submit outcome copy tells the user the revision may have been saved and to inspect history before retrying. Existing entered values and human recovery links remain available; duplicate submission is guarded by the shared form enhancement.

## Evidence

| Check | Result | Evidence |
|---|---|---|
| Application positive/negative/state fixtures | **PASS** | `tests/integration/documents/editing.test.ts`: 6/6. Includes latest RETURNED over older APPROVED (no fallback), blocks a second open revision, refuses APPROVED as EFFECTIVE, creates from explicit EFFECTIVE without changing its state/effectiveAt, read-only positive GetDocument plus missing-REVISE denial on valid EFFECTIVE history, and stale parent/predecessor rejection with unchanged history. |
| Page/mutation contract | **PASS** | Focused command covering editing and `mutation-safety-contract.test.ts`: 7 passed, 11 skipped by test-name filter; the revision creation contract itself passed 1/1. |
| PostgreSQL concurrency, rollback, denied-row/audit/outbox invariants | **BLOCKED** | `tests/integration/concurrency/controlled-mutations.test.ts` could not create its PostgreSQL 18 Testcontainer: “Could not find a working container runtime strategy”; 10 tests skipped. Docker CLI has no daemon socket; local `pg_ctl` is PostgreSQL 14.19 and `pg_isready` reports no response. No database was read or written. Consequently no redacted DB before/after fixture output, replay result, or applied schema proof exists. |
| Astro type check | **FAIL (unrelated existing error)** | `astro check` reports 1 error in `src/pages/ai-advisory.astro:148` (`requestButton` nullable), 0 warnings and 113 hints. The F-028 page/action/repository type errors found during implementation were fixed; no type error remains in changed files. |
| Astro server build | **PASS** | `pnpm exec astro build` completed on this dirty candidate. Existing bundler warnings include third-party PURE annotations, an unused import, a mixed dynamic/static import, and a large client chunk. |
| Local browser route | **BLOCKED** | Temporary preview at `http://127.0.0.1:4321/documents` returned HTTP 503 with `SERVICE_UNAVAILABLE`; server logged `config.invalid_environment`. Protected document fixture routes were not reached. No production or shared environment was used. |
| Requested viewport/keyboard/manual AT/UAT | **NOT VERIFIED** | 320/375/768/1440 CSS px, 200%, critical keyboard path, manual AT, and human acceptance were not exercised because the local preview stopped at 503. No UAT was signed on behalf of a person. |
| Diff hygiene | **PASS** | `git diff --check` passed before the documentation/map refresh; final status/fingerprint is recorded above. No commit, push, merge, deployment, or production migration occurred. |

## Database boundary

- **Transaction reads:** lock the parent `document_identities` row; read and lock its full `document_versions` history ordered `created_at DESC, id DESC`; compare parent version and latest predecessor `{id,state,version}`; re-evaluate one-open/EFFECTIVE policy; lock the selected active, registered source file/evidence rows in file-ID order and validate membership.
- **Transaction writes:** insert `document_versions` as `DRAFT`; insert `document_version_files`; append `CREATE_DOCUMENT_VERSION` audit; enqueue `DOCUMENT_VERSION_CREATED` outbox record. The three write groups use the same transaction connection. Any thrown insert/audit/outbox error should roll all of them back; failure injection is present in the PG suite but **not executed**.
- **Existing constraints:** unique document/revision and the partial unique effective-version index. Expected parent/predecessor versions plus the parent-row lock serialize application creates. No production DB was queried, changed, migrated, or used for fixtures.

## Routes and finding status

| Route | Source change | Route acceptance |
|---|---|---|
| `/documents` | None; list behavior unchanged | NOT VERIFIED |
| `/documents/new` | None | NOT VERIFIED |
| `/documents/[documentId]` | Its use case now returns the revision-creation decision | NOT VERIFIED |
| `/documents/[documentId]/versions/new` | Snapshot, policy, stale recovery and POST handling updated | BLOCKED by local preview 503 |
| `/documents/[documentId]/versions/[versionId]` | None | NOT VERIFIED |
| `/documents/[documentId]/versions/[versionId]/review` | None | NOT VERIFIED |
| `/documents/[documentId]/versions/[versionId]/edit` | None | NOT VERIFIED |

- **Closed in source for QC-PAGE-F-028:** avoids choosing the oldest version, rejects another open revision, rejects an APPROVED-as-EFFECTIVE assumption, and prevents a stale/concurrent create from passing the parent/history check in application code.
- **Still open for candidate acceptance:** prove the transaction, concurrency winner/loser, uniqueness/stale behavior, row/audit/outbox unchanged on denial, rollback, and replay against isolated PostgreSQL 18; exercise authenticated route roles and requested viewports/AT; obtain human UAT.
- **Policy owner decision still open:** Document Control/QMS must own any rule that transitions `APPROVED` to `EFFECTIVE` or selects an effective date. The implementation follows current TR-DOC-008 by requiring an already `EFFECTIVE` predecessor; it does not infer or enact effectivity.

## Handoff

Changed: code, TR-DOC-008 addendum, Mind current state/ledger, and regenerated workspace map. Evidence and blockers are candidate-bound above. State: **PARTIAL**. Open work: PostgreSQL 18 runner and authenticated local runtime configuration are unavailable here (their responsible owners were not identified in this evidence); Document Control/QMS owns effectivity policy; manual AT needs an accessibility reviewer; UAT requires human acceptance.
