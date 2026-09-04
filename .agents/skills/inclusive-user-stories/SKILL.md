---
name: inclusive-user-stories
description: "Write user stories that account for disability and diverse abilities from the start. Use when writing user stories, acceptance criteria, jobs to be done, or requirements. Triggers on: user story, user stories, acceptance criteria, jobs to be done, JTBD, requirements, as a user I want, definition of done, story writing."
---

# Inclusive User Stories

Write user stories where accessibility is part of the acceptance
criteria from the start — not added later as a separate ticket.

## The Problem

Most user stories are written as:
"As a user, I want to filter search results so I can find what I need."

This assumes a user who can see the filters, click small targets,
read the labels, and process the results visually. It silently
excludes anyone who interacts differently.

## The Fix

Don't write separate "accessibility stories." Build inclusion into
every story's acceptance criteria.

## Story Structure

### The Story
Keep the standard format:
"As a [user], I want to [action] so that [outcome]."

But be specific about the user when it matters:
- "As a keyboard-only user, I want to filter results using arrow
  keys and Enter so that I can narrow my search without a mouse."
- "As a screen reader user, I want filter changes to be announced
  so that I know the results have updated."

### Inclusive Acceptance Criteria

For every user story, add these checks to the acceptance criteria:

**Keyboard:**
- [ ] Feature is fully operable with keyboard alone
- [ ] Focus order is logical
- [ ] Focus is visible on every interactive element

**Screen reader:**
- [ ] All controls have accessible names
- [ ] State changes are announced
- [ ] Dynamic content updates use aria-live

**Visual:**
- [ ] Information is not conveyed by colour alone
- [ ] Text meets minimum contrast (4.5:1 for normal, 3:1 for large)
- [ ] Content is readable at 200% zoom

**Motor:**
- [ ] Touch targets are at least 44×44px
- [ ] No time-dependent interactions without alternatives
- [ ] No precision-dependent interactions without alternatives

**Cognitive:**
- [ ] Instructions are in plain language
- [ ] Error messages explain what to do, not just what went wrong
- [ ] User can undo or recover from mistakes

## Patterns for Common Stories

### "As a user, I want to complete a form"
Add:
- Labels are visible and associated with fields
- Required fields are indicated visually and programmatically
- Errors appear inline next to the field, not just in a banner
- Form can be completed with keyboard, touch, or voice

### "As a user, I want to view a dashboard"
Add:
- Data is not conveyed by colour alone (patterns, labels, values)
- Charts have text summaries
- Dashboard is navigable by keyboard with logical tab order
- Key metrics are announced to screen readers

### "As a user, I want to receive a notification"
Add:
- Notification is visual AND programmatically announced
- User can control notification preferences
- Notification does not disappear before it can be read
- Notification does not block other interactions

## How to Audit Existing Stories

1. Read each story and ask: who does this exclude?
2. Check acceptance criteria for keyboard, screen reader, visual,
   motor, and cognitive requirements
3. Flag any story that assumes a single input method or sense
4. Add missing criteria — don't create separate stories

## Assessment Questions

1. Do acceptance criteria include keyboard, screen reader, and
   cognitive requirements?
2. Are accessibility criteria part of the definition of done?
3. Has each story been checked for assumptions about ability?
4. Are there any stories that only work for one input method?
