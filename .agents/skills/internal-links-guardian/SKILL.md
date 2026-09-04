---
name: internal-links-guardian
description: Guard internal links, local paths, imports, exports, asset references, and project file paths across BrightAI after structural code or content changes. Use when Codex creates, moves, renames, or deletes files or folders, updates imports or exports, changes href/src/action values, edits Markdown links, or touches path-related config such as `tsconfig`, `jsconfig`, `vite.config`, `next.config`, and `package.json`. Trigger on requests about broken links, broken imports, missing assets, path errors, internal references, الروابط الداخلية, المسارات, الاستيراد, التصدير, نقل الملفات, إعادة التسمية, أو إصلاح المراجع المكسورة.
---

# Internal Links Guardian

## Overview

Run an internal-reference audit after any structural change that could break local links or paths. Start with the project's existing audit scripts, then extend the review manually when the change touches file types or config paths that the scripts do not fully cover.

Use this skill as a recommended BrightAI validation step after structural or path-related changes. If the same task also changes user-facing content, run this skill first to stabilize paths and references, then run `intelligent-content-reviewer-validator` to verify wording, structure, and content integrity after the links are stable.

## Activation Rules

Use this skill when any of the following happens:

- Create a file or directory.
- Move, rename, or delete a file or directory.
- Change `import`, `require`, `export from`, or `dynamic import`.
- Change `href`, `src`, `action`, `poster`, `url()`, or asset references.
- Edit Markdown, HTML, or template files with local references.
- Change path or alias configuration in `tsconfig`, `jsconfig`, `vite.config`, `next.config`, `webpack`, or `package.json`.
- Change redirects, route mappings, or public path structure.

## Workflow

### 1. Define the Trigger and Scope

- Summarize the triggering change in one line.
- Read the affected files first.
- Decide whether the change is limited to HTML/CSS/JS assets or also touches `ts`, `tsx`, `jsx`, `md`, `mdx`, `json`, `yaml`, or config files.
- Assume structural changes may leave stale references until verified.

### 2. Run the Project Audit First

Use the project commands before doing manual path review:

```bash
npm run internal-links:audit
```

This command relies on the existing BrightAI scripts:

- `scripts/internal-links-audit.mjs`
- `scripts/fix-internal-links.mjs`
- `scripts/internal-links-common.mjs`

Treat `تقارير للمشروع/` as the default audit output location.

### 3. Expand the Review When Needed

The built-in audit is strong for HTML, CSS, JavaScript, and public asset paths, but it is not a complete substitute for manual review when changes affect:

- `ts`, `tsx`, `jsx`, `md`, `mdx`, `json`, `jsonc`, `yaml`, `yml`, `toml`
- Path-related settings such as `paths`, `baseUrl`, `exports`, `main`, `files`, and `bin`
- Components or pages that depend on `Link`, `router.push`, `redirect`, or Markdown cross-references

For those cases:

- Use `rg` to inspect affected references first.
- Read the destination files before rewriting a path.
- Match the local convention for quotes, extensions, alias usage, and folder index imports.
- Ignore generated output such as `node_modules`, `.next`, `dist`, `build`, `coverage`, `.git`, `.vercel`, `.turbo`, and `tmp`.

### 4. Classify Findings Before Fixing

Use these issue types:

- `MISSING_FILE`
- `WRONG_PATH`
- `CASE_MISMATCH`
- `MISSING_EXTENSION`
- `STALE_ALIAS`
- `BROKEN_ANCHOR`
- `MOVED_FILE`
- `DELETED_FILE`
- `WRONG_DIRECTORY`
- `CIRCULAR_REFERENCE`

If the classification is unclear, escalate to manual review instead of guessing.

### 5. Fix Only Safe Cases

Apply automatic fixes only when confidence is high, for example:

- The project audit already suggests a clear replacement.
- The target file exists in one obvious location.
- The problem is a simple relative-path shift such as `../` versus `./`.
- The issue is only casing.
- A broken anchor has one strong replacement candidate.

Apply safe fixes with:

```bash
npm run internal-links:fix
```

Then run the audit again immediately:

```bash
npm run internal-links:audit
```

### 6. Safety Rules

- Never create a new file just to satisfy a broken reference.
- Never delete a file as part of the fix.
- Never edit `node_modules` or generated output.
- Preserve the path style already used in the file.
- Do not auto-fix `CIRCULAR_REFERENCE`; describe the cycle and propose the break point.
- If confidence is not high, leave the case for manual review.

## Convention Detection

Before changing a path, inspect nearby files and determine:

- Whether the area prefers alias paths or relative paths.
- Whether extensions are included or omitted.
- Whether folder imports use `./folder` or `./folder/index`.
- Whether the file uses single or double quotes.
- Whether public routes prefer trailing slashes.
- Which file naming style is in use: `kebab-case`, `camelCase`, `PascalCase`, or `snake_case`.

Only then update the reference while preserving that convention.

## Approved Commands

```bash
npm run internal-links:audit
npm run internal-links:fix
node scripts/internal-links-audit-no-aimais.mjs
node scripts/audit-no-ai-mais.mjs
```

Use the direct `node` commands only for targeted audits or special exclusions. Otherwise start with the `npm` scripts.

## Reference Files

- Read `references/coverage-and-escalation.md` when the task touches file types, routers, aliases, or config paths that may need manual validation beyond the default scripts.
- Read `references/report-template.md` when you need a fast, consistent `INTERNAL LINKS SCAN REPORT` structure during review or repair work.

## Output Format

After each audit or repair cycle, return this exact structure:

```text
=== INTERNAL LINKS SCAN REPORT ===
Trigger: [what caused this scan]
Files Scanned: [number]
References Checked: [number]
Issues Found: [number]
Issues Fixed: [number]
Issues Requiring Manual Review: [number]

--- FIXED ---
[source_file:line] → [type]: [old_path] → [new_path]

--- NEEDS MANUAL REVIEW ---
[source_file:line] → [type]: [description of issue]

--- WARNINGS ---
[non-breaking issues, risky assumptions, convention mismatches]
=== END REPORT ===
```

If a section has no entries, write `None`.

## Operating Reminder

The acceptable target state is zero safely-detectable broken internal references. If ambiguous cases remain, fix the safe ones and report the rest clearly instead of forcing speculative edits.

## BrightAI Integration

Within BrightAI, use this skill after:

- Adding, removing, moving, or renaming files and directories.
- Editing `import`, `export`, `require`, or dynamic import paths.
- Editing `href`, `src`, `action`, or other local asset references.
- Editing path-related configuration in `package.json`, `tsconfig`, `jsconfig`, `vite.config`, `next.config`, or similar files.
- Editing Markdown or HTML files that connect pages, assets, or anchors together.

When both link integrity and content integrity are affected:

1. Run `internal-links-guardian` first.
2. Repair safe internal-reference issues and re-audit.
3. Run `intelligent-content-reviewer-validator` after the references are stable.

This skill does not auto-run on its own. It becomes effective only when Codex explicitly invokes it during the task workflow.
