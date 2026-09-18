from __future__ import annotations

import io
import json
import os
import shlex
import shutil
import signal
import stat
import subprocess
import tarfile
import tempfile
import time
import unittest
from pathlib import Path

PLUGIN_ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = PLUGIN_ROOT / "skills/sites-building/templates/vinext-starter"
NODE = shutil.which("node")
REPORT_ENV = "SITES_INSTALL_REPORT_PATH"
IMAGE_STORE = "/workspace/.sites-runtime/pnpm-store"

FAKE_PNPM = r"""
import fs from "node:fs";
import path from "node:path";
const args = process.argv.slice(2);
if (args[0] === "--version") {
  console.log(process.env.SITES_TEST_VERSION || "11.25.0");
  process.exit(0);
}
if (args[0] === "config") {
  const file = "pnpm-workspace.yaml";
  let source = fs.readFileSync(file, "utf8");
  const key = args[2].replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  const pattern = new RegExp("^" + key + ": (.*)$", "m");
  if (args[1] === "get") {
    const value = source.match(pattern)?.[1] || "undefined";
    console.log(value.replace("${SITES_PNPM_SHARED_STORE:-.sites-runtime/pnpm-store}",
      process.env.SITES_PNPM_SHARED_STORE || ".sites-runtime/pnpm-store"));
  } else {
    source = pattern.test(source) ? source.replace(pattern, key + ": " + args[3]) :
      source + key + ": " + args[3] + "\n";
    fs.writeFileSync(file, source);
  }
  process.exit(0);
}
if (process.env.SITES_TEST_TRAP_TERM) {
  process.on("SIGTERM", () => process.exit(Number(process.env.SITES_TEST_TRAP_TERM)));
}
fs.appendFileSync(process.env.SITES_TEST_CALLS, JSON.stringify({
  args,
  reportVisible: Object.hasOwn(process.env, "SITES_INSTALL_REPORT_PATH")
}) + "\n");
if (process.env.SITES_TEST_RELEASE) {
  fs.writeFileSync(process.env.SITES_TEST_STARTED, "started");
  const deadline = Date.now() + 5000;
  while (!fs.existsSync(process.env.SITES_TEST_RELEASE)) {
    if (Date.now() > deadline) process.exit(99);
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}
for (const event of JSON.parse(process.env.SITES_TEST_EVENTS || "[]")) {
  if (event.raw) { console.log(event.raw); continue; }
  if (event.name === "pnpm:progress") event.requester ??= process.cwd();
  if (event.name === "pnpm:stage" || event.name === "pnpm:stats") event.prefix ??= process.cwd();
  console.log(JSON.stringify(event));
}
if (process.env.SITES_TEST_WAIT === "1") {
  console.log("waiting");
  await new Promise((resolve) => setTimeout(resolve, 60000));
}
if (process.env.SITES_TEST_WRITE_STORE === "1") {
  const store = args[args.indexOf("--store-dir") + 1];
  fs.writeFileSync(path.join(store, "downloaded-package"), "new package");
}
if (!process.env.SITES_TEST_NO_BINARY) {
  fs.mkdirSync("node_modules/.bin", { recursive: true });
  fs.writeFileSync("node_modules/.bin/vinext", "#!/bin/sh\nexit 0\n", { mode: 0o755 });
  const store = args[args.indexOf("--store-dir") + 1];
  fs.writeFileSync("node_modules/.modules.yaml", "storeDir: " + store + "/v11\n");
}
process.exit(Number(process.env.SITES_TEST_EXIT || "0"));
"""


def progress_events() -> list[dict]:
    return [
        {"name": "pnpm:progress", "status": "found_in_store", "packageId": "a@1"},
        {"name": "pnpm:progress", "status": "found_in_store", "packageId": "a@1"},
        {"name": "pnpm:progress", "status": "found_in_store", "packageId": "b@1"},
        {"name": "pnpm:progress", "status": "fetched", "packageId": "b@1"},
        {"name": "pnpm:progress", "status": "fetched", "packageId": "b@1"},
        {"name": "pnpm:stats", "added": 2},
        {"name": "pnpm:stage", "stage": "importing_done"},
    ]


class Workspace:
    def __init__(self, directory: Path) -> None:
        self.project = directory / "project with spaces"
        self.project.mkdir()
        shutil.copytree(TEMPLATE / "scripts", self.project / "scripts")
        shutil.copy2(
            PLUGIN_ROOT / "assets/pnpm/vinext/pnpm-workspace.yaml",
            self.project / "pnpm-workspace.yaml",
        )
        (self.project / "package.json").write_text(
            json.dumps({"name": "fixture", "private": True, "packageManager": "pnpm@11.25.0"})
        )
        (self.project / "pnpm-lock.yaml").write_text("lockfileVersion: '9.0'\n")
        self.fake_pnpm = directory / "fake-pnpm.mjs"
        self.fake_pnpm.write_text(FAKE_PNPM)
        self.calls_file = directory / "calls.jsonl"
        self.store = self.project / ".sites-runtime/pnpm-store"
        self.store.mkdir(parents=True)
        self.report = directory / "report.json"
        self.report.write_text("old bytes that must be replaced")
        self.report.chmod(0o600)
        self.env = dict(os.environ)
        for key in (
            "SITES_ENV_READY",
            "SITES_PROJECT_ROOT",
            "SITES_RUNTIME_ROOT",
            "SITES_PNPM_CACHE_SEED",
            "SITES_PNPM_SHARED_STORE",
            "CODEX_PLUGIN_METRICS_OUTPUT",
        ):
            self.env.pop(key, None)
        self.env.update(
            {
                REPORT_ENV: str(self.report),
                "SITES_PNPM_BIN": str(self.fake_pnpm),
                "SITES_TEST_CALLS": str(self.calls_file),
                "SITES_TEST_EVENTS": json.dumps(progress_events()),
            }
        )

    def calls(self) -> list[dict]:
        if not self.calls_file.exists():
            return []
        return [json.loads(line) for line in self.calls_file.read_text().splitlines()]

    def image_store(self, shared: Path, *, create_parent: bool = True) -> None:
        # Remap only the fixed image location in this disposable script copy.
        # No production override is added and the exact-path check still runs.
        installer = self.project / "scripts/install-pnpm.sh"
        source = installer.read_text()
        assert source.count(IMAGE_STORE) == 1
        installer.write_text(source.replace(IMAGE_STORE, str(shared)))
        if create_parent:
            shared.parent.mkdir(parents=True, exist_ok=True)
        self.env["SITES_PNPM_SHARED_STORE"] = str(shared)

    def run(
        self, *, shell: bool = False, timeout: float = 15, arguments: tuple[str, ...] = ()
    ) -> subprocess.CompletedProcess[str]:
        if shell:
            args = ["bash", str(self.project / "scripts/install-pnpm.sh"), *arguments]
        else:
            args = [
                NODE or "node",
                str(self.project / "scripts/pnpm-install.mjs"),
                "seed_unavailable",
                "project",
                "reused",
                str(self.store),
                NODE or "node",
                str(self.fake_pnpm),
            ]
        return subprocess.run(
            args,
            cwd=self.project,
            env=self.env,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )

    def result(self) -> dict:
        return json.loads(self.report.read_text())


@unittest.skipUnless(NODE, "requires Node.js")
class PnpmInstallTests(unittest.TestCase):
    @unittest.skipUnless(shutil.which("flock") and shutil.which("timeout"), "requires Linux tools")
    def test_established_corepack_pin_wins_over_global_pnpm_and_global_is_verified(self) -> None:
        for has_corepack, global_version, expected in (
            (True, "10.0.0", 0),
            (False, "11.25.0", 0),
            (False, "10.0.0", 69),
        ):
            with (
                self.subTest(corepack=has_corepack, global_version=global_version),
                tempfile.TemporaryDirectory() as temp,
            ):
                directory = Path(temp)
                workspace = Workspace(directory)
                bin_dir = directory / "bin"
                bin_dir.mkdir()
                # Exclude the host's package-manager shims so no Corepack download
                # can hide which executable an older image would select.
                for name in (
                    "bash",
                    "dirname",
                    "flock",
                    "timeout",
                    "node",
                    "mkdir",
                    "mktemp",
                    "rm",
                ):
                    executable = shutil.which(name)
                    assert executable is not None
                    (bin_dir / name).symlink_to(executable)
                selections = directory / "selected-cli"
                for name in ("pnpm", "corepack") if has_corepack else ("pnpm",):
                    shim = bin_dir / name
                    version = "11.25.0" if name == "corepack" else global_version
                    shim.write_text(
                        "#!/bin/sh\n"
                        + ('[ "$1" = pnpm ] || exit 64\nshift\n' if name == "corepack" else "")
                        + f"printf '%s\\n' {shlex.quote(name)} >> {shlex.quote(str(selections))}\n"
                        + f"export SITES_TEST_VERSION={shlex.quote(version)}\n"
                        + f'exec {shlex.quote(NODE or "node")} {shlex.quote(str(workspace.fake_pnpm))} "$@"\n'
                    )
                    shim.chmod(0o755)
                workspace.env.pop("SITES_PNPM_BIN")
                workspace.env["PATH"] = str(bin_dir)
                result = workspace.run(shell=True)
                self.assertEqual(result.returncode, expected, result.stdout + result.stderr)
                self.assertEqual(
                    set(selections.read_text().splitlines()),
                    {"corepack" if has_corepack else "pnpm"},
                )
                self.assertEqual(len(workspace.calls()), 1 if expected == 0 else 0)

    @unittest.skipUnless(shutil.which("flock") and shutil.which("timeout"), "requires Linux tools")
    def test_custom_runtime_root_remains_portable_for_ordinary_pnpm_commands(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            workspace = Workspace(Path(temp))
            runtime = workspace.project / "custom runtime"
            workspace.env["SITES_RUNTIME_ROOT"] = str(runtime)
            result = workspace.run(shell=True)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            args = workspace.calls()[0]["args"]
            self.assertEqual(args[args.index("--store-dir") + 1], str(runtime / "pnpm-store"))
            config = (workspace.project / "pnpm-workspace.yaml").read_text()
            self.assertIn("storeDir: ${SITES_RUNTIME_ROOT:-.sites-runtime}/pnpm-store\n", config)
            self.assertNotIn(str(runtime), config)

    @unittest.skipUnless(shutil.which("flock") and shutil.which("timeout"), "requires Linux tools")
    def test_bootstrap_requires_shared_but_established_project_stays_pnpm(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            workspace = Workspace(Path(temp))
            before = (workspace.project / "pnpm-workspace.yaml").read_bytes()
            unavailable = workspace.run(shell=True, arguments=("--require-shared",))
            self.assertEqual(unavailable.returncode, 69, unavailable.stderr)
            self.assertEqual(workspace.calls(), [])
            self.assertEqual((workspace.project / "pnpm-workspace.yaml").read_bytes(), before)
            self.assertEqual(workspace.result()["store_state"], "unavailable")
            established = workspace.run(shell=True)
            self.assertEqual(established.returncode, 0, established.stderr)
            self.assertEqual(workspace.result()["store_scope"], "project")
            self.assertEqual(len(workspace.calls()), 1)

    @unittest.skipUnless(shutil.which("flock") and shutil.which("timeout"), "requires Linux tools")
    def test_prepare_store_is_independent_from_install_and_project_configuration(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            workspace = Workspace(directory)
            shared = directory / "owner workspace/.sites-runtime/pnpm-store"
            workspace.image_store(shared, create_parent=False)
            shared.parent.parent.mkdir()
            before = (workspace.project / "pnpm-workspace.yaml").read_bytes()
            for expected in ("created", "reused"):
                result = workspace.run(
                    shell=True, arguments=("--require-shared", "--prepare-store")
                )
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(json.loads(result.stdout), workspace.result())
                self.assertEqual(workspace.result()["store_state"], expected)
                self.assertEqual(workspace.result()["store_scope"], "workspace")
                self.assertEqual(workspace.calls(), [])
                self.assertFalse((workspace.project / "node_modules").exists())
                self.assertEqual((workspace.project / "pnpm-workspace.yaml").read_bytes(), before)

    @unittest.skipUnless(shutil.which("flock") and shutil.which("timeout"), "requires Linux tools")
    def test_unmodified_installer_rejects_non_image_store_paths(self) -> None:
        for advertised in ("relative/pnpm-store", "/opt/codex/sites-runtime/pnpm-store", "other"):
            with self.subTest(advertised=advertised), tempfile.TemporaryDirectory() as temp:
                directory = Path(temp)
                workspace = Workspace(directory)
                other = directory / "other/pnpm-store"
                other.mkdir(parents=True)
                (other / "sentinel").write_text("unchanged")
                workspace.env["SITES_PNPM_SHARED_STORE"] = (
                    str(other) if advertised == "other" else advertised
                )
                result = workspace.run(shell=True)
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                self.assertEqual(workspace.result()["store_scope"], "project")
                args = workspace.calls()[0]["args"]
                self.assertEqual(args[args.index("--store-dir") + 1], str(workspace.store))
                self.assertIn("--package-import-method=clone-or-copy", args)
                self.assertEqual((other / "sentinel").read_text(), "unchanged")
                self.assertEqual(list(other.iterdir()), [other / "sentinel"])

    @unittest.skipUnless(shutil.which("flock") and shutil.which("timeout"), "requires Linux tools")
    def test_inaccessible_image_store_uses_project_store_without_changing_parent(self) -> None:
        for condition in (
            "parent-file",
            "parent-symlink",
            "store-file",
            "store-symlink",
            "denied-parent-create",
            "denied-store-create",
        ):
            with self.subTest(condition=condition), tempfile.TemporaryDirectory() as temp:
                directory = Path(temp)
                workspace = Workspace(directory)
                shared = directory / "image root/sites-runtime/pnpm-store"
                workspace.image_store(shared, create_parent=False)
                shared.parent.parent.mkdir()
                target = directory / "target"
                target.mkdir()
                sentinel = target / "sentinel"
                sentinel.write_text("unchanged")
                if condition == "parent-file":
                    shared.parent.write_text("parent must remain a file")
                elif condition == "parent-symlink":
                    shared.parent.symlink_to(target, target_is_directory=True)
                elif condition != "missing-parent":
                    shared.parent.mkdir()
                    if condition == "store-file":
                        shared.write_text("store must remain a file")
                    elif condition == "store-symlink":
                        shared.symlink_to(target, target_is_directory=True)
                    elif condition == "denied-store-create":
                        shared.mkdir()
                        (shared / "sentinel").write_text("unchanged")
                if condition.startswith("denied-"):
                    denied = shared if condition == "denied-store-create" else shared.parent
                    # Mode/access checks succeed, but the write syscall fails.
                    self.assertTrue(os.access(denied, os.W_OK))
                    fake_bin = directory / "bin"
                    fake_bin.mkdir()
                    probe = fake_bin / "mktemp"
                    probe.write_text(
                        '#!/bin/sh\ncase "$1" in "$SITES_TEST_DENIED_PROBE/"*) exit 1 ;; esac\n'
                        'exec "$SITES_TEST_REAL_MKTEMP" "$@"\n'
                    )
                    probe.chmod(0o755)
                    workspace.env.update(
                        {
                            "PATH": str(fake_bin) + os.pathsep + workspace.env["PATH"],
                            "SITES_TEST_DENIED_PROBE": str(denied),
                            "SITES_TEST_REAL_MKTEMP": shutil.which("mktemp") or "mktemp",
                        }
                    )
                result = workspace.run(shell=True)
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                self.assertEqual(workspace.result()["store_scope"], "project")
                args = workspace.calls()[0]["args"]
                self.assertEqual(args[args.index("--store-dir") + 1], str(workspace.store))
                config = (workspace.project / "pnpm-workspace.yaml").read_text()
                self.assertIn("storeDir: .sites-runtime/pnpm-store\n", config)
                self.assertIn("cacheDir: .sites-runtime/pnpm-store/policy-cache\n", config)
                self.assertEqual(sentinel.read_text(), "unchanged")
                if condition == "missing-parent":
                    self.assertFalse(shared.parent.exists())
                elif condition == "parent-file":
                    self.assertEqual(shared.parent.read_text(), "parent must remain a file")
                elif condition == "parent-symlink":
                    self.assertTrue(shared.parent.is_symlink())
                elif condition == "store-file":
                    self.assertEqual(shared.read_text(), "store must remain a file")
                elif condition == "store-symlink":
                    self.assertTrue(shared.is_symlink())
                elif condition == "denied-store-create":
                    self.assertEqual((shared / "sentinel").read_text(), "unchanged")
                else:
                    self.assertFalse(shared.exists())
                self.assertEqual(list(target.iterdir()), [sentinel])

    @unittest.skipUnless(shutil.which("flock") and shutil.which("timeout"), "requires Linux tools")
    def test_two_projects_release_seed_lock_before_concurrent_installation(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            shared = directory / "owner workspace/.sites-runtime/pnpm-store"
            seed = directory / "seed"
            (seed / "v11").mkdir(parents=True)
            (seed / "v11/prepared-package").write_text("prepared")
            (seed / ".sites-pnpm-seed.json").write_text(
                json.dumps(
                    {
                        "version": 1,
                        "pnpm_version": "11.25.0",
                        "store_version": "v11",
                        "lockfile_sha256": "a" * 64,
                    }
                )
            )
            release = directory / "release"
            workspaces = []
            processes = []
            try:
                for name in ("first", "second"):
                    parent = directory / name
                    parent.mkdir()
                    workspace = Workspace(parent)
                    workspace.image_store(shared)
                    workspace.env.update(
                        {
                            "SITES_PNPM_SHARED_STORE": str(shared),
                            "SITES_PNPM_CACHE_SEED": str(seed),
                            "SITES_TEST_RELEASE": str(release),
                            "SITES_TEST_STARTED": str(parent / "started"),
                            "SITES_TEST_WRITE_STORE": "1",
                        }
                    )
                    workspaces.append(workspace)
                    processes.append(
                        subprocess.Popen(
                            ["bash", str(workspace.project / "scripts/install-pnpm.sh")],
                            cwd=workspace.project,
                            env=workspace.env,
                            stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE,
                            text=True,
                        )
                    )
                deadline = time.monotonic() + 5
                while not all(
                    (directory / name / "started").exists() for name in ("first", "second")
                ):
                    if time.monotonic() >= deadline:
                        self.fail(
                            "Both projects must reach pnpm while the first install is still running"
                        )
                    time.sleep(0.02)
                # The shared seed lease is free, but this project remains locked
                # until its actual pnpm installation completes.
                busy = workspaces[0].run(shell=True, timeout=2)
                self.assertEqual(busy.returncode, 75, busy.stdout + busy.stderr)
            finally:
                release.write_text("continue")
                results = [process.communicate(timeout=5) for process in processes]
            for process, (stdout, stderr), workspace in zip(
                processes, results, workspaces, strict=True
            ):
                self.assertEqual(process.returncode, 0, stdout + stderr)
                self.assertEqual(workspace.result()["store_scope"], "workspace")
                self.assertEqual(workspace.result()["cache_seed"], "seed_used")
                args = workspace.calls()[0]["args"]
                self.assertEqual(args[args.index("--store-dir") + 1], str(shared))
                self.assertIn("--package-import-method=clone-or-copy", args)
                config = (workspace.project / "pnpm-workspace.yaml").read_text()
                portable_store = "${SITES_PNPM_SHARED_STORE:-.sites-runtime/pnpm-store}"
                self.assertIn(f"storeDir: {portable_store}\n", config)
                self.assertIn(f"cacheDir: {portable_store}/policy-cache\n", config)
                self.assertIn("packageImportMethod: clone-or-copy\n", config)
                self.assertNotIn(str(shared), config)
                repeated = workspace.run(shell=True)
                self.assertEqual(repeated.returncode, 0, repeated.stdout + repeated.stderr)
                self.assertEqual(workspace.result()["store_scope"], "workspace")
                self.assertNotIn("copying the image seed", repeated.stdout)
            self.assertEqual(sum("copying the image seed" in stdout for stdout, _ in results), 1)
            self.assertEqual((shared / "downloaded-package").read_text(), "new package")
            self.assertEqual((seed / "v11/prepared-package").read_text(), "prepared")
            self.assertFalse((seed / "downloaded-package").exists())
            # The protected store is disposable across container replacement.
            shutil.rmtree(shared)
            restored = workspaces[0].run(shell=True)
            self.assertEqual(restored.returncode, 0, restored.stdout + restored.stderr)
            self.assertIn("copying the image seed", restored.stdout)
            self.assertEqual(workspaces[0].result()["store_scope"], "workspace")
            self.assertEqual((shared / "v11/prepared-package").read_text(), "prepared")

    @unittest.skipUnless(shutil.which("flock") and shutil.which("timeout"), "requires Linux tools")
    def test_previously_shared_project_falls_back_when_store_write_is_denied(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            workspace = Workspace(directory)
            shared = directory / "image root/sites-runtime/pnpm-store"
            workspace.image_store(shared)
            shared.mkdir()
            sentinel = shared / "sentinel"
            sentinel.write_text("unchanged")
            first = workspace.run(shell=True)
            self.assertEqual(first.returncode, 0, first.stdout + first.stderr)
            self.assertEqual(workspace.result()["store_scope"], "workspace")

            fake_bin = directory / "bin"
            fake_bin.mkdir()
            probe = fake_bin / "mktemp"
            probe.write_text(
                '#!/bin/sh\ncase "$1" in "$SITES_PNPM_SHARED_STORE/"*) exit 1 ;; esac\n'
                'exec "$SITES_TEST_REAL_MKTEMP" "$@"\n'
            )
            probe.chmod(0o755)
            workspace.env.update(
                {
                    "PATH": str(fake_bin) + os.pathsep + workspace.env["PATH"],
                    "SITES_TEST_REAL_MKTEMP": shutil.which("mktemp") or "mktemp",
                }
            )
            second = workspace.run(shell=True)
            self.assertEqual(second.returncode, 0, second.stdout + second.stderr)
            self.assertEqual(workspace.result()["store_scope"], "project")
            config = (workspace.project / "pnpm-workspace.yaml").read_text()
            self.assertIn("storeDir: .sites-runtime/pnpm-store\n", config)
            self.assertNotIn("${SITES_PNPM_SHARED_STORE", config)
            second_args = workspace.calls()[1]["args"]
            self.assertEqual(
                second_args[second_args.index("--store-dir") + 1], str(workspace.store)
            )
            self.assertEqual(sentinel.read_text(), "unchanged")
            self.assertEqual(list(shared.iterdir()), [sentinel])

    @unittest.skipUnless(shutil.which("flock") and shutil.which("timeout"), "requires Linux tools")
    def test_private_project_can_move_to_workspace_store_when_access_returns(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            workspace = Workspace(directory)
            blocked = directory / "blocked"
            blocked.write_text("not a directory")
            workspace.env["SITES_PNPM_SHARED_STORE"] = str(blocked / "pnpm-store")
            first = workspace.run(shell=True)
            self.assertEqual(first.returncode, 0, first.stderr)
            self.assertEqual(workspace.result()["store_scope"], "project")
            shared = directory / "owner workspace/.sites-runtime/pnpm-store"
            workspace.image_store(shared)
            second = workspace.run(shell=True)
            self.assertEqual(second.returncode, 0, second.stderr)
            self.assertEqual(workspace.result()["store_scope"], "workspace")
            for call, store in zip(workspace.calls(), (workspace.store, shared), strict=True):
                args = call["args"]
                self.assertEqual(args[args.index("--store-dir") + 1], str(store))

    @unittest.skipUnless(shutil.which("flock") and shutil.which("timeout"), "requires Linux tools")
    def test_install_locks_reject_symlinks_and_fifos_without_damage_or_waiting(self) -> None:
        for scope in ("project", "workspace"):
            for kind in ("symlink", "fifo"):
                with self.subTest(scope=scope, kind=kind), tempfile.TemporaryDirectory() as temp:
                    directory = Path(temp)
                    workspace = Workspace(directory)
                    shared = directory / "owner workspace/.sites-runtime/pnpm-store"
                    workspace.image_store(shared)
                    lock = (
                        workspace.store.parent / "install.lock"
                        if scope == "project"
                        else Path(f"{shared}.seed.lock")
                    )
                    target = directory / "unrelated writable file"
                    target.write_text("must not be truncated")
                    if kind == "symlink":
                        lock.symlink_to(target)
                    else:
                        os.mkfifo(lock)
                    started = time.monotonic()
                    bootstrap = workspace.run(
                        shell=True, timeout=5, arguments=("--require-shared", "--prepare-store")
                    )
                    self.assertEqual(
                        bootstrap.returncode,
                        78 if scope == "project" else 69,
                        bootstrap.stdout + bootstrap.stderr,
                    )
                    established = workspace.run(shell=True, timeout=5)
                    self.assertEqual(
                        established.returncode,
                        78 if scope == "project" else 0,
                        established.stdout + established.stderr,
                    )
                    self.assertLess(time.monotonic() - started, 5)
                    self.assertEqual(
                        workspace.result()["store_scope"],
                        "unknown" if scope == "project" else "project",
                    )
                    self.assertEqual(len(workspace.calls()), 0 if scope == "project" else 1)
                    self.assertFalse(shared.exists())
                    self.assertEqual(target.read_text(), "must not be truncated")
                    if kind == "symlink":
                        self.assertTrue(lock.is_symlink())
                    else:
                        self.assertTrue(stat.S_ISFIFO(lock.stat().st_mode))

    @unittest.skipUnless(shutil.which("flock") and shutil.which("timeout"), "requires Linux tools")
    def test_existing_regular_install_locks_are_not_truncated(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            workspace = Workspace(directory)
            shared = directory / "owner workspace/.sites-runtime/pnpm-store"
            workspace.image_store(shared)
            lock = Path(f"{shared}.seed.lock")
            lock.write_text("existing lock bytes")
            project_lock = workspace.store.parent / "install.lock"
            project_lock.write_text("existing project lock bytes")
            result = workspace.run(shell=True, timeout=5, arguments=("--require-shared",))
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertEqual(workspace.result()["store_scope"], "workspace")
            self.assertEqual(lock.read_text(), "existing lock bytes")
            self.assertEqual(project_lock.read_text(), "existing project lock bytes")

    @unittest.skipUnless(shutil.which("flock") and shutil.which("timeout"), "requires Linux tools")
    def test_busy_seed_lock_has_bounded_wait_and_falls_back_to_project_store(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            workspace = Workspace(directory)
            shared = directory / "owner workspace/.sites-runtime/pnpm-store"
            workspace.image_store(shared)
            workspace.env["SITES_PNPM_STORE_LOCK_TIMEOUT"] = "0.05"
            with subprocess.Popen(
                [
                    "flock",
                    f"{shared}.seed.lock",
                    "bash",
                    "-c",
                    "printf 'locked\\n'; read -r release",
                ],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            ) as holder:
                try:
                    assert holder.stdout is not None
                    self.assertEqual(holder.stdout.readline(), "locked\n")
                    started = time.monotonic()
                    result = workspace.run(shell=True, timeout=40)
                    elapsed = time.monotonic() - started
                    self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                    self.assertGreaterEqual(elapsed, 0.05)
                    self.assertLess(elapsed, 10)
                    self.assertEqual(workspace.result()["store_scope"], "project")
                    self.assertFalse(shared.exists())
                    args = workspace.calls()[0]["args"]
                    self.assertEqual(args[args.index("--store-dir") + 1], str(workspace.store))
                    config = (workspace.project / "pnpm-workspace.yaml").read_text()
                    self.assertIn("storeDir: .sites-runtime/pnpm-store\n", config)
                    self.assertIn("cacheDir: .sites-runtime/pnpm-store/policy-cache\n", config)
                finally:
                    holder.communicate("release\n", timeout=5)

    def test_counts_unique_completed_progress_without_leaking_report_path(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            workspace = Workspace(Path(temp))
            result = workspace.run()
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(
                workspace.result(),
                {
                    "version": 1,
                    "cache_seed": "seed_unavailable",
                    "store_scope": "project",
                    "store_state": "reused",
                    "packages_reused": 1,
                    "packages_downloaded": 1,
                },
            )
            self.assertFalse(workspace.calls()[0]["reportVisible"])
            self.assertIn("pnpm reused 1 packages and downloaded 1", result.stdout)
            self.assertNotIn(str(workspace.report), result.stdout + result.stderr)

    def test_failed_incomplete_and_noop_installs_do_not_claim_full_reuse(self) -> None:
        cases = (
            (progress_events(), "7", None, 65),
            (progress_events()[:-1], "0", None, 0),
            ([], "0", None, 0),
            (progress_events() + [{"name": "pnpm:stats", "added": 0}], "0", None, 0),
            (progress_events(), "0", "1", 65),
        )
        for events, exit_code, no_binary, expected in cases:
            with (
                self.subTest(expected=expected, events=events),
                tempfile.TemporaryDirectory() as temp,
            ):
                workspace = Workspace(Path(temp))
                workspace.env["SITES_TEST_EVENTS"] = json.dumps(events)
                workspace.env["SITES_TEST_EXIT"] = exit_code
                if no_binary:
                    workspace.env["SITES_TEST_NO_BINARY"] = no_binary
                result = workspace.run()
                self.assertEqual(result.returncode, expected, result.stderr)
                self.assertNotIn("packages_reused", workspace.result())
                self.assertNotIn("packages_downloaded", workspace.result())

    def test_human_errors_and_lifecycle_output_remain_readable(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            workspace = Workspace(Path(temp))
            workspace.env["SITES_TEST_EVENTS"] = json.dumps(
                [
                    {"name": "pnpm:lifecycle", "line": "native build output"},
                    {
                        "name": "pnpm",
                        "level": "error",
                        "err": {"message": "release age policy failed"},
                    },
                    {"raw": "ordinary process output"},
                ]
            )
            workspace.env["SITES_TEST_EXIT"] = "1"
            result = workspace.run()
            self.assertEqual(result.returncode, 65)
            self.assertIn("native build output", result.stdout)
            self.assertIn("ordinary process output", result.stdout)
            self.assertIn("release age policy failed", result.stderr)

    def test_only_verified_operational_failures_allow_npm_fallback(self) -> None:
        for codes, expected in (
            (["ERR_PNPM_UNEXPECTED_STORE"], 70),
            (["ERR_PNPM_OUTDATED_LOCKFILE"], 70),
            (["ERR_PNPM_FETCH_503"], 70),
            (["ERR_PNPM_NO_MATURE_MATCHING_VERSION"], 65),
            (["ERR_PNPM_TRUST_DOWNGRADE"], 65),
            (["ERR_PNPM_FETCH_401"], 65),
            (["ERR_PNPM_FETCH_403"], 65),
            (["ERR_PNPM_FETCH_404"], 65),
            (["ERR_PNPM_TARBALL_INTEGRITY"], 65),
            (["ERR_PNPM_UNEXPECTED_PKG_CONTENT_IN_STORE"], 65),
            (["ERR_PNPM_META_FETCH_FAIL"], 65),
            (["ERR_PNPM_UNKNOWN_FAILURE"], 65),
            (["ERR_PNPM_FETCH_503", "ERR_PNPM_TRUST_DOWNGRADE"], 65),
            (["ERR_PNPM_TRUST_DOWNGRADE", "ERR_PNPM_FETCH_503"], 65),
        ):
            with self.subTest(codes=codes), tempfile.TemporaryDirectory() as temp:
                workspace = Workspace(Path(temp))
                workspace.env["SITES_TEST_EXIT"] = "1"
                workspace.env["SITES_TEST_EVENTS"] = json.dumps(
                    progress_events()
                    + [
                        {"name": "pnpm", "level": "error", "err": {"code": code, "message": code}}
                        for code in codes
                    ]
                )
                result = workspace.run()
                self.assertEqual(result.returncode, expected, result.stderr)
                self.assertNotIn("packages_reused", workspace.result())
                self.assertNotIn("packages_downloaded", workspace.result())

    def test_unavailable_or_symlinked_report_does_not_change_installation(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            workspace = Workspace(directory)
            target = directory / "keep"
            target.write_text("unchanged")
            link = directory / "link"
            link.symlink_to(target)
            missing = directory / "seed_unavailable"
            for report in (missing, link, directory):
                with self.subTest(report=report):
                    workspace.env[REPORT_ENV] = str(report)
                    result = workspace.run()
                    self.assertEqual(result.returncode, 0, result.stderr)
            self.assertFalse(missing.exists())
            self.assertEqual(target.read_text(), "unchanged")

    @unittest.skipUnless(shutil.which("flock") and shutil.which("timeout"), "requires Linux tools")
    def test_seed_is_copied_once_then_missing_packages_use_the_same_writable_store(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            workspace = Workspace(directory)
            seed = directory / "seed"
            (seed / "v11").mkdir(parents=True)
            (seed / "v11/prepared-package").write_text("prepared")
            (seed / ".sites-pnpm-seed.json").write_text(
                json.dumps(
                    {
                        "version": 1,
                        "pnpm_version": "11.25.0",
                        "store_version": "v11",
                        # Intentionally not the project's lock hash: partial reuse is allowed.
                        "lockfile_sha256": "a" * 64,
                    }
                )
            )
            (seed / "v11").chmod(0o555)
            (seed / "v11/prepared-package").chmod(0o444)
            workspace.env["SITES_PNPM_CACHE_SEED"] = str(seed)
            workspace.env["SITES_TEST_WRITE_STORE"] = "1"
            workspace.store.rmdir()
            first = workspace.run(shell=True)
            self.assertEqual(first.returncode, 0, first.stderr)
            self.assertEqual(workspace.result()["cache_seed"], "seed_used")
            self.assertEqual((workspace.store / "downloaded-package").read_text(), "new package")
            self.assertFalse((seed / "downloaded-package").exists())
            copied = workspace.store / "v11/prepared-package"
            self.assertNotEqual(copied.stat().st_ino, (seed / "v11/prepared-package").stat().st_ino)
            copied.write_text("project-local content")
            marker = seed / ".sites-pnpm-seed.json"
            marker.write_text(marker.read_text().replace("a" * 64, "b" * 64))
            second = workspace.run(shell=True)
            self.assertEqual(second.returncode, 0, second.stderr)
            self.assertEqual(copied.read_text(), "project-local content")
            self.assertEqual((seed / "v11/prepared-package").read_text(), "prepared")
            self.assertEqual(len(workspace.calls()), 2)
            for call in workspace.calls():
                self.assertEqual(call["args"].count("install"), 1)
                self.assertNotIn("--frozen-store", call["args"])
                self.assertNotIn("--offline", call["args"])
                self.assertEqual(
                    call["args"][call["args"].index("--store-dir") + 1], str(workspace.store)
                )
            # Restore with store content absent but copied project files still present.
            shutil.rmtree(workspace.store)
            third = workspace.run(shell=True)
            self.assertEqual(third.returncode, 0, third.stderr)
            self.assertEqual(copied.read_text(), "prepared")

    @unittest.skipUnless(shutil.which("flock") and shutil.which("timeout"), "requires Linux tools")
    def test_store_created_during_seed_copy_is_preserved_without_hiding_errors(self) -> None:
        for winner in ("empty", "populated", "file", "symlink", "move_error"):
            with self.subTest(winner=winner), tempfile.TemporaryDirectory() as temp:
                directory = Path(temp)
                workspace = Workspace(directory)
                shared = directory / "owner workspace/.sites-runtime/pnpm-store"
                workspace.image_store(shared)
                seed = directory / "seed"
                (seed / "v11").mkdir(parents=True)
                (seed / "v11/prepared-package").write_text("prepared")
                (seed / ".sites-pnpm-seed.json").write_text(
                    json.dumps(
                        {
                            "version": 1,
                            "pnpm_version": "11.25.0",
                            "store_version": "v11",
                            "lockfile_sha256": "a" * 64,
                        }
                    )
                )
                target = directory / "symlink target"
                target.mkdir()
                (target / "winner").write_text("winner")
                winner_inode = directory / "winner inode"
                fake_bin = directory / "bin"
                fake_bin.mkdir()
                copy = fake_bin / "cp"
                # Ordinary pnpm can create the store while the seed is being copied,
                # without taking the installer's seed lock.
                copy.write_text(
                    '#!/bin/sh\nset -eu\n"$SITES_TEST_REAL_CP" "$@"\n'
                    'if [ "$1" = -a ]; then\n'
                    '  case "$SITES_TEST_WINNER" in\n'
                    '    file) printf winner > "$SITES_PNPM_SHARED_STORE" ;;\n'
                    '    symlink) ln -s "$SITES_TEST_WINNER_TARGET" "$SITES_PNPM_SHARED_STORE" ;;\n'
                    '    *) mkdir "$SITES_PNPM_SHARED_STORE"\n'
                    '       if [ "$SITES_TEST_WINNER" != empty ]; then\n'
                    '         printf winner > "$SITES_PNPM_SHARED_STORE/winner"\n'
                    "       fi ;;\n"
                    "  esac\n"
                    '  stat -c %i "$SITES_PNPM_SHARED_STORE" > "$SITES_TEST_WINNER_INODE"\n'
                    "fi\n"
                )
                copy.chmod(0o755)
                if winner == "move_error":
                    move = fake_bin / "mv"
                    move.write_text("#!/bin/sh\nexit 1\n")
                    move.chmod(0o755)
                workspace.env.update(
                    {
                        "PATH": str(fake_bin) + os.pathsep + workspace.env["PATH"],
                        "SITES_PNPM_SHARED_STORE": str(shared),
                        "SITES_PNPM_CACHE_SEED": str(seed),
                        "SITES_TEST_REAL_CP": shutil.which("cp") or "cp",
                        "SITES_TEST_WINNER": winner,
                        "SITES_TEST_WINNER_TARGET": str(target),
                        "SITES_TEST_WINNER_INODE": str(winner_inode),
                    }
                )
                result = workspace.run(shell=True)
                self.assertEqual(shared.lstat().st_ino, int(winner_inode.read_text()))
                if winner in ("empty", "populated"):
                    self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                    self.assertEqual(workspace.result()["store_scope"], "workspace")
                    self.assertEqual(workspace.result()["cache_seed"], "not_applicable")
                    self.assertEqual(len(workspace.calls()), 1)
                    args = workspace.calls()[0]["args"]
                    self.assertEqual(args[args.index("--store-dir") + 1], str(shared))
                else:
                    self.assertNotEqual(result.returncode, 0, result.stdout + result.stderr)
                    if winner == "move_error":
                        self.assertEqual(result.returncode, 70, result.stderr)
                    self.assertEqual(workspace.calls(), [])
                if winner == "file":
                    self.assertEqual(shared.read_text(), "winner")
                else:
                    expected_files = [] if winner == "empty" else ["winner"]
                    self.assertEqual(sorted(path.name for path in shared.iterdir()), expected_files)
                    if winner != "empty":
                        self.assertEqual((shared / "winner").read_text(), "winner")
                self.assertFalse(
                    any(path.is_dir() for path in shared.parent.glob("pnpm-store.seed.*"))
                )

    @unittest.skipUnless(shutil.which("flock") and shutil.which("timeout"), "requires Linux tools")
    def test_failed_seed_copy_never_publishes_a_partial_store(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            workspace = Workspace(directory)
            workspace.store.rmdir()
            seed = directory / "seed"
            (seed / "v11").mkdir(parents=True)
            (seed / ".sites-pnpm-seed.json").write_text(
                json.dumps(
                    {
                        "version": 1,
                        "pnpm_version": "11.25.0",
                        "store_version": "v11",
                        "lockfile_sha256": "a" * 64,
                    }
                )
            )
            fake_bin = directory / "bin"
            fake_bin.mkdir()
            copy = fake_bin / "cp"
            copy.write_text(
                '#!/bin/sh\nfor argument do destination="$argument"; done\n'
                'printf partial > "${destination%/}/partial"\nexit 7\n'
            )
            copy.chmod(0o755)
            workspace.env["PATH"] = str(fake_bin) + os.pathsep + workspace.env["PATH"]
            workspace.env["SITES_PNPM_CACHE_SEED"] = str(seed)
            result = workspace.run(shell=True)
            self.assertEqual(result.returncode, 70, result.stderr)
            self.assertFalse(workspace.store.exists())
            self.assertEqual(list(workspace.store.parent.glob("pnpm-store.seed.*")), [])
            self.assertEqual(workspace.calls(), [])

    @unittest.skipUnless(shutil.which("flock") and shutil.which("timeout"), "requires Linux tools")
    def test_incompatible_seed_without_existing_store_uses_an_empty_store(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            workspace = Workspace(directory)
            seed = directory / "seed"
            seed.mkdir()
            (seed / ".sites-pnpm-seed.json").write_text('{"version": 1, "store_version": "v10"}')
            (seed / "sentinel").write_text("do not copy")
            workspace.env["SITES_PNPM_CACHE_SEED"] = str(seed)
            workspace.store.rmdir()
            result = workspace.run(shell=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertFalse((workspace.store / "sentinel").exists())
            self.assertEqual(workspace.result()["cache_seed"], "seed_unavailable")
            self.assertEqual(workspace.result()["store_state"], "created")
            self.assertEqual(len(workspace.calls()), 1)

    @unittest.skipIf(os.name == "nt", "requires Unix process groups")
    def test_group_cancellation_leaves_counts_unknown(self) -> None:
        for trap_exit in (None, "70"):
            with self.subTest(trap_exit=trap_exit), tempfile.TemporaryDirectory() as temp:
                workspace = Workspace(Path(temp))
                workspace.env["SITES_TEST_WAIT"] = "1"
                if trap_exit:
                    workspace.env["SITES_TEST_TRAP_TERM"] = trap_exit
                args = [
                    NODE or "node",
                    str(workspace.project / "scripts/pnpm-install.mjs"),
                    "seed_unavailable",
                    "project",
                    "reused",
                    str(workspace.store),
                    NODE or "node",
                    str(workspace.fake_pnpm),
                ]
                with subprocess.Popen(
                    args,
                    cwd=workspace.project,
                    env=workspace.env,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    start_new_session=True,
                ) as process:
                    assert process.stdout is not None
                    self.assertEqual(process.stdout.readline(), "waiting\n")
                    os.killpg(process.pid, signal.SIGTERM)
                    _, stderr = process.communicate(timeout=5)
                    self.assertEqual(process.returncode, -signal.SIGTERM, stderr)
                self.assertNotIn("packages_reused", workspace.result())
                self.assertNotIn("packages_downloaded", workspace.result())


REAL_PNPM = os.environ.get("SITES_TEST_PNPM_BIN") or os.environ.get("SITES_PNPM_BIN")


@unittest.skipUnless(
    NODE and REAL_PNPM and Path(REAL_PNPM).is_file(), "requires explicit pinned pnpm fixture"
)
class NativePnpmInstallTests(unittest.TestCase):
    def test_relocated_project_repairs_store_then_updates_authoritative_pnpm_graph(self) -> None:
        # Local tarballs avoid an external registry; the real pinned CLI owns
        # linking, metadata, frozen repair, and manifest/lockfile updates.
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            workspace = Workspace(directory)
            workspace.env["SITES_PNPM_BIN"] = str(REAL_PNPM)
            shared = directory / "owner workspace/.sites-runtime/pnpm-store"
            workspace.image_store(shared)

            def package(name: str, version: str) -> Path:
                archive = workspace.project / f"{name}-{version}.tgz"
                manifest = {
                    "name": name,
                    "version": version,
                    "type": "module",
                    "exports": "./index.mjs",
                }
                if name == "vinext":
                    manifest["bin"] = {"vinext": "./bin.mjs"}
                contents = {
                    "package.json": json.dumps(manifest),
                    "index.mjs": f"export const version = {json.dumps(version)};\n",
                    "bin.mjs": "#!/usr/bin/env node\nconsole.log('fixture');\n",
                }
                with tarfile.open(archive, "w:gz") as bundle:
                    for filename, source in contents.items():
                        data = source.encode()
                        info = tarfile.TarInfo(f"package/{filename}")
                        info.size = len(data)
                        info.mode = 0o755 if filename == "bin.mjs" else 0o644
                        bundle.addfile(info, io.BytesIO(data))
                return archive

            vinext = package("vinext", "1.0.0")
            extra1 = package("fixture-extra", "1.0.0")
            extra2 = package("fixture-extra", "2.0.0")
            manifest = {
                "name": "native-fixture",
                "private": True,
                "type": "module",
                "packageManager": "pnpm@11.25.0",
                "dependencies": {"vinext": f"file:{vinext.name}"},
                "scripts": {
                    "build": "node --input-type=module -e \"import {version} from 'vinext'; if(version !== '1.0.0') process.exit(1)\""
                },
            }
            (workspace.project / "package.json").write_text(json.dumps(manifest))
            (workspace.project / "pnpm-lock.yaml").unlink()

            def pnpm(*args: str, expected: int = 0) -> subprocess.CompletedProcess[str]:
                result = subprocess.run(
                    [NODE or "node", str(REAL_PNPM), *args],
                    cwd=workspace.project,
                    env={**workspace.env, "CI": "true"},
                    capture_output=True,
                    text=True,
                    timeout=30,
                    check=False,
                )
                self.assertEqual(result.returncode, expected, result.stdout + result.stderr)
                return result

            self.assertEqual(pnpm("--version").stdout.strip(), "11.25.0")
            pnpm("install", "--lockfile-only", "--ignore-scripts")
            first = workspace.run(shell=True, timeout=30, arguments=("--require-shared",))
            self.assertEqual(first.returncode, 0, first.stdout + first.stderr)
            self.assertEqual(workspace.result()["store_scope"], "workspace")
            installed = (workspace.project / "node_modules/vinext/index.mjs").resolve()
            original = installed.read_bytes()
            cached = next(
                file
                for file in (shared / "v11/files").rglob("*")
                if file.is_file() and file.read_bytes() == original
            )
            self.assertNotEqual(
                (installed.stat().st_dev, installed.stat().st_ino),
                (cached.stat().st_dev, cached.stat().st_ino),
            )
            installed.write_bytes(original + b"// project-only edit\n")
            self.assertEqual(cached.read_bytes(), original)
            relocated = directory / "relocated project"
            workspace.project.rename(relocated)
            workspace.project = relocated
            workspace.store = relocated / ".sites-runtime/pnpm-store"
            pnpm("run", "build")
            pnpm("add", f"./{extra1.name}", "--save-exact")
            authoritative_lock = (relocated / "pnpm-lock.yaml").read_bytes()
            workspace.env.pop("SITES_PNPM_SHARED_STORE")
            wrong_store = pnpm("add", f"./{extra2.name}", "--save-exact", expected=1)
            self.assertIn("ERR_PNPM_UNEXPECTED_STORE", wrong_store.stdout + wrong_store.stderr)
            repaired = workspace.run(shell=True, timeout=30)
            self.assertEqual(repaired.returncode, 0, repaired.stdout + repaired.stderr)
            self.assertEqual(workspace.result()["store_scope"], "project")
            self.assertEqual((relocated / "pnpm-lock.yaml").read_bytes(), authoritative_lock)
            pnpm("add", f"./{extra2.name}", "--save-exact")
            pnpm(
                "exec",
                "node",
                "--input-type=module",
                "-e",
                "import {version} from 'fixture-extra'; if(version !== '2.0.0') process.exit(1)",
            )
            updated_lock = (relocated / "pnpm-lock.yaml").read_bytes()
            self.assertNotEqual(authoritative_lock, updated_lock)
            self.assertFalse((relocated / "package-lock.json").exists())
            # A restored/exported project uses Corepack's project pin even if a
            # different global pnpm exists. Keep the fixture offline by making
            # this shim invoke the already available pinned native pnpm.
            shim_dir = directory / "bin"
            shim_dir.mkdir()
            shim = shim_dir / "pnpm"
            shim.write_text('#!/bin/sh\necho "unexpected global pnpm" >&2\nexit 99\n')
            shim.chmod(0o755)
            corepack = shim_dir / "corepack"
            corepack.write_text(
                '#!/bin/sh\n[ "$1" = pnpm ] || exit 64\nshift\n'
                f'exec {shlex.quote(NODE or "node")} {shlex.quote(str(REAL_PNPM))} "$@"\n'
            )
            corepack.chmod(0o755)
            workspace.env.pop("SITES_PNPM_BIN")
            workspace.env["PATH"] = str(shim_dir) + os.pathsep + workspace.env["PATH"]
            shutil.rmtree(shared)
            shutil.rmtree(workspace.store)
            shutil.rmtree(relocated / "node_modules")
            restored = workspace.run(shell=True, timeout=30)
            self.assertEqual(restored.returncode, 0, restored.stdout + restored.stderr)
            self.assertEqual((relocated / "pnpm-lock.yaml").read_bytes(), updated_lock)
            pnpm("run", "build")


if __name__ == "__main__":
    unittest.main()
