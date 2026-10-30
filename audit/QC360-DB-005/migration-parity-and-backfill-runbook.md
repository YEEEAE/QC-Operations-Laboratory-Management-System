# QC360-DB-005 — Migration parity and protected change plan

**State: PARTIAL / NOT VERIFIED.** This is a local implementation note, not a controlled procedure, approval, migration authorization, or database observation.

## Source and ledger boundary

- The local checkout is `main` at `ffea4b12ff23cb4488fc5acf32c37f2e50169de7`; the audit SHA `80e5947f22bc4ccce1a71c911c7c9d0cae99f2d9` is reference evidence only.
- The local source inventory has 80 numbered migration files, `0001`–`0080`. This establishes only the source head (`0080`), not an applied head.
- The application projections compare the shipped migration inventory to `qc.schema_migrations`. They now report source/applied heads, pending versions, source/ledger sequence risks, name/checksum mismatches, retained known-legacy checksums, and the configured branch label. The branch label is not Neon provider attestation; provider project/branch identity remains `NOT VERIFIED`.
- No live ledger, schema, branch, or checksum read was made for this task. The historical staging evidence ending at `0059` is not current evidence for this checkout. Production, staging, and pilot applied heads remain `NOT VERIFIED` here.
- No source migration was added for this projection: source and applied ledger facts are combined at read time, without a new database object or data write.

## Historical-data protections

Do not edit or bypass migrations `0053` or `0055`:

- `0053_validate_receiving_normalization_constraints.sql` only validates four existing constraints. A historical violation must stop the transaction. Identify affected row IDs and values through an independently authorized read-only query, obtain an owner disposition for each value, and use a separately reviewed forward-only change if correction is approved. Do not infer units, dates, purchase orders, or source references.
- `0055_lab_retest_sequence_unique.sql` checks duplicate `(original_test_id, retest_sequence)` groups before creating its unique index. A conflict must stop the transaction. Use `db/diagnostics/NDB-05-laboratory-integrity-exceptions.sql` under separate read-only authorization; preserve each original test and retest, and do not renumber, delete, merge, or disposition records to force the index through.
- The runner applies each migration and its ledger row in one transaction. A failure must leave the migration unapplied; an unknown commit outcome requires an operator read of both schema and ledger before any retry.

For `0066`–`0080`, review the actual target schema, ledger prefix, role grants, and source data before any staging operation. Relevant data/authority boundaries are:

| Source | Required protection before a future authorized staging run |
| --- | --- |
| `0066`–`0068` source library | DDL creates immutable byte storage/provenance and text indexes; it does not import company files. Do not upload or copy source files. Confirm legal/license authority and data classification before any separate import workflow. Extracted licensed content remains absent unless retention is authorized. |
| `0067` equipment eligibility | Existing rows default to `UNKNOWN_SOURCE`; this is not equipment approval. Do not promote rows or invent method, site, area, or evidence mappings. |
| `0069`–`0070` lab method/retest | Requests are source-bound and pending; no scientific criteria, retest eligibility, allocation, or disposition may be supplied without approved effective sources. |
| `0071` rejection denominator | Preserve historical `reject_pct`; new columns do not justify historical recalculation or production-quantity inference. |
| `0072`–`0073` Issue Slip provenance | `0072` updates existing confirmations to explicit `UNKNOWN`/submitter provenance; `0073` adds actual-decision fields without promoting self-reports. Capture before/after counts and review representative identities under separate read authorization; never synthesize approver decisions. |
| `0074`–`0076` reject review and Focus | `0074` preserves legacy states and does not promote records. `0076` remaps old Focus states and only derives eligible report revisions; capture state counts, eligibility, and exception IDs before/after. Do not infer Focus delivery or an approved deadline. |
| `0077` in-process | A separate record family; no incoming/final inspection rows or limits. Write permissions remain ungranted absent an approved matrix. |
| `0078` recovery governance | New policy records start pending and no objectives are seeded. Restore execution remains blocked absent a separate approved procedure. |
| `0079` shift handover | No approved area/shift directory or role grants are established by source. Do not infer organizational values or enable writes. |
| `0080` AI advisory policy | External processing remains disabled by default. Do not populate data classes, providers, retention, legal/IT clearance, or approval claims without approved sources. |

For any authorized staging plan, record the exact target branch/database identity from the provider, the pre-change recovery point and restore evidence, current source and applied heads, complete checksums, any `NOT VALID` constraints and conflicts, expected lock/scan duration, role/permission changes, and approved change references. Capture post-change ledger/schema evidence and compare exact counts and checksums. Production requires a separate approved release/change authorization and is outside this plan.

## Planned commands — not executed

After a separately authorized read-only target is selected and its runtime/operator identities are confirmed, the source-defined check command is:

```sh
pnpm db:migrate -- --direct --check
```

After reviewed recovery/change controls and explicit approval for an isolated staging target only, the candidate apply command would be:

```sh
pnpm db:migrate -- --direct
```

Neither command was run. Do not execute the apply command from production or infer that `--check` was run from this note. No production apply command is authorized or generated here.

## Remaining blockers

- Independently authorized, read-only provider access to identify the intended Neon project/branch/database and capture current applied signatures/schema.
- Owner-approved staging change and recovery/restore evidence, including a disposition path for any `0053`/`0055` historical conflicts and reviewed impact for the state updates in `0072`/`0076`.
- Company legal/license decision for any controlled source-file retention or import. Until then, source-library ingestion remains blocked.
- Separate approvals for role grants, data correction/backfill, operational policy values, and any later production migration.
