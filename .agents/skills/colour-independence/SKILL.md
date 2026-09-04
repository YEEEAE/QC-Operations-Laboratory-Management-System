---
name: colour-independence
description: "Design interfaces where colour is never the only way information is communicated. Use when designing status indicators, data visualisations, form validation, alerts, maps, or any content that uses colour to convey meaning. Triggers on: colour blind, color blind, colour alone, color alone, colour vision, color vision, red green, deuteranopia, protanopia, tritanopia, colour coding, status colour, chart colours, accessible colours."
---

# Colour Independence

Design so that every piece of information conveyed by colour is also
conveyed by something else — shape, text, pattern, position, or icon.
8% of men and 0.5% of women have colour vision deficiency. That's
roughly 1 in 12 of your male users.

## Core Principle

Colour can enhance meaning. Colour must never be the only carrier
of meaning.

## Common Failures

### Status Indicators
- Bad: green dot = online, red dot = offline (colour only)
- Good: green dot + "Online" label, red dot + "Offline" label
- Better: green dot with tick + "Online", grey dot with x + "Offline"

### Form Validation
- Bad: red border on invalid fields (colour only)
- Good: red border + error icon + error text message
- The error message does the real work — the colour is reinforcement

### Data Visualisation
- Bad: line chart with 5 coloured lines, legend uses colour swatches
- Good: different line styles (solid, dashed, dotted) + labels +
  distinct colours that work in greyscale
- Good: bar chart with patterns (stripes, dots, solid) alongside colour
- Always test charts in greyscale — can you still read them?

### Links
- Bad: links distinguished from body text only by colour
- Good: links are coloured AND underlined
- The underline is the accessible indicator — colour is the enhancement

### Alerts and Badges
- Bad: red badge = urgent, yellow = warning, green = ok
- Good: red badge + "Urgent" label, yellow + "Warning" label,
  green + "OK" label
- Icons reinforce: ⚠ for warning, ✓ for success, ✕ for error

### Maps and Diagrams
- Bad: regions coloured to show data (choropleth with no labels)
- Good: colours + patterns + values displayed on each region
- Good: interactive with values on hover/focus AND a data table
  alternative

## Design Patterns

### Double Encoding
Every colour meaning gets a second encoding:
- Colour + icon
- Colour + text label
- Colour + pattern or texture
- Colour + shape
- Colour + position

### Accessible Colour Palettes
- Choose colours that are distinguishable in all types of
  colour vision deficiency (not just red-green)
- Use a colour blindness simulator to test your palette
- Blue and orange are generally safe for most types
- Avoid red/green as the only pair distinguishing two states
- Ensure sufficient contrast between adjacent colours in charts

### Greyscale Test
Quick check: convert your interface to greyscale.
- Can you still use it?
- Can you distinguish all status states?
- Can you read the chart?
- Can you tell which fields have errors?

If any answer is no, colour is carrying meaning alone.

## Assessment Checklist

- [ ] No information is conveyed by colour alone
- [ ] Status indicators use colour + icon + text
- [ ] Form errors use colour + icon + message
- [ ] Charts are readable in greyscale
- [ ] Links are distinguishable by more than colour
- [ ] Alert levels use colour + label + icon
- [ ] Data visualisations have patterns or labels alongside colour
- [ ] Interface passes the greyscale test
