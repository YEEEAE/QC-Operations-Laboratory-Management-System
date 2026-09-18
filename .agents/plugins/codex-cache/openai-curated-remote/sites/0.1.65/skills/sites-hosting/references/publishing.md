# Publishing

## Reuse existing work

For unchanged source with a known archive-backed version, reuse that version instead of rebuilding, committing, packaging, uploading, or saving again; continue with the deployment audience check and save/deploy flow below. A source-only version may still need its first archive; saving the matching source and archive completes that same version. If the requested version's deployment is already running, continue to [Deployment completion and handoff](handoff.md) instead of starting another deployment. Use known response IDs; do not add discovery calls to this path.

## Tools and archives

Use native Sites tools directly in the Site-owning conversation so the runtime supplies current turn and product context. Follow the available tool schemas; do not replace them with shell HTTP, lifecycle scripts, fabricated metadata, or delegated calls. If Git reports `CONNECT tunnel failed, response 403`, investigate network policy before rotating credentials.

Pass the absolute local archive path to `save_site_version` or `save_version_and_deploy_private`; the connector uploads that file. Keep the archive unchanged in the same execution environment until saving succeeds. Do not substitute a backend uploaded-file object or upload it through shell HTTP. Preserve the pushed `commit_sha`. A separate save returns the version ID to deploy; the combined call already starts deployment, so do not save or deploy it again.

## OpenAI API keys

When a site needs `OPENAI_API_KEY`, use the ["OpenAI Developers"](plugin://openai-developers@openai-curated-remote) plugin's `openai-platform-api-key` skill to create or reuse a key with the user's approval, then configure it as a site secret before deployment. If the skill is unavailable, ask the user to install or enable the plugin.

## Save and deploy

Choose the deployment audience using the [hosting skill's audience rules](../SKILL.md#deployment-audience).

For private publishing, use `deploy_private_site_version` when reusing a stored archive's version. Otherwise, use `save_version_and_deploy_private` when exposed in the current tools, passing the pushed `commit_sha` and archive. It saves and privately deploys that exact version in one call; do not save separately first. If the tool is unavailable or returns `tool_not_enabled`, use `save_site_version` followed by `deploy_private_site_version` with its returned version ID. If private hosting returns `site_not_owner_only`, follow the hosting skill's audience-mismatch handling; do not retry private or silently fall back.

Outside the private path, save one version and call `deploy_site_version`. Do not add a separate conversational deployment confirmation; runtime tool approvals and backend access checks still apply. Reuse an already saved version instead of saving again.

If hosting fails after saving and returns `saved_version_id`, retain it and resume with the appropriate deployment tool after addressing the failure; do not repeat the save. If a timeout or lost response leaves the outcome unknown, reconcile existing versions for the pushed commit before retrying. Leave build errors and repairs to the agent; the combined tool does not build or repair local source.

Continue to [Deployment completion and handoff](handoff.md).
