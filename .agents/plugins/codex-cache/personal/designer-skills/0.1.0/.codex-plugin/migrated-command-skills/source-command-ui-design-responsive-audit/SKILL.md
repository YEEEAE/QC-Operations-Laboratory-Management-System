---
name: "source-command-ui-design-responsive-audit"
description: "Audit a design's responsive behaviour across breakpoints — layout, touch targets, and content reflow."
---

# source-command-ui-design-responsive-audit

Use this skill when the user asks to run the migrated source command `ui-design--responsive-audit`.

## Command Template

# /responsive-audit
Audit a design for responsive behavior.
## Steps
1. **Breakpoints** — Review behavior at each breakpoint using `responsive-design` skill.
2. **Grid** — Check layout grid compliance using `layout-grid` skill.
3. **Typography** — Verify type scaling using `typography-scale` skill.
4. **Spacing** — Check spacing consistency using `spacing-system` skill.
5. **Hierarchy** — Verify hierarchy holds at all sizes using `visual-hierarchy` skill.
6. **Touch targets** — Verify minimum sizes for touch using `responsive-design` skill.
7. **Report** — Document findings with recommendations.
## Output
Responsive audit report with findings per breakpoint, compliance status, and remediation recommendations.
Consider following up with `/design-screen` to redesign problem areas.
