---
name: edge-case-identification
description: "Identify and design for edge cases that disproportionately affect users with disabilities. Use when reviewing designs for completeness, planning test cases, or when someone says 'that's an edge case.' Triggers on: edge case, corner case, that's unlikely, only a few users, exception, unusual scenario, we'll handle that later, happy path, unhappy path, error state, empty state."
---

# Edge Case Identification

Identify the scenarios that teams dismiss as "edge cases" but that
are everyday reality for users with disabilities. An edge case for
the team is often a primary case for someone.

## Core Principle

"That's an edge case" is the most common way accessibility gets
deprioritised. If it affects people with disabilities, it's not
an edge case — it's a design requirement you haven't met.

## Categories of Overlooked Edge Cases

### Input Edge Cases
- User cannot use a mouse (keyboard only)
- User cannot use a keyboard (voice or switch only)
- User cannot use both hands (one-handed operation)
- User pastes content instead of typing it
- User uses autocomplete or password manager to fill fields
- User enters content in a different script or language
- User inputs using dictation with punctuation spoken aloud

### Output Edge Cases
- User cannot see the screen (screen reader)
- User sees only a small portion of the screen (magnification)
- User cannot distinguish colours
- User cannot hear audio
- User has screen in greyscale mode or high contrast mode
- User has text scaled to 200%
- User has animations disabled

### Content Edge Cases
- Extremely long names (hyphenated, multi-word, cultural naming)
- Non-Latin characters in name or address fields
- Empty states where no data exists yet
- Error states when everything goes wrong at once
- First-time use with no prior context
- Returning after months away with forgotten context
- Content in the wrong language for the user

### Context Edge Cases
- Session timeout during a long form
- Connection lost mid-task
- Battery dying during a critical flow
- Screen rotation mid-interaction
- System font size set to maximum
- Browser zoom at 200% or higher
- Ad blocker or privacy extension modifying the page

### Timing Edge Cases
- User is much slower than expected (switch user, cognitive delay)
- User is much faster than expected (screen reader power user)
- User needs to pause mid-task for hours or days
- Timed session expires before user finishes
- Content updates while user is reading it

## How to Find Edge Cases

### The "What If" Exercise
For each step in a flow, ask:
- What if the user can't see this?
- What if the user can't click this?
- What if the user can't understand this?
- What if the user takes 10x longer than expected?
- What if the user leaves and comes back tomorrow?
- What if this field contains unexpected content?

### The Inversion Test
Take your happy path scenario. Invert each assumption:
- "User is on a desktop" → mobile, or tablet, or screen reader
- "User has fast internet" → slow, intermittent, or offline
- "User reads English fluently" → low literacy or second language
- "User can see the colour change" → colour blind or blind
- "User completes this in one sitting" → interrupted, returns later

## Response to "That's an Edge Case"

When someone says this, ask:
1. How many users does this affect? (often more than assumed)
2. How severe is the impact? (a blocked user is worse than a
   mildly inconvenienced one)
3. Is this a permanent condition for some users? (then it's their
   daily experience, not an edge case)
4. Would fixing this improve the experience for other users too?
   (almost always yes)

## Assessment Questions

1. Has the team mapped edge cases beyond the happy path?
2. Have input, output, content, context, and timing edge cases
   been considered?
3. Are there dismissed "edge cases" that are daily reality for
   users with disabilities?
4. Does the test plan include scenarios for assistive technology users?
