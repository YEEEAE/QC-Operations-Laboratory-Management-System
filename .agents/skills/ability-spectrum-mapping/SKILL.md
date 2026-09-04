---
name: ability-spectrum-mapping
description: "Map how a product or feature works across the full spectrum of human ability — not just 'can use' and 'can't use'. Use when planning accessibility coverage, identifying gaps, or communicating accessibility scope to stakeholders. Triggers on: ability spectrum, range of users, who can use this, who can't use this, accessibility coverage, accessibility scope, ability range, spectrum of needs."
---

# Ability Spectrum Mapping

Map how a feature performs across the full range of human ability —
from full capability to no capability in each dimension — to identify
where the design starts to break down and who gets excluded.

## Why a Spectrum

Accessibility is not binary. It's not "can see" vs "blind." The
reality is a continuous spectrum:

- Full vision → needs glasses → low vision → legally blind → no vision
- Full hearing → mild loss → moderate loss → severe loss → deaf
- Full dexterity → mild tremor → limited range → single hand → no hands
- Full cognition → mild difficulty → moderate difficulty → significant support needs

Products don't go from "works" to "doesn't work" in a single step.
They degrade gradually. The spectrum map shows you exactly where your
design starts failing and for whom.

## How to Build an Ability Spectrum Map

### Step 1: List Core Tasks
Identify the 5–10 most important tasks a user performs with the product.

### Step 2: Define the Spectrums
For each relevant ability dimension, define 4–5 points:

**Vision spectrum:**
Full vision → Corrected vision → Low vision (magnification) →
Very low vision (screen reader + some vision) → No vision (screen reader only)

**Hearing spectrum:**
Full hearing → Mild loss (louder volume) → Moderate loss (captions needed) →
Severe loss (captions + visual alerts) → Deaf (fully visual communication)

**Motor spectrum:**
Full dexterity → Reduced precision (larger targets) → Limited range
(keyboard only) → Minimal movement (switch or voice) →
No hand use (eye tracking, sip-and-puff)

**Cognitive spectrum:**
Comfortable with complexity → Prefers simplicity → Needs plain language →
Needs step-by-step guidance → Needs significant support

### Step 3: Map Each Task

For each task × ability point, rate:
- **Works well** — no barriers
- **Works with friction** — possible but harder than it should be
- **Works with workaround** — user must find their own solution
- **Fails** — task cannot be completed

### Step 4: Identify the Breakpoints

Where does the design shift from "works" to "fails"? That breakpoint
is your accessibility boundary. Everything to the right of it is
excluded.

The goal is to push that boundary as far right as possible.

## Presenting to Stakeholders

The spectrum map is a powerful communication tool because it shows:
- Exactly how many users are affected at each point
- Where investment in accessibility has the highest return
- That accessibility is a continuum, not a checkbox
- Which fixes would move the boundary and include more people

## Template

| Task | Full vision | Low vision | Screen reader |
|------|------------|-----------|---------------|
| Search for a product | Works well | Works with friction (small targets) | Fails (search suggestions not announced) |
| Complete checkout | Works well | Works well | Works with friction (form errors not associated) |

## Assessment Questions

1. Have you mapped core tasks across at least vision, motor, and
   cognitive spectrums?
2. Can you identify the exact breakpoint where each task fails?
3. Do you know which fixes would include the most additional users?
4. Can you communicate the spectrum to stakeholders without
   technical jargon?
