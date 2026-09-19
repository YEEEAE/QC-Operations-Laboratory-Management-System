# PostgreSQL MCP server

The project-local Codex configuration exposes Microsoft's official
`@microsoft/postgres-mcp` server through `.codex/config.toml`. The MCP Market
page supplied for this task is a PostgreSQL expertise skill, not an MCP server;
the server below provides the database tools that skill can guide.

## Configuration

Set the canonical `DATABASE_URL` in the ignored local `.env` file, or export it
before starting Codex. The launcher passes it to the official server through
`POSTGRES_MCP_CONNECTION_STRING`; the connection string is never committed or
printed.

The launcher disables telemetry and the server's default working-directory file
access. `postgres_mcp_query` is read-only, but the server is a gateway: write
protection must also come from a dedicated least-privilege PostgreSQL role (or a
saved MCP profile with `access_mode: ro`). Codex prompts before MCP tool calls
by default.

For a read-only profile managed by the official server, use:

```sh
npx -y @microsoft/postgres-mcp connection add qc-project \
  "postgresql://user@host:5432/database?sslmode=verify-full" \
  --access-mode ro
npx -y @microsoft/postgres-mcp connection set-password qc-project
```

Do not put passwords in the repository, command history, or chat. Prefer the
ignored local `.env` only for disposable/local connections; use the OS keyring
profile for interactive production-adjacent work.

Before connecting to Render, complete the credential-rotation gate documented in
`docs/operations/RENDER-DATABASE-CONNECTION.md`. Do not use provider-export
fields such as `External_Database_URL` as a substitute for the canonical
`DATABASE_URL`.

After restarting Codex, use `/mcp` to confirm the `postgres` server is connected.
