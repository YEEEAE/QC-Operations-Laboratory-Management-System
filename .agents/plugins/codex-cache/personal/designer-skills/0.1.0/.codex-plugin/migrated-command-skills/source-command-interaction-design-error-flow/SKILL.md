---
name: "source-command-interaction-design-error-flow"
description: "Design an error flow end to end — prevention, detection, messaging, and recovery paths."
---

# source-command-interaction-design-error-flow

Use this skill when the user asks to run the migrated source command `interaction-design--error-flow`.

## Command Template

# /error-flow
Design complete error handling for a feature.
## Steps
1. **Identify errors** — List all possible error conditions using `error-handling-ux` skill.
2. **Prevention** — Design prevention measures using `error-handling-ux` skill.
3. **State modeling** — Map error states using `state-machine` skill.
4. **Feedback** — Design error communication using `feedback-patterns` skill.
5. **Recovery** — Design recovery paths using `error-handling-ux` skill.
6. **Loading** — Handle timeout and retry states using `loading-states` skill.
## Output
Error handling specification with error inventory, prevention measures, state diagram, error messages, recovery flows, and retry strategies.
Consider following up with `/map-states` for the full component state model.
