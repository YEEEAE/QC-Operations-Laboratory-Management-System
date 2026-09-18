# Managed Linux project setup

## Hosted runtime

Hosted server code runs in Cloudflare Workers, with **128 MB of memory per isolate**, shared across concurrent requests and including JavaScript and WebAssembly allocations.

## Project setup

Use a Site checkout beneath `/workspace`, normally `/workspace/sites/<slug>`. Keep all source changes in that checkout and use `.openai/hosting.json` as its identity; do not maintain a separate Site catalog. Choose an empty destination without moving, deleting, or overwriting existing workspace files.

For plain static assets, author `dist/index.html` and supporting assets directly, and set `static.directory` to `dist` in `.openai/hosting.json`. Keep authored assets tracked in Git. Skip starter setup, dependency installation, and build scripts; validate entrypoints, requested routes, local asset references, and JavaScript syntax before hosting. Framework static exports still use their installation and build scripts.

For a new Site using the starter, run `node <plugin-root>/scripts/project-setup.mjs` in the empty checkout to copy the shared `templates/vinext-starter` and detect and save the checkout-local execution profile. Do not modify the bundled starter itself. It already contains Shadcn components and the supported storage and authentication helpers. Follow the early registration instructions in `sites-building` once the source is in place.

Follow these Sites skills for dependency installation, the successful local build, and publication. The shared starter README documents both environments; use its managed-linux guidance here.

For the initial dependency setup of each new bundled Vinext Site, run `node <plugin-root>/scripts/install-dependencies.mjs --prefer-pnpm` from the copied checkout before changing `package.json`, `package-lock.json`, or `.npmrc`. The helper tries image-pinned pnpm with the workspace store and can select the existing npm installer for an initial operational failure. Both attempts use canonical temporary checkouts while retaining the real project's installation lock; modified inputs stop adoption instead of being overwritten. Begin application source work while installation continues, and wait for manager selection before adding dependencies. Do not overlap installers or replace the helper with a model-written fallback.

For a checkout that previously attempted `--prefer-pnpm`, preserve that attempt when resuming, even if new projects now default to npm. Until the helper explicitly reports pnpm adoption or npm fallback, repair environment failures and retry with `node <plugin-root>/scripts/install-dependencies.mjs --prefer-pnpm`. Keep policy or integrity failures stopped; do not drop the flag, relax checks, or edit dependency inputs to force npm, and require a reviewed starter update for a starter defect. If the earlier result is missing or unclear, inspect the prior attempt before continuing; the initial npm lock alone does not establish fallback. After either explicit manager selection, preserve its lockfile and run `node <plugin-root>/scripts/install-dependencies.mjs` without the flag for later installs or repairs, including an npm install that failed after fallback was selected.

The workspace pnpm store is initialized once and reused across eligible projects, each with its own `node_modules`. The helper respects filesystem permissions and does not request broader access. Initial npm fallback uses the existing image seed only when its lockfile matches. Once a project uses pnpm, preserve pnpm for dependency changes and repairs. Reuse the starter's bundled components, helpers, and dependencies without redundant installs.

For a retained Site template, use `node <plugin-root>/scripts/project-setup.mjs --template-source <absolute-assets-source-directory>` in the empty checkout. Preserve its package manager, lockfile, architecture, and logical D1/R2 bindings; run the installation script if it has a `package.json`. A reusable template must not carry another Site's `project_id`, Git metadata, credentials, or runtime data.

For an existing Site, follow the shared reopening instructions in `sites-building`. Preserve its package manager, lockfile, scripts, architecture, and binding names; use the installation script only when it has a `package.json` and dependencies are absent.

For a Site already declaring pnpm, keep its `pnpm-lock.yaml` authoritative. Run `node <plugin-root>/scripts/install-dependencies.mjs` to install or repair dependencies; the shipped pnpm helper can repair into a permitted project store if the shared store is unavailable. Do not switch it to npm or restore an old npm lock. To add dependencies in the managed Work image, use `node "$SITES_PNPM_BIN" add <package>` from its checkout; elsewhere use the project's declared pnpm version. Each project has its own `node_modules`, even when package content is shared.

Use `node <plugin-root>/scripts/project-setup.mjs --starter worker-esm` only when the request specifically requires the buildless Worker starter and `templates/worker-esm-starter` is bundled. If it is absent, report the unavailable starter rather than substituting a different architecture. Follow its README and preserve its build script rather than introducing Vite. It deploys only `worker/index.js` and the hosting manifest: if essential raster imagery is used, embed its bytes in the Worker and serve or reference them there rather than adding standalone asset files.
