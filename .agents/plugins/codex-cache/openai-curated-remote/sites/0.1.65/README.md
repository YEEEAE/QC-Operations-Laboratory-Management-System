# Sites plugin

Build, preview, and publish websites with Sites on desktop, web, and mobile.

## Skills

| Skill | Purpose |
| --- | --- |
| [sites-building](skills/sites-building/SKILL.md) | Create, edit, and validate a Site. |
| [sites-hosting](skills/sites-hosting/SKILL.md) | Publish a Site and manage hosting. |
| [sites-preview-troubleshooting](skills/sites-preview-troubleshooting/SKILL.md) | Recover supervised previews in the managed-linux profile. |

## Execution profiles

Run `node <plugin-root>/scripts/configure-execution-profile.mjs` in the selected project directory to detect and configure its execution profile: `managed-linux` only when `SITES_MANAGED_LINUX_CONTAINER=1`, otherwise `portable`. The cache seed is optional.

Setup saves the selection in ignored `.sites-runtime/execution-profile.json`. Reconfigure whenever reopening or moving a checkout, before installation/build/preview, and restart an existing preview if the profile changes.

Use available user-facing preview tools without treating the agent's cloud browser as user-facing handoff. Supervised-preview troubleshooting applies only to `managed-linux`.
