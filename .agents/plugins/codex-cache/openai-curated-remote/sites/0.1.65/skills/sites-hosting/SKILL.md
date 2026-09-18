---
name: sites-hosting
description: Host websites with Sites. Use after `sites-building` to publish new sites and edits, for requested website publishing or deployment, or for hosting management. A project containing `.openai/hosting.json` uses Sites hosting only when the current request concerns that Site. Publishing an npm package or standalone asset is not website publishing. Honor an explicit request to use another hosting provider.
---

# Sites hosting

Enter this workflow only for the requested Site. The presence of `.openai/hosting.json` alone does not request hosting, and an explicit choice of another hosting provider takes precedence.

Publish the exact source with the shortest safe sequence. Use native Sites connector calls directly, following their descriptions for arguments and archive requirements. Treat IDs and cursors as opaque and copy them unchanged from the selected Site's manifest or tool responses.

## Execution profile and shared workflow

Publishing, registration, and deployment handoff use the same instructions for every execution profile. Read [Publishing](references/publishing.md) before starting; use [Registration](../sites-building/references/registration.md) when needed and [Handoff](references/handoff.md) to finish.

When entering an existing checkout directly, run `node <plugin-root>/scripts/configure-execution-profile.mjs` before installation, builds, or preview. It detects the current execution environment and refreshes compatible starters' ignored local profile without changing source or dependencies. If the profile changed, restart any preview owned by this Site before using it again. If continuing in the same environment from `sites-building`, reuse that selection and output from the last successful build.

## Site lifecycle ownership

Only the Site-owning agent responsible for the user's requested Site may run `sites-hosting`, call `create_site` or any other Sites tool, edit the Site checkout or `.openai/hosting.json`, obtain source credentials, commit or push, save a version, deploy, or perform the final browser handoff. A spawned subagent must return its assigned image, asset, or research result without invoking this skill or any Sites tool. An independently started background or invisible task that owns the requested Site remains its Site-owning agent.

## Communicate clearly

Assume the user is a nontechnical knowledge worker. Keep source control, credentials, IDs, commits, branches, archives, versions, packaging, connector calls, and deployment polling out of user-facing messages. Usually send one update when publishing begins, then the final URL or a plain-language blocker.
For example: `Your site is ready. I’m publishing it now.`

## Rules

- After creating or editing a site, publish it by default, including on subsequent turns. Respect explicit local-only requests, requests to save without deploying, and instructions not to publish.
- New sites start private. Preserve the site's current audience unless the user explicitly requests a different audience. Do not add a separate conversational deployment confirmation; runtime tool approvals and backend access checks still apply.
- Publishing does not require additional browser testing or visual QA. Preserve the existing Site tab as its single user-facing view; a failed browser handoff does not block publishing.
- Treat `public/screenshot.jpeg` (`screenshot.jpeg` under `static.directory` for buildless sites) as an optional deployment thumbnail. Preserve an existing file. Create or refresh it only when the user explicitly requests a Sites deployment thumbnail; a generic screenshot request does not count. Missing or failed capture never blocks version saving or deployment.
- Store only `project_id`, optional `static` configuration, logical `d1` and `r2` bindings, and requested supported `capabilities` in `.openai/hosting.json`. Manage runtime values through Sites.

## Fast publish sequence

Apply any reuse shortcuts in the shared **Publishing** reference before the preparation steps below.

`<plugin-root>` is the installed plugin directory containing `skills/` and `scripts/`. Run each script directly in a separate exec call with absolute paths and literal arguments, without shell variables, redirects, or chaining. Set exec's working directory to the Site checkout and poll yielded sessions to completion.

1. Reuse output from the last successful build when the source has not changed. Plain static assets need no build; otherwise rebuild only when needed, using `node <plugin-root>/scripts/build-site.mjs`.
2. Collect the registration call started during `sites-building` before committing or packaging, then re-read `.openai/hosting.json` and verify its `project_id`. Reuse that Site and its source write credential; renew a missing or expired credential for the same Site. If hosting a new Site directly, start registration only when no `project_id` or unresolved prior attempt exists. Follow the shared **Registration** reference for the call, persistence, and recovery steps.
3. Use a Git repository rooted at the selected Site project, initializing one there if needed; do not commit or push an unrelated parent repository. Commit the exact source. Push it with the returned credential as a per-command HTTP authorization header. Keep the credential out of remote URLs, Git configuration, files, and user-facing output. Wait for the push to finish successfully, then run `git rev-parse --verify HEAD` in the Site checkout and copy its complete output verbatim as `commit_sha`. Never expand, pad, or guess a SHA from abbreviated commit or push output. Keep that source revision unchanged through packaging and saving.
4. Package with `node <plugin-root>/scripts/package-site.mjs <project> <archive>`.
5. Save and deploy using the shared **Publishing** reference, following the deployment audience rules below.

## Deployment audience

For a site created in this flow whose owner-only access has not changed, or an existing site already known to be owner-private for the selected account, use the private publishing path without `get_site`. The private operation checks current ownership and access. For other sites, call `get_site` to resolve ownership and audience. Use the private path for confirmed owner-only access by the selected account; otherwise use the non-private path. Honor any explicit audience restriction from the user. Never use private deployment as an access probe.

If private hosting returns `site_not_owner_only`, do not retry private or silently fall back: call `get_site` to resolve the current audience and use the non-private path unless that audience conflicts with the user's explicit sharing instructions. If it conflicts, report the audience mismatch.

On `stale_commit_sha`, rerun `git rev-parse --verify HEAD` and verify that commit is the configured remote branch's HEAD before retrying. If the source changed, rerun any required build, commit, push, and package it again. Do not substitute a different remote SHA while keeping an archive built from another revision.

## Existing sites and advanced capabilities

- Reuse an existing `project_id` and valid source credential when available.
- If a credential is absent or expired, obtain one with `create_source_repository_write_credential` and reuse it until expiry.
- If the D1 schema changed, ensure generated migrations are present before packaging.
- For server-backed builds, require `dist/server/index.js`, static assets when emitted, `dist/.openai/hosting.json`, and `dist/.openai/drizzle/**` when migrations exist.
- For static-only builds, require an `index.html` in the public output directory selected by `static.directory` in `.openai/hosting.json`. The helper normalizes that output to `dist/` and rewrites the archived `static.directory` to `dist`. Static builds cannot use runtime bindings, capabilities, or migrations.
- For non-vinext server-backed projects, use the established Cloudflare Workers-compatible build output and adapt staging only as required by the connector contract.

## Handoff

Follow the shared **Handoff** reference to confirm success and show the exact deployed URL. Preserve the existing Site view after subsequent fixes and redeployments.

Then return the deployed Sites URL and a concise description of what the user can do. If the deployment is unsuccessful, do not perform the success handoff; explain the user-visible reason and next step. Keep source credentials and temporary archives private. Do not include file paths, commands, build details, IDs, commits, or version information unless the user asks.
