# QC Design System Maturity Audit — 2026-09-10

## Scope and evidence

Reviewed the approved dark enterprise baseline, the shared Astro UI layer, all token consumers under `src/ui` and `src/pages`, and the local `ui-ux-pro-max` searches for design system, semantic colors, typography, icon semantics, component states, and Astro token implementation. The audit is implementation-focused; it does not change business truth, authorization, state machines, or the approved palette.

## Token inventory

| Layer | Current contract | Status |
| --- | --- | --- |
| Primitive | Canvas, 3 surfaces, 3 borders, 5 text roles, QC green accent, approved semantic hues | Existing / preserved |
| Semantic | Page/panel/raised/popover surfaces, text aliases, focus, success/error aliases | Existing; extended with read-only, disabled, invalid, selected |
| Component | Button, input, card, table, navigation aliases | Added in `tokens.css` |
| Spacing | 4px base rhythm through 80px | Existing; density now supplies table cell contracts |
| Typography | Inter / IBM Plex Sans Arabic, numeric mono | Existing; scale, line-height, and weight aliases added |
| Elevation/radius | 3 shadows, 4 radii | Existing; card/button aliases added |
| Motion | Fast/standard/slow, reduced-motion override | Existing; shared easing/duration aliases added |
| Status | PASS, RELEASED, APPROVED, HOLD, WARNING, FAIL, REVIEW, DRAFT plus stale/read-only coverage | Extended; semantic distinctions preserved |

## Component inventory

Shared primitives are present for Button, IconButton, Card, Badge, StatusBadge, forms, tables, charts, banners, dialogs, feedback states, and shell navigation. Reuse is justified for controls, controlled statuses, data tables, forms, and shell surfaces because they recur across domains. Page-specific panels remain local where structure or business context differs; no new abstraction was introduced for one-off workflow layouts.

## Findings

- High: shared components mixed primitive and semantic tokens, making future palette changes risky. Resolved for buttons, cards, forms, tables, charts, and status badges.
- High: component state contracts were incomplete. Shared button/input/icon-button contracts now cover default, hover, focus, active, disabled, loading, error, and read-only styling; loading remains behavior-driven through `aria-busy` and `disabled`.
- Medium: stale data had no explicit status token. Added `STALE` semantic mapping without conflating it with PASS, RELEASED, or FAIL.
- Medium: table striping, table cell padding, and chart/legend spacing had inline values. Shared contracts now own these repeated values.
- Medium: typography values were repeated as raw rem/px values in shared components. Added a scale and migrated the highest-reuse components.
- Medium: status colors remain approved but several current text/background pairs are below AA contrast; palette change is intentionally not made without owner approval because hue semantics are controlled.
- Low: page-level Astro styles still contain one-off spacing, radius, and white/alpha values. They are tracked as debt, not globally rewritten because page context and print/login treatment differ.

## Explicit state contracts

| State | Shared contract |
| --- | --- |
| Default | Semantic surface, border, text, and control height |
| Hover | Surface/border emphasis without layout shift |
| Focus | 2px tokenized ring with 2px offset |
| Active | Small visual press feedback; no surrounding layout movement |
| Selected | Selected surface/accent indicator; never color-only |
| Disabled | Native disabled semantics, reduced opacity, no action |
| Loading | `aria-busy`, stable layout, spinner/skeleton, duplicate-submit prevention |
| Error | Invalid border + linked inline error / alert summary |
| Warning | Amber semantic status with text label |
| Success | Approved/PASS green, explicitly separate from RELEASED teal |
| Stale | Amber stale token and reload/compare recovery path |
| Read-only | Read-only surface and dashed field boundary where applicable |

## Implemented changes

- Added semantic and component token layers without replacing approved primitive values.
- Added typography, density, focus, motion, disabled, stale, and read-only contracts.
- Migrated shared form controls, buttons, icon buttons, cards, data tables, charts, legends, navigation, and status badges to the contracts.
- Added `STALE` and `READ_ONLY` status API coverage while preserving PASS ≠ RELEASED, APPROVED ≠ PASS, HOLD ≠ FAILURE, and DRAFT ≠ REVIEW.
- Added regression tests for token layers, state contracts, semantic distinctions, and table color indirection.

## Remaining design-system debt

- Page-local CSS still contains repeated `px/rem` spacing and radius values; migration should be batched by template family, not done as a risky global replacement.
- 43 `#fff` occurrences remain in `src`; many are legitimate login/visual asset treatments, but button-like page styles should move to `--text-on-accent`.
- Several approved semantic badge pairs remain below the tested 4.5:1 normal-text target; requires an explicit owner palette decision, not hue unification.
- Chart legend colors remain caller-provided scoped values; callers need a controlled chart palette contract before those values can be centralized.
- Visual verification at 320px/200% zoom, forced colors, reduced motion, RTL, and authenticated workflow states remains environment-dependent.

## Verification

- `pnpm exec vitest run tests/unit/ui/design-system-maturity.test.ts tests/unit/ui/design-token-contract.test.ts tests/unit/ui/visual-token-contract.test.ts tests/unit/ui/visual-contrast.test.ts` — ✅ 4 files / 47 tests.
- `pnpm typecheck` — ✅ 0 errors / 62 existing hints; Node engine warning remains because local Node is `22.22.3` and the project contract is `>=24.20.0 <25`.
- `pnpm test:architecture` — ✅ no Delivery → database/domain violations.
- `pnpm build` — ✅ server/client build; existing Vite chunk-size and dependency warnings remain.
- `git diff --check` — ✅.
- Prettier check — ⚠️ repository config does not infer `.astro` parser; CSS/test warnings are formatting-only and no source formatting was rewritten automatically.
