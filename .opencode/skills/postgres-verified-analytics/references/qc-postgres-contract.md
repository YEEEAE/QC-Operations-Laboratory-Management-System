# QC PostgreSQL contract

Use this reference for project-specific routing. Verify the current code, migrations, and fresh evidence when a value may have changed.

## Source hierarchy

For business meaning and state transitions, consult the project documents in this order:

`Documents/SYSTEM-INVARIANTS.md` → `Documents/DOMAIN-MAP.md` → `Documents/BUSINESS-RULES.md` → `Documents/STATE-MACHINES.md` → `Documents/DATA-MODEL.md` → `Documents/DATA-DICTIONARY.md` → `Documents/DATABASE-ARCHITECTURE.md` → current migrations.

For database access, read `docs/operations/POSTGRES-MCP.md`, `.codex/config.toml`, and the current launcher before using MCP. The configured server is intended for restricted read-only inspection. Do not use a provider-export credential while the documented rotation gate is open.

## Database shape

- Primary schema: `qc`.
- Baseline: PostgreSQL 18.x; runtime boundary is `pg` + Kysely.
- Identifiers use UUIDv7. Timestamps are `timestamptz` in UTC; convert for display only.
- Migrations are forward-only SQL. Always distinguish source migration head from the target database’s applied head and pending migrations.
- Current versus historical/snapshot/derived data is part of the dictionary contract; do not aggregate snapshots as if they were events.

## Domain routing anchors

Use the smallest relevant slice and confirm joins in the dictionary/migrations:

| Question area | Likely tables or read models |
|---|---|
| identity and authorization | `users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `user_scopes` |
| work and quality | `tasks`, `findings`, `ncrs`, `rcas`, `capas`, `capa_actions` |
| receiving and inspection | `receiving_items`, inspection templates/versions/points, `inspection_reports`, results, snapshots |
| laboratory | lab templates/versions/parameters, `lab_tests`, `lab_samples`, `lab_measurements`, usage and snapshots |
| equipment | `equipment`, `calibration_records`, `maintenance_records`, and append-only histories |
| controlled change | documents/versions/files, `approval_cases`, work items/decisions, signatures, change requests |
| evidence and operations | `audit_events`, files/evidence links, notifications, outbox, report runs/artifacts, backup/recovery records |

These are routing hints, not permission to invent a join or expose every column.

## Non-negotiable semantics

- `PASS` and `RELEASED` are different states; inspection or scientific results do not imply release.
- Authorization is server-side and must not be inferred from a role label, a browser field, or an unrestricted database read.
- Audit projections must use the approved query/mapping contract; do not select or display raw audit `payload`.
- Never expose password hashes, sessions, credentials, provider tokens, secret-like values, or raw security diagnostics. Minimize PII and QC content in result output.
- Provider unavailable, database unavailable, or a missing read model is not an empty/zero result.
- Historical execution uses its snapshot/context rather than the current mutable template or policy.

## Evidence and scope

State whether the result came from source inspection, a disposable PostgreSQL instance, project MCP, or a provider. Name the exact environment only when verified and safe to disclose. Keep production/Render claims separate from local results and say `BLOCKED` when credential rotation, migration drift, CI, UAT, or release evidence prevents a conclusion.
