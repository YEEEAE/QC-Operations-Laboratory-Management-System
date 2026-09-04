---
name: adaptive-interfaces-specify
description: "Specify adaptive behaviour for an interface. Chains: user-preference-respect, responsive-accessibility, flexible-typography, colour-independence, simplified-views, information-density. Use when designing a new interface and you want to build adaptability in from the start."
---

# Specify Adaptive Behaviour

Define how an interface adapts to diverse user needs — preferences,
screen conditions, and cognitive requirements — as part of the
design specification, not as a retrofit.

## Process

### Step 1: Define Preference Responses
Using **user-preference-respect**, specify how the interface responds
to each system preference:
- prefers-reduced-motion: what changes
- prefers-contrast: what changes
- prefers-color-scheme: what changes
- forced-colors: what changes
- prefers-reduced-transparency: what changes

### Step 2: Define Responsive Behaviour
Using **responsive-accessibility**, specify:
- Breakpoints and what reflows at each
- Behaviour at 200% zoom
- Orientation support
- Touch target sizing at each breakpoint

### Step 3: Define Typography Behaviour
Using **flexible-typography**, specify:
- Type scale with relative units
- Line height and spacing values
- Behaviour when user scales text to 200%
- Dark mode typography adjustments

### Step 4: Define Colour Strategy
Using **colour-independence**, specify:
- How every colour-encoded meaning has a second encoding
- Status indicator design (colour + icon + text)
- Chart and data visualisation colour strategy
- Greyscale test results

### Step 5: Define View Options
Using **simplified-views** and **information-density**, specify:
- What simplified view contains vs full view
- How users toggle between views
- Available density levels
- Default density per viewport and context

## Output

Deliver an adaptive behaviour specification:
1. **Preference response table** — each system preference and the
   interface's response
2. **Responsive behaviour map** — what changes at each breakpoint
   and zoom level
3. **Typography specification** — scale, units, spacing, scaling
   behaviour
4. **Colour independence audit** — every colour-dependent element
   and its second encoding
5. **View and density options** — what's available and how users
   control it
