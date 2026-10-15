---
name: responsive-accessibility
description: "Design responsive layouts that maintain accessibility across screen sizes, zoom levels, and orientations. Use when designing responsive interfaces, testing zoom behaviour, or reviewing layouts across devices. Triggers on: responsive, zoom, reflow, breakpoint, mobile accessibility, screen size, orientation, viewport, 200% zoom, text scaling, layout shift, horizontal scroll."
---

# Responsive Accessibility

Responsive design isn't just about screen size — it's about ensuring
accessibility holds at every viewport, zoom level, and orientation.
A layout that works at 1440px but breaks at 200% zoom has failed
the users who need zoom most.

## Core Requirements

### Text Reflow at 200% Zoom
- All content must reflow into a single column at 200% zoom
  with no horizontal scrolling
- This is WCAG 2.1 Level AA (Success Criterion 1.4.10)
- Test by setting browser zoom to 200% at 1280px viewport —
  the result must be usable without horizontal scroll
- Exceptions: data tables, maps, and diagrams may scroll
  horizontally if no information is lost

### Text Scaling to 200%
- All text must remain readable when scaled to 200%
- Text must not be clipped, truncated, or overlap other elements
- Use relative units (rem, em, %) not fixed pixels for text
- Line height and spacing should scale proportionally

### Orientation Freedom
- Content must work in both portrait and landscape orientation
- Never lock orientation unless essential to function
  (a piano app may need landscape; a form never does)
- Some users mount devices in fixed orientations due to
  physical setup — locking orientation can block access entirely

## Design Patterns

### Fluid Layout
- Use flexible grids that adapt rather than fixed breakpoints
  that snap
- Set max-width on content containers for readability
  (45–75 characters per line)
- Let whitespace compress before content reflows
- Avoid fixed-width elements that force horizontal scroll

### Content Priority
- Define what's essential at each breakpoint
- On small screens: show core content, provide access to rest
- Don't hide critical functionality behind "desktop only" features
- Navigation should adapt (hamburger menu is fine) but all
  destinations must remain accessible

### Touch and Pointer Adaptation
- At small viewports: increase touch targets to 48px minimum
- At large viewports: pointer-friendly sizes are acceptable
  (24px minimum)
- Detect pointer type with `@media (pointer: coarse)` for
  touch-first sizing
- Spacing between targets should increase on touch devices

### Zoom-Safe Patterns
- Sticky headers must not consume excessive vertical space at zoom
  (a header that takes 30% of the viewport at 200% zoom is a barrier)
- Fixed-position elements must be tested at 200% zoom
- Tooltips and popovers must remain visible and reachable at zoom
- Modal dialogs must be scrollable if content exceeds viewport at zoom

## Testing Protocol

1. Test at 100%, 150%, and 200% browser zoom on a 1280px viewport
2. Test at 320px viewport width (mobile equivalent)
3. Test in both portrait and landscape orientation
4. Test with system font size set to largest option
5. At each test point verify: no horizontal scroll, no clipped text,
   no overlapping elements, all interactions functional

## Assessment Checklist

- [ ] Content reflows at 200% zoom without horizontal scrolling
- [ ] Text remains readable at 200% scaling
- [ ] Both orientations are supported
- [ ] Touch targets increase at small viewports
- [ ] Sticky/fixed elements don't dominate the viewport at zoom
- [ ] No functionality is lost at any supported viewport size
- [ ] All text uses relative units
