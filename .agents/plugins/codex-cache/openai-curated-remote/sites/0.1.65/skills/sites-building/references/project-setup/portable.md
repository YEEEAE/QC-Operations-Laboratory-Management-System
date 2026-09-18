# Portable project setup

## Hosted runtime

Hosted server code runs in Cloudflare Workers, with **128 MB of memory per isolate**, shared across concurrent requests and including JavaScript and WebAssembly allocations.

## Project setup

### 1. Choose or reuse the project

- **New Site:** Use the task's workspace directory if it is suitable for initializing a new Site; otherwise choose an empty project directory without moving, deleting, or overwriting existing files.
- **Existing Site:** Preserve its package manager, lockfile, scripts, architecture, and binding names. Run `node <plugin-root>/scripts/install-dependencies.mjs` only when a `package.json` is present and dependencies are missing; do not initialize it again.
- **Retained template:** Run `node <plugin-root>/scripts/project-setup.mjs --template-source <absolute-sanitized-source-directory>` in the empty project directory, then `node <plugin-root>/scripts/install-dependencies.mjs` if the template has a `package.json`. Do not copy the bundled starter over it.

### 2. Set up the selected project

For plain static assets, author `dist/index.html` and supporting assets directly, and set `static.directory` to `dist` in `.openai/hosting.json`. Keep authored assets tracked in Git. Skip starter setup, dependency installation, and build scripts; validate entrypoints, requested routes, local asset references, and JavaScript syntax before hosting. Framework static exports still use their installation and build scripts.

For a new Site using the bundled starter, run `node <plugin-root>/scripts/project-setup.mjs` with the selected project directory as the working directory. It copies `templates/vinext-starter` with dotfiles, detects and saves the checkout-local execution profile, and leaves Git metadata untouched. Initialize Git during publishing, if needed.

### 3. Install dependencies

Run `node <plugin-root>/scripts/install-dependencies.mjs` from the copied checkout. This separately measures installation through the starter's locked `install:ci` script.

- **Network:** Uncached dependencies require npm registry access. Request network escalation for installation only when the sandbox's registry access requires it.
- **Environment:** Preserve the caller's HOME, npm cache, registry, proxy, and temporary-directory settings. The installer uses the project's own lockfile even inside an npm workspace and includes required dev/optional dependencies despite production/omit settings.
- **Authoring:** Begin source work once copied files exist; edit the Site checkout, not the bundled starter. Do not overlap installers. Reuse the starter's bundled components, helpers, and dependencies; avoid redundant installs.
