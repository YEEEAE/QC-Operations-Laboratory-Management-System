---
name: sites-preview-troubleshooting
description: Diagnose and recover failed supervised sites-preview sessions after sites-building. Applies only to the managed-linux execution profile, not portable previews.
---

# Agent-preview troubleshooting

**Managed-linux only.** This skill diagnoses the supervised `sites-preview` runtime. For portable preview issues, follow [Portable preview](../sites-building/references/preview/portable.md) instead.

Use this skill only after `sites-building` has prepared the checkout and its agent preview fails to start, times out, exits, or cannot open in the cloud browser. The same Site-owning agent keeps source repairs in `sites-building` and publishing in `sites-hosting`; do not delegate this recovery. Use the preview contract in [Managed-linux preview](../sites-building/references/preview/managed-linux.md).

Before any cloud-browser action in this skill, load and read the skill `$control-browser` and follow it. This must happen before browser setup, tab selection, navigation, screenshots, or interaction. If that skill is unavailable, do not improvise another browser-control path; apply the fallback boundary below.

## Runtime contract

`sites-preview` is a container-provided client backed by a supervised daemon that serves the live checkout for agent preview. Do not install, replace, or recreate the binary; start the daemon yourself; or modify its `/tmp/sites-previewd` mailbox.

The service:

- accepts `start <site-root>`, `status`, and `stop`;
- permits one active agent preview per container;
- reuses a healthy agent preview when `start` receives the same Site root and replaces its own agent preview when a different Site root is started;
- requires the canonical Site root to be beneath `/workspace` and contain `package.json`;
- runs the project inside a restricted filesystem rooted at the Site checkout;
- invokes `npm run dev -- --host 0.0.0.0 --port 4173 --strictPort` with the bundled Node runtime;
- waits up to 30 seconds for port `4173` to become healthy; and
- includes the tail of the dev-server output when the process exits early or times out.

The agent-preview address is always `http://terminal.local:4173/`. Use HTTP, not HTTPS. Never expose this internal address to the user.

## Diagnose briefly, then recover

1. Read the complete error and included dev-server log tail from the failed `sites-preview start "$PWD"` call.
2. Run `sites-preview status` to see whether the daemon owns a running agent preview.
3. Classify the failure and apply the smallest relevant repair below.
4. Make at most two total `start` attempts, including the original failure. Make the second only after a concrete configuration repair or a plausible environment recovery. Avoid repeating an unchanged command or cycling through alternate hosts and ports.

### Client or daemon unavailable

Errors such as command not found, an unavailable `/tmp/sites-previewd` mailbox, or a timed-out daemon response are agent-preview infrastructure failures. Do not install the command, launch the daemon, manipulate mailbox files, or make a second unchanged attempt. Continue with the fallback boundary below.

### Invalid Site root

The root must resolve beneath `/workspace` and contain `package.json`. Run from the Site checkout selected by [Managed-linux project setup](../sites-building/references/project-setup/managed-linux.md), not a parent directory, temporary directory, or symlink outside `/workspace`. Do not copy or relocate the Site merely to satisfy agent preview.

### Port already in use

Run `sites-preview stop`, check `sites-preview status`, and use the one remaining `start` attempt. The service normally stops its own previous agent preview automatically. If port `4173` remains occupied, treat it as an environment problem; do not kill an unknown process or switch ports.

### Dev server exits or health check times out

Use the agent-preview log tail returned by `sites-preview` as the primary diagnostic. Confirm:

- dependencies from the existing lockfile are installed;
- `package.json` has a `dev` script that invokes Vite, directly or through compatible environment prefixes or wrappers, and accepts the forwarded flags;
- a Vite/Vinext project does not use `vinext dev`; and
- Vite includes `server.host: "0.0.0.0"` and `server.allowedHosts: ["terminal.local"]`.

For a starter with `scripts/execution-profile.mjs`, first refresh the checkout-local profile with `node <plugin-root>/scripts/configure-execution-profile.mjs`. If it changed to `managed-linux`, stop and restart the Site's supervised preview rather than hard-coding a different dev script. Preserve the portable path for future editing elsewhere.

#### Recovery recipes

Use the first matching recipe:

- **Legacy Vinext CLI:** Change `"dev": "vinext dev"` to `"dev": "vite"` and keep the `vinext()` plugin in `vite.config.ts`. Do not keep `vinext dev` and change only `server.host`: Vinext expects `--hostname`, while agent preview forwards Vite's `--host` and `--strictPort` flags.
- **Environment-prefixed Vite:** Preserve prefixes that still invoke Vite directly, for example `"dev": "WRANGLER_LOG_PATH=.wrangler/wrangler.log vite"`; the forwarded preview flags will reach Vite.
- **Vite wrapper:** Preserve a wrapper only when it forwards every received argument to Vite, including `--host`, `--port`, and `--strictPort`. Otherwise make the `dev` script invoke Vite directly.

In every recipe, ensure the resulting Vite configuration includes the following settings. Merge `terminal.local` with any existing allowed hosts rather than removing them:

```json
{
  "scripts": {
    "dev": "vite"
  }
}
```

```ts
export default defineConfig({
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
  },
  plugins: [
    vinext(),
    // other plugins
  ],
});
```

After agent preview starts successfully, keep the smallest compatibility repair in the checkout and return to `sites-building`. Do not revert a proven repair as preview-only state. Include it in the next source commit so later checkouts inherit the working setup.

Use the project's existing package manager and lockfile for missing dependencies. Preserve compatible script wrappers, its architecture, and its hosting configuration. Because agent preview runs with a restricted filesystem and cleared environment, diagnose dependencies on files, tools, environment variables, or paths outside the checkout as agent-preview compatibility issues; do not weaken the project or expose credentials to work around them.

### Agent preview runs but the cloud browser cannot reach it

Confirm `sites-preview status` reports `running` and navigate only to `http://terminal.local:4173/`. If the exact HTTP address remains unreachable, treat browser access or approval as an environment failure. Do not navigate to loopback, `0.0.0.0`, HTTPS, another port, or a live Sites URL, and do not rewrite working Site code to compensate. Live Sites URLs are user-facing and are not reachable from the cloud-browser runtime.

### The cloud browser reaches an application error

If the cloud browser loads the agent preview but the page errors, content is broken, or a primary interaction fails, treat it as a source problem. Fix it in the checkout, allow the running Vite server to reload, and verify again. Use the remaining `start` attempt only when the dev server must restart for a concrete configuration change.

## Fallback boundary

After the bounded attempts, if the remaining problem is the agent-preview command, daemon, port ownership, cloud-browser access, or restricted runtime rather than a known Site defect, return to `sites-building` and finish the complete requested implementation and production build. Use `sites-hosting` for hosted work and direct main-agent status verification, or finish without publishing for local-only work. Unavailable agent preview does not block an otherwise valid result unless the user explicitly required passing browser QA before deployment.

Mention the agent-preview limitation to the user only when it materially affects confidence. Keep command names, internal addresses, container details, and other agent-preview internals out of the user-facing explanation.
