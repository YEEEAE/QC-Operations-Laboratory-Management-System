---
name: feedback-and-status
description: "Design feedback and status communication that works across senses — visual, auditory, and haptic. Use when designing loading states, success messages, progress indicators, notifications, alerts, or any system response to user action. Triggers on: feedback, status, notification, alert, loading, progress, success message, confirmation, toast, snackbar, screen reader announcement, aria-live, colour alone."
---

# Feedback and Status Design

Design system feedback that reaches every user — regardless of whether
they can see the screen, hear audio, or feel vibration. No single
sense should be the only channel.

## Core Principle

Never communicate status through one sense alone. What happens if the
user can't see it? Can't hear it? Can't feel it?

## The Multi-Channel Rule

Every piece of feedback should work through at least two channels:

| Feedback type | Visual | Text | Sound | Haptic |
|--------------|--------|------|-------|--------|
| Success | Green tick | "Saved successfully" | Confirmation tone | Short vibration |
| Error | Red highlight | Specific error message | Alert tone | Double vibration |
| Loading | Spinner/bar | "Loading..." | None (silence) | None |
| Warning | Yellow banner | Warning text | Optional tone | Optional vibration |

Screen readers are a critical third channel — all visual feedback must
be announced to assistive technology.

## Design Patterns

### Don't Rely on Colour Alone
- Red/green is invisible to 8% of men with colour vision deficiency
- Always combine colour with: icon, text label, pattern, or position
- Error states: red + error icon + text description
- Success states: green + tick icon + text confirmation
- Test: does this still communicate the same thing in greyscale?

### Immediate Feedback
- Button press: visual change within 100ms (pressed state)
- Form submission: loading indicator within 1 second
- Completion: success message within 2 seconds of finishing
- Error: highlight the specific field, not just a banner at the top

### Persistent vs. Transient Feedback
- **Transient** (toast/snackbar): only for non-critical confirmations.
  Show for at least 5 seconds. Include a way to review missed messages.
- **Persistent** (inline): for errors, warnings, and anything the user
  needs to act on. Never auto-dismiss error messages.
- Screen reader users miss transient messages — use aria-live="polite"
  for non-urgent updates, aria-live="assertive" for critical alerts.

### Progress Communication
- Determinate progress (known duration): show percentage or step count
- Indeterminate progress (unknown duration): show spinner with
  text like "Loading your results..."
- Long processes (over 10 seconds): add estimated time remaining
- Very long processes: allow background processing with notification
  on completion

### Status Without Vision
- All status changes must be announced to screen readers
- Use aria-live regions for dynamic content updates
- Don't rely on visual position alone to convey status
  (e.g., a moved item in a kanban board needs a text announcement)
- Error messages must be programmatically associated with their
  field (aria-describedby)

## Assessment Questions

1. Is colour ever the only indicator of status?
2. Can a screen reader user perceive every status change?
3. Are error messages persistent until resolved?
4. Do transient messages display long enough to be read?
5. Does every user action produce perceivable feedback?
