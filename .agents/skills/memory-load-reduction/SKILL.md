---
name: memory-load-reduction
description: "Design interfaces that minimise demands on working memory. Use when designing multi-step flows, dashboards, comparison tools, forms that span multiple screens, or any interface where users need to remember information across steps or sessions. Triggers on: memory, remember, forget, carry forward, multi-step, users drop off, too many steps, lose their place, context."
---

# Memory Load Reduction

Design systems that remember so users don't have to. Working memory holds
roughly 4 items. Every piece of information the user must carry across
screens, steps, or sessions is a potential failure point.

## Core Principle

If the system can remember it, the user shouldn't have to.

## Design Patterns

### Persistent Context
- Show key selections throughout a multi-step flow
  (chosen product, plan, date visible on every step)
- Display running totals in shopping and financial contexts
- Keep the user's search query visible in results
- In multi-step forms, show a summary sidebar of completed steps

### Forward Carry
- Never re-ask information the system already has
- Pre-fill fields from earlier steps or previous sessions
- Carry context between screens (if the user selected "Business",
  don't ask "Personal or Business?" again)
- Remember user preferences across sessions

### External Memory Aids
- "Compare" features so users don't need to remember options
- Recently viewed and recently used lists
- Copy-to-clipboard for reference numbers and codes
- Print-friendly versions of complex information
- Bookmarking or favouriting for later reference

### Save and Resume
- Auto-save progress in any flow longer than 3 steps
- Allow users to return to where they left off
- Show when progress was last saved
- Send a reminder link for abandoned multi-step tasks
- Never require starting over when a session expires

### Chunked Process
- Break tasks into 3–7 clearly labelled steps
- One decision per step where possible
- Allow forward and backward movement between steps
- Show progress: "Step 2 of 4: Choose your plan"
- Provide a review/summary screen before final submission

## Assessment Questions

1. Does the user need to remember anything from a previous screen?
2. Is any information hidden that the user might need to reference?
3. Can the user leave and come back without losing progress?
4. Are there places where the user needs to transfer information
   between screens manually (e.g., write down a code)?
5. Does the system re-ask for information it already knows?
