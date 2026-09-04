---
name: compliance-mapping
description: "Map design decisions to accessibility standards and legal requirements. Use when documenting WCAG conformance, preparing for audits, tracking compliance status, or when legal or procurement requires accessibility documentation. Triggers on: WCAG, compliance, conformance, audit, VPAT, accessibility statement, legal requirement, ADA, EAA, European Accessibility Act, Section 508, EN 301 549, accessibility standard, success criterion."
---

# Compliance Mapping

Map design decisions to specific accessibility standards so the team
knows exactly where they stand — what's covered, what's not, and
what's at risk.

## Why Designers Need This

Compliance mapping is usually treated as an engineering audit task.
But most conformance failures originate in design decisions made
before code was written. A designer who understands which standards
their decisions affect can prevent failures instead of discovering
them.

## Key Standards

### WCAG 2.2 Level AA
The global baseline. Most laws reference this.
- Level A: minimum (29 criteria)
- Level AA: standard target (20 additional criteria)
- Level AAA: aspirational (28 additional criteria)

Most organisations target Level AA. Some criteria in Level AAA
are worth adopting even if not required (especially cognitive
accessibility criteria).

### Legal Frameworks
- **ADA (US):** requires accessible digital services, courts
  reference WCAG 2.1 AA
- **EAA (EU):** European Accessibility Act, effective June 2025,
  references EN 301 549 which aligns with WCAG 2.1 AA
- **Section 508 (US government):** references WCAG 2.0 AA,
  update expected
- **EN 301 549 (EU):** the technical standard behind EAA,
  aligned with WCAG 2.1 AA plus additional requirements for
  software, hardware, and documentation

## Design Decision to WCAG Mapping

### Colour and Visual Design
| Design decision | WCAG criteria |
|----------------|---------------|
| Text contrast ratios | 1.4.3 Contrast (Minimum) AA |
| Non-text contrast | 1.4.11 Non-text Contrast AA |
| Colour not sole indicator | 1.4.1 Use of Color A |
| Text resizing to 200% | 1.4.4 Resize Text AA |
| Content reflow at zoom | 1.4.10 Reflow AA |
| Text spacing override | 1.4.12 Text Spacing AA |

### Interaction Design
| Design decision | WCAG criteria |
|----------------|---------------|
| Keyboard operability | 2.1.1 Keyboard A |
| No keyboard traps | 2.1.2 No Keyboard Trap A |
| Focus visible | 2.4.7 Focus Visible AA |
| Focus order logical | 2.4.3 Focus Order A |
| Touch target size | 2.5.8 Target Size (Minimum) AA |
| No motion-only input | 2.5.4 Motion Actuation A |
| Gesture alternatives | 2.5.1 Pointer Gestures A |

### Content and Structure
| Design decision | WCAG criteria |
|----------------|---------------|
| Page titles | 2.4.2 Page Titled A |
| Heading hierarchy | 1.3.1 Info and Relationships A |
| Link purpose clear | 2.4.4 Link Purpose (In Context) A |
| Language of page set | 3.1.1 Language of Page A |
| Consistent navigation | 3.2.3 Consistent Navigation AA |
| Error identification | 3.3.1 Error Identification A |
| Labels on inputs | 3.3.2 Labels or Instructions A |

### Motion and Timing
| Design decision | WCAG criteria |
|----------------|---------------|
| Pause/stop/hide motion | 2.2.2 Pause, Stop, Hide A |
| No flashing content | 2.3.1 Three Flashes A |
| Timing adjustable | 2.2.1 Timing Adjustable A |
| Animation from interaction | 2.3.3 Animation from Interactions AAA |

## How to Use This

### During Design
Before finalising a design decision, check which WCAG criteria
it affects. This catches failures at the cheapest point to fix them.

### During Review
Map the design against the relevant criteria table. Flag any
decision that would cause a conformance failure.

### For Audit Preparation
Use the mapping tables to create a pre-audit checklist specific
to your product. This tells auditors exactly which decisions map
to which criteria.

## Assessment Questions

1. Can the team map their key design decisions to WCAG criteria?
2. Are there design decisions that would cause conformance failures?
3. Does the team know which legal frameworks apply to their product?
4. Is there a process for checking designs against standards before
   implementation?
