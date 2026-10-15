---
name: keyboard-navigation
description: "Design keyboard navigation and focus management for users who cannot or prefer not to use a mouse or touch screen. Use when designing any interactive interface — forms, menus, modals, tabs, carousels, drag-and-drop, data tables, or custom components. Triggers on: keyboard, focus, tab order, focus trap, skip link, arrow keys, keyboard shortcut, can't use mouse, motor disability, switch access, focus indicator, focus ring."
---

# Keyboard Navigation

Design interactions so that every task can be completed using only a
keyboard. This is non-negotiable — it's the foundation of all
interaction accessibility.

## Who This Is For

- People with motor disabilities who cannot use a mouse
- People using switch devices or mouth sticks
- Screen reader users (keyboard is their primary input)
- Power users who prefer keyboard for speed
- Anyone with a temporarily injured hand or arm

## Core Principles

### Everything Must Be Reachable
- Every interactive element must be focusable via Tab key
- Focus order must follow the visual reading order (left to right,
  top to bottom in LTR languages)
- No element should be reachable only by mouse hover or click
- Custom components need explicit tabindex and keyboard handlers

### Focus Must Be Visible
- Focus indicator must be visible on every interactive element
- Minimum: 2px solid outline with 3:1 contrast against background
- Never use outline: none or outline: 0 without a visible replacement
- Focus style should be consistent across the entire interface
- Test: can you always see which element is focused?

### Focus Must Be Managed
- When a modal opens, move focus into the modal
- When a modal closes, return focus to the element that opened it
- When content is deleted, move focus to a logical next element
- When a page section updates dynamically, manage focus appropriately
- Never trap focus unintentionally (only trap inside open modals)

## Keyboard Patterns by Component

### Navigation Menus
- Tab moves between top-level items
- Arrow keys move within a dropdown
- Enter/Space activates a menu item
- Escape closes an open dropdown and returns focus to trigger

### Tabs
- Tab moves to the active tab panel, not through all tabs
- Arrow keys move between tabs
- Enter/Space activates a tab (if not automatic)

### Modals / Dialogs
- Focus moves to first focusable element inside modal on open
- Tab cycles only within the modal (focus trap)
- Escape closes the modal
- Focus returns to trigger element on close

### Forms
- Tab moves between fields in logical order
- Error messages are focusable or announced
- Submit via Enter key on the last field or a visible button
- Required field indicators are not conveyed by colour alone

### Drag and Drop
- Always provide a keyboard alternative (move up/down buttons,
  select-and-place, or arrow key reordering)
- Announce the current position and available actions

### Carousels / Sliders
- Arrow keys move between items
- Provide visible previous/next buttons
- Pause autoplay on focus or hover
- Announce current position ("Item 2 of 5")

## Skip Links

Every page should have a "Skip to main content" link as the first
focusable element. This lets keyboard users bypass repeated navigation.

- Visible on focus (can be visually hidden until focused)
- Links to the main content area via an anchor
- Consider additional skip links for long pages ("Skip to search",
  "Skip to footer")

## Assessment Checklist

- [ ] Every interactive element is reachable via Tab
- [ ] Focus order matches visual order
- [ ] Focus indicator is visible on every element (2px, 3:1 contrast)
- [ ] Modals trap focus and return it on close
- [ ] All custom components have keyboard handlers
- [ ] Drag-and-drop has a keyboard alternative
- [ ] Skip link is present and functional
- [ ] No keyboard traps exist anywhere in the interface
- [ ] Dynamic content changes manage focus appropriately
