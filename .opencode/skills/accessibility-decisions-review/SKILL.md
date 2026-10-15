---
name: accessibility-decisions-review
description: "Review and surface undocumented accessibility assumptions in an existing feature or product. Chains: decision-documentation, tradeoff-analysis, compliance-mapping, accessibility-debt-tracking. Use when inheriting a product, joining a team, or auditing a feature where accessibility decisions were never formally captured."
---

# Review Accessibility Decisions

Surface the accessibility decisions that were made — deliberately or
by default — in an existing feature, and document them before they
get lost.

## Process

### Step 1: Identify Implicit Decisions
Walk through the feature and list every design choice that affects
accessibility, even if nobody explicitly decided it:
- How is keyboard navigation handled?
- What happens with screen readers?
- What colour and contrast choices were made?
- How are errors communicated?
- What motion and animation exists?
- What user preferences are respected?

Many of these were never consciously decided — they were inherited
from a framework, copied from another feature, or left at defaults.
Those are still decisions. Document them.

### Step 2: Assess Each Decision
For each identified decision, determine:
- Was this intentional or accidental?
- Does it meet current accessibility standards?
- Who does it serve well? Who does it exclude?
- Is there evidence behind it or was it arbitrary?

### Step 3: Check for Undocumented Tradeoffs
Using **tradeoff-analysis**, identify decisions where accessibility
was traded for something else:
- Speed: "we didn't have time to make this keyboard accessible"
- Complexity: "the accessible version was too hard to build"
- Design: "the accessible version didn't look right"
- Ignorance: "we didn't know this was an issue"

Document each with its current impact on users.

### Step 4: Map Current Compliance
Using **compliance-mapping**, assess the feature's current state
against WCAG 2.2 Level AA. Identify conformance gaps.

### Step 5: Catalogue Debt
Using **accessibility-debt-tracking**, create a debt record for
every known issue discovered in this review.

## Output

Deliver a decision review report:

1. **Decision inventory** — every accessibility-affecting decision
   found, marked as intentional or accidental
2. **Undocumented tradeoffs** — decisions where accessibility was
   sacrificed, with current user impact
3. **Compliance gaps** — WCAG criteria not currently met
4. **Debt register** — known issues with severity, owner, and
   recommended timeline
5. **Recommendations** — which decisions should be revisited first
