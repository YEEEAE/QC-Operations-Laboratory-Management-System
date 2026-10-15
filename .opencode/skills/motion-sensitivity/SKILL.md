---
name: motion-sensitivity
description: "Design for people with vestibular disorders, motion sensitivity, or seizure conditions. Use when designing animations, transitions, parallax scrolling, video backgrounds, carousels, or any moving content. Triggers on: motion, animation, vestibular, motion sickness, dizzy, nausea, parallax, autoplay, flashing, seizure, prefers-reduced-motion, spinning, scrolljacking."
---

# Motion Sensitivity Design

Design motion that serves function without causing harm. For people with
vestibular disorders, the wrong animation isn't just annoying — it can
trigger vertigo, nausea, migraines, or seizures that last hours or days.

## Who This Is For

- People with vestibular disorders (estimated 35% of adults over 40)
- People with migraine conditions triggered by visual motion
- People with photosensitive epilepsy (flashing triggers seizures)
- People experiencing concussion recovery
- People with anxiety disorders (unexpected motion increases stress)
- Anyone experiencing motion sickness

## Dangerous Motion to Avoid

### Never Use
- Flashing content faster than 3 times per second (seizure risk —
  this is a WCAG Level A requirement, not optional)
- Large-area flashing in any colour (even at slower rates)
- Strobing or pulsing effects

### Use With Extreme Caution
- Parallax scrolling (triggers vestibular responses)
- Scroll-jacking (overriding native scroll behaviour)
- Zoom animations that scale the full viewport
- Spinning or rotating elements
- Auto-advancing carousels or slideshows
- Background video

## Design Patterns

### Respect prefers-reduced-motion
This is the minimum. Non-negotiable.

When prefers-reduced-motion is set:
- Replace animated transitions with instant state changes
- Stop all autoplay video and animation
- Disable parallax effects
- Disable scroll-triggered animations
- Keep essential motion only (loading indicators) and simplify them

### Motion Budget
Not all motion is equal. Allocate motion deliberately:
- **Essential motion:** loading spinners, progress bars, state
  transitions that communicate meaning. Keep these but simplify.
- **Helpful motion:** hover effects, subtle transitions that aid
  understanding. Keep but make instant when reduced motion is on.
- **Decorative motion:** background animations, entrance effects,
  parallax. Remove entirely.

### Safe Animation Principles
- Keep animations short (under 300ms for transitions)
- Use opacity and colour changes instead of position changes
  where possible (less vestibular impact)
- Avoid animating large areas of the screen simultaneously
- Provide play/pause controls on all moving content
- Never autoplay anything — let the user opt in

### Video and Moving Backgrounds
- Never autoplay with motion — show a static poster image first
- Provide a visible pause/stop button
- If background video is used: offer a static alternative
- Ensure content is fully readable with video paused

## Assessment Questions

1. Does the interface respect prefers-reduced-motion?
2. Is there any flashing content faster than 3 times per second?
3. Can all animations be paused, stopped, or hidden?
4. Does any content autoplay with motion?
5. Are parallax or scroll-triggered animations present? Do they
   have a static alternative?
