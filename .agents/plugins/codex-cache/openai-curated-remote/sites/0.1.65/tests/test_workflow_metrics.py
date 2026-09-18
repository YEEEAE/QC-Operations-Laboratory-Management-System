from __future__ import annotations

import base64
import hashlib
import json
import os
import shutil
import signal
import subprocess
import sys
import tarfile
import tempfile
import unittest
from itertools import product
from pathlib import Path

PLUGIN_ROOT = Path(__file__).resolve().parents[1]
NODE = shutil.which("node")
METRICS_ENV = "CODEX_PLUGIN_METRICS_OUTPUT"
EXECUTION_PROFILES = ("portable", "managed-linux") if sys.platform == "linux" else ("portable",)

FAKE_MANAGER = r"""#!__PYTHON__
import json
import os
import signal
import subprocess
import sys
import threading
import time
from pathlib import Path

with open(os.environ["SITES_TEST_CALLS"], "a") as output:
    output.write(json.dumps({
        "manager": Path(sys.argv[0]).name,
        "args": sys.argv[1:],
        "cwd": os.getcwd(),
    }) + "\n")
if sys.argv[1:] == ["--version"]:
    print(os.environ.get("SITES_TEST_YARN_VERSION", "4.6.0"))
    sys.exit(0)
mode = os.environ.get("SITES_TEST_MODE", "")
code = int(os.environ.get("SITES_TEST_EXIT", "0"))
if mode == "stdio":
    data = sys.stdin.read()
    time.sleep(0.06)
    sys.stderr.write("child stderr\n")
    sys.stdout.write(json.dumps({
        "args": sys.argv[1:],
        "cwd": os.getcwd(),
        "secret": os.environ.get("SITES_TEST_SECRET"),
        "input": data,
    }))
elif mode == "stdin":
    print("ready", flush=True)
    sys.stdin.readline()
elif mode in ("install_report", "fallback_context"):
    report_path = os.environ.get("SITES_INSTALL_REPORT_PATH")
    if report_path:
        Path(report_path).write_text(os.environ.get("SITES_TEST_INSTALL_REPORT", ""))
    if mode == "fallback_context":
        print(json.dumps({key: os.environ.get(key) for key in (
            "SITES_ENV_READY", "SITES_PROJECT_ROOT", "SITES_RUNTIME_ROOT", "NPM_CONFIG_REGISTRY",
        )}))
        Path("fallback-output").write_text("created inside scratch")
elif mode == "replace_install_report":
    report = Path(os.environ["SITES_INSTALL_REPORT_PATH"])
    report.unlink()
    report.symlink_to(os.environ["SITES_TEST_REPORT_TARGET"])
elif mode == "stock_install":
    args = sys.argv[1:]
    if args[:1] == ["--prefix"]:
        args = args[3:]
    if args == ["run", "install:ci"]:
        sys.exit(subprocess.run(["bash", os.environ["SITES_TEST_STOCK_INSTALLER"]]).returncode)
    if args == ["config", "get", "cache"]:
        print(os.environ["npm_config_cache"])
    elif args == ["config", "get", "registry"]:
        print("https://registry.example/artifactory/api/npm/npm-sfw-remote/")
    elif args[0] == "ci":
        executable = Path("node_modules/.bin/vinext")
        executable.parent.mkdir(parents=True)
        executable.write_text("#!/bin/sh\nexit 0\n")
        executable.chmod(0o755)
        sys.exit(int(os.environ.get("SITES_TEST_INSTALL_EXIT", "0")))
elif mode == "term":
    handled = os.environ.get("SITES_TEST_HANDLED_EXIT")
    if handled is not None:
        signal.signal(signal.SIGTERM, lambda *_: sys.exit(int(handled)))
    print(os.getpgrp(), flush=True)
    time.sleep(60)
elif mode == "group_signal":
    delivered = 0
    def finish():
        print(f"signals={delivered}", flush=True)
        os._exit(code)
    def interrupt(*_):
        global delivered
        delivered += 1
        if delivered == 1:
            print("handling", flush=True)
            threading.Timer(0.25, finish).start()
    signal.signal(int(os.environ["SITES_TEST_SIGNAL"]), interrupt)
    print("ready", flush=True)
    time.sleep(60)
sys.stdout.write(os.environ.get("SITES_TEST_STDOUT", ""))
sys.stderr.write(os.environ.get("SITES_TEST_STDERR", ""))
sys.exit(code)
"""


def plugin_roots() -> list[Path]:
    return [PLUGIN_ROOT]


class Workspace:
    def __init__(self, directory: Path, manifest: dict | None = None) -> None:
        self.directory = directory.resolve()
        self.project = self.directory / "project with spaces"
        self.project.mkdir()
        self.bin = self.directory / "bin"
        self.bin.mkdir()
        for manager in ("npm", "pnpm", "yarn", "bun"):
            executable = self.bin / manager
            executable.write_text(FAKE_MANAGER.replace("__PYTHON__", sys.executable))
            executable.chmod(0o755)
        self.output = self.directory / "metrics.json"
        self.output.write_text("stale host-owned metrics bytes")
        self.calls_file = self.directory / "calls.jsonl"
        self.environment = dict(os.environ)
        self.environment.pop(METRICS_ENV, None)
        self.environment.pop("npm_config_user_agent", None)
        self.environment.pop("SITES_MANAGED_LINUX_CONTAINER", None)
        self.environment.update(
            {
                METRICS_ENV: str(self.output),
                "PATH": f"{self.bin}{os.pathsep}{os.environ.get('PATH', '')}",
                "SITES_TEST_CALLS": str(self.calls_file),
            }
        )
        if manifest is not None:
            (self.project / "package.json").write_text(json.dumps(manifest))

    def calls(self) -> list[dict]:
        if not self.calls_file.exists():
            return []
        return [json.loads(line) for line in self.calls_file.read_text().splitlines()]

    def lock(self, name: str) -> None:
        (self.project / name).write_text("test lockfile\n")

    def set_execution_profile(self, profile: str) -> None:
        self.environment["SITES_MANAGED_LINUX_CONTAINER"] = (
            "1" if profile == "managed-linux" else ""
        )


@unittest.skipUnless(NODE, "Node is required for Sites workflow entrypoints")
class SitesWorkflowMetricsTest(unittest.TestCase):
    def run_script(
        self,
        workspace: Workspace,
        name: str,
        arguments: list[str] | None = None,
        *,
        root: Path = PLUGIN_ROOT,
        input_text: str | None = None,
        node_options: list[str] | None = None,
    ) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [
                NODE or "node",
                *(node_options or []),
                str(root / "scripts" / name),
                *(arguments or []),
            ],
            cwd=workspace.project,
            env=workspace.environment,
            input=input_text,
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
        )

    def assert_measurement(
        self, output: Path, outcome: str, *, install: tuple[str, str] | None = None
    ) -> float:
        payload = json.loads(output.read_text())
        self.assertEqual(set(payload), {"version", "measurements"})
        self.assertEqual(payload["version"], 1)
        self.assertEqual(len(payload["measurements"]), 1)
        measurement = payload["measurements"][0]
        self.assertEqual(set(measurement), {"name", "value", "dimensions"})
        self.assertEqual(measurement["name"], "duration_ms")
        dimensions = {"outcome": outcome}
        if install is not None:
            dimensions.update(package_manager=install[0], cache_seed=install[1])
            dimensions["store_scope"] = "unknown"
        self.assertEqual(measurement["dimensions"], dimensions)
        self.assertIsInstance(measurement["value"], (float, int))
        self.assertGreaterEqual(measurement["value"], 0)
        self.assertLess(measurement["value"], 10_000)
        return measurement["value"]

    def npm_install_driver(
        self, workspace: Workspace, *, fallback: bool = True
    ) -> tuple[Path, Path]:
        scratch = workspace.directory / "npm scratch"
        scratch.mkdir()
        driver = workspace.directory / "npm-fallback.mjs"
        operation = (
            "runNpmFallbackInstaller(process.argv[2])"
            if fallback
            else 'runReportedInstall(["npm", "run", "install:ci"], { reportsSeed: true })'
        )
        driver.write_text(
            "import { runNpmFallbackInstaller, runReportedInstall } from "
            + json.dumps((PLUGIN_ROOT / "scripts/install-report.mjs").as_uri())
            + ";\nimport { runMeasuredOperation } from "
            + json.dumps((PLUGIN_ROOT / "scripts/workflow-metrics.mjs").as_uri())
            + f";\nawait runMeasuredOperation(() => {operation});\n"
        )
        return driver, scratch

    def pnpm_runtime_probe(self, project: Path) -> None:
        scripts = project / "scripts"
        scripts.mkdir()
        shutil.copy2(
            PLUGIN_ROOT / "skills/sites-building/templates/vinext-starter/scripts/sites-env.sh",
            scripts / "sites-env.sh",
        )
        helper = scripts / "install-pnpm.sh"
        helper.write_text(
            r"""#!/usr/bin/env bash
set -euo pipefail
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "${SITES_ENV_READY:-}" != 1 ]]; then
  exec "${script_dir}/sites-env.sh" -- "$0" "$@"
fi
node --input-type=module - <<'NODE'
import fs from "node:fs";
import path from "node:path";
const runtime = process.env.SITES_RUNTIME_ROOT || path.join(process.env.SITES_PROJECT_ROOT, ".sites-runtime");
fs.mkdirSync(path.join(runtime, "pnpm-store"), { recursive: true });
fs.writeFileSync(process.env.SITES_INSTALL_REPORT_PATH, JSON.stringify({
  version: 1, cache_seed: "seed_unavailable", store_scope: "project", store_state: "created",
}));
console.log(JSON.stringify({ root: process.env.SITES_PROJECT_ROOT, runtime, home: process.env.HOME }));
NODE
"""
        )
        helper.chmod(0o755)

    def test_established_pnpm_repair_preserves_custom_permitted_runtime(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            workspace = Workspace(
                Path(temp),
                {
                    "packageManager": "pnpm@11.25.0",
                    "scripts": {"install:ci": "bash scripts/install-pnpm.sh"},
                },
            )
            workspace.lock("pnpm-lock.yaml")
            self.pnpm_runtime_probe(workspace.project)
            # A regular file makes the default runtime unusable in this same
            # sandbox, including when tests run with privileged Unix ownership.
            blocked = workspace.project / ".sites-runtime"
            blocked.write_text("checkout-local runtime is unavailable")
            permitted = workspace.directory / "permitted runtime"
            workspace.environment["SITES_RUNTIME_ROOT"] = str(permitted)
            workspace.environment.pop("SITES_ENV_READY", None)
            workspace.environment.pop("SITES_PROJECT_ROOT", None)
            result = self.run_script(workspace, "install-dependencies.mjs")
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(
                json.loads(result.stdout),
                {
                    "root": str(workspace.project),
                    "runtime": str(permitted),
                    "home": str(permitted / "home"),
                },
            )
            self.assertTrue((permitted / "pnpm-store").is_dir())
            self.assertEqual(blocked.read_text(), "checkout-local runtime is unavailable")
            dimensions = json.loads(workspace.output.read_text())["measurements"][0]["dimensions"]
            self.assertEqual(
                dimensions,
                {
                    "outcome": "success",
                    "package_manager": "pnpm",
                    "cache_seed": "seed_unavailable",
                    "store_scope": "project",
                },
            )

    def test_scratch_pnpm_install_explicitly_resets_inherited_runtime(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            workspace = Workspace(Path(temp))
            scratch = workspace.directory / "pnpm scratch"
            scratch.mkdir()
            self.pnpm_runtime_probe(scratch)
            inherited = workspace.directory / "real project runtime"
            inherited.mkdir()
            sentinel = inherited / "sentinel"
            sentinel.write_text("unchanged")
            workspace.environment.update(
                {
                    "SITES_ENV_READY": "1",
                    "SITES_PROJECT_ROOT": str(workspace.project),
                    "SITES_RUNTIME_ROOT": str(inherited),
                    "HOME": str(inherited / "home"),
                }
            )
            driver = workspace.directory / "pnpm-scratch.mjs"
            driver.write_text(
                "import { runPnpmInstaller } from "
                + json.dumps((PLUGIN_ROOT / "scripts/install-report.mjs").as_uri())
                + ";\nimport { runMeasuredOperation } from "
                + json.dumps((PLUGIN_ROOT / "scripts/workflow-metrics.mjs").as_uri())
                + ";\nawait runMeasuredOperation(() => runPnpmInstaller(process.argv[2], [], { resetContext: true }));\n"
            )
            result = self.run_script(workspace, str(driver), [str(scratch)])
            self.assertEqual(result.returncode, 0, result.stderr)
            runtime = scratch / ".sites-runtime"
            self.assertEqual(
                json.loads(result.stdout),
                {"root": str(scratch), "runtime": str(runtime), "home": str(runtime / "home")},
            )
            self.assertTrue((runtime / "pnpm-store").is_dir())
            self.assertEqual(list(inherited.iterdir()), [sentinel])
            self.assertEqual(sentinel.read_text(), "unchanged")

    def test_npm_fallback_uses_scratch_context_and_reports_npm_seed(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            workspace = Workspace(Path(temp), {"scripts": {"install:ci": "owned install"}})
            driver, scratch = self.npm_install_driver(workspace)
            old_report = workspace.directory / "inherited-report"
            old_report.write_text("do not use the caller's report")
            workspace.environment.update(
                {
                    "SITES_ENV_READY": "1",
                    "SITES_PROJECT_ROOT": str(workspace.project),
                    "SITES_RUNTIME_ROOT": str(workspace.project / ".sites-runtime"),
                    "SITES_INSTALL_REPORT_PATH": str(old_report),
                    "NPM_CONFIG_REGISTRY": "https://registry.example/public/",
                    "SITES_TEST_MODE": "fallback_context",
                    "SITES_TEST_INSTALL_REPORT": '{"version":1,"cache_seed":"seed_used"}',
                }
            )
            result = self.run_script(workspace, str(driver), [str(scratch)])
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(
                json.loads(result.stdout),
                {
                    "SITES_ENV_READY": None,
                    "SITES_PROJECT_ROOT": None,
                    "SITES_RUNTIME_ROOT": None,
                    "NPM_CONFIG_REGISTRY": "https://registry.example/public/",
                },
            )
            self.assertEqual(
                workspace.calls(),
                [
                    {
                        "manager": "npm",
                        "args": ["--prefix", ".", "--workspaces=false", "run", "install:ci"],
                        "cwd": str(scratch),
                    }
                ],
            )
            self.assertEqual((scratch / "fallback-output").read_text(), "created inside scratch")
            self.assertFalse((workspace.project / "fallback-output").exists())
            self.assertEqual(old_report.read_text(), "do not use the caller's report")
            self.assert_measurement(workspace.output, "success", install=("npm", "seed_used"))

    @unittest.skipIf(os.name == "nt", "Unix process-group signals")
    def test_npm_fallback_preserves_cancellation_without_changing_ordinary_npm(self) -> None:
        for fallback, handled_exit in ((True, 0), (True, 69), (False, 0), (False, 69)):
            with (
                self.subTest(fallback=fallback, handled_exit=handled_exit),
                tempfile.TemporaryDirectory() as temp,
            ):
                workspace = Workspace(Path(temp))
                driver, scratch = self.npm_install_driver(workspace, fallback=fallback)
                workspace.environment.update(
                    {"SITES_TEST_MODE": "term", "SITES_TEST_HANDLED_EXIT": str(handled_exit)}
                )
                process = subprocess.Popen(
                    [NODE or "node", str(driver), str(scratch)],
                    cwd=workspace.project,
                    env=workspace.environment,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    start_new_session=True,
                )
                try:
                    assert process.stdout is not None
                    self.assertEqual(int(process.stdout.readline()), process.pid)
                    os.killpg(process.pid, signal.SIGTERM)
                    _, stderr = process.communicate(timeout=5)
                    self.assertEqual(
                        process.returncode, -signal.SIGTERM if fallback else handled_exit, stderr
                    )
                    self.assert_measurement(
                        workspace.output,
                        "cancelled" if fallback else "success" if handled_exit == 0 else "error",
                        install=("npm", "decision_unavailable"),
                    )
                    self.assertEqual(len(workspace.calls()), 1)
                    self.assertEqual(
                        workspace.calls()[0]["cwd"], str(scratch if fallback else workspace.project)
                    )
                finally:
                    self.stop_signal_process(process)

    def test_entrypoints_choose_scripts_and_preserve_process_context(self) -> None:
        for root in plugin_roots():
            for script, args in (
                ("build-site.mjs", ["run", "build"]),
                (
                    "install-dependencies.mjs",
                    ["--prefix", ".", "--workspaces=false", "run", "install:ci"],
                ),
            ):
                with self.subTest(root=root, script=script), tempfile.TemporaryDirectory() as temp:
                    workspace = Workspace(
                        Path(temp),
                        {"scripts": {"build": "owned build", "install:ci": "owned install"}},
                    )
                    workspace.environment.update(
                        {"SITES_TEST_MODE": "stdio", "SITES_TEST_SECRET": "secret-env-sentinel"}
                    )
                    result = self.run_script(
                        workspace, script, input_text="child stdin\n", root=root
                    )
                    self.assertEqual(result.returncode, 0, result.stderr)
                    self.assertEqual(result.stderr, "child stderr\n")
                    self.assertEqual(
                        json.loads(result.stdout),
                        {
                            "args": args,
                            "cwd": str(workspace.project),
                            "secret": "secret-env-sentinel",
                            "input": "child stdin\n",
                        },
                    )
                    self.assertEqual(workspace.calls()[0]["manager"], "npm")
                    self.assertGreaterEqual(
                        self.assert_measurement(
                            workspace.output,
                            "success",
                            install=("npm", "decision_unavailable")
                            if script == "install-dependencies.mjs"
                            else None,
                        ),
                        40,
                    )
                    for secret in (str(workspace.project), "secret-env-sentinel", "child stdin"):
                        self.assertNotIn(secret, workspace.output.read_text())

    def test_build_preserves_declared_or_locked_manager(self) -> None:
        for manager, lockfile in (
            ("npm", "npm-shrinkwrap.json"),
            ("pnpm", "pnpm-lock.yaml"),
            ("yarn", "yarn.lock"),
            ("bun", "bun.lockb"),
        ):
            for declared in (False, True):
                with (
                    self.subTest(manager=manager, declared=declared),
                    tempfile.TemporaryDirectory() as temp,
                ):
                    manifest = {"scripts": {"build": "owned build"}}
                    if declared:
                        manifest["packageManager"] = f"{manager}@4.6.0"
                    workspace = Workspace(Path(temp), manifest)
                    if not declared:
                        workspace.lock(lockfile)
                    result = self.run_script(workspace, "build-site.mjs")
                    self.assertEqual(result.returncode, 0, result.stderr)
                    self.assertEqual(
                        workspace.calls(),
                        [
                            {
                                "manager": manager,
                                "args": ["run", "build"],
                                "cwd": str(workspace.project),
                            }
                        ],
                    )

    def test_install_uses_lockfile_respecting_manager_modes(self) -> None:
        cases = (
            ("npm@10.0.0", None, ["install"]),
            ("npm@10.0.0", "package-lock.json", ["ci"]),
            ("npm@10.0.0", "npm-shrinkwrap.json", ["ci"]),
            ("pnpm@9.0.0", None, ["install"]),
            ("pnpm@9.0.0", "pnpm-lock.yaml", ["install", "--frozen-lockfile"]),
            ("yarn@1.22.22", None, ["install", "--non-interactive"]),
            ("yarn@1.22.22", "yarn.lock", ["install", "--frozen-lockfile", "--non-interactive"]),
            ("yarn@4.6.0", None, ["install", "--no-immutable"]),
            ("yarn@4.6.0", "yarn.lock", ["install", "--immutable"]),
            ("bun@1.3.0", None, ["install"]),
            ("bun@1.3.0", "bun.lock", ["install", "--frozen-lockfile"]),
            ("bun@1.3.0", "bun.lockb", ["install", "--frozen-lockfile"]),
        )
        for declared, lockfile, args in cases:
            with (
                self.subTest(declared=declared, lockfile=lockfile),
                tempfile.TemporaryDirectory() as temp,
            ):
                workspace = Workspace(Path(temp), {"packageManager": declared})
                if lockfile:
                    workspace.lock(lockfile)
                result = self.run_script(workspace, "install-dependencies.mjs")
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(workspace.calls()[0]["args"], args)
                self.assertEqual(workspace.calls()[0]["manager"], declared.split("@")[0])

    def test_yarn_lockfile_without_declaration_uses_installed_major_version(self) -> None:
        for version, expected in (
            ("1.22.22", ["install", "--frozen-lockfile", "--non-interactive"]),
            ("4.6.0", ["install", "--immutable"]),
        ):
            with self.subTest(version=version), tempfile.TemporaryDirectory() as temp:
                workspace = Workspace(Path(temp), {"dependencies": {"example": "1"}})
                workspace.lock("yarn.lock")
                workspace.environment["SITES_TEST_YARN_VERSION"] = version
                result = self.run_script(workspace, "install-dependencies.mjs")
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(
                    [call["args"] for call in workspace.calls()], [["--version"], expected]
                )

    def test_conflicting_manager_evidence_fails_before_running_package_manager(self) -> None:
        for declared, lockfiles in (
            ("pnpm@9.0.0", ["package-lock.json"]),
            ("yarn@4.6.0", ["bun.lock"]),
            (None, ["pnpm-lock.yaml", "package-lock.json"]),
            ("unknown@1.0.0", []),
        ):
            for script in ("build-site.mjs", "install-dependencies.mjs"):
                with (
                    self.subTest(declared=declared, script=script),
                    tempfile.TemporaryDirectory() as temp,
                ):
                    manifest = {"scripts": {"build": "owned build", "install:ci": "owned install"}}
                    if declared:
                        manifest["packageManager"] = declared
                    workspace = Workspace(Path(temp), manifest)
                    for lockfile in lockfiles:
                        workspace.lock(lockfile)
                    result = self.run_script(workspace, script)
                    self.assertNotEqual(result.returncode, 0)
                    self.assertEqual(workspace.calls(), [])
                    self.assert_measurement(workspace.output, "error")

    def test_install_skips_only_missing_manifests(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            workspace = Workspace(Path(temp))
            result = self.run_script(workspace, "install-dependencies.mjs")
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn("No dependency installation is needed", result.stdout)
            self.assertEqual(workspace.calls(), [])
            self.assertEqual(
                json.loads(workspace.output.read_text()), {"version": 1, "measurements": []}
            )
            self.assertFalse((workspace.project / "package-lock.json").exists())
        for manifest in (
            {},
            {"scripts": {"build": "owned build"}},
            {"scripts": {"prepare": "owned preparation"}},
            {"private": True, "workspaces": ["packages/*"]},
        ):
            with self.subTest(manifest=manifest), tempfile.TemporaryDirectory() as temp:
                workspace = Workspace(Path(temp), manifest)
                result = self.run_script(workspace, "install-dependencies.mjs")
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(workspace.calls()[0]["args"], ["install"])
                self.assert_measurement(
                    workspace.output, "success", install=("npm", "not_applicable")
                )

    def test_pnpm_workspace_without_lockfile_uses_unlocked_pnpm(self) -> None:
        for script, args in (
            ("install-dependencies.mjs", ["install"]),
            ("build-site.mjs", ["run", "build"]),
        ):
            with self.subTest(script=script), tempfile.TemporaryDirectory() as temp:
                workspace = Workspace(Path(temp), {"scripts": {"build": "owned build"}})
                (workspace.project / "pnpm-workspace.yaml").write_text(
                    "packages:\n  - packages/*\n"
                )
                result = self.run_script(workspace, script)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(
                    workspace.calls(),
                    [{"manager": "pnpm", "args": args, "cwd": str(workspace.project)}],
                )

    @unittest.skipUnless(shutil.which("npm"), "npm is required for workspace linking")
    def test_install_links_local_npm_workspace_without_root_dependencies(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            workspace = Workspace(
                Path(temp),
                {"name": "workspace-root", "private": True, "workspaces": ["packages/*"]},
            )
            package = workspace.project / "packages/local"
            package.mkdir(parents=True)
            (package / "package.json").write_text(
                json.dumps(
                    {"name": "sites-workspace-local", "version": "1.0.0", "main": "index.js"}
                )
            )
            (package / "index.js").write_text('module.exports = "linked";\n')
            # Use real npm with an empty isolated cache; this fixture has no registry packages.
            workspace.environment.update(
                {
                    "PATH": os.environ.get("PATH", ""),
                    "npm_config_cache": str(workspace.directory / "npm-cache"),
                    "npm_config_offline": "true",
                    "npm_config_audit": "false",
                    "npm_config_fund": "false",
                    "npm_config_update_notifier": "false",
                }
            )
            result = self.run_script(workspace, "install-dependencies.mjs")
            self.assertEqual(result.returncode, 0, result.stderr)
            linked = subprocess.run(
                [NODE or "node", "-e", "process.stdout.write(require('sites-workspace-local'));"],
                cwd=workspace.project,
                env=workspace.environment,
                capture_output=True,
                text=True,
                timeout=10,
                check=False,
            )
            self.assertEqual(linked.returncode, 0, linked.stderr)
            self.assertEqual(linked.stdout, "linked")
            self.assert_measurement(workspace.output, "success", install=("npm", "not_applicable"))

    def test_install_reports_bounded_seed_metadata_and_preserves_exit(self) -> None:
        for raw, expected in (
            ('{"version":1,"cache_seed":"seed_used"}', "seed_used"),
            ('{"version":1,"cache_seed":"seed_unavailable"}', "seed_unavailable"),
            ('{"version":1,"cache_seed":"seed_lockfile_mismatch"}', "seed_lockfile_mismatch"),
            ('{"version":1,"cache_seed":"private-path-or-token"}', "decision_unavailable"),
            ('{"version":2,"cache_seed":"seed_used"}', "decision_unavailable"),
            ("not-json", "decision_unavailable"),
            ("x" * 4097, "decision_unavailable"),
            ("", "decision_unavailable"),
        ):
            with (
                self.subTest(expected=expected, length=len(raw)),
                tempfile.TemporaryDirectory() as temp,
            ):
                workspace = Workspace(Path(temp), {"scripts": {"install:ci": "owned install"}})
                workspace.environment.update(
                    SITES_TEST_MODE="install_report", SITES_TEST_INSTALL_REPORT=raw
                )
                result = self.run_script(workspace, "install-dependencies.mjs")
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(
                    workspace.calls()[0]["args"],
                    ["--prefix", ".", "--workspaces=false", "run", "install:ci"],
                )
                self.assert_measurement(workspace.output, "success", install=("npm", expected))
                self.assertNotIn("private-path-or-token", workspace.output.read_text())
                # The next attempt has no report; an earlier match must not leak into it.
                workspace.environment["SITES_TEST_MODE"] = ""
                workspace.environment["SITES_TEST_EXIT"] = "7"
                result = self.run_script(workspace, "install-dependencies.mjs")
                self.assertEqual(result.returncode, 7, result.stderr)
                self.assert_measurement(
                    workspace.output, "error", install=("npm", "decision_unavailable")
                )

    def test_install_report_does_not_follow_a_replaced_path(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            workspace = Workspace(Path(temp), {"scripts": {"install:ci": "owned install"}})
            target = Path(temp) / "other-report.json"
            target.write_text('{"version":1,"cache_seed":"seed_used"}')
            workspace.environment.update(
                SITES_TEST_MODE="replace_install_report", SITES_TEST_REPORT_TARGET=str(target)
            )
            result = self.run_script(workspace, "install-dependencies.mjs")
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assert_measurement(
                workspace.output, "success", install=("npm", "decision_unavailable")
            )
            self.assertEqual(target.read_text(), '{"version":1,"cache_seed":"seed_used"}')

    @unittest.skipUnless(sys.platform == "linux", "The Flora npm installer targets Linux")
    def test_stock_installer_reports_its_seed_decision_only_after_success(self) -> None:
        for runtime_override, (seed_result, exit_code) in product(
            (None, "", "custom runtime with spaces"),
            (
                ("seed_used", 0),
                ("seed_unavailable", 0),
                ("seed_lockfile_mismatch", 0),
                ("seed_used", 7),
            ),
        ):
            with (
                self.subTest(runtime=runtime_override, seed=seed_result, exit=exit_code),
                tempfile.TemporaryDirectory() as temp,
            ):
                workspace = Workspace(Path(temp), {"scripts": {"install:ci": "owned install"}})
                shutil.copytree(
                    PLUGIN_ROOT / "skills/sites-building/templates/vinext-starter/scripts",
                    workspace.project / "scripts",
                )
                tarball = b"local locked tarball fixture"
                integrity = base64.b64encode(hashlib.sha512(tarball).digest()).decode()
                lockfile = workspace.project / "package-lock.json"
                lockfile.write_text(
                    json.dumps(
                        {
                            "packages": {
                                "node_modules/vinext": {
                                    "resolved": "https://registry.npmjs.org/vinext/-/vinext-1.0.0.tgz",
                                    "integrity": f"sha512-{integrity}",
                                }
                            }
                        }
                    )
                )
                runtime = workspace.project / ".sites-runtime"
                workspace.environment.pop("SITES_ENV_READY", None)
                workspace.environment.pop("SITES_RUNTIME_ROOT", None)
                if runtime_override is not None:
                    if runtime_override:
                        runtime = workspace.directory / runtime_override
                    workspace.environment["SITES_RUNTIME_ROOT"] = (
                        str(runtime) if runtime_override else ""
                    )
                seed = workspace.directory / "seed"
                if seed_result != "seed_unavailable":
                    seed.mkdir()
                    (seed / ".sites-lockfile-sha256").write_text(
                        hashlib.sha256(lockfile.read_bytes()).hexdigest()
                        if seed_result == "seed_used"
                        else "different-lockfile"
                    )
                curl = workspace.bin / "curl"
                curl.write_text(
                    f"#!{sys.executable}\nimport sys\nfrom pathlib import Path\n"
                    f"Path(sys.argv[sys.argv.index('--output') + 1]).write_bytes({tarball!r})\n"
                )
                curl.chmod(0o755)
                workspace.environment.update(
                    SITES_TEST_MODE="stock_install",
                    SITES_TEST_STOCK_INSTALLER=str(workspace.project / "scripts/install-ci.sh"),
                    SITES_TEST_INSTALL_EXIT=str(exit_code),
                    SITES_NPM_CACHE_SEED=str(seed),
                )
                result = self.run_script(workspace, "install-dependencies.mjs")
                self.assertEqual(result.returncode, exit_code, result.stderr)
                self.assert_measurement(
                    workspace.output,
                    "success" if exit_code == 0 else "error",
                    install=("npm", seed_result if exit_code == 0 else "decision_unavailable"),
                )
                installs = [call for call in workspace.calls() if call["args"][0] == "ci"]
                self.assertEqual(len(installs), 1)
                self.assertEqual(
                    installs[0]["args"][installs[0]["args"].index("--cache") + 1],
                    str(runtime / "npm-cache"),
                )
                self.assertTrue((runtime / "install.lock").is_file())
                if runtime_override:
                    self.assertFalse((workspace.project / ".sites-runtime").exists())
                self.assertEqual(
                    "--prefer-offline" in installs[0]["args"], seed_result == "seed_used"
                )

    def test_setup_and_install_are_separate_for_both_profiles(self) -> None:
        for root, profile in product(plugin_roots(), EXECUTION_PROFILES):
            with (
                self.subTest(root=root, profile=profile),
                tempfile.TemporaryDirectory() as temp,
            ):
                workspace = Workspace(Path(temp))
                workspace.set_execution_profile(profile)
                workspace.environment["npm_config_user_agent"] = "pnpm/9.0.0 npm/? node/v22"
                for name in (".agents", ".codex", "work", "outputs"):
                    directory = workspace.project / name
                    directory.mkdir()
                    (directory / "keep").write_text(name)
                result = self.run_script(workspace, "project-setup.mjs", root=root)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(workspace.calls(), [])
                self.assertFalse((workspace.project / "node_modules").exists())
                self.assertEqual(
                    json.loads(
                        (workspace.project / ".sites-runtime/execution-profile.json").read_text()
                    )["executionProfile"],
                    profile,
                )
                starter = root / "skills/sites-building/templates/vinext-starter"
                for name in (
                    "package.json",
                    "package-lock.json",
                    ".gitignore",
                    ".openai/hosting.json",
                ):
                    self.assertEqual(
                        (workspace.project / name).read_bytes(), (starter / name).read_bytes()
                    )
                self.assertFalse((workspace.project / ".git").exists())
                for name in (".agents", ".codex", "work", "outputs"):
                    self.assertEqual((workspace.project / name / "keep").read_text(), name)
                self.assert_measurement(workspace.output, "success")
                setup_measurement = workspace.output.read_bytes()

                install_output = workspace.directory / "install-metrics.json"
                install_output.write_text("stale host-owned metrics bytes")
                workspace.environment[METRICS_ENV] = str(install_output)
                workspace.environment["SITES_TEST_MODE"] = "stdio"
                result = self.run_script(
                    workspace, "install-dependencies.mjs", root=root, input_text=""
                )
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(
                    workspace.calls(),
                    [
                        {
                            "manager": "npm",
                            "args": ["--prefix", ".", "--workspaces=false", "run", "install:ci"],
                            "cwd": str(workspace.project),
                        }
                    ],
                )
                self.assertGreaterEqual(
                    self.assert_measurement(
                        install_output, "success", install=("npm", "decision_unavailable")
                    ),
                    40,
                )
                self.assertEqual(workspace.output.read_bytes(), setup_measurement)
                self.assertEqual(
                    (workspace.project / "package-lock.json").read_bytes(),
                    (starter / "package-lock.json").read_bytes(),
                )

    def test_separate_install_failure_can_recover_without_recopying(self) -> None:
        for root, profile in product(plugin_roots(), EXECUTION_PROFILES):
            with (
                self.subTest(root=root, profile=profile),
                tempfile.TemporaryDirectory() as temp,
            ):
                workspace = Workspace(Path(temp))
                workspace.set_execution_profile(profile)
                workspace.environment["SITES_TEST_EXIT"] = "7"
                result = self.run_script(workspace, "project-setup.mjs", root=root)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(workspace.calls(), [])
                self.assert_measurement(workspace.output, "success")
                result = self.run_script(workspace, "install-dependencies.mjs", root=root)
                self.assertEqual(result.returncode, 7, result.stderr)
                self.assert_measurement(
                    workspace.output, "error", install=("npm", "decision_unavailable")
                )
                page = workspace.project / "app/page.tsx"
                page.write_text("authored page")
                lock = (workspace.project / "package-lock.json").read_bytes()
                workspace.environment.pop("SITES_TEST_EXIT")
                result = self.run_script(workspace, "install-dependencies.mjs", root=root)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(page.read_text(), "authored page")
                self.assertEqual((workspace.project / "package-lock.json").read_bytes(), lock)
                self.assertEqual(len(workspace.calls()), 2)
                self.assertEqual(
                    workspace.calls()[-1]["args"],
                    ["--prefix", ".", "--workspaces=false", "run", "install:ci"],
                )
                self.assert_measurement(
                    workspace.output, "success", install=("npm", "decision_unavailable")
                )

    @unittest.skipIf(os.name == "nt", "Unix process-group signals")
    def test_separate_install_cancellation_waits_for_installer(self) -> None:
        for root, profile in product(plugin_roots(), EXECUTION_PROFILES):
            with (
                self.subTest(root=root, profile=profile),
                tempfile.TemporaryDirectory() as temp,
            ):
                workspace = Workspace(Path(temp))
                workspace.set_execution_profile(profile)
                result = self.run_script(workspace, "project-setup.mjs", root=root)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(workspace.calls(), [])
                workspace.environment["SITES_TEST_MODE"] = "term"
                process = subprocess.Popen(
                    [NODE or "node", str(root / "scripts/install-dependencies.mjs")],
                    cwd=workspace.project,
                    env=workspace.environment,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    start_new_session=True,
                )
                try:
                    assert process.stdout is not None
                    self.assertEqual(int(process.stdout.readline()), process.pid)
                    os.killpg(process.pid, signal.SIGTERM)
                    _, stderr = process.communicate(timeout=5)
                    self.assertEqual(process.returncode, -signal.SIGTERM, stderr)
                    self.assert_measurement(
                        workspace.output, "cancelled", install=("npm", "decision_unavailable")
                    )
                    self.assertTrue((workspace.project / "package.json").is_file())
                    self.assertEqual(len(workspace.calls()), 1)
                finally:
                    self.stop_signal_process(process)

    def test_work_setup_copies_bundled_starters_and_dotfiles_without_installing(self) -> None:
        for starter, name in (
            (None, "site-creator-vinext-starter"),
            ("worker-esm", "sites-worker-esm-starter"),
        ):
            with self.subTest(starter=starter), tempfile.TemporaryDirectory() as temp:
                workspace = Workspace(Path(temp))
                arguments = ["--starter", starter] if starter else []
                result = self.run_script(workspace, "project-setup.mjs", arguments)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(
                    json.loads((workspace.project / "package.json").read_text())["name"], name
                )
                self.assertTrue((workspace.project / ".gitignore").is_file())
                self.assertEqual(workspace.calls(), [])
                self.assert_measurement(workspace.output, "success")

    def test_retained_template_copy_preserves_source_and_checkout_metadata(self) -> None:
        for root in plugin_roots():
            with self.subTest(root=root), tempfile.TemporaryDirectory() as temp:
                workspace = Workspace(Path(temp))
                source = workspace.directory / "retained source"
                (source / ".openai").mkdir(parents=True)
                (source / ".openai/hosting.json").write_text('{"d1":"DB","r2":"BUCKET"}\n')
                (source / ".hidden").write_text("template content")
                (workspace.project / ".git").write_text("existing git metadata")
                result = self.run_script(
                    workspace, "project-setup.mjs", ["--template-source", str(source)], root=root
                )
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual((workspace.project / ".hidden").read_text(), "template content")
                self.assertEqual((workspace.project / ".git").read_text(), "existing git metadata")
                self.assertEqual(
                    (workspace.project / ".openai/hosting.json").read_text(),
                    '{"d1":"DB","r2":"BUCKET"}\n',
                )
                (workspace.project / ".hidden").write_text("new project content")
                self.assertEqual((source / ".hidden").read_text(), "template content")
                self.assertEqual(workspace.calls(), [])

    def test_setup_refuses_nonempty_destinations_and_unsafe_templates_before_copy(self) -> None:
        for root in plugin_roots():
            with self.subTest(root=root), tempfile.TemporaryDirectory() as temp:
                workspace = Workspace(Path(temp))
                (workspace.project / "keep.txt").write_text("keep")
                result = self.run_script(workspace, "project-setup.mjs", root=root)
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual((workspace.project / "keep.txt").read_text(), "keep")
                self.assertEqual(len(list(workspace.project.iterdir())), 1)
                self.assertEqual(workspace.calls(), [])
        for unsafe in ("absolute-link", "relative-link", "nested-git", "project-id"):
            with self.subTest(unsafe=unsafe), tempfile.TemporaryDirectory() as temp:
                workspace = Workspace(Path(temp))
                source = workspace.directory / "source"
                source.mkdir()
                keep = source / "keep.txt"
                keep.write_text("source remains unchanged")
                if unsafe == "absolute-link":
                    (source / "link").symlink_to(keep)
                elif unsafe == "relative-link":
                    (source / "link").symlink_to("../outside.txt")
                elif unsafe == "nested-git":
                    (source / "nested/.git").mkdir(parents=True)
                else:
                    (source / ".openai").mkdir()
                    (source / ".openai/hosting.json").write_text(
                        '{"project_id":"appgprj_another_site"}'
                    )
                result = self.run_script(
                    workspace, "project-setup.mjs", ["--template-source", str(source)]
                )
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(list(workspace.project.iterdir()), [])
                self.assertEqual(keep.read_text(), "source remains unchanged")
                self.assertEqual(workspace.calls(), [])

    def test_public_entrypoints_reject_command_escape_hatches_and_conflicting_setup_options(
        self,
    ) -> None:
        for root in plugin_roots():
            for script in ("project-setup.mjs", "install-dependencies.mjs", "build-site.mjs"):
                with self.subTest(root=root, script=script), tempfile.TemporaryDirectory() as temp:
                    workspace = Workspace(Path(temp))
                    result = self.run_script(
                        workspace, script, ["--", "touch", "unwanted"], root=root
                    )
                    self.assertEqual(result.returncode, 64)
                    self.assertEqual(list(workspace.project.iterdir()), [])
                    self.assertEqual(workspace.calls(), [])
        for root in plugin_roots():
            with self.subTest(root=root), tempfile.TemporaryDirectory() as temp:
                workspace = Workspace(Path(temp))
                source = workspace.directory / "source"
                source.mkdir()
                option = (
                    ["--starter", "vinext"] if root == PLUGIN_ROOT else ["--package-manager", "npm"]
                )
                result = self.run_script(
                    workspace,
                    "project-setup.mjs",
                    ["--template-source", str(source), *option],
                    root=root,
                )
                self.assertEqual(result.returncode, 64)
                self.assertEqual(list(workspace.project.iterdir()), [])
                self.assertEqual(workspace.calls(), [])

    def test_nonzero_exit_and_spawn_failure_remain_failures(self) -> None:
        for exit_code in (7, 124):
            with self.subTest(exit_code=exit_code), tempfile.TemporaryDirectory() as temp:
                workspace = Workspace(Path(temp), {"scripts": {"build": "owned build"}})
                workspace.environment.update(
                    {
                        "SITES_TEST_EXIT": str(exit_code),
                        "SITES_TEST_STDOUT": "out",
                        "SITES_TEST_STDERR": "err",
                    }
                )
                result = self.run_script(workspace, "build-site.mjs")
                self.assertEqual(
                    (result.returncode, result.stdout, result.stderr), (exit_code, "out", "err")
                )
                self.assert_measurement(workspace.output, "error")
        with tempfile.TemporaryDirectory() as temp:
            workspace = Workspace(Path(temp), {"scripts": {"build": "owned build"}})
            (workspace.bin / "npm").unlink()
            workspace.environment["PATH"] = str(workspace.bin)
            result = self.run_script(workspace, "build-site.mjs")
            self.assertEqual(result.returncode, 127)
            self.assertEqual(result.stdout, "")
            self.assert_measurement(workspace.output, "error")

    def test_unavailable_sidecar_does_not_change_command(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            workspace = Workspace(Path(temp), {"scripts": {"build": "owned build"}})
            target = workspace.directory / "target"
            target.write_text("keep this file")
            symlink = workspace.directory / "link"
            symlink.symlink_to(target)
            outputs: list[Path | None] = [
                None,
                workspace.directory / "missing",
                workspace.directory,
                symlink,
            ]
            if hasattr(os, "geteuid") and os.geteuid() != 0:
                readonly = workspace.directory / "readonly"
                readonly.write_text("unwritable file")
                readonly.chmod(0o400)
                outputs.append(readonly)
            if hasattr(os, "mkfifo"):
                fifo = workspace.directory / "fifo"
                os.mkfifo(fifo)
                outputs.append(fifo)
            workspace.environment["SITES_TEST_STDOUT"] = "ran"
            for output in outputs:
                with self.subTest(output=output):
                    workspace.environment.pop(METRICS_ENV, None)
                    if output is not None:
                        workspace.environment[METRICS_ENV] = str(output)
                    result = self.run_script(workspace, "build-site.mjs")
                    self.assertEqual(
                        (result.returncode, result.stdout, result.stderr), (0, "ran", "")
                    )
            self.assertFalse((workspace.directory / "missing").exists())
            self.assertEqual(target.read_text(), "keep this file")

    def test_sidecar_write_failure_does_not_mask_child_result(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            workspace = Workspace(Path(temp), {"scripts": {"build": "owned build"}})
            preload = workspace.directory / "write-failure.mjs"
            preload.write_text(
                'import fs from "node:fs";\n'
                'import { syncBuiltinESMExports } from "node:module";\n'
                'fs.writeFileSync = () => { throw new Error("secret telemetry write error"); };\n'
                "syncBuiltinESMExports();\n"
            )
            for exit_code in (0, 9):
                with self.subTest(exit_code=exit_code):
                    workspace.environment.update(
                        {"SITES_TEST_EXIT": str(exit_code), "SITES_TEST_STDOUT": "ran"}
                    )
                    result = self.run_script(
                        workspace, "build-site.mjs", node_options=["--import", str(preload)]
                    )
                    self.assertEqual(
                        (result.returncode, result.stdout, result.stderr), (exit_code, "ran", "")
                    )

    def test_sidecar_keeps_original_inode_when_path_is_replaced(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            workspace = Workspace(Path(temp), {"scripts": {"build": "owned build"}})
            workspace.environment["SITES_TEST_MODE"] = "stdin"
            pinned = workspace.directory / "pinned.json"
            with subprocess.Popen(
                [NODE or "node", str(PLUGIN_ROOT / "scripts/build-site.mjs")],
                cwd=workspace.project,
                env=workspace.environment,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            ) as process:
                assert process.stdout is not None
                self.assertEqual(process.stdout.readline(), "ready\n")
                workspace.output.rename(pinned)
                workspace.output.write_text("replacement remains untouched")
                _, stderr = process.communicate("finish\n", timeout=5)
                self.assertEqual(process.returncode, 0, stderr)
            self.assertEqual(workspace.output.read_text(), "replacement remains untouched")
            self.assert_measurement(pinned, "success")

    @unittest.skipIf(os.name == "nt", "Unix process-group signals")
    def test_group_sigterm_preserves_child_signal_or_handled_exit(self) -> None:
        for handled_exit in (None, 0, 7):
            with self.subTest(handled_exit=handled_exit), tempfile.TemporaryDirectory() as temp:
                workspace = Workspace(Path(temp), {"scripts": {"build": "owned build"}})
                workspace.environment["SITES_TEST_MODE"] = "term"
                if handled_exit is not None:
                    workspace.environment["SITES_TEST_HANDLED_EXIT"] = str(handled_exit)
                process = self.start_signal_process(workspace)
                try:
                    assert process.stdout is not None
                    self.assertEqual(int(process.stdout.readline()), process.pid)
                    os.killpg(process.pid, signal.SIGTERM)
                    _, stderr = process.communicate(timeout=5)
                    self.assertEqual(
                        process.returncode,
                        -signal.SIGTERM if handled_exit is None else handled_exit,
                        stderr,
                    )
                    outcome = (
                        "cancelled"
                        if handled_exit is None
                        else "success"
                        if handled_exit == 0
                        else "error"
                    )
                    self.assert_measurement(workspace.output, outcome)
                finally:
                    self.stop_signal_process(process)

    @unittest.skipIf(os.name == "nt", "Unix process-group signals")
    def test_group_signals_are_delivered_once_and_preserve_child_cleanup(self) -> None:
        for delivered_signal, exit_code in (
            (signal.SIGINT, 0),
            (signal.SIGINT, 7),
            (signal.SIGTERM, 0),
            (signal.SIGTERM, 7),
        ):
            with (
                self.subTest(delivered_signal=delivered_signal, exit_code=exit_code),
                tempfile.TemporaryDirectory() as temp,
            ):
                workspace = Workspace(Path(temp), {"scripts": {"build": "owned build"}})
                workspace.environment.update(
                    {
                        "SITES_TEST_MODE": "group_signal",
                        "SITES_TEST_SIGNAL": str(int(delivered_signal)),
                        "SITES_TEST_EXIT": str(exit_code),
                    }
                )
                process = self.start_signal_process(workspace)
                try:
                    assert process.stdout is not None
                    self.assertEqual(process.stdout.readline(), "ready\n")
                    # Let the child begin cleanup before the parent handles the
                    # signal, so a duplicate relay cannot hide through coalescing.
                    process.send_signal(signal.SIGSTOP)
                    _, stopped_status = os.waitpid(process.pid, os.WUNTRACED)
                    self.assertTrue(os.WIFSTOPPED(stopped_status))
                    os.killpg(process.pid, delivered_signal)
                    self.assertEqual(process.stdout.readline(), "handling\n")
                    process.send_signal(signal.SIGCONT)
                    stdout, stderr = process.communicate(timeout=5)
                    self.assertEqual(
                        (process.returncode, stdout, stderr), (exit_code, "signals=1\n", "")
                    )
                    self.assert_measurement(
                        workspace.output, "success" if exit_code == 0 else "error"
                    )
                finally:
                    self.stop_signal_process(process)

    def start_signal_process(self, workspace: Workspace) -> subprocess.Popen[str]:
        return subprocess.Popen(
            [NODE or "node", str(PLUGIN_ROOT / "scripts/build-site.mjs")],
            cwd=workspace.project,
            env=workspace.environment,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            start_new_session=True,
        )

    def stop_signal_process(self, process: subprocess.Popen[str]) -> None:
        if process.poll() is None:
            os.killpg(process.pid, signal.SIGKILL)
            process.wait()
        if process.stdout is not None:
            process.stdout.close()
        if process.stderr is not None:
            process.stderr.close()

    def test_package_operation_emits_measurement_without_changing_archive(self) -> None:
        for root in plugin_roots():
            with self.subTest(root=root), tempfile.TemporaryDirectory() as temp:
                directory = Path(temp)
                project = directory / "project with spaces"
                worker = project / "dist/server/index.js"
                worker.parent.mkdir(parents=True)
                worker.write_text("export default { fetch() { return new Response('hello'); } };\n")
                hosting = project / ".openai/hosting.json"
                hosting.parent.mkdir()
                hosting.write_text('{"project_id":"appgprj_contract"}\n')
                archive = directory / "site.tar.gz"
                output = directory / "metrics.json"
                output.touch()
                result = subprocess.run(
                    [
                        NODE or "node",
                        str(root / "scripts/package-site.mjs"),
                        str(project),
                        str(archive),
                    ],
                    cwd=directory,
                    env={**os.environ, METRICS_ENV: str(output), "COPYFILE_DISABLE": "1"},
                    capture_output=True,
                    text=True,
                    timeout=10,
                    check=False,
                )
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(result.stdout, f"{archive}\n")
                self.assert_measurement(output, "success")
                with tarfile.open(archive) as packaged:
                    files = {member.name for member in packaged.getmembers() if member.isfile()}
                    self.assertEqual(files, {"dist/server/index.js", "dist/.openai/hosting.json"})


if __name__ == "__main__":
    unittest.main()
