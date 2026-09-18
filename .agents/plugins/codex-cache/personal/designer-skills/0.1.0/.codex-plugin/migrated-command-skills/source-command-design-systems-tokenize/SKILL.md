---
name: "source-command-design-systems-tokenize"
description: "Extract tokens from an existing design or stylesheet and organise them — naming, structure, and theme mapping."
---

# source-command-design-systems-tokenize

Use this skill when the user asks to run the migrated source command `design-systems--tokenize`.

## Command Template

# /tokenize
Extract hard-coded values and organize into a structured token system.
## Steps
1. **Extract** — Scan for all visual values.
2. **Deduplicate** — Group similar values using `design-token` skill.
3. **Categorize** — Organize by category.
4. **Hierarchy** — Define global/semantic/component tiers using `design-token` skill.
5. **Naming** — Apply conventions using `naming-convention` skill.
6. **Themes** — Map variants using `theming-system` skill.
7. **Document** — Generate reference using `documentation-template` skill.
## Output
Token specification with inventory, hierarchy, theme mapping, and migration guide.
Consider following up with `/audit-system`.
