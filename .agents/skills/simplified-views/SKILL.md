---
name: simplified-views
description: "Design simplified and reduced-complexity views of interfaces for users who need less visual noise and fewer options. Use when designing settings, dashboards, complex tools, or any interface that could benefit from a simpler mode. Triggers on: simplified view, simple mode, easy mode, basic view, reduce complexity, less clutter, overwhelmed, too many options, beginner mode, essential view, focus mode."
---

# Simplified Views

Design interfaces that offer a simpler version of themselves — fewer
options, less visual complexity, clearer paths — for users who need
or prefer reduced complexity.

## Who This Is For

- People with cognitive disabilities who are overwhelmed by complex interfaces
- Older adults who prefer simpler, more predictable tools
- New users who don't need advanced features yet
- Anyone in a stressful or low-energy context
- People using assistive technology where less clutter means
  faster navigation

## Core Principle

The simplified view is not a lesser version. It's a focused version
that contains everything needed for the core tasks and nothing that
isn't.

## Design Patterns

### Feature Layering
- Identify core tasks (what 80% of users do 80% of the time)
- Show core features by default
- Advanced features accessible via "Show more" or "Advanced"
- Never require the advanced view to complete basic tasks
- The simplified view should feel complete, not stripped

### Progressive Complexity
- Start simple, let users add complexity as they need it
- Onboarding should begin in simplified mode
- Offer to increase complexity when the user demonstrates comfort
- "You might also want to try..." not "You're in basic mode"
- Never make users feel that simplified = inferior

### Dashboard Simplification
- Default dashboard: 3–5 key metrics, primary actions
- Full dashboard: all metrics, secondary actions, configuration
- Let users choose which cards/widgets to show
- Remember their choice across sessions
- Provide preset layouts: "Essential", "Detailed", "Custom"

### Navigation Simplification
- Simplified nav: top-level items only
- Full nav: all levels visible
- Both must reach all content — simplified may need more clicks
  but each click should be obvious
- Breadcrumbs help users who take the longer path

### Form Simplification
- Show required fields only by default
- "Show optional fields" expands the form
- Smart defaults reduce decisions
- Break complex forms into steps in simplified mode,
  show all fields on one page in advanced mode

## Implementation Approaches

### User-Controlled Toggle
- Visible setting: "Simplified view" / "Full view"
- Available in app settings AND on the page itself
- Preference remembered across sessions
- Clearly labelled — never hidden

### Responsive Simplification
- Automatically simplify at smaller viewports
- Mobile views are inherently simplified — embrace this
- Don't try to cram the desktop layout into mobile

### Role-Based Defaults
- New accounts start in simplified mode
- Power users can switch to full mode
- Admin accounts may need full mode by default
- Let users override role-based defaults

## Anti-Patterns

- "Lite" versions that lack essential features
- Simplified modes that are clearly afterthoughts with broken layouts
- Forcing users to request simplified mode through support
- Patronising language ("Easy mode for beginners!")
- Removing access to content rather than reorganising it

## Assessment Questions

1. Is there a simplified view available for complex interfaces?
2. Can core tasks be completed entirely in simplified mode?
3. Is the toggle between modes easy to find and use?
4. Does simplified mode feel complete, not stripped?
5. Are user preferences for view mode remembered?
