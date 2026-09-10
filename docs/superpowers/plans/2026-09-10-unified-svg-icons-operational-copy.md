# Unified SVG Icons and Operational Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all rendered Unicode interface glyphs with one local SVG icon primitive, remove backend terminology from presentation copy, and verify the shell across responsive and Chromium accessibility states.

**Architecture:** Add a typed `Icon.astro` presentation primitive with a single semantic path registry and keep all authorization decisions in the existing navigation/page layers. Presentation copy is cleaned only in `src/pages` and `src/ui`; domain/infrastructure terminology remains internal. A static Vitest contract scans presentation sources, while Playwright checks the actual expanded, collapsed, mobile, zoom, hover/focus, forced-colors, and Chromium output.

**Tech Stack:** Astro 4, TypeScript, inline SVG, Vitest, Playwright Chromium.

---

## File map

- Create `src/ui/components/Icon.astro`: typed semantic icon names and the shared 24×24 SVG renderer.
- Modify `src/ui/navigation/navigation.ts`: change `icon: string` to the semantic icon-name union and replace all glyph values.
- Modify `src/ui/shell/Sidebar.astro`, `Topbar.astro`, and `UserMenu.astro`: render the shared component for navigation, menu, search, notification, approval, and collapse controls.
- Modify `src/ui/components/data/SortHeader.astro`, `src/ui/charts/KpiCard.astro`, `src/pages/reports/index.astro`, and any additional presentation files found by the contract scan: replace arrow/sort glyphs with `Icon`.
- Modify `src/pages/dashboard/index.astro`, `src/pages/documents/[documentId]/index.astro`, and `src/pages/change-requests/new.astro`: replace visible backend terminology with direct operational copy.
- Create `tests/unit/ui/icon-and-copy-contract.test.ts`: static icon/copy contract and positive SVG assertions.
- Create or modify `tests/e2e/navigation-icons.spec.ts`: Playwright shell and browser-state coverage, fixture-gated only for authenticated surfaces.

## Task 1: Add the failing static contract

**Files:**
- Create: `tests/unit/ui/icon-and-copy-contract.test.ts`

- [ ] **Step 1: Define the exact forbidden sets and presentation roots.**

Use `readFileSync`/`readdirSync` to recursively collect `src/pages` and `src/ui`, then assert the following exact forbidden strings/characters are absent from those files:

```ts
const bannedTerms = [/authorized read models?/i, /\bread model\b/i];
const placeholderGlyphs = /[⌂✓↳▣⚙◌▦⌁◉⇄▥✦◍◈☰◎⌘♥⛁▤●⌕→←↑↓↕‹⌄]/u;
```

Do not scan `src/modules`, `src/shared`, or comments outside presentation roots; backend terminology may remain internal there.

- [ ] **Step 2: Add contract assertions for navigation data.**

Import `navigationGroups`, flatten the items, and assert every `item.icon` is in the exported semantic icon-name set from `Icon.astro` (or a shared type module if Astro types cannot be imported by Vitest). Assert no value contains a non-ASCII glyph.

- [ ] **Step 3: Run the focused test and confirm RED.**

Run:

```bash
pnpm exec vitest run tests/unit/ui/icon-and-copy-contract.test.ts
```

Expected: failure because current navigation values and rendered presentation files still contain Unicode glyphs/backend wording.

## Task 2: Implement the local SVG icon primitive

**Files:**
- Create: `src/ui/components/Icon.astro`

- [ ] **Step 1: Define the semantic icon union and path registry.**

Use names such as `dashboard`, `tasks`, `findings`, `ncr`, `rca`, `capa`, `quarantine`, `receiving`, `inspections`, `settings`, `laboratory`, `equipment`, `calibration`, `maintenance`, `approvals`, `change-requests`, `reports`, `ai-advisory`, `administration`, `users`, `roles`, `permissions`, `scopes`, `audit`, `health`, `backups`, `documents`, `notifications`, `search`, `account`, `menu`, `chevron-left`, `chevron-down`, `arrow-right`, `sort-ascending`, `sort-descending`, and `sort-none`.

The registry values must be arrays of SVG path `d` strings. Keep each icon in the same 24×24 coordinate space.

- [ ] **Step 2: Render one consistent SVG contract.**

The component must render this shape for every icon:

```astro
<svg
  viewBox="0 0 24 24"
  width={size}
  height={size}
  fill="none"
  stroke="currentColor"
  stroke-width={strokeWidth}
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  focusable="false"
>
  {paths.map((d) => <path d={d} />)}
</svg>
```

Default `size=18` and `strokeWidth=1.8`; allow an explicit size only for controls that need it. Do not use `innerHTML`, external assets, or a second icon renderer.

- [ ] **Step 3: Run the focused contract.**

Run the same Vitest command. Expected: the icon-positive assertions pass, while the source glyph assertions remain RED until integration is complete.

## Task 3: Replace glyphs in the shell and navigation registry

**Files:**
- Modify: `src/ui/navigation/navigation.ts`
- Modify: `src/ui/shell/Sidebar.astro`
- Modify: `src/ui/shell/Topbar.astro`
- Modify: `src/ui/shell/UserMenu.astro`

- [ ] **Step 1: Type navigation icons and replace all values.**

Import the icon-name type and set `icon: IconName`. Map existing glyphs to semantic names without changing IDs, hrefs, capabilities, or visibility logic.

- [ ] **Step 2: Render Sidebar icons through `Icon.astro`.**

Replace text interpolation in `.nav-icon` with `<Icon name={item.icon} />`. Replace the collapse glyph with `<Icon name="chevron-left" />`; keep the existing button `aria-label`, `aria-expanded`, focus behavior, labels, and `title` attributes.

- [ ] **Step 3: Render Topbar/UserMenu icons through `Icon.astro`.**

Replace the mobile menu, search, notification, approval, and user-menu chevron glyphs. Keep visible labels and explicit accessible names on icon-only controls. Decorative SVGs remain `aria-hidden` through the component.

- [ ] **Step 4: Run the static contract and existing UI tests.**

Run:

```bash
pnpm exec vitest run tests/unit/ui/icon-and-copy-contract.test.ts tests/unit/ui/app-shell.test.ts tests/unit/ui/navigation-permissions.test.ts
```

Expected: shell icon assertions pass; remaining failures identify non-shell glyphs.

## Task 4: Replace all remaining rendered glyphs

**Files:**
- Modify: `src/ui/components/data/SortHeader.astro`
- Modify: `src/ui/charts/KpiCard.astro`
- Modify: `src/pages/reports/index.astro`
- Modify any additional file reported by the static contract under `src/pages` or `src/ui`.

- [ ] **Step 1: Replace sort arrows with semantic icons.**

In `SortHeader.astro`, select `sort-ascending`, `sort-descending`, or `sort-none` from the existing sort state and render the icon with `aria-hidden="true"` behavior inherited from `Icon`.

- [ ] **Step 2: Replace directional “open/view” arrows.**

Use `arrow-right` beside existing visible labels such as `Open report` and `View records`; do not remove or replace labels.

- [ ] **Step 3: Replace any other presentation glyphs detected by the contract.**

Do not alter business IDs, status text, mathematical operators in explanatory content, or internal source files unless the characters are actually rendered as interface glyphs.

- [ ] **Step 4: Run the contract to GREEN.**

Run:

```bash
pnpm exec vitest run tests/unit/ui/icon-and-copy-contract.test.ts
```

Expected: no forbidden placeholder glyphs in presentation roots and no navigation icon outside the semantic registry.

## Task 5: Rewrite backend terminology in user-facing presentation

**Files:**
- Modify: `src/pages/dashboard/index.astro`
- Modify: `src/pages/documents/[documentId]/index.astro`
- Modify: `src/pages/change-requests/new.astro`
- Modify any presentation file reported by the banned-term contract.

- [ ] **Step 1: Replace visible read-model wording.**

Use direct operational phrases that preserve authorization meaning, for example:

```text
No trend data is available for this authorized snapshot.
→ No trend data is available for the records available to your account.

The current effective version is read from the authorized document read model.
→ The current effective version comes from the server-approved document view.

resolved server-side through the application read model
→ resolved on the server from the records available to your account
```

- [ ] **Step 2: Keep authorization behavior unchanged.**

Do not change capabilities, permission checks, use cases, query predicates, or server-side data loading. Only rendered copy and presentation comments that the contract scans should change.

- [ ] **Step 3: Run the contract and content review.**

Run:

```bash
pnpm exec vitest run tests/unit/ui/icon-and-copy-contract.test.ts
```

Expected: banned terms are absent from presentation roots and direct copy still communicates account/scope availability.

## Task 6: Add Playwright browser-state verification

**Files:**
- Create or modify: `tests/e2e/navigation-icons.spec.ts`

- [ ] **Step 1: Add public Chromium checks.**

Against `/login`, assert all visible interface SVGs have `viewBox="0 0 24 24"`, `stroke="currentColor"`, `stroke-width="1.8"` (or the explicit approved override), and `aria-hidden="true"`. Assert no rendered text contains the banned terms or placeholder glyphs.

- [ ] **Step 2: Add authenticated expanded/collapsed checks.**

Use the existing `QC_E2E_LOGIN_IDENTITY`/`QC_E2E_PASSWORD` gate. On `/dashboard` in Chromium, assert expanded navigation exposes labels, click the collapse control, assert labels are hidden while links and SVG icons remain visible, then expand and assert labels return. Preserve the existing `aria-expanded` and focus contracts.

- [ ] **Step 3: Add hover/focus and responsive checks.**

At desktop, hover a navigation link and keyboard-focus it; assert computed background/color or outline changes from the default. At 320px, open the mobile drawer and assert the toggle, first destination, labels, and SVG remain inside the viewport with no document overflow.

- [ ] **Step 4: Add 200% zoom and forced-colors checks.**

Set a 1280×900 viewport and `document.documentElement.style.zoom = '2'`; assert no page overflow and critical controls stay inside the viewport. Use `page.emulateMedia({ forcedColors: 'active' })`; assert labels, focusable controls, SVG presence, and visible focus remain available. Do not assert brand colors under forced colors.

- [ ] **Step 5: Run the focused Playwright suite.**

Run:

```bash
pnpm exec playwright test tests/e2e/navigation-icons.spec.ts --project=chromium
```

Expected: public tests run; authenticated tests either pass with the approved fixture or are explicitly skipped with the existing fixture reason. No skip is counted as PASS.

## Task 7: Run full verification and review the diff

**Files:**
- No new files; verify all changed files.

- [ ] **Step 1: Run static and build gates.**

```bash
pnpm exec vitest run tests/unit/ui/icon-and-copy-contract.test.ts tests/unit/ui/app-shell.test.ts tests/unit/ui/navigation-permissions.test.ts
pnpm typecheck
pnpm lint
pnpm build
git diff --check
```

- [ ] **Step 2: Run the existing related Playwright suites.**

```bash
pnpm exec playwright test tests/e2e/mobile-drawer-inert.spec.ts tests/e2e/reflow-320.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/navigation-icons.spec.ts --project=chromium
```

Record passed, failed, and fixture-gated counts separately.

- [ ] **Step 3: Review boundaries.**

Confirm the diff contains no permission/state/domain/database changes, no external icon dependency, no removal of visible labels, and no accidental user-facing backend terminology. Do not commit or push; leave the working tree for the user to review.

- [ ] **Step 4: Update the live mind.**

Add a new dated entry at the top of `.agents/mind/01-mind-latest.md` listing actual files, verification results, fixture/environment limitations, and final status. Do not claim full browser or authenticated PASS if tests were skipped.
