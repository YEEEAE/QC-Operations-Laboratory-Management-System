---
name: postgres-verified-analytics
description: "Answer analytics and data-verification questions against this QC PostgreSQL schema with read-only, evidence-backed SQL, explicit grain and time semantics, and safe result disclosure. Use for database inspection and reporting; not for migrations, writes, or authoritative business-rule decisions."
---

# Postgres Verified Analytics

Use this skill when a request needs a PostgreSQL read, an operational metric, a data-quality check, a migration/schema fact, or a report derived from the QC system database.

Read [references/qc-postgres-contract.md](references/qc-postgres-contract.md) when the question touches the project schema, domain semantics, or database evidence.

## Operating contract

- Treat the database as a read model for the requested question, not as permission to mutate state. Do not run migrations, DDL, DML, grants, or recovery operations through this workflow.
- Use the project PostgreSQL MCP only when it is connected through the approved canonical `DATABASE_URL` and its restricted read-only mode. Never substitute provider-export fields or print credentials. If the connection or approval gate is unavailable, use source inspection and report the result as `NOT VERIFIED` or `BLOCKED` rather than guessing live data.
- Separate current source truth, applied database truth, and historical evidence. A local migration file, a disposable database, or a successful query does not prove Render state, production readiness, UAT, or release approval.
- Keep domain authority in the project’s approved documents and server-side use cases. A row count or status value cannot override authorization, scientific, approval, release, or policy rules.

## Query workflow

1. Classify the request before writing SQL: entity scope, natural row grain, measure class (`additive`, `snapshot`, `ratio`, `extreme`, `tally`, or `derived`), time column, half-open time window, timezone, and requested result size.
2. Anchor every table, column, join, state, and value to the current migrations and the project contract. Prefer the `qc` schema and `timestamptz`/UTC rules documented by the project; display in `Asia/Riyadh` only when requested.
3. If a verified query/script exists, treat its SQL as canonical. Strip only a trailing semicolon and wrap it as a `base` CTE; apply user filters, grain changes, and Top-K outside the CTE. Do not rewrite the verified base or invent columns it does not project. If no verified script exists, label the query a candidate and state what remains unverified.
4. Apply safety gates before execution: one `SELECT` statement, comments/multi-statements removed, no DDL/DML keywords, no raw secrets or identity-security fields, and a deterministic `ORDER BY` whenever `LIMIT` is used. Keep outputs bounded to the smallest useful shape; default to at most 1,000 rows and 12,000 cells unless the user explicitly needs a smaller limit.
5. Check analytical validity. Pre-aggregate at the natural grain before coarsening; reconstruct ratios from numerator/denominator; use latest-row logic for snapshots; use `LAG` for period comparisons; use a date spine when zero-event periods matter.
6. Stop and repair instead of shipping a query with fanout, mixed grain, `AVG` of ratios, `SUM` of snapshots, cumulative-retention misuse, a naked limit on a time series, or `BETWEEN` on timestamps. Use `>= start AND < end`.
7. Execute only through the approved read-only path when live evidence is actually in scope. Validate column shape, nulls, row/cell caps, partial periods, and unexpected entity resolution before narrating.

## Evidence-first response

Report the source path or query, data source, applied filters, time window and timezone, result cap, and material caveats. Distinguish facts returned by PostgreSQL from inferences. Disclose entity soft-fails, partial periods, truncation, unavailable providers, and stale or pending migration state; never convert unavailable data into zero or an empty success.

Use explicit evidence labels: `VERIFIED`, `PARTIAL`, `NOT VERIFIED`, `BLOCKED`, or `HISTORICAL`. `PASS` is a test result, not `RELEASED`; inspection is not UAT or production evidence.
