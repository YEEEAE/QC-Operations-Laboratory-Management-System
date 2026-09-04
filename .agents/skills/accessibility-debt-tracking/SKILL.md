---
name: accessibility-debt-tracking
description: "Track and manage accessibility debt — known accessibility issues that have been deferred. Use when managing a backlog of accessibility issues, planning remediation, or when accessibility problems are accumulating faster than they're being fixed. Triggers on: accessibility debt, tech debt, known issues, backlog, deferred, we'll fix it later, remediation, accessibility backlog, accumulating issues, regression."
---

# Accessibility Debt Tracking

Track accessibility debt the way you'd track technical debt — as a
known liability with a cost that compounds over time.

## What Is Accessibility Debt

Accessibility debt is every known accessibility issue that exists
in your product but hasn't been fixed. It includes:
- Issues found in audits that were deprioritised
- Tradeoffs where accessibility was deferred
- New features shipped without full accessibility
- Regressions introduced by updates or redesigns
- Known gaps in assistive technology support

## Why It Compounds

Unlike a feature request that just waits, accessibility debt
grows:
- Each new feature built on top of an inaccessible foundation
  inherits the inaccessibility
- Users with disabilities develop workarounds that break when
  you eventually fix things differently than they expect
- Legal exposure increases with time and awareness
- The longer an issue persists, the more expensive it becomes
  to fix (code has grown around it)
- Team knowledge of why the issue exists fades

## Debt Record Format

For each known accessibility issue, track:

**Issue:** clear description of the accessibility barrier
**Severity:** critical (blocks task) / major (significant difficulty) /
minor (friction)
**Who's affected:** specific user groups
**Where:** page, component, or flow
**WCAG criteria:** which success criteria it violates
**Discovered:** date and how (audit, user report, testing)
**Deferred because:** the reason it wasn't fixed immediately
**Workaround:** any temporary alternative for affected users
**Estimated fix effort:** small / medium / large
**Remediation deadline:** when it must be fixed
**Owner:** who is responsible for the fix

## Managing the Debt

### Triage Rules
- **Critical (blocks task):** fix in current sprint, no exceptions
- **Major (significant difficulty):** fix within 30 days
- **Minor (friction):** fix within 90 days
- Any issue older than its deadline gets escalated

### Preventing New Debt
- Accessibility acceptance criteria on every story
- Accessibility check before merge (automated + manual)
- Regression testing for previously fixed issues
- New features cannot ship with critical accessibility debt

### Paying Down Debt
- Allocate a percentage of each sprint to debt reduction
  (10–20% is common)
- Fix debt when you're already touching the component
- Prioritise by: severity × number of users affected
- Celebrate debt reduction — make it visible

### Tracking Regressions
- When a previously fixed issue reappears, it's a regression
- Regressions should be treated as critical by default
- Add automated tests for every fix to prevent recurrence
- Track regression rate as a quality metric

## Assessment Questions

1. Is there a documented list of known accessibility issues?
2. Does each issue have a severity, owner, and deadline?
3. Is accessibility debt being paid down each sprint?
4. Are regressions caught and treated as critical?
5. Is the debt trend improving or worsening over time?
