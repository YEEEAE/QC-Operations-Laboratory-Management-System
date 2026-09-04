---
name: assistive-technology-scenarios
description: "Write usage scenarios that include assistive technology and diverse interaction methods. Use when writing scenarios, use cases, user journeys, or storyboards. Triggers on: assistive technology, AT, screen reader, switch, voice control, magnifier, braille display, head pointer, eye tracking, how people use our product, usage scenario, use case."
---

# Assistive Technology Scenarios

Write scenarios that show real people using real assistive technology
to complete real tasks — so the team designs for actual usage, not
imagined ideal conditions.

## Why This Matters

If your scenarios only describe people using a mouse and a large
monitor, your design will only work for people using a mouse and a
large monitor. Scenarios shape what teams consider. What they consider,
they design for.

## Common Assistive Technologies

### Vision
- **Screen reader** (JAWS, NVDA, VoiceOver, TalkBack): reads content
  aloud, navigates by headings, links, and landmarks via keyboard
- **Screen magnifier** (ZoomText, built-in zoom): enlarges a portion
  of the screen, user sees only a fraction at a time
- **Braille display**: converts text to braille in real time, used
  alongside a screen reader
- **High contrast mode**: system-level colour override for readability

### Motor
- **Switch device**: one or two buttons that scan through options —
  much slower than keyboard, every extra step matters
- **Voice control** (Dragon, Voice Control, Voice Access): speaks
  commands to navigate and type
- **Head pointer / eye tracking**: cursor controlled by head movement
  or eye gaze — precision is limited
- **Mouth stick / stylus**: physical pointer for touchscreens or
  keyboards

### Hearing
- **Captions**: real-time or pre-recorded text for audio content
- **Visual alerts**: flashing screen or visual indicator replacing
  audio notifications
- **Hearing loop / Bluetooth**: direct audio to hearing aids

### Cognitive
- **Text-to-speech**: reads content aloud (not a screen reader —
  the user can see the screen but processes better by hearing)
- **Reading ruler / line guide**: highlights one line at a time
- **Simplified view**: browser extensions or settings that strip
  clutter
- **Password managers**: reduce memory burden for authentication

## How to Write AT Scenarios

### Include the Setup
Don't just name the disability. Describe the person, their technology,
and their environment.

"Priya is a data analyst who uses JAWS screen reader with Firefox on
a Windows laptop. She's fast with keyboard shortcuts and has two
monitors — one for her spreadsheets, one for the tool she's reviewing.
She's at her desk with noise-cancelling headphones."

### Show the Interaction Step by Step
Describe how the person actually moves through the interface with
their technology:

"Priya tabs to the navigation menu. JAWS announces 'Navigation,
5 items.' She presses the down arrow to find 'Reports' and presses
Enter. The page loads and JAWS announces the H1: 'Monthly Reports.'
She presses H to jump through headings until she finds 'March 2026.'"

### Show Where It Breaks
The scenario should surface design failures:

"Priya reaches the data table but JAWS announces each cell without
column headers. She hears '42,500' but doesn't know which metric or
which month. She tabs past the table looking for a text summary but
there isn't one."

## Scenario Coverage

For any product, write scenarios for at least:
- One screen reader user completing the core task
- One keyboard-only user completing the core task
- One user with low vision using magnification
- One user with a cognitive difference
- One user in a situational impairment context

## Template
```
Name: [Name]
Role/context: [Who they are beyond their disability]
Technology: [Devices, AT, browser, settings]
Environment: [Where, when, what else is happening]
Task: [What they're trying to accomplish]
Steps: [How they interact, step by step, using their AT]
Pain points: [Where the design fails or creates friction]
Success: [What a good outcome looks like for this person]
```

## Assessment Questions

1. Does the scenario name specific assistive technology, not just
   the disability?
2. Does it describe step-by-step interaction, not just the goal?
3. Does it surface specific design failures?
4. Would a developer reading this know what to fix?
