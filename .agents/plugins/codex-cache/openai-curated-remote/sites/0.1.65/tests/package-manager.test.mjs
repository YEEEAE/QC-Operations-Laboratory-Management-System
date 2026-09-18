import assert from "node:assert/strict";
import childProcess from "node:child_process";
import { EventEmitter } from "node:events";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const nativeWindows = process.platform === "win32";
const managers = [await import("../scripts/package-manager.mjs")];
const command = ["npm", "create", "--yes", "@openai/sites@0.3.0", ".", "--", "--add-ons", "shadcn,d1"];
const integrityPin = "pnpm@11.25.0+sha512.5cde925b4f075f725eb71fbae18a42ffe784524789f19b61c731cb8721ec28aaee160e01a8d5af4fedb2a42cdbf300efe23db356b0d4a17b4d63e11f8ab7c956";

function mockLaunches(t, platform) {
  const descriptor = Object.getOwnPropertyDescriptor(process, "platform");
  const comspec = process.env.ComSpec;
  const calls = [];
  Object.defineProperty(process, "platform", { value: platform });
  process.env.ComSpec = "C:\\Program Files\\shell\\cmd.exe";
  t.mock.method(childProcess, "spawn", (executable, args, options) => {
    calls.push({ executable, args, options });
    const child = new EventEmitter();
    queueMicrotask(() => child.emit("close", 7, null));
    return child;
  });
  t.mock.method(childProcess, "spawnSync", (executable, args, options) => {
    calls.push({ executable, args, options });
    return { status: 0, stdout: "4.6.0\n" };
  });
  syncBuiltinESMExports();
  t.after(() => {
    Object.defineProperty(process, "platform", descriptor);
    if (comspec === undefined) delete process.env.ComSpec;
    else process.env.ComSpec = comspec;
    t.mock.restoreAll();
    syncBuiltinESMExports();
  });
  return calls;
}

for (const platform of ["linux", "win32"]) {
  test(`${platform}: manager commands and Yarn probe use the same launcher`, async (t) => {
    const calls = mockLaunches(t, platform);
    for (const manager of managers) {
      assert.deepEqual(await manager.runPackageManager(command), { code: 7, signal: null });
      assert.equal(manager.resolveYarnMajor(), 4);
      const [run, probe] = calls.splice(0);
      if (platform === "win32") {
        assert.equal(run.executable, process.env.ComSpec);
        assert.deepEqual(run.args, ["/d", "/s", "/c", '""npm" "create" "--yes" "@openai/sites@0.3.0" "." "--" "--add-ons" "shadcn,d1""']);
        assert.equal(probe.executable, process.env.ComSpec);
        assert.deepEqual(probe.args, ["/d", "/s", "/c", '""yarn" "--version""']);
        for (const token of ["has space", "x&echo", "%PATH%", 'x"y', "x\ny"]) {
          assert.throws(() => manager.runPackageManager(["npm", token]), /Unsupported character/);
        }
      } else {
        assert.equal(run.executable, "npm");
        assert.deepEqual(run.args, command.slice(1));
        assert.equal(probe.executable, "yarn");
        assert.deepEqual(probe.args, ["--version"]);
      }
      assert.equal(run.options.stdio, "inherit");
      assert.deepEqual(probe.options.stdio, ["ignore", "pipe", "pipe"]);
      assert.equal(run.options.windowsVerbatimArguments, platform === "win32");
      assert.equal(probe.options.windowsVerbatimArguments, platform === "win32");
      assert.throws(() => manager.runPackageManager(["cmd", "echo"]), /Unsupported package manager/);
      assert.deepEqual(calls, []);
    }
  });
}

test("native Windows: .cmd shims preserve args, cwd, exits, and Yarn version", {
  skip: nativeWindows ? false : "Requires native Windows cmd.exe",
}, async (t) => {
  const directory = mkdtempSync(path.join(tmpdir(), "sites windows "));
  const bin = path.join(directory, "manager shims");
  const project = path.join(directory, "project with spaces");
  const log = path.join(directory, "calls.jsonl");
  const script = path.join(directory, "fake-manager.mjs");
  mkdirSync(bin);
  mkdirSync(project);
  writeFileSync(script, `
import { appendFileSync } from "node:fs";
const [manager, ...args] = process.argv.slice(2);
appendFileSync(${JSON.stringify(log)}, JSON.stringify({ manager, args, cwd: process.cwd() }) + "\\n");
if (args[0] === "--version") console.log("4.6.0");
process.exit(args[0] === "--version" ? 0 : 7);
`);
  for (const name of ["npm", "pnpm", "yarn", "bun"]) {
    writeFileSync(path.join(bin, `${name}.cmd`), `@echo off\r\n"${process.execPath}" "${script}" "${name}" %*\r\n`);
  }
  const cwd = process.cwd();
  const searchPath = process.env.PATH;
  process.chdir(project);
  process.env.PATH = `${bin}${path.delimiter}${searchPath ?? ""}`;
  t.after(() => {
    process.chdir(cwd);
    if (searchPath === undefined) delete process.env.PATH;
    else process.env.PATH = searchPath;
    rmSync(directory, { recursive: true, force: true });
  });
  for (const name of ["npm", "pnpm", "yarn", "bun"]) {
    assert.deepEqual(await managers[0].runPackageManager([name, ...command.slice(1)]), {
      code: 7, signal: null,
    });
  }
  assert.equal(managers[0].resolveYarnMajor(), 4);
  const calls = readFileSync(log, "utf8").trim().split("\n").map(JSON.parse);
  assert.deepEqual(calls, [
    ...["npm", "pnpm", "yarn", "bun"].map((manager) => ({ manager, args: command.slice(1), cwd: project })),
    { manager: "yarn", args: ["--version"], cwd: project },
  ]);
});

function workBuildFixture(t, { packageManager = "pnpm@11.25.0" } = {}) {
  const directory = mkdtempSync(path.join(tmpdir(), "sites corepack build "));
  const project = path.join(directory, "project with spaces");
  const bin = path.join(directory, "bin");
  const callsFile = path.join(directory, "calls.jsonl");
  const metricsFile = path.join(directory, "metrics.json");
  mkdirSync(project);
  mkdirSync(bin);
  writeFileSync(path.join(project, "package.json"), JSON.stringify({
    packageManager, scripts: { build: "owned build" },
  }));
  writeFileSync(path.join(project, "pnpm-lock.yaml"), "test lockfile\n");
  writeFileSync(metricsFile, "host-owned metrics file\n");
  const env = {
    ...process.env,
    PATH: bin,
    SITES_PNPM_BIN: path.join(directory, "absent-image-pnpm.cjs"),
    CODEX_PLUGIN_METRICS_OUTPUT: metricsFile,
    SITES_TEST_CONTEXT: "preserved",
  };
  delete env.COREPACK_HOME;
  delete env.SITES_RUNTIME_ROOT;
  const build = fileURLToPath(new URL("../scripts/build-site.mjs", import.meta.url));
  function executable(name, { code = 0, cancel = false, mode = 0o755 } = {}) {
    const target = path.join(bin, name);
    writeFileSync(target, `#!${process.execPath}
import { appendFileSync, readFileSync } from "node:fs";
appendFileSync(${JSON.stringify(callsFile)}, JSON.stringify({
  manager: ${JSON.stringify(name)}, args: process.argv.slice(2), cwd: process.cwd(),
  pin: JSON.parse(readFileSync("package.json", "utf8")).packageManager,
  context: process.env.SITES_TEST_CONTEXT,
  corepackHome: process.env.COREPACK_HOME,
}) + "\\n");
${cancel ? `process.on("SIGTERM", () => process.exit(127));
process.stdout.write("ready\\n");
setInterval(() => {}, 1000);` : `process.exit(${code});`}
`);
    chmodSync(target, mode);
    return target;
  }
  const calls = () => existsSync(callsFile)
    ? readFileSync(callsFile, "utf8").trim().split("\n").map(JSON.parse) : [];
  const run = () => childProcess.spawnSync(process.execPath, [build], {
    cwd: project, env, encoding: "utf8", timeout: 5000,
  });
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return { project, env, build, executable, calls, run, metricsFile };
}

test("Work: Corepack's project pin wins over an older global pnpm", {
  skip: nativeWindows ? "Work images use POSIX executables" : false,
}, async (t) => {
  for (const packageManager of ["pnpm@11.25.0", integrityPin]) {
    await t.test(packageManager.includes("+") ? "integrity-qualified pin" : "plain pin", (t) => {
      const fixture = workBuildFixture(t, { packageManager });
      fixture.executable("pnpm", { code: 99 });
      fixture.executable("corepack");
      const result = fixture.run();
      assert.equal(result.status, 0, result.stderr);
      assert.deepEqual(fixture.calls(), [{
        manager: "corepack", args: ["pnpm", "run", "build"], cwd: fixture.project,
        pin: packageManager, context: "preserved",
        corepackHome: path.join(fixture.project, ".sites-runtime", "xdg-cache", "node", "corepack"),
      }]);
      const metrics = JSON.parse(readFileSync(fixture.metricsFile, "utf8"));
      assert.equal(metrics.measurements.length, 1);
      assert.equal(metrics.measurements[0].dimensions.outcome, "success");
    });
  }
});

test("Work: Corepack respects a custom runtime or explicit Corepack cache", {
  skip: nativeWindows ? "Work images use POSIX executables" : false,
}, async (t) => {
  for (const explicit of [false, true]) {
    await t.test(`explicit cache ${explicit}`, (t) => {
      const fixture = workBuildFixture(t);
      fixture.env.SITES_RUNTIME_ROOT = path.join(fixture.project, "custom runtime");
      if (explicit) fixture.env.COREPACK_HOME = path.join(fixture.project, "tool cache");
      fixture.executable("corepack");
      const result = fixture.run();
      assert.equal(result.status, 0, result.stderr);
      assert.equal(fixture.calls()[0].corepackHome, explicit ? fixture.env.COREPACK_HOME :
        path.join(fixture.env.SITES_RUNTIME_ROOT, "xdg-cache", "node", "corepack"));
    });
  }
});

test("Work: Corepack policy errors, exit 127, and permission denial never start global pnpm", {
  skip: nativeWindows ? "Work images use POSIX executables" : false,
}, async (t) => {
  for (const [mode, code, expected] of [[0o755, 127, 127], [0o755, 65, 65], [0o644, 0, 126]]) {
    await t.test(`mode ${mode.toString(8)}, exit ${code}`, (t) => {
      const fixture = workBuildFixture(t);
      fixture.executable("pnpm");
      fixture.executable("corepack", { code, mode });
      const result = fixture.run();
      assert.equal(result.status, expected, result.stderr);
      assert.deepEqual(fixture.calls().map(({ manager }) => manager), mode === 0o755 ? ["corepack"] : []);
    });
  }
});

test("Work: absent Corepack uses PATH pnpm once and preserves its result", {
  skip: nativeWindows ? "Work images use POSIX executables" : false,
}, async (t) => {
  for (const code of [0, 127]) {
    await t.test(`pnpm exit ${code}`, (t) => {
      const fixture = workBuildFixture(t);
      fixture.executable("pnpm", { code });
      const result = fixture.run();
      assert.equal(result.status, code, result.stderr);
      assert.deepEqual(fixture.calls().map(({ manager }) => manager), ["pnpm"]);
      assert.equal(fixture.calls()[0].pin, "pnpm@11.25.0");
    });
  }
});

test("Work: other pnpm pins retain their existing executable and missing-shim result", {
  skip: nativeWindows ? "Work images use POSIX executables" : false,
}, async (t) => {
  for (const packageManager of ["pnpm@10.0.0", integrityPin.replace("11.25.0", "10.0.0"), integrityPin.replace("11.25.0", "11.25.0-rc.1")]) {
    for (const installed of [true, false]) {
      await t.test(`${packageManager.split("+")[0]}${packageManager.includes("+") ? " with integrity" : ""}, pnpm executable ${installed ? "present" : "absent"}`, (t) => {
        const fixture = workBuildFixture(t, { packageManager });
        fixture.env.SITES_PNPM_BIN = fixture.executable("image-pnpm.mjs");
        if (installed) fixture.executable("pnpm", { code: 7 });
        fixture.executable("corepack");
        const result = fixture.run();
        assert.equal(result.status, installed ? 7 : 127, result.stderr);
        assert.deepEqual(fixture.calls().map(({ manager }) => manager), installed ? ["pnpm"] : []);
      });
    }
  }
});

test("Work: the available image CLI remains preferred over pnpm and Corepack", {
  skip: nativeWindows ? "Work images use POSIX executables" : false,
}, async (t) => {
  for (const [packageManager, code] of [["pnpm@11.25.0", 127], [integrityPin, 0]]) {
    await t.test(packageManager.includes("+") ? "integrity-qualified pin without pnpm shim" : "plain pin", (t) => {
      const fixture = workBuildFixture(t, { packageManager });
      fixture.env.SITES_PNPM_BIN = fixture.executable("image-pnpm.mjs", { code });
      if (!packageManager.includes("+")) fixture.executable("pnpm");
      fixture.executable("corepack");
      const result = fixture.run();
      assert.equal(result.status, code, result.stderr);
      assert.deepEqual(fixture.calls().map(({ manager }) => manager), ["image-pnpm.mjs"]);
      assert.equal(fixture.calls()[0].pin, packageManager);
    });
  }
});

test("Work: cancelling a Corepack build that handles TERM does not run global pnpm", {
  skip: nativeWindows ? "Requires POSIX process-group signals" : false,
  timeout: 5000,
}, async (t) => {
  const fixture = workBuildFixture(t);
  fixture.executable("pnpm");
  fixture.executable("corepack", { cancel: true });
  const child = childProcess.spawn(process.execPath, [fixture.build], {
    cwd: fixture.project, env: fixture.env, detached: true, stdio: ["ignore", "pipe", "pipe"],
  });
  t.after(() => {
    if (child.exitCode === null && child.signalCode === null) process.kill(-child.pid, "SIGKILL");
  });
  let stderr = "";
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  const closed = new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code, signal) => resolve({ code, signal }));
  });
  await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.stdout.once("data", (chunk) => {
      assert.equal(chunk.toString(), "ready\n");
      resolve();
    });
  });
  process.kill(-child.pid, "SIGTERM");
  assert.deepEqual(await closed, { code: null, signal: "SIGTERM" }, stderr);
  assert.deepEqual(fixture.calls().map(({ manager }) => manager), ["corepack"]);
  const metrics = JSON.parse(readFileSync(fixture.metricsFile, "utf8"));
  assert.equal(metrics.measurements[0].dimensions.outcome, "cancelled");
});

test("Work: cancellation racing with absent Corepack prevents global pnpm fallback", (t) => {
  const fixture = workBuildFixture(t);
  const cwd = process.cwd();
  const descriptor = Object.getOwnPropertyDescriptor(process, "platform");
  const calls = [];
  process.chdir(fixture.project);
  Object.defineProperty(process, "platform", { value: "linux" });
  t.mock.method(childProcess, "spawn", (executable) => {
    calls.push(executable);
    const child = new EventEmitter();
    queueMicrotask(() => {
      process.emit("SIGTERM");
      child.emit("error", Object.assign(new Error("missing shim"), { code: "ENOENT" }));
      child.emit("close", -2, null);
    });
    return child;
  });
  syncBuiltinESMExports();
  t.after(() => {
    process.chdir(cwd);
    Object.defineProperty(process, "platform", descriptor);
    t.mock.restoreAll();
    syncBuiltinESMExports();
  });
  return managers[0].runPackageManager(["pnpm", "run", "build"], { env: fixture.env }).then((result) => {
    assert.deepEqual(result, { code: 127, signal: "SIGTERM", startError: "ENOENT" });
    assert.deepEqual(calls, ["corepack"]);
  });
});

test("Work: preserveCancellation reaches every manager route including global fallback", async (t) => {
  for (const route of ["npm", "custom-pnpm", "image", "corepack", "pnpm-fallback"]) {
    await t.test(route, async (t) => {
      const fixture = workBuildFixture(t, { packageManager: route === "custom-pnpm" ? "pnpm@10.0.0" : "pnpm@11.25.0" });
      if (route === "image") fixture.env.SITES_PNPM_BIN = fixture.executable("image-pnpm.mjs");
      const cwd = process.cwd();
      const descriptor = Object.getOwnPropertyDescriptor(process, "platform");
      const calls = [];
      process.chdir(fixture.project);
      Object.defineProperty(process, "platform", { value: "linux" });
      t.mock.method(childProcess, "spawn", (executable) => {
        calls.push(executable);
        const child = new EventEmitter();
        queueMicrotask(() => {
          if (route === "pnpm-fallback" && executable === "corepack") {
            child.emit("error", Object.assign(new Error("missing shim"), { code: "ENOENT" }));
            child.emit("close", -2, null);
          } else {
            process.emit("SIGTERM");
            child.emit("close", 69, null);
          }
        });
        return child;
      });
      syncBuiltinESMExports();
      t.after(() => {
        process.chdir(cwd);
        Object.defineProperty(process, "platform", descriptor);
        t.mock.restoreAll();
        syncBuiltinESMExports();
      });
      const result = await managers[0].runPackageManager([route === "npm" ? "npm" : "pnpm", "run", "install:ci"], {
        env: fixture.env, preserveCancellation: true,
      });
      assert.deepEqual(result, { code: 69, signal: "SIGTERM" });
      assert.deepEqual(calls, route === "pnpm-fallback" ? ["corepack", "pnpm"] :
        [route === "npm" ? "npm" : route === "image" ? process.execPath : route === "corepack" ? "corepack" : "pnpm"]);
    });
  }
});
