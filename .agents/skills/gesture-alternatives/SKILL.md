---
name: gesture-alternatives
description: "Design alternatives to gesture-based and motion-based interactions. Use when designing swipe actions, pinch-to-zoom, shake-to-undo, tilt controls, multi-finger gestures, or any interaction that requires specific physical movements. Triggers on: gesture, swipe, pinch, shake, tilt, multi-touch, two-finger, rotation gesture, device motion, accelerometer, gyroscope."
---

# Gesture Alternatives

Every gesture-based interaction must have a simpler alternative. Gestures
that require specific physical movements exclude people with motor
disabilities, limb differences, tremors, or limited range of motion.

## Core Principle

Gestures are shortcuts, not gatekeepers. The feature they activate must
always be reachable another way.

## Gesture Types and Required Alternatives

### Path-Based Gestures (swipe, draw, drag)
These require tracing a specific path. Many users cannot perform them.
- Swipe to delete → visible delete button
- Swipe to navigate → previous/next buttons
- Draw a shape → select from a menu of shapes
- Drag to reorder → move up/down buttons or numbered input

### Multi-Point Gestures (pinch, rotate, two-finger scroll)
These require multiple simultaneous contact points.
- Pinch to zoom → zoom buttons (+/−) and text input for zoom level
- Two-finger rotate → rotation buttons or degree input
- Two-finger scroll → single-finger scroll or visible scrollbar
- Three-finger swipe → visible button or menu option

### Device Motion (shake, tilt, rotation)
These require moving the entire device.
- Shake to undo → visible undo button (always)
- Tilt to steer → on-screen directional controls
- Device rotation for content → manual rotation toggle

### Timed Gestures (long press, double tap)
These require precise timing.
- Long press for context menu → visible menu trigger (⋮ or ⋯)
- Double tap to zoom → zoom button
- Press and hold to record → toggle start/stop buttons

## Design Patterns

### Progressive Enhancement
- Build the button-based version first
- Add gesture support as an enhancement on top
- This guarantees the alternative always exists

### Discoverability
- Gesture shortcuts should be documented but not required
- Show a hint on first use ("You can also swipe to delete")
- Provide a gesture guide in settings or help
- Never assume users know a gesture exists

### Customisation
- Allow users to disable gesture controls entirely
- Allow remapping of gestures where possible
- Respect system-level gesture settings

## Assessment Questions

1. Does every gesture have a visible, single-action alternative?
2. Can users who cannot perform multi-point gestures complete
   every task?
3. Are device-motion interactions optional with on-screen
   alternatives?
4. Can timed gestures be replaced with untimed actions?
