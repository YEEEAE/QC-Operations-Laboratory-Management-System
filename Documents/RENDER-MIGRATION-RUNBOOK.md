# Render PostgreSQL migration runbook

**Task context:** `QC-RENDER-POSTGRES-RECOVERY-004`

## Supported database identity mode

The current modular monolith supports **MODE A** only:

```text
one Render-managed DATABASE_URL credential
        ├── explicit migration runner
        └── application runtime
```

The application does not require PostgreSQL roles named `qc_migrator` or `qc_app_runtime`. Render must provide a credential that owns the application database, or one that has equivalent ability to create the application schema and objects. Runtime safety comes from server-side application authorization, the `qc` schema boundary, qualified migration SQL, and the connection `search_path=qc,pg_catalog`; it does not come from an unprovisioned database role.

## Required migration privileges

On an empty database, the current credential must have:

| Capability | Why it is required |
|---|---|
| `CONNECT` on the database | Establish the migration connection |
| `CREATE` on the database | Create schema `qc` |
| `CREATE` on schema `qc` | Create tables, indexes, and constraints; ownership is retained by the credential |
| `USAGE` on schema `qc` | Read/write the migration ledger and application objects |
| DDL ownership of objects created by the credential | Apply later forward migrations and alter existing objects |
| Transaction support and advisory-lock execution | Serialize migration runners and roll back a failed migration |
| `SELECT` on `pg_catalog` metadata | Run safe privilege/topology checks |

The credential does **not** need `SUPERUSER`, `CREATEROLE`, `CREATEDB`, `ALTER ROLE`, or `SET ROLE`. PostgreSQL 18 supplies the built-in `uuidv7()` function used by the schema defaults.

The runner checks database/schema create capability and rejects a pending migration when a legacy object is owned by another principal. It never creates roles, changes ownership, or silently bypasses a checksum.

## Legacy compatibility

The former migrations recorded exact checksums for a role-based ownership model. The runner accepts those exact legacy checksums so an existing ledger remains verifiable. This is compatibility only; it does not make a legacy ownership topology safe for new migrations. A provider administrator must remediate ownership or use a controlled database transition before pending migrations can run.

## Operator sequence on a disposable or approved staging database

```text
pnpm db:preflight
pnpm db:migrate
pnpm db:migrate:status
pnpm db:migrate:check
pnpm db:migrate
```

The final migration command must report zero newly applied migrations. Capture only redacted metadata and migration counts. Never run this sequence with the old exposed credential, and never use it against production during recovery testing.

**MODE B** (separate migrator/runtime identities) is intentionally not implemented because no current application requirement selects or needs it. If adopted later, both identities must be provisioned externally and a separately reviewed migration must establish grants; this repository must not infer or create those roles.
