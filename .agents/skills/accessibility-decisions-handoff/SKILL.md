---
name: accessibility-decisions-handoff
description: "Generate an accessibility decision handoff for engineering. Chains: decision-documentation, compliance-mapping, accessibility-testing-strategy. Use when a design is ready for implementation and the engineering team needs clear accessibility specifications."
---

# Accessibility Decision Handoff

Package accessibility decisions into a clear specification that
engineers can implement against — because "make it accessible"
is not a specification.

## Process

### Step 1: Compile Decisions
Using **decision-documentation**, gather all accessibility decisions
for the feature:
- Interaction patterns and keyboard behaviour
- Screen reader announcements and ARIA requirements
- Visual specifications (contrast, colour independence, motion)
- Content requirements (reading level, alt text, link text)
- Adaptive behaviour (preferences, zoom, density)

### Step 2: Map to Implementation
Using **compliance-mapping**, translate each design decision into
specific implementation requirements:

For each interactive element specify:
- HTML element or ARIA role
- Keyboard behaviour (which keys do what)
- Focus management (where focus goes after actions)
- Screen reader name, role, and state announcements
- Visual states (default, hover, focus, active, disabled, error)

For each content element specify:
- Heading level
- Alt text (exact text or strategy)
- Link text
- Language attributes if multilingual

For each adaptive behaviour specify:
- Media query and expected response
- Preference detected and what changes
- Breakpoints and reflow behaviour

### Step 3: Define Test Criteria
Using **accessibility-testing-strategy**, provide specific test
cases for each requirement:
- Keyboard test: "Tab to the submit button, press Enter,
  verify focus moves to the confirmation message"
- Screen reader test: "Navigate to the error, verify it
  announces: 'Error: email address is required'"
- Visual test: "Verify contrast ratio of body text is at
  least 4.5:1 in both light and dark modes"
- Zoom test: "At 200% zoom, verify the form reflows to
  single column with no horizontal scroll"

### Step 4: Flag Risks and Dependencies
Note anything engineers need to be aware of:
- Components that need custom keyboard handling
- Places where framework defaults aren't accessible
- Third-party components that may need wrapping or replacing
- Areas where automated testing won't catch the issue

## Output

Deliver a handoff document containing:

1. **Accessibility specification** — element-by-element requirements
   with HTML, ARIA, keyboard, and visual specifications
2. **Test cases** — specific, executable test scenarios for keyboard,
   screen reader, visual, and zoom testing
3. **WCAG mapping** — which success criteria each requirement
   addresses
4. **Risk register** — known challenges and recommended approaches
5. **Definition of done** — the specific accessibility criteria
   that must pass before the feature ships
