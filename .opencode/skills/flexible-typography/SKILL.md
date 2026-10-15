---
name: flexible-typography
description: "Design typography systems that adapt to user needs — scaling, spacing, and font preferences. Use when designing type systems, setting font sizes, defining line heights, or reviewing text readability across conditions. Triggers on: typography, font size, line height, letter spacing, word spacing, text scaling, dyslexia font, readable font, type scale, font units, rem, em, px, reading difficulty."
---

# Flexible Typography

Design type systems that flex with the user — scaling smoothly,
spacing generously, and never breaking when someone needs text
larger, more spaced, or in a different font.

## Core Requirements

### Relative Units Always
- Use rem for font sizes (relative to root, user-controllable)
- Use em for spacing that should scale with text
- Never use px for font size — it overrides user preferences
- Base font size: let the browser default (usually 16px) be your
  starting point, don't override it

### Minimum Sizes
- Body text: 1rem minimum (never smaller)
- Small text / captions: 0.875rem minimum
- Labels and UI text: 0.875rem minimum
- If text is essential, it should be readable without zooming

### Line Height
- Body text: 1.5 minimum (WCAG requirement)
- Headings: 1.2–1.3 (tighter is acceptable for large text)
- Line height should scale with font size — use unitless values
  (1.5 not 24px)

### Spacing
- Paragraph spacing: at least 1.5× the font size
- Letter spacing: don't compress below browser default
- Word spacing: don't compress below browser default
- Users must be able to override spacing without breaking layout
  (WCAG 2.1 Level AA, Success Criterion 1.4.12)

## Design Patterns

### Scalable Type Scale
- Define a type scale using relative ratios (1.25, 1.333, 1.5)
- Each step should be perceptibly different
- 4–6 sizes is enough for most interfaces
- Example: 0.875rem, 1rem, 1.25rem, 1.5rem, 2rem, 2.5rem

### User-Override Safe
- Don't set fixed heights on text containers
- Use min-height instead of height for elements containing text
- Let containers grow when text grows
- Test with: 200% text size, 200% zoom, extra letter and word spacing
- If layout breaks at any of these, the CSS needs fixing

### Font Selection
- Prioritise readability over aesthetics
- Sans-serif fonts are generally easier for screen reading
  (but this is preference, not rule — test with your audience)
- Ensure the chosen font has:
  - Clear distinction between similar characters (Il1, 0Oo, rn/m)
  - Consistent x-height
  - Adequate character spacing at default settings
- Provide a font-family stack that degrades gracefully
- Never prevent users from overriding with their preferred font

### Dark Mode Typography
- Reduce font weight slightly in dark mode (light text on dark
  backgrounds appears heavier than dark text on light)
- Ensure contrast meets 4.5:1 minimum in both modes
- Avoid pure white (#fff) on pure black (#000) — the extreme
  contrast causes halation for some users. Use off-white on
  dark grey instead

## Assessment Checklist

- [ ] All font sizes use rem or em, never px
- [ ] Body text is at least 1rem
- [ ] Line height is at least 1.5 for body text
- [ ] Layout survives 200% text scaling without breaking
- [ ] Layout survives user-applied letter and word spacing overrides
- [ ] Text containers use min-height, not fixed height
- [ ] Font has clear character distinction (Il1, 0Oo)
- [ ] Both light and dark modes meet contrast requirements
