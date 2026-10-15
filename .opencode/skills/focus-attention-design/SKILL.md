---
name: focus-attention-design
description: "Design interfaces that support sustained focus and reduce distractions. Use when designing for users with ADHD, attention difficulties, anxiety, or any context where focus matters — dashboards, reading experiences, task flows, forms, learning interfaces. Triggers on: focus, distraction, ADHD, attention, too busy, cluttered, visual noise, autoplay, notifications, pop-ups, interruptions."
---

# Focus and Attention Design

Design interfaces that help people maintain focus on their task by
removing unnecessary distractions and giving users control over their
attention environment.

## Core Principle

Every element on screen should serve the user's current task.
If it exists for the business but not for the user, it is a distraction.

## Design Patterns

### Single Purpose
- One primary action per screen or section
- Secondary actions visually de-emphasised (smaller, muted colour, text link)
- Remove decorative elements that don't serve the task
- Hide advanced options behind "Show more" or "Advanced"
- Present choices sequentially, not simultaneously, when possible

### Interruption Control
- No autoplay audio or video
- No pop-ups that aren't triggered by user action
- Allow users to dismiss or defer notifications
- Save state before showing any modal — closing it must not lose work
- Never remove content from the screen without user action
- If a banner or alert is needed, make it dismissable and non-blocking

### Visual Calm
- Generous whitespace between sections
- Limited colour palette (3–4 colours for UI elements)
- Subtle borders and dividers, not heavy lines
- No flashing, blinking, or rapidly changing content
- Animation only for functional feedback (loading, transitions)
- Always respect prefers-reduced-motion

### Time Sensitivity
- Avoid time limits unless absolutely essential
- If time limits exist, warn well before expiry
- Provide easy extension (one click, not multi-step)
- Allow at least 20 seconds per required decision
- Save progress automatically in timed contexts
- For session timeouts: save state and allow seamless return

## Assessment Questions

For each screen, ask:
1. What is the ONE thing the user should do here?
2. Is that one thing the most visually prominent element?
3. What on this screen competes for attention? Can it be removed or muted?
4. Can the user control interruptions (notifications, modals, autoplay)?
5. Is there artificial urgency that doesn't serve the user?

## Anti-Patterns to Flag

- Countdown timers on non-time-sensitive actions
- "Only 2 left!" urgency messaging
- Autoplay video or audio
- Multiple competing calls to action
- Chat widgets that pop up unsolicited
- Moving or animated advertisements near task areas
- Layout shifts that redirect attention
