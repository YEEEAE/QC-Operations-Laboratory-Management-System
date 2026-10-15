---
name: scenario-map
description: "Map inclusive usage scenarios across ability spectrums for a product or feature. Chains: ability-spectrum-mapping, situational-impairment-mapping, assistive-technology-scenarios. Use when planning test coverage, identifying accessibility gaps, or understanding how a feature performs across diverse users."
---

# Map Inclusive Usage Scenarios

Generate a comprehensive map of how a product or feature is experienced
across different abilities, technologies, and contexts — surfacing
gaps before users find them.

## Process

### Step 1: Identify Core Tasks
List the 5–10 most important tasks for the product or feature.
Focus on the tasks that matter most to users — the ones where
failure means the product has failed.

### Step 2: Map the Ability Spectrum
Using **ability-spectrum-mapping**, for each core task, rate
performance across vision, hearing, motor, and cognitive spectrums.
Identify the breakpoints where each task degrades or fails.

### Step 3: Map Situational Contexts
Using **situational-impairment-mapping**, identify the realistic
contexts where users encounter your product and the impairments
those contexts create. Cross-reference with the ability spectrum
to find compounding effects.

### Step 4: Write Critical Scenarios
Using **assistive-technology-scenarios**, write detailed scenarios
for the highest-risk combinations: the tasks most likely to fail
for the users most likely to be affected.

Prioritise:
- Core tasks that fail at common ability levels
- Situational contexts that affect large user populations
- Combinations where multiple impairments compound

### Step 5: Identify Gaps and Priorities
Map all findings into a single view showing:
- Which tasks work for whom
- Where the breakpoints are
- Which fixes would include the most users

## Output

Deliver a scenario map containing:

1. **Task × ability matrix** — showing works / friction / fails for
   each combination
2. **Situational context overlay** — which contexts compound which
   ability barriers
3. **Critical scenarios** — detailed narratives for highest-risk
   combinations
4. **Gap analysis** — where the product fails and for whom
5. **Priority fixes** — ranked by number of users unblocked and
   severity of current failure
