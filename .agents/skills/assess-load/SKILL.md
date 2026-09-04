---
name: assess-load
description: "Assess cognitive load across a complete multi-step process and produce a load map. Chains: cognitive-load-assessment, memory-load-reduction, wayfinding-navigation. Use when evaluating a checkout flow, onboarding sequence, application process, or any multi-step journey."
---

# Assess Load

Map the cognitive load across a complete multi-step process and identify
where users are most likely to struggle, give up, or make errors.

## Process

### Step 1: Map the Journey
List every step in the process from start to completion.
For each step, note: what the user sees, what they must do, and
what they must decide.

### Step 2: Rate Each Step
Using **cognitive-load-assessment**, evaluate each step across all
six dimensions (decisions, memory, concepts, steps, reading, visual).
Record the rating for each.

### Step 3: Identify Load Spikes
Plot the load across the journey. Identify:
- Steps where load suddenly increases (load spikes)
- Consecutive steps with medium-or-higher load (sustained load)
- Points where users must remember information from earlier steps
  (memory bridges)

### Step 4: Check Navigation and Memory
Using **wayfinding-navigation** and **memory-load-reduction**, verify:
- Can users always get back to a previous step?
- Is progress saved automatically?
- Is key context carried forward between steps?
- Can users see where they are in the overall process?

### Step 5: Recommendations
For each load spike or sustained load zone, recommend specific
design changes to bring the load rating down.

## Output

Deliver a cognitive load map: a step-by-step table showing the load
rating at each point in the journey, annotated with:
- Load spikes flagged in red
- Memory bridges highlighted
- Specific reduction recommendations for each issue
- An overall cognitive load score for the process
