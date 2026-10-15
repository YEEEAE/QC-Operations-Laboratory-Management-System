---
name: responsive-review
description: "Review responsive and flexible layout for accessibility across devices, zoom levels, and orientations. Chains: responsive-accessibility, flexible-typography, information-density. Use when testing an existing interface across screen sizes and zoom levels for accessibility."
---

# Responsive Accessibility Review

Test whether an interface maintains accessibility across the full
range of screen sizes, zoom levels, and orientations that real
users encounter.

## Process

### Step 1: Viewport Testing
Test the interface at these viewport widths:
- 320px (small mobile)
- 375px (standard mobile)
- 768px (tablet)
- 1024px (small desktop / tablet landscape)
- 1280px (standard desktop)
- 1440px+ (large desktop)

At each viewport, using **responsive-accessibility**, document:
- Content that overflows or is hidden
- Interactive elements that are unreachable
- Touch targets below 44×44px on touch viewports
- Navigation that doesn't adapt
- Functionality that disappears entirely

### Step 2: Zoom Testing
At 1280px viewport, test at:
- 100% (baseline)
- 150% (common for low vision users)
- 200% (WCAG requirement)

Document:
- Horizontal scrolling that appears
- Text that overflows containers
- Overlapping elements
- Sticky headers that consume excessive space
- Modals or tooltips that go off-screen

### Step 3: Typography Scaling
Using **flexible-typography**, test with system font size at maximum.
Document:
- Text that doesn't scale
- Containers that clip or truncate text
- Layout that breaks when text grows
- Fixed-height elements that don't expand

### Step 4: Orientation Testing
Test in both portrait and landscape. Document:
- Content that only works in one orientation
- Orientation lock that prevents rotation
- Layout that breaks or wastes space in one orientation

### Step 5: Density Check
Using **information-density**, at each viewport verify:
- Is the default density appropriate for the device?
- Can users adjust density?
- Does compact density maintain minimum touch targets?
- Does spacious density work without excessive scrolling?

## Output

Deliver a responsive accessibility report:

1. **Viewport matrix** — pass/fail at each viewport width for
   core tasks
2. **Zoom results** — issues at 150% and 200%
3. **Typography results** — text scaling failures
4. **Orientation results** — portrait/landscape issues
5. **Fix list** — prioritised by severity, grouped by:
   - Fixes that affect all viewports
   - Fixes specific to mobile
   - Fixes specific to zoom
