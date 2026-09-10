# Unified SVG Icons and Operational Copy — Design Spec

**Date:** 2026-09-10  
**Status:** Approved for implementation  
**Scope:** All rendered interface surfaces

## Goal

Replace Unicode navigation and interface glyphs with one local SVG icon system, and remove backend implementation terminology from user-facing presentation while preserving the meaning of server-side authorization.

## Design

### 1. Local icon primitive

Create one `Icon.astro` presentation component backed by a typed semantic icon registry. Every icon will render an inline SVG with:

- `viewBox="0 0 24 24"`
- `currentColor`
- no fill-based decorative glyphs
- `stroke-linecap="round"` and `stroke-linejoin="round"`
- the shared default stroke width `1.8`
- a shared default size of `18px`, with explicit sizes only where the surrounding control requires it

The registry will contain the operational icons currently represented by Unicode: dashboard, tasks, findings, quality records, quarantine, receiving, inspections, settings, laboratory, equipment, calibration, approvals, change requests, reports, AI advisory, administration, users, roles, permissions, scopes, audit, health, backups, documents, notifications, search, account, menu, collapse/expand, sort, and directional link arrows.

The component owns the decorative accessibility behavior (`aria-hidden="true"` by default). Visible labels remain the accessible name for links and buttons. Controls that have no visible label will provide an explicit text `aria-label` independently of the icon.

### 2. Presentation integration

Update the navigation model to use typed semantic icon names rather than arbitrary strings. Replace glyph output in:

- Sidebar navigation and collapse control
- mobile navigation toggle
- global search, notifications, approvals, and user menu
- sort headers and directional “open/view” affordances
- KPI/report links and other rendered UI glyphs found by the contract scan

The expanded sidebar keeps its existing labels. The collapsed sidebar keeps the icon, active indicator, and native `title` tooltip. No authorization or visibility logic moves into the icon layer.

### 3. Operational copy

Presentation-layer wording will describe what the operator can see or do, not how the server implements it. Examples:

- `Search authorized records` → `Search records available to you`
- `authorized read model` → `server-approved view`
- `read model` in visible copy → `current server view`, `available records`, or an equivalent direct operational phrase

Permission meaning remains explicit through phrases such as “available to your account” or “in your permitted scope”. Domain and infrastructure comments/types may retain internal terminology when they are not rendered, but presentation files will be guarded against the banned terms.

### 4. Static contract

Add a focused Vitest contract that scans presentation sources (`src/pages` and `src/ui`) and fails on:

- the known Unicode placeholder/navigation glyph set
- banned backend phrases (`authorized read model`, `authorized read models`, and standalone `read model` wording)
- navigation entries whose icon value is not a semantic icon name
- rendered icon markup outside the shared icon component where the contract can detect it

The test will include positive assertions for the shared SVG contract: one 24×24 viewBox, `currentColor`, consistent stroke attributes, and decorative `aria-hidden` behavior.

### 5. Browser verification

Extend the Playwright coverage for the real rendered shell and public fallback where fixtures permit:

- expanded and collapsed desktop navigation
- mobile drawer open/closed behavior
- hover and keyboard focus visibility
- 320px viewport with no page-level horizontal overflow
- 200% zoom with critical controls reachable
- forced-colors mode with labels and focus still visible
- Chromium checks for icon accessible names, no raw glyphs in rendered presentation, and visible operational copy

When authenticated coverage is fixture-gated, the test must report the skip honestly rather than treating it as a pass. Existing drawer focus containment, Escape, authorization, and responsive contracts remain in force.

## Boundaries and non-goals

- No changes to permissions, scopes, authorization decisions, state machines, domain rules, or database schemas.
- No icon package or CDN dependency.
- No removal of visible labels in favor of icon-only controls.
- No claim of full browser compatibility beyond Chromium evidence actually run.

## Verification plan

Run the focused contract tests first, then `astro check`, lint, build, and the focused Playwright suite against the local production-style server. Record any fixture-gated or environment-blocked checks as partial rather than PASS.
