# Work pnpm foundation

Ordinary project setup remains npm. This foundation adds an explicit new-project opt-in and an independent diagnostic; neither runs from image startup. Activation is a later Work guidance release. All distributions carry identical starter files, including dormant pnpm helpers; Desktop setup remains portable npm.

In the managed-linux execution environment, from a fresh checkout created by `node <plugin-root>/scripts/project-setup.mjs`, run:

```sh
node <plugin-root>/scripts/install-dependencies.mjs --prefer-pnpm
```

Only the unchanged Vinext starter dependency inputs qualify. Bootstrap assets live here, outside the default copied starter, so their presence cannot change the local or server-side package-manager selector. A hash receipt binds the canonical npm inputs and imported pnpm lock; the image verifies its artifact identities/versions/integrities against the npm lock before fetching public content. Regenerate and review the receipt and imported lock together when the starter dependencies change.

The optional installer runs in a temporary project while the real project's install lock is held. On success it installs one pnpm lock, `packageManager`, matching `install:ci` script and project-local `node_modules`. On an allowed operational failure, unchanged initial inputs can use the existing seeded npm installer in a separate canonical temporary checkout while retaining the real project's install lock. Neither attempt installs against mutable real-project dependency inputs. Both temporary checkouts preserve the selected execution profile, and adoption leaves the real checkout's local profile untouched. Integrity/policy failures and cancellation stop. Fallback latency includes any pnpm work already attempted; it is not a free retry.

Before publishing either result, adoption atomically claims the original npm inputs and checks those claimed bytes against the receipt. New manifest/config paths are published exclusively, so a recreated author file is not overwritten. The claimed files remain under `.sites-runtime/pnpm-adoption-inputs-*`, including after success, to preserve edits through previously open file descriptors. Rollback also retains produced files there and restores inputs only into absent paths. Reported conflicts require inspection before retrying; recovery files are ignored runtime data, not another active lockfile or publication input.

An explicit opt-in on modified dependency inputs fails without running either installer, including on a retry after a policy failure. Keep initial setup on the unchanged supported starter; add dependencies after a manager is selected. Repair environment failures before retrying the same opt-in command. A starter policy or integrity problem requires corrected, reviewed bootstrap inputs; editing the project's dependency files does not authorize npm fallback. Once the helper explicitly reports npm fallback, later no-flag installs preserve that npm choice, even if its initial install fails. If that selection result is unavailable, inspect the prior attempt before choosing a retry.

Once adopted, ordinary `install-dependencies.mjs` keeps the project's pnpm graph. It never uses a stale npm lock after `pnpm add` or `pnpm update`. If shared-store access is lost, a frozen native pnpm installation repairs the layout in a permitted project store. Existing pnpm projects need the foundation helpers and a pnpm-capable image even after activation is reverted.

## Storage and permissions

The image supplies pnpm 11.25.0 and a read-only package seed at `/opt/codex/cache/sites-vinext-pnpm`. Eligible projects use `/workspace/.sites-runtime/pnpm-store`, initialized once under a bounded lock. An existing mutable store is never overwritten by an image update. Missing packages use normal pnpm fetching and policy checks.

Normal Work permits writes across the owner's `/workspace`. Sharing a store there does not add a write grant or cross-owner sharing. A narrower Library session may lack access: new setups use npm; established pnpm projects repair privately. Actual write probes choose the path, without requesting broader permissions. `clone-or-copy` prevents project files from being writable aliases of shared-store inodes. Each project retains its own `node_modules`.

Tracked configuration uses an environment expression with a project-relative default, so exported source contains no absolute machine store path. Runtime stores/reports/modules are already excluded by the starter's Git ignore rules. The server builder installs the authoritative lock independently; it does not inherit this helper's shared store or npm fallback.

## Validate before activation

From a selected Work project, explicitly run one of:

```sh
node <plugin-root>/scripts/validate-pnpm.mjs --check readiness
node <plugin-root>/scripts/validate-pnpm.mjs --check store
node <plugin-root>/scripts/validate-pnpm.mjs --check reuse
```

`readiness` checks tooling. `store` also prepares the real workspace store. `install`, `build`, and `reuse` successively add a scratch install, scratch build, and second-project install. These never change the active Site's package files, modules, source or publication. Only scratch directories are removed. Probes consume CPU/disk/network and warm the shared cache; they are opt-in diagnostics, not a promise of zero overhead or an npm/pnpm latency experiment.

The final `[sites pnpm validation]` JSON contains `ok` and per-stage outcomes. A completed diagnostic exits zero even when an inner check failed, because the plugin transport reads sidecars only for completed commands; automated callers must assert `ok`. Cancellation propagates. Separate `pnpm_validation.result` and `pnpm_validation.duration_ms` metrics retain failures/skips without adding shadow samples to real dependency-install latency. See the backend [metric contract](https://github.com/openai/openai/blob/master/chatgpt/codex-backend/docs/sites_workflow_metrics.md).

Image CI runs real offline installs/builds as `oai`, native pnpm store-repair tests, bootstrap/rollback tests and shadow isolation checks. Before activation is published, also verify the exact image and plugin versions in real Work, normal and Library permissions, changed dependencies and saved-source publication. A Docker test does not establish that production uses the image.

Reverting and publishing only the activation guidance stops new opt-ins while foundation support remains available for established pnpm projects. It does not instantly cancel cached or in-flight instructions. Never revert an existing project to npm merely because activation was rolled back. Foundation guidance also preserves fatal stops and retry rules for earlier opt-in attempts that have not yet selected a manager.
