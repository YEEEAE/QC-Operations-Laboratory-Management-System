---
name: decision-documentation
description: "Document accessibility decisions and the reasoning behind them so they survive team changes, redesigns, and time. Use when making accessibility tradeoffs, choosing between approaches, or when a decision needs to be recorded for future reference. Triggers on: accessibility decision, why did we, tradeoff, decision record, ADR, architecture decision, accessibility rationale, why is it like this, document the decision, decision log."
---

# Accessibility Decision Documentation

Record accessibility decisions so that future teams understand not
just what was decided, but why — preventing the cycle where good
decisions get reversed because nobody remembers the reasoning.

## Why This Matters

Accessibility barriers accumulate quietly through redesigns, framework
updates, staff turnover, and rushed deadlines. The most common cause
isn't malice or ignorance — it's a new team member changing something
without knowing why it was built that way.

Documentation is the immune system. It protects good decisions from
being undone by people who weren't in the room.

## Decision Record Format

For each significant accessibility decision, record:

### Title
A clear, searchable name.
"Form validation: inline errors instead of summary banner"

### Date and Author
When was this decided and by whom.

### Context
What situation prompted this decision? What were the constraints?
"During user testing, 3 out of 5 participants with cognitive
disabilities missed the error summary banner at the top of the page.
They corrected individual fields but didn't scroll up to see the
banner, so they didn't know the form hadn't submitted."

### Decision
What was decided, specifically.
"All form validation errors will appear inline directly below
the field that needs correction. The error summary banner is
removed. Errors are announced to screen readers via
aria-describedby on each field."

### Alternatives Considered
What other options were evaluated and why they were rejected.
"We considered keeping the summary banner alongside inline errors,
but testing showed it created confusion — users didn't know which
error indication to follow."

### Accessibility Impact
Who benefits from this decision and how.
"Benefits users with cognitive disabilities (don't need to
remember which fields had errors), screen reader users (errors
announced in context), and all users (faster error correction)."

### Risks and Tradeoffs
What might go wrong or what was sacrificed.
"If a form has many errors, the user sees them one at a time as
they move through fields, rather than all at once. For long forms,
this could mean more scrolling. We accept this tradeoff because
contextual errors have higher fix rates in testing."

### Evidence
What research, testing, or standards support this decision.
"User testing session 2024-03-15 (5 participants, 3 with cognitive
disabilities). WCAG 2.2 SC 3.3.1 (Error Identification)."

## When to Document

Document a decision when:
- You chose between two or more accessibility approaches
- You made a tradeoff that reduces accessibility in one area
  to improve it in another
- You decided NOT to fix something (and why)
- You implemented something differently from WCAG techniques
  for a good reason
- A design pattern was chosen specifically for accessibility reasons
- User testing revealed an accessibility insight that changed direction

## Where to Store

- In the codebase alongside the code (preferred — travels with
  the implementation)
- In a shared decision log (wiki, Notion, Confluence)
- In design system documentation (for system-level decisions)
- Never only in someone's head or in a Slack thread

## Assessment Questions

1. Are accessibility decisions documented with reasoning?
2. Can a new team member find out why something was built a
   specific way?
3. Are tradeoffs explicitly recorded?
4. Is documentation stored where it won't be lost?
