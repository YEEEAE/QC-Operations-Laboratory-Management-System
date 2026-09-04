---
name: user-preference-respect
description: "Design interfaces that detect and respond to system-level user preferences. Use when implementing dark mode, reduced motion, high contrast, text scaling, or any user preference that affects how the interface renders. Triggers on: user preference, system preference, prefers-reduced-motion, prefers-contrast, prefers-color-scheme, forced-colors, media query, user settings, system settings, accessibility settings, OS settings."
---

# User Preference Respect

The operating system already knows what the user needs. Your job is
to listen and respond. These preferences exist because people set them
deliberately — ignoring them overrides the user's own accessibility
decision.

## The Preferences

### prefers-reduced-motion
**What it means:** user experiences discomfort or harm from motion.
**What to do:**
- Disable all decorative animation
- Replace slide/fade transitions with instant state changes
- Keep essential motion (loading spinners) but simplify
- Disable parallax, scroll-triggered animation, and auto-advance
- Never override this preference

**How to detect:** `@media (prefers-reduced-motion: reduce)`

### prefers-contrast
**What it means:** user needs stronger visual distinction.
**What to do:**
- Increase contrast beyond WCAG minimums
- Replace subtle shadows and gradients with solid borders
- Make focus indicators bolder and more visible
- Remove transparency and blur effects
- Increase border widths on interactive elements

**How to detect:** `@media (prefers-contrast: more)`

### prefers-color-scheme
**What it means:** user prefers light or dark interface.
**What to do:**
- Provide genuine dark mode (not just inverted colours)
- Ensure all content is legible in both modes
- Test images, charts, icons, and illustrations in both
- Don't use pure black (#000) on dark mode — use dark grey (#1a1a1a)
  for less eye strain
- Remember: dark mode is not just aesthetic — it reduces eye
  fatigue and helps some people with light sensitivity

**How to detect:** `@media (prefers-color-scheme: dark)`

### forced-colors
**What it means:** user has enabled Windows High Contrast or similar.
**What to do:**
- Don't fight the system colour override
- Ensure borders and outlines define interactive elements
  (the system will strip your colours)
- Use transparent borders that become visible in forced-colors mode
- Test that all interactive elements remain distinguishable
- Don't rely on background colour alone to indicate state

**How to detect:** `@media (forced-colors: active)`

### prefers-reduced-transparency
**What it means:** user finds transparent elements hard to read.
**What to do:**
- Replace semi-transparent backgrounds with solid ones
- Remove frosted glass / backdrop blur effects
- Ensure overlays are fully opaque

**How to detect:** `@media (prefers-reduced-transparency: reduce)`

## Implementation Principles

### Progressive Enhancement
- Build the accessible version first
- Add motion, transparency, and visual flourishes as enhancements
- When a preference is detected, you're removing the enhancement,
  not degrading the experience

### Don't Ask — Detect
- Don't make users configure accessibility settings in your app
  when the OS already has the setting
- Detect and respond automatically
- If you offer additional settings, they should layer on top of
  system preferences, not replace them

### Test Every Preference
- Test with each preference enabled individually
- Test with combinations (reduced motion + high contrast + dark mode)
- Verify that the interface is complete and usable in every state
- Automated tests can check that media queries exist —
  manual testing verifies they work

## Assessment Checklist

- [ ] prefers-reduced-motion is detected and all decorative motion stops
- [ ] prefers-contrast is detected and visual contrast increases
- [ ] prefers-color-scheme is detected and theme switches
- [ ] forced-colors mode doesn't break interactive elements
- [ ] Combinations of preferences work together
- [ ] No preference is overridden or ignored
