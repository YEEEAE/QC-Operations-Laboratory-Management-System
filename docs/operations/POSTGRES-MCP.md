# PostgreSQL MCP server

The project-local Codex configuration exposes the official `postgres-mcp` server
through `.codex/config.toml`.

## Configuration

Set the canonical `DATABASE_URL` in the ignored local `.env` file, or export it
before starting Codex. The launcher maps it to the `DATABASE_URI` variable
expected by `postgres-mcp`; the connection string is never committed or printed.

The server starts with `--access-mode=restricted`, which keeps SQL execution in
read-only transactions. Codex also prompts before MCP tool calls by default.

Before connecting to Render, complete the credential-rotation gate documented in
`docs/operations/RENDER-DATABASE-CONNECTION.md`. Do not use provider-export
fields such as `External_Database_URL` as a substitute for the canonical
`DATABASE_URL`.

After restarting Codex, use `/mcp` to confirm the `postgres` server is connected.
