# DESIGN.md Stitch Format Reference

Source: https://stitch.withgoogle.com/docs/design-md/format/

## Standard Sections

Every DESIGN.md should follow this 9-section structure:

### 1. Visual Theme & Atmosphere
- Mood, density, design philosophy
- Overall tone (minimal, dense, editorial, cinematic)
- Light vs dark default

### 2. Color Palette & Roles
- Semantic name + hex + functional role
- Background, surface, text, accent, warning, success, error colors
- Dark/light mode variants

### 3. Typography Rules
- Font families (primary, heading, monospace)
- Full hierarchy table (h1–h6, body, caption, code)
- Weights, line-heights, letter-spacing

### 4. Component Stylings
- Buttons (primary, secondary, ghost, destructive) with hover/active/disabled/focus states
- Cards (padding, radius, shadow, border)
- Inputs (text, select, checkbox, radio, toggle) with states
- Navigation (top bar, sidebar, tabs, breadcrumb)
- Modals, dropdowns, tooltips, badges

### 5. Layout Principles
- Spacing scale (4px base, 8/12/16/24/32/48/64)
- Grid system (12-col, max-width, gutter)
- Content width constraints
- Whitespace philosophy

### 6. Depth & Elevation
- Shadow system (sm, md, lg, xl)
- Surface hierarchy (base → raised → overlay)
- Border vs shadow vs backdrop-blur

### 7. Do's and Don'ts
- Design guardrails
- Anti-patterns to avoid
- Brand consistency rules

### 8. Responsive Behavior
- Breakpoints (sm, md, lg, xl)
- Touch targets (44px minimum)
- Collapsing strategy (stack vs hide vs drawer)
- Mobile-first vs desktop-first

### 9. Agent Prompt Guide
- Quick color reference table
- Ready-to-use prompts for generating pages
- Component shorthand

## Files Per Brand

| File | Purpose |
|------|---------|
| `DESIGN.md` | The design system (what agents read) |
| `preview.html` | Visual catalog: color swatches, type scale, buttons, cards |
| `preview-dark.html` | Same catalog with dark surfaces |
