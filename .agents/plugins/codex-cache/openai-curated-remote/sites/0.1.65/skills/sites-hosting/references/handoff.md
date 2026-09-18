# Deployment completion and handoff

Keep the native deployment or status response in the Site-owning conversation so the application can surface the Site. If deployment already reports `succeeded` with a URL, no additional status call is needed. For a pending deployment, call `get_deployment_status` directly with the returned project and deployment IDs until `succeeded` or `failed`; stop after a terminal result. Do not delegate the call or substitute a URL for the native response.

On success, return the literal production URL from that successful native response. If `succeeded` has no URL, make one additional same-ID status call; if the URL remains absent, report incomplete verification rather than substituting another version's URL. Unknown or malformed status is not success.

In a visible foreground task, use `open_in_codex` or an equivalent user-facing browser-opening tool when available to show the verified URL. Reuse the existing Site tab and its stable tab ID. In a background or invisible task, skip browser handoff. An unavailable or failed browser handoff does not block returning the successfully deployed URL.

Do not fetch the deployed URL or use an agent browser merely to finish publishing. Never navigate the cloud browser to a live Sites URL; cloud-browser QA uses the [managed preview](../../sites-building/references/preview/managed-linux.md).
