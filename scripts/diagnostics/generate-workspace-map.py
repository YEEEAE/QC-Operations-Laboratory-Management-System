#!/usr/bin/env python3
"""Generate path-level workspace inventories behind the short root routers."""

from __future__ import annotations

import argparse
import re
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "workspace-map"
AREAS = ("PRODUCT", "ENGINEERING", "DATA", "OPERATIONS", "VERIFICATION", "TOOLING")
INVENTORIES = {area: f"workspace-map/{area}.md" for area in AREAS}
PRODUCT_DOCS = {
    "BUSINESS-RULES", "COPY-GLOSSARY", "COPY-INVENTORY", "DESIGN-SYSTEM",
    "DOCUMENTATION-INVENTORY", "DOMAIN-MAP", "GAP-RISK-PRIORITY-MATRIX",
    "PERMISSION-MATRIX", "PRODUCT-ANALYTICS-MEASUREMENT-PLAN",
    "QC-SYSTEM-DESIGN-CONSTITUTION", "REJECT-REPORTS", "REQUIREMENTS-TRACEABILITY",
    "ROLE-MATRIX", "ROLE-OPERATING-GUIDES", "ROUTE-MANIFEST-SPECIFICATION",
    "ROUTE-MATRIX", "STATE-MACHINES", "SYSTEM-INVARIANTS", "UI-UX-SPECIFICATION",
    "UX-WRITING-GUIDE",
}
DATA_DOCS = {
    "DATA-DICTIONARY", "DATA-GOVERNANCE-REGISTER-032", "DATA-MODEL",
    "DATABASE-ARCHITECTURE", "FIRST-USE-DATA-MANIFEST", "MASTER-DATA-STARTING-DATA",
}
VERIFICATION_DOCS = {
    "REQUIREMENTS-RECONCILIATION", "RISK-REGISTER", "UAT-ACCEPTANCE-PLAN",
}
ENGINEERING_DOCS = {
    "ARCHITECTURE-SPECIFICATION", "ERROR-ARCHITECTURE", "EXTENDING-THE-SYSTEM",
    "SECURITY-ARCHITECTURE", "THREAT-MODEL-030",
}


def included(path: str) -> bool:
    """Leave out tests and ignored machine output; Git handles ignored paths."""
    name = Path(path).name
    return not (
        path.startswith(("tests/", ".playwright-mcp/", "scripts/verification/", "scripts/performance/", "scripts/uat/", "scripts/requirements/", "scripts/architecture/"))
        or "/__pycache__/" in path
        or path.endswith(".pyc")
        or "/tests/" in path
        or "/fixtures/" in path
        or re.search(r"(?:^|[./_-])(?:test|spec|fixture)(?:[./_-]|$)", name, re.I)
        or path in {"playwright.config.ts", "vitest.config.ts", "Documents/TESTING.md", "Documents/TESTING-STRATEGY.md"}
    )


def area_for(path: str) -> str:
    if path.startswith("Documents/"):
        stem = Path(path).stem
        if stem in PRODUCT_DOCS:
            return "PRODUCT"
        if stem in DATA_DOCS:
            return "DATA"
        if stem in VERIFICATION_DOCS:
            return "VERIFICATION"
        if stem in ENGINEERING_DOCS:
            return "ENGINEERING"
        return "OPERATIONS"
    if path.startswith(("db/", "scripts/db/", "scripts/data/")):
        return "DATA"
    if path.startswith(("src/", "public/")):
        return "ENGINEERING"
    if path.startswith("audit/") or path.startswith(("scripts/requirements/", "scripts/verification/", "scripts/performance/", "scripts/architecture/")):
        return "VERIFICATION"
    if path.startswith("scripts/") or path.startswith(".github/"):
        return "OPERATIONS"
    if path.startswith((".agents/", ".opencode/", ".codex/", ".claude/", ".clinerules/")):
        return "TOOLING"
    if path.startswith("docs/") or path in {"README.md", "knowledge.md"}:
        return "PRODUCT"
    if path in {"render.yaml", ".env.example", "pnpm-lock.yaml", "pnpm-workspace.yaml", "package.json", ".nvmrc", ".node-version"}:
        return "OPERATIONS"
    if path in {"astro.config.mjs", "tsconfig.json", "eslint.config.mjs", ".prettierrc.json"}:
        return "ENGINEERING"
    if path in {"PRODUCT.md", "ENGINEERING.md", "DATA.md", "OPERATIONS.md", "VERIFICATION.md", "TOOLING.md", "AGENTS.md"}:
        return "TOOLING"
    if path.startswith("workspace-map/"):
        return "TOOLING"
    return "TOOLING"


def purpose(path: str) -> str:
    parts = Path(path).parts
    name = Path(path).name
    label = re.sub(r"[-_.]+", " ", Path(path).stem).strip()
    label = re.sub(r"\s+", " ", label)
    if name == "SKILL.md" and "skills" in parts:
        return f"agent skill instructions for {parts[parts.index('skills') + 1]}"
    if "skills" in parts:
        return f"{name} support file for the {parts[parts.index('skills') + 1]} skill"
    if path.startswith("src/modules/"):
        return f"{parts[2]} module {parts[3] if len(parts) > 4 else 'documentation'}: {label}"
    if path.startswith("src/pages/"):
        return f"application route: {label}"
    if path.startswith("src/actions/"):
        return f"server action entry point: {label}"
    if path.startswith("src/ui/"):
        return f"interface component or style: {label}"
    if path.startswith("src/shared/"):
        return f"shared {parts[2]} support: {label}"
    if path.startswith("src/config/"):
        return f"runtime configuration: {label}"
    if path.startswith("db/migrations/"):
        return f"database migration: {label}"
    if path.startswith("db/seeds/"):
        return f"database seed source: {label}"
    if path.startswith("scripts/"):
        return f"{parts[1]} command: {label}"
    if path.startswith("audit/"):
        return f"dated audit record or evidence: {label}"
    if path.startswith("Documents/"):
        return f"project document: {label}"
    if path.startswith("public/"):
        return f"public static asset: {name}"
    if path.startswith(".agents/mind/"):
        return f"agent project memory: {label}"
    if path.startswith("workspace-map/"):
        return f"generated {label.lower()} file inventory"
    if path.startswith(".agents/") or path.startswith(".opencode/"):
        return f"agent tooling file: {label}"
    if path.startswith(".github/"):
        return f"GitHub configuration: {label}"
    if path.endswith((".png", ".jpg", ".jpeg", ".webp", ".svg", ".mp4", ".woff2", ".wasm")):
        return f"workspace media or binary asset: {name}"
    return f"workspace {('documentation' if path.endswith('.md') else 'file')}: {label}"


def all_paths() -> list[str]:
    result = subprocess.run(
        ["git", "ls-files", "-z", "--cached", "--others", "--exclude-standard"],
        cwd=ROOT, check=True, capture_output=True,
    )
    paths = {p.decode() for p in result.stdout.split(b"\0") if p}
    paths.update(INVENTORIES.values())
    paths.add("TOOLING.md")
    return sorted(p for p in paths if included(p) and ((ROOT / p).is_file() or p in INVENTORIES.values()))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="fail if inventories are stale")
    args = parser.parse_args()
    groups: dict[str, list[str]] = {area: [] for area in AREAS}
    for path in all_paths():
        groups[area_for(path)].append(path)
    stale = []
    for area, paths in groups.items():
        target = OUT / f"{area}.md"
        content = (
            f"# {area.title()} files\n\n"
            "Generated by `scripts/diagnostics/generate-workspace-map.py`. "
            "Git-tracked and project-local untracked files are listed; tests, test fixtures, "
            "browser captures, and ignored build/dependency output are excluded.\n\n"
            + "\n".join(
                f"- `{path.replace(chr(13), r'\r').replace(chr(10), r'\n')}` — {purpose(path)}."
                for path in paths
            )
            + "\n"
        )
        if args.check:
            if not target.exists() or target.read_text() != content:
                stale.append(str(target.relative_to(ROOT)))
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content)
        print(f"{area}: {len(paths)} files")
    if stale:
        parser.exit(1, "Stale inventories: " + ", ".join(stale) + "\n")


if __name__ == "__main__":
    main()
