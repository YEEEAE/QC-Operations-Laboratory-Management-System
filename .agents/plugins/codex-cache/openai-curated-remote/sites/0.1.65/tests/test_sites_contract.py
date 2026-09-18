from __future__ import annotations

import json
import os
import re
import subprocess
import tarfile
import tempfile
import unittest
from pathlib import Path

PLUGIN_ROOT = Path(__file__).resolve().parents[1]
TEMPLATES_ROOT = PLUGIN_ROOT / "skills" / "sites-building" / "templates"


def package_scripts() -> list[Path]:
    return [PLUGIN_ROOT / "scripts" / "package-site.mjs"]


def package_site(
    script: Path, project_root: Path, archive: Path
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["node", str(script), str(project_root), str(archive)],
        check=False,
        capture_output=True,
        text=True,
        # Prevent macOS tar from adding AppleDouble metadata files.
        env={**os.environ, "COPYFILE_DISABLE": "1"},
    )


def iter_starter_source_files(starter: Path) -> list[Path]:
    source_suffixes = {".css", ".js", ".jsx", ".mjs", ".ts", ".tsx"}
    generated_root_dirs = {
        ".next",
        ".sites-runtime",
        ".vinext",
        ".vite",
        ".wrangler",
        "coverage",
        "dist",
        "node_modules",
        "out",
        "outputs",
        "work",
    }
    source_paths: list[Path] = []
    for root, directory_names, file_names in os.walk(starter):
        root_path = Path(root)
        if root_path == starter:
            directory_names[:] = [
                name for name in directory_names if name not in generated_root_dirs
            ]
        source_paths.extend(
            root_path / file_name
            for file_name in file_names
            if Path(file_name).suffix in source_suffixes
        )
    return source_paths


class SitesContractTest(unittest.TestCase):
    def test_package_preserves_built_artifact_metadata(self) -> None:
        for script in package_scripts():
            for kind in ("worker", "static"):
                for surface in ("dashboard", "report"):
                    with (
                        self.subTest(script=script, kind=kind, surface=surface),
                        tempfile.TemporaryDirectory() as temp_dir,
                    ):
                        project_root = Path(temp_dir)
                        hosting = project_root / ".openai/hosting.json"
                        built_hosting = project_root / "dist/.openai/hosting.json"
                        hosting.parent.mkdir()
                        built_hosting.parent.mkdir(parents=True)
                        source_config: dict[str, object] = {"project_id": "appgprj_contract"}
                        if kind == "worker":
                            source_config["d1"] = "DB"
                            entrypoint = project_root / "dist/server/index.js"
                        else:
                            source_config["static"] = {"directory": "out"}
                            entrypoint = project_root / "out/index.html"
                        entrypoint.parent.mkdir(parents=True)
                        entrypoint.write_text(
                            "export default {};" if kind == "worker" else "<html>Hello</html>"
                        )
                        attribution = {"surface": surface, "producer": "data-analytics"}
                        # Data adds attribution to the build; source settings can change later.
                        built_config = {**source_config, "artifact_metadata": attribution}
                        hosting.write_text(json.dumps(source_config))
                        built_hosting.write_text(json.dumps(built_config))
                        original_files = [hosting.read_bytes(), built_hosting.read_bytes()]
                        archive = project_root / "site.tar.gz"

                        result = package_site(script, project_root, archive)

                        self.assertEqual(result.returncode, 0, result.stderr)
                        with tarfile.open(archive) as packaged:
                            metadata = packaged.extractfile("dist/.openai/hosting.json")
                            assert metadata is not None
                            expected = {**source_config, "artifact_metadata": attribution}
                            if kind == "static":
                                expected["static"] = {"directory": "dist"}
                            self.assertEqual(json.load(metadata), expected)
                        self.assertEqual(
                            [hosting.read_bytes(), built_hosting.read_bytes()], original_files
                        )

    def test_package_rejects_conflicting_artifact_metadata(self) -> None:
        for script in package_scripts():
            with self.subTest(script=script), tempfile.TemporaryDirectory() as temp_dir:
                project_root = Path(temp_dir)
                hosting = project_root / ".openai/hosting.json"
                built_hosting = project_root / "dist/.openai/hosting.json"
                worker = project_root / "dist/server/index.js"
                hosting.parent.mkdir()
                built_hosting.parent.mkdir(parents=True)
                worker.parent.mkdir()
                worker.write_text("export default {};")
                for target, surface in ((hosting, "report"), (built_hosting, "dashboard")):
                    target.write_text(
                        json.dumps(
                            {
                                "project_id": "appgprj_contract",
                                "artifact_metadata": {
                                    "surface": surface,
                                    "producer": "data-analytics",
                                },
                            }
                        )
                    )
                archive = project_root / "site.tar.gz"

                result = package_site(script, project_root, archive)

                self.assertNotEqual(result.returncode, 0)
                self.assertIn("Conflicting artifact_metadata", result.stderr)
                self.assertFalse(archive.exists())

    def test_vinext_build_packages_worker_runtime_metadata_and_migrations(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            project_root = Path(temp_dir)
            worker = project_root / "dist" / "server" / "index.js"
            hosting = project_root / ".openai" / "hosting.json"
            migration = project_root / "drizzle" / "0000_init.sql"
            vinext = project_root / "node_modules" / ".bin" / "vinext"
            worker.parent.mkdir(parents=True)
            hosting.parent.mkdir()
            migration.parent.mkdir()
            vinext.parent.mkdir(parents=True)
            worker.write_text(
                'import { env } from "cloudflare:workers";\n'
                "export default { async fetch() { return new Response(String(Boolean(env))); } };\n"
            )
            config = {"d1": "DB"}
            hosting.write_text(json.dumps(config))
            migration.write_text("CREATE TABLE items (id INTEGER PRIMARY KEY);\n")
            vinext.write_text('#!/bin/sh\n[ "$1" = "build" ]\n')
            vinext.chmod(0o755)

            build = subprocess.run(
                [
                    "bash",
                    str(TEMPLATES_ROOT / "vinext-starter" / "scripts" / "build-verified.sh"),
                ],
                cwd=project_root,
                env={
                    **os.environ,
                    "SITES_ENV_READY": "1",
                    "SITES_PROJECT_ROOT": str(project_root),
                },
                check=False,
                capture_output=True,
                text=True,
            )
            self.assertEqual(build.returncode, 0, build.stderr)

            # Sites assigns the project identity after the validated build.
            built_hosting = project_root / "dist" / ".openai" / "hosting.json"
            built_hosting.parent.mkdir()
            built_hosting.write_text(hosting.read_text())
            config["project_id"] = "appgprj_contract"
            hosting.write_text(json.dumps(config))

            for index, script in enumerate(package_scripts()):
                with self.subTest(script=script):
                    archive = project_root / f"site-{index}.tar.gz"
                    package = package_site(script, project_root, archive)
                    self.assertEqual(package.returncode, 0, package.stderr)
                    with tarfile.open(archive) as packaged:
                        for archive_path, source in (
                            ("dist/server/index.js", worker),
                            ("dist/.openai/drizzle/0000_init.sql", migration),
                        ):
                            contents = packaged.extractfile(archive_path)
                            assert contents is not None
                            self.assertEqual(contents.read(), source.read_bytes())
                        metadata = packaged.extractfile("dist/.openai/hosting.json")
                        assert metadata is not None
                        self.assertEqual(json.load(metadata), config)

    def test_vinext_starter_defaults_to_system_fonts(self) -> None:
        starter = TEMPLATES_ROOT / "vinext-starter"
        layout = (starter / "app" / "layout.tsx").read_text()
        globals_css = (starter / "app" / "globals.css").read_text()

        for source_path in iter_starter_source_files(starter):
            source = source_path.read_text()
            with self.subTest(path=source_path.relative_to(starter)):
                self.assertNotIn("next/font/google", source)
                self.assertNotRegex(source, r"fonts\.(?:googleapis|gstatic)\.com")

        self.assertNotIn("font-geist", globals_css)
        self.assertIn('className="antialiased"', layout)
        self.assertIn("--font-sans: Arial, Helvetica, sans-serif;", globals_css)
        self.assertIn("--font-mono: ui-monospace", globals_css)

    def test_vinext_starter_lockfile_supports_offline_cache_seed(self) -> None:
        starter = TEMPLATES_ROOT / "vinext-starter"
        package_lock = json.loads((starter / "package-lock.json").read_text())

        for package_path, metadata in package_lock["packages"].items():
            if (
                not package_path.startswith("node_modules/")
                or metadata.get("link")
                or metadata.get("inBundle")
            ):
                continue

            with self.subTest(package=package_path):
                self.assertTrue(metadata.get("integrity"))
                self.assertTrue(
                    metadata.get("resolved", "").startswith("https://registry.npmjs.org/")
                )

    def test_package_static_build_outputs(self) -> None:
        for script in package_scripts():
            for static_root, unsafe_asset in (
                ("dist", False),
                ("out", False),
                ("dist/client", False),
                ("dist", True),
                (None, False),
            ):
                with (
                    self.subTest(script=script, static_root=static_root, unsafe_asset=unsafe_asset),
                    tempfile.TemporaryDirectory() as temp_dir,
                ):
                    project_root = Path(temp_dir)
                    public = project_root / (static_root or "dist")
                    public.mkdir(parents=True)
                    (public / "index.html").write_text("<html>Hello</html>")
                    (public / "index.js").write_text("document.title = 'Hello';")
                    if unsafe_asset:
                        private_file = project_root / "private.txt"
                        private_file.write_text("not a public asset")
                        (public / "leak.txt").symlink_to(private_file)
                    hosting = project_root / ".openai/hosting.json"
                    hosting.parent.mkdir()
                    config: dict[str, object] = {"project_id": "appgprj_contract"}
                    if static_root is not None:
                        config["static"] = {"directory": static_root}
                    if static_root == "dist/client":
                        server = project_root / "dist/server/index.js"
                        server.parent.mkdir()
                        server.write_text("export default {};")
                    hosting.write_text(json.dumps(config))
                    archive = project_root / "site.tar.gz"

                    result = package_site(script, project_root, archive)

                    if unsafe_asset or static_root is None:
                        self.assertNotEqual(result.returncode, 0)
                        self.assertIn(
                            "symlink" if unsafe_asset else "Missing dist/server/index.js",
                            result.stderr,
                        )
                        self.assertFalse(archive.exists())
                        continue
                    self.assertEqual(result.returncode, 0, result.stderr)
                    with tarfile.open(archive) as packaged:
                        self.assertEqual(
                            {member.name for member in packaged.getmembers() if member.isfile()},
                            {"dist/index.html", "dist/index.js", "dist/.openai/hosting.json"},
                        )
                        metadata = packaged.extractfile("dist/.openai/hosting.json")
                        assert metadata is not None
                        self.assertEqual(json.load(metadata)["static"]["directory"], "dist")

    def test_package_static_build_rejects_runtime_requirements(self) -> None:
        for script in package_scripts():
            for requirement in ("d1", "migrations"):
                with (
                    self.subTest(script=script, requirement=requirement),
                    tempfile.TemporaryDirectory() as temp_dir,
                ):
                    project_root = Path(temp_dir)
                    public = project_root / "dist"
                    public.mkdir()
                    (public / "index.html").write_text("<html>Hello</html>")
                    config: dict[str, object] = {"static": {"directory": "dist"}}
                    if requirement == "d1":
                        config["d1"] = "DB"
                    else:
                        migration = project_root / "drizzle" / "0000_init.sql"
                        migration.parent.mkdir()
                        migration.write_text("CREATE TABLE items (id INTEGER PRIMARY KEY);\n")
                    hosting = project_root / ".openai/hosting.json"
                    hosting.parent.mkdir()
                    hosting.write_text(json.dumps(config))
                    archive = project_root / "site.tar.gz"

                    result = package_site(script, project_root, archive)

                    self.assertNotEqual(result.returncode, 0)
                    self.assertIn("Static builds cannot use runtime bindings", result.stderr)
                    self.assertFalse(archive.exists())

    def test_vinext_starter_vendors_complete_shadcn_ui_catalog(self) -> None:
        starter = TEMPLATES_ROOT / "vinext-starter"
        package = json.loads((starter / "package.json").read_text())
        package_lock_text = (starter / "package-lock.json").read_text()
        package_lock = json.loads(package_lock_text)
        components_config = json.loads((starter / "components.json").read_text())
        globals_css = (starter / "app" / "globals.css").read_text()
        page = (starter / "app" / "page.tsx").read_text()

        self.assertEqual(components_config["style"], "new-york")
        self.assertTrue(components_config["rsc"])
        self.assertEqual(components_config["tailwind"]["css"], "app/globals.css")
        self.assertEqual(components_config["tailwind"]["baseColor"], "neutral")
        self.assertEqual(components_config["aliases"]["ui"], "@/components/ui")
        self.assertEqual(components_config["aliases"]["utils"], "@/lib/utils")
        self.assertEqual(components_config["aliases"]["hooks"], "@/hooks")
        self.assertEqual(components_config["registries"], {})
        self.assertNotIn("socket-firewall-registry", package_lock_text)
        self.assertNotIn(".internal.api.openai.org", package_lock_text)

        expected_dependencies = {
            "@base-ui/react": "^1.7.0",
            "@hookform/resolvers": "^5.7.1",
            "@shadcn/react": "^0.3.0",
            "class-variance-authority": "0.7.1",
            "clsx": "2.1.1",
            "cmdk": "^1.1.1",
            "date-fns": "^4.4.0",
            "embla-carousel-react": "^8.6.0",
            "input-otp": "^1.4.2",
            "lucide-react": "^1.31.0",
            "next-themes": "^0.4.6",
            "radix-ui": "^1.6.7",
            "react-day-picker": "^10.0.1",
            "react-hook-form": "^7.85.0",
            "react-resizable-panels": "^4.12.2",
            "recharts": "^3.8.0",
            "sonner": "^2.0.8",
            "tailwind-merge": "3.6.0",
            "vaul": "^1.1.2",
            "zod": "^3.25.76",
        }
        for dependency, version in expected_dependencies.items():
            with self.subTest(dependency=dependency):
                self.assertEqual(package["dependencies"][dependency], version)
        self.assertEqual(package_lock["packages"][""]["dependencies"], package["dependencies"])
        self.assertEqual(
            package_lock["packages"][""]["devDependencies"], package["devDependencies"]
        )
        self.assertNotIn("displayName", package)
        self.assertNotIn("@radix-ui/react-slot", package["dependencies"])
        self.assertNotIn("shadcn", package["dependencies"])

        expected_components = {
            "accordion",
            "alert",
            "alert-dialog",
            "aspect-ratio",
            "attachment",
            "avatar",
            "badge",
            "breadcrumb",
            "bubble",
            "button",
            "button-group",
            "calendar",
            "card",
            "carousel",
            "chart",
            "checkbox",
            "collapsible",
            "combobox",
            "command",
            "context-menu",
            "dialog",
            "direction",
            "drawer",
            "dropdown-menu",
            "empty",
            "field",
            "form",
            "hover-card",
            "input",
            "input-group",
            "input-otp",
            "item",
            "kbd",
            "label",
            "marker",
            "menubar",
            "message",
            "message-scroller",
            "native-select",
            "navigation-menu",
            "pagination",
            "popover",
            "progress",
            "radio-group",
            "resizable",
            "scroll-area",
            "select",
            "separator",
            "sheet",
            "sidebar",
            "skeleton",
            "slider",
            "sonner",
            "spinner",
            "switch",
            "table",
            "tabs",
            "textarea",
            "toggle",
            "toggle-group",
            "tooltip",
        }
        actual_components = {
            component.stem for component in (starter / "components" / "ui").glob("*.tsx")
        }
        self.assertEqual(actual_components, expected_components)
        self.assertTrue((starter / "hooks" / "use-mobile.ts").is_file())
        self.assertTrue((starter / "lib" / "utils.ts").is_file())

        catalog_sources = [
            *(starter / "components" / "ui").glob("*.tsx"),
            starter / "hooks" / "use-mobile.ts",
            starter / "lib" / "utils.ts",
        ]
        declared_packages = {
            *package["dependencies"],
            *package["devDependencies"],
        }
        for source_path in catalog_sources:
            source = source_path.read_text()
            with self.subTest(imports=source_path.relative_to(starter)):
                for ui_import in re.findall(r'from\s+["\']@/components/ui/([^"\']+)["\']', source):
                    self.assertIn(ui_import, expected_components)
                for module_import in re.findall(r'from\s+["\']([^"\']+)["\']', source):
                    if module_import.startswith(("@/", ".")):
                        continue
                    package_name = (
                        "/".join(module_import.split("/")[:2])
                        if module_import.startswith("@")
                        else module_import.split("/", 1)[0]
                    )
                    self.assertIn(package_name, declared_packages)

        for token in (
            "--color-card",
            "--color-primary",
            "--color-secondary",
            "--color-muted",
            "--color-accent",
            "--color-border",
            "--color-input",
            "--color-ring",
            "--radius-lg",
        ):
            with self.subTest(token=token):
                self.assertIn(token, globals_css)

        # The starter page does not adopt the catalog in this layer. Keep its
        # system font, colors, and media-based dark mode intact.
        self.assertNotIn("@/components/ui/", page)
        self.assertFalse((starter / "components" / "site-sections.tsx").exists())
        self.assertIn("--background: #ffffff;", globals_css)
        self.assertIn("--foreground: #171717;", globals_css)
        self.assertIn("--background: #0a0a0a;", globals_css)
        self.assertIn("--foreground: #ededed;", globals_css)
        self.assertIn("@media (prefers-color-scheme: dark)", globals_css)
        self.assertIn("font-family: Arial, Helvetica, sans-serif;", globals_css)
        self.assertNotIn("@custom-variant dark", globals_css)
        self.assertNotIn("--site-font-display", globals_css)

    def test_starter_font_scan_keeps_nested_source_directories(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            starter = Path(temp_dir)
            generated_source = starter / "node_modules" / "dependency.js"
            nested_source = starter / "app" / "work" / "page.tsx"
            generated_source.parent.mkdir()
            nested_source.parent.mkdir(parents=True)
            generated_source.write_text("next/font/google")
            nested_source.write_text("export default function Page() {}")

            scanned_paths = {
                path.relative_to(starter) for path in iter_starter_source_files(starter)
            }

        self.assertNotIn(Path("node_modules/dependency.js"), scanned_paths)
        self.assertIn(Path("app/work/page.tsx"), scanned_paths)


if __name__ == "__main__":
    unittest.main()
