---
name: accessibility-testing-strategy
description: "Plan what to test, how to test, and who should test for accessibility. Use when defining a testing approach, planning QA, setting up automated and manual testing, or deciding what level of accessibility testing a project needs. Triggers on: accessibility testing, how to test, test plan, automated testing, manual testing, screen reader testing, user testing, accessibility QA, what to test, testing strategy."
---

# Accessibility Testing Strategy

Plan a testing approach that catches real accessibility barriers —
because automated tools find roughly 30% of issues. The other 70%
require human judgment.

## The Testing Pyramid

### Layer 1: Automated Testing (Catches ~30%)
What it finds:
- Missing alt text
- Colour contrast failures
- Missing form labels
- Missing language attribute
- Empty headings and buttons
- Duplicate IDs

What it misses:
- Whether alt text is meaningful
- Whether focus order is logical
- Whether content makes sense
- Whether interactions work with keyboard
- Whether the experience is usable

Tools: axe, Lighthouse, WAVE, Pa11y, jest-axe
When: on every build, in CI/CD pipeline
Who: automated — no human needed

### Layer 2: Manual Expert Testing (Catches ~50%)
What it finds:
- Keyboard navigation issues
- Focus management problems
- Logical reading order failures
- Meaningful alt text assessment
- Cognitive accessibility barriers
- Interaction pattern issues

Method:
- Tab through every interactive element
- Test with screen reader (VoiceOver or NVDA)
- Test at 200% zoom
- Test with system preferences enabled
- Review content for plain language

When: before each release, on major feature changes
Who: someone trained in accessibility testing

### Layer 3: User Testing With Disabled People (Catches remaining ~20%)
What it finds:
- Real-world usability barriers that experts miss
- Assistive technology compatibility issues
- Unexpected workflows and workarounds
- Cognitive and emotional barriers
- Issues that only appear with actual AT proficiency

Method:
- Recruit participants with diverse disabilities
- Test core tasks with their own devices and AT
- Observe — don't guide or explain
- Record what works, what fails, and what frustrates

When: quarterly, or before major launches
Who: users with disabilities using their own setup

## What to Test First

### Priority 1: Core Tasks
- Can users complete the primary tasks the product exists for?
- Test the critical path end to end
- Any failure here is a launch blocker

### Priority 2: Input and Navigation
- Keyboard-only navigation through the core flow
- Screen reader navigation through the core flow
- Touch interaction on mobile for the core flow

### Priority 3: Content and Comprehension
- Is content understandable at the target reading level?
- Are error messages helpful?
- Is help available and findable?

### Priority 4: Edge Cases and Preferences
- Zoom to 200%
- System preferences (reduced motion, high contrast, dark mode)
- Long content, empty states, error states

## Screen Reader Testing Basics

For teams new to screen reader testing:

### Start With VoiceOver (Mac)
- Turn on: Cmd + F5
- Navigate: VO + arrow keys (VO = Ctrl + Option)
- Headings: VO + Cmd + H
- Links: VO + Cmd + L
- Forms: VO + Cmd + J
- Turn off: Cmd + F5

### Start With NVDA (Windows)
- Download free from nvaccess.org
- Navigate: Tab, arrow keys
- Headings: H
- Links: K
- Forms: F
- Stop speech: Ctrl

### What to Listen For
- Does every interactive element have a name?
- Are state changes announced (expanded, selected, checked)?
- Does focus move to the right place after actions?
- Can you understand the page reading only the headings?

## Assessment Questions

1. Is automated testing running on every build?
2. Is manual expert testing happening before each release?
3. Has the product been tested by people with disabilities?
4. Are core tasks tested with keyboard and screen reader?
5. Is there a clear priority for what to test first?
