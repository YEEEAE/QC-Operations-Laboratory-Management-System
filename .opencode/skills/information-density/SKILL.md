---
name: information-density
description: "Design interfaces where information density can be adjusted to suit different cognitive needs and preferences. Use when designing dashboards, data tables, feeds, inboxes, settings panels, or any interface with variable amounts of content. Triggers on: information density, too dense, too sparse, compact view, comfortable view, spacing, whitespace, data density, content density, crowded, breathing room."
---

# Information Density

Design interfaces that let users control how much information they
see at once — because the right density for a power user scanning
200 rows is the wrong density for someone who needs space to process
each item.

## The Density Spectrum

### Compact
- Minimal spacing, smaller text, more items visible
- Suits: power users, data-heavy tasks, large screens
- Risks: overwhelming for cognitive disabilities, hard to tap on
  touch devices, hard to scan for low vision

### Comfortable (Default)
- Moderate spacing, standard text size, balanced visibility
- Suits: most users in most contexts
- This should be the default — optimise for this first

### Spacious
- Generous spacing, larger text, fewer items visible
- Suits: cognitive disabilities, low vision, touch devices,
  new users, stressful contexts
- Risks: requires more scrolling for experienced users

## Design Patterns

### Density Controls
- Offer 2–3 density options (compact, comfortable, spacious)
- Use clear labels — not just icon toggles
- Apply density change immediately (no page reload)
- Remember the preference across sessions
- Place the control near the content it affects

### What Changes With Density
- Vertical spacing between items
- Horizontal padding within items
- Font size (within accessible range — never below 0.875rem)
- Line height (within accessible range — never below 1.5 for body)
- Amount of metadata shown per item
- Thumbnail or preview sizes
- Number of columns in grid layouts

### What Should NOT Change With Density
- Content meaning — no information should be lost at any density
- Accessibility — every density level must meet WCAG requirements
- Interaction targets — minimum 44×44px on touch regardless of density
- Heading structure — structure stays consistent
- Keyboard navigation — tab order stays logical

### Density by Context
- **Lists and feeds:** control row height and visible metadata
- **Data tables:** control row padding and visible columns
- **Dashboards:** control card size and spacing
- **Inboxes:** control preview length and row height
- **Calendars:** control event detail visibility

## Defaults That Adapt

### Viewport-Based Defaults
- Large screens (1440px+): comfortable or compact
- Medium screens (768–1439px): comfortable
- Small screens (below 768px): comfortable or spacious
- Touch devices: never default to compact

### Preference-Based Defaults
- If system text size is increased: default to spacious
- If prefers-contrast is active: increase spacing slightly
- New users: default to comfortable
- Let users override all defaults

## Assessment Checklist

- [ ] At least two density options are available
- [ ] Default density is comfortable, not compact
- [ ] No information is lost at any density level
- [ ] Minimum touch targets (44×44px) are maintained at all densities
- [ ] Minimum text size (0.875rem) is maintained at all densities
- [ ] Minimum line height (1.5) is maintained at all densities
- [ ] Density preference is remembered across sessions
- [ ] Density adapts to viewport and system preferences
