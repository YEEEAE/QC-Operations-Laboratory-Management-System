# Production Verification Gaps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the four UI/runtime gaps found during read-only production verification without weakening authorization, CSP, or controlled-record rules.

**Architecture:** Keep release identity in server-side configuration and render only a sanitized read model from the existing System Health page. Keep mobile behavior in the existing AppLayout client shell. Keep favicon and dotLottie fallback in the shared BaseLayout/SystemBackground presentation layer.

**Tech Stack:** Astro SSR, TypeScript, inline SVG, Vitest, Playwright, PostgreSQL-backed runtime configuration.

---

### Task 1: Release identity read model

**Files:**
- Modify: `src/config/release.ts`
- Modify: `src/config/env.ts`
- Modify: `src/modules/system-health/application/get-system-health.ts`
- Modify: `src/pages/system/health.astro`
- Test: `tests/unit/system-health/release-identity.test.ts`

- [ ] Add a pure formatter that returns `UNVERIFIED` for missing/invalid values and never exposes secrets.
- [ ] Read build identity from server-side environment only and attach a sanitized release section to the System Health view.
- [ ] Render Git SHA, build ID, release ID, environment, and migration head with an explicit verification state.
- [ ] Test complete, missing, malformed, and secret-shaped values.

### Task 2: Mobile drawer trigger and contracts

**Files:**
- Modify: `src/ui/shell/Topbar.astro`
- Modify: `src/ui/layouts/AppLayout.astro`
- Modify: `src/ui/styles/global.css`
- Test: `tests/unit/ui/mobile-drawer-inert.test.ts`
- Test: `tests/e2e/mobile-drawer-inert.spec.ts`

- [ ] Ensure the mobile toggle is visible and has a 40px minimum hit area at `max-width:760px`.
- [ ] Keep `aria-expanded`, `aria-controls`, `inert`, scroll lock, focus containment, Escape, and focus return synchronized.
- [ ] Add an explicit mobile shell contract preventing the desktop collapse state from hiding the mobile trigger.
- [ ] Run static and browser tests; no route authorization changes.

### Task 3: Favicon and safe background fallback

**Files:**
- Add: `public/favicon.svg`
- Modify: `src/ui/layouts/BaseLayout.astro`
- Modify: `src/ui/components/SystemBackground.astro`
- Test: `tests/unit/ui/system-background-contract.test.ts`

- [ ] Add a simple local SVG favicon and explicit `rel=icon` link.
- [ ] Catch dotLottie construction/runtime failure, destroy the renderer, mark the background `data-motion="fallback"`, and retain the CSS canvas background.
- [ ] Avoid CSP changes and avoid logging repeated runtime errors.
- [ ] Test favicon wiring, decorative semantics, reduced motion, and fallback state.

### Task 4: Verification and documentation

**Files:**
- Modify: `audit/2026-09-09-production-ui-audit.md`
- Modify: `.agents/mind/01-mind-latest.md`

- [ ] Run focused tests, `astro check`, lint, architecture tests, build, and `git diff --check`.
- [ ] Run local browser smoke checks at desktop and `320×720`.
- [ ] Record exact results and keep production C-11/C-12 as `NOT VERIFIED` until deployment fixtures exist.
- [ ] Do not commit, push, deploy, or mutate production.
