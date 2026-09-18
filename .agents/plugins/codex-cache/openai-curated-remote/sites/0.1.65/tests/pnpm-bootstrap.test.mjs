import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { once } from "node:events";
import {
  chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync,
  readdirSync, readlinkSync, rmSync, symlinkSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const pluginSource = fileURLToPath(new URL("../", import.meta.url));
const starterPath = "skills/sites-building/templates/vinext-starter";
const inputs = ["package.json", "package-lock.json", ".npmrc"];
const integration = (name, callback) => test(name, {
  skip: process.platform !== "linux", timeout: 15_000,
}, callback);

const installedModules = `
mkdir -p node_modules/.pnpm/fixture/node_modules/fixture
printf 'installed by pnpm\n' > node_modules/.pnpm/fixture/node_modules/fixture/index.js
ln -sfn .pnpm/fixture/node_modules/fixture node_modules/fixture
`;

function fixture(t, helperBody = installedModules, { npmBody = "", executionProfile = "managed-linux" } = {}) {
  const root = mkdtempSync(path.join(tmpdir(), "sites-pnpm-bootstrap-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const plugin = path.join(root, "plugin");
  for (const relative of ["scripts", "assets/pnpm/vinext", starterPath]) {
    cpSync(path.join(pluginSource, relative), path.join(plugin, relative), {
      recursive: true,
      filter: (source) => !["node_modules", ".sites-runtime"].includes(path.basename(source)),
    });
  }
  // Replace only the copied helper. Production code has no test-specific hooks.
  writeFileSync(path.join(plugin, starterPath, "scripts/install-pnpm.sh"), `#!/usr/bin/env bash
set -euo pipefail
node -e 'const fs = require("node:fs"); const executionProfile = JSON.parse(fs.readFileSync(".sites-runtime/execution-profile.json")).executionProfile; fs.appendFileSync(process.env.SITES_FIXTURE_CALLS, JSON.stringify({manager:"pnpm", args:process.argv.slice(1), cwd:process.cwd(), executionProfile})+"\\n")' -- "$@"
if [[ -n "\${SITES_INSTALL_REPORT_PATH:-}" ]]; then
  printf '%s\\n' '{"version":1,"cache_seed":"seed_used","store_scope":"workspace","store_state":"seeded"}' > "\${SITES_INSTALL_REPORT_PATH}"
fi
${helperBody}
`);
  const project = path.join(root, "project");
  cpSync(path.join(plugin, starterPath), project, { recursive: true });
  mkdirSync(path.join(project, ".sites-runtime"));
  const profileContents = executionProfile === null ? null : `${JSON.stringify({ executionProfile })}\n`;
  if (profileContents !== null) writeFileSync(path.join(project, ".sites-runtime/execution-profile.json"), profileContents);
  const bin = path.join(root, "bin");
  mkdirSync(bin);
  writeFileSync(path.join(bin, "npm"), `#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const {createHash} = require("node:crypto");
const {spawnSync} = require("node:child_process");
const runtime = path.join(process.cwd(), ".sites-runtime");
fs.mkdirSync(runtime, {recursive:true});
const executionProfile = JSON.parse(fs.readFileSync(path.join(runtime, "execution-profile.json"))).executionProfile;
const probeLock = (directory) => spawnSync("flock", ["-n", "-E", "75", path.join(directory, "install.lock"), "true"]).status;
// The scratch npm installer owns its own lock; bootstrap must keep the actual
// project's lock while this command consumes the canonical dependency inputs.
const localLock = probeLock(runtime);
const projectLock = probeLock(path.join(process.env.SITES_FIXTURE_PROJECT, ".sites-runtime"));
const inputHashes = Object.fromEntries(${JSON.stringify(inputs)}.map((name) => [name,
  fs.existsSync(name) ? createHash("sha256").update(fs.readFileSync(name)).digest("hex") : null,
]));
fs.appendFileSync(process.env.SITES_FIXTURE_CALLS, JSON.stringify({manager:"npm", args:process.argv.slice(2), cwd:process.cwd(), executionProfile, envReady:process.env.SITES_ENV_READY, projectRoot:process.env.SITES_PROJECT_ROOT, runtimeRoot:process.env.SITES_RUNTIME_ROOT, localLock, projectLock, inputHashes})+"\\n");
if (localLock !== 0) process.exit(75);
fs.mkdirSync("node_modules", {recursive:true});
${npmBody}
`);
  chmodSync(path.join(bin, "npm"), 0o755);
  const pinnedPnpm = path.join(root, "pnpm.cjs");
  writeFileSync(pinnedPnpm, 'if(process.argv[2]==="--version") console.log("11.25.0"); else process.exit(1);\n');
  const calls = path.join(root, "calls.jsonl");
  const metrics = path.join(root, "metrics.json");
  writeFileSync(calls, "");
  writeFileSync(metrics, "");
  return {
    root, plugin, project, calls, metrics, executionProfile, profileContents,
    original: Object.fromEntries(inputs.map((name) => [name, readFileSync(path.join(project, name), "utf8")])),
    env: {
      ...process.env,
      PATH: `${bin}:${process.env.PATH}`,
      CODEX_PLUGIN_METRICS_OUTPUT: metrics,
      SITES_PNPM_BIN: pinnedPnpm,
      SITES_FIXTURE_CALLS: calls,
      SITES_FIXTURE_PROJECT: project,
    },
  };
}

function killGroup(child, signal = "SIGKILL") {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) return;
  try { process.kill(-child.pid, signal); } catch (error) {
    if (error.code !== "ESRCH") throw error;
  }
}

function execute(f, args = [], { entrypoint = "install-dependencies.mjs", preload, cancel = false } = {}) {
  return new Promise((resolve, reject) => {
    const command = [...(preload ? ["--import", preload] : []), path.join(f.plugin, "scripts", entrypoint), ...args];
    // Isolate only the test process group so cancellation cannot reach the runner.
    const child = spawn(process.execPath, command, {
      cwd: f.project, env: f.env, detached: true, stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let cancelled = false;
    const timeout = setTimeout(() => {
      killGroup(child);
      reject(new Error(`Fixture command timed out: ${stdout}\n${stderr}`));
    }, 10_000);
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (cancel && !cancelled && stdout.includes("fixture-pnpm-ready")) {
        cancelled = true;
        killGroup(child, "SIGTERM");
      }
    });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", (error) => { clearTimeout(timeout); reject(error); });
    child.once("close", (code, signal) => {
      clearTimeout(timeout);
      resolve({ code, signal, stdout, stderr });
    });
  });
}

function calls(f) {
  return readFileSync(f.calls, "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
}

function unchangedNpmInputs(f) {
  for (const [name, expected] of Object.entries(f.original)) {
    assert.equal(readFileSync(path.join(f.project, name), "utf8"), expected, name);
  }
  assert.equal(existsSync(path.join(f.project, "pnpm-lock.yaml")), false);
  assert.equal(existsSync(path.join(f.project, "pnpm-workspace.yaml")), false);
  unchangedExecutionProfile(f);
}

function unchangedExecutionProfile(f) {
  const filename = path.join(f.project, ".sites-runtime/execution-profile.json");
  if (f.profileContents === null) assert.equal(existsSync(filename), false);
  else assert.equal(readFileSync(filename, "utf8"), f.profileContents);
}

function noScratchProjects(f) {
  const runtime = path.join(f.project, ".sites-runtime");
  if (existsSync(runtime)) {
    assert.deepEqual(readdirSync(runtime).filter((name) => name.startsWith("pnpm-validation-")), []);
  }
}

function recoveryDirectory(f) {
  const runtime = path.join(f.project, ".sites-runtime");
  const names = readdirSync(runtime).filter((name) => name.startsWith("pnpm-adoption-inputs-"));
  assert.equal(names.length, 1, names.join(", "));
  return path.join(runtime, names[0]);
}

function assertCanonicalNpmFallback(f, call) {
  assert.equal(call.manager, "npm");
  assert.deepEqual(call.args, ["--prefix", ".", "--workspaces=false", "run", "install:ci"]);
  assert.equal(call.executionProfile, f.executionProfile ?? "portable");
  assert.equal(path.dirname(call.cwd), path.join(f.project, ".sites-runtime"));
  assert.ok(path.basename(call.cwd).startsWith("pnpm-validation-"), call.cwd);
  assert.equal(call.localLock, 0, "scratch npm install can acquire its own lock");
  assert.equal(call.projectLock, 75, "the actual project lease stays held during fallback");
  assert.deepEqual(call.inputHashes, Object.fromEntries(Object.entries(f.original).map(([name, value]) => [
    name, createHash("sha256").update(value).digest("hex"),
  ])));
}

function preloadFilesystem(f, name, body) {
  const filename = path.join(f.root, `${name}.mjs`);
  writeFileSync(filename, `import fs from "node:fs";
import path from "node:path";
import {syncBuiltinESMExports} from "node:module";
const project = process.env.SITES_FIXTURE_PROJECT;
${body}
syncBuiltinESMExports();\n`);
  return filename;
}

integration("default installation remains npm with dormant pnpm assets available", async (t) => {
  const f = fixture(t);
  const result = await execute(f);
  assert.equal(result.code, 0, result.stderr);
  assert.deepEqual(calls(f).map(({ manager }) => manager), ["npm"]);
  unchangedNpmInputs(f);
});

integration("operational pnpm failure installs canonical npm inputs while retaining the project lease", async (t) => {
  const f = fixture(t, "exit 69");
  f.env.SITES_ENV_READY = "1";
  f.env.SITES_PROJECT_ROOT = f.project;
  f.env.SITES_RUNTIME_ROOT = path.join(f.project, ".sites-runtime");
  const result = await execute(f, ["--prefer-pnpm"]);
  assert.equal(result.code, 0, result.stderr);
  assert.deepEqual(calls(f).map(({ manager }) => manager), ["pnpm", "npm"]);
  assert.equal(calls(f)[0].executionProfile, "managed-linux");
  const fallback = calls(f)[1];
  assertCanonicalNpmFallback(f, fallback);
  assert.notEqual(fallback.envReady, "1");
  assert.notEqual(fallback.projectRoot, f.project);
  assert.notEqual(fallback.runtimeRoot, f.env.SITES_RUNTIME_ROOT);
  unchangedNpmInputs(f);
  assert.equal(existsSync(path.join(f.project, "node_modules")), true);
  noScratchProjects(f);
});

integration("an unavailable image uses the same locked canonical npm fallback", async (t) => {
  const f = fixture(t);
  delete f.env.SITES_PNPM_BIN;
  const result = await execute(f, ["--prefer-pnpm"]);
  assert.equal(result.code, 0, result.stderr);
  assert.deepEqual(calls(f).map(({ manager }) => manager), ["npm"]);
  assertCanonicalNpmFallback(f, calls(f)[0]);
  unchangedNpmInputs(f);
  assert.equal(existsSync(path.join(f.project, "node_modules")), true);
  noScratchProjects(f);
});

for (const executionProfile of ["portable", null]) {
  integration(`${executionProfile === null ? "missing profile defaults to portable" : "portable selection survives"} in both scratch attempts and npm fallback`, async (t) => {
    const f = fixture(t, "exit 69", { executionProfile });
    const result = await execute(f, ["--prefer-pnpm"]);
    assert.equal(result.code, 0, result.stderr);
    assert.deepEqual(calls(f).map(({ manager, executionProfile }) => [manager, executionProfile]), [
      ["pnpm", "portable"], ["npm", "portable"],
    ]);
    assertCanonicalNpmFallback(f, calls(f)[1]);
    unchangedNpmInputs(f);
    noScratchProjects(f);
  });
}

integration("invalid local profile stops opt-in before either installer without changing inputs", async (t) => {
  const f = fixture(t, installedModules, { executionProfile: "invalid" });
  const result = await execute(f, ["--prefer-pnpm"]);
  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /profile/i);
  assert.deepEqual(calls(f), []);
  unchangedNpmInputs(f);
  assert.equal(existsSync(path.join(f.project, "node_modules")), false);
  noScratchProjects(f);
});

integration("symlinked local profile stops opt-in without following or replacing it", async (t) => {
  const f = fixture(t);
  const outside = path.join(f.root, "outside-profile.json");
  const profile = path.join(f.project, ".sites-runtime/execution-profile.json");
  writeFileSync(outside, f.profileContents);
  rmSync(profile);
  symlinkSync(outside, profile);
  const result = await execute(f, ["--prefer-pnpm"]);
  assert.equal(result.code, 78);
  assert.deepEqual(calls(f), []);
  assert.equal(readlinkSync(profile), outside);
  assert.equal(readFileSync(outside, "utf8"), f.profileContents);
  unchangedNpmInputs(f);
  assert.equal(existsSync(path.join(f.project, "node_modules")), false);
  noScratchProjects(f);
});

integration("an edit before npm starts cannot change its fallback graph or be overwritten", async (t) => {
  const f = fixture(t, "exit 69");
  const preload = path.join(f.root, "edit-before-npm.mjs");
  writeFileSync(preload, `import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {syncBuiltinESMExports} from "node:module";
const originalSpawn = childProcess.spawn;
childProcess.spawn = function(command, args, options) {
  if (command === "npm" && args.join(" ") === "--prefix . --workspaces=false run install:ci") {
    const filename = path.join(process.env.SITES_FIXTURE_PROJECT, "package.json");
    const manifest = JSON.parse(fs.readFileSync(filename));
    manifest.dependencies["fixture-added"] = "1.0.0";
    fs.writeFileSync(filename, JSON.stringify(manifest));
  }
  return originalSpawn(command, args, options);
};
syncBuiltinESMExports();\n`);
  const result = await execute(f, ["--prefer-pnpm"], { preload });
  assert.equal(result.code, 78, result.stderr);
  assert.deepEqual(calls(f).map(({ manager }) => manager), ["pnpm", "npm"]);
  assertCanonicalNpmFallback(f, calls(f)[1]);
  const manifest = JSON.parse(readFileSync(path.join(f.project, "package.json"), "utf8"));
  assert.equal(manifest.dependencies["fixture-added"], "1.0.0");
  assert.equal(manifest.packageManager, undefined);
  for (const input of ["package-lock.json", ".npmrc"]) {
    assert.equal(readFileSync(path.join(f.project, input), "utf8"), f.original[input]);
  }
  assert.equal(existsSync(path.join(f.project, "node_modules")), false);
  assert.equal(existsSync(path.join(f.project, "pnpm-lock.yaml")), false);
  noScratchProjects(f);
});

integration("handled cancellation during scratch npm fallback cannot adopt its modules", async (t) => {
  const f = fixture(t, "exit 69", { npmBody: `
process.on("SIGTERM", () => process.exit(69));
process.stdout.write("fixture-pnpm-ready\\n");
setInterval(() => {}, 1000);
` });
  const result = await execute(f, ["--prefer-pnpm"], { cancel: true });
  assert.ok(result.signal === "SIGTERM" || result.code === 143, JSON.stringify(result));
  assert.deepEqual(calls(f).map(({ manager }) => manager), ["pnpm", "npm"]);
  assertCanonicalNpmFallback(f, calls(f)[1]);
  unchangedNpmInputs(f);
  assert.equal(existsSync(path.join(f.project, "node_modules")), false);
  noScratchProjects(f);
});

integration("fatal pnpm failure does not bypass policy through npm", async (t) => {
  const f = fixture(t, "exit 65");
  const result = await execute(f, ["--prefer-pnpm"]);
  assert.equal(result.code, 65, result.stderr);
  assert.deepEqual(calls(f).map(({ manager }) => manager), ["pnpm"]);
  unchangedNpmInputs(f);
  assert.equal(existsSync(path.join(f.project, "node_modules")), false);
  noScratchProjects(f);
});

integration("handled cancellation cannot trigger npm fallback", async (t) => {
  const f = fixture(t, `trap 'exit 69' TERM
printf 'fixture-pnpm-ready\\n'
while true; do sleep 1; done`);
  const result = await execute(f, ["--prefer-pnpm"], { cancel: true });
  assert.ok(result.signal === "SIGTERM" || result.code === 143, JSON.stringify(result));
  assert.deepEqual(calls(f).map(({ manager }) => manager), ["pnpm"]);
  unchangedNpmInputs(f);
  assert.equal(existsSync(path.join(f.project, "node_modules")), false);
  noScratchProjects(f);
});

integration("successful adoption finalizes one manager and later no-flag repairs stay pnpm", async (t) => {
  const f = fixture(t);
  const result = await execute(f, ["--prefer-pnpm"]);
  assert.equal(result.code, 0, result.stderr);
  const manifest = JSON.parse(readFileSync(path.join(f.project, "package.json"), "utf8"));
  assert.equal(manifest.packageManager, "pnpm@11.25.0");
  assert.equal(manifest.scripts["install:ci"], "bash scripts/install-pnpm.sh");
  assert.equal(existsSync(path.join(f.project, "package-lock.json")), false);
  assert.equal(existsSync(path.join(f.project, "pnpm-lock.yaml")), true);
  assert.equal(existsSync(path.join(f.project, "pnpm-workspace.yaml")), true);
  assert.equal(readFileSync(path.join(f.project, "node_modules/fixture/index.js"), "utf8"), "installed by pnpm\n");
  assert.equal(calls(f)[0].executionProfile, "managed-linux");
  unchangedExecutionProfile(f);
  noScratchProjects(f);

  const repair = await execute(f);
  assert.equal(repair.code, 0, repair.stderr);
  assert.deepEqual(calls(f).map(({ manager }) => manager), ["pnpm", "pnpm"]);
  assert.equal(calls(f)[1].cwd, f.project);
  assert.equal(calls(f)[1].executionProfile, "managed-linux");
  unchangedExecutionProfile(f);
  assert.equal(existsSync(path.join(f.project, "package-lock.json")), false);
});

integration("an edited npm project rejects pnpm opt-in and retains ordinary npm support", async (t) => {
  const f = fixture(t);
  const filename = path.join(f.project, "package.json");
  const manifest = JSON.parse(readFileSync(filename, "utf8"));
  manifest.dependencies["fixture-added"] = "1.0.0";
  writeFileSync(filename, JSON.stringify(manifest));
  const expected = readFileSync(filename, "utf8");
  const result = await execute(f, ["--prefer-pnpm"]);
  assert.equal(result.code, 78, result.stderr);
  assert.deepEqual(calls(f), []);
  assert.equal(readFileSync(filename, "utf8"), expected);
  assert.equal(existsSync(path.join(f.project, "pnpm-lock.yaml")), false);
  assert.equal(existsSync(path.join(f.project, "node_modules")), false);

  // An explicit opt-in failure does not change the no-flag existing-npm path.
  const ordinary = await execute(f);
  assert.equal(ordinary.code, 0, ordinary.stderr);
  assert.deepEqual(calls(f).map(({ manager }) => manager), ["npm"]);
  assert.equal(readFileSync(filename, "utf8"), expected);
});

for (const input of inputs) {
  integration(`editing ${input} after a fatal pnpm failure cannot bypass it on opt-in retry`, async (t) => {
    const f = fixture(t, "exit 65");
    const initial = await execute(f, ["--prefer-pnpm"]);
    assert.equal(initial.code, 65, initial.stderr);
    const filename = path.join(f.project, input);
    const changed = `${readFileSync(filename, "utf8")}\n`;
    writeFileSync(filename, changed);
    const retry = await execute(f, ["--prefer-pnpm"]);
    assert.equal(retry.code, 78, retry.stderr);
    assert.deepEqual(calls(f).map(({ manager }) => manager), ["pnpm"]);
    assert.equal(readFileSync(filename, "utf8"), changed);
    assert.equal(existsSync(path.join(f.project, "node_modules")), false);
    assert.equal(existsSync(path.join(f.project, "pnpm-lock.yaml")), false);
    noScratchProjects(f);
  });
}

integration("dependency edits while acquiring the install lock cannot fall through to npm", async (t) => {
  const f = fixture(t);
  const preload = path.join(f.root, "edit-before-lock.mjs");
  writeFileSync(preload, `import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {syncBuiltinESMExports} from "node:module";
const originalSpawn = childProcess.spawn;
childProcess.spawn = function(command, args, options) {
  if (command === "bash" && args[1]?.startsWith("flock ")) {
    const filename = path.join(process.env.SITES_FIXTURE_PROJECT, "package.json");
    const manifest = JSON.parse(fs.readFileSync(filename));
    manifest.dependencies["fixture-added"] = "1.0.0";
    fs.writeFileSync(filename, JSON.stringify(manifest));
  }
  return originalSpawn(command, args, options);
};
syncBuiltinESMExports();\n`);
  const result = await execute(f, ["--prefer-pnpm"], { preload });
  assert.equal(result.code, 78, result.stderr);
  assert.deepEqual(calls(f), []);
  const manifest = JSON.parse(readFileSync(path.join(f.project, "package.json"), "utf8"));
  assert.equal(manifest.dependencies["fixture-added"], "1.0.0");
  assert.equal(existsSync(path.join(f.project, "node_modules")), false);
  assert.equal(existsSync(path.join(f.project, "pnpm-lock.yaml")), false);
  noScratchProjects(f);
});

integration("dependency edits during staging survive without adopting or falling back", async (t) => {
  const f = fixture(t, `${installedModules}
node -e 'const fs=require("node:fs"); const p=process.env.SITES_FIXTURE_PROJECT+"/package.json"; const m=JSON.parse(fs.readFileSync(p)); m.dependencies["fixture-added"]="1.0.0"; fs.writeFileSync(p,JSON.stringify(m));'`);
  const result = await execute(f, ["--prefer-pnpm"]);
  assert.equal(result.code, 78, result.stderr);
  assert.deepEqual(calls(f).map(({ manager }) => manager), ["pnpm"]);
  const manifest = JSON.parse(readFileSync(path.join(f.project, "package.json"), "utf8"));
  assert.equal(manifest.dependencies["fixture-added"], "1.0.0");
  assert.equal(manifest.packageManager, undefined);
  assert.equal(readFileSync(path.join(f.project, "package-lock.json"), "utf8"), f.original["package-lock.json"]);
  assert.equal(existsSync(path.join(f.project, "pnpm-lock.yaml")), false);
  assert.equal(existsSync(path.join(f.project, "node_modules")), false);
  noScratchProjects(f);
});

integration("a concurrent install holds the same lock used by pnpm adoption", async (t) => {
  const f = fixture(t);
  const runtime = path.join(f.project, ".sites-runtime");
  mkdirSync(runtime, { recursive: true });
  const holder = spawn("flock", ["-n", path.join(runtime, "install.lock"), "bash", "-c", "printf 'locked\\n'; cat >/dev/null"], {
    detached: true, stdio: ["pipe", "pipe", "pipe"],
  });
  t.after(() => killGroup(holder));
  await once(holder.stdout, "data");
  const result = await execute(f, ["--prefer-pnpm"]);
  assert.equal(result.code, 75, result.stderr);
  assert.deepEqual(calls(f), []);
  unchangedNpmInputs(f);
  holder.stdin.end();
  await once(holder, "close");
});

for (const failure of ["claim", "modules", "publish"]) {
  integration(`adoption ${failure} failure restores npm inputs and preserves recovery files`, async (t) => {
    const f = fixture(t);
    const method = failure === "publish" ? "linkSync" : "renameSync";
    const target = failure === "claim" ? "package-lock.json" : failure === "modules" ? "node_modules" : "pnpm-workspace.yaml";
    const preload = preloadFilesystem(f, `fault-${failure}`, `
let fired = false;
const original = fs[${JSON.stringify(method)}];
fs[${JSON.stringify(method)}] = (...args) => {
  if (!fired && args[${failure === "claim" ? 0 : 1}] === path.join(project, ${JSON.stringify(target)})) {
    fired = true;
    throw Object.assign(new Error("fixture adoption I/O failure"), {code:"EIO"});
  }
  return original(...args);
};`);
    const result = await execute(f, ["--prefer-pnpm"], { preload });
    assert.equal(result.code, 78, JSON.stringify(result));
    assert.match(result.stderr, /fixture adoption I\/O failure/);
    assert.deepEqual(calls(f).map(({ manager }) => manager), ["pnpm"]);
    unchangedNpmInputs(f);
    assert.equal(existsSync(path.join(f.project, "node_modules")), false);
    const recovery = recoveryDirectory(f);
    assert.equal(readFileSync(path.join(recovery, "package.json"), "utf8"), f.original["package.json"]);
    if (failure === "publish") {
      assert.equal(readFileSync(path.join(recovery, "produced-node_modules/fixture/index.js"), "utf8"), "installed by pnpm\n");
    }
    noScratchProjects(f);
  });
}

for (const input of inputs) {
  integration(`an edit to ${input} immediately before its claim survives failed adoption`, async (t) => {
    const f = fixture(t);
    const preload = preloadFilesystem(f, `edit-before-claim-${input}`, `
const original = fs.renameSync;
let fired = false;
fs.renameSync = (from, to) => {
  if (!fired && from === path.join(project, ${JSON.stringify(input)}) && path.basename(path.dirname(to)).startsWith("pnpm-adoption-inputs-")) {
    fired = true;
    fs.appendFileSync(from, "\\n");
  }
  return original(from, to);
};`);
    const result = await execute(f, ["--prefer-pnpm"], { preload });
    assert.equal(result.code, 78, JSON.stringify(result));
    assert.deepEqual(calls(f).map(({ manager }) => manager), ["pnpm"]);
    for (const name of inputs) {
      assert.equal(readFileSync(path.join(f.project, name), "utf8"), f.original[name] + (name === input ? "\n" : ""));
    }
    assert.equal(readFileSync(path.join(recoveryDirectory(f), input), "utf8"), f.original[input] + "\n");
    assert.equal(existsSync(path.join(f.project, "pnpm-lock.yaml")), false);
    assert.equal(existsSync(path.join(f.project, "node_modules")), false);
    noScratchProjects(f);
  });

  integration(`a recreated ${input} after its claim is never overwritten during rollback`, async (t) => {
    const f = fixture(t);
    const preload = preloadFilesystem(f, `recreate-after-claim-${input}`, `
const original = fs.renameSync;
let fired = false;
fs.renameSync = (from, to) => {
  if (!fired && from === path.join(project, ${JSON.stringify(input)}) && path.basename(path.dirname(to)).startsWith("pnpm-adoption-inputs-")) {
    fired = true;
    const changed = fs.readFileSync(from, "utf8") + "\\n";
    const value = original(from, to);
    fs.writeFileSync(from, changed);
    return value;
  }
  return original(from, to);
};`);
    const result = await execute(f, ["--prefer-pnpm"], { preload });
    assert.equal(result.code, 78, JSON.stringify(result));
    assert.deepEqual(calls(f).map(({ manager }) => manager), ["pnpm"]);
    for (const name of inputs) {
      assert.equal(readFileSync(path.join(f.project, name), "utf8"), f.original[name] + (name === input ? "\n" : ""));
    }
    assert.equal(readFileSync(path.join(recoveryDirectory(f), input), "utf8"), f.original[input]);
    assert.equal(existsSync(path.join(f.project, "pnpm-lock.yaml")), false);
    assert.equal(existsSync(path.join(f.project, "node_modules")), false);
    noScratchProjects(f);
  });
}

for (const boundary of ["claim", "publication"]) {
  integration(`cancellation during ${boundary} leaves a coherent selected manager`, async (t) => {
    const f = fixture(t);
    const method = boundary === "claim" ? "renameSync" : "linkSync";
    const target = boundary === "claim" ? "package-lock.json" : "pnpm-workspace.yaml";
    const preload = preloadFilesystem(f, `cancel-${boundary}`, `
const original = fs[${JSON.stringify(method)}];
let fired = false;
fs[${JSON.stringify(method)}] = (...args) => {
  if (!fired && args[${boundary === "claim" ? 0 : 1}] === path.join(project, ${JSON.stringify(target)})) {
    fired = true;
    process.kill(process.pid, "SIGTERM");
  }
  return original(...args);
};`);
    const result = await execute(f, ["--prefer-pnpm"], { preload });
    assert.ok(result.signal === "SIGTERM" || result.code === 143, JSON.stringify(result));
    const manifest = JSON.parse(readFileSync(path.join(f.project, "package.json"), "utf8"));
    // Cancellation may retain completed adoption, but not a mixed lockfile state.
    if (manifest.packageManager === "pnpm@11.25.0") {
      assert.equal(existsSync(path.join(f.project, "package-lock.json")), false);
      assert.equal(existsSync(path.join(f.project, "pnpm-lock.yaml")), true);
      assert.equal(existsSync(path.join(f.project, "pnpm-workspace.yaml")), true);
      assert.equal(manifest.scripts["install:ci"], "bash scripts/install-pnpm.sh");
    } else {
      unchangedNpmInputs(f);
      assert.equal(existsSync(path.join(f.project, "node_modules")), false);
    }
    noScratchProjects(f);
  });
}

integration("a write through an already-open claimed input remains recoverable after cleanup", async (t) => {
  const f = fixture(t);
  const preload = preloadFilesystem(f, "edit-claimed-open-file", `
const filename = path.join(project, "package.json");
const changed = fs.readFileSync(filename, "utf8") + "\\n";
const descriptor = fs.openSync(filename, "r+");
const original = fs.rmSync;
let fired = false;
fs.rmSync = (target, ...args) => {
  if (!fired && path.dirname(target) === path.join(project, ".sites-runtime") && path.basename(target).startsWith("pnpm-validation-")) {
    fired = true;
    fs.writeFileSync(descriptor, changed);
    fs.closeSync(descriptor);
  }
  return original(target, ...args);
};`);
  const result = await execute(f, ["--prefer-pnpm"], { preload });
  assert.equal(result.code, 0, result.stderr);
  assert.equal(JSON.parse(readFileSync(path.join(f.project, "package.json"), "utf8")).packageManager, "pnpm@11.25.0");
  assert.equal(readFileSync(path.join(recoveryDirectory(f), "package.json"), "utf8"), f.original["package.json"] + "\n");
  assert.equal(existsSync(path.join(f.project, "package-lock.json")), false);
  noScratchProjects(f);
});

function validationResult(result) {
  const line = result.stdout.split("\n").find((value) => value.startsWith("[sites pnpm validation] "));
  assert.ok(line, result.stdout + result.stderr);
  return JSON.parse(line.slice("[sites pnpm validation] ".length));
}

integration("missing-image validation reports skipped checks without install duration", async (t) => {
  const f = fixture(t);
  delete f.env.SITES_PNPM_BIN;
  const result = await execute(f, ["--check", "install"], { entrypoint: "validate-pnpm.mjs" });
  assert.equal(result.code, 0, result.stderr);
  assert.equal(validationResult(result).ok, false);
  const payload = JSON.parse(readFileSync(f.metrics, "utf8"));
  assert.deepEqual(payload.measurements.map(({ name, dimensions }) => [name, dimensions.stage, dimensions.outcome]), [
    ["result", "readiness", "skipped"], ["result", "validation", "skipped"],
  ]);
  assert.deepEqual(calls(f), []);
  unchangedNpmInputs(f);
});

integration("failed shadow install reports error while preserving the actual npm project", async (t) => {
  const f = fixture(t, 'if [[ "$*" == *"--prepare-store"* ]]; then exit 0; fi\nexit 70');
  const result = await execute(f, ["--check", "install"], { entrypoint: "validate-pnpm.mjs" });
  assert.equal(result.code, 0, result.stderr);
  const report = validationResult(result);
  assert.equal(report.ok, false);
  assert.equal(report.observations.find(({ stage }) => stage === "install").outcome, "error");
  assert.equal(report.observations.find(({ stage }) => stage === "validation").outcome, "error");
  const payload = JSON.parse(readFileSync(f.metrics, "utf8"));
  assert.ok(payload.measurements.every(({ dimensions }) => dimensions.stage && !Object.hasOwn(dimensions, "package_manager")));
  unchangedNpmInputs(f);
  assert.equal(existsSync(path.join(f.project, "node_modules")), false);
  noScratchProjects(f);
});

integration("shadow build does not inherit the actual Site's initialized runtime", async (t) => {
  const f = fixture(t);
  f.env.SITES_ENV_READY = "1";
  f.env.SITES_PROJECT_ROOT = f.project;
  f.env.SITES_RUNTIME_ROOT = path.join(f.project, ".sites-runtime");
  const result = await execute(f, ["--check", "build"], { entrypoint: "validate-pnpm.mjs" });
  assert.equal(result.code, 0, result.stderr);
  assert.equal(validationResult(result).ok, true);
  const build = calls(f).find(({ manager, args }) => manager === "npm" && args.join(" ") === "--prefix . --workspaces=false run build");
  assert.ok(build);
  assert.equal(build.executionProfile, "managed-linux");
  assert.notEqual(build.cwd, f.project);
  assert.ok(build.envReady !== "1" || build.projectRoot === build.cwd);
  assert.notEqual(build.runtimeRoot, f.env.SITES_RUNTIME_ROOT);
  unchangedNpmInputs(f);
  assert.equal(existsSync(path.join(f.project, "node_modules")), false);
  noScratchProjects(f);
});

integration("integrity-qualified established pnpm pin uses the direct helper without a shim", async (t) => {
  const f = fixture(t);
  const adopted = await execute(f, ["--prefer-pnpm"]);
  assert.equal(adopted.code, 0, adopted.stderr);
  const filename = path.join(f.project, "package.json");
  const manifest = JSON.parse(readFileSync(filename, "utf8"));
  manifest.packageManager = "pnpm@11.25.0+sha512.5cde925b4f075f725eb71fbae18a42ffe784524789f19b61c731cb8721ec28aaee160e01a8d5af4fedb2a42cdbf300efe23db356b0d4a17b4d63e11f8ab7c956";
  writeFileSync(filename, JSON.stringify(manifest));
  const qualified = readFileSync(filename, "utf8");
  const { symlinkSync } = await import("node:fs");
  const { execFileSync } = await import("node:child_process");
  const isolatedBin = path.join(f.root, "without-manager-shims");
  mkdirSync(isolatedBin);
  symlinkSync(process.execPath, path.join(isolatedBin, "node"));
  for (const name of ["bash", "mkdir", "ln"]) {
    const executable = execFileSync("bash", ["-c", `command -v ${name}`], { encoding: "utf8" }).trim();
    symlinkSync(executable, path.join(isolatedBin, name));
  }
  f.env.PATH = isolatedBin;
  // The image CLI fixture fails any command other than --version. Repair can
  // succeed only by calling the project helper directly, without a pnpm shim.
  const repaired = await execute(f);
  assert.equal(repaired.code, 0, repaired.stderr);
  assert.deepEqual(calls(f).map(({ manager }) => manager), ["pnpm", "pnpm"]);
  assert.equal(calls(f)[1].cwd, f.project);
  assert.deepEqual(calls(f)[1].args, []);
  assert.equal(readFileSync(filename, "utf8"), qualified);
  assert.equal(existsSync(path.join(f.project, "package-lock.json")), false);
});

for (const manager of ["pnpm", "npm"]) {
  const unexpected = [
    "npm-shrinkwrap.json", "yarn.lock", "bun.lock", "bun.lockb",
    ...(manager === "pnpm" ? ["package-lock.json"] : ["pnpm-lock.yaml", "pnpm-workspace.yaml"]),
  ];
  for (const filename of unexpected) {
    integration(`${manager} adoption preserves a concurrent ${filename} and cannot report success`, async (t) => {
      const f = fixture(t, manager === "npm" ? "exit 69" : installedModules);
      const marker = '{"author":"concurrent-lock"}\n';
      const preload = path.join(f.root, "add-conflicting-lock.mjs");
      writeFileSync(preload, `import fs from "node:fs";
import path from "node:path";
import {syncBuiltinESMExports} from "node:module";
const link = fs.linkSync;
fs.linkSync = function(source, destination) {
  const result = link(source, destination);
  if (destination === path.join(process.env.SITES_FIXTURE_PROJECT, "package.json") && source.includes("pnpm-validation-")) {
    fs.writeFileSync(path.join(process.env.SITES_FIXTURE_PROJECT, ${JSON.stringify(filename)}), ${JSON.stringify(marker)});
  }
  return result;
};
syncBuiltinESMExports();\n`);
      const result = await execute(f, ["--prefer-pnpm"], { preload });
      assert.equal(result.code, 78, result.stderr);
      assert.equal(readFileSync(path.join(f.project, filename), "utf8"), marker);
      assert.equal(result.stdout.includes("this project now uses"), false);
      assert.equal(JSON.parse(readFileSync(path.join(f.project, "package.json"), "utf8")).packageManager, undefined);
      noScratchProjects(f);
    });
  }
}
