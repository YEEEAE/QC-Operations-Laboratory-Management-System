# Render PostgreSQL connection operations

This document is an operator workflow, not permission to run production migrations. Do not run
`pnpm db:migrate` against production until the approved migration gate is open.

## Connection model

- **Local Mac:** use the Render **External Database URL** with TLS required by the provider.
- **Render Web Service:** use the Render **Internal Database URL** when the service/database topology permits it.
- Never hardcode a Render hostname. Copy the current URL from the provider's secret interface only.
- No URL, password, session secret, or telemetry header belongs in Git, shell history, logs, or command output.

## Secure local zsh workflow

From the repository root, run this interactively. The prompt is silent and the value is held only in
the current shell process:

```zsh
qc_db_preflight() {
  local DATABASE_URL
  read -rs 'DATABASE_URL?Paste the Render External Database URL (input hidden): '
  print
  export DATABASE_URL
  pnpm db:preflight
  local status=$?
  unset DATABASE_URL
  return $status
}
qc_db_preflight
unfunction qc_db_preflight
```

The function always unsets the value after the preflight, including when the command fails. Do not type
the URL after `export DATABASE_URL=` and do not pass it as a CLI argument.
The preflight opens a read-only transaction, prints only safe metadata, and never prints the URL.

For a Render Web Service, set the Internal Database URL only in Render's managed environment variable
for `DATABASE_URL`. The application process does not need a shell command or a committed value.

## Environment checks

Production requires `DATABASE_URL`, `SESSION_SECRET`, `SERVICE_VERSION`,
`RATE_LIMIT_LOGIN_MAX`, and `RATE_LIMIT_LOGIN_WINDOW_SECONDS`. `OTEL_EXPORTER_OTLP_ENDPOINT` and
`OTEL_EXPORTER_OTLP_HEADERS` are parsed as optional observability settings; when supplied, they are
never included in diagnostics. `pnpm db:preflight` validates only database connectivity and schema
metadata, and does not modify the database.

## Preflight output

`pnpm db:preflight` reports connectivity, PostgreSQL version, current database/user, `qc`/table
existence, applied/pending migration counts, read-only mode, and safe privilege capability checks.
It separates configuration errors (missing/malformed `DATABASE_URL`) from database/network errors.
It never reports the URL, password, connection string, or raw driver error.
