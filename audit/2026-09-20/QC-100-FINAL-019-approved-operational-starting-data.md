# QC-100-FINAL-019 — Prepare approved operational starting data

> Date: 2026-09-20 · Candidate HEAD: `4d73dd26298e39656634c761d6e157418e53d0ff` (`main`), dirty tree (13 files, 2 modified + 11 new)
> Working-tree content fingerprint (SHA-256 over sorted `path:sha256(content)` of all changed + untracked files, `git status --porcelain -uall`): `353983eed0a38c97a95caf63f0cef536b57ee9010b4888f329d7f944c9a9f606`
> Runtime: Node v22.22.3 (outside declared `>=24.20.0 <25` contract — local results are not runtime-parity evidence), pnpm 11.25.0
> Database identity: PostgreSQL 18.6 disposable cluster (`scripts/db/disposable-postgres.sh`, TLS verify-full on `127.0.0.1:55432`), database `qc_test`; migration head `0031_qc_creation_parity_two_stage_approval`, `migrate:check 31`, `schema:check 77 tables / 0 orphans`.
> Audit comparison baseline: 2026-09-19 candidate `653b58d22d4a17994db7376a3bd691ca6e789f1a` (maturity 45.8%, gates 0/19, NO-GO). Disciplines Master Data Management — MDM and Data Quality Engineering map to existing audit domains 72/73/74; **no new scored domain was added and the 80-domain denominator is unchanged.**
> Evidence timestamp: 2026-09-20T02:45Z.

## Scope executed

Covered disciplines: Master Data Management (MDM) and Data Quality Engineering.
Prerequisites reused (not rebuilt): QC-100-FINAL-011 (import/bulk inventory +
owner policy block) and QC-100-FINAL-013 (two-stage controlled workflows +
policy reconciliation). Audit domains 72/73/74 were preserved.

## Item 1 — Inventory + steward/source/validation/loading order — DONE (local)

`scripts/data/master-data-catalog.ts` is a typed inventory of the seven required
entities (site, department, item, supplier, equipment, method, controlled
template). Each entry carries classification, governance, governed table,
business key, canonical source reference, steward (role/owner slot — never a
named person), validation rule (from source only), dependency-safe loading
order, and data class.

Key honest finding: **only `equipment` and `controlled-template` are
APPROVED + GOVERNED.** Site and department remain `UNCONFIRMED — DO NOT MIGRATE`
(`DATA-DICTIONARY.md` §16); item/supplier are POLICY-DEPENDENT with no governed
catalog; method is SOURCE-DEPENDENT. The catalog's `assertImportable` gate
refuses all of them, so no master data was invented.

Human-readable dictionary/manifest: `Documents/MASTER-DATA-STARTING-DATA.md`,
`Documents/FIRST-USE-DATA-MANIFEST.md`.

## Item 2 — Local import/preflight tools — DONE (local)

`scripts/data/import-preflight.ts` + `scripts/data/registered-datasets.ts` +
`scripts/data/run-master-data-import.ts` implement a reusable engine with:
required-field validation, allowed-value validation, in-batch duplicate
detection, existing-key duplicate detection (idempotent skip), referential
integrity, dry-run (default), atomic apply, reconciliation (`observed ==
distinct valid keys`), and idempotent reruns via the source UNIQUE constraint
(`ON CONFLICT ... DO NOTHING`).

Policy discipline: `BR-GEN-064` (failure strategy) is UNCONFIRMED and `BD-019`
(transaction strategy) is open; the engine's atomic all-or-nothing write is a
**labelled local safe default**, not a claimed approved policy. No scientific
limit or production seeding was introduced.

Fail-closed guards observed live:
`--apply` → `Refusing master-data apply: QC_SEED_ALLOW_NON_PRODUCTION=true is required.`
`--entity item` → `Refusing to import 'item': classification=POLICY-DEPENDENT, governance=NOT-GOVERNED.`

## Item 3 — First-use manifest + load verification — DONE (local)

Manifest: `Documents/FIRST-USE-DATA-MANIFEST.md` (ready/missing register with
accountable owners and counts).

Verification on the task-owned database (`tests/integration/data/master-data-import-preflight.test.ts`, 4 cases):

| Case | Assertion | Result |
| ---- | --------- | ------ |
| Valid load | 3 ready, 0 issues, `inserted=3`, `reconciled=true`, 3 rows | PASS |
| Idempotent rerun | `ready=0`, `alreadyPresent=3`, `inserted=0`, still 3 rows | PASS |
| Invalid / duplicate / unresolved | `ready=1`, rejected 4 with codes `DUPLICATE_IN_BATCH`, `EMPTY_REQUIRED_FIELD`, `INVALID_VALUE`, `UNRESOLVED_REFERENCE`; only 1 row loaded | PASS |
| Interrupted load | injected failure at row 2 → rollback leaves **0** partial rows; controlled rerun inserts 3; rerun again inserts 0 | PASS |

## Evidence summary (this candidate, this environment)

| Check | Result |
| ----- | ------ |
| `tests/unit/data/import-preflight.test.ts` | 8/8 PASS |
| `tests/integration/data/master-data-import-preflight.test.ts` (PG 18.6) | 4/4 PASS |
| CLI dry-run (starting set / rejection examples) | PASS (JSON reports above) |
| CLI apply guard + unregistered-entity guard | PASS (fail-closed) |
| `pnpm typecheck` (`astro check`) | 0 errors / 0 warnings / 74 hints |
| `eslint` (changed TS/JSON) | 0 errors |
| `prettier` (changed files) | PASS |
| `db:migrate:check` / `db:schema:check` | 31 / 77 tables / 0 orphans |

## Changed paths

- `scripts/data/master-data-catalog.ts` (new inventory + importable gate)
- `scripts/data/import-preflight.ts` (new engine)
- `scripts/data/registered-datasets.ts` (new registered specs)
- `scripts/data/run-master-data-import.ts` (new guarded CLI)
- `tests/fixtures/master-data/{equipment.ts,equipment-starting-set.json,equipment-rejection-examples.json}` (new)
- `tests/unit/data/import-preflight.test.ts`, `tests/integration/data/master-data-import-preflight.test.ts` (new)
- `Documents/MASTER-DATA-STARTING-DATA.md`, `Documents/FIRST-USE-DATA-MANIFEST.md` (new)
- `Documents/DOCUMENTATION-INVENTORY.md`, `package.json` (modified)

## Requirement → implementation → evidence → unresolved dependency

| Requirement | Implementation | Evidence | Unresolved dependency |
| ----------- | -------------- | -------- | --------------------- |
| Inventory + steward/source/validation/order | `master-data-catalog.ts` | unit catalog gate 8/8 | org structure (013/026); BD-020 (013) |
| Import/preflight tools | `import-preflight.ts`, CLI | integration 4/4; CLI guards | BR-GEN-064 / BD-019 (013) |
| Manifest + load verification | `FIRST-USE-DATA-MANIFEST.md` + integration suite | 4/4 PASS | approved equipment list / template source (owners) |

## Status (work separate from evidence)

- **Item 1: DONE (local)** · **Item 2: DONE (local)** · **Item 3: DONE (local)**
- **Overall work: PARTIAL** — the phase's local deliverables are complete and
  evidenced, but the phase cannot be DONE while external evidence is missing.
- Evidence states: unit/integration/typecheck/lint/format/schema **PASS**;
  authenticated browser E2E and accessibility (owners 003, 006/040) **NOT RUN**;
  human UAT / CI / provider / production **BLOCKED** (external, recorded via 004).
- `PASS ≠ RELEASED`; production gates remain 0/19.

## Unresolved dependencies / downstream owners

- `BR-GEN-064`, `BD-019`, `BD-020`, organizational scope: **owner decision via 013/026**.
- Approved equipment list + approved template content: operations / P-06 owners.
- Regression + affected E2E + accessibility: 002/027, 003, 006/040.
- Final evidence reconciliation: 012.
- Node 22.22.3 vs declared Node 24 contract: local results are not runtime-parity evidence.

## Next phase and required inputs

Next phase: **020 (role-specific operations/support guides)**, whose `dependsOn`
includes this family. Required inputs: this data dictionary + manifest, and the
current route/permission evidence; unresolved organizational ownership stays
external.
