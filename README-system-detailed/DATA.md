# QC Universe — Data & Database Map

> **Purpose:** Evidence-based navigation guide for the repository's current data model, PostgreSQL schema, imports, source documents, data integrity, and verification.
>
> **Repository:** `YEEEAE/QC-Operations-Laboratory-Management-System`  
> **Reviewed branch:** `main`  
> **Reviewed commit:** `6de2eff31f28341b1c68e5f8bff26332167e9df3`  
> **Review date:** 2026-10-16  
> **Status:** Read-only source review — **not** a database certification or production-readiness approval.  
> **Paths:** All paths below are relative to the repository root. The names describe files and code verified at the reviewed commit; they do not establish deployed behavior.

## 1. Executive summary

QC Universe uses **Astro SSR + Node + PostgreSQL**, with data access and business rules located in a modular application rather than in its pages. PostgreSQL objects are organized under the `qc` schema. The reviewed repository contains **48 numbered, forward-only migrations**, ending at `0048_inspection_template_authoring.sql`.

The original data map referenced `workspace-map/DATA.md` and several `Documents/*.md` data specifications. **Those paths were not present at the reviewed commit.** The existing `README-system-detailed/DATA.md` still lists them and therefore must not be treated as a verified index of available documents. The present source of implementation truth is the migrations, data scripts, application modules, and tests listed below. Missing policy/specification documents should be restored or explicitly superseded through a separately authorized documentation decision—not invented by an agent.

## 2. Verified repository map

### A. Entry points and architecture

| Path | Verified purpose |
|---|---|
| `README.md` | Product overview and links to detailed maps. Contains an older 2026-09-18 implementation snapshot; do not reuse its migration count as current. |
| `README-system-detailed/DATA.md` | Existing short data-map entry point; contains outdated references. |
| `README-system-detailed/PRODUCT.md` | Product/policy reference index; some referenced legacy `Documents` files are absent. |
| `README-system-detailed/OPERATIONS.md` | Deployment/operations reference index; linked-document existence must be checked. |
| `README-system-detailed/VERIFICATION.md` | Verification reference index and historical evidence notes. |
| `README-system-detailed/Approval-Electronic-Signature-Release-Policy.md` | Current stored owner/role approval-policy text; **not proof that the latest deferred-signature decision is implemented**. |
| `README-system-detailed/brief.md` | QC Universe approved design direction; design requirements, not database schema authority. |
| `README-system-detailed/pags.md` | Descriptive inventory of 88 application-page entries; **not** proof that every workflow is available. |
| `src/modules/` | Domain modules implementing application operations and data-specific rules. |
| `src/shared/database/` | Shared database connection, types, transactions, and migration checksum-policy utilities. |
| `src/shared/authorization/` | Server-side permission, scope, separation-of-duties, and action-policy utilities. |
| `src/shared/audit/` | Audit-event, audit-query, and persistence infrastructure. |

### B. PostgreSQL source of truth

| Path | Verified purpose |
|---|---|
| `db/migrations/README.md` | Migration ordering, applied-ledger/checksum policy, provider limitations, and execution rules. **Read first.** |
| `db/migrations/0001_core_schema.sql` through `0048_inspection_template_authoring.sql` | Ordered, forward-only PostgreSQL schema evolution (48 SQL files). |
| `src/shared/database/pool.ts` | Connection setup and PostgreSQL pool. |
| `src/shared/database/transaction.ts` | Transaction support for controlled operations. |
| `src/shared/database/db-types.ts` | Shared database-facing TypeScript definitions. |
| `src/shared/database/migration-checksum-policy.ts` | Migration checksum compatibility/policy utilities. |
| `scripts/db/migrate.ts` | Explicit migration runner and ledger verification. **This can modify a database when run in apply mode.** |
| `scripts/db/migration-status.ts` | Check-only migration status. |
| `scripts/db/preflight.ts` | Read-only connection, capability, and migration-count preflight. |
| `scripts/db/check-migration-integrity.ts` | Check migration-ledger/source integrity. |
| `scripts/db/check-schema-integrity.ts` | Check expected tables, timestamps, lineage, FK restrictions, and other schema-integrity contracts. |
| `scripts/db/load-local-env.ts` | Restricted local environment loading. |
| `scripts/db/disposable-postgres.sh` | Utility for isolated/disposable PostgreSQL testing; review commands before execution. |
| `db/seeds/common.ts`, `db/seeds/dev.ts`, `db/seeds/test.ts` | Code for foundation/test or development seed preparation; seed presence is not proof of loaded production data. |

**Migration rules evidenced by source:**

- Migrations are explicit; application startup does **not** automatically apply them.
- Files are ordered lexically; checksums are recorded in `qc.schema_migrations`.
- Applied migration history must not be silently edited. Use a new migration for schema corrections.
- Repository source head and live provider applied head are separate facts.
- Do not run the migration apply command against production without separately authorized operational controls and environment verification.

### C. Most recent migrations and data consequences

| Migration | Confirmed source role |
|---|---|
| `0045_provider_attestation_nonce_replay_guard.sql` | Signed-provider nonce claim/replay safeguards; still present in source. |
| `0046_inspection_report_catalog.sql` | Controlled Rev.14 inspection-report catalog, evidence links, and source-bound selection safeguards. |
| `0047_task_references_occurrences.sql` | Scoped task references and recurrence occurrence integrity. |
| `0048_inspection_template_authoring.sql` | Distinguishes `SOURCE_TRANSCRIPTION` from `USER_AUTHORED_SPECIFICATION`; adds structured controlled-document section bodies and `body_hash`, with approved-history integrity rules. |

**Important implementation boundary:** Migration `0048` explicitly retains an existing authorized E-signature approval ceremony in its source commentary. Consequently, the owner's later decision to **defer internal signatures and use direct owner approval** must be treated as an **approved intended governance change requiring code/database impact assessment**, not as a completed source migration.

### D. Master-data inventory and imports

| Path | Verified purpose |
|---|---|
| `scripts/data/master-data-catalog.ts` | Source-classified inventory of candidate master-data entities and governance status. |
| `scripts/data/registered-datasets.ts` | Registered import adapters; currently only `equipment` is wired as a dataset spec. |
| `scripts/data/import-preflight.ts` | Local import validation, reference checks, duplicate detection, and gated transaction implementation. |
| `scripts/data/run-master-data-import.ts` | Command entry point for registered dataset import. **Review flags and environment before running.** |
| `scripts/data/inspection/extract-master.py` | Read-only extraction from the controlled Rev.14 XLSX into a local representation. |
| `tests/integration/data/master-data-import-preflight.test.ts` | PostgreSQL-backed import-preflight and reconciliation scenarios on a task-owned database. |

The reviewed master-data catalog includes **seven** entity keys: `organization-site`, `organization-department`, `item`, `supplier`, `equipment`, `method`, and `controlled-template`.

The catalog's checked-in entries all carry **pending concrete value-set approval**. In particular, while an `equipment` adapter exists, `assertImportable()` blocks actual import until its classification, governed schema, and a recorded owner approval satisfy the code's gate. **Do not describe master-data importing as generally enabled or approved.**

Source classifications include `APPROVED`, `SOURCE-DEPENDENT`, `POLICY-DEPENDENT`, and `UNCONFIRMED`. `APPROVED` as a *classification* is not equivalent to an approved, importable dataset: a recorded source/value-set approval is separately checked.

### E. Controlled inspection catalog and evidence

| Path | Verified purpose |
|---|---|
| `QC_Controlled_Forms_and_Operational_Evidence/` | Original operational evidence assets and the Rev.14 catalog XLSX; **source material**, not automatically effective specifications. |
| `src/modules/quarantine/catalog/master-rev14.json` | Extracted Rev.14 identity catalog: **194 entries**, plus one excluded source entry. |
| `src/modules/quarantine/catalog/digitized-forms.json` | **13** digital-form definitions checked into source. |
| `src/modules/quarantine/catalog/source-evidence.json` | **28** source-evidence records checked into source. |
| `src/modules/quarantine/catalog/application/` | Catalog querying and controlled-source import application code. |
| `src/modules/quarantine/templates/` | Controlled template model, application operations, repositories, and ports. |
| `src/modules/quarantine/inspection/` | Inspection report operation and recorded results. |
| `src/modules/quarantine/receiving/` | Receiving records and associated state/links. |
| `tests/integration/quarantine/controlled-report-catalog.test.ts` | Catalog behavior tests. |
| `tests/integration/quarantine/template-authoring-integrity.test.ts` | PostgreSQL integrity tests for authored vs. transcribed templates and controlled-document bodies. |

The 194 catalog identities are **not** 194 approved executable forms. A form may only become usable when the required source provenance, applicable controlled document/version, mapping, approval, and validity conditions are confirmed by the actual implemented workflow. Conflicted/unreadable sources are not a basis to invent limits, sample sizes, AQL decisions, or values.

### F. Other application data owners

Use the corresponding application/infrastructure subdirectories of:

- `src/modules/identity/`, `src/modules/administration/` — users, roles, scopes, account data.
- `src/modules/tasks/`, `src/modules/quality/`, `src/modules/reject-reports/` — tasks, findings/NCR/RCA/CAPA, and rejection records.
- `src/modules/laboratory/`, `src/modules/assets/` — laboratory tests, equipment, calibration, and maintenance evidence.
- `src/modules/documents/`, `src/modules/approvals/`, `src/modules/e-signatures/` — controlled documents, approvals, and existing signature services.
- `src/modules/change-requests/`, `src/modules/release-governance/` — controlled changes and **software-deployment** release evidence.
- `src/modules/reporting/`, `src/modules/dashboard/`, `src/modules/system-health/`, `src/modules/backup-recovery/` — authorized read projections, health evidence, and recovery metadata.

Do not edit a domain's database records from UI components directly. Follow its server-side use cases, authorization, transactions, and audit-writing contracts. A `PASS` inspection result is not a material release, and an internal material release is not a software deployment approval.

### G. Tests and verification

| Path | What it can help verify |
|---|---|
| `tests/integration/database/` | Schema, migrations, constraints, upgrade path, and integrity. |
| `tests/integration/concurrency/` | Database concurrency conditions. |
| `tests/integration/data/` | Import validation. |
| `tests/integration/quarantine/` | Catalog, inspection, receiving, template approval, and state behavior. |
| `tests/integration/documents/` | Controlled-document persistence/workflows. |
| `tests/integration/approvals/` and `tests/integration/e-signatures/` | Existing controlled approval/signature behavior; must be revisited if policy changes. |
| `tests/unit/data/`, `tests/unit/database/`, `tests/unit/quarantine/` | Unit-level data rules and transformations. |
| `tests/e2e/` | User-facing end-to-end scenarios; availability depends on environment and fixtures. |
| `scripts/verification/` | Verification and evidence-producing scripts. |

**No tests were executed for this rewrite.** Test files present in GitHub do not establish PASS results at the reviewed commit.

## 3. References in the former map that are NOT verified present

These references from the original `DATA.md` returned missing-file results in `main` and must not be listed as working document links:

- `workspace-map/DATA.md` (the `workspace-map/` folder was absent from the inspected root).
- `Documents/DATA-MODEL.md`.
- `Documents/DATA-DICTIONARY.md`.
- `Documents/DATABASE-ARCHITECTURE.md`.
- `Documents/DATA-GOVERNANCE-REGISTER-032.md`.
- `Documents/MASTER-DATA-STARTING-DATA.md`.
- `Documents/FIRST-USE-DATA-MANIFEST.md`.

At the reviewed commit, the top-level `Documents/` directory exposed only `Documents/QC_System_WI_SOP_Pack/` as its immediate child. **Other code and reference maps still mention the absent documents.** Treat those references as unresolved documentation dependencies, not as authenticated business-policy content.

## 4. Approval and release governance — current source vs. approved direction

The checked-in `README-system-detailed/Approval-Electronic-Signature-Release-Policy.md` recognizes direct internal authorization by the named `SYSTEM_OWNER` account (`yazeed`), but it also still describes conventional Supervisor/QCM signature requirements. The codebase contains `src/modules/e-signatures/` and signing-related migrations. This represents **existing source**, not confirmation of the owner's new preferred mode.

**Owner-approved direction communicated separately:** defer electronic/handwritten signature ceremonies and the mandatory internal multi-person approval hierarchy while completing QC Universe; permit **auditable direct owner approval** for eligible internal decisions. This decision may guide a future authorized refactor but must not be claimed implemented until the active use cases, migrations, checks, tests, and deployed database are verified.

Keep distinct and record honestly:

1. Owner internal approval.
2. Owner internal material release.
3. Official external QMS approval and physical product release.
4. Software deployment release approval.

Never forge third-party signatures, rewrite past approvals, or treat accepted governance exceptions as proof that unexecuted tests passed.

## 5. Observed deployment-state caveat

A separate authenticated read-only UI review on **2026-10-16** reported a deployed database applied head of `0045` while the repository's expected source head was `0048`. That observation is **time-specific**, not a freshly queried database fact in this document. Live parity must be confirmed again with authorized read-only checks before any production decision.

**Source head `0048` means the SQL is committed, not necessarily applied.** Migration drift must not be hidden by a document edit, a design change, or a direct owner-approval exception.

## 6. Safe inspection commands (for an authorized local environment)

The repository's `package.json` defines these commands; check its actual environment and scripts before execution:

```bash
pnpm db:preflight        # Read-only connectivity and capability snapshot
pnpm db:migrate:status  # Check-only migration status
pnpm db:migrate:check   # Migration integrity verification
pnpm db:schema:check    # Schema integrity verification
```

They require appropriately configured database access and can reveal internal information. They are **not executed by this documentation review**. In contrast, `pnpm db:migrate` can **apply migrations** and is intentionally excluded from safe inspection steps.

## 7. Agent handoff checklist

Before proposing any data change, the implementation agent must:

1. Resolve current `main` HEAD and any working-tree differences; do not assume the reviewed commit is still latest.
2. Inspect `db/migrations/README.md`, followed by migration source and the corresponding domain use cases.
3. Check whether each file or policy reference actually exists. Mark missing historical documents as `MISSING_REFERENCE`, not `APPROVED`.
4. Distinguish **schema committed**, **migration applied**, **feature operational**, **policy approved**, and **release accepted**.
5. Trace each data mutation to its server-side permission/scope, validation, transaction, versioning, and immutable audit evidence.
6. Use source-backed inspection specifications; do not fabricate QC requirements, catalogue mappings, or operational data.
7. For owner-approval work, preserve historical evidence and explicitly isolate deferred signing rules from enforced production safety requirements.
8. Run database tests only in authorized, isolated environments; record the exact commit and actual results.
9. Preserve the application's Sidebar structure and existing QC Universe design decisions.
10. Do not commit, push, deploy, or modify GitHub as part of a documentation review.

## 8. Maintenance rule

When the repository changes, update the reviewed commit, migration head, verified paths, and observed state separately. **Do not turn unverified document links, planned features, or historical snapshots into current implementation claims.**
