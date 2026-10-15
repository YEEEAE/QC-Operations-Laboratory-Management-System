---
name: tradeoff-analysis
description: "Analyse accessibility tradeoffs when a design decision improves accessibility for one group but may affect another, or when accessibility competes with other requirements. Use when facing conflicting accessibility needs, business pressure to reduce accessibility scope, or technical constraints that limit accessibility options. Triggers on: tradeoff, trade-off, compromise, accessibility vs performance, accessibility vs deadline, conflicting needs, which users, who do we prioritise, can't do both, accessibility scope."
---

# Accessibility Tradeoff Analysis

Analyse accessibility tradeoffs rigorously — because "we can't do
everything" is often true, and the quality of the tradeoff decision
determines who gets included and who gets excluded.

## When Tradeoffs Happen

### Conflicting User Needs
- Autoplay captions help deaf users but moving text distracts
  users with ADHD
- Simplified language helps cognitive accessibility but may
  feel patronising to some users
- High contrast helps low vision but can cause eye strain for
  some migraine conditions

### Accessibility vs Other Requirements
- Performance: rich accessibility features vs page load speed
- Deadline: full accessibility vs shipping on time
- Complexity: accessible custom component vs simpler but
  less accessible native element
- Cost: comprehensive testing vs budget constraints

### Partial Implementation
- You can make 80% of the feature accessible now and 20% later
- Which 80% do you choose and who does the 20% exclude?

## Analysis Framework

For each tradeoff, work through:

### 1. Who Benefits from Option A?
- Which user groups gain accessibility
- How many users are affected (estimated)
- How severe is the barrier if Option A is not chosen

### 2. Who Benefits from Option B?
- Same analysis for the alternative

### 3. Who Is Harmed by Each Option?
- Which user groups lose accessibility or experience degradation
- How severe is the harm
- Is the harm permanent or temporary (will it be fixed later?)

### 4. What's the Severity Asymmetry?
- A user who CANNOT complete a task (blocked) is more severely
  affected than a user who finds a task HARDER (friction)
- Prioritise removing blockers over reducing friction
- Prioritise permanent disabilities over situational impairments
  (situational users have other options; permanent users may not)

### 5. What's the Reversibility?
- Can this decision be changed later without significant cost?
- If yes: choose the faster option and plan the improvement
- If no: choose the more inclusive option and accept the delay

### 6. What's the Precedent?
- Does this decision set a pattern for future features?
- A shortcut taken once becomes a standard if not documented
- If it sets a bad precedent, the long-term cost exceeds the
  short-term saving

## Tradeoff Documentation

Every tradeoff must be recorded using the decision-documentation
format with these additional fields:

**Who is excluded by this decision:**
Name the specific user groups affected.

**Severity of exclusion:**
Blocked (cannot complete task) vs friction (harder but possible).

**Remediation plan:**
When and how will the excluded users be served.
"Screen reader support for the chart component is deferred to
sprint 14. Workaround: data table below the chart provides the
same information. Tracked in JIRA-4521."

**Review date:**
When will this tradeoff be reassessed.

## Red Lines

Some tradeoffs should never be made:

- Never ship a feature that is completely inaccessible by keyboard
- Never remove existing accessibility to meet a deadline
- Never deprioritise accessibility fixes that block task completion
- Never treat "we'll fix it later" as acceptable without a tracked
  ticket and a deadline

## Assessment Questions

1. Have both sides of the tradeoff been analysed for who benefits
   and who is harmed?
2. Is severity asymmetry considered (blocked vs friction)?
3. Is there a documented remediation plan for excluded users?
4. Has a review date been set?
5. Does this decision set a precedent that needs to be managed?
