---
name: touch-target-design
description: "Design touch targets and pointer interactions that work for people with motor difficulties, tremors, limited dexterity, or who use assistive pointing devices. Use when designing buttons, links, form controls, mobile interfaces, or any clickable/tappable elements. Triggers on: touch target, tap target, button size, too small to tap, fat finger, motor disability, dexterity, tremor, pointer, click area, hit area, mobile buttons."
---

# Touch Target Design

Design interactive elements that are large enough, spaced enough, and
forgiving enough for people with limited precision — whether from
disability, age, environment, or device.

## Minimum Sizes

### Touch (mobile, tablet)
- Minimum: 44×44 CSS pixels (WCAG 2.2 Level AA)
- Recommended: 48×48 CSS pixels (Google Material guidelines)
- For high-stakes or frequent-use targets: 56×56 or larger

### Pointer (desktop)
- Minimum: 24×24 CSS pixels (WCAG 2.2 Level AA)
- Recommended: 32×32 for common actions
- For destructive or irreversible actions: larger targets reduce errors

### Spacing Between Targets
- Minimum: 8px gap between adjacent interactive elements
- Recommended: 12–16px for frequently used elements side by side
- Never place destructive actions (delete) adjacent to common actions
  (save) without spacing or visual separation

## Design Patterns

### Generous Hit Areas
- The tappable area can be larger than the visible element
- Use padding, not just the visual size of the icon or text
- Entire row should be tappable in list items, not just the text
- Link text should be descriptive enough to form a reasonable
  tap target ("Read the full report" not "here")

### Forgiving Interactions
- Don't trigger actions on touch-down — trigger on touch-up
  (this lets users slide away to cancel)
- For destructive actions: require a deliberate second tap or
  confirmation, not a single tap
- Avoid double-tap requirements — they're unreliable for users
  with tremors
- Avoid long-press as the only way to access functionality

### Spacing for Safety
- Separate "confirm" and "cancel" actions with distance or visual weight
- Place destructive actions away from common actions
- Group related actions together, separate unrelated actions
- On mobile: keep primary actions in the thumb zone (bottom half
  of screen)

### Alternatives to Precision
- Provide zoom capability for complex interfaces
- Allow pinch-to-zoom on mobile (never disable it)
- For precise tasks (colour pickers, sliders): provide a text
  input alternative
- Dropdown menus with many items: add search/filter

## Assessment Questions

1. Are all interactive elements at least 44×44px on touch devices?
2. Is there adequate spacing between adjacent targets?
3. Are destructive actions separated from common actions?
4. Can every interaction be completed without precision timing
   or precise pointing?
5. Is there always an alternative to precision-dependent interactions
   like sliders or drag-and-drop?
