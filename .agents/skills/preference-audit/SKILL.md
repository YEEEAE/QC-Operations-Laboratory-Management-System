---
name: preference-audit
description: "Audit an existing interface for respect of user preferences including motion, contrast, colour scheme, and text scaling. Chains: user-preference-respect, responsive-accessibility, colour-independence. Use when reviewing an existing product for adaptive behaviour."
---

# User Preference Audit

Test whether an existing interface correctly detects and responds to
user preferences — the accessibility settings people have deliberately
chosen.

## Process

### Step 1: Test Motion Preferences
Using **user-preference-respect**, enable prefers-reduced-motion and
navigate the entire interface. Document:
- Animations that continue playing
- Transitions that still slide or fade
- Parallax effects that remain active
- Autoplay video or carousels that don't stop
- Any motion that serves no functional purpose

### Step 2: Test Contrast and Colour Preferences
Enable prefers-contrast (more) and forced-colors mode. Using
**user-preference-respect** and **colour-independence**, document:
- Elements that become invisible or indistinguishable
- Focus indicators that disappear
- Interactive elements that lose their borders
- Colour-only status indicators that become meaningless
- Charts or visualisations that become unreadable

### Step 3: Test Colour Scheme
Switch between light and dark modes. Document:
- Content that becomes illegible in one mode
- Images or icons that don't adapt
- Hardcoded colours that clash with the theme
- Contrast failures specific to one mode

### Step 4: Test Text Scaling and Zoom
Using **responsive-accessibility**, test at 200% browser zoom
and with system font size at maximum. Document:
- Text that overflows or gets clipped
- Layouts that break or overlap
- Horizontal scrolling that appears
- Fixed-height containers that truncate content
- Interactive elements that become unreachable

### Step 5: Test Combinations
Test realistic combinations:
- Dark mode + high contrast + reduced motion
- 200% zoom + large system font
- Forced colours + reduced motion

Document any failures that only appear in combination.

## Output

Deliver an audit report:

1. **Summary** — which preferences are respected, which are ignored
2. **Preference-by-preference findings** — specific failures for each
3. **Combination failures** — issues that appear only when multiple
   preferences are active
4. **Fix list** — prioritised by severity and number of users affected

Severity definitions:
- **Critical** — preference is completely ignored, causing harm or
  blocking access
- **Major** — preference is partially respected, significant gaps remain
- **Minor** — preference is mostly respected, edge cases need fixing
