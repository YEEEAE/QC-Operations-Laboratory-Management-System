---
name: cognitive-accessibility-review
description: "Run a full cognitive accessibility review of a flow, screen, or interface. Chains: cognitive-load-assessment, plain-language-design, wayfinding-navigation, error-prevention-recovery, focus-attention-design, memory-load-reduction."
---

# Cognitive Accessibility Review

Run a comprehensive cognitive accessibility review. This command chains
six skills into a structured assessment.

## Process

### Phase 1: Context
Identify the interface, flow, or content to review. Establish:
- Who uses this and what cognitive state they're likely in
- What the stakes are (low, medium, high)
- What cognitive demands the task makes

### Phase 2: Cognitive Load Assessment
Using the **cognitive-load-assessment** skill, evaluate each screen or
step across all six dimensions: decisions, memory, new concepts, steps,
reading complexity, and visual complexity.

### Phase 3: Language Review
Using the **plain-language-design** skill, review all user-facing text
for readability, jargon, ambiguity, and action clarity.

### Phase 4: Wayfinding Check
Using the **wayfinding-navigation** skill, verify that users always know
where they are, where they can go, and how to get back.

### Phase 5: Error & Focus Review
Using **error-prevention-recovery** and **focus-attention-design** skills,
review error handling patterns and identify distractions or attention
hazards.

### Phase 6: Memory Load Check
Using the **memory-load-reduction** skill, identify any place where
users must remember information across screens, steps, or sessions.

## Output

Present findings as a structured report:

1. **Executive summary** — overall cognitive accessibility rating and top 3
   issues
2. **Screen-by-screen findings** — table of issues by screen/step with
   severity (critical / major / minor)
3. **Prioritised recommendations** — specific fixes ranked by impact and
   effort
4. **Population impact** — which user groups are most affected by each issue

Severity definitions:
- **Critical** — prevents task completion for users with cognitive disabilities
- **Major** — causes significant difficulty or confusion
- **Minor** — creates friction but doesn't block completion
