# MASTER-DATA-STARTING-DATA.md

## Approved Operational Starting Data — Data Dictionary & Local Preparation Pack

> Task: QC-100-FINAL-019 · Status: PARTIAL (local) / PASS ≠ RELEASED
> This document is an **inventory and operator guide**. It is not a policy source.
> Every fact below points at the canonical owner document or migration. No new
> scientific limit, tolerance, code list, organizational unit, or import policy
> is introduced here. Where authority is missing, it is recorded as an open
> dependency instead of being invented.

## 1. Authority chain reused (not restated)

| Fact                              | Owner source                                              |
| --------------------------------- | --------------------------------------------------------- |
| Status vocabulary (`UNCONFIRMED = DO NOT INVENT`) | `Documents/DATA-DICTIONARY.md` §3          |
| Organizational scope is unapproved | `Documents/DATA-DICTIONARY.md` §16                       |
| Import uses the same rules as manual input | `Documents/BUSINESS-RULES.md` BR-GEN-063 (APPROVED) |
| Import failure strategy unresolved | `Documents/BUSINESS-RULES.md` BR-GEN-064 (UNCONFIRMED)  |
| Import transaction / reference-data ownership | `Documents/BUSINESS-RULES.md` BD-019 / BD-020 |
| Template authority and lifecycle  | `Documents/BUSINESS-RULES.md` P-06 · `Documents/PERMISSION-MATRIX.md` |
| Equipment privileges              | `Documents/PERMISSION-MATRIX.md` `PERM-EQP-*`             |
| Admin administrative scope        | `Documents/ROLE-MATRIX.md` §43–48                         |

## 2. Master-data inventory

Loading order is dependency-safe: order 1 loads before order 2. Identity and
authorization (`users`, `roles`, permissions, grants) are platform bootstrap
owned by `db:seed:foundation` / `bootstrap:admin` / `access:grant-system-owner`
and are **not** re-imported by this pack.

| # | Entity | Classification | Governance | Governed table | Loading order | Steward (owner slot) | Validation rule (source) | Data class |
| - | ------ | -------------- | ---------- | -------------- | ------------- | -------------------- | ------------------------ | ---------- |
| 1 | Site | UNCONFIRMED | NOT-GOVERNED | — | 1 | UNRESOLVED — org structure (013/026) | none approved (DO NOT MIGRATE, §16) | UNRESOLVED |
| 2 | Department | UNCONFIRMED | NOT-GOVERNED | — | 1 | UNRESOLVED — org structure (013/026) | none approved (DO NOT MIGRATE, §16) | UNRESOLVED |
| 3 | Item | POLICY-DEPENDENT | NOT-GOVERNED | — | 2 | UNRESOLVED — reference-data governance (BD-020, 013) | `length(btrim(item_code)) > 0` only (0008/0026) | UNRESOLVED |
| 4 | Supplier | POLICY-DEPENDENT | NOT-GOVERNED | — | 2 | UNRESOLVED — reference-data governance (BD-020, 013) | nullable free text (0025) | UNRESOLVED |
| 5 | Equipment | APPROVED | GOVERNED | `qc.equipment` | 1 | Admin (ROLE-MATRIX §43–48); lifecycle by `PERM-EQP-*` | `equipment_no` UNIQUE; `name` non-empty; `state` CHECK; `created_by` FK | APPROVED-BUSINESS |
| 6 | Method (test/analysis) | SOURCE-DEPENDENT | NOT-GOVERNED | — | 1 | UNRESOLVED — laboratory controlled-source owner (013) | controlled source only; DO NOT INVENT (§3) | UNRESOLVED |
| 7 | Controlled template (inspection/lab) | APPROVED | GOVERNED | `qc.inspection_templates`, `qc.lab_test_templates` | 1 | P-06 authority set; any active user may create DRAFT | `template_code`/`test_code` UNIQUE; non-empty `name`; P-06 lifecycle | APPROVED-BUSINESS |

Machine-readable source of the same inventory:
`scripts/data/master-data-catalog.ts`.

The catalog records source revision, accountable owner, and an explicit
value-set approval reference for every group. `APPROVED` above refers to
schema/entity governance; it does not approve concrete values. All current
value-set approvals are `PENDING`, so no business dataset is importable yet.
The equipment rows in `tests/fixtures/` are disposable test data and cannot
satisfy this gate.

## 3. Approved business data vs disposable fixtures

- **APPROVED-BUSINESS** entities are `equipment` and `controlled-template`. The
  physical schema and its constraints are approved. No specific approved values
  (real equipment numbers, template content) are present in this repository.
- **DISPOSABLE-FIXTURE** records live only under `tests/fixtures/master-data/`
  and use the `FIX-` prefix and a fixed task-owned actor UUID. They are synthetic
  and must never be treated as approved business data.
- **UNRESOLVED** entities (site, department, item, supplier, method) have no
  approved values and no governed table; the catalog refuses to import them.

## 4. Local import / preflight tooling

Executable pack (all local, task-owned database only):

| Command | Purpose |
| ------- | ------- |
| `pnpm data:master-data:preflight` | Read-only command; currently refuses because no equipment value set has owner approval |
| `tsx scripts/data/run-master-data-import.ts --entity <key> --dataset <file.json>` | Dry run any registered dataset |
| `... --apply` | Load ready rows in one atomic transaction (gated) |

Engine: `scripts/data/import-preflight.ts`. It performs, in order:

1. **Required-field validation** — missing / empty-after-trim on required fields.
2. **Allowed-value validation** — only where a DB `CHECK` or approved doc exists.
3. **In-batch duplicate detection** — repeated business key within one batch.
4. **Existing duplicate detection** — business key already in the table
   (classified as an idempotent skip, not a rejection).
5. **Referential integrity** — every declared reference must resolve.
6. **Dry-run** — the default; reads only, writes nothing.
7. **Reconciliation** — after apply, the observed row count must equal the
   number of distinct valid keys; mismatch fails the operation and rolls it
   back.
8. **Idempotent rerun** — inserts use the source UNIQUE constraint as the
   idempotency key (`ON CONFLICT ... DO NOTHING`); a rerun inserts nothing new.

### Safety guards (fail closed)

`--apply` refuses unless `NODE_ENV` is `development|test`,
`QC_SEED_ALLOW_NON_PRODUCTION=true`, `QC_MASTER_DATA_IMPORT_ALLOW=true`, and
`DATABASE_URL` does not look like production. Dry-run applies the read guard.
Unregistered or non-APPROVED entities are refused by the catalog.

For an approved value set, output carries source, source revision, owner,
approval reference, SHA-256 of the exact input, quality counts, and
reconciliation. `--report <new-file>` writes the same JSON record and refuses
to overwrite a prior report.

### Unresolved policy (do not invent)

- **Failure strategy** (all-or-nothing vs partial vs row staging) —
  `BR-GEN-064` UNCONFIRMED. The engine's write path is a single atomic
  transaction; this is a **labelled safe default for local preparation**, not an
  approved policy.
- **Import transaction strategy** — `BD-019` open.
- **Which controlled reference data needs a Change Request** — `BD-020` open.

## 5. Rejection examples (classification)

| Code | Meaning | Fixture example |
| ---- | ------- | --------------- |
| `MISSING_REQUIRED_FIELD` | Required field absent | `created_by` omitted |
| `EMPTY_REQUIRED_FIELD` | Required field blank after trim | `"name": ""` |
| `INVALID_VALUE` | Not an allowed value | `"state": "RETIRED"` |
| `DUPLICATE_IN_BATCH` | Business key repeats in the batch | two `FIX-EQP-0001` |
| `DUPLICATE_EXISTING` | Business key already present | idempotent skip |
| `UNRESOLVED_REFERENCE` | Reference does not resolve | unknown `created_by` |

Runnable examples: `tests/fixtures/master-data/equipment-rejection-examples.json`.

## 6. Verification

`tests/integration/data/master-data-import-preflight.test.ts` proves, on a
task-owned disposable PostgreSQL database:

1. a valid dataset loads and reconciles;
2. a rerun is idempotent (no new inserts);
3. invalid / duplicate / unresolved rows are rejected while valid rows load;
4. an interrupted load rolls back to zero partial rows, then a rerun succeeds.

Result: `8/8` unit and `4/4` integration PASS on this candidate.
