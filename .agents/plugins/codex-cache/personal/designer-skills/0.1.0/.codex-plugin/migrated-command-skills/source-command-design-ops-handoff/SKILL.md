---
name: "source-command-design-ops-handoff"
description: "Run the full handoff workflow — specs, measurements, assets, states, and a QA checklist — and output a developer-ready package."
---

# source-command-design-ops-handoff

Use this skill when the user asks to run the migrated source command `design-ops--handoff`.

## Command Template

# /handoff
Generate a developer handoff package.
## Steps
1. **Visual specs** — Document all measurements and tokens using `handoff-spec` skill.
2. **Interaction specs** — Define states and behaviors using `handoff-spec` skill.
3. **QA criteria** — Create implementation checklist using `design-qa-checklist` skill.
4. **Review readiness** — Verify against review criteria using `design-review-process` skill.
5. **Version** — Tag the design version being handed off using `version-control-strategy` skill.
6. **Package** — Compile all specs, assets, and notes.
## Output
Complete handoff package with visual specs, interaction specs, asset list, QA checklist, and implementation notes.
Consider following up with `/setup-workflow` to establish the ongoing QA process.
