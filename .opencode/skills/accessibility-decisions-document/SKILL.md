---
name: accessibility-decisions-document
description: "Document accessibility decisions and tradeoffs for a feature. Chains: decision-documentation, tradeoff-analysis, compliance-mapping. Use when a feature is being designed or shipped and accessibility decisions need to be captured."
---

# Document Accessibility Decisions

Capture all accessibility decisions for a feature in a single,
structured record that will survive team changes and redesigns.

## Process

### Step 1: Identify Decisions
List every design or implementation choice that affects accessibility:
- Interaction patterns chosen
- Content and language decisions
- Visual design decisions
- What was included and what was deferred
- Tradeoffs made under constraints

### Step 2: Document Each Decision
Using **decision-documentation**, for each decision record:
- Context: what prompted the decision
- Decision: what was chosen
- Alternatives: what was considered and rejected
- Impact: who benefits, who is affected
- Evidence: what supported the decision

### Step 3: Analyse Tradeoffs
Using **tradeoff-analysis**, for any decision where accessibility
was compromised or where user needs conflicted:
- Who benefits from each option
- Who is harmed by each option
- Severity asymmetry (blocked vs friction)
- Remediation plan for excluded users
- Review date

### Step 4: Map to Standards
Using **compliance-mapping**, map each decision to the relevant
WCAG criteria:
- Which criteria does this decision satisfy
- Which criteria does this decision affect
- Are there any conformance risks

## Output

Deliver a feature accessibility decision record:

1. **Feature summary** — what was built and for whom
2. **Decision log** — each decision in the standard format
3. **Tradeoff register** — any tradeoffs with remediation plans
4. **Compliance map** — WCAG criteria coverage and gaps
5. **Open items** — deferred decisions that need future resolution
