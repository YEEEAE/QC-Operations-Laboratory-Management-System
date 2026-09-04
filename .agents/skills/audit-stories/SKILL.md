---
name: audit-stories
description: "Audit user stories for disability inclusion. Chains: inclusive-user-stories, edge-case-identification. Use when reviewing an existing backlog, sprint, or set of user stories to check whether they account for diverse abilities."
---

# Audit User Stories for Inclusion

Review an existing set of user stories and identify where disability
and diverse abilities have been overlooked — then add the missing
criteria without creating separate accessibility tickets.

## Process

### Step 1: Gather Stories
Collect the user stories to audit. This could be a sprint backlog,
a feature's full story set, or an epic.

### Step 2: Check Each Story
Using **inclusive-user-stories**, review each story's acceptance
criteria for:
- Keyboard operability
- Screen reader support
- Visual accessibility (contrast, colour independence, zoom)
- Motor accessibility (target size, timing, precision)
- Cognitive accessibility (plain language, error recovery, undo)

Flag any story where one or more of these are missing.

### Step 3: Check for Assumption Bias
Using **edge-case-identification**, for each story ask:
- What input method does this assume?
- What sensory ability does this assume?
- What cognitive capacity does this assume?
- What context does this assume?
- What "edge cases" have been dismissed that are daily reality
  for some users?

### Step 4: Add Missing Criteria
For each flagged story, write the specific acceptance criteria that
need to be added. Don't create separate stories — add directly to
the existing ones.

## Output

Deliver an audit report:

1. **Summary** — number of stories reviewed, number with gaps,
   most common gap type
2. **Story-by-story findings** — each story with its missing
   criteria listed
3. **Added criteria** — the specific acceptance criteria to add
   to each story, ready to paste into the backlog
4. **Patterns** — recurring gaps that suggest a systemic issue
   (e.g., "no story in this sprint mentions keyboard access")
