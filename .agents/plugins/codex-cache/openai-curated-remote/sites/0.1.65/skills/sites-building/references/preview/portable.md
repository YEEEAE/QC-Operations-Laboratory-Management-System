# Portable preview

## Development and first preview

In a visible foreground thread with an available user-facing preview tool, start the project's development script or a local HTTP server for the static directory in a retained session once setup and any required dependency installation finish successfully. Request network escalation for both the server launch and its readiness checks. Reuse the same session through preview and publishing, and stop it during final teardown.

Without a user-facing preview tool, start a server only when the task needs it; do not use an agent browser as a substitute for user-facing handoff.

A Site-owning agent running in an independently started background, delegated, or invisible task initializes normally but does not start a browser-only preview unless its task otherwise needs the server. Skip `open_in_codex` in that case.

## Preview handoff

Make one lightweight non-browser request to the exact Local URL printed by the development server, using the same networking context as the server, to force the current route to render. Require a non-error response and successful compilation when needed. When available, use `open_in_codex` or the runtime's equivalent user-facing preview tool to show that Local URL. Do not assume a remote execution host's loopback address is reachable by the user's browser; use the runtime's supported forwarding when available, or report the preview limitation. Establish a stable browser-tab ID from the first preview and reuse it through edits, publishing, and any later fixes.

Reuse the existing Site tab and development server.
