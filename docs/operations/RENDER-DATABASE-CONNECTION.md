# Render PostgreSQL connection operations

This document is an operator workflow, not permission to run production migrations. Do not run
`pnpm db:migrate` against production until the approved migration gate is open.

## Credential rotation gate

The credential currently present in the local Render export is compromised. Before any production
connection, migration, bootstrap, or write operation:

1. Open the Render Dashboard.
2. Open the PostgreSQL database and its **Credentials** page.
3. Create a new default credential.
4. Update the local `DATABASE_URL` securely with the new **External Database URL**; do not put it in
   this document, Git, shell history, or chat.
5. Later update connected Render services with the new **Internal Database URL** where private
   networking is supported.
6. Verify the new credential with the read-only preflight workflow below.
7. Revoke or delete the old credential.

Do not delete the existing local provider export until the operator has confirmed that the newly
rotated credential is available. After that confirmation, remove the export and retain only the
canonical `DATABASE_URL` entry in the ignored local `.env` file.

## Connection model

- **Local Mac:** use the Render **External Database URL** with TLS required by the provider.
- **Render Web Service:** use the Render **Internal Database URL** when the service/database topology permits it.
- Never hardcode a Render hostname. Copy the current URL from the provider's secret interface only.
- No URL, password, session secret, or telemetry header belongs in Git, shell history, logs, or command output.

## Local `.env` handling

The standalone database and bootstrap commands load only an ignored local `.env` file through the
repository's allowlisted, non-shell parser. Explicit environment variables win. A Render connection
information export containing keys such as `Hostname`, `Database`, `Username`,
`Password`, `Internal_Database_URL`, `External_Database_URL`, or `PSQL_Command` is not an application
configuration file and is ignored; it must not be sourced.

Keep `.env.example` as the tracked names-only reference. Put the web service's current Internal Database
URL in Render's managed `DATABASE_URL` variable. For a local preflight, the ignored `.env` may contain
only the current External Database URL as canonical `DATABASE_URL`, or the URL may be entered privately
through the workflow below. Do not copy provider-display fields into `DATABASE_URL`, commit them, or
retain a local provider credential dump as an archive. Remove an existing local dump only after confirming
the active rotated credential is available from Render.

## Secure local zsh workflow

From the repository root, run this interactively. The prompt is silent and the value is held only in
the current shell process:

```zsh
qc_db_preflight() {
  (
    local DATABASE_URL
    read -rs 'DATABASE_URL?Paste the Render External Database URL (input hidden): '
    print
    export DATABASE_URL
    pnpm db:preflight
    local status=$?
    unset DATABASE_URL
    return $status
  )
}
qc_db_preflight
unfunction qc_db_preflight
```

The subshell keeps the value out of the parent shell; it also unsets it after normal command completion,
including when the command fails. If interrupted, the subshell exits and the temporary environment ends
with it. Do not type the URL after `export DATABASE_URL=` and do not pass it as a CLI argument.
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
