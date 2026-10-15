---
name: keyboard-review
description: "Review keyboard navigation and focus management in an existing interface. Chains: keyboard-navigation, feedback-and-status. Use when testing or reviewing keyboard accessibility specifically, before a release, or when users report keyboard issues."
---

# Keyboard Review

A focused review of keyboard accessibility — the single most important
interaction requirement. If keyboard doesn't work, screen readers don't
work, switch devices don't work, and many motor-impaired users are
completely blocked.

## Process

### Step 1: Tab Through Everything
Starting from the browser address bar, press Tab repeatedly through
the entire page. Document:
- **Unreachable elements** — interactive items that Tab skips
- **Wrong order** — focus jumps to unexpected locations
- **Invisible focus** — focus moves but you can't see where it is
- **Keyboard traps** — focus enters a region and can't leave

### Step 2: Test All Components
Using **keyboard-navigation**, test each component type present:
- Menus: Tab to open, Arrow keys to navigate, Escape to close
- Modals: focus trapped inside, Escape to close, focus returns on close
- Tabs: Arrow keys between tabs, Tab into panel content
- Forms: Tab between fields, Enter to submit
- Custom widgets: appropriate keyboard patterns for the role

### Step 3: Test Dynamic Content
When content changes on screen:
- Does focus move to the new content when appropriate?
- Are screen reader users informed of the change?
- When content is removed, does focus move to a logical place?
- Do loading states announce themselves?

Using **feedback-and-status**, verify all dynamic changes are announced
via aria-live regions or focus management.

### Step 4: Check Skip Links and Landmarks
- Is "Skip to main content" present and functional?
- Are ARIA landmarks present (banner, navigation, main, contentinfo)?
- Can a keyboard user bypass repeated navigation efficiently?

## Output

Deliver a keyboard accessibility report:

1. **Pass/fail summary** — can every task be completed by keyboard?
2. **Tab order map** — the actual focus sequence with issues marked
3. **Component results** — pass/fail for each interactive component
4. **Dynamic content results** — focus management for content changes
5. **Fix list** — prioritised by severity (blocker, major, minor)
