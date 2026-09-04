---
name: multi-modal-input
description: "Design interfaces that offer multiple input methods so users can choose what works for their abilities and context. Use when designing any interactive system where users provide input — forms, search, editors, creative tools, communication interfaces. Triggers on: multi-modal, input methods, alternative input, how people interact, mouse alternative, touch alternative, input flexibility, switch access, eye tracking, head pointer."
---

# Multi-Modal Input Design

Design systems where users can accomplish any task through whichever
input method works for them — keyboard, mouse, touch, voice, switch,
eye tracking, or any combination.

## Core Principle

Never assume how someone will interact with your interface. Offer
choices. Let the user decide.

## The Input Spectrum

People interact with technology through many methods, often combining
several at once:

- **Keyboard** — physical, on-screen, or switch-activated
- **Mouse / trackpad** — standard pointer devices
- **Touch** — fingers, stylus, or assistive touch
- **Voice** — speech commands, dictation
- **Switch devices** — single or dual switches scanning through options
- **Eye tracking** — gaze-based selection
- **Head pointers** — head movement controlling a cursor
- **Sip-and-puff** — breath-controlled switches

## Design Patterns

### Input Equivalence
- Every action must be possible through at least keyboard AND
  pointer (mouse/touch)
- Voice input should be available as a third option where practical
- Never lock a feature to a single input method
- Test: can someone complete this task using ONLY keyboard?
  ONLY touch? ONLY voice?

### Flexible Text Entry
- Support physical keyboard, on-screen keyboard, voice dictation,
  and paste from clipboard
- Auto-complete and suggestions reduce typing burden
- Don't disable paste in form fields (password managers, assistive
  tools depend on this)
- Allow scanning and OCR for filling in reference numbers or codes

### Selection Without Precision
- Radio buttons and checkboxes: make the label clickable, not just
  the control
- Dropdowns: allow type-ahead search for long lists
- Date pickers: always offer a text field alternative alongside
  the calendar widget
- Colour pickers: provide text input for hex/RGB values

### Complex Interactions
- Drag-and-drop: always provide button-based reordering
- Drawing/annotation: offer text description as alternative
- Map interactions: provide address search alongside map selection
- Gestures (swipe, pinch): always provide button equivalents

## Assessment Questions

1. Can every task be completed through keyboard alone?
2. Can every task be completed through pointer alone?
3. Are there complex interactions (drag, gesture, drawing) that
   lack simpler alternatives?
4. Is paste enabled in all text fields?
5. Do all form controls have clickable labels?
