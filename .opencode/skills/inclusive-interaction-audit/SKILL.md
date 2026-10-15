---
name: inclusive-interaction-audit
description: "Audit an interface for multi-modal interaction support. Chains: keyboard-navigation, touch-target-design, multi-modal-input, gesture-alternatives, feedback-and-status, motion-sensitivity. Use when reviewing an existing interface for interaction accessibility."
---

# Inclusive Interaction Audit

Run a comprehensive audit of how an interface supports diverse input
methods, output channels, and physical abilities.

## Process

### Phase 1: Keyboard Pass
Using **keyboard-navigation**, attempt every task using only the keyboard.
Document: unreachable elements, focus order issues, missing focus
indicators, keyboard traps, and missing skip links.

### Phase 2: Touch and Pointer Pass
Using **touch-target-design**, measure all interactive elements.
Document: undersized targets, insufficient spacing, precision-dependent
interactions, and missing tap alternatives.

### Phase 3: Input Alternatives Check
Using **multi-modal-input** and **gesture-alternatives**, verify that
every interaction has at least two input methods. Document: single-input
dependencies, disabled paste fields, gesture-only features, and
missing alternatives for complex interactions.

### Phase 4: Feedback and Motion Check
Using **feedback-and-status** and **motion-sensitivity**, verify that
all feedback reaches multiple senses and that motion is safe.
Document: colour-only indicators, missing screen reader announcements,
dangerous motion, and prefers-reduced-motion support.

## Output

Present findings as a structured report:

1. **Summary** — overall interaction accessibility rating and critical
   blockers
2. **Input method matrix** — table showing which tasks work with which
   input methods (keyboard, pointer, touch, voice)
3. **Issue list** — each issue with severity, affected input method,
   affected users, and specific fix
4. **Prioritised fixes** — ranked by number of users unblocked

Severity definitions:
- **Critical** — a task cannot be completed with a common input method
- **Major** — a task is significantly harder with certain input methods
- **Minor** — friction exists but the task can be completed
