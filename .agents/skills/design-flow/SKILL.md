---
name: design-flow
description: "Design an interaction flow with inclusive input and output options from the start. Chains: multi-modal-input, keyboard-navigation, touch-target-design, feedback-and-status. Use when designing a new feature, flow, or interface and you want to build inclusive interaction in from the beginning."
---

# Design Inclusive Interaction Flow

Design a new interaction flow that supports diverse input methods and
provides accessible feedback from the start — not retrofitted after.

## Process

### Step 1: Identify All Interactions
List every point in the flow where the user must act:
- Click/tap a button
- Enter text
- Make a selection
- Navigate between steps
- Drag, swipe, or gesture
- Respond to a prompt

### Step 2: Assign Input Methods
Using **multi-modal-input**, for each interaction specify how it works
across at least three input methods:
- Keyboard: what keys or shortcuts activate it?
- Pointer/touch: what is the target size and spacing?
- Voice (where applicable): what command triggers it?

Flag any interaction that only works with one input method.

### Step 3: Design the Keyboard Layer
Using **keyboard-navigation**, define:
- Tab order through all interactive elements
- Focus management for modals, dropdowns, and dynamic content
- Skip links and landmark navigation
- Keyboard shortcuts for frequent actions (document them)

### Step 4: Specify Targets
Using **touch-target-design**, specify:
- Minimum sizes for all interactive elements
- Spacing between adjacent targets
- Thumb zone placement for mobile primary actions

### Step 5: Design Feedback
Using **feedback-and-status**, for each interaction specify:
- What the user sees (visual feedback)
- What a screen reader announces (text alternative)
- What happens on success, error, and loading states
- How feedback works with colour, icon, and text combined

## Output

Deliver an interaction specification that includes:
- Flow diagram with interaction points marked
- Input method matrix (task × input method)
- Focus order map
- Target size annotations
- Feedback specification per interaction
